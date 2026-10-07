# Public beta checklist

- [x] `npm run release:check`: lint, 223 unit tests, build, static PWA QA green.
- [x] `npm run qa:pwa`: production/offline browser QA green.
- [x] Review 360×800, 390×844, and 412×915 screenshots and controls.
- [ ] Android Chrome: real-device installation, standalone launch, offline replay.
- [ ] iOS Safari: manual Add to Home Screen, safe areas, offline launch.
- [ ] Real-device native sharing and PNG download/open.
- [x] Fresh isolated browser storage: tutorial, first daily completion, and first achievement.
- [x] Migrated storage fixtures: rewards, preferences, achievements, career data preserved.

Automated checks use isolated browser/storage fixtures; real-device checks remain
manual release gates. Do not clear actual player storage to test migrations.
