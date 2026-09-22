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

Write-Host ""
Write-Host "Version successfully changed to $Version" -ForegroundColor Green
Write-Host ""
