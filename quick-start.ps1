Write-Host "⚡ ArtBastard DMX512 - QUICK START" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "Fast startup with smart dependency checking!" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Quick process cleanup (minimal)
Write-Host "🔄 Quick Process Cleanup..." -ForegroundColor Cyan
try {
    # Only kill processes on port 3030
    $connections = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "  🔄 Stopping existing server on port 3030..." -ForegroundColor Yellow
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
} catch {
    # No processes found, continue
}

# Smart Dependency Check
Write-Host "🔍 Smart Dependency Check..." -ForegroundColor Cyan
$missingItems = @()
$warnings = @()
$canStart = $true

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        $missingItems += "Node.js not found"
        $canStart = $false
    }
} catch {
    $missingItems += "Node.js not installed"
    $canStart = $false
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  ✅ npm: v$npmVersion" -ForegroundColor Green
    } else {
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
        Write-Host "⚠️  MISSING ITEMS DETECTED - OFFERING QUICK FIX..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🤔 Would you like to quickly install missing dependencies? [Y/N]" -ForegroundColor Cyan
        $response = Read-Host
        
        if ($response -eq "Y" -or $response -eq "y" -or $response -eq "yes" -or $response -eq "Yes") {
            Write-Host "📦 Quick Installing Dependencies..." -ForegroundColor Green
            
            if (-not (Test-Path "node_modules")) {
                Write-Host "  📥 Installing root dependencies..." -ForegroundColor Cyan
                npm install --silent
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "  ❌ Root dependency install failed!" -ForegroundColor Red
                    Write-Host "  💡 Try: .\start.ps1 for full clean install" -ForegroundColor Yellow
                    exit 1
                }
            }
            
            if (-not (Test-Path "react-app/node_modules")) {
                Write-Host "  📥 Installing frontend dependencies..." -ForegroundColor Cyan
                Push-Location react-app
                npm install --silent
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "  ❌ Frontend dependency install failed!" -ForegroundColor Red
                    Write-Host "  💡 Try: .\start.ps1 for full clean install" -ForegroundColor Yellow
                    Pop-Location
                    exit 1
                }
                Pop-Location
            }
            
            Write-Host "  ✅ Quick install completed!" -ForegroundColor Green
        } else {
            Write-Host "⏭️  Skipping dependency install - continuing anyway..." -ForegroundColor Yellow
        }
    }
}

# Show warnings
if ($warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS (non-critical):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Quick build check and auto-build if needed
Write-Host "🏗️  Quick Build Check..." -ForegroundColor Cyan

$needsBackendBuild = -not (Test-Path "dist")
$needsFrontendBuild = -not (Test-Path "react-app/dist")

if ($needsBackendBuild -or $needsFrontendBuild) {
    Write-Host "🔧 Auto-building missing components..." -ForegroundColor Green
    
    if ($needsBackendBuild) {
        Write-Host "  🔨 Building backend..." -ForegroundColor Cyan
        npm run build-backend --silent
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Backend build failed!" -ForegroundColor Red
            Write-Host "  💡 Try: .\start.ps1 for full clean build" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "  ✅ Backend built!" -ForegroundColor Green
    }
    
    if ($needsFrontendBuild) {
        Write-Host "  🔨 Building frontend..." -ForegroundColor Cyan
        Push-Location react-app
        npm run build:vite --silent
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Frontend build failed!" -ForegroundColor Red
            Write-Host "  💡 Try: .\start.ps1 for full clean build" -ForegroundColor Yellow
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Host "  ✅ Frontend built!" -ForegroundColor Green
    }
} else {
    Write-Host "  ✅ All builds up to date!" -ForegroundColor Green
}

Write-Host ""

# Final verification
Write-Host "🔍 Final Verification..." -ForegroundColor Cyan
$startupReady = $true

if (-not (Test-Path "dist/main.js")) {
    Write-Host "  ❌ Backend main.js missing!" -ForegroundColor Red
    $startupReady = $false
}

if (-not (Test-Path "react-app/dist/index.html")) {
    Write-Host "  ❌ Frontend index.html missing!" -ForegroundColor Red
    $startupReady = $false
}

if (-not $startupReady) {
    Write-Host ""
    Write-Host "🚨 STARTUP NOT POSSIBLE!" -ForegroundColor Red
    Write-Host "📋 SOLUTION: Run .\start.ps1 for complete setup" -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ All systems ready!" -ForegroundColor Green
Write-Host ""

# Success - Ready to start
Write-Host "🚀 QUICK START READY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "⚡ Starting ArtBastard DMX512 (Quick Mode)..." -ForegroundColor White
Write-Host "🎛️  All MIDI Learn and OSC features available!" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Quick browser auto-open
$browserJob = Start-Job -ScriptBlock {
    $maxAttempts = 30
    $attempt = 0
    $url = "http://localhost:3030"
    
    Write-Host "🌐 Monitoring for server startup..." -ForegroundColor Cyan
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Start-Process $url
                Write-Host "⚡ QUICK START SUCCESS! Browser opened to $url" -ForegroundColor Green
                break
            }
        } catch {
            if ($attempt % 10 -eq 0 -and $attempt -gt 0) {
                Write-Host "  ⏳ Quick start in progress... ($attempt/30)" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 1
        $attempt++
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "⚠️  Server startup took longer than expected" -ForegroundColor Yellow
        Write-Host "   Manual access: http://localhost:3030" -ForegroundColor White
    }
}

# Start the server
Write-Host "▶️  Launching server..." -ForegroundColor Green
try {
    npm start
} catch {
    Write-Host "❌ Server startup failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Try: .\start.ps1 (full clean setup)" -ForegroundColor White
    Write-Host "2. Check for error messages above" -ForegroundColor White
    Write-Host "3. Ensure no other apps are using port 3030" -ForegroundColor White
    Write-Host ""
} finally {
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "⚡ Quick Start session ended." -ForegroundColor Yellow
Write-Host "   For full clean setup, use: .\start.ps1" -ForegroundColor White
