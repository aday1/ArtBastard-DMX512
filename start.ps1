param(
    [switch]$Clear,
    [switch]$Help
)

if ($Help) {
    Write-Host "ArtBastard DMX512 - Ultra-Quick Startup Script" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1           # ULTRA-QUICK startup (recommended)" -ForegroundColor Green
    Write-Host "  .\start.ps1 -Clear   # Clean startup (removes all cached files)" -ForegroundColor Red
    Write-Host "  .\start.ps1 -Help    # Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor Yellow
    Write-Host "  Normal (default): Lightning fast startup, preserves all cached files" -ForegroundColor Green
    Write-Host "  -Clear:           Complete cleanup and fresh install (slower)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Speed Comparison:" -ForegroundColor Yellow
    Write-Host "  Normal startup:    ~5-10 seconds" -ForegroundColor Green
    Write-Host "  Clean startup:     ~30-60 seconds" -ForegroundColor Red
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1          # Ultra-quick startup (use this daily)" -ForegroundColor Green
    Write-Host "  .\start.ps1 -Clear   # When you have issues or want fresh start" -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host "ArtBastard DMX512 - ULTRA-QUICK LAUNCHER" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
if ($Clear) {
    Write-Host "CLEAN MODE: Complete cleanup and fresh build" -ForegroundColor Red
    Write-Host "Will remove all cached files and dependencies" -ForegroundColor Red
} else {
    Write-Host "ULTRA-QUICK MODE: Lightning fast startup" -ForegroundColor Green
    Write-Host "Preserving all cached files and dependencies" -ForegroundColor Green
}
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# ULTRA-QUICK PATH: Skip most checks and go straight to startup
if (-not $Clear) {
    Write-Host "🚀 ULTRA-QUICK STARTUP MODE" -ForegroundColor Green
    Write-Host "Skipping validation and dependency checks for maximum speed..." -ForegroundColor Yellow
    Write-Host ""
    
    # Only kill existing processes (minimal cleanup)
    try {
        Write-Host "Quick process cleanup..." -ForegroundColor Cyan
        $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcs) {
            Write-Host "  Terminating $($nodeProcs.Count) Node.js processes..." -ForegroundColor Yellow
            $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        
        $artProcs = Get-Process -Name "ArtBastard*" -ErrorAction SilentlyContinue
        if ($artProcs) {
            Write-Host "  Terminating $($artProcs.Count) ArtBastard processes..." -ForegroundColor Yellow
            $artProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Process cleanup completed!" -ForegroundColor Green
    } catch {
        Write-Host "Process cleanup completed (clean slate)" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Check if dist directory exists, if not do minimal build
    if (-not (Test-Path "dist")) {
        Write-Host "dist/ directory missing - doing minimal build..." -ForegroundColor Yellow
        try {
            npm run build-backend
            Write-Host "Minimal build completed!" -ForegroundColor Green
        } catch {
            Write-Host "Build failed, but continuing..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "dist/ directory exists - skipping build!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Starting ArtBastard DMX512 server..." -ForegroundColor Green
    
    # Start the server directly
    try {
        npm start
    } catch {
        Write-Host "Server startup failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Try running with -Clear flag for a fresh start" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "ArtBastard DMX512 session ended." -ForegroundColor Cyan
    exit 0
}

# FULL CLEANUP PATH: Only executed when -Clear is specified
Write-Host "🧹 CLEAN MODE: Full cleanup and rebuild" -ForegroundColor Red
Write-Host "This will take longer but ensures a completely fresh start" -ForegroundColor Yellow
Write-Host ""

$totalSteps = 7
$currentStep = 0

function Show-Progress {
    param(
        [string]$Message,
        [int]$Step,
        [string]$Color = "Cyan"
    )
    $percentage = [math]::Round(($Step / $totalSteps) * 100)
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    $estimatedTotal = if ($Step -gt 0) { [math]::Round(($elapsed / $Step) * $totalSteps, 1) } else { "?" }
    $remaining = if ($estimatedTotal -ne "?") { [math]::Round($estimatedTotal - $elapsed, 1) } else { "?" }
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host "PROGRESS: $percentage% | Elapsed: ${elapsed}s | ETA: ${remaining}s" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host $Message -ForegroundColor $Color
    Write-Host ""
}

Show-Progress "Clean Start Time: $(Get-Date -Format 'HH:mm:ss.fff')" 0 "Yellow"

# Step 1: LIGHTNING PROCESS CLEANUP
$currentStep = 1
Show-Progress "STEP 1/7: LIGHTNING PROCESS EXTERMINATION" $currentStep "Red"
$processStart = Get-Date

try {
    # INSTANT Node.js process termination
    Write-Host "  Scanning for Node.js processes..." -ForegroundColor Red
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcs) {
        Write-Host "  TERMINATING $($nodeProcs.Count) Node.js processes..." -ForegroundColor Yellow
        $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  All Node.js processes ELIMINATED" -ForegroundColor Green
    } else {
        Write-Host "  No Node.js processes found" -ForegroundColor Green
    }

    # INSTANT port 3030 cleanup
    Write-Host "  Checking port 3030 conflicts..." -ForegroundColor Red
    $connections = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "  NUKING port 3030 conflicts..." -ForegroundColor Yellow
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            Write-Host "    Eliminating PID: $pid" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  Port 3030 CLEARED" -ForegroundColor Green
    } else {
        Write-Host "  Port 3030 already free" -ForegroundColor Green
    }

    # INSTANT ArtBastard cleanup
    Write-Host "  Hunting ArtBastard-related processes..." -ForegroundColor Red
    $artProcs = Get-Process | Where-Object { $_.ProcessName -like "*dmx*" -or $_.ProcessName -like "*artbastard*" }
    if ($artProcs) {
        Write-Host "  DESTROYING $($artProcs.Count) ArtBastard processes..." -ForegroundColor Yellow
        $artProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  ArtBastard processes ANNIHILATED" -ForegroundColor Green
    } else {
        Write-Host "  No ArtBastard processes found" -ForegroundColor Green
    }
    
    $processTime = [math]::Round((Get-Date - $processStart).TotalMilliseconds)
    Write-Host "  Process cleanup completed in ${processTime}ms" -ForegroundColor Cyan
} catch {
    Write-Host "  Process cleanup completed (clean slate)" -ForegroundColor Green
}

Write-Host ""

# Step 2: NUCLEAR FILE SYSTEM ANNIHILATION (only if -Clear specified)
if ($Clear) {
    $currentStep = 2
    Show-Progress "STEP 2/6: NUCLEAR FILE SYSTEM ANNIHILATION" $currentStep "Red"
    $cleanupStart = Get-Date

# INSTANT build directory elimination (no size checks!)
Write-Host "  ELIMINATING build directories..." -ForegroundColor Red
$buildDirs = @("dist", "react-app/dist", "react-app/dist-tsc", "build", ".next", "out")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing: $dir" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Remove node_modules for complete rebuild
Write-Host "Removing node_modules for fresh install..." -ForegroundColor Red
if (Test-Path "node_modules") {
    Write-Host "  Removing: node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/node_modules") {
    Write-Host "  Removing: react-app/node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "react-app/node_modules" -ErrorAction SilentlyContinue
}

# Clear ALL npm/yarn caches
Write-Host "Clearing ALL npm caches..." -ForegroundColor Yellow
npm cache clean --force 2>$null
npm cache verify 2>$null

# Clear npm temporary files
$npmTemp = "$env:APPDATA/npm-cache"
if (Test-Path $npmTemp) {
    Remove-Item -Recurse -Force $npmTemp -ErrorAction SilentlyContinue
}

# Clear any TypeScript build cache
if (Test-Path ".tsbuildinfo") {
    Remove-Item ".tsbuildinfo" -Force -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/.tsbuildinfo") {
    Remove-Item "react-app/.tsbuildinfo" -Force -ErrorAction SilentlyContinue
}

# Clear any Vite cache
if (Test-Path "react-app/.vite") {
    Remove-Item -Recurse -Force "react-app/.vite" -ErrorAction SilentlyContinue
}

# Clear Electron cache and build artifacts
Write-Host "Clearing Electron cache and build artifacts..." -ForegroundColor Yellow
if (Test-Path "electron/node_modules") {
    Write-Host "  Removing: electron/node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "electron/node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "electron/electron-dist") {
    Write-Host "  Removing: electron/electron-dist" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "electron/electron-dist" -ErrorAction SilentlyContinue
}
if (Test-Path "electron/dist") {
    Write-Host "  Removing: electron/dist" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "electron/dist" -ErrorAction SilentlyContinue
}

Write-Host "Nuclear cleanup completed!" -ForegroundColor Green
Write-Host ""

} else {
    # Skip cleanup when -Clear is not specified
    Write-Host "Skipping cleanup - preserving existing files and dependencies" -ForegroundColor Green
    Write-Host "Use -Clear flag to remove cached files and dependencies" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: DEPENDENCY VALIDATION AND INSTALLATION
$currentStep = 3
Show-Progress "STEP 3/6: DEPENDENCY VALIDATION AND INSTALLATION" $currentStep "Green"

# Pre-installation validation
Write-Host "Validating system requirements..." -ForegroundColor Cyan
$validationErrors = @()

# Check network connectivity - Prefer offline mode when possible
Write-Host "Checking network connectivity..." -ForegroundColor Cyan
try {
    $testConnection = Test-NetConnection -ComputerName "registry.npmjs.org" -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($testConnection) {
        Write-Host "  Network: Online (npm registry reachable)" -ForegroundColor Green
        Write-Host "  Preferring offline mode for faster startup..." -ForegroundColor Cyan
        $global:isOnline = $false  # Prefer offline even when online
    } else {
        Write-Host "  Network: Offline (npm registry unreachable)" -ForegroundColor Yellow
        $global:isOnline = $false
        Write-Host "  Using offline installation mode..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Network: Unknown status (preferring offline mode)" -ForegroundColor Yellow
    $global:isOnline = $false
}

# Check Node.js version
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $versionNumber = [version]($nodeVersion -replace 'v', '')
        if ($versionNumber -lt [version]"18.0.0") {
            $validationErrors += "Node.js version $nodeVersion is too old. Please upgrade to v18.0.0 or higher."
        } else {
            Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
        }
    } else {
        $validationErrors += "Node.js not found. Please install Node.js from https://nodejs.org/"
    }
} catch {
    $validationErrors += "Failed to check Node.js version: $($_.Exception.Message)"
}

# Check npm version
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  npm: v$npmVersion" -ForegroundColor Green
    } else {
        $validationErrors += "npm not found. Please reinstall Node.js."
    }
} catch {
    $validationErrors += "Failed to check npm version: $($_.Exception.Message)"
}

# Check available disk space
try {
    $drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
    if ($freeSpaceGB -lt 2) {
        $validationErrors += "Insufficient disk space. At least 2GB free space required. Current: ${freeSpaceGB}GB"
    } else {
        Write-Host "  Disk space: ${freeSpaceGB}GB available" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not check disk space" -ForegroundColor Yellow
}

# Report validation results
if ($validationErrors.Count -gt 0) {
    Write-Host "VALIDATION FAILED:" -ForegroundColor Red
    foreach ($error in $validationErrors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please fix the above issues and run the script again." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "All system requirements validated!" -ForegroundColor Green
}
Write-Host ""

# Check if dependencies need to be installed
$needsRootInstall = -not (Test-Path "node_modules")
$needsFrontendInstall = -not (Test-Path "react-app/node_modules")
$needsElectronInstall = -not (Test-Path "electron/node_modules")

if ($needsRootInstall -or $needsFrontendInstall -or $needsElectronInstall -or $Clear) {
    Write-Host "Installing root dependencies..." -ForegroundColor Cyan
    try {
        # Always prefer offline mode for faster startup
        Write-Host "  Using offline mode for faster startup..." -ForegroundColor Cyan
        npm install --prefer-offline --no-optional --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Offline installation failed, trying with cached packages..." -ForegroundColor Yellow
            npm install --prefer-offline --no-optional --no-audit --no-fund --no-cache
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Cached packages failed, trying online as fallback..." -ForegroundColor Yellow
                npm install --no-cache --prefer-offline=false
                if ($LASTEXITCODE -ne 0) {
                    throw "All npm install attempts failed with exit code $LASTEXITCODE"
                }
            }
        }
        Write-Host "Root dependencies installed!" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: Root dependency installation failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Network troubleshooting steps:" -ForegroundColor Cyan
        Write-Host "   1. Check your internet connection" -ForegroundColor White
        Write-Host "   2. Try running: npm cache clean --force" -ForegroundColor White
        Write-Host "   3. Try running: npm config set registry https://registry.npmjs.org/" -ForegroundColor White
        Write-Host "   4. If behind corporate firewall, configure npm proxy settings" -ForegroundColor White
        Write-Host "   5. Try running: npm install --prefer-offline --no-optional" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "Root dependencies already installed - skipping installation" -ForegroundColor Green
}

if ($needsFrontendInstall -or $Clear) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    try {
        Push-Location react-app
        # Always prefer offline mode for faster startup
        Write-Host "  Using offline mode for faster startup..." -ForegroundColor Cyan
        npm install --prefer-offline --no-optional --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Offline installation failed, trying with cached packages..." -ForegroundColor Yellow
            npm install --prefer-offline --no-optional --no-audit --no-fund --no-cache
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Cached packages failed, trying online as fallback..." -ForegroundColor Yellow
                npm install --no-cache --prefer-offline=false
                if ($LASTEXITCODE -ne 0) {
                    throw "All npm install attempts failed with exit code $LASTEXITCODE"
                }
            }
        }
        Pop-Location
        Write-Host "Frontend dependencies installed!" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: Frontend dependency installation failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Pop-Location
        Write-Host "Network troubleshooting steps:" -ForegroundColor Cyan
        Write-Host "   1. Check your internet connection" -ForegroundColor White
        Write-Host "   2. Try running: cd react-app && npm cache clean --force" -ForegroundColor White
        Write-Host "   3. Try running: cd react-app && npm install --prefer-offline --no-optional" -ForegroundColor White
        Write-Host "   4. If behind corporate firewall, configure npm proxy settings" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "Frontend dependencies already installed - skipping installation" -ForegroundColor Green
}

if ($needsElectronInstall -or $Clear) {
    Write-Host "Installing Electron dependencies..." -ForegroundColor Cyan
    try {
        Push-Location electron
        # Always prefer offline mode for faster startup
        Write-Host "  Using offline mode for faster startup..." -ForegroundColor Cyan
        npm install --prefer-offline --no-optional --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Offline installation failed, trying with cached packages..." -ForegroundColor Yellow
            npm install --prefer-offline --no-optional --no-audit --no-fund --no-cache
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Cached packages failed, trying online as fallback..." -ForegroundColor Yellow
                npm install --no-cache --prefer-offline=false
                if ($LASTEXITCODE -ne 0) {
                    throw "All npm install attempts failed with exit code $LASTEXITCODE"
                }
            }
        }
        Pop-Location
        Write-Host "Electron dependencies installed!" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: Electron dependency installation failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Pop-Location
        Write-Host "Network troubleshooting steps:" -ForegroundColor Cyan
        Write-Host "   1. Check your internet connection" -ForegroundColor White
        Write-Host "   2. Try running: cd electron && npm cache clean --force" -ForegroundColor White
        Write-Host "   3. Try running: cd electron && npm install --prefer-offline --no-optional" -ForegroundColor White
        Write-Host "   4. If behind corporate firewall, configure npm proxy settings" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "Electron dependencies already installed - skipping installation" -ForegroundColor Green
}
Write-Host ""

# Step 4: FORCE BUILD EVERYTHING
$currentStep = 4
Show-Progress "STEP 4/7: FORCE BUILD EVERYTHING" $currentStep "Green"

Write-Host "Building backend (OPTIMIZED)..." -ForegroundColor Cyan
try {
    # Use fast build if available, fallback to regular build
    if (Test-Path "build-backend-fast.js") {
        Write-Host "  Using fast build mode..." -ForegroundColor Yellow
        npm run build-backend-fast
    } else {
        Write-Host "  Using standard build mode..." -ForegroundColor Yellow
        npm run build-backend
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed with exit code $LASTEXITCODE"
    }
    Write-Host "Backend build completed!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Backend build failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Check TypeScript errors in src/ directory" -ForegroundColor Cyan
    exit 1
}

Write-Host "Building frontend (OPTIMIZED)..." -ForegroundColor Cyan
try {
    Push-Location react-app
    Write-Host "  Using standard build mode..." -ForegroundColor Yellow
    npm run build:vite
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed with exit code $LASTEXITCODE"
    }
    Pop-Location
    Write-Host "Frontend build completed!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Frontend build failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Pop-Location
    Write-Host "Check TypeScript errors in react-app/src/ directory" -ForegroundColor Cyan
    exit 1
}

Write-Host "Building Electron app (DEVELOPMENT MODE)..." -ForegroundColor Cyan
try {
    Push-Location electron
    Write-Host "  Skipping Electron build - will run in development mode..." -ForegroundColor Yellow
    Write-Host "  Electron will use the React dev server at http://localhost:3001" -ForegroundColor Yellow
    Pop-Location
    Write-Host "Electron ready for development mode!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Electron setup failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Pop-Location
    Write-Host "Check Electron configuration in electron/ directory" -ForegroundColor Cyan
    exit 1
}
Write-Host ""

# Step 5: VERIFICATION
$currentStep = 5
Show-Progress "STEP 5/7: BUILD VERIFICATION" $currentStep "Green"

$buildSuccess = $true
if (-not (Test-Path "dist")) {
    Write-Host "Backend dist directory missing!" -ForegroundColor Red
    $buildSuccess = $false
}
if (-not (Test-Path "react-app/dist")) {
    Write-Host "Frontend dist directory missing!" -ForegroundColor Red
    $buildSuccess = $false
}
if (-not (Test-Path "electron/node_modules")) {
    Write-Host "Electron dependencies missing!" -ForegroundColor Red
    $buildSuccess = $false
}

if ($buildSuccess) {
    Write-Host "Build verification PASSED!" -ForegroundColor Green
    Write-Host "All components built successfully!" -ForegroundColor Green
    Write-Host "Electron app ready for development mode with native MIDI support!" -ForegroundColor Magenta
} else {
    Write-Host "Build verification FAILED!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: LAUNCH ELECTRON APP
$currentStep = 6
Show-Progress "STEP 6/7: LAUNCHING ELECTRON DESKTOP APP" $currentStep "Magenta"
Write-Host "Starting ArtBastard DMX512 Electron app with NATIVE MIDI..." -ForegroundColor Magenta

# Launch Electron app using Start-Process instead of job
Write-Host "Launching Electron app with Start-Process..." -ForegroundColor Magenta

# Wait for server to be ready first
$maxAttempts = 30
$attempt = 0
$url = "http://localhost:3030"

Write-Host "Waiting for server to be ready before launching Electron..." -ForegroundColor Cyan

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Server is ready! Launching Electron app..." -ForegroundColor Green
            break
        }
    } catch {
        # Server not ready yet
        if ($attempt % 5 -eq 0) {
            Write-Host "  Still waiting for server... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Seconds 1
    $attempt++
}

if ($attempt -eq $maxAttempts) {
    Write-Host "Server timeout - launching Electron anyway..." -ForegroundColor Yellow
}

# Launch Electron using Start-Process
try {
    Write-Host "Starting Electron process..." -ForegroundColor Cyan
    $electronProcess = Start-Process -FilePath "npm" -ArgumentList "run", "electron" -WorkingDirectory "electron" -PassThru
    Write-Host "Electron process started with PID: $($electronProcess.Id)" -ForegroundColor Green
} catch {
    Write-Host "Error launching Electron: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Electron app launched with native MIDI support!" -ForegroundColor Green
Write-Host "MIDI Learn should now work reliably with native MIDI access!" -ForegroundColor Cyan
Write-Host ""

# Step 7: LAUNCH THE CLEAN ARTBASTARD WEB SERVER
$currentStep = 7
Show-Progress "STEP 7/7: LAUNCHING CLEAN ARTBASTARD DMX512 WEB SERVER" $currentStep "Green"
Write-Host "Starting ArtBastard DMX512 web server..." -ForegroundColor Green

# Enhanced browser auto-open with better monitoring
$browserJob = Start-Job -ScriptBlock {
    $maxAttempts = 45  # Increased wait time for clean builds
    $attempt = 0
    $url = "http://localhost:3030"
    
    Write-Host "Waiting for server to be ready..." -ForegroundColor Cyan
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                # Server is ready, open browser
                Start-Process $url
                Write-Host "SUCCESS! Browser opened to $url" -ForegroundColor Green
                Write-Host "ArtBastard DMX512 is ready with all latest features!" -ForegroundColor Green
                break
            }
        } catch {
            # Server not ready yet, show progress
            if ($attempt % 5 -eq 0) {
                Write-Host "  Still waiting... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 1
        $attempt++
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "Timeout: Server took longer than expected to start" -ForegroundColor Yellow
        Write-Host "   You can manually visit: http://localhost:3030" -ForegroundColor White
        Write-Host "   The server may still be starting up..." -ForegroundColor White
    }
}

Write-Host ""
$totalTime = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
Write-Host "CLEAN BUILD COMPLETE!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Total Build Time: ${totalTime}s" -ForegroundColor Yellow
Write-Host "You now have the latest and greatest ArtBastard DMX512!" -ForegroundColor White
Write-Host "ELECTRON APP: Native MIDI support with reliable MIDI Learn!" -ForegroundColor Magenta
Write-Host "WEB SERVER: All MIDI Learn, OSC, and lighting controls are fresh!" -ForegroundColor White
Write-Host "Starting both Electron app AND web server..." -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Start the server with enhanced monitoring
try {
    Write-Host "Starting ArtBastard DMX512 server..." -ForegroundColor Green
    npm start
} catch {
    Write-Host "Server startup failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Troubleshooting steps:" -ForegroundColor Cyan
    Write-Host "   1. Check if port 3030 is already in use" -ForegroundColor White
    Write-Host "   2. Verify Node.js and npm are properly installed" -ForegroundColor White
    Write-Host "   3. Try running: npm run build-backend && node dist/server.js" -ForegroundColor White
    Write-Host "   4. Check logs in logs/app.log for detailed error information" -ForegroundColor White
} finally {
    # Clean up the browser job when script ends
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "ArtBastard DMX512 session ended." -ForegroundColor Cyan
Write-Host "   Thanks for using the cleanest lighting control system!" -ForegroundColor White
Write-Host "   Both Electron app and web server have been launched!" -ForegroundColor Magenta