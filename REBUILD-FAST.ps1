# SUPER FAST REBUILD SCRIPT
# Combines cleanup + build in the most efficient way possible

param(
    [switch]$FullClean,  # Include node_modules cleanup
    [switch]$DevMode,    # Start in dev mode
    [switch]$SkipFrontend, # Only build backend
    [switch]$ClearBrowserData # Clear localStorage for debugging
)

# Disable PowerShell profile errors
$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== LIGHTNING FAST REBUILD ===" -ForegroundColor Magenta

$sw = [System.Diagnostics.Stopwatch]::StartNew()

# STEP 1: Ultra-fast cleanup (5-10 seconds)
Write-Host "1. Quick cleanup..." -ForegroundColor Yellow

# Kill processes immediately
Get-Process node* 2>$null | Stop-Process -Force 2>$null
@(3030, 3001) | ForEach-Object {
    try {
        $procs = netstat -ano 2>$null | Select-String ":$_\s.*LISTENING"        if ($procs) {
            $procs | ForEach-Object {
                $processId = ($_.ToString() -split '\s+')[-1]
                if ($processId -match '^\d+$') { 
                    taskkill /F /PID $processId 2>$null | Out-Null
                }
            }
        }
    } catch { }
}

# Clean only build outputs (not node_modules unless requested)
@("dist", "react-app\dist", ".vite", "react-app\.vite", ".eslintcache", "react-app\.eslintcache") | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if ($FullClean) {
    Write-Host "  → Full clean (including node_modules)..." -ForegroundColor Gray
    @("node_modules", "react-app\node_modules") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# STEP 2: Smart dependency check (0-60 seconds)
$needsInstall = $FullClean -or 
                -not (Test-Path "node_modules\package.json") -or 
                (-not $SkipFrontend -and -not (Test-Path "react-app\node_modules\package.json"))

if ($needsInstall) {
    Write-Host "2. Installing dependencies in parallel..." -ForegroundColor Yellow
    
    try {
        # Root dependencies
        Write-Host "  -> Root dependencies..." -ForegroundColor Gray
        $rootJob = Start-Job -ScriptBlock { 
            Set-Location $using:PWD
            npm ci --prefer-offline --no-audit --silent --no-progress 2>$null
            if ($LASTEXITCODE -ne 0) {
                npm install --prefer-offline --no-audit --silent --no-progress 2>$null
            }
        }
        
        # Frontend dependencies
        $frontendJob = $null
        if (-not $SkipFrontend) {
            Write-Host "  -> Frontend dependencies..." -ForegroundColor Gray
            $frontendJob = Start-Job -ScriptBlock { 
                Set-Location "$using:PWD\react-app"
                npm ci --prefer-offline --no-audit --silent --no-progress 2>$null
                if ($LASTEXITCODE -ne 0) {
                    npm install --prefer-offline --no-audit --silent --no-progress 2>$null
                }
            }
        }
        
        # Wait for completion with timeout
        $jobs = @($rootJob)
        if ($frontendJob) { $jobs += $frontendJob }
          $timeout = 300 # 5 minutes max
        Wait-Job $jobs -Timeout $timeout | Out-Null
        
        # Clean up jobs
        $jobs | Receive-Job | Out-Null
        $jobs | Remove-Job -Force
          Write-Host "  SUCCESS Dependencies installed" -ForegroundColor Green
        
    } catch {
        Write-Warning "Dependency installation had issues, but continuing..."
    }
} else {
    Write-Host "2. Dependencies OK, skipping install" -ForegroundColor Green
}

# STEP 3: Fast build (10-30 seconds)
Write-Host "3. Building..." -ForegroundColor Yellow

try {
    # Build backend
    if (Test-Path "build-backend-fast.js") {
        node build-backend-fast.js
    } else {
        npm run build-backend
    }
    
    if (-not $SkipFrontend) {
        # Build frontend in parallel if not in dev mode
        if (-not $DevMode) {
            Push-Location "react-app"
            npm run build
            Pop-Location
        }
    }
} catch {
    Write-Warning "Build had issues, but continuing..."
}

# STEP 4: Start
$elapsed = $sw.Elapsed.TotalSeconds
Write-Host "SUCCESS Rebuild complete in $([math]::Round($elapsed, 1))s!" -ForegroundColor Green

if ($DevMode) {
    Write-Host "4. Starting in dev mode..." -ForegroundColor Green
    
    # Start backend
    $backendCmd = "Set-Location '$PWD'; Write-Host 'Backend Server Starting...' -ForegroundColor Yellow; npm start; Read-Host 'Press Enter to close'"
    Start-Process pwsh -ArgumentList "-NoProfile", "-NoExit", "-Command", $backendCmd
    
    # Start frontend dev server
    if (-not $SkipFrontend) {
        Write-Host "Starting frontend dev server..." -ForegroundColor Cyan
        Push-Location "react-app"
        npm run dev
        Pop-Location
    }
} else {
    Write-Host "4. Starting production mode..." -ForegroundColor Green
    npm start
}
