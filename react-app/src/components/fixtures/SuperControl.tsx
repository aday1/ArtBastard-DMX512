import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import { SuperControlExportOptions, exportSuperControlToToscFile } from '../../utils/touchoscExporter';
import styles from './SuperControl.module.scss';

interface SuperControlProps {
  isDockable?: boolean;
}

type SelectionMode = 'channels' | 'fixtures' | 'groups' | 'capabilities';

interface FixtureCapability {
  type: string;
  fixtures: string[];
}

const SuperControl: React.FC<SuperControlProps> = ({ isDockable = false }) => {
  const { 
    fixtures, 
    groups,
    selectedChannels,
    getDmxChannelValue, 
    setDmxChannelValue,    // Smooth DMX Functions
    smoothDmxEnabled,
    // setSmoothDmxChannelValue, // TODO: Implement these functions
    // enableSmoothDmxMode,
    // flushSmoothDmxUpdates,
    // Autopilot Track System
    autopilotTrackEnabled,
    autopilotTrackType,
    autopilotTrackPosition,
    autopilotTrackSize,
    autopilotTrackSpeed,
    autopilotTrackCenterX,
    autopilotTrackCenterY,
    autopilotTrackAutoPlay,
    setAutopilotTrackEnabled,
    setAutopilotTrackType,
    setAutopilotTrackPosition,
    setAutopilotTrackSize,
    setAutopilotTrackSpeed,
    setAutopilotTrackCenter,
    setAutopilotTrackAutoPlay,
    updatePanTiltFromTrack
  } = useStore();

  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('channels');
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);

  // Control values state  const [dimmer, setDimmer] = useState(255);  // Basic Control State
  const [dimmer, setDimmer] = useState(255);
  const [panValue, setPanValue] = useState(127);
  const [tiltValue, setTiltValue] = useState(127);
  const [red, setRed] = useState(255);
  const [green, setGreen] = useState(255);
  const [blue, setBlue] = useState(255);
  const [gobo, setGobo] = useState(0);
  const [shutter, setShutter] = useState(255);
  const [strobe, setStrobe] = useState(0);
  const [lamp, setLamp] = useState(255);
  const [reset, setReset] = useState(0);

  // Enhanced Movement Controls
  const [focus, setFocus] = useState(127);
  const [zoom, setZoom] = useState(127);
  const [iris, setIris] = useState(255);
  const [prism, setPrism] = useState(0);
  const [colorWheel, setColorWheel] = useState(0);
  const [goboRotation, setGoboRotation] = useState(127);
  const [gobo2, setGobo2] = useState(0);
  const [frost, setFrost] = useState(0);
  const [macro, setMacro] = useState(0);
  const [speed, setSpeed] = useState(127);

  // XY Pad state
  const [panTiltXY, setPanTiltXY] = useState({ x: 50, y: 50 });
  const xyPadRef = useRef<HTMLDivElement>(null);
  const [isDraggingXY, setIsDraggingXY] = useState(false);

  // Color wheel state
  const [colorHue, setColorHue] = useState(0);
  const [colorSaturation, setColorSaturation] = useState(100);
  const colorWheelRef = useRef<HTMLDivElement>(null);
  const [isDraggingColor, setIsDraggingColor] = useState(false);

  // MIDI Learn state
  const [midiLearnTarget, setMidiLearnTarget] = useState<string | null>(null);
  const [oscAddresses, setOscAddresses] = useState<Record<string, string>>({
    dimmer: '/supercontrol/dimmer',
    pan: '/supercontrol/pan',    tilt: '/supercontrol/tilt',
    red: '/supercontrol/red',
    green: '/supercontrol/green',
    blue: '/supercontrol/blue',
    gobo: '/supercontrol/gobo',
    shutter: '/supercontrol/shutter',
    strobe: '/supercontrol/strobe',
    lamp: '/supercontrol/lamp',
    reset: '/supercontrol/reset',
    focus: '/supercontrol/focus',
    zoom: '/supercontrol/zoom',
    iris: '/supercontrol/iris',
    prism: '/supercontrol/prism',
    colorWheel: '/supercontrol/colorwheel',
    goboRotation: '/supercontrol/gobo/rotation',
    gobo2: '/supercontrol/gobo2',
    frost: '/supercontrol/frost',
    macro: '/supercontrol/macro',
    speed: '/supercontrol/speed',
    panTiltXY: '/supercontrol/pantilt/xy',
    autopilotEnable: '/supercontrol/autopilot/enable',
    autopilotSpeed: '/supercontrol/autopilot/speed',
    sceneNext: '/supercontrol/scene/next',
    scenePrev: '/supercontrol/scene/prev',
    sceneSave: '/supercontrol/scene/save',
  });

  // Enhanced MIDI Learn state with range support
  const [midiMappings, setMidiMappings] = useState<Record<string, {
    channel?: number;
    note?: number;
    cc?: number;
    minValue: number;
    maxValue: number;
    oscAddress?: string;
  }>>({});

  // Scene management state
  const [scenes, setScenes] = useState<Array<{
    id: string;
    name: string;
    values: Record<number, number>; // DMX channel -> value
    timestamp: number;
  }>>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneAutoSave, setSceneAutoSave] = useState(false);

  // TouchOSC Export state
  const [showTouchOscExport, setShowTouchOscExport] = useState(false);
  const [touchOscExportOptions, setTouchOscExportOptions] = useState<SuperControlExportOptions>({
    resolution: 'tablet_portrait',
    includeBasicControls: true,
    includePanTilt: true,
    includeColorWheel: true,
    includeXYPad: true,
    includeEffects: true,
    includeAutopilot: true,
    includeQuickActions: true,
    includeSceneControls: true,
    includeNavigation: true,
  });
  const [touchOscExportStatus, setTouchOscExportStatus] = useState<{
    isExporting: boolean;
    message: string;
    isSuccess: boolean;
  }>({
    isExporting: false,
    message: '',
    isSuccess: false,
  });

  // TouchOSC Export function
  const handleTouchOscExport = async () => {
    setTouchOscExportStatus({ isExporting: true, message: 'Generating TouchOSC layout...', isSuccess: false });
    
    try {
      const result = await exportSuperControlToToscFile(
        touchOscExportOptions,
        `ArtBastard_SuperControl_${new Date().toISOString().slice(0, 10)}.tosc`
      );
      
      if (result.success) {
        setTouchOscExportStatus({ isExporting: false, message: 'TouchOSC export successful!', isSuccess: true });
        setTimeout(() => {
          setTouchOscExportStatus({ isExporting: false, message: '', isSuccess: false });
          setShowTouchOscExport(false);
        }, 3000);
      } else {
        setTouchOscExportStatus({ isExporting: false, message: result.message || 'Export failed', isSuccess: false });
      }
    } catch (error) {
      setTouchOscExportStatus({ 
        isExporting: false, 
        message: `Export failed: ${error instanceof Error ? error.message : String(error)}`, 
        isSuccess: false 
      });
    }
  };

  // Helper functions
  const getFixtureCapabilities = (): FixtureCapability[] => {
    const capabilities: Record<string, string[]> = {};
    
    fixtures.forEach(fixture => {
      fixture.channels.forEach(channel => {
        const type = channel.type;
        if (!capabilities[type]) {
          capabilities[type] = [];
        }
        if (!capabilities[type].includes(fixture.name)) {
          capabilities[type].push(fixture.name);
        }
      });
    });
    
    return Object.entries(capabilities).map(([type, fixtures]) => ({
      type,
      fixtures
    }));
  };

  const getAffectedFixtures = () => {
    console.log(`getAffectedFixtures called - selectionMode: ${selectionMode}`);
    console.log(`Selected channels: ${selectedChannels.length}`, selectedChannels);
    console.log(`Selected fixtures: ${selectedFixtures.length}`, selectedFixtures);
    console.log(`Selected groups: ${selectedGroups.length}`, selectedGroups);

    if (selectionMode === 'channels' && selectedChannels.length > 0) {
      // Find fixtures that contain the selected channels
      const affectedFixtures = fixtures.filter(fixture => 
        fixture.channels.some(channel => 
          selectedChannels.includes(channel.dmxAddress || 0)
        )
      );
      console.log(`Channel mode: found ${affectedFixtures.length} affected fixtures`);
      return affectedFixtures;
    }
    
    if (selectionMode === 'fixtures' && selectedFixtures.length > 0) {
      const affectedFixtures = fixtures.filter(fixture => 
        selectedFixtures.includes(fixture.name)
      );
      console.log(`Fixture mode: found ${affectedFixtures.length} affected fixtures`);
      return affectedFixtures;
    }
    
    if (selectionMode === 'groups' && selectedGroups.length > 0) {
      const groupFixtures = groups
        .filter(group => selectedGroups.includes(group.name))
        .flatMap(group => group.fixtureIndices.map(idx => fixtures[idx]?.name).filter(Boolean));
      
      const affectedFixtures = fixtures.filter(fixture => 
        groupFixtures.includes(fixture.name)
      );
      console.log(`Group mode: found ${affectedFixtures.length} affected fixtures`);
      return affectedFixtures;
    }
    
    if (selectionMode === 'capabilities' && selectedCapabilities.length > 0) {
      const affectedFixtures = fixtures.filter(fixture => 
        fixture.channels.some(channel => 
          selectedCapabilities.includes(channel.type)
        )
      );
      console.log(`Capability mode: found ${affectedFixtures.length} affected fixtures`);
      return affectedFixtures;
    }
    
    console.log('No fixtures affected - no valid selection');
    return [];
  };

  const applyControl = (controlType: string, value: number) => {
    const affectedFixtures = getAffectedFixtures();
    console.log(`applyControl called: type=${controlType}, value=${value}, fixtures=${affectedFixtures.length}`);
    
    if (affectedFixtures.length === 0) {
      console.log('No fixtures to apply control to');
      return;
    }
    
    affectedFixtures.forEach((fixture, index) => {
      const channels = fixture.channels;
      let targetChannel = -1;
      
      // Find the target channel based on control type
      switch (controlType) {        case 'dimmer':
          targetChannel = channels.find(c => c.type === 'dimmer')?.dmxAddress ?? -1;
          break;
        case 'pan':
          targetChannel = channels.find(c => c.type === 'pan')?.dmxAddress ?? -1;
          break;
        case 'tilt':
          targetChannel = channels.find(c => c.type === 'tilt')?.dmxAddress ?? -1;
          break;
        case 'red':
          targetChannel = channels.find(c => c.type === 'red')?.dmxAddress ?? -1;
          break;
        case 'green':
          targetChannel = channels.find(c => c.type === 'green')?.dmxAddress ?? -1;
          break;
        case 'blue':
          targetChannel = channels.find(c => c.type === 'blue')?.dmxAddress ?? -1;
          break;
        case 'gobo':
          targetChannel = channels.find(c => c.type === 'gobo')?.dmxAddress ?? -1;
          break;
        case 'shutter':
          targetChannel = channels.find(c => c.type === 'shutter')?.dmxAddress ?? -1;
          break;
        case 'strobe':
          targetChannel = channels.find(c => c.type === 'strobe')?.dmxAddress ?? -1;
          break;
        case 'lamp':
          targetChannel = channels.find(c => c.type === 'lamp')?.dmxAddress ?? -1;
          break;
        case 'reset':
          targetChannel = channels.find(c => c.type === 'reset')?.dmxAddress ?? -1;
          break;
      }
      
      if (targetChannel >= 0) {        console.log(`[DMX] Setting channel ${targetChannel} to ${value} for ${controlType}`);
        setDmxChannelValue(targetChannel, value);
        
        // Verification
        setTimeout(() => {
          const actualValue = getDmxChannelValue(targetChannel);
          console.log(`[DMX] Verification: Channel ${targetChannel} is now ${actualValue} (expected ${value})`);
        }, 50);
      } else {
        console.log(`[DMX] ERROR: No target channel found for ${controlType} in fixture ${index}`, channels);
      }
    });
  };

  // OSC Address Management
  const updateOscAddress = (control: string, address: string) => {
    setOscAddresses(prev => ({
      ...prev,
      [control]: address
    }));
  };

  // XY Pad handlers
  const handleXYPadMouseDown = (e: React.MouseEvent) => {
    setIsDraggingXY(true);
    updateXYPosition(e);
  };

  const handleXYPadMouseMove = (e: React.MouseEvent) => {
    if (isDraggingXY) {
      updateXYPosition(e);
    }
  };

  const handleXYPadMouseUp = () => {
    setIsDraggingXY(false);
  };

  const updateXYPosition = (e: React.MouseEvent) => {
    if (!xyPadRef.current) return;
    
    const rect = xyPadRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setPanTiltXY({ x, y });
    
    const panVal = Math.round((x / 100) * 255);
    const tiltVal = Math.round(((100 - y) / 100) * 255); // Invert Y axis
    
    setPanValue(panVal);
    setTiltValue(tiltVal);
    applyControl('pan', panVal);
    applyControl('tilt', tiltVal);
  };

  // Reset Pan/Tilt to center position
  const resetPanTiltToCenter = () => {
    const centerValue = 127; // DMX center position (50% of 255)
    const centerPercentage = 50; // 50% for XY pad
    
    setPanValue(centerValue);
    setTiltValue(centerValue);
    setPanTiltXY({ x: centerPercentage, y: centerPercentage });
    
    applyControl('pan', centerValue);
    applyControl('tilt', centerValue);
  };

  // Color wheel handlers
  const handleColorWheelMouseDown = (e: React.MouseEvent) => {
    setIsDraggingColor(true);
    updateColorPosition(e);
  };

  const handleColorWheelMouseMove = (e: React.MouseEvent) => {
    if (isDraggingColor) {
      updateColorPosition(e);
    }
  };

  const handleColorWheelMouseUp = () => {
    setIsDraggingColor(false);
  };

  const updateColorPosition = (e: React.MouseEvent) => {
    if (!colorWheelRef.current) return;
    
    const rect = colorWheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const hue = (angle + 360) % 360;
    const distance = Math.min(Math.sqrt(x * x + y * y), centerX);
    const saturation = (distance / centerX) * 100;
    
    setColorHue(hue);
    setColorSaturation(saturation);
    
    // Convert HSV to RGB
    const { r, g, b } = hsvToRgb(hue, saturation, 100);
    setRed(r);
    setGreen(g);
    setBlue(b);
    applyControl('red', r);
    applyControl('green', g);
    applyControl('blue', b);
  };

  // HSV to RGB conversion
  const hsvToRgb = (h: number, s: number, v: number) => {
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

  // MIDI Learn functionality
  const startMidiLearn = (controlType: string, minValue: number = 0, maxValue: number = 255) => {
    setMidiLearnTarget(controlType);
    console.log(`Starting MIDI learn for ${controlType} (range: ${minValue}-${maxValue})`);
  };

  const stopMidiLearn = () => {
    setMidiLearnTarget(null);
    console.log('Stopped MIDI learn');
  };

  const clearMidiMapping = (controlType: string) => {
    setMidiMappings(prev => {
      const updated = { ...prev };
      delete updated[controlType];
      return updated;
    });
    console.log(`Cleared MIDI mapping for ${controlType}`);
  };

  // Scene Management Functions
  const captureCurrentScene = (name?: string) => {
    const sceneValues: Record<number, number> = {};
    
    // Capture all current DMX values
    for (let i = 1; i <= 512; i++) {
      const value = getDmxChannelValue(i);
      if (value > 0) {
        sceneValues[i] = value;
      }
    }

    const newScene = {
      id: `scene_${Date.now()}`,
      name: name || `Scene ${scenes.length + 1}`,
      values: sceneValues,
      timestamp: Date.now()
    };

    setScenes(prev => [...prev, newScene]);
    setCurrentSceneIndex(scenes.length);
    return newScene;
  };

  const loadScene = (sceneIndex: number) => {
    if (sceneIndex < 0 || sceneIndex >= scenes.length) return;
    
    const scene = scenes[sceneIndex];
    Object.entries(scene.values).forEach(([channel, value]) => {
      setDmxChannelValue(parseInt(channel), value);
    });
    
    setCurrentSceneIndex(sceneIndex);
  };

  const saveCurrentScene = () => {
    if (sceneAutoSave) {
      captureCurrentScene(`Auto Scene ${new Date().toLocaleTimeString()}`);
    }
  };

  const deleteScene = (sceneIndex: number) => {
    if (sceneIndex < 0 || sceneIndex >= scenes.length) return;
    
    setScenes(prev => prev.filter((_, index) => index !== sceneIndex));
    if (currentSceneIndex >= sceneIndex && currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const selectNextScene = () => {
    if (scenes.length === 0) return;
    const nextIndex = (currentSceneIndex + 1) % scenes.length;
    loadScene(nextIndex);
  };

  const selectPreviousScene = () => {
    if (scenes.length === 0) return;
    const prevIndex = currentSceneIndex === 0 ? scenes.length - 1 : currentSceneIndex - 1;
    loadScene(prevIndex);
  };

  return (
    <div className={styles.superControl}>
      <div className={styles.header}>
        <h3>
          <LucideIcon name="Settings" />
          Super Control
        </h3>
        <p>Advanced DMX Control Interface</p>
        <div className={styles.headerActions}>
          <button
            className={styles.touchOscBtn}
            onClick={() => setShowTouchOscExport(true)}
            title="Export TouchOSC Layout"
          >
            <LucideIcon name="Smartphone" />
            TouchOSC
          </button>
          <button
            className={styles.helpBtn}
            title="Show OSC Addresses"
          >
            <LucideIcon name="HelpCircle" />
            OSC Help
          </button>
        </div>
      </div>

      {/* Selection Mode */}
      <div className={styles.fixtureSelection}>
        <div className={styles.selectionTabs}>
          <button 
            className={selectionMode === 'channels' ? styles.active : ''}
            onClick={() => setSelectionMode('channels')}
          >
            <LucideIcon name="Radio" />
            Channels
          </button>
          <button 
            className={selectionMode === 'fixtures' ? styles.active : ''}
            onClick={() => setSelectionMode('fixtures')}
          >
            <LucideIcon name="Lightbulb" />
            Fixtures
          </button>
          <button 
            className={selectionMode === 'groups' ? styles.active : ''}
            onClick={() => setSelectionMode('groups')}
          >
            <LucideIcon name="Users" />
            Groups
          </button>
          <button 
            className={selectionMode === 'capabilities' ? styles.active : ''}
            onClick={() => setSelectionMode('capabilities')}
          >
            <LucideIcon name="Zap" />
            Capabilities
          </button>
        </div>

        {selectionMode === 'fixtures' && (
          <div className={styles.fixtureList}>
            {fixtures.map(fixture => (
              <div
                key={fixture.name}
                className={`${styles.fixtureItem} ${selectedFixtures.includes(fixture.name) ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedFixtures(prev => 
                    prev.includes(fixture.name) 
                      ? prev.filter(name => name !== fixture.name)
                      : [...prev, fixture.name]
                  );
                }}
              >
                <span className={styles.fixtureName}>{fixture.name}</span>
                <span className={styles.fixtureChannels}>
                  CH {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {selectionMode === 'groups' && (
          <div className={styles.fixtureList}>
            {groups.map(group => (
              <div
                key={group.name}
                className={`${styles.fixtureItem} ${selectedGroups.includes(group.name) ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedGroups(prev => 
                    prev.includes(group.name) 
                      ? prev.filter(name => name !== group.name)
                      : [...prev, group.name]
                  );
                }}
              >
                <span className={styles.fixtureName}>{group.name}</span>
                <span className={styles.fixtureChannels}>
                  {group.fixtureIndices.length} fixtures
                </span>
              </div>
            ))}
          </div>
        )}

        {selectionMode === 'capabilities' && (
          <div className={styles.fixtureList}>
            {getFixtureCapabilities().map(capability => (
              <div
                key={capability.type}
                className={`${styles.fixtureItem} ${selectedCapabilities.includes(capability.type) ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedCapabilities(prev => 
                    prev.includes(capability.type) 
                      ? prev.filter(type => type !== capability.type)
                      : [...prev, capability.type]
                  );
                }}
              >
                <span className={styles.fixtureName}>{capability.type.toUpperCase()}</span>
                <span className={styles.fixtureChannels}>
                  {capability.fixtures.length} fixtures
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Basic Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>Basic Controls</h4>
        </div>
        
        <div className={styles.controlGrid}>
          {/* Dimmer Control */}
          <div className={styles.controlRow}>
            <label>Dimmer</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={dimmer}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDimmer(val);
                  applyControl('dimmer', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={dimmer}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setDimmer(val);
                  applyControl('dimmer', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.dimmer}</span>
            </div>
          </div>

          {/* Pan Control */}
          <div className={styles.controlRow}>
            <label>Pan</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={panValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPanValue(val);
                  applyControl('pan', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={panValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setPanValue(val);
                  applyControl('pan', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.pan}</span>
            </div>
          </div>

          {/* Tilt Control */}
          <div className={styles.controlRow}>
            <label>Tilt</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={tiltValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTiltValue(val);
                  applyControl('tilt', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={tiltValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setTiltValue(val);
                  applyControl('tilt', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.tilt}</span>
            </div>
          </div>

          {/* Color Controls */}
          <div className={styles.controlRow}>
            <label style={{ color: '#ff0000' }}>Red</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={red}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setRed(val);
                  applyControl('red', val);
                }}
                className={styles.slider}
                style={{ accentColor: '#ff0000' }}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={red}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setRed(val);
                  applyControl('red', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.red}</span>
            </div>
          </div>

          <div className={styles.controlRow}>
            <label style={{ color: '#00ff00' }}>Green</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={green}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setGreen(val);
                  applyControl('green', val);
                }}
                className={styles.slider}
                style={{ accentColor: '#00ff00' }}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={green}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setGreen(val);
                  applyControl('green', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.green}</span>
            </div>
          </div>

          <div className={styles.controlRow}>
            <label style={{ color: '#0000ff' }}>Blue</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={blue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBlue(val);
                  applyControl('blue', val);
                }}
                className={styles.slider}
                style={{ accentColor: '#0000ff' }}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={blue}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setBlue(val);
                  applyControl('blue', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.blue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pan/Tilt XY Pad Control */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>Pan/Tilt XY Pad</h4>
        </div>
        
        <div 
          className={styles.xyPad}
          ref={xyPadRef}
          onMouseDown={handleXYPadMouseDown}
          onMouseMove={handleXYPadMouseMove}
          onMouseUp={handleXYPadMouseUp}
        >
          <div className={styles.xyGridLines} />
          <div 
            className={styles.xyHandle}
            style={{
              left: `${panTiltXY.x}%`,
              top: `${panTiltXY.y}%`
            }}
          />
        </div>
        
        <div className={styles.panTiltControls}>
          <button 
            className={styles.centerResetBtn}
            onClick={resetPanTiltToCenter}
            title="Reset Pan/Tilt to center position"
          >
            <LucideIcon name="Target" />
            Reset to Center
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', justifyContent: 'center' }}>
          <span>Pan: {panValue}</span>
          <span>Tilt: {tiltValue}</span>
        </div>
      </div>

      {/* RGB Color Wheel Control */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>RGB Color Control</h4>
        </div>
        
        <div 
          className={styles.colorWheel}
          ref={colorWheelRef}
          onMouseDown={handleColorWheelMouseDown}
          onMouseMove={handleColorWheelMouseMove}
          onMouseUp={handleColorWheelMouseUp}
        >
          <div className={styles.colorSaturation}>
            <div 
              className={styles.colorHandle}
              style={{
                left: `${50 + (colorSaturation / 100) * Math.cos(colorHue * Math.PI / 180) * 45}%`,
                top: `${50 + (colorSaturation / 100) * Math.sin(colorHue * Math.PI / 180) * 45}%`
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', justifyContent: 'center' }}>
          <span style={{ color: '#ff0000' }}>R: {red}</span>
          <span style={{ color: '#00ff00' }}>G: {green}</span>
          <span style={{ color: '#0000ff' }}>B: {blue}</span>
        </div>
      </div>

      {/* Additional Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>Additional Controls</h4>
        </div>
        
        <div className={styles.controlGrid}>
          {/* Gobo Control */}
          <div className={styles.controlRow}>
            <label>Gobo</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={gobo}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setGobo(val);
                  applyControl('gobo', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={gobo}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setGobo(val);
                  applyControl('gobo', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.gobo}</span>
            </div>
          </div>

          {/* Shutter Control */}
          <div className={styles.controlRow}>
            <label>Shutter</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={shutter}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setShutter(val);
                  applyControl('shutter', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={shutter}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setShutter(val);
                  applyControl('shutter', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.shutter}</span>
            </div>
          </div>

          {/* Strobe Control */}
          <div className={styles.controlRow}>
            <label>Strobe</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={strobe}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStrobe(val);
                  applyControl('strobe', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={strobe}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setStrobe(val);
                  applyControl('strobe', val);
                }}
                className={styles.valueInput}
              />              <span className={styles.oscAddress}>{oscAddresses.strobe}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Movement Controls Section */}
        <div className={styles.controlSection}>
          <h3>Enhanced Movement Controls</h3>
          
          {/* Focus Control */}
          <div className={styles.controlRow}>
            <label>Focus</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={focus}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFocus(val);
                  applyControl('focus', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={focus}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFocus(val);
                  applyControl('focus', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.focus}</span>
            </div>
          </div>

          {/* Zoom Control */}
          <div className={styles.controlRow}>
            <label>Zoom</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={zoom}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setZoom(val);
                  applyControl('zoom', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={zoom}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setZoom(val);
                  applyControl('zoom', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.zoom}</span>
            </div>
          </div>

          {/* Iris Control */}
          <div className={styles.controlRow}>
            <label>Iris</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={iris}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setIris(val);
                  applyControl('iris', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={iris}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setIris(val);
                  applyControl('iris', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.iris}</span>
            </div>
          </div>

          {/* Prism Control */}
          <div className={styles.controlRow}>
            <label>Prism</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={prism}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPrism(val);
                  applyControl('prism', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={prism}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setPrism(val);
                  applyControl('prism', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.prism}</span>
            </div>
          </div>

          {/* Color Wheel Control */}
          <div className={styles.controlRow}>
            <label>Color Wheel</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={colorWheel}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setColorWheel(val);
                  applyControl('colorWheel', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={colorWheel}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setColorWheel(val);
                  applyControl('colorWheel', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.colorWheel}</span>
            </div>
          </div>

          {/* Gobo Rotation Control */}
          <div className={styles.controlRow}>
            <label>Gobo Rotation</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={goboRotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setGoboRotation(val);
                  applyControl('goboRotation', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={goboRotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setGoboRotation(val);
                  applyControl('goboRotation', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.goboRotation}</span>
            </div>
          </div>

          {/* Gobo 2 Control */}
          <div className={styles.controlRow}>
            <label>Gobo 2</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={gobo2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setGobo2(val);
                  applyControl('gobo2', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={gobo2}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setGobo2(val);
                  applyControl('gobo2', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.gobo2}</span>
            </div>
          </div>

          {/* Frost Control */}
          <div className={styles.controlRow}>
            <label>Frost</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={frost}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFrost(val);
                  applyControl('frost', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={frost}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFrost(val);
                  applyControl('frost', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.frost}</span>
            </div>
          </div>

          {/* Macro Control */}
          <div className={styles.controlRow}>
            <label>Macro</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={macro}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMacro(val);
                  applyControl('macro', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={macro}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setMacro(val);
                  applyControl('macro', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.macro}</span>
            </div>
          </div>

          {/* Speed Control */}
          <div className={styles.controlRow}>
            <label>Speed</label>
            <div className={styles.controlInputs}>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={speed}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSpeed(val);
                  applyControl('speed', val);
                }}
                className={styles.slider}
              />
              <input 
                type="number" 
                min="0" 
                max="255" 
                value={speed}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setSpeed(val);
                  applyControl('speed', val);
                }}
                className={styles.valueInput}
              />
              <span className={styles.oscAddress}>{oscAddresses.speed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TouchOSC Export Modal */}
      {showTouchOscExport && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Export TouchOSC Layout</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowTouchOscExport(false)}
              >
                <LucideIcon name="X" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Export the current SuperControl layout to a TouchOSC (.tosc) file.</p>
              
              {touchOscExportStatus.isExporting ? (
                <div className={styles.exportProgress}>
                  <div className={styles.spinner}></div>
                  <p>{touchOscExportStatus.message}</p>
                </div>
              ) : touchOscExportStatus.message ? (
                <div className={`${styles.exportMessage} ${touchOscExportStatus.isSuccess ? styles.success : styles.error}`}>
                  <p>{touchOscExportStatus.message}</p>
                </div>
              ) : null}
              
              <div className={styles.exportOptions}>
                <h4>Export Options</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={touchOscExportOptions.includeBasicControls}
                    onChange={(e) => setTouchOscExportOptions(prev => ({
                      ...prev,
                      includeBasicControls: e.target.checked
                    }))}
                  />
                  Include Basic Controls
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={touchOscExportOptions.includePanTilt}
                    onChange={(e) => setTouchOscExportOptions(prev => ({
                      ...prev,
                      includePanTilt: e.target.checked
                    }))}
                  />
                  Include Pan/Tilt Controls
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={touchOscExportOptions.includeColorWheel}
                    onChange={(e) => setTouchOscExportOptions(prev => ({
                      ...prev,
                      includeColorWheel: e.target.checked
                    }))}
                  />
                  Include Color Wheel
                </label>
              </div>
              
              <div className={styles.modalActions}>
                <button
                  className={styles.exportBtn}
                  onClick={handleTouchOscExport}
                  disabled={touchOscExportStatus.isExporting}
                >
                  <LucideIcon name="Download" />
                  Export Layout
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowTouchOscExport(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scene Management */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>Scene Management</h4>
        </div>
        
        <div className={styles.sceneControls}>
          <div className={styles.sceneButtonRow}>
            <button 
              className={styles.sceneBtn}
              onClick={() => captureCurrentScene()}
            >
              <LucideIcon name="Camera" />
              Save Scene
            </button>
            <button 
              className={styles.sceneBtn}
              onClick={selectPreviousScene}
              disabled={scenes.length === 0}
            >
              <LucideIcon name="ChevronLeft" />
              Previous
            </button>
            <button 
              className={styles.sceneBtn}
              onClick={selectNextScene}
              disabled={scenes.length === 0}
            >
              Next
              <LucideIcon name="ChevronRight" />
            </button>
          </div>
          
          <div className={styles.sceneInfo}>
            <span className={styles.currentScene}>
              {scenes.length > 0 ? scenes[currentSceneIndex]?.name || 'No scene' : 'No scenes'}
            </span>
            <span className={styles.sceneCount}>({scenes.length} saved)</span>
          </div>
          
          <div className={styles.sceneOptions}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={sceneAutoSave}
                onChange={(e) => setSceneAutoSave(e.target.checked)}
              />
              Auto-save scenes
            </label>
          </div>
        </div>

        {/* Saved Scenes List */}
        {scenes.length > 0 && (
          <div className={styles.scenesList}>
            <h5>Saved Scenes ({scenes.length})</h5>
            <div className={styles.scenesGrid}>
              {scenes.map((scene, index) => (
                <div 
                  key={scene.id}
                  className={`${styles.sceneItem} ${index === currentSceneIndex ? styles.active : ''}`}
                >
                  <div className={styles.sceneHeader}>
                    <span className={styles.sceneName}>{scene.name}</span>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => deleteScene(index)}
                    >
                      <LucideIcon name="X" />
                    </button>
                  </div>
                  <div className={styles.sceneDetails}>
                    <span className={styles.sceneChannels}>
                      {Object.keys(scene.values).length} channels
                    </span>
                    <span className={styles.sceneTime}>
                      {new Date(scene.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <button 
                    className={styles.loadSceneBtn}
                    onClick={() => loadScene(index)}
                  >
                    <LucideIcon name="Play" />
                    Load Scene
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperControl;
