import React, { useState } from 'react';
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
  const {
    autoSceneEnabled,
    autoSceneList,
    autoSceneCurrentIndex,
    autoSceneTempoSource,
    autoSceneManualBpm,
    autoSceneTapTempoBpm,
    autoSceneBeatDivision,
    autoSceneIsFlashing, // Use shared flashing state
  } = useStore(state => ({
    autoSceneEnabled: state.autoSceneEnabled,
    autoSceneList: state.autoSceneList,
    autoSceneCurrentIndex: state.autoSceneCurrentIndex,
    autoSceneTempoSource: state.autoSceneTempoSource,
    autoSceneManualBpm: state.autoSceneManualBpm,
    autoSceneTapTempoBpm: state.autoSceneTapTempoBpm,
    autoSceneBeatDivision: state.autoSceneBeatDivision,
    autoSceneIsFlashing: state.autoSceneIsFlashing, // Use shared flashing state
  }));

  const {
    setAutoSceneEnabled,
    setAutoSceneTempoSource,
    recordTapTempo,
    requestToggleMasterClockPlayPause,
  } = useStore(state => ({
    setAutoSceneEnabled: state.setAutoSceneEnabled,
    setAutoSceneTempoSource: state.setAutoSceneTempoSource,
    recordTapTempo: state.recordTapTempo,
    requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause,
  }));
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
      <div className={styles.content}>
        <div className={styles.controls}>
          <button
            className={`${styles.toggleButton} ${autoSceneEnabled ? styles.active : ''}`}
            onClick={() => setAutoSceneEnabled(!autoSceneEnabled)}
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
        </div>

        <div className={styles.tempoControls}>          <select
            value={autoSceneTempoSource}
            onChange={(e) => setAutoSceneTempoSource(e.target.value as any)}
            className={styles.tempoSelect}
          >
            <option value="manual_bpm">Manual BPM</option>
            <option value="tap_tempo">Tap Tempo</option>
          </select>

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
    >
      <div className={styles.header}>
        <span className={styles.title}>Scene Auto</span>
        <div className={styles.status}>
          {autoSceneEnabled && (
            <LucideIcon name="Play" size={12} className={styles.playingIcon} />
          )}
        </div>
      </div>
      {renderContent()}
    </DockableComponent>
  );
};
