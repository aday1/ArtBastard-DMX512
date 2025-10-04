import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './KonvaFixtureCanvas.module.scss';
import Konva from 'konva';

interface PlacedFixture {
  id: string;
  fixtureId: string;
  fixtureStoreId: string;
  name: string;
  type: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  startAddress: number;
  dmxAddress: number;
  isSelected: boolean;
}

interface FixtureTemplate {
  id: string;
  name: string;
  type: string;
  color: string;
  width: number;
  height: number;
}

interface KonvaFixtureCanvasProps {
  width?: number;
  height?: number;
  onFixtureSelect?: (fixture: PlacedFixture) => void;
  onFixtureMove?: (fixture: PlacedFixture) => void;
  onFixtureDelete?: (fixtureId: string) => void;
}

const KonvaFixtureCanvas: React.FC<KonvaFixtureCanvasProps> = ({
  width = 800,
  height = 600,
  onFixtureSelect,
  onFixtureMove,
  onFixtureDelete
}) => {
  const { 
    fixtures, 
    placedFixtures: storePlacedFixtures, 
    addPlacedFixture, 
    updatePlacedFixture, 
    removePlacedFixture,
    selectedFixtures,
    setSelectedFixtures
  } = useStore();

  const [placedFixtures, setLocalPlacedFixtures] = useState<PlacedFixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  // Initialize placed fixtures from store
  useEffect(() => {
    if (storePlacedFixtures && storePlacedFixtures.length > 0) {
      const konvaFixtures: PlacedFixture[] = storePlacedFixtures.map(fixture => ({
        id: fixture.id,
        fixtureId: fixture.fixtureId || fixture.id,
        fixtureStoreId: fixture.fixtureStoreId || fixture.id,
        name: fixture.name || `Fixture ${fixture.id}`,
        type: fixture.type || 'generic',
        x: fixture.x || 100,
        y: fixture.y || 100,
        color: fixture.color || '#4ecdc4',
        radius: fixture.radius || 25,
        startAddress: fixture.startAddress || 1,
        dmxAddress: fixture.dmxAddress || fixture.startAddress || 1,
        isSelected: selectedFixtures.includes(fixture.id)
      }));
      setLocalPlacedFixtures(konvaFixtures);
    }
  }, [storePlacedFixtures, selectedFixtures]);

  // Handle fixture drop from palette
  const handleFixtureDrop = useCallback((fixtureTemplate: FixtureTemplate, x: number, y: number) => {
    const newFixture: PlacedFixture = {
      id: `fixture_${Date.now()}`,
      fixtureId: fixtureTemplate.id,
      fixtureStoreId: fixtureTemplate.id,
      name: fixtureTemplate.name,
      type: fixtureTemplate.type,
      x: x - 25, // Center the fixture
      y: y - 25,
      color: fixtureTemplate.color,
      radius: 25,
      startAddress: 1,
      dmxAddress: 1,
      isSelected: false
    };

    setLocalPlacedFixtures(prev => [...prev, newFixture]);
    addPlacedFixture({
      fixtureId: newFixture.fixtureId,
      fixtureStoreId: newFixture.fixtureStoreId,
      name: newFixture.name,
      type: newFixture.type,
      x: newFixture.x,
      y: newFixture.y,
      color: newFixture.color,
      radius: newFixture.radius,
      startAddress: newFixture.startAddress,
      dmxAddress: newFixture.dmxAddress
    });
  }, [addPlacedFixture]);

  // Handle fixture selection
  const handleFixtureClick = useCallback((fixture: PlacedFixture) => {
    setSelectedFixture(fixture.id);
    setSelectedFixtures([fixture.id]);
    onFixtureSelect?.(fixture);
  }, [onFixtureSelect, setSelectedFixtures]);

  // Handle fixture drag
  const handleFixtureDrag = useCallback((fixture: PlacedFixture, newPos: { x: number, y: number }) => {
    const updatedFixture = { ...fixture, x: newPos.x, y: newPos.y };
    
    setLocalPlacedFixtures(prev => 
      prev.map(f => f.id === fixture.id ? updatedFixture : f)
    );
    
    updatePlacedFixture(fixture.id, {
      x: newPos.x,
      y: newPos.y
    });
    
    onFixtureMove?.(updatedFixture);
  }, [updatePlacedFixture, onFixtureMove]);

  // Handle fixture deletion
  const handleFixtureDelete = useCallback((fixtureId: string) => {
    setLocalPlacedFixtures(prev => prev.filter(f => f.id !== fixtureId));
    removePlacedFixture(fixtureId);
    onFixtureDelete?.(fixtureId);
    
    if (selectedFixture === fixtureId) {
      setSelectedFixture(null);
    }
  }, [removePlacedFixture, onFixtureDelete, selectedFixture]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedFixture(null);
      setSelectedFixtures([]);
    }
  }, [setSelectedFixtures]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedFixture) {
        handleFixtureDelete(selectedFixture);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFixture, handleFixtureDelete]);

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const scaledGridSize = gridSize * zoom;

    // Vertical lines
    for (let i = 0; i <= width / scaledGridSize; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * scaledGridSize + pan.x}
          y={pan.y}
          width={1}
          height={height}
          fill="#333"
          opacity={0.3}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= height / scaledGridSize; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={pan.x}
          y={i * scaledGridSize + pan.y}
          width={width}
          height={1}
          fill="#333"
          opacity={0.3}
        />
      );
    }

    return lines;
  };

  // Render fixture
  const renderFixture = (fixture: PlacedFixture) => {
    const isSelected = fixture.id === selectedFixture;
    
    return (
      <Group
        key={fixture.id}
        x={fixture.x}
        y={fixture.y}
        draggable
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e) => {
          setIsDragging(false);
          handleFixtureDrag(fixture, { x: e.target.x(), y: e.target.y() });
        }}
        onClick={() => handleFixtureClick(fixture)}
        onTap={() => handleFixtureClick(fixture)}
      >
        {/* Fixture body */}
        <Rect
          width={50}
          height={50}
          fill={fixture.color}
          stroke={isSelected ? '#fff' : '#333'}
          strokeWidth={isSelected ? 3 : 1}
          cornerRadius={8}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.3}
          shadowOffset={{ x: 2, y: 2 }}
        />
        
        {/* Fixture icon */}
        <Text
          x={25}
          y={20}
          text="💡"
          fontSize={20}
          fill="#fff"
          align="center"
          offsetX={10}
          offsetY={10}
        />
        
        {/* Fixture name */}
        <Text
          x={25}
          y={55}
          text={fixture.name}
          fontSize={10}
          fill="#fff"
          align="center"
          offsetX={fixture.name.length * 2.5}
        />
        
        {/* DMX address */}
        <Text
          x={25}
          y={70}
          text={`DMX ${fixture.dmxAddress}`}
          fontSize={8}
          fill="#ccc"
          align="center"
          offsetX={25}
        />
        
        {/* Selection indicator */}
        {isSelected && (
          <Rect
            x={-5}
            y={-5}
            width={60}
            height={60}
            stroke="#4ecdc4"
            strokeWidth={2}
            fill="transparent"
            cornerRadius={12}
            dash={[5, 5]}
          />
        )}
      </Group>
    );
  };

  return (
    <div className={styles.konvaCanvasContainer}>
      {/* Canvas Controls */}
      <div className={styles.canvasControls}>
        <div className={styles.controlGroup}>
          <button
            className={styles.controlButton}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <LucideIcon name="Grid3X3" size={16} />
          </button>
          
          <button
            className={styles.controlButton}
            onClick={() => setZoom(1)}
            title="Reset Zoom"
          >
            <LucideIcon name="ZoomIn" size={16} />
          </button>
          
          <button
            className={styles.controlButton}
            onClick={() => setPan({ x: 0, y: 0 })}
            title="Reset Pan"
          >
            <LucideIcon name="Move" size={16} />
          </button>
        </div>
        
        <div className={styles.controlGroup}>
          <label>Grid Size:</label>
          <input
            type="range"
            min="10"
            max="50"
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value))}
            className={styles.slider}
          />
          <span>{gridSize}px</span>
        </div>
        
        <div className={styles.controlGroup}>
          <label>Zoom:</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Konva Stage */}
      <div className={styles.stageContainer}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={zoom}
          scaleY={zoom}
          x={pan.x}
          y={pan.y}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer ref={layerRef}>
            {/* Grid */}
            {renderGrid()}
            
            {/* Fixtures */}
            {placedFixtures.map(renderFixture)}
          </Layer>
        </Stage>
      </div>

      {/* Canvas Info */}
      <div className={styles.canvasInfo}>
        <div className={styles.infoItem}>
          <span>Fixtures: {placedFixtures.length}</span>
        </div>
        <div className={styles.infoItem}>
          <span>Selected: {selectedFixture ? 1 : 0}</span>
        </div>
        <div className={styles.infoItem}>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default KonvaFixtureCanvas;
