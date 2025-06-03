Write-Host "🧼✨ The ArtBastard's Grand Exfoliation Ritual! ✨🧼" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Ensuring a pristine stage for a flawless performance or a clean Git push!" -ForegroundColor Cyan
Write-Host ""

# Ensure we are at the project's magnificent proscenium (root)
$ProjectRootPath = $PSScriptRoot
if (-not $ProjectRootPath) {
    $ProjectRootPath = (Get-Location).Path
}
Set-Location $ProjectRootPath
Write-Host "📍 Conducting cleanup from: $($ProjectRootPath)" -ForegroundColor Yellow

if (-not (Test-Path -Path "package.json" -PathType Leaf) -or -not (Test-Path -Path "react-app" -PathType Container)) {
    Write-Error "🛑 Hold the curtain! This ritual must be performed from the ArtBastard_DMX project's main stage!"
    Write-Error "Ensure 'package.json' and the 'react-app' directory are present: $ProjectRootPath"
    Exit 1
}
Write-Host ""

Write-Host "🧹 Act I: Sweeping Away All Traces of Past Performances! 🧹" -ForegroundColor Green
Write-Host "(Builds, Logs, Caches, Node Modules, and Launcher Artifacts)" -ForegroundColor DarkCyan

# Define the paths to artistic remnants
$BackendDistDir = "dist"
$FrontendDistDir = "react-app\dist"
$LauncherDistDir = "launcher-dist"
$LogsDir = "logs"
$BackendLogFile = "backend.log" # Specific log file if it exists outside /logs
$ViteCacheDir = "react-app\.vite"
$RootTsBuildInfoPattern = "*.tsbuildinfo" # Glob pattern for root
$ReactAppTsBuildInfoPattern = "*.tsbuildinfo" # Glob pattern for react-app, will be joined with path
$RootEslintCache = ".eslintcache"
$ReactAppEslintCache = "react-app\.eslintcache"
$RootNodeModules = "node_modules"
$ReactAppNodeModules = "react-app\node_modules"
$LauncherNodeModules = "launcher\node_modules" # Assuming launcher might have its own
$RootPackageLock = "package-lock.json"
$ReactAppPackageLock = "react-app\package-lock.json"
$LauncherPackageLock = "launcher\package-lock.json"
$NpmCache = "$env:APPDATA\npm-cache" # Default npm cache location

# Function to remove item with flair
function Remove-ItemWithFlair {
    param (
        [string]$ItemPath,
        [string]$Description
    )
    if (Test-Path $ItemPath) {
        Write-Host "Removing ${Description}: $ItemPath 💨" -ForegroundColor DarkCyan
        try {
            Remove-Item -Recurse -Force $ItemPath -ErrorAction Stop
            Write-Host "Successfully removed $ItemPath" -ForegroundColor Green
        }
        catch {
            Write-Warning "Could not fully remove $ItemPath. It might be in use or permissions issue."
            Write-Warning "Error details: $($_.Exception.Message)"
        }
    } else {
        Write-Host "$Description not found (already clean!): $ItemPath ✨" -ForegroundColor Gray
    }
}

# Vanquishing build directories
Remove-ItemWithFlair -ItemPath $BackendDistDir -Description "backend build directory"
Remove-ItemWithFlair -ItemPath $FrontendDistDir -Description "frontend build directory"
Remove-ItemWithFlair -ItemPath $LauncherDistDir -Description "launcher build directory"

# Expunging logs
Remove-ItemWithFlair -ItemPath $LogsDir -Description "logs directory"
Remove-ItemWithFlair -ItemPath $BackendLogFile -Description "backend log file"

# Obliterating caches
Remove-ItemWithFlair -ItemPath $ViteCacheDir -Description "Vite cache"
Remove-ItemWithFlair -ItemPath $RootEslintCache -Description "root .eslintcache"
Remove-ItemWithFlair -ItemPath $ReactAppEslintCache -Description "react-app .eslintcache"

# Removing .tsbuildinfo files
Get-ChildItem -Path $ProjectRootPath -Filter $RootTsBuildInfoPattern | ForEach-Object {
    Remove-ItemWithFlair -ItemPath $_.FullName -Description "root tsbuildinfo file"
}
Get-ChildItem -Path (Join-Path $ProjectRootPath "react-app") -Filter $ReactAppTsBuildInfoPattern | ForEach-Object {
    Remove-ItemWithFlair -ItemPath $_.FullName -Description "react-app tsbuildinfo file"
}

# Banishing node_modules with extreme prejudice
Remove-ItemWithFlair -ItemPath $RootNodeModules -Description "root node_modules"
Remove-ItemWithFlair -ItemPath $ReactAppNodeModules -Description "react-app node_modules"
Remove-ItemWithFlair -ItemPath $LauncherNodeModules -Description "launcher node_modules"

Write-Host ""
Write-Host "🔥 Act II: Nuclear Option - Obliterating Package Locks & NPM Cache! 🔥" -ForegroundColor Red
Write-Host "(This will force complete dependency resolution on next install)" -ForegroundColor DarkRed

# Nuking package-lock.json files
Remove-ItemWithFlair -ItemPath $RootPackageLock -Description "root package-lock.json"
Remove-ItemWithFlair -ItemPath $ReactAppPackageLock -Description "react-app package-lock.json"
Remove-ItemWithFlair -ItemPath $LauncherPackageLock -Description "launcher package-lock.json"

# Clearing npm cache with nuclear force
Write-Host "Clearing NPM cache with --force flag... 💥" -ForegroundColor DarkRed
try {
    npm cache clean --force 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ NPM cache successfully nuked!" -ForegroundColor Green
    } else {
        Write-Warning "NPM cache clean returned exit code $LASTEXITCODE"
    }
} catch {
    Write-Warning "Could not clean npm cache: $($_.Exception.Message)"
}

# Additional cleanup for stubborn npm issues
Write-Host "Verifying NPM cache integrity... 🔍" -ForegroundColor DarkCyan
try {
    npm cache verify 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ NPM cache verified successfully!" -ForegroundColor Green
    } else {
        Write-Warning "NPM cache verify returned exit code $LASTEXITCODE"
    }
} catch {
    Write-Warning "Could not verify npm cache: $($_.Exception.Message)"
}

# Clear global npm cache if exists (alternative location)
$GlobalNpmCache = "$env:LOCALAPPDATA\npm-cache"
if (Test-Path $GlobalNpmCache) {
    Remove-ItemWithFlair -ItemPath $GlobalNpmCache -Description "global npm cache"
}

Write-Host ""
Write-Host "🌟✨ Bravo! The ArtBastard's stage is impeccably clean! ✨🌟" -ForegroundColor Magenta
Write-Host "Ready for a fresh installation or a pristine commit." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
