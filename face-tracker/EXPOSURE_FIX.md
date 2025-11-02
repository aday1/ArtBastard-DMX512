# Exposure Slider Fix

## ✅ Fixed!

The exposure slider now works correctly. The issue was that auto exposure was enabled by default, which prevented manual exposure adjustments.

## How It Works Now

When you move the **Exposure slider**:
1. ✅ Automatically disables auto exposure
2. ✅ Switches camera to manual exposure mode
3. ✅ Applies the exposure value in real-time
4. ✅ Saves the setting when you quit

## Settings

The exposure slider maps to camera exposure values:
- **Slider 0** = Exposure -13 (brightest)
- **Slider 50** = Exposure -6 (middle)
- **Slider 100** = Exposure 1 (darkest)

## Config Behavior

- **`autoExposure: true`** (default):
  - Camera starts with auto exposure enabled
  - Moving the exposure slider automatically switches to manual mode
  - Your manual setting is saved

- **`autoExposure: false`**:
  - Camera starts in manual exposure mode
  - Exposure slider controls exposure directly

## Rebuild

Rebuild to get the fix:

```bash
cd face-tracker
rm -rf build
./test.sh
```

Then run:

```bash
cd build/bin
./face-tracker
```

The exposure slider should now work! Move it and watch the camera brightness change in real-time.

