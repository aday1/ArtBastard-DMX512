@echo off
:: ====================================================================
:: 🎭✨ ARTBASTARD DMX512 - LUMINOUS MASTERY LAUNCHER ✨🎭
:: ====================================================================
:: The Ultimate Desktop Gateway to Professional Lighting Control
:: ====================================================================

title ArtBastard DMX512 - Luminous Mastery Edition - Launcher

:: Enable color output and clear screen for dramatic effect
color 0D
cls

:: ASCII Art Banner
echo.
echo    ================================================================
echo    ^|            ARTBASTARD DMX512 LAUNCHER                      ^|
echo    ^|                 LUMINOUS MASTERY EDITION                    ^|
echo    ================================================================
echo.
echo           ** PREPARE FOR TRANSCENDENTAL LIGHT ORCHESTRATION **
echo.
echo    ################################################################
echo    #         Professional Fixture Control Suite                  #
echo    #         Touch-Optimized Interface Magic                     #
echo    #         Advanced Lighting Control Matrix                    #
echo    #         Quantum Resonance Technology                        #
echo    ################################################################
echo.

:: Dramatic countdown with sparkles
echo    ** INITIATING LAUNCH SEQUENCE IN:
echo.
timeout /t 1 >nul
echo           *** 3... ***
timeout /t 1 >nul
echo           *** 2... ***
timeout /t 1 >nul
echo           *** 1... ***
timeout /t 1 >nul
echo.
echo    *** LAUNCHING THE LUMINOUS EXPERIENCE! ***
echo.

:: Change to the project directory
cd /d "c:\Users\aday\Documents\GitHub\ArtBastard-DMX512"

:: Check if we're in the right directory
if not exist "QUICKSTART.ps1" (
    echo    *** ERROR: Cannot find QUICKSTART.ps1 script!
    echo    *** Expected location: c:\Users\aday\Documents\GitHub\ArtBastard-DMX512
    echo.
    echo    Please ensure the ArtBastard DMX512 project is located at the correct path.
    echo.
    pause
    exit /b 1
)

echo    *** Project located successfully!
echo    *** Executing PowerShell launch sequence...
echo.

:: Execute the PowerShell script with proper execution policy
powershell -ExecutionPolicy Bypass -File "QUICKSTART.ps1"

:: Check if the script executed successfully
if %ERRORLEVEL% EQU 0 (
    echo.
    echo    ================================================================
    echo    ^|                LAUNCH SEQUENCE COMPLETE!                    ^|
    echo    ================================================================
    echo.
    echo    *** ARTBASTARD DMX512 IS NOW READY FOR YOUR CREATIVE VISION! ***
    echo.    echo    *** BROWSER SELECTION MENU ***
    echo.
    echo    Choose your browser for the ultimate ArtBastard experience:
    echo.
    echo    1. Chrome (Recommended for best performance)
    echo    2. Firefox (Great alternative)
    echo    3. Default Browser (Whatever is set as default)
    echo    4. Skip browser launch (I'll open it manually)
    echo.
    set /p browser_choice="Enter your choice (1-4): "
    echo.    
    :: Wait a moment for the backend to fully initialize
    timeout /t 3 >nul
    
    :: Launch selected browser
    if "%browser_choice%"=="1" (
        echo    *** Opening ArtBastard DMX512 in Chrome...
        start chrome "http://localhost:3001" 2>nul || (
            echo    *** Chrome not found, opening in default browser...
            start "http://localhost:3001"
        )
    ) else if "%browser_choice%"=="2" (
        echo    *** Opening ArtBastard DMX512 in Firefox...
        start firefox "http://localhost:3001" 2>nul || (
            echo    *** Firefox not found, opening in default browser...
            start "http://localhost:3001"
        )
    ) else if "%browser_choice%"=="3" (
        echo    *** Opening ArtBastard DMX512 in default browser...
        start "http://localhost:3001"
    ) else if "%browser_choice%"=="4" (
        echo    *** Skipping browser launch - you can manually open http://localhost:3001
    ) else (
        echo    *** Invalid choice, opening in default browser...
        start "http://localhost:3001"
    )
    
    :: Brief delay then show success message
    timeout /t 2 >nul    echo.    echo    +---------------------------------------------------------------+
    echo    ^|                    WEB ACCESS PORTALS                       ^|
    echo    +---------------------------------------------------------------+
    echo    ^|                                                             ^|
    echo    ^|  MAIN INTERFACE:     http://localhost:3001                  ^|
    if not "%browser_choice%"=="4" (
        echo    ^|  ^(BROWSER LAUNCHED AUTOMATICALLY^)                          ^|
    ) else (
        echo    ^|  ^(OPEN MANUALLY IN YOUR BROWSER^)                          ^|
    )
    echo    ^|                                                             ^|
    echo    ^|  TOUCH CONTROL:      http://localhost:3001/external         ^|
    echo    ^|                                                             ^|
    echo    ^|  PROFESSIONAL UI:    http://localhost:3001/dmx              ^|
    echo    ^|                                                             ^|
    echo    ^|  BACKEND SERVER:     http://localhost:3030                  ^|
    echo    ^|                                                             ^|
    echo    +---------------------------------------------------------------+
    echo.
    echo    *** IMPORTANT NEXT STEPS:
    echo    ============================================================
    echo.
    if not "%browser_choice%"=="4" (
        echo    1.  *** YOUR BROWSER IS OPENING AUTOMATICALLY! ***
        echo.
        echo    2.  *** ARTBASTARD DMX512 WILL LOAD IN YOUR BROWSER ***
        echo.
        echo    3.  *** BEGIN YOUR LUMINOUS JOURNEY! ***
    ) else (
        echo    1.  *** OPEN YOUR BROWSER MANUALLY ***
        echo.
        echo    2.  *** NAVIGATE TO: http://localhost:3001 ***
        echo.
        echo    3.  *** BEGIN YOUR LUMINOUS JOURNEY! ***
    )
    echo.
    echo    +-------------------------------------------------------------+
    echo    ^|  PRO TIP: The backend server is running in a separate      ^|
    echo    ^|      PowerShell window. Keep it open for the magic to      ^|
    echo    ^|      continue!                                             ^|
    echo    +-------------------------------------------------------------+
    echo.
    echo    *** FOR FRONTEND: Open a new PowerShell and run:
    echo       cd c:\Users\aday\Documents\GitHub\ArtBastard-DMX512\react-app
    echo       npm run dev
    echo.
    echo    *** MAY YOUR LIGHTS BE BRIGHT AND YOUR CUES BE PERFECT! ***
    echo.
) else (
    echo.
    echo    *** LAUNCH SEQUENCE ENCOUNTERED AN ERROR!
    echo.
    echo    *** TROUBLESHOOTING STEPS:
    echo    ============================================================
    echo.
    echo    1.  Ensure Node.js is installed ^(v18.0.0 or higher^)
    echo    2.  Check your internet connection for npm packages
    echo    3.  Try running CLEANUP.ps1 first for a fresh start
    echo    4.  Consult the README.md for detailed setup instructions
    echo.
    echo    *** If problems persist, check the project documentation.
    echo.
)

echo    ================================================================
echo    ^|  Thank you for choosing ArtBastard DMX512 - Luminous Mastery! ^|
echo    ^|           ** Where Light Meets Infinite Possibility **        ^|
echo    ================================================================
echo.

:: Keep window open so user can see the URLs
echo    Press any key to close this launcher window...
pause >nul
