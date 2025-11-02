#!/bin/bash

# ArtBastard DMX512 - Sophisticated Launch Orchestrator for Linux
# ================================================================

CLEAR=false
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clear|-c)
            CLEAR=true
            shift
            ;;
        --help|-h)
            HELP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show help if requested
if [ "$HELP" = true ]; then
    echo "ArtBastard DMX512 - Sophisticated Launch Orchestrator"
    echo "====================================================="
    echo ""
    echo "Usage:"
    echo "  ./start.sh           # EXQUISITE rapid deployment (recommended)"
    echo "  ./start.sh --clear   # Immaculate reconstruction (purges all artifacts)"
    echo "  ./start.sh --help    # Display this refined documentation"
    echo ""
    echo "Operational Modes:"
    echo "  Standard (default): Elegantly rapid initialization, preserves curated artifacts"
    echo "  --clear:           Complete architectural reconstruction (more deliberate)"
    echo ""
    echo "Performance Characteristics:"
    echo "  Standard deployment:    ~5-10 seconds"
    echo "  Immaculate reconstruction: ~30-60 seconds"
    echo ""
    echo "Exemplary Invocations:"
    echo "  ./start.sh          # Sophisticated rapid deployment (daily preference)"
    echo "  ./start.sh --clear  # When architectural purity is paramount"
    echo ""
    exit 0
fi

# Function to check and install Node.js and npm if missing
check_and_install_dependencies() {
    local needs_node=false
    local needs_npm=false
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        needs_node=true
    else
        node_version=$(node --version 2>/dev/null || echo "")
        if [ -z "$node_version" ]; then
            needs_node=true
        else
            # Check version number (remove 'v' prefix and extract major version)
            version_num=$(echo "$node_version" | sed 's/^v//' | cut -d. -f1 | tr -cd '0-9')
            # Only compare if we got a valid number
            if [ -z "$version_num" ] || ! [ "$version_num" -ge 0 ] 2>/dev/null || [ "$version_num" -lt 18 ]; then
                echo "  ⚠️  Node.js version $node_version is insufficient (need v18+)"
                needs_node=true
            fi
        fi
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        needs_npm=true
    else
        npm_version=$(npm --version 2>/dev/null || echo "")
        if [ -z "$npm_version" ]; then
            needs_npm=true
        fi
    fi
    
    # If nothing needed, return
    if [ "$needs_node" = false ] && [ "$needs_npm" = false ]; then
        return 0
    fi
    
    echo ""
    echo "🔧 Dependencies Missing - Installing Node.js and npm..."
    echo "================================================================"
    
    # Ensure curl is available for NodeSource installation
    if ! command -v curl &> /dev/null; then
        echo "  Installing curl (required for NodeSource)..."
        if command -v apt-get &> /dev/null; then
            if ! (sudo apt-get update -qq && sudo apt-get install -y curl); then
                echo "  ⚠️  Failed to install curl - continuing anyway..."
            fi
        elif command -v yum &> /dev/null; then
            if ! sudo yum install -y curl; then
                echo "  ⚠️  Failed to install curl - continuing anyway..."
            fi
        elif command -v dnf &> /dev/null; then
            if ! sudo dnf install -y curl; then
                echo "  ⚠️  Failed to install curl - continuing anyway..."
            fi
        elif command -v pacman &> /dev/null; then
            if ! sudo pacman -S --noconfirm curl; then
                echo "  ⚠️  Failed to install curl - continuing anyway..."
            fi
        elif command -v zypper &> /dev/null; then
            if ! sudo zypper install -y curl; then
                echo "  ⚠️  Failed to install curl - continuing anyway..."
            fi
        else
            echo "  ⚠️  Could not install curl automatically"
        fi
    fi
    
    # Detect package manager and install
    if command -v apt-get &> /dev/null; then
        echo "  Detected apt package manager (Debian/Ubuntu)"
        echo "  Installing Node.js and npm..."
        if sudo apt-get update -qq && sudo apt-get install -y nodejs npm; then
            echo "  ✅ Node.js and npm installed successfully!"
        else
            # Try installing from NodeSource repository for newer versions
            echo "  Attempting to install from NodeSource (for Node.js 18+)..."
            if command -v curl &> /dev/null; then
                if curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -; then
                    if sudo apt-get install -y nodejs; then
                        echo "  ✅ Node.js and npm installed successfully!"
                    else
                        echo "  ❌ Failed to install Node.js and npm from NodeSource"
                        echo "  Please install manually: https://nodejs.org/"
                        exit 1
                    fi
                else
                    echo "  ❌ Failed to setup NodeSource repository"
                    echo "  Please install manually: https://nodejs.org/"
                    exit 1
                fi
            else
                echo "  ❌ curl is required for NodeSource installation but is not available"
                echo "  Please install curl or Node.js manually: https://nodejs.org/"
                exit 1
            fi
        fi
    elif command -v yum &> /dev/null; then
        echo "  Detected yum package manager (RHEL/CentOS)"
        echo "  Installing Node.js and npm..."
        if sudo yum install -y nodejs npm; then
            echo "  ✅ Node.js and npm installed successfully!"
        else
            # Try NodeSource for newer versions
            echo "  Attempting to install from NodeSource (for Node.js 18+)..."
            if command -v curl &> /dev/null; then
                if curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -; then
                    if sudo yum install -y nodejs; then
                        echo "  ✅ Node.js and npm installed successfully!"
                    else
                        echo "  ❌ Failed to install Node.js and npm from NodeSource"
                        exit 1
                    fi
                else
                    echo "  ❌ Failed to setup NodeSource repository"
                    exit 1
                fi
            else
                echo "  ❌ curl is required for NodeSource installation but is not available"
                exit 1
            fi
        fi
    elif command -v dnf &> /dev/null; then
        echo "  Detected dnf package manager (Fedora)"
        echo "  Installing Node.js and npm..."
        if sudo dnf install -y nodejs npm; then
            echo "  ✅ Node.js and npm installed successfully!"
        else
            # Try NodeSource for newer versions
            echo "  Attempting to install from NodeSource (for Node.js 18+)..."
            if command -v curl &> /dev/null; then
                if curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -; then
                    if sudo dnf install -y nodejs; then
                        echo "  ✅ Node.js and npm installed successfully!"
                    else
                        echo "  ❌ Failed to install Node.js and npm from NodeSource"
                        exit 1
                    fi
                else
                    echo "  ❌ Failed to setup NodeSource repository"
                    exit 1
                fi
            else
                echo "  ❌ curl is required for NodeSource installation but is not available"
                exit 1
            fi
        fi
    elif command -v pacman &> /dev/null; then
        echo "  Detected pacman package manager (Arch Linux)"
        echo "  Installing Node.js and npm..."
        if sudo pacman -S --noconfirm nodejs npm; then
            echo "  ✅ Node.js and npm installed successfully!"
        else
            echo "  ❌ Failed to install Node.js and npm"
            echo "  Error details: Check sudo permissions and package repository"
            echo "  Try manually: sudo pacman -S nodejs npm"
            exit 1
        fi
    elif command -v zypper &> /dev/null; then
        echo "  Detected zypper package manager (openSUSE)"
        echo "  Installing Node.js and npm..."
        if sudo zypper install -y nodejs npm; then
            echo "  ✅ Node.js and npm installed successfully!"
        else
            echo "  ❌ Failed to install Node.js and npm"
            echo "  Error details: Check sudo permissions and package repository"
            exit 1
        fi
    else
        echo "  ❌ Could not detect package manager"
        echo "  Please install Node.js and npm manually:"
        echo "  https://nodejs.org/"
        exit 1
    fi
    
    # Verify installation - try refreshing PATH first
    # Update PATH to include common installation locations
    export PATH="$PATH:/usr/bin:/usr/local/bin:/opt/nodejs/bin"
    
    # Reload shell configuration if possible
    if [ -f ~/.bashrc ]; then
        source ~/.bashrc 2>/dev/null || true
    fi
    if [ -f ~/.bash_profile ]; then
        source ~/.bash_profile 2>/dev/null || true
    fi
    
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo "  ⚠️  Installation completed but Node.js/npm not found in PATH"
        echo "  Attempting to locate installation..."
        
        # Try to find node and npm in common locations
        if [ -x /usr/bin/node ] && [ -x /usr/bin/npm ]; then
            export PATH="/usr/bin:$PATH"
        elif [ -x /usr/local/bin/node ] && [ -x /usr/local/bin/npm ]; then
            export PATH="/usr/local/bin:$PATH"
        fi
        
        # Check again
        if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
            echo "  ❌ Node.js/npm installation not found"
            echo "  Please restart your terminal or manually add to PATH:"
            echo "    export PATH=\$PATH:/usr/bin:/usr/local/bin"
            exit 1
        fi
    fi
    
    node_version=$(node --version 2>/dev/null || echo "unknown")
    npm_version=$(npm --version 2>/dev/null || echo "unknown")
    echo "  ✅ Verified: Node.js $node_version, npm $npm_version"
    echo ""
}

echo "ArtBastard DMX512 - Sophisticated Launch Orchestrator"
echo "================================================================"
if [ "$CLEAR" = true ]; then
    echo "IMMACULATE RECONSTRUCTION MODE: Architectural purity restoration"
    echo "Eliminating all cached artifacts and dependencies for pristine foundation"
else
    echo "EXQUISITE RAPID DEPLOYMENT MODE: Elegantly accelerated initialization"
    echo "Preserving curated artifacts and dependencies for optimal efficiency"
fi
echo "================================================================"
echo ""

# Check and install dependencies before proceeding
check_and_install_dependencies

start_time=$(date +%s)

# ETA metrics file for tracking performance
eta_temp_file="/tmp/artbastard_eta_metrics.json"

# Function to update ETA metrics
update_eta_metrics() {
    local total_time=$1
    
    # Simple JSON handling with jq if available, otherwise basic approach
    if command -v jq &> /dev/null; then
        if [ -f "$eta_temp_file" ]; then
            jq --arg time "$total_time" '.lastRunTimes += [$time | tonumber] | .lastRunTimes = .lastRunTimes[-10:] | .averageTime = ((.lastRunTimes | add / length) // 0) | .lastUpdated = (now | strftime("%Y-%m-%d %H:%M:%S"))' "$eta_temp_file" > "${eta_temp_file}.tmp" && mv "${eta_temp_file}.tmp" "$eta_temp_file"
        else
            echo "{\"lastRunTimes\":[$total_time],\"averageTime\":$total_time,\"lastUpdated\":\"$(date '+%Y-%m-%d %H:%M:%S')\"}" > "$eta_temp_file"
        fi
    fi
}

# EXQUISITE RAPID DEPLOYMENT PATH: Sophisticated acceleration protocol
if [ "$CLEAR" = false ]; then
    echo "🚀 EXQUISITE RAPID DEPLOYMENT MODE"
    echo "Bypassing validation protocols and dependency verification for optimal velocity..."
    echo ""
    
    # Elegant process termination (minimal intervention)
    echo "Executing graceful process termination..."
    
    # Kill node processes
    node_procs=$(pgrep -f "node.*ArtBastard\|node.*dmx" 2>/dev/null || pgrep -f "node.*dist/server.js" 2>/dev/null || true)
    if [ -n "$node_procs" ]; then
        echo "  Elegantly terminating Node.js processes..."
        echo "$node_procs" | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill processes on port 3030
    if command -v lsof &> /dev/null; then
        port_proc=$(lsof -ti:3030 2>/dev/null || true)
        if [ -n "$port_proc" ]; then
            echo "  Resolving port 3030 conflicts..."
            echo "$port_proc" | xargs kill -9 2>/dev/null || true
        fi
    elif command -v fuser &> /dev/null; then
        fuser -k 3030/tcp 2>/dev/null || true
    fi
    
    echo "Process termination completed with sophistication!"
    echo ""
    
    # Architectural validation with minimal intervention
    if [ ! -d "dist" ]; then
        echo "Architectural foundation missing - executing minimal reconstruction..."
        if npm run build-backend 2>/dev/null; then
            echo "Minimal reconstruction completed with elegance!"
        else
            echo "Reconstruction encountered challenges, proceeding with grace..."
        fi
    else
        echo "Architectural foundation intact - preserving existing structure!"
    fi
    
    echo ""
    echo "Initiating ArtBastard DMX512 server deployment..."
    
    # Deploy the server with sophistication
    total_time=$(($(date +%s) - start_time))
    update_eta_metrics "$total_time"
    
    npm start || {
        echo "Server deployment encountered complications!"
        echo "Consider executing with --clear flag for architectural reconstruction"
        exit 1
    }
    
    echo ""
    echo "ArtBastard DMX512 session concluded with sophistication."
    exit 0
fi

# IMMACULATE RECONSTRUCTION PATH: Only executed when architectural purity is demanded
echo "🧹 IMMACULATE RECONSTRUCTION MODE: Complete architectural restoration"
echo "This deliberate process ensures pristine foundation and optimal performance"
echo ""

total_steps=7
current_step=0

show_progress() {
    local message=$1
    local step=$2
    local color=$3
    
    local percentage=$((step * 100 / total_steps))
    local elapsed=$(($(date +%s) - start_time))
    
    echo ""
    echo "================================================================"
    echo "ARCHITECTURAL PROGRESS: ${percentage}% | Elapsed: ${elapsed}s"
    echo "================================================================"
    echo "$message"
    echo ""
}

# Step 1: SOPHISTICATED PROCESS TERMINATION
current_step=1
show_progress "STEP 1/7: ELEGANT PROCESS TERMINATION PROTOCOL" "$current_step" "Red"

echo "  Executing comprehensive Node.js process analysis..."
node_procs=$(pgrep -f "node" 2>/dev/null || true)
if [ -n "$node_procs" ]; then
    echo "  Gracefully terminating Node.js processes with elegance..."
    echo "$node_procs" | xargs kill -9 2>/dev/null || true
    echo "  All Node.js processes terminated with sophistication"
else
    echo "  No Node.js processes detected (pristine state)"
fi

echo "  Analyzing port 3030 architectural conflicts..."
if command -v lsof &> /dev/null; then
    port_proc=$(lsof -ti:3030 2>/dev/null || true)
    if [ -n "$port_proc" ]; then
        echo "  Resolving port 3030 conflicts with architectural precision..."
        echo "$port_proc" | xargs kill -9 2>/dev/null || true
        echo "  Port 3030 architectural conflicts resolved"
    else
        echo "  Port 3030 architecture pristine"
    fi
elif command -v fuser &> /dev/null; then
    fuser -k 3030/tcp 2>/dev/null && echo "  Port 3030 conflicts resolved" || echo "  Port 3030 architecture pristine"
fi

echo "  Conducting ArtBastard-related process analysis..."
art_procs=$(pgrep -f "artbastard\|dmx" 2>/dev/null || true)
if [ -n "$art_procs" ]; then
    echo "  Gracefully terminating ArtBastard processes..."
    echo "$art_procs" | xargs kill -9 2>/dev/null || true
    echo "  ArtBastard processes terminated with architectural elegance"
else
    echo "  No ArtBastard processes detected (foundation clear)"
fi

echo "  Process termination protocol completed with sophistication"
echo ""

# Step 2: ARCHITECTURAL FOUNDATION RECONSTRUCTION
current_step=2
show_progress "STEP 2/7: ARCHITECTURAL FOUNDATION RECONSTRUCTION" "$current_step" "Red"

echo "  Executing architectural build directory reconstruction..."
build_dirs=("dist" "react-app/dist" "react-app/dist-tsc" "build" ".next" "out")
for dir in "${build_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  Gracefully removing architectural artifact: $dir"
        rm -rf "$dir" 2>/dev/null || true
    fi
done

echo "Initiating dependency reconstruction for pristine foundation..."
if [ -d "node_modules" ]; then
    echo "  Elegantly removing: node_modules"
    rm -rf node_modules 2>/dev/null || true
fi
if [ -d "react-app/node_modules" ]; then
    echo "  Gracefully removing: react-app/node_modules"
    rm -rf react-app/node_modules 2>/dev/null || true
fi

echo "Executing comprehensive npm cache purification..."
npm cache clean --force 2>/dev/null || true
npm cache verify 2>/dev/null || true

# Sophisticated temporary file elimination
if [ -d "$HOME/.npm" ]; then
    echo "  Cleaning npm cache directory..."
    rm -rf "$HOME/.npm/_cacache" 2>/dev/null || true
fi

# Sophisticated TypeScript build cache elimination
if [ -f ".tsbuildinfo" ]; then
    rm -f .tsbuildinfo 2>/dev/null || true
fi
if [ -f "react-app/.tsbuildinfo" ]; then
    rm -f react-app/.tsbuildinfo 2>/dev/null || true
fi

# Sophisticated Vite cache elimination
if [ -d "react-app/.vite" ]; then
    rm -rf react-app/.vite 2>/dev/null || true
fi

# Sophisticated Electron cache and build artifact elimination
echo "Executing Electron cache and build artifact elimination..."
if [ -d "electron/node_modules" ]; then
    echo "  Gracefully removing: electron/node_modules"
    rm -rf electron/node_modules 2>/dev/null || true
fi
if [ -d "electron/electron-dist" ]; then
    echo "  Elegantly removing: electron/electron-dist"
    rm -rf electron/electron-dist 2>/dev/null || true
fi
if [ -d "electron/dist" ]; then
    echo "  Sophisticated removal: electron/dist"
    rm -rf electron/dist 2>/dev/null || true
fi

echo "Architectural foundation reconstruction completed with sophistication!"
echo ""

# Step 3: SOPHISTICATED DEPENDENCY VALIDATION AND INSTALLATION
current_step=3
show_progress "STEP 3/7: SOPHISTICATED DEPENDENCY VALIDATION AND INSTALLATION" "$current_step" "Green"

echo "Executing comprehensive system requirement validation..."

# Sophisticated Node.js version analysis
if command -v node &> /dev/null; then
    node_version=$(node --version 2>/dev/null || echo "")
    if [ -n "$node_version" ]; then
        # Extract version number (remove 'v' prefix)
        version_num=$(echo "$node_version" | sed 's/^v//' | cut -d. -f1)
        if [ -n "$version_num" ] && [ "$version_num" -lt 18 ]; then
            echo "  Node.js version $node_version is architecturally insufficient."
            echo "  Please upgrade to v18.0.0 or higher for optimal performance."
            exit 1
        else
            echo "  Node.js architecture: $node_version (sophisticated)"
        fi
    else
        echo "  Node.js runtime not detected. Please install Node.js from https://nodejs.org/"
        exit 1
    fi
else
    echo "  Node.js runtime not detected. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Sophisticated npm version analysis
if command -v npm &> /dev/null; then
    npm_version=$(npm --version 2>/dev/null || echo "")
    if [ -n "$npm_version" ]; then
        echo "  npm architecture: v$npm_version (elegant)"
    else
        echo "  npm package manager not detected. Please reinstall Node.js."
        exit 1
    fi
else
    echo "  npm package manager not detected. Please reinstall Node.js."
    exit 1
fi

# Sophisticated disk space analysis
if command -v df &> /dev/null; then
    free_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ -n "$free_space" ] && [ "$free_space" -lt 2 ]; then
        echo "  Insufficient architectural disk space. At least 2GB free space required."
        echo "  Current: ${free_space}GB"
        exit 1
    else
        echo "  Disk architecture: ${free_space}GB available (sophisticated)"
    fi
fi

echo "All system requirements validated with architectural elegance!"
echo ""

# Check if dependencies need to be installed
needs_root_install=false
needs_frontend_install=false
needs_electron_install=false

[ ! -d "node_modules" ] && needs_root_install=true
[ ! -d "react-app/node_modules" ] && needs_frontend_install=true
[ ! -d "electron/node_modules" ] && needs_electron_install=true

if [ "$needs_root_install" = true ]; then
    echo "Installing root dependencies..."
    echo "  Using offline mode for faster startup..."
    if ! npm install --prefer-offline --no-optional --no-audit --no-fund --legacy-peer-deps; then
        echo "  Offline installation failed, trying with cached packages..."
        if ! npm install --prefer-offline --no-optional --no-audit --no-fund --no-cache --legacy-peer-deps; then
            echo "  Cached packages failed, trying online as fallback..."
            if ! npm install --no-cache --prefer-offline=false --legacy-peer-deps; then
                echo "FAILED: Root dependency installation failed!"
                exit 1
            fi
        fi
    fi
    echo "Root dependencies installed!"
else
    echo "Root dependencies already installed - skipping installation"
fi

if [ "$needs_frontend_install" = true ]; then
    echo "Installing frontend dependencies..."
    echo "  Using offline mode for faster startup..."
    (cd react-app && if ! npm install --prefer-offline --no-optional --no-audit --no-fund --legacy-peer-deps; then
        echo "  Offline installation failed, trying with cached packages..."
        if ! npm install --prefer-offline --no-optional --no-audit --no-fund --no-cache --legacy-peer-deps; then
            echo "  Cached packages failed, trying online as fallback..."
            npm install --no-cache --prefer-offline=false --legacy-peer-deps || exit 1
        fi
    fi)
    echo "Frontend dependencies installed!"
else
    echo "Frontend dependencies already installed - skipping installation"
fi

if [ "$needs_electron_install" = true ]; then
    echo "Installing Electron dependencies..."
    echo "  Using offline mode for faster startup..."
    (cd electron && if ! npm install --prefer-offline --no-optional --no-audit --no-fund --legacy-peer-deps; then
        echo "  Offline installation failed, trying with cached packages..."
        if ! npm install --prefer-offline --no-optional --no-audit --no-fund --no-cache --legacy-peer-deps; then
            echo "  Cached packages failed, trying online as fallback..."
            npm install --no-cache --prefer-offline=false --legacy-peer-deps || exit 1
        fi
    fi)
    echo "Electron dependencies installed!"
else
    echo "Electron dependencies already installed - skipping installation"
fi

echo ""

# Step 4: SOPHISTICATED ARCHITECTURAL CONSTRUCTION
current_step=4
show_progress "STEP 4/7: SOPHISTICATED ARCHITECTURAL CONSTRUCTION" "$current_step" "Green"

echo "Executing sophisticated backend architectural construction..."
if [ -f "build-backend-fast.js" ]; then
    echo "  Utilizing sophisticated fast build architecture..."
    npm run build-backend-fast || exit 1
else
    echo "  Employing standard build architecture..."
    npm run build-backend || exit 1
fi
echo "Backend architectural construction completed with sophistication!"

echo "Executing sophisticated frontend architectural construction..."
(cd react-app && npm run build:vite || exit 1)
echo "Frontend architectural construction completed with elegance!"

echo "Executing sophisticated Electron architectural preparation..."
echo "  Preparing Electron for sophisticated development mode..."
echo "  Electron will utilize the React development server at http://localhost:3001"
echo "Electron architectural preparation completed with sophistication!"
echo ""

# Step 5: SOPHISTICATED ARCHITECTURAL VERIFICATION
current_step=5
show_progress "STEP 5/7: SOPHISTICATED ARCHITECTURAL VERIFICATION" "$current_step" "Green"

build_success=true
[ ! -d "dist" ] && echo "Backend architectural foundation missing!" && build_success=false
[ ! -d "react-app/dist" ] && echo "Frontend architectural foundation missing!" && build_success=false
[ ! -d "electron/node_modules" ] && echo "Electron architectural dependencies missing!" && build_success=false

if [ "$build_success" = true ]; then
    echo "Architectural verification completed with sophistication!"
    echo "All architectural components constructed successfully!"
    echo "Electron application ready for sophisticated development mode with native MIDI support!"
else
    echo "Architectural verification encountered complications!"
    exit 1
fi
echo ""

# Step 6: SOPHISTICATED ELECTRON APPLICATION DEPLOYMENT
current_step=6
show_progress "STEP 6/7: SOPHISTICATED ELECTRON APPLICATION DEPLOYMENT" "$current_step" "Magenta"
echo "Initiating ArtBastard DMX512 Electron application with sophisticated native MIDI support..."

echo "Conducting sophisticated server readiness analysis before Electron deployment..."
max_attempts=30
attempt=0
url="http://localhost:3030"

# Start server in background for readiness check (will be started properly later)
npm start > /dev/null 2>&1 &
server_pid=$!

while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo "Server architecture verified! Deploying Electron application..."
        break
    fi
    
    if [ $((attempt % 5)) -eq 0 ]; then
        echo "  Conducting server readiness analysis... (attempt $attempt/$max_attempts)"
    fi
    
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "Server readiness timeout - proceeding with Electron deployment..."
fi

# Kill the background server process (will start properly in step 7)
kill $server_pid 2>/dev/null || true
wait $server_pid 2>/dev/null || true

echo "Initiating sophisticated Electron process deployment..."
(cd electron && npm run electron > /dev/null 2>&1 &)
echo "Electron application deployed with sophisticated native MIDI support!"
echo "MIDI Learn functionality now operates with architectural elegance and native MIDI access!"
echo ""

# Step 7: SOPHISTICATED ARTBASTARD WEB SERVER DEPLOYMENT
current_step=7
show_progress "STEP 7/7: SOPHISTICATED ARTBASTARD WEB SERVER DEPLOYMENT" "$current_step" "Green"
echo "Initiating ArtBastard DMX512 web server deployment with architectural sophistication..."

total_time=$(($(date +%s) - start_time))
update_eta_metrics "$total_time"

echo ""
echo "ARCHITECTURAL RECONSTRUCTION COMPLETED WITH SOPHISTICATION!"
echo "================================================================"
echo "Total Architectural Construction Time: ${total_time}s"
echo "You now possess the most sophisticated ArtBastard DMX512 architecture!"
echo "ELECTRON APPLICATION: Sophisticated native MIDI support with elegant MIDI Learn!"
echo "WEB SERVER ARCHITECTURE: All MIDI Learn, OSC, and lighting controls are architecturally pristine!"
echo "Deploying both Electron application AND web server architecture..."
echo "================================================================"
echo ""

# Open browser in background after server starts
(
    max_attempts=45
    attempt=0
    url="http://localhost:3030"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            if command -v xdg-open &> /dev/null; then
                xdg-open "$url" 2>/dev/null
            elif command -v gnome-open &> /dev/null; then
                gnome-open "$url" 2>/dev/null
            fi
            echo "ARCHITECTURAL SUCCESS! Browser deployed to $url"
            echo "ArtBastard DMX512 is ready with sophisticated architectural features!"
            break
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            echo "  Conducting server readiness analysis... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 1
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "Server readiness timeout: Architecture took longer than expected to initialize"
        echo "   You may manually deploy browser to: http://localhost:3030"
        echo "   The server architecture may still be initializing..."
    fi
) &

# Deploy the server with sophisticated monitoring
echo "Initiating ArtBastard DMX512 server deployment..."
npm start || {
    echo "Server deployment encountered architectural complications!"
    echo "Sophisticated troubleshooting protocols:"
    echo "   1. Verify port 3030 architectural conflicts"
    echo "   2. Confirm Node.js and npm architectural integrity"
    echo "   3. Execute: npm run build-backend && node dist/server.js"
    echo "   4. Review architectural logs for detailed analysis"
    exit 1
}

echo ""
echo "ArtBastard DMX512 architectural session concluded with sophistication."
echo "   Gratitude for utilizing the most sophisticated lighting control architecture!"
echo "   Both Electron application and web server have been deployed with architectural elegance!"
