# Face Tracker Testing Checklist

## Pre-Test Setup
- [ ] Ensure you have a webcam connected
- [ ] Make sure the main ArtBastard DMX512 server is running
- [ ] Close other applications that might use the camera

## Basic Tests

### 1. Build Test
```powershell
.\build.bat
```
**Expected:** Should build without errors and create `build\bin\Release\face-tracker.exe`

### 2. Launch Test
```powershell
.\launch-face-tracker.ps1
```
**Expected:** 
- Should detect camera
- Show camera feed window
- Display face detection overlay
- Connect to DMX server

### 3. Face Detection Test
**Steps:**
1. Position your face in front of the camera
2. Move your head left/right/up/down
3. Check if green rectangles appear around detected faces

**Expected:**
- Face should be outlined with green rectangle
- Rectangle should track face movement smoothly
- Multiple faces should be detected if present

### 4. DMX Integration Test
**Steps:**
1. Start main ArtBastard server (`.\start.ps1` from root directory)
2. Launch face tracker
3. Move your face around
4. Check DMX channel values in the main interface

**Expected:**
- DMX channels should change based on face position
- Face X-position should control horizontal movement channels
- Face Y-position should control vertical movement channels

## Advanced Tests

### 5. Configuration Test
```powershell
.\launch-face-tracker.ps1 -ConfigPath "custom-config.json"
```

### 6. Camera Selection Test
```powershell
.\launch-face-tracker.ps1 -CameraIndex 1
```
(Try different camera indices: 0, 1, 2, etc.)

## Troubleshooting

### Common Issues:
- **No camera detected**: Check camera permissions and connections
- **Build errors**: Install Visual Studio Build Tools or Visual Studio
- **OpenCV errors**: Download model files with `setup-models.sh` (via WSL/Git Bash)
- **DMX not responding**: Ensure main server is running on port 3030

### Debug Commands:
```powershell
# Check if camera is accessible
Get-PnpDevice -Class Camera

# Check if DMX server is running
netstat -an | findstr 3030

# View build logs
type build\CMakeFiles\CMakeOutput.log
```

## Success Criteria

✅ **Basic Success**: Face tracker builds and runs without crashes
✅ **Detection Success**: Faces are detected and outlined
✅ **DMX Success**: Face movement controls lighting fixtures
✅ **Performance Success**: Smooth tracking at 15+ FPS

## Test Results Log

Date: ___________
Camera: ___________
Build Status: ___________
Detection Accuracy: ___________
DMX Integration: ___________
Performance (FPS): ___________
Notes: ___________