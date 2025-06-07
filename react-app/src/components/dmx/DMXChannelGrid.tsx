import React, { useState, useCallback } from 'react';
import { useDocking } from '@/context/DockingContext';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore } from '../../store';
import styles from './DMXChannelGrid.module.scss';

interface DMXChannelGridProps {
  onChannelSelect?: (channel: number) => void;
  selectedChannels?: number[];
  maxChannels?: number;
  isMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  isDockable?: boolean;
}

export const DMXChannelGrid: React.FC<DMXChannelGridProps> = ({
  onChannelSelect,
  selectedChannels = [],
  maxChannels = 512,
  isMinimized = false,
  onMinimizedChange,
  isDockable = true
}) => {
  const [localSelectedChannels, setLocalSelectedChannels] = useState<Set<number>>(new Set(selectedChannels));
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [channelsPerRow, setChannelsPerRow] = useState(16);

  const { dmxChannels, fixtures } = useStore(state => ({
    dmxChannels: state.dmxChannels,
    fixtures: state.fixtures,
  }));

  const handleChannelClick = useCallback((channel: number) => {
    const newSelected = new Set(localSelectedChannels);
    
    if (isMultiSelect) {
      if (newSelected.has(channel)) {
        newSelected.delete(channel);
      } else {
        newSelected.add(channel);
      }
    } else {
      newSelected.clear();
      newSelected.add(channel);
    }
    
    setLocalSelectedChannels(newSelected);
    onChannelSelect?.(channel);
  }, [isMultiSelect, localSelectedChannels, onChannelSelect]);

  const getChannelInfo = useCallback((channel: number) => {
    // Find which fixture this channel belongs to
    const fixture = fixtures?.find(f => {
      const startAddr = f.startAddress - 1; // Convert to 0-indexed
      const endAddr = startAddr + f.channels.length - 1;
      return channel >= startAddr && channel <= endAddr;
    });

    if (fixture) {
      const channelIndex = channel - (fixture.startAddress - 1);
      const channelDef = fixture.channels[channelIndex];
      return {
        fixtureName: fixture.name,
        channelName: channelDef?.name || `Ch ${channelIndex + 1}`,
        channelType: channelDef?.type || 'unknown',
        value: dmxChannels[channel] || 0
      };
    }

    return {
      fixtureName: 'Unassigned',
      channelName: `Channel ${channel + 1}`,
      channelType: 'dimmer',
      value: dmxChannels[channel] || 0
    };
  }, [fixtures, dmxChannels]);

  const filteredChannels = React.useMemo(() => {
    const channels = Array.from({ length: maxChannels }, (_, i) => i);
    
    if (!searchTerm) return channels;
    
    return channels.filter(channel => {
      const info = getChannelInfo(channel);
      return (
        info.fixtureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        info.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (channel + 1).toString().includes(searchTerm)
      );
    });
  }, [maxChannels, searchTerm, getChannelInfo]);

  const renderChannel = useCallback((channel: number) => {
    const info = getChannelInfo(channel);
    const isSelected = localSelectedChannels.has(channel);
    const hasValue = info.value > 0;

    return (
      <div
        key={channel}
        className={`${styles.channelItem} ${isSelected ? styles.selected : ''} ${hasValue ? styles.hasValue : ''}`}
        onClick={() => handleChannelClick(channel)}
        title={`${info.fixtureName} - ${info.channelName} (${info.value})`}
      >
        <div className={styles.channelNumber}>{channel + 1}</div>
        <div className={styles.channelValue}>{info.value}</div>
        <div className={styles.channelName}>{info.channelName}</div>
        {hasValue && (
          <div 
            className={styles.valueBar} 
            style={{ width: `${(info.value / 255) * 100}%` }}
          />
        )}
      </div>
    );
  }, [getChannelInfo, localSelectedChannels, handleChannelClick]);

  const content = (
    <div className={styles.dmxChannelGrid}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🎛️</span>
          <h3>DMX Channels</h3>
        </div>
        {onMinimizedChange && (
          <button
            className={styles.minimizeButton}
            onClick={() => onMinimizedChange(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '📈' : '📉'}
          </button>
        )}
      </div>

      {!isMinimized && (
        <>
          <div className={styles.controls}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search channels, fixtures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.viewControls}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={isMultiSelect}
                  onChange={(e) => setIsMultiSelect(e.target.checked)}
                />
                Multi-select
              </label>
              
              <div className={styles.viewModeButtons}>
                <button
                  className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  ⊞
                </button>
                <button
                  className={`${styles.viewModeButton} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  ☰
                </button>
              </div>

              {viewMode === 'grid' && (
                <select
                  value={channelsPerRow}
                  onChange={(e) => setChannelsPerRow(Number(e.target.value))}
                  className={styles.channelsPerRowSelect}
                >
                  <option value={8}>8 per row</option>
                  <option value={16}>16 per row</option>
                  <option value={24}>24 per row</option>
                  <option value={32}>32 per row</option>
                </select>
              )}
            </div>
          </div>

          <div className={styles.selectedInfo}>
            {localSelectedChannels.size > 0 && (
              <span>
                Selected: {Array.from(localSelectedChannels).map(ch => ch + 1).join(', ')}
              </span>
            )}
          </div>

          <div 
            className={`${styles.channelContainer} ${styles[viewMode]}`}
            style={viewMode === 'grid' ? { gridTemplateColumns: `repeat(${channelsPerRow}, 1fr)` } : {}}
          >
            {filteredChannels.map(renderChannel)}
          </div>

          <div className={styles.footer}>
            <span className={styles.channelCount}>
              Showing {filteredChannels.length} of {maxChannels} channels
            </span>
            <button
              className={styles.clearButton}
              onClick={() => setLocalSelectedChannels(new Set())}
              disabled={localSelectedChannels.size === 0}
            >
              Clear Selection
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (!isDockable) {
    return content;
  }
  return (
    <DockableComponent
      id="dmx-channel-grid"
      title="DMX Channel Grid"
      component="dmx-channel-grid"
      defaultPosition={{ zone: 'floating', offset: { x: 100, y: 100 } }}
      defaultZIndex={1000}
      isMinimized={isMinimized}
      onMinimizedChange={onMinimizedChange}
    >
      {content}
    </DockableComponent>
  );
};
