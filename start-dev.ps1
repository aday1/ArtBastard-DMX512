Write-Host "ArtBastard DMX512 - Development Mode Launcher" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Starting both backend and frontend in development mode" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Function to show progress
function Show-Progress {
    param(
        [string]$Message,
        [string]$Color = "Cyan"
    )
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host "Elapsed: ${elapsed}s" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host $Message -ForegroundColor $Color
    Write-Host ""
}

Show-Progress "Starting development environment..."

# Clean up caches
Show-Progress "Cleaning up caches..."
try {
    Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
    npm cache clean --force
    
    # Clean dist folder
    if (Test-Path "dist") {
        Write-Host "Cleaning dist folder..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    }
    
    # Clean react-app dist and node_modules/.vite
    if (Test-Path "react-app/dist") {
        Write-Host "Cleaning react-app dist folder..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "react-app/dist" -ErrorAction SilentlyContinue
    }
    
    if (Test-Path "react-app/node_modules/.vite") {
        Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "react-app/node_modules/.vite" -ErrorAction SilentlyContinue
    }
    
    Write-Host "Cache cleanup completed!" -ForegroundColor Green
} catch {
    Write-Host "Cache cleanup failed (continuing anyway): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Failed to check Node.js version: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "npm: v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host "npm not found. Please reinstall Node.js." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Failed to check npm version: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Show-Progress "Installing root dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install root dependencies" -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path "react-app/node_modules")) {
    Show-Progress "Installing frontend dependencies..."
    Push-Location react-app
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

# Build backend
Show-Progress "Building backend..."
try {
    npm run build-backend-fast
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed"
    }
    Write-Host "Backend build completed!" -ForegroundColor Green
} catch {
    Write-Host "Backend build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Start backend server in background
Show-Progress "Starting backend server..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node dist/server.js
}

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend development server
Show-Progress "Starting frontend development server..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Push-Location react-app
    npm run dev
    Pop-Location
}

# Monitor both processes
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Development servers started!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3030" -ForegroundColor White
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Function to cleanup jobs
function Cleanup-Jobs {
    Write-Host ""
    Write-Host "Stopping development servers..." -ForegroundColor Yellow
    
    if ($backendJob) {
        Stop-Job -Job $backendJob -Force
        Remove-Job -Job $backendJob -Force
    }
    
    if ($frontendJob) {
        Stop-Job -Job $frontendJob -Force
        Remove-Job -Job $frontendJob -Force
    }
    
    Write-Host "Development servers stopped." -ForegroundColor Green
}

# Set up cleanup on script exit
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Cleanup-Jobs
}

# Monitor jobs and show output
try {
    while ($true) {
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "One or more development servers failed!" -ForegroundColor Red
            break
        }
        
        # Show backend output
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            Write-Host "[BACKEND] $backendOutput" -ForegroundColor Blue
        }
        
        # Show frontend output
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            Write-Host "[FRONTEND] $frontendOutput" -ForegroundColor Green
        }
        
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Development session interrupted: $($_.Exception.Message)" -ForegroundColor Yellow
} finally {
    Cleanup-Jobs
}

$totalTime = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
Write-Host ""
Write-Host "Development session ended after ${totalTime}s" -ForegroundColor Cyan
