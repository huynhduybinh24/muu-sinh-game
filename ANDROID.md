# Android foundation

Capacitor 8.5.3 wraps the existing Vite app. App name: **Mưu Sinh**; provisional
application ID: **com.muusinh.game**. Confirm ownership/final ID before publishing;
changing package ID or local hostname creates a separate storage environment.
No publication, release signing, backend, analytics or Cloudflare workflow changes.

## Build and open

```sh
npm ci
npm run release:check
npm run mobile:sync
npm run mobile:open
```

Equivalent: `npm run build`, `npx cap sync android`, `npx cap open android`.
`mobile:run` rebuilds/syncs then runs on a selected emulator/device. Android assets
are bundled from **dist**; there is no production `server.url`. Native Gradle
builds do not rebuild JS: sync again after web changes. Generated assets/config
are ignored; native source, Gradle configuration and wrapper belong in Git.

Install Android Studio **2025.2.1+**, Android SDK platform **36**, matching Build
Tools and Platform Tools; use JDK **21**. Open **android/**, allow Gradle sync,
select a device/emulator and Run. Debug APK: `android\gradlew.bat -p android assembleDebug`
from the repository root, or `./gradlew assembleDebug` from `android/`.
Output: `android/app/build/outputs/apk/debug/app-debug.apk`. The debug build uses
Android tooling's standard debug certificate; no release signing keys are created
or committed by this task. See [official setup](https://capacitorjs.com/docs/getting-started/environment-setup).

Minimum SDK 24; compile/target 36; game category, portrait activity, resize for keyboard, visible
system bars with light-surface icons and native safe-area CSS fallbacks. Android
16 exempts games from its large-display orientation override; the web layout remains
responsive. See [Android behavior](https://developer.android.com/about/versions/16/behavior-changes-16).
Keep Android System WebView/Chrome updated; the existing Vite app targets modern WebViews.
Back dismisses app dialogs or keyboard first, follows previous screens otherwise,
and pauses gameplay for explicit Resume/Leave. Home Back minimizes, never forces exit.
Native pause/background events freeze the Phaser engine and clear held touch input;
resume is explicit so background time is not charged to the 45-second job.

## Files and storage

Web PWA registration/install UI is skipped only inside native Capacitor; web builds
still use the unchanged service worker. Android needs no service worker for offline
play: all app chunks/assets are bundled. Cloudflare remains `npm run build` → `dist`.

Web and Android WebView localStorage are **different origins/stores**. There is no
automatic sync or transfer. Export the web JSON backup, copy it to the phone and
use Profile → Restore in Android; existing validation, preview and explicit
confirmation remain in place. Schema/version 5 is unchanged. App restart should
retain WebView storage, but uninstall/clear app data removes it: keep backups.

Native PNG/JSON Save uses a small Android `FileExportPlugin` and the system's
`ACTION_CREATE_DOCUMENT` picker: choose the destination (for example Downloads),
without broad storage permissions or needing a Share recipient. PNG Share uses
the official Share plugin and restricted FileProvider path. Both use Filesystem
for UTF-8/private-cache staging with unique URIs; files older than 24 hours are
removed on a later export. Native restore reuses HTML file input, handled by
Capacitor's built-in Android document chooser. Browser download/Web Share/copy
fallbacks are retained. Cancellation is not treated as successful delivery.
No real-device sharing, chooser or restart-persistence success is claimed yet.

## Performance and validation

Gameplay remains lazy-loaded; Town is memoized SVG/CSS with no Phaser instance.
Existing scenes already clean up timers/input/tweens and use a bounded visual pool.
No unmeasured changes to renderer resolution, FPS, assets, job mechanics or economy.
New native pause sleeps the engine; teardown wakes a sleeping loop so Phaser's
deferred destroy can release canvas/resources. Tests cover the lifecycle boundary,
including explicit gesture cancellation for Shipper/Carwash/Rubber without scoring
a release or treating an Android interruption as a failed rubber-tapping attempt,
not Android hardware performance. Unit/plugin mocks are not native device tests.
The production browser QA also injects an explicitly mocked Capacitor bridge to
check Back, no service-worker registration and freeze/teardown in all ten games;
this is **not** native sharing or device validation. The Android instrumentation
smoke tests under `android/app/src/androidTest/` remain unexecuted until an SDK and
emulator/device are available (`gradlew connectedDebugAndroidTest`). Launcher and
splash artwork still use the generated Capacitor placeholders; replace before release.

Verified: lint, 305 unit tests (all original 274 retained), production build,
`release:check`, static PWA checks and `cap sync android` pass. Full production
PWA/offline QA and all-ten-job browser scene QA pass. A fresh final-build mocked
bridge check also passes editing/dialog Back, screen history, minimize, pause/resume
and teardown. These browser/unit results do not validate the native APK or file picker.

Before Android release, on a mid-range phone verify all ten touch controls, drag,
D-pad release after backgrounding, timer freeze/resume, safe areas, keyboard,
hardware Back/predictive Back, cold launch offline, restart persistence, JSON
export/restore, PNG chooser delivery and Unicode filenames/content. Profile Android
WebView rendering/heap with Chrome remote debugging/Android Studio before tuning.

Current host check: Node 22 and Oracle JDK 21.0.12 are present. Official Google
Android command-line tools 22.0, SDK Platform 36 revision 2, Build Tools 36.0.0
and Platform Tools 37.0.1 are installed under `%LOCALAPPDATA%\Android\Sdk` without
Android Studio. User SDK environment variables and ignored `local.properties` are
configured. The earlier Gradle loopback/lock failures were caused by the restricted
runner context: the unchanged Gradle 8.14.3 wrapper and AGP 8.13.0 run normally
outside that restriction. `assembleDebug` passes and produces the verified debug
APK; no device was connected for installation QA.
Latest stable CLI currently has 3 moderate dev-only audit entries through its
iOS xcode/uuid dependency chain; production dependency audit is clean. Do not
use a breaking `npm audit fix --force`; recheck upstream before publication.

## Implementation files (Task 20)

Created:

- `capacitor.config.ts`, `ANDROID.md`, generated `android/` native source/resources/Gradle wrapper.
- `src/services/platform.ts`, `src/services/navigation.ts`, `src/services/nativeFiles.ts`.
- `src/hooks/useNativeApp.ts`, `src/components/NativeGamePause.tsx`, `src/game/lifecycle.ts`, `src/native.css`.
- `tests/mobile.test.ts`, `tests/gameLifecycle.test.ts`, `scripts/native-adapter-qa.cjs`.
- `scripts/native-gestures-qa.cjs`: browser-scene held-input interruption regression checks.
- `android/app/src/androidTest/java/com/muusinh/game/AndroidFoundationTest.java` replaces generated demo tests (not executed).
- `android/app/src/main/java/com/muusinh/game/FileExportPlugin.java`: scoped document-picker export; registered in `MainActivity.java`.

Modified existing project files (pre-existing Task 18/19 changes preserved):

- `package.json`, `package-lock.json`, `.gitignore`, `eslint.config.js`, `tsconfig.node.json`, `README.md`, `BETA_CHECKLIST.md`, `scripts/pwa-qa.cjs`.
- `scripts/avatar-qa.cjs`, `tests/avatar-qa-browser.ts`: native-pause browser-scene harness only.
- `src/App.tsx`, `src/main.tsx`, `src/hooks/usePwaInstall.ts`, `src/pages/GamePage.tsx`, `src/game/PhaserGame.tsx`.
- `src/components/GameStartOverlay.tsx`, `src/components/SaveDataPanel.tsx`, `src/pages/ResultPage.tsx`.
- `src/services/saveService.ts`, `src/services/shareCardImage.ts`.
- `src/game/scenes/ShipperScene.ts`, `CarwashScene.ts`, `RubberScene.ts`: native-pause gesture hooks only; normal controls/scoring unchanged.

Native generated template adjustments: game/portrait/keyboard manifest, restricted
`res/xml/file_paths.xml`, Google Services removed from `build.gradle` and
`app/build.gradle`. SDK paths, generated web assets, signing keys and build
outputs are ignored. No commits/pushes/deployment performed.
