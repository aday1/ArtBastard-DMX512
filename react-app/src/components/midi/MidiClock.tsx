import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import { DockableComponent } from '../ui/DockableComponent';
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
        <div className={styles.bpmSection}>
          <div className={styles.bpmDisplay}>
            Bar: {midiClockCurrentBar} | Beat: {midiClockCurrentBeat}
          </div>
          {selectedMidiClockHostId === 'internal' && (
            <div className={styles.bpmInput}>
              <label>BPM:</label>
              <input
                type="number"
                value={midiClockBpm.toFixed(1)}
                onChange={(e) => {
                  const newBpm = parseFloat(e.target.value);
                  if (!isNaN(newBpm) && newBpm > 0 && newBpm <= 300) {                    // Request BPM change via socket
                    const { socket } = useStore.getState();
                    if (socket?.connect) {
                      socket.emit('setInternalClockBPM', newBpm);
                    }
                  }
                }}
                min="30"
                max="300"
                step="0.1"
                className={styles.bpmInputField}
              />
            </div>
          )}
          {selectedMidiClockHostId !== 'internal' && (
            <div className={styles.bpmDisplay}>
              BPM: {midiClockBpm.toFixed(2)}
            </div>
          )}
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
        </div>        {renderClockSelection()}
      </div>
    );
  };const clockClasses = [
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
  }, [midiClockCurrentBeat]);  return (
    <DockableComponent
      id="midi-clock"
      title="MIDI Clock"
      component="midi-clock"
      defaultPosition={{ zone: 'bottom-center' }}
      defaultZIndex={1020}
      isCollapsed={isCollapsed}
      onCollapsedChange={setIsCollapsed}
      className={clockClasses}
      isDraggable={false}
    >
      <div ref={clockRef}>
        {renderHeader()}
        {renderContent()}
      </div>
    </DockableComponent>
  );
};

export default MidiClock;
