import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import axios from 'axios'
import { Socket } from 'socket.io-client'

export interface MidiMapping {
  channel: number
  note?: number
  controller?: number
}

export interface Fixture {
  id: string
  name: string
  startAddress: number
  channels: { name: string; type: string }[]
}

export interface Group {
  id: string;
  name: string;
  fixtureIndices: number[];
  // New fields for enhanced functionality
  lastStates: number[]; // Last known DMX values for each fixture in the group
  position?: { x: number; y: number }; // Position on 2D canvas
  isMuted: boolean;
  isSolo: boolean;
  masterValue: number; // Current master value (0-255)
  midiMapping?: MidiMapping;
  oscAddress?: string;
}

export interface Scene {
  name: string
  channelValues: number[]
  oscAddress: string
  midiMapping?: MidiMapping
}

export interface ArtNetConfig {
  ip: string
  subnet: number
  universe: number
  net: number
  port: number
  base_refresh_interval: number
}

export interface OscActivity {
  value: number // Float value 0.0 to 1.0
  timestamp: number // Timestamp of the last message
}

// Define OscMessage interface
export interface OscMessage {
  address: string;
  args: Array<{ type: string; value: any }>;

  // Optional: if source information is available
  source?: string; 
  // Optional: for ordering or display
  timestamp?: number; 
}

// Define PlacedFixture type for 2D canvas layout
export interface PlacedFixture {
  id: string; 
  fixtureId: string;
  fixtureStoreId: string; 
  name: string; 
  x: number;
  y: number;
  color: string;
  radius: number;
  startAddress: number; // DMX start address for this fixture
  controls?: PlacedControl[]; // Optional array for controls associated with this fixture
}

// Definition for PlacedControl on the 2D canvas, associated with a PlacedFixture
export interface PlacedControl {
  id: string;                     // Unique ID for this control instance
  channelNameInFixture: string; // Name of the channel within the fixture's definition (e.g., "Dimmer", "Pan")
  type: 'slider';                 // Initially, only sliders are supported
  label: string;                  // Display label for the control (e.g., could be same as channelNameInFixture or custom)
  xOffset: number;                // X position relative to the fixture icon's center
  yOffset: number;                // Y position relative to the fixture icon's center
  currentValue: number;           // Current value of this control (0-255), directly maps to DMX for now
}

// Define MasterSlider related types
export interface MasterSliderTarget {
  placedFixtureId: string;        // ID of the PlacedFixture instance on the canvas
  channelIndex: number;           // Index of the channel within that fixture's definition (0-based)
  channelNameInFixture: string;   // Name of the channel (e.g., "Dimmer", "Pan") for display and easier association
  minRange: number;               // Min value for the target channel (e.g., 0)
  maxRange: number;               // Max value for the target channel (e.g., 255)
}

export interface MasterSlider {
  id: string;
  name: string;
  value: number; // Current value (0-255, or 0-1, let's use 0-255 for consistency with DMX)
  targets: MasterSliderTarget[];
  position: { x: number; y: number }; // Position on the 2D canvas
  midiMapping?: MidiMapping; // Re-use existing MidiMapping type
}

// Notification type definition (used in State and actions)
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  priority?: 'low' | 'normal' | 'high';
  persistent?: boolean;
  dismissible?: boolean;
  timestamp: number;
}

// Input type for addNotification action
export type AddNotificationInput = Omit<Notification, 'id' | 'timestamp'>;

// Type for batch DMX channel updates
export type DmxChannelBatchUpdate = Record<number, number>;

interface State {
  // DMX State
  dmxChannels: number[]
  oscAssignments: string[]
  channelNames: string[]
  selectedChannels: number[]
  
  // MIDI State
  midiInterfaces: string[]
  activeInterfaces: string[]
  midiMappings: Record<number, MidiMapping | undefined> 
  midiLearnTarget: 
    | { type: 'masterSlider'; id: string }
    | { type: 'dmxChannel'; channelIndex: number }
    | { type: 'placedControl'; fixtureId: string; controlId: string }
    | { type: 'group'; groupId: string }
    | null;
  midiLearnScene: string | null 
  midiMessages: any[]
  oscMessages: OscMessage[]; // Added for OSC Monitor

  // Fixtures and Groups
  fixtures: Fixture[]
  groups: Group[]
  
  // Scenes
  scenes: Scene[]
  
  // ArtNet
  artNetConfig: ArtNetConfig
  artNetStatus: 'connected' | 'disconnected' | 'error' | 'timeout'  
  // UI State
  theme: 'artsnob' | 'standard' | 'minimal';
  darkMode: boolean;
  // statusMessage: { text: string; type: 'success' | 'error' | 'info' | 'warning' } | null; // Deprecated
  notifications: Notification[]; // Use the new Notification interface
  oscActivity: Record<number, OscActivity> 
  exampleSliderValue: number;
  fixtureLayout: PlacedFixture[]; 
  placedFixtures: PlacedFixture[]; 
  masterSliders: MasterSlider[]; 
  canvasBackgroundImage: HTMLImageElement | null; 

  // Scene Transition State
  isTransitioning: boolean;
  transitionStartTime: number | null;
  transitionDuration: number; // in ms
  fromDmxValues: number[] | null;
  toDmxValues: number[] | null;
  currentTransitionFrame: number | null; // requestAnimationFrame ID
  
  // Socket state
  socket: Socket | null
  setSocket: (socket: Socket | null) => void

  // MIDI Clock Sync State
  availableMidiClockHosts: Array<{ id: string; name: string }>;
  selectedMidiClockHostId: string | null;
  midiClockBpm: number;
  midiClockIsPlaying: boolean;
  midiClockCurrentBeat: number;
  midiClockCurrentBar: number;

  // Auto-Scene Feature State
  autoSceneEnabled: boolean;
  autoSceneList: string[]; // Names of scenes selected for auto-sequencing
  autoSceneMode: 'forward' | 'ping-pong' | 'random';
  autoSceneCurrentIndex: number;
  autoScenePingPongDirection: 'forward' | 'backward';
  autoSceneBeatDivision: number; // e.g., 4 for every 4 beats (1 bar in 4/4)
  autoSceneManualBpm: number;
  autoSceneTapTempoBpm: number;
  autoSceneLastTapTime: number; // For tap tempo calculation
  autoSceneTapTimes: number[]; // Stores recent tap intervals
  autoSceneTempoSource: 'internal_clock' | 'manual_bpm' | 'tap_tempo';

  // Actions
  fetchInitialState: () => Promise<void>
  setDmxChannel: (channel: number, value: number) => void
  setMultipleDmxChannels: (updates: DmxChannelBatchUpdate) => void; // New action for batch updates
  setDmxChannelValue: (channel: number, value: number) => void 
  setDmxChannelsForTransition: (values: number[]) => void; 
  setCurrentTransitionFrameId: (frameId: number | null) => void; 
  clearTransitionState: () => void; 
  setTransitionDuration: (duration: number) => void; 
  selectChannel: (channel: number) => void
  deselectChannel: (channel: number) => void
  toggleChannelSelection: (channel: number) => void
  selectAllChannels: () => void
  deselectAllChannels: () => void
  invertChannelSelection: () => void
  setOscAssignment: (channelIndex: number, address: string) => void
  reportOscActivity: (channelIndex: number, value: number) => void 
  addOscMessage: (message: OscMessage) => void; // Added for OSC Monitor
  
  // MIDI Actions
  startMidiLearn: (target: { type: 'masterSlider', id: string } | { type: 'dmxChannel', channelIndex: number }) => void;
  cancelMidiLearn: () => void
  addMidiMessage: (message: any) => void
  addMidiMapping: (dmxChannel: number, mapping: MidiMapping) => void 
  removeMidiMapping: (dmxChannel: number) => void
  clearAllMidiMappings: () => void
  
  // Scene Actions
  saveScene: (name: string, oscAddress: string) => void
  loadScene: (name: string) => void
  deleteScene: (name: string) => void
  updateScene: (originalName: string, updates: Partial<Scene>) => void; // New action for updating scenes
  
  // Config Actions
  updateArtNetConfig: (config: Partial<ArtNetConfig>) => void
  testArtNetConnection: () => void  
  // UI Actions
  setTheme: (theme: 'artsnob' | 'standard' | 'minimal') => void;
  toggleDarkMode: () => void;
  // showStatusMessage: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void; // Deprecated
  // clearStatusMessage: () => void; // Deprecated
  addNotification: (notification: AddNotificationInput) => void; // Use AddNotificationInput
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setExampleSliderValue: (value: number) => void;
  setFixtureLayout: (layout: PlacedFixture[]) => void 
  setCanvasBackgroundImage: (image: HTMLImageElement | null) => void 
  addMasterSlider: (slider: MasterSlider) => void;
  updateMasterSliderValue: (sliderId: string, value: number) => void;
  updateMasterSlider: (sliderId: string, updatedSlider: Partial<MasterSlider>) => void; 
  removeMasterSlider: (sliderId: string) => void;
  setMasterSliders: (sliders: MasterSlider[]) => void;
  setSelectedMidiClockHostId: (hostId: string | null) => void; // Will be called by WS handler too
  setAvailableMidiClockHosts: (hosts: Array<{ id: string; name: string }>) => void; // Called by WS handler
  setMidiClockBpm: (bpm: number) => void; // Called by WS handler, and also repurposed for user requests
  setMidiClockIsPlaying: (isPlaying: boolean) => void; // Called by WS handler
  setMidiClockBeatBar: (beat: number, bar: number) => void; // Called by WS handler
  requestToggleMasterClockPlayPause: () => void; // Renamed action

  // Auto-Scene Actions
  setAutoSceneEnabled: (enabled: boolean) => void;
  setAutoSceneList: (sceneNames: string[]) => void;
  setAutoSceneMode: (mode: 'forward' | 'ping-pong' | 'random') => void;
  setAutoSceneBeatDivision: (division: number) => void;
  setAutoSceneTempoSource: (source: 'internal_clock' | 'manual_bpm' | 'tap_tempo') => void;
  setNextAutoSceneIndex: () => void; // Calculates and updates autoSceneCurrentIndex
  resetAutoSceneIndex: () => void;
  setManualBpm: (bpm: number) => void; // For auto-scene manual tempo
  recordTapTempo: () => void;         // For auto-scene tap tempo

  // Enhanced Group State
  updateGroup: (groupId: string, groupData: Partial<Group>) => void;  
  addGroupToCanvas: (group: Group, position: { x: number; y: number }) => void;
  updateGroupPosition: (groupId: string, position: { x: number; y: number }) => void;
  setGroupMasterValue: (groupId: string, value: number) => void;
  setGroupMute: (groupId: string, isMuted: boolean) => void;
  setGroupSolo: (groupId: string, isSolo: boolean) => void;
  saveGroupLastStates: (groupId: string) => void;

  // Group MIDI actions
  startGroupMidiLearn: (groupId: string) => {
    set(() => ({ midiLearnTarget: { type: 'group', groupId } }));
    get().addNotification({ 
      message: `MIDI Learn started for group - send a MIDI message`,
      type: 'info',
      priority: 'normal'
    });
  },

  cancelGroupMidiLearn: () =>
    set(state => {
      const currentTarget = state.midiLearnTarget;
      if (currentTarget?.type === 'group') {
        return { midiLearnTarget: null };
      }
      return state;
    }),

  setGroupMidiMapping: (groupId: string, mapping: MidiMapping | undefined) =>
    set((state) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, midiMapping: mapping } : g
      )
    })),

  handleMidiForGroups: (message: any) => {
    const state = get();
    
    // Handle MIDI learn mode for groups
    if (state.midiLearnTarget?.type === 'group') {
      const group = state.groups.find(g => g.id === state.midiLearnTarget.groupId);
      if (!group) return;

      let midiMapping: MidiMapping;
      if (message._type === 'cc' && message.controller !== undefined) {
        midiMapping = {
          channel: message.channel,
          controller: message.controller
        };
      } else if (message._type === 'noteon' && message.note !== undefined) {
        midiMapping = {
          channel: message.channel,
          note: message.note
        };
      } else {
        return; // Ignore other MIDI message types
      }

      get().setGroupMidiMapping(state.midiLearnTarget.groupId, midiMapping);
      set({ midiLearnTarget: null });
      get().addNotification({
        message: `MIDI mapping assigned to group ${group.name}`,
        type: 'success',
        priority: 'normal'
      });
      return;
    }

    // Handle incoming MIDI messages for mapped groups
    state.groups.forEach(group => {
      if (!group.midiMapping) return;

      const mapping = group.midiMapping;
      if (message._type === 'cc' && mapping.controller !== undefined && 
          message.channel === mapping.channel && message.controller === mapping.controller) {
        // Scale MIDI CC value (0-127) to DMX value (0-255)
        const value = Math.round((message.value / 127) * 255);
        get().setGroupMasterValue(group.id, value);
      } else if (message._type === 'noteon' && mapping.note !== undefined && 
               message.channel === mapping.channel && message.note === mapping.note) {
        // Toggle between 0 and full (255) for note messages
        const newValue = group.masterValue === 0 ? 255 : 0;
        get().setGroupMasterValue(group.id, newValue);
      }
    });
  },
}

// Helper function to initialize darkMode from localStorage with fallback to true
const initializeDarkMode = (): boolean => {
  try {
    const stored = localStorage.getItem('darkMode');
    const darkMode = stored !== null ? stored === 'true' : true; // Default to true if not found
    
    // Apply theme immediately on initialization
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    
    return darkMode;
  } catch (error) {
    console.warn('Failed to read darkMode from localStorage, using default (true):', error);
    document.documentElement.setAttribute('data-theme', 'dark');
    return true;
  }
};

export const useStore = create<State>()(
  devtools(
    (set, get) => ({
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
      oscMessages: [], // Initialized oscMessages

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
      darkMode: initializeDarkMode(),
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
      transitionDuration: 1000, // Default 1 second
      fromDmxValues: null,
      toDmxValues: null,
      currentTransitionFrame: null,
      
      socket: null,
      setSocket: (socket) => set({ socket }),      // MIDI Clock Sync State Init
      availableMidiClockHosts: [
        { id: 'internal', name: 'Internal Clock' },
        { id: 'none', name: 'None (Disabled)' },
        { id: 'ableton-link', name: 'Ableton Sync Link' },
        // Other hosts would be populated dynamically
      ],
      selectedMidiClockHostId: 'internal',
      midiClockBpm: 120.0,
      midiClockIsPlaying: false,
      midiClockCurrentBeat: 1,
      midiClockCurrentBar: 1,

      // Auto-Scene Feature State Init
      autoSceneEnabled: false,
      autoSceneList: [],
      autoSceneMode: 'forward',
      autoSceneCurrentIndex: -1, // Indicates no scene selected or sequence not started
      autoScenePingPongDirection: 'forward',
      autoSceneBeatDivision: 4, // Default to 1 bar (4 beats)
      autoSceneManualBpm: 120,
      autoSceneTapTempoBpm: 120,
      autoSceneLastTapTime: 0,
      autoSceneTapTimes: [],
      autoSceneTempoSource: 'internal_clock',
      
      // Actions
      fetchInitialState: async () => {
        try {
          const response = await axios.get('/api/state', {
            timeout: 5000,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          
          if (response.status === 200 && response.data) {
            const state = response.data
            
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
            })

            if (state.settings && typeof state.settings.transitionDuration === 'number') {
                set({ transitionDuration: state.settings.transitionDuration });
            }
            // No explicit success notification here, to avoid clutter on normal startup
            return 
          }
          throw new Error('Invalid response from server')
        } catch (error: any) {
          console.error('Failed to fetch initial state:', error)
          get().addNotification({ 
            message:
              error.code === 'ECONNABORTED'
                ? 'Connection timeout - please check server status'
                : 'Failed to fetch initial state - using default values',
            type: 'error',
            priority: 'high',
            persistent: true
          })
          
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
          })
        }
      },
      
      setDmxChannel: (channel, value) => { 
        const dmxChannels = [...get().dmxChannels]
        dmxChannels[channel] = value
        set({ dmxChannels })
        
        axios.post('/api/dmx', { channel, value })
          .catch(error => {
            console.error('Failed to update DMX channel:', error)
            get().addNotification({ message: 'Failed to update DMX channel', type: 'error', priority: 'high' }) 
          })
      },

      setMultipleDmxChannels: (updates) => {
        const currentDmxChannels = get().dmxChannels;
        const newDmxChannels = [...currentDmxChannels];
        for (const channelStr in updates) {
          const channel = parseInt(channelStr, 10);
          if (channel >= 0 && channel < newDmxChannels.length) {
            newDmxChannels[channel] = updates[channel];
          }
        }
        set({ dmxChannels: newDmxChannels });

        axios.post('/api/dmx/batch', updates)
          .catch(error => {
            console.error('Failed to update DMX channels in batch:', error);
            get().addNotification({ message: 'Failed to update DMX channels in batch', type: 'error', priority: 'high' });
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
        const selectedChannels = [...get().selectedChannels]
        if (!selectedChannels.includes(channel)) {
          selectedChannels.push(channel)
          set({ selectedChannels })
        }
      },
      
      deselectChannel: (channel) => {
        const selectedChannels = get().selectedChannels.filter(ch => ch !== channel)
        set({ selectedChannels })
      },
      
      toggleChannelSelection: (channel) => {
        const selectedChannels = [...get().selectedChannels]
        const index = selectedChannels.indexOf(channel)
        
        if (index === -1) {
          selectedChannels.push(channel)
        } else {
          selectedChannels.splice(index, 1)
        }
        
        set({ selectedChannels })
      },
      
      selectAllChannels: () => {
        const selectedChannels = Array.from({ length: 512 }, (_, i) => i)
        set({ selectedChannels })
      },
      
      deselectAllChannels: () => {
        set({ selectedChannels: [] })
      },
      
      invertChannelSelection: () => {
        const currentSelection = get().selectedChannels
        const allChannels = Array.from({ length: 512 }, (_, i) => i)
        const newSelection = allChannels.filter(ch => !currentSelection.includes(ch))
        set({ selectedChannels: newSelection })
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
      
      addOscMessage: (message) => { // Implemented addOscMessage
        const messages = [...get().oscMessages, message].slice(-20); // Keep last 20 messages
        set({ oscMessages: messages });
        // console.log('OSC message received in store:', message); // Optional: for debugging
      },

      // MIDI Actions
      startMidiLearn: (target) => {
        set({ midiLearnTarget: target });
        get().addNotification({ 
          message: `MIDI Learn started for ${target.type === 'dmxChannel' ? 'DMX Ch: ' + (target.channelIndex + 1) : 'Master Slider: ' + target.id }`, 
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
        const messages = [...get().midiMessages, message].slice(-20)
        set({ midiMessages: messages })
        console.log('MIDI message received:', message)
      },
      
      addMidiMapping: (dmxChannel, mapping) => {
        const midiMappings = { ...get().midiMappings }
        midiMappings[dmxChannel] = mapping
        set({ midiMappings, midiLearnTarget: null }) 
        
        axios.post('/api/midi/mapping', { dmxChannel, mapping })
          .then(() => {
            get().addNotification({ message: `MIDI mapped to DMX Ch: ${dmxChannel + 1}`, type: 'success' });
          })
          .catch(error => {
            console.error('Failed to add MIDI mapping:', error)
            get().addNotification({ message: 'Failed to add MIDI mapping', type: 'error', priority: 'high' }) 
          })
      },
      
      removeMidiMapping: (dmxChannel) => {
        const midiMappings = { ...get().midiMappings }
        delete midiMappings[dmxChannel]
        set({ midiMappings })
        
        axios.delete(`/api/midi/mapping/${dmxChannel}`)
          .then(() => {
            get().addNotification({ message: `MIDI mapping removed for DMX Ch: ${dmxChannel + 1}`, type: 'success' });
          })
          .catch(error => {
            console.error('Failed to remove MIDI mapping:', error)
            get().addNotification({ message: 'Failed to remove MIDI mapping', type: 'error' }) 
          })
      },
      
      clearAllMidiMappings: () => {
        set({ midiMappings: {} })
        
        axios.delete('/api/midi/mappings')
          .then(() => {
            get().addNotification({ message: 'All MIDI mappings cleared', type: 'success' });
          })
          .catch(error => {
            console.error('Failed to clear all MIDI mappings:', error)
            get().addNotification({ message: 'Failed to clear all MIDI mappings', type: 'error' }) 
          })
      },
      
      // Scene Actions
      saveScene: (name, oscAddress) => {
        const dmxChannels = get().dmxChannels
        const newScene: Scene = {
          name,
          channelValues: [...dmxChannels],
          oscAddress
        }
        
        const scenes = [...get().scenes]
        const existingIndex = scenes.findIndex(s => s.name === name)
        
        if (existingIndex !== -1) {
          scenes[existingIndex] = newScene
        } else {
          scenes.push(newScene
          )
        }
        
        set({ scenes })
        
        axios.post('/api/scenes', newScene)
          .then(() => {
            get().addNotification({ message: `Scene '${name}' saved`, type: 'success' });
          })
          .catch(error => {
            console.error('Failed to save scene:', error)
            get().addNotification({ message: `Failed to save scene '${name}'`, type: 'error', priority: 'high' }) 
          })
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
              console.error('Failed to load scene:', error)
              get().addNotification({ message: `Failed to load scene '${name}'`, type: 'error', priority: 'high' }) 
            })
        } else {
          get().addNotification({ message: `Scene "${name}" not found`, type: 'error', priority: 'high' }) 
        }
      },
      
      updateScene: (originalName, updates) => {
        const scenes = [...get().scenes]
        const sceneIndex = scenes.findIndex(s => s.name === originalName)
        
        if (sceneIndex !== -1) {
          scenes[sceneIndex] = { ...scenes[sceneIndex], ...updates }
          set({ scenes })
          
          axios.put(`/api/scenes/${encodeURIComponent(originalName)}`, updates)
            .then(() => {
              get().addNotification({ message: `Scene '${originalName}' updated`, type: 'success' });
            })
            .catch(error => {
              console.error('Failed to update scene:', error)
              get().addNotification({ message: `Failed to update scene '${originalName}'`, type: 'error' }) 
            })
        } else {
          get().addNotification({ message: `Scene "${originalName}" not found`, type: 'error' }) 
        }
      },
      
      deleteScene: (name) => {
        const scenes = get().scenes.filter(s => s.name !== name)
        set({ scenes })
        
        axios.delete(`/api/scenes/${encodeURIComponent(name)}`)
          .then(() => {
            get().addNotification({ message: `Scene '${name}' deleted`, type: 'success' });
          })
          .catch(error => {
            console.error('Failed to delete scene:', error)
            get().addNotification({ message: `Failed to delete scene '${name}'`, type: 'error' }) 
          })
      },
      
      // Config Actions
      updateArtNetConfig: (config) => {
        const socket = get().socket
        if (socket?.connected) {
          socket.emit('updateArtNetConfig', config)
          set({ artNetConfig: { ...get().artNetConfig, ...config } })
          get().addNotification({ message: 'ArtNet config updated. Restart may be required.', type: 'info' });
        } else {
          get().addNotification({ message: 'Cannot update ArtNet config: not connected to server', type: 'error', priority: 'high' }) 
        }
      },      testArtNetConnection: () => {
        const socket = get().socket
        if (socket?.connected) {
          socket.emit('testArtNetConnection')
          get().addNotification({ message: 'Testing ArtNet connection...', type: 'info' }) 
        } else {
          get().addNotification({ message: 'Cannot test ArtNet: not connected to server', type: 'error', priority: 'high' }) 
        }
      },

      // Theme Actions
      setTheme: (theme: 'artsnob' | 'standard' | 'minimal') => {
        set({ theme })
        localStorage.setItem('theme', theme)
        get().addNotification({ message: `Theme changed to ${theme}`, type: 'info' })
      },

      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode
        set({ darkMode: newDarkMode })
        localStorage.setItem('darkMode', newDarkMode.toString())
        document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light')
        get().addNotification({ message: `${newDarkMode ? 'Dark' : 'Light'} mode enabled`, type: 'info' })
      },
      
      // Deprecated actions - can be removed later
      // showStatusMessage: (text, type) => { 
      //   get().addNotification({ message: text, type });
      // },
      // clearStatusMessage: () => {},

      // Notification Actions
      addNotification: (notificationInput: AddNotificationInput) => {
        const newNotification: Notification = {
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
            const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
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
      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      setExampleSliderValue: (value: number) => set({ exampleSliderValue: value }),
      setFixtureLayout: (layout: PlacedFixture[]) => {
        set({ fixtureLayout: layout });
      },

      setCanvasBackgroundImage: (image: HTMLImageElement | null) => {
        set({ canvasBackgroundImage: image });
      },

      addMasterSlider: (slider: MasterSlider) => {
        set(state => ({ masterSliders: [...state.masterSliders, slider] }));
        get().addNotification({ message: `Master slider '${slider.name}' added`, type: 'success' });
      },
      
      updateMasterSliderValue: (sliderId, value) => {
        const { masterSliders, fixtureLayout, fixtures, setDmxChannel: dmxSetter } = get();
        const updatedSliders = masterSliders.map(s => 
          s.id === sliderId ? { ...s, value } : s
        );
        set({ masterSliders: updatedSliders });

        const activeSlider = updatedSliders.find(s => s.id === sliderId);
        if (activeSlider && activeSlider.targets) {
          activeSlider.targets.forEach(target => {            
            const pFixture = fixtureLayout.find(pf => pf.id === target.placedFixtureId);
            if (!pFixture) return;

            const fixtureDef = fixtures.find(fDef => fDef.name === pFixture.fixtureStoreId); 
            if (!fixtureDef || target.channelIndex >= fixtureDef.channels.length) return;
            
            const actualDmxAddress = pFixture.startAddress + target.channelIndex -1; 

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
          masterSliders: state.masterSliders.map(s => 
            s.id === sliderId ? { ...s, ...updatedSliderData } : s
          )
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
      // This action is now dual-purpose:
      // 1. Called by UI to request a source change (sends WS message).
      // 2. Called by WS handler to update store state from backend `masterClockUpdate`.
      setSelectedMidiClockHostId: (hostId) => {
        const { socket, addNotification, availableMidiClockHosts, selectedMidiClockHostId: currentSelectedHostId } = get();

        // If called by UI (or to reflect a change initiated elsewhere that needs to be sent to backend)
        // Check if it's a request to change the source via UI, not just a state update from backend
        // A simple heuristic: if the hostId is different from current state and socket is connected, it's likely a user request.
        // This distinction might need refinement if the action is purely for backend updates in some contexts.
        // For now, assume if socket is present, it's a request path. If not, it's a direct state update (e.g. from WS handler).

        if (socket?.connected && hostId !== currentSelectedHostId) { // Primary path for UI-initiated change
          socket.emit('setMasterClockSource', hostId);
          addNotification({
            message: `Requesting Master Clock source change to ${availableMidiClockHosts.find(h => h.id === hostId)?.name || 'Unknown'}...`,
            type: 'info',
          });
          // Optimistic update removed: set({ selectedMidiClockHostId: hostId });
        } else if (!socket?.connected && hostId !== currentSelectedHostId) { // UI tried to change but not connected
           addNotification({
            message: 'Cannot change Master Clock: Not connected to server.',
            type: 'error',
          });
        } else { // This path handles direct state update (e.g., from WebSocket handler)
          set({ selectedMidiClockHostId: hostId });
          // Avoid sending notification if it's just reflecting a state update from backend
        }
      },
      setAvailableMidiClockHosts: (hosts) => { // Called by WS handler
        set({ availableMidiClockHosts: hosts });
      },
      // This action is now dual-purpose:
      // 1. Called by UI to request a BPM change for internal clock (sends WS message).
      // 2. Called by WS handler to update store state from backend `masterClockUpdate`.
      setMidiClockBpm: (bpm) => { // Renamed in spirit to `requestOrSetMidiClockBpm`
        const { socket, addNotification, selectedMidiClockHostId, midiClockBpm: currentBpm } = get();

        // If called by UI to change BPM (heuristic: for internal clock, different BPM, socket connected)
        if (socket?.connected && selectedMidiClockHostId === 'internal' && bpm !== currentBpm) { // Path for UI-initiated change for internal clock
          socket.emit('setInternalClockBPM', bpm);
          addNotification({
            message: `Requesting Internal Clock BPM change to ${bpm}...`,
            type: 'info',
          });
          // Optimistic update removed: set({ midiClockBpm: bpm });
        } else if (!socket?.connected && selectedMidiClockHostId === 'internal' && bpm !== currentBpm) {
          addNotification({
            message: 'Cannot change Internal Clock BPM: Not connected to server.',
            type: 'error',
          });
        }
        // This will always update the local state, either optimistically (if UI call fails to send) or from backend broadcast
        set({ midiClockBpm: bpm });
      },
      setMidiClockIsPlaying: (isPlaying) => { // Called by WS handler
        set({ midiClockIsPlaying: isPlaying });
      },
      setMidiClockBeatBar: (beat, bar) => { // Called by WS handler
        set({ midiClockCurrentBeat: beat, midiClockCurrentBar: bar });
      },
      requestToggleMasterClockPlayPause: () => { // Renamed from toggleInternalMidiClockPlayState
        const { socket, addNotification } = get();
        if (socket?.connected) {
          socket.emit('toggleMasterClockPlayPause');
          // Notification can be added if desired, e.g., "Play/pause request sent"
          // The actual state (isPlaying, beat, bar) will update via 'masterClockUpdate'
        } else {
          addNotification({
            message: 'Cannot toggle play/pause: Not connected to server.',
            type: 'error',
          });
        }
      },

      // Auto-Scene Actions Implementations
      setAutoSceneEnabled: (enabled) => set({ autoSceneEnabled: enabled, autoSceneCurrentIndex: -1 }), // Reset index when enabling/disabling
      setAutoSceneList: (sceneNames) => set({ autoSceneList: sceneNames, autoSceneCurrentIndex: -1 }), // Reset index
      setAutoSceneMode: (mode) => set({ autoSceneMode: mode, autoSceneCurrentIndex: -1, autoScenePingPongDirection: 'forward' }), // Reset index and direction
      setAutoSceneBeatDivision: (division) => set({ autoSceneBeatDivision: Math.max(1, division) }), // Ensure division is at least 1
      setAutoSceneTempoSource: (source) => set({ autoSceneTempoSource: source }),
      resetAutoSceneIndex: () => set({ autoSceneCurrentIndex: -1, autoScenePingPongDirection: 'forward' }),
      setManualBpm: (bpm) => {
        const newBpm = Math.max(20, Math.min(300, bpm)); // Clamp BPM
        set({ autoSceneManualBpm: newBpm });
        if (get().autoSceneTempoSource === 'manual_bpm' && get().selectedMidiClockHostId === 'internal') { // Or 'none'
          get().setMidiClockBpm(newBpm); // Also update main internal clock
        }
      },
      recordTapTempo: () => {
        const now = Date.now();
        const lastTapTime = get().autoSceneLastTapTime;
        let newTapTimes = [...get().autoSceneTapTimes];

        if (lastTapTime > 0) {
          const interval = now - lastTapTime;
          if (interval > 0 && interval < 2000) { // Ignore taps too close or too far apart (2s = 30 BPM)
            newTapTimes.push(interval);
            if (newTapTimes.length > 5) { // Keep last 5 intervals for averaging
              newTapTimes.shift();
            }
          } else { // If interval is too long, reset taps
            newTapTimes = [];
          }
        }

        set({ autoSceneLastTapTime: now, autoSceneTapTimes: newTapTimes });

        if (newTapTimes.length >= 2) { // Need at least 2 taps (1 interval) to calculate BPM
          const averageInterval = newTapTimes.reduce((sum, t) => sum + t, 0) / newTapTimes.length;
          if (averageInterval > 0) {
            const newBpm = Math.max(20, Math.min(300, 60000 / averageInterval)); // Clamp BPM
            set({ autoSceneTapTempoBpm: newBpm });
            if (get().autoSceneTempoSource === 'tap_tempo' && get().selectedMidiClockHostId === 'internal') { // Or 'none'
              get().setMidiClockBpm(newBpm); // Also update main internal clock
            }
          }
        }
      },
      setNextAutoSceneIndex: () => {
        const { autoSceneList, autoSceneMode, autoSceneCurrentIndex, autoScenePingPongDirection } = get();
        if (!autoSceneList || autoSceneList.length === 0) {
          set({ autoSceneCurrentIndex: -1 });
          return;
        }

        let nextIndex = autoSceneCurrentIndex;
        let nextPingPongDirection = autoScenePingPongDirection;
        const listLength = autoSceneList.length;

        if (autoSceneMode === 'forward') {
          nextIndex = (autoSceneCurrentIndex + 1) % listLength;
        } else if (autoSceneMode === 'random') {
          if (listLength <= 1) {
            nextIndex = 0;
          } else {
            let randomIndex = Math.floor(Math.random() * listLength);
            // Ensure it's not the same as current, if possible
            while (randomIndex === autoSceneCurrentIndex && listLength > 1) {
              randomIndex = Math.floor(Math.random() * listLength);
            }
            nextIndex = randomIndex;
          }
        } else if (autoSceneMode === 'ping-pong') {
          if (listLength === 1) {
            nextIndex = 0;
          } else {
            if (nextPingPongDirection === 'forward') {
              if (autoSceneCurrentIndex >= listLength - 1) {
                nextIndex = Math.max(0, listLength - 2);
                nextPingPongDirection = 'backward';
              } else {
                nextIndex = autoSceneCurrentIndex + 1;
              }
            } else { // Backward
              if (autoSceneCurrentIndex <= 0) {
                nextIndex = Math.min(1, listLength - 1);
                nextPingPongDirection = 'forward';
              } else {
                nextIndex = autoSceneCurrentIndex - 1;
              }
            }
          }
        }
        set({ autoSceneCurrentIndex: nextIndex, autoScenePingPongDirection: nextPingPongDirection });
      },

      // Group State Management
      updateGroup: (groupId: string, groupData: Partial<Group>) => 
        set((state) => ({
          groups: state.groups.map(g => 
            g.id === groupId ? { ...g, ...groupData } : g
          )
        })),

      addGroupToCanvas: (group: Group, position: { x: number; y: number }) =>
        set((state) => ({
          groups: state.groups.map(g =>
            g.id === group.id ? { ...g, position } : g
          )
        })),

      updateGroupPosition: (groupId: string, position: { x: number; y: number }) =>
        set((state) => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, position } : g
          )
        })),

      setGroupMasterValue: (groupId: string, value: number) =>
        set((state) => {
          const group = state.groups.find(g => g.id === groupId);
          if (!group) return state;

          // Calculate the scaling factor for the transition from current to last known states
          const scaleFactor = value / 255;
          
          // Create new DMX state applying the master value
          const newDmxChannels = [...state.dmxChannels];
          
          group.fixtureIndices.forEach(fixtureIndex => {
            const fixture = state.fixtures[fixtureIndex];
            if (fixture) {
              for (let i = 0; i < fixture.channels.length; i++) {
                const dmxChannel = fixture.startAddress + i - 1;
                const lastValue = group.lastStates[dmxChannel] || 0;
                newDmxChannels[dmxChannel] = Math.round(lastValue * scaleFactor);
              }
            }
          });

          return {
            groups: state.groups.map(g =>
              g.id === groupId ? { ...g, masterValue: value } : g
            ),
            dmxChannels: newDmxChannels
          };
        }),

      setGroupMute: (groupId: string, isMuted: boolean) =>
        set((state) => {
          const group = state.groups.find(g => g.id === groupId);
          if (!group) return state;

          const newDmxChannels = [...state.dmxChannels];
          
          // If unmuting and not soloed, restore to master value
          // If muting, set channels to 0
          group.fixtureIndices.forEach(fixtureIndex => {
            const fixture = state.fixtures[fixtureIndex];
            if (fixture) {
              for (let i = 0; i < fixture.channels.length; i++) {
                const dmxChannel = fixture.startAddress + i - 1;
                const lastValue = group.lastStates[dmxChannel] || 0;
                newDmxChannels[dmxChannel] = isMuted ? 0 : Math.round(lastValue * (group.masterValue / 255));
              }
            }
          });

          return {
            groups: state.groups.map(g =>
              g.id === groupId ? { ...g, isMuted } : g
            ),
            dmxChannels: newDmxChannels
          };
        }),

      setGroupSolo: (groupId: string, isSolo: boolean) =>
        set((state) => {
          // Create new DMX state
          const newDmxChannels = [...state.dmxChannels];
          
          // If soloing this group, save states and black out all other groups
          state.groups.forEach(group => {
            group.fixtureIndices.forEach(fixtureIndex => {
              const fixture = state.fixtures[fixtureIndex];
              if (fixture) {
                for (let i = 0; i < fixture.channels.length; i++) {
                  const dmxChannel = fixture.startAddress + i - 1;
                  const lastValue = group.lastStates[dmxChannel] || 0;
                  
                  if (group.id === groupId) {
                    // This is the soloed group
                    newDmxChannels[dmxChannel] = isSolo ? 
                      Math.round(lastValue * (group.masterValue / 255)) : 
                      (group.isMuted ? 0 : Math.round(lastValue * (group.masterValue / 255)));
                  } else {
                    // Other groups
                    newDmxChannels[dmxChannel] = isSolo ? 0 : 
                      (group.isMuted ? 0 : Math.round(lastValue * (group.masterValue / 255)));
                  }
                }
              }
            });
          });

          return {
            groups: state.groups.map(g =>
              g.id === groupId ? { ...g, isSolo } : { ...g, isSolo: false }
            ),
            dmxChannels: newDmxChannels
          };
        }),

      saveGroupLastStates: (groupId: string) =>
        set((state) => {
          const group = state.groups.find(g => g.id === groupId);
          if (!group) return state;

          const lastStates = [...state.dmxChannels];

          return {
            groups: state.groups.map(g =>
              g.id === groupId ? { ...g, lastStates } : g
            )
          };
        }),

    }),
    { name: 'ArtBastard-DMX-Store' } 
  )
);

declare global {
  interface Window {
    useStore: typeof useStore;
  }
}

if (typeof window !== 'undefined') {
  window.useStore = useStore;
}