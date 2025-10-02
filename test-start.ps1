Write-Host "Testing PowerShell script..." -ForegroundColor Green

# Test basic functionality
$startTime = Get-Date
Write-Host "Start time: $startTime" -ForegroundColor Yellow

# Test try-catch
try {
    Write-Host "Testing try block..." -ForegroundColor Cyan
    $test = 1 + 1
    Write-Host "Result: $test" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Script completed successfully!" -ForegroundColor Green

