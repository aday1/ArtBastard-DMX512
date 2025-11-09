# 🐛 Face Tracker DEBUG Page Guide

## Purpose

A **completely new, minimal face tracking implementation** built from scratch to identify what's broken in the main FaceTracker.

## Features

**What it HAS:**
- ✅ Camera access
- ✅ OpenCV initialization
- ✅ Face detection with Haar Cascade
- ✅ Pan/Tilt calculation
- ✅ DMX output
- ✅ RAF loop pattern (proven working)
- ✅ Hz-based throttling
- ✅ **EXTENSIVE LOGGING** to track everything

**What it DOESN'T have:**
- ❌ Eye/blink detection
- ❌ Mouth detection
- ❌ Hand gestures
- ❌ Complex settings
- ❌ OSC
- ❌ Multiple fixtures
- ❌ Smoothing
- ❌ Fancy UI

## How to Access

### Method 1: From Experimental Page
1. Go to **Experimental** page
2. Click the purple button: **"🐛 Open Face Tracker DEBUG Page"**

### Method 2: Direct Navigation
Manually navigate to the debug view using the router.

## How to Use

1. **Wait for OpenCV** - OpenCV status should turn green ✅
2. **Click START** - Big green button
3. **Camera should start** - Camera status turns green ✅
4. **Watch the console** - Extensive logging shows everything
5. **Look at "Loop Iterations"** - Should increase continuously
6. **Look at "Detections Run"** - Should increase when you're in frame

## What You Should See

### Console Logs (Normal Operation):
```
[DEBUG] 🔵 Initializing OpenCV...
[DEBUG] ✅ OpenCV found!
[DEBUG] ✅ OpenCV initialization complete
[DEBUG] 🎥 Starting camera...
[DEBUG] ✅ Camera stream obtained
[DEBUG] 🚀🚀🚀 STARTING DETECTION LOOP 🚀🚀🚀
[DEBUG] ✅ All refs ready, defining RAF loop
[DEBUG] 🔄 Loop iteration #60, isRunning: true
[DEBUG] 🔍 RUNNING DETECTION (iteration #106, Hz: 1)
[DEBUG] 👤 Faces found: 1
[DEBUG] ✅ Face at (320, 240), Pan: 128, Tilt: 128
[DEBUG] 🔄 Loop iteration #120, isRunning: true
[DEBUG] 🔍 RUNNING DETECTION (iteration #180, Hz: 1)
[DEBUG] 👤 Faces found: 1
```

### Status Display:
- **Loop Iterations** - Should increase by ~60 every second (shows RAF is running)
- **Detections Run** - Increases every time a face is found
- **Pan/Tilt** - Updates when face detected
- **Face Detected** - ✅ when you're in frame, ❌ when not

## Diagnostic

### ✅ If This Works:
→ The problem is in the main FaceTracker's added features
→ Solution: Gradually port features from main FaceTracker to this debug version
→ Test after each feature addition to find what breaks it

### ❌ If This Also Fails:
Check for these issues:

**Loop not starting:**
- Missing: "🚀🚀🚀 STARTING DETECTION LOOP"
- Missing: "🔄 Loop iteration #60, #120..."
- → Problem: detectLoop never starts or RAF isn't working

**Loop stopping:**
- Logs show: "⏸️ Paused - isRunning is false"
- Loop iterations stop increasing
- → Problem: isRunning is being set to false unexpectedly

**OpenCV issues:**
- Missing: "✅ OpenCV initialization complete"
- Error logs about OpenCV
- → Problem: OpenCV.js not loading

**Camera issues:**
- Missing: "✅ Camera stream obtained"
- Error logs about camera
- → Problem: Browser camera permissions

## Comparison Points

| Feature | Debug Version | Main FaceTracker |
|---------|--------------|------------------|
| Detection Loop | Simple RAF, ~50 lines | Complex RAF, 1000+ lines |
| Dependencies | Minimal | 20+ useEffects |
| State Management | Simple useState | Complex state + refs |
| Throttling | Simple timestamp | Complex Hz system |
| Logging | Everything logged | Selective logging |
| Features | Pan/Tilt only | All features |

## Next Steps

1. **Test the debug page** - Does it detect faces?
2. **Check loop iterations** - Does it increase continuously?
3. **Compare logs** - Debug vs Main FaceTracker
4. **If debug works**: Port one feature at a time from main to debug
5. **If debug fails**: Issue is environmental, not code

## Hz Settings

- **0.1 Hz** = Every 10 seconds (very slow, testing only)
- **0.5 Hz** = Every 2 seconds
- **1 Hz** = Every second (default)
- **2 Hz** = Twice per second
- **5 Hz** = 5 times per second
- **10 Hz** = 10 times per second (high CPU)

Start with 1 Hz for testing.

