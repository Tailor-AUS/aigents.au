import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { FileStore, createStore, ConflictError } from '../src/engine/store.mjs';

test('production fails closed instead of silently writing ephemeral profile files', () => {
  assert.throws(() => createStore({ NODE_ENV: 'production' }), /durable Azure/);
  assert.throws(() => createStore({ NODE_ENV: 'production', STORAGE_DRIVER: 'azure' }), /configuration/);
});
test('concurrent edits cannot overwrite each other, and a new store instance reads the saved record', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'aigents-store-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const first = new FileStore(directory);
  const second = new FileStore(directory);
  await first.ready();
  const original = await first.put('accounts/example', { project: 'original' }, { ifNoneMatch: true });
  const results = await Promise.allSettled([
    first.put('accounts/example', { project: 'first edit' }, { ifMatch: original.etag }),
    second.put('accounts/example', { project: 'second edit' }, { ifMatch: original.etag }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(results.find(result => result.status === 'rejected').reason instanceof ConflictError);
  const stored = await new FileStore(directory).get('accounts/example');
  assert.ok(['first edit', 'second edit'].includes(stored.data.project));
  await assert.rejects(first.put('accounts/example', { project: 'overwritten' }, { ifNoneMatch: true }), ConflictError);
  assert.throws(() => first.file('../escape'));
});
