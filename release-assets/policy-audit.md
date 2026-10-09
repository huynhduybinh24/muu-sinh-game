# Privacy / Data Safety — DRAFT, owner review required

Audited source: `src/services/{saveStorage,saveService,saveMigration,nativeFiles,
shareCardImage,platform}.ts`, PWA registration/hooks, Zustand store and native Java bridges;
runtime dependencies and registered Capacitor plugins; final merged release
manifest and offline browser network observations. No new SDK/dependency added.
Publisher supplied: **Muu Sinh Studio**. Contact email/public policy URL/legal
identity information have NOT been supplied. No policy has been published.

## Actual data paths

- Local profile nickname, appearance, inventory/equipment, score/history, money,
  XP, daily systems, achievements and preferences: localStorage with existing
  version-5 validation/backup. No login or developer cloud save. Game money is
  fictional, not financial account information. Daily logic uses local dates,
  not GPS. Browser and Android stores are independent.
- PNG: current renderer includes job/result/statistics, NOT the player nickname.
  JSON: player nickname and full exported save and
  metadata; import reads the specific user-picked file and validates it. Sharing
  is explicit user action via browser/native OS picker, not background telemetry.
- Clipboard copy fallback is user-initiated and may expose backup content to
  clipboard/history/other applications according to OS/browser settings.
- Native export uses private Cache plus FileProvider, system document picker,
  Android share intents. Cache cleanup of exports older than 24h runs on the
  next export; not a guarantee of timed deletion. User destination/receiver can
  be another app or a cloud-backed document provider. Files already shared are
  outside the game's control. Never state that data *never* leaves the device.
- Manifest `allowBackup=true` remains unchanged: Android/system backups may
  include application data depending on OS, transport, device settings and
  platform exclusions. No claim that WebView saves necessarily back up/restore.
- Web hosting necessarily receives network requests/IP for app delivery and
  updates. Native packaged app has no remote server URL; runtime audit found no
  app-owned telemetry/network submission. OS/WebView/receiving-app behavior is
  not eliminated by this source audit.

## Dependencies and permissions

React/ReactDOM render UI; Zustand persists local state; Phaser renders local
canvas gameplay; Capacitor Android/Core bridge the bundled WebView. Registered
plugins: App 8.1.2 (lifecycle/Back), Filesystem 8.1.4 (cache file operations),
Share 8.0.3 (OS intents), local FileExport Java plugin (document picker).
Core/Android/CLI 8.5.3. AndroidX/Java runtime dependencies do not introduce
ad/analytics/identity SDKs in the inspected release dependency tree. No Firebase,
ads, IAP, analytics, login, contacts, location, microphone/camera or advertising
identifier code found. No runtime device-ID collection found.

Source manifest requests INTERNET only. Final release also has AndroidX-generated
signature-level `com.muusinh.game.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` for
protected receiver handling: not broad storage or personal-data access. File
providers are non-exported and grant per-file URI access. No dangerous storage
permission or auto-granted document selection introduced.

In-app draft accessible at Welcome and Profile, offline, with no navigation/save
mutation. Source of truth `src/data/privacy.ts`; readable exported draft supplied
for owner approval, not a fictitious contact/link. Local data is not separately
encrypted by this game. Confirmed reset REPLACES the active save and retains a
normalized snapshot under `muu-sinh-backup`; restore and legacy migration also
write this recovery slot. It has no TTL and is replaced by the next recovery
write. `tests/save.test.ts` already verifies reset can be recovered. Clear app
data/site storage to delete both local slots; do not present Reset as complete
erasure. OS/cloud/user-exported backups require separate deletion by their holder.

Task 24 adds script-free Vietnamese `public/privacy-policy.html`, served at
`/privacy-policy` on the web and `/privacy-policy.html` in the bundled native app.
Welcome/Profile have a visible link as well as inline offline disclosure.
Native clicks open the same local text in a dialog handled by the EXISTING Back
cancel path, not another WebView/React instance. The HTML is still bundled;
browser links open the actual clean URL. Mock-bridge regression is not device QA.
HTML and Markdown regenerate from `src/data/privacy.ts` with
`node scripts/store-assets.cjs --policy-only`. Draft warning and noindex remain;
noindex is NOT access control. No website deployment/publication authorized.
Do not deploy this draft as a final policy: real contact, owner approval and
public HTTPS URL verification still required.

## Draft Data Safety guidance — NOT a prefilled submission

No observed developer/server collection from current Android app. Pure on-device
processing is excluded from “collection” under Play's definition. Review
nicknames/gameplay data in user-directed PNG/JSON transfers; direct transfer to
another app counts as sharing unless an applicable exception such as clearly
user-initiated transfer applies. Do not select universal “no collection/sharing”
just because there is no backend. OS backups/document providers and every SDK
must be considered in the exact submitted version.
[Data Safety definitions](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

Owner must decide accurate data types, collection/sharing exceptions, optional
export purpose, deletion answer and encryption answer; do not invent encryption
in transit or a server-deletion mechanism. There are no server accounts to delete.
Re-audit after any SDK, permissions, remote endpoints or monetization changes.
Network observation on offline production UI is supplemental evidence, NOT a
physical Android traffic capture or proof of behavior of all system components.

## Other Console declarations / owner gates

- Ads: current build has no ad SDK/display; review Console's no-ads answer.
- App access: no login/paywall; provide truthful reviewer navigation to all jobs.
- Target audience: owner selects ages deliberately; no assumption of children or
  Families compliance. Nickname is local profile creation, not account creation.
- Rating: owner reviews all professions/cartoon incidents and questionnaire;
  do not fabricate a rating or claim real medical/professional advice.
- Permissions: INTERNET plus generated signature receiver permission; no broad
  storage. Do not add permission declarations for capabilities not requested.
- Developer identity: studio display name is not proof of verified legal entity,
  account type or ownership. Owner completes identity/contact requirements.
- Approve draft, add a real privacy contact, publish a publicly accessible,
  non-geofenced HTML policy URL (not PDF), then update draft markers and Console.
  In-app text alone does not complete Play's public URL requirement.
  [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).
