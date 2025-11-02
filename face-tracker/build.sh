#!/bin/bash

# ArtBastard Face Tracker Build Script

set -e

echo "=== ArtBastard Face Tracker Build ==="
echo ""

# Create build directory
if [ ! -d "build" ]; then
    echo "Creating build directory..."
    mkdir build
fi

cd build

echo "Running CMake..."
cmake ..

echo ""
echo "Building..."
make

echo ""
echo "=== Build Complete ==="
echo ""
echo "Binary location: build/bin/face-tracker"
echo ""
echo "To run:"
echo "  cd build && ./bin/face-tracker"
echo ""

