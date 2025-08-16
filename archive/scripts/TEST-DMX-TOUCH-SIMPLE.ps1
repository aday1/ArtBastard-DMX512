# DMX Selected Channels Touch Control - Simple Test Script

Write-Host "DMX Selected Channels Touch Control - Implementation Test" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check if the application is already running
Write-Host "Checking if application is running..." -ForegroundColor Yellow

$frontendRunning = Test-Port -Port 3000
$backendRunning = Test-Port -Port 3001

if ($frontendRunning -and $backendRunning) {
    Write-Host "Application is already running!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
} else {
    Write-Host "Starting the application..." -ForegroundColor Yellow
    
    # Start the application in background
    Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized
    
    Write-Host "Waiting for application to start..." -ForegroundColor Yellow
    
    # Wait for services to start
    $timeout = 60
    $elapsed = 0
    
    do {
        Start-Sleep -Seconds 2
        $elapsed += 2
        $frontendRunning = Test-Port -Port 3000
        $backendRunning = Test-Port -Port 3001
        
        if ($elapsed % 10 -eq 0) {
            Write-Host "   Still waiting... $elapsed seconds" -ForegroundColor Gray
        }
        
    } while ((-not $frontendRunning -or -not $backendRunning) -and $elapsed -lt $timeout)
    
    if ($frontendRunning -and $backendRunning) {
        Write-Host "Application started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to start application within $timeout seconds" -ForegroundColor Red
        Write-Host "   Please start manually with 'npm start'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Test Procedures:" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan

Write-Host "1. Main Interface Test:" -ForegroundColor White
Write-Host "   - Open http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Go to DMX Control Panel" -ForegroundColor Gray
Write-Host "   - Select some channels (click to highlight)" -ForegroundColor Gray
Write-Host "   - Click 'Selected Only' button" -ForegroundColor Gray
Write-Host "   - Verify only selected channels show" -ForegroundColor Gray

Write-Host ""
Write-Host "2. External Monitor Touch Test:" -ForegroundColor White
Write-Host "   - Click the monitor icon to open external window" -ForegroundColor Gray
Write-Host "   - Click the component library button" -ForegroundColor Gray
Write-Host "   - Select 'Touch DMX Control' from DMX category" -ForegroundColor Gray
Write-Host "   - Verify touch-optimized interface with selected channels" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Touch Optimization Test:" -ForegroundColor White
Write-Host "   - Check larger touch targets on sliders" -ForegroundColor Gray
Write-Host "   - Verify hidden advanced controls (fullscreen/detach)" -ForegroundColor Gray
Write-Host "   - Test pagination with touch-friendly navigation" -ForegroundColor Gray

Write-Host ""
Write-Host "Opening test pages..." -ForegroundColor Yellow

# Open the application
Start-Process "http://localhost:3000"

# Wait a moment then open test report
Start-Sleep -Seconds 2
$testReportPath = Join-Path $PWD "DMX-SELECTED-CHANNELS-TOUCH-IMPLEMENTATION-COMPLETE.html"
Start-Process $testReportPath

Write-Host ""
Write-Host "Test Environment Ready!" -ForegroundColor Green
Write-Host "   Application: http://localhost:3000" -ForegroundColor White
Write-Host "   Test Report: $testReportPath" -ForegroundColor White

Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "   * Selected channels only mode toggle works" -ForegroundColor Green
Write-Host "   * Touch DMX Control component available in external monitor" -ForegroundColor Green
Write-Host "   * Touch-optimized controls with larger targets" -ForegroundColor Green
Write-Host "   * Efficient pagination for selected channels" -ForegroundColor Green
Write-Host "   * Professional touchscreen workflow enabled" -ForegroundColor Green

Write-Host ""
Write-Host "Implementation Complete! Ready for testing." -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = Read-Host
