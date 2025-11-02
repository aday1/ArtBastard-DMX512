#!/bin/bash

# Script to fix CMake issues and build face tracker
# This handles CMake installation issues

set -e

echo "=== Fixing CMake and Building Face Tracker ==="
echo ""

# Check if CMake works
if ! cmake --version >/dev/null 2>&1; then
    echo "CMake appears broken. Please reinstall with:"
    echo "  sudo pacman -Rns cmake"
    echo "  sudo pacman -S cmake"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Try to use CMake with explicit module path
CMAKE_MODULE_PATH="/usr/share/cmake"
if [ ! -d "$CMAKE_MODULE_PATH" ]; then
    echo "Warning: CMake modules not found at $CMAKE_MODULE_PATH"
    echo "Trying to locate CMake modules..."
    CMAKE_MODULE_PATH=$(find /usr -name "CMakeLists.txt" -type f 2>/dev/null | head -1 | xargs dirname | xargs dirname)
    echo "Found: $CMAKE_MODULE_PATH"
fi

cd "$(dirname "$0")"

# Clean build directory
if [ -d "build" ]; then
    echo "Cleaning previous build..."
    rm -rf build
fi

mkdir -p build
cd build

echo "Running CMake..."
# Try CMake with explicit module path
CMAKE_ROOT="$CMAKE_MODULE_PATH" cmake .. || {
    echo ""
    echo "CMake configuration failed. This may be a CMake installation issue."
    echo ""
    echo "To fix, please run:"
    echo "  sudo pacman -Rns cmake"
    echo "  sudo pacman -S cmake"
    echo ""
    echo "Or try installing cmake manually from a different source."
    exit 1
}

echo ""
echo "Building..."
make || {
    echo ""
    echo "Build failed. Check the error messages above."
    exit 1
}

echo ""
echo "=== Build Complete ==="
echo ""
echo "Binary location: build/bin/face-tracker"
echo ""
echo "To run:"
echo "  cd build/bin && ./face-tracker"
echo ""

