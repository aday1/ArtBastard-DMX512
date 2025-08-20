Write-Host "🚀 Launching ArtBastard DMX512..." -ForegroundColor Cyan

# Step 1: Complete cleanup
Write-Host "🧹 Performing complete cleanup..." -ForegroundColor Yellow
try {
    # Kill any processes using port 3030
    $connections = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "🔄 Killing existing processes on port 3030..." -ForegroundColor Yellow
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  Killed process PID: $pid" -ForegroundColor Yellow
            } catch {
                # Process might already be gone
            }
        }
        Start-Sleep -Seconds 3
    }
    
    # Also try to kill any node processes that might be running ArtBastard
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*ArtBastard*" -or $_.CommandLine -like "*3030*" }
    if ($nodeProcesses) {
        Write-Host "🔄 Killing ArtBastard node processes..." -ForegroundColor Yellow
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "  Port cleanup completed (no processes found)" -ForegroundColor Green
}

# Clean build directories
Write-Host "🧹 Cleaning build directories..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/dist") {
    Remove-Item -Recurse -Force "react-app/dist" -ErrorAction SilentlyContinue
}
if (Test-Path "react-app/dist-tsc") {
    Remove-Item -Recurse -Force "react-app/dist-tsc" -ErrorAction SilentlyContinue
}

# Clean node_modules cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# Step 2: Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Cyan
npm install | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies." -ForegroundColor Red
    exit 1
}

# Step 3: Install frontend dependencies
Write-Host "📦 Installing frontend dependencies in 'react-app'..." -ForegroundColor Cyan
Push-Location react-app
npm install | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Step 4: Build the backend
Write-Host "🏗️ Building backend..." -ForegroundColor Green
npm run build-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed." -ForegroundColor Red
    exit 1
}

# Step 5: Start the application and open browser
Write-Host "▶️ Starting ArtBastard DMX512..." -ForegroundColor Green

# Function to wait for server to be ready and open browser
$browserJob = Start-Job -ScriptBlock {
    $maxAttempts = 30
    $attempt = 0
    $url = "http://localhost:3030"
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                # Server is ready, open browser
                Start-Process $url
                Write-Host "🌐 Browser opened to $url" -ForegroundColor Green
                break
            }
        } catch {
            # Server not ready yet, wait
        }
        
        Start-Sleep -Seconds 1
        $attempt++
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "⚠️ Server didn't start within expected time, but you can manually visit http://localhost:3030" -ForegroundColor Yellow
    }
}

# Start the server
npm start

# Clean up the browser job when script ends
Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
