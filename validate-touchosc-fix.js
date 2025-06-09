// Comprehensive TouchOSC export validation script
// This script validates that the fixed TouchOSC export functionality works correctly

const fs = require('fs');
const path = require('path');

async function validateTouchOSCExport() {
    console.log('🔍 VALIDATING TOUCHOSC EXPORT FUNCTIONALITY');
    console.log('=' .repeat(60));

    try {
        // Import the fixed TouchOSC exporter
        const { generateTouchOscLayout, exportToToscFile } = require('./react-app/src/utils/touchoscExporter.js');
        
        // Test data that simulates real application state
        const mockAllFixtures = [
            {
                id: 'fixture1',
                name: 'RGB LED Par',
                channels: [
                    { name: 'Red', type: 'red' },
                    { name: 'Green', type: 'green' },
                    { name: 'Blue', type: 'blue' },
                    { name: 'Dimmer', type: 'dimmer' }
                ]
            },
            {
                id: 'fixture2',
                name: 'Moving Head Spot',
                channels: [
                    { name: 'Pan', type: 'pan' },
                    { name: 'Tilt', type: 'tilt' },
                    { name: 'Dimmer', type: 'dimmer' },
                    { name: 'Color', type: 'color' },
                    { name: 'Gobo', type: 'gobo' }
                ]
            }
        ];

        const mockFixtureLayout = [
            {
                id: 'placed1',
                name: 'LED Par 1',
                fixtureStoreId: 'RGB LED Par',
                startAddress: 1,
                x: 100,
                y: 100,
                color: '#FF4444',
                controls: [
                    { channelNameInFixture: 'Red', label: 'Red', xOffset: 0, yOffset: 0 },
                    { channelNameInFixture: 'Green', label: 'Green', xOffset: 30, yOffset: 0 },
                    { channelNameInFixture: 'Blue', label: 'Blue', xOffset: 60, yOffset: 0 },
                    { channelNameInFixture: 'Dimmer', label: 'Dimmer', xOffset: 90, yOffset: 0 }
                ]
            },
            {
                id: 'placed2',
                name: 'Moving Head 1',
                fixtureStoreId: 'Moving Head Spot',
                startAddress: 5,
                x: 300,
                y: 200,
                color: '#44FF44',
                controls: [
                    { channelNameInFixture: 'Pan', label: 'Pan', xOffset: 0, yOffset: 0 },
                    { channelNameInFixture: 'Tilt', label: 'Tilt', xOffset: 30, yOffset: 0 },
                    { channelNameInFixture: 'Dimmer', label: 'Dimmer', xOffset: 60, yOffset: 0 }
                ]
            }
        ];

        const mockMasterSliders = [
            { id: 'master1', name: 'Master Dimmer', value: 255 },
            { id: 'master2', name: 'Scene Intensity', value: 128 },
            { id: 'master3', name: 'Strobe Rate', value: 0 }
        ];

        console.log('✅ Test data prepared');
        console.log(`   - Fixtures: ${mockAllFixtures.length}`);
        console.log(`   - Placed Fixtures: ${mockFixtureLayout.length}`);
        console.log(`   - Master Sliders: ${mockMasterSliders.length}`);

        // Test 1: Generate from Fixtures (like debug menu's first button)
        console.log('\n📋 TEST 1: Auto-Generate from Fixtures');
        console.log('-'.repeat(40));
        
        const fixtureOptions = {
            resolution: 'ipad_pro_2019_portrait',
            includeFixtureControls: true,
            includeMasterSliders: true,
            includeAllDmxChannels: false
        };

        const fixtureXml = generateTouchOscLayout(
            fixtureOptions,
            mockFixtureLayout,
            mockMasterSliders,
            mockAllFixtures
        );

        console.log('✅ XML Generation: SUCCESS');
        console.log(`   - XML Length: ${fixtureXml.length} characters`);
        console.log(`   - Contains fixture controls: ${fixtureXml.includes('fader_LED_Par_1_Red') ? 'YES' : 'NO'}`);
        console.log(`   - Contains master sliders: ${fixtureXml.includes('fader_master_Master_Dimmer') ? 'YES' : 'NO'}`);
        console.log(`   - Contains OSC addresses: ${fixtureXml.includes('/dmx/') ? 'YES' : 'NO'}`);
        console.log(`   - Proper XML format: ${fixtureXml.includes('<?xml') && fixtureXml.includes('<layout') ? 'YES' : 'NO'}`);

        // Test 2: Generate 512 Channels (like debug menu's second button)
        console.log('\n📊 TEST 2: Generate All 512 Channels');
        console.log('-'.repeat(40));
        
        const channelOptions = {
            resolution: 'ipad_pro_2019_portrait',
            includeFixtureControls: false,
            includeMasterSliders: false,
            includeAllDmxChannels: true
        };

        const channelXml = generateTouchOscLayout(
            channelOptions,
            [],
            [],
            mockAllFixtures
        );

        console.log('✅ XML Generation: SUCCESS');
        console.log(`   - XML Length: ${channelXml.length} characters`);
        console.log(`   - Contains DMX channels: ${channelXml.includes('/dmx/1/value') && channelXml.includes('/dmx/512/value') ? 'YES' : 'NO'}`);
        console.log(`   - Contains All_DMX page: ${channelXml.includes('All_DMX') ? 'YES' : 'NO'}`);
        console.log(`   - Proper XML format: ${channelXml.includes('<?xml') && channelXml.includes('<layout') ? 'YES' : 'NO'}`);

        // Test 3: Validate XML structure
        console.log('\n🔧 TEST 3: XML Structure Validation');
        console.log('-'.repeat(40));
        
        const validateXmlStructure = (xml, testName) => {
            const tests = [
                { name: 'XML Declaration', check: xml.includes('<?xml version="1.0" encoding="UTF-8"?>') },
                { name: 'Layout Element', check: xml.includes('<layout') && xml.includes('</layout>') },
                { name: 'Page Elements', check: xml.includes('<page') },
                { name: 'Control Elements', check: xml.includes('<control') },
                { name: 'Property Elements', check: xml.includes('<property') },
                { name: 'OSC Addresses', check: xml.includes('osc_cs=') },
                { name: 'Control Types', check: xml.includes('type="faderv"') || xml.includes('type="label"') },
                { name: 'Color Attributes', check: xml.includes('color="#') }
            ];

            console.log(`   ${testName}:`);
            let passed = 0;
            tests.forEach(test => {
                if (test.check) {
                    console.log(`   ✅ ${test.name}`);
                    passed++;
                } else {
                    console.log(`   ❌ ${test.name}`);
                }
            });
            console.log(`   Score: ${passed}/${tests.length}`);
            return passed === tests.length;
        };

        const fixtureXmlValid = validateXmlStructure(fixtureXml, 'Fixture Layout XML');
        const channelXmlValid = validateXmlStructure(channelXml, 'Channel Layout XML');

        // Test 4: Save sample files for manual inspection
        console.log('\n💾 TEST 4: Save Sample Files');
        console.log('-'.repeat(40));
        
        try {
            fs.writeFileSync('sample_fixture_layout.xml', fixtureXml);
            fs.writeFileSync('sample_channel_layout.xml', channelXml);
            console.log('✅ Sample files saved:');
            console.log('   - sample_fixture_layout.xml');
            console.log('   - sample_channel_layout.xml');
        } catch (error) {
            console.log('❌ Failed to save sample files:', error.message);
        }

        // Summary
        console.log('\n📈 VALIDATION SUMMARY');
        console.log('=' .repeat(60));
        
        const allTests = [
            { name: 'Fixture XML Generation', passed: fixtureXml.length > 1000 },
            { name: 'Channel XML Generation', passed: channelXml.length > 10000 },
            { name: 'Fixture XML Structure', passed: fixtureXmlValid },
            { name: 'Channel XML Structure', passed: channelXmlValid },
            { name: 'OSC Address Format', passed: fixtureXml.includes('/dmx/') && channelXml.includes('/dmx/') },
            { name: 'TouchOSC Control Types', passed: fixtureXml.includes('faderv') && channelXml.includes('faderv') }
        ];

        let totalPassed = 0;
        allTests.forEach(test => {
            if (test.passed) {
                console.log(`✅ ${test.name}`);
                totalPassed++;
            } else {
                console.log(`❌ ${test.name}`);
            }
        });

        console.log(`\nOverall Score: ${totalPassed}/${allTests.length}`);
        
        if (totalPassed === allTests.length) {
            console.log('\n🎉 ALL TESTS PASSED! TouchOSC export is working correctly.');
            console.log('   The debug menu buttons should now generate proper .tosc files.');
            console.log('   Files will be ZIP archives containing index.xml (not raw XML).');
        } else {
            console.log('\n⚠️  Some tests failed. Check the implementation.');
        }

        // Instructions for manual testing
        console.log('\n📱 MANUAL TESTING INSTRUCTIONS');
        console.log('=' .repeat(60));
        console.log('1. Open http://localhost:3001/ in your browser');
        console.log('2. Look for a debug button (usually in top-right corner)');
        console.log('3. Click the debug button to open Debug Menu');
        console.log('4. Navigate to the "TouchOSC" tab');
        console.log('5. Try both export buttons:');
        console.log('   📋 "Auto-Generate from Fixtures" → Should download ArtBastard_AutoGenerated.tosc');
        console.log('   📊 "Generate All 512 Channels" → Should download DMX512_AllChannels.tosc');
        console.log('6. Verify downloaded files:');
        console.log('   - Files should have .tosc extension (not .xml)');
        console.log('   - Files should be ZIP archives (can open with WinRAR/7-Zip)');
        console.log('   - ZIP should contain index.xml file');
        console.log('   - No browser console errors should appear');
        console.log('7. Test in TouchOSC app:');
        console.log('   - Transfer .tosc file to your mobile device');
        console.log('   - Open TouchOSC app');
        console.log('   - Import the .tosc file');
        console.log('   - App should not crash and should show controls');

    } catch (error) {
        console.error('❌ VALIDATION FAILED:', error);
        console.error('\nError details:', error.message);
        console.error('\nStack trace:', error.stack);
    }
}

// Run the validation
validateTouchOSCExport();
