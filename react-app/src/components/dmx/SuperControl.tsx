import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './SuperControl.module.scss';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
    setDmxChannelValue
  } = useStore();

  // Layout state
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('superControlLayouts');
      if (savedLayouts) {
        return JSON.parse(savedLayouts);
      }
    } catch (e) {
      console.error("Could not parse layouts from local storage", e);
    }
    return {
      lg: [
        { i: 'selection', x: 0, y: 0, w: 3, h: 5 },
        { i: 'monitoring', x: 3, y: 0, w: 9, h: 5 },
        { i: 'midi-osc', x: 0, y: 5, w: 12, h: 4 },
        { i: 'scenes', x: 6, y: 9, w: 6, h: 8 },
        { i: 'basic-controls', x: 0, y: 9, w: 6, h: 3 },
        { i: 'pan-tilt', x: 6, y: 17, w: 6, h: 6 },
        { i: 'rgb', x: 0, y: 12, w: 6, h: 6 },
        { i: 'effects', x: 0, y: 18, w: 6, h: 7 },
        { i: 'dmx-channels', x: 0, y: 25, w: 12, h: 5 },
      ]
    };
  });

  const onLayoutChange = (layout, allLayouts) => {
    try {
      localStorage.setItem('superControlLayouts', JSON.stringify(allLayouts));
      setLayouts(allLayouts);
    } catch (e) {
      console.error("Could not save layouts to local storage", e);
    }
  };

  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('channels');
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  // Control values state
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
  const [oscAddresses, setOscAddresses] = useState<Record<string, string>>({});
  // Enhanced MIDI Learn state with range support
  const [midiMappings, setMidiMappings] = useState<Record<string, {
    channel?: number;
    note?: number;
    cc?: number;
    minValue: number;
    maxValue: number;
    oscAddress?: string;
  }>>({});

  // Fixture/Group navigation state
  const [currentFixtureIndex, setCurrentFixtureIndex] = useState(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  // Scene management state
  const [scenes, setScenes] = useState<Array<{
    id: string;
    name: string;
    values: Record<number, number>; // DMX channel -> value
    timestamp: number;
  }>>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneAutoSave, setSceneAutoSave] = useState(false);

  // Get fixture capabilities (fixtures grouped by shared channel types)
  const getFixtureCapabilities = (): FixtureCapability[] => {
    const capabilities: Record<string, string[]> = {};
    
    fixtures.forEach(fixture => {
      fixture.channels.forEach(channel => {
        const type = channel.type.toLowerCase();
        if (!capabilities[type]) {
          capabilities[type] = [];
        }
        if (!capabilities[type].includes(fixture.id)) {
          capabilities[type].push(fixture.id);
        }
      });
    });

    return Object.entries(capabilities).map(([type, fixtureIds]) => ({
      type,
      fixtures: fixtureIds
    })).filter(cap => cap.fixtures.length > 1); // Only show capabilities shared by multiple fixtures
  };
  // Get all affected fixtures based on selection mode
  const getAffectedFixtures = () => {
    let targetFixtures: string[] = [];
    console.log(`getAffectedFixtures called - selectionMode: ${selectionMode}`);
    console.log(`Selected channels: ${selectedChannels.length}`, selectedChannels);
    console.log(`Selected fixtures: ${selectedFixtures.length}`, selectedFixtures);
    console.log(`Selected groups: ${selectedGroups.length}`, selectedGroups);

    switch (selectionMode) {
      case 'channels':
        if (selectedChannels.length === 0) return [];
        
        const affectedFixtures: Array<{
          fixture: any;
          channels: { [key: string]: number };
        }> = [];

        fixtures.forEach(fixture => {
          const fixtureChannels: { [key: string]: number } = {};
          let hasSelectedChannel = false;          fixture.channels.forEach((channel, index) => {
            const dmxAddress = fixture.startAddress + index - 1;
            if (selectedChannels.includes(dmxAddress)) {
              hasSelectedChannel = true;
              fixtureChannels[channel.type.toLowerCase()] = dmxAddress;
            }
          });

          if (hasSelectedChannel) {
            affectedFixtures.push({
              fixture,
              channels: fixtureChannels
            });
          }
        });

        return affectedFixtures;

      case 'fixtures':
        targetFixtures = selectedFixtures;
        break;

      case 'groups':
        targetFixtures = selectedGroups.flatMap(groupId => {
          const group = groups.find(g => g.id === groupId);
          return group ? group.fixtureIndices.map(idx => fixtures[idx]?.id).filter(Boolean) : [];
        });
        break;

      case 'capabilities':
        const capabilities = getFixtureCapabilities();
        targetFixtures = selectedCapabilities.flatMap(capType => {
          const capability = capabilities.find(c => c.type === capType);
          return capability ? capability.fixtures : [];
        });
        break;
    }

    return targetFixtures
      .map(fixtureId => {
        const fixture = fixtures.find(f => f.id === fixtureId);
        if (!fixture) return null;      
        const fixtureChannels: { [key: string]: number } = {};
        fixture.channels.forEach((channel, index) => {
          const dmxAddress = fixture.startAddress + index - 1;
          fixtureChannels[channel.type.toLowerCase()] = dmxAddress;
        });

        return {
          fixture,
          channels: fixtureChannels
        };
      })
      .filter((item): item is { fixture: any; channels: { [key: string]: number } } => item !== null);
  };

  // Apply control value to DMX channels
  const applyControl = (controlType: string, value: number) => {
    const affectedFixtures = getAffectedFixtures();
    console.log(`applyControl called: type=${controlType}, value=${value}, fixtures=${affectedFixtures.length}`);
    
    affectedFixtures.forEach(({ channels }, index) => {
      let targetChannel: number | undefined;

      switch (controlType) {
        case 'dimmer':
          targetChannel = channels['dimmer'] || channels['intensity'] || channels['master'];
          break;
        case 'pan':
          targetChannel = channels['pan'];
          break;
        case 'tilt':
          targetChannel = channels['tilt'];
          break;
        case 'red':
          targetChannel = channels['red'] || channels['r'];
          break;
        case 'green':
          targetChannel = channels['green'] || channels['g'];
          break;
        case 'blue':
          targetChannel = channels['blue'] || channels['b'];
          break;
        case 'gobo':
          targetChannel = channels['gobo'] || channels['gobowheel'] || channels['gobo_wheel'];
          break;
        case 'shutter':
          targetChannel = channels['shutter'];
          break;        case 'strobe':
          targetChannel = channels['strobe'];
          break;
        case 'lamp':
          targetChannel = channels['lamp'] || channels['lamp_on'] || channels['lamp_control'];
          break;
        case 'reset':
          targetChannel = channels['reset'] || channels['reset_control'] || channels['function'];
          break;      }      if (targetChannel !== undefined) {
        console.log(`[DMX] Setting channel ${targetChannel} to ${value} for ${controlType}`);
        setDmxChannelValue(targetChannel, value);
        
        // Additional verification - check if the value was actually set
        setTimeout(() => {
          const actualValue = getDmxChannelValue(targetChannel);
          console.log(`[DMX] Verification: Channel ${targetChannel} is now ${actualValue} (expected ${value})`);
        }, 100);
      } else {
        console.log(`[DMX] ERROR: No target channel found for ${controlType} in fixture ${index}`, channels);
      }
    });
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
    setTiltValue(tiltVal);    applyControl('pan', panVal);
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
    };  };
  // Enhanced MIDI Learn with range support
  const startMidiLearn = (controlType: string, minValue: number = 0, maxValue: number = 255) => {
    setMidiLearnTarget(controlType);
    console.log(`Starting MIDI learn for ${controlType} (range: ${minValue}-${maxValue})`);
    
    // Listen for MIDI input
    const handleMidiMessage = (event: any) => {
      const [status, data1, data2] = event.data;
      const channel = status & 0x0F;
      const messageType = status & 0xF0;
      
      let mapping: any = { channel, minValue, maxValue };
      
      if (messageType === 0x90 || messageType === 0x80) { // Note on/off
        mapping.note = data1;
      } else if (messageType === 0xB0) { // Control Change
        mapping.cc = data1;
      }
      
      setMidiMappings(prev => ({
        ...prev,
        [controlType]: mapping
      }));
      
      setMidiLearnTarget(null);
      console.log(`MIDI learned for ${controlType}:`, mapping);
    };

    // Add MIDI listener
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values());
        inputs.forEach(input => {
          input.addEventListener('midimessage', handleMidiMessage);
          
          // Remove listener after 5 seconds or when learning is complete
          setTimeout(() => {
            input.removeEventListener('midimessage', handleMidiMessage);
            if (midiLearnTarget === controlType) {
              setMidiLearnTarget(null);
            }
          }, 5000);
        });
      }).catch(err => {
        console.error('MIDI access denied:', err);
        setMidiLearnTarget(null);
      });
    }
  };

  // Handle MIDI-triggered actions
  useEffect(() => {
    const handleMidiInput = (event: any) => {
      const [status, data1, data2] = event.data;
      const channel = status & 0x0F;
      const messageType = status & 0xF0;
      
      Object.entries(midiMappings).forEach(([action, mapping]) => {
        if (mapping.channel !== channel) return;
        
        let midiValue = 0;
        let triggered = false;
        
        if (mapping.note !== undefined && (messageType === 0x90 || messageType === 0x80)) {
          if (mapping.note === data1) {
            triggered = data2 > 0; // Note on with velocity > 0
            midiValue = data2;
          }
        } else if (mapping.cc !== undefined && messageType === 0xB0) {
          if (mapping.cc === data1) {
            triggered = true;
            midiValue = data2;
          }
        }
          if (triggered) {
          // Scale MIDI value (0-127) to control range
          const scaledValue = Math.round(
            mapping.minValue + (midiValue / 127) * (mapping.maxValue - mapping.minValue)
          );
          
          console.log(`MIDI triggered for ${action}: value=${midiValue}, scaled=${scaledValue}`);
          
          // Check affected fixtures before applying control
          const affectedFixtures = getAffectedFixtures();
          console.log(`Affected fixtures for ${action}:`, affectedFixtures.length, affectedFixtures);
          
          // Apply the action based on the control type
          switch (action) {
            case 'dimmer':
              setDimmer(scaledValue);
              applyControl('dimmer', scaledValue);
              break;
            case 'pan':
              setPanValue(scaledValue);
              setPanTiltXY(prev => ({ ...prev, x: (scaledValue / 255) * 100 }));
              applyControl('pan', scaledValue);
              break;
            case 'tilt':
              setTiltValue(scaledValue);
              setPanTiltXY(prev => ({ ...prev, y: (scaledValue / 255) * 100 }));
              applyControl('tilt', scaledValue);
              break;
            case 'red':
              setRed(scaledValue);
              applyControl('red', scaledValue);
              break;
            case 'green':
              setGreen(scaledValue);
              applyControl('green', scaledValue);
              break;
            case 'blue':
              setBlue(scaledValue);
              applyControl('blue', scaledValue);
              break;
            case 'gobo':
              setGobo(scaledValue);
              applyControl('gobo', scaledValue);
              break;
            case 'shutter':
              setShutter(scaledValue);
              applyControl('shutter', scaledValue);
              break;
            case 'strobe':
              setStrobe(scaledValue);
              applyControl('strobe', scaledValue);
              break;
            case 'lamp':
              setLamp(scaledValue);
              applyControl('lamp', scaledValue);
              break;
            case 'reset':
              setReset(scaledValue);
              applyControl('reset', scaledValue);
              break;case 'fixture_next':
              if (midiValue > 63) selectNextFixture();
              break;
            case 'fixture_prev':
            case 'fixture_previous':
              if (midiValue > 63) selectPreviousFixture();
              break;
            case 'group_next':
              if (midiValue > 63) selectNextGroup();
              break;
            case 'group_prev':
            case 'group_previous':
              if (midiValue > 63) selectPreviousGroup();
              break;
            case 'scene_next':
              if (midiValue > 63) selectNextScene();
              break;
            case 'scene_prev':
            case 'scene_previous':
              if (midiValue > 63) selectPreviousScene();
              break;
            case 'scene_save':
            case 'scene_capture':
              if (midiValue > 63) captureCurrentScene();
              break;
            case 'scene_load':
              if (midiValue > 63) loadScene(currentSceneIndex);
              break;
          }
        }
      });
    };

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values());
        inputs.forEach(input => {
          input.addEventListener('midimessage', handleMidiInput);
        });

        return () => {
          inputs.forEach(input => {
            input.removeEventListener('midimessage', handleMidiInput);
          });
        };
      });
    }
  }, [midiMappings, currentSceneIndex, scenes]);

  const stopMidiLearn = () => {
    setMidiLearnTarget(null);
  };

  const setMidiMapping = (controlType: string, midiData: {
    channel?: number;
    note?: number;
    cc?: number;
    minValue: number;
    maxValue: number;
    oscAddress?: string;
  }) => {
    setMidiMappings(prev => ({
      ...prev,
      [controlType]: midiData
    }));
  };

  const clearMidiMapping = (controlType: string) => {
    setMidiMappings(prev => {
      const updated = { ...prev };
      delete updated[controlType];
      return updated;
    });
  };

  // Fixture Navigation Functions
  const selectNextFixture = () => {
    if (fixtures.length === 0) return;
    const nextIndex = (currentFixtureIndex + 1) % fixtures.length;
    setCurrentFixtureIndex(nextIndex);
    setSelectedFixtures([fixtures[nextIndex].id]);
    setSelectionMode('fixtures');
  };

  const selectPreviousFixture = () => {
    if (fixtures.length === 0) return;
    const prevIndex = currentFixtureIndex === 0 ? fixtures.length - 1 : currentFixtureIndex - 1;
    setCurrentFixtureIndex(prevIndex);
    setSelectedFixtures([fixtures[prevIndex].id]);
    setSelectionMode('fixtures');
  };

  const selectNextGroup = () => {
    if (groups.length === 0) return;
    const nextIndex = (currentGroupIndex + 1) % groups.length;
    setCurrentGroupIndex(nextIndex);
    setSelectedGroups([groups[nextIndex].id]);
    setSelectionMode('groups');
  };

  const selectPreviousGroup = () => {
    if (groups.length === 0) return;
    const prevIndex = currentGroupIndex === 0 ? groups.length - 1 : currentGroupIndex - 1;
    setCurrentGroupIndex(prevIndex);
    setSelectedGroups([groups[prevIndex].id]);
    setSelectionMode('groups');
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

  // MIDI/OSC Integration for Navigation and Scenes
  const setupNavigationMidiOsc = () => {
    // These would be called when MIDI/OSC messages are received
    const midiHandlers = {
      'fixture_next': selectNextFixture,
      'fixture_previous': selectPreviousFixture,
      'group_next': selectNextGroup,
      'group_previous': selectPreviousGroup,
      'scene_save': () => captureCurrentScene(),
      'scene_next': selectNextScene,
      'scene_previous': selectPreviousScene,
    };
    
    return midiHandlers;
  };

  // Get selection info
  const getSelectionInfo = () => {
    const affected = getAffectedFixtures();
    
    switch (selectionMode) {
      case 'channels':
        return selectedChannels.length === 0 
          ? 'Select DMX channels to control' 
          : `Controlling ${selectedChannels.length} channel(s) across ${affected.length} fixture(s)`;
      case 'fixtures':
        return selectedFixtures.length === 0
          ? 'Select fixtures to control'
          : `Controlling ${selectedFixtures.length} fixture(s)`;
      case 'groups':
        return selectedGroups.length === 0
          ? 'Select groups to control'
          : `Controlling ${selectedGroups.length} group(s) (${affected.length} fixtures)`;
      case 'capabilities':
        return selectedCapabilities.length === 0
          ? 'Select capabilities to control'
          : `Controlling ${selectedCapabilities.length} capability type(s) (${affected.length} fixtures)`;
    }
  };

  const hasSelection = getAffectedFixtures().length > 0;
  const capabilities = getFixtureCapabilities();

  // Global mouse event handlers for drag operations
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingXY) {
        const mouseEvent = e as any;
        mouseEvent.clientX = e.clientX;
        mouseEvent.clientY = e.clientY;
        updateXYPosition(mouseEvent);
      }
      if (isDraggingColor) {
        const mouseEvent = e as any;
        mouseEvent.clientX = e.clientX;
        mouseEvent.clientY = e.clientY;
        updateColorPosition(mouseEvent);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingXY(false);
      setIsDraggingColor(false);
    };

    if (isDraggingXY || isDraggingColor) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingXY, isDraggingColor]);

  return (
    <div className={styles.superControl}>
      <div className={styles.header}>
        <h3>
          <LucideIcon name="Settings" />
          Super Control
        </h3>
        <p>{getSelectionInfo()}</p>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        draggableHandle={`.${styles.gridItemHeader}`}
      >
        <div key="selection" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="ListChecks" /> Selection
          </div>
          <div className={styles.gridItemContent}>
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
                      key={fixture.id}
                      className={`${styles.fixtureItem} ${selectedFixtures.includes(fixture.id) ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedFixtures(prev => 
                          prev.includes(fixture.id) 
                            ? prev.filter(id => id !== fixture.id)
                            : [...prev, fixture.id]
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
                      key={group.id}
                      className={`${styles.fixtureItem} ${selectedGroups.includes(group.id) ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedGroups(prev => 
                          prev.includes(group.id) 
                            ? prev.filter(id => id !== group.id)
                            : [...prev, group.id]
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
                <div className={styles.fixtureList}>            {capabilities.map(capability => (
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
          </div>
        </div>

        <div key="monitoring" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="Activity" /> Monitoring
          </div>
          <div className={styles.gridItemContent}>
            {/* Channel/Fixture Monitoring */}
            {hasSelection ? (
              <div className={styles.monitoringSection}>
                <div className={styles.sectionHeader}>
                  <h4>
                    <LucideIcon name="Activity" />
                    Active Channels & Values
                  </h4>
                  <span className={styles.totalFixtures}>
                    {getAffectedFixtures().length} fixture(s) selected
                  </span>
                </div>
                
                <div className={styles.channelMonitor}>
                  {getAffectedFixtures().map(({ fixture, channels }, index) => (
                    <div key={`${fixture.id}-${index}`} className={styles.fixtureMonitor}>
                      <div className={styles.fixtureHeader}>
                        <LucideIcon name="Lightbulb" />
                        <span className={styles.fixtureName}>{fixture.name}</span>
                        <span className={styles.fixtureRange}>
                          CH {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                        </span>
                      </div>
                      
                      <div className={styles.channelGrid}>
                        {Object.entries(channels).map(([channelType, dmxAddress]) => {
                          const currentValue = getDmxChannelValue(dmxAddress);
                          const isControlled = (() => {
                            switch (channelType) {
                              case 'dimmer':
                              case 'intensity':
                              case 'master':
                                return currentValue === dimmer;
                              case 'pan':
                                return currentValue === panValue;
                              case 'tilt':
                                return currentValue === tiltValue;
                              case 'red':
                              case 'r':
                                return currentValue === red;
                              case 'green':
                              case 'g':
                                return currentValue === green;
                              case 'blue':
                              case 'b':
                                return currentValue === blue;
                              case 'gobo':
                              case 'gobowheel':
                              case 'gobo_wheel':
                                return currentValue === gobo;
                              case 'shutter':
                                return currentValue === shutter;                        case 'strobe':
                                return currentValue === strobe;
                              case 'lamp':
                              case 'lamp_on':
                              case 'lamp_control':
                                return currentValue === lamp;
                              case 'reset':
                              case 'reset_control':
                              case 'function':
                                return currentValue === reset;
                              default:
                                return false;
                            }
                          })();
                          
                          return (
                            <div 
                              key={`${dmxAddress}-${channelType}`} 
                              className={`${styles.channelItem} ${isControlled ? styles.controlled : ''}`}
                            >
                              <div className={styles.channelInfo}>
                                <span className={styles.channelType}>{channelType.toUpperCase()}</span>
                                <span className={styles.channelAddress}>CH {dmxAddress}</span>
                              </div>
                              <div className={styles.channelValue}>
                                <span className={styles.dmxValue}>{currentValue}</span>
                                <div 
                                  className={styles.valueBar}
                                  style={{ 
                                    width: `${(currentValue / 255) * 100}%`,
                                    backgroundColor: isControlled ? '#00d4ff' : '#666'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Real-time control indicators */}
                <div className={styles.controlIndicators}>
                  <div className={styles.indicatorRow}>
                    <div className={`${styles.indicator} ${dimmer > 0 ? styles.active : ''}`}>
                      <LucideIcon name="Sun" />
                      <span>Dimmer: {dimmer}</span>
                    </div>
                    <div className={`${styles.indicator} ${panValue !== 127 || tiltValue !== 127 ? styles.active : ''}`}>
                      <LucideIcon name="Move" />
                      <span>P/T: {panValue}/{tiltValue}</span>
                    </div>
                    <div className={`${styles.indicator} ${red !== 255 || green !== 255 || blue !== 255 ? styles.active : ''}`}>
                      <LucideIcon name="Palette" />
                      <span>RGB: {red}/{green}/{blue}</span>
                    </div>
                    <div className={`${styles.indicator} ${gobo > 0 ? styles.active : ''}`}>
                      <LucideIcon name="Circle" />
                      <span>Gobo: {gobo}</span>
                    </div>              <div className={`${styles.indicator} ${strobe > 0 ? styles.active : ''}`}>
                      <LucideIcon name="Zap" />
                      <span>Strobe: {strobe}</span>
                    </div>
                    <div className={`${styles.indicator} ${lamp > 0 ? styles.active : ''}`}>
                      <LucideIcon name="Power" />
                      <span>Lamp: {lamp}</span>
                    </div>
                    <div className={`${styles.indicator} ${reset > 0 ? styles.active : ''}`}>
                      <LucideIcon name="RotateCcw" />
                      <span>Reset: {reset}</span>              </div>            </div>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder}>Select fixtures, groups, or channels to monitor.</div>
            )}
          </div>
        </div>

        <div key="midi-osc" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="Music" /> MIDI/OSC & Navigation
          </div>
          <div className={styles.gridItemContent}>
            {/* MIDI/OSC Learning and Navigation Controls */}
            <div className={styles.midiOscSection}>
              <div className={styles.navigationGrid}>
                {/* Fixture Navigation */}
                <div className={styles.navigationGroup}>
                  <h5>Fixture Navigation</h5>
                  <div className={styles.navigationControls}>
                    <button 
                      className={styles.navBtn}
                      onClick={selectPreviousFixture}
                      disabled={fixtures.length === 0}
                    >
                      <LucideIcon name="ChevronLeft" />
                      Prev
                    </button>
                    <div className={styles.currentSelection}>
                      {fixtures.length > 0 ? fixtures[currentFixtureIndex]?.name || 'Unknown' : 'No fixtures'}
                      <span className={styles.indexInfo}>({currentFixtureIndex + 1}/{fixtures.length})</span>
                    </div>
                    <button 
                      className={styles.navBtn}
                      onClick={selectNextFixture}
                      disabled={fixtures.length === 0}
                    >
                      Next
                      <LucideIcon name="ChevronRight" />
                    </button>
                  </div>
                  <div className={styles.midiLearnRow}>
                    <button 
                      className={`${styles.midiLearnBtn} ${midiLearnTarget === 'fixture_previous' ? styles.learning : ''}`}
                      onClick={() => midiLearnTarget === 'fixture_previous' ? stopMidiLearn() : startMidiLearn('fixture_previous')}
                    >
                      <LucideIcon name="Music" />
                      MIDI Prev
                    </button>
                    <button 
                      className={`${styles.midiLearnBtn} ${midiLearnTarget === 'fixture_next' ? styles.learning : ''}`}
                      onClick={() => midiLearnTarget === 'fixture_next' ? stopMidiLearn() : startMidiLearn('fixture_next')}
                    >
                      <LucideIcon name="Music" />
                      MIDI Next
                    </button>
                    <input 
                      type="text" 
                      placeholder="OSC: /fixture/nav"
                      className={styles.oscInput}
                      defaultValue="/fixture/nav"
                    />
                  </div>
                </div>

                {/* Group Navigation */}
                <div className={styles.navigationGroup}>
                  <h5>Group Navigation</h5>
                  <div className={styles.navigationControls}>
                    <button 
                      className={styles.navBtn}
                      onClick={selectPreviousGroup}
                      disabled={groups.length === 0}
                    >
                      <LucideIcon name="ChevronLeft" />
                      Prev
                    </button>
                    <div className={styles.currentSelection}>
                      {groups.length > 0 ? groups[currentGroupIndex]?.name || 'Unknown' : 'No groups'}
                      <span className={styles.indexInfo}>({currentGroupIndex + 1}/{groups.length})</span>
                    </div>
                    <button 
                      className={styles.navBtn}
                      onClick={selectNextGroup}
                      disabled={groups.length === 0}
                    >
                      Next
                      <LucideIcon name="ChevronRight" />
                    </button>
                  </div>
                  <div className={styles.midiLearnRow}>
                    <button 
                      className={`${styles.midiLearnBtn} ${midiLearnTarget === 'group_previous' ? styles.learning : ''}`}
                      onClick={() => midiLearnTarget === 'group_previous' ? stopMidiLearn() : startMidiLearn('group_previous')}
                    >
                      <LucideIcon name="Music" />
                      MIDI Prev
                    </button>
                    <button 
                      className={`${styles.midiLearnBtn} ${midiLearnTarget === 'group_next' ? styles.learning : ''}`}
                      onClick={() => midiLearnTarget === 'group_next' ? stopMidiLearn() : startMidiLearn('group_next')}
                    >
                      <LucideIcon name="Music" />
                      MIDI Next
                    </button>
                    <input 
                      type="text" 
                      placeholder="OSC: /group/nav"
                      className={styles.oscInput}
                      defaultValue="/group/nav"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div key="scenes" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="Film" /> Scene Management
          </div>
          <div className={styles.gridItemContent}>
            {/* Scene Management */}
            <div className={styles.navigationGroup}>
              <h5>Scene Controls</h5>
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
              <div className={styles.midiLearnRow}>
                <button 
                  className={`${styles.midiLearnBtn} ${midiLearnTarget === 'scene_save' ? styles.learning : ''}`}
                  onClick={() => midiLearnTarget === 'scene_save' ? stopMidiLearn() : startMidiLearn('scene_save')}
                >
                  <LucideIcon name="Music" />
                  MIDI Save
                </button>
                <button 
                  className={`${styles.midiLearnBtn} ${midiLearnTarget === 'scene_previous' ? styles.learning : ''}`}
                  onClick={() => midiLearnTarget === 'scene_previous' ? stopMidiLearn() : startMidiLearn('scene_previous')}
                >
                  <LucideIcon name="Music" />
                  MIDI Prev
                </button>
                <button 
                  className={`${styles.midiLearnBtn} ${midiLearnTarget === 'scene_next' ? styles.learning : ''}`}
                  onClick={() => midiLearnTarget === 'scene_next' ? stopMidiLearn() : startMidiLearn('scene_next')}
                >
                  <LucideIcon name="Music" />
                  MIDI Next
                </button>
                <input 
                  type="text" 
                  placeholder="OSC: /scene/control"
                  className={styles.oscInput}
                  defaultValue="/scene/control"
                />
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

        <div key="basic-controls" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="SlidersHorizontal" /> Basic Controls
          </div>
          <div className={styles.gridItemContent}>
            <div className={styles.section}>
              <div className={styles.controlRow}>
                <label>Dimmer</label>
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
                  disabled={!hasSelection}
                />
                <span>{dimmer}</span>
                <div className={styles.connectionControls}>
                  <div className={styles.midiRangeSection}>
                    <button 
                      className={`${styles.midiLearnBtn} ${midiLearnTarget === 'dimmer' ? styles.learning : ''}`}
                      onClick={() => midiLearnTarget === 'dimmer' ? stopMidiLearn() : startMidiLearn('dimmer')}
                    >
                      <LucideIcon name="Music" />
                      MIDI Learn
                    </button>
                    {midiMappings.dimmer && (
                      <div className={styles.midiInfo}>
                        <span>CH{midiMappings.dimmer.channel} CC{midiMappings.dimmer.cc}</span>
                        <button 
                          className={styles.clearBtn}
                          onClick={() => clearMidiMapping('dimmer')}
                        >
                          <LucideIcon name="X" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.oscSection}>
                    <input 
                      type="text" 
                      placeholder="OSC Address"
                      className={styles.oscInput}
                      defaultValue="/dimmer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div key="pan-tilt" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="Move" /> Pan/Tilt
          </div>
          <div className={styles.gridItemContent}>
            <div className={styles.section}>
              <div className={styles.panTiltSliders}>
                <div className={styles.controlRow}>
                  <label>Pan</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="255" 
                    value={panValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPanValue(val);
                      applyControl('pan', val);
                      setPanTiltXY(prev => ({ ...prev, x: (val / 255) * 100 }));
                    }}
                    disabled={!hasSelection}
                  />
                  <span>{panValue}</span>
                </div>
                <div className={styles.controlRow}>
                  <label>Tilt</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="255" 
                    value={tiltValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTiltValue(val);
                      applyControl('tilt', val);
                      setPanTiltXY(prev => ({ ...prev, y: (val / 255) * 100 }));
                    }}
                    disabled={!hasSelection}
                  />
                  <span>{tiltValue}</span>
                </div>
              </div>

              <h5>XY Pad Control</h5>
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
                  disabled={!hasSelection}
                  title="Reset Pan/Tilt to center position"
                >
                  <LucideIcon name="Target" />
                  Reset to Center
                </button>
              </div>
            </div>
          </div>
        </div>

        <div key="rgb" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="Palette" /> RGB Color
          </div>
          <div className={styles.gridItemContent}>
            <div className={styles.section}>
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
              <div className={styles.rgbSliders}>
                <div className={styles.controlRow}>
                  <label style={{ color: '#ff0000' }}>Red</label>
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
                    disabled={!hasSelection}
                  />
                  <span>{red}</span>
                </div>
                <div className={styles.controlRow}>
                  <label style={{ color: '#00ff00' }}>Green</label>
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
                    disabled={!hasSelection}
                  />
                  <span>{green}</span>
                </div>
                <div className={styles.controlRow}>
                  <label style={{ color: '#0000ff' }}>Blue</label>
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
                    disabled={!hasSelection}
                  />
                  <span>{blue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div key="effects" className={styles.gridItem}>
          <div className={styles.gridItemHeader}>
            <LucideIcon name="Zap" /> Effects
          </div>
          <div className={styles.gridItemContent}>
            <div className={styles.section}>
              <div className={styles.controlRow}>
                <label>GOBO Wheel</label>
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
                  disabled={!hasSelection}
                />
                <span>{gobo}</span>
              </div>
              <div className={styles.goboVisualSection}>
                <label>GOBO Visual Selection</label>
                <div className={styles.goboGrid}>
                  {[
                    { value: 0, name: 'Open', image: '/gobos/open.svg' },
                    { value: 32, name: 'Gobo 1', image: '/gobos/gobo1.svg' },
                    { value: 64, name: 'Gobo 2', image: '/gobos/gobo2.svg' },
                    { value: 96, name: 'Gobo 3', image: '/gobos/gobo3.svg' },
                    { value: 128, name: 'Gobo 4', image: '/gobos/gobo4.svg' },
                    { value: 160, name: 'Gobo 5', image: '/gobos/gobo5.svg' },
                    { value: 192, name: 'Gobo 6', image: '/gobos/gobo6.svg' },
                    { value: 224, name: 'Gobo 7', image: '/gobos/gobo7.svg' }
                  ].map((goboOption) => (<div
                      key={goboOption.value}
                      className={`${styles.goboOption} ${Math.abs(gobo - goboOption.value) <= 16 ? styles.active : ''} ${!hasSelection ? styles.disabled : ''}`}
                      onClick={() => {
                        if (hasSelection) {
                          setGobo(goboOption.value);
                          applyControl('gobo', goboOption.value);
                        }
                      }}
                    >
                      <div className={styles.goboImage}>
                        <img 
                          src={goboOption.image} 
                          alt={goboOption.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className={styles.goboFallback} style={{ display: 'none' }}>
                          <LucideIcon name="Circle" />
                        </div>
                      </div>
                      <span className={styles.goboName}>{goboOption.name}</span>
                      <span className={styles.goboValue}>{goboOption.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.controlRow}>
                <label>Shutter</label>
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
                  disabled={!hasSelection}
                />
                <span>{shutter}</span>
              </div>
              <div className={styles.controlRow}>
                <label>Strobe Speed</label>
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
                  disabled={!hasSelection}
                />
                <span>{strobe}</span>
              </div>
              <div className={styles.controlRow}>
                <label>Lamp Control</label>
                <input 
                  type="range" 
                  min="0" 
                  max="255" 
                  value={lamp}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setLamp(val);
                    applyControl('lamp', val);
                  }}
                  disabled={!hasSelection}
                />
                <span>{lamp}</span>
              </div>
              <div className={styles.controlRow}>
                <label>Reset</label>
                <button onClick={() => applyControl('reset', 255)} disabled={!hasSelection}>
                  <LucideIcon name="RefreshCw" /> Trigger Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectionMode === 'channels' && selectedChannels.length > 0 && (
          <div key="dmx-channels" className={styles.gridItem}>
            <div className={styles.gridItemHeader}>
              <LucideIcon name="Sliders" /> Direct DMX
            </div>
            <div className={styles.gridItemContent}>
              {/* Direct DMX Channel Controls */}
              <div className={styles.dmxChannelSection}>
                <div className={styles.sectionHeader}>
                  <h4>
                    <LucideIcon name="Sliders" />
                    Direct DMX Channel Controls
                  </h4>
                  <span className={styles.channelCount}>
                    {selectedChannels.length} channel(s) selected
                  </span>
                </div>
                
                <div className={styles.channelControlGrid}>
                  {selectedChannels.map(channelAddress => {
                    const currentValue = getDmxChannelValue(channelAddress);
                    
                    let channelInfo: { fixture: string; type: string; name: string } | null = null;
                    fixtures.forEach(fixture => {
                      fixture.channels.forEach((channel, index) => {
                        const fixtureChannelAddress = fixture.startAddress + index - 1;
                        if (fixtureChannelAddress === channelAddress) {
                          channelInfo = {
                            fixture: fixture.name,
                            type: channel.type,
                            name: channel.name || channel.type
                          };
                        }
                      });
                    });
                    
                    return (
                      <div key={channelAddress} className={styles.dmxChannelControl}>
                        <div className={styles.channelHeader}>
                          <span className={styles.channelNumber}>CH {channelAddress}</span>
                          {channelInfo && (
                            <div className={styles.channelDetails}>
                              <span className={styles.fixtureRef}>{channelInfo.fixture}</span>
                              <span className={styles.channelType}>{channelInfo.type}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.channelSliderContainer}>
                          <input 
                            type="range" 
                            min="0" 
                            max="255" 
                            value={currentValue}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setDmxChannelValue(channelAddress, val);
                            }}
                            className={styles.verticalSlider}
                          />
                          <div className={styles.channelValueDisplay}>
                            <input 
                              type="number" 
                              min="0" 
                              max="255" 
                              value={currentValue}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                setDmxChannelValue(channelAddress, val);
                              }}
                              className={styles.valueInput}
                            />
                          </div>
                        </div>
                        
                        <div className={styles.channelQuickActions}>
                          <button 
                            className={styles.quickBtn}
                            onClick={() => setDmxChannelValue(channelAddress, 0)}
                          >
                            0
                          </button>
                          <button 
                            className={styles.quickBtn}
                            onClick={() => setDmxChannelValue(channelAddress, 127)}
                          >
                            50%
                          </button>
                          <button 
                            className={styles.quickBtn}
                            onClick={() => setDmxChannelValue(channelAddress, 255)}
                          >
                            100%
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </ResponsiveGridLayout>
    </div>
  );
};

export default SuperControl;
