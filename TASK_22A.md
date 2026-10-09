# Task 22A — twenty playable jobs

All ten original configs/scenes, scoring, economy and progression formulas are
unchanged. The new jobs are immediately accessible from Town and Career, without
date, level or purchase gates. React still owns navigation/persistence/results;
Phaser reports the existing `GameResult` callback, with optional additional metadata.
No packages, plugins, backend, paid services or remote assets were added.

## Gameplay

- Banhmi: five ingredient toggles, exact customer recipe, serve/reset; 100 correct,
  speed bonus up to 50, wrong −50, timeout −30.
- Gas: select E5/RON95, hold filling then release near requested liters;
  120/80/40/−40, timeout −25. Rate/patience difficulty stays capped.
- Cargo: drag a moving package to its symbol/destination truck;
  90 plus bounded combo, wrong −35, timeout −20.
- Cleaning: drag a broom over leaves/paper/bottles using segment-distance checks;
  a clean section gives 100 plus cleanliness bonus up to 40, drain/timeout −10.
- Electrician: connect matching named/color terminals in a fictional toy circuit;
  complete solution 120/80/40 by mistakes, invalid/timeout −30.
- Florist: drag three flowers into ordered slots and choose a ribbon;
  exact/close/acceptable/wrong 150/100/50/−30.
- Security: detect open door, leaking tap, displaced crate or ringing bell;
  correct 100 with reaction bonus up to 30, false alarm −40, missed event −25.
  Clues concern objects, never anyone's appearance.
- Photographer: drag a viewfinder, wait for the bird's pose and hold it steady;
  framing/timing/stability grades 150/100/50/0.
- Cashier: scan every grocery item and choose exact Vietnamese-currency change;
  correct 100 plus speed up to 50, incorrect/incomplete −40, timeout −25.
- Harvest: tap marked ripe fruit, avoid green fruit/wasps;
  40 plus capped combo, wrong −20, each five-fruit basket +100.

Every game lasts 45 seconds. Scores floor at zero; input freezes at completion.
Drag/hold scenes cancel interrupted gestures without awarding a release or penalty.
Timers/listeners/tweens and the fixed 24-particle pool follow existing cleanup.
Artwork uses reusable Graphics, not dynamically generated large textures.

## Compatibility

The six-job historical epoch and the 2026-11-01 ten-job epoch remain frozen.
The appended twenty-job and mission epochs begin 2026-12-01. Prior mission pools
and templates are unchanged. The original ten-job collection achievement stays
at ten; new job-specific achievements require ten plays and old unlocks survive.

Town keeps original coordinates and extends its scrollable canvas to 720×2300,
with ten additional locations, original SVG building details, district labels
and the grouped accessible directory. Town creates no Phaser instance.
Gameplay remains in the lazy GamePage chunk and is precached offline.

Share cards keep the existing layout and add local vector icons, colors and
typed metadata for all ten new jobs. Backup format stays v5; older ten-job
backups restore balances, profile, inventory and unlocks, with empty new stats.
Android/WebView storage does not automatically receive Cloudflare web saves:
use the existing JSON export/restore migration.

## Implementation files

This task creates 27 files and modifies 34 existing files.

Created:

- `src/game/config/{banhmi,gas,cargo,cleaning,electrician,florist,security,photographer,cashier,harvest}Config.ts`
- `src/game/scenes/{Banhmi,Gas,Cargo,Cleaning,Electrician,Florist,Security,Photographer,Cashier,Harvest}Scene.ts`
- `src/game/visual/expansionArt.ts`, `src/data/expansionIcons.ts`
- `tests/expansionA.test.ts`, `tests/expansionB.test.ts`, `tests/expansionIntegration.test.ts`
- `scripts/expansion-jobs-qa.cjs`, `TASK_22A.md`

Modified:

- `src/types/{job,game,daily}.ts`
- `src/data/{jobs,tutorials,achievements,dailySchedule,dailyMissions,shareCard,town}.ts`
- `src/game/config/createGameConfig.ts`, `src/game/visual/sceneTheme.ts`
- `src/components/{GameIcon,TownBuilding,TownScenery}.tsx`, `src/pages/TownPage.tsx`
- `src/services/{dailyMissions,shareCardImage}.ts`
- `tests/{achievements,dailyMissions,newJobs,sceneRouting,serviceJobs,shareCard,town}.test.ts`
- `tests/avatar-qa-browser.ts`
- `scripts/{avatar-qa,native-adapter-qa,pwa-qa,save-qa,static-qa,town-qa}.cjs`
- `README.md`, `BETA_CHECKLIST.md`

Pre-existing user changes in `ANDROID.md` and `scripts/setup-android-cli.ps1`
were preserved, not authored or reverted by this task.

## Verification and manual release gates

Final `release:check` passes: lint, 377 tests across 24 files, production build
and static asset checks. The original 305 tests remain covered. Focused browser
QA exercises all ten new scenes with mouse/touch, successful and failed input,
metadata, score floors, 45-second completion, replay, saved outfits, reduced
motion and resource cleanup.

Production shared-flow QA passes Profile, Shop, daily rewards/missions,
save migration/export/restore, all twenty Town locations and offline navigation.
The browser's mocked native bridge passes pause/resume, Back and teardown for
all twenty games, including exact canvas-pixel freeze checks during pause.
This is not physical Android/WebView validation.

Final production browser QA passes in two complementary runs:
`npm run qa:pwa -- --town-only` and `npm run qa:pwa -- --games-only`.
All twenty games finish and replay offline, produce valid 1080×1350 PNGs and
persist the expected Career/XP/mission updates. Layout checks cover 360×800,
390×844 and 412×915. Offline reload, reconnect, install/standalone behavior,
waiting-worker updates without loops and standalone JSON export/restore pass.
The default full QA command and its twenty-job assertions remain intact.

Run `npm run release:check`, `npm run qa:avatar`, `npm run qa:pwa`, then
`npx cap sync android` and `.\gradlew.bat :app:assembleDebug` from `android/`.
For focused new-scene QA: `npm run qa:avatar -- --expansion-only`.
Browser QA uses the existing external Playwright/Chrome installation documented
in README; actual browser mouse/touch input is exercised, not production debug hooks.

The host has SDK 36/build tools and JDK 21. A long runner temporary path caused
JDK Unix-domain socket `Invalid argument: connect`; the debug build succeeds
with a short ignored socket path set for that command only:

```powershell
# From android/, only if the runner exhibits that socket-path failure:
New-Item -ItemType Directory -Force -Path 'D:\muu-sinh-game\node_modules\.tmp\java-sockets' | Out-Null
$env:JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=D:\muu-sinh-game\node_modules\.tmp\java-sockets'
.\gradlew.bat :app:assembleDebug --no-daemon
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Native source/config,
permissions, app ID and plugins are unchanged. Debug artifacts are ignored.
`cap sync android` and `:app:assembleDebug --no-daemon` pass. The generated APK
contains all twenty scene keys; every bundled JavaScript asset matches the final
production build by SHA-256.
The existing non-blocking Phaser bundle-size and Gradle flatDir/SDK-XML warnings
remain; renderer/FPS/economy settings were not changed without profiling evidence.

No physical Android device/emulator validation is claimed. Before release test
all twenty controls on a phone, native pause/back, offline cold launch/restart
storage, PNG/JSON chooser delivery and backup migration. Do not publish without
these device checks. No commit, push, deployment or publication was performed.

Next: **Task 22B — Real-Life Shop Expansion**; keep game rewards and ownership
semantics stable and add targeted inventory/backup regression coverage.
