#!/bin/bash

# Quick run script for face tracker
# This helps you run it step by step

echo "=== ArtBastard Face Tracker - Quick Run ==="
echo ""

# Check if ArtBastard is running
if ! curl -s http://localhost:3030/api/health > /dev/null 2>&1; then
    echo "⚠️  ArtBastard DMX Controller not running!"
    echo ""
    echo "Please start it first:"
    echo "  cd /home/aday/Documents/Github/ArtBastard-DMX512"
    echo "  npm start"
    echo ""
    read -p "Start ArtBastard now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting ArtBastard in background..."
        cd /home/aday/Documents/Github/ArtBastard-DMX512
        npm start &
        sleep 3
        echo "✓ ArtBastard started"
    else
        echo "Please start ArtBastard manually, then run this script again."
        exit 1
    fi
else
    echo "✓ ArtBastard DMX Controller is running"
fi

echo ""

# Check config
if [ ! -f "face-tracker-config.json" ]; then
    echo "⚠️  Config file not found, creating default..."
    cat > face-tracker-config.json << 'EOF'
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
  "smoothingFactor": 0.8
}
EOF
    echo "✓ Config created"
fi

# Check showPreview setting
if grep -q '"showPreview":\s*false' face-tracker-config.json; then
    echo "⚠️  showPreview is set to false - enabling it..."
    sed -i 's/"showPreview":\s*false/"showPreview": true/' face-tracker-config.json
    echo "✓ Preview enabled"
fi

echo ""

# Check camera
echo "Checking camera..."
if [ -e /dev/video0 ]; then
    echo "✓ Camera found at /dev/video0"
    CAMERA_OK=true
else
    echo "⚠️  No camera at /dev/video0"
    echo "Available devices:"
    ls -la /dev/video* 2>/dev/null || echo "No video devices found"
    CAMERA_OK=false
fi

echo ""

# Check if binary exists
if [ ! -f "build/bin/face-tracker" ]; then
    echo "❌ Binary not found! Building..."
    ./test.sh
    if [ ! -f "build/bin/face-tracker" ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "✓ Binary ready"
echo ""

# Show config
echo "Current configuration:"
echo "  Camera Index: $(grep -o '"cameraIndex":\s*[0-9]*' face-tracker-config.json | grep -o '[0-9]*')"
echo "  Show Preview: $(grep -o '"showPreview":\s*\(true\|false\)' face-tracker-config.json | grep -o '\(true\|false\)')"
echo "  Pan Channel: $(grep -o '"panChannel":\s*[0-9]*' face-tracker-config.json | grep -o '[0-9]*')"
echo "  Tilt Channel: $(grep -o '"tiltChannel":\s*[0-9]*' face-tracker-config.json | grep -o '[0-9]*')"
echo ""

echo "Starting face tracker..."
echo "You should see a unified window with webcam, 3D visualization, and config editor!"
echo "All controls are accessible via GUI buttons - no keyboard shortcuts needed!"
echo ""

cd build/bin
./face-tracker

