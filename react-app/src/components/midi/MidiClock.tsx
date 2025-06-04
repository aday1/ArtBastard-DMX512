import React, { useState, useEffect, useRef } from 'react';
// import { motion, useDragControls, PanInfo } from 'framer-motion'; // Removed framer-motion
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import styles from './MidiClock.module.scss';
import { useStore } from '../../store';

export const MidiClock: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showClockSelection, setShowClockSelection] = useState(false);
  const [isDownbeatFlashing, setIsDownbeatFlashing] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const previousBeatRef = useRef<number>(0);
  
  const {
    selectedMidiClockHostId = 'internal',
    availableMidiClockHosts = [],
    midiClockBpm,
    midiClockIsPlaying,
    midiClockCurrentBeat,
    midiClockCurrentBar,
    requestToggleMasterClockPlayPause,
    setSelectedMidiClockHostId,
    requestTapTempo,
  } = useStore(state => ({
    selectedMidiClockHostId: state.selectedMidiClockHostId,
    availableMidiClockHosts: state.availableMidiClockHosts,
    midiClockBpm: state.midiClockBpm,
    midiClockIsPlaying: state.midiClockIsPlaying,
    midiClockCurrentBeat: state.midiClockCurrentBeat,
    midiClockCurrentBar: state.midiClockCurrentBar,
    requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause,
    setSelectedMidiClockHostId: state.setSelectedMidiClockHostId,
    requestTapTempo: state.recordTapTempo,
  }));
  const renderHeader = () => {
    const selectedHost = availableMidiClockHosts.find(host => host.id === selectedMidiClockHostId);
    const displayHostId = selectedMidiClockHostId === null || selectedMidiClockHostId === 'none' ? 'internal' : selectedMidiClockHostId;
    const currentHost = availableMidiClockHosts.find(host => host.id === displayHostId) || 
                       availableMidiClockHosts.find(host => host.id === 'internal');

    let syncStatusText = 'Internal Clock';
    if (currentHost) {
      if (currentHost.id !== 'internal' && currentHost.id !== 'none') {
        syncStatusText = `Sync: ${currentHost.name}`;
      } else {
        syncStatusText = currentHost.name;
      }
    } else if (selectedMidiClockHostId && selectedMidiClockHostId !== 'internal' && selectedMidiClockHostId !== 'none') {
      syncStatusText = `Sync: ${selectedMidiClockHostId}`;
    }

    const isActuallySynced = selectedMidiClockHostId !== null && selectedMidiClockHostId !== 'internal' && selectedMidiClockHostId !== 'none';

    return (
      <div className={`${styles.header} handle`}>
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
          <button 
            onClick={() => setShowClockSelection(!showClockSelection)} 
            onPointerDown={e => e.stopPropagation()}
            className={styles.clockSelectButton}
            title="Select MIDI Clock Source"
          >
            <LucideIcon name="Clock" size={14} />
          </button>
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

  const renderClockSelection = () => {
    if (!showClockSelection || isCollapsed) return null;

    return (
      <div className={styles.clockSelection}>
        <div className={styles.clockSelectionHeader}>
          <span>MIDI Clock Source</span>
          <button onClick={() => setShowClockSelection(false)}>
            <LucideIcon name="X" size={12} />
          </button>
        </div>
        <div className={styles.clockOptions}>
          {availableMidiClockHosts.map((host) => (
            <button
              key={host.id}
              className={`${styles.clockOption} ${selectedMidiClockHostId === host.id ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMidiClockHostId(host.id);
                setShowClockSelection(false);
              }}
            >
              <span className={styles.clockOptionName}>{host.name}</span>
              {selectedMidiClockHostId === host.id && (
                <LucideIcon name="Check" size={14} />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isCollapsed) {
      return null;
    }

    return (
      <div className={styles.content}>
        <div className={styles.bpmDisplay}>
          BPM: {midiClockBpm.toFixed(2)} | Bar: {midiClockCurrentBar} | Beat: {midiClockCurrentBeat}
        </div>
          <div className={styles.transportControls}>
          <button
            className={`${styles.playButton} ${midiClockIsPlaying ? styles.playing : ''}`}
            disabled={selectedMidiClockHostId === 'none'}
            onClick={() => {
              if (selectedMidiClockHostId !== 'none') {
                requestToggleMasterClockPlayPause();
              }
            }}
            title={midiClockIsPlaying ? 'Pause' : 'Play'}
          >
            {midiClockIsPlaying ? 
              <LucideIcon name="Pause" size={16} /> : 
              <LucideIcon name="Play" size={16} />
            }
            {midiClockIsPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          
          <button
            className={styles.stopButton}
            disabled={selectedMidiClockHostId === 'none'}
            onClick={() => {
              if (selectedMidiClockHostId !== 'none') {
                // TODO: Implement stop functionality - could call requestToggleMasterClockPlayPause if playing
                if (midiClockIsPlaying) {
                  requestToggleMasterClockPlayPause();
                }
              }
            }}
            title="Stop"
          >
            <LucideIcon name="Square" size={16} />
            STOP
          </button>
          
          <button
            className={styles.tapButton}
            disabled={selectedMidiClockHostId !== 'internal'}
            onClick={() => {
              if (selectedMidiClockHostId === 'internal' && requestTapTempo) {
                requestTapTempo();
              }
            }}
            title="Tap Tempo"
          >
            <LucideIcon name="Zap" size={16} />
            TAP
          </button>
        </div>

        {renderClockSelection()}
        
        {selectedMidiClockHostId === 'ableton-link' && (
          <div className={styles.linkStatus}>
            Link Peers: 0
          </div>
        )}
      </div>
    );
  };  const clockClasses = [
    styles.midiClock,
    isCollapsed ? styles.collapsed : '',
    selectedMidiClockHostId !== 'none' ? styles.externalSync : '',
    isDownbeatFlashing ? styles.downbeatFlash : '',
  ].join(' ');

  // Flash effect on downbeat (beat = 1)
  useEffect(() => {
    if (midiClockCurrentBeat === 1 && previousBeatRef.current !== 1) {
      setIsDownbeatFlashing(true);
      const timer = setTimeout(() => {
        setIsDownbeatFlashing(false);
      }, 150); // Flash duration
      
      return () => clearTimeout(timer);
    }
    previousBeatRef.current = midiClockCurrentBeat;
  }, [midiClockCurrentBeat]);

  return (
    <div
      ref={clockRef}
      className={clockClasses}
    >
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

export default MidiClock;
