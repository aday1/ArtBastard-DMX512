# ArtBastard Features (Current)

This file describes the currently implemented feature set after the rebuild completion.

## Control and runtime

- 512-channel DMX universe control with fixture/group abstractions.
- Art-Net output support.
- Real-time socket state synchronization between backend and frontend.
- Consolidated backend lifecycle and unified fixture persistence.

## DMX workflow and UX

- Modular DMX control page architecture:
  - Header
  - Filters and fixture selector
  - Channels viewport/cards
  - Scene controls
  - MIDI connection panel
  - Footer/status areas
- Channel and fixture filtering utilities with regression tests.
- Pinned channel summaries and active channel visibility helpers.

## Scenes, acts, and timelines

- Scene save/load/delete from canonical SuperControl flow.
- Scene timeline playback with batched channel updates.
- Clip launcher follow and loop behavior improvements.
- ACT trigger actions include play, pause, stop, next, previous, toggle.
- Timeline playback and restart wiring reliability updates.

## Touch and external surfaces

- External Console route support.
- Mobile Control Surface route support.
- Hash-based route/view synchronization.
- Experimental page tab deep-linking (including TouchOSC tab query support).

## TouchOSC

- Canonical TouchOSC XML generation path.
- Export and upload workflow with upload status feedback.
- Runtime endpoint for TouchOSC layout download.
- TouchOSC workflow smoke test coverage.

## MIDI and OSC

- MIDI learn support for note, CC, and pitch-bend mappings.
- Pitch-bend-to-DMX processing path in backend and frontend.
- MIDI controller templates:
  - Behringer X-Touch Mackie template
  - Akai APC40 MK1 template
- X-Touch scribble strip SysEx updates on template apply.
- Backend endpoint for template application:
  - POST /api/midi/controller-template

## Settings and reset

- API contract support for:
  - /api/state GET/POST/DELETE
  - /api/config GET/POST/DELETE
  - /api/scenes GET/POST/DELETE
- Factory reset marker check endpoint:
  - /api/factory-reset-check

## Testing and evidence tooling

- Targeted unit/regression tests for:
  - TouchOSC export
  - Scene capture indexing
  - ACT trigger handling
  - Clip launcher helper logic
  - DMX filtering behavior
- Smoke scripts:
  - API contract smoke
  - TouchOSC workflow smoke
- Automated screenshot capture for demo evidence.

