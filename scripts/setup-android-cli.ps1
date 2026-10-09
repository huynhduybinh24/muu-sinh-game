[CmdletBinding()]
param(
    [string]$SdkRoot = (Join-Path $env:LOCALAPPDATA 'Android\Sdk'),
    [switch]$SkipPackages,
    [switch]$AcceptLicenses
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$commandLineToolsVersion = '15859902'
$commandLineToolsSha256 = '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a'
$commandLineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-${commandLineToolsVersion}_latest.zip"
$sdkManager = Join-Path $SdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'

function Add-PathEntry {
    param([Parameter(Mandatory)][string]$PathEntry)

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @($userPath -split ';' | Where-Object { $_ })
    if ($entries -notcontains $PathEntry) {
        [Environment]::SetEnvironmentVariable('Path', (($entries + $PathEntry) -join ';'), 'User')
    }
    if (($env:Path -split ';') -notcontains $PathEntry) {
        $env:Path = "$env:Path;$PathEntry"
    }
}

if (-not [Environment]::Is64BitOperatingSystem) {
    throw 'Android CLI setup requires 64-bit Windows.'
}

$java = Get-Command java.exe -ErrorAction SilentlyContinue
$javaVersion = $null
if ($java) {
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $javaVersion = (& $java.Source -version 2>&1 | Select-Object -First 1)
    $ErrorActionPreference = $previousErrorAction
}
if (-not $java -or $javaVersion -notmatch 'version "21(?:\.|\")') {
    $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw 'JDK 21 is missing and winget is unavailable. Install Eclipse Temurin JDK 21, then rerun.'
    }
    & $winget.Source install -e --id EclipseAdoptium.Temurin.21.JDK
    if ($LASTEXITCODE -ne 0) { throw "Temurin JDK installation failed with exit code $LASTEXITCODE." }

    $temurin = Get-ChildItem "$env:ProgramFiles\Eclipse Adoptium" -Directory -Filter 'jdk-21*' |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $temurin) { throw 'Temurin JDK 21 installed, but its installation directory was not found.' }
    $env:JAVA_HOME = $temurin.FullName
    [Environment]::SetEnvironmentVariable('JAVA_HOME', $env:JAVA_HOME, 'User')
    Add-PathEntry (Join-Path $env:JAVA_HOME 'bin')
}

if (-not (Test-Path $sdkManager)) {
    $tempRoot = Join-Path ([IO.Path]::GetTempPath()) "android-cli-$commandLineToolsVersion"
    $archive = Join-Path $tempRoot 'commandlinetools.zip'
    $expanded = Join-Path $tempRoot 'expanded'
    New-Item -ItemType Directory -Force -Path $tempRoot, $expanded | Out-Null

    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curl) {
        & $curl.Source --fail --location --continue-at - --output $archive $commandLineToolsUrl
        if ($LASTEXITCODE -ne 0) { throw "Android command-line tools download failed with exit code $LASTEXITCODE." }
    } else {
        Invoke-WebRequest -Uri $commandLineToolsUrl -OutFile $archive
    }
    $actualHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $commandLineToolsSha256) {
        throw "Android command-line tools checksum mismatch: $actualHash"
    }

    Expand-Archive -LiteralPath $archive -DestinationPath $expanded -Force
    $latest = Join-Path $SdkRoot 'cmdline-tools\latest'
    New-Item -ItemType Directory -Force -Path $latest | Out-Null
    Copy-Item -Path (Join-Path $expanded 'cmdline-tools\*') -Destination $latest -Recurse -Force
}

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
[Environment]::SetEnvironmentVariable('ANDROID_HOME', $SdkRoot, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $SdkRoot, 'User')
Add-PathEntry (Join-Path $SdkRoot 'platform-tools')
Add-PathEntry (Join-Path $SdkRoot 'cmdline-tools\latest\bin')

$repoRoot = Split-Path $PSScriptRoot -Parent
$localProperties = Join-Path $repoRoot 'android\local.properties'
$escapedSdkRoot = $SdkRoot.Replace('\', '\\').Replace(':', '\:')
Set-Content -LiteralPath $localProperties -Value "sdk.dir=$escapedSdkRoot" -Encoding ascii

if (-not $SkipPackages) {
    if ($AcceptLicenses) {
        Write-Host 'Accepting Android SDK licenses as explicitly approved by the user.'
        1..20 | ForEach-Object { 'y' } | & $sdkManager --licenses
        if ($LASTEXITCODE -ne 0) { throw "Android SDK license acceptance failed with exit code $LASTEXITCODE." }
    }

    Write-Host 'Installing requested SDK packages.'
    & $sdkManager 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0'
    if ($LASTEXITCODE -ne 0) {
        throw "sdkmanager failed with exit code $LASTEXITCODE. Accept required licenses, then rerun this script."
    }
}

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "ANDROID_SDK_ROOT=$env:ANDROID_SDK_ROOT"
& $sdkManager --version
if (Test-Path (Join-Path $SdkRoot 'platform-tools\adb.exe')) {
    & (Join-Path $SdkRoot 'platform-tools\adb.exe') version
}
