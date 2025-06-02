import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Minimize2, Maximize2, GripVertical, Zap, ZapOff } from 'lucide-react'; // Added Zap icons
import styles from './MidiClock.module.scss';
import { useStore } from '../../store';

export const MidiClock: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const nodeRef = useRef(null);

  const { selectedMidiClockHostId, availableMidiClockHosts } = useStore(state => ({
    selectedMidiClockHostId: state.selectedMidiClockHostId,
    availableMidiClockHosts: state.availableMidiClockHosts,
  }));

  // Placeholder for actual MIDI clock data from store or Link
  // const { bpm, beat, bar, isPlaying } = useStore(state => state.midiClockData) || { bpm: 120, beat: 0, bar: 0, isPlaying: false };
  const bpm = 120.00; // Placeholder
  const isPlaying = false; // Placeholder

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleDragStart = (e: any) => {
    if (e.target.closest('button')) {
      return false;
    }
  };

  const renderHeader = () => {
    const selectedHost = availableMidiClockHosts.find(host => host.id === selectedMidiClockHostId);
    const syncStatusText = selectedHost && selectedHost.id !== 'none'
      ? `Sync: ${selectedHost.name}`
      : 'Internal Clock';
    const isActuallySynced = selectedHost && selectedHost.id !== 'none'; // Placeholder for real sync status

    return (
      <div className={`${styles.header} handle`}>
        <GripVertical size={18} className={styles.dragHandle} />
        <span className={styles.title}>MIDI Clock</span>
        {!isCollapsed && (
          <span className={`${styles.syncStatus} ${isActuallySynced ? styles.synced : styles.notSynced}`}>
            {isActuallySynced ? <Zap size={12} /> : <ZapOff size={12} />}
            {syncStatusText}
          </span>
        )}
        <div className={styles.controls}>
          <button onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
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
          {/* BPM: {bpm.toFixed(2)} | Bar: {currentBar} | Beat: {currentBeat + 1} */}
          BPM: {bpm.toFixed(2)}
        </div>
        {/* Placeholder for actual transport controls based on sync source */}
        <div className={styles.transportControls}>
          <button disabled={selectedMidiClockHostId !== 'none'}>▶️ Play</button>
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
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={handleDragStart}>
      <div ref={nodeRef} className={clockClasses}>
        {renderHeader()}
        {renderContent()}
      </div>
    </Draggable>
  );
};

export default MidiClock;
