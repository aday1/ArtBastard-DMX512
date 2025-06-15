# MINI BEAM Moving Head Light - Fixture Profile

## Overview
**MINI BEAM 250W Moving Head Beam Light** - Professional Pan/Tilt Prism Mover

### Specifications
- **Type**: Moving Head Beam Light
- **Power**: 250W
- **DMX Channels**: 16-Channel Mode
- **Pan Range**: 540° horizontal movement
- **Tilt Range**: 270° vertical movement  
- **Fine Movement**: 1.2° precision for Pan/Tilt
- **Prism System**: Dual prism configuration
- **Gobo Wheels**: 17 rotating gobos with effects
- **Color System**: 20+ color wheel with CTOs

## DMX Channel Configuration

| Channel | Function | Range | Description |
|---------|----------|-------|-------------|
| 1 | Color Wheel | 0-255 | 20+ colors including CTOs, rotation effects |
| 2 | Flash/Strobe | 0-255 | Variable strobe, pulse effects, random strobe |
| 3 | Dimmer | 0-255 | Linear intensity control |
| 4 | Gobo | 0-255 | 17 gobos + rotation + shake effects |
| 5 | Prism 1 | 0-255 | Primary prism system |
| 6 | Prism Rotation | 0-255 | Prism rotation control |
| 7 | Prism 2 | 0-255 | Secondary prism system |
| 8 | Frost | 0-255 | Linear frost effect |
| 9 | Focus | 0-255 | Pattern clarity adjustment |
| 10 | Pan | 0-255 | 540° horizontal movement |
| 11 | Pan Fine | 0-255 | 1.2° fine adjustment |
| 12 | Tilt | 0-255 | 270° vertical movement |
| 13 | Tilt Fine | 0-255 | 1.2° fine adjustment |
| 14 | Function/Speed | 0-255 | Pan/Tilt speed macro |
| 15 | Reset | 0-255 | System reset function |
| 16 | Lamp | 0-255 | Lamp control and system reset |

## Detailed Channel Values

### Channel 1 - Color Wheel
- **0-4**: White
- **5-9**: White + Red
- **10-14**: Red  
- **15-19**: Red + Orange
- **20-24**: Orange
- **25-29**: Orange + Aquamarine
- **30-34**: Aquamarine
- **35-39**: Aquamarine + Green
- **40-44**: Green
- **45-49**: Green + Light Green
- **50-54**: Light Green
- **55-59**: Light Green + Yellow
- **60-64**: Yellow
- **65-69**: Yellow + Pink
- **70-74**: Pink
- **75-79**: Pink + Blue
- **80-84**: Blue
- **85-89**: Blue + Warm White
- **90-94**: Warm White
- **95-99**: Warm White + Cyan
- **100-104**: Cyan
- **105-109**: Cyan + CTO 260
- **110-114**: CTO 260
- **115-119**: CTO 260 + CTO 190
- **120-124**: CTO 190
- **125-129**: CTO 190 + CTB 8000
- **130-134**: CTB 8000
- **135-139**: CTB 8000 + Blue
- **140-144**: Blue
- **145-149**: Blue + White
- **150-199**: Slow Rotation (0.2rpm)
- **200-255**: Fast Rotation

### Channel 2 - Flash/Strobe
- **0-5**: Full Off
- **6-11**: Full On
- **12-107**: Strobe from slow to fast
- **108-149**: Pulse effect opening, increasing
- **150-191**: Pulse effect closing, increasing
- **192-251**: Random strobe with decreasing speed
- **252-255**: Full On

### Channel 3 - Dimmer
- **0-255**: Linear dimming from dark to bright

### Channel 4 - Gobo
- **0-2**: White (open)
- **3-53**: Gobos 1-17 (static positions)
- **54-69**: Gobo rotation forward
- **70-85**: Gobo rotation backward
- **86-245**: Individual gobo shake effects (slow to quick)

### Channel 5 - Prism 1
- **0-127**: No prism
- **128-255**: Prism active

### Channel 6 - Prism Rotation
- **0-10**: Stop
- **11-120**: Prism rotation forward
- **121-255**: Prism rotation backward

### Channels 10-13 - Movement System
- **Pan (CH10)**: 0-540° horizontal movement
- **Pan Fine (CH11)**: 1.2° precision adjustment
- **Tilt (CH12)**: 0-270° vertical movement  
- **Tilt Fine (CH13)**: 1.2° precision adjustment

### Channel 14 - Function/Speed
- **0-255**: Pan/Tilt movement speed from slow to fast

### Channel 15 - Reset
- **0-239**: No effect
- **240-255**: System reset

### Channel 16 - Lamp Control
- **0-99**: No function
- **100-105**: Lamp Off
- **106-199**: No function
- **200-205**: Lamp On
- **206-249**: No function
- **250-255**: System Reset

## ArtBastard DMX Integration

### Fixture Template
The MINI BEAM fixture is now available as a template in ArtBastard DMX:
- **Template Name**: "MINI BEAM - Pan/Tilt Prism Mover"
- **Default Prefix**: "MINI BEAM"
- **Channel Count**: 16 channels
- **Auto-configured**: All channels pre-mapped to appropriate types

### Channel Type Mapping
- Color Wheel → `color_wheel`
- Flash/Strobe → `strobe`
- Dimmer → `dimmer`
- Gobo → `gobo_wheel`
- Prism 1 & 2 → `prism`
- Prism Rotation → `gobo_rotation`
- Frost → `other`
- Focus → `focus`
- Pan/Pan Fine → `pan`
- Tilt/Tilt Fine → `tilt`
- Function/Speed → `macro`
- Reset → `reset`
- Lamp → `other`

### Usage Notes
1. **DMX Address Planning**: Requires 16 consecutive DMX addresses
2. **Fine Movement**: Channels 11 & 13 provide precision control
3. **Dual Prism System**: Channels 5 & 7 for advanced beam effects
4. **Lamp Management**: Always use Channel 16 for proper lamp control
5. **Reset Function**: Channel 15 (240-255) for system reset

### Programming Tips
- Use fine channels (11, 13) for smooth movement programming
- Combine both prism channels for complex beam effects
- Color wheel slow rotation (150-199) creates dynamic color changes
- Gobo shake effects (86-245) add movement texture
- Always ensure proper lamp on/off sequences via Channel 16

## Safety & Operation
- Allow proper warm-up time before full operation
- Use reset functions when fixture becomes unresponsive
- Monitor lamp hours for maintenance scheduling
- Ensure adequate DMX addressing to prevent conflicts

---
*This fixture profile was created for the ArtBastard DMX512 lighting control system.*
