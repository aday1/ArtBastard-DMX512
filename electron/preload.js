const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // MIDI functionality
  getMidiDevices: () => ipcRenderer.invoke('get-midi-devices'),
  connectMidiInput: (deviceId) => ipcRenderer.invoke('connect-midi-input', deviceId),
  disconnectMidiInput: (deviceId) => ipcRenderer.invoke('disconnect-midi-input', deviceId),
  sendMidiMessage: (message) => ipcRenderer.invoke('send-midi-message', message),
  
  // Event listeners
  onMidiDevicesUpdated: (callback) => {
    ipcRenderer.on('midi-devices-updated', callback);
  },
  onMidiMessage: (callback) => {
    ipcRenderer.on('midi-message', callback);
  },
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// Log that preload script loaded
console.log('Electron preload script loaded');
