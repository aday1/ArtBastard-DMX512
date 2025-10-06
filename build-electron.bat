@echo off
echo 🎭 Building ArtBastard DMX512 Electron App...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install Electron dependencies if not already installed
if not exist "electron\node_modules" (
    echo 📦 Installing Electron dependencies...
    cd electron
    npm install
    cd ..
)

REM Build the React app first
echo 🔨 Building React app...
npm run build

if %errorlevel% neq 0 (
    echo ❌ React build failed
    pause
    exit /b 1
)

REM Build Electron app
echo ⚡ Building Electron app...
cd electron
npm run electron-pack

if %errorlevel% equ 0 (
    echo ✅ Electron app built successfully!
    echo 📁 Output directory: electron\electron-dist\
    echo 🚀 You can now run the Electron app from the dist folder
) else (
    echo ❌ Electron build failed
    pause
    exit /b 1
)

cd ..
echo 🎉 Build complete!
pause
