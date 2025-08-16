# 🌈 **ArtBastard DMX512** V5.12 - *Photonic Supremacy* 🎭
### *Élite Illumination Control for the Discerning Luminaire Artist*

> *"Light is not merely illumination - it is emotion made visible. ArtBastard V5.12 gives you the tools; you provide the vision."* - *Le Créateur des Lumières*

## ⚡ **Professional DMX512 Control That Actually Works**

Built for theaters, clubs, installations, and anywhere photons need proper discipline. No more bloated interfaces or cryptic controls - just elegant power.

### 🎯 **What ArtBastard V5.12 Delivers**
- **Professional DMX512 Control** - Complete universe management
- **Real-time MIDI Integration** - Hardware controller harmony  
- **Touch-Optimized Interface** - Responsive control surfaces
- **Intelligent Fixture Profiles** - Pre-configured luminaire support
- **Live Performance Ready** - Stable, fast, reliable

### ✨ **V5.12 "Photonic Supremacy" Refinements**
- **Streamlined Documentation** - Actually readable guides
- **Enhanced UI Polish** - Refined aesthetics without complexity
- **Intelligent Help System** - Concise guidance when needed
- **Optimized Performance** - Smoother operation across devices
- **Professional Color Schemes** - Easy on eyes during long shows

## 🚀 **Quick Start**

### **1. Installation**
```bash
git clone https://github.com/aday1/ArtBastard-DMX512.git
cd ArtBastard-DMX512
npm run install-all
npm run build
npm start
```

### **2. Basic Setup**
1. Connect your DMX interface
2. Configure fixtures in **Fixture Setup**
3. Test controls in **Channel Control**  
4. Create scenes in **Scene Manager**

### **3. Hardware Integration** 
- **MIDI Controllers**: Auto-detection with learn mode
- **TouchOSC**: Wireless tablet/phone control
- **Art-Net**: Network DMX distribution
- **Touch Screens**: Optimized interface scaling

## 📚 **Documentation**
Comprehensive guides organized for actual use:

- **[Installation](./DOCS/INSTALL.md)** - Get running quickly
- **[Fixture Setup](./DOCS/FIXTURES.md)** - Configure your lights  
- **[Usage Guide](./DOCS/USAGE.md)** - Master the interface
- **[Features](./DOCS/FEATURES.md)** - Explore capabilities
- **[History](./DOCS/HISTORY.md)** - The ArtBastard chronicles

## 🎛️ **Core Control Features**

### **Professional Fixture Support**
- **Moving Head Lights** - Pan/tilt, GOBO, color wheels
- **LED Wash Fixtures** - RGB/RGBW color mixing
- **Traditional Dimmers** - Smooth intensity control
- **Effect Lights** - Strobes, patterns, animations

### **Performance Controls**  
- **Scene Management** - Instant lighting state recall
- **MIDI Integration** - Hardware controller mapping
- **Touch Optimization** - Tablet and touch screen ready
- **External Monitor** - Dedicated control surfaces

## 🔧 **Technical Specifications**
- **DMX512 Protocol** - Full universe support (512 channels)
- **Art-Net/sACN** - Network-based DMX distribution
- **OSC Protocol** - Wireless control integration
- **WebMIDI API** - Browser-based MIDI support
- **Modern Web Stack** - React, TypeScript, Node.js

## 🎯 **System Architecture**

```mermaid
graph TB
    subgraph "🎛️ CONTROL LAYER"
        UI[Web Interface]
        MIDI[MIDI Controllers]
        OSC[TouchOSC/Tablets]
    end
    
    subgraph "⚙️ PROCESSING CORE"
        Engine[ArtBastard Engine]
        Scenes[Scene Manager]
        Fixtures[Fixture Profiles]
    end
    
    subgraph "📡 OUTPUT LAYER"
        DMX[DMX512 Interface]
        ArtNet[Art-Net Network]
        Lights[Lighting Fixtures]
    end
    
    UI --> Engine
    MIDI --> Engine
    OSC --> Engine
    Engine --> Scenes
    Engine --> Fixtures
    Engine --> DMX
    Engine --> ArtNet
    DMX --> Lights
    ArtNet --> Lights
```

## 🎪 **Live Performance Workflow**

### **Pre-Show**
1. Load show configuration
2. Test all fixtures and connections
3. Verify scene cues
4. Check MIDI controller mappings

### **During Show**
- **Master Fader** for overall control
- **Scene Buttons** for major transitions
- **Manual Override** for spontaneous adjustments
- **Emergency Blackout** (Spacebar)

### **Common Controls**
- **F11** - Fullscreen toggle
- **Ctrl+H** - Help overlay
- **Spacebar** - Emergency blackout
- **Esc** - Close dialogs

## 🏗️ **Development & Contribution**

### **Build System**
- **Backend**: Node.js + TypeScript
- **Frontend**: React + Vite
- **Styling**: SCSS modules
- **Testing**: Jest + React Testing Library

### **Project Structure**
```
ArtBastard-DMX512/
├── DOCS/                 # Documentation
├── src/                  # Backend source
├── react-app/           # Frontend application
├── package.json         # Dependencies
└── README.md           # This file
```

---

**ArtBastard DMX512 V5.12** - *Photonic Supremacy Edition*  
© 2025 ArtBastard Project - "Éclairer le monde, une photon à la fois"