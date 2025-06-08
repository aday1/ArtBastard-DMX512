# FAST CLEANUP SCRIPT FOR ARTBASTARD DMX512
# Optimized for speed - only cleans what's necessary

param(
    [switch]$SkipNodeModules,
    [switch]$KeepLogs,
    [switch]$Quick
)

if ($Quick) {
    Write-Host "⚡ FAST CLEANUP MODE ⚡" -ForegroundColor Yellow
} else {
    Write-Host "🧹 ArtBastard DMX512 Fast Cleanup" -ForegroundColor Cyan
}

# Kill processes FIRST (prevents file locks)
$ErrorActionPreference = "SilentlyContinue"

# Kill by port (fastest method)
@(3030, 3001, 5000, 8080) | ForEach-Object {
    $procs = netstat -ano | Select-String ":$_\s.*LISTENING" 
    if ($procs) {
        $procs | ForEach-Object {
            $pid = ($_.ToString() -split '\s+')[-1]
            if ($pid -match '^\d+$') { 
                taskkill /F /PID $pid 2>$null
            }
        }
    }
}

# Kill Node processes
Get-Process node* -ErrorAction SilentlyContinue | Stop-Process -Force

# Fast path removal function
function Remove-Fast($Path) {
    if (Test-Path $Path) {
        Remove-Item $Path -Recurse -Force -ErrorAction SilentlyContinue
        if (!$Quick) { Write-Host "✓ Removed $Path" -ForegroundColor Green }
    }
}

# Clean build outputs ONLY (fastest)
Remove-Fast "dist"
Remove-Fast "react-app\dist" 
Remove-Fast "launcher\dist"
Remove-Fast ".vite"
Remove-Fast "react-app\.vite"
Remove-Fast ".eslintcache"
Remove-Fast "react-app\.eslintcache"

# Clean logs (optional)
if (-not $KeepLogs) {
    Remove-Fast "logs"
}

# Clean node_modules (slowest - make optional)
if (-not $SkipNodeModules) {
    if (!$Quick) { Write-Host "🗑️ Cleaning node_modules..." -ForegroundColor Yellow }
    Remove-Fast "node_modules"
    Remove-Fast "react-app\node_modules"
    Remove-Fast "launcher\node_modules"
}

if ($Quick) {
    Write-Host "⚡ Quick cleanup done!" -ForegroundColor Green
} else {
    Write-Host "🎉 Fast cleanup complete!" -ForegroundColor Green
}
