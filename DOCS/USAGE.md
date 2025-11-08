# 🎛️ **Usage Guide** - ArtBastard V5.12

> *"Mastery comes not from complexity, but from elegant simplicity in powerful tools. ArtBastard provides the latter; you must provide the former. If you find yourself confused, perhaps you should first acquire a basic understanding of theatrical lighting before attempting to use a tool designed for professionals. We recommend starting with a simple on/off switch and working your way up."*  
> — *Le Créateur des Lumières*

*"This guide assumes a basic understanding of DMX512, theatrical lighting, and general competence. If you find yourself asking 'What is a fixture?' or 'How do I turn on a light?', perhaps you should consult a technical professional, or better yet, acquire one."*

## 🎪 **Interface Overview** *(For Those Who Appreciate Elegance)*

ArtBastard's interface is designed for both precision and speed - essential for live performance. We've eliminated the bloated, cluttered interfaces that plague amateur software, replacing them with elegant controls that respect your intelligence and your artistry.

### **Main Control Areas**
- **Channel Faders** - Individual fixture control
- **Group Controls** - Batch fixture management  
- **Master Fader** - Global intensity control
- **Scene Manager** - Saved lighting states

## 🎨 **Basic Operation** *(The Foundation of All Great Art)*

### **1. Controlling Individual Fixtures** *(Because True Artists Command Every Photon)*
- **Sliders**: Adjust intensity, color, position with the precision your artistry demands. We've made them larger and more responsive, because your time is too valuable for fiddly controls.
- **Color Picker**: Visual color selection that produces hues so pure, they would make Monet question his palette choices. Choose your colors with the confidence of a master painter.
- **Preset Buttons**: Quick access to common settings, because true artists understand the value of efficiency. We've eliminated the tedious menu navigation that plagues amateur software.
- **Fine Control**: Hold Shift for precise adjustments. Because sometimes, a single percentage point makes all the difference between art and mere illumination.

### **2. Working with Groups** *(Because True Artists Think in Compositions)*
- Select multiple fixtures using Ctrl+Click - *obviously*. We assume you possess at least this level of competence.
- Create groups for efficient batch control. Because true artists understand that lighting is not about individual fixtures, but about compositions.
- Use group faders for consistent lighting looks. Command entire groups of fixtures with a single gesture, as it should be.

### **3. Scene Management** *(Because True Artists Preserve Their Masterpieces)*
- **Record**: Capture current lighting state with the precision it deserves. Your compositions are worth preserving.
- **Recall**: Instantly return to saved scenes. Because true artists understand the value of preparation, even in the heat of performance.
- **Edit**: Modify existing scenes on-the-fly. Because true artistry sometimes requires improvisation, even within a prepared composition.
- **Crossfade**: Smooth transitions between scenes that eliminate the jarring cuts that plague amateur systems. Your audience deserves better.

### **4. Face Tracking** *(The Future of Photonic Control)*
- **Real-time Face Detection**: Advanced OpenCV-based facial recognition that tracks your movements with precision worthy of a professional installation.
- **Gesture Recognition**: The system detects nodding, head shaking, and stationary states, transforming your movements into photonic choreography.
- **Pan/Tilt Mapping**: Your head movements control fixture pan and tilt in real-time. Nod for tilt, shake for pan - *c'est magnifique!*
- **Consolidated Configuration**: All settings (camera, tracking, DMX channels, OSC endpoints) unified on a single page, because toggling between pages is for peasants.
- **Camera Selection**: Choose from available cameras with user-friendly buttons, because true artists deserve intuitive interfaces.
- **Live Feedback**: Real-time sliders show pan and tilt values as you move, providing visual confirmation that your artistry is being translated into photonic control.

### **5. Scene Management with MIDI/OSC** *(Because True Artists Prepare)*
- **Per-Scene MIDI Mapping**: Each saved scene can have its own MIDI trigger. Click "MIDI" on any scene, send a MIDI CC or Note, and that scene is now mapped.
- **Per-Scene OSC Addresses**: Each scene gets a unique OSC address (default: `/scene/1`, `/scene/2`, etc.) with custom override capability.
- **Configuration Export/Import**: Export all settings (including scene MIDI/OSC mappings) as JSON for backup or sharing.
- **Factory Reset**: Complete system reset to factory defaults (for those rare moments when even you need a fresh start).

*Because true artists understand that lighting is not about individual fixtures, but about compositions. Your scenes deserve to be triggered with the precision of a maestro, and ArtBastard ensures they are.*

## 🎹 **MIDI Control**

### **MIDI Learning**
1. Right-click any control
2. Select **"Learn MIDI"**
3. Move your MIDI controller
4. Control is now mapped

### **Popular MIDI Controllers**
- **Behringer BCF2000** - 8 motorized faders
- **Akai APC40** - Grid-based control
- **NanoKontrol** - Compact solution
- **OSC Protocol** - Wireless control via mobile devices

## 📱 **Touch Interface**

### **Touch Optimization**
- **Large Controls**: 44px+ touch targets
- **Drag Zones**: Clear resize handles
- **Gesture Support**: Pinch-to-zoom, swipe navigation
- **Haptic Feedback**: Visual response to touches


## ⚡ **Live Performance Workflow**

### **Pre-Show Setup**
1. **Load Show File** - Import your saved configuration
2. **Test All Fixtures** - Verify hardware connections  
3. **Check Scenes** - Confirm all cues are working
4. **MIDI Check** - Test controller responsiveness

### **During Show**
- **Master Fader** for house lights/overrides
- **Scene Triggers** for major lighting changes
- **Manual Override** for spontaneous adjustments
- **Emergency Blackout** (spacebar or dedicated button)

### **Advanced Techniques**
- **Crossfade Timing** - Adjust transition speeds
- **Chase Effects** - Automated sequences
- **Beat Sync** - Audio-responsive lighting
- **Backup Scenes** - Always have a fallback plan

## 🔧 **Keyboard Shortcuts**
- **Spacebar** - Emergency blackout toggle
- **Ctrl+S** - Save current state
- **Ctrl+Z** - Undo last change
- **F11** - Toggle fullscreen
- **Ctrl+H** - Help overlay
- **Esc** - Close dialogs/overlays

---
**Next:** [Features](./FEATURES.md) | [History](./HISTORY.md)