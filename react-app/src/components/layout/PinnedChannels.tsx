import React, { useState, useRef, useEffect } from 'react';
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
    getChannelRange,
    envelopeAutomation,
    toggleEnvelope
  } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(() => {
    // Load saved width from localStorage
    try {
      const saved = localStorage.getItem('pinnedChannelsWidth');
      if (saved) {
        return parseInt(saved, 10);
      }
    } catch (e) {
      console.error('Failed to load pinned channels width:', e);
    }
    return 280; // Default width
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const diff = e.clientX - resizeStartRef.current.x;
      const newWidth = Math.max(200, Math.min(500, resizeStartRef.current.width + diff));
      setWidth(newWidth);
      // Save to localStorage
      try {
        localStorage.setItem('pinnedChannelsWidth', newWidth.toString());
      } catch (err) {
        console.error('Failed to save pinned channels width:', err);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Set initial CSS variable and update when width/collapse changes
  useEffect(() => {
    if (pinnedChannels.length === 0) {
      document.documentElement.style.setProperty('--pinned-channels-width', '0px');
    } else {
      const currentWidth = isCollapsed ? 64 : width;
      document.documentElement.style.setProperty('--pinned-channels-width', `${currentWidth}px`);
    }
  }, [width, isCollapsed, pinnedChannels.length]);

  if (pinnedChannels.length === 0) {
    return null; // Don't show if no channels are pinned
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.pinnedChannelsContainer} ${isCollapsed ? styles.collapsed : ''}`}
      style={{ width: isCollapsed ? '64px' : `${width}px` }}
    >
      <div className={styles.pinnedContent}>
        <div className={styles.headerRow}>
          <button
            onClick={toggleCollapse}
            className={styles.collapseToggle}
            title={isCollapsed ? 'Expand Pinned Channels' : 'Collapse Pinned Channels'}
          >
            <LucideIcon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} />
          </button>
        </div>

        {!isCollapsed && (
          <>
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
              
              // Check if this channel has an envelope
              const channelEnvelope = envelopeAutomation.envelopes.find(e => e.channel === channelIndex);
              const hasEnvelope = !!channelEnvelope;
              const envelopeEnabled = channelEnvelope?.enabled ?? false;

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
                    <div className={styles.channelActions}>
                      {hasEnvelope && (
                        <button
                          className={`${styles.envelopeButton} ${envelopeEnabled ? styles.active : ''}`}
                          onClick={() => channelEnvelope && toggleEnvelope(channelEnvelope.id)}
                          title={envelopeEnabled ? 'Stop Envelope' : 'Start Envelope'}
                          disabled={!envelopeAutomation.globalEnabled}
                        >
                          <LucideIcon name={envelopeEnabled ? "Square" : "Play"} size={12} />
                        </button>
                      )}
                      <button
                        className={styles.unpinButton}
                        onClick={() => unpinChannel(channelIndex)}
                        title="Unpin channel"
                      >
                        <LucideIcon name="X" size={14} />
                      </button>
                    </div>
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
        </>
        )}
      </div>
      {!isCollapsed && (
        <div 
          ref={resizeHandleRef}
          className={styles.resizeHandle}
          onMouseDown={(e) => {
            e.preventDefault();
            resizeStartRef.current = { x: e.clientX, width };
            setIsResizing(true);
          }}
          title="Drag to resize"
        >
          <LucideIcon name="GripVertical" size={16} />
        </div>
      )}
    </div>
  );
};

