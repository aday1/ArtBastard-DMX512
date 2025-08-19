import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import styles from './ExternalDisplay.module.scss';

export const MIDIMonitor: React.FC = () => {
  const { midiMappings } = useStore();
  const [midiMessages, setMidiMessages] = useState<Array<{
    id: string;
    timestamp: number;
    type: string;
    channel: number;
    note?: number;
    velocity?: number;
    controller?: number;
    value?: number;
    raw: any;
  }>>([]);

  useEffect(() => {
    // Listen for MIDI events from the store
    const handleMidiMessage = (event: CustomEvent) => {
      const message = event.detail;
      const newMessage = {
        id: (Date.now() + Math.random()).toString(),
        timestamp: Date.now(),
        type: message.type || 'unknown',
        channel: message.channel || 0,
        note: message.note,
        velocity: message.velocity,
        controller: message.controller,
        value: message.value,
        raw: message
      };

      setMidiMessages(prev => [newMessage, ...prev.slice(0, 99)]); // Keep last 100 messages
    };

    // Add event listener for MIDI messages
    window.addEventListener('midiMessage', handleMidiMessage as EventListener);
    return () => window.removeEventListener('midiMessage', handleMidiMessage as EventListener);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <div className={styles.monitorContainer}>
      <div className={styles.monitorHeader}>
        <h3>MIDI Monitor</h3>
        <div className={styles.controls}>
          <button 
            onClick={() => setMidiMessages([])}
            className={styles.clearButton}
          >
            Clear Messages
          </button>
        </div>
      </div>
      
      <div className={styles.monitorContent}>
        <div className={styles.midiMappings}>
          <h4>Active MIDI Mappings</h4>
          <div className={styles.mappingList}>
            {Object.entries(midiMappings).map(([id, mapping]) => (
              <div key={id} className={styles.mappingItem}>
                <div className={styles.mappingHeader}>
                  {mapping.note !== undefined ? `Note ${mapping.note}` : `CC ${mapping.controller}`} on Ch {mapping.channel}
                </div>
                <div className={styles.mappingDetails}>
                  {/* The 'target' is not defined in the store, so we display what is available */}
                  Mapped to an action
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.messageListContainer}>
          <h4>Live MIDI Messages ({midiMessages.length}/100)</h4>
          <div className={styles.messageContainer}>
            {midiMessages.map(message => (
              <div key={message.id} className={`${styles.messageItem} ${styles[message.type]}`}>
                <span className={styles.messageTime}>{formatTimestamp(message.timestamp)}</span>
                <span className={`${styles.messageType} ${styles[message.type]}`}>{message.type.toUpperCase()}</span>
                <div className={styles.messageDetails}>
                  <span><strong>Ch:</strong>{message.channel}</span>
                  {message.note !== undefined && <span><strong>Note:</strong>{message.note}</span>}
                  {message.velocity !== undefined && <span><strong>Vel:</strong>{message.velocity}</span>}
                  {message.controller !== undefined && <span><strong>CC:</strong>{message.controller}</span>}
                  {message.value !== undefined && <span><strong>Val:</strong>{message.value}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
