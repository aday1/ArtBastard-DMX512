import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import styles from './BPMDashboard.module.scss';

interface BPMDashboardProps {
  className?: string;
}

export const BPMDashboard: React.FC<BPMDashboardProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    midiClockBpm,
    midiClockIsPlaying,
    autoSceneTempoSource,
    autoSceneManualBpm,
    setAutoSceneTempoSource,
    setManualBpm,
    recordTapTempo,
    requestToggleMasterClockPlayPause,
    setMidiClockBpm,
    setMidiClockIsPlaying,
    socket,
    // Autopilot controls
    autopilotTrackEnabled,
    autopilotTrackAutoPlay,
    panTiltAutopilot,
    channelAutopilots,
    setAutopilotTrackEnabled,
    setAutopilotTrackAutoPlay,
    togglePanTiltAutopilot
  } = useStore();

  // Handle play/pause with better feedback
  const handlePlayPause = () => {
    console.log('BPM Dashboard: Play/Pause clicked', { 
      currentlyPlaying: midiClockIsPlaying, 
      socketExists: !!socket,
      currentBPM: autoSceneTempoSource === 'tap_tempo' ? midiClockBpm : autoSceneManualBpm 
    });
    
    if (socket) {
      // Use server-side toggle
      requestToggleMasterClockPlayPause();
    } else {
      // Local fallback - directly toggle the state
      console.log('BPM Dashboard: Using local fallback for play/pause');
      setMidiClockIsPlaying(!midiClockIsPlaying);
      
      // Also set BPM if we're starting
      const currentBpm = autoSceneTempoSource === 'tap_tempo' ? midiClockBpm : autoSceneManualBpm;
      if (!midiClockIsPlaying && currentBpm > 0) {
        setMidiClockBpm(currentBpm);
      }
    }
  };

  const currentBpm = autoSceneTempoSource === 'tap_tempo' ? midiClockBpm : autoSceneManualBpm;
  const isPlaying = midiClockIsPlaying;

  // Visual beat indicator
  useEffect(() => {
    console.log('BPM Dashboard: Beat indicator effect', { 
      isPlaying: midiClockIsPlaying, 
      bpm: midiClockBpm,
      currentBpm 
    });
    
    if (midiClockIsPlaying && currentBpm > 0) {
      const beatInterval = (60 / currentBpm) * 1000; // Use currentBpm instead of midiClockBpm
      console.log('BPM Dashboard: Starting beat indicator', { beatInterval, bpm: currentBpm });
      
      const flashBeat = () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 150); // Slightly longer flash for visibility
      };
      
      // Immediate first flash
      flashBeat();
      
      const intervalId = setInterval(flashBeat, beatInterval);
      
      return () => {
        console.log('BPM Dashboard: Stopping beat indicator');
        clearInterval(intervalId);
      };
    } else {
      console.log('BPM Dashboard: Beat indicator stopped - not playing or BPM is 0');
      setIsFlashing(false);
    }
  }, [midiClockBpm, midiClockIsPlaying, currentBpm]);

  // Handle tap tempo
  const handleTap = () => {
    const currentTime = Date.now();
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    if (lastTapTime > 0 && (currentTime - lastTapTime) < 2000) {
      // Valid tap within 2 seconds
      setTapCount(prev => prev + 1);
      
      // Calculate BPM from tap interval
      if (tapCount >= 1) {
        const tapInterval = currentTime - lastTapTime;
        const calculatedBPM = Math.round(60000 / tapInterval);
        
        if (calculatedBPM >= 60 && calculatedBPM <= 200) {
          setManualBpm(calculatedBPM);
          setAutoSceneTempoSource('manual_bpm');
          recordTapTempo();
        }
      }
    } else {
      // First tap or reset after timeout
      setTapCount(0);
    }
    
    setLastTapTime(currentTime);
    
    // Reset tap count after 3 seconds of inactivity
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
      setLastTapTime(0);
    }, 3000);
  };

  // Handle BPM input change
  const handleBpmChange = (value: number) => {
    const newBpm = Math.max(60, Math.min(200, value));
    console.log('BPM Dashboard: BPM changed to', newBpm);
    setManualBpm(newBpm);
    setAutoSceneTempoSource('manual_bpm');
    
    // If we're currently playing, update the active BPM immediately
    if (midiClockIsPlaying) {
      setMidiClockBpm(newBpm);
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

  return (
    <div className={`${styles.bpmDashboard} ${className || ''} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.titleSection}>
          <div className={`${styles.beatIndicator} ${isFlashing && isPlaying ? styles.flash : ''}`}>
            <div className={styles.beatDot}></div>
          </div>
          <h3 className={styles.title}>BPM Control</h3>
          <div className={`${styles.quickStatus} ${isPlaying ? styles.playing : ''}`}>
            <span className={`${styles.playStatus} ${isPlaying ? styles.playing : styles.stopped}`}>
              {isPlaying ? '▶️' : '⏸️'}
            </span>
            <span className={styles.bpmValue}>{currentBpm}</span>
          </div>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.controls}>
          <div className={styles.sourceSection}>
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
                onClick={() => setAutoSceneTempoSource('tap_tempo')}
              >
                MIDI Clock
              </button>
            </div>
          </div>

          <div className={styles.transportSection}>
            <label className={styles.sectionLabel}>Transport</label>
            <div className={styles.transportControls}>
              <button
                className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                onClick={handlePlayPause}
              >
                {isPlaying ? '⏸️ Stop' : '▶️ Start'}
              </button>
              <button
                className={styles.resetButton}
                onClick={handleReset}
              >
                🔄 Reset
              </button>
            </div>
          </div>

          <div className={styles.bpmSection}>
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

          <div className={styles.tapSection}>
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

          <div className={styles.autopilotSection}>
            <label className={styles.sectionLabel}>Autopilot Controls</label>
            <div className={styles.autopilotControls}>
              <button
                className={`${styles.autopilotButton} ${autopilotTrackEnabled ? styles.active : ''}`}
                onClick={() => {
                  const newEnabled = !autopilotTrackEnabled;
                  setAutopilotTrackEnabled(newEnabled);
                  // Also enable auto-play when enabling track autopilot
                  if (newEnabled) {
                    setAutopilotTrackAutoPlay(true);
                  }
                }}
                title={autopilotTrackEnabled ? 'Disable Pan/Tilt Track Autopilot' : 'Enable Pan/Tilt Track Autopilot'}
              >
                <span className={styles.autopilotIcon}>🤖</span>
                Track {autopilotTrackEnabled ? 'ON' : 'OFF'}
              </button>
              
              <button
                className={`${styles.autopilotButton} ${panTiltAutopilot.enabled ? styles.active : ''}`}
                onClick={togglePanTiltAutopilot}
                title={panTiltAutopilot.enabled ? 'Disable General Autopilot' : 'Enable General Autopilot'}
              >
                <span className={styles.autopilotIcon}>⚡</span>
                General {panTiltAutopilot.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {(autopilotTrackEnabled || panTiltAutopilot.enabled || Object.keys(channelAutopilots).length > 0) && (
              <div className={styles.autopilotStatus}>
                <div className={styles.statusIndicators}>
                  {autopilotTrackEnabled && (
                    <span className={styles.statusBadge}>
                      Track {autopilotTrackAutoPlay ? '(Moving)' : '(Static)'}
                    </span>
                  )}
                  {panTiltAutopilot.enabled && (
                    <span className={styles.statusBadge}>General ({panTiltAutopilot.pathType})</span>
                  )}
                  {Object.keys(channelAutopilots).length > 0 && (
                    <span className={styles.statusBadge}>{Object.keys(channelAutopilots).length} Channels</span>
                  )}
                </div>
                <button 
                  className={styles.debugButton}
                  onClick={() => {
                    console.log('🔍 AUTOPILOT DEBUG INFO:');
                    console.log('Track Autopilot Enabled:', autopilotTrackEnabled);
                    console.log('Track Auto-Play Enabled:', autopilotTrackAutoPlay);
                    console.log('General Autopilot Enabled:', panTiltAutopilot.enabled);
                    console.log('Channel Autopilots:', Object.keys(channelAutopilots).length);
                  }}
                  title="Debug autopilot status to console"
                >
                  🐛 Debug
                </button>
              </div>
            )}
          </div>

          <div className={styles.statusSection}>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Source:</span>
                <span className={styles.statusValue}>
                  {autoSceneTempoSource === 'tap_tempo' ? 'MIDI Clock' : 'Internal'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Current BPM:</span>
                <span className={`${styles.statusValue} ${styles.bpmHighlight}`}>{currentBpm}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Status:</span>
                <span className={`${styles.statusValue} ${isPlaying ? styles.playingText : styles.stoppedText}`}>
                  {isPlaying ? 'Playing' : 'Stopped'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Automation:</span>
                <span className={`${styles.statusValue} ${isPlaying ? styles.activeText : styles.pausedText}`}>
                  {isPlaying ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BPMDashboard;
