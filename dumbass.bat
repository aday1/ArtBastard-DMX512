@echo off
:: dumbass.bat - PowerShell Execution Policy Fix
:: Fixes the "scripts is disabled on this system" error
:: Created: June 7, 2025

setlocal enabledelayedexpansion

:: Colors for batch (using echo with ANSI if supported)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "WHITE=[37m"
set "RESET=[0m"

cls
echo.
echo %CYAN%    ╔══════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%    ║                                                          ║%RESET%
echo %CYAN%    ║      🔧 DUMBASS POWERSHELL EXECUTION POLICY FIX 🔧      ║%RESET%
echo %CYAN%    ║                                                          ║%RESET%
echo %CYAN%    ║           Fixes: "scripts is disabled" error            ║%RESET%
echo %CYAN%    ║                                                          ║%RESET%
echo %CYAN%    ╚══════════════════════════════════════════════════════════╝%RESET%
echo.

:: Check current execution policy
echo %YELLOW%📋 Checking current PowerShell execution policy...%RESET%
for /f "tokens=*" %%i in ('powershell -Command "Get-ExecutionPolicy -Scope CurrentUser"') do set "CURRENT_POLICY=%%i"

echo %YELLOW%   Current policy: %CURRENT_POLICY%%RESET%
echo.

:: Check if already fixed
if /i "%CURRENT_POLICY%"=="RemoteSigned" (
    echo %GREEN%✅ Execution policy is already set correctly!%RESET%
    echo %GREEN%   Your PowerShell scripts should work fine.%RESET%
    goto :success
)

if /i "%CURRENT_POLICY%"=="Unrestricted" (
    echo %GREEN%✅ Execution policy is already permissive!%RESET%
    echo %GREEN%   Your PowerShell scripts should work fine.%RESET%
    goto :success
)

:: Show the problem
echo %RED%⚠️  PROBLEM DETECTED ⚠️%RESET%
echo.
echo %RED%Your PowerShell execution policy is set to: %CURRENT_POLICY%%RESET%
echo %RED%This prevents local scripts from running.%RESET%
echo.

echo %CYAN%🔧 SOLUTION:%RESET%
echo %CYAN%Setting execution policy to 'RemoteSigned' for current user...%RESET%
echo.
echo %CYAN%This will allow:%RESET%
echo %GREEN%✅ Local scripts (like yours) to run%RESET%
echo %GREEN%✅ Remote scripts with valid signatures%RESET%
echo %RED%❌ Unsigned remote scripts (for security)%RESET%
echo.

:: Attempt to fix the policy
echo %YELLOW%🔧 Applying fix...%RESET%
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" 2>nul

:: Check if it worked
for /f "tokens=*" %%i in ('powershell -Command "Get-ExecutionPolicy -Scope CurrentUser"') do set "NEW_POLICY=%%i"

if /i "%NEW_POLICY%"=="RemoteSigned" (
    echo %GREEN%✅ SUCCESS! Execution policy updated.%RESET%
    echo %GREEN%   You can now run PowerShell scripts in this project.%RESET%
    goto :success
) else (
    echo %RED%❌ ERROR: Failed to change execution policy automatically.%RESET%
    echo.
    echo %YELLOW%💡 MANUAL FIX REQUIRED:%RESET%
    echo %YELLOW%1. Right-click PowerShell and "Run as Administrator"%RESET%
    echo %YELLOW%2. Run this command:%RESET%
    echo %WHITE%   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine%RESET%
    echo.
    echo %YELLOW%OR run this as regular user:%RESET%
    echo %WHITE%   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser%RESET%
    echo.
    goto :end
)

:success
echo.
echo %WHITE%    ╔══════════════════════════════════════════════════════════╗%RESET%
echo %WHITE%    ║                      🎉 ALL FIXED! 🎉                   ║%RESET%
echo %WHITE%    ║                                                          ║%RESET%
echo %WHITE%    ║  You can now run:                                        ║%RESET%
echo %WHITE%    ║  • .\CLEANUP.ps1                                         ║%RESET%
echo %WHITE%    ║  • .\QUICKSTART.ps1                                      ║%RESET%
echo %WHITE%    ║  • .\RESTART.ps1                                         ║%RESET%
echo %WHITE%    ║  • .\SLOP\git-manager.ps1                                ║%RESET%
echo %WHITE%    ║                                                          ║%RESET%
echo %WHITE%    ║  Try your original command again:                        ║%RESET%
echo %WHITE%    ║  .\CLEANUP.ps1;.\QUICKSTART.ps1                          ║%RESET%
echo %WHITE%    ║                                                          ║%RESET%
echo %WHITE%    ╚══════════════════════════════════════════════════════════╝%RESET%
echo.

:end
echo %WHITE%🔧 Script completed. Press any key to exit...%RESET%
pause >nul
