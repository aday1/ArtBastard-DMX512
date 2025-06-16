// Super Controller DMX Debug Script
// This script helps diagnose why Super Controller movements aren't updating DMX addresses

const axios = require('axios');

class SuperControllerDMXDebugger {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.issues = [];
    this.testResults = {};
  }

  async runFullDiagnostic() {
    console.log('🔍 Super Controller DMX Diagnostic Starting...\n');
    
    try {
      await this.checkBackendConnection();
      await this.checkInitialState();
      await this.testDMXEndpoint();
      await this.testBatchDMXEndpoint();
      await this.checkArtNetConfiguration();
      await this.checkOSCConfiguration();
      await this.testChannelUpdates();
      await this.analyzeIssues();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
    }
  }

  async checkBackendConnection() {
    console.log('1. 🔗 Checking Backend Connection...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/state`);
      if (response.status === 200) {
        console.log('   ✅ Backend connection successful');
        this.testResults.backendConnection = 'OK';
      }
    } catch (error) {
      console.log('   ❌ Backend connection failed:', error.message);
      this.issues.push('Backend not accessible - ensure server is running on port 3000');
      this.testResults.backendConnection = 'FAILED';
    }
  }

  async checkInitialState() {
    console.log('\n2. 📊 Checking Initial System State...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/state`);
      const state = response.data;
      
      console.log(`   • DMX Channels: ${state.dmxChannels ? Object.keys(state.dmxChannels).length : 0}`);
      console.log(`   • Fixtures: ${state.fixtures ? state.fixtures.length : 0}`);
      console.log(`   • MIDI Mappings: ${state.midiMappings ? Object.keys(state.midiMappings).length : 0}`);
      console.log(`   • OSC Enabled: ${state.oscConfig ? state.oscConfig.sendEnabled : 'Unknown'}`);
      
      this.testResults.initialState = state;
      
      // Check for common configuration issues
      if (!state.fixtures || state.fixtures.length === 0) {
        this.issues.push('No fixtures configured - Super Controller needs fixtures to target');
      }
      
      if (state.oscConfig && state.oscConfig.sendEnabled) {
        console.log('   ⚠️  OSC sending is enabled - this might interfere with DMX');
        this.issues.push('OSC sending enabled - may cause confusion between OSC and DMX updates');
      }
      
    } catch (error) {
      console.log('   ❌ Failed to get initial state:', error.message);
      this.issues.push('Cannot retrieve system state');
    }
  }

  async testDMXEndpoint() {
    console.log('\n3. 🎛️ Testing DMX Endpoint...');
    
    // Test individual channel update
    const testChannel = 10;
    const testValue = 128;
    
    try {
      console.log(`   Testing channel ${testChannel} with value ${testValue}...`);
      
      const response = await axios.post(`${this.baseUrl}/api/dmx`, {
        channel: testChannel,
        value: testValue
      });
      
      if (response.data.success) {
        console.log('   ✅ DMX endpoint responded successfully');
        
        // Verify the update took effect
        const stateResponse = await axios.get(`${this.baseUrl}/api/state`);
        const currentValue = stateResponse.data.dmxChannels[testChannel];
        
        if (currentValue === testValue) {
          console.log(`   ✅ DMX channel ${testChannel} updated correctly: ${currentValue}`);
          this.testResults.dmxEndpoint = 'OK';
        } else {
          console.log(`   ❌ DMX channel ${testChannel} not updated. Expected: ${testValue}, Got: ${currentValue}`);
          this.issues.push(`DMX endpoint not updating channels correctly`);
          this.testResults.dmxEndpoint = 'FAILED';
        }
      }
    } catch (error) {
      console.log('   ❌ DMX endpoint test failed:', error.message);
      this.issues.push('DMX endpoint not functioning correctly');
      this.testResults.dmxEndpoint = 'FAILED';
    }
  }

  async testBatchDMXEndpoint() {
    console.log('\n4. 📦 Testing Batch DMX Endpoint...');
    
    const batchUpdates = {
      20: 200,
      21: 150,
      22: 100
    };
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/dmx/batch`, batchUpdates);
      
      if (response.data.success) {
        console.log('   ✅ Batch DMX endpoint responded successfully');
        
        // Verify the updates took effect
        const stateResponse = await axios.get(`${this.baseUrl}/api/state`);
        const dmxChannels = stateResponse.data.dmxChannels;
        
        let allCorrect = true;
        for (const [channel, expectedValue] of Object.entries(batchUpdates)) {
          const actualValue = dmxChannels[parseInt(channel)];
          if (actualValue !== expectedValue) {
            console.log(`   ❌ Channel ${channel}: Expected ${expectedValue}, Got ${actualValue}`);
            allCorrect = false;
          }
        }
        
        if (allCorrect) {
          console.log('   ✅ All batch updates applied correctly');
          this.testResults.batchDMX = 'OK';
        } else {
          this.issues.push('Batch DMX updates not applying correctly');
          this.testResults.batchDMX = 'FAILED';
        }
      }
    } catch (error) {
      console.log('   ❌ Batch DMX endpoint test failed:', error.message);
      this.issues.push('Batch DMX endpoint not functioning');
      this.testResults.batchDMX = 'FAILED';
    }
  }

  async checkArtNetConfiguration() {
    console.log('\n5. 🌐 Checking ArtNet Configuration...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/state`);
      const artNetConfig = response.data.artNetConfig;
      
      if (artNetConfig) {
        console.log(`   • Universe: ${artNetConfig.universe || 'Not set'}`);
        console.log(`   • IP Address: ${artNetConfig.ip || 'Not set'}`);
        console.log(`   • Port: ${artNetConfig.port || 'Not set'}`);
        console.log(`   • Enabled: ${artNetConfig.enabled ? 'Yes' : 'No'}`);
        
        if (!artNetConfig.enabled) {
          this.issues.push('ArtNet is disabled - DMX output will not work');
        }
        
        this.testResults.artNetConfig = artNetConfig;
      } else {
        console.log('   ❌ No ArtNet configuration found');
        this.issues.push('ArtNet not configured');
      }
    } catch (error) {
      console.log('   ❌ Failed to check ArtNet config:', error.message);
    }
  }

  async checkOSCConfiguration() {
    console.log('\n6. 🎵 Checking OSC Configuration...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/state`);
      const oscConfig = response.data.oscConfig;
      
      if (oscConfig) {
        console.log(`   • Send Enabled: ${oscConfig.sendEnabled ? 'Yes' : 'No'}`);
        console.log(`   • Receive Enabled: ${oscConfig.receiveEnabled ? 'Yes' : 'No'}`);
        console.log(`   • Send Port: ${oscConfig.sendPort || 'Not set'}`);
        console.log(`   • Receive Port: ${oscConfig.receivePort || 'Not set'}`);
        console.log(`   • Target IP: ${oscConfig.targetIp || 'Not set'}`);
        
        if (oscConfig.sendEnabled) {
          console.log('   ⚠️  OSC sending is enabled - this sends ADDITIONAL messages, not instead of DMX');
          console.log('   ℹ️  OSC assignments:', response.data.oscAssignments ? Object.keys(response.data.oscAssignments).length + ' channels' : 'None');
        }
        
        this.testResults.oscConfig = oscConfig;
      } else {
        console.log('   ✅ No OSC configuration (this is fine for DMX-only operation)');
      }
    } catch (error) {
      console.log('   ❌ Failed to check OSC config:', error.message);
    }
  }

  async testChannelUpdates() {
    console.log('\n7. 🧪 Testing Channel Update Flow...');
    
    // Simulate Super Controller updates
    const testChannels = [1, 2, 3, 50, 100];
    const testValues = [255, 128, 64, 192, 32];
    
    console.log('   Testing channels that Super Controller might target...');
    
    for (let i = 0; i < testChannels.length; i++) {
      const channel = testChannels[i];
      const value = testValues[i];
      
      try {
        // Send update like Super Controller would
        await axios.post(`${this.baseUrl}/api/dmx`, { channel, value });
        
        // Check if it took effect
        const stateResponse = await axios.get(`${this.baseUrl}/api/state`);
        const actualValue = stateResponse.data.dmxChannels[channel];
        
        if (actualValue === value) {
          console.log(`   ✅ Channel ${channel}: ${value} (SUCCESS)`);
        } else {
          console.log(`   ❌ Channel ${channel}: Expected ${value}, Got ${actualValue} (FAILED)`);
          this.issues.push(`Channel ${channel} update failed`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Channel ${channel}: Update failed - ${error.message}`);
        this.issues.push(`Channel ${channel} update error: ${error.message}`);
      }
    }
  }

  analyzeIssues() {
    console.log('\n8. 🔍 Issue Analysis...');
    
    if (this.issues.length === 0) {
      console.log('   ✅ No major issues detected');
      return;
    }
    
    console.log(`   Found ${this.issues.length} potential issues:`);
    this.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    // Analyze patterns
    const hasBackendIssues = this.issues.some(issue => 
      issue.includes('Backend') || issue.includes('endpoint'));
    const hasConfigIssues = this.issues.some(issue => 
      issue.includes('ArtNet') || issue.includes('OSC'));
    const hasChannelIssues = this.issues.some(issue => 
      issue.includes('Channel') || issue.includes('update'));
    
    console.log('\n   📊 Issue Categories:');
    if (hasBackendIssues) console.log('   • Backend/API Issues');
    if (hasConfigIssues) console.log('   • Configuration Issues'); 
    if (hasChannelIssues) console.log('   • Channel Update Issues');
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUPER CONTROLLER DMX DIAGNOSTIC REPORT');
    console.log('='.repeat(60));
    
    console.log('\n🔧 SYSTEM STATUS:');
    console.log(`Backend Connection: ${this.testResults.backendConnection || 'Unknown'}`);
    console.log(`DMX Endpoint: ${this.testResults.dmxEndpoint || 'Unknown'}`);
    console.log(`Batch DMX: ${this.testResults.batchDMX || 'Unknown'}`);
    
    if (this.testResults.artNetConfig) {
      console.log(`ArtNet Enabled: ${this.testResults.artNetConfig.enabled ? 'Yes' : 'No'}`);
    }
    
    if (this.testResults.oscConfig) {
      console.log(`OSC Send Enabled: ${this.testResults.oscConfig.sendEnabled ? 'Yes' : 'No'}`);
    }
    
    console.log('\n🚨 IDENTIFIED ISSUES:');
    if (this.issues.length === 0) {
      console.log('✅ No issues found - Super Controller should be working correctly');
      console.log('\n💡 If Super Controller still isn\'t working:');
      console.log('1. Check that fixtures are properly configured');
      console.log('2. Verify channel selection mode in Super Controller');
      console.log('3. Ensure you have channels/fixtures selected');
      console.log('4. Check browser console for JavaScript errors');
    } else {
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      
      if (this.issues.some(i => i.includes('Backend'))) {
        console.log('• Start the backend server: npm start');
      }
      
      if (this.issues.some(i => i.includes('ArtNet'))) {
        console.log('• Enable ArtNet in settings and configure IP/universe');
      }
      
      if (this.issues.some(i => i.includes('endpoint'))) {
        console.log('• Check backend logs for API errors');
        console.log('• Verify CORS settings if running on different ports');
      }
      
      if (this.issues.some(i => i.includes('fixtures'))) {
        console.log('• Add fixtures in the Fixtures page');
        console.log('• Set proper DMX start addresses for fixtures');
      }
    }
    
    console.log('\n📞 NEXT STEPS:');
    console.log('1. Address any issues listed above');
    console.log('2. Test Super Controller with a simple fixture');
    console.log('3. Monitor backend console for error messages');
    console.log('4. Use browser dev tools to check network requests');
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the diagnostic
const dmxDebugger = new SuperControllerDMXDebugger();
dmxDebugger.runFullDiagnostic();
