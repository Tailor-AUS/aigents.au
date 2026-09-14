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

async function availablePort() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function harness(t) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aigents-collective-http-'));
  const port = await availablePort();
  const base = `http://127.0.0.1:${port}`;
  let logs = '';
  const child = spawn(process.execPath, ['src/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, STORAGE_DRIVER: 'file', NODE_ENV: 'test', TEAM_ACCESS_KEY: TEAM_KEY },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
  child.stderr.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const stopped = once(child, 'exit');
      child.kill();
      await Promise.race([stopped, delay(5000, undefined, { ref: false })]);
    }
    assert.ok(path.resolve(dataDir).startsWith(path.join(path.resolve(os.tmpdir()), 'aigents-collective-http-')), 'cleanup must stay within this test temporary directory');
    await fs.rm(dataDir, { recursive: true, force: true });
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Test server exited ${child.exitCode}: ${logs}`);
    try { if ((await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(400) })).ok) break; }
    catch { /* Bounded readiness polling handles connection refusal during startup. */ }
    await delay(100);
  }
  const jars = {};
  async function request(who, route, { method = 'GET', body } = {}) {
    jars[who] ??= {};
    const cookie = Object.entries(jars[who]).map(([name, value]) => `${name}=${value}`).join('; ');
    const response = await fetch(`${base}${route}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual', signal: AbortSignal.timeout(10000),
    });
    for (const header of response.headers.getSetCookie()) {
      const [name, value] = header.split(';')[0].split('=');
      jars[who][name] = value;
    }
    const text = await response.text();
    let data;
    if (/application\/json/i.test(response.headers.get('content-type') || '')) data = JSON.parse(text);
    return { status: response.status, text, data, location: response.headers.get('location') };
  }
  return { request };
}

function expectStatus(result, status, context) {
  assert.equal(result.status, status, `${context}: expected HTTP ${status}, received ${result.status}: ${result.text.slice(0, 300)}`);
}

/**
 * Reads the forms an operator page actually rendered and builds the payload its own script
 * would send, so a broken form is caught here rather than in the browser.
 */
function readForms(html) {
  const attributes = source => Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(item => [item[1], item[2]]));
  const decode = value => value.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)].map(match => {
    const form = attributes(match[1]);
    const fields = {};
    for (const input of match[2].matchAll(/<input\b([^>]*)>/g)) {
      const field = attributes(input[1]);
      if (field.name) fields[field.name] = field.type === 'number' ? Number(field.value ?? '') : (field.value ?? '');
    }
    for (const area of match[2].matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/g)) {
      const field = attributes(area[1]);
      if (field.name) fields[field.name] = decode(area[2]);
    }
    for (const select of match[2].matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
      const field = attributes(select[1]);
      const chosen = select[2].match(/<option value="([^"]*)"\s+selected/);
      if (field.name) fields[field.name] = chosen ? chosen[1] : '';
    }
    return { api: form['data-api'], splitsOutputs: Boolean(form['data-outputs']), seedsAnax: Boolean(form['data-seed']), fields };
  });
}
function payloadFor(form, overrides = {}) {
  const payload = { ...form.fields, ...overrides };
  if (form.splitsOutputs && typeof payload.deliverables === 'string') payload.deliverables = payload.deliverables.split(/\n+/).map(item => item.trim()).filter(Boolean);
  if (form.seedsAnax) payload.seedAnax = true;
  return payload;
}

const studentInput = overrides => ({
  name: 'Campus Student', email: 'campus-one@example.test', password: PASSWORD,
  university: 'UQ', discipline: 'Mechanical engineering', wam: '84', ...overrides,
});

test('community, project and operator pages are reachable at their own addresses', { timeout: 120000 }, async t => {
  const { request } = await harness(t);

  for (const route of ['/community', '/projects/some-project']) {
    const anonymous = await request('anon', route);
    expectStatus(anonymous, 303, `anonymous ${route}`);
    assert.equal(anonymous.location, '/signin', `${route} must send a signed-out student to sign in`);
  }
  const operatorRedirect = await request('anon', '/team/projects');
  expectStatus(operatorRedirect, 303, 'anonymous /team/projects');
  assert.equal(operatorRedirect.location, '/team', 'the operator workspace must send a signed-out operator to team sign-in');
  for (const route of ['/api/community', '/api/projects/some-project', '/api/team/projects']) {
    expectStatus(await request('anon', route), 401, `anonymous ${route}`);
  }

  expectStatus(await request('student', '/api/candidate/register', { method: 'POST', body: studentInput() }), 201, 'student registration');
  const unjoined = await request('student', '/community');
  expectStatus(unjoined, 200, 'signed-in student community page');
  assert.match(unjoined.text, /self-declared/i, 'the join page must say campus membership is self-declared');
  assert.match(unjoined.text, /\/api\/community\/join/, 'a recognised university must be offered a join form');
  expectStatus(await request('student', '/api/community/join', { method: 'POST', body: { consent: true } }), 200, 'joining a campus');

  // A student whose self-declared university has no collective is guided, not handed a failing form.
  expectStatus(await request('elsewhere', '/api/candidate/register', { method: 'POST', body: studentInput({ email: 'elsewhere@example.test', university: 'Unlisted Test Institute' }) }), 201, 'registration at an unlisted university');
  const unlisted = await request('elsewhere', '/community');
  expectStatus(unlisted, 200, 'unlisted university community page');
  assert.ok(!unlisted.text.includes('/api/community/join'), 'an unlisted university must not be shown a join form that can only fail');
  assert.match(unlisted.text, /The University of Queensland/, 'the unlisted state must list the universities that do have collectives');
  assert.match(unlisted.text, /self-declared/i, 'the unlisted state must explain that universities are self-declared');
  expectStatus(await request('elsewhere', '/api/community/join', { method: 'POST', body: { consent: true } }), 400, 'joining from an unlisted university');

  // Signed-in students can reach their campus from their profile, and operators their workspace.
  assert.match((await request('student', '/profile')).text, /href="\/community"/, 'the profile page must link to the campus community');
  expectStatus(await request('team', '/api/team/login', { method: 'POST', body: { accessKey: TEAM_KEY } }), 200, 'team sign-in');
  assert.match((await request('team', '/team')).text, /href="\/team\/projects"/, 'the team inbox must link to the collective project workspace');

  // Unknown addresses under these prefixes are missing, not method failures.
  expectStatus(await request('student', '/projects/one/two'), 404, 'unknown student project subpath');
  expectStatus(await request('student', '/api/community/unknown'), 404, 'unknown community API path');
  expectStatus(await request('team', '/api/team/projects/one/two/three'), 404, 'unknown operator API path');
  expectStatus(await request('team', '/api/team/projects', { method: 'POST', body: { campusId: 'uq' } }), 400, 'incomplete project brief');
});

test('the operator workspace creates, opens, reviews and completes a project through its own rendered forms', { timeout: 120000 }, async t => {
  const { request } = await harness(t);
  expectStatus(await request('student', '/api/candidate/register', { method: 'POST', body: studentInput() }), 201, 'student registration');
  expectStatus(await request('student', '/api/community/join', { method: 'POST', body: { consent: true } }), 200, 'joining a campus');
  expectStatus(await request('team', '/api/team/login', { method: 'POST', body: { accessKey: TEAM_KEY } }), 200, 'team sign-in');

  const submit = async (form, overrides) => request('team', form.api, { method: 'POST', body: payloadFor(form, overrides) });
  const page = async () => readForms((await request('team', '/team/projects')).text);

  const createForm = (await page()).find(form => form.api === '/api/team/projects' && !form.seedsAnax);
  assert.ok(createForm, 'the operator page must render a create-project form');
  const created = await submit(createForm, {
    campusId: 'uq', title: 'Campus telemetry review', client: 'Test Client', budgetAud: 5000, targetFte: 0.6,
    summary: 'Review a telemetry workflow.', deliverables: 'Draft report\nHandover notes', status: 'preparing',
  });
  expectStatus(created, 201, 'creating a project from the rendered form');
  const projectId = created.data.project.id;
  assert.deepEqual(created.data.project.tasks.map(task => task.title), ['Draft report', 'Handover notes'], 'the outputs textarea must become one task per line');

  const seedForm = (await page()).find(form => form.seedsAnax);
  assert.ok(seedForm, 'an unassigned founding project must offer a university choice');
  const seeded = await submit(seedForm, { campusId: 'uq' });
  expectStatus(seeded, 201, 'assigning the founding project to a university');
  assert.equal(seeded.data.project.id, 'anax-pilot');
  assert.equal(seeded.data.project.status, 'preparing');
  assert.equal(seeded.data.project.budgetAud, 7500);
  assert.ok(!(await page()).some(form => form.seedsAnax), 'the founding project can only be assigned once');

  const editForm = () => page().then(forms => forms.find(form => form.api === `/api/team/projects/${projectId}`));
  expectStatus(await submit(await editForm(), { status: 'recruiting' }), 200, 'opening recruitment from the rendered form');
  const running = await editForm();
  assert.deepEqual(Object.keys(running.fields).sort(), ['status', 'version'], 'a project past preparation must submit only its status');
  expectStatus(await submit(running, { status: 'active' }), 200, 'activating from the rendered form');

  expectStatus(await request('student', `/api/projects/${projectId}/allocation`, { method: 'POST', body: { fte: 0.3 } }), 200, 'student joins the project');
  const tasks = (await request('student', `/api/projects/${projectId}`)).data.project.tasks;
  for (const task of tasks) {
    expectStatus(await request('student', `/api/projects/${projectId}/tasks/${task.id}`, { method: 'POST', body: { action: 'claim' } }), 200, 'claiming an output');
    expectStatus(await request('student', `/api/projects/${projectId}/tasks/${task.id}`, { method: 'POST', body: { action: 'submit', url: 'https://example.test/work', note: 'First version.' } }), 200, 'submitting an output');
  }

  const approvals = () => page().then(forms => forms.filter(form => form.api.startsWith(`/api/team/projects/${projectId}/tasks/`) && form.fields.action === 'approve'));
  const opened = await approvals();
  assert.equal(opened.length, tasks.length, 'the operator page must render an approve control for every submitted output');
  assert.ok(opened.every(form => form.fields.submissionId), 'each review control must name the submission it was rendered from');

  // The student replaces one output while the operator page is still open.
  const replacedTaskId = opened[0].api.split('/').pop();
  expectStatus(await request('student', `/api/projects/${projectId}/tasks/${replacedTaskId}`, { method: 'POST', body: { action: 'submit', note: 'Second version.' } }), 200, 'replacing a submitted output');
  expectStatus(await submit(opened[0]), 409, 'approving from a page opened before the output was replaced');
  expectStatus(await submit(opened[1]), 200, 'approving an output that did not change');

  const reloaded = await approvals();
  assert.equal(reloaded.length, 1, 'only the replaced output is still awaiting review');
  expectStatus(await submit(reloaded[0]), 200, 'approving the replaced output after reloading it');

  const workspace = (await request('team', '/team/projects')).text;
  assert.ok(workspace.includes('Second version.'), 'the operator workspace must show the submitted output it signed off');
  expectStatus(await submit(await editForm(), { status: 'completed' }), 200, 'completing the project from the rendered form');
  assert.equal((await request('student', '/api/community')).data.myFte, 0, 'completing a project releases the student capacity');
});
