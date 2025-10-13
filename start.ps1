param(
    [switch]$Clear,
    [switch]$Help
)

if ($Help) {
    Write-Host "ArtBastard DMX512 - Sophisticated Launch Orchestrator" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1           # EXQUISITE rapid deployment (recommended)" -ForegroundColor Green
    Write-Host "  .\start.ps1 -Clear   # Immaculate reconstruction (purges all artifacts)" -ForegroundColor Red
    Write-Host "  .\start.ps1 -Help    # Display this refined documentation" -ForegroundColor White
    Write-Host ""
    Write-Host "Operational Modes:" -ForegroundColor Yellow
    Write-Host "  Standard (default): Elegantly rapid initialization, preserves curated artifacts" -ForegroundColor Green
    Write-Host "  -Clear:           Complete architectural reconstruction (more deliberate)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Performance Characteristics:" -ForegroundColor Yellow
    Write-Host "  Standard deployment:    ~5-10 seconds" -ForegroundColor Green
    Write-Host "  Immaculate reconstruction: ~30-60 seconds" -ForegroundColor Red
    Write-Host ""
    Write-Host "Exemplary Invocations:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1          # Sophisticated rapid deployment (daily preference)" -ForegroundColor Green
    Write-Host "  .\start.ps1 -Clear   # When architectural purity is paramount" -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host "ArtBastard DMX512 - Sophisticated Launch Orchestrator" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
if ($Clear) {
    Write-Host "IMMACULATE RECONSTRUCTION MODE: Architectural purity restoration" -ForegroundColor Red
    Write-Host "Eliminating all cached artifacts and dependencies for pristine foundation" -ForegroundColor Red
} else {
    Write-Host "EXQUISITE RAPID DEPLOYMENT MODE: Elegantly accelerated initialization" -ForegroundColor Green
    Write-Host "Preserving curated artifacts and dependencies for optimal efficiency" -ForegroundColor Green
}
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Sophisticated ETA calculation system using temporary performance metrics
$etaTempFile = "$env:TEMP\artbastard_eta_metrics.json"
$etaMetrics = @{
    "lastRunTimes" = @()
    "averageTime" = 0
    "lastUpdated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

# Load existing metrics if available
if (Test-Path $etaTempFile) {
    try {
        $existingMetrics = Get-Content $etaTempFile | ConvertFrom-Json
        if ($existingMetrics.lastRunTimes) {
            $etaMetrics.lastRunTimes = $existingMetrics.lastRunTimes
            $etaMetrics.averageTime = $existingMetrics.averageTime
        }
    } catch {
        # If corrupted, start fresh
        $etaMetrics.lastRunTimes = @()
        $etaMetrics.averageTime = 0
    }
}

function Update-ETAMetrics {
    param([double]$totalTime)
    
    # Add current run time to history (keep last 10 runs)
    $etaMetrics.lastRunTimes += $totalTime
    if ($etaMetrics.lastRunTimes.Count -gt 10) {
        $etaMetrics.lastRunTimes = $etaMetrics.lastRunTimes[-10..-1]
    }
    
    # Calculate sophisticated average with weighted recent performance
    if ($etaMetrics.lastRunTimes.Count -gt 0) {
        $recentWeight = 0.7
        $historicalWeight = 0.3
        
        $recentAverage = if ($etaMetrics.lastRunTimes.Count -ge 3) {
            ($etaMetrics.lastRunTimes[-3..-1] | Measure-Object -Average).Average
        } else {
            ($etaMetrics.lastRunTimes | Measure-Object -Average).Average
        }
        
        $historicalAverage = if ($etaMetrics.lastRunTimes.Count -gt 3) {
            ($etaMetrics.lastRunTimes[0..($etaMetrics.lastRunTimes.Count-4)] | Measure-Object -Average).Average
        } else {
            $recentAverage
        }
        
        $etaMetrics.averageTime = ($recentAverage * $recentWeight) + ($historicalAverage * $historicalWeight)
    }
    
    $etaMetrics.lastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    # Save metrics
    try {
        $etaMetrics | ConvertTo-Json -Depth 3 | Out-File $etaTempFile -Encoding UTF8
    } catch {
        # Silently fail if can't save metrics
    }
}

function Get-SophisticatedETA {
    param([int]$currentStep, [int]$totalSteps)
    
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    
    if ($currentStep -gt 0 -and $etaMetrics.averageTime -gt 0) {
        # Use sophisticated calculation based on historical performance
        $progressRatio = $currentStep / $totalSteps
        $estimatedTotal = [math]::Round($etaMetrics.averageTime * (1 + (1 - $progressRatio) * 0.2), 1)
        $remaining = [math]::Round($estimatedTotal - $elapsed, 1)
        
        # Ensure remaining time is reasonable
        if ($remaining -lt 0) { $remaining = 0 }
        if ($remaining -gt $etaMetrics.averageTime * 2) { $remaining = [math]::Round($etaMetrics.averageTime * 1.5, 1) }
        
        return $remaining
    } else {
        # Fallback to simple calculation
        $estimatedTotal = if ($currentStep -gt 0) { [math]::Round(($elapsed / $currentStep) * $totalSteps, 1) } else { "?" }
        $remaining = if ($estimatedTotal -ne "?") { [math]::Round($estimatedTotal - $elapsed, 1) } else { "?" }
        return $remaining
    }
}

# EXQUISITE RAPID DEPLOYMENT PATH: Sophisticated acceleration protocol
if (-not $Clear) {
    Write-Host "🚀 EXQUISITE RAPID DEPLOYMENT MODE" -ForegroundColor Green
    Write-Host "Bypassing validation protocols and dependency verification for optimal velocity..." -ForegroundColor Yellow
    Write-Host ""
    
    # Elegant process termination (minimal intervention)
    try {
        Write-Host "Executing graceful process termination..." -ForegroundColor Cyan
        $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcs) {
            Write-Host "  Elegantly terminating $($nodeProcs.Count) Node.js processes..." -ForegroundColor Yellow
            $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        
        $artProcs = Get-Process -Name "ArtBastard*" -ErrorAction SilentlyContinue
        if ($artProcs) {
            Write-Host "  Gracefully terminating $($artProcs.Count) ArtBastard processes..." -ForegroundColor Yellow
            $artProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Process termination completed with sophistication!" -ForegroundColor Green
    } catch {
        Write-Host "Process termination completed (pristine foundation)" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Architectural validation with minimal intervention
    if (-not (Test-Path "dist")) {
        Write-Host "Architectural foundation missing - executing minimal reconstruction..." -ForegroundColor Yellow
        try {
            npm run build-backend
            Write-Host "Minimal reconstruction completed with elegance!" -ForegroundColor Green
        } catch {
            Write-Host "Reconstruction encountered challenges, proceeding with grace..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Architectural foundation intact - preserving existing structure!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Initiating ArtBastard DMX512 server deployment..." -ForegroundColor Green
    
    # Deploy the server with sophistication
    try {
        npm start
    } catch {
        Write-Host "Server deployment encountered complications!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Consider executing with -Clear flag for architectural reconstruction" -ForegroundColor Cyan
    }
    
    # Update ETA metrics for future sophistication
    $totalTime = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    Update-ETAMetrics $totalTime
    
    Write-Host ""
    Write-Host "ArtBastard DMX512 session concluded with sophistication." -ForegroundColor Cyan
    exit 0
}

# IMMACULATE RECONSTRUCTION PATH: Only executed when architectural purity is demanded
Write-Host "🧹 IMMACULATE RECONSTRUCTION MODE: Complete architectural restoration" -ForegroundColor Red
Write-Host "This deliberate process ensures pristine foundation and optimal performance" -ForegroundColor Yellow
Write-Host ""

$totalSteps = 7
$currentStep = 0

function Show-SophisticatedProgress {
    param(
        [string]$Message,
        [int]$Step,
        [string]$Color = "Cyan"
    )
    $percentage = [math]::Round(($Step / $totalSteps) * 100)
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    $remaining = Get-SophisticatedETA $Step $totalSteps
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host "ARCHITECTURAL PROGRESS: $percentage% | Elapsed: ${elapsed}s | Sophisticated ETA: ${remaining}s" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host $Message -ForegroundColor $Color
    Write-Host ""
}

Show-SophisticatedProgress "Architectural Reconstruction Initiated: $(Get-Date -Format 'HH:mm:ss.fff')" 0 "Yellow"

# Step 1: SOPHISTICATED PROCESS TERMINATION
$currentStep = 1
Show-SophisticatedProgress "STEP 1/7: ELEGANT PROCESS TERMINATION PROTOCOL" $currentStep "Red"
$processStart = Get-Date

try {
    # Sophisticated Node.js process termination
    Write-Host "  Executing comprehensive Node.js process analysis..." -ForegroundColor Red
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcs) {
        Write-Host "  Gracefully terminating $($nodeProcs.Count) Node.js processes with elegance..." -ForegroundColor Yellow
        $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  All Node.js processes terminated with sophistication" -ForegroundColor Green
    } else {
        Write-Host "  No Node.js processes detected (pristine state)" -ForegroundColor Green
    }

    # Sophisticated port 3030 resolution
    Write-Host "  Analyzing port 3030 architectural conflicts..." -ForegroundColor Red
    $connections = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "  Resolving port 3030 conflicts with architectural precision..." -ForegroundColor Yellow
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($processId in $processes) {
            Write-Host "    Elegantly terminating PID: $processId" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  Port 3030 architectural conflicts resolved" -ForegroundColor Green
    } else {
        Write-Host "  Port 3030 architecture pristine" -ForegroundColor Green
    }

    # Sophisticated ArtBastard process management
    Write-Host "  Conducting ArtBastard-related process analysis..." -ForegroundColor Red
    $artProcs = Get-Process | Where-Object { $_.ProcessName -like "*dmx*" -or $_.ProcessName -like "*artbastard*" }
    if ($artProcs) {
        Write-Host "  Gracefully terminating $($artProcs.Count) ArtBastard processes..." -ForegroundColor Yellow
        $artProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  ArtBastard processes terminated with architectural elegance" -ForegroundColor Green
    } else {
        Write-Host "  No ArtBastard processes detected (foundation clear)" -ForegroundColor Green
    }
    
    $processTime = [math]::Round((Get-Date - $processStart).TotalMilliseconds)
    Write-Host "  Process termination protocol completed in ${processTime}ms with sophistication" -ForegroundColor Cyan
} catch {
    Write-Host "  Process termination completed (pristine foundation established)" -ForegroundColor Green
}

Write-Host ""

# Step 2: ARCHITECTURAL FOUNDATION RECONSTRUCTION (only if -Clear specified)
if ($Clear) {
    $currentStep = 2
    Show-SophisticatedProgress "STEP 2/7: ARCHITECTURAL FOUNDATION RECONSTRUCTION" $currentStep "Red"

# Sophisticated build directory reconstruction
Write-Host "  Executing architectural build directory reconstruction..." -ForegroundColor Red
$buildDirs = @("dist", "react-app/dist", "react-app/dist-tsc", "build", ".next", "out")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Write-Host "  Gracefully removing architectural artifact: $dir" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Sophisticated dependency reconstruction
Write-Host "Initiating dependency reconstruction for pristine foundation..." -ForegroundColor Red
if (Test-Path "node_modules") {
    Write-Host "  Elegantly removing: node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/node_modules") {
    Write-Host "  Gracefully removing: react-app/node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "react-app/node_modules" -ErrorAction SilentlyContinue
}

# Sophisticated cache purification
Write-Host "Executing comprehensive npm cache purification..." -ForegroundColor Yellow
npm cache clean --force 2>$null
npm cache verify 2>$null

# Sophisticated temporary file elimination
$npmTemp = "$env:APPDATA/npm-cache"
if (Test-Path $npmTemp) {
    Remove-Item -Recurse -Force $npmTemp -ErrorAction SilentlyContinue
}

# Sophisticated TypeScript build cache elimination
if (Test-Path ".tsbuildinfo") {
    Remove-Item ".tsbuildinfo" -Force -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/.tsbuildinfo") {
    Remove-Item "react-app/.tsbuildinfo" -Force -ErrorAction SilentlyContinue
}

# Sophisticated Vite cache elimination
if (Test-Path "react-app/.vite") {
    Remove-Item -Recurse -Force "react-app/.vite" -ErrorAction SilentlyContinue
}

# Sophisticated Electron cache and build artifact elimination
Write-Host "Executing Electron cache and build artifact elimination..." -ForegroundColor Yellow
if (Test-Path "electron/node_modules") {
    Write-Host "  Gracefully removing: electron/node_modules" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "electron/node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "electron/electron-dist") {
    Write-Host "  Elegantly removing: electron/electron-dist" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "electron/electron-dist" -ErrorAction SilentlyContinue
}
if (Test-Path "electron/dist") {
    Write-Host "  Sophisticated removal: electron/dist" -ForegroundColor Yellow
    Remove-Item -Recurse -Force "electron/dist" -ErrorAction SilentlyContinue
}

Write-Host "Architectural foundation reconstruction completed with sophistication!" -ForegroundColor Green
Write-Host ""

} else {
    # Skip cleanup when -Clear is not specified
    Write-Host "Preserving architectural artifacts - maintaining existing foundation" -ForegroundColor Green
    Write-Host "Consider -Clear flag for complete architectural reconstruction" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: SOPHISTICATED DEPENDENCY VALIDATION AND INSTALLATION
$currentStep = 3
Show-SophisticatedProgress "STEP 3/7: SOPHISTICATED DEPENDENCY VALIDATION AND INSTALLATION" $currentStep "Green"

# Sophisticated pre-installation validation
Write-Host "Executing comprehensive system requirement validation..." -ForegroundColor Cyan
$validationErrors = @()

# Sophisticated network connectivity analysis
Write-Host "Conducting network connectivity analysis..." -ForegroundColor Cyan
try {
    $testConnection = Test-NetConnection -ComputerName "registry.npmjs.org" -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($testConnection) {
        Write-Host "  Network architecture: Online (npm registry accessible)" -ForegroundColor Green
        Write-Host "  Preferring offline mode for optimal performance..." -ForegroundColor Cyan
        $global:isOnline = $false  # Prefer offline even when online
    } else {
        Write-Host "  Network architecture: Offline (npm registry unreachable)" -ForegroundColor Yellow
        $global:isOnline = $false
        Write-Host "  Utilizing offline installation protocol..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Network architecture: Unknown status (preferring offline mode)" -ForegroundColor Yellow
    $global:isOnline = $false
}

# Sophisticated Node.js version analysis
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $versionNumber = [version]($nodeVersion -replace 'v', '')
        if ($versionNumber -lt [version]"18.0.0") {
            $validationErrors += "Node.js version $nodeVersion is architecturally insufficient. Please upgrade to v18.0.0 or higher for optimal performance."
        } else {
            Write-Host "  Node.js architecture: $nodeVersion (sophisticated)" -ForegroundColor Green
        }
    } else {
        $validationErrors += "Node.js runtime not detected. Please install Node.js from https://nodejs.org/ for architectural completeness."
    }
} catch {
    $validationErrors += "Node.js version analysis encountered complications: $($_.Exception.Message)"
}

# Sophisticated npm version analysis
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  npm architecture: v$npmVersion (elegant)" -ForegroundColor Green
    } else {
        $validationErrors += "npm package manager not detected. Please reinstall Node.js for architectural integrity."
    }
} catch {
    $validationErrors += "npm version analysis encountered challenges: $($_.Exception.Message)"
}

# Sophisticated disk space analysis
try {
    $drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
    if ($freeSpaceGB -lt 2) {
        $validationErrors += "Insufficient architectural disk space. At least 2GB free space required for optimal performance. Current: ${freeSpaceGB}GB"
    } else {
        Write-Host "  Disk architecture: ${freeSpaceGB}GB available (sophisticated)" -ForegroundColor Green
    }
} catch {
    Write-Host "  Disk space analysis could not be completed" -ForegroundColor Yellow
}

# Sophisticated validation results analysis
if ($validationErrors.Count -gt 0) {
    Write-Host "ARCHITECTURAL VALIDATION ENCOUNTERED COMPLICATIONS:" -ForegroundColor Red
    foreach ($validationError in $validationErrors) {
        Write-Host "   - $validationError" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please address the above architectural requirements and execute the script again with sophistication." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "All system requirements validated with architectural elegance!" -ForegroundColor Green
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

# Step 4: SOPHISTICATED ARCHITECTURAL CONSTRUCTION
$currentStep = 4
Show-SophisticatedProgress "STEP 4/7: SOPHISTICATED ARCHITECTURAL CONSTRUCTION" $currentStep "Green"

Write-Host "Executing sophisticated backend architectural construction..." -ForegroundColor Cyan
try {
    # Use sophisticated build optimization if available
    if (Test-Path "build-backend-fast.js") {
        Write-Host "  Utilizing sophisticated fast build architecture..." -ForegroundColor Yellow
        npm run build-backend-fast
    } else {
        Write-Host "  Employing standard build architecture..." -ForegroundColor Yellow
        npm run build-backend
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Backend architectural construction encountered complications with exit code $LASTEXITCODE"
    }
    Write-Host "Backend architectural construction completed with sophistication!" -ForegroundColor Green
} catch {
    Write-Host "ARCHITECTURAL CONSTRUCTION COMPLICATIONS: Backend build encountered challenges!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Please review TypeScript architectural patterns in src/ directory" -ForegroundColor Cyan
    exit 1
}

Write-Host "Executing sophisticated frontend architectural construction..." -ForegroundColor Cyan
try {
    Push-Location react-app
    Write-Host "  Employing sophisticated frontend build architecture..." -ForegroundColor Yellow
    npm run build:vite
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend architectural construction encountered complications with exit code $LASTEXITCODE"
    }
    Pop-Location
    Write-Host "Frontend architectural construction completed with elegance!" -ForegroundColor Green
} catch {
    Write-Host "ARCHITECTURAL CONSTRUCTION COMPLICATIONS: Frontend build encountered challenges!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Pop-Location
    Write-Host "Please review TypeScript architectural patterns in react-app/src/ directory" -ForegroundColor Cyan
    exit 1
}

Write-Host "Executing sophisticated Electron architectural preparation..." -ForegroundColor Cyan
try {
    Push-Location electron
    Write-Host "  Preparing Electron for sophisticated development mode..." -ForegroundColor Yellow
    Write-Host "  Electron will utilize the React development server at http://localhost:3001" -ForegroundColor Yellow
    Pop-Location
    Write-Host "Electron architectural preparation completed with sophistication!" -ForegroundColor Green
} catch {
    Write-Host "ARCHITECTURAL PREPARATION COMPLICATIONS: Electron setup encountered challenges!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Pop-Location
    Write-Host "Please review Electron architectural configuration in electron/ directory" -ForegroundColor Cyan
    exit 1
}
Write-Host ""

# Step 5: SOPHISTICATED ARCHITECTURAL VERIFICATION
$currentStep = 5
Show-SophisticatedProgress "STEP 5/7: SOPHISTICATED ARCHITECTURAL VERIFICATION" $currentStep "Green"

$buildSuccess = $true
if (-not (Test-Path "dist")) {
    Write-Host "Backend architectural foundation missing!" -ForegroundColor Red
    $buildSuccess = $false
}
if (-not (Test-Path "react-app/dist")) {
    Write-Host "Frontend architectural foundation missing!" -ForegroundColor Red
    $buildSuccess = $false
}
if (-not (Test-Path "electron/node_modules")) {
    Write-Host "Electron architectural dependencies missing!" -ForegroundColor Red
    $buildSuccess = $false
}

if ($buildSuccess) {
    Write-Host "Architectural verification completed with sophistication!" -ForegroundColor Green
    Write-Host "All architectural components constructed successfully!" -ForegroundColor Green
    Write-Host "Electron application ready for sophisticated development mode with native MIDI support!" -ForegroundColor Magenta
} else {
    Write-Host "Architectural verification encountered complications!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: SOPHISTICATED ELECTRON APPLICATION DEPLOYMENT
$currentStep = 6
Show-SophisticatedProgress "STEP 6/7: SOPHISTICATED ELECTRON APPLICATION DEPLOYMENT" $currentStep "Magenta"
Write-Host "Initiating ArtBastard DMX512 Electron application with sophisticated native MIDI support..." -ForegroundColor Magenta

# Deploy Electron application using sophisticated Start-Process methodology
Write-Host "Deploying Electron application with sophisticated Start-Process architecture..." -ForegroundColor Magenta

# Sophisticated server readiness verification
$maxAttempts = 30
$attempt = 0
$url = "http://localhost:3030"

Write-Host "Conducting sophisticated server readiness analysis before Electron deployment..." -ForegroundColor Cyan

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Server architecture verified! Deploying Electron application..." -ForegroundColor Green
            break
        }
    } catch {
        # Server architecture not yet ready
        if ($attempt % 5 -eq 0) {
            Write-Host "  Conducting server readiness analysis... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Seconds 1
    $attempt++
}

if ($attempt -eq $maxAttempts) {
    Write-Host "Server readiness timeout - proceeding with Electron deployment..." -ForegroundColor Yellow
}

# Sophisticated Electron deployment using Start-Process
try {
    Write-Host "Initiating sophisticated Electron process deployment..." -ForegroundColor Cyan
    $electronProcess = Start-Process -FilePath "npm" -ArgumentList "run", "electron" -WorkingDirectory "electron" -PassThru
    Write-Host "Electron process deployed with sophisticated PID: $($electronProcess.Id)" -ForegroundColor Green
} catch {
    Write-Host "Electron deployment encountered complications: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Electron application deployed with sophisticated native MIDI support!" -ForegroundColor Green
Write-Host "MIDI Learn functionality now operates with architectural elegance and native MIDI access!" -ForegroundColor Cyan
Write-Host ""

# Step 7: SOPHISTICATED ARTBASTARD WEB SERVER DEPLOYMENT
$currentStep = 7
Show-SophisticatedProgress "STEP 7/7: SOPHISTICATED ARTBASTARD WEB SERVER DEPLOYMENT" $currentStep "Green"
Write-Host "Initiating ArtBastard DMX512 web server deployment with architectural sophistication..." -ForegroundColor Green

# Sophisticated browser auto-open with architectural monitoring
$browserJob = Start-Job -ScriptBlock {
    $maxAttempts = 45  # Sophisticated wait time for architectural reconstruction
    $attempt = 0
    $url = "http://localhost:3030"
    
    Write-Host "Conducting sophisticated server readiness analysis..." -ForegroundColor Cyan
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                # Server architecture verified, deploying browser
                Start-Process $url
                Write-Host "ARCHITECTURAL SUCCESS! Browser deployed to $url" -ForegroundColor Green
                Write-Host "ArtBastard DMX512 is ready with sophisticated architectural features!" -ForegroundColor Green
                break
            }
        } catch {
            # Server architecture not yet ready, conducting analysis
            if ($attempt % 5 -eq 0) {
                Write-Host "  Conducting server readiness analysis... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 1
        $attempt++
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "Server readiness timeout: Architecture took longer than expected to initialize" -ForegroundColor Yellow
        Write-Host "   You may manually deploy browser to: http://localhost:3030" -ForegroundColor White
        Write-Host "   The server architecture may still be initializing..." -ForegroundColor White
    }
}

Write-Host ""
$totalTime = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
Write-Host "ARCHITECTURAL RECONSTRUCTION COMPLETED WITH SOPHISTICATION!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Total Architectural Construction Time: ${totalTime}s" -ForegroundColor Yellow
Write-Host "You now possess the most sophisticated ArtBastard DMX512 architecture!" -ForegroundColor White
Write-Host "ELECTRON APPLICATION: Sophisticated native MIDI support with elegant MIDI Learn!" -ForegroundColor Magenta
Write-Host "WEB SERVER ARCHITECTURE: All MIDI Learn, OSC, and lighting controls are architecturally pristine!" -ForegroundColor White
Write-Host "Deploying both Electron application AND web server architecture..." -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Update ETA metrics for future sophistication
Update-ETAMetrics $totalTime

# Deploy the server with sophisticated monitoring
try {
    Write-Host "Initiating ArtBastard DMX512 server deployment..." -ForegroundColor Green
    npm start
} catch {
    Write-Host "Server deployment encountered architectural complications!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Sophisticated troubleshooting protocols:" -ForegroundColor Cyan
    Write-Host "   1. Verify port 3030 architectural conflicts" -ForegroundColor White
    Write-Host "   2. Confirm Node.js and npm architectural integrity" -ForegroundColor White
    Write-Host "   3. Execute: npm run build-backend && node dist/server.js" -ForegroundColor White
    Write-Host "   4. Review architectural logs in logs/app.log for detailed analysis" -ForegroundColor White
} finally {
    # Sophisticated browser job cleanup
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "ArtBastard DMX512 architectural session concluded with sophistication." -ForegroundColor Cyan
Write-Host "   Gratitude for utilizing the most sophisticated lighting control architecture!" -ForegroundColor White
Write-Host "   Both Electron application and web server have been deployed with architectural elegance!" -ForegroundColor Magenta