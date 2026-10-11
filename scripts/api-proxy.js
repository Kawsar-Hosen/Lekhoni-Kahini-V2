// Local dev proxy for Expo Web: forwards to the Cloudflare Worker with open
// CORS headers, because the worker only allows the admin origin on preflights
// (and any request with an `Authorization` header needs a preflight).
//
// Usage (separate terminal, only needed for Writer Studio on Expo Web):
//   pnpm proxy
// Native (Expo Go / builds) talks to the worker directly — no proxy needed.
const http = require('http');
const https = require('https');

const TARGET = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';
const PORT = 8091;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const target = new URL(req.url, TARGET);
    const headers = { accept: 'application/json' };
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    const proxyReq = https.request(
      target,
      { method: req.method, headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, {
          'content-type': proxyRes.headers['content-type'] || 'application/json',
        });
        proxyRes.pipe(res);
      },
    );
    proxyReq.on('error', () => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end('{"error":"proxy"}');
    });
    if (body.length) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Lekhoni API proxy on http://localhost:${PORT} -> ${TARGET}`);
});
