# Pan/Tilt Autopilot UI Synchronization Fix

## Problem Description

The Pan/Tilt autopilot functionality was working correctly in the backend (updating DMX channels), but had two major issues with the UI integration:

1. **UI Position Not Updated**: When Pan/Tilt autopilot was running, the XY pad position and slider values didn't reflect the current autopilot position
2. **Manual Override Not Working**: When users clicked on the XY pad or adjusted sliders while autopilot was active, their manual input was immediately overwritten by autopilot

## Root Cause Analysis

1. **Missing UI Sync**: The autopilot system was updating DMX channels correctly, but the React component state (`panTiltXY`, `panValue`, `tiltValue`) was not being synchronized with the autopilot output
2. **No Manual Override Logic**: There was no mechanism to disable autopilot when users manually adjusted Pan/Tilt controls

## Solution Implemented

### 1. UI Synchronization with Autopilot

Added a `useEffect` hook in `SuperControl.tsx` that:
- Monitors when Pan/Tilt autopilot is enabled
- Reads current DMX channel values for Pan/Tilt fixtures
- Updates UI state (`panValue`, `tiltValue`, `panTiltXY`) to reflect autopilot position
- Runs on a 100ms interval when autopilot is active

```typescript
useEffect(() => {
  if (!panTiltAutopilot.enabled) return;

  // Find fixtures with pan/tilt channels to get their current values
  const affectedFixtures = getAffectedFixtures();
  const panTiltFixtures = affectedFixtures.filter(({ channels }) => 
    channels.pan !== undefined && channels.tilt !== undefined
  );

  if (panTiltFixtures.length === 0) return;

  // Update UI states to reflect autopilot position every 100ms
  const interval = setInterval(() => {
    const newPanValue = getDmxChannelValue(firstFixture.channels.pan!);
    const newTiltValue = getDmxChannelValue(firstFixture.channels.tilt!);
    
    if (newPanValue !== panValue) {
      setPanValue(newPanValue);
      setPanTiltXY(prev => ({ ...prev, x: (newPanValue / 255) * 100 }));
    }
    
    if (newTiltValue !== tiltValue) {
      setTiltValue(newTiltValue);
      setPanTiltXY(prev => ({ ...prev, y: ((255 - newTiltValue) / 255) * 100 })); // Invert Y for UI
    }
  }, 100);

  return () => clearInterval(interval);
}, [panTiltAutopilot.enabled, panValue, tiltValue, getDmxChannelValue]);
```

### 2. Manual Override System

Updated all manual Pan/Tilt control functions to automatically disable autopilot when user takes manual control:

#### XY Pad Manual Control
```typescript
const updateXYPosition = (e: React.MouseEvent) => {
  // If Pan/Tilt autopilot is active, temporarily disable it when user manually controls
  if (panTiltAutopilot.enabled) {
    console.log('Manual Pan/Tilt control detected - disabling autopilot');
    togglePanTiltAutopilot();
  }
  
  // ... rest of XY pad logic
};
```

#### Slider Manual Control
```typescript
onChange={(e) => {
  // If Pan/Tilt autopilot is active, disable it when user manually controls
  if (panTiltAutopilot.enabled) {
    console.log('Manual Pan slider control detected - disabling autopilot');
    togglePanTiltAutopilot();
  }
  
  // ... rest of slider logic
}}
```

#### Reset Button Manual Control
```typescript
const resetPanTiltToCenter = () => {
  // If Pan/Tilt autopilot is active, disable it when user manually resets
  if (panTiltAutopilot.enabled) {
    console.log('Manual Pan/Tilt reset detected - disabling autopilot');
    togglePanTiltAutopilot();
  }
  
  // ... rest of reset logic
};
```

### 3. Visual Feedback

Added an "AUTO" indicator to the Pan/Tilt panel header that appears when autopilot is active:

```tsx
{panTiltAutopilot.enabled && (
  <span 
    className={styles.autopilotIndicator}
    style={{ 
      marginLeft: 'auto', 
      fontSize: '12px', 
      backgroundColor: '#28a745', 
      color: 'white', 
      padding: '2px 6px', 
      borderRadius: '4px',
      animation: 'pulse 2s infinite'
    }}
    title={`Autopilot active: ${panTiltAutopilot.pathType} pattern`}
  >
    AUTO
  </span>
)}
```

## Files Modified

1. **`/react-app/src/components/dmx/SuperControl.tsx`**
   - Added Pan/Tilt autopilot state to `useStore()` hook
   - Added UI synchronization `useEffect`
   - Updated `updateXYPosition()` function with manual override
   - Updated Pan/Tilt slider `onChange` handlers with manual override
   - Updated `resetPanTiltToCenter()` function with manual override
   - Added visual autopilot indicator to panel header

## How It Works Now

### When Autopilot Is Active:
1. **Backend**: Autopilot system updates DMX channels with calculated Pan/Tilt values
2. **Frontend**: UI synchronization reads these DMX values and updates the XY pad position and slider values in real-time
3. **Visual Feedback**: "AUTO" indicator shows in the Pan/Tilt panel header
4. **UI Reflects Motion**: Users can see the XY pad handle and sliders moving according to the autopilot pattern

### When User Takes Manual Control:
1. **Override Detection**: Any manual interaction (XY pad click, slider adjustment, reset button) detects autopilot is active
2. **Autopilot Disabled**: Automatically calls `togglePanTiltAutopilot()` to disable autopilot
3. **Manual Control**: User's manual input is applied immediately
4. **Visual Update**: "AUTO" indicator disappears, showing manual control is active

## Testing the Fix

1. **Enable Pan/Tilt Autopilot**: Use the BPM Dashboard or SuperControl panel to enable autopilot
2. **Observe Synchronization**: Watch the XY pad handle and slider values move according to the autopilot pattern
3. **Test Manual Override**: Click on the XY pad or adjust sliders - autopilot should automatically disable
4. **Visual Confirmation**: "AUTO" indicator should appear when autopilot is active and disappear when disabled

## Benefits

- **Intuitive User Experience**: UI now accurately reflects what's happening with the fixtures
- **Seamless Manual Override**: Users can immediately take control without confusion
- **Clear Visual Feedback**: Users know when autopilot is active vs manual control
- **No Data Loss**: Manual adjustments are preserved when autopilot is disabled
- **Consistent Behavior**: All Pan/Tilt controls (XY pad, sliders, reset) behave consistently

This fix ensures that the Pan/Tilt autopilot system provides both powerful automation and intuitive manual control capabilities.
