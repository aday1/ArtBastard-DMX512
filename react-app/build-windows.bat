@echo off
echo 🚀 Building ArtBastard DMX512 React App for Windows...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the react-app directory.
    pause
    exit /b 1
)

REM Clean install dependencies
echo 📦 Installing dependencies...
call npm ci

REM Run the build
echo 🔨 Building application...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ⚠️  Build failed with native binaries, trying JS fallback...
    call npm run build:js-fallback
)

if %ERRORLEVEL% equ 0 (
    echo ✅ Build completed successfully!
    echo 📁 Build output is in the 'dist' directory
) else (
    echo ❌ Build failed. Check the error messages above.
)

pause
