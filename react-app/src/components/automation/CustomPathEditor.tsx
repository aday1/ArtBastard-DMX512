import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './CustomPathEditor.module.scss';
import { LucideIcon } from '../ui/LucideIcon';

interface Point {
  x: number;
  y: number;
}

interface CustomPathEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (path: Point[]) => void;
  initialPath?: Point[];
}

const CustomPathEditor: React.FC<CustomPathEditorProps> = ({ isOpen, onClose, onSave, initialPath = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>(initialPath);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [isErasing, setIsErasing] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (points.length > 0) {
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }
      ctx.stroke();
    }

    points.forEach((point, index) => {
      ctx.fillStyle = draggingPointIndex === index ? '#ff3b30' : '#4ecdc4';
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, draggingPointIndex]);

  useEffect(() => {
    if (isOpen) {
      setPoints(initialPath);
      draw();
    }
  }, [isOpen, initialPath, draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const getCanvasPoint = (e: React.MouseEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPoint(e);
    if (!pos) return;

    const canvas = canvasRef.current!;
    const { width, height } = canvas.getBoundingClientRect();

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dx = pos.x * width - p.x * width;
      const dy = pos.y * height - p.y * height;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        if (isErasing) {
          const newPoints = points.filter((_, index) => index !== i);
          setPoints(newPoints);
        } else {
          setDraggingPointIndex(i);
        }
        return;
      }
    }

    if (e.button === 0 && !isErasing) { // Left click adds a point
        setPoints([...points, pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingPointIndex === null) return;
    const pos = getCanvasPoint(e);
    if (!pos) return;

    const newPoints = [...points];
    newPoints[draggingPointIndex] = {
        x: Math.max(0, Math.min(1, pos.x)),
        y: Math.max(0, Math.min(1, pos.y)),
    };
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDraggingPointIndex(null);
  };
  
  const handleClear = () => {
    setPoints([]);
  };

  const handleSave = () => {
    onSave(points);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onMouseUp={handleMouseUp}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Custom Path Editor</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.canvasContainer} onMouseMove={handleMouseMove}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
          />
        </div>
        <div className={styles.controls}>
            <div className={styles.controlGroup}>
                <button onClick={handleSave} className={styles.button}>
                  <LucideIcon name="Save" /> Save Path
                </button>
                <button onClick={handleClear} className={`${styles.button} ${styles.secondary}`}>
                  <LucideIcon name="Trash2" /> Clear
                </button>
                <button 
                  onClick={() => setIsErasing(!isErasing)} 
                  className={`${styles.button} ${isErasing ? styles.active : styles.secondary}`}
                >
                  <LucideIcon name="Eraser" /> {isErasing ? 'Erasing' : 'Erase'}
                </button>
                <button onClick={onClose} className={`${styles.button} ${styles.secondary}`}>
                  Cancel
                </button>
            </div>
            <div className={styles.instructions}>
              Click to add points. Drag points to move them. Use Erase mode to remove points.
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPathEditor;
