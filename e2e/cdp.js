/**
 * e2e/cdp.js
 * Zero-dependency Chrome DevTools Protocol (CDP) client and headless browser controller.
 * Uses native Node.js built-ins: http, child_process, and global WebSocket (Node 22+ / 24+).
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CHROME_PATH = process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

class CdpSession {
  constructor(options = {}) {
    this.port = options.port || 9494;
    this.url = options.url || 'http://localhost:8085';
    this.headless = options.headless !== false;
    this.userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'colima-cdp-'));
    this.chromeProcess = null;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.exceptions = [];
    this.networkErrors = [];

    this._cleanExit = () => this.kill();
    process.once('exit', this._cleanExit);
    process.once('SIGINT', this._cleanExit);
    process.once('SIGTERM', this._cleanExit);
  }

  async launch() {
    const flags = [
      this.headless ? '--headless=new' : '--headless=new',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.userDataDir}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-first-run',
      '--window-size=1280,920',
      '--autoplay-policy=no-user-gesture-required',
      'about:blank'
    ];

    if (!fs.existsSync(CHROME_PATH)) {
      throw new Error(`Google Chrome binary not found at: ${CHROME_PATH}`);
    }

    this.chromeProcess = spawn(CHROME_PATH, flags, {
      stdio: 'ignore',
      detached: process.platform !== 'win32'
    });
    this.chromeProcess.on('error', (err) => {
      console.error('[CDP] Chrome process error:', err);
    });

    // Wait for CDP debugging endpoint to become ready
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${this.port}/json`, (res) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              reject(new Error(`Status: ${res.statusCode}`));
            }
          });
          req.on('error', reject);
        });
        connected = true;
        break;
      } catch (err) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    if (!connected) {
      this.kill();
      throw new Error(`Failed to connect to Chrome DevTools endpoint on port ${this.port}`);
    }

    // Retrieve active page target
    const targets = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${this.port}/json`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    const page = targets.find(t => t.type === 'page');
    if (!page || !page.webSocketDebuggerUrl) {
      this.kill();
      throw new Error('No inspectable page target found in Chrome DevTools endpoint');
    }

    // Connect WebSocket
    this.ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          cb(msg);
        } else if (msg.method) {
          this.handleEvent(msg.method, msg.params);
        }
      } catch (e) {
        console.error('[CDP] Error parsing message:', e);
      }
    };

    // Enable essential domains
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Log.enable');
  }

  handleEvent(method, params) {
    if (method === 'Runtime.consoleAPICalled') {
      const text = (params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
      this.consoleLogs.push({ type: params.type, text, timestamp: params.timestamp });
    } else if (method === 'Runtime.exceptionThrown') {
      const details = params.exceptionDetails || {};
      const desc = details.exception?.description || details.text || 'Unknown exception';
      this.exceptions.push({
        text: desc,
        url: details.url,
        line: details.lineNumber,
        column: details.columnNumber
      });
    } else if (method === 'Log.entryAdded' && params.entry) {
      if (params.entry.level === 'error') {
        if (params.entry.source === 'network') {
          this.networkErrors.push({
            text: params.entry.text,
            url: params.entry.url
          });
        } else {
          this.exceptions.push({
            text: params.entry.text,
            source: params.entry.source,
            url: params.entry.url
          });
        }
      }
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket is not open'));
      }
      const id = this.msgId++;
      this.callbacks.set(id, (res) => {
        if (res.error) {
          reject(new Error(`CDP Error (${method}): ${res.error.message || JSON.stringify(res.error)}`));
        } else {
          resolve(res.result);
        }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url = this.url) {
    this.consoleLogs = [];
    this.exceptions = [];
    this.networkErrors = [];
    await this.send('Page.navigate', { url });
    await this.waitForLoad();
  }

  async waitForLoad(timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const readyState = await this.evaluate('document.readyState');
      if (readyState === 'complete') {
        await new Promise(r => setTimeout(r, 400));
        return;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error('Timeout waiting for page to load');
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  async captureScreenshot(format = 'png') {
    const res = await this.send('Page.captureScreenshot', { format });
    return Buffer.from(res.data, 'base64');
  }

  /**
   * Samples a vertical column of pixels [yStart, yStart + height] at horizontal coordinate x from gameCanvas.
   * Returns array of [r, g, b, a] tuples.
   */
  async getCanvasPixelColumn(x, yStart = 0, height = 540) {
    const expr = `
      (() => {
        const c = document.getElementById('gameCanvas');
        if (!c) return null;
        const ctx = c.getContext('2d');
        const img = ctx.getImageData(${Math.round(x)}, ${Math.round(yStart)}, 1, ${Math.round(height)});
        const pixels = [];
        for (let i = 0; i < img.data.length; i += 4) {
          pixels.push([img.data[i], img.data[i+1], img.data[i+2], img.data[i+3]]);
        }
        return pixels;
      })()
    `;
    return await this.evaluate(expr);
  }

  /**
   * Samples high-resolution frame times over N continuous requestAnimationFrame ticks.
   */
  async measureFrametimes(frameCount = 180) {
    const expr = `
      new Promise(resolve => {
        const deltas = [];
        let count = 0;
        let last = performance.now();
        function tick(now) {
          deltas.push(now - last);
          last = now;
          count++;
          if (count >= ${frameCount}) {
            resolve(deltas);
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      })
    `;
    return await this.evaluate(expr);
  }

  kill() {
    if (this._cleanExit) {
      process.removeListener('exit', this._cleanExit);
      process.removeListener('SIGINT', this._cleanExit);
      process.removeListener('SIGTERM', this._cleanExit);
      this._cleanExit = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    if (this.chromeProcess) {
      try {
        if (process.platform !== 'win32' && this.chromeProcess.pid) {
          process.kill(-this.chromeProcess.pid, 'SIGKILL');
        } else {
          this.chromeProcess.kill('SIGKILL');
        }
      } catch (e) {}
      this.chromeProcess = null;
    }
    if (this.userDataDir && fs.existsSync(this.userDataDir)) {
      try {
        fs.rmSync(this.userDataDir, { recursive: true, force: true });
      } catch (e) {}
      this.userDataDir = null;
    }
  }
}

module.exports = { CdpSession, CHROME_PATH };
