# Loomcast

Local-first video publishing. Mobile first; desktop reserved for later.

## Development

Use pnpm (the root package.json pins its version).

```sh
pnpm install
pnpm android
pnpm dev
```

`pnpm android` builds and installs a development client; it requires Android Studio, an Android SDK, and an emulator or connected device. `pnpm dev` starts Metro for an installed development client. iOS builds use `pnpm ios` and require Xcode.

```sh
pnpm typecheck
pnpm lint
```

## Android APK

The mobile app has a `preview` EAS profile that produces a standalone release APK. From `apps/mobile`, run `pnpm dlx eas-cli build --platform android --profile preview`. EAS account/project setup and signing are required before the first build. Local Android builds are also possible with the native Android toolchain.

## Structure

- `apps/mobile`: Expo + React Native, routes, mobile features and OS adapters.
- `apps/desktop`: placeholder for Electron.
- `packages/core`: shared models and workflows.
- `packages/integrations`: platform API integrations.
- `packages/config`: shared development configuration.

One local user can connect accounts across social platforms. Small account records and credentials will use OS secure storage. No SQLite or embedded server is included. Platform integrations and credential handling are not implemented yet.

Local `docs/` and agent configuration are intentionally ignored by Git.
