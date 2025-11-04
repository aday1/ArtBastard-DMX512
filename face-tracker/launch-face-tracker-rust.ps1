param(
    [switch]$Build,
    [switch]$Help,
    [switch]$Release,
    [int]$CameraIndex = -1,
    [string]$ConfigPath = "face-tracker-config.json"
)

if ($Help) {
    Write-Host "ArtBastard Face Tracker - Rust Launcher (Windows)" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\launch-face-tracker-rust.ps1           # Launch face tracker (builds if needed)" -ForegroundColor Green
    Write-Host "  .\launch-face-tracker-rust.ps1 -Build   # Force rebuild" -ForegroundColor Green
    Write-Host "  .\launch-face-tracker-rust.ps1 -Release # Build in release mode" -ForegroundColor Green
    Write-Host "  .\launch-face-tracker-rust.ps1 -CameraIndex 1  # Use camera 1 instead of default" -ForegroundColor Green
    Write-Host ""
    Write-Host "Requirements:" -ForegroundColor Yellow
    Write-Host "  - Rust (install from https://rustup.rs/)" -ForegroundColor White
    Write-Host "  - OpenCV 4.x (installed via vcpkg or system)" -ForegroundColor White
    Write-Host "  - CMake (for building opencv-rust bindings)" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "ArtBastard Face Tracker - Rust Launcher" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir

# Check if Rust is installed
Write-Host "Checking Rust installation..." -ForegroundColor Cyan
$rustFound = $false
$rustPath = $null

# Try to find rustc in PATH
try {
    $rustVersion = & rustc --version 2>&1
    if ($rustVersion -match "rustc") {
        $rustExe = Get-Command rustc -ErrorAction SilentlyContinue
        $rustPath = if ($rustExe) { $rustExe.Source } else { "PATH" }
        Write-Host ('  [OK] Rust found: ' + $rustVersion) -ForegroundColor Green
        $rustFound = $true
    }
} catch {
    # Not in PATH, check common installation locations
    $rustPaths = @(
        "$env:USERPROFILE\.cargo\bin\rustc.exe",
        "$env:LOCALAPPDATA\Programs\Rust\bin\rustc.exe",
        "$env:ProgramFiles\Rust\bin\rustc.exe",
        "$env:ProgramFiles(x86)\Rust\bin\rustc.exe"
    )
    
    foreach ($path in $rustPaths) {
        if (Test-Path $path) {
            try {
                $rustVersion = & $path --version 2>&1
                if ($rustVersion -match "rustc") {
                    Write-Host ('  [OK] Rust found at: ' + $path) -ForegroundColor Green
                    Write-Host ("    Version: " + $rustVersion) -ForegroundColor Gray
                    Write-Host "    Adding to PATH for this session..." -ForegroundColor Yellow
                    $rustDir = Split-Path $path -Parent
                    $env:Path = $rustDir + ";" + $env:Path
                    $rustPath = $path
                    $rustFound = $true
                    break
                }
            } catch {
                continue
            }
        }
    }
    
    # If still not found, try refreshing PATH from environment
    if (-not $rustFound) {
        try {
            # Refresh PATH from registry
            $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
            $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
            $pathParts = @()
            if ($machinePath) { $pathParts += $machinePath }
            if ($userPath) { $pathParts += $userPath }
            if ($pathParts.Count -gt 0) {
                $newPath = $pathParts -join ";"
                $env:Path = $newPath
                
                # Try again with refreshed PATH
                try {
                    $rustVersion = & rustc --version 2>&1
                    if ($rustVersion -match "rustc") {
                        Write-Host ('  [OK] Rust found after PATH refresh: ' + $rustVersion) -ForegroundColor Green
                        $rustFound = $true
                    }
                } catch {
                    # Still not found
                }
            }
        } catch {
            # Could not refresh PATH
        }
    }
}

if (-not $rustFound) {
    Write-Host '  [X] Rust not found!' -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Rust from: https://rustup.rs/" -ForegroundColor Yellow
    Write-Host "Or run: winget install Rustlang.Rust.MSVC" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing Rust, you may need to:" -ForegroundColor Yellow
    Write-Host "  1. Close and reopen this PowerShell window, OR" -ForegroundColor White
    $pathCmd = '$env:Path = [System.Environment]::GetEnvironmentVariable(''Path'',''User'') + '';'' + [System.Environment]::GetEnvironmentVariable(''Path'',''Machine'')'
    Write-Host ("  2. Run: " + $pathCmd) -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check if cargo is installed
$cargoFound = $false
try {
    $cargoVersion = & cargo --version 2>&1
    if ($cargoVersion -match "cargo") {
        Write-Host ('  [OK] Cargo found: ' + $cargoVersion) -ForegroundColor Green
        $cargoFound = $true
    }
} catch {
    # Try to find cargo in same location as rustc
    if ($rustPath) {
        $cargoPath = $rustPath -replace "rustc.exe", "cargo.exe"
        if (Test-Path $cargoPath) {
            try {
                $cargoVersion = & $cargoPath --version 2>&1
                if ($cargoVersion -match "cargo") {
                    Write-Host ('  [OK] Cargo found at: ' + $cargoPath) -ForegroundColor Green
                    Write-Host ("    Version: " + $cargoVersion) -ForegroundColor Gray
                    $cargoDir = Split-Path $cargoPath -Parent
                    $env:Path = $cargoDir + ";" + $env:Path
                    $cargoFound = $true
                }
            } catch {
                # Cargo not found
            }
        }
    }
}

if (-not $cargoFound) {
    Write-Host '  [X] Cargo not found!' -ForegroundColor Red
    Write-Host 'Please ensure Rust is properly installed (cargo should come with rustup).' -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'Try running: rustup update' -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if DMX server is running
Write-Host 'Checking DMX server connection...' -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030/api/status" -TimeoutSec 2 -ErrorAction Stop
    Write-Host '  [OK] DMX server is running' -ForegroundColor Green
} catch {
    Write-Host '  [!] DMX server not responding at http://localhost:3030' -ForegroundColor Yellow
    Write-Host "  Please start the DMX server first:" -ForegroundColor Yellow
    Write-Host "    cd ..; npm start" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Exiting. Please start the DMX server first." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Check for required model files
Write-Host "Checking model files..." -ForegroundColor Cyan

$cascadeFile = "haarcascade_frontalface_alt.xml"
$cascadeExists = Test-Path $cascadeFile

if (-not $cascadeExists) {
    Write-Host ('  [!] Missing: ' + $cascadeFile) -ForegroundColor Yellow
    Write-Host "     Downloading..." -ForegroundColor Cyan
    
    try {
        $cascadeUrl = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_alt.xml"
        Invoke-WebRequest -Uri $cascadeUrl -OutFile $cascadeFile
        Write-Host ('  [OK] Downloaded ' + $cascadeFile) -ForegroundColor Green
        $cascadeExists = $true
    } catch {
        Write-Host ('  [X] Failed to download: ' + $_.ToString()) -ForegroundColor Red
        Write-Host "  Please download manually from:" -ForegroundColor Yellow
        Write-Host "    https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_alt.xml" -ForegroundColor White
    }
} else {
    Write-Host ('  [OK] Found: ' + $cascadeFile) -ForegroundColor Green
}

Write-Host ""

# Check config file
if (-not (Test-Path $ConfigPath)) {
    Write-Host '[!] Config file not found, creating default...' -ForegroundColor Yellow
    $defaultConfig = @{
        dmxApiUrl = "http://localhost:3030/api/dmx/batch"
        panChannel = 1
        tiltChannel = 2
        cameraIndex = 0
        updateRate = 30
        panSensitivity = 1.0
        tiltSensitivity = 1.0
        panOffset = 128
        tiltOffset = 128
        showPreview = $true
        smoothingFactor = 0.8
        brightness = 1.5
        contrast = 1.2
        cameraExposure = -1
        cameraBrightness = -1
        autoExposure = $true
    } | ConvertTo-Json -Depth 10
    
    $defaultConfig | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host ('[OK] Created default config: ' + $ConfigPath) -ForegroundColor Green
}

# Override camera index if specified
if ($CameraIndex -ge 0) {
    Write-Host ("Updating camera index to " + $CameraIndex + "...") -ForegroundColor Cyan
    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    $config.cameraIndex = $CameraIndex
    $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host '[OK] Updated config' -ForegroundColor Green
}

Write-Host ""

# Build or check binary
$buildMode = if ($Release) { "release" } else { "debug" }
$binaryPath = if ($Release) { "target\release\face-tracker.exe" } else { "target\debug\face-tracker.exe" }
$needsBuild = (-not (Test-Path $binaryPath)) -or $Build

if ($needsBuild) {
    Write-Host "Building face tracker (Rust)..." -ForegroundColor Cyan
    
    # Initialize Visual Studio environment (required for CMake to find compilers)
    Write-Host "  Initializing Visual Studio environment..." -ForegroundColor Cyan
    $vsEnvInitialized = $false
    
    # Check if MSVC compiler is already available
    try {
        $clExe = Get-Command cl -ErrorAction SilentlyContinue
        if ($clExe) {
            Write-Host "  [OK] MSVC compiler found in PATH" -ForegroundColor Green
            $vsEnvInitialized = $true
        }
    } catch {
        # cl.exe not in PATH
    }
    
    # Try to find and initialize Visual Studio environment
    if (-not $vsEnvInitialized) {
        $vsDevCmdPaths = @(
            "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat",
            "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat",
            "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat",
            "${env:ProgramFiles}\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat",
            "${env:ProgramFiles}\Microsoft Visual Studio\2019\Professional\VC\Auxiliary\Build\vcvars64.bat",
            "${env:ProgramFiles}\Microsoft Visual Studio\2019\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
        )
        
        $foundVsPath = $null
        foreach ($vsPath in $vsDevCmdPaths) {
            if (Test-Path $vsPath) {
                $foundVsPath = $vsPath
                $vsInstallDir = Split-Path (Split-Path (Split-Path $vsPath -Parent) -Parent) -Parent
                Write-Host "    Found Visual Studio at: $vsInstallDir" -ForegroundColor Gray
                break
            }
        }
        
        if ($foundVsPath) {
            # Try to initialize VS environment using cmd
            Write-Host "    Initializing VS environment..." -ForegroundColor Gray
            try {
                # Use cmd to run vcvars64.bat and capture environment variables
                $vsEnvScript = @"
@echo off
call "$foundVsPath" >nul 2>&1
set
"@
                $vsEnvScript | Out-File -FilePath "$env:TEMP\init_vs_env.bat" -Encoding ASCII
                
                # Run the script and capture environment
                $envOutput = cmd /c "$env:TEMP\init_vs_env.bat" 2>$null
                
                # Parse environment variables (look for PATH, INCLUDE, LIB, etc.)
                foreach ($line in $envOutput) {
                    if ($line -match '^([^=]+)=(.*)$') {
                        $varName = $matches[1]
                        $varValue = $matches[2]
                        
                        # Update PATH and other important variables
                        if ($varName -eq "PATH") {
                            $env:Path = $varValue
                        } elseif ($varName -match "^(INCLUDE|LIB|LIBPATH)$") {
                            [Environment]::SetEnvironmentVariable($varName, $varValue, "Process")
                        }
                    }
                }
                
                # Verify cl.exe is now available
                try {
                    $clExe = Get-Command cl -ErrorAction SilentlyContinue
                    if ($clExe) {
                        Write-Host "  [OK] MSVC compiler initialized successfully" -ForegroundColor Green
                        $vsEnvInitialized = $true
                    }
                } catch {
                    # Still not found
                }
                
                Remove-Item "$env:TEMP\init_vs_env.bat" -ErrorAction SilentlyContinue
            } catch {
                # Failed to initialize
                Write-Host "  [!] Could not initialize VS environment automatically" -ForegroundColor Yellow
            }
        }
        
        if (-not $vsEnvInitialized) {
            Write-Host "  [!] Visual Studio Build Tools not found in PATH" -ForegroundColor Yellow
            Write-Host "      CMake may not be able to find C++ compilers" -ForegroundColor Yellow
            Write-Host "      Consider running from Developer Command Prompt or install:" -ForegroundColor Yellow
            Write-Host "        https://visualstudio.microsoft.com/downloads/" -ForegroundColor Cyan
            Write-Host "      Select 'Desktop development with C++' workload" -ForegroundColor Yellow
        }
    }
    
    # Set vcpkg environment variables
    $vcpkgRoot = $null
    if (Test-Path "C:\vcpkg\vcpkg.exe") {
        $vcpkgRoot = "C:\vcpkg"
    } elseif ($env:VCPKG_ROOT) {
        $vcpkgRoot = $env:VCPKG_ROOT
    } elseif (Test-Path "$env:ProgramFiles\vcpkg\vcpkg.exe") {
        $vcpkgRoot = "$env:ProgramFiles\vcpkg"
    }
    
    if ($vcpkgRoot) {
        $env:VCPKG_ROOT = $vcpkgRoot
        Write-Host "  Setting VCPKG_ROOT to: $vcpkgRoot" -ForegroundColor Gray
        
        # Set triplet explicitly (opencv-rust defaults to x64-windows-static-md)
        $env:VCPKG_TARGET_TRIPLET = "x64-windows"
        Write-Host "  Setting VCPKG_TARGET_TRIPLET to: x64-windows" -ForegroundColor Gray
        
        $opencvDir = "$vcpkgRoot\installed\x64-windows"
        if (Test-Path $opencvDir) {
            $env:OPENCV_DIR = $opencvDir
            $env:OPENCV_LINK_DIR = "$opencvDir\lib"
            $env:OPENCV_INCLUDE_PATHS = "$opencvDir\include\opencv4"
            
            # Set OPENCV_LINK_LIBS - use space-separated list, not semicolon
            $libPath = "$opencvDir\lib"
            $libs = Get-ChildItem -Path $libPath -Filter "opencv*.lib" | Select-Object -ExpandProperty Name | ForEach-Object { $_ -replace '\.lib$','' } | Where-Object { $_ -match "^(opencv_core4|opencv_imgproc4|opencv_imgcodecs4|opencv_highgui4|opencv_objdetect4|opencv_videoio4)$" }
            $env:OPENCV_LINK_LIBS = $libs -join ' '
            $env:OPENCV_DISABLE_PROBES = "cmake,vcpkg_cmake,vcpkg"
            $env:OPENCV_NO_PKG_CONFIG = "1"
            
            Write-Host "  Setting OPENCV_DIR to: $opencvDir" -ForegroundColor Gray
            Write-Host "  Setting OPENCV_INCLUDE_PATHS to: $env:OPENCV_INCLUDE_PATHS" -ForegroundColor Gray
            Write-Host "  Setting OPENCV_LINK_LIBS to: $env:OPENCV_LINK_LIBS" -ForegroundColor Gray
        }
    }
    
    
    # Find and set LIBCLANG_PATH (required for opencv-rust bindings)
    if (-not $env:LIBCLANG_PATH) {
        Write-Host "  Checking for LLVM/libclang..." -ForegroundColor Cyan
        
        $clangPaths = @(
            "$env:ProgramFiles\LLVM\bin\libclang.dll",
            "$env:ProgramFiles(x86)\LLVM\bin\libclang.dll"
        )
        
        # Also check Visual Studio bundled LLVM (more thorough search)
        $vsBasePaths = @(
            "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community",
            "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional",
            "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise",
            "${env:ProgramFiles}\Microsoft Visual Studio\2019\Community",
            "${env:ProgramFiles}\Microsoft Visual Studio\2019\Professional",
            "${env:ProgramFiles}\Microsoft Visual Studio\2019\Enterprise"
        )
        
        $libclangFound = $false
        
        # Check standard LLVM locations
        foreach ($path in $clangPaths) {
            if (Test-Path $path) {
                $env:LIBCLANG_PATH = Split-Path $path -Parent
                Write-Host "  [OK] Found libclang.dll at: $env:LIBCLANG_PATH" -ForegroundColor Green
                $libclangFound = $true
                break
            }
        }
        
        # Check Visual Studio bundled LLVM
        if (-not $libclangFound) {
            foreach ($vsBase in $vsBasePaths) {
                if (Test-Path $vsBase) {
                    # Search for libclang.dll in various subdirectories
                    $searchPaths = @(
                        "$vsBase\VC\Tools\Llvm",
                        "$vsBase\VC\Tools\Llvm\x64\bin",
                        "$vsBase\VC\Tools\MSVC\*\bin\Hostx64\x64",
                        "$vsBase\Common7\IDE\Extensions\Microsoft\*\VC\Tools\Llvm"
                    )
                    
                    foreach ($searchPath in $searchPaths) {
                        if ($searchPath -match '\*') {
                            # Handle wildcard paths
                            $parentDir = Split-Path $searchPath -Parent
                            if (Test-Path $parentDir) {
                                $libclang = Get-ChildItem -Path $parentDir -Filter "libclang.dll" -Recurse -ErrorAction SilentlyContinue -Depth 3 | Select-Object -First 1
                                if ($libclang) {
                                    $env:LIBCLANG_PATH = Split-Path $libclang.FullName -Parent
                                    Write-Host "  [OK] Found libclang.dll at: $env:LIBCLANG_PATH" -ForegroundColor Green
                                    $libclangFound = $true
                                    break
                                }
                            }
                        } else {
                            if (Test-Path $searchPath) {
                                $libclang = Get-ChildItem -Path $searchPath -Filter "libclang.dll" -ErrorAction SilentlyContinue | Select-Object -First 1
                                if ($libclang) {
                                    $env:LIBCLANG_PATH = Split-Path $libclang.FullName -Parent
                                    Write-Host "  [OK] Found libclang.dll at: $env:LIBCLANG_PATH" -ForegroundColor Green
                                    $libclangFound = $true
                                    break
                                }
                            }
                        }
                        if ($libclangFound) { break }
                    }
                    if ($libclangFound) { break }
                }
            }
        }
        
        # Also check PATH for clang.exe (might have libclang nearby)
        if (-not $libclangFound) {
            try {
                $clangExe = Get-Command clang -ErrorAction SilentlyContinue
                if ($clangExe) {
                    $clangDir = Split-Path $clangExe.Source -Parent
                    $libclangPath = Join-Path $clangDir "libclang.dll"
                    if (Test-Path $libclangPath) {
                        $env:LIBCLANG_PATH = $clangDir
                        Write-Host "  [OK] Found libclang.dll via clang.exe at: $env:LIBCLANG_PATH" -ForegroundColor Green
                        $libclangFound = $true
                    }
                }
            } catch {
                # clang not in PATH
            }
        }
        
        if (-not $libclangFound) {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "  [!] libclang.dll not found!" -ForegroundColor Yellow
            Write-Host "     This is required for building opencv-rust bindings." -ForegroundColor Yellow
            Write-Host ""
            # Try to install via Chocolatey if available
            $chocoAvailable = $false
            try {
                $chocoVersion = & choco --version 2>&1
                if ($chocoVersion -and -not ($chocoVersion -match "not found|error")) {
                    $chocoAvailable = $true
                }
            } catch {
                # Chocolatey not available
            }
            
            if ($chocoAvailable) {
                Write-Host "  Chocolatey detected! Would you like to install LLVM automatically?" -ForegroundColor Cyan
                Write-Host "  This will install LLVM which includes libclang.dll" -ForegroundColor Yellow
                Write-Host ""
                $installLLVM = Read-Host "Install LLVM via Chocolatey now? (y/n)"
                
                if ($installLLVM -eq "y") {
                    Write-Host ""
                    Write-Host "  Installing LLVM via Chocolatey..." -ForegroundColor Cyan
                    Write-Host "  This may take a few minutes..." -ForegroundColor Yellow
                    Write-Host ""
                    
                    try {
                        & choco install llvm -y
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host ""
                            Write-Host "  [OK] LLVM installed successfully!" -ForegroundColor Green
                            Write-Host "  Refreshing PATH..." -ForegroundColor Cyan
                            
                            # Refresh PATH
                            $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
                            $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
                            $pathParts = @()
                            if ($machinePath) { $pathParts += $machinePath }
                            if ($userPath) { $pathParts += $userPath }
                            if ($pathParts.Count -gt 0) {
                                $newPath = $pathParts -join ";"
                                $env:Path = $newPath
                            }
                            
                            # Check if libclang is now available
                            Start-Sleep -Seconds 2
                            if (Test-Path "$env:ProgramFiles\LLVM\bin\libclang.dll") {
                                $env:LIBCLANG_PATH = "$env:ProgramFiles\LLVM\bin"
                                Write-Host "  [OK] libclang.dll found at: $env:LIBCLANG_PATH" -ForegroundColor Green
                                $libclangFound = $true
                            } else {
                                Write-Host "  [!] LLVM installed but libclang.dll not found yet" -ForegroundColor Yellow
                                Write-Host "  Please restart PowerShell and run this script again" -ForegroundColor Yellow
                            }
                        } else {
                            Write-Host ""
                            Write-Host "  [X] Chocolatey installation failed!" -ForegroundColor Red
                        }
                    } catch {
                        Write-Host ""
                        Write-Host "  [X] Installation error: $_" -ForegroundColor Red
                    }
                }
            }
            
            if (-not $libclangFound) {
                Write-Host ""
                Write-Host "  Manual installation options:" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "  Option 1: Download LLVM installer" -ForegroundColor Yellow
                Write-Host "    Download from: https://github.com/llvm/llvm-project/releases" -ForegroundColor White
                Write-Host "    Look for latest 'LLVM-XX.X.X-win64.exe'" -ForegroundColor White
                Write-Host "    Install to: C:\Program Files\LLVM" -ForegroundColor White
                Write-Host ""
                Write-Host "  Option 2: Install Visual Studio C++ Clang tools" -ForegroundColor Yellow
                Write-Host "    1. Open Visual Studio Installer" -ForegroundColor White
                Write-Host "    2. Modify your installation" -ForegroundColor White
                Write-Host "    3. Install 'C++ Clang tools for Windows'" -ForegroundColor White
                Write-Host ""
                Write-Host "  After installing, run this script again." -ForegroundColor Yellow
                Write-Host ""
                $continue = Read-Host "Continue build attempt anyway? (will likely fail) (y/n)"
                if ($continue -ne "y") {
                    Write-Host "Build cancelled. Please install LLVM first." -ForegroundColor Red
                    Pop-Location
                    exit 1
                }
                Write-Host ""
                Write-Host "  [!] Continuing without libclang - build will likely fail!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  [OK] Using existing LIBCLANG_PATH: $env:LIBCLANG_PATH" -ForegroundColor Green
    }
    
    if ($Release) {
        Write-Host "  Building in RELEASE mode (optimized)..." -ForegroundColor Yellow
        & cargo build --release
    } else {
        Write-Host "  Building in DEBUG mode..." -ForegroundColor Yellow
        & cargo build
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host '[X] Build failed!' -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  1. CMake can't find C++ compilers (MSVC)" -ForegroundColor White
        Write-Host "     Solution: Run from Developer Command Prompt for VS" -ForegroundColor Cyan
        Write-Host "     Or ensure Visual Studio Build Tools are installed:" -ForegroundColor Cyan
        Write-Host "       https://visualstudio.microsoft.com/downloads/" -ForegroundColor Cyan
        Write-Host "       Select 'Desktop development with C++' workload" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  2. OpenCV triplet mismatch" -ForegroundColor White
        Write-Host "     Solution: Ensure OpenCV is installed for x64-windows:" -ForegroundColor Cyan
        Write-Host "       vcpkg install opencv4:x64-windows" -ForegroundColor Cyan
        Write-Host "     The script sets VCPKG_TARGET_TRIPLET=x64-windows automatically" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  3. OpenCV not found by opencv-rust" -ForegroundColor White
        Write-Host "     The script sets OPENCV_DIR, but if it still fails:" -ForegroundColor Cyan
        Write-Host "     - Check that C:\vcpkg\installed\x64-windows exists" -ForegroundColor Cyan
        Write-Host "     - Try: vcpkg install opencv4:x64-windows" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  4. CMake not found - install from https://cmake.org/download/" -ForegroundColor White
        Write-Host ""
        Write-Host "Debug info:" -ForegroundColor Yellow
        Write-Host "  VCPKG_ROOT: $env:VCPKG_ROOT" -ForegroundColor Gray
        Write-Host "  VCPKG_TARGET_TRIPLET: $env:VCPKG_TARGET_TRIPLET" -ForegroundColor Gray
        Write-Host "  OPENCV_DIR: $env:OPENCV_DIR" -ForegroundColor Gray
        Write-Host "  LIBCLANG_PATH: $env:LIBCLANG_PATH" -ForegroundColor Gray
        Write-Host ""
        Pop-Location
        exit 1
    }
    
    Write-Host ""
    Write-Host '[OK] Build successful!' -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ('[OK] Binary already exists: ' + $binaryPath) -ForegroundColor Green
    Write-Host ""
}

# Verify binary exists
if (-not (Test-Path $binaryPath)) {
    Write-Host ('[X] Binary not found at: ' + $binaryPath) -ForegroundColor Red
    Write-Host "Please build first with: .\launch-face-tracker-rust.ps1 -Build" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Copy model files to target directory if needed
if ($cascadeExists) {
    $targetDir = if ($Release) { "target\release" } else { "target\debug" }
    if (-not (Test-Path "$targetDir\$cascadeFile")) {
        Write-Host "Copying model files to target directory..." -ForegroundColor Cyan
        Copy-Item $cascadeFile -Destination $targetDir -ErrorAction SilentlyContinue
        Write-Host '[OK] Model files copied' -ForegroundColor Green
    }
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting Face Tracker (Rust)..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Controls:" -ForegroundColor Yellow
Write-Host "  - Press 'q' or ESC to quit" -ForegroundColor White
Write-Host "  - Adjust camera settings in the preview window" -ForegroundColor White
Write-Host "  - Edit face-tracker-config.json to change DMX channels" -ForegroundColor White
Write-Host ""
Write-Host "Make sure your DMX server is running at http://localhost:3030" -ForegroundColor Cyan
Write-Host ""

# Run the face tracker
try {
    Push-Location (Split-Path $binaryPath -Parent)
    & ".\face-tracker.exe"
} catch {
    Write-Host ('[X] Failed to run face tracker: ' + $_.ToString()) -ForegroundColor Red
} finally {
    Pop-Location
    Pop-Location
}

Write-Host ""
Write-Host "Face tracker exited." -ForegroundColor Cyan
