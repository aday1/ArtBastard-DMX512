import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChromaticEnergyManipulatorSettings } from '../../context/ChromaticEnergyManipulatorContext';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore, Fixture, FixtureFlag } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './UnifiedFixtureController.module.scss';

interface UnifiedFixtureControllerProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isDockable?: boolean;
}

// Enhanced interfaces
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

interface ControlState {
  color: RGBColor;
  hsvColor: HSVColor;
  movement: MovementPosition;
  timestamp: number;
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

// Enhanced interfaces for advanced control
interface FixtureIndividualState {
  [fixtureId: string]: {
    color?: RGBColor;
    movement?: MovementPosition;
    dimmer?: number;
  };
}

interface ColorEffect {
  id: string;
  name: string;
  type: 'strobe' | 'fade' | 'rainbow' | 'chase';
  speed: number;
  active: boolean;
}

type ControlMode = 'collective' | 'independent';
type ViewMode = 'compact' | 'expanded' | 'professional';

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

const UnifiedFixtureController: React.FC<UnifiedFixtureControllerProps> = ({
  isCollapsed = false,
  onCollapsedChange,
  isDockable = true,
}) => {
  // Core state
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [controlMode, setControlMode] = useState<ControlMode>('collective');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  
  // Color and movement state
  const [color, setColor] = useState<RGBColor>({ r: 255, g: 255, b: 255 });
  const [hsvColor, setHsvColor] = useState<HSVColor>({ h: 0, s: 0, v: 100 });
  const [movement, setMovement] = useState<MovementPosition>({ pan: 127, tilt: 127 });
  const [colorTemperature, setColorTemperature] = useState(5600);
  
  // UI state
  const [showFixtureSelect, setShowFixtureSelect] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showSceneManager, setShowSceneManager] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Scene management
  const [scenePresets, setScenePresets] = useState<ScenePreset[]>([]);
  const [newSceneName, setNewSceneName] = useState('');
  
  // History and performance
  const [undoStack, setUndoStack] = useState<ControlState[]>([]);
  const [redoStack, setRedoStack] = useState<ControlState[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Canvas references
  const colorWheelRef = useRef<HTMLCanvasElement>(null);
  const movementCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorSpectrumRef = useRef<HTMLCanvasElement>(null);
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
          rgbChannels.redChannel = dmxAddress - 1;
          break;
        case 'green':
          rgbChannels.greenChannel = dmxAddress - 1;
          break;
        case 'blue':
          rgbChannels.blueChannel = dmxAddress - 1;
          break;
        case 'dimmer':
          // For fixtures without separate RGB channels
          if (!rgbChannels.redChannel) {
            rgbChannels.redChannel = rgbChannels.greenChannel = rgbChannels.blueChannel = dmxAddress - 1;
          }
          break;
        case 'pan':
          movementChannels.panChannel = dmxAddress - 1;
          break;
        case 'tilt':
          movementChannels.tiltChannel = dmxAddress - 1;
          break;
      }
    });
    
    return { rgbChannels, movementChannels };
  }, [fixtures]);

  // Enhanced DMX update with batching for performance
  const updateFixtureValues = useCallback((
    fixtureUpdates: Array<{
      fixtureId: string;
      color?: RGBColor;
      movement?: MovementPosition;
    }>
  ) => {
    if (!isLiveMode) return;

    const now = Date.now();
    if (now - lastUpdateTime < 16) { // 60fps throttling
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        updateFixtureValues(fixtureUpdates);
      }, 16);
      return;
    }

    const channelUpdates: Array<{ channel: number; value: number }> = [];

    fixtureUpdates.forEach(({ fixtureId, color, movement }) => {
      const { rgbChannels, movementChannels } = getFixtureChannels(fixtureId);
      
      // Color updates
      if (color) {
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
      if (movement) {
        if (movementChannels.panChannel !== undefined) {
          channelUpdates.push({ channel: movementChannels.panChannel, value: movement.pan });
        }
        if (movementChannels.tiltChannel !== undefined) {
          channelUpdates.push({ channel: movementChannels.tiltChannel, value: movement.tilt });
        }
      }
    });

    // Batch update for performance
    if (channelUpdates.length > 0) {
      channelUpdates.forEach(({ channel, value }) => {
        setDmxChannelValue(channel, Math.max(0, Math.min(255, value)));
      });
    }

    setLastUpdateTime(now);
  }, [isLiveMode, lastUpdateTime, getFixtureChannels, setDmxChannelValue]);

  // Color control functions
  const applyColorToFixtures = useCallback((newColor: RGBColor) => {
    setColor(newColor);
    
    if (controlMode === 'collective') {
      // Apply same color to all selected fixtures
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
      // Apply same movement to all selected fixtures
      const updates = selectedFixtures.map(fixtureId => ({
        fixtureId,
        movement: newMovement
      }));
      updateFixtureValues(updates);
    }
  }, [controlMode, selectedFixtures, updateFixtureValues]);

  // Scene management
  const saveCurrentScene = useCallback(() => {
    if (!newSceneName.trim() || selectedFixtures.length === 0) return;

    const scene: ScenePreset = {
      id: `scene_${Date.now()}`,
      name: newSceneName.trim(),
      fixtures: {},
      createdAt: Date.now()
    };

    selectedFixtures.forEach(fixtureId => {
      const { rgbChannels, movementChannels } = getFixtureChannels(fixtureId);
      const fixtureState: any = {};
      
      // Save current color values
      if (rgbChannels.redChannel !== undefined) {
        fixtureState.color = {
          r: getDmxChannelValue(rgbChannels.redChannel) || 0,
          g: getDmxChannelValue(rgbChannels.greenChannel || 0) || 0,
          b: getDmxChannelValue(rgbChannels.blueChannel || 0) || 0
        };
      }
      
      // Save current movement values
      if (movementChannels.panChannel !== undefined) {
        fixtureState.movement = {
          pan: getDmxChannelValue(movementChannels.panChannel) || 127,
          tilt: getDmxChannelValue(movementChannels.tiltChannel || 0) || 127
        };
      }
      
      scene.fixtures[fixtureId] = fixtureState;
    });

    setScenePresets(prev => [...prev, scene]);
    setNewSceneName('');
  }, [newSceneName, selectedFixtures, getFixtureChannels, getDmxChannelValue]);

  const recallScene = useCallback((scene: ScenePreset) => {
    const updates: Array<{
      fixtureId: string;
      color?: RGBColor;
      movement?: MovementPosition;
    }> = [];

    Object.entries(scene.fixtures).forEach(([fixtureId, state]) => {
      if (selectedFixtures.includes(fixtureId) || selectedFixtures.length === 0) {
        updates.push({
          fixtureId,
          color: state.color,
          movement: state.movement
        });
      }
    });

    updateFixtureValues(updates);
  }, [selectedFixtures, updateFixtureValues]);

  // Enhanced selection functions
  const selectAllRgbFixtures = useCallback(() => {
    const rgbFixtures = fixtures.filter(fixture =>
      fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type))
    );
    setSelectedFixtures(rgbFixtures.map(f => f.id));
  }, [fixtures]);

  const selectAllMovementFixtures = useCallback(() => {
    const movementFixtures = fixtures.filter(fixture =>
      fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type))
    );
    setSelectedFixtures(movementFixtures.map(f => f.id));
  }, [fixtures]);
  // Color wheel interaction with enhanced drag support
  const handleColorWheelClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    handleColorWheelInteraction(event);
  }, [handleColorWheelInteraction]);
  // Enhanced movement canvas interaction with drag support
  const [isDraggingMovement, setIsDraggingMovement] = useState(false);
  const [isDraggingColor, setIsDraggingColor] = useState(false);

  const handleMovementCanvasInteraction = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in event) {
      if (event.touches.length === 0) return;
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

  const handleMovementMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingMovement(true);
    handleMovementCanvasInteraction(event);
  }, [handleMovementCanvasInteraction]);

  const handleMovementMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingMovement) {
      handleMovementCanvasInteraction(event);
    }
  }, [isDraggingMovement, handleMovementCanvasInteraction]);

  const handleMovementMouseUp = useCallback(() => {
    setIsDraggingMovement(false);
  }, []);

  // Enhanced color wheel interaction with drag support
  const handleColorWheelInteraction = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in event) {
      if (event.touches.length === 0) return;
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
      const hue = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
      const saturation = Math.min(100, (distance / radius) * 100);
      
      const newHsv = { ...hsvColor, h: hue, s: saturation };
      setHsvColor(newHsv);
      
      const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      applyColorToFixtures(newColor);
    }
  }, [hsvColor, applyColorToFixtures]);

  const handleColorWheelMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingColor(true);
    handleColorWheelInteraction(event);
  }, [handleColorWheelInteraction]);

  const handleColorWheelMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingColor) {
      handleColorWheelInteraction(event);
    }
  }, [isDraggingColor, handleColorWheelInteraction]);

  const handleColorWheelMouseUp = useCallback(() => {
    setIsDraggingColor(false);
  }, []);

  // Filter fixtures based on search
  const filteredFixtures = fixtures.filter(fixture =>
    fixture.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate selection stats
  const selectionStats = {
    total: selectedFixtures.length,
    rgbCount: selectedFixtures.filter(id => {
      const fixture = fixtures.find(f => f.id === id);
      return fixture?.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
    }).length,
    movementCount: selectedFixtures.filter(id => {
      const fixture = fixtures.find(f => f.id === id);
      return fixture?.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
    }).length
  };
  // Add global mouse event listeners for drag operations
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDraggingMovement) {
        const canvas = movementCanvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
            const newMovement = {
              pan: Math.max(0, Math.min(255, Math.round((x / canvas.width) * 255))),
              tilt: Math.max(0, Math.min(255, Math.round(((canvas.height - y) / canvas.height) * 255)))
            };
            applyMovementToFixtures(newMovement);
          }
        }
      }
      
      if (isDraggingColor) {
        const canvas = colorWheelRef.current;
        if (canvas) {
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
            const hue = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
            const saturation = Math.min(100, (distance / radius) * 100);
            
            const newHsv = { ...hsvColor, h: hue, s: saturation };
            setHsvColor(newHsv);
            
            const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
            applyColorToFixtures(newColor);
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingMovement(false);
      setIsDraggingColor(false);
    };

    if (isDraggingMovement || isDraggingColor) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingMovement, isDraggingColor, hsvColor, applyMovementToFixtures, applyColorToFixtures]);

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
        const saturation = (r / radius) * 100;
        const rgb = hsvToRgb(angle, saturation, 100);
        
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        const x = centerX + r * Math.cos(angle * Math.PI / 180);
        const y = centerY + r * Math.sin(angle * Math.PI / 180);
        
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Draw current color indicator
    const currentRadius = (hsvColor.s / 100) * radius;
    const currentAngle = hsvColor.h * Math.PI / 180;
    const indicatorX = centerX + currentRadius * Math.cos(currentAngle);
    const indicatorY = centerY + currentRadius * Math.sin(currentAngle);

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 6, 0, 2 * Math.PI);
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
    
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * canvas.width;
      const y = (i / 4) * canvas.height;
      
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
    ctx.setLineDash([3, 3]);
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
    
    ctx.fillStyle = '#007acc';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
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

  const renderMainInterface = () => (
    <div className={styles.container}>
      {/* Header with mode controls */}
      <div className={styles.header}>
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeButton} ${controlMode === 'collective' ? styles.active : ''}`}
            onClick={() => setControlMode('collective')}
            title="Control all selected fixtures together"
          >
            <LucideIcon name="Users" />
            Collective
          </button>
          <button
            className={`${styles.modeButton} ${controlMode === 'independent' ? styles.active : ''}`}
            onClick={() => setControlMode('independent')}
            title="Control fixtures independently"
          >
            <LucideIcon name="User" />
            Independent
          </button>
        </div>
        
        <div className={styles.viewModeSelector}>
          <button
            className={`${styles.viewButton} ${viewMode === 'compact' ? styles.active : ''}`}
            onClick={() => setViewMode('compact')}
            title="Compact view"
          >
            <LucideIcon name="Minimize2" />
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'expanded' ? styles.active : ''}`}
            onClick={() => setViewMode('expanded')}
            title="Expanded view"
          >
            <LucideIcon name="Maximize2" />
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'professional' ? styles.active : ''}`}
            onClick={() => setViewMode('professional')}
            title="Professional view"
          >
            <LucideIcon name="Layout" />
          </button>
        </div>
      </div>

      {/* Fixture selection */}
      <div className={styles.fixtureSection}>
        <button 
          className={styles.fixtureSelector}
          onClick={() => setShowFixtureSelect(!showFixtureSelect)}
        >
          <LucideIcon name="Target" />
          <span className={styles.fixtureName}>
            {selectedFixtures.length === 0 
              ? 'Select fixtures' 
              : `${selectedFixtures.length} fixture${selectedFixtures.length === 1 ? '' : 's'} selected`}
          </span>
          <div className={styles.selectionStats}>
            {selectionStats.rgbCount > 0 && (
              <span className={styles.statBadge} title="RGB fixtures">
                <LucideIcon name="Palette" />
                {selectionStats.rgbCount}
              </span>
            )}
            {selectionStats.movementCount > 0 && (
              <span className={styles.statBadge} title="Movement fixtures">
                <LucideIcon name="Move" />
                {selectionStats.movementCount}
              </span>
            )}
          </div>
          <LucideIcon name={showFixtureSelect ? "ChevronUp" : "ChevronDown"} />
        </button>

        {showFixtureSelect && (
          <div className={styles.fixtureDropdown}>
            {/* Search */}
            <div className={styles.searchSection}>
              <LucideIcon name="Search" />
              <input
                type="text"
                placeholder="Search fixtures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Quick selection */}
            <div className={styles.quickSelection}>
              <button onClick={() => setSelectedFixtures(filteredFixtures.map(f => f.id))}>
                <LucideIcon name="CheckSquare" />
                Select All
              </button>
              <button onClick={selectAllRgbFixtures}>
                <LucideIcon name="Palette" />
                RGB Only
              </button>
              <button onClick={selectAllMovementFixtures}>
                <LucideIcon name="Move" />
                Movement Only
              </button>
              <button onClick={() => setSelectedFixtures([])}>
                <LucideIcon name="Square" />
                Clear
              </button>
            </div>

            {/* Fixture list */}
            <div className={styles.fixtureList}>
              {filteredFixtures.map(fixture => {
                const isSelected = selectedFixtures.includes(fixture.id);
                const hasRgb = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
                
                return (
                  <div
                    key={fixture.id}
                    className={`${styles.fixtureOption} ${isSelected ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedFixtures(prev =>
                        prev.includes(fixture.id)
                          ? prev.filter(id => id !== fixture.id)
                          : [...prev, fixture.id]
                      );
                    }}
                  >
                    <div className={styles.checkbox}>
                      {isSelected && <LucideIcon name="Check" />}
                    </div>
                    <div className={styles.fixtureInfo}>
                      <span className={styles.name}>{fixture.name}</span>
                      <div className={styles.capabilities}>
                        {hasRgb && <LucideIcon name="Palette" title="RGB" />}
                        {hasMovement && <LucideIcon name="Move" title="Pan/Tilt" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedFixtures.length > 0 && (
        <>
          {/* Control interface based on view mode */}
          {viewMode === 'compact' && renderCompactControls()}
          {viewMode === 'expanded' && renderExpandedControls()}
          {viewMode === 'professional' && renderProfessionalControls()}
          
          {/* Scene management */}
          <div className={styles.sceneSection}>
            <button
              className={styles.sceneToggle}
              onClick={() => setShowSceneManager(!showSceneManager)}
            >
              <LucideIcon name="Bookmark" />
              Scenes
              <LucideIcon name={showSceneManager ? "ChevronUp" : "ChevronDown"} />
            </button>
            
            {showSceneManager && (
              <div className={styles.sceneManager}>
                <div className={styles.saveScene}>
                  <input
                    type="text"
                    placeholder="Scene name..."
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    className={styles.sceneInput}
                  />
                  <button
                    onClick={saveCurrentScene}
                    disabled={!newSceneName.trim()}
                    className={styles.saveButton}
                  >
                    <LucideIcon name="Save" />
                    Save
                  </button>
                </div>
                
                <div className={styles.sceneList}>
                  {scenePresets.map(scene => (
                    <div key={scene.id} className={styles.sceneItem}>
                      <button
                        onClick={() => recallScene(scene)}
                        className={styles.recallButton}
                      >
                        <LucideIcon name="Play" />
                        {scene.name}
                      </button>
                      <button
                        onClick={() => setScenePresets(prev => prev.filter(s => s.id !== scene.id))}
                        className={styles.deleteButton}
                      >
                        <LucideIcon name="Trash2" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderCompactControls = () => (
    <div className={styles.compactControls}>
      {selectionStats.rgbCount > 0 && (
        <div className={styles.colorControl}>
          <div className={styles.colorPresets}>
            {[
              { name: 'Red', r: 255, g: 0, b: 0 },
              { name: 'Green', r: 0, g: 255, b: 0 },
              { name: 'Blue', r: 0, g: 0, b: 255 },
              { name: 'White', r: 255, g: 255, b: 255 },
              { name: 'Off', r: 0, g: 0, b: 0 }
            ].map(preset => (
              <button
                key={preset.name}
                className={styles.colorPreset}
                style={{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }}
                onClick={() => applyColorToFixtures(preset)}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )}
      
      {selectionStats.movementCount > 0 && (
        <div className={styles.movementControl}>          <canvas
            ref={movementCanvasRef}
            width={100}
            height={100}
            className={styles.movementCanvas}
            onMouseDown={handleMovementMouseDown}
            onMouseMove={handleMovementMouseMove}
            onMouseUp={handleMovementMouseUp}
            onClick={handleMovementCanvasInteraction}
            style={{ cursor: isDraggingMovement ? 'grabbing' : 'grab' }}
          />
        </div>
      )}
    </div>
  );

  const renderExpandedControls = () => (
    <div className={styles.expandedControls}>
      {selectionStats.rgbCount > 0 && (
        <div className={styles.colorSection}>
          <h3>Color Control</h3>
          <div className={styles.colorControls}>            <canvas
              ref={colorWheelRef}
              width={200}
              height={200}
              className={styles.colorWheel}
              onMouseDown={handleColorWheelMouseDown}
              onMouseMove={handleColorWheelMouseMove}
              onMouseUp={handleColorWheelMouseUp}
              onClick={handleColorWheelClick}
              style={{ cursor: isDraggingColor ? 'grabbing' : 'grab' }}
            /><div className={styles.colorSliders}>
              {/* RGB Sliders */}
              <div className={styles.sliderGroup}>
                <label>Red: {color.r}</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => {
                    const newColor = { ...color, r: parseInt(e.target.value) };
                    applyColorToFixtures(newColor);
                  }}
                  className={styles.colorSlider}
                  style={{ '--slider-color': '#ff4444' } as React.CSSProperties}
                />
              </div>
              <div className={styles.sliderGroup}>
                <label>Green: {color.g}</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => {
                    const newColor = { ...color, g: parseInt(e.target.value) };
                    applyColorToFixtures(newColor);
                  }}
                  className={styles.colorSlider}
                  style={{ '--slider-color': '#44ff44' } as React.CSSProperties}
                />
              </div>
              <div className={styles.sliderGroup}>
                <label>Blue: {color.b}</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => {
                    const newColor = { ...color, b: parseInt(e.target.value) };
                    applyColorToFixtures(newColor);
                  }}
                  className={styles.colorSlider}
                  style={{ '--slider-color': '#4444ff' } as React.CSSProperties}
                />
              </div>

              {/* HSV Sliders */}
              <div className={styles.sliderGroup}>
                <label>Hue: {Math.round(hsvColor.h)}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsvColor.h}
                  onChange={(e) => {
                    const newHsv = { ...hsvColor, h: parseInt(e.target.value) };
                    setHsvColor(newHsv);
                    const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
                    applyColorToFixtures(newColor);
                  }}
                  className={styles.hueSlider}
                />
              </div>
              <div className={styles.sliderGroup}>
                <label>Saturation: {Math.round(hsvColor.s)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsvColor.s}
                  onChange={(e) => {
                    const newHsv = { ...hsvColor, s: parseInt(e.target.value) };
                    setHsvColor(newHsv);
                    const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
                    applyColorToFixtures(newColor);
                  }}
                  className={styles.colorSlider}
                />
              </div>
              <div className={styles.sliderGroup}>
                <label>Value: {Math.round(hsvColor.v)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsvColor.v}
                  onChange={(e) => {
                    const newHsv = { ...hsvColor, v: parseInt(e.target.value) };
                    setHsvColor(newHsv);
                    const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
                    applyColorToFixtures(newColor);
                  }}
                  className={styles.colorSlider}
                />
              </div>

              {/* Color Temperature */}
              <div className={styles.sliderGroup}>
                <label>Temperature: {colorTemperature}K</label>
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
              </div>

              {/* Color Presets */}
              <div className={styles.colorPresets}>
                <h4>Color Presets</h4>
                <div className={styles.presetGrid}>
                  {[
                    { name: 'Red', r: 255, g: 0, b: 0 },
                    { name: 'Green', r: 0, g: 255, b: 0 },
                    { name: 'Blue', r: 0, g: 0, b: 255 },
                    { name: 'Cyan', r: 0, g: 255, b: 255 },
                    { name: 'Magenta', r: 255, g: 0, b: 255 },
                    { name: 'Yellow', r: 255, g: 255, b: 0 },
                    { name: 'White', r: 255, g: 255, b: 255 },
                    { name: 'Warm White', r: 255, g: 220, b: 170 },
                    { name: 'Cool White', r: 170, g: 220, b: 255 },
                    { name: 'Off', r: 0, g: 0, b: 0 }
                  ].map(preset => (
                    <button
                      key={preset.name}
                      className={styles.colorPreset}
                      style={{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }}
                      onClick={() => applyColorToFixtures(preset)}
                      title={preset.name}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Color Preview */}
              <div className={styles.colorPreview}>
                <div 
                  className={styles.currentColor}
                  style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                />
                <span>RGB({color.r}, {color.g}, {color.b})</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectionStats.movementCount > 0 && (
        <div className={styles.movementSection}>
          <h3>Movement Control</h3>
          <div className={styles.movementControls}>            <canvas
              ref={movementCanvasRef}
              width={150}
              height={150}
              className={styles.movementCanvas}
              onMouseDown={handleMovementMouseDown}
              onMouseMove={handleMovementMouseMove}
              onMouseUp={handleMovementMouseUp}
              onClick={handleMovementCanvasInteraction}
              style={{ cursor: isDraggingMovement ? 'grabbing' : 'grab' }}
            /><div className={styles.movementSliders}>
              <div className={styles.sliderGroup}>
                <label>Pan: {movement.pan}</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={movement.pan}
                  onChange={(e) => {
                    const newMovement = { ...movement, pan: parseInt(e.target.value) };
                    applyMovementToFixtures(newMovement);
                  }}
                  className={styles.movementSlider}
                />
              </div>
              <div className={styles.sliderGroup}>
                <label>Tilt: {movement.tilt}</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={movement.tilt}
                  onChange={(e) => {
                    const newMovement = { ...movement, tilt: parseInt(e.target.value) };
                    applyMovementToFixtures(newMovement);
                  }}
                  className={styles.movementSlider}
                />
              </div>

              {/* Movement Presets */}
              <div className={styles.movementPresets}>
                <h4>Movement Presets</h4>
                <div className={styles.presetGrid}>
                  <button onClick={() => applyMovementToFixtures({ pan: 127, tilt: 127 })}>
                    <LucideIcon name="Target" />
                    Center
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 0, tilt: 127 })}>
                    <LucideIcon name="ArrowLeft" />
                    Left
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 255, tilt: 127 })}>
                    <LucideIcon name="ArrowRight" />
                    Right
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 127, tilt: 255 })}>
                    <LucideIcon name="ArrowUp" />
                    Up
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 127, tilt: 0 })}>
                    <LucideIcon name="ArrowDown" />
                    Down
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 0, tilt: 255 })}>
                    <LucideIcon name="ArrowUpLeft" />
                    Up-Left
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 255, tilt: 255 })}>
                    <LucideIcon name="ArrowUpRight" />
                    Up-Right
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 0, tilt: 0 })}>
                    <LucideIcon name="ArrowDownLeft" />
                    Down-Left
                  </button>
                  <button onClick={() => applyMovementToFixtures({ pan: 255, tilt: 0 })}>
                    <LucideIcon name="ArrowDownRight" />
                    Down-Right
                  </button>
                </div>
              </div>

              {/* Fine Movement Controls */}
              <div className={styles.fineMovement}>
                <h4>Fine Adjustment</h4>
                <div className={styles.fineControls}>
                  <button onClick={() => applyMovementToFixtures({ ...movement, pan: Math.max(0, movement.pan - 1) })}>
                    <LucideIcon name="Minus" />
                    Pan -
                  </button>
                  <button onClick={() => applyMovementToFixtures({ ...movement, pan: Math.min(255, movement.pan + 1) })}>
                    <LucideIcon name="Plus" />
                    Pan +
                  </button>
                  <button onClick={() => applyMovementToFixtures({ ...movement, tilt: Math.max(0, movement.tilt - 1) })}>
                    <LucideIcon name="Minus" />
                    Tilt -
                  </button>
                  <button onClick={() => applyMovementToFixtures({ ...movement, tilt: Math.min(255, movement.tilt + 1) })}>
                    <LucideIcon name="Plus" />
                    Tilt +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  const renderProfessionalControls = () => (
    <div className={styles.professionalControls}>
      <div className={styles.controlGrid}>
        {selectionStats.rgbCount > 0 && (
          <div className={styles.colorSection}>
            <h3>
              <LucideIcon name="Palette" />
              Color Control ({selectionStats.rgbCount} fixtures)
            </h3>
            <div className={styles.colorProfessional}>
              <div className={styles.colorWheelContainer}>                <canvas
                  ref={colorWheelRef}
                  width={180}
                  height={180}
                  className={styles.colorWheel}
                  onMouseDown={handleColorWheelMouseDown}
                  onMouseMove={handleColorWheelMouseMove}
                  onMouseUp={handleColorWheelMouseUp}
                  onClick={handleColorWheelClick}
                  style={{ cursor: isDraggingColor ? 'grabbing' : 'grab' }}
                />
                <div className={styles.wheelLabels}>
                  <span>Click or drag on wheel</span>
                </div>
              </div>
              
              <div className={styles.colorControls}>
                <div className={styles.rgbControls}>
                  <h4>RGB Controls</h4>
                  <div className={styles.sliderGroup}>
                    <label>Red</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={color.r}
                      onChange={(e) => {
                        const newColor = { ...color, r: parseInt(e.target.value) };
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.redSlider}
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={color.r}
                      onChange={(e) => {
                        const newColor = { ...color, r: parseInt(e.target.value) || 0 };
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.numberInput}
                    />
                  </div>
                  <div className={styles.sliderGroup}>
                    <label>Green</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={color.g}
                      onChange={(e) => {
                        const newColor = { ...color, g: parseInt(e.target.value) };
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.greenSlider}
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={color.g}
                      onChange={(e) => {
                        const newColor = { ...color, g: parseInt(e.target.value) || 0 };
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.numberInput}
                    />
                  </div>
                  <div className={styles.sliderGroup}>
                    <label>Blue</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={color.b}
                      onChange={(e) => {
                        const newColor = { ...color, b: parseInt(e.target.value) };
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.blueSlider}
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={color.b}
                      onChange={(e) => {
                        const newColor = { ...color, b: parseInt(e.target.value) || 0 };
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.numberInput}
                    />
                  </div>
                </div>
                
                <div className={styles.hsvControls}>
                  <h4>HSV Controls</h4>
                  <div className={styles.sliderGroup}>
                    <label>Hue</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hsvColor.h}
                      onChange={(e) => {
                        const newHsv = { ...hsvColor, h: parseInt(e.target.value) };
                        setHsvColor(newHsv);
                        const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.hueSlider}
                    />
                    <span>{Math.round(hsvColor.h)}°</span>
                  </div>
                  <div className={styles.sliderGroup}>
                    <label>Saturation</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hsvColor.s}
                      onChange={(e) => {
                        const newHsv = { ...hsvColor, s: parseInt(e.target.value) };
                        setHsvColor(newHsv);
                        const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.saturationSlider}
                    />
                    <span>{Math.round(hsvColor.s)}%</span>
                  </div>
                  <div className={styles.sliderGroup}>
                    <label>Value</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hsvColor.v}
                      onChange={(e) => {
                        const newHsv = { ...hsvColor, v: parseInt(e.target.value) };
                        setHsvColor(newHsv);
                        const newColor = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.valueSlider}
                    />
                    <span>{Math.round(hsvColor.v)}%</span>
                  </div>
                </div>
                
                <div className={styles.temperatureControl}>
                  <h4>Color Temperature</h4>
                  <div className={styles.sliderGroup}>
                    <label>Kelvin</label>
                    <input
                      type="range"
                      min="2700"
                      max="8000"
                      value={colorTemperature}
                      onChange={(e) => {
                        const kelvin = parseInt(e.target.value);
                        setColorTemperature(kelvin);
                        const newColor = kelvinToRgb(kelvin);
                        applyColorToFixtures(newColor);
                      }}
                      className={styles.temperatureSlider}
                    />
                    <span>{colorTemperature}K</span>
                  </div>
                  <div className={styles.temperaturePresets}>
                    <button onClick={() => { const tc = 2700; setColorTemperature(tc); applyColorToFixtures(kelvinToRgb(tc)); }}>
                      Warm
                    </button>
                    <button onClick={() => { const tc = 4000; setColorTemperature(tc); applyColorToFixtures(kelvinToRgb(tc)); }}>
                      Neutral
                    </button>
                    <button onClick={() => { const tc = 5600; setColorTemperature(tc); applyColorToFixtures(kelvinToRgb(tc)); }}>
                      Daylight
                    </button>
                    <button onClick={() => { const tc = 7000; setColorTemperature(tc); applyColorToFixtures(kelvinToRgb(tc)); }}>
                      Cool
                    </button>
                  </div>
                </div>

                <div className={styles.colorPreview}>
                  <div 
                    className={styles.currentColor}
                    style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                  />
                  <div className={styles.colorInfo}>
                    <span>RGB({color.r}, {color.g}, {color.b})</span>
                    <span>HSV({Math.round(hsvColor.h)}°, {Math.round(hsvColor.s)}%, {Math.round(hsvColor.v)}%)</span>
                    <span>#{color.r.toString(16).padStart(2, '0')}{color.g.toString(16).padStart(2, '0')}{color.b.toString(16).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectionStats.movementCount > 0 && (
          <div className={styles.movementSection}>
            <h3>
              <LucideIcon name="Move" />
              Movement Control ({selectionStats.movementCount} fixtures)
            </h3>
            <div className={styles.movementProfessional}>
              <div className={styles.xyPadContainer}>                <canvas
                  ref={movementCanvasRef}
                  width={200}
                  height={200}
                  className={styles.movementCanvas}
                  onMouseDown={handleMovementMouseDown}
                  onMouseMove={handleMovementMouseMove}
                  onMouseUp={handleMovementMouseUp}
                  onClick={handleMovementCanvasInteraction}
                  style={{ cursor: isDraggingMovement ? 'grabbing' : 'grab' }}
                />
                <div className={styles.xyLabels}>
                  <span className={styles.topLabel}>Tilt +</span>
                  <span className={styles.rightLabel}>Pan +</span>
                  <span className={styles.bottomLabel}>Tilt -</span>
                  <span className={styles.leftLabel}>Pan -</span>
                </div>
              </div>
              
              <div className={styles.movementControls}>
                <div className={styles.movementSliders}>
                  <div className={styles.sliderGroup}>
                    <label>Pan</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={movement.pan}
                      onChange={(e) => {
                        const newMovement = { ...movement, pan: parseInt(e.target.value) };
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
                        const newMovement = { ...movement, pan: parseInt(e.target.value) || 0 };
                        applyMovementToFixtures(newMovement);
                      }}
                      className={styles.numberInput}
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
                        const newMovement = { ...movement, tilt: parseInt(e.target.value) };
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
                        const newMovement = { ...movement, tilt: parseInt(e.target.value) || 0 };
                        applyMovementToFixtures(newMovement);
                      }}
                      className={styles.numberInput}
                    />
                  </div>
                </div>
                
                <div className={styles.movementPresets}>
                  <h4>Movement Presets</h4>
                  <div className={styles.presetGrid}>
                    <button onClick={() => applyMovementToFixtures({ pan: 127, tilt: 127 })}>
                      <LucideIcon name="Target" />
                      Center
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 0, tilt: 127 })}>
                      <LucideIcon name="ArrowLeft" />
                      Left
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 255, tilt: 127 })}>
                      <LucideIcon name="ArrowRight" />
                      Right
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 127, tilt: 255 })}>
                      <LucideIcon name="ArrowUp" />
                      Up
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 127, tilt: 0 })}>
                      <LucideIcon name="ArrowDown" />
                      Down
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 0, tilt: 255 })}>
                      <LucideIcon name="CornerUpLeft" />
                      Up-Left
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 255, tilt: 255 })}>
                      <LucideIcon name="CornerUpRight" />
                      Up-Right
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 0, tilt: 0 })}>
                      <LucideIcon name="CornerDownLeft" />
                      Down-Left
                    </button>
                    <button onClick={() => applyMovementToFixtures({ pan: 255, tilt: 0 })}>
                      <LucideIcon name="CornerDownRight" />
                      Down-Right
                    </button>
                  </div>
                </div>

                <div className={styles.fineMovement}>
                  <h4>Fine Adjustment</h4>
                  <div className={styles.fineGrid}>
                    <div className={styles.fineRow}>
                      <button onClick={() => applyMovementToFixtures({ ...movement, pan: Math.max(0, movement.pan - 10) })}>
                        <LucideIcon name="ChevronsLeft" />
                        -10
                      </button>
                      <button onClick={() => applyMovementToFixtures({ ...movement, pan: Math.max(0, movement.pan - 1) })}>
                        <LucideIcon name="ChevronLeft" />
                        -1
                      </button>
                      <span>Pan</span>
                      <button onClick={() => applyMovementToFixtures({ ...movement, pan: Math.min(255, movement.pan + 1) })}>
                        <LucideIcon name="ChevronRight" />
                        +1
                      </button>
                      <button onClick={() => applyMovementToFixtures({ ...movement, pan: Math.min(255, movement.pan + 10) })}>
                        <LucideIcon name="ChevronsRight" />
                        +10
                      </button>
                    </div>
                    <div className={styles.fineRow}>
                      <button onClick={() => applyMovementToFixtures({ ...movement, tilt: Math.max(0, movement.tilt - 10) })}>
                        <LucideIcon name="ChevronsDown" />
                        -10
                      </button>
                      <button onClick={() => applyMovementToFixtures({ ...movement, tilt: Math.max(0, movement.tilt - 1) })}>
                        <LucideIcon name="ChevronDown" />
                        -1
                      </button>
                      <span>Tilt</span>
                      <button onClick={() => applyMovementToFixtures({ ...movement, tilt: Math.min(255, movement.tilt + 1) })}>
                        <LucideIcon name="ChevronUp" />
                        +1
                      </button>
                      <button onClick={() => applyMovementToFixtures({ ...movement, tilt: Math.min(255, movement.tilt + 10) })}>
                        <LucideIcon name="ChevronsUp" />
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.globalControls}>
        <div className={styles.modeToggle}>
          <label>
            <input
              type="checkbox"
              checked={isLiveMode}
              onChange={(e) => setIsLiveMode(e.target.checked)}
            />
            <LucideIcon name={isLiveMode ? "Zap" : "ZapOff"} />
            Live Mode
          </label>
        </div>

        <div className={styles.globalActions}>
          <button 
            onClick={() => {
              if (selectionStats.rgbCount > 0) {
                applyColorToFixtures({ r: 0, g: 0, b: 0 });
              }
            }}
            className={styles.blackoutButton}
            disabled={selectionStats.rgbCount === 0}
          >
            <LucideIcon name="Power" />
            Blackout RGB
          </button>
          
          <button 
            onClick={() => {
              if (selectionStats.movementCount > 0) {
                applyMovementToFixtures({ pan: 127, tilt: 127 });
              }
            }}
            className={styles.centerButton}
            disabled={selectionStats.movementCount === 0}
          >
            <LucideIcon name="Target" />
            Center All
          </button>
          
          <button 
            onClick={() => {
              if (selectionStats.rgbCount > 0) {
                applyColorToFixtures({ r: 255, g: 255, b: 255 });
              }
            }}
            className={styles.fullOnButton}
            disabled={selectionStats.rgbCount === 0}
          >
            <LucideIcon name="Sun" />
            Full White
          </button>
        </div>
      </div>
    </div>
  );

  if (!isDockable) {
    return (
      <div className={styles.unifiedFixtureController}>
        {renderMainInterface()}
      </div>
    );
  }

  return (
    <DockableComponent
      id="unified-fixture-controller"
      component="unified-fixture-controller"
      title="Unified Fixture Controller"
      defaultPosition={{ zone: 'floating', offset: { x: 300, y: 100 } }}
      className={styles.unifiedFixtureController}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      width="400px"
      height="auto"
    >
      {renderMainInterface()}
    </DockableComponent>
  );
};

export default UnifiedFixtureController;
