const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8085;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

const INITIAL_SCORES = [];

function getStoredScores() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveStoredScores(scores) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  scores.sort((a, b) => (b.score || 0) - (a.score || 0));
  const top = scores.slice(0, 100);
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(top, null, 2), 'utf8');
  return top;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API GLOBAL LEADERBOARD ROUTE (Compatible con Hostinger api/leaderboard.php)
  if (reqPath === '/api/leaderboard.php' || reqPath === '/api/leaderboard') {
    if (req.method === 'GET') {
      const scores = getStoredScores();
      const mapped = scores.map((s, idx) => ({
        rank: idx + 1,
        id: s.id || (idx + 1),
        name: s.name || 'JUGADOR',
        score: Number(s.score || 0),
        coins: Number(s.coins || 0),
        world: Number(s.world || 0),
        sub: Number(s.sub || 0),
        is_rev: s.is_rev ? 1 : 0,
        date: s.date || 'Reciente'
      }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ success: true, scores: mapped, total: mapped.length, driver: 'node_json' }));
      return;
    }

    if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk);
      req.on('end', () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          const name = String(body.name || 'AVENTURERO').trim().slice(0, 20) || 'AVENTURERO';
          const scoreVal = Math.max(0, parseInt(body.score, 10) || 0);
          const coinsVal = Math.max(0, parseInt(body.coins, 10) || 0);
          const worldVal = Math.max(0, Math.min(9, parseInt(body.world, 10) || 0));
          const subVal = Math.max(0, Math.min(2, parseInt(body.sub, 10) || 0));
          const isRev = body.is_rev ? 1 : 0;

          const today = new Date();
          const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

          const scores = getStoredScores();
          const newEntry = {
            id: Date.now(),
            name,
            score: scoreVal,
            coins: coinsVal,
            world: worldVal,
            sub: subVal,
            is_rev: isRev,
            date: dateStr
          };

          scores.push(newEntry);
          const saved = saveStoredScores(scores);
          const rank = saved.findIndex(s => s.id === newEntry.id) + 1;

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            rank: rank > 0 ? rank : saved.length,
            id: newEntry.id,
            entry: newEntry
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
        }
      });
      return;
    }
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Security: prevent path traversal outside root
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Prohibido');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 No Encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌴 Servidor Colima Vivo activo en: http://localhost:${PORT}/`);
  console.log(`🏆 API de Récords Globales activa en: http://localhost:${PORT}/api/leaderboard.php`);
});
