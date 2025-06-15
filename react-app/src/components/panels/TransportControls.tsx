import React, { useState, useRef, useEffect } from 'react';
import styles from './TransportControls.module.scss';

interface TransportControlsProps {
  isVisible?: boolean;
  isDocked?: boolean;
  onToggleVisibility?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  isRecording?: boolean;
}

const TransportControls: React.FC<TransportControlsProps> = ({
  isVisible = true,
  isDocked = false,
  onToggleVisibility,
  onPlay,
  onPause,
  onStop,
  onRecord,
  isPlaying = false,
  isPaused = false,
  isRecording = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const transportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    // Position at bottom-right by default
    if (!isDocked) {
      setPosition({ 
        x: window.innerWidth - 320, 
        y: window.innerHeight - 120 
      });
    }
  }, [isDocked]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDocked) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isDocked) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.startPosX + deltaX)),
      y: Math.max(0, Math.min(window.innerHeight - 120, dragRef.current.startPosY + deltaY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleDockToggle = () => {
    if (isDocked) {
      setPosition({ 
        x: window.innerWidth - 320, 
        y: window.innerHeight - 120 
      });
    }
  };

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) {
    return null;
  }

  if (isMinimized) {
    return (
      <div 
        className={`${styles.transportMinimized} ${isDocked ? styles.docked : ''}`}
        style={!isDocked ? { 
          position: 'fixed', 
          left: position.x + 280, 
          top: position.y 
        } : {}}
        onClick={handleMinimizeToggle}
        title="Expand Transport Controls"
      >
        <div className={styles.playIcon}>▶</div>
      </div>
    );
  }

  return (
    <div 
      ref={transportRef}
      className={`${styles.transportControls} ${isDocked ? styles.docked : ''} ${isDragging ? styles.dragging : ''}`}
      style={!isDocked ? { 
        position: 'fixed', 
        left: position.x, 
        top: position.y 
      } : {}}
    >
      <div 
        className={styles.transportHeader}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.headerLeft}>
          <span className={styles.title}>Transport</span>
        </div>
        <div className={styles.headerControls}>
          <button
            className={styles.headerButton}
            onClick={handleDockToggle}
            title={isDocked ? "Undock" : "Dock to Bottom-Right"}
          >
            {isDocked ? "📌" : "🔗"}
          </button>
          <button
            className={styles.headerButton}
            onClick={handleMinimizeToggle}
            title="Minimize"
          >
            ➖
          </button>
          {onToggleVisibility && (
            <button
              className={styles.headerButton}
              onClick={onToggleVisibility}
              title="Hide Transport Controls"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={styles.transportBody}>
        <div className={styles.mainControls}>
          <button
            className={`${styles.transportButton} ${styles.recordButton} ${isRecording ? styles.active : ''}`}
            onClick={onRecord}
            title="Record"
          >
            ⏺
          </button>
          <button
            className={`${styles.transportButton} ${styles.stopButton}`}
            onClick={onStop}
            title="Stop"
          >
            ⏹
          </button>
          <button
            className={`${styles.transportButton} ${styles.playButton} ${isPlaying ? styles.active : ''}`}
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>

        <div className={styles.statusIndicators}>
          {isRecording && <div className={styles.recordingIndicator}>REC</div>}
          {isPlaying && <div className={styles.playingIndicator}>PLAY</div>}
          {isPaused && <div className={styles.pausedIndicator}>PAUSE</div>}
        </div>
      </div>
    </div>
  );
};

export default TransportControls;
