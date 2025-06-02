import React, { useState, useEffect, useRef } from 'react';
import Draggable, { DraggableCore } from 'react-draggable';
import { Pin, Minimize2, Maximize2, GripVertical } from 'lucide-react';
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';

export const MidiMonitor: React.FC = () => {
  const midiMessages = useStore(state => state.midiMessages);
  const [lastMessages, setLastMessages] = useState<Array<any>>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const nodeRef = useRef(null);

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

  const handleDragStart = (e: any) => {
    // Prevent dragging when clicking on buttons
    if (e.target.closest('button')) {
      return false;
    }
  };

  const renderHeader = () => (
    <div className={`${styles.header} handle`}>
      <GripVertical size={18} className={styles.dragHandle} />
      <span className={styles.title}>MIDI Monitor</span>
      {!isCollapsed && <span className={styles.status}>Recent: {midiMessages.length}</span>}
      <div className={styles.controls}>
        <button onClick={() => setIsPinned(!isPinned)} className={isPinned ? styles.active : ''}>
          <Pin size={14} />
        </button>
        <button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
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
    isPinned ? styles.pinned : '',
    isCollapsed ? styles.collapsed : '',
  ].join(' ');

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={handleDragStart} disabled={isPinned}>
      <div ref={nodeRef} className={monitorClasses} style={isPinned ? { position: 'fixed', top: 20, right: 20 } : {}}>
        {renderHeader()}
        {renderContent()}
      </div>
    </Draggable>
  );
};

export default MidiMonitor;
