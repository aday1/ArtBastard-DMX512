import React, { useState, useEffect, useRef } from 'react';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore, Fixture } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ChromaticEnergyManipulatorMini.module.scss';

interface ChromaticEnergyManipulatorMiniProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const ChromaticEnergyManipulatorMini: React.FC<ChromaticEnergyManipulatorMiniProps> = ({
  isCollapsed = false,
  onCollapsedChange,
}) => {
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [showFixtureSelect, setShowFixtureSelect] = useState(false);
  
  // Color and movement state
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [movement, setMovement] = useState<{ pan: number; tilt: number }>({ pan: 127, tilt: 127 });
  
  // Canvas references
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const movementCanvasRef = useRef<HTMLCanvasElement>(null);

  const { fixtures, getDmxChannelValue, setDmxChannelValue } = useStore(state => ({
    fixtures: state.fixtures,
    getDmxChannelValue: state.getDmxChannelValue,
    setDmxChannelValue: state.setDmxChannelValue
  }));

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
          rgbChannels.redChannel = dmxAddress - 1;
          break;
        case 'green':
          rgbChannels.greenChannel = dmxAddress - 1;
          break;
        case 'blue':
          rgbChannels.blueChannel = dmxAddress - 1;
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
  };

  const currentChannels = selectedFixture ? getFixtureChannels(selectedFixture) : { rgbChannels: {}, movementChannels: {} };
  const { rgbChannels, movementChannels } = currentChannels;

  // Auto-select first fixture with RGB channels if none selected
  useEffect(() => {
    if (!selectedFixture && fixtures.length > 0) {
      const rgbFixture = fixtures.find(f => 
        f.channels.some(c => c.type === 'red') &&
        f.channels.some(c => c.type === 'green') &&
        f.channels.some(c => c.type === 'blue')
      );
      if (rgbFixture) {
        setSelectedFixture(rgbFixture.id);
      }
    }
  }, [fixtures, selectedFixture]);

  // Initialize color and movement from DMX values
  useEffect(() => {
    if (rgbChannels.redChannel !== undefined && rgbChannels.greenChannel !== undefined && rgbChannels.blueChannel !== undefined) {
      setColor({
        r: getDmxChannelValue(rgbChannels.redChannel),
        g: getDmxChannelValue(rgbChannels.greenChannel),
        b: getDmxChannelValue(rgbChannels.blueChannel)
      });
    }
    
    if (movementChannels.panChannel !== undefined && movementChannels.tiltChannel !== undefined) {
      setMovement({
        pan: getDmxChannelValue(movementChannels.panChannel),
        tilt: getDmxChannelValue(movementChannels.tiltChannel)
      });
    }
  }, [rgbChannels, movementChannels, getDmxChannelValue]);

  // Draw mini color picker
  useEffect(() => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Create simple hue gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.17, '#ffff00');
    gradient.addColorStop(0.33, '#00ff00');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(0.67, '#0000ff');
    gradient.addColorStop(0.83, '#ff00ff');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw current color indicator
    const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.fillStyle = rgb;
    ctx.beginPath();
    ctx.arc(width/2, height/2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [color]);

  // Draw mini movement pad
  useEffect(() => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    
    // Draw movement indicator
    const x = (movement.pan / 255) * width;
    const y = height - (movement.tilt / 255) * height;
    
    ctx.fillStyle = '#00ff88';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [movement]);

  // Handle color canvas click
  const handleColorClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    
    // Convert position to HSV and then to RGB
    const hue = x * 360;
    const saturation = 1;
    const value = 1;
    
    const hueSegment = Math.floor(hue / 60);
    const hueFraction = hue / 60 - hueSegment;
    
    const p = value * (1 - saturation);
    const q = value * (1 - saturation * hueFraction);
    const t = value * (1 - saturation * (1 - hueFraction));
    
    let r, g, b;
    switch (hueSegment) {
      case 0: [r, g, b] = [value, t, p]; break;
      case 1: [r, g, b] = [q, value, p]; break;
      case 2: [r, g, b] = [p, value, t]; break;
      case 3: [r, g, b] = [p, q, value]; break;
      case 4: [r, g, b] = [t, p, value]; break;
      default: [r, g, b] = [value, p, q]; break;
    }
    
    const newColor = {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
    
    setColor(newColor);
    
    // Update DMX channels
    if (rgbChannels.redChannel !== undefined) setDmxChannelValue(rgbChannels.redChannel, newColor.r);
    if (rgbChannels.greenChannel !== undefined) setDmxChannelValue(rgbChannels.greenChannel, newColor.g);
    if (rgbChannels.blueChannel !== undefined) setDmxChannelValue(rgbChannels.blueChannel, newColor.b);
  };

  // Handle movement canvas click
  const handleMovementClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = movementCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    
    const newMovement = {
      pan: Math.round(x * 255),
      tilt: Math.round(y * 255)
    };
    
    setMovement(newMovement);
    
    // Update DMX channels
    if (movementChannels.panChannel !== undefined) setDmxChannelValue(movementChannels.panChannel, newMovement.pan);
    if (movementChannels.tiltChannel !== undefined) setDmxChannelValue(movementChannels.tiltChannel, newMovement.tilt);
  };

  const selectedFixtureName = selectedFixture ? fixtures.find(f => f.id === selectedFixture)?.name || 'Unknown' : 'None';
  const hasRgbChannels = rgbChannels.redChannel !== undefined && rgbChannels.greenChannel !== undefined && rgbChannels.blueChannel !== undefined;
  const hasMovementChannels = movementChannels.panChannel !== undefined && movementChannels.tiltChannel !== undefined;

  return (
    <DockableComponent
      title="Chromatic Energy Manipulator"
      icon="palette"
      defaultPosition={{ x: 20, y: 300 }}
      defaultSize={{ width: 280, height: 200 }}
      minSize={{ width: 250, height: 180 }}
      className={styles.chromaticEnergyManipulatorMini}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className={styles.container}>
        {/* Fixture Selection */}
        <div className={styles.fixtureSection}>
          <button 
            className={styles.fixtureSelector}
            onClick={() => setShowFixtureSelect(!showFixtureSelect)}
            title={`Selected: ${selectedFixtureName}`}
          >
            <LucideIcon name="target" />
            <span className={styles.fixtureName}>{selectedFixtureName}</span>
            <LucideIcon name={showFixtureSelect ? "chevron-up" : "chevron-down"} />
          </button>
          
          {showFixtureSelect && (
            <div className={styles.fixtureDropdown}>
              {fixtures.filter(f => 
                f.channels.some(c => c.type === 'red') &&
                f.channels.some(c => c.type === 'green') &&
                f.channels.some(c => c.type === 'blue')
              ).map(fixture => (
                <button
                  key={fixture.id}
                  className={`${styles.fixtureOption} ${selectedFixture === fixture.id ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedFixture(fixture.id);
                    setShowFixtureSelect(false);
                  }}
                >
                  {fixture.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedFixture && (
          <div className={styles.controlsSection}>
            {/* Color Control */}
            {hasRgbChannels && (
              <div className={styles.colorControl}>
                <div className={styles.controlLabel}>
                  <LucideIcon name="palette" />
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
                  <LucideIcon name="move" />
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
                <LucideIcon name="alert-circle" />
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
