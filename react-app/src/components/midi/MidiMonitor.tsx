import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';

export const MidiMonitor: React.FC = () => {
  const midiMessages = useStore(state => state.midiMessages);
  const [lastMessages, setLastMessages] = useState<Array<any>>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const monitorRef = useRef<HTMLDivElement>(null);


  // Load position from localStorage (these are transform offsets)
  useEffect(() => {
    const savedX = localStorage.getItem('midiMonitorPositionX');
    const savedY = localStorage.getItem('midiMonitorPositionY');
    let x = 0;
    let y = 0;
    if (savedX !== null) x = parseFloat(savedX);
    if (savedY !== null) y = parseFloat(savedY);
    setPosition({ x, y });
  }, []);

  // Effect to calculate and set drag constraints, and validate initial position
  useEffect(() => {
    const calculateAndValidate = () => {
      if (monitorRef.current) {
        const componentWidth = monitorRef.current.offsetWidth;
        const componentHeight = monitorRef.current.offsetHeight;

        // Calculate the initial CSS left offset based on initialCssRight and componentWidth
        const calculatedCssLeft = window.innerWidth - componentWidth - initialCssRight;
        initialCssLeftRef.current = calculatedCssLeft; // Store for use in handleDragEnd

        // Validate current position (transform offsets + CSS position)
        let currentX = position.x;
        let currentY = position.y;

        const effectiveScreenX = calculatedCssLeft + currentX;
        const effectiveScreenY = initialCssTop + currentY;

        let positionNeedsReset = false;
        const visibilityThreshold = 50;

        const isMostlyOffScreenLeft = effectiveScreenX + componentWidth < visibilityThreshold;
        const isMostlyOffScreenTop = effectiveScreenY + componentHeight < visibilityThreshold;
        const isMostlyOffScreenRight = effectiveScreenX > window.innerWidth - visibilityThreshold;
        const isMostlyOffScreenBottom = effectiveScreenY > window.innerHeight - visibilityThreshold;

        if (isMostlyOffScreenLeft || isMostlyOffScreenTop || isMostlyOffScreenRight || isMostlyOffScreenBottom) {
          currentX = 0;
          currentY = 0;
          positionNeedsReset = true;
        } else {
          if (effectiveScreenX < 0) {
            currentX = -calculatedCssLeft; // Reset to align left edge with viewport left
            positionNeedsReset = true;
          }
          if (effectiveScreenY < 0) {
            currentY = -initialCssTop; // Reset to align top edge with viewport top
            positionNeedsReset = true;
          }
          if (effectiveScreenX + componentWidth > window.innerWidth) {
            currentX = window.innerWidth - componentWidth - calculatedCssLeft; // Reset to align right edge
            positionNeedsReset = true;
          }
          if (effectiveScreenY + componentHeight > window.innerHeight) {
            currentY = window.innerHeight - componentHeight - initialCssTop; // Reset to align bottom edge
            positionNeedsReset = true;
          }
        }

        if (positionNeedsReset) {
          setPosition({ x: currentX, y: currentY });
          localStorage.setItem('midiMonitorPositionX', currentX.toString());
          localStorage.setItem('midiMonitorPositionY', currentY.toString());
        }

        // Set drag constraints based on transform model
        setConstraints({
          left: -calculatedCssLeft,
          top: -initialCssTop,
          right: window.innerWidth - componentWidth - calculatedCssLeft,
          bottom: window.innerHeight - componentHeight - initialCssTop,
        });
      }
    };

    // Run calculation after component is mounted and dimensions are known
    // Also re-run if position state changes (e.g. after localStorage load or drag)
    // or if the window resizes.
    if (monitorRef.current) {
       calculateAndValidate();
    }

    window.addEventListener('resize', calculateAndValidate);
    return () => window.removeEventListener('resize', calculateAndValidate);
  }, [monitorRef, position.x, position.y]); // monitorRef is stable, position changes trigger validation.

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (monitorRef.current && initialCssLeftRef.current !== null) {
        const calculatedCssLeft = initialCssLeftRef.current;
        // info.point contains the final absolute screen coordinates of the dragged element (its top-left)
        const newTransformX = info.point.x - calculatedCssLeft;
        const newTransformY = info.point.y - initialCssTop;

        localStorage.setItem('midiMonitorPositionX', newTransformX.toString());
        localStorage.setItem('midiMonitorPositionY', newTransformY.toString());
        setPosition({ x: newTransformX, y: newTransformY });
    }
  };

  // Update the displayed messages when new MIDI messages arrive
  useEffect(() => {
    if (midiMessages.length > 0) {
      const recentMessages = midiMessages.slice(-5);
      setLastMessages(recentMessages);

      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 200);
      return () => clearTimeout(timer);
    }
  }, [midiMessages]);

  const renderHeader = () => (
    <div
      className={`${styles.header} handle`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return; // Don't start drag if a button in header is clicked
        }
        dragControls.start(e);
      }}
      style={{ cursor: 'grab' }}
    >
      <LucideIcon name="GripVertical" size={18} className={styles.dragHandle} />
      <span className={styles.title}>MIDI Monitor</span>
      {!isCollapsed && <span className={styles.status}>Recent: {midiMessages.length}</span>}
      <div className={styles.controls}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          onPointerDown={e => e.stopPropagation()}
          title={isCollapsed ? "Expand" : "Minimize"}
        >
          {isCollapsed ? 
            <LucideIcon name="ChevronUp" size={14} /> : 
            <LucideIcon name="ChevronDown" size={14} />
          }
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isCollapsed) {
      return null;
    }

    if (lastMessages.length === 0) {
      return (
        <div className={styles.content}>
          <p className={styles.noData}>No MIDI messages received yet.</p>
          <p className={styles.noData}>Try moving controls on your MIDI device.</p>
        </div>
      );
    }

    return (
      <div className={styles.content}>
        {lastMessages.map((msg, index) => (
          <div key={index} className={styles.messageRow}>
            {msg._type === 'cc' && (
              <>
                <span className={styles.type}>CC</span>
                <span className={styles.channel}>Ch {msg.channel + 1}</span>
                <span className={styles.controller}>CC {msg.controller}</span>
                <span className={styles.value}>{msg.value}</span>
                <span className={styles.source}>{msg.source}</span>
              </>
            )}
            {msg._type === 'noteon' && (
              <>
                <span className={styles.type}>Note</span>
                <span className={styles.channel}>Ch {msg.channel + 1}</span>
                <span className={styles.note}>Note {msg.note}</span>
                <span className={styles.velocity}>Vel {msg.velocity}</span>
                <span className={styles.source}>{msg.source}</span>
              </>
            )}
            {msg._type !== 'cc' && msg._type !== 'noteon' && (
              <span>Other: {JSON.stringify(msg)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };
  const monitorClasses = [
    styles.midiMonitor,
    flashActive ? styles.flash : '',
    // isPinned ? styles.pinned : '', // Removed isPinned
    isCollapsed ? styles.collapsed : '',
  ].join(' ');

  return (
    <motion.div
      ref={monitorRef}
      className={monitorClasses}      style={{
        position: 'fixed',
        top: 20, // Initial CSS position
        right: 20, // Initial CSS position
        zIndex: 1050,
        width: '400px',
        x: position.x, // Apply stored/initial transform X
        y: position.y, // Apply stored/initial transform Y
      }}
      drag
      dragControls={dragControls}
      dragListener={false} // Use onPointerDown on the handle
      onDragEnd={handleDragEnd}
      dragConstraints={constraints}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {renderHeader()}
      {renderContent()}
    </motion.div>
  );
};

export default MidiMonitor;
