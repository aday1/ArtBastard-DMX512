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

const SuperControl: React.FC<SuperControlProps> = ({ isDockable = false }) => {  const {
    fixtures, 
    groups,
    selectedChannels,
    selectAllChannels,
    deselectAllChannels,
    selectChannel,
    deselectChannel,
    toggleChannelSelection,
    selectedFixtures,
    selectNextFixture,
    selectPreviousFixture,
    selectAllFixtures,    selectFixturesByType,
    selectFixtureGroup,
    deselectAllFixtures,
    setSelectedFixtures,
    toggleFixtureSelection,
    getDmxChannelValue,
    setDmxChannelValue,// Smooth DMX Functions
    smoothDmxEnabled,
    // setSmoothDmxChannelValue, // TODO: Implement these functions
    // enableSmoothDmxMode,    // flushSmoothDmxUpdates,
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
    updatePanTiltFromTrack,
    calculateTrackPosition
  } = useStore();  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('fixtures');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);

  // Log fixtures prop changes
  useEffect(() => {
    console.log('[SuperControl] Fixtures updated:', fixtures.map(f => f.id));
  }, [fixtures]);

  // Log selectedFixtures state changes
  useEffect(() => {
    console.log('[SuperControl] selectedFixtures state updated:', selectedFixtures);
  }, [selectedFixtures]);
  // Auto-select first fixture if none are selected in fixtures mode
  useEffect(() => {
    if (selectionMode === 'fixtures' && fixtures.length > 0 && selectedFixtures.length === 0) {
      console.log('[SuperControl] Auto-selecting first fixture:', fixtures[0].id);
      setSelectedFixtures([fixtures[0].id]);
    }
  }, [selectionMode, fixtures, selectedFixtures, setSelectedFixtures]);

  // Debug selection mode changes
  useEffect(() => {
    console.log('[SuperControl] Selection mode changed to:', selectionMode);
    console.log('[SuperControl] Current selectedFixtures:', selectedFixtures);
    console.log('[SuperControl] Available fixtures:', fixtures.map(f => ({ id: f.id, name: f.name })));
  }, [selectionMode, selectedFixtures, fixtures]);

  // Basic Control State
  const [dimmer, setDimmer] = useState(255);
  const [panValue, setPanValue] = useState(127);
  const [tiltValue, setTiltValue] = useState(127);
  const [finePanValue, setFinePanValue] = useState(0);
  const [fineTiltValue, setFineTiltValue] = useState(0);
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
  const [iris, setIris] = useState(255);  const [prism, setPrism] = useState(0);
  const [colorWheel, setColorWheel] = useState(0);
  const [goboRotation, setGoboRotation] = useState(127);
  const [gobo2, setGobo2] = useState(0);
  const [frost, setFrost] = useState(0);
  const [macro, setMacro] = useState(0);
  const [speed, setSpeed] = useState(127);
  
  // Enhanced button controls
  const [isFlashing, setIsFlashing] = useState(false);
  const [isStrobing, setIsStrobing] = useState(false);
  const [flashSpeed, setFlashSpeed] = useState(100);
  const [strobeSpeed, setStrobeSpeed] = useState(10);
  
  // GOBO presets for common gobo types
  const goboPresets = [
    { id: 0, name: 'Open', value: 0, icon: '○' },
    { id: 1, name: 'Dots', value: 32, icon: '⋅⋅⋅' },
    { id: 2, name: 'Lines', value: 64, icon: '|||' },
    { id: 3, name: 'Breakup', value: 96, icon: '◦◉◦' },
    { id: 4, name: 'Stars', value: 128, icon: '✦' },
    { id: 5, name: 'Spiral', value: 160, icon: '🌀' },
    { id: 6, name: 'Prism', value: 192, icon: '◆' },
    { id: 7, name: 'Pattern', value: 224, icon: '⟐' }
  ];

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

  // OSC Help state
  const [showOscHelp, setShowOscHelp] = useState(false);

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
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [getAffectedFixtures]`;

    console.log(`${logPrefix} Called. selectionMode: ${selectionMode}`);
    console.log(`${logPrefix} All fixtures in store:`, fixtures.map(f => f.id));

    let affectedFixtures: any[] = [];

    if (selectionMode === 'channels') {
      console.log(`${logPrefix} Mode: channels. Selected channels:`, selectedChannels);
      if (selectedChannels.length > 0) {
        affectedFixtures = fixtures.filter(fixture =>
          fixture.channels.some(channel =>
            selectedChannels.includes(channel.dmxAddress || 0)
          )
        );
      }
    } else if (selectionMode === 'fixtures') {
      const storeSelectedFixtures = useStore.getState().selectedFixtures;
      console.log(`${logPrefix} Mode: fixtures. Selected fixtures (prop):`, selectedFixtures);
      console.log(`${logPrefix} Mode: fixtures. Selected fixtures (store):`, storeSelectedFixtures);
      if (storeSelectedFixtures.length > 0) {
        affectedFixtures = fixtures.filter(fixture =>
          storeSelectedFixtures.includes(fixture.id) // Use fixture.id
        );
      }
    } else if (selectionMode === 'groups') {
      console.log(`${logPrefix} Mode: groups. Selected groups:`, selectedGroups);
      if (selectedGroups.length > 0) {
        const groupFixturesNames = groups
          .filter(group => selectedGroups.includes(group.name))
          .flatMap(group => group.fixtureIndices.map(idx => fixtures[idx]?.name).filter(Boolean));
        affectedFixtures = fixtures.filter(fixture =>
          groupFixturesNames.includes(fixture.name)
        );
      }
    } else if (selectionMode === 'capabilities') {
      console.log(`${logPrefix} Mode: capabilities. Selected capabilities:`, selectedCapabilities);
      if (selectedCapabilities.length > 0) {
        affectedFixtures = fixtures.filter(fixture =>
          fixture.channels.some(channel =>
            selectedCapabilities.includes(channel.type)
          )
        );
      }
    }

    console.log(`${logPrefix} Affected fixtures before return:`, affectedFixtures.map(f => f.id));
    if (affectedFixtures.length === 0) {
      console.log(`${logPrefix} No fixtures affected - no valid selection or empty selection.`);
    }
    return affectedFixtures;
  };

  const applyControl = (controlType: string, value: number) => {
    console.log(`[SuperControl] applyControl: Entered. controlType=${controlType}, value=${value}`);
    const affectedFixtures = getAffectedFixtures();
    console.log(`[SuperControl] 🎛️ applyControl: Affected fixtures length from getAffectedFixtures(): ${affectedFixtures.length}`);
    // The existing log above is slightly different from the one requested to be here, 
    // but it serves a similar purpose of logging type, value, and count. I'll keep it and add the new ones.

    console.log(`[SuperControl] Selection mode: ${selectionMode}`);
    
    if (selectionMode === 'channels') {
      console.log(`[SuperControl] Selected channels:`, selectedChannels);
    } else if (selectionMode === 'fixtures') {
      console.log(`[SuperControl] Selected fixtures (prop):`, selectedFixtures); // Note: SuperControl uses prop selectedFixtures here
    } else if (selectionMode === 'groups') {
      console.log(`[SuperControl] Selected groups:`, selectedGroups);
    } else if (selectionMode === 'capabilities') {
      console.log(`[SuperControl] Selected capabilities:`, selectedCapabilities);
    }
    
    if (affectedFixtures.length === 0) {
      console.warn('[SuperControl] ❌ No fixtures to apply control to - please select fixtures first!');
      console.warn('[SuperControl] 💡 Try clicking "Select All" or choose specific fixtures to control');
      console.log('[SuperControl] applyControl: No affected fixtures. Will not call setDmxChannelValue.');
      return;
    }
    
    console.log(`[SuperControl] applyControl: Processing ${affectedFixtures.length} affected fixtures.`);
    console.log(`[SuperControl] ✅ Applying ${controlType}=${value} to ${affectedFixtures.length} fixtures:`);
    affectedFixtures.forEach(fixture => console.log(`  - ${fixture.name} (channels: ${fixture.startAddress}-${fixture.startAddress + fixture.channels.length - 1})`));
    
    let updateCount = 0;
    let errorCount = 0;
      affectedFixtures.forEach((fixture, index) => {
      const channels = fixture.channels;
      
      // Find the channel by type first  
      let foundChannel: any = null;
      
      // Enhanced channel finding with multiple matching patterns
      switch (controlType) {
        case 'dimmer':
          foundChannel = channels.find(c => c.type === 'dimmer');
          break;
        case 'pan':
          foundChannel = channels.find(c => c.type === 'pan');
          break;
        case 'finePan':
          foundChannel = channels.find(c => c.type === 'finePan' || c.type === 'fine_pan' || c.type === 'pan_fine');
          break;
        case 'tilt':
          foundChannel = channels.find(c => c.type === 'tilt');
          break;
        case 'fineTilt':
          foundChannel = channels.find(c => c.type === 'fineTilt' || c.type === 'fine_tilt' || c.type === 'tilt_fine');
          break;
        case 'red':
          foundChannel = channels.find(c => c.type === 'red');
          break;
        case 'green':
          foundChannel = channels.find(c => c.type === 'green');
          break;
        case 'blue':
          foundChannel = channels.find(c => c.type === 'blue');
          break;
        case 'gobo':
          foundChannel = channels.find(c => c.type === 'gobo');
          break;
        case 'goboRotation':
          foundChannel = channels.find(c => c.type === 'goboRotation' || c.type === 'gobo_rotation');
          break;
        case 'gobo2':
          foundChannel = channels.find(c => c.type === 'gobo2');
          break;
        case 'shutter':
          foundChannel = channels.find(c => c.type === 'shutter');
          break;
        case 'strobe':
          foundChannel = channels.find(c => c.type === 'strobe');
          break;
        case 'lamp':
          foundChannel = channels.find(c => c.type === 'lamp');
          break;
        case 'reset':
          foundChannel = channels.find(c => c.type === 'reset');
          break;
        case 'focus':
          foundChannel = channels.find(c => c.type === 'focus');
          break;
        case 'zoom':
          foundChannel = channels.find(c => c.type === 'zoom');
          break;
        case 'iris':
          foundChannel = channels.find(c => c.type === 'iris');
          break;
        case 'prism':
          foundChannel = channels.find(c => c.type === 'prism');
          break;
        case 'colorWheel':
          foundChannel = channels.find(c => c.type === 'colorWheel' || c.type === 'color_wheel');
          break;
        case 'frost':
          foundChannel = channels.find(c => c.type === 'frost');
          break;
        case 'macro':
          foundChannel = channels.find(c => c.type === 'macro');
          break;
        case 'speed':
          foundChannel = channels.find(c => c.type === 'speed');
          break;
        default:
          console.warn(`[SuperControl] ⚠️ Unknown control type: ${controlType}`);
          break;
      }
      
      let targetChannel = -1;
      
      if (foundChannel) {
        // Calculate DMX address if missing
        if (foundChannel.dmxAddress !== undefined && foundChannel.dmxAddress !== null) {
          targetChannel = foundChannel.dmxAddress;
        } else {
          // Calculate DMX address: startAddress + channel index
          const channelIndex = channels.indexOf(foundChannel);
          targetChannel = (fixture.startAddress || 1) + channelIndex - 1; // 0-based calculation
          console.log(`[SuperControl] Calculated DMX address for ${fixture.name} channel ${foundChannel.type}: ${targetChannel} (startAddress: ${fixture.startAddress}, index: ${channelIndex})`);
        }
      }
      
      if (targetChannel >= 0) {        console.log(`[DMX] 📡 Setting channel ${targetChannel} to ${value} for ${controlType} on fixture "${fixture.name}"`);
        setDmxChannelValue(targetChannel, value);
        updateCount++;
        
        // Verification with more detailed logging
        setTimeout(() => {
          const actualValue = getDmxChannelValue(targetChannel);
          if (actualValue === value) {
            console.log(`[DMX] ✅ Verification SUCCESS: Channel ${targetChannel} = ${actualValue} (${controlType})`);
          } else {
            console.error(`[DMX] ❌ Verification FAILED: Channel ${targetChannel} = ${actualValue}, expected ${value} (${controlType})`);
          }
        }, 50);
      } else {
        console.error(`[DMX] ❌ ERROR: No target channel found for ${controlType} in fixture "${fixture.name}"`, {
          fixtureChannels: channels.map(c => ({ type: c.type, dmxAddress: c.dmxAddress })),
          requestedControlType: controlType
        });
        errorCount++;
      }
    });
    
    // Summary logging
    console.log(`[SuperControl] 📊 Control application summary: ${updateCount} successful updates, ${errorCount} errors`);
    
    if (errorCount > 0) {
      console.warn(`[SuperControl] ⚠️ Some controls failed to apply. Check fixture definitions and channel mappings.`);
    }
  };
  // OSC Address Management
  const updateOscAddress = (control: string, address: string) => {
    setOscAddresses(prev => ({
      ...prev,
      [control]: address
    }));
  };

  // Get DMX channel assignments for a control type
  const getDmxChannelForControl = (controlType: string): string => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [getDmxChannelForControl]`;

    console.log(`${logPrefix} Called for controlType: ${controlType}`);

    const affectedFixtures = getAffectedFixtures();
    console.log(`${logPrefix} Affected fixtures count: ${affectedFixtures.length}`, affectedFixtures.map(f => ({ id: f.id, name: f.name })));

    if (affectedFixtures.length === 0) {
      const returnMsg = 'No fixtures selected';
      console.log(`${logPrefix} Returning: "${returnMsg}"`);
      return returnMsg;
    }
    
    const channels: number[] = [];
    affectedFixtures.forEach(fixture => {      console.log(`${logPrefix} Processing fixture - ID: ${fixture.id}, Name: ${fixture.name}`);
      console.log(`${logPrefix} Fixture channels for ${fixture.name}:`, fixture.channels.map((ch: any) => ({ type: ch.type, dmxAddress: ch.dmxAddress })));
      
      // Find the channel by type first
      let foundChannel: any = null;
      const controlTypeLower = controlType.toLowerCase();
      
      // Enhanced channel finding with multiple matching patterns
      switch (controlTypeLower) {
        case 'dimmer':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'dimmer');
          break;
        case 'pan':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'pan');
          break;
        case 'tilt':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'tilt');
          break;
        case 'finepan':
          foundChannel = fixture.channels.find((c: any) => {
            const typeLower = c.type.toLowerCase();
            return typeLower === 'finepan' || typeLower === 'fine_pan' || typeLower === 'pan_fine';
          });
          break;
        case 'finetilt':
          foundChannel = fixture.channels.find((c: any) => {
            const typeLower = c.type.toLowerCase();
            return typeLower === 'finetilt' || typeLower === 'fine_tilt' || typeLower === 'tilt_fine';
          });
          break;
        case 'red':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'red');
          break;
        case 'green':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'green');
          break;
        case 'blue':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'blue');
          break;
        case 'gobo':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'gobo');
          break;
        case 'shutter':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'shutter');
          break;
        case 'goborotation':
          foundChannel = fixture.channels.find((c: any) => {
            const typeLower = c.type.toLowerCase();
            return typeLower === 'goborotation' || typeLower === 'gobo_rotation';
          });
          break;
        case 'colorwheel':
          foundChannel = fixture.channels.find((c: any) => {
            const typeLower = c.type.toLowerCase();
            return typeLower === 'colorwheel' || typeLower === 'color_wheel';
          });
          break;
        case 'focus':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'focus');
          break;
        case 'zoom':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'zoom');
          break;
        case 'iris':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'iris');
          break;
        case 'prism':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'prism');
          break;
        case 'frost':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'frost');
          break;
        case 'macro':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'macro');
          break;
        case 'speed':
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === 'speed');
          break;
        default:
          foundChannel = fixture.channels.find((c: any) => c.type.toLowerCase() === controlTypeLower);
          break;
      }
      
      let targetChannel = -1;
      
      if (foundChannel) {
        // Calculate DMX address if missing
        if (foundChannel.dmxAddress !== undefined && foundChannel.dmxAddress !== null) {
          targetChannel = foundChannel.dmxAddress;
        } else {
          // Calculate DMX address: startAddress + channel index
          const channelIndex = fixture.channels.indexOf(foundChannel);
          targetChannel = (fixture.startAddress || 1) + channelIndex - 1; // 0-based calculation
          console.log(`${logPrefix} Calculated DMX address for ${fixture.name} channel ${foundChannel.type}: ${targetChannel} (startAddress: ${fixture.startAddress}, index: ${channelIndex})`);
        }
      }
      
      console.log(`${logPrefix} Target channel for ${fixture.name} (type: ${controlType}, searched as: ${controlTypeLower}): ${targetChannel}`);
      
      if (targetChannel >= 0) {
        channels.push(targetChannel + 1); // Convert to 1-based for display
      }
    });
    
    console.log(`${logPrefix} Collected DMX channels (1-based, before processing):`, channels);

    if (channels.length === 0) {
      const returnMsg = 'No channels';
      console.log(`${logPrefix} Returning: "${returnMsg}"`);
      return returnMsg;
    }
    if (channels.length === 1) {
      const returnMsg = `Ch ${channels[0]}`;
      console.log(`${logPrefix} Returning: "${returnMsg}"`);
      return returnMsg;
    }
    
    // Group consecutive channels for better display
    const sortedChannels = [...new Set(channels)].sort((a, b) => a - b);
    let finalStr;
    if (sortedChannels.length <= 3) {
      finalStr = `Ch ${sortedChannels.join(', ')}`;
    } else {
      finalStr = `Ch ${sortedChannels[0]}-${sortedChannels[sortedChannels.length - 1]} (${sortedChannels.length})`;
    }
    console.log(`${logPrefix} Returning: "${finalStr}"`);
    return finalStr;
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

  // Flash function - quick bright pulse
  const handleFlash = () => {
    if (isFlashing) return;
    
    setIsFlashing(true);
    const originalDimmer = dimmer;
    
    // Flash to full brightness
    setDimmer(255);
    applyControl('dimmer', 255);
    applyControl('shutter', 255); // Open shutter
    
    setTimeout(() => {
      setDimmer(originalDimmer);
      applyControl('dimmer', originalDimmer);
      setIsFlashing(false);
    }, flashSpeed);
  };

  // Strobe function - continuous strobing
  const handleStrobe = () => {
    setIsStrobing(!isStrobing);
    
    if (!isStrobing) {
      // Start strobing
      const strobeValue = Math.max(128, Math.min(255, 128 + strobeSpeed * 8)); // Strobe range typically 128-255
      applyControl('shutter', strobeValue);
    } else {
      // Stop strobing - open shutter
      applyControl('shutter', 255);
    }
  };

  // Reset all controls to default values
  const handleResetAll = () => {
    const resetConfirm = window.confirm('Reset all SuperControl values to defaults?');
    if (!resetConfirm) return;    // Reset all state values
    setDimmer(0);
    setPanValue(127);
    setTiltValue(127);
    setFinePanValue(0);
    setFineTiltValue(0);
    setRed(0);
    setGreen(0);
    setBlue(0);
    setGobo(0);
    setShutter(255);
    setStrobe(0);
    setLamp(0);
    setReset(0);
    setFocus(127);
    setZoom(127);
    setIris(127);
    setPrism(0);
    setColorWheel(0);
    setGoboRotation(127);
    setGobo2(0);
    setFrost(0);
    setMacro(0);
    setSpeed(127);
    setPanTiltXY({ x: 50, y: 50 });
    setColorHue(0);
    setColorSaturation(0);
    setIsStrobing(false);

    // Apply reset values to fixtures
    const affectedFixtures = getAffectedFixtures();
    if (affectedFixtures.length > 0) {
      affectedFixtures.forEach(fixture => {
        fixture.channels.forEach(channel => {
          if (channel.dmxAddress) {
            let resetValue = 0;            // Special reset values for certain channel types
            if (channel.type === 'pan' || channel.type === 'tilt' || 
                channel.type === 'focus' || channel.type === 'zoom' || 
                channel.type === 'iris' || channel.type === 'goboRotation' || 
                channel.type === 'speed') {
              resetValue = 127; // Center position
            } else if (channel.type === 'finePan' || channel.type === 'fineTilt' ||
                       channel.type === 'fine_pan' || channel.type === 'fine_tilt' ||
                       channel.type === 'pan_fine' || channel.type === 'tilt_fine') {
              resetValue = 0; // Fine controls start at 0
            } else if (channel.type === 'shutter') {
              resetValue = 255; // Open shutter
            }
            applyControl(channel.type, resetValue);
          }
        });
      });
    }
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
  };  // Autopilot track animation - enhanced for faster and more responsive control
  const animationFrameRef = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);

  useEffect(() => {
    if (autopilotTrackEnabled && autopilotTrackAutoPlay) {
      const animate = (currentTime: number) => {
        // Always update DMX values on each frame for real-time responsiveness
        updatePanTiltFromTrack();
        
        const elapsed = currentTime - lastUpdateTime.current;
        
        // Calculate speed factor - higher values move faster
        // Speed ranges from 1-100, with exponential acceleration at higher values
        const speedFactor = autopilotTrackSpeed <= 50 
          ? autopilotTrackSpeed / 10  // 1-50 range maps to 0.1-5x speed
          : Math.pow(1.08, autopilotTrackSpeed - 45);  // Exponential growth for 50-100 range
        
        // Calculate position update
        let newPosition = autopilotTrackPosition + speedFactor * (elapsed / 16.67); // Base on 60fps
        if (newPosition > 100) newPosition %= 100;
        
        // Update position state
        setAutopilotTrackPosition(newPosition);
        lastUpdateTime.current = currentTime;

        // Continue animation if still enabled
        if (autopilotTrackEnabled && autopilotTrackAutoPlay) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      lastUpdateTime.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autopilotTrackEnabled, autopilotTrackAutoPlay, autopilotTrackSpeed, autopilotTrackPosition, updatePanTiltFromTrack, setAutopilotTrackPosition]);
  // Sync Pan/Tilt sliders with autopilot track position
  useEffect(() => {
    if (autopilotTrackEnabled) {
      const { pan, tilt } = calculateTrackPosition(
        autopilotTrackType,
        autopilotTrackPosition,
        autopilotTrackSize,
        autopilotTrackCenterX,
        autopilotTrackCenterY
      );
      
      // Update the Pan/Tilt slider values and XY pad to reflect track position
      setPanValue(pan);
      setTiltValue(tilt);
      
      // Update XY pad position to reflect the calculated pan/tilt
      const xPercent = (pan / 255) * 100;
      const yPercent = ((255 - tilt) / 255) * 100; // Invert Y for display
      setPanTiltXY({ x: xPercent, y: yPercent });
    }
  }, [autopilotTrackEnabled, autopilotTrackType, autopilotTrackPosition, autopilotTrackSize, autopilotTrackCenterX, autopilotTrackCenterY, calculateTrackPosition]);
  const getVisualTrackIndicatorPosition = (
    trackType: string,
    positionPercent: number, // 0-100
    sizePercent: number, // 0-100
    centerXPercent: number, // 0-100
    centerYPercent: number // 0-100
  ): { x: number; y: number } => {
    const visualCenterX = centerXPercent;
    const visualCenterY = centerYPercent;
    const baseRadius = sizePercent / 2;
    
    // Apply the same bounds constraints as in generateTrackPath
    const maxRadiusX = Math.min(visualCenterX, 100 - visualCenterX);
    const maxRadiusY = Math.min(visualCenterY, 100 - visualCenterY);
    const maxRadius = Math.min(maxRadiusX, maxRadiusY, 45); // Max 45% to leave some padding
    const radius = Math.min(baseRadius, maxRadius);
    const visualSize = radius * 2;
    
    const progress = positionPercent / 100; // 0-1

    let x = visualCenterX;
    let y = visualCenterY;

    switch (trackType) {
      case 'circle':
        x = visualCenterX + radius * Math.cos(progress * 2 * Math.PI - Math.PI / 2); // Start from top
        y = visualCenterY + radius * Math.sin(progress * 2 * Math.PI - Math.PI / 2);
        break;
      case 'square':
        const sideLength = visualSize;
        const halfSide = sideLength / 2;
        const perimeter = sideLength * 4;
        const distance = progress * perimeter;

        if (distance < sideLength) { // Top edge
          x = visualCenterX - halfSide + distance;
          y = visualCenterY - halfSide;
        } else if (distance < sideLength * 2) { // Right edge
          x = visualCenterX + halfSide;
          y = visualCenterY - halfSide + (distance - sideLength);
        } else if (distance < sideLength * 3) { // Bottom edge
          x = visualCenterX + halfSide - (distance - sideLength * 2);
          y = visualCenterY + halfSide;
        } else { // Left edge
          x = visualCenterX - halfSide;
          y = visualCenterY + halfSide - (distance - sideLength * 3);
        }
        break;
      case 'triangle':
        const triHeight = visualSize; // Treat visualSize as height
        const triHalfBase = (visualSize * Math.sqrt(3)) / 2 / 2; // Equilateral assumption for simplicity

        // Define points of the triangle (approximate for visual)
        const p1 = { x: visualCenterX, y: visualCenterY - (2/3) * triHeight / 2 }; // Top point
        const p2 = { x: visualCenterX - triHalfBase, y: visualCenterY + (1/3) * triHeight / 2 }; // Bottom-left
        const p3 = { x: visualCenterX + triHalfBase, y: visualCenterY + (1/3) * triHeight / 2 }; // Bottom-right
        
        if (progress < 1/3) { // p1 to p2
            x = p1.x + (p2.x - p1.x) * (progress * 3);
            y = p1.y + (p2.y - p1.y) * (progress * 3);
        } else if (progress < 2/3) { // p2 to p3
            x = p2.x + (p3.x - p2.x) * ((progress - 1/3) * 3);
            y = p2.y + (p3.y - p2.y) * ((progress - 1/3) * 3);
        } else { // p3 to p1
            x = p3.x + (p1.x - p3.x) * ((progress - 2/3) * 3);
            y = p3.y + (p1.y - p3.y) * ((progress - 2/3) * 3);
        }
        break;
      case 'linear':
        // Horizontal line for simplicity
        x = (visualCenterX - radius) + progress * visualSize;
        y = visualCenterY;
        break;
      case 'figure8':
        // Simplified figure 8 for visual representation
        // This will trace two circles side-by-side, scaled to fit within the size
        const R = radius / 2; // Radius of each lobe
        const centerOffset = R;
        if (progress < 0.5) { // First lobe (left or top)
            const currentProgress = progress * 2; // 0-1 for this lobe
            x = (visualCenterX - centerOffset) + R * Math.cos(currentProgress * 2 * Math.PI - Math.PI / 2);
            y = visualCenterY + R * Math.sin(currentProgress * 2 * Math.PI - Math.PI / 2);
        } else { // Second lobe (right or bottom)
            const currentProgress = (progress - 0.5) * 2; // 0-1 for this lobe
            x = (visualCenterX + centerOffset) + R * Math.cos(currentProgress * 2 * Math.PI - Math.PI / 2 + Math.PI); // Start opposite
            y = visualCenterY + R * Math.sin(currentProgress * 2 * Math.PI - Math.PI / 2 + Math.PI);
        }
        break;
      case 'random':
        // Deterministic "random" based on positionPercent for visual stability in one cycle
        // Using sine/cosine with varying frequencies/phases based on positionPercent
        // The goal is not true randomness, but a pseudo-random-looking path that is repeatable.
        const angle1 = (positionPercent / 100) * Math.PI * 2 * 3; // Multiply for more "randomness"
        const angle2 = (positionPercent / 100) * Math.PI * 2 * 5;
        x = visualCenterX + radius * Math.cos(angle1) * (0.5 + 0.5 * Math.sin(angle2));
        y = visualCenterY + radius * Math.sin(angle1) * (0.5 + 0.5 * Math.cos(angle2));        // Clamp to bounds if complex functions might exceed radius
        const dist = Math.sqrt(Math.pow(x - visualCenterX, 2) + Math.pow(y - visualCenterY, 2));
        if (dist > radius) {
          // Normalize to stay within radius
          x = visualCenterX + (x - visualCenterX) * (radius / dist);
          y = visualCenterY + (y - visualCenterY) * (radius / dist);
        }
        break;
        
      default: // Circle as default
        x = visualCenterX + radius * Math.cos(progress * 2 * Math.PI - Math.PI / 2);
        y = visualCenterY + radius * Math.sin(progress * 2 * Math.PI - Math.PI / 2);
        break;
    }
    // Ensure visual indicator stays within the 0-100 bounds of the pad approximately
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    };
  };  // Generate SVG path for track visualization
  const generateTrackPath = () => {
    // Convert DMX range (0-255) to SVG coordinates (0-100)
    const cx = (autopilotTrackCenterX / 255) * 100;
    const cy = (autopilotTrackCenterY / 255) * 100;
    const baseSize = autopilotTrackSize / 2;
    
    // Constrain size to keep track within bounds (0-100 SVG coordinates)
    const maxRadiusX = Math.min(cx, 100 - cx);
    const maxRadiusY = Math.min(cy, 100 - cy);
    const maxRadius = Math.min(maxRadiusX, maxRadiusY, 45); // Max 45% to leave some padding
    const size = Math.min(baseSize, maxRadius);
    
    console.log(`[TRACK_PATH] Center: (${cx.toFixed(1)}, ${cy.toFixed(1)}), Base size: ${baseSize}, Constrained size: ${size.toFixed(1)}`);
    
    switch (autopilotTrackType) {
      case 'circle':
        return `M ${cx + size} ${cy} A ${size} ${size} 0 1 1 ${cx + size - 0.01} ${cy}`;
      
      case 'square':
        return `M ${cx - size} ${cy - size} L ${cx + size} ${cy - size} L ${cx + size} ${cy + size} L ${cx - size} ${cy + size} Z`;
      
      case 'triangle':
        return `M ${cx} ${cy - size} L ${cx + size * 0.866} ${cy + size * 0.5} L ${cx - size * 0.866} ${cy + size * 0.5} Z`;
      
      case 'figure8':
        return `M ${cx} ${cy} Q ${cx + size} ${cy - size} ${cx} ${cy} Q ${cx - size} ${cy + size} ${cx} ${cy}`;
        
      case 'linear':
        return `M ${cx - size} ${cy} L ${cx + size} ${cy}`;
      
      case 'random':
        // For random, just show a dotted circle as placeholder
        return `M ${cx + size} ${cy} A ${size} ${size} 0 1 1 ${cx + size - 0.01} ${cy}`;
      
      default:
        return `M ${cx + size} ${cy} A ${size} ${size} 0 1 1 ${cx + size - 0.01} ${cy}`;
    }
  };

  // Enhanced debugging for DMX control issues
  const debugDmxControls = () => {
    console.log('🔧 DMX Control Debug Report');
    console.log('========================');
    
    // Check fixtures
    console.log(`📋 Total fixtures loaded: ${fixtures.length}`);
    if (fixtures.length === 0) {
      console.warn('❌ No fixtures loaded! Please add fixtures to the workspace first.');
      console.log('💡 Go to Fixture Creator page and create test fixtures.');
      return;
    }
    
    fixtures.forEach((fixture, index) => {
      console.log(`  ${index + 1}. ${fixture.name} (ID: ${fixture.id})`);
      console.log(`     Type: ${fixture.type || 'Generic'}`);
      console.log(`     Start Address: ${fixture.startAddress}`);
      console.log(`     Channels: ${fixture.channels.length}`);
      fixture.channels.forEach((channel, chIndex) => {
        console.log(`       ${chIndex}: ${channel.name} (${channel.type}) -> DMX ${channel.dmxAddress}`);
      });
    });
    
    // Check selection
    console.log(`\n🎯 Selection Status:`);
    console.log(`   Mode: ${selectionMode}`);
    console.log(`   Selected fixtures: ${selectedFixtures.length}`);
    console.log(`   Selected channels: ${selectedChannels.length}`);
    console.log(`   Selected groups: ${selectedGroups.length}`);
    
    if (selectionMode === 'fixtures' && selectedFixtures.length === 0) {
      console.warn('❌ No fixtures selected! Click on fixtures in the list or use "Select All" button.');
    }
    
    // Test affected fixtures
    const affected = getAffectedFixtures();
    console.log(`\n🎛️ Affected fixtures for controls: ${affected.length}`);
    affected.forEach(fixture => {
      console.log(`   - ${fixture.name} (${fixture.channels.length} channels)`);
    });
    
    if (affected.length === 0) {
      console.error('❌ ISSUE FOUND: No affected fixtures - controls will not work!');
      if (fixtures.length > 0 && selectedFixtures.length === 0) {
        console.log('💡 SOLUTION: Select fixtures by clicking on them or using "Select All" button');
      }
    } else {
      console.log('✅ Good: Fixtures are available for control');
    }
    
    // Test DMX functions
    console.log(`\n🔌 Testing DMX functions:`);
    try {
      const testChannel = 1;
      const currentValue = getDmxChannelValue(testChannel);
      console.log(`   getDmxChannelValue(${testChannel}) = ${currentValue} ✅`);
      
      console.log(`   Testing setDmxChannelValue(${testChannel}, 100)...`);
      setDmxChannelValue(testChannel, 100);
      console.log(`   ✅ setDmxChannelValue executed (check network tab for HTTP request)`);
    } catch (error) {
      console.error('❌ DMX function error:', error);
    }
    
    console.log('\n📝 Next Steps:');
    if (fixtures.length === 0) {
      console.log('1. Add fixtures using Fixture Creator');
    } else if (selectedFixtures.length === 0) {
      console.log('1. Select fixtures in SuperControl');
    } else {
      console.log('1. Move controls and check for DMX logs');
      console.log('2. Check Network tab for /api/dmx requests');
      console.log('3. Check server terminal for incoming requests');
    }
  };
  
  // Expose debug function to window for console access
  useEffect(() => {
    (window as any).debugDmxControls = debugDmxControls;
    console.log('🔧 Debug function available: window.debugDmxControls()');
    
    return () => {
      delete (window as any).debugDmxControls;
    };
  }, [fixtures, selectedFixtures, selectedChannels, selectedGroups, selectionMode]);
  return (
    <div className={styles.superControl}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3>
            <LucideIcon name="Settings" />
            Super Control
            {/* Status Indicators */}
            <div className={styles.statusIndicators}>
              {isFlashing && (
                <span className={`${styles.statusBadge} ${styles.flashStatus}`}>
                  <LucideIcon name="Zap" />
                  FLASH
                </span>
              )}
              {isStrobing && (
                <span className={`${styles.statusBadge} ${styles.strobeStatus}`}>
                  <LucideIcon name="Sun" />
                  STROBE
                </span>
              )}
              <span className={`${styles.statusBadge} ${styles.selectionStatus}`}>
                {getAffectedFixtures().length} selected
              </span>
            </div>
          </h3>
          <p>Advanced DMX Control Interface with Enhanced GOBO Controls</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.touchOscBtn}
            onClick={() => setShowTouchOscExport(true)}
            title="Export TouchOSC Layout"
          >
            <LucideIcon name="Smartphone" />
            TouchOSC
          </button>          <button
            className={styles.helpBtn}
            onClick={() => setShowOscHelp(true)}
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
        </div>        {selectionMode === 'fixtures' && (
          <div className={styles.fixtureList}>
            {fixtures.length === 0 ? (
              <div className={styles.noFixtures}>
                <LucideIcon name="AlertCircle" />
                <span>No fixtures available</span>
                <small>Add fixtures to the workspace to control them</small>
              </div>
            ) : (
              fixtures.map(fixture => (
                <div
                  key={fixture.id}
                  className={`${styles.fixtureItem} ${
                    selectedFixtures.includes(fixture.id) ? styles.selected : ''
                  } ${
                    (!fixture.startAddress || fixture.startAddress === 0 || fixture.channels.length === 0) ? styles.noDmxFixture : ''
                  }`}
                  onClick={() => {
                    console.log('[SuperControl] Clicking fixture ID:', fixture.id, 'Current name:', fixture.name);
                    console.log('[SuperControl] Current selectedFixtures (before toggle):', useStore.getState().selectedFixtures);
                    toggleFixtureSelection(fixture.id);
                    const newSelected = useStore.getState().selectedFixtures;
                    console.log('[SuperControl] selectedFixtures from store AFTER toggle:', newSelected);
                    console.log(`[SuperControl] Does new selection include ${fixture.id}? : ${newSelected.includes(fixture.id)}`);
                  }}
                >                  <div className={styles.fixtureInfo}>
                    <span className={styles.fixtureName}>{fixture.name}</span>
                    <span className={styles.fixtureType}>{fixture.type || 'Generic'}</span>
                  </div>
                  <div className={styles.fixtureDetails}>
                    <span className={styles.fixtureChannels}>
                      CH {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                    </span>
                    <span className={styles.channelCount}>
                      {fixture.channels.length} channels
                    </span>                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectionMode === 'groups' && (
          <div className={styles.fixtureList}>
            {groups.length === 0 ? (
              <div className={styles.noFixtures}>
                <LucideIcon name="Users" />
                <span>No fixture groups available</span>
                <small>Create fixture groups to organize your lighting</small>
              </div>
            ) : (
              groups.map(group => (
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
                  <div className={styles.fixtureInfo}>
                    <span className={styles.fixtureName}>{group.name}</span>
                    <span className={styles.fixtureType}>Group</span>
                  </div>
                  <div className={styles.fixtureDetails}>
                    <span className={styles.fixtureChannels}>
                      {group.fixtureIndices.length} fixtures
                    </span>                    <span className={styles.channelCount}>
                      {group.fixtureIndices.map(index => fixtures[index]?.name).filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}{selectionMode === 'capabilities' && (
          <div className={styles.fixtureList}>
            {getFixtureCapabilities().length === 0 ? (
              <div className={styles.noFixtures}>
                <LucideIcon name="Zap" />
                <span>No fixture capabilities detected</span>
                <small>Add fixtures with defined capabilities to group by function</small>
              </div>
            ) : (
              getFixtureCapabilities().map(capability => (
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
                  <div className={styles.fixtureInfo}>
                    <span className={styles.fixtureName}>{capability.type.toUpperCase()}</span>
                    <span className={styles.fixtureType}>Capability</span>
                  </div>
                  <div className={styles.fixtureDetails}>
                    <span className={styles.fixtureChannels}>
                      {capability.fixtures.length} fixtures
                    </span>                    <span className={styles.channelCount}>
                      {capability.fixtures.join(', ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selection Status and Quick Actions */}
      {getAffectedFixtures().length === 0 && (
        <div className={styles.selectionWarning}>
          <div className={styles.warningContent}>
            <LucideIcon name="AlertTriangle" />
            <span>No fixtures selected - controls will have no effect</span>
            <button 
              className={styles.selectAllBtn}
              onClick={() => {                if (selectionMode === 'fixtures') {
                  selectAllFixtures();
                } else if (selectionMode === 'groups') {
                  setSelectedGroups(groups.map(g => g.name));
                } else if (selectionMode === 'capabilities') {
                  setSelectedCapabilities(getFixtureCapabilities().map(c => c.type));                } else if (selectionMode === 'channels') {
                  // Select first 50 channels instead of all 512 to avoid UI lag
                  deselectAllChannels();
                  for (let i = 1; i <= 50; i++) {
                    selectChannel(i);
                  }
                }
              }}
            >
              Select All
            </button>
          </div>
        </div>
      )}      {/* Active Selection Summary */}
      {getAffectedFixtures().length > 0 && (
        <div className={styles.selectionSummary}>
          <LucideIcon name="Check" />
          <span>{getAffectedFixtures().length} fixture{getAffectedFixtures().length !== 1 ? 's' : ''} selected</span>
        </div>
      )}

      {/* Fixture Selection Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>
            <LucideIcon name="Target" />
            Fixture Selection
          </h4>
        </div>
        
        <div className={styles.selectionControls}>          <div className={styles.selectionButtonGrid}>
            <button 
              className={styles.selectionButton}
              onClick={() => {
                console.log('[SuperControl] "Next Fixture" clicked. Current fixtures count from store:', useStore.getState().fixtures.length);
                selectNextFixture();
              }}
              title="Select Next Fixture"
              disabled={fixtures.length < 2}
            >
              <LucideIcon name="ArrowRight" />
              Next
              <button 
                className={styles.midiLearnBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add MIDI Learn for fixture selection
                  console.log('MIDI Learn: Select Next Fixture');
                }}
                title="MIDI Learn: Select Next Fixture"
              >
                M
              </button>
            </button>
              <button 
              className={styles.selectionButton}
              onClick={() => {
                console.log('[SuperControl] "Previous Fixture" clicked. Current fixtures count from store:', useStore.getState().fixtures.length);
                selectPreviousFixture();
              }}
              title="Select Previous Fixture"
              disabled={fixtures.length < 2}
            >
              <LucideIcon name="ArrowLeft" />
              Previous
              <button 
                className={styles.midiLearnBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('MIDI Learn: Select Previous Fixture');
                }}
                title="MIDI Learn: Select Previous Fixture"
              >
                M
              </button>
            </button>
            
            <button 
              className={styles.selectionButton}
              onClick={() => {
                console.log('[SuperControl] "Select All" clicked. Current fixtures count from store:', useStore.getState().fixtures.length);
                selectAllFixtures();
              }}
              title="Select All Fixtures"
              disabled={fixtures.length === 0 || selectedFixtures.length === fixtures.length}
            >
              <LucideIcon name="CheckSquare" />
              All
              <button 
                className={styles.midiLearnBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('MIDI Learn: Select All Fixtures');
                }}
                title="MIDI Learn: Select All Fixtures"
              >
                M
              </button>
            </button>
            
            <button 
              className={styles.selectionButton}
              onClick={deselectAllFixtures}
              title="Deselect All Fixtures"
              disabled={selectedFixtures.length === 0}
            >
              <LucideIcon name="X" />
              None
              <button 
                className={styles.midiLearnBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('MIDI Learn: Deselect All Fixtures');
                }}
                title="MIDI Learn: Deselect All Fixtures"
              >
                M
              </button>
            </button>
          </div>
          
          <div className={styles.selectionByType}>
            <label>Select by Type:</label>
            <div className={styles.typeButtonGrid}>
              <button 
                className={styles.typeButton}
                onClick={() => selectFixturesByType('pan')}
                title="Select Moving Head Fixtures"
              >
                Moving Heads
              </button>
              
              <button 
                className={styles.typeButton}
                onClick={() => selectFixturesByType('red')}
                title="Select RGB/Color Fixtures"
              >
                RGB/Color
              </button>
              
              <button 
                className={styles.typeButton}
                onClick={() => selectFixturesByType('dimmer')}
                title="Select Dimmer Fixtures"
              >
                Dimmers
              </button>
              
              <button 
                className={styles.typeButton}
                onClick={() => selectFixturesByType('gobo')}
                title="Select Fixtures with Gobos"
              >
                Gobos
              </button>
            </div>
          </div>
          
          {groups.length > 0 && (
            <div className={styles.selectionByGroup}>
              <label>Select by Group:</label>
              <div className={styles.groupButtonGrid}>
                {groups.map(group => (
                  <button 
                    key={group.id}
                    className={styles.groupButton}
                    onClick={() => selectFixtureGroup(group.id)}
                    title={`Select group: ${group.name}`}
                  >
                    <LucideIcon name="Users" />
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>      {/* Enhanced Controls Layout with XY Pad */}
      <div className={styles.controlsMainGrid}>
        {/* Left Controls Column */}
        <div className={styles.leftControls}>
          {/* Movement & Position Controls */}
          <div className={styles.sliderSection}>
            <h4>Movement & Position</h4>
              {/* Focus Control */}
            <div className={styles.controlWithChannel}>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('focus')}</div>
            </div>

            {/* Zoom Control */}
            <div className={styles.controlWithChannel}>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('zoom')}</div>
            </div>

            {/* Iris Control */}
            <div className={styles.controlWithChannel}>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('iris')}</div>
            </div>
          </div>
        </div>

        {/* Center Controls - XY Pad and Color Wheel */}
        <div className={styles.centerControls}>          {/* Pan/Tilt XY Pad Control with Fine Adjustments */}
          <div className={styles.controlsSection}>
            <div className={styles.sectionHeader}>
              <h4>Pan/Tilt XY Control</h4>
            </div>
              <div 
              className={styles.xyPad}
              ref={xyPadRef}
              onMouseDown={handleXYPadMouseDown}
              onMouseMove={handleXYPadMouseMove}
              onMouseUp={handleXYPadMouseUp}
            >
              <div className={styles.xyGridLines} />
              
              {/* Autopilot Track Visualization */}
              {autopilotTrackEnabled && (
                <div className={styles.trackPath}>
                  <svg className={styles.trackSvg} viewBox="0 0 100 100">
                    <path
                      d={generateTrackPath()}
                      stroke="rgba(0, 255, 128, 0.4)"
                      strokeWidth="0.5"
                      fill="none"
                      strokeDasharray="2,2"
                    />                    {/* Current position indicator */}
                    <circle
                      cx={getVisualTrackIndicatorPosition(
                        autopilotTrackType,
                        autopilotTrackPosition,
                        autopilotTrackSize,
                        (autopilotTrackCenterX / 255) * 100, // Convert DMX to percentage for visual
                        (autopilotTrackCenterY / 255) * 100  // Convert DMX to percentage for visual
                      ).x}
                      cy={getVisualTrackIndicatorPosition(
                        autopilotTrackType,
                        autopilotTrackPosition,
                        autopilotTrackSize,
                        (autopilotTrackCenterX / 255) * 100, // Convert DMX to percentage for visual
                        (autopilotTrackCenterY / 255) * 100  // Convert DMX to percentage for visual
                      ).y}
                      r="1" // Radius of the indicator dot
                      fill="rgba(0, 255, 128, 0.8)"
                    />
                  </svg>
                </div>
              )}
              
              <div 
                className={styles.xyHandle}
                style={{
                  left: `${panTiltXY.x}%`,
                  top: `${panTiltXY.y}%`
                }}
              />
            </div>
            
            {/* Fine Controls underneath XY Pad */}
            <div className={styles.fineControls}>
            <div className={styles.fineControls}>
              <div className={styles.fineControlRow}>
                <label>Fine Pan</label>
                <div className={styles.fineControlInputs}>
                  <input 
                    type="range" 
                    min="0" 
                    max="255" 
                    value={finePanValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFinePanValue(val);
                      applyControl('finePan', val);
                    }}
                    className={styles.fineSlider}
                  />
                  <input 
                    type="number" 
                    min="0" 
                    max="255" 
                    value={finePanValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFinePanValue(val);
                      applyControl('finePan', val);
                    }}
                    className={styles.fineValueInput}
                  />
                </div>
                <div className={styles.fineChannelDisplay}>{getDmxChannelForControl('finePan')}</div>
              </div>
              
              <div className={styles.fineControlRow}>
                <label>Fine Tilt</label>
                <div className={styles.fineControlInputs}>
                  <input 
                    type="range" 
                    min="0" 
                    max="255" 
                    value={fineTiltValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFineTiltValue(val);
                      applyControl('fineTilt', val);
                    }}
                    className={styles.fineSlider}
                  />
                  <input 
                    type="number" 
                    min="0" 
                    max="255" 
                    value={fineTiltValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFineTiltValue(val);
                      applyControl('fineTilt', val);
                    }}
                    className={styles.fineValueInput}
                  />
                </div>
                <div className={styles.fineChannelDisplay}>{getDmxChannelForControl('fineTilt')}</div>
              </div>            </div>
            
            <div className={styles.panTiltControls}>
              <button 
                className={styles.centerResetBtn}
                onClick={resetPanTiltToCenter}
                title="Reset Pan/Tilt to center position"
              >
                <LucideIcon name="Target" />
                Reset to Center
              </button>
              <button 
                className={styles.fineResetBtn}
                onClick={() => {
                  setFinePanValue(0);
                  setFineTiltValue(0);
                  applyControl('finePan', 0);
                  applyControl('fineTilt', 0);
                }}
                title="Reset Fine adjustments to 0"
              >
                <LucideIcon name="RotateCcw" />
                Reset Fine
              </button>
            </div>
            
            <div className={styles.xyPositionDisplay}>
              <div className={styles.coarseValues}>
                <span>Pan: {panValue} <small>({getDmxChannelForControl('pan')})</small></span>
                <span>Tilt: {tiltValue} <small>({getDmxChannelForControl('tilt')})</small></span>
              </div>
              <div className={styles.fineValues}>
                <span>Fine Pan: {finePanValue}</span>
                <span>Fine Tilt: {fineTiltValue}</span>
              </div>            </div>
          </div>

          {/* Autopilot Track Controls */}
          <div className={styles.controlsSection}>
            <div className={styles.sectionHeader}>
              <h4>
                <LucideIcon name="Navigation" />
                Autopilot Track
              </h4>
              <button
                className={`${styles.autopilotToggle} ${autopilotTrackEnabled ? styles.active : ''}`}
                onClick={() => setAutopilotTrackEnabled(!autopilotTrackEnabled)}
                title={autopilotTrackEnabled ? "Disable Autopilot" : "Enable Autopilot"}
              >
                <LucideIcon name={autopilotTrackEnabled ? "Pause" : "Play"} />
                {autopilotTrackEnabled ? "Stop" : "Start"}
              </button>
            </div>
              {autopilotTrackEnabled && (
              <div className={styles.autopilotSettings}>
                <div className={styles.controlRow}>
                  <label>Track Type</label>                    <select
                      value={autopilotTrackType}                      onChange={(e) => {
                        setAutopilotTrackType(e.target.value as any);
                        // Trigger immediate update when track type changes
                        console.log('[AUTOPILOT] Track type changed to:', e.target.value);
                        setTimeout(() => {
                          console.log('[AUTOPILOT] Triggering updatePanTiltFromTrack after track type change');
                          updatePanTiltFromTrack();
                        }, 50);
                      }}
                      className={styles.autopilotSelect}
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="figure8">Figure 8</option>
                      <option value="triangle">Triangle</option>
                      <option value="linear">Linear</option>
                      <option value="random">Random</option>
                    </select>
                </div>

                <div className={styles.controlRow}>
                  <label>Position</label>
                  <div className={styles.controlInputs}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={autopilotTrackPosition}                      onChange={(e) => {
                        const newPosition = parseInt(e.target.value);
                        console.log('[AUTOPILOT] Position slider changed from', autopilotTrackPosition, 'to', newPosition);
                        setAutopilotTrackPosition(newPosition);
                        // Trigger immediate update when position changes
                        console.log('[AUTOPILOT] Position changed to:', newPosition);
                        
                        // Debug: Check if autopilot is enabled and fixtures are selected
                        if (!autopilotTrackEnabled) {
                          console.warn('[AUTOPILOT] WARNING: Autopilot not enabled - DMX update will be skipped');
                          return;
                        }
                        
                        if (selectedFixtures.length === 0 && fixtures.length > 0) {
                          console.warn('[AUTOPILOT] WARNING: No fixtures selected - consider selecting fixtures for targeted control');
                        }
                        
                        setTimeout(() => {
                          console.log('[AUTOPILOT] Triggering updatePanTiltFromTrack after position change');
                          updatePanTiltFromTrack();
                        }, 50);
                      }}
                      className={styles.slider}
                    />
                    <span className={styles.valueDisplay}>{autopilotTrackPosition}%</span>
                  </div>
                </div>
                
                <div className={styles.controlRow}>
                  <label>Speed</label>
                  <div className={styles.controlInputs}>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={autopilotTrackSpeed}
                      onChange={(e) => setAutopilotTrackSpeed(parseFloat(e.target.value))}
                      className={styles.slider}
                    />
                    <span className={styles.valueDisplay}>{autopilotTrackSpeed.toFixed(0)}x</span>
                  </div>
                </div>
                
                <div className={styles.controlRow}>
                  <label>Size</label>
                  <div className={styles.controlInputs}>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={autopilotTrackSize}                      onChange={(e) => {
                        setAutopilotTrackSize(parseInt(e.target.value));
                        // Trigger immediate update when size changes
                        console.log('[AUTOPILOT] Size changed to:', e.target.value);
                        setTimeout(() => {
                          console.log('[AUTOPILOT] Triggering updatePanTiltFromTrack after size change');
                          updatePanTiltFromTrack();
                        }, 50);
                      }}
                      className={styles.slider}
                    />
                    <span className={styles.valueDisplay}>{autopilotTrackSize}%</span>
                  </div>
                </div>
                  <div className={styles.controlRow}>
                  <label>Center X</label>
                  <div className={styles.controlInputs}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(autopilotTrackCenterX / 255) * 100}                      onChange={(e) => {
                        const percentValue = parseInt(e.target.value);
                        const dmxValue = Math.round((percentValue / 100) * 255);
                        setAutopilotTrackCenter(dmxValue, autopilotTrackCenterY);
                        // Trigger immediate update when center changes
                        console.log('[AUTOPILOT] Center X changed to:', percentValue, '% (DMX:', dmxValue, ')');
                        setTimeout(() => {
                          console.log('[AUTOPILOT] Triggering updatePanTiltFromTrack after center X change');
                          updatePanTiltFromTrack();
                        }, 50);
                      }}
                      className={styles.slider}
                    />
                    <span className={styles.valueDisplay}>{Math.round((autopilotTrackCenterX / 255) * 100)}%</span>
                  </div>
                </div>
                
                <div className={styles.controlRow}>
                  <label>Center Y</label>
                  <div className={styles.controlInputs}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(autopilotTrackCenterY / 255) * 100}                      onChange={(e) => {
                        const percentValue = parseInt(e.target.value);
                        const dmxValue = Math.round((percentValue / 100) * 255);
                        setAutopilotTrackCenter(autopilotTrackCenterX, dmxValue);
                        // Trigger immediate update when center changes
                        console.log('[AUTOPILOT] Center Y changed to:', percentValue, '% (DMX:', dmxValue, ')');
                        setTimeout(() => {
                          console.log('[AUTOPILOT] Triggering updatePanTiltFromTrack after center Y change');
                          updatePanTiltFromTrack();
                        }, 50);
                      }}
                      className={styles.slider}
                    />
                    <span className={styles.valueDisplay}>{Math.round((autopilotTrackCenterY / 255) * 100)}%</span>
                  </div>
                </div>
                  <div className={styles.controlRow}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      updatePanTiltFromTrack();
                    }}
                    title="Apply current track position to fixtures"
                  >
                    <LucideIcon name="Target" />
                    Apply Position
                  </button>                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      setAutopilotTrackCenter(127, 127); // DMX center values
                      setAutopilotTrackSize(50);
                      setAutopilotTrackSpeed(1);
                      setAutopilotTrackPosition(0);
                      // Trigger immediate update after reset
                      console.log('[AUTOPILOT] Reset button clicked');
                      setTimeout(() => {
                        console.log('[AUTOPILOT] Triggering updatePanTiltFromTrack after reset');
                        updatePanTiltFromTrack();
                      }, 50);
                    }}
                    title="Reset to default values"
                  >
                    <LucideIcon name="RotateCcw" />
                    Reset
                  </button>
                  <button
                    className={`${styles.actionBtn} ${autopilotTrackAutoPlay ? styles.active : ''}`}
                    onClick={() => setAutopilotTrackAutoPlay(!autopilotTrackAutoPlay)}
                    title={autopilotTrackAutoPlay ? "Disable Auto Loop" : "Enable Auto Loop"}
                  >
                    <LucideIcon name="Repeat" />
                    Auto Loop
                  </button>                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      console.log('🔧 ENHANCED AUTOPILOT DEBUG REPORT');
                      console.log('===================================');
                      
                      // Basic autopilot state
                      console.log('📊 Autopilot State:');
                      console.log('  Enabled:', autopilotTrackEnabled);
                      console.log('  Track type:', autopilotTrackType);
                      console.log('  Position:', autopilotTrackPosition, '%');
                      console.log('  Size:', autopilotTrackSize, '%');
                      console.log('  Center X:', autopilotTrackCenterX, '(DMX) =', Math.round((autopilotTrackCenterX / 255) * 100), '%');
                      console.log('  Center Y:', autopilotTrackCenterY, '(DMX) =', Math.round((autopilotTrackCenterY / 255) * 100), '%');
                      console.log('  Auto play:', autopilotTrackAutoPlay);
                      console.log('  Speed:', autopilotTrackSpeed, 'x');
                      
                      // Fixture analysis
                      console.log('\n🎯 Fixture Analysis:');
                      console.log('  Total fixtures:', fixtures.length);
                      console.log('  Selected fixtures:', selectedFixtures.length);
                      
                      if (fixtures.length === 0) {
                        console.error('❌ CRITICAL: No fixtures loaded!');
                        console.log('💡 Solution: Go to Fixture Creator and add fixtures');
                        return;
                      }
                      
                      if (selectedFixtures.length === 0) {
                        console.warn('⚠️ WARNING: No fixtures selected!');
                        console.log('💡 Solution: Select fixtures in the fixture list');
                      }
                      
                      // Check fixtures for Pan/Tilt channels
                      const targetFixtures = selectedFixtures.length > 0 
                        ? fixtures.filter(f => selectedFixtures.includes(f.id))
                        : fixtures;
                        
                      console.log('  Target fixtures for autopilot:', targetFixtures.length);
                      
                      let panChannels = 0;
                      let tiltChannels = 0;
                      
                      targetFixtures.forEach((fixture, index) => {
                        console.log(`    ${index + 1}. ${fixture.name} (${fixture.channels.length} channels)`);
                        
                        fixture.channels.forEach(channel => {
                          if (channel.type.toLowerCase() === 'pan') {
                            panChannels++;
                            console.log(`      ✅ Pan channel: ${channel.name} -> DMX ${channel.dmxAddress}`);
                          } else if (channel.type.toLowerCase() === 'tilt') {
                            tiltChannels++;
                            console.log(`      ✅ Tilt channel: ${channel.name} -> DMX ${channel.dmxAddress}`);
                          }
                        });
                      });
                      
                      console.log(`  Pan channels found: ${panChannels}`);
                      console.log(`  Tilt channels found: ${tiltChannels}`);
                      
                      if (panChannels === 0 || tiltChannels === 0) {
                        console.error('❌ CRITICAL: No Pan/Tilt channels found!');
                        console.log('💡 Solution: Ensure fixtures have channels with type "pan" and "tilt"');
                        return;
                      }
                      
                      // Test calculation
                      console.log('\n🧮 Track Position Calculation:');
                      try {
                        const { pan, tilt } = calculateTrackPosition(
                          autopilotTrackType,
                          autopilotTrackPosition,
                          autopilotTrackSize,
                          autopilotTrackCenterX,
                          autopilotTrackCenterY
                        );
                        console.log('  Calculated Pan:', pan, '(DMX 0-255)');
                        console.log('  Calculated Tilt:', tilt, '(DMX 0-255)');
                        
                        // Visual bounds check
                        const visualCenterX = (autopilotTrackCenterX / 255) * 100;
                        const visualCenterY = (autopilotTrackCenterY / 255) * 100;
                        const baseRadius = autopilotTrackSize / 2;
                        const maxRadiusX = Math.min(visualCenterX, 100 - visualCenterX);
                        const maxRadiusY = Math.min(visualCenterY, 100 - visualCenterY);
                        const maxRadius = Math.min(maxRadiusX, maxRadiusY, 45);
                        const constrainedRadius = Math.min(baseRadius, maxRadius);
                        
                        console.log('\n📐 Visual Bounds Analysis:');
                        console.log('  Visual center:', visualCenterX.toFixed(1), ',', visualCenterY.toFixed(1), '%');
                        console.log('  Requested radius:', baseRadius, '%');
                        console.log('  Max allowed radius:', maxRadius.toFixed(1), '%');
                        console.log('  Constrained radius:', constrainedRadius.toFixed(1), '%');
                        
                        if (constrainedRadius < baseRadius) {
                          console.warn('⚠️ Track size constrained to fit bounds');
                        } else {
                          console.log('✅ Track fits within bounds');
                        }
                        
                      } catch (error) {
                        console.error('❌ Calculation error:', error);
                        return;
                      }
                      
                      // Test DMX update
                      console.log('\n🔌 Testing DMX Update:');
                      console.log('  Triggering updatePanTiltFromTrack()...');
                      try {
                        updatePanTiltFromTrack();
                        console.log('✅ DMX update function called successfully');
                        console.log('💡 Check console for [STORE] updatePanTiltFromTrack messages');
                        console.log('💡 Check Network tab for DMX HTTP requests');
                      } catch (error) {
                        console.error('❌ DMX update error:', error);
                      }
                      
                      console.log('\n📋 Summary:');
                      if (autopilotTrackEnabled && targetFixtures.length > 0 && panChannels > 0 && tiltChannels > 0) {
                        console.log('✅ Autopilot should be working - check for DMX updates in console/network');
                      } else {
                        console.log('❌ Issues found - fix the problems listed above');
                      }
                    }}
                    title="Enhanced autopilot debug with full analysis"
                  >
                    <LucideIcon name="Bug" />
                    Debug
                  </button>
                </div>
              </div>
            )}
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
            
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', justifyContent: 'center', marginTop: '10px' }}>
              <span style={{ color: '#ff6b6b' }}>R: {red} <small>({getDmxChannelForControl('red')})</small></span>
              <span style={{ color: '#51cf66' }}>G: {green} <small>({getDmxChannelForControl('green')})</small></span>
              <span style={{ color: '#339af0' }}>B: {blue} <small>({getDmxChannelForControl('blue')})</small></span>
            </div>
          </div>
        </div>

        {/* Right Controls Column */}
        <div className={styles.rightControls}>
          {/* Basic Controls */}
          <div className={styles.sliderSection}>
            <h4>Basic Controls</h4>
            
            {/* Dimmer Control */}
            <div className={styles.controlWithChannel}>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('dimmer')}</div>
            </div>

            {/* Shutter Control */}
            <div className={styles.controlWithChannel}>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('shutter')}</div>
            </div>

            {/* Strobe Control */}
            <div className={styles.controlWithChannel}>
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
                />
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('strobe')}</div>
            </div>

            {/* GOBO Control */}
            <div className={styles.controlWithChannel}>
              <label>GOBO</label>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('gobo')}</div>
            </div>

            {/* Color Wheel Control */}
            <div className={styles.controlWithChannel}>
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
              </div>
              <div className={styles.channelDisplay}>{getDmxChannelForControl('colorWheel')}</div>
            </div>
          </div>
        </div>
      </div>      {/* Additional Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.sectionHeader}>
          <h4>Additional Controls</h4>
        </div>
          <div className={styles.controlGrid}>
          {/* Enhanced GOBO Control with Presets */}
          <div className={styles.goboSection}>
            <label>GOBO Selection</label>
            <div className={styles.goboPresets}>
              {goboPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.goboPresetBtn} ${gobo === preset.value ? styles.active : ''}`}
                  onClick={() => {
                    setGobo(preset.value);
                    applyControl('gobo', preset.value);
                  }}
                  title={`${preset.name} (${preset.value})`}
                >
                  <span className={styles.goboIcon}>{preset.icon}</span>
                  <span className={styles.goboName}>{preset.name}</span>
                </button>
              ))}
            </div>
            
            {/* GOBO Fine Control */}
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

          {/* GOBO Rotation Control */}
          <div className={styles.controlRow}>
            <label>GOBO Rotation</label>
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

          {/* Enhanced Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionBtn} ${styles.flashBtn} ${isFlashing ? styles.active : ''}`}
              onClick={handleFlash}
              disabled={isFlashing}
              title="Flash (Quick Bright Pulse)"
            >
              <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Flash
            </button>

            <button
              className={`${styles.actionBtn} ${styles.strobeBtn} ${isStrobing ? styles.active : ''}`}
              onClick={handleStrobe}
              title={isStrobing ? "Stop Strobing" : "Start Strobing"}
            >
              <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="4" />
                <path d="m21.17 8.17-2.83-2.83" />
                <path d="m6.66 8.17 2.83-2.83" />
                <path d="m21.17 15.83-2.83 2.83" />
                <path d="m6.66 15.83 2.83 2.83" />
                <path d="M8.17 21.17 8.17 18.34" />
                <path d="M15.83 21.17 15.83 18.34" />
                <path d="M8.17 6.66 8.17 2.83" />
                <path d="M15.83 6.66 15.83 2.83" />
              </svg>
              {isStrobing ? 'Stop' : 'Strobing'}
            </button>

            <button
              className={`${styles.actionBtn} ${styles.resetBtn}`}
              onClick={handleResetAll}
              title="Reset All Controls to Default"
            >
              <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Reset All
            </button>
          </div>

          {/* Flash/Strobe Speed Controls */}
          <div className={styles.speedControls}>
            <div className={styles.controlRow}>
              <label>Flash Speed (ms)</label>
              <div className={styles.controlInputs}>
                <input 
                  type="range" 
                  min="50" 
                  max="500" 
                  value={flashSpeed}
                  onChange={(e) => setFlashSpeed(parseInt(e.target.value))}
                  className={styles.slider}
                />
                <input 
                  type="number" 
                  min="50" 
                  max="500" 
                  value={flashSpeed}
                  onChange={(e) => setFlashSpeed(parseInt(e.target.value) || 100)}
                  className={styles.valueInput}
                />
              </div>
            </div>

            <div className={styles.controlRow}>
              <label>Strobe Speed</label>
              <div className={styles.controlInputs}>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={strobeSpeed}
                  onChange={(e) => setStrobeSpeed(parseInt(e.target.value))}
                  className={styles.slider}
                />
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={strobeSpeed}
                  onChange={(e) => setStrobeSpeed(parseInt(e.target.value) || 10)}
                  className={styles.valueInput}
                />
              </div>
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

      {/* OSC Help Modal */}
      {showOscHelp && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>OSC Addresses Reference</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowOscHelp(false)}
              >
                <LucideIcon name="X" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>OSC control addresses for the SuperControl interface:</p>
              
              <div className={styles.oscAddressSection}>
                <h4>Basic Controls</h4>
                <div className={styles.oscAddressList}>
                  <div className={styles.oscAddress}>
                    <code>/dimmer</code>
                    <span>Master Dimmer (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/red</code>
                    <span>Red Color (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/green</code>
                    <span>Green Color (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/blue</code>
                    <span>Blue Color (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/white</code>
                    <span>White Color (0.0 - 1.0)</span>
                  </div>
                </div>
              </div>

              <div className={styles.oscAddressSection}>
                <h4>Movement Controls</h4>
                <div className={styles.oscAddressList}>
                  <div className={styles.oscAddress}>
                    <code>/pan</code>
                    <span>Pan Position (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/tilt</code>
                    <span>Tilt Position (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/xy</code>
                    <span>Combined Pan/Tilt (x, y values 0.0 - 1.0)</span>
                  </div>
                </div>
              </div>

              <div className={styles.oscAddressSection}>
                <h4>GOBO & Effects</h4>
                <div className={styles.oscAddressList}>
                  <div className={styles.oscAddress}>
                    <code>/gobo</code>
                    <span>GOBO Selection (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/gobo_rotation</code>
                    <span>GOBO Rotation (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/strobe</code>
                    <span>Strobe Speed (0.0 - 1.0)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/focus</code>
                    <span>Focus/Zoom (0.0 - 1.0)</span>
                  </div>
                </div>
              </div>

              <div className={styles.oscAddressSection}>
                <h4>Scene Control</h4>
                <div className={styles.oscAddressList}>
                  <div className={styles.oscAddress}>
                    <code>/scene/save</code>
                    <span>Save Current Scene (bang/trigger)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/scene/prev</code>
                    <span>Previous Scene (bang/trigger)</span>
                  </div>
                  <div className={styles.oscAddress}>
                    <code>/scene/next</code>
                    <span>Next Scene (bang/trigger)</span>
                  </div>
                </div>
              </div>

              <div className={styles.oscInfo}>
                <h4>Usage Notes</h4>
                <ul>
                  <li>All values should be normalized between 0.0 and 1.0</li>
                  <li>Bang/trigger messages can be sent with any value</li>
                  <li>Default OSC port: 8000 (configurable in settings)</li>
                  <li>Use TouchOSC or similar apps to control remotely</li>
                </ul>
              </div>
              
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowOscHelp(false)}
                >
                  Close
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
          </div>        )}
      </div>
      </div>
    </div>
  );
};

export default SuperControl;
