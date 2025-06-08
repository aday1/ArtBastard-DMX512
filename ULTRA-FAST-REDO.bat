@echo off
setlocal enabledelayedexpansion

echo === ULTRA FAST REDO - LIGHTNING REBUILD ===
echo.

REM STEP 1: Nuclear cleanup - kill everything
echo 1. Nuclear cleanup...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM STEP 2: Surgical cleanup - only what's needed
echo 2. Surgical cleanup...
if exist "dist" rmdir /s /q "dist" >nul 2>&1
if exist "react-app\dist" rmdir /s /q "react-app\dist" >nul 2>&1
if exist ".tsbuildinfo" del /q ".tsbuildinfo" >nul 2>&1

REM STEP 3: Lightning backend build
echo 3. Lightning backend build...
call npx tsc
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)

REM STEP 4: Turbo frontend build
echo 4. Turbo frontend build...
cd react-app
call npm run build:skip-ts
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Ultra-fast rebuild complete!
echo.

REM STEP 5: Launch immediately
echo 5. Launching server...
echo Backend: http://localhost:3030
echo.
call npm start

echo.
echo === ULTRA FAST REDO COMPLETE ===
pause
