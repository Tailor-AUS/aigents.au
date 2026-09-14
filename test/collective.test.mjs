import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { FileStore } from '../src/engine/store.mjs';
import { Collective } from '../src/engine/collective.mjs';

const student = (name, university = 'UQ') => ({ id: randomUUID(), name, university, discipline: 'Mechanical engineering' });
const brief = overrides => ({
  campusId: 'uq', title: 'Synthetic engineering project', client: 'Synthetic Client',
  budgetAud: 7500, targetFte: 1, summary: 'Test an engineering workflow using synthetic inputs.',
  deliverables: ['A reviewed working draft', 'A source and open-input register'], status: 'recruiting',
  ...overrides,
});

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'aigents-collective-'));
  t.after(async () => {
    assert.ok(path.resolve(directory).startsWith(path.join(path.resolve(os.tmpdir()), 'aigents-collective-')));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const store = new FileStore(directory);
  await store.ready();
  return {
    collective: new Collective(store),
    restart: () => new Collective(new FileStore(directory)),
  };
}

async function rejectsOperation(operation, description) {
  await assert.rejects(operation, error => {
    assert.ok([400, 401, 403, 404, 409, 422].includes(error.status), `${description} must fail with a deliberate validation/access/conflict error, not an implementation exception`);
    return true;
  }, description);
}

async function joinAll(collective, profiles) {
  for (const profile of profiles) await collective.join(profile, { consent: true });
}

test('membership requires consent, recognises campus aliases and cannot switch university', async t => {
  const { collective, restart } = await fixture(t);
  const uq = student('UQ member', 'The University of Queensland');
  const uqAlias = student('UQ alias member', 'UQ');
  const qut = student('QUT member', 'Queensland University of Technology');
  await rejectsOperation(() => collective.join(uq, { consent: false }), 'membership requires consent');
  await rejectsOperation(() => collective.join(student('Unknown campus', 'Unrecognised Test University'), { consent: true }), 'unrecognised university cannot join an arbitrary campus');
  assert.equal((await collective.join(uq, { consent: true })).campusId, 'uq');
  assert.equal((await collective.join(uqAlias, { consent: true })).campusId, 'uq');
  assert.equal((await collective.join(qut, { consent: true })).campusId, 'qut');
  await rejectsOperation(() => collective.join({ ...uq, university: 'QUT' }, { consent: true }), 'profile university mismatch cannot move an existing membership');
  assert.equal((await restart().join(uq, { consent: true })).campusId, 'uq', 'original campus membership survives restart');
});

test('community posts, reactions and comments stay inside joined campus membership', async t => {
  const { collective, restart } = await fixture(t);
  const author = student('Post author');
  const peer = student('Campus peer');
  const outsider = student('Other university', 'QUT');
  const unjoined = student('Unjoined student');
  await joinAll(collective, [author, peer, outsider]);
  const marker = `Private campus update ${randomUUID()}`;
  const posted = await collective.post(author, { text: marker });
  assert.ok(posted.id, 'a post has a stable ID');
  await collective.react(peer, posted.id);
  await collective.comment(peer, posted.id, { text: 'A useful campus-specific response.' });
  await rejectsOperation(() => collective.post(unjoined, { text: 'No membership' }), 'unjoined student cannot publish');
  await rejectsOperation(() => collective.react(outsider, posted.id), 'cross-campus reaction');
  await rejectsOperation(() => collective.comment(outsider, posted.id, { text: 'Cross-campus comment' }), 'cross-campus comment');
  await rejectsOperation(() => collective.comment(unjoined, posted.id, { text: 'Unjoined comment' }), 'unjoined comment');
  assert.ok(JSON.stringify(await collective.community(author)).includes(marker), 'joined campus member sees its post');
  assert.ok(!JSON.stringify(await collective.community(outsider)).includes(marker), 'other campus cannot read private post');
  const beforeJoin = await collective.community(unjoined);
  assert.equal(beforeJoin.membership, null, 'unjoined student only receives a join prompt model');
  for (const field of ['members', 'posts', 'projects']) assert.deepEqual(beforeJoin[field], [], `unjoined model must hide campus ${field}`);
  const recovered = JSON.stringify(await restart().community(peer));
  assert.ok(recovered.includes(marker), 'campus post survives a new Collective instance');
  assert.ok(recovered.includes('A useful campus-specific response.'), 'comment survives a new Collective instance');
});

test('0.3 FTE is a total student cap across active projects, with exact hundredth accounting', async t => {
  const { collective, restart } = await fixture(t);
  const member = student('Capacity member');
  await collective.join(member, { consent: true });
  const first = await collective.createProject(brief({ title: 'First project' }));
  const second = await collective.createProject(brief({ title: 'Second project' }));
  const third = await collective.createProject(brief({ title: 'Third project' }));
  await collective.allocate(member, first.id, { fte: 0.2 });
  await collective.allocate(member, second.id, { fte: 0.1 });
  await rejectsOperation(() => collective.allocate(member, third.id, { fte: 0.01 }), 'total capacity over 0.3 FTE');
  await rejectsOperation(() => collective.allocate(member, first.id, { fte: 0.25 }), 'updating an allocation cannot exceed aggregate capacity');
  await rejectsOperation(() => restart().allocate(member, third.id, { fte: 0.01 }), 'capacity reservation survives a new service instance');
  await collective.allocate(member, first.id, { fte: 0.19 });
  await collective.allocate(member, third.id, { fte: 0.01 });
  await rejectsOperation(() => collective.allocate(member, third.id, { fte: 0.02 }), 'hundredth accounting respects exactly 0.3 FTE');
});

test('invalid fractional, negative and excessive allocations never reserve capacity', async t => {
  const { collective } = await fixture(t);
  const member = student('Rounding member');
  await collective.join(member, { consent: true });
  const project = await collective.createProject(brief());
  for (const fte of [0.301, 0.299, 0.001, -0.1, 0.31, NaN, Infinity]) {
    await rejectsOperation(() => collective.allocate(member, project.id, { fte }), `invalid allocation ${String(fte)}`);
  }
  await collective.allocate(member, project.id, { fte: 0.3 });
  const other = await collective.createProject(brief({ title: 'Capacity probe' }));
  await rejectsOperation(() => collective.allocate(member, other.id, { fte: 0.01 }), 'only valid reservation consumes total capacity');
});

test('concurrent joins to different projects cannot exceed one student total capacity', async t => {
  const { collective, restart } = await fixture(t);
  const member = student('Concurrent student');
  await collective.join(member, { consent: true });
  const first = await collective.createProject(brief({ title: 'Concurrent first' }));
  const second = await collective.createProject(brief({ title: 'Concurrent second' }));
  const outcomes = await Promise.allSettled([
    collective.allocate(member, first.id, { fte: 0.2 }),
    restart().allocate(member, second.id, { fte: 0.2 }),
  ]);
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1, 'exactly one concurrent 0.2 reservation can succeed');
  const rejected = outcomes.find(result => result.status === 'rejected');
  assert.ok([400, 409, 422].includes(rejected.reason.status), 'losing request reports a business conflict');
  const winningId = outcomes[0].status === 'fulfilled' ? first.id : second.id;
  await restart().allocate(member, winningId, { fte: 0.3 });
  await rejectsOperation(() => collective.allocate(member, outcomes[0].status === 'fulfilled' ? second.id : first.id, { fte: 0.01 }), 'concurrent result is durable and not overbooked');
});

test('project cannot oversubscribe when two students race for its remaining capacity', async t => {
  const { collective, restart } = await fixture(t);
  const members = Array.from({ length: 5 }, (_, index) => student(`Project member ${index}`));
  await joinAll(collective, members);
  const project = await collective.createProject(brief());
  for (const member of members.slice(0, 3)) await collective.allocate(member, project.id, { fte: 0.3 });
  const outcomes = await Promise.allSettled([
    collective.allocate(members[3], project.id, { fte: 0.1 }),
    restart().allocate(members[4], project.id, { fte: 0.1 }),
  ]);
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1, 'only one final 0.1 reservation may fill the 1.0 FTE project');
  assert.ok([400, 409, 422].includes(outcomes.find(result => result.status === 'rejected').reason.status));
  const filled = (await restart().project(members[0], project.id)).project;
  assert.equal(filled.allocatedFte, 1, '0.3 + 0.3 + 0.3 + 0.1 is exactly 1.0 FTE');
  assert.deepEqual(filled.allocations.map(item => item.fte).sort((a, b) => a - b), [0.1, 0.3, 0.3, 0.3]);
  const losingStudent = outcomes[0].status === 'rejected' ? members[3] : members[4];
  await rejectsOperation(() => restart().allocate(losingStudent, project.id, { fte: 0.01 }), 'full project stays full after restart');
});

test('operator prepares a brief and outputs before opening recruitment, then staffed scope is locked', async t => {
  const { collective, restart } = await fixture(t);
  const member = student('Preparing project member');
  await collective.join(member, { consent: true });
  const draft = await collective.createProject(brief({ status: 'preparing', deliverables: [], summary: 'Initial synthetic planning note.' }));
  assert.deepEqual(draft.tasks, [], 'unagreed outputs do not generate tasks');
  await rejectsOperation(() => collective.setProject(draft.id, { status: 'recruiting', version: draft.version }), 'empty draft cannot recruit');
  await rejectsOperation(() => collective.setProject(draft.id, { status: 'preparing', version: draft.version, summary: 'Must not partially persist', deliverables: 'invalid' }), 'invalid output edit is atomic');
  assert.equal((await collective.project(member, draft.id)).project.summary, draft.summary, 'failed edit leaves the previous brief intact');
  const edited = await collective.setProject(draft.id, {
    status: 'preparing', version: draft.version,
    summary: 'Approved synthetic scope for a documented workflow.',
    deliverables: ['Working prototype', 'Test and handover notes'],
  });
  assert.equal(edited.status, 'preparing');
  assert.notEqual(edited.version, draft.version);
  assert.deepEqual(edited.tasks.map(task => task.title), ['Working prototype', 'Test and handover notes']);
  await rejectsOperation(() => collective.setProject(draft.id, { status: 'recruiting', version: draft.version }), 'stale operator page cannot open a changed draft');
  const opened = await collective.setProject(draft.id, {
    status: 'recruiting', version: edited.version,
    summary: 'Final synthetic brief ready for participation.',
    deliverables: ['Final working prototype', 'Final handover notes'],
  });
  assert.equal(opened.id, draft.id);
  assert.equal(opened.campusId, 'uq');
  assert.equal(opened.budgetAud, 7500);
  assert.deepEqual(opened.tasks.map(task => task.title), ['Final working prototype', 'Final handover notes']);
  await restart().allocate(member, draft.id, { fte: 0.3 });
  await collective.task(member, draft.id, opened.tasks[0].id, { action: 'claim' });
  const staffed = (await collective.project(member, draft.id)).project;
  await rejectsOperation(() => collective.setProject(draft.id, { status: 'recruiting', version: staffed.version, deliverables: ['Replacement that would erase work'] }), 'staffed output editing cannot erase claimed tasks');
  await rejectsOperation(() => collective.setProject(draft.id, { status: 'preparing', version: staffed.version }), 'staffed project cannot return to preparation');
  const retained = (await restart().project(member, draft.id)).project;
  assert.equal(retained.tasks[0].id, opened.tasks[0].id);
  assert.equal(retained.tasks[0].assigneeId, member.id);
  assert.equal(retained.summary, opened.summary);
});

test('four 0.25 FTE students fill one project and terminal status releases their capacity permanently', async t => {
  const { collective, restart } = await fixture(t);
  const members = Array.from({ length: 5 }, (_, index) => student(`Quarter FTE member ${index}`));
  await joinAll(collective, members);
  const project = await collective.createProject(brief());
  await Promise.all(members.slice(0, 4).map(member => restart().allocate(member, project.id, { fte: 0.25 })));
  let current = (await collective.project(members[0], project.id)).project;
  assert.equal(current.allocatedFte, 1, 'four allocations are presented as exactly 1.0 FTE');
  assert.equal(current.targetFte, 1);
  assert.equal((await collective.community(members[0])).myFte, 0.25);
  await rejectsOperation(() => collective.allocate(members[4], project.id, { fte: 0.01 }), 'four quarters fill 1.0 FTE');
  await rejectsOperation(() => collective.setProject(project.id, { status: 'completed', version: current.version }), 'completion requires approved deliverables');
  for (const task of current.tasks) {
    await collective.task(members[0], project.id, task.id, { action: 'claim' });
    await collective.task(members[0], project.id, task.id, { action: 'submit', note: 'Synthetic deliverable ready for review.' });
    await collective.reviewTask(project.id, task.id, { action: 'approve' });
  }
  current = (await collective.project(members[0], project.id)).project;
  const closed = await collective.setProject(project.id, { status: 'completed', version: current.version });
  assert.equal(closed.status, 'completed');
  assert.equal((await restart().community(members[0])).myFte, 0, 'completed project releases student capacity');
  await rejectsOperation(() => collective.setProject(project.id, { status: 'recruiting', version: closed.version }), 'terminal project cannot reopen and reclaim released capacity');
  const next = await collective.createProject(brief({ title: 'New engagement' }));
  await restart().allocate(members[0], next.id, { fte: 0.3 });
  await rejectsOperation(() => collective.allocate(members[4], project.id, { fte: 0.1 }), 'terminal project does not accept new allocations');
  const nextVersion = (await collective.project(members[0], next.id)).project.version;
  const cancelled = await collective.setProject(next.id, { status: 'cancelled', version: nextVersion });
  assert.equal((await restart().community(members[0])).myFte, 0, 'cancelled project also releases student capacity');
  await rejectsOperation(() => collective.setProject(next.id, { status: 'active', version: cancelled.version }), 'cancelled project cannot reopen');
});

test('private projects and workspace actions require matching campus membership and project allocation', async t => {
  const { collective, restart } = await fixture(t);
  const owner = student('Task owner');
  const colleague = student('Other project member');
  const spectator = student('Campus spectator');
  const outsider = student('Other campus member', 'QUT');
  const unjoined = student('Unjoined project visitor');
  await joinAll(collective, [owner, colleague, spectator, outsider]);
  const draft = await collective.createProject(brief({ status: 'preparing', seedAnax: true }));
  await rejectsOperation(() => collective.allocate(owner, draft.id, { fte: 0.2 }), 'preparing project is not ready to recruit');
  await rejectsOperation(() => collective.project(outsider, draft.id), 'cross-campus project read');
  await rejectsOperation(() => collective.project(unjoined, draft.id), 'unjoined project read');
  const opened = await collective.setProject(draft.id, { status: 'recruiting', version: draft.version });
  await rejectsOperation(() => collective.allocate(outsider, opened.id, { fte: 0.2 }), 'cross-campus allocation');
  await rejectsOperation(() => collective.allocate(unjoined, opened.id, { fte: 0.2 }), 'unjoined allocation');
  await collective.allocate(owner, opened.id, { fte: 0.2 });
  await collective.allocate(colleague, opened.id, { fte: 0.2 });
  const model = await collective.project(owner, opened.id);
  const taskId = model.project.tasks[0].id;
  assert.ok(taskId, 'project exposes its starter tasks to an allocated member');
  await rejectsOperation(() => collective.task(spectator, opened.id, taskId, { action: 'claim' }), 'unallocated campus member cannot claim tasks');
  await rejectsOperation(() => collective.update(spectator, opened.id, { text: 'Unallocated update' }), 'unallocated campus member cannot post workspace updates');
  await collective.task(owner, opened.id, taskId, { action: 'claim' });
  await rejectsOperation(() => collective.task(colleague, opened.id, taskId, { action: 'claim' }), 'another member cannot steal a claimed task');
  await rejectsOperation(() => collective.task(colleague, opened.id, taskId, { action: 'start' }), 'another member cannot start the owner task');
  await rejectsOperation(() => collective.task(colleague, opened.id, taskId, { action: 'unassign' }), 'another member cannot unassign the owner task');
  await collective.task(owner, opened.id, taskId, { action: 'start' });
  await rejectsOperation(() => collective.task(owner, opened.id, taskId, { action: 'submit', url: 'javascript:alert(1)', note: 'Invalid link' }), 'unsafe submission URL');
  await collective.task(owner, opened.id, taskId, { action: 'submit', url: 'https://example.test/synthetic-deliverable', note: 'Ready for technical review.' });
  await collective.reviewTask(opened.id, taskId, { action: 'approve' });
  const marker = `Persistent workspace note ${randomUUID()}`;
  await collective.update(owner, opened.id, { text: marker });
  const durable = await restart().project(owner, opened.id);
  assert.ok(JSON.stringify(durable).includes(marker), 'project update survives restart');
  assert.ok(JSON.stringify(durable).includes('https://example.test/synthetic-deliverable'), 'submitted output survives restart');
  assert.equal(durable.project.tasks.find(task => task.id === taskId).status, 'done', 'operator approval survives restart');
  assert.equal(Object.hasOwn(durable.project, 'internalNotes'), false, 'student workspace must not expose operator-only Anax planning notes');
  const spectatorModel = await collective.project(spectator, opened.id);
  assert.equal(spectatorModel.canWork, false);
  assert.deepEqual(spectatorModel.updates, [], 'unallocated members cannot read private workspace updates');
  assert.equal(Object.hasOwn(spectatorModel.project.tasks.find(task => task.id === taskId), 'submission'), false, 'unallocated members cannot read task submissions');
});
