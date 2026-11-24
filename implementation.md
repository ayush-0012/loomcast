# Loomcast implementation plan

## The idea

Upload once, publish across multiple social platforms. Your data stays yours.

Loomcast is an open-source app that lets a user select a video, choose their
connected social accounts, and publish from one place. Users bring their own
platform credentials where required. Account details, credentials, and media stay
on the device until the app communicates directly with the selected platforms.
Loomcast does not operate a hosted backend or hold users' accounts on a server.

## Agreed direction

- Mobile first, using React Native and Expo.
- First release: a signed Android APK distributed directly, without Play Store
  listing. Develop shared mobile code with iOS in mind.
- One local user per app installation, connecting accounts on different platforms.
- Small account metadata and credentials stored in persistent OS secure storage.
  No SQLite for the current scope; no embedded server on mobile or desktop.
- pnpm workspaces and Turborepo, with shared TypeScript packages.
- Future desktop client: React + Electron for Windows, Linux, and macOS.
- Desktop internals and a separate web client are deferred. The current browser
  preview helps with layout development; it is not the native mobile runtime.
- Start with immediate publishing. Scheduling is deferred unless we explicitly
  decide to bring it into scope.

## How to use this checklist

- `[ ]` means pending; `[x]` means implemented and verified to the extent stated.
- Complete individual items as work lands. A stage is complete only when all its
  required items are complete; do not check an entire stage based on scaffolding.
- Add a short verification note when completing behavior that needs device or
  platform testing. A bundle export does not prove that a native feature works.
- Record blockers and scope changes below. Revisit the plan when evidence changes
  it, rather than treating proposed integrations as guaranteed support.
- Update this file as part of completing work, so it reflects actual progress.

## Stage 1 — Project foundation

- [x] Confirm pnpm is available through Homebrew and pin its workspace version.
- [x] Set up pnpm workspaces, Turborepo, and the dependency lockfile.
- [x] Scaffold the Expo TypeScript mobile app and file-based routing.
- [x] Add the desktop placeholder and shared core, integrations, and config packages.
- [x] Document package responsibilities with inline comments and package READMEs.
- [x] Install SecureStore and development-client dependencies.
- [x] Configure development and standalone Android APK build profiles.
- [x] Enable the browser preview dependencies and verify web bundling.
- [x] Verify TypeScript, mobile lint, and Android JavaScript bundling.
- [x] Create local agent instructions and install project skills under `agents/skills/`.
- [x] Ignore local agent files, skill metadata, and `docs/` in Git.

Verification: setup checks passed during scaffolding; web export also passed
after installing the missing web dependency. No native APK/device test has been
completed. Ponytail is installed; its automatic lifecycle hooks require separate
trust/activation and are not counted as verified here.

## Stage 2 — Shared contracts and persistent account storage

- [x] Define the initial credential record for one user's cross-platform accounts.
  Fields: `platform`, `client_id`, optional `client_secret`, nullable `access_token`,
  `refresh_token`, `created_at`,
  `updated_at`, `expires_at`, and `refresh_expires_at`.
- [ ] Define shared interfaces for credentials, browser authorization, device files,
  and upload transport; keep OS implementations inside the mobile client.
- [x] Implement the SecureStore adapter for saving, reading, and removing a
  credential record per platform. Native storage verification remains in Stage 4.
- [ ] Restore connected-account state when the app starts.
- [x] Add focused checks for storage serialization, restoration, updates, removal,
  invalid records, unavailable storage, and native error propagation.
  Verified nine backend-isolated storage/save-flow tests, TypeScript, and mobile lint. These tests
  do not verify OS encryption or persistence; confirm those on a device in Stage 4.
- [ ] Implement updating credentials, disconnecting an account, and clearing local
  account data without leaving stale secrets behind.
- [ ] Handle missing, invalid, expired, or inaccessible credentials with useful errors.
- [ ] Keep secrets out of logs and error output; show an explicit unsupported state
  in web previews instead of storing credentials in unencrypted browser storage.

## Stage 3 — Mobile screens and navigation

- [ ] Agree the initial visual direction and user flow before building full screens.
- [ ] Build the home and connected-accounts screens with useful empty states.
- [x] Build the basic credential-entry screen: platform, client ID, optional masked
  client secret, validation, pending/error/success states, and native secure saving.
  Pre-authorization records use null tokens; timestamps are assigned automatically.
  Changing app credentials clears old tokens; unchanged app credentials retain them.
- [x] Use an in-field Lucide eye/eye-off visibility toggle with accessible labels
  and a 48px touch target; verified masking/revealing in the web preview.
- [ ] Build the guided per-platform setup wizard and browser authorization flow.
- [ ] Build the video selection, preview, and publishing composer.
- [ ] Build progress and per-platform result screens.
- [ ] Handle loading, validation, authorization cancellation, and failure states.
- [ ] Check narrow/wide phone sizes, short screens, scrolling, and orientation changes.
- [ ] Implement safe-area handling, keyboard-aware layouts, text scaling, and
  accessible controls. Check layouts in the browser; verify native behavior in Stage 4.

## Stage 4 — Android test build, files, and platform feasibility

Build the contracts, storage adapter, and initial screens first. This is the first
planned native test build; the release APK comes later in Stage 7. Native-dependent
items from Stages 2 and 3 remain unverified until checked here.

- [ ] Establish an Android build path: local SDK/toolchain or an EAS build.
- [ ] Produce and install a test APK on a real Android device.
- [ ] Test selecting a video from device storage, previewing it, and cancelling selection.
- [ ] Verify the returned file reference is readable by the upload mechanism and
  remains usable for the required duration; handle moved, removed, or inaccessible files.
- [ ] Verify account metadata and credentials survive app close/reopen, phone restart,
  and an app update. Verify credential updates and removal on the device.
- [ ] Verify safe areas, keyboard behavior, text scaling, and accessible controls.
- [ ] Confirm the initial release platform set and implementation order.
- [ ] Verify current official requirements for each candidate: own-account access,
  account type, developer setup, permissions, fees, and review restrictions.
- [ ] Verify mobile OAuth redirects, token exchange, and refresh without a backend
  for each OAuth-based integration we intend to ship.
- [ ] Verify each selected video publishing flow accepts device file uploads
  without requiring us to host the user's media.
- [ ] Choose the first integration and prove a real upload with a test account.
- [ ] Prove an appropriate Android background transfer approach with a large video;
  test backgrounding, screen locking, network loss, and reopening the app.
- [ ] Record unsupported flows and resulting scope changes before completing
  platform-specific integrations and setup guides.

Candidate order: Bluesky and Mastodon first, then X, YouTube, and Instagram as their
requirements allow. This is a starting proposal, not a completed support matrix.
TikTok public auto-publishing through personal BYO apps is deferred unless a
supported route is verified and explicitly chosen.

## Stage 5 — Connect the selected platforms

For each selected integration, complete the applicable setup guide, authorization,
secure persistence, reconnect/disconnect, and real publishing verification. App
password/token platforms do not need an invented OAuth flow.

- [ ] Bluesky: connect an account and publish a video.
- [ ] Mastodon: connect to the user's instance and publish a video within its limits.
- [ ] X: verify required paid access, connect, upload media, and publish.
- [ ] YouTube: verify current project requirements, connect, and upload a video with
  explicit visibility and required metadata.
- [ ] Instagram: verify the supported account/login/upload path, connect an eligible
  account, and publish a video.
- [ ] Verify relevant expiry/refresh/revocation behavior for each shipped integration.
- [ ] Keep the setup guides aligned with the flows actually verified.

If a candidate is excluded after Stage 4, record why and revise this list instead
of leaving an impossible integration as a required release task.

## Stage 6 — Publish once to multiple destinations

- [ ] Select a device video and retain usable file access for the upload duration.
- [ ] Validate video and metadata requirements for each selected destination.
- [ ] Share common input while allowing required platform-specific fields.
- [ ] Coordinate publishing through shared workflows and platform integrations.
- [ ] Show independent progress and outcomes for every selected account.
- [ ] Support cancellation and retrying failed destinations without reposting to
  destinations that already succeeded.
- [ ] Handle interrupted or ambiguous outcomes without blindly creating duplicates.
- [ ] Decide the minimum durable upload-state record needed for recovery, keeping
  secure storage entries small; revisit storage only if actual requirements demand it.
- [ ] Reconcile upload state when the app reopens, using platform capabilities where
  available, and clean up app-owned temporary files when safe.
- [ ] Verify the supported background behavior and explain its limits in the UI.

## Stage 7 — End-to-end verification and release APK

- [ ] Exercise the full flow: fresh install → setup → connect → select → publish.
- [ ] Test invalid credentials, expired access, denied permissions, and offline use.
- [ ] Test partial platform success, interrupted transfers, cancellation, and retries.
- [ ] Test representative large videos without loading entire files into JS memory.
- [ ] Add focused tests for shared publishing logic and meaningful failure cases.
- [ ] Run type checks, lint, and relevant bundle/native checks for the release.
- [ ] Generate and securely retain the signing identity for future APK updates.
- [ ] Produce a signed standalone release APK and install it on a real device.
- [ ] Verify the release runs without Metro or a development computer.
- [ ] Verify an APK update preserves stored accounts and credentials.
- [ ] Document supported platforms, setup, installation, updates, and known limits.

## Stage 8 — iOS validation and distribution decision

- [ ] Choose an appropriate iOS distribution path and confirm its requirements.
- [ ] Build and run on a real iPhone.
- [ ] Verify Keychain persistence, authorization callbacks, permissions, and disconnect.
- [ ] Implement/validate iOS background file uploads and force-quit behavior.
- [ ] Verify the complete publishing flow for each supported integration on iOS.

This stage follows the initial Android release work; it is not a requirement for
calling the Android APK ready.

## Deferred work

- [ ] Plan and implement the Electron client after mobile workflows are established.
- [ ] Produce and verify separate desktop builds for Windows, Linux, and macOS.
- [ ] Evaluate a separate web client if requested.
- [ ] Evaluate scheduling, extended history, and additional accounts/features when
  requested, including any resulting persistence requirements.
- [ ] Revisit TikTok only with a supported publishing approach and an explicit decision.

## Open decisions and blockers

- Native Android development build and device verification are still pending.
- Final platform support depends on Stage 4 evidence, not just having credentials.
- The native background upload implementation/library has not been selected.
- Basic credential form implemented; broader app visual direction remains open.
- Credential form checked in the browser; native save/keyboard verification is pending.
- Mobile dev script uses port 8082.
- iOS distribution and desktop implementation are intentionally undecided.
