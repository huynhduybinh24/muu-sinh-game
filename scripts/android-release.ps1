$ErrorActionPreference = 'Stop'
$repository = Split-Path $PSScriptRoot -Parent
& node (Join-Path $PSScriptRoot 'signing-hygiene.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Private signing files must not be tracked.' }
# Only the private file PATH is an environment variable; passwords never enter argv.
if (-not $env:MUU_SINH_SIGNING_PROPERTIES) {
    throw 'Configure a dedicated upload key in an external properties file first. See release-assets/RELEASE.md.'
}
if (-not $env:MUU_SINH_UPLOAD_CERT_SHA256 -or $env:MUU_SINH_UPLOAD_CERT_SHA256.Replace(':', '') -notmatch '^[a-fA-F0-9]{64}$') {
    throw 'Set MUU_SINH_UPLOAD_CERT_SHA256 to the owner-approved PUBLIC upload certificate fingerprint.'
}
if (-not $env:BUNDLETOOL_JAR -or -not (Test-Path -LiteralPath $env:BUNDLETOOL_JAR -PathType Leaf)) {
    throw 'Set BUNDLETOOL_JAR to the official bundletool-all JAR.'
}
Push-Location $repository
try {
    & npm.cmd run release:check
    if ($LASTEXITCODE -ne 0) { throw 'Release checks failed.' }
    & npx.cmd cap sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed.' }
    Push-Location android
    try {
        & .\gradlew.bat :app:bundleRelease -PrequireUploadSigning=true --no-daemon
        if ($LASTEXITCODE -ne 0) { throw 'Signed bundle build failed.' }
    } finally { Pop-Location }
    & node scripts/verify-android-artifacts.cjs --require-signed
    if ($LASTEXITCODE -ne 0) { throw 'Artifact verification failed.' }
} finally { Pop-Location }
