#!/bin/bash

# Git Management Script - Shell Version
# ArtBastard DMX512 Project
# Last Updated: June 7, 2025

set -e

# Script configuration
SCRIPT_NAME="Git Management Script"
SCRIPT_VERSION="2.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
MAGENTA='\033[0;35m'
DARK_CYAN='\033[36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show git branch art
show_git_branch_art() {
    local branch_name=$1
    printf "${MAGENTA}"
    printf "\n"
    printf "    ╔══════════════════════════════════════════════════════════╗\n"
    printf "    ║                    🌟 CURRENT BRANCH 🌟                  ║\n"
    printf "    ║                                                          ║\n"
    printf "    ║      ┌─── %-40s ───┐               ║\n" "$branch_name"
    printf "    ║      │                                            │      ║\n"
    printf "    ║      └────────────────────────────────────────────┘      ║\n"
    printf "    ╚══════════════════════════════════════════════════════════╝\n"
    printf "\n"
    printf "${NC}"
}

# Function to show stash status art
show_stash_status_art() {
    local stash_count=$1
    if [ "$stash_count" -gt 0 ]; then
        printf "${YELLOW}"
        printf "\n"
        printf "    ╔══════════════════════════════════════════════════════════╗\n"
        printf "    ║                   📦 STASH STATUS 📦                     ║\n"
        printf "    ║                                                          ║\n"
        printf "    ║      You have %d stash(es) saved:                       ║\n" "$stash_count"
        printf "    ║                                                          ║\n"
        printf "    ║      ┌─[📦]─[📦]─[📦]─[📦]─[📦]─┐                        ║\n"
        printf "    ║      │  Your saved changes      │                        ║\n"
        printf "    ║      └─────────────────────────┘                        ║\n"
        printf "    ╚══════════════════════════════════════════════════════════╝\n"
        printf "\n"
        printf "${NC}"
    fi
}

# Function to show changes art
show_changes_art() {
    local has_changes=$1
    if [ "$has_changes" = "true" ]; then
        printf "${YELLOW}"
        cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║                 ⚠️  CHANGES DETECTED ⚠️                  ║
    ║                                                          ║
    ║      ┌─[M]─[A]─[D]─[?]─┐                                ║
    ║      │ Local Changes   │                                ║
    ║      └─────────────────┘                                ║
    ║                                                          ║
    ║      M = Modified  A = Added  D = Deleted  ? = Untracked║
    ╚══════════════════════════════════════════════════════════╝

EOF
        printf "${NC}"
    else
        printf "${GREEN}"
        cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║                  ✅ WORKING TREE CLEAN ✅                ║
    ║                                                          ║
    ║      ┌─────────────────────────┐                        ║
    ║      │    No local changes     │                        ║
    ║      └─────────────────────────┘                        ║
    ╚══════════════════════════════════════════════════════════╝

EOF
        printf "${NC}"
    fi
}

# Function to show operation art
show_operation_art() {
    local operation=$1
    printf "${DARK_CYAN}"
    case $operation in
        "commit")
            cat << 'EOF'

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

EOF
            ;;
        "push")
            cat << 'EOF'

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

EOF
            ;;
        "pull")
            cat << 'EOF'

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

EOF
            ;;
        "stash")
            cat << 'EOF'

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

EOF
            ;;
    esac
    printf "${NC}"
}

# Function for quick ship (commit + push everything)
quick_ship() {
    printf "${CYAN}"
    cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║                    🚀 QUICK SHIP MODE 🚀                 ║
    ║                                                          ║
    ║    ⚡ FAST TRACK: Commit → Push → Deploy ⚡              ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

EOF
    printf "${NC}"
    
    # Check if there are changes to commit
    local status=$(git status --porcelain)
    if [ -z "$status" ]; then
        print_color $GREEN "✅ Working directory is clean - nothing to ship!"
        return 0
    fi
    
    # Show what will be committed
    print_color $CYAN "📋 Changes that will be committed:"
    git status --short
    echo ""
    
    # Handle unwanted files
    print_color $YELLOW "🧹 Checking for unwanted files..."
    
    # List of files to ignore/stash
    local unwanted_files=(
        "package-lock.json"
        "react-app/package-lock.json"
        "data/scenes.json"
        "*.log"
        "node_modules/"
        ".env.local"
        ".DS_Store"
        "Thumbs.db"
    )
    
    # Check if any unwanted files are staged
    local found_unwanted=false
    for pattern in "${unwanted_files[@]}"; do
        if git status --porcelain | grep -q "$pattern"; then
            found_unwanted=true
            print_color $YELLOW "  - Found unwanted file pattern: $pattern"
        fi
    done
    
    if [ "$found_unwanted" = true ]; then
        echo ""
        print_color $YELLOW "⚠️  Unwanted files detected. These will be handled automatically."
        echo ""
    fi
    
    # Show warning and get confirmation
    printf "${RED}"
    cat << 'EOF'

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

EOF
    printf "${NC}"
    
    echo ""
    read -p "🚀 Proceed with QUICK SHIP? (y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_color $YELLOW "❌ QUICK SHIP cancelled."
        return 1
    fi
    
    # Get commit message
    echo ""
    read -p "📝 Enter commit message (or press Enter for auto-message): " commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="🚀 Quick ship: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # Start the shipping process
    printf "${GREEN}"
    cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║                  🚀 SHIPPING IN PROGRESS 🚀              ║
    ╚══════════════════════════════════════════════════════════╝

EOF
    printf "${NC}"
    
    # Reset unwanted files
    print_color $CYAN "🧹 Step 1: Cleaning unwanted files..."
    for pattern in "${unwanted_files[@]}"; do
        if git status --porcelain | grep -q "$pattern"; then
            print_color $YELLOW "  - Resetting: $pattern"
            git checkout -- "$pattern" 2>/dev/null || true
            git clean -f "$pattern" 2>/dev/null || true
        fi
    done
    
    # Add all remaining changes
    print_color $CYAN "📦 Step 2: Adding changes to git..."
    if git add .; then
        print_color $GREEN "  ✅ Changes added successfully"
    else
        print_color $RED "  ❌ Failed to add changes"
        return 1
    fi
    
    # Create commit
    print_color $CYAN "💾 Step 3: Creating commit..."
    show_operation_art "commit"
    if git commit -m "$commit_message"; then
        print_color $GREEN "  ✅ Commit created successfully"
    else
        print_color $RED "  ❌ Failed to create commit"
        return 1
    fi
    
    # Push to remote
    print_color $CYAN "🚀 Step 4: Pushing to remote..."
    show_operation_art "push"
    local current_branch=$(get_current_branch)
    if git push origin "$current_branch"; then
        print_color $GREEN "  ✅ Push completed successfully"
    else
        print_color $RED "  ❌ Failed to push to remote"
        print_color $YELLOW "  💡 Commit was created locally - you can push manually later"
        return 1
    fi
    
    # Success message
    printf "${GREEN}"
    cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║                    🎉 SHIP SUCCESSFUL! 🎉                ║
    ║                                                          ║
    ║    Your changes have been committed and pushed!          ║
    ║    🚀 Ready for deployment! 🚀                          ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

EOF
    printf "${NC}"
    
    return 0
}

# Function to show header
show_header() {
    clear
    printf "${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ██████╗ ██╗████████╗    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗   ║
║    ██╔════╝ ██║╚══██╔══╝    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝   ║
║    ██║  ███╗██║   ██║       ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗  ║
║    ██║   ██║██║   ██║       ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║  ║
║    ╚██████╔╝██║   ██║       ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝  ║
║     ╚═════╝ ╚═╝   ╚═╝       ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝   ║
║                                                                              ║
║                    🎨 ArtBastard DMX512 - Git Manager v2.0.0 🎨                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    printf "${NC}"
}

# Function to get current branch
get_current_branch() {
    git branch --show-current 2>/dev/null || echo "unknown"
}

# Function to get stash count
get_stash_count() {
    git stash list 2>/dev/null | wc -l
}

# Function to show help
show_help() {
    show_header
    print_color $WHITE "USAGE:"
    print_color $WHITE "  ./git-manager.sh           - Run interactive menu"
    print_color $WHITE "  ./git-manager.sh --help    - Show this help"
    echo ""
    print_color $WHITE "DESCRIPTION:"
    print_color $WHITE "  Interactive menu-driven script for git operations."
    print_color $WHITE "  Handles stashing local changes and pulling latest code."
    echo ""
    print_color $WHITE "FEATURES:"
    print_color $WHITE "  • Check git status"
    print_color $WHITE "  • Stash local changes"
    print_color $WHITE "  • Pull latest code"
    print_color $WHITE "  • Create commits"
    print_color $WHITE "  • Push changes"
    print_color $WHITE "  • View git log"
    echo ""
    exit 0
}

# Function to test if we're in a git repository
test_git_repository() {
    if [ ! -d ".git" ]; then
        print_color $RED "ERROR: Not in a git repository!"
        print_color $YELLOW "Please run this script from the project root directory."
        return 1
    fi
    return 0
}

# Function to get git status
get_git_status() {
    print_color $CYAN "Checking git status..."
    local status=$(git status --porcelain)
    if [ -n "$status" ]; then
        print_color $YELLOW "Local changes detected:"
        git status --short
        return 0 # Has changes
    else
        print_color $GREEN "Working directory is clean."
        return 1 # No changes
    fi
}

# Function to stash changes
stash_changes() {
    print_color $CYAN "Stashing local changes..."
    local stash_message="Auto-stash: $(date '+%Y-%m-%d %H:%M:%S')"
    if git stash push -m "$stash_message"; then
        print_color $GREEN "✅ Changes stashed successfully."
        return 0
    else
        print_color $RED "ERROR: Failed to stash changes."
        return 1
    fi
}

# Function to pull latest code
pull_latest() {
    print_color $CYAN "Pulling latest code..."
    
    local current_branch=$(get_current_branch)
    if git pull origin "$current_branch"; then
        print_color $GREEN "✅ Successfully pulled latest code."
        return 0
    else
        print_color $RED "ERROR: Failed to pull latest code."
        print_color $YELLOW "You may need to resolve conflicts manually."
        return 1
    fi
}

# Function to create commit
create_commit() {
    show_operation_art "commit"
    print_color $CYAN "Creating a new commit..."
    
    # Check if there are changes to commit
    local status=$(git status --porcelain)
    if [ -z "$status" ]; then
        print_color $YELLOW "No changes to commit."
        return 1
    fi
    
    # Show current changes
    print_color $CYAN "Current changes:"
    git status --short
    echo ""
    
    # Get commit message
    read -p "Enter commit message: " commit_message
    if [ -z "$commit_message" ]; then
        print_color $YELLOW "Commit cancelled - no message provided."
        return 1
    fi
    
    # Add all changes and commit
    if git add . && git commit -m "$commit_message"; then
        print_color $GREEN "✅ Commit created successfully."
        return 0
    else
        print_color $RED "ERROR: Failed to create commit."
        return 1
    fi
}

# Function to push changes
push_changes() {
    show_operation_art "push"
    print_color $CYAN "Pushing changes to remote..."
    
    local current_branch=$(get_current_branch)
    if git push origin "$current_branch"; then
        print_color $GREEN "✅ Changes pushed successfully."
        return 0
    else
        print_color $RED "ERROR: Failed to push changes."
        return 1
    fi
}

# Function to show git log
show_git_log() {
    print_color $CYAN "Recent git history:"
    git log --oneline -10
}

# Function to show stash list
show_stash_list() {
    print_color $CYAN "Current stashes:"
    local stashes=$(git stash list)
    if [ -n "$stashes" ]; then
        git stash list
    else
        print_color $CYAN "No stashes found."
    fi
}

# Function to stash and pull
stash_and_pull() {
    printf "${CYAN}"
    cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║               🔄 STASH AND PULL OPERATION 🔄             ║
    ╚══════════════════════════════════════════════════════════╝

EOF
    printf "${NC}"
    
    # Check for local changes
    if get_git_status; then
        show_changes_art "true"
        echo ""
        print_color $YELLOW "⚠️  You have local changes that need to be handled."
        print_color $CYAN "Options:"
        print_color $WHITE "  [S] Stash changes and pull latest"
        print_color $WHITE "  [I] Ignore changes and pull anyway (risky)"
        print_color $WHITE "  [C] Cancel operation"
        echo ""
        
        read -p "Choose an option (S/I/C): " choice
        
        case "$(echo "${choice}" | tr '[:lower:]' '[:upper:]')" in
            "S")
                show_operation_art "stash"
                if stash_changes; then
                    sleep 1
                    show_operation_art "pull"
                    pull_latest
                fi
                ;;
            "I")
                print_color $YELLOW "⚠️  Proceeding without stashing (this may cause conflicts)..."
                show_operation_art "pull"
                pull_latest
                ;;
            *)
                print_color $YELLOW "❌ Operation cancelled."
                ;;
        esac
    else
        show_changes_art "false"
        show_operation_art "pull"
        pull_latest
    fi
}

# Function to show menu
show_menu() {
    local current_branch=$(get_current_branch)
    local stash_count=$(get_stash_count)
    
    show_git_branch_art "$current_branch"
    show_stash_status_art "$stash_count"
    
    echo ""
    printf "${WHITE}"
    cat << 'EOF'

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
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

EOF
    printf "${NC}"
}

# Function to start interactive mode
start_interactive_mode() {
    while true; do
        show_header
        show_menu
        
        read -p "Select an option (Enter for QUICK SHIP): " choice
        
        # Default to option 1 (QUICK SHIP) if Enter is pressed
        if [ -z "$choice" ]; then
            choice="1"
        fi
        
        case $choice in
            1)
                echo ""
                quick_ship || true
                echo ""
                read -p "Press Enter to continue..."
                ;;
            2)
                echo ""
                create_commit || true
                echo ""
                read -p "Press Enter to continue..."
                ;;
            3)
                echo ""
                push_changes || true
                echo ""
                read -p "Press Enter to continue..."
                ;;
            4)
                echo ""
                stash_and_pull
                echo ""
                read -p "Press Enter to continue..."
                ;;
            5)
                echo ""
                if get_git_status; then
                    show_changes_art "true"
                else
                    show_changes_art "false"
                fi
                echo ""
                read -p "Press Enter to continue..."
                ;;
            6)
                echo ""
                show_git_log
                echo ""
                read -p "Press Enter to continue..."
                ;;
            7)
                echo ""
                show_stash_list
                echo ""
                read -p "Press Enter to continue..."
                ;;
            8)
                echo ""
                print_color $CYAN "📋 Raw git status output:"
                git status
                echo ""
                read -p "Press Enter to continue..."
                ;;
            0)
                printf "${GREEN}"
                cat << 'EOF'

    ╔══════════════════════════════════════════════════════════╗
    ║                     👋 GOODBYE! 👋                       ║
    ║                                                          ║
    ║      Thanks for using ArtBastard Git Manager!           ║
    ║      May your commits be clean and your merges smooth!  ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝

EOF
                printf "${NC}"
                exit 0
                ;;
            *)
                print_color $RED "Invalid option. Please try again."
                sleep 2
                ;;
        esac
    done
}

# Main script execution
if [ "$1" = "--help" ]; then
    show_help
fi

# Check if we're in a git repository
if ! test_git_repository; then
    exit 1
fi

# Start interactive mode
start_interactive_mode
