import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';

// Native Electron MIDI hook
export const useElectronMidi = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<{inputs: any[], outputs: any[]}>({ inputs: [], outputs: [] });
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { addMidiMessage } = useStore();

  // Check if we're running in Electron
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron) {
      setError('Not running in Electron - native MIDI not available');
      return;
    }

    setIsSupported(true);
    loadMidiDevices();

    // Set up event listeners
    const handleMidiDevicesUpdated = (event: any, data: any) => {
      console.log('[ElectronMidi] MIDI devices updated:', data);
      setDevices(data);
    };

    const handleMidiMessage = (event: any, message: any) => {
      console.log('[ElectronMidi] MIDI message received:', message);
      
      // Convert to the format expected by the store
      const midiMessage = {
        _type: message.type,
        channel: message.channel,
        controller: message.controller,
        note: message.note,
        velocity: message.velocity,
        value: message.value,
        timestamp: message.timestamp
      };
      
      addMidiMessage(midiMessage);
    };

    const handleMenuAction = (event: any, action: string) => {
      console.log('[ElectronMidi] Menu action:', action);
      if (action === 'toggle-midi-monitor') {
        // Handle MIDI monitor toggle
      }
    };

    // Register event listeners
    (window as any).electronAPI.onMidiDevicesUpdated(handleMidiDevicesUpdated);
    (window as any).electronAPI.onMidiMessage(handleMidiMessage);
    (window as any).electronAPI.onMenuAction(handleMenuAction);

    return () => {
      // Cleanup listeners
      (window as any).electronAPI.removeAllListeners('midi-devices-updated');
      (window as any).electronAPI.removeAllListeners('midi-message');
      (window as any).electronAPI.removeAllListeners('menu-action');
    };
  }, [isElectron, addMidiMessage]);

  const loadMidiDevices = useCallback(async () => {
    if (!isElectron) return;

    try {
      setIsRefreshing(true);
      const deviceData = await (window as any).electronAPI.getMidiDevices();
      console.log('[ElectronMidi] Loaded MIDI devices:', deviceData);
      setDevices(deviceData);
      setError(null);
    } catch (err) {
      console.error('[ElectronMidi] Error loading MIDI devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load MIDI devices');
    } finally {
      setIsRefreshing(false);
    }
  }, [isElectron]);

  const connectDevice = useCallback(async (deviceId: string) => {
    if (!isElectron) return;

    try {
      console.log('[ElectronMidi] Connecting to device:', deviceId);
      await (window as any).electronAPI.connectMidiInput(deviceId);
      setConnectedDevices(prev => [...prev, deviceId]);
      setError(null);
    } catch (err) {
      console.error('[ElectronMidi] Error connecting to device:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to MIDI device');
    }
  }, [isElectron]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    if (!isElectron) return;

    try {
      console.log('[ElectronMidi] Disconnecting from device:', deviceId);
      await (window as any).electronAPI.disconnectMidiInput(deviceId);
      setConnectedDevices(prev => prev.filter(id => id !== deviceId));
      setError(null);
    } catch (err) {
      console.error('[ElectronMidi] Error disconnecting from device:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect from MIDI device');
    }
  }, [isElectron]);

  const sendMidiMessage = useCallback(async (message: any) => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.sendMidiMessage(message);
    } catch (err) {
      console.error('[ElectronMidi] Error sending MIDI message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send MIDI message');
    }
  }, [isElectron]);

  return {
    isSupported,
    error,
    devices,
    connectedDevices,
    isRefreshing,
    loadMidiDevices,
    connectDevice,
    disconnectDevice,
    sendMidiMessage,
    isElectron
  };
};
