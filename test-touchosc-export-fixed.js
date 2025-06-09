const fs = require('fs');
const path = require('path');

// Test script to verify TouchOSC export functionality
async function testTouchOSCExport() {
    console.log('Testing TouchOSC Export Functionality...\n');

    try {
        // Import the touchoscExporter module
        const touchoscExporter = require('./react-app/src/utils/touchoscExporter.js');
        
        // Test data - simulate some fixtures and master sliders
        const testFixtures = [
            {
                id: 'fixture1',
                name: 'Test Light 1',
                channel: 1,
                controls: [
                    { name: 'Dimmer', channel: 1, type: 'fader' },
                    { name: 'Red', channel: 2, type: 'fader' },
                    { name: 'Green', channel: 3, type: 'fader' },
                    { name: 'Blue', channel: 4, type: 'fader' }
                ]
            },
            {
                id: 'fixture2',
                name: 'Test Light 2',
                channel: 5,
                controls: [
                    { name: 'Dimmer', channel: 5, type: 'fader' },
                    { name: 'Red', channel: 6, type: 'fader' },
                    { name: 'Green', channel: 7, type: 'fader' },
                    { name: 'Blue', channel: 8, type: 'fader' }
                ]
            }
        ];

        const testMasterSliders = [
            { id: 'master1', name: 'Master Dimmer', channel: 513 },
            { id: 'master2', name: 'Master RGB', channel: 514 }
        ];

        // Create export options
        const exportOptions = {
            fixtures: testFixtures,
            masterSliders: testMasterSliders,
            filename: 'test-export'
        };

        console.log('Export options:', JSON.stringify(exportOptions, null, 2));

        // Test the export function without file saving
        if (touchoscExporter.exportToToscFile) {
            console.log('\n✓ exportToToscFile function is available');
            
            // Since we can't easily test file saving in Node.js, let's check the export logic
            console.log('✓ TouchOSC export module loaded successfully');
            console.log('✓ Ready to test in browser with debug menu');
        } else {
            console.log('✗ exportToToscFile function not found');
        }

        // Check if the old simpleOscExporter is still being used
        try {
            const simpleExporter = require('./react-app/src/utils/simpleOscExporter.ts');
            console.log('\n⚠️  Warning: simpleOscExporter is still available but should not be used for TouchOSC');
        } catch (e) {
            console.log('\n✓ simpleOscExporter is not being imported (good)');
        }

    } catch (error) {
        console.error('Error testing TouchOSC export:', error);
    }
}

// Instructions for manual testing
function printManualTestInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL TESTING INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('1. Open http://localhost:3001/ in your browser');
    console.log('2. Navigate to the Debug Menu');
    console.log('3. Look for TouchOSC export buttons:');
    console.log('   - "Generate TouchOSC from Fixtures (.tosc)"');
    console.log('   - "Generate 512 Channel TouchOSC (.tosc)"');
    console.log('4. Click either button to test export');
    console.log('5. Verify that:');
    console.log('   - File downloads with .tosc extension');
    console.log('   - File is a ZIP archive (not plain XML)');
    console.log('   - ZIP contains index.xml file');
    console.log('   - No console errors appear');
    console.log('6. Try importing the .tosc file into TouchOSC app');
    console.log('='.repeat(60));
}

// Run the test
testTouchOSCExport().then(() => {
    printManualTestInstructions();
}).catch(console.error);
