import React, { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import { useStore } from './store'
import MainPage from './pages/MainPage'
import { useBrowserMidi } from './hooks/useBrowserMidi'; // Import the hook
import MidiDmxProcessor from './components/midi/MidiDmxProcessor';
import MidiDebugHelper from './components/midi/MidiDebugHelper';
import MidiDmxDebug from './components/midi/MidiDmxDebug';
import './utils/midiTestUtils'; // Import MIDI testing utilities

function App() {
  const fetchInitialState = useStore((state) => state.fetchInitialState)
  
  // Use the hook and get the returned values - particularly browserInputs and connectBrowserInput
  const { browserInputs, connectBrowserInput, refreshDevices, isSupported } = useBrowserMidi();

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
    let frameId: number | null = null; // Local frameId for this specific tick sequence

    const tick = () => {
      // Directly get latest state from store inside tick function
      const currentState = useStore.getState(); 

      if (!currentState.isTransitioning || !currentState.transitionStartTime || !currentState.fromDmxValues || !currentState.toDmxValues) {
        // If transition was externally stopped or data is missing, ensure no frame is scheduled.
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
        // setCurrentTransitionFrameId(null) is handled by clearTransitionState
      } else {
        // Request next frame and update store with the new frameId
        frameId = requestAnimationFrame(tick);
        currentState.setCurrentTransitionFrameId(frameId);
      }
    };

    if (isTransitioning) {
      // If a transition is flagged to start:
      // Cancel any old frame that might somehow be lingering from a previous, incomplete transition.
      // The loadScene action should also ideally cancel any existing frame.
      if (currentTransitionFrame) {
          cancelAnimationFrame(currentTransitionFrame);
      }
      // Start the new animation loop
      frameId = requestAnimationFrame(tick);
      setCurrentTransitionFrameId(frameId);
    } else {
      // If transition was stopped externally (isTransitioning became false in store)
      if (currentTransitionFrame) {
        cancelAnimationFrame(currentTransitionFrame);
        setCurrentTransitionFrameId(null); 
        // clearTransitionState() should ideally be called by whatever action caused isTransitioning to become false.
      }
    }

    // Cleanup function for the useEffect hook
    return () => {
      // When the App component unmounts or dependencies change causing effect re-run.
      // Access the *latest* currentTransitionFrame from the store for cleanup.
      const latestFrameIdInStore = useStore.getState().currentTransitionFrame;
      if (latestFrameIdInStore) {
        cancelAnimationFrame(latestFrameIdInStore);
        // If the effect is cleaning up because isTransitioning became false,
        // setCurrentTransitionFrameId(null) might already be called or will be by clearTransitionState.
        // If App is unmounting, it's good to clear it.
        setCurrentTransitionFrameId(null); 
      }
    };
  }, [
    isTransitioning, 
    // Actions are stable, so not strictly needed as deps, but good for clarity
    setCurrentTransitionFrameId, 
    // currentTransitionFrame is needed to correctly cancel frames if it changes externally
    // while this effect is active or about to clean up.
    currentTransitionFrame 
  ]);


  return (
    <ThemeProvider children={
      <SocketProvider children={
        <>
          {/* This component processes MIDI messages and updates DMX channels */}
          <MidiDmxProcessor />
          {/* This component provides keyboard shortcuts to test MIDI functionality */}
          <MidiDebugHelper />
          {/* This component helps debug MIDI to DMX communication issues */}
          <MidiDmxDebug />
          <Layout children={
            <MainPage />
          } />
        </>
      } />
    } />
  )
}

export default App