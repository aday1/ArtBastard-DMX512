import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import { sendTestNoteOnMessage, sendTestCCMessage, testMidiLearnWorkflow } from '../../hooks/useMidiTestUtils';
import { exportToToscFile, ExportOptions } from '../../utils/touchoscExporter';
import styles from './DebugMenu.module.scss';

interface DebugMenuProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
  const [oscTestValue, setOscTestValue] = useState('127');
  const [dmxTestChannel, setDmxTestChannel] = useState('1');
  const [dmxTestValue, setDmxTestValue] = useState('255');
  const [touchOscGenerating, setTouchOscGenerating] = useState(false);  const { 
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

  // Don't render if debugButton is disabled in debugTools
  if (!debugTools.debugButton) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={styles.toggleButton}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 10000,
        }}
        title="Debug Menu (Ctrl+D)"
      >
        {isVisible ? '🔧 Hide Debug' : '🔧 Debug Menu'}
      </button>      {/* Debug panel */}
      {isVisible && (
        <div
          className={styles.debugPanel}
          style={{
            position: 'fixed',
            top: position.includes('top') ? '50px' : 'auto',
            bottom: position.includes('bottom') ? '50px' : 'auto',
            left: position.includes('left') ? '10px' : 'auto',
            right: position.includes('right') ? '240px' : 'auto', // Moved to avoid navbar overlap
            zIndex: 1000, // Lower than navbar z-index (1001)
          }}
        ><div className={styles.header}>
            <h3>🚀 ArtBastard Debug Menu</h3>
            <div className={styles.headerControls}>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className={styles.minimizeButton}
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? '🔼' : '🔽'}
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>          </div>

          {/* Tab Navigation - only show when not minimized */}
          {!isMinimized && (
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
            </div>
          )}

          {/* Tab Content - only show when not minimized */}
          {!isMinimized && (
            <div className={styles.tabContent}>            {/* System Tab */}
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
            )}            {/* MIDI Tab */}
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
                  <h4>🗺️ MIDI Mappings</h4>
                  <div className={styles.mappingsList}>
                    {Object.keys(midiMappings).length === 0 ? (
                      <div className={styles.noMappings}>No MIDI mappings configured</div>
                    ) : (
                      Object.entries(midiMappings).map(([channel, mapping]) => (
                        <div key={channel} className={styles.mappingItem}>
                          <strong>DMX Ch {channel}:</strong> 
                          {mapping.controller !== undefined 
                            ? ` MIDI CC ${mapping.channel}:${mapping.controller}` 
                            : ` MIDI Note ${mapping.channel}:${mapping.note}`}
                        </div>
                      ))
                    )}
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
                    <button
                      onClick={() => {
                        const channel = prompt('Enter DMX channel to test (0-511):', '0');
                        if (channel !== null) {
                          const dmxChannel = parseInt(channel, 10);
                          if (!isNaN(dmxChannel) && dmxChannel >= 0 && dmxChannel <= 511) {
                            const msgType = prompt('Enter MIDI message type (note/cc):', 'note');
                            testMidiLearnWorkflow(dmxChannel, msgType === 'cc' ? 'cc' : 'note');
                          }
                        }
                      }}
                      className={styles.testButton}
                    >
                      🔄 Test MIDI Learn
                    </button>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4>📋 Recent MIDI Messages</h4>
                  <div className={styles.messageList}>
                    {midiMessages.length === 0 ? (
                      <div className={styles.noMessages}>No recent MIDI messages</div>
                    ) : (
                      midiMessages.slice(-5).map((message, idx) => (
                        <div key={idx} className={styles.message}>
                          {JSON.stringify(message)}
                        </div>
                      ))
                    )}
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
                      placeholder="/dmx/channel/1"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Value:</label>
                    <input
                      type="text"
                      value={oscTestValue}
                      onChange={(e) => setOscTestValue(e.target.value)}
                      placeholder="127"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.buttonGrid}>
                    <button
                      onClick={sendOscTestMessage}
                      className={styles.testButton}
                      disabled={!connected}
                    >
                      📤 Send OSC Message
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
                  <h4>💡 DMX Debug Functions</h4>
                  
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
                  <h4>📱 TouchOSC Generation</h4>
                  
                  <div className={styles.buttonGrid}>
                    <button
                      onClick={generateFromFixtures}
                      className={styles.generateButton}
                      disabled={touchOscGenerating}
                    >
                      {touchOscGenerating ? '⏳ Generating...' : '🎯 Auto-Generate from Fixtures'}
                    </button>
                    
                    <button
                      onClick={generate512Channels}
                      className={styles.generateButton}
                      disabled={touchOscGenerating}
                    >
                      {touchOscGenerating ? '⏳ Generating...' : '📊 Generate All 512 Channels'}
                    </button>
                  </div>                  <div className={styles.infoText}>
                    <p><strong>Auto-Generate from Fixtures:</strong> Creates TouchOSC layout (.tosc file) with controls for all placed fixtures, including PAN/TILT controls for moving lights and master sliders.</p>
                    <p><strong>All 512 Channels:</strong> Creates a comprehensive grid with faders for all 512 DMX channels in TouchOSC format (.tosc file).</p>
                    <p><strong>Note:</strong> Generated .tosc files can be imported directly into the TouchOSC app on your mobile device.</p>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4>📊 Current Layout</h4>
                  <div className={styles.infoGrid}>
                    <div>Placed Fixtures: {fixtureLayout.length}</div>
                    <div>Available Fixture Types: {allFixtures.length}</div>
                    <div>Pan/Tilt Fixtures: {fixtureLayout.filter(pf => {
                      const fixture = allFixtures.find(f => f.id === pf.fixtureId);
                      return fixture?.channels.some(ch => ch.type === 'pan' || ch.type === 'tilt');
                    }).length}</div>
                  </div>                </div>
              </div>
            )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DebugMenu;
