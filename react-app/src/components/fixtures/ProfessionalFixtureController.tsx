import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useChromaticEnergyManipulatorSettings } from '../../context/ChromaticEnergyManipulatorContext';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore, Fixture, FixtureFlag, MidiMapping } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ProfessionalFixtureController.module.scss';

interface ProfessionalFixtureControllerProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isDockable?: boolean;
}

// Enhanced interfaces for professional control
interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface MovementPosition {
  pan: number;
  tilt: number;
}

interface EnhancedFixtureFlag extends FixtureFlag {
  isMuted?: boolean;
  isSolo?: boolean;
  ignoreSceneChanges?: boolean;
  ignoreBlackouts?: boolean;
  isProtected?: boolean;
  isHighlighted?: boolean;
}

interface ControlMidiMapping {
  enabled: boolean;
  learning: boolean;
  xyControl?: {
    panCC: number;
    tiltCC: number;
    channel: number;
  };
  colorControl?: {
    redCC: number;
    greenCC: number;
    blueCC: number;
    hueCC?: number;
    saturationCC?: number;
    valueCC?: number;
    channel: number;
  };
}

interface FixtureFilter {
  searchTerm: string;
  byType: string[];
  byFlag: string[];
  hasRGB: boolean | null;
  hasMovement: boolean | null;
  isActive: boolean | null;
  isSelected: boolean | null;
}

interface QuickControlPreset {
  id: string;
  name: string;
  icon: string;
  color?: RGBColor;
  movement?: MovementPosition;
  action?: () => void;
}

interface ScenePreset {
  id: string;
  name: string;
  description?: string;
  fixtures: {
    [fixtureId: string]: {
      color?: RGBColor;
      movement?: MovementPosition;
    };
  };
  createdAt: number;
}

// Utility functions
const hsvToRgb = (h: number, s: number, v: number): RGBColor => {
  h = h / 360;
  s = s / 100;
  v = v / 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 1/6) { r = c; g = x; b = 0; }
  else if (h < 2/6) { r = x; g = c; b = 0; }
  else if (h < 3/6) { r = 0; g = c; b = x; }
  else if (h < 4/6) { r = 0; g = x; b = c; }
  else if (h < 5/6) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

const rgbToHsv = (r: number, g: number, b: number): HSVColor => {
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = max === 0 ? 0 : (diff / max) * 100;
  let v = max * 100;
  
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;
  }
  
  h = h * 60;
  if (h < 0) h += 360;
  
  return { h, s, v };
};

const kelvinToRgb = (kelvin: number): RGBColor => {
  const temp = kelvin / 100;
  let r, g, b;
  
  if (temp <= 66) {
    r = 255;
    g = temp <= 19 ? 0 : 99.4708025861 * Math.log(temp - 10) - 161.1195681661;
    b = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }
  
  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b)))
  };
};

const ProfessionalFixtureController: React.FC<ProfessionalFixtureControllerProps> = ({
  isCollapsed = false,
  onCollapsedChange,
  isDockable = true,
}) => {
  // Core state
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [controlMode, setControlMode] = useState<'collective' | 'independent'>('collective');
  
  // Color and movement state
  const [color, setColor] = useState<RGBColor>({ r: 255, g: 255, b: 255 });
  const [hsvColor, setHsvColor] = useState<HSVColor>({ h: 0, s: 0, v: 100 });
  const [movement, setMovement] = useState<MovementPosition>({ pan: 127, tilt: 127 });
  const [colorTemperature, setColorTemperature] = useState(5600);
    // Professional features state
  const [fixtureFlags, setFixtureFlags] = useState<Map<string, EnhancedFixtureFlag>>(new Map());
  
  // Helper function to get fixture flags with defaults
  const getFixtureFlags = useCallback((fixtureId: string): EnhancedFixtureFlag => {
    const flags = fixtureFlags.get(fixtureId);
    if (flags) return flags;
    
    // Return default flags for fixtures without flags
    return {
      id: '',
      name: '',
      color: '',
      isMuted: false,
      isSolo: false,
      ignoreSceneChanges: false,
      ignoreBlackouts: false,
      isProtected: false,
      isHighlighted: false
    };
  }, [fixtureFlags]);
  const [fixtureFilter, setFixtureFilter] = useState<FixtureFilter>({
    searchTerm: '',
    byType: [],
    byFlag: [],
    hasRGB: null,
    hasMovement: null,
    isActive: null,
    isSelected: null
  });
  const [midiMapping, setMidiMapping] = useState<ControlMidiMapping>({
    enabled: false,
    learning: false
  });
  const [quickPresets] = useState<QuickControlPreset[]>([
    { id: 'red', name: 'Red', icon: 'Circle', color: { r: 255, g: 0, b: 0 } },
    { id: 'green', name: 'Green', icon: 'Circle', color: { r: 0, g: 255, b: 0 } },
    { id: 'blue', name: 'Blue', icon: 'Circle', color: { r: 0, g: 0, b: 255 } },
    { id: 'white', name: 'White', icon: 'Circle', color: { r: 255, g: 255, b: 255 } },
    { id: 'amber', name: 'Amber', icon: 'Circle', color: { r: 255, g: 191, b: 0 } },
    { id: 'cyan', name: 'Cyan', icon: 'Circle', color: { r: 0, g: 255, b: 255 } },
    { id: 'magenta', name: 'Magenta', icon: 'Circle', color: { r: 255, g: 0, b: 255 } },
    { id: 'center', name: 'Center', icon: 'Target', movement: { pan: 127, tilt: 127 } },
    { id: 'blackout', name: 'Blackout', icon: 'Power', color: { r: 0, g: 0, b: 0 } }
  ]);
  
  // UI state
  const [showFixtureList, setShowFixtureList] = useState(true);
  const [showQuickControls, setShowQuickControls] = useState(true);
  const [showMidiMapping, setShowMidiMapping] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isDraggingColor, setIsDraggingColor] = useState(false);
  const [isDraggingMovement, setIsDraggingMovement] = useState(false);
  
  // Scene management
  const [scenePresets, setScenePresets] = useState<ScenePreset[]>([]);
  const [newSceneName, setNewSceneName] = useState('');
  
  // Canvas references
  const colorWheelRef = useRef<HTMLCanvasElement>(null);
  const movementCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastUpdateTime = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Store access
  const { 
    fixtures, 
    getDmxChannelValue, 
    setDmxChannelValue
  } = useStore(state => ({
    fixtures: state.fixtures,
    getDmxChannelValue: state.getDmxChannelValue,
    setDmxChannelValue: state.setDmxChannelValue
  }));

  const { settings } = useChromaticEnergyManipulatorSettings();

  // Get fixture channels with enhanced error handling
  const getFixtureChannels = useCallback((fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return { rgbChannels: {}, movementChannels: {}, dimmerChannel: null };
    
    const rgbChannels: {
      redChannel?: number;
      greenChannel?: number;
      blueChannel?: number;
    } = {};
    
    const movementChannels: {
      panChannel?: number;
      tiltChannel?: number;
    } = {};

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

  // Enhanced DMX update with fixture flags
  const updateFixtureValues = useCallback((
    fixtureUpdates: Array<{
      fixtureId: string;
      color?: RGBColor;
      movement?: MovementPosition;
      dimmer?: number;
    }>
  ) => {
    if (!isLiveMode) return;

    const now = Date.now();
    if (now - lastUpdateTime.current < 16) { // 60fps throttling
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        updateFixtureValues(fixtureUpdates);
      }, 16);
      return;
    }

    const channelUpdates: Array<{ channel: number; value: number }> = [];

    fixtureUpdates.forEach(({ fixtureId, color, movement, dimmer }) => {
      const flags = fixtureFlags.get(fixtureId);
      
      // Skip if fixture is muted
      if (flags?.isMuted) return;
      
      // Skip if other fixtures are soloed and this one isn't
      const soloedFixtures = Array.from(fixtureFlags.values()).some(f => f.isSolo);
      if (soloedFixtures && !flags?.isSolo) return;
      
      const { rgbChannels, movementChannels, dimmerChannel } = getFixtureChannels(fixtureId);
      
      // Color updates
      if (color && !flags?.ignoreSceneChanges) {
        if (rgbChannels.redChannel !== undefined) {
          channelUpdates.push({ channel: rgbChannels.redChannel, value: color.r });
        }
        if (rgbChannels.greenChannel !== undefined) {
          channelUpdates.push({ channel: rgbChannels.greenChannel, value: color.g });
        }
        if (rgbChannels.blueChannel !== undefined) {
          channelUpdates.push({ channel: rgbChannels.blueChannel, value: color.b });
        }
      }
      
      // Movement updates
      if (movement && !flags?.ignoreSceneChanges) {
        if (movementChannels.panChannel !== undefined) {
          channelUpdates.push({ channel: movementChannels.panChannel, value: movement.pan });
        }
        if (movementChannels.tiltChannel !== undefined) {
          channelUpdates.push({ channel: movementChannels.tiltChannel, value: movement.tilt });
        }
      }
      
      // Dimmer updates
      if (dimmer !== undefined && dimmerChannel !== null && !flags?.ignoreSceneChanges) {
        channelUpdates.push({ channel: dimmerChannel, value: dimmer });
      }
    });

    // Batch update for performance
    if (channelUpdates.length > 0) {
      channelUpdates.forEach(({ channel, value }) => {
        setDmxChannelValue(channel, Math.max(0, Math.min(255, value)));
      });
    }

    lastUpdateTime.current = now;
  }, [isLiveMode, getFixtureChannels, setDmxChannelValue, fixtureFlags]);
  // Fixture flagging functions
  const toggleFixtureFlag = useCallback((fixtureId: string, flag: keyof EnhancedFixtureFlag) => {
    setFixtureFlags(prev => {
      const newFlags = new Map(prev);
      const currentFlags = getFixtureFlags(fixtureId);
      
      if (flag === 'isSolo') {
        // If turning on solo, turn off solo for all other fixtures
        if (!currentFlags.isSolo) {
          newFlags.forEach((flags, id) => {
            if (id !== fixtureId) {
              newFlags.set(id, { ...flags, isSolo: false });
            }
          });
        }
      }
      
      newFlags.set(fixtureId, {
        ...currentFlags,
        [flag]: !currentFlags[flag as keyof EnhancedFixtureFlag]
      });
      
      return newFlags;
    });
  }, [getFixtureFlags]);

  const clearAllFlags = useCallback((flag?: keyof EnhancedFixtureFlag) => {
    setFixtureFlags(prev => {
      const newFlags = new Map(prev);
      if (flag) {
        newFlags.forEach((flags, id) => {
          newFlags.set(id, { ...flags, [flag]: false });
        });
      } else {
        newFlags.clear();
      }
      return newFlags;
    });
  }, []);

  // Smart selection functions
  const selectFixturesByType = useCallback((type: string) => {
    const typeFixtures = fixtures.filter(f => f.type === type);
    setSelectedFixtures(typeFixtures.map(f => f.id));
  }, [fixtures]);

  const selectSimilarFixtures = useCallback((fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    
    const similarFixtures = fixtures.filter(f => f.type === fixture.type);
    setSelectedFixtures(similarFixtures.map(f => f.id));
  }, [fixtures]);

  const selectByChannelType = useCallback((channelType: string) => {
    const matchingFixtures = fixtures.filter(fixture =>
      fixture.channels.some(ch => ch.type === channelType)
    );
    setSelectedFixtures(matchingFixtures.map(f => f.id));
  }, [fixtures]);

  const selectByFlag = useCallback((flag: keyof EnhancedFixtureFlag) => {
    const flaggedFixtures: string[] = [];
    fixtureFlags.forEach((flags, fixtureId) => {
      if (flags[flag]) {
        flaggedFixtures.push(fixtureId);
      }
    });
    setSelectedFixtures(flaggedFixtures);
  }, [fixtureFlags]);

  // Color control functions
  const applyColorToFixtures = useCallback((newColor: RGBColor) => {
    setColor(newColor);
    
    if (controlMode === 'collective') {
      const updates = selectedFixtures.map(fixtureId => ({
        fixtureId,
        color: newColor
      }));
      updateFixtureValues(updates);
    }
  }, [controlMode, selectedFixtures, updateFixtureValues]);

  const applyMovementToFixtures = useCallback((newMovement: MovementPosition) => {
    setMovement(newMovement);
    
    if (controlMode === 'collective') {
      const updates = selectedFixtures.map(fixtureId => ({
        fixtureId,
        movement: newMovement
      }));
      updateFixtureValues(updates);
    }
  }, [controlMode, selectedFixtures, updateFixtureValues]);

  // Quick preset functions
  const applyQuickPreset = useCallback((preset: QuickControlPreset) => {
    if (preset.color) {
      applyColorToFixtures(preset.color);
    }
    if (preset.movement) {
      applyMovementToFixtures(preset.movement);
    }
    if (preset.action) {
      preset.action();
    }
  }, [applyColorToFixtures, applyMovementToFixtures]);

  // Blackout function with flag support
  const blackoutSelectedFixtures = useCallback(() => {
    const updates = selectedFixtures
      .filter(fixtureId => {
        const flags = fixtureFlags.get(fixtureId);
        return !flags?.ignoreBlackouts;
      })
      .map(fixtureId => ({
        fixtureId,
        color: { r: 0, g: 0, b: 0 }
      }));
    updateFixtureValues(updates);
  }, [selectedFixtures, fixtureFlags, updateFixtureValues]);

  // Filter fixtures
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(fixture => {
      // Search term filter
      if (fixtureFilter.searchTerm && 
          !fixture.name.toLowerCase().includes(fixtureFilter.searchTerm.toLowerCase()) &&
          !fixture.type.toLowerCase().includes(fixtureFilter.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (fixtureFilter.byType.length > 0 && !fixtureFilter.byType.includes(fixture.type)) {
        return false;
      }
      
      // Flag filter
      if (fixtureFilter.byFlag.length > 0) {
        const flags = fixtureFlags.get(fixture.id);
        const hasRequiredFlag = fixtureFilter.byFlag.some(flag => 
          flags?.[flag as keyof EnhancedFixtureFlag]
        );
        if (!hasRequiredFlag) return false;
      }
      
      // RGB capability filter
      if (fixtureFilter.hasRGB !== null) {
        const hasRGB = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
        if (hasRGB !== fixtureFilter.hasRGB) return false;
      }
      
      // Movement capability filter
      if (fixtureFilter.hasMovement !== null) {
        const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
        if (hasMovement !== fixtureFilter.hasMovement) return false;
      }
      
      // Selection filter
      if (fixtureFilter.isSelected !== null) {
        const isSelected = selectedFixtures.includes(fixture.id);
        if (isSelected !== fixtureFilter.isSelected) return false;
      }
      
      return true;
    });
  }, [fixtures, fixtureFilter, fixtureFlags, selectedFixtures]);

  // Calculate selection stats
  const selectionStats = useMemo(() => {
    return {
      total: selectedFixtures.length,
      rgbCount: selectedFixtures.filter(id => {
        const fixture = fixtures.find(f => f.id === id);
        return fixture?.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
      }).length,
      movementCount: selectedFixtures.filter(id => {
        const fixture = fixtures.find(f => f.id === id);
        return fixture?.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
      }).length,
      mutedCount: selectedFixtures.filter(id => fixtureFlags.get(id)?.isMuted).length,
      soloCount: selectedFixtures.filter(id => fixtureFlags.get(id)?.isSolo).length
    };
  }, [selectedFixtures, fixtures, fixtureFlags]);

  // Color wheel interaction
  const handleColorWheelInteraction = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
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
      
      const newColor = hsvToRgb(newHsvColor.h, newHsvColor.s, newHsvColor.v);
      applyColorToFixtures(newColor);
    }
  }, [hsvColor, applyColorToFixtures]);

  // Movement canvas interaction
  const handleMovementCanvasInteraction = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const newMovement = {
      pan: Math.max(0, Math.min(255, Math.round((x / canvas.width) * 255))),
      tilt: Math.max(0, Math.min(255, Math.round(((canvas.height - y) / canvas.height) * 255)))
    };
    
    applyMovementToFixtures(newMovement);
  }, [applyMovementToFixtures]);

  // MIDI learning functions
  const startMidiLearning = useCallback((control: 'pan' | 'tilt' | 'red' | 'green' | 'blue' | 'hue' | 'saturation' | 'value') => {
    setMidiMapping(prev => ({
      ...prev,
      learning: true,
      learningControl: control
    }));
    
    // In a real implementation, you would listen for MIDI input here
    console.log(`Learning MIDI for ${control}...`);
  }, []);

  const stopMidiLearning = useCallback(() => {
    setMidiMapping(prev => ({
      ...prev,
      learning: false,
      learningControl: undefined
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault();
            setSelectedFixtures(fixtures.map(f => f.id));
          }
          break;
        case 'escape':
          setSelectedFixtures([]);
          break;
        case 'delete':
        case 'backspace':
          blackoutSelectedFixtures();
          break;
        case 'c':
          if (event.ctrlKey) {
            // Copy current color/movement state
            console.log('Copy state:', { color, movement });
          }
          break;
        case ' ':
          event.preventDefault();
          setIsLiveMode(!isLiveMode);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fixtures, blackoutSelectedFixtures, color, movement, isLiveMode]);

  // Draw color wheel
  useEffect(() => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      for (let r = 0; r < radius; r += 1) {
        const hue = angle;
        const saturation = (r / radius) * 100;
        const rgb = hsvToRgb(hue, saturation, hsvColor.v);
        
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        const x = centerX + r * Math.cos(angle * Math.PI / 180);
        const y = centerY + r * Math.sin(angle * Math.PI / 180);
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw current color indicator
    const currentRadius = (hsvColor.s / 100) * radius;
    const currentAngle = hsvColor.h * Math.PI / 180;
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
    
    // Draw circle indicator
    ctx.fillStyle = '#007acc';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }, [movement]);

  // Auto-sync HSV when RGB changes
  useEffect(() => {
    const hsv = rgbToHsv(color.r, color.g, color.b);
    setHsvColor(hsv);
  }, [color]);

  // Main render function
  const renderMainInterface = () => (
    <div className={styles.professionalController}>
      {/* Header with tools and status */}
      <div className={styles.header}>
        <div className={styles.statusBar}>
          <div className={styles.selectionInfo}>
            <LucideIcon name="Target" />
            <span>{selectionStats.total} selected</span>
            {selectionStats.rgbCount > 0 && <span>({selectionStats.rgbCount} RGB)</span>}
            {selectionStats.movementCount > 0 && <span>({selectionStats.movementCount} Movement)</span>}
          </div>
          
          <div className={styles.modeControls}>
            <button
              className={`${styles.modeButton} ${controlMode === 'collective' ? styles.active : ''}`}
              onClick={() => setControlMode('collective')}
              title="Collective control - all selected fixtures respond together"
            >
              <LucideIcon name="Link" />
              Collective
            </button>
            <button
              className={`${styles.modeButton} ${controlMode === 'independent' ? styles.active : ''}`}
              onClick={() => setControlMode('independent')}
              title="Independent control - control fixtures individually"
            >
              <LucideIcon name="Unlink" />
              Independent
            </button>
          </div>
          
          <div className={styles.liveMode}>
            <label className={styles.liveModeToggle}>
              <input
                type="checkbox"
                checked={isLiveMode}
                onChange={(e) => setIsLiveMode(e.target.checked)}
              />
              <LucideIcon name={isLiveMode ? "Zap" : "ZapOff"} />
              <span>Live</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick Control Bar */}
      {showQuickControls && (
        <div className={styles.quickControlBar}>
          <div className={styles.quickPresets}>
            {quickPresets.map(preset => (
              <button
                key={preset.id}
                className={styles.quickPreset}
                onClick={() => applyQuickPreset(preset)}
                title={preset.name}
                style={preset.color ? {
                  backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})`
                } : undefined}
              >
                <LucideIcon name={preset.icon as any} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
          
          <div className={styles.quickActions}>
            <button
              onClick={() => setSelectedFixtures([])}
              className={styles.clearSelectionButton}
              title="Clear selection (Escape)"
            >
              <LucideIcon name="X" />
            </button>
            <button
              onClick={() => setSelectedFixtures(fixtures.map(f => f.id))}
              className={styles.selectAllButton}
              title="Select all (Ctrl+A)"
            >
              <LucideIcon name="CheckSquare" />
            </button>
          </div>
        </div>
      )}

      <div className={styles.mainContent}>
        {/* Fixture List Panel */}
        {showFixtureList && (
          <div className={styles.fixturePanel}>
            <div className={styles.fixtureHeader}>
              <h3>
                <LucideIcon name="List" />
                Fixtures ({filteredFixtures.length})
              </h3>
              
              <div className={styles.filterControls}>
                <input
                  type="text"
                  placeholder="Search fixtures..."
                  value={fixtureFilter.searchTerm}
                  onChange={(e) => setFixtureFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className={styles.searchInput}
                />
                
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`${styles.filterButton} ${showAdvancedFilters ? styles.active : ''}`}
                  title="Advanced filters"
                >
                  <LucideIcon name="Filter" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className={styles.advancedFilters}>
                <div className={styles.filterRow}>
                  <label>Capability:</label>
                  <div className={styles.checkboxGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={fixtureFilter.hasRGB === true}
                        onChange={(e) => setFixtureFilter(prev => ({ 
                          ...prev, 
                          hasRGB: e.target.checked ? true : null 
                        }))}
                      />
                      RGB
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={fixtureFilter.hasMovement === true}
                        onChange={(e) => setFixtureFilter(prev => ({ 
                          ...prev, 
                          hasMovement: e.target.checked ? true : null 
                        }))}
                      />
                      Movement
                    </label>
                  </div>
                </div>
                
                <div className={styles.filterRow}>
                  <label>Flags:</label>
                  <div className={styles.checkboxGroup}>
                    {['isMuted', 'isSolo', 'isProtected'].map(flag => (
                      <label key={flag}>
                        <input
                          type="checkbox"
                          checked={fixtureFilter.byFlag.includes(flag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFixtureFilter(prev => ({ 
                                ...prev, 
                                byFlag: [...prev.byFlag, flag] 
                              }));
                            } else {
                              setFixtureFilter(prev => ({ 
                                ...prev, 
                                byFlag: prev.byFlag.filter(f => f !== flag) 
                              }));
                            }
                          }}
                        />
                        {flag.replace('is', '')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}            <div className={styles.fixtureList}>
              {filteredFixtures.map(fixture => {
                const flags = getFixtureFlags(fixture.id);
                const isSelected = selectedFixtures.includes(fixture.id);
                const hasRGB = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
                
                return (
                  <div
                    key={fixture.id}
                    className={`${styles.fixtureItem} ${isSelected ? styles.selected : ''} ${flags.isMuted ? styles.muted : ''} ${flags.isSolo ? styles.solo : ''}`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        // Add/remove from selection
                        if (isSelected) {
                          setSelectedFixtures(prev => prev.filter(id => id !== fixture.id));
                        } else {
                          setSelectedFixtures(prev => [...prev, fixture.id]);
                        }
                      } else if (e.shiftKey && selectedFixtures.length > 0) {
                        // Range selection
                        const lastSelected = selectedFixtures[selectedFixtures.length - 1];
                        const lastIndex = fixtures.findIndex(f => f.id === lastSelected);
                        const currentIndex = fixtures.findIndex(f => f.id === fixture.id);
                        const start = Math.min(lastIndex, currentIndex);
                        const end = Math.max(lastIndex, currentIndex);
                        const rangeIds = fixtures.slice(start, end + 1).map(f => f.id);
                        setSelectedFixtures(prev => [...new Set([...prev, ...rangeIds])]);
                      } else {
                        // Single selection
                        setSelectedFixtures([fixture.id]);
                      }
                    }}
                    onDoubleClick={() => selectSimilarFixtures(fixture.id)}
                  >
                    <div className={styles.fixtureInfo}>
                      <div className={styles.fixtureName}>
                        {fixture.name}
                      </div>
                      <div className={styles.fixtureType}>
                        {fixture.type}
                      </div>
                      <div className={styles.fixtureAddress}>
                        DMX: {fixture.startAddress}
                      </div>
                    </div>
                    
                    <div className={styles.fixtureCapabilities}>
                      {hasRGB && <LucideIcon name="Palette" className={styles.rgbIcon} />}
                      {hasMovement && <LucideIcon name="Move" className={styles.movementIcon} />}
                    </div>
                    
                    <div className={styles.fixtureFlags}>
                      <button
                        className={`${styles.flagButton} ${flags.isMuted ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFixtureFlag(fixture.id, 'isMuted');
                        }}
                        title="Mute fixture"
                      >
                        <LucideIcon name="VolumeX" />
                      </button>
                      <button
                        className={`${styles.flagButton} ${flags.isSolo ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFixtureFlag(fixture.id, 'isSolo');
                        }}
                        title="Solo fixture"
                      >
                        <LucideIcon name="Volume2" />
                      </button>
                      <button
                        className={`${styles.flagButton} ${flags.isProtected ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFixtureFlag(fixture.id, 'isProtected');
                        }}
                        title="Protect from blackouts"
                      >
                        <LucideIcon name="Shield" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Selection Tools */}
            <div className={styles.smartSelection}>
              <h4>Smart Selection</h4>
              <div className={styles.smartButtons}>
                <button onClick={() => selectByChannelType('red')}>
                  <LucideIcon name="Palette" />
                  RGB Fixtures
                </button>
                <button onClick={() => selectByChannelType('pan')}>
                  <LucideIcon name="Move" />
                  Moving Fixtures
                </button>
                <button onClick={() => selectByFlag('isMuted')}>
                  <LucideIcon name="VolumeX" />
                  Muted
                </button>
                <button onClick={() => selectByFlag('isSolo')}>
                  <LucideIcon name="Volume2" />
                  Solo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className={styles.controlPanel}>
          {selectedFixtures.length === 0 ? (
            <div className={styles.noSelection}>
              <LucideIcon name="MousePointer" />
              <h3>No Fixtures Selected</h3>
              <p>Select fixtures from the list to control them</p>
            </div>
          ) : (
            <div className={styles.controlSections}>
              {/* Color Control Section */}
              {selectionStats.rgbCount > 0 && (
                <div className={styles.colorSection}>
                  <h3>
                    <LucideIcon name="Palette" />
                    Color Control ({selectionStats.rgbCount} fixtures)
                  </h3>
                  
                  <div className={styles.colorControls}>
                    <div className={styles.colorWheelContainer}>
                      <canvas
                        ref={colorWheelRef}
                        width={240}
                        height={240}
                        className={styles.colorWheel}
                        onMouseDown={(e) => {
                          setIsDraggingColor(true);
                          handleColorWheelInteraction(e);
                        }}
                        onMouseMove={(e) => isDraggingColor && handleColorWheelInteraction(e)}
                        onMouseUp={() => setIsDraggingColor(false)}
                        onMouseLeave={() => setIsDraggingColor(false)}
                        onClick={handleColorWheelInteraction}
                        style={{ cursor: isDraggingColor ? 'grabbing' : 'grab' }}
                      />
                      
                      {midiMapping.learning && (
                        <div className={styles.midiLearning}>
                          <span>Learning MIDI...</span>
                          <button onClick={stopMidiLearning}>Cancel</button>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.colorSliders}>
                      <div className={styles.sliderGroup}>
                        <label>Brightness</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={hsvColor.v}
                          onChange={(e) => {
                            const newV = parseInt(e.target.value);
                            const newHsv = { ...hsvColor, v: newV };
                            setHsvColor(newHsv);
                            const newColor = hsvToRgb(newHsv.h, newHsv.s, newV);
                            applyColorToFixtures(newColor);
                          }}
                          className={styles.brightnessSlider}
                        />
                        <span>{hsvColor.v}%</span>
                        {midiMapping.enabled && (
                          <button
                            onClick={() => startMidiLearning('value')}
                            className={styles.midiLearnButton}
                            title="Learn MIDI CC"
                          >
                            <LucideIcon name="Disc" />
                          </button>
                        )}
                      </div>
                      
                      <div className={styles.sliderGroup}>
                        <label>Color Temperature</label>
                        <input
                          type="range"
                          min="2700"
                          max="6500"
                          value={colorTemperature}
                          onChange={(e) => {
                            const temp = parseInt(e.target.value);
                            setColorTemperature(temp);
                            const tempColor = kelvinToRgb(temp);
                            applyColorToFixtures(tempColor);
                          }}
                          className={styles.temperatureSlider}
                        />
                        <span>{colorTemperature}K</span>
                      </div>
                      
                      <div className={styles.rgbInputs}>
                        <div className={styles.rgbInput}>
                          <label>R</label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={color.r}
                            onChange={(e) => {
                              const newColor = { ...color, r: parseInt(e.target.value) || 0 };
                              applyColorToFixtures(newColor);
                            }}
                          />
                        </div>
                        <div className={styles.rgbInput}>
                          <label>G</label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={color.g}
                            onChange={(e) => {
                              const newColor = { ...color, g: parseInt(e.target.value) || 0 };
                              applyColorToFixtures(newColor);
                            }}
                          />
                        </div>
                        <div className={styles.rgbInput}>
                          <label>B</label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={color.b}
                            onChange={(e) => {
                              const newColor = { ...color, b: parseInt(e.target.value) || 0 };
                              applyColorToFixtures(newColor);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Movement Control Section */}
              {selectionStats.movementCount > 0 && (
                <div className={styles.movementSection}>
                  <h3>
                    <LucideIcon name="Move" />
                    Movement Control ({selectionStats.movementCount} fixtures)
                  </h3>
                  
                  <div className={styles.movementControls}>
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
                            applyMovementToFixtures(newMovement);
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
                            applyMovementToFixtures(newMovement);
                          }}
                          className={styles.numberInput}
                        />
                        {midiMapping.enabled && (
                          <button
                            onClick={() => startMidiLearning('pan')}
                            className={styles.midiLearnButton}
                            title="Learn MIDI CC"
                          >
                            <LucideIcon name="Disc" />
                          </button>
                        )}
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
                            applyMovementToFixtures(newMovement);
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
                            applyMovementToFixtures(newMovement);
                          }}
                          className={styles.numberInput}
                        />
                        {midiMapping.enabled && (
                          <button
                            onClick={() => startMidiLearning('tilt')}
                            className={styles.midiLearnButton}
                            title="Learn MIDI CC"
                          >
                            <LucideIcon name="Disc" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with global controls */}
      <div className={styles.footer}>
        <div className={styles.globalActions}>
          <button
            onClick={blackoutSelectedFixtures}
            className={styles.blackoutButton}
            disabled={selectionStats.rgbCount === 0}
            title="Blackout selected RGB fixtures (Delete)"
          >
            <LucideIcon name="Power" />
            Blackout
          </button>
          
          <button
            onClick={() => applyMovementToFixtures({ pan: 127, tilt: 127 })}
            className={styles.centerButton}
            disabled={selectionStats.movementCount === 0}
            title="Center all selected moving fixtures"
          >
            <LucideIcon name="Target" />
            Center
          </button>
          
          <button
            onClick={() => applyColorToFixtures({ r: 255, g: 255, b: 255 })}
            className={styles.fullWhiteButton}
            disabled={selectionStats.rgbCount === 0}
            title="Full white for selected RGB fixtures"
          >
            <LucideIcon name="Sun" />
            Full White
          </button>
          
          <button
            onClick={() => clearAllFlags('isMuted')}
            className={styles.clearMutesButton}
            disabled={selectionStats.mutedCount === 0}
            title="Clear all mutes"
          >
            <LucideIcon name="Volume2" />
            Clear Mutes
          </button>
          
          <button
            onClick={() => clearAllFlags('isSolo')}
            className={styles.clearSolosButton}
            disabled={selectionStats.soloCount === 0}
            title="Clear all solos"
          >
            <LucideIcon name="VolumeX" />
            Clear Solos
          </button>
        </div>
        
        <div className={styles.viewToggles}>
          <button
            onClick={() => setShowFixtureList(!showFixtureList)}
            className={`${styles.viewToggle} ${showFixtureList ? styles.active : ''}`}
            title="Toggle fixture list"
          >
            <LucideIcon name="List" />
          </button>
          
          <button
            onClick={() => setShowQuickControls(!showQuickControls)}
            className={`${styles.viewToggle} ${showQuickControls ? styles.active : ''}`}
            title="Toggle quick controls"
          >
            <LucideIcon name="Zap" />
          </button>
          
          <button
            onClick={() => setShowMidiMapping(!showMidiMapping)}
            className={`${styles.viewToggle} ${showMidiMapping ? styles.active : ''}`}
            title="Toggle MIDI mapping"
          >
            <LucideIcon name="Music" />
          </button>
        </div>
      </div>

      {/* MIDI Mapping Panel */}
      {showMidiMapping && (
        <div className={styles.midiPanel}>
          <div className={styles.midiHeader}>
            <h3>
              <LucideIcon name="Music" />
              MIDI Mapping
            </h3>
            <button
              onClick={() => setMidiMapping(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`${styles.midiToggle} ${midiMapping.enabled ? styles.active : ''}`}
            >
              {midiMapping.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          
          {midiMapping.enabled && (
            <div className={styles.midiControls}>
              <div className={styles.midiSection}>
                <h4>XY Control</h4>
                <div className={styles.midiMappings}>
                  <div className={styles.midiMapping}>
                    <label>Pan CC:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={midiMapping.xyControl?.panCC || ''}
                      placeholder="Learn..."
                      readOnly={midiMapping.learning}
                    />
                    <button onClick={() => startMidiLearning('pan')}>Learn</button>
                  </div>
                  <div className={styles.midiMapping}>
                    <label>Tilt CC:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={midiMapping.xyControl?.tiltCC || ''}
                      placeholder="Learn..."
                      readOnly={midiMapping.learning}
                    />
                    <button onClick={() => startMidiLearning('tilt')}>Learn</button>
                  </div>
                </div>
              </div>
              
              <div className={styles.midiSection}>
                <h4>Color Control</h4>
                <div className={styles.midiMappings}>
                  <div className={styles.midiMapping}>
                    <label>Hue CC:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={midiMapping.colorControl?.hueCC || ''}
                      placeholder="Learn..."
                      readOnly={midiMapping.learning}
                    />
                    <button onClick={() => startMidiLearning('hue')}>Learn</button>
                  </div>
                  <div className={styles.midiMapping}>
                    <label>Saturation CC:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={midiMapping.colorControl?.saturationCC || ''}
                      placeholder="Learn..."
                      readOnly={midiMapping.learning}
                    />
                    <button onClick={() => startMidiLearning('saturation')}>Learn</button>
                  </div>
                  <div className={styles.midiMapping}>
                    <label>Brightness CC:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={midiMapping.colorControl?.valueCC || ''}
                      placeholder="Learn..."
                      readOnly={midiMapping.learning}
                    />
                    <button onClick={() => startMidiLearning('value')}>Learn</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!isDockable) {
    return (
      <div className={styles.professionalFixtureController}>
        {renderMainInterface()}
      </div>
    );
  }

  return (
    <DockableComponent
      id="professional-fixture-controller"
      component="professional-fixture-controller"
      title="Professional Fixture Controller"
      defaultPosition={{ zone: 'floating', offset: { x: 100, y: 100 } }}
      className={styles.professionalFixtureController}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      width="800px"
      height="600px"
    >
      {renderMainInterface()}
    </DockableComponent>
  );
};

export default ProfessionalFixtureController;
