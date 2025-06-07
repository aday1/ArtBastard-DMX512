import React, { useState, useEffect, useRef } from 'react';
import { useChromaticEnergyManipulatorSettings } from '../../context/ChromaticEnergyManipulatorContext';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore, Fixture, FixtureFlag } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ChromaticEnergyManipulatorMini.module.scss';

interface ChromaticEnergyManipulatorMiniProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isDockable?: boolean;
}

const ChromaticEnergyManipulatorMini: React.FC<ChromaticEnergyManipulatorMiniProps> = ({
  isCollapsed = false,
  onCollapsedChange,
  isDockable = true,
}) => {const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [showFixtureSelect, setShowFixtureSelect] = useState(false);
  const [showFlagPanel, setShowFlagPanel] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagColor, setNewFlagColor] = useState('#ff6b6b');
  const [newFlagCategory, setNewFlagCategory] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [lastColorPreset, setLastColorPreset] = useState<{ r: number; g: number; b: number } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSelection, setShowAdvancedSelection] = useState(false);
  
  // Color and movement state
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [movement, setMovement] = useState<{ pan: number; tilt: number }>({ pan: 127, tilt: 127 });
  
  // Canvas references
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const movementCanvasRef = useRef<HTMLCanvasElement>(null);

  const { 
    fixtures, 
    getDmxChannelValue, 
    setDmxChannelValue,
    addFixtureFlag,
    removeFixtureFlag,
    bulkAddFlag,
    bulkRemoveFlag,
    createQuickFlag,
    getFixturesByFlag,
    getFixturesByFlagCategory
  } = useStore(state => ({
    fixtures: state.fixtures,
    getDmxChannelValue: state.getDmxChannelValue,
    setDmxChannelValue: state.setDmxChannelValue,
    addFixtureFlag: state.addFixtureFlag,
    removeFixtureFlag: state.removeFixtureFlag,
    bulkAddFlag: state.bulkAddFlag,
    bulkRemoveFlag: state.bulkRemoveFlag,
    createQuickFlag: state.createQuickFlag,
    getFixturesByFlag: state.getFixturesByFlag,
    getFixturesByFlagCategory: state.getFixturesByFlagCategory
  }));
  const { settings } = useChromaticEnergyManipulatorSettings();

  // Get fixture channels
  const getFixtureChannels = (fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return { rgbChannels: {}, movementChannels: {} };
    
    const rgbChannels: {
      redChannel?: number;
      greenChannel?: number;
      blueChannel?: number;
    } = {};
    
    const movementChannels: {
      panChannel?: number;
      tiltChannel?: number;
    } = {};

    fixture.channels.forEach((channel, index) => {
      const dmxAddress = fixture.startAddress + index;
      switch (channel.type) {
        case 'red':
        case 'green':
        case 'blue':
          // assign each color channel individually
          if (channel.type === 'red') rgbChannels.redChannel = dmxAddress - 1;
          if (channel.type === 'green') rgbChannels.greenChannel = dmxAddress - 1;
          if (channel.type === 'blue') rgbChannels.blueChannel = dmxAddress - 1;
          break;
        case 'dimmer':
          // map single dimmer to all RGB channels for fixtures without separate colors
          rgbChannels.redChannel = rgbChannels.greenChannel = rgbChannels.blueChannel = dmxAddress - 1;
          break;
        case 'pan':
          movementChannels.panChannel = dmxAddress - 1;
          break;
        case 'tilt':
          movementChannels.tiltChannel = dmxAddress - 1;
          break;
        // add other channel types if needed
      }
    });
    
    return { rgbChannels, movementChannels };
  };
  // Helper functions for flagging
  const createAndApplyFlag = () => {
    if (!newFlagName.trim() || selectedFixtures.length === 0) return;
    
    const flag = createQuickFlag(newFlagName.trim(), newFlagColor, newFlagCategory.trim() || undefined);
    bulkAddFlag(selectedFixtures, flag);
    
    // Reset form
    setNewFlagName('');
    setNewFlagColor('#ff6b6b');
    setNewFlagCategory('');
    setShowFlagPanel(false);
  };

  // Color presets
  const colorPresets = [
    { name: 'Red', r: 255, g: 0, b: 0 },
    { name: 'Green', r: 0, g: 255, b: 0 },
    { name: 'Blue', r: 0, g: 0, b: 255 },
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Yellow', r: 255, g: 255, b: 0 },
    { name: 'Cyan', r: 0, g: 255, b: 255 },
    { name: 'Magenta', r: 255, g: 0, b: 255 },
    { name: 'Orange', r: 255, g: 127, b: 0 },
    { name: 'Purple', r: 127, g: 0, b: 255 },
    { name: 'Warm White', r: 255, g: 180, b: 120 },
    { name: 'Cool White', r: 180, g: 200, b: 255 },
    { name: 'Off', r: 0, g: 0, b: 0 }
  ];
  const applyColorPreset = (preset: { r: number; g: number; b: number }) => {
    try {
      setIsUpdating(true);
      setConnectionError(null);
      
      setColor(preset);
      setLastColorPreset(preset);
      
      // Apply to all selected fixtures with validation
      selectedFixtures.forEach(fixtureId => {
        const { rgbChannels } = getFixtureChannels(fixtureId);
        if (rgbChannels.redChannel !== undefined && rgbChannels.redChannel >= 0) {
          setDmxChannelValue(rgbChannels.redChannel, Math.max(0, Math.min(255, preset.r)));
        }
        if (rgbChannels.greenChannel !== undefined && rgbChannels.greenChannel >= 0) {
          setDmxChannelValue(rgbChannels.greenChannel, Math.max(0, Math.min(255, preset.g)));
        }
        if (rgbChannels.blueChannel !== undefined && rgbChannels.blueChannel >= 0) {
          setDmxChannelValue(rgbChannels.blueChannel, Math.max(0, Math.min(255, preset.b)));
        }
      });
    } catch (error) {
      setConnectionError('Failed to apply color preset');
      console.error('Color preset error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const randomizeColor = () => {
    const randomColor = {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256)
    };
    applyColorPreset(randomColor);
  };

  const centerMovement = () => {
    try {
      setIsUpdating(true);
      setConnectionError(null);
      
      const centerValues = { pan: 127, tilt: 127 };
      setMovement(centerValues);
      
      selectedFixtures.forEach(fixtureId => {
        const { movementChannels } = getFixtureChannels(fixtureId);
        if (movementChannels.panChannel !== undefined && movementChannels.panChannel >= 0) {
          setDmxChannelValue(movementChannels.panChannel, centerValues.pan);
        }
        if (movementChannels.tiltChannel !== undefined && movementChannels.tiltChannel >= 0) {
          setDmxChannelValue(movementChannels.tiltChannel, centerValues.tilt);
        }
      });
    } catch (error) {
      setConnectionError('Failed to center movement');
      console.error('Movement center error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectAllFlagged = () => {
    const flaggedFixtures = fixtures.filter(f => f.isFlagged);
    setSelectedFixtures(flaggedFixtures.map(f => f.id));
  };

  const selectByFlag = (flagId: string) => {
    const flaggedFixtures = getFixturesByFlag(flagId);
    setSelectedFixtures(flaggedFixtures.map(f => f.id));
  };

  const selectByFlagCategory = (category: string) => {
    const flaggedFixtures = getFixturesByFlagCategory(category);
    setSelectedFixtures(flaggedFixtures.map(f => f.id));
  };

  // Enhanced selection functions
  const selectAll = () => {
    setSelectedFixtures(filteredFixtures.map(f => f.id));
  };

  const deselectAll = () => {
    setSelectedFixtures([]);
  };

  const invertSelection = () => {
    const allIds = filteredFixtures.map(f => f.id);
    const newSelection = allIds.filter(id => !selectedFixtures.includes(id));
    setSelectedFixtures(newSelection);
  };

  const selectByType = (fixtureType: 'rgb' | 'movement' | 'dimmer') => {
    const typeFixtures = filteredFixtures.filter(fixture => {
      switch (fixtureType) {
        case 'rgb':
          return fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
        case 'movement':
          return fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
        case 'dimmer':
          return fixture.channels.some(ch => ch.type === 'dimmer');
        default:
          return false;
      }
    });
    setSelectedFixtures(typeFixtures.map(f => f.id));
  };

  const selectSimilar = () => {
    if (selectedFixtures.length === 0) return;
    
    const referenceFixture = fixtures.find(f => f.id === selectedFixtures[0]);
    if (!referenceFixture) return;
    
    const similarFixtures = filteredFixtures.filter(fixture => {
      // Consider fixtures similar if they have the same channel types
      const refChannelTypes = referenceFixture.channels.map(ch => ch.type).sort();
      const fixtureChannelTypes = fixture.channels.map(ch => ch.type).sort();
      return JSON.stringify(refChannelTypes) === JSON.stringify(fixtureChannelTypes);
    });
    
    setSelectedFixtures(similarFixtures.map(f => f.id));
  };

  // Filter fixtures based on search term
  const filteredFixtures = fixtures.filter(fixture =>
    fixture.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAllUniqueFlags = (): FixtureFlag[] => {
    const flagMap = new Map<string, FixtureFlag>();
    fixtures.forEach(fixture => {
      if (fixture.flags) {
        fixture.flags.forEach(flag => {
          flagMap.set(flag.id, flag);
        });
      }
    });
    return Array.from(flagMap.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  };

  const getAllUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    fixtures.forEach(fixture => {
      if (fixture.flags) {
        fixture.flags.forEach(flag => {
          if (flag.category) {
            categories.add(flag.category);
          }
        });
      }
    });
    return Array.from(categories).sort();
  };

  const removeSelectedFixtureFlags = () => {
    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (fixture && fixture.flags) {
        fixture.flags.forEach(flag => {
          removeFixtureFlag(fixtureId, flag.id);
        });
      }
    });
  };
  // Auto-select first RGB fixture if none selected
  useEffect(() => {
    if (!settings.autoSelectFirstFixture) return;
    if (selectedFixtures.length === 0 && fixtures.length > 0) {
      // Try RGB fixtures first
      let firstFixture = fixtures.find(f =>
        f.channels.some(c => c.type === 'red') &&
        f.channels.some(c => c.type === 'green') &&
        f.channels.some(c => c.type === 'blue')
      );
      // Fallback to dimmer-only fixtures
      if (!firstFixture) {
        firstFixture = fixtures.find(f =>
          f.channels.some(c => c.type === 'dimmer')
        );
      }
      // Final fallback: first fixture in list
      if (!firstFixture && fixtures.length > 0) {
        firstFixture = fixtures[0];
      }
      if (firstFixture) {
        setSelectedFixtures([firstFixture.id]);
      }
    }
  }, [fixtures, selectedFixtures.length, settings.autoSelectFirstFixture]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (selectedFixtures.length === 0) return;
      
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement) return;
      
      switch (event.key.toLowerCase()) {
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            randomizeColor();
          }
          break;
        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            centerMovement();
          }
          break;
        case '1':
          event.preventDefault();
          applyColorPreset({ r: 255, g: 0, b: 0 }); // Red
          break;
        case '2':
          event.preventDefault();
          applyColorPreset({ r: 0, g: 255, b: 0 }); // Green
          break;
        case '3':
          event.preventDefault();
          applyColorPreset({ r: 0, g: 0, b: 255 }); // Blue
          break;
        case '0':
          event.preventDefault();
          applyColorPreset({ r: 0, g: 0, b: 0 }); // Off
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedFixtures, applyColorPreset, randomizeColor, centerMovement]);

  // Update color and movement when selection changes
  useEffect(() => {
    if (selectedFixtures.length > 0) {
      const firstFixtureId = selectedFixtures[0];
      const { rgbChannels: firstRgbChannels, movementChannels: firstMovementChannels } = getFixtureChannels(firstFixtureId);
      
      if (firstRgbChannels.redChannel !== undefined) {
        setColor({
          r: getDmxChannelValue(firstRgbChannels.redChannel),
          g: getDmxChannelValue(firstRgbChannels.greenChannel),
          b: getDmxChannelValue(firstRgbChannels.blueChannel)
        });
      }
      
      if (firstMovementChannels.panChannel !== undefined) {
        setMovement({
          pan: getDmxChannelValue(firstMovementChannels.panChannel),
          tilt: getDmxChannelValue(firstMovementChannels.tiltChannel)
        });
      }
    }
  }, [selectedFixtures, getDmxChannelValue, fixtures]);

  // Canvas drawing effects
  useEffect(() => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillStyle = rgb;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  }, [color]);

  useEffect(() => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    // Draw crosshairs
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw position indicator
    const x = (movement.pan / 255) * width;
    const y = height - (movement.tilt / 255) * height;
    
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }, [movement]);

  // Event handlers
  const handleColorClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const hue = (x / canvas.width) * 360;
    
    // Convert HSV to RGB (simplified)
    const c = 1;
    const x_val = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = 0;
    
    let r = 0, g = 0, b = 0;
    if (hue < 60) { r = c; g = x_val; b = 0; }
    else if (hue < 120) { r = x_val; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x_val; }
    else if (hue < 240) { r = 0; g = x_val; b = c; }
    else if (hue < 300) { r = x_val; g = 0; b = c; }
    else { r = c; g = 0; b = x_val; }
    
    const newColor = {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
    
    setColor(newColor);
    
    // Update all selected fixtures
    selectedFixtures.forEach(fixtureId => {
      const { rgbChannels } = getFixtureChannels(fixtureId);
      if (rgbChannels.redChannel !== undefined) setDmxChannelValue(rgbChannels.redChannel, newColor.r);
      if (rgbChannels.greenChannel !== undefined) setDmxChannelValue(rgbChannels.greenChannel, newColor.g);
      if (rgbChannels.blueChannel !== undefined) setDmxChannelValue(rgbChannels.blueChannel, newColor.b);
    });
  };

  const handleMovementClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newMovement = {
      pan: Math.round((x / canvas.width) * 255),
      tilt: Math.round(((canvas.height - y) / canvas.height) * 255)
    };
    
    setMovement(newMovement);
    
    // Update all selected fixtures
    selectedFixtures.forEach(fixtureId => {
      const { movementChannels } = getFixtureChannels(fixtureId);
      if (movementChannels.panChannel !== undefined) setDmxChannelValue(movementChannels.panChannel, newMovement.pan);
      if (movementChannels.tiltChannel !== undefined) setDmxChannelValue(movementChannels.tiltChannel, newMovement.tilt);
    });
  };
  // Helper functions
  const selectedFixtureName = () => {
    if (selectedFixtures.length === 0) return settings.enableErrorMessages ? 'No fixtures selected' : 'Select fixtures';
    if (selectedFixtures.length === 1) {
      const fixture = fixtures.find(f => f.id === selectedFixtures[0]);
      return fixture?.name || 'Unknown';
    }
    return `${selectedFixtures.length} fixtures selected`;
  };

  const { rgbChannels: firstSelectedRgbChannels, movementChannels: firstSelectedMovementChannels } = 
    selectedFixtures.length > 0 ? getFixtureChannels(selectedFixtures[0]) : { rgbChannels: {}, movementChannels: {} };

  const hasRgbChannels = firstSelectedRgbChannels.redChannel !== undefined && firstSelectedRgbChannels.greenChannel !== undefined && firstSelectedRgbChannels.blueChannel !== undefined;
  const hasMovementChannels = firstSelectedMovementChannels.panChannel !== undefined && firstSelectedMovementChannels.tiltChannel !== undefined;
  if (!isDockable) {
    return (
      <div className={styles.chromaticEnergyManipulatorMini}>
        <div className={styles.container}>
          {/* Error Display */}
          {connectionError && (
            <div className={styles.errorMessage}>
              <LucideIcon name="AlertTriangle" />
              <span>{connectionError}</span>
              <button 
                onClick={() => setConnectionError(null)}
                className={styles.closeError}
              >
                <LucideIcon name="X" />
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isUpdating && (
            <div className={styles.loadingIndicator}>
              <LucideIcon name="Loader" />
              <span>Updating...</span>
            </div>
          )}

          {/* Simplified content for non-dockable version */}
          <div className={styles.fixtureSection}>
            <button 
              className={styles.fixtureSelector}
              onClick={() => setShowFixtureSelect(!showFixtureSelect)}
              title={`Selected: ${selectedFixtureName()}`}
            >
              <LucideIcon name="Target" />
              <span className={styles.fixtureName}>{selectedFixtureName()}</span>
              <div className={styles.selectorRight}>
                {selectedFixtures.length > 0 && (
                  <span className={styles.selectionBadge}>{selectedFixtures.length}</span>
                )}
                <LucideIcon name={showFixtureSelect ? "ChevronUp" : "ChevronDown"} />
              </div>
            </button>
          </div>
          {/* Note: Simplified version for docked layout */}
        </div>
      </div>
    );
  }

  return (
    <DockableComponent
      id="chromatic-energy-manipulator-mini"
      component="chromatic-energy-manipulator"
      title="Chromatic Energy Manipulator"
      defaultPosition={{ zone: 'floating', offset: { x: 20, y: 300 } }}
      className={styles.chromaticEnergyManipulatorMini}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      width="280px"
      height="auto"
    >      <div className={styles.container}>
        {/* Error Display */}
        {connectionError && (
          <div className={styles.errorMessage}>
            <LucideIcon name="AlertTriangle" />
            <span>{connectionError}</span>
            <button 
              onClick={() => setConnectionError(null)}
              className={styles.closeError}
            >
              <LucideIcon name="X" />
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isUpdating && (
          <div className={styles.loadingIndicator}>
            <LucideIcon name="Loader" />
            <span>Updating...</span>
          </div>
        )}

        {/* Fixture Selection */}
        <div className={styles.fixtureSection}>          <button 
            className={styles.fixtureSelector}
            onClick={() => setShowFixtureSelect(!showFixtureSelect)}
            title={`Selected: ${selectedFixtureName()}`}
          >
            <LucideIcon name="Target" />
            <span className={styles.fixtureName}>{selectedFixtureName()}</span>
            <div className={styles.selectorRight}>
              {selectedFixtures.length > 0 && (
                <span className={styles.selectionBadge}>{selectedFixtures.length}</span>
              )}
              <LucideIcon name={showFixtureSelect ? "ChevronUp" : "ChevronDown"} />
            </div>
          </button>
            {showFixtureSelect && (
            <div className={styles.fixtureDropdown}>
              {/* Search Bar */}
              <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                  <LucideIcon name="Search" />
                  <input
                    type="text"
                    placeholder="Search fixtures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className={styles.clearSearch}
                    >
                      <LucideIcon name="X" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              {selectedFixtures.length > 0 && (
                <div className={styles.selectionSummary}>
                  <div className={styles.summaryText}>
                    <span>{selectedFixtures.length} of {filteredFixtures.length} selected</span>
                  </div>
                  <div className={styles.summaryActions}>
                    <button
                      onClick={deselectAll}
                      className={styles.summaryButton}
                      title="Clear selection"
                    >
                      <LucideIcon name="X" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Selection Controls */}
              <div className={styles.bulkControls}>
                <button
                  className={styles.bulkButton}
                  onClick={selectAll}
                  title="Select all visible fixtures"
                >
                  <LucideIcon name="CheckSquare" />
                  <span>All</span>
                </button>
                
                <button
                  className={styles.bulkButton}
                  onClick={invertSelection}
                  title="Invert selection"
                >
                  <LucideIcon name="RotateCcw" />
                  <span>Invert</span>
                </button>
                
                <button
                  className={styles.bulkButton}
                  onClick={() => setShowAdvancedSelection(!showAdvancedSelection)}
                  title="Advanced selection"
                >
                  <LucideIcon name="Filter" />
                  <span>Smart</span>
                </button>
                
                <button
                  className={styles.bulkButton}
                  onClick={() => setShowFlagPanel(!showFlagPanel)}
                  title="Flag management"
                >
                  <LucideIcon name="Tag" />
                  <span>Flags</span>
                </button>
              </div>

              {/* Advanced Selection Panel */}
              {showAdvancedSelection && (
                <div className={styles.advancedSelection}>
                  <div className={styles.selectionByType}>
                    <h4>Select by Type:</h4>
                    <div className={styles.typeButtons}>
                      <button
                        onClick={() => selectByType('rgb')}
                        className={styles.typeButton}
                      >
                        <LucideIcon name="Palette" />
                        RGB
                      </button>
                      <button
                        onClick={() => selectByType('movement')}
                        className={styles.typeButton}
                      >
                        <LucideIcon name="Move" />
                        Movement
                      </button>
                      <button
                        onClick={() => selectByType('dimmer')}
                        className={styles.typeButton}
                      >
                        <LucideIcon name="Sun" />
                        Dimmer
                      </button>
                    </div>
                  </div>
                  <div className={styles.smartSelection}>
                    <button
                      onClick={selectSimilar}
                      disabled={selectedFixtures.length === 0}
                      className={styles.smartButton}
                    >
                      <LucideIcon name="Copy" />
                      Select Similar
                    </button>
                    <button
                      onClick={selectAllFlagged}
                      className={styles.smartButton}
                    >
                      <LucideIcon name="Flag" />
                      All Flagged
                    </button>
                  </div>
                </div>
              )}

              {/* Flag Management Panel */}
              {showFlagPanel && (
                <div className={styles.flagPanel}>
                  <div className={styles.flagCreation}>
                    <input
                      type="text"
                      placeholder="Flag name"
                      value={newFlagName}
                      onChange={(e) => setNewFlagName(e.target.value)}
                      className={styles.flagInput}
                    />
                    <input
                      type="color"
                      value={newFlagColor}
                      onChange={(e) => setNewFlagColor(e.target.value)}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      placeholder="Category (optional)"
                      value={newFlagCategory}
                      onChange={(e) => setNewFlagCategory(e.target.value)}
                      className={styles.flagInput}
                    />
                    <button
                      onClick={createAndApplyFlag}
                      disabled={!newFlagName.trim() || selectedFixtures.length === 0}
                      className={styles.createFlagButton}
                    >
                      Create & Apply
                    </button>
                  </div>

                  {/* Quick Selection by Flag */}
                  {getAllUniqueFlags().length > 0 && (
                    <div className={styles.flagSelection}>
                      <h4>Select by Flag:</h4>
                      {getAllUniqueFlags().map(flag => (
                        <button
                          key={flag.id}
                          onClick={() => selectByFlag(flag.id)}
                          className={styles.flagButton}
                          style={{ backgroundColor: flag.color }}
                        >
                          {flag.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Selection by Category */}
                  {getAllUniqueCategories().length > 0 && (
                    <div className={styles.categorySelection}>
                      <h4>Select by Category:</h4>
                      {getAllUniqueCategories().map(category => (
                        <button
                          key={category}
                          onClick={() => selectByFlagCategory(category)}
                          className={styles.categoryButton}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Clear Flags */}
                  {selectedFixtures.length > 0 && (
                    <button
                      onClick={removeSelectedFixtureFlags}
                      className={styles.clearFlagsButton}
                    >
                      Clear Flags from Selected
                    </button>
                  )}
                </div>
              )}              {/* Fixture List with checkboxes */}
              <div className={styles.fixtureList}>
                {filteredFixtures.length === 0 ? (
                  <div className={styles.noResults}>
                    <LucideIcon name="Search" />
                    <span>No fixtures found</span>
                  </div>
                ) : (
                  filteredFixtures.map(fixture => {
                    const isSelected = selectedFixtures.includes(fixture.id);
                    const hasRgb = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                    const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
                    const hasDimmer = fixture.channels.some(ch => ch.type === 'dimmer');
                    
                    return (
                      <div
                        key={fixture.id}
                        className={`${styles.fixtureOption} ${isSelected ? styles.selected : ''}`}
                        onClick={() => {
                          setSelectedFixtures(prevSelected =>
                            prevSelected.includes(fixture.id)
                              ? prevSelected.filter(id => id !== fixture.id)
                              : [...prevSelected, fixture.id]
                          );
                        }}
                      >
                        <div className={styles.fixtureCheckbox}>
                          <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                            {isSelected && <LucideIcon name="Check" />}
                          </div>
                        </div>
                        
                        <div className={styles.fixtureInfo}>
                          <div className={styles.fixtureName}>{fixture.name}</div>
                          <div className={styles.fixtureDetails}>
                            <div className={styles.fixtureCapabilities}>
                              {hasRgb && <span className={styles.capability} title="RGB Color"><LucideIcon name="Palette" /></span>}
                              {hasMovement && <span className={styles.capability} title="Pan/Tilt"><LucideIcon name="Move" /></span>}
                              {hasDimmer && <span className={styles.capability} title="Dimmer"><LucideIcon name="Sun" /></span>}
                            </div>
                            <div className={styles.fixtureAddress}>Ch {fixture.startAddress}</div>
                          </div>
                          
                          {fixture.flags && fixture.flags.length > 0 && (
                            <div className={styles.flagIndicators}>
                              {fixture.flags.slice(0, 3).map(flag => (
                                <div
                                  key={flag.id}
                                  className={styles.flagIndicator}
                                  style={{ backgroundColor: flag.color }}
                                  title={flag.name}
                                />
                              ))}
                              {fixture.flags.length > 3 && (
                                <span className={styles.moreFlags}>+{fixture.flags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>        {selectedFixtures.length > 0 && (
          <div className={styles.controlsSection}>
            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <button
                className={styles.quickActionButton}
                onClick={() => setShowQuickActions(!showQuickActions)}
                title="Quick Actions"
              >
                <LucideIcon name="Zap" />
                <span>Quick Actions</span>
                <LucideIcon name={showQuickActions ? "ChevronUp" : "ChevronDown"} />
              </button>
              
              {showQuickActions && (
                <div className={styles.quickActionsPanel}>
                  {hasRgbChannels && (
                    <div className={styles.colorPresets}>
                      <div className={styles.presetGrid}>
                        {colorPresets.map((preset, index) => (
                          <button
                            key={index}
                            className={styles.presetButton}
                            style={{
                              backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})`,
                              border: `2px solid ${preset.r + preset.g + preset.b < 100 ? '#666' : 'transparent'}`
                            }}
                            onClick={() => applyColorPreset(preset)}
                            title={preset.name}
                          />
                        ))}
                      </div>
                      <div className={styles.colorQuickActions}>
                        <button
                          className={styles.actionButton}
                          onClick={randomizeColor}
                          title="Random Color"
                        >
                          <LucideIcon name="Shuffle" />
                          Random
                        </button>
                        {lastColorPreset && (
                          <button
                            className={styles.actionButton}
                            onClick={() => applyColorPreset(lastColorPreset)}
                            title="Restore Last Color"
                          >
                            <LucideIcon name="RotateCcw" />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {hasMovementChannels && (
                    <div className={styles.movementQuickActions}>
                      <button
                        className={styles.actionButton}
                        onClick={centerMovement}
                        title="Center Position"
                      >
                        <LucideIcon name="Target" />
                        Center
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Color Control */}
            {hasRgbChannels && (
              <div className={styles.colorControl}>
                <div className={styles.controlLabel}>
                  <LucideIcon name="Palette" />
                  <span>Color</span>
                </div>
                <canvas
                  ref={colorCanvasRef}
                  width={200}
                  height={20}
                  className={styles.colorCanvas}
                  onClick={handleColorClick}
                />
              </div>
            )}

            {/* Movement Control */}
            {hasMovementChannels && (
              <div className={styles.movementControl}>
                <div className={styles.controlLabel}>
                  <LucideIcon name="Move" />
                  <span>Movement</span>
                </div>
                <canvas
                  ref={movementCanvasRef}
                  width={80}
                  height={80}
                  className={styles.movementCanvas}
                  onClick={handleMovementClick}
                />
              </div>
            )}

            {!hasRgbChannels && !hasMovementChannels && (
              <div className={styles.noChannels}>
                <LucideIcon name="AlertCircle" />
                <span>No RGB or movement channels found</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DockableComponent>
  );
};

export default ChromaticEnergyManipulatorMini;
