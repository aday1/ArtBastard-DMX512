import { useStore } from '../store';

// Simplified state manager for essential save/load functionality
export class StateManager {
  private static readonly STORAGE_KEY = 'artbastard-complete-state';
  private static readonly STATE_VERSION = '1.0.0';
  
  // Get current essential state from store and localStorage
  static getCurrentState(): any {
    const store = useStore.getState();
    
    // Capture localStorage data
    const localStorageData: { [key: string]: any } = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('artbastard-') || key?.includes('superControl') || key?.includes('dmx')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              localStorageData[key] = JSON.parse(value);
            } catch {
              localStorageData[key] = value;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to capture localStorage data:', error);
    }
    
    const state = {
      version: this.STATE_VERSION,
      timestamp: Date.now(),
      
      // Core store state - using any type to avoid TypeScript issues for now
      storeState: {
        dmxChannels: store.dmxChannels,
        channelNames: store.channelNames,
        selectedChannels: store.selectedChannels,
        fixtures: store.fixtures,
        groups: store.groups,
        selectedFixtures: store.selectedFixtures,
        scenes: store.scenes,
        artNetConfig: store.artNetConfig,
        oscConfig: store.oscConfig,
        theme: store.theme,
        darkMode: store.darkMode,
        uiSettings: store.uiSettings,
        navVisibility: store.navVisibility,
        debugTools: store.debugTools,
        autopilotTrackEnabled: store.autopilotTrackEnabled,
        autopilotTrackType: store.autopilotTrackType,
        autopilotTrackPosition: store.autopilotTrackPosition,
        autopilotTrackSize: store.autopilotTrackSize,
        autopilotTrackSpeed: store.autopilotTrackSpeed,
        autopilotTrackCenterX: store.autopilotTrackCenterX,
        autopilotTrackCenterY: store.autopilotTrackCenterY,
        autopilotTrackAutoPlay: store.autopilotTrackAutoPlay,
        channelAutopilots: store.channelAutopilots,
        panTiltAutopilot: store.panTiltAutopilot,
        fixtureLayout: store.fixtureLayout,
        placedFixtures: store.placedFixtures,
        masterSliders: store.masterSliders,
        midiMappings: store.midiMappings,
        oscAssignments: store.oscAssignments,
        oscActivity: store.oscActivity,
        autoSceneEnabled: store.autoSceneEnabled,
        autoSceneList: store.autoSceneList,
        autoSceneMode: store.autoSceneMode,
        autoSceneBeatDivision: store.autoSceneBeatDivision,
        autoSceneManualBpm: store.autoSceneManualBpm,
        autoSceneTapTempoBpm: store.autoSceneTapTempoBpm,
        autoSceneTempoSource: store.autoSceneTempoSource,
        recordingActive: store.recordingActive,
        automationTracks: store.automationTracks,
        automationPlayback: store.automationPlayback,
        smoothDmxEnabled: store.smoothDmxEnabled,
        smoothDmxUpdateRate: store.smoothDmxUpdateRate,
        smoothDmxThreshold: store.smoothDmxThreshold,
      },
      
      // LocalStorage Data
      localStorage: localStorageData,
    };
    
    return state;
  }
  
  // Save current state to localStorage
  static saveStateLocally(): boolean {
    try {
      const state = this.getCurrentState();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      console.log('💾 ArtBastard state saved locally');
      return true;
    } catch (error) {
      console.error('Failed to save state locally:', error);
      return false;
    }
  }
  
  // Load state from localStorage
  static loadStateLocally(): any | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;
      
      const state = JSON.parse(saved);
      console.log(`💾 Loaded ArtBastard state (v${state.version}) from ${new Date(state.timestamp).toLocaleString()}`);
      return state;
    } catch (error) {
      console.error('Failed to load state locally:', error);
      return null;
    }
  }
  
  // Export state as downloadable JSON file
  static exportStateAsFile(): boolean {
    try {
      const state = this.getCurrentState();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `artbastard-state-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📥 ArtBastard state exported as file');
      return true;
    } catch (error) {
      console.error('Failed to export state as file:', error);
      return false;
    }
  }
  
  // Import state from uploaded JSON file
  static importStateFromFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const state = JSON.parse(content);
          
          // Validate state structure
          if (!state.version || !state.timestamp) {
            throw new Error('Invalid ArtBastard state file format');
          }
          
          console.log(`📤 Importing ArtBastard state (v${state.version}) from ${new Date(state.timestamp).toLocaleString()}`);
          resolve(state);
        } catch (error) {
          reject(new Error(`Failed to parse state file: ${(error as Error).message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  // Apply imported state to the store and localStorage  
  static async applyState(state: any): Promise<boolean> {
    try {
      const store = useStore.getState();
      
      // Handle comprehensive backup format (from Settings component)
      if (state.exportType === 'complete_artbastard_backup') {
        console.log('📤 Applying comprehensive ArtBastard backup...');
        
        // Import backend data (scenes, config, state) via API
        if (state.backendData) {
          const { scenes, config, currentState } = state.backendData;
          
          // Upload scenes
          if (scenes && scenes.length > 0) {
            try {
              const response = await fetch('/api/scenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scenes)
              });
              if (!response.ok) {
                throw new Error(`Failed to import scenes: ${response.statusText}`);
              }
              console.log('✅ Scenes imported successfully');
            } catch (error) {
              console.error('❌ Failed to import scenes:', error);
              throw new Error(`Failed to import scenes: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          
          // Upload config
          if (config) {
            try {
              const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
              });
              if (!response.ok) {
                throw new Error(`Failed to import config: ${response.statusText}`);
              }
              console.log('✅ Config imported successfully');
            } catch (error) {
              console.error('❌ Failed to import config:', error);
              throw new Error(`Failed to import config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          
          // Upload current state
          if (currentState) {
            try {
              const response = await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentState)
              });
              if (!response.ok) {
                throw new Error(`Failed to import state: ${response.statusText}`);
              }
              console.log('✅ State imported successfully');
            } catch (error) {
              console.error('❌ Failed to import state:', error);
              throw new Error(`Failed to import state: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
        
        // Import store state
        if (state.storeState) {
          const storeState = state.storeState;
          
          // Apply DMX channels
          if (storeState.dmxChannels) {
            store.setDmxChannelsForTransition(storeState.dmxChannels);
          }
          
          // Apply other store state
          if (storeState.fixtures) {
            store.setFixtures(storeState.fixtures);
          }
          if (storeState.groups) {
            store.setGroups(storeState.groups);
          }
          if (storeState.midiMappings) {
            store.setMidiMappings(storeState.midiMappings);
          }
          if (storeState.artNetConfig) {
            store.setArtNetConfig(storeState.artNetConfig);
          }
          if (storeState.oscAssignments) {
            store.setOscAssignments(storeState.oscAssignments);
          }
          if (storeState.channelNames) {
            store.setChannelNames(storeState.channelNames);
          }
          if (storeState.masterSliders) {
            store.setMasterSliders(storeState.masterSliders);
          }
          
          // Apply selections
          if (storeState.selectedChannels) {
            storeState.selectedChannels.forEach((channel: number) => {
              store.selectChannel(channel);
            });
          }
          
          if (storeState.selectedFixtures) {
            store.setSelectedFixtures(storeState.selectedFixtures);
          }
          
          // Apply theme and UI settings
          if (storeState.theme) {
            store.setTheme(storeState.theme);
          }
          
          if (storeState.uiSettings) {
            store.updateUiSettings(storeState.uiSettings);
          }
          
          // Apply autopilot settings
          if (storeState.autopilotTrackEnabled !== undefined) {
            store.setAutopilotTrackEnabled(storeState.autopilotTrackEnabled);
          }
          if (storeState.autopilotTrackType) {
            store.setAutopilotTrackType(storeState.autopilotTrackType);
          }
          if (storeState.autopilotTrackPosition !== undefined) {
            store.setAutopilotTrackPosition(storeState.autopilotTrackPosition);
          }
          if (storeState.autopilotTrackSize !== undefined) {
            store.setAutopilotTrackSize(storeState.autopilotTrackSize);
          }
          if (storeState.autopilotTrackSpeed !== undefined) {
            store.setAutopilotTrackSpeed(storeState.autopilotTrackSpeed);
          }
          if (storeState.autopilotTrackCenterX !== undefined && storeState.autopilotTrackCenterY !== undefined) {
            store.setAutopilotTrackCenter(storeState.autopilotTrackCenterX, storeState.autopilotTrackCenterY);
          }
          
          // Apply auto-scene settings
          if (storeState.autoSceneEnabled !== undefined) {
            store.setAutoSceneEnabled(storeState.autoSceneEnabled);
          }
          if (storeState.autoSceneList) {
            store.setAutoSceneList(storeState.autoSceneList);
          }
          if (storeState.autoSceneMode) {
            store.setAutoSceneMode(storeState.autoSceneMode);
          }
          if (storeState.autoSceneBeatDivision !== undefined) {
            store.setAutoSceneBeatDivision(storeState.autoSceneBeatDivision);
          }
        }
        
        // Import frontend settings
        if (state.frontendSettings) {
          const frontendSettings = state.frontendSettings;
          // These would need to be handled by the Settings component
          console.log('📤 Frontend settings available for import:', frontendSettings);
        }
        
        console.log('🎯 Comprehensive ArtBastard backup applied successfully');
        return true;
      }
      
      // Handle legacy state format (direct store state)
      if (state.storeState) {
        const { storeState } = state;
        
        // Apply DMX channels
        if (storeState.dmxChannels) {
          store.setDmxChannelsForTransition(storeState.dmxChannels);
        }
        
        // Apply selections
        if (storeState.selectedChannels) {
          storeState.selectedChannels.forEach((channel: number) => {
            store.selectChannel(channel);
          });
        }
        
        if (storeState.selectedFixtures) {
          store.setSelectedFixtures(storeState.selectedFixtures);
        }
        
        // Apply theme and UI settings
        if (storeState.theme) {
          store.setTheme(storeState.theme);
        }
        
        if (storeState.uiSettings) {
          store.updateUiSettings(storeState.uiSettings);
        }
        
        // Apply autopilot settings
        if (storeState.autopilotTrackEnabled !== undefined) {
          store.setAutopilotTrackEnabled(storeState.autopilotTrackEnabled);
        }
        if (storeState.autopilotTrackType) {
          store.setAutopilotTrackType(storeState.autopilotTrackType);
        }
        if (storeState.autopilotTrackPosition !== undefined) {
          store.setAutopilotTrackPosition(storeState.autopilotTrackPosition);
        }
        if (storeState.autopilotTrackSize !== undefined) {
          store.setAutopilotTrackSize(storeState.autopilotTrackSize);
        }
        if (storeState.autopilotTrackSpeed !== undefined) {
          store.setAutopilotTrackSpeed(storeState.autopilotTrackSpeed);
        }
        if (storeState.autopilotTrackCenterX !== undefined && storeState.autopilotTrackCenterY !== undefined) {
          store.setAutopilotTrackCenter(storeState.autopilotTrackCenterX, storeState.autopilotTrackCenterY);
        }
        
        // Apply auto-scene settings
        if (storeState.autoSceneEnabled !== undefined) {
          store.setAutoSceneEnabled(storeState.autoSceneEnabled);
        }
        if (storeState.autoSceneList) {
          store.setAutoSceneList(storeState.autoSceneList);
        }
        if (storeState.autoSceneMode) {
          store.setAutoSceneMode(storeState.autoSceneMode);
        }
        if (storeState.autoSceneBeatDivision !== undefined) {
          store.setAutoSceneBeatDivision(storeState.autoSceneBeatDivision);
        }
      }
      
      // Restore localStorage data
      if (state.localStorage) {
        Object.entries(state.localStorage).forEach(([key, value]) => {
          try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, stringValue);
          } catch (error) {
            console.warn(`Failed to restore localStorage item ${key}:`, error);
          }
        });
      }
      
      console.log('🎯 ArtBastard state applied successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to apply imported state:', error);
      return false;
    }
  }
  
  // Auto-save functionality
  static enableAutoSave(intervalMinutes: number = 5): () => void {
    const interval = setInterval(() => {
      this.saveStateLocally();
    }, intervalMinutes * 60 * 1000);
    
    // Save on page unload
    const handleUnload = () => {
      this.saveStateLocally();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    // Return cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }
}
