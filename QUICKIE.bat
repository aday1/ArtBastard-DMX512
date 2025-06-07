@echo off
:: QUICKIE.bat - Quick Cleanup and Quickstart for ArtBastard DMX512
:: Bypasses PowerShell execution policy and Unicode issues
:: Created: June 7, 2025

setlocal enabledelayedexpansion

:: Colors
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "WHITE=[37m"
set "MAGENTA=[35m"
set "RESET=[0m"

cls
echo.
echo %CYAN%    ╔══════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%    ║                                                          ║%RESET%
echo %CYAN%    ║           🎭 QUICKIE - ARTBASTARD LAUNCHER 🎭           ║%RESET%
echo %CYAN%    ║                                                          ║%RESET%
echo %CYAN%    ║         Fast Cleanup + Quickstart (No PowerShell)       ║%RESET%
echo %CYAN%    ║                                                          ║%RESET%
echo %CYAN%    ╚══════════════════════════════════════════════════════════╝%RESET%
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo %RED%❌ ERROR: package.json not found!%RESET%
    echo %RED%   Make sure you're in the ArtBastard-DMX512 directory%RESET%
    echo.
    pause
    exit /b 1
)

if not exist "react-app" (
    echo %RED%❌ ERROR: react-app directory not found!%RESET%
    echo %RED%   Make sure you're in the ArtBastard-DMX512 directory%RESET%
    echo.
    pause
    exit /b 1
)

echo %GREEN%🧹 ACT I: CLEANUP - Sweeping Away Past Performances%RESET%
echo %CYAN%Removing builds, logs, caches, and node modules...%RESET%
echo.

:: Kill Node processes
echo %YELLOW%🔫 Terminating any running Node.js processes...%RESET%
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
timeout /t 2 >nul

:: Clean backend
echo %CYAN%🧽 Cleaning backend...%RESET%
if exist "dist" (
    rmdir /s /q "dist" 2>nul
    echo %GREEN%  ✅ Removed backend dist%RESET%
)
if exist "node_modules" (
    echo %YELLOW%  🗑️ Removing backend node_modules (this may take a moment)...%RESET%
    rmdir /s /q "node_modules" 2>nul
    echo %GREEN%  ✅ Removed backend node_modules%RESET%
)

:: Clean frontend
echo %CYAN%🧽 Cleaning frontend...%RESET%
if exist "react-app\dist" (
    rmdir /s /q "react-app\dist" 2>nul
    echo %GREEN%  ✅ Removed frontend dist%RESET%
)
if exist "react-app\node_modules" (
    echo %YELLOW%  🗑️ Removing frontend node_modules (this may take a moment)...%RESET%
    rmdir /s /q "react-app\node_modules" 2>nul
    echo %GREEN%  ✅ Removed frontend node_modules%RESET%
)

:: Clean logs
if exist "logs" (
    del /q "logs\*.*" 2>nul
    echo %GREEN%  ✅ Cleaned logs%RESET%
)

:: Clean package-lock files
if exist "package-lock.json" (
    del "package-lock.json" 2>nul
    echo %GREEN%  ✅ Removed backend package-lock.json%RESET%
)
if exist "react-app\package-lock.json" (
    del "react-app\package-lock.json" 2>nul
    echo %GREEN%  ✅ Removed frontend package-lock.json%RESET%
)

echo.
echo %GREEN%✨ Cleanup complete! Stage is clean and ready!%RESET%
echo.

echo %GREEN%🚀 ACT II: QUICKSTART - Preparing the Performance%RESET%
echo %CYAN%Installing dependencies and building the project...%RESET%
echo.

:: Install backend dependencies
echo %CYAN%📦 Installing backend dependencies...%RESET%
call npm install
if errorlevel 1 (
    echo %RED%❌ Backend npm install failed!%RESET%
    echo %YELLOW%💡 Try running: npm cache clean --force%RESET%
    pause
    exit /b 1
)
echo %GREEN%  ✅ Backend dependencies installed%RESET%

:: Build backend
echo %CYAN%🔨 Building backend...%RESET%
call npm run build
if errorlevel 1 (
    echo %RED%❌ Backend build failed!%RESET%
    pause
    exit /b 1
)
echo %GREEN%  ✅ Backend built successfully%RESET%

:: Install frontend dependencies
echo %CYAN%📦 Installing frontend dependencies...%RESET%
cd react-app
call npm install
if errorlevel 1 (
    echo %RED%❌ Frontend npm install failed!%RESET%
    cd ..
    pause
    exit /b 1
)
echo %GREEN%  ✅ Frontend dependencies installed%RESET%
cd ..

echo.
echo %GREEN%🎉 ACT III: READY TO LAUNCH!%RESET%
echo.

:: Start backend
echo %CYAN%🎭 Starting backend server...%RESET%
start "ArtBastard Backend" cmd /k "node dist/main.js"
timeout /t 3 >nul

echo %GREEN%✅ Backend server starting in separate window%RESET%
echo %CYAN%   Backend typically runs on: http://localhost:3000%RESET%
echo.

echo %YELLOW%🎭 ACT IV: FRONTEND LAUNCH (Manual Step Required)%RESET%
echo %WHITE%To start the frontend, open a NEW command prompt/PowerShell and run:%RESET%
echo.
echo %WHITE%  cd "%CD%\react-app"%RESET%
echo %WHITE%  npm run dev%RESET%
echo.
echo %CYAN%Frontend will typically be available at: http://localhost:3001%RESET%
echo.

echo %MAGENTA%🌟 Performance is ready! Break a leg! 🌟%RESET%
echo %CYAN%For full restart: run QUICKIE.bat again%RESET%
echo %YELLOW%To stop everything: close the backend window or run Ctrl+C%RESET%
echo.
echo %WHITE%💡 Alternative: You can now also run the PowerShell scripts:%RESET%
echo %CYAN%   powershell -NoProfile -File .\CLEANUP.ps1%RESET%
echo %CYAN%   powershell -NoProfile -File .\QUICKSTART.ps1%RESET%
echo.

echo %WHITE%Press any key to exit...%RESET%
pause >nul
