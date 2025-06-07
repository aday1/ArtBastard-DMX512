#!/bin/bash

# Git Management Script - Shell Version
# ArtBastard DMX512 Project
# Last Updated: June 7, 2025

set -e

# Script configuration
SCRIPT_NAME="Git Management Script"
SCRIPT_VERSION="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show header
show_header() {
    clear
    print_color $CYAN "============================================="
    print_color $CYAN "  $SCRIPT_NAME v$SCRIPT_VERSION"
    print_color $CYAN "  ArtBastard DMX512 Project"
    print_color $CYAN "============================================="
    echo ""
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
        print_color $GREEN "Changes stashed successfully."
        return 0
    else
        print_color $RED "ERROR: Failed to stash changes."
        return 1
    fi
}

# Function to pull latest code
pull_latest() {
    print_color $CYAN "Pulling latest code..."
    if git pull origin main; then
        print_color $GREEN "Successfully pulled latest code."
        return 0
    else
        print_color $RED "ERROR: Failed to pull latest code."
        print_color $YELLOW "You may need to resolve conflicts manually."
        return 1
    fi
}

# Function to create commit
create_commit() {
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
        print_color $GREEN "Commit created successfully."
        return 0
    else
        print_color $RED "ERROR: Failed to create commit."
        return 1
    fi
}

# Function to push changes
push_changes() {
    print_color $CYAN "Pushing changes to remote..."
    if git push origin main; then
        print_color $GREEN "Changes pushed successfully."
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
    print_color $CYAN "=== STASH AND PULL OPERATION ==="
    
    # Check for local changes
    if get_git_status; then
        echo ""
        read -p "Stash local changes and pull latest? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            if stash_changes; then
                sleep 1
                pull_latest
            fi
        else
            print_color $YELLOW "Operation cancelled."
        fi
    else
        pull_latest
    fi
}

# Function to show menu
show_menu() {
    echo ""
    print_color $WHITE "=== GIT MANAGEMENT MENU ==="
    echo ""
    print_color $WHITE "1. Check Status"
    print_color $WHITE "2. Stash Changes & Pull Latest"
    print_color $WHITE "3. Create Commit"
    print_color $WHITE "4. Push Changes"
    print_color $WHITE "5. View Git Log"
    print_color $WHITE "6. Show Stash List"
    print_color $WHITE "7. Manual Git Status"
    print_color $WHITE "0. Exit"
    echo ""
}

# Function to start interactive mode
start_interactive_mode() {
    while true; do
        show_header
        show_menu
        
        read -p "Select an option: " choice
        
        case $choice in
            1)
                echo ""
                get_git_status || true
                echo ""
                read -p "Press Enter to continue..."
                ;;
            2)
                echo ""
                stash_and_pull
                echo ""
                read -p "Press Enter to continue..."
                ;;
            3)
                echo ""
                create_commit || true
                echo ""
                read -p "Press Enter to continue..."
                ;;
            4)
                echo ""
                push_changes || true
                echo ""
                read -p "Press Enter to continue..."
                ;;
            5)
                echo ""
                show_git_log
                echo ""
                read -p "Press Enter to continue..."
                ;;
            6)
                echo ""
                show_stash_list
                echo ""
                read -p "Press Enter to continue..."
                ;;
            7)
                echo ""
                git status
                echo ""
                read -p "Press Enter to continue..."
                ;;
            0)
                print_color $GREEN "Goodbye!"
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
