import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PanelProvider } from '../../context/PanelContext';
import { DockingProvider } from '../../context/DockingContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { DMXMonitor } from './DMXMonitor';
import { MIDIMonitor } from './MIDIMonitor';
import { OSCMonitor } from './OSCMonitor';
import SuperControl from '../fixtures/SuperControl';

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
            
            :root {
              --primary-color: #4ecdc4;
              --primary-glow: rgba(78, 205, 196, 0.5);
              --background-dark: #121212;
              --background-light: #1e1e1e;
              --background-accent: #2a2a2a;
              --text-light: #e0e0e0;
              --text-dark: #a0a0a0;
              --border-color: rgba(255, 255, 255, 0.15);
              --success-color: #22c55e;
              --error-color: #ef4444;
              --warning-color: #f59e0b;
              --info-color: #3b82f6;
              --touch-target-size: 48px;
              --spacing-unit: 1rem;
              --border-radius: 8px;
              --font-main: 'Segoe UI', 'Roboto', sans-serif;
            }
            
            body {
              font-family: var(--font-main);
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

            /* Tab Layout */
            .tabContainer {
              display: flex;
              flex-direction: column;
              height: 100%;
              background: var(--background-dark);
              font-family: var(--font-main);
            }

            .tabNavigation {
              display: flex;
              flex-shrink: 0;
              background: var(--background-light);
              padding: calc(var(--spacing-unit) * 0.5);
              gap: calc(var(--spacing-unit) * 0.5);
              border-bottom: 2px solid var(--border-color);
            }

            .tabButton {
              flex: 1;
              padding: var(--spacing-unit);
              font-size: 1.1rem;
              font-weight: 600;
              color: var(--text-dark);
              background: transparent;
              border: none;
              border-radius: var(--border-radius);
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.75rem;
              min-height: var(--touch-target-size);
            }

            .tabButton:hover {
              background: var(--background-accent);
              color: var(--text-light);
            }

            .tabButton.active {
              background: var(--primary-color);
              color: var(--background-dark);
              box-shadow: 0 0 15px var(--primary-glow);
            }

            .tabContent {
              flex: 1;
              overflow-y: auto;
              padding: var(--spacing-unit);
            }

            /* Monitor Base Styles */
            .monitorContainer {
              height: 100%;
              display: flex;
              flex-direction: column;
              background: var(--background-light);
              border-radius: var(--border-radius);
              overflow: hidden;
              border: 1px solid var(--border-color);
            }

            .monitorHeader {
              background: var(--background-accent);
              padding: var(--spacing-unit);
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-shrink: 0;
              border-bottom: 1px solid var(--border-color);
            }

            .monitorHeader h3, .monitorHeader h4 {
              color: var(--primary-color);
              margin: 0;
              font-size: 1.5rem;
              font-weight: 700;
            }

            .controls {
              display: flex;
              gap: var(--spacing-unit);
              align-items: center;
            }

            .filterInput {
              padding: 0.75rem;
              min-height: var(--touch-target-size);
              background: var(--background-dark);
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
              color: var(--text-light);
              font-size: 1rem;
              outline: none;
              transition: all 0.2s ease;
            }

            .filterInput:focus {
              border-color: var(--primary-color);
              box-shadow: 0 0 8px var(--primary-glow);
            }

            .checkboxLabel {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              color: var(--text-light);
              cursor: pointer;
              font-size: 1rem;
              padding: 0.5rem;
            }

            .checkboxLabel input {
              width: 24px;
              height: 24px;
            }

            .clearButton {
              padding: 0.75rem 1.5rem;
              min-height: var(--touch-target-size);
              background: rgba(239, 68, 68, 0.2);
              border: 1px solid var(--error-color);
              border-radius: var(--border-radius);
              color: var(--error-color);
              cursor: pointer;
              transition: all 0.2s ease;
              font-size: 1rem;
              font-weight: 600;
            }

            .clearButton:hover {
              background: rgba(239, 68, 68, 0.4);
              color: var(--text-light);
            }

            .monitorContent {
              flex: 1;
              overflow-y: auto;
              padding: var(--spacing-unit);
            }

            /* DMX Monitor Styles */
            .channelGrid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: var(--spacing-unit);
            }

            .channelItem {
              background: var(--background-accent);
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: var(--spacing-unit);
              transition: all 0.2s ease;
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }

            .channelItem.active {
              border-color: var(--primary-color);
              box-shadow: 0 0 8px var(--primary-glow);
              transform: translateY(-2px);
            }

            .channelHeader {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }

            .channelNumber {
              font-weight: bold;
              color: var(--primary-color);
              font-size: 1.1rem;
            }

            .channelName {
              color: var(--text-dark);
              font-size: 0.9rem;
            }

            .channelValue {
              font-weight: bold;
              font-size: 2rem;
              color: var(--text-light);
              text-align: center;
              margin: 0.5rem 0;
            }

            .channelBar {
              width: 100%;
              height: 8px;
              background: var(--background-dark);
              border-radius: 4px;
              overflow: hidden;
            }

            .channelBarFill {
              height: 100%;
              background: linear-gradient(90deg, var(--primary-color), #45b7b8);
              transition: width 0.1s ease;
              border-radius: 4px;
            }

            .fixtureOverview {
              margin-top: calc(var(--spacing-unit) * 2);
            }

            .fixtureOverview h4 {
              color: var(--primary-color);
              margin-bottom: var(--spacing-unit);
              font-size: 1.3rem;
            }

            .fixtureList {
              display: flex;
              flex-direction: column;
              gap: var(--spacing-unit);
            }

            .fixtureItem {
              background: var(--background-accent);
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: var(--spacing-unit);
            }

            .fixtureName {
              font-weight: bold;
              color: var(--primary-color);
              margin-bottom: 0.75rem;
              font-size: 1.2rem;
            }

            .fixtureChannels {
              display: flex;
              flex-wrap: wrap;
              gap: 0.75rem;
            }

            .fixtureChannel {
              background: var(--background-dark);
              padding: 0.5rem 0.75rem;
              border-radius: var(--border-radius);
              font-size: 0.9rem;
              border: 1px solid transparent;
            }

            .fixtureChannel.active {
              background: var(--primary-color);
              color: var(--background-dark);
              font-weight: bold;
            }

            /* MIDI & OSC Common Styles */
            .messageListContainer {
              margin-top: calc(var(--spacing-unit) * 2);
            }

            .messageListContainer h4 {
              color: var(--primary-color);
              margin-bottom: var(--spacing-unit);
              font-size: 1.3rem;
            }

            .messageContainer {
              max-height: 500px;
              overflow-y: auto;
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
              background: var(--background-dark);
              padding: 0.5rem;
            }

            .messageItem {
              padding: 0.75rem;
              border-bottom: 1px solid var(--border-color);
              display: grid;
              grid-template-columns: 100px 120px 1fr;
              gap: var(--spacing-unit);
              align-items: center;
              font-family: 'Fira Code', 'Courier New', monospace;
              font-size: 1rem;
              transition: background-color 0.3s;
            }

            .messageItem:last-child {
              border-bottom: none;
            }

            .messageItem.noteOn { background: rgba(34, 197, 94, 0.1); }
            .messageItem.noteOff { background: rgba(239, 68, 68, 0.1); }
            .messageItem.controlChange { background: rgba(59, 130, 246, 0.1); }

            .messageTime {
              color: var(--text-dark);
              font-size: 0.85rem;
            }

            .messageType {
              padding: 0.375rem 0.75rem;
              border-radius: var(--border-radius);
              font-size: 0.9rem;
              font-weight: bold;
              text-align: center;
              color: var(--background-dark);
            }

            .messageType.noteOn { background-color: var(--success-color); }
            .messageType.noteOff { background-color: var(--error-color); }
            .messageType.controlChange { background-color: var(--info-color); }
            .messageType.osc { background-color: var(--warning-color); }

            .messageDetails {
              display: flex;
              flex-wrap: wrap;
              gap: 0.75rem;
              font-size: 0.9rem;
              color: var(--text-light);
            }

            .messageDetails span {
              background: var(--background-accent);
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
            }

            .messageDetails strong {
              color: var(--primary-color);
              margin-right: 0.5rem;
            }

            /* SuperControl Styles */
            .superControlContainer {
              padding: var(--spacing-unit);
              height: 100%;
              overflow-y: auto;
            }

            .superControlGrid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: var(--spacing-unit);
            }

            .controlSection {
              background: var(--background-accent);
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: var(--spacing-unit);
            }

            .sectionHeader {
              margin-bottom: var(--spacing-unit);
              color: var(--primary-color);
              font-weight: bold;
              font-size: 1.1rem;
            }

            .controlRow {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.5rem;
            }

            .controlLabel {
              font-size: 0.9rem;
              color: var(--text-light);
            }

            .controlValue {
              font-size: 0.8rem;
              color: var(--text-dark);
              background: var(--background-dark);
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }

            .controlSlider {
              width: 100%;
              margin: 0.5rem 0;
              height: 6px;
              background: var(--background-dark);
              border-radius: 3px;
              -webkit-appearance: none;
              appearance: none;
            }

            .controlSlider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              border: 2px solid #fff;
            }

            .controlSlider::-webkit-slider-track {
              background: linear-gradient(90deg, var(--background-dark) 0%, var(--primary-color) 100%);
            }

            .controlSlider::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
              border: 2px solid #fff;
            }

            .controlSlider::-moz-range-track {
              background: linear-gradient(90deg, var(--background-dark) 0%, var(--primary-color) 100%);
            }

            /* Custom Scrollbars */
            ::-webkit-scrollbar {
              width: 12px;
              height: 12px;
            }

            ::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 6px;
            }

            ::-webkit-scrollbar-thumb {
              background: rgba(78, 205, 196, 0.4);
              border-radius: 6px;
              border: 2px solid transparent;
              background-clip: padding-box;
            }

            ::-webkit-scrollbar-thumb:hover {
              background: rgba(78, 205, 196, 0.6);
              background-clip: padding-box;
            }

            /* Form Elements */
            input, select, button {
              font-family: inherit;
              font-size: inherit;
            }

            button {
              cursor: pointer;
              transition: all 0.2s ease;
            }

            button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            /* Utility Classes */
            .text-center { text-align: center; }
            .text-muted { color: rgba(255, 255, 255, 0.6); }
            .mb-1 { margin-bottom: 0.5rem; }
            .mb-2 { margin-bottom: 1rem; }
            .mb-3 { margin-bottom: 1.5rem; }
            .mt-1 { margin-top: 0.5rem; }
            .mt-2 { margin-top: 1rem; }
            .mt-3 { margin-top: 1.5rem; }
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
    <div className="tabContainer">
      <div className="tabNavigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tabButton ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="tabContent">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default ExternalWindow;
