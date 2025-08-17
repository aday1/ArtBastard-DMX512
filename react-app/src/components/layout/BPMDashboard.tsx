import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import styles from './BPMDashboard.module.scss';
import { LucideIcon } from '../ui/LucideIcon';

interface BPMDashboardProps {
  className?: string;
}

export const BPMDashboard: React.FC<BPMDashboardProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(true);
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
    socket
  } = useStore();

  const handlePlayPause = () => {
    if (socket) {
      requestToggleMasterClockPlayPause();
    } else {
      const newIsPlaying = !midiClockIsPlaying;
      setMidiClockIsPlaying(newIsPlaying);
      if (newIsPlaying) {
        const currentBpm = autoSceneTempoSource === 'tap_tempo' ? midiClockBpm : autoSceneManualBpm;
        setMidiClockBpm(currentBpm > 0 ? currentBpm : 120);
      }
    }
  };

  const currentBpm = autoSceneTempoSource === 'tap_tempo' ? midiClockBpm : autoSceneManualBpm;
  const isPlaying = midiClockIsPlaying;

  useEffect(() => {
    if (isPlaying && currentBpm > 0) {
      const beatInterval = (60 / currentBpm) * 1000;
      const flashBeat = () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 150);
      };
      flashBeat();
      const intervalId = setInterval(flashBeat, beatInterval);
      return () => clearInterval(intervalId);
    } else {
      setIsFlashing(false);
    }
  }, [isPlaying, currentBpm]);

  const handleTap = () => {
    const currentTime = Date.now();
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    if (lastTapTime > 0 && (currentTime - lastTapTime) < 2000) {
      setTapCount(prev => prev + 1);
      recordTapTempo();
    } else {
      setTapCount(1);
      recordTapTempo();
    }
    
    setLastTapTime(currentTime);
    
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);
  };

  if (!isExpanded) {
    return (
      <div 
        className={styles.collapsedPlaceholder}
        onClick={() => setIsExpanded(true)}
      >
        <LucideIcon name="Gauge" />
        <span>{currentBpm.toFixed(1)} BPM</span>
      </div>
    );
  }

  return (
    <div className={`${styles.bpmDashboard} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.titleSection}>
          <div className={`${styles.beatIndicator} ${isFlashing ? styles.flashing : ''}`}>
            <div className={styles.beatDot} />
          </div>
          <h3 className={styles.title}>BPM Dashboard</h3>
        </div>
        <div className={styles.bpmDisplay}>
          <span className={styles.bpmValue}>{currentBpm.toFixed(1)}</span>
          <span className={styles.bpmLabel}>BPM</span>
        </div>
        <button className={styles.expandButton}>
          <LucideIcon name={isExpanded ? "ChevronDown" : "ChevronUp"} />
        </button>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.mainControls}>
          <button 
            className={`${styles.playPauseButton} ${isPlaying ? styles.playing : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
          >
            <LucideIcon name={isPlaying ? "Pause" : "Play"} />
            <span>{isPlaying ? 'Playing' : 'Paused'}</span>
          </button>
          <button 
            className={styles.tapButton}
            onClick={(e) => {
              e.stopPropagation();
              handleTap();
            }}
          >
            <LucideIcon name="MousePointer" />
            <span>TAP {tapCount > 0 ? `(${tapCount})` : ''}</span>
          </button>
        </div>
        
        <div className={styles.tempoSource}>
          <button 
            className={autoSceneTempoSource === 'tap_tempo' ? styles.active : ''}
            onClick={(e) => {
              e.stopPropagation();
              setAutoSceneTempoSource('tap_tempo');
            }}
          >
            Tap
          </button>
          <button 
            className={autoSceneTempoSource === 'manual_bpm' ? styles.active : ''}
            onClick={(e) => {
              e.stopPropagation();
              setAutoSceneTempoSource('manual_bpm');
            }}
          >
            Manual
          </button>
        </div>
        
        <div className={styles.manualBpm}>
          <input
            type="range"
            min="30"
            max="240"
            step="0.1"
            value={autoSceneManualBpm}
            onChange={(e) => {
              e.stopPropagation();
              const newBpm = parseFloat(e.target.value);
              setManualBpm(newBpm);
              if (autoSceneTempoSource === 'manual_bpm') {
                setMidiClockBpm(newBpm);
              }
            }}
            className={styles.bpmSlider}
          />
          <input
            type="number"
            min="30"
            max="240"
            value={autoSceneManualBpm.toFixed(1)}
            onChange={(e) => {
              e.stopPropagation();
              const newBpm = parseFloat(e.target.value);
              if (!isNaN(newBpm)) {
                setManualBpm(newBpm);
                if (autoSceneTempoSource === 'manual_bpm') {
                  setMidiClockBpm(newBpm);
                }
              }
            }}
            className={styles.bpmInput}
          />
        </div>
      </div>
    </div>
  );
};

export default BPMDashboard;
