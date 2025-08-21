import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Fixture, PlacedFixture, MasterSlider, useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './FixtureCanvasFabric.module.scss';

interface FixtureCanvasFabricProps {
  fixtures: Fixture[];
  placedFixturesData: PlacedFixture[];
  onUpdatePlacedFixtures: (fixtures: PlacedFixture[]) => void;
}

interface FixtureObject extends fabric.Group {
  fixtureId?: string;
  startAddress?: number;
  fixtureDef?: Fixture;
}

export const FixtureCanvasFabric: React.FC<FixtureCanvasFabricProps> = ({
  fixtures,
  placedFixturesData,
  onUpdatePlacedFixtures
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<FixtureObject | null>(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'add'>('select');
  const [fixtureToAdd, setFixtureToAdd] = useState<string>('');
  const [showControls, setShowControls] = useState(false);

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

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#1a1a1a',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // Set up grid
    if (gridEnabled) {
      drawGrid(canvas);
    }

    // Handle object selection
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length === 1) {
        const obj = e.selected[0] as FixtureObject;
        if (obj.fixtureId) {
          setSelectedFixture(obj);
          setShowControls(true);
        }
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedFixture(null);
      setShowControls(false);
    });

    // Handle object movement
    canvas.on('object:modified', (e) => {
      const obj = e.target as FixtureObject;
      if (obj && obj.fixtureId) {
        updatePlacedFixturePosition(obj.fixtureId, obj.left || 0, obj.top || 0);
      }
    });

    // Handle canvas click for adding fixtures
    canvas.on('mouse:down', (e) => {
      if (selectedTool === 'add' && fixtureToAdd && e.pointer) {
        addFixtureToCanvas(fixtureToAdd, e.pointer.x, e.pointer.y);
        setSelectedTool('select');
      }
    });

    // Load existing placed fixtures
    loadPlacedFixtures(canvas);

    return () => {
      canvas.dispose();
    };
  }, [gridEnabled]);

  const drawGrid = (canvas: fabric.Canvas) => {
    const gridLines: fabric.Line[] = [];

    // Vertical lines
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      const line = new fabric.Line([i, 0, i, CANVAS_HEIGHT], {
        stroke: '#333',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      gridLines.push(line);
      canvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      const line = new fabric.Line([0, i, CANVAS_WIDTH, i], {
        stroke: '#333',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      gridLines.push(line);
      canvas.add(line);
    }

    canvas.sendToBack(...gridLines);
  };

import React, { useEffect, useRef, useState, useCallback } from 'react';
import paper from 'paper';
import { Fixture, PlacedFixture, useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './FixtureCanvasFabric.module.scss';

interface FixtureCanvasFabricProps {
  fixtures: Fixture[];
  placedFixturesData: PlacedFixture[];
  onUpdatePlacedFixtures: (fixtures: PlacedFixture[]) => void;
}

interface FixtureItem extends paper.Group {
  fixtureId?: string;
  startAddress?: number;
  fixtureDef?: Fixture;
  placedFixture?: PlacedFixture;
}

export const FixtureCanvasFabric: React.FC<FixtureCanvasFabricProps> = ({
  fixtures,
  placedFixturesData,
  onUpdatePlacedFixtures
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperProjectRef = useRef<paper.Project | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<FixtureItem | null>(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'add'>('select');
  const [fixtureToAdd, setFixtureToAdd] = useState<string>('');
  const [showControls, setShowControls] = useState(false);

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

  // Initialize Paper.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const project = new paper.Project(canvasRef.current);
    paperProjectRef.current = project;

    // Set up canvas
    project.view.viewSize = new paper.Size(CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    if (gridEnabled) {
      drawGrid();
    }

    // Set up tools
    const tool = new paper.Tool();
    
    tool.onMouseDown = (event: paper.ToolEvent) => {
      if (selectedTool === 'add' && fixtureToAdd) {
        const position = snapToGridPosition(event.point.x, event.point.y);
        addFixtureToCanvas(fixtureToAdd, position.x, position.y);
        setSelectedTool('select');
      }
    };

    // Load existing placed fixtures
    loadPlacedFixtures();

    return () => {
      project.remove();
    };
  }, [gridEnabled, fixtureToAdd, selectedTool]);

  const drawGrid = () => {
    const project = paperProjectRef.current;
    if (!project) return;

    const gridGroup = new paper.Group();
    
    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      const line = new paper.Path.Line(
        new paper.Point(x, 0),
        new paper.Point(x, CANVAS_HEIGHT)
      );
      line.strokeColor = new paper.Color('#333');
      line.strokeWidth = 1;
      gridGroup.addChild(line);
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      const line = new paper.Path.Line(
        new paper.Point(0, y),
        new paper.Point(CANVAS_WIDTH, y)
      );
      line.strokeColor = new paper.Color('#333');
      line.strokeWidth = 1;
      gridGroup.addChild(line);
    }

    gridGroup.sendToBack();
  };

  const snapToGridPosition = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  };

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

  const createFixtureObject = (fixtureDef: Fixture, x: number, y: number, placedFixture?: PlacedFixture): FixtureItem => {
    const project = paperProjectRef.current;
    if (!project) throw new Error('Paper.js project not initialized');

    const { x: snapX, y: snapY } = snapToGridPosition(x, y);

    // Create fixture circle
    const circle = new paper.Path.Circle(new paper.Point(0, 0), 25);
    circle.fillColor = new paper.Color(getFixtureColor(fixtureDef.type));
    circle.strokeColor = new paper.Color('#fff');
    circle.strokeWidth = 2;

    // Create fixture label
    const label = new paper.PointText(new paper.Point(0, 35));
    label.content = fixtureDef.name;
    label.fontSize = 12;
    label.fillColor = new paper.Color('#fff');
    label.justification = 'center';

    // Create address label
    const addressLabel = new paper.PointText(new paper.Point(0, -15));
    addressLabel.content = `${placedFixture?.startAddress || 1}`;
    addressLabel.fontSize = 10;
    addressLabel.fillColor = new paper.Color('#00d4ff');
    addressLabel.justification = 'center';

    // Create group
    const group = new paper.Group([circle, label, addressLabel]) as FixtureItem;
    group.position = new paper.Point(snapX, snapY);

    // Add custom properties
    group.fixtureId = placedFixture?.id || `fixture-${Date.now()}`;
    group.startAddress = placedFixture?.startAddress || 1;
    group.fixtureDef = fixtureDef;
    group.placedFixture = placedFixture;

    // Make it interactive
    group.onMouseDown = () => {
      setSelectedFixture(group);
      setShowControls(true);
    };

    group.onMouseDrag = (event: paper.MouseEvent) => {
      const newPos = snapToGridPosition(event.point.x, event.point.y);
      group.position = new paper.Point(newPos.x, newPos.y);
    };

    group.onMouseUp = () => {
      if (group.fixtureId) {
        updatePlacedFixturePosition(group.fixtureId, group.position.x, group.position.y);
      }
    };

    return group;
  };

  const addFixtureToCanvas = (fixtureType: string, x: number, y: number) => {
    const fixtureDef = fixtures.find(f => f.id === fixtureType);
    if (!fixtureDef) return;

    const newPlacedFixture: PlacedFixture = {
      id: `placed-${Date.now()}`,
      fixtureStoreId: fixtureDef.id,
      name: `${fixtureDef.name} ${placedFixturesData.length + 1}`,
      x,
      y,
      startAddress: getNextAvailableAddress(),
      scale: 1,
    };

    const fixtureObject = createFixtureObject(fixtureDef, x, y, newPlacedFixture);
    
    const updatedFixtures = [...placedFixturesData, newPlacedFixture];
    onUpdatePlacedFixtures(updatedFixtures);

    addNotification?.({
      type: 'success',
      message: `Added ${fixtureDef.name} to canvas`,
    });
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

  const loadPlacedFixtures = () => {
    placedFixturesData.forEach(placedFixture => {
      const fixtureDef = fixtures.find(f => f.id === placedFixture.fixtureStoreId);
      if (fixtureDef) {
        createFixtureObject(fixtureDef, placedFixture.x, placedFixture.y, placedFixture);
      }
    });
  };

  const updatePlacedFixturePosition = (fixtureId: string, x: number, y: number) => {
    const updatedFixtures = placedFixturesData.map(f => 
      f.id === fixtureId ? { ...f, x, y } : f
    );
    onUpdatePlacedFixtures(updatedFixtures);
  };

  const deleteSelectedFixture = () => {
    if (!selectedFixture) return;

    selectedFixture.remove();
    const updatedFixtures = placedFixturesData.filter(f => f.id !== selectedFixture.fixtureId);
    onUpdatePlacedFixtures(updatedFixtures);
    setSelectedFixture(null);
    setShowControls(false);

    addNotification?.({
      type: 'info',
      message: 'Fixture removed from canvas',
    });
  };

  const handleChannelChange = (channelIndex: number, value: number) => {
    if (!selectedFixture) return;

    const dmxChannel = (selectedFixture.startAddress || 1) + channelIndex;
    setDmxChannelValue(dmxChannel, value);

    if (socket?.emit) {
      socket.emit('dmx:setValue', {
        channel: dmxChannel,
        value,
      });
    }
  };

  const startMidiLearnForChannel = (channelIndex: number) => {
    if (!selectedFixture) return;

    const controlId = `fixture-${selectedFixture.fixtureId}-ch${channelIndex}`;
    startMidiLearn({ type: 'placedControl', fixtureId: selectedFixture.fixtureId!, controlId });
  };

  const copyOscAddress = (channelIndex: number) => {
    if (!selectedFixture) return;

    const oscAddress = `/fixture/${selectedFixture.fixtureId}/channel/${channelIndex}`;
    navigator.clipboard?.writeText(oscAddress);
    
    addNotification?.({
      type: 'success',
      message: `OSC address copied: ${oscAddress}`,
    });
  };

  return (
    <div className={styles.canvasContainer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolButton} ${selectedTool === 'select' ? styles.active : ''}`}
            onClick={() => setSelectedTool('select')}
          >
            <LucideIcon name="MousePointer" />
            Select
          </button>
          <button
            className={`${styles.toolButton} ${selectedTool === 'add' ? styles.active : ''}`}
            onClick={() => setSelectedTool('add')}
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
                  {fixture.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.toolGroup}>
          <button
            className={`${styles.toggleButton} ${gridEnabled ? styles.active : ''}`}
            onClick={() => setGridEnabled(!gridEnabled)}
          >
            <LucideIcon name="Grid3x3" />
            Grid
          </button>
          <button
            className={`${styles.toggleButton} ${snapToGrid ? styles.active : ''}`}
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            <LucideIcon name="Magnet" />
            Snap
          </button>
        </div>

        {selectedFixture && (
          <div className={styles.toolGroup}>
            <button
              className={styles.deleteButton}
              onClick={deleteSelectedFixture}
            >
              <LucideIcon name="Trash2" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.fabricCanvas}
        />
      </div>

      {/* Fixture Controls Panel */}
      {showControls && selectedFixture && selectedFixture.fixtureDef && (
        <div className={styles.controlsPanel}>
          <div className={styles.controlsHeader}>
            <h3>
              {selectedFixture.fixtureDef.name}
              <span className={styles.address}>@{selectedFixture.startAddress}</span>
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowControls(false)}
            >
              <LucideIcon name="X" />
            </button>
          </div>

          <div className={styles.channelControls}>
            {selectedFixture.fixtureDef.channels.map((channel, index) => {
              const dmxChannel = (selectedFixture.startAddress || 1) + index;
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
                    onChange={(e) => handleChannelChange(index, parseInt(e.target.value))}
                  />

                  <div className={styles.channelActions}>
                    <button
                      className={`${styles.midiButton} ${
                        midiLearnTarget?.type === 'placedControl' &&
                        midiLearnTarget.fixtureId === selectedFixture.fixtureId
                          ? styles.learning
                          : ''
                      }`}
                      onClick={() => startMidiLearnForChannel(index)}
                    >
                      <LucideIcon name="Music" />
                    </button>
                    <button
                      className={styles.oscButton}
                      onClick={() => copyOscAddress(index)}
                    >
                      <LucideIcon name="Copy" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixtureCanvasFabric;
