# SIMPLE FAST REBUILD - No PowerShell Jobs, Maximum Compatibility
param(
    [switch]$FullClean,
    [switch]$DevMode,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "⚡ SIMPLE FAST REBUILD ⚡" -ForegroundColor Magenta

# Quick cleanup
Write-Host "1️⃣ Cleanup..." -ForegroundColor Yellow
Get-Process node* 2>$null | Stop-Process -Force 2>$null

@("dist", "react-app\dist", ".vite", "react-app\.vite") | ForEach-Object {
    if (Test-Path $_) { Remove-Item $_ -Recurse -Force 2>$null }
}

if ($FullClean) {
    @("node_modules", "react-app\node_modules") | ForEach-Object {
        if (Test-Path $_) { Remove-Item $_ -Recurse -Force 2>$null }
    }
}

# Install dependencies sequentially
$needsInstall = $FullClean -or -not (Test-Path "node_modules") -or (-not $SkipFrontend -and -not (Test-Path "react-app\node_modules"))

if ($needsInstall) {
    Write-Host "2️⃣ Installing dependencies..." -ForegroundColor Yellow
    
    Write-Host "  → Root..." -ForegroundColor Gray
    npm install --prefer-offline --no-audit --silent
    
    if (-not $SkipFrontend) {
        Write-Host "  → Frontend..." -ForegroundColor Gray
        Push-Location "react-app"
        npm install --prefer-offline --no-audit --silent
        Pop-Location
    }
}

# Build
Write-Host "3️⃣ Building..." -ForegroundColor Yellow
if (Test-Path "build-backend-fast.js") {
    node build-backend-fast.js
} else {
    npm run build-backend 2>$null
}

Write-Host "✅ Simple rebuild complete!" -ForegroundColor Green

# Start
if ($DevMode) {
    Write-Host "4️⃣ Starting dev mode..." -ForegroundColor Green
    Write-Host "Backend: Starting in new window..." -ForegroundColor Cyan
    Start-Process cmd -ArgumentList "/c", "title Backend Server && cd /d `"$PWD`" && npm start && pause"
    
    if (-not $SkipFrontend) {
        Write-Host "Frontend: Starting..." -ForegroundColor Cyan
        Push-Location "react-app"
        npm run dev
        Pop-Location
    }
} else {
    npm start
}
