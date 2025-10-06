import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';

export const useGlobalBrowserMidi = () => {
  const [midiAccess, setMidiAccess] = useState<WebMidi.MIDIAccess | null>(null);
  const [browserMidiEnabled, setBrowserMidiEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<WebMidi.MIDIInput[]>([]);
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());

  const { addNotification } = useStore(state => ({
    addNotification: state.addNotification,
  }));

  // Initialize Web MIDI API
  useEffect(() => {
    const initMidi = async () => {
      try {
        if (navigator.requestMIDIAccess) {
          const access = await navigator.requestMIDIAccess({ sysex: false });
          setMidiAccess(access);
          setBrowserMidiEnabled(true);
          
          // Update inputs list
          const inputList = Array.from(access.inputs.values());
          setInputs(inputList);
          
          console.log('[GlobalBrowserMidi] Web MIDI initialized successfully');
          
          // Listen for state changes
          access.onstatechange = () => {
            const newInputs = Array.from(access.inputs.values());
            setInputs(newInputs);
            console.log('[GlobalBrowserMidi] MIDI devices changed:', newInputs.map(i => i.name));
          };
          
        } else {
          setError('Web MIDI API not supported in this browser');
          console.warn('[GlobalBrowserMidi] Web MIDI API not supported');
        }
      } catch (err: unknown) {
        console.error('[GlobalBrowserMidi] Failed to initialize Web MIDI:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      }
    };

    initMidi();
  }, []);

  // Connect to a browser MIDI input
  const connectBrowserInput = useCallback((inputId: string) => {
    if (!midiAccess) return;

    const input = midiAccess.inputs.get(inputId);
    if (!input) return;

    const handleMidiMessage = (event: WebMidi.MIDIMessageEvent) => {
      const [status, data1, data2] = event.data;
      const channel = status & 0x0F;
      const messageType = status & 0xF0;

      let messageToStore: any = {
        source: 'browser',
        timestamp: Date.now()
      };

      if (messageType === 0x90 && data2 > 0) { // Note On
        messageToStore = { 
          _type: 'noteon', 
          channel: channel, 
          note: data1, 
          velocity: data2, 
          source: 'browser',
          timestamp: Date.now()
        };
      } else if (messageType === 0x80 || (messageType === 0x90 && data2 === 0)) { // Note Off
        messageToStore = { 
          _type: 'noteoff', 
          channel: channel, 
          note: data1, 
          velocity: data2, 
          source: 'browser',
          timestamp: Date.now()
        };
      } else if (messageType === 0xB0) { // Control Change
        messageToStore = { 
          _type: 'cc', 
          channel: channel, 
          controller: data1, 
          value: data2, 
          source: 'browser',
          timestamp: Date.now()
        };
      }

      // Add message to store
      useStore.getState().addMidiMessage(messageToStore);
    };

    input.addEventListener('midimessage', handleMidiMessage);
    setActiveInputs(prev => new Set([...prev, inputId]));

    console.log('[GlobalBrowserMidi] Connected to input:', input.name);
    
    addNotification({
      message: `Connected to browser MIDI: ${input.name}`,
      type: 'success',
      priority: 'normal'
    });

    return () => {
      input.removeEventListener('midimessage', handleMidiMessage);
      setActiveInputs(prev => {
        const newSet = new Set(prev);
        newSet.delete(inputId);
        return newSet;
      });
    };
  }, [midiAccess, addNotification]);

  // Disconnect from a browser MIDI input
  const disconnectBrowserInput = useCallback((inputId: string) => {
    if (!midiAccess) return;

    const input = midiAccess.inputs.get(inputId);
    if (!input) return;

    // Remove all event listeners by cloning the input
    const newInput = input;
    setActiveInputs(prev => {
      const newSet = new Set(prev);
      newSet.delete(inputId);
      return newSet;
    });

    console.log('[GlobalBrowserMidi] Disconnected from input:', input.name);
    
    addNotification({
      message: `Disconnected from browser MIDI: ${input.name}`,
      type: 'info',
      priority: 'normal'
    });
  }, [midiAccess, addNotification]);

  // Refresh MIDI devices
  const refreshDevices = useCallback(() => {
    if (midiAccess) {
      const inputList = Array.from(midiAccess.inputs.values());
      setInputs(inputList);
      console.log('[GlobalBrowserMidi] Refreshed MIDI devices:', inputList.map(i => i.name));
    }
  }, [midiAccess]);

  return {
    isSupported: !!navigator.requestMIDIAccess,
    browserMidiEnabled,
    error,
    browserInputs: inputs,
    activeBrowserInputs: Array.from(activeInputs),
    connectBrowserInput,
    disconnectBrowserInput,
    refreshDevices,
  };
};
