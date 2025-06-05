# ArtBastard DMX512 - Changelog

All notable changes to this project will be documented in this file.

## [Latest] - 2025-06-05

### 🔧 Factory Reset Fixes
- **Fixed**: Factory Reset now properly clears/removes scenes when performing a factory reset
- **Added**: New `DELETE /api/scenes` endpoint in `src/api.ts` for server-side scene clearing
- **Enhanced**: Factory reset function in `Settings.tsx` now:
  - Clears client-side scenes array
  - Clears server-side `scenes.json` file via API call
  - Resets all auto-scene settings to defaults (13 properties)
  - Provides better error handling and user feedback
- **Files Modified**: 
  - `/react-app/src/components/settings/Settings.tsx`
  - `/src/api.ts`

### 🎬 AutoScene Control Fixes
#### Issues Fixed

**1. BPM Manual Text Entry Field Missing**
- **Problem**: The AutoSceneControlMini component was missing the manual BPM input field when "Manual BPM" tempo source was selected
- **Solution**: 
  - Added conditional rendering of number input field when `autoSceneTempoSource === 'manual_bpm'`
  - Added corresponding CSS styling for `.bpmInput` class
  - Connected the input to the `setManualBpm` store action

**2. Missing Internal Clock Option**
- **Problem**: AutoSceneControlMini only showed "Manual BPM" and "Tap Tempo" options, missing the "Internal Clock" option
- **Solution**: Added "Internal Clock" option to the tempo source dropdown select element

**3. Scene Triggering Not Working from Main Page**
- **Problem**: The AutoSceneControlMini component wasn't implementing the local clock management and scene triggering logic
- **Solutions Implemented**:

**a. Added Local State Management**
- `localBeatCounter`: Tracks beats for scene timing
- `isLocalClockPlaying`: Manages play/pause state for manual/tap tempo modes
- `prevBeatRef`: Reference for internal clock beat tracking
- `intervalRef`: Timer reference for manual/tap tempo intervals

**b. Added Store Dependencies**
- `midiClockIsPlaying`: For internal clock mode
- `midiClockCurrentBeat`: For internal clock beat tracking
- `setNextAutoSceneIndex`: For scene progression
- `loadScene`: For actually loading scenes
- `triggerAutoSceneFlash`: For visual feedback

**c. Implemented Clock Management Effects**
- **Independent Clock Effect**: Manages timer intervals for manual_bpm and tap_tempo modes
- **Master Clock Tracking Effect**: Syncs with master clock beats for internal_clock mode
- **Scene Change Trigger Effect**: Detects when to advance to next scene based on beat division
- **Scene Loading Effect**: Actually loads the current scene when conditions are met

**d. Enhanced Button Behavior**
- Modified START/STOP button to properly handle play/pause states for different tempo sources
- Added automatic clock starting when enabling AutoScene
- Improved status indicator to show actual playing state

**e. Visual Feedback Improvements**
- Updated status icon to reflect actual playing state (not just enabled state)
- Maintained compatibility with shared flashing state for beat visualization

#### Technical Details
**Key Files Modified**
- `AutoSceneControlMini.tsx`: Main component logic
- `AutoSceneControlMini.module.scss`: Added `.bpmInput` styling

**State Flow**
1. **Enable AutoScene** → Button sets `autoSceneEnabled = true` and starts appropriate clock
2. **Clock Ticking** → Increments `localBeatCounter` based on tempo source
3. **Beat Division Reached** → Triggers `setNextAutoSceneIndex()` and `loadScene()`
4. **Scene Loading** → Updates DMX channels with scene data
5. **Visual Feedback** → Flash effect and status updates

**Tempo Source Behaviors**
- **Internal Clock**: Syncs with master MIDI clock, uses `requestToggleMasterClockPlayPause()`
- **Manual BPM**: Uses local interval timer with user-specified BPM
- **Tap Tempo**: Uses local interval timer with calculated BPM from taps

#### Testing Results
- ✅ BPM Manual input field appears when selected
- ✅ Internal Clock option is available in dropdown
- ✅ Scene progression works from main page (0/3 → 1/3 → 2/3 → 3/3)
- ✅ All three tempo sources function correctly
- ✅ Visual feedback matches functionality

### 🎯 Auto Scene Management Features

#### ✅ Bug Fixes
**Fixed Critical Ping-Pong Mode Bug**
- **Issue**: Infinite bouncing between last and second-to-last scenes
- **Solution**: Corrected boundary condition logic in `setNextAutoSceneIndex` function
- **Result**: Proper ping-pong pattern: `test → test2 → test3 → test2 → test → test2 → test3 → ...`

#### ✅ New Features Added

**1. Auto Scene Management UI in Scene Gallery**
- **Auto Scene Management Card**: Dedicated section for managing auto-play functionality
- **Bulk Controls**: 
  - "Add All" button to include all scenes in auto-play list
  - "Clear All" button to remove all scenes from auto-play list
- **Auto-Play Queue Display**: Shows current scenes in auto-play list with removal capability
- **Smart Status Messages**: Context-aware messages based on theme and current state

**2. Enhanced Scene Cards**
- **Visual Indicators**: Animated badges on scene cards that are in auto-play list
- **Auto-Play Toggle Buttons**: Individual buttons to add/remove scenes from auto-play
- **Visual Styling**: 
  - Special border and gradient background for scenes in auto-play list
  - Animated pulse effect on auto-play badges
  - Themed color schemes matching the application's design

**3. Complete Integration**
- **Store Integration**: Full auto-scene state management integration
- **Component Communication**: Seamless integration between SceneGallery and AutoSceneControl
- **Persistent State**: Auto-scene settings are saved to localStorage
- **Real-time Updates**: Changes in Scene Gallery immediately affect Auto Scene Control

#### ✅ Technical Implementation

**Store Functions Added:**
- `isSceneInAutoList(sceneName)`: Check if scene is in auto-play list
- `toggleSceneInAutoList(sceneName)`: Add/remove scene from auto-play list
- `addAllScenesToAutoList()`: Add all available scenes to auto-play list
- `clearAutoSceneList()`: Remove all scenes from auto-play list

**UI Components Added:**
- Auto Scene Management card with info panel
- Bulk control buttons with proper disabled states
- Auto-play queue with indexed scene list
- Individual scene toggle buttons with visual feedback
- Animated indicators and badges

**Styling Features:**
- Comprehensive SCSS module with themed styles
- Responsive design for different screen sizes
- Smooth animations and transitions
- Visual feedback for all user interactions
- Theme-aware messaging (artsnob/standard/minimal)

#### ✅ Testing Verified
1. **Ping-Pong Logic**: Tested and confirmed proper bouncing pattern
2. **Random Mode**: Verified no consecutive duplicates
3. **Edge Cases**: Tested single scene scenarios
4. **Integration**: Confirmed SceneGallery ↔ AutoSceneControl communication
5. **UI Functionality**: All buttons and controls work as expected

#### 🎉 Result
Users now have a complete auto-scene management system that allows them to:
- Easily select scenes for automated playback from the Scene Gallery
- Use bulk operations for efficient scene list management
- See clear visual feedback about which scenes are in auto-play
- Seamlessly integrate with the existing Auto Scene Control functionality
- Enjoy reliable ping-pong, forward, and random playback modes

The implementation is production-ready and provides an intuitive user experience for managing DMX lighting scene automation.

---

## How to Read This Changelog

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles:

- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

*For more detailed information about any changes, please refer to the commit history and pull request discussions.*
