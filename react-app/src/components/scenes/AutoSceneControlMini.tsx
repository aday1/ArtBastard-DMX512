import React, { useState, useEffect, useRef } from 'react';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './AutoSceneControlMini.module.scss';

interface AutoSceneControlMiniProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const AutoSceneControlMini: React.FC<AutoSceneControlMiniProps> = ({
  isCollapsed = false,
  onCollapsedChange,
}) => {
  // Local state for manual/tap tempo clock management
  const [localBeatCounter, setLocalBeatCounter] = useState(0);
  const [isLocalClockPlaying, setIsLocalClockPlaying] = useState(false);
  const prevBeatRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    autoSceneEnabled,
    autoSceneList,
    autoSceneCurrentIndex,
    autoSceneTempoSource,
    autoSceneManualBpm,
    autoSceneTapTempoBpm,
    autoSceneBeatDivision,
    autoSceneIsFlashing,
    midiClockIsPlaying,
    midiClockCurrentBeat,
  } = useStore(state => ({
    autoSceneEnabled: state.autoSceneEnabled,
    autoSceneList: state.autoSceneList,
    autoSceneCurrentIndex: state.autoSceneCurrentIndex,
    autoSceneTempoSource: state.autoSceneTempoSource,
    autoSceneManualBpm: state.autoSceneManualBpm,
    autoSceneTapTempoBpm: state.autoSceneTapTempoBpm,
    autoSceneBeatDivision: state.autoSceneBeatDivision,
    autoSceneIsFlashing: state.autoSceneIsFlashing,
    midiClockIsPlaying: state.midiClockIsPlaying,
    midiClockCurrentBeat: state.midiClockCurrentBeat,
  }));

  const {
    setAutoSceneEnabled,
    setAutoSceneTempoSource,
    recordTapTempo,
    requestToggleMasterClockPlayPause,
    setManualBpm,
    setNextAutoSceneIndex,
    loadScene,
    triggerAutoSceneFlash,
  } = useStore(state => ({
    setAutoSceneEnabled: state.setAutoSceneEnabled,
    setAutoSceneTempoSource: state.setAutoSceneTempoSource,
    recordTapTempo: state.recordTapTempo,
    requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause,
    setManualBpm: state.setManualBpm,
    setNextAutoSceneIndex: state.setNextAutoSceneIndex,
    loadScene: state.loadScene,
    triggerAutoSceneFlash: state.triggerAutoSceneFlash,
  }));

  // Independent clock management for manual_bpm and tap_tempo modes
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!autoSceneEnabled || autoSceneList.length === 0 || autoSceneBeatDivision <= 0) {
      setLocalBeatCounter(0);
      setIsLocalClockPlaying(false);
      return;
    }

    // Reset local clock playing state when tempo source changes
    if (autoSceneTempoSource === 'internal_clock') {
      setIsLocalClockPlaying(false);
      setLocalBeatCounter(0);
      return;
    }

    if (autoSceneTempoSource === 'manual_bpm' || autoSceneTempoSource === 'tap_tempo') {
      // Use independent clock for manual BPM and tap tempo
      if (isLocalClockPlaying) {
        const bpm = autoSceneTempoSource === 'manual_bpm' ? autoSceneManualBpm : autoSceneTapTempoBpm;
        const intervalMs = (60000 / bpm); // Milliseconds per beat
        
        intervalRef.current = setInterval(() => {
          setLocalBeatCounter(current => current + 1);
        }, intervalMs);
      }
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoSceneEnabled, autoSceneList.length, autoSceneBeatDivision, autoSceneTempoSource, autoSceneManualBpm, autoSceneTapTempoBpm, isLocalClockPlaying]);

  // Reset local clock when tempo source changes
  useEffect(() => {
    if (autoSceneTempoSource === 'internal_clock') {
      setIsLocalClockPlaying(false);
      setLocalBeatCounter(0);
    }
  }, [autoSceneTempoSource]);

  // Beat tracking for internal_clock mode (syncs with master clock)
  useEffect(() => {
    if (autoSceneTempoSource !== 'internal_clock') {
      // Reset master clock tracking when not using internal clock
      prevBeatRef.current = null;
      return;
    }

    if (!autoSceneEnabled || !midiClockIsPlaying || autoSceneList.length === 0 || autoSceneBeatDivision <= 0) {
      setLocalBeatCounter(0);
      prevBeatRef.current = null;
      return;
    }

    if (midiClockCurrentBeat !== prevBeatRef.current) {
      if (prevBeatRef.current !== null) {
        setLocalBeatCounter(current => current + 1);
      }
      prevBeatRef.current = midiClockCurrentBeat;
    }
  }, [autoSceneEnabled, midiClockIsPlaying, midiClockCurrentBeat, autoSceneList, autoSceneBeatDivision, autoSceneTempoSource]);

  // Scene change triggering logic
  useEffect(() => {
    const shouldTriggerChange = localBeatCounter >= autoSceneBeatDivision && 
                               autoSceneEnabled && 
                               autoSceneList.length > 0 &&
                               ((autoSceneTempoSource === 'internal_clock' && midiClockIsPlaying) ||
                                (autoSceneTempoSource !== 'internal_clock' && isLocalClockPlaying));

    if (shouldTriggerChange) {
      triggerAutoSceneFlash();
      setNextAutoSceneIndex();
      setLocalBeatCounter(0);
    }
  }, [localBeatCounter, autoSceneBeatDivision, autoSceneEnabled, autoSceneList, setNextAutoSceneIndex, autoSceneTempoSource, midiClockIsPlaying, isLocalClockPlaying, triggerAutoSceneFlash]);

  // Scene loading logic
  useEffect(() => {
    const shouldLoadScene = autoSceneEnabled && 
                           autoSceneCurrentIndex !== -1 && 
                           autoSceneList.length > 0 &&
                           ((autoSceneTempoSource === 'internal_clock' && midiClockIsPlaying) ||
                            (autoSceneTempoSource !== 'internal_clock' && isLocalClockPlaying));

    if (shouldLoadScene) {
      const sceneToLoad = autoSceneList[autoSceneCurrentIndex];
      if (sceneToLoad) {
        loadScene(sceneToLoad);
        console.log(`Auto-Scene Mini: Loading scene "${sceneToLoad}" (Index: ${autoSceneCurrentIndex})`);
      }
    }
  }, [autoSceneEnabled, autoSceneCurrentIndex, autoSceneList, loadScene, autoSceneTempoSource, midiClockIsPlaying, isLocalClockPlaying]);

  // Handle play/pause for different tempo sources
  const handlePlayPauseToggle = () => {
    if (autoSceneTempoSource === 'internal_clock') {
      requestToggleMasterClockPlayPause();
    } else {
      setIsLocalClockPlaying(!isLocalClockPlaying);
      if (!isLocalClockPlaying) {
        setLocalBeatCounter(0);
      }
    }
  };

  const getCurrentBpm = () => {
    switch (autoSceneTempoSource) {
      case 'manual_bpm':
        return autoSceneManualBpm;
      case 'tap_tempo':
        return autoSceneTapTempoBpm;
      default:
        return 120;
    }
  };

  const renderContent = () => {
    if (isCollapsed) return null;

    return (
      <div className={styles.content}>        <div className={styles.controls}>
          <button
            className={`${styles.toggleButton} ${autoSceneEnabled ? styles.active : ''}`}
            onClick={() => {
              if (!autoSceneEnabled) {
                setAutoSceneEnabled(true);
                // Start playing automatically when enabling AutoScene
                if (autoSceneTempoSource === 'internal_clock') {
                  requestToggleMasterClockPlayPause();
                } else {
                  setIsLocalClockPlaying(true);
                  setLocalBeatCounter(0);
                }
              } else {
                // Stop when disabling
                setAutoSceneEnabled(false);
                if (autoSceneTempoSource !== 'internal_clock') {
                  setIsLocalClockPlaying(false);
                }
              }
            }}
            title={autoSceneEnabled ? 'Stop Auto Scene' : 'Start Auto Scene'}
          >
            {autoSceneEnabled ? (
              <LucideIcon name="Pause" size={14} />
            ) : (
              <LucideIcon name="Play" size={14} />
            )}
            {autoSceneEnabled ? 'STOP' : 'START'}
          </button>

          <div className={styles.info}>
            <div className={styles.bpmDisplay}>
              {getCurrentBpm().toFixed(1)} BPM
            </div>
            <div className={styles.sceneCount}>
              {autoSceneList.length} scenes
            </div>
          </div>
        </div>        <div className={styles.tempoControls}>
          <select
            value={autoSceneTempoSource}
            onChange={(e) => setAutoSceneTempoSource(e.target.value as any)}
            className={styles.tempoSelect}
          >
            <option value="internal_clock">Internal Clock</option>
            <option value="manual_bpm">Manual BPM</option>
            <option value="tap_tempo">Tap Tempo</option>
          </select>

          {autoSceneTempoSource === 'manual_bpm' && (
            <input
              type="number"
              value={autoSceneManualBpm}
              onChange={(e) => setManualBpm(parseInt(e.target.value, 10))}
              min="20"
              max="300"
              className={styles.bpmInput}
              title="Manual BPM"
            />
          )}

          {autoSceneTempoSource === 'tap_tempo' && (
            <button
              className={styles.tapButton}
              onClick={() => recordTapTempo()}
              title="Tap Tempo"
            >
              <LucideIcon name="Zap" size={12} />
              TAP
            </button>
          )}
        </div>

        {autoSceneList.length > 0 && (
          <div className={styles.currentScene}>
            Scene: {autoSceneCurrentIndex + 1}/{autoSceneList.length}
          </div>
        )}
      </div>
    );
  };
  return (
    <DockableComponent
      id="auto-scene-control-mini"
      title="Scene Auto"
      component="midi-clock" // Reusing existing component type
      defaultPosition={{ zone: 'top-left' }}
      defaultZIndex={1025}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      className={`${styles.container} ${autoSceneIsFlashing ? styles.flashing : ''}`}
      isDraggable={true}
    >      <div className={styles.header}>
        <span className={styles.title}>Scene Auto</span>
        <div className={styles.status}>
          {autoSceneEnabled && (
            <LucideIcon 
              name="Play" 
              size={12} 
              className={`${styles.playingIcon} ${
                (autoSceneTempoSource === 'internal_clock' ? midiClockIsPlaying : isLocalClockPlaying) ? styles.active : ''
              }`} 
            />
          )}
        </div>
      </div>
      {renderContent()}
    </DockableComponent>
  );
};
