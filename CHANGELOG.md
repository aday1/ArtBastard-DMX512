# Changelog

All notable changes to this project are documented here.

## [5.12.0] - 2026-02-27

### Added

- MIDI controller templates for:
  - Behringer X-Touch Mackie mode
  - Akai APC40 MK1
- X-Touch scribble strip update support via SysEx.
- Pitch-bend MIDI mapping support in backend and frontend processing paths.
- API endpoint for controller template application:
  - POST /api/midi/controller-template
- Regression tests for:
  - TouchOSC export generation
  - Scene capture indexing
  - ACT trigger action handling
  - Clip launcher helper logic
  - DMX filtering behavior
- Smoke scripts:
  - API contract smoke
  - TouchOSC workflow smoke
- Demo screenshot capture workflow and consolidated demo evidence command.

### Changed

- Backend lifecycle ownership consolidated to a single runtime path.
- Fixture persistence unified across runtime and API modules.
- DMX control page refactored into modular subcomponents and shared filters.
- SuperControl wrappers aligned to canonical control implementation.
- Timeline playback channel updates batched for smoother playback behavior.
- Router and experimental tabs support hash-based deep linking.
- TouchOSC XML generation path unified to canonical exporter implementation.

### Fixed

- API contract mismatches across /api/state, /api/config, /api/scenes.
- Factory reset marker check flow and reset consistency.
- Scene capture off-by-one indexing issues.
- ACT next/previous trigger behavior.
- Clip follow/loop determinism.
- CI backend npm install peer-dependency failure caused by root-level dependency conflict.

