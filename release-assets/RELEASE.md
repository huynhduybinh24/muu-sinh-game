# Android release — preparation, not publication

Approved package ID: `com.muusinh.game`; developer name: Muu Sinh Studio.
Version code `1`, version name `1.0`, min SDK `24`, target/compile `36`,
Android Gradle Plugin `8.13.0`, Gradle `8.14.3`, JDK 21. Increment versionCode
for each subsequent Play upload. The npm package version is not Android's version.
Availability/ownership of the package in Play Console still requires owner review.

## Reproduce unsigned inspection artifacts

From repository root:

```powershell
npm run release:check
npx cap sync android
Push-Location android
.\gradlew.bat :app:assembleDebug :app:bundleRelease --no-daemon
Pop-Location
# Use the official bundletool-all JAR; it is tooling, not an app dependency.
$env:BUNDLETOOL_JAR = 'C:/your-private-tools/bundletool-all-1.18.3.jar'
npm run qa:android-artifacts
```

Without upload credentials, release AAB is UNSIGNED and is NOT upload-ready.
Outputs: `android/app/build/outputs/apk/debug/app-debug.apk` and
`android/app/build/outputs/bundle/release/app-release.aab`.
All web files must match `dist` byte-for-byte. The artifact checker runs
bundletool validation, inspects the actual manifest/permissions, rejects
debuggable release and unknown native `.so` libraries, checks JAR signatures,
and emits a report under ignored `node_modules/.tmp/task-23`.
Source version assertions must be updated deliberately on the next version bump.

## Dedicated upload key — OWNER ACTION ONLY

Task 24: owner approved a dedicated upload key, conditional on private password
configuration. Approved external locations (not secret values):

- Keystore: `C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks`
- Properties: `C:\Users\THIS PC\muu-sinh-secure\signing.properties`
- Alias: `muu-sinh-upload`

The directory was created and ACL checked: only owner and SYSTEM have explicit
FullControl; inherited permissions removed. No key/password/config generated.
Password configuration remains BLOCKED. Do not generate a key until it exists.
Owner must choose strong passwords privately and protect the key. Use Android Studio's
Generate Signed Bundle workflow or [Android signing documentation](https://developer.android.com/studio/publish/app-signing).
Do not use an Android debug key. Enroll in Play App Signing after checking the
account's ownership and signing choices; the upload key is not necessarily the
key Google uses to sign distributed APKs.

### Enter credentials locally — not in chat

1. In your own Windows terminal, open the private file with
   `notepad "C:\Users\THIS PC\muu-sinh-secure\signing.properties"`.
   Populate the properties below using passwords from your password manager.
   The file contains plaintext secrets: it must inherit the restricted directory
   ACL, never be shared/screenshotted/logged or copied into this repository.
   Java properties values escape backslashes as `\\`; avoid leading whitespace.
   Use an ASCII password-manager password or properly escape Unicode as `\uXXXX`.
   Use the same strong store/key password for Android tooling compatibility.
2. Save privately, close the editor, and tell Codex only **configuration ready**.
   Do not paste the file or passwords. Codex must check existence/validity without
   displaying content; approval does not authorize logging secrets.
3. After configuration, the owner can generate the key interactively in their own
   terminal using the command below. No password option is passed on argv: keytool
   prompts locally. Use the configured password; enter accurate certificate identity
   when asked, not Android Debug. For the key-password prompt, Enter uses the same
   store password. This command is DOCUMENTATION ONLY; not executed by Codex yet.

```powershell
& 'C:\Program Files\Java\jdk-21.0.12\bin\keytool.exe' -genkeypair `
  -keystore 'C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks' `
  -alias muu-sinh-upload -storetype JKS -keyalg RSA -keysize 3072 `
  -sigalg SHA256withRSA -validity 10000
# Public certificate information only; password is prompted locally, not in argv.
& 'C:\Program Files\Java\jdk-21.0.12\bin\keytool.exe' -list -v `
  -keystore 'C:\Users\THIS PC\muu-sinh-secure\muu-sinh-upload.jks' -alias muu-sinh-upload
```

Never run generation against an existing keystore; STOP and inspect its identity
privately instead. Keep terminal transcription/screen recording off while entering
passwords. The 10,000-day certificate validity exceeds 25 years; Gradle also rejects
expired/not-yet-valid certificates. References:
[Java keytool prompts](https://docs.oracle.com/en/java/javase/21/docs/specs/man/keytool.html),
[Android signing](https://developer.android.com/studio/publish/app-signing).

Create a private properties file OUTSIDE the repository. Use absolute paths,
forward slashes on Windows; placeholders below are examples, not real values:

```properties
storeFile=C:/Users/THIS PC/muu-sinh-secure/muu-sinh-upload.jks
storeType=JKS
storePassword=REPLACE_PRIVATELY
keyAlias=muu-sinh-upload
keyPassword=REPLACE_PRIVATELY
```

Use `PKCS12` if that is the actual store type. Restrict file permissions to the
owner/build identity. Keep passwords out of commands, screenshots, logs, source
and chat. Set only the file path and PUBLIC certificate fingerprint as env vars:

```powershell
$env:JAVA_HOME = 'C:/Program Files/Java/jdk-21.0.12'
$env:MUU_SINH_SIGNING_PROPERTIES = 'C:/Users/THIS PC/muu-sinh-secure/signing.properties'
$env:MUU_SINH_UPLOAD_CERT_SHA256 = 'OWNER_APPROVED_PUBLIC_CERTIFICATE_SHA256'
$env:BUNDLETOOL_JAR = 'C:/your-private-tools/bundletool-all-1.18.3.jar'
npm run mobile:bundle
```

Run `npm run qa:signing` to check the Git index without opening secrets. Ignore
rules alone cannot protect previously tracked files. A tracked private filename
blocks `mobile:bundle`; this is not a historical/content secret scan.
The script runs signing hygiene, release:check, sync, `bundleRelease -PrequireUploadSigning=true`,
then signature/certificate/artifact checks. Missing/partial config, files inside
the repository, debug certificate, unsigned bundle or wrong approved fingerprint
fail. Direct Gradle release builds without credentials remain available ONLY for
unsigned inspection. Never infer upload-readiness from existence of an AAB.
No deployment/upload command is present. On non-Windows hosts run equivalent
Gradle wrapper commands manually; the convenience script is PowerShell/Windows.

Keep two encrypted backups of keystore/properties in separate owner-controlled
locations; keep passphrases separately in a password manager. Record public
fingerprints, alias and Play account owners. Test recovery privately. With Play
App Signing, a lost upload key can require Play Console's upload-key reset process;
do not promise recovery of a lost self-managed app-signing key. Never commit or
send private keys, and never make a fresh key silently for an existing app.

Official tool used for this audit:
[bundletool 1.18.3](https://github.com/google/bundletool/releases/tag/1.18.3),
SHA256 `a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29`
verified against GitHub release asset digest. Tool downloaded only to ignored QA
storage, not bundled into the game or committed.

## Save and install safety

Export JSON using the existing in-app Backup action before any installation
change. Web and Capacitor WebView storage are separate; they do not auto-migrate.
Same appId with a different signing certificate cannot update the installed debug
app. If Android refuses the update, STOP; do not uninstall/clear data. Have owner
approve a migration plan after verifying exported JSON. Restore on the new signed
app with the existing picker. Play App Signing can create another certificate
boundary from locally installed upload-signed APKs: verify the intended install path.

## Twelve-step Play Console checklist — no answers submitted

1. Verify account type, registration date, identity/contact/address requirements,
   organization/personal eligibility and Android-device verification in Console.
2. Package ID approved by owner; confirm it is available under the correct account.
3. Owner creates/approves dedicated upload key and private backups as above.
4. Owner configures Play App Signing and records both certificate fingerprints.
5. Build signed AAB, pin public upload fingerprint, validate with bundletool,
   inspect actual version/SDK/permissions/assets, test generated APKs on devices.
6. Approve branding and listing/alt text; replace/approve screenshots from actual
   Android. No fake device coverage. Complete required languages and contact info.
7. Approve privacy draft, add real contact and publish an active public policy URL
   through a separately authorized website change; update in-app draft status then.
8. Owner completes Data Safety from verified runtime and SDK audit; see policy notes.
9. Answer content-rating questionnaire honestly from all 26 professions; select
   audience ages and child-directed status intentionally. No automatic age rating.
10. Owner uploads to internal testing only after signed-artifact/device gates;
    check pre-launch report, store installation, offline saves/native file flows.
11. Check account-specific closed-testing requirement. New personal accounts
    created after 2023-11-13 generally need ≥12 opted-in testers continuously for
    14 days before applying for production access. Internal testing is not a substitute.
12. Review crash/ANR/device metrics, policies, audience, branding and save migration
    with owner before requesting production access or rollout.

As checked 2026-10-09, new mobile apps/updates target API 36 from 2026-08-31;
this configuration meets that SDK gate, not all release gates.
[Target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
Recheck account-specific requirements before upload;
[personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## Physical Android gate — BLOCKED until a real device is authorized

Run `adb devices -l`; authorize a USB-debugging phone. Record model, Android and
WebView versions. No device data has been deleted or device QA fabricated.
After backup, install a compatible-signed update with owner approval, then:

- Check logo/icon masks/themed icon/splash in light/night mode, portrait,
  edge-to-edge/status/navigation bars, predictive gesture Back and button Back,
  keyboard resize/IME dismissal and touch safe areas on Android 16.
- Open and finish ALL 26 jobs by touch; measure 45s ACTIVE gameplay excluding
  tutorials/pause/overlay; check scores/replay, interrupted drag/D-pad, background
  pause/resume and Back pause before leaving.
- Airplane-mode cold start; force-stop/reopen without clearing data; verify money,
  XP, 100-item Shop/equipment, Garage, Room, 46 achievements and daily state.
- Save/share actual PNG to a second app and open it there; export JSON, import via
  Android picker and compare the restored save; cancel each dialog safely.
- Record `adb logcat` for package crashes/ANRs, cold-start/FPS/long-session memory.
  Test a 16KB Android image/device and at least one modest phone; do not replace
  physical-device acceptance with browser mocks or a successful Gradle build.
