import React from 'react';
import { useStore } from '../../store/store';
import styles from './ModularAutomation.module.scss';

const ModularAutomation: React.FC = () => {
  const {
    modularAutomation,
    setColorAutomation,
    setDimmerAutomation,
    setPanTiltAutomation,
    setEffectsAutomation,
    toggleColorAutomation,
    toggleDimmerAutomation,
    togglePanTiltAutomation,
    toggleEffectsAutomation,
    selectedFixtures
  } = useStore();

  return (
    <div className={styles.modularAutomation}>
      <div className={styles.header}>
        <h3>Modular Automation</h3>
        <div className={styles.subtitle}>
          Control different aspects independently
        </div>
      </div>

      {selectedFixtures.length === 0 && (
        <div className={styles.noSelection}>
          Select fixtures to enable automation
        </div>
      )}

      <div className={styles.automationGrid}>
        {/* Color Automation */}
        <div className={`${styles.automationModule} ${modularAutomation.color.enabled ? styles.active : ''}`}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>
              <span className={styles.colorIcon}>🎨</span>
              Color Automation
            </div>
            <button
              className={`${styles.toggleButton} ${modularAutomation.color.enabled ? styles.enabled : ''}`}
              onClick={toggleColorAutomation}
              disabled={selectedFixtures.length === 0}
              title={modularAutomation.color.enabled ? 'Stop color automation' : 'Start color automation'}
            >
              {modularAutomation.color.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={styles.moduleControls}>
            <div className={styles.controlRow}>
              <label>Type:</label>
              <select
                value={modularAutomation.color.type}
                onChange={(e) => setColorAutomation({ type: e.target.value as any })}
                disabled={selectedFixtures.length === 0}
              >
                <option value="rainbow">Rainbow</option>
                <option value="cycle">Color Cycle</option>
                <option value="pulse">Pulse</option>
                <option value="strobe">Strobe</option>
                <option value="breathe">Breathe</option>
                <option value="wave">Wave</option>
                <option value="random">Random</option>
              </select>
            </div>

            <div className={styles.controlRow}>
              <label>Speed:</label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={modularAutomation.color.speed}
                onChange={(e) => setColorAutomation({ speed: parseFloat(e.target.value) })}
                disabled={selectedFixtures.length === 0}
              />
              <span className={styles.value}>{modularAutomation.color.speed.toFixed(1)}x</span>
            </div>

            <div className={styles.controlRow}>
              <label>Intensity:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={modularAutomation.color.intensity}
                onChange={(e) => setColorAutomation({ intensity: parseInt(e.target.value) })}
                disabled={selectedFixtures.length === 0}
              />
              <span className={styles.value}>{modularAutomation.color.intensity}%</span>
            </div>

            <div className={styles.controlRow}>
              <label>Sync to BPM:</label>
              <input
                type="checkbox"
                checked={modularAutomation.color.syncToBPM}
                onChange={(e) => setColorAutomation({ syncToBPM: e.target.checked })}
                disabled={selectedFixtures.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Dimmer Automation */}
        <div className={`${styles.automationModule} ${modularAutomation.dimmer.enabled ? styles.active : ''}`}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>
              <span className={styles.dimmerIcon}>💡</span>
              Dimmer Automation
            </div>
            <button
              className={`${styles.toggleButton} ${modularAutomation.dimmer.enabled ? styles.enabled : ''}`}
              onClick={toggleDimmerAutomation}
              disabled={selectedFixtures.length === 0}
              title={modularAutomation.dimmer.enabled ? 'Stop dimmer automation' : 'Start dimmer automation'}
            >
              {modularAutomation.dimmer.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={styles.moduleControls}>
            <div className={styles.controlRow}>
              <label>Type:</label>
              <select
                value={modularAutomation.dimmer.type}
                onChange={(e) => setDimmerAutomation({ type: e.target.value as any })}
                disabled={selectedFixtures.length === 0}
              >
                <option value="breathe">Breathe</option>
                <option value="pulse">Pulse</option>
                <option value="strobe">Strobe</option>
                <option value="ramp">Ramp</option>
                <option value="random">Random</option>
                <option value="chase">Chase</option>
              </select>
            </div>

            <div className={styles.controlRow}>
              <label>Speed:</label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={modularAutomation.dimmer.speed}
                onChange={(e) => setDimmerAutomation({ speed: parseFloat(e.target.value) })}
                disabled={selectedFixtures.length === 0}
              />
              <span className={styles.value}>{modularAutomation.dimmer.speed.toFixed(1)}x</span>
            </div>

            <div className={styles.controlRow}>
              <label>Range:</label>
              <div className={styles.rangeControls}>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={modularAutomation.dimmer.range.min}
                  onChange={(e) => setDimmerAutomation({ 
                    range: { ...modularAutomation.dimmer.range, min: parseInt(e.target.value) }
                  })}
                  disabled={selectedFixtures.length === 0}
                  className={styles.rangeInput}
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={modularAutomation.dimmer.range.max}
                  onChange={(e) => setDimmerAutomation({ 
                    range: { ...modularAutomation.dimmer.range, max: parseInt(e.target.value) }
                  })}
                  disabled={selectedFixtures.length === 0}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            <div className={styles.controlRow}>
              <label>Sync to BPM:</label>
              <input
                type="checkbox"
                checked={modularAutomation.dimmer.syncToBPM}
                onChange={(e) => setDimmerAutomation({ syncToBPM: e.target.checked })}
                disabled={selectedFixtures.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Pan/Tilt Automation */}
        <div className={`${styles.automationModule} ${modularAutomation.panTilt.enabled ? styles.active : ''}`}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>
              <span className={styles.panTiltIcon}>🔄</span>
              Pan/Tilt Automation
            </div>
            <button
              className={`${styles.toggleButton} ${modularAutomation.panTilt.enabled ? styles.enabled : ''}`}
              onClick={togglePanTiltAutomation}
              disabled={selectedFixtures.length === 0}
              title={modularAutomation.panTilt.enabled ? 'Stop pan/tilt automation' : 'Start pan/tilt automation'}
            >
              {modularAutomation.panTilt.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={styles.moduleControls}>
            <div className={styles.controlRow}>
              <label>Pattern:</label>
              <select
                value={modularAutomation.panTilt.pathType}
                onChange={(e) => setPanTiltAutomation({ pathType: e.target.value as any })}
                disabled={selectedFixtures.length === 0}
              >
                <option value="circle">Circle</option>
                <option value="figure8">Figure 8</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
                <option value="linear">Linear</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className={styles.controlRow}>
              <label>Speed:</label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={modularAutomation.panTilt.speed}
                onChange={(e) => setPanTiltAutomation({ speed: parseFloat(e.target.value) })}
                disabled={selectedFixtures.length === 0}
              />
              <span className={styles.value}>{modularAutomation.panTilt.speed.toFixed(1)}x</span>
            </div>

            <div className={styles.controlRow}>
              <label>Size:</label>
              <input
                type="range"
                min="10"
                max="100"
                value={modularAutomation.panTilt.size}
                onChange={(e) => setPanTiltAutomation({ size: parseInt(e.target.value) })}
                disabled={selectedFixtures.length === 0}
              />
              <span className={styles.value}>{modularAutomation.panTilt.size}%</span>
            </div>

            <div className={styles.controlRow}>
              <label>Sync to BPM:</label>
              <input
                type="checkbox"
                checked={modularAutomation.panTilt.syncToBPM}
                onChange={(e) => setPanTiltAutomation({ syncToBPM: e.target.checked })}
                disabled={selectedFixtures.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Effects Automation */}
        <div className={`${styles.automationModule} ${modularAutomation.effects.enabled ? styles.active : ''}`}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>
              <span className={styles.effectsIcon}>✨</span>
              Effects Automation
            </div>
            <button
              className={`${styles.toggleButton} ${modularAutomation.effects.enabled ? styles.enabled : ''}`}
              onClick={toggleEffectsAutomation}
              disabled={selectedFixtures.length === 0}
              title={modularAutomation.effects.enabled ? 'Stop effects automation' : 'Start effects automation'}
            >
              {modularAutomation.effects.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className={styles.moduleControls}>
            <div className={styles.controlRow}>
              <label>Effect:</label>
              <select
                value={modularAutomation.effects.type}
                onChange={(e) => setEffectsAutomation({ type: e.target.value as any })}
                disabled={selectedFixtures.length === 0}
              >
                <option value="gobo_cycle">GOBO Cycle</option>
                <option value="prism_rotate">Prism Rotate</option>
                <option value="iris_breathe">Iris Breathe</option>
                <option value="zoom_bounce">Zoom Bounce</option>
                <option value="focus_sweep">Focus Sweep</option>
              </select>
            </div>

            <div className={styles.controlRow}>
              <label>Speed:</label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={modularAutomation.effects.speed}
                onChange={(e) => setEffectsAutomation({ speed: parseFloat(e.target.value) })}
                disabled={selectedFixtures.length === 0}
              />
              <span className={styles.value}>{modularAutomation.effects.speed.toFixed(1)}x</span>
            </div>

            <div className={styles.controlRow}>
              <label>Direction:</label>
              <select
                value={modularAutomation.effects.direction}
                onChange={(e) => setEffectsAutomation({ direction: e.target.value as any })}
                disabled={selectedFixtures.length === 0}
              >
                <option value="forward">Forward</option>
                <option value="reverse">Reverse</option>
                <option value="ping-pong">Ping-Pong</option>
              </select>
            </div>

            <div className={styles.controlRow}>
              <label>Sync to BPM:</label>
              <input
                type="checkbox"
                checked={modularAutomation.effects.syncToBPM}
                onChange={(e) => setEffectsAutomation({ syncToBPM: e.target.checked })}
                disabled={selectedFixtures.length === 0}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.globalControls}>
        <div className={styles.sceneInfo}>
          <span className={styles.sceneIcon}>💾</span>
          <span className={styles.sceneText}>
            Automation states are saved with scenes
          </span>
        </div>
        
        <div className={styles.activeCount}>
          Active: {Object.values(modularAutomation).filter(config => 
            typeof config === 'object' && config.enabled
          ).length} / 4
        </div>
        
        <button 
          className={styles.stopAllButton}
          onClick={() => {
            setColorAutomation({ enabled: false });
            setDimmerAutomation({ enabled: false });
            setPanTiltAutomation({ enabled: false });
            setEffectsAutomation({ enabled: false });
          }}
          disabled={selectedFixtures.length === 0}
        >
          Stop All
        </button>
      </div>
    </div>
  );
};

export default ModularAutomation;
