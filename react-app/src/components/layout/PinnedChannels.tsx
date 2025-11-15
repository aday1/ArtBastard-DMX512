import React, { useState } from 'react';
import { useStore } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './PinnedChannels.module.scss';

export const PinnedChannels: React.FC = () => {
  const { theme } = useTheme();
  const {
    pinnedChannels,
    dmxChannels,
    channelNames,
    channelColors,
    setDmxChannel,
    unpinChannel,
    getChannelRange
  } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pinnedChannels.length === 0) {
    return null; // Don't show if no channels are pinned
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${styles.pinnedChannelsContainer} ${isCollapsed ? styles.collapsed : ''}`}>
      <button
        onClick={toggleCollapse}
        className={styles.collapseToggle}
        title={isCollapsed ? 'Expand Pinned Channels' : 'Collapse Pinned Channels'}
      >
        <LucideIcon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} />
      </button>

      {!isCollapsed && (
        <div className={styles.pinnedContent}>
          <div className={styles.header}>
            <h3 className={styles.title}>
              <LucideIcon name="Pin" />
              Pinned Channels
            </h3>
            <span className={styles.count}>{pinnedChannels.length}</span>
          </div>

          <div className={styles.channelsList}>
            {pinnedChannels.map(channelIndex => {
              const value = dmxChannels[channelIndex] || 0;
              const channelName = channelNames[channelIndex] || `CH ${channelIndex + 1}`;
              const hasCustomName = channelName && 
                channelName !== `CH ${channelIndex + 1}` && 
                channelName !== `Channel ${channelIndex + 1}` &&
                channelName.trim() !== '';
              const channelColor = channelColors[channelIndex] || '';
              const range = getChannelRange(channelIndex);

              return (
                <div
                  key={channelIndex}
                  className={styles.pinnedChannel}
                  style={{
                    borderColor: hasCustomName && channelColor ? channelColor : undefined,
                    borderWidth: hasCustomName ? '2px' : undefined,
                  }}
                >
                  <div className={styles.channelHeader}>
                    <div className={styles.channelInfo}>
                      <span className={styles.channelNumber}>CH {channelIndex + 1}</span>
                      {hasCustomName && (
                        <span className={styles.channelName} title={channelName}>
                          {channelName.length > 15 ? `${channelName.substring(0, 15)}...` : channelName}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.unpinButton}
                      onClick={() => unpinChannel(channelIndex)}
                      title="Unpin channel"
                    >
                      <LucideIcon name="X" size={14} />
                    </button>
                  </div>

                  <div className={styles.valueDisplay}>
                    <span className={styles.value}>{value}</span>
                    <span className={styles.percent}>{Math.round((value / 255) * 100)}%</span>
                  </div>

                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min={range.min}
                      max={range.max}
                      value={value}
                      onChange={(e) => setDmxChannel(channelIndex, parseInt(e.target.value))}
                      className={styles.slider}
                      style={{
                        background: channelColor ? `linear-gradient(to right, ${channelColor} 0%, ${channelColor} ${(value / range.max) * 100}%, rgba(71, 85, 105, 0.3) ${(value / range.max) * 100}%, rgba(71, 85, 105, 0.3) 100%)` : undefined
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

