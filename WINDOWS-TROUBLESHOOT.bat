@echo off
setlocal enabledelayedexpansion
title ArtBastard DMX512 - Windows Troubleshooting Tool
cd /d "%~dp0"

echo.
echo 🛠️ ArtBastard DMX512 Windows Troubleshooting Tool 🛠️
echo ======================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. 
    echo Please run this script from the ArtBastard DMX512 project root directory.
    pause
    exit /b 1
)

if not exist "react-app\package.json" (
    echo ❌ Error: react-app\package.json not found.
    echo Please run this script from the ArtBastard DMX512 project root directory.
    pause
    exit /b 1
)

echo 🔍 Checking system requirements...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js: !NODE_VERSION!
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found or not in PATH
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm: !NPM_VERSION!
)

echo.
echo 🔧 Running diagnostic checks...
echo.

REM Check platform compatibility
echo 📋 Platform Information:
echo    OS: Windows
for /f "tokens=*" %%i in ('wmic os get Caption /value ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ("%%i") do echo    Version: %%j
)

REM Check for problematic processes
echo.
echo 🔍 Checking for conflicting processes...
tasklist /fi "imagename eq node.exe" | find "node.exe" >nul
if not errorlevel 1 (
    echo ⚠️  Node.js processes found running:
    tasklist /fi "imagename eq node.exe"
    echo.
    set /p "KILL_NODES=Kill all Node.js processes? (y/N): "
    if /i "!KILL_NODES!"=="y" (
        taskkill /f /im node.exe >nul 2>&1
        echo ✅ Node.js processes terminated
    )
) else (
    echo ✅ No conflicting Node.js processes found
)

echo.
echo 🧹 Running comprehensive cleanup...
echo.

REM Run PowerShell cleanup script if available
if exist "CLEANUP.ps1" (
    echo Running PowerShell cleanup script...
    powershell -ExecutionPolicy Bypass -File "CLEANUP.ps1"
    if errorlevel 1 (
        echo ⚠️  PowerShell cleanup completed with warnings
    ) else (
        echo ✅ PowerShell cleanup successful
    )
) else (
    echo ⚠️  CLEANUP.ps1 not found, running basic cleanup...
    
    REM Basic cleanup
    if exist "node_modules" (
        echo Removing root node_modules...
        rmdir /s /q "node_modules" 2>nul
    )
    if exist "react-app\node_modules" (
        echo Removing react-app node_modules...
        rmdir /s /q "react-app\node_modules" 2>nul
    )
    if exist "package-lock.json" del /q "package-lock.json" 2>nul
    if exist "react-app\package-lock.json" del /q "react-app\package-lock.json" 2>nul
)

echo.
echo 📦 Installing dependencies with Windows compatibility...
echo.

REM Clear npm cache
echo Clearing npm cache...
npm cache clean --force
if errorlevel 1 (
    echo ⚠️  npm cache clean completed with warnings
) else (
    echo ✅ npm cache cleared
)

REM Install root dependencies
echo.
echo Installing root dependencies...
npm install --no-optional --verbose
if errorlevel 1 (
    echo ❌ Root dependency installation failed
    echo.
    echo 💡 Troubleshooting suggestions:
    echo 1. Check your internet connection
    echo 2. Try running as Administrator
    echo 3. Check if antivirus is blocking npm
    echo 4. Try: npm install --registry https://registry.npmjs.org/
    pause
    exit /b 1
) else (
    echo ✅ Root dependencies installed successfully
)

REM Install react-app dependencies with cross-platform setup
echo.
echo Installing React app dependencies...
cd react-app

npm install --verbose
if errorlevel 1 (
    echo ❌ React app dependency installation failed
    echo Trying with --no-optional flag...
    npm install --no-optional --verbose
    if errorlevel 1 (
        echo ❌ React app dependencies failed to install
        cd ..
        pause
        exit /b 1
    )
)

REM Run cross-platform setup
if exist "setup-build.js" (
    echo.
    echo 🔧 Running cross-platform build setup...
    node setup-build.js
    if errorlevel 1 (
        echo ⚠️  Platform setup completed with warnings
    ) else (
        echo ✅ Cross-platform setup successful
    )
) else (
    echo ℹ️  Cross-platform setup script not found
)

cd ..

echo.
echo 🏗️ Testing build system...
echo.

REM Test TypeScript compilation
cd react-app
echo Testing TypeScript compilation...
npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo ⚠️  TypeScript compilation has issues, but build may still work
) else (
    echo ✅ TypeScript compilation successful
)

REM Test build
echo.
echo Testing production build...
npm run build
if errorlevel 1 (
    echo ❌ Standard build failed, trying JavaScript fallback...
    npm run build:js-fallback
    if errorlevel 1 (
        echo ❌ Both build methods failed
        echo.
        echo 💡 Build troubleshooting suggestions:
        echo 1. Check that all dependencies installed correctly
        echo 2. Try: npm run build:skip-ts
        echo 3. Check Windows Defender or antivirus settings
        echo 4. Try running PowerShell as Administrator
        cd ..
        pause
        exit /b 1
    ) else (
        echo ✅ JavaScript fallback build successful!
        echo ℹ️  Your system will use slower JS-only builds
    )
) else (
    echo ✅ Standard build successful!
    echo ℹ️  Your system supports fast native builds
)

cd ..

echo.
echo 🎉 Troubleshooting Complete! 🎉
echo ===============================
echo.
echo ✅ System is ready for ArtBastard DMX512 development
echo.
echo 🚀 Next steps:
echo    1. Run: "Launch ArtBastard DMX512 ✨.bat"
echo    2. Or use: powershell .\UNIFIED-TOOLS.ps1 quickstart
echo    3. Or manual: cd react-app ^&^& npm run dev
echo.
echo 📋 Useful commands:
echo    Build only:     cd react-app ^&^& npm run build
echo    JS Fallback:    cd react-app ^&^& npm run build:js-fallback
echo    Clean build:    .\CLEANUP.ps1
echo    Full rebuild:   .\UNIFIED-TOOLS.ps1 rebuild
echo.
pause
