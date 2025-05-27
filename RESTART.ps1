# RESTART.ps1 - The ArtBastard's Phoenix Protocol!
# This script performs a full cleanup and then kickstarts the application.

Write-Host "🔄🔥 Invoking the Phoenix Protocol: Full Restart Initiated! 🔥🔄" -ForegroundColor Yellow
Write-Host "This will cleanse the stage and then raise the curtains anew."
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray

# Get the directory of the current script to locate sibling scripts
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = (Get-Location).Path
}

$CleanupScriptPath = Join-Path $ScriptDir "CLEANUP.ps1"
$QuickstartScriptPath = Join-Path $ScriptDir "QUICKSTART.ps1"

if (-not (Test-Path $CleanupScriptPath -PathType Leaf)) {
    Write-Error "🛑 Critical Error: CLEANUP.ps1 not found at $CleanupScriptPath. Cannot proceed with restart."
    Exit 1
}

if (-not (Test-Path $QuickstartScriptPath -PathType Leaf)) {
    Write-Error "🛑 Critical Error: QUICKSTART.ps1 not found at $QuickstartScriptPath. Cannot proceed with restart."
    Exit 1
}

Write-Host ""
Write-Host "🧼 Act I: The Grand Exfoliation (Running CLEANUP.ps1)..." -ForegroundColor Cyan
& $CleanupScriptPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "🛑 Oh no! The cleanup ritual faltered. Please check the output above. Restart aborted."
    Exit 1
}
Write-Host "✅ Cleanup complete! The stage is pristine." -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Act II: The Grand Re-Opening (Running QUICKSTART.ps1)..." -ForegroundColor Cyan
& $QuickstartScriptPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "🛑 Alas! The quickstart sequence encountered a snag. Please review the output. Restart incomplete."
    Exit 1
}

Write-Host ""
Write-Host "🎉✨ Phoenix Protocol Complete! ArtBastard DMX should be rising! ✨🎉" -ForegroundColor Magenta
Write-Host "Follow any instructions from QUICKSTART.ps1 to view the application." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
