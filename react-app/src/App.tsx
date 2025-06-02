import React, { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import { useStore } from './store'
import MainPage from './pages/MainPage'
import { useBrowserMidi } from './hooks/useBrowserMidi'
import MidiDmxProcessor from './components/midi/MidiDmxProcessor'
import MidiDebugHelper from './components/midi/MidiDebugHelper'
import MidiDmxDebug from './components/midi/MidiDmxDebug'
import OscMonitor from './components/osc/OscMonitor'
import DebugInfo from './components/DebugInfo'
import { ThemeToggleButton } from './components/layout/ThemeToggleButton'; // Import ThemeToggleButton
import './utils/midiTestUtils'

function App() {
  console.log('[App] Component initializing...');
  
  // All hooks must be at the top level, outside of try-catch blocks
  const fetchInitialState = useStore((state) => state.fetchInitialState)
  const isTransitioning = useStore((state) => state.isTransitioning);
  const currentTransitionFrame = useStore((state) => state.currentTransitionFrame);
  const setCurrentTransitionFrameId = useStore((state) => state.setCurrentTransitionFrameId);
  
  console.log('[App] Store hooks initialized');
  
  const { browserInputs, connectBrowserInput, refreshDevices, isSupported } = useBrowserMidi();
  console.log('[App] MIDI hook initialized, isSupported:', isSupported);

  // Auto-connect to MIDI devices
  useEffect(() => {
    if (isSupported && browserInputs.length > 0) {
      console.log('[App] Found MIDI inputs:', browserInputs.length);
      // Automatically connect to all available MIDI devices
      browserInputs.forEach(input => {
        console.log(`[App] Auto-connecting to MIDI device: ${input.name} (ID: ${input.id})`);
        connectBrowserInput(input.id);
      });
      
      // Trigger refreshDevices periodically to check for new MIDI devices
      const intervalId = setInterval(() => {
        console.log('[App] Refreshing MIDI device connections...');
        refreshDevices();
      }, 10000); // Every 10 seconds
      
      return () => clearInterval(intervalId);
    } else if (isSupported) {
      console.log('[App] MIDI supported but no inputs found. Will retry in 5s...');
      // If no inputs found but MIDI is supported, try refreshing after a delay
      const timeoutId = setTimeout(() => {
        console.log('[App] Refreshing MIDI devices...');
        refreshDevices();
      }, 5000);
      return () => clearTimeout(timeoutId);
    } else {
      console.log('[App] WebMIDI API not supported by this browser.');
    }
  }, [browserInputs, connectBrowserInput, refreshDevices, isSupported]);

  useEffect(() => {
    // Initialize global store reference
    if (typeof window !== 'undefined' && !window.useStore) {
      window.useStore = useStore;
      console.log('Global store reference initialized in App component');
    }
    
    // Fetch initial state
    fetchInitialState()
  }, [fetchInitialState])

  // Scene Transition Animation Loop
  useEffect(() => {
    let frameId: number | null = null;

    const tick = () => {
      const currentState = useStore.getState(); 

      if (!currentState.isTransitioning || !currentState.transitionStartTime || !currentState.fromDmxValues || !currentState.toDmxValues) {
        if (currentState.currentTransitionFrame) {
          cancelAnimationFrame(currentState.currentTransitionFrame);
          currentState.setCurrentTransitionFrameId(null);
        }
        return;
      }

      const now = Date.now();
      const elapsed = now - currentState.transitionStartTime;
      const progress = Math.min(elapsed / currentState.transitionDuration, 1);

      const newDmxValues = new Array(512).fill(0);
      for (let i = 0; i < 512; i++) {
        const fromVal = currentState.fromDmxValues[i] || 0;
        const toVal = currentState.toDmxValues[i] || 0;
        newDmxValues[i] = Math.round(fromVal + (toVal - fromVal) * progress);
      }
      
      currentState.setDmxChannelsForTransition(newDmxValues);

      if (progress >= 1) {
        currentState.clearTransitionState(); 
      } else {
        frameId = requestAnimationFrame(tick);
        currentState.setCurrentTransitionFrameId(frameId);
      }
    };

    if (isTransitioning) {
      if (currentTransitionFrame) {
        cancelAnimationFrame(currentTransitionFrame);
      }
      frameId = requestAnimationFrame(tick);
      setCurrentTransitionFrameId(frameId);
    } else {
      if (currentTransitionFrame) {
        cancelAnimationFrame(currentTransitionFrame);
        setCurrentTransitionFrameId(null);
      }
    }

    return () => {
      const latestFrameIdInStore = useStore.getState().currentTransitionFrame;
      if (latestFrameIdInStore) {
        cancelAnimationFrame(latestFrameIdInStore);
        setCurrentTransitionFrameId(null); 
      }
    };
  }, [isTransitioning, setCurrentTransitionFrameId, currentTransitionFrame]);

  console.log('[App] About to render JSX...');

  try {
    return (
      <ThemeProvider>
        <SocketProvider>
          {/* Debug and background processors */}
          <div style={{ display: 'none' }}>
            <MidiDmxProcessor />
            <MidiDebugHelper />
            <MidiDmxDebug />
            <OscMonitor />
          </div>
          {/* Main UI should live inside SocketProvider */}
          <ThemeToggleButton />
          <DebugInfo position="top-right" />
          <Layout>
            <MainPage />
          </Layout>
        </SocketProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('[App] Error during render:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>App Render Error</h1>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
        <pre>{error instanceof Error ? error.stack : ''}</pre>
      </div>
    );
  }
}

export default App