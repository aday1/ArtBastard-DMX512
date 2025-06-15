# Touch Interface Test Launcher - UPDATED
# PowerShell script to launch and test the touch-optimized external monitor

Write-Host "🚀 Touch Interface Test Launcher - Starting..." -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030" -TimeoutSec 5 -UseBasicParsing
    $serverRunning = $true
    Write-Host "✅ Server is already running at http://localhost:3030" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Server not running - will start it..." -ForegroundColor Yellow
}

# Start server if not running
if (-not $serverRunning) {
    Write-Host "🔄 Starting DMX server..." -ForegroundColor Yellow
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "C:\Users\aday\Desktop\Github\ArtBastard-DMX512" -PassThru
    
    # Wait for server to start
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if server started successfully
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3030" -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ Server started successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start server. Please check manually." -ForegroundColor Red
        exit 1
    }
}

# Launch main application in browser
Write-Host "🌐 Opening main application..." -ForegroundColor Cyan
Start-Process "http://localhost:3030"

# Wait a moment for page to load
Start-Sleep -Seconds 5

# Instructions for manual testing
Write-Host "`n📋 MANUAL TESTING INSTRUCTIONS:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "1. 🖥️ Click 'External Monitor' button in main interface" -ForegroundColor White
Write-Host "2. 📱 Verify external window opens at 1400x900 size" -ForegroundColor White
Write-Host "3. 🎛️ Add 'DMX Touch Control' panel to external monitor" -ForegroundColor White
Write-Host "4. 🧪 Open browser dev tools (F12) in external window" -ForegroundColor White
Write-Host "5. 📊 Run validation script in console:" -ForegroundColor White
Write-Host "   validateCompleteTouch()" -ForegroundColor Yellow

Write-Host "`n🧪 TESTING CHECKLIST:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

$testItems = @(
    "✓ External monitor opens at 1400x900",
    "✓ DMX Touch Control panel loads",
    "✓ Custom pages: Main Lights, Moving Lights, Effects",
    "✓ Channels per page configuration works",
    "✓ Sub-page navigation (‹ › buttons)",
    "✓ Individual channel sliders respond",
    "✓ Remove Components button works",
    "✓ Touch-friendly button sizes (44px minimum)",
    "✓ Smooth animations and visual feedback",
    "✓ Pagination within custom pages"
)

foreach ($item in $testItems) {
    Write-Host "  $item" -ForegroundColor White
}

Write-Host "`n🔧 AUTOMATED VALIDATION:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

# Load and display validation script location
$validationScript = "C:\Users\aday\Desktop\Github\ArtBastard-DMX512\validate-complete-touch-interface.js"
if (Test-Path $validationScript) {
    Write-Host "✅ Validation script ready at:" -ForegroundColor Green
    Write-Host "   $validationScript" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Copy/paste this into external monitor console:" -ForegroundColor Cyan
    
    # Display key parts of validation script    Write-Host "# Run complete validation" -ForegroundColor Gray
    Write-Host "validateCompleteTouch();" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# Or run individual tests:" -ForegroundColor Gray
    Write-Host "window.touchTestResults" -ForegroundColor Yellow
} else {
    Write-Host "❌ Validation script not found!" -ForegroundColor Red
}

Write-Host "`n🚀 QUICK START SEQUENCE:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "1. Main app should now be open in browser" -ForegroundColor White
Write-Host "2. Look for 'External Monitor' or monitor icon button" -ForegroundColor White
Write-Host "3. Click it to open 1400x900 touch interface window" -ForegroundColor White
Write-Host "4. In external window: click '+' to add components" -ForegroundColor White
Write-Host "5. Select 'DMX Touch Control' from component library" -ForegroundColor White
Write-Host "6. Test custom page navigation and channel controls" -ForegroundColor White

Write-Host "`n💡 TROUBLESHOOTING:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "• If external monitor doesn't open: check popup blockers" -ForegroundColor White
Write-Host "• If components don't load: refresh external window" -ForegroundColor White
Write-Host "• If validation fails: ensure you're in external window" -ForegroundColor White
Write-Host "• For touch testing: use actual touchscreen hardware" -ForegroundColor White

Write-Host "`n🎯 SUCCESS CRITERIA:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "All tests passing = Ready for production! 🎉" -ForegroundColor Green
Write-Host "6+ tests passing = Good to go with minor tweaks 🟡" -ForegroundColor Yellow
Write-Host "< 6 tests passing = Needs investigation 🔴" -ForegroundColor Red

Write-Host "`n🏁 Touch Interface Test Launcher Complete!" -ForegroundColor Green
Write-Host "Application should be running at http://localhost:3030" -ForegroundColor Cyan
Write-Host "Happy testing! 🎛️📱" -ForegroundColor Magenta

# Keep window open
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
