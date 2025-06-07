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
  // Flagging system for organizing fixtures
  flags?: FixtureFlag[]
  isFlagged?: boolean
}

export interface FixtureFlag {
  id: string
  name: string
  color: string
  priority?: number // Higher numbers = higher priority
  category?: string // Optional grouping
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
  ignoreSceneChanges?: boolean; // Whether this group ignores scene changes
  ignoreMasterFader?: boolean;
  panOffset?: number;
  tiltOffset?: number;
  zoomValue?: number;
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

export interface OscConfig {
  host: string
  port: number
  sendEnabled: boolean
  sendHost: string
  sendPort: number
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

// Auto-Scene settings interface for localStorage persistence
interface AutoSceneSettings {
  autoSceneEnabled: boolean;
  autoSceneList: string[];
  autoSceneMode: 'forward' | 'ping-pong' | 'random';
  autoSceneBeatDivision: number;
  autoSceneManualBpm: number;
  autoSceneTapTempoBpm: number;
  autoSceneTempoSource: 'internal_clock' | 'manual_bpm' | 'tap_tempo';
}

// Helper functions for localStorage persistence
const AUTO_SCENE_STORAGE_KEY = 'artbastard-auto-scene-settings';

const saveAutoSceneSettings = (settings: AutoSceneSettings) => {
  try {
    localStorage.setItem(AUTO_SCENE_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save auto-scene settings to localStorage:', error);
  }
};

const loadAutoSceneSettings = (): Partial<AutoSceneSettings> => {
  try {
    const stored = localStorage.getItem(AUTO_SCENE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load auto-scene settings from localStorage:', error);
    return {};
  }
};

// Helper to save current auto-scene settings from store state
const saveCurrentAutoSceneSettings = (state: any) => {
  const settings: AutoSceneSettings = {
    autoSceneEnabled: state.autoSceneEnabled,
    autoSceneList: state.autoSceneList,
    autoSceneMode: state.autoSceneMode,
    autoSceneBeatDivision: state.autoSceneBeatDivision,
    autoSceneManualBpm: state.autoSceneManualBpm,
    autoSceneTapTempoBpm: state.autoSceneTapTempoBpm,
    autoSceneTempoSource: state.autoSceneTempoSource,
  };
  saveAutoSceneSettings(settings);
};

interface State {
  // DMX State
  dmxChannels: number[]
  oscAssignments: string[]
  channelNames: string[]
  selectedChannels: number[]
  
  // Navigation State
  navVisibility: {
    main: boolean
    midiOsc: boolean
    fixture: boolean
    scenes: boolean
    audio: boolean
    touchosc: boolean
    misc: boolean
  }

  // Debug State
  debugTools: {
    debugButton: boolean
    midiMonitor: boolean
    oscMonitor: boolean
  }

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

  // Debug State
  debugModules: {
    midi: boolean;
    osc: boolean;
    artnet: boolean;
    button: boolean;
  };

  // Fixtures and Groups
  fixtures: Fixture[]
  groups: Group[]
  
  // Scenes
  scenes: Scene[]
    // ArtNet
  artNetConfig: ArtNetConfig
  oscConfig: OscConfig
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
  autoSceneIsFlashing: boolean; // Shared flashing state for downbeat border flash
  // Actions
  fetchInitialState: () => Promise<void>
  getDmxChannelValue: (channel: number) => number
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
  startMidiLearn: (target: { type: 'masterSlider', id: string } | { type: 'dmxChannel', channelIndex: number } | { type: 'group', id: string }) => void;
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
  updateDebugModules: (debugSettings: {midi?: boolean; osc?: boolean; artnet?: boolean; button?: boolean}) => void
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
  triggerAutoSceneFlash: () => void;  // Triggers the shared flashing state

  // Enhanced Group State
  updateGroup: (groupId: string, groupData: Partial<Group>) => void;  
  addGroupToCanvas: (group: Group, position: { x: number; y: number }) => void;
  updateGroupPosition: (groupId: string, position: { x: number; y: number }) => void;
  saveGroupLastStates: (groupId: string) => void; // Moved up
  setGroupMasterValue: (groupId: string, value: number) => void;
  setGroupMute: (groupId: string, isMuted: boolean) => void;
  setGroupSolo: (groupId: string, isSolo: boolean) => void;

  // Group positioning and offset actions
  setGroupPanOffset: (groupId: string, panOffset: number) => void;
  setGroupTiltOffset: (groupId: string, tiltOffset: number) => void;
  setGroupZoomValue: (groupId: string, zoomValue: number) => void;

  // Group MIDI actions
  startGroupMidiLearn: (groupId: string) => void;
  cancelGroupMidiLearn: () => void;
  setGroupMidiMapping: (groupId: string, mapping: MidiMapping | undefined) => void;
  handleMidiForGroups: (message: any) => void;

  // Fixture Flagging Actions
  addFixtureFlag: (fixtureId: string, flag: FixtureFlag) => void;
  removeFixtureFlag: (fixtureId: string, flagId: string) => void;
  toggleFixtureFlag: (fixtureId: string, flagId: string) => void;
  updateFixtureFlag: (fixtureId: string, flagId: string, updates: Partial<FixtureFlag>) => void;
  clearFixtureFlags: (fixtureId: string) => void;
  getFixturesByFlag: (flagId: string) => Fixture[];
  getFixturesByFlagCategory: (category: string) => Fixture[];
  createQuickFlag: (name: string, color: string, category?: string) => FixtureFlag;
  bulkAddFlag: (fixtureIds: string[], flag: FixtureFlag) => void;
  bulkRemoveFlag: (fixtureIds: string[], flagId: string) => void;
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
      
      // Navigation State
      navVisibility: {
        main: true,
        midiOsc: true,
        fixture: true,
        scenes: true,
        audio: true,
        touchosc: true,
        misc: true
      },
      
      // Debug Tools
      debugTools: {
        debugButton: true,
        midiMonitor: true,
        oscMonitor: true
      },
      
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
      debugModules: {
        midi: false,
        osc: false,
        artnet: false,
        button: true
      },
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
      setSocket: (socket) => set({ socket }),
      
      // MIDI Clock Sync State Init
      availableMidiClockHosts: [
        { id: 'internal', name: 'Internal Clock' },
        // Other hosts would be populated dynamically
      ],
      selectedMidiClockHostId: 'internal',
      midiClockBpm: 120.0,
      midiClockIsPlaying: false,
      midiClockCurrentBeat: 1,
      midiClockCurrentBar: 1,      // Auto-Scene Feature State Init - Load from localStorage if available
      ...((): any => {
        const savedSettings = loadAutoSceneSettings();
        return {
          autoSceneEnabled: savedSettings.autoSceneEnabled ?? false,
          autoSceneList: savedSettings.autoSceneList ?? [],
          autoSceneMode: savedSettings.autoSceneMode ?? 'forward',
          autoSceneCurrentIndex: -1, // Always start fresh, don't persist current index
          autoScenePingPongDirection: 'forward', // Always start fresh
          autoSceneBeatDivision: savedSettings.autoSceneBeatDivision ?? 4,
          autoSceneManualBpm: savedSettings.autoSceneManualBpm ?? 120,
          autoSceneTapTempoBpm: savedSettings.autoSceneTapTempoBpm ?? 120,
          autoSceneLastTapTime: 0, // Don't persist timing state
          autoSceneTapTimes: [], // Don't persist timing state
          autoSceneTempoSource: savedSettings.autoSceneTempoSource ?? 'tap_tempo',
          autoSceneIsFlashing: false, // Initial flashing state
        };
      })(),
      
      _recalculateDmxOutput: () => {
        const { dmxChannels, groups, fixtures, setMultipleDmxChannels } = get();
        const newDmxValuesArray = [...dmxChannels]; // Base DMX state for this calculation run
        const newDmxValuesBatch: DmxChannelBatchUpdate = {};

        const activeSoloGroups = groups.filter(g => g.isSolo);

        fixtures.forEach((fixture, fixtureIdx) => {
          const fixtureGroups = groups.filter(g => g.fixtureIndices.includes(fixtureIdx));

          let isFixtureSoloActive = true;
          if (activeSoloGroups.length > 0) {
            isFixtureSoloActive = fixtureGroups.some(fg => activeSoloGroups.some(asg => asg.id === fg.id));
          }

          fixture.channels.forEach((channel, channelIdx) => {
            const dmxAddress = fixture.startAddress + channelIdx - 1; // 0-indexed
            if (dmxAddress < 0 || dmxAddress >= 512) return;

            let baseValueForGroupEffects = newDmxValuesArray[dmxAddress];
            let currentChannelValue = baseValueForGroupEffects; // Initialize with base

            if (fixtureGroups.length > 0) {
              const firstGroup = fixtureGroups[0]; // Prioritize the first group for P/T/Z, Master, Mute logic

              // Determine base value for intensity effects if lastStates is available
              const channelTypeUpper = channel.type.toUpperCase();
              if (channelTypeUpper === 'DIMMER' || channelTypeUpper === 'INTENSITY') {
                if (firstGroup.masterValue > 0 && firstGroup.lastStates && firstGroup.lastStates.length === 512) {
                  baseValueForGroupEffects = firstGroup.lastStates[dmxAddress];
                }
                // If masterValue is 0, or lastStates isn't valid, baseValueForGroupEffects remains newDmxValuesArray[dmxAddress]
                // which will correctly become 0 if muted or master is 0.
                currentChannelValue = baseValueForGroupEffects; // Re-initialize for intensity channel based on lastStates logic
              }

              // Apply Group P/T/Z (operates on currentChannelValue, which is from newDmxValuesArray unless it's an intensity channel using lastStates)
              // For PAN/TILT/ZOOM, they typically operate on whatever the current DMX value is (e.g. from a scene or manual override).
              // If P/T/Z channels are also intensity, the baseValueForGroupEffects logic for intensity above would apply.
              // However, typically P/T/Z are separate or combined with intensity where master/mute applies to intensity part.
              // Let's assume P/T/Z apply to the initial `newDmxValuesArray[dmxAddress]` value.
              let ptzModifiedValue = newDmxValuesArray[dmxAddress]; // Use initial DMX for P/T/Z base

              if (firstGroup.panOffset !== undefined && channel.type.toUpperCase() === 'PAN') {
                ptzModifiedValue = Math.max(0, Math.min(255, ptzModifiedValue + firstGroup.panOffset));
              }
              if (firstGroup.tiltOffset !== undefined && channel.type.toUpperCase() === 'TILT') {
                ptzModifiedValue = Math.max(0, Math.min(255, ptzModifiedValue + firstGroup.tiltOffset));
              }
              if (firstGroup.zoomValue !== undefined && channel.type.toUpperCase() === 'ZOOM') {
                ptzModifiedValue = Math.max(0, Math.min(255, firstGroup.zoomValue)); // Zoom is absolute
              }

              // If the channel is NOT intensity/dimmer, P/T/Z applies directly.
              // If it IS intensity/dimmer, P/T/Z effect is on the non-intensity aspect (which we assume is separate here).
              // The `currentChannelValue` for intensity is based on `baseValueForGroupEffects`.
              // This logic assumes P/T/Z are not the *same* channels as master/mute sensitive intensity.
              // If they are (e.g. a moving head's dimmer channel), this logic needs refinement.
              // For now, if it's PAN/TILT/ZOOM, we take that value. If it's DIMMER/INTENSITY, we proceed with its own base.
              if (channelTypeUpper === 'PAN' || channelTypeUpper === 'TILT' || channelTypeUpper === 'ZOOM') {
                currentChannelValue = ptzModifiedValue;
              }


              // Apply Group Master/Mute for intensity/dimmer channels
              if (channelTypeUpper === 'DIMMER' || channelTypeUpper === 'INTENSITY') {
                if (firstGroup.isMuted) {
                  currentChannelValue = 0;
                } else {
                  // Master value scales the chosen base (either from lastStates or current DMX)
                  currentChannelValue = Math.round(baseValueForGroupEffects * (firstGroup.masterValue / 255));
                }
              }
            }

            // Apply Solo Logic for intensity/dimmer channels
            const channelTypeUpper = channel.type.toUpperCase(); // Re-check for safety, though already have it
            if (channelTypeUpper === 'DIMMER' || channelTypeUpper === 'INTENSITY') {
              if (!isFixtureSoloActive) {
                currentChannelValue = 0;
              }
            }

            const finalValue = Math.max(0, Math.min(255, Math.round(currentChannelValue)));
            if (newDmxValuesArray[dmxAddress] !== finalValue || !(dmxAddress in newDmxValuesBatch)) {
              // Update batch if value changed OR if it wasn't set by a prior fixture but needs to be included
              newDmxValuesBatch[dmxAddress] = finalValue;
            }
            // We don't write to newDmxValuesArray here because each fixture's calculation should start from the original dmxChannels snapshot
            // or its group's lastStates, not be influenced by other groups' calculations in the same pass, to avoid order dependency issues.
            // The batch update will apply all final values at the end.
          });
        });

        // Create a full batch if any calculation path could have missed setting a value
        // For safety, ensure all 512 channels are in the batch if any processing happened.
        // A more optimized way would be to only send changed values, but _recalculateDmxOutput implies a full refresh.
        // The current logic for newDmxValuesBatch only includes changed values.
        // Let's ensure that if we started with dmxChannels, and applied group logic, the result is what we send.
        // The `setMultipleDmxChannels` expects a DmxChannelBatchUpdate (Record<number, number>).
        // We need to convert the `newDmxValuesArray` (which has been implicitly modified if we were writing to it)
        // or build up the `newDmxValuesBatch` correctly.

        // Correct approach: newDmxValuesArray is the "scratchpad" that gets modified to final values.
        // Then compare newDmxValuesArray to original dmxChannels to build the minimal batch.
        const finalBatch: DmxChannelBatchUpdate = {};
        let hasChanges = false;
        for (let i = 0; i < 512; i++) {
          // The loop above calculates final values and puts them into newDmxValuesBatch if they changed from original newDmxValuesArray[i]
          // However, the newDmxValuesArray itself was NOT updated inside the loop.
          // This means the `baseValueForGroupEffects` was always from the original dmxChannels or lastStates.
          // This is correct to avoid inter-group calculation order dependencies.
          // The `newDmxValuesBatch` should correctly contain all intended changes.
        }
        // The current newDmxValuesBatch logic seems correct: it only adds if finalValue is different from the original state of newDmxValuesArray[dmxAddress]

        if (Object.keys(newDmxValuesBatch).length > 0) {
          // Before setting, update the local dmxChannels state completely with the results of this calculation pass
          // This ensures that `get().dmxChannels` is the new calculated state *before* `setMultipleDmxChannels` (which might be async for backend)
          const fullyCalculatedDmxState = [...get().dmxChannels];
          for (const addr in newDmxValuesBatch) {
            fullyCalculatedDmxState[parseInt(addr)] = newDmxValuesBatch[addr];
          }
          set({ dmxChannels: fullyCalculatedDmxState });

          // Now send the batch to backend
          axios.post('/api/dmx/batch', newDmxValuesBatch)
            .catch(error => {
              console.error('Failed to update DMX channels in batch from _recalculateDmxOutput:', error);
              get().addNotification({ message: 'Failed to apply group DMX calculations', type: 'error', priority: 'high' });
            });
        }
      },

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
          throw new Error('Invalid response from server')        } catch (error: any) {
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
          
          // Only set default values if we don't have existing data
          // This prevents clearing fixtures during navigation when server is unavailable
          const currentState = get()
          const hasExistingFixtures = currentState.fixtures && currentState.fixtures.length > 0
          
          if (!hasExistingFixtures) {
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
          } else {
            // If we have existing fixtures, only set essential defaults for missing data
            set({
              dmxChannels: currentState.dmxChannels || new Array(512).fill(0),
              oscAssignments: currentState.oscAssignments || new Array(512).fill('').map((_, i) => `/fixture/DMX${i + 1}`),
              channelNames: currentState.channelNames || new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
              // Keep existing fixtures, groups, etc.
              midiMappings: currentState.midiMappings || {},
              scenes: currentState.scenes || [],
              masterSliders: currentState.masterSliders || [], 
              transitionDuration: currentState.transitionDuration || 1000, 
            })
          }
        }
      },
      
      getDmxChannelValue: (channel) => {
        const dmxChannels = get().dmxChannels;
        if (channel >= 0 && channel < dmxChannels.length) {
          return dmxChannels[channel] || 0;
        }
        return 0;
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
        const { scenes, isTransitioning, currentTransitionFrame, dmxChannels: currentDmxState, transitionDuration, groups, fixtures } = get();
        const scene = scenes.find(s => s.name === name);
        
        if (scene) {
          if (isTransitioning && currentTransitionFrame) {
            cancelAnimationFrame(currentTransitionFrame);
            set({ currentTransitionFrame: null }); 
          }

          // Create a copy of scene values that we can modify
          const targetDmxValues = [...scene.channelValues];

          // For each group that ignores scene changes, restore their current DMX values
          groups.forEach(group => {
            if (group.ignoreSceneChanges) {
              group.fixtureIndices.forEach(fixtureIndex => {
                const fixture = fixtures[fixtureIndex];
                if (fixture) {
                  // Calculate the DMX range for this fixture
                  const startAddr = fixture.startAddress - 1; // Convert to 0-based
                  const endAddr = startAddr + fixture.channels.length;
                  
                  // Copy current values for these channels
                  for (let i = startAddr; i < endAddr; i++) {
                    targetDmxValues[i] = currentDmxState[i];
                  }
                }
              });
            }
          });

          set({
            isTransitioning: true,
            fromDmxValues: [...currentDmxState], 
            toDmxValues: targetDmxValues,
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
      },
      
      updateDebugModules: (debugSettings) => {
        const currentDebugModules = get().debugModules || { midi: false, osc: false, artnet: false, button: true };
        const updatedDebugModules = { ...currentDebugModules, ...debugSettings };
        
        set({ debugModules: updatedDebugModules });
        
        // Save to localStorage for persistence
        localStorage.setItem('debugModules', JSON.stringify(updatedDebugModules));
        
        // Socket emit if needed
        const socket = get().socket;
        if (socket?.connected) {
          socket.emit('updateDebugSettings', updatedDebugModules);
        }
      },

      testArtNetConnection: () => {
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
      },      // Auto-Scene Actions Implementations
      setAutoSceneEnabled: (enabled) => {
        set({ autoSceneEnabled: enabled, autoSceneCurrentIndex: -1 }); // Reset index when enabling/disabling
        saveCurrentAutoSceneSettings(get());
      },
      setAutoSceneList: (sceneNames) => {
        set({ autoSceneList: sceneNames, autoSceneCurrentIndex: -1 }); // Reset index
        saveCurrentAutoSceneSettings(get());
      },
      setAutoSceneMode: (mode) => {
        set({ autoSceneMode: mode, autoSceneCurrentIndex: -1, autoScenePingPongDirection: 'forward' }); // Reset index and direction
        saveCurrentAutoSceneSettings(get());
      },
      setAutoSceneBeatDivision: (division) => {
        set({ autoSceneBeatDivision: Math.max(1, division) }); // Ensure division is at least 1
        saveCurrentAutoSceneSettings(get());
      },
      setAutoSceneTempoSource: (source) => {
        set({ autoSceneTempoSource: source });
        saveCurrentAutoSceneSettings(get());
      },
      resetAutoSceneIndex: () => set({ autoSceneCurrentIndex: -1, autoScenePingPongDirection: 'forward' }),      setManualBpm: (bpm) => {
        const newBpm = Math.max(20, Math.min(300, bpm)); // Clamp BPM
        set({ autoSceneManualBpm: newBpm });
        if (get().autoSceneTempoSource === 'manual_bpm' && get().selectedMidiClockHostId === 'internal') { // Or 'none'
          get().setMidiClockBpm(newBpm); // Also update main internal clock
        }
        saveCurrentAutoSceneSettings(get());
      },      recordTapTempo: () => {
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
            saveCurrentAutoSceneSettings(get()); // Save when BPM changes
          }
        }
      },      setNextAutoSceneIndex: () => {
        const { autoSceneList, autoSceneMode, autoSceneCurrentIndex, autoScenePingPongDirection } = get();
        if (!autoSceneList || autoSceneList.length === 0) {
          set({ autoSceneCurrentIndex: -1 });
          return;
        }

        let nextIndex = autoSceneCurrentIndex;
        let nextPingPongDirection = autoScenePingPongDirection;
        const listLength = autoSceneList.length;

        // If this is the first time (currentIndex is -1), start with index 0
        if (autoSceneCurrentIndex === -1) {
          nextIndex = 0;
          nextPingPongDirection = 'forward';
        } else if (autoSceneMode === 'forward') {
          nextIndex = (autoSceneCurrentIndex + 1) % listLength;
        } else if (autoSceneMode === 'ping-pong') {
          if (nextPingPongDirection === 'forward') {
            nextIndex = autoSceneCurrentIndex + 1;
            if (nextIndex >= listLength) {
              nextIndex = Math.max(0, listLength - 2); // Go to second-to-last
              nextPingPongDirection = 'backward';
            }
          } else {
            nextIndex = autoSceneCurrentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = Math.min(1, listLength - 1); // Go to second item
              nextPingPongDirection = 'forward';
            }
          }
        } else if (autoSceneMode === 'random') {
          // Random selection
          do {
            nextIndex = Math.floor(Math.random() * listLength);
          } while (nextIndex === autoSceneCurrentIndex && listLength > 1);
        }

        set({ autoSceneCurrentIndex: nextIndex, autoScenePingPongDirection: nextPingPongDirection });
      },
      triggerAutoSceneFlash: () => {
        set({ autoSceneIsFlashing: true });
        // Auto-clear the flashing state after 200ms
        setTimeout(() => {
          set({ autoSceneIsFlashing: false });
        }, 200);
      },

      // Enhanced Group State Actions Implementations
      updateGroup: (groupId, groupData) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, ...groupData } : g
          )
        }));
        // TODO: Consider persisting to backend if group structure (name, fixtureIndices, etc.) changes.
        // For ignoreSceneChanges, it's probably fine as transient state or saved with scenes.
      },
      addGroupToCanvas: (group, position) => {
        // This is a placeholder. Actual implementation might be more complex
        // or handled by UI components that manage canvas state.
        const updatedGroupWithPos = position ? { ...group, position } : group;
        set(state => {
          const existingGroup = state.groups.find(g => g.id === group.id);
          if (existingGroup) {
            return {
              groups: state.groups.map(g => g.id === group.id ? { ...g, ...updatedGroupWithPos } : g)
            };
          } else {
            return { groups: [...state.groups, updatedGroupWithPos] };
          }
        });
        get().addNotification({ message: `Group '${group.name}' position updated for canvas.`, type: 'info' });
      },
      updateGroupPosition: (groupId, position) => {
        set(state => ({
          groups: state.groups.map(g => g.id === groupId ? { ...g, position } : g)
        }));
      },
      saveGroupLastStates: (groupId) => {
        set(state => {
          const groupIndex = state.groups.findIndex(g => g.id === groupId);
          if (groupIndex === -1) return state; // Group not found

          const groups = [...state.groups];
          const group = { ...groups[groupIndex] };

          group.lastStates = [...state.dmxChannels];
          groups[groupIndex] = group;

          return { ...state, groups };
        });
      },
      setGroupMasterValue: (groupId, value) => {
        const { groups, saveGroupLastStates, _recalculateDmxOutput } = get();
        const groupExists = groups.some(g => g.id === groupId);
        if (!groupExists) return;

        let groupHadLastStates = false;
        const updatedGroups = groups.map(g => {
          if (g.id === groupId) {
            if (g.lastStates && g.lastStates.length > 0) {
              groupHadLastStates = true;
            }
            let newLastStates = g.lastStates;
            if (value > 0 && groupHadLastStates) {
              newLastStates = []; // Clear lastStates as it's now live
            }
            return { ...g, masterValue: value, lastStates: newLastStates };
          }
          return g;
        });

        set({ groups: updatedGroups });

        if (value === 0) {
          saveGroupLastStates(groupId); // Save state *after* masterValue is set to 0 internally
        }

        _recalculateDmxOutput();
      },
      setGroupMute: (groupId, isMuted) => {
        // The UI (`FixtureGroup.tsx`) handles calling `saveGroupLastStates(groupId)`
        // and then `setGroupMasterValue(groupId, 0)` when muting.
        // When unmuting, UI calls `setGroupMasterValue(groupId, oldMasterValue)`.
        // So, this action primarily updates the `isMuted` flag and triggers recalculation.
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, isMuted } : g
          )
        }));
        get()._recalculateDmxOutput();
      },
      setGroupSolo: (groupId, isSolo) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, isSolo } : g
          )
        }));
        get()._recalculateDmxOutput();
      },
      setGroupPanOffset: (groupId, panOffset) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, panOffset } : g
          )
        }));
        get()._recalculateDmxOutput();
      },
      setGroupTiltOffset: (groupId, tiltOffset) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, tiltOffset } : g
          )
        }));
        get()._recalculateDmxOutput();
      },
      setGroupZoomValue: (groupId, zoomValue) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId ? { ...g, zoomValue } : g
          )
        }));
        get()._recalculateDmxOutput();
      },
      // Implementations for Group MIDI actions will go here later
      startGroupMidiLearn: (groupId) => {
        set({ midiLearnTarget: { type: 'group', groupId: groupId } });
        get().addNotification({ message: `MIDI Learn started for Group: ${groupId}`, type: 'info' });
      },
      cancelGroupMidiLearn: () => {
        if (get().midiLearnTarget?.type === 'group') {
          set({ midiLearnTarget: null });
          get().addNotification({ message: 'Group MIDI Learn cancelled', type: 'info' });
        }
      },
      setGroupMidiMapping: (groupId, mapping) => {
        set(state => ({
          groups: state.groups.map(g => g.id === groupId ? { ...g, midiMapping: mapping } : g),
          midiLearnTarget: null,
        }));
        get().addNotification({ message: `MIDI mapped for Group: ${groupId}`, type: 'success' });
      },      handleMidiForGroups: (message) => {
        // Placeholder for MIDI handling logic for groups
      },

      // Fixture Flagging Actions
      addFixtureFlag: (fixtureId, flag) => {
        set(state => ({
          fixtures: state.fixtures.map(f => {
            if (f.id === fixtureId) {
              const existingFlags = f.flags || [];
              const flagExists = existingFlags.some(existingFlag => existingFlag.id === flag.id);
              
              if (!flagExists) {
                return { 
                  ...f, 
                  flags: [...existingFlags, flag],
                  isFlagged: true 
                };
              }
            }
            return f;
          })
        }));
        
        get().addNotification({ 
          message: `Flag "${flag.name}" added to fixture`, 
          type: 'success' 
        });
      },

      removeFixtureFlag: (fixtureId, flagId) => {
        set(state => ({
          fixtures: state.fixtures.map(f => {
            if (f.id === fixtureId) {
              const updatedFlags = (f.flags || []).filter(flag => flag.id !== flagId);
              return { 
                ...f, 
                flags: updatedFlags,
                isFlagged: updatedFlags.length > 0 
              };
            }
            return f;
          })
        }));
        
        get().addNotification({ 
          message: `Flag removed from fixture`, 
          type: 'success' 
        });
      },

      toggleFixtureFlag: (fixtureId, flagId) => {
        const fixture = get().fixtures.find(f => f.id === fixtureId);
        if (!fixture) return;
        
        const hasFlag = (fixture.flags || []).some(flag => flag.id === flagId);
        
        if (hasFlag) {
          get().removeFixtureFlag(fixtureId, flagId);
        } else {
          // Need to find the flag definition - this could be enhanced with a global flag registry
          get().addNotification({ 
            message: `Cannot toggle flag: Flag definition not found`, 
            type: 'warning' 
          });
        }
      },

      updateFixtureFlag: (fixtureId, flagId, updates) => {
        set(state => ({
          fixtures: state.fixtures.map(f => {
            if (f.id === fixtureId) {
              return {
                ...f,
                flags: (f.flags || []).map(flag => 
                  flag.id === flagId ? { ...flag, ...updates } : flag
                )
              };
            }
            return f;
          })
        }));
        
        get().addNotification({ 
          message: `Flag updated`, 
          type: 'success' 
        });
      },

      clearFixtureFlags: (fixtureId) => {
        set(state => ({
          fixtures: state.fixtures.map(f => 
            f.id === fixtureId 
              ? { ...f, flags: [], isFlagged: false }
              : f
          )
        }));
        
        get().addNotification({ 
          message: `All flags cleared from fixture`, 
          type: 'success' 
        });
      },

      getFixturesByFlag: (flagId) => {
        return get().fixtures.filter(f => 
          (f.flags || []).some(flag => flag.id === flagId)
        );
      },

      getFixturesByFlagCategory: (category) => {
        return get().fixtures.filter(f => 
          (f.flags || []).some(flag => flag.category === category)
        );
      },

      createQuickFlag: (name, color, category) => {
        const flag: FixtureFlag = {
          id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          color,
          category,
          priority: 1
        };
        
        return flag;
      },

      bulkAddFlag: (fixtureIds, flag) => {
        set(state => ({
          fixtures: state.fixtures.map(f => {
            if (fixtureIds.includes(f.id)) {
              const existingFlags = f.flags || [];
              const flagExists = existingFlags.some(existingFlag => existingFlag.id === flag.id);
              
              if (!flagExists) {
                return { 
                  ...f, 
                  flags: [...existingFlags, flag],
                  isFlagged: true 
                };
              }
            }
            return f;
          })
        }));
        
        get().addNotification({ 
          message: `Flag "${flag.name}" added to ${fixtureIds.length} fixtures`, 
          type: 'success' 
        });
      },

      bulkRemoveFlag: (fixtureIds, flagId) => {
        set(state => ({
          fixtures: state.fixtures.map(f => {
            if (fixtureIds.includes(f.id)) {
              const updatedFlags = (f.flags || []).filter(flag => flag.id !== flagId);
              return { 
                ...f, 
                flags: updatedFlags,
                isFlagged: updatedFlags.length > 0 
              };
            }
            return f;
          })
        }));
        
        get().addNotification({ 
          message: `Flag removed from ${fixtureIds.length} fixtures`, 
          type: 'success' 
        });
      }
    })
  )
);