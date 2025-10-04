import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type { Stage as StageType } from 'react-konva';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './KonvaDraggableFixturePalette.module.scss';
import Konva from 'konva';

interface FixtureTemplate {
  id: string;
  name: string;
  type: string;
  color: string;
  width: number;
  height: number;
  icon: string;
}

interface KonvaDraggableFixturePaletteProps {
  onFixtureDrop?: (fixture: FixtureTemplate, x: number, y: number) => void;
  width?: number;
  height?: number;
}

const KonvaDraggableFixturePalette: React.FC<KonvaDraggableFixturePaletteProps> = ({
  onFixtureDrop,
  width = 300,
  height = 400
}) => {
  const [draggedFixture, setDraggedFixture] = useState<FixtureTemplate | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  // Fixture templates
  const fixtureTemplates: FixtureTemplate[] = [
    {
      id: 'spotlight',
      name: 'Spotlight',
      type: 'spotlight',
      color: '#4ecdc4',
      width: 50,
      height: 50,
      icon: '💡'
    },
    {
      id: 'wash',
      name: 'Wash Light',
      type: 'wash',
      color: '#ff6b6b',
      width: 50,
      height: 50,
      icon: '🌟'
    },
    {
      id: 'beam',
      name: 'Beam Light',
      type: 'beam',
      color: '#4ecdc4',
      width: 50,
      height: 50,
      icon: '⚡'
    },
    {
      id: 'strobe',
      name: 'Strobe',
      type: 'strobe',
      color: '#feca57',
      width: 50,
      height: 50,
      icon: '✨'
    },
    {
      id: 'laser',
      name: 'Laser',
      type: 'laser',
      color: '#ff3838',
      width: 50,
      height: 50,
      icon: '🔴'
    },
    {
      id: 'hazer',
      name: 'Hazer',
      type: 'hazer',
      color: '#a4b0be',
      width: 50,
      height: 50,
      icon: '☁️'
    }
  ];

  // Handle fixture drag start
  const handleFixtureDragStart = useCallback((fixture: FixtureTemplate, e: Konva.KonvaEventObject<DragEvent>) => {
    setDraggedFixture(fixture);
    setIsDragging(true);
    
    // Set drag offset
    const stage = e.target.getStage();
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        setDragPosition({
          x: pointerPosition.x - fixture.width / 2,
          y: pointerPosition.y - fixture.height / 2
        });
      }
    }
  }, []);

  // Handle fixture drag move
  const handleFixtureDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (draggedFixture) {
      const stage = e.target.getStage();
      if (stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          setDragPosition({
            x: pointerPosition.x - draggedFixture.width / 2,
            y: pointerPosition.y - draggedFixture.height / 2
          });
        }
      }
    }
  }, [draggedFixture]);

  // Handle fixture drag end
  const handleFixtureDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (draggedFixture) {
      const stage = e.target.getStage();
      if (stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          // Check if dropped on canvas (outside palette)
          const stageRect = stage.getClientRect();
          const isOutsidePalette = pointerPosition.x > width || pointerPosition.y > height;
          
          if (isOutsidePalette) {
            // Convert stage coordinates to canvas coordinates
            const canvasX = pointerPosition.x - stageRect.x;
            const canvasY = pointerPosition.y - stageRect.y;
            
            onFixtureDrop?.(draggedFixture, canvasX, canvasY);
          }
        }
      }
    }
    
    setDraggedFixture(null);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
  }, [draggedFixture, onFixtureDrop, width, height]);

  // Render fixture template
  const renderFixtureTemplate = (fixture: FixtureTemplate, index: number) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = 20 + col * 120;
    const y = 20 + row * 80;

    return (
      <Group
        key={fixture.id}
        x={x}
        y={y}
        draggable
        onDragStart={(e) => handleFixtureDragStart(fixture, e)}
        onDragMove={handleFixtureDragMove}
        onDragEnd={handleFixtureDragEnd}
      >
        {/* Fixture body */}
        <Rect
          width={fixture.width}
          height={fixture.height}
          fill={fixture.color}
          stroke="#333"
          strokeWidth={2}
          cornerRadius={8}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.3}
          shadowOffset={{ x: 2, y: 2 }}
        />
        
        {/* Fixture icon */}
        <Text
          x={fixture.width / 2}
          y={fixture.height / 2 - 10}
          text={fixture.icon}
          fontSize={20}
          fill="#fff"
          align="center"
          offsetX={10}
          offsetY={10}
        />
        
        {/* Fixture name */}
        <Text
          x={fixture.width / 2}
          y={fixture.height + 5}
          text={fixture.name}
          fontSize={10}
          fill="#fff"
          align="center"
          offsetX={fixture.name.length * 2.5}
        />
      </Group>
    );
  };

  // Render drag preview
  const renderDragPreview = () => {
    if (!draggedFixture || !isDragging) return null;

    return (
      <Group
        x={dragPosition.x}
        y={dragPosition.y}
        opacity={0.7}
        scaleX={1.1}
        scaleY={1.1}
      >
        <Rect
          width={draggedFixture.width}
          height={draggedFixture.height}
          fill={draggedFixture.color}
          stroke="#fff"
          strokeWidth={3}
          cornerRadius={8}
          shadowColor="black"
          shadowBlur={20}
          shadowOpacity={0.5}
          shadowOffset={{ x: 4, y: 4 }}
        />
        
        <Text
          x={draggedFixture.width / 2}
          y={draggedFixture.height / 2 - 10}
          text={draggedFixture.icon}
          fontSize={20}
          fill="#fff"
          align="center"
          offsetX={10}
          offsetY={10}
        />
        
        <Text
          x={draggedFixture.width / 2}
          y={draggedFixture.height + 5}
          text={draggedFixture.name}
          fontSize={10}
          fill="#fff"
          align="center"
          offsetX={draggedFixture.name.length * 2.5}
        />
      </Group>
    );
  };

  return (
    <div className={styles.paletteContainer}>
      <div className={styles.paletteHeader}>
        <h3>Fixture Palette</h3>
        <p>Drag fixtures to the canvas</p>
      </div>
      
      <div className={styles.stageContainer}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
        >
          <Layer ref={layerRef}>
            {/* Fixture templates */}
            {fixtureTemplates.map((fixture, index) => renderFixtureTemplate(fixture, index))}
            
            {/* Drag preview */}
            {renderDragPreview()}
          </Layer>
        </Stage>
      </div>
      
      <div className={styles.paletteFooter}>
        <div className={styles.dragHint}>
          <LucideIcon name="MousePointer" size={16} />
          <span>Drag to canvas</span>
        </div>
      </div>
    </div>
  );
};

export default KonvaDraggableFixturePalette;
