#!/bin/bash
# ArtBastard Face Tracker - Linux Launcher

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "ArtBastard Face Tracker - Rust Launcher (Linux)"
echo "=============================================="
echo ""

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "  [X] Rust not found!"
    echo ""
    echo "Please install Rust from: https://rustup.rs/"
    echo "Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

RUST_VERSION=$(rustc --version)
echo "  [OK] Rust found: $RUST_VERSION"

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "  [X] Cargo not found!"
    echo "Please ensure Rust is properly installed (cargo should come with rustup)."
    exit 1
fi

CARGO_VERSION=$(cargo --version)
echo "  [OK] Cargo found: $CARGO_VERSION"
echo ""

# Check for required system dependencies
echo "Checking system dependencies..."
MISSING_DEPS=()

# Check for OpenCV development packages
if ! pkg-config --exists opencv4 2>/dev/null && ! pkg-config --exists opencv 2>/dev/null; then
    MISSING_DEPS+=("libopencv-dev (or opencv4-dev)")
fi

# Check for pkg-config
if ! command -v pkg-config &> /dev/null; then
    MISSING_DEPS+=("pkg-config")
fi

# Check for build essentials
if ! command -v g++ &> /dev/null; then
    MISSING_DEPS+=("build-essential")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo "  [!] Missing dependencies:"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "      - $dep"
    done
    echo ""
    echo "Install on Ubuntu/Debian:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y pkg-config libopencv-dev build-essential"
    echo ""
    echo "Install on Fedora/RHEL:"
    echo "  sudo dnf install -y pkg-config opencv-devel gcc-c++"
    echo ""
    echo "Install on Arch Linux:"
    echo "  sudo pacman -S pkg-config opencv"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "  [OK] System dependencies found"
fi

echo ""

# Check if DMX server is running
echo "Checking DMX server connection..."
if curl -s -f -o /dev/null --connect-timeout 2 "http://localhost:3030/api/status" 2>/dev/null; then
    echo "  [OK] DMX server is running"
else
    echo "  [!] DMX server not responding at http://localhost:3030"
    echo "  Please start the DMX server first:"
    echo "    cd ..; npm start"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Check for required model files
echo "Checking model files..."

CASCADE_FILE="haarcascade_frontalface_alt.xml"
if [ ! -f "$CASCADE_FILE" ]; then
    echo "  [!] Missing: $CASCADE_FILE"
    echo "     Downloading..."
    
    if curl -s -f -o "$CASCADE_FILE" "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_alt.xml"; then
        echo "  [OK] Downloaded $CASCADE_FILE"
    else
        echo "  [X] Failed to download"
        echo "  Please download manually from:"
        echo "    https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_alt.xml"
        exit 1
    fi
else
    echo "  [OK] Found: $CASCADE_FILE"
fi

echo ""

# Check config file
CONFIG_PATH="face-tracker-config.json"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "[!] Config file not found, creating default..."
    cat > "$CONFIG_PATH" << 'EOF'
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
EOF
    echo "[OK] Created default config: $CONFIG_PATH"
fi

echo ""

# Build or check binary
BUILD_MODE=${1:-debug}
if [ "$BUILD_MODE" = "release" ]; then
    BINARY_PATH="target/release/face-tracker"
    BUILD_FLAG="--release"
else
    BINARY_PATH="target/debug/face-tracker"
    BUILD_FLAG=""
fi

NEEDS_BUILD=true
if [ -f "$BINARY_PATH" ]; then
    if [ "$1" != "--build" ]; then
        NEEDS_BUILD=false
    fi
fi

if [ "$NEEDS_BUILD" = true ]; then
    echo "Building face tracker (Rust)..."
    
    if [ "$BUILD_MODE" = "release" ]; then
        echo "  Building in RELEASE mode (optimized)..."
    else
        echo "  Building in DEBUG mode..."
    fi
    
    cargo build $BUILD_FLAG
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "[X] Build failed!"
        echo ""
        echo "Common issues:"
        echo "  1. OpenCV not found - install via package manager:"
        echo "     Ubuntu/Debian: sudo apt-get install libopencv-dev"
        echo "     Fedora/RHEL: sudo dnf install opencv-devel"
        echo "     Arch Linux: sudo pacman -S opencv"
        echo ""
        echo "  2. pkg-config not found - install pkg-config package"
        echo ""
        echo "  3. Build tools missing - install build-essential"
        echo ""
        exit 1
    fi
    
    echo ""
    echo "[OK] Build successful!"
    echo ""
else
    echo "[OK] Binary already exists: $BINARY_PATH"
    echo ""
fi

# Verify binary exists
if [ ! -f "$BINARY_PATH" ]; then
    echo "[X] Binary not found at: $BINARY_PATH"
    echo "Please build first with: ./launch-face-tracker-rust.sh --build"
    exit 1
fi

# Copy model files to target directory if needed
if [ -f "$CASCADE_FILE" ]; then
    TARGET_DIR=$(dirname "$BINARY_PATH")
    if [ ! -f "$TARGET_DIR/$CASCADE_FILE" ]; then
        echo "Copying model files to target directory..."
        cp "$CASCADE_FILE" "$TARGET_DIR/"
        echo "[OK] Model files copied"
    fi
fi

echo "=============================================="
echo "Starting Face Tracker (Rust)..."
echo "=============================================="
echo ""
echo "Controls:"
echo "  - Press 'q' or ESC to quit"
echo "  - Adjust camera settings in the preview window"
echo "  - Edit face-tracker-config.json to change DMX channels"
echo ""
echo "Make sure your DMX server is running at http://localhost:3030"
echo ""

# Run the face tracker
cd "$(dirname "$BINARY_PATH")"
exec "./$(basename "$BINARY_PATH")"

