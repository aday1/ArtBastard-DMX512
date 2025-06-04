import React, { useState, useEffect, useRef } from 'react';
// import { motion, useDragControls, PanInfo } from 'framer-motion'; // Removed framer-motion
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import styles from './MidiClock.module.scss';
import { useStore } from '../../store';

export const MidiClock: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const clockRef = useRef<HTMLDivElement>(null);
  // const dragControls = useDragControls(); // Removed

  // const [position, setPosition] = useState({ x: 0, y: 0 }); // Removed
  // const [constraints, setConstraints] = useState<{ top: number; left: number; right: number; bottom: number } | undefined>(undefined); // Removed

  const {
    selectedMidiClockHostId = 'internal', // Default to 'internal' for safety
    availableMidiClockHosts = [],
    midiClockBpm,
    midiClockIsPlaying,
    midiClockCurrentBeat,
    midiClockCurrentBar,
    requestToggleMasterClockPlayPause, // Updated action name
  } = useStore(state => ({
    selectedMidiClockHostId: state.selectedMidiClockHostId,
    availableMidiClockHosts: state.availableMidiClockHosts,
    midiClockBpm: state.midiClockBpm,
    midiClockIsPlaying: state.midiClockIsPlaying,
    midiClockCurrentBeat: state.midiClockCurrentBeat,
    midiClockCurrentBar: state.midiClockCurrentBar,
    requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause, // Updated action
  }));

  // // Load position from localStorage // Removed
  // useEffect(() => {
  //   const savedX = localStorage.getItem('midiClockPositionX');
  //   const savedY = localStorage.getItem('midiClockPositionY');
  //   let initialX = 0;
  //   let initialY = 0;
  //   if (savedX !== null) initialX = parseFloat(savedX);
  //   if (savedY !== null) initialY = parseFloat(savedY);
  //   setPosition({ x: initialX, y: initialY });
  // }, []);

  // // Effect to calculate and set drag constraints // Removed
  // useEffect(() => {
  //   const calculateConstraints = () => {
  //     if (clockRef.current) {
  //       const componentWidth = clockRef.current.offsetWidth;
  //       const componentHeight = clockRef.current.offsetHeight;
  //       // ... constraint logic removed
  //     }
  //   };
  //   calculateConstraints();
  //   window.addEventListener('resize', calculateConstraints);
  //   return () => window.removeEventListener('resize', calculateConstraints);
  // }, [clockRef.current]);

  // const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { // Removed
  //   // ... drag end logic removed
  // };

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Local internal MIDI clock useEffect has been REMOVED.
  // Beat and bar updates will now come from the backend via WebSocket and update the Zustand store.

  const renderHeader = () => {
    const selectedHost = availableMidiClockHosts.find(host => host.id === selectedMidiClockHostId);
    // Default to "Internal Clock" if selectedMidiClockHostId is null or 'none' for display purposes
    const displayHostId = selectedMidiClockHostId === null || selectedMidiClockHostId === 'none' ? 'internal' : selectedMidiClockHostId;
    const currentHost = availableMidiClockHosts.find(host => host.id === displayHostId);

    let syncStatusText = 'Internal Clock';
    if (currentHost) {
      if (currentHost.id !== 'internal') { // Assuming 'internal' is the ID for internal clock in availableMidiClockHosts
        syncStatusText = `Sync: ${currentHost.name}`;
      } else {
        syncStatusText = currentHost.name; // e.g., "Internal Clock"
      }
    } else if (selectedMidiClockHostId && selectedMidiClockHostId !== 'internal') {
      syncStatusText = `Sync: ${selectedMidiClockHostId}`; // Fallback if not in available list but selected
    }

    const isActuallySynced = selectedMidiClockHostId !== null && selectedMidiClockHostId !== 'internal';

    return (
      <div
        className={`${styles.header} handle`} // Retain 'handle' for styling if needed
        // onPointerDown={(e) => { // Removed
        //   if ((e.target as HTMLElement).closest('button')) {
        //     return;
        //   }
        //   // dragControls.start(e); // Removed
        // }}
        // style={{ cursor: 'grab' }} // Removed
      >
        {/* <LucideIcon name="GripVertical" size={18} className={styles.dragHandle} /> */} {/* Removed */}
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
            disabled={selectedMidiClockHostId !== 'internal'} // Updated disabled condition
            onClick={() => {
              // The disabled attribute should prevent this, but check is safe
              if (selectedMidiClockHostId === 'internal') {
                requestToggleMasterClockPlayPause(); // Use new action
              }
            }}
          >
            {midiClockIsPlaying ? '❚❚ Pause' : '▶️ Play'}
          </button>
          <button disabled={selectedMidiClockHostId !== 'internal'}>⏹️ Stop</button> {/* Stop functionality can be a future addition */}
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
    <div // Changed from motion.div to div
      ref={clockRef}
      className={clockClasses}
      style={{
        // position: 'absolute' will be changed to 'fixed' in SCSS.
        // top, left will be set in SCSS.
        // x: position.x, // Removed
        // y: position.y, // Removed
      }}
      // Removed all drag props
      // drag
      // dragControls={dragControls}
      // dragListener={false}
      // onDragEnd={handleDragEnd}
      // dragConstraints={constraints}
      // whileDrag={{ cursor: 'grabbing' }}
    >
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

export default MidiClock;
