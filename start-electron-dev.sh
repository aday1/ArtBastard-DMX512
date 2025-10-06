#!/bin/bash

# ArtBastard Electron Development Script
echo "🎭 Starting ArtBastard DMX512 in Electron Development Mode..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install Electron dependencies if not already installed
if [ ! -d "electron/node_modules" ]; then
    echo "📦 Installing Electron dependencies..."
    cd electron
    npm install
    cd ..
fi

# Start development servers
echo "🚀 Starting development servers..."
echo "   - React dev server: http://localhost:3001"
echo "   - Electron app will open automatically"
echo ""
echo "Press Ctrl+C to stop all servers"

# Start both React dev server and Electron
npm run electron-dev
