# Testing Guide - No Sudo Required

## Quick Test (No Password Prompts)

Use the no-sudo test script:

```bash
cd face-tracker
./test-no-sudo.sh
```

This script:
- ✅ Checks dependencies (but doesn't try to install them)
- ✅ Downloads OpenCV models if needed
- ✅ Builds the application
- ✅ Tests the binary
- ❌ **Never asks for sudo password**

## Manual Testing Steps

If you prefer to test manually:

### 1. Check Dependencies

```bash
cmake --version        # Should work
pkg-config --modversion opencv  # May show warning but OpenCV is found by CMake
curl --version        # Should work
```

### 2. Download Models

```bash
./setup-models.sh
```

### 3. Build

```bash
./build.sh
```

Or manually:
```bash
mkdir build && cd build
cmake ..
make
```

### 4. Test Binary

```bash
cd build/bin
./face-tracker
```

## Installing Dependencies (If Needed)

If dependencies are missing, install them manually:

```bash
sudo pacman -S base-devel cmake opencv curl nlohmann-json
```

**Note**: The scripts no longer prompt for sudo - you install dependencies yourself when ready.

## Troubleshooting

### "Could not find CMAKE_ROOT"

This is a system CMake issue. Fix with:

```bash
sudo pacman -Rns cmake
sudo pacman -S cmake
```

### "OpenCV not found (via pkg-config)"

This is just a warning - CMake can still find OpenCV. The build will work if OpenCV is installed.

### Build Succeeds but Binary Missing

Check the build output for errors. The binary should be at:
```
face-tracker/build/bin/face-tracker
```

## What the Scripts Do

| Script | Sudo Required? | Purpose |
|--------|---------------|---------|
| `test.sh` | No | Checks deps, builds, tests (tells you to install manually) |
| `test-no-sudo.sh` | No | Same as test.sh but continues even if deps missing |
| `build.sh` | No | Just builds the project |
| `setup-models.sh` | No | Downloads OpenCV model files |
| `fix-cmake.sh` | No | Builds with CMake fix attempts |

## Success!

Once the build completes successfully, you'll have:
- ✅ `build/bin/face-tracker` - The executable
- ✅ `face-tracker-config.json` - Configuration file (created on first run)
- ✅ `haarcascade_frontalface_alt.xml` - Face detection model

Then you can run the face tracker!

