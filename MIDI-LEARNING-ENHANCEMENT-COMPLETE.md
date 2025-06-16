# Super Control MIDI Learning & Scene Management - Complete Implementation

## Overview
This document outlines the comprehensive MIDI learning enhancements added to the Super Control panel, including range support, fixture/group navigation, scene management, and OSC integration for full MIDI control of the ArtBastard DMX512 system.

## New Features Implemented

### 1. Enhanced MIDI Learning with Range Support

**Purpose**: Provides precise MIDI control mapping with customizable value ranges for all lighting controls.

**Key Features**:
- **Range Mapping**: Set custom min/max values for MIDI controller ranges
- **Multiple MIDI Types**: Support for MIDI CC (Control Change) and Note messages
- **Channel Assignment**: Map controls to specific MIDI channels
- **Visual Feedback**: Real-time display of MIDI mappings
- **Easy Management**: One-click clear mapping functionality

**Implementation**:
```typescript
interface MidiMapping {
  channel?: number;
  note?: number;
  cc?: number;
  minValue: number;
  maxValue: number;
  oscAddress?: string;
}
```

**Controls with Range Support**:
- Dimmer (0-255 range, customizable)
- Lamp Control (0-255 range, customizable)
- Pan/Tilt (0-255 range each)
- RGB Colors (0-255 range each)
- GOBO Selection (discrete values)
- Shutter/Strobe (0-255 range)

### 2. Fixture Navigation with MIDI Control

**Purpose**: Enables rapid fixture selection and navigation using MIDI controllers.

**Features**:
- **Previous/Next Fixture**: Navigate through all available fixtures
- **MIDI Note Mapping**: Assign MIDI notes for fixture navigation
- **Visual Selection Feedback**: Shows current fixture name and index
- **Circular Navigation**: Seamlessly loops through fixture list
- **OSC Integration**: Parallel OSC address mapping

**MIDI Mappings**:
- `fixture_previous`: MIDI note for previous fixture
- `fixture_next`: MIDI note for next fixture
- OSC Address: `/fixture/nav` (customizable)

**UI Components**:
- Previous/Next navigation buttons
- Current fixture display with index (e.g., "Moving Head 1 (2/5)")
- Dedicated MIDI learn buttons for each direction
- OSC address input field

### 3. Group Navigation with MIDI Control

**Purpose**: Allows MIDI-controlled navigation through fixture groups.

**Features**:
- **Previous/Next Group**: Navigate through all available groups
- **MIDI Note Mapping**: Assign MIDI notes for group navigation
- **Group Selection**: Automatically selects all fixtures in the group
- **Visual Feedback**: Shows current group name and fixture count
- **OSC Integration**: Dedicated OSC addresses for group control

**MIDI Mappings**:
- `group_previous`: MIDI note for previous group
- `group_next`: MIDI note for next group
- OSC Address: `/group/nav` (customizable)

### 4. Advanced Scene Management System

**Purpose**: Comprehensive scene capture, storage, and recall with MIDI/OSC control.

**Scene Capture Features**:
- **Automatic Capture**: Records all active DMX channel values (>0)
- **Named Scenes**: Custom scene names or auto-generated timestamps
- **Channel Count Display**: Shows number of channels stored per scene
- **Timestamp Tracking**: Records creation time for each scene
- **Auto-save Option**: Automatic scene capture on value changes

**Scene Management**:
- **Scene List Display**: Visual grid of all saved scenes
- **Load Scene**: One-click scene recall
- **Delete Scene**: Individual scene removal
- **Scene Navigation**: Previous/Next scene browsing
- **Active Scene Highlighting**: Visual indication of current scene

**MIDI/OSC Integration**:
- `scene_save`: MIDI note to capture current scene
- `scene_previous`: MIDI note for previous scene
- `scene_next`: MIDI note for next scene
- OSC Address: `/scene/control` (customizable)

### 5. OSC Integration

**Purpose**: Provides Open Sound Control protocol support for external applications.

**Features**:
- **Customizable Addresses**: User-defined OSC addresses for all controls
- **Parallel MIDI/OSC**: Both protocols can be used simultaneously
- **Address Validation**: Real-time OSC address formatting
- **Professional Integration**: Compatible with lighting consoles and software

**Default OSC Addresses**:
- `/dimmer` - Dimmer control
- `/lamp` - Lamp control
- `/fixture/nav` - Fixture navigation
- `/group/nav` - Group navigation
- `/scene/control` - Scene management

## Technical Implementation

### State Management

```typescript
// Enhanced MIDI mappings with range support
const [midiMappings, setMidiMappings] = useState<Record<string, {
  channel?: number;
  note?: number;
  cc?: number;
  minValue: number;
  maxValue: number;
  oscAddress?: string;
}>>({});

// Navigation state
const [currentFixtureIndex, setCurrentFixtureIndex] = useState(0);
const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

// Scene management state
const [scenes, setScenes] = useState<Array<{
  id: string;
  name: string;
  values: Record<number, number>;
  timestamp: number;
}>>([]);
```

### Core Functions

**MIDI Learning with Range Support**:
```typescript
const startMidiLearn = (controlType: string, minValue: number = 0, maxValue: number = 255) => {
  setMidiLearnTarget(controlType);
  // Integration with MIDI system
};

const setMidiMapping = (controlType: string, midiData: MidiMapping) => {
  setMidiMappings(prev => ({ ...prev, [controlType]: midiData }));
};
```

**Fixture Navigation**:
```typescript
const selectNextFixture = () => {
  const nextIndex = (currentFixtureIndex + 1) % fixtures.length;
  setCurrentFixtureIndex(nextIndex);
  setSelectedFixtures([fixtures[nextIndex].id]);
  setSelectionMode('fixtures');
};
```

**Scene Management**:
```typescript
const captureCurrentScene = (name?: string) => {
  const sceneValues: Record<number, number> = {};
  for (let i = 1; i <= 512; i++) {
    const value = getDmxChannelValue(i);
    if (value > 0) sceneValues[i] = value;
  }
  // Create and store scene
};
```

## User Interface Components

### 1. MIDI/OSC Navigation Section

**Layout**: Three-column grid with responsive design
- **Fixture Navigation**: Previous/Next buttons with current fixture display
- **Group Navigation**: Previous/Next buttons with current group display  
- **Scene Management**: Save, Previous, Next controls with scene list

**Visual Elements**:
- Color-coded buttons for different functions
- Real-time status displays
- MIDI learn buttons with learning state indication
- OSC address input fields
- Current selection highlighting

### 2. Enhanced Control Rows

**Range Input Controls**:
- Min/Max value inputs for custom ranges
- MIDI mapping display with channel/CC information
- Clear mapping functionality
- OSC address configuration

**Visual Feedback**:
- Learning state animation
- Active mapping indicators
- Range value display
- Connection status indicators

### 3. Scene Management Interface

**Scene List Grid**:
- Responsive card layout
- Scene name, channel count, and timestamp
- Load and delete buttons
- Active scene highlighting
- Auto-save toggle

**Scene Controls**:
- Capture current scene button
- Navigation controls
- Scene counter display
- Auto-save option

## Integration Points

### MIDI Controller Integration

The system is designed to integrate with standard MIDI controllers:

**Supported MIDI Messages**:
- **Control Change (CC)**: For continuous controls (sliders, knobs)
- **Note On/Off**: For trigger functions (buttons, pads)
- **Channel Assignment**: Multi-channel MIDI support

**Value Mapping**:
- MIDI input range (0-127) mapped to custom output ranges
- Bi-directional feedback support
- Real-time value translation

### OSC Protocol Support

**Message Formats**:
- Float values for continuous controls
- Integer values for discrete selections
- Bang messages for trigger functions

**Network Integration**:
- UDP/TCP OSC message support
- Standard OSC address formatting
- Compatible with TouchOSC, QLab, and lighting consoles

## Configuration Examples

### Example 1: MIDI Controller Setup
```
Control: Dimmer
MIDI Channel: 1
MIDI CC: 7 (Volume/Fader)
Range: 0-255 (full range)
OSC: /dimmer
```

### Example 2: Scene Navigation
```
Scene Previous: MIDI Note C2 (36)
Scene Next: MIDI Note C#2 (37)
Scene Save: MIDI Note D2 (38)
OSC: /scene/control
```

### Example 3: Fixture Navigation
```
Previous Fixture: MIDI Note F2 (41)
Next Fixture: MIDI Note F#2 (42)
OSC: /fixture/nav
```

## Advanced Usage Scenarios

### Live Performance Setup

1. **Main Dimmer**: Assign to MIDI fader for primary lighting control
2. **Fixture Selection**: Use MIDI buttons for rapid fixture switching
3. **Scene Recall**: Map scenes to drum pads for instant lighting changes
4. **Effect Controls**: Assign RGB, GOBO, and effects to individual knobs

### DJ/Club Integration

1. **Beat-synchronized Control**: Map to DJ software for music-reactive lighting
2. **Scene Banking**: Pre-program scenes for different music styles
3. **Emergency Controls**: Quick access to house lights and safety scenes
4. **Visual Cueing**: Scene names and visual feedback for dark environments

### Theater/Event Production

1. **Cue Integration**: OSC integration with QLab or similar software
2. **Backup Control**: MIDI controllers as backup for main lighting console
3. **Remote Operation**: Wireless MIDI controllers for remote lighting adjustment
4. **Preset Management**: Scene system for complex lighting states

## Troubleshooting Guide

### MIDI Learning Issues
- **No MIDI Input**: Check MIDI device connection and browser permissions
- **Learning Not Starting**: Ensure target control is properly selected
- **Range Issues**: Verify min/max values are within valid DMX range (0-255)

### Navigation Problems
- **No Fixtures/Groups**: Ensure fixtures and groups are properly configured
- **Selection Not Changing**: Check that navigation mode matches intended targets
- **MIDI Not Triggering**: Verify MIDI mapping and device communication

### Scene Management Issues
- **Scenes Not Saving**: Check that DMX values are active (>0)
- **Loading Errors**: Verify scene data integrity and DMX channel availability
- **Navigation Problems**: Ensure scene index is within valid range

## Performance Optimizations

### Memory Management
- Scene data is stored efficiently with only non-zero values
- MIDI mapping storage is optimized for fast lookup
- UI updates are throttled to maintain 60fps performance

### Real-time Performance
- MIDI message processing is prioritized for low latency
- Scene loading is optimized for rapid recall
- Navigation functions use cached fixture/group data

## Future Enhancement Roadmap

### Advanced MIDI Features
- **MIDI Clock Sync**: Synchronize effects with MIDI timing
- **SysEx Support**: Advanced controller configuration
- **MIDI Learn Automation**: Bulk learning and template import/export

### Enhanced Scene System
- **Scene Crossfading**: Smooth transitions between scenes
- **Scene Sequencing**: Automated scene playback
- **Scene Libraries**: Import/export and sharing capabilities

### Professional Integration
- **Art-Net Integration**: Network lighting protocol support
- **sACN Support**: Industry-standard streaming ACN protocol
- **Console Integration**: Direct integration with professional lighting consoles

## Conclusion

The enhanced MIDI learning and scene management system transforms the ArtBastard DMX512 Super Control panel into a professional-grade lighting control interface. With comprehensive range support, intuitive navigation, and robust scene management, users can achieve complex lighting control scenarios with simple MIDI controllers.

The system's dual MIDI/OSC support ensures compatibility with a wide range of professional lighting equipment and software, making it suitable for everything from small clubs to major theater productions. The intuitive interface maintains ease of use while providing the depth and flexibility that lighting professionals require.

This implementation establishes the ArtBastard DMX512 system as a leading solution for MIDI-controlled lighting, offering features typically found only in high-end professional lighting consoles.
