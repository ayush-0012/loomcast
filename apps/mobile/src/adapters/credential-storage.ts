import type { CredentialStorage, PlatformCredentials } from '@loomcast/core';

interface SecureStorageBackend {
  isAvailableAsync(): Promise<boolean>;
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

function storageKey(platform: string): string {
  if (typeof platform !== 'string' || !/^[a-z0-9_-]+$/.test(platform)) {
    throw new Error('Platform must be a lowercase identifier using letters, numbers, underscores, or hyphens.');
  }
  return `loomcast.credentials.${platform}`;
}

function validateCredentials(value: unknown): asserts value is PlatformCredentials {
  if (value === null || typeof value !== 'object') {
    throw new Error('Invalid credentials record.');
  }
  const record = value as Record<string, unknown>;
  storageKey(record.platform as string);

  for (const field of ['client_id'] as const) {
    if (typeof record[field] !== 'string' || !record[field].trim()) {
      throw new Error(`Invalid credentials field: ${field}.`);
    }
  }
  for (const field of ['access_token', 'refresh_token', 'client_secret'] as const) {
    if (field === 'client_secret' && record[field] === undefined) continue;
    if (record[field] !== null &&
        (typeof record[field] !== 'string' || !record[field].trim())) {
      throw new Error(`Invalid credentials field: ${field}.`);
    }
  }

  for (const field of ['created_at', 'updated_at', 'expires_at', 'refresh_expires_at'] as const) {
    const timestamp = record[field];
    if ((field === 'expires_at' || field === 'refresh_expires_at') && timestamp === null) {
      continue;
    }
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp)) ||
        new Date(timestamp).toISOString() !== timestamp) {
      throw new Error(`Invalid credentials timestamp: ${field}. Use Date.toISOString().`);
    }
  }
}

// Accept the native backend explicitly so serialization and failure handling can
// be tested without pretending that an in-memory store proves OS encryption.
export function createCredentialStorage(backend: SecureStorageBackend): CredentialStorage {
  async function requireAvailable(): Promise<void> {
    if (!await backend.isAvailableAsync()) {
      throw new Error('Secure credential storage is unavailable. Use the Android or iOS app.');
    }
  }

  return {
    async save(credentials) {
      validateCredentials(credentials);
      await requireAvailable();
      await backend.setItemAsync(storageKey(credentials.platform), JSON.stringify(credentials));
    },

    async get(platform) {
      const key = storageKey(platform);
      await requireAvailable();
      const stored = await backend.getItemAsync(key);
      if (stored === null) return null;

      let credentials: unknown;
      try {
        credentials = JSON.parse(stored);
      } catch {
        // JSON parser errors can include fragments of the stored secret.
        throw new Error('Stored credentials are not valid JSON.');
      }
      validateCredentials(credentials);
      if (credentials.platform !== platform) {
        throw new Error('Stored credentials do not match the requested platform.');
      }
      return credentials;
    },

    async remove(platform) {
      const key = storageKey(platform);
      await requireAvailable();
      await backend.deleteItemAsync(key);
    },
  };
}
