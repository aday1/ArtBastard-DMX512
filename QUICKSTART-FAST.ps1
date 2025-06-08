# FAST QUICKSTART SCRIPT FOR ARTBASTARD DMX512
# Optimized for speed - parallel installs and smart caching

param(
    [switch]$SkipInstall,
    [switch]$DevMode,
    [switch]$ProductionBuild,
    [switch]$SkipBuild
)

Write-Host "🚀 ArtBastard DMX512 Fast Quickstart" -ForegroundColor Cyan

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

# Smart dependency check
$needsInstall = -not (Test-Path "node_modules\package.json") -or 
                -not (Test-Path "react-app\node_modules\package.json")

if ($needsInstall -and -not $SkipInstall) {
    Write-Host "📦 Installing dependencies in parallel..." -ForegroundColor Yellow
    
    # Parallel npm install using background jobs
    $jobs = @()
    
    # Root install
    Write-Host "  → Root dependencies..." -ForegroundColor Gray
    $jobs += Start-Job -ScriptBlock { 
        Set-Location $using:ProjectRoot
        npm ci --prefer-offline --no-audit --progress=false --silent 2>$null
    }
    
    # Frontend install  
    Write-Host "  → Frontend dependencies..." -ForegroundColor Gray
    $jobs += Start-Job -ScriptBlock {
        Set-Location "$using:ProjectRoot\react-app"
        npm ci --prefer-offline --no-audit --progress=false --silent 2>$null
    }
    
    # Wait for completion with progress
    $completed = 0
    while ($completed -lt $jobs.Count) {
        Start-Sleep -Milliseconds 500
        $completed = ($jobs | Where-Object { $_.State -eq 'Completed' }).Count
        Write-Progress -Activity "Installing dependencies" -PercentComplete (($completed / $jobs.Count) * 100)
    }
    
    # Clean up jobs
    $jobs | Wait-Job | Receive-Job | Out-Null
    $jobs | Remove-Job
    Write-Progress -Activity "Installing dependencies" -Completed
    
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} elseif ($SkipInstall) {
    Write-Host "⏭️ Skipping dependency installation" -ForegroundColor Yellow
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Build step (optional)
if (-not $SkipBuild) {
    if ($ProductionBuild) {
        Write-Host "🏗️ Building for production..." -ForegroundColor Yellow
        npm run build
    } else {
        Write-Host "🏗️ Building backend..." -ForegroundColor Yellow
        npm run build-backend
    }
}

# Start application
if ($DevMode) {
    Write-Host "🌟 Starting in development mode..." -ForegroundColor Green
    Write-Host "Frontend: cd react-app && npm run dev" -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "🌟 Starting backend server..." -ForegroundColor Green
    Write-Host "Frontend: Open new terminal → cd react-app && npm run dev" -ForegroundColor Cyan
    
    # Start backend in new window
    $cmd = "Set-Location '$ProjectRoot'; npm start; Read-Host 'Press Enter to close'"
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", $cmd
    
    Write-Host "Backend started in new window!" -ForegroundColor Green
    Write-Host "Now run: cd react-app && npm run dev" -ForegroundColor Yellow
}
