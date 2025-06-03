import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';

export const MidiMonitor: React.FC = () => {
  const midiMessages = useStore(state => state.midiMessages);
  const [lastMessages, setLastMessages] = useState<Array<any>>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const monitorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState<{ top: number; left: number; right: number; bottom: number } | undefined>(undefined);

  // Load position from localStorage
  useEffect(() => {
    const savedX = localStorage.getItem('midiMonitorPositionX');
    const savedY = localStorage.getItem('midiMonitorPositionY');
    let initialX = 0;
    let initialY = 0;
    if (savedX !== null) initialX = parseFloat(savedX);
    if (savedY !== null) initialY = parseFloat(savedY);
    setPosition({ x: initialX, y: initialY });
  }, []);

  // Effect to calculate and set drag constraints
  useEffect(() => {
    const calculateConstraints = () => {
      if (monitorRef.current) {
        const componentWidth = monitorRef.current.offsetWidth;
        const componentHeight = monitorRef.current.offsetHeight;
        const initialCssTop = 20; // From inline style 'top: 20px'
        const initialCssRight = 20; // From inline style 'right: 20px'
        const initialCssLeft = window.innerWidth - componentWidth - initialCssRight;

        setConstraints({
          left: -initialCssLeft,
          top: -initialCssTop,
          right: window.innerWidth - componentWidth - initialCssLeft,
          bottom: window.innerHeight - componentHeight - initialCssTop,
        });
      }
    };

    calculateConstraints(); // Initial calculation
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, [monitorRef.current]); // Recalculate if ref changes or on resize

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    localStorage.setItem('midiMonitorPositionX', info.point.x.toString());
    localStorage.setItem('midiMonitorPositionY', info.point.y.toString());
    setPosition(info.point);
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
      className={`${styles.header} handle`} // Retain 'handle' for styling if needed
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
        {/* <button onClick={() => setIsPinned(!isPinned)} className={isPinned ? styles.active : ''}>
          <LucideIcon name="Pin" size={14} />
        </button> */}
        <button onClick={() => setIsCollapsed(!isCollapsed)} onPointerDown={e => e.stopPropagation()}>
          {isCollapsed ? 
            <LucideIcon name="Maximize2" size={14} /> : 
            <LucideIcon name="Minimize2" size={14} />
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
