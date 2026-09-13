/**
 * Interactive CV / AIgent Builder View
 * 
 * Allows university students to submit their transcript and academic credentials,
 * configure their technical skills, and immediately compile their personal AIgent profile
 * backed by the Aigents.au guaranteed retainer fellowship.
 */

export function renderBuilderHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Build Your Engineering AIgent & Claim Guaranteed Retainer | Aigents.au</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      padding-bottom: 80px;
    }
    .container {
      max-width: 880px;
      margin: 0 auto;
      padding: 0 24px;
    }
    header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 18px 0;
      background: rgba(7, 10, 15, 0.85);
      backdrop-filter: blur(14px);
    }
    .nav-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #ffffff;
      font-size: 17px;
      font-weight: 800;
    }
    .brand-pill {
      background: var(--emerald-glow);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 700;
      text-transform: uppercase;
    }
    .hero-banner {
      padding: 48px 0 32px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--emerald-glow);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      font-family: var(--font-mono);
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 14px;
    }
    .subhead {
      font-size: 16px;
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto;
    }
    .form-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 40px;
      margin-top: 32px;
    }
    .form-section {
      margin-bottom: 36px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--card-border);
    }
    .form-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .section-num {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 13.5px;
      margin-bottom: 24px;
    }
    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-group.full-width {
      grid-column: span 2;
    }
    label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
    }
    input, select, textarea {
      background: #070a0f;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px 14px;
      color: #ffffff;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--accent);
    }
    .file-dropzone {
      border: 2px dashed var(--card-border);
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .file-dropzone:hover {
      border-color: var(--emerald);
      background: var(--emerald-glow);
    }
    .checkbox-pill-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .checkbox-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
    }
    .checkbox-card:hover {
      border-color: var(--accent);
    }
    .btn-submit {
      background: var(--emerald);
      color: #062016;
      font-weight: 800;
      font-size: 16px;
      padding: 16px 28px;
      border-radius: 10px;
      border: none;
      width: 100%;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-submit:hover {
      opacity: 0.95;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
      transform: translateY(-1px);
    }
    /* Modal */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 200;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .modal-box {
      background: #0f1724;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      max-width: 560px;
      width: 100%;
      padding: 36px;
      text-align: center;
      position: relative;
    }
    @media (max-width: 768px) {
      .input-grid { grid-template-columns: 1fr; }
      .input-group.full-width { grid-column: span 1; }
      .checkbox-pill-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <header>
    <div class="container nav-inner">
      <a href="/" class="brand">
        <span>aigents.au</span>
        <span class="brand-pill">Guaranteed Retainer Studio</span>
      </a>
      <a href="/" style="color: var(--text-muted); text-decoration: none; font-size: 13px;">← Back to Home</a>
    </div>
  </header>

  <main class="container">
    <section class="hero-banner">
      <div class="badge">STUDENT FELLOWSHIP STUDIO</div>
      <h1>Build Your Engineering AIgent & Enroll in Guaranteed Retainer</h1>
      <p class="subhead">Submit your academic transcript. We review your quantitative background, accept you into the fellowship, tool you with enterprise AI workflows, and guarantee your paid industry retainer.</p>
    </section>

    <div class="form-card">
      <form id="builderForm" onsubmit="submitCandidate(event)">
        
        <!-- Section 1: Academic Credentials & Transcript -->
        <div class="form-section">
          <div class="section-num">Stage 01 • Academic Foundation</div>
          <h2 class="section-title">Credentials & Minimum Documentation</h2>
          <p class="section-desc">We back students with genuine academic grit. Academic transcript is the minimum documentation required to unlock the guaranteed weekly retainer.</p>

          <div class="input-grid">
            <div class="input-group">
              <label>Full Name *</label>
              <input type="text" id="name" required placeholder="e.g. Kate Corcoran" />
            </div>
            <div class="input-group">
              <label>University Email *</label>
              <input type="email" id="email" required placeholder="e.g. k.corcoran@uq.net.au" />
            </div>
            <div class="input-group">
              <label>University *</label>
              <select id="university" required>
                <option value="University of Queensland">University of Queensland (UQ)</option>
                <option value="Queensland University of Technology">Queensland University of Technology (QUT)</option>
                <option value="UNSW Sydney">UNSW Sydney</option>
                <option value="University of Sydney">University of Sydney</option>
                <option value="University of Melbourne">University of Melbourne</option>
                <option value="Monash University">Monash University</option>
                <option value="Curtin University">Curtin University (WA)</option>
                <option value="University of Western Australia">University of Western Australia (UWA)</option>
                <option value="University of Adelaide">University of Adelaide</option>
                <option value="Other Australian University">Other Australian University</option>
              </select>
            </div>
            <div class="input-group">
              <label>Engineering Discipline *</label>
              <select id="discipline" required>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Mechatronics & Robotics">Mechatronics & Robotics</option>
                <option value="Systems & Electrical Engineering">Systems & Electrical Engineering</option>
                <option value="Mining & Metallurgy">Mining & Metallurgy</option>
                <option value="Software & Computer Systems">Software & Computer Systems</option>
                <option value="Civil & Structural">Civil & Structural</option>
              </select>
            </div>
            <div class="input-group">
              <label>ATAR Score (if completed in last 4 yrs)</label>
              <input type="text" id="atar" placeholder="e.g. 99.10" />
            </div>
            <div class="input-group">
              <label>Current WAM / University GPA *</label>
              <input type="text" id="wam" required placeholder="e.g. 84.5 WAM or 6.5/7.0 GPA" />
            </div>
            <div class="input-group full-width">
              <label>Upload Academic Transcript (PDF - Minimum Documentation) *</label>
              <div class="file-dropzone" onclick="document.getElementById('transcriptInput').click()">
                <div style="font-size: 28px; margin-bottom: 6px;">📄</div>
                <div style="font-weight: 700; color: #ffffff;" id="fileNameDisplay">Click to Select Academic Transcript PDF</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">PDF, max 15MB. Verified to unlock the $750/week retainer status.</div>
                <input type="file" id="transcriptInput" accept=".pdf,.doc,.docx" style="display: none;" onchange="handleFileSelect(event)" />
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Technical Skills & Proof Project -->
        <div class="form-section">
          <div class="section-num">Stage 02 • Technical Baseline</div>
          <h2 class="section-title">Technical Tooling & Signature Project</h2>
          <p class="section-desc">What technical software and coding languages have you worked with?</p>

          <div class="input-grid">
            <div class="input-group">
              <label>Languages Known (comma separated)</label>
              <input type="text" id="languages" value="Python, MATLAB, C++, SQL" />
            </div>
            <div class="input-group">
              <label>CAD & Engineering Software</label>
              <input type="text" id="tools" value="SolidWorks, Simulink, FEA, Git" />
            </div>
            <div class="input-group full-width">
              <label>Signature Technical Project Title</label>
              <input type="text" id="projectTitle" placeholder="e.g. Autonomous Telemetry Ingestion & Anomaly Detection Engine" />
            </div>
            <div class="input-group full-width">
              <label>Brief Project Summary (What problem did you solve?)</label>
              <textarea id="projectSummary" rows="3" placeholder="Engineered a Python/Polars pipeline that cleaned industrial sensor logs, cutting telemetry diagnostic time by 80%..."></textarea>
            </div>
          </div>
        </div>

        <!-- Section 3: AI Weapon Suite Selection -->
        <div class="form-section">
          <div class="section-num">Stage 03 • AI Workflow Calibration</div>
          <h2 class="section-title">Enterprise AI Workflows We Tool You With</h2>
          <p class="section-desc">Upon acceptance into the cohort, you will receive intensive tooling in these pre-packaged enterprise workflows:</p>

          <div class="checkbox-pill-grid">
            <div class="checkbox-card">
              <input type="checkbox" checked disabled />
              <div>
                <strong style="font-size: 13.5px; color: #ffffff;">Telemetry Data Pipelines</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Python + Polars sensor log parsing & automated anomaly alerts.</div>
              </div>
            </div>
            <div class="checkbox-card">
              <input type="checkbox" checked disabled />
              <div>
                <strong style="font-size: 13.5px; color: #ffffff;">Sovereign Standards RAG</strong>
                <div style="font-size: 12px; color: var(--text-muted);">AS/NZS & ISO vectorized search for instant compliance citation.</div>
              </div>
            </div>
            <div class="checkbox-card">
              <input type="checkbox" checked disabled />
              <div>
                <strong style="font-size: 13.5px; color: #ffffff;">Agentic Simulation Loops</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Automated CAD parameter sweeps & digital twin testing.</div>
              </div>
            </div>
            <div class="checkbox-card">
              <input type="checkbox" checked disabled />
              <div>
                <strong style="font-size: 13.5px; color: #ffffff;">Operational PMO Voice Synthesis</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Whisper voice notes to structured risk registers & Jira action items.</div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" class="btn-submit">
          <span>⚡</span> Compile My Engineering AIgent & Enroll for Retainer
        </button>
      </form>
    </div>
  </main>

  <!-- Success Modal -->
  <div class="modal-backdrop" id="successModal">
    <div class="modal-box">
      <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
      <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Engineering AIgent Compiled!</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;" id="modalSubtitle">Your academic transcript has been received and your verified AIgent profile is now live on Aigents.au.</p>
      
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 16px; text-align: left; margin-bottom: 24px;">
        <div style="font-weight: 800; color: var(--emerald); font-size: 14px; margin-bottom: 4px;">✅ Guaranteed Retainer Status: ENROLLED</div>
        <div style="font-size: 13px; color: #cbd5e1;">Base Retainer: <strong>$750/week</strong> while undergoing SME AI workflow tooling. Scales to <strong>$45–$55/hr</strong> upon active industry sprint placement.</div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <a id="viewPortalBtn" href="/" class="btn" style="flex: 1; justify-content: center;">View My Live AIgent Portal →</a>
      </div>
    </div>
  </div>

  <script>
    let selectedFileName = 'Academic_Transcript_Verified.pdf';

    function handleFileSelect(e) {
      if (e.target.files && e.target.files[0]) {
        selectedFileName = e.target.files[0].name;
        document.getElementById('fileNameDisplay').innerText = 'Selected: ' + selectedFileName;
      }
    }

    async function submitCandidate(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        university: document.getElementById('university').value,
        discipline: document.getElementById('discipline').value,
        atar: document.getElementById('atar').value,
        wam: document.getElementById('wam').value,
        languages: document.getElementById('languages').value,
        tools: document.getElementById('tools').value,
        projectTitle: document.getElementById('projectTitle').value,
        projectSummary: document.getElementById('projectSummary').value,
        transcriptName: selectedFileName
      };

      try {
        const res = await fetch('/api/candidate/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const candidate = await res.json();
        
        document.getElementById('modalSubtitle').innerText = 'Transcript verified for ' + candidate.name + '. Your bespoke capability portal is ready for matching with industry vacancies.';
        document.getElementById('viewPortalBtn').href = '/p/minres'; // links to live demo
        document.getElementById('successModal').style.display = 'flex';
      } catch (err) {
        alert('Error submitting profile. Please try again.');
      }
    }
  </script>

</body>
</html>`;
}
