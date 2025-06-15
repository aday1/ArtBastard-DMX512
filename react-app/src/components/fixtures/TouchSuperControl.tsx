import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './TouchSuperControl.module.scss';

interface TouchSuperControlProps {
  isFullscreen?: boolean;
  onSelectionChange?: (count: number) => void;
  enableHapticFeedback?: boolean;
  autoHideInterface?: boolean;
}

type TouchSelectionMode = 'channels' | 'fixtures' | 'groups' | 'capabilities';

interface FixtureCapability {
  type: string;
  fixtures: string[];
  count: number;
}

interface QuickAction {
  name: string;
  action: () => void;
  icon: string;
  color: string;
  description?: string;
}

const TouchSuperControl: React.FC<TouchSuperControlProps> = ({ 
  isFullscreen = true,
  onSelectionChange,
  enableHapticFeedback = true,
  autoHideInterface = false
}) => {
  const { 
    fixtures, 
    groups,
    selectedChannels,
    getDmxChannelValue, 
    setDmxChannelValue
  } = useStore();

  // Selection state
  const [selectionMode, setSelectionMode] = useState<TouchSelectionMode>('channels');
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

  // Touch interaction state
  const [panTiltXY, setPanTiltXY] = useState({ x: 50, y: 50 });
  const xyPadRef = useRef<HTMLDivElement>(null);
  const [isTouchingXY, setIsTouchingXY] = useState(false);

  // Color wheel state
  const [colorHue, setColorHue] = useState(0);
  const [colorSaturation, setColorSaturation] = useState(100);
  const colorWheelRef = useRef<HTMLDivElement>(null);
  const [isTouchingColor, setIsTouchingColor] = useState(false);
  // UI state
  const [activePanel, setActivePanel] = useState<'selection' | 'control' | 'quick'>('control');
  const [showAllControls, setShowAllControls] = useState(false);
  const [interfaceVisible, setInterfaceVisible] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Touch gesture state
  const [multiTouchActive, setMultiTouchActive] = useState(false);
  const [gestureStartDistance, setGestureStartDistance] = useState(0);
  const [initialPinchValues, setInitialPinchValues] = useState({ dimmer: 255, strobe: 0 });

  // Haptic feedback function
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (enableHapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [enableHapticFeedback]);

  // Auto-hide interface timer
  useEffect(() => {
    if (!autoHideInterface) return;

    const timer = setTimeout(() => {
      if (Date.now() - lastInteraction > 5000) {
        setInterfaceVisible(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [lastInteraction, autoHideInterface]);

  // Update interaction timestamp
  const updateInteraction = useCallback(() => {
    setLastInteraction(Date.now());
    if (!interfaceVisible) {
      setInterfaceVisible(true);
    }
  }, [interfaceVisible]);

  // Selection change callback
  useEffect(() => {
    const affected = getAffectedFixtures();
    onSelectionChange?.(affected.length);
  }, [selectedFixtures, selectedGroups, selectedCapabilities, selectionMode, onSelectionChange]);

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
      fixtures: fixtureIds,
      count: fixtureIds.length
    })).filter(cap => cap.fixtures.length > 1).sort((a, b) => b.count - a.count);
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
  // Touch handlers for XY pad with enhanced feedback
  const handleXYTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    updateInteraction();
    setIsTouchingXY(true);
    hapticFeedback('light');
    updateXYFromTouch(e.touches[0]);
  };

  const handleXYTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    updateInteraction();
    if (isTouchingXY && e.touches.length > 0) {
      updateXYFromTouch(e.touches[0]);
    }
  };

  const handleXYTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsTouchingXY(false);
    hapticFeedback('medium');
  };

  const updateXYFromTouch = (touch: React.Touch) => {
    if (!xyPadRef.current) return;
    
    const rect = xyPadRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
    
    setPanTiltXY({ x, y });
    
    const panVal = Math.round((x / 100) * 255);
    const tiltVal = Math.round(((100 - y) / 100) * 255);
    
    setPanValue(panVal);
    setTiltValue(tiltVal);
    applyControl('pan', panVal);
    applyControl('tilt', tiltVal);
  };

  // Touch handlers for color wheel with enhanced feedback
  const handleColorTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    updateInteraction();
    setIsTouchingColor(true);
    hapticFeedback('light');
    updateColorFromTouch(e.touches[0]);
  };

  const handleColorTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    updateInteraction();
    if (isTouchingColor && e.touches.length > 0) {
      updateColorFromTouch(e.touches[0]);
    }
  };

  const handleColorTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsTouchingColor(false);
    hapticFeedback('medium');
  };

  const updateColorFromTouch = (touch: React.Touch) => {
    if (!colorWheelRef.current) return;
    
    const rect = colorWheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = touch.clientX - rect.left - centerX;
    const y = touch.clientY - rect.top - centerY;
    
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const hue = (angle + 360) % 360;
    const distance = Math.min(Math.sqrt(x * x + y * y), centerX);
    const saturation = (distance / centerX) * 100;
    
    setColorHue(hue);
    setColorSaturation(saturation);
    
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
  // Enhanced quick actions with more features
  const quickActions: QuickAction[] = [
    { 
      name: 'Blackout', 
      action: () => { 
        setDimmer(0); 
        applyControl('dimmer', 0); 
        hapticFeedback('heavy');
      }, 
      icon: 'Power', 
      color: '#dc3545',
      description: 'Turn off all fixtures'
    },
    { 
      name: 'Full On', 
      action: () => { 
        setDimmer(255); 
        applyControl('dimmer', 255); 
        hapticFeedback('medium');
      }, 
      icon: 'Sun', 
      color: '#ffc107',
      description: 'Set fixtures to full intensity'
    },
    { 
      name: 'Center P/T', 
      action: () => { 
        setPanValue(127); 
        setTiltValue(127); 
        setPanTiltXY({ x: 50, y: 50 });
        applyControl('pan', 127); 
        applyControl('tilt', 127); 
        hapticFeedback('medium');
      }, 
      icon: 'Target', 
      color: '#17a2b8',
      description: 'Center pan and tilt'
    },
    { 
      name: 'White', 
      action: () => { 
        setRed(255); 
        setGreen(255); 
        setBlue(255); 
        applyControl('red', 255); 
        applyControl('green', 255); 
        applyControl('blue', 255); 
        hapticFeedback('light');
      }, 
      icon: 'Circle', 
      color: '#ffffff',
      description: 'Set color to white'
    },
    { 
      name: 'Strobe Fast', 
      action: () => { 
        setStrobe(200); 
        applyControl('strobe', 200); 
        hapticFeedback('heavy');
      }, 
      icon: 'Zap', 
      color: '#ff6b35',
      description: 'Start fast strobe'
    },
    { 
      name: 'Stop Strobe', 
      action: () => { 
        setStrobe(0); 
        applyControl('strobe', 0); 
        hapticFeedback('light');
      }, 
      icon: 'ZapOff', 
      color: '#6c757d',
      description: 'Stop strobing'
    },
    { 
      name: 'Random Color', 
      action: () => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        setRed(r); 
        setGreen(g); 
        setBlue(b); 
        applyControl('red', r); 
        applyControl('green', g); 
        applyControl('blue', b);
        hapticFeedback('medium');
      }, 
      icon: 'Palette', 
      color: '#e91e63',
      description: 'Set random color'
    },
    { 
      name: 'Home All', 
      action: () => {
        setDimmer(255);
        setPanValue(127);
        setTiltValue(127);
        setPanTiltXY({ x: 50, y: 50 });
        setRed(255);
        setGreen(255);
        setBlue(255);
        setGobo(0);
        setShutter(255);
        setStrobe(0);
        applyControl('dimmer', 255);
        applyControl('pan', 127);
        applyControl('tilt', 127);
        applyControl('red', 255);
        applyControl('green', 255);
        applyControl('blue', 255);
        applyControl('gobo', 0);
        applyControl('shutter', 255);
        applyControl('strobe', 0);
        hapticFeedback('heavy');
      }, 
      icon: 'Home', 
      color: '#28a745',
      description: 'Reset all values to home position'
    },
  ];

  const hasSelection = getAffectedFixtures().length > 0;
  const capabilities = getFixtureCapabilities();

  // Haptic feedback
  const triggerHapticFeedback = useCallback(() => {
    if (enableHapticFeedback && 'ontouchstart' in window) {
      navigator.vibrate ? navigator.vibrate(30) : null;
    }
  }, [enableHapticFeedback]);

  useEffect(() => {
    if (autoHideInterface) {
      // Auto-hide logic here
    }
  }, [activePanel, autoHideInterface]);
  return (
    <div 
      className={`${styles.touchSuperControl} ${isFullscreen ? styles.fullscreen : ''} ${!interfaceVisible ? styles.interfaceHidden : ''}`}
      onTouchStart={updateInteraction}
      onTouchMove={updateInteraction}
      onClick={updateInteraction}
    >
      {/* Interface visibility toggle */}
      {autoHideInterface && !interfaceVisible && (
        <div className={styles.showInterfaceHint}>
          <LucideIcon name="Eye" />
          <span>Touch anywhere to show interface</span>
        </div>
      )}
      
      {/* Top Navigation */}
      <div className={`${styles.topNav} ${!interfaceVisible ? styles.hidden : ''}`}>
        <div className={styles.navTabs}>
          <button 
            className={activePanel === 'selection' ? styles.active : ''}
            onClick={() => {
              setActivePanel('selection');
              hapticFeedback('light');
            }}
          >
            <LucideIcon name="Target" />
            Selection
          </button>
          <button 
            className={activePanel === 'control' ? styles.active : ''}
            onClick={() => {
              setActivePanel('control');
              hapticFeedback('light');
            }}
          >
            <LucideIcon name="Settings" />
            Controls
          </button>
          <button 
            className={activePanel === 'quick' ? styles.active : ''}
            onClick={() => {
              setActivePanel('quick');
              hapticFeedback('light');
            }}
          >
            <LucideIcon name="Zap" />
            Quick Actions
          </button>
        </div>
        
        <div className={styles.statusInfo}>
          <span className={styles.selectionCount}>
            {hasSelection ? `${getAffectedFixtures().length} fixtures selected` : 'No selection'}
          </span>
          <button 
            className={`${styles.expandToggle} ${showAllControls ? styles.expanded : ''}`}
            onClick={() => setShowAllControls(!showAllControls)}
          >
            <LucideIcon name={showAllControls ? "ChevronUp" : "ChevronDown"} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Selection Panel */}
        {activePanel === 'selection' && (
          <div className={styles.selectionPanel}>
            <div className={styles.selectionModes}>
              <button 
                className={selectionMode === 'channels' ? styles.active : ''}
                onClick={() => setSelectionMode('channels')}
                disabled
              >
                <LucideIcon name="Radio" />
                <span>Channels</span>
                <small>Use DMX page</small>
              </button>
              <button 
                className={selectionMode === 'fixtures' ? styles.active : ''}
                onClick={() => setSelectionMode('fixtures')}
              >
                <LucideIcon name="Lightbulb" />
                <span>Fixtures</span>
                <small>{fixtures.length} available</small>
              </button>
              <button 
                className={selectionMode === 'groups' ? styles.active : ''}
                onClick={() => setSelectionMode('groups')}
              >
                <LucideIcon name="Users" />
                <span>Groups</span>
                <small>{groups.length} available</small>
              </button>
              <button 
                className={selectionMode === 'capabilities' ? styles.active : ''}
                onClick={() => setSelectionMode('capabilities')}
              >
                <LucideIcon name="Zap" />
                <span>Capabilities</span>
                <small>{capabilities.length} types</small>
              </button>
            </div>

            <div className={styles.selectionList}>
              {selectionMode === 'fixtures' && fixtures.map(fixture => (
                <div
                  key={fixture.id}
                  className={`${styles.selectionItem} ${selectedFixtures.includes(fixture.id) ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedFixtures(prev => 
                      prev.includes(fixture.id) 
                        ? prev.filter(id => id !== fixture.id)
                        : [...prev, fixture.id]
                    );
                    triggerHapticFeedback();
                  }}
                >
                  <div className={styles.itemIcon}>
                    <LucideIcon name="Lightbulb" />
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemName}>{fixture.name}</span>
                    <span className={styles.itemDetails}>
                      CH {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                    </span>
                  </div>
                  {selectedFixtures.includes(fixture.id) && (
                    <div className={styles.selectedIndicator}>
                      <LucideIcon name="Check" />
                    </div>
                  )}
                </div>
              ))}

              {selectionMode === 'groups' && groups.map(group => (
                <div
                  key={group.id}
                  className={`${styles.selectionItem} ${selectedGroups.includes(group.id) ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedGroups(prev => 
                      prev.includes(group.id) 
                        ? prev.filter(id => id !== group.id)
                        : [...prev, group.id]
                    );
                    triggerHapticFeedback();
                  }}
                >
                  <div className={styles.itemIcon}>
                    <LucideIcon name="Users" />
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemName}>{group.name}</span>
                    <span className={styles.itemDetails}>
                      {group.fixtureIndices.length} fixtures
                    </span>
                  </div>
                  {selectedGroups.includes(group.id) && (
                    <div className={styles.selectedIndicator}>
                      <LucideIcon name="Check" />
                    </div>
                  )}
                </div>
              ))}

              {selectionMode === 'capabilities' && capabilities.map(capability => (
                <div
                  key={capability.type}
                  className={`${styles.selectionItem} ${selectedCapabilities.includes(capability.type) ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedCapabilities(prev => 
                      prev.includes(capability.type) 
                        ? prev.filter(type => type !== capability.type)
                        : [...prev, capability.type]
                    );
                    triggerHapticFeedback();
                  }}
                >
                  <div className={styles.itemIcon}>
                    <LucideIcon name="Zap" />
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemName}>{capability.type.toUpperCase()}</span>
                    <span className={styles.itemDetails}>
                      {capability.count} fixtures
                    </span>
                  </div>
                  {selectedCapabilities.includes(capability.type) && (
                    <div className={styles.selectedIndicator}>
                      <LucideIcon name="Check" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls Panel */}
        {activePanel === 'control' && (
          <div className={styles.controlsPanel}>
            <div className={styles.primaryControls}>
              {/* Large Dimmer Slider */}
              <div className={styles.mainDimmer}>
                <label>Master Dimmer</label>
                <div className={styles.touchSlider}>
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
                    className={styles.mainSlider}
                  />
                  <span className={styles.sliderValue}>{dimmer}</span>
                </div>
              </div>

              {/* XY Pan/Tilt Control */}
              <div className={styles.xyPadContainer}>
                <label>Pan/Tilt Control</label>
                <div 
                  className={`${styles.touchXYPad} ${isTouchingXY ? styles.touching : ''}`}
                  ref={xyPadRef}
                  onTouchStart={handleXYTouchStart}
                  onTouchMove={handleXYTouchMove}
                  onTouchEnd={handleXYTouchEnd}
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
                <div className={styles.xyValues}>
                  <span>Pan: {panValue}</span>
                  <span>Tilt: {tiltValue}</span>
                </div>
              </div>

              {/* Color Wheel */}
              <div className={styles.colorWheelContainer}>
                <label>Color Control</label>
                <div 
                  className={`${styles.touchColorWheel} ${isTouchingColor ? styles.touching : ''}`}
                  ref={colorWheelRef}
                  onTouchStart={handleColorTouchStart}
                  onTouchMove={handleColorTouchMove}
                  onTouchEnd={handleColorTouchEnd}
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
                <div className={styles.colorValues}>
                  <span style={{ color: '#ff0000' }}>R: {red}</span>
                  <span style={{ color: '#00ff00' }}>G: {green}</span>
                  <span style={{ color: '#0000ff' }}>B: {blue}</span>
                </div>
              </div>
            </div>

            {/* Additional Controls */}
            {(showAllControls || !isFullscreen) && (
              <div className={styles.secondaryControls}>
                <div className={styles.touchSliderGroup}>
                  <div className={styles.touchSlider}>
                    <label>GOBO</label>
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
                    <span className={styles.sliderValue}>{gobo}</span>
                  </div>

                  <div className={styles.touchSlider}>
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
                    <span className={styles.sliderValue}>{shutter}</span>
                  </div>

                  <div className={styles.touchSlider}>
                    <label>Strobe</label>
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
                    <span className={styles.sliderValue}>{strobe}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Panel */}
        {activePanel === 'quick' && (
          <div className={styles.quickActionsPanel}>
            <div className={styles.quickGrid}>              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={styles.quickButton}
                  onClick={() => {
                    action.action();
                    hapticFeedback('medium');
                  }}
                  disabled={!hasSelection}
                  style={{ backgroundColor: action.color }}
                  title={action.description}
                >
                  <LucideIcon name={action.icon as any} />
                  <span>{action.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TouchSuperControl;
