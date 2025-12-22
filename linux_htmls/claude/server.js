#!/usr/bin/env node
// Claude Components - Test Backend Server
// Run with: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const STATIC_DIR = __dirname;

// Simple file system state
const virtualFS = {
  '/home/user': {},
  packages: []
};

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// API handlers
const api = {
  'GET /api/health': () => ({ status: 'ok', version: '1.0.0' }),

  'POST /api/chat': async (body) => ({
    response: `Claude received: "${body.message}"`,
    context: body.context?.length || 0
  }),

  'POST /api/run': async (body) => {
    try {
      // Simulate code execution (safe - just captures console.log)
      const logs = [];
      const code = body.code.replace(/console\.log/g, '((...args) => logs.push(args.join(" ")))');
      eval(code);
      return { output: logs.join('\n'), success: true };
    } catch (e) {
      return { error: e.message, success: false };
    }
  },

  'POST /api/npm/install': async (body) => {
    virtualFS.packages.push(body.package);
    return {
      success: true,
      package: body.package,
      version: '1.0.0',
      installed: virtualFS.packages
    };
  },

  'GET /api/fs/list': (body, query) => {
    const dir = query.path || '/';
    return { path: dir, files: Object.keys(virtualFS).filter(k => k.startsWith(dir)) };
  },

  'POST /api/fs/write': async (body) => {
    virtualFS[body.path] = body.content;
    return { success: true, path: body.path };
  },

  'GET /api/fs/read': (body, query) => {
    const content = virtualFS[query.path];
    if (content !== undefined) return { content };
    return { error: 'File not found' };
  }
};

// Request handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const query = Object.fromEntries(url.searchParams);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API routes
  const apiKey = `${req.method} ${pathname}`;
  if (api[apiKey]) {
    try {
      const body = req.method === 'POST' ? await parseBody(req) : {};
      const result = await api[apiKey](body, query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(STATIC_DIR, filePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    return res.end(content);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Claude Components Test Server         ║
╠════════════════════════════════════════╣
║  http://localhost:${PORT}                 ║
║                                        ║
║  Routes:                               ║
║    /           → index.html            ║
║    /test.html  → Component tests       ║
║    /api/*      → Backend API           ║
╚════════════════════════════════════════╝
  `);
});
