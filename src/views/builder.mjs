/** Student profile creation view. The registration API saves profile fields and transcript filename only. */
export function renderBuilderHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Create your student profile | aigents.au</title>
  <meta name="description" content="Introduce your engineering skills, studies and projects. Create your aigents.au student profile for engineering opportunities supported by AI.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root { --ink: #15243c; --muted: #637086; --blue: #2457e8; --canvas: #f5f7fb; --line: #e1e6ee; --lime: #d9f46b; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--canvas); color: var(--ink); font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    a { color: inherit; }
    button, input, select, textarea { font: inherit; }
    button, a, input, select, textarea { -webkit-tap-highlight-color: transparent; }
    :focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; }
    .container { width: min(1120px, calc(100% - 64px)); margin-inline: auto; }
    header { background: white; border-bottom: 1px solid var(--line); }
    .nav-inner { min-height: 84px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .brand { display: inline-flex; gap: 10px; align-items: center; text-decoration: none; font-size: 28px; font-weight: 800; letter-spacing: -1.1px; }
    .brand-dot { color: var(--blue); }
    .brand-mark { width: 31px; height: 31px; display: grid; place-items: center; color: var(--ink); background: var(--lime); border-radius: 8px; font-size: 23px; line-height: 1; letter-spacing: 0; }
    .back-link { color: var(--muted); text-decoration: none; font-size: 13px; font-weight: 600; }
    .back-link:hover { color: var(--blue); }
    main { padding-block: 58px 80px; }
    .eyebrow { display: inline-flex; align-items: center; gap: 9px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; margin: 0 0 18px; }
    .eyebrow::before { content: ''; width: 7px; height: 7px; background: var(--blue); border-radius: 50%; }
    h1 { font-size: clamp(34px, 4.5vw, 52px); letter-spacing: -2px; line-height: 1.1; font-weight: 750; margin: 0 0 20px; max-width: 680px; }
    .intro { color: var(--muted); font-size: 17px; line-height: 1.75; max-width: 680px; margin: 0; }
    .page-grid { display: grid; grid-template-columns: minmax(0, 1fr) 292px; align-items: start; gap: 32px; margin-top: 38px; }
    .form-card { background: white; border: 1px solid var(--line); border-radius: 18px; padding: 32px; }
    .form-note { font-size: 12px; color: var(--muted); margin: 0 0 30px; }
    .required-mark { color: var(--blue); }
    .form-section { margin: 0 0 32px; padding: 0 0 32px; border: 0; border-bottom: 1px solid var(--line); min-width: 0; }
    .section-heading { display: flex; align-items: center; gap: 13px; margin-bottom: 9px; }
    .section-num { flex: 0 0 30px; height: 30px; display: grid; place-items: center; background: #edf2ff; color: var(--blue); border-radius: 50%; font-size: 12px; font-weight: 750; }
    h2 { font-size: 20px; line-height: 1.3; margin: 0; letter-spacing: -.5px; }
    .section-desc { font-size: 14px; color: var(--muted); margin: 0 0 22px 43px; }
    .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 18px; }
    .input-group { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    .input-group.full-width { grid-column: 1 / -1; }
    label { font-size: 14px; font-weight: 650; }
    .optional { color: var(--muted); font-size: 12px; font-weight: 400; margin-left: 3px; }
    input, select, textarea { width: 100%; min-width: 0; border: 1px solid #cdd5e1; border-radius: 8px; padding: 11px 12px; color: var(--ink); background: white; font-size: 16px; line-height: 1.5; transition: border-color .15s, box-shadow .15s; }
    input::placeholder, textarea::placeholder { color: #778296; opacity: 1; }
    select { min-height: 44px; }
    textarea { resize: vertical; min-height: 116px; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px #2457e81a; }
    .field-hint { color: var(--muted); font-size: 12px; margin: 0; line-height: 1.65; }
    .transcript-box { margin-top: 24px; background: var(--canvas); border: 1px solid var(--line); border-radius: 10px; padding: 18px; }
    .transcript-box label { display: block; margin-bottom: 5px; }
    .transcript-box input { padding: 0; border: 0; border-radius: 4px; background: transparent; margin-top: 14px; font-size: 16px; }
    input::file-selector-button { border: 1px solid #cdd5e1; border-radius: 6px; padding: 8px 12px; background: white; color: var(--ink); font: inherit; font-weight: 600; margin-right: 10px; cursor: pointer; }
    input::file-selector-button:hover { border-color: var(--blue); }
    #fileNameDisplay { overflow-wrap: anywhere; margin-top: 8px; }
    .submit-area { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .submit-copy { max-width: 245px; margin: 0; color: var(--muted); font-size: 12px; }
    .button { display: inline-flex; align-items: center; justify-content: center; gap: 14px; border: 1px solid transparent; border-radius: 8px; padding: 13px 20px; background: var(--blue); color: white; text-decoration: none; font-size: 14px; line-height: 1.5; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s; }
    .button:hover { background: #1a44c0; }
    .button:disabled { opacity: .65; cursor: wait; }
    .form-error { padding: 12px 14px; margin: 0 0 20px; border: 1px solid #f2c6c2; background: #fff5f4; color: #a12a23; font-size: 14px; border-radius: 8px; }
    [hidden] { display: none !important; }
    .side-rail { position: sticky; top: 28px; }
    .side-card { padding: 25px; border: 1px solid var(--line); background: white; border-radius: 16px; }
    .profile-symbol { width: 44px; height: 44px; border-radius: 12px; background: var(--lime); display: grid; place-items: center; margin-bottom: 22px; }
    .side-card h2 { font-size: 19px; line-height: 1.4; letter-spacing: -.4px; }
    .side-card > p { color: var(--muted); font-size: 13px; margin: 12px 0 22px; }
    .profile-list { list-style: none; padding: 0; margin: 0; }
    .profile-list li { display: flex; gap: 10px; padding-block: 12px; border-top: 1px solid var(--line); font-size: 12px; }
    .profile-list span { color: var(--blue); font-weight: 800; }
    .rail-note { margin: 20px 9px 0; color: var(--muted); font-size: 12px; }
    .rail-note strong { display: block; color: var(--ink); margin-bottom: 5px; font-size: 12px; }
    footer { border-top: 1px solid var(--line); padding-block: 22px; color: var(--muted); font-size: 12px; }
    .footer-inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .footer-links { display: flex; gap: 22px; flex-wrap: wrap; }
    footer a { text-decoration: none; }
    .modal-backdrop { display: none; position: fixed; inset: 0; z-index: 200; align-items: center; justify-content: center; padding: 24px; background: #15243ca6; backdrop-filter: blur(4px); }
    .modal-box { width: min(520px, 100%); max-height: calc(100dvh - 48px); overflow-y: auto; padding: 36px; background: white; border: 1px solid var(--line); border-radius: 20px; position: relative; }
    .close-button { position: absolute; right: 16px; top: 14px; padding: 4px 9px; border: 0; background: transparent; color: var(--muted); font-size: 24px; cursor: pointer; }
    .success-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; margin-bottom: 22px; background: var(--lime); font-size: 25px; }
    .modal-box h2 { font-size: 27px; letter-spacing: -.8px; }
    #modalSubtitle { margin-block: 14px 22px; color: var(--muted); font-size: 14px; }
    .saved-details { background: var(--canvas); border-radius: 10px; padding: 17px; margin-bottom: 24px; }
    .saved-details p { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 750; }
    .saved-details dl { margin: 0; font-size: 16px; }
    .saved-details dt { color: var(--muted); margin-top: 10px; font-size: 12px; }
    .saved-details dt:first-child { margin-top: 0; }
    .saved-details dd { margin: 1px 0 0; overflow-wrap: anywhere; }
    .recovery-box { border: 1px solid #cad6fb; background: #f1f5ff; padding: 18px; border-radius: 10px; margin: 0 0 22px; }
    .recovery-box h3 { margin: 0 0 8px; font-size: 16px; }
    .recovery-box p { color: var(--muted); font-size: 13px; margin: 0 0 12px; }
    .recovery-box code { display: block; padding: 12px; background: white; border: 1px solid var(--line); border-radius: 6px; font-size: 16px; overflow-wrap: anywhere; user-select: all; }
    .account-note { margin: 16px 0 0; color: var(--muted); font-size: 14px; }
    .account-note a { color: var(--blue); font-weight: 600; }
    @media (max-width: 960px) { .page-grid { grid-template-columns: minmax(0, 1fr) 250px; gap: 22px; } .form-card { padding: 26px; } .submit-area { flex-direction: column; align-items: stretch; gap: 18px; } .submit-copy { max-width: none; } }
    @media (max-width: 760px) { .container { width: calc(100% - 40px); } .nav-inner { min-height: 72px; } main { padding-top: 36px; } h1 { letter-spacing: -1.4px; } .intro { font-size: 16px; } .page-grid { grid-template-columns: 1fr; margin-top: 28px; } .side-rail { position: static; } .side-card { display: none; } .rail-note { margin: 0; } .form-card { padding: 24px; } }
    @media (max-width: 480px) { .container { width: calc(100% - 32px); } .back-link { font-size: 12px; } .input-grid { grid-template-columns: 1fr; } .form-card { padding: 22px 18px; } .section-desc { margin-left: 0; } h2 { font-size: 19px; } .modal-box { padding: 28px 22px; } }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  </style>
</head>
<body>
  <header>
    <div class="container nav-inner">
      <a href="/" class="brand" aria-label="aigents.au home"><span>aigents<span class="brand-dot">.</span></span><span class="brand-mark" aria-hidden="true">✳</span></a>
      <a href="/" class="back-link">← Back to home</a>
    </div>
  </header>
  <main class="container">
    <p class="eyebrow">For engineering students</p>
    <h1>Create your<br>student profile.</h1>
    <p class="intro">Your next opportunity starts with what you can do. Tell us about your studies, skills and projects to take the first step towards paid engineering work supported by AI.</p>
    <p class="account-note">Already have a profile? <a href="/signin">Sign in</a></p>
    <div class="page-grid">
      <div class="form-card">
        <form id="builderForm" onsubmit="submitCandidate(event)">
          <p class="form-note">Fields marked <span class="required-mark">*</span> are required. Everything else is optional.</p>
          <section class="form-section" aria-labelledby="aboutHeading">
            <div class="section-heading"><span class="section-num" aria-hidden="true">01</span><h2 id="aboutHeading">A little about you</h2></div>
            <p class="section-desc">Start with your contact details and what you're studying.</p>
            <div class="input-grid">
              <div class="input-group">
                <label for="name">Full name <span class="required-mark">*</span></label>
                <input type="text" id="name" name="name" required maxlength="100" autocomplete="name" placeholder="Your full name">
              </div>
              <div class="input-group">
                <label for="email">University email <span class="required-mark">*</span></label>
                <input type="email" id="email" name="email" required autocomplete="email" placeholder="you@university.edu.au">
              </div>
              <div class="input-group full-width">
                <label for="password">Create a password <span class="required-mark">*</span></label>
                <input type="password" id="password" name="password" required minlength="12" maxlength="128" autocomplete="new-password" aria-describedby="passwordHint">
                <p class="field-hint" id="passwordHint">Use 12–128 characters. You'll use your email and password to return to your profile.</p>
              </div>
              <div class="input-group">
                <label for="university">University <span class="required-mark">*</span></label>
                <select id="university" name="university" required>
                  <option value="" disabled selected>Select your university</option>
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
                <label for="discipline">Engineering discipline <span class="required-mark">*</span></label>
                <select id="discipline" name="discipline" required>
                  <option value="" disabled selected>Select your discipline</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Mechatronics & Robotics">Mechatronics &amp; Robotics</option>
                  <option value="Systems & Electrical Engineering">Systems &amp; Electrical Engineering</option>
                  <option value="Mining & Metallurgy">Mining &amp; Metallurgy</option>
                  <option value="Software & Computer Systems">Software &amp; Computer Systems</option>
                  <option value="Civil & Structural">Civil &amp; Structural</option>
                </select>
              </div>
              <div class="input-group">
                <label for="wam">Current WAM or GPA <span class="required-mark">*</span></label>
                <input type="text" id="wam" name="wam" required maxlength="40" placeholder="e.g. 84.5 WAM or 6.5/7 GPA" aria-describedby="wamHint">
                <p class="field-hint" id="wamHint">Include the scale if you're entering a GPA.</p>
              </div>
              <div class="input-group">
                <label for="atar">ATAR <span class="optional">Optional</span></label>
                <input type="text" id="atar" name="atar" maxlength="20" placeholder="e.g. 95.50" aria-describedby="atarHint">
                <p class="field-hint" id="atarHint">If you finished school in the last four years.</p>
              </div>
            </div>
          </section>
          <section class="form-section" aria-labelledby="skillsHeading">
            <div class="section-heading"><span class="section-num" aria-hidden="true">02</span><h2 id="skillsHeading">Your technical skills</h2></div>
            <p class="section-desc">Classwork counts. List tools you've actually used, even if you're still learning.</p>
            <div class="input-grid">
              <div class="input-group">
                <label for="languages">Programming languages <span class="optional">Optional</span></label>
                <input type="text" id="languages" name="languages" maxlength="500" placeholder="e.g. Python, MATLAB, C++" aria-describedby="languagesHint">
                <p class="field-hint" id="languagesHint">Separate each language with a comma.</p>
              </div>
              <div class="input-group">
                <label for="tools">Engineering software <span class="optional">Optional</span></label>
                <input type="text" id="tools" name="tools" maxlength="500" placeholder="e.g. SolidWorks, AutoCAD, Git" aria-describedby="toolsHint">
                <p class="field-hint" id="toolsHint">Separate each tool with a comma.</p>
              </div>
            </div>
          </section>
          <section class="form-section" aria-labelledby="projectHeading">
            <div class="section-heading"><span class="section-num" aria-hidden="true">03</span><h2 id="projectHeading">Show what you've made</h2></div>
            <p class="section-desc">Share a uni assignment, personal project or work example you're proud of.</p>
            <div class="input-grid">
              <div class="input-group full-width">
                <label for="projectTitle">Project name <span class="optional">Optional</span></label>
                <input type="text" id="projectTitle" name="projectTitle" maxlength="180" placeholder="e.g. A sensor dashboard for our student race car">
              </div>
              <div class="input-group full-width">
                <label for="projectSummary">What did you do? <span class="optional">Optional</span></label>
                <textarea id="projectSummary" name="projectSummary" maxlength="4000" rows="4" placeholder="What was the problem? What did you build or contribute? What happened as a result?"></textarea>
              </div>
            </div>
            <div class="transcript-box">
              <label for="transcriptInput">Academic transcript reference <span class="optional">Optional</span></label>
              <p class="field-hint" id="transcriptHint">You can select a PDF or Word document to save its file name with your profile. The document itself is not uploaded or verified.</p>
              <input type="file" id="transcriptInput" name="transcriptInput" accept=".pdf,.doc,.docx" onchange="handleFileSelect(event)" aria-describedby="transcriptHint fileNameDisplay">
              <p class="field-hint" id="fileNameDisplay" aria-live="polite">No document selected.</p>
            </div>
          </section>
          <p class="form-error" id="formError" role="alert" hidden></p>
          <div class="submit-area">
            <p class="submit-copy">Your profile starts private. You can review it and choose to share it after signing up. <a href="/privacy" target="_blank" rel="noopener">See how your details are used.</a></p>
            <button type="submit" class="button" id="submitButton">Create my profile <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      </div>
      <aside class="side-rail" aria-label="About your student profile">
        <div class="side-card">
          <div class="profile-symbol" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="M6 16v-1a3 3 0 0 1 6 0v1M15 8h3M15 12h3M15 16h3"/></svg></div>
          <h2>More than a list<br>of qualifications.</h2>
          <p>Give engineering teams a clear picture of the person behind the CV.</p>
          <ul class="profile-list">
            <li><span aria-hidden="true">✓</span>Your engineering background</li>
            <li><span aria-hidden="true">✓</span>The tools you know</li>
            <li><span aria-hidden="true">✓</span>A project in your own words</li>
          </ul>
        </div>
        <p class="rail-note"><strong>You bring the engineering. AI supports the work.</strong>Aigents.au connects engineering students and industry through practical work supported by AI.</p>
      </aside>
    </div>
  </main>
  <footer><div class="container footer-inner"><span>aigents.au · Engineering talent, amplified by AI.</span><span class="footer-links"><a href="/privacy">Privacy</a><a href="/">Back to home ↗</a></span></div></footer>
  <div class="modal-backdrop" id="successModal">
    <section class="modal-box" role="dialog" aria-modal="true" aria-labelledby="successHeading" aria-describedby="modalSubtitle" tabindex="-1">
      <div class="success-icon" aria-hidden="true">✓</div>
      <h2 id="successHeading">Your profile is created.</h2>
      <p id="modalSubtitle">Your submitted profile details have been saved.</p>
      <div class="recovery-box">
        <h3>Save your recovery code</h3>
        <p>Keep this code in your password manager. You'll need it to reset a forgotten password. This is the only time it will be shown.</p>
        <code id="recoveryCode" tabindex="0" aria-label="Your one-time recovery code"></code>
      </div>
      <div class="saved-details">
        <p>Your submitted details</p>
        <dl><dt>Name</dt><dd id="savedName"></dd><dt>University</dt><dd id="savedUniversity"></dd><dt>Discipline</dt><dd id="savedDiscipline"></dd></dl>
      </div>
      <a id="viewPortalBtn" href="/profile" class="button">View my profile <span aria-hidden="true">↗</span></a>
    </section>
  </div>
  <script>
    let selectedFileName = '';
    let submissionInProgress = false;
    let profileCreated = false;
    let focusBeforeModal;

    function handleFileSelect(e) {
      selectedFileName = e.target.files && e.target.files[0] ? e.target.files[0].name : '';
      e.target.setCustomValidity(selectedFileName.length > 200 ? 'Choose a document with a file name of 200 characters or fewer.' : '');
      document.getElementById('fileNameDisplay').textContent = selectedFileName ? 'File name selected: ' + selectedFileName : 'No document selected.';
    }

    document.getElementById('successModal').addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        const controls = this.querySelectorAll('button, a[href], [tabindex="0"]');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement.classList.contains('modal-box'))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    async function submitCandidate(e) {
      e.preventDefault();
      if (submissionInProgress || profileCreated || !document.getElementById('builderForm').reportValidity()) return;
      const button = document.getElementById('submitButton');
      const error = document.getElementById('formError');
      const payload = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
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
      submissionInProgress = true;
      focusBeforeModal = document.activeElement;
      button.disabled = true;
      button.textContent = 'Creating profile…';
      error.hidden = true;
      document.getElementById('builderForm').setAttribute('aria-busy', 'true');
      try {
        const res = await fetch('/api/candidate/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.status === 409 ? 'This email already has an account. Sign in to continue.' : 'We couldn’t create your profile. Check your details and try again.');
        const data = await res.json();
        if (!data.profile || !data.recoveryCode) throw new Error('Your account response was incomplete. Try signing in to check whether your profile was created.');
        profileCreated = true;
        document.getElementById('password').value = '';
        document.getElementById('recoveryCode').textContent = data.recoveryCode;
        document.getElementById('modalSubtitle').textContent = 'Thanks, ' + payload.name + '. Your submitted profile details have been saved.';
        document.getElementById('savedName').textContent = payload.name;
        document.getElementById('savedUniversity').textContent = payload.university;
        document.getElementById('savedDiscipline').textContent = payload.discipline;
        document.getElementById('successModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.querySelector('#successModal .modal-box').focus();
      } catch (err) {
        error.textContent = err.message || 'We couldn’t create your profile. Your entries are still here. Please try again.';
        error.hidden = false;
      } finally {
        submissionInProgress = false;
        button.disabled = profileCreated;
        button.innerHTML = profileCreated ? 'Profile created' : 'Create my profile <span aria-hidden="true">↗</span>';
        document.getElementById('builderForm').removeAttribute('aria-busy');
      }
    }
  </script>
</body>
</html>`;
}
