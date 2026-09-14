import { InputError } from './engine/candidate-manager.mjs';
import { Collective } from './engine/collective.mjs';
import { renderCommunityHtml, renderCollectiveProjectHtml } from './views/community.mjs';
import { renderCollectiveAdminHtml } from './views/collective-admin.mjs';

export function createCollectiveRoutes(platform, { readJson, json, html, redirect }) {
  const collective = new Collective(platform.store);
  return async (req, res, pathname, studentCookie, teamCookie) => {
    const operator = pathname === '/team/projects' || pathname === '/api/team/projects' || pathname.startsWith('/api/team/projects/');
    const student = pathname === '/community' || pathname.startsWith('/projects/') || pathname === '/api/community' || pathname.startsWith('/api/community/') || pathname.startsWith('/api/projects/');
    if (!operator && !student) return false;
    if (operator) {
      const auth = await platform.session(teamCookie, 'team');
      if (!auth) {
        if (req.method === 'GET' && pathname === '/team/projects') { redirect(res, '/team'); return true; }
        throw new InputError('Team sign-in is required.', 401);
      }
      if (req.method === 'GET' && ['/team/projects', '/api/team/projects'].includes(pathname)) {
        const model = await collective.admin();
        if (pathname === '/team/projects') html(res, renderCollectiveAdminHtml(model)); else json(res, 200, model);
        return true;
      }
      if (req.method === 'POST' && pathname === '/api/team/projects') { json(res, 201, { project: await collective.createProject(await readJson(req)) }); return true; }
      const project = pathname.match(/^\/api\/team\/projects\/([^/]+)$/);
      if (req.method === 'POST' && project) { json(res, 200, { project: await collective.setProject(project[1], await readJson(req)) }); return true; }
      const task = pathname.match(/^\/api\/team\/projects\/([^/]+)\/tasks\/([^/]+)$/);
      if (req.method === 'POST' && task) { json(res, 200, await collective.reviewTask(task[1], task[2], await readJson(req))); return true; }
      throw new InputError('Page not found.', 404);
    }
    const auth = await platform.session(studentCookie);
    if (!auth) {
      if (req.method === 'GET' && !pathname.startsWith('/api/')) { redirect(res, '/signin'); return true; }
      throw new InputError('Sign in to join your university community.', 401);
    }
    const profile = auth.account.data.profile;
    if (req.method === 'GET' && ['/community', '/api/community'].includes(pathname)) {
      const model = await collective.community(profile);
      if (pathname === '/community') html(res, renderCommunityHtml(model)); else json(res, 200, model);
      return true;
    }
    const project = pathname.match(/^\/(api\/)?projects\/([^/]+)$/);
    if (req.method === 'GET' && project) {
      const model = await collective.project(profile, project[2]);
      if (project[1]) json(res, 200, model); else html(res, renderCollectiveProjectHtml(model));
      return true;
    }
    if (req.method !== 'POST') throw new InputError('Method not allowed.', 405);
    const body = await readJson(req);
    if (pathname === '/api/community/join') json(res, 200, { membership: await collective.join(profile, body) });
    else if (pathname === '/api/community/posts') json(res, 201, await collective.post(profile, body));
    else {
      const post = pathname.match(/^\/api\/community\/posts\/([^/]+)\/(like|comments)$/);
      const allocation = pathname.match(/^\/api\/projects\/([^/]+)\/allocation$/);
      const task = pathname.match(/^\/api\/projects\/([^/]+)\/tasks\/([^/]+)$/);
      const update = pathname.match(/^\/api\/projects\/([^/]+)\/updates$/);
      if (post) json(res, 200, post[2] === 'like' ? await collective.react(profile, post[1]) : await collective.comment(profile, post[1], body));
      else if (allocation) json(res, 200, await collective.allocate(profile, allocation[1], body));
      else if (task) json(res, 200, await collective.task(profile, task[1], task[2], body));
      else if (update) json(res, 201, await collective.update(profile, update[1], body));
      else throw new InputError('Page not found.', 404);
    }
    return true;
  };
}
