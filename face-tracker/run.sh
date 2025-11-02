#!/bin/bash

# Run script that ensures correct working directory for model files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if binary exists
if [ ! -f "build/bin/face-tracker" ]; then
    echo "Binary not found. Building..."
    ./test.sh
    if [ ! -f "build/bin/face-tracker" ]; then
        echo "Build failed!"
        exit 1
    fi
fi

# Copy model files to build/bin if they don't exist there
if [ ! -f "build/bin/haarcascade_frontalface_alt.xml" ]; then
    if [ -f "haarcascade_frontalface_alt.xml" ]; then
        cp haarcascade_frontalface_alt.xml build/bin/
        echo "Copied cascade file to build/bin"
    fi
fi

if [ -f "lbfmodel.yaml" ] && [ ! -f "build/bin/lbfmodel.yaml" ]; then
    cp lbfmodel.yaml build/bin/
    echo "Copied landmark model to build/bin"
fi

# Run from the face-tracker directory so relative paths work
cd "$SCRIPT_DIR"
./build/bin/face-tracker

