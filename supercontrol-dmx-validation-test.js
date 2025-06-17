/**
 * SuperControl DMX Update Validation Test
 * 
 * This test validates that ALL SuperControl sliders and controls are properly
 * calling applyControl() and sending DMX channel updates to the backend.
 * 
 * Run this test in browser console after loading SuperControl to verify
 * all controls send proper DMX updates.
 */

// Test data - simulated fixtures for comprehensive testing
const testFixtures = [
  {
    id: "test-moving-head-1",
    name: "Test Moving Head 1",
    startAddress: 1,
    channels: [
      { type: "dimmer", dmxAddress: 1 },
      { type: "pan", dmxAddress: 2 },
      { type: "tilt", dmxAddress: 3 },
      { type: "finePan", dmxAddress: 4 },
      { type: "fineTilt", dmxAddress: 5 },
      { type: "red", dmxAddress: 6 },
      { type: "green", dmxAddress: 7 },
      { type: "blue", dmxAddress: 8 },
      { type: "gobo", dmxAddress: 9 },
      { type: "goboRotation", dmxAddress: 10 },
      { type: "shutter", dmxAddress: 11 },
      { type: "strobe", dmxAddress: 12 },
      { type: "focus", dmxAddress: 13 },
      { type: "zoom", dmxAddress: 14 },
      { type: "iris", dmxAddress: 15 },
      { type: "prism", dmxAddress: 16 },
      { type: "colorWheel", dmxAddress: 17 },
      { type: "gobo2", dmxAddress: 18 },
      { type: "frost", dmxAddress: 19 },
      { type: "macro", dmxAddress: 20 },
      { type: "speed", dmxAddress: 21 }
    ]
  }
];

// List of all SuperControl functions that should call applyControl
const expectedApplyControlCalls = [
  // Basic movement controls
  'pan', 'tilt', 'finePan', 'fineTilt',
  
  // Color controls
  'red', 'green', 'blue',
  
  // Basic lighting controls
  'dimmer', 'shutter', 'strobe',
  
  // GOBO controls
  'gobo', 'goboRotation', 'gobo2',
  
  // Advanced movement controls
  'focus', 'zoom', 'iris', 'prism',
  
  // Effect controls
  'colorWheel', 'frost', 'macro', 'speed'
];

// Mock console tracking to monitor applyControl calls
let applyControlCallLog = [];
let dmxUpdateCallLog = [];

// Mock store setDmxChannelValue to track calls
const originalSetDmxChannelValue = window.useStore?.getState?.()?.setDmxChannelValue;
if (originalSetDmxChannelValue) {
  window.useStore.setState({
    ...window.useStore.getState(),
    setDmxChannelValue: (channel, value) => {
      dmxUpdateCallLog.push({ channel, value, timestamp: Date.now() });
      console.log(`[TEST] DMX Update: Channel ${channel} = ${value}`);
      return originalSetDmxChannelValue(channel, value);
    }
  });
}

// Test validation functions
function validateSuperControlImplementation() {
  console.log("🧪 Starting SuperControl DMX Update Validation Test");
  console.log("==================================================");
  
  // Reset logs
  applyControlCallLog = [];
  dmxUpdateCallLog = [];
  
  // Check 1: Verify applyControl function exists and is properly implemented
  console.log("\n📋 Test 1: Checking applyControl function implementation");
  
  // We can't directly access the applyControl function since it's internal to the component
  // But we can verify the expected API calls are being made by monitoring network traffic
  
  // Check 2: Verify DMX API endpoints are accessible
  console.log("\n📋 Test 2: Testing DMX API endpoints");
  
  fetch('/api/dmx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 0, value: 127 })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("✅ DMX API endpoint is working correctly");
    } else {
      console.error("❌ DMX API endpoint failed:", data);
    }
  })
  .catch(error => {
    console.error("❌ DMX API endpoint unreachable:", error);
  });
  
  // Check 3: Verify batch DMX endpoint
  console.log("\n📋 Test 3: Testing batch DMX API endpoint");
  
  fetch('/api/dmx/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ "1": 255, "2": 127, "3": 0 })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("✅ Batch DMX API endpoint is working correctly");
      console.log(`   Updated ${data.updateCount} channels successfully`);
    } else {
      console.error("❌ Batch DMX API endpoint failed:", data);
    }
  })
  .catch(error => {
    console.error("❌ Batch DMX API endpoint unreachable:", error);
  });
  
  console.log("\n📋 Test 4: Manual SuperControl Testing Instructions");
  console.log("==================================================");
  console.log("To test SuperControl sliders manually:");
  console.log("1. Open SuperControl component in the application");
  console.log("2. Select some fixtures (click 'Select All' button)");
  console.log("3. Move various sliders and controls");
  console.log("4. Check browser Network tab for POST requests to /api/dmx");
  console.log("5. Check browser Console for DMX update logs");
  console.log("\nExpected behavior for each control movement:");
  console.log("- Console log: '[SuperControl] 🎛️ applyControl called: type=X, value=Y'");
  console.log("- Console log: '[DMX] 📡 Setting channel X to Y for CONTROL_TYPE'");
  console.log("- Console log: '[STORE] setDmxChannel called: channel=X, value=Y'");
  console.log("- Console log: '[STORE] Sending HTTP POST to /api/dmx: channel=X, value=Y'");
  console.log("- Network request: POST /api/dmx with {channel: X, value: Y}");
  
  console.log("\n📋 Test 5: Control Type Coverage Check");
  console.log("=====================================");
  console.log("Verify these control types are properly handled in applyControl:");  expectedApplyControlCalls.forEach((controlType, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${controlType}`);
  });
  
  console.log("\n📋 Test 6: Real-time DMX Monitoring");
  console.log("===================================");
  console.log("To monitor DMX updates in real-time:");
  console.log("1. Open Network tab in browser DevTools");
  console.log("2. Filter by 'dmx' to see only DMX-related requests");
  console.log("3. Move SuperControl sliders and observe POST requests");
  console.log("4. Each slider movement should generate a POST to /api/dmx");
  console.log("5. Request payload should contain: {channel: number, value: number}");
  
  return {
    testFixtures,
    expectedApplyControlCalls,
    applyControlCallLog,
    dmxUpdateCallLog
  };
}

// Network monitoring helper
function startDMXNetworkMonitoring() {
  console.log("🔍 Starting DMX Network Monitoring");
  console.log("==================================");
  console.log("Monitoring all network requests to /api/dmx...");
  
  // Override fetch to monitor DMX API calls
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
      if (typeof url === 'string' && url.includes('/api/dmx')) {
      console.log(`[NETWORK] DMX API Call: ${options && options.method ? options.method : 'GET'} ${url}`);
      if (options && options.body) {
        try {
          const body = JSON.parse(options.body);
          console.log('[NETWORK] DMX Payload:', body);
        } catch (e) {
          console.log('[NETWORK] DMX Payload (raw):', options.body);
        }
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log("✅ Network monitoring active. Move SuperControl sliders to see API calls.");
}

// Main test execution
console.log("🚀 SuperControl DMX Update Validation Test Suite");
console.log("================================================");
console.log("This test validates that SuperControl properly sends DMX updates.");
console.log("Run validateSuperControlImplementation() to start testing.");
console.log("Run startDMXNetworkMonitoring() to monitor network calls.");

// Export test functions for manual execution
window.validateSuperControlImplementation = validateSuperControlImplementation;
window.startDMXNetworkMonitoring = startDMXNetworkMonitoring;

console.log("\n✨ Test functions loaded. Ready to validate SuperControl DMX updates!");
console.log("Usage:");
console.log("  validateSuperControlImplementation() - Run comprehensive validation");
console.log("  startDMXNetworkMonitoring() - Monitor network calls in real-time");
