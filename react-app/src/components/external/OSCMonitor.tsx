import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import styles from './ExternalDisplay.module.scss';

export const OSCMonitor: React.FC = () => {
  const { oscAssignments, oscActivity } = useStore();
  const [oscMessages, setOscMessages] = useState<Array<{
    id: string;
    timestamp: number;
    address: string;
    args: any[];
    channel?: number;
  }>>([]);

  useEffect(() => {
    // Listen for OSC events from the store
    const handleOscMessage = (event: CustomEvent) => {
      const message = event.detail;
      const newMessage = {
        id: (Date.now() + Math.random()).toString(),
        timestamp: Date.now(),
        address: message.address || '',
        args: message.args || [],
        channel: message.channel
      };

      setOscMessages(prev => [newMessage, ...prev.slice(0, 99)]); // Keep last 100 messages
    };

    // Add event listener for OSC messages
    window.addEventListener('oscMessage', handleOscMessage as EventListener);
    return () => window.removeEventListener('oscMessage', handleOscMessage as EventListener);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  const getActiveAssignments = () => {
    return oscAssignments
      .map((address, index) => ({ channel: index + 1, address }))
      .filter(item => item.address && item.address.trim() !== '' && item.address !== `/fixture/DMX${item.channel}`);
  };

  return (
    <div className={styles.monitorContainer}>
      <div className={styles.monitorHeader}>
        <h3>OSC Monitor</h3>
        <div className={styles.controls}>
          <button 
            onClick={() => setOscMessages([])}
            className={styles.clearButton}
          >
            Clear Messages
          </button>
        </div>
      </div>
      
      <div className={styles.monitorContent}>
        <div className={styles.oscAssignments}>
          <h4>OSC Channel Assignments</h4>
          <div className={styles.assignmentList}>
            {getActiveAssignments().map(({ channel, address }) => (
              <div key={channel} className={styles.assignmentItem}>
                <span className={styles.assignmentChannel}>CH {channel}</span>
                <span className={styles.assignmentAddress}>{address}</span>
                <span className={`${styles.assignmentActivity} ${oscActivity[channel - 1] ? styles.active : ''}`}>
                  {oscActivity[channel - 1] ? `Value: ${oscActivity[channel - 1]}` : 'No activity'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.messageList}>
          <h4>Live OSC Messages ({oscMessages.length}/100)</h4>
          <div className={styles.messageContainer}>
            {oscMessages.map(message => (
              <div key={message.id} className={styles.messageItem}>
                <span className={styles.messageTime}>{formatTimestamp(message.timestamp)}</span>
                <span className={styles.messageAddress}>{message.address}</span>
                <span className={styles.messageArgs}>
                  {message.args.map((arg, idx) => (
                    <span key={idx} className={styles.messageArg}>
                      {typeof arg === 'number' ? arg.toFixed(3) : String(arg)}
                    </span>
                  ))}
                </span>
                {message.channel && <span className={styles.messageChannel}>→ CH{message.channel}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
