@echo off
REM ArtBastard Face Tracker Build Script for Windows

echo === ArtBastard Face Tracker Build ===
echo.

REM Create build directory
if not exist "build" (
    echo Creating build directory...
    mkdir build
)

cd build

echo Running CMake...
cmake ..

echo.
echo Building...
cmake --build . --config Release

echo.
echo === Build Complete ===
echo.
echo Binary location: build\bin\Release\face-tracker.exe
echo.
echo To run:
echo   cd build\bin\Release
echo   face-tracker.exe
echo.

pause

