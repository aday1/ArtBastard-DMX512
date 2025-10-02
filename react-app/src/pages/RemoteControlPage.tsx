import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { exportToToscFile, ExportOptions } from '../utils/touchoscExporter'
import TouchOSCNetworkPanel from '../components/touchosc/TouchOSCNetworkPanel'
import TouchOSCControlPanel from '../components/debug/TouchOSCControlPanel'
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
        undefined,          // scenes (optional)
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
        <div className={styles.headerContent}>
          <h2>Remote Control - TouchOSC Interface</h2>
          <p>Configure and manage wireless OSC control interfaces with professional layout tools</p>
        </div>
        <div className={styles.headerActions}>
          <div className={`${styles.status} ${styles[connectionStatus]}`}>
            {connectionStatus === 'connected' && <i className="fas fa-check-circle"></i>}
            {connectionStatus === 'connecting' && <i className="fas fa-spinner fa-spin"></i>}
            {connectionStatus === 'disconnected' && <i className="fas fa-times-circle"></i>}
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </div>
        </div>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.touchOSCLayout}>
          {/* Left Panel - Configuration */}
          <div className={styles.configurationPanel}>
            <div className={styles.panelSection}>
              <h3>
                <i className="fas fa-server"></i>
                Network Configuration
              </h3>
              <div className={styles.configGrid}>
                <div className={styles.configGroup}>
                  <label>
                    <span className={styles.labelText}>
                      <i className="fas fa-globe"></i>
                      Server IP Address
                    </span>
                    <input
                      type="text"
                      value={oscSettings.serverIP}
                      onChange={(e) => handleOscSettingChange('serverIP', e.target.value)}
                      placeholder="192.168.1.100"
                      className={styles.configInput}
                    />
                    <span className={styles.configHint}>IP address that clients will connect to</span>
                  </label>
                </div>
                
                <div className={styles.configGroup}>
                  <label>
                    <span className={styles.labelText}>
                      <i className="fas fa-ethernet"></i>
                      Server Port
                    </span>
                    <input
                      type="number"
                      value={oscSettings.serverPort}
                      onChange={(e) => handleOscSettingChange('serverPort', parseInt(e.target.value))}
                      min="1024"
                      max="65535"
                      className={styles.configInput}
                    />
                    <span className={styles.configHint}>Port for receiving OSC messages</span>
                  </label>
                </div>
                
                <div className={styles.configGroup}>
                  <label>
                    <span className={styles.labelText}>
                      <i className="fas fa-broadcast-tower"></i>
                      Client Port
                    </span>
                    <input
                      type="number"
                      value={oscSettings.clientPort}
                      onChange={(e) => handleOscSettingChange('clientPort', parseInt(e.target.value))}
                      min="1024"
                      max="65535"
                      className={styles.configInput}
                    />
                    <span className={styles.configHint}>Port for sending feedback to clients</span>
                  </label>
                </div>
                
                <div className={styles.configGroup}>
                  <label className={styles.checkboxLabel}>
                    <div className={styles.checkboxWrapper}>
                      <input
                        type="checkbox"
                        checked={oscSettings.autoDiscovery}
                        onChange={(e) => handleOscSettingChange('autoDiscovery', e.target.checked)}
                        className={styles.checkbox}
                      />
                      <div className={styles.checkboxCustom}>
                        <i className="fas fa-check"></i>
                      </div>
                    </div>
                    <span className={styles.labelText}>
                      <i className="fas fa-search"></i>
                      Auto-discovery
                    </span>
                    <span className={styles.configHint}>Automatically discover TouchOSC clients</span>
                  </label>
                </div>
              </div>
              
              <div className={styles.connectionActions}>
                {connectionStatus === 'disconnected' ? (
                  <button className={styles.primaryButton} onClick={handleStartOSC}>
                    <i className="fas fa-play"></i>
                    Start OSC Server
                  </button>
                ) : (
                  <button className={styles.secondaryButton} onClick={handleStopOSC}>
                    <i className="fas fa-stop"></i>
                    Stop OSC Server
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Live Preview & Status */}
          <div className={styles.previewPanel}>
            <div className={styles.panelSection}>
              <h3>
                <i className="fas fa-mobile-alt"></i>
                Live Interface Preview
              </h3>
              <div className={styles.previewContainer}>
                <div className={styles.devicePreview}>
                  <div className={styles.deviceFrame}>
                    <div className={styles.deviceScreen}>
                      <div className={styles.previewPlaceholder}>
                        <i className="fas fa-tablet-alt"></i>
                        <p>TouchOSC Interface Preview</p>
                        <p className={styles.subText}>Connect device to see live layout</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.connectionInfo}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={`${styles.statusBadge} ${styles[connectionStatus]}`}>
                      {connectionStatus === 'connected' && <i className="fas fa-check-circle"></i>}
                      {connectionStatus === 'connecting' && <i className="fas fa-spinner fa-spin"></i>}
                      {connectionStatus === 'disconnected' && <i className="fas fa-times-circle"></i>}
                      {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Listening on</span>
                    <span className={styles.infoValue}>{oscSettings.serverIP}:{oscSettings.serverPort}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Connected Devices</span>
                    <span className={styles.infoValue}>{connectedClients.length}</span>
                  </div>
                </div>
                
                {connectedClients.length > 0 && (
                  <div className={styles.clientsList}>
                    <h4>Active Connections</h4>
                    <div className={styles.clientsGrid}>
                      {connectedClients.map((client, index) => (
                        <div key={index} className={styles.clientCard}>
                          <i className="fas fa-mobile-alt"></i>
                          <span>{client}</span>
                          <div className={styles.clientStatus}>
                            <i className="fas fa-circle"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Export & Advanced */}
          <div className={styles.exportPanel}>
            <div className={styles.panelSection}>
              <h3>
                <i className="fas fa-download"></i>
                Layout Export
              </h3>
              <div className={styles.exportSettings}>
                <div className={styles.settingsGrid}>
                  <div className={styles.settingGroup}>
                    <label>
                      <span className={styles.labelText}>
                        <i className="fas fa-desktop"></i>
                        Device Resolution
                      </span>
                      <select
                        value={exportSettings.resolution}
                        onChange={(e) => handleExportSettingChange('resolution', e.target.value)}
                        className={styles.configSelect}
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
                      <div className={styles.checkboxWrapper}>
                        <input
                          type="checkbox"
                          checked={exportSettings.includeFixtureControls}
                          onChange={(e) => handleExportSettingChange('includeFixtureControls', e.target.checked)}
                          className={styles.checkbox}
                        />
                        <div className={styles.checkboxCustom}>
                          <i className="fas fa-check"></i>
                        </div>
                      </div>
                      <span className={styles.labelText}>
                        <i className="fas fa-lightbulb"></i>
                        Include Fixture Controls
                      </span>
                    </label>
                  </div>
                  
                  <div className={styles.settingGroup}>
                    <label className={styles.checkboxLabel}>
                      <div className={styles.checkboxWrapper}>
                        <input
                          type="checkbox"
                          checked={exportSettings.includeMasterSliders}
                          onChange={(e) => handleExportSettingChange('includeMasterSliders', e.target.checked)}
                          className={styles.checkbox}
                        />
                        <div className={styles.checkboxCustom}>
                          <i className="fas fa-check"></i>
                        </div>
                      </div>
                      <span className={styles.labelText}>
                        <i className="fas fa-sliders-h"></i>
                        Include Master Sliders
                      </span>
                    </label>
                  </div>
                  
                  <div className={styles.settingGroup}>
                    <label className={styles.checkboxLabel}>
                      <div className={styles.checkboxWrapper}>
                        <input
                          type="checkbox"
                          checked={exportSettings.includeAllDmxChannels}
                          onChange={(e) => handleExportSettingChange('includeAllDmxChannels', e.target.checked)}
                          className={styles.checkbox}
                        />
                        <div className={styles.checkboxCustom}>
                          <i className="fas fa-check"></i>
                        </div>
                      </div>
                      <span className={styles.labelText}>
                        <i className="fas fa-list"></i>
                        Include All DMX Channels
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.exportActions}>
                  <button 
                    className={styles.primaryButton}
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
                  
                  <div className={styles.exportHint}>
                    <i className="fas fa-info-circle"></i>
                    <span>Export will generate a .tosc file compatible with TouchOSC apps</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Advanced Network Panel */}
            <div className={styles.panelSection}>
              <h3>
                <i className="fas fa-cogs"></i>
                Advanced Network
              </h3>
              <div className={styles.networkComponents}>
                <TouchOSCNetworkPanel />
                <TouchOSCControlPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemoteControlPage
