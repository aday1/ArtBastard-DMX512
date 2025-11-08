#!/bin/bash

# ArtBastard DMX512 - Launch Script for Linux
# Simplified version matching start.ps1

CLEAR=false
HELP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -Clear|--clear)
            CLEAR=true
            shift
            ;;
        -Help|--help|-h)
            HELP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -Help for usage information"
            exit 1
            ;;
    esac
done

# Show help
if [ "$HELP" = true ]; then
    echo "ArtBastard DMX512 - Launch Script"
    echo "====================================================="
    echo ""
    echo "Usage:"
    echo "  ./start.sh           # Fast start (recommended)"
    echo "  ./start.sh -Clear    # Full clean rebuild (removes everything, reinstalls, rebuilds)"
    echo "  ./start.sh -Help     # Display this help"
    echo ""
    echo "Modes:"
    echo "  Default: Fast start - preserves cache and dependencies, only rebuilds if needed"
    echo "  -Clear:  Full clean - removes node_modules, cache, and build artifacts, then rebuilds"
    echo ""
    exit 0
fi

echo "ArtBastard DMX512 - Launch Script"
echo "================================================================"
if [ "$CLEAR" = true ]; then
    echo "FULL CLEAN REBUILD MODE: Removing all artifacts and rebuilding from scratch"
else
    echo "FAST START MODE: Smart rebuild (only rebuilds if needed)"
fi
echo "================================================================"
echo ""

START_TIME=$(date +%s)

# Function to check if rebuild is needed
test_needs_rebuild() {
    NEEDS_REBUILD=false
    NEEDS_CACHE_CLEAR=false
    REASONS=()
    
    # Check backend
    if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
        NEEDS_REBUILD=true
        REASONS+=("Backend build missing")
    else
        # Check if source files are newer than build
        SERVER_BUILD_TIME=$(stat -c %Y dist/server.js 2>/dev/null || echo 0)
        if [ -d "src" ]; then
            NEWER_SOURCES=$(find src -type f -newer dist/server.js 2>/dev/null | head -1)
            if [ -n "$NEWER_SOURCES" ]; then
                NEEDS_REBUILD=true
                REASONS+=("Backend source files modified")
            fi
        fi
        
        # Check for major config changes
        for config_file in tsconfig.json package.json webpack.config.js vite.config.ts vite.config.js; do
            if [ -f "$config_file" ]; then
                CONFIG_TIME=$(stat -c %Y "$config_file" 2>/dev/null || echo 0)
                if [ "$CONFIG_TIME" -gt "$SERVER_BUILD_TIME" ]; then
                    NEEDS_REBUILD=true
                    NEEDS_CACHE_CLEAR=true
                    REASONS+=("Major config file changed: $config_file")
                fi
            fi
        done
    fi
    
    # Check React frontend
    if [ ! -d "react-app/dist" ] || [ ! -f "react-app/dist/index.html" ]; then
        NEEDS_REBUILD=true
        REASONS+=("Frontend build missing")
    else
        INDEX_BUILD_TIME=$(stat -c %Y react-app/dist/index.html 2>/dev/null || echo 0)
        if [ -d "react-app/src" ]; then
            NEWER_FRONTEND=$(find react-app/src -type f -newer react-app/dist/index.html 2>/dev/null | head -1)
            if [ -n "$NEWER_FRONTEND" ]; then
                NEEDS_REBUILD=true
                REASONS+=("Frontend source files modified")
            fi
        fi
        
        # Check if package.json changed
        if [ -f "react-app/package.json" ]; then
            PACKAGE_TIME=$(stat -c %Y react-app/package.json 2>/dev/null || echo 0)
            if [ "$PACKAGE_TIME" -gt "$INDEX_BUILD_TIME" ]; then
                NEEDS_REBUILD=true
                NEEDS_CACHE_CLEAR=true
                REASONS+=("Frontend dependencies changed (package.json)")
            fi
        fi
        
        # Check for major frontend config changes
        for config_file in react-app/tsconfig.json react-app/vite.config.ts react-app/vite.config.js react-app/.env react-app/.env.local; do
            if [ -f "$config_file" ]; then
                CONFIG_TIME=$(stat -c %Y "$config_file" 2>/dev/null || echo 0)
                if [ "$CONFIG_TIME" -gt "$INDEX_BUILD_TIME" ]; then
                    NEEDS_REBUILD=true
                    NEEDS_CACHE_CLEAR=true
                    REASONS+=("Major frontend config changed: $config_file")
                fi
            fi
        done
    fi
    
    # Check if node_modules are missing
    if [ ! -d "node_modules" ] || [ ! -d "react-app/node_modules" ]; then
        NEEDS_REBUILD=true
        REASONS+=("Dependencies missing")
    fi
    
    echo "$NEEDS_REBUILD|$NEEDS_CACHE_CLEAR|${REASONS[*]}"
}

# Function to launch browser when server is ready
start_browser_when_ready() {
    URL=${1:-"http://localhost:3030"}
    MAX_ATTEMPTS=${2:-45}
    
    (
        ATTEMPT=0
        while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
                xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null || echo "Please open: $URL"
                break
            fi
            if [ $((ATTEMPT % 5)) -eq 0 ]; then
                echo "  Waiting for server... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
            fi
            sleep 1
            ATTEMPT=$((ATTEMPT + 1))
        done
        
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "Server timeout - you may manually open: $URL"
        fi
    ) &
    echo $!
}

# FULL CLEAN REBUILD PATH: Complete cache clear and rebuild
if [ "$CLEAR" = true ]; then
    echo "🧹 FULL CLEAN REBUILD: Removing all artifacts and rebuilding from scratch"
    echo ""
    
    # Kill all processes
    echo "Terminating all Node.js processes..."
    pkill -f node 2>/dev/null || true
    pkill -f "ArtBastard" 2>/dev/null || true
    
    echo ""
    echo "🧹 FORCE CLEARING ALL CACHES..."
    
    # Clear Vite cache
    echo "  Clearing Vite cache..."
    if [ -d "react-app/.vite" ]; then
        rm -rf react-app/.vite
    fi
    
    # Clear npm cache
    echo "  Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    npm cache verify 2>/dev/null || true
    
    # Remove node_modules
    echo "  Removing node_modules..."
    [ -d "node_modules" ] && rm -rf node_modules
    [ -d "react-app/node_modules" ] && rm -rf react-app/node_modules
    
    # Remove build artifacts
    echo "  Removing build artifacts..."
    [ -d "dist" ] && rm -rf dist
    [ -d "react-app/dist" ] && rm -rf react-app/dist
    
    echo "Cache and artifacts cleared!"
    echo ""
    
    # Reinstall dependencies
    echo "📦 Reinstalling all dependencies..."
    echo "  Installing root dependencies..."
    npm install --no-audit --no-fund --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "Root dependency installation failed!" >&2
        exit 1
    fi
    
    echo "  Installing frontend dependencies..."
    cd react-app
    npm install --no-audit --no-fund --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "Frontend dependency installation failed!" >&2
        cd ..
        exit 1
    fi
    cd ..
    
    echo "Dependencies installed!"
    echo ""
    
    # Force rebuild
    echo "🔨 FORCE REBUILDING..."
    echo "  Building backend..."
    npm run build-backend
    if [ $? -ne 0 ]; then
        echo "Backend build failed!" >&2
        exit 1
    fi
    
    echo "  Building frontend..."
    cd react-app
    npm run build:vite
    if [ $? -ne 0 ]; then
        echo "Frontend build failed!" >&2
        cd ..
        exit 1
    fi
    cd ..
    
    echo "Build completed!"
    echo ""
    
    # Launch browser when server is ready
    echo "🌐 Browser will launch automatically when server is ready..."
    BROWSER_PID=$(start_browser_when_ready)
    
    # Start server
    npm start
    
    # Cleanup browser job
    kill $BROWSER_PID 2>/dev/null || true
    
    TOTAL_TIME=$(($(date +%s) - START_TIME))
    echo ""
    echo "ArtBastard DMX512 clean rebuild completed in ${TOTAL_TIME}s."
    exit 0
fi

# FAST START PATH: Smart rebuild (only rebuilds if needed)
echo "🚀 FAST START MODE"
echo "Smart rebuild - only rebuilds if source files changed"
echo ""

# Process termination
echo "Executing graceful process termination..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "ArtBastard" 2>/dev/null || true
echo "Process termination completed!"
echo ""

# Intelligent rebuild and cache detection
echo "Conducting architectural analysis..."
REBUILD_RESULT=$(test_needs_rebuild)
IFS='|' read -r NEEDS_REBUILD NEEDS_CACHE_CLEAR REASONS_STR <<< "$REBUILD_RESULT"
REASONS=($REASONS_STR)

# Check if cache clear is needed
if [ "$NEEDS_CACHE_CLEAR" = "true" ]; then
    echo "Cache optimization required (major code changes detected)..."
    for reason in "${REASONS[@]}"; do
        if [[ "$reason" == *"config"* ]] || [[ "$reason" == *"package.json"* ]] || [[ "$reason" == *"dependencies"* ]]; then
            echo "  $reason"
        fi
    done
    echo "  Clearing Vite cache..."
    [ -d "react-app/.vite" ] && rm -rf react-app/.vite
    echo "  Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    echo "  Verifying npm cache..."
    npm cache verify 2>/dev/null || true
    echo "Cache cleared successfully!"
fi

# Check and install dependencies if missing
NEEDS_ROOT_INSTALL=false
NEEDS_FRONTEND_INSTALL=false

[ ! -d "node_modules" ] && NEEDS_ROOT_INSTALL=true
[ ! -d "react-app/node_modules" ] && NEEDS_FRONTEND_INSTALL=true

if [ "$NEEDS_ROOT_INSTALL" = true ] || [ "$NEEDS_FRONTEND_INSTALL" = true ]; then
    echo "Dependencies missing - installing..."
    if [ "$NEEDS_ROOT_INSTALL" = true ]; then
        echo "  Installing root dependencies..."
        npm install --prefer-offline --no-optional --no-audit --no-fund --legacy-peer-deps
        if [ $? -ne 0 ]; then
            echo "Root dependency installation failed!" >&2
            exit 1
        fi
    fi
    if [ "$NEEDS_FRONTEND_INSTALL" = true ]; then
        echo "  Installing frontend dependencies..."
        cd react-app
        npm install --prefer-offline --no-optional --no-audit --no-fund --legacy-peer-deps
        if [ $? -ne 0 ]; then
            echo "Frontend dependency installation failed!" >&2
            cd ..
            exit 1
        fi
        cd ..
    fi
    echo "Dependencies installed!"
    echo ""
fi

if [ "$NEEDS_REBUILD" = "true" ]; then
    echo "Rebuild required:"
    for reason in "${REASONS[@]}"; do
        echo "  $reason"
    done
    echo ""
    echo "Executing intelligent rebuild..."
    
    # Build backend if needed
    if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
        echo "  Building backend..."
        npm run build-backend
        if [ $? -ne 0 ]; then
            echo "Backend build failed!" >&2
            exit 1
        fi
    else
        SERVER_BUILD_TIME=$(stat -c %Y dist/server.js 2>/dev/null || echo 0)
        NEWER_SOURCES=$(find src -type f -newer dist/server.js 2>/dev/null | head -1)
        if [ -n "$NEWER_SOURCES" ]; then
            echo "  Building backend (source files modified)..."
            npm run build-backend
            if [ $? -ne 0 ]; then
                echo "Backend build failed!" >&2
                exit 1
            fi
        fi
    fi
    
    # Build frontend if needed
    if [ ! -d "react-app/dist" ] || [ ! -f "react-app/dist/index.html" ]; then
        echo "  Building frontend..."
        cd react-app
        npm run build:vite
        if [ $? -ne 0 ]; then
            echo "Frontend build failed!" >&2
            cd ..
            exit 1
        fi
        cd ..
    else
        INDEX_BUILD_TIME=$(stat -c %Y react-app/dist/index.html 2>/dev/null || echo 0)
        NEWER_FRONTEND=$(find react-app/src -type f -newer react-app/dist/index.html 2>/dev/null | head -1)
        PACKAGE_JSON_NEWER=false
        if [ -f "react-app/package.json" ]; then
            PACKAGE_TIME=$(stat -c %Y react-app/package.json 2>/dev/null || echo 0)
            [ "$PACKAGE_TIME" -gt "$INDEX_BUILD_TIME" ] && PACKAGE_JSON_NEWER=true
        fi
        if [ -n "$NEWER_FRONTEND" ] || [ "$PACKAGE_JSON_NEWER" = true ]; then
            echo "  Building frontend (source files or dependencies modified)..."
            cd react-app
            npm run build:vite
            if [ $? -ne 0 ]; then
                echo "Frontend build failed!" >&2
                cd ..
                exit 1
            fi
            cd ..
        fi
    fi
    
    echo "Intelligent rebuild completed!"
else
    echo "Architectural foundation intact - no rebuild required!"
fi

echo ""
echo "Initiating ArtBastard DMX512 server deployment..."

# Launch browser when server is ready
echo "🌐 Browser will launch automatically when server is ready..."
BROWSER_PID=$(start_browser_when_ready)

# Deploy the server
npm start

# Cleanup browser job
kill $BROWSER_PID 2>/dev/null || true

TOTAL_TIME=$(($(date +%s) - START_TIME))
echo ""
echo "ArtBastard DMX512 session concluded in ${TOTAL_TIME}s."

