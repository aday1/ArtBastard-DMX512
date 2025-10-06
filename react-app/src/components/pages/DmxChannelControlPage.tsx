import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import { useGlobalBrowserMidi } from '../../hooks/useGlobalBrowserMidi';
import { useElectronMidi } from '../../hooks/useElectronMidi';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './DmxChannelControlPage.module.scss';

export const DmxChannelControlPage: React.FC = () => {
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [filter, setFilter] = useState<'all' | 'active' | 'selected' | 'range'>('all');
  const [range, setRange] = useState({ start: 1, end: 32 });
  const [searchTerm, setSearchTerm] = useState('');
  const [channelsPerPage, setChannelsPerPage] = useState(32);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSceneControls, setShowSceneControls] = useState(true);
  const [showMidiControls, setShowMidiControls] = useState(true);
  const [showMidiMonitor, setShowMidiMonitor] = useState(false);
  const [midiMonitorMessages, setMidiMonitorMessages] = useState<any[]>([]);
  const [showOscControls, setShowOscControls] = useState(false);

  // Store hooks
  const {
    // DMX Controls
    dmxChannels,
    selectedChannels,
    channelNames,
    setDmxChannel,
    toggleChannelSelection,
    selectAllChannels,
    deselectAllChannels,
    midiMappings,
    removeMidiMapping,
    addMidiMapping,
    oscAssignments,
    setOscAssignment,
    
    // Scene Controls
    scenes,
    saveScene,
    loadScene,
    addNotification,
    
    // MIDI Learn
    startMidiLearn,
    cancelMidiLearn,
    midiLearnTarget,
  } = useStore();

  // MIDI Learn hook
  const { isLearning, learnStatus, currentLearningChannel, startLearn, cancelLearn } = useMidiLearn();

  // Global Browser MIDI hook
  const {
    isSupported: browserMidiSupported,
    error: browserMidiError,
    browserInputs,
    activeBrowserInputs,
    connectBrowserInput,
    disconnectBrowserInput,
    refreshDevices
  } = useGlobalBrowserMidi();

  // Electron MIDI hook (preferred when available)
  const {
    isSupported: electronMidiSupported,
    error: electronMidiError,
    devices: electronDevices,
    connectedDevices: electronConnectedDevices,
    isRefreshing: electronRefreshing,
    loadMidiDevices: electronLoadDevices,
    connectDevice: electronConnectDevice,
    disconnectDevice: electronDisconnectDevice,
    isElectron
  } = useElectronMidi();

  // Get filtered channels
  const getFilteredChannels = () => {
    let channels: number[] = [];
    
    switch (filter) {
      case 'all':
        channels = Array.from({ length: 512 }, (_, i) => i);
        break;
      case 'active':
        channels = Array.from({ length: 512 }, (_, i) => i).filter(i => (dmxChannels[i] || 0) > 0);
        break;
      case 'selected':
        channels = selectedChannels;
        break;
      case 'range':
        channels = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);
        break;
    }
    
    // Apply search filter
    if (searchTerm) {
      channels = channels.filter(channel => {
        const channelName = channelNames[channel] || `Channel ${channel + 1}`;
        return channelName.toLowerCase().includes(searchTerm.toLowerCase()) || 
               (channel + 1).toString().includes(searchTerm);
      });
    }
    
    return channels;
  };

  const filteredChannels = getFilteredChannels();
  const totalPages = Math.ceil(filteredChannels.length / channelsPerPage);
  const startIndex = currentPage * channelsPerPage;
  const endIndex = Math.min(startIndex + channelsPerPage, filteredChannels.length);
  const displayedChannels = filteredChannels.slice(startIndex, endIndex);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filter, range, searchTerm]);

  // MIDI message monitoring
  useEffect(() => {
    if (!showMidiMonitor) return;

    const unsubscribe = useStore.subscribe((state) => {
      const midiMessages = state.midiMessages;
      if (midiMessages.length > 0) {
        const latestMessage = midiMessages[midiMessages.length - 1];
        setMidiMonitorMessages(prev => {
          const newMessages = [...prev, latestMessage].slice(-50); // Keep last 50 messages
          return newMessages;
        });
      }
    });

    return unsubscribe;
  }, [showMidiMonitor]);

  // Debug MIDI mappings changes
  useEffect(() => {
    console.log(`[DMXChannelControl] MIDI mappings updated:`, midiMappings);
    console.log(`[DMXChannelControl] MIDI mappings count:`, Object.keys(midiMappings).length);
    
    // Test: Add a debug mapping to channel 0 to test Forget button visibility
    if (Object.keys(midiMappings).length === 0) {
      console.log(`[DMXChannelControl] No MIDI mappings found. Testing with debug mapping...`);
      // Uncomment the line below to test Forget button visibility
      // addMidiMapping(0, { channel: 0, controller: 1 });
    }
  }, [midiMappings]);

  // MIDI Learn handlers
  const handleMidiLearn = (channelIndex: number) => {
    console.log(`[DMXChannelControl] MIDI Learn clicked for channel ${channelIndex}`);
    console.log(`[DMXChannelControl] Current state:`, {
      isLearning,
      currentLearningChannel,
      midiLearnTarget,
      midiMappings: Object.keys(midiMappings).length
    });
    
    if (isLearning && currentLearningChannel === channelIndex) {
      console.log(`[DMXChannelControl] Cancelling MIDI Learn for channel ${channelIndex}`);
      cancelLearn();
    } else {
      console.log(`[DMXChannelControl] Starting MIDI Learn for channel ${channelIndex}`);
      startLearn(channelIndex);
    }
  };

  const handleMidiForget = (channelIndex: number) => {
    console.log(`[DMXChannelControl] MIDI Forget clicked for channel ${channelIndex}`);
    console.log(`[DMXChannelControl] Current mapping:`, midiMappings[channelIndex]);
    
    removeMidiMapping(channelIndex);
    addNotification({
      message: `MIDI mapping removed for DMX CH ${channelIndex + 1}`,
      type: 'info',
      priority: 'normal'
    });
  };

  // MIDI connection handlers
  const handleMidiConnect = (inputId: string) => {
    if (isElectron && electronMidiSupported) {
      electronConnectDevice(inputId);
      addNotification({
        message: `Connected to MIDI input (Native): ${inputId}`,
        type: 'success',
        priority: 'normal'
      });
    } else {
      connectBrowserInput(inputId);
      addNotification({
        message: `Connected to MIDI input (Web): ${inputId}`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  const handleMidiDisconnect = (inputId: string) => {
    if (isElectron && electronMidiSupported) {
      electronDisconnectDevice(inputId);
      addNotification({
        message: `Disconnected from MIDI input (Native): ${inputId}`,
        type: 'info',
        priority: 'normal'
      });
    } else {
      disconnectBrowserInput(inputId);
      addNotification({
        message: `Disconnected from MIDI input (Web): ${inputId}`,
        type: 'info',
        priority: 'normal'
      });
    }
  };

  const handleRefreshMidiDevices = () => {
    if (isElectron && electronMidiSupported) {
      electronLoadDevices();
      addNotification({
        message: 'MIDI devices refreshed (Native)',
        type: 'info',
        priority: 'normal'
      });
    } else {
      refreshDevices();
      addNotification({
        message: 'MIDI devices refreshed (Web)',
        type: 'info',
        priority: 'normal'
      });
    }
  };

  // OSC assignment handlers
  const handleSetOscAddress = (channelIndex: number) => {
    const currentAddress = oscAssignments[channelIndex] || '';
    const newAddress = prompt(`Enter OSC address for DMX CH ${channelIndex + 1}:`, currentAddress);
    if (newAddress !== null) {
      setOscAssignment(channelIndex, newAddress);
      addNotification({
        message: `OSC address set for DMX CH ${channelIndex + 1}: ${newAddress}`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  // Scene handlers
  const handleSaveScene = () => {
    const sceneName = prompt('Enter scene name:');
    if (sceneName) {
      const oscAddress = prompt('Enter OSC address (optional):') || `/scene/${sceneName}`;
      saveScene(sceneName, oscAddress);
      addNotification({
        message: `Scene "${sceneName}" saved successfully`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  const handleLoadScene = (sceneName: string) => {
    loadScene(sceneName);
    addNotification({
      message: `Scene "${sceneName}" loaded successfully`,
      type: 'success',
      priority: 'normal'
    });
  };

  // Pagination handlers
  const handlePageChange = (direction: 'prev' | 'next' | 'first' | 'last') => {
    switch (direction) {
      case 'prev':
        setCurrentPage(Math.max(0, currentPage - 1));
        break;
      case 'next':
        setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
        break;
      case 'first':
        setCurrentPage(0);
        break;
      case 'last':
        setCurrentPage(totalPages - 1);
        break;
    }
  };

  return (
    <div className={styles.dmxChannelControlPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <LucideIcon name="Sliders" />
            DMX Channel Control
          </h1>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <LucideIcon name="Zap" />
              {Object.values(dmxChannels).filter(v => v > 0).length} Active
            </span>
            <span className={styles.stat}>
              <LucideIcon name="CheckSquare" />
              {selectedChannels.length} Selected
            </span>
            <span className={styles.stat}>
              <LucideIcon name="Music" />
              {Object.keys(midiMappings).length} MIDI Mapped
            </span>
            {isLearning && (
              <span className={`${styles.stat} ${styles.learningStat}`}>
                <LucideIcon name="Radio" />
                Learning CH {currentLearningChannel !== null ? currentLearningChannel + 1 : '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className={styles.controlsPanel}>
        {/* View Mode Controls */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>View Mode</label>
          <div className={styles.viewModeButtons}>
            <button 
              className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LucideIcon name="Grid3X3" />
              Grid
            </button>
            <button 
              className={`${styles.viewModeButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <LucideIcon name="List" />
              List
            </button>
            <button 
              className={`${styles.viewModeButton} ${viewMode === 'compact' ? styles.active : ''}`}
              onClick={() => setViewMode('compact')}
            >
              <LucideIcon name="Minimize2" />
              Compact
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Filter</label>
          <div className={styles.filterControls}>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">All Channels</option>
              <option value="active">Active Only</option>
              <option value="selected">Selected Only</option>
              <option value="range">Range</option>
            </select>

            {filter === 'range' && (
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  min="1"
                  max="512"
                  value={range.start}
                  onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                  className={styles.rangeInput}
                />
                <span>-</span>
                <input
                  type="number"
                  min="1"
                  max="512"
                  value={range.end}
                  onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 512 }))}
                  className={styles.rangeInput}
                />
              </div>
            )}

            <div className={styles.searchInput}>
              <LucideIcon name="Search" />
              <input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchField}
              />
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Selection</label>
          <div className={styles.selectionControls}>
            <button onClick={selectAllChannels} className={styles.selectionButton}>
              <LucideIcon name="CheckSquare" />
              Select All
            </button>
            <button onClick={deselectAllChannels} className={styles.selectionButton}>
              <LucideIcon name="Square" />
              Deselect All
            </button>
            <span className={styles.selectionCount}>
              {selectedChannels.length} selected
            </span>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Pagination</label>
          <div className={styles.paginationControls}>
            <select 
              value={channelsPerPage} 
              onChange={(e) => setChannelsPerPage(parseInt(e.target.value))}
              className={styles.pageSizeSelect}
            >
              <option value={16}>16 per page</option>
              <option value={32}>32 per page</option>
              <option value={64}>64 per page</option>
              <option value={128}>128 per page</option>
            </select>
            
            <div className={styles.pageNavigation}>
              <button 
                onClick={() => handlePageChange('first')}
                disabled={currentPage === 0}
                className={styles.pageButton}
              >
                <LucideIcon name="ChevronsLeft" />
              </button>
              <button 
                onClick={() => handlePageChange('prev')}
                disabled={currentPage === 0}
                className={styles.pageButton}
              >
                <LucideIcon name="ChevronLeft" />
              </button>
              <span className={styles.pageInfo}>
                {currentPage + 1} of {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange('next')}
                disabled={currentPage >= totalPages - 1}
                className={styles.pageButton}
              >
                <LucideIcon name="ChevronRight" />
              </button>
              <button 
                onClick={() => handlePageChange('last')}
                disabled={currentPage >= totalPages - 1}
                className={styles.pageButton}
              >
                <LucideIcon name="ChevronsRight" />
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Controls */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Display Options</label>
          <div className={styles.toggleControls}>
            <button 
              className={`${styles.toggleButton} ${showSceneControls ? styles.active : ''}`}
              onClick={() => setShowSceneControls(!showSceneControls)}
            >
              <LucideIcon name="Camera" />
              Scene Controls
            </button>
            <button 
              className={`${styles.toggleButton} ${showMidiControls ? styles.active : ''}`}
              onClick={() => setShowMidiControls(!showMidiControls)}
            >
              <LucideIcon name="Music" />
              MIDI Controls
            </button>
            <button 
              className={`${styles.toggleButton} ${showMidiMonitor ? styles.active : ''}`}
              onClick={() => setShowMidiMonitor(!showMidiMonitor)}
            >
              <LucideIcon name="Activity" />
              MIDI Monitor
            </button>
            <button 
              className={`${styles.toggleButton} ${showOscControls ? styles.active : ''}`}
              onClick={() => setShowOscControls(!showOscControls)}
            >
              <LucideIcon name="Globe" />
              OSC Controls
            </button>
          </div>
        </div>
      </div>

      {/* Scene Controls */}
      {showSceneControls && (
        <div className={styles.sceneControls}>
          <div className={styles.sceneSection}>
            <h3 className={styles.sectionTitle}>
              <LucideIcon name="Camera" />
              Scene Management
            </h3>
            <div className={styles.sceneActions}>
              <button
                className={styles.sceneButton}
                onClick={handleSaveScene}
                title="Save current DMX state as a scene"
              >
                <LucideIcon name="Save" />
                Save Scene
              </button>
              
              {scenes.length > 0 && (
                <div className={styles.sceneList}>
                  <label className={styles.sceneListLabel}>Load Scene:</label>
                  <div className={styles.sceneButtons}>
                    {scenes.map((scene, index) => (
                      <button
                        key={index}
                        className={styles.loadSceneButton}
                        onClick={() => handleLoadScene(scene.name)}
                        title={`Load scene: ${scene.name}`}
                      >
                        <LucideIcon name="Play" />
                        {scene.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MIDI Connection Controls */}
      {showMidiControls && (
        <div className={styles.midiControls}>
          <div className={styles.midiSection}>
            <h3 className={styles.sectionTitle}>
              <LucideIcon name="Music" />
              MIDI Connection
            </h3>
            
            {browserMidiError && (
              <div className={styles.errorMessage}>
                <LucideIcon name="AlertCircle" />
                MIDI Error: {browserMidiError}
              </div>
            )}

            {electronMidiError && (
              <div className={styles.errorMessage}>
                <LucideIcon name="AlertCircle" />
                Electron MIDI Error: {electronMidiError}
              </div>
            )}

            {!browserMidiSupported && !electronMidiSupported && (
              <div className={styles.warningMessage}>
                <LucideIcon name="AlertTriangle" />
                No MIDI support available
              </div>
            )}

            {isElectron && (
              <div className={styles.infoMessage}>
                <LucideIcon name="CheckCircle" />
                Running in Electron - Native MIDI support available
              </div>
            )}

            {(browserMidiSupported || electronMidiSupported) && (
              <div className={styles.midiDevices}>
                <div className={styles.deviceHeader}>
                  <label className={styles.deviceLabel}>
                    Available MIDI Devices {isElectron ? '(Native)' : '(Web)'}:
                  </label>
                  <button 
                    className={styles.refreshButton}
                    onClick={handleRefreshMidiDevices}
                    disabled={electronRefreshing}
                    title="Refresh MIDI devices"
                  >
                    <LucideIcon name="RefreshCw" />
                    Refresh
                  </button>
                </div>
                
                {(() => {
                  const devices = isElectron && electronMidiSupported ? electronDevices.inputs : browserInputs;
                  const connectedDevices = isElectron && electronMidiSupported ? electronConnectedDevices : activeBrowserInputs;
                  
                  if (devices.length === 0) {
                    return (
                      <div className={styles.noDevices}>
                        No MIDI devices found. Connect a MIDI device and click Refresh.
                      </div>
                    );
                  }
                  
                  return (
                    <div className={styles.deviceList}>
                      {devices.map((input) => {
                        const isConnected = connectedDevices.includes(input.id);
                        return (
                          <div key={input.id} className={styles.deviceItem}>
                            <div className={styles.deviceInfo}>
                              <span className={styles.deviceName}>{input.name}</span>
                              <span className={styles.deviceId}>{input.id}</span>
                            </div>
                            <div className={styles.deviceActions}>
                              {isConnected ? (
                                <button
                                  className={styles.disconnectButton}
                                  onClick={() => handleMidiDisconnect(input.id)}
                                  title="Disconnect MIDI device"
                                >
                                  <LucideIcon name="X" />
                                  Disconnect
                                </button>
                              ) : (
                                <button
                                  className={styles.connectButton}
                                  onClick={() => handleMidiConnect(input.id)}
                                  title="Connect MIDI device"
                                >
                                  <LucideIcon name="Link" />
                                  Connect
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MIDI Monitor */}
      {showMidiMonitor && (
        <div className={styles.midiMonitor}>
          <div className={styles.monitorSection}>
            <h3 className={styles.sectionTitle}>
              <LucideIcon name="Activity" />
              MIDI Monitor
            </h3>
            
            <div className={styles.monitorControls}>
              <button 
                className={styles.clearMonitorButton}
                onClick={() => setMidiMonitorMessages([])}
                title="Clear MIDI monitor"
              >
                <LucideIcon name="Trash2" />
                Clear Monitor
              </button>
              <span className={styles.monitorCount}>
                {midiMonitorMessages.length} messages
              </span>
            </div>

            <div className={styles.monitorMessages}>
              {midiMonitorMessages.length === 0 ? (
                <div className={styles.noMessages}>
                  No MIDI messages received yet. Move a MIDI control to see messages here.
                </div>
              ) : (
                midiMonitorMessages.slice().reverse().map((message, index) => (
                  <div key={index} className={styles.monitorMessage}>
                    <span className={styles.messageTime}>
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span className={styles.messageType}>
                      {message._type?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className={styles.messageChannel}>
                      Ch {message.channel + 1}
                    </span>
                    {message._type === 'cc' && (
                      <>
                        <span className={styles.messageController}>
                          CC {message.controller}
                        </span>
                        <span className={styles.messageValue}>
                          {message.value}
                        </span>
                      </>
                    )}
                    {message._type === 'noteon' && (
                      <>
                        <span className={styles.messageNote}>
                          Note {message.note}
                        </span>
                        <span className={styles.messageVelocity}>
                          Vel {message.velocity}
                        </span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DMX Channels Display */}
      <div className={`${styles.dmxChannelsContainer} ${styles[viewMode]}`}>
        {displayedChannels.map(channelIndex => {
          const value = dmxChannels[channelIndex] || 0;
          const channelName = channelNames[channelIndex] || `Channel ${channelIndex + 1}`;
          const isSelected = selectedChannels.includes(channelIndex);
          const hasMidiMapping = !!midiMappings[channelIndex];
          const isChannelLearning = isLearning && currentLearningChannel === channelIndex;
          const mapping = midiMappings[channelIndex];

          return (
            <div 
              key={channelIndex} 
              className={`${styles.dmxChannel} ${isSelected ? styles.selected : ''} ${value > 0 ? styles.active : ''}`}
            >
              <div className={styles.channelHeader}>
                <div className={styles.channelInfo}>
                  <span className={styles.channelNumber}>{channelIndex + 1}</span>
                  <span className={styles.channelName}>{channelName}</span>
                </div>
                <div className={styles.channelValue}>
                  <span className={styles.valueDisplay}>{value}</span>
                  <span className={styles.valuePercent}>{Math.round((value / 255) * 100)}%</span>
                </div>
              </div>

              <div className={styles.channelSlider}>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={value}
                  onChange={(e) => setDmxChannel(channelIndex, parseInt(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.channelActions}>
                <button
                  className={`${styles.selectButton} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleChannelSelection(channelIndex)}
                  title="Select/Deselect channel"
                >
                  <LucideIcon name={isSelected ? "CheckSquare" : "Square"} />
                </button>

                <div className={styles.midiControls}>
                  <button
                    className={`${styles.midiLearnButton} ${isChannelLearning ? styles.learning : ''} ${hasMidiMapping ? styles.mapped : ''}`}
                    onClick={() => handleMidiLearn(channelIndex)}
                    title={isChannelLearning ? 'Cancel MIDI Learn' : hasMidiMapping ? 'Remap MIDI' : 'Learn MIDI'}
                  >
                    <LucideIcon name={isChannelLearning ? "Radio" : hasMidiMapping ? "Unlink" : "Link"} />
                    {isChannelLearning ? 'Learning...' : hasMidiMapping ? 'Mapped' : 'Learn'}
                  </button>
                  
                  {hasMidiMapping && !isChannelLearning && (
                    <button
                      className={styles.midiForgetButton}
                      onClick={() => handleMidiForget(channelIndex)}
                      title="Remove MIDI mapping"
                    >
                      <LucideIcon name="Trash2" />
                      Forget
                    </button>
                  )}
                </div>

                {showOscControls && (
                  <div className={styles.oscControls}>
                    <button
                      className={styles.oscAddressButton}
                      onClick={() => handleSetOscAddress(channelIndex)}
                      title="Set OSC address for this channel"
                    >
                      <LucideIcon name="Globe" />
                      OSC
                    </button>
                  </div>
                )}
              </div>

              {/* MIDI Mapping Display */}
              {hasMidiMapping && mapping && (
                <div className={styles.midiMappingDisplay}>
                  <span className={styles.midiMappingText}>
                    {mapping.controller !== undefined 
                      ? `CC ${mapping.controller} (Ch ${mapping.channel + 1})`
                      : `Note ${mapping.note} (Ch ${mapping.channel + 1})`
                    }
                  </span>
                </div>
              )}

              {/* OSC Address Display */}
              {showOscControls && oscAssignments[channelIndex] && (
                <div className={styles.oscAddressDisplay}>
                  <span className={styles.oscAddressText}>
                    OSC: {oscAssignments[channelIndex]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          <span>Showing {displayedChannels.length} of {filteredChannels.length} channels</span>
          <span>•</span>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <span>•</span>
          <span>{Object.keys(midiMappings).length} MIDI mappings</span>
        </div>
      </div>
    </div>
  );
};

export default DmxChannelControlPage;
