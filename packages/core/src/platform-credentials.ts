export interface PlatformCredentials {
  platform: string;
  client_id: string;
  client_secret?: string | null;
  /** Null until the account has completed authorization. */
  access_token: string | null;
  refresh_token: string | null;
  /** Timestamps use UTC ISO strings produced by Date.toISOString(). */
  created_at: string;
  updated_at: string;
  /** Null when the platform does not supply an expiry. */
  expires_at: string | null;
  refresh_expires_at: string | null;
}

export interface CredentialStorage {
  save(credentials: PlatformCredentials): Promise<void>;
  get(platform: string): Promise<PlatformCredentials | null>;
  remove(platform: string): Promise<void>;
}
