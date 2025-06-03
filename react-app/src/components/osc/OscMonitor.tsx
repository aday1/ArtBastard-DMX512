import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './OscMonitor.module.scss';
import { useSocket } from '../../context/SocketContext';
import { OscMessage } from '../../store';

export const OscMonitor: React.FC = () => {
  const oscMessagesFromStore = useStore(state => state.oscMessages);
  const addOscMessageToStore = useStore(state => state.addOscMessage);
  const [lastMessages, setLastMessages] = useState<Array<OscMessage>>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<OscMessage | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { socket, connected: socketConnected } = useSocket();
  const monitorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // position stores transform offsets (x, y) from the initial CSS position
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState<{ top: number; left: number; right: number; bottom: number } | undefined>(undefined);

  // Define initial CSS fixed position (these are component constants, not state)
  const initialCssTop = 20;
  const initialCssRight = 440; // Equivalent to 'calc(20px + 400px + 20px)'
  // This will store the calculated initial CSS left offset, needed for handleDragEnd and constraints
  const initialCssLeftRef = useRef<number | null>(null);

  // Load position from localStorage (these are transform offsets)
  useEffect(() => {
    const savedX = localStorage.getItem('oscMonitorPositionX');
    const savedY = localStorage.getItem('oscMonitorPositionY');
    let x = 0;
    let y = 0;
    if (savedX !== null) x = parseFloat(savedX);
    if (savedY !== null) y = parseFloat(savedY);
    setPosition({ x, y });
  }, []);

  // Effect to calculate and set drag constraints, and validate initial position
  useEffect(() => {
    const calculateAndValidate = () => {
      if (monitorRef.current) {
        const componentWidth = monitorRef.current.offsetWidth;
        const componentHeight = monitorRef.current.offsetHeight;

        // Calculate the initial CSS left offset based on initialCssRight and componentWidth
        const calculatedCssLeft = window.innerWidth - componentWidth - initialCssRight;
        initialCssLeftRef.current = calculatedCssLeft; // Store for use in handleDragEnd

        // Validate current position (transform offsets + CSS position)
        let currentX = position.x;
        let currentY = position.y;

        const effectiveScreenX = calculatedCssLeft + currentX;
        const effectiveScreenY = initialCssTop + currentY;

        let positionNeedsReset = false;
        if (effectiveScreenX < 0) {
          currentX = -calculatedCssLeft;
          positionNeedsReset = true;
        }
        if (effectiveScreenY < 0) {
          currentY = -initialCssTop;
          positionNeedsReset = true;
        }
        if (effectiveScreenX + componentWidth > window.innerWidth) {
          currentX = window.innerWidth - componentWidth - calculatedCssLeft;
          positionNeedsReset = true;
        }
        if (effectiveScreenY + componentHeight > window.innerHeight) {
          currentY = window.innerHeight - componentHeight - initialCssTop;
          positionNeedsReset = true;
        }

        if (positionNeedsReset) {
          setPosition({ x: currentX, y: currentY });
          localStorage.setItem('oscMonitorPositionX', currentX.toString());
          localStorage.setItem('oscMonitorPositionY', currentY.toString());
        }

        // Set drag constraints based on transform model
        setConstraints({
          left: -calculatedCssLeft,
          top: -initialCssTop,
          right: window.innerWidth - componentWidth - calculatedCssLeft,
          bottom: window.innerHeight - componentHeight - initialCssTop,
        });
      }
    };

    if (monitorRef.current) {
       calculateAndValidate();
    }

    window.addEventListener('resize', calculateAndValidate);
    return () => window.removeEventListener('resize', calculateAndValidate);
  }, [monitorRef, position.x, position.y]); // monitorRef is stable, position changes trigger validation.

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (monitorRef.current && initialCssLeftRef.current !== null) {
        const calculatedCssLeft = initialCssLeftRef.current;
        const newTransformX = info.point.x - calculatedCssLeft;
        const newTransformY = info.point.y - initialCssTop;

        localStorage.setItem('oscMonitorPositionX', newTransformX.toString());
        localStorage.setItem('oscMonitorPositionY', newTransformY.toString());
        setPosition({ x: newTransformX, y: newTransformY });
    }
  };

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
  };

  const renderHeader = () => (
    <div
      className={`${styles.header} handle`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        dragControls.start(e);
      }}
      style={{ cursor: 'grab' }}
    >
      <div className={styles.dragHandle}>
        <LucideIcon name="GripVertical" size={18} strokeWidth={1.5} />
      </div>
      <span className={styles.title}>OSC Monitor</span>
      {!isCollapsed && <span className={styles.status}>Recent: {oscMessagesFromStore.length}</span>}
      <div className={styles.controls}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          onPointerDown={e => e.stopPropagation()}
          title={isCollapsed ? "Expand" : "Minimize"}
        >
          {isCollapsed ? 
            <LucideIcon name="ChevronUp" size={14} strokeWidth={1.5} /> : 
            <LucideIcon name="ChevronDown" size={14} strokeWidth={1.5} />
          }
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
    isCollapsed ? styles.collapsed : '',
  ].join(' ');

  return (
    <>
      <motion.div
        ref={monitorRef}
        className={monitorClasses}
        style={{
          position: 'fixed',
          top: initialCssTop,
          right: initialCssRight,
          zIndex: 1040,
          width: '400px',
          x: position.x,
          y: position.y,
        }}
        drag
        dragControls={dragControls}
        dragListener={false} // We use the header with onPointerDown to start dragging
        onDragEnd={handleDragEnd}
        dragConstraints={constraints}
        // While dragging, ensure the cursor indicates grabbing
        whileDrag={{ cursor: 'grabbing' }}
      >
        {renderHeader()}
        {renderContent()}
      </motion.div>

      {/* Hover tooltip - position relative to mouse, so should be fine */}
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