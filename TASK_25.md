# Task 25 — secure Android signing and Play testing readiness

Inspected on 2026-10-09: TASK_24.md, release-assets/RELEASE.md, Gradle signing
gate, android-release.ps1, artifact report, Git tracking and private file metadata.
Resumed after the owner confirmed local key creation. Signed release workflow
completed successfully. Existing work preserved; no commit/push/upload/deployment.

## Current evidence

- Windows profile resolves to `C:\Users\THIS PC`.
- Approved directory `C:\Users\THIS PC\muu-sinh-secure` exists, is not a
  junction/symlink, and has protected ACLs: owner `DUYBINH\THIS PC` and SYSTEM
  only, both FullControl. No permission changes necessary.
- Both private files now exist at the approved external paths. Their ACLs inherit
  only owner/SYSTEM FullControl from the protected directory.
- Initial preflight found a missing/blank Java `keyAlias` property; added only
  `keyAlias=muu-sinh-upload` with the patch utility. Existing passwords and
  keystore were preserved. Java Properties parsing and both passwords now work.
- Alias `muu-sinh-upload` is a private RSA3072 key, with a valid non-debug X.509
  certificate. A local signing challenge verified against that certificate.
- PUBLIC upload certificate SHA-256:
  `4a91b78971b08cce0212e37548d7e055fadbc86ae23834554eec601f62c214de`.
- JDK 21 keytool exists at `C:\Program Files\Java\jdk-21.0.12\bin\keytool.exe`.
- Alias remains `muu-sinh-upload`; owner approval already received. No new
  approval required. Passwords must be selected and entered locally by the owner.
- `npm run qa:signing` PASS: no private signing/config filenames tracked.
  This check covers Git index filenames, not content or Git history.
- Host `adb devices -l` succeeded with an empty list. DEVICE QA BLOCKED.
  Sandbox daemon failure was resolved by running the permitted host check.

## Owner key-creation reference — completed, do not run generation again

Do these locally; do not paste passwords, file contents or terminal recordings
into chat. Keep terminal transcription and screen recording off during entry.
Do not enter password options into commands or shell history.

### 1. Create the private properties file

Run:

```powershell
notepad 'C:\Users\THIS PC\muu-sinh-secure\signing.properties'
```

Save exactly these property names, replacing the two example values PRIVATELY:

```properties
storeFile=C:/Users/THIS PC/muu-sinh-secure/muu-sinh-upload.jks
storeType=JKS
storePassword=REPLACE_PRIVATELY
keyAlias=muu-sinh-upload
keyPassword=REPLACE_PRIVATELY
```

Choose a strong ASCII password in your password manager and use the same store
and key password for Android tool compatibility. Follow Java properties escaping
if the password contains backslashes or leading whitespace. The example values
are not credentials and must not remain in the file. Save as `signing.properties`,
not `signing.properties.txt`, using an encoding compatible with Java Properties
(ASCII content without BOM). The new file inherits the directory's restricted ACL.
Verify permissions locally using:

```powershell
icacls 'C:\Users\THIS PC\muu-sinh-secure\signing.properties'
```

Only your Windows owner account and SYSTEM should have access. Stop if another
identity is present; do not move this file into the repository.

### 2. Generate the key interactively, after saving the private configuration

Run this complete block in YOUR terminal. It stops if the keystore exists:

```powershell
if (Test-Path -LiteralPath 'C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks') {
    throw 'Keystore already exists. Do not overwrite it; inspect its identity first.'
}
if (-not (Test-Path -LiteralPath 'C:\Users\THIS PC\muu-sinh-secure\signing.properties' -PathType Leaf)) {
    throw 'Create the private signing.properties file first.'
}
& 'C:\Program Files\Java\jdk-21.0.12\bin\keytool.exe' -genkeypair `
    -keystore 'C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks' `
    -alias muu-sinh-upload -storetype JKS -keyalg RSA -keysize 3072 `
    -sigalg SHA256withRSA -validity 10000
if ($LASTEXITCODE -ne 0) { throw 'Key generation failed. Do not proceed to signing.' }
```

Enter the configured password only at keytool's hidden prompts. Enter accurate
certificate identity locally when asked; do not use Android Debug. If asked for
the key password, Enter uses the store password. No identity or password was
chosen automatically. Verify the keystore ACL also inherits owner/SYSTEM only:

```powershell
icacls 'C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks'
& 'C:\Program Files\Java\jdk-21.0.12\bin\keytool.exe' -list -v `
    -keystore 'C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks' `
    -alias muu-sinh-upload
```

The certificate fingerprint is public. Record and approve its SHA-256 for this
upload key; keep the private key/passwords separate. Reply **configuration ready**
after both files exist. You may provide the PUBLIC certificate SHA-256 for the
existing fingerprint pin; never provide passwords or private file contents.

### 3. Resume verification and build

Private setup is verified. For future builds, set only paths and the verified
PUBLIC fingerprint in the build environment:

```powershell
$env:JAVA_HOME = 'C:/Program Files/Java/jdk-21.0.12'
$env:MUU_SINH_SIGNING_PROPERTIES = 'C:/Users/THIS PC/muu-sinh-secure/signing.properties'
$env:MUU_SINH_UPLOAD_CERT_SHA256 = '4a91b78971b08cce0212e37548d7e055fadbc86ae23834554eec601f62c214de'
$env:BUNDLETOOL_JAR = 'D:/muu-sinh-game/node_modules/.tmp/task-23/bundletool-all-1.18.3.jar'
Set-Location 'D:\muu-sinh-game'
npm run mobile:bundle
```

This existing workflow runs lint, all tests, production build/static checks,
Capacitor sync, required upload signing, bundletool/signature/manifest checks
and public fingerprint matching. Rebuild debug APK as needed to keep its bundled
assets current. Record actual signed size/hash/certificate only after success.
Use the verified signed artifact recorded below for owner-controlled testing.

## Signed artifact — verified

`npm run mobile:bundle` completed with exit code 0. Gradle required upload
signing, and artifact verification required the exact public fingerprint above.
The output now contains a signed production AAB:

- Path: `D:\muu-sinh-game\android\app\build\outputs\bundle\release\app-release.aab`
- Size: 4,834,237 bytes.
- SHA-256: `2800bf7c04be7ee0b1595f53d40488dd8018b4e5cac2d93360af3759e8987bea`.
- Task 25 bundletool validation PASS, com.muusinh.game / versionCode 1 /
  versionName 1.0 / target SDK 36 / 39 bundled web files.
- Verification report: SIGNED_VERIFIED; jarsigner verification PASS, certificate
  is non-debug and SHA-256 matches the independently inspected upload keystore.
- Updated public artifact report: `node_modules/.tmp/task-23/android-artifacts.json`.
- Existing debug APK's 39 assets still match rebuilt dist, so no redundant debug
  rebuild necessary. It remains development-signed and was not installed.

## Backup, device and Console gates

Keep two encrypted, privately recovery-tested copies of the keystore and signing
configuration in separate owner-controlled locations. Store backup passphrases
separately in a password manager; record alias/public fingerprint and Play account
ownership. No backup/upload was performed. Preserve existing keys; never silently
replace them. Follow RELEASE.md for Play App Signing and upload-key distinctions.

Physical-device acceptance remains BLOCKED. Connect a USB-debugging phone and
authorize this PC, then follow `release-assets/device-qa-checklist.md`: all 26
jobs, icon/splash, Back/pause, offline/restart saves, real PNG sharing/JSON picker,
Shop/Garage/Room and app crash logs with model/Android/WebView recorded. Export
and verify a JSON backup before install changes; do not uninstall or overwrite
an incompatible-signature installation without owner approval.

Existing store assets remain present: icon 512x512, feature graphic 1024x500,
seven 1080x1920 browser screenshots previously validated in Task 24. Branding
approval and actual Android screenshots/appearance acceptance remain pending.
Privacy is a prepared draft only, with no public URL or approved developer email.
Its publication requirement is incomplete. Data Safety, audience, rating, ads,
permissions and listing/contact drafts remain in
`release-assets/play-console-checklist.md` for owner review; no declarations
submitted or missing facts invented.

## Regression and changes

Task 25 updates `TASK_25.md` and `release-assets/RELEASE.md`, plus the nonsecret
alias entry in the external private properties file. Observation-only Java
preflight tooling lives under ignored `node_modules/.tmp/task-25`.
No application/gameplay behavior changed.
Fresh Task 25 results via mobile:bundle: lint, 567/567 tests (35 files), build,
release:check, static39 assets/26scenes, cap sync, required signed Gradle release,
bundletool, manifest/assets/certificate pin and independent AAB hash PASS.
Full production PWA/26 mock-native lifecycle evidence remains Task 24's result;
unchanged frontend was not retested unnecessarily. Existing nonblocking Vite
chunk-size, Gradle deprecation/flatDir and SDK XML warnings remain.

Security: private files remain external with restricted ACLs; keystore was not
overwritten or regenerated. Passwords were consumed only in local processes,
never printed or supplied in command arguments/environment variables. Git index
filename hygiene PASS. Current signing passwords and exact keystore bytes scan
against indexed Git blobs and dist PASS, without printing values. This does not
certify historical or unrelated secrets.
No commit/push/deploy/Play upload.

Recommended Task 26: owner-controlled Google Play Internal Testing after signed
artifact verification, physical-device QA, privacy/contact and branding gates.
