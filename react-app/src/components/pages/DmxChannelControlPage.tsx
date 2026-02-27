import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import { useGlobalBrowserMidi } from '../../hooks/useGlobalBrowserMidi';
import { useTheme } from '../../context/ThemeContext';
import { useMobile } from '../../hooks/useMobile';
import { LucideIcon } from '../ui/LucideIcon';
import { EnvelopeAutomation } from '../automation/EnvelopeAutomation';
import { GlobalChannelNames } from '../channels/GlobalChannelNames';
import { DmxControlsPanel } from '../dmx/DmxControlsPanel';
import { DmxFixtureSelector } from '../dmx/DmxFixtureSelector';
import { DmxSceneControls } from '../dmx/DmxSceneControls';
import { DmxFooterInfo } from '../dmx/DmxFooterInfo';
import { DmxMidiConnections } from '../dmx/DmxMidiConnections';
import { DmxPinnedChannels } from '../dmx/DmxPinnedChannels';
import { DmxActiveChannelsSummary } from '../dmx/DmxActiveChannelsSummary';
import styles from './DmxChannelControlPage.module.scss';
import pageStyles from '../../pages/Pages.module.scss';

export const DmxChannelControlPage: React.FC = () => {
  const { theme } = useTheme();
  const { isMobile, isTablet, isTouch } = useMobile();

  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [filter, setFilter] = useState<'all' | 'active' | 'selected' | 'range' | 'selectedFixtures'>('all');
  const [range, setRange] = useState({ start: 1, end: 32 });
  const [searchTerm, setSearchTerm] = useState('');
  const [channelsPerPage, setChannelsPerPage] = useState(64);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSceneControls, setShowSceneControls] = useState(true);
  const [showMidiControls, setShowMidiControls] = useState(true);
  const [showOscControls, setShowOscControls] = useState(true);
  const [showEnvelopeAutomation, setShowEnvelopeAutomation] = useState(true);
  const [showGlobalChannelNames, setShowGlobalChannelNames] = useState(false);
  const [editingChannelName, setEditingChannelName] = useState<number | null>(null);
  const [editingChannelNameValue, setEditingChannelNameValue] = useState('');
  const [highlightedChannel, setHighlightedChannel] = useState<number | null>(null);
  const [showFixtureSelector, setShowFixtureSelector] = useState(false);
  const [fixtureSearchTerm, setFixtureSearchTerm] = useState('');
  const [fixtureFilter, setFixtureFilter] = useState<'all' | 'active' | 'byType' | 'byRange'>('all');
  const [fixtureTypeFilter, setFixtureTypeFilter] = useState<string>('');
  const [fixtureAddressRange, setFixtureAddressRange] = useState({ start: 1, end: 512 });
  const pageRef = useRef<HTMLDivElement>(null);
  const fixtureSelectorRef = useRef<HTMLDivElement>(null);

  // Helper: Jump to a specific channel by switching to its page and scrolling
  const scrollToChannel = (channelIndex: number) => {
    // Ensure the channel is visible by resetting filters
    setFilter('all');

    const pageIndex = Math.floor(channelIndex / channelsPerPage);
    setHighlightedChannel(channelIndex);

    if (pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
      // Wait for the page to render the target channel before scrolling
      setTimeout(() => {
        const el = document.getElementById(`dmx-channel-${channelIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } else {
      const el = document.getElementById(`dmx-channel-${channelIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Clear highlight after a short delay
    setTimeout(() => setHighlightedChannel(null), 2000);
  };

  // Store hooks
  const {
    // DMX Controls
    dmxChannels,
    selectedChannels,
    channelNames,
    channelRanges,
    channelColors,
    setDmxChannel,
    toggleChannelSelection,
    selectAllChannels,
    deselectAllChannels,
    midiMappings,
    removeMidiMapping,
    addMidiMapping,
    oscAssignments,
    setOscAssignment,
    setChannelName,
    setChannelRange,
    getChannelRange,
    setChannelColor,
    setRandomChannelColor,
    pinnedChannels,
    togglePinChannel,
    fixtures,
    selectedFixtures,
    setSelectedFixtures,
    toggleFixtureSelection,
    groups,
    selectFixtureGroup,

    // Fixture Helper Functions
    getChannelInfo,
    getFixtureColor,
    isChannelAssigned,

    // Scene Controls
    scenes,
    saveScene,
    loadScene,
    addNotification,

    // MIDI Learn
    startMidiLearn,
    cancelMidiLearn,
    midiLearnTarget,

    // Envelope Automation
    envelopeAutomation,
    toggleEnvelope,
    channelJumpTarget,
  } = useStore();

  // Listen for channel jump requests (e.g. from PinnedChannels sidebar)
  useEffect(() => {
    if (channelJumpTarget !== null) {
      console.log(`[DMXChannelControl] Scrolling to channel ${channelJumpTarget + 1} requested by jump target state`);
      scrollToChannel(channelJumpTarget);
    }
  }, [channelJumpTarget]);

  // MIDI Learn hook
  const { isLearning, learnStatus, currentLearningChannel, startLearn, cancelLearn } = useMidiLearn();

  // Global Browser MIDI hook
  const {
    isSupported: browserMidiSupported,
    error: browserMidiError,
    browserInputs,
    activeBrowserInputs,
    connectBrowserInput,
    disconnectBrowserInput,
    refreshDevices
  } = useGlobalBrowserMidi();


  // Get filtered channels
  const getFilteredChannels = () => {
    let channels: number[] = [];

    switch (filter) {
      case 'all':
        channels = Array.from({ length: 512 }, (_, i) => i);
        break;
      case 'active':
        channels = Array.from({ length: 512 }, (_, i) => i).filter(i => (dmxChannels[i] || 0) > 0);
        break;
      case 'selected':
        channels = selectedChannels;
        break;
      case 'range':
        channels = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);
        break;
      case 'selectedFixtures':
        // Filter by selected fixtures
        if (selectedFixtures.length > 0) {
          const fixtureChannels = new Set<number>();
          selectedFixtures.forEach(fixtureId => {
            const fixture = fixtures.find(f => f.id === fixtureId);
            if (fixture) {
              const startAddress = fixture.startAddress;
              const channelCount = fixture.channels?.length || 0;
              for (let i = 0; i < channelCount; i++) {
                const channelIndex = startAddress - 1 + i; // Convert to 0-based index
                if (channelIndex >= 0 && channelIndex < 512) {
                  fixtureChannels.add(channelIndex);
                }
              }
            }
          });
          channels = Array.from(fixtureChannels).sort((a, b) => a - b);
        } else {
          // If no fixtures selected, show all channels
          channels = Array.from({ length: 512 }, (_, i) => i);
        }
        break;
    }

    // Filter by selected fixtures if any are selected AND filter is not already 'selectedFixtures'
    if (selectedFixtures.length > 0 && filter !== 'selectedFixtures') {
      const fixtureChannels = new Set<number>();
      selectedFixtures.forEach(fixtureId => {
        const fixture = fixtures.find(f => f.id === fixtureId);
        if (fixture) {
          const startAddress = fixture.startAddress;
          const channelCount = fixture.channels?.length || 0;
          for (let i = 0; i < channelCount; i++) {
            const channelIndex = startAddress - 1 + i; // Convert to 0-based index
            if (channelIndex >= 0 && channelIndex < 512) {
              fixtureChannels.add(channelIndex);
            }
          }
        }
      });
      channels = channels.filter(channel => fixtureChannels.has(channel));
    }

    // Apply search filter
    if (searchTerm) {
      channels = channels.filter(channel => {
        const channelName = channelNames[channel] || `Channel ${channel + 1}`;
        return channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (channel + 1).toString().includes(searchTerm);
      });
    }

    return channels;
  };

  const filteredChannels = getFilteredChannels();
  const totalPages = Math.ceil(filteredChannels.length / channelsPerPage);
  const startIndex = currentPage * channelsPerPage;
  const endIndex = Math.min(startIndex + channelsPerPage, filteredChannels.length);
  const displayedChannels = filteredChannels.slice(startIndex, endIndex);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filter, range, searchTerm, selectedFixtures]);

  // Helper: Get filtered fixtures based on search and filters
  const getFilteredFixtures = () => {
    let filtered = [...fixtures];

    // Apply search filter
    if (fixtureSearchTerm) {
      const searchLower = fixtureSearchTerm.toLowerCase();
      filtered = filtered.filter(fixture => 
        fixture.name.toLowerCase().includes(searchLower) ||
        fixture.startAddress.toString().includes(fixtureSearchTerm) ||
        fixture.type?.toLowerCase().includes(searchLower) ||
        fixture.manufacturer?.toLowerCase().includes(searchLower) ||
        fixture.model?.toLowerCase().includes(searchLower)
      );
    }

    // Apply active filter (fixtures with non-zero DMX values)
    if (fixtureFilter === 'active') {
      filtered = filtered.filter(fixture => {
        const startAddress = fixture.startAddress;
        const channelCount = fixture.channels?.length || 0;
        for (let i = 0; i < channelCount; i++) {
          const channelIndex = startAddress - 1 + i;
          if (channelIndex >= 0 && channelIndex < 512 && (dmxChannels[channelIndex] || 0) > 0) {
            return true;
          }
        }
        return false;
      });
    }

    // Apply type filter
    if (fixtureFilter === 'byType' && fixtureTypeFilter) {
      filtered = filtered.filter(fixture => 
        fixture.type?.toLowerCase() === fixtureTypeFilter.toLowerCase()
      );
    }

    // Apply address range filter
    if (fixtureFilter === 'byRange') {
      filtered = filtered.filter(fixture => 
        fixture.startAddress >= fixtureAddressRange.start && 
        fixture.startAddress <= fixtureAddressRange.end
      );
    }

    return filtered;
  };

  const filteredFixtures = getFilteredFixtures();

  // Get unique fixture types
  const fixtureTypes = Array.from(new Set(fixtures.map(f => f.type).filter(Boolean))).sort();

  // Helper: Check if fixture is active
  const isFixtureActive = (fixture: any) => {
    const startAddress = fixture.startAddress;
    const channelCount = fixture.channels?.length || 0;
    for (let i = 0; i < channelCount; i++) {
      const channelIndex = startAddress - 1 + i;
      if (channelIndex >= 0 && channelIndex < 512 && (dmxChannels[channelIndex] || 0) > 0) {
        return true;
      }
    }
    return false;
  };

  // Close fixture selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fixtureSelectorRef.current &&
        !fixtureSelectorRef.current.contains(event.target as Node) &&
        showFixtureSelector
      ) {
        setShowFixtureSelector(false);
      }
    };

    if (showFixtureSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFixtureSelector]);

  // Embedded MIDI monitor removed; floating monitor remains available globally

  // Debug MIDI mappings changes
  useEffect(() => {
    console.log(`[DMXChannelControl] MIDI mappings updated:`, midiMappings);
    console.log(`[DMXChannelControl] MIDI mappings count:`, Object.keys(midiMappings).length);

    // Test: Add a debug mapping to channel 0 to test Forget button visibility
    if (Object.keys(midiMappings).length === 0) {
      console.log(`[DMXChannelControl] No MIDI mappings found. Testing with debug mapping...`);
      // Uncomment the line below to test Forget button visibility
      // addMidiMapping(0, { channel: 0, controller: 1 });
    }
  }, [midiMappings]);

  // Helper function to get fixture info for a channel
  const getFixtureInfoForChannel = (channelIndex: number) => {
    const dmxAddress = channelIndex + 1; // Convert 0-based index to 1-based address

    for (const fixture of fixtures || []) {
      const fixtureStartAddress = fixture.startAddress;
      const fixtureEndAddress = fixtureStartAddress + (fixture.channels?.length || 0) - 1;

      if (dmxAddress >= fixtureStartAddress && dmxAddress <= fixtureEndAddress) {
        const channelOffset = dmxAddress - fixtureStartAddress;
        const channel = fixture.channels?.[channelOffset];

        if (channel) {
          return {
            fixtureName: fixture.name,
            channelFunction: channel.name || `${channel.type} Channel`,
            channelType: channel.type,
          };
        }
      }
    }

    return null;
  };



  // Handle channel name editing
  const handleStartEditName = (channelIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow editing regardless of fixture assignment - custom names can override fixture names
    setEditingChannelName(channelIndex);
    setEditingChannelNameValue(channelNames[channelIndex] || `Channel ${channelIndex + 1}`);
  };

  const handleSaveChannelName = (channelIndex: number) => {
    setChannelName(channelIndex, editingChannelNameValue);
    setEditingChannelName(null);
    setEditingChannelNameValue('');
  };

  const handleCancelEditName = () => {
    setEditingChannelName(null);
    setEditingChannelNameValue('');
  };

  // MIDI Learn handlers
  const handleMidiLearn = (channelIndex: number) => {
    // Scroll to channel when Learn is clicked
    scrollToChannel(channelIndex);
    console.log(`[DMXChannelControl] MIDI Learn clicked for channel ${channelIndex}`);
    console.log(`[DMXChannelControl] Current state:`, {
      isLearning,
      currentLearningChannel,
      midiLearnTarget,
      midiMappings: Object.keys(midiMappings).length
    });

    if (isLearning && currentLearningChannel === channelIndex) {
      console.log(`[DMXChannelControl] Cancelling MIDI Learn for channel ${channelIndex}`);
      cancelLearn();
    } else {
      console.log(`[DMXChannelControl] Starting MIDI Learn for channel ${channelIndex}`);
      startLearn(channelIndex);
    }
  };

  const handleMidiForget = (channelIndex: number) => {
    console.log(`[DMXChannelControl] MIDI Forget clicked for channel ${channelIndex}`);
    console.log(`[DMXChannelControl] Current mapping:`, midiMappings[channelIndex]);

    removeMidiMapping(channelIndex);
    addNotification({
      message: `MIDI mapping removed for DMX CH ${channelIndex + 1}`,
      type: 'info',
      priority: 'normal'
    });
  };

  // MIDI connection handlers
  const handleMidiConnect = (inputId: string) => {
    connectBrowserInput(inputId);
    addNotification({
      message: `Connected to MIDI input: ${inputId}`,
      type: 'success',
      priority: 'normal'
    });
  };

  const handleMidiDisconnect = (inputId: string) => {
    disconnectBrowserInput(inputId);
    addNotification({
      message: `Disconnected from MIDI input: ${inputId}`,
      type: 'info',
      priority: 'normal'
    });
  };

  const handleRefreshMidiDevices = () => {
    refreshDevices();
    addNotification({
      message: 'MIDI devices refreshed',
      type: 'info',
      priority: 'normal'
    });
  };

  // OSC assignment handlers
  const handleSetOscAddress = (channelIndex: number) => {
    const currentAddress = oscAssignments[channelIndex] || '';
    const newAddress = prompt(`Enter OSC address for DMX CH ${channelIndex + 1}:`, currentAddress);
    if (newAddress !== null) {
      setOscAssignment(channelIndex, newAddress);
      addNotification({
        message: `OSC address set for DMX CH ${channelIndex + 1}: ${newAddress}`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  // Scene handlers
  const handleSaveScene = () => {
    const sceneName = prompt('Enter scene name:');
    if (sceneName) {
      const oscAddress = prompt('Enter OSC address (optional):') || `/scene/${sceneName}`;
      saveScene(sceneName, oscAddress);
      addNotification({
        message: `Scene "${sceneName}" saved successfully`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  const handleLoadScene = (sceneName: string) => {
    loadScene(sceneName);
    addNotification({
      message: `Scene "${sceneName}" loaded successfully`,
      type: 'success',
      priority: 'normal'
    });
  };

  // Pagination handlers
  const handlePageChange = (direction: 'prev' | 'next' | 'first' | 'last') => {
    switch (direction) {
      case 'prev':
        setCurrentPage(Math.max(0, currentPage - 1));
        break;
      case 'next':
        setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
        break;
      case 'first':
        setCurrentPage(0);
        break;
      case 'last':
        setCurrentPage(totalPages - 1);
        break;
    }
  };

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.pageHeader}>
        <div className={pageStyles.headerContent}>
          <h2>
            {theme === 'artsnob' && 'Le Contrôle DMX Ultime'}
            {theme === 'standard' && 'DMX Channel Control'}
            {theme === 'minimal' && 'DMX Control'}
          </h2>
          <p>
            {theme === 'artsnob' && 'Direct DMX channel control with MIDI Learn/Forget functionality'}
            {theme === 'standard' && 'Direct DMX channel control with MIDI Learn/Forget functionality'}
            {theme === 'minimal' && 'Direct DMX channel control'}
          </p>
        </div>
      </div>

      <div className={pageStyles.pageContent}>
        <div className={styles.dmxChannelControlPage}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>
                <LucideIcon name="Sliders" />
                DMX Channel Control
              </h1>
              <div className={styles.stats}>
                <span className={styles.stat}>
                  <LucideIcon name="Zap" />
                  {Object.values(dmxChannels).filter(v => v > 0).length} Active
                </span>
                <span className={styles.stat}>
                  <LucideIcon name="CheckSquare" />
                  {selectedFixtures.length > 0 
                    ? `${selectedFixtures.length} Fixture${selectedFixtures.length !== 1 ? 's' : ''} Selected`
                    : `${selectedChannels.length} Channel${selectedChannels.length !== 1 ? 's' : ''} Selected`}
                </span>
                <span className={styles.stat}>
                  <LucideIcon name="Music" />
                  {Object.keys(midiMappings).length} MIDI Mapped
                </span>
                {isLearning && (
                  <span className={`${styles.stat} ${styles.learningStat}`}>
                    <LucideIcon name="Radio" />
                    Learning CH {currentLearningChannel !== null ? currentLearningChannel + 1 : '?'}
                  </span>
                )}
              </div>
            </div>
            
            <DmxFixtureSelector
              fixtures={fixtures}
              groups={groups}
              selectedFixtures={selectedFixtures}
              setSelectedFixtures={setSelectedFixtures}
              toggleFixtureSelection={toggleFixtureSelection}
              showFixtureSelector={showFixtureSelector}
              setShowFixtureSelector={setShowFixtureSelector}
              fixtureSelectorRef={fixtureSelectorRef}
              fixtureSearchTerm={fixtureSearchTerm}
              setFixtureSearchTerm={setFixtureSearchTerm}
              fixtureFilter={fixtureFilter}
              setFixtureFilter={setFixtureFilter}
              fixtureTypeFilter={fixtureTypeFilter}
              setFixtureTypeFilter={setFixtureTypeFilter}
              fixtureAddressRange={fixtureAddressRange}
              setFixtureAddressRange={setFixtureAddressRange}
              fixtureTypes={fixtureTypes}
              filteredFixtures={filteredFixtures}
              isFixtureActive={isFixtureActive}
              getFixtureColor={getFixtureColor}
            />
          </div>

          <DmxControlsPanel
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filter={filter}
            onFilterChange={(nextFilter) => setFilter(nextFilter)}
            selectedFixturesCount={selectedFixtures.length}
            selectedChannelsCount={selectedChannels.length}
            range={range}
            onRangeChange={setRange}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onShowSelectedOnly={() => {
              setFilter('selected');
              setCurrentPage(0);
            }}
            onSelectAllChannels={selectAllChannels}
            onDeselectAllChannels={deselectAllChannels}
            channelsPerPage={channelsPerPage}
            onChannelsPerPageChange={setChannelsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showSceneControls={showSceneControls}
            onToggleSceneControls={() => setShowSceneControls(!showSceneControls)}
            showMidiControls={showMidiControls}
            onToggleMidiControls={() => setShowMidiControls(!showMidiControls)}
            showOscControls={showOscControls}
            onToggleOscControls={() => setShowOscControls(!showOscControls)}
            showEnvelopeAutomation={showEnvelopeAutomation}
            onToggleEnvelopeAutomation={() => setShowEnvelopeAutomation(!showEnvelopeAutomation)}
            showGlobalChannelNames={showGlobalChannelNames}
            onToggleGlobalChannelNames={() => setShowGlobalChannelNames(!showGlobalChannelNames)}
          />

          {/* Global Channel Names */}
          {showGlobalChannelNames && (
            <div className={styles.globalChannelNamesSection}>
              <GlobalChannelNames />
            </div>
          )}

          {/* Envelope Automation */}
          {showEnvelopeAutomation && (
            <div className={styles.envelopeAutomationSection}>
              <EnvelopeAutomation />
            </div>
          )}

          {/* Scene Controls */}
          {showSceneControls && (
            <DmxSceneControls
              scenes={scenes}
              onSaveScene={handleSaveScene}
              onLoadScene={handleLoadScene}
            />
          )}

          {/* MIDI Connection Controls */}
          {showMidiControls && (
            <DmxMidiConnections
              browserMidiError={browserMidiError}
              browserMidiSupported={browserMidiSupported}
              browserInputs={browserInputs}
              activeBrowserInputs={activeBrowserInputs}
              onRefreshMidiDevices={handleRefreshMidiDevices}
              onConnectMidiDevice={handleMidiConnect}
              onDisconnectMidiDevice={handleMidiDisconnect}
            />
          )}

          {/* Embedded MIDI Monitor section removed */}

          {/* Pinned Channels Section */}
          <DmxPinnedChannels
            pinnedChannels={pinnedChannels || []}
            dmxChannels={dmxChannels}
            channelNames={channelNames}
            midiMappings={midiMappings}
            oscAssignments={oscAssignments}
            showOscControls={showOscControls}
            showMidiControls={showMidiControls}
            getChannelInfo={getChannelInfo}
            isChannelAssigned={isChannelAssigned}
            getFixtureColor={getFixtureColor}
            getChannelRange={getChannelRange}
            setDmxChannel={setDmxChannel}
            setChannelRange={setChannelRange}
            setOscAssignment={setOscAssignment}
            removeMidiMapping={removeMidiMapping}
            startLearn={startLearn}
            scrollToChannel={scrollToChannel}
            togglePinChannel={togglePinChannel}
          />

          {/* Active DMX Channels Summary - Always Visible */}
          <DmxActiveChannelsSummary
            dmxChannels={dmxChannels}
            channelColors={channelColors}
            channelNames={channelNames}
            onScrollToChannel={scrollToChannel}
            onSetRandomChannelColor={setRandomChannelColor}
          />

          {/* DMX Channels Display */}
          <div className={`${styles.dmxChannelsContainer} ${styles[viewMode]}`}>
            {displayedChannels.map(channelIndex => {
              const value = dmxChannels[channelIndex] || 0;
              const channelName = channelNames[channelIndex] || `Channel ${channelIndex + 1}`;
              const isSelected = selectedChannels.includes(channelIndex);
              const hasMidiMapping = !!midiMappings[channelIndex];
              const isChannelLearning = isLearning && currentLearningChannel === channelIndex;
              const mapping = midiMappings[channelIndex];

              // Use new store helper functions
              const fixtureInfo = getChannelInfo(channelIndex);
              const hasFixtureAssignment = isChannelAssigned(channelIndex);
              const fixtureColor = fixtureInfo ? getFixtureColor(fixtureInfo.fixtureId) : '#64748b';

              const isEditingName = editingChannelName === channelIndex;

              // Check if channel has a custom name (not default)
              const hasCustomName = !!(channelNames[channelIndex] &&
                channelNames[channelIndex] !== `CH ${channelIndex + 1}` &&
                channelNames[channelIndex] !== `Channel ${channelIndex + 1}` &&
                channelNames[channelIndex].trim() !== '');

              return (
                <div
                  key={channelIndex}
                  id={`dmx-channel-${channelIndex}`}
                  className={`${styles.dmxChannel} ${isSelected ? styles.selected : ''} ${value > 0 ? styles.active : ''} ${highlightedChannel === channelIndex ? styles.highlighted : ''} ${hasCustomName ? styles.hasName : ''} ${hasFixtureAssignment ? styles.fixtureAssigned : ''} ${channelColors[channelIndex] ? styles.hasColor : ''}`}
                  style={{
                    borderColor: hasFixtureAssignment
                      ? fixtureColor
                      : (channelColors[channelIndex] || (hasCustomName ? '#10b981' : undefined)),
                    borderWidth: channelColors[channelIndex] 
                      ? '4px' 
                      : (hasFixtureAssignment || hasCustomName ? '2px' : undefined),
                    borderLeftWidth: hasFixtureAssignment ? '4px' : (channelColors[channelIndex] ? '6px' : undefined),
                    backgroundColor: channelColors[channelIndex] && !hasFixtureAssignment 
                      ? `${channelColors[channelIndex]}25` 
                      : (hasFixtureAssignment && fixtureColor
                        ? `${fixtureColor}15`
                        : undefined),
                    // Add a subtle gradient overlay for better visibility
                    backgroundImage: channelColors[channelIndex] && !hasFixtureAssignment
                      ? `linear-gradient(135deg, ${channelColors[channelIndex]}20 0%, ${channelColors[channelIndex]}10 100%)`
                      : (hasFixtureAssignment && fixtureColor
                        ? `linear-gradient(135deg, ${fixtureColor}12 0%, ${fixtureColor}08 100%)`
                        : undefined),
                  }}
                >
                  <div className={styles.channelHeader}>
                    <div className={styles.channelInfo}>
                      <span className={styles.channelNumber}>{channelIndex + 1}</span>
                      {hasFixtureAssignment && fixtureInfo && (
                        <div className={styles.fixtureLabel} style={{ color: fixtureColor }}>
                          <LucideIcon name="LampDesk" size={12} />
                          <span>{fixtureInfo.fixtureName}</span>
                          {fixtureInfo.channelName && (
                            <span className={styles.fixtureChannelFunction}> • {fixtureInfo.channelName}</span>
                          )}
                        </div>
                      )}
                      {isEditingName ? (
                        <div className={styles.channelNameEdit}>
                          <input
                            type="text"
                            value={editingChannelNameValue}
                            onChange={(e) => setEditingChannelNameValue(e.target.value)}
                            onBlur={() => handleSaveChannelName(channelIndex)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveChannelName(channelIndex);
                              } else if (e.key === 'Escape') {
                                handleCancelEditName();
                              }
                            }}
                            autoFocus
                            className={styles.channelNameInput}
                          />
                        </div>
                      ) : (
                        <div className={styles.channelNameWrapper}>
                          <span
                            className={styles.channelName}
                            onDoubleClick={(e) => handleStartEditName(channelIndex, e)}
                            title={hasFixtureAssignment
                              ? `Fixture: ${fixtureInfo?.fixtureName} | Channel: ${fixtureInfo?.channelName} | Type: ${fixtureInfo?.channelType}${channelName ? ` | Custom: ${channelName}` : ''} | Double-click to edit`
                              : 'Double-click to edit name'}
                            style={{ cursor: 'pointer' }}
                          >
                            {hasFixtureAssignment
                              ? fixtureInfo?.channelName
                              : (channelName || `CH ${channelIndex + 1}`)}
                            <small>{value > 0 ? 'Active' : '(Idle)'}</small>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.channelHeaderActions}>
                      {(() => {
                        // Find envelope for this channel
                        const channelEnvelope = envelopeAutomation.envelopes.find(e => e.channel === channelIndex);
                        const hasEnvelope = !!channelEnvelope;
                        const envelopeEnabled = channelEnvelope?.enabled ?? false;

                        if (hasEnvelope) {
                          return (
                            <button
                              className={`${styles.envelopeToggleButton} ${envelopeEnabled ? styles.active : ''}`}
                              onClick={() => channelEnvelope && toggleEnvelope(channelEnvelope.id)}
                              title={envelopeEnabled ? 'Stop Envelope' : 'Start Envelope'}
                              disabled={!envelopeAutomation.globalEnabled}
                            >
                              <LucideIcon name={envelopeEnabled ? "Square" : "Play"} size={14} />
                              {envelopeEnabled ? 'Stop' : 'Start'}
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <div className={styles.channelValue}>
                        <span className={styles.valueDisplay}>{value}</span>
                        <span className={styles.valuePercent}>{Math.round((value / 255) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.channelSlider}>
                    <input
                      type="range"
                      min={getChannelRange(channelIndex).min}
                      max={getChannelRange(channelIndex).max}
                      value={value}
                      onChange={(e) => setDmxChannel(channelIndex, parseInt(e.target.value))}
                      className={styles.slider}
                    />
                  </div>

                  {/* Channel Range Controls */}
                  <div className={styles.channelRangeControls}>
                    <div className={styles.rangeInputGroup}>
                      <label className={styles.rangeLabel}>MIN</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={getChannelRange(channelIndex).min}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          const currentMax = getChannelRange(channelIndex).max;
                          setChannelRange(channelIndex, newMin, Math.max(newMin, currentMax));
                        }}
                        className={styles.rangeSlider}
                      />
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={getChannelRange(channelIndex).min}
                        onChange={(e) => {
                          const newMin = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                          const currentMax = getChannelRange(channelIndex).max;
                          setChannelRange(channelIndex, newMin, Math.max(newMin, currentMax));
                        }}
                        className={styles.rangeInput}
                      />
                    </div>
                    <div className={styles.rangeInputGroup}>
                      <label className={styles.rangeLabel}>MAX</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={getChannelRange(channelIndex).max}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          const currentMin = getChannelRange(channelIndex).min;
                          setChannelRange(channelIndex, Math.min(currentMin, newMax), newMax);
                        }}
                        className={styles.rangeSlider}
                      />
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={getChannelRange(channelIndex).max}
                        onChange={(e) => {
                          const newMax = Math.max(0, Math.min(255, parseInt(e.target.value) || 255));
                          const currentMin = getChannelRange(channelIndex).min;
                          setChannelRange(channelIndex, Math.min(currentMin, newMax), newMax);
                        }}
                        className={styles.rangeInput}
                      />
                    </div>
                  </div>

                  <div 
                    className={styles.channelActions}
                    style={channelColors[channelIndex] ? {
                      backgroundColor: `${channelColors[channelIndex]}08`,
                      borderColor: `${channelColors[channelIndex]}20`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '8px',
                      padding: '8px',
                    } : undefined}
                  >
                    <button
                      className={`${styles.selectButton} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleChannelSelection(channelIndex)}
                      title="Select/Deselect channel"
                    >
                      <LucideIcon name={isSelected ? "CheckSquare" : "Square"} />
                    </button>

                    <button
                      className={styles.colorButton}
                      onClick={() => {
                        setRandomChannelColor(channelIndex);
                        addNotification({
                          type: 'success',
                          message: `Random color set for channel ${channelIndex + 1}`
                        });
                      }}
                      title="Set random color for this channel (for visual organization)"
                      style={{
                        backgroundColor: channelColors[channelIndex] 
                          ? `${channelColors[channelIndex]}20` 
                          : undefined,
                        borderColor: channelColors[channelIndex] || undefined,
                        borderWidth: channelColors[channelIndex] ? '1px' : undefined,
                      }}
                    >
                      <LucideIcon name="Palette" />
                    </button>

                    <button
                      className={`${styles.pinButton} ${pinnedChannels?.includes(channelIndex) ? styles.pinned : ''}`}
                      onClick={() => togglePinChannel(channelIndex)}
                      title={pinnedChannels?.includes(channelIndex) ? "Unpin channel" : "Pin channel to left sidebar"}
                    >
                      <LucideIcon name={pinnedChannels?.includes(channelIndex) ? "Pin" : "PinOff"} />
                    </button>

                    {showMidiControls && (
                      <div className={styles.midiControls}>
                        <button
                          className={`${styles.midiLearnButton} ${isChannelLearning ? styles.learning : ''} ${hasMidiMapping ? styles.mapped : ''}`}
                          onClick={() => handleMidiLearn(channelIndex)}
                          title={isChannelLearning ? 'Cancel MIDI Learn' : hasMidiMapping ? 'Remap MIDI' : 'Learn MIDI'}
                        >
                          <LucideIcon name={isChannelLearning ? "Radio" : hasMidiMapping ? "Unlink" : "Link"} />
                          {isChannelLearning ? 'Learning...' : hasMidiMapping ? 'Mapped' : 'Learn'}
                        </button>

                        {hasMidiMapping && !isChannelLearning && (
                          <button
                            className={styles.midiForgetButton}
                            onClick={() => handleMidiForget(channelIndex)}
                            title="Remove MIDI mapping"
                          >
                            <LucideIcon name="Trash2" />
                            Forget
                          </button>
                        )}
                      </div>
                    )}

                    {showOscControls && (
                      <div className={styles.oscControls}>
                        <button
                          className={styles.oscAddressButton}
                          onClick={() => handleSetOscAddress(channelIndex)}
                          title="Set OSC address for this channel"
                        >
                          <LucideIcon name="Globe" />
                          OSC
                        </button>
                      </div>
                    )}
                  </div>

                  {/* MIDI Mapping Display */}
                  {showMidiControls && hasMidiMapping && mapping && (
                    <div className={styles.midiMappingDisplay}>
                      <span className={styles.midiMappingText}>
                        {mapping.controller !== undefined
                          ? `CC ${mapping.controller} (Ch ${mapping.channel + 1})`
                          : `Note ${mapping.note} (Ch ${mapping.channel + 1})`
                        }
                      </span>
                    </div>
                  )}

                  {/* OSC Address Display */}
                  {showOscControls && oscAssignments[channelIndex] && (
                    <div className={styles.oscAddressDisplay}>
                      <span className={styles.oscAddressText}>
                        OSC: {oscAssignments[channelIndex]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <DmxFooterInfo
            displayedCount={displayedChannels.length}
            filteredCount={filteredChannels.length}
            currentPage={currentPage}
            totalPages={totalPages}
            midiMappingCount={Object.keys(midiMappings).length}
          />
        </div>
      </div>
    </div>
  );
};

export default DmxChannelControlPage;

