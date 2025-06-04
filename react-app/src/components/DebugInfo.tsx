import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { sendTestNoteOnMessage, sendTestCCMessage, testMidiLearnWorkflow } from '../hooks/useMidiTestUtils';

interface DebugInfoProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const DebugInfo: React.FC<DebugInfoProps> = ({ position = 'top-right' }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);
  
  // MIDI store state
  const midiMessages = useStore(state => state.midiMessages);
  const midiMappings = useStore(state => state.midiMappings);
  const midiLearnTarget = useStore(state => state.midiLearnTarget);

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        timestamp: new Date().toLocaleTimeString(),
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        nodeEnv: process.env.NODE_ENV,
        webMidiSupported: 'navigator' in window && 'requestMIDIAccess' in navigator,
        socketIOAvailable: typeof window !== 'undefined' && 'io' in window,
        reactVersion: React.version,
        documentReadyState: document.readyState,
        windowLoaded: document.readyState === 'complete',
        errors: (window as any).__reactErrors || []
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);

    // Listen for errors
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
      updateDebugInfo();
    };

    window.addEventListener('error', errorHandler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 10000,
          padding: '5px 10px',
          backgroundColor: isVisible ? '#ff4444' : '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}
      >
        {isVisible ? '🔍 Hide Debug' : '🔍 Debug'}
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: position.includes('top') ? '50px' : 'auto',
            bottom: position.includes('bottom') ? '50px' : 'auto',
            left: position.includes('left') ? '10px' : 'auto',            right: position.includes('right') ? '10px' : 'auto',
            width: '450px',
            maxHeight: '85vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#00ff00',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            zIndex: 9999,
            overflow: 'auto',
            border: '1px solid #333'
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#ffff00' }}>
            🚀 ArtBastard Debug Info
          </h3>
          
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>Environment:</strong>
            <div>NODE_ENV: {debugInfo.nodeEnv || 'undefined'}</div>
            <div>React Version: {debugInfo.reactVersion}</div>
            <div>Document State: {debugInfo.documentReadyState}</div>
            <div>Window Loaded: {debugInfo.windowLoaded ? '✅' : '❌'}</div>
          </div>          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>Browser Support:</strong>
            <div>WebMIDI: {debugInfo.webMidiSupported ? '✅' : '❌'}</div>
            <div>Socket.IO: {debugInfo.socketIOAvailable ? '✅' : '❌'}</div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>MIDI Debug:</strong>
            <div>Learn Target: {midiLearnTarget !== null ? JSON.stringify(midiLearnTarget) : 'None'}</div>
            <div>Active Mappings: {Object.keys(midiMappings).length}</div>
            <div>Recent Messages: {midiMessages.length}</div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>MIDI Mappings:</strong>
            <div style={{ 
              maxHeight: '120px', 
              overflow: 'auto', 
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px'
            }}>
              {Object.keys(midiMappings).length === 0 ? (
                <div style={{ color: '#888' }}>No mappings configured</div>
              ) : (
                Object.entries(midiMappings).map(([channel, mapping]) => (
                  <div key={channel} style={{ marginBottom: '2px' }}>
                    Ch {channel}: {mapping.controller !== undefined 
                      ? `CC ${mapping.channel}:${mapping.controller}` 
                      : `Note ${mapping.channel}:${mapping.note}`}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>Recent MIDI Messages:</strong>
            <div style={{ 
              maxHeight: '100px', 
              overflow: 'auto', 
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              {midiMessages.length === 0 ? (
                <div style={{ color: '#888' }}>No recent messages</div>
              ) : (
                midiMessages.slice(-5).map((message, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>
                    {JSON.stringify(message)}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>MIDI Test Functions:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
              <button
                onClick={() => sendTestNoteOnMessage(0, 60, 127)}
                style={{
                  backgroundColor: '#006600',
                  color: '#f0f0f0',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Test Note
              </button>
              <button
                onClick={() => sendTestCCMessage(0, 7, 127)}
                style={{
                  backgroundColor: '#005580',
                  color: '#f0f0f0',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Test CC
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
                style={{
                  backgroundColor: '#7700aa',
                  color: '#f0f0f0',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Test Learn
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>Network:</strong>
            <div>Current URL: {debugInfo.currentUrl}</div>
            <div>Last Updated: {debugInfo.timestamp}</div>
          </div>

          {debugInfo.errors && debugInfo.errors.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#ff4444' }}>Recent Errors:</strong>
              {debugInfo.errors.slice(-3).map((error: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '5px',
                    margin: '5px 0',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid #ff4444',
                    borderRadius: '3px'
                  }}
                >
                  <div style={{ color: '#ff6666' }}>{error.message}</div>
                  <div style={{ fontSize: '10px', color: '#cccccc' }}>
                    {error.filename}:{error.lineno}:{error.colno}
                  </div>
                  <div style={{ fontSize: '10px', color: '#aaaaaa' }}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '10px', color: '#888888', marginTop: '10px' }}>
            💡 Check browser DevTools Console (F12) for more details
          </div>
        </div>
      )}
    </>
  );
};

export default DebugInfo;
