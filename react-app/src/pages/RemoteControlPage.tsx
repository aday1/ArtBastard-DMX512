import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { exportToToscFile, ExportOptions } from '../utils/touchoscExporter'
import styles from './Pages.module.scss'

const RemoteControlPage: React.FC = () => {
  const { allFixtures, masterSliders, fixtureLayout } = useStore(state => ({
    allFixtures: state.fixtures,
    masterSliders: state.masterSliders,
    fixtureLayout: state.fixtureLayout,
  }))

  // OSC Configuration state
  const [oscSettings, setOscSettings] = useState({
    serverPort: 8080,
    clientPort: 9000,
    serverIP: window.location.hostname,
    clientIP: '',
    autoDiscovery: true,
    enabled: true
  })

  // TouchOSC Export settings
  const [exportSettings, setExportSettings] = useState<ExportOptions>({
    resolution: 'ipad_pro_2019_portrait' as const,
    includeFixtureControls: true,
    includeMasterSliders: true,
    includeAllDmxChannels: false
  })

  const [isExporting, setIsExporting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [connectedClients, setConnectedClients] = useState<string[]>([])

  // Network discovery for local IP addresses
  useEffect(() => {
    const getLocalIP = async () => {
      try {
        // Simple method to get local network IP
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          setOscSettings(prev => ({ ...prev, serverIP: hostname }))
        }
      } catch (error) {
        console.log('Could not determine local IP, using hostname')
      }
    }
    getLocalIP()
  }, [])

  // Handle OSC setting changes
  const handleOscSettingChange = (key: keyof typeof oscSettings, value: any) => {
    setOscSettings(prev => ({ ...prev, [key]: value }))
  }

  // Handle export setting changes
  const handleExportSettingChange = (key: keyof ExportOptions, value: any) => {
    setExportSettings(prev => ({ ...prev, [key]: value }))
  }

  // Export TouchOSC layout
  const handleExportLayout = async () => {
    try {
      setIsExporting(true)
      const result = await exportToToscFile(
        exportSettings, 
        fixtureLayout, 
        masterSliders, 
        allFixtures, 
        'ArtBastard_TouchOSC.tosc'
      )
      
      if (result.success) {
        alert('TouchOSC layout exported successfully! Load the .tosc file in your TouchOSC app.')
      } else {
        alert(`Export failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Mock functions for demonstration - these would connect to actual OSC server
  const handleStartOSC = () => {
    setConnectionStatus('connecting')
    // Simulate connection
    setTimeout(() => {
      setConnectionStatus('connected')
      setConnectedClients(['TouchOSC Device 1 (192.168.1.100)'])
    }, 1500)
  }

  const handleStopOSC = () => {
    setConnectionStatus('disconnected')
    setConnectedClients([])
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Remote Control - TouchOSC Interface</h2>
        <p>Configure and manage wireless OSC control interfaces</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.remoteSection}>
          {/* OSC Server Configuration */}
          <div className={styles.configPanel}>
            <h3>
              <i className="fas fa-server"></i>
              OSC Server Configuration
            </h3>
            <div className={styles.configGrid}>
              <div className={styles.configGroup}>
                <label>
                  <i className="fas fa-globe"></i>
                  Server IP Address
                  <input
                    type="text"
                    value={oscSettings.serverIP}
                    onChange={(e) => handleOscSettingChange('serverIP', e.target.value)}
                    placeholder="192.168.1.100"
                  />
                  <span className={styles.configHint}>IP address that clients will connect to</span>
                </label>
              </div>
              
              <div className={styles.configGroup}>
                <label>
                  <i className="fas fa-ethernet"></i>
                  Server Port
                  <input
                    type="number"
                    value={oscSettings.serverPort}
                    onChange={(e) => handleOscSettingChange('serverPort', parseInt(e.target.value))}
                    min="1024"
                    max="65535"
                  />
                  <span className={styles.configHint}>Port for receiving OSC messages</span>
                </label>
              </div>
              
              <div className={styles.configGroup}>
                <label>
                  <i className="fas fa-broadcast-tower"></i>
                  Client Port
                  <input
                    type="number"
                    value={oscSettings.clientPort}
                    onChange={(e) => handleOscSettingChange('clientPort', parseInt(e.target.value))}
                    min="1024"
                    max="65535"
                  />
                  <span className={styles.configHint}>Port for sending feedback to clients</span>
                </label>
              </div>
              
              <div className={styles.configGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={oscSettings.autoDiscovery}
                    onChange={(e) => handleOscSettingChange('autoDiscovery', e.target.checked)}
                  />
                  <i className="fas fa-search"></i>
                  Auto-discovery
                  <span className={styles.configHint}>Automatically discover TouchOSC clients</span>
                </label>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className={styles.connectionPanel}>
            <h3>
              <i className="fas fa-wifi"></i>
              Connection Status
            </h3>
            <div className={styles.connectionInfo}>
              <div className={styles.statusRow}>
                <span>OSC Server:</span>
                <span className={`${styles.status} ${styles[connectionStatus]}`}>
                  {connectionStatus === 'connected' && <i className="fas fa-check-circle"></i>}
                  {connectionStatus === 'connecting' && <i className="fas fa-spinner fa-spin"></i>}
                  {connectionStatus === 'disconnected' && <i className="fas fa-times-circle"></i>}
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </span>
              </div>
              <div className={styles.statusRow}>
                <span>Listening on:</span>
                <span className={styles.address}>{oscSettings.serverIP}:{oscSettings.serverPort}</span>
              </div>
              <div className={styles.statusRow}>
                <span>Connected Clients:</span>
                <span className={styles.clientCount}>{connectedClients.length}</span>
              </div>
            </div>
            
            {connectedClients.length > 0 && (
              <div className={styles.clientsList}>
                <h4>Active Connections:</h4>
                {connectedClients.map((client, index) => (
                  <div key={index} className={styles.clientItem}>
                    <i className="fas fa-mobile-alt"></i>
                    {client}
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.connectionControls}>
              {connectionStatus === 'disconnected' ? (
                <button className={styles.startButton} onClick={handleStartOSC}>
                  <i className="fas fa-play"></i>
                  Start OSC Server
                </button>
              ) : (
                <button className={styles.stopButton} onClick={handleStopOSC}>
                  <i className="fas fa-stop"></i>
                  Stop OSC Server
                </button>
              )}
            </div>
          </div>
          
          {/* TouchOSC Layout Export */}
          <div className={styles.layoutPanel}>
            <h3>
              <i className="fas fa-mobile-alt"></i>
              TouchOSC Layout Export
            </h3>
            <div className={styles.exportSettings}>
              <div className={styles.settingsGrid}>
                <div className={styles.settingGroup}>
                  <label>
                    <i className="fas fa-desktop"></i>
                    Device Resolution
                    <select
                      value={exportSettings.resolution}
                      onChange={(e) => handleExportSettingChange('resolution', e.target.value)}
                    >
                      <option value="phone_portrait">Phone Portrait (720×1280)</option>
                      <option value="tablet_portrait">Tablet Portrait (1024×1366)</option>
                      <option value="ipad_pro_2019_portrait">iPad Pro Portrait (1668×2420)</option>
                      <option value="ipad_pro_2019_landscape">iPad Pro Landscape (2420×1668)</option>
                      <option value="samsung_s21_specified_portrait">Samsung S21 Portrait (1668×2420)</option>
                      <option value="samsung_s21_specified_landscape">Samsung S21 Landscape (2420×1668)</option>
                    </select>
                  </label>
                </div>
                
                <div className={styles.settingGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={exportSettings.includeFixtureControls}
                      onChange={(e) => handleExportSettingChange('includeFixtureControls', e.target.checked)}
                    />
                    <i className="fas fa-lightbulb"></i>
                    Include Fixture Controls
                  </label>
                </div>
                
                <div className={styles.settingGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={exportSettings.includeMasterSliders}
                      onChange={(e) => handleExportSettingChange('includeMasterSliders', e.target.checked)}
                    />
                    <i className="fas fa-sliders-h"></i>
                    Include Master Sliders
                  </label>
                </div>
                
                <div className={styles.settingGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={exportSettings.includeAllDmxChannels}
                      onChange={(e) => handleExportSettingChange('includeAllDmxChannels', e.target.checked)}
                    />
                    <i className="fas fa-th"></i>
                    Include All 512 DMX Channels
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.exportStats}>
              <div className={styles.stat}>
                <span>Placed Fixtures:</span>
                <span>{fixtureLayout.length}</span>
              </div>
              <div className={styles.stat}>
                <span>Master Sliders:</span>
                <span>{masterSliders.length}</span>
              </div>
              <div className={styles.stat}>
                <span>Available Fixture Types:</span>
                <span>{allFixtures.length}</span>
              </div>
            </div>
            
            <div className={styles.exportActions}>
              <button 
                className={styles.exportButton}
                onClick={handleExportLayout}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    Export TouchOSC Layout
                  </>
                )}
              </button>
              
              <div className={styles.exportInfo}>
                <p>
                  <i className="fas fa-info-circle"></i>
                  The exported .tosc file can be opened directly in TouchOSC and edited further if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className={styles.instructionsPanel}>
            <h3>
              <i className="fas fa-book"></i>
              Setup Instructions
            </h3>
            <div className={styles.setupSteps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>Install TouchOSC</h4>
                  <p>Download TouchOSC from the App Store (iOS) or Google Play (Android)</p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>Connect to Network</h4>
                  <p>Ensure your device is connected to the same network as this controller</p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>Configure OSC Settings</h4>
                  <p>In TouchOSC, set Host to <code>{oscSettings.serverIP}</code> and Port to <code>{oscSettings.serverPort}</code></p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h4>Load Layout</h4>
                  <p>Export and load the custom .tosc layout file using the button above</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemoteControlPage
