# Google Play Internal Testing — DRAFT owner checklist

Reviewed 2026-10-09. No Console form filled, artifact uploaded or release published.
Studio display name: Muu Sinh Studio; app: MƯU SINH; package: com.muusinh.game.
These are verified implementation notes, NOT finalized policy declarations.
Internal-track-only apps are currently exempt from the public Data Safety section,
and Console allows internal tests before all app setup is complete. These policy,
branding and device approvals remain this project's owner release gates; they are
not all mandatory Console gates for a first internal upload. Complete declarations
before wider tracks when required. Never bypass the signed-AAB requirement.

## App/content declarations — owner must approve exact answers

- [ ] Data Safety: review `policy-audit.md` against the EXACT signed bundle/SDKs.
  Profile/inventory/save v5 are local. PNG contains game results, JSON includes
  nickname/full save. User-directed export/share, clipboard and OS backup need
  separate consideration; local-only processing is not developer collection.
  Do not invent encrypted storage/transit, remote deletion, or universal no-sharing.
- [ ] App access: no login or real-money paywall. Provide truthful instructions:
  create a local nickname → Career → choose any of 26 jobs → tutorial/start.
  No reviewer username/password required. Shop uses fictional game money.
- [ ] Ads: current source/runtime has no ads/advertising SDK. Owner confirms the
  same for the actual submission; no ad-ID permissions observed.
- [ ] Target audience: select intended age groups deliberately. No owner decision
  received; do not infer child-directed/Families compliance from cartoon art.
- [ ] Content rating: review all 26 professions, cartoon hazards, humorous text,
  fictional money and sharing before answering the questionnaire. No rating assigned.
- [ ] Permissions: INTERNET plus AndroidX signature-level receiver permission;
  no dangerous location/contact/camera/mic/storage permissions in current artifact.
  Native picker grants only the selected destination; OS share grants file access.
- [ ] Store listing: approve Vietnamese copy, 512×512 RGBA icon, 1024×500 feature
  graphic and seven 1080×1920 screenshots. These screenshots are actual browser
  production UI, NOT physical Android captures. Branding still unapproved.
- [ ] Contact/privacy: supply real developer contact email and required account
  identity/address information in Console. Approve policy, separately authorize
  publication, verify public HTTPS `/privacy-policy` URL, then remove draft markers
  consistently in HTML/Markdown/in-app. No invented contact or public URL.

## Package/signing/testing workflow — manual only

- [ ] Confirm correct Play account, package availability, account type/date and
  required identity/device checks. Studio display name is not verified legal identity.
- [ ] Prepare private upload key/properties and two encrypted tested backups per
  `RELEASE.md`. Configure Play App Signing manually; distinguish upload certificate
  from Play-distribution app-signing certificate, record both public fingerprints.
- [ ] Run signed workflow/artifact checks. Verify non-debug certificate and pin its
  public SHA256, bundletool PASS, current version, manifest/assets and AAB SHA256.
- [ ] Complete physical-device checklist BEFORE relying on native export/share,
  signed install/save migration or Android 16/16KB/performance claims.
- [ ] In Play Console create app and Internal Testing track; manually select verified
  signed AAB, release notes and tester email list/Google Group. Review release changes
  before owner publishes to that track; do NOT start production rollout.
- [ ] Share Console opt-in link with consenting testers; verify store-installed app,
  offline launch, 26 jobs, files/storage/Back and pre-launch crash/ANR report.
  Record tester device/Android/WebView, versionCode, steps, expected/actual result,
  screenshots and save-safe reproduction. Obtain permission before collecting
  personal reports; do not ask testers to send private backups publicly.
- [ ] Check account-specific closed testing. Personal accounts created after
  2023-11-13 currently generally require ≥12 continuously opted-in testers for
  ≥14 days in CLOSED testing before requesting production access. Internal testing
  does not replace this; confirm actual Console requirements and account eligibility.
- [ ] For subsequent uploads deliberately increment Android versionCode (currently1),
  update verifier/tests/version notes and repeat all gates. npm package version is
  not the Android version. No update uploaded automatically.

Sources: [User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en),
[Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en),
[Play App Signing](https://developer.android.com/studio/publish/app-signing),
[Internal testing](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en),
[personal-account closed testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
Recheck current Console requirements before submission; no legal compliance certification.
