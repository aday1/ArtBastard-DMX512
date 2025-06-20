import React, { useState, useEffect } from 'react'
import { useStore, Fixture, MasterSlider } from '../../store' 
import useStoreUtils from '../../store/storeUtils'
import { useTheme } from '../../context/ThemeContext'
import { useSocket } from '../../context/SocketContext'
import { useChromaticEnergyManipulatorSettings } from '../../context/ChromaticEnergyManipulatorContext'
import { MidiLearnButton } from '../midi/MidiLearnButton'
import { DebugMenu } from '../debug/DebugMenu'

import { CURRENT_VERSION, getVersionDisplay, getBuildInfo } from '../../utils/version';
import { ReleaseNotes } from './ReleaseNotes'
import styles from './UnifiedSettings.module.scss'

interface TouchOscExportOptionsUI {
  resolution: 'phone_portrait' | 'tablet_portrait'
  includeFixtureControls: boolean
  includeMasterSliders: boolean
  includeAllDmxChannels: boolean
}

interface ChromaticEnergyManipulatorSettings {
  enableKeyboardShortcuts: boolean
  autoSelectFirstFixture: boolean
  showQuickActions: boolean
  defaultColorPresets: string[]
  enableErrorMessages: boolean
  autoUpdateRate: number
  enableAnimations: boolean
  compactMode: boolean
}

interface AppSettings {
  theme: 'artsnob' | 'standard' | 'minimal'
  darkMode: boolean
  webPort: number
  debugModules: {
    midi: boolean
    osc: boolean
    artnet: boolean
    button: boolean
  }
  artNetConfig: any
  midiMappings: any
  fixtures: Fixture[]
  masterSliders: MasterSlider[]
  navVisibility: {
    main: boolean;
    midiOsc: boolean;
    fixture: boolean;
    scenes: boolean;
    audio: boolean;
    touchosc: boolean;
    misc: boolean;
  };
  debugTools: {
    debugButton: boolean;
    midiMonitor: boolean;
    oscMonitor: boolean;
  };
  chromaticEnergyManipulator: ChromaticEnergyManipulatorSettings;
}

export const UnifiedSettings: React.FC = () => {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme()
  const { socket, connected } = useSocket()
  const { settings: chromaticSettings, updateSettings: updateChromaticSettings } = useChromaticEnergyManipulatorSettings()
  const {
    artNetConfig,
    fixtures,
    masterSliders,
    midiMappings,
    navVisibility = {
      main: true,
      midiOsc: true,
      fixture: true,
      scenes: true,
      audio: true,
      touchosc: true,
      misc: true
    },
    debugTools = {
      debugButton: true,
      midiMonitor: true,
      oscMonitor: true
    },
    addNotification
  } = useStore(state => ({
    artNetConfig: state.artNetConfig,
    fixtures: state.fixtures,
    masterSliders: state.masterSliders,
    midiMappings: state.midiMappings,
    navVisibility: state.navVisibility,
    debugTools: state.debugTools,
    addNotification: state.addNotification
  }))

  // Settings state
  const [artNetSettings, setArtNetSettings] = useState({ ...artNetConfig })
  const [webPort, setWebPort] = useState(3000)
  const [debugModules, setDebugModules] = useState({
    midi: false,
    osc: false,
    artnet: false,
    button: true
  });
  const [exportInProgress, setExportInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [localNavVisibility, setLocalNavVisibility] = useState(navVisibility);
  const [localDebugTools, setLocalDebugTools] = useState(debugTools);
  const [activeSection, setActiveSection] = useState<string>('general');

  // Network settings
  const [networkSettings, setNetworkSettings] = useState({
    dmxInterface: 'default',
    ipAddress: '192.168.1.100',
    subnetMask: '255.255.255.0',
    port: 6454,
    artnetEnabled: true,
    sAcnEnabled: false,
  });

  // Performance settings
  const [performanceSettings, setPerformanceSettings] = useState({
    enableHardwareAcceleration: true,
    visualizerQuality: 'medium' as 'low' | 'medium' | 'high',
    loggingLevel: 'info' as 'none' | 'error' | 'warn' | 'info' | 'debug',
    showFps: false,
  });

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
        localStorage.clear()
        await fetch('/api/scenes', { method: 'DELETE' })
        
        useStoreUtils.setState({
          artNetConfig: { ip: '192.168.1.199', subnet: 0, universe: 0 },
          fixtures: [],
          scenes: [],
          masterSliders: [],
          midiMappings: {},
          theme: 'standard',
          darkMode: true,
          debugModules: { midi: false, osc: false, artnet: false, button: true },
          autoSceneTempo: 120,
          autoSceneEnabled: false,
          autoSceneTapTimes: [],
          autoSceneTempoSource: 'internal_clock',
          autoSceneIsFlashing: false,
          navVisibility: {
            main: true,
            midiOsc: true,
            fixture: true,
            scenes: true,
            audio: true,
            touchosc: true,
            misc: true
          },
          debugTools: {
            debugButton: true,
            midiMonitor: true,
            oscMonitor: true
          }
        })
        
        setWebPort(3000);
        setDebugModules({ midi: false, osc: false, artnet: false, button: true });
        setLocalNavVisibility({
          main: true, midiOsc: true, fixture: true, scenes: true,
          audio: true, touchosc: true, misc: true
        });
        setLocalDebugTools({ debugButton: true, midiMonitor: true, oscMonitor: true });
        updateChromaticSettings({
          enableKeyboardShortcuts: true,
          autoSelectFirstFixture: true,
          showQuickActions: true,
          defaultColorPresets: ['red', 'green', 'blue', 'white'],
          enableErrorMessages: true,
          autoUpdateRate: 100,
          enableAnimations: true,
          compactMode: false
        });

        addNotification({
          message: 'Settings reset to factory defaults',
          type: 'success'
        });

        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Factory reset error:', error);
        addNotification({
          message: 'Error during factory reset',
          type: 'error'
        });
      }
    }
  }

  // Export settings
  const handleExportSettings = async () => {
    setExportInProgress(true);
    try {
      const allSettings: AppSettings = {
        theme,
        darkMode,
        webPort,
        debugModules,
        artNetConfig,
        midiMappings,
        fixtures,
        masterSliders,
        navVisibility: localNavVisibility,
        debugTools: localDebugTools,
        chromaticEnergyManipulator: chromaticSettings
      };

      const blob = new Blob([JSON.stringify(allSettings, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artbastard-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      addNotification({
        message: 'Settings exported successfully',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        message: 'Failed to export settings',
        type: 'error'
      });
    } finally {
      setExportInProgress(false);
    }
  };

  // Import settings
  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportInProgress(true);
    try {
      const text = await file.text();
      const importedSettings: AppSettings = JSON.parse(text);

      if (importedSettings.theme) setTheme(importedSettings.theme);
      if (typeof importedSettings.darkMode === 'boolean') {
        if (importedSettings.darkMode !== darkMode) toggleDarkMode();
      }
      if (importedSettings.webPort) setWebPort(importedSettings.webPort);
      if (importedSettings.debugModules) setDebugModules(importedSettings.debugModules);
      if (importedSettings.navVisibility) setLocalNavVisibility(importedSettings.navVisibility);
      if (importedSettings.debugTools) setLocalDebugTools(importedSettings.debugTools);
      if (importedSettings.chromaticEnergyManipulator) {
        updateChromaticSettings(importedSettings.chromaticEnergyManipulator);
      }

      useStoreUtils.setState(state => ({
        ...state,
        artNetConfig: importedSettings.artNetConfig || state.artNetConfig,
        midiMappings: importedSettings.midiMappings || state.midiMappings,
        fixtures: importedSettings.fixtures || state.fixtures,
        masterSliders: importedSettings.masterSliders || state.masterSliders,
        navVisibility: importedSettings.navVisibility || state.navVisibility,
        debugTools: importedSettings.debugTools || state.debugTools
      }));

      addNotification({
        message: 'Settings imported successfully',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        message: 'Failed to import settings',
        type: 'error'
      });
    } finally {
      setImportInProgress(false);
      event.target.value = '';
    }
  };

  // Navigation visibility handler
  const handleNavVisibilityChange = (item: keyof typeof navVisibility) => {
    const newValue = !localNavVisibility[item];
    setLocalNavVisibility(prev => ({
      ...prev,
      [item]: newValue
    }));
    
    useStoreUtils.setState(state => ({
      ...state,
      navVisibility: {
        ...state.navVisibility,
        [item]: newValue
      }
    }));
  };

  // Debug tools visibility handler
  const handleDebugToolsChange = (tool: keyof typeof debugTools) => {
    const newValue = !localDebugTools[tool];
    setLocalDebugTools(prev => ({
      ...prev,
      [tool]: newValue
    }));
    
    useStoreUtils.setState(state => ({
      ...state,
      debugTools: {
        ...state.debugTools,
        [tool]: newValue
      }
    }));
  };

  const handleNetworkChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') {
      const { checked } = event.target as HTMLInputElement;
      setNetworkSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setNetworkSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePerformanceChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') {
      const { checked } = event.target as HTMLInputElement;
      setPerformanceSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setPerformanceSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className={styles.unifiedSettings}>
      <div className={styles.panel}>
        {/* Panel Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <i className="fas fa-cog"></i>
            {theme === 'artsnob' && 'Configuration Sanctuary'}
            {theme === 'standard' && 'Configuration & Settings'}
            {theme === 'minimal' && 'Config'}
          </h2>
          <div className={styles.panelActions}>
            <button 
              className={styles.actionButton}
              onClick={handleExportSettings}
              disabled={exportInProgress}
              title="Export all settings to file"
            >
              <i className="fas fa-download"></i>
              {exportInProgress ? 'Exporting...' : 'Export All'}
            </button>
            <label className={styles.actionButton} title="Import settings from file">
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                style={{ display: 'none' }}
                disabled={importInProgress}
              />
              <i className="fas fa-upload"></i>
              {importInProgress ? 'Importing...' : 'Import'}
            </label>
            <button 
              className={styles.dangerButton}
              onClick={handleFactoryReset}
              title="Reset all settings to factory defaults"
            >
              <i className="fas fa-undo"></i>
              Factory Reset
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className={styles.panelContent}>
          {/* Navigation Tabs */}
          <div className={styles.tabNavigation}>
            {[
              { id: 'general', label: 'General', icon: 'fas fa-cogs' },
              { id: 'theme', label: 'Theme', icon: 'fas fa-palette' },
              { id: 'network', label: 'Network', icon: 'fas fa-network-wired' },
              { id: 'performance', label: 'Performance', icon: 'fas fa-tachometer-alt' },
              { id: 'navigation', label: 'Navigation', icon: 'fas fa-bars' },
              { id: 'debug', label: 'Debug', icon: 'fas fa-bug' },
              { id: 'advanced', label: 'Advanced', icon: 'fas fa-tools' }
            ].map(section => (
              <button
                key={section.id}
                className={`${styles.tabButton} ${activeSection === section.id ? styles.active : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <i className={section.icon}></i>
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Sections */}
          <div className={styles.settingsContent}>
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-cogs"></i> General Settings</h3>
                
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-globe"></i>
                    Web Port
                  </label>
                  <input
                    type="number"
                    value={webPort}
                    onChange={(e) => setWebPort(Number(e.target.value))}
                    min={1}
                    max={65535}
                    className={styles.settingInput}
                  />
                  <p className={styles.settingDescription}>
                    Port number for the web interface (requires restart)
                  </p>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-info-circle"></i>
                    Version Information
                  </label>
                  <div className={styles.versionInfo}>
                    <span className={styles.versionNumber}>{getVersionDisplay()}</span>
                    <button 
                      className={styles.releaseNotesButton}
                      onClick={() => setShowReleaseNotes(true)}
                      title="View detailed release notes and version history"
                    >
                      <i className="fas fa-info-circle"></i>
                      Release Notes
                    </button>
                  </div>
                  <p className={styles.settingDescription}>
                    {getBuildInfo()}
                  </p>
                </div>
              </div>
            )}

            {/* Theme Settings */}
            {activeSection === 'theme' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-palette"></i> Theme & Appearance</h3>
                
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-paint-brush"></i>
                    Theme Selection
                  </label>
                  <div className={styles.themeOptions}>
                    {[
                      { id: 'artsnob', name: 'Art Snob', description: 'Artistic and expressive' },
                      { id: 'standard', name: 'Standard', description: 'Professional and clean' },
                      { id: 'minimal', name: 'Minimal', description: 'Simple and focused' }
                    ].map(themeOption => (
                      <div 
                        key={themeOption.id}
                        className={`${styles.themeOption} ${theme === themeOption.id ? styles.active : ''}`}
                        onClick={() => handleThemeChange(themeOption.id as any)}
                      >
                        <div className={styles.themePreview} data-theme={themeOption.id}>
                          <div className={styles.themePreviewHeader}></div>
                          <div className={styles.themePreviewBody}>
                            <div className={styles.themePreviewLine}></div>
                            <div className={styles.themePreviewLine}></div>
                          </div>
                        </div>
                        <div className={styles.themeInfo}>
                          <span className={styles.themeName}>{themeOption.name}</span>
                          <span className={styles.themeDescription}>{themeOption.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
                    Dark Mode
                  </label>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="darkMode"
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                    />
                    <label htmlFor="darkMode" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <p className={styles.settingDescription}>
                    Toggle between light and dark interface themes
                  </p>
                </div>
              </div>
            )}

            {/* Network Settings */}
            {activeSection === 'network' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-network-wired"></i> Network & DMX</h3>
                
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-ethernet"></i>
                    DMX Interface
                  </label>
                  <select
                    name="dmxInterface"
                    value={networkSettings.dmxInterface}
                    onChange={handleNetworkChange}
                    className={styles.settingSelect}
                  >
                    <option value="default">Default Ethernet</option>
                  </select>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-map-marker-alt"></i>
                    IP Address
                  </label>
                  <input
                    type="text"
                    name="ipAddress"
                    value={networkSettings.ipAddress}
                    onChange={handleNetworkChange}
                    disabled
                    className={styles.settingInput}
                  />
                  <p className={styles.settingDescription}>Auto-detected system IP address</p>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-door-open"></i>
                    Art-Net Port
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={networkSettings.port}
                    onChange={handleNetworkChange}
                    min="1"
                    max="65535"
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-broadcast-tower"></i>
                    Protocol Settings
                  </label>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="artnetEnabled"
                        checked={networkSettings.artnetEnabled}
                        onChange={handleNetworkChange}
                      />
                      <span className={styles.checkboxText}>Enable Art-Net Protocol</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="sAcnEnabled"
                        checked={networkSettings.sAcnEnabled}
                        onChange={handleNetworkChange}
                      />
                      <span className={styles.checkboxText}>Enable sACN Protocol</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Settings */}
            {activeSection === 'performance' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-tachometer-alt"></i> Performance & Debugging</h3>
                
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-rocket"></i>
                    Hardware Acceleration
                  </label>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      name="enableHardwareAcceleration"
                      checked={performanceSettings.enableHardwareAcceleration}
                      onChange={handlePerformanceChange}
                      id="hardwareAccel"
                    />
                    <label htmlFor="hardwareAccel" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <p className={styles.settingDescription}>
                    Enable hardware acceleration for better performance (if available)
                  </p>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-eye"></i>
                    Visualizer Quality
                  </label>
                  <select
                    name="visualizerQuality"
                    value={performanceSettings.visualizerQuality}
                    onChange={handlePerformanceChange}
                    className={styles.settingSelect}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-file-alt"></i>
                    Logging Level
                  </label>
                  <select
                    name="loggingLevel"
                    value={performanceSettings.loggingLevel}
                    onChange={handlePerformanceChange}
                    className={styles.settingSelect}
                  >
                    <option value="none">None</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-chart-line"></i>
                    FPS Counter
                  </label>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      name="showFps"
                      checked={performanceSettings.showFps}
                      onChange={handlePerformanceChange}
                      id="showFps"
                    />
                    <label htmlFor="showFps" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <p className={styles.settingDescription}>
                    Show frames per second counter for performance monitoring
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Settings */}
            {activeSection === 'navigation' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-bars"></i> Navigation Menu Items</h3>
                <p className={styles.sectionDescription}>
                  Control which navigation menu items are visible in the interface
                </p>
                
                <div className={styles.toggleGrid}>
                  {Object.entries(localNavVisibility).map(([key, value]) => (
                    <div key={key} className={styles.toggleItem}>
                      <div className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          id={`nav-${key}`}
                          checked={value}
                          onChange={() => handleNavVisibilityChange(key as keyof typeof navVisibility)}
                        />
                        <label htmlFor={`nav-${key}`} className={styles.toggleLabel}>
                          <span className={styles.toggleSlider}></span>
                        </label>
                      </div>
                      <span className={styles.toggleText}>{
                        key === 'main' ? 'Main Control' :
                        key === 'midiOsc' ? 'MIDI/OSC Setup' :
                        key === 'fixture' ? 'Fixture Setup' :
                        key === 'scenes' ? 'Scenes' :
                        key === 'audio' ? 'Audio' :
                        key === 'touchosc' ? 'TouchOSC' :
                        key === 'misc' ? 'Settings' :
                        key
                      }</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Section */}
            {activeSection === 'debug' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-bug"></i> Debug & Development Tools</h3>
                
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-tools"></i>
                    Debug Menu
                  </label>
                  <p className={styles.settingDescription}>
                    Comprehensive debugging tools for MIDI, OSC, DMX, and TouchOSC functionality.
                  </p>
                  
                  {/* Embedded Debug Menu without overlay */}
                  <div style={{ 
                    border: '1px solid var(--border-color, #333)', 
                    borderRadius: '8px', 
                    padding: '1rem',
                    backgroundColor: 'var(--card-background, rgba(255,255,255,0.05))',
                    marginTop: '1rem'
                  }}>
                    <DebugMenu position="embedded" />
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeSection === 'advanced' && (
              <div className={styles.settingsSection}>
                <h3><i className="fas fa-tools"></i> Advanced Settings</h3>
                
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-lightbulb"></i>
                    ChromaticEnergyManipulator
                  </label>
                  <div className={styles.advancedToggles}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={chromaticSettings.enableKeyboardShortcuts}
                        onChange={(e) => updateChromaticSettings({
                          enableKeyboardShortcuts: e.target.checked
                        })}
                      />
                      <span className={styles.checkboxText}>Keyboard Shortcuts</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={chromaticSettings.autoSelectFirstFixture}
                        onChange={(e) => updateChromaticSettings({
                          autoSelectFirstFixture: e.target.checked
                        })}
                      />
                      <span className={styles.checkboxText}>Auto-select First Fixture</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={chromaticSettings.showQuickActions}
                        onChange={(e) => updateChromaticSettings({
                          showQuickActions: e.target.checked
                        })}
                      />
                      <span className={styles.checkboxText}>Show Quick Actions</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={chromaticSettings.enableAnimations}
                        onChange={(e) => updateChromaticSettings({
                          enableAnimations: e.target.checked
                        })}
                      />
                      <span className={styles.checkboxText}>Enable Animations</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={chromaticSettings.compactMode}
                        onChange={(e) => updateChromaticSettings({
                          compactMode: e.target.checked
                        })}
                      />
                      <span className={styles.checkboxText}>Compact Mode</span>
                    </label>
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-clock"></i>
                    Auto Update Rate (ms)
                  </label>
                  <input
                    type="number"
                    value={chromaticSettings.autoUpdateRate}
                    onChange={(e) => updateChromaticSettings({
                      autoUpdateRate: parseInt(e.target.value)
                    })}
                    min={50}
                    max={1000}
                    step={10}
                    className={styles.settingInput}
                  />
                  <p className={styles.settingDescription}>
                    Update frequency for ChromaticEnergyManipulator (50-1000ms)
                  </p>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>
                    <i className="fas fa-exclamation-triangle"></i>
                    Danger Zone
                  </label>
                  <div className={styles.dangerZone}>
                    <button 
                      className={styles.dangerButton}
                      onClick={handleFactoryReset}
                    >
                      <i className="fas fa-exclamation-triangle"></i>
                      Factory Reset All Settings
                    </button>
                    <p className={styles.settingDescription}>
                      This will reset ALL settings to factory defaults and cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReleaseNotes 
        showModal={showReleaseNotes}
        onClose={() => setShowReleaseNotes(false)}
      />
    </div>
  )
}

export default UnifiedSettings
