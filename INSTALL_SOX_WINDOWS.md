# Installing SoX on Windows - Multiple Options

The Chocolatey installation failed due to permission issues. Here are alternative ways to install SoX (Sound eXchange) on Windows:

## Option 1: Direct Download (Recommended)

1. **Download SoX for Windows**:
   - Go to: https://sourceforge.net/projects/sox/files/sox/
   - Download the latest Windows version (usually `sox-14.4.2-win32.exe` or similar)
   - Or use this direct link: https://sourceforge.net/projects/sox/files/sox/14.4.2/sox-14.4.2-win32.exe/download

2. **Install SoX**:
   - Run the downloaded `.exe` file as Administrator
   - Follow the installation wizard
   - Make sure to check "Add to PATH" during installation

3. **Verify Installation**:
   ```powershell
   sox --version
   ```

## Option 2: Using Scoop Package Manager

If you have Scoop installed:
```powershell
scoop install sox
```

If you don't have Scoop, install it first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

## Option 3: Using winget (Windows Package Manager)

```powershell
winget install SoX
```

## Option 4: Portable Version

1. Download the portable version from: https://sourceforge.net/projects/sox/files/sox/14.4.2/sox-14.4.2-win32.zip
2. Extract to a folder like `C:\tools\sox`
3. Add `C:\tools\sox` to your system PATH

## Option 5: Fix Chocolatey Issues

If you want to continue with Chocolatey:

1. **Run PowerShell as Administrator**
2. **Clear Chocolatey locks**:
   ```powershell
   choco list --local-only
   Remove-Item "C:\ProgramData\chocolatey\lib\28da7a317a8f84e00732282ddaa0d0e2d70dd0eb" -Force -ErrorAction SilentlyContinue
   ```
3. **Try installing again**:
   ```powershell
   choco install sox.portable -y
   ```

## Verification

After installation, test SoX with:
```powershell
sox --version
sox --help
```

You should see output showing the SoX version and available options.

## What is SoX?

SoX (Sound eXchange) is the Swiss Army knife of sound processing programs. It's commonly used for:
- Audio format conversion
- Audio effects processing  
- Audio analysis
- Sound generation
- Audio streaming

For the ArtBastard DMX512 project, it's likely used for audio processing features related to sound-reactive lighting or audio analysis.