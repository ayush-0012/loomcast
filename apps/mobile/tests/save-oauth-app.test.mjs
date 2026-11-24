import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCredentialStorage } from '../src/adapters/credential-storage.ts';
import { saveOAuthApp } from '../src/features/accounts/save-oauth-app.ts';

function setup() {
  const values = new Map();
  return createCredentialStorage({
    isAvailableAsync: async () => true,
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => { values.set(key, value); },
    deleteItemAsync: async (key) => { values.delete(key); },
  });
}

test('saves developer credentials before OAuth without inventing tokens', async () => {
  const storage = setup();
  const saved = await saveOAuthApp(storage, {
    platform: ' YouTube ', clientId: ' test-client ', clientSecret: ' ',
  });
  assert.equal(saved.platform, 'youtube');
  assert.equal(saved.client_id, 'test-client');
  assert.equal(saved.client_secret, null);
  assert.equal(saved.access_token, null);
  assert.equal(saved.refresh_token, null);
  assert.equal(saved.expires_at, null);
  assert.equal(saved.refresh_expires_at, null);
  assert.equal(new Date(saved.created_at).toISOString(), saved.created_at);
  assert.deepEqual(await storage.get('youtube'), saved);
});

test('preserves existing tokens for unchanged app credentials and clears them for a changed app', async () => {
  const storage = setup();
  const input = { platform: 'youtube', clientId: 'test-client', clientSecret: 'fake-secret' };
  const saved = await saveOAuthApp(storage, input);
  await storage.save({
    ...saved, access_token: 'fake-access', refresh_token: 'fake-refresh',
    expires_at: '2026-11-24T01:00:00.000Z', refresh_expires_at: '2026-12-24T01:00:00.000Z',
  });
  const unchanged = await saveOAuthApp(storage, input);
  assert.equal(unchanged.access_token, 'fake-access');
  assert.equal(unchanged.refresh_token, 'fake-refresh');
  assert.equal(unchanged.created_at, saved.created_at);
  for (const changed of [
    { ...input, clientId: 'another-client' },
    { ...input, clientSecret: 'another-fake-secret' },
  ]) {
    await storage.save(unchanged);
    const result = await saveOAuthApp(storage, changed);
    assert.equal(result.access_token, null);
    assert.equal(result.refresh_token, null);
    assert.equal(result.expires_at, null);
    assert.equal(result.refresh_expires_at, null);
    assert.equal(result.created_at, saved.created_at);
  }
});

test('rejects invalid fields before accessing storage', async () => {
  const storage = {
    get: async () => assert.fail('Must not read storage for invalid input'),
    save: async () => assert.fail('Must not write invalid input'),
  };
  await assert.rejects(saveOAuthApp(storage, { platform: '../x', clientId: 'test', clientSecret: '' }), /Enter a platform/);
  await assert.rejects(saveOAuthApp(storage, { platform: 'x', clientId: ' ', clientSecret: '' }), /client ID/);
});

test('does not overwrite credentials if reading fails and propagates write failure', async () => {
  const input = { platform: 'youtube', clientId: 'test', clientSecret: '' };
  const failure = new Error('Storage unavailable');
  await assert.rejects(saveOAuthApp({
    get: async () => { throw failure; },
    save: async () => assert.fail('Must not overwrite after a failed read'),
  }, input), (error) => error === failure);
  await assert.rejects(saveOAuthApp({
    get: async () => null,
    save: async () => { throw failure; },
  }, input), (error) => error === failure);
});
