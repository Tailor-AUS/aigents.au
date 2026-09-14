import test from 'node:test';
import assert from 'node:assert/strict';
import { Platform, digest } from '../src/engine/platform.mjs';
import { ConflictError } from '../src/engine/store.mjs';

// Deterministic fault injection without touching local or Azure records.
class FaultStore {
  constructor() { this.records = new Map(); this.failPrefix = ''; this.version = 0; }
  async ready() {}
  async get(key) { return structuredClone(this.records.get(key) || null); }
  async put(key, data, options = {}) {
    if (this.failPrefix && key.startsWith(this.failPrefix)) throw new Error('Injected storage failure');
    const previous = this.records.get(key);
    if ((options.ifNoneMatch && previous) || (options.ifMatch && previous?.etag !== options.ifMatch)) throw new ConflictError('Record changed');
    const record = { data: structuredClone(data), etag: String(++this.version) };
    this.records.set(key, record);
    return structuredClone(record);
  }
}

class ObservedPlatform extends Platform {
  async createSession(...args) {
    const session = await super.createSession(...args);
    this.lastCreatedSession = session;
    return session;
  }
}

const details = {
  name: 'Failure Test Student', email: 'failure-test@example.invalid', password: 'Original test password 2026',
  university: 'Test University', discipline: 'Mechanical engineering', wam: '6/7 GPA',
};
const replacementPassword = 'Replacement test password 2026';

for (const failPrefix of ['sessions/', 'accounts/']) {
  test(`registration remains retryable when ${failPrefix} storage fails before account commit`, async () => {
    const store = new FaultStore();
    const platform = new ObservedPlatform(store);
    store.failPrefix = failPrefix;
    await assert.rejects(platform.register(details), /Injected storage failure/);
    assert.equal(await store.get(`accounts/${digest(details.email)}`), null, 'failed registration must not reserve the email');
    const orphan = platform.lastCreatedSession;
    if (orphan) assert.equal(await platform.session(orphan), null, 'a session written before a failed account commit must not authenticate');
    for (const key of store.records.keys()) {
      if (key.startsWith('profiles/')) assert.equal(await platform.sharedProfile(key.slice('profiles/'.length)), null, 'an orphaned profile index must remain unavailable');
    }
    store.failPrefix = '';
    const retry = await platform.register(details);
    assert.ok(retry.recoveryCode && retry.session);
    assert.equal((await platform.session(retry.session)).account.data.profile.email, details.email);
    if (orphan) assert.equal(await platform.session(orphan), null, 'retry must not activate an earlier orphan session');
  });

  test(`recovery preserves the old password, code and session when ${failPrefix} storage fails before commit`, async () => {
    const store = new FaultStore();
    const platform = new ObservedPlatform(store);
    const registered = await platform.register(details);
    const accountKey = `accounts/${digest(details.email)}`;
    const original = await store.get(accountKey);
    store.failPrefix = failPrefix;
    await assert.rejects(platform.recover({ email: details.email, recoveryCode: registered.recoveryCode, password: replacementPassword }), /Injected storage failure/);
    assert.deepEqual(await store.get(accountKey), original, 'failed recovery must not rotate account credentials');
    assert.ok(await platform.session(registered.session), 'the original session must remain valid');
    const orphan = platform.lastCreatedSession;
    if (orphan !== registered.session) assert.equal(await platform.session(orphan), null, 'the uncommitted recovery session must not authenticate');
    store.failPrefix = '';
    assert.ok((await platform.login({ email: details.email, password: details.password })).session, 'the original password must still sign in');
    await assert.rejects(platform.login({ email: details.email, password: replacementPassword }), /Email or password is incorrect/);
    const recovered = await platform.recover({ email: details.email, recoveryCode: registered.recoveryCode, password: replacementPassword });
    assert.ok(recovered.recoveryCode && recovered.recoveryCode !== registered.recoveryCode, 'the original recovery code must still work on retry');
    assert.ok(await platform.session(recovered.session));
    assert.equal(await platform.session(registered.session), null, 'a successful recovery must revoke the original session');
    if (orphan !== registered.session) assert.equal(await platform.session(orphan), null, 'retry must not activate the earlier orphan session');
  });
}
