# Git Management Scripts v2.0

Interactive menu-driven scripts with rich ASCII art visualization for managing git operations in the ArtBastard DMX512 project.

## Files Created

- **`git-manager.ps1`** - Enhanced PowerShell version for Windows (v2.0)
- **`git-manager.sh`** - Enhanced shell script version for Unix/Linux/macOS (v2.0)
- **Updated `.gitignore`** - Now ignores `package-lock.json` files

## Version 2.0 Enhancements

### 🎨 Visual Enhancements
- **ASCII Art Header** - Large "GIT MANAGER" logo with branding
- **Current Branch Display** - Visual box showing active git branch
- **Stash Status Visualization** - Shows stash count with emoji indicators
- **Operation-Specific Art** - Visual diagrams for commit workflow, push/pull operations, and stash actions
- **Changes Detection Art** - Visual indicators for clean vs dirty working tree
- **Enhanced Color Coding** - Improved color scheme for different message types

### 📊 Menu Restructuring
**PRIMARY ACTIONS (Most Common):**
1. **📝 Create Commit** - ⭐ PRIORITY - Add all changes and create a commit
2. **🚀 Push Changes** - ⭐ PRIORITY - Push commits to remote repository  
3. **🔄 Stash & Pull Latest** - ⭐ PRIORITY - Enhanced stash handling with multiple options

**SECONDARY ACTIONS:**
4. **📊 Check Status** - View current git status with visual indicators
5. **📚 View Git Log** - Show recent commit history
6. **📦 Show Stash List** - Display all available stashes
7. **📋 Manual Git Status** - Raw git status output

### 🛡️ Enhanced Stash Handling
When local changes are detected during "Stash & Pull Latest":
- **[S] Stash changes and pull latest** - Safe automatic stashing
- **[I] Ignore changes and pull anyway** - Risky but available option
- **[C] Cancel operation** - Safe exit option

### 🔧 Technical Improvements
- **Dynamic Branch Detection** - No longer hardcoded to "main" branch
- **Smart Status Detection** - Visual feedback for repository state
- **Enhanced Error Messages** - More informative error handling
- **Cross-Platform Compatibility** - Identical functionality across PowerShell and shell versions

## Features

### 📋 Menu Options
1. **Check Status** - View current git status
2. **Stash Changes & Pull Latest** - Safely stash local changes and pull latest code
3. **Create Commit** - Add all changes and create a commit
4. **Push Changes** - Push commits to remote repository
5. **View Git Log** - Show recent commit history
6. **Show Stash List** - Display all available stashes
7. **Manual Git Status** - Raw git status output

### 🔧 Key Features
- **Rich ASCII Art Interface** - Beautiful visual feedback for all operations
- **Smart Branch Detection** - Automatically detects and uses current branch
- **Enhanced Stash Handling** - Multiple options for handling local changes
- **Safe Operation Defaults** - Confirms destructive operations with visual prompts
- **Colored Output** - Comprehensive color coding for different message types
- **Error Handling** - Graceful error recovery with helpful suggestions
- **Cross-platform** - Identical functionality on Windows, macOS, and Linux
- **Visual Status Indicators** - ASCII art showing repository state and stash status

## Usage

### Windows (PowerShell)
```powershell
# Run interactive menu
.\git-manager.ps1

# Show help
.\git-manager.ps1 -Help
```

### Unix/Linux/macOS (Bash)
```bash
# Make executable (first time only)
chmod +x git-manager.sh

# Run interactive menu
./git-manager.sh

# Show help
./git-manager.sh --help
```

## GitIgnore Updates

The `.gitignore` file has been updated to exclude:
- `package-lock.json` (root directory)
- `react-app/package-lock.json` (frontend directory)

This prevents package lock files from being tracked in version control, which can cause conflicts when different developers use different package manager versions.

## Common Workflows

### 🔄 Update Local Repository
1. Run the script: `.\git-manager.ps1` (Windows) or `./git-manager.sh` (Unix)
2. Choose option **2** (Stash Changes & Pull Latest)
3. Confirm when prompted to stash local changes
4. Script will automatically pull latest code

### 📝 Create and Push Commit
1. Make your code changes
2. Run the script
3. Choose option **3** (Create Commit)
4. Enter a descriptive commit message
5. Choose option **4** (Push Changes)

### 🔍 Check Project Status
1. Run the script
2. Choose option **1** (Check Status)
3. View current changes and repository state

## Safety Features

- **Confirmation prompts** - Asks before stashing changes
- **Clean directory detection** - Skips stashing if no changes exist
- **Error messages** - Clear feedback on what went wrong
- **Repository validation** - Ensures you're in a git repository

## Troubleshooting

### Script Won't Run (Windows)
If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script Won't Run (Unix/Linux)
Make sure the script is executable:
```bash
chmod +x git-manager.sh
```

### Git Commands Fail
- Ensure you have git installed and configured
- Check that you're in the correct project directory
- Verify you have network connectivity for push/pull operations

## Script Details

### Stash Behavior
- Creates timestamped stash messages
- Preserves all local changes including untracked files
- Automatically pulls after successful stashing

### Commit Behavior
- Adds all changes (tracked and untracked)
- Requires commit message input
- Shows current changes before committing

### Branch Assumptions
- Scripts assume you're working with the `main` branch
- Modify the scripts if you use a different default branch

## Customization

To modify the default branch from `main` to something else:

1. **PowerShell script**: Edit lines containing `origin main`
2. **Shell script**: Edit lines containing `origin main`

Example:
```bash
# Change from:
git pull origin main
git push origin main

# To:
git pull origin master
git push origin master
```

## Integration with Existing Scripts

These git management scripts complement the existing project scripts:
- `QUICKSTART.ps1` / `QUICKSTART.sh` - Project setup
- `RESTART.ps1` / `RESTART.sh` - Service restart
- `CLEANUP.ps1` / `CLEANUP.sh` - Project cleanup

Use the git management scripts when you need to sync with the remote repository or manage version control operations.
