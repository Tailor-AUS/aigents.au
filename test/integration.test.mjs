import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEAM_KEY = '0123456789abcdef'.repeat(3);
const PASSWORD = 'Synthetic-student-password-2026';
const NEW_PASSWORD = 'Replacement-student-password-2026';

async function availablePort() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

function cookieFrom(response, name) {
  const header = response.headers.getSetCookie().find(value => value.startsWith(`${name}=`));
  assert.ok(header, `response must set ${name}`);
  assert.match(header, /;\s*HttpOnly/i, `${name} must be inaccessible to JavaScript`);
  assert.match(header, /;\s*SameSite=(?:Lax|Strict)/i, `${name} must limit cross-site use`);
  return header.split(';')[0];
}

async function harness() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aigents-http-test-'));
  const port = await availablePort();
  const base = `http://127.0.0.1:${port}`;
  let child;
  let logs = '';
  async function stop() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const stopped = once(child, 'exit');
    child.kill();
    await Promise.race([stopped, delay(5000, undefined, { ref: false })]);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await Promise.race([stopped, delay(2000, undefined, { ref: false })]);
    }
    assert.ok(child.exitCode !== null || child.signalCode !== null, 'test server must terminate');
  }
  async function start() {
    logs = '';
    child = spawn(process.execPath, ['src/server.mjs'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, STORAGE_DRIVER: 'file', NODE_ENV: 'test', TEAM_ACCESS_KEY: TEAM_KEY },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
    child.stderr.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
    let spawnError;
    child.on('error', error => { spawnError = error; });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`Test server exited ${child.exitCode}: ${logs}`);
      try {
        const response = await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(400) });
        if (response.ok && /application\/json/i.test(response.headers.get('content-type') || '')) return;
      } catch { /* Bounded readiness polling handles connection refusal during startup. */ }
      await delay(100);
    }
    throw new Error(`Test server did not become ready at /healthz: ${logs}`);
  }
  async function request(route, { method = 'GET', body, cookie, headers = {}, raw } = {}) {
    const response = await fetch(`${base}${route}`, {
      method,
      headers: {
        ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}), ...headers,
      },
      body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual', signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    let data;
    if (/application\/json/i.test(response.headers.get('content-type') || '')) {
      assert.doesNotThrow(() => { data = JSON.parse(text); }, `${route} must return valid JSON`);
    }
    return { response, status: response.status, text, data };
  }
  return { base, request, start, stop, async close() {
    await stop();
    assert.ok(path.resolve(dataDir).startsWith(path.join(path.resolve(os.tmpdir()), 'aigents-http-test-')), 'cleanup must stay within this test temporary directory');
    await fs.rm(dataDir, { recursive: true, force: true });
  } };
}

function expectStatus(result, status, context) {
  assert.equal(result.status, status, `${context}: expected HTTP ${status}, received ${result.status}: ${result.text.slice(0, 400)}`);
}

const studentInput = overrides => ({
  name: 'Integration Student', email: 'student-one@example.test', password: PASSWORD,
  university: 'Test University', discipline: 'Mechanical engineering', wam: '84', atar: '97',
  languages: 'Python, SQL', tools: 'SolidWorks', projectTitle: 'Telemetry analysis',
  projectSummary: 'A tested pipeline for processing sensor records.',
  transcriptName: 'private-transcript-test.pdf', bio: 'Engineering student with a working prototype.',
  location: 'Brisbane', availability: 'Two days per week', ...overrides,
});

test('HTTP student and employer journeys remain secure and durable across a server restart', { timeout: 120000 }, async t => {
  const app = await harness();
  t.after(() => app.close());
  await app.start();
  const request = app.request;

  for (const route of ['/', '/build']) {
    const page = await request(route);
    expectStatus(page, 200, `load ${route}`);
    assert.match(page.response.headers.get('content-type'), /text\/html/i);
    assert.match(page.text, /aigents/i);
  }
  expectStatus(await request('/api/profile'), 401, 'anonymous private profile read');
  expectStatus(await request('/api/profile', { method: 'PATCH', body: studentInput() }), 401, 'anonymous profile edit');
  expectStatus(await request('/api/team/enquiries'), 401, 'anonymous team inbox');
  expectStatus(await request('/api/candidate/register', { method: 'POST', body: studentInput({ email: 'invalid', password: 'short' }) }), 400, 'invalid registration');
  expectStatus(await request('/api/candidate/register', { method: 'POST', body: studentInput({ password: 'short' }) }), 400, 'short password rejected independently of email');
  expectStatus(await request('/api/candidate/register', { method: 'POST', body: studentInput({ university: '' }) }), 400, 'required university');
  expectStatus(await request('/api/candidate/register', { method: 'POST', body: studentInput({ wam: '' }) }), 400, 'required academic result');
  expectStatus(await request('/api/candidate/register', { method: 'POST', body: studentInput(), headers: { Origin: 'https://untrusted.example.test' } }), 403, 'cross-origin registration');
  expectStatus(await request('/api/candidate/register', { method: 'POST', raw: '{' }), 400, 'malformed JSON');
  expectStatus(await request('/api/candidate/register', { method: 'POST', body: { padding: 'x'.repeat(1024 * 1024) } }), 413, 'oversized request');

  const registered = await request('/api/candidate/register', { method: 'POST', body: studentInput() });
  expectStatus(registered, 201, 'student registration');
  let studentCookie = cookieFrom(registered.response, 'aigents_session');
  const firstSessionCookie = studentCookie;
  let profile = registered.data.profile;
  const studentId = profile.id;
  const recoveryCode = registered.data.recoveryCode;
  assert.ok(studentId && typeof studentId === 'string');
  assert.equal(profile.sharingEnabled, false, 'profiles must start private');
  assert.equal(new URL(registered.data.profileUrl, app.base).pathname, '/profile', 'registration should open the private profile dashboard');
  expectStatus(await request('/profile', { cookie: studentCookie }), 200, 'registration destination loads for its owner');
  assert.ok(typeof recoveryCode === 'string' && recoveryCode.length >= 16, 'registration must provide a recovery code');
  assert.ok(!JSON.stringify(profile).includes(PASSWORD), 'profile response must not contain the password');
  expectStatus(await request(`/students/${studentId}`), 404, 'unshared profile page');
  expectStatus(await request(`/api/students/${studentId}`), 404, 'unshared profile API');
  const owner = await request('/api/profile', { cookie: studentCookie });
  expectStatus(owner, 200, 'owner profile read');
  assert.equal(owner.data.profile.id, studentId);
  assert.deepEqual(owner.data.enquiries, []);
  profile = owner.data.profile;

  expectStatus(await request('/api/candidate/register', { method: 'POST', body: studentInput({ email: 'STUDENT-ONE@EXAMPLE.TEST' }) }), 409, 'normalized email collision');
  const sameName = await request('/api/candidate/register', { method: 'POST', body: studentInput({ email: 'student-two@example.test' }) });
  expectStatus(sameName, 201, 'second student with same name');
  const secondId = sameName.data.profile.id;
  const secondCookie = cookieFrom(sameName.response, 'aigents_session');
  assert.notEqual(secondId, studentId, 'same-name students must have separate IDs');
  assert.equal((await request('/api/profile', { cookie: secondCookie })).data.profile.id, secondId, 'session must select only its own profile');

  const xss = '<img src=x onerror="alert(1)">';
  const initialVersion = profile.version;
  assert.ok(initialVersion !== undefined, 'editable profile must include a version');
  const edits = { ...studentInput(), name: 'Updated Integration Student', projectSummary: `Safe project text ${xss}`, sharingEnabled: true, version: initialVersion };
  delete edits.password;
  delete edits.email;
  const changed = await request('/api/profile', { method: 'PATCH', body: edits, cookie: studentCookie });
  expectStatus(changed, 200, 'owner update and opt-in');
  profile = changed.data.profile;
  assert.equal(profile.name, edits.name);
  assert.equal(profile.sharingEnabled, true);
  assert.notEqual(profile.version, initialVersion, 'successful edit must advance the version');
  expectStatus(await request('/api/profile', { method: 'PATCH', body: { ...edits, name: 'Stale overwrite' }, cookie: studentCookie }), 409, 'stale update');
  expectStatus(await request('/api/profile', { method: 'PATCH', body: { ...edits, version: profile.version }, cookie: studentCookie, headers: { Origin: 'https://untrusted.example.test' } }), 403, 'cross-origin authenticated edit');
  const attackerEdit = await request('/api/profile', { method: 'PATCH', body: { ...edits, id: studentId, version: profile.version, name: 'Attacker overwrite' }, cookie: secondCookie });
  assert.ok([400, 409].includes(attackerEdit.status), 'another student cannot use the victim version to edit a profile');
  assert.equal((await request('/api/profile', { cookie: studentCookie })).data.profile.name, edits.name, 'another session must not alter the victim');

  const publicResult = await request(`/api/students/${studentId}`);
  expectStatus(publicResult, 200, 'shared public profile');
  assert.equal(publicResult.data.profile.name, edits.name);
  for (const field of ['email', 'password', 'passwordHash', 'passwordSalt', 'recoveryCode', 'recoveryHash', 'transcriptName', 'wam', 'atar']) {
    assert.equal(Object.hasOwn(publicResult.data.profile, field), false, `public profile must redact ${field}`);
  }
  const publicPage = await request(`/students/${studentId}`);
  expectStatus(publicPage, 200, 'shared public page');
  assert.ok(!publicPage.text.includes(xss), 'public HTML must not contain executable submitted markup');
  assert.ok(publicPage.text.includes('&lt;img'), 'submitted markup must be displayed as escaped text');
  assert.ok(!publicPage.text.includes('student-one@example.test'), 'public page must not expose student email');
  assert.ok(!publicPage.text.includes('private-transcript-test.pdf'), 'public page must not expose transcript metadata');

  const enquiryInput = { company: 'Integration Engineering', contactName: 'Test Employer', email: 'employer@example.test', projectTitle: 'Sensor reporting project', description: 'Help build and test a repeatable reporting workflow.', consent: true };
  expectStatus(await request('/api/enquiries', { method: 'POST', body: { ...enquiryInput, consent: false } }), 400, 'enquiry requires consent');
  expectStatus(await request('/api/enquiries', { method: 'POST', body: { ...enquiryInput, company: '' } }), 400, 'enquiry requires company');
  expectStatus(await request('/api/enquiries', { method: 'POST', body: { ...enquiryInput, studentId: secondId } }), 404, 'private student cannot receive public enquiries');
  const generic = await request('/api/enquiries', { method: 'POST', body: enquiryInput });
  expectStatus(generic, 201, 'general enquiry');
  assert.equal(generic.data.status, 'received');
  const targeted = await request('/api/enquiries', { method: 'POST', body: { ...enquiryInput, studentId, projectTitle: 'Targeted sensor project' } });
  expectStatus(targeted, 201, 'targeted enquiry');
  assert.equal(targeted.data.status, 'received');
  assert.notEqual(targeted.data.id, generic.data.id);
  assert.deepEqual((await request('/api/profile', { cookie: studentCookie })).data.enquiries.map(item => item.id), [targeted.data.id], 'student inbox includes only targeted enquiries');
  assert.deepEqual((await request('/api/profile', { cookie: secondCookie })).data.enquiries, [], 'another student cannot read targeted enquiries');
  expectStatus(await request('/api/team/enquiries', { cookie: studentCookie }), 401, 'student session cannot read team inbox');
  expectStatus(await request('/api/team/login', { method: 'POST', body: { accessKey: 'incorrect-test-key' } }), 401, 'invalid team credential');
  const teamLogin = await request('/api/team/login', { method: 'POST', body: { accessKey: TEAM_KEY } });
  expectStatus(teamLogin, 200, 'team login');
  const teamCookie = cookieFrom(teamLogin.response, 'aigents_team');
  expectStatus(await request('/api/profile', { cookie: teamCookie }), 401, 'team cookie is not a student session');
  assert.equal((await request('/api/profile', { cookie: `${studentCookie}; ${teamCookie}` })).data.profile.id, studentId, 'team login must not replace a student session in the same browser');
  expectStatus(await request('/api/profile', { method: 'PATCH', body: { ...edits, version: profile.version }, cookie: teamCookie }), 401, 'team session cannot edit students');
  const teamInbox = await request('/api/team/enquiries', { cookie: teamCookie });
  expectStatus(teamInbox, 200, 'team inbox');
  assert.deepEqual(teamInbox.data.enquiries.map(item => item.id).sort(), [generic.data.id, targeted.data.id].sort());

  await app.stop();
  await app.start();
  const afterRestart = await request('/api/profile', { cookie: studentCookie });
  expectStatus(afterRestart, 200, 'student session survives server restart');
  assert.equal(afterRestart.data.profile.name, edits.name, 'saved edits survive restart');
  assert.equal(afterRestart.data.profile.sharingEnabled, true);
  assert.deepEqual(afterRestart.data.enquiries.map(item => item.id), [targeted.data.id], 'targeted enquiry survives restart');
  expectStatus(await request(`/students/${studentId}`), 200, 'public sharing survives restart');
  const teamAfterRestart = await request('/api/team/enquiries', { cookie: teamCookie });
  expectStatus(teamAfterRestart, 200, 'team session survives restart');
  assert.deepEqual(teamAfterRestart.data.enquiries.map(item => item.id).sort(), [generic.data.id, targeted.data.id].sort(), 'all enquiries survive restart');

  expectStatus(await request('/api/session/login', { method: 'POST', body: { email: 'student-one@example.test', password: 'wrong-password-test' } }), 401, 'wrong student password');
  const login = await request('/api/session/login', { method: 'POST', body: { email: 'student-one@example.test', password: PASSWORD } });
  expectStatus(login, 200, 'password login after restart');
  studentCookie = cookieFrom(login.response, 'aigents_session');
  expectStatus(await request('/api/session/logout', { method: 'POST', body: {}, cookie: studentCookie }), 200, 'logout');
  expectStatus(await request('/api/profile', { cookie: studentCookie }), 401, 'logout invalidates captured session');
  expectStatus(await request('/api/profile', { cookie: firstSessionCookie }), 200, 'separate earlier session remains valid before account recovery');
  const recovered = await request('/api/session/recover', { method: 'POST', body: { email: 'student-one@example.test', recoveryCode, password: NEW_PASSWORD } });
  expectStatus(recovered, 200, 'account recovery');
  assert.ok(recovered.data.recoveryCode && recovered.data.recoveryCode !== recoveryCode, 'recovery must rotate the recovery code');
  expectStatus(await request('/api/profile', { cookie: firstSessionCookie }), 401, 'recovery revokes earlier sessions');
  expectStatus(await request('/api/session/login', { method: 'POST', body: { email: 'student-one@example.test', password: PASSWORD } }), 401, 'recovery replaces old password');
  expectStatus(await request('/api/session/recover', { method: 'POST', body: { email: 'student-one@example.test', recoveryCode, password: PASSWORD } }), 401, 'used recovery code is invalid');
  const newLogin = await request('/api/session/login', { method: 'POST', body: { email: 'student-one@example.test', password: NEW_PASSWORD } });
  expectStatus(newLogin, 200, 'new password login');
  studentCookie = cookieFrom(newLogin.response, 'aigents_session');
  const latest = (await request('/api/profile', { cookie: studentCookie })).data.profile;
  expectStatus(await request('/api/profile', { method: 'PATCH', body: { ...edits, sharingEnabled: false, version: latest.version }, cookie: studentCookie }), 200, 'withdraw public sharing');
  expectStatus(await request(`/students/${studentId}`), 404, 'withdrawing sharing hides public page');
  expectStatus(await request(`/api/students/${studentId}`), 404, 'withdrawing sharing hides public API');
  expectStatus(await request('/api/team/logout', { method: 'POST', body: {}, cookie: teamCookie }), 200, 'team logout');
  expectStatus(await request('/api/team/enquiries', { cookie: teamCookie }), 401, 'team logout invalidates captured team session');
  expectStatus(await request('/api/profile', { cookie: studentCookie }), 200, 'team logout leaves student session valid');
});
