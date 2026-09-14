import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ConflictError } from './store.mjs';
import { InputError, normalizeEmail, normalizeProfile, normalizeEnquiry, publicProfile } from './candidate-manager.mjs';

const derive = promisify(scrypt);
export const digest = value => createHash('sha256').update(String(value)).digest('hex');
const token = () => randomBytes(32).toString('hex');
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const passwordOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const sorted = items => items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
function passwordInput(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new InputError('Use a password between 12 and 128 characters.');
  return value;
}
async function hashPassword(value) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(passwordInput(value), salt, 64, passwordOptions);
  return { salt, hash: hash.toString('hex') };
}
async function verifyPassword(value, stored) {
  if (typeof value !== 'string' || value.length > 128) return false;
  const hash = await derive(value, stored?.salt || 'aigents-dummy-login-salt', 64, passwordOptions);
  return timingSafeEqual(hash, Buffer.from(stored?.hash || '00'.repeat(64), 'hex'));
}

export class Platform {
  constructor(store, { teamAccessKey = '' } = {}) { this.store = store; this.teamAccessKey = teamAccessKey; }
  async ready() { await this.store.ready(); }
  async limit(key, limit, windowMs) {
    const window = Math.floor(Date.now() / windowMs);
    const recordKey = `limits/${digest(key)}`;
    for (let attempt = 0; attempt < 8; attempt++) {
      const record = await this.store.get(recordKey);
      const count = record?.data.window === window ? record.data.count : 0;
      if (count >= limit) throw new InputError('Too many attempts. Please wait a little before trying again.', 429);
      try {
        await this.store.put(recordKey, { window, count: count + 1 }, record ? { ifMatch: record.etag } : { ifNoneMatch: true });
        return;
      } catch (error) { if (!(error instanceof ConflictError)) throw error; }
    }
    throw new InputError('Please wait a moment and try again.', 429);
  }
  async createSession(accountKey, authVersion, type = 'student') {
    const secret = token();
    await this.store.put(`sessions/${digest(secret)}`, { accountKey, authVersion, type, expiresAt: Date.now() + (type === 'team' ? 8 * 3600_000 : 30 * 86400_000) }, { ifNoneMatch: true });
    return secret;
  }
  async session(secret, type = 'student') {
    if (!/^[0-9a-f]{64}$/.test(secret || '')) return null;
    const record = await this.store.get(`sessions/${digest(secret)}`);
    if (!record || record.data.type !== type || record.data.expiresAt <= Date.now()) return null;
    if (type === 'team') return this.teamAccessKey && record.data.authVersion === digest(this.teamAccessKey) ? { session: record } : null;
    const account = await this.store.get(`accounts/${record.data.accountKey}`);
    if (!account || account.data.authVersion !== record.data.authVersion) return null;
    return { session: record, account, accountKey: record.data.accountKey };
  }
  async logout(secret) {
    if (!/^[0-9a-f]{64}$/.test(secret || '')) return;
    const key = `sessions/${digest(secret)}`;
    const record = await this.store.get(key);
    if (record) {
      try { await this.store.put(key, { ...record.data, expiresAt: 0 }, { ifMatch: record.etag }); }
      catch (error) { if (!(error instanceof ConflictError)) throw error; }
    }
  }
  async register(body) {
    const email = normalizeEmail(body.email);
    const key = digest(email);
    const fields = normalizeProfile(body);
    passwordInput(body.password);
    await this.limit(`register:${key}`, 5, 3600_000);
    if (await this.store.get(`accounts/${key}`)) throw new InputError('An account already uses this email. Sign in or recover your account.', 409);
    const id = randomUUID();
    const recoveryCode = token();
    const now = new Date().toISOString();
    const profile = { ...fields, id, email, sharingEnabled: false, version: randomUUID(), createdAt: now, updatedAt: now };
    const account = { profile, password: await hashPassword(body.password), recoveryHash: digest(recoveryCode), authVersion: randomUUID() };
    // An orphaned index cannot expose data: every read rechecks the account's ID and sharing setting.
    await this.store.put(`profiles/${id}`, { accountKey: key }, { ifNoneMatch: true });
    const session = await this.createSession(key, account.authVersion);
    try { await this.store.put(`accounts/${key}`, account, { ifNoneMatch: true }); }
    catch (error) { if (error instanceof ConflictError) throw new InputError('An account already uses this email. Please sign in.', 409); throw error; }
    return { profile, recoveryCode, session };
  }
  async login(body) {
    const email = normalizeEmail(body.email);
    const key = digest(email);
    await this.limit(`login:${key}`, 12, 15 * 60_000);
    const account = await this.store.get(`accounts/${key}`);
    if (!(await verifyPassword(body.password, account?.data.password)) || !account) throw new InputError('Email or password is incorrect.', 401);
    return { profile: account.data.profile, session: await this.createSession(key, account.data.authVersion) };
  }
  async recover(body) {
    const key = digest(normalizeEmail(body.email));
    passwordInput(body.password);
    await this.limit(`recover:${key}`, 8, 3600_000);
    const account = await this.store.get(`accounts/${key}`);
    const code = typeof body.recoveryCode === 'string' ? body.recoveryCode.trim().toLowerCase().replace(/\s/g, '') : '';
    if (!/^[0-9a-f]{64}$/.test(code) || !account || !timingSafeEqual(Buffer.from(digest(code), 'hex'), Buffer.from(account.data.recoveryHash, 'hex'))) throw new InputError('Email or recovery code is incorrect.', 401);
    const recoveryCode = token();
    const updated = { ...account.data, password: await hashPassword(body.password), recoveryHash: digest(recoveryCode), authVersion: randomUUID() };
    const session = await this.createSession(key, updated.authVersion);
    await this.store.put(`accounts/${key}`, updated, { ifMatch: account.etag });
    return { recoveryCode, session };
  }
  async updateProfile(auth, body) {
    const previous = auth.account.data.profile;
    if (body.version !== previous.version) throw new InputError('This profile changed in another tab. Reload before saving again.', 409);
    const fields = normalizeProfile(body);
    const profile = { ...previous, ...fields, version: randomUUID(), updatedAt: new Date().toISOString() };
    await this.store.put(`accounts/${auth.accountKey}`, { ...auth.account.data, profile }, { ifMatch: auth.account.etag });
    return profile;
  }
  async sharedProfile(id) {
    if (!uuidPattern.test(id || '')) return null;
    const index = await this.store.get(`profiles/${id}`);
    if (!index) return null;
    const account = await this.store.get(`accounts/${index.data.accountKey}`);
    const profile = account?.data.profile;
    return profile?.id === id && profile.sharingEnabled ? publicProfile(profile) : null;
  }
  async enquire(body) {
    const enquiry = normalizeEnquiry(body);
    const studentId = body.studentId || '';
    let student;
    if (studentId) {
      student = await this.sharedProfile(studentId);
      if (!student) throw new InputError('This student profile is no longer shared. Submit a general project request instead.', 404);
    }
    await this.limit(`enquiry:${digest(enquiry.email)}`, 10, 3600_000);
    const id = randomUUID();
    const record = { ...enquiry, id, studentId, studentName: student?.name || '', consent: true, status: 'received', createdAt: new Date().toISOString() };
    await this.store.put(`enquiries/${studentId || 'general'}/${id}`, record, { ifNoneMatch: true });
    return { id, status: 'received', message: studentId ? 'Your enquiry has been saved in the student’s inbox and the Aigents team inbox.' : 'Your project request has been saved in the Aigents team inbox.' };
  }
  async enquiries(studentId) { return sorted(await this.store.list(studentId ? `enquiries/${studentId}` : 'enquiries')); }
  async teamLogin(body) {
    if (!this.teamAccessKey || this.teamAccessKey.length < 32) throw new InputError('Team access is not configured.', 503);
    if (typeof body.accessKey !== 'string' || !timingSafeEqual(Buffer.from(digest(body.accessKey), 'hex'), Buffer.from(digest(this.teamAccessKey), 'hex'))) throw new InputError('The access key is incorrect.', 401);
    return this.createSession('team', digest(this.teamAccessKey), 'team');
  }
}
