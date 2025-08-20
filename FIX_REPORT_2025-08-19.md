# ArtBastard DMX512 - Fixes Applied (2025-08-19)

## Issues Fixed

### 1. TAP BPM Button Not Working
**Problem**: The TAP BPM button was not responding properly and was setting the wrong tempo source.

**Fix Applied**:
- Fixed the `handleTap()` function in `BPMDashboard.tsx` to properly call the store's `recordTapTempo()` function
- Corrected the tempo source to be set to `'tap_tempo'` instead of `'manual_bpm'` when tapping
- Added proper console logging for debugging

**Files Modified**:
- `react-app/src/components/layout/BPMDashboard.tsx`

### 2. Autopilot Not Working/Not Synced to BPM
**Problem**: Autopilot systems were not properly synced to the BPM source and weren't responding.

**Fixes Applied**:

#### Track Autopilot BPM Fix
- Fixed the autopilot track animation loop to use the correct BPM source
- Changed from using `state.bpm` to properly getting BPM from `autoSceneTempoSource`
- Now properly uses `midiClockBpm` when source is 'tap_tempo' or `autoSceneManualBpm` when source is 'manual_bpm'

#### Modular Automation BPM Fix
- Fixed the `startModularAnimation()` function to use the correct BPM source
- Modular automation (color, dimmer, pan/tilt, effects) now properly sync to the selected BPM source
- Added proper BPM fallback to 120 if no BPM is available

**Files Modified**:
- `react-app/src/store/store.ts` (multiple functions updated)

### 3. Build and Launch Issues
**Problem**: The `npm start` command was failing because `dist/main.js` didn't exist and there was a mismatch between the package.json main entry and start script.

**Fix Applied**:
- Updated the `start` script in `package.json` to run `npm run build-backend` before starting the server
- Changed the start command to use `dist/server.js` instead of `dist/main.js` to match the package.json main entry

**Files Modified**:
- `package.json`

### 4. Old Scripts Cleanup
**Completed**: Removed all old cleanup and launch scripts as requested:
- `CLEANUP.ps1`, `CLEANUP.sh`
- `Launch ArtBastard DMX512 ✨.bat`, `Launch-ArtBastard.ps1`
- `quickstart.ps1`, `QUICKSTART.sh`, `simple-launch.ps1`
- `UNIFIED-TOOLS-BACKUP.ps1`, `UNIFIED-TOOLS.ps1`, `UNIFIED-TOOLS.ps1.bak2`
- `WINDOWS-TROUBLESHOOT.bat`

## Current Status
- ✅ Backend builds successfully
- ✅ Server starts and runs on port 3030  
- ✅ TAP BPM functionality restored
- ✅ Autopilot systems now sync to correct BPM source
- ✅ Clean launch script created

## Testing Recommendations
1. Test TAP BPM button - should now respond and calculate BPM correctly
2. Test Track Autopilot - should now move in sync with BPM when auto-play is enabled
3. Test General Autopilot (Pan/Tilt, Color, etc.) - should sync to BPM when "Sync to BPM" is enabled
4. Test different BPM sources (Internal Clock, Manual BPM, Tap Tempo)

## Next Steps
Use the new `start.ps1` script to launch the application, which will:
1. Install all dependencies
2. Build the backend
3. Start the server

Run: `./start.ps1`
