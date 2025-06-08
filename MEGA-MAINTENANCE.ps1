# MEGA-MAINTENANCE SCRIPT FOR ARTBASTARD DMX512
# Combines CLEANUP and QUICKSTART functionality with menu-driven interface
# Version: 1.0.0
# Last Updated: June 8, 2025

param(
    [switch]$Help,
    [switch]$AutoFast,
    [switch]$AutoFull
)

# Script configuration
$ScriptVersion = "1.0.0"
$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }

# Colors
$ColorTitle = "Magenta"
$ColorMenu = "Cyan"
$ColorWarning = "Yellow"
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorInfo = "White"
$ColorCountdown = "DarkYellow"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Banner {
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║          🎭✨ MEGA-MAINTENANCE ORCHESTRATOR ✨🎭          ║
    ║                                                          ║
    ║              ArtBastard DMX512 Project                   ║
    ║                   Version $ScriptVersion                     ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorTitle
}

function Show-Menu {
    Write-ColorOutput "`n🎬 MEGA-MAINTENANCE MENU 🎬" $ColorMenu
    Write-ColorOutput "────────────────────────────────────────" $ColorMenu
    Write-ColorOutput "  [ENTER] 🚀 QUICK CLEAN & START (Default - 3s countdown)" $ColorSuccess
    Write-ColorOutput "  [B]     🔄 AUTO CLEAN FULL & QUICKSTART" $ColorInfo
    Write-ColorOutput "  [C]     🧹 CLEANUP ONLY (Full)" $ColorInfo
    Write-ColorOutput "  [S]     ▶️  JUST START (Skip cleanup)" $ColorInfo
    Write-ColorOutput "  [G]     📦 GIT MANAGER" $ColorInfo
    Write-ColorOutput "  [Q]     ❌ QUIT" $ColorError
    Write-ColorOutput "────────────────────────────────────────" $ColorMenu
}

function Start-Countdown {
    param([int]$Seconds = 3)
    
    Write-ColorOutput "`n⏰ Starting QUICK CLEAN & START in:" $ColorCountdown
    
    for ($i = $Seconds; $i -gt 0; $i--) {
        Write-Host "   $i seconds... (Press any key to show menu)" -ForegroundColor $ColorCountdown
        
        # Check for key press with timeout using Start-Sleep in smaller intervals
        $keyPressed = $false
        for ($j = 0; $j -lt 10; $j++) {
            Start-Sleep -Milliseconds 100
            if ([Console]::KeyAvailable) {
                [Console]::ReadKey($true) | Out-Null  # Consume the key
                $keyPressed = $true
                break
            }
        }
        
        if ($keyPressed) {
            Write-Host ""
            return $false
        }
    }
    
    Write-Host "🚀 GO!" -ForegroundColor $ColorSuccess
    return $true
}

function Kill-ProcessesFast {
    Write-ColorOutput "💀 Terminating running processes..." $ColorWarning
      # Kill by port (fast method)
    @(3030, 3001, 5000, 8080) | ForEach-Object {
        $procs = netstat -ano | Select-String ":$_\s.*LISTENING" 
        if ($procs) {
            $procs | ForEach-Object {
                $processId = ($_.ToString() -split '\s+')[-1]
                if ($processId -match '^\d+$') { 
                    taskkill /F /PID $processId 2>$null | Out-Null
                }
            }
        }
    }
    
    # Kill Node processes
    Get-Process node* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-ColorOutput "✅ Processes terminated" $ColorSuccess
}

function Invoke-QuickClean {
    Write-ColorOutput "`n🧹 QUICK CLEAN MODE" $ColorSuccess
    Kill-ProcessesFast
    
    # Fast path removal
    @("dist", "react-app\dist", "launcher\dist", ".vite", "react-app\.vite", ".eslintcache", "react-app\.eslintcache") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-ColorOutput "✅ Quick clean completed" $ColorSuccess
}

function Invoke-FullClean {
    Write-ColorOutput "`n🧼 FULL CLEANUP MODE" $ColorWarning
    
    # Kill processes first
    Kill-ProcessesFast
    
    Write-ColorOutput "🗑️ Removing build artifacts..." $ColorInfo
    @("dist", "react-app\dist", "launcher\dist") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "  ✓ Removed $_" $ColorSuccess
        }
    }
    
    Write-ColorOutput "🧹 Clearing caches..." $ColorInfo
    @(".vite", "react-app\.vite", ".eslintcache", "react-app\.eslintcache", "*.tsbuildinfo", "react-app\*.tsbuildinfo") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "  ✓ Cleared $_" $ColorSuccess
        }
    }
    
    Write-ColorOutput "📦 Removing node_modules..." $ColorWarning
    @("node_modules", "react-app\node_modules", "launcher\node_modules") | ForEach-Object {
        if (Test-Path $_) {
            Write-ColorOutput "  🗑️ Removing $_..." $ColorInfo
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "  ✅ Removed $_" $ColorSuccess
        }
    }
    
    Write-ColorOutput "🧹 Clearing logs..." $ColorInfo
    if (Test-Path "logs") {
        Remove-Item "logs" -Recurse -Force -ErrorAction SilentlyContinue
        Write-ColorOutput "  ✓ Logs cleared" $ColorSuccess
    }
    
    Write-ColorOutput "✨ FULL CLEANUP COMPLETED" $ColorSuccess
}

function Invoke-QuickStart {
    Write-ColorOutput "`n🚀 QUICKSTART MODE" $ColorSuccess
    
    # Verify project structure
    if (-not (Test-Path "package.json") -or -not (Test-Path "react-app")) {
        Write-ColorOutput "🛑 Invalid project structure! Missing package.json or react-app directory." $ColorError
        return $false
    }
    
    Write-ColorOutput "📦 Installing dependencies..." $ColorInfo
    
    # Install root dependencies
    Write-ColorOutput "  → Root dependencies..." $ColorInfo
    npm install --prefer-offline --no-audit --progress=false 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "💔 Root npm install failed!" $ColorError
        return $false
    }
    
    # Install frontend dependencies
    Write-ColorOutput "  → Frontend dependencies..." $ColorInfo
    Push-Location "react-app"
    npm install --prefer-offline --no-audit --progress=false 2>$null
    $frontendResult = $LASTEXITCODE
    Pop-Location
    
    if ($frontendResult -ne 0) {
        Write-ColorOutput "💔 Frontend npm install failed!" $ColorError
        return $false
    }
    
    Write-ColorOutput "✅ Dependencies installed" $ColorSuccess
    
    # Start backend server
    Write-ColorOutput "`n🎬 Starting backend server..." $ColorSuccess
    $BackendCommand = "Write-Host '🌟 ArtBastard DMX512 Backend Server 🌟' -ForegroundColor Yellow; Write-Host 'Server running on port 3030. Close this window to stop.'; Set-Location '$ProjectRoot'; node start-server.js; Write-Host 'Server stopped. Press Enter to close.'; Read-Host"
    Start-Process pwsh.exe -ArgumentList "-NoExit", "-Command", $BackendCommand
    
    Write-ColorOutput "🚀 Backend server started in new window!" $ColorSuccess    # Get all available IP addresses for network access (Ethernet and Wireless only)
    $NetworkIPs = @()
    try {
        # Get all IPv4 addresses excluding loopback and APIPA addresses
        $AllIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            $_.IPAddress -ne "127.0.0.1" -and 
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } | Sort-Object IPAddress
          foreach ($IP in $AllIPs) {
            $Adapter = Get-NetAdapter -InterfaceIndex $IP.InterfaceIndex -ErrorAction SilentlyContinue
            if ($Adapter -and $Adapter.Status -eq "Up") {
                # Filter out virtual adapters but be more inclusive of physical interfaces
                $isVirtual = $Adapter.Name -like "*vEthernet*" -or 
                           $Adapter.Name -like "*Virtual*" -or 
                           $Adapter.Name -like "*Loopback*" -or
                           $Adapter.Name -like "*Teredo*" -or
                           $Adapter.Name -like "*isatap*"
                
                if (-not $isVirtual) {
                    $NetworkIPs += @{
                        IP = $IP.IPAddress
                        Interface = $Adapter.Name
                    }
                }
            }
        }    } catch {
        # Fallback method - try to get any non-loopback IP
        try {
            $FallbackIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
                $_.IPAddress -ne "127.0.0.1" -and 
                $_.IPAddress -notlike "169.254.*" -and
                ($_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*")
            }
            
            foreach ($FallbackIP in $FallbackIPs) {
                $NetworkIPs += @{
                    IP = $FallbackIP.IPAddress
                    Interface = "Network"
                }
            }
        } catch {
            # Ultimate fallback - try hostname -I equivalent
            try {
                $HostIPs = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object {
                    $_.AddressFamily -eq "InterNetwork" -and 
                    $_.ToString() -ne "127.0.0.1" -and
                    $_.ToString() -notlike "169.254.*"
                }
                
                foreach ($HostIP in $HostIPs) {
                    $NetworkIPs += @{
                        IP = $HostIP.ToString()
                        Interface = "Host"
                    }
                }
            } catch {
                # Final fallback
                $NetworkIPs += @{
                    IP = "Unable to detect"
                    Interface = "Error"
                }
            }
        }
    }
    
    Write-ColorOutput "`n💡 FRONTEND SETUP REQUIRED:" $ColorWarning
    Write-ColorOutput "────────────────────────────────────────" $ColorMenu
    Write-ColorOutput "Open a NEW terminal and run:" $ColorInfo
    Write-ColorOutput "  cd react-app" $ColorInfo
    Write-ColorOutput "  npm run dev" $ColorInfo
    Write-ColorOutput "`n🌐 Access URLs:" $ColorMenu
    Write-ColorOutput "  Local:     http://localhost:3001" $ColorInfo
      # Display all network IPs
    if ($NetworkIPs.Count -gt 0) {
        $validIPs = $NetworkIPs | Where-Object { $_.IP -and $_.IP -ne "Unable to detect" }
        if ($validIPs.Count -gt 0) {            foreach ($NetworkIP in $validIPs) {
                $InterfaceDisplay = if ($NetworkIP.Interface.Length -gt 15) { 
                    $NetworkIP.Interface.Substring(0, 12) + "..." 
                } else { 
                    $NetworkIP.Interface.PadRight(15) 
                }
                Write-ColorOutput "  Network:   http://$($NetworkIP.IP):3001 ($($InterfaceDisplay.TrimEnd()))" $ColorSuccess
            }
        } else {
            Write-ColorOutput "  Network:   Unable to detect network interfaces" $ColorWarning
        }
    } else {
        Write-ColorOutput "  Network:   No network interfaces detected" $ColorWarning
    }
    
    Write-ColorOutput "────────────────────────────────────────" $ColorMenu
    
    return $true
}

function Invoke-GitManager {
    Write-ColorOutput "`n📦 Starting Git Manager..." $ColorInfo
    if (Test-Path "git-manager.ps1") {
        & ".\git-manager.ps1"
    } else {
        Write-ColorOutput "🛑 git-manager.ps1 not found!" $ColorError
    }
}

# Main execution
function Main {
    Set-Location $ProjectRoot
    
    # Handle automatic modes
    if ($AutoFast) {
        Show-Banner
        Invoke-QuickClean
        Invoke-QuickStart
        return
    }
    
    if ($AutoFull) {
        Show-Banner
        Invoke-FullClean
        Invoke-QuickStart
        return
    }
    
    # Interactive mode
    Show-Banner
    
    # Default countdown for quick start
    $showMenu = $true
    if (-not $Help) {
        $showMenu = -not (Start-Countdown -Seconds 3)
    }
    
    if (-not $showMenu) {
        Invoke-QuickClean
        Invoke-QuickStart
        return
    }
    
    # Interactive menu loop
    do {
        Show-Menu
        Write-Host "`nSelect option: " -ForegroundColor $ColorMenu -NoNewline
        
        $choice = Read-Host
        $choice = $choice.ToUpper().Trim()
        
        switch ($choice) {
            "" {  # Enter key - Quick Clean & Start
                Invoke-QuickClean
                Invoke-QuickStart
                $continue = $false
            }
            "B" {  # Auto Clean Full & Quickstart
                Invoke-FullClean
                Invoke-QuickStart
                $continue = $false
            }
            "C" {  # Cleanup Only
                Invoke-FullClean
                Write-ColorOutput "`n✨ Cleanup completed. Choose another option or quit." $ColorSuccess
                $continue = $true
            }
            "S" {  # Just Start
                Invoke-QuickStart
                $continue = $false
            }
            "G" {  # Git Manager
                Invoke-GitManager
                $continue = $true
            }
            "Q" {  # Quit
                Write-ColorOutput "`n👋 Goodbye! May your lights be bright!" $ColorSuccess
                $continue = $false
            }
            default {
                Write-ColorOutput "`n❌ Invalid option. Please try again." $ColorError
                $continue = $true
            }
        }
    } while ($continue)
}

# Help display
if ($Help) {
    Show-Banner
    Write-ColorOutput @"
USAGE:
  .\MEGA-MAINTENANCE.ps1                    # Interactive mode with countdown
  .\MEGA-MAINTENANCE.ps1 -AutoFast          # Quick clean & start (no interaction)
  .\MEGA-MAINTENANCE.ps1 -AutoFull          # Full clean & start (no interaction)
  .\MEGA-MAINTENANCE.ps1 -Help              # Show this help

MENU OPTIONS:
  [ENTER] - Quick clean & start (3-second countdown default)
  [B]     - Full cleanup then quickstart
  [C]     - Full cleanup only
  [S]     - Just start (skip cleanup)
  [G]     - Run git manager
  [Q]     - Quit

FEATURES:
  • 3-second countdown for instant action
  • Fast process termination
  • Smart dependency management
  • Network IP detection
  • Comprehensive cleanup options
"@ $ColorInfo
    exit 0
}

# Run main function
try {
    Main
} catch {
    Write-ColorOutput "`n💥 An error occurred: $($_.Exception.Message)" $ColorError
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" $ColorError
    exit 1
}
