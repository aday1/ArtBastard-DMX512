import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useStore } from '../store';
export const useBrowserMidi = () => {
    const [midiAccess, setMidiAccess] = useState(null);
    const [browserMidiEnabled, setBrowserMidiEnabled] = useState(false);
    const [inputs, setInputs] = useState([]);
    const [error, setError] = useState(null);
    const [activeBrowserInputs, setActiveBrowserInputs] = useState(new Set());
    const { socket, connected: socketConnected } = useSocket();
    const { addNotification, addMidiMessage: addMidiMessageToStore, midiLearnTarget, updateMasterSlider, cancelMidiLearn, } = useStore(state => ({
        addNotification: state.addNotification,
        addMidiMessage: state.addMidiMessage,
        midiLearnTarget: state.midiLearnTarget,
        updateMasterSlider: state.updateMasterSlider,
        cancelMidiLearn: state.cancelMidiLearn,
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
                    addNotification({
                        message: 'Browser MIDI initialized successfully',
                        type: 'success',
                        priority: 'normal'
                    });
                }
                else {
                    setError('Web MIDI API not supported in this browser');
                    addNotification({
                        message: 'Web MIDI API not supported in this browser',
                        type: 'error',
                        priority: 'high'
                    });
                }
            }
            catch (err) {
                console.error('[useBrowserMidi] Failed to initialize Web MIDI:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                addNotification({
                    message: `MIDI initialization failed: ${errorMessage}`,
                    type: 'error',
                    priority: 'high'
                });
            }
        };
        initMidi();
    }, [addNotification]);
    // Handle state changes
    const handleStateChange = useCallback((event) => {
        if (midiAccess) {
            const inputList = Array.from(midiAccess.inputs.values());
            setInputs(inputList);
            const portName = event.port.name || 'Unknown device';
            addNotification({
                message: `MIDI device ${portName} ${event.port.state}`,
                type: event.port.state === 'connected' ? 'success' : 'info',
                priority: 'normal'
            });
            if (event.port.state === 'disconnected') {
                setActiveBrowserInputs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(event.port.id);
                    console.log(`[useBrowserMidi] Device ${portName} disconnected, removed from active inputs.`);
                    return newSet;
                });
            }
        }
    }, [midiAccess, addNotification]);
    useEffect(() => {
        if (midiAccess) {
            midiAccess.onstatechange = handleStateChange;
            return () => {
                if (midiAccess) {
                    midiAccess.onstatechange = null;
                }
            };
        }
    }, [midiAccess, handleStateChange]);
    // Set up MIDI message handlers for active inputs
    useEffect(() => {
        if (!midiAccess)
            return;
        const handleMidiMessage = (event) => {
            const [status, data1, data2] = event.data;
            const messageType = status >> 4;
            const channel = status & 0xf; // MIDI channel 0-15, often displayed as 1-16
            const sourceInput = event.target;
            const source = sourceInput?.name || 'Browser MIDI';
            console.log(`[useBrowserMidi] Raw MIDI from ${source} (ID: ${sourceInput?.id}):`, event.data);
            // --- MIDI Learn Logic for Master Sliders ---
            if (midiLearnTarget && midiLearnTarget.type === 'masterSlider') {
                let learnedMapping = null;
                if (messageType === 0xB) { // Control Change
                    learnedMapping = { channel: channel + 1, controller: data1 }; // Store channel as 1-16
                }
                else if (messageType === 0x9 && data2 > 0) { // Note On (velocity > 0)
                    learnedMapping = { channel: channel + 1, note: data1 }; // Store channel as 1-16
                }
                // Could also handle Note Off for learning if desired, e.g. for toggle or specific off actions
                if (learnedMapping) {
                    console.log(`[useBrowserMidi] Learned MIDI for Master Slider ID ${midiLearnTarget.id}:`, learnedMapping);
                    updateMasterSlider(midiLearnTarget.id, { midiMapping: learnedMapping });
                    addNotification({
                        message: `MIDI control learned for Master Slider.`,
                        type: 'success',
                        priority: 'normal'
                    });
                    cancelMidiLearn(); // Clear learn mode
                    return; // Message consumed by learn mode
                }
            }
            // --- End MIDI Learn Logic ---
            // --- Normal MIDI Message Processing ---
            let messageToStore = null;
            if (messageType === 0x9) { // Note On
                messageToStore = { _type: 'noteon', channel: channel + 1, note: data1, velocity: data2, source };
            }
            else if (messageType === 0x8) { // Note Off
                messageToStore = { _type: 'noteoff', channel: channel + 1, note: data1, velocity: data2, source };
            }
            else if (messageType === 0xB) { // Control Change
                messageToStore = { _type: 'cc', channel: channel + 1, controller: data1, value: data2, source };
            }
            if (messageToStore) {
                if (socket && socketConnected) {
                    socket.emit('browserMidiMessage', messageToStore);
                }
                else {
                    // console.warn('[useBrowserMidi] Socket not connected. MIDI message not sent to server.')
                }
                if (addMidiMessageToStore) {
                    addMidiMessageToStore(messageToStore);
                }
                else {
                    console.error('[useBrowserMidi] addMidiMessage action not found in store');
                }
            }
        };
        // Detach listeners from all inputs first to prevent duplicates on re-renders
        midiAccess.inputs.forEach(input => {
            if (input.onmidimessage) {
                input.onmidimessage = null;
            }
        });
        // Attach listeners only to currently active inputs
        activeBrowserInputs.forEach(inputId => {
            const input = midiAccess.inputs.get(inputId);
            if (input) {
                console.log(`[useBrowserMidi] Attaching listener to active input: ${input.name} (ID: ${input.id})`);
                input.onmidimessage = handleMidiMessage;
            }
            else {
                console.warn(`[useBrowserMidi] Active input ID ${inputId} not found in midiAccess.inputs during listener attachment.`);
            }
        });
        return () => {
            // Cleanup: Detach listeners from all inputs that might have had them
            midiAccess.inputs.forEach(input => {
                if (input.onmidimessage) {
                    input.onmidimessage = null;
                }
            });
        };
    }, [midiAccess, socket, socketConnected, activeBrowserInputs, addMidiMessageToStore, midiLearnTarget, updateMasterSlider, cancelMidiLearn, addNotification]);
    // Connect to a MIDI input
    const connectBrowserInput = useCallback((inputId) => {
        if (!midiAccess) {
            addNotification({
                message: 'MIDI Access not available.',
                type: 'error',
                priority: 'high'
            });
            return;
        }
        const input = midiAccess.inputs.get(inputId);
        if (input) {
            setActiveBrowserInputs(prev => new Set(prev).add(inputId));
            addNotification({
                message: `Connecting to MIDI device: ${input.name}`,
                type: 'info',
                priority: 'normal'
            });
            console.log(`[useBrowserMidi] Added ${input.name} (ID: ${inputId}) to active inputs. Listener will be (re)attached.`);
        }
        else {
            addNotification({
                message: `MIDI Input device with ID ${inputId} not found.`,
                type: 'error',
                priority: 'normal'
            });
        }
    }, [midiAccess, addNotification]);
    // Disconnect from a MIDI input
    const disconnectBrowserInput = useCallback((inputId) => {
        if (!midiAccess)
            return;
        const input = midiAccess.inputs.get(inputId);
        if (input) {
            setActiveBrowserInputs(prev => {
                const newSet = new Set(prev);
                newSet.delete(inputId);
                return newSet;
            });
            addNotification({
                message: `Disconnected from MIDI device: ${input.name}`,
                type: 'info',
                priority: 'normal'
            });
            console.log(`[useBrowserMidi] Removed ${input.name} (ID: ${inputId}) from active inputs. Listener will be detached.`);
        }
        else {
            addNotification({
                message: `MIDI Input device with ID ${inputId} not found for disconnection.`,
                type: 'error',
                priority: 'normal'
            });
        }
    }, [midiAccess, addNotification]);
    // Refresh MIDI devices list
    const refreshDevices = useCallback(() => {
        if (midiAccess) {
            const inputList = Array.from(midiAccess.inputs.values());
            setInputs(inputList);
            addNotification({
                message: 'MIDI device list refreshed',
                type: 'info',
                priority: 'low'
            });
            console.log('[useBrowserMidi] Refreshed MIDI devices list:', inputList);
        }
        else {
            addNotification({
                message: 'MIDI Access not available to refresh devices.',
                type: 'error',
                priority: 'normal'
            });
        }
    }, [midiAccess, addNotification]);
    return {
        isSupported: browserMidiEnabled,
        error,
        browserInputs: inputs,
        activeBrowserInputs,
        connectBrowserInput,
        disconnectBrowserInput,
        refreshDevices,
        midiAccess
    };
};
