import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import styles from './ExternalDisplay.module.scss';

export const DMXMonitor: React.FC = () => {
  const { dmxChannels, channelNames, fixtures } = useStore();
  const [filter, setFilter] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Get active channels (non-zero values)
  const activeChannels = dmxChannels
    .map((value, index) => ({ channel: index + 1, value, name: channelNames[index] }))
    .filter(item => showOnlyActive ? item.value > 0 : true)
    .filter(item => filter === '' || item.name.toLowerCase().includes(filter.toLowerCase()) || item.channel.toString().includes(filter));

  return (
    <div className={styles.monitorContainer}>
      <div className={styles.monitorHeader}>
        <h3>DMX Monitor ({activeChannels.length} channels)</h3>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Filter channels..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterInput}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            Show only active
          </label>
        </div>
      </div>
      
      <div className={styles.monitorContent}>
        <div className={styles.channelGrid}>
          {activeChannels.map(({ channel, value, name }) => (
            <div key={channel} className={`${styles.channelItem} ${value > 0 ? styles.active : ''}`}>
              <div className={styles.channelNumber}>CH {channel}</div>
              <div className={styles.channelName}>{name}</div>
              <div className={styles.channelValue}>{value}</div>
              <div className={styles.channelBar}>
                <div 
                  className={styles.channelBarFill}
                  style={{ width: `${(value / 255) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.fixtureOverview}>
        <h4>Fixture Overview</h4>
        <div className={styles.fixtureList}>
          {fixtures.map(fixture => (
            <div key={fixture.id} className={styles.fixtureItem}>
              <div className={styles.fixtureName}>{fixture.name}</div>
              <div className={styles.fixtureChannels}>
                {fixture.channels.map((channel, idx) => {
                  const dmxAddress = fixture.startAddress + idx;
                  const value = dmxChannels[dmxAddress - 1] || 0;
                  return (
                    <div key={idx} className={`${styles.fixtureChannel} ${value > 0 ? styles.active : ''}`}>
                      <span>{channel.type}: {value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
