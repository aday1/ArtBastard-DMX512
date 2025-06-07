import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store'; // Import Zustand store
// Create context with default values
const SocketContext = createContext({
    socket: null,
    connected: false,
    error: null,
    reconnect: () => { }
});
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
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
            socketInstance.on('masterClockUpdate', (data) => {
                console.log('[SocketContext] Received masterClockUpdate:', data);
                const { setMidiClockBpm, setMidiClockIsPlaying, setSelectedMidiClockHostId, setMidiClockBeatBar } = useStore.getState();
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
            socketInstance.on('availableClockSources', (sources) => {
                console.log('[SocketContext] Received availableClockSources:', sources);
                const { setAvailableMidiClockHosts } = useStore.getState();
                if (Array.isArray(sources)) {
                    setAvailableMidiClockHosts(sources);
                }
            });
            setSocket(socketInstance);
            // Cleanup function
            return () => {
                console.log('Cleaning up Socket.IO connection');
                if (socketInstance) {
                    socketInstance.off('masterClockUpdate');
                    socketInstance.off('availableClockSources');
                    socketInstance.disconnect();
                }
                setSocket(null);
                setConnected(false);
            };
        }
        catch (err) {
            console.error('Error initializing Socket.IO:', err);
            setError(`Failed to initialize connection: ${err instanceof Error ? err.message : String(err)}`);
            return () => { };
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
        }
        else {
            console.log('[SocketContext] No socket instance, creating new one');
            initSocket();
        }
    };
    return (_jsx(SocketContext.Provider, { value: { socket, connected, error, reconnect }, children: children }));
};
export const useSocket = () => {
    // The dynamic import of useStore for window.useStore can remain if it serves other purposes,
    // but for the listeners added above, the direct import of useStore is used.
    return useContext(SocketContext);
};
export default SocketContext;
