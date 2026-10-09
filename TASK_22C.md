# Task 22C — Original game logo and brand identity

## Implemented

Original editable M + rising road + coin/sun + minimal town emblem, custom
rounded outlined wordmark with Vietnamese Ư, exact “Mỗi Ngày Một Nghề” subtitle.
Six vector/raster deliverables; independent simplified icons (no tiny town or
text). Warm gold/orange/teal/navy/cream tokens; contrast-tested text and CTA
colors; town-backed customized Home hero, featured daily play action and existing
Town/Shop/Career navigation plus direct Garage/Room links. Achievements remain
in Career, with no new result or navigation system.

Shared existing shells, cards, buttons and progress carry the identity; Welcome,
lazy-game loading, result preview and downloaded PNG use real logo assets.
One-shot microanimations honor reduced motion. Toast centering is preserved.
PNG export keeps the previous text fallback when an old offline cache lacks
the new artwork. No gameplay, economy, save migration or equipped-item logic
was changed. No dependencies, backend, analytics, publication or Git writes.

## Files created (Task 22C only)

- `scripts/brand-art.cjs`, `scripts/generate-branding.cjs`, `scripts/branding-qa.cjs`
- `src/data/brand.json`, `src/brand-tokens.css`, `src/branding.css`
- `src/components/BrandLogo.tsx`
- `tests/branding.test.ts`, `tests/brandingShare.test.ts`
- `public/branding/logo-{horizontal,compact,emblem,light,dark,transparent}.{svg,png}`
- `public/branding/{app-icon,adaptive-foreground,monochrome,town-backdrop}.svg`
- `public/branding-preview.html`, `public/favicon-48.png`,
  `public/apple-touch-icon.png`, `public/pwa-maskable-512.png`
- `android/app/src/main/res/drawable/{brand_splash_icon,ic_launcher_monochrome}.xml`
- `android/app/src/main/res/mipmap-anydpi-v33/{ic_launcher,ic_launcher_round}.xml`
- `android/app/src/main/res/values/brand.xml`, `values-night/brand.xml`
- `design/BRANDING.md`, `TASK_22C.md`

## Files modified

- `src/App.tsx`, `src/pages/{HomePage,WelcomePage}.tsx`
- `src/components/{ScreenShell,ShareCardPreview}.tsx`
- `src/services/shareCardImage.ts`, `src/native.css`
- `index.html`, `vite.config.ts`, `capacitor.config.ts`, `package.json`, `README.md`
- `scripts/generate-pwa-icons.ps1` (compatibility wrapper)
- `public/favicon.svg`, `public/pwa-icon-{192,512}.png`
- `android/app/src/main/java/com/muusinh/game/MainActivity.java`
- `android/app/src/main/res/drawable/ic_launcher_background.xml`
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/{ic_launcher,ic_launcher_round}.xml`
- `android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher{,_round}.png`
- `android/app/src/main/res/values/styles.xml`

Removed after reference checks: 11 old `splash.png` variants, five unused
`ic_launcher_foreground.png` variants and the unused old
`values/ic_launcher_background.xml`. These default assets are recoverable from
Git. Actual foreground is now an editable vector shared with the splash;
adaptive background is a gradient drawable. Pre-existing Task 22A/A2/B edits and
the supplied reference image were preserved.

## Verification

- `npm run branding:generate`: PASS; existing Chromium/Playwright, no new package.
- `npm run release:check`: PASS — lint, 551 tests (534 baseline + 17 new), Vite
  production build and all local production assets/26 scene entries.
- `npm run qa:branding`: PASS — SVG/PNG loading, adaptive foreground pixels
  inside 66dp safe circle (maximum radius 29.77dp), Home 360/390/412/1024,
  reachable footer/play CTA, new links, unchanged navigation-only save,
  26 Career professions/46 achievements, reduced motion, offline reload,
  real 45-second Construction end/result and actual 1080×1350 PNG download.
- `npm run qa:pwa -- --lifestyle-only`: PASS — all 100 products/10 categories,
  44px targets, purchase/cancel/equip, accessories/devices/vehicles, Town/Profile,
  room, achievements, reload/offline and exact v5 JSON restore.
- `npm run qa:pwa -- --updates-only`: PASS — SW update/reload without loop,
  persistence, standalone install behavior, offline backup/restore.
- `npm run qa:avatar -- --lifestyle-only`: PASS — all 26 actual scenes, equipped
  avatar/items, bounded objects, reduced motion and clean teardown.
- `npx cap sync android`: PASS, local `dist`, same provisional app ID.
- `:app:assembleDebug`: PASS with existing JDK 21/SDK; no signing setup/publication.
  Final debug APK: 6,202,634 bytes; all 38 bundled `dist` files verified
  byte-for-byte by SHA-256 against the APK ZIP entries.

PNG/preview/Home/result screenshots reviewed. Temporary QA output lives under
ignored `node_modules/.tmp/branding-qa` and existing ignored temp profiles.
Existing Phaser chunk-size and Gradle flatDir/SDK XML warnings remain non-blocking.
The full 26-timer production suite was not rerun in this branding-only task;
the real offline timer case is Construction, while all 26 lifecycle/render cases
and all baseline unit tests passed. No real-device execution is claimed.

## Handoff / remaining gates

Preview `/branding-preview.html` with Vite dev or production preview. Asset source,
palette, regeneration steps and Android platform references are in
`design/BRANDING.md`. Generated artwork is tracked source/config; Cloudflare
builds continue using just `npm run build` and `dist`.

The reconstruction is original clean vector artwork, not an exact painted
reproduction of the supplied concept. Artist/user approval and real launcher
mask, 48px readability, themed monochrome, light/night cold-start splash,
native touch/Back/restart/export and accessibility checks remain manual release
gates. The attached request ended mid-preview checklist; no missing requirements
were invented. Recommended Task 22D: real-device brand/accessibility/performance
QA and final visual sign-off before a public beta. No commit/push/deploy performed.
