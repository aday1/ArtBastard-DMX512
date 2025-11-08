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
  type: string
  manufacturer?: string
  model?: string
  mode?: string
  startAddress: number
  channels: { name: string; type: string; dmxAddress?: number }[]
  notes?: string // Notes section for fixture documentation
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

export interface AutopilotConfig {
  enabled: boolean;
  type: 'ping-pong' | 'cycle' | 'random' | 'sine' | 'triangle' | 'sawtooth';
  speed: number; // BPM multiplier (0.1 to 10)
  range: { min: number; max: number }; // DMX value range
  syncToBPM: boolean;
  phase: number; // Phase offset in degrees (0-360)
}

export interface ColorSliderAutopilotConfig {
  enabled: boolean;
  type: 'ping-pong' | 'cycle' | 'random' | 'sine' | 'triangle' | 'sawtooth';
  speed: number; // BPM multiplier (0.1 to 10)
  range: { min: number; max: number }; // Hue range (0-360)
  syncToBPM: boolean;
  phase: number; // Phase offset in degrees (0-360)
}

export interface PanTiltAutopilotConfig {
  enabled: boolean;
  pathType: 'circle' | 'figure8' | 'square' | 'triangle' | 'linear' | 'custom';
  size: number; // 0-100 percentage
  speed: number; // BPM multiplier
  centerX: number; // 0-255 DMX value
  centerY: number; // 0-255 DMX value
  syncToBPM: boolean;
  customPath?: Array<{ x: number; y: number }>;
}

// New Modular Automation System Interfaces
export interface ColorAutomationConfig {
  enabled: boolean;
  type: 'rainbow' | 'pulse' | 'strobe' | 'cycle' | 'breathe' | 'wave' | 'random';
  speed: number; // BPM multiplier (0.1 to 10)
  colors?: Array<{ r: number; g: number; b: number; w?: number }>; // For cycle mode
  intensity: number; // 0-100 percentage
  syncToBPM: boolean;
  hueRange?: { start: number; end: number }; // For rainbow mode (0-360)
  saturation?: number; // 0-100 for rainbow/wave modes
  brightness?: number; // 0-100 base brightness
  phase?: number; // Phase offset in degrees for wave patterns
}

export interface DimmerAutomationConfig {
  enabled: boolean;
  type: 'pulse' | 'breathe' | 'strobe' | 'ramp' | 'random' | 'chase';
  speed: number; // BPM multiplier
  range: { min: number; max: number }; // DMX value range (0-255)
  syncToBPM: boolean;
  pattern?: 'smooth' | 'sharp' | 'exponential'; // Curve type
  phase?: number; // Phase offset for multiple fixtures
}

export interface EffectsAutomationConfig {
  enabled: boolean;
  type: 'gobo_cycle' | 'prism_rotate' | 'iris_breathe' | 'zoom_bounce' | 'focus_sweep';
  speed: number; // BPM multiplier
  range?: { min: number; max: number }; // Value range for applicable effects
  syncToBPM: boolean;
  direction?: 'forward' | 'reverse' | 'ping-pong';
}

export interface ModularAutomationState {
  color: ColorAutomationConfig;
  dimmer: DimmerAutomationConfig;
  panTilt: PanTiltAutopilotConfig;
  effects: EffectsAutomationConfig;
  // Animation control
  animationIds: {
    color: number | null;
    dimmer: number | null;
    panTilt: number | null;
    effects: number | null;
  };
}

export interface Scene {
  name: string
  channelValues: number[]
  oscAddress: string
  midiMapping?: MidiMapping
  autopilots?: { [channelIndex: number]: AutopilotConfig };
  panTiltAutopilot?: PanTiltAutopilotConfig;
  // New: Modular Automation States for Scenes
  modularAutomation?: ModularAutomationState;
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
  type: string; // Fixture type (spotlight, wash, beam, etc.)
  x: number;
  y: number;
  color: string;
  radius: number;
  scale?: number; // Scale for 2D canvas display
  startAddress: number; // DMX start address for this fixture
  dmxAddress: number; // Alias for startAddress for compatibility
  controls?: PlacedControl[]; // Optional array for controls associated with this fixture
}

// Definition for PlacedControl on the 2D canvas, associated with a PlacedFixture
export interface PlacedControl {
  id: string;                     // Unique ID for this control instance
  channelNameInFixture: string; // Name of the channel within the fixture's definition (e.g., "Dimmer", "Pan")
  type: 'slider' | 'xypad';       // Control type: slider for single channel, xypad for pan/tilt combined
  label: string;                  // Display label for the control (e.g., could be same as channelNameInFixture or custom)
  xOffset: number;                // X position relative to the fixture icon's center
  yOffset: number;                // Y position relative to the fixture icon's center
  currentValue: number;           // Current value of this control (0-255), for sliders only
  orientation?: 'horizontal' | 'vertical'; // Slider orientation (optional)
  // XY Pad specific fields
  panValue?: number;              // Pan value (0-255) for xypad controls
  tiltValue?: number;             // Tilt value (0-255) for xypad controls
  panChannelName?: string;        // Name of the pan channel (e.g., "Pan")
  tiltChannelName?: string;       // Name of the tilt channel (e.g., "Tilt")
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
  orientation: 'horizontal' | 'vertical'; // Slider orientation
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

// ACTS (Automated Scene Transition Sequences) interfaces
export interface ActStep {
  id: string;
  sceneName: string;
  duration: number; // Duration in milliseconds
  transitionDuration: number; // Transition time in milliseconds
  autopilotSettings?: {
    enabled: boolean;
    groups: Array<{
      groupId: string;
      autopilotType: 'color' | 'dimmer' | 'panTilt' | 'custom';
      intensity: number; // 0-100%
      speed: number; // 0-100%
      pattern?: 'wave' | 'random' | 'chase' | 'pulse';
    }>;
  };
  notes?: string;
}

export interface ActTrigger {
  id: string;
  type: 'osc' | 'midi';
  address?: string; // OSC address
  midiNote?: number; // MIDI note number
  midiChannel?: number; // MIDI channel (1-16)
  action: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'toggle';
  enabled: boolean;
}

export interface Act {
  id: string;
  name: string;
  description?: string;
  steps: ActStep[];
  loopMode: 'none' | 'loop' | 'ping-pong';
  totalDuration: number; // Calculated total duration
  triggers: ActTrigger[];
  createdAt: number;
  updatedAt: number;
}

export interface ActPlaybackState {
  isPlaying: boolean;
  currentActId: string | null;
  currentStepIndex: number;
  stepStartTime: number;
  stepProgress: number; // 0-1
  loopCount: number;
  playbackSpeed: number; // 0.1-2.0 multiplier
}

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
    misc: boolean
  }

  // Debug State
  debugTools: {
    debugButton: boolean
    midiMonitor: boolean
    oscMonitor: boolean
  }  // MIDI State
  midiInterfaces: string[]
  activeInterfaces: string[]
  midiMappings: Record<number, MidiMapping | undefined>;
  midiLearnTarget: 
    | { type: 'masterSlider'; id: string }
    | { type: 'dmxChannel'; channelIndex: number }
    | { type: 'placedControl'; fixtureId: string; controlId: string }
    | { type: 'group'; groupId: string }
    | { type: 'superControl'; controlName: string }
    | null;
  midiLearnScene: string | null 
  midiMessages: any[]
  oscMessages: OscMessage[]; // Added for OSC Monitor
  midiActivity: number // Activity level for MIDI signal flash indicator

  // Audio/BPM State
  bpm: number // Current BPM value
  isPlaying: boolean // Whether audio/MIDI is currently playing

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
  selectedFixtures: string[] // Array of fixture IDs for selection
  addFixture: (fixture: Fixture) => void;
  setFixtures: (fixtures: Fixture[]) => void;
  setGroups: (groups: Group[]) => void;
  
  // Scenes
  scenes: Scene[]
  
  // ACTS (Automated Scene Transition Sequences)
  acts: Act[]
  actTriggers: ActTrigger[] // Global trigger registry for OSC/MIDI processing
  actPlaybackState: ActPlaybackState
  
    // ArtNet
  artNetConfig: ArtNetConfig
  oscConfig: OscConfig
  artNetStatus: 'connected' | 'disconnected' | 'error' | 'timeout'  // UI State
  theme: 'artsnob' | 'standard' | 'minimal';
  darkMode: boolean;
  // statusMessage: { text: string; type: 'success' | 'error' | 'info' | 'warning' } | null; // Deprecated
  notifications: Notification[]; // Use the new Notification interface
  
  // UI Settings
  uiSettings: {
    sparklesEnabled: boolean;
  };
  
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
  transitionEasing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' | 'easeInOutCubic' | 'easeInOutQuart' | 'easeInOutSine';
  fromDmxValues: number[] | null;
  toDmxValues: number[] | null;
  currentTransitionFrame: number | null; // requestAnimationFrame ID
  lastDmxTransitionUpdate: number | null; // For throttling DMX updates during transitions
  lastTransitionDmxValues: number[] | null; // Track last sent DMX values to only send changes
  
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

  // Quick Scene State
  quickSceneMidiMapping: MidiMapping | null; // MIDI mapping for quick scene load

  // Autopilot Track System State (Legacy - kept for compatibility)
  autopilotTrackEnabled: boolean;
  autopilotTrackType: 'circle' | 'figure8' | 'square' | 'triangle' | 'linear' | 'random' | 'custom';
  autopilotTrackPosition: number; // 0-100, position along the track
  autopilotTrackSize: number; // 0-100, size/scale of the track
  autopilotTrackSpeed: number; // 0-100, speed of automatic movement (when auto-playing)
  autopilotTrackCenterX: number; // 0-255, center point X for the track
  autopilotTrackCenterY: number; // 0-255, center point Y for the track
  autopilotTrackAutoPlay: boolean; // Auto-advance along track
  autopilotTrackCustomPoints: Array<{ x: number; y: number }>; // Custom track points
  autopilotTrackAnimationId: number | null; // Animation frame ID for centralized control

  // New Modular Automation System State
  modularAutomation: ModularAutomationState;

  // Recording and Automation System State
  recordingActive: boolean;
  recordingStartTime: number | null;
  recordingData: Array<{
    timestamp: number;
    type: 'dmx' | 'midi' | 'osc';
    channel?: number;
    value?: number;
    data?: any;
  }>;
  automationTracks: Array<{
    id: string;
    name: string;
    channel: number;
    keyframes: Array<{
      time: number; // milliseconds from start
      value: number; // 0-255
      curve: 'linear' | 'smooth' | 'step' | 'ease-in' | 'ease-out' | 'ease-in-out';
    }>;
    enabled: boolean;
    loop: boolean;
  }>;  automationPlayback: {
    active: boolean;
    startTime: number | null;
    duration: number; // Total duration in milliseconds
    position: number; // Current position 0-1
  };
  // Smooth DMX Output System
  smoothDmxEnabled: boolean;
  smoothDmxUpdateRate: number; // Updates per second (default: 30fps)
  smoothDmxThreshold: number; // Minimum change to trigger update (default: 1)
  pendingSmoothUpdates: { [channel: number]: number }; // Pending smooth updates
  lastSmoothUpdateTime: number;

  // Autopilot System State
  channelAutopilots: { [channelIndex: number]: AutopilotConfig };
  panTiltAutopilot: PanTiltAutopilotConfig;
  colorSliderAutopilot: ColorSliderAutopilotConfig;
  autopilotUpdateInterval: number | null;
  lastAutopilotUpdate: number;

  // Actions
  fetchInitialState: () => Promise<void>
  getDmxChannelValue: (channel: number) => number
  setDmxChannel: (channel: number, value: number, sendToBackend?: boolean) => void
  setMultipleDmxChannels: (updates: DmxChannelBatchUpdate, sendToBackend?: boolean) => void; // New action for batch updates
  setDmxChannelValue: (channel: number, value: number) => void
  setDmxChannelsForTransition: (values: number[]) => void; 
  setCurrentTransitionFrameId: (frameId: number | null) => void; 
  clearTransitionState: () => void; 
  setTransitionDuration: (duration: number) => void;
  setTransitionEasing: (easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' | 'easeInOutCubic' | 'easeInOutQuart' | 'easeInOutSine') => void; 
  selectChannel: (channel: number) => void
  deselectChannel: (channel: number) => void
  toggleChannelSelection: (channel: number) => void
  selectAllChannels: () => void
  deselectAllChannels: () => void
  invertChannelSelection: () => void

  // Fixture Selection Actions
  selectNextFixture: () => void
  selectPreviousFixture: () => void
  selectAllFixtures: () => void
  selectFixturesByType: (channelType: string) => void
  selectFixtureGroup: (groupId: string) => void
  setSelectedFixtures: (fixtureIds: string[]) => void
  toggleFixtureSelection: (fixtureId: string) => void
  deselectAllFixtures: () => void
  
  // Placed Fixture Actions
  addPlacedFixture: (fixture: Omit<PlacedFixture, 'id'>) => void
  updatePlacedFixture: (id: string, updates: Partial<PlacedFixture>) => void
  removePlacedFixture: (id: string) => void
  
  setOscAssignment: (channelIndex: number, address: string) => void
  reportOscActivity: (channelIndex: number, value: number) => void 
  addOscMessage: (message: OscMessage) => void; // Added for OSC Monitor
    // MIDI Actions
  startMidiLearn: (target: { type: 'masterSlider', id: string } | { type: 'dmxChannel', channelIndex: number } | { type: 'group', id: string } | { type: 'placedControl'; fixtureId: string; controlId: string } | { type: 'superControl'; controlName: string }) => void;
  cancelMidiLearn: () => void
  addMidiMessage: (message: any) => void
  addMidiMapping: (dmxChannel: number, mapping: MidiMapping) => void 
  removeMidiMapping: (dmxChannel: number) => void
  clearAllMidiMappings: () => void
  setMidiInterfaces: (interfaces: string[]) => void
  setActiveInterfaces: (interfaces: string[]) => void
  
  // Scene Actions
  saveScene: (name: string, oscAddress: string) => void
  loadScene: (nameOrIndex: string | number) => void
  deleteScene: (name: string) => void
  updateScene: (originalName: string, updates: Partial<Scene>) => void; // New action for updating scenes
  
  // ACTS Actions
  createAct: (name: string, description?: string) => void
  updateAct: (actId: string, updates: Partial<Act>) => void
  deleteAct: (actId: string) => void
  addActStep: (actId: string, step: Omit<ActStep, 'id'>) => void
  updateActStep: (actId: string, stepId: string, updates: Partial<ActStep>) => void
  removeActStep: (actId: string, stepId: string) => void
  reorderActSteps: (actId: string, stepIds: string[]) => void
  
  // ACTS Trigger Actions
  addActTrigger: (actId: string, trigger: Omit<ActTrigger, 'id'>) => void
  updateActTrigger: (actId: string, triggerId: string, updates: Partial<ActTrigger>) => void
  removeActTrigger: (actId: string, triggerId: string) => void
  processActTrigger: (trigger: ActTrigger) => void
  saveActsToBackend: () => void
  
  // ACTS Playback Actions
  playAct: (actId: string) => void
  pauseAct: () => void
  stopAct: () => void
  nextActStep: () => void
  previousActStep: () => void
  setActPlaybackSpeed: (speed: number) => void
  setActStepProgress: (progress: number) => void
  applyActStepAutopilot: (step: ActStep) => void
  
    // Config Actions
  updateArtNetConfig: (config: Partial<ArtNetConfig>) => void
  updateDebugModules: (debugSettings: {midi?: boolean; osc?: boolean; artnet?: boolean; button?: boolean}) => void
  testArtNetConnection: () => void    // UI Actions
  setTheme: (theme: 'artsnob' | 'standard' | 'minimal') => void;
  toggleDarkMode: () => void;
  
  // UI Settings Actions
  updateUiSettings: (settings: Partial<{ sparklesEnabled: boolean }>) => void;
  toggleSparkles: () => void;
  
  // showStatusMessage: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void; // Deprecated
  // clearStatusMessage: () => void; // Deprecated
  addNotification: (notification: AddNotificationInput) => void; // Use AddNotificationInput
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setExampleSliderValue: (value: number) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setMidiActivity: (activity: number) => void;
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
  requestMasterClockSourceChange: (sourceId: string) => void;
  requestMidiClockInputList: () => void;
  requestSetMidiClockInput: (inputName: string) => void;
  // Auto-Scene Actions
  setAutoSceneEnabled: (enabled: boolean) => void;
  setAutoSceneList: (sceneNames: string[]) => void;
  setAutoSceneMode: (mode: 'forward' | 'ping-pong' | 'random') => void;  setAutoSceneBeatDivision: (division: number) => void;
  setAutoSceneTempoSource: (source: 'internal_clock' | 'manual_bpm' | 'tap_tempo') => void;
  setNextAutoSceneIndex: () => void; // Calculates and updates autoSceneCurrentIndex
  resetAutoSceneIndex: () => void;
  setManualBpm: (bpm: number) => void; // For auto-scene manual tempo
  recordTapTempo: () => void;         // For auto-scene tap tempo
  triggerAutoSceneFlash: () => void;  // Triggers the shared flashing state

  // Quick Scene Functions
  quickSceneSave: () => void;
  quickSceneLoad: () => void;
  setQuickSceneMidiMapping: (mapping: MidiMapping | null) => void;

  // Group Actions
  updateGroup: (groupId: string, groupData: Partial<Group>) => void;
  saveGroupLastStates: (groupId: string) => void;
  setGroupMasterValue: (groupId: string, value: number) => void;
  setGroupMute: (groupId: string, muted: boolean) => void;
  setGroupSolo: (groupId: string, solo: boolean) => void;
  setGroupPanOffset: (groupId: string, offset: number) => void;
  setGroupTiltOffset: (groupId: string, offset: number) => void;
  setGroupZoomValue: (groupId: string, value: number) => void;
  startGroupMidiLearn: (groupId: string) => void;
  setGroupMidiMapping: (groupId: string, mapping?: MidiMapping) => void;

  // Fixture Flagging Actions
  addFixtureFlag: (fixtureId: string, flag: FixtureFlag) => void;
  removeFixtureFlag: (fixtureId: string, flagId: string) => void;
  toggleFixtureFlag: (fixtureId: string, flagId: string) => void;
  updateFixtureFlag: (fixtureId: string, flagId: string, updates: Partial<FixtureFlag>) => void;
  clearFixtureFlags: (fixtureId: string) => void;
  getFixturesByFlag: (flagId: string) => Fixture[];
  getFixturesByFlagCategory: (category: string) => Fixture[];
  createQuickFlag: (name: string, color: string, category: string) => FixtureFlag;
  bulkAddFlag: (fixtureIds: string[], flag: FixtureFlag) => void;
  bulkRemoveFlag: (fixtureIds: string[], flagId: string) => void;

  // Legacy Autopilot Track Actions (kept for compatibility)
  setAutopilotTrackEnabled: (enabled: boolean) => void;
  setAutopilotTrackType: (type: 'circle' | 'figure8' | 'square' | 'triangle' | 'linear' | 'random' | 'custom') => void;
  setAutopilotTrackPosition: (position: number) => void;
  setAutopilotTrackSize: (size: number) => void;
  setAutopilotTrackSpeed: (speed: number) => void;
  setAutopilotTrackCenter: (centerX: number, centerY: number) => void;
  setAutopilotTrackAutoPlay: (autoPlay: boolean) => void;
  setAutopilotTrackCustomPoints: (points: Array<{ x: number; y: number }>) => void;
  calculateTrackPosition: (trackType: string, position: number, size: number, centerX: number, centerY: number) => { pan: number; tilt: number };
  updatePanTiltFromTrack: (position?: number) => void;
  startAutopilotTrackAnimation: () => void;
  stopAutopilotTrackAnimation: () => void;
  
  // Debug function
  debugAutopilotState: () => void;

  // New Modular Automation Actions
  setColorAutomation: (config: Partial<ColorAutomationConfig>) => void;
  setDimmerAutomation: (config: Partial<DimmerAutomationConfig>) => void;
  setPanTiltAutomation: (config: Partial<PanTiltAutopilotConfig>) => void;
  setEffectsAutomation: (config: Partial<EffectsAutomationConfig>) => void;
  toggleColorAutomation: () => void;
  toggleDimmerAutomation: () => void;
  togglePanTiltAutomation: () => void;
  toggleEffectsAutomation: () => void;
  startModularAnimation: (type: 'color' | 'dimmer' | 'panTilt' | 'effects') => void;
  stopModularAnimation: (type: 'color' | 'dimmer' | 'panTilt' | 'effects') => void;
  stopAllModularAnimations: () => void;
  applyModularAutomation: (type: 'color' | 'dimmer' | 'panTilt' | 'effects', fixtureId: string, progress: number) => void;

  // Recording and Automation Actions
  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;
  addRecordingEvent: (event: { type: 'dmx' | 'midi' | 'osc'; channel?: number; value?: number; data?: any }) => void;
  createAutomationTrack: (name: string, channel: number) => string; // Returns track ID
  updateAutomationTrack: (trackId: string, updates: Partial<{ name: string; enabled: boolean; loop: boolean }>) => void;
  deleteAutomationTrack: (trackId: string) => void;  addKeyframe: (trackId: string, time: number, value: number, curve?: 'linear' | 'smooth' | 'step' | 'ease-in' | 'ease-out' | 'ease-in-out') => void;
  updateKeyframe: (trackId: string, keyframeIndex: number, updates: Partial<{ time: number; value: number; curve: string }>) => void;
  deleteKeyframe: (trackId: string, keyframeIndex: number) => void;
  startAutomationPlayback: () => void;
  stopAutomationPlayback: () => void;
  setAutomationPosition: (position: number) => void; // 0-1
  applyAutomationPreset: (trackId: string, preset: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'random') => void;

  // Smooth DMX Actions
  setSmoothDmxEnabled: (enabled: boolean) => void;

  // Autopilot Actions
  setChannelAutopilot: (channelIndex: number, config: AutopilotConfig) => void;
  removeChannelAutopilot: (channelIndex: number) => void;
  setPanTiltAutopilot: (config: Partial<PanTiltAutopilotConfig>) => void;
  togglePanTiltAutopilot: () => void;
  setColorSliderAutopilot: (config: Partial<ColorSliderAutopilotConfig>) => void;
  toggleColorSliderAutopilot: () => void;
  updateAutopilotValues: () => void;
  startAutopilotSystem: () => void;
  stopAutopilotSystem: () => void;
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

// Helper function to initialize UI settings from localStorage
const initializeUiSettings = (): { sparklesEnabled: boolean } => {
  try {
    const stored = localStorage.getItem('uiSettings');
    const defaultSettings = { sparklesEnabled: true };
    
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      return { ...defaultSettings, ...parsedSettings };
    }
    
    return defaultSettings;
  } catch (error) {
    console.warn('Failed to read uiSettings from localStorage, using defaults:', error);
    return { sparklesEnabled: true };
  }
};

export const useStore = create<State>()(
  devtools(
    (set, get) => ({
      // Initial state
      dmxChannels: new Array(512).fill(0),
      oscAssignments: new Array(512).fill('').map((_, i) => `/1/fader${i + 1}`),
      channelNames: new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
      selectedChannels: [],
      
      // Navigation State
      navVisibility: {
        main: true,
        midiOsc: true,
        fixture: true,
        scenes: true,
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
      midiActivity: 0, // Default MIDI activity level
      
      // Audio/BPM State defaults
      bpm: 120, // Default BPM
      isPlaying: false, // Default not playing

      fixtures: [],
      groups: [],
      selectedFixtures: [], // Array of fixture IDs for selection
      
      scenes: [],
      
      // ACTS (Automated Scene Transition Sequences)
      acts: [],
      actTriggers: [], // Global trigger registry for OSC/MIDI processing
      actPlaybackState: {
        isPlaying: false,
        currentActId: null,
        currentStepIndex: 0,
        stepStartTime: 0,
        stepProgress: 0,
        loopCount: 0,
        playbackSpeed: 1.0
      },
      
      artNetConfig: {
        ip: "192.168.1.199",
        subnet: 0,
        universe: 0,
        net: 0,
        port: 6454,
        base_refresh_interval: 1000
      },      
      artNetStatus: 'disconnected',      theme: 'artsnob',
      darkMode: initializeDarkMode(),
      
      setTheme: (theme) => {
        document.body.className = theme;
        localStorage.setItem('theme', theme);
        set({ theme });
      },
      toggleDarkMode: () => {
        set(state => {
          const newDarkMode = !state.darkMode;
          localStorage.setItem('darkMode', String(newDarkMode));
          document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
          return { darkMode: newDarkMode };
        });
      },

      // statusMessage: null, // Deprecated
      notifications: [], 
        // UI Settings
      uiSettings: initializeUiSettings(),
      
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
      transitionEasing: 'easeInOut', // Default to smooth easing
      fromDmxValues: null,
      toDmxValues: null,
      currentTransitionFrame: null,
      lastDmxTransitionUpdate: null,
      lastTransitionDmxValues: null,
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
          autoSceneTempoSource: savedSettings.autoSceneTempoSource ?? 'tap_tempo',          autoSceneIsFlashing: false, // Initial flashing state
        };
      })(),

      // Quick Scene State Init
      quickSceneMidiMapping: null,

      // Autopilot Track System Initial State (Legacy - kept for compatibility)
      autopilotTrackEnabled: false,
      autopilotTrackType: 'circle',
      autopilotTrackPosition: 0,
      autopilotTrackSize: 50,
      autopilotTrackSpeed: 50,
      autopilotTrackCenterX: 127,
      autopilotTrackCenterY: 127,      autopilotTrackAutoPlay: false,
      autopilotTrackCustomPoints: [],
      autopilotTrackAnimationId: null,

      // New Modular Automation System Initial State
      modularAutomation: {
        color: {
          enabled: false,
          type: 'rainbow',
          speed: 1.0,
          colors: [
            { r: 255, g: 0, b: 0 },
            { r: 0, g: 255, b: 0 },
            { r: 0, g: 0, b: 255 },
            { r: 255, g: 255, b: 0 },
            { r: 255, g: 0, b: 255 },
            { r: 0, g: 255, b: 255 }
          ],
          intensity: 100,
          syncToBPM: true,
          hueRange: { start: 0, end: 360 },
          saturation: 100,
          brightness: 100,
          phase: 0
        },
        dimmer: {
          enabled: false,
          type: 'breathe',
          speed: 0.5,
          range: { min: 0, max: 255 },
          syncToBPM: true,
          pattern: 'smooth',
          phase: 0
        },
        panTilt: {
          enabled: false,
          pathType: 'circle',
          size: 50,
          speed: 1.0,
          centerX: 127,
          centerY: 127,
          syncToBPM: true
        },
        effects: {
          enabled: false,
          type: 'gobo_cycle',
          speed: 0.8,
          range: { min: 0, max: 255 },
          syncToBPM: true,
          direction: 'forward'
        },
        animationIds: {
          color: null,
          dimmer: null,
          panTilt: null,
          effects: null
        }
      },

      // Recording and Automation System Initial State
      recordingActive: false,
      recordingStartTime: null,
      recordingData: [],
      automationTracks: [],
      automationPlayback: {
        active: false,
        startTime: null,
        duration: 10000, // Default 10 seconds
        position: 0
      },
      
      // Smooth DMX Output System Initial State  
      smoothDmxEnabled: true, // Enable by default for better performance
      smoothDmxUpdateRate: 30, // 30fps default
      smoothDmxThreshold: 1,
      pendingSmoothUpdates: {},
      lastSmoothUpdateTime: Date.now(),

      // Autopilot System State
      channelAutopilots: {},
      panTiltAutopilot: {
        enabled: false,
        pathType: 'circle',
        speed: 0.5,
        size: 50, // 50% of maximum range
        centerX: 128,
        centerY: 128,
        syncToBPM: false,
        phase: 0
      },
      colorSliderAutopilot: {
        enabled: false,
        type: 'sine',
        speed: 0.2,
        range: { min: 0, max: 360 },
        syncToBPM: false,
        phase: 0
      },
      autopilotUpdateInterval: null,
      lastAutopilotUpdate: Date.now(),
      
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
          console.log('🔄 Fetching initial state from server...');
          const response = await axios.get('/api/state', {
            timeout: 5000,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          
          if (response.status === 200 && response.data) {
            const state = response.data
            console.log('📥 Received initial state from server:', {
              dmxChannels: state.dmxChannels?.filter((val: number) => val > 0).length || 0,
              scenes: state.scenes?.length || 0,
              fixtures: state.fixtures?.length || 0,
              groups: state.groups?.length || 0
            });
            
            set({
              dmxChannels: state.dmxChannels || new Array(512).fill(0),
              oscAssignments: state.oscAssignments || new Array(512).fill('').map((_, i) => `/fixture/DMX${i + 1}`),
              channelNames: state.channelNames || new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
              fixtures: state.fixtures || [],
              groups: state.groups || [],
              midiMappings: state.midiMappings || {},
              artNetConfig: state.artNetConfig || get().artNetConfig,
              scenes: state.scenes || [],
              acts: state.acts || [],
              fixtureLayout: state.fixtureLayout || [], 
              masterSliders: state.masterSliders || [] 
            })

            if (state.settings && typeof state.settings.transitionDuration === 'number') {
                set({ transitionDuration: state.settings.transitionDuration });
            }
            
            console.log('✅ Initial state applied successfully');
            // No explicit success notification here, to avoid clutter on normal startup
            return 
          }
          throw new Error('Invalid response from server')        } catch (error: any) {
          console.error('❌ Failed to fetch initial state:', error)
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
              oscAssignments: new Array(512).fill('').map((_, i) => `/1/fader${i + 1}`),
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
      
      setDmxChannel: (channel, value, sendToBackend = true) => {
        console.log(`[STORE] setDmxChannel called: channel=${channel}, value=${value}, sendToBackend=${sendToBackend}`);
        const dmxChannels = [...get().dmxChannels]
        dmxChannels[channel] = value
        set({ dmxChannels })
        
        if (sendToBackend) {
          console.log(`[STORE] Sending HTTP POST to /api/dmx: channel=${channel}, value=${value}`);
          axios.post('/api/dmx', { channel, value })
            .then(response => {
              console.log(`[STORE] DMX API call successful:`, response.data);
            })
            .catch(error => {
              console.error('Failed to update DMX channel:', error)
              console.error('Error details:', error.response?.data || error.message);
              get().addNotification({ message: 'Failed to update DMX channel', type: 'error', priority: 'high' }) 
            })
        } else {
          console.log(`[STORE] DMX channel updated locally (no backend request): channel=${channel}, value=${value}`);
        }
      },

      setMultipleDmxChannels: (updates, sendToBackend = true) => {
        console.log('[STORE] setMultipleDmxChannels: Called with updates batch:', updates, 'sendToBackend:', sendToBackend);
        const currentDmxChannels = get().dmxChannels;
        const newDmxChannels = [...currentDmxChannels];
        let changesApplied = false;
        for (const channelStr in updates) {
          const channel = parseInt(channelStr, 10);
          if (channel >= 0 && channel < newDmxChannels.length) {
            if (newDmxChannels[channel] !== updates[channel]) { // Check if value actually changes
              newDmxChannels[channel] = updates[channel];
              changesApplied = true;
            }
          }
        }
        
        if (changesApplied) {
          set({ dmxChannels: newDmxChannels });
          console.log('[STORE] setMultipleDmxChannels: Applied changes to local DMX state.');
        } else {
          console.log('[STORE] setMultipleDmxChannels: No actual changes to local DMX state after processing batch.');
        }
        
        if (sendToBackend) {
          console.log('[STORE] setMultipleDmxChannels: Sending HTTP POST to /api/dmx/batch with payload:', updates);
          axios.post('/api/dmx/batch', updates)
            .then(response => {
              console.log('[STORE] setMultipleDmxChannels: DMX batch API call successful. Response status:', response.status, 'Data:', response.data);
            })
            .catch(error => {
              console.error('[STORE] setMultipleDmxChannels: Failed to update DMX channels in batch via API.');
              if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error('[STORE] setMultipleDmxChannels: Error response data:', error.response.data);
              console.error('[STORE] setMultipleDmxChannels: Error response status:', error.response.status);
              console.error('[STORE] setMultipleDmxChannels: Error response headers:', error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('[STORE] setMultipleDmxChannels: No response received for DMX batch:', error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('[STORE] setMultipleDmxChannels: Error setting up DMX batch request:', error.message);
            }
            get().addNotification({ message: 'Failed to send DMX batch update to server', type: 'error', priority: 'high' });
          });
        } else {
          console.log('[STORE] setMultipleDmxChannels: Skipping backend request (sendToBackend=false)');
        }
      },      setDmxChannelValue: (channel, value) => { 
        get().setDmxChannel(channel, value);
        
        // Record the change if recording is active
        const { recordingActive } = get();
        if (recordingActive) {
          get().addRecordingEvent({
            type: 'dmx',
            channel,
            value
          });
        }
      },

      setDmxChannelsForTransition: (values) => { 
        // Update local state
        set({ dmxChannels: values });
        
        // Balanced approach - responsive but not spammy
        const now = Date.now();
        const { lastDmxTransitionUpdate, lastTransitionDmxValues, transitionStartTime, transitionDuration } = get();
        const updateInterval = 100; // Send DMX updates every 100ms (10fps) - more responsive
        
        // Always send final update when transition is complete
        const isTransitionComplete = transitionStartTime && (now - transitionStartTime) >= transitionDuration;
        
        if (isTransitionComplete || !lastDmxTransitionUpdate || (now - lastDmxTransitionUpdate) >= updateInterval) {
          // Only send channels that actually changed
          const updates: Record<number, number> = {};
          let hasChanges = false;
          
          if (lastTransitionDmxValues) {
            // Compare with last sent values - send meaningful changes
            for (let i = 0; i < values.length && i < 512; i++) {
              const currentValue = values[i] || 0;
              const lastValue = lastTransitionDmxValues[i] || 0;
              
              // Only include channels that changed by more than 3 DMX values (more responsive)
              if (Math.abs(currentValue - lastValue) > 3) {
                updates[i] = currentValue;
                hasChanges = true;
              }
            }
          } else {
            // First update - send all non-zero values
            for (let i = 0; i < values.length && i < 512; i++) {
              const currentValue = values[i] || 0;
              if (currentValue > 0) {
                updates[i] = currentValue;
                hasChanges = true;
              }
            }
          }
          
          // Send if there are changes OR if transition is complete (to ensure final values are set)
          if (hasChanges || isTransitionComplete) {
            if (isTransitionComplete) {
              // Final update - send all non-zero values to ensure we reach target
              const finalUpdates: Record<number, number> = {};
              for (let i = 0; i < values.length && i < 512; i++) {
                const currentValue = values[i] || 0;
                if (currentValue > 0) {
                  finalUpdates[i] = currentValue;
                }
              }
              axios.post('/api/dmx/batch', finalUpdates)
                .catch(error => {
                  console.error('Failed to send final DMX update:', error);
                });
            } else {
              // Regular update - only changed channels
              axios.post('/api/dmx/batch', updates)
                .catch(error => {
                  console.error('Failed to update DMX channels during transition:', error);
                });
            }
          }
          
          // Update tracking values
          set({ 
            lastDmxTransitionUpdate: now,
            lastTransitionDmxValues: [...values]
          });
        }
      },

      setCurrentTransitionFrameId: (frameId) => set({ currentTransitionFrame: frameId }),

      clearTransitionState: () => set({
        isTransitioning: false,
        transitionStartTime: null,
        fromDmxValues: null,
        toDmxValues: null,
        currentTransitionFrame: null,
        lastDmxTransitionUpdate: null,
        lastTransitionDmxValues: null,
      }),

      setTransitionDuration: (duration) => {
        if (duration >= 0) { 
          set({ transitionDuration: duration });
        }
      },

      setTransitionEasing: (easing) => {
        set({ transitionEasing: easing });
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

      // Fixture Selection Functions
      selectNextFixture: () => {
        const { fixtures, selectedFixtures } = get();
        if (fixtures.length === 0) return;

        let nextIndex = 0;
        if (selectedFixtures.length > 0) {
          const currentIndex = fixtures.findIndex(f => f.id === selectedFixtures[0]);
          nextIndex = (currentIndex + 1) % fixtures.length;
        }

        const nextFixture = fixtures[nextIndex];
        if (nextFixture) {
          set({ selectedFixtures: [nextFixture.id] });
          get().addNotification({ 
            message: `Selected fixture: ${nextFixture.name}`, 
            type: 'info', 
            priority: 'low' 
          });
        }
      },

      selectPreviousFixture: () => {
        const { fixtures, selectedFixtures } = get();
        if (fixtures.length === 0) return;

        let prevIndex = fixtures.length - 1;
        if (selectedFixtures.length > 0) {
          const currentIndex = fixtures.findIndex(f => f.id === selectedFixtures[0]);
          prevIndex = currentIndex === 0 ? fixtures.length - 1 : currentIndex - 1;
        }

        const prevFixture = fixtures[prevIndex];
        if (prevFixture) {
          set({ selectedFixtures: [prevFixture.id] });
          get().addNotification({ 
            message: `Selected fixture: ${prevFixture.name}`, 
            type: 'info', 
            priority: 'low' 
          });
        }
      },

      selectAllFixtures: () => {
        const { fixtures } = get();
        set({ selectedFixtures: fixtures.map(f => f.id) });
        get().addNotification({ 
          message: `Selected all ${fixtures.length} fixtures`, 
          type: 'info', 
          priority: 'low' 
        });
      },

      selectFixturesByType: (channelType: string) => {
        const { fixtures } = get();
        const filteredFixtures = fixtures.filter(fixture => 
          fixture.channels.some(ch => ch.type.toLowerCase() === channelType.toLowerCase())
        );
        
        set({ selectedFixtures: filteredFixtures.map(f => f.id) });
        get().addNotification({ 
          message: `Selected ${filteredFixtures.length} fixtures with ${channelType} channels`, 
          type: 'info', 
          priority: 'low' 
        });
      },

      selectFixtureGroup: (groupId: string) => {
        const { fixtures, groups } = get();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const groupFixtures = group.fixtureIndices
          .map(index => fixtures[index])
          .filter(Boolean)
          .map(f => f.id);

        set({ selectedFixtures: groupFixtures });
        get().addNotification({ 
          message: `Selected group: ${group.name} (${groupFixtures.length} fixtures)`, 
          type: 'info', 
          priority: 'low' 
        });
      },

      deselectAllFixtures: () => {
        set({ selectedFixtures: [] });
        get().addNotification({ 
          message: 'Deselected all fixtures', 
          type: 'info', 
          priority: 'low' 
        });
      },

      setSelectedFixtures: (fixtureIds: string[]) => {
        set({ selectedFixtures: fixtureIds });
      },

      toggleFixtureSelection: (fixtureId: string) => {
        const { selectedFixtures } = get();
        const newSelection = selectedFixtures.includes(fixtureId)
          ? selectedFixtures.filter(id => id !== fixtureId)
          : [...selectedFixtures, fixtureId];
        set({ selectedFixtures: newSelection });
      },

      // Placed Fixture Actions
      addPlacedFixture: (fixture: Omit<PlacedFixture, 'id'>) => {
        const { placedFixtures } = get();
        const newFixture: PlacedFixture = {
          ...fixture,
          id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          // Ensure dmxAddress is set from startAddress if not provided
          dmxAddress: fixture.dmxAddress || fixture.startAddress || 1,
          // Ensure type is set
          type: fixture.type || 'generic'
        };
        set({ placedFixtures: [...placedFixtures, newFixture] });
      },

      updatePlacedFixture: (id: string, updates: Partial<PlacedFixture>) => {
        const { placedFixtures } = get();
        const updatedFixtures = placedFixtures.map(fixture =>
          fixture.id === id ? { ...fixture, ...updates } : fixture
        );
        set({ placedFixtures: updatedFixtures });
      },

      removePlacedFixture: (id: string) => {
        const { placedFixtures } = get();
        const filteredFixtures = placedFixtures.filter(fixture => fixture.id !== id);
        set({ placedFixtures: filteredFixtures });
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
        // Store OSC activity
        set(state => ({
          oscActivity: {
            ...state.oscActivity,
            [channelIndex]: { value, timestamp: Date.now() }
          }
        }));
        
        // Convert normalized value (0.0-1.0) to DMX value (0-255) and update DMX channel
        const dmxValue = Math.round(value * 255);
        get().setDmxChannel(channelIndex, dmxValue);
      },
      
      addOscMessage: (message) => { // Implemented addOscMessage
        // Keep last 1000 messages in store (UI will limit display based on scrollback setting)
        const messages = [...get().oscMessages, message].slice(-1000);
        set({ oscMessages: messages });
        // console.log('OSC message received in store:', message); // Optional: for debugging
        if (get().recordingActive) {
          get().addRecordingEvent({ type: 'osc', data: message });
        }
      },      // MIDI Actions
      startMidiLearn: (target) => {
        set({ midiLearnTarget: target });
        
        let message = 'MIDI Learn started for ';
        switch (target.type) {
          case 'dmxChannel':
            message += `DMX Ch: ${target.channelIndex + 1}`;
            break;
          case 'masterSlider':
            message += `Master Slider: ${target.id}`;
            break;
          case 'group':
            message += `Group: ${target.id}`;
            break;
          case 'placedControl':
            message += `Control: ${target.controlId} on Fixture: ${target.fixtureId}`;
            break;
          case 'superControl':
            message += `SuperControl: ${target.controlName}`;
            break;
          default:
            message += 'Unknown target';
        }
        
        get().addNotification({ 
          message, 
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
        if (get().recordingActive) {
          get().addRecordingEvent({ type: 'midi', data: message });
        }
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

      setMidiInterfaces: (interfaces) => {
        set({ midiInterfaces: interfaces });
      },

      setActiveInterfaces: (interfaces) => {
        set({ activeInterfaces: interfaces });
      },
      
      // Fixture Actions
      addFixture: (fixture) => {
        set(state => ({
          fixtures: [...state.fixtures, fixture]
        }));
        // Optionally, save to backend here
        axios.post('/api/fixtures', fixture)
          .catch(error => {
            console.error('Failed to save new fixture to backend:', error);
            get().addNotification({ message: 'Failed to save new fixture to server', type: 'error' });
          });
      },

      setFixtures: (fixtures) => {
        set({ fixtures });
      },

      setGroups: (groups) => {
        set({ groups });
      },

      // Scene Actions
      saveScene: (name, oscAddress) => {
        const { dmxChannels, channelAutopilots, panTiltAutopilot, modularAutomation } = get();
        const newScene: Scene = {
          name,
          channelValues: [...dmxChannels],
          oscAddress,
          autopilots: { ...channelAutopilots },
          panTiltAutopilot: { ...panTiltAutopilot },
          // Save modular automation states (exclude animation IDs as they're runtime state)
          modularAutomation: {
            color: { ...modularAutomation.color },
            dimmer: { ...modularAutomation.dimmer },
            panTilt: { ...modularAutomation.panTilt },
            effects: { ...modularAutomation.effects },
            animationIds: {
              color: null,
              dimmer: null,
              panTilt: null,
              effects: null
            }
          }
        };
        
        const scenes = [...get().scenes];
        const existingIndex = scenes.findIndex(s => s.name === name);
        
        if (existingIndex !== -1) {
          scenes[existingIndex] = newScene;
          console.log(`[SCENES] Updated scene "${name}" with modular automation states`);
        } else {
          scenes.push(newScene);
          console.log(`[SCENES] Created new scene "${name}" with modular automation states`);
        }
        
        set({ scenes })
        
        axios.post('/api/scenes', { 
          name, 
          oscAddress, 
          channelValues: [...dmxChannels] 
        })
          .then(() => {
            get().addNotification({ message: `Scene '${name}' saved`, type: 'success' });
          })
          .catch(error => {
            console.error('Failed to save scene:', error)
            get().addNotification({ message: `Failed to save scene '${name}'`, type: 'error', priority: 'high' }) 
          })
      },
        loadScene: (nameOrIndex) => { 
        const { scenes, isTransitioning, currentTransitionFrame, dmxChannels: currentDmxState, transitionDuration, groups, fixtures } = get();
        let scene;
        
        // Handle both name and index
        if (typeof nameOrIndex === 'string') {
          scene = scenes.find(s => s.name === nameOrIndex);
        } else if (typeof nameOrIndex === 'number') {
          scene = scenes[nameOrIndex];
        }
        
        if (scene) {
          const sceneName = scene.name;
          console.log(`[STORE] Loading scene "${sceneName}" with transition`);
          
          // Cancel any ongoing transition
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

          // Set up transition state for smooth slider movement
          set({
            isTransitioning: true,
            fromDmxValues: [...currentDmxState], 
            toDmxValues: targetDmxValues,
            transitionStartTime: Date.now(),
          });
          
          get().addNotification({ message: `Loading scene '${sceneName}' (${transitionDuration}ms transition)`, type: 'info' });
          
          // Also send to backend for consistency
          axios.post('/api/scenes/load', { name: sceneName }) 
            .then(() => {
              console.log(`[STORE] Scene "${sceneName}" loaded successfully via backend`);
            })
            .catch(error => {
              console.error('Failed to load scene:', error)
              get().addNotification({ message: `Failed to load scene '${sceneName}'`, type: 'error', priority: 'high' }) 
            })
        } else {
          get().addNotification({ message: `Scene "${nameOrIndex}" not found`, type: 'error', priority: 'high' }) 
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

      // ACTS Actions
      createAct: (name, description) => {
        const newAct: Act = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          description: description || '',
          steps: [],
          loopMode: 'none',
          totalDuration: 0,
          triggers: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        set(state => ({
          acts: [...state.acts, newAct]
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
        
        get().addNotification({ 
          message: `Act '${name}' created`, 
          type: 'success' 
        });
      },

      updateAct: (actId, updates) => {
        set(state => ({
          acts: state.acts.map(act => 
            act.id === actId 
              ? { ...act, ...updates, updatedAt: Date.now() }
              : act
          )
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
        
        get().addNotification({ 
          message: `Act updated`, 
          type: 'success' 
        });
      },

      deleteAct: (actId) => {
        set(state => ({
          acts: state.acts.filter(act => act.id !== actId)
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
        
        get().addNotification({ 
          message: `Act deleted`, 
          type: 'success' 
        });
      },

      addActStep: (actId, stepData) => {
        const newStep: ActStep = {
          id: Math.random().toString(36).substr(2, 9),
          ...stepData
        };
        
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              const updatedSteps = [...act.steps, newStep];
              const totalDuration = updatedSteps.reduce((sum, step) => sum + step.duration, 0);
              return {
                ...act,
                steps: updatedSteps,
                totalDuration,
                updatedAt: Date.now()
              };
            }
            return act;
          })
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
        
        get().addNotification({ 
          message: `Step added to act`, 
          type: 'success' 
        });
      },

      updateActStep: (actId, stepId, updates) => {
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              const updatedSteps = act.steps.map(step => 
                step.id === stepId ? { ...step, ...updates } : step
              );
              const totalDuration = updatedSteps.reduce((sum, step) => sum + step.duration, 0);
              return {
                ...act,
                steps: updatedSteps,
                totalDuration,
                updatedAt: Date.now()
              };
            }
            return act;
          })
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
      },

      removeActStep: (actId, stepId) => {
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              const updatedSteps = act.steps.filter(step => step.id !== stepId);
              const totalDuration = updatedSteps.reduce((sum, step) => sum + step.duration, 0);
              return {
                ...act,
                steps: updatedSteps,
                totalDuration,
                updatedAt: Date.now()
              };
            }
            return act;
          })
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
      },

      reorderActSteps: (actId, stepIds) => {
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              const reorderedSteps = stepIds.map(id => 
                act.steps.find(step => step.id === id)
              ).filter(Boolean) as ActStep[];
              
              return {
                ...act,
                steps: reorderedSteps,
                updatedAt: Date.now()
              };
            }
            return act;
          })
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
      },

      // ACTS Trigger Actions
      addActTrigger: (actId, triggerData) => {
        const newTrigger: ActTrigger = {
          id: Math.random().toString(36).substr(2, 9),
          ...triggerData
        };
        
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              return {
                ...act,
                triggers: [...act.triggers, newTrigger],
                updatedAt: Date.now()
              };
            }
            return act;
          }),
          actTriggers: [...state.actTriggers, newTrigger]
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
        
        get().addNotification({ 
          message: `Trigger added to act`, 
          type: 'success' 
        });
      },

      updateActTrigger: (actId, triggerId, updates) => {
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              return {
                ...act,
                triggers: act.triggers.map(trigger => 
                  trigger.id === triggerId ? { ...trigger, ...updates } : trigger
                ),
                updatedAt: Date.now()
              };
            }
            return act;
          }),
          actTriggers: state.actTriggers.map(trigger => 
            trigger.id === triggerId ? { ...trigger, ...updates } : trigger
          )
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
      },

      removeActTrigger: (actId, triggerId) => {
        set(state => ({
          acts: state.acts.map(act => {
            if (act.id === actId) {
              return {
                ...act,
                triggers: act.triggers.filter(trigger => trigger.id !== triggerId),
                updatedAt: Date.now()
              };
            }
            return act;
          }),
          actTriggers: state.actTriggers.filter(trigger => trigger.id !== triggerId)
        }));
        
        // Save ACTS to backend
        get().saveActsToBackend();
      },

      processActTrigger: (trigger) => {
        if (!trigger.enabled) return;
        
        const { actPlaybackState, acts } = get();
        const act = acts.find(a => a.id === trigger.id.split('_')[0]); // Extract act ID from trigger ID
        
        if (!act) return;
        
        switch (trigger.action) {
          case 'play':
            if (actPlaybackState.currentActId === act.id && actPlaybackState.isPlaying) {
              get().pauseAct();
            } else {
              get().playAct(act.id);
            }
            break;
            
          case 'pause':
            if (actPlaybackState.currentActId === act.id) {
              get().pauseAct();
            }
            break;
            
          case 'stop':
            if (actPlaybackState.currentActId === act.id) {
              get().stopAct();
            }
            break;
            
          case 'next':
            if (actPlaybackState.currentActId === act.id) {
              get().nextActStep();
            }
            break;
            
          case 'previous':
            if (actPlaybackState.currentActId === act.id) {
              get().previousActStep();
            }
            break;
            
          case 'toggle':
            if (actPlaybackState.currentActId === act.id && actPlaybackState.isPlaying) {
              get().pauseAct();
            } else {
              get().playAct(act.id);
            }
            break;
        }
        
        get().addNotification({
          message: `Act trigger executed: ${trigger.action} for ${act.name}`,
          type: 'info',
          priority: 'low'
        });
      },

      saveActsToBackend: () => {
        const { acts } = get();
        try {
          // Send ACTS data to backend via Socket.IO
          // We'll use a custom event to trigger the save
          const event = new CustomEvent('saveActsToBackend', { detail: acts });
          window.dispatchEvent(event);
        } catch (error) {
          console.error('Failed to save ACTS to backend:', error);
          get().addNotification({
            message: 'Failed to save ACTS to backend',
            type: 'error'
          });
        }
      },

      // ACTS Playback Actions
      playAct: (actId) => {
        const act = get().acts.find(a => a.id === actId);
        if (!act || act.steps.length === 0) {
          get().addNotification({ 
            message: 'Act not found or has no steps', 
            type: 'error' 
          });
          return;
        }
        
        set({
          actPlaybackState: {
            isPlaying: true,
            currentActId: actId,
            currentStepIndex: 0,
            stepStartTime: Date.now(),
            stepProgress: 0,
            loopCount: 0,
            playbackSpeed: get().actPlaybackState.playbackSpeed
          }
        });
        
        // Load the first scene and apply autopilot settings
        const firstStep = act.steps[0];
        get().loadScene(firstStep.sceneName);
        
        // Apply autopilot settings for the first step
        if (firstStep.autopilotSettings?.enabled) {
          get().applyActStepAutopilot(firstStep);
        }
        
        get().addNotification({ 
          message: `Playing act '${act.name}'`, 
          type: 'info' 
        });
      },

      pauseAct: () => {
        set(state => ({
          actPlaybackState: {
            ...state.actPlaybackState,
            isPlaying: false
          }
        }));
      },

      stopAct: () => {
        set({
          actPlaybackState: {
            isPlaying: false,
            currentActId: null,
            currentStepIndex: 0,
            stepStartTime: 0,
            stepProgress: 0,
            loopCount: 0,
            playbackSpeed: 1.0
          }
        });
      },

      nextActStep: () => {
        const { actPlaybackState, acts } = get();
        if (!actPlaybackState.currentActId) return;
        
        const act = acts.find(a => a.id === actPlaybackState.currentActId);
        if (!act) return;
        
        const nextIndex = actPlaybackState.currentStepIndex + 1;
        
        if (nextIndex >= act.steps.length) {
          // Handle loop modes
          if (act.loopMode === 'loop') {
            set(state => ({
              actPlaybackState: {
                ...state.actPlaybackState,
                currentStepIndex: 0,
                stepStartTime: Date.now(),
                stepProgress: 0,
                loopCount: state.actPlaybackState.loopCount + 1
              }
            }));
            const firstStep = act.steps[0];
            get().loadScene(firstStep.sceneName);
            if (firstStep.autopilotSettings?.enabled) {
              get().applyActStepAutopilot(firstStep);
            }
          } else {
            get().stopAct();
          }
        } else {
          set(state => ({
            actPlaybackState: {
              ...state.actPlaybackState,
              currentStepIndex: nextIndex,
              stepStartTime: Date.now(),
              stepProgress: 0
            }
          }));
          const nextStep = act.steps[nextIndex];
          get().loadScene(nextStep.sceneName);
          if (nextStep.autopilotSettings?.enabled) {
            get().applyActStepAutopilot(nextStep);
          }
        }
      },

      previousActStep: () => {
        const { actPlaybackState, acts } = get();
        if (!actPlaybackState.currentActId) return;
        
        const act = acts.find(a => a.id === actPlaybackState.currentActId);
        if (!act) return;
        
        const prevIndex = actPlaybackState.currentStepIndex - 1;
        
        if (prevIndex >= 0) {
          set(state => ({
            actPlaybackState: {
              ...state.actPlaybackState,
              currentStepIndex: prevIndex,
              stepStartTime: Date.now(),
              stepProgress: 0
            }
          }));
          const prevStep = act.steps[prevIndex];
          get().loadScene(prevStep.sceneName);
          if (prevStep.autopilotSettings?.enabled) {
            get().applyActStepAutopilot(prevStep);
          }
        }
      },

      // Apply autopilot settings for an act step
      applyActStepAutopilot: (step) => {
        if (!step.autopilotSettings?.enabled) return;
        
        const { groups } = get();
        
        step.autopilotSettings.groups.forEach(groupConfig => {
          const group = groups.find(g => g.id === groupConfig.groupId);
          if (!group) return;
          
          // Apply autopilot settings to the group
          switch (groupConfig.autopilotType) {
            case 'color':
              // Enable color autopilot for the group
              group.fixtureIndices.forEach(fixtureIndex => {
                const fixture = get().fixtures[fixtureIndex];
                if (fixture) {
                  // Find color channels and enable autopilot
                  fixture.channels.forEach((channel, channelIndex) => {
                    if (channel.type.toLowerCase().includes('color') || 
                        channel.type.toLowerCase().includes('red') ||
                        channel.type.toLowerCase().includes('green') ||
                        channel.type.toLowerCase().includes('blue')) {
                      const dmxChannel = fixture.startAddress - 1 + channelIndex;
                      get().setChannelAutopilot(dmxChannel, {
                        enabled: true,
                        intensity: groupConfig.intensity / 100,
                        speed: groupConfig.speed / 100,
                        pattern: groupConfig.pattern || 'wave'
                      });
                    }
                  });
                }
              });
              break;
              
            case 'dimmer':
              // Enable dimmer autopilot for the group
              group.fixtureIndices.forEach(fixtureIndex => {
                const fixture = get().fixtures[fixtureIndex];
                if (fixture) {
                  // Find dimmer channel and enable autopilot
                  fixture.channels.forEach((channel, channelIndex) => {
                    if (channel.type.toLowerCase().includes('dimmer') ||
                        channel.type.toLowerCase().includes('intensity')) {
                      const dmxChannel = fixture.startAddress - 1 + channelIndex;
                      get().setChannelAutopilot(dmxChannel, {
                        enabled: true,
                        intensity: groupConfig.intensity / 100,
                        speed: groupConfig.speed / 100,
                        pattern: groupConfig.pattern || 'wave'
                      });
                    }
                  });
                }
              });
              break;
              
            case 'panTilt':
              // Enable pan/tilt autopilot for the group
              group.fixtureIndices.forEach(fixtureIndex => {
                const fixture = get().fixtures[fixtureIndex];
                if (fixture) {
                  // Find pan/tilt channels and enable autopilot
                  fixture.channels.forEach((channel, channelIndex) => {
                    if (channel.type.toLowerCase().includes('pan') ||
                        channel.type.toLowerCase().includes('tilt')) {
                      const dmxChannel = fixture.startAddress - 1 + channelIndex;
                      get().setChannelAutopilot(dmxChannel, {
                        enabled: true,
                        intensity: groupConfig.intensity / 100,
                        speed: groupConfig.speed / 100,
                        pattern: groupConfig.pattern || 'wave'
                      });
                    }
                  });
                }
              });
              break;
          }
        });
        
        get().addNotification({
          message: `Applied autopilot settings for step: ${step.sceneName}`,
          type: 'info',
          priority: 'low'
        });
      },

      setActPlaybackSpeed: (speed) => {
        set(state => ({
          actPlaybackState: {
            ...state.actPlaybackState,
            playbackSpeed: Math.max(0.1, Math.min(2.0, speed))
          }
        }));
      },

      setActStepProgress: (progress) => {
        set(state => ({
          actPlaybackState: {
            ...state.actPlaybackState,
            stepProgress: Math.max(0, Math.min(1, progress))
          }
        }));
      },

      // Quick Scene Functions
      quickSceneSave: () => {
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
        const quickName = `Quick_${timestamp}`;
        const oscAddress = `/scene/${quickName.toLowerCase()}`;
        
        get().saveScene(quickName, oscAddress);
        get().addNotification({
          message: `Quick scene saved as "${quickName}" 📸`,
          type: 'success',
          priority: 'normal'
        });
      },

      quickSceneLoad: () => {
        const { scenes } = get();
        if (scenes.length === 0) {
          get().addNotification({
            message: 'No scenes available to load',
            type: 'warning',
            priority: 'normal'
          });
          return;
        }

        // Load the most recently saved scene
        const latestScene = scenes[scenes.length - 1];
        get().loadScene(latestScene.name);
        get().addNotification({
          message: `Quick loaded scene "${latestScene.name}" ⚡`,
          type: 'success',
          priority: 'normal'
        });
      },

      setQuickSceneMidiMapping: (mapping) => {
        set({ quickSceneMidiMapping: mapping });
      },
      
      // Autopilot Actions
      setChannelAutopilot: (channelIndex, config) => {
        set(state => ({
          channelAutopilots: {
            ...state.channelAutopilots,
            [channelIndex]: config
          }
        }));
        if (config.enabled && !get().autopilotUpdateInterval) {
          get().startAutopilotSystem();
        }
      },
      removeChannelAutopilot: (channelIndex) => {
        set(state => {
          const newAutopilots = { ...state.channelAutopilots };
          delete newAutopilots[channelIndex];
          return { channelAutopilots: newAutopilots };
        });
      },
      setPanTiltAutopilot: (config) => {
        const currentConfig = get().panTiltAutopilot;
        const newConfig = { ...currentConfig, ...config };
        set({ panTiltAutopilot: newConfig });
        if (newConfig.enabled && !get().autopilotUpdateInterval) {
          get().startAutopilotSystem();
        }
      },
      togglePanTiltAutopilot: () => {
        const enabled = !get().panTiltAutopilot.enabled;
        get().setPanTiltAutopilot({ enabled });
      },
      setColorSliderAutopilot: (config) => {
        const currentConfig = get().colorSliderAutopilot;
        const newConfig = { ...currentConfig, ...config };
        set({ colorSliderAutopilot: newConfig });
        if (newConfig.enabled && !get().autopilotUpdateInterval) {
          get().startAutopilotSystem();
        }
      },
      toggleColorSliderAutopilot: () => {
        const enabled = !get().colorSliderAutopilot.enabled;
        get().setColorSliderAutopilot({ enabled });
      },
      updateAutopilotValues: () => {
        const { channelAutopilots, panTiltAutopilot, colorSliderAutopilot, setDmxChannel, bpm, lastAutopilotUpdate, setExampleSliderValue } = get();
        const now = Date.now();
        const timeElapsed = (now - lastAutopilotUpdate) / 1000; // in seconds
        const updates: { [key: number]: number } = {};
        let hasUpdates = false;

        // Channel Autopilots
        Object.entries(channelAutopilots).forEach(([channelStr, configUnknown]) => {
          const config = configUnknown as AutopilotConfig;
          if (!config.enabled) return;
          const channel = parseInt(channelStr);
          const speed = config.syncToBPM ? (bpm / 60) * config.speed : config.speed;
          const phaseOffset = (config.phase / 360) * 2 * Math.PI;
          let value = 0;
          const progress = (now / 1000 * speed) % 1;

          switch (config.type) {
            case 'sine':
              value = (Math.sin(progress * 2 * Math.PI + phaseOffset) + 1) / 2;
              break;
            case 'triangle':
              value = Math.abs((progress * 2) - 1);
              break;
            case 'sawtooth':
              value = progress;
              break;
            case 'ping-pong':
              value = Math.abs(((progress * 2) % 2) - 1);
              break;
            case 'random':
              // This should be handled differently, maybe on beats
              return; // avoid setting dmx value
          }
          const dmxValue = Math.round(config.range.min + value * (config.range.max - config.range.min));
          updates[channel] = dmxValue;
          hasUpdates = true;
        });

        // Pan/Tilt Autopilot
        if (panTiltAutopilot.enabled) {
          const fixtures = get().fixtures.filter(f => 
            f.channels.some(c => c.type === 'pan' || c.type === 'tilt')
          );

          // Calculate phase increment once for all fixtures
          let phaseIncrement = panTiltAutopilot.speed * timeElapsed;
          if (panTiltAutopilot.syncToBPM && bpm > 0) {
            phaseIncrement = (bpm / 60) * timeElapsed * panTiltAutopilot.speed;
          }

          const newPhase = (panTiltAutopilot.phase + phaseIncrement) % (2 * Math.PI);
          const progress = newPhase / (2 * Math.PI);

          fixtures.forEach(fixture => {
            const panChannel = fixture.channels.find(c => c.type === 'pan');
            const tiltChannel = fixture.channels.find(c => c.type === 'tilt');

            if (panChannel && tiltChannel) {
              let panValue = panTiltAutopilot.centerX;
              let tiltValue = panTiltAutopilot.centerY;
              
              const radius = (panTiltAutopilot.size / 100) * 127; // Convert percentage to DMX range

              // Calculate position based on pattern
              switch (panTiltAutopilot.pathType) {
                case 'circle':
                  panValue += Math.sin(newPhase) * radius;
                  tiltValue += Math.cos(newPhase) * radius;
                  break;
                case 'figure8':
                  panValue += Math.sin(newPhase * 2) * radius;
                  tiltValue += Math.sin(newPhase) * radius;
                  break;
                case 'square':
                  const t = progress;
                  if (t < 0.25) {
                    panValue += radius;
                    tiltValue += radius;
                  } else if (t < 0.5) {
                    panValue -= radius;
                    tiltValue += radius;
                  } else if (t < 0.75) {
                    panValue -= radius;
                    tiltValue -= radius;
                  } else {
                    panValue += radius;
                    tiltValue -= radius;
                  }
                  break;
                case 'triangle':
                  const triT = progress;
                  if (triT < 1/3) {
                    panValue += radius;
                    tiltValue += (triT * 3) * radius;
                  } else if (triT < 2/3) {
                    const subT = (triT - 1/3) * 3;
                    panValue += (1 - subT * 2) * radius;
                    tiltValue += radius;
                  } else {
                    const subT = (triT - 2/3) * 3;
                    panValue -= radius;
                    tiltValue += (1 - subT) * radius;
                  }
                  break;
                case 'linear':
                  panValue += (progress * 2 - 1) * radius; // -1 to 1 range
                  break;
                case 'custom':
                  if (panTiltAutopilot.customPath && panTiltAutopilot.customPath.length > 0) {
                    const pathIndex = Math.floor(progress * panTiltAutopilot.customPath.length);
                    const point = panTiltAutopilot.customPath[pathIndex % panTiltAutopilot.customPath.length];
                    panValue = point.x;
                    tiltValue = point.y;
                  }
                  break;
              }

              // Clamp values to DMX range
              const panDmx = Math.round(Math.min(255, Math.max(0, panValue)));
              const tiltDmx = Math.round(Math.min(255, Math.max(0, tiltValue)));

              // Calculate DMX addresses properly
              const panChannelIndex = fixture.channels.indexOf(panChannel);
              const tiltChannelIndex = fixture.channels.indexOf(tiltChannel);
              
              let panDmxAddress: number;
              let tiltDmxAddress: number;
              
              if (typeof panChannel.dmxAddress === 'number' && panChannel.dmxAddress >= 1) {
                panDmxAddress = panChannel.dmxAddress - 1; // Convert to 0-based
              } else {
                panDmxAddress = (fixture.startAddress || 1) + panChannelIndex - 1; // Convert to 0-based
              }
              
              if (typeof tiltChannel.dmxAddress === 'number' && tiltChannel.dmxAddress >= 1) {
                tiltDmxAddress = tiltChannel.dmxAddress - 1; // Convert to 0-based
              } else {
                tiltDmxAddress = (fixture.startAddress || 1) + tiltChannelIndex - 1; // Convert to 0-based
              }

              updates[panDmxAddress] = panDmx;
              updates[tiltDmxAddress] = tiltDmx;
              hasUpdates = true;
            }
          });

          // Update phase for next iteration
          set(state => ({
            panTiltAutopilot: {
              ...state.panTiltAutopilot,
              phase: newPhase
            }
          }));
        }

        // Color Slider Autopilot
        if (colorSliderAutopilot.enabled) {
          const fixtures = get().fixtures.filter(f => 
            f.channels.some(c => ['red', 'green', 'blue'].includes(c.type))
          );

          // Only log debug info every 2 seconds to avoid spam
          const shouldDebug = Math.floor(now / 2000) !== Math.floor((now - 50) / 2000);
          if (shouldDebug) {
            console.log('🎨 Color Autopilot Debug:');
            console.log('  Total fixtures:', get().fixtures.length);
            console.log('  RGB fixtures found:', fixtures.length);
            console.log('  RGB fixtures:', fixtures.map(f => f.name));
          }

          if (fixtures.length > 0) {
            const speed = colorSliderAutopilot.syncToBPM ? (bpm / 60) * colorSliderAutopilot.speed : colorSliderAutopilot.speed;
            const phaseOffset = (colorSliderAutopilot.phase / 360) * 2 * Math.PI;
            const progress = (now / 1000 * speed) % 1;

            let hue = 0;
            let saturation = 1; // Full saturation by default
            let value = 1; // Full brightness by default

            switch (colorSliderAutopilot.type) {
              case 'sine':
                hue = (Math.sin(progress * 2 * Math.PI + phaseOffset) + 1) / 2 * 360;
                break;
              case 'triangle':
                hue = Math.abs((progress * 2) - 1) * 360;
                break;
              case 'sawtooth':
                hue = progress * 360;
                break;
              case 'ping-pong':
                hue = Math.abs(((progress * 2) % 2) - 1) * 360;
                break;
              case 'cycle':
                hue = progress * 360;
                break;
              case 'random':
                // Generate a stable random hue based on time intervals
                const timeSegment = Math.floor(now / 2000); // Change every 2 seconds
                hue = (Math.sin(timeSegment * 12.9898) * 43758.5453123 % 1) * 360;
                break;
            }

            // Apply hue range constraint
            const hueRange = colorSliderAutopilot.range.max - colorSliderAutopilot.range.min;
            hue = colorSliderAutopilot.range.min + (hue / 360) * hueRange;
            hue = hue % 360;

            // Convert HSV to RGB
            const hsvToRgb = (h: number, s: number, v: number): { r: number, g: number, b: number } => {
              h = h / 60;
              const c = v * s;
              const x = c * (1 - Math.abs((h % 2) - 1));
              const m = v - c;
              
              let r = 0, g = 0, b = 0;
              
              if (h >= 0 && h < 1) {
                r = c; g = x; b = 0;
              } else if (h >= 1 && h < 2) {
                r = x; g = c; b = 0;
              } else if (h >= 2 && h < 3) {
                r = 0; g = c; b = x;
              } else if (h >= 3 && h < 4) {
                r = 0; g = x; b = c;
              } else if (h >= 4 && h < 5) {
                r = x; g = 0; b = c;
              } else if (h >= 5 && h < 6) {
                r = c; g = 0; b = x;
              }
              
              return {
                r: Math.round((r + m) * 255),
                g: Math.round((g + m) * 255),
                b: Math.round((b + m) * 255)
              };
            };

            const rgb = hsvToRgb(hue, saturation, value);

            if (shouldDebug) {
              console.log('  Calculated HSV:', { h: hue.toFixed(1), s: saturation, v: value });
              console.log('  Calculated RGB:', rgb);
            }

            // Apply to all RGB fixtures
            fixtures.forEach(fixture => {
              const redChannel = fixture.channels.find(c => c.type === 'red');
              const greenChannel = fixture.channels.find(c => c.type === 'green');
              const blueChannel = fixture.channels.find(c => c.type === 'blue');

              if (redChannel && greenChannel && blueChannel) {
                const redChannelIndex = fixture.channels.indexOf(redChannel);
                const greenChannelIndex = fixture.channels.indexOf(greenChannel);
                const blueChannelIndex = fixture.channels.indexOf(blueChannel);
                
                let redDmxAddress: number;
                let greenDmxAddress: number;
                let blueDmxAddress: number;
                
                if (typeof redChannel.dmxAddress === 'number' && redChannel.dmxAddress >= 1) {
                  redDmxAddress = redChannel.dmxAddress - 1; // Convert to 0-based
                } else {
                  redDmxAddress = (fixture.startAddress || 1) + redChannelIndex - 1; // Convert to 0-based
                }
                
                if (typeof greenChannel.dmxAddress === 'number' && greenChannel.dmxAddress >= 1) {
                  greenDmxAddress = greenChannel.dmxAddress - 1; // Convert to 0-based
                } else {
                  greenDmxAddress = (fixture.startAddress || 1) + greenChannelIndex - 1; // Convert to 0-based
                }
                
                if (typeof blueChannel.dmxAddress === 'number' && blueChannel.dmxAddress >= 1) {
                  blueDmxAddress = blueChannel.dmxAddress - 1; // Convert to 0-based
                } else {
                  blueDmxAddress = (fixture.startAddress || 1) + blueChannelIndex - 1; // Convert to 0-based
                }

                if (shouldDebug) {
                  console.log(`  Fixture "${fixture.name}":`, {
                    redAddr: redDmxAddress,
                    greenAddr: greenDmxAddress, 
                    blueAddr: blueDmxAddress,
                    rgbValues: rgb
                  });
                }

                updates[redDmxAddress] = rgb.r;
                updates[greenDmxAddress] = rgb.g;
                updates[blueDmxAddress] = rgb.b;
                hasUpdates = true;
              } else if (shouldDebug) {
                console.log(`  Fixture "${fixture.name}": Missing RGB channels`);
              }
            });
          } else if (shouldDebug) {
            console.log('  No RGB fixtures found!');
          }
        }

        // Apply all updates at once
        if (hasUpdates) {
          get().setMultipleDmxChannels(updates);
        }

        // Update timestamp
        set({ lastAutopilotUpdate: now });
      },

      startAutopilotSystem: () => {
        const { autopilotUpdateInterval } = get();
        
        // Don't start if already running
        if (autopilotUpdateInterval) return;

        const interval = setInterval(() => {
          get().updateAutopilotValues();
        }, 50); // 20 FPS update rate

        set({ autopilotUpdateInterval: interval });
        
        get().addNotification({
          message: 'Autopilot system started',
          type: 'success'
        });
      },

      stopAutopilotSystem: () => {
        const { autopilotUpdateInterval } = get();
        
        if (autopilotUpdateInterval) {
          clearInterval(autopilotUpdateInterval);
          set({ autopilotUpdateInterval: null });
          
          get().addNotification({
            message: 'Autopilot system stopped',
            type: 'info'
          });
        }
      },

      // Enhanced Autopilot Track Animation System
      startAutopilotTrackAnimation: () => {
        const { autopilotTrackAnimationId } = get();
        
        // Don't start if already running
        if (autopilotTrackAnimationId !== null) return;

        console.log('[STORE] Starting autopilot track animation system');
        
        let lastTime = performance.now();
        
        const animate = (currentTime: number) => {
          const state = get();
          
          // Exit if autopilot is disabled or animation was stopped
          if (!state.autopilotTrackEnabled || state.autopilotTrackAnimationId === null) {
            console.log('[STORE] Animation loop stopping - autopilot disabled or animation ID null');
            return;
          }

          const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
          lastTime = currentTime;

          // Only animate if auto-play is enabled, but always ensure fixture positions are updated
          if (state.autopilotTrackAutoPlay) {
            // Calculate position advancement based on speed and BPM
            const bpm = state.bpm || 120; // Default to 120 BPM
            const speedMultiplier = state.autopilotTrackSpeed / 50; // Normalize speed (50 = 1x speed)
            
            // Calculate advancement per second
            // At 120 BPM and 1x speed, complete one full cycle every 2 seconds (30 cycles per minute)
            const cyclesPerMinute = (bpm / 120) * 30 * speedMultiplier;
            const cyclesPerSecond = cyclesPerMinute / 60;
            const advancementPerSecond = cyclesPerSecond * 100; // Convert to percentage
            
            // Update position
            const currentPosition = state.autopilotTrackPosition;
            const newPosition = (currentPosition + (advancementPerSecond * deltaTime)) % 100;
            
            console.log(`[STORE] Autopilot advancing: ${currentPosition.toFixed(2)}% -> ${newPosition.toFixed(2)}% (speed: ${speedMultiplier}x)`);
            
            // Update position in store
            set({ autopilotTrackPosition: newPosition });
            get().updatePanTiltFromTrack(newPosition);
          } else {
            // Always update fixtures with current position (whether auto-play is on or off)
            get().updatePanTiltFromTrack();
          }
          
          // Continue animation
          const newAnimationId = requestAnimationFrame(animate);
          set({ autopilotTrackAnimationId: newAnimationId });
        };

        // Start the animation loop
        const initialAnimationId = requestAnimationFrame(animate);
        set({ autopilotTrackAnimationId: initialAnimationId });
        
        console.log('[STORE] Autopilot track animation system started with ID:', initialAnimationId);
      },

      stopAutopilotTrackAnimation: () => {
        const { autopilotTrackAnimationId } = get();
        
        if (autopilotTrackAnimationId !== null) {
          console.log('[STORE] Stopping autopilot track animation system, ID:', autopilotTrackAnimationId);
          cancelAnimationFrame(autopilotTrackAnimationId);
          set({ autopilotTrackAnimationId: null });
        }
      },

      // New Modular Automation Actions Implementation
      setColorAutomation: (config) => {
        set((state) => ({
          modularAutomation: {
            ...state.modularAutomation,
            color: { ...state.modularAutomation.color, ...config }
          }
        }));
      },

      setDimmerAutomation: (config) => {
        set((state) => ({
          modularAutomation: {
            ...state.modularAutomation,
            dimmer: { ...state.modularAutomation.dimmer, ...config }
          }
        }));
      },

      setPanTiltAutomation: (config) => {
        set((state) => ({
          modularAutomation: {
            ...state.modularAutomation,
            panTilt: { ...state.modularAutomation.panTilt, ...config }
          }
        }));
      },

      setEffectsAutomation: (config) => {
        set((state) => ({
          modularAutomation: {
            ...state.modularAutomation,
            effects: { ...state.modularAutomation.effects, ...config }
          }
        }));
      },

      toggleColorAutomation: () => {
        const { modularAutomation } = get();
        const newEnabled = !modularAutomation.color.enabled;
        
        get().setColorAutomation({ enabled: newEnabled });
        
        if (newEnabled) {
          get().startModularAnimation('color');
        } else {
          get().stopModularAnimation('color');
        }
      },

      toggleDimmerAutomation: () => {
        const { modularAutomation } = get();
        const newEnabled = !modularAutomation.dimmer.enabled;
        
        get().setDimmerAutomation({ enabled: newEnabled });
        
        if (newEnabled) {
          get().startModularAnimation('dimmer');
        } else {
          get().stopModularAnimation('dimmer');
        }
      },

      togglePanTiltAutomation: () => {
        const { modularAutomation } = get();
        const newEnabled = !modularAutomation.panTilt.enabled;
        
        get().setPanTiltAutomation({ enabled: newEnabled });
        
        if (newEnabled) {
          get().startModularAnimation('panTilt');
        } else {
          get().stopModularAnimation('panTilt');
        }
      },

      toggleEffectsAutomation: () => {
        const { modularAutomation } = get();
        const newEnabled = !modularAutomation.effects.enabled;
        
        get().setEffectsAutomation({ enabled: newEnabled });
        
        if (newEnabled) {
          get().startModularAnimation('effects');
        } else {
          get().stopModularAnimation('effects');
        }
      },

      startModularAnimation: (type) => {
        const { modularAutomation, selectedFixtures, bpm } = get();
        const config = modularAutomation[type];
        
        if (!config.enabled) return;
        
        console.log(`[MODULAR AUTOMATION] Starting ${type} animation`);
        
        // Stop existing animation if running
        if (modularAutomation.animationIds[type]) {
          cancelAnimationFrame(modularAutomation.animationIds[type]!);
        }

        let startTime = performance.now();
        let lastUpdate = startTime;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - lastUpdate;
          
          // Throttle to reasonable frame rate
          if (elapsed < 16.67) { // ~60fps limit
            const frameId = requestAnimationFrame(animate);
            set((state) => ({
              modularAutomation: {
                ...state.modularAutomation,
                animationIds: { ...state.modularAutomation.animationIds, [type]: frameId }
              }
            }));
            return;
          }

          const timeFromStart = currentTime - startTime;
          const effectiveSpeed = config.syncToBPM ? (bpm / 60) * config.speed : config.speed;
          const progress = (timeFromStart / 1000 * effectiveSpeed) % 1;

          // Apply automation based on type
          selectedFixtures.forEach(fixtureId => {
            get().applyModularAutomation(type, fixtureId, progress);
          });

          lastUpdate = currentTime;
          
          // Continue animation if still enabled
          const currentState = get().modularAutomation[type];
          if (currentState.enabled) {
            const frameId = requestAnimationFrame(animate);
            set((state) => ({
              modularAutomation: {
                ...state.modularAutomation,
                animationIds: { ...state.modularAutomation.animationIds, [type]: frameId }
              }
            }));
          }
        };

        const initialFrameId = requestAnimationFrame(animate);
        set((state) => ({
          modularAutomation: {
            ...state.modularAutomation,
            animationIds: { ...state.modularAutomation.animationIds, [type]: initialFrameId }
          }
        }));
      },

      stopModularAnimation: (type) => {
        const { modularAutomation } = get();
        const animationId = modularAutomation.animationIds[type];
        
        if (animationId) {
          console.log(`[MODULAR AUTOMATION] Stopping ${type} animation`);
          cancelAnimationFrame(animationId);
          set((state) => ({
            modularAutomation: {
              ...state.modularAutomation,
              animationIds: { ...state.modularAutomation.animationIds, [type]: null }
            }
          }));
        }
      },

      stopAllModularAnimations: () => {
        const { modularAutomation } = get();
        
        Object.entries(modularAutomation.animationIds).forEach(([type, animationId]) => {
          if (animationId && typeof animationId === 'number') {
            cancelAnimationFrame(animationId);
          }
        });
        
        set((state) => ({
          modularAutomation: {
            ...state.modularAutomation,
            animationIds: {
              color: null,
              dimmer: null,
              panTilt: null,
              effects: null
            }
          }
        }));
        
        console.log('[MODULAR AUTOMATION] All animations stopped');
      },

      // Helper function to apply specific automation effects
      applyModularAutomation: (type: 'color' | 'dimmer' | 'panTilt' | 'effects', fixtureId: string, progress: number) => {
        const { modularAutomation, fixtures, getDmxChannelValue, setDmxChannelValue } = get();
        const fixture = fixtures.find(f => f.id === fixtureId);
        if (!fixture) return;

        const config = modularAutomation[type];

        switch (type) {
          case 'color': {
            const colorConfig = config as ColorAutomationConfig;
            let r = 0, g = 0, b = 0;

            switch (colorConfig.type) {
              case 'rainbow':
                const hue = (progress * 360 + (colorConfig.phase || 0)) % 360;
                const rgb = hsvToRgb(hue, colorConfig.saturation || 100, colorConfig.brightness || 100);
                r = rgb.r; g = rgb.g; b = rgb.b;
                break;
              
              case 'cycle':
                if (colorConfig.colors) {
                  const colorIndex = Math.floor(progress * colorConfig.colors.length);
                  const color = colorConfig.colors[colorIndex] || colorConfig.colors[0];
                  r = color.r; g = color.g; b = color.b;
                }
                break;
              
              case 'wave':
                const wave = Math.sin(progress * Math.PI * 2);
                const intensity = (wave + 1) / 2; // Normalize to 0-1
                r = intensity * 255;
                g = intensity * 127;
                b = intensity * 63;
                break;
            }

            // Apply RGB values to fixture channels
            fixture.channels.forEach(channel => {
              if (channel.dmxAddress) {
                switch (channel.type) {
                  case 'red':
                    setDmxChannelValue(channel.dmxAddress - 1, Math.round(r * (colorConfig.intensity / 100)));
                    break;
                  case 'green':
                    setDmxChannelValue(channel.dmxAddress - 1, Math.round(g * (colorConfig.intensity / 100)));
                    break;
                  case 'blue':
                    setDmxChannelValue(channel.dmxAddress - 1, Math.round(b * (colorConfig.intensity / 100)));
                    break;
                }
              }
            });
            break;
          }

          case 'dimmer': {
            const dimmerConfig = config as DimmerAutomationConfig;
            let value = 0;

            switch (dimmerConfig.type) {
              case 'breathe':
                value = Math.sin(progress * Math.PI * 2);
                value = (value + 1) / 2; // Normalize to 0-1
                break;
              
              case 'pulse':
                value = progress < 0.5 ? 1 : 0;
                break;
              
              case 'ramp':
                value = progress;
                break;
              
              case 'random':
                value = Math.random();
                break;
            }

            const dmxValue = dimmerConfig.range.min + (value * (dimmerConfig.range.max - dimmerConfig.range.min));
            
            fixture.channels.forEach(channel => {
              if (channel.dmxAddress && channel.type === 'dimmer') {
                setDmxChannelValue(channel.dmxAddress - 1, Math.round(dmxValue));
              }
            });
            break;
          }

          case 'panTilt': {
            const panTiltConfig = config as PanTiltAutopilotConfig;
            const position = get().calculateTrackPosition(
              panTiltConfig.pathType,
              progress * 100,
              panTiltConfig.size,
              panTiltConfig.centerX,
              panTiltConfig.centerY
            );

            fixture.channels.forEach(channel => {
              if (channel.dmxAddress) {
                if (channel.type === 'pan') {
                  setDmxChannelValue(channel.dmxAddress - 1, position.pan);
                } else if (channel.type === 'tilt') {
                  setDmxChannelValue(channel.dmxAddress - 1, position.tilt);
                }
              }
            });
            break;
          }

          case 'effects': {
            const effectsConfig = config as EffectsAutomationConfig;
            let value = 0;

            switch (effectsConfig.type) {
              case 'gobo_cycle':
                value = progress * (effectsConfig.range?.max || 255);
                break;
              
              case 'prism_rotate':
                value = progress * 255;
                break;
            }

            fixture.channels.forEach(channel => {
              if (channel.dmxAddress) {
                switch (effectsConfig.type) {
                  case 'gobo_cycle':
                    if (channel.type === 'gobo' || channel.type === 'gobo_wheel') {
                      setDmxChannelValue(channel.dmxAddress - 1, Math.round(value));
                    }
                    break;
                  case 'prism_rotate':
                    if (channel.type === 'prism') {
                      setDmxChannelValue(channel.dmxAddress - 1, Math.round(value));
                    }
                    break;
                }
              }
            });
            break;
          }
        }
      },

      // MIDI Clock and BPM Control Actions
      setSelectedMidiClockHostId: (hostId) => {
        set({ selectedMidiClockHostId: hostId });
        
        // Emit to server if socket is available
        const { socket } = get();
        if (socket) {
          socket.emit('setMasterClockSource', hostId);
          console.log('Store: Sending setMasterClockSource to server:', hostId);
        }
      },

      setAvailableMidiClockHosts: (hosts) => set({ availableMidiClockHosts: hosts }),

      setMidiClockBpm: (bpm) => {
        set({ midiClockBpm: bpm });
        
        // Also emit to server if socket is available for BPM changes
        const { socket } = get();
        if (socket) {
          socket.emit('setInternalClockBPM', bpm);
          console.log('Store: Sending setInternalClockBPM to server:', bpm);
        }
      },

      setMidiClockIsPlaying: (isPlaying) => set({ midiClockIsPlaying: isPlaying }),

      setMidiClockBeatBar: (beat, bar) => set({ 
        midiClockCurrentBeat: beat, 
        midiClockCurrentBar: bar 
      }),

      requestToggleMasterClockPlayPause: () => {
        const { socket } = get();
        if (socket) {
          console.log('Store: Requesting master clock play/pause toggle via socket');
          socket.emit('toggleMasterClockPlayPause');
        } else {
          console.warn('Store: No socket connection available for master clock toggle');
          // Fallback - directly toggle the local state
          const { midiClockIsPlaying } = get();
          set({ midiClockIsPlaying: !midiClockIsPlaying });
        }
      },
      requestMasterClockSourceChange: (sourceId: string) => {
        get().socket?.emit('setMasterClockSource', sourceId);
      },
      requestMidiClockInputList: () => {
        get().socket?.emit('getMidiClockInputs');
      },
      requestSetMidiClockInput: (inputName: string) => {
        get().socket?.emit('setMidiClockInput', inputName);
      },

      // Auto-Scene Actions
      setAutoSceneEnabled: (enabled) => {
        set({ autoSceneEnabled: enabled });
        saveAutoSceneSettings(get());
      },

      setAutoSceneList: (sceneNames) => {
        set({ autoSceneList: sceneNames });
        saveAutoSceneSettings(get());
      },

      setAutoSceneMode: (mode) => {
        set({ autoSceneMode: mode, autoScenePingPongDirection: 'forward' }); // Reset direction when changing mode
        saveAutoSceneSettings(get());
      },

      setAutoSceneBeatDivision: (division) => {
        set({ autoSceneBeatDivision: Math.max(1, division) }); // Ensure at least 1
        saveAutoSceneSettings(get());
      },

      setAutoSceneTempoSource: (source) => {
        console.log('Store: Setting auto scene tempo source to:', source);
        set({ autoSceneTempoSource: source });
        saveAutoSceneSettings(get());
        
        // If switching to internal clock, we might need to emit some socket events
        const { socket } = get();
        if (socket && source === 'tap_tempo') {
          // For tap_tempo source, we're using MIDI Clock
          socket.emit('setMasterClockSource', 'internal');
        }
      },

      setNextAutoSceneIndex: () => {
        const { autoSceneList, autoSceneCurrentIndex, autoSceneMode, autoScenePingPongDirection } = get();
        
        if (autoSceneList.length === 0) return;

        let nextIndex = autoSceneCurrentIndex;

        switch (autoSceneMode) {
          case 'forward':
            nextIndex = (autoSceneCurrentIndex + 1) % autoSceneList.length;
            break;
          
          case 'ping-pong':
            if (autoScenePingPongDirection === 'forward') {
              nextIndex = autoSceneCurrentIndex + 1;
              if (nextIndex >= autoSceneList.length - 1) {
                nextIndex = autoSceneList.length - 1;
                set({ autoScenePingPongDirection: 'backward' });
              }
            } else {
              nextIndex = autoSceneCurrentIndex - 1;
              if (nextIndex <= 0) {
                nextIndex = 0;
                set({ autoScenePingPongDirection: 'forward' });
              }
            }
            break;
          
          case 'random':
            nextIndex = Math.floor(Math.random() * autoSceneList.length);
            break;
        }

        set({ autoSceneCurrentIndex: nextIndex });
      },

      resetAutoSceneIndex: () => set({ autoSceneCurrentIndex: -1 }),

      setManualBpm: (bpm) => {
        const clampedBpm = Math.max(60, Math.min(200, bpm)); // Clamp between 60-200
        console.log('Store: Setting manual BPM to:', clampedBpm);
        set({ autoSceneManualBpm: clampedBpm });
        saveAutoSceneSettings(get());
      },

      recordTapTempo: () => {
        const now = Date.now();
        const { autoSceneTapTimes, autoSceneLastTapTime } = get();
        
        // Reset if more than 3 seconds since last tap
        const newTapTimes = (now - autoSceneLastTapTime > 3000) ? [now] : [...autoSceneTapTimes, now];
        
        set({ 
          autoSceneTapTimes: newTapTimes.slice(-8), // Keep last 8 taps
          autoSceneLastTapTime: now 
        });

        // Calculate BPM if we have at least 2 taps
        if (newTapTimes.length >= 2) {
          const intervals = [];
          for (let i = 1; i < newTapTimes.length; i++) {
            intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
          }
          
          const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          const calculatedBpm = Math.round((60 * 1000) / avgInterval);
          
          // Only accept reasonable BPM values
          if (calculatedBpm >= 60 && calculatedBpm <= 200) {
            set({ autoSceneTapTempoBpm: calculatedBpm });
            console.log('Store: Calculated tap tempo BPM:', calculatedBpm);
            saveAutoSceneSettings(get());
          }
        }
      },

      triggerAutoSceneFlash: () => {
        set({ autoSceneIsFlashing: true });
        setTimeout(() => {
          set({ autoSceneIsFlashing: false });
        }, 200); // Flash for 200ms
      },

      // Legacy Autopilot Track Actions Implementation
      setAutopilotTrackEnabled: (enabled: boolean) => {
        console.log('[STORE] Setting autopilot track enabled to:', enabled);
        set({ autopilotTrackEnabled: enabled });
        
        if (enabled) {
          // Start animation when enabled
          get().startAutopilotTrackAnimation();
          // Immediately update position when enabled
          get().updatePanTiltFromTrack();
        } else {
          // Stop animation when disabled
          get().stopAutopilotTrackAnimation();
        }
      },

      setAutopilotTrackType: (type: 'circle' | 'figure8' | 'square' | 'triangle' | 'linear' | 'random' | 'custom') => {
        console.log('[STORE] Setting autopilot track type to:', type);
        set({ autopilotTrackType: type });
        
        // Trigger immediate update if enabled
        if (get().autopilotTrackEnabled) {
          get().updatePanTiltFromTrack();
        }
      },

      setAutopilotTrackPosition: (position: number) => {
        console.log('[STORE] Setting autopilot track position to:', position);
        set({ autopilotTrackPosition: position });
        
        // Trigger immediate update if enabled
        if (get().autopilotTrackEnabled) {
          get().updatePanTiltFromTrack();
        }
      },

      setAutopilotTrackSize: (size: number) => {
        console.log('[STORE] Setting autopilot track size to:', size);
        set({ autopilotTrackSize: size });
        
        // Trigger immediate update if enabled
        if (get().autopilotTrackEnabled) {
          get().updatePanTiltFromTrack();
        }
      },

      setAutopilotTrackSpeed: (speed: number) => {
        console.log('[STORE] Setting autopilot track speed to:', speed);
        set({ autopilotTrackSpeed: speed });
        
        // Speed change doesn't require immediate position update
        // Animation loop will pick up the new speed automatically
      },

      setAutopilotTrackCenter: (centerX: number, centerY: number) => {
        console.log('[STORE] Setting autopilot track center to:', centerX, centerY);
        set({ autopilotTrackCenterX: centerX, autopilotTrackCenterY: centerY });
        
        // Trigger immediate update if enabled
        if (get().autopilotTrackEnabled) {
          get().updatePanTiltFromTrack();
        }
      },

      setAutopilotTrackAutoPlay: (autoPlay: boolean) => {
        console.log('[STORE] Setting autopilot track auto-play to:', autoPlay);
        set({ autopilotTrackAutoPlay: autoPlay });
        
        // Auto-play state affects animation loop behavior
        // No immediate update needed
      },

      setAutopilotTrackCustomPoints: (points: Array<{ x: number; y: number }>) => {
        console.log('[STORE] Setting autopilot track custom points:', points);
        set({ autopilotTrackCustomPoints: points });
        
        // Trigger immediate update if enabled and using custom track
        if (get().autopilotTrackEnabled && get().autopilotTrackType === 'custom') {
          get().updatePanTiltFromTrack();
        }
      },

      calculateTrackPosition: (trackType: string, position: number, size: number, centerX: number, centerY: number) => {
        // Convert position (0-100%) to progress (0-1)
        const progress = position / 100;
        
        // Calculate radius based on size (0-100%) scaled to DMX range
        const radius = (size / 100) * 127; // Max radius is half of 255
        
        let pan = centerX;
        let tilt = centerY;
        
        switch (trackType) {
          case 'circle':
            // Full circle path
            pan = centerX + Math.cos(progress * 2 * Math.PI - Math.PI / 2) * radius;
            tilt = centerY + Math.sin(progress * 2 * Math.PI - Math.PI / 2) * radius;
            break;
            
          case 'figure8':
            // Figure-8 pattern
            pan = centerX + Math.sin(progress * 4 * Math.PI) * radius;
            tilt = centerY + Math.sin(progress * 2 * Math.PI) * radius * 0.5;
            break;
            
          case 'square':
            // Square path
            const t = progress * 4; // 0-4 for four sides
            if (t < 1) {
              // Top side (left to right)
              pan = centerX - radius + (t * 2 * radius);
              tilt = centerY - radius;
            } else if (t < 2) {
              // Right side (top to bottom)
              pan = centerX + radius;
              tilt = centerY - radius + ((t - 1) * 2 * radius);
            } else if (t < 3) {
              // Bottom side (right to left)
              pan = centerX + radius - ((t - 2) * 2 * radius);
              tilt = centerY + radius;
            } else {
              // Left side (bottom to top)
              pan = centerX - radius;
              tilt = centerY + radius - ((t - 3) * 2 * radius);
            }
            break;
            
          case 'triangle':
            // Triangle path
            const triT = progress * 3; // 0-3 for three sides
            if (triT < 1) {
              // First side
              pan = centerX - radius + (triT * radius);
              tilt = centerY + radius;
            } else if (triT < 2) {
              // Second side
              pan = centerX + ((triT - 1) * radius);
              tilt = centerY + radius - ((triT - 1) * 2 * radius);
            } else {
              // Third side
              pan = centerX + radius - ((triT - 2) * 2 * radius);
              tilt = centerY - radius + ((triT - 2) * 2 * radius);
            }
            break;
            
          case 'linear':
            // Linear back and forth
            const linearT = progress * 2; // 0-2 for back and forth
            if (linearT < 1) {
              pan = centerX - radius + (linearT * 2 * radius);
            } else {
              pan = centerX + radius - ((linearT - 1) * 2 * radius);
            }
            tilt = centerY;
            break;
            
          case 'random':
            // Random position (based on position as seed for consistency)
            const seed = Math.sin(progress * 1000) * 10000;
            pan = centerX + (Math.sin(seed) * radius);
            tilt = centerY + (Math.cos(seed) * radius);
            break;
            
          case 'custom':
            // Custom path from points
            const points = get().autopilotTrackCustomPoints || [];
            if (points.length > 0) {
              const pointIndex = progress * (points.length - 1);
              const lowerIndex = Math.floor(pointIndex);
              const upperIndex = Math.min(lowerIndex + 1, points.length - 1);
              const t = pointIndex - lowerIndex;
              
              const lowerPoint = points[lowerIndex];
              const upperPoint = points[upperIndex];
              
              pan = lowerPoint.x + (upperPoint.x - lowerPoint.x) * t;
              tilt = lowerPoint.y + (upperPoint.y - lowerPoint.y) * t;
            }
            break;
            
          default:
            // Default to center position
            break;
        }
        
        // Clamp to DMX range
        pan = Math.max(0, Math.min(255, Math.round(pan)));
        tilt = Math.max(0, Math.min(255, Math.round(tilt)));
        
        return { pan, tilt };
      },

      updatePanTiltFromTrack: (position?: number) => {
        const { 
          autopilotTrackEnabled, 
          autopilotTrackType, 
          autopilotTrackPosition, 
          autopilotTrackSize, 
          autopilotTrackCenterX, 
          autopilotTrackCenterY,
          selectedFixtures,
          fixtures
        } = get();
        
        if (!autopilotTrackEnabled) {
          console.log('[STORE] updatePanTiltFromTrack: Autopilot not enabled, skipping update');
          return;
        }
        
        const currentPosition = position !== undefined ? position : autopilotTrackPosition;

        console.log(`[STORE] updatePanTiltFromTrack: Calculating position for ${selectedFixtures.length} fixtures at position ${currentPosition}`);
        
        // Calculate current track position
        const { pan, tilt } = get().calculateTrackPosition(
          autopilotTrackType,
          currentPosition,
          autopilotTrackSize,
          autopilotTrackCenterX,
          autopilotTrackCenterY
        );
        
        console.log('[STORE] updatePanTiltFromTrack: Calculated pan =', pan, ', tilt =', tilt);
        
        // Apply to selected fixtures
        const targetFixtures = selectedFixtures.length > 0 
          ? fixtures.filter(f => selectedFixtures.includes(f.id))
          : fixtures; // If no selection, apply to all fixtures
        
        const updates: Record<number, number> = {};
        
        targetFixtures.forEach(fixture => {
          const panChannel = fixture.channels.find(ch => ch.type.toLowerCase() === 'pan');
          const tiltChannel = fixture.channels.find(ch => ch.type.toLowerCase() === 'tilt');
          
          if (panChannel && tiltChannel) {
            // Calculate DMX addresses
            const panChannelIndex = fixture.channels.indexOf(panChannel);
            const tiltChannelIndex = fixture.channels.indexOf(tiltChannel);
            
            const panDmxAddress = (fixture.startAddress || 1) + panChannelIndex - 1; // Convert to 0-based
            const tiltDmxAddress = (fixture.startAddress || 1) + tiltChannelIndex - 1; // Convert to 0-based
            
            // Add to batch update
            updates[panDmxAddress] = pan;
            updates[tiltDmxAddress] = tilt;
            
            console.log(`[STORE] updatePanTiltFromTrack: Fixture ${fixture.name}: Pan CH${panDmxAddress + 1}=${pan}, Tilt CH${tiltDmxAddress + 1}=${tilt}`);
          }
        });
        
        // Apply all updates at once
        if (Object.keys(updates).length > 0) {
          console.log('[STORE] updatePanTiltFromTrack: Applying', Object.keys(updates).length, 'channel updates');
          get().setMultipleDmxChannels(updates);
        } else {
          console.warn('[STORE] updatePanTiltFromTrack: No pan/tilt channels found in target fixtures');
        }
      },

      // Debug function to check autopilot state
      debugAutopilotState: () => {
        const state = get();
        console.group('🔍 AUTOPILOT DEBUG STATE');
        
        console.log('=== Main Autopilot System ===');
        console.log('Update Interval:', state.autopilotUpdateInterval ? 'Running' : 'Stopped');
        console.log('Last Update:', new Date(state.lastAutopilotUpdate).toLocaleTimeString());
        
        console.log('=== Pan/Tilt Autopilot ===');
        console.log('Enabled:', state.panTiltAutopilot.enabled);
        console.log('Path Type:', state.panTiltAutopilot.pathType);
        console.log('Speed:', state.panTiltAutopilot.speed);
        console.log('Center X/Y:', state.panTiltAutopilot.centerX, state.panTiltAutopilot.centerY);
        console.log('Size:', state.panTiltAutopilot.size);
        console.log('Sync to BPM:', state.panTiltAutopilot.syncToBPM);
        console.log('Phase:', state.panTiltAutopilot.phase);
        
        console.log('=== Color Autopilot ===');
        console.log('Enabled:', state.colorSliderAutopilot.enabled);
        console.log('Type:', state.colorSliderAutopilot.type);
        console.log('Speed:', state.colorSliderAutopilot.speed);
        console.log('Range:', state.colorSliderAutopilot.range);
        console.log('Sync to BPM:', state.colorSliderAutopilot.syncToBPM);
        
        console.log('=== Track Autopilot ===');
        console.log('Enabled:', state.autopilotTrackEnabled);
        console.log('Auto Play:', state.autopilotTrackAutoPlay);
        console.log('Type:', state.autopilotTrackType);
        console.log('Position:', state.autopilotTrackPosition + '%');
        console.log('Size:', state.autopilotTrackSize + '%');
        console.log('Center X/Y:', state.autopilotTrackCenterX, state.autopilotTrackCenterY);
        console.log('Speed:', state.autopilotTrackSpeed);
        console.log('Animation ID:', state.autopilotTrackAnimationId);
        
        console.log('=== Channel Autopilots ===');
        console.log('Count:', Object.keys(state.channelAutopilots).length);
        Object.entries(state.channelAutopilots).forEach(([channel, config]) => {
          console.log(`Channel ${parseInt(channel) + 1}:`, config);
        });
        
        console.log('=== System State ===');
        console.log('BPM:', state.bpm);
        console.log('Selected Fixtures:', state.selectedFixtures.length);
        console.log('Total Fixtures:', state.fixtures.length);
        
        console.groupEnd();
      },

      // Notification Actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          ...notification
        };
        
        set(state => ({
          notifications: [...state.notifications, newNotification]
        }));
      },

      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },
    })
  )
);

// Helper function for HSV to RGB conversion
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = (v / 100) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = (v / 100) - c;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}
