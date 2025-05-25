import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Fixture } from '../../store'; // Assuming Fixture type is exported from store
import styles from './FixtureCanvas2D.module.scss';

interface PlacedFixture {
  id: string; // Unique ID for the placed instance
  fixtureStoreId: string; // Corresponds to Fixture.name or a unique ID from the store
  name: string; // Fixture name from store
  x: number;
  y: number;
  color: string; // Color for representation
  radius: number;
}

interface FixtureCanvas2DProps {
  fixtures: Fixture[]; // Pass fixtures from the store
  placedFixturesData: PlacedFixture[]; // Pass existing placed fixtures
  onUpdatePlacedFixtures: (updatedFixtures: PlacedFixture[]) => void; // Callback to update parent
}

const DEFAULT_FIXTURE_RADIUS = 15;
const FIXTURE_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];


export const FixtureCanvas2D: React.FC<FixtureCanvas2DProps> = ({ 
  fixtures,
  placedFixturesData,
  onUpdatePlacedFixtures
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Internal state for placed fixtures, synced with prop
  const [placedFixtures, setPlacedFixtures] = useState<PlacedFixture[]>(placedFixturesData);
  
  const [selectedFixtureToAdd, setSelectedFixtureToAdd] = useState<Fixture | null>(null);
  const [draggingFixture, setDraggingFixture] = useState<PlacedFixture | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Sync internal state if prop changes from outside
  useEffect(() => {
    setPlacedFixtures(placedFixturesData);
  }, [placedFixturesData]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          // Optionally adjust canvas size to image size, or fit image to canvas
          // For now, we'll fit image to current canvas size in the drawing step
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    if (backgroundImage) {
      const imgAspectRatio = backgroundImage.width / backgroundImage.height;
      const canvasAspectRatio = canvas.width / canvas.height;
      let renderWidth, renderHeight, bgX, bgY;

      if (imgAspectRatio > canvasAspectRatio) {
        renderHeight = canvas.height;
        renderWidth = backgroundImage.width * (renderHeight / backgroundImage.height);
        bgX = (canvas.width - renderWidth) / 2;
        bgY = 0;
      } else {
        renderWidth = canvas.width;
        renderHeight = backgroundImage.height * (renderWidth / backgroundImage.width);
        bgX = 0;
        bgY = (canvas.height - renderHeight) / 2;
      }
      ctx.drawImage(backgroundImage, bgX, bgY, renderWidth, renderHeight);
    } else {
      ctx.fillStyle = '#e0e0e0'; // Darker placeholder
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#555'; // Darker text
      ctx.textAlign = 'center';
      ctx.font = '16px Arial';
      ctx.fillText('Upload a stage plan image', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '12px Arial';
      ctx.fillText('(Click to place selected fixture)', canvas.width / 2, canvas.height / 2 + 10);
    }

    // Draw placed fixtures
    placedFixtures.forEach(fixture => {
      ctx.beginPath();
      ctx.arc(fixture.x, fixture.y, fixture.radius, 0, 2 * Math.PI);
      ctx.fillStyle = fixture.color;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
      ctx.fillStyle = '#fff'; // Text color
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '10px Arial';
      ctx.fillText(fixture.name.substring(0,3), fixture.x, fixture.y); // Short name
    });

    // Highlight for adding fixture
    if (selectedFixtureToAdd) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      // This is a temporary mouse position, ideally get it from state updated on mousemove
      // For simplicity, we'll just indicate selection another way or rely on click.
      // Or, draw a small indicator next to the cursor if we track mousePos.
      ctx.fillStyle = FIXTURE_COLORS[fixtures.indexOf(selectedFixtureToAdd) % FIXTURE_COLORS.length];
      ctx.arc(20, canvas.height - 20, DEFAULT_FIXTURE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000';
      ctx.fillText(`Placing: ${selectedFixtureToAdd.name}`, 20 + DEFAULT_FIXTURE_RADIUS + 5, canvas.height - 20);

    }

  }, [backgroundImage, canvasSize, placedFixtures, selectedFixtureToAdd, fixtures]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      drawCanvas();
    }
  }, [drawCanvas, canvasSize]);


  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedFixtureToAdd) return;

    const { x, y } = getMousePos(event);
    const newPlacedFixture: PlacedFixture = {
      id: `placed-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      fixtureStoreId: selectedFixtureToAdd.name, // Assuming name is unique ID for now
      name: selectedFixtureToAdd.name,
      x,
      y,
      color: FIXTURE_COLORS[fixtures.indexOf(selectedFixtureToAdd) % FIXTURE_COLORS.length],
      radius: DEFAULT_FIXTURE_RADIUS,
    };
    const updated = [...placedFixtures, newPlacedFixture];
    setPlacedFixtures(updated);
    onUpdatePlacedFixtures(updated); // Notify parent
    // setSelectedFixtureToAdd(null); // Optionally deselect after placing one
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(event);
    for (let i = placedFixtures.length - 1; i >= 0; i--) {
      const fixture = placedFixtures[i];
      const distance = Math.sqrt((x - fixture.x) ** 2 + (y - fixture.y) ** 2);
      if (distance < fixture.radius) {
        setDraggingFixture(fixture);
        setDragOffset({ x: fixture.x - x, y: fixture.y - y });
        setSelectedFixtureToAdd(null); // Stop placement mode if dragging
        return;
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingFixture || !dragOffset) return;
    const { x, y } = getMousePos(event);
    const newX = x + dragOffset.x;
    const newY = y + dragOffset.y;

    const updatedFixtures = placedFixtures.map(f =>
      f.id === draggingFixture.id ? { ...f, x: newX, y: newY } : f
    );
    setPlacedFixtures(updatedFixtures);
    // Debounce or throttle onUpdatePlacedFixtures for performance if many moves
    // For now, update directly for simplicity
    onUpdatePlacedFixtures(updatedFixtures);
  };

  const handleMouseUp = () => {
    setDraggingFixture(null);
    setDragOffset(null);
  };
  
  const handleMouseLeave = () => {
    // Optional: if you want dragging to stop if mouse leaves canvas
    // setDraggingFixture(null);
    // setDragOffset(null);
  };

  return (
    <div className={styles.fixtureCanvasContainer}>
      <div className={styles.controls}>
        <div className={styles.uploadControl}>
          <label htmlFor="bgImageUpload" className={styles.uploadLabel}>
            Background:
          </label>
          <input
            type="file"
            id="bgImageUpload"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.uploadInput}
          />
        </div>
        <div className={styles.fixturePalette}>
          <span className={styles.paletteLabel}>Available Fixtures:</span>
          {fixtures.length === 0 && <span className={styles.noFixtures}>No fixtures defined yet.</span>}
          {fixtures.map((fixture, index) => (
            <button
              key={fixture.name} // Assuming name is unique enough for key
              className={`${styles.fixtureSelectItem} ${selectedFixtureToAdd?.name === fixture.name ? styles.selected : ''}`}
              style={{ backgroundColor: FIXTURE_COLORS[index % FIXTURE_COLORS.length] }}
              onClick={() => setSelectedFixtureToAdd(fixture)}
              title={`Select to place ${fixture.name}`}
            >
              {fixture.name}
            </button>
          ))}
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        className={styles.fixtureCanvas}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave} // Optional: stop dragging if mouse leaves
      >
      </canvas>
    </div>
  );
};
