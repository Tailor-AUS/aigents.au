import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesizePortalBundle } from './engine/synthesizer.mjs';
import { handleChatQuery } from './engine/chat.mjs';
import { renderBuilderHtml } from './views/builder.mjs';
import { registerCandidate } from './engine/candidate-manager.mjs';

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

function renderApexLandingHtml(jobs, candidate) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aigents.au — Guaranteed Paid Placements for AI-Tooled University Engineers</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070a0f;
      --card-bg: #0f1724;
      --card-border: #1e293b;
      --card-hover: #172236;
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
      overflow-x: hidden;
    }
    .container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
    }
    /* Nav */
    header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 18px 0;
      position: sticky;
      top: 0;
      background: rgba(7, 10, 15, 0.85);
      backdrop-filter: blur(16px);
      z-index: 100;
    }
    .nav-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.03em;
      text-decoration: none;
      color: #ffffff;
    }
    .brand-pill {
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 700;
      text-transform: uppercase;
    }
    .nav-links {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: color 0.2s;
    }
    .nav-link:hover { color: #ffffff; }
    .btn {
      background: var(--accent);
      color: #070a0f;
      font-weight: 700;
      padding: 10px 20px;
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
      opacity: 0.95;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(56, 189, 248, 0.3);
    }
    .btn-emerald {
      background: var(--emerald);
      color: #062016;
    }
    .btn-emerald:hover {
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: none;
    }
    /* Hero */
    .hero {
      padding: 88px 0 60px;
      text-align: center;
      position: relative;
    }
    .hero-glow {
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      height: 400px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .guarantee-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--emerald-glow);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: -0.01em;
    }
    h1 {
      font-size: 52px;
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.035em;
      max-width: 960px;
      margin: 0 auto 24px;
    }
    .hero-sub {
      font-size: 19px;
      color: var(--text-muted);
      max-width: 820px;
      margin: 0 auto 40px;
      line-height: 1.6;
    }
    .hero-ctas {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 56px;
    }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px 20px;
      text-align: center;
    }
    .stat-val {
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      font-family: var(--font-mono);
      margin-bottom: 6px;
    }
    .stat-val.accent { color: var(--accent); }
    .stat-val.emerald { color: var(--emerald); }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 600;
    }
    /* Section */
    .section-block {
      padding: 80px 0;
      border-top: 1px solid var(--card-border);
    }
    .section-header {
      text-align: center;
      max-width: 760px;
      margin: 0 auto 50px;
    }
    .section-eyebrow {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 16px;
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 16px;
      line-height: 1.6;
    }
    /* Two-Sided Grid */
    .two-sided-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .pillar-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .pillar-card.student-card {
      border-top: 4px solid var(--emerald);
    }
    .pillar-card.employer-card {
      border-top: 4px solid var(--accent);
    }
    .pillar-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 14px;
      letter-spacing: -0.02em;
    }
    .feature-list {
      list-style: none;
      margin: 24px 0 32px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 15px;
      color: #cbd5e1;
    }
    .feature-icon {
      font-size: 18px;
      line-height: 1;
      margin-top: 2px;
    }
    /* Portals Showcase */
    .portals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 24px;
    }
    .portal-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 28px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .portal-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      background: var(--card-hover);
      transform: translateY(-2px);
    }
    .portal-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--accent);
      margin-bottom: 16px;
    }
    .portal-company {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }
    .portal-role {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .portal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--card-border);
    }
    /* CTA Box */
    .cta-banner {
      background: radial-gradient(circle at center, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 36, 0.9) 100%);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 20px;
      padding: 56px 40px;
      text-align: center;
      margin-top: 40px;
    }
    .cta-banner h2 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 14px;
      letter-spacing: -0.03em;
    }
    .cta-banner p {
      font-size: 17px;
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto 32px;
    }
    /* Footer */
    footer {
      border-top: 1px solid var(--card-border);
      padding: 48px 0 32px;
      color: #64748b;
      font-size: 14px;
    }
    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    @media (max-width: 768px) {
      h1 { font-size: 36px; }
      .hero-stats { grid-template-columns: 1fr 1fr; }
      .two-sided-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <header>
    <div class="container nav-inner">
      <a href="/" class="brand">
        <span>aigents.au</span>
        <span class="brand-pill">Talent Substrate</span>
      </a>
      <div class="nav-links">
        <a href="#students" class="nav-link">For Students</a>
        <a href="#employers" class="nav-link">For Employers</a>
        <a href="#live-portals" class="nav-link">Active Portals</a>
        <a href="#students" class="btn btn-emerald">Get Guaranteed Wage</a>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="container hero-content">
        <div class="guarantee-badge">
          <span>⚡</span> The Aigents Charter: Every Top-Tier Student Guaranteed a Paid Wage
        </div>
        <h1>We Tool Australia's Sharpest Undergrads with AI Workflows — and Guarantee Their Industry Wage.</h1>
        <p class="hero-sub">No unpaid internships. No retail jobs to pay rent while earning an engineering degree. Aigents.au equips top 1% STEM undergraduates with enterprise AI weapon systems and deploys them to high-impact engineering sprints.</p>
        
        <div class="hero-ctas">
          <a href="#students" class="btn btn-emerald" style="padding: 14px 28px; font-size: 15px;">🎓 Apply for Guaranteed Wage Fellowship</a>
          <a href="#employers" class="btn btn-secondary" style="padding: 14px 28px; font-size: 15px;">🏢 Deploy AI-Tooled Talent in 48h</a>
        </div>

        <div class="hero-stats">
          <div class="stat-card">
            <div class="stat-val emerald">$38–$55/hr</div>
            <div class="stat-label">Guaranteed Student Wage</div>
          </div>
          <div class="stat-card">
            <div class="stat-val accent">ATAR 99+</div>
            <div class="stat-label">Raw Cognitive Horsepower</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">3 Days</div>
            <div class="stat-label">Onboarding Lag (vs 3 Months)</div>
          </div>
          <div class="stat-card">
            <div class="stat-val accent">50%</div>
            <div class="stat-label">Senior Team Drag Absorbed</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Two-Sided Charter -->
    <section id="charter" class="section-block">
      <div class="container">
        <div class="section-header">
          <div class="section-eyebrow">The New Model of Work</div>
          <h2 class="section-title">The End of the Unpaid Internship & The Collapse of the Junior Tax</h2>
          <p class="section-desc">Traditional hiring is broken. Students submit 500 resumes into ATS algorithms while working barista jobs. Employers pay $200k+ for senior engineers who spend half their time wrangling dirty CSVs. We fixed both sides.</p>
        </div>

        <div class="two-sided-grid">
          <!-- Student Side -->
          <div id="students" class="pillar-card student-card">
            <div>
              <div style="color: var(--emerald); font-family: var(--font-mono); font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">For University Students</div>
              <h3 class="pillar-title">Guaranteed Paid Placement</h3>
              <p style="color: var(--text-muted); font-size: 15px;">Never work an unpaid internship or waste your cognitive horsepower. If you have the academic grit, we back you with guaranteed earnings.</p>

              <ul class="feature-list">
                <li class="feature-item">
                  <span class="feature-icon">💰</span>
                  <div><strong>Guaranteed Competitive Wage:</strong> Paid $38–$55/hr directly on high-impact industry placements.</div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">⚡</span>
                  <div><strong>Skip the 500-Person Resume Meat-Grinder:</strong> We bypass HR algorithms and pitch bespoke engineering portals directly to department heads.</div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">🧠</span>
                  <div><strong>Pre-Trained on Enterprise AI Weapon Systems:</strong> Master telemetry pipelines, standards RAG, and agentic simulation loops before you walk through the door.</div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">🎓</span>
                  <div><strong>Accredited Professional Hours:</strong> Fully satisfies university Professional Experience Practice (PEP) requirements.</div>
                </li>
              </ul>
            </div>
            <a href="mailto:fellows@aigents.au?subject=Application%20for%20Aigents%20Paid%20Fellowship" class="btn btn-emerald" style="width: 100%; justify-content: center;">Apply for the Fellowship →</a>
          </div>

          <!-- Employer Side -->
          <div id="employers" class="pillar-card employer-card">
            <div>
              <div style="color: var(--accent); font-family: var(--font-mono); font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">For Engineering Employers</div>
              <h3 class="pillar-title">Deploy AI-Tooled Undergrads</h3>
              <p style="color: var(--text-muted); font-size: 15px;">Senior engineers are too valuable to spend 20 hours a week cleaning sensor data, cross-referencing compliance clauses, or formatting shift logs.</p>

              <ul class="feature-list">
                <li class="feature-item">
                  <span class="feature-icon">🚀</span>
                  <div><strong>Zero Mentorship Drag:</strong> Our cadets arrive equipped with production-grade AI harnesses, delivering senior-grade throughput in week one.</div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">🛡️</span>
                  <div><strong>Complementary Force-Multiplier:</strong> They don't threaten existing staff; they absorb the bottom 50% of grunt work so lead engineers can build.</div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">🔄</span>
                  <div><strong>High-Velocity Sprints:</strong> Deploy talent for flexible 8–12 week vacation sprints or semester co-ops with zero permanent headcount liability.</div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">💎</span>
                  <div><strong>Top 1% Analytical Horsepower:</strong> Every cadet is screened for elite mathematical and engineering rigor (ATAR 98–100 track).</div>
                </li>
              </ul>
            </div>
            <a href="mailto:deploy@aigents.au?subject=Request%20Engineering%20Cadet%20Deployment" class="btn" style="width: 100%; justify-content: center;">Request a Cadet Deployment →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Portals Showcase -->
    <section id="live-portals" class="section-block">
      <div class="container">
        <div class="section-header">
          <div class="section-eyebrow">Real-World Deployments</div>
          <h2 class="section-title">Live Company-Specific Portals</h2>
          <p class="section-desc">Explore live capability portals generated for current real-world Australian engineering vacancies. Each portal features an interactive AIgent, Role Complementarity Matrix, and downloadable 1-page PDF brief.</p>
        </div>

        <div class="portals-grid">
          ${Object.values(jobs).map(j => `
            <div class="portal-card">
              <div>
                <div class="portal-badge">${j.company.slug}.aigents.au</div>
                <div class="portal-company">${j.company.name}</div>
                <div class="portal-role">${j.role.title} (${j.role.location})</div>
                <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px; line-height: 1.5;">
                  ${j.company.mission.slice(0, 140)}...
                </div>
              </div>
              <div class="portal-actions">
                <a href="/p/${j.company.slug}" class="btn" style="flex: 1; justify-content: center; font-size: 13px;">View Live Portal →</a>
                <a href="/p/${j.company.slug}/brief" target="_blank" class="btn btn-secondary" style="font-size: 13px;">📄 1-Page PDF</a>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="cta-banner">
          <h2>Ready to Deploy an AI-Tooled Cadet to Your Engineering Backlog?</h2>
          <p>Whether you need telemetry pipelines built, standards compliance automated, or simulation scripts swept, our ATAR 99+ cadets hit the ground running with zero training lag.</p>
          <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
            <a href="mailto:deploy@aigents.au?subject=Deploy%20Engineering%20Cadet" class="btn" style="padding: 14px 28px; font-size: 15px;">Book 15-Min Technical Consultation</a>
            <a href="/p/minres" class="btn btn-secondary" style="padding: 14px 28px; font-size: 15px;">Inspect Flagship MinRes Demo</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container footer-inner">
      <div>
        <strong>aigents.au</strong> — Sovereign Australian Engineering Talent Substrate. Apache 2.0 Open Source.
      </div>
      <div>
        Guaranteed wages for students • High-velocity AI workflows for industry.
      </div>
    </div>
  </footer>

</body>
</html>`;
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

// Start Server
loadData().then(({ candidate, jobs }) => {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
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

    // Student Fellowship CV/AIgent Studio
    if (url.pathname === '/build') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderBuilderHtml());
      return;
    }

    // Candidate Registration API
    if (req.method === 'POST' && url.pathname === '/api/candidate/register') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          const registered = await registerCandidate(body);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(registered));
        } catch (err) {
          console.error('[aigents.au] Error registering candidate:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to register candidate profile' }));
        }
      });
      return;
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

    // 5. Apex Landing Page (Guaranteed Wage Charter + Two-Sided Platform)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderApexLandingHtml(jobs, candidate));
  });

  server.listen(PORT, () => {
    console.log(`[aigents.au] Engine live on http://localhost:${PORT}`);
  });
});
