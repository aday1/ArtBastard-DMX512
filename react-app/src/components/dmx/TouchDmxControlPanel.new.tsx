import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { TouchDmxChannel } from './TouchDmxChannel';

// Channel filtering and page sizing options
interface ChannelFilter {
  name: string;
  startChannel: number;
  endChannel: number;
}

interface PageSize {
  label: string;
  value: number;
}

const CHANNEL_FILTERS: ChannelFilter[] = [
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
  }));

  // Get current filter and calculate displayed channels
  const currentFilter = CHANNEL_FILTERS[selectedFilter];
  const startIdx = currentFilter.startChannel - 1; // Convert to 0-based
  const endIdx = currentFilter.endChannel - 1;
  const totalChannelsInFilter = endIdx - startIdx + 1;
  
  // Calculate pagination
  const totalPages = Math.ceil(totalChannelsInFilter / channelsPerPage);
  const pageStartIdx = startIdx + (currentPage * channelsPerPage);
  const pageEndIdx = Math.min(pageStartIdx + channelsPerPage - 1, endIdx);
  
  // Get channels for current page
  const displayedChannels = Array.from(
    { length: pageEndIdx - pageStartIdx + 1 }, 
    (_, i) => pageStartIdx + i
  );

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
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      touchAction: 'manipulation'
    }}>
      {/* Touch-Optimized Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '1rem',
        borderBottom: '2px solid rgba(78, 205, 196, 0.3)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#4ecdc4',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🎛️ DMX Touch Control
          </h2>
          <div style={{
            background: 'rgba(78, 205, 196, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: '1px solid rgba(78, 205, 196, 0.4)',
            fontSize: '0.9rem',
            color: '#4ecdc4'
          }}>
            {activeChannels} Active Channels
          </div>
        </div>

        {/* Controls Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            background: showControls ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(78, 205, 196, 0.5)',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease',
            marginBottom: showControls ? '1rem' : '0'
          }}
        >
          {showControls ? '▼ Hide Controls' : '▶ Show Controls'}
        </button>

        {/* Filter and Page Size Controls */}
        {showControls && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Channel Filter Dropdown */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#cccccc'
              }}>
                Channel Range:
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(78, 205, 196, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
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
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#cccccc'
              }}>
                Channels Per Page:
              </label>
              <select
                value={channelsPerPage}
                onChange={(e) => setChannelsPerPage(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(78, 205, 196, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
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
        )}

        {/* Page Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Previous Page */}
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 0}
            style={{
              background: currentPage === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(78, 205, 196, 0.3)',
              border: '2px solid rgba(78, 205, 196, 0.5)',
              color: currentPage === 0 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              touchAction: 'manipulation',
              transition: 'all 0.2s ease',
              minWidth: '60px'
            }}
          >
            ‹‹
          </button>

          {/* Page Info */}
          <div style={{
            textAlign: 'center',
            flex: 1,
            fontSize: '0.9rem',
            color: '#cccccc'
          }}>
            <div>
              Page {currentPage + 1} of {totalPages}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Channels {pageStartIdx + 1}-{pageEndIdx + 1} ({currentFilter.name})
            </div>
          </div>

          {/* Next Page */}
          <button
            onClick={() => handlePageChange('next')}
            disabled={currentPage === totalPages - 1}
            style={{
              background: currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(78, 205, 196, 0.3)',
              border: '2px solid rgba(78, 205, 196, 0.5)',
              color: currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              touchAction: 'manipulation',
              transition: 'all 0.2s ease',
              minWidth: '60px'
            }}
          >
            ››
          </button>
        </div>
      </div>

      {/* Channel Grid */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflow: 'auto',
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(channelsPerPage, 4)}, 1fr)`,
        gap: '1rem',
        alignContent: 'start'
      }}>
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
      </div>

      {/* Footer with Quick Navigation */}
      {showControls && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '1rem',
          borderTop: '1px solid rgba(78, 205, 196, 0.3)',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => handlePageChange('first')}
            disabled={currentPage === 0}
            style={{
              background: 'rgba(78, 205, 196, 0.2)',
              border: '1px solid rgba(78, 205, 196, 0.4)',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              touchAction: 'manipulation',
              opacity: currentPage === 0 ? 0.5 : 1
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
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              touchAction: 'manipulation',
              opacity: currentPage === totalPages - 1 ? 0.5 : 1
            }}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};
