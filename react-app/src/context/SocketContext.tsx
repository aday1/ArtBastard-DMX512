import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store'; // Import Zustand store

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  reconnect: () => void;
}

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  error: null,
  reconnect: () => {}
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initSocket = () => {
    try {
      // Clear any previous errors
      setError(null);
      
      // Initialize socket with error handling
      console.log('Initializing Socket.IO connection');
      
      // Use window.location to automatically connect to the correct host
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3030'; // Explicitly set the backend URL in development (Updated to 3030)
        
      console.log(`[SocketContext] Connecting to socket at: ${socketUrl}`);
      
      const socketInstance = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true,
        autoConnect: true,
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('Socket.IO connected');
        setConnected(true);
        setError(null);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log(`Socket.IO disconnected: ${reason}`);
        setConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error(`Socket.IO connection error: ${err.message}`);
        setConnected(false);
        setError(`Connection error: ${err.message}`);
      });

      socketInstance.on('error', (err) => {
        console.error(`Socket.IO error: ${err}`);
        setError(`Socket error: ${err}`);
      });
      
      // Handle JSON parsing errors specifically
      socketInstance.on('parse_error', (err) => {
        console.error(`Socket.IO parse error: ${err}`);
        setError(`Data parsing error. Try refreshing the page.`);
      });

      // Listen for masterClockUpdate from backend
      socketInstance.on('masterClockUpdate', (data: any) => {
        console.log('[SocketContext] Received masterClockUpdate:', data);
        const {
          setMidiClockBpm,
          setMidiClockIsPlaying,
          setSelectedMidiClockHostId,
          setMidiClockBeatBar
        } = useStore.getState();

        if (data && typeof data.bpm === 'number') {
          setMidiClockBpm(data.bpm);
        }
        if (data && typeof data.isPlaying === 'boolean') {
          setMidiClockIsPlaying(data.isPlaying);
        }
        if (data && typeof data.source === 'string') {
          setSelectedMidiClockHostId(data.source);
        }
        if (data && typeof data.beat === 'number' && typeof data.bar === 'number') {
          setMidiClockBeatBar(data.beat, data.bar);
        }
      });

      // Listen for availableClockSources from backend
      socketInstance.on('availableClockSources', (sources: Array<{ id: string; name: string }>) => {
        console.log('[SocketContext] Received availableClockSources:', sources);
        const { setAvailableMidiClockHosts } = useStore.getState();
        if (Array.isArray(sources)) {
          setAvailableMidiClockHosts(sources);
        }
      });

      // Listen for MIDI clock input list
      socketInstance.on('midiClockInputs', (payload: { inputs: string[]; currentInput: string | null }) => {
        console.log('[SocketContext] Received midiClockInputs:', payload);
        // For now, store them inside availableMidiClockHosts with special prefix or just log.
        // Could extend store with dedicated state later.
      });

      // Listen for MIDI clock input changed broadcast
      socketInstance.on('midiClockInputChanged', ({ inputName }: { inputName: string }) => {
        console.log('[SocketContext] MIDI clock input changed to:', inputName);
      });

      // Listen for DMX channel updates from backend
      socketInstance.on('dmxUpdate', ({ channel, value }: { channel: number; value: number }) => {
        console.log('[SocketContext] Received DMX update:', { channel, value });
        // Update the store with the new DMX channel value (don't send back to backend to avoid loops)
        const store = useStore.getState();
        store.setDmxChannel(channel, value, false);
      });

      // Listen for restored DMX state from backend (on startup)
      socketInstance.on('dmxStateRestored', ({ dmxChannels }: { dmxChannels: number[] }) => {
        console.log('[SocketContext] Received restored DMX state:', dmxChannels.length, 'channels');
        console.log('[SocketContext] Non-zero channels:', dmxChannels.filter(val => val > 0).length);
        
        // Update all DMX channels with the restored state using bulk update
        const updates: Record<number, number> = {};
        dmxChannels.forEach((value, index) => {
          updates[index] = value;
        });
        
        const store = useStore.getState();
        store.setMultipleDmxChannels(updates, false); // Don't send back to backend to avoid loops
        console.log('[SocketContext] Applied restored DMX state to frontend');
      });

      // Listen for ACTS save events from frontend
      const handleSaveActs = (event: CustomEvent) => {
        console.log('[SocketContext] Saving ACTS to backend:', event.detail.length, 'acts');
        socketInstance.emit('saveActs', event.detail);
      };
      
      window.addEventListener('saveActsToBackend', handleSaveActs as EventListener);

      // Listen for fixtures updates from backend (multi-window sync)
      socketInstance.on('fixturesUpdated', (fixturesData: any[]) => {
        console.log('[SocketContext] Received fixtures update from backend:', fixturesData.length, 'fixtures');
        const store = useStore.getState();
        store.setFixtures(fixturesData);
      });

      socketInstance.on('fixturesLoaded', (fixturesData: any[]) => {
        console.log('[SocketContext] Received fixtures loaded from backend:', fixturesData.length, 'fixtures');
        const store = useStore.getState();
        store.setFixtures(fixturesData);
      });

      // Listen for groups updates from backend (multi-window sync)
      socketInstance.on('groupsUpdated', (groupsData: any[]) => {
        console.log('[SocketContext] Received groups update from backend:', groupsData.length, 'groups');
        const store = useStore.getState();
        store.setGroups(groupsData);
      });

      socketInstance.on('groupsLoaded', (groupsData: any[]) => {
        console.log('[SocketContext] Received groups loaded from backend:', groupsData.length, 'groups');
        const store = useStore.getState();
        store.setGroups(groupsData);
      });

      // Listen for quick scene save/load events
      socketInstance.on('quickSceneSaved', (data: { name: string; slot?: number; timestamp: number }) => {
        console.log('[SocketContext] Quick scene saved:', data.name);
        const store = useStore.getState();
        store.addNotification({
          message: `Quick scene saved: ${data.name}`,
          type: 'success',
          priority: 'low'
        });
      });

      socketInstance.on('quickSceneLoaded', (data: { name: string; slot?: number; timestamp: number }) => {
        console.log('[SocketContext] Quick scene loaded:', data.name);
        const store = useStore.getState();
        store.addNotification({
          message: `Quick scene loaded: ${data.name}`,
          type: 'info',
          priority: 'low'
        });
      });

      socketInstance.on('quickSceneLoadError', (data: { slot: number; error: string }) => {
        console.log('[SocketContext] Quick scene load error:', data.error);
        const store = useStore.getState();
        store.addNotification({
          message: `Quick scene load failed: ${data.error}`,
          type: 'error',
          priority: 'low'
        });
      });

      // Listen for scene loaded events from backend
      socketInstance.on('sceneLoaded', ({ name, channelValues }: { name: string; channelValues: number[] }) => {
        console.log('[SocketContext] Received scene loaded:', { name, channelValues });
        console.log('[SocketContext] Channel values length:', channelValues.length);
        console.log('[SocketContext] First 10 channel values:', channelValues.slice(0, 10));
        
        // Cancel any ongoing frontend transition FIRST since backend has loaded the scene
        const store = useStore.getState();
        if (store.isTransitioning && store.currentTransitionFrame) {
          window.cancelAnimationFrame(store.currentTransitionFrame);
          useStore.setState({ currentTransitionFrame: null, isTransitioning: false });
          console.log('[SocketContext] Cancelled frontend transition for backend scene load');
        }
        
        // Update all DMX channels with the scene values using bulk update
        const updates: Record<number, number> = {};
        channelValues.forEach((value, index) => {
          updates[index] = value;
        });
        console.log('[SocketContext] About to call setMultipleDmxChannels with updates:', Object.keys(updates).length, 'channels');
        store.setMultipleDmxChannels(updates, false); // Don't send back to backend to avoid loops
        console.log('[SocketContext] Applied scene values to DMX channels');
      });

      setSocket(socketInstance);

      // Cleanup function
      return () => {
        console.log('Cleaning up Socket.IO connection');
        if (socketInstance) {
          socketInstance.off('masterClockUpdate');
          socketInstance.off('availableClockSources');
          socketInstance.off('midiClockInputs');
          socketInstance.off('midiClockInputChanged');
          socketInstance.off('dmxUpdate');
          socketInstance.off('dmxStateRestored');
          socketInstance.off('sceneLoaded');
          socketInstance.off('fixturesUpdated');
          socketInstance.off('fixturesLoaded');
          socketInstance.off('groupsUpdated');
          socketInstance.off('groupsLoaded');
          socketInstance.off('quickSceneSaved');
          socketInstance.off('quickSceneLoaded');
          socketInstance.off('quickSceneLoadError');
          socketInstance.disconnect();
        }
        window.removeEventListener('saveActsToBackend', handleSaveActs as EventListener);
        setSocket(null);
        setConnected(false);
      };
    } catch (err) {
      console.error('Error initializing Socket.IO:', err);
      setError(`Failed to initialize connection: ${err instanceof Error ? err.message : String(err)}`);
      return () => {};
    }
  };

  // Initialize socket on component mount
  useEffect(() => {
    const cleanup = initSocket();
    return cleanup;
  }, []);

  // Function to manually reconnect
  const reconnect = () => {
    console.log('[SocketContext] Manual reconnection requested');
    if (socket) {
      console.log('[SocketContext] Disconnecting existing socket...');
      socket.disconnect();
      socket.connect(); // Try to reconnect the existing socket first
      console.log('[SocketContext] Socket reconnection initiated');
    } else {
      console.log('[SocketContext] No socket instance, creating new one');
      initSocket();
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, error, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  // The dynamic import of useStore for window.useStore can remain if it serves other purposes,
  // but for the listeners added above, the direct import of useStore is used.
  return useContext(SocketContext);
};

export type { SocketContextType }; // Exporting type separately

export default SocketContext;