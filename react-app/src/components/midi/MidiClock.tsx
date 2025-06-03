import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import styles from './MidiClock.module.scss';
import { useStore } from '../../store';

export const MidiClock: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const clockRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState<{ top: number; left: number; right: number; bottom: number } | undefined>(undefined);

  const {
    selectedMidiClockHostId = 'none',
    availableMidiClockHosts = [],
    midiClockBpm,
    midiClockIsPlaying,
    midiClockCurrentBeat,
    midiClockCurrentBar,
    toggleInternalMidiClockPlayState,
    setMidiClockBeatBar
  } = useStore(state => ({
    selectedMidiClockHostId: state.selectedMidiClockHostId,
    availableMidiClockHosts: state.availableMidiClockHosts,
    midiClockBpm: state.midiClockBpm,
    midiClockIsPlaying: state.midiClockIsPlaying,
    midiClockCurrentBeat: state.midiClockCurrentBeat,
    midiClockCurrentBar: state.midiClockCurrentBar,
    toggleInternalMidiClockPlayState: state.toggleInternalMidiClockPlayState,
    setMidiClockBeatBar: state.setMidiClockBeatBar,
  }));

  // Load position from localStorage
  useEffect(() => {
    const savedX = localStorage.getItem('midiClockPositionX');
    const savedY = localStorage.getItem('midiClockPositionY');
    let initialX = 0;
    let initialY = 0;
    if (savedX !== null) initialX = parseFloat(savedX);
    if (savedY !== null) initialY = parseFloat(savedY);
    setPosition({ x: initialX, y: initialY });
  }, []);

  // Effect to calculate and set drag constraints
  useEffect(() => {
    const calculateConstraints = () => {
      if (clockRef.current) {
        const componentWidth = clockRef.current.offsetWidth;
        const componentHeight = clockRef.current.offsetHeight;

        // From MidiClock.module.scss
        const initialCssTop = 20;
        const initialCssLeft = 860;

        // Assuming the 'parent' for absolute positioning is the viewport
        const parentWidth = window.innerWidth;
        const parentHeight = window.innerHeight;

        setConstraints({
          left: -initialCssLeft, // Allows dragging left until component's left edge hits viewport left
          top: -initialCssTop,   // Allows dragging up until component's top edge hits viewport top
          right: parentWidth - initialCssLeft - componentWidth, // Allows dragging right until component's right edge hits viewport right
          bottom: parentHeight - initialCssTop - componentHeight, // Allows dragging down until component's bottom edge hits viewport bottom
        });
      }
    };

    calculateConstraints();
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, [clockRef.current]); // Recalculate if ref changes or on resize

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    localStorage.setItem('midiClockPositionX', info.point.x.toString());
    localStorage.setItem('midiClockPositionY', info.point.y.toString());
    setPosition(info.point);
  };

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Effect for internal MIDI clock
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined;

    if (midiClockIsPlaying && selectedMidiClockHostId === 'none' && midiClockBpm > 0) {
      const intervalDuration = (60 * 1000) / midiClockBpm; // Update per beat

      intervalId = setInterval(() => {
        const currentBeat = useStore.getState().midiClockCurrentBeat;
        const currentBar = useStore.getState().midiClockCurrentBar;

        let nextBeat = currentBeat + 1;
        let nextBar = currentBar;

        if (nextBeat > 4) { // Assuming 4/4 time
          nextBeat = 1;
          nextBar += 1;
        }
        useStore.getState().setMidiClockBeatBar(nextBeat, nextBar);
      }, intervalDuration);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [midiClockIsPlaying, midiClockBpm, selectedMidiClockHostId, setMidiClockBeatBar]);

  const renderHeader = () => {
    const selectedHost = availableMidiClockHosts.find(host => host.id === selectedMidiClockHostId);
    const syncStatusText = selectedHost && selectedHost.id !== 'none'
      ? `Sync: ${selectedHost.name}`
      : 'Internal Clock';
    const isActuallySynced = selectedHost && selectedHost.id !== 'none'; // Placeholder for real sync status

    return (
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
        <span className={styles.title}>MIDI Clock</span>
        {!isCollapsed && (
          <span className={`${styles.syncStatus} ${isActuallySynced ? styles.synced : styles.notSynced}`}>
            {isActuallySynced ? 
              <LucideIcon name="Zap" size={12} /> : 
              <LucideIcon name="ZapOff" size={12} />
            }
            {syncStatusText}
          </span>
        )}
        <div className={styles.controls}>
          <button onClick={() => setIsCollapsed(!isCollapsed)} onPointerDown={e => e.stopPropagation()}>
            {isCollapsed ? 
              <LucideIcon name="Maximize2" size={14} /> : 
              <LucideIcon name="Minimize2" size={14} />
            }
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isCollapsed) {
      return null;
    }
    // const currentBeat = beat % 4; // Assuming 4/4 time
    // const currentBar = Math.floor(beat / 4) + bar;

    return (
      <div className={styles.content}>
        <div className={styles.timeDisplay}>
          {currentTime.toLocaleTimeString()}
        </div>
        <div className={styles.bpmDisplay}>
          BPM: {midiClockBpm.toFixed(2)} | Bar: {midiClockCurrentBar} | Beat: {midiClockCurrentBeat}
        </div>
        {/* Placeholder for actual transport controls based on sync source */}
        <div className={styles.transportControls}>
          <button
            disabled={selectedMidiClockHostId !== 'none'}
            onClick={() => {
              if (selectedMidiClockHostId === 'none') {
                toggleInternalMidiClockPlayState();
              }
            }}
          >
            {midiClockIsPlaying ? '❚❚ Pause' : '▶️ Play'}
          </button>
          <button disabled={selectedMidiClockHostId !== 'none'}>⏹️ Stop</button>
          {/* <button>Tap</button> */}
        </div>
         {selectedMidiClockHostId === 'ableton-link' && (
          <div className={styles.linkStatus}>
            {/* Placeholder for Ableton Link specific status, e.g., number of peers */}
            Link Peers: 0
          </div>
        )}
      </div>
    );
  };
  const clockClasses = [
    styles.midiClock,
    isCollapsed ? styles.collapsed : '',
    selectedMidiClockHostId !== 'none' ? styles.externalSync : '',
  ].join(' ');

  return (
    <motion.div
      ref={clockRef}
      className={clockClasses} // This class provides initial position (top, left) and other styles
      style={{
        // position: 'absolute' is set by the CSS class.
        // top, left are also set by CSS. Framer Motion will add transform: translate(x,y)
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

export default MidiClock;
