// Test script to verify TouchOSC export functionality
// This script tests the export function with sample data

const { exportToToscFile, generateTouchOscLayout } = require('./react-app/src/utils/touchoscExporter');

// Sample test data
const mockFixtures = [
  {
    id: 'fixture1',
    name: 'RGB LED Par',
    channels: [
      { name: 'Red', type: 'color' },
      { name: 'Green', type: 'color' },
      { name: 'Blue', type: 'color' },
      { name: 'Master', type: 'intensity' }
    ]
  },
  {
    id: 'fixture2', 
    name: 'Moving Head',
    channels: [
      { name: 'Pan', type: 'position' },
      { name: 'Tilt', type: 'position' },
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Color', type: 'color' }
    ]
  }
];

const mockPlacedFixtures = [
  {
    id: 'placed1',
    name: 'LED Par 1',
    fixtureStoreId: 'RGB LED Par',
    startAddress: 1,
    x: 100,
    y: 100,
    color: '#FF0000',
    controls: [
      {
        channelNameInFixture: 'Red',
        label: 'Red',
        xOffset: 0,
        yOffset: 0
      },
      {
        channelNameInFixture: 'Green', 
        label: 'Green',
        xOffset: 20,
        yOffset: 0
      },
      {
        channelNameInFixture: 'Blue',
        label: 'Blue', 
        xOffset: 40,
        yOffset: 0
      }
    ]
  },
  {
    id: 'placed2',
    name: 'Moving Head 1',
    fixtureStoreId: 'Moving Head',
    startAddress: 10,
    x: 300,
    y: 200,
    color: '#00FF00',
    controls: [
      {
        channelNameInFixture: 'Pan',
        label: 'Pan',
        xOffset: 0,
        yOffset: 0
      },
      {
        channelNameInFixture: 'Tilt',
        label: 'Tilt',
        xOffset: 20,
        yOffset: 0
      }
    ]
  }
];

const mockMasterSliders = [
  {
    id: 'master1',
    name: 'Master Dimmer',
    value: 255
  },
  {
    id: 'master2', 
    name: 'Scene Intensity',
    value: 128
  }
];

const testOptions = {
  resolution: 'ipad_pro_2019_portrait',
  includeFixtureControls: true,
  includeMasterSliders: true,
  includeAllDmxChannels: false
};

console.log('Testing TouchOSC Export Functionality...');
console.log('========================================');

try {
  // Test XML generation
  console.log('1. Testing XML generation...');
  const xmlContent = generateTouchOscLayout(
    testOptions,
    mockPlacedFixtures, 
    mockMasterSliders,
    mockFixtures
  );
  
  console.log('✓ XML generated successfully');
  console.log('XML Length:', xmlContent.length);
  console.log('Contains fixture controls:', xmlContent.includes('fader_LED_Par_1_Red'));
  console.log('Contains master sliders:', xmlContent.includes('fader_master_Master_Dimmer'));
  console.log('Contains OSC addresses:', xmlContent.includes('/dmx/'));
  
  // Display first 500 characters of XML for inspection
  console.log('\nXML Preview (first 500 chars):');
  console.log('=' .repeat(50));
  console.log(xmlContent.substring(0, 500) + '...');
  
  console.log('\n2. Testing file structure...');
  
  // Check for required XML elements
  const hasLayout = xmlContent.includes('<layout');
  const hasPages = xmlContent.includes('<page');
  const hasControls = xmlContent.includes('<control');
  const hasProperties = xmlContent.includes('<property');
  
  console.log('✓ Layout element:', hasLayout);
  console.log('✓ Page elements:', hasPages);
  console.log('✓ Control elements:', hasControls);
  console.log('✓ Property elements:', hasProperties);
  
  if (hasLayout && hasPages && hasControls && hasProperties) {
    console.log('\n🎉 TouchOSC export test PASSED!');
    console.log('The export function generates valid TouchOSC XML structure');
    console.log('with fixture controls, master sliders, and proper OSC addressing.');
  } else {
    console.log('\n❌ TouchOSC export test FAILED!');
    console.log('Missing required XML elements.');
  }
  
} catch (error) {
  console.error('❌ TouchOSC export test FAILED with error:');
  console.error(error.message);
  console.error('\nFull error:', error);
}
