#!/bin/bash
# MEGA-MAINTENANCE SCRIPT FOR ARTBASTARD DMX512 (Bash Edition)
# Combines CLEANUP and QUICKSTART functionality with menu-driven interface
# Version: 1.0.0
# Last Updated: June 8, 2025

# Script configuration
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Colors
C_TITLE="\033[1;35m"      # Magenta
C_MENU="\033[1;36m"       # Cyan
C_WARNING="\033[1;33m"    # Yellow
C_SUCCESS="\033[1;32m"    # Green
C_ERROR="\033[1;31m"      # Red
C_INFO="\033[1;37m"       # White
C_COUNTDOWN="\033[0;33m"  # Dark Yellow
C_RESET="\033[0m"

# Parse command line arguments
AUTO_FAST=false
AUTO_FULL=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fast)
            AUTO_FAST=true
            shift
            ;;
        --auto-full)
            AUTO_FULL=true
            shift
            ;;
        --help|-h)
            SHOW_HELP=true
            shift
            ;;
        *)
            echo -e "${C_ERROR}Unknown option: $1${C_RESET}"
            exit 1
            ;;
    esac
done

function show_banner() {
    echo -e "${C_TITLE}"
    cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║          🎭✨ MEGA-MAINTENANCE ORCHESTRATOR ✨🎭          ║
    ║                                                          ║
    ║              ArtBastard DMX512 Project                   ║
    ║                   Version 1.0.0                         ║
    ╚══════════════════════════════════════════════════════════╝

EOF
    echo -e "${C_RESET}"
}

function show_menu() {
    echo -e "${C_MENU}\n🎬 MEGA-MAINTENANCE MENU 🎬${C_RESET}"
    echo -e "${C_MENU}────────────────────────────────────────${C_RESET}"
    echo -e "${C_SUCCESS}  [ENTER] 🚀 QUICK CLEAN & START (Default - 3s countdown)${C_RESET}"
    echo -e "${C_INFO}  [B]     🔄 AUTO CLEAN FULL & QUICKSTART${C_RESET}"
    echo -e "${C_INFO}  [C]     🧹 CLEANUP ONLY (Full)${C_RESET}"
    echo -e "${C_INFO}  [S]     ▶️  JUST START (Skip cleanup)${C_RESET}"
    echo -e "${C_INFO}  [G]     📦 GIT MANAGER${C_RESET}"
    echo -e "${C_ERROR}  [Q]     ❌ QUIT${C_RESET}"
    echo -e "${C_MENU}────────────────────────────────────────${C_RESET}"
}

function start_countdown() {
    local seconds=${1:-3}
    
    echo -e "${C_COUNTDOWN}\n⏰ Starting QUICK CLEAN & START in:${C_RESET}"
    
    for ((i=seconds; i>0; i--)); do
        echo -ne "${C_COUNTDOWN}   $i seconds... (Press any key to show menu)${C_RESET}"
        
        # Check for key press with timeout
        if read -t 1 -n 1; then
            echo -e "\n"
            return 1  # User pressed a key
        fi
        
        echo -ne "\r"
        echo -ne "$(printf '%*s' 50 '')"  # Clear line
        echo -ne "\r"
    done
    
    echo -e "${C_SUCCESS}🚀 GO!${C_RESET}"
    return 0  # Countdown completed
}

function kill_processes_fast() {
    echo -e "${C_WARNING}💀 Terminating running processes...${C_RESET}"
    
    # Kill by port (fast method)
    for port in 3030 3001 5000 8080; do
        local pids=$(lsof -ti :$port 2>/dev/null)
        if [ -n "$pids" ]; then
            echo $pids | xargs kill -9 2>/dev/null
        fi
    done
    
    # Kill Node processes
    pkill -f node 2>/dev/null || true
    
    echo -e "${C_SUCCESS}✅ Processes terminated${C_RESET}"
}

function invoke_quick_clean() {
    echo -e "${C_SUCCESS}\n🧹 QUICK CLEAN MODE${C_RESET}"
    kill_processes_fast
    
    # Fast path removal
    local paths=("dist" "react-app/dist" "launcher/dist" ".vite" "react-app/.vite" ".eslintcache" "react-app/.eslintcache")
    
    for path in "${paths[@]}"; do
        if [ -e "$path" ]; then
            rm -rf "$path" 2>/dev/null
        fi
    done
    
    echo -e "${C_SUCCESS}✅ Quick clean completed${C_RESET}"
}

function invoke_full_clean() {
    echo -e "${C_WARNING}\n🧼 FULL CLEANUP MODE${C_RESET}"
    
    # Kill processes first
    kill_processes_fast
    
    echo -e "${C_INFO}🗑️ Removing build artifacts...${C_RESET}"
    local build_paths=("dist" "react-app/dist" "launcher/dist")
    for path in "${build_paths[@]}"; do
        if [ -e "$path" ]; then
            rm -rf "$path" 2>/dev/null
            echo -e "${C_SUCCESS}  ✓ Removed $path${C_RESET}"
        fi
    done
    
    echo -e "${C_INFO}🧹 Clearing caches...${C_RESET}"
    local cache_paths=(".vite" "react-app/.vite" ".eslintcache" "react-app/.eslintcache")
    for path in "${cache_paths[@]}"; do
        if [ -e "$path" ]; then
            rm -rf "$path" 2>/dev/null
            echo -e "${C_SUCCESS}  ✓ Cleared $path${C_RESET}"
        fi
    done
    
    # Remove TypeScript build info files
    find . -name "*.tsbuildinfo" -delete 2>/dev/null
    
    echo -e "${C_WARNING}📦 Removing node_modules...${C_RESET}"
    local node_paths=("node_modules" "react-app/node_modules" "launcher/node_modules")
    for path in "${node_paths[@]}"; do
        if [ -d "$path" ]; then
            echo -e "${C_INFO}  🗑️ Removing $path...${C_RESET}"
            rm -rf "$path" 2>/dev/null
            echo -e "${C_SUCCESS}  ✅ Removed $path${C_RESET}"
        fi
    done
    
    echo -e "${C_INFO}🧹 Clearing logs...${C_RESET}"
    if [ -d "logs" ]; then
        rm -rf "logs" 2>/dev/null
        echo -e "${C_SUCCESS}  ✓ Logs cleared${C_RESET}"
    fi
    
    echo -e "${C_SUCCESS}✨ FULL CLEANUP COMPLETED${C_RESET}"
}

function invoke_quickstart() {
    echo -e "${C_SUCCESS}\n🚀 QUICKSTART MODE${C_RESET}"
    
    # Verify project structure
    if [ ! -f "package.json" ] || [ ! -d "react-app" ]; then
        echo -e "${C_ERROR}🛑 Invalid project structure! Missing package.json or react-app directory.${C_RESET}"
        return 1
    fi
    
    echo -e "${C_INFO}📦 Installing dependencies...${C_RESET}"
    
    # Install root dependencies
    echo -e "${C_INFO}  → Root dependencies...${C_RESET}"
    npm install --prefer-offline --no-audit --progress=false >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${C_ERROR}💔 Root npm install failed!${C_RESET}"
        return 1
    fi
    
    # Install frontend dependencies
    echo -e "${C_INFO}  → Frontend dependencies...${C_RESET}"
    cd "react-app"
    npm install --prefer-offline --no-audit --progress=false >/dev/null 2>&1
    local frontend_result=$?
    cd ..
    
    if [ $frontend_result -ne 0 ]; then
        echo -e "${C_ERROR}💔 Frontend npm install failed!${C_RESET}"
        return 1
    fi
    
    echo -e "${C_SUCCESS}✅ Dependencies installed${C_RESET}"
    
    # Start backend server
    echo -e "${C_SUCCESS}\n🎬 Starting backend server...${C_RESET}"
    
    # Create a new terminal window for backend (works on most Linux systems)
    if command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="ArtBastard DMX512 Backend" -- bash -c "
            echo '🌟 ArtBastard DMX512 Backend Server 🌟'
            echo 'Server running on port 3030. Close this window to stop.'
            cd '$SCRIPT_DIR'
            node start-server.js
            echo 'Server stopped. Press Enter to close.'
            read
        " &
    elif command -v xterm >/dev/null 2>&1; then
        xterm -title "ArtBastard DMX512 Backend" -e bash -c "
            echo '🌟 ArtBastard DMX512 Backend Server 🌟'
            echo 'Server running on port 3030. Close this window to stop.'
            cd '$SCRIPT_DIR'
            node start-server.js
            echo 'Server stopped. Press Enter to close.'
            read
        " &
    else
        # Fallback: start in background
        echo -e "${C_WARNING}⚠️ No terminal emulator found. Starting backend in background...${C_RESET}"
        nohup node start-server.js > backend.log 2>&1 &
        echo -e "${C_INFO}Backend PID: $!${C_RESET}"
        echo -e "${C_INFO}Log file: backend.log${C_RESET}"
    fi
    
    # Get all available IP addresses for network access
    echo -e "${C_SUCCESS}🚀 Backend server started!${C_RESET}"
    
    # Collect all network IPs
    local network_ips=()
    
    # Method 1: Try ip command (most Linux distributions)
    if command -v ip >/dev/null 2>&1; then
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                network_ips+=("$line")
            fi
        done < <(ip addr show | grep -E 'inet [0-9]' | grep -v '127.0.0.1' | grep -v '169.254.' | awk '{print $2}' | cut -d'/' -f1)
    fi
    
    # Method 2: Try hostname command (fallback)
    if [ ${#network_ips[@]} -eq 0 ] && command -v hostname >/dev/null 2>&1; then
        local hostname_ip
        hostname_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
        if [ -n "$hostname_ip" ] && [ "$hostname_ip" != "127.0.0.1" ]; then
            network_ips+=("$hostname_ip")
        fi
    fi
    
    # Method 3: Try ifconfig (older systems)
    if [ ${#network_ips[@]} -eq 0 ] && command -v ifconfig >/dev/null 2>&1; then
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                network_ips+=("$line")
            fi
        done < <(ifconfig | grep -E 'inet [0-9]' | grep -v '127.0.0.1' | grep -v '169.254.' | awk '{print $2}')
    fi
    
    echo -e "${C_WARNING}\n💡 FRONTEND SETUP REQUIRED:${C_RESET}"
    echo -e "${C_MENU}────────────────────────────────────────${C_RESET}"
    echo -e "${C_INFO}Open a NEW terminal and run:${C_RESET}"
    echo -e "${C_INFO}  cd react-app${C_RESET}"
    echo -e "${C_INFO}  npm run dev${C_RESET}"
    echo -e "${C_MENU}\n🌐 Access URLs:${C_RESET}"
    echo -e "${C_INFO}  Local:     http://localhost:3001${C_RESET}"
    
    # Display all network IPs
    if [ ${#network_ips[@]} -gt 0 ]; then
        for ip in "${network_ips[@]}"; do
            echo -e "${C_SUCCESS}  Network:   http://$ip:3001${C_RESET}"
        done
    else
        echo -e "${C_WARNING}  Network:   No network interfaces detected${C_RESET}"
    fi
    
    echo -e "${C_MENU}────────────────────────────────────────${C_RESET}"
    
    return 0
}

function invoke_git_manager() {
    echo -e "${C_INFO}\n📦 Starting Git Manager...${C_RESET}"
    if [ -f "git-manager.sh" ]; then
        bash "./git-manager.sh"
    else
        echo -e "${C_ERROR}🛑 git-manager.sh not found!${C_RESET}"
    fi
}

function show_help() {
    show_banner
    echo -e "${C_INFO}USAGE:
  ./MEGA-MAINTENANCE.sh                     # Interactive mode with countdown
  ./MEGA-MAINTENANCE.sh --auto-fast         # Quick clean & start (no interaction)
  ./MEGA-MAINTENANCE.sh --auto-full         # Full clean & start (no interaction)
  ./MEGA-MAINTENANCE.sh --help              # Show this help

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
  • Comprehensive cleanup options${C_RESET}"
}

function main() {
    cd "$SCRIPT_DIR"
    
    # Handle automatic modes
    if [ "$AUTO_FAST" = true ]; then
        show_banner
        invoke_quick_clean
        invoke_quickstart
        return
    fi
    
    if [ "$AUTO_FULL" = true ]; then
        show_banner
        invoke_full_clean
        invoke_quickstart
        return
    fi
    
    # Interactive mode
    show_banner
    
    # Default countdown for quick start
    local show_menu=true
    if [ "$SHOW_HELP" = false ]; then
        if start_countdown 3; then
            show_menu=false
        fi
    fi
    
    if [ "$show_menu" = false ]; then
        invoke_quick_clean
        invoke_quickstart
        return
    fi
    
    # Interactive menu loop
    local continue=true
    while [ "$continue" = true ]; do
        show_menu
        echo -ne "${C_MENU}\nSelect option: ${C_RESET}"
        
        read -r choice
        choice=$(echo "$choice" | tr '[:lower:]' '[:upper:]' | xargs)
        
        case "$choice" in
            "")  # Enter key - Quick Clean & Start
                invoke_quick_clean
                invoke_quickstart
                continue=false
                ;;
            "B")  # Auto Clean Full & Quickstart
                invoke_full_clean
                invoke_quickstart
                continue=false
                ;;
            "C")  # Cleanup Only
                invoke_full_clean
                echo -e "${C_SUCCESS}\n✨ Cleanup completed. Choose another option or quit.${C_RESET}"
                continue=true
                ;;
            "S")  # Just Start
                invoke_quickstart
                continue=false
                ;;
            "G")  # Git Manager
                invoke_git_manager
                continue=true
                ;;
            "Q")  # Quit
                echo -e "${C_SUCCESS}\n👋 Goodbye! May your lights be bright!${C_RESET}"
                continue=false
                ;;
            *)
                echo -e "${C_ERROR}\n❌ Invalid option. Please try again.${C_RESET}"
                continue=true
                ;;
        esac
    done
}

# Main execution
if [ "$SHOW_HELP" = true ]; then
    show_help
    exit 0
fi

# Make sure we're in the right directory
if [ ! -f "$SCRIPT_DIR/package.json" ] || [ ! -d "$SCRIPT_DIR/react-app" ]; then
    echo -e "${C_ERROR}🛑 This script must be run from the ArtBastard DMX512 project root!${C_RESET}"
    echo -e "${C_ERROR}Ensure 'package.json' and 'react-app' directory are present.${C_RESET}"
    exit 1
fi

# Run main function
main
