#!/bin/bash

# ArtBastard Electron Build Script
echo "🎭 Building ArtBastard DMX512 Electron App..."

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

# Build the React app first
echo "🔨 Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ React build failed"
    exit 1
fi

# Build Electron app
echo "⚡ Building Electron app..."
cd electron
npm run electron-pack

if [ $? -eq 0 ]; then
    echo "✅ Electron app built successfully!"
    echo "📁 Output directory: electron/electron-dist/"
    echo "🚀 You can now run the Electron app from the dist folder"
else
    echo "❌ Electron build failed"
    exit 1
fi

cd ..
echo "🎉 Build complete!"
