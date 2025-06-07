import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { log } from './logger'; // Import from logger instead of index
import { 
  setDmxChannel, 
  learnMidiMapping, 
  loadScene, 
  saveScene, 
  updateScene,
  loadConfig, 
  saveConfig, 
  clearMidiMappings,
  loadScenes,
  saveScenes,
  pingArtNetDevice,
  updateArtNetConfig,
  updateOscAssignment,
  updateOscConfig, // Added import
  getDmxChannels, // Added import
  getChannelNames // Added import
} from './index';

const DATA_DIR = path.join(__dirname, '..', 'data');
const EXPORT_FILE = path.join(DATA_DIR, 'all_settings.json');

// Add type definitions for global variables
declare global {
  namespace NodeJS {
    interface Global {
      io: Server
      activeMidiInputs: { [key: string]: any }
      artnetSender: any
      artNetPingStatus: string // Added global variable
    }
  }
}

// Create API router
const apiRouter = express.Router();

// Add error handling middleware to ensure all responses are valid JSON
apiRouter.use((req, res, next) => {
  // Store the original res.json function
  const originalJson = res.json;
  
  // Override res.json to ensure it always sends valid JSON
  res.json = function(data) {
    // Make sure response has proper content type
    res.contentType('application/json');
    
    // Ensure data is an object that can be serialized
    if (data === undefined || data === null) {
      data = {};
    }
    
    // Call original json method with our processed data
    return originalJson.call(this, data);
  };
  
  // Continue with request chain
  next();
});

// Middleware to parse JSON
apiRouter.use(express.json());

// Add global error handler for API routes
apiRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log('API error', 'ERROR', { message: err.message, path: req.path, method: req.method });
  if (!res.headersSent) {
    res.status(500).json({ 
      error: `Server error: ${err.message}`, 
      success: false 
    });
  }
  next(err);
});

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  const io = global.io;
  
  // Get socket connection stats
  const stats = {
    serverStatus: 'healthy',
    socketConnections: io?.engine?.clientsCount || 0,
    socketStatus: io?.sockets?.sockets?.size > 0 ? 'listening' : 'not listening',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    midiDevicesConnected: Object.keys(global.activeMidiInputs || {}).length,
    artnetStatus: (global as any).artNetPingStatus || 'unknown' // Use the detailed ping status
  };
  
  // Determine overall health
  const isHealthy = stats.serverStatus === 'healthy' && stats.socketStatus === 'listening';
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    ...stats
  });
});

// Logs endpoints
apiRouter.get('/logs', (req, res) => {
  try {
    const LOGS_DIR = path.join(__dirname, '..', 'logs');
    const LOG_FILE = path.join(LOGS_DIR, 'app.log');
    
    // Check if log file exists
    if (!fs.existsSync(LOG_FILE)) {
      res.type('text/plain').send('');
      return;
    }
    
    // Read the log file content
    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    res.type('text/plain').send(logContent);
  } catch (error) {
    log('Error reading log file', 'ERROR', { error });
    res.status(500).type('text/plain').send('Error reading log file');
  }
});

apiRouter.post('/logs/clear', (req, res) => {
  try {
    const LOGS_DIR = path.join(__dirname, '..', 'logs');
    const LOG_FILE = path.join(LOGS_DIR, 'app.log');
    
    // Clear the log file by writing an empty string
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '');
    }
    
    log('Log file cleared via API', 'SYSTEM');
    res.json({ success: true, message: 'Logs cleared successfully' });
  } catch (error) {
    log('Error clearing log file', 'ERROR', { error });
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// Helper functions for fixtures data
const loadFixturesData = () => {
  try {
    const fixturesPath = path.join(DATA_DIR, 'fixtures.json');
    if (!fs.existsSync(fixturesPath)) {
      // Create empty fixtures file if it doesn't exist
      const emptyFixtures = {
        fixtures: [],
        groups: [],
        fixtureLayout: [],
        masterSliders: []
      };
      fs.writeFileSync(fixturesPath, JSON.stringify(emptyFixtures, null, 2));
      return emptyFixtures;
    }
    const fixturesData = fs.readFileSync(fixturesPath, 'utf-8');
    return JSON.parse(fixturesData);
  } catch (error) {
    log('Error loading fixtures data', 'ERROR', { error });
    return {
      fixtures: [],
      groups: [],
      fixtureLayout: [],
      masterSliders: []
    };
  }
};

const saveFixturesData = (data: any) => {
  try {
    const fixturesPath = path.join(DATA_DIR, 'fixtures.json');
    fs.writeFileSync(fixturesPath, JSON.stringify(data, null, 2));
    log('Fixtures data saved successfully', 'INFO');
    return true;
  } catch (error) {
    log('Error saving fixtures data', 'ERROR', { error });
    return false;
  }
};

// Get initial state
apiRouter.get('/state', (req, res) => {
  try {
    // Load configuration and scenes
    const config = loadConfig(); // loadConfig now also returns oscAssignments
    
    const scenesData = fs.readFileSync(path.join(DATA_DIR, 'scenes.json'), 'utf-8');
    const scenes = JSON.parse(scenesData);
    
    // Read fixtures data from file
    const fixturesData = loadFixturesData();
    
    // Return all state, using actual values from server where available
    res.json({
      artNetConfig: config.artNetConfig,
      oscConfig: config.oscConfig, // Include OSC configuration
      midiMappings: config.midiMappings,
      scenes,
      dmxChannels: getDmxChannels(), // Use getter for actual DMX channel state
      oscAssignments: config.oscAssignments, // Use loaded OSC assignments
      channelNames: getChannelNames(), // Use getter for actual channel names
      fixtures: fixturesData.fixtures,
      groups: fixturesData.groups,
      fixtureLayout: fixturesData.fixtureLayout,
      masterSliders: fixturesData.masterSliders
    });
  } catch (error) {
    log('Error getting initial state', 'ERROR', { error });
    res.status(500).json({ error: `Failed to get initial state: ${error}` });
  }
});

// Set DMX channel value
const dmxHandler: RequestHandler = (req: Request, res: Response) => {
  try {
    const { channel, value } = req.body;
    
    if (typeof channel !== 'number' || typeof value !== 'number') {
      res.status(400).json({ error: 'Invalid channel or value' });
      return;
    }
    
    setDmxChannel(channel, value);
    res.json({ success: true });
  } catch (error) {
    log('Error setting DMX channel', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to set DMX channel: ${error}` });
  }
};

apiRouter.post('/dmx', dmxHandler);

// MIDI Learn endpoints
const midiLearnHandler: RequestHandler = (req: Request, res: Response) => {
  try {
    const { channel } = req.body;
    
    if (typeof channel !== 'number') {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }
    
    // This function should be implemented in your index.ts file
    // It should emit a socket event to start MIDI learn mode
    global.io.emit('startMidiLearn', { channel });
    
    res.json({ success: true });
  } catch (error) {
    log('Error starting MIDI learn', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to start MIDI learn: ${error}` });
  }
};

apiRouter.post('/midi/learn', midiLearnHandler);

apiRouter.post('/midi/cancel-learn', (req, res) => {
  try {
    const { channel } = req.body;
    
    global.io.emit('midiLearnCancelled', { channel });
    
    res.json({ success: true });
  } catch (error) {
    log('Error cancelling MIDI learn', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to cancel MIDI learn: ${error}` });
  }
});

apiRouter.post('/midi/mapping', (req, res) => {
  try {
    const { dmxChannel, mapping } = req.body;
    
    learnMidiMapping(global.io, dmxChannel, mapping);
    saveConfig();
    
    res.json({ success: true });
  } catch (error) {
    log('Error adding MIDI mapping', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to add MIDI mapping: ${error}` });
  }
});

apiRouter.delete('/midi/mapping/:channel', (req, res) => {
  try {
    const channel = parseInt(req.params.channel);
    
    // Remove the MIDI mapping for the given channel
    const config = loadConfig();
    if (config.midiMappings && channel in config.midiMappings) {
      delete config.midiMappings[channel];
    }
    saveConfig();
    
    res.json({ success: true });
  } catch (error) {
    log('Error removing MIDI mapping', 'ERROR', { error, params: req.params });
    res.status(500).json({ error: `Failed to remove MIDI mapping: ${error}` });
  }
});

apiRouter.delete('/midi/mappings', (req, res) => {
  try {
    // Clear all MIDI mappings
    const config = loadConfig();
    config.midiMappings = {};
    saveConfig();
    
    res.json({ success: true });
  } catch (error) {
    log('Error clearing all MIDI mappings', 'ERROR', { error });
    res.status(500).json({ error: `Failed to clear all MIDI mappings: ${error}` });
  }
});

// OSC Assignment Endpoint
apiRouter.post('/osc/assignment', (req, res) => {
  try {
    const { channel, address } = req.body;

    if (typeof channel !== 'number' || typeof address !== 'string') {
      log('Invalid OSC assignment payload', 'ERROR', { body: req.body });
      res.status(400).json({ error: 'Invalid channel or address' });
      return;
    }

    // Call a function (to be created in index.ts) to update server-side OSC assignments
    const success = updateOscAssignment(channel, address);

    if (success) {
      log('OSC assignment updated', 'INFO', { channel, address });
      res.json({ success: true });
    } else {
      log('Failed to update OSC assignment on server', 'ERROR', { channel, address });
      res.status(500).json({ error: 'Failed to update OSC assignment on server' });
    }
  } catch (error) {
    log('Error updating OSC assignment', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to update OSC assignment: ${error}` });
  }
});

// Scene endpoints
apiRouter.post('/scenes', (req, res) => {
  try {
    const { name, oscAddress, channelValues } = req.body;
    
    saveScene(global.io, name, oscAddress, channelValues);
    
    res.json({ success: true });
  } catch (error) {
    log('Error saving scene', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to save scene: ${error}` });
  }
});

apiRouter.post('/scenes/load', (req, res) => {
  try {
    const { name } = req.body;
    
    loadScene(global.io, name);
    
    res.json({ success: true });
  } catch (error) {
    log('Error loading scene', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to load scene: ${error}` });
  }
});

apiRouter.put('/scenes/:name', (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;
    
    updateScene(global.io, name, updates);
    
    res.json({ success: true });
  } catch (error) {
    log('Error updating scene', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to update scene: ${error}` });
  }
});

apiRouter.delete('/scenes/:name', (req, res) => {
  try {
    const { name } = req.params;
    
    // This function should be implemented in your index.ts file
    // It should delete the scene with the given name
    // Load scenes, filter out the one to delete, and save
    const scenes = loadScenes();
    const updatedScenes = scenes.filter((scene: any) => scene.name !== name);
    saveScenes(updatedScenes);
    
    global.io.emit('sceneList', updatedScenes);
    
    res.json({ success: true });
  } catch (error) {
    log('Error deleting scene', 'ERROR', { error, params: req.params });
    res.status(500).json({ error: `Failed to delete scene: ${error}` });
  }
});

// Clear all scenes (for factory reset)
apiRouter.delete('/scenes', (req, res) => {
  try {
    // Clear all scenes by saving an empty array
    saveScenes([]);
    
    // Notify all clients that scenes have been cleared
    global.io.emit('sceneList', []);
    
    log('All scenes cleared via factory reset', 'INFO');
    res.json({ success: true, message: 'All scenes cleared' });
  } catch (error) {
    log('Error clearing all scenes', 'ERROR', { error });
    res.status(500).json({ error: `Failed to clear all scenes: ${error}` });
  }
});

// ArtNet configuration
apiRouter.post('/config/artnet', (req, res) => {
  try {
    const artNetConfig = req.body;
    
    // Update ArtNet configuration
    const config = loadConfig();
    config.artNetConfig = { ...config.artNetConfig, ...artNetConfig };
    saveConfig();
    
    res.json({ success: true });
  } catch (error) {
    log('Error updating ArtNet config', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to update ArtNet config: ${error}` });
  }
});

// Fixtures endpoints
apiRouter.post('/fixtures', (req, res) => {
  try {
    const { fixtures } = req.body;
    
    // Load current fixtures data
    const fixturesData = loadFixturesData();
    fixturesData.fixtures = fixtures;
    
    // Save updated fixtures data
    const success = saveFixturesData(fixturesData);
    
    if (success) {
      // Notify all clients of the fixtures update
      global.io.emit('fixturesUpdate', fixtures);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save fixtures data' });
    }
  } catch (error) {
    log('Error saving fixtures', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to save fixtures: ${error}` });
  }
});

apiRouter.post('/groups', (req, res) => {
  try {
    const { groups } = req.body;
    
    // Load current fixtures data
    const fixturesData = loadFixturesData();
    fixturesData.groups = groups;
    
    // Save updated fixtures data
    const success = saveFixturesData(fixturesData);
    
    if (success) {
      // Notify all clients of the groups update
      global.io.emit('groupsUpdate', groups);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save groups data' });
    }
  } catch (error) {
    log('Error saving groups', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to save groups: ${error}` });
  }
});

apiRouter.post('/fixture-layout', (req, res) => {
  try {
    const { fixtureLayout } = req.body;
    
    // Load current fixtures data
    const fixturesData = loadFixturesData();
    fixturesData.fixtureLayout = fixtureLayout;
    
    // Save updated fixtures data
    const success = saveFixturesData(fixturesData);
    
    if (success) {
      // Notify all clients of the fixture layout update
      global.io.emit('fixtureLayoutUpdate', fixtureLayout);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save fixture layout data' });
    }
  } catch (error) {
    log('Error saving fixture layout', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to save fixture layout: ${error}` });
  }
});

apiRouter.post('/master-sliders', (req, res) => {
  try {
    const { masterSliders } = req.body;
    
    // Load current fixtures data
    const fixturesData = loadFixturesData();
    fixturesData.masterSliders = masterSliders;
    
    // Save updated fixtures data
    const success = saveFixturesData(fixturesData);
    
    if (success) {
      // Notify all clients of the master sliders update
      global.io.emit('masterSlidersUpdate', masterSliders);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save master sliders data' });
    }
  } catch (error) {
    log('Error saving master sliders', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to save master sliders: ${error}` });
  }
});

// Export all settings
apiRouter.post('/export', (req, res) => {
  try {
    const config = loadConfig();
    const scenes = loadScenes();
    const fixturesData = loadFixturesData();
    
    const allSettings = {
      config,
      scenes,
      fixtures: fixturesData.fixtures,
      groups: fixturesData.groups,
      fixtureLayout: fixturesData.fixtureLayout,
      masterSliders: fixturesData.masterSliders
    };
    
    fs.writeFileSync(EXPORT_FILE, JSON.stringify(allSettings, null, 2));
    
    res.json({ success: true, filePath: EXPORT_FILE });
  } catch (error) {
    log('Error exporting settings', 'ERROR', { error });
    res.status(500).json({ error: `Failed to export settings: ${error}` });
  }
});

// Import settings
const importHandler: RequestHandler = (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(EXPORT_FILE)) {
      res.status(404).json({ error: 'Export file not found' });
      return;
    }
    
    const data = fs.readFileSync(EXPORT_FILE, 'utf-8');
    const allSettings = JSON.parse(data);
    
    // Apply imported settings
    if (allSettings.config) {
      // Use the current config as a base and update it
      const config = loadConfig();
      Object.assign(config, allSettings.config);
      saveConfig();
    }
    
    if (allSettings.scenes) {
      saveScenes(allSettings.scenes);
    }
    
    // Import fixtures data if present
    if (allSettings.fixtures || allSettings.groups || allSettings.fixtureLayout || allSettings.masterSliders) {
      const currentFixturesData = loadFixturesData();
      const updatedFixturesData = {
        fixtures: allSettings.fixtures || currentFixturesData.fixtures,
        groups: allSettings.groups || currentFixturesData.groups,
        fixtureLayout: allSettings.fixtureLayout || currentFixturesData.fixtureLayout,
        masterSliders: allSettings.masterSliders || currentFixturesData.masterSliders
      };
      saveFixturesData(updatedFixturesData);
      
      // Notify clients of fixtures data updates
      global.io.emit('fixturesUpdate', updatedFixturesData.fixtures);
      global.io.emit('groupsUpdate', updatedFixturesData.groups);
      global.io.emit('fixtureLayoutUpdate', updatedFixturesData.fixtureLayout);
      global.io.emit('masterSlidersUpdate', updatedFixturesData.masterSliders);
    }
    
    // Notify clients
    global.io.emit('configUpdate', allSettings.config);
    global.io.emit('sceneList', allSettings.scenes);
    
    res.json({ success: true, settings: allSettings });
  } catch (error) {
    log('Error importing settings', 'ERROR', { error });
    res.status(500).json({ error: `Failed to import settings: ${error}` });
  }
};

apiRouter.post('/import', importHandler);

// Ping ArtNet device
apiRouter.post('/ping-artnet', (req, res) => {
  try {
    const { ip } = req.body;
    
    pingArtNetDevice(global.io, ip);
    
    res.json({ success: true });
  } catch (error) {
    log('Error pinging ArtNet device', 'ERROR', { error, body: req.body });
    res.status(500).json({ error: `Failed to ping ArtNet device: ${error}` });
  }
});

// Socket.IO handler setup
function setupSocketHandlers(io: Server) {
  // Store the io instance globally for use in API routes
  global.io = io;
  
  io.on('connection', (socket) => {
    // Handle settings export
    socket.on('exportSettings', () => {      try {
        const config = loadConfig();
        const scenes = loadScenes();
        const fixturesData = loadFixturesData();
        
        const allSettings = {
          config,
          scenes,
          fixtures: fixturesData.fixtures,
          groups: fixturesData.groups,
          fixtureLayout: fixturesData.fixtureLayout,
          masterSliders: fixturesData.masterSliders
        };
        
        fs.writeFileSync(EXPORT_FILE, JSON.stringify(allSettings, null, 2));
        
        socket.emit('settingsExported', EXPORT_FILE);
      } catch (error) {
        log('Error exporting settings via socket', 'ERROR', { error, socketId: socket.id });
        socket.emit('exportError', error instanceof Error ? error.message : String(error));
      }
    });
      // Handle settings import
    socket.on('importSettings', () => {
      try {
        if (!fs.existsSync(EXPORT_FILE)) {
          socket.emit('importError', 'Export file not found');
          return;
        }
        
        const data = fs.readFileSync(EXPORT_FILE, 'utf-8');
        const allSettings = JSON.parse(data);
        
        // Apply imported settings
        if (allSettings.config) {
          // Use the current config as a base and update it
          const config = loadConfig();
          Object.assign(config, allSettings.config);
          saveConfig();
        }
        
        if (allSettings.scenes) {
          saveScenes(allSettings.scenes);
        }
        
        // Import fixtures data if present
        if (allSettings.fixtures || allSettings.groups || allSettings.fixtureLayout || allSettings.masterSliders) {
          const currentFixturesData = loadFixturesData();
          const updatedFixturesData = {
            fixtures: allSettings.fixtures || currentFixturesData.fixtures,
            groups: allSettings.groups || currentFixturesData.groups,
            fixtureLayout: allSettings.fixtureLayout || currentFixturesData.fixtureLayout,
            masterSliders: allSettings.masterSliders || currentFixturesData.masterSliders
          };
          saveFixturesData(updatedFixturesData);
          
          // Notify clients of fixtures data updates
          io.emit('fixturesUpdate', updatedFixturesData.fixtures);
          io.emit('groupsUpdate', updatedFixturesData.groups);
          io.emit('fixtureLayoutUpdate', updatedFixturesData.fixtureLayout);
          io.emit('masterSlidersUpdate', updatedFixturesData.masterSliders);
        }
        
        // Notify clients
        io.emit('configUpdate', allSettings.config);
        io.emit('sceneList', allSettings.scenes);
        
        socket.emit('settingsImported', allSettings);
      } catch (error) {
        log('Error importing settings via socket', 'ERROR', { error, socketId: socket.id });
        socket.emit('importError', error instanceof Error ? error.message : String(error));
      }
    });
    
    // Handle sending OSC messages
    socket.on('sendOsc', (message) => {
      try {
        // This function should be implemented in your index.ts file
        // It should send an OSC message with the given address and args
        sendOscMessage(message.address, message.args);
        
        // Forward OSC message to all clients for display
        io.emit('oscMessage', {
          ...message,
          timestamp: Date.now()
        });
      } catch (error) {
        log('Error sending OSC message via socket', 'ERROR', { error, message, socketId: socket.id });
        socket.emit('error', `Failed to send OSC message: ${error}`);
      }
    });
    
    // Handle OSC configuration changes
    socket.on('saveOscConfig', (oscConfig) => {      try {
        log('Received OSC config update via socket', 'OSC', { oscConfig, socketId: socket.id });
        
        // Update OSC configuration
        updateOscConfig(io, oscConfig);
        
        // Notify all clients of the configuration change
        io.emit('oscConfigUpdate', oscConfig);
        
        socket.emit('oscConfigSaved', { success: true });
      } catch (error) {
        log('Error updating OSC config via socket', 'ERROR', { error, oscConfig, socketId: socket.id });
        socket.emit('oscConfigSaved', { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Handle ArtNet ping
    socket.on('pingArtNet', (ip) => {
      pingArtNetDevice(io, ip);
    });
  });
}

// Import sendOscMessage from index.ts
import { sendOscMessage } from './index';

export { apiRouter, setupSocketHandlers };