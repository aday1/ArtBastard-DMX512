import React, { useState } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import DraggablePanel from './DraggablePanel';
import EnhancedSlider from './EnhancedSlider';
import TimelineEditor from '../automation/TimelineEditor';
import styles from './SuperControl.module.scss';

interface SuperControlTidyProps {
  isDockable?: boolean;
}

type PanelConfig = {
  id: string;
  title: string;
  icon: string;
  visible: boolean;
  position: { x: number; y: number };
  minimized: boolean;
};

const SuperControlTidy: React.FC<SuperControlTidyProps> = ({ isDockable = false }) => {
  const {
    fixtures,
    selectedFixtures,
    setDmxChannelValue,
    autopilotTrackEnabled,
    autopilotTrackPosition,
    autopilotTrackSize,
    autopilotTrackSpeed,
    setAutopilotTrackEnabled,
    setAutopilotTrackPosition,
    setAutopilotTrackSize,
    setAutopilotTrackSpeed,
    updatePanTiltFromTrack,
  } = useStore();

  // Panel configuration - Better organized layout
  const [panels, setPanels] = useState<PanelConfig[]>([
    { id: 'basic', title: 'Basic Controls', icon: 'Sliders', visible: true, position: { x: 50, y: 50 }, minimized: false },
    { id: 'pantilt', title: 'Pan/Tilt', icon: 'Move', visible: true, position: { x: 370, y: 50 }, minimized: false },
    { id: 'color', title: 'Color Mixing', icon: 'Palette', visible: true, position: { x: 50, y: 280 }, minimized: false },
    { id: 'beam', title: 'Beam Controls', icon: 'Zap', visible: true, position: { x: 370, y: 280 }, minimized: false },
    { id: 'effects', title: 'Effects & Gobos', icon: 'Disc', visible: true, position: { x: 690, y: 280 }, minimized: false },
    { id: 'autopilot', title: 'Autopilot', icon: 'Navigation', visible: true, position: { x: 690, y: 50 }, minimized: false },
  ]);

  // Organized control states
  // Basic Controls
  const [dimmer, setDimmer] = useState(255);
  const [shutter, setShutter] = useState(255);
  const [strobe, setStrobe] = useState(0);
  
  // Pan/Tilt
  const [panValue, setPanValue] = useState(127);
  const [tiltValue, setTiltValue] = useState(127);
  
  // Color Mixing
  const [red, setRed] = useState(255);
  const [green, setGreen] = useState(255);
  const [blue, setBlue] = useState(255);
  const [white, setWhite] = useState(0);
  const [amber, setAmber] = useState(0);
  const [uv, setUv] = useState(0);
  
  // Beam Controls
  const [focus, setFocus] = useState(127);
  const [zoom, setZoom] = useState(127);
  const [iris, setIris] = useState(255);
  const [frost, setFrost] = useState(0);
  
  // Effects & Gobos
  const [gobo, setGobo] = useState(0);
  const [goboRotation, setGoboRotation] = useState(0);
  const [prism, setPrism] = useState(0);
  const [macro, setMacro] = useState(0);
  const [speed, setSpeed] = useState(127);

  // OSC addresses - Well organized
  const [oscAddresses, setOscAddresses] = useState<Record<string, string>>({
    // Basic
    dimmer: '/supercontrol/dimmer',
    shutter: '/supercontrol/shutter',
    strobe: '/supercontrol/strobe',
    // Pan/Tilt
    pan: '/supercontrol/pan',
    tilt: '/supercontrol/tilt',
    // Color
    red: '/supercontrol/red',
    green: '/supercontrol/green',
    blue: '/supercontrol/blue',
    white: '/supercontrol/white',
    amber: '/supercontrol/amber',
    uv: '/supercontrol/uv',
    // Beam
    focus: '/supercontrol/focus',
    zoom: '/supercontrol/zoom',
    iris: '/supercontrol/iris',
    frost: '/supercontrol/frost',
    // Effects
    gobo: '/supercontrol/gobo',
    goboRotation: '/supercontrol/gobo_rotation',
    prism: '/supercontrol/prism',
    macro: '/supercontrol/macro',
    speed: '/supercontrol/speed',
    // Autopilot
    autopilotPosition: '/supercontrol/autopilot/position',
    autopilotSize: '/supercontrol/autopilot/size',
    autopilotSpeed: '/supercontrol/autopilot/speed',
  });

  // Layout toggle
  const [useDraggableLayout, setUseDraggableLayout] = useState(true);

  // Apply DMX control with proper channel mapping
  const applyControl = (type: string, value: number) => {
    console.log(`[SuperControl] Applying ${type} control with value ${value}`);
    
    let affectedFixtures: any[] = [];
    if (selectedFixtures.length > 0) {
      affectedFixtures = fixtures.filter(f => selectedFixtures.includes(f.id));
    } else {
      affectedFixtures = fixtures;
    }

    affectedFixtures.forEach(fixture => {
      fixture.channels.forEach(channel => {
        if (channel.type.toLowerCase() === type.toLowerCase() && typeof channel.dmxAddress === 'number') {
          setDmxChannelValue(channel.dmxAddress, value);
        }
      });
    });
  };

  // Get DMX channels for a control type - Shows which channels are affected
  const getDmxChannelsForControl = (type: string): number[] => {
    const channels: number[] = [];
    let affectedFixtures: any[] = [];
    
    if (selectedFixtures.length > 0) {
      affectedFixtures = fixtures.filter(f => selectedFixtures.includes(f.id));
    } else {
      affectedFixtures = fixtures;
    }

    affectedFixtures.forEach(fixture => {
      fixture.channels.forEach(channel => {
        if (channel.type.toLowerCase() === type.toLowerCase() && 
            typeof channel.dmxAddress === 'number' && 
            !channels.includes(channel.dmxAddress)) {
          channels.push(channel.dmxAddress);
        }
      });
    });

    return channels.sort((a, b) => a - b);
  };

  // Panel management
  const updatePanelPosition = (panelId: string, position: { x: number; y: number }) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, position } : panel
    ));
  };

  const togglePanelVisibility = (panelId: string) => {
    setPanels(prev => prev.map(panel =>
      panel.id === panelId ? { ...panel, visible: !panel.visible } : panel
    ));
  };

  const togglePanelMinimized = (panelId: string) => {
    setPanels(prev => prev.map(panel =>
      panel.id === panelId ? { ...panel, minimized: !panel.minimized } : panel
    ));
  };

  // MIDI and OSC handlers
  const handleMidiLearn = (controlName: string) => {
    console.log(`[SuperControl] Starting MIDI learn for ${controlName}`);
    // Implementation would go here
  };

  const handleMidiForget = (controlName: string) => {
    console.log(`[SuperControl] Forgetting MIDI mapping for ${controlName}`);
    // Implementation would go here
  };

  const handleOscAddressChange = (controlName: string, address: string) => {
    setOscAddresses(prev => ({ ...prev, [controlName]: address }));
  };

  // Render Basic Controls Panel
  const renderBasicControlsPanel = () => (
    <DraggablePanel
      title="Basic Controls"
      icon="Sliders"
      initialPosition={panels.find(p => p.id === 'basic')?.position}
      onPositionChange={(pos) => updatePanelPosition('basic', pos)}
      onMinimize={() => togglePanelMinimized('basic')}
      isMinimized={panels.find(p => p.id === 'basic')?.minimized}
    >
      <EnhancedSlider
        label="Dimmer"
        value={dimmer}
        onChange={(value) => {
          setDimmer(value);
          applyControl('dimmer', value);
        }}
        min={0}
        max={255}
        icon="Sun"
        oscAddress={oscAddresses.dimmer}
        onMidiLearn={() => handleMidiLearn('dimmer')}
        onMidiForget={() => handleMidiForget('dimmer')}
        onOscAddressChange={(address) => handleOscAddressChange('dimmer', address)}
        dmxChannels={getDmxChannelsForControl('dimmer')}
      />

      <EnhancedSlider
        label="Shutter"
        value={shutter}
        onChange={(value) => {
          setShutter(value);
          applyControl('shutter', value);
        }}
        min={0}
        max={255}
        icon="Camera"
        oscAddress={oscAddresses.shutter}
        onMidiLearn={() => handleMidiLearn('shutter')}
        onMidiForget={() => handleMidiForget('shutter')}
        onOscAddressChange={(address) => handleOscAddressChange('shutter', address)}
        dmxChannels={getDmxChannelsForControl('shutter')}
      />

      <EnhancedSlider
        label="Strobe"
        value={strobe}
        onChange={(value) => {
          setStrobe(value);
          applyControl('strobe', value);
        }}
        min={0}
        max={255}
        icon="Zap"
        oscAddress={oscAddresses.strobe}
        onMidiLearn={() => handleMidiLearn('strobe')}
        onMidiForget={() => handleMidiForget('strobe')}
        onOscAddressChange={(address) => handleOscAddressChange('strobe', address)}
        dmxChannels={getDmxChannelsForControl('strobe')}
      />
    </DraggablePanel>
  );

  // Render Pan/Tilt Panel
  const renderPanTiltPanel = () => (
    <DraggablePanel
      title="Pan/Tilt"
      icon="Move"
      initialPosition={panels.find(p => p.id === 'pantilt')?.position}
      onPositionChange={(pos) => updatePanelPosition('pantilt', pos)}
      onMinimize={() => togglePanelMinimized('pantilt')}
      isMinimized={panels.find(p => p.id === 'pantilt')?.minimized}
    >
      <EnhancedSlider
        label="Pan"
        value={panValue}
        onChange={(value) => {
          setPanValue(value);
          applyControl('pan', value);
        }}
        min={0}
        max={255}
        icon="ArrowLeftRight"
        oscAddress={oscAddresses.pan}
        onMidiLearn={() => handleMidiLearn('pan')}
        onMidiForget={() => handleMidiForget('pan')}
        onOscAddressChange={(address) => handleOscAddressChange('pan', address)}
        dmxChannels={getDmxChannelsForControl('pan')}
      />

      <EnhancedSlider
        label="Tilt"
        value={tiltValue}
        onChange={(value) => {
          setTiltValue(value);
          applyControl('tilt', value);
        }}
        min={0}
        max={255}
        icon="ArrowUpDown"
        oscAddress={oscAddresses.tilt}
        onMidiLearn={() => handleMidiLearn('tilt')}
        onMidiForget={() => handleMidiForget('tilt')}
        onOscAddressChange={(address) => handleOscAddressChange('tilt', address)}
        dmxChannels={getDmxChannelsForControl('tilt')}
      />
    </DraggablePanel>
  );

  // Render Color Mixing Panel  
  const renderColorPanel = () => (
    <DraggablePanel
      title="Color Mixing"
      icon="Palette"
      initialPosition={panels.find(p => p.id === 'color')?.position}
      onPositionChange={(pos) => updatePanelPosition('color', pos)}
      onMinimize={() => togglePanelMinimized('color')}
      isMinimized={panels.find(p => p.id === 'color')?.minimized}
    >
      <EnhancedSlider
        label="Red"
        value={red}
        onChange={(value) => {
          setRed(value);
          applyControl('red', value);
        }}
        min={0}
        max={255}
        icon="Circle"
        oscAddress={oscAddresses.red}
        onMidiLearn={() => handleMidiLearn('red')}
        onMidiForget={() => handleMidiForget('red')}
        onOscAddressChange={(address) => handleOscAddressChange('red', address)}
        dmxChannels={getDmxChannelsForControl('red')}
      />

      <EnhancedSlider
        label="Green"
        value={green}
        onChange={(value) => {
          setGreen(value);
          applyControl('green', value);
        }}
        min={0}
        max={255}
        icon="Circle"
        oscAddress={oscAddresses.green}
        onMidiLearn={() => handleMidiLearn('green')}
        onMidiForget={() => handleMidiForget('green')}
        onOscAddressChange={(address) => handleOscAddressChange('green', address)}
        dmxChannels={getDmxChannelsForControl('green')}
      />

      <EnhancedSlider
        label="Blue"
        value={blue}
        onChange={(value) => {
          setBlue(value);
          applyControl('blue', value);
        }}
        min={0}
        max={255}
        icon="Circle"
        oscAddress={oscAddresses.blue}
        onMidiLearn={() => handleMidiLearn('blue')}
        onMidiForget={() => handleMidiForget('blue')}
        onOscAddressChange={(address) => handleOscAddressChange('blue', address)}
        dmxChannels={getDmxChannelsForControl('blue')}
      />

      <EnhancedSlider
        label="White"
        value={white}
        onChange={(value) => {
          setWhite(value);
          applyControl('white', value);
        }}
        min={0}
        max={255}
        icon="Circle"
        oscAddress={oscAddresses.white}
        onMidiLearn={() => handleMidiLearn('white')}
        onMidiForget={() => handleMidiForget('white')}
        onOscAddressChange={(address) => handleOscAddressChange('white', address)}
        dmxChannels={getDmxChannelsForControl('white')}
      />

      <EnhancedSlider
        label="Amber"
        value={amber}
        onChange={(value) => {
          setAmber(value);
          applyControl('amber', value);
        }}
        min={0}
        max={255}
        icon="Circle"
        oscAddress={oscAddresses.amber}
        onMidiLearn={() => handleMidiLearn('amber')}
        onMidiForget={() => handleMidiForget('amber')}
        onOscAddressChange={(address) => handleOscAddressChange('amber', address)}
        dmxChannels={getDmxChannelsForControl('amber')}
      />

      <EnhancedSlider
        label="UV"
        value={uv}
        onChange={(value) => {
          setUv(value);
          applyControl('uv', value);
        }}
        min={0}
        max={255}
        icon="Circle"
        oscAddress={oscAddresses.uv}
        onMidiLearn={() => handleMidiLearn('uv')}
        onMidiForget={() => handleMidiForget('uv')}
        onOscAddressChange={(address) => handleOscAddressChange('uv', address)}
        dmxChannels={getDmxChannelsForControl('uv')}
      />
    </DraggablePanel>
  );

  // Render Beam Controls Panel
  const renderBeamPanel = () => (
    <DraggablePanel
      title="Beam Controls"
      icon="Zap"
      initialPosition={panels.find(p => p.id === 'beam')?.position}
      onPositionChange={(pos) => updatePanelPosition('beam', pos)}
      onMinimize={() => togglePanelMinimized('beam')}
      isMinimized={panels.find(p => p.id === 'beam')?.minimized}
    >
      <EnhancedSlider
        label="Focus"
        value={focus}
        onChange={(value) => {
          setFocus(value);
          applyControl('focus', value);
        }}
        min={0}
        max={255}
        icon="Focus"
        oscAddress={oscAddresses.focus}
        onMidiLearn={() => handleMidiLearn('focus')}
        onMidiForget={() => handleMidiForget('focus')}
        onOscAddressChange={(address) => handleOscAddressChange('focus', address)}
        dmxChannels={getDmxChannelsForControl('focus')}
      />

      <EnhancedSlider
        label="Zoom"
        value={zoom}
        onChange={(value) => {
          setZoom(value);
          applyControl('zoom', value);
        }}
        min={0}
        max={255}
        icon="ZoomIn"
        oscAddress={oscAddresses.zoom}
        onMidiLearn={() => handleMidiLearn('zoom')}
        onMidiForget={() => handleMidiForget('zoom')}
        onOscAddressChange={(address) => handleOscAddressChange('zoom', address)}
        dmxChannels={getDmxChannelsForControl('zoom')}
      />

      <EnhancedSlider
        label="Iris"
        value={iris}
        onChange={(value) => {
          setIris(value);
          applyControl('iris', value);
        }}
        min={0}
        max={255}
        icon="Aperture"
        oscAddress={oscAddresses.iris}
        onMidiLearn={() => handleMidiLearn('iris')}
        onMidiForget={() => handleMidiForget('iris')}
        onOscAddressChange={(address) => handleOscAddressChange('iris', address)}
        dmxChannels={getDmxChannelsForControl('iris')}
      />

      <EnhancedSlider
        label="Frost"
        value={frost}
        onChange={(value) => {
          setFrost(value);
          applyControl('frost', value);
        }}
        min={0}
        max={255}
        icon="Snowflake"
        oscAddress={oscAddresses.frost}
        onMidiLearn={() => handleMidiLearn('frost')}
        onMidiForget={() => handleMidiForget('frost')}
        onOscAddressChange={(address) => handleOscAddressChange('frost', address)}
        dmxChannels={getDmxChannelsForControl('frost')}
      />
    </DraggablePanel>
  );

  // Render Effects & Gobos Panel
  const renderEffectsPanel = () => (
    <DraggablePanel
      title="Effects & Gobos"
      icon="Disc"
      initialPosition={panels.find(p => p.id === 'effects')?.position}
      onPositionChange={(pos) => updatePanelPosition('effects', pos)}
      onMinimize={() => togglePanelMinimized('effects')}
      isMinimized={panels.find(p => p.id === 'effects')?.minimized}
    >
      <EnhancedSlider
        label="Gobo"
        value={gobo}
        onChange={(value) => {
          setGobo(value);
          applyControl('gobo', value);
        }}
        min={0}
        max={255}
        icon="Disc"
        oscAddress={oscAddresses.gobo}
        onMidiLearn={() => handleMidiLearn('gobo')}
        onMidiForget={() => handleMidiForget('gobo')}
        onOscAddressChange={(address) => handleOscAddressChange('gobo', address)}
        dmxChannels={getDmxChannelsForControl('gobo')}
      />

      <EnhancedSlider
        label="Gobo Rotation"
        value={goboRotation}
        onChange={(value) => {
          setGoboRotation(value);
          applyControl('gobo_rotation', value);
        }}
        min={0}
        max={255}
        icon="RotateCw"
        oscAddress={oscAddresses.goboRotation}
        onMidiLearn={() => handleMidiLearn('goboRotation')}
        onMidiForget={() => handleMidiForget('goboRotation')}
        onOscAddressChange={(address) => handleOscAddressChange('goboRotation', address)}
        dmxChannels={getDmxChannelsForControl('gobo_rotation')}
      />

      <EnhancedSlider
        label="Prism"
        value={prism}
        onChange={(value) => {
          setPrism(value);
          applyControl('prism', value);
        }}
        min={0}
        max={255}
        icon="Triangle"
        oscAddress={oscAddresses.prism}
        onMidiLearn={() => handleMidiLearn('prism')}
        onMidiForget={() => handleMidiForget('prism')}
        onOscAddressChange={(address) => handleOscAddressChange('prism', address)}
        dmxChannels={getDmxChannelsForControl('prism')}
      />

      <EnhancedSlider
        label="Macro"
        value={macro}
        onChange={(value) => {
          setMacro(value);
          applyControl('macro', value);
        }}
        min={0}
        max={255}
        icon="Wand"
        oscAddress={oscAddresses.macro}
        onMidiLearn={() => handleMidiLearn('macro')}
        onMidiForget={() => handleMidiForget('macro')}
        onOscAddressChange={(address) => handleOscAddressChange('macro', address)}
        dmxChannels={getDmxChannelsForControl('macro')}
      />

      <EnhancedSlider
        label="Speed"
        value={speed}
        onChange={(value) => {
          setSpeed(value);
          applyControl('speed', value);
        }}
        min={0}
        max={255}
        icon="Gauge"
        oscAddress={oscAddresses.speed}
        onMidiLearn={() => handleMidiLearn('speed')}
        onMidiForget={() => handleMidiForget('speed')}
        onOscAddressChange={(address) => handleOscAddressChange('speed', address)}
        dmxChannels={getDmxChannelsForControl('speed')}
      />
    </DraggablePanel>
  );

  // Render Autopilot Panel
  const renderAutopilotPanel = () => (
    <DraggablePanel
      title="Autopilot"
      icon="Navigation"
      initialPosition={panels.find(p => p.id === 'autopilot')?.position}
      onPositionChange={(pos) => updatePanelPosition('autopilot', pos)}
      onMinimize={() => togglePanelMinimized('autopilot')}
      isMinimized={panels.find(p => p.id === 'autopilot')?.minimized}
    >
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setAutopilotTrackEnabled(!autopilotTrackEnabled)}
          style={{
            background: autopilotTrackEnabled ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: autopilotTrackEnabled ? '0 4px 12px rgba(40, 167, 69, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <LucideIcon name={autopilotTrackEnabled ? "Play" : "Pause"} />
          {autopilotTrackEnabled ? 'Autopilot ON' : 'Autopilot OFF'}
        </button>
      </div>

      <EnhancedSlider
        label="Position"
        value={autopilotTrackPosition}
        onChange={(value) => {
          setAutopilotTrackPosition(value);
        }}
        min={0}
        max={360}
        icon="MapPin"
        oscAddress={oscAddresses.autopilotPosition}
        onMidiLearn={() => handleMidiLearn('autopilotPosition')}
        onMidiForget={() => handleMidiForget('autopilotPosition')}
        onOscAddressChange={(address) => handleOscAddressChange('autopilotPosition', address)}
        disabled={!autopilotTrackEnabled}
      />

      <EnhancedSlider
        label="Size"
        value={autopilotTrackSize}
        onChange={(value) => {
          setAutopilotTrackSize(value);
        }}
        min={10}
        max={180}
        icon="Maximize"
        oscAddress={oscAddresses.autopilotSize}
        onMidiLearn={() => handleMidiLearn('autopilotSize')}
        onMidiForget={() => handleMidiForget('autopilotSize')}
        onOscAddressChange={(address) => handleOscAddressChange('autopilotSize', address)}
        disabled={!autopilotTrackEnabled}
      />

      <EnhancedSlider
        label="Speed"
        value={autopilotTrackSpeed}
        onChange={(value) => {
          setAutopilotTrackSpeed(value);
        }}
        min={1}
        max={100}
        icon="Zap"
        oscAddress={oscAddresses.autopilotSpeed}
        onMidiLearn={() => handleMidiLearn('autopilotSpeed')}
        onMidiForget={() => handleMidiForget('autopilotSpeed')}
        onOscAddressChange={(address) => handleOscAddressChange('autopilotSpeed', address)}
        disabled={!autopilotTrackEnabled}
      />

      <div style={{ marginTop: '16px' }}>
        <button
          onClick={() => {
            updatePanTiltFromTrack();
          }}
          style={{
            background: 'rgba(0, 212, 255, 0.2)',
            color: '#00d4ff',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            width: '100%',
            transition: 'all 0.3s ease',
          }}
          disabled={!autopilotTrackEnabled}
        >
          Update Pan/Tilt from Track
        </button>
      </div>
    </DraggablePanel>
  );

  return (
    <div className={styles.superControl}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3>
            <LucideIcon name="Settings" />
            Tidy SuperControl
            <div className={styles.statusIndicators}>
              <span className={`${styles.indicator} ${selectedFixtures.length > 0 ? styles.active : styles.inactive}`}>
                {selectedFixtures.length > 0 ? `${selectedFixtures.length} Selected` : 'All Fixtures'}
              </span>
              {autopilotTrackEnabled && (
                <span className={`${styles.indicator} ${styles.autopilot}`}>
                  <LucideIcon name="Navigation" />
                  Autopilot
                </span>
              )}
            </div>
          </h3>
          <p>Organized drag-and-drop control panels with complete DMX, MIDI, and OSC integration</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => setUseDraggableLayout(!useDraggableLayout)}
            className={styles.layoutToggle}
            title={useDraggableLayout ? 'Switch to Grid Layout' : 'Switch to Draggable Layout'}
          >
            <LucideIcon name={useDraggableLayout ? "Grid3X3" : "MousePointer"} />
            {useDraggableLayout ? 'Grid Mode' : 'Drag Mode'}
          </button>
        </div>
      </div>

      {/* Panel Visibility Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
        {panels.map(panel => (
          <button
            key={panel.id}
            onClick={() => togglePanelVisibility(panel.id)}
            className={styles.panelToggle}
            title={`Toggle ${panel.title} panel`}
            style={{ 
              background: panel.visible ? 'rgba(40, 167, 69, 0.9)' : 'rgba(108, 117, 125, 0.9)' 
            }}
          >
            <LucideIcon name={panel.icon as any} />
            {panel.title}
          </button>
        ))}
      </div>

      {/* Panel Rendering */}
      {useDraggableLayout ? (
        <div className={styles.draggableContainer}>
          {panels.find(p => p.id === 'basic')?.visible && renderBasicControlsPanel()}
          {panels.find(p => p.id === 'pantilt')?.visible && renderPanTiltPanel()}
          {panels.find(p => p.id === 'color')?.visible && renderColorPanel()}
          {panels.find(p => p.id === 'beam')?.visible && renderBeamPanel()}
          {panels.find(p => p.id === 'effects')?.visible && renderEffectsPanel()}
          {panels.find(p => p.id === 'autopilot')?.visible && renderAutopilotPanel()}
        </div>
      ) : (
        <div className={styles.gridLayout}>
          {panels.find(p => p.id === 'basic')?.visible && renderBasicControlsPanel()}
          {panels.find(p => p.id === 'pantilt')?.visible && renderPanTiltPanel()}
          {panels.find(p => p.id === 'color')?.visible && renderColorPanel()}
          {panels.find(p => p.id === 'beam')?.visible && renderBeamPanel()}
          {panels.find(p => p.id === 'effects')?.visible && renderEffectsPanel()}
          {panels.find(p => p.id === 'autopilot')?.visible && renderAutopilotPanel()}
        </div>
      )}
    </div>
  );
};

export default SuperControlTidy;
