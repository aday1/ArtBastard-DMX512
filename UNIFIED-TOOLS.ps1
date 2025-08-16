<#!
	UNIFIED-TOOLS.ps1  (ArtBastard DMX512)

	Consolidated dev / maintenance toolbox replacing multiple ad‑hoc scripts:
	  - CLEANUP.ps1 / CLEANUP-FAST.ps1
	  - QUICKSTART.ps1 / QUICKSTART-FAST variants
	  - REBUILD-FAST.ps1 / REBUILD-SIMPLE.ps1
	  - Launch helpers (manual test launchers archived)

	Usage (examples):
	  ./UNIFIED-TOOLS.ps1 help
	  ./UNIFIED-TOOLS.ps1 quickstart          # install (if needed) + build + launch backend + show frontend instructions
	  ./UNIFIED-TOOLS.ps1 dev                 # start backend + (optionally) frontend dev
	  ./UNIFIED-TOOLS.ps1 rebuild             # fast rebuild (backend + frontend)
	  ./UNIFIED-TOOLS.ps1 rebuild --backend   # backend only
	  ./UNIFIED-TOOLS.ps1 clean               # safe clean (no node_modules)
	  ./UNIFIED-TOOLS.ps1 clean --full        # full clean (includes node_modules & locks)
	  ./UNIFIED-TOOLS.ps1 kill                # kill stray node / ports 3030,3001
	  ./UNIFIED-TOOLS.ps1 status              # show quick environment status

	Notes:
	  - Keeps originals in archive for reference; prefer this script going forward.
	  - Verbosity reduced vs earlier theatrical scripts; still readable.
	  - Idempotent: re-runs only work needed (dependency check heuristic).

	Author: Consolidated by automation on 2025-08-16
#!>

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
function Write-Ok($t){ Write-Host "✔ $t" -ForegroundColor Green }
function Write-Warn($t){ Write-Host "⚠ $t" -ForegroundColor Yellow }
function Write-Err($t){ Write-Host "✖ $t" -ForegroundColor Red }

$Root = $PSScriptRoot; if (-not $Root) { $Root = (Get-Location).Path }
Set-Location $Root

if (-not (Test-Path package.json)) { Write-Err "Run from repo root"; exit 1 }

function Show-Help {
@'
Unified ArtBastard Dev Tools
Commands:
  help            Show this help
  status          Show quick status (ports, dirs, versions)
  kill            Terminate node processes & free ports (3030,3001)
  clean [--full]  Remove build artifacts (add --full for node_modules & locks)
  quickstart [--SkipBuild] [--ForceInstall]
				  Install (if needed), build, launch backend, print frontend instructions
  dev [--DevFrontend] [--NoBackend]
				  Start backend (and optionally frontend dev)
  rebuild [--BackendOnly] [--ForceInstall]
				  Fast rebuild (smart clean + build)
Switches: --Full --BackendOnly --DevFrontend --ForceInstall --NoBackend --SkipBuild
Examples:
  ./UNIFIED-TOOLS.ps1 quickstart
  ./UNIFIED-TOOLS.ps1 rebuild --BackendOnly
  ./UNIFIED-TOOLS.ps1 clean --full
'@ | Write-Host
}

function Kill-Dev {
	Write-Section 'Killing processes'
	$ports = 3030,3001
	foreach($p in $ports){
		netstat -ano | Select-String ":$p\s" | Where-Object { $_ -match 'LISTENING' } | ForEach-Object {
			$pid = ($_.ToString() -split '\s+')[-1]
			if($pid -match '^\d+$'){ try { taskkill /F /PID $pid 2>$null | Out-Null; Write-Ok "Freed port $p (PID $pid)" } catch { Write-Warn "Could not kill PID $pid" } }
		}
	}
	Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
		try { Stop-Process -Id $_.Id -Force -ErrorAction Stop; Write-Ok "Killed node PID $($_.Id)" } catch { Write-Warn "Node PID $($_.Id) busy" }
	}
}

function Clean-Artifacts([bool]$FullClean){
	Write-Section ("Cleaning artifacts" + ($FullClean ? ' (full)' : ''))
	$paths = @('dist','react-app\dist','launcher-dist','.eslintcache','react-app\.eslintcache','react-app\.vite','.vite')
	foreach($p in $paths){ if(Test-Path $p){ try{ Remove-Item $p -Recurse -Force -ErrorAction Stop; Write-Ok "Removed $p" } catch { Write-Warn "Failed $p" } } }
	if($FullClean){
		$mods = @('node_modules','react-app\node_modules','launcher\node_modules','package-lock.json','react-app\package-lock.json','launcher\package-lock.json')
		foreach($m in $mods){ if(Test-Path $m){ try{ Remove-Item $m -Recurse -Force -ErrorAction Stop; Write-Ok "Removed $m" } catch { Write-Warn "Failed $m" } } }
	}
}

function Ensure-Dependencies([bool]$Force){
	$needRoot = $Force -or -not (Test-Path 'node_modules')
	$needFront = $Force -or -not (Test-Path 'react-app\node_modules')
	if(-not ($needRoot -or $needFront)){ Write-Ok 'Dependencies ok'; return }
	Write-Section 'Installing dependencies'
	if($needRoot){ Write-Host 'Root deps…' -ForegroundColor DarkGray; npm install --no-audit }
	if($needFront){ Push-Location react-app; Write-Host 'Frontend deps…' -ForegroundColor DarkGray; npm install --no-audit; Pop-Location }
}

function Build-All([bool]$BackendOnly){
	Write-Section 'Building'
	if(Test-Path build-backend-fast.js){ node build-backend-fast.js } else { npm run build-backend }
	if(-not $BackendOnly){ Push-Location react-app; npm run build; Pop-Location }
	Write-Ok 'Build complete'
}

function Start-Backend {
	Write-Section 'Starting backend'
	$cmd = "Set-Location '$Root'; node start-server.js"
	Start-Process pwsh -ArgumentList '-NoExit','-Command', $cmd | Out-Null
	Write-Ok 'Backend launched (port 3030)'
}

function Frontend-Instructions {
	Write-Host "Frontend dev: (new terminal) cd react-app; npm run dev  (served on :3001)" -ForegroundColor Yellow
}

switch($Command){
	'help' { Show-Help }
	'kill' { Kill-Dev }
	'clean' { Kill-Dev; Clean-Artifacts $Full.IsPresent }
	'status' {
		Write-Section 'Status'
		Write-Host "Root: $Root" -ForegroundColor Gray
		Write-Host "Node: $(node -v 2>$null)" -ForegroundColor Gray
		Write-Host "Ports in use:" -ForegroundColor Gray
		netstat -ano | Select-String ':3030|:3001' | ForEach-Object { $_ }
		foreach($p in 'dist','react-app\\dist'){ Write-Host (Test-Path $p ? "exists -> $p" : "missing -> $p") -ForegroundColor Gray }
	}
	'quickstart' {
		Kill-Dev
		if(-not $SkipBuild){ Clean-Artifacts $false }
		Ensure-Dependencies $ForceInstall
		if(-not $SkipBuild){ Build-All $false }
		Start-Backend
		Frontend-Instructions
	}
	'dev' {
		if(-not $NoBackend){ Start-Backend }
		if($DevFrontend){ Push-Location react-app; Start-Process pwsh -ArgumentList '-NoExit','-Command','npm run dev' | Out-Null; Pop-Location } else { Frontend-Instructions }
	}
	'rebuild' {
		Kill-Dev; Clean-Artifacts $false; Ensure-Dependencies $ForceInstall; Build-All $BackendOnly; Start-Backend; if(-not $BackendOnly){ Frontend-Instructions }
	}
	default { Show-Help }
}

