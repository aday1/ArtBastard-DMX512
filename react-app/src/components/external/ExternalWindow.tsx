import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PanelProvider } from '../../context/PanelContext';
import { DockingProvider } from '../../context/DockingContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { DMXMonitor } from './DMXMonitor';
import { MIDIMonitor } from './MIDIMonitor';
import { OSCMonitor } from './OSCMonitor';
import SuperControl from '../fixtures/SuperControl';
import styles from './ExternalDisplay.module.scss';

interface ExternalWindowProps {
  onClose?: () => void;
  title?: string;
  width?: number;
  height?: number;
}

export const ExternalWindow: React.FC<ExternalWindowProps> = ({
  onClose,
  title = 'ArtBastard DMX - External Monitor',
  width = 800,
  height = 600
}) => {
  const [externalWindow, setExternalWindow] = useState<Window | null>(null);
  const [reactRoot, setReactRoot] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate position for second monitor
    const left = window.screen.availWidth || window.innerWidth;
    const top = 0;

    // Open new window
    const newWindow = window.open(
      '',
      'ExternalMonitor',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
    );

    if (!newWindow) {
      console.error('Failed to open external window - popup may be blocked');
      return;
    }

    // Setup the HTML structure
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
              color: #ffffff;
              overflow: hidden;
            }
            
            #external-root {
              width: 100vw;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .external-header {
              background: rgba(0, 0, 0, 0.9);
              border-bottom: 1px solid rgba(78, 205, 196, 0.3);
              padding: 0.75rem 1rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-shrink: 0;
            }
            
            .external-title {
              color: #4ecdc4;
              font-weight: 600;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            .external-content {
              flex: 1;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div id="external-root">
            <div class="external-header">
              <div class="external-title">
                <span>📺</span>
                <span>External Monitor</span>
              </div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">
                Multi-panel view with SuperControl mirroring
              </div>
            </div>
            <div class="external-content">
              <div id="react-container"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();

    // Wait for DOM to be ready, then setup React
    const setupReact = () => {
      const container = newWindow.document.getElementById('react-container');
      if (container) {
        const root = createRoot(container);
        
        // Render React component in external window
        root.render(
          <ThemeProvider>
            <PanelProvider>
              <DockingProvider>
                <ExternalPanelContent />
              </DockingProvider>
            </PanelProvider>
          </ThemeProvider>
        );
        
        setReactRoot(root);
      }
    };

    // Setup after a brief delay to ensure DOM is ready
    setTimeout(setupReact, 100);

    // Handle window close
    const handleClose = () => {
      if (reactRoot) {
        reactRoot.unmount();
      }
      if (onClose) {
        onClose();
      }
    };

    newWindow.addEventListener('beforeunload', handleClose);
    
    setExternalWindow(newWindow);

    // Cleanup on component unmount
    return () => {
      if (reactRoot) {
        reactRoot.unmount();
      }
      if (newWindow && !newWindow.closed) {
        newWindow.close();
      }
    };
  }, [width, height, title, onClose]);

  // Setup cross-window communication
  useEffect(() => {
    if (!externalWindow) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle messages from external window
      if (event.source === externalWindow) {
        console.log('Message from external window:', event.data);
        // TODO: Handle component drops, state updates, etc.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [externalWindow]);

  return null; // This component doesn't render anything in the main window
};

// Component to render inside the external window
const ExternalPanelContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'supercontrol' | 'dmx' | 'midi' | 'osc'>('supercontrol');

  const tabs = [
    { id: 'supercontrol', label: '🎛️ SuperControl', component: SuperControl },
    { id: 'dmx', label: '📡 DMX Monitor', component: DMXMonitor },
    { id: 'midi', label: '🎹 MIDI Monitor', component: MIDIMonitor },
    { id: 'osc', label: '🌐 OSC Monitor', component: OSCMonitor },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabNavigation}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className={styles.tabContent}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default ExternalWindow;
