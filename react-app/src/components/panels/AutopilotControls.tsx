import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { AutopilotConfig } from '../../store/store';
import styles from './AutopilotControls.module.scss';

export const AutopilotControls: React.FC = () => {
  const {
    channelAutopilots,
    panTiltAutopilot,
    bpm,
    setChannelAutopilot,
    removeChannelAutopilot,
    setPanTiltAutopilot,
    togglePanTiltAutopilot,
    fixtures
  } = useStore();

  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [channelAutopilotConfig, setChannelAutopilotConfig] = useState<AutopilotConfig>({
    enabled: false,
    type: 'sine',
    speed: 1.0,
    range: { min: 0, max: 255 },
    syncToBPM: false,
    phase: 0
  });

  const handleChannelAutopilotApply = () => {
    setChannelAutopilot(selectedChannel, { ...channelAutopilotConfig, enabled: true });
  };

  const handleChannelAutopilotRemove = () => {
    removeChannelAutopilot(selectedChannel);
  };

  const isPanTiltAvailable = fixtures.some(fixture => 
    fixture.channels.some(ch => ch.type === 'pan' || ch.type === 'tilt')
  );

  const activeChannelAutopilots = Object.keys(channelAutopilots).length;

  return (
    <div className={styles.autopilotControls}>
      <div className={styles.header}>
        <h3>🤖 Autopilot System</h3>
        <div className={styles.stats}>
          <span className={styles.stat}>
            {activeChannelAutopilots} Channel{activeChannelAutopilots !== 1 ? 's' : ''}
          </span>
          {panTiltAutopilot.enabled && (
            <span className={styles.stat}>Pan/Tilt Active</span>
          )}
          {bpm > 0 && (
            <span className={styles.bpm}>♪ {bpm} BPM</span>
          )}
        </div>
      </div>

      {/* Channel Autopilot Section */}
      <div className={styles.section}>
        <h4>Channel Autopilot</h4>
        
        <div className={styles.channelSelector}>
          <label>Channel:</label>
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(parseInt(e.target.value))}
          >
            {Array.from({ length: 512 }, (_, i) => (
              <option key={i} value={i}>
                CH {i + 1} {channelAutopilots[i] ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.configGrid}>
          <div className={styles.configRow}>
            <label>Pattern:</label>
            <select 
              value={channelAutopilotConfig.type}
              onChange={(e) => setChannelAutopilotConfig(prev => ({ 
                ...prev, 
                type: e.target.value as AutopilotConfig['type']
              }))}
            >
              <option value="sine">Sine Wave</option>
              <option value="ping-pong">Ping Pong</option>
              <option value="cycle">Cycle</option>
              <option value="triangle">Triangle</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="random">Random</option>
            </select>
          </div>

          <div className={styles.configRow}>
            <label>Speed:</label>
            <input 
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={channelAutopilotConfig.speed}
              onChange={(e) => setChannelAutopilotConfig(prev => ({ 
                ...prev, 
                speed: parseFloat(e.target.value)
              }))}
            />
            <span>{channelAutopilotConfig.speed.toFixed(1)}x</span>
          </div>

          <div className={styles.configRow}>
            <label>Range:</label>
            <div className={styles.rangeInputs}>
              <input 
                type="number"
                min="0"
                max="255"
                value={channelAutopilotConfig.range.min}
                onChange={(e) => setChannelAutopilotConfig(prev => ({
                  ...prev,
                  range: { ...prev.range, min: parseInt(e.target.value) }
                }))}
              />
              <span>to</span>
              <input 
                type="number"
                min="0"
                max="255"
                value={channelAutopilotConfig.range.max}
                onChange={(e) => setChannelAutopilotConfig(prev => ({
                  ...prev,
                  range: { ...prev.range, max: parseInt(e.target.value) }
                }))}
              />
            </div>
          </div>

          <div className={styles.configRow}>
            <label>
              <input 
                type="checkbox"
                checked={channelAutopilotConfig.syncToBPM}
                onChange={(e) => setChannelAutopilotConfig(prev => ({ 
                  ...prev, 
                  syncToBPM: e.target.checked
                }))}
              />
              Sync to BPM
            </label>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button 
            className={styles.applyButton}
            onClick={handleChannelAutopilotApply}
          >
            Apply to CH {selectedChannel + 1}
          </button>
          {channelAutopilots[selectedChannel] && (
            <button 
              className={styles.removeButton}
              onClick={handleChannelAutopilotRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Pan/Tilt Autopilot Section */}
      {isPanTiltAvailable && (
        <div className={styles.section}>
          <h4>Pan/Tilt Autopilot</h4>
          
          <div className={styles.configGrid}>
            <div className={styles.configRow}>
              <label>
                <input 
                  type="checkbox"
                  checked={panTiltAutopilot.enabled}
                  onChange={togglePanTiltAutopilot}
                />
                Enable Pan/Tilt Autopilot
              </label>
            </div>

            {panTiltAutopilot.enabled && (
              <>
                <div className={styles.configRow}>
                  <label>Pattern:</label>
                  <select 
                    value={panTiltAutopilot.pathType}
                    onChange={(e) => setPanTiltAutopilot({ 
                      pathType: e.target.value as any
                    })}
                  >
                    <option value="circle">Circle</option>
                    <option value="figure8">Figure 8</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="linear">Linear</option>
                  </select>
                </div>

                <div className={styles.configRow}>
                  <label>Speed:</label>
                  <input 
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={panTiltAutopilot.speed}
                    onChange={(e) => setPanTiltAutopilot({ 
                      speed: parseFloat(e.target.value)
                    })}
                  />
                  <span>{panTiltAutopilot.speed.toFixed(1)}x</span>
                </div>

                <div className={styles.configRow}>
                  <label>Size:</label>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={panTiltAutopilot.size}
                    onChange={(e) => setPanTiltAutopilot({ 
                      size: parseInt(e.target.value)
                    })}
                  />
                  <span>{panTiltAutopilot.size}%</span>
                </div>

                <div className={styles.configRow}>
                  <label>Center X:</label>
                  <input 
                    type="range"
                    min="0"
                    max="255"
                    value={panTiltAutopilot.centerX}
                    onChange={(e) => setPanTiltAutopilot({ 
                      centerX: parseInt(e.target.value)
                    })}
                  />
                  <span>{panTiltAutopilot.centerX}</span>
                </div>

                <div className={styles.configRow}>
                  <label>Center Y:</label>
                  <input 
                    type="range"
                    min="0"
                    max="255"
                    value={panTiltAutopilot.centerY}
                    onChange={(e) => setPanTiltAutopilot({ 
                      centerY: parseInt(e.target.value)
                    })}
                  />
                  <span>{panTiltAutopilot.centerY}</span>
                </div>

                <div className={styles.configRow}>
                  <label>
                    <input 
                      type="checkbox"
                      checked={panTiltAutopilot.syncToBPM}
                      onChange={(e) => setPanTiltAutopilot({ 
                        syncToBPM: e.target.checked
                      })}
                    />
                    Sync to BPM
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Active Autopilots List */}
      {(activeChannelAutopilots > 0 || panTiltAutopilot.enabled) && (
        <div className={styles.section}>
          <h4>Active Autopilots</h4>
          <div className={styles.activeList}>
            {Object.entries(channelAutopilots).map(([channel, config]) => (
              <div key={channel} className={styles.activeItem}>
                <span>CH {parseInt(channel) + 1}</span>
                <span>{config.type}</span>
                <span>{config.speed.toFixed(1)}x</span>
                {config.syncToBPM && <span>♪</span>}
                <button 
                  className={styles.removeSmall}
                  onClick={() => removeChannelAutopilot(parseInt(channel))}
                >
                  ×
                </button>
              </div>
            ))}
            {panTiltAutopilot.enabled && (
              <div className={styles.activeItem}>
                <span>Pan/Tilt</span>
                <span>{panTiltAutopilot.pathType}</span>
                <span>{panTiltAutopilot.speed.toFixed(1)}x</span>
                {panTiltAutopilot.syncToBPM && <span>♪</span>}
                <button 
                  className={styles.removeSmall}
                  onClick={togglePanTiltAutopilot}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
