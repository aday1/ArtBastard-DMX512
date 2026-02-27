# ArtBastard DMX512

ArtBastard is a TypeScript-based DMX lighting controller with a React frontend and Node/Socket.IO backend.

Current package version: 5.12.0

## Current status (2026-02-27)

The system rebuild is complete and production paths are consolidated:

- Single backend runtime lifecycle in server entry path.
- Unified fixture persistence service used by API and runtime.
- API contract aligned for state, config, scenes, and factory reset flows.
- TouchOSC export/upload workflow stabilized and tested.
- SuperControl scene behavior unified and scene capture indexing corrected.
- Timeline, clip launcher, and ACT trigger reliability fixes in place.
- DMX control page modularized for improved maintainability and large-universe usability.
- MIDI controller templates added:
  - Behringer X-Touch (Mackie mode mappings + scribble strip SysEx labels)
  - Akai APC40 MK1

## UI/UX tour screens (release assets)

Ordered walkthrough labels:

1. DMX Control Home
2. Fixture Setup
3. Scenes and Acts
4. Experimental Overview
5. TouchOSC Workflow
6. External Console
7. Mobile Control Surface

Release page:
https://github.com/aday1/ArtBastard-DMX512/releases/tag/v5.12.0

Current branch media assets (2026-02-27):

- DOCS/media/2026-02-27/videos/feature-tour-desktop.mp4
- DOCS/media/2026-02-27/videos/feature-tour-mobile.mp4
- DOCS/media/2026-02-27/ASSETS.txt

## Quick start

Requirements:

- Node.js 20+
- npm 10+

Install and run:

- npm ci
- npm --prefix react-app ci
- ./start.sh

Windows:

- .\start.ps1

App URL:

- http://localhost:3030

## Useful scripts

- npm run build
- npm run build-backend-fast
- npm run test:api-contract
- npm run test:touchosc-workflow
- npm run demo:capture-screenshots
- npm run demo:evidence

## Documentation

- DOCS/README.md
- DOCS/INSTALL.md
- DOCS/USAGE.md
- DOCS/FEATURES.md
- DOCS/FIXTURES.md
- DOCS/HISTORY.md

