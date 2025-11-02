# How to Run the Face Tracker

## Quick Start

### 1. Start ArtBastard DMX Controller First

In one terminal, start your DMX server:

```bash
cd /home/aday/Documents/Github/ArtBastard-DMX512
npm start
```

Wait until you see: `Server running at http://0.0.0.0:3030`

### 2. Configure Face Tracker

Edit `face-tracker-config.json`:

```json
{
  "dmxApiUrl": "http://localhost:3030/api/dmx/batch",
  "panChannel": 1,          // Your moving head's pan DMX channel
  "tiltChannel": 2,         // Your moving head's tilt DMX channel
  "cameraIndex": 0,         // Try 0, 1, 2 if default doesn't work
  "showPreview": true,      // Must be true to see webcam
  "updateRate": 30,
  "panSensitivity": 1.0,
  "tiltSensitivity": 1.0,
  "panOffset": 128,
  "tiltOffset": 128,
  "smoothingFactor": 0.8
}
```

### 3. Run Face Tracker

In another terminal:

```bash
cd face-tracker/build/bin
./face-tracker
```

## What You Should See

1. **Terminal Output**:
   ```
   === ArtBastard DMX Face Tracker ===
   OpenCV Face Tracking for Moving Head Control
   ====================================
   Configuration loaded:
     DMX API URL: http://localhost:3030/api/dmx/batch
     Pan Channel: 1
     Tilt Channel: 2
     Camera Index: 0
   Starting face tracking...
   Press 'q' or ESC to quit
   ```

2. **Preview Window**: A window should open showing:
   - Your webcam feed
   - Blue rectangle around detected face
   - Green dots on facial landmarks (if model loaded)
   - Text showing Pan/Tilt values

3. **Console Output**: 
   ```
   Face tracked - Pan: 128, Tilt: 128 (raw: 0.0, 0.0)
   ```

## Troubleshooting No Preview

### Camera Not Opening?

**Check camera exists:**
```bash
ls /dev/video*
```

**Try different camera index:**
Edit `face-tracker-config.json`:
- `"cameraIndex": 0` → try `1`, `2`, etc.

**Check camera permissions (Linux):**
```bash
# Add yourself to video group
sudo usermod -a -G video $USER
# Then log out and back in, or:
newgrp video
```

**Test camera manually:**
```bash
# If you have v4l2 tools:
v4l2-ctl --list-devices

# Or try with ffplay:
ffplay /dev/video0
```

### Preview Window Not Showing?

**Check config:**
```bash
cd face-tracker
cat face-tracker-config.json | grep showPreview
```

Should show: `"showPreview": true`

**If false, edit it:**
```bash
# Edit the config file
nano face-tracker-config.json
# Change showPreview to true
```

**No display available?**
If running over SSH or without display:
- Preview won't work
- But tracking still works (just no window)
- Set `"showPreview": false` to avoid errors

### "Could not open camera" Error?

1. **Check camera is connected**
2. **Try different camera index** (0, 1, 2, etc.)
3. **Check if another app is using camera** (close other video apps)
4. **Linux permissions** (see above)
5. **Test camera** with another app first

### No Face Detected?

1. **Lighting**: Ensure good lighting on your face
2. **Distance**: Stay 1-2 meters from camera
3. **Angle**: Face camera directly
4. **Check preview**: Make sure preview shows your face
5. **Look for blue rectangle**: Should appear around your face when detected

### DMX Not Working?

**Test API connection:**
```bash
curl -X POST http://localhost:3030/api/dmx/batch \
  -H "Content-Type: application/json" \
  -d '{"0":128,"1":128}'
```

Should return: `{"success":true,"updateCount":2}`

**Check DMX channels:**
- Make sure `panChannel` and `tiltChannel` match your moving head fixture
- DMX channels are 1-indexed (channel 1 = pan, channel 2 = tilt)
- But API uses 0-indexed, so channel 1 sends to `{"0":value}`

## Keyboard Controls

- **Q** or **ESC**: Quit the application

## Running Without Preview

If you want to run without the preview window (for performance):

```json
{
  "showPreview": false
}
```

Tracking will still work, DMX commands will still be sent, just no visual window.

## Example Session

```bash
# Terminal 1: Start DMX Controller
cd /home/aday/Documents/Github/ArtBastard-DMX512
npm start

# Terminal 2: Run Face Tracker
cd face-tracker/build/bin
./face-tracker

# Position yourself in front of camera
# Move your head - watch the moving head follow!
# Press Q to quit
```

## Tips

- **Calibration**: When centered in frame, pan/tilt should be ~128. Adjust `panOffset`/`tiltOffset` if needed
- **Sensitivity**: Increase `panSensitivity`/`tiltSensitivity` for more dramatic movement (try 1.2-1.5)
- **Smoothing**: Higher `smoothingFactor` (0.85-0.9) = smoother but slower response
- **Update Rate**: Lower rate (20 Hz) reduces network load but less responsive

Enjoy your DMX puppet show! 🎭✨

