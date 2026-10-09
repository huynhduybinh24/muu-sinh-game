# Task 23 — Android release AAB and Google Play preparation

Prepared 2026-10-09. Repository, Task 22C/22D and actual Android configuration
inspected first. No commit, push, deployment, key generation, upload or publication.
Existing Task 22D working-tree changes preserved. No new dependency or service.

## Status and owner decisions

- PASS: owner explicitly confirmed final applicationId `com.muusinh.game`.
  Play Console package availability/account ownership still needs verification.
- PASS: developer display name supplied: **Muu Sinh Studio**.
- NEEDS OWNER APPROVAL: Task 22C branding is NOT officially approved. Store assets
  below are drafts from the existing identity, not approved/published assets.
- BLOCKED: no contact email or public privacy URL supplied. Owner requested a
  reviewed draft first, not publication or an invented URL.
- BLOCKED: no dedicated upload signing credentials configured; no real Android
  device connected. A valid unsigned bundle is NOT upload-ready.

## Files created — Task 23 only

- `TASK_23.md`
- `scripts/android-release.ps1`
- `scripts/verify-android-artifacts.cjs`
- `scripts/timer-investigation.cjs`
- `scripts/store-assets.cjs`, `scripts/png-rgba.cjs`
- `src/components/PrivacyPolicy.tsx`, `src/data/privacy.ts`
- `tests/androidRelease.test.ts`
- `release-assets/{RELEASE.md,store-listing.vi.md,policy-audit.md,privacy-policy-draft.md}`
- `release-assets/{app-icon.svg,app-icon.png,feature-graphic.svg,feature-graphic.jpg,capture-provenance.json}`
- `release-assets/screenshots/{01-home,02-town,03-job-construction,03-job-sugarcane,04-shop,05-garage,06-room}.jpg`

## Files modified — Task 23 only

`.gitignore`, `README.md`, `android/app/build.gradle`, `capacitor.config.ts`,
`package.json`, `src/pages/{WelcomePage,ProfilePage}.tsx`, `src/profile.css`.
Capacitor-generated Gradle files were regenerated without semantic changes.
Build/QA outputs and downloaded tooling remain ignored, not source deliverables.

## Package, SDK and Android 16 audit

PASS: namespace/applicationId `com.muusinh.game`, versionCode **1**, versionName
**1.0**, minSdk **24**, target/compile SDK **36**. AGP **8.13.0**, Gradle
**8.14.3**, existing **JDK 21.0.12**, installed Android SDK 36. Release remains
`minifyEnabled false`; no debug-signing fallback or security/SDK downgrade.
Increment versionCode deliberately before later Play uploads.

Current [Google Play target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
requires API 36 for new mobile apps/updates from 2026-08-31; this target passes
that configuration gate. Recheck policy/Console before actual submission.

Source-reviewed Android 16 configuration, unchanged where already correct:

- Edge-to-edge: Capacitor 8 SystemBars CSS insets, native safe-area CSS and
  responsive canvas; no opt-out. Native orientation remains portrait and app
  category `game`. Android 16 large-screen game exception is not tablet QA.
- Back: Capacitor App uses AndroidX OnBackPressedDispatcher/Callback; JS listener
  handles edit/dialog/history, game pause before leaving, Home minimize.
  No `enableOnBackInvokedCallback=false` or custom legacy Back rewrite added.
- Keyboard: existing `adjustResize`, native inset handling and input blur action.
- Status/navigation bars: existing SystemBars `LIGHT`, not hidden. Runtime
  predictive gestures, IME and inset behavior still require Android 16 devices.
  [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16).

Final AAB manifest requests INTERNET and AndroidX-generated signature-level
`com.muusinh.game.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` only. Provider is
non-exported with per-file URI grants; launcher Activity exported as required.
No dangerous storage, identifier, location, camera or microphone permission.

PASS structural 16KB audit: actual debug APK and release AAB contain **zero `.so`
libraries**. Java/AndroidX/web assets only; ELF alignment checks are not applicable.
System WebView's native libraries are supplied by the OS, not this bundle.
Still test in a 16KB environment; this is not a device certification.
[Android 16KB guidance](https://developer.android.com/guide/practices/page-sizes).

## Signing and reproducible release workflow

PASS configuration/gates: `MUU_SINH_SIGNING_PROPERTIES` points to a private
properties file outside the repository. It provides an external keystore path,
type, alias and passwords; no password appears in source/argv. Partial config,
inside-repository paths, missing certificate or Android Debug certificate fail
with sanitized errors. Dedicated upload signing is optional only for unsigned
inspection; `-PrequireUploadSigning=true` explicitly refuses missing credentials.
The missing-key gate was executed and correctly FAILED, as expected.

PASS negative artifact gate: `verify-android-artifacts.cjs --require-signed`
rejects the actual unsigned AAB. `npm run mobile:bundle` refuses missing private
configuration before building. No upload credential or public fingerprint invented.

`npm run mobile:bundle` (Windows PowerShell) runs release:check → cap sync →
Gradle signed bundle gate → actual artifact verification. Owner-approved PUBLIC
certificate SHA256 must match `MUU_SINH_UPLOAD_CERT_SHA256`. bundletool path is
explicit (`BUNDLETOOL_JAR`); neither variable is a frontend runtime dependency.
No deployment or Play upload command is included. Debug workflow stays intact.

BLOCKED: dedicated upload key not created; signed-build positive path, certificate
pinning with an actual upload key and Play App Signing enrollment NOT tested.
Owner must explicitly authorize/manage key creation and choose passwords privately.
Never use debug credentials. External-file permissions and encrypted backups
are owner responsibilities, not claimed as already configured.
Detailed exact commands, backup/recovery and twelve Console steps:
`release-assets/RELEASE.md`.

## Actual artifacts — final production assets

PASS: `npm run build`, `npx cap sync android`, `:app:assembleDebug` and
`:app:bundleRelease` executed with existing SDK/JDK. Gradle's task named
`signReleaseBundle` is NOT proof of a signed artifact: JAR verification found
the actual AAB unsigned.

Debug APK:

`D:\muu-sinh-game\android\app\build\outputs\apk\debug\app-debug.apk`

- **6,204,641 bytes**.
- SHA256 `322c79f1360d8f671bb2f66b013cd3e4883f123931f8be4a1b6cd850188a56b9`.
- Development/debug signing only, not a Play production key.

Release AAB:

`D:\muu-sinh-game\android\app\build\outputs\bundle\release\app-release.aab`

- **4,800,921 bytes**.
- SHA256 `c9605386be2c43416a3e255acaa3c3881e606db0e1b575b585d38f2f85c8bb05`.
- Actual bundle manifest: `com.muusinh.game`, `1 / 1.0`, min24/target36,
  release not debuggable, expected two permissions.
- bundletool **1.18.3 validate PASS**. Downloaded from Google's official release,
  SHA256 verified against release digest; tool is not bundled/committed.
- **UNSIGNED — NOT UPLOAD-READY**. No upload certificate/fingerprint exists.
- All **38 dist files** match both APK and AAB entries byte-for-byte (SHA256),
  including offline shell, manifest, branding, icons, SW and all scene code.
  Report: ignored `node_modules/.tmp/task-23/android-artifacts.json`.

## Timer investigation

PASS measured desktop foreground samples, no confirmed player-facing timer bug.
No gameplay timer, score, mechanics, duration, economy or Phaser config changed.

Previous 45.92–79.79s readings measured Game construction → React callback,
not exclusively active play. Current observation-only sequential production
Chrome 154 measurements separate first engine update, zero time and callback:

- Construction foreground: **44.971s active wall**, **45.012s scene delta**,
  boot **0.320s**, end overlay **0.888s**, no unfocused/hidden frames.
- Taxi foreground: **45.020s active wall**, **45.019s scene delta**, boot
  **0.126s**, end overlay **0.872s**, no unfocused/hidden frames.
- Construction with a deliberate 5s tab switch: **49.649s wall**, **45.007s
  scene delta**, raw total49.656s, maximum raw frame1007ms. Headless Chrome
  did NOT emit Phaser hidden/blur events in this case: no native pause claim.
  The background RAF stall/smoothing therefore explains ~4.65s of this sample.

All five shared/standalone timer implementations subtract Phaser smoothed delta;
movement/scoring use that same game-time model. Phaser clamps unfocused/cooldown
frames and replaces very long deltas; browser stalls/throttling can extend wall
time without adding scene gameplay time. This is source evidence, not a proven
complete explanation of every old 79.79s parallel-bot sample. Old harness timing
had no frame/focus trace, so exact attribution cannot be recovered retrospectively.

Native pause currently sleeps the engine and restores frame timing on resume;
mock bridge regression checks freeze timer/score/frames, then resume and destroy
without a false result. Those tests are NOT physical-device stopwatch measurements.
BLOCKED: low-end Android timing/performance and 26-job active-time acceptance;
do not claim a universally absent timing bug based on two desktop foreground cases.
Reproduce via `scripts/timer-investigation.cjs` with existing QA browser env vars;
report `node_modules/.tmp/task-23/timers.json`. No fake clock in that investigation.

## Performance findings

Current build: main JS **424.34KB / 131.67KB gzip**; lazy Phaser/game chunk
**1,371.83KB / 374.00KB gzip**; CSS **58.80KB / 13.28KB gzip**. Warning remains
visible, not hidden by changing limits. SW precache40 entries /3061.13KiB.
Local native package sizes above are small enough to inspect/test, not a device
performance guarantee. SVG and PNG brand variants intentionally support UI/export;
no assets/quality were removed merely to reduce size. No proven duplication bug.

New actual desktop reference profile (not Android benchmark): cold Welcome
**293ms**, first paint72ms, DCL143ms; Home loads no Phaser. Home/Town RAF median
6.9ms, p95~7.1ms; Town26 locations/695 SVG descendants, no body overflow.
Seven actual scene boot/dispose cycles with mock Back and CDP forced GC:
READY137–559ms, 0 surviving Game WeakRefs /0 connected canvases after each
disposal. Heap after first disposal7.60MiB → eighth sample8.66MiB; initial
pre-Phaser2.75MiB. Modest growth/cache warmup is not proof of no leak or a leak.
No long-session/GPU/native-heap or physical-phone benchmark claimed.
Measured report `node_modules/.tmp/task-22d/performance.json` refreshed for this build.
No optimization made without a confirmed bottleneck.

## Store, privacy and preservation

PASS technical draft package: Vietnamese title28/short74/full1260 characters,
release notes and supported-device caveats. Original square **512×512 RGBA8
(32-bit) PNG** icon, **1024×500 JPEG** feature graphic, editable SVGs and seven
**1080×1920 JPEG** genuine production UI screenshots (Home, Town, two jobs,
Shop, Garage, Room). Garage/Room show truthful new-profile empty inventory;
no progress was fabricated for promotional screenshots. These are browser
captures, NOT native Android captures. Draft/provenance/alt texts included;
NEEDS OWNER APPROVAL branding and eventual Android store visuals.
[Play assets guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

Privacy draft audited against app source, Java, runtime dependencies, final
manifest and registered SDKs. LocalStorage profile/save v5, user-directed PNG/
JSON/clipboard export, external receivers/document providers and Android
`allowBackup=true` system behavior disclosed. No ad/analytics/backend/identifier
collection code or SDK found in inspected runtime; offline browser UI made zero
external requests. This is not a native traffic capture or a claim that user files
never leave the device. Web hosting requests can involve IP/connection metadata.

In-app policy text is accessible offline on Welcome and Profile; details element
does not replace navigation/result/save systems. The same source generates
`release-assets/privacy-policy-draft.md`. Explicitly a draft, publisher supplied,
no invented email/URL. BLOCKED public policy/contact and final Data Safety/legal
approval. Data Safety exceptions, ads/access/audience/rating/identity owner
guidance is in `release-assets/policy-audit.md`; no answers submitted.

PASS preservation: no `src/game`, store, economy, save migration, job data,
achievement, daily schedule or existing share/export logic modified. Cloudflare
root/dist/build workflow unchanged. Web and Android storage remain separate.
Backup JSON BEFORE changing signing identity; a differently signed release cannot
update an installed debug package. No uninstall or clear-data operation performed.

## Automated verification

- PASS final lint, test:run (**559 tests /34 files**, all552 baseline tests retained
  plus7 focused release/privacy/icon/store tests), build, release:check/static.
- PASS cap sync, debug APK, unsigned release AAB, bundletool validation, exact
  assets, manifest, no `.so`, JAR signature inspection, missing-key negative gate.
- PASS production PWA lifestyle and updates suites: 100 items/10 categories,
  ownership/purchases/equipment, Gara/Room, offline reload/v5 JSON restore, SW
  update and standalone behavior. PASS actual 26-scene avatar/render/disposal QA.
- PASS mock-native 26-scene Back/pause/resume/disposal integration; not a device.
- PASS production **26/26** jobs offline: timer/result/Career, actual1080×1350
  PNG downloads and replay; one canvas during play/zero after completion,
  persistence/reconnection, tutorials and conditional installation CTA. Update/
  standalone/offline backup checks also passed. Artifacts:
  `C:\Users\THIS PC\AppData\Local\Temp\muu-sinh-pwa-qa-bpGSaU`.
  This suite uses an accelerated browser clock for regression coverage, separate
  from the actual-time three-case timer investigation; NOT Android device QA.
- Initial sandbox Vitest temp-path ENOENT affected imports; normal permitted host
  rerun passed all tests. Initial screenshot selector mismatch fixed in QA code;
  final store capture passed. No regression assertion removed or weakened.
- PASS `git diff --check`; ignore rules exclude SDK paths, build outputs, signing
  properties, JKS/keystore/P12/PFX and APK/AAB/APKS. No secret values printed.
- Non-blocking existing Vite chunk-size, Gradle flatDir and SDK XML warnings remain.

## Real device and remaining release gates

**BLOCKED**: `adb devices` returned an empty authorized-device list. No model,
Android version, native touch/export/sharing, crash/FPS or startup measurements
invented. A Gradle build/browser test is not physical-device acceptance.

Owner actions, in order:

1. Approve branding/listing and draft privacy text; provide real contact email,
   legal/account details and intended audience. Authorize policy publication
   separately and supply resulting public URL; update draft markers afterward.
2. Confirm package availability and correct Play account; authorize/manage creation
   of a dedicated upload key, secure backups/properties and PUBLIC fingerprint.
3. Connect/authorize physical Android; backup existing save before any signature
   change. Follow `release-assets/RELEASE.md` full26-game/native-file/offline/
   storage/Back/IME/Android16/16KB/crash/performance checklist.
4. Build/verify a signed AAB with `npm run mobile:bundle`; configure Play App Signing,
   accurate policy declarations and device/store install testing. None performed
   automatically. New personal accounts may require12 continuous opted-in testers
   for14 days in closed testing before requesting production access; account type
   and registration date are unknown. Recheck actual Console requirements.

Recommended next task: **Google Play Internal/Closed Testing**, only after signing,
privacy/contact, branding and real-device release gates are cleared.
