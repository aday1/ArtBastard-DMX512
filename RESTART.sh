#!/bin/bash
# RESTART.sh - The ArtBastard's Phoenix Protocol (Bash Edition)!
# This script performs a full cleanup and then kickstarts the application.

C_YELLOW="\033[1;33m"
C_MAGENTA="\033[1;35m"
C_CYAN="\033[1;36m"
C_GREEN="\033[1;32m"
C_RED="\033[1;31m"
C_DARK_GRAY="\033[1;30m"
C_RESET="\033[0m"

echo -e "${C_YELLOW}🔄🔥 Invoking the Phoenix Protocol: Full Restart Initiated! (Bash Edition) 🔥🔄${C_RESET}"
echo -e "${C_YELLOW}This will cleanse the stage and then raise the curtains anew.${C_RESET}"
echo -e "${C_DARK_GRAY}--------------------------------------------------------------------${C_RESET}"

# Determine the script's own directory to locate sibling scripts
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

CLEANUP_SCRIPT_PATH="$SCRIPT_DIR/CLEANUP.sh"
QUICKSTART_SCRIPT_PATH="$SCRIPT_DIR/QUICKSTART.sh"

if [ ! -f "$CLEANUP_SCRIPT_PATH" ]; then
    echo -e "${C_RED}🛑 Critical Error: CLEANUP.sh not found at $CLEANUP_SCRIPT_PATH. Cannot proceed with restart.${C_RESET}"
    exit 1
fi

if [ ! -f "$QUICKSTART_SCRIPT_PATH" ]; then
    echo -e "${C_RED}🛑 Critical Error: QUICKSTART.sh not found at $QUICKSTART_SCRIPT_PATH. Cannot proceed with restart.${C_RESET}"
    exit 1
fi

echo ""
echo -e "${C_CYAN}🧼 Act I: The Grand Exfoliation (Running CLEANUP.sh)...${C_RESET}"
chmod +x "$CLEANUP_SCRIPT_PATH" # Ensure it's executable
"$CLEANUP_SCRIPT_PATH"
if [ $? -ne 0 ]; then
    echo -e "${C_RED}🛑 Oh no! The cleanup ritual faltered. Please check the output above. Restart aborted.${C_RESET}"
    exit 1
fi
echo -e "${C_GREEN}✅ Cleanup complete! The stage is pristine.${C_RESET}"
echo ""

echo -e "${C_CYAN}🚀 Act II: The Grand Re-Opening (Running QUICKSTART.sh)...${C_RESET}"
chmod +x "$QUICKSTART_SCRIPT_PATH" # Ensure it's executable
"$QUICKSTART_SCRIPT_PATH"
if [ $? -ne 0 ]; then
    echo -e "${C_RED}🛑 Alas! The quickstart sequence encountered a snag. Please review the output. Restart incomplete.${C_RESET}"
    exit 1
fi

echo ""
echo -e "${C_MAGENTA}🎉✨ Phoenix Protocol Complete! ArtBastard DMX should be rising! (Bash Edition) ✨🎉${C_RESET}"
echo -e "${C_CYAN}Follow any instructions from QUICKSTART.sh to view the application.${C_RESET}"
echo -e "${C_DARK_GRAY}--------------------------------------------------------------------${C_RESET}"
