# Git Management Script - PowerShell Version
# ArtBastard DMX512 Project
# Last Updated: June 7, 2025

param(
    [switch]$Help
)

# Script configuration
$ScriptName = "Git Management Script"
$ScriptVersion = "1.0.0"

# Colors for output
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorMenu = "White"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Header {
    Clear-Host
    Write-ColorOutput "=============================================" $ColorInfo
    Write-ColorOutput "  $ScriptName v$ScriptVersion" $ColorInfo
    Write-ColorOutput "  ArtBastard DMX512 Project" $ColorInfo
    Write-ColorOutput "=============================================" $ColorInfo
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-ColorOutput "USAGE:" $ColorMenu
    Write-ColorOutput "  .\git-manager.ps1          - Run interactive menu" $ColorMenu
    Write-ColorOutput "  .\git-manager.ps1 -Help    - Show this help" $ColorMenu
    Write-Host ""
    Write-ColorOutput "DESCRIPTION:" $ColorMenu
    Write-ColorOutput "  Interactive menu-driven script for git operations." $ColorMenu
    Write-ColorOutput "  Handles stashing local changes and pulling latest code." $ColorMenu
    Write-Host ""
    Write-ColorOutput "FEATURES:" $ColorMenu
    Write-ColorOutput "  • Check git status" $ColorMenu
    Write-ColorOutput "  • Stash local changes" $ColorMenu
    Write-ColorOutput "  • Pull latest code" $ColorMenu
    Write-ColorOutput "  • Create commits" $ColorMenu
    Write-ColorOutput "  • Push changes" $ColorMenu
    Write-ColorOutput "  • View git log" $ColorMenu
    Write-Host ""
    exit 0
}

function Test-GitRepository {
    if (-not (Test-Path ".git")) {
        Write-ColorOutput "ERROR: Not in a git repository!" $ColorError
        Write-ColorOutput "Please run this script from the project root directory." $ColorWarning
        return $false
    }
    return $true
}

function Get-GitStatus {
    Write-ColorOutput "Checking git status..." $ColorInfo
    try {
        $status = git status --porcelain
        if ($status) {
            Write-ColorOutput "Local changes detected:" $ColorWarning
            git status --short
            return $true
        } else {
            Write-ColorOutput "Working directory is clean." $ColorSuccess
            return $false
        }
    } catch {
        Write-ColorOutput "ERROR: Failed to check git status." $ColorError
        return $false
    }
}

function Invoke-StashChanges {
    Write-ColorOutput "Stashing local changes..." $ColorInfo
    try {
        $stashMessage = "Auto-stash: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git stash push -m $stashMessage
        Write-ColorOutput "Changes stashed successfully." $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "ERROR: Failed to stash changes." $ColorError
        return $false
    }
}

function Invoke-PullLatest {
    Write-ColorOutput "Pulling latest code..." $ColorInfo
    try {
        git pull origin main
        Write-ColorOutput "Successfully pulled latest code." $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "ERROR: Failed to pull latest code." $ColorError
        Write-ColorOutput "You may need to resolve conflicts manually." $ColorWarning
        return $false
    }
}

function Invoke-CreateCommit {
    Write-ColorOutput "Creating a new commit..." $ColorInfo
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if (-not $status) {
        Write-ColorOutput "No changes to commit." $ColorWarning
        return $false
    }
    
    # Show current changes
    Write-ColorOutput "Current changes:" $ColorInfo
    git status --short
    Write-Host ""
    
    # Get commit message
    $commitMessage = Read-Host "Enter commit message"
    if (-not $commitMessage) {
        Write-ColorOutput "Commit cancelled - no message provided." $ColorWarning
        return $false
    }
    
    try {
        # Add all changes
        git add .
        
        # Commit changes
        git commit -m $commitMessage
        
        Write-ColorOutput "Commit created successfully." $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "ERROR: Failed to create commit." $ColorError
        return $false
    }
}

function Invoke-PushChanges {
    Write-ColorOutput "Pushing changes to remote..." $ColorInfo
    try {
        git push origin main
        Write-ColorOutput "Changes pushed successfully." $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "ERROR: Failed to push changes." $ColorError
        return $false
    }
}

function Show-GitLog {
    Write-ColorOutput "Recent git history:" $ColorInfo
    try {
        git log --oneline -10
    } catch {
        Write-ColorOutput "ERROR: Failed to show git log." $ColorError
    }
}

function Show-StashList {
    Write-ColorOutput "Current stashes:" $ColorInfo
    try {
        $stashes = git stash list
        if ($stashes) {
            git stash list
        } else {
            Write-ColorOutput "No stashes found." $ColorInfo
        }
    } catch {
        Write-ColorOutput "ERROR: Failed to show stash list." $ColorError
    }
}

function Invoke-StashAndPull {
    Write-ColorOutput "=== STASH AND PULL OPERATION ===" $ColorInfo
    
    # Check for local changes
    $hasChanges = Get-GitStatus
    
    if ($hasChanges) {
        Write-Host ""
        $confirm = Read-Host "Stash local changes and pull latest? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            if (Invoke-StashChanges) {
                Start-Sleep -Seconds 1
                Invoke-PullLatest
            }
        } else {
            Write-ColorOutput "Operation cancelled." $ColorWarning
        }
    } else {
        Invoke-PullLatest
    }
}

function Show-Menu {
    Write-Host ""
    Write-ColorOutput "=== GIT MANAGEMENT MENU ===" $ColorMenu
    Write-Host ""
    Write-ColorOutput "1. Check Status" $ColorMenu
    Write-ColorOutput "2. Stash Changes & Pull Latest" $ColorMenu
    Write-ColorOutput "3. Create Commit" $ColorMenu
    Write-ColorOutput "4. Push Changes" $ColorMenu
    Write-ColorOutput "5. View Git Log" $ColorMenu
    Write-ColorOutput "6. Show Stash List" $ColorMenu
    Write-ColorOutput "7. Manual Git Status" $ColorMenu
    Write-ColorOutput "0. Exit" $ColorMenu
    Write-Host ""
}

function Start-InteractiveMode {
    while ($true) {
        Show-Header
        Show-Menu
        
        $choice = Read-Host "Select an option"
        
        switch ($choice) {
            "1" {
                Write-Host ""
                Get-GitStatus
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "2" {
                Write-Host ""
                Invoke-StashAndPull
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "3" {
                Write-Host ""
                Invoke-CreateCommit
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "4" {
                Write-Host ""
                Invoke-PushChanges
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "5" {
                Write-Host ""
                Show-GitLog
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "6" {
                Write-Host ""
                Show-StashList
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "7" {
                Write-Host ""
                git status
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "0" {
                Write-ColorOutput "Goodbye!" $ColorSuccess
                exit 0
            }
            default {
                Write-ColorOutput "Invalid option. Please try again." $ColorError
                Start-Sleep -Seconds 2
            }
        }
    }
}

# Main script execution
if ($Help) {
    Show-Help
}

# Check if we're in a git repository
if (-not (Test-GitRepository)) {
    exit 1
}

# Start interactive mode
Start-InteractiveMode
