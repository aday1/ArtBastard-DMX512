import React, { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import { useBrowserMidi } from '../../hooks/useBrowserMidi'
import { MidiVisualizer } from './MidiVisualizer'
import styles from './MidiOscSetup.module.scss'

export const MidiOscSetup: React.FC = () => {
  const { theme } = useTheme()
  const { socket, connected } = useSocket()
  const { 
    isSupported: browserMidiSupported, 
    error: browserMidiError,
    browserInputs,
    activeBrowserInputs,
    connectBrowserInput,
    disconnectBrowserInput,
    refreshDevices
  } = useBrowserMidi()
    const [midiInterfaces, setMidiInterfaces] = useState<string[]>([])
  const [activeInterfaces, setActiveInterfaces] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [oscConfig, setOscConfig] = useState({ host: '127.0.0.1', port: 8000 })
  
  const midiMessages = useStore(state => state.midiMessages)
  const clearAllMidiMappings = useStore(state => state.clearAllMidiMappings)
  
  // Request MIDI interfaces on component mount
  useEffect(() => {
    if (socket && connected) {
      socket.emit('getMidiInterfaces')
      
      // Listen for MIDI interfaces
      const handleMidiInterfaces = (interfaces: string[]) => {
        setMidiInterfaces(interfaces)
        setIsRefreshing(false)
      }
      
      // Listen for active MIDI interfaces
      const handleActiveInterfaces = (active: string[]) => {
        setActiveInterfaces(active)
      }
      
      socket.on('midiInterfaces', handleMidiInterfaces)
      socket.on('midiInputsActive', handleActiveInterfaces)
      
      return () => {
        socket.off('midiInterfaces', handleMidiInterfaces)
        socket.off('midiInputsActive', handleActiveInterfaces)
      }
    }
  }, [socket, connected])
  
  // Refresh all MIDI interfaces
  const handleRefreshMidi = () => {
    if (socket && connected) {
      setIsRefreshing(true)
      socket.emit('getMidiInterfaces')
    }
    
    // Also refresh browser MIDI devices
    if (browserMidiSupported) {
      refreshDevices()
    }
  }
  
  // Connect to server MIDI interface
  const handleConnectMidi = (interfaceName: string) => {
    if (socket && connected) {
      socket.emit('selectMidiInterface', interfaceName)
    }
  }
  
  // Disconnect from server MIDI interface
  const handleDisconnectMidi = (interfaceName: string) => {
    if (socket && connected) {
      socket.emit('disconnectMidiInterface', interfaceName)
    }
  }
    // Save OSC configuration
  const handleSaveOscConfig = () => {
    if (socket && connected) {
      socket.emit('saveOscConfig', oscConfig)
      useStore.getState().addNotification({
        message: 'OSC configuration saved',
        type: 'success',
        priority: 'normal'
      })
    }
  }
  
  // Clear all MIDI messages
  const handleClearMidiMessages = () => {
    useStore.setState({ midiMessages: [] })
  }
  
  // Forget all MIDI mappings with confirmation
  const handleForgetAllMappings = () => {
    if (window.confirm('Are you sure you want to forget all MIDI mappings? This cannot be undone.')) {
      clearAllMidiMappings()
    }
  }
  
  return (
    <div className={styles.midiOscSetup}>
      <h2 className={styles.sectionTitle}>
        {theme === 'artsnob' && 'MIDI/OSC Atelier: The Digital Orchestration'}
        {theme === 'standard' && 'MIDI/OSC Setup'}
        {theme === 'minimal' && 'MIDI/OSC'}
      </h2>

      <div className={styles.connectedDevicesSummary}>
        Connected MIDI Devices: Server (<b>{activeInterfaces.length}</b>), Browser (<b>{activeBrowserInputs.size}</b>)
      </div>
      
      <div className={styles.setupGrid}>
        {/* Server MIDI Interface Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 title="MIDI interfaces connected to the server - useful for external controllers and hardware devices">
              {theme === 'artsnob' && 'Server MIDI Interfaces: The Distant Muses'}
              {theme === 'standard' && 'Server MIDI Interfaces'}
              {theme === 'minimal' && 'Server MIDI'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardDescription}>
              Server MIDI interfaces are external MIDI devices connected to the computer running ArtBastard. 
              These provide stable connections for professional MIDI controllers and hardware.
            </p>
            <div className={styles.interfaceList}>
              {midiInterfaces.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-music"></i>
                  <p>No server MIDI interfaces detected</p>
                  <button 
                    className={styles.refreshButton}
                    onClick={handleRefreshMidi}
                    disabled={isRefreshing}
                    title="Scan for new MIDI devices connected to the server"
                  >
                    {isRefreshing ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                    Refresh
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.interfaceHeader}>
                    <span className={styles.interfaceName}>Interface Name</span>
                    <span className={styles.interfaceStatus}>Status</span>
                    <span className={styles.interfaceActions}>Actions</span>
                  </div>
                  
                  {midiInterfaces.map((interfaceName) => (
                    <div key={interfaceName} className={styles.interfaceItem}>
                      <span className={styles.interfaceName}>{interfaceName}</span>
                      <span className={`${styles.interfaceStatus} ${activeInterfaces.includes(interfaceName) ? styles.active : ''}`}>
                        {activeInterfaces.includes(interfaceName) ? 'Connected' : 'Disconnected'}
                      </span>
                      <div className={styles.interfaceActions}>
                        {activeInterfaces.includes(interfaceName) ? (
                          <button 
                            className={`${styles.actionButton} ${styles.disconnectButton}`}
                            onClick={() => handleDisconnectMidi(interfaceName)}
                            title={`Disconnect from ${interfaceName} - MIDI data will stop flowing from this device`}
                          >
                            <i className="fas fa-unlink"></i>
                            {theme !== 'minimal' && 'Disconnect'}
                          </button>
                        ) : (
                          <button 
                            className={`${styles.actionButton} ${styles.connectButton}`}
                            onClick={() => handleConnectMidi(interfaceName)}
                            title={`Connect to ${interfaceName} - Enable MIDI data flow from this device`}
                          >
                            <i className="fas fa-link"></i>
                            {theme !== 'minimal' && 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    className={styles.refreshButton}
                    onClick={handleRefreshMidi}
                    disabled={isRefreshing}
                    title="Scan for new MIDI devices connected to the server"
                  >
                    {isRefreshing ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                    Refresh
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Browser MIDI Interface Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 title="MIDI devices accessible through your web browser - requires Chrome/Edge and may have limited functionality">
              {theme === 'artsnob' && 'Browser MIDI Interfaces: The Local Orchestrators'}
              {theme === 'standard' && 'Browser MIDI Devices'}
              {theme === 'minimal' && 'Browser MIDI'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardDescription}>
              Browser MIDI uses the Web MIDI API to access devices directly in your browser. 
              Requires Chrome or Edge browser and may have limitations compared to server interfaces.
            </p>
            <div className={styles.interfaceList}>
              {!browserMidiSupported ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>Web MIDI API is not supported in this browser.</p>
                  <p className={styles.browserMidiError}>{browserMidiError || 'Try using Chrome or Edge instead.'}</p>
                </div>
              ) : browserInputs.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-music"></i>
                  <p>No browser MIDI devices detected</p>
                  <button 
                    className={styles.refreshButton}
                    onClick={refreshDevices}
                    disabled={isRefreshing}
                    title="Scan for MIDI devices accessible in your browser"
                  >
                    {isRefreshing ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                    Refresh
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.interfaceHeader}>
                    <span className={styles.interfaceName}>Device Name</span>
                    <span className={styles.interfaceStatus}>Status</span>
                    <span className={styles.interfaceActions}>Actions</span>
                  </div>
                  
                  {browserInputs.map((input) => (
                    <div key={input.id} className={styles.interfaceItem}>
                      <span className={styles.interfaceName}>
                        {input.name}
                        <span className={styles.interfaceManufacturer}>{input.manufacturer}</span>
                      </span>
                      <span className={`${styles.interfaceStatus} ${activeBrowserInputs.has(input.id) ? styles.active : ''}`}>
                        {activeBrowserInputs.has(input.id) ? 'Connected' : 'Disconnected'}
                      </span>
                      <div className={styles.interfaceActions}>
                        {activeBrowserInputs.has(input.id) ? (
                          <button 
                            className={`${styles.actionButton} ${styles.disconnectButton}`}
                            onClick={() => disconnectBrowserInput(input.id)}
                            title={`Disconnect from ${input.name} - Browser MIDI data will stop flowing`}
                          >
                            <i className="fas fa-unlink"></i>
                            {theme !== 'minimal' && 'Disconnect'}
                          </button>
                        ) : (
                          <button 
                            className={`${styles.actionButton} ${styles.connectButton}`}
                            onClick={() => connectBrowserInput(input.id)}
                            title={`Connect to ${input.name} - Enable browser MIDI data flow`}
                          >
                            <i className="fas fa-link"></i>
                            {theme !== 'minimal' && 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    className={styles.refreshButton}
                    onClick={refreshDevices}
                    disabled={isRefreshing}
                    title="Scan for MIDI devices accessible in your browser"
                  >
                    {isRefreshing ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                    Refresh
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* OSC Configuration Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 title="Open Sound Control - network protocol for real-time audio/visual control between devices and applications">
              {theme === 'artsnob' && 'OSC Configuration: Network Dialogue'}
              {theme === 'standard' && 'OSC Configuration'}
              {theme === 'minimal' && 'OSC'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardDescription}>
              OSC (Open Sound Control) enables network communication between devices and applications. 
              Configure the host and port where ArtBastard will receive OSC messages.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="oscHost" title="IP address where OSC messages will be received. Use 127.0.0.1 for local connections or your network IP for remote devices">
                Host Address:
              </label>
              <input
                type="text"
                id="oscHost"
                value={oscConfig.host}
                onChange={(e) => setOscConfig({ ...oscConfig, host: e.target.value })}
                placeholder="127.0.0.1"
                title="Enter the IP address for OSC communication. 127.0.0.1 for local apps, your LAN IP for network devices"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="oscPort" title="Network port number for OSC messages. Common values: 8000, 9000, 53000 (TouchOSC), 57121 (SuperCollider)">
                Port:
              </label>
              <input
                type="number"
                id="oscPort"
                value={oscConfig.port}
                onChange={(e) => setOscConfig({ ...oscConfig, port: parseInt(e.target.value) })}
                placeholder="8000"
                title="Network port for OSC communication. Common ports: 8000, 9000, 53000 (TouchOSC)"
              />
            </div>
            
            <button 
              className={styles.saveButton}
              onClick={handleSaveOscConfig}
              title="Save OSC configuration and restart the OSC server with new settings"
            >
              <i className="fas fa-save"></i>
              {theme === 'artsnob' && 'Commit to Memory'}
              {theme === 'standard' && 'Save Configuration'}
              {theme === 'minimal' && 'Save'}
            </button>
          </div>
        </div>
        
        {/* MIDI Mappings Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 title="MIDI Learn system - create connections between MIDI controls and DMX channels">
              {theme === 'artsnob' && 'MIDI Mappings: The Digital Correspondences'}
              {theme === 'standard' && 'MIDI Mappings'}
              {theme === 'minimal' && 'Mappings'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            <button 
              className={styles.forgetAllButton}
              onClick={handleForgetAllMappings}
              title="Remove all MIDI mappings and reset the learn system. This cannot be undone!"
            >
              <i className="fas fa-trash-alt"></i>
              {theme === 'artsnob' && 'Dissolve All Correspondences'}
              {theme === 'standard' && 'Remove All Mappings'}
              {theme === 'minimal' && 'Clear All'}
            </button>
            
            <p className={styles.mappingInstructions}>
              {theme === 'artsnob' && 'To establish a digital correspondence, click "MIDI Learn" on any DMX channel and move a control on your MIDI device.'}
              {theme === 'standard' && 'Click "MIDI Learn" on any DMX channel and move a control on your MIDI device to create a mapping.'}
              {theme === 'minimal' && 'Use MIDI Learn on DMX channels to map controls.'}
            </p>
            <p className={styles.mappingHint}>
              💡 Tip: You can map knobs, faders, buttons, and even keyboard keys to control different lighting parameters.
            </p>
          </div>
        </div>
        
        {/* MIDI Messages Card */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <h3 title="Real-time display of incoming MIDI messages from all connected devices">
              {theme === 'artsnob' && 'Incoming Messages: The Whispers of Digital Muses'}
              {theme === 'standard' && 'MIDI Messages'}
              {theme === 'minimal' && 'Messages'}
            </h3>
            <button 
              className={styles.clearButton}
              onClick={handleClearMidiMessages}
              title="Clear all MIDI messages from the display"
            >
              <i className="fas fa-eraser"></i>
              {theme !== 'minimal' && 'Clear'}
            </button>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardDescription}>
              Watch real-time MIDI data from your connected devices. Use this to test connections and troubleshoot MIDI mappings.
            </p>
            {/* MIDI Visualizer Component */}
            <MidiVisualizer />
            
            {/* Text-based MIDI Messages */}
            <div className={styles.midiMessages}>
              {midiMessages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <p>No MIDI messages received yet. Try pressing keys or moving controls on your MIDI device.</p>
                </div>
              ) : (
                midiMessages.slice(-50).map((msg, index) => (
                  <div 
                    key={index} 
                    className={styles.midiMessage}
                    title={`${msg._type} message from ${msg.source || 'unknown source'} at ${new Date().toLocaleTimeString()}`}
                  >
                    <span className={styles.timestamp}>
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span className={`${styles.messageType} ${styles[msg._type]} ${msg.source === 'browser' ? styles.browser : ''}`}>
                      {msg._type} {msg.source === 'browser' ? '(browser)' : ''}
                    </span>
                    {msg._type === 'noteon' || msg._type === 'noteoff' ? (
                      <span className={styles.messageContent}>
                        Ch: {msg.channel}, Note: {msg.note}, Vel: {msg.velocity}
                      </span>
                    ) : msg._type === 'cc' ? (
                      <span className={styles.messageContent}>
                        Ch: {msg.channel}, CC: {msg.controller}, Val: {msg.value}
                      </span>
                    ) : (
                      <span className={styles.messageContent}>
                        {JSON.stringify(msg)}
                      </span>
                    )}
                  </div>
                )).reverse()
              )}
            </div>
          </div>        
        </div>
      </div>
    </div>
  )
}