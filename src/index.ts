/// <reference path="./types/osc.d.ts" />
import easymidi, { Input } from 'easymidi';
// Import our adapter types to make TypeScript happy
import './types/midi-types';
import { Server, Socket } from 'socket.io';
import os from 'os';
const osc = require('osc');
import fs from 'fs';
import path from 'path';
import EffectsEngine from './effects';
import ping from 'ping';

// Import our separate logger to avoid circular dependencies
import { log } from './logger';

// Import dmxnet using ES6 import syntax
import dmxnet from 'dmxnet';

export interface MidiMessage {
    _type: string;
    channel: number;
    controller?: number;
    value?: number;
    note?: number;
    velocity?: number;
    number?: number;  // For program change messages
    source?: string;
}

// Type definitions
interface Fixture {
    name: string;
    startAddress: number;
    channels: { name: string; type: string }[];
}

interface Group {
    name: string;
    fixtureIndices: number[];
}

interface MidiMapping {
    channel: number;
    note?: number;
    controller?: number;
}

interface Scene {
    name: string;
    channelValues: number[];
    oscAddress: string;
    midiMapping?: MidiMapping;
}

type MidiMappings = { [dmxChannel: number]: MidiMapping };

interface ArtNetConfig {
    ip: string;
    subnet: number;
    universe: number;
    net: number;
    port: number;
    base_refresh_interval: number;
}

interface OscConfig {
    host: string;
    port: number;
    // OSC sending configuration
    sendEnabled: boolean;
    sendHost: string;
    sendPort: number;
}

// Variable declarations
let dmxChannels: number[] = new Array(512).fill(0);
let oscAssignments: string[] = new Array(512).fill('').map((_, i) => `/dmx/${i + 1}`); // Updated default pattern
let channelNames: string[] = new Array(512).fill('').map((_, i) => `CH ${i + 1}`);
let fixtures: Fixture[] = [];
let groups: Group[] = [];
let scenes: Scene[] = [];
let sender: any = null;
let midiMappings: MidiMappings = {};
let midiInput: Input | null = null;
let currentMidiLearnChannel: number | null = null;
let currentMidiLearnScene: string | null = null;
let midiLearnTimeout: NodeJS.Timeout | null = null;

// OSC variables
let oscReceivePort: any = null;
let oscSendPort: any = null;

// OSC Configuration
let oscConfig: OscConfig = {
    host: '127.0.0.1',
    port: 57121,
    // OSC sending configuration
    sendEnabled: true,
    sendHost: '127.0.0.1',
    sendPort: 57120
};

// Constants and configurations
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const EXPORT_FILE = path.join(DATA_DIR, 'export_config.json');
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'app.log');

let isLoggingEnabled = true;
let isConsoleLoggingEnabled = true;

// Default ArtNet configuration
let artNetConfig: ArtNetConfig = {
    ip: "192.168.1.199",
    subnet: 0,
    universe: 0,
    net: 0,
    port: 6454,
    base_refresh_interval: 1000
};

// ArtNet sender
let artnetSender: any;

// Keep track of ArtNet ping status to reduce log noise
let lastArtNetStatus = 'unknown';
let artNetFailureCount = 0;
const MAX_CONSECUTIVE_FAILURES = 3; // Only log every 3rd failure

// Initialize global ArtNet ping status
(global as any).artNetPingStatus = 'unknown';

function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsedConfig = JSON.parse(data);
        artNetConfig = { ...artNetConfig, ...parsedConfig.artNetConfig };
        midiMappings = parsedConfig.midiMappings || {};
        oscAssignments = parsedConfig.oscAssignments || new Array(512).fill('').map((_, i) => `/dmx/${i + 1}`); // Load OSC assignments or use default
        oscConfig = { ...oscConfig, ...parsedConfig.oscConfig }; // Load OSC config or use default
        log('Config loaded', 'INFO', { artNetConfig });
        log('MIDI mappings loaded', 'MIDI', { midiMappings });
        log('OSC assignments loaded', 'OSC', { oscAssignmentsCount: oscAssignments.length });
        log('OSC config loaded', 'OSC', { oscConfig });
        
        return {
            artNetConfig,
            midiMappings,
            oscAssignments, // Return loaded assignments
            oscConfig // Return loaded OSC config
        };
    } else {
        saveConfig(); // This will save defaults including the new oscAssignments default
        return {
            artNetConfig,
            midiMappings,
            oscAssignments,
            oscConfig
        };
    }
}

function saveConfig() {
    const configToSave = {
        artNetConfig,
        midiMappings,
        oscAssignments, // Save OSC assignments
        oscConfig // Save OSC config
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
    log('Config saved', 'INFO', { config: configToSave });
}

export function getDmxChannels(): number[] {
  return dmxChannels;
}

export function getChannelNames(): string[] {
  return channelNames;
}

// Store active MIDI inputs
let activeMidiInputs: {[name: string]: Input} = {};

// Helper function to check if running in WSL
function isRunningInWsl(): boolean {
    return os.release().toLowerCase().includes('microsoft') || 
           os.release().toLowerCase().includes('wsl');
}

function initializeMidi(io: Server) {
    try {
        // Check if running in WSL environment
        if (isRunningInWsl()) {
            log('WSL environment detected - using browser MIDI API only', 'MIDI');
            io.emit('midiStatus', { 
                status: 'wsl', 
                message: 'Running in WSL - using browser MIDI API only',
                browserMidiOnly: true
            });
            return;
        }

        // Linux-specific ALSA checks
        if (process.platform === 'linux') {
            const hasSeqDevice = fs.existsSync('/dev/snd/seq');
            
            if (!hasSeqDevice) {
                log('ALSA sequencer device not available', 'WARN');
                io.emit('midiStatus', {
                    status: 'limited',
                    message: 'ALSA not available - using browser MIDI API',
                    browserMidiOnly: true
                });
                return;
            }
        }
        
        // Continue with MIDI initialization
        const inputs = easymidi.getInputs();
        log(`Found ${inputs.length} MIDI inputs`, 'MIDI', { inputs });
        
        io.emit('midiStatus', {
            status: 'ready',
            message: inputs.length > 0 ? 'Hardware MIDI initialized' : 'No hardware MIDI devices found',
            inputs,
            browserMidiOnly: false
        });
        
    } catch (error) {
        log('MIDI initialization error', 'ERROR', { error });
        io.emit('midiStatus', { 
            status: 'error', 
            message: 'MIDI hardware initialization failed - using browser MIDI API',
            browserMidiOnly: true
        });
    }
}

function connectMidiInput(io: Server, inputName: string, isBrowserMidi = false) {
    try {
        // Skip hardware MIDI connection if using browser MIDI
        if (isBrowserMidi) {
            log(`Using browser MIDI for input: ${inputName}`, 'MIDI');
            return;
        }

        if (isRunningInWsl()) {
            throw new Error('Hardware MIDI not available in WSL');
        }
        
        // Check if we're already connected to this input
        if (activeMidiInputs[inputName]) {
            log(`Already connected to MIDI input: ${inputName}`, 'MIDI');
            return;
        }
        
        // Connect to the selected MIDI input
        const newInput = new easymidi.Input(inputName);
        log(`Successfully created MIDI input for ${inputName}`, 'MIDI');
        
        // Set up event listeners for this input with improved error handling
        newInput.on('noteon', (msg: MidiMessage) => {
            try {
                // Add source information to the message
                const msgWithSource = { ...msg, source: inputName };
                log('Received noteon', 'MIDI', { message: msgWithSource });
                handleMidiMessage(io, 'noteon', msgWithSource as MidiMessage);
            } catch (error) {
                log('Error handling noteon message', 'ERROR', { error, inputName });
            }
        });
        
        newInput.on('noteoff', (msg: MidiMessage) => {
            try {
                // Also forward noteoff events with source information
                const msgWithSource = { ...msg, source: inputName };
                log('Received noteoff', 'MIDI', { message: msgWithSource });
                io.emit('midiMessage', msgWithSource);
            } catch (error) {
                log('Error handling noteoff message', 'ERROR', { error, inputName });
            }
        });
        
        newInput.on('cc', (msg: MidiMessage) => {
            try {
                // Add source information to the message
                const msgWithSource = { ...msg, source: inputName };
                log('Received cc', 'MIDI', { message: msgWithSource });
                handleMidiMessage(io, 'cc', msgWithSource as MidiMessage);
            } catch (error) {
                log('Error handling cc message', 'ERROR', { error, inputName });
            }
        });
        
        // Store this input in our active inputs
        activeMidiInputs[inputName] = newInput;
        midiInput = newInput; // Keep the last one as default for backward compatibility
        
        log(`MIDI input connected: ${inputName}`, 'MIDI');
        io.emit('midiInterfaceSelected', inputName);
        io.emit('midiInputsActive', Object.keys(activeMidiInputs));
    } catch (error) {
        log(`Error connecting to MIDI input ${inputName}`, 'ERROR', { error });
        io.emit('midiInterfaceError', `Failed to connect to ${inputName}: ${error}`);
    }
}

function disconnectMidiInput(io: Server, inputName: string) {
    if (activeMidiInputs[inputName]) {
        activeMidiInputs[inputName].close();
        delete activeMidiInputs[inputName];
        log(`MIDI input disconnected: ${inputName}`, 'MIDI');
        io.emit('midiInputsActive', Object.keys(activeMidiInputs));
        io.emit('midiInterfaceDisconnected', inputName);
        
        // If this was the default input, set a new default if available
        if (midiInput === activeMidiInputs[inputName]) {
            const activeInputNames = Object.keys(activeMidiInputs);
            if (activeInputNames.length > 0) {
                midiInput = activeMidiInputs[activeInputNames[0]];
            } else {
                midiInput = null;
            }
        }
    }
}

function initOsc(io: Server) {
    try {
        log('Initializing OSC...', 'OSC');
        log('OSC Configuration:', 'OSC');
        log('  - Listen Address: 0.0.0.0 (all interfaces)', 'OSC');
        log(`  - Listen Port: ${oscConfig.port} (UDP)`, 'OSC');
        log(`  - Send Enabled: ${oscConfig.sendEnabled}`, 'OSC');
        if (oscConfig.sendEnabled) {
            log(`  - Send Host: ${oscConfig.sendHost}`, 'OSC');
            log(`  - Send Port: ${oscConfig.sendPort}`, 'OSC');
        }
        
        // Create OSC receive port
        const oscPort = new osc.UDPPort({
            localAddress: "0.0.0.0",
            localPort: oscConfig.port,
            metadata: true
        });        
        
        oscPort.on("ready", () => {
            log("OSC Receive Port is ready", 'OSC');
            log(`OSC: Receiving on port ${oscConfig.port} (UDP)`, 'OSC');
            io.emit('oscStatus', { status: 'connected', receivePort: oscConfig.port });
            oscReceivePort = oscPort;
            sender = oscPort; // Keep backward compatibility
        });

        oscPort.on("error", (error: Error) => {
            log('OSC Receive error', 'ERROR', { message: error.message });
            io.emit('oscStatus', { status: 'error', message: error.message });
        });

        oscPort.on("message", (oscMsg: any, timeTag: any, info: any) => {
            log('Raw OSC message received', 'OSC', { address: oscMsg.address, args: oscMsg.args, info });

            // Emit raw message for general purpose client-side handling if needed
            io.emit('oscMessage', {
                address: oscMsg.address,
                args: oscMsg.args,
                timestamp: Date.now()
            });

            // Process for DMX channel activity
            oscAssignments.forEach((assignedAddress, channelIndex) => {
                if (oscMsg.address === assignedAddress && oscMsg.args.length > 0) {
                    let value = 0.0;
                    const firstArg = oscMsg.args[0];

                    if (typeof firstArg === 'number') {
                        value = parseFloat(firstArg.toString());
                    } else if (typeof firstArg === 'object' && firstArg !== null && 'value' in firstArg && typeof (firstArg as any).value === 'number') {
                        value = parseFloat((firstArg as any).value.toString());
                    } else {
                        log('OSC argument for matched address is not a recognized number format', 'OSC', { address: oscMsg.address, arg: firstArg });
                        return; // Skip if argument is not a number or expected object
                    }

                    // Normalize value to 0.0 - 1.0 (assuming it might come in various ranges, e.g. 0-127, 0-255)
                    // For now, let's assume if it's > 1, it might be from a 0-127 or 0-255 range.
                    // This normalization logic might need adjustment based on typical OSC sources.
                    if (value > 1.0) { // A simple heuristic, might need refinement
                        if (value <= 127.0) value = value / 127.0; // Common MIDI-like range
                        else if (value <= 255.0) value = value / 255.0; // Common DMX-like range
                        // Add other normalizations if needed
                    }
                    
                    value = Math.max(0.0, Math.min(1.0, value)); // Clamp to 0.0-1.0

                    log(`OSC activity for DMX ${channelIndex + 1} (${assignedAddress}): ${value}`, 'OSC', { args: oscMsg.args });
                    io.emit('oscChannelActivity', { channelIndex, value });
                }
            });
        });

        oscPort.open();
        log("Opening OSC Receive port...", 'OSC');

        // Create OSC send port if sending is enabled
        if (oscConfig.sendEnabled) {
            const oscSendPortInstance = new osc.UDPPort({
                localAddress: "0.0.0.0",
                localPort: 0, // Use any available port for sending
                remoteAddress: oscConfig.sendHost,
                remotePort: oscConfig.sendPort,
                metadata: false
            });

            oscSendPortInstance.on("ready", () => {
                log("OSC Send Port is ready", 'OSC');
                log(`OSC: Sending to ${oscConfig.sendHost}:${oscConfig.sendPort} (UDP)`, 'OSC');
                oscSendPort = oscSendPortInstance;
                io.emit('oscSendStatus', { 
                    status: 'connected', 
                    sendHost: oscConfig.sendHost, 
                    sendPort: oscConfig.sendPort 
                });
            });

            oscSendPortInstance.on("error", (error: Error) => {
                log('OSC Send error', 'ERROR', { message: error.message });
                io.emit('oscSendStatus', { status: 'error', message: error.message });
            });

            oscSendPortInstance.open();
            log("Opening OSC Send port...", 'OSC');
        } else {
            log('OSC sending is disabled', 'OSC');
            oscSendPort = null;
        }

    } catch (error) {
        log('Error initializing OSC', 'ERROR', { error });
        io.emit('oscStatus', { 
            status: 'error', 
            message: `Failed to initialize OSC: ${error}` 
        });
    }
}

function initializeArtNet() {
    try {
        const dmxnetInstance = new dmxnet.dmxnet({
            oem: 0,
            sName: "LaserTime",
            lName: "LaserTime DMX Controller",
            log: { level: 'none' } // Use proper log configuration instead of verbose
        });

        // Clean up existing sender if it exists
        if (artnetSender && typeof artnetSender.close === 'function') {
            artnetSender.close();
        }

        artnetSender = dmxnetInstance.newSender({
            ip: artNetConfig.ip,
            subnet: artNetConfig.subnet,
            universe: artNetConfig.universe,
            net: artNetConfig.net,
            port: artNetConfig.port,
            base_refresh_interval: artNetConfig.base_refresh_interval
        });

        // Setup error handlers for the sender
        if (artnetSender.on) {
            artnetSender.on('error', (err: Error) => {
                log('ArtNet sender error', 'ARTNET', { message: err.message });                (global as any).io?.emit('artnetStatus', {
                    status: 'error', 
                    message: err.message 
                });
            });

            artnetSender.on('timeout', () => {
                log('ArtNet sender timeout - will retry', 'ARTNET');                (global as any).io?.emit('artnetStatus', {
                    status: 'timeout',
                    message: 'Connection timed out - retrying'
                });
            });
        }

        log('ArtNet sender initialized', 'ARTNET', { config: artNetConfig });        (global as any).artNetPingStatus = 'initialized_pending_ping'; // Set status before first ping
        
        // Initial ping to check connectivity
        if ((global as any).io) {
            pingArtNetDevice((global as any).io, artNetConfig.ip);
        }

        return true;
    } catch (error) {
        log('Error initializing ArtNet', 'ERROR', { error });        (global as any).artNetPingStatus = 'init_failed'; // Set status on initialization failure
        (global as any).io?.emit('artnetStatus', {
            status: 'error',
            message: `Failed to initialize: ${error}` 
        });
        return false;
    }
}

function listMidiInterfaces() {
    try {
        // Check if running in WSL using our helper function
        if (isRunningInWsl()) {
            log('WSL environment detected - MIDI hardware interfaces not accessible', 'MIDI');
            return { 
                inputs: [], 
                outputs: [],
                isWsl: true
            };
        }
        
        const inputs = easymidi.getInputs();
        const outputs = easymidi.getOutputs();
        log("Available MIDI Inputs", 'MIDI', { inputs });
        log("Available MIDI Outputs", 'MIDI', { outputs });
        return { inputs, outputs, isWsl: false };
    } catch (error) {
        log('Error listing MIDI interfaces', 'ERROR', { error });
        return { 
            inputs: [], 
            outputs: [],
            error: String(error)
        };
    }
}

function simulateMidiInput(io: Server, type: 'noteon' | 'cc', channel: number, note: number, velocity: number) {
    let midiMessage: MidiMessage;
    if (type === 'noteon') {
        midiMessage = {
            _type: 'noteon',
            channel: channel,
            note: note,
            velocity: velocity
        };
    } else {
        midiMessage = {
            _type: 'cc',
            channel: channel,
            controller: note,
            value: velocity
        };
    }
    handleMidiMessage(io, type, midiMessage);
}

function learnMidiMapping(io: Server, dmxChannel: number, midiMapping: MidiMapping) {
    midiMappings[dmxChannel] = midiMapping;
    io.emit('midiMappingLearned', { channel: dmxChannel, mapping: midiMapping });
    log('MIDI mapping learned', 'MIDI', { channel: dmxChannel, mapping: midiMapping });
}

function handleMidiMessage(io: Server, type: 'noteon' | 'cc', msg: MidiMessage) {
    // Send the raw MIDI message to all clients
    io.emit('midiMessage', msg);
    
    // Debug MIDI message - add extra logging when in learn mode
    if (currentMidiLearnChannel !== null) {
        log('MIDI message received during LEARN MODE', 'MIDI', { type, msg });
    }
    
    // Handle MIDI learn mode
    if (currentMidiLearnChannel !== null) {
        // For MIDI Learn, we're interested in CC messages or Note On messages
        let midiMapping: MidiMapping;
        log('Processing MIDI for learn mode', 'MIDI', { msg });
        
        if (type === 'noteon') {
            log(`Creating note mapping for channel ${currentMidiLearnChannel}`, 'MIDI');
            midiMapping = {
                channel: msg.channel,
                note: msg.note !== undefined ? msg.note : 0
            };
        } else if (type === 'cc') { // cc
            log(`Creating CC mapping for channel ${currentMidiLearnChannel}`, 'MIDI');
            midiMapping = {
                channel: msg.channel,
                controller: msg.controller !== undefined ? msg.controller : 0
            };
        } else {
            log(`Ignoring message type ${type} for MIDI learn`, 'MIDI');
            return; // Not a message type we care about for learning
        }
        
        // Store the current channel before clearing it
        const learnedChannel = currentMidiLearnChannel;
        
        // Learn the mapping
        learnMidiMapping(io, learnedChannel, midiMapping);
        currentMidiLearnChannel = null;
        
        // Clear the midi learn timeout if it's active
        if (midiLearnTimeout) {
            clearTimeout(midiLearnTimeout);
            midiLearnTimeout = null;
        }
        
        // Save the config and update clients
        saveConfig();
        io.emit('midiMappingUpdate', midiMappings);
        
        // Send a confirmation that MIDI learn completed successfully
        log('MIDI learn complete', 'MIDI', { channel: learnedChannel, mapping: midiMapping });
        io.emit('midiLearnComplete', { 
            channel: learnedChannel,
            mapping: midiMapping
        });
        
        return;
    }
    
    // Handle MIDI scene learn mode
    if (currentMidiLearnScene !== null) {
        const scene = scenes.find(s => s.name === currentMidiLearnScene);
        if (scene) {
            let midiMapping: MidiMapping;
            
            if (type === 'noteon') {
                midiMapping = {
                    channel: msg.channel,
                    note: msg.note !== undefined ? msg.note : 0
                };
            } else { // cc
                midiMapping = {
                    channel: msg.channel,
                    controller: msg.controller !== undefined ? msg.controller : 0
                };
            }
            
            scene.midiMapping = midiMapping;
            io.emit('sceneMidiMappingLearned', { scene: currentMidiLearnScene, mapping: midiMapping });
            currentMidiLearnScene = null;
            
            // Clear the midi learn timeout if it's active
            if (midiLearnTimeout) {
                clearTimeout(midiLearnTimeout);
                midiLearnTimeout = null;
            }
            
            saveScenes();
            return;
        }
    }
    
    // Regular MIDI control handling
    if (type === 'cc') {
        // Ensure controller is defined before using it
        if (msg.controller !== undefined) {
            const controlKey = `${msg.channel}:${msg.controller}`;
            
            // Create a mapping of dmx channels to their new values in one go
            const channelUpdates: Record<number, number> = {};
            
            for (const [dmxChannel, mapping] of Object.entries(midiMappings)) {
                // Skip if mapping doesn't have controller property
                if (mapping.controller === undefined) continue;
                
                const mappingKey = `${mapping.channel}:${mapping.controller}`;
                if (mappingKey === controlKey) {
                    const channelIdx = parseInt(dmxChannel);
                    // Make sure value is defined before using it
                    if (msg.value !== undefined) {
                        // Scale MIDI value (0-127) to DMX value (0-255)
                        const scaledValue = Math.floor((msg.value / 127) * 255);
                        // Store for batch update
                        channelUpdates[channelIdx] = scaledValue;
                    }
                }
            }
            
            // Batch update all affected channels at once
            if (Object.keys(channelUpdates).length > 0) {
                log(`MIDI CC ${controlKey} updating ${Object.keys(channelUpdates).length} DMX channels`, 'MIDI', { quiet: true });
                
                // Update each channel and emit a single batch update
                Object.entries(channelUpdates).forEach(([channelIdx, value]) => {
                    updateDmxChannel(parseInt(channelIdx), value);
                });
                
                // Send a single update to clients with all changed channels
                io.emit('dmxBatchUpdate', channelUpdates);
            }
        }
    } else if (type === 'noteon') {
        // Ensure note is defined before using it
        if (msg.note !== undefined) {
            // Check for scene triggers
            scenes.forEach(scene => {
                if (scene.midiMapping && 
                    scene.midiMapping.channel === msg.channel && 
                    scene.midiMapping.note === msg.note) {
                    loadScene(io, scene.name);
                }
            });
        }
    }
}

function saveScene(io: Server, name: string, oscAddress: string, state: number[]) {
    const existingSceneIndex = scenes.findIndex(s => s.name === name);
    const newScene: Scene = { 
        name, 
        channelValues: Array.isArray(state) ? state : Object.values(state), 
        oscAddress 
    };
    if (existingSceneIndex !== -1) {
        scenes[existingSceneIndex] = newScene;
    } else {
        scenes.push(newScene);
    }
    saveScenes();
    io.emit('sceneSaved', name);
    io.emit('sceneList', scenes);
    log('Scene saved', 'INFO', { scene: newScene });
}

function loadScene(io: Server, name: string) {
    const scene = scenes.find(s => s.name === name);
    if (scene) {
        let channelValues: number[];
        if (Array.isArray(scene.channelValues)) {
            channelValues = scene.channelValues;
        } else if (typeof scene.channelValues === 'object') {
            channelValues = Object.values(scene.channelValues);
        } else {
            log('Error loading scene: Invalid channelValues format', 'ERROR', { name });
            io.emit('sceneLoadError', { name, error: 'Invalid channelValues format' });
            return;
        }

        channelValues.forEach((value, index) => {
            if (index < dmxChannels.length) {
                updateDmxChannel(index, value);
            }
        });
        io.emit('sceneLoaded', { name, channelValues });
        log('Scene loaded', 'INFO', { name });
    } else {
        log('Error loading scene: Scene not found', 'WARN', { name });
        io.emit('sceneLoadError', { name, error: 'Scene not found' });
    }
}

function updateScene(io: Server, originalName: string, updates: Partial<Scene>) {
    const sceneIndex = scenes.findIndex(s => s.name === originalName);
    if (sceneIndex !== -1) {
        scenes[sceneIndex] = { ...scenes[sceneIndex], ...updates };
        saveScenes();
        io.emit('sceneUpdated', { originalName, updatedScene: scenes[sceneIndex] });
        io.emit('sceneList', scenes);
        log('Scene updated', 'INFO', { originalName, updates });
    } else {
        log('Error updating scene: Scene not found', 'WARN', { originalName });
        io.emit('sceneUpdateError', { originalName, error: 'Scene not found' });
    }
}

function updateDmxChannel(channel: number, value: number) {
    const previousValue = dmxChannels[channel];
    dmxChannels[channel] = value;
    
    // Send to ArtNet
    if (artnetSender) {
        artnetSender.setChannel(channel, value);
        artnetSender.transmit();
        // Only log significant changes or errors, not every channel update
        if (Math.abs(previousValue - value) > 50 || value === 0 || value === 255) {
            log(`DMX channel ${channel}: ${previousValue} → ${value}`, 'DMX');
        }
    } else {
        log('ArtNet sender not initialized', 'WARN');
    }
    
    // Send OSC update if sending is enabled
    if (oscConfig.sendEnabled && oscSendPort && oscAssignments[channel]) {
        const oscAddress = oscAssignments[channel];
        const normalizedValue = value / 255.0; // Convert DMX 0-255 to OSC 0.0-1.0
        sendOscMessage(oscAddress, [{ type: 'f', value: normalizedValue }]);
    }
}

// OSC message sending function
function sendOscMessage(address: string, args: any[]) {
    if (!oscConfig.sendEnabled || !oscSendPort) {
        log('OSC sending is disabled or send port not available', 'OSC');
        return;
    }
    
    try {
        const message = {
            address: address,
            args: args
        };
        
        oscSendPort.send(message);
        
        log('OSC message sent', 'OSC', { address, args });
        
        // Emit to clients for debugging/monitoring
        if (global.io) {
            global.io.emit('oscOutgoing', {
                address: address,
                args: args,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        log('Error sending OSC message', 'ERROR', { error, address, args });
    }
}

function saveScenes(scenesToSave?: Scene[]) {
    if (scenesToSave) {
        scenes = scenesToSave;
    }
    const scenesJson = JSON.stringify(scenes, null, 2);
    log('Saving scenes', 'INFO', { numScenes: scenes.length });
    fs.writeFileSync(SCENES_FILE, scenesJson);
    log('Scenes saved to file', 'INFO');
}

function loadScenes() {
    if (fs.existsSync(SCENES_FILE)) {
        const data = fs.readFileSync(SCENES_FILE, 'utf-8');
        log('Raw scenes data from file', 'INFO', { length: data.length });
        scenes = JSON.parse(data);
        log('Scenes loaded', 'INFO', { numScenes: scenes.length });
        return scenes;
    } else {
        scenes = [];
        saveScenes();
        return scenes;
    }
}

function pingArtNetDevice(io: Server, ip?: string) {
    // If ip is provided, use it instead of the config IP
    const targetIp = ip || artNetConfig.ip;
    
    // First try TCP connection to ArtNet port
    const net = require('net');
    const socket = new net.Socket();
    const timeout = 1000; // 1 second timeout
    
    socket.setTimeout(timeout);
    
    // Create a promise that rejects on timeout
    const connectionPromise = new Promise((resolve, reject) => {
        socket.connect(artNetConfig.port, targetIp, () => {
            socket.end();
            resolve(true);
        });
        
        socket.on('error', (err: Error) => {
            socket.destroy();
            reject(err);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Connection timed out'));
        });
    });
    
    connectionPromise
        .then(() => {
            // Only log status changes from unreachable to alive
            if (lastArtNetStatus !== 'alive') {
                log(`ArtNet device at ${targetIp} is alive`, 'ARTNET');
                lastArtNetStatus = 'alive';
                artNetFailureCount = 0;
            }
            (global as any).artNetPingStatus = 'alive'; // Update global status
            io.emit('artnetStatus', { ip: targetIp, status: 'alive' });
        })
        .catch((error: Error) => {
            let newStatus: string;
            let logMessage: string;
            let clientMessage: string;
            let logLevel: 'WARN' | 'INFO' = 'WARN';

            if (error.message && error.message.includes('Connection timed out')) {
                newStatus = 'tcp_timeout';
                logMessage = `ArtNet TCP ping to ${targetIp} timed out. UDP DMX may still be operational.`;
                clientMessage = `ArtNet TCP ping to ${targetIp} timed out. UDP DMX communication may still be functional.`;
                logLevel = 'INFO';
            } else {
                newStatus = 'unreachable';
                logMessage = `ArtNet device at ${targetIp} is unreachable: ${error.message}`;
                clientMessage = `ArtNet device at ${targetIp} is not responding: ${error.message}`;
            }

            (global as any).artNetPingStatus = newStatus; // Update global status

            if (lastArtNetStatus !== newStatus) {
                log(logMessage, logLevel, { errorDetail: error.message, previousStatus: lastArtNetStatus });
                artNetFailureCount = 0; // Reset on any status change
            } else if (newStatus === 'unreachable') { // Only apply MAX_CONSECUTIVE_FAILURES to 'unreachable'
                artNetFailureCount++;
                if (artNetFailureCount >= MAX_CONSECUTIVE_FAILURES) {
                    log(logMessage, logLevel, { errorDetail: error.message, failureCount: artNetFailureCount, status: newStatus });
                    artNetFailureCount = 0;
                }
            }
            // For newStatus === 'tcp_timeout' and lastArtNetStatus === 'tcp_timeout', no repeated log to avoid noise.

            lastArtNetStatus = newStatus;
            io.emit('artnetStatus', {
                ip: targetIp,
                status: newStatus,
                message: clientMessage
            });
        });
}

function startLaserTime(io: Server) {
    loadConfig();
    loadScenes();
    
    // Check if we're in WSL and log special message about browser MIDI
    if (isRunningInWsl()) {
        log('Starting in WSL environment - hardware MIDI devices unavailable', 'SYSTEM');
        log('Users can still use Web MIDI API from browsers', 'SYSTEM');
    }
    
    initializeMidi(io);
    initOsc(io);
    initializeArtNet();

    // Start pinging ArtNet device every 5 seconds
    setInterval(() => pingArtNetDevice(io), 5000);

    io.on('connection', (socket: Socket) => {
        log('A user connected', 'SERVER', { socketId: socket.id });
        
        // Send initial state to the client
        socket.emit('initialState', {
            dmxChannels,
            oscAssignments,
            channelNames,
            fixtures,
            groups,
            midiMappings,
            artNetConfig,
            scenes
        });

        socket.on('setDmxChannel', ({ channel, value }: { channel: number; value: number }) => {
            log('Setting DMX channel via socket', 'DMX', { channel, value, socketId: socket.id });
            updateDmxChannel(channel, value);
            io.emit('dmxUpdate', { channel, value });
        });

        socket.on('saveScene', ({ name, oscAddress, state }: { name: string; oscAddress: string; state: number[] }) => {
            log('Saving scene via socket', 'INFO', { name, socketId: socket.id });
            saveScene(io, name, oscAddress, state);
        });

        socket.on('loadScene', ({ name }: { name: string }) => {
            log('Loading scene via socket', 'INFO', { name, socketId: socket.id });
            loadScene(io, name);
        });
        
        // MIDI learn mode handler for the startMidiLearn event
        socket.on('startMidiLearn', ({ channel }: { channel: number }) => {
            log('Starting MIDI learn via socket', 'MIDI', { channel, socketId: socket.id });
            
            // If already in learn mode, cancel it first
            if (currentMidiLearnChannel !== null) {
                log('Cancelling previous MIDI learn', 'MIDI', { channel: currentMidiLearnChannel });
                io.emit('midiLearnCancelled', { channel: currentMidiLearnChannel });
            }
            
            // Set the new channel for learning
            currentMidiLearnChannel = channel;
            
            // Auto-cancel MIDI learn after 30 seconds if no MIDI input is received
            if (midiLearnTimeout) {
                clearTimeout(midiLearnTimeout);
            }
            
            midiLearnTimeout = setTimeout(() => {
                if (currentMidiLearnChannel !== null) {
                    log('MIDI learn timed out', 'MIDI', { channel: currentMidiLearnChannel });
                    currentMidiLearnChannel = null;
                    io.emit('midiLearnTimeout', { channel });
                }
            }, 30000);
            
            io.emit('midiLearnStarted', { channel });
        });

        socket.on('learnMidiMapping', ({ channel }: { channel: number }) => {
            log('Starting MIDI learn via learnMidiMapping event', 'MIDI', { channel, socketId: socket.id });
            
            // If already in learn mode, cancel it first
            if (currentMidiLearnChannel !== null) {
                log('Cancelling previous MIDI learn', 'MIDI', { channel: currentMidiLearnChannel });
                io.emit('midiLearnCancelled', { channel: currentMidiLearnChannel });
            }
            
            // Set the new channel for learning
            currentMidiLearnChannel = channel;
            
            // Auto-cancel MIDI learn after 30 seconds if no MIDI input is received
            if (midiLearnTimeout) {
                clearTimeout(midiLearnTimeout);
            }
            
            midiLearnTimeout = setTimeout(() => {
                if (currentMidiLearnChannel !== null) {
                    log('MIDI learn timed out', 'MIDI', { channel: currentMidiLearnChannel });
                    currentMidiLearnChannel = null;
                    io.emit('midiLearnTimeout', { channel });
                }
            }, 30000);
            
            io.emit('midiLearnStarted', { channel });
            log('MIDI learn mode ACTIVE', 'MIDI', { channel, socketId: socket.id });
        });

        // Handle browser MIDI messages
        socket.on('browserMidiMessage', (msg: MidiMessage) => {
            log('Received browser MIDI message', 'MIDI', { msg, socketId: socket.id });
            // Forward the message to all clients to maintain MIDI visualization
            io.emit('midiMessage', msg);
            
            // Process the message the same way we would for hardware MIDI
            if (msg._type === 'noteon' || msg._type === 'cc') {
                handleMidiMessage(io, msg._type as 'noteon' | 'cc', msg);
            }
        });

        socket.on('error', (err: Error) => {
            log('Socket error', 'ERROR', { message: err.message, socketId: socket.id });
        });

        socket.on('disconnect', () => {
            log('User disconnected', 'SERVER', { socketId: socket.id });
        });
    });
}

// Add these missing function declarations
function addSocketHandlers(io: Server) {
    log('Socket handlers being initialized (via addSocketHandlers)', 'SERVER');
    // This is just a placeholder - all handlers are set up in startLaserTime
}

// Create a clearMidiMappings function
function clearMidiMappings(channelToRemove?: number) {
    if (channelToRemove !== undefined) {
        // Remove a specific channel mapping
        if (channelToRemove in midiMappings) {
            delete midiMappings[channelToRemove];
        }
    } else {
        // Clear all mappings
        midiMappings = {};
    }
}

// Create an updateArtNetConfig function
function updateArtNetConfig(config: Partial<ArtNetConfig>) {
    artNetConfig = { ...artNetConfig, ...config };
    // Re-initialize ArtNet with new config if needed
    if (artnetSender) {
        try {
            // Close the existing sender if possible
            if (typeof artnetSender.close === 'function') {
                artnetSender.close();
            }
            // Re-initialize with new config
            initializeArtNet();
        } catch (error) {
            log('Error reinitializing ArtNet with new config', 'ERROR', { error });
        }
    }
}

// Create an updateOscConfig function
function updateOscConfig(io: Server, config: Partial<OscConfig>) {
    oscConfig = { ...oscConfig, ...config };
    log('OSC config updated', 'OSC', { oscConfig });
    
    // Close existing OSC ports if they exist
    if (oscReceivePort && typeof oscReceivePort.close === 'function') {
        oscReceivePort.close();
        log('Closed existing OSC receive port', 'OSC');
    }
    if (oscSendPort && typeof oscSendPort.close === 'function') {
        oscSendPort.close();
        log('Closed existing OSC send port', 'OSC');
    }
    
    // Clear the references
    oscReceivePort = null;
    oscSendPort = null;
    sender = null; // Clear backward compatibility reference
    
    // Reinitialize OSC with new config
    initOsc(io);
    
    saveConfig(); // Persist changes
    return true;
}

// Create an updateOscAssignment function
export function updateOscAssignment(channelIndex: number, address: string): boolean {
    if (channelIndex < 0 || channelIndex >= oscAssignments.length) {
        log('Invalid channel index for OSC assignment', 'ERROR', { channelIndex });
        return false;
    }
    oscAssignments[channelIndex] = address;
    saveConfig(); // Persist changes    // Optionally, broadcast this change to connected clients if they need to be aware of it in real-time
    if ((global as any).io) {
        (global as any).io.emit('oscAssignmentsUpdated', { channelIndex, address });
        log('Emitted oscAssignmentsUpdated event', 'OSC', { channelIndex, address });
    }
    log('OSC assignment updated in backend', 'OSC', { channelIndex, address });
    return true;
}

// Use proper ES6 named exports
export {
    log,
    listMidiInterfaces,
    simulateMidiInput,
    learnMidiMapping,
    loadConfig,
    saveConfig,
    initOsc,
    startLaserTime,
    connectMidiInput,
    disconnectMidiInput,
    addSocketHandlers,
    updateDmxChannel as setDmxChannel, // Export with alias
    loadScene,    saveScene,
    updateScene,
    loadScenes,
    saveScenes,
    pingArtNetDevice,    clearMidiMappings,
    updateArtNetConfig,
    updateOscConfig,
    sendOscMessage
};
