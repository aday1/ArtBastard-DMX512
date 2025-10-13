# 🔧 **Installation Guide** - ArtBastard V5.12

> *"Installation, mes amis, should be as smooth as a perfectly focused spotlight."*

## 📋 **System Requirements**
- **Node.js** 18+ (the foundation of excellence)
- **Modern Browser** (Chrome/Firefox/Safari/Edge)
- **DMX Interface** (USB DMX or Art-Net device)
- **2GB RAM minimum** (4GB recommended for large shows)

## ⚡ **Quick Install**

### 1. **Clone & Launch**
```bash
git clone https://github.com/aday1/ArtBastard-DMX512.git
cd ArtBastard-DMX512
.\start.ps1
```
Navigate to: `http://localhost:3030`

### 2. **DMX Hardware Setup**
- **USB DMX**: Connect interface, install drivers if needed
- **Art-Net**: Configure network settings (usually auto-detects)
- **Verify**: Check status bar for connection indicator

## 🚨 **Troubleshooting**

### Build Issues
```bash
# Clean rebuild
.\start.ps1 -Clear
```

### DMX Connection Problems
- Check USB cable/drivers
- Verify Art-Net network settings
- Restart application after hardware changes

### Performance Optimization
- Close unused browser tabs
- Disable browser extensions during performance
- Use Chrome for best WebGL support

## 📱 **Touch Screen Setup**
For professional touch consoles:
1. Set display scaling to 100%
2. Calibrate touch sensitivity
3. Enable fullscreen mode (F11)

---
**Next:** [Fixture Setup](./FIXTURES.md) | [Usage Guide](./USAGE.md)