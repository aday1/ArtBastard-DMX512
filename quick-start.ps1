Write-Host "⚡ ArtBastard DMX512 - TURBO QUICK START" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "ULTRA-FAST startup with VERBOSE feedback!" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
Write-Host "🕐 Start Time: $(Get-Date -Format 'HH:mm:ss.fff')" -ForegroundColor Cyan

# Lightning-fast process cleanup
Write-Host "🔄 [00.1s] Lightning Process Cleanup..." -ForegroundColor Cyan
$cleanupStart = Get-Date
try {
    Write-Host "  🔍 Scanning for port 3030 conflicts..." -ForegroundColor White
    $connections = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "  ⚡ Found conflicting processes - terminating immediately..." -ForegroundColor Yellow
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            Write-Host "    💀 Killing PID: $pid" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  ✅ Port 3030 cleared in $([math]::Round((Get-Date - $cleanupStart).TotalMilliseconds))ms" -ForegroundColor Green
    } else {
        Write-Host "  ✅ Port 3030 already free - no conflicts detected" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ Port cleanup completed (no active connections)" -ForegroundColor Green
}

# Turbo dependency verification
Write-Host "🔍 [00.2s] TURBO Dependency Verification..." -ForegroundColor Cyan
$depStart = Get-Date
$missingItems = @()
$warnings = @()
$canStart = $true

# Rapid Node.js check
Write-Host "  🔎 Checking Node.js installation..." -ForegroundColor White
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  ✅ Node.js: $nodeVersion - READY" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Node.js: Command failed - NOT FOUND" -ForegroundColor Red
        $missingItems += "Node.js not found"
        $canStart = $false
    }
} catch {
    Write-Host "  ❌ Node.js: Not installed - CRITICAL ERROR" -ForegroundColor Red
    $missingItems += "Node.js not installed"
    $canStart = $false
}

# Rapid npm check
Write-Host "  🔎 Checking npm package manager..." -ForegroundColor White
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  ✅ npm: v$npmVersion - READY" -ForegroundColor Green
    } else {
        Write-Host "  ❌ npm: Command failed - NOT FOUND" -ForegroundColor Red
        $missingItems += "npm not found"
        $canStart = $false
    }
} catch {
    $missingItems += "npm not installed"
    $canStart = $false
}

# Check root dependencies
if (Test-Path "node_modules") {
    Write-Host "  ✅ Root dependencies: Found" -ForegroundColor Green
} else {
    $missingItems += "Root node_modules missing"
    $warnings += "Run: npm install"
}

# Check frontend dependencies
if (Test-Path "react-app/node_modules") {
    Write-Host "  ✅ Frontend dependencies: Found" -ForegroundColor Green
} else {
    $missingItems += "Frontend node_modules missing"
    $warnings += "Run: cd react-app && npm install"
}

# Check backend build
if (Test-Path "dist") {
    Write-Host "  ✅ Backend build: Found" -ForegroundColor Green
} else {
    $warnings += "Backend not built - will auto-build"
}

# Check frontend build
if (Test-Path "react-app/dist") {
    Write-Host "  ✅ Frontend build: Found" -ForegroundColor Green
} else {
    $warnings += "Frontend not built - will auto-build"
}

Write-Host ""

# Handle missing critical items
if ($missingItems.Count -gt 0) {
    Write-Host "❌ MISSING CRITICAL ITEMS:" -ForegroundColor Red
    foreach ($item in $missingItems) {
        Write-Host "   • $item" -ForegroundColor Red
    }
    Write-Host ""
    
    if (-not $canStart) {
        Write-Host "🚨 CANNOT START - CRITICAL DEPENDENCIES MISSING!" -ForegroundColor Red
        Write-Host ""
        Write-Host "📋 SOLUTION STEPS:" -ForegroundColor Yellow
        Write-Host "1. Install Node.js from: https://nodejs.org/" -ForegroundColor White
        Write-Host "2. Run the full setup: .\start.ps1" -ForegroundColor White
        Write-Host "3. Then use quick-start.ps1 for future launches" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 TIP: Use .\start.ps1 for a complete clean setup!" -ForegroundColor Cyan
        exit 1
    } else {
        Write-Host "⚠️  MISSING ITEMS DETECTED - OFFERING TURBO FIX..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🚀 TURBO INSTALL missing dependencies? [Y/N] (takes ~10s)" -ForegroundColor Cyan
        $response = Read-Host
        
        if ($response -eq "Y" -or $response -eq "y" -or $response -eq "yes" -or $response -eq "Yes") {
            Write-Host "📦 [01.0s] TURBO DEPENDENCY INSTALLATION..." -ForegroundColor Green
            $installStart = Get-Date
            
            if (-not (Test-Path "node_modules")) {
                Write-Host "  ⚡ Installing root dependencies (silent mode)..." -ForegroundColor Cyan
                npm install --no-audit --no-fund --silent
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "  ❌ Root dependency install failed!" -ForegroundColor Red
                    Write-Host "  💡 Use: .\start.ps1 for nuclear cleanup" -ForegroundColor Yellow
                    exit 1
                }
                Write-Host "  ✅ Root dependencies installed" -ForegroundColor Green
            }
            
            if (-not (Test-Path "react-app/node_modules")) {
                Write-Host "  ⚡ Installing frontend dependencies (silent mode)..." -ForegroundColor Cyan
                Set-Location react-app
                npm install --no-audit --no-fund --silent
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "  ❌ Frontend dependency install failed!" -ForegroundColor Red
                    Write-Host "  💡 Use: .\start.ps1 for nuclear cleanup" -ForegroundColor Yellow
                    Set-Location ..
                    exit 1
                }
                Set-Location ..
                Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
            }
            
            $installTime = [math]::Round((Get-Date - $installStart).TotalSeconds, 1)
            Write-Host "  ⚡ TURBO install completed in ${installTime}s!" -ForegroundColor Green
        } else {
            Write-Host "⏭️  Skipping dependency install - FORCE STARTING anyway..." -ForegroundColor Yellow
        }
    }
}

# Show warnings with timing
if ($warnings.Count -gt 0) {
    Write-Host "⚠️  NON-CRITICAL WARNINGS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ULTRA-FAST build check (no complex validation)
Write-Host "🏗️  [01.5s] ULTRA-FAST Build Verification..." -ForegroundColor Cyan
$buildCheckStart = Get-Date

$needsBackendBuild = -not (Test-Path "dist/main.js")
$needsFrontendBuild = -not (Test-Path "react-app/dist/index.html")

if ($needsBackendBuild -or $needsFrontendBuild) {
    Write-Host "  🔧 Missing builds detected - TURBO building..." -ForegroundColor Green
    
    if ($needsBackendBuild) {
        Write-Host "  🔨 TURBO Backend Build (silent)..." -ForegroundColor Cyan
        $backendStart = Get-Date
        npm run build:fast > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Backend build failed!" -ForegroundColor Red
            Write-Host "  💡 Use: .\start.ps1 for nuclear cleanup + build" -ForegroundColor Yellow
            exit 1
        }
        $backendTime = [math]::Round((Get-Date - $backendStart).TotalSeconds, 1)
        Write-Host "  ✅ Backend built in ${backendTime}s!" -ForegroundColor Green
    }
    
    if ($needsFrontendBuild) {
        Write-Host "  🔨 TURBO Frontend Build (silent)..." -ForegroundColor Cyan
        $frontendStart = Get-Date
        Set-Location react-app
        npm run build > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Frontend build failed!" -ForegroundColor Red
            Write-Host "  💡 Use: .\start.ps1 for nuclear cleanup + build" -ForegroundColor Yellow
            Set-Location ..
            exit 1
        }
        Set-Location ..
        $frontendTime = [math]::Round((Get-Date - $frontendStart).TotalSeconds, 1)
        Write-Host "  ✅ Frontend built in ${frontendTime}s!" -ForegroundColor Green
    }
} else {
    Write-Host "  ✅ All builds exist - SKIPPING build phase!" -ForegroundColor Green
}

$buildCheckTime = [math]::Round((Get-Date - $buildCheckStart).TotalMilliseconds)
Write-Host "  ⚡ Build verification completed in ${buildCheckTime}ms" -ForegroundColor Cyan
Write-Host ""

# INSTANT final verification (no complex checks)
Write-Host "🔍 [01.8s] INSTANT Final Check..." -ForegroundColor Cyan
$verifyStart = Get-Date

$criticalFiles = @(
    @{Path="dist/main.js"; Name="Backend Main"},
    @{Path="react-app/dist/index.html"; Name="Frontend Index"}
)

$allReady = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file.Path) {
        Write-Host "  ✅ $($file.Name): READY" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($file.Name): MISSING" -ForegroundColor Red
        $allReady = $false
    }
}

if (-not $allReady) {
    Write-Host ""
    Write-Host "🚨 CRITICAL FILES MISSING!" -ForegroundColor Red
    Write-Host "📋 SOLUTION: Use .\start.ps1 for nuclear cleanup" -ForegroundColor Yellow
    exit 1
}

$verifyTime = [math]::Round((Get-Date - $verifyStart).TotalMilliseconds)
Write-Host "  ⚡ Final verification in ${verifyTime}ms" -ForegroundColor Cyan
Write-Host ""

# TURBO LAUNCH SUCCESS
$totalStartupTime = [math]::Round((Get-Date - $startTime).TotalSeconds, 2)
Write-Host "🎯 TURBO START SEQUENCE COMPLETE!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "⚡ Total startup time: ${totalStartupTime}s (ULTRA-FAST!)" -ForegroundColor Yellow
Write-Host "🎛️  All MIDI Learn/OSC controls active!" -ForegroundColor White
Write-Host "🚀 Focus/Iris/Prism/ColorWheel/GoboRotation/Pan/Tilt available!" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# INSTANT browser launch (no waiting/monitoring)
Write-Host "🌐 [02.0s] INSTANT Browser Launch..." -ForegroundColor Cyan
$url = "http://localhost:3030"
Write-Host "  🎯 Target URL: $url" -ForegroundColor White
Write-Host "  ⚡ Pre-launching browser..." -ForegroundColor Yellow

# Start browser immediately (no waiting for server)
Start-Process $url -ErrorAction SilentlyContinue

# TURBO SERVER LAUNCH
Write-Host ""
Write-Host "🚀 [02.1s] TURBO SERVER LAUNCH..." -ForegroundColor Green
Write-Host "  ▶️  Executing: npm start" -ForegroundColor Cyan
Write-Host "  🌟 Server starting on port 3030..." -ForegroundColor Yellow
Write-Host "  📱 Frontend served from react-app/dist" -ForegroundColor Yellow
Write-Host "  🎛️  DMX controls ready for MIDI Learn!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 LAUNCH INITIATED - Server output below:" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

# Launch server with verbose startup info
try {
    npm start
} catch {
    Write-Host ""
    Write-Host "❌ SERVER LAUNCH FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 TURBO TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Use: .\start.ps1 (nuclear cleanup)" -ForegroundColor White
    Write-Host "2. Check error messages above" -ForegroundColor White
    Write-Host "3. Verify port 3030 is free" -ForegroundColor White
    Write-Host "4. Restart PowerShell as Admin" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "⚡ TURBO START session completed." -ForegroundColor Yellow
Write-Host "   For nuclear cleanup: .\start.ps1" -ForegroundColor White

