# State Import & Offline Start Fixes

## Issues Fixed

### 1. State Import Failure
**Problem**: "Failed to apply imported state" error when trying to import saved state files.

**Root Cause**: The backend API endpoints for importing state (`/api/state`, `/api/scenes`, `/api/config` with POST methods) were missing.

**Solution**: 
- Added missing API endpoints in `src/api.ts`:
  - `POST /api/state` - Imports DMX channel state
  - `POST /api/scenes` - Imports scene data
  - `POST /api/config` - Imports configuration data
- Each endpoint validates input data and provides detailed error messages
- State import now saves to `last-state.json` and notifies all connected clients
- Added comprehensive error handling in frontend import process

### 2. Data Loss After Restart
**Problem**: Users lost all their work after ArtBastard restarted.

**Root Cause**: State restoration was working but had no backup mechanism, and import failures weren't handled gracefully.

**Solution**:
- Enhanced state restoration in `src/server.ts` to create automatic backups
- Added backup files with timestamps (`last-state-backup-{timestamp}.json`)
- Improved error handling and logging for state restoration
- Added validation for DMX channel data before restoration

### 3. Offline Start Preference
**Problem**: Application didn't prefer offline mode when possible, causing slower startup times.

**Root Cause**: Startup scripts always tried online mode first, even when offline mode would be faster.

**Solution**:
- Modified `start.ps1` to always prefer offline mode for faster startup
- Changed network connectivity check to prefer offline even when online
- Updated npm install logic to use `--prefer-offline` by default
- Added fallback to online mode only when offline fails

## Technical Details

### New API Endpoints

#### POST /api/state
```javascript
// Imports DMX channel state
{
  "dmxChannels": [0, 255, 128, ...] // Array of 512 DMX values
}
```

#### POST /api/scenes
```javascript
// Imports scene data
[
  {
    "name": "Scene Name",
    "oscAddress": "/scene/1",
    "state": [0, 255, 128, ...]
  }
]
```

#### POST /api/config
```javascript
// Imports configuration
{
  "midiMappings": {...},
  "oscAssignments": [...],
  "artNetConfig": {...}
}
```

### Backup System
- Automatic backups created before state restoration
- Backup files stored in `data/` directory with timestamps
- Prevents data loss during import/restore operations

### Offline Mode Improvements
- Always prefer offline npm installs for faster startup
- Fallback to online only when offline fails
- Clear messaging about offline preference

## Usage

### Importing State
1. Go to Settings → State Management
2. Click "Import State File"
3. Select your exported state file
4. State will be imported and applied automatically
5. Check console for detailed import status

### Automatic State Restoration
- State is automatically restored on server startup
- Backups are created before restoration
- Detailed logging shows restoration progress

### Offline Startup
- Run `start.ps1` as usual
- Script will prefer offline mode automatically
- Faster startup times when dependencies are cached

## Error Handling

### Import Errors
- Detailed error messages for each import step
- Partial imports continue even if some parts fail
- User notifications for each success/failure

### State Restoration Errors
- Graceful fallback if restoration fails
- Detailed logging for troubleshooting
- Automatic backup creation prevents data loss

## Files Modified

1. `src/api.ts` - Added missing API endpoints
2. `src/server.ts` - Enhanced state restoration with backups
3. `react-app/src/components/settings/Settings.tsx` - Improved import error handling
4. `start.ps1` - Implemented offline preference

## Testing

To test the fixes:

1. **State Import**: Export a state file, restart ArtBastard, then import the file
2. **Data Loss Prevention**: Restart ArtBastard multiple times - state should persist
3. **Offline Startup**: Run `start.ps1` and verify it prefers offline mode

## Benefits

✅ **No More Import Failures**: State import now works reliably  
✅ **Data Loss Prevention**: Automatic backups prevent data loss  
✅ **Faster Startup**: Offline mode preference reduces startup time  
✅ **Better Error Handling**: Clear error messages for troubleshooting  
✅ **Robust Restoration**: Enhanced state restoration with validation
