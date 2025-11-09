# FaceTracker Debugging Guide

## Key Difference: Working vs Broken

### ✅ WORKING Pattern (Git commit 65f692f)

```typescript
const processDetection = () => {
  try {
    // 1. SCHEDULE NEXT FRAME FIRST (critical!)
    detectionFrameRef.current = requestAnimationFrame(processDetection);
    
    // 2. Then do checks and early returns
    if (!state.isRunning) return;
    if (!video.readyState) return;
    
    // 3. Throttle with timestamp
    const now = Date.now();
    if (now - lastDetectionTimeRef.current < detectionInterval) return;
    lastDetectionTimeRef.current = now;
    
    // 4. Run detection
    cascadeRef.current.detectMultiScale(gray, faces, 1.05, 2, 0, msize, maxSizeObj);
    
  } catch (error) {
    // 5. Even on error, schedule next frame
    detectionFrameRef.current = requestAnimationFrame(processDetection);
  }
};

// Start the loop once
processDetection();
```

**Why it works:**
- `requestAnimationFrame` schedules itself at the START
- Loop runs continuously at 60 FPS, throttled by timestamp check
- Simple, no React dependencies

### ❌ BROKEN Pattern (Current)

```typescript
// Tries to use setInterval with React useEffect
useEffect(() => {
  const timerId = setInterval(() => {
    processDetection(); // Called by timer
  }, intervalMs);
}, [state.isRunning, settings.opencvHz]); // Changes cause restarts
```

**Why it breaks:**
- React re-renders constantly
- Every render recreates the timer
- Timer gets cleared/created repeatedly
- Never settles into a stable loop

## Solution: Use the Working Pattern

Go back to the simple `requestAnimationFrame` loop that worked:

1. Remove all `setInterval` / timer logic
2. Use `requestAnimationFrame(processDetection)` at the TOP of `processDetection`
3. Throttle with timestamp checks
4. Let it run continuously

## Files

- **FaceTrackerFallback.tsx** - Simplified working version based on commit 65f692f
- **FaceTracker.tsx** - Current complex version (needs fixing)

## Testing

1. Test FaceTrackerFallback first to verify detection works
2. Compare the logs
3. Gradually port features from current FaceTracker to fallback
4. OR fix current FaceTracker by reverting to RAF loop pattern

