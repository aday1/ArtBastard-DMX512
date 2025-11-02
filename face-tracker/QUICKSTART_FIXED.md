# Fixed: How to Run with Preview

## ✅ Problem Fixed!

The cascade file path issue is now fixed. The face tracker will automatically find the model files in multiple locations.

## Quick Start

### Option 1: Use the Run Script (Easiest)

```bash
cd face-tracker
./run.sh
```

This script:
- ✅ Checks and builds if needed
- ✅ Copies model files to the right location
- ✅ Runs from correct directory
- ✅ Shows webcam preview automatically

### Option 2: Run Manually

```bash
cd face-tracker

# Make sure model files are accessible
# The code now searches multiple locations automatically

# Run the tracker
cd build/bin
./face-tracker
```

## What You'll See

When it runs successfully:

1. **Terminal Output**:
   ```
   === ArtBastard DMX Face Tracker ===
   Loaded face cascade from: ../haarcascade_frontalface_alt.xml
   Camera opened successfully
   Starting face tracking...
   Press 'q' or ESC to quit
   ```

2. **Preview Window**: 
   - OpenCV window titled "Face Tracker - DMX Puppet Control"
   - Your webcam feed
   - Blue rectangle when face detected
   - Green dots on facial landmarks (if model loaded)
   - Pan/Tilt values displayed

3. **Console Output**:
   ```
   Face tracked - Pan: 135, Tilt: 128 (raw: 0.055, 0.0)
   ```

## Before Running

### 1. Start ArtBastard DMX Controller

In one terminal:
```bash
cd /home/aday/Documents/Github/ArtBastard-DMX512
npm start
```

Wait for: `Server running at http://0.0.0.0:3030`

### 2. Configure DMX Channels

Edit `face-tracker-config.json`:
```json
{
  "panChannel": 1,    // Your moving head's pan channel
  "tiltChannel": 2,   // Your moving head's tilt channel
  "showPreview": true  // Must be true for preview
}
```

### 3. Run Face Tracker

```bash
cd face-tracker
./run.sh
```

## Troubleshooting

### Still Can't Find Cascade File?

The code now searches these locations automatically:
- Current directory
- `../haarcascade_frontalface_alt.xml` (parent)
- `../../haarcascade_frontalface_alt.xml` (face-tracker root)
- And more...

**Manual fix:**
```bash
# Copy files to build/bin
cd face-tracker
cp haarcascade_frontalface_alt.xml build/bin/
```

### No Preview Window?

1. **Check config**: `"showPreview": true`
2. **Check camera**: Make sure camera works:
   ```bash
   # Test camera
   ffplay /dev/video0
   ```
3. **Try different camera index**: Edit config, change `"cameraIndex": 0` to `1`, `2`, etc.
4. **Camera permissions**:
   ```bash
   groups | grep video  # Check if in video group
   sudo usermod -a -G video $USER  # Add if needed, then log out/in
   ```

### Camera Not Opening?

- Try different `cameraIndex` (0, 1, 2, 3)
- Check camera isn't used by another app
- Test with `ffplay /dev/video0`

### ArtBastard Not Running?

The face tracker needs ArtBastard running to send DMX commands:
```bash
cd /home/aday/Documents/Github/ArtBastard-DMX512
npm start
```

Test API:
```bash
curl -X POST http://localhost:3030/api/dmx/batch \
  -H "Content-Type: application/json" \
  -d '{"0":128,"1":128}'
```

## Enjoy Your DMX Puppet Show! 🎭✨

Position yourself in front of the camera and move your head - the moving head should follow your movements!

