# Testing the Face Tracker

This guide will help you test the face tracker step by step.

## Quick Test Checklist

- [ ] Install dependencies
- [ ] Download OpenCV models
- [ ] Build the application
- [ ] Verify binary exists
- [ ] Test DMX API connection
- [ ] Test face tracker with camera

## Step-by-Step Testing

### 1. Install Dependencies

On CachyOS/Arch Linux:

```bash
sudo pacman -S base-devel cmake opencv curl nlohmann-json
```

Verify installation:

```bash
cmake --version        # Should show version
pkg-config --modversion opencv  # Should show OpenCV version
curl --version        # Should show curl version
```

### 2. Download OpenCV Model Files

```bash
cd face-tracker
./setup-models.sh
```

This downloads `haarcascade_frontalface_alt.xml` (required for face detection).

### 3. Build the Application

```bash
# Option A: Use build script
./build.sh

# Option B: Manual build
mkdir -p build && cd build
cmake ..
make
cd ..
```

**Expected output**: You should see compilation messages and end with `Build Complete`. The binary should be at `build/bin/face-tracker`.

### 4. Verify Build Success

```bash
# Check binary exists
ls -lh build/bin/face-tracker

# Check it's executable
file build/bin/face-tracker

# Should show something like:
# build/bin/face-tracker: ELF 64-bit LSB executable...
```

### 5. Test DMX API Connection

**First, start your ArtBastard DMX Controller:**

```bash
cd /home/aday/Documents/Github/ArtBastard-DMX512
npm start
# Or however you normally start it
```

**In another terminal, test the API:**

```bash
curl -X POST http://localhost:3030/api/dmx/batch \
  -H "Content-Type: application/json" \
  -d '{"0":128,"1":128}'
```

**Expected response**: Should return `{"success":true,"updateCount":2}` or similar. If you get connection errors, check:
- ArtBastard is running
- Port 3030 is correct
- Firewall isn't blocking

### 6. Configure Face Tracker

Edit `face-tracker-config.json`:

```bash
cd face-tracker
cat face-tracker-config.json
```

Make sure:
- `dmxApiUrl` matches your server (default: `http://localhost:3030/api/dmx/batch`)
- `panChannel` and `tiltChannel` match your moving head fixture's DMX channels

### 7. Test Face Tracker

**With camera preview (recommended first test):**

```bash
cd build/bin
./face-tracker
```

**What to expect:**
- Camera window opens showing video feed
- If face is detected, you'll see:
  - Green dots on facial landmarks (if model loaded)
  - Blue rectangle around face
  - Text showing Pan/Tilt values
- Console output: `Face tracked - Pan: XXX, Tilt: XXX`

**If no face detected:**
- Ensure good lighting
- Face camera directly
- Check camera isn't blocked/covered

**Keyboard controls:**
- Press `Q` or `ESC` to quit

### 8. Test DMX Output

**Setup:**
1. Start ArtBastard DMX Controller
2. Configure a moving head fixture with pan/tilt channels
3. Note the channel numbers
4. Update `face-tracker-config.json` with those channels

**Test:**
1. Run face tracker
2. Move your head slowly
3. Watch the moving head follow your movements!

**Monitor DMX output:**
- Check ArtBastard's DMX monitor/view
- Or watch your actual moving head fixture

## Troubleshooting Tests

### Test Camera Access

```bash
# List video devices
ls -la /dev/video*

# Test camera with another tool (if available)
ffplay /dev/video0  # Or your camera device
```

### Test OpenCV Installation

```bash
# Create a simple test
cat > /tmp/test_opencv.cpp << 'EOF'
#include <opencv2/opencv.hpp>
#include <iostream>
int main() {
    std::cout << "OpenCV version: " << CV_VERSION << std::endl;
    cv::VideoCapture cap(0);
    if (cap.isOpened()) {
        std::cout << "Camera OK" << std::endl;
        cap.release();
    } else {
        std::cout << "Camera FAILED" << std::endl;
    }
    return 0;
}
EOF

g++ /tmp/test_opencv.cpp -o /tmp/test_opencv `pkg-config --cflags --libs opencv4` && /tmp/test_opencv
```

### Test HTTP Connection

```bash
# Test if ArtBastard API is accessible
curl http://localhost:3030/api/health

# Should return JSON with server status
```

### Test Configuration Loading

The face tracker should create `face-tracker-config.json` on first run if it doesn't exist. Check:

```bash
cat face-tracker-config.json
```

## Expected Behavior

### Normal Operation:
1. Camera opens and shows preview
2. Face detection works (blue rectangle appears)
3. Landmarks detected (green dots) or basic tracking works
4. Pan/Tilt values update in console and preview
5. DMX commands sent to ArtBastard (check DMX monitor)
6. Smooth movement (no jittery updates)

### Performance:
- **Frame rate**: Should maintain camera FPS (typically 30 FPS)
- **DMX updates**: At configured rate (default: 30 Hz)
- **CPU usage**: Moderate (face detection is CPU-intensive)
- **Latency**: < 100ms from face movement to DMX update

## Test Scenarios

### Test 1: Basic Face Detection
- **Goal**: Verify camera and face detection work
- **Steps**: Run face tracker, position face in frame
- **Expected**: Face rectangle appears, console shows detection messages

### Test 2: Head Movement Tracking
- **Goal**: Verify head movement is tracked
- **Steps**: Move head left/right, up/down
- **Expected**: Pan/Tilt values change accordingly

### Test 3: DMX Command Sending
- **Goal**: Verify DMX commands reach ArtBastard
- **Steps**: Run tracker, watch ArtBastard DMX monitor
- **Expected**: Channel values update in real-time

### Test 4: Moving Head Control
- **Goal**: Verify moving head responds
- **Steps**: Run tracker, move head
- **Expected**: Moving head follows your movements

### Test 5: Smooth Movement
- **Goal**: Verify smoothing works
- **Steps**: Set `smoothingFactor: 0.9`, move head quickly
- **Expected**: Movement is smooth, no jitter

### Test 6: Sensitivity Adjustment
- **Goal**: Verify sensitivity settings work
- **Steps**: Set `panSensitivity: 1.5`, move head slightly
- **Expected**: More dramatic movement response

## Common Issues

### "Could not open camera"
- Check camera permissions: `sudo usermod -a -G video $USER` (log out/in)
- Try different `cameraIndex` in config (0, 1, 2, etc.)
- Check camera is connected: `ls /dev/video*`

### "curl_easy_perform() failed"
- ArtBastard not running: Start it first
- Wrong URL: Check `dmxApiUrl` in config
- Firewall: Check it's not blocking

### "No face detected"
- Lighting: Ensure good lighting
- Camera angle: Face camera directly
- Distance: Stay within reasonable range (1-2 meters)

### Compilation errors
- Missing dependencies: Install all required packages
- OpenCV version: Ensure OpenCV 4.x is installed
- CMake errors: Check CMake version (need 3.12+)

## Success Indicators

✅ **Build successful**: Binary exists at `build/bin/face-tracker`

✅ **Camera works**: Preview window shows video feed

✅ **Face detected**: Blue rectangle appears around face

✅ **Tracking works**: Pan/Tilt values update as you move

✅ **DMX commands sent**: ArtBastard receives updates (check DMX monitor)

✅ **Moving head responds**: Physical fixture follows your movements

## Next Steps After Testing

Once basic testing passes:

1. **Calibrate**: Adjust `panOffset`/`tiltOffset` so centered face = 128
2. **Tune sensitivity**: Adjust for desired movement range
3. **Fine-tune smoothing**: Balance responsiveness vs smoothness
4. **Test multiple fixtures**: Extend to control multiple moving heads
5. **Add expression tracking**: Extend to detect expressions (smile, frown, etc.)

---

**Happy testing!** 🎭✨

