# Touch-Optimized External Monitor - Quick Test Launcher
# Run this PowerShell script to open all testing resources

Write-Host "🎛️ Touch-Optimized External Monitor - Quick Test Launcher" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if application is running
Write-Host "🔍 Checking if application is running..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is running at http://localhost:3002" -ForegroundColor Green
        $appRunning = $true
    }
} catch {
    Write-Host "❌ Application is not running at http://localhost:3002" -ForegroundColor Red
    $appRunning = $false
}

# Launch application if not running
if (-not $appRunning) {
    Write-Host "🚀 Starting React application..." -ForegroundColor Yellow
    
    # Check if we're in the right directory
    if (Test-Path "react-app") {
        Set-Location "react-app"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
        Set-Location ".."
        Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
        Start-Sleep 10
    } else {
        Write-Host "❌ react-app directory not found. Please run this script from the project root." -ForegroundColor Red
        exit 1
    }
}

# Open test guide
Write-Host "📖 Opening test guide..." -ForegroundColor Yellow
$testGuide = "TOUCH-OPTIMIZED-EXTERNAL-MONITOR-TEST.html"
if (Test-Path $testGuide) {
    Start-Process $testGuide
    Write-Host "✅ Test guide opened" -ForegroundColor Green
} else {
    Write-Host "❌ Test guide not found: $testGuide" -ForegroundColor Red
}

# Open implementation summary
Write-Host "📋 Opening implementation summary..." -ForegroundColor Yellow
$summary = "TOUCH-OPTIMIZED-IMPLEMENTATION-COMPLETE.md"
if (Test-Path $summary) {
    Start-Process $summary
    Write-Host "✅ Implementation summary opened" -ForegroundColor Green
} else {
    Write-Host "❌ Implementation summary not found: $summary" -ForegroundColor Red
}

# Wait a moment then open application
Start-Sleep 3
Write-Host "🌐 Opening application..." -ForegroundColor Yellow
Start-Process "http://localhost:3002"

# Display testing instructions
Write-Host ""
Write-Host "🎯 Touch-Optimized External Monitor Testing Instructions:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "1. 🌐 Application should open at http://localhost:3002" -ForegroundColor White
Write-Host "2. 📖 Test guide opened with detailed instructions" -ForegroundColor White
Write-Host "3. 🖥️ Click 'External Monitor' button in main interface" -ForegroundColor White
Write-Host "4. 📱 External window opens at 1400x900 for touch interface" -ForegroundColor White
Write-Host "5. 📦 Component library is open by default (top-left)" -ForegroundColor White
Write-Host "6. 🎛️ Click DMX → DMX Control Panel to add touch controls" -ForegroundColor White
Write-Host "7. ✋ Test individual channel sliders and precision buttons" -ForegroundColor White
Write-Host ""

# Display validation script instructions
Write-Host "🔧 Browser Console Validation:" -ForegroundColor Cyan
Write-Host "=" * 30 -ForegroundColor Gray
Write-Host "1. Open browser DevTools (F12)" -ForegroundColor White
Write-Host "2. Go to Console tab" -ForegroundColor White
Write-Host "3. Run validation script:" -ForegroundColor White
Write-Host "   fetch('validate-touch-external-monitor.js').then(r=>r.text()).then(eval)" -ForegroundColor Yellow
Write-Host ""

# Display key features
Write-Host "🚀 Key Features to Test:" -ForegroundColor Cyan
Write-Host "=" * 25 -ForegroundColor Gray
Write-Host "✅ Individual DMX channel sliders (512 channels)" -ForegroundColor Green
Write-Host "✅ Precision control buttons (+1/-1, +10/-10 per channel)" -ForegroundColor Green
Write-Host "✅ Bank navigation system (16 channels per bank)" -ForegroundColor Green
Write-Host "✅ Touch-optimized component library" -ForegroundColor Green
Write-Host "✅ Quick actions panel (Play/Pause/Stop/Reset)" -ForegroundColor Green
Write-Host "✅ Cross-window drag and drop functionality" -ForegroundColor Green
Write-Host "✅ 44px minimum touch targets throughout" -ForegroundColor Green
Write-Host "✅ Visual feedback on all touch interactions" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Touch-Optimized External Monitor is ready for testing!" -ForegroundColor Green
Write-Host "📱 Perfect for touchscreen DMX control in live performance!" -ForegroundColor Green

# Keep console open
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
