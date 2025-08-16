@echo off
setlocal
title ArtBastard DMX512 Launcher
cd /d "%~dp0"

if not exist "UNIFIED-TOOLS.ps1" (
    echo UNIFIED-TOOLS.ps1 missing. Run from repo root.
    pause
    exit /b 1
)

echo == Quickstart (backend + build) ==
powershell -ExecutionPolicy Bypass -File "UNIFIED-TOOLS.ps1" quickstart
if errorlevel 1 (
    echo Launch failed.
    pause
    exit /b 1
)
echo.
echo Open frontend (dev): cd react-app ^& npm run dev
echo URL: http://localhost:3001
echo Backend: http://localhost:3030
echo.
pause
endlocal
