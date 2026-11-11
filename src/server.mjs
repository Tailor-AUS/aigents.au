import http from 'node:http';
import { renderApexLandingHtml } from './views/landing.mjs';
import { createStore } from './engine/store.mjs';
import { Platform } from './engine/platform.mjs';
import { createPlatformRoutes } from './platform-routes.mjs';

const PORT = process.env.PORT || 3000;

// All account writes use shared durable storage. Fail startup if it is unavailable.
const platform = new Platform(createStore(), { teamAccessKey: process.env.TEAM_ACCESS_KEY });
const platformRoutes = createPlatformRoutes(platform);

platform.ready().then(() => {
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000');

    let url;
    try { url = new URL(req.url, `http://${req.headers.host}`); }
    catch { res.writeHead(400); res.end('Invalid request'); return; }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (hostname.endsWith('.aigents.au') && hostname !== 'www.aigents.au') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 'Page not found');
      return;
    }

    if (await platformRoutes(req, res, url)) return;

    if (url.pathname !== '/' || (req.method !== 'GET' && req.method !== 'HEAD')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 'Page not found');
      return;
    }

    // Public homepage
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : renderApexLandingHtml());
  });

  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  server.listen(PORT, () => {
    console.log(`[aigents.au] Engine live on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('[aigents.au] Startup failed:', error.name, error.code || error.message);
  process.exitCode = 1;
});
