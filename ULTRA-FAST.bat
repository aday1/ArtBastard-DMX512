@echo off
setlocal enabledelayedexpansion

echo ⚡ ULTRA FAST REBUILD (Batch Version) ⚡
echo.

REM Kill Node processes
echo 1️⃣ Cleanup...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1

REM Clean build outputs
if exist "dist" rmdir /s /q "dist" >nul 2>&1
if exist "react-app\dist" rmdir /s /q "react-app\dist" >nul 2>&1
if exist ".vite" rmdir /s /q ".vite" >nul 2>&1
if exist "react-app\.vite" rmdir /s /q "react-app\.vite" >nul 2>&1

REM Check if full clean requested
if "%1"=="--full-clean" (
    echo   → Full clean mode...
    if exist "node_modules" rmdir /s /q "node_modules" >nul 2>&1
    if exist "react-app\node_modules" rmdir /s /q "react-app\node_modules" >nul 2>&1
)

REM Check dependencies
set NEEDS_INSTALL=0
if not exist "node_modules" set NEEDS_INSTALL=1
if not exist "react-app\node_modules" set NEEDS_INSTALL=1
if "%1"=="--full-clean" set NEEDS_INSTALL=1

if !NEEDS_INSTALL!==1 (
    echo 2️⃣ Installing dependencies...
    echo   → Root dependencies...
    call npm install --prefer-offline --no-audit --silent
    
    echo   → Frontend dependencies...
    cd react-app
    call npm install --prefer-offline --no-audit --silent
    cd ..
) else (
    echo 2️⃣ Dependencies OK, skipping install
)

REM Build
echo 3️⃣ Building...
if exist "build-backend-fast.js" (
    node build-backend-fast.js
) else (
    call npm run build-backend
)

echo ✅ Batch rebuild complete!

REM Start based on parameter
if "%1"=="--dev" goto startdev
if "%2"=="--dev" goto startdev

echo 4️⃣ Starting production...
npm start
goto end

:startdev
echo 4️⃣ Starting dev mode...
echo Backend: Starting in new window...
start "ArtBastard Backend" cmd /k "npm start"

echo Frontend: Starting...
cd react-app
npm run dev

:end
