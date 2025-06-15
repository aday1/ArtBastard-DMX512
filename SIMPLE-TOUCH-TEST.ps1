# Simple Touch Interface Test Launcher
Write-Host "Starting Touch Interface Tests..." -ForegroundColor Green

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030" -TimeoutSec 5 -UseBasicParsing
    Write-Host "Server is running at http://localhost:3030" -ForegroundColor Green
} catch {
    Write-Host "Server not running - please start it manually" -ForegroundColor Yellow
    Write-Host "Run: npm start" -ForegroundColor Cyan
}

# Launch browser
Write-Host "Opening application..." -ForegroundColor Cyan
Start-Process "http://localhost:3030"

Write-Host "`nManual Testing Steps:" -ForegroundColor Magenta
Write-Host "1. Click External Monitor button" -ForegroundColor White  
Write-Host "2. Add DMX Touch Control panel" -ForegroundColor White
Write-Host "3. Test custom pages and controls" -ForegroundColor White
Write-Host "4. Run validation in console: validateCompleteTouch()" -ForegroundColor Yellow

Write-Host "`nValidation script available at:" -ForegroundColor Cyan
Write-Host "validate-complete-touch-interface.js" -ForegroundColor Yellow

Read-Host "`nPress Enter to exit"
