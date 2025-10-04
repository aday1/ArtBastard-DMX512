# Auto-Save & Restore Feature

ArtBastard DMX512 now automatically saves and restores your lighting configuration and states when you start and stop the server.

## What Gets Saved

When you press **Ctrl+C** to stop the server, the following data is automatically saved:

### 1. Configuration Data (`data/config.json`)
- **MIDI Mappings**: All your MIDI controller assignments
- **OSC Assignments**: OSC address mappings for remote control
- **ArtNet Configuration**: Network and device settings
- **OSC Configuration**: OSC server/client settings

### 2. Scene Data (`data/scenes.json`)
- **All Scenes**: Saved lighting scenes and presets
- **Scene Settings**: OSC addresses and automation settings

### 3. Current DMX State (`data/last-state.json`)
- **Live DMX Values**: Current state of all 512 DMX channels
- **Timestamp**: When the state was saved
- **Save Context**: How the state was saved (graceful shutdown)

## How It Works

### On Server Shutdown (Ctrl+C)
```
1. Detects shutdown signal (SIGINT, SIGTERM, etc.)
2. Saves current configuration (MIDI, OSC, ArtNet)
3. Saves all scenes
4. Captures current DMX channel values
5. Writes state to last-state.json
6. Gracefully closes server
```

### On Server Startup
```
1. Server initializes normally
2. Checks for last-state.json
3. If found, restores DMX channel values
4. Broadcasts restored state to connected clients
5. Logs restoration status
```

## Files Created

| File | Purpose | Auto-Created |
|------|---------|--------------|
| `data/config.json` | MIDI/OSC/ArtNet settings | ✅ |
| `data/scenes.json` | Saved scenes and presets | ✅ |
| `data/last-state.json` | Last DMX state snapshot | ✅ |

## Usage Examples

### Starting Server
```bash
npm start
# or
node start-server.js
```

**Output:**
```
[SYSTEM] Found previous state - restoring...
[SYSTEM] DMX state restored successfully (channelsRestored: 15)
[SYSTEM] State restoration completed
```

### Stopping Server (Ctrl+C)
```
^C[SYSTEM] Received SIGINT (Ctrl+C) - Starting graceful shutdown...
[SYSTEM] Saving configuration...
[SYSTEM] Saving scenes...
[SYSTEM] DMX state saved to last-state.json
[SYSTEM] All states saved successfully. Shutting down...
[SYSTEM] Server closed. Goodbye!
```

## Manual State Management

### Force Save Current State
```javascript
// In your code or via socket
const { saveConfig, saveScenes, getDmxChannels } = require('./src/core');

// Save config
saveConfig();

// Save scenes
saveScenes();

// Get current DMX state
const currentState = getDmxChannels();
```

### Load Previous State
```javascript
// Manually restore from last-state.json
const fs = require('fs');
const { setDmxChannels } = require('./src/core');

const stateData = JSON.parse(fs.readFileSync('data/last-state.json', 'utf8'));
setDmxChannels(stateData.dmxChannels);
```

## Benefits

✅ **No Lost Work**: Your lighting setups are preserved between sessions  
✅ **Seamless Resume**: Pick up exactly where you left off  
✅ **MIDI Mappings Preserved**: No need to reconfigure controllers  
✅ **Scene Library Intact**: All saved scenes are available immediately  
✅ **Live State Recovery**: Even in-progress lighting states are restored  

## Troubleshooting

### State Not Restoring?
1. Check if `data/last-state.json` exists
2. Verify file permissions in `data/` directory
3. Look for error messages in console logs

### Configuration Not Saving?
1. Ensure `data/` directory is writable
2. Check disk space
3. Verify no file locks on config files

### Force Fresh Start
```bash
# Remove state files to start clean
rm data/last-state.json
rm data/config.json
rm data/scenes.json
```

## Technical Details

- **Graceful Shutdown Timeout**: 5 seconds before force exit
- **State File Format**: JSON with timestamp and metadata
- **Signal Handling**: Supports SIGINT, SIGTERM, SIGHUP, SIGBREAK (Windows)
- **Error Recovery**: Continues startup even if restoration fails
- **Cross-Platform**: Works on Windows, macOS, and Linux

Your ArtBastard installation now provides enterprise-level state persistence! 🎨✨