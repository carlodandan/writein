param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

# Strip leading 'v' if provided (e.g. v1.0.0 -> 1.0.0)
$Version = $Version.Trim().TrimStart('v')

# Validate SemVer format
if ($Version -notmatch '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*))(?:\.(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*)))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$') {
    Write-Error "Invalid version format: '$Version'. Must be valid SemVer (e.g. 1.0.0 or 1.0.0-beta.1)."
    exit 1
}

$Root = Split-Path -Parent $PSScriptRoot

$PackageJson = Join-Path $Root "package.json"
$CargoToml   = Join-Path $Root "src-tauri\Cargo.toml"
$TauriConfig = Join-Path $Root "src-tauri\tauri.conf.json"

# UTF-8 without BOM
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

Write-Host ""
Write-Host "Updating version to $Version..." -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# package.json
# --------------------------------------------------

$packageContent = Read-Utf8 $PackageJson

$packageContent = $packageContent -replace `
    '"version"\s*:\s*"[^"]+"', `
    "`"version`": `"$Version`""

Write-Utf8NoBom $PackageJson $packageContent

Write-Host "  [OK] package.json"

# --------------------------------------------------
# Cargo.toml
# --------------------------------------------------

$cargoContent = Read-Utf8 $CargoToml

$cargoContent = $cargoContent -replace `
    '(?m)^version\s*=\s*"[^"]+"', `
    "version = `"$Version`""

Write-Utf8NoBom $CargoToml $cargoContent

Write-Host "  [OK] Cargo.toml"

# --------------------------------------------------
# tauri.conf.json
# --------------------------------------------------

$tauriContent = Read-Utf8 $TauriConfig

$tauriContent = $tauriContent -replace `
    '"version"\s*:\s*"[^"]+"', `
    "`"version`": `"$Version`""

Write-Utf8NoBom $TauriConfig $tauriContent

Write-Host "  [OK] tauri.conf.json"

# --------------------------------------------------
# splashscreen.html
# --------------------------------------------------

$SplashHtml = Join-Path $Root "splashscreen.html"
if (Test-Path $SplashHtml) {
    $splashContent = Read-Utf8 $SplashHtml
    $splashContent = $splashContent -replace 'v\d+\.\d+\.\d+[^<\s]*\s*&bull;', "v$Version &bull;"
    Write-Utf8NoBom $SplashHtml $splashContent
    Write-Host "  [OK] splashscreen.html"
}

# --------------------------------------------------
# src/utils/appVersion.ts
# --------------------------------------------------

$AppVersionTs = Join-Path $Root "src\utils\appVersion.ts"
if (Test-Path $AppVersionTs) {
    $tsContent = Read-Utf8 $AppVersionTs
    $tsContent = $tsContent -replace "cachedVersion = 'v[^']+';", "cachedVersion = 'v$Version';"
    $tsContent = $tsContent -replace "fallback: string = 'v[^']+'", "fallback: string = 'v$Version'"
    Write-Utf8NoBom $AppVersionTs $tsContent
    Write-Host "  [OK] src/utils/appVersion.ts"
}

# --------------------------------------------------
# website/package.json
# --------------------------------------------------

$WebPackageJson = Join-Path $Root "website\package.json"
if (Test-Path $WebPackageJson) {
    $webPkgContent = Read-Utf8 $WebPackageJson
    $webPkgContent = $webPkgContent -replace '"version"\s*:\s*"[^"]+"', "`"version`": `"$Version`""
    Write-Utf8NoBom $WebPackageJson $webPkgContent
    Write-Host "  [OK] website/package.json"
}

# --------------------------------------------------
# website/src/components/DownloadSection.tsx
# --------------------------------------------------

$WebDownloadSection = Join-Path $Root "website\src\components\DownloadSection.tsx"
if (Test-Path $WebDownloadSection) {
    $downloadContent = Read-Utf8 $WebDownloadSection
    $downloadContent = $downloadContent -replace '(/releases/download/)v[^/]+/', "`$1v$Version/"
    $downloadContent = $downloadContent -replace 'write-in_\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?_', "write-in_${Version}_"
    Write-Utf8NoBom $WebDownloadSection $downloadContent
    Write-Host "  [OK] website/src/components/DownloadSection.tsx (download links)"
}

# --------------------------------------------------
# website/src/components/Navbar.tsx
# --------------------------------------------------

$WebNavbar = Join-Path $Root "website\src\components\Navbar.tsx"
if (Test-Path $WebNavbar) {
    $navbarContent = Read-Utf8 $WebNavbar
    $navbarContent = $navbarContent -replace 'v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', "v$Version"
    Write-Utf8NoBom $WebNavbar $navbarContent
    Write-Host "  [OK] website/src/components/Navbar.tsx"
}

# --------------------------------------------------
# website/src/components/Footer.tsx
# --------------------------------------------------

$WebFooter = Join-Path $Root "website\src\components\Footer.tsx"
if (Test-Path $WebFooter) {
    $footerContent = Read-Utf8 $WebFooter
    $footerContent = $footerContent -replace 'Version\s+\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', "Version $Version"
    Write-Utf8NoBom $WebFooter $footerContent
    Write-Host "  [OK] website/src/components/Footer.tsx"
}

# --------------------------------------------------
# website/src/components/Hero.tsx
# --------------------------------------------------

$WebHero = Join-Path $Root "website\src\components\Hero.tsx"
if (Test-Path $WebHero) {
    $heroContent = Read-Utf8 $WebHero
    $MajorMinor = if ($Version -match '^(\d+\.\d+)') { $Matches[1] } else { $Version }
    $heroContent = $heroContent -replace 'WriteIn\s+v\d+(?:\.\d+)*\s+Released', "WriteIn v$MajorMinor Released"
    $heroContent = $heroContent -replace '\(v\d+(?:\.\d+)*\s*•', "(v$MajorMinor •"
    Write-Utf8NoBom $WebHero $heroContent
    Write-Host "  [OK] website/src/components/Hero.tsx"
}

Write-Host ""
Write-Host "Version successfully changed to $Version" -ForegroundColor Green
Write-Host ""
