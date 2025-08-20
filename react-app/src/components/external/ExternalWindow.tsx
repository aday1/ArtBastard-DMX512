import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PanelProvider } from '../../context/PanelContext';
import { DockingProvider } from '../../context/DockingContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { DMXMonitor } from './DMXMonitor';
import { MIDIMonitor } from './MIDIMonitor';
import { OSCMonitor } from './OSCMonitor';
import TouchSuperControl from '../fixtures/TouchSuperControl';

interface GridItem {
  id: string;
  component: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
}

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

            /* Grid Layout System */
            .gridContainer {
              position: relative;
              width: 100%;
              height: calc(100vh - 60px);
              display: grid;
              grid-template-columns: repeat(12, 1fr);
              grid-template-rows: repeat(8, 1fr);
              gap: 8px;
              padding: 8px;
              background: var(--background-dark);
              overflow: hidden;
            }

            .gridItem {
              position: relative;
              background: var(--background-light);
              border: 2px solid var(--border-color);
              border-radius: var(--border-radius);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
              transition: all 0.3s ease;
            }

            .gridItem:hover {
              border-color: var(--accent-primary);
              box-shadow: 0 6px 24px rgba(78, 205, 196, 0.2);
            }

            .gridItem.resizing {
              border-color: var(--accent-secondary);
              box-shadow: 0 8px 32px rgba(78, 205, 196, 0.3);
              z-index: 10;
            }

            .gridItem.dragging {
              border-color: var(--accent-primary);
              box-shadow: 0 12px 40px rgba(78, 205, 196, 0.4);
              z-index: 15;
              opacity: 0.9;
            }

            .gridItemHeader {
              background: var(--background-dark);
              color: var(--text-primary);
              padding: 8px 12px;
              font-size: 0.9rem;
              font-weight: 600;
              border-bottom: 1px solid var(--border-color);
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-shrink: 0;
              cursor: move;
            }

            .gridItemContent {
              flex: 1;
              overflow: hidden;
              position: relative;
            }

            .resizeHandle {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 20px;
              height: 20px;
              background: var(--accent-primary);
              cursor: nw-resize;
              opacity: 0.7;
              clip-path: polygon(100% 0%, 0% 100%, 100% 100%);
              transition: opacity 0.2s ease;
            }

            .resizeHandle:hover {
              opacity: 1;
            }

            .removeButton {
              background: transparent;
              border: none;
              color: var(--text-muted);
              font-size: 1.2rem;
              cursor: pointer;
              padding: 4px;
              border-radius: 4px;
              transition: all 0.2s ease;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .removeButton:hover {
              background: rgba(255, 69, 58, 0.2);
              color: #ff453a;
            }

            /* Component Palette */
            .componentPalette {
              position: fixed;
              top: 20px;
              right: 20px;
              background: var(--background-light);
              border: 2px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              z-index: 1000;
              max-width: 250px;
            }

            .paletteTitle {
              color: var(--text-primary);
              font-weight: 600;
              font-size: 0.9rem;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
            }

            .componentButton {
              width: 100%;
              padding: 12px;
              margin-bottom: 8px;
              background: var(--background-dark);
              color: var(--text-primary);
              border: 1px solid var(--border-color);
              border-radius: 6px;
              cursor: pointer;
              font-size: 0.85rem;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .componentButton:hover {
              background: var(--accent-primary);
              color: white;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
            }

            .componentButton:last-child {
              margin-bottom: 0;
            }

            /* Touch Optimizations */
            .gridItem,
            .componentButton,
            .tabButton {
              min-height: var(--touch-target-size);
              touch-action: manipulation;
            }

            .gridItemHeader {
              min-height: 44px;
            }

            .resizeHandle {
              min-width: 44px;
              min-height: 44px;
            }

            /* Responsive Grid Adjustments */
            @media (max-width: 1200px) {
              .gridContainer {
                grid-template-columns: repeat(8, 1fr);
                grid-template-rows: repeat(6, 1fr);
              }
            }

            @media (max-width: 800px) {
              .gridContainer {
                grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(4, 1fr);
              }
              
              .componentPalette {
                position: relative;
                top: auto;
                right: auto;
                margin-bottom: 12px;
                max-width: none;
              }
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
                <span>🎛️</span>
                <span>External Monitor - Touchscreen Control Center</span>
              </div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">
                Drag & drop resizable grid layout with TouchSuperControl
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

    // External Grid Content Component that recreates the grid functionality
    const ExternalGridContent: React.FC = () => {
      const [externalGridItems, setExternalGridItems] = useState<GridItem[]>([
        {
          id: 'supercontrol-1',
          component: 'touchsupercontrol',
          x: 0,
          y: 0,
          width: 8,
          height: 6,
          title: '🎛️ Touch SuperControl'
        },
        {
          id: 'dmx-monitor-1',
          component: 'dmxmonitor',
          x: 8,
          y: 0,
          width: 4,
          height: 3,
          title: '📡 DMX Monitor'
        },
        {
          id: 'midi-monitor-1',
          component: 'midimonitor',
          x: 8,
          y: 3,
          width: 4,
          height: 3,
          title: '🎹 MIDI Monitor'
        }
      ]);
      
      const [externalIsDragging, setExternalIsDragging] = useState<string | null>(null);
      const [externalIsResizing, setExternalIsResizing] = useState<string | null>(null);
      const [externalShowPalette, setExternalShowPalette] = useState(true);

      // Save/load layout to localStorage with external prefix
      const saveExternalLayout = () => {
        localStorage.setItem('externalMonitorLayout', JSON.stringify(externalGridItems));
      };

      const loadExternalLayout = () => {
        const saved = localStorage.getItem('externalMonitorLayout');
        if (saved) {
          try {
            const layout = JSON.parse(saved);
            setExternalGridItems(layout);
          } catch (error) {
            console.error('Failed to load external layout:', error);
          }
        }
      };

      const resetExternalLayout = () => {
        setExternalGridItems([
          {
            id: 'supercontrol-1',
            component: 'touchsupercontrol',
            x: 0,
            y: 0,
            width: 8,
            height: 6,
            title: '🎛️ Touch SuperControl'
          },
          {
            id: 'dmx-monitor-1',
            component: 'dmxmonitor',
            x: 8,
            y: 0,
            width: 4,
            height: 3,
            title: '📡 DMX Monitor'
          },
          {
            id: 'midi-monitor-1',
            component: 'midimonitor',
            x: 8,
            y: 3,
            width: 4,
            height: 3,
            title: '🎹 MIDI Monitor'
          }
        ]);
      };

      // Auto-save layout changes
      React.useEffect(() => {
        const timer = setTimeout(() => {
          saveExternalLayout();
        }, 1000);
        return () => clearTimeout(timer);
      }, [externalGridItems]);

      // Load layout on mount
      React.useEffect(() => {
        loadExternalLayout();
      }, []);

      const externalAvailableComponents = [
        { id: 'touchsupercontrol', label: '🎛️ Touch SuperControl', component: TouchSuperControl },
        { id: 'dmxmonitor', label: '📡 DMX Monitor', component: DMXMonitor },
        { id: 'midimonitor', label: '🎹 MIDI Monitor', component: MIDIMonitor },
        { id: 'oscmonitor', label: '🌐 OSC Monitor', component: OSCMonitor }
      ];

      const addExternalComponent = (componentType: string) => {
        const componentInfo = externalAvailableComponents.find(c => c.id === componentType);
        if (!componentInfo) return;

        // Find available space for the new component
        let x = 0, y = 0;
        const width = 4;
        const height = 3;

        // Simple placement algorithm - find first available spot
        for (let row = 0; row <= 8 - height; row++) {
          for (let col = 0; col <= 12 - width; col++) {
            const conflicts = externalGridItems.some(item => 
              !(col >= item.x + item.width || 
                col + width <= item.x || 
                row >= item.y + item.height || 
                row + height <= item.y)
            );
            if (!conflicts) {
              x = col;
              y = row;
              break;
            }
          }
          if (x !== 0 || y !== 0) break;
        }

        const newItem: GridItem = {
          id: `${componentType}-${Date.now()}`,
          component: componentType,
          x,
          y,
          width,
          height,
          title: componentInfo.label
        };

        setExternalGridItems(prev => [...prev, newItem]);
      };

      const removeExternalItem = (id: string) => {
        setExternalGridItems(prev => prev.filter(item => item.id !== id));
      };

      const updateExternalItemPosition = (id: string, x: number, y: number) => {
        setExternalGridItems(prev => prev.map(item => 
          item.id === id ? { ...item, x: Math.max(0, Math.min(x, 12 - item.width)), y: Math.max(0, Math.min(y, 8 - item.height)) } : item
        ));
      };

      const updateExternalItemSize = (id: string, width: number, height: number) => {
        setExternalGridItems(prev => prev.map(item => 
          item.id === id ? { 
            ...item, 
            width: Math.max(1, Math.min(width, 12 - item.x)), 
            height: Math.max(1, Math.min(height, 8 - item.y)) 
          } : item
        ));
      };

      const renderExternalComponent = (item: GridItem) => {
        const componentInfo = externalAvailableComponents.find(c => c.id === item.component);
        if (!componentInfo) return <div>Component not found</div>;

        const Component = componentInfo.component as any;
        
        // Touch-optimized props for external display
        const componentProps = {
          isFullscreen: true,
          enableHapticFeedback: true,
          touchOptimized: true,
          externalDisplay: true
        };

        return <Component {...componentProps} />;
      };

      const handleExternalMouseDown = (e: React.MouseEvent, itemId: string, action: 'drag' | 'resize') => {
        e.preventDefault();
        e.stopPropagation();
        if (action === 'drag') {
          setExternalIsDragging(itemId);
        } else {
          setExternalIsResizing(itemId);
        }
      };

      const handleExternalTouchStart = (e: React.TouchEvent, itemId: string, action: 'drag' | 'resize') => {
        e.preventDefault();
        if (action === 'drag') {
          setExternalIsDragging(itemId);
        } else {
          setExternalIsResizing(itemId);
        }
      };

      const handleExternalMouseMove = (e: React.MouseEvent) => {
        if (!externalIsDragging && !externalIsResizing) return;
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const gridX = Math.floor(((e.clientX - rect.left) / rect.width) * 12);
        const gridY = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
        
        if (externalIsDragging) {
          updateExternalItemPosition(externalIsDragging, gridX, gridY);
        } else if (externalIsResizing) {
          const item = externalGridItems.find(i => i.id === externalIsResizing);
          if (item) {
            const width = Math.max(1, gridX - item.x + 1);
            const height = Math.max(1, gridY - item.y + 1);
            updateExternalItemSize(externalIsResizing, width, height);
          }
        }
      };

      const handleExternalTouchMove = (e: React.TouchEvent) => {
        if (!externalIsDragging && !externalIsResizing) return;
        
        const touch = e.touches[0];
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const gridX = Math.floor(((touch.clientX - rect.left) / rect.width) * 12);
        const gridY = Math.floor(((touch.clientY - rect.top) / rect.height) * 8);
        
        if (externalIsDragging) {
          updateExternalItemPosition(externalIsDragging, gridX, gridY);
        } else if (externalIsResizing) {
          const item = externalGridItems.find(i => i.id === externalIsResizing);
          if (item) {
            const width = Math.max(1, gridX - item.x + 1);
            const height = Math.max(1, gridY - item.y + 1);
            updateExternalItemSize(externalIsResizing, width, height);
          }
        }
      };

      const handleExternalEnd = () => {
        setExternalIsDragging(null);
        setExternalIsResizing(null);
      };

      return (
        <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
          {externalShowPalette && (
            <div className="componentPalette">
              <div className="paletteTitle">
                <span>🧩</span>
                <span>Add Components</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={saveExternalLayout}
                    style={{ background: 'none', border: 'none', color: '#4ECDC4', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Save Layout"
                  >
                    💾
                  </button>
                  <button 
                    onClick={loadExternalLayout}
                    style={{ background: 'none', border: 'none', color: '#4ECDC4', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Load Layout"
                  >
                    📂
                  </button>
                  <button 
                    onClick={resetExternalLayout}
                    style={{ background: 'none', border: 'none', color: '#4ECDC4', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Reset Layout"
                  >
                    🔄
                  </button>
                  <button 
                    onClick={() => setExternalShowPalette(false)}
                    style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              </div>
              {externalAvailableComponents.map(comp => (
                <button
                  key={comp.id}
                  className="componentButton"
                  onClick={() => addExternalComponent(comp.id)}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          )}

          {!externalShowPalette && (
            <button
              onClick={() => setExternalShowPalette(true)}
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              +
            </button>
          )}

          <div 
            className="gridContainer"
            onMouseMove={handleExternalMouseMove}
            onMouseUp={handleExternalEnd}
            onMouseLeave={handleExternalEnd}
            onTouchMove={handleExternalTouchMove}
            onTouchEnd={handleExternalEnd}
            onTouchCancel={handleExternalEnd}
          >
            {externalGridItems.map(item => (
              <div
                key={item.id}
                className={`gridItem ${externalIsResizing === item.id ? 'resizing' : ''} ${externalIsDragging === item.id ? 'dragging' : ''}`}
                style={{
                  gridColumn: `${item.x + 1} / ${item.x + item.width + 1}`,
                  gridRow: `${item.y + 1} / ${item.y + item.height + 1}`
                }}
              >
                <div 
                  className="gridItemHeader"
                  onMouseDown={(e) => handleExternalMouseDown(e, item.id, 'drag')}
                  onTouchStart={(e) => handleExternalTouchStart(e, item.id, 'drag')}
                >
                  <span>{item.title}</span>
                  <button 
                    className="removeButton"
                    onClick={() => removeExternalItem(item.id)}
                    title="Remove component"
                  >
                    ×
                  </button>
                </div>
                <div className="gridItemContent">
                  {renderExternalComponent(item)}
                </div>
                <div 
                  className="resizeHandle"
                  onMouseDown={(e) => handleExternalMouseDown(e, item.id, 'resize')}
                  onTouchStart={(e) => handleExternalTouchStart(e, item.id, 'resize')}
                  title="Drag to resize"
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

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
                <ExternalGridContent />
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
  const [gridItems, setGridItems] = useState<GridItem[]>([
    {
      id: 'supercontrol-1',
      component: 'touchsupercontrol',
      x: 0,
      y: 0,
      width: 8,
      height: 6,
      title: '🎛️ Touch SuperControl'
    },
    {
      id: 'dmx-monitor-1',
      component: 'dmxmonitor',
      x: 8,
      y: 0,
      width: 4,
      height: 3,
      title: '📡 DMX Monitor'
    },
    {
      id: 'midi-monitor-1',
      component: 'midimonitor',
      x: 8,
      y: 3,
      width: 4,
      height: 3,
      title: '🎹 MIDI Monitor'
    }
  ]);

  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);

  // Save/load layout to localStorage
  const saveLayout = () => {
    localStorage.setItem('externalMonitorLayout', JSON.stringify(gridItems));
  };

  const loadLayout = () => {
    const saved = localStorage.getItem('externalMonitorLayout');
    if (saved) {
      try {
        const layout = JSON.parse(saved);
        setGridItems(layout);
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    }
  };

  const resetLayout = () => {
    setGridItems([
      {
        id: 'supercontrol-1',
        component: 'touchsupercontrol',
        x: 0,
        y: 0,
        width: 8,
        height: 6,
        title: '🎛️ Touch SuperControl'
      },
      {
        id: 'dmx-monitor-1',
        component: 'dmxmonitor',
        x: 8,
        y: 0,
        width: 4,
        height: 3,
        title: '📡 DMX Monitor'
      },
      {
        id: 'midi-monitor-1',
        component: 'midimonitor',
        x: 8,
        y: 3,
        width: 4,
        height: 3,
        title: '🎹 MIDI Monitor'
      }
    ]);
  };

  // Auto-save layout changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      saveLayout();
    }, 1000);
    return () => clearTimeout(timer);
  }, [gridItems]);

  // Load layout on mount
  React.useEffect(() => {
    loadLayout();
  }, []);

  const availableComponents = [
    { id: 'touchsupercontrol', label: '🎛️ Touch SuperControl', component: TouchSuperControl },
    { id: 'dmxmonitor', label: '📡 DMX Monitor', component: DMXMonitor },
    { id: 'midimonitor', label: '🎹 MIDI Monitor', component: MIDIMonitor },
    { id: 'oscmonitor', label: '🌐 OSC Monitor', component: OSCMonitor }
  ];

  const addComponent = (componentType: string) => {
    const componentInfo = availableComponents.find(c => c.id === componentType);
    if (!componentInfo) return;

    // Find available space for the new component
    let x = 0, y = 0;
    const width = 4;
    const height = 3;

    // Simple placement algorithm - find first available spot
    for (let row = 0; row <= 8 - height; row++) {
      for (let col = 0; col <= 12 - width; col++) {
        const conflicts = gridItems.some(item => 
          !(col >= item.x + item.width || 
            col + width <= item.x || 
            row >= item.y + item.height || 
            row + height <= item.y)
        );
        if (!conflicts) {
          x = col;
          y = row;
          break;
        }
      }
      if (x !== 0 || y !== 0) break;
    }

    const newItem: GridItem = {
      id: `${componentType}-${Date.now()}`,
      component: componentType,
      x,
      y,
      width,
      height,
      title: componentInfo.label
    };

    setGridItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setGridItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemPosition = (id: string, x: number, y: number) => {
    setGridItems(prev => prev.map(item => 
      item.id === id ? { ...item, x: Math.max(0, Math.min(x, 12 - item.width)), y: Math.max(0, Math.min(y, 8 - item.height)) } : item
    ));
  };

  const updateItemSize = (id: string, width: number, height: number) => {
    setGridItems(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        width: Math.max(1, Math.min(width, 12 - item.x)), 
        height: Math.max(1, Math.min(height, 8 - item.y)) 
      } : item
    ));
  };

  const renderComponent = (item: GridItem) => {
    const componentInfo = availableComponents.find(c => c.id === item.component);
    if (!componentInfo) return <div>Component not found</div>;

    const Component = componentInfo.component as any;
    
    // Touch-optimized props for TouchSuperControl
    const componentProps = item.component === 'touchsupercontrol' ? {
      isFullscreen: true,
      enableHapticFeedback: true,
      touchOptimized: true,
      externalDisplay: true
    } : {};

    return <Component {...componentProps} />;
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'drag') {
      setIsDragging(itemId);
    } else {
      setIsResizing(itemId);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, itemId: string, action: 'drag' | 'resize') => {
    e.preventDefault();
    if (action === 'drag') {
      setIsDragging(itemId);
    } else {
      setIsResizing(itemId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gridX = Math.floor(((e.clientX - rect.left) / rect.width) * 12);
    const gridY = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    
    if (isDragging) {
      updateItemPosition(isDragging, gridX, gridY);
    } else if (isResizing) {
      const item = gridItems.find(i => i.id === isResizing);
      if (item) {
        const width = Math.max(1, gridX - item.x + 1);
        const height = Math.max(1, gridY - item.y + 1);
        updateItemSize(isResizing, width, height);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging && !isResizing) return;
    
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gridX = Math.floor(((touch.clientX - rect.left) / rect.width) * 12);
    const gridY = Math.floor(((touch.clientY - rect.top) / rect.height) * 8);
    
    if (isDragging) {
      updateItemPosition(isDragging, gridX, gridY);
    } else if (isResizing) {
      const item = gridItems.find(i => i.id === isResizing);
      if (item) {
        const width = Math.max(1, gridX - item.x + 1);
        const height = Math.max(1, gridY - item.y + 1);
        updateItemSize(isResizing, width, height);
      }
    }
  };

  const handleEnd = () => {
    setIsDragging(null);
    setIsResizing(null);
  };

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {showPalette && (
        <div className="componentPalette">
          <div className="paletteTitle">
            <span>🧩</span>
            <span>Add Components</span>
            <button 
              onClick={() => setShowPalette(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          {availableComponents.map(comp => (
            <button
              key={comp.id}
              className="componentButton"
              onClick={() => addComponent(comp.id)}
            >
              {comp.label}
            </button>
          ))}
        </div>
      )}

      {!showPalette && (
        <button
          onClick={() => setShowPalette(true)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          +
        </button>
      )}

      <div 
        className="gridContainer"
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      >
        {gridItems.map(item => (
          <div
            key={item.id}
            className={`gridItem ${isResizing === item.id ? 'resizing' : ''} ${isDragging === item.id ? 'dragging' : ''}`}
            style={{
              gridColumn: `${item.x + 1} / ${item.x + item.width + 1}`,
              gridRow: `${item.y + 1} / ${item.y + item.height + 1}`
            }}
          >
            <div 
              className="gridItemHeader"
              onMouseDown={(e) => handleMouseDown(e, item.id, 'drag')}
              onTouchStart={(e) => handleTouchStart(e, item.id, 'drag')}
            >
              <span>{item.title}</span>
              <button 
                className="removeButton"
                onClick={() => removeItem(item.id)}
                title="Remove component"
              >
                ×
              </button>
            </div>
            <div className="gridItemContent">
              {renderComponent(item)}
            </div>
            <div 
              className="resizeHandle"
              onMouseDown={(e) => handleMouseDown(e, item.id, 'resize')}
              onTouchStart={(e) => handleTouchStart(e, item.id, 'resize')}
              title="Drag to resize"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExternalWindow;
