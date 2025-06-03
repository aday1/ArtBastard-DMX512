#!/bin/bash
# filepath: c:\Users\aday\Documents\GitHub\ARTBASTARD_DMX_STABLE\ArtBastard-DMX512\CLEANUP.sh

# Define some fabulous colors and emojis (Bash specific)
C_MAGENTA="\033[1;35m"
C_GREEN="\033[1;32m"
C_CYAN="\033[1;36m"
C_YELLOW="\033[1;33m"
C_RED="\033[1;31m"
C_DARK_RED="\033[0;31m"
C_DARK_GRAY="\033[1;30m"
C_DARK_CYAN="\033[0;36m"
C_GRAY="\033[0;37m" # For "already clean" messages
C_RESET="\033[0m"

echo -e "${C_MAGENTA}🧼✨ The ArtBastard's Grand Exfoliation Ritual! (Bash Edition) ✨🧼${C_RESET}"
echo -e "${C_DARK_GRAY}--------------------------------------------------------------------${C_RESET}"
echo -e "${C_CYAN}Ensuring a pristine stage for a flawless performance or a clean Git push!${C_RESET}"
echo ""

# Ensure we are at the project's magnificent proscenium (root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
if [ ! -f "$SCRIPT_DIR/package.json" ] || [ ! -d "$SCRIPT_DIR/react-app" ]; then
  echo -e "${C_RED}🛑 Hold the curtain! This ritual must be performed from the ArtBastard_DMX project's main stage!${C_RESET}"
  echo -e "${C_RED}Ensure 'package.json' and the 'react-app' directory are present.${C_RESET}"
  exit 1
fi
cd "$SCRIPT_DIR"
echo -e "${C_YELLOW}📍 Conducting cleanup from: $SCRIPT_DIR${C_RESET}"
echo ""

echo -e "${C_GREEN}🧹 Act I: Sweeping Away All Traces of Past Performances! 🧹${C_RESET}"
echo -e "${C_DARK_CYAN}(Builds, Logs, Caches, Node Modules, and Launcher Artifacts)${C_RESET}"

# Define the paths to artistic remnants
BACKEND_DIST_DIR="./dist"
FRONTEND_DIST_DIR="./react-app/dist"
LAUNCHER_DIST_DIR="./launcher-dist"
LOGS_DIR="./logs"
BACKEND_LOG_FILE="./backend.log" # Specific log file if it exists outside /logs
VITE_CACHE_DIR="./react-app/.vite"
ROOT_ESLINTCACHE="./.eslintcache"
REACT_APP_ESLINTCACHE="./react-app/.eslintcache"
ROOT_NODE_MODULES="./node_modules"
REACT_APP_NODE_MODULES="./react-app/node_modules"
LAUNCHER_NODE_MODULES="./launcher/node_modules" # Assuming launcher might have its own
ROOT_PACKAGE_LOCK="./package-lock.json"
REACT_APP_PACKAGE_LOCK="./react-app/package-lock.json"
LAUNCHER_PACKAGE_LOCK="./launcher/package-lock.json"

# Function to remove item with flair
remove_item_with_flair() {
    local path_to_remove="$1"
    local description="$2"
    if [ -e "$path_to_remove" ]; then # -e checks for file or directory
        echo -e "${C_DARK_CYAN}Removing $description: $path_to_remove 💨${C_RESET}"
        rm -rf "$path_to_remove"
        if [ $? -eq 0 ]; then
            echo -e "${C_GREEN}Successfully removed $path_to_remove${C_RESET}"
        else
            echo -e "${C_RED}Could not fully remove $path_to_remove. It might be in use or permissions issue.${C_RESET}"
        fi
    else
        echo -e "${C_GRAY}$description not found (already clean!): $path_to_remove ✨${C_RESET}"
    fi
}

# Vanquishing build directories
remove_item_with_flair "$BACKEND_DIST_DIR" "backend build directory"
remove_item_with_flair "$FRONTEND_DIST_DIR" "frontend build directory"
remove_item_with_flair "$LAUNCHER_DIST_DIR" "launcher build directory"

# Expunging logs
remove_item_with_flair "$LOGS_DIR" "logs directory"
remove_item_with_flair "$BACKEND_LOG_FILE" "backend log file" # If it's specific and outside /logs

# Obliterating caches
remove_item_with_flair "$VITE_CACHE_DIR" "Vite cache"
remove_item_with_flair "$ROOT_ESLINTCACHE" "root .eslintcache"
remove_item_with_flair "$REACT_APP_ESLINTCACHE" "react-app .eslintcache"

# Removing .tsbuildinfo files
echo -e "${C_DARK_CYAN}Removing root *.tsbuildinfo files 💨${C_RESET}"
find . -maxdepth 1 -name "*.tsbuildinfo" -exec rm -f {} \;
echo -e "${C_DARK_CYAN}Removing react-app/*.tsbuildinfo files 💨${C_RESET}"
find "./react-app" -maxdepth 1 -name "*.tsbuildinfo" -exec rm -f {} \;

# Banishing node_modules
remove_item_with_flair "$ROOT_NODE_MODULES" "root node_modules"
remove_item_with_flair "$REACT_APP_NODE_MODULES" "react-app node_modules"
remove_item_with_flair "$LAUNCHER_NODE_MODULES" "launcher node_modules"

echo ""
echo -e "${C_RED}🔥 Act II: Nuclear Option - Obliterating Package Locks & NPM Cache! 🔥${C_RESET}"
echo -e "${C_DARK_RED}(This will force complete dependency resolution on next install)${C_RESET}"

# Nuking package-lock.json files
remove_item_with_flair "$ROOT_PACKAGE_LOCK" "root package-lock.json"
remove_item_with_flair "$REACT_APP_PACKAGE_LOCK" "react-app package-lock.json"
remove_item_with_flair "$LAUNCHER_PACKAGE_LOCK" "launcher package-lock.json"

# Clearing npm cache with nuclear force
echo -e "${C_DARK_RED}Clearing NPM cache with --force flag... 💥${C_RESET}"
if npm cache clean --force 2>/dev/null; then
    echo -e "${C_GREEN}✅ NPM cache successfully nuked!${C_RESET}"
else
    echo -e "${C_RED}⚠️ Could not clean npm cache (exit code: $?)${C_RESET}"
fi

# Additional cleanup for stubborn npm issues
echo -e "${C_DARK_CYAN}Verifying NPM cache integrity... 🔍${C_RESET}"
if npm cache verify 2>/dev/null; then
    echo -e "${C_GREEN}✅ NPM cache verified successfully!${C_RESET}"
else
    echo -e "${C_RED}⚠️ NPM cache verify failed (exit code: $?)${C_RESET}"
fi

# Clear global npm cache if exists (Linux/macOS locations)
NPM_CACHE_DIR="$HOME/.npm"
if [ -d "$NPM_CACHE_DIR" ]; then
    remove_item_with_flair "$NPM_CACHE_DIR" "global npm cache (~/.npm)"
fi

# Additional npm cache locations for different systems
XDG_CACHE_NPM="$HOME/.cache/npm"
if [ -d "$XDG_CACHE_NPM" ]; then
    remove_item_with_flair "$XDG_CACHE_NPM" "XDG npm cache (~/.cache/npm)"
fi

echo ""
echo -e "${C_MAGENTA}🌟✨ Bravo! The ArtBastard's stage is impeccably clean! (Bash Edition) ✨🌟${C_RESET}"
echo -e "${C_CYAN}Ready for a fresh installation or a pristine commit.${C_RESET}"
echo -e "${C_DARK_GRAY}--------------------------------------------------------------------${C_RESET}"
