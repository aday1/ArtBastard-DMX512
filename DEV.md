# Developer Guide (Lean Mode)

Minimal workflow after repository declutter.

## Core Scripts
- `UNIFIED-TOOLS.ps1` main entry for kill / clean / build / quickstart / dev / rebuild.
- `TOOLS-GUI.ps1` optional WPF panel invoking the same commands.
- Batch launcher (`🎭 Launch ArtBastard DMX512 ✨.bat`) calls quickstart.

## Typical Flows
### Fresh Clone
1. `pwsh ./UNIFIED-TOOLS.ps1 clean --full` (optional if caches linger)
2. `pwsh ./UNIFIED-TOOLS.ps1 quickstart`
3. (Frontend dev) `cd react-app; npm run dev`

### Active Development
- Backend only: `pwsh ./UNIFIED-TOOLS.ps1 dev`
- Backend + frontend: `pwsh ./UNIFIED-TOOLS.ps1 dev --DevFrontend`
- Rebuild everything fast: `pwsh ./UNIFIED-TOOLS.ps1 rebuild`
- Backend only rebuild: `pwsh ./UNIFIED-TOOLS.ps1 rebuild --BackendOnly`

### Cleaning
- Light: `pwsh ./UNIFIED-TOOLS.ps1 clean`
- Full (removes node_modules): `pwsh ./UNIFIED-TOOLS.ps1 clean --full`

### Ports / Process Issues
`pwsh ./UNIFIED-TOOLS.ps1 kill` then re-run desired command.

## Frontend
Located in `react-app/`. Run `npm run dev` (Vite) on port 3001.

## Backend
Starts via `start-server.js` on port 3030.

## Adding Dependencies
Root: `npm install <pkg>`
Frontend: `cd react-app && npm install <pkg>`

## Versioning
Update `package.json` version. Tag release as `vX.Y.Z` when stable.

## Conventions
- No stray validation/test HTML or scripts committed.
- Temporary scratch files should be prefixed `scratch-` and removed before commit.
- Scripts centralised in `UNIFIED-TOOLS.ps1` (avoid new ad-hoc PS1 scripts).

## Future Enhancements (Optional Backlog)
- Convert PowerShell WPF to compiled C# app.
- Add logging rotation for backend.
- Add basic Jest test scaffold (if reintroducing automated tests).

