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
  name: string
  startAddress: number
  channels: { name: string; type: string }[]
}

export interface Group {
  name: string
  fixtureIndices: number[]
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

// Define PlacedFixture type for 2D canvas layout
export interface PlacedFixture {
  id: string; 
  fixtureStoreId: string; 
  name: string; 
  x: number;
  y: number;
  color: string;
  radius: number;
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

interface State {
  // DMX State
  dmxChannels: number[]
  oscAssignments: string[]
  channelNames: string[]
  selectedChannels: number[]
  
  // MIDI State
  midiInterfaces: string[]
  activeInterfaces: string[]
  midiMappings: Record<number, MidiMapping | undefined> // For DMX channel direct mappings
  // midiLearnChannel: number | null // Deprecate in favor of midiLearnTarget
  midiLearnTarget: { type: 'masterSlider', id: string } | { type: 'dmxChannel', channelIndex: number } | null;
  midiLearnScene: string | null // For scene MIDI learn, if different
  midiMessages: any[]
  
  // Fixtures and Groups
  fixtures: Fixture[]
  groups: Group[]
  
  // Scenes
  scenes: Scene[]
  
  // ArtNet
  artNetConfig: ArtNetConfig
  artNetStatus: 'connected' | 'disconnected' | 'error' | 'timeout'
  
  // UI State
  theme: 'artsnob' | 'standard' | 'minimal'
  darkMode: boolean
  statusMessage: { text: string; type: 'success' | 'error' | 'info' } | null
  oscActivity: Record<number, OscActivity> // Added: channelIndex -> activity
  exampleSliderValue: number
  fixtureLayout: PlacedFixture[] // Added for 2D fixture layout
  masterSliders: MasterSlider[]; // Added for master sliders

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
  
  // Actions
  fetchInitialState: () => Promise<void>
  setDmxChannel: (channel: number, value: number) => void // This posts to backend
  setDmxChannelsForTransition: (values: number[]) => void; // For internal transition updates, no backend post
  setCurrentTransitionFrameId: (frameId: number | null) => void; // To store requestAnimationFrame ID
  clearTransitionState: () => void; // Action to reset transition state
  setTransitionDuration: (duration: number) => void; // Action to set scene transition duration
  selectChannel: (channel: number) => void
  deselectChannel: (channel: number) => void
  toggleChannelSelection: (channel: number) => void
  selectAllChannels: () => void
  deselectAllChannels: () => void
  invertChannelSelection: () => void
  setOscAssignment: (channelIndex: number, address: string) => void
  reportOscActivity: (channelIndex: number, value: number) => void // Added action
  
  // MIDI Actions
  startMidiLearn: (target: { type: 'masterSlider', id: string } | { type: 'dmxChannel', channelIndex: number }) => void;
  cancelMidiLearn: () => void
  addMidiMessage: (message: any) => void
  // addMidiMapping is for DMX channels. Master sliders will have mapping stored on their object.
  addMidiMapping: (dmxChannel: number, mapping: MidiMapping) => void 
  removeMidiMapping: (dmxChannel: number) => void
  clearAllMidiMappings: () => void
  
  // Scene Actions
  saveScene: (name: string, oscAddress: string) => void
  loadScene: (name: string) => void
  deleteScene: (name: string) => void
  
  // Config Actions
  updateArtNetConfig: (config: Partial<ArtNetConfig>) => void
  testArtNetConnection: () => void
  
  // UI Actions
  setTheme: (theme: 'artsnob' | 'standard' | 'minimal') => void
  toggleDarkMode: () => void
  showStatusMessage: (text: string, type: 'success' | 'error' | 'info') => void
  clearStatusMessage: () => void
  setExampleSliderValue: (value: number) => void
  setFixtureLayout: (layout: PlacedFixture[]) => void // Added action
  addMasterSlider: (slider: MasterSlider) => void;
  updateMasterSliderValue: (sliderId: string, value: number) => void;
  updateMasterSlider: (sliderId: string, updatedSlider: Partial<MasterSlider>) => void; // For more comprehensive updates
  removeMasterSlider: (sliderId: string) => void;
  setMasterSliders: (sliders: MasterSlider[]) => void; // For loading all sliders
}

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
      // midiLearnChannel: null, // Deprecated
      midiLearnTarget: null,
      midiLearnScene: null,
      midiMessages: [],
      
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
      statusMessage: null,
      oscActivity: {}, // Initialize oscActivity
      exampleSliderValue: 0,
      fixtureLayout: [], // Initialize fixtureLayout
      masterSliders: [], // Initialize masterSliders

      // Scene Transition State Init
      isTransitioning: false,
      transitionStartTime: null,
      transitionDuration: 1000, // Default 1 second
      fromDmxValues: null,
      toDmxValues: null,
      currentTransitionFrame: null,
      
      socket: null,
      setSocket: (socket) => set({ socket }),
      
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
              fixtureLayout: state.fixtureLayout || [], // Load fixtureLayout
              masterSliders: state.masterSliders || [] // Load masterSliders
            })

            // Load transitionDuration from persisted settings if available
            if (state.settings && typeof state.settings.transitionDuration === 'number') {
                set({ transitionDuration: state.settings.transitionDuration });
            }
            return // Successfully fetched state
          }
          throw new Error('Invalid response from server')
        } catch (error: any) {
          console.error('Failed to fetch initial state:', error)
          get().showStatusMessage(
            error.code === 'ECONNABORTED' 
              ? 'Connection timeout - please check server status'
              : 'Failed to fetch initial state - using default values',
            'error'
          )
          
          // Set default state if fetch fails
          set({
            dmxChannels: new Array(512).fill(0),
            oscAssignments: new Array(512).fill('').map((_, i) => `/fixture/DMX${i + 1}`),
            channelNames: new Array(512).fill('').map((_, i) => `CH ${i + 1}`),
            fixtures: [],
            groups: [],
            midiMappings: {},
            scenes: [],
            fixtureLayout: [], // Default fixtureLayout
            masterSliders: [], // Default masterSliders
            transitionDuration: 1000, // Ensure default on fail too
          })
        }
      },
      
      setDmxChannel: (channel, value) => { // This is for individual, manual changes, posts to backend
        const dmxChannels = [...get().dmxChannels]
        dmxChannels[channel] = value
        set({ dmxChannels })
        
        // Emit to server
        axios.post('/api/dmx', { channel, value })
          .catch(error => {
            console.error('Failed to update DMX channel:', error)
            get().showStatusMessage('Failed to update DMX channel', 'error')
          })
      },

      setDmxChannelsForTransition: (values) => { // For transition updates, does not post to backend
        set({ dmxChannels: values });
        // Optionally, could dispatch a local event for UI components that need frequent updates
        // without observing the entire dmxChannels array for performance.
        // e.g., window.dispatchEvent(new CustomEvent('dmxTransitionUpdate', { detail: { values } }));
      },

      setCurrentTransitionFrameId: (frameId) => set({ currentTransitionFrame: frameId }),

      clearTransitionState: () => set({
        isTransitioning: false,
        transitionStartTime: null,
        fromDmxValues: null,
        toDmxValues: null,
        currentTransitionFrame: null,
        // Do not reset transitionDuration here, as it's a user setting
      }),

      setTransitionDuration: (duration) => {
        if (duration >= 0) { // Basic validation
          set({ transitionDuration: duration });
          // Optionally, persist this to backend/localStorage if settings are saved that way
          // For now, it updates the store, and fetchInitialState might load it if it's part of general settings.
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
      
      // MIDI Actions
      startMidiLearn: (target) => {
        // If currently learning for another target, cancel it first (optional, or UI should prevent this)
        // For now, directly set the new target.
        set({ midiLearnTarget: target });
        // No server emit here for master slider learn, it's client-side state.
        // If target is dmxChannel, existing server emit might be relevant if server assists in learning.
        if (target.type === 'dmxChannel') {
            axios.post('/api/midi/learn', { channel: target.channelIndex })
              .catch(error => {
                console.error('Failed to start MIDI learn for DMX channel:', error);
                get().showStatusMessage('Failed to start MIDI learn for DMX channel', 'error');
              });
        }
        // Add a timeout for learn mode (e.g., 10 seconds)
        // This needs to be managed carefully, perhaps in the hook that uses this.
      },
      
      cancelMidiLearn: () => {
        const currentTarget = get().midiLearnTarget;
        set({ midiLearnTarget: null });
        
        if (currentTarget && currentTarget.type === 'dmxChannel') {
          // Emit to server if it was a DMX channel learn
          axios.post('/api/midi/cancel-learn', { channel: currentTarget.channelIndex })
            .catch(error => {
              console.error('Failed to cancel MIDI learn for DMX channel:', error);
            });
        }
      },
      
      addMidiMessage: (message) => {
        // Add the message to the midiMessages array (limit to last 20 messages for performance)
        const messages = [...get().midiMessages, message].slice(-20)
        set({ midiMessages: messages })
        
        // Log message for debugging
        console.log('MIDI message received:', message)
      },
      
      addMidiMapping: (dmxChannel, mapping) => {
        const midiMappings = { ...get().midiMappings }
        midiMappings[dmxChannel] = mapping
        set({ midiMappings, midiLearnChannel: null })
        
        // Emit to server
        axios.post('/api/midi/mapping', { dmxChannel, mapping })
          .catch(error => {
            console.error('Failed to add MIDI mapping:', error)
            get().showStatusMessage('Failed to add MIDI mapping', 'error')
          })
      },
      
      removeMidiMapping: (dmxChannel) => {
        const midiMappings = { ...get().midiMappings }
        delete midiMappings[dmxChannel]
        set({ midiMappings })
        
        // Emit to server
        axios.delete(`/api/midi/mapping/${dmxChannel}`)
          .catch(error => {
            console.error('Failed to remove MIDI mapping:', error)
            get().showStatusMessage('Failed to remove MIDI mapping', 'error')
          })
      },
      
      clearAllMidiMappings: () => {
        set({ midiMappings: {} })
        
        // Emit to server
        axios.delete('/api/midi/mappings')
          .catch(error => {
            console.error('Failed to clear all MIDI mappings:', error)
            get().showStatusMessage('Failed to clear all MIDI mappings', 'error')
          })
      },
      
      // Scene Actions
      saveScene: (name, oscAddress) => {
        const dmxChannels = get().dmxChannels
        
        // Create a new scene
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
          scenes.push(newScene)
        }
        
        set({ scenes })
        
        // Emit to server
        axios.post('/api/scenes', newScene)
          .catch(error => {
            console.error('Failed to save scene:', error)
            get().showStatusMessage('Failed to save scene', 'error')
          })
      },
      
      loadScene: (name) => { // This will be modified to trigger transitions
        const { scenes, isTransitioning, currentTransitionFrame, dmxChannels: currentDmxState } = get();
        const scene = scenes.find(s => s.name === name);
        
        if (scene) {
          if (isTransitioning && currentTransitionFrame) {
            cancelAnimationFrame(currentTransitionFrame);
            set({ currentTransitionFrame: null }); // Clear frame ID
          }

          set({
            isTransitioning: true,
            fromDmxValues: [...currentDmxState], // Start from current live DMX values
            toDmxValues: [...scene.channelValues],
            transitionStartTime: Date.now(),
            // transitionDuration is already in store, can be set by user
          });
          
          // The actual animation loop will be started by a component observing these changes or a separate service.
          // For now, just setting state. The backend is notified that this scene *will be* the target.
          axios.post('/api/scenes/load', { name }) // Inform backend about the target scene
            .catch(error => {
              console.error('Failed to load scene:', error)
              get().showStatusMessage('Failed to load scene', 'error')
            })
        } else {
          get().showStatusMessage(`Scene "${name}" not found`, 'error')
        }
      },
      
      deleteScene: (name) => {
        const scenes = get().scenes.filter(s => s.name !== name)
        set({ scenes })
        
        // Emit to server
        axios.delete(`/api/scenes/${encodeURIComponent(name)}`)
          .catch(error => {
            console.error('Failed to delete scene:', error)
            get().showStatusMessage('Failed to delete scene', 'error')
          })
      },
      
      // Config Actions
      updateArtNetConfig: (config) => {
        const socket = get().socket
        if (socket?.connected) {
          socket.emit('updateArtNetConfig', config)
          set({ artNetConfig: { ...get().artNetConfig, ...config } })
        } else {
          get().showStatusMessage('Cannot update ArtNet config: not connected to server', 'error')
        }
      },

      testArtNetConnection: () => {
        const socket = get().socket
        if (socket?.connected) {
          socket.emit('testArtNetConnection')
          get().showStatusMessage('Testing ArtNet connection...', 'info')
        } else {
          get().showStatusMessage('Cannot test connection: not connected to server', 'error')
        }
      },
      
      // UI Actions
      setTheme: (theme) => {
        set({ theme })
        localStorage.setItem('theme', theme)
      },
      
      toggleDarkMode: () => {
        const darkMode = !get().darkMode
        set({ darkMode })
        localStorage.setItem('darkMode', darkMode.toString())
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
      },
      
      showStatusMessage: (text, type) => {
        set({ statusMessage: { text, type } })
        
        // Auto-clear after 3 seconds
        setTimeout(() => {
          set((state) => {
            if (state.statusMessage?.text === text) {
              return { statusMessage: null }
            }
            return {}
          })
        }, 3000)
      },
      
      clearStatusMessage: () => {
        set({ statusMessage: null })
      },

      setOscAssignment: (channelIndex, address) => {
        const currentAssignments = get().oscAssignments;
        const newAssignments = [...currentAssignments];
        newAssignments[channelIndex] = address;
        set({ oscAssignments: newAssignments });

        axios.post('/api/osc/assignment', { channel: channelIndex, address })
          .catch(error => {
            console.error('Failed to update OSC assignment:', error);
            get().showStatusMessage('Failed to update OSC assignment', 'error');
          });
      },

      reportOscActivity: (channelIndex, value) => {
        set(state => ({
          oscActivity: {
            ...state.oscActivity,
            [channelIndex]: { value, timestamp: Date.now() }
          }
        }));
        // Optional: Clear activity after a short period if not continuously updated
        // setTimeout(() => {
        //   set(state => {
        //     const newActivity = { ...state.oscActivity };
        //     if (newActivity[channelIndex] && newActivity[channelIndex].timestamp === get().oscActivity[channelIndex]?.timestamp) {
        //       delete newActivity[channelIndex];
        //     }
        //     return { oscActivity: newActivity };
        //   });
        // }, 2000); // Clear after 2 seconds if no new message
      },

      setExampleSliderValue: (value) => {
        set({ exampleSliderValue: value });
      },

      setFixtureLayout: (layout) => {
        set({ fixtureLayout: layout });
        // Optionally, here you could also trigger a save to backend if needed
        // For example: get().socket?.emit('saveFixtureLayout', layout);
        // This depends on whether exportSettings/importSettings already cover this.
        // For now, we assume the layout is part of the state saved by existing mechanisms.
      },

      addMasterSlider: (slider) => set(state => ({ masterSliders: [...state.masterSliders, slider] })),
      
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
            if (!pFix) return;

            const fixtureDef = fixtures.find(fDef => fDef.name === pFixture.fixtureStoreId);
            if (!fixtureDef || target.channelIndex >= fixtureDef.channels.length) return;
            
            const actualDmxAddress = pFixture.startAddress + target.channelIndex -1; // 0-indexed

            if (actualDmxAddress >= 0 && actualDmxAddress < 512) {
              // Scale value: master (0-255) -> target (minRange-maxRange)
              const masterValueNormalized = value / 255;
              let targetDmxValue = target.minRange + masterValueNormalized * (target.maxRange - target.minRange);
              targetDmxValue = Math.round(targetDmxValue);
              targetDmxValue = Math.max(0, Math.min(255, targetDmxValue)); // Clamp to 0-255
              
              // Call setDmxChannel (which is part of the store, so get() provides it if actions are structured that way)
              // Or, if setDmxChannel is a top-level action in the slice:
              dmxSetter(actualDmxAddress, targetDmxValue);
            }
          });
        }
      },
      
      updateMasterSlider: (sliderId, updatedSlider) => set(state => ({
        masterSliders: state.masterSliders.map(s => s.id === sliderId ? { ...s, ...updatedSlider } : s)
      })),
      removeMasterSlider: (sliderId) => set(state => ({
        masterSliders: state.masterSliders.filter(s => s.id !== sliderId)
      })),
      setMasterSliders: (sliders) => set({ masterSliders: sliders }),
    }),
    { name: 'ArtBastard-DMX-Store' }
  )
);

// Make the store accessible globally for MIDI message handling from non-React contexts
// TypeScript needs window interface augmentation to allow custom properties
declare global {
  interface Window {
    useStore: typeof useStore;
  }
}

// Assign store to window in non-SSR environments
if (typeof window !== 'undefined') {
  window.useStore = useStore;
}