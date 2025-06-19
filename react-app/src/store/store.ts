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
  type: 'slider' | 'xypad';       // Control type: slider for single channel, xypad for pan/tilt combined
  label: string;                  // Display label for the control (e.g., could be same as channelNameInFixture or custom)
  xOffset: number;                // X position relative to the fixture icon's center
  yOffset: number;                // Y position relative to the fixture icon's center
  currentValue: number;           // Current value of this control (0-255), for sliders only
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
  midiMapping?: MidiMapping; // Re-use existing MidiMapping type
}

// Timeline Sequence Management
export interface TimelineKeyframe {
  time: number; // milliseconds from start
  value: number; // 0-255
  curve: 'linear' | 'smooth' | 'step' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  // For bezier curves
  controlPoint1?: { x: number; y: number };
  controlPoint2?: { x: number; y: number };
}

export interface TimelineSequence {
  id: string;
  name: string;
  description?: string;
  duration: number; // Total duration in milliseconds
  channels: Array<{
    channel: number;
    keyframes: TimelineKeyframe[];
  }>;
  tags?: string[];
  createdAt: number;
  modifiedAt: number;
}

export interface TimelinePreset {
  id: string;
  name: string;
  description: string;
  generator: (duration: number, amplitude?: number, frequency?: number, phase?: number) => TimelineKeyframe[];
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
  
  // Scenes
  scenes: Scene[]
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

  // Autopilot Track System State
  autopilotTrackEnabled: boolean;
  autopilotTrackType: 'circle' | 'figure8' | 'square' | 'triangle' | 'linear' | 'random' | 'custom';
  autopilotTrackPosition: number; // 0-100, position along the track
  autopilotTrackSize: number; // 0-100, size/scale of the track
  autopilotTrackSpeed: number; // 0-100, speed of automatic movement (when auto-playing)
  autopilotTrackCenterX: number; // 0-255, center point X for the track
  autopilotTrackCenterY: number; // 0-255, center point Y for the track
  autopilotTrackAutoPlay: boolean; // Auto-advance along track  autopilotTrackCustomPoints: Array<{ x: number; y: number }>; // Custom track points

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

  // Timeline Sequence Management
  timelineSequences: TimelineSequence[];
  activeTimelineSequence: string | null; // Currently loaded/selected sequence
  timelineEditMode: boolean;
  timelinePresets: TimelinePreset[];      timelinePlayback: {
        active: boolean;
        sequenceId: string | null;
        startTime: number | null;
        position: number; // 0-1
        loop: boolean;
        speed: number;
        direction: 'forward' | 'reverse';
        pingPong: boolean;
      };
  
  // Timeline MIDI Control Mappings
  timelineMidiMappings: Record<string, MidiMapping>; // sequenceId -> MidiMapping
  timelineControlMidiMappings: Record<'play' | 'loop' | 'bounce' | 'reverse', MidiMapping>; // control type -> MidiMapping

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

  // Fixture Selection Actions
  selectNextFixture: () => void
  selectPreviousFixture: () => void
  selectAllFixtures: () => void
  selectFixturesByType: (channelType: string) => void
  selectFixtureGroup: (groupId: string) => void
  setSelectedFixtures: (fixtureIds: string[]) => void
  toggleFixtureSelection: (fixtureId: string) => void
  deselectAllFixtures: () => void
  
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
  
  // Scene Actions
  saveScene: (name: string, oscAddress: string) => void
  loadScene: (name: string) => void
  deleteScene: (name: string) => void
  updateScene: (originalName: string, updates: Partial<Scene>) => void; // New action for updating scenes
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

  // Autopilot Track Actions
  setAutopilotTrackEnabled: (enabled: boolean) => void;
  setAutopilotTrackType: (type: 'circle' | 'figure8' | 'square' | 'triangle' | 'linear' | 'random' | 'custom') => void;
  setAutopilotTrackPosition: (position: number) => void;
  setAutopilotTrackSize: (size: number) => void;
  setAutopilotTrackSpeed: (speed: number) => void;
  setAutopilotTrackCenter: (centerX: number, centerY: number) => void;
  setAutopilotTrackAutoPlay: (autoPlay: boolean) => void;
  setAutopilotTrackCustomPoints: (points: Array<{ x: number; y: number }>) => void;  calculateTrackPosition: (trackType: string, position: number, size: number, centerX: number, centerY: number) => { pan: number; tilt: number };
  updatePanTiltFromTrack: () => void;

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
  setSmoothDmxUpdateRate: (rate: number) => void;
  setSmoothDmxThreshold: (threshold: number) => void;
  setSmoothDmxChannelValue: (channel: number, value: number) => void;  flushSmoothDmxUpdates: () => void;
  enableSmoothDmxMode: () => void;
  disableSmoothDmxMode: () => void;
  // Timeline Sequence Management
  saveTimelineSequence: (name: string, description?: string) => string; // Returns sequence ID
  loadTimelineSequence: (sequenceId: string) => void;
  deleteTimelineSequence: (sequenceId: string) => void;
  updateTimelineSequence: (sequenceId: string, updates: Partial<TimelineSequence>) => void;
  exportTimelineSequence: (sequenceId: string) => void;
  importTimelineSequence: (sequenceData: TimelineSequence) => void;
  smoothTimelineSequence: (sequenceId: string, smoothingFactor: number) => void;
  playTimelineSequence: (sequenceId: string, options?: {
    loop?: boolean;
    speed?: number;
    direction?: 'forward' | 'reverse';
    pingPong?: boolean;
  }) => void;
  stopTimelinePlayback: () => void;
  setTimelineLooping: (loop: boolean) => void;
  setTimelineSpeed: (speed: number) => void;
  setTimelineDirection: (direction: 'forward' | 'reverse') => void;
  setTimelinePingPong: (enabled: boolean) => void;
  generateTimelinePresets: () => void;
  createTimelineFromPreset: (presetId: string, channels: number[], duration: number, amplitude?: number, frequency?: number, phase?: number) => void;
  
  // Timeline MIDI Control Functions
  setTimelineMidiTrigger: (sequenceId: string, mapping?: MidiMapping) => void;
  triggerTimelineFromMidi: (midiChannel: number, note?: number, controller?: number) => void;
  clearTimelineMidiMappings: () => void;
  
  // Timeline Playback Control MIDI Functions
  setTimelineControlMidiMapping: (controlType: 'play' | 'loop' | 'bounce' | 'reverse', mapping?: MidiMapping) => void;
  triggerTimelineControlFromMidi: (midiChannel: number, note?: number, controller?: number) => void;
  clearTimelineControlMidiMappings: () => void;
  
  // Automation Functions (stub implementations)
  setAutomationPlaybackMode: (mode: 'forward' | 'reverse' | 'ping-pong') => void;
  setAutomationLoop: (loop: boolean) => void;
  setAutomationSpeed: (speed: number) => void;
  reverseAutomationDirection: () => void;
  playRecordingTimeline: () => void;
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
    return { sparklesEnabled: true };  }
};

// Helper function to interpolate between keyframes
const interpolateKeyframes = (keyframes: Array<{ time: number; value: number; curve: string }>, currentTime: number): number | null => {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return keyframes[0].value;
  
  // Find surrounding keyframes
  let prevKeyframe = keyframes[0];
  let nextKeyframe = keyframes[keyframes.length - 1];
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
      prevKeyframe = keyframes[i];
      nextKeyframe = keyframes[i + 1];
      break;
    }
  }
  
  // Handle edge cases
  if (currentTime <= prevKeyframe.time) return prevKeyframe.value;
  if (currentTime >= nextKeyframe.time) return nextKeyframe.value;
  
  // Calculate interpolation factor
  const timeDiff = nextKeyframe.time - prevKeyframe.time;
  if (timeDiff === 0) return prevKeyframe.value;
  
  const t = (currentTime - prevKeyframe.time) / timeDiff;
  const valueDiff = nextKeyframe.value - prevKeyframe.value;
  
  // Apply curve
  let easedT = t;
  switch (prevKeyframe.curve) {
    case 'step':
      easedT = 0; // Use previous value until next keyframe
      break;
    case 'ease-in':
      easedT = t * t;
      break;
    case 'ease-out':
      easedT = 1 - (1 - t) * (1 - t);
      break;
    case 'ease-in-out':
      easedT = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      break;
    case 'smooth':
      easedT = t * t * (3 - 2 * t); // Smoothstep
      break;
    case 'linear':
    default:
      easedT = t;
      break;
  }
  
  return prevKeyframe.value + valueDiff * easedT;
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
      midiActivity: 0, // Default MIDI activity level
      
      // Audio/BPM State defaults
      bpm: 120, // Default BPM
      isPlaying: false, // Default not playing

      fixtures: [],
      groups: [],
      selectedFixtures: [], // Array of fixture IDs for selection
      
      scenes: [],
      
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
          autoSceneTempoSource: savedSettings.autoSceneTempoSource ?? 'tap_tempo',          autoSceneIsFlashing: false, // Initial flashing state
        };
      })(),

      // Autopilot Track System Initial State
      autopilotTrackEnabled: false,
      autopilotTrackType: 'circle',
      autopilotTrackPosition: 0,
      autopilotTrackSize: 50,
      autopilotTrackSpeed: 50,
      autopilotTrackCenterX: 127,
      autopilotTrackCenterY: 127,      autopilotTrackAutoPlay: false,
      autopilotTrackCustomPoints: [],

      // Recording and Automation System Initial State
      recordingActive: false,
      recordingStartTime: null,
      recordingData: [],
      automationTracks: [],
      automationPlayback: {
        active: false,
        startTime: null,
        duration: 10000, // Default 10 seconds        position: 0
      },      // Smooth DMX Output System Initial State  
      smoothDmxEnabled: true, // Enable by default for better performance
      smoothDmxUpdateRate: 30, // 30 FPS update rate
      smoothDmxThreshold: 1, // Minimum change of 1 DMX unit
      pendingSmoothUpdates: {},
      lastSmoothUpdateTime: 0,

      // Timeline Sequence Management Initial State
      timelineSequences: [],
      activeTimelineSequence: null,
      timelineEditMode: false,
      timelinePresets: [],
      timelinePlayback: {
        active: false,
        sequenceId: null,
        startTime: null,
        position: 0,
        loop: false,
        speed: 1,
        direction: 'forward',
        pingPong: false,
      },
      
      // Timeline MIDI Control Mappings Initial State
      timelineMidiMappings: {},
      timelineControlMidiMappings: {} as Record<'play' | 'loop' | 'bounce' | 'reverse', MidiMapping>,
      
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
        console.log(`[STORE] setDmxChannel called: channel=${channel}, value=${value}`);
        const dmxChannels = [...get().dmxChannels]
        dmxChannels[channel] = value
        set({ dmxChannels })
        
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
      },

      setMultipleDmxChannels: (updates) => {
        console.log('[STORE] setMultipleDmxChannels: Called with updates batch:', updates);
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

      // UI Settings Actions
      updateUiSettings: (settings: Partial<{ sparklesEnabled: boolean }>) => {
        const currentUiSettings = get().uiSettings;
        const updatedUiSettings = { ...currentUiSettings, ...settings };
        set({ uiSettings: updatedUiSettings });
        
        // Save to localStorage for persistence
        localStorage.setItem('uiSettings', JSON.stringify(updatedUiSettings));
        
        get().addNotification({ 
          message: `UI settings updated`, 
          type: 'success' 
        });
      },

      toggleSparkles: () => {
        const currentEnabled = get().uiSettings.sparklesEnabled;
        const newEnabled = !currentEnabled;
        
        get().updateUiSettings({ sparklesEnabled: newEnabled });
        
        get().addNotification({ 
          message: `Sparkles effect ${newEnabled ? 'enabled' : 'disabled'}`, 
          type: 'info' 
        });
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
      setBpm: (bpm: number) => set({ bpm }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setMidiActivity: (activity: number) => set({ midiActivity: activity }),
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
      },      // Auto-Scene Actions
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
      if (interval > 0 && interval < 2000) // Ignore taps too close or too far apart (2s = 30 BPM)
        newTapTimes.push(interval);
      if (newTapTimes.length > 5) // Keep last 5 intervals for averaging
        newTapTimes.shift();
    } else // If interval is too long, reset taps
      newTapTimes = [];

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
        }, 200);      },

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
      },      // Autopilot Track Actions
      setAutopilotTrackEnabled: (enabled) => {
        set({ autopilotTrackEnabled: enabled });
      },

      setAutopilotTrackType: (type) => {
        set({ autopilotTrackType: type });
      },      setAutopilotTrackPosition: (position) => {
        console.log(`[STORE] setAutopilotTrackPosition: Setting position to ${position.toFixed(2)}`);
        set({ autopilotTrackPosition: position });
        // Automatically update pan/tilt when position changes
        console.log('[STORE] setAutopilotTrackPosition: Calling updatePanTiltFromTrack()');
        get().updatePanTiltFromTrack();
      },

      setAutopilotTrackSize: (size) => {
        set({ autopilotTrackSize: size });
      },

      setAutopilotTrackSpeed: (speed) => {
        set({ autopilotTrackSpeed: speed });
      },

      setAutopilotTrackCenter: (centerX, centerY) => {
        set({ 
          autopilotTrackCenterX: centerX,
          autopilotTrackCenterY: centerY 
        });
      },

      setAutopilotTrackAutoPlay: (autoPlay) => {
        set({ autopilotTrackAutoPlay: autoPlay });
      },

      setAutopilotTrackCustomPoints: (points) => {
        set({ autopilotTrackCustomPoints: points });
      },

      calculateTrackPosition: (trackType, position, size, centerX, centerY) => {
        const normalizedPosition = position / 100; // Convert 0-100 to 0-1
        const radius = size / 100 * 127; // Convert size percentage to DMX range
        
        let x = centerX;
        let y = centerY;
        
        switch (trackType) {
          case 'circle':
            const angle = normalizedPosition * 2 * Math.PI;
            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle);
            break;
            
          case 'figure8':
            const t = normalizedPosition * 2 * Math.PI;
            x = centerX + radius * Math.sin(t);
            y = centerY + radius * Math.sin(t) * Math.cos(t);
            break;
            
          case 'square':
            const side = Math.floor(normalizedPosition * 4);
            const sidePosition = (normalizedPosition * 4) % 1;
            
            switch (side) {
              case 0: // Top
                x = centerX - radius + sidePosition * 2 * radius;
                y = centerY + radius;
                break;
              case 1: // Right
                x = centerX + radius;
                y = centerY + radius - sidePosition * 2 * radius;
                break;
              case 2: // Bottom
                x = centerX + radius - sidePosition * 2 * radius;
                y = centerY - radius;
                break;
              case 3: // Left
                x = centerX - radius;
                y = centerY - radius + sidePosition * 2 * radius;
                break;
            }
            break;
            
          case 'triangle':
            const triSide = Math.floor(normalizedPosition * 3);
            const triPosition = (normalizedPosition * 3) % 1;
            const triRadius = radius * 1.15; // Slightly larger for better triangle shape
            
            switch (triSide) {
              case 0: // Bottom to top-right
                x = centerX - triRadius * 0.5 + triPosition * triRadius;
                y = centerY - triRadius * 0.3 + triPosition * triRadius * 0.866;
                break;
              case 1: // Top-right to top-left
                x = centerX + triRadius * 0.5 - triPosition * triRadius;
                y = centerY + triRadius * 0.6;
                break;
              case 2: // Top-left to bottom
                x = centerX - triRadius * 0.5 + triPosition * triRadius * 0.5;
                y = centerY + triRadius * 0.6 - triPosition * triRadius * 0.9;
                break;
            }
            break;
            
          case 'linear':
            x = centerX - radius + normalizedPosition * 2 * radius;
            y = centerY;
            break;
            
          case 'random':
            // Generate consistent random values based on position
            const seed = Math.floor(normalizedPosition * 100);
            const randomX = ((seed * 9301 + 49297) % 233280) / 233280;
            const randomY = ((seed * 9301 + 49297 + 1000) % 233280) / 233280;
            
            x = centerX + (randomX - 0.5) * 2 * radius;
            y = centerY + (randomY - 0.5) * 2 * radius;
            break;
            
          case 'custom':
            const { autopilotTrackCustomPoints } = get();
            if (autopilotTrackCustomPoints.length >= 2) {
              const totalSegments = autopilotTrackCustomPoints.length;
              const segmentIndex = Math.floor(normalizedPosition * totalSegments);
              const segmentPosition = (normalizedPosition * totalSegments) % 1;
              
              const startPoint = autopilotTrackCustomPoints[segmentIndex];
              const endPoint = autopilotTrackCustomPoints[(segmentIndex + 1) % totalSegments];
              
              x = startPoint.x + (endPoint.x - startPoint.x) * segmentPosition;
              y = startPoint.y + (endPoint.y - startPoint.y) * segmentPosition;
            }
            break;
        }
        
        // Clamp values to DMX range (0-255)
        return {
          pan: Math.max(0, Math.min(255, Math.round(x))),
          tilt: Math.max(0, Math.min(255, Math.round(y)))
        };
      },      updatePanTiltFromTrack: () => {
        console.log('[STORE] updatePanTiltFromTrack: Entered.');
        const {
          autopilotTrackEnabled,
          autopilotTrackType,
          autopilotTrackPosition,
          autopilotTrackSize,
          autopilotTrackCenterX,
          autopilotTrackCenterY,
          fixtures, // Main fixtures list
          selectedFixtures, // Array of selected fixture IDs
        } = get();

        console.log(`[STORE] updatePanTiltFromTrack: Debug - autopilotTrackEnabled=${autopilotTrackEnabled}, fixtures.length=${fixtures.length}, selectedFixtures.length=${selectedFixtures.length}`);
        console.log('[STORE] updatePanTiltFromTrack: Debug - selectedFixtures:', selectedFixtures);
        console.log('[STORE] updatePanTiltFromTrack: Debug - fixtures:', fixtures.map(f => ({ id: f.id, name: f.name, channels: f.channels.length })));

        if (!autopilotTrackEnabled) {
          console.log('[STORE] updatePanTiltFromTrack: Autopilot not enabled, exiting.');
          return;
        }

        const { pan, tilt } = get().calculateTrackPosition(
          autopilotTrackType,
          autopilotTrackPosition,
          autopilotTrackSize,
          autopilotTrackCenterX,
          autopilotTrackCenterY
        );
        console.log(`[STORE] updatePanTiltFromTrack: Calculated pan=${pan}, tilt=${tilt}`);

        const updates: DmxChannelBatchUpdate = {};
        let targetFixtures: Fixture[] = [];

        if (selectedFixtures.length > 0) {
          targetFixtures = fixtures.filter(f => selectedFixtures.includes(f.id));
        } else {
          targetFixtures = fixtures; // Default to all fixtures if no specific selection
        }
        console.log(`[STORE] updatePanTiltFromTrack: Number of targetFixtures to update: ${targetFixtures.length}`);

        if (targetFixtures.length === 0) {
          console.log('[STORE] updatePanTiltFromTrack: No target fixtures for Pan/Tilt update, exiting.');
          return;
        }        targetFixtures.forEach(fixture => {
          console.log(`[STORE] updatePanTiltFromTrack: Processing fixture "${fixture.name}" (ID: ${fixture.id})`);
          console.log(`[STORE] updatePanTiltFromTrack: Fixture channels:`, fixture.channels.map(c => ({ type: c.type, dmxAddress: c.dmxAddress })));
          
          fixture.channels.forEach(channel => {
            console.log(`[STORE] updatePanTiltFromTrack: Checking channel type "${channel.type}" with DMX address ${channel.dmxAddress}`);
            
            if (typeof channel.dmxAddress === 'number' && channel.dmxAddress >= 0 && channel.dmxAddress < 512) {
              if (channel.type.toLowerCase() === 'pan') {
                updates[channel.dmxAddress] = pan;
                console.log(`[STORE] updatePanTiltFromTrack: Set Pan channel ${channel.dmxAddress} to ${pan}`);
              } else if (channel.type.toLowerCase() === 'tilt') {
                updates[channel.dmxAddress] = tilt;
                console.log(`[STORE] updatePanTiltFromTrack: Set Tilt channel ${channel.dmxAddress} to ${tilt}`);
              }
            } else {
              console.log(`[STORE] updatePanTiltFromTrack: Skipping channel "${channel.type}" - invalid DMX address: ${channel.dmxAddress}`);
            }
          });
        });
        
        console.log('[STORE] updatePanTiltFromTrack: DMX batch updates to be applied:', updates);
        if (Object.keys(updates).length > 0) {
          get().setMultipleDmxChannels(updates);
        } else {
          console.log('[STORE] updatePanTiltFromTrack: No DMX updates to apply.');
        }
      },

      // Recording and Automation Actions
      startRecording: () => {
        const now = Date.now();
        set({ 
          recordingActive: true, 
          recordingStartTime: now, 
          recordingData: [] 
        });
        
        get().addNotification({ 
          message: 'Recording started', 
          type: 'success' 
        });
      },

      stopRecording: () => {
        set({ recordingActive: false });
        
        get().addNotification({ 
          message: 'Recording stopped', 
          type: 'info' 
        });
      },

      clearRecording: () => {
        set({ 
          recordingData: [], 
          recordingStartTime: null 
        });
        
        get().addNotification({ 
          message: 'Recording cleared', 
          type: 'info' 
        });
      },

      addRecordingEvent: (event) => {
        const { recordingActive, recordingStartTime, recordingData } = get();
        
        if (!recordingActive || !recordingStartTime) return;
        
        const timestamp = Date.now() - recordingStartTime;
        const newEvent = { ...event, timestamp };
        
        set({ recordingData: [...recordingData, newEvent] });
      },

      createAutomationTrack: (name, channel) => {
        const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTrack = {
          id: trackId,
          name,
          channel,
          keyframes: [
            { time: 0, value: 0, curve: 'linear' as const },
            { time: 5000, value: 255, curve: 'linear' as const }, // 5 second track with full range
            { time: 10000, value: 0, curve: 'linear' as const }
          ],
          enabled: true,
          loop: false
        };
        
        set(state => ({
          automationTracks: [...state.automationTracks, newTrack]
        }));
        
        get().addNotification({ 
          message: `Automation track "${name}" created`, 
          type: 'success' 
        });
        
        return trackId;
      },

      updateAutomationTrack: (trackId, updates) => {
        set(state => ({
          automationTracks: state.automationTracks.map(track =>
            track.id === trackId ? { ...track, ...updates } : track
          )
        }));
      },

      deleteAutomationTrack: (trackId) => {
        set(state => ({
          automationTracks: state.automationTracks.filter(track => track.id !== trackId)
        }));
        
        get().addNotification({ 
          message: 'Automation track deleted', 
          type: 'info' 
        });
      },

      addKeyframe: (trackId, time, value, curve = 'linear') => {
        set(state => ({
          automationTracks: state.automationTracks.map(track => {
            if (track.id === trackId) {
              const newKeyframes = [...track.keyframes, { time, value, curve }]
                .sort((a, b) => a.time - b.time); // Keep keyframes sorted by time
              return { ...track, keyframes: newKeyframes };
            }
            return track;
          })
        }));
      },

      updateKeyframe: (trackId, keyframeIndex, updates) => {
        set(state => ({
          automationTracks: state.automationTracks.map(track => {
            if (track.id === trackId) {
              const newKeyframes = track.keyframes.map((kf, index) =>
                index === keyframeIndex ? { ...kf, ...updates } : kf
              );
              return { ...track, keyframes: newKeyframes.sort((a, b) => a.time - b.time) };
            }
            return track;
          })
        }));
      },

      deleteKeyframe: (trackId, keyframeIndex) => {
        set(state => ({
          automationTracks: state.automationTracks.map(track => {
            if (track.id === trackId) {
              const newKeyframes = track.keyframes.filter((_, index) => index !== keyframeIndex);
              return { ...track, keyframes: newKeyframes };
            }
            return track;
          })
        }));
      },

      startAutomationPlayback: () => {
        const now = Date.now();
        set({ 
          automationPlayback: { 
            active: true, 
            startTime: now, 
            duration: 10000, // 10 seconds default
            position: 0 
          } 
        });
        
        // Start automation update loop
        const updateAutomation = () => {
          const { automationPlayback, automationTracks, setDmxChannelValue } = get();
          
          if (!automationPlayback.active || !automationPlayback.startTime) return;
          
          const elapsed = Date.now() - automationPlayback.startTime;
          const position = elapsed / automationPlayback.duration;
          
          // Update position
          set(state => ({
            automationPlayback: { ...state.automationPlayback, position }
          }));
          
          // Apply automation to channels
          automationTracks.forEach(track => {
            if (!track.enabled) return;
            
            const currentTime = elapsed;
            const value = interpolateKeyframes(track.keyframes, currentTime);
            
            if (value !== null) {
              setDmxChannelValue(track.channel, Math.round(value));
            }
          });
          
          // Continue if not finished
          if (position < 1) {
            requestAnimationFrame(updateAutomation);
          } else {
            // Check for looping tracks
            const loopingTracks = automationTracks.filter(t => t.loop && t.enabled);
            if (loopingTracks.length > 0) {
              // Restart for looping tracks
              set(state => ({
                automationPlayback: { 
                  ...state.automationPlayback, 
                  startTime: Date.now(),
                  position: 0 
                }
              }));
              requestAnimationFrame(updateAutomation);
            } else {
              get().stopAutomationPlayback();
            }
          }
        };
        
        requestAnimationFrame(updateAutomation);
        
        get().addNotification({ 
          message: 'Automation playback started', 
          type: 'success' 
        });
      },

      stopAutomationPlayback: () => {
        set({ 
          automationPlayback: { 
            active: false, 
            startTime: null, 
            duration: 10000,
            position: 0 
          } 
        });
        
        get().addNotification({ 
          message: 'Automation playback stopped', 
          type: 'info' 
        });
      },

      setAutomationPosition: (position) => {
        const { automationPlayback } = get();
        const newTime = position * automationPlayback.duration;
        
        set({ 
          automationPlayback: { 
            ...automationPlayback, 
            position,
            startTime: automationPlayback.active ? Date.now() - newTime : null
          } 
        });
      },

      applyAutomationPreset: (trackId, preset) => {
        const duration = 10000; // 10 seconds
        const steps = 20; // Number of keyframes
        const keyframes: Array<{ time: number; value: number; curve: 'linear' | 'smooth' }> = [];
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const time = t * duration;
          let value = 0;
          
          switch (preset) {
            case 'sine':
              value = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) * 127.5;
              break;
            case 'triangle':
              value = t < 0.5 ? t * 2 * 255 : (1 - t) * 2 * 255;
              break;
            case 'sawtooth':
              value = t * 255;
              break;
            case 'square':
              value = t < 0.5 ? 0 : 255;
              break;
            case 'random':
              value = Math.random() * 255;
              break;
          }
          
          keyframes.push({ 
            time, 
            value: Math.max(0, Math.min(255, value)), 
            curve: preset === 'random' ? 'linear' : 'smooth' 
          });
        }
        
        set(state => ({
          automationTracks: state.automationTracks.map(track =>
            track.id === trackId ? { ...track, keyframes } : track
          )
        }));
        
        get().addNotification({ 
          message: `Applied ${preset} preset to automation track`, 
          type: 'success' 
        });
      },

      // Smooth DMX Actions
      setSmoothDmxEnabled: (enabled) => {
        set({ smoothDmxEnabled: enabled });
        
        // If enabling, start the smooth update timer
        if (enabled) {
          get().enableSmoothDmxMode();
        } else {
          get().disableSmoothDmxMode();
        }
        
        get().addNotification({ 
          message: `Smooth DMX ${enabled ? 'enabled' : 'disabled'}`, 
          type: 'info' 
        });
      },

      setSmoothDmxUpdateRate: (rate) => {
        const clampedRate = Math.max(1, Math.min(60, rate)); // 1-60 FPS
        set({ smoothDmxUpdateRate: clampedRate });
        
        // Restart smooth mode if currently active
        const { smoothDmxEnabled } = get();
        if (smoothDmxEnabled) {
          get().disableSmoothDmxMode();
          get().enableSmoothDmxMode();
        }
      },

      setSmoothDmxThreshold: (threshold) => {
        const clampedThreshold = Math.max(0, Math.min(10, threshold)); // 0-10 units
        set({ smoothDmxThreshold: clampedThreshold });
      },      setSmoothDmxChannelValue: (channel, value) => {
        const { smoothDmxEnabled, smoothDmxThreshold, pendingSmoothUpdates, recordingActive } = get();
        
        if (!smoothDmxEnabled) {
          // If smooth mode is disabled, update immediately
          get().setDmxChannelValue(channel, value);
          return;
        }
        
        // Check if change is significant enough
        const currentValue = get().getDmxChannelValue(channel);
        const change = Math.abs(value - currentValue);
        
        if (change < smoothDmxThreshold) {
          return; // Change too small, ignore
        }
        
        // Record the change if recording is active - BEFORE adding to pending updates
        if (recordingActive) {
          get().addRecordingEvent({
            type: 'dmx',
            channel,
            value
          });
        }
        
        // Add to pending updates
        set(state => ({
          pendingSmoothUpdates: {
            ...state.pendingSmoothUpdates,
            [channel]: value
          }
        }));
      },

      flushSmoothDmxUpdates: () => {
        const { pendingSmoothUpdates } = get();
        const updates = Object.keys(pendingSmoothUpdates);
        
        if (updates.length === 0) return;
        
        // Batch update all pending channels
        const batchUpdates: { [key: number]: number } = {};
        updates.forEach(channelStr => {
          const channel = parseInt(channelStr);
          batchUpdates[channel] = pendingSmoothUpdates[channel];
        });
        
        // Clear pending updates and apply batch
        set({ 
          pendingSmoothUpdates: {},
          lastSmoothUpdateTime: Date.now()
        });
        
        get().setMultipleDmxChannels(batchUpdates);
      },

      enableSmoothDmxMode: () => {
        const { smoothDmxUpdateRate } = get();
        const updateInterval = 1000 / smoothDmxUpdateRate; // Convert FPS to milliseconds
        
        // Create smooth update loop
        const smoothUpdateLoop = () => {
          const { smoothDmxEnabled } = get();
          
          if (!smoothDmxEnabled) return; // Stop if disabled
          
          get().flushSmoothDmxUpdates();
          
          setTimeout(smoothUpdateLoop, updateInterval);
        };
        
        // Start the loop
        smoothUpdateLoop();
        
        console.log(`Smooth DMX mode enabled at ${smoothDmxUpdateRate} FPS`);
      },

      disableSmoothDmxMode: () => {
        // Flush any remaining updates
        get().flushSmoothDmxUpdates();
        console.log('Smooth DMX mode disabled');
      },

      // Timeline Sequence Management Actions
      saveTimelineSequence: (name, description) => {
        const { recordingData } = get();
        
        if (recordingData.length === 0) {
          console.warn('No recording data to save as timeline sequence');
          return '';
        }

        const sequenceId = `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const maxTime = Math.max(...recordingData.map(e => e.timestamp));
        
        // Group events by channel
        const channelGroups: { [channel: number]: TimelineKeyframe[] } = {};
        
        recordingData
          .filter(event => event.type === 'dmx' && event.channel !== undefined && event.value !== undefined)
          .forEach(event => {
            const channel = event.channel!;
            const keyframe: TimelineKeyframe = {
              time: event.timestamp,
              value: event.value!,
              curve: 'smooth'
            };
            
            if (!channelGroups[channel]) {
              channelGroups[channel] = [];
            }
            channelGroups[channel].push(keyframe);
          });

        const newSequence: TimelineSequence = {
          id: sequenceId,
          name,
          description: description || `Recorded sequence with ${recordingData.length} events`,
          duration: maxTime,
          channels: Object.entries(channelGroups).map(([channel, keyframes]) => ({
            channel: parseInt(channel),
            keyframes: keyframes.sort((a, b) => a.time - b.time)
          })),
          tags: ['recorded'],
          createdAt: Date.now(),
          modifiedAt: Date.now()
        };

        set(state => ({
          timelineSequences: [...state.timelineSequences, newSequence],
          activeTimelineSequence: sequenceId
        }));

        console.log(`Timeline sequence "${name}" saved with ID: ${sequenceId}`);
        return sequenceId;
      },

      loadTimelineSequence: (sequenceId) => {
        const { timelineSequences } = get();
        const sequence = timelineSequences.find(s => s.id === sequenceId);
        
        if (!sequence) {
          console.error(`Timeline sequence with ID ${sequenceId} not found`);
          return;
        }

        set({ activeTimelineSequence: sequenceId });
        console.log(`Timeline sequence "${sequence.name}" loaded`);
      },

      deleteTimelineSequence: (sequenceId) => {
        set(state => ({
          timelineSequences: state.timelineSequences.filter(s => s.id !== sequenceId),
          activeTimelineSequence: state.activeTimelineSequence === sequenceId ? null : state.activeTimelineSequence
        }));
        console.log(`Timeline sequence ${sequenceId} deleted`);
      },

      updateTimelineSequence: (sequenceId, updates) => {
        set(state => ({
          timelineSequences: state.timelineSequences.map(s => 
            s.id === sequenceId 
              ? { ...s, ...updates, modifiedAt: Date.now() }
              : s
          )
        }));
      },

      // Timeline Export/Import Actions
      exportTimelineSequence: (sequenceId) => {
        const { timelineSequences } = get();
        const sequence = timelineSequences.find(s => s.id === sequenceId);
        
        if (!sequence) {
          console.error(`Timeline sequence with ID ${sequenceId} not found for export`);
          return;
        }

        const exportData = {
          version: '1.0',
          type: 'artbastard-timeline-sequence',
          exported: Date.now(),
          sequence
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sequence.name.replace(/[^a-z0-9]/gi, '_')}_timeline.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Timeline sequence "${sequence.name}" exported`);
      },

      importTimelineSequence: (sequenceData) => {
        // Generate new ID to avoid conflicts
        const newId = `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const importedSequence: TimelineSequence = {
          ...sequenceData,
          id: newId,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          name: `${sequenceData.name} (Imported)`
        };

        set(state => ({
          timelineSequences: [...state.timelineSequences, importedSequence],
          activeTimelineSequence: newId
        }));

        console.log(`Timeline sequence "${importedSequence.name}" imported with ID: ${newId}`);
      },

      // Timeline Smoothing Action
      smoothTimelineSequence: (sequenceId, smoothingFactor) => {
        const { timelineSequences } = get();
        const sequence = timelineSequences.find(s => s.id === sequenceId);
        
        if (!sequence) {
          console.error(`Timeline sequence with ID ${sequenceId} not found for smoothing`);
          return;
        }

        const smoothedChannels = sequence.channels.map(channel => {
          if (channel.keyframes.length < 3) {
            return channel; // Not enough keyframes to smooth
          }

          const smoothedKeyframes = channel.keyframes.map((keyframe, index) => {
            if (index === 0 || index === channel.keyframes.length - 1) {
              return keyframe; // Don't smooth first or last keyframe
            }

            const prevKeyframe = channel.keyframes[index - 1];
            const nextKeyframe = channel.keyframes[index + 1];
            
            // Apply smoothing using weighted average
            const weight = smoothingFactor; // 0 = no smoothing, 1 = full smoothing
            const smoothedValue = 
              keyframe.value * (1 - weight) + 
              ((prevKeyframe.value + nextKeyframe.value) / 2) * weight;

            return {
              ...keyframe,
              value: Math.max(0, Math.min(255, Math.round(smoothedValue))),
              curve: 'smooth' as const
            };
          });

          return {
            ...channel,
            keyframes: smoothedKeyframes
          };
        });

        const smoothedSequence: TimelineSequence = {
          ...sequence,
          channels: smoothedChannels,
          modifiedAt: Date.now()
        };

        set(state => ({
          timelineSequences: state.timelineSequences.map(s => 
            s.id === sequenceId ? smoothedSequence : s
          )
        }));

        console.log(`Timeline sequence "${sequence.name}" smoothed with factor ${smoothingFactor}`);
      },

      // Timeline Playback Actions
      playTimelineSequence: (sequenceId, options = {}) => {
        const { timelineSequences } = get();
        const sequence = timelineSequences.find(s => s.id === sequenceId);
        
        if (!sequence) {
          console.error(`Timeline sequence with ID ${sequenceId} not found for playback`);
          return;
        }

        // Stop any existing playback
        get().stopTimelinePlayback();

        const startTime = Date.now();
        set({
          timelinePlayback: {
            active: true,
            sequenceId,
            startTime,
            position: 0,
            loop: options.loop || false,
            speed: options.speed || 1,
            direction: options.direction || 'forward',
            pingPong: options.pingPong || false,
          },
        });

        // Start playback loop
        const playbackInterval = setInterval(() => {
          const state = get();
          if (!state.timelinePlayback.active || state.timelinePlayback.sequenceId !== sequenceId) {
            clearInterval(playbackInterval);
            return;
          }

          const elapsed = Date.now() - state.timelinePlayback.startTime!;
          const position = elapsed / sequence.duration;

          if (position >= 1) {
            if (state.timelinePlayback.loop) {
              // Restart sequence
              set(state => ({
                timelinePlayback: {
                  ...state.timelinePlayback,
                  startTime: Date.now(),
                  position: 0
                }
              }));
            } else {
              // Stop playback
              get().stopTimelinePlayback();
              clearInterval(playbackInterval);
              return;
            }
          } else {
            set(state => ({
              timelinePlayback: {
                ...state.timelinePlayback,
                position
              }
            }));
          }

          // Apply DMX values from timeline
          sequence.channels.forEach(channel => {
            const value = interpolateKeyframes(channel.keyframes, elapsed);
            if (value !== null) {
              state.setDmxChannel(channel.channel, value);
            }
          });
        }, 16); // ~60fps

        console.log(`Timeline sequence "${sequence.name}" started playback`);
      },

      stopTimelinePlayback: () => {
        set({
          timelinePlayback: {
            active: false,
            sequenceId: null,
            startTime: null,
            position: 0,
            loop: false,
            speed: 1,
            direction: 'forward',
            pingPong: false,
          }
        });
        console.log('Timeline playback stopped');
      },

      // Timeline Control Functions
      setTimelineLooping: (loop: boolean) => {
        set(state => ({
          timelinePlayback: {
            ...state.timelinePlayback,
            loop
          }
        }));
      },

      setTimelineSpeed: (speed: number) => {
        set(state => ({
          timelinePlayback: {
            ...state.timelinePlayback,
            speed
          }
        }));
      },

      setTimelineDirection: (direction: 'forward' | 'reverse') => {
        set(state => ({
          timelinePlayback: {
            ...state.timelinePlayback,
            direction
          }
        }));
      },

      setTimelinePingPong: (enabled: boolean) => {
        set(state => ({
          timelinePlayback: {
            ...state.timelinePlayback,
            pingPong: enabled
          }
        }));
      },

      // Timeline Preset Generation
      generateTimelinePresets: () => {
        const presets: TimelinePreset[] = [
          {
            id: 'sine',
            name: 'Sine Wave',
            description: 'Smooth sine wave pattern',
            generator: (duration, amplitude = 255, frequency = 1, phase = 0) => {
              const keyframes: TimelineKeyframe[] = [];
              const steps = Math.max(10, Math.floor(duration / 100));
              
              for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * duration;
                const radians = (2 * Math.PI * frequency * t / duration) + (phase * Math.PI / 180);
                const value = Math.round((Math.sin(radians) + 1) * (amplitude / 2));
                
                keyframes.push({
                  time: t,
                  value: Math.max(0, Math.min(255, value)),
                  curve: 'smooth'
                });
              }
              
              return keyframes;
            }
          },
          {
            id: 'square',
            name: 'Square Wave',
            description: 'Sharp on/off square wave pattern',
            generator: (duration, amplitude = 255, frequency = 1, phase = 0) => {
              const keyframes: TimelineKeyframe[] = [];
              const period = duration / frequency;
              const phaseOffset = (phase / 360) * period;
              
              for (let cycle = 0; cycle < frequency; cycle++) {
                const cycleStart = cycle * period + phaseOffset;
                const cycleHalf = cycleStart + period / 2;
                const cycleEnd = cycleStart + period;
                
                if (cycleStart >= 0 && cycleStart <= duration) {
                  keyframes.push({ time: cycleStart, value: amplitude, curve: 'step' });
                }
                if (cycleHalf >= 0 && cycleHalf <= duration) {
                  keyframes.push({ time: cycleHalf, value: 0, curve: 'step' });
                }
                if (cycleEnd >= 0 && cycleEnd <= duration) {
                  keyframes.push({ time: cycleEnd, value: amplitude, curve: 'step' });
                }
              }
              
              return keyframes.sort((a, b) => a.time - b.time);
            }
          },
          {
            id: 'eclipse',
            name: 'Eclipse Curve',
            description: 'Smooth fade in and out like an eclipse',
            generator: (duration, amplitude = 255) => {
              const keyframes: TimelineKeyframe[] = [];
              const steps = Math.max(20, Math.floor(duration / 50));
              
              for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * duration;
                const normalizedTime = (t / duration) * 2 - 1; // -1 to 1
                const value = Math.round(amplitude * Math.max(0, 1 - normalizedTime * normalizedTime));
                
                keyframes.push({
                  time: t,
                  value: Math.max(0, Math.min(255, value)),
                  curve: 'smooth'
                });
              }
              
              return keyframes;
            }
          },
          {
            id: 'soft-in',
            name: 'Soft In',
            description: 'Gentle fade in from 0 to full',
            generator: (duration, amplitude = 255) => {
              const keyframes: TimelineKeyframe[] = [];
              const steps = Math.max(10, Math.floor(duration / 100));
              
              for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * duration;
                const progress = t / duration;
                const value = Math.round(amplitude * progress * progress); // Quadratic ease-in
                
                keyframes.push({
                  time: t,
                  value: Math.max(0, Math.min(255, value)),
                  curve: 'ease-in'
                });
              }
              
              return keyframes;
            }
          },
          {
            id: 'soft-out',
            name: 'Soft Out',
            description: 'Gentle fade out from full to 0',
            generator: (duration, amplitude = 255) => {
              const keyframes: TimelineKeyframe[] = [];
              const steps = Math.max(10, Math.floor(duration / 100));
              
              for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * duration;
                const progress = 1 - (t / duration);
                const value = Math.round(amplitude * progress * progress); // Quadratic ease-out
                
                keyframes.push({
                  time: t,
                  value: Math.max(0, Math.min(255, value)),
                  curve: 'ease-out'
                });
              }
              
              return keyframes;
            }
          }
        ];

        set({ timelinePresets: presets });
        console.log('Timeline presets generated');
      },

      createTimelineFromPreset: (presetId, channels, duration, amplitude = 255, frequency = 1, phase = 0) => {
        const { timelinePresets } = get();
        const preset = timelinePresets.find(p => p.id === presetId);
        
        if (!preset) {
          console.error(`Timeline preset with ID ${presetId} not found`);
          return;
        }

        const sequenceId = `preset-${presetId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const keyframes = preset.generator(duration, amplitude, frequency, phase);
        
        const newSequence: TimelineSequence = {
          id: sequenceId,
          name: `${preset.name} (${channels.join(',')})`,
          description: `Generated from ${preset.name} preset`,
          duration,
          channels: channels.map(channel => ({
            channel,
            keyframes: [...keyframes]
          })),
          tags: ['preset', presetId],
          createdAt: Date.now(),
          modifiedAt: Date.now()
        };

        set(state => ({
          timelineSequences: [...state.timelineSequences, newSequence],
          activeTimelineSequence: sequenceId
        }));

        console.log(`Timeline sequence "${newSequence.name}" created from preset "${preset.name}"`);
      },

      // Timeline MIDI Control Functions
      setTimelineMidiTrigger: (sequenceId, mapping) => {
        if (mapping) {
          set(state => ({
            timelineMidiMappings: {
              ...state.timelineMidiMappings,
              [sequenceId]: mapping
            }
          }));
          get().addNotification({ 
            message: `MIDI trigger assigned to timeline sequence`, 
            type: 'success' 
          });
        } else {
          // Remove mapping
          set(state => {
            const newMappings = { ...state.timelineMidiMappings };
            delete newMappings[sequenceId];
            return { timelineMidiMappings: newMappings };
          });
          get().addNotification({ 
            message: `MIDI trigger removed from timeline sequence`, 
            type: 'info' 
          });
        }
      },

      triggerTimelineFromMidi: (midiChannel, note, controller) => {
        const { timelineMidiMappings, timelineSequences } = get();
        
        // Find matching timeline sequence
        const matchingSequenceId = Object.keys(timelineMidiMappings).find(sequenceId => {
          const mapping = timelineMidiMappings[sequenceId];
          return mapping.channel === midiChannel && 
                 ((note !== undefined && mapping.note === note) ||
                  (controller !== undefined && mapping.controller === controller));
        });

        if (matchingSequenceId) {
          const sequence = timelineSequences.find(s => s.id === matchingSequenceId);
          if (sequence) {
            // Toggle playback - if already playing this sequence, stop it; otherwise start it
            const { timelinePlayback } = get();
            if (timelinePlayback.active && timelinePlayback.sequenceId === matchingSequenceId) {
              get().stopTimelinePlayback();
              get().addNotification({ 
                message: `Timeline "${sequence.name}" stopped via MIDI`, 
                type: 'info' 
              });
            } else {
              get().playTimelineSequence(matchingSequenceId);
              get().addNotification({ 
                message: `Timeline "${sequence.name}" triggered via MIDI`, 
                type: 'success' 
              });
            }
          }
        }
      },

      clearTimelineMidiMappings: () => {
        set({ timelineMidiMappings: {} });
        get().addNotification({ 
          message: 'All timeline MIDI mappings cleared', 
          type: 'info' 
        });
      },

      // Timeline Playback Control MIDI Functions
      setTimelineControlMidiMapping: (controlType, mapping) => {
        if (mapping) {
          set(state => ({
            timelineControlMidiMappings: {
              ...state.timelineControlMidiMappings,
              [controlType]: mapping
            }
          }));
          get().addNotification({ 
            message: `MIDI mapping assigned to ${controlType} control`, 
            type: 'success' 
          });
        } else {
          // Remove mapping
          set(state => {
            const newMappings = { ...state.timelineControlMidiMappings };
            delete newMappings[controlType];
            return { timelineControlMidiMappings: newMappings };
          });
          get().addNotification({ 
            message: `MIDI mapping removed from ${controlType} control`, 
            type: 'info' 
          });
        }
      },

      triggerTimelineControlFromMidi: (midiChannel, note, controller) => {
        const { timelineControlMidiMappings, timelinePlayback } = get();
        
        // Find matching control mapping
        const matchingEntry = Object.entries(timelineControlMidiMappings).find(([, mapping]) => {
          const midiMapping = mapping as MidiMapping;
          return midiMapping.channel === midiChannel && 
                 ((note !== undefined && midiMapping.note === note) ||
                  (controller !== undefined && midiMapping.controller === controller));
        });

        if (matchingEntry) {
          const [controlType] = matchingEntry;

          switch (controlType) {
            case 'play':
              if (timelinePlayback.active) {
                get().stopTimelinePlayback();
                get().addNotification({ 
                  message: `Playback stopped via MIDI`, 
                  type: 'info' 
                });
              } else if (timelinePlayback.sequenceId) {
                get().playTimelineSequence(timelinePlayback.sequenceId);
                get().addNotification({ 
                  message: `Playback started via MIDI`, 
                  type: 'success' 
                });
              }
              break;
            case 'loop':
              set(state => ({
                timelinePlayback: {
                  ...state.timelinePlayback,
                  loop: !state.timelinePlayback.loop
                }
              }));
              get().addNotification({ 
                message: `Timeline looping ${get().timelinePlayback.loop ? 'enabled' : 'disabled'} via MIDI`, 
                type: 'info' 
              });
              break;
            case 'bounce':
            case 'reverse':
              // These would require additional playback state properties to implement fully
              get().addNotification({ 
                message: `${controlType} control triggered via MIDI (not fully implemented)`, 
                type: 'info' 
              });
              break;
          }
        }
      },

      clearTimelineControlMidiMappings: () => {
        set({ timelineControlMidiMappings: {} as Record<'play' | 'loop' | 'bounce' | 'reverse', MidiMapping> });
        get().addNotification({ 
          message: 'All timeline control MIDI mappings cleared', 
          type: 'info' 
        });
      },

      // Automation Functions (stub implementations)
      setAutomationPlaybackMode: (mode: 'forward' | 'reverse' | 'ping-pong') => {
        console.log(`Automation playback mode set to: ${mode}`);
        get().addNotification({ 
          message: `Automation playback mode: ${mode}`, 
          type: 'info' 
        });
      },

      setAutomationLoop: (loop: boolean) => {
        console.log(`Automation loop set to: ${loop}`);
        get().addNotification({ 
          message: `Automation loop: ${loop ? 'enabled' : 'disabled'}`, 
          type: 'info' 
        });
      },

      setAutomationSpeed: (speed: number) => {
        console.log(`Automation speed set to: ${speed}`);
        get().addNotification({ 
          message: `Automation speed: ${speed}x`, 
          type: 'info' 
        });
      },

      reverseAutomationDirection: () => {
        console.log('Automation direction reversed');
        get().addNotification({ 
          message: 'Automation direction reversed', 
          type: 'info' 
        });
      },

      playRecordingTimeline: () => {
        console.log('Recording timeline playback started');
        get().addNotification({ 
          message: 'Recording timeline playback started', 
          type: 'info' 
        });
      },
    })
  )
);