# Public beta checklist

- [x] Task 22B: final release-check, lint, 534 tests (421 baseline retained), production build and static PWA checks.
- [x] Task 22B: 100-item Shop, accessory outfits, devices, Garage and fixed-slot room at 360/390/412/1024px; production offline reload and exact v5 JSON backup/restore.
- [x] Task 22B: all 26 equipped source scenes, shoe/hat/hand variants, incompatible vehicle fallback, reduced motion and teardown; mocked native Back cancels purchases without spending and navigates new lifestyle screens.
- [x] Task 22B: PWA update/reload/standalone offline backup; final local-asset Capacitor sync and debug APK build.
- [ ] Task 22B: real-device Shop/room rendering, purchased outfits, vehicle/device visuals, restart persistence and web-to-native JSON migration.
- [x] Task 22A.2 final `npm run release:check`: lint, 421 unit tests (original 377 retained), build and static PWA QA green.
- [x] Task 22A.2 production/offline browser QA: `--town-only` (26 entries/shared systems/mock native bridge) and `--professions-only` (six new timers/results/PNG/replay/PWA updates).
- [ ] Run the default full `npm run qa:pwa` before publication: all 26 timers. Task 22B's attempt passed shared systems, Town routing and mocked native pause/resume for all 26, then ten offline timers/results/PNG/replays before the chat interruption. It is not a completed full run. Final lifestyle/update checks passed separately; prior Task 22A/22A.2 timer evidence remains historical, not a final-build full-run claim.
- [x] Review 360×800, 390×844, and 412×915 screenshots and controls.
- [ ] Android Chrome: real-device installation, standalone launch, offline replay.
- [ ] iOS Safari: manual Add to Home Screen, safe areas, offline launch.
- [ ] Real-device native sharing and PNG download/open.
- [ ] Real-device Town panning, location selection and avatar travel on mid-range Android.
- [ ] Android APK: native Back/pause/resume, all twenty-six controls, cold offline launch and restart persistence.
- [ ] Android PNG Share, PNG/JSON Save picker, document restore and web→native v5 backup migration.
- [x] Fresh isolated browser storage: tutorial, first daily completion, and first achievement.
- [x] Migrated storage fixtures: rewards, preferences, achievements, career data preserved.

Automated checks use isolated browser/storage fixtures; real-device checks remain
manual release gates. Do not clear actual player storage to test migrations.
