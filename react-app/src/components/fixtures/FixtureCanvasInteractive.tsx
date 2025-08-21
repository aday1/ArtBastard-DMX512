import React, { useState, useRef, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Fixture, PlacedFixture, useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './FixtureCanvasInteractive.module.scss';

interface FixtureCanvasInteractiveProps {
  fixtures: Fixture[];
  placedFixturesData: PlacedFixture[];
  onUpdatePlacedFixtures: (fixtures: PlacedFixture[]) => void;
}

interface DraggableFixture extends PlacedFixture {
  isDragging: boolean;
}

export const FixtureCanvasInteractive: React.FC<FixtureCanvasInteractiveProps> = ({
  fixtures,
  placedFixturesData,
  onUpdatePlacedFixtures
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'add'>('select');
  const [fixtureToAdd, setFixtureToAdd] = useState<string>('');
  const [showControls, setShowControls] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const { 
    dmxChannels,
    setDmxChannelValue,
    startMidiLearn,
    midiLearnTarget,
    addNotification
  } = useStore();

  const { socket } = useSocket();

  // Grid constants
  const GRID_SIZE = 50;
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

  const getFixtureColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'moving-head': '#ff6b6b',
      'par': '#4ecdc4',
      'strip': '#45b7d1',
      'laser': '#96ceb4',
      'strobe': '#feca57',
      'smoke': '#a55eea',
      default: '#fd79a8',
    };
    return colorMap[type.toLowerCase()] || colorMap.default;
  };

  const getFixtureIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'moving-head': 'Zap',
      'par': 'Circle',
      'strip': 'Minus',
      'laser': 'Target',
      'strobe': 'Flashlight',
      'smoke': 'Cloud',
      default: 'Lightbulb',
    };
    return iconMap[type.toLowerCase()] || iconMap.default;
  };

  const snapToGridPosition = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (selectedTool === 'add' && fixtureToAdd) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (event.clientX - rect.left) / zoom - canvasOffset.x;
        const y = (event.clientY - rect.top) / zoom - canvasOffset.y;
        addFixtureToCanvas(fixtureToAdd, x, y);
        setSelectedTool('select');
      }
    } else {
      setSelectedFixture(null);
      setShowControls(false);
    }
  };

  const addFixtureToCanvas = (fixtureType: string, x: number, y: number) => {
    const fixtureDef = fixtures.find(f => f.id === fixtureType);
    if (!fixtureDef) return;

    const { x: snapX, y: snapY } = snapToGridPosition(x, y);

    const newPlacedFixture: PlacedFixture = {
      id: `placed-${Date.now()}`,
      fixtureId: fixtureDef.id,
      fixtureStoreId: fixtureDef.id,
      name: `${fixtureDef.name} ${placedFixturesData.length + 1}`,
      x: snapX,
      y: snapY,
      color: getFixtureColor(fixtureDef.type),
      radius: 40,
      startAddress: getNextAvailableAddress(),
      scale: 1,
    };

    const updatedFixtures = [...placedFixturesData, newPlacedFixture];
    onUpdatePlacedFixtures(updatedFixtures);

    addNotification?.({
      type: 'success',
      message: `Added ${fixtureDef.name} to canvas`,
    });

    setFixtureToAdd('');
  };

  const getNextAvailableAddress = (): number => {
    if (placedFixturesData.length === 0) return 1;
    const usedAddresses = placedFixturesData.map(f => f.startAddress).sort((a, b) => a - b);
    let nextAddress = 1;
    for (const addr of usedAddresses) {
      if (nextAddress < addr) break;
      nextAddress = addr + 1;
    }
    return nextAddress;
  };

  const handleFixtureDrag = (fixtureId: string, data: any) => {
    const { x, y } = snapToGridPosition(data.x, data.y);
    updatePlacedFixturePosition(fixtureId, x, y);
  };

  const updatePlacedFixturePosition = (fixtureId: string, x: number, y: number) => {
    const updatedFixtures = placedFixturesData.map(f => 
      f.id === fixtureId ? { ...f, x, y } : f
    );
    onUpdatePlacedFixtures(updatedFixtures);
  };

  const deleteSelectedFixture = () => {
    if (!selectedFixture) return;

    const updatedFixtures = placedFixturesData.filter(f => f.id !== selectedFixture);
    onUpdatePlacedFixtures(updatedFixtures);
    setSelectedFixture(null);
    setShowControls(false);

    addNotification?.({
      type: 'info',
      message: 'Fixture removed from canvas',
    });
  };

  const handleChannelChange = (fixtureId: string, channelIndex: number, value: number) => {
    const placedFixture = placedFixturesData.find(f => f.id === fixtureId);
    if (!placedFixture) return;

    const dmxChannel = placedFixture.startAddress + channelIndex;
    setDmxChannelValue(dmxChannel, value);

    if (socket?.emit) {
      socket.emit('dmx:setValue', {
        channel: dmxChannel,
        value,
      });
    }
  };

  const startMidiLearnForChannel = (fixtureId: string, channelIndex: number) => {
    const controlId = `fixture-${fixtureId}-ch${channelIndex}`;
    startMidiLearn({ type: 'placedControl', fixtureId, controlId });
  };

  const copyOscAddress = (fixtureId: string, channelIndex: number) => {
    const oscAddress = `/fixture/${fixtureId}/channel/${channelIndex}`;
    navigator.clipboard?.writeText(oscAddress);
    
    addNotification?.({
      type: 'success',
      message: `OSC address copied: ${oscAddress}`,
    });
  };

  const getSelectedFixtureData = () => {
    if (!selectedFixture) return null;
    return placedFixturesData.find(f => f.id === selectedFixture);
  };

  const getSelectedFixtureDef = () => {
    const placedFixture = getSelectedFixtureData();
    if (!placedFixture) return null;
    return fixtures.find(f => f.id === placedFixture.fixtureStoreId);
  };

  return (
    <div className={styles.canvasContainer}>
      {/* Professional Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolSection}>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toolButton} ${selectedTool === 'select' ? styles.active : ''}`}
              onClick={() => setSelectedTool('select')}
              title="Select and move fixtures"
            >
              <LucideIcon name="MousePointer" />
              Select
            </button>
            <button
              className={`${styles.toolButton} ${selectedTool === 'add' ? styles.active : ''}`}
              onClick={() => setSelectedTool('add')}
              title="Add new fixtures to canvas"
            >
              <LucideIcon name="Plus" />
              Add Fixture
            </button>
          </div>

          {selectedTool === 'add' && (
            <div className={styles.toolGroup}>
              <select
                className={styles.fixtureSelect}
                value={fixtureToAdd}
                onChange={(e) => setFixtureToAdd(e.target.value)}
              >
                <option value="">Select fixture type...</option>
                {fixtures.map(fixture => (
                  <option key={fixture.id} value={fixture.id}>
                    {fixture.name} ({fixture.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.toolSection}>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toggleButton} ${gridEnabled ? styles.active : ''}`}
              onClick={() => setGridEnabled(!gridEnabled)}
              title="Show/hide grid"
            >
              <LucideIcon name="Grid3x3" />
              Grid
            </button>
            <button
              className={`${styles.toggleButton} ${snapToGrid ? styles.active : ''}`}
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Snap to grid"
            >
              <LucideIcon name="Magnet" />
              Snap
            </button>
          </div>

          <div className={styles.toolGroup}>
            <button
              className={styles.zoomButton}
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              title="Zoom out"
            >
              <LucideIcon name="ZoomOut" />
            </button>
            <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
            <button
              className={styles.zoomButton}
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              title="Zoom in"
            >
              <LucideIcon name="ZoomIn" />
            </button>
          </div>

          {selectedFixture && (
            <div className={styles.toolGroup}>
              <button
                className={styles.deleteButton}
                onClick={deleteSelectedFixture}
                title="Delete selected fixture"
              >
                <LucideIcon name="Trash2" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className={styles.statusSection}>
          <span className={styles.fixtureCount}>
            {placedFixturesData.length} fixtures
          </span>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div 
        ref={canvasRef}
        className={styles.canvasWrapper}
        onClick={handleCanvasClick}
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Grid Background */}
        {gridEnabled && (
          <div className={styles.gridBackground}>
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className={styles.gridSvg}>
              <defs>
                <pattern
                  id="grid"
                  width={GRID_SIZE}
                  height={GRID_SIZE}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                    fill="none"
                    stroke="#333"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        )}

        {/* Draggable Fixtures */}
        {placedFixturesData.map(placedFixture => {
          const fixtureDef = fixtures.find(f => f.id === placedFixture.fixtureStoreId);
          if (!fixtureDef) return null;

          return (
            <Draggable
              key={placedFixture.id}
              position={{ x: placedFixture.x, y: placedFixture.y }}
              grid={snapToGrid ? [GRID_SIZE, GRID_SIZE] : undefined}
              onStop={(e, data) => handleFixtureDrag(placedFixture.id, data)}
              disabled={selectedTool !== 'select'}
            >
              <div
                className={`${styles.fixtureItem} ${
                  selectedFixture === placedFixture.id ? styles.selected : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFixture(placedFixture.id);
                  setShowControls(true);
                }}
                style={{
                  borderColor: getFixtureColor(fixtureDef.type),
                }}
              >
                {/* Fixture Visual */}
                <div 
                  className={styles.fixtureIcon}
                  style={{ backgroundColor: getFixtureColor(fixtureDef.type) }}
                >
                  <LucideIcon name={getFixtureIcon(fixtureDef.type) as any} />
                </div>

                {/* Fixture Info */}
                <div className={styles.fixtureInfo}>
                  <div className={styles.fixtureName}>{fixtureDef.name}</div>
                  <div className={styles.fixtureAddress}>@{placedFixture.startAddress}</div>
                </div>

                {/* Status Light */}
                <div className={styles.statusLight} />

                {/* Quick MIDI/OSC Actions */}
                <div className={styles.quickActions}>
                  <button
                    className={styles.miniButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      startMidiLearnForChannel(placedFixture.id, 0);
                    }}
                    title="MIDI Learn"
                  >
                    M
                  </button>
                  <button
                    className={styles.miniButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyOscAddress(placedFixture.id, 0);
                    }}
                    title="Copy OSC"
                  >
                    O
                  </button>
                </div>
              </div>
            </Draggable>
          );
        })}

        {/* Canvas Instructions */}
        {placedFixturesData.length === 0 && (
          <div className={styles.emptyState}>
            <LucideIcon name="Layout" />
            <h3>Professional 2D Lighting Canvas</h3>
            <p>Select "Add Fixture" and choose a fixture type, then click on the canvas to place it.</p>
          </div>
        )}
      </div>

      {/* Advanced Control Panel */}
      {showControls && selectedFixture && (
        <div className={styles.controlsPanel}>
          <div className={styles.controlsHeader}>
            <h3>
              {getSelectedFixtureDef()?.name}
              <span className={styles.address}>@{getSelectedFixtureData()?.startAddress}</span>
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowControls(false)}
            >
              <LucideIcon name="X" />
            </button>
          </div>

          <div className={styles.channelControls}>
            {getSelectedFixtureDef()?.channels.map((channel, index) => {
              const placedFixture = getSelectedFixtureData();
              if (!placedFixture) return null;

              const dmxChannel = placedFixture.startAddress + index;
              const currentValue = dmxChannels[dmxChannel] || 0;

              return (
                <div key={index} className={styles.channelControl}>
                  <div className={styles.channelHeader}>
                    <span className={styles.channelName}>
                      {channel.name || `Ch ${index + 1}`}
                    </span>
                    <span className={styles.channelValue}>{currentValue}</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={currentValue}
                    className={styles.channelSlider}
                    onChange={(e) => handleChannelChange(selectedFixture, index, parseInt(e.target.value))}
                  />

                  <div className={styles.channelActions}>
                    <button
                      className={`${styles.midiButton} ${
                        midiLearnTarget?.type === 'placedControl' &&
                        midiLearnTarget.fixtureId === selectedFixture
                          ? styles.learning
                          : ''
                      }`}
                      onClick={() => startMidiLearnForChannel(selectedFixture, index)}
                      title="MIDI Learn"
                    >
                      <LucideIcon name="Music" />
                      MIDI
                    </button>
                    <button
                      className={styles.oscButton}
                      onClick={() => copyOscAddress(selectedFixture, index)}
                      title="Copy OSC Address"
                    >
                      <LucideIcon name="Copy" />
                      OSC
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advanced Controls */}
          <div className={styles.advancedControls}>
            <h4>Advanced</h4>
            <div className={styles.advancedGrid}>
              <label>
                DMX Address:
                <input
                  type="number"
                  min="1"
                  max="512"
                  value={getSelectedFixtureData()?.startAddress || 1}
                  className={styles.addressInput}
                  onChange={(e) => {
                    const newAddress = parseInt(e.target.value);
                    if (selectedFixture) {
                      const updatedFixtures = placedFixturesData.map(f => 
                        f.id === selectedFixture ? { ...f, startAddress: newAddress } : f
                      );
                      onUpdatePlacedFixtures(updatedFixtures);
                    }
                  }}
                />
              </label>
              <button
                className={styles.duplicateButton}
                onClick={() => {
                  const current = getSelectedFixtureData();
                  if (current) {
                    addFixtureToCanvas(current.fixtureStoreId, current.x + 100, current.y + 100);
                  }
                }}
                title="Duplicate fixture"
              >
                <LucideIcon name="Copy" />
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixtureCanvasInteractive;
