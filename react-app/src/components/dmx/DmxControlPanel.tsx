import React, { useState } from 'react'
import { useStore } from '../../store'
import { useTheme } from '../../context/ThemeContext'
import { DmxChannel } from './DmxChannel'
import styles from './DmxControlPanel.module.scss'

export const DmxControlPanel: React.FC = () => {
  const { theme } = useTheme()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [channelsPerPage, setChannelsPerPage] = useState(32)
  const [selectedChannelsOnlyMode, setSelectedChannelsOnlyMode] = useState(false)
  
  const {
    dmxChannels,
    selectedChannels,
    selectAllChannels,
    deselectAllChannels,
    invertChannelSelection,
  } = useStore((state) => ({
    dmxChannels: state.dmxChannels,
    selectedChannels: state.selectedChannels,
    selectAllChannels: state.selectAllChannels,
    deselectAllChannels: state.deselectAllChannels,
    invertChannelSelection: state.invertChannelSelection,
  }))
  
  // Get the channels to display based on mode
  const getDisplayedChannels = () => {
    if (selectedChannelsOnlyMode && selectedChannels.length > 0) {
      // Show only selected channels
      const sortedSelectedChannels = [...selectedChannels].sort((a, b) => a - b)
      const startIdx = currentPage * channelsPerPage
      const endIdx = Math.min(startIdx + channelsPerPage, sortedSelectedChannels.length)
      return sortedSelectedChannels.slice(startIdx, endIdx)
    } else {
      // Show all channels with pagination
      const startIdx = currentPage * channelsPerPage
      const endIdx = Math.min(startIdx + channelsPerPage, 512)
      return Array.from({ length: endIdx - startIdx }, (_, i) => i + startIdx)
    }
  }
  
  // Calculate total pages based on current mode
  const getTotalPages = () => {
    if (selectedChannelsOnlyMode && selectedChannels.length > 0) {
      return Math.ceil(selectedChannels.length / channelsPerPage)
    } else {
      return Math.ceil(512 / channelsPerPage)
    }
  }
  
  const displayedChannels = getDisplayedChannels()
  const totalPages = getTotalPages()
  
  // Calculate completion for progress bar
  const nonZeroChannels = dmxChannels.filter(val => val > 0).length
  const completion = (nonZeroChannels / 512) * 100
  
  // Reset to first page when switching modes
  const handleModeToggle = () => {
    setSelectedChannelsOnlyMode(!selectedChannelsOnlyMode)
    setCurrentPage(0)
  }
  
  return (
    <div className={styles.dmxControlPanel}>
      <h2 className={styles.sectionTitle}>
        {theme === 'artsnob' && 'DMX Channels: The Elemental Brushstrokes'}
        {theme === 'standard' && 'DMX Channel Control'}
        {theme === 'minimal' && 'DMX Channels'}
      </h2>      
      {/* Status bar showing active channels */}
      <div className={styles.statusBar}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${completion}%` }}
          ></div>
        </div>
        <div className={styles.stats}>
          <span>{nonZeroChannels} active channels</span>
          <span>{selectedChannels.length} selected</span>
          {selectedChannelsOnlyMode && (
            <span className={styles.modeIndicator}>📱 Touch Mode</span>
          )}
        </div>
      </div>
      
      {/* Control toolbar */}
      <div className={styles.controlToolbar}>
        <div className={styles.selectionControls}>
          <button onClick={selectAllChannels} className={styles.toolbarButton}>
            <i className="fas fa-check-double"></i>
            {theme !== 'minimal' && <span>Select All</span>}
          </button>
          <button onClick={deselectAllChannels} className={styles.toolbarButton}>
            <i className="fas fa-times"></i>
            {theme !== 'minimal' && <span>Deselect All</span>}
          </button>
          <button onClick={invertChannelSelection} className={styles.toolbarButton}>
            <i className="fas fa-exchange-alt"></i>
            {theme !== 'minimal' && <span>Invert</span>}
          </button>
          
          {/* Touch Mode Toggle */}
          <button 
            onClick={handleModeToggle} 
            className={`${styles.toolbarButton} ${selectedChannelsOnlyMode ? styles.active : ''}`}
            title={selectedChannelsOnlyMode ? "Show All Channels" : "Show Selected Channels Only (Touch Mode)"}
          >
            <i className="fas fa-hand-pointer"></i>
            {theme !== 'minimal' && (
              <span>{selectedChannelsOnlyMode ? 'All Channels' : 'Selected Only'}</span>
            )}
          </button>
        </div>
        
        <div className={styles.pageControls}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className={styles.pageButton}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <select 
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            className={styles.pageSelect}
          >
            {Array.from({ length: totalPages }, (_, i) => {
              if (selectedChannelsOnlyMode && selectedChannels.length > 0) {
                const sortedSelected = [...selectedChannels].sort((a, b) => a - b)
                const startCh = sortedSelected[i * channelsPerPage]
                const endIdx = Math.min((i + 1) * channelsPerPage - 1, sortedSelected.length - 1)
                const endCh = sortedSelected[endIdx]
                return (
                  <option key={i} value={i}>
                    Ch {startCh + 1}-{endCh + 1}
                  </option>
                )
              } else {
                return (
                  <option key={i} value={i}>
                    {i * channelsPerPage + 1}-{Math.min((i + 1) * channelsPerPage, 512)}
                  </option>
                )
              }
            })}
          </select>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className={styles.pageButton}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div className={styles.viewControls}>
          <select 
            value={channelsPerPage}
            onChange={(e) => {
              setChannelsPerPage(Number(e.target.value))
              setCurrentPage(0) // Reset to first page when changing view
            }}
            className={styles.viewSelect}
          >
            <option value={8}>8 channels</option>
            <option value={16}>16 channels</option>
            <option value={32}>32 channels</option>
            <option value={64}>64 channels</option>
            <option value={128}>128 channels</option>
          </select>
          
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Filter channels..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className={styles.searchInput}
            />
            {filterText && (
              <button 
                onClick={() => setFilterText('')}
                className={styles.clearSearch}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>      
      {/* Selected Channels Only Mode Info */}
      {selectedChannelsOnlyMode && (
        <div className={styles.modeInfo}>
          {selectedChannels.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-info-circle"></i>
              <span>No channels selected. Select channels to use Touch Mode.</span>
            </div>
          ) : (
            <div className={styles.modeStats}>
              <i className="fas fa-hand-pointer"></i>
              <span>Showing {Math.min(channelsPerPage, selectedChannels.length - (currentPage * channelsPerPage))} of {selectedChannels.length} selected channels</span>
            </div>
          )}
        </div>
      )}
        {/* DMX Channels grid */}
      <div className={`${styles.channelsGrid} ${selectedChannelsOnlyMode ? styles.touchMode : ''}`}>
        {displayedChannels.map((index) => (
          <DmxChannel 
            key={index} 
            index={index}
            allowFullscreen={!selectedChannelsOnlyMode} 
            allowDetach={!selectedChannelsOnlyMode}
            touchOptimized={selectedChannelsOnlyMode}
          />
        ))}
      </div>
      
      {/* Pagination controls at bottom */}
      <div className={styles.pagination}>
        <button 
          onClick={() => setCurrentPage(0)}
          disabled={currentPage === 0}
          className={styles.paginationButton}
        >
          <i className="fas fa-angle-double-left"></i>
        </button>
        <button 
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className={styles.paginationButton}
        >
          <i className="fas fa-angle-left"></i>
        </button>
        
        <div className={styles.pageIndicator}>
          Page {currentPage + 1} of {totalPages}
          {selectedChannelsOnlyMode && selectedChannels.length > 0 && (
            <span className={styles.modeLabel}>• Touch Mode</span>
          )}
        </div>
        
        <button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage === totalPages - 1}
          className={styles.paginationButton}
        >
          <i className="fas fa-angle-right"></i>
        </button>
        <button 
          onClick={() => setCurrentPage(totalPages - 1)}
          disabled={currentPage === totalPages - 1}
          className={styles.paginationButton}
        >
          <i className="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>
  )
}