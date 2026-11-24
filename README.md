# Loomcast

Local-first video publishing. Mobile first; desktop reserved for later.

## Development

Use pnpm (the root package.json pins its version).

```sh
pnpm install
pnpm android
pnpm dev
```

`pnpm android` builds and installs a development client; it requires Android Studio, an Android SDK, and an emulator or connected device. `pnpm dev` starts Metro on port 8082 for an installed development client. Press `w` for the browser preview. iOS builds use `pnpm ios` and require Xcode.

```sh
pnpm typecheck
pnpm lint
pnpm --filter @loomcast/mobile test
```

## Android APK

The mobile app has a `preview` EAS profile that produces a standalone release APK. From `apps/mobile`, run `pnpm dlx eas-cli build --platform android --profile preview`. EAS account/project setup and signing are required before the first build. Local Android builds are also possible with the native Android toolchain.

## Structure

- `apps/mobile`: Expo + React Native, routes, mobile features and OS adapters.
- `apps/desktop`: placeholder for Electron.
- `packages/core`: shared models and workflows.
- `packages/integrations`: platform API integrations.
- `packages/config`: shared development configuration.

One local user can connect accounts across social platforms. Small account records and credentials will use OS secure storage. No SQLite or embedded server is included. A credential storage helper is implemented; a basic credential-entry screen is wired to it. Platform authorization is pending.

Local `docs/` and agent configuration are intentionally ignored by Git.

## Credential storage helper

Import `credentialStorage` from `apps/mobile/src/adapters/secure-credentials.ts`
inside the mobile client. It exposes `save(record)`, `get(platform)`, and
`remove(platform)`. Reading a missing record returns `null`; native storage errors
propagate, and unsupported runtimes reject operations without a browser fallback.

Records use the shared `PlatformCredentials` type from `@loomcast/core`. Platform
identifiers use lowercase letters, numbers, underscores, or hyphens. Timestamps
are UTC strings from `Date.toISOString()`. The caller supplies `created_at` and
`updated_at`; preserve creation time when updating. `client_secret` is optional
and encrypted alongside the other fields. `access_token`, `refresh_token`, `expires_at`,
and `refresh_expires_at` can be `null` when the platform does not supply them.
Saving replaces the complete record, so pass every field. Expiry dates are stored,
not acted on: automatic refresh and expired-token handling will be added with
platform integrations. Tests use a fake backend and require Node with built-in
TypeScript stripping (the current Node 26 environment supports it); device-level
encryption and persistence still need native verification.

The initial screen accepts a platform, client ID, and optional client secret.
It creates timestamps automatically and saves a pre-authorization record with
null tokens. Updating developer app credentials clears tokens belonging to the
previous app; saving the same credentials preserves existing tokens. Browser
preview can exercise the form and secret visibility, but saving is disabled
because OS secure storage is unavailable there.
