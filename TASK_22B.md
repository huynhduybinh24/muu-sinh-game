# Task 22B — Shop, inventory and lifestyle

All four implementation phases completed. React owns shopping/devices/Garage/room;
Phaser receives the existing profile snapshot and returns the unchanged GameResult.
No dependency, native configuration, backend, payment, job scoring/reward or daily
epoch changes. Existing user work (including ANDROID.md and the SDK helper) retained.
No commit, push, deployment or publication performed.

## Change manifest relative to Task 22A.2

16 files created:

- `src/components/AvatarEquipment.tsx`, `ProductArtwork.tsx`, `RoomArtwork.tsx`
- `src/data/lifestyle.ts`, `src/data/lifestyleProducts.ts`
- `src/game/avatar/drawEquipment.ts`
- `src/lifestyle.css`, `src/pages/LifestylePage.tsx`
- `src/services/lifestyle.ts`, `src/services/shopFilters.ts`
- `tests/lifestyleA.test.ts`, `lifestyleB.test.ts`, `lifestyleC.test.ts`, `lifestyleD.test.ts`
- `scripts/lifestyle-qa.cjs`, `TASK_22B.md`

34 existing files modified:

- `src/App.tsx`, `src/components/PlayerAvatar.tsx`
- `src/data/avatar.ts`, `src/data/shop.ts`, `src/data/achievements.ts`
- `src/game/avatar/avatarData.ts`, `createPhaserAvatar.ts`, `drawAvatar.ts`
- `src/game/scenes/ItScene.ts`, `src/game/scenes/TaxiScene.ts` (cosmetic only)
- `src/pages/CharacterCreatorPage.tsx`, `HomePage.tsx`, `ProfilePage.tsx`, `ShopPage.tsx`, `TownPage.tsx`
- `src/services/inventory.ts`, `navigation.ts`, `playerProfile.ts`, `portableSave.ts`, `saveMigration.ts`
- `src/store/progressStore.ts`
- `src/types/game.ts`, `profile.ts`, `shop.ts`
- `tests/economy.test.ts`, `playerProfile.test.ts`, `serviceJobs.test.ts`, `avatar-qa-browser.ts`
- `scripts/avatar-qa.cjs`, `pwa-qa.cjs`, `shop-qa.cjs`, `native-adapter-qa.cjs`
- `README.md`, `BETA_CHECKLIST.md`

The repository already contained uncommitted Task 22A/22A.2 work; this manifest
describes only Task 22B, not the aggregate Git diff. No package/lock/workflow changes.

## Catalog and economy

100 products: hair 8, shirts 16, pants 10, shoes 8, accessories 12, phones 6,
electronics 8, vehicles 9, personal/work tools 9, home 14.
Legacy 22 clothing IDs, prices, gates and six starters are unchanged. New products
have original SVG/CSS/Phaser art and fictional names. No externally downloaded art.

Pricing uses existing actual job rewards, `12,000 + score × 1,250`, and unchanged XP,
`30 + min(120, floor(score / 20))`. Starter <100k, everyday <1m, premium <10m,
luxury >=10m. New paid items start at 18k; phones 45k–7m, electronics 120k–6m,
vehicles 180k–60m, furniture 20k–1.6m. At an illustrative score 500, a shift earns
637k: a 60m luxury car needs about 95 shifts (71 minutes of 45-second gameplay).
At score 1500 it needs about 32 shifts (24 minutes), excluding inter-screen time.
These are examples, not measured player income or a promise of a typical score.
Read existing local fixtures/code rather than opening or rescaling real-player saves.

One synchronous Zustand purchase validates ID/level/funds/current ownership and
deducts once with inventory/spending in the same update. Negative/invalid funds,
duplicate purchases and unowned equipment are rejected. Purchases >=500k use a
cancelable dialog; confirmation revalidates state. Preview is a pure temporary
profile, and never touches money, ownership or persisted equipment. Clothing stays
worn until switching to another owned outfit; optional equipment can be removed.
No resale, currency achievement grants or gameplay bonuses.

## Rendering and lifestyle

Hair/shirt/pants plus shoes/hat/face/back/hand slots share IDs, colors and layer
ordering in React/Phaser. Back items sit behind the body; front equipment overlays
hands/head/feet. Phaser draws once into existing Graphics; anchors, tweens, hitboxes,
24-particle bounds and scene teardown are preserved. Room creates no game instance.

Devices select a phone and one personal electronic item. Profile/room show those
products; a selected laptop/desktop colors the IT monitor and shows its name.
Non-computer electronics do not replace the IT computer. This is cosmetic/status,
not a simulated operating system.

Garage supports four distinct type silhouettes, purchases via Shop and free
owned-vehicle switching. Profile/Town show selected artwork. Shipper only uses
motorcycle/scooter colors; Taxi only car colors. Scene vehicle geometry, input,
speed and collision shapes remain original; incompatible selections fall back.
The full purchased-model silhouette is not substituted into the game scenes.

Room uses fixed bed/desk/seat/storage/lounge/screen/plant/light/decor slots. Selection
is owned-only; replacement/removal is free. The personalized avatar, active phone,
placed furniture and selected device on a desk are rendered locally. No arbitrary
drag placement, multiple houses or separate inventory.

## Save v5 and achievements

`profile.lifestyle` is optional. Old profiles remain structurally unchanged;
reading missing configuration yields empty slots. All ownership stays in the
existing `ownedItemIds`. Migration validates catalog IDs, slots and ownership,
deduplicates inventory and clears invalid/unowned selections. Only original worn
legacy clothing can be grandfathered; new premium clothing is never granted.
Portable v5 validates optional field shape/types and normalizes unknown IDs safely.
No new mandatory v5 field or storage backend. Web and native saves remain separate;
the existing JSON backup/restore provides explicit migration, not automatic sync.

Six non-paying achievements append after the original 40: first purchase, complete
owned outfit, first vehicle, first smartphone (not keypad), furnished room (bed,
desk, chair and decoration), and 30 paid collectible items. Unlocks remain stored,
unique and never revoked when equipment is removed. Repeated selection/purchase
cannot mint currency or duplicate achievements.

## Verification

Focused suites passed after phases A, B, C and D. Final release gate passes lint,
534 tests across 31 files (421 baseline tests retained, 113 new), strict TypeScript,
production build and static PWA checks. Three existing tests update catalog counts
to the legitimately extended options/achievements; their regression cases remain.
Existing Phaser bundle-size warning remains non-blocking.

Production `--lifestyle-only` passed all 100 category/art counts, 44px purchase
targets, 360/390/412/1024 layouts, preview/cancel/buy/equip, all accessory slots,
phone/computer, four vehicle types, Profile/Town, room placement/removal, reload,
offline play and exact JSON export/restore. Source `qa:avatar -- --lifestyle-only`
passed all 26 equipped scenes, one avatar, bounded particles, reduced motion,
compatible Taxi color/IT selection and clean shutdown. Screenshots reviewed.
Sandal/boot/hat/bracelet/glove/apron variants and actual incompatible Shipper/Taxi
color fallback also passed. Production PWA updates, reload persistence and
standalone-mode offline backup/restore passed on the final build.

The broader production attempt passed profile migration, daily systems, backup,
all 26 offline Town routes and all 26 mocked-native freeze/resume/teardown cases.
The separate updated mock-native run also passed lifestyle Back history and purchase
cancellation without spending/extra listeners. The full production attempt reached
ten offline timer/result/PNG/replay cases before the chat interruption; it did not
finish all 26 timers. The default full QA remains a manual pre-publication gate.
The optional default source gameplay QA was interrupted too; it is not claimed as
a completed pass. Final focused 26-scene lifecycle QA and all unit tests did pass.

Capacitor sync bundles local `dist`; the existing SDK/JDK debug build uses:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12'
$env:JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=D:\muu-sinh-game\node_modules\.tmp\java-sockets'
cd android
.\gradlew.bat :app:assembleDebug --no-daemon
```

The short socket directory avoids Windows long-TEMP/JDK socket limits. It is local
build tooling only, not committed app configuration. APK output:
`android/app/build/outputs/apk/debug/app-debug.apk`.
Final build: `BUILD SUCCESSFUL`; the APK was opened as a ZIP and all 18 files in
the final `dist` output were verified byte-for-byte by SHA-256 against bundled
`assets/public`. The bundled app config has the existing provisional app ID and no
remote `server.url`. Capacitor/Gradle flatDir and SDK XML-version warnings remain
non-blocking. No real-device execution is implied by an APK build.

## Limits and next task

No real Android device or native sharing test is claimed. Manual APK cold-offline
launch, Back/pause/resume, touch controls, room rendering, restart persistence,
PNG/JSON picker/share and web-to-native migration remain release gates. Mid-range
device performance still needs measurement. Local save/clock editing cannot be
prevented without a backend; this task adds none. No signing/publication performed.

Recommended Task 22C: original Logo, App Icon & Branding Redesign, with launcher,
adaptive Android and PWA icons plus consistent title/share-card branding.
