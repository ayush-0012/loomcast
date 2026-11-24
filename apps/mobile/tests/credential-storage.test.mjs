import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCredentialStorage } from '../src/adapters/credential-storage.ts';

const example = {
  platform: 'youtube',
  client_id: 'test-client',
  access_token: 'fake-access-token',
  refresh_token: 'fake-refresh-token',
  created_at: '2026-11-23T00:00:00.000Z',
  updated_at: '2026-11-23T00:00:00.000Z',
  expires_at: '2026-11-23T01:00:00.000Z',
  refresh_expires_at: null,
};

function setup() {
  const values = new Map();
  const backend = {
    isAvailableAsync: async () => true,
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => { values.set(key, value); },
    deleteItemAsync: async (key) => { values.delete(key); },
  };
  return { values, backend, storage: createCredentialStorage(backend) };
}

test('records survive a new helper instance, update independently, and can be removed', async () => {
  const { backend, storage } = setup();
  assert.equal(await storage.get('youtube'), null);
  await storage.save(example);
  await storage.save({ ...example, platform: 'instagram', refresh_token: null, expires_at: null });

  const reopened = createCredentialStorage(backend);
  assert.deepEqual(await reopened.get('youtube'), example);
  const updated = { ...example, access_token: 'new-fake-token', updated_at: '2026-11-23T00:30:00.000Z' };
  await reopened.save(updated);
  assert.deepEqual(await storage.get('youtube'), updated);
  await reopened.remove('youtube');
  assert.equal(await storage.get('youtube'), null);
  assert.equal((await storage.get('instagram')).refresh_token, null);
  await reopened.remove('youtube');
});

test('unavailable secure storage fails without writing or using a fallback', async () => {
  const { backend, values } = setup();
  backend.isAvailableAsync = async () => false;
  const storage = createCredentialStorage(backend);
  await assert.rejects(storage.save(example), /unavailable/);
  await assert.rejects(storage.get('youtube'), /unavailable/);
  await assert.rejects(storage.remove('youtube'), /unavailable/);
  assert.equal(values.size, 0);
});

test('invalid input does not overwrite an existing record', async () => {
  const { storage } = setup();
  await storage.save(example);
  for (const invalid of [
    { ...example, access_token: '' },
    { ...example, refresh_token: undefined },
    { ...example, updated_at: 'yesterday' },
    { ...example, expires_at: '2026-11-23' },
    { ...example, refresh_expires_at: 123 },
    { ...example, platform: '../youtube' },
  ]) {
    await assert.rejects(storage.save(invalid));
  }
  assert.deepEqual(await storage.get('youtube'), example);
});

test('corrupt or mismatched records fail without deleting data or exposing raw JSON', async () => {
  const { storage, values } = setup();
  const key = 'loomcast.credentials.youtube';
  values.set(key, 'fake-secret-invalid-json');
  await assert.rejects(storage.get('youtube'), { message: 'Stored credentials are not valid JSON.' });
  assert.equal(values.get(key), 'fake-secret-invalid-json');
  values.set(key, JSON.stringify({ ...example, platform: 'instagram' }));
  await assert.rejects(storage.get('youtube'), /do not match/);
  values.set(key, JSON.stringify({ ...example, access_token: 123 }));
  await assert.rejects(storage.get('youtube'), /access_token/);
});

test('native storage failures propagate to callers', async () => {
  const { backend } = setup();
  const failure = new Error('Native storage failure');
  for (const method of ['setItemAsync', 'getItemAsync', 'deleteItemAsync']) {
    const failing = createCredentialStorage({ ...backend, [method]: async () => { throw failure; } });
    const operation = method === 'setItemAsync' ? failing.save(example)
      : method === 'getItemAsync' ? failing.get('youtube') : failing.remove('youtube');
    await assert.rejects(operation, (error) => error === failure);
  }
});
