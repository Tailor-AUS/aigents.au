/**
 * 1-Page Executive Capability Brief Renderer
 * 
 * Generates an ATS-busting, printable 1-page PDF/HTML capability brief
 * featuring a prominent QR code linking directly to https://[slug].aigents.au.
 */

export function renderBriefHtml(bundle, qrDataUri) {
  const { hero, roleContext, complementarityMatrix, candidateSnapshot, meta } = bundle;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aigents Fellow Brief | ${meta.companyName} — ${meta.roleTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --font: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --primary: #0f172a;
      --accent: #0284c7;
      --border: #cbd5e1;
      --text: #1e293b;
      --text-muted: #475569;
      --bg-subtle: #f8fafc;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      color: var(--text);
      background: #ffffff;
      padding: 32px 40px;
      line-height: 1.45;
      font-size: 13px;
      max-width: 900px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 16px 20px; font-size: 11.5px; max-width: 100%; }
      .no-print { display: none !important; }
      @page { margin: 10mm; size: A4 portrait; }
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .header-left {
      max-width: 70%;
    }
    .tag {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: var(--primary);
      line-height: 1.2;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .qr-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border: 1px solid var(--border);
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--bg-subtle);
    }
    .qr-block img {
      width: 84px;
      height: 84px;
      display: block;
      margin-bottom: 4px;
    }
    .qr-caption {
      font-family: var(--font-mono);
      font-size: 8.5px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
    }
    .qr-url {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      color: var(--primary);
    }
    .executive-thesis {
      background: var(--bg-subtle);
      border-left: 3px solid var(--accent);
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 12px;
      color: var(--text);
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 4px;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11.5px;
    }
    .matrix-table th, .matrix-table td {
      padding: 8px 10px;
      text-align: left;
      border: 1px solid var(--border);
      vertical-align: top;
    }
    .matrix-table th {
      background: #f1f5f9;
      font-weight: 700;
      color: var(--primary);
      font-size: 10.5px;
      text-transform: uppercase;
    }
    .pill {
      display: inline-block;
      background: #e2e8f0;
      color: #334155;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-family: var(--font-mono);
      margin-right: 3px;
    }
    .credentials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .credential-box {
      border: 1px solid var(--border);
      padding: 8px 10px;
      border-radius: 6px;
      background: #ffffff;
    }
    .credential-value {
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
      font-family: var(--font-mono);
    }
    .credential-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .proof-item {
      margin-bottom: 6px;
      font-size: 11px;
    }
    .proof-name {
      font-weight: 700;
      color: var(--primary);
    }
    .footer-bar {
      border-top: 1px solid var(--border);
      padding-top: 10px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: var(--text-muted);
    }
    .btn-print {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--primary);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>

  <button onclick="window.print()" class="btn-print no-print">🖨️ Print / Save as PDF</button>

  <div class="header-bar">
    <div class="header-left">
      <div class="tag">Aigents.au Engineering Fellow Brief • Verified Candidate</div>
      <h1>${candidateSnapshot.name} (${candidateSnapshot.tier}) × ${meta.companyName}</h1>
      <div class="subtitle">${meta.roleTitle} | ${roleContext.department}</div>
    </div>
    <div class="qr-block">
      <img src="${qrDataUri}" alt="Scan QR for Live Portal">
      <div class="qr-caption">Scan for Interactive Portal</div>
      <div class="qr-url">${meta.portalDomain}</div>
    </div>
  </div>

  <div class="executive-thesis">
    <strong>The Complementary Model:</strong> Senior engineers spend up to 50% of their week wrangling telemetry data, cross-referencing compliance clauses, and writing repetitive scripts. ${candidateSnapshot.name} combines top 1% academic rigor with enterprise AI workflow harnesses to absorb this operational drag on Day 1, allowing your lead engineers to focus purely on high-leverage delivery.
  </div>

  <div class="section-title">⚡ Role Complementarity Matrix</div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th style="width: 25%;">Advertised Role Need</th>
        <th style="width: 35%;">Existing Senior Team Drag</th>
        <th style="width: 40%;">How ${candidateSnapshot.name} + AI Solves It</th>
      </tr>
    </thead>
    <tbody>
      ${complementarityMatrix.map(row => `
        <tr>
          <td><strong>${row.advertisedRequirement}</strong></td>
          <td style="color: var(--text-muted);">${row.teamStrain}</td>
          <td>
            <div style="font-weight: 700; color: var(--accent);">${row.candidateSolution.workflowName}</div>
            <div style="margin: 2px 0 4px; color: #334155;">${row.candidateSolution.howItWorks}</div>
            <div>${row.candidateSolution.toolsUsed.map(t => `<span class="pill">${t}</span>`).join('')}</div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">🎓 Verified Academic & Technical Proof Points</div>
  <div class="credentials-grid">
    <div class="credential-box">
      <div class="credential-value">${candidateSnapshot.tier}</div>
      <div class="credential-label">ATAR Academic Rank (Top 1%)</div>
    </div>
    <div class="credential-box">
      <div class="credential-value">First Class Track</div>
      <div class="credential-label">${candidateSnapshot.education.degree}</div>
    </div>
    <div class="credential-box">
      <div class="credential-value">3 Days</div>
      <div class="credential-label">Onboarding to Production Output</div>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
    <div>
      <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; color: var(--primary);">Key Technical Projects</div>
      ${candidateSnapshot.proofProjects.slice(0, 2).map(p => `
        <div class="proof-item">
          <span class="proof-name">${p.name}:</span> ${p.summary} <em>(${p.impact})</em>
        </div>
      `).join('')}
    </div>
    <div>
      <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; color: var(--primary);">Placement Terms & Availability</div>
      <div style="font-size: 11px; color: var(--text);">
        • <strong>Engagement:</strong> 8–12 week high-impact vacation sprint or flexible co-op.<br>
        • <strong>Location:</strong> Brisbane / Hybrid / Site Travel.<br>
        • <strong>Interactive Portal:</strong> Test the live technical Q&A AIgent at <strong>${meta.portalDomain}</strong>.<br>
        • <strong>Scheduling:</strong> 15-minute technical fit interview available on request.
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div>Aigents.au — Sovereign Australian Engineering Talent Substrate</div>
    <div>Candidate: ${candidateSnapshot.name} • Direct Brief for ${meta.companyName}</div>
  </div>

</body>
</html>`;
}
