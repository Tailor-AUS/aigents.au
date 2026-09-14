import { InputError } from './engine/candidate-manager.mjs';
import { ConflictError } from './engine/store.mjs';
import { renderBuilderHtml } from './views/builder.mjs';
import { renderProfileHtml, renderPublicProfileHtml, renderSignInHtml, renderRecoverHtml } from './views/profile.mjs';
import { renderEmployerHtml, renderTeamHtml, renderTeamSignInHtml, renderPrivacyHtml } from './views/employer.mjs';
import { createCollectiveRoutes } from './collective-routes.mjs';

export async function readJson(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new InputError('Send this request as JSON.', 415);
  if (Number(req.headers['content-length'] || 0) > 32768) throw new InputError('This request is too large.', 413);
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 32768) throw new InputError('This request is too large.', 413);
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new InputError('Check the submitted details and try again.'); }
}

function cookieValue(req, name) {
  return (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}
function setCookie(res, name, value, type = 'student') {
  const seconds = value ? (type === 'team' ? 8 * 3600 : 30 * 86400) : 0;
  res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
function html(res, content, status = 200) { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(content); }
function redirect(res, target) { res.writeHead(303, { Location: target }); res.end(); }
function errorPage(message) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aigents</title><body style="font:18px Arial;color:#15243c;max-width:650px;margin:10vh auto;padding:24px"><a href="/">aigents.</a><h1>${message}</h1><p><a href="/profile">My profile</a> · <a href="/employers">Employer enquiries</a> · <a href="/">Back to home</a></p></body></html>`;
}
export function enforceOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new InputError('Please submit this form from Aigents.', 403);
  const origin = req.headers.origin;
  if (origin) {
    let parsed;
    try { parsed = new URL(origin); } catch { throw new InputError('Invalid request origin.', 403); }
    if (parsed.host !== req.headers.host || !['http:', 'https:'].includes(parsed.protocol) || (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) throw new InputError('Please submit this form from Aigents.', 403);
  }
}

export function createPlatformRoutes(platform) {
  const routeCollective = createCollectiveRoutes(platform, { readJson, json, html, redirect });
  return async function route(req, res, url) {
    const pathname = url.pathname;
    const handled = ['/healthz', '/build', '/profile', '/signin', '/recover', '/employers', '/team', '/team/projects', '/privacy', '/community', '/api/community'].includes(pathname) || /^\/(?:projects\/|students\/|api\/(?:community\/|projects\/|candidate\/register$|profile$|students\/|session\/|enquiries$|team\/))/.test(pathname);
    if (!handled) return false;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const studentCookie = cookieValue(req, 'aigents_session');
    const teamCookie = cookieValue(req, 'aigents_team');
    try {
      if (!['GET', 'POST', 'PATCH'].includes(req.method)) throw new InputError('Method not allowed.', 405);
      if (['POST', 'PATCH'].includes(req.method)) {
        enforceOrigin(req);
        const remote = process.env.NODE_ENV === 'production' ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').at(-1).trim() : req.socket.remoteAddress;
        const category = pathname === '/api/enquiries' ? 'enquiry' : pathname.includes('/login') || pathname.includes('/recover') || pathname.includes('/register') ? 'auth' : 'write';
        await platform.limit(`${category}-ip:${remote}`, category === 'enquiry' ? 30 : category === 'auth' ? 60 : 150, 15 * 60_000);
      }
      if (req.method === 'GET' && pathname === '/healthz') { await platform.ready(); json(res, 200, { status: 'ok' }); return true; }
      if (await routeCollective(req, res, pathname, studentCookie, teamCookie)) return true;
      if (req.method === 'GET' && pathname === '/privacy') { html(res, renderPrivacyHtml()); return true; }
      if (req.method === 'GET' && ['/build', '/signin', '/recover'].includes(pathname)) {
        if (pathname !== '/recover' && await platform.session(studentCookie)) redirect(res, '/profile');
        else html(res, pathname === '/build' ? renderBuilderHtml() : pathname === '/signin' ? renderSignInHtml() : renderRecoverHtml());
        return true;
      }
      if (req.method === 'POST' && pathname === '/api/candidate/register') {
        const result = await platform.register(await readJson(req));
        setCookie(res, 'aigents_session', result.session);
        json(res, 201, { profile: result.profile, profileUrl: '/profile', recoveryCode: result.recoveryCode });
        return true;
      }
      if (req.method === 'POST' && pathname === '/api/session/login') {
        const result = await platform.login(await readJson(req));
        setCookie(res, 'aigents_session', result.session);
        json(res, 200, { profileUrl: '/profile' }); return true;
      }
      if (req.method === 'POST' && pathname === '/api/session/recover') {
        const result = await platform.recover(await readJson(req));
        setCookie(res, 'aigents_session', result.session);
        json(res, 200, { profileUrl: '/profile', recoveryCode: result.recoveryCode }); return true;
      }
      if (req.method === 'POST' && pathname === '/api/session/logout') {
        await readJson(req); await platform.logout(studentCookie); setCookie(res, 'aigents_session', ''); json(res, 200, { ok: true }); return true;
      }
      if (pathname === '/profile' || pathname === '/api/profile') {
        const auth = await platform.session(studentCookie);
        if (!auth) { if (pathname === '/profile' && req.method === 'GET') redirect(res, '/signin'); else throw new InputError('Sign in to view or edit your profile.', 401); return true; }
        if (req.method === 'GET') {
          const profile = auth.account.data.profile;
          const enquiries = await platform.enquiries(profile.id);
          if (pathname === '/profile') html(res, renderProfileHtml(profile, enquiries));
          else json(res, 200, { profile, enquiries });
        } else if (req.method === 'PATCH' && pathname === '/api/profile') json(res, 200, { profile: await platform.updateProfile(auth, await readJson(req)) });
        else throw new InputError('Method not allowed.', 405);
        return true;
      }
      const publicMatch = pathname.match(/^\/(api\/)?students\/([^/]+)$/);
      if (req.method === 'GET' && publicMatch) {
        const profile = await platform.sharedProfile(publicMatch[2]);
        if (!profile) { if (publicMatch[1]) throw new InputError('This profile is private or unavailable.', 404); html(res, errorPage('This profile is private or unavailable.'), 404); }
        else if (publicMatch[1]) json(res, 200, { profile }); else html(res, renderPublicProfileHtml(profile));
        return true;
      }
      if (req.method === 'GET' && pathname === '/employers') {
        const id = url.searchParams.get('student');
        const profile = id ? await platform.sharedProfile(id) : null;
        if (id && !profile) html(res, errorPage('This student profile is no longer shared.'), 404);
        else html(res, renderEmployerHtml(profile));
        return true;
      }
      if (req.method === 'POST' && pathname === '/api/enquiries') { json(res, 201, await platform.enquire(await readJson(req))); return true; }
      if (req.method === 'POST' && pathname === '/api/team/login') {
        const secret = await platform.teamLogin(await readJson(req)); setCookie(res, 'aigents_team', secret, 'team'); json(res, 200, { teamUrl: '/team' }); return true;
      }
      if (req.method === 'POST' && pathname === '/api/team/logout') {
        await readJson(req); await platform.logout(teamCookie); setCookie(res, 'aigents_team', '', 'team'); json(res, 200, { ok: true }); return true;
      }
      if (req.method === 'GET' && ['/team', '/api/team/enquiries'].includes(pathname)) {
        const auth = await platform.session(teamCookie, 'team');
        if (!auth) { if (pathname === '/team') html(res, renderTeamSignInHtml()); else throw new InputError('Team sign-in is required.', 401); }
        else { const enquiries = await platform.enquiries(); if (pathname === '/team') html(res, renderTeamHtml(enquiries)); else json(res, 200, { enquiries }); }
        return true;
      }
      throw new InputError('Page not found.', 404);
    } catch (error) {
      const status = error instanceof ConflictError ? 409 : error instanceof InputError ? error.status : 503;
      if (status === 503) console.error('[aigents.au] Durable platform request failed:', error.name, error.code || error.statusCode || 'storage-unavailable');
      const message = error instanceof ConflictError ? 'This record changed in another tab. Reload and try again.' : error instanceof InputError ? error.message : 'We could not save or load your information. Please try again shortly.';
      if (status === 429) res.setHeader('Retry-After', '900');
      if (pathname.startsWith('/api/') || pathname === '/healthz') json(res, status, { error: message });
      else html(res, errorPage(status === 503 ? 'Temporarily unavailable. Please try again shortly.' : 'This page is unavailable.'), status);
      return true;
    }
  };
}
