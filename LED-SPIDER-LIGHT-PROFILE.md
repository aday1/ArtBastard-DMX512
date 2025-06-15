# LED Spider Light - Fixture Profile

## Overview
**LED Spider Light** - Dual Motor RGBW Moving Head Effect Light

### Specifications
- **Type**: LED Spider Moving Head Effect Light
- **DMX Channels**: 15-Channel Mode
- **Motor Range**: 60°-150° rotation per motor
- **LED System**: Dual RGBW LED modules
- **Effects**: Advanced macro programming with multiple patterns
- **Control**: Independent motor and color control per head

## DMX Channel Configuration

| Channel | Function | Range | Description |
|---------|----------|-------|-------------|
| 1 | Motor 1 Rotate | 0-255 | 60°-150° rotation control |
| 2 | Motor 2 Rotate | 0-255 | 60°-150° rotation control |
| 3 | Master Dimmer | 0-255 | 0-100% intensity control |
| 4 | Strobe | 0-255 | Strobe speed from slow to fast |
| 5 | Motor 1 Red | 0-255 | 0-100% red intensity |
| 6 | Motor 1 Green | 0-255 | 0-100% green intensity |
| 7 | Motor 1 Blue | 0-255 | 0-100% blue intensity |
| 8 | Motor 1 White | 0-255 | 0-100% white intensity |
| 9 | Motor 2 Red | 0-255 | 0-100% red intensity |
| 10 | Motor 2 Green | 0-255 | 0-100% green intensity |
| 11 | Motor 2 Blue | 0-255 | 0-100% blue intensity |
| 12 | Motor 2 White | 0-255 | 0-100% white intensity |
| 13 | Effect Programs | 0-255 | Macro effects and patterns |
| 14 | Effect Speed | 0-255 | Speed control for effects |
| 15 | Reset | 0-255 | System reset function |

## Detailed Channel Values

### Channels 1-2 - Motor Control
- **Motor 1 & 2 Rotate**: 60°-150° continuous rotation
- **0-255**: Linear position control within rotation range
- **Independent Control**: Each motor operates separately

### Channel 3 - Master Dimmer
- **0-255**: Linear dimming from 0-100% brightness
- **Global Control**: Affects both motor LED modules

### Channel 4 - Strobe
- **0-9**: No strobe
- **10-255**: Strobe speed from slow to fast
- **Linear Control**: Progressive speed increase

### Channels 5-8 - Motor 1 RGBW
- **Red (CH5)**: 0-100% red intensity
- **Green (CH6)**: 0-100% green intensity  
- **Blue (CH7)**: 0-100% blue intensity
- **White (CH8)**: 0-100% white intensity
- **Full Color Mixing**: Independent RGBW control

### Channels 9-12 - Motor 2 RGBW
- **Red (CH9)**: 0-100% red intensity
- **Green (CH10)**: 0-100% green intensity
- **Blue (CH11)**: 0-100% blue intensity
- **White (CH12)**: 0-100% white intensity
- **Independent Control**: Separate from Motor 1 colors

### Channel 13 - Effect Programs
Advanced macro programming with multiple effect patterns:

- **0-7**: No effect
- **8-18**: Full brightness
- **19-29**: Stroboscopic effect
- **30-40**: Forward flow water
- **41-51**: Reverse flow
- **52-62**: Double flowing water
- **63-73**: Double reverse glow
- **74-84**: Saltus step
- **85-95**: Monochromatic cycle
- **96-106**: Two-color cycle
- **107-117**: Reverse monochromatic cycle
- **118-128**: Reverse two-color cycle
- **129-139**: V-cycle
- **140-150**: Double V-cycle
- **151-195**: Cycle
- **196-206**: Fast cycle
- **207-216**: U-cycle
- **217-226**: Cycle variation
- **227-236**: Self-propelled
- **237-247**: Y-axis self-propelled
- **248-255**: Voice control

### Channel 14 - Effect Speed
- **0-255**: Speed control for macro effects
- **Linear Control**: From slow to fast effect execution

### Channel 15 - Reset
- **0-240**: No effect
- **241-250**: Reset function (slow to fast)
- **251-255**: No effect

## ArtBastard DMX Integration

### Fixture Template
The LED Spider Light is now available as a template in ArtBastard DMX:
- **Template Name**: "LED Spider Light - Dual Motor RGBW"
- **Default Prefix**: "LED Spider"
- **Channel Count**: 15 channels
- **Auto-configured**: All channels pre-mapped to appropriate types

### Channel Type Mapping
- Motor 1 Rotate → `pan`
- Motor 2 Rotate → `tilt`
- Master Dimmer → `dimmer`
- Strobe → `strobe`
- Motor 1 RGBW → `red`, `green`, `blue`, `white`
- Motor 2 RGBW → `red`, `green`, `blue`, `white`
- Effect Programs → `macro`
- Effect Speed → `speed`
- Reset → `reset`

### Key Features
1. **Dual Motor System**: Independent rotation control (60°-150° each)
2. **Dual RGBW LEDs**: Separate color control per motor head
3. **Advanced Effects**: 20+ macro programs with flow and cycle patterns
4. **Professional Control**: Master dimmer, strobe, and speed control
5. **Voice Activation**: Sound-reactive mode available

### Programming Applications
- **Beam Effects**: Create dynamic crossing beam patterns
- **Color Chases**: Independent color control per head
- **Flow Effects**: Water-like flowing patterns
- **Synchronized Shows**: Coordinate both motors for complex patterns
- **Sound Reactive**: Voice control mode for music sync

### Usage Notes
1. **DMX Address Planning**: Requires 15 consecutive DMX addresses
2. **Motor Coordination**: Use both motors for crossed beam effects
3. **Color Independence**: Each motor head can display different colors
4. **Effect Programming**: Channel 13 provides pre-programmed effects
5. **Speed Control**: Channel 14 affects all macro effect speeds

### Programming Tips
- Combine motor positions with different colors for dynamic effects
- Use effect programs (CH13) for automatic pattern generation
- Master dimmer (CH3) provides fade control over entire fixture
- Voice control mode (248-255) enables sound-reactive operation
- Reset function helps when fixture becomes unresponsive

## Technical Specifications
- **Power**: LED-based low power consumption
- **Motor Range**: 60°-150° per motor (90° total range)
- **Color System**: RGBW LED modules x2
- **Effects**: 20+ pre-programmed macro patterns
- **Control**: Professional DMX with advanced programming
- **Applications**: Club lighting, architectural effects, mobile DJ

## Safety & Operation
- Ensure proper motor clearance during operation
- Monitor for overheating during extended use
- Use reset function for system recovery
- Coordinate DMX addressing to prevent conflicts
- Consider mounting position for optimal beam projection

---
*This fixture profile was created for the ArtBastard DMX512 lighting control system.*
