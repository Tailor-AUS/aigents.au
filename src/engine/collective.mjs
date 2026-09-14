import { randomUUID } from 'node:crypto';
import { ConflictError } from './store.mjs';
import { InputError } from './candidate-manager.mjs';

export const CAMPUSES = [
  ['uq', 'The University of Queensland', 'UQ', ['University of Queensland']],
  ['qut', 'Queensland University of Technology', 'QUT', []],
  ['unsw', 'UNSW Sydney', 'UNSW', ['University of New South Wales']],
  ['sydney', 'The University of Sydney', 'Sydney', ['University of Sydney', 'USYD']],
  ['melbourne', 'The University of Melbourne', 'Melbourne', ['University of Melbourne', 'UniMelb']],
  ['monash', 'Monash University', 'Monash', []],
  ['curtin', 'Curtin University', 'Curtin', []],
  ['uwa', 'The University of Western Australia', 'UWA', ['University of Western Australia']],
  ['adelaide', 'Adelaide University', 'Adelaide', ['University of Adelaide', 'The University of Adelaide']],
].map(([id, name, shortName, aliases]) => ({ id, name, shortName, aliases }));

export const ANAX_DRAFT = {
  title: 'Anax — founding collective project', client: 'Anax Metals', budgetAud: 7500, targetFte: 1,
  summary: 'The founding project for a university student collective. Brief and participation terms are being prepared.',
  deliverables: [], status: 'preparing',
  internalNotes: 'Confirm the client-approved brief, authorised source access, delivery dates, student participation terms and fee allocation before opening this project. The FTE target is workload planning. The project fee is not a confirmed student payout pool. University assignment is required.',
};
export const MAX_STUDENT_UNITS = 30;
const active = project => ['recruiting', 'active'].includes(project.status);
const terminal = project => ['completed', 'cancelled'].includes(project.status);
const now = () => new Date().toISOString();
const safeId = value => typeof value === 'string' && /^[a-z0-9-]{1,80}$/.test(value);
const order = items => items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
function text(value, label, max, optional = false) {
  if (typeof value !== 'string' || value.trim().length > max || (!optional && !value.trim())) throw new InputError(`${label} must be ${optional ? 'no more than' : 'between 1 and'} ${max} characters.`);
  return value.trim();
}
function units(value, max = 10000) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value * 100 > max || Math.abs(Math.round(value * 100) - value * 100) > 1e-8) throw new InputError('Use an FTE amount with at most two decimal places.');
  return Math.round(value * 100);
}
export function campusFor(university) {
  const value = String(university || '').trim().toLowerCase();
  return CAMPUSES.find(campus => [campus.id, campus.name, campus.shortName, ...campus.aliases].some(alias => alias.toLowerCase() === value)) || null;
}
const memberView = profile => ({ id: profile.id, name: profile.name, discipline: profile.discipline });
const allocatedUnits = project => project.allocations.reduce((sum, allocation) => sum + allocation.units, 0);
const studentUnits = (campus, id) => campus.projects.filter(active).reduce((sum, project) => sum + (project.allocations.find(item => item.studentId === id)?.units || 0), 0);

export class Collective {
  constructor(store) { this.store = store; }
  async mutateCampus(campusId, mutate) {
    const catalog = CAMPUSES.find(campus => campus.id === campusId);
    if (!catalog) throw new InputError('Choose a supported university.');
    // One conditional write covers all projects: simultaneous claims cannot oversubscribe
    // either a project or a student's total commitment across this university.
    for (let attempt = 0; attempt < 12; attempt++) {
      const key = `collectives/${campusId}`;
      const record = await this.store.get(key);
      const campus = record ? structuredClone(record.data) : { id: campusId, members: [], projects: [] };
      const result = mutate(campus);
      try {
        await this.store.put(key, campus, record ? { ifMatch: record.etag } : { ifNoneMatch: true });
        return result;
      } catch (error) { if (!(error instanceof ConflictError)) throw error; }
    }
    throw new InputError('The team is changing quickly. Please reload and try again.', 409);
  }
  async membership(profile) { return (await this.store.get(`campus-memberships/${profile.id}`))?.data || null; }
  async context(profile) {
    const membership = await this.membership(profile);
    if (!membership) throw new InputError('Join your university community first.', 403);
    const campus = (await this.store.get(`collectives/${membership.campusId}`))?.data;
    if (!campus?.members.some(member => member.id === profile.id)) throw new InputError('Finish joining your university community.', 403);
    return { membership, campus, catalog: CAMPUSES.find(item => item.id === membership.campusId) };
  }
  async join(profile, body) {
    if (body.consent !== true) throw new InputError('Confirm that your name and course can be shared within your university.');
    const selected = campusFor(profile.university);
    if (!selected) throw new InputError('Set a supported university on your profile before joining.');
    const key = `campus-memberships/${profile.id}`;
    let membership = await this.membership(profile);
    if (!membership) {
      try {
        membership = (await this.store.put(key, { campusId: selected.id, joinedAt: now() }, { ifNoneMatch: true })).data;
      } catch (error) { if (!(error instanceof ConflictError)) throw error; membership = await this.membership(profile); }
    }
    if (membership.campusId !== selected.id) throw new InputError('Your account already belongs to another university community.', 409);
    await this.mutateCampus(membership.campusId, campus => {
      const index = campus.members.findIndex(member => member.id === profile.id);
      if (index < 0) campus.members.push(memberView(profile)); else campus.members[index] = memberView(profile);
    });
    return membership;
  }
  projectView(project, campus, { workspace = false, operator = false } = {}) {
    const view = {
      id: project.id, campusId: campus.id, title: project.title, client: project.client, budgetAud: project.budgetAud,
      targetFte: project.targetUnits / 100, allocatedFte: allocatedUnits(project) / 100,
      status: project.status, summary: project.summary, deliverables: project.deliverables, version: project.version, createdAt: project.createdAt,
      allocations: project.allocations.map(item => ({ studentId: item.studentId, name: campus.members.find(member => member.id === item.studentId)?.name || 'Student', fte: item.units / 100 })),
      tasks: project.tasks.map(task => ({ id: task.id, title: task.title, status: task.status, assigneeId: task.assigneeId,
        assigneeName: campus.members.find(member => member.id === task.assigneeId)?.name || '', ...((workspace || operator) && task.submission ? { submission: task.submission } : {}) })),
    };
    if (operator) view.internalNotes = project.internalNotes || '';
    return view;
  }
  async community(profile) {
    const membership = await this.membership(profile);
    const catalog = membership ? CAMPUSES.find(item => item.id === membership.campusId) : campusFor(profile.university);
    const base = { profile, campus: catalog || { id: '', name: profile.university, shortName: profile.university }, campusRecognised: Boolean(catalog),
      universities: CAMPUSES.map(item => ({ id: item.id, name: item.name, shortName: item.shortName })),
      membership: null, members: [], posts: [], projects: [], myFte: 0, maxFte: MAX_STUDENT_UNITS / 100 };
    if (!membership) return base;
    const campus = (await this.store.get(`collectives/${membership.campusId}`))?.data;
    if (!campus?.members.some(item => item.id === profile.id)) return base;
    const posts = order(await this.store.list(`community-posts/${membership.campusId}`)).slice(0, 100).map(post => ({
      id: post.id, authorId: post.authorId, authorName: campus.members.find(member => member.id === post.authorId)?.name || 'Student',
      text: post.text, createdAt: post.createdAt, likeCount: post.likes.length, liked: post.likes.includes(profile.id),
      comments: post.comments.map(comment => ({ id: comment.id, authorName: campus.members.find(member => member.id === comment.authorId)?.name || 'Student', text: comment.text, createdAt: comment.createdAt })),
    }));
    return { ...base, membership, members: campus.members, posts, projects: order(campus.projects.map(project => this.projectView(project, campus))), myFte: studentUnits(campus, profile.id) / 100 };
  }
  async projectContext(profile, id) {
    if (!safeId(id)) throw new InputError('Project not found.', 404);
    const { membership, campus, catalog } = await this.context(profile);
    const project = campus.projects.find(project => project.id === id);
    if (!project) throw new InputError('Project not found in your university.', 404);
    return { membership, campus, catalog, project };
  }
  async project(profile, id) {
    const { campus, catalog, project } = await this.projectContext(profile, id);
    const memberUnits = project.allocations.find(item => item.studentId === profile.id)?.units || 0;
    const canWork = memberUnits > 0;
    return { profile, campus: catalog, project: this.projectView(project, campus, { workspace: canWork }), memberFte: memberUnits / 100,
      myFte: studentUnits(campus, profile.id) / 100, maxFte: MAX_STUDENT_UNITS / 100, canWork,
      updates: canWork ? project.updates.map(update => ({ id: update.id, authorName: campus.members.find(member => member.id === update.authorId)?.name || 'Student', text: update.text, createdAt: update.createdAt })) : [] };
  }
  async allocate(profile, id, body) {
    const amount = units(body.fte, MAX_STUDENT_UNITS);
    const { membership } = await this.projectContext(profile, id);
    await this.mutateCampus(membership.campusId, campus => {
      const project = campus.projects.find(item => item.id === id);
      if (!active(project)) throw new InputError('This project is not accepting workload commitments.', 409);
      const previous = project.allocations.find(item => item.studentId === profile.id)?.units || 0;
      if (studentUnits(campus, profile.id) - previous + amount > MAX_STUDENT_UNITS) throw new InputError(`Your total active commitment cannot exceed ${(MAX_STUDENT_UNITS / 100).toFixed(2)} FTE.`, 409);
      if (allocatedUnits(project) - previous + amount > project.targetUnits) throw new InputError('There is not enough unallocated FTE on this project.', 409);
      if (amount === 0 && project.tasks.some(task => task.assigneeId === profile.id && task.status !== 'done')) throw new InputError('Unassign your unfinished tasks before leaving this project.', 409);
      project.allocations = project.allocations.filter(item => item.studentId !== profile.id);
      if (amount) project.allocations.push({ studentId: profile.id, units: amount });
      project.version = randomUUID();
    });
    return this.project(profile, id);
  }
  async post(profile, body) {
    const value = text(body.text, 'Post', 2000);
    const { membership } = await this.context(profile);
    const post = { id: randomUUID(), authorId: profile.id, text: value, createdAt: now(), likes: [], comments: [] };
    await this.store.put(`community-posts/${membership.campusId}/${post.id}`, post, { ifNoneMatch: true });
    return { id: post.id };
  }
  async mutatePost(profile, id, mutate) {
    if (!safeId(id)) throw new InputError('Post not found.', 404);
    const { membership } = await this.context(profile);
    const key = `community-posts/${membership.campusId}/${id}`;
    for (let attempt = 0; attempt < 12; attempt++) {
      const record = await this.store.get(key);
      if (!record) throw new InputError('Post not found.', 404);
      const post = structuredClone(record.data);
      mutate(post);
      try { await this.store.put(key, post, { ifMatch: record.etag }); return { ok: true }; }
      catch (error) { if (!(error instanceof ConflictError)) throw error; }
    }
    throw new InputError('Please reload this post and try again.', 409);
  }
  async react(profile, id) {
    return this.mutatePost(profile, id, post => { post.likes = post.likes.includes(profile.id) ? post.likes.filter(item => item !== profile.id) : [...post.likes, profile.id]; });
  }
  async comment(profile, id, body) {
    const value = text(body.text, 'Comment', 1000);
    return this.mutatePost(profile, id, post => {
      if (post.comments.length >= 200) throw new InputError('This discussion is full. Start a new post.', 409);
      post.comments.push({ id: randomUUID(), authorId: profile.id, text: value, createdAt: now() });
    });
  }
  async task(profile, id, taskId, body) {
    const { membership } = await this.projectContext(profile, id);
    await this.mutateCampus(membership.campusId, campus => {
      const project = campus.projects.find(item => item.id === id);
      if (!active(project) || !project.allocations.some(item => item.studentId === profile.id)) throw new InputError('Join this project with available FTE before working on tasks.', 403);
      const task = project.tasks.find(item => item.id === taskId);
      if (!task) throw new InputError('Task not found.', 404);
      if (body.action === 'claim') {
        if (task.assigneeId || task.status !== 'open') throw new InputError('This task has already been claimed.', 409);
        task.assigneeId = profile.id; task.status = 'claimed';
      } else {
        if (task.assigneeId !== profile.id) throw new InputError('Only the assigned student can change this task.', 403);
        if (task.status === 'done') throw new InputError('This output has been approved. Ask the team to reopen it.', 409);
        if (body.action === 'unassign') {
          if (task.status === 'submitted') throw new InputError('This output is with a reviewer. Ask for it to be reopened before releasing the task.', 409);
          task.assigneeId = ''; task.status = 'open'; delete task.submission;
        } else if (body.action === 'start') {
          if (!['claimed', 'in_progress'].includes(task.status)) throw new InputError('This task is awaiting review.', 409);
          task.status = 'in_progress';
        } else if (body.action === 'submit') {
          if (!['claimed', 'in_progress', 'submitted'].includes(task.status)) throw new InputError('This task is not ready to submit.', 409);
          const url = text(body.url || '', 'Output link', 2000, true);
          const note = text(body.note || '', 'Output note', 2000, true);
          if (!url && !note) throw new InputError('Add an output link or a handover note.');
          if (url) { let parsed; try { parsed = new URL(url); } catch { throw new InputError('Use a complete http or https output link.'); } if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new InputError('Use a complete http or https output link.'); }
          task.submission = { id: randomUUID(), url, note, submittedAt: now() }; task.status = 'submitted';
        } else throw new InputError('Unknown task action.');
      }
      project.version = randomUUID();
    });
    return { ok: true };
  }
  async update(profile, id, body) {
    const value = text(body.text, 'Update', 2000);
    const { membership } = await this.projectContext(profile, id);
    await this.mutateCampus(membership.campusId, campus => {
      const project = campus.projects.find(item => item.id === id);
      if (!active(project) || !project.allocations.some(item => item.studentId === profile.id)) throw new InputError('Only this project’s active team can post updates.', 403);
      if (project.updates.length >= 1000) throw new InputError('This workspace has reached its update limit.', 409);
      project.updates.push({ id: randomUUID(), authorId: profile.id, text: value, createdAt: now() });
      project.version = randomUUID();
    });
    return { ok: true };
  }
  async admin() {
    const campuses = await this.store.list('collectives');
    return { campuses: CAMPUSES, projects: order(campuses.flatMap(campus => campus.projects.map(project => this.projectView(project, campus, { operator: true })))), anaxDraft: ANAX_DRAFT };
  }
  async createProject(input) {
    // Seeding Anax only asks the operator for a university: everything it does not supply falls
    // back to the fixed public teaser, so the founding project cannot gain invented terms.
    const body = input.seedAnax === true ? { ...ANAX_DRAFT, ...input } : input;
    const campusId = text(body.campusId, 'University', 40);
    if (!CAMPUSES.some(campus => campus.id === campusId)) throw new InputError('Choose the university that will host this project.');
    if (!['preparing', 'recruiting'].includes(body.status)) throw new InputError('Create a project as preparing or recruiting.');
    if (!Array.isArray(body.deliverables) || body.deliverables.length > 60) throw new InputError('Add up to 60 outputs.');
    const targetUnits = units(body.targetFte);
    if (targetUnits < 1) throw new InputError('Set a workload greater than zero.');
    if (typeof body.budgetAud !== 'number' || !Number.isFinite(body.budgetAud) || body.budgetAud < 0 || body.budgetAud > 10_000_000 || Math.abs(Math.round(body.budgetAud * 100) - body.budgetAud * 100) > 1e-6) throw new InputError('Enter a valid project budget in Australian dollars.');
    const project = { id: body.seedAnax === true ? 'anax-pilot' : randomUUID(), campusId,
      title: text(body.title, 'Title', 180), client: text(body.client, 'Client', 160), budgetAud: body.budgetAud, targetUnits,
      summary: text(body.summary, 'Brief', 4000), deliverables: body.deliverables.map(item => text(item, 'Output', 500)),
      status: body.status, allocations: [], tasks: [], updates: [], version: randomUUID(), createdAt: now(),
      internalNotes: body.seedAnax === true ? ANAX_DRAFT.internalNotes : '',
    };
    if (project.status === 'recruiting' && !project.deliverables.length) throw new InputError('Add the agreed outputs before opening participation.');
    if (body.seedAnax === true && project.status !== 'preparing') throw new InputError('Create Anax as preparing until its brief and participation terms are confirmed.');
    project.tasks = project.deliverables.map(title => ({ id: randomUUID(), title, status: 'open', assigneeId: '' }));
    const indexKey = `collective-project-locations/${project.id}`;
    // Anax has one immutable placement so its budget cannot be duplicated in multiple campuses.
    try { await this.store.put(indexKey, { campusId }, { ifNoneMatch: true }); }
    catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      const location = await this.store.get(indexKey);
      if (location.data.campusId !== campusId) throw new InputError('Anax is already assigned to another university.', 409);
    }
    return this.mutateCampus(campusId, campus => {
      if (campus.projects.some(item => item.id === project.id)) throw new InputError('This project already exists.', 409);
      campus.projects.push(project);
      return this.projectView(project, campus, { operator: true });
    });
  }
  async projectLocation(id) {
    if (!safeId(id)) throw new InputError('Project not found.', 404);
    const record = await this.store.get(`collective-project-locations/${id}`);
    if (!record) throw new InputError('Project not found.', 404);
    return record.data.campusId;
  }
  async setProject(id, body) {
    const campusId = await this.projectLocation(id);
    return this.mutateCampus(campusId, campus => {
      const project = campus.projects.find(item => item.id === id);
      if (!project) throw new InputError('Project not found.', 404);
      if (project.version !== body.version) throw new InputError('This project changed. Reload before updating it.', 409);
      if (!['preparing', 'recruiting', 'active', 'completed', 'cancelled'].includes(body.status)) throw new InputError('Choose a valid project status.');
      const summary = body.summary === undefined ? undefined : text(body.summary, 'Brief', 4000);
      let deliverables;
      if (body.deliverables !== undefined) {
        if (!Array.isArray(body.deliverables) || body.deliverables.length > 60) throw new InputError('Add up to 60 outputs.');
        deliverables = body.deliverables.map(item => text(item, 'Output', 500));
      }
      const summaryChanged = summary !== undefined && summary !== project.summary;
      const outputsChanged = deliverables !== undefined && (deliverables.length !== project.deliverables.length || deliverables.some((item, index) => item !== project.deliverables[index]));
      if (summaryChanged || outputsChanged) {
        if (project.status !== 'preparing' || project.allocations.length) throw new InputError('Only an unstaffed preparing project can have its brief changed.', 409);
        if (summaryChanged) project.summary = summary;
        if (outputsChanged) {
          project.deliverables = deliverables;
          project.tasks = project.deliverables.map(title => ({ id: randomUUID(), title, status: 'open', assigneeId: '' }));
        }
      }
      if (terminal(project) && body.status !== project.status) throw new InputError('Closed projects cannot be reopened. Create a new phase to plan fresh capacity.', 409);
      if (body.status === 'preparing' && project.allocations.length) throw new InputError('A staffed project cannot return to preparing.', 409);
      if (['recruiting', 'active'].includes(body.status) && !project.tasks.length) throw new InputError('Add agreed outputs before opening this project.');
      if (body.status === 'completed' && (!project.tasks.length || project.tasks.some(task => task.status !== 'done'))) throw new InputError('Approve every output before completing the project.', 409);
      project.status = body.status; project.version = randomUUID();
      return this.projectView(project, campus, { operator: true });
    });
  }
  async reviewTask(id, taskId, body) {
    const campusId = await this.projectLocation(id);
    await this.mutateCampus(campusId, campus => {
      const project = campus.projects.find(item => item.id === id);
      if (!project || !active(project)) throw new InputError('This project is not active.', 409);
      const task = project.tasks.find(item => item.id === taskId);
      if (!task) throw new InputError('Task not found.', 404);
      if (!['approve', 'reopen'].includes(body.action)) throw new InputError('Choose approve or request changes.');
      if (!['submitted', 'done'].includes(task.status)) throw new InputError('This output is not ready for that review action.', 409);
      if (body.action === 'approve' && task.status !== 'submitted') throw new InputError('This output is not ready for that review action.', 409);
      // A student may replace their output at any time before sign-off. Reviewing without naming
      // the submission that was read would approve or reject work the reviewer never saw.
      if (task.submission?.id && body.submissionId !== task.submission.id) throw new InputError('This output changed since you opened it. Reload the submission before reviewing it.', 409);
      if (body.action === 'approve') task.status = 'done';
      else if (project.allocations.some(item => item.studentId === task.assigneeId)) task.status = 'in_progress';
      else { task.status = 'open'; task.assigneeId = ''; delete task.submission; }
      project.version = randomUUID();
    });
    return { ok: true };
  }
}
