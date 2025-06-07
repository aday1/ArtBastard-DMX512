# 🔧 Git Management v2.0 - Quick Reference

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
.\git-manager.ps1
```

### Unix/Linux/macOS
```bash
./git-manager.sh
```

## 📋 Enhanced Menu (v2.0)

### 🌟 PRIMARY ACTIONS (Most Common)
| Option | Action | Description |
|--------|--------|-------------|
| **1** | 📝 Create Commit | ⭐ PRIORITY - Add all changes and commit |
| **2** | 🚀 Push Changes | ⭐ PRIORITY - Push commits to remote |
| **3** | 🔄 Stash & Pull | ⭐ PRIORITY - Enhanced stash handling + pull latest |

### 📊 SECONDARY ACTIONS
| Option | Action | Description |
|--------|--------|-------------|
| **4** | 📊 Check Status | View current status with visual indicators |
| **5** | 📚 View Git Log | Show recent commit history |
| **6** | 📦 Show Stashes | List all available stashes |
| **7** | 📋 Manual Status | Raw git status output |
| **0** | 🚪 Exit | Close the script |

## 🎨 Visual Features (v2.0)
- **ASCII Art Header** - Large "GIT MANAGER" branding
- **Current Branch Display** - Shows active branch in decorative box
- **Stash Status Visualization** - Visual stash count and indicators  
- **Operation Art** - Diagrams for commit workflow, push/pull, stash operations
- **Smart Status Detection** - Visual feedback for clean vs dirty working tree

## 🔄 Common Workflows

### 📥 Update Local Code (Enhanced)
1. Run script
2. Choose **Option 3** (🔄 Stash & Pull Latest)
3. If changes detected, choose:
   - **[S]** Stash changes and pull (recommended)
   - **[I]** Ignore changes and pull anyway (risky)
   - **[C]** Cancel operation (safe exit)
4. ✅ Latest code pulled automatically

### 📝 Make and Push Changes (Prioritized Workflow)
1. Make your code changes
2. Run script  
3. Choose **Option 1** (📝 Create Commit) - Enter commit message
4. Choose **Option 2** (🚀 Push Changes) - Push to remote
### 📊 Check What Changed
1. Run script
2. Choose **Option 4** (📊 Check Status)
3. Review changes with visual indicators

### 🛡️ Enhanced Stash Handling (v2.0)
The v2.0 stash system provides multiple options when local changes are detected:
- **Visual Detection** - ASCII art shows if working tree is clean or dirty
- **Smart Options** - Choose how to handle existing changes  
- **Safe Defaults** - Cancel option prevents accidental data loss

## ⚠️ Important Notes

- **Package lock files ignored** - `package-lock.json` files are now in `.gitignore`
- **Enhanced stash handling** - Multiple options for handling local changes
- **Dynamic branch detection** - No longer assumes `main` branch (detects current branch)
- **Rich visual feedback** - ASCII art provides clear status information
- **Requires git setup** - Ensure git is configured with your credentials

## 🛠️ Troubleshooting

**PowerShell won't run script:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Shell script not executable:**
```bash
chmod +x git-manager.sh
```

**Git authentication issues:**
- Ensure SSH keys are set up OR
- Use HTTPS with username/password/token

---
*For detailed documentation, see `GIT-MANAGEMENT.md`*
