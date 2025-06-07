# 🔧 Git Management - Quick Reference

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
.\git-manager.ps1
```

### Unix/Linux/macOS
```bash
./git-manager.sh
```

## 📋 Menu Options

| Option | Action | Description |
|--------|--------|-------------|
| **1** | Check Status | View current git status |
| **2** | Stash & Pull | **⭐ Most Common** - Safely update with latest code |
| **3** | Create Commit | Add all changes and commit |
| **4** | Push Changes | Push commits to remote |
| **5** | View Git Log | Show recent commit history |
| **6** | Show Stashes | List all available stashes |
| **7** | Manual Status | Raw git status output |
| **0** | Exit | Close the script |

## 🔄 Common Workflows

### Update Local Code
1. Run script
2. Choose option **2** (Stash & Pull)
3. Confirm to stash local changes
4. ✅ Latest code pulled automatically

### Make a Commit
1. Make your changes
2. Run script  
3. Choose option **3** (Create Commit)
4. Enter commit message
5. Choose option **4** (Push Changes)

### Check What Changed
1. Run script
2. Choose option **1** (Check Status)
3. Review changes

## ⚠️ Important Notes

- **Package lock files ignored** - `package-lock.json` files are now in `.gitignore`
- **Safe stashing** - Local changes are preserved before pulling
- **Assumes `main` branch** - Modify scripts if using different branch
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
