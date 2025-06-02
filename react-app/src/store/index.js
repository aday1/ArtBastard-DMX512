import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
export const useStore = create()(devtools((set, get) => ({
    // Initial state
    dmxChannels: new Array(512).fill(0),
    oscAssignments: new Array(512).fill('').map((_, i) => `/fixture/DMX${i + 1}`),
    channelNames: new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
    selectedChannels: [],
    midiInterfaces: [],
    activeInterfaces: [],
    midiMappings: {},
    midiLearnTarget: null,
    midiLearnScene: null,
    midiMessages: [],
    oscMessages: [],
    fixtures: [],
    groups: [],
    scenes: [],
    artNetConfig: {
        ip: "192.168.1.199",
        subnet: 0,
        universe: 0,
        net: 0,
        port: 6454,
        base_refresh_interval: 1000
    },
    artNetStatus: 'disconnected',
    theme: 'artsnob',
    darkMode: true,
    // statusMessage: null, // Deprecated
    notifications: [],
    oscActivity: {},
    exampleSliderValue: 0,
    fixtureLayout: [],
    placedFixtures: [],
    masterSliders: [],
    canvasBackgroundImage: null,
    // Scene Transition State Init
    isTransitioning: false,
    transitionStartTime: null,
    transitionDuration: 1000,
    fromDmxValues: null,
    toDmxValues: null,
    currentTransitionFrame: null,
    socket: null,
    setSocket: (socket) => set({ socket }),
    // MIDI Clock Sync State Init
    availableMidiClockHosts: [
        { id: 'none', name: 'None (Internal Clock)' },
        { id: 'ableton-link', name: 'Ableton Sync Link' },
        // Other hosts would be populated dynamically
    ],
    selectedMidiClockHostId: 'none',
    midiClockBpm: 120.0,
    midiClockIsPlaying: false,
    midiClockCurrentBeat: 1,
    midiClockCurrentBar: 1,
    // Actions
    fetchInitialState: async () => {
        try {
            const response = await axios.get('/api/state', {
                timeout: 5000,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (response.status === 200 && response.data) {
                const state = response.data;
                set({
                    dmxChannels: state.dmxChannels || new Array(512).fill(0),
                    oscAssignments: state.oscAssignments || new Array(512).fill('').map((_, i) => `/fixture/DMX${i + 1}`),
                    channelNames: state.channelNames || new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
                    fixtures: state.fixtures || [],
                    groups: state.groups || [],
                    midiMappings: state.midiMappings || {},
                    artNetConfig: state.artNetConfig || get().artNetConfig,
                    scenes: state.scenes || [],
                    fixtureLayout: state.fixtureLayout || [],
                    masterSliders: state.masterSliders || []
                });
                if (state.settings && typeof state.settings.transitionDuration === 'number') {
                    set({ transitionDuration: state.settings.transitionDuration });
                }
                // No explicit success notification here, to avoid clutter on normal startup
                return;
            }
            throw new Error('Invalid response from server');
        }
        catch (error) {
            console.error('Failed to fetch initial state:', error);
            get().addNotification({
                message: error.code === 'ECONNABORTED'
                    ? 'Connection timeout - please check server status'
                    : 'Failed to fetch initial state - using default values',
                type: 'error',
                priority: 'high',
                persistent: true
            });
            set({
                dmxChannels: new Array(512).fill(0),
                oscAssignments: new Array(512).fill('').map((_, i) => `/fixture/DMX${i + 1}`),
                channelNames: new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
                fixtures: [],
                groups: [],
                midiMappings: {},
                scenes: [],
                fixtureLayout: [],
                masterSliders: [],
                transitionDuration: 1000,
            });
        }
    },
    setDmxChannel: (channel, value) => {
        const dmxChannels = [...get().dmxChannels];
        dmxChannels[channel] = value;
        set({ dmxChannels });
        axios.post('/api/dmx', { channel, value })
            .catch(error => {
            console.error('Failed to update DMX channel:', error);
            get().addNotification({ message: 'Failed to update DMX channel', type: 'error', priority: 'high' });
        });
    },
    setDmxChannelValue: (channel, value) => {
        get().setDmxChannel(channel, value);
    },
    setDmxChannelsForTransition: (values) => {
        set({ dmxChannels: values });
    },
    setCurrentTransitionFrameId: (frameId) => set({ currentTransitionFrame: frameId }),
    clearTransitionState: () => set({
        isTransitioning: false,
        transitionStartTime: null,
        fromDmxValues: null,
        toDmxValues: null,
        currentTransitionFrame: null,
    }),
    setTransitionDuration: (duration) => {
        if (duration >= 0) {
            set({ transitionDuration: duration });
        }
    },
    selectChannel: (channel) => {
        const selectedChannels = [...get().selectedChannels];
        if (!selectedChannels.includes(channel)) {
            selectedChannels.push(channel);
            set({ selectedChannels });
        }
    },
    deselectChannel: (channel) => {
        const selectedChannels = get().selectedChannels.filter(ch => ch !== channel);
        set({ selectedChannels });
    },
    toggleChannelSelection: (channel) => {
        const selectedChannels = [...get().selectedChannels];
        const index = selectedChannels.indexOf(channel);
        if (index === -1) {
            selectedChannels.push(channel);
        }
        else {
            selectedChannels.splice(index, 1);
        }
        set({ selectedChannels });
    },
    selectAllChannels: () => {
        const selectedChannels = Array.from({ length: 512 }, (_, i) => i);
        set({ selectedChannels });
    },
    deselectAllChannels: () => {
        set({ selectedChannels: [] });
    },
    invertChannelSelection: () => {
        const currentSelection = get().selectedChannels;
        const allChannels = Array.from({ length: 512 }, (_, i) => i);
        const newSelection = allChannels.filter(ch => !currentSelection.includes(ch));
        set({ selectedChannels: newSelection });
    },
    setOscAssignment: (channelIndex, address) => {
        const oscAssignments = [...get().oscAssignments];
        oscAssignments[channelIndex] = address;
        set({ oscAssignments });
        axios.post('/api/osc/assign', { channelIndex, address })
            .catch(error => {
            console.error('Failed to set OSC assignment:', error);
            get().addNotification({ message: 'Failed to set OSC assignment', type: 'error' });
        });
    },
    reportOscActivity: (channelIndex, value) => {
        set(state => ({
            oscActivity: {
                ...state.oscActivity,
                [channelIndex]: { value, timestamp: Date.now() }
            }
        }));
    },
    addOscMessage: (message) => {
        const messages = [...get().oscMessages, message].slice(-20); // Keep last 20 messages
        set({ oscMessages: messages });
        // console.log('OSC message received in store:', message); // Optional: for debugging
    },
    // MIDI Actions
    startMidiLearn: (target) => {
        set({ midiLearnTarget: target });
        get().addNotification({
            message: `MIDI Learn started for ${target.type === 'dmxChannel' ? 'DMX Ch: ' + (target.channelIndex + 1) : 'Master Slider: ' + target.id}`,
            type: 'info',
            priority: 'low'
        });
        if (target.type === 'dmxChannel') {
            axios.post('/api/midi/learn', { channel: target.channelIndex })
                .catch(error => {
                console.error('Failed to start MIDI learn for DMX channel:', error);
                get().addNotification({ message: 'Failed to start MIDI learn for DMX channel', type: 'error' });
            });
        }
    },
    cancelMidiLearn: () => {
        const currentTarget = get().midiLearnTarget;
        set({ midiLearnTarget: null });
        get().addNotification({ message: 'MIDI Learn cancelled', type: 'info', priority: 'low' });
        if (currentTarget && currentTarget.type === 'dmxChannel') {
            axios.post('/api/midi/cancel-learn', { channel: currentTarget.channelIndex })
                .catch(error => {
                console.error('Failed to cancel MIDI learn for DMX channel:', error);
            });
        }
    },
    addMidiMessage: (message) => {
        const messages = [...get().midiMessages, message].slice(-20);
        set({ midiMessages: messages });
        console.log('MIDI message received:', message);
    },
    addMidiMapping: (dmxChannel, mapping) => {
        const midiMappings = { ...get().midiMappings };
        midiMappings[dmxChannel] = mapping;
        set({ midiMappings, midiLearnTarget: null });
        axios.post('/api/midi/mapping', { dmxChannel, mapping })
            .then(() => {
            get().addNotification({ message: `MIDI mapped to DMX Ch: ${dmxChannel + 1}`, type: 'success' });
        })
            .catch(error => {
            console.error('Failed to add MIDI mapping:', error);
            get().addNotification({ message: 'Failed to add MIDI mapping', type: 'error', priority: 'high' });
        });
    },
    removeMidiMapping: (dmxChannel) => {
        const midiMappings = { ...get().midiMappings };
        delete midiMappings[dmxChannel];
        set({ midiMappings });
        axios.delete(`/api/midi/mapping/${dmxChannel}`)
            .then(() => {
            get().addNotification({ message: `MIDI mapping removed for DMX Ch: ${dmxChannel + 1}`, type: 'success' });
        })
            .catch(error => {
            console.error('Failed to remove MIDI mapping:', error);
            get().addNotification({ message: 'Failed to remove MIDI mapping', type: 'error' });
        });
    },
    clearAllMidiMappings: () => {
        set({ midiMappings: {} });
        axios.delete('/api/midi/mappings')
            .then(() => {
            get().addNotification({ message: 'All MIDI mappings cleared', type: 'success' });
        })
            .catch(error => {
            console.error('Failed to clear all MIDI mappings:', error);
            get().addNotification({ message: 'Failed to clear all MIDI mappings', type: 'error' });
        });
    },
    // Scene Actions
    saveScene: (name, oscAddress) => {
        const dmxChannels = get().dmxChannels;
        const newScene = {
            name,
            channelValues: [...dmxChannels],
            oscAddress
        };
        const scenes = [...get().scenes];
        const existingIndex = scenes.findIndex(s => s.name === name);
        if (existingIndex !== -1) {
            scenes[existingIndex] = newScene;
        }
        else {
            scenes.push(newScene);
        }
        set({ scenes });
        axios.post('/api/scenes', newScene)
            .then(() => {
            get().addNotification({ message: `Scene '${name}' saved`, type: 'success' });
        })
            .catch(error => {
            console.error('Failed to save scene:', error);
            get().addNotification({ message: `Failed to save scene '${name}'`, type: 'error', priority: 'high' });
        });
    },
    loadScene: (name) => {
        const { scenes, isTransitioning, currentTransitionFrame, dmxChannels: currentDmxState, transitionDuration } = get();
        const scene = scenes.find(s => s.name === name);
        if (scene) {
            if (isTransitioning && currentTransitionFrame) {
                cancelAnimationFrame(currentTransitionFrame);
                set({ currentTransitionFrame: null });
            }
            set({
                isTransitioning: true,
                fromDmxValues: [...currentDmxState],
                toDmxValues: [...scene.channelValues],
                transitionStartTime: Date.now(),
            });
            get().addNotification({ message: `Loading scene '${name}' (${transitionDuration}ms)`, type: 'info' });
            axios.post('/api/scenes/load', { name })
                .catch(error => {
                console.error('Failed to load scene:', error);
                get().addNotification({ message: `Failed to load scene '${name}'`, type: 'error', priority: 'high' });
            });
        }
        else {
            get().addNotification({ message: `Scene "${name}" not found`, type: 'error', priority: 'high' });
        }
    },
    updateScene: (originalName, updates) => {
        const scenes = [...get().scenes];
        const sceneIndex = scenes.findIndex(s => s.name === originalName);
        if (sceneIndex !== -1) {
            scenes[sceneIndex] = { ...scenes[sceneIndex], ...updates };
            set({ scenes });
            axios.put(`/api/scenes/${encodeURIComponent(originalName)}`, updates)
                .then(() => {
                get().addNotification({ message: `Scene '${originalName}' updated`, type: 'success' });
            })
                .catch(error => {
                console.error('Failed to update scene:', error);
                get().addNotification({ message: `Failed to update scene '${originalName}'`, type: 'error' });
            });
        }
        else {
            get().addNotification({ message: `Scene "${originalName}" not found`, type: 'error' });
        }
    },
    deleteScene: (name) => {
        const scenes = get().scenes.filter(s => s.name !== name);
        set({ scenes });
        axios.delete(`/api/scenes/${encodeURIComponent(name)}`)
            .then(() => {
            get().addNotification({ message: `Scene '${name}' deleted`, type: 'success' });
        })
            .catch(error => {
            console.error('Failed to delete scene:', error);
            get().addNotification({ message: `Failed to delete scene '${name}'`, type: 'error' });
        });
    },
    // Config Actions
    updateArtNetConfig: (config) => {
        const socket = get().socket;
        if (socket?.connected) {
            socket.emit('updateArtNetConfig', config);
            set({ artNetConfig: { ...get().artNetConfig, ...config } });
            get().addNotification({ message: 'ArtNet config updated. Restart may be required.', type: 'info' });
        }
        else {
            get().addNotification({ message: 'Cannot update ArtNet config: not connected to server', type: 'error', priority: 'high' });
        }
    }, testArtNetConnection: () => {
        const socket = get().socket;
        if (socket?.connected) {
            socket.emit('testArtNetConnection');
            get().addNotification({ message: 'Testing ArtNet connection...', type: 'info' });
        }
        else {
            get().addNotification({ message: 'Cannot test ArtNet: not connected to server', type: 'error', priority: 'high' });
        }
    },
    // Theme Actions
    setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('theme', theme);
        get().addNotification({ message: `Theme changed to ${theme}`, type: 'info' });
    },
    toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        set({ darkMode: newDarkMode });
        localStorage.setItem('darkMode', newDarkMode.toString());
        document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
        get().addNotification({ message: `${newDarkMode ? 'Dark' : 'Light'} mode enabled`, type: 'info' });
    },
    // Deprecated actions - can be removed later
    // showStatusMessage: (text, type) => { 
    //   get().addNotification({ message: text, type });
    // },
    // clearStatusMessage: () => {},
    // Notification Actions
    addNotification: (notificationInput) => {
        const newNotification = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            message: notificationInput.message,
            type: notificationInput.type,
            priority: notificationInput.priority || 'normal',
            persistent: notificationInput.persistent || false,
            dismissible: notificationInput.dismissible !== undefined ? notificationInput.dismissible : true,
        };
        set((state) => {
            const updatedNotifications = [...state.notifications, newNotification];
            updatedNotifications.sort((a, b) => {
                const priorityOrder = { high: 0, normal: 1, low: 2 };
                const priorityA = priorityOrder[a.priority || 'normal'];
                const priorityB = priorityOrder[b.priority || 'normal'];
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return b.timestamp - a.timestamp; // Newest first for same priority
            });
            return { notifications: updatedNotifications };
        });
    },
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
    })),
    clearAllNotifications: () => {
        set({ notifications: [] });
    },
    setExampleSliderValue: (value) => set({ exampleSliderValue: value }),
    setFixtureLayout: (layout) => {
        set({ fixtureLayout: layout });
    },
    setCanvasBackgroundImage: (image) => {
        set({ canvasBackgroundImage: image });
    },
    addMasterSlider: (slider) => {
        set(state => ({ masterSliders: [...state.masterSliders, slider] }));
        get().addNotification({ message: `Master slider '${slider.name}' added`, type: 'success' });
    },
    updateMasterSliderValue: (sliderId, value) => {
        const { masterSliders, fixtureLayout, fixtures, setDmxChannel: dmxSetter } = get();
        const updatedSliders = masterSliders.map(s => s.id === sliderId ? { ...s, value } : s);
        set({ masterSliders: updatedSliders });
        const activeSlider = updatedSliders.find(s => s.id === sliderId);
        if (activeSlider && activeSlider.targets) {
            activeSlider.targets.forEach(target => {
                const pFixture = fixtureLayout.find(pf => pf.id === target.placedFixtureId);
                if (!pFixture)
                    return;
                const fixtureDef = fixtures.find(fDef => fDef.name === pFixture.fixtureStoreId);
                if (!fixtureDef || target.channelIndex >= fixtureDef.channels.length)
                    return;
                const actualDmxAddress = pFixture.startAddress + target.channelIndex - 1;
                if (actualDmxAddress >= 0 && actualDmxAddress < 512) {
                    const masterValueNormalized = value / 255;
                    let targetDmxValue = target.minRange + masterValueNormalized * (target.maxRange - target.minRange);
                    targetDmxValue = Math.round(targetDmxValue);
                    targetDmxValue = Math.max(0, Math.min(255, targetDmxValue));
                    dmxSetter(actualDmxAddress, targetDmxValue);
                }
            });
        }
    },
    updateMasterSlider: (sliderId, updatedSliderData) => {
        set(state => ({
            masterSliders: state.masterSliders.map(s => s.id === sliderId ? { ...s, ...updatedSliderData } : s)
        }));
        get().addNotification({ message: `Master slider '${updatedSliderData.name || sliderId}' updated`, type: 'info' });
    },
    removeMasterSlider: (sliderId) => {
        set(state => ({
            masterSliders: state.masterSliders.filter(s => s.id !== sliderId)
        }));
        get().addNotification({ message: `Master slider removed`, type: 'success' });
    },
    setMasterSliders: (sliders) => {
        set({ masterSliders: sliders });
    },
    setSelectedMidiClockHostId: (hostId) => {
        set({ selectedMidiClockHostId: hostId });
        // Potentially add logic here to initiate connection/disconnection if needed globally
        get().addNotification({
            message: `MIDI Clock Sync source set to ${get().availableMidiClockHosts.find(h => h.id === hostId)?.name || 'None'}`,
            type: 'info',
        });
    },
    setAvailableMidiClockHosts: (hosts) => {
        set({ availableMidiClockHosts: hosts });
    },
    setMidiClockBpm: (bpm) => set({ midiClockBpm: bpm }),
    setMidiClockIsPlaying: (isPlaying) => set({ midiClockIsPlaying: isPlaying }),
    setMidiClockBeatBar: (beat, bar) => set({ midiClockCurrentBeat: beat, midiClockCurrentBar: bar }),
    toggleInternalMidiClockPlayState: () => {
        const currentIsPlaying = get().midiClockIsPlaying;
        if (!currentIsPlaying) {
            // Starting the clock, reset beat and bar
            set({
                midiClockIsPlaying: true,
                midiClockCurrentBeat: 1,
                midiClockCurrentBar: 1
            });
        }
        else {
            // Stopping the clock
            set({ midiClockIsPlaying: false });
        }
    },
}), { name: 'ArtBastard-DMX-Store' }));
if (typeof window !== 'undefined') {
    window.useStore = useStore;
}
