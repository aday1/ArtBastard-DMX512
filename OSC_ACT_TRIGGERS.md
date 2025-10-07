# OSC ACT Triggers

ArtBastard now supports OSC triggers for ACTs (Automated Control Tracks), allowing you to start, pause, stop, and control ACTs remotely using OSC messages.

## How It Works

### 1. Setting Up OSC Triggers for ACTs

1. **Open ACT Editor**: Go to the ACTs panel and select an ACT to edit
2. **Add Trigger**: Click "Add Trigger" in the ACT editor
3. **Configure OSC Trigger**:
   - **Type**: Select "OSC"
   - **Address**: Enter the OSC address (e.g., `/act/play`, `/button/1`, `/scene/start`)
   - **Action**: Choose what happens when the OSC message is received:
     - `play` - Start the ACT
     - `pause` - Pause the ACT
     - `stop` - Stop the ACT
     - `toggle` - Toggle play/pause
     - `next` - Go to next step (future feature)
     - `previous` - Go to previous step (future feature)
   - **Enabled**: Toggle to enable/disable the trigger

### 2. OSC Message Format

The OSC message should have:
- **Address**: Must match exactly (case-sensitive)
- **Value**: Any value > 0.5 will trigger the action (button press, not release)

**Examples**:
```
/act/play 1.0     # Triggers play action
/button/1 1       # Triggers if address is /button/1
/scene/start 0.8  # Triggers if address is /scene/start
```

### 3. Backend Processing

The backend automatically:
- Listens for OSC messages on port 8000 (configurable)
- Matches OSC addresses against ACT triggers
- Emits `actTrigger` events to the frontend
- Logs trigger activity for debugging

### 4. Frontend Handling

The frontend:
- Receives `actTrigger` events via Socket.IO
- Executes the appropriate ACT action
- Updates the UI to reflect the current state

## Usage Examples

### TouchOSC Setup
```
Button 1: /act/play 1
Button 2: /act/pause 1  
Button 3: /act/stop 1
Button 4: /act/toggle 1
```

### QLab Integration
```
Cue 1: OSC Message to /act/play with value 1
Cue 2: OSC Message to /act/pause with value 1
Cue 3: OSC Message to /act/stop with value 1
```

### Custom Controller
```
/lighting/act1/play 1.0
/lighting/act1/pause 1.0
/lighting/act1/stop 1.0
```

## Advanced Features

### Multiple Triggers per ACT
- Each ACT can have multiple OSC triggers
- Different addresses can trigger different actions
- Each trigger can be enabled/disabled independently

### Trigger Actions
- **play**: Starts the ACT from the beginning
- **pause**: Pauses the ACT at current position
- **stop**: Stops the ACT and resets to beginning
- **toggle**: If playing, pauses; if paused/stopped, plays
- **next**: (Future) Go to next step in the ACT
- **previous**: (Future) Go to previous step in the ACT

### Logging and Debugging
- All OSC ACT triggers are logged in the server console
- Check `logs/app.log` for trigger activity
- Frontend console shows trigger events

## Configuration

### OSC Server Settings
- **Listen Port**: 8000 (default, configurable)
- **Listen Address**: 0.0.0.0 (all interfaces)
- **Protocol**: UDP

### Trigger Settings
- **Value Threshold**: > 0.5 (button press, not release)
- **Address Matching**: Exact match (case-sensitive)
- **Multiple Triggers**: Supported per ACT

## Troubleshooting

### ACT Not Triggering
1. Check OSC address matches exactly (case-sensitive)
2. Verify OSC value > 0.5
3. Ensure trigger is enabled
4. Check server logs for OSC messages
5. Verify OSC server is running on correct port

### Common Issues
- **Address Mismatch**: `/act/play` vs `/Act/Play` (case-sensitive)
- **Value Too Low**: Use 1.0 instead of 0.1
- **Trigger Disabled**: Check enabled checkbox in ACT editor
- **Port Conflicts**: Ensure port 8000 is available

### Debugging Steps
1. Check server logs: `logs/app.log`
2. Monitor OSC messages in OSC Monitor panel
3. Test with simple OSC client (TouchOSC, etc.)
4. Verify ACT is saved and triggers are configured

## Integration Examples

### TouchOSC Layout
```
[Play ACT]  -> /act/play 1
[Pause ACT] -> /act/pause 1
[Stop ACT]  -> /act/stop 1
[Toggle]    -> /act/toggle 1
```

### QLab Cues
```
Cue 1: OSC /act/play 1.0
Cue 2: OSC /act/pause 1.0
Cue 3: OSC /act/stop 1.0
```

### Custom Python Script
```python
import socket
import struct

def send_osc(address, value):
    # Simple OSC message sender
    message = f"{address},{'f'},{value}"
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(message.encode(), ('127.0.0.1', 8000))
    sock.close()

# Trigger ACT play
send_osc("/act/play", 1.0)
```

## Benefits

✅ **Remote Control**: Start ACTs from any OSC-compatible device  
✅ **Show Integration**: Perfect for QLab, TouchOSC, custom controllers  
✅ **Multiple Actions**: Play, pause, stop, toggle from different triggers  
✅ **Real-time**: Instant response to OSC messages  
✅ **Flexible Addressing**: Use any OSC address pattern you prefer  
✅ **Logging**: Full debugging and monitoring support  

This feature makes ArtBastard ACTs fully controllable from external show control systems and custom controllers!
