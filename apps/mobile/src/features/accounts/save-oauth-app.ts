import type { CredentialStorage, PlatformCredentials } from '@loomcast/core';

interface OAuthAppInput {
  platform: string;
  clientId: string;
  clientSecret: string;
}

export async function saveOAuthApp(
  storage: CredentialStorage,
  input: OAuthAppInput,
): Promise<PlatformCredentials> {
  const platform = input.platform.trim().toLowerCase();
  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret.trim() || null;
  if (!/^[a-z0-9_-]+$/.test(platform)) {
    throw new Error('Enter a platform using letters, numbers, underscores, or hyphens.');
  }
  if (!clientId) throw new Error('Enter your client ID.');

  const existing = await storage.get(platform);
  const now = new Date().toISOString();
  const sameApp = existing?.client_id === clientId &&
    (existing.client_secret ?? null) === clientSecret;

  // Tokens from a different developer app must not survive a credentials change.
  const credentials: PlatformCredentials = {
    platform,
    client_id: clientId,
    client_secret: clientSecret,
    access_token: sameApp ? existing.access_token : null,
    refresh_token: sameApp ? existing.refresh_token : null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    expires_at: sameApp ? existing.expires_at : null,
    refresh_expires_at: sameApp ? existing.refresh_expires_at : null,
  };
  await storage.save(credentials);
  return credentials;
}
