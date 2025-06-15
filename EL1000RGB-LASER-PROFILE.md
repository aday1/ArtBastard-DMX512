# EL1000RGB Laser Projector - Fixture Profile

## Overview
**EL1000RGB Laser Projector** - Professional RGB Laser with Advanced Pattern Control

### Specifications
- **Type**: RGB Laser Projector
- **DMX Channels**: 16-Channel Mode
- **Color System**: RGB laser diodes
- **Pattern System**: 5 inner pattern groups with multiple options
- **Effects**: Dynamic zoom, rotation, wave, and drawing effects
- **Control**: Comprehensive DMX control with auto and manual modes

## DMX Channel Configuration

| Channel | Function | Range | Description |
|---------|----------|-------|-------------|
| 1 | Laser On/Off | 0-255 | Laser power control |
| 2 | Color Control | 0-255 | Static colors, dynamic effects |
| 3 | Color Speed | 0-255 | Speed control for color effects |
| 4 | Pattern Option | 0-255 | Pattern selection within groups |
| 5 | Pattern Group | 0-255 | 5 inner pattern groups |
| 6 | Pattern Size | 0-255 | Manual pattern size control |
| 7 | Pattern Auto Zoom | 0-255 | Automatic zoom effects |
| 8 | Center Rotation | 0-255 | Pattern center rotation |
| 9 | Horizontal Rotation | 0-255 | Horizontal flip and rotation |
| 10 | Vertical Rotation | 0-255 | Vertical flip and rotation |
| 11 | Horizontal Move | 0-255 | Horizontal positioning |
| 12 | Vertical Move | 0-255 | Vertical positioning |
| 13 | Wave Effect | 0-255 | Wave distortion effects |
| 14 | Pattern Drawing | 0-255 | Drawing and animation modes |
| 15 | Inner Dynamic Effect | 0-255 | Built-in dynamic effects |
| 16 | Inner Effect Speed | 0-255 | Speed control for dynamic effects |

## Detailed Channel Values

### Channel 1 - Laser On/Off
- **0-9**: Laser Off
- **10-255**: Laser On

### Channel 2 - Color Control
- **0-69**: Static colors (white-red-blue-pink-cyan-yellow-green)
- **70-79**: Color change (speed controlled by Ch. 3)
- **80-89**: Default color (speed controlled by Ch. 3)
- **90-99**: Rainbow color (speed controlled by Ch. 3)
- **100-224**: Segment color, 5 data stepping (speed controlled by Ch. 3)
- **225-229**: Dynamic color 1 (speed controlled by Ch. 3)
- **230-234**: Dynamic color 2 (speed controlled by Ch. 3)
- **235-239**: Dynamic color 3 (speed controlled by Ch. 3)
- **240-244**: Dynamic color 4 (speed controlled by Ch. 3)
- **245-249**: Dynamic color 5 (speed controlled by Ch. 3)
- **250-255**: Dynamic color 6 (speed controlled by Ch. 3)

### Channel 3 - Color Speed
- **0-9**: No function
- **10-127**: Clockwise rotation, slow to fast
- **128-255**: Anticlockwise rotation, slow to fast

### Channel 4 - Pattern Option
- **0-255**: Pattern selection within the chosen group

### Channel 5 - Pattern Group Option
- **0-50**: Inner patterns group 1
- **51-101**: Inner patterns group 2
- **102-152**: Inner patterns group 3
- **153-203**: Inner patterns group 4
- **204-255**: Inner patterns group 5

### Channel 6 - Pattern Size
- **0-255**: Manual pattern size adjustment

### Channel 7 - Pattern Auto Zoom
- **0-15**: Manual zoom
- **16-55**: Zoom small to large, speed slow to fast
- **56-95**: Zoom large to small, speed slow to fast
- **96-135**: Cycle zoom large to small, speed slow to fast
- **136-175**: Cycle zoom 1, speed slow to fast
- **176-215**: Cycle zoom 2, speed slow to fast
- **216-255**: Cycle zoom 3, speed slow to fast

### Channel 8 - Center Rotation
- **0-127**: Rotation angle (static positioning)
- **128-191**: Clockwise rotation speed
- **192-255**: Anticlockwise rotation speed

### Channel 9 - Horizontal Rotation
- **0-127**: Flip horizontal location (static)
- **128-255**: Flip horizontal speed (continuous)

### Channel 10 - Vertical Rotation
- **0-127**: Flip vertical location (static)
- **128-255**: Flip vertical speed (continuous)

### Channel 11 - Horizontal Move
- **0-127**: Horizontal location (manual positioning)
- **128-255**: Horizontal auto location, speed slow to fast

### Channel 12 - Vertical Move
- **0-127**: Vertical rotation (manual positioning)
- **128-255**: Vertical auto location, speed slow to fast

### Channel 13 - Wave Effect
- **0-9**: No function
- **10-255**: Wave range and speed (range small to large, speed slow to fast)

### Channel 14 - Pattern Drawing
- **0-1**: No function
- **2-63**: Drawing by manual adjustment 1
- **64-127**: Drawing by manual adjustment 2
- **128-153**: Automatic drawing (increasing)
- **154-179**: Automatic drawing (decreasing)
- **180-205**: Automatic drawing (increasing to decreasing, reverse)
- **206-255**: Automatic drawing (increasing to decreasing)

### Channel 15 - Inner Dynamic Effect
- **0-2**: No function
- **3-229**: Single group dynamic effect (speed and color controlled by Ch. 16)
- **230-249**: Random auto effect (speed and color controlled by Ch. 16)

### Channel 16 - Inner Effect Speed
- **0-127**: Inner effect speed, fast to slow (color determined by inner program)
- **128-255**: Inner effect speed, fast to slow (color determined by DMX)

## ArtBastard DMX Integration

### Fixture Template
The EL1000RGB Laser is now available as a template in ArtBastard DMX:
- **Template Name**: "EL1000RGB Laser Projector"
- **Default Prefix**: "EL1000RGB"
- **Channel Count**: 16 channels
- **Auto-configured**: All channels pre-mapped to appropriate types

### Channel Type Mapping
- Laser On/Off → `other`
- Color Control → `color_wheel`
- Color Speed → `speed`
- Pattern Option → `gobo_wheel`
- Pattern Group → `gobo_wheel`
- Pattern Size → `zoom`
- Pattern Auto Zoom → `zoom`
- Center Rotation → `gobo_rotation`
- Horizontal/Vertical Rotation → `pan`/`tilt`
- Horizontal/Vertical Move → `pan`/`tilt`
- Wave Effect → `effect`
- Pattern Drawing → `effect`
- Inner Dynamic Effect → `macro`
- Inner Effect Speed → `speed`

### Key Features
1. **RGB Color System**: Static colors plus 6 dynamic color modes
2. **5 Pattern Groups**: Extensive pattern library organization
3. **Advanced Zoom**: Multiple automatic zoom cycles
4. **Multi-Axis Control**: Center, horizontal, and vertical rotation
5. **Wave Effects**: Distortion and animation capabilities
6. **Dynamic Effects**: Built-in automatic effects with speed control

### Programming Applications
- **Static Displays**: Fixed patterns with manual positioning
- **Dynamic Shows**: Automatic effects with speed control
- **Color Sequences**: Rainbow and dynamic color cycling
- **Geometric Patterns**: Precise pattern group selection
- **Animation Effects**: Drawing modes with wave distortion

### Usage Notes
1. **DMX Address Planning**: Requires 16 consecutive DMX addresses
2. **Laser Safety**: Always ensure proper laser safety protocols
3. **Pattern Groups**: Use Channel 5 to select pattern categories
4. **Color Speed**: Channel 3 controls speed for most color effects
5. **Dynamic Effects**: Channels 15-16 provide automated programming

### Programming Tips
- Start with laser on (CH1 > 10) before programming other channels
- Use pattern groups (CH5) to organize different show segments
- Combine manual positioning (CH11-12, 0-127) with auto effects (128-255)
- Wave effects (CH13) add organic movement to static patterns
- Dynamic effects (CH15) provide automated shows with minimal programming

### Professional Applications
- **Concert Lighting**: Dynamic laser shows with music sync
- **Architectural Projection**: Building and facade illumination
- **Club and Venue**: Atmospheric effects and dance floor lighting
- **Corporate Events**: Logo projection and branding displays
- **Art Installations**: Interactive and automated laser art

## Safety Considerations
- **Laser Safety**: Comply with local laser safety regulations
- **Eye Protection**: Never aim directly at audiences without proper safety measures
- **Scanning**: Ensure adequate scan fail-safe systems
- **Venue Requirements**: Check venue laser approval requirements
- **Professional Installation**: Use qualified laser technicians for setup

## Technical Specifications
- **Laser Class**: Professional RGB laser system
- **Pattern Library**: 5 groups with multiple patterns each
- **Color Modes**: Static + 6 dynamic color effects
- **Animation**: Multiple zoom, rotation, and wave effects
- **Control**: 16-channel DMX with comprehensive parameter control
- **Effects**: Built-in automatic effects with speed control

---
*This fixture profile was created for the ArtBastard DMX512 lighting control system. Always follow proper laser safety protocols.*
