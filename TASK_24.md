# Task 24 — final release gates, signing and device QA

Prepared 2026-10-09. Inspected Task 23, RELEASE.md, Android signing configuration
and privacy draft first. Continued from the owner's supplied full request.
No commit, push, deployment, upload, Play submission or publication performed.
No new dependency, backend, ads, analytics, account, permission or game balance change.
Existing Task 22D/23 dirty files preserved.

## Files — Task 24 changes only

Created: `TASK_24.md`, `public/privacy-policy.html`, `tests/releaseGates.test.ts`,
`scripts/{privacy-qa,signing-hygiene}.cjs`,
`release-assets/{play-console-checklist,device-qa-checklist}.md`.

Modified: `.gitignore`, `README.md`, `package.json`, `android/app/build.gradle`,
`scripts/{android-release.ps1,native-adapter-qa.cjs,performance-qa.cjs,pwa-qa.cjs,
static-qa.cjs,store-assets.cjs,verify-android-artifacts.cjs,save-qa.cjs}`,
`src/{components/PrivacyPolicy.tsx,components/SaveDataPanel.tsx,data/privacy.ts,pages/ProfilePage.tsx,pages/WelcomePage.tsx,profile.css}`,
`release-assets/{RELEASE.md,policy-audit.md,privacy-policy-draft.md}`.
Capacitor-generated files regenerated without semantic changes; build/QA outputs ignored.

## Upload key and signing — BLOCKED: private configuration missing

Owner explicitly approved creation CONDITIONALLY, chose these absolute external
paths and alias; do not ask for approval again or choose a different identity:

- `C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks`
- `C:\Users\THIS PC\muu-sinh-secure\signing.properties`
- Alias `muu-sinh-upload`.

Created ONLY the private directory, rejected junction/symlink, removed inherited
ACLs and verified explicit FullControl for Windows owner and SYSTEM only.
Keystore/properties files do not exist yet. No password read/generated/printed;
no key generation or private certificate fixture executed. Signing approval alone
does not supply passwords. Owner must enter them LOCALLY, never in chat/logs/Git.

`RELEASE.md` has exact approved paths, protected private properties format,
interactive Java keytool RSA3072/SHA256withRSA/10000-day commands WITHOUT password
argv options, public fingerprint inspection, Gradle workflow and secure backup/
recovery. Commands are documentation, not executed. Never overwrite existing keys.
Maintain two encrypted recovery-tested backups in separate owner-controlled
locations; passphrases stored separately. Distinguish upload and Play signing keys.

New `qa:signing` checks actual Git index FILENAMES only without opening credentials.
No private signing/environment filenames tracked; extended ignores tested against
custom signing/keystore properties and private keys. This is NOT a Git-history or
file-content secret scan. Do not promise historical secrets absent.
`mobile:bundle` runs this hygiene check first. Existing external-path/non-debug/
required-upload-signing/fingerprint gates preserved; Gradle additionally checks
certificate validity. JDK signature parsing now uses explicit English locale.
Public SHA1/SHA256 fields available only after real signed verification.

Expected negative checks PASS: missing-credentials `mobile:bundle` refuses before
build; Gradle `-PrequireUploadSigning=true` refuses; verifier rejects unsigned AAB.
Positive signed-build/certificate-pin path NOT TESTED, no cert fingerprints invented.

## Actual Android artifacts

Final package configuration remains com.muusinh.game / versionCode1 / version1.0,
minSdk24, target/compile36, AGP8.13.0, Gradle8.14.3, JDK21.0.12.
Debug APK and unsigned inspection AAB rebuilt from final dist after native sync.
Final unsigned AAB: `D:\muu-sinh-game\android\app\build\outputs\bundle\release\app-release.aab`
(4,804,295 bytes), SHA256
`970d0ff722761339ad6c440d1f64d3732523adc41cc254a427c73e80c62e0a62`.
Final debug APK: `D:\muu-sinh-game\android\app\build\outputs\apk\debug\app-debug.apk`
(6,205,281 bytes), SHA256
`a4f49c558af13fa7b0ed454f7ffe8170cdb1c36a31deed5d13ce875df70ece52`.
Bundletool validation PASS; AAB UNSIGNED, no upload certificate SHA1/SHA256.
Signed AAB remains BLOCKED; debug APK is development-only signing.
Do not infer signing from Gradle task name `signReleaseBundle`.

Actual bundletool validation, manifest/assets/hash report:
`node_modules/.tmp/task-23/android-artifacts.json` (ignored tooling output).
39 bundled dist files, including policy HTML, must match APK/AAB byte-for-byte.
Zero packaged .so libraries; no ELF alignment requirement in this Java/web bundle.
Real Android16/16KB environment acceptance still pending, not certified by a build.

## Privacy — draft ready for owner review, NOT published

Actual saveStorage/saveService/portable saves, PNG renderer, native Filesystem/
Share/FileExport Java, provider/permissions, SDK config and final artifact audited.
Muu Sinh Studio / MƯU SINH remain identity; no contact email or public URL invented.
No observed app-owned backend/telemetry/ID upload or ad/analytics SDK in current
runtime. INTERNET and generated signature receiver permission only; picker/share
grant selected files, not broad storage. OS/hosting/receiver behavior is separate.

Corrected TWO inaccurate prior draft claims without changing behavior:

- Current PNG contains job/result/statistics, not nickname. JSON contains nickname
  and full save. Import checks chosen file and requires existing confirmation.
- Reset replaces active save but retains recovery; restore/migration also write
  recovery, with no TTL. Clear app/site data to remove both local slots; exported
  copies and possible OS backups must be removed separately. No promise that
  reset/uninstall erases every copy. Existing recovery tests retained unchanged.
  Reset UI now says **ĐẶT LẠI TIẾN TRÌNH** and explicitly warns about recovery;
  typed confirmation `XÓA` and reset/restore implementation remain unchanged.

Web privacy HTML `/privacy-policy` (physical file `/privacy-policy.html`) is
script-free Vietnamese, responsive, no external resources, draft warning/noindex.
Noindex is NOT access control. No deployment/publication performed; do not deploy
draft as a final policy before real contact/approval. HTML, Markdown and inline
text regenerate from one `src/data/privacy.ts` source.
Welcome/Profile visible link works offline. Native click uses local-text dialog
with EXISTING Back/cancel handler, keeping React/game listeners/navigation alive
instead of navigating the WebView. Physical behavior still needs device QA.
Browser HTML/clean URL refresh and mock-native offline dialog tests PASS; save
unchanged and no extra native listeners. Native file sharing is NOT device-verified.
Public HTTPS URL/contact/owner approval and legal/Data Safety decisions still pending.
[User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).

## Branding and Console drafts

Branding explicitly NOT officially approved. No artwork redesigned/replaced.
Actual icon512×512 RGBA PNG, feature1024×500 JPEG and seven1080×1920 JPEG images
dimension-checked; adaptive108dp foreground, monochrome, splash288dp resource
references audited. Existing store screenshots are real production BROWSER UI,
not physical Android images; provenance remains unapproved. Light/night mask/
WebView/launcher visual approval still needs owner/device.

`play-console-checklist.md` covers Data Safety, app access, no-ads runtime findings,
undecided audience/rating, permissions, listing/contact, Play App Signing,
internal tester/feedback setup, account-specific closed testing and deliberate
versionCode increments. No Console answers submitted. Internal-only apps are
currently exempt from public Data Safety and may test before app setup completes;
owner's privacy/branding/device release gates still apply to this project.
[Testing tracks](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en).

## Physical Android — BLOCKED

Host `adb devices -l` succeeded with EMPTY device list. Initial sandbox could not
start ADB daemon; permitted host check resolved that tool issue, but no phone exists.
No model/API/native sharing/FPS/crash evidence fabricated. No device install,
clear-data or uninstall attempted. `device-qa-checklist.md` has all26 named jobs,
touch/Back/pause, 45s active-time logging, offline/restart saves, native PNG/JSON,
Shop/Garage/Room, keyboard/insets/Android16/16KB/modest-phone acceptance.

## Timer, performance and confirmed fix

Previous 45.92–79.79s measurement was construction→callback, not separated active
play. Task23 observer separates boot, first frame→zero, result overlay and raw vs
Phaser-smoothed delta. Browser throttling/stalls and explicit pauses differ from
scoreable game time; old untraced samples cannot be explained retroactively with
certainty. All five timer implementations subtract scene delta. No gameplay timer,
duration, score, movement or Phaser lifecycle changed without a confirmed bug.
Fresh observation-only real-time desktop Chrome154 measurements (shared PC,
other production QA also running; not isolated or physical Android benchmarks):

- Construction foreground: **44.975s active wall /45.012s scene delta**,
  boot0.385s, overlay0.888s, max raw19.482ms, zero hidden/unfocused frames.
- Taxi foreground: **45.080s active wall /45.019s scene delta**,
  boot0.161s, overlay0.864s, max raw51.406ms, zero hidden/unfocused frames.
- Construction after deliberate5s tab switch: **49.636s wall /45.007s scene
  delta**, raw49.637s, max raw1007.1ms. Headless Chrome did NOT emit Phaser
  blur/hidden events here. RAF stalls/smoothing explain ~4.63s of THIS sample;
  this is not native pause validation or proof every old79.79s sample is explained.

Timer observer output: `node_modules/.tmp/task-23/timers.json` refreshed Task24.
Clock-driven full regression also incurs automation scheduling/screenshot/PNG/
React overhead and cannot be used as a physical stopwatch or FPS measurement.
No confirmed foreground timer bug; no gameplay timing/scoring change justified.

Current build main426.12KB/132.10KB gzip, lazy game1371.83KB/373.99KB gzip,
CSS59.38KB/13.36KB gzip. No suppressed chunk warning or new asset dependency.
Fresh desktop profile: cold Welcome176.7ms/firstpaint44ms (loopback/warm brand
preview first, NOT Android cold process startup); main loads no Phaser before
play. Home/Town119 RAF samples median6.9ms, p95~7.0/7.1ms on144Hz desktop.
Town26 locations/695 SVG children, no overflow, successful scrolling.
Seven boot/dispose cycles: ready122.8–441.5ms; zero connected canvases and zero
surviving Game WeakRefs after forced GC each time. Heap7.60MiB after first
disposal→8.66MiB after seventh; initial pre-Phaser2.76MiB. Not proof of no leak,
no long-session/GPU/native heap or low-end phone certification. Report:
`node_modules/.tmp/task-22d/performance.json` refreshed Task24. No engine rewrite.

Confirmed UI bug: full QA measured Profile footer bottom858px at360×800. Fixed
ONLY Profile shell to viewport height, scrollable non-shrinking content, fixed
header/footer, including expanded privacy. Recheck passed three mobile sizes;
no assertion removed. Performance harness now defaults to its actual production
preview instead of depending on a possibly stale/absent dev server at5173;
`PWA_QA_BRAND_PREVIEW_URL` preserves explicit preview override when needed.
The full PWA gate also exposed a QA-only reconnect race: two stacked Playwright
network overrides were removed in the wrong order, so no effective browser
offline→online edge was emitted. Reversed teardown order and added a focused
connectivity gate; production `PwaStatus` behavior was not weakened or changed.

## Regression verification

- PASS lint, `npm run test -- --run`, test:run: **567 tests/35 files**, all559
  baseline retained, eight new hygiene/draft/expiry/locale boundaries.
- PASS build, `npm run release:check`; added `npm run release` alias invokes ONLY
  release:check, never publishing/signing/deployment. Static39 assets/26scenes;
  precache41 entries/3069.48KiB including offline privacy HTML.
- PASS cap sync, debug APK and unsigned AAB Gradle builds; signed path blocked.
- PASS focused privacy production QA, clean routes/offline/mobile+desktop,
  unmutated localStorage, mock-native dialog Back/no-SW/no-listener changes.
- PASS branding production QA: adaptive safe-circle29.77dp, Home four sizes,
  light asset references/navigation, 26 Career jobs/46 achievements, reduced
  motion, offline game/result and actual1080×1350 PNG. Owner approval still pending.
- PASS actual-time timer observer and seven-cycle desktop performance/lifecycle
  checks described above.
- PASS full production PWA suite: Profile/Shop/Missions/save/Town, all26 native
  mock pause/resume/Back/teardown cases, all26 offline timer/result/Career/actual
  PNG/replay cases, persistence, install CTA, reconnect, update and standalone
  offline backup/restore. Mock bridge/browser evidence is not physical-device QA.
- PASS git diff --check; nonblocking existing Vite chunk-size/Gradle flatDir/SDK
  XML warnings retained. Sandbox VitestSSR ENOENT resolved by host rerun, not by
  disabling tests. No src/game/store/economy/daily/save mechanics modified.

## Exact next owner actions

1. Open `C:\Users\THIS PC\muu-sinh-secure\signing.properties` in a private local
   editor and populate RELEASE.md format/passwords privately. Reply only
   **configuration ready**, not file content. Key generation remains paused.
2. Approve privacy/branding, supply real email and separately authorize public
   policy publication. Review audience/rating/account identity and declarations.
3. Connect/authorize phone, verify JSON backup before any signature install changes;
   complete physical-device checklist. Do not uninstall to bypass certificate errors.
4. After private config/key/fingerprint exists, run signed workflow, verify bundle
   signature/certificate/hash, back up securely; only then OWNER manually manages
   Play App Signing and Internal Testing upload/opt-in/feedback. No automatic upload.

Recommended Task25: signed-device acceptance and owner-controlled Google Play
Internal Testing after private signing configuration and project gates are cleared.
