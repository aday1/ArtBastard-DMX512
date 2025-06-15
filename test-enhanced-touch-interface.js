#!/usr/bin/env node

/**
 * Enhanced Touch DMX Interface with Panel Management - Complete Test Suite
 * Tests scrolling fixes and new panel management features
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3334;

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'react-app', 'dist')));

// Mock DMX API endpoints for testing
app.use(express.json());

// Initialize mock DMX data with varied test values
let dmxChannels = new Array(512).fill(0);

// Set test data across different ranges for comprehensive testing
dmxChannels[0] = 128;    // Channel 1
dmxChannels[1] = 255;    // Channel 2
dmxChannels[2] = 64;     // Channel 3
dmxChannels[3] = 192;    // Channel 4
dmxChannels[16] = 96;    // Channel 17
dmxChannels[17] = 160;   // Channel 18
dmxChannels[32] = 32;    // Channel 33
dmxChannels[33] = 224;   // Channel 34
dmxChannels[64] = 48;    // Channel 65
dmxChannels[65] = 176;   // Channel 66
dmxChannels[128] = 80;   // Channel 129
dmxChannels[129] = 144;  // Channel 130
dmxChannels[256] = 112;  // Channel 257
dmxChannels[257] = 208;  // Channel 258

console.log('✓ Test DMX data initialized with values across all channel ranges');

app.get('/api/dmx/channels', (req, res) => {
  res.json({ channels: dmxChannels });
});

app.post('/api/dmx/:channel', (req, res) => {
  const channel = parseInt(req.params.channel);
  const { value } = req.body;
  
  if (channel >= 0 && channel < 512 && value >= 0 && value <= 255) {
    dmxChannels[channel] = value;
    console.log(`✓ Channel ${channel + 1} set to ${value}`);
    res.json({ success: true, channel, value });
  } else {
    res.status(400).json({ error: 'Invalid channel or value' });
  }
});

app.post('/api/dmx/batch', (req, res) => {
  const { channels } = req.body;
  
  if (!Array.isArray(channels)) {
    return res.status(400).json({ error: 'Channels must be an array' });
  }
  
  let updated = 0;
  channels.forEach(({ channel, value }) => {
    if (channel >= 0 && channel < 512 && value >= 0 && value <= 255) {
      dmxChannels[channel] = value;
      updated++;
    }
  });
  
  console.log(`✓ Batch update: ${updated} channels updated`);
  res.json({ success: true, updated });
});

// Serve main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-app', 'dist', 'index.html'));
});

const server = app.listen(port, () => {
  console.log('\n🎛️  ENHANCED TOUCH DMX INTERFACE - COMPLETE TEST SUITE');
  console.log('======================================================');
  console.log(`✓ Server running at: http://localhost:${port}`);
  console.log(`✓ DMX channels initialized with comprehensive test data`);
  console.log(`✓ Test channels across all ranges: 1-16, 17-32, 33-64, 65-128, 129-256, 257-512`);
  
  console.log('\n🔧 NEW FEATURES IMPLEMENTED:');
  console.log('============================');
  console.log('✅ Fixed touch scrolling when controls are visible');
  console.log('✅ Added TouchPanelManager for panel resize/add/remove/save');
  console.log('✅ Proper touch event handling with pan-y when controls shown');
  console.log('✅ Non-blocking header design');
  console.log('✅ Enhanced panel management with saved layouts');
  console.log('✅ Touch-optimized modal interface');
  
  console.log('\n📱 TOUCH INTERFACE TESTING GUIDE:');
  console.log('=================================');
  console.log('1. Open external monitor window');
  console.log('2. Navigate to Touch DMX Control Panel');
  console.log('3. Test SCROLLING FIXES:');
  console.log('   • Show controls → try scrolling channel grid');
  console.log('   • Hide controls → verify improved scrolling');
  console.log('   • Test with different page sizes (1, 4, 8, 16 channels)');
  console.log('   • Test across different channel ranges');
  console.log('');
  console.log('4. Test PANEL MANAGER (NEW):');
  console.log('   • Look for ⚙️ button in top-right corner');
  console.log('   • Tap to open Touch Panel Manager');
  console.log('   • Test current panel status display');
  console.log('   • Try saving current layout');
  console.log('   • Test loading saved layouts');
  console.log('   • Test removing individual components');
  console.log('   • Test "Clear All" functionality');
  
  console.log('\n🧪 COMPREHENSIVE TEST SCENARIOS:');
  console.log('================================');
  console.log('A. SCROLLING VALIDATION:');
  console.log('   1. Load "All Channels" filter (512 channels)');
  console.log('   2. Set to 4 channels per page → should create 128 pages');
  console.log('   3. With controls visible: swipe/scroll down on channel grid');
  console.log('   4. Hide controls: verify smoother scrolling');
  console.log('   5. Test different channel ranges with scrolling');
  console.log('');
  console.log('B. PANEL MANAGEMENT VALIDATION:');
  console.log('   1. Open ⚙️ Panel Manager');
  console.log('   2. Verify current components are listed');
  console.log('   3. Save layout with name "Test Layout 1"');
  console.log('   4. Remove a component');
  console.log('   5. Load "Test Layout 1" → verify component restored');
  console.log('   6. Test "Clear All" → verify all components removed');
  console.log('   7. Add components from main window via drag-drop');
  console.log('   8. Save new layout and test loading');
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log('====================');
  console.log('✓ Channel grid scrolls smoothly when controls are visible');
  console.log('✓ TouchPanelManager opens/closes correctly');
  console.log('✓ Current panel status shows accurate component count');
  console.log('✓ Layout save/load functionality works');
  console.log('✓ Individual component removal works');
  console.log('✓ Clear All removes all components');
  console.log('✓ Panel manager modal is touch-optimized');
  console.log('✓ Touch interactions feel responsive');
  
  console.log('\n📊 TEST DATA OVERVIEW:');
  console.log('======================');
  console.log('• Channels 1-4: Values 128, 255, 64, 192');
  console.log('• Channels 17-18: Values 96, 160');
  console.log('• Channels 33-34: Values 32, 224');
  console.log('• Channels 65-66: Values 48, 176');
  console.log('• Channels 129-130: Values 80, 144');
  console.log('• Channels 257-258: Values 112, 208');
  console.log('• Total active channels: 14');
  
  console.log('\n🚀 QUICK START:');
  console.log('===============');
  console.log('1. Open main app → External Monitor → Touch DMX Control');
  console.log('2. Test scrolling with controls shown/hidden');
  console.log('3. Open ⚙️ Panel Manager to test new features');
  console.log('4. Save/load layouts to verify persistence');
  
  console.log('\nPress Ctrl+C to stop the server');
  console.log('==================================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Enhanced Touch DMX Test Server...');
  server.close(() => {
    console.log('✓ Server stopped');
    process.exit(0);
  });
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please stop other servers or use a different port.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
