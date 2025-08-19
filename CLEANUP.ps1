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

# Act 0: Exterminate any lingering processes
Write-Host ""
Write-Host "💀 Act 0: Exorcising Lingering Spirits (Running Processes)! 💀" -ForegroundColor Red
Write-Host "(Ensuring no processes interfere with our grand cleanup)" -ForegroundColor DarkRed

# Function to kill processes by port
function Stop-ProcessByPort {
    param (
        [int]$Port,
        [string]$Description
    )
    
    try {
        $ProcessInfo = netstat -ano | Select-String ":$Port\s" | Where-Object { $_ -match "LISTENING" }
        if ($ProcessInfo) {
            $ProcessInfo | ForEach-Object {
                $Line = $_.ToString().Trim()
                $ProcessId = ($Line -split '\s+')[-1]
                if ($ProcessId -and $ProcessId -match '^\d+$') {
                    Write-Host "🔪 Terminating $Description process on port $Port (PID: $ProcessId)..." -ForegroundColor DarkRed
                    try {
                        taskkill /F /PID $ProcessId 2>$null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "✅ Successfully terminated PID $ProcessId" -ForegroundColor Green
                        } else {
                            Write-Warning "Failed to terminate PID $ProcessId (exit code: $LASTEXITCODE)"
                        }
                    } catch {
                        Write-Warning "Could not terminate PID $ProcessId`: $($_.Exception.Message)"
                    }
                }
            }
        } else {
            Write-Host "$Description (port $Port): No running processes found ✨" -ForegroundColor Gray
        }
    } catch {
        Write-Warning "Error checking port $Port`: $($_.Exception.Message)"
    }
}

# Function to kill processes by name pattern
function Stop-ProcessByName {
    param (
        [string]$ProcessName,
        [string]$Description
    )
    
    try {
        $Processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($Processes) {
            $Processes | ForEach-Object {
                Write-Host "🔪 Terminating $Description process: $($_.ProcessName) (PID: $($_.Id))..." -ForegroundColor DarkRed
                try {
                    Stop-Process -Id $_.Id -Force -ErrorAction Stop
                    Write-Host "✅ Successfully terminated $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Green
                } catch {
                    Write-Warning "Could not terminate $($_.ProcessName) (PID: $($_.Id)): $($_.Exception.Message)"
                }
            }
        } else {
            Write-Host "$Description processes: None found ✨" -ForegroundColor Gray
        }
    } catch {
        Write-Warning "Error checking for $ProcessName processes: $($_.Exception.Message)"
    }
}

# Kill backend server (typically on port 3030)
Stop-ProcessByPort -Port 3030 -Description "Backend server"

# Kill frontend dev server (typically on port 3001)
Stop-ProcessByPort -Port 3001 -Description "Frontend dev server"

# Kill any node processes that might be related to this project
Write-Host "🔍 Checking for node processes that might be related to ArtBastard..." -ForegroundColor DarkCyan
try {
    $NodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        try {
            $CommandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
            $CommandLine -match "start-server|vite|dmx|artbastard" -or
            $CommandLine -match [regex]::Escape($ProjectRootPath)
        } catch {
            $false
        }
    }
    
    if ($NodeProcesses) {
        $NodeProcesses | ForEach-Object {
            Write-Host "🔪 Terminating project-related node process (PID: $($_.Id))..." -ForegroundColor DarkRed
            try {
                Stop-Process -Id $_.Id -Force -ErrorAction Stop
                Write-Host "✅ Successfully terminated node process (PID: $($_.Id))" -ForegroundColor Green
            } catch {
                Write-Warning "Could not terminate node process (PID: $($_.Id)): $($_.Exception.Message)"
            }
        }
    } else {
        Write-Host "Project-related node processes: None found ✨" -ForegroundColor Gray
    }
} catch {
    Write-Warning "Error checking for node processes: $($_.Exception.Message)"
}

Write-Host ""

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

# Clean compiled JavaScript files from react-app/src (force rebuild from TypeScript)
Write-Host "Cleaning compiled JavaScript files to force TypeScript rebuild..." -ForegroundColor DarkCyan
$ReactAppSrcDir = "react-app\src"
if (Test-Path $ReactAppSrcDir) {
    Get-ChildItem -Path $ReactAppSrcDir -Recurse -Filter "*.js" | Where-Object {
        # Only remove .js files that have corresponding .tsx or .ts files
        $TsFile = $_.FullName -replace '\.js$', '.ts'
        $TsxFile = $_.FullName -replace '\.js$', '.tsx'
        (Test-Path $TsFile) -or (Test-Path $TsxFile)
    } | ForEach-Object {
        Remove-ItemWithFlair -ItemPath $_.FullName -Description "compiled JS file"
    }
}

# Clean any browser cache hints
$BrowserCacheHints = @(
    "react-app\.next",
    "react-app\.cache",
    "react-app\build",
    ".cache"
)
foreach ($CacheDir in $BrowserCacheHints) {
    Remove-ItemWithFlair -ItemPath $CacheDir -Description "browser/build cache"
}

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

# Clear Vite build hashes and manifests
Write-Host "Clearing Vite build artifacts and hashes... 🔥" -ForegroundColor DarkCyan
$ViteBuildArtifacts = @(
    "react-app\dist\.vite",
    "react-app\dist\vite.svg",
    "react-app\dist\.htaccess",
    "react-app\.env.local"  # Added cleanup for our build environment files
)
foreach ($Artifact in $ViteBuildArtifacts) {
    Remove-ItemWithFlair -ItemPath $Artifact -Description "Vite build artifact"
}

# Remove all files in dist directory that contain hash patterns (like index-9afa16fd.js)
$ReactDistDir = "react-app\dist"
if (Test-Path $ReactDistDir) {
    Write-Host "Removing hashed build files from $ReactDistDir..." -ForegroundColor DarkCyan
    Get-ChildItem -Path $ReactDistDir -Recurse -File | Where-Object {
        $_.Name -match '-[a-f0-9]{8,}\.(js|css|woff|woff2|svg|png|jpg|jpeg|gif)$'
    } | ForEach-Object {
        Remove-ItemWithFlair -ItemPath $_.FullName -Description "hashed build file"
    }
}

# Clean up cross-platform build setup files
Write-Host "Cleaning cross-platform build setup files... 🔧" -ForegroundColor DarkCyan
$BuildSetupFiles = @(
    "react-app\setup-build.js",
    "react-app\.env.local",
    "react-app\build-windows.bat"
)
foreach ($SetupFile in $BuildSetupFiles) {
    if (Test-Path $SetupFile) {
        Write-Host "Note: Keeping $SetupFile for cross-platform builds ✨" -ForegroundColor Gray
    }
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
