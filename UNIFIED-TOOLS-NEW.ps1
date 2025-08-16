<#
        UNIFIED-TOOLS.ps1  (ArtBastard DMX512)

        Consolidated dev / maintenance toolbox replacing multiple ad-hoc scripts:
          - CLEANUP.ps1 / CLEANUP-FAST.ps1
          - QUICKSTART.ps1 / QUICKSTART-FAST variants
          - REBUILD-FAST.ps1 / REBUILD-SIMPLE.ps1
          - Launch helpers (manual test launchers archived)

        Usage (examples):
          ./UNIFIED-TOOLS.ps1 help
          ./UNIFIED-TOOLS.ps1 quickstart          # install (if needed) + build + launch backend + show frontend instructions
          ./UNIFIED-TOOLS.ps1 dev                 # start backend + (optionally) frontend dev
          ./UNIFIED-TOOLS.ps1 rebuild             # fast rebuild (backend + frontend)
          ./UNIFIED-TOOLS.ps1 rebuild -backend   # backend only
          ./UNIFIED-TOOLS.ps1 clean               # safe clean (no node_modules)
          ./UNIFIED-TOOLS.ps1 clean -full        # full clean (includes node_modules & locks)
          ./UNIFIED-TOOLS.ps1 kill                # kill stray node / ports 3030,3001
          ./UNIFIED-TOOLS.ps1 status              # show quick environment status

        Notes:
          - Keeps originals in archive for reference; prefer this script going forward.
          - Verbosity reduced vs earlier theatrical scripts; still readable.
          - Idempotent: re-runs only work needed (dependency check heuristic).

        Author: Consolidated by automation on 2025-08-16
#>

param(
        [Parameter(Position=0)] [ValidateSet('help','quickstart','dev','rebuild','clean','kill','status')]
        [string]$Command = 'help',
        [switch]$Full,          # for clean: include node_modules & locks
        [switch]$BackendOnly,   # for rebuild: skip frontend
        [switch]$DevFrontend,   # for dev: auto start frontend dev server
        [switch]$ForceInstall,  # force reinstall deps
        [switch]$NoBackend,     # (dev) skip backend start
        [switch]$SkipBuild      # (quickstart) skip build step if dist exists
)

$ErrorActionPreference = 'Stop'

function Write-Section($t){ Write-Host "== $t ==" -ForegroundColor Cyan }
function Write-Ok($t){ Write-Host "[OK] $t" -ForegroundColor Green }
function Write-Warn($t){ Write-Host "[WARN] $t" -ForegroundColor Yellow }
function Write-Err($t){ Write-Host "[ERROR] $t" -ForegroundColor Red }

$Root = $PSScriptRoot; if (-not $Root) { $Root = (Get-Location).Path }
Set-Location $Root

if (-not (Test-Path package.json)) { Write-Err "Run from repo root"; exit 1 }

function Show-Help {
        Write-Host ""
        Write-Host "ArtBastard DMX512 Unified Dev Tools" -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor DarkGray

        Write-Host ""
        Write-Host "COMMANDS:" -ForegroundColor White -BackgroundColor DarkBlue
        Write-Host ""

        Write-Host "  help            " -ForegroundColor Yellow -NoNewline
        Write-Host "Show this colorful help" -ForegroundColor Gray

        Write-Host "  status          " -ForegroundColor Green -NoNewline
        Write-Host "Show quick status (ports, dirs, versions)" -ForegroundColor Gray

        Write-Host "  kill            " -ForegroundColor Red -NoNewline
        Write-Host "Terminate node processes & free ports (3030,3001)" -ForegroundColor Gray

        Write-Host "  clean           " -ForegroundColor Cyan -NoNewline
        Write-Host "Remove build artifacts (add -Full for node_modules)" -ForegroundColor Gray

        Write-Host "  quickstart      " -ForegroundColor Magenta -NoNewline
        Write-Host "Install, build, launch backend, print frontend instructions" -ForegroundColor Gray

        Write-Host "  dev             " -ForegroundColor Blue -NoNewline
        Write-Host "Start backend (and optionally frontend dev with -DevFrontend)" -ForegroundColor Gray

        Write-Host "  rebuild         " -ForegroundColor DarkYellow -NoNewline
        Write-Host "Fast rebuild (smart clean + build, use -BackendOnly for backend only)" -ForegroundColor Gray

        Write-Host ""
        Write-Host "SWITCHES:" -ForegroundColor White -BackgroundColor DarkMagenta
        Write-Host ""
        Write-Host "  -Full -BackendOnly -DevFrontend -ForceInstall -NoBackend -SkipBuild" -ForegroundColor Yellow

        Write-Host ""
        Write-Host "EXAMPLES:" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host ""
        Write-Host "  .\UNIFIED-TOOLS.ps1 quickstart" -ForegroundColor Cyan
        Write-Host "  .\UNIFIED-TOOLS.ps1 rebuild -BackendOnly" -ForegroundColor Green
        Write-Host "  .\UNIFIED-TOOLS.ps1 clean -Full" -ForegroundColor Red
        Write-Host "  .\UNIFIED-TOOLS.ps1 dev -DevFrontend" -ForegroundColor Magenta

        Write-Host ""
        Write-Host "============================================" -ForegroundColor DarkGray
        Write-Host "Happy coding with ArtBastard DMX512!" -ForegroundColor White
        Write-Host ""
}

function Kill-Dev {
        Write-Host ""
        Write-Host "CLEARING THE COSMIC STAGE" -ForegroundColor Magenta -BackgroundColor Black
        Write-Host "Aligning chakras and banishing old processes..." -ForegroundColor Cyan
        Write-Host ""

        $ports = @('3030','3001')
        foreach($p in $ports){
                Write-Host "Scanning dimensional port $p for lingering spirits..." -ForegroundColor Yellow
                $proc = netstat -ano | Select-String ":$p " | Select-Object -First 1
                if($proc){
                        $processId = ($proc.ToString() -split '\s+')[-1]
                        if($processId -match '^\d+$'){
                                try {
                                        taskkill /F /PID $processId 2>$null | Out-Null
                                        Write-Host "BANISHED entity from port $p (PID $processId) back to the digital void!" -ForegroundColor Red
                                } catch {
                                        Write-Host "Ancient spirit resists banishment on PID $processId" -ForegroundColor Yellow
                                }
                        }
                } else {
                        Write-Host "Port $p is pure and ready for artistic energy!" -ForegroundColor Green
                }
        }

        Write-Host "Seeking rogue Node.js performers in the cosmic theater..." -ForegroundColor Magenta
        Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                        Stop-Process -Id $_.Id -Force -ErrorAction Stop
                        Write-Host "Gracefully dismissed Node performer PID $($_.Id) from the stage" -ForegroundColor Red
                } catch { 
                        Write-Host "Node performer PID $($_.Id) refuses to leave the spotlight!" -ForegroundColor Yellow
                }
        }
        Write-Host "The cosmic stage is now PRISTINE and ready for art!" -ForegroundColor Green
        Write-Host ""
}

function Clean-Artifacts([bool]$FullClean){
        Write-Host ""
        Write-Host "PURIFYING THE ARTISTIC WORKSPACE" -ForegroundColor Cyan -BackgroundColor DarkMagenta
        Write-Host "Cleansing old creative energies and build artifacts..." -ForegroundColor Yellow
        Write-Host ""

        $paths = @('dist','react-app/dist','react-app/build','artbastard-nextjs-frontend/.next','artbastard-nextjs-frontend/dist')
        foreach($p in $paths){
                if(Test-Path $p){
                        Write-Host "Dissolving stale creation: $p" -ForegroundColor Red
                        try{
                                Remove-Item $p -Recurse -Force -ErrorAction Stop
                                Write-Host "VANQUISHED: $p has been returned to the digital ether!" -ForegroundColor Green
                        } catch {
                                Write-Host "Ancient artifact $p resists purification!" -ForegroundColor Yellow
                        }
                } else {
                        Write-Host "Already pure: $p (non-existent, perfect!)" -ForegroundColor DarkGray
                }
        }

        if($FullClean){
                Write-Host ""
                Write-Host "NUCLEAR PURIFICATION MODE ACTIVATED" -ForegroundColor Red -BackgroundColor Black
                Write-Host "Erasing ALL dependencies from existence..." -ForegroundColor Magenta

                $mods = @('node_modules','react-app/node_modules','artbastard-nextjs-frontend/node_modules','package-lock.json','react-app/package-lock.json','artbastard-nextjs-frontend/package-lock.json')
                foreach($m in $mods){ 
                        if(Test-Path $m){
                                Write-Host "OBLITERATING: $m" -ForegroundColor Red
                                try{
                                        Remove-Item $m -Recurse -Force -ErrorAction Stop
                                        Write-Host "ANNIHILATED: $m has been cast into the void!" -ForegroundColor Green
                                } catch {
                                        Write-Host "Stubborn relic $m clings to existence!" -ForegroundColor Yellow
                                }
                        }
                }
        }
        Write-Host "The workspace is now SPIRITUALLY CLEANSED and ready for creation!" -ForegroundColor Green
        Write-Host ""
}

function Ensure-Dependencies([bool]$Force){
        Write-Host ""
        Write-Host "SUMMONING THE DIGITAL SPIRITS OF DEPENDENCY" -ForegroundColor Green -BackgroundColor DarkBlue
        Write-Host "Consulting the ancient package.json grimoires..." -ForegroundColor Cyan
        Write-Host ""

        $needRoot = $Force -or (-not (Test-Path node_modules))
        $needFront = $Force -or (-not (Test-Path 'react-app/node_modules'))

        if(-not ($needRoot -or $needFront)){
                Write-Host "The dependency chakras are already PERFECTLY ALIGNED!" -ForegroundColor Green
                Write-Host "All node_modules are vibrating at optimal frequencies!" -ForegroundColor Cyan
                return
        }

        if($needRoot){
                Write-Host "CHANNELING root project dependencies from the npm cosmos..." -ForegroundColor Magenta
                Write-Host "Invoking: npm install (this may take a moment while we commune with the package spirits)" -ForegroundColor Yellow
                npm install
                Write-Host "ROOT DEPENDENCIES SUCCESSFULLY MANIFESTED!" -ForegroundColor Green
        } else {
                Write-Host "Root dependencies already perfectly aligned!" -ForegroundColor DarkGray
        }

        if($needFront){
                Write-Host ""
                Write-Host "WEAVING frontend dependencies into the cosmic tapestry..." -ForegroundColor Blue
                Write-Host "Entering the react-app dimension..." -ForegroundColor Cyan
                Set-Location react-app
                Write-Host "Invoking: npm install (channeling React spirits...)" -ForegroundColor Yellow
                npm install
                Set-Location ..
                Write-Host "FRONTEND DEPENDENCIES TRANSCENDED INTO EXISTENCE!" -ForegroundColor Green
        } else {
                Write-Host "Frontend dependencies already harmonized with the universe!" -ForegroundColor DarkGray
        }

        Write-Host ""
        Write-Host "ALL COSMIC DEPENDENCIES ARE NOW ALIGNED AND READY!" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
}

function Build-Project([bool]$BackendOnly){
        Write-Host ""
        Write-Host "CRAFTING THE DIGITAL MASTERPIECE" -ForegroundColor Yellow -BackgroundColor DarkRed
        Write-Host "Weaving code into beautiful, executable art..." -ForegroundColor Magenta
        Write-Host ""

        Write-Host "COMPILING BACKEND MYSTICAL ENERGIES..." -ForegroundColor Cyan
        Write-Host "Invoking: npm run build-backend (transmuting TypeScript to JavaScript)" -ForegroundColor Yellow
        npm run build-backend
        Write-Host "BACKEND SUCCESSFULLY CRYSTALLIZED INTO PURE EXECUTABLE FORM!" -ForegroundColor Green

        if(-not $BackendOnly){
                Write-Host ""
                Write-Host "MANIFESTING FRONTEND VISUAL SPECTACLE..." -ForegroundColor Blue
                Write-Host "Entering the React dimension to build the user interface..." -ForegroundColor Cyan
                Set-Location react-app
                Write-Host "Invoking: npm run build (weaving JSX into static glory)" -ForegroundColor Yellow
                npm run build
                Set-Location ..
                Write-Host "FRONTEND TRANSFORMED INTO BEAUTIFUL STATIC ARTWORK!" -ForegroundColor Green
        } else {
                Write-Host "Backend-only mode: Frontend remains in its raw, dynamic state!" -ForegroundColor DarkGray
        }

        Write-Host ""
        Write-Host "THE DIGITAL MASTERPIECE IS COMPLETE AND READY TO ILLUMINATE THE WORLD!" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
}

function Start-Backend {
        Write-Host ""
        Write-Host "AWAKENING THE DMX512 COSMIC BACKEND" -ForegroundColor Magenta -BackgroundColor DarkGreen
        Write-Host "Breathing life into the digital lighting universe..." -ForegroundColor Cyan
        Write-Host ""

        Write-Host "LAUNCHING NODE.JS COSMIC VESSEL..." -ForegroundColor Yellow
        Write-Host "Invoking: node dist/main.js (in ethereal background mode)" -ForegroundColor Cyan
        Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WindowStyle Hidden

        Write-Host "Allowing 2 seconds for the cosmic energies to stabilize..." -ForegroundColor Blue
        for($i = 1; $i -le 2; $i++) {
                Start-Sleep -Seconds 1
                Write-Host "    Cosmic alignment in progress... ($i/2)" -ForegroundColor DarkCyan
        }

        Write-Host ""
        Write-Host "DMX512 BACKEND IS NOW ALIVE AND PULSING WITH ARTISTIC ENERGY!" -ForegroundColor Green -BackgroundColor Black
        Write-Host "Port 3030 is now radiating beautiful DMX vibrations!" -ForegroundColor Green
        Write-Host ""
}

function Frontend-Instructions {
        Write-Host ""
        Write-Host "FRONTEND ENLIGHTENMENT INSTRUCTIONS" -ForegroundColor Cyan -BackgroundColor DarkMagenta
        Write-Host "Your artistic interface awaits manifestation..." -ForegroundColor Yellow
        Write-Host ""

        Write-Host "DEVELOPMENT MODE (for creative iteration):" -ForegroundColor Green
        Write-Host "    cd react-app && npm start" -ForegroundColor Cyan
        Write-Host "    This will open a live-reloading artistic canvas!" -ForegroundColor Blue
        Write-Host ""

        Write-Host "PRODUCTION MODE (for final cosmic deployment):" -ForegroundColor Yellow
        Write-Host "    Serve the contents of react-app/dist/" -ForegroundColor Cyan
        Write-Host "    Your static masterpiece ready for the world!" -ForegroundColor Magenta
        Write-Host ""

        Write-Host "THE DMX512 UNIVERSE AWAITS YOUR CREATIVE COMMAND!" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
}

switch($Command) {
        'status' {
                Write-Section 'Status'
                Write-Host "Root: $Root" -ForegroundColor Gray
                Write-Host "Node: $(node -v 2>$null)" -ForegroundColor Gray
                Write-Host "Ports in use:" -ForegroundColor Gray
                netstat -ano | Select-String ':3030|:3001' | ForEach-Object { $_ }
                Write-Host "Directory Status:" -ForegroundColor Gray
                $directories = @('dist', 'react-app\dist')
                foreach($directory in $directories){
                        if(Test-Path $directory) {
                                Write-Host "  exists -> $directory" -ForegroundColor Green
                        } else {
                                Write-Host "  missing -> $directory" -ForegroundColor Red
                        }
                }
        }
        'quickstart' {
                Write-Host ""
                Write-Host "ARTBASTARD DMX512 QUICKSTART RITUAL INITIATED" -ForegroundColor Magenta -BackgroundColor Black
                Write-Host "Preparing to launch your creative lighting universe..." -ForegroundColor Cyan
                Write-Host "All chakras aligning... cosmic energies converging..." -ForegroundColor Yellow
                Write-Host ""

                Write-Host "PHASE 1: CLEANSING THE COSMIC STAGE..." -ForegroundColor Cyan
                Kill-Dev

                if(-not $SkipBuild){
                        Write-Host "PHASE 2: PURIFYING THE CREATIVE WORKSPACE..." -ForegroundColor Cyan
                        Clean-Artifacts $false
                } else {
                        Write-Host "PHASE 2: SKIPPING PURIFICATION (build artifacts preserved)" -ForegroundColor DarkGray
                }

                Write-Host "PHASE 3: SUMMONING DIGITAL DEPENDENCIES..." -ForegroundColor Cyan
                Ensure-Dependencies $ForceInstall

                if(-not $SkipBuild){
                        Write-Host "PHASE 4: CRAFTING THE DIGITAL MASTERPIECE..." -ForegroundColor Cyan
                        Build-Project $false
                } else {
                        Write-Host "PHASE 4: SKIPPING CRAFTING (using existing builds)" -ForegroundColor DarkGray
                }

                Write-Host "PHASE 5: AWAKENING THE DMX COSMIC BACKEND..." -ForegroundColor Cyan
                Start-Backend

                Write-Host "PHASE 6: REVEALING THE FRONTEND PATHWAYS..." -ForegroundColor Cyan
                Frontend-Instructions

                Write-Host ""
                Write-Host 'QUICKSTART RITUAL COMPLETE!' -ForegroundColor Green -BackgroundColor Black
                Write-Host 'Your ArtBastard DMX512 universe is now FULLY OPERATIONAL!' -ForegroundColor Green
                Write-Host 'The cosmic stage is set for your creative lighting mastery!' -ForegroundColor Magenta
                Write-Host ""
        }
        'dev' {
                if(-not $NoBackend){ Kill-Dev; Start-Backend }
                if($DevFrontend){ Set-Location react-app; Start-Process -FilePath 'npm' -ArgumentList 'start' }
                Frontend-Instructions
        }
        'rebuild' {
                Clean-Artifacts $false
                Ensure-Dependencies $ForceInstall
                Build-Project $BackendOnly
        }
        'clean' {
                Clean-Artifacts $Full
        }
        'kill' {
                Kill-Dev
        }
        'help' { Show-Help }
        default { Show-Help }
}
