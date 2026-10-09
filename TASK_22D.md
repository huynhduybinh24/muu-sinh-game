# Task 22D — Final branding review and Android game QA

Date: 2026-10-09 (Asia/Saigon). Browser gameplay complete; physical Android
QA **BLOCKED**. Owner visual approval **PENDING**. No commit, push, deployment,
publication, uninstall or user-data clearing performed.

## Changes

- Created `scripts/full-game-qa.cjs`: production offline E2E, real timers,
  first play/replay, genuine browser pointer input, actual GameResult observation,
  money/XP, PNG, persistence and Phaser disposal. Resume preserves previous
  failed attempts and all successful evidence.
- Created `scripts/gameplay-input-qa.cjs`: browser mouse/CDP-touch controls for
  all 26 jobs. Read-only scene observations; no score, RNG, timer or callback
  simulation.
- Created `scripts/performance-qa.cjs`: requested development preview, desktop
  load/render samples and seven real-engine creation/disposal cycles.
- Modified `scripts/native-adapter-qa.cjs`: wait for the actual booted/paused
  engine and assert frame/timer/score stability. Canvas captures temporarily
  remove CSS rounded clipping, retaining exact bitmap comparisons.
- Modified `src/pages/TownPage.tsx`: replaced the obsolete “Hai mươi câu chuyện”
  caption with “Mỗi ngày một nghề”; the actual dynamic 26-job counter remains.
- Modified `tests/branding.test.ts`: one regression test for that confirmed
  caption bug. All 551 original tests retained.
- Created this report. No gameplay, pricing, inventory, schedule epochs, save
  v5, native configuration or web deployment workflow changed. No dependencies.

## Branding review

Automated checks and visual inspection of the generated preview and actual Home:

- Correct `MƯU SINH` title, custom Vietnamese Ư wordmark and `Mỗi Ngày Một Nghề`
  tagline; no missing SVG/PNG or distorted aspect ratio observed.
- Original M/ascending-road/coin-sun identity communicates work and progression;
  town-backed Home remains consistent with the warm gold/orange/teal/navy/cream
  palette. This is a reviewer assessment, not owner approval.
- Light/dark variants and navy text/action-button contrast pass existing tests.
  The subtitle is deliberately very small on the horizontal Home logo; owner
  must judge actual-phone readability. The text-free 48px icon retains its M/road
  silhouette in the browser preview; real launcher recognition is not verified.
- Home at 360×800, 390×844 and 412×915 has no horizontal document overflow;
  footer and primary play CTA are reachable. The 360px content area scrolls:
  lower destinations/missions are not all visible at once. No redesign needed.
- Reduced-motion behavior passes. Sample game HUDs/controls and result PNGs
  inspected; no confirmed clipping/artwork bug requiring a gameplay change.
- Adaptive SVG foreground pixels fit the 66dp safe circle: furthest radius
  29.77dp, below the 33dp limit. Native source references custom vectors/icons,
  including monochrome and light/night splash resources, not Capacitor defaults.
  Source/browser validation does not establish real Android mask/splash quality.

Preview: <http://127.0.0.1:5173/branding-preview.html> (existing Vite server).
The exact requested URL was opened and captured, independently of dist preview.

Screenshots and raw evidence are local ignored artifacts:

- `D:\muu-sinh-game\node_modules\.tmp\task-22d\requested-preview-5173.png`
- `D:\muu-sinh-game\node_modules\.tmp\branding-qa\preview-{mobile,desktop}.png`
- `D:\muu-sinh-game\node_modules\.tmp\branding-qa\home-360.png` (360×800)
- `D:\muu-sinh-game\node_modules\.tmp\branding-qa\home-390.png` (390×844)
- `D:\muu-sinh-game\node_modules\.tmp\branding-qa\home-412.png` (412×915)
- `D:\muu-sinh-game\node_modules\.tmp\branding-qa\result-{offline,card}.png`
- `D:\muu-sinh-game\node_modules\.tmp\task-22d\<jobId>-game-{0,1}.png`
- `D:\muu-sinh-game\node_modules\.tmp\task-22d\<jobId>-result.png`
- `D:\muu-sinh-game\node_modules\.tmp\task-22d\<jobId>-result-card.png`
- `D:\muu-sinh-game\node_modules\.tmp\task-22d\town-scroll-390.png`

## All 26 jobs — production browser E2E

**26/26 PASS; 52 natural-completion rounds** (first play plus replay for every
job). All first rounds produced positive score through mouse or browser CDP
touch, not Phaser event emission. Each isolated profile was created through UI,
then tested with networking offline. Mobile viewports rotate between the three
requested sizes. These are automated browser controls, not physical fingers.

Every PASS includes scene selection, tutorial, countdown, successful input,
nonnegative scoring, natural timer end, actual React result, exact money/XP and
job-stat increments, PNG download, replay, return Home, offline reload and save
equality, zero console/page errors, one connected game while playing and zero
after disposal, and exactly two completion callbacks. Scoring grades/failure
floors are supplemented by unit tests and the accelerated source-action suite.
Per-job Back/pause/resume is separately PASS in the mocked native-bridge suite.

Wall seconds below are **Phaser construction → actual completion callback**,
including boot/end overlay, not a claim of an exact 45s stopwatch duration.
Each scene starts its configured 45,000ms timer and completes naturally without
clock acceleration. Observed wall duration is 45.92–79.79s; some headless rounds
ran substantially slower than scene time. Concurrency/load and engine delta
smoothing are possible contributors, not a confirmed diagnosis. Even isolated
Taxi was slow. Real-device timer/FPS acceptance remains a release gate; no timer
or balance change was made to conceal these results.

| Job ID | Profession | Input | First / replay wall seconds | First score | Money / XP delta | E2E / mocked Back |
| --- | --- | --- | --- | ---: | --- | --- |
| sugarcane | Bán nước mía | Mouse | 46.50 / 46.17 | 2418 | 3034500 / 150 | PASS / PASS |
| construction | Phụ hồ | Touch | 46.26 / 45.97 | 2420 | 3037000 / 150 | PASS / PASS |
| shipper | Shipper | Mouse | 46.68 / 46.64 | 135 | 180750 / 36 | PASS / PASS |
| noodle | Bán hủ tiếu | Touch | 46.54 / 46.36 | 3308 | 4147000 / 150 | PASS / PASS |
| barber | Cắt tóc | Mouse | 46.18 / 45.92 | 6045 | 7568250 / 150 | PASS / PASS |
| carwash | Rửa xe | Touch | 46.38 / 46.01 | 605 | 768250 / 60 | PASS / PASS |
| rubber | Cạo cao su | Mouse | 46.32 / 46.05 | 1729 | 2173250 / 116 | PASS / PASS |
| mechanic | Sửa xe | Touch | 46.17 / 46.13 | 4755 | 5955750 / 150 | PASS / PASS |
| coffee | Pha cà phê | Mouse | 46.33 / 46.24 | 1422 | 1789500 / 101 | PASS / PASS |
| fishing | Đánh cá | Touch | 46.05 / 46.01 | 1010 | 1274500 / 80 | PASS / PASS |
| banhmi | Bán bánh mì | Mouse | 46.23 / 46.12 | 3138 | 3934500 / 150 | PASS / PASS |
| gas | Đổ xăng | Touch | 62.65 / 71.25 | 280 | 362000 / 44 | PASS / PASS |
| cargo | Bốc hàng | Mouse | 46.08 / 46.06 | 4575 | 5730750 / 150 | PASS / PASS |
| cleaning | Quét đường | Touch | 46.05 / 46.03 | 260 | 337000 / 43 | PASS / PASS |
| electrician | Thợ điện | Mouse | 46.30 / 46.19 | 2040 | 2562000 / 132 | PASS / PASS |
| florist | Bán hoa | Touch | 46.17 / 46.14 | 1550 | 1949500 / 107 | PASS / PASS |
| security | Bảo vệ | Mouse | 46.53 / 46.53 | 2989 | 3748250 / 150 | PASS / PASS |
| photographer | Chụp ảnh | Touch | 46.29 / 46.03 | 550 | 699500 / 57 | PASS / PASS |
| cashier | Thu ngân | Mouse | 73.21 / 67.95 | 901 | 1138250 / 75 | PASS / PASS |
| harvest | Thu hoạch trái cây | Touch | 46.13 / 46.04 | 9502 | 11889500 / 150 | PASS / PASS |
| it | Lập trình viên | Mouse | 66.31 / 68.27 | 1244 | 1567000 / 92 | PASS / PASS |
| accountant | Kế toán | Touch | 68.87 / 67.58 | 1350 | 1699500 / 97 | PASS / PASS |
| police | Công an | Mouse | 46.18 / 46.24 | 2660 | 3337000 / 150 | PASS / PASS |
| doctor | Bác sĩ | Touch | 60.10 / 66.94 | 1355 | 1705750 / 97 | PASS / PASS |
| teacher | Giáo viên | Mouse | 68.11 / 68.72 | 1048 | 1322000 / 82 | PASS / PASS |
| taxi | Tài xế | Touch | 79.79 / 68.92 | 313 | 403250 / 45 | PASS / PASS |

Raw timestamped results, replay scores/rewards, viewports, cleanup flags and
11 previous failed harness attempts: `node_modules/.tmp/task-22d/full-games.json`.
Run completed 08:26:35 UTC; no claim that the initial run passed: it completed
16 jobs, followed by successful retries and an isolated Taxi run. No seeded RNG,
score edits, early-finish action or simulated GameResult used. Scores vary by run.
The only application change is Town copy; gameplay build remains
`GamePage-B3wJAUEh.js` across pre/post-polish production builds.

Supplement: `npm run qa:avatar` PASS for all 26 source scenes, scoring/failure
floors, avatars, metadata and cleanup. **Accelerated clock/source harness**,
including some Phaser button emission in legacy cases, not production E2E or
Android. The all-26 equipment mode is another accelerated source visual check.

## Real Android device and native features

`adb devices -l` succeeded with an empty device list, checked again at final
verification. No authorized physical device or Android version/model available.
No APK installed, app launched, device screenshot/logcat or device benchmark
captured. These physical-device outcomes are all **BLOCKED**:

| Physical Android check | Status | Available non-device evidence |
| --- | --- | --- |
| Launcher masks, 48px recognition, themed monochrome | BLOCKED | Custom resources and SVG safe circle PASS |
| Light/night cold-start splash and Home | BLOCKED | Resource tests/browser Home PASS |
| Touch, portrait, safe areas, keyboard | BLOCKED | Browser pointer tests, portrait/inset source only |
| Background/resume and hardware Back | BLOCKED | All 26 mocked-bridge cases PASS |
| Offline cold start and restart persistence | BLOCKED | Bundled assets verified; browser offline/save PASS |
| Native PNG share/save chooser | BLOCKED | Existing adapter unit tests and browser PNG PASS |
| Native JSON export/import picker | BLOCKED | Adapter tests and browser v5 backup/restore PASS |
| Shop, Garage, My Room after process restart | BLOCKED | Browser UI and storage rehydration tests PASS |
| Device FPS, memory, stopwatch timing, logcat | BLOCKED | Desktop measurements below, not device results |

Mocked bridge testing confirms no SW/install CTA in native mode, editing/dialog
Back priority, screen history/minimize request, all 26 engines frozen during
pause, resume, paused teardown, three listeners without accumulation and no
false awarded results. It does **not** validate Capacitor/Android OS integration.

## Shop, lifestyle and saves

Production browser suite PASS: 100 products/10 categories; mobile layouts;
44px purchase targets; preview/cancel/buy/equip; outfits, five accessory slots,
phone/computer, four vehicle types and selection; compatible vehicle rendering;
owned furniture, fixed-slot My Room, Town/Profile and achievements. Fixtures
fund only isolated QA profiles; no real-player money is changed.

Purchases decrease money once, ownership is unique, equipping/cancelling does
not charge, and balances remain nonnegative. Existing economy/lifestyle tests
also reject repeat purchases and insufficient/invalid funds. Browser reload,
offline persistence, storage rehydration and exact v5 JSON restore PASS.
Production job earnings independently verified in the table above.

Browser/PWA and Android WebView are separate storage environments. Existing web
saves do not automatically transfer. Use the existing JSON backup/restore for
migration once the actual Android picker is verified. Physical process-restart
persistence and native sharing remain BLOCKED, not inferred from browser tests.

## Desktop performance audit

Actual reference host: Windows 11 Home, Intel Core i5-12450H, 15.63GiB RAM,
headless Chrome 154.0.8037.98, 390×844 viewport, loopback production server,
no network/CPU throttle and no fake clock. Not Android/mobile benchmarks.
Raw data: `node_modules/.tmp/task-22d/performance.json`.

- Cold Welcome observable: 164.12ms; DOMContentLoaded 84.70ms; first paint 44ms.
  Single local sample, not a public-network loading guarantee.
- Phaser/GamePage is not loaded by Welcome/Home in the page; existing lazy
  boundary retained (the PWA still precaches it for offline availability).
- Home and scripted Town-scroll RAF samples: 119 intervals each; median 6.9ms,
  p95 7.0ms. These are RAF callback timestamps on the desktop display, **not**
  measured game/Android FPS. Two Home animations were running at sampling.
- Town: 26 locations, 695 SVG descendants, no horizontal document overflow;
  scripted scroll reached 2280px. Existing scenery memoization/use reuse retained.
- Seven sequential real-engine boot/disposal cycles in one page, with mocked
  Back only and explicit CDP forced GC: zero connected canvases and zero surviving
  weak game references after each. READY time 94.1–392.2ms. JS heap: 2.75MiB
  before Phaser, 7.59MiB after first disposal, 8.66MiB after seventh; DOM nodes
  399→415 after loading Phaser. Some retained heap growth remains; seven samples
  do not prove long-session memory stability or GPU-memory release.
- Existing React callback/profile refs and effect cleanup preserve one game;
  scene timers/listeners/tweens and bounded FX pools are covered by source QA.
  No confirmed lifecycle leak justifying an application rewrite was found.
- Production GamePage chunk: 1371.83kB / 373.99kB gzip; main JS 419.60kB /
  129.93kB gzip. PWA precache 40 entries / 3056.26KiB. Existing chunk-size warning
  remains. No unsupported optimization, balance change or warning suppression.
- Slow real wall timers in the E2E table need device timing/FPS investigation;
  do not treat desktop scripted scrolling as evidence that gameplay meets FPS.

## Bugs and harness repairs

Confirmed app bug fixed: stale twenty-profession Town caption, with one test.
No confirmed gameplay/economy/storage or artwork bug was found in this run.

Harness repairs are not product fixes: emoji-prefixed/duplicated labels selected
the wrong control; Shipper must use the bottom D-pad, not the HUD arrow; Rubber
uses its active flag; lengthy drag routines must stop before timer end; observe
transient countdown DOM changes rather than polling a 650ms value too late;
Taxi follows one real grid move at a time. Failed attempts are retained.

Native pause screenshots initially failed although engine/timer/score were
unchanged: measured eight CSS rounded-edge pixels differing by only one RGB
level. Capture-only clipping removal fixes that false positive, while adding
exact engine-state equality; no tolerant threshold or weakened assertion added.

## Verification and APK

- `npm run lint`: PASS.
- `npm run test:run`: PASS, **552/552**, 33 files, including all 551 original tests.
- `npm run build`: PASS.
- `npm run release:check`: PASS (lint, tests, production build, static assets).
- `node scripts/full-game-qa.cjs` plus resume: PASS 26/26 / 52 real-time rounds.
- `npm run qa:avatar`: PASS, accelerated source actions, explicitly not device.
- `node scripts/performance-qa.cjs`: PASS, actual desktop samples/mocked Back.
- Final post-polish rerun: `qa:branding`, `qa:avatar -- --lifestyle-only`,
  `qa:pwa -- --native-only`, `--lifestyle-only` and `--updates-only`: all PASS.
  All-26 equipment checks use accelerated source time; native Back checks use
  a mocked bridge/accelerated clock. Neither is physical Android testing.
  Final artifacts: `node_modules/.tmp/branding-qa`, source equipment temp folder
  `C:\Users\THISPC~1\AppData\Local\Temp\muu-sinh-avatar-qa-3qqvWN`, and PWA
  temp folders `muu-sinh-pwa-qa-{vFUWsg,yePnmk,Qhdy0O}` in the same temp root.
- `npx cap sync android`: PASS, local dist and existing three Capacitor plugins.
- `android\gradlew.bat :app:assembleDebug --no-daemon`: PASS, existing JDK 21
  and SDK 36. No release signing or publication. flatDir/SDK XML warnings remain.
- Final APK: `D:\muu-sinh-game\android\app\build\outputs\apk\debug\app-debug.apk`,
  **6,202,628 bytes**, modified 2026-10-09 15:25:36 +07:00.
  SHA-256: `958018B6B4AFCBFF22DD9E5739309BCC66D5D6195F7B589FA127A86F01C14614`.
  All **38 dist files** verified byte-for-byte against APK ZIP assets.

## Reproduce and owner release gates

Use the existing Playwright installation with `PWA_QA_PLAYWRIGHT` and optional
`PWA_QA_BROWSER` described in README; no package installation needed. From the
repository root, after `npm run release:check`:

```powershell
node scripts/full-game-qa.cjs
# Resume failed/missing cases without dropping successful evidence:
$env:FULL_QA_RESUME = '1'
node scripts/full-game-qa.cjs
Remove-Item Env:FULL_QA_RESUME
# Requires Vite dev running at the requested 5173 URL:
node scripts/performance-qa.cjs
```

QA artifacts are under ignored node_modules/temp directories; scripts/report
are source files. Android build outputs/local SDK paths/signing files remain
ignored. No Git state was staged or published.

Owner checklist (not completed automatically):

- [ ] Approve logo text/accents, tagline readability, colors, composition and
  Home at all three sizes; inspect 48px actual launcher recognition.
- [ ] Connect a physical Android phone, enable USB debugging, authorize it,
  record model/OS/WebView version and confirm `adb devices -l` shows `device`.
- [ ] Export any existing save first. Install this debug APK as an update
  (`adb -s <serial> install -r ...`) or use Android Studio Run. If signatures
  conflict, stop and resolve with the owner; do not uninstall or clear data.
- [ ] Cold-launch in light/night mode and themed icons; check masks/splash,
  portrait, status/navigation bars, keyboard and safe areas.
- [ ] Play all 26 with actual taps/drags/D-pad/timing; stopwatch the unpaused
  45s timer, inspect scores/results/replay and confirm no duplicate canvas.
- [ ] Interrupt held gestures, background/resume, hardware Back (pause before
  leaving), restart offline/airplane mode and confirm owned items/progress.
- [ ] Buy/equip outfit/accessories/phone/compatible vehicles, decorate Room;
  verify no duplicate charge, then force-stop/reopen without clearing data.
- [ ] Export/save/share an actual PNG and open it in another app; export JSON,
  import it through Android picker and verify the exact restored save.
- [ ] Capture device screenshots/logcat and actual FPS/memory over repeated
  games/long Town scrolling. Investigate slow timer wall-time if reproduced.
- [ ] Confirm provisional `com.muusinh.game` ownership before publication.

Remaining release blockers: physical Android QA/native file interoperability,
device stopwatch/FPS/long-session memory acceptance, and explicit owner design
approval. Recommended next task after those gates:
**Android Release AAB & Google Play Preparation**.
