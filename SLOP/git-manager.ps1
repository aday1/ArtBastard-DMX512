# Git Management Script - PowerShell Version
# ArtBastard DMX512 Project
# Last Updated: June 7, 2025

param(
    [switch]$Help
)

# Script configuration
$ScriptName = "Git Management Script"
$ScriptVersion = "2.0.0"

# Colors for output
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorMenu = "White"
$ColorBranch = "Magenta"
$ColorAscii = "DarkCyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-GitBranchArt {
    param([string]$branchName)
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    🌟 CURRENT BRANCH 🌟                  ║
    ║                                                          ║
    ║      ┌─── $($branchName.PadRight(40)) ───┐               ║
    ║      │                                            │      ║
    ║      └────────────────────────────────────────────┘      ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorBranch
}

function Show-StashStatusArt {
    param([int]$stashCount)
    if ($stashCount -gt 0) {
        Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                   📦 STASH STATUS 📦                     ║
    ║                                                          ║
    ║      You have $($stashCount.ToString().PadLeft(2)) stash(es) saved:                      ║
    ║                                                          ║
    ║      ┌─[📦]─[📦]─[📦]─[📦]─[📦]─┐                        ║
    ║      │  Your saved changes      │                        ║
    ║      └─────────────────────────┘                        ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorWarning
    }
}

function Show-ChangesArt {
    param([bool]$hasChanges)
    if ($hasChanges) {
        Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                 ⚠️  CHANGES DETECTED ⚠️                  ║
    ║                                                          ║
    ║      ┌─[M]─[A]─[D]─[?]─┐                                ║
    ║      │ Local Changes   │                                ║
    ║      └─────────────────┘                                ║
    ║                                                          ║
    ║      M = Modified  A = Added  D = Deleted  ? = Untracked║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorWarning
    } else {
        Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                  ✅ WORKING TREE CLEAN ✅                ║
    ║                                                          ║
    ║      ┌─────────────────────────┐                        ║
    ║      │    No local changes     │                        ║
    ║      └─────────────────────────┘                        ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorSuccess
    }
}

function Show-OperationArt {
    param([string]$operation)
    switch ($operation) {
        "commit" {
            Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                   📝 COMMITTING CHANGES 📝               ║
    ║                                                          ║
    ║      ┌─ Working Directory ─┐                            ║
    ║      │     [Changes]       │                            ║
    ║      └─────────┬───────────┘                            ║
    ║                │ git add .                              ║
    ║                ▼                                        ║
    ║      ┌─ Staging Area ──────┐                            ║
    ║      │    [Staged]         │                            ║
    ║      └─────────┬───────────┘                            ║
    ║                │ git commit                             ║
    ║                ▼                                        ║
    ║      ┌─ Repository ────────┐                            ║
    ║      │   [Committed]       │                            ║
    ║      └─────────────────────┘                            ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorAscii
        }
        "push" {
            Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    🚀 PUSHING TO REMOTE 🚀               ║
    ║                                                          ║
    ║   Local Repository          Remote Repository            ║
    ║   ┌─────────────────┐      ┌─────────────────┐          ║
    ║   │   [Commits]     │ ───► │   [Commits]     │          ║
    ║   │                 │      │                 │          ║
    ║   └─────────────────┘      └─────────────────┘          ║
    ║                                                          ║
    ║            Syncing your changes...                      ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorAscii
        }
        "pull" {
            Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                   📥 PULLING FROM REMOTE 📥              ║
    ║                                                          ║
    ║   Remote Repository         Local Repository             ║
    ║   ┌─────────────────┐      ┌─────────────────┐          ║
    ║   │   [Commits]     │ ───► │   [Commits]     │          ║
    ║   │                 │      │                 │          ║
    ║   └─────────────────┘      └─────────────────┘          ║
    ║                                                          ║
    ║           Getting latest changes...                     ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorAscii
        }
        "stash" {
            Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    📦 STASHING CHANGES 📦                ║
    ║                                                          ║
    ║   Working Directory                    Stash             ║
    ║   ┌─────────────────┐                ┌─────────┐        ║
    ║   │   [Changes]     │ ──────────────► │ [Saved] │        ║
    ║   │                 │                │         │        ║
    ║   └─────────────────┘                └─────────┘        ║
    ║                                                          ║
    ║           Safely storing your work...                   ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorAscii
        }
    }
}

function Invoke-QuickShip {
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    🚀 QUICK SHIP MODE 🚀                 ║
    ║                                                          ║
    ║    ⚡ FAST TRACK: Commit → Push → Deploy ⚡              ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorInfo
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if (-not $status) {
        Write-ColorOutput "✅ Working directory is clean - nothing to ship!" $ColorSuccess
        return $true
    }
    
    # Show what will be committed
    Write-ColorOutput "📋 Changes that will be committed:" $ColorInfo
    git status --short
    Write-Host ""
    
    # Handle unwanted files
    Write-ColorOutput "🧹 Checking for unwanted files..." $ColorWarning
      # List of files to ignore/stash
    $unwantedPatterns = @(
        "package-lock\.json",
        "react-app/package-lock\.json", 
        "data/scenes\.json",
        "\.log$",
        "node_modules/",
        "\.env\.local",
        "\.DS_Store",
        "Thumbs\.db"
    )
      # Check if any unwanted files are staged
    $foundUnwanted = $false
    foreach ($pattern in $unwantedPatterns) {
        try {
            $matchFound = git status --porcelain | Where-Object { $_ -match $pattern }
            if ($matchFound) {
                $foundUnwanted = $true
                Write-ColorOutput "  - Found unwanted file pattern: $pattern" $ColorWarning
            }
        } catch {
            # Ignore pattern matching errors
        }
    }
    
    if ($foundUnwanted) {
        Write-Host ""
        Write-ColorOutput "⚠️  Unwanted files detected. These will be handled automatically." $ColorWarning
        Write-Host ""
    }
    
    # Show warning and get confirmation
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                     ⚠️  WARNING ⚠️                       ║
    ║                                                          ║
    ║  QUICK SHIP will:                                        ║
    ║  1. Reset/ignore unwanted files (package-lock, logs)     ║
    ║  2. Add ALL remaining changes to git                     ║
    ║  3. Create a commit with auto-generated message          ║
    ║  4. Push to remote repository immediately                ║
    ║                                                          ║
    ║  This is a FAST operation - use with caution!           ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorError
    
    Write-Host ""
    $confirm = Read-Host "🚀 Proceed with QUICK SHIP? (y/N)"
    
    if ($confirm -notmatch "^[Yy]$") {
        Write-ColorOutput "❌ QUICK SHIP cancelled." $ColorWarning
        return $false
    }
    
    # Get commit message
    Write-Host ""
    $commitMessage = Read-Host "📝 Enter commit message (or press Enter for auto-message)"
    
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "🚀 Quick ship: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    # Start the shipping process
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                  🚀 SHIPPING IN PROGRESS 🚀              ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorSuccess
    
    # Reset unwanted files
    Write-ColorOutput "🧹 Step 1: Cleaning unwanted files..." $ColorInfo
    foreach ($pattern in $unwantedPatterns) {
        try {
            $matchFound = git status --porcelain | Where-Object { $_ -match $pattern }
            if ($matchFound) {
                Write-ColorOutput "  - Resetting: $pattern" $ColorWarning
                git checkout -- $pattern 2>$null
                git clean -f $pattern 2>$null
            }
        } catch {
            # Ignore errors for files that don't exist
        }
    }
      # Add all remaining changes
    Write-ColorOutput "📦 Step 2: Adding changes to git..." $ColorInfo
    git add .
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  ✅ Changes added successfully" $ColorSuccess
    } else {
        Write-ColorOutput "  ❌ Failed to add changes" $ColorError
        return $false
    }
      # Create commit
    Write-ColorOutput "💾 Step 3: Creating commit..." $ColorInfo
    Show-OperationArt -operation "commit"
    git commit -m $commitMessage
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  ✅ Commit created successfully" $ColorSuccess
    } else {
        Write-ColorOutput "  ❌ Failed to create commit" $ColorError
        return $false
    }
    
    # Push to remote
    Write-ColorOutput "🚀 Step 4: Pushing to remote..." $ColorInfo
    Show-OperationArt -operation "push"
    $currentBranch = Get-CurrentBranch
    git push origin $currentBranch
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  ✅ Push completed successfully" $ColorSuccess
    } else {
        Write-ColorOutput "  ❌ Failed to push to remote" $ColorError
        Write-ColorOutput "  💡 Commit was created locally - you can push manually later" $ColorWarning
        return $false
    }
    
    # Success message
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    🎉 SHIP SUCCESSFUL! 🎉                ║
    ║                                                          ║
    ║    Your changes have been committed and pushed!          ║
    ║    🚀 Ready for deployment! 🚀                          ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorSuccess
    
    return $true
}

function Show-Header {
    Clear-Host
    Write-ColorOutput @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ██████╗ ██╗████████╗    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗   ║
║    ██╔════╝ ██║╚══██╔══╝    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝   ║
║    ██║  ███╗██║   ██║       ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗  ║
║    ██║   ██║██║   ██║       ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║  ║
║    ╚██████╔╝██║   ██║       ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝  ║
║     ╚═════╝ ╚═╝   ╚═╝       ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝   ║
║                                                                              ║
║                    🎨 ArtBastard DMX512 - Git Manager v$ScriptVersion 🎨                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ $ColorInfo
}

function Get-CurrentBranch {
    try {
        $branch = git branch --show-current
        return $branch.Trim()
    } catch {
        return "unknown"
    }
}

function Get-StashCount {
    try {
        $stashes = git stash list
        if ($stashes) {
            return $stashes.Count
        }
        return 0
    } catch {
        return 0
    }
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
    Write-ColorOutput "🔍 Analyzing repository status..." $ColorInfo
    try {
        $status = git status --porcelain
        $hasChanges = $status.Count -gt 0
        
        if ($hasChanges) {
            Show-ChangesArt -hasChanges $true
            Write-ColorOutput "📋 Current changes:" $ColorWarning
            git status --short
            return $true
        } else {
            Show-ChangesArt -hasChanges $false
            return $false
        }
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to check git status." $ColorError
        return $false
    }
}

function Invoke-StashChanges {
    Show-OperationArt -operation "stash"
    Write-ColorOutput "📦 Stashing local changes..." $ColorInfo
    try {
        $stashMessage = "Auto-stash: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git stash push -m $stashMessage
        Write-ColorOutput "✅ Changes stashed successfully with message: $stashMessage" $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to stash changes." $ColorError
        return $false
    }
}

function Invoke-PullLatest {
    Show-OperationArt -operation "pull"
    Write-ColorOutput "📥 Pulling latest code from remote..." $ColorInfo
    try {
        $currentBranch = Get-CurrentBranch
        git pull origin $currentBranch
        Write-ColorOutput "✅ Successfully pulled latest code from origin/$currentBranch" $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to pull latest code." $ColorError
        Write-ColorOutput "⚠️  You may need to resolve conflicts manually." $ColorWarning
        return $false
    }
}

function Invoke-CreateCommit {
    Show-OperationArt -operation "commit"
    Write-ColorOutput "📝 Creating a new commit..." $ColorInfo
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if (-not $status) {
        Write-ColorOutput "⚠️  No changes to commit." $ColorWarning
        return $false
    }
    
    # Show current changes
    Write-ColorOutput "📋 Current changes to be committed:" $ColorInfo
    git status --short
    Write-Host ""
    
    # Get commit message
    $commitMessage = Read-Host "💬 Enter commit message"
    if (-not $commitMessage) {
        Write-ColorOutput "❌ Commit cancelled - no message provided." $ColorWarning
        return $false
    }
    
    try {
        # Add all changes
        Write-ColorOutput "📂 Adding all changes to staging area..." $ColorInfo
        git add .
        
        # Commit changes
        Write-ColorOutput "💾 Committing changes..." $ColorInfo
        git commit -m $commitMessage
        
        Write-ColorOutput "✅ Commit created successfully!" $ColorSuccess
        Write-ColorOutput "📝 Message: $commitMessage" $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to create commit." $ColorError
        return $false
    }
}

function Invoke-PushChanges {
    Show-OperationArt -operation "push"
    Write-ColorOutput "🚀 Pushing changes to remote..." $ColorInfo
    try {
        $currentBranch = Get-CurrentBranch
        git push origin $currentBranch
        Write-ColorOutput "✅ Changes pushed successfully to origin/$currentBranch" $ColorSuccess
        return $true
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to push changes." $ColorError
        return $false
    }
}

function Show-GitLog {
    Write-ColorOutput "📚 Recent git history:" $ColorInfo
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    📜 COMMIT HISTORY 📜                  ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorAscii
    try {
        git log --oneline -10 --graph --decorate
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to show git log." $ColorError
    }
}

function Show-StashList {
    $stashCount = Get-StashCount
    Show-StashStatusArt -stashCount $stashCount
    
    try {
        $stashes = git stash list
        if ($stashes) {
            Write-ColorOutput "📦 Available stashes:" $ColorInfo
            git stash list
        } else {
            Write-ColorOutput "📭 No stashes found." $ColorInfo
        }
    } catch {
        Write-ColorOutput "❌ ERROR: Failed to show stash list." $ColorError
    }
}

function Invoke-StashAndPull {
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║               🔄 STASH AND PULL OPERATION 🔄             ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorInfo
    
    # Check for local changes
    $hasChanges = Get-GitStatus
    
    if ($hasChanges) {
        Write-Host ""
        Write-ColorOutput "⚠️  You have local changes that need to be handled." $ColorWarning
        Write-ColorOutput "Options:" $ColorInfo
        Write-ColorOutput "  [S] Stash changes and pull latest" $ColorMenu
        Write-ColorOutput "  [I] Ignore changes and pull anyway (risky)" $ColorMenu
        Write-ColorOutput "  [C] Cancel operation" $ColorMenu
        Write-Host ""
        
        $choice = Read-Host "Choose an option (S/I/C)"
        
        switch ($choice.ToUpper()) {
            "S" {
                if (Invoke-StashChanges) {
                    Start-Sleep -Seconds 1
                    Invoke-PullLatest
                }
            }
            "I" {
                Write-ColorOutput "⚠️  Proceeding without stashing (this may cause conflicts)..." $ColorWarning
                Invoke-PullLatest
            }
            default {
                Write-ColorOutput "❌ Operation cancelled." $ColorWarning
            }
        }
    } else {
        Invoke-PullLatest
    }
}

function Show-Menu {
    $currentBranch = Get-CurrentBranch
    $stashCount = Get-StashCount
      Show-GitBranchArt -branchName $currentBranch
    Show-StashStatusArt -stashCount $stashCount
    
    Write-Host ""
    Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    🎛️  GIT OPERATIONS 🎛️                 ║
    ║                                                          ║
    ║    🚀 QUICK ACTIONS (Press Enter for #1):               ║
    ║    1. 🚀 QUICK SHIP              ⚡ FAST TRACK          ║
    ║       (Commit + Clean + Push All)                        ║
    ║                                                          ║
    ║    PRIMARY ACTIONS (Most Common):                        ║
    ║    2. 📝 Create Commit           ⭐ PRIORITY             ║
    ║    3. 🚀 Push Changes            ⭐ PRIORITY             ║
    ║    4. 🔄 Stash & Pull Latest     ⭐ PRIORITY             ║
    ║                                                          ║
    ║    ─────────────────────────────────────────────────────  ║
    ║                                                          ║
    ║    SECONDARY ACTIONS:                                    ║
    ║    5. 📊 Check Status                                    ║
    ║    6. 📚 View Git Log                                    ║
    ║    7. 📦 Show Stash List                                 ║
    ║    8. 📋 Manual Git Status                               ║
    ║                                                          ║
    ║    ─────────────────────────────────────────────────────  ║
    ║                                                          ║
    ║    0. 🚪 Exit                                            ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorMenu
}

function Start-InteractiveMode {
    while ($true) {
        Show-Header
        Show-Menu
          $choice = Read-Host "🎯 Select an option (Enter for QUICK SHIP)"
        
        # Default to option 1 (QUICK SHIP) if Enter is pressed
        if ([string]::IsNullOrWhiteSpace($choice)) {
            $choice = "1"
        }
        
        switch ($choice) {
            "1" {
                Write-Host ""
                Invoke-QuickShip
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "2" {
                Write-Host ""
                Invoke-CreateCommit
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "3" {
                Write-Host ""
                Invoke-PushChanges
                Write-Host ""
                Read-Host "Press Enter to continue"
            }            "4" {
                Write-Host ""
                Invoke-StashAndPull
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "5" {
                Write-Host ""
                if (Get-GitStatus) {
                    Show-ChangesArt -hasChanges $true
                } else {
                    Show-ChangesArt -hasChanges $false
                }
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "6" {
                Write-Host ""
                Show-GitLog
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "7" {
                Write-Host ""
                Show-StashList
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "8" {
                Write-Host ""
                Write-ColorOutput "📋 Raw git status output:" $ColorInfo
                git status
                Write-Host ""
                Read-Host "Press Enter to continue"
            }
            "0" {
                Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                     👋 GOODBYE! 👋                       ║
    ║                                                          ║
    ║      Thanks for using ArtBastard Git Manager!           ║
    ║      May your commits be clean and your merges smooth!  ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorSuccess
                exit 0
            }            default {
                Write-ColorOutput @"

    ╔══════════════════════════════════════════════════════════╗
    ║                    ❌ INVALID OPTION ❌                  ║
    ║                                                          ║
    ║      Please select a number from 0-8                    ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

"@ $ColorError
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
