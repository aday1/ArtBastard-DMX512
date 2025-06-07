@echo off
:: QUICKIE.bat - Quick Cleanup and Quickstart for ArtBastard DMX512
:: Bypasses PowerShell execution policy and Unicode issues
:: Created: June 7, 2025

setlocal enabledelayedexpansion

:: Simple text without ANSI colors to avoid garbled output
cls
echo.
echo    ╔══════════════════════════════════════════════════════════╗
echo    ║                                                          ║
echo    ║           🎭 QUICKIE - ARTBASTARD LAUNCHER 🎭           ║
echo    ║                                                          ║
echo    ║         Fast Cleanup + Quickstart (No PowerShell)       ║
echo    ║                                                          ║
echo    ╚══════════════════════════════════════════════════════════╝
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    echo    Make sure you're in the ArtBastard-DMX512 directory
    echo.
    pause
    exit /b 1
)

if not exist "react-app" (
    echo ❌ ERROR: react-app directory not found!
    echo    Make sure you're in the ArtBastard-DMX512 directory
    echo.
    pause
    exit /b 1
)

echo 🧹 ACT I: CLEANUP - Sweeping Away Past Performances
echo Removing builds, logs, caches, and node modules...
echo.

:: Kill Node processes
echo 🔫 Terminating any running Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
timeout /t 2 >nul

:: Clean backend
echo 🧽 Cleaning backend...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
    echo   ✅ Removed backend dist
)
if exist "node_modules" (
    echo   🗑️ Removing backend node_modules (this may take a moment)...
    rmdir /s /q "node_modules" 2>nul
    echo   ✅ Removed backend node_modules
)

:: Clean frontend
echo 🧽 Cleaning frontend...
if exist "react-app\dist" (
    rmdir /s /q "react-app\dist" 2>nul
    echo   ✅ Removed frontend dist
)
if exist "react-app\node_modules" (
    echo   🗑️ Removing frontend node_modules (this may take a moment)...
    rmdir /s /q "react-app\node_modules" 2>nul
    echo   ✅ Removed frontend node_modules
)

:: Clean logs
if exist "logs" (
    del /q "logs\*.*" 2>nul
    echo   ✅ Cleaned logs
)

:: Clean package-lock files
if exist "package-lock.json" (
    del "package-lock.json" 2>nul
    echo   ✅ Removed backend package-lock.json
)
if exist "react-app\package-lock.json" (
    del "react-app\package-lock.json" 2>nul
    echo   ✅ Removed frontend package-lock.json
)

echo.
echo ✨ Cleanup complete! Stage is clean and ready!
echo.

echo 🚀 ACT II: QUICKSTART - Preparing the Performance
echo Installing dependencies and building the project...
echo.

:: Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Backend npm install failed!
    echo 💡 Try running: npm cache clean --force
    pause
    exit /b 1
)
echo   ✅ Backend dependencies installed

:: Build backend
echo 🔨 Building backend...
call npm run build
if errorlevel 1 (
    echo ❌ Backend build failed!
    pause
    exit /b 1
)
echo   ✅ Backend built successfully

:: Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd react-app
call npm install
if errorlevel 1 (
    echo ❌ Frontend npm install failed!
    cd ..
    pause
    exit /b 1
)
echo   ✅ Frontend dependencies installed
cd ..

echo.
echo 🎉 ACT III: READY TO LAUNCH!
echo.

:: Start backend
echo 🎭 Starting backend server...
start "ArtBastard Backend" cmd /k "node dist/main.js"
timeout /t 3 >nul

echo ✅ Backend server starting in separate window
echo    Backend typically runs on: http://localhost:3000
echo.

echo 🎭 ACT IV: FRONTEND LAUNCH (Manual Step Required)
echo To start the frontend, open a NEW command prompt/PowerShell and run:
echo.
echo   cd "%CD%\react-app"
echo   npm run dev
echo.
echo Frontend will typically be available at: http://localhost:3001
echo.

echo 🌟 Performance is ready! Break a leg! 🌟
echo For full restart: run QUICKIE-PS-FIX.bat again
echo To stop everything: close the backend window or run Ctrl+C
echo.
echo 💡 Alternative: You can now also run the PowerShell scripts:
echo    powershell -NoProfile -File .\CLEANUP.ps1
echo    powershell -NoProfile -File .\QUICKSTART.ps1
echo.

echo Press any key to exit...
pause >nul
