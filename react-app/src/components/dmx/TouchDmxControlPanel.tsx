import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { TouchDmxChannel } from './TouchDmxChannel';
import { TouchPanelManager } from '../touch/TouchPanelManager';

// Add CSS for better scrolling
const scrollbarStyles = `
  .touch-dmx-grid::-webkit-scrollbar {
    width: 6px;
  }
  .touch-dmx-grid::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  .touch-dmx-grid::-webkit-scrollbar-thumb {
    background: rgba(78, 205, 196, 0.5);
    border-radius: 3px;
  }
  .touch-dmx-grid::-webkit-scrollbar-thumb:hover {
    background: rgba(78, 205, 196, 0.7);
  }
`;

// Inject styles if not already injected
if (typeof document !== 'undefined' && !document.getElementById('touch-dmx-scrollbar-styles')) {
  const style = document.createElement('style');
  style.id = 'touch-dmx-scrollbar-styles';
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}

// Channel filtering and page sizing options
interface ChannelFilter {
  name: string;
  startChannel: number;
  endChannel: number;
  isSelectedOnly?: boolean;
}

interface PageSize {
  label: string;
  value: number;
}

const CHANNEL_FILTERS: ChannelFilter[] = [
  { name: "Selected Channels Only", startChannel: 1, endChannel: 512, isSelectedOnly: true },
  { name: "All Channels", startChannel: 1, endChannel: 512 },
  { name: "Channels 1-16", startChannel: 1, endChannel: 16 },
  { name: "Channels 17-32", startChannel: 17, endChannel: 32 },
  { name: "Channels 33-64", startChannel: 33, endChannel: 64 },
  { name: "Channels 65-128", startChannel: 65, endChannel: 128 },
  { name: "Channels 129-256", startChannel: 129, endChannel: 256 },
  { name: "Channels 257-512", startChannel: 257, endChannel: 512 }
];

const PAGE_SIZES: PageSize[] = [
  { label: "1 channel per page", value: 1 },
  { label: "4 channels per page", value: 4 },
  { label: "8 channels per page", value: 8 },
  { label: "16 channels per page", value: 16 },
  { label: "32 channels per page", value: 32 },
  { label: "64 channels per page", value: 64 },
  { label: "128 channels per page", value: 128 },
  { label: "256 channels per page", value: 256 }
];

export const TouchDmxControlPanel: React.FC<{ touchOptimized?: boolean }> = ({ touchOptimized = false }) => {
  const [selectedFilter, setSelectedFilter] = useState(0); // Index into CHANNEL_FILTERS
  const [channelsPerPage, setChannelsPerPage] = useState(4); // Default 4 channels per page for touch
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showPanelManager, setShowPanelManager] = useState(false);

  const {
    dmxChannels,
    selectedChannels,
    toggleChannelSelection,
    setDmxChannel,
  } = useStore((state) => ({
    dmxChannels: state.dmxChannels,
    selectedChannels: state.selectedChannels,
    toggleChannelSelection: state.toggleChannelSelection,
    setDmxChannel: state.setDmxChannel,
  }));  // Get current filter and calculate displayed channels
  const currentFilter = CHANNEL_FILTERS[selectedFilter];
  let totalChannelsInFilter, displayedChannels, totalPages;
  
  if (currentFilter.isSelectedOnly) {
    // Use selected channels only
    const sortedSelectedChannels = [...selectedChannels].sort((a, b) => a - b);
    totalChannelsInFilter = sortedSelectedChannels.length;
    totalPages = Math.ceil(totalChannelsInFilter / channelsPerPage);
    
    // Calculate pagination for selected channels
    const pageStartIdx = currentPage * channelsPerPage;
    const pageEndIdx = Math.min(pageStartIdx + channelsPerPage, totalChannelsInFilter);
    
    displayedChannels = sortedSelectedChannels.slice(pageStartIdx, pageEndIdx);
  } else {
    // Use channel range filter
    const startIdx = currentFilter.startChannel - 1; // Convert to 0-based
    const endIdx = currentFilter.endChannel - 1;
    totalChannelsInFilter = endIdx - startIdx + 1;
    totalPages = Math.ceil(totalChannelsInFilter / channelsPerPage);
    
    // Calculate pagination
    const pageStartIdx = startIdx + (currentPage * channelsPerPage);
    const pageEndIdx = Math.min(pageStartIdx + channelsPerPage - 1, endIdx);
    
    // Get channels for current page
    displayedChannels = Array.from(
      { length: pageEndIdx - pageStartIdx + 1 }, 
      (_, i) => pageStartIdx + i
    );
  }

  // Reset current page when filter or page size changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedFilter, channelsPerPage]);

  // Calculate active channels
  const activeChannels = dmxChannels.filter(val => val > 0).length;

  const handleValueChange = (index: number, value: number) => {
    setDmxChannel(index, value);
  };

  const handleToggleSelection = (index: number) => {
    toggleChannelSelection(index);
  };

  const handlePageChange = (direction: 'prev' | 'next' | 'first' | 'last') => {
    switch (direction) {
      case 'prev':
        setCurrentPage(prev => Math.max(0, prev - 1));
        break;
      case 'next':
        setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
        break;
      case 'first':
        setCurrentPage(0);
        break;
      case 'last':
        setCurrentPage(totalPages - 1);
        break;
    }
  };

  if (!touchOptimized) {
    // Return standard DMX control panel for non-touch interfaces
    return (
      <div style={{ padding: '1rem' }}>
        <p>Standard DMX Control Panel - Switch to touch mode in external monitor</p>
      </div>
    );  }
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      touchAction: 'manipulation',
      position: 'relative'
    }}>
      {/* Touch Panel Manager */}
      <TouchPanelManager 
        isVisible={showPanelManager}
        onToggle={() => setShowPanelManager(!showPanelManager)}
      />

      {/* Touch-Optimized Header - Non-blocking */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '0.4rem 0.8rem',
        borderBottom: '1px solid rgba(78, 205, 196, 0.3)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        // Prevent header from blocking touch events to grid
        pointerEvents: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.4rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#4ecdc4',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            🎛️ DMX Touch
          </h2>
          <div style={{
            background: 'rgba(78, 205, 196, 0.2)',
            padding: '0.2rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(78, 205, 196, 0.4)',
            fontSize: '0.7rem',
            color: '#4ecdc4'
          }}>
            {activeChannels} Active
          </div>
        </div>

        {/* Controls Toggle - Non-blocking */}<button
          onClick={() => setShowControls(!showControls)}
          style={{
            background: showControls ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(78, 205, 196, 0.5)',
            color: '#ffffff',
            padding: '0.3rem 0.6rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: '500',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease',
            marginBottom: showControls ? '0.4rem' : '0'
          }}
        >
          {showControls ? '▼ Hide' : '▶ Show'}
        </button>

        {/* Filter and Page Size Controls - Compact */}        {showControls && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            marginBottom: '0.4rem'
          }}>
            {/* Channel Filter Dropdown */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.2rem',
                fontSize: '0.7rem',
                color: '#cccccc'
              }}>
                Range:
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.3rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  touchAction: 'manipulation',
                  cursor: 'pointer'
                }}
              >
                {CHANNEL_FILTERS.map((filter, index) => (
                  <option key={index} value={index} style={{ background: '#2d2d2d', color: '#ffffff' }}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size Dropdown */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.2rem',
                fontSize: '0.7rem',
                color: '#cccccc'
              }}>
                Per Page:
              </label>
              <select
                value={channelsPerPage}
                onChange={(e) => setChannelsPerPage(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.3rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  touchAction: 'manipulation',
                  cursor: 'pointer'
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size.value} value={size.value} style={{ background: '#2d2d2d', color: '#ffffff' }}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}        {/* Page Navigation - Compact */}
        {showControls && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {/* Previous Page */}            <button
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 0}
              style={{
                background: currentPage === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(78, 205, 196, 0.3)',
                border: '1px solid rgba(78, 205, 196, 0.5)',
                color: currentPage === 0 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                touchAction: 'manipulation',
                transition: 'all 0.2s ease',
                minWidth: '60px'
              }}
            >
              ‹‹
            </button>            {/* Page Info */}
            <div style={{
              textAlign: 'center',
              flex: 1,
              fontSize: '0.7rem',
              color: '#cccccc'
            }}>
              <div>
                Page {currentPage + 1}/{totalPages}
              </div>
              <div style={{ fontSize: '0.65rem', marginTop: '0.1rem' }}>
                {currentFilter.isSelectedOnly && selectedChannels.length > 0 
                  ? `Selected: ${displayedChannels.length} channels`
                  : displayedChannels.length > 0 
                    ? `Ch ${displayedChannels[0] + 1}-${displayedChannels[displayedChannels.length - 1] + 1}`
                    : 'No channels'
                }
              </div>
            </div>

            {/* Next Page */}            <button
              onClick={() => handlePageChange('next')}
              disabled={currentPage === totalPages - 1}
              style={{
                background: currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(78, 205, 196, 0.3)',
                border: '1px solid rgba(78, 205, 196, 0.5)',
                color: currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                touchAction: 'manipulation',
                transition: 'all 0.2s ease',
                minWidth: '60px'
              }}
            >
              ››
            </button>
          </div>
        )}
      </div>      {/* Channel Grid - Fixed Touch Scrolling */}      <div 
        className="touch-dmx-grid"
        style={{
          flex: 1,
          padding: '0.75rem',
          overflow: 'auto',
          overflowX: 'hidden',
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(channelsPerPage, 4)}, 1fr)`,
          gap: '0.5rem',
          alignContent: 'start',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollBehavior: 'smooth',
          // Fix touch scrolling when controls are visible
          touchAction: showControls ? 'pan-y' : 'manipulation',
          // Ensure proper scrolling behavior
          position: 'relative',
          height: '100%',
          minHeight: '0' // Allow flex shrinking
        }}
      >
        {displayedChannels.map((channelIndex) => (
          <TouchDmxChannel
            key={channelIndex}
            index={channelIndex}
            value={dmxChannels[channelIndex] || 0}
            isSelected={selectedChannels.includes(channelIndex)}
            onValueChange={handleValueChange}
            onToggleSelection={handleToggleSelection}
          />
        ))}
      </div>      {/* Compact Footer with Quick Navigation - Auto-hide when controls hidden */}
      {showControls && totalPages > 1 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '0.4rem',
          borderTop: '1px solid rgba(78, 205, 196, 0.3)',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.3rem',
          flexShrink: 0
        }}>          <button
            onClick={() => handlePageChange('first')}
            disabled={currentPage === 0}
            style={{
              background: 'rgba(78, 205, 196, 0.2)',
              border: '1px solid rgba(78, 205, 196, 0.4)',
              color: '#ffffff',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              touchAction: 'manipulation',
              opacity: currentPage === 0 ? 0.5 : 1,
              minWidth: '60px'
            }}
          >
            First
          </button>
          <button
            onClick={() => handlePageChange('last')}
            disabled={currentPage === totalPages - 1}
            style={{
              background: 'rgba(78, 205, 196, 0.2)',
              border: '1px solid rgba(78, 205, 196, 0.4)',
              color: '#ffffff',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              touchAction: 'manipulation',
              opacity: currentPage === totalPages - 1 ? 0.5 : 1,
              minWidth: '60px'
            }}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};
