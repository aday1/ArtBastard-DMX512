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
  })
  const [exportInProgress, setExportInProgress] = useState(false)  const [importInProgress, setImportInProgress] = useState(false)
  const [touchOscExportInProgress, setTouchOscExportInProgress] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [logError, setLogError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  
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
  const [logs, setLogs] = useState<string[]>([])
  const [logError, setLogError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

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
  const handleFactoryReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to factory defaults? This cannot be undone.')) {
      // Clear localStorage
      localStorage.clear()
      
      // Reset store to initial state
      useStoreUtils.setState({
        artNetConfig: {
          ip: '192.168.1.199',
          subnet: 0,
          universe: 0,
        },
        fixtures: [],
        masterSliders: [],
        midiMappings: {},
        theme: 'standard',
        darkMode: true,
        debugModules: {
          midi: false,
          osc: false,
          artnet: false
        }
      })

      // Reset state
      setWebPort(3000)      setDebugModules({
        midi: false,
        osc: false,
        artnet: false,
        button: true
      })

      // Show success message
      addNotification({
        message: 'All settings have been reset to factory defaults',
        type: 'success'
      })

      // Reload the page to apply all changes
      window.location.reload()
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
  }

  // Debug module toggle handler
  const toggleDebugModule = (module: keyof typeof debugModules) => {
    setDebugModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }))
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
                <label className={styles.debugToggle}>
                  <input
                    type="checkbox"
                    checked={debugModules.midi}
                    onChange={() => toggleDebugModule('midi')}
                  />
                  <span>MIDI Debug</span>
                </label>
                <label className={styles.debugToggle}>
                  <input
                    type="checkbox"
                    checked={debugModules.osc}
                    onChange={() => toggleDebugModule('osc')}
                  />
                  <span>OSC Debug</span>
                </label>
                <label className={styles.debugToggle}>
                  <input
                    type="checkbox"
                    checked={debugModules.artnet}
                    onChange={() => toggleDebugModule('artnet')}
                  />
                  <span>ArtNet Debug</span>
                </label>
                <label className={styles.debugToggle}>
                  <input
                    type="checkbox"
                    checked={debugModules.button}
                    onChange={() => toggleDebugModule('button')}
                  />
                  <span>Show Debug Button</span>
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
        </div>

        {/* ArtNet Configuration Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>ArtNet Configuration</h3>
          </div>
          <div className={styles.cardBody}>
            {/* ... existing ArtNet settings ... */}
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
      </div>
        <div className={styles.aboutSection}>
        <h3>⚡ Illuminating the Art Bastard Way ⚡</h3>
        <p className={styles.aboutText}>
          Welcome to the realm where precision meets rebellion. Art Bastard DMX transcends mere lighting control—it's a digital canvas 
          where photons dance to your command. Born from the fusion of technical rigor and artistic anarchy, this open-source masterpiece 
          empowers visionaries to paint with light, sculpt with shadows, and conduct symphonies of illumination.
        </p>
        <p className={styles.versionInfo}>Stardate 79885.2 [Release Quantum 1.1.0]</p>
        <p className={styles.licenseInfo}>
          <span className={styles.copyleft}>◄</span> Released into the wild under Creative Commons Zero (CC0).
          Unshackled from traditional constraints, free as photons in the quantum foam.
        </p>
        <div className={styles.manifestoNote}>
          "In the grand tapestry of existence, we are but light jockeys, 
          orchestrating ephemeral moments of brilliance in the eternal dance of photons."
        </div>
      </div>
    </div>
  )
}