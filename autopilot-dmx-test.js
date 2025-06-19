// Quick test script to verify autopilot DMX functionality
// Run this in the browser console while the app is open

console.log('🧪 AUTOPILOT DMX TEST SCRIPT');
console.log('============================');

// Get the store state
const store = window.useStore?.getState?.();

if (!store) {
    console.error('❌ Store not found. Make sure the app is loaded.');
} else {
    console.log('✅ Store found. Testing autopilot DMX updates...');
    
    // Check current state
    console.log('📊 Current autopilot state:');
    console.log('  - Enabled:', store.autopilotTrackEnabled);
    console.log('  - Type:', store.autopilotTrackType);
    console.log('  - Position:', store.autopilotTrackPosition);
    console.log('  - Size:', store.autopilotTrackSize);
    console.log('  - Center X:', store.autopilotTrackCenterX);
    console.log('  - Center Y:', store.autopilotTrackCenterY);
    
    // Check fixtures
    console.log('🎭 Fixtures:');
    console.log('  - Total fixtures:', store.fixtures.length);
    console.log('  - Selected fixtures:', store.selectedFixtures.length);
    
    const panTiltFixtures = store.fixtures.filter(f => 
        f.channels.some(c => c.type.toLowerCase() === 'pan') &&
        f.channels.some(c => c.type.toLowerCase() === 'tilt')
    );
    console.log('  - Fixtures with Pan/Tilt:', panTiltFixtures.length);
    
    if (panTiltFixtures.length > 0) {
        console.log('✅ Pan/Tilt fixtures found:');
        panTiltFixtures.forEach(f => {
            console.log(`    - ${f.name}: Pan=${f.channels.find(c => c.type.toLowerCase() === 'pan')?.dmxAddress}, Tilt=${f.channels.find(c => c.type.toLowerCase() === 'tilt')?.dmxAddress}`);
        });
    } else {
        console.warn('⚠️ No fixtures with Pan/Tilt channels found!');
    }
    
    // Test position update
    if (store.autopilotTrackEnabled) {
        console.log('🔄 Testing position update...');
        const originalPosition = store.autopilotTrackPosition;
        const testPosition = (originalPosition + 10) % 100;
        
        console.log(`   Setting position from ${originalPosition} to ${testPosition}`);
        store.setAutopilotTrackPosition(testPosition);
        
        setTimeout(() => {
            console.log('✅ Position update test completed. Check above for DMX update logs.');
            // Restore original position
            store.setAutopilotTrackPosition(originalPosition);
        }, 1000);
    } else {
        console.log('⚠️ Autopilot not enabled. Enable it first to test DMX updates.');
    }
}

console.log('\n💡 To enable autopilot and test:');
console.log('1. Enable autopilot in the SuperControl panel');
console.log('2. Select some fixtures with Pan/Tilt channels');
console.log('3. Move the position slider or enable auto-play');
console.log('4. Watch console for [STORE] updatePanTiltFromTrack logs');
console.log('5. Check Network tab for /api/dmx/batch requests');
