# Archive

This directory contains legacy test/validation/demo artifacts that were cluttering the project root.

Structure:
* html/ – One-off validation reports, test harness pages, and feature completion snapshots that are no longer part of the active runtime.
* scripts/ – Deprecated or rarely used PowerShell helper scripts (test launchers, validation runners, experimental quickstarts).

Kept at root (still active):
* Selected operational utility HTML pages (panel reset, cache clear, feature guides, XY pad demo).
* Core maintenance scripts: cleanup, quickstart, rebuild, mega-maintenance, git-manager.

If you need to restore any file, simply move it back to the root in a new commit (git history also preserves prior locations).

Periodically prune this archive after confirming obsolescence (e.g., post-release) to keep repository lean.

Date archived: 2025-08-16.
