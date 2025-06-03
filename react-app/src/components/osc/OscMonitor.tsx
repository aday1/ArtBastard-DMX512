import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import { useStore } from '../../store';
import styles from './OscMonitor.module.scss';
import { useSocket } from '../../context/SocketContext';
import { OscMessage } from '../../store';

export const OscMonitor: React.FC = () => {
  const oscMessagesFromStore = useStore(state => state.oscMessages);
  const addOscMessageToStore = useStore(state => state.addOscMessage);
  const [lastMessages, setLastMessages] = useState<Array<OscMessage>>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // const [isPinned, setIsPinned] = useState(false); // Removed isPinned
  const [flashActive, setFlashActive] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<OscMessage | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const { socket, connected: socketConnected } = useSocket();
  const nodeRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before Draggable tries to use the ref
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (socket && socketConnected) {
      const handleOscMessage = (message: OscMessage) => {
        addOscMessageToStore(message);
        setFlashActive(true);
        const timer = setTimeout(() => setFlashActive(false), 200);
        return () => clearTimeout(timer);
      };
      socket.on('oscMessage', handleOscMessage);
      return () => {
        socket.off('oscMessage', handleOscMessage);
      };
    }
  }, [socket, socketConnected, addOscMessageToStore]);

  useEffect(() => {
    if (oscMessagesFromStore.length > 0) {
      const recentMessages = oscMessagesFromStore.slice(-10);
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
  };  const handleDragStart = (e: any): false | void => {
    if (e.target.closest('button')) {
      // Prevent dragging when clicking on header buttons
      return false;
    }
  };const renderHeader = () => (
    <div className={`${styles.header} handle`}>
      <div className={styles.dragHandle}>
        <LucideIcon name="GripVertical" size={18} strokeWidth={1.5} />
      </div>
      <span className={styles.title}>OSC Monitor</span>
      {!isCollapsed && <span className={styles.status}>Recent: {oscMessagesFromStore.length}</span>}
      <div className={styles.controls}>
        {/* <button onClick={() => setIsPinned(!isPinned)} className={isPinned ? styles.active : ''}>
          <LucideIcon name="Pin" size={14} strokeWidth={1.5} />
        </button> */}
        <button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? (
            <LucideIcon name="Maximize2" size={14} strokeWidth={1.5} />
          ) : (
            <LucideIcon name="Minimize2" size={14} strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isCollapsed) {
      return null;
    }

    if (!socketConnected && lastMessages.length === 0) {
      return (
        <div className={styles.content}>
          <p className={styles.noData}>Socket not connected.</p>
          <p className={styles.noData}>OSC messages will appear here.</p>
        </div>
      );
    }

    if (lastMessages.length === 0) {
      return (
        <div className={styles.content}>
          <p className={styles.noData}>No OSC messages received yet.</p>
          <p className={styles.noData}>Ensure OSC sources are configured and sending data.</p>
        </div>
      );
    }

    return (
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
    );
  };
  const monitorClasses = [
    styles.oscMonitor,
    flashActive ? styles.flash : '',
    // isPinned ? styles.pinned : '', // Removed isPinned
    isCollapsed ? styles.collapsed : '',
  ].join(' ');

  // Don't render Draggable until component is mounted and ref is ready
  if (!isMounted) {
    return (
      <>
        <div
          className={monitorClasses}
          style={{ position: 'fixed', top: 20, right: 'calc(20px + 400px + 20px)', zIndex: 999, width: '400px' }}
        >
          {renderHeader()}
          {renderContent()}
        </div>

        {/* Hover tooltip - kept outside of Draggable to avoid positioning issues */}
        {hoveredMessage && !isCollapsed && (
          <div
            className={styles.hoverTooltip}
            style={{
              position: 'fixed',
              left: mousePosition.x + 15,
              top: mousePosition.y - 15,
              zIndex: 10000,
            }}
          >
            <div className={styles.tooltipHeader}>
              <strong>OSC Message Details</strong>
            </div>
            <div className={styles.tooltipContent}>
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
                        `${arg.value.toFixed(3)} (${(arg.value * 100).toFixed(1)}%)` :
                        String(arg.value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Draggable nodeRef={nodeRef} handle=".handle" onStart={handleDragStart} /* disabled={isPinned} */> {/* Removed disabled prop */}
        <div
          ref={nodeRef}
          className={monitorClasses}
          style={{ position: 'fixed', top: 20, right: 'calc(20px + 400px + 20px)', zIndex: 999, width: '400px' }} // Added fixed positioning
        >
          {renderHeader()}
          {renderContent()}
        </div>
      </Draggable>

      {/* Hover tooltip - kept outside of Draggable to avoid positioning issues */}
      {hoveredMessage && !isCollapsed && (
        <div
          className={styles.hoverTooltip}
          style={{
            position: 'fixed',
            left: mousePosition.x + 15, // Adjusted for better visibility from cursor
            top: mousePosition.y - 15,  // Adjusted for better visibility from cursor
            zIndex: 10000, // Ensure tooltip is on top
          }}
        >
          <div className={styles.tooltipHeader}>
            <strong>OSC Message Details</strong>
          </div>
          <div className={styles.tooltipContent}>
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
                      `${arg.value.toFixed(3)} (${(arg.value * 100).toFixed(1)}%)` : // Keep detailed number value
                      String(arg.value)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OscMonitor;
