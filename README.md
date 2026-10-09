# MƯU SINH – Mỗi Ngày Một Nghề

React/TypeScript handles UI and persisted Zustand progress; Phaser 3 owns the
twenty-six mini-games. Vite builds the app and its PWA service worker.

## Player profile

First launch asks for a 2–20 character name, then opens the original layered-SVG
character creator. Home, Profile, and the creator share one avatar component and
typed appearance configuration. Appearance edits never change career progress.
Save version 5 adds daily missions/claim tracking and daily rewards to the existing
storage key; version 4 introduced inventory, spending and XP.
older saves keep all progress/settings and worn items become owned. The former
displayed level is preserved as the starting XP threshold. Profiles stay on this
device, without accounts or sync.

All twenty-six Phaser scenes receive a snapshot of that same profile from React.
The shared primitive avatar renderer uses the existing appearance IDs/colors;
visual tweens never move a collision anchor. `npm run qa:avatar` uses the same
browser prerequisites as `qa:pwa` to exercise real scene actions/reactions,
fallbacks, and cleanup against source scenes. Production/offline checks remain
in `qa:pwa`. No production debug globals or extra dependencies are added.

Focused diagnostics: `npm run qa:avatar -- --expansion-only` checks the ten new
games with mouse/touch, exact-result metadata and interrupted drags. `--outfits-only`
checks their paid equipment and reduced-motion cleanup. Production QA accepts
`--native-only` (explicit mock bridge, not a device) and `--games-only` (all twenty-six
offline timers, mobile layouts, PNG exports, replay and updates). The default full
commands still retain every existing check and include the expanded catalog.

## Playable jobs

Sugarcane, Construction, and Shipper retain their existing mechanics. Noodle adds
three ingredient recipes, Barber uses six large haircut sections, and Carwash
uses mouse/touch scrubbing with a 90% cleanliness target. Every job lasts 45
seconds and shares the tutorial/countdown, result, Career, daily challenge,
achievement and offline PNG systems. Daily selection uses frozen, versioned
catalog epochs rather than the current catalog length. Old saves gain empty stats for
new jobs, while previously unlocked achievements remain unlocked.

Rubber traces a generous curved guide and grades coverage/distance/completion
(120/80/40/−30, fast bonus up to 30). Mechanic matches four symptoms to typed tools
(100/−40, timeout −25, fast bonus up to 50); a committed repair animates briefly
without accepting duplicate choices. Coffee uses three recipes plus a one-shot
extraction meter: target = 120, acceptable = 80, wrong = −50, fast bonus up to 30.
Fishing has cast → bite → tension phases, common/rare/epic fish (70/120/180),
a 20-point perfect bonus and no miss penalty. `rareFishCaught` includes rare and epic.
Each job has its own pure config and real scene; no new assets or dependencies.

Town and Career's **THỬ NGHỀ** buttons make all twenty-six jobs playable immediately.
Free play and replay count games/XP/earnings and eligible missions, but never
advance the work streak. Only a deliberate Daily Job run can complete today's
challenge, once per day. Existing scoring/mechanics are unchanged.
The original six-job epoch and mission pools remain frozen. A ten-job epoch plus
metadata-compatible missions activates on **2026-11-01**, leaving all earlier
dates unchanged. New job stats normalize to zero in existing local/portable v5
saves; no schema-version bump, extra shop items or revoked achievements.
Task 22A adds Bánh mì (ingredient assembly), Gas (hold/release filling), Cargo
(destination dragging), Cleaning (sweep paths), Electrician (fictional color
connections), Florist (bouquet arranging), Security (object-event detection),
Photographer (framing/timing/stability), Cashier (scan and exact change), and
Harvest (ripe fruit/combo baskets). Each has a dedicated typed config/scene,
45-second timer, capped difficulty, zero score floor, original vector art and the
existing avatar/audio/result lifecycle. The old ten game mechanics are unchanged.

The twenty-job and mission epochs activate on **2026-12-01**; every earlier date
keeps its frozen schedule. Ten additional achievements require ten plays each.
The existing collection achievement still requires the original ten jobs;
previous unlocks remain stored. All twenty PNG themes/exports work offline.
Schema v5 and item ownership remain unchanged; ten-job backups gain zeroed new
stats. See [TASK_22A.md](TASK_22A.md) for implementation files, QA and Android notes.

Task 22A.2 adds IT (three-stage debugging), Accountant (invoice and transaction
matching), Police (fictional traffic signals and emergency priority), Doctor
(fictional urgency/request/symbol puzzles), Teacher (lessons, requests and
attention), and Taxi (passenger pickup, signals, collisions and satisfaction).
Each is a dedicated 45-second scene with the existing avatar, audio, tutorial,
countdown and result contract. No original twenty-job mechanics are changed.
Police/Doctor are cartoon puzzles, not enforcement or medical instructions.

The appended twenty-six-job and mission epochs activate on **2027-01-01**.
Earlier six/ten/twenty-job mappings and mission pools remain frozen. Six added
ten-play achievements bring the catalog to forty without changing old unlocks.
Portable save v5 remains compatible; twenty-job backups gain six empty stats.
`npm run qa:avatar -- --professions-only` checks real mouse/touch actions for
these six scenes. `npm run qa:pwa -- --professions-only` checks their production
offline timers/results/PNG/replay plus shared PWA update behavior; it is a
focused diagnostic, not a substitute for the default full twenty-six-job QA.
See [TASK_22A2.md](TASK_22A2.md) for the exact change manifest and verification.

## Town map

Home's **KHÁM PHÁ THỊ TRẤN** opens an original SVG/CSS map with twenty-six locations in
five neighborhoods. Scroll with touch/mouse, select a building, watch the saved
avatar walk to it, then enter the existing reveal → game → result flow. The
location panel reuses Career statistics. An accessible grouped job list and
reduced-motion support provide alternatives to animated map navigation.

`src/data/town.ts` centralizes typed district/location coordinates; Town's
selection and avatar position are temporary React state, not save data. The
**NGHỀ HÔM NAY** marker follows the existing daily schedule; its panel defaults
to free play and offers an explicit Daily choice. Gameplay is lazy-loaded on
entering a job, never instantiated for Town, and still precached for offline use.

## Shop, wardrobe and levels

Home opens **CỬA HÀNG**; Profile opens **TỦ ĐỒ**, **THIẾT BỊ**, **GARA** and
**PHÒNG CỦA TÔI**. One catalog contains 100 original illustrated products:
8 hair, 16 shirts, 10 pants, 8 shoes, 12 accessories, 6 phones, 8 electronics,
9 vehicles, 9 personal/work tools and 14 furniture/decorations. The original 22
clothes keep their IDs/prices/level gates and six free starters. New items cost
18.000đ–60.000.000đ; jobs still pay `12.000 + score × 1.250` with no multipliers.
Purchases of at least 500.000đ ask for confirmation and recheck the current balance.
Preview never equips or spends money; purchase/ownership/balance update atomically.
Search, price, ownership, affordable and sorting filters remain offline.
Wardrobe/character editing only offers owned clothes; skin/gender remain free.
React and all 26 Phaser avatars share clothing and five accessory slots.

Devices select a phone and personal electronic item; owned laptops/PCs tint the IT
monitor. Garage supports bicycle, motorcycle, scooter and car silhouettes. Town
and Profile show the selected model; compatible Shipper/Taxi scenes use its palette
while keeping their existing vehicle geometry, collision anchors and speed.
Incompatible vehicles fall back to the original vehicle. Room uses lightweight SVG,
nine owned-furniture slots, the avatar, phone and selected device on a placed desk.
Nothing improves earnings/scoring. Six shopping achievements bring the total to 46.

Optional `profile.lifestyle` extends save v5; missing selections resolve to empty
slots without granting paid products. Existing inventory, daily data and all job
stats stay in the same save. JSON backups carry the configuration; web and Android
storage remain separate and require explicit JSON migration.
`npm run qa:pwa -- --lifestyle-only` checks production shopping, room, persistence
and offline backup; `npm run qa:avatar -- --lifestyle-only` checks purchased outfits
in all 26 source scenes, device/vehicle visuals and cleanup. Default PWA QA includes
the new lifestyle flow. See [TASK_22B.md](TASK_22B.md) for files and verification.

Each game grants `30 + min(120, floor(score / 20))` XP. The next level needs
`150 + 50 × (level − 1)` additional XP; level is derived, not stored separately.
Three shop achievements count 5/10 non-starter owned items and 500.000đ lifetime
spending. Free/grandfathered items never add spending. Level-up notices are transient.

`src/data/dailySchedule.ts` freezes the current six-job date hash mappings. To
activate future jobs, append a new ordered catalog epoch with a future local
date; never edit old epoch IDs/order/dates. Tests cover historical dates, catalog
growth/reordering and activation boundaries. No server or new environment variables.

## Daily missions and rewards

Home previews all three mission progress indicators and opens **NHIỆM VỤ HÔM NAY**
for descriptions, progress, rewards and claims. The deterministic local-date schedule
uses three frozen pools (easy, daily-job-specific, harder); future templates must
activate through a new future-dated epoch, not edits to old pools/templates.
Job-specific missions use the already available `GameResult.metadata` and always
match the playable Daily Job. Replays count. Missing metadata contributes zero;
single-score missions use a maximum, totals accumulate, all progress caps at target.
Progress updates centrally after game progression, before achievement evaluation.
The next local date resets missions; unclaimed prior-day rewards expire.

Mission rewards range from 7.500–25.000đ and 25–60 XP. The separate daily gift cycle
is 5.000 / 7.500 / 10.000 / 12.500 / 15.000 / 20.000 / 30.000đ, with 60 bonus XP on
day 7. Claim once per local date; consecutive claims advance and day 7 wraps to day 1.
Missing a calendar day resets to day 1. Closing the gift dialog never claims it;
Home keeps a claim-later entry. Neither gift streak nor reward money changes work
streak, days worked, job income or Career totals. Reward XP uses existing levels
and transient level-up feedback. Three new achievements cover all three missions
claimed in one day, 30 lifetime mission claims, and seven consecutive gift claims.

Atomic Zustand actions prevent double claims, including after refresh. Save v5
keeps all v4 profile/outfit/inventory/money/XP/shop/Career/settings fields and adds
safe daily defaults. Everything works offline; dates use the device's local clock.
Clock/save manipulation cannot be prevented without a backend. No network time,
accounts, dependencies or anti-cheat services are added.

## Backup and restore

Profile's **DỮ LIỆU TRÒ CHƠI** panel downloads UTF-8 JSON named
`muu-sinh-save-YYYY-MM-DD.json`. It works offline and in standalone PWA mode;
clipboard copying is optional. JSON backup and result PNG sharing are independent.
The portable envelope is `{ format: "muu-sinh-save", version: 5, exportedAt, data }`.
It contains only persistent player data (level derives from XP), not Zustand
actions/metadata or UI state. Backup files contain the player's name/progress;
keep them private. No accounts, network requests, cloud services or dependencies.

Imports are limited to 256 KiB. File selection only validates and previews; an
explicit confirmation replaces progress and reinitializes React state. Supported
portable versions 0–5 reuse existing migration/normalization. Future versions,
invalid shapes/dates/numbers and unsafe keys are rejected. Obsolete IDs fall back
safely; unowned paid clothing never becomes owned except worn legacy v0–3 gear.
Restoring older dates follows normal daily rollover/expiry rules, not extra rewards.

`saveService` is the single UI entry; pure `portableSave`/`saveMigration` do not depend
on React or Zustand. `SaveRepository` separates the envelope from storage transport;
`LocalStorageSaveAdapter` alone knows the existing local persistence wrapper/key.
Future cloud code can reuse this portable boundary, but no cloud transport exists.

Before restore, reset or legacy local migration, one normalized recovery envelope
is kept in `muu-sinh-backup`. Restore holds an in-memory snapshot and pauses automatic
persistence during commit; storage/subscriber failures restore the original state.
If the pre-migration recovery write fails, the old local save stays untouched;
normalized progress remains usable in memory until recovery storage is available.
Reset requires typing **XÓA**. The developer Home action now opens Profile instead
of immediately wiping data. `recoverSave()` is an internal/dev recovery helper.
Corrupt startup JSON recovers from a valid recovery slot when available; otherwise
safe defaults are used without overwriting corrupt/future data. Profile displays
storage health; blocked writes keep gameplay usable in memory but require exporting
a file to preserve it. The single local slot is not a backup history or a replacement
for downloaded files; browser/site-data deletion removes it too.

## Visual presentation

All twenty-six jobs use original layered Phaser/vector illustrations and shared themes,
rounded button artwork, customer variants and restrained feedback under
`src/game/visual/`. Rectangular interaction areas, scooter collision anchors,
brick placement, recipes, dirt coordinates and all rewards/timing stay unchanged.
React job/navigation icons are original inline SVG; PNG exports keep their existing layout.

Visual randomness is independent of gameplay RNG. Each scene reuses a fixed pool
of 24 particle shapes; foam emission is throttled, scenery is drawn once and brick
decoration lookup uses a map rather than a per-frame scene scan. No textures,
remote art, fonts, dependencies, expensive masks or per-frame object creation.
Reduced motion suppresses ambient loops, bursts, shake and movement transitions.
VFX cleanup follows scene shutdown/destroy; score/readable status feedback remains.

## Development

```bash
npm install
npm run dev
```

## Quality and release

```sh
npm run lint
npm run test:run
npm run build
npm run release:check
npm run preview
```

`npm run test` watches the Vitest logic suite. Tests use fixed dates and isolated
in-memory localStorage. `release:check` runs lint, tests, production build, and
static PWA/asset validation; any failure exits non-zero. It starts no server.
See [BETA_CHECKLIST.md](BETA_CHECKLIST.md) for the remaining device checks.

## Installation and offline play

Build, then preview the production app. Service workers run on HTTPS deployments
or localhost; the Vite development server does not register one. The first
successful production load caches the app shell, all twenty-six games, local styles,
manifest, and icons. Progress and settings remain in localStorage, including
across updates. PNG result exports also work offline.

Home offers **CÀI GAME** only when the browser provides an install prompt. Installed
apps hide that action. iOS Safari shows a small manual installation hint.

New builds show **CÓ PHIÊN BẢN MỚI**. Update after completing a game: the button
activates the waiting worker and reloads. Update checks run when returning to the
app, reconnecting, and hourly while it is visible. No automatic mid-game reload
occurs.

## Production browser QA

```sh
npm run build
npm run qa:pwa
```

This reuses an **existing** Playwright installation with no new browser test
dependency. Set `PWA_QA_PLAYWRIGHT` to its package directory if unavailable in the
project. Optionally set `PWA_QA_BROWSER` to a Chrome/Chromium executable when no
Playwright browser is installed. For example, in PowerShell:

```powershell
$env:PWA_QA_PLAYWRIGHT='C:\path\to\node_modules\playwright'
$env:PWA_QA_BROWSER='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run qa:pwa
```

The command starts an isolated production preview, checks Town touch navigation,
all twenty-six locations, avatar/panels, free-play versus Daily, and all jobs through
their actual timers. It also checks offline reloads, Career, replay, persisted
progress, PNG downloads, three mobile sizes, and updates. It closes its preview/browser when finished and
writes screenshots/downloads to a temporary directory. Missing prerequisites or
failed checks exit non-zero. `npm run qa:static` validates built assets without a
browser. Scene routing is covered by the production smoke flow. Use
`npm run qa:pwa -- --town-only` to stop after Town and the shared profile/shop,
daily-system and backup checks; the full command remains the release QA gate.

## Cloudflare Pages

Android development is documented in [ANDROID.md](ANDROID.md). Capacitor packages
the same `dist` locally; web/PWA deployment and saves are independent and unchanged.

Connect the repository to Cloudflare Pages and enter:

- Framework preset: **React (Vite)**.
- Project root: repository root (leave the root directory field empty).
- Production branch: **main**.
- Build command: **npm run build**.
- Build output directory: **dist**.

Before pushing, run `npm run release:check` and `npm run qa:pwa` with the browser
QA prerequisites above. Once Git integration is connected, pushes to `main`
trigger new production deployments. No runtime server or application environment
variables are needed. Vite's default root base (`/`) matches `https://<project>.pages.dev/`;
navigation is in React state, so no additional SPA redirects are required.

## Branding

Task 22C identity, editable SVGs, PNG exports and Android icon/splash resources:
[design/BRANDING.md](design/BRANDING.md). Preview at `/branding-preview.html` in
Vite dev/production preview. `npm run branding:generate` uses the existing QA
Playwright/browser installation; `npm run qa:branding` verifies production
artwork, Home/navigation, offline results and PNG export. Production builds
require neither browser tooling nor asset regeneration.

## Android / Google Play release preparation

See [TASK_23.md](TASK_23.md) and [release instructions](release-assets/RELEASE.md).
Task 24 gates/evidence: [TASK_24.md](TASK_24.md). `npm run qa:signing` checks
tracked private filenames before signed builds. The offline `/privacy-policy`
HTML and Welcome/Profile links are DRAFTS pending owner/contact approval;
do not deploy or submit them as a final policy yet. Regenerate both policy drafts
with `node scripts/store-assets.cjs --policy-only`; verify with
`npm run qa:pwa -- --privacy-only` (same browser setup as other PWA QA).
Owner-approved ID: `com.muusinh.game`. `npm run mobile:bundle` requires a dedicated
upload key configured outside the repository and an approved public certificate
fingerprint; it builds/checks locally and never uploads. Without credentials,
direct `:app:bundleRelease` is unsigned inspection only. Draft store/privacy
deliverables are in `release-assets`; branding, contact/policy URL and physical
Android QA still need owner approval. Backup JSON before switching signatures.
Web/PWA builds still use `npm run build` and `dist`; no Cloudflare changes.
