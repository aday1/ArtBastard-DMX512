const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

console.log('Electron main.js starting...');
console.log('isDev:', isDev);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

// Native MIDI support
let midiInputs = [];
let midiOutputs = [];

// Try to load native MIDI modules
let easymidi, midi;
try {
  // Temporarily disable native MIDI to avoid version conflicts
  // easymidi = require('easymidi');
  // midi = require('midi');
  console.log('Native MIDI modules temporarily disabled - using Web MIDI API');
} catch (error) {
  console.log('Native MIDI modules not available:', error.message);
}

let mainWindow;

function createWindow() {
  console.log('Creating Electron window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'ArtBastard DMX512',
    show: true  // Show immediately instead of waiting
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3030' 
    : `file://${path.join(__dirname, '../react-app/dist/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('Failed to load URL:', error);
    // Show error page or retry
    mainWindow.loadURL('data:text/html,<h1>ArtBastard DMX512</h1><p>Loading...</p><p>If this persists, make sure the web server is running on port 3030</p>');
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    // Window is already visible, just focus it
    mainWindow.focus();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  initializeMidi();
  
  // macOS specific
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Initialize native MIDI
function initializeMidi() {
  if (!easymidi) {
    console.log('Native MIDI not available, using Web MIDI API');
    return;
  }

  try {
    // Get available MIDI inputs and outputs
    const inputs = easymidi.getInputs();
    const outputs = easymidi.getOutputs();
    
    console.log('Available MIDI inputs:', inputs);
    console.log('Available MIDI outputs:', outputs);
    
    midiInputs = inputs.map(name => ({ name, id: name }));
    midiOutputs = outputs.map(name => ({ name, id: name }));
    
    // Send MIDI device list to renderer
    if (mainWindow) {
      mainWindow.webContents.send('midi-devices-updated', {
        inputs: midiInputs,
        outputs: midiOutputs
      });
    }
    
  } catch (error) {
    console.error('Error initializing MIDI:', error);
  }
}

// IPC handlers for MIDI communication
ipcMain.handle('get-midi-devices', () => {
  return {
    inputs: midiInputs,
    outputs: midiOutputs
  };
});

ipcMain.handle('connect-midi-input', async (event, deviceId) => {
  if (!easymidi) {
    throw new Error('Native MIDI not available');
  }
  
  try {
    const input = new easymidi.Input(deviceId);
    
    input.on('message', (msg) => {
      // Forward MIDI message to renderer
      mainWindow.webContents.send('midi-message', {
        type: msg._type,
        channel: msg.channel,
        controller: msg.controller,
        note: msg.note,
        velocity: msg.velocity,
        value: msg.value,
        timestamp: Date.now()
      });
    });
    
    console.log(`Connected to MIDI input: ${deviceId}`);
    return { success: true, deviceId };
    
  } catch (error) {
    console.error(`Error connecting to MIDI input ${deviceId}:`, error);
    throw error;
  }
});

ipcMain.handle('disconnect-midi-input', async (event, deviceId) => {
  // MIDI input cleanup would go here
  console.log(`Disconnected MIDI input: ${deviceId}`);
  return { success: true, deviceId };
});

ipcMain.handle('send-midi-message', async (event, message) => {
  if (!easymidi) {
    throw new Error('Native MIDI not available');
  }
  
  try {
    // MIDI output functionality would go here
    console.log('MIDI output message:', message);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending MIDI message:', error);
    throw error;
  }
});

// Menu setup
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-action', 'new-project');
        }
      },
      {
        label: 'Open Project',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          mainWindow.webContents.send('menu-action', 'open-project');
        }
      },
      {
        label: 'Save Project',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          mainWindow.webContents.send('menu-action', 'save-project');
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'MIDI',
    submenu: [
      {
        label: 'Refresh MIDI Devices',
        click: () => {
          initializeMidi();
        }
      },
      {
        label: 'MIDI Monitor',
        click: () => {
          mainWindow.webContents.send('menu-action', 'toggle-midi-monitor');
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.reload();
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.toggleDevTools();
        }
      },
      { type: 'separator' },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+=',
        click: () => {
          const current = mainWindow.webContents.getZoomFactor();
          mainWindow.webContents.setZoomFactor(Math.min(3, current + 0.1));
        }
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => {
          const current = mainWindow.webContents.getZoomFactor();
          mainWindow.webContents.setZoomFactor(Math.max(0.5, current - 0.1));
        }
      },
      {
        label: 'Reset Zoom',
        accelerator: 'CmdOrCtrl+0',
        click: () => {
          mainWindow.webContents.setZoomFactor(1.0);
        }
      },
      { type: 'separator' },
      {
        label: 'Toggle Fullscreen',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
        click: () => {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About ArtBastard DMX512',
        click: () => {
          mainWindow.webContents.send('menu-action', 'show-about');
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
