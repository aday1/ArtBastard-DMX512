# ArtBastard Usage Guide (Current)

## Operator flow

Recommended order for a new session:

1. Configure fixtures and groups.
2. Open DMX Control and verify channel response.
3. Save baseline scenes in SuperControl.
4. Open Scenes and Acts for timeline or clip workflows.
5. Configure MIDI/OSC mappings and optional controller templates.
6. Validate TouchOSC export/upload if using tablet control.

## Main routes

- #/dmx-control
- #/fixture
- #/scenes-acts
- #/experimental
- #/external-console
- #/mobile

Experimental tab deep-link examples:

- #/experimental?tab=opencv
- #/experimental?tab=osc
- #/experimental?tab=touchosc

## MIDI controller templates

Open MIDI/OSC setup and apply one of:

- X-Touch Mackie template
- APC40 MK1 template

Expected result:

- Mappings are applied automatically.
- X-Touch template enables pitch-bend fader mappings.
- X-Touch scribble strips receive DMX channel labels.

## TouchOSC workflow

1. Open Experimental page with TouchOSC tab.
2. Generate layout.
3. Upload layout via socket workflow.
4. Confirm upload status success.
5. Download layout from backend endpoint if needed.

## Scene and timeline workflow

1. Capture current output as a scene.
2. Add timeline keyframes for selected channels.
3. Start playback and verify batched channel updates.
4. Use ACT triggers or clip launcher for live navigation.
5. Use next/previous ACT steps as needed.

## Backup and reset workflow

Configuration export/import is available through settings and API endpoints.

Reset sequence:

1. Export backup.
2. DELETE /api/state
3. DELETE /api/config
4. DELETE /api/scenes
5. Confirm /api/factory-reset-check reports true.
6. Restore backups via POST endpoints.

