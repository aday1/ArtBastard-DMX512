# Face Tracker - Windows Quick Start

## Quick Launch

Simply run:

```powershell
.\launch-face-tracker.ps1
```

The script will:
- ✓ Check if DMX server is running
- ✓ Verify dependencies (CMake, Visual Studio, OpenCV)
- ✓ Build the face tracker if needed
- ✓ Download missing model files
- ✓ Launch the face tracker

## First Time Setup

### 1. Install Dependencies

#### Required:
- **CMake 3.12+**: Download from [cmake.org](https://cmake.org/download/)
- **Visual Studio 2019+**: Install with "Desktop development with C++" workload
- **OpenCV 4.x**: Choose one installation method:

#### Option A: Install via vcpkg (Recommended)

```powershell
# Install vcpkg (if not already installed)
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat

# Install OpenCV and dependencies
.\vcpkg install opencv curl nlohmann-json

# Integrate with Visual Studio
.\vcpkg integrate install

# Set environment variable
[System.Environment]::SetEnvironmentVariable("VCPKG_ROOT", "$PWD", "User")
```

#### Option B: Manual OpenCV Install

1. Download OpenCV from [opencv.org/releases/](https://opencv.org/releases/)
2. Extract to `C:\opencv` (or another location)
3. Set `OPENCV_DIR` environment variable to the build directory:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("OPENCV_DIR", "C:\opencv\build", "User")
   ```

### 2. Start DMX Server

In a separate terminal:

```powershell
cd ..
npm start
```

Wait until you see: `Server running at http://0.0.0.0:3030`

### 3. Configure Face Tracker

Edit `face-tracker-config.json`:

```json
{
  "dmxApiUrl": "http://localhost:3030/api/dmx/batch",
  "panChannel": 1,      // Your moving head's pan DMX channel
  "tiltChannel": 2,     // Your moving head's tilt DMX channel
  "cameraIndex": 0,     // Try 0, 1, 2 if default doesn't work
  "showPreview": true,   // Must be true to see webcam
  "updateRate": 30,
  "panSensitivity": 1.0,
  "tiltSensitivity": 1.0,
  "panOffset": 128,
  "tiltOffset": 128,
  "smoothingFactor": 0.8
}
```

### 4. Launch Face Tracker

```powershell
.\launch-face-tracker.ps1
```

## Script Options

```powershell
# Show help
.\launch-face-tracker.ps1 -Help

# Force rebuild
.\launch-face-tracker.ps1 -Build

# Use different camera
.\launch-face-tracker.ps1 -CameraIndex 1

# Use custom config file
.\launch-face-tracker.ps1 -ConfigPath "my-config.json"
```

## Troubleshooting

### "CMake not found"
- Install CMake from [cmake.org/download/](https://cmake.org/download/)
- Or via Chocolatey: `choco install cmake`

### "C++ compiler not found"
- Install Visual Studio 2019+ with "Desktop development with C++" workload
- Or install Build Tools only: [vs_buildtools.exe](https://aka.ms/vs/17/release/vs_buildtools.exe)

### "OpenCV not found"
- Install via vcpkg (recommended) or manually
- Set `OPENCV_DIR` or `VCPKG_ROOT` environment variable
- Restart PowerShell after setting environment variables

### "DMX server not responding"
- Start the DMX server first: `cd .. && npm start`
- Wait until server is fully running

### Camera not working
- Try different camera indices (0, 1, 2)
- Check Windows camera permissions
- Ensure camera is not being used by another app

### Build fails
- Check that OpenCV is properly installed
- Verify Visual Studio C++ tools are installed
- Try: `cmake -DOpenCV_DIR=<path> ..` manually

## What You'll See

When running successfully:

1. **Terminal Output**:
   ```
   === ArtBastard DMX Face Tracker ===
   Configuration loaded:
     DMX API URL: http://localhost:3030/api/dmx/batch
     Pan Channel: 1
     Tilt Channel: 2
   ```

2. **Preview Windows**:
   - "ArtBastard Puppet Theatre" - Webcam feed with face detection
   - "3D Fixture Visualization" - 3D visualization of fixture movement
   - "Rigging Preview" - Configuration UI

3. **Controls**:
   - Press 'q' or ESC to quit
   - Adjust camera brightness/contrast in preview window
   - Edit config file to change DMX channels

## Advanced

### Manual Build

```powershell
cd face-tracker
.\build.bat
```

Binary will be at: `build\bin\Release\face-tracker.exe`

### Run Without Script

```powershell
cd face-tracker\build\bin\Release
.\face-tracker.exe
```

Make sure `face-tracker-config.json` and model files are in the `face-tracker` directory.

