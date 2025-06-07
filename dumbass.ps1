# dumbass.ps1 - PowerShell Execution Policy Fix Script
# Fixes the "scripts is disabled on this system" error
# Created: June 7, 2025

param(
    [switch]$Help,
    [switch]$Revert
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$White = "`e[37m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    Write-Host "$Color$Message$Reset"
}

function Show-Header {
    Clear-Host
    Write-ColorOutput $Cyan @"

    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║      🔧 DUMBASS POWERSHELL EXECUTION POLICY FIX 🔧      ║
    ║                                                          ║
    ║           Fixes: "scripts is disabled" error            ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@
}

function Show-Help {
    Show-Header
    Write-ColorOutput $White @"
USAGE:
    .\dumbass.ps1           - Fix execution policy (allow scripts)
    .\dumbass.ps1 -Revert   - Revert to original policy (disable scripts)
    .\dumbass.ps1 -Help     - Show this help

WHAT THIS SCRIPT DOES:
    • Changes PowerShell execution policy to RemoteSigned
    • Allows locally created scripts to run
    • Still blocks untrusted remote scripts for security
    • Can be reverted back to original policy

EXECUTION POLICIES EXPLAINED:
    • Restricted    = No scripts allowed (Windows default)
    • RemoteSigned  = Local scripts OK, remote scripts need signature
    • Unrestricted  = All scripts allowed (less secure)

"@
    exit 0
}

function Get-CurrentPolicy {
    return Get-ExecutionPolicy -Scope CurrentUser
}

function Fix-ExecutionPolicy {
    Show-Header
    
    $currentPolicy = Get-CurrentPolicy
    Write-ColorOutput $Yellow "📋 Current execution policy: $currentPolicy"
    
    if ($currentPolicy -eq "RemoteSigned" -or $currentPolicy -eq "Unrestricted") {
        Write-ColorOutput $Green "✅ Execution policy is already set correctly!"
        Write-ColorOutput $Green "   Your PowerShell scripts should work fine."
        return
    }
    
    Write-ColorOutput $Red @"

    ⚠️  PROBLEM DETECTED ⚠️
    
    Your PowerShell execution policy is set to: $currentPolicy
    This prevents local scripts from running.
    
"@
    
    Write-ColorOutput $Cyan @"
    🔧 SOLUTION:
    Setting execution policy to 'RemoteSigned' for current user...
    
    This will allow:
    ✅ Local scripts (like yours) to run
    ✅ Remote scripts with valid signatures
    ❌ Unsigned remote scripts (for security)
    
"@
    
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-ColorOutput $Green "✅ SUCCESS! Execution policy updated."
        Write-ColorOutput $Green "   You can now run PowerShell scripts in this project."
        
        Write-ColorOutput $White @"

    ╔══════════════════════════════════════════════════════════╗
    ║                      🎉 ALL FIXED! 🎉                   ║
    ║                                                          ║
    ║  You can now run:                                        ║
    ║  • .\CLEANUP.ps1                                         ║
    ║  • .\QUICKSTART.ps1                                      ║
    ║  • .\RESTART.ps1                                         ║
    ║  • .\git-manager.ps1                                     ║
    ║                                                          ║
    ║  Try your original command again:                        ║
    ║  .\CLEANUP.ps1;.\QUICKSTART.ps1                          ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@
        
    } catch {
        Write-ColorOutput $Red "❌ ERROR: Failed to change execution policy."
        Write-ColorOutput $Red "   You might need to run PowerShell as Administrator."
        Write-ColorOutput $Yellow @"

    💡 MANUAL FIX:
    Run this command as Administrator:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
    
    Or run this as regular user:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    
"@
    }
}

function Revert-ExecutionPolicy {
    Show-Header
    
    $currentPolicy = Get-CurrentPolicy
    Write-ColorOutput $Yellow "📋 Current execution policy: $currentPolicy"
    
    Write-ColorOutput $Red @"

    ⚠️  REVERTING TO RESTRICTED POLICY ⚠️
    
    This will disable PowerShell script execution again.
    You'll need to re-run this script to fix it later.
    
"@
    
    $confirm = Read-Host "Are you sure you want to disable scripts? (y/N)"
    
    if ($confirm -match '^[Yy]$') {
        try {
            Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser -Force
            Write-ColorOutput $Yellow "✅ Execution policy reverted to Restricted."
            Write-ColorOutput $Yellow "   PowerShell scripts are now disabled again."
        } catch {
            Write-ColorOutput $Red "❌ ERROR: Failed to revert execution policy."
        }
    } else {
        Write-ColorOutput $Green "❌ Revert cancelled. Policy unchanged."
    }
}

# Main script logic
if ($Help) {
    Show-Help
} elseif ($Revert) {
    Revert-ExecutionPolicy
} else {
    Fix-ExecutionPolicy
}

Write-ColorOutput $White "`n🔧 Script completed. Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
