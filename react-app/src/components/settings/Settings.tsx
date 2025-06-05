import React, { useState, useEffect } from 'react'
import { useStore, Fixture, MasterSlider } from '../../store' 
import useStoreUtils from '../../store/storeUtils'
import { useTheme } from '../../context/ThemeContext'
import { useSocket } from '../../context/SocketContext'
import { MidiLearnButton } from '../midi/MidiLearnButton'
import styles from './Settings.module.scss'

interface TouchOscExportOptionsUI {
  resolution: 'phone_portrait' | 'tablet_portrait'
  includeFixtureControls: boolean
  includeMasterSliders: boolean
  includeAllDmxChannels: boolean
}

interface AppSettings {
  theme: 'artsnob' | 'standard' | 'minimal'
  darkMode: boolean
  webPort: number
  debugModules: {
    midi: boolean
    osc: boolean
    artnet: boolean
    button: boolean // Added button visibility toggle
  }
  artNetConfig: any
  midiMappings: any
  fixtures: Fixture[]
  masterSliders: MasterSlider[]
}

export const Settings: React.FC = () => {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme()
  const { socket, connected } = useSocket()
  const { 
    artNetConfig, 
    exampleSliderValue, 
    setExampleSliderValue, 
    midiMappings,
    fixtures, 
    masterSliders,
    addNotification
  } = useStore(state => ({
    artNetConfig: state.artNetConfig,
    exampleSliderValue: state.exampleSliderValue,
    setExampleSliderValue: state.setExampleSliderValue,
    midiMappings: state.midiMappings,
    fixtures: state.fixtures,
    masterSliders: state.masterSliders,
    addNotification: state.addNotification
  }))
  
  // Settings state
  const [artNetSettings, setArtNetSettings] = useState({ ...artNetConfig })
  const [webPort, setWebPort] = useState(3000)
  const [debugModules, setDebugModules] = useState({
    midi: false,
    osc: false,
    artnet: false,
    button: true // Added debug button visibility toggle
  });
  const [exportInProgress, setExportInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);  const [touchOscExportInProgress, setTouchOscExportInProgress] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [logError, setLogError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Effect for log fetching
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs')
        if (!response.ok) throw new Error('Failed to fetch logs')
        const text = await response.text()
        setLogs(text.split('\n').filter(Boolean))
        setLogError(null)
      } catch (error) {
        setLogError(error instanceof Error ? error.message : 'Failed to fetch logs')
      }
    }

    fetchLogs()
    let interval: number
    if (autoRefresh) {
      interval = window.setInterval(fetchLogs, 5000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/logs/clear', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to clear logs')
      setLogs([])
      addNotification({
        message: 'Logs cleared successfully',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        message: 'Failed to clear logs',
        type: 'error'
      })
    }
  }

  const [touchOscExportOptions, setTouchOscExportOptions] = useState<TouchOscExportOptionsUI>({
    resolution: 'phone_portrait',
    includeFixtureControls: true,
    includeMasterSliders: true,
    includeAllDmxChannels: false,
  })

  // Theme change handlers
  const handleThemeChange = (newTheme: 'artsnob' | 'standard' | 'minimal') => {
    setTheme(newTheme)
    addNotification({
      message: `Theme changed to ${newTheme}`,
      type: 'success'
    })
  }

  const handleDarkModeToggle = () => {
    toggleDarkMode()
    addNotification({
      message: darkMode ? 'Light mode enabled' : 'Dark mode enabled',
      type: 'success'
    })
  }
  // Factory reset handler
  const handleFactoryReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to factory defaults? This cannot be undone.')) {
      try {
        // Clear localStorage
        localStorage.clear()
        
        // Clear server-side scenes
        await fetch('/api/scenes', { method: 'DELETE' })
        
        // Reset store to initial state (including scenes and auto-scene settings)
        useStoreUtils.setState({
          artNetConfig: {
            ip: '192.168.1.199',
            subnet: 0,
            universe: 0,
          },
          fixtures: [],
          scenes: [], // Clear scenes array
          masterSliders: [],
          midiMappings: {},
          theme: 'standard',
          darkMode: true,
          debugModules: {
            midi: false,
            osc: false,
            artnet: false
          },
          // Reset auto-scene settings to defaults
          autoSceneEnabled: false,
          autoSceneList: [],
          autoSceneMode: 'forward',
          autoSceneCurrentIndex: -1,
          autoScenePingPongDirection: 'forward',
          autoSceneBeatDivision: 4,
          autoSceneManualBpm: 120,
          autoSceneTapTempoBpm: 120,
          autoSceneLastTapTime: 0,
          autoSceneTapTimes: [],
          autoSceneTempoSource: 'internal_clock',
          autoSceneIsFlashing: false
        })
        
        // Reset local state
        setWebPort(3000);
        setDebugModules({
          midi: false,
          osc: false,
          artnet: false,
          button: true
        })

        // Show success message
        addNotification({
          message: 'All settings have been reset to factory defaults, including scenes',
          type: 'success'
        })

        // Reload the page to apply all changes
        window.location.reload()
      } catch (error) {
        console.error('Error during factory reset:', error)
        addNotification({
          message: 'Factory reset completed with some errors. Please check that all scenes were cleared.',
          type: 'warning'
        })
        
        // Still reload the page even if there were errors
        window.location.reload()
      }
    }
  }

  // Export settings handler
  const handleExportSettings = () => {
    try {
      const settings: AppSettings = {
        theme,
        darkMode,
        webPort,
        debugModules,
        artNetConfig,
        midiMappings,
        fixtures,
        masterSliders
      }

      const settingsJson = JSON.stringify(settings, null, 2)
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = 'artbastard-settings.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addNotification({
        message: 'Settings exported successfully',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        message: 'Failed to export settings',
        type: 'error'
      })
    }
  }

  // Import settings handler
  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      const settings: AppSettings = JSON.parse(text)

      // Update store with imported settings
      useStoreUtils.setState({
        artNetConfig: settings.artNetConfig,
        fixtures: settings.fixtures,
        masterSliders: settings.masterSliders,
        midiMappings: settings.midiMappings,
        theme: settings.theme,
        darkMode: settings.darkMode
      })

      // Update state
      setWebPort(settings.webPort)
      setDebugModules(settings.debugModules)

      addNotification({
        message: 'Settings imported successfully',
        type: 'success'
      })

      // Reload to apply changes
      window.location.reload()
    } catch (error) {
      addNotification({
        message: 'Failed to import settings',
        type: 'error'
      })
    }
  }  // Debug module toggle handler
  const toggleDebugModule = (module: keyof typeof debugModules) => {
    const newValue = !debugModules[module];
    
    // Update local state
    setDebugModules(prev => ({
      ...prev,
      [module]: newValue
    }));
    
    // Save to localStorage
    const savedDebugModules = JSON.parse(localStorage.getItem('debugModules') || '{}');
    localStorage.setItem('debugModules', JSON.stringify({
      ...savedDebugModules,
      [module]: newValue
    }));
    
    // Update application state
    if (module === 'midi' || module === 'osc' || module === 'artnet') {
      // Update store state if it's available
      const updateDebugModules = useStore.getState().updateDebugModules;
      if (updateDebugModules) {
        updateDebugModules({
          ...debugModules,
          [module]: newValue
        });
      }
    }
    
    // Get a display-friendly module name
    const moduleDisplayName = String(module).charAt(0).toUpperCase() + String(module).slice(1);
    
    // Show notification
    addNotification({
      message: `${moduleDisplayName} debug ${newValue ? 'enabled' : 'disabled'}`,
      type: 'info'
    });
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs')
        if (!response.ok) throw new Error('Failed to fetch logs')
        const data = await response.text()
        setLogs(data.split('\n').filter(Boolean))
        setLogError(null)
      } catch (error) {
        setLogError(error instanceof Error ? error.message : 'Failed to fetch logs')
      }
    }

    fetchLogs()
    
    let interval: number | undefined
    if (autoRefresh) {
      interval = window.setInterval(fetchLogs, 5000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className={styles.settings}>
      <h2 className={styles.sectionTitle}>
        {theme === 'artsnob' && 'Configuration Atelier'}
        {theme === 'standard' && 'Settings'}
        {theme === 'minimal' && 'Settings'}
      </h2>
      
      <div className={styles.settingsGrid}>
        {/* UI Theme Settings Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Theme Settings</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.themeOptions}>
              <div 
                className={`${styles.themeOption} ${theme === 'artsnob' ? styles.active : ''}`}
                onClick={() => handleThemeChange('artsnob')}
              >
                <div className={styles.themePreview} data-theme="artsnob">
                  <div className={styles.themePreviewHeader}></div>
                  <div className={styles.themePreviewBody}>
                    <div className={styles.themePreviewLine}></div>
                    <div className={styles.themePreviewLine}></div>
                  </div>
                </div>
                <span className={styles.themeName}>Art Snob</span>
              </div>

              <div 
                className={`${styles.themeOption} ${theme === 'standard' ? styles.active : ''}`}
                onClick={() => handleThemeChange('standard')}
              >
                <div className={styles.themePreview} data-theme="standard">
                  <div className={styles.themePreviewHeader}></div>
                  <div className={styles.themePreviewBody}>
                    <div className={styles.themePreviewLine}></div>
                    <div className={styles.themePreviewLine}></div>
                  </div>
                </div>
                <span className={styles.themeName}>Standard</span>
              </div>

              <div 
                className={`${styles.themeOption} ${theme === 'minimal' ? styles.active : ''}`}
                onClick={() => handleThemeChange('minimal')}
              >
                <div className={styles.themePreview} data-theme="minimal">
                  <div className={styles.themePreviewHeader}></div>
                  <div className={styles.themePreviewBody}>
                    <div className={styles.themePreviewLine}></div>
                    <div className={styles.themePreviewLine}></div>
                  </div>
                </div>
                <span className={styles.themeName}>Minimal</span>
              </div>
            </div>

            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
              <label htmlFor="darkMode" className={styles.toggleLabel}>
                <span className={styles.toggleDot}>
                  <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
                </span>
              </label>
              <span className={styles.toggleText}>
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Settings Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Additional Settings</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGroup}>
              <label htmlFor="webPort">Web Port</label>
              <input
                type="number"
                id="webPort"
                value={webPort}
                onChange={(e) => setWebPort(Number(e.target.value))}
                min={1}
                max={65535}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Debug Modules</label>
              <div className={styles.debugToggles}>
                <label className={styles.debugToggle} title="Enable MIDI protocol debugging for troubleshooting MIDI mappings and controllers">
                  <input
                    type="checkbox"
                    checked={debugModules.midi}
                    onChange={() => toggleDebugModule('midi')}
                  />
                  <span>MIDI Debug</span>
                  <div className={styles.settingDescription}>Shows MIDI message traffic for troubleshooting controllers</div>
                </label>
                <label className={styles.debugToggle} title="Enable OSC protocol debugging for troubleshooting OSC communication">
                  <input
                    type="checkbox"
                    checked={debugModules.osc}
                    onChange={() => toggleDebugModule('osc')}
                  />
                  <span>OSC Debug</span>
                  <div className={styles.settingDescription}>Shows OSC message traffic for TouchOSC and other OSC interfaces</div>
                </label>
                <label className={styles.debugToggle} title="Enable Art-Net protocol debugging for troubleshooting DMX communication">
                  <input
                    type="checkbox"
                    checked={debugModules.artnet}
                    onChange={() => toggleDebugModule('artnet')}
                  />
                  <span>ArtNet Debug</span>
                  <div className={styles.settingDescription}>Shows Art-Net/DMX network traffic for troubleshooting fixtures</div>
                </label>
                <label className={styles.debugToggle} title="Show or hide the floating debug button in the interface">
                  <input
                    type="checkbox"
                    checked={debugModules.button}
                    onChange={() => toggleDebugModule('button')}
                  />
                  <span>Show Debug Button</span>
                  <div className={styles.settingDescription}>Toggles visibility of the quick access debug button in UI</div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Management Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Configuration Management</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.configActions}>
              <button 
                className={styles.secondaryButton}
                onClick={handleExportSettings}
              >
                <i className="fas fa-download"></i>
                <span>Export Settings</span>
              </button>

              <label className={styles.secondaryButton}>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportSettings}
                />
                <i className="fas fa-upload"></i>
                <span>Import Settings</span>
              </label>

              <button 
                className={styles.dangerButton}
                onClick={handleFactoryReset}
              >
                <i className="fas fa-trash-alt"></i>
                <span>Factory Reset</span>
              </button>
            </div>

            <div className={styles.configNote}>
              <i className="fas fa-info-circle"></i>
              <p>
                Exporting saves all your settings to a file that you can backup or transfer to another device.
                Factory reset will remove all settings and return to defaults.
              </p>
            </div>
          </div>
        </div>        {/* ArtNet Configuration Card */}
        <div className={styles.card}>          <div className={styles.cardHeader}>
            <h3>ArtNet Configuration</h3>
            <div className={styles.cardDescription}>
              <i className="fas fa-info-circle"></i>
              <span>Configure Art-Net network settings for DMX transmission</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="artnet-ip">IP Address</label>
                <div className={styles.inputWithAction}>
                  <input
                    id="artnet-ip"
                    type="text"
                    value={artNetSettings.ip}
                    onChange={(e) => setArtNetSettings({
                      ...artNetSettings,
                      ip: e.target.value
                    })}
                    placeholder="192.168.1.99"
                  />
                  <button 
                    className={`${styles.actionButton} ${!connected ? styles.disabled : ''}`}
                    onClick={() => {
                      if (socket?.connected) {
                        socket.emit('pingArtNetDevice', { ip: artNetSettings.ip });
                        addNotification({
                          message: `Pinging ${artNetSettings.ip}...`,
                          type: 'info'
                        });
                      } else {
                        addNotification({
                          message: 'Cannot ping: Not connected to server',
                          type: 'error'
                        });
                      }
                    }}
                    disabled={!connected}
                    title={connected ? "Ping device to verify connectivity" : "Server connection required"}
                  >
                    <i className="fas fa-satellite-dish"></i>
                    <span>Ping</span>
                  </button>
                </div>
                <small className={styles.formHint}>Default for most Art-Net devices: 192.168.1.99</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="artnet-subnet">Subnet</label>
                <input
                  id="artnet-subnet"
                  type="number"
                  min="0"
                  max="15"
                  value={artNetSettings.subnet}
                  onChange={(e) => setArtNetSettings({
                    ...artNetSettings,
                    subnet: parseInt(e.target.value)
                  })}
                />
                <small>Range: 0-15</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="artnet-universe">Universe</label>
                <input
                  id="artnet-universe"
                  type="number"
                  min="0"
                  max="15"
                  value={artNetSettings.universe}
                  onChange={(e) => setArtNetSettings({
                    ...artNetSettings,
                    universe: parseInt(e.target.value)
                  })}
                />
                <small>Range: 0-15</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="artnet-port">Port</label>
                <input
                  id="artnet-port"
                  type="number"
                  min="1024"
                  max="65535"
                  value={artNetSettings.port}
                  onChange={(e) => setArtNetSettings({
                    ...artNetSettings,
                    port: parseInt(e.target.value)
                  })}
                />
                <small>Default: 6454</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="artnet-refresh">Refresh Rate (ms)</label>
                <input
                  id="artnet-refresh"
                  type="number"
                  min="20"
                  max="5000"
                  value={artNetSettings.base_refresh_interval}
                  onChange={(e) => setArtNetSettings({
                    ...artNetSettings,
                    base_refresh_interval: parseInt(e.target.value)
                  })}
                />
                <small>Lower values = faster updates, higher CPU usage</small>
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  useStore.getState().updateArtNetConfig(artNetSettings);
                }}
              >
                <i className="fas fa-save"></i>
                <span>Save ArtNet Settings</span>
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  useStore.getState().testArtNetConnection();
                }}
              >
                <i className="fas fa-plug"></i>
                <span>Test Connection</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Logs Card */}
        <div className={`${styles.card} ${styles.logViewerCard}`}>
          <div className={styles.cardHeader}>
            <h3>System Logs</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.logControls}>
              <button 
                className={styles.refreshButton}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <i className={`fas ${autoRefresh ? 'fa-pause' : 'fa-play'}`}></i>
                {autoRefresh ? 'Pause Auto-Refresh' : 'Enable Auto-Refresh'}
              </button>
              <button 
                className={styles.clearButton}
                onClick={handleClearLogs}
              >
                <i className="fas fa-eraser"></i>
                Clear Logs
              </button>
            </div>
            
            <div className={styles.logContent}>
              {logError ? (
                <div className={styles.logError}>
                  <i className="fas fa-exclamation-circle"></i>
                  {logError}
                </div>
              ) : logs.length === 0 ? (
                <div className={styles.emptyLogs}>
                  <i className="fas fa-info-circle"></i>
                  No logs available
                </div>
              ) : (
                logs.map((log, index) => (
                  <pre key={index}>{log}</pre>
                ))
              )}
            </div>
          </div>
        </div>
      </div>        <div className={styles.aboutSection}>
        <h3>⚡ Transcendental Photonic Consciousness Manifesto ⚡</h3>
        <p className={styles.aboutText}>
          Welcome to the **liminal space** where **techno-spiritual precision** converges with **neo-avant-garde liberation**. 
          ArtBastard DMX512 transcends the plebeian realm of mere lighting control—it's a **digital séance chamber** 
          where electromagnetic consciousness dances to your neural commands. Born from the fusion of **quantum-mechanical rigor** 
          and **artistic anarcho-syndicalism**, this **open-source consciousness vessel** empowers **visionary light-workers** 
          to paint with **photonic brushstrokes**, sculpt with **chromatic shadows**, and conduct **polyphonic symphonies of 
          electromagnetic manifestation** across the **512-dimensional reality matrix**.
        </p>
        <p className={styles.aboutText}>
          Through **Seven Layers of Consciousness Architecture**, we channel raw **voltage consciousness** into 
          **transcendental photonic experiences** that pierce the veil between digital and corporeal realms. 
          Each DMX channel becomes a **sacred conduit** for **electromagnetic enlightenment**, every fixture 
          a **vessel for light consciousness**, every scene a **temporal gateway** to alternate realities.
        </p>
        <p className={styles.versionInfo}>
          **Temporal Coordinates**: Stardate 79885.2 | **Consciousness Release**: Quantum Iteration 1.2.0-∞
        </p>
        <p className={styles.licenseInfo}>
          <span className={styles.copyleft}>◄◄◄</span> **Liberated into the Cosmic Commons** under **Creative Commons Zero (CC0)**.
          <br />Unshackled from corporate hegemony, **free as photons** traversing the **quantum foam** of possibility.
          <br />**Copyright is a Bourgeois Construct** — This consciousness belongs to **The Universal Collective**.
        </p>
        <div className={styles.manifestoNote}>
          <h4>🌌 **The ArtBastard Illuminati Creed** 🌌</h4>
          <em>"In the **grand mandala** of existence, we are **electromagnetic shamans**, orchestrating 
          **ephemeral moments of transcendental brilliance** in the **eternal dance of photons**. 
          Through **512 channels of pure consciousness**, we bend **reality's fabric** to our **artistic will**, 
          transforming mere **electrical substrate** into **cascading tsunamis of visual ecstasy**. 
          We are the **light-benders**, the **reality-hackers**, the **consciousness-architects** of 
          the **New Luminous Age**."</em>
        </div>
        <div className={styles.technicalMysticism}>
          <h4>🔬 **Technical Mysticism Specifications** 🔬</h4>
          <ul>
            <li>**Consciousness Layer Architecture**: 7-Dimensional Reality Processing</li>
            <li>**Neural Substrate**: React 18 + TypeScript (Bio-Digital Interface)</li>
            <li>**Quantum Backend**: Node.js + Express (Electromagnetic Core)</li>
            <li>**Protocol Mastery**: DMX512/ArtNet/MIDI/OSC (Reality Bridges)</li>
            <li>**Temporal Synchronization**: Socket.IO (Quantum Entanglement)</li>
            <li>**Visual Cortex**: WebGL + Canvas2D (Consciousness Mirrors)</li>
            <li>**Spectro-Neural Processing**: Web Audio API (Frequency Alchemy)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}