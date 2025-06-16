# DMX Address Mapping Fix - Summary

## Issue Identified
The Super Controller components were using incorrect DMX address mapping, causing controller movements to target the wrong DMX channels. This was due to an off-by-one error in the address calculation.

## Root Cause
DMX systems have two different numbering schemes:
- **UI/User Interface**: Channels numbered 1-512 (1-based)
- **Array/Code Implementation**: Array indices 0-511 (0-based)

The bug was in the calculation: `dmxAddress = fixture.startAddress + index`

This formula was treating the result as if it were 0-based, but `fixture.startAddress` is 1-based.

## The Fix
Changed the calculation to: `dmxAddress = fixture.startAddress + index - 1`

This correctly maps:
- Fixture start address 1, channel 0 → DMX array index 0 (was incorrectly 1)
- Fixture start address 10, channel 2 → DMX array index 11 (was incorrectly 12)

## Files Fixed
1. **SuperControl.tsx** (2 instances)
   - Line ~96: Channel selection mode mapping
   - Line ~137: Fixture/group/capability selection mode mapping

2. **TouchSuperControl.tsx** (2 instances)  
   - Line ~161: Channel selection mode mapping
   - Line ~204: Fixture/group/capability selection mode mapping

## Files Already Correct
These files were already implementing the correct mapping:
- **ColorPickerPanel.tsx** - Already used `dmxAddress - 1` for actual control
- **ChromaticEnergyManipulatorMini.tsx** - Already used `dmxAddress - 1` for actual control
- **FixtureSetup.tsx** - Correctly used different formulas for display vs. control

## Impact
- **Before**: Super Controller movements updated incorrect DMX channels
- **After**: Super Controller movements update the correct DMX channels corresponding to selected fixtures

## Validation
Created `dmx-address-mapping-validation.html` to document the correct mapping logic and test cases.

## Testing Recommendations
1. Create fixtures at various start addresses (1, 10, 100, 500)
2. Select them in Super Controller using different selection modes
3. Move controls (dimmer, color, pan/tilt)
4. Verify the correct DMX channels receive the values
5. Check that UI displays still show 1-based addresses while control uses 0-based indices

## Date Fixed
June 16, 2025

## Build Status
✅ Project builds successfully with no compilation errors after the fix.
