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
            {Object.entries(midiMappings).map(([channel, mapping]) => (
              <div key={channel} className={styles.mappingItem}>
                <span className={styles.mappingChannel}>CH {parseInt(channel) + 1}</span>
                <span className={styles.mappingType}>{mapping.note !== undefined ? 'Note' : 'CC'}</span>
                <span className={styles.mappingDetails}>
                  Ch:{mapping.channel} {mapping.note !== undefined ? `Note:${mapping.note}` : `CC:${mapping.controller}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.messageList}>
          <h4>Live MIDI Messages ({midiMessages.length}/100)</h4>
          <div className={styles.messageContainer}>
            {midiMessages.map(message => (
              <div key={message.id} className={`${styles.messageItem} ${styles[message.type]}`}>
                <span className={styles.messageTime}>{formatTimestamp(message.timestamp)}</span>
                <span className={styles.messageType}>{message.type.toUpperCase()}</span>
                <span className={styles.messageChannel}>Ch:{message.channel}</span>
                {message.note !== undefined && <span className={styles.messageNote}>Note:{message.note}</span>}
                {message.velocity !== undefined && <span className={styles.messageVelocity}>Vel:{message.velocity}</span>}
                {message.controller !== undefined && <span className={styles.messageController}>CC:{message.controller}</span>}
                {message.value !== undefined && <span className={styles.messageValue}>Val:{message.value}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
