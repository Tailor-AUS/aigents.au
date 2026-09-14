const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const styles = `
  :root{--ink:#15243c;--muted:#5f6b80;--blue:#2457e8;--canvas:#f5f7fb;--line:#dfe5ef;--lime:#d9f46b;font-family:Inter,Arial,Helvetica,sans-serif;color:var(--ink)}
  *{box-sizing:border-box}body{margin:0;background:var(--canvas);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased}a{color:var(--blue)}button,input,textarea{font:inherit}button{cursor:pointer}h1,h2,h3,p{margin:0}h1,h2,h3{line-height:1.15;letter-spacing:-.035em}h1{font-size:clamp(36px,4.7vw,55px);max-width:750px}h2{font-size:25px}h3{font-size:20px}p+p{margin-top:15px}a,button,input,textarea{touch-action:manipulation}:focus-visible{outline:3px solid var(--blue);outline-offset:4px}[hidden]{display:none!important}.wrap{width:min(1120px,calc(100% - 64px));margin:auto}.skip{position:fixed;top:-100px;left:16px;z-index:100;background:white;padding:12px 18px}.skip:focus{top:12px}
  header{background:white;border-bottom:1px solid var(--line)}.nav{min-height:84px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{color:var(--ink);text-decoration:none;font-size:29px;font-weight:800;letter-spacing:-1.5px;display:inline-flex;align-items:center;gap:10px}.brand-dot{color:var(--blue)}.brand-mark{background:var(--lime);border-radius:7px;height:28px;width:28px;font-size:23px;line-height:28px;text-align:center}.nav-links{display:flex;gap:22px;align-items:center;flex-wrap:wrap}.nav-links a{font-size:14px;color:var(--muted);text-decoration:none;font-weight:600}.nav-links a:hover{text-decoration:underline}.nav-links .button{font-size:13px;padding:9px 15px;min-height:42px}.button{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:12px 20px;border:1px solid transparent;border-radius:8px;background:var(--blue);color:white;text-decoration:none;font-size:14px;font-weight:700;line-height:1.5}.button:hover{background:#1644c8}.button:disabled{opacity:.65;cursor:wait}.button.secondary{background:white;border-color:var(--line);color:var(--ink)}.button.secondary:hover{background:#f0f4fb}.button.light{background:var(--lime);color:var(--ink)}
  main{padding:54px 0 76px}.eyebrow{color:var(--blue);font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.12em;margin-bottom:18px}.intro{max-width:710px;color:var(--muted);font-size:18px;margin-top:21px}.page-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px;align-items:start;margin-top:36px}.card{padding:30px;border:1px solid var(--line);border-radius:18px;background:white;min-width:0}.side-card{position:sticky;top:24px}.side-card h2{font-size:22px}.side-card ol{padding-left:22px;margin:20px 0 0}.side-card li{padding-left:5px;color:var(--muted);font-size:14px;margin:16px 0}.side-card li strong{color:var(--ink);display:block}.small{font-size:13px;color:var(--muted)}.note{padding:16px 18px;background:#edf2ff;border:1px solid #dbe4fb;border-radius:10px;font-size:14px;margin-bottom:25px;overflow-wrap:anywhere}.note strong{display:block;margin-bottom:3px}.form-note{font-size:12px;color:var(--muted);margin-bottom:25px}.required{color:var(--blue)}.form-section{border:0;margin:0 0 28px;padding:0 0 28px;border-bottom:1px solid var(--line);min-width:0}.section-title{font-size:21px;margin-bottom:20px}.fields{display:grid;grid-template-columns:1fr 1fr;gap:21px 18px}.field{display:flex;flex-direction:column;gap:7px;min-width:0}.field.full{grid-column:1/-1}label{font-size:14px;font-weight:650}.optional{font-size:12px;font-weight:400;color:var(--muted)}input,textarea{width:100%;min-width:0;background:white;color:var(--ink);border:1px solid #b9c3d3;border-radius:8px;padding:11px 12px;line-height:1.5;font-size:16px}input::placeholder,textarea::placeholder{color:#69758a;opacity:1}textarea{min-height:132px;resize:vertical}.hint{font-size:12px;color:var(--muted)}.consent{display:flex;align-items:flex-start;gap:11px;margin:0 0 22px}.consent input{height:19px;width:19px;flex:none;accent-color:var(--blue);margin-top:4px}.consent label{font-size:13px;font-weight:400;line-height:1.65}.actions{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.actions .small{max-width:290px}.error{padding:13px 15px;color:#97271f;background:#fff4f2;border:1px solid #e9b8b2;border-radius:8px;margin-bottom:20px;font-size:14px;overflow-wrap:anywhere}.trap{position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}.success{max-width:740px;margin:36px 0 0}.success-icon{height:49px;width:49px;background:var(--lime);border-radius:50%;display:grid;place-items:center;font-size:25px;margin-bottom:22px}.success h2{font-size:30px}.success p{margin-top:17px}.reference{display:block;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:15px;color:var(--ink);overflow-wrap:anywhere;margin-top:4px}.success .actions{margin-top:26px}
  .narrow{max-width:590px}.signin-card{margin-top:32px}.signin-card .field{margin-bottom:22px}.page-heading{display:flex;justify-content:space-between;align-items:start;gap:28px}.inbox-toolbar{margin:30px 0 20px;display:flex;align-items:flex-end;justify-content:space-between;gap:25px}.inbox-toolbar .field{max-width:490px;flex:1}.enquiry-list{display:grid;gap:20px}.enquiry-card{overflow-wrap:anywhere}.enquiry-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding-bottom:20px;border-bottom:1px solid var(--line)}.enquiry-heading h2{font-size:24px}.badge{display:inline-block;flex:none;background:#edf5d7;color:#395012;padding:5px 10px;border-radius:5px;font-size:12px;font-weight:700}.enquiry-meta{font-size:13px;color:var(--muted);margin-top:8px}.details{display:grid;grid-template-columns:1fr 1fr;gap:19px 28px;margin:22px 0 0}.details div{min-width:0}.details .full{grid-column:1/-1}.details dt{font-size:12px;color:var(--muted);margin-bottom:4px}.details dd{margin:0;font-size:15px;white-space:pre-wrap}.empty{text-align:center;padding:43px 25px}.empty p{margin-top:13px;color:var(--muted)}.prose{max-width:800px}.prose .card{margin-top:30px}.prose h2{font-size:22px;margin:28px 0 12px}.prose h2:first-child{margin-top:0}.prose p,.prose li{font-size:15px}.prose ul{padding-left:23px}.prose li{margin-top:10px}footer{border-top:1px solid var(--line);padding:27px 0;background:white}.footer-inner{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;font-size:12px;color:var(--muted)}.footer-links{display:flex;gap:20px;flex-wrap:wrap}.footer-links a{color:var(--muted)}
  @media(max-width:850px){.wrap{width:calc(100% - 44px)}.page-grid{grid-template-columns:1fr}.side-card{position:static}.side-card ol{display:grid;grid-template-columns:repeat(3,1fr);gap:25px}.side-card li{margin:0;font-size:13px}.intro{font-size:17px}.nav-links{gap:17px}.card{padding:26px}.page-heading{display:block}.page-heading>.button{margin-top:20px}}
  @media(max-width:520px){.wrap{width:calc(100% - 36px)}.nav{min-height:77px;gap:16px}.brand{font-size:26px;gap:7px}.brand-mark{width:23px;height:23px;font-size:20px;line-height:23px}.nav-links{gap:12px;justify-content:flex-end}.nav-links a{font-size:12px}.nav-links .button{font-size:12px;padding:8px 11px}.nav-home{display:none}main{padding:35px 0 50px}.intro{font-size:16px}.page-grid{gap:22px;margin-top:26px}.card{padding:23px 19px;border-radius:14px}.fields{grid-template-columns:1fr}.side-card ol{display:block}.side-card li{margin:15px 0}.actions{align-items:stretch}.actions .button{width:100%}.actions .small{max-width:none}.enquiry-heading{display:block}.enquiry-heading .badge{margin-top:13px}.details{grid-template-columns:1fr}.inbox-toolbar{display:block}.inbox-toolbar .small{margin-top:13px}.success h2{font-size:27px}.reference{font-size:13px}.footer-inner{align-items:flex-start;flex-direction:column}.section-title{font-size:20px}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`;

function layout(title, content, script = '', { team = false } = {}) {
  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#2457e8"><meta name="robots" content="${team ? 'noindex, nofollow' : 'index, follow'}"><title>${escapeHtml(title)} | Aigents</title><style>${styles}</style></head><body>
    <a class="skip" href="#main">Skip to content</a>
    <header><div class="wrap nav"><a class="brand" href="/" aria-label="Aigents home"><span>aigents<span class="brand-dot">.</span></span><span class="brand-mark" aria-hidden="true">✳</span></a><nav class="nav-links" aria-label="Main navigation"><a class="nav-home" href="/">Home</a><a href="/employers">For employers</a><a href="/signin">Student sign in</a></nav></div></header>
    <main class="wrap" id="main">${content}</main>
    <footer><div class="wrap footer-inner"><span>Aigents · Engineering students. Practical AI skills. Paid work.</span><nav class="footer-links" aria-label="Footer navigation"><a href="/privacy">Privacy &amp; data</a><a href="mailto:deploy@aigents.au">Contact Aigents</a>${team ? '' : '<a href="/team">Team sign in</a>'}</nav></div></footer>
    ${script ? `<script>${script}</script>` : ''}
  </body></html>`;
}

function inputField(id, label, { type = 'text', required = false, placeholder = '', autocomplete = '', maxLength = 160, full = false, hint = '' } = {}) {
  return `<div class="field${full ? ' full' : ''}"><label for="${id}">${label} ${required ? '<span class="required" aria-hidden="true">*</span>' : '<span class="optional">Optional</span>'}</label><input id="${id}" name="${id}" type="${type}" maxlength="${maxLength}"${required ? ' required' : ''}${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${hint ? ` aria-describedby="${id}Hint"` : ''}>${hint ? `<p class="hint" id="${id}Hint">${hint}</p>` : ''}</div>`;
}

export function renderEmployerHtml(student = null) {
  const targeted = Boolean(student?.id);
  const studentName = targeted ? escapeHtml(student.name || 'this student') : '';
  const content = `<p class="eyebrow">For engineering employers</p><h1>Tell us about the<br>work you need done.</h1><p class="intro">You don't need to build an undergraduate program to work with students. Describe the brief, the skills it needs and the outcome you want; Aigents turns it into a supervised university collective with clear tasks and a review step. Start a conversation with ${targeted ? studentName : 'Aigents'}.</p>
    <div class="page-grid" id="enquiryContent"><div class="card">
      ${targeted ? `<div class="note"><strong>Enquiry for ${studentName}</strong>${escapeHtml(student.discipline || 'Engineering student')}<p class="hint">Your request will appear in this student's profile inbox and in the Aigents team inbox.</p></div>` : '<div class="note"><strong>Have a project, but no particular student in mind?</strong>Your request will be saved in the Aigents team inbox for review.</div>'}
      <form id="enquiryForm" action="/api/enquiries" method="post"><p class="form-note">Fields marked <span class="required">*</span> are required.</p>
        ${targeted ? `<input type="hidden" id="studentId" name="studentId" value="${escapeHtml(student.id)}">` : ''}
        <div class="trap" aria-hidden="true"><label for="website">Website</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
        <section class="form-section" aria-labelledby="contactHeading"><h2 class="section-title" id="contactHeading">Your team and contact details</h2><div class="fields">
          ${inputField('company', 'Company or organisation', { required: true, autocomplete: 'organization', placeholder: 'Your organisation', full: true })}
          ${inputField('contactName', 'Your name', { required: true, autocomplete: 'name', placeholder: 'Full name' })}
          ${inputField('email', 'Work email', { type: 'email', required: true, autocomplete: 'email', placeholder: 'you@company.com.au', maxLength: 254 })}
        </div></section>
        <section class="form-section" aria-labelledby="projectHeading"><h2 class="section-title" id="projectHeading">The project</h2><div class="fields">
          ${inputField('projectTitle', 'Project title', { required: true, placeholder: 'e.g. Analyse a set of equipment sensor logs', full: true })}
          <div class="field full"><label for="description">What help do you need? <span class="required" aria-hidden="true">*</span></label><textarea id="description" name="description" required maxlength="5000" rows="5" placeholder="What needs to be done? What would a useful result look like? Who will support and supervise the student?" aria-describedby="descriptionHint"></textarea><p class="hint" id="descriptionHint">Share enough to explain the work. Leave out confidential project or client information.</p></div>
          ${inputField('skills', 'Skills or tools needed', { placeholder: 'e.g. Python, CAD, technical reporting', full: true, maxLength: 1000 })}
          ${inputField('location', 'Location or working arrangement', { placeholder: 'e.g. Brisbane, hybrid or remote' })}
          ${inputField('timeline', 'Preferred timing', { placeholder: 'e.g. November, two days a week' })}
          ${inputField('budget', 'Proposed pay or budget', { placeholder: 'e.g. Hourly rate or a project budget', full: true, hint: 'This helps scope the conversation. Final terms need to be agreed with the student.' })}
        </div></section>
        <div class="consent"><input type="checkbox" id="consent" name="consent" required><label for="consent">I agree that Aigents${targeted ? ` and ${studentName}` : ''} can receive my contact details and project information to discuss this request. <a href="/privacy">How your data is used</a> <span class="required" aria-hidden="true">*</span></label></div>
        <p class="error" id="enquiryError" role="alert" tabindex="-1" hidden></p><div class="actions"><button class="button" type="submit" id="submitEnquiry">Send project enquiry <span aria-hidden="true">↗</span></button><p class="small">Sending a request starts a conversation. It does not book a student or agree to payment.</p></div>
      </form>
    </div><aside class="card side-card" aria-label="What happens next"><p class="eyebrow">A clear starting point</p><h2>From project idea<br>to a conversation.</h2><ol><li><strong>Tell us what you need.</strong>A short, specific brief helps explain where a student could contribute.</li><li><strong>Your request is saved.</strong>${targeted ? 'The student and the Aigents team can read your request in their inboxes.' : 'The Aigents team can read your request in its inbox.'}</li><li><strong>Discuss the fit.</strong>Scope, supervision, availability and pay still need to be agreed.</li></ol><p class="small">Aigents provides the program layer — the student collective, the task breakdown and the review. You provide the brief and a point of contact.</p><p class="small">No immediate response or placement is guaranteed.</p></aside></div>
    <section class="card success" id="enquirySuccess" aria-labelledby="successHeading" tabindex="-1" hidden><div class="success-icon" aria-hidden="true">✓</div><h2 id="successHeading">Your project enquiry is saved.</h2><p>${targeted ? `Your request is now in ${studentName}'s profile inbox and the Aigents team inbox.` : 'Your request is now in the Aigents team inbox for review.'} Keep this reference if you need to follow up.</p><p class="small">Enquiry reference<span class="reference" id="enquiryReference"></span></p><p class="small">You can contact <a href="mailto:deploy@aigents.au">deploy@aigents.au</a> with your reference. No automatic confirmation email has been sent.</p><div class="actions"><a class="button" href="/">Back to Aigents</a><a class="button secondary" href="/employers">Start another enquiry</a></div></section>`;
  const script = `
    const form = document.getElementById('enquiryForm');
    const button = document.getElementById('submitEnquiry');
    const error = document.getElementById('enquiryError');
    let submitting = false;
    let received = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || received || !form.reportValidity()) return;
      const fields = new FormData(form);
      const payload = Object.fromEntries(fields.entries());
      payload.consent = document.getElementById('consent').checked;
      submitting = true;
      button.disabled = true;
      button.textContent = 'Sending enquiry…';
      form.setAttribute('aria-busy', 'true');
      error.hidden = true;
      try {
        const response = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          error.textContent = typeof data.error === 'string' ? data.error : 'We couldn’t save this enquiry. Check your details and try again.';
          error.hidden = false;
          return;
        }
        received = true;
        document.getElementById('enquiryReference').textContent = data.id || 'Contact Aigents for your reference.';
        document.getElementById('enquiryContent').hidden = true;
        const success = document.getElementById('enquirySuccess');
        success.hidden = false;
        success.focus();
      } catch (err) {
        error.textContent = 'We couldn’t confirm receipt. Your entries are still here. If your connection dropped after sending, contact deploy@aigents.au before trying again.';
        error.hidden = false;
      } finally {
        submitting = false;
        form.removeAttribute('aria-busy');
        if (!received) { button.disabled = false; button.innerHTML = 'Send project enquiry <span aria-hidden="true">↗</span>'; }
        if (!error.hidden) error.focus();
      }
    });`;
  return layout('Tell us about your engineering project', content, script);
}

export function renderTeamSignInHtml() {
  const content = `<div class="narrow"><p class="eyebrow">Aigents team</p><h1>Sign in to the<br>project inbox.</h1><p class="intro">For authorised Aigents team members reviewing employer enquiries.</p><div class="card signin-card"><form id="teamSignIn" action="/api/team/login" method="post"><div class="field"><label for="accessKey">Team access key</label><input id="accessKey" name="accessKey" type="password" required autocomplete="current-password" spellcheck="false" autocapitalize="none" aria-describedby="keyHint"><p class="hint" id="keyHint">Use the access key provided by the site operator.</p></div><p class="error" id="signInError" role="alert" tabindex="-1" hidden></p><button type="submit" class="button" id="signInButton">Sign in to team inbox</button></form></div></div>`;
  const script = `
    const form = document.getElementById('teamSignIn');
    const button = document.getElementById('signInButton');
    const error = document.getElementById('signInError');
    let submitting = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;
      submitting = true;
      button.disabled = true;
      button.textContent = 'Signing in…';
      error.hidden = true;
      form.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch('/api/team/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessKey: document.getElementById('accessKey').value }) });
        if (response.ok) { document.getElementById('accessKey').value = ''; window.location.assign('/team'); return; }
        const data = await response.json().catch(() => ({}));
        error.textContent = typeof data.error === 'string' ? data.error : 'We couldn’t sign you in. Check your access key and try again.';
      } catch (err) { error.textContent = 'We couldn’t connect. Please try signing in again.'; }
      finally {
        submitting = false;
        button.disabled = false;
        button.textContent = 'Sign in to team inbox';
        form.removeAttribute('aria-busy');
        if (error.textContent) { error.hidden = false; error.focus(); }
      }
    });`;
  return layout('Team sign in', content, script, { team: true });
}

function detail(label, value, full = false) {
  return `<div${full ? ' class="full"' : ''}><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || 'Not provided')}</dd></div>`;
}

function receivedDate(enquiry) {
  const raw = enquiry.createdAt || enquiry.submittedAt;
  if (!raw) return 'Date unavailable';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Brisbane' }) + ' AEST';
}

export function renderTeamHtml(enquiries = []) {
  const items = Array.isArray(enquiries) ? enquiries : [];
  const content = `<div class="page-heading"><div><p class="eyebrow">Aigents team</p><h1>Project enquiries.</h1><p class="intro">Review employer requests and use the supplied contact details to follow up.</p></div><form id="logoutForm" action="/api/team/logout" method="post"><button class="button secondary" type="submit" id="logoutButton">Sign out</button></form></div><p class="error" id="logoutError" role="alert" tabindex="-1" hidden></p>
    <div class="inbox-toolbar"><div class="field"><label for="enquirySearch">Find an enquiry</label><input id="enquirySearch" type="search" placeholder="Search company, project, contact or reference" autocomplete="off"></div><p class="small" id="resultCount" role="status">${items.length} ${items.length === 1 ? 'enquiry' : 'enquiries'}</p></div>
    <div class="enquiry-list" id="enquiryList">${items.map(enquiry => `<article class="card enquiry-card"><div class="enquiry-heading"><div><h2>${escapeHtml(enquiry.projectTitle || 'Project enquiry')}</h2><p class="enquiry-meta">${escapeHtml(enquiry.company)} · ${escapeHtml(receivedDate(enquiry))}</p></div><span class="badge">${escapeHtml(enquiry.status || 'received')}</span></div><dl class="details">${detail('Reference', enquiry.id)}${detail('Enquiry for', enquiry.studentId ? `${enquiry.studentName || 'Student'} · ${enquiry.studentId}` : 'Aigents team — no student specified')}${detail('Contact name', enquiry.contactName)}<div><dt>Email</dt><dd>${enquiry.email ? `<a href="mailto:${escapeHtml(encodeURIComponent(enquiry.email))}">${escapeHtml(enquiry.email)}</a>` : 'Not provided'}</dd></div>${detail('Project description', enquiry.description, true)}${detail('Skills or tools', enquiry.skills, true)}${detail('Location or working arrangement', enquiry.location)}${detail('Preferred timing', enquiry.timeline)}${detail('Proposed pay or budget', enquiry.budget)}${detail('Permission to receive contact and project details', enquiry.consent === true ? 'Agreed when submitted' : 'Not recorded')}</dl></article>`).join('')}</div>
    <div class="card empty" id="emptyInbox"${items.length ? ' hidden' : ''}><h2>${items.length ? 'No matching enquiries.' : 'No project enquiries yet.'}</h2><p>${items.length ? 'Try another company, project name or reference.' : 'Employer requests will appear here when they are submitted.'}</p></div>`;
  const script = `
    const search = document.getElementById('enquirySearch');
    const cards = Array.from(document.querySelectorAll('.enquiry-card'));
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      cards.forEach(card => { const match = card.textContent.toLocaleLowerCase().includes(query); card.hidden = !match; if (match) count++; });
      document.getElementById('resultCount').textContent = count + (count === 1 ? ' enquiry' : ' enquiries');
      document.getElementById('emptyInbox').hidden = count > 0;
    });
    let signingOut = false;
    document.getElementById('logoutForm').addEventListener('submit', async event => {
      event.preventDefault();
      if (signingOut) return;
      const button = document.getElementById('logoutButton');
      const error = document.getElementById('logoutError');
      signingOut = true;
      button.disabled = true;
      button.textContent = 'Signing out…';
      error.hidden = true;
      try {
        const response = await fetch('/api/team/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        if (!response.ok) throw new Error('Sign out failed');
        window.location.assign('/team');
      } catch (err) {
        error.textContent = 'We couldn’t sign you out. Please try again before leaving this device.';
        error.hidden = false;
        button.disabled = false;
        button.textContent = 'Sign out';
        signingOut = false;
        error.focus();
      }
    });`;
  return layout('Team project inbox', content, script, { team: true });
}

export function renderPrivacyHtml() {
  const content = `<div class="prose"><p class="eyebrow">Your information</p><h1>Privacy and data<br>at Aigents.</h1><p class="intro">What we save, who can see it and how to contact us.</p><div class="card"><h2>Student profiles and accounts</h2><p>We save the account details and profile information you submit so you can sign in, edit your profile and use it to discuss engineering opportunities. Passwords are stored as hashes. Sign-in cookies keep your authenticated session active.</p><h2>You choose whether to share your profile</h2><p>Your profile is private by default. If you turn sharing on, people with your profile link can view your shared skills and project information. Your email address and academic grades are excluded from the shared profile. You can turn sharing off from your account.</p><h2>Employer project enquiries</h2><p>We save the contact details, project information and consent submitted in an enquiry. Authorised Aigents team members can view it in the team inbox. When an enquiry names a particular student, that student can also see the enquiry and the employer's contact details in their profile inbox.</p><p>These details are used to understand the requested work and enable follow-up conversations. Sending an enquiry does not guarantee a reply, a placement or an employment agreement.</p><h2>Information to leave out</h2><p>Only include information you are comfortable sharing with the people described above. Avoid confidential client material, passwords, identity documents or sensitive project information in profiles and enquiries.</p><h2>Contact and data requests</h2><p>To ask about your information, or request access, correction or deletion, email <a href="mailto:deploy@aigents.au">deploy@aigents.au</a>. Include your account email or enquiry reference so the team can locate the relevant record. Do not send your password or a team access key.</p></div></div>`;
  return layout('Privacy and data', content);
}
