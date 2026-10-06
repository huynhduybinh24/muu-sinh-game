# MƯU SINH – Mỗi Ngày Một Nghề

React/TypeScript handles UI and persisted Zustand progress; Phaser 3 owns the
three mini-games. Vite builds the app and its PWA service worker.

## Player profile

First launch asks for a 2–20 character name, then opens the original layered-SVG
character creator. Home, Profile, and the creator share one avatar component and
typed appearance configuration. Appearance edits never change career progress.
Save version 3 adds `profile` to the existing storage key; older saves keep all
progress/settings and go through setup once. Level is display-only (one level
per ten completed games). Profiles stay on this device, without accounts or sync.

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
successful production load caches the app shell, all three games, local styles,
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

The command starts an isolated production preview, checks all jobs through their
actual timers, offline reloads, Career, replay, persisted progress, PNG downloads,
three mobile sizes, and updates. It closes its preview/browser when finished and
writes screenshots/downloads to a temporary directory. Missing prerequisites or
failed checks exit non-zero. `npm run qa:static` validates built assets without a
browser. Scene routing is covered by the production smoke flow.

## Cloudflare Pages

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
