import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import { sendTestNoteOnMessage, sendTestCCMessage, testMidiLearnWorkflow } from '../../hooks/useMidiTestUtils';
import { exportToToscFile, ExportOptions } from '../../utils/touchoscExporter';
import { exportCrashProofToscFile, FixedExportOptions } from '../../utils/touchoscFixedExporter';
import styles from './DebugMenu.module.scss';

interface DebugMenuProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'embedded';
}

interface SystemInfo {
  timestamp: string;
  userAgent: string;
  currentUrl: string;
  nodeEnv: string;
  webMidiSupported: boolean;
  socketIOAvailable: boolean;
  reactVersion: string;
  documentReadyState: string;
  windowLoaded: boolean;
  errors: any[];
  memoryUsage?: any;
  performance?: any;
}

interface OscTestMessage {
  address: string;
  args: Array<{ type: string; value: any }>;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'midi' | 'osc' | 'dmx' | 'touchosc'>('system');
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({} as SystemInfo);
  const [oscTestAddress, setOscTestAddress] = useState('/dmx/channel/1');
  const [oscTestValue, setOscTestValue] = useState('127');  const [dmxTestChannel, setDmxTestChannel] = useState('1');
  const [dmxTestValue, setDmxTestValue] = useState('255');
  const [touchOscGenerating, setTouchOscGenerating] = useState(false);
  const [showNetworkPanel, setShowNetworkPanel] = useState(false);const { 
    midiMessages, 
    midiMappings, 
    midiLearnTarget,
    allFixtures,
    fixtureLayout,
    masterSliders,
    dmxChannels,
    setDmxChannel,
    debugTools
  } = useStore(state => ({
    midiMessages: state.midiMessages,
    midiMappings: state.midiMappings,
    midiLearnTarget: state.midiLearnTarget,
    allFixtures: state.fixtures,
    fixtureLayout: state.fixtureLayout,
    masterSliders: state.masterSliders,
    dmxChannels: state.dmxChannels,
    setDmxChannel: state.setDmxChannel,
    debugTools: state.debugTools
  }));

  const { socket, connected } = useSocket();

  useEffect(() => {
    const updateSystemInfo = () => {
      const memInfo = (performance as any).memory || {};
      setSystemInfo({
        timestamp: new Date().toLocaleTimeString(),
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        webMidiSupported: 'navigator' in window && 'requestMIDIAccess' in navigator,
        socketIOAvailable: typeof window !== 'undefined' && 'io' in window,
        reactVersion: React.version,
        documentReadyState: document.readyState,
        windowLoaded: document.readyState === 'complete',
        errors: (window as any).__reactErrors || [],
        memoryUsage: {
          usedJSHeapSize: memInfo.usedJSHeapSize,
          totalJSHeapSize: memInfo.totalJSHeapSize,
          jsHeapSizeLimit: memInfo.jsHeapSizeLimit
        },
        performance: {
          navigation: performance.navigation?.type,
          timing: performance.timing ? {
            loadEventEnd: performance.timing.loadEventEnd,
            navigationStart: performance.timing.navigationStart
          } : null
        }
      });
    };

    updateSystemInfo();
    const interval = setInterval(updateSystemInfo, 2000);    // Listen for errors
    const errorHandler = (event: ErrorEvent) => {
      if (!(window as any).__reactErrors) {
        (window as any).__reactErrors = [];
      }
      (window as any).__reactErrors.push({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('error', errorHandler);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('error', errorHandler);
    };
  }, [connected]); // Add connected dependency

  // OSC Test Functions
  const sendOscTestMessage = () => {
    if (!socket || !connected) {
      alert('Socket not connected!');
      return;
    }

    try {
      const message: OscTestMessage = {
        address: oscTestAddress,
        args: [{ type: 'f', value: parseFloat(oscTestValue) }]
      };
      
      socket.emit('oscSend', message);
      console.log('OSC test message sent:', message);
      alert(`OSC message sent to ${oscTestAddress} with value ${oscTestValue}`);
    } catch (error) {
      console.error('Error sending OSC message:', error);
      alert('Error sending OSC message: ' + error);
    }
  };

  const requestOscTestMessage = () => {
    if (!socket || !connected) {
      alert('Socket not connected!');
      return;
    }

    socket.emit('oscRequestTest', { address: oscTestAddress });
    console.log('OSC test message requested for:', oscTestAddress);
    alert(`OSC test message requested for ${oscTestAddress}`);
  };

  // DMX Test Functions
  const sendDmxTestMessage = () => {
    const channel = parseInt(dmxTestChannel, 10);
    const value = parseInt(dmxTestValue, 10);

    if (isNaN(channel) || channel < 1 || channel > 512) {
      alert('Invalid DMX channel! Must be 1-512');
      return;
    }

    if (isNaN(value) || value < 0 || value > 255) {
      alert('Invalid DMX value! Must be 0-255');
      return;
    }

    // Use store's setDmxChannel to update the DMX value (convert to 0-based channel)
    setDmxChannel(channel - 1, value);
    console.log(`DMX channel ${channel} set to ${value}`);
    alert(`DMX channel ${channel} set to ${value}`);
  };
  // TouchOSC Generation Functions
  const generateFromFixtures = async () => {
    setTouchOscGenerating(true);
    try {
      // Use proper TouchOSC exporter with correct options
      const options: ExportOptions = {
        resolution: 'ipad_pro_2019_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false
      };

      const result = await exportToToscFile(
        options,
        fixtureLayout,      // placedFixtures
        masterSliders,      // masterSliders
        allFixtures,        // allFixtures
        'ArtBastard_AutoGenerated.tosc'
      );

      if (result.success) {
        alert('TouchOSC layout generated successfully! Load the .tosc file in your TouchOSC app.');
      } else {
        alert(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating TouchOSC layout:', error);
      alert('Error generating TouchOSC layout: ' + error);
    } finally {
      setTouchOscGenerating(false);
    }
  };

  const generateCrashProofExport = async () => {
    setTouchOscGenerating(true);
    try {
      console.log('🔧 Generating crash-proof TouchOSC export...');
      
      const options: FixedExportOptions = {
        resolution: 'tablet_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false
      };

      const result = await exportCrashProofToscFile(
        options,
        fixtureLayout,
        masterSliders,
        allFixtures,
        'ArtBastard_CrashProof.tosc'
      );

      if (result.success) {
        alert('✅ Crash-proof TouchOSC file generated successfully!\n\nThis version includes:\n• Enhanced XML validation\n• Color format fixes\n• Boundary checking\n• OSC address validation\n\nImport this file into TouchOSC - it should not crash!');
      } else {
        alert(`❌ Crash-proof export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating crash-proof TouchOSC layout:', error);
      alert('Error generating crash-proof TouchOSC layout: ' + error);
    } finally {
      setTouchOscGenerating(false);
    }
  };

  const generate512Channels = async () => {
    setTouchOscGenerating(true);
    try {
      // Use proper TouchOSC exporter with all DMX channels enabled
      const options: ExportOptions = {
        resolution: 'ipad_pro_2019_portrait',
        includeFixtureControls: false,
        includeMasterSliders: false,
        includeAllDmxChannels: true
      };

      const result = await exportToToscFile(
        options,
        [],                 // no fixture controls
        [],                 // no master sliders
        allFixtures,        // allFixtures
        'DMX512_AllChannels.tosc'
      );

      if (result.success) {
        alert('512-channel TouchOSC layout generated successfully! Load the .tosc file in your TouchOSC app.');
      } else {
        alert(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating 512-channel layout:', error);
      alert('Error generating 512-channel layout: ' + error);
    } finally {
      setTouchOscGenerating(false);
    }
  };
  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '240px' }, // Moved to avoid navbar overlap
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '240px' } // Moved to avoid navbar overlap
  };
  const formatBytes = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  // Don't render if debugButton is disabled in debugTools (unless embedded)
  if (!debugTools.debugButton && position !== 'embedded') {
    return null;
  }

  // Embedded mode - render without overlay
  if (position === 'embedded') {
    return (
      <div className={styles.debugPanel} style={{ position: 'relative', zIndex: 'auto' }}>
        <div className={styles.header}>
          <h3>🚀 ArtBastard Debug Menu</h3>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          {[
            { id: 'system', label: '🖥️ System', icon: '🖥️' },
            { id: 'midi', label: '🎹 MIDI', icon: '🎹' },
            { id: 'osc', label: '📡 OSC', icon: '📡' },
            { id: 'dmx', label: '💡 DMX', icon: '💡' },
            { id: 'touchosc', label: '📱 TouchOSC', icon: '📱' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* System Tab */}
          {activeTab === 'system' && (
            <div className={styles.systemTab}>
              <div className={styles.section}>
                <h4>🔧 Environment</h4>
                <div className={styles.infoGrid}>
                  <div>NODE_ENV: {systemInfo.nodeEnv}</div>
                  <div>React: {systemInfo.reactVersion}</div>
                  <div>Document State: {systemInfo.documentReadyState}</div>
                  <div>Window Loaded: {systemInfo.windowLoaded ? '✅' : '❌'}</div>
                  <div>Socket.IO: {connected ? '✅ Connected' : '❌ Disconnected'}</div>
                  <div>WebMIDI: {systemInfo.webMidiSupported ? '✅' : '❌'}</div>
                </div>
              </div>

              <div className={styles.section}>
                <h4>📊 Performance & Memory</h4>
                <div className={styles.infoGrid}>
                  <div>JS Heap Used: {formatBytes(systemInfo.memoryUsage?.usedJSHeapSize)}</div>
                  <div>JS Heap Total: {formatBytes(systemInfo.memoryUsage?.totalJSHeapSize)}</div>
                  <div>JS Heap Limit: {formatBytes(systemInfo.memoryUsage?.jsHeapSizeLimit)}</div>
                  <div>Navigation Type: {systemInfo.performance?.navigation || 'N/A'}</div>
                </div>
              </div>

              <div className={styles.section}>
                <h4>🌐 Network & Status</h4>
                <div className={styles.infoGrid}>
                  <div>Current URL: {systemInfo.currentUrl}</div>
                  <div>User Agent: {systemInfo.userAgent?.substring(0, 50)}...</div>
                  <div>Last Update: {systemInfo.timestamp}</div>
                  <div>Load Time: {systemInfo.performance?.timing ? 
                    `${systemInfo.performance.timing.loadEventEnd - systemInfo.performance.timing.navigationStart}ms` : 'N/A'}</div>
                </div>
              </div>

              {systemInfo.errors?.length > 0 && (
                <div className={styles.section}>
                  <h4>🚨 Recent Errors</h4>
                  <div className={styles.errorList}>
                    {systemInfo.errors.slice(-3).map((error: any, index: number) => (
                      <div key={index} className={styles.error}>
                        <div className={styles.errorMessage}>{error.message}</div>
                        <div className={styles.errorDetails}>
                          {error.filename}:{error.lineno}:{error.colno}
                        </div>
                        <div className={styles.errorTime}>
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MIDI Tab */}
          {activeTab === 'midi' && (
            <div className={styles.midiTab}>
              <div className={styles.section}>
                <h4>🎹 MIDI Status</h4>
                <div className={styles.infoGrid}>
                  <div>Learn Target: {midiLearnTarget !== null ? JSON.stringify(midiLearnTarget) : 'None'}</div>
                  <div>Active Mappings: {Object.keys(midiMappings).length}</div>
                  <div>Recent Messages: {midiMessages.length}</div>
                  <div>WebMIDI Support: {typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator ? '✅' : '❌'}</div>
                </div>
              </div>

              <div className={styles.section}>
                <h4>🧪 MIDI Test Functions</h4>
                <div className={styles.buttonGrid}>
                  <button
                    onClick={() => sendTestNoteOnMessage(0, 60, 127)}
                    className={styles.testButton}
                  >
                    🎵 Test Note (C4)
                  </button>
                  <button
                    onClick={() => sendTestCCMessage(0, 7, 127)}
                    className={styles.testButton}
                  >
                    🎛️ Test CC (Volume)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OSC Tab */}
          {activeTab === 'osc' && (
            <div className={styles.oscTab}>
              <div className={styles.section}>
                <h4>📡 OSC Test Functions</h4>
                <div className={styles.inputGroup}>
                  <label>OSC Address:</label>
                  <input
                    type="text"
                    value={oscTestAddress}
                    onChange={(e) => setOscTestAddress(e.target.value)}
                    placeholder="/test/address"
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Value:</label>
                  <input
                    type="number"
                    value={oscTestValue}
                    onChange={(e) => setOscTestValue(e.target.value)}
                    step="0.01"
                    className={styles.input}
                  />
                </div>

                <div className={styles.buttonGrid}>
                  <button
                    onClick={sendOscTestMessage}
                    className={styles.testButton}
                    disabled={!connected}
                  >
                    📡 Send OSC Message
                  </button>
                  <button
                    onClick={requestOscTestMessage}
                    className={styles.testButton}
                    disabled={!connected}
                  >
                    📥 Request OSC Test
                  </button>
                </div>

                <div className={styles.connectionStatus}>
                  Socket Status: {connected ? '✅ Connected' : '❌ Disconnected'}
                </div>
              </div>
            </div>
          )}

          {/* DMX Tab */}
          {activeTab === 'dmx' && (
            <div className={styles.dmxTab}>
              <div className={styles.section}>
                <h4>💡 DMX Test Functions</h4>
                <div className={styles.inputGroup}>
                  <label>DMX Channel (1-512):</label>
                  <input
                    type="number"
                    min="1"
                    max="512"
                    value={dmxTestChannel}
                    onChange={(e) => setDmxTestChannel(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Value (0-255):</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={dmxTestValue}
                    onChange={(e) => setDmxTestValue(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <button
                  onClick={sendDmxTestMessage}
                  className={styles.testButton}
                  disabled={!connected}
                >
                  💡 Send DMX Channel Debug
                </button>

                <div className={styles.connectionStatus}>
                  Socket Status: {connected ? '✅ Connected' : '❌ Disconnected'}
                </div>
              </div>

              <div className={styles.section}>
                <h4>📊 DMX Status</h4>
                <div className={styles.infoGrid}>
                  <div>Active Channels: {dmxChannels.filter(v => v > 0).length}</div>
                  <div>Total Fixtures: {fixtureLayout.length}</div>
                  <div>Max Channel Used: {Math.max(...dmxChannels.map((v, i) => v > 0 ? i + 1 : 0))}</div>
                </div>
              </div>
            </div>
          )}

          {/* TouchOSC Tab */}
          {activeTab === 'touchosc' && (
            <div className={styles.touchoscTab}>
              <div className={styles.section}>
                <h4>📱 TouchOSC Controls</h4>
                <p>TouchOSC functionality has been moved to the Remote Control page for better organization.</p>
                
                <div className={styles.infoText}>
                  <p><strong>🌐 Network Transmission:</strong> Visit the "Remote Control" page to access the new network-based transmission system.</p>
                  <p><strong>� Legacy Export:</strong> The Remote Control page includes all legacy file export functions.</p>
                  <p><strong>💡 Benefits:</strong> Direct network transmission to TouchOSC Editor, real-time updates, and integrated OSC configuration.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );  }

  // If not embedded mode, return null (no overlay functionality)
  return null;
};

export default DebugMenu;
