import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Fixture } from '../../types/dmxTypes';
import { useDMXStore } from '../../store/dmxStore';
import { useStore } from '../../store';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import { LucideIcon } from '../ui/LucideIcon';
import { MidiLearnButton } from '../midi/MidiLearnButton';
import styles from './ComprehensiveFixtureController.module.scss';

// Enhanced interfaces for comprehensive fixture control
export interface FixtureFlag {
  mute: boolean;
  solo: boolean;
  ignoreScenes: boolean;
  ignoreBlackout: boolean;
  protect: boolean;
  favorite: boolean;
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
  capabilities: string[];
  flags: Partial<FixtureFlag>;
  dmxRange: { min: number; max: number };
  hasRGB: boolean | null;
  hasMovement: boolean | null;
  isActive: boolean | null;
}

export interface ColorPreset {
  id: string;
  name: string;
  color: { r: number; g: number; b: number };
  shortcut?: string;
}

export interface MovementPreset {
  id: string;
  name: string;
  pan: number;
  tilt: number;
  shortcut?: string;
}

interface ComprehensiveFixtureControllerProps {
  className?: string;
}

const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { id: 'red', name: 'Red', color: { r: 255, g: 0, b: 0 }, shortcut: '1' },
  { id: 'green', name: 'Green', color: { r: 0, g: 255, b: 0 }, shortcut: '2' },
  { id: 'blue', name: 'Blue', color: { r: 0, g: 0, b: 255 }, shortcut: '3' },
  { id: 'white', name: 'White', color: { r: 255, g: 255, b: 255 }, shortcut: '4' },
  { id: 'amber', name: 'Amber', color: { r: 255, g: 191, b: 0 }, shortcut: '5' },
  { id: 'cyan', name: 'Cyan', color: { r: 0, g: 255, b: 255 }, shortcut: '6' },
  { id: 'magenta', name: 'Magenta', color: { r: 255, g: 0, b: 255 }, shortcut: '7' },
  { id: 'yellow', name: 'Yellow', color: { r: 255, g: 255, b: 0 }, shortcut: '8' },
];

const DEFAULT_MOVEMENT_PRESETS: MovementPreset[] = [
  { id: 'center', name: 'Center', pan: 127, tilt: 127, shortcut: 'C' },
  { id: 'left', name: 'Left', pan: 64, tilt: 127, shortcut: 'L' },
  { id: 'right', name: 'Right', pan: 192, tilt: 127, shortcut: 'R' },
  { id: 'up', name: 'Up', pan: 127, tilt: 192, shortcut: 'U' },
  { id: 'down', name: 'Down', pan: 127, tilt: 64, shortcut: 'D' },
  { id: 'top-left', name: 'Top Left', pan: 64, tilt: 192 },
  { id: 'top-right', name: 'Top Right', pan: 192, tilt: 192 },
  { id: 'bottom-left', name: 'Bottom Left', pan: 64, tilt: 64 },
  { id: 'bottom-right', name: 'Bottom Right', pan: 192, tilt: 64 },
];

export const ComprehensiveFixtureController: React.FC<ComprehensiveFixtureControllerProps> = ({
  className = ''
}) => {
  // Store hooks
  const fixtures = useStore(state => state.fixtures);
  const setDmxChannelValue = useStore(state => state.setDmxChannel);
  const getDmxChannelValue = useStore(state => state.getDmxChannelValue);
  const oscAssignments = useStore(state => state.oscAssignments);
  const setOscAssignment = useStore(state => state.setOscAssignment);

  // Component state
  const [selectedFixtures, setSelectedFixtures] = useState<Set<string>>(new Set());
  const [fixtureFlags, setFixtureFlags] = useState<Map<string, FixtureFlag>>(new Map());
  const [currentColor, setCurrentColor] = useState({ r: 255, g: 255, b: 255 });
  const [hsvColor, setHsvColor] = useState({ h: 0, s: 0, v: 100 });
  const [movement, setMovement] = useState({ pan: 127, tilt: 127 });
  const [intensity, setIntensity] = useState(255);
  
  // UI state
  const [expandedSections, setExpandedSections] = useState({
    selection: true,
    color: true,
    movement: true,
    intensity: true,
    addressing: false,
    midi: false
  });
  
  const [filter, setFilter] = useState<FixtureFilter>({
    searchTerm: '',
    fixtureType: '',
    capabilities: [],
    flags: {},
    dmxRange: { min: 1, max: 512 },
    hasRGB: null,
    hasMovement: null,
    isActive: null
  });
  
  const [colorPresets] = useState<ColorPreset[]>(DEFAULT_COLOR_PRESETS);
  const [movementPresets] = useState<MovementPreset[]>(DEFAULT_MOVEMENT_PRESETS);
  
  // Canvas refs for XY controllers
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const movementCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // MIDI mapping state
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

  // Dragging state for XY controllers
  const [isDraggingMovement, setIsDraggingMovement] = useState(false);
  const [isDraggingColor, setIsDraggingColor] = useState(false);
  // Performance optimization - throttled DMX updates
  const lastUpdateTime = useRef<number>(0);
  const throttledUpdateDMX = useCallback((updates: { channel: number; value: number }[]) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return; // ~60fps throttling
    lastUpdateTime.current = now;

    updates.forEach(({ channel, value }) => {
      setDmxChannelValue(channel, Math.max(0, Math.min(255, value)));
    });
  }, [setDmxChannelValue]);

  // Helper functions - moved before usage to avoid hoisting issues
  const getFixtureFlags = useCallback((fixtureId: string): FixtureFlag => {
    return fixtureFlags.get(fixtureId) || {
      mute: false,
      solo: false,
      ignoreScenes: false,
      ignoreBlackout: false,
      protect: false,
      favorite: false
    };
  }, [fixtureFlags]);

  // Filter fixtures based on current filter settings
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(fixture => {
      // Search term filter
      if (filter.searchTerm && !fixture.name.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
        return false;
      }

      // Fixture type filter
      if (filter.fixtureType && !fixture.name.toLowerCase().includes(filter.fixtureType.toLowerCase())) {
        return false;
      }

      // DMX range filter
      if (fixture.startAddress < filter.dmxRange.min || fixture.startAddress > filter.dmxRange.max) {
        return false;
      }

      // Capabilities filter
      if (filter.capabilities.length > 0) {
        const hasRequiredCapabilities = filter.capabilities.every(cap => 
          fixture.channels.some(ch => ch.type.toLowerCase().includes(cap.toLowerCase()))
        );
        if (!hasRequiredCapabilities) return false;
      }

      // RGB filter
      if (filter.hasRGB !== null) {
        const hasRGB = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
        if (hasRGB !== filter.hasRGB) return false;
      }

      // Movement filter
      if (filter.hasMovement !== null) {
        const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
        if (hasMovement !== filter.hasMovement) return false;
      }

      // Flags filter
      const flags = getFixtureFlags(fixture.id);
      for (const [flagKey, flagValue] of Object.entries(filter.flags)) {
        if (flagValue !== undefined && flags[flagKey as keyof FixtureFlag] !== flagValue) {
          return false;
        }
      }

      return true;
    });
  }, [fixtures, filter, getFixtureFlags]);
  const setFixtureFlag = useCallback((fixtureId: string, flag: keyof FixtureFlag, value: boolean) => {
    const currentFlags = getFixtureFlags(fixtureId);
    const newFlags = { ...currentFlags, [flag]: value };
    
    // Handle solo logic - if soloing this fixture, unmute it
    if (flag === 'solo' && value) {
      newFlags.mute = false;
    }
    
    setFixtureFlags(prev => new Map(prev.set(fixtureId, newFlags)));
  }, [getFixtureFlags]);
  const getFixtureChannels = useCallback((fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return { rgbChannels: {}, movementChannels: {}, dimmerChannel: null };

    const rgbChannels: { redChannel?: number; greenChannel?: number; blueChannel?: number } = {};
    const movementChannels: { panChannel?: number; tiltChannel?: number } = {};
    let dimmerChannel: number | null = null;

    fixture.channels.forEach((channel, index) => {
      const dmxAddress = fixture.startAddress + index;
      switch (channel.type) {
        case 'red':
          rgbChannels.redChannel = dmxAddress - 1;
          break;
        case 'green':
          rgbChannels.greenChannel = dmxAddress - 1;
          break;
        case 'blue':
          rgbChannels.blueChannel = dmxAddress - 1;
          break;
        case 'dimmer':
        case 'intensity':
          dimmerChannel = dmxAddress - 1;
          break;
        case 'pan':
          movementChannels.panChannel = dmxAddress - 1;
          break;
        case 'tilt':
          movementChannels.tiltChannel = dmxAddress - 1;
          break;
      }
    });

    return { rgbChannels, movementChannels, dimmerChannel };
  }, [fixtures]);

  // Color control functions
  const applyColorToSelected = useCallback((color: { r: number; g: number; b: number }) => {
    const updates: { channel: number; value: number }[] = [];

    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;

      const flags = getFixtureFlags(fixtureId);
      if (flags.mute) return;

      const hasSoloedFixtures = Array.from(fixtureFlags.values()).some(f => f.solo);
      if (hasSoloedFixtures && !flags.solo) return;

      const { rgbChannels } = getFixtureChannels(fixtureId);

      if (rgbChannels.redChannel !== undefined) {
        updates.push({ channel: rgbChannels.redChannel, value: color.r });
      }
      if (rgbChannels.greenChannel !== undefined) {
        updates.push({ channel: rgbChannels.greenChannel, value: color.g });
      }      if (rgbChannels.blueChannel !== undefined) {
        updates.push({ channel: rgbChannels.blueChannel, value: color.b });
      }
    });

    if (updates.length > 0) {
      throttledUpdateDMX(updates);
    }
  }, [selectedFixtures, fixtureFlags, throttledUpdateDMX, getFixtureFlags, getFixtureChannels]);

  // Movement control functions
  const applyMovementToSelected = useCallback((pan: number, tilt: number) => {
    const updates: { channel: number; value: number }[] = [];

    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;

      const flags = getFixtureFlags(fixtureId);
      if (flags.mute) return;

      const hasSoloedFixtures = Array.from(fixtureFlags.values()).some(f => f.solo);
      if (hasSoloedFixtures && !flags.solo) return;

      const { movementChannels } = getFixtureChannels(fixtureId);

      if (movementChannels.panChannel !== undefined) {
        updates.push({ channel: movementChannels.panChannel, value: pan });
      }      if (movementChannels.tiltChannel !== undefined) {
        updates.push({ channel: movementChannels.tiltChannel, value: tilt });
      }
    });

    if (updates.length > 0) {
      throttledUpdateDMX(updates);
    }
  }, [selectedFixtures, fixtureFlags, throttledUpdateDMX, getFixtureFlags, getFixtureChannels]);

  // Intensity control functions
  const applyIntensityToSelected = useCallback((intensityValue: number) => {
    const updates: { channel: number; value: number }[] = [];

    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;

      const flags = getFixtureFlags(fixtureId);
      if (flags.mute) return;

      const hasSoloedFixtures = Array.from(fixtureFlags.values()).some(f => f.solo);
      if (hasSoloedFixtures && !flags.solo) return;

      const { dimmerChannel } = getFixtureChannels(fixtureId);      if (dimmerChannel !== null) {
        updates.push({ channel: dimmerChannel, value: intensityValue });
      }
    });

    if (updates.length > 0) {
      throttledUpdateDMX(updates);
    }
  }, [selectedFixtures, fixtureFlags, throttledUpdateDMX, getFixtureFlags, getFixtureChannels]);

  // Movement canvas interaction
  const handleMovementCanvasInteraction = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newMovement = {
      pan: Math.max(0, Math.min(255, Math.round((x / canvas.width) * 255))),
      tilt: Math.max(0, Math.min(255, Math.round(((canvas.height - y) / canvas.height) * 255)))
    };

    setMovement(newMovement);
    applyMovementToSelected(newMovement.pan, newMovement.tilt);
  }, [applyMovementToSelected]);

  // Color wheel interaction
  const handleColorWheelInteraction = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = Math.min(centerX, centerY) - 10;

    if (distance <= radius) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const hue = angle < 0 ? angle + 360 : angle;
      const saturation = Math.min(100, (distance / radius) * 100);
      
      const newHsvColor = { ...hsvColor, h: hue, s: saturation };
      setHsvColor(newHsvColor);
      
      // Convert HSV to RGB
      const newColor = hsvToRgb(newHsvColor.h, newHsvColor.s, newHsvColor.v);
      setCurrentColor(newColor);
      applyColorToSelected(newColor);
    }
  }, [hsvColor, applyColorToSelected]);

  // HSV to RGB conversion
  const hsvToRgb = (h: number, s: number, v: number) => {
    const hh = h / 60;
    const i = Math.floor(hh);
    const ff = hh - i;
    const p = v * (1 - s / 100) / 100 * 255;
    const q = v * (1 - (s / 100) * ff) / 100 * 255;
    const t = v * (1 - (s / 100) * (1 - ff)) / 100 * 255;
    const vv = v / 100 * 255;

    switch (i) {
      case 0: return { r: vv, g: t, b: p };
      case 1: return { r: q, g: vv, b: p };
      case 2: return { r: p, g: vv, b: t };
      case 3: return { r: p, g: q, b: vv };
      case 4: return { r: t, g: p, b: vv };
      default: return { r: vv, g: p, b: q };
    }
  };

  // Draw color wheel
  useEffect(() => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;

      for (let r = 0; r < radius; r += 1) {
        const saturation = (r / radius) * 100;
        const { r: red, g: green, b: blue } = hsvToRgb(angle, saturation, hsvColor.v);
        
        ctx.strokeStyle = `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, startAngle, endAngle);
        ctx.stroke();
      }
    }

    // Draw current position indicator
    const currentAngle = (hsvColor.h * Math.PI) / 180;
    const currentRadius = (hsvColor.s / 100) * radius;
    const indicatorX = centerX + currentRadius * Math.cos(currentAngle);
    const indicatorY = centerY + currentRadius * Math.sin(currentAngle);

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }, [hsvColor]);

  // Draw movement canvas
  useEffect(() => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid background
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * canvas.width;
      const y = (i / 8) * canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Center crosshair
    ctx.strokeStyle = '#666';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Current position indicator
    const x = (movement.pan / 255) * canvas.width;
    const y = ((255 - movement.tilt) / 255) * canvas.height;
    
    // Draw crosshair at current position
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
    
    // Draw position circle
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();
  }, [movement]);

  // Selection functions
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

  const selectByType = (type: string) => {
    const matchingFixtures = filteredFixtures.filter(f => 
      f.name.toLowerCase().includes(type.toLowerCase())
    );
    setSelectedFixtures(new Set(matchingFixtures.map(f => f.id)));
  };

  const selectByCapability = (capability: string) => {
    const matchingFixtures = filteredFixtures.filter(f => 
      f.channels.some(ch => ch.type.toLowerCase().includes(capability.toLowerCase()))
    );
    setSelectedFixtures(new Set(matchingFixtures.map(f => f.id)));
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get selection statistics
  const selectionStats = useMemo(() => {
    const selectedFixtureObjects = fixtures.filter(f => selectedFixtures.has(f.id));
    return {
      count: selectedFixtureObjects.length,
      rgbCount: selectedFixtureObjects.filter(f => 
        f.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type))
      ).length,
      movementCount: selectedFixtureObjects.filter(f => 
        f.channels.some(ch => ['pan', 'tilt'].includes(ch.type))
      ).length,
      dimmerCount: selectedFixtureObjects.filter(f => 
        f.channels.some(ch => ['dimmer', 'intensity'].includes(ch.type))
      ).length
    };
  }, [fixtures, selectedFixtures]);

  return (
    <div className={`${styles.comprehensiveController} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2>
          <LucideIcon name="Lightbulb" />
          Comprehensive Fixture Controller
        </h2>
        <div className={styles.selectionInfo}>
          {selectionStats.count} fixtures selected
          {selectionStats.rgbCount > 0 && ` • ${selectionStats.rgbCount} RGB`}
          {selectionStats.movementCount > 0 && ` • ${selectionStats.movementCount} Movement`}
          {selectionStats.dimmerCount > 0 && ` • ${selectionStats.dimmerCount} Dimmer`}
        </div>
      </div>

      {/* Smart Selection Section */}
      <div className={`${styles.section} ${expandedSections.selection ? styles.expanded : ''}`}>
        <div className={styles.sectionHeader} onClick={() => toggleSection('selection')}>
          <LucideIcon name="Target" />
          <span>Smart Selection</span>
          <LucideIcon name={expandedSections.selection ? "ChevronUp" : "ChevronDown"} />
        </div>
        
        {expandedSections.selection && (
          <div className={styles.sectionContent}>
            {/* Search and filter controls */}
            <div className={styles.filterControls}>
              <div className={styles.searchBox}>
                <LucideIcon name="Search" />
                <input
                  type="text"
                  placeholder="Search fixtures..."
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
              
              <div className={styles.quickFilters}>
                <button
                  className={`${styles.filterButton} ${filter.hasRGB === true ? styles.active : ''}`}
                  onClick={() => setFilter(prev => ({ ...prev, hasRGB: prev.hasRGB === true ? null : true }))}
                >
                  <LucideIcon name="Palette" />
                  RGB Only
                </button>
                <button
                  className={`${styles.filterButton} ${filter.hasMovement === true ? styles.active : ''}`}
                  onClick={() => setFilter(prev => ({ ...prev, hasMovement: prev.hasMovement === true ? null : true }))}
                >
                  <LucideIcon name="Move" />
                  Movement Only
                </button>
              </div>
            </div>

            {/* Quick selection buttons */}
            <div className={styles.quickSelection}>
              <button onClick={selectAll} className={styles.selectButton}>
                <LucideIcon name="Square" />
                Select All ({filteredFixtures.length})
              </button>
              <button onClick={clearSelection} className={styles.selectButton}>
                <LucideIcon name="X" />
                Clear Selection
              </button>
              <button onClick={() => selectByCapability('rgb')} className={styles.selectButton}>
                <LucideIcon name="Palette" />
                All RGB
              </button>
              <button onClick={() => selectByCapability('pan')} className={styles.selectButton}>
                <LucideIcon name="Move" />
                All Moving
              </button>
            </div>

            {/* Fixture list */}
            <div className={styles.fixtureList}>
              {filteredFixtures.map(fixture => {
                const isSelected = selectedFixtures.has(fixture.id);
                const flags = getFixtureFlags(fixture.id);
                const { rgbChannels, movementChannels, dimmerChannel } = getFixtureChannels(fixture.id);
                const hasRGB = Object.keys(rgbChannels).length > 0;
                const hasMovement = Object.keys(movementChannels).length > 0;
                const hasDimmer = dimmerChannel !== null;

                return (
                  <div
                    key={fixture.id}
                    className={`${styles.fixtureItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => selectFixture(fixture.id)}
                  >
                    <div className={styles.fixtureInfo}>
                      <div className={styles.fixtureName}>{fixture.name}</div>
                      <div className={styles.fixtureDetails}>
                        DMX {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                        {hasRGB && <span className={styles.capability}>RGB</span>}
                        {hasMovement && <span className={styles.capability}>P/T</span>}
                        {hasDimmer && <span className={styles.capability}>DIM</span>}
                      </div>
                    </div>
                    
                    <div className={styles.fixtureFlags}>
                      <button
                        className={`${styles.flagButton} ${flags.mute ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFixtureFlag(fixture.id, 'mute', !flags.mute);
                        }}
                        title="Mute"
                      >
                        <LucideIcon name="VolumeX" />
                      </button>
                      <button
                        className={`${styles.flagButton} ${flags.solo ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFixtureFlag(fixture.id, 'solo', !flags.solo);
                        }}
                        title="Solo"
                      >
                        <LucideIcon name="Volume2" />
                      </button>
                      <button
                        className={`${styles.flagButton} ${flags.ignoreScenes ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFixtureFlag(fixture.id, 'ignoreScenes', !flags.ignoreScenes);
                        }}
                        title="Ignore Scene Changes"
                      >
                        <LucideIcon name="Shield" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Color Control Section */}
      {selectionStats.rgbCount > 0 && (
        <div className={`${styles.section} ${expandedSections.color ? styles.expanded : ''}`}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('color')}>
            <LucideIcon name="Palette" />
            <span>Color Control ({selectionStats.rgbCount} fixtures)</span>
            <LucideIcon name={expandedSections.color ? "ChevronUp" : "ChevronDown"} />
          </div>
          
          {expandedSections.color && (
            <div className={styles.sectionContent}>
              {/* Color wheel */}
              <div className={styles.colorControls}>
                <canvas
                  ref={colorCanvasRef}
                  width={200}
                  height={200}
                  className={styles.colorWheel}
                  onMouseDown={(e) => {
                    setIsDraggingColor(true);
                    handleColorWheelInteraction(e);
                  }}
                  onMouseMove={(e) => isDraggingColor && handleColorWheelInteraction(e)}
                  onMouseUp={() => setIsDraggingColor(false)}
                  onMouseLeave={() => setIsDraggingColor(false)}
                  onClick={handleColorWheelInteraction}
                />
                
                {/* RGB sliders */}
                <div className={styles.rgbSliders}>
                  {['r', 'g', 'b'].map(color => (
                    <div key={color} className={styles.sliderGroup}>
                      <label>{color.toUpperCase()}</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={currentColor[color as keyof typeof currentColor]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const newColor = { ...currentColor, [color]: value };
                          setCurrentColor(newColor);
                          applyColorToSelected(newColor);
                        }}
                        className={`${styles.slider} ${styles[color]}`}
                      />
                      <span>{currentColor[color as keyof typeof currentColor]}</span>
                      <MidiLearnButton 
                        channelIndex={0} // This would need to be mapped to actual controls
                        className={styles.midiButton}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Color presets */}
              <div className={styles.colorPresets}>
                {colorPresets.map(preset => (
                  <button
                    key={preset.id}
                    className={styles.presetButton}
                    onClick={() => {
                      setCurrentColor(preset.color);
                      applyColorToSelected(preset.color);
                    }}
                    style={{ backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})` }}
                    title={`${preset.name} ${preset.shortcut ? `(${preset.shortcut})` : ''}`}
                  >
                    {preset.shortcut || preset.name.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Movement Control Section */}
      {selectionStats.movementCount > 0 && (
        <div className={`${styles.section} ${expandedSections.movement ? styles.expanded : ''}`}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('movement')}>
            <LucideIcon name="Move" />
            <span>Movement Control ({selectionStats.movementCount} fixtures)</span>
            <LucideIcon name={expandedSections.movement ? "ChevronUp" : "ChevronDown"} />
          </div>
          
          {expandedSections.movement && (
            <div className={styles.sectionContent}>
              <div className={styles.movementControls}>
                {/* XY pad for pan/tilt */}
                <div className={styles.xyPadContainer}>
                  <canvas
                    ref={movementCanvasRef}
                    width={240}
                    height={240}
                    className={styles.movementCanvas}
                    onMouseDown={(e) => {
                      setIsDraggingMovement(true);
                      handleMovementCanvasInteraction(e);
                    }}
                    onMouseMove={(e) => isDraggingMovement && handleMovementCanvasInteraction(e)}
                    onMouseUp={() => setIsDraggingMovement(false)}
                    onMouseLeave={() => setIsDraggingMovement(false)}
                    onClick={handleMovementCanvasInteraction}
                    style={{ cursor: isDraggingMovement ? 'grabbing' : 'grab' }}
                  />
                  
                  <div className={styles.xyLabels}>
                    <span className={styles.leftLabel}>Pan ←</span>
                    <span className={styles.rightLabel}>→ Pan</span>
                    <span className={styles.topLabel}>↑ Tilt</span>
                    <span className={styles.bottomLabel}>Tilt ↓</span>
                  </div>
                </div>
                
                {/* Pan/Tilt sliders */}
                <div className={styles.movementSliders}>
                  <div className={styles.sliderGroup}>
                    <label>Pan</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={movement.pan}
                      onChange={(e) => {
                        const newPan = parseInt(e.target.value);
                        const newMovement = { ...movement, pan: newPan };
                        setMovement(newMovement);
                        applyMovementToSelected(newPan, movement.tilt);
                      }}
                      className={styles.panSlider}
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={movement.pan}
                      onChange={(e) => {
                        const newPan = parseInt(e.target.value) || 0;
                        const newMovement = { ...movement, pan: newPan };
                        setMovement(newMovement);
                        applyMovementToSelected(newPan, movement.tilt);
                      }}
                      className={styles.numberInput}
                    />
                    <MidiLearnButton 
                      channelIndex={0} // This would need to be mapped to actual controls
                      className={styles.midiButton}
                    />
                  </div>
                  
                  <div className={styles.sliderGroup}>
                    <label>Tilt</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={movement.tilt}
                      onChange={(e) => {
                        const newTilt = parseInt(e.target.value);
                        const newMovement = { ...movement, tilt: newTilt };
                        setMovement(newMovement);
                        applyMovementToSelected(movement.pan, newTilt);
                      }}
                      className={styles.tiltSlider}
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={movement.tilt}
                      onChange={(e) => {
                        const newTilt = parseInt(e.target.value) || 0;
                        const newMovement = { ...movement, tilt: newTilt };
                        setMovement(newMovement);
                        applyMovementToSelected(movement.pan, newTilt);
                      }}
                      className={styles.numberInput}
                    />
                    <MidiLearnButton 
                      channelIndex={0} // This would need to be mapped to actual controls
                      className={styles.midiButton}
                    />
                  </div>
                </div>
              </div>

              {/* Movement presets */}
              <div className={styles.movementPresets}>
                {movementPresets.map(preset => (
                  <button
                    key={preset.id}
                    className={styles.presetButton}
                    onClick={() => {
                      setMovement({ pan: preset.pan, tilt: preset.tilt });
                      applyMovementToSelected(preset.pan, preset.tilt);
                    }}
                    title={`${preset.name} ${preset.shortcut ? `(${preset.shortcut})` : ''}`}
                  >
                    <LucideIcon name="Target" />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intensity Control Section */}
      {selectionStats.dimmerCount > 0 && (
        <div className={`${styles.section} ${expandedSections.intensity ? styles.expanded : ''}`}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('intensity')}>
            <LucideIcon name="Sun" />
            <span>Intensity Control ({selectionStats.dimmerCount} fixtures)</span>
            <LucideIcon name={expandedSections.intensity ? "ChevronUp" : "ChevronDown"} />
          </div>
          
          {expandedSections.intensity && (
            <div className={styles.sectionContent}>
              <div className={styles.intensityControls}>
                <div className={styles.sliderGroup}>
                  <label>Master Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={intensity}
                    onChange={(e) => {
                      const newIntensity = parseInt(e.target.value);
                      setIntensity(newIntensity);
                      applyIntensityToSelected(newIntensity);
                    }}
                    className={styles.intensitySlider}
                  />
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={intensity}
                    onChange={(e) => {
                      const newIntensity = parseInt(e.target.value) || 0;
                      setIntensity(newIntensity);
                      applyIntensityToSelected(newIntensity);
                    }}
                    className={styles.numberInput}
                  />
                  <MidiLearnButton 
                    channelIndex={0} // This would need to be mapped to actual controls
                    className={styles.midiButton}
                  />
                </div>

                <div className={styles.intensityPresets}>
                  <button
                    className={styles.presetButton}
                    onClick={() => {
                      setIntensity(0);
                      applyIntensityToSelected(0);
                    }}
                  >
                    <LucideIcon name="Power" />
                    Blackout
                  </button>
                  <button
                    className={styles.presetButton}
                    onClick={() => {
                      setIntensity(127);
                      applyIntensityToSelected(127);
                    }}
                  >
                    <LucideIcon name="Sun" />
                    50%
                  </button>
                  <button
                    className={styles.presetButton}
                    onClick={() => {
                      setIntensity(255);
                      applyIntensityToSelected(255);
                    }}
                  >
                    <LucideIcon name="Zap" />
                    Full
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Addressing Control Section */}
      <div className={`${styles.section} ${expandedSections.addressing ? styles.expanded : ''}`}>
        <div className={styles.sectionHeader} onClick={() => toggleSection('addressing')}>
          <LucideIcon name="Settings" />
          <span>Addressing & OSC</span>
          <LucideIcon name={expandedSections.addressing ? "ChevronUp" : "ChevronDown"} />
        </div>
        
        {expandedSections.addressing && (
          <div className={styles.sectionContent}>
            <div className={styles.addressingControls}>
              <div className={styles.oscInfo}>
                <h4>OSC Addressing Pattern</h4>
                <p>All controls use OSC addresses for external control:</p>
                <ul>
                  <li><code>/fixture/[id]/pan</code> - Pan control</li>
                  <li><code>/fixture/[id]/tilt</code> - Tilt control</li>
                  <li><code>/fixture/[id]/red</code> - Red channel</li>
                  <li><code>/fixture/[id]/green</code> - Green channel</li>
                  <li><code>/fixture/[id]/blue</code> - Blue channel</li>
                  <li><code>/fixture/[id]/intensity</code> - Dimmer/intensity</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MIDI Mapping Section */}
      <div className={`${styles.section} ${expandedSections.midi ? styles.expanded : ''}`}>
        <div className={styles.sectionHeader} onClick={() => toggleSection('midi')}>
          <LucideIcon name="Music" />
          <span>MIDI Mapping</span>
          <LucideIcon name={expandedSections.midi ? "ChevronUp" : "ChevronDown"} />
        </div>
        
        {expandedSections.midi && (
          <div className={styles.sectionContent}>
            <div className={styles.midiInfo}>
              <p>Use the MIDI Learn buttons next to each control to assign MIDI CC controllers.</p>
              <p>All controls support MIDI learning for real-time hardware control.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
