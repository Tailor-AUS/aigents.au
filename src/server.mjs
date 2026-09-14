import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesizePortalBundle } from './engine/synthesizer.mjs';
import { handleChatQuery } from './engine/chat.mjs';
import { renderApexLandingHtml } from './views/landing.mjs';
import { createStore } from './engine/store.mjs';
import { Platform } from './engine/platform.mjs';
import { createPlatformRoutes } from './platform-routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;

// Load candidates and jobs into memory
async function loadData() {
  const candidatePath = path.join(ROOT_DIR, 'data', 'candidates', 'kate-corcoran.json');
  const candidate = JSON.parse(await fs.readFile(candidatePath, 'utf8'));

  const jobsDir = path.join(ROOT_DIR, 'data', 'jobs');
  const jobFiles = await fs.readdir(jobsDir);
  const jobs = {};

  for (const file of jobFiles) {
    if (file.endsWith('.json')) {
      const jobData = JSON.parse(await fs.readFile(path.join(jobsDir, file), 'utf8'));
      jobs[jobData.company.slug] = jobData;
    }
  }

  return { candidate, jobs };
}

function renderPortalHtml(bundle) {
  const { hero, roleContext, complementarityMatrix, candidateSnapshot, interactiveQna, plgBanner, meta, qrDataUri } = bundle;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hero.eyebrow} | ${meta.roleTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070a0f;
      --card-bg: #0f1724;
      --card-border: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.15);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.15);
      --font: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }
    header {
      border-bottom: 1px solid var(--card-border);
      padding: 18px 0;
      position: sticky;
      top: 0;
      background: rgba(7, 10, 15, 0.85);
      backdrop-filter: blur(14px);
      z-index: 50;
    }
    .header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.02em;
    }
    .brand-tag {
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-mono);
      text-transform: uppercase;
    }
    .btn {
      background: var(--accent);
      color: #070a0f;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }
    .btn:hover {
      opacity: 0.92;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(56, 189, 248, 0.25);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #f8fafc;
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      box-shadow: none;
    }
    .hero {
      padding: 64px 0 40px;
      text-align: center;
    }
    .eyebrow {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--accent);
      background: var(--accent-glow);
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid rgba(56, 189, 248, 0.25);
      margin-bottom: 24px;
    }
    h1 {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.18;
      margin-bottom: 18px;
    }
    .hero-sub {
      font-size: 17px;
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto 36px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 36px;
    }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      text-align: left;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text);
      font-family: var(--font-mono);
      margin-bottom: 4px;
    }
    .metric-label {
      font-size: 13px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .section-desc {
      color: var(--text-muted);
      margin-bottom: 28px;
      font-size: 15px;
    }
    .section-block {
      padding: 56px 0;
      border-top: 1px solid var(--card-border);
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
    }
    .matrix-table th, .matrix-table td {
      padding: 18px 20px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
      vertical-align: top;
    }
    .matrix-table th {
      background: rgba(255, 255, 255, 0.02);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .tool-pill {
      display: inline-block;
      background: rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: var(--font-mono);
      margin: 2px 4px 2px 0;
    }
    .qna-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .qna-question {
      font-weight: 700;
      font-size: 16px;
      color: var(--accent);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qna-answer {
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.6;
    }
    /* Live Chat Box */
    .chat-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-top: 24px;
    }
    .chat-history {
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-msg {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      max-width: 85%;
    }
    .chat-msg.user {
      align-self: flex-end;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #f8fafc;
    }
    .chat-msg.agent {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      color: #cbd5e1;
    }
    .chat-input-row {
      display: flex;
      gap: 10px;
    }
    .chat-input {
      flex: 1;
      background: #070a0f;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: #f8fafc;
      padding: 12px 16px;
      font-size: 14px;
      font-family: inherit;
    }
    .chat-input:focus {
      outline: none;
      border-color: var(--accent);
    }
    .plg-footer-banner {
      background: linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(7, 10, 15, 0) 100%);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 16px;
      padding: 36px;
      text-align: center;
      margin: 64px 0;
    }
    .plg-footer-banner h3 {
      font-size: 22px;
      margin-bottom: 10px;
      font-weight: 800;
    }
    .plg-footer-banner p {
      color: var(--text-muted);
      max-width: 650px;
      margin: 0 auto 20px;
      font-size: 14px;
    }
    .footer {
      padding: 32px 0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
      border-top: 1px solid var(--card-border);
    }
  </style>
</head>
<body>

  <header>
    <div class="container header-inner">
      <div class="brand-badge">
        <a href="/" style="text-decoration: none; color: #ffffff; display: flex; align-items: center; gap: 8px;">
          <span>aigents.au</span>
          <span class="brand-tag">Talent Substrate</span>
        </a>
      </div>
      <div style="display: flex; gap: 10px;">
        <a href="/p/${meta.slug}/brief" target="_blank" class="btn btn-secondary">📄 1-Page PDF Brief</a>
        <a href="#matrix" class="btn">View Matrix</a>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="eyebrow">${roleContext.roleTitle} — High-Impact Placement Brief</div>
      <h1>${hero.headline}</h1>
      <p class="hero-sub">${hero.subheadline}</p>

      <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px;">
        <a href="#chat-section" class="btn">Ask Kate's Technical AIgent 💬</a>
        <a href="/p/${meta.slug}/brief" target="_blank" class="btn btn-secondary">Download 1-Page Executive PDF</a>
      </div>

      <div class="metrics-grid">
        ${hero.metrics.map(m => `
          <div class="metric-card">
            <div class="metric-value">${m.value}</div>
            <div class="metric-label">${m.label}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <section id="matrix" class="section-block">
      <h2 class="section-title">The Role Complementarity Matrix</h2>
      <p class="section-desc">Senior engineers shouldn't spend 20 hours a week wrangling sensor data or cross-referencing standards. Here is how Kate absorbs operational friction from Day 1:</p>

      <table class="matrix-table">
        <thead>
          <tr>
            <th style="width: 25%;">Advertised Responsibility</th>
            <th style="width: 35%;">Existing Team Bottleneck</th>
            <th style="width: 40%;">How Kate + AI Solves It</th>
          </tr>
        </thead>
        <tbody>
          ${complementarityMatrix.map(row => `
            <tr>
              <td><strong>${row.advertisedRequirement}</strong></td>
              <td style="color: var(--text-muted);">${row.teamStrain}</td>
              <td>
                <div style="font-weight: 700; color: var(--accent); margin-bottom: 4px;">${row.candidateSolution.workflowName}</div>
                <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 8px;">${row.candidateSolution.howItWorks}</div>
                <div>${row.candidateSolution.toolsUsed.map(t => `<span class="tool-pill">${t}</span>`).join('')}</div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section class="section-block">
      <h2 class="section-title">Candidate Profile & Academic Excellence</h2>
      <p class="section-desc">Uncapped analytical horsepower backed by top-percentile academic distinction.</p>

      <div class="metrics-grid" style="margin-top: 0; margin-bottom: 24px;">
        <div class="metric-card">
          <div class="metric-value">${candidateSnapshot.tier}</div>
          <div class="metric-label">ATAR Academic Rank (Top 1%)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">First Class</div>
          <div class="metric-label">${candidateSnapshot.education.degree}</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">Dean's List</div>
          <div class="metric-label">Engineering Commendation</div>
        </div>
      </div>

      <div class="section-title" style="font-size: 18px; margin-top: 32px;">Verified Proof Projects</div>
      <div style="margin-top: 16px;">
        ${candidateSnapshot.proofProjects.map(p => `
          <div class="qna-card" style="margin-bottom: 12px;">
            <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">${p.name}</div>
            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">${p.summary}</div>
            <div style="font-size: 12px; font-family: var(--font-mono); color: var(--emerald);">⚡ Impact: ${p.impact}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <section id="chat-section" class="section-block">
      <h2 class="section-title">Interactive AIgent Technical Brief</h2>
      <p class="section-desc">Ask any technical, procedural, or operational question to Kate's AI agent:</p>

      <div class="chat-box">
        <div class="chat-history" id="chatHistory">
          <div class="chat-msg agent">
            <strong>Kate's AIgent:</strong> Hello! I am trained on Kate Corcoran's verified engineering projects, coursework, and AI workflows. Ask me anything about how Kate can solve ${meta.companyName}'s telemetry, compliance, or simulation challenges.
          </div>
        </div>
        <form class="chat-input-row" id="chatForm" onsubmit="submitQuestion(event)">
          <input type="text" id="chatInput" class="chat-input" placeholder="e.g. How does Kate parse telemetry logs? or What standards has she worked with?" required autocomplete="off" />
          <button type="submit" class="btn">Send Question</button>
        </form>
      </div>

      <div style="margin-top: 32px;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--text-muted);">Quick-Answer FAQ Bank:</h3>
        ${interactiveQna.map(qna => `
          <div class="qna-card">
            <div class="qna-question">
              <span>💬</span> ${qna.question}
            </div>
            <div class="qna-answer">${qna.answer}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <div class="plg-footer-banner">
      <h3>${plgBanner.title}</h3>
      <p>${plgBanner.description}</p>
      <a href="${plgBanner.ctaUrl}" class="btn" style="background: white; color: #070a0f;">${plgBanner.ctaText} →</a>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      Bespoke Capability Dossier generated by <strong>aigents.au</strong> for ${meta.companyName}.
    </div>
  </footer>

  <script>
    async function submitQuestion(e) {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const query = input.value.trim();
      if (!query) return;

      const history = document.getElementById('chatHistory');
      
      const userDiv = document.createElement('div');
      userDiv.className = 'chat-msg user';
      userDiv.innerText = query;
      history.appendChild(userDiv);
      input.value = '';

      const agentDiv = document.createElement('div');
      agentDiv.className = 'chat-msg agent';
      agentDiv.innerHTML = '<em>Thinking...</em>';
      history.appendChild(agentDiv);
      history.scrollTop = history.scrollHeight;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: '${meta.slug}', query: query })
        });
        const data = await res.json();
        agentDiv.innerHTML = '<strong>Kate\\'s AIgent:</strong> ' + data.answer;
      } catch (err) {
        agentDiv.innerText = 'Unable to connect to AIgent. Please try again.';
      }
      history.scrollTop = history.scrollHeight;
    }
  </script>

</body>
</html>`;
}

// All account writes use shared durable storage. Fail startup if it is unavailable.
const platform = new Platform(createStore(), { teamAccessKey: process.env.TEAM_ACCESS_KEY });
const platformRoutes = createPlatformRoutes(platform);
Promise.all([loadData(), platform.ready()]).then(([{ candidate, jobs }]) => {
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    let url;
    try { url = new URL(req.url, `http://${req.headers.host}`); }
    catch { res.writeHead(400); res.end('Invalid request'); return; }
    if (await platformRoutes(req, res, url)) return;
    const host = req.headers.host || '';

    // Extract slug from subdomain (e.g. minres.aigents.au)
    let slug = null;
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      slug = parts[0].toLowerCase();
    }

    // Fallback to path-based matching: /p/:slug or /portal/:slug
    const match = url.pathname.match(/^\/(?:p|portal)\/([a-z0-9-]+)(?:\/(brief))?/);
    let isBrief = false;
    if (match) {
      slug = match[1];
      isBrief = match[2] === 'brief';
    }

    // 1. Interactive AIgent Chat API
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          const targetSlug = body.slug || Object.keys(jobs)[0];
          const targetJob = jobs[targetSlug] || Object.values(jobs)[0];
          const bundle = await synthesizePortalBundle(targetJob, candidate);
          const reply = handleChatQuery(body.query, bundle);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ reply: reply.answer, answer: reply.answer, source: reply.source }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }

    // 2. Outbound Packet API
    if (url.pathname.startsWith('/api/packet/')) {
      const requestedSlug = url.pathname.split('/')[3];
      if (jobs[requestedSlug]) {
        const bundle = await synthesizePortalBundle(jobs[requestedSlug], candidate);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(bundle.outboundPacket, null, 2));
        return;
      }
    }

    // 3. Render 1-Page PDF/HTML Printable Brief
    if (slug && jobs[slug] && isBrief) {
      const bundle = await synthesizePortalBundle(jobs[slug], candidate);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(bundle.briefHtml);
      return;
    }

    // 4. Render Interactive Portal
    if (slug && jobs[slug]) {
      const bundle = await synthesizePortalBundle(jobs[slug], candidate);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderPortalHtml(bundle));
      return;
    }

    if (url.pathname !== '/' || req.method !== 'GET') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Page not found');
      return;
    }
    // Public homepage
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderApexLandingHtml(jobs, candidate));
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
