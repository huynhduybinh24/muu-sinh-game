# Task 22A.2 — twenty-six playable professions

Six real 45-second scenes extend the existing `TimedJobScene` lifecycle, without
editing any of the original twenty gameplay configs/scenes, economy formulas,
storage schema, native source/config or dependencies. React still owns screens,
save data and results; Phaser returns the existing `GameResult` callback with
optional typed metadata. Town/Career entry is immediately available to all six.

## Gameplay

- IT: identify a broken block, select its repair, then order three logical steps.
  Timed tickets award 100 plus up to 50 speed points; wrong −30, timeout −20.
  Metadata: `bugsFixed`, `perfectFixes`.
- Accountant: verify quantity × unit-price totals and match the correct bank
  transaction. Correct 100, perfect 150, wrong −40, timeout −25.
  Metadata: `invoicesProcessed`, `perfectBalances`.
- Police: stop visibly marked violations, use an all-red transition between
  crossing directions and prioritize an illustrated emergency vehicle.
  Safe 100, perfect 150, conflicting/wrong −40, congestion −20.
  Metadata: `incidentsResolved`, `safeDecisions`.
- Doctor: prioritize explicit fictional urgency labels, match blanket/water/toy
  requests and complete a two-symbol puzzle. Correct 100 plus speed up to 50,
  wrong −40, timeout −25. No diagnoses, dosages or treatment instructions.
  Metadata: `patientsHelped`, `perfectCare`.
- Teacher: order a lesson, respond to a pupil's supply request, answer a simple
  question and keep classroom attention. Correct 100 plus attention up to 50,
  wrong −30, timeout −20. Metadata: `lessonsCompleted`, `correctAnswers`.
- Taxi: accept a passenger trip, use four large directional controls to reach
  pickup/destination, respect center signals and avoid changing traffic obstacles.
  Satisfaction decays during waiting; trips award 120 plus safe/fast bonus up to
  50, red-light violation −30, collision −40. This is a passenger/grid-road game,
  not Shipper package delivery. Metadata: `tripsCompleted`, `fiveStarTrips`.

Scores floor at zero. Existing tutorial/countdown, customized avatar reactions,
audio, fixed 24-particle pool, reduced motion, completion, replay and cleanup are
reused. Layered local vector environments are original; no downloaded art.
Taxi signs redraw only when displayed signal/mood values change, not every frame.

## Compatibility

The first three Daily Job and mission epochs stay frozen, including 2026-12-01.
The appended ordered 26-job epoch and corresponding mission pools start
2027-01-01. Six metadata-count missions use finite nonnegative values and reject
wrong-job metadata. Existing progress/reward formulas are unchanged.

Six ten-play achievements are appended after the original 34 definitions; old
unlock IDs and the original ten-job collection requirement remain unchanged.
Town keeps all original coordinates and extends to 720×2860, with six distinct
buildings and an accessible directory. Town never creates a Phaser instance.

The existing lazy game chunk is precached for offline play. Each new PNG theme
has a local vector icon and a typed primary statistic. Portable format remains
v5: old twenty-job profile, balances, XP, inventory and achievements restore,
and missing new job stats normalize to zero. Web and Android WebView saves remain
separate; migrate with the existing JSON export/restore, not automatic sync.

## Files created for this task

18 files created; 32 existing files modified relative to the Task 22A baseline.

- `src/game/config/{it,accountant,police,doctor,teacher,taxi}Config.ts`
- `src/game/scenes/{It,Accountant,Police,Doctor,Teacher,Taxi}Scene.ts`
- `src/game/visual/professionArt.ts`
- `tests/professionsA.test.ts`, `tests/professionsB.test.ts`, `tests/professionsIntegration.test.ts`
- `scripts/professions-jobs-qa.cjs`, `TASK_22A2.md`

## Files modified for this task

- `src/types/{job,game,daily}.ts`
- `src/data/{jobs,tutorials,achievements,dailySchedule,dailyMissions,shareCard,town,expansionIcons}.ts`
- `src/game/config/createGameConfig.ts`, `src/game/visual/sceneTheme.ts`
- `src/components/{GameIcon,TownBuilding,TownScenery}.tsx`
- `src/services/dailyMissions.ts`
- `tests/{dailyMissions,sceneRouting,serviceJobs,shareCard,town,expansionIntegration}.test.ts`
- `tests/avatar-qa-browser.ts`
- `scripts/{avatar-qa,native-adapter-qa,pwa-qa,save-qa,static-qa,town-qa}.cjs`
- `README.md`, `BETA_CHECKLIST.md`

Files already created/modified by Task 22A were preserved, including unrelated
user changes in `ANDROID.md` and `scripts/setup-android-cli.ps1`.

## Verification

Batch A focused tests passed before implementing Batch B. The expanded suite has
421 tests across 27 files, retaining the original 377. Coverage includes pure
scoring/failure rules, routing, all 365 historical 2026 schedule/mission dates,
new epoch boundaries, Town, six achievements, XP/Career, PNG metadata and old
twenty-job v5 backups with paid ownership preserved.

Source QA drives actual mouse and touch input for all six games: success/failure,
zero floors, perfect metadata, 45-second completion, pause pixel freeze, three
mobile sizes (360×800, 390×844, 412×915), paid outfits, reduced motion and replay
without duplicate canvases. Production focused QA checks all six offline timers,
results, Career, PNG downloads, replay and PWA install/update behavior.
Town/shared QA checks all 26 offline entries, profile/shop/daily/save behavior
and an explicitly mocked native bridge for all 26 Back/pause/teardown paths.
The default full production QA still covers all 26 timers; the task's recorded
production run is focused on six additions plus shared flows, not all 26 timers.
Both focused production commands were rerun successfully against the final build,
including the corrected Teacher board text. No browser/runtime errors were reported.

Verification commands:

```sh
npm run release:check
npm run qa:avatar -- --professions-only
npm run qa:pwa -- --town-only
npm run qa:pwa -- --professions-only
npx cap sync android
```

Android uses the existing SDK 36/build tools and JDK 21. If the host's long
temporary directory triggers the known JDK Unix-domain socket failure, run:

```powershell
# From android/; short ignored socket directory, command-local setting only.
New-Item -ItemType Directory -Force -Path 'D:\muu-sinh-game\node_modules\.tmp\java-sockets' | Out-Null
$env:JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=D:\muu-sinh-game\node_modules\.tmp\java-sockets'
.\gradlew.bat :app:assembleDebug --no-daemon
```

Final results: lint, all 421 tests, build, static QA and `release:check` PASS.
`cap sync android` and `:app:assembleDebug --no-daemon` PASS (22 seconds).
APK: `D:\muu-sinh-game\android\app\build\outputs\apk\debug\app-debug.apk`.
The APK includes all 26 scene keys; its bundled JavaScript assets match final
production `dist` by SHA-256. Native configs/plugins/permissions are unchanged.

No physical Android/emulator testing is claimed. Phone controls, native Back,
offline cold launch/restart storage, real PNG/JSON chooser delivery and backup
migration remain release gates. Existing non-blocking Phaser chunk-size and
Gradle configuration warnings remain. No commit, push or deployment is performed.

Next: **Task 22B — Real-Life Shop Expansion**; preserve ownership, reward balance
and portable saves while adding shop content and targeted regression coverage.
