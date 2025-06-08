import React, { useEffect, useRef } from 'react'
import { Layout } from './components/layout/Layout'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import { DockingProvider } from './context/DockingContext'
import { ChromaticEnergyManipulatorProvider } from './context/ChromaticEnergyManipulatorContext'
import { PanelProvider } from './context/PanelContext'
import { ExternalWindowProvider } from './context/ExternalWindowContext'
import { useStore } from './store'
import { useBrowserMidi } from './hooks/useBrowserMidi'
import MidiDmxProcessor from './components/midi/MidiDmxProcessor'
import MidiDebugHelper from './components/midi/MidiDebugHelper'
import MidiDmxDebug from './components/midi/MidiDmxDebug'
import OscMonitor from './components/osc/OscMonitor'
import DebugInfo from './components/DebugInfo'
import { ThemeToggleButton } from './components/layout/ThemeToggleButton'
import { HelpOverlay } from './components/ui/HelpOverlay';
import './utils/midiTestUtils'
import { useSceneTransitionAnimation } from './hooks/useSceneTransitionAnimation';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // All hooks must be at the top level, outside of try-catch blocks
  const fetchInitialState = useStore((state) => state.fetchInitialState)
  // const isTransitioning = useStore((state) => state.isTransitioning); // Moved to useSceneTransitionAnimation
  // const currentTransitionFrame = useStore((state) => state.currentTransitionFrame); // Moved to useSceneTransitionAnimation
  // const setCurrentTransitionFrameId = useStore((state) => state.setCurrentTransitionFrameId); // Moved to useSceneTransitionAnimation
  
  const { browserInputs, connectBrowserInput, refreshDevices, isSupported } = useBrowserMidi();

  // Initialize Scene Transition Animation Hook
  useSceneTransitionAnimation();

  // Auto-connect to MIDI devices
  useEffect(() => {
    if (isSupported) {
      // Attempt to connect to any initially found devices
      if (browserInputs.length > 0) {
        browserInputs.forEach(input => {
          // Assuming connectBrowserInput handles cases where a device might already be connected
          // or an attempt is in progress.
          connectBrowserInput(input.id);
        });
      } else {
        console.log('[App] MIDI supported, but no inputs found initially. Will check periodically.');
      }

      // Periodically refresh devices to detect new connections
      const intervalId = setInterval(() => {
        refreshDevices();
      }, 10000); // Every 10 seconds

      // Cleanup function
      return () => {
        clearInterval(intervalId);
      };
    } else {
      console.log('[App] WebMIDI API not supported by this browser.');
    }  }, [connectBrowserInput, refreshDevices, isSupported, browserInputs]);
  useEffect(() => {
    // Fetch initial state
    fetchInitialState()
  }, [fetchInitialState])
  
  // Scene Transition Animation is handled by useSceneTransitionAnimation hook
  return (
    <ThemeProvider>
      <ChromaticEnergyManipulatorProvider>
        <SocketProvider>
          <DockingProvider>
            <PanelProvider>
              <ExternalWindowProvider>
                {/* Debug and background processors */}
                <div style={{ display: 'none' }}>
                  <MidiDmxProcessor />
                  <MidiDebugHelper />
                  <MidiDmxDebug />
                </div>
                {/* Main UI should live inside SocketProvider */}
                <HelpOverlay />
                <ThemeToggleButton />            
                <DebugInfo position="top-right" />
                <ErrorBoundary>
                  <Layout />
                </ErrorBoundary>
              </ExternalWindowProvider>
            </PanelProvider>
          </DockingProvider>
        </SocketProvider>
      </ChromaticEnergyManipulatorProvider>
    </ThemeProvider>
  );
}

export default App