Write-Host "🚀 ArtBastard DMX512 - CLEAN BUILD LAUNCHER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "This script performs a COMPLETE cleanup and fresh build" -ForegroundColor White
Write-Host "to ensure you get the latest and greatest ArtBastard experience!" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: AGGRESSIVE PROCESS CLEANUP
Write-Host "🔥 STEP 1: AGGRESSIVE PROCESS CLEANUP" -ForegroundColor Red
Write-Host "────────────────────────────────────────" -ForegroundColor Yellow

try {
    # Kill ALL Node.js processes (nuclear option for clean start)
    Write-Host "💀 Terminating ALL Node.js processes..." -ForegroundColor Red
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # Kill any processes using port 3030
    $connections = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "🔄 Force-killing processes on port 3030..." -ForegroundColor Yellow
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ⚡ Terminated PID: $pid" -ForegroundColor Yellow
            } catch {
                # Process might already be gone
            }
        }
        Start-Sleep -Seconds 3
    }

    # Kill any remaining ArtBastard-related processes
    Get-Process | Where-Object { $_.ProcessName -like "*dmx*" -or $_.ProcessName -like "*artbastard*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Process cleanup completed!" -ForegroundColor Green
} catch {
    Write-Host "✅ Process cleanup completed (no processes found)" -ForegroundColor Green
}

Write-Host ""

# Step 2: NUCLEAR FILE SYSTEM CLEANUP
Write-Host "🧹 STEP 2: NUCLEAR FILE SYSTEM CLEANUP" -ForegroundColor Red
Write-Host "──────────────────────────────────────────" -ForegroundColor Yellow

# Remove ALL build directories
Write-Host "💣 Removing ALL build directories..." -ForegroundColor Red
$buildDirs = @("dist", "react-app/dist", "react-app/dist-tsc", "build", ".next", "out")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Write-Host "  🗑️  Removing: $dir" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Remove node_modules for complete rebuild
Write-Host "💣 Removing node_modules for fresh install..." -ForegroundColor Red
if (Test-Path "node_modules") {
    Write-Host "  🗑️  Removing: node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/node_modules") {
    Write-Host "  🗑️  Removing: react-app/node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "react-app/node_modules" -ErrorAction SilentlyContinue
}

# Clear ALL npm/yarn caches
Write-Host "🧹 Clearing ALL npm caches..." -ForegroundColor Yellow
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

Write-Host "✅ Nuclear cleanup completed!" -ForegroundColor Green
Write-Host ""

# Step 3: FRESH DEPENDENCY INSTALLATION
Write-Host "📦 STEP 3: FRESH DEPENDENCY INSTALLATION" -ForegroundColor Green
Write-Host "───────────────────────────────────────────" -ForegroundColor Yellow

Write-Host "📥 Installing root dependencies (FRESH)..." -ForegroundColor Cyan
npm install --no-cache --prefer-offline=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ FAILED: Root dependency installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Root dependencies installed!" -ForegroundColor Green

Write-Host "📥 Installing frontend dependencies (FRESH)..." -ForegroundColor Cyan
Push-Location react-app
npm install --no-cache --prefer-offline=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ FAILED: Frontend dependency installation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✅ Frontend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 4: FORCE BUILD EVERYTHING
Write-Host "🏗️  STEP 4: FORCE BUILD EVERYTHING" -ForegroundColor Green
Write-Host "─────────────────────────────────────" -ForegroundColor Yellow

Write-Host "🔨 Building backend (FORCE)..." -ForegroundColor Cyan
npm run build-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ FAILED: Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend build completed!" -ForegroundColor Green

Write-Host "🔨 Building frontend (FORCE)..." -ForegroundColor Cyan
Push-Location react-app
npm run build:vite
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ FAILED: Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✅ Frontend build completed!" -ForegroundColor Green
Write-Host ""

# Step 5: VERIFICATION
Write-Host "🔍 STEP 5: BUILD VERIFICATION" -ForegroundColor Green
Write-Host "────────────────────────────────" -ForegroundColor Yellow

$buildSuccess = $true
if (-not (Test-Path "dist")) {
    Write-Host "❌ Backend dist directory missing!" -ForegroundColor Red
    $buildSuccess = $false
}
if (-not (Test-Path "react-app/dist")) {
    Write-Host "❌ Frontend dist directory missing!" -ForegroundColor Red
    $buildSuccess = $false
}

if ($buildSuccess) {
    Write-Host "✅ Build verification PASSED!" -ForegroundColor Green
    Write-Host "🎯 All components built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Build verification FAILED!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: LAUNCH THE CLEAN ARTBASTARD
Write-Host "🚀 STEP 6: LAUNCHING CLEAN ARTBASTARD DMX512" -ForegroundColor Green
Write-Host "──────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host "▶️  Starting ArtBastard DMX512 server..." -ForegroundColor Green

# Enhanced browser auto-open with better monitoring
$browserJob = Start-Job -ScriptBlock {
    $maxAttempts = 45  # Increased wait time for clean builds
    $attempt = 0
    $url = "http://localhost:3030"
    
    Write-Host "🌐 Waiting for server to be ready..." -ForegroundColor Cyan
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                # Server is ready, open browser
                Start-Process $url
                Write-Host "� SUCCESS! Browser opened to $url" -ForegroundColor Green
                Write-Host "🎛️  ArtBastard DMX512 is ready with all latest features!" -ForegroundColor Green
                break
            }
        } catch {
            # Server not ready yet, show progress
            if ($attempt % 5 -eq 0) {
                Write-Host "  ⏳ Still waiting... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 1
        $attempt++
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "⚠️  Timeout: Server took longer than expected to start" -ForegroundColor Yellow
        Write-Host "   You can manually visit: http://localhost:3030" -ForegroundColor White
        Write-Host "   The server may still be starting up..." -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🎯 CLEAN BUILD COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ You now have the latest and greatest ArtBastard DMX512!" -ForegroundColor White
Write-Host "🎛️  All MIDI Learn, OSC, and lighting controls are fresh!" -ForegroundColor White
Write-Host "🚀 Starting server with ALL latest features..." -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start the server with enhanced monitoring
try {
    npm start
} catch {
    Write-Host "❌ Server startup failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
} finally {
    # Clean up the browser job when script ends
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🏁 ArtBastard DMX512 session ended." -ForegroundColor Cyan
Write-Host "   Thanks for using the cleanest lighting control system! 🎭" -ForegroundColor White
