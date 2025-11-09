# FaceTracker: Working vs Broken - Detailed Comparison

## Summary

**Working Version** (git commit 65f692f): Simple, stable, continuous detection  
**Current Version**: Complex, unstable, detection only works on manual trigger

---

## Key Architectural Difference

### Working Version (65f692f) ✅

**Pattern: Self-scheduling requestAnimationFrame loop**

```typescript
const detectFaces = useCallback(() => {
  const processDetection = () => {
    try {
      // 🔑 KEY: Schedule next frame FIRST
      detectionFrameRef.current = requestAnimationFrame(processDetection);
      
      // Then do all the checks
      if (!state.isRunning) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
      
      // Throttle with timestamp
      const now = Date.now();
      if (now - lastDetectionTimeRef.current < 66) return; // ~15 FPS
      lastDetectionTimeRef.current = now;
      
      // Run detection
      cascadeRef.current.detectMultiScale(gray, faces, 1.05, 2, 0, msize, maxSizeObj);
      
      // Process results...
      
    } catch (error) {
      // Even on error, loop continues
      detectionFrameRef.current = requestAnimationFrame(processDetection);
    }
  };
  
  // Start the loop - called ONCE
  processDetection();
}, [state.isRunning, settings]);
```

**Why it works:**
- `processDetection` schedules itself immediately
- Loop runs at 60 FPS (requestAnimationFrame rate)
- Throttled to ~15 FPS actual detection via timestamp check
- Independent of React render cycle
- No dependencies cause it to restart

---

### Current Version (Broken) ❌

**Pattern: setInterval timer with useEffect dependencies**

```typescript
// Timer created by useEffect
useEffect(() => {
  const timerId = setInterval(() => {
    if (processDetectionRef.current) {
      processDetectionRef.current(); // Call detection
    }
  }, intervalMs);
  
  return () => clearInterval(timerId); // Cleanup
}, [state.isRunning, state.isInitialized, settings.opencvHz]); // ❌ PROBLEM
```

**Why it fails:**
1. **Component re-renders constantly** (every DMX update, state change, etc.)
2. **Each re-render can trigger cleanup** if dependencies change
3. **Timer gets cleared and recreated repeatedly**
4. **Never settles into stable operation**
5. **Detection only runs when:**
   - Manual refresh button clicked
   - Slider moved (triggers recreation)
   - By accident during a brief moment when timer exists

---

## Observable Symptoms

### Working Version
- Continuous "Face detected!" logs
- Timestamp updates every ~66ms
- Overlays update smoothly
- Face tracking is responsive

### Current Broken Version
- "CLEANUP RUNNING" appears constantly
- Timer created and immediately destroyed
- Hz value changes constantly (4.8, 4.9, 5.1, 5.2, 5.3)
- Face detection only on manual trigger
- Old timestamps (10+ seconds)

---

## Console Log Comparison

### Working Version Logs:
```
[OpenCV] Detection cycle - Faces found: 1, Detection time: 15ms
[OpenCV] Face detected - Position: (98, 42), Size: 85x85
[FaceTracker] DMX batch sent: {0: 127, 1: 132}
[OpenCV] Detection cycle - Faces found: 1, Detection time: 14ms
[OpenCV] Face detected - Position: (99, 43), Size: 86x86
[FaceTracker] DMX batch sent: {0: 128, 1: 133}
```
Continuous, steady stream of detections.

### Current Broken Logs:
```
🚀 CREATING NEW TIMER (hz: 4.8, intervalMs: "208ms")
✅ Timer created: 476
🎬 Component render
🧹 CLEANUP RUNNING
🚀 CREATING NEW TIMER (hz: 4.9, intervalMs: "204ms")
✅ Timer created: 478
🎬 Component render
🧹 CLEANUP RUNNING
🚀 CREATING NEW TIMER (hz: 5.1, intervalMs: "196ms")
...
```
Timer constantly recreated, never runs continuously.

---

## Solution

### Option 1: Use FaceTrackerFallback (Recommended)
1. Navigate to Experimental page
2. Click "Use Fallback (Working Version)" button
3. Verify detection works
4. Gradually port features you need from current FaceTracker

### Option 2: Fix Current FaceTracker
Revert to RAF loop pattern:

```typescript
const detectFaces = useCallback(() => {
  const processDetection = () => {
    // Schedule next frame FIRST
    detectionFrameRef.current = requestAnimationFrame(processDetection);
    
    // Then do checks...
    if (!state.isRunning) return;
    
    // Throttle...
    const now = Date.now();
    if (now - lastDetectionTimeRef.current < (1000 / settings.opencvHz)) return;
    lastDetectionTimeRef.current = now;
    
    // Run detection...
  };
  
  processDetection(); // Start once
}, [state.isRunning, settings]);
```

Remove all:
- `setInterval` / `clearInterval`
- Timer refs
- Complex useEffect dependencies
- Hz-based timer logic

---

## Testing Fallback

1. Refresh browser (Ctrl+Shift+R)
2. Go to Experimental page
3. Click "Use Fallback (Working Version)"
4. Click Start
5. Watch console for continuous detection logs
6. Move your face - should track smoothly

## Debugging Current Version

Look for these in console:
- ✅ `⏰ TICK #1, #2, #3...` = Timer running
- ❌ `🧹 CLEANUP RUNNING` appearing often = Timer being destroyed
- ❌ Component render many times = Causing restarts
- ❌ No TICK logs = Timer not running at all

## Files Created

1. `FaceTrackerFallback.tsx` - Working simplified version
2. `FACETRACKER_DEBUGGING_GUIDE.md` - This file
3. `working-facetracker-backup.tsx` - Full backup from git commit

