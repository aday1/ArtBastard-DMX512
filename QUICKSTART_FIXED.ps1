Write-Host "🎭✨ Grand ArtBastard DMX512FTW Orchestrator Activated! ✨🎭" -ForegroundColor Magenta
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Get ready for a *spectacular* setup, darling!" -ForegroundColor Cyan
Write-Host ""

# Get the directory of the current script and treat it as the project root.
$ProjectRootPath = $PSScriptRoot
if (-not $ProjectRootPath) {
    # Fallback for environments where $PSScriptRoot might not be set (e.g., ISE direct run without saving)
    $ProjectRootPath = (Get-Location).Path
}
Set-Location $ProjectRootPath
Write-Host "📍 Our stage is set at: $($ProjectRootPath)" -ForegroundColor Yellow

if (-not (Test-Path -Path (Join-Path $ProjectRootPath "package.json") -PathType Leaf) -or -not (Test-Path -Path (Join-Path $ProjectRootPath "react-app") -PathType Container)) {
    Write-Error "🛑 STOP THE PRESSES! This script must be conducted from the ArtBastard_DMX project's main stage!"
    Write-Error "Ensure 'package.json' and the 'react-app' directory are in place: $ProjectRootPath"
    Exit 1
}

Write-Host ""
Write-Host "🧹 Act I: The Grand Clearing of the Stage! 🧹" -ForegroundColor Green
Write-Host "Clearing away the cobwebs and old props..." -ForegroundColor DarkCyan

# Remove potential leftover build artifacts
$BackendDistDir = ".\dist"
$FrontendDistDir = ".\react-app\dist"

if (Test-Path $BackendDistDir) {
    Write-Host "Removing backend build directory: $BackendDistDir 💨" -ForegroundColor DarkCyan
    Remove-Item -Recurse -Force $BackendDistDir
}
if (Test-Path $FrontendDistDir) {
    Write-Host "Removing frontend build directory: $FrontendDistDir 💨" -ForegroundColor DarkCyan
    Remove-Item -Recurse -Force $FrontendDistDir
}
# Optional: For a truly clean slate, uncomment to remove node_modules
# Note: CLEANUP.ps1 now handles comprehensive cleaning including node_modules by default.
# If you run CLEANUP.ps1 first, these removals are redundant.

Write-Host "✨ Stage prepped! If you haven't run CLEANUP.ps1, some old props might linger." -ForegroundColor Green
Write-Host ""

Write-Host "🎶 Act II: Assembling the Orchestra (Dependencies)! 🎶" -ForegroundColor Green
Write-Host "Summoning the finest musicians (npm packages)..." -ForegroundColor Cyan

Write-Host "Installing backend virtuosos..." -ForegroundColor DarkCyan
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Error "💔 Oh dear, the backend orchestra is out of tune! (npm install failed)"
    Exit 1 
}

# Verification step for @julusian/midi
$JulusianInstrumentsPath = Join-Path $ProjectRootPath "node_modules/@julusian/midi/lib/instruments.js"
if (-not (Test-Path $JulusianInstrumentsPath -PathType Leaf)) {
    Write-Warning "⚠️ The @julusian/midi instruments file seems to be missing. Attempting to reinstall easymidi..."
    npm install easymidi --save
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "💔 Reinstalling easymidi also failed. The show cannot go on!"
        Exit 1 
    }
    if (-not (Test-Path $JulusianInstrumentsPath -PathType Leaf)) {
        Write-Error "🛑 Critical: easymidi reinstall did not fix the missing @julusian/midi/lib/instruments.js."
        Write-Error "Please try manually deleting node_modules and package-lock.json in the project root, then run 'npm install' again."
        Write-Error "If the issue persists, try 'npm cache clean --force' followed by 'npm install'."
        Exit 1
    }
    Write-Host "✅ Reinstalling easymidi seems to have helped!" -ForegroundColor Green
}

Write-Host "✅ Backend orchestra assembled!" -ForegroundColor Green

Write-Host "Installing frontend divas..." -ForegroundColor DarkCyan
if (-not (Test-Path -Path (Join-Path $ProjectRootPath "react-app") -PathType Container)) {
    Write-Error "🛑 Missing the frontend stage! 'react-app' directory not found at '$ProjectRootPath\\react-app'."
    Exit 1
}
Push-Location -Path (Join-Path $ProjectRootPath "react-app")
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Error "💔 Heavens, the frontend divas are having a tantrum! (npm install failed)"
    Pop-Location
    Exit 1 
}
Pop-Location
Write-Host "✅ Frontend divas are ready for their spotlight!" -ForegroundColor Green
Write-Host ""

Write-Host "🎬 Act III: The Backend Spectacle Begins! 🎬" -ForegroundColor Green
Write-Host "Raising the curtains on the server-side drama..." -ForegroundColor Cyan
Write-Host "(The backend server, our magnificent 'node start-server.js', shall appear in a new PowerShell window!)"
Write-Host "This mystical process also conjures the frontend build if needed. Marvelous!"
Write-Host "Expect the backend spirits to manifest on port 3030."

$BackendCommand = "Write-Host '🌟 Backend Server - The Star of the Show! 🌟' -ForegroundColor Yellow; Write-Host 'This sacred space hosts our backend server (node start-server.js). Close this window to end the performance.'; Write-Host 'All server-side enchantments will appear here.'; Set-Location '$ProjectRootPath'; node start-server.js; Write-Host 'The backend server has taken its bow. Press Enter to close this window.'; Read-Host"
Start-Process pwsh.exe -ArgumentList "-NoExit", "-Command", $BackendCommand

Write-Host "🚀 Backend server launched into the cosmos (new window)!" -ForegroundColor Green
Write-Host "   Keep an eye on that new window for the backend's grand pronouncements."
Write-Host ""

Write-Host "💡 Act IV: The Frontend Extravaganza - Your Cue! 💡" -ForegroundColor Green
Write-Host "--------------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "‼️ ATTENTION, STAGE MANAGER (That's You!) ‼️" -ForegroundColor Red
Write-Host "The spotlight now turns to you for the frontend!" -ForegroundColor Yellow
Write-Host "Please, with dramatic flair, open a NEW PowerShell terminal/tab, and command:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Set-Location '$($ProjectRootPath)\react-app'" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

# Get the actual IP address for LAN access
try {
    $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress
    if (-not $LocalIP) {
        $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1" -and $_.IPAddress -ne "169.254.*"} | Select-Object -First 1).IPAddress
    }
} catch {
    $LocalIP = "YOUR_LOCAL_IP"
}

Write-Host "🌐 Frontend Access URLs:" -ForegroundColor Cyan
Write-Host "  Local:    http://localhost:3001" -ForegroundColor White
if ($LocalIP -and $LocalIP -ne "YOUR_LOCAL_IP") {
    Write-Host "  Network:  http://$LocalIP`:3001" -ForegroundColor Green
    Write-Host "  👥 Share the Network URL with other devices on your LAN!" -ForegroundColor Yellow
} else {
    Write-Host "  Network:  http://[YOUR_LOCAL_IP]:3001" -ForegroundColor Yellow
    Write-Host "  💡 Replace [YOUR_LOCAL_IP] with your actual IP address for LAN access" -ForegroundColor Yellow
}
Write-Host "--------------------------------------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Follow your cue in Act IV to bring the frontend to life!"
Write-Host "May your lights be bright and your cues be perfect!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 For a full RESTART (clean, install, build, run): execute RESTART.ps1 🔄" -ForegroundColor Yellow
