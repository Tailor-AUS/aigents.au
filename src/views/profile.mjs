/** Account, private profile and public student profile views. */
import { CAMPUSES } from '../engine/collective.mjs';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const scriptJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const profileFieldLimits = {name:100,university:150,discipline:100,wam:40,atar:20,languages:500,tools:500,projectTitle:180,projectSummary:4000,transcriptName:200,bio:1500,location:180,availability:300};

const styles = `
  :root{--ink:#15243c;--muted:#637086;--blue:#2457e8;--canvas:#f5f7fb;--line:#e1e6ee;--lime:#d9f46b}
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--canvas);color:var(--ink);font:16px/1.6 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}a{color:var(--blue)}button,input,textarea,select{font:inherit}button,a,input,textarea{ -webkit-tap-highlight-color:transparent}button{cursor:pointer}:focus-visible{outline:3px solid var(--blue);outline-offset:4px}[hidden]{display:none!important}.container{width:min(1120px,calc(100% - 64px));margin-inline:auto}header{background:white;border-bottom:1px solid var(--line)}.nav{display:flex;align-items:center;justify-content:space-between;min-height:84px;gap:22px}.brand{display:inline-flex;align-items:center;gap:10px;font-size:28px;font-weight:800;letter-spacing:-1.1px;text-decoration:none;color:var(--ink)}.brand-dot{color:var(--blue)}.brand-mark{width:31px;height:31px;display:grid;place-items:center;border-radius:8px;background:var(--lime);font-size:23px;line-height:1;letter-spacing:0}.nav-actions{display:flex;align-items:center;gap:23px;flex-wrap:wrap}.nav-actions a,.text-button{border:0;background:transparent;padding:8px 0;color:var(--muted);text-decoration:none;font-size:14px;font-weight:600}.nav-actions a:hover,.text-button:hover{color:var(--blue)}main{padding-block:54px 80px}.eyebrow{margin:0 0 16px;color:var(--blue);font-size:12px;font-weight:750;letter-spacing:1.6px;text-transform:uppercase}h1{font-size:clamp(34px,4.3vw,50px);line-height:1.12;letter-spacing:-1.8px;margin:0 0 18px;font-weight:750;overflow-wrap:anywhere}h2{font-size:23px;line-height:1.3;letter-spacing:-.6px;margin:0 0 12px}h3{font-size:17px;line-height:1.4;letter-spacing:-.2px;margin:0 0 9px}p{margin:0 0 16px}.intro{max-width:670px;color:var(--muted);font-size:17px;line-height:1.75}.dashboard-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:28px;align-items:start;margin-top:34px}.card{background:white;border:1px solid var(--line);border-radius:17px;padding:30px;margin-bottom:24px;min-width:0}.card-desc{font-size:14px;color:var(--muted);margin-bottom:24px}.section{border:0;padding:0 0 28px;margin:0 0 28px;border-bottom:1px solid var(--line);min-width:0}.section:last-of-type{border-bottom:0;margin-bottom:0}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px 18px}.field{display:flex;flex-direction:column;gap:7px;min-width:0}.full-width{grid-column:1/-1}label{font-size:14px;font-weight:650}.optional,.private-label{font-size:12px;font-weight:400;color:var(--muted);margin-left:4px}.required{color:var(--blue)}input,textarea,select{width:100%;min-width:0;border:1px solid #cdd5e1;background:white;border-radius:8px;padding:11px 12px;font-size:16px;line-height:1.5;color:var(--ink)}input:focus,textarea:focus,select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px #2457e81a}input::placeholder,textarea::placeholder{color:#778296;opacity:1}textarea{resize:vertical;min-height:116px}.hint{font-size:12px;color:var(--muted);line-height:1.7;margin:0}.read-only{background:var(--canvas);overflow-wrap:anywhere;border:1px solid var(--line);border-radius:8px;padding:11px 12px;min-height:48px}.editor-fields{margin:0;padding:0;border:0;min-width:0}.button{display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:13px 20px;border:1px solid transparent;border-radius:8px;background:var(--blue);color:white;text-decoration:none;font-size:14px;font-weight:700;line-height:1.5;cursor:pointer}.button:hover{background:#1a44c0}.button.secondary{background:white;border-color:var(--line);color:var(--ink)}.button.secondary:hover{border-color:var(--blue)}.button:disabled{opacity:.65;cursor:wait}.actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.save-row{display:flex;gap:18px;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding-top:24px}.status{font-size:14px;margin:0;overflow-wrap:anywhere}.status.success{color:#27612c}.status.error{color:#a12a23}.status-box{padding:12px 14px;background:#fff5f4;border:1px solid #f2c6c2;border-radius:8px;margin:0 0 20px;font-size:14px;color:#a12a23}.status-box a{color:inherit;font-weight:650}.section-number{display:inline-grid;place-items:center;background:#edf2ff;color:var(--blue);width:28px;height:28px;border-radius:50%;font-size:12px;letter-spacing:0;margin-right:9px;vertical-align:2px}.rail{position:sticky;top:24px}.rail .card{padding:24px}.avatar{width:58px;height:58px;display:grid;place-items:center;border-radius:15px;background:var(--lime);font-size:24px;font-weight:750;margin-bottom:20px}.rail-name{font-size:22px;overflow-wrap:anywhere}.rail-subtitle{font-size:14px;color:var(--muted);overflow-wrap:anywhere}.badge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;background:#edf2ff;color:var(--blue);font-size:12px;font-weight:700;padding:5px 10px}.badge.private{background:#eef0f3;color:#546175}.rail-links{display:grid;gap:12px;margin-top:22px;border-top:1px solid var(--line);padding-top:20px}.rail-links a{font-size:14px;text-decoration:none;font-weight:600}.sharing-panel{padding:21px;border:1px solid #ced9f7;background:#f3f6ff;border-radius:12px;margin:0 0 24px}.checkbox-label{display:flex;align-items:flex-start;gap:12px;font-size:15px;font-weight:700;cursor:pointer}.checkbox-label input{accent-color:var(--blue);width:19px;height:19px;flex:0 0 19px;margin:3px 0 0;padding:0}.sharing-panel .hint{margin:8px 0 0 31px}.public-link{margin:14px 0 0 31px;font-size:13px;overflow-wrap:anywhere}.public-link a{font-weight:650}.enquiries{margin-top:12px;scroll-margin-top:24px}.enquiry{padding:24px;border:1px solid var(--line);border-radius:12px;background:white;margin-top:18px}.enquiry-top{display:flex;justify-content:space-between;align-items:baseline;gap:16px}.enquiry-company{font-size:12px;color:var(--blue);font-weight:750;text-transform:uppercase;letter-spacing:.8px;margin:0 0 6px;overflow-wrap:anywhere}.enquiry time{font-size:12px;color:var(--muted);white-space:nowrap}.prose{white-space:pre-wrap;overflow-wrap:anywhere}.enquiry .prose{font-size:14px;color:var(--muted);margin:12px 0 18px}.details{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px}.details dt{font-size:12px;color:var(--muted)}.details dd{margin:3px 0 0;font-size:14px;overflow-wrap:anywhere}.empty-state{border:1px dashed #ccd5e1;background:#f9fafc;border-radius:12px;padding:28px;margin-top:20px}.empty-state p{color:var(--muted);font-size:14px;margin:0}.message-count{display:inline-grid;place-items:center;min-width:25px;height:25px;padding:0 6px;border-radius:8px;background:var(--lime);font-size:13px;letter-spacing:0;margin-left:7px}.auth-layout{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center;max-width:990px;margin:26px auto}.auth-aside h1{max-width:440px}.auth-aside p{color:var(--muted);max-width:430px}.auth-kicker{display:inline-flex;align-items:center;justify-content:center;width:57px;height:57px;border-radius:15px;background:var(--lime);font-size:35px;margin-bottom:28px}.auth-card{margin:0;padding:34px}.auth-card .field{margin-bottom:21px}.auth-card .button{width:100%}.auth-footnote{font-size:14px;color:var(--muted);margin:20px 0 0}.auth-footnote a{font-weight:600}.auth-help{display:flex;justify-content:space-between;gap:15px;margin:0 0 20px;font-size:13px}.recovery-success{padding:22px;background:#f1f5ff;border:1px solid #ced9f7;border-radius:12px}.recovery-success p{font-size:14px;color:var(--muted)}.recovery-code{display:block;padding:14px;background:white;border:1px solid var(--line);border-radius:8px;font-size:16px;overflow-wrap:anywhere;user-select:all;margin-bottom:22px}.public-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:30px;align-items:start}.public-hero{margin-bottom:28px}.public-hero .intro{margin-bottom:20px}.public-hero .badge{margin-bottom:18px}.tag-list{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0 0;padding:0;list-style:none}.tag-list li{padding:7px 11px;background:var(--canvas);border:1px solid var(--line);border-radius:6px;font-size:13px;overflow-wrap:anywhere;max-width:100%}.public-card p{color:var(--muted)}.public-cta .button{width:100%}.public-cta{position:sticky;top:24px}.self-reported{font-size:12px;color:var(--muted);margin-top:22px}.public-summary{border-top:1px solid var(--line);padding-top:20px;margin:24px 0}.public-summary dt{font-size:12px;color:var(--muted);margin-top:14px}.public-summary dd{margin:2px 0 0;font-size:14px;overflow-wrap:anywhere}footer{padding:22px 0;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}.footer-inner{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap}footer a{text-decoration:none;color:var(--muted)}
  .copy-link-button{padding:7px 11px;margin:8px 0 0 10px;font-size:13px}.copy-fallback,.copy-status{display:block;margin-top:12px}.copy-fallback label{display:block;margin-bottom:6px}.copy-status{font-size:12px;color:var(--muted)}.footer-links{display:flex;gap:22px;flex-wrap:wrap}
  @media(max-width:960px){.dashboard-grid{grid-template-columns:minmax(0,1fr) 260px;gap:20px}.card{padding:25px}.auth-layout{gap:36px}.public-layout{grid-template-columns:minmax(0,1fr) 280px;gap:20px}.save-row{align-items:flex-start;flex-direction:column}}
  @media(max-width:760px){.container{width:calc(100% - 40px)}.nav{min-height:74px}.nav-actions{gap:14px}.nav-actions a,.text-button{font-size:13px}main{padding-top:34px}.dashboard-grid,.public-layout{grid-template-columns:1fr;margin-top:26px}.rail,.public-cta{position:static}.rail{grid-row:1}.rail .card{display:none}.auth-layout{grid-template-columns:1fr;gap:28px;margin:0}.auth-aside h1{max-width:none}.auth-aside p{max-width:none}.auth-kicker{width:44px;height:44px;font-size:28px;margin-bottom:20px}.auth-card{padding:28px}.public-layout{margin-top:0}.public-cta{grid-row:1}.public-cta .public-summary{display:none}.public-hero{margin-bottom:20px}.intro{font-size:16px}.enquiry-top{align-items:flex-start;flex-direction:column;gap:2px}}
  @media(max-width:480px){.container{width:calc(100% - 32px)}.nav{gap:16px}.nav-actions{gap:12px}.nav-actions .home-link{display:none}.form-grid,.details{grid-template-columns:1fr}.card{padding:23px 19px}.form-grid{gap:19px}.sharing-panel{padding:17px}.sharing-panel .hint,.public-link{margin-left:0}.save-row .button{width:100%}.enquiry{padding:20px}.auth-card{padding:24px 20px}h1{letter-spacing:-1.3px}.auth-help{flex-wrap:wrap}}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
`;

function page(title, content, script = '', signedIn = false) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><title>${escapeHtml(title)} | aigents.au</title><style>${styles}</style></head><body>
  <header><div class="container nav"><a class="brand" href="/" aria-label="aigents.au home"><span>aigents<span class="brand-dot">.</span></span><span class="brand-mark" aria-hidden="true">✳</span></a><nav class="nav-actions" aria-label="Account navigation">${signedIn ? '<a href="/community">My campus</a><a href="#enquiries">Enquiries</a><button type="button" class="text-button" id="logoutButton">Sign out</button>' : '<a class="home-link" href="/">Home</a><a href="/signin">Sign in</a>'}</nav></div></header>
  <main class="container">${content}</main><footer><div class="container footer-inner"><span>aigents.au · Engineering talent, amplified by AI.</span><span class="footer-links"><a href="/privacy">Privacy</a><a href="/">Back to home ↗</a></span></div></footer>${script ? `<script>${script}</script>` : ''}</body></html>`;
}

function inputField(id, label, value, options = {}) {
  const { required = false, hint = '', multiline = false, full = false, type = 'text', privateField = false } = options;
  const indicator = required ? '<span class="required">*</span>' : '<span class="optional">Optional</span>';
  const attrs = `id="${id}" name="${id}"${required ? ' required' : ''}${profileFieldLimits[id] ? ` maxlength="${profileFieldLimits[id]}"` : ''}${hint ? ` aria-describedby="${id}Hint"` : ''}`;
  return `<div class="field${full ? ' full-width' : ''}"><label for="${id}">${escapeHtml(label)} ${indicator}${privateField ? '<span class="private-label">· Private</span>' : ''}</label>${multiline ? `<textarea ${attrs} rows="4">${escapeHtml(value)}</textarea>` : `<input ${attrs} type="${type}" value="${escapeHtml(value)}">`}${hint ? `<p class="hint" id="${id}Hint">${escapeHtml(hint)}</p>` : ''}</div>`;
}

function enquiryCards(enquiries) {
  if (!Array.isArray(enquiries) || !enquiries.length) return '<div class="empty-state"><h3>No enquiries yet</h3><p>Enquiries sent to your shared student profile will appear here. You can read the brief and decide whether to reply.</p></div>';
  return enquiries.map(enquiry => {
    const date = new Date(enquiry.createdAt);
    const validDate = Number.isFinite(date.getTime());
    const email = String(enquiry.email || '').replace(/[\r\n]/g, '');
    const replyLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Re: ' + (enquiry.projectTitle || 'Engineering opportunity'))}`;
    const detail = (label, value) => value ? `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>` : '';
    return `<article class="enquiry"><div class="enquiry-top"><div><p class="enquiry-company">${escapeHtml(enquiry.company)}</p><h3>${escapeHtml(enquiry.projectTitle || 'Engineering opportunity')}</h3></div>${validDate ? `<time datetime="${escapeHtml(date.toISOString())}">${escapeHtml(date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }))}</time>` : ''}</div><p class="prose">${escapeHtml(enquiry.description)}</p><dl class="details">${detail('Skills requested', enquiry.skills)}${detail('Location', enquiry.location)}${detail('Budget', enquiry.budget)}${detail('Timing', enquiry.timeline)}${detail('Contact', enquiry.contactName)}${detail('Email', email)}</dl>${email ? `<a class="button secondary" href="${escapeHtml(replyLink)}">Reply by email <span aria-hidden="true">↗</span></a>` : ''}</article>`;
  }).join('');
}

const dashboardScript = String.raw`
  const editableFields = ['name','university','discipline','wam','atar','languages','tools','projectTitle','projectSummary','transcriptName','bio','location','availability'];
  const form = document.getElementById('profileForm');
  const saveButton = document.getElementById('saveButton');
  const status = document.getElementById('saveStatus');
  let saving = false;
  let dirty = false;
  function updateSharingDisplay() {
    const enabled = profileState.sharingEnabled === true;
    const badge = document.getElementById('sharingBadge');
    badge.textContent = enabled ? 'Public profile enabled' : 'Private profile';
    badge.classList.toggle('private', !enabled);
    document.getElementById('publicLink').hidden = !enabled;
    document.getElementById('copyFallback').hidden = true;
    document.getElementById('copyStatus').textContent = '';
    document.getElementById('sharingSavedState').textContent = enabled ? 'Your saved profile is currently public.' : 'Your saved profile is currently private.';
  }
  document.getElementById('copyProfileLink').addEventListener('click', async () => {
    if (profileState.sharingEnabled !== true) return;
    const button = document.getElementById('copyProfileLink');
    const copyStatus = document.getElementById('copyStatus');
    const publicUrl = document.querySelector('#publicLink a').href;
    button.disabled = true;
    copyStatus.textContent = '';
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(publicUrl);
      document.getElementById('copyFallback').hidden = true;
      copyStatus.textContent = 'Profile link copied.';
    } catch (error) {
      const fallback = document.getElementById('publicUrl');
      fallback.value = publicUrl;
      document.getElementById('copyFallback').hidden = false;
      fallback.focus();
      fallback.select();
      copyStatus.textContent = 'Copy the selected link, then share it wherever you like.';
    } finally { button.disabled = false; }
  });
  form.addEventListener('input', () => {
    dirty = true;
    status.className = 'status';
    status.textContent = 'You have unsaved changes.';
    document.getElementById('sharingPending').hidden = document.getElementById('sharingEnabled').checked === profileState.sharingEnabled;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !form.reportValidity()) return;
    const payload = {version:profileState.version,sharingEnabled:document.getElementById('sharingEnabled').checked};
    editableFields.forEach(id => payload[id] = document.getElementById(id).value);
    saving = true;
    saveButton.disabled = true;
    document.getElementById('editorFields').disabled = true;
    saveButton.textContent = 'Saving…';
    form.setAttribute('aria-busy','true');
    status.className = 'status';
    status.textContent = '';
    document.getElementById('profileError').hidden = true;
    document.getElementById('conflictHelp').hidden = true;
    document.getElementById('sessionHelp').hidden = true;
    try {
      const response = await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (response.status === 409) {
        document.getElementById('conflictHelp').hidden = false;
        throw new Error('This profile was updated elsewhere. Your edits are still in this form. Copy any changes you want to keep, then reload before saving.');
      }
      if (response.status === 401) {
        document.getElementById('sessionHelp').hidden = false;
        throw new Error('Your session has ended. Copy any unsaved changes, then sign in again.');
      }
      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        const message = typeof problem.error === 'string' ? problem.error : typeof problem.message === 'string' ? problem.message : '';
        throw new Error(message || (response.status === 429 ? 'Too many save attempts. Please wait a moment before trying again.' : 'We couldn’t save your profile. Check your details and try again.'));
      }
      const data = await response.json();
      if (!data.profile || data.profile.version == null) throw new Error('The save response was incomplete. Reload to check your saved profile before editing again.');
      profileState.version = data.profile.version;
      profileState.sharingEnabled = data.profile.sharingEnabled === true;
      editableFields.forEach(id => document.getElementById(id).value = data.profile[id] ?? '');
      document.getElementById('sharingEnabled').checked = profileState.sharingEnabled;
      document.getElementById('profileName').textContent = data.profile.name || 'Your student profile';
      document.getElementById('profileDiscipline').textContent = data.profile.discipline || '';
      document.getElementById('profileInitial').textContent = (data.profile.name || 'S').trim().charAt(0).toUpperCase();
      document.getElementById('sharingPending').hidden = true;
      updateSharingDisplay();
      dirty = false;
      status.className = 'status success';
      status.textContent = 'Your profile has been saved.';
    } catch (error) {
      document.getElementById('profileErrorText').textContent = error.message || 'We couldn’t save your profile. Please try again.';
      document.getElementById('profileError').hidden = false;
    } finally {
      saving = false;
      saveButton.disabled = false;
      document.getElementById('editorFields').disabled = false;
      saveButton.textContent = 'Save profile';
      form.removeAttribute('aria-busy');
    }
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  document.getElementById('logoutButton').addEventListener('click', async () => {
    if (dirty && !window.confirm('You have unsaved changes. Sign out without saving them?')) return;
    const button = document.getElementById('logoutButton');
    button.disabled = true;
    try {
      const response = await fetch('/api/session/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      if (!response.ok) throw new Error('Sign out failed. Please try again.');
      dirty = false;
      window.location.assign('/signin');
    } catch (error) {
      document.getElementById('accountStatus').textContent = 'We couldn’t sign you out. Please try again.';
      button.disabled = false;
    }
  });
  updateSharingDisplay();
`;

export function renderProfileHtml(profile, enquiries = [], universities = CAMPUSES) {
  const publicPath = '/students/' + encodeURIComponent(profile.id);
  const universityNames = (Array.isArray(universities) ? universities : []).map(item => item.name).join(', ') || 'selected Australian universities';
  const sharing = profile.sharingEnabled === true;
  const count = Array.isArray(enquiries) ? enquiries.length : 0;
  const html = `<p class="eyebrow">Your student account</p><h1>A profile that grows<br>with you.</h1><p class="intro">Review your details, build on your experience and choose when to share your profile with engineering teams.</p><p id="accountStatus" class="status error" role="alert"></p>
  <div class="dashboard-grid"><div>
    <form id="profileForm" class="card"><h2>Your profile</h2><p class="card-desc">Fields marked <span class="required">*</span> are required. Your email, grades and transcript reference stay private.</p>
      <fieldset class="editor-fields" id="editorFields"><section class="section" aria-labelledby="aboutHeading"><h3 id="aboutHeading"><span class="section-number" aria-hidden="true">01</span>About you</h3><div class="form-grid">
        ${inputField('name', 'Full name', profile.name, {required:true})}
        <div class="field"><label for="accountEmail">Email <span class="private-label">· Private</span></label><input id="accountEmail" type="email" value="${escapeHtml(profile.email)}" readonly aria-describedby="emailHint"><p class="hint" id="emailHint">Your sign-in email. It can't be changed here.</p></div>
        ${inputField('university', 'University', profile.university, {required:true,hint:`University collectives currently run at ${escapeHtml(universityNames)}. Your university is self-declared and is not verified against university records; it is fixed once you join a campus community.`})}
        ${inputField('discipline', 'Engineering discipline', profile.discipline, {required:true})}
        ${inputField('bio', 'About you', profile.bio, {multiline:true,full:true,hint:'A short introduction to your interests, strengths and the engineering work you want to do.'})}
        ${inputField('location', 'Location', profile.location, {hint:'For example, Brisbane or open to remote work.'})}
        ${inputField('availability', 'Availability', profile.availability, {hint:'For example, two days a week or summer vacation.'})}
      </div></section>
      <section class="section" aria-labelledby="skillsHeading"><h3 id="skillsHeading"><span class="section-number" aria-hidden="true">02</span>Your skills and project</h3><div class="form-grid">
        ${inputField('languages', 'Programming languages', profile.languages, {hint:'Separate each language with a comma.'})}
        ${inputField('tools', 'Engineering software', profile.tools, {hint:'Separate each tool with a comma.'})}
        ${inputField('projectTitle', 'Project name', profile.projectTitle, {full:true})}
        ${inputField('projectSummary', 'What did you do?', profile.projectSummary, {full:true,multiline:true,hint:'Explain the problem, your contribution and the result in your own words.'})}
      </div></section>
      <section class="section" aria-labelledby="privateHeading"><h3 id="privateHeading"><span class="section-number" aria-hidden="true">03</span>Private academic details</h3><p class="card-desc">These details are saved to your account and excluded from your public profile.</p><div class="form-grid">
        ${inputField('wam', 'Current WAM or GPA', profile.wam, {required:true,privateField:true,hint:'Include the scale when entering a GPA.'})}
        ${inputField('atar', 'ATAR', profile.atar, {privateField:true})}
        ${inputField('transcriptName', 'Academic transcript file name', profile.transcriptName, {full:true,privateField:true,hint:'A file name reference only. No document is uploaded or verified here.'})}
      </div></section>
      <section class="sharing-panel" aria-labelledby="sharingHeading"><h3 id="sharingHeading">Share your profile when you're ready</h3><label class="checkbox-label" for="sharingEnabled"><input id="sharingEnabled" name="sharingEnabled" type="checkbox"${sharing ? ' checked' : ''}><span>Make my student profile public</span></label><p class="hint">Anyone with the link can see your name, university, skills, project, introduction, location and availability. Your email, grades and transcript reference are excluded.</p><p class="hint" id="sharingSavedState"></p><p class="hint" id="sharingPending" hidden>Save your profile to apply this sharing change.</p><p class="public-link" id="publicLink"${sharing ? '' : ' hidden'}>Your current public link: <a href="${escapeHtml(publicPath)}" target="_blank" rel="noopener">View public profile ↗</a><button class="button secondary copy-link-button" id="copyProfileLink" type="button">Copy profile link</button><span class="copy-fallback" id="copyFallback" hidden><label for="publicUrl">Your public profile link</label><input id="publicUrl" type="url" readonly aria-describedby="copyStatus"></span><span class="copy-status" id="copyStatus" role="status" aria-live="polite"></span></p></section></fieldset>
      <div id="profileError" class="status-box" role="alert" hidden><span id="profileErrorText"></span><p id="conflictHelp" hidden><a href="/profile">Reload your saved profile</a></p><p id="sessionHelp" hidden><a href="/signin">Sign in again</a></p></div><div class="save-row"><p id="saveStatus" class="status" role="status" aria-live="polite"></p><button class="button" id="saveButton" type="submit">Save profile</button></div>
    </form>
    <section class="enquiries" id="enquiries" aria-labelledby="enquiriesHeading"><h2 id="enquiriesHeading">Employer enquiries <span class="message-count">${count}</span></h2><p class="card-desc">Read the project brief and reply when an opportunity feels like a fit.</p>${enquiryCards(enquiries)}</section>
  </div><aside class="rail" aria-label="Your profile overview"><div class="card"><div class="avatar" id="profileInitial" aria-hidden="true">${escapeHtml(String(profile.name || 'S').trim().charAt(0).toUpperCase())}</div><h2 class="rail-name" id="profileName">${escapeHtml(profile.name)}</h2><p class="rail-subtitle" id="profileDiscipline">${escapeHtml(profile.discipline)}</p><span class="badge${sharing ? '' : ' private'}" id="sharingBadge">${sharing ? 'Public profile enabled' : 'Private profile'}</span><div class="rail-links"><a href="#profileForm">Edit your profile</a><a href="/community">Go to my campus community</a><a href="#enquiries">View employer enquiries (${count})</a></div></div><p class="hint">Your experience, in your own words. Include work you can explain and skills you've used.</p></aside></div>`;
  return page('Your student profile', html, `const profileState = ${scriptJson({version:profile.version,sharingEnabled:sharing})};${dashboardScript}`, true);
}

function tags(value) {
  const items = String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  return items.length ? `<ul class="tag-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="hint">Not added yet.</p>';
}

export function renderPublicProfileHtml(profile) {
  const employerPath = '/employers?student=' + encodeURIComponent(profile.id);
  const summary = (label, value) => value ? `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>` : '';
  const html = `<section class="public-hero"><p class="eyebrow">Engineering student profile</p><span class="badge">Shared by the student</span><h1>${escapeHtml(profile.name)}</h1><p class="intro">${escapeHtml(profile.discipline)}${profile.university ? ` · ${escapeHtml(profile.university)}` : ''}</p></section><div class="public-layout"><div>
    <section class="card public-card"><h2>Meet ${escapeHtml(profile.name)}</h2><p class="prose">${escapeHtml(profile.bio || 'This student has not added an introduction yet.')}</p></section>
    <section class="card public-card"><h2>Tools I work with</h2><h3>Programming languages</h3>${tags(profile.languages)}<h3 style="margin-top:26px">Engineering software</h3>${tags(profile.tools)}</section>
    <section class="card public-card"><p class="eyebrow">A project in my own words</p><h2>${escapeHtml(profile.projectTitle || 'Project details coming soon')}</h2><p class="prose">${escapeHtml(profile.projectSummary || 'This student has not added a project summary yet.')}</p></section>
    <p class="self-reported">The experience and skills on this page are self-reported by the student.</p>
  </div><aside class="card public-cta"><div class="avatar" aria-hidden="true">↗</div><h2>Have a project<br>in mind?</h2><p class="card-desc">Send an engineering brief to this student. Include the work, timing and budget so they can decide whether it's a fit.</p><dl class="public-summary">${summary('Location', profile.location)}${summary('Availability', profile.availability)}</dl><a class="button" href="${escapeHtml(employerPath)}">Enquire about a project <span aria-hidden="true">↗</span></a><p class="hint" style="margin-top:14px">Your enquiry goes to this student's account. They choose whether to reply.</p></aside></div>`;
  return page(`${profile.name || 'Student'} — engineering profile`, html);
}

const loginScript = String.raw`
  const form = document.getElementById('signInForm');
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    const button = document.getElementById('signInButton');
    const error = document.getElementById('authError');
    button.disabled = true;button.textContent = 'Signing in…';error.hidden = true;form.setAttribute('aria-busy','true');
    try {
      const response = await fetch('/api/session/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('password').value})});
      if (!response.ok) throw new Error('Sign in failed');
      await response.json();
      document.getElementById('password').value = '';
      window.location.assign('/profile');
    } catch (err) {
      error.textContent = 'We couldn’t sign you in. Check your email and password, then try again.';
      error.hidden = false;
    } finally {pending = false;button.disabled = false;button.textContent = 'Sign in';form.removeAttribute('aria-busy');}
  });
`;

export function renderSignInHtml() {
  return page('Sign in', `<div class="auth-layout"><section class="auth-aside"><div class="auth-kicker" aria-hidden="true">✳</div><p class="eyebrow">Your student account</p><h1>Pick up where<br>you left off.</h1><p>Keep your profile up to date, choose what to share and view enquiries from engineering teams.</p></section><section class="card auth-card" aria-labelledby="signinHeading"><h2 id="signinHeading">Sign in</h2><p class="card-desc">Use the email and password you signed up with.</p><form id="signInForm"><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required></div><div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="128"></div><div class="auth-help"><a href="/recover">Forgot your password?</a></div><p id="authError" class="status-box" role="alert" hidden></p><button id="signInButton" class="button" type="submit">Sign in</button></form><p class="auth-footnote">New to aigents? <a href="/build">Create your student profile</a></p></section></div>`, loginScript);
}

const recoveryScript = String.raw`
  const form = document.getElementById('recoverForm');
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    const button = document.getElementById('recoverButton');
    const error = document.getElementById('authError');
    button.disabled = true;button.textContent = 'Resetting password…';error.hidden = true;form.setAttribute('aria-busy','true');
    try {
      const response = await fetch('/api/session/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,recoveryCode:document.getElementById('recoveryCode').value,password:document.getElementById('password').value})});
      if (!response.ok) throw new Error('Recovery failed');
      const data = await response.json();
      if (!data.recoveryCode) throw new Error('Incomplete recovery response');
      document.getElementById('password').value = '';
      document.getElementById('recoveryCode').value = '';
      document.getElementById('newRecoveryCode').textContent = data.recoveryCode;
      form.hidden = true;
      document.getElementById('recoveryIntro').hidden = true;
      document.getElementById('recoverySuccess').hidden = false;
      document.getElementById('recoveredHeading').focus();
    } catch (err) {
      error.textContent = 'We couldn’t reset your password. Check your email, recovery code and new password, then try again.';
      error.hidden = false;
    } finally {pending = false;button.disabled = false;button.textContent = 'Reset password';form.removeAttribute('aria-busy');}
  });
`;

export function renderRecoverHtml() {
  return page('Recover your account', `<div class="auth-layout"><section class="auth-aside"><div class="auth-kicker" aria-hidden="true">✳</div><p class="eyebrow">Account recovery</p><h1>Get back to<br>your profile.</h1><p>Use the recovery code you saved when you created your account, along with your email, to set a new password.</p></section><section class="card auth-card" aria-labelledby="recoverHeading"><div id="recoveryIntro"><h2 id="recoverHeading">Reset your password</h2><p class="card-desc">Your recovery code proves the account is yours.</p></div><form id="recoverForm"><div class="field"><label for="email">Account email</label><input id="email" name="email" type="email" autocomplete="username" required></div><div class="field"><label for="recoveryCode">Recovery code</label><input id="recoveryCode" name="recoveryCode" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" required></div><div class="field"><label for="password">New password</label><input id="password" name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password" aria-describedby="passwordHint"><p class="hint" id="passwordHint">Use 12–128 characters.</p></div><p id="authError" class="status-box" role="alert" hidden></p><button id="recoverButton" class="button" type="submit">Reset password</button></form><section class="recovery-success" id="recoverySuccess" hidden><h2 id="recoveredHeading" tabindex="-1">You're back in.</h2><p>Your password has been reset. Save this new recovery code in your password manager. It replaces your old code and is shown only now.</p><code class="recovery-code" id="newRecoveryCode" tabindex="0" aria-label="Your new one-time recovery code"></code><a href="/profile" class="button">View my profile <span aria-hidden="true">↗</span></a></section><p class="auth-footnote"><a href="/signin">Back to sign in</a></p></section></div>`, recoveryScript);
}
