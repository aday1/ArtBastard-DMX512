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
import { DmxChannelsViewport } from '../dmx/DmxChannelsViewport';
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

    // Envelope Automation
    envelopeAutomation,
    toggleEnvelope,
    channelJumpTarget,
  } = useStore();

  // Listen for channel jump requests (e.g. from PinnedChannels sidebar)
  useEffect(() => {
    if (channelJumpTarget !== null) {
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
    if (isLearning && currentLearningChannel === channelIndex) {
      cancelLearn();
    } else {
      startLearn(channelIndex);
    }
  };

  const handleMidiForget = (channelIndex: number) => {
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
          <DmxChannelsViewport
            viewMode={viewMode}
            displayedChannels={displayedChannels}
            dmxChannels={dmxChannels}
            channelNames={channelNames}
            selectedChannels={selectedChannels}
            highlightedChannel={highlightedChannel}
            channelColors={channelColors}
            pinnedChannels={pinnedChannels || []}
            midiMappings={midiMappings}
            oscAssignments={oscAssignments}
            isLearning={isLearning}
            currentLearningChannel={currentLearningChannel}
            envelopeAutomation={envelopeAutomation}
            showMidiControls={showMidiControls}
            showOscControls={showOscControls}
            editingChannelName={editingChannelName}
            editingChannelNameValue={editingChannelNameValue}
            setEditingChannelNameValue={setEditingChannelNameValue}
            getChannelRange={getChannelRange}
            setChannelRange={setChannelRange}
            setDmxChannel={setDmxChannel}
            toggleEnvelope={toggleEnvelope}
            handleSaveChannelName={handleSaveChannelName}
            handleCancelEditName={handleCancelEditName}
            handleStartEditName={handleStartEditName}
            toggleChannelSelection={toggleChannelSelection}
            setRandomChannelColor={setRandomChannelColor}
            addNotification={(payload) => addNotification({ ...payload, priority: 'normal' })}
            togglePinChannel={togglePinChannel}
            handleMidiLearn={handleMidiLearn}
            handleMidiForget={handleMidiForget}
            handleSetOscAddress={handleSetOscAddress}
            getChannelInfo={getChannelInfo}
            isChannelAssigned={isChannelAssigned}
            getFixtureColor={getFixtureColor}
          />

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

