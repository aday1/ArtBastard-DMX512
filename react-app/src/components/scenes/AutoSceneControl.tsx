import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore, Scene } from '../../store'; // Assuming Scene type might be needed for selection
import styles from './AutoSceneControl.module.scss';

export const AutoSceneControl: React.FC = () => {
  // Retrieve all scenes for selection purposes
  const allScenes = useStore(state => state.scenes);

  // Auto-Scene state from the store
  const {
    autoSceneEnabled,
    autoSceneList,
    autoSceneMode,
    autoSceneBeatDivision,
    autoSceneManualBpm,
    autoSceneTapTempoBpm,
    autoSceneTempoSource,
    autoSceneCurrentIndex, // For display
    selectedMidiClockHostId, // To know if main clock is internal
    midiClockBpm, // To display main clock BPM
    midiClockIsPlaying, // Needed for effects
    midiClockCurrentBeat, // Needed for effects
  } = useStore(state => ({
    autoSceneEnabled: state.autoSceneEnabled,
    autoSceneList: state.autoSceneList,
    autoSceneMode: state.autoSceneMode,
    autoSceneBeatDivision: state.autoSceneBeatDivision,
    autoSceneManualBpm: state.autoSceneManualBpm,
    autoSceneTapTempoBpm: state.autoSceneTapTempoBpm,
    autoSceneTempoSource: state.autoSceneTempoSource,
    autoSceneCurrentIndex: state.autoSceneCurrentIndex,
    selectedMidiClockHostId: state.selectedMidiClockHostId,
    midiClockBpm: state.midiClockBpm,
  }));

  // Auto-Scene actions from the store
  const {
    setAutoSceneEnabled,
    setAutoSceneList,
    setAutoSceneMode,
    setAutoSceneBeatDivision,
    setAutoSceneTempoSource,
    setManualBpm,
    recordTapTempo,
    loadScene, // Needed for effects
    setNextAutoSceneIndex, // Needed for effects
  } = useStore(state => ({
    setAutoSceneEnabled: state.setAutoSceneEnabled,
    setAutoSceneList: state.setAutoSceneList,
    setAutoSceneMode: state.setAutoSceneMode,
    setAutoSceneBeatDivision: state.setAutoSceneBeatDivision,
    setAutoSceneTempoSource: state.setAutoSceneTempoSource,
    setManualBpm: state.setManualBpm,
    recordTapTempo: state.recordTapTempo,
  }));

  // Local state for UI, e.g., for multi-select interaction if needed
  // Local state for UI, e.g., for multi-select interaction if needed
  const [selectedScenesForList, setSelectedScenesForList] = useState<string[]>(autoSceneList);

  // Local state for beat tracking and refs
  const [localBeatCounter, setLocalBeatCounter] = useState(0);
  const prevBeatRef = useRef<number | null>(null);

  // Effect to update local selectedScenesForList when autoSceneList changes from store (e.g. loaded state)
  useEffect(() => {
    setSelectedScenesForList(autoSceneList);
  }, [autoSceneList]);

  // useEffect for Beat Tracking:
  useEffect(() => {
    if (!autoSceneEnabled || !midiClockIsPlaying || autoSceneList.length === 0 || autoSceneBeatDivision <= 0) {
      setLocalBeatCounter(0);
      prevBeatRef.current = null;
      return;
    }

    if (midiClockCurrentBeat !== prevBeatRef.current) {
      if (prevBeatRef.current !== null) { // Only increment if it's not the very first beat detection cycle
        setLocalBeatCounter(current => current + 1);
      }
      prevBeatRef.current = midiClockCurrentBeat;
    }
  }, [autoSceneEnabled, midiClockIsPlaying, midiClockCurrentBeat, autoSceneList, autoSceneBeatDivision]);

  // useEffect for Triggering Scene Change Logic:
  useEffect(() => {
    if (localBeatCounter >= autoSceneBeatDivision && autoSceneEnabled && midiClockIsPlaying && autoSceneList.length > 0) {
      setNextAutoSceneIndex();
      setLocalBeatCounter(0); // Reset counter for the next cycle
    }
  }, [localBeatCounter, autoSceneBeatDivision, autoSceneEnabled, midiClockIsPlaying, autoSceneList, setNextAutoSceneIndex]);

  // useEffect for Loading the Scene:
  useEffect(() => {
    if (autoSceneEnabled && midiClockIsPlaying && autoSceneCurrentIndex !== -1 && autoSceneList.length > 0) {
      const sceneToLoad = autoSceneList[autoSceneCurrentIndex];
      if (sceneToLoad) {
        loadScene(sceneToLoad);
        console.log(`Auto-Scene: Loading scene "${sceneToLoad}" (Index: ${autoSceneCurrentIndex})`);
      }
    }
  }, [autoSceneEnabled, midiClockIsPlaying, autoSceneCurrentIndex, autoSceneList, loadScene]);

  const handleToggleSceneInList = (sceneName: string) => {
    const newSelectedScenes = selectedScenesForList.includes(sceneName)
      ? selectedScenesForList.filter(name => name !== sceneName)
      : [...selectedScenesForList, sceneName];
    setSelectedScenesForList(newSelectedScenes);
    setAutoSceneList(newSelectedScenes); // Update store
  };

  return (
    <div className={styles.autoSceneControl}>
      <h2>Auto-Scene Control</h2>

      {/* Enable/Disable Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Enable</h3>
        <div className={styles.controlGroup}>
          <label htmlFor="autoSceneEnableCheckbox">Enable Auto-Scene:</label>
          <input
            type="checkbox"
            id="autoSceneEnableCheckbox"
            checked={autoSceneEnabled}
            onChange={(e) => setAutoSceneEnabled(e.target.checked)}
          />
        </div>
      </div>

      {/* Scene Selection Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Scene Sequence</h3>
        <p>Select scenes to include in the sequence (order matters for 'Forward' and 'Ping-Pong' modes):</p>
        <div className={styles.sceneListContainer}>
          {allScenes.length > 0 ? allScenes.map(scene => (
            <div
              key={scene.name}
              className={`${styles.sceneSelectItem} ${selectedScenesForList.includes(scene.name) ? styles.selected : ''}`}
              onClick={() => handleToggleSceneInList(scene.name)}
            >
              {scene.name}
            </div>
          )) : <p>No scenes available. Create some scenes first!</p>}
        </div>
        <small>Selected: {selectedScenesForList.join(', ') || 'None'}</small>
      </div>

      {/* Mode Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Mode</h3>
        <div className={styles.controlGroup}>
          <label htmlFor="autoSceneModeSelect">Mode:</label>
          <select
            id="autoSceneModeSelect"
            value={autoSceneMode}
            onChange={(e) => setAutoSceneMode(e.target.value as 'forward' | 'ping-pong' | 'random')}
            disabled={!autoSceneEnabled}
          >
            <option value="forward">Forward</option>
            <option value="ping-pong">Ping-Pong</option>
            <option value="random">Random</option>
          </select>
        </div>
      </div>

      {/* Beat Division Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Timing</h3>
        <div className={styles.controlGroup}>
          <label htmlFor="autoSceneBeatDivisionInput">Change Scene Every (beats):</label>
          <input
            type="number"
            id="autoSceneBeatDivisionInput"
            value={autoSceneBeatDivision}
            onChange={(e) => setAutoSceneBeatDivision(parseInt(e.target.value, 10))}
            min="1"
            disabled={!autoSceneEnabled}
          />
        </div>
      </div>

      {/* Tempo Source Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tempo Source</h3>
        <div className={styles.controlGroup}>
          <label htmlFor="autoSceneTempoSourceSelect">Source:</label>
          <select
            id="autoSceneTempoSourceSelect"
            value={autoSceneTempoSource}
            onChange={(e) => setAutoSceneTempoSource(e.target.value as 'internal_clock' | 'manual_bpm' | 'tap_tempo')}
            disabled={!autoSceneEnabled}
          >
            <option value="internal_clock">Internal Clock (from Master)</option>
            <option value="manual_bpm">Manual BPM</option>
            <option value="tap_tempo">Tap Tempo</option>
          </select>
        </div>

        {/* Manual BPM Input (shown if tempo source is 'manual_bpm') */}
        {autoSceneTempoSource === 'manual_bpm' && (
          <div className={styles.controlGroup}>
            <label htmlFor="autoSceneManualBpmInput">Manual BPM:</label>
            <input
              type="number"
              id="autoSceneManualBpmInput"
              value={autoSceneManualBpm}
              onChange={(e) => setManualBpm(parseInt(e.target.value, 10))}
              min="20"
              max="300"
              disabled={!autoSceneEnabled}
            />
          </div>
        )}

        {/* Tap Tempo Button (shown if tempo source is 'tap_tempo') */}
        {autoSceneTempoSource === 'tap_tempo' && (
          <div className={styles.controlGroup}>
            <button onClick={() => recordTapTempo()} disabled={!autoSceneEnabled}>Tap</button>
            <span>Detected BPM: {autoSceneTapTempoBpm.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Status Display Section */}
      <div className={styles.statusDisplay}>
        <h4 className={styles.sectionTitle}>Status</h4>
        <div className={styles.statusItem}>Enabled: {autoSceneEnabled ? 'Yes' : 'No'}</div>
        <div className={styles.statusItem}>Mode: {autoSceneMode}</div>
        <div className={styles.statusItem}>Current Scene Index: {autoSceneCurrentIndex === -1 ? "N/A" : autoSceneCurrentIndex} ({autoSceneList[autoSceneCurrentIndex] || 'None'})</div>
        <div className={styles.statusItem}>Beat Division: {autoSceneBeatDivision}</div>
        <div className={styles.statusItem}>Tempo Source: {autoSceneTempoSource.replace('_', ' ')}</div>
        <div className={styles.statusItem}>
          Effective BPM:
          {autoSceneTempoSource === 'internal_clock' ? `${midiClockBpm.toFixed(2)} (Master Clock)` :
           autoSceneTempoSource === 'manual_bpm' ? `${autoSceneManualBpm.toFixed(2)} (Manual)` :
           `${autoSceneTapTempoBpm.toFixed(2)} (Tap)`}
        </div>
        <div className={styles.statusItem}>Master Clock Source: {selectedMidiClockHostId}</div>
        <div className={styles.statusItem}>Local Beat Counter: {localBeatCounter}</div>
      </div>
    </div>
  );
};

export default AutoSceneControl;
