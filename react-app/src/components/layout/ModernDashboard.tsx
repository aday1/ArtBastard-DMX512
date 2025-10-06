import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ModernDashboard.module.scss';

interface ModernDashboardProps {
  className?: string;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ className }) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('modernDashboardExpanded');
      return saved ? JSON.parse(saved) : true; // Default to expanded
    } catch {
      return true;
    }
  });
  
  const [activeTab, setActiveTab] = useState<'bpm' | 'dmx' | 'scenes' | 'autopilot'>('bpm');
  const [dmxViewMode, setDmxViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [dmxFilter, setDmxFilter] = useState<'all' | 'active' | 'selected' | 'range'>('all');
  const [dmxRange, setDmxRange] = useState({ start: 1, end: 32 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Store hooks
  const {
    // BPM Controls
    midiClockBpm,
    midiClockIsPlaying,
    autoSceneTempoSource,
    autoSceneManualBpm,
    autoSceneTapTempoBpm,
    setAutoSceneTempoSource,
    setManualBpm,
    recordTapTempo,
    requestToggleMasterClockPlayPause,
    requestMasterClockSourceChange,
    requestMidiClockInputList,
    requestSetMidiClockInput,
    setMidiClockBpm,
    setMidiClockIsPlaying,
    
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
    
    // Scene Controls
    scenes,
    saveScene,
    loadScene,
    quickSceneSave,
    quickSceneLoad,
    quickSceneMidiMapping,
    transitionDuration,
    transitionEasing,
    setTransitionDuration,
    setTransitionEasing,
    
    // Autopilot Controls
    autopilotTrackEnabled,
    autopilotTrackAutoPlay,
    panTiltAutopilot,
    colorSliderAutopilot,
    setAutopilotTrackEnabled,
    setAutopilotTrackAutoPlay,
    setAutopilotTrackSpeed,
    togglePanTiltAutopilot,
    toggleColorSliderAutopilot,
    setPanTiltAutopilot,
    setColorSliderAutopilot,
    
    // MIDI Learn
    startMidiLearn,
    cancelMidiLearn,
    midiLearnTarget,
    addNotification,
    
    // Socket
    socket,
  } = useStore();

  // MIDI Learn hook
  const { isLearning, learnStatus, currentLearningChannel, startLearn, cancelLearn } = useMidiLearn();

  // Local state for UI
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [midiInputs, setMidiInputs] = useState<{ inputs: string[]; currentInput: string | null }>({ inputs: [], currentInput: null });
  const [showMidiInputs, setShowMidiInputs] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('modernDashboardExpanded', JSON.stringify(isExpanded));
    } catch (error) {
      console.warn('Failed to save Dashboard expanded state:', error);
    }
  }, [isExpanded]);

  // Listen for MIDI input data from socket
  useEffect(() => {
    if (socket) {
      const handleMidiInputs = (data: { inputs: string[]; currentInput: string | null }) => {
        console.log('ModernDashboard: Received MIDI inputs:', data);
        setMidiInputs(data);
      };

      socket.on('midiClockInputs', handleMidiInputs);

      return () => {
        socket.off('midiClockInputs', handleMidiInputs);
      };
    }
  }, [socket]);

  // Visual beat indicator
  useEffect(() => {
    const currentBpm = autoSceneTempoSource === 'tap_tempo' ? autoSceneTapTempoBpm : autoSceneManualBpm;
    
    if (midiClockIsPlaying && currentBpm > 0) {
      const beatInterval = (60 / currentBpm) * 1000;
      
      const flashBeat = () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 150);
      };
      
      flashBeat();
      const intervalId = setInterval(flashBeat, beatInterval);
      
      return () => {
        clearInterval(intervalId);
      };
    } else {
      setIsFlashing(false);
    }
  }, [midiClockBpm, midiClockIsPlaying, autoSceneTempoSource, autoSceneTapTempoBpm, autoSceneManualBpm]);

  // Handle tap tempo
  const handleTap = () => {
    recordTapTempo();
    setAutoSceneTempoSource('tap_tempo');
    
    const currentTime = Date.now();
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    if (lastTapTime > 0 && (currentTime - lastTapTime) < 2000) {
      setTapCount(prev => prev + 1);
    } else {
      setTapCount(0);
    }
    
    setLastTapTime(currentTime);
    
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
      setLastTapTime(0);
    }, 3000);
  };

  // Handle BPM input change
  const handleBpmChange = (value: number) => {
    const newBpm = Math.max(60, Math.min(200, value));
    setManualBpm(newBpm);
    setAutoSceneTempoSource('manual_bpm');
    
    if (midiClockIsPlaying) {
      setMidiClockBpm(newBpm);
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (socket) {
      requestToggleMasterClockPlayPause();
    } else {
      setMidiClockIsPlaying(!midiClockIsPlaying);
      const currentBpm = autoSceneTempoSource === 'tap_tempo' ? autoSceneTapTempoBpm : autoSceneManualBpm;
      if (!midiClockIsPlaying && currentBpm > 0) {
        setMidiClockBpm(currentBpm);
      }
    }
  };

  // Handle reset
  const handleReset = () => {
    setTapCount(0);
    setLastTapTime(0);
    setMidiClockBpm(120);
    setMidiClockIsPlaying(false);
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
  };

  // DMX Channel filtering and display
  const getFilteredChannels = () => {
    let channels: number[] = [];
    
    switch (dmxFilter) {
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
        channels = Array.from({ length: dmxRange.end - dmxRange.start + 1 }, (_, i) => dmxRange.start - 1 + i);
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
  const currentBpm = autoSceneTempoSource === 'tap_tempo' ? autoSceneTapTempoBpm : autoSceneManualBpm;
  const isPlaying = midiClockIsPlaying;

  // MIDI Learn handlers
  const handleMidiLearn = (channelIndex: number) => {
    if (isLearning && currentLearningChannel === channelIndex) {
      cancelLearn();
    } else {
      startLearn(channelIndex);
    }
  };

  const handleMidiForget = (channelIndex: number) => {
    removeMidiMapping(channelIndex);
    addNotification({
      message: `MIDI mapping removed for DMX CH ${channelIndex + 1}`,
      type: 'info',
      priority: 'normal'
    });
  };

  return (
    <div className={`${styles.modernDashboard} ${className || ''} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* Header */}
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.titleSection}>
          <div className={`${styles.beatIndicator} ${isFlashing && isPlaying ? styles.flash : ''}`}>
            <div className={styles.beatDot}></div>
          </div>
          <h3 className={styles.title}>ArtBastard DMX Control</h3>
          <div className={`${styles.quickStatus} ${isPlaying ? styles.playing : ''}`}>
            <span className={`${styles.playStatus} ${isPlaying ? styles.playing : styles.stopped}`}>
              {isPlaying ? '▶️' : '⏸️'}
            </span>
            <span className={styles.bpmValue}>{currentBpm}</span>
          </div>
        </div>
        <button className={styles.expandButton} onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button 
              className={`${styles.tab} ${activeTab === 'bpm' ? styles.active : ''}`}
              onClick={() => setActiveTab('bpm')}
            >
              <LucideIcon name="Clock" />
              BPM Control
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'dmx' ? styles.active : ''}`}
              onClick={() => setActiveTab('dmx')}
            >
              <LucideIcon name="Sliders" />
              DMX Channels
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'scenes' ? styles.active : ''}`}
              onClick={() => setActiveTab('scenes')}
            >
              <LucideIcon name="Camera" />
              Scenes
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'autopilot' ? styles.active : ''}`}
              onClick={() => setActiveTab('autopilot')}
            >
              <LucideIcon name="Zap" />
              Autopilot
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* BPM Control Tab */}
            {activeTab === 'bpm' && (
              <div className={styles.bpmTab}>
                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Clock Source</label>
                  <div className={styles.sourceButtons}>
                    <button
                      className={`${styles.sourceButton} ${autoSceneTempoSource === 'manual_bpm' ? styles.active : ''}`}
                      onClick={() => setAutoSceneTempoSource('manual_bpm')}
                    >
                      Internal
                    </button>
                    <button
                      className={`${styles.sourceButton} ${autoSceneTempoSource === 'tap_tempo' ? styles.active : ''}`}
                      onClick={() => { setAutoSceneTempoSource('tap_tempo'); requestMasterClockSourceChange('internal'); }}
                    >
                      Tap
                    </button>
                    <button
                      className={`${styles.sourceButton}`}
                      onClick={() => { 
                        requestMasterClockSourceChange('midi-input'); 
                        requestMidiClockInputList(); 
                        setShowMidiInputs(true);
                      }}
                    >
                      Ext MIDI
                    </button>
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Transport</label>
                  <div className={styles.transportControls}>
                    <button
                      className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? '⏸️ Stop' : '▶️ Start'}
                    </button>
                    <button className={styles.resetButton} onClick={handleReset}>
                      🔄 Reset
                    </button>
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.sectionLabel}>BPM Setting</label>
                  <div className={styles.bpmControls}>
                    <div className={styles.bpmInput}>
                      <input
                        type="number"
                        min="60"
                        max="200"
                        value={autoSceneManualBpm}
                        onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
                        className={styles.bpmNumberInput}
                      />
                      <span className={styles.bpmLabel}>BPM</span>
                    </div>
                    <div className={styles.bpmSlider}>
                      <input
                        type="range"
                        min="60"
                        max="200"
                        value={autoSceneManualBpm}
                        onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                        className={styles.bpmRange}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.sectionLabel}>
                    Tap Tempo {tapCount > 0 && <span className={styles.tapCount}>({tapCount + 1} taps)</span>}
                  </label>
                  <button
                    className={`${styles.tapButton} ${tapCount > 0 ? styles.active : ''}`}
                    onClick={handleTap}
                  >
                    TAP
                  </button>
                </div>
              </div>
            )}

            {/* DMX Channels Tab */}
            {activeTab === 'dmx' && (
              <div className={styles.dmxTab}>
                {/* DMX Controls Header */}
                <div className={styles.dmxControlsHeader}>
                  <div className={styles.viewModeButtons}>
                    <button 
                      className={`${styles.viewModeButton} ${dmxViewMode === 'grid' ? styles.active : ''}`}
                      onClick={() => setDmxViewMode('grid')}
                    >
                      <LucideIcon name="Grid3X3" />
                      Grid
                    </button>
                    <button 
                      className={`${styles.viewModeButton} ${dmxViewMode === 'list' ? styles.active : ''}`}
                      onClick={() => setDmxViewMode('list')}
                    >
                      <LucideIcon name="List" />
                      List
                    </button>
                    <button 
                      className={`${styles.viewModeButton} ${dmxViewMode === 'compact' ? styles.active : ''}`}
                      onClick={() => setDmxViewMode('compact')}
                    >
                      <LucideIcon name="Minimize2" />
                      Compact
                    </button>
                  </div>

                  <div className={styles.filterControls}>
                    <select 
                      value={dmxFilter} 
                      onChange={(e) => setDmxFilter(e.target.value as any)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Channels</option>
                      <option value="active">Active Only</option>
                      <option value="selected">Selected Only</option>
                      <option value="range">Range</option>
                    </select>

                    {dmxFilter === 'range' && (
                      <div className={styles.rangeInputs}>
                        <input
                          type="number"
                          min="1"
                          max="512"
                          value={dmxRange.start}
                          onChange={(e) => setDmxRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                          className={styles.rangeInput}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          min="1"
                          max="512"
                          value={dmxRange.end}
                          onChange={(e) => setDmxRange(prev => ({ ...prev, end: parseInt(e.target.value) || 512 }))}
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

                  <div className={styles.selectionControls}>
                    <button onClick={selectAllChannels} className={styles.selectionButton}>
                      Select All
                    </button>
                    <button onClick={deselectAllChannels} className={styles.selectionButton}>
                      Deselect All
                    </button>
                    <span className={styles.selectionCount}>
                      {selectedChannels.length} selected
                    </span>
                  </div>
                </div>

                {/* DMX Channels Display */}
                <div className={`${styles.dmxChannelsContainer} ${styles[dmxViewMode]}`}>
                  {filteredChannels.map(channelIndex => {
                    const value = dmxChannels[channelIndex] || 0;
                    const channelName = channelNames[channelIndex] || `Channel ${channelIndex + 1}`;
                    const isSelected = selectedChannels.includes(channelIndex);
                    const hasMidiMapping = !!midiMappings[channelIndex];
                    const isChannelLearning = isLearning && currentLearningChannel === channelIndex;

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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scenes Tab */}
            {activeTab === 'scenes' && (
              <div className={styles.scenesTab}>
                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Quick Scene Controls</label>
                  <div className={styles.sceneControls}>
                    <button
                      className={styles.sceneButton}
                      onClick={quickSceneSave}
                      title="Save current DMX state as a quick scene"
                    >
                      <LucideIcon name="Camera" />
                      Quick Save
                    </button>
                    
                    <button
                      className={styles.sceneButton}
                      onClick={quickSceneLoad}
                      title="Load the most recently saved scene"
                      disabled={scenes.length === 0}
                    >
                      <LucideIcon name="Zap" />
                      Quick Load
                    </button>
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Scene Transition Settings</label>
                  <div className={styles.transitionControls}>
                    <div className={styles.transitionDuration}>
                      <label>Duration (ms)</label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="100"
                        value={transitionDuration}
                        onChange={(e) => setTransitionDuration(parseInt(e.target.value) || 1000)}
                        className={styles.transitionInput}
                      />
                    </div>
                    
                    <div className={styles.transitionEasing}>
                      <label>Easing</label>
                      <select
                        value={transitionEasing}
                        onChange={(e) => setTransitionEasing(e.target.value as any)}
                        className={styles.transitionSelect}
                      >
                        <option value="linear">Linear</option>
                        <option value="easeInOut">Ease In/Out</option>
                        <option value="easeIn">Ease In</option>
                        <option value="easeOut">Ease Out</option>
                        <option value="easeInOutCubic">Ease In/Out Cubic</option>
                        <option value="easeInOutQuart">Ease In/Out Quart</option>
                        <option value="easeInOutSine">Ease In/Out Sine</option>
                      </select>
                    </div>
                  </div>
                </div>

                {scenes.length > 0 && (
                  <div className={styles.section}>
                    <label className={styles.sectionLabel}>Available Scenes</label>
                    <div className={styles.sceneList}>
                      {scenes.map((scene, index) => (
                        <div key={index} className={styles.sceneItem}>
                          <span className={styles.sceneName}>{scene.name}</span>
                          <button
                            className={styles.loadSceneButton}
                            onClick={() => loadScene(scene.name)}
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Autopilot Tab */}
            {activeTab === 'autopilot' && (
              <div className={styles.autopilotTab}>
                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Autopilot Controls</label>
                  <div className={styles.autopilotControls}>
                    <button
                      className={`${styles.autopilotButton} ${autopilotTrackEnabled ? styles.active : ''}`}
                      onClick={() => {
                        const newEnabled = !autopilotTrackEnabled;
                        setAutopilotTrackEnabled(newEnabled);
                        if (newEnabled) {
                          setAutopilotTrackAutoPlay(true);
                        }
                      }}
                    >
                      <LucideIcon name="Bot" />
                      Track {autopilotTrackEnabled ? 'ON' : 'OFF'}
                    </button>
                    
                    <button
                      className={`${styles.autopilotButton} ${panTiltAutopilot.enabled ? styles.active : ''}`}
                      onClick={togglePanTiltAutopilot}
                    >
                      <LucideIcon name="Zap" />
                      General {panTiltAutopilot.enabled ? 'ON' : 'OFF'}
                    </button>
                    
                    <button
                      className={`${styles.autopilotButton} ${colorSliderAutopilot.enabled ? styles.active : ''}`}
                      onClick={toggleColorSliderAutopilot}
                    >
                      <LucideIcon name="Palette" />
                      Color {colorSliderAutopilot.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Speed Controls</label>
                  <div className={styles.speedControls}>
                    <div className={styles.speedControl}>
                      <label>P/T Speed</label>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={panTiltAutopilot.speed}
                        onChange={(e) => setPanTiltAutopilot({ speed: parseFloat(e.target.value) })}
                      />
                      <span>{panTiltAutopilot.speed.toFixed(1)}x</span>
                    </div>
                    <div className={styles.speedControl}>
                      <label>Color Speed</label>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={colorSliderAutopilot.speed}
                        onChange={(e) => setColorSliderAutopilot({ speed: parseFloat(e.target.value) })}
                      />
                      <span>{colorSliderAutopilot.speed.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDashboard;
