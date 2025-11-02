#!/bin/bash

# ArtBastard Face Tracker Test Script (No Sudo Required)
# This version checks dependencies but doesn't try to install them

set -e

echo "=== ArtBastard Face Tracker - Test Script (No Auto-Install) ==="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Check dependencies
echo "Step 1: Checking dependencies..."
echo ""

MISSING_DEPS=0

if ! command -v cmake &> /dev/null; then
    echo "❌ CMake not found"
    MISSING_DEPS=1
else
    echo "✓ CMake found: $(cmake --version | head -n1)"
fi

if ! pkg-config --exists opencv; then
    echo "❌ OpenCV not found (via pkg-config)"
    MISSING_DEPS=1
else
    echo "✓ OpenCV found: $(pkg-config --modversion opencv)"
fi

if ! command -v curl &> /dev/null; then
    echo "❌ curl not found"
    MISSING_DEPS=1
else
    echo "✓ curl found: $(curl --version | head -n1)"
fi

# Check for nlohmann/json
if [ -f "/usr/include/nlohmann/json.hpp" ] || [ -f "/usr/local/include/nlohmann/json.hpp" ] || [ -f "/opt/homebrew/include/nlohmann/json.hpp" ]; then
    echo "✓ nlohmann/json found"
elif [ -f "/usr/include/json.hpp" ]; then
    echo "✓ nlohmann/json found (single header)"
else
    echo "⚠ nlohmann/json not found in standard locations (will try to download during build)"
fi

echo ""

if [ $MISSING_DEPS -eq 1 ]; then
    echo "⚠ Some dependencies are missing, but continuing anyway..."
    echo "Install with: sudo pacman -S base-devel cmake opencv curl nlohmann-json"
    echo ""
fi

# Step 2: Download model files
echo "Step 2: Checking OpenCV model files..."
echo ""

if [ ! -f "haarcascade_frontalface_alt.xml" ]; then
    echo "⚠ haarcascade_frontalface_alt.xml not found"
    if [ -x "./setup-models.sh" ]; then
        echo "Running setup-models.sh to download..."
        ./setup-models.sh
    else
        echo "Please run: ./setup-models.sh"
    fi
else
    echo "✓ haarcascade_frontalface_alt.xml found"
fi

echo ""

# Step 3: Build
echo "Step 3: Building face tracker..."
echo ""

if [ -d "build" ]; then
    echo "Cleaning previous build..."
    rm -rf build
fi

mkdir -p build
cd build

echo "Running CMake..."
# Try CMake - if it fails due to CMAKE_ROOT, that's a system issue
if cmake .. 2>&1; then
    CMAKE_OK=true
else
    CMAKE_OK=false
    CMAKE_ERROR=$(cmake .. 2>&1)
    if echo "$CMAKE_ERROR" | grep -q "CMAKE_ROOT"; then
        echo ""
        echo "❌ CMake configuration failed due to system CMake issue."
        echo "   This needs to be fixed at the system level:"
        echo "   sudo pacman -Rns cmake"
        echo "   sudo pacman -S cmake"
        exit 1
    else
        echo "$CMAKE_ERROR"
        exit 1
    fi
fi

if [ "$CMAKE_OK" = true ]; then
    echo ""
    echo "Compiling..."
    make || {
        echo ""
        echo "❌ Build failed. Check the error messages above."
        exit 1
    }

    echo ""
    echo "✓ Build successful!"
    echo ""

    # Step 4: Test binary
    echo "Step 4: Testing binary..."
    echo ""

    if [ -f "bin/face-tracker" ]; then
        echo "✓ Binary created: build/bin/face-tracker"
        file bin/face-tracker
        echo ""
        echo "Binary is ready to run!"
    else
        echo "❌ Binary not found at build/bin/face-tracker"
        exit 1
    fi
fi

# Step 5: Check config
echo "Step 5: Checking configuration..."
echo ""

cd ..

if [ -f "face-tracker-config.json" ]; then
    echo "✓ Configuration file exists"
    echo "Current settings:"
    cat face-tracker-config.json | grep -E "(panChannel|tiltChannel|dmxApiUrl)" | sed 's/^/  /'
else
    echo "⚠ Configuration file not found (will be created on first run)"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "To run the face tracker:"
echo "  1. Start your ArtBastard DMX Controller (npm start in project root)"
echo "  2. Run: cd build/bin && ./face-tracker"
echo ""
echo "Or test the DMX API connection first:"
echo "  curl -X POST http://localhost:3030/api/dmx/batch -H 'Content-Type: application/json' -d '{\"0\":128,\"1\":128}'"
echo ""

