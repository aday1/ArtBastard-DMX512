@echo off
setlocal
title ArtBastard DMX512 Launcher
cd /d "%~dp0"

echo 🚀 ArtBastard DMX512 Cross-Platform Launcher 🚀
echo =================================================

REM Check if we're in the right directory
if not exist "UNIFIED-TOOLS.ps1" (
    echo ❌ UNIFIED-TOOLS.ps1 missing. Run from repo root.
    pause
    exit /b 1
)

if not exist "react-app\package.json" (
    echo ❌ React app not found. Run from repo root.
    pause
    exit /b 1
)

echo 📦 Checking build system compatibility...

REM Run the cross-platform setup for React app first
echo Setting up cross-platform build system...
cd react-app
if exist "setup-build.js" (
    echo Running platform detection and setup...
    node setup-build.js
    if errorlevel 1 (
        echo ⚠️ Platform setup completed with warnings, continuing...
    )
) else (
    echo ℹ️ Platform setup script not found, using standard build...
)
cd ..

echo.
echo 🔨 Starting quickstart (backend + build)...
powershell -ExecutionPolicy Bypass -File "UNIFIED-TOOLS.ps1" quickstart
if errorlevel 1 (
    echo.
    echo ❌ Launch failed. Trying alternative build methods...
    echo.
    
    REM Try the Windows-specific build script if available
    if exist "react-app\build-windows.bat" (
        echo 🔄 Attempting Windows-specific build...
        cd react-app
        call build-windows.bat
        cd ..
        if errorlevel 1 (
            echo ❌ Windows build also failed.
            echo.
            echo 💡 Try these troubleshooting steps:
            echo 1. Run: .\CLEANUP.ps1
            echo 2. Run: .\UNIFIED-TOOLS.ps1 clean -Full
            echo 3. Run: npm install in both root and react-app
            echo 4. Try: npm run build:js-fallback in react-app
            pause
            exit /b 1
        )
    ) else (
        echo ❌ No alternative build methods available.
        pause
        exit /b 1
    )
)

echo.
echo ✅ Launch completed successfully!
echo.
echo 🌐 Application URLs:
echo    Frontend (dev): http://localhost:3001
echo    Backend API:    http://localhost:3030
echo    Health check:   http://localhost:3030/health
echo.
echo 📋 Next steps:
echo    1. Open a new terminal
echo    2. cd react-app
echo    3. npm run dev
echo    4. Open http://localhost:3001 in your browser
echo.
echo 🔧 Useful commands:
echo    Build only:     cd react-app ^&^& npm run build
echo    JS Fallback:    cd react-app ^&^& npm run build:js-fallback
echo    Clean build:    .\CLEANUP.ps1
echo    Full rebuild:   .\UNIFIED-TOOLS.ps1 rebuild
echo.
pause
endlocal
