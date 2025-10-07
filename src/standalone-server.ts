/**
 * ArtBastard DMX512FTW Server
 * Standalone entry point that combines all necessary functionality
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { json } from 'body-parser';
import easymidi from 'easymidi';
import os from 'os';
import { UDPPort } from 'osc';
import dmxnet from 'dmxnet';
import { log } from './logger'; // Import the new logger

// Constants and configurations
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const ACTS_FILE = path.join(DATA_DIR, 'acts.json');
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'app.log');

// --- Types (Inlined from various files) ---
interface MidiMessage {
    _type: string;
    channel: number;
    controller?: number;
    value?: number;
    note?: number;
    velocity?: number;
    number?: number;
    source?: string;
}

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
}

// --- Global state ---
let dmxChannels: number[] = new Array(512).fill(0);
let oscAssignments: string[] = new Array(512).fill('').map((_, i) => `/1/fader${i + 1}`);
let channelNames: string[] = new Array(512).fill('').map((_, i) => `CH ${i + 1}`);
let fixtures: Fixture[] = [];
let groups: Group[] = [];
let scenes: Scene[] = [];
let acts: any[] = []; // ACTS data storage
let sender: any = null;
let midiMappings: MidiMappings = {};
let midiInput: easymidi.Input | null = null;
let currentMidiLearnChannel: number | null = null;
let currentMidiLearnScene: string | null = null;
let midiLearnTimeout: NodeJS.Timeout | null = null;
let activeMidiInputs: { [name: string]: easymidi.Input } = {};
let artNetConfig: ArtNetConfig = {
    ip: "192.168.1.199",
    subnet: 0,
    universe: 0,
    net: 0,
    port: 6454,
    base_refresh_interval: 1000
};
let oscConfig: OscConfig = {
    host: '127.0.0.1',
    port: 8000
};
let artnetSender: any;

// --- Core functionality ---
function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsedConfig = JSON.parse(data);
        artNetConfig = { ...artNetConfig, ...parsedConfig.artNetConfig };
        oscConfig = { ...oscConfig, ...parsedConfig.oscConfig };
        midiMappings = parsedConfig.midiMappings || {};
        log('Config loaded', 'INFO', { artNetConfig, oscConfig });

        return {
            artNetConfig,
            oscConfig,
            midiMappings
        };
    } else {
        saveConfig();
        return {
            artNetConfig,
            oscConfig,
            midiMappings
        };
    }
}

function saveConfig() {
    const configToSave = {
        artNetConfig,
        oscConfig,
        midiMappings
    };

    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
    log('Config saved', 'INFO');
}

function updateOscConfig(newOscConfig: OscConfig) {
    log('Updating OSC configuration', 'OSC', { oldConfig: oscConfig, newConfig: newOscConfig });
    
    // Update the configuration
    oscConfig = { ...oscConfig, ...newOscConfig };
    
    // Save the updated configuration
    saveConfig();
    
    log('OSC configuration updated successfully', 'OSC', { oscConfig });
}

function isRunningInWsl(): boolean {
    return os.release().toLowerCase().includes('microsoft') ||
        os.release().toLowerCase().includes('wsl');
}

function loadScenes() {
    if (fs.existsSync(SCENES_FILE)) {
        const data = fs.readFileSync(SCENES_FILE, 'utf-8');
        log('Loading scenes from file', 'INFO');
        scenes = JSON.parse(data);
        return scenes;
    } else {
        scenes = [];
        saveScenes();
        return scenes;
    }
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
                updateDmxChannel(index, value, io);
            }
        });
        io.emit('sceneLoaded', { name, channelValues });
        log('Scene loaded', 'INFO', { name });
    } else {
        log('Error loading scene: Scene not found', 'WARN', { name });
        io.emit('sceneLoadError', { name, error: 'Scene not found' });
    }
}

function saveScenes(scenesToSave?: Scene[]) {
    if (scenesToSave) {
        scenes = scenesToSave;
    }

    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const scenesJson = JSON.stringify(scenes, null, 2);
    fs.writeFileSync(SCENES_FILE, scenesJson);
    log('Scenes saved to file', 'INFO');
}

function saveActs(actsToSave?: any[]) {
    if (actsToSave) {
        acts = actsToSave;
    }

    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const actsJson = JSON.stringify(acts, null, 2);
    fs.writeFileSync(ACTS_FILE, actsJson);
    log('Acts saved to file', 'INFO');
}

function loadActs() {
    if (fs.existsSync(ACTS_FILE)) {
        try {
            const data = fs.readFileSync(ACTS_FILE, 'utf-8');
            log('Loading acts from file', 'INFO');
            acts = JSON.parse(data);
            return acts;
        } catch (error) {
            log('Error loading acts from file', 'ERROR', { error: error instanceof Error ? error.message : String(error) });
            acts = [];
            return acts;
        }
    } else {
        log('No acts file found, starting with empty acts', 'INFO');
        acts = [];
        return acts;
    }
}

function saveFixtures(fixturesToSave?: Fixture[]) {
    if (fixturesToSave) {
        fixtures = fixturesToSave;
    }

    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const fixturesJson = JSON.stringify(fixtures, null, 2);
    fs.writeFileSync(path.join(DATA_DIR, 'fixtures.json'), fixturesJson);
    log('Fixtures saved to file', 'INFO');
}

function loadFixtures() {
    const fixturesFile = path.join(DATA_DIR, 'fixtures.json');
    if (fs.existsSync(fixturesFile)) {
        try {
            const data = fs.readFileSync(fixturesFile, 'utf-8');
            log('Loading fixtures from file', 'INFO');
            fixtures = JSON.parse(data);
            return fixtures;
        } catch (error) {
            log('Error loading fixtures from file', 'ERROR', { error: error instanceof Error ? error.message : String(error) });
            fixtures = [];
            return fixtures;
        }
    } else {
        log('No fixtures file found, starting with empty fixtures', 'INFO');
        fixtures = [];
        return fixtures;
    }
}

function saveGroups(groupsToSave?: Group[]) {
    if (groupsToSave) {
        groups = groupsToSave;
    }

    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const groupsJson = JSON.stringify(groups, null, 2);
    fs.writeFileSync(path.join(DATA_DIR, 'groups.json'), groupsJson);
    log('Groups saved to file', 'INFO');
}

function loadGroups() {
    const groupsFile = path.join(DATA_DIR, 'groups.json');
    if (fs.existsSync(groupsFile)) {
        try {
            const data = fs.readFileSync(groupsFile, 'utf-8');
            log('Loading groups from file', 'INFO');
            groups = JSON.parse(data);
            return groups;
        } catch (error) {
            log('Error loading groups from file', 'ERROR', { error: error instanceof Error ? error.message : String(error) });
            groups = [];
            return groups;
        }
    } else {
        log('No groups file found, starting with empty groups', 'INFO');
        groups = [];
        return groups;
    }
}

function updateDmxChannel(channel: number, value: number, io?: Server) {
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
    
    // Emit Socket.IO event to notify frontend clients (if io is available)
    if (io) {
        io.emit('dmxUpdate', { channel, value });
    }
}

function initializeArtNet() {
    try {
        const dmxnetInstance = new dmxnet.dmxnet({
            oem: 0,
            sName: "ArtBastard",
            lName: "ArtBastard DMX512 Controller",
            log: { level: 'none' }
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

        log('ArtNet sender initialized', 'ARTNET', { config: artNetConfig });
        return true;
    } catch (error) {
        log('Error initializing ArtNet', 'ERROR', { error });
        return false;
    }
}

function pingArtNetDevice(io: Server, ip?: string) {
    const targetIp = ip || artNetConfig.ip;
    const net = require('net');
    const socket = new net.Socket();
    const timeout = 1000; // 1 second timeout

    socket.setTimeout(timeout);

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
            log(`ArtNet device at ${targetIp} is alive`, 'ARTNET');
            io.emit('artnetStatus', { ip: targetIp, status: 'alive' });
        })
        .catch((error) => {
            log(`ArtNet device at ${targetIp} is unreachable`, 'WARN', { error: error.message });
            io.emit('artnetStatus', {
                ip: targetIp,
                status: 'unreachable',
                message: 'Device is not responding on ArtNet port'
            });
        });
}

function listMidiInterfaces() {
    try {
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

// Quick save/load slot functions
function handleQuickSaveSlot(io: Server, slot: number) {
    const slotName = `QuickSlot_${slot}`;
    const oscAddress = `/quick/slot/${slot}`;
    
    log(`OSC quick save to slot ${slot}: ${slotName}`, 'OSC');
    
    // Save current DMX state as a scene
    const newScene = {
        name: slotName,
        channelValues: [...dmxChannels],
        oscAddress: oscAddress
    };
    
    const existingSceneIndex = scenes.findIndex(s => s.name === slotName);
    if (existingSceneIndex !== -1) {
        scenes[existingSceneIndex] = newScene;
    } else {
        scenes.push(newScene);
    }
    
    saveScenes();
    io.emit('sceneSaved', slotName);
    io.emit('sceneList', scenes);
    
    // Notify all clients about the quick save
    io.emit('quickSceneSaved', { name: slotName, slot: slot, timestamp: Date.now() });
}

function handleQuickLoadSlot(io: Server, slot: number) {
    const slotName = `QuickSlot_${slot}`;
    const scene = scenes.find(s => s.name === slotName);
    
    if (scene) {
        log(`OSC quick load from slot ${slot}: ${slotName}`, 'OSC');
        loadScene(io, slotName);
        
        // Notify all clients about the quick load
        io.emit('quickSceneLoaded', { name: slotName, slot: slot, timestamp: Date.now() });
    } else {
        log(`OSC quick load failed - no scene found in slot ${slot}`, 'OSC', { slotName });
        io.emit('quickSceneLoadError', { slot: slot, error: 'No scene found in slot' });
    }
}

function initOsc(io: Server) {
    try {
        log('Initializing OSC...', 'OSC');
        log('OSC Configuration:', 'OSC');
        log(`  - Listen Address: 0.0.0.0 (all interfaces)`, 'OSC');
        log(`  - Listen Port: ${oscConfig.port} (UDP)`, 'OSC');
        
        const oscPort = new UDPPort({
            localAddress: "0.0.0.0",
            localPort: oscConfig.port,
            metadata: true
        });
        
        oscPort.on("ready", () => {
            log("OSC Port is ready", 'OSC');
            log(`OSC: Receiving on port ${oscConfig.port} (UDP)`, 'OSC');
            log('OSC: Receive-only mode active', 'OSC');
            io.emit('oscStatus', { status: 'connected', receivePort: oscConfig.port });
            sender = oscPort;
        });

        oscPort.on("error", (error: Error) => {
            log('OSC error', 'ERROR', { error: error.message });
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
                    if (value > 1.0) { // A simple heuristic, might need refinement
                        if (value <= 127.0) value = value / 127.0; // Common MIDI-like range
                        else if (value <= 255.0) value = value / 255.0; // Common DMX-like range
                    }
                    
                    value = Math.max(0.0, Math.min(1.0, value)); // Clamp to 0.0-1.0

                    log(`OSC activity for DMX ${channelIndex + 1} (${assignedAddress}): ${value}`, 'OSC', { args: oscMsg.args });
                    io.emit('oscChannelActivity', { channelIndex, value });
                }
            });

            // Process for scene triggers
            scenes.forEach(scene => {
                if (scene.oscAddress && oscMsg.address === scene.oscAddress && oscMsg.args.length > 0) {
                    let value = 0.0;
                    const firstArg = oscMsg.args[0];

                    if (typeof firstArg === 'number') {
                        value = parseFloat(firstArg.toString());
                    } else if (typeof firstArg === 'object' && firstArg !== null && 'value' in firstArg && typeof (firstArg as any).value === 'number') {
                        value = parseFloat((firstArg as any).value.toString());
                    } else {
                        log('OSC argument for scene trigger is not a recognized number format', 'OSC', { address: oscMsg.address, arg: firstArg });
                        return; // Skip if argument is not a number or expected object
                    }

                    // For scene triggers, we typically want to trigger on button press (value > 0.5)
                    if (value > 0.5) {
                        log(`OSC scene trigger: ${scene.name} (${oscMsg.address})`, 'OSC', { args: oscMsg.args });
                        loadScene(io, scene.name);
                    }
                }
            });

            // Process for quick scene capture OSC addresses
            if (oscMsg.args.length > 0) {
                let value = 0.0;
                const firstArg = oscMsg.args[0];

                if (typeof firstArg === 'number') {
                    value = parseFloat(firstArg.toString());
                } else if (typeof firstArg === 'object' && firstArg !== null && 'value' in firstArg && typeof (firstArg as any).value === 'number') {
                    value = parseFloat((firstArg as any).value.toString());
                }

                // Only trigger on button press (value > 0.5)
                if (value > 0.5) {
                    // Quick scene capture addresses
                    if (oscMsg.address === '/artbastard/quick/save' || oscMsg.address === '/quick/save') {
                        // Quick save current state as a scene
                        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
                        const quickName = `Quick_${timestamp}`;
                        const oscAddress = `/scene/${quickName.toLowerCase()}`;
                        
                        log(`OSC quick scene save: ${quickName}`, 'OSC', { address: oscMsg.address, args: oscMsg.args });
                        
                        // Save current DMX state as a scene
                        const newScene = {
                            name: quickName,
                            channelValues: [...dmxChannels],
                            oscAddress: oscAddress
                        };
                        
                        const existingSceneIndex = scenes.findIndex(s => s.name === quickName);
                        if (existingSceneIndex !== -1) {
                            scenes[existingSceneIndex] = newScene;
                        } else {
                            scenes.push(newScene);
                        }
                        
                        saveScenes();
                        io.emit('sceneSaved', quickName);
                        io.emit('sceneList', scenes);
                        
                        // Notify all clients about the quick save
                        io.emit('quickSceneSaved', { name: quickName, timestamp: Date.now() });
                        
                    } else if (oscMsg.address === '/artbastard/quick/save/1' || oscMsg.address === '/quick/save/1') {
                        // Quick save to slot 1
                        handleQuickSaveSlot(io, 1);
                    } else if (oscMsg.address === '/artbastard/quick/save/2' || oscMsg.address === '/quick/save/2') {
                        // Quick save to slot 2
                        handleQuickSaveSlot(io, 2);
                    } else if (oscMsg.address === '/artbastard/quick/save/3' || oscMsg.address === '/quick/save/3') {
                        // Quick save to slot 3
                        handleQuickSaveSlot(io, 3);
                    } else if (oscMsg.address === '/artbastard/quick/save/4' || oscMsg.address === '/quick/save/4') {
                        // Quick save to slot 4
                        handleQuickSaveSlot(io, 4);
                    } else if (oscMsg.address === '/artbastard/quick/save/5' || oscMsg.address === '/quick/save/5') {
                        // Quick save to slot 5
                        handleQuickSaveSlot(io, 5);
                    } else if (oscMsg.address === '/artbastard/quick/load/1' || oscMsg.address === '/quick/load/1') {
                        // Quick load from slot 1
                        handleQuickLoadSlot(io, 1);
                    } else if (oscMsg.address === '/artbastard/quick/load/2' || oscMsg.address === '/quick/load/2') {
                        // Quick load from slot 2
                        handleQuickLoadSlot(io, 2);
                    } else if (oscMsg.address === '/artbastard/quick/load/3' || oscMsg.address === '/quick/load/3') {
                        // Quick load from slot 3
                        handleQuickLoadSlot(io, 3);
                    } else if (oscMsg.address === '/artbastard/quick/load/4' || oscMsg.address === '/quick/load/4') {
                        // Quick load from slot 4
                        handleQuickLoadSlot(io, 4);
                    } else if (oscMsg.address === '/artbastard/quick/load/5' || oscMsg.address === '/quick/load/5') {
                        // Quick load from slot 5
                        handleQuickLoadSlot(io, 5);
                    }
                }
            }
        });

        oscPort.open();
        log("Opening OSC port...", 'OSC');
    } catch (error) {
        log('Error initializing OSC', 'ERROR', { error });
    }
}

// --- Create Express & Socket.IO server ---
function createServer() {
    const app = express();
    const server = http.createServer(app);

    // Ensure required directories exist
    [DATA_DIR, LOGS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                log(`Created directory: ${dir}`, 'INFO');
            } catch (error) {
                log(`Failed to create directory ${dir}`, 'ERROR', { error });
            }
        }
    });

    // CORS setup
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(json());

    // Socket.IO setup
    const io = new Server(server, {
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
        allowUpgrades: true
    });

    // Error handlers
    process.on('uncaughtException', (err) => {
        log('Uncaught Exception', 'ERROR', { message: err.message, stack: err.stack });
    });

    process.on('unhandledRejection', (reason) => {
        log('Unhandled Rejection', 'ERROR', { reason });
    });

    // Initialize core functionality
    loadConfig();
    loadScenes();
    loadActs();
    loadFixtures();
    loadGroups();
    initializeArtNet();
    initOsc(io);

    // Socket.IO handlers
    io.on('connection', (socket) => {
        log('A user connected', 'INFO', { socketId: socket.id });

        // Send initial state
        socket.emit('initialState', {
            dmxChannels,
            oscAssignments,
            channelNames,
            fixtures,
            groups,
            midiMappings,
            artNetConfig,
            scenes,
            acts
        });

        // Send fixtures and groups separately for multi-window sync
        socket.emit('fixturesLoaded', fixtures);
        socket.emit('groupsLoaded', groups);

        // Send MIDI interfaces
        const midiInterfaces = listMidiInterfaces();
        socket.emit('midiInterfaces', midiInterfaces.inputs);

        // Handle DMX channel updates
        socket.on('setDmxChannel', ({ channel, value }) => {
            updateDmxChannel(channel, value, io);
        });

        // Handle ArtNet config updates
        socket.on('updateArtNetConfig', (config) => {
            artNetConfig = { ...artNetConfig, ...config };
            saveConfig();
            initializeArtNet();
            io.emit('artnetStatus', { status: 'configUpdated' });
        });

        // Handle test connection
        socket.on('testArtNetConnection', (ip) => {
            pingArtNetDevice(io, ip);
        });

        // Handle scene saving
        socket.on('saveScene', ({ name, oscAddress, state }) => {
            const existingSceneIndex = scenes.findIndex(s => s.name === name);
            const newScene = {
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
        });

        // Handle scene loading
        socket.on('loadScene', ({ name }) => {
            log('Loading scene via socket', 'INFO', { name, socketId: socket.id });
            loadScene(io, name);
        });

        // Handle ACTS operations
        socket.on('saveActs', (actsData) => {
            log('Saving acts via socket', 'INFO', { numActs: actsData.length, socketId: socket.id });
            saveActs(actsData);
            io.emit('actsSaved', actsData);
        });

        socket.on('loadActs', () => {
            log('Loading acts via socket', 'INFO', { socketId: socket.id });
            socket.emit('actsLoaded', acts);
        });

        // Handle fixtures operations for multi-window sync
        socket.on('saveFixtures', (fixturesData) => {
            log('Saving fixtures via socket', 'INFO', { numFixtures: fixturesData.length, socketId: socket.id });
            fixtures = fixturesData;
            // Save fixtures to file (we'll need to add this function)
            saveFixtures();
            // Broadcast to all clients
            io.emit('fixturesUpdated', fixtures);
        });

        socket.on('loadFixtures', () => {
            log('Loading fixtures via socket', 'INFO', { socketId: socket.id });
            socket.emit('fixturesLoaded', fixtures);
        });

        // Handle groups operations for multi-window sync
        socket.on('saveGroups', (groupsData) => {
            log('Saving groups via socket', 'INFO', { numGroups: groupsData.length, socketId: socket.id });
            groups = groupsData;
            // Save groups to file (we'll need to add this function)
            saveGroups();
            // Broadcast to all clients
            io.emit('groupsUpdated', groups);
        });

        socket.on('loadGroups', () => {
            log('Loading groups via socket', 'INFO', { socketId: socket.id });
            socket.emit('groupsLoaded', groups);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            log('User disconnected', 'INFO', { socketId: socket.id });
        });
    });

    // Basic API routes
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });

    app.get('/api/state', (req, res) => {
        res.json({
            artNetConfig,
            midiMappings,
            scenes,
            acts,
            fixtures,
            groups,
            dmxChannels: new Array(512).fill(0),
            oscAssignments: new Array(512).fill('').map((_, i) => `/1/fader${i + 1}`),
            channelNames: new Array(512).fill('').map((_, i) => `CH ${i + 1}`)
        });
    });

    // Serve static files
    const reactAppPath = path.join(__dirname, '..', 'react-app', 'dist');
    if (fs.existsSync(reactAppPath)) {
        app.use(express.static(reactAppPath, {
            setHeaders: (res, path) => {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        }));

        // Serve React app for all other routes
        app.get('*', (req, res) => {
            res.sendFile(path.join(reactAppPath, 'index.html'));
        });
    } else {
        // Create simple fallback UI if no React app
        app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>ArtBastard DMX512FTW</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #1e1e1e; color: #eee; }
                        .container { max-width: 800px; margin: 50px auto; padding: 20px; }
                        h1 { color: #00b8ff; }
                        .status { background: #333; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>ArtBastard DMX512FTW</h1>
                        <div class="status">
                            <h2>Server Status: Active</h2>
                            <p>Backend API is running on port 3001</p>
                            <p>React app not found in build folder</p>
                        </div>
                        <p>API endpoints available at /api/*</p>
                    </div>
                </body>
                </html>
            `);
        });
    }

    return { app, server, io };
}

// --- Start the server ---
const { server } = createServer();
const port = 3001; // Changed from 3000 to avoid conflict

server.listen(port, '0.0.0.0', () => {
    log(`🚀 Server running at http://0.0.0.0:${port}`, 'SERVER');
    log(`🌐 Server accessible on local network at http://[YOUR_IP]:${port}`, 'SERVER');
    
    // Get and log the actual network IP for convenience
    const networkInterfaces = os.networkInterfaces();
    const networkIPs: string[] = [];
    
    Object.keys(networkInterfaces).forEach(key => {
        networkInterfaces[key]?.forEach(details => {
            if (details.family === 'IPv4' && !details.internal) {
                networkIPs.push(details.address);
            }
        });
    });
    
    if (networkIPs.length > 0) {
        networkIPs.forEach(ip => {
            log(`📱 Network access: http://${ip}:${port}`, 'SERVER');
        });
    }
});

server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Please close any applications using this port and try again.`, 'ERROR'); // Changed from CRITICAL to ERROR
    } else {
        log('SERVER ERROR', 'ERROR', { message: error.message });
    }
});

export {}; // Make this a module