import React, { useEffect, useState } from 'react';

interface DebugInfoProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const DebugInfo: React.FC<DebugInfoProps> = ({ position = 'top-right' }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

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
            left: position.includes('left') ? '10px' : 'auto',
            right: position.includes('right') ? '10px' : 'auto',
            width: '400px',
            maxHeight: '80vh',
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
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00ffff' }}>Browser Support:</strong>
            <div>WebMIDI: {debugInfo.webMidiSupported ? '✅' : '❌'}</div>
            <div>Socket.IO: {debugInfo.socketIOAvailable ? '✅' : '❌'}</div>
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
