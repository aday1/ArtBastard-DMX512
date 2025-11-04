# ArtBastard DMX Face Tracker (Rust)

A high-performance Rust application using OpenCV to track face movements and control DMX moving heads in real-time.

## Features

- 🎭 **Real-time Face Tracking**: Uses OpenCV's face detection
- 🎯 **Head Pose Estimation**: Calculates pan/tilt from face position
- 🎨 **DMX Integration**: Sends commands directly to ArtBastard DMX Controller via REST API
- 📊 **Smooth Movement**: Configurable smoothing for natural motion
- ⚙️ **Highly Configurable**: Adjust sensitivity, offsets, update rates, and more
- 🎥 **Live Preview**: Optional camera preview window
- 🦀 **Rust**: Memory-safe, high-performance implementation

## Requirements

### System Dependencies

- **Rust** (install from https://rustup.rs/)
- **OpenCV 4.x** (install via vcpkg or system package manager)
- **CMake** (for building opencv-rust bindings)
- **Visual Studio Build Tools** (Windows) or **GCC** (Linux)

### Windows Installation

1. **Install Rust**:
   ```powershell
   winget install Rustlang.Rust.MSVC
   ```
   Or download from: https://rustup.rs/

2. **Install OpenCV via vcpkg**:
   ```powershell
   vcpkg install opencv:x64-windows
   ```

3. **Set environment variables** (if needed):
   ```powershell
   $env:OPENCV_DIR = "C:\vcpkg\installed\x64-windows"
   ```

### Linux Installation

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install OpenCV
sudo apt-get install libopencv-dev  # Ubuntu/Debian
# OR
sudo pacman -S opencv  # Arch
```

### macOS Installation

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install OpenCV
brew install opencv
```

## Building

### Quick Build

```powershell
# Windows
cd face-tracker
.\launch-face-tracker-rust.ps1 -Build

# Linux/macOS
cd face-tracker
cargo build --release
```

### Manual Build

```bash
cd face-tracker
cargo build --release  # Release mode (optimized)
# OR
cargo build  # Debug mode
```

## Running

### Windows

```powershell
.\launch-face-tracker-rust.ps1
```

### Linux/macOS

```bash
./target/release/face-tracker
# OR
cargo run --release
```

## Configuration

The application uses `face-tracker-config.json` for configuration. On first run, it creates a default config file.

Example configuration:

```json
{
  "dmxApiUrl": "http://localhost:3030/api/dmx/batch",
  "panChannel": 1,
  "tiltChannel": 2,
  "cameraIndex": 0,
  "updateRate": 30,
  "panSensitivity": 1.0,
  "tiltSensitivity": 1.0,
  "panOffset": 128,
  "tiltOffset": 128,
  "showPreview": true,
  "smoothingFactor": 0.8,
  "brightness": 1.5,
  "contrast": 1.2,
  "cameraExposure": -1,
  "cameraBrightness": -1,
  "autoExposure": true
}
```

## Usage

1. **Start DMX Server**:
   ```bash
   cd ..  # Go to project root
   npm start
   ```

2. **Run Face Tracker**:
   ```powershell
   .\launch-face-tracker-rust.ps1
   ```

3. **Controls**:
   - Press 'q' or ESC to quit
   - Face tracking starts automatically when face is detected
   - Adjust settings in `face-tracker-config.json`

## Troubleshooting

### OpenCV Not Found

**Windows (vcpkg)**:
```powershell
vcpkg install opencv:x64-windows
$env:OPENCV_DIR = "C:\vcpkg\installed\x64-windows"
```

**Linux**:
```bash
sudo apt-get install libopencv-dev
export OPENCV_DIR=/usr
```

### Build Errors

If you get OpenCV-related build errors:
1. Make sure OpenCV is installed
2. Set `OPENCV_DIR` environment variable
3. On Windows, ensure Visual Studio Build Tools are installed

### Camera Not Working

1. Check camera permissions
2. Try different `cameraIndex` values (0, 1, 2, etc.)
3. On Linux, ensure you're in the `video` group:
   ```bash
   sudo usermod -a -G video $USER
   ```

## Performance

The Rust version is optimized for performance:
- Release mode enables full optimizations
- Uses OpenCV's efficient face detection
- Smooth pan/tilt calculations with velocity limiting
- Configurable update rate for DMX commands

## Differences from C++ Version

- Simpler implementation (no facial landmarks initially)
- Uses face center for basic tracking
- Same configuration format
- Same DMX API interface
- Better error handling with Result types
- Memory-safe Rust implementation

