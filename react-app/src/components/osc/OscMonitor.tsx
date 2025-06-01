import React, { useState, useEffect } from 'react';
import { useStore } from '../../store'; 
import styles from './OscMonitor.module.scss';
import { useSocket } from '../../context/SocketContext'; 
import { OscMessage } from '../../store'; // Import OscMessage type from store

export const OscMonitor: React.FC = () => {
  const oscMessagesFromStore = useStore(state => state.oscMessages);
  const addOscMessageToStore = useStore(state => state.addOscMessage);
  const [lastMessages, setLastMessages] = useState<Array<OscMessage>>([]);
  const [visible, setVisible] = useState(true);
  const [flashActive, setFlashActive] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<OscMessage | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { socket, connected: socketConnected } = useSocket();

  useEffect(() => {
    if (socket && socketConnected) {
      const handleOscMessage = (message: OscMessage) => {
        // console.log('OSC Message Received in Monitor, adding to store:', message);
        addOscMessageToStore(message); // Add message to Zustand store
        
        setFlashActive(true);
        const timer = setTimeout(() => setFlashActive(false), 200);
        return () => clearTimeout(timer); // Clear timer on new message or unmount
      };

      socket.on('oscMessage', handleOscMessage); 

      return () => {
        socket.off('oscMessage', handleOscMessage);
      };
    }
  }, [socket, socketConnected, addOscMessageToStore]);
  useEffect(() => {
    if (oscMessagesFromStore.length > 0) {
      const recentMessages = oscMessagesFromStore.slice(-10); // Show more messages
      setLastMessages(recentMessages);
    }
  }, [oscMessagesFromStore]);

  const handleMouseEnter = (msg: OscMessage, event: React.MouseEvent) => {
    setHoveredMessage(msg);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredMessage) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredMessage(null);
  };

  if (!socketConnected && lastMessages.length === 0) {
    return (
      <div className={`${styles.oscMonitor} ${visible ? '' : styles.collapsed}`}>
        <div className={styles.header} onClick={() => setVisible(!visible)}>
          <span className={styles.title}>OSC Monitor</span>
          <span className={styles.toggle}>{visible ? '▼' : '◀'}</span>
        </div>
        {visible && (
          <div className={styles.content}>
            <p className={styles.noData}>Socket not connected.</p>
            <p className={styles.noData}>OSC messages will appear here.</p>
          </div>
        )}
      </div>
    );
  }
  
  if (lastMessages.length === 0) {
    return (
      <div className={`${styles.oscMonitor} ${visible ? '' : styles.collapsed}`}>
        <div className={styles.header} onClick={() => setVisible(!visible)}>
          <span className={styles.title}>OSC Monitor</span>
          <span className={styles.toggle}>{visible ? '▼' : '◀'}</span>
        </div>
        {visible && (
          <div className={styles.content}>
            <p className={styles.noData}>No OSC messages received yet.</p>
            <p className={styles.noData}>Ensure OSC sources are configured and sending data.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.oscMonitor} ${flashActive ? styles.flash : ''} ${visible ? '' : styles.collapsed}`}>
      <div className={styles.header} onClick={() => setVisible(!visible)}>
        <span className={styles.title}>OSC Monitor</span>
        <span className={styles.status}>Recent: {oscMessagesFromStore.length}</span>
        <span className={styles.toggle}>{visible ? '▼' : '◀'}</span>
      </div>      {visible && (
        <div className={styles.content} onMouseMove={handleMouseMove}>
          {lastMessages.map((msg, index) => (
            <div 
              key={msg.timestamp || index} 
              className={styles.messageRow}
              onMouseEnter={(e) => handleMouseEnter(msg, e)}
              onMouseLeave={handleMouseLeave}
            >
              <span className={styles.address}>{msg.address}</span>
              <div className={styles.args}>
                {msg.args.map((arg, argIndex) => (
                  <span key={argIndex} className={styles.arg}>
                    {`${arg.type}: ${typeof arg.value === 'number' ? arg.value.toFixed(3) : String(arg.value)}`}
                  </span>
                ))}
              </div>
              <span className={styles.timestamp}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Hover tooltip */}
      {hoveredMessage && (
        <div 
          className={styles.hoverTooltip}
          style={{
            position: 'fixed',
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            zIndex: 10000
          }}
        >
          <div className={styles.tooltipHeader}>
            <strong>OSC Message Details</strong>
          </div>          <div className={styles.tooltipContent}>
            <div><strong>Address:</strong> {hoveredMessage.address}</div>
            {hoveredMessage.source && (
              <div><strong>Source:</strong> {hoveredMessage.source}</div>
            )}
            {hoveredMessage.timestamp && (
              <div><strong>Time:</strong> {new Date(hoveredMessage.timestamp).toLocaleString()}</div>
            )}
            <div><strong>Arguments:</strong></div>
            <div className={styles.argsDetail}>
              {hoveredMessage.args.map((arg, index) => (
                <div key={index} className={styles.argDetail}>
                  <span className={styles.argType}>{arg.type}</span>
                  <span className={styles.argValue}>
                    {typeof arg.value === 'number' ? 
                      `${arg.value} (${(arg.value * 100).toFixed(1)}%)` : 
                      String(arg.value)
                    }
                  </span>
                </div>
              ))}
            </div>
            {hoveredMessage.source && (
              <div><strong>Source:</strong> {hoveredMessage.source}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OscMonitor;
