import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Fixture, Scene, DMXValue } from '../../types/dmxTypes';
import { useDMXStore } from '../../store/dmxStore';
import { useSceneStore } from '../../store/sceneStore';
import { useAppStore } from '../../store/appStore';
import { FixedSizeList as List } from 'react-window';
import { SketchPicker } from 'react-color';
import { 
  FaPalette, FaArrowsAlt, FaCog, FaSearch, FaFilter, 
  FaPlay, FaPause, FaStop, FaVolumeMute, FaVolumeUp,
  FaLock, FaUnlock, FaEye, FaEyeSlash, FaKeyboard,
  FaGamepad, FaRecordVinyl, // FaMidiIn, FaMidiOut removed from here
  FaExpand, FaCompress, FaCopy, FaPaste, FaRandom,
  FaMagic, FaLayerGroup, FaBolt, FaHeart
} from 'react-icons/fa';
import { BiSolidPiano as FaMidiIn } from 'react-icons/bi';
import { CgPiano as FaMidiOut } from 'react-icons/cg';
import styles from './UnifiedFixtureController.module.scss';

// Enhanced interfaces for professional lighting control
export interface EnhancedFixtureFlag {
  mute: boolean;          // Mute output (no DMX changes)
  solo: boolean;          // Solo mode (only soloed fixtures output)
  ignoreScenes: boolean;  // Ignore scene changes
  ignoreBlackout: boolean; // Ignore master blackout
  protect: boolean;       // Protect from overrides
  favorite: boolean;      // Mark as favorite
}

export interface ControlMidiMapping {
  enabled: boolean;
  channel: number;
  ccNumber: number;
  minValue: number;
  maxValue: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
  invert: boolean;
  learning: boolean;
}

export interface FixtureFilter {
  searchTerm: string;
  fixtureType: string;
  manufacturer: string;
  capabilities: string[];
  flags: Partial<EnhancedFixtureFlag>;
  dmxRange: { min: number; max: number };
  outputRange: { min: number; max: number };
}

export interface QuickControlPreset {
  id: string;
  name: string;
  color?: { r: number; g: number; b: number; a?: number };
  position?: { pan: number; tilt: number };
  intensity?: number;
  icon?: string;
  shortcut?: string;
}

interface UnifiedFixtureControllerProps {
  className?: string;
}

const DEFAULT_QUICK_PRESETS: QuickControlPreset[] = [
  { id: 'red', name: 'Red', color: { r: 255, g: 0, b: 0 }, shortcut: '1' },
  { id: 'green', name: 'Green', color: { r: 0, g: 255, b: 0 }, shortcut: '2' },
  { id: 'blue', name: 'Blue', color: { r: 0, g: 0, b: 255 }, shortcut: '3' },
  { id: 'white', name: 'White', color: { r: 255, g: 255, b: 255 }, shortcut: '4' },
  { id: 'amber', name: 'Amber', color: { r: 255, g: 191, b: 0 }, shortcut: '5' },
  { id: 'cyan', name: 'Cyan', color: { r: 0, g: 255, b: 255 }, shortcut: '6' },
  { id: 'magenta', name: 'Magenta', color: { r: 255, g: 0, b: 255 }, shortcut: '7' },
  { id: 'center', name: 'Center', position: { pan: 128, tilt: 128 }, shortcut: 'C' },
  { id: 'full', name: 'Full', intensity: 255, shortcut: 'F' },
  { id: 'half', name: '50%', intensity: 128, shortcut: 'H' }
];

export const UnifiedFixtureController: React.FC<UnifiedFixtureControllerProps> = ({
  className
}) => {
  // Store hooks
  const fixtures: Fixture[] = useDMXStore(state => state.fixtures);
  const dmxValues: DMXValue[] = useDMXStore(state => state.dmxValues);
  const updateDMXValue: (channel: number, value: DMXValue) => void = useDMXStore(state => state.updateDMXValue);
  const updateMultipleDMXValues: (values: { channel: number, value: DMXValue }[]) => void = useDMXStore(state => state.updateMultipleDMXValues);
  const masterIntensity: number = useDMXStore(state => state.masterIntensity);
  const blackout: boolean = useDMXStore(state => state.blackout);
  
  const scenes: Scene[] = useSceneStore(state => state.scenes);
  const activeScene: string | null = useSceneStore(state => state.activeScene);

  const isLiveMode: boolean = useAppStore(state => state.isLiveMode);

  // State management
  const [selectedFixtures, setSelectedFixtures] = useState<Set<string>>(new Set());
  const [fixtureFlags, setFixtureFlags] = useState<Map<string, EnhancedFixtureFlag>>(new Map());
  const [filter, setFilter] = useState<FixtureFilter>({
    searchTerm: '',
    fixtureType: '',
    manufacturer: '',
    capabilities: [],
    flags: {},
    dmxRange: { min: 1, max: 512 },
    outputRange: { min: 0, max: 255 }
  });
  
  // Control states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState({ r: 255, g: 255, b: 255, a: 1 });
  const [panTiltPosition, setPanTiltPosition] = useState({ x: 128, y: 128 });
  const [masterIntensityLocal, setMasterIntensityLocal] = useState(255);
  const [quickPresets, setQuickPresets] = useState<QuickControlPreset[]>(DEFAULT_QUICK_PRESETS);
  
  // MIDI mapping states
  const [midiMappings, setMidiMappings] = useState<{
    panTilt: { x: ControlMidiMapping; y: ControlMidiMapping };
    color: { r: ControlMidiMapping; g: ControlMidiMapping; b: ControlMidiMapping };
    intensity: ControlMidiMapping;
  }>({
    panTilt: {
      x: { enabled: false, channel: 1, ccNumber: 1, minValue: 0, maxValue: 127, curve: 'linear', invert: false, learning: false },
      y: { enabled: false, channel: 1, ccNumber: 2, minValue: 0, maxValue: 127, curve: 'linear', invert: false, learning: false }
    },
    color: {
      r: { enabled: false, channel: 1, ccNumber: 3, minValue: 0, maxValue: 127, curve: 'linear', invert: false, learning: false },
      g: { enabled: false, channel: 1, ccNumber: 4, minValue: 0, maxValue: 127, curve: 'linear', invert: false, learning: false },
      b: { enabled: false, channel: 1, ccNumber: 5, minValue: 0, maxValue: 127, curve: 'linear', invert: false, learning: false }
    },
    intensity: { enabled: false, channel: 1, ccNumber: 6, minValue: 0, maxValue: 127, curve: 'linear', invert: false, learning: false }
  });

  // UI states
  const [expandedSections, setExpandedSections] = useState({
    fixtures: true,
    color: true,
    movement: true,
    intensity: true,
    presets: false,
    midi: false,
    advanced: false
  });

  // Refs
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const panTiltRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(0);

  // Filtered and processed fixtures
  const filteredFixtures = useMemo(() => {
    let result = fixtures.filter(fixture => {
      // Search term filter
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        if (!fixture.name.toLowerCase().includes(term) &&
            !fixture.manufacturer.toLowerCase().includes(term) &&
            !fixture.mode.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Type and manufacturer filters
      if (filter.fixtureType && fixture.mode !== filter.fixtureType) return false;
      if (filter.manufacturer && fixture.manufacturer !== filter.manufacturer) return false;

      // DMX range filter
      if (fixture.startChannel < filter.dmxRange.min || fixture.startChannel > filter.dmxRange.max) {
        return false;
      }

      // Capabilities filter
      if (filter.capabilities.length > 0) {
        const hasRequiredCapabilities = filter.capabilities.every(cap => 
          fixture.channels.some(ch => ch.capability.toLowerCase().includes(cap.toLowerCase()))
        );
        if (!hasRequiredCapabilities) return false;
      }

      // Flags filter
      const flags = fixtureFlags.get(fixture.id) || getDefaultFlags();
      for (const [flagKey, flagValue] of Object.entries(filter.flags)) {
        if (flagValue !== undefined && flags[flagKey as keyof EnhancedFixtureFlag] !== flagValue) {
          return false;
        }
      }

      return true;
    });

    return result.sort((a, b) => a.startChannel - b.startChannel);
  }, [fixtures, filter, fixtureFlags]);

  // Helper functions
  const getDefaultFlags = (): EnhancedFixtureFlag => ({
    mute: false,
    solo: false,
    ignoreScenes: false,
    ignoreBlackout: false,
    protect: false,
    favorite: false
  });

  const getFixtureFlags = (fixtureId: string): EnhancedFixtureFlag => {
    return fixtureFlags.get(fixtureId) || getDefaultFlags();
  };

  const setFixtureFlag = (fixtureId: string, flag: keyof EnhancedFixtureFlag, value: boolean) => {
    const currentFlags = getFixtureFlags(fixtureId);
    const newFlags = { ...currentFlags, [flag]: value };
    
    // Handle solo logic - if soloing this fixture, unmute it
    if (flag === 'solo' && value) {
      newFlags.mute = false;
    }
    
    setFixtureFlags(prev => new Map(prev.set(fixtureId, newFlags)));
  };

  // Throttled DMX update function for performance
  const throttledUpdateDMX = useCallback((updates: { channel: number; value: DMXValue }[]) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return; // ~60fps max
    
    lastUpdateRef.current = now;
    updateMultipleDMXValues(updates);
  }, [updateMultipleDMXValues]);

  // Fixture selection functions
  const selectFixture = (fixtureId: string, exclusive = false) => {
    if (exclusive) {
      setSelectedFixtures(new Set([fixtureId]));
    } else {
      setSelectedFixtures(prev => {
        const newSet = new Set(prev);
        if (newSet.has(fixtureId)) {
          newSet.delete(fixtureId);
        } else {
          newSet.add(fixtureId);
        }
        return newSet;
      });
    }
  };

  const selectAll = () => {
    setSelectedFixtures(new Set(filteredFixtures.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFixtures(new Set());
  };

  const selectByType = (fixtureType: string) => {
    const fixturesOfType = filteredFixtures.filter(f => f.mode === fixtureType);
    setSelectedFixtures(new Set(fixturesOfType.map(f => f.id)));
  };

  const selectByCapability = (capability: string) => {
    const fixturesWithCapability = filteredFixtures.filter(f => 
      f.channels.some(ch => ch.capability.toLowerCase().includes(capability.toLowerCase()))
    );
    setSelectedFixtures(new Set(fixturesWithCapability.map(f => f.id)));
  };

  const selectByFlags = (flag: keyof EnhancedFixtureFlag, value: boolean) => {
    const fixturesWithFlag = filteredFixtures.filter(f => 
      getFixtureFlags(f.id)[flag] === value
    );
    setSelectedFixtures(new Set(fixturesWithFlag.map(f => f.id)));
  };

  // Control functions
  const applyColorToSelected = (color: { r: number; g: number; b: number }) => {
    const updates: { channel: number; value: DMXValue }[] = [];

    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;

      const flags = getFixtureFlags(fixtureId);
      if (flags.mute) return;

      // Check if any fixture is soloed and this isn't one of them
      const hasSoloedFixtures = Array.from(fixtureFlags.values()).some(f => f.solo);
      if (hasSoloedFixtures && !flags.solo) return;

      // Find RGB channels
      const redChannel = fixture.channels.find(ch => ch.capability.toLowerCase().includes('red'));
      const greenChannel = fixture.channels.find(ch => ch.capability.toLowerCase().includes('green'));
      const blueChannel = fixture.channels.find(ch => ch.capability.toLowerCase().includes('blue'));

      if (redChannel) {
        updates.push({ channel: fixture.startChannel + redChannel.offset, value: color.r });
      }
      if (greenChannel) {
        updates.push({ channel: fixture.startChannel + greenChannel.offset, value: color.g });
      }
      if (blueChannel) {
        updates.push({ channel: fixture.startChannel + blueChannel.offset, value: color.b });
      }
    });

    if (updates.length > 0) {
      throttledUpdateDMX(updates);
    }
  };

  const applyPanTiltToSelected = (pan: number, tilt: number) => {
    const updates: { channel: number; value: DMXValue }[] = [];

    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;

      const flags = getFixtureFlags(fixtureId);
      if (flags.mute) return;

      const hasSoloedFixtures = Array.from(fixtureFlags.values()).some(f => f.solo);
      if (hasSoloedFixtures && !flags.solo) return;

      const panChannel = fixture.channels.find(ch => ch.capability.toLowerCase().includes('pan'));
      const tiltChannel = fixture.channels.find(ch => ch.capability.toLowerCase().includes('tilt'));

      if (panChannel) {
        updates.push({ channel: fixture.startChannel + panChannel.offset, value: pan });
      }
      if (tiltChannel) {
        updates.push({ channel: fixture.startChannel + tiltChannel.offset, value: tilt });
      }
    });

    if (updates.length > 0) {
      throttledUpdateDMX(updates);
    }
  };

  const applyIntensityToSelected = (intensity: number) => {
    const updates: { channel: number; value: DMXValue }[] = [];

    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;

      const flags = getFixtureFlags(fixtureId);
      if (flags.mute) return;

      const hasSoloedFixtures = Array.from(fixtureFlags.values()).some(f => f.solo);
      if (hasSoloedFixtures && !flags.solo) return;

      const intensityChannel = fixture.channels.find(ch => 
        ch.capability.toLowerCase().includes('intensity') ||
        ch.capability.toLowerCase().includes('dimmer') ||
        ch.capability.toLowerCase().includes('master')
      );

      if (intensityChannel) {
        updates.push({ channel: fixture.startChannel + intensityChannel.offset, value: intensity });
      }
    });

    if (updates.length > 0) {
      throttledUpdateDMX(updates);
    }
  };

  const applyPreset = (preset: QuickControlPreset) => {    if (preset.color) {
      applyColorToSelected(preset.color);
      setCurrentColor({ ...preset.color, a: preset.color.a || 1 });
    }
    if (preset.position) {
      applyPanTiltToSelected(preset.position.pan, preset.position.tilt);
      setPanTiltPosition({ x: preset.position.pan, y: preset.position.tilt });
    }
    if (preset.intensity !== undefined) {
      applyIntensityToSelected(preset.intensity);
      setMasterIntensityLocal(preset.intensity);
    }
  };

  const blackoutSelected = () => {
    applyIntensityToSelected(0);
  };
  const randomizeSelected = () => {
    // Random color
    const randomColor = {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      a: 1
    };
    applyColorToSelected(randomColor);
    setCurrentColor(randomColor);

    // Random position
    const randomPan = Math.floor(Math.random() * 256);
    const randomTilt = Math.floor(Math.random() * 256);
    applyPanTiltToSelected(randomPan, randomTilt);
    setPanTiltPosition({ x: randomPan, y: randomTilt });
  };

  // Event handlers
  const handleFixtureClick = (fixtureId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      selectFixture(fixtureId, false);
    } else if (event.shiftKey && selectedFixtures.size > 0) {
      // Range selection
      const fixtureIds = filteredFixtures.map(f => f.id);
      const lastSelected = Array.from(selectedFixtures).pop();
      if (lastSelected) {
        const lastIndex = fixtureIds.indexOf(lastSelected);
        const currentIndex = fixtureIds.indexOf(fixtureId);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = fixtureIds.slice(start, end + 1);
        setSelectedFixtures(new Set([...selectedFixtures, ...rangeIds]));
      }
    } else {
      selectFixture(fixtureId, true);
    }
  };
  const handleColorChange = (color: any) => {
    const newColor = { r: color.rgb.r, g: color.rgb.g, b: color.rgb.b, a: color.rgb.a || 1 };
    setCurrentColor(newColor);
    applyColorToSelected(newColor);
  };

  const handlePanTiltChange = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!panTiltRef.current) return;

    const rect = panTiltRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(255, ((event.clientX - rect.left) / rect.width) * 255));
    const y = Math.max(0, Math.min(255, (1 - (event.clientY - rect.top) / rect.height) * 255));

    setPanTiltPosition({ x: Math.round(x), y: Math.round(y) });
    applyPanTiltToSelected(Math.round(x), Math.round(y));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      switch (event.key) {
        case 'Escape':
          clearSelection();
          break;
        case 'Delete':
        case 'Backspace':
          blackoutSelected();
          break;
        case ' ':
          event.preventDefault();
          // Toggle live mode or apply changes
          break;
        case 'a':
        case 'A':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            selectAll();
          }
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            randomizeSelected();
          }
          break;
        default:
          // Check for preset shortcuts
          const preset = quickPresets.find(p => p.shortcut === event.key);
          if (preset) {
            applyPreset(preset);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFixtures, quickPresets]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render fixture item for virtual list
  const FixtureItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const fixture = filteredFixtures[index];
    const isSelected = selectedFixtures.has(fixture.id);
    const flags = getFixtureFlags(fixture.id);

    return (
      <div 
        style={style}
        className={`${styles.fixtureItem} ${isSelected ? styles.selected : ''}`}
        onClick={(e) => handleFixtureClick(fixture.id, e)}
      >
        <div className={styles.fixtureInfo}>
          <div className={styles.fixtureName}>{fixture.name}</div>
          <div className={styles.fixtureDetails}>
            {fixture.manufacturer} • {fixture.mode} • Ch {fixture.startChannel}
          </div>
        </div>
        
        <div className={styles.fixtureFlags}>
          {flags.favorite && <FaHeart className={styles.flagIcon} title="Favorite" />}
          {flags.mute && <FaVolumeMute className={styles.flagIcon} title="Muted" />}
          {flags.solo && <FaVolumeUp className={styles.flagIcon} title="Solo" />}
          {flags.protect && <FaLock className={styles.flagIcon} title="Protected" />}
          {flags.ignoreScenes && <FaEyeSlash className={styles.flagIcon} title="Ignore Scenes" />}
          {flags.ignoreBlackout && <FaBolt className={styles.flagIcon} title="Ignore Blackout" />}
        </div>

        <div className={styles.fixtureActions}>
          <button
            className={`${styles.flagButton} ${flags.mute ? styles.active : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setFixtureFlag(fixture.id, 'mute', !flags.mute);
            }}
            title="Mute"
          >
            <FaVolumeMute />
          </button>
          <button
            className={`${styles.flagButton} ${flags.solo ? styles.active : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setFixtureFlag(fixture.id, 'solo', !flags.solo);
            }}
            title="Solo"
          >
            <FaVolumeUp />
          </button>
          <button
            className={`${styles.flagButton} ${flags.protect ? styles.active : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setFixtureFlag(fixture.id, 'protect', !flags.protect);
            }}
            title="Protect"
          >
            <FaLock />
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className={`${styles.unifiedFixtureController} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FaLayerGroup />
          Fixture Controller
        </h2>
        <div className={styles.headerActions}>
          <div className={styles.selectionInfo}>
            {selectedFixtures.size} of {filteredFixtures.length} selected
          </div>
          <button 
            className={styles.actionButton}
            onClick={selectAll}
            title="Select All (Ctrl+A)"
          >
            <FaCopy />
          </button>
          <button 
            className={styles.actionButton}
            onClick={clearSelection}
            title="Clear Selection (Esc)"
          >
            <FaStop />
          </button>
          <button 
            className={styles.actionButton}
            onClick={randomizeSelected}
            title="Randomize Selected (Ctrl+R)"
          >
            <FaRandom />
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Left Panel - Fixture List */}
        <div className={styles.leftPanel}>
          {/* Search and Filter */}
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search fixtures..."
                value={filter.searchTerm}
                onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterControls}>
              <select
                value={filter.fixtureType}
                onChange={(e) => setFilter(prev => ({ ...prev, fixtureType: e.target.value }))}
                className={styles.filterSelect}
              >
                <option value="">All Types</option>
                {Array.from(new Set(fixtures.map(f => f.mode))).map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
              
              <select
                value={filter.manufacturer}
                onChange={(e) => setFilter(prev => ({ ...prev, manufacturer: e.target.value }))}
                className={styles.filterSelect}
              >
                <option value="">All Manufacturers</option>
                {Array.from(new Set(fixtures.map(f => f.manufacturer))).map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>

            {/* Quick selection buttons */}
            <div className={styles.quickSelectionButtons}>
              <button 
                className={styles.quickSelectButton}
                onClick={() => selectByCapability('rgb')}
                title="Select RGB fixtures"
              >
                <FaPalette /> RGB
              </button>
              <button 
                className={styles.quickSelectButton}
                onClick={() => selectByCapability('pan')}
                title="Select moving head fixtures"
              >
                <FaArrowsAlt /> Moving
              </button>
              <button 
                className={styles.quickSelectButton}
                onClick={() => selectByFlags('favorite', true)}
                title="Select favorite fixtures"
              >
                <FaHeart /> Favorites
              </button>
              <button 
                className={styles.quickSelectButton}
                onClick={() => selectByFlags('mute', false)}
                title="Select unmuted fixtures"
              >
                <FaVolumeUp /> Active
              </button>
            </div>
          </div>          {/* Fixture List */}
          <div className={styles.fixtureListContainer}>            <List
              height={400}
              width="100%"
              itemCount={filteredFixtures.length}
              itemSize={80}
              className={styles.fixtureList}
            >
              {FixtureItem}
            </List>
          </div>
        </div>

        {/* Right Panel - Controls */}
        <div className={styles.rightPanel}>
          {/* Color Control */}
          <div className={`${styles.controlSection} ${expandedSections.color ? styles.expanded : ''}`}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('color')}>
              <FaPalette />
              <span>Color Control</span>
              <FaExpand className={expandedSections.color ? styles.rotated : ''} />
            </div>
            
            {expandedSections.color && (
              <div className={styles.sectionContent}>
                <div className={styles.colorControls}>
                  <button
                    className={styles.colorPickerButton}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
                  >
                    Pick Color
                  </button>
                  
                  {showColorPicker && (
                    <div className={styles.colorPickerWrapper} ref={colorPickerRef}>
                      <SketchPicker
                        color={currentColor}
                        onChange={handleColorChange}
                        disableAlpha={true}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Color Presets */}
                <div className={styles.quickColors}>
                  {quickPresets.filter(p => p.color).map(preset => (
                    <button
                      key={preset.id}
                      className={styles.quickColorButton}
                      onClick={() => applyPreset(preset)}
                      style={{ backgroundColor: `rgb(${preset.color!.r}, ${preset.color!.g}, ${preset.color!.b})` }}
                      title={`${preset.name} (${preset.shortcut})`}
                    >
                      {preset.shortcut}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Movement Control */}
          <div className={`${styles.controlSection} ${expandedSections.movement ? styles.expanded : ''}`}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('movement')}>
              <FaArrowsAlt />
              <span>Pan/Tilt Control</span>
              <FaExpand className={expandedSections.movement ? styles.rotated : ''} />
            </div>
            
            {expandedSections.movement && (
              <div className={styles.sectionContent}>
                <div 
                  className={styles.panTiltPad}
                  ref={panTiltRef}
                  onClick={handlePanTiltChange}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handlePanTiltChange(e);
                  }}
                >
                  <div 
                    className={styles.panTiltCursor}
                    style={{
                      left: `${(panTiltPosition.x / 255) * 100}%`,
                      top: `${(1 - panTiltPosition.y / 255) * 100}%`
                    }}
                  />
                  <div className={styles.panTiltLabels}>
                    <span className={styles.panLabel}>Pan: {panTiltPosition.x}</span>
                    <span className={styles.tiltLabel}>Tilt: {panTiltPosition.y}</span>
                  </div>
                </div>

                {/* Position Presets */}
                <div className={styles.positionPresets}>
                  {quickPresets.filter(p => p.position).map(preset => (
                    <button
                      key={preset.id}
                      className={styles.positionButton}
                      onClick={() => applyPreset(preset)}
                      title={`${preset.name} (${preset.shortcut})`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Intensity Control */}
          <div className={`${styles.controlSection} ${expandedSections.intensity ? styles.expanded : ''}`}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('intensity')}>
              <FaBolt />
              <span>Intensity Control</span>
              <FaExpand className={expandedSections.intensity ? styles.rotated : ''} />
            </div>
            
            {expandedSections.intensity && (
              <div className={styles.sectionContent}>
                <div className={styles.intensitySlider}>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={masterIntensityLocal}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setMasterIntensityLocal(value);
                      applyIntensityToSelected(value);
                    }}
                    className={styles.slider}
                  />
                  <div className={styles.sliderValue}>{masterIntensityLocal}</div>
                </div>

                {/* Intensity Presets */}
                <div className={styles.intensityPresets}>
                  {quickPresets.filter(p => p.intensity !== undefined).map(preset => (
                    <button
                      key={preset.id}
                      className={styles.intensityButton}
                      onClick={() => applyPreset(preset)}
                      title={`${preset.name} (${preset.shortcut})`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MIDI Mapping */}
          <div className={`${styles.controlSection} ${expandedSections.midi ? styles.expanded : ''}`}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('midi')}>
              <FaMidiIn />
              <span>MIDI Mapping</span>
              <FaExpand className={expandedSections.midi ? styles.rotated : ''} />
            </div>
            
            {expandedSections.midi && (
              <div className={styles.sectionContent}>
                <div className={styles.midiMappingGrid}>
                  <div className={styles.midiControl}>
                    <label>Pan</label>
                    <div className={styles.midiInputs}>
                      <input 
                        type="checkbox" 
                        checked={midiMappings.panTilt.x.enabled}
                        onChange={(e) => setMidiMappings(prev => ({
                          ...prev,
                          panTilt: { ...prev.panTilt, x: { ...prev.panTilt.x, enabled: e.target.checked }}
                        }))}
                      />
                      <input 
                        type="number" 
                        value={midiMappings.panTilt.x.ccNumber}
                        onChange={(e) => setMidiMappings(prev => ({
                          ...prev,
                          panTilt: { ...prev.panTilt, x: { ...prev.panTilt.x, ccNumber: parseInt(e.target.value) }}
                        }))}
                        min="1" 
                        max="127"
                        disabled={!midiMappings.panTilt.x.enabled}
                      />
                      <button
                        className={`${styles.learnButton} ${midiMappings.panTilt.x.learning ? styles.learning : ''}`}
                        onClick={() => setMidiMappings(prev => ({
                          ...prev,
                          panTilt: { ...prev.panTilt, x: { ...prev.panTilt.x, learning: !prev.panTilt.x.learning }}
                        }))}
                        disabled={!midiMappings.panTilt.x.enabled}
                      >
                        <FaRecordVinyl />
                      </button>
                    </div>
                  </div>

                  <div className={styles.midiControl}>
                    <label>Tilt</label>
                    <div className={styles.midiInputs}>
                      <input 
                        type="checkbox" 
                        checked={midiMappings.panTilt.y.enabled}
                        onChange={(e) => setMidiMappings(prev => ({
                          ...prev,
                          panTilt: { ...prev.panTilt, y: { ...prev.panTilt.y, enabled: e.target.checked }}
                        }))}
                      />
                      <input 
                        type="number" 
                        value={midiMappings.panTilt.y.ccNumber}
                        onChange={(e) => setMidiMappings(prev => ({
                          ...prev,
                          panTilt: { ...prev.panTilt, y: { ...prev.panTilt.y, ccNumber: parseInt(e.target.value) }}
                        }))}
                        min="1" 
                        max="127"
                        disabled={!midiMappings.panTilt.y.enabled}
                      />
                      <button
                        className={`${styles.learnButton} ${midiMappings.panTilt.y.learning ? styles.learning : ''}`}
                        onClick={() => setMidiMappings(prev => ({
                          ...prev,
                          panTilt: { ...prev.panTilt, y: { ...prev.panTilt.y, learning: !prev.panTilt.y.learning }}
                        }))}
                        disabled={!midiMappings.panTilt.y.enabled}
                      >
                        <FaRecordVinyl />
                      </button>
                    </div>
                  </div>

                  {/* RGB MIDI controls */}
                  {['r', 'g', 'b'].map(color => (
                    <div key={color} className={styles.midiControl}>
                      <label>{color.toUpperCase()}</label>
                      <div className={styles.midiInputs}>
                        <input 
                          type="checkbox" 
                          checked={midiMappings.color[color as 'r'|'g'|'b'].enabled}
                          onChange={(e) => setMidiMappings(prev => ({
                            ...prev,
                            color: { ...prev.color, [color]: { ...prev.color[color as 'r'|'g'|'b'], enabled: e.target.checked }}
                          }))}
                        />
                        <input 
                          type="number" 
                          value={midiMappings.color[color as 'r'|'g'|'b'].ccNumber}
                          onChange={(e) => setMidiMappings(prev => ({
                            ...prev,
                            color: { ...prev.color, [color]: { ...prev.color[color as 'r'|'g'|'b'], ccNumber: parseInt(e.target.value) }}
                          }))}
                          min="1" 
                          max="127"
                          disabled={!midiMappings.color[color as 'r'|'g'|'b'].enabled}
                        />
                        <button
                          className={`${styles.learnButton} ${midiMappings.color[color as 'r'|'g'|'b'].learning ? styles.learning : ''}`}
                          onClick={() => setMidiMappings(prev => ({
                            ...prev,
                            color: { ...prev.color, [color]: { ...prev.color[color as 'r'|'g'|'b'], learning: !prev.color[color as 'r'|'g'|'b'].learning }}
                          }))}
                          disabled={!midiMappings.color[color as 'r'|'g'|'b'].enabled}
                        >
                          <FaRecordVinyl />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusItem}>
            Live Mode: {isLiveMode ? 'ON' : 'OFF'}
          </span>
          <span className={styles.statusItem}>
            Master: {masterIntensity}
          </span>
          {blackout && (
            <span className={`${styles.statusItem} ${styles.blackout}`}>
              BLACKOUT
            </span>
          )}
        </div>
        
        <div className={styles.statusRight}>
          <span className={styles.statusItem}>
            Fixtures: {filteredFixtures.length}
          </span>          <span className={styles.statusItem}>
            Selected: {selectedFixtures.size}
          </span>
          {activeScene && (
            <span className={styles.statusItem}>
              Scene: {activeScene}
            </span>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className={styles.shortcutsHelp}>
        <div className={styles.shortcutGroup}>
          <span>Ctrl+A: Select All</span>
          <span>Esc: Clear Selection</span>
          <span>Del: Blackout</span>
          <span>Ctrl+R: Randomize</span>
        </div>
        <div className={styles.shortcutGroup}>
          {quickPresets.map(preset => (
            <span key={preset.id}>{preset.shortcut}: {preset.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnifiedFixtureController;