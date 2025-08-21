# Scene MIDI/OSC System - Complete Implementation

## 🎯 Overview
Complete implementation of comprehensive MIDI Learn and OSC addressing system for individual saved scenes, plus full configuration management with export/import and factory reset capabilities.

## ✨ New Features Implemented

### 1. Individual Scene MIDI/OSC Controls
- **MIDI Learn per Scene**: Each saved scene now has its own MIDI Learn button
- **MIDI Forget per Scene**: Clear MIDI mappings for individual scenes  
- **OSC Addressing per Scene**: Customizable OSC addresses for each scene (default: `/scene/1`, `/scene/2`, etc.)
- **OSC Copy Function**: One-click copy OSC addresses to clipboard

### 2. Configuration Management System
- **Export All Settings**: Download complete configuration as JSON file
- **Import Settings**: Load previously saved configuration files
- **Save as Default**: Set current configuration as the default for new sessions
- **Factory Reset**: Complete system reset to factory defaults with confirmation

### 3. Enhanced Scene Management
- **Scene MIDI Mapping**: Individual scenes can be triggered via MIDI CC or Note messages
- **Scene OSC Integration**: Each scene gets a unique OSC address for remote triggering
- **Persistent Configuration**: All MIDI mappings and OSC addresses are saved and restored

## 🎮 How to Use

### Setting Up Scene MIDI Control
1. **Save a Scene**: Use the "Capture Current State" button in the Scene Management section
2. **MIDI Learn Scene**: Click the "MIDI" button in the scene's control panel
3. **Send MIDI**: Send a MIDI CC or Note message from your controller
4. **Scene Mapped**: The scene can now be triggered by that MIDI input
5. **Test**: Send the MIDI message again to verify the scene loads

### Setting Up Scene OSC Control
1. **Custom OSC Address**: Edit the OSC address field for each scene (default: `/scene/1`)
2. **Copy Address**: Click the copy button to copy the OSC address to clipboard
3. **External Control**: Send OSC messages to the address to trigger scene loading

### Configuration Management
1. **Export Settings**: Click "Export All Settings" to download a complete configuration file
2. **Import Settings**: Click "Import Settings" to load a previously saved configuration
3. **Save as Default**: Click "Save as Default" to make current settings the startup default
4. **Factory Reset**: Click "Factory Reset" to clear all settings and return to defaults

## 📋 Configuration File Format

The exported JSON configuration includes:
```json
{
  "version": "1.0.0",
  "timestamp": 1704067200000,
  "midiMappings": {
    "dimmer": { "channel": 0, "cc": 1, "minValue": 0, "maxValue": 255 },
    "scene-abc123": { "channel": 0, "cc": 10, "minValue": 0, "maxValue": 127 }
  },
  "oscAddresses": {
    "dimmer": "/dimmer"
  },
  "sceneOscAddresses": {
    "scene-abc123": "/scene/1"
  },
  "scenes": [
    {
      "id": "scene-abc123",
      "name": "My Scene",
      "values": { "1": 255, "2": 127 },
      "timestamp": 1704067200000,
      "oscAddress": "/scene/1"
    }
  ],
  "layouts": { /* UI layout configuration */ },
  "settings": { /* Control values and preferences */ }
}
```

## 🔧 Technical Implementation

### Scene MIDI Learn System
- **Dynamic Control Names**: Scene MIDI mappings use format `scene-${sceneId}`
- **MIDI Processing**: Enhanced MIDI handler recognizes scene-specific control names
- **Scene Loading**: MIDI-triggered scenes load via existing `loadScene(index)` function
- **Collision Avoidance**: Each scene gets unique MIDI mapping independent of other controls

### OSC Integration
- **Per-Scene Addresses**: Each scene maintains its own OSC address
- **Address Generation**: Default format `/scene/{index}` with custom override capability
- **Clipboard Integration**: One-click copy for easy external controller setup
- **Address Validation**: OSC addresses are validated and stored per scene

### Configuration Persistence
- **LocalStorage Integration**: Default configuration saved to browser storage
- **File Export/Import**: JSON-based configuration files for backup and sharing
- **Version Management**: Configuration files include version info for compatibility
- **Factory Reset**: Complete state reset with localStorage cleanup

## 🎵 MIDI Control Reference

### Individual Scene Control
- Map any MIDI CC or Note to trigger specific scenes
- Scenes load when MIDI value > 63 (half-way threshold)
- Each scene maintains independent MIDI mapping
- MIDI mappings are preserved in configuration exports

### OSC Control Reference
- Default scene addresses: `/scene/1`, `/scene/2`, `/scene/3`, etc.
- Custom addresses can be set per scene
- OSC messages trigger scene loading
- All OSC addresses included in configuration exports

## 💾 File Management

### Configuration Files
- **Auto-generated filename**: `artbastard-config-YYYY-MM-DD.json`
- **Default configuration**: Stored in localStorage as `artbastard-default-config`
- **Layout persistence**: UI layouts saved separately but included in exports
- **Cross-session compatibility**: Exported configurations work across different sessions

### Factory Reset Behavior
- Clears all MIDI mappings and OSC addresses
- Resets all scenes and scene mappings
- Restores default control values
- Resets UI layout to balanced template
- Clears both localStorage entries

## ⚡ Performance Features
- **Efficient MIDI Processing**: Scene MIDI checks use string prefix matching
- **Minimal Re-renders**: State updates optimized for performance
- **Memory Management**: MIDI listeners cleaned up properly
- **Error Handling**: Graceful fallbacks for invalid configurations

## 🔮 Advanced Usage

### Workflow Integration
1. **Set up fixtures and groups** in the main interface
2. **Create scenes** by setting desired lighting states and capturing
3. **Add MIDI control** to each scene for hands-free operation
4. **Configure OSC addresses** for external software integration
5. **Export configuration** for backup or sharing with other setups
6. **Import configurations** to quickly set up new installations

### Best Practices
- Use descriptive scene names for easy identification
- Test MIDI mappings after setup to ensure proper triggering
- Export configurations regularly as backups
- Use consistent OSC address naming conventions
- Keep default configuration updated with your preferred settings

---

**Implementation Complete**: All requested features for scene MIDI/OSC control and configuration management are now fully functional in SuperControl! 🎉
