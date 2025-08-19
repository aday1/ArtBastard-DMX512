# Cross-Platform Build Setup

This React app now supports building on Windows, macOS, and Linux with automatic platform detection and fallback mechanisms.

## Quick Start

### Windows - Automated Setup
```cmd
# Easy one-click setup (recommended)
.\WINDOWS-TROUBLESHOOT.bat

# Or use the main launcher
".\Launch ArtBastard DMX512 ✨.bat"

# Or run the build script directly
.\build-windows.bat
```

### Windows - Manual Setup
```cmd
# Clean install and setup
.\CLEANUP.ps1
cd react-app
npm install
node setup-build.js
npm run build
```

### macOS/Linux
```bash
npm install
npm run build
```

## Build Options

### Standard Build
```bash
npm run build
```
- Automatically detects platform and uses native Rollup binary if available
- Falls back to JavaScript implementation if native binary fails

### Force JavaScript Fallback
```bash
npm run build:js-fallback
```
- Forces the use of JavaScript-only Rollup (slower but more compatible)
- Use this if you encounter platform-specific build issues

### Skip TypeScript Checking
```bash
npm run build:skip-ts
```
- Skips TypeScript checking for faster builds
- Useful for development builds

## Platform Support

### Supported Platforms
- ✅ **Windows** (x64, ARM64, ia32)
- ✅ **macOS** (Intel x64, Apple Silicon ARM64)  
- ✅ **Linux** (x64, ARM64, ARM)

### Native Binary Installation
The build system automatically installs platform-specific Rollup binaries as optional dependencies:
- `@rollup/rollup-win32-x64-msvc` (Windows x64)
- `@rollup/rollup-darwin-x64` (macOS Intel)
- `@rollup/rollup-darwin-arm64` (macOS Apple Silicon)
- `@rollup/rollup-linux-x64-gnu` (Linux x64)

## Troubleshooting

### Windows Issues
If you encounter problems on Windows:

1. **Run the troubleshooting tool** (recommended):
   ```cmd
   .\WINDOWS-TROUBLESHOOT.bat
   ```

2. **Platform-specific build errors**:
   ```cmd
   cd react-app
   npm run build:js-fallback
   ```

3. **Permission issues**:
   - Run PowerShell as Administrator
   - Check Windows Defender exclusions
   - Try: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

4. **Dependency issues**:
   ```cmd
   .\CLEANUP.ps1
   npm cache clean --force
   npm install --no-optional
   ```

### Build Fails with Platform Error
If you see `npm error code EBADPLATFORM`:
1. Try the JavaScript fallback: `npm run build:js-fallback`
2. Or manually set the environment variable: `FORCE_ROLLUP_JS_FALLBACK=true npm run build`

### Missing Native Binary
If native binaries fail to install:
1. The setup script automatically creates `.env.local` with fallback settings
2. Builds will use slower JavaScript implementation but still work

### Performance Notes
- **Native binaries**: Fastest build times (~20s)
- **JavaScript fallback**: Slower but more compatible (~60s)
- **Development mode**: Fastest for testing (`npm run build:ultra-fast`)

## Environment Variables

- `FORCE_ROLLUP_JS_FALLBACK=true` - Forces JavaScript-only Rollup
- `SKIP_TYPECHECKING=true` - Skips TypeScript checking
- `NODE_ENV=development` - Development build mode

## Files

- `setup-build.js` - Automatic platform detection and binary installation
- `build-windows.bat` - Windows-specific build script with error handling
- `.npmrc` - npm configuration for cross-platform compatibility
- `vite.config.ts` - Vite configuration with platform detection
