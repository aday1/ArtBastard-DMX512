@echo off
:: dumbass.bat - PowerShell Execution Policy Fix
:: Fixes the "scripts is disabled on this system" error
:: Created: June 7, 2025

setlocal enabledelayedexpansion

:: Enable ANSI color support if possible
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::OSVersion.Version.Major"') do set "WIN_VERSION=%%i"
if %WIN_VERSION% GEQ 10 (
    :: Try to enable ANSI color support on Windows 10+
    powershell -NoProfile -Command "try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $Host.UI.RawUI.ForegroundColor = 'Gray' } catch {}" >nul 2>&1
)

:: Colors - will fallback gracefully if ANSI not supported
set "RED="
set "GREEN="
set "YELLOW="
set "BLUE="
set "CYAN="
set "WHITE="
set "RESET="

cls
echo.
echo    ╔══════════════════════════════════════════════════════════╗
echo    ║                                                          ║
echo    ║      🔧 DUMBASS POWERSHELL EXECUTION POLICY FIX 🔧      ║
echo    ║                                                          ║
echo    ║           Fixes: "scripts is disabled" error            ║
echo    ║                                                          ║
echo    ╚══════════════════════════════════════════════════════════╝
echo.

::Check current execution policy
echo 📋 Checking current PowerShell execution policy...
for /f "tokens=*" %%i in ('powershell -Command "Get-ExecutionPolicy -Scope CurrentUser"') do set "CURRENT_POLICY=%%i"

echo    Current policy: %CURRENT_POLICY%
echo.

:: Check if already fixed
if /i "%CURRENT_POLICY%"=="RemoteSigned" (
    echo ✅ Execution policy is already set correctly!
    echo    Your PowerShell scripts should work fine.
    goto :success
)

if /i "%CURRENT_POLICY%"=="Unrestricted" (
    echo ✅ Execution policy is already permissive!
    echo    Your PowerShell scripts should work fine.
    goto :success
)

:: Show the problem
echo ⚠️  PROBLEM DETECTED ⚠️
echo.
echo Your PowerShell execution policy is set to: %CURRENT_POLICY%
echo This prevents local scripts from running.
echo.

echo 🔧 SOLUTION:
echo Setting execution policy to 'RemoteSigned' for current user...
echo.
echo This will allow:
echo ✅ Local scripts (like yours) to run
echo ✅ Remote scripts with valid signatures
echo ❌ Unsigned remote scripts (for security)
echo.

:: Attempt to fix the policy
echo 🔧 Applying fix...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" 2>nul

:: Check if it worked
for /f "tokens=*" %%i in ('powershell -Command "Get-ExecutionPolicy -Scope CurrentUser"') do set "NEW_POLICY=%%i"

if /i "%NEW_POLICY%"=="RemoteSigned" (
    echo ✅ SUCCESS! Execution policy updated.
    echo    You can now run PowerShell scripts in this project.
    goto :success
) else (
    echo ❌ ERROR: Failed to change execution policy automatically.
    echo.
    echo 💡 MANUAL FIX REQUIRED:
    echo 1. Right-click PowerShell and "Run as Administrator"
    echo 2. Run this command:
    echo    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
    echo.
    echo OR run this as regular user:
    echo    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo.
    goto :end
)

:success
echo.
echo    ╔══════════════════════════════════════════════════════════╗
echo    ║                      🎉 ALL FIXED! 🎉                   ║
echo    ║                                                          ║
echo    ║  You can now run:                                        ║
echo    ║  • .\CLEANUP.ps1                                         ║
echo    ║  • .\QUICKSTART.ps1                                      ║
echo    ║  • .\RESTART.ps1                                         ║
echo    ║  • .\SLOP\git-manager.ps1                                ║
echo    ║                                                          ║
echo    ║  Try your original command again:                        ║
echo    ║  .\CLEANUP.ps1;.\QUICKSTART.ps1                          ║
echo    ║                                                          ║
echo    ╚══════════════════════════════════════════════════════════╝
echo.

:end
echo 🔧 Script completed. Press any key to exit...
pause >nul
