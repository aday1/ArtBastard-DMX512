import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
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
    setDmxChannelValue
  } = useStore();

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

    switch (selectionMode) {
      case 'channels':
        if (selectedChannels.length === 0) return [];
        
        const affectedFixtures: Array<{
          fixture: any;
          channels: { [key: string]: number };
        }> = [];

        fixtures.forEach(fixture => {
          const fixtureChannels: { [key: string]: number } = {};
          let hasSelectedChannel = false;

          fixture.channels.forEach((channel, index) => {
            const dmxAddress = fixture.startAddress + index;
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

    return targetFixtures.map(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return null;

      const fixtureChannels: { [key: string]: number } = {};
      fixture.channels.forEach((channel, index) => {
        const dmxAddress = fixture.startAddress + index;
        fixtureChannels[channel.type.toLowerCase()] = dmxAddress;
      });

      return {
        fixture,
        channels: fixtureChannels
      };
    }).filter(Boolean);
  };

  // Apply control value to DMX channels
  const applyControl = (controlType: string, value: number) => {
    const affectedFixtures = getAffectedFixtures();
    
    affectedFixtures.forEach(({ channels }) => {
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
          break;
        case 'strobe':
          targetChannel = channels['strobe'];
          break;
      }

      if (targetChannel !== undefined) {
        setDmxChannelValue(targetChannel, value);
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
    setTiltValue(tiltVal);
    applyControl('pan', panVal);
    applyControl('tilt', tiltVal);
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

  // MIDI Learn
  const startMidiLearn = (controlType: string) => {
    setMidiLearnTarget(controlType);
    // TODO: Implement MIDI learn functionality with store
  };

  const stopMidiLearn = () => {
    setMidiLearnTarget(null);
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
          <div className={styles.fixtureList}>
            {capabilities.map(capability => (
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

      <div className={styles.controlGrid}>
        {/* Basic Controls */}
        <div className={styles.section}>
          <h4>Basic Controls</h4>
          
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
              <button 
                className={`${styles.midiLearnBtn} ${midiLearnTarget === 'dimmer' ? styles.learning : ''}`}
                onClick={() => midiLearnTarget === 'dimmer' ? stopMidiLearn() : startMidiLearn('dimmer')}
              >
                <LucideIcon name="Music" />
                MIDI
              </button>
              <button className={styles.oscBtn}>
                <LucideIcon name="Network" />
                OSC
              </button>
            </div>
          </div>
        </div>

        {/* Pan/Tilt XY Control */}
        <div className={styles.section}>
          <h4>Pan/Tilt XY Control</h4>
          
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
          
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', justifyContent: 'center' }}>
            <span>Pan: {panValue}</span>
            <span>Tilt: {tiltValue}</span>
          </div>
        </div>

        {/* RGB Color Wheel */}
        <div className={styles.section}>
          <h4>RGB Color Control</h4>
          
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

        {/* Effects Controls */}
        <div className={styles.section}>
          <h4>Effects</h4>
          
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
        </div>
      </div>
    </div>
  );
};

export default SuperControl;
