# MƯU SINH — Task 22C

Direction: **From everyday work to a better life.** A chunky original M carries
an orange rising road; a golden coin/sun marks progress; two small shopfronts
appear only in the full emblem. The simpler launcher omits town detail and text.
The supplied `muu-sinh-logo-reference.png` informed direction; no raster crop,
embedded reference image or automatic trace is used.

## Editable sources and exports

- Original path construction: `scripts/brand-art.cjs`.
- Palette and exact Vietnamese wording: `src/data/brand.json`.
- Editable production vectors: `public/branding/logo-*.svg`, `app-icon.svg`,
  `adaptive-foreground.svg`, `monochrome.svg`, `town-backdrop.svg`.
- Six PNG logo exports: horizontal/light/dark/transparent 1920×560,
  compact 1080×630, emblem 512×512. Main/transparent share composition on purpose
  (requested deliverables); SVG is used by Home, PNG by result-card export.
- PWA 192/512, distinct opaque maskable 512, Apple 180 and favicon 48.
- Android: density-specific legacy/round launcher PNGs; shared-geometry vector
  adaptive foreground, gradient background, API 33 monochrome, static splash.
- Local preview: `/branding-preview.html` in Vite dev or production preview.

Main lettering is custom editable outlined geometry including the Ư horn.
The subtitle remains editable SVG text, using locally available Arial with
Vietnamese support; no downloadable font or external asset is required.
This is a clean vector interpretation, not an exact painted reproduction of
the reference. A final artist/device review is recommended before publication.

## Reproduce

Use an existing Playwright/Chromium installation (the project's QA tooling):

```powershell
$env:PWA_QA_PLAYWRIGHT='C:\Users\THIS PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:PWA_QA_BROWSER='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run branding:generate
npm run release:check
npm run qa:branding
```

The generator regenerates SVGs, transparent PNGs, native vectors and CSS tokens
from the same geometry/palette. Generated files are committed app assets, not
generated during production builds; Cloudflare builds need no browser/tooling.
The old PowerShell icon script forwards to this pipeline.

## Android constraints

Application ID remains `com.muusinh.game` (provisional; confirm before release).
Adaptive foreground uses a 108dp viewport with meaningful paths fully inside
the central radius-33dp circle; launchers may mask the decorative background.
Splash uses the existing AndroidX dependency and `installSplashScreen` before
`super.onCreate`, light/night background resources, no extra startup delay.
API 26 adaptive resources and API 33 monochrome resources are separate.

Platform references: [adaptive icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
and [AndroidX splash](https://developer.android.com/reference/androidx/core/splashscreen/SplashScreen).
Real-device launchers, themed icons, cold-start splash and accessibility remain
manual QA gates. No native execution or native share validation is implied by
the preview or a successful APK build.

## UI and preservation

Home uses the real customized/equipped avatar over original town SVG, a featured
daily-job CTA, existing Town entry and quick Shop/Garage/Room/Career links. The
Home content scrolls inside its shell so bottom navigation stays reachable on
small screens. Achievements remain in the existing Career screen. No new route,
save schema, economy, profession logic or Shop layout is introduced.
Shared tokens restyle existing cards/buttons/progress. Short one-shot entrance,
press/spark/reward effects honor reduced motion. Share cards load the local PNG
and retain their old text fallback if artwork cannot be decoded.
All new public artwork is precached by the existing PWA patterns. Local/native
storage environments and JSON migration remain unchanged.
