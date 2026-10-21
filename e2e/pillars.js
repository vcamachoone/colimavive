/**
 * e2e/pillars.js
 * The 4 validation pillars of Colima Vivo E2E test methodology:
 * 1. 60 FPS Stability and Frametime Jitter Analysis over 180 continuous frames.
 * 2. Zero Console Errors, Runtime Exceptions & Boot Warnings.
 * 3. Parallax Wrap Boundary Visual Seam Detection (Euclidean RGB Delta-E continuity).
 * 4. 100% Cryptographic SHA-256 File Parity between index.html and audited duplicate.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Pillar 1: 60 FPS Stability and Frametime Jitter Analysis over 180 frames.
 * Expected: Mean FPS >= 58.5, Frametime std dev <= 3.5 ms, dropped frames (dt > 25ms) <= 2.
 */
async function verifyFpsStability(cdp, frameCount = 180) {
  const deltas = await cdp.measureFrametimes(frameCount);
  if (!deltas || deltas.length === 0) {
    return {
      pass: false,
      error: 'Failed to record frame deltas from performance.now()',
      metrics: null
    };
  }

  // Exclude initial frame bootstrap warmup delta if needed
  const samples = deltas.slice(1);
  const totalTimeMs = samples.reduce((a, b) => a + b, 0);
  const meanDelta = totalTimeMs / samples.length;
  const meanFps = 1000 / meanDelta;

  const variance = samples.reduce((sum, d) => sum + Math.pow(d - meanDelta, 2), 0) / samples.length;
  const stdDevMs = Math.sqrt(variance);

  let droppedFrames = 0;
  let minDelta = Infinity;
  let maxDelta = -Infinity;

  for (const dt of samples) {
    if (dt > 25.0) droppedFrames++; // frame took > 25ms (less than 40 fps momentary hitch)
    if (dt < minDelta) minDelta = dt;
    if (dt > maxDelta) maxDelta = dt;
  }

  const pass = meanFps >= 58.5 && stdDevMs <= 3.5 && droppedFrames <= 2;

  return {
    pass,
    meanFps: Number(meanFps.toFixed(2)),
    meanDeltaMs: Number(meanDelta.toFixed(2)),
    stdDevMs: Number(stdDevMs.toFixed(2)),
    minDeltaMs: Number(minDelta.toFixed(2)),
    maxDeltaMs: Number(maxDelta.toFixed(2)),
    droppedFrames,
    sampleCount: samples.length,
    error: pass ? null : `Pillar 1 FPS violation: meanFps=${meanFps.toFixed(2)} (expected >=58.5), stdDev=${stdDevMs.toFixed(2)}ms (expected <=3.5ms), dropped=${droppedFrames} (expected <=2)`
  };
}

/**
 * Pillar 2: Zero Console Errors, Runtime Exceptions & Boot Warnings.
 */
async function verifyConsoleErrors(cdp) {
  const exceptions = cdp.exceptions || [];
  const errorLogs = (cdp.consoleLogs || []).filter(l => l.type === 'error');
  const networkErrors = cdp.networkErrors || [];

  // Check DOM boot error element
  const bootWarning = await cdp.evaluate(`
    (() => {
      const el = document.getElementById('cv-boot-warning');
      if (!el || el.hidden) return null;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return null;
      return el.textContent.trim().length > 0 ? el.textContent.trim() : null;
    })()
  `);

  const hasErrors = exceptions.length > 0 || errorLogs.length > 0 || !!bootWarning;

  return {
    pass: !hasErrors,
    exceptions,
    errorLogs,
    networkErrors,
    bootWarning,
    error: hasErrors ?
      `Pillar 2 Console Error: ${exceptions.length} exceptions, ${errorLogs.length} error logs, bootWarning=${bootWarning}` : null
  };
}

/**
 * Pillar 3: Visual Seam Detection across Parallax Wrap Boundaries.
 * Calculates Euclidean RGB Delta-E across adjacent pixel columns at the wrap point.
 * Delta-E formula: sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2)
 */
async function verifyParallaxSeamContinuity(cdp, options = {}) {
  let xLeft = options.xLeft;
  let xRight = options.xRight;

  if (xLeft === undefined || xRight === undefined) {
    if (options.xSeam !== undefined) {
      xLeft = Math.max(0, options.xSeam - 1);
      xRight = options.xSeam;
    } else if (options.cameraX !== undefined) {
      const pSpeed = options.pSpeed || 0.16;
      const loopW = options.loopWidth || 960;
      const bgX = -Math.round((options.cameraX * pSpeed) % loopW);
      if (bgX < 0) {
        const seam = bgX + loopW;
        xLeft = Math.max(0, seam - 1);
        xRight = seam;
      } else if (options.cameraX === 0) {
        // At origin (cameraX === 0), wrap seam boundary is between column 0 and loopW - 1
        xLeft = 0;
        xRight = loopW - 1;
      } else {
        // At exact non-zero wrap multiple, wrap seam is offscreen at 0/loopW; sample adjacent midpoint columns
        const mid = Math.round(loopW / 2);
        xLeft = mid - 1;
        xRight = mid;
      }
    } else {
      // Default: adjacent columns around midpoint
      xLeft = 479;
      xRight = 480;
    }
  }

  const yStart = options.yStart ?? 0;
  const height = options.height ?? 540;
  const maxMeanDeltaE = options.maxMeanDeltaE ?? 35.0;
  const maxPeakDeltaE = options.maxPeakDeltaE ?? 85.0;

  // Extract pixel columns atomically on the exact same animation frame
  const { colLeft, colRight } = await cdp.evaluate(`
    (() => {
      const c = document.getElementById('gameCanvas');
      if (!c) return { colLeft: [], colRight: [] };
      const ctx = c.getContext('2d');
      const imgL = ctx.getImageData(${Math.round(xLeft)}, ${Math.round(yStart)}, 1, ${Math.round(height)}).data;
      const imgR = ctx.getImageData(${Math.round(xRight)}, ${Math.round(yStart)}, 1, ${Math.round(height)}).data;
      const colL = [], colR = [];
      for (let i = 0; i < imgL.length; i += 4) {
        colL.push([imgL[i], imgL[i+1], imgL[i+2], imgL[i+3]]);
        colR.push([imgR[i], imgR[i+1], imgR[i+2], imgR[i+3]]);
      }
      return { colLeft: colL, colRight: colR };
    })()
  `);

  if (!colLeft || !colRight || colLeft.length === 0 || colRight.length === 0) {
    return {
      pass: false,
      error: 'Failed to extract pixel data from canvas columns for seam analysis'
    };
  }

  const deltas = [];
  let peakDeltaE = 0;
  let peakY = -1;

  const compareLen = Math.min(colLeft.length, colRight.length);
  for (let y = 0; y < compareLen; y++) {
    const p1 = colLeft[y];
    const p2 = colRight[y];
    const dr = p1[0] - p2[0];
    const dg = p1[1] - p2[1];
    const db = p1[2] - p2[2];
    const deltaE = Math.sqrt(dr * dr + dg * dg + db * db);
    deltas.push(deltaE);
    if (deltaE > peakDeltaE) {
      peakDeltaE = deltaE;
      peakY = y;
    }
  }

  const meanDeltaE = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const pass = meanDeltaE <= maxMeanDeltaE && peakDeltaE <= maxPeakDeltaE;

  return {
    pass,
    meanDeltaE: Number(meanDeltaE.toFixed(2)),
    peakDeltaE: Number(peakDeltaE.toFixed(2)),
    peakY,
    xLeft,
    xRight,
    evaluatedPixels: compareLen,
    error: pass ? null : `Pillar 3 Visual Seam violation between cols ${xLeft} and ${xRight}: meanDeltaE=${meanDeltaE.toFixed(2)} (limit <= ${maxMeanDeltaE}), peakDeltaE=${peakDeltaE.toFixed(2)} at y=${peakY} (limit <= ${maxPeakDeltaE})`
  };
}

/**
 * Pillar 4: 100% Cryptographic SHA-256 Parity between index.html and release duplicate.
 */
function verifyCryptographicParity(rootPath = '/Volumes/DISCO SSD/dev/Colimavive') {
  const file1 = path.join(rootPath, 'index.html');
  const file2 = path.join(rootPath, 'Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html');

  if (!fs.existsSync(file1)) {
    return { pass: false, error: `Primary file not found: ${file1}` };
  }
  if (!fs.existsSync(file2)) {
    return { pass: false, error: `Duplicate audited file not found: ${file2}` };
  }

  const buf1 = fs.readFileSync(file1);
  const buf2 = fs.readFileSync(file2);

  const hash1 = crypto.createHash('sha256').update(buf1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(buf2).digest('hex');

  const len1 = buf1.length;
  const len2 = buf2.length;

  const lines1 = buf1.toString('utf8').split('\n').length;
  const lines2 = buf2.toString('utf8').split('\n').length;

  const hashMatch = hash1 === hash2;
  const lenMatch = len1 === len2;
  const linesMatch = lines1 === lines2;
  const pass = hashMatch && lenMatch && linesMatch;

  return {
    pass,
    hashIndex: hash1,
    hashDuplicate: hash2,
    byteLengthIndex: len1,
    byteLengthDuplicate: len2,
    lineCountIndex: lines1,
    lineCountDuplicate: lines2,
    error: pass ? null : `Pillar 4 Parity violation: hashMatch=${hashMatch}, lenMatch=${lenMatch} (${len1} vs ${len2}), linesMatch=${linesMatch} (${lines1} vs ${lines2})`
  };
}

module.exports = {
  verifyFpsStability,
  verifyConsoleErrors,
  verifyParallaxSeamContinuity,
  verifyCryptographicParity
};
