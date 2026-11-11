import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

export class ConflictError extends Error {}
const validKey = key => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,240}$/.test(key) || key.includes('..')) throw new Error('Invalid storage key');
  return key;
};

export class FileStore {
  constructor(directory) { this.directory = path.resolve(directory); }
  async ready() { await fs.mkdir(this.directory, { recursive: true }); }
  file(key) { return path.join(this.directory, `${validKey(key)}.json`); }
  async get(key) {
    try { return JSON.parse(await fs.readFile(this.file(key), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async put(key, data, options = {}) {
    const file = this.file(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const lock = `${file}.lock`;
    let acquired = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      try { await fs.mkdir(lock); acquired = true; break; }
      catch (error) { if (error.code !== 'EEXIST') throw error; await delay(10); }
    }
    if (!acquired) throw new Error('Storage busy');
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const previous = await this.get(key);
      if ((options.ifNoneMatch && previous) || (options.ifMatch && options.ifMatch !== previous?.etag)) throw new ConflictError('Record changed');
      const record = { data, etag: randomUUID() };
      await fs.writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
      await fs.rename(temporary, file);
      return record;
    } finally {
      await fs.rm(temporary, { force: true });
      await fs.rmdir(lock);
    }
  }
  async list(prefix) {
    validKey(prefix);
    const records = [];
    async function walk(dir) {
      let entries;
      try { entries = await fs.readdir(dir, { withFileTypes: true }); }
      catch (error) { if (error.code === 'ENOENT') return; throw error; }
      for (const entry of entries) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.endsWith('.lock')) await walk(file);
        else if (entry.name.endsWith('.json')) records.push(JSON.parse(await fs.readFile(file, 'utf8')).data);
      }
    }
    await walk(path.join(this.directory, prefix));
    return records;
  }
}

export class AzureStore {
  constructor(url, containerName) {
    this.container = new BlobServiceClient(url, new DefaultAzureCredential(), { retryOptions: { maxTries: 3 } }).getContainerClient(containerName);
  }
  async ready() { await this.container.getProperties(); }
  blob(key) { return this.container.getBlockBlobClient(`${validKey(key)}.json`); }
  async get(key) {
    try {
      const response = await this.blob(key).download();
      const chunks = [];
      for await (const chunk of response.readableStreamBody) chunks.push(Buffer.from(chunk));
      return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')), etag: response.etag };
    } catch (error) { if (error.statusCode === 404) return null; throw error; }
  }
  async put(key, data, options = {}) {
    const body = JSON.stringify(data);
    try {
      const result = await this.blob(key).upload(body, Buffer.byteLength(body), {
        blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8', blobCacheControl: 'no-store' },
        conditions: options.ifNoneMatch ? { ifNoneMatch: '*' } : options.ifMatch ? { ifMatch: options.ifMatch } : undefined,
      });
      return { data, etag: result.etag };
    } catch (error) {
      if ([409, 412].includes(error.statusCode)) throw new ConflictError('Record changed');
      throw error;
    }
  }
  async list(prefix) {
    validKey(prefix);
    const records = [];
    for await (const item of this.container.listBlobsFlat({ prefix: `${prefix}/` })) {
      if (item.name.endsWith('.json')) {
        const record = await this.get(item.name.slice(0, -5));
        if (record) records.push(record.data);
      }
    }
    return records;
  }
}

export function createStore(env = process.env) {
  if (env.STORAGE_DRIVER === 'azure') {
    if (!env.AZURE_STORAGE_ACCOUNT_URL || !env.AZURE_STORAGE_CONTAINER) throw new Error('Azure storage configuration is required');
    return new AzureStore(env.AZURE_STORAGE_ACCOUNT_URL, env.AZURE_STORAGE_CONTAINER);
  }
  if (env.NODE_ENV === 'production') throw new Error('Production requires durable Azure storage; local fallback is disabled');
  return new FileStore(env.DATA_DIR || '.local-data');
}
