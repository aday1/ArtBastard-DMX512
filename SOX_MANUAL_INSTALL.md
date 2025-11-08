# Manual SoX Installation Instructions

The automated installation encountered issues. Please follow these manual steps to install SoX:

## Quick Manual Installation

1. **Download SoX**:
   - Open your web browser
   - Go to: https://sourceforge.net/projects/sox/files/sox/14.4.2/
   - Download `sox-14.4.2-win32.exe` (the installer version)

2. **Install SoX**:
   - Run the downloaded `.exe` file as Administrator
   - Follow the installation wizard
   - **Important**: During installation, make sure to check the option "Add to PATH" or "Add to system PATH"

3. **Verify Installation**:
   Open a new PowerShell window and run:
   ```powershell
   sox --version
   ```

## Alternative: Portable Installation

If you prefer a portable installation:

1. **Download Portable Version**:
   - Go to: https://sourceforge.net/projects/sox/files/sox/14.4.2/
   - Download `sox-14.4.2-win32.zip`

2. **Extract and Setup**:
   - Extract the zip to `C:\tools\sox\`
   - The main executable will be in `C:\tools\sox\sox-14.4.2\`

3. **Add to PATH**:
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and select "Path", then click "Edit"
   - Click "New" and add: `C:\tools\sox\sox-14.4.2`
   - Click "OK" to close all dialogs

4. **Test Installation**:
   Open a new PowerShell window and run:
   ```powershell
   sox --version
   ```

## Why is SoX needed?

SoX is likely used in your ArtBastard DMX512 project for:
- Audio analysis for sound-reactive lighting
- Audio format conversion
- Real-time audio processing
- Sound visualization features

## Troubleshooting

If `sox --version` doesn't work after installation:
1. Make sure you opened a NEW PowerShell window
2. Verify the PATH was added correctly
3. Try restarting your computer
4. Check that sox.exe exists in the installation directory

## Alternative Audio Libraries

If you can't get SoX working, the project might also work with:
- FFmpeg (for audio processing)
- PortAudio (for real-time audio)
- FMOD (commercial audio library)

Let me know once you have SoX installed and we can continue with your project setup!