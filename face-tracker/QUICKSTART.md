# Quick Start Guide

## 1. Install Dependencies (Linux - Arch/CachyOS)

```bash
sudo pacman -S base-devel cmake opencv curl nlohmann-json
```

## 2. Download OpenCV Model Files

```bash
cd face-tracker
./setup-models.sh
```

Or manually:
```bash
curl -O https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_alt.xml
```

## 3. Build

```bash
./build.sh
```

Or manually:
```bash
mkdir build && cd build
cmake ..
make
```

## 4. Configure

Edit `face-tracker-config.json` with your DMX channel numbers:

```json
{
  "panChannel": 1,
  "tiltChannel": 2
}
```

## 5. Run

First, start your ArtBastard DMX Controller:
```bash
cd ..  # back to project root
npm start
```

Then in another terminal:
```bash
cd face-tracker
./build/bin/face-tracker
```

Or:
```bash
cd build/bin
./face-tracker
```

## 6. Control Your Moving Head!

- Position yourself in front of the camera
- Move your head around
- Watch your moving head follow your movements!

Press `Q` or `ESC` to quit.

## Troubleshooting

**Camera not found?**
- Try different camera indices: edit `cameraIndex` in config (0, 1, 2, etc.)
- Check camera permissions on Linux: `sudo usermod -a -G video $USER` (then log out/in)

**API connection failed?**
- Make sure ArtBastard is running
- Check the URL in config matches your server (default: `http://localhost:3030`)
- Test with: `curl -X POST http://localhost:3030/api/dmx/batch -H "Content-Type: application/json" -d '{"0":128,"1":128}'`

**No face detected?**
- Ensure good lighting
- Face the camera directly
- Check camera isn't blocked

**Choppy movement?**
- Increase `smoothingFactor` in config (try 0.85-0.9)
- Decrease `updateRate` (try 20)

## Tips

- **Calibration**: When centered in frame, pan/tilt should be ~128. Adjust `panOffset`/`tiltOffset` if needed.
- **Sensitivity**: Increase `panSensitivity`/`tiltSensitivity` for more dramatic movement (try 1.2-1.5)
- **Smoothing**: Higher values = smoother but slower response. Lower = more responsive but jittery.

Enjoy your DMX puppet show! 🎭

