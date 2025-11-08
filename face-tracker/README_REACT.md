# Face Tracker - React Integration

The face tracker has been integrated into the ArtBastard React frontend, providing a modern web-based interface with real-time video preview and controls.

## Features

- 🎥 **Real-time Video Preview**: See your camera feed with face detection overlay
- 🎛️ **Live Controls**: Adjust brightness, contrast, sensitivity, and more in real-time
- 🎯 **DMX Integration**: Automatically sends pan/tilt commands to DMX channels
- ⚡ **Browser-based**: Uses OpenCV.js for face detection (no backend required)
- 🔧 **Configurable**: Full control over detection parameters, smoothing, and DMX mapping

## Usage

### In the React App

1. **Add the Face Tracker Component**:
   - Open the component toolbar
   - Find "Face Tracker" in the DMX category
   - Add it to your layout

2. **Start Tracking**:
   - Click the "Start" button
   - Grant camera permissions when prompted
   - Position yourself in front of the camera
   - The moving head will follow your face movements!

3. **Adjust Settings**:
   - Click "Show Config" to reveal quick controls
   - Adjust brightness, contrast, sensitivity, and smoothing in real-time
   - Changes take effect immediately

### Configuration

For advanced configuration, use the "Face Tracker Configuration" component which provides:
- DMX channel mapping
- Range limits (min/max for pan/tilt)
- Rigging parameters (scale, dead zones, limits, gears)
- Camera settings (exposure, brightness)
- OSC settings (if using OSC instead of HTTP)

## Technical Details

### Browser-based Detection

The React component uses **OpenCV.js** running in the browser:
- No backend processing required
- Low latency (no network round-trip for detection)
- Works on any modern browser with camera access

### Optional C++ Backend

For maximum performance, you can use the C++ backend:
- Faster processing (especially on lower-end devices)
- More advanced features (facial landmarks, 3D pose estimation)
- Access via API: `POST /api/face-tracker/start`

### Architecture

```
React Component (FaceTracker.tsx)
  ├── OpenCV.js (Browser-based detection)
  ├── WebSocket/HTTP (DMX updates)
  └── Real-time Controls (Brightness, Contrast, etc.)

Optional: C++ Backend (faceTrackerService.ts)
  ├── Spawns C++ process
  ├── Processes video frames
  └── Sends DMX via HTTP API
```

## Controls

### Quick Controls (In Component)

- **Camera Index**: Select which camera to use (0, 1, 2, etc.)
- **Brightness**: Adjust video brightness (0-3x)
- **Contrast**: Adjust video contrast (0-3x)
- **Pan Sensitivity**: How much pan movement affects DMX (0-5x)
- **Tilt Sensitivity**: How much tilt movement affects DMX (0-5x)
- **Smoothing**: Movement smoothing factor (0-1, higher = smoother)
- **Show Preview**: Toggle video preview on/off

### Advanced Configuration

See the "Face Tracker Configuration" component for:
- DMX channel assignments
- Range limits and cutoffs
- Rigging parameters
- Camera exposure settings
- OSC configuration

## Troubleshooting

### Camera Not Working

1. **Check Permissions**: Ensure browser has camera access
2. **Try Different Camera**: Change "Camera Index" in settings
3. **Check Browser Console**: Look for errors in developer tools

### Face Not Detected

1. **Lighting**: Ensure good lighting on your face
2. **Distance**: Stay 1-2 meters from camera
3. **Angle**: Face camera directly
4. **Detection Threshold**: Adjust in advanced config (if available)

### OpenCV.js Not Loading

- Check internet connection (OpenCV.js loads from CDN)
- Try refreshing the page
- Check browser console for errors

### DMX Not Updating

1. **Check DMX Server**: Ensure server is running at `http://localhost:3030`
2. **Check Channels**: Verify pan/tilt channels in configuration
3. **Check WebSocket**: Ensure WebSocket connection is active

## Performance Tips

- **Lower Update Rate**: Reduces network load (in advanced config)
- **Disable Preview**: Improves performance if preview not needed
- **Use C++ Backend**: For maximum performance on lower-end devices

## API Endpoints

### Configuration
- `GET /api/face-tracker/config` - Get current configuration
- `PUT /api/face-tracker/config` - Update configuration

### Service Control (C++ Backend)
- `POST /api/face-tracker/start` - Start C++ backend service
- `POST /api/face-tracker/stop` - Stop C++ backend service
- `GET /api/face-tracker/status` - Get service status

## Migration from Rust/C++ Standalone

The standalone Rust version has been removed. To use face tracking:

1. **Use React Component** (Recommended): Add "Face Tracker" component in the React app
2. **Use C++ Backend** (Optional): Start via API endpoint for maximum performance

The C++ version is still available and can be built/run standalone if needed, but the React integration provides a better user experience.

