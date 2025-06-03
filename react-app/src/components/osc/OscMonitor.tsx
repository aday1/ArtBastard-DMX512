import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
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
  const { socket, connected: socketConnected } = useSocket();
  const monitorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState<{ top: number; left: number; right: number; bottom: number } | undefined>(undefined);

  // Load position from localStorage and set drag constraints
  useEffect(() => {
    const savedX = localStorage.getItem('oscMonitorPositionX');
    const savedY = localStorage.getItem('oscMonitorPositionY');

    let initialX = 0;
    let initialY = 0;

    if (savedX !== null) {
      initialX = parseFloat(savedX);
    }
    if (savedY !== null) {
      initialY = parseFloat(savedY);
    }
    setPosition({ x: initialX, y: initialY });

    const calculateConstraints = () => {
      if (monitorRef.current) {
        // The component's position is fixed, so constraints are relative to the viewport.
        // The 'x' and 'y' in framer-motion are transform offsets.
        // Constraints define the allowable range for these offsets.
        // The element's initial CSS position is top: 20, right: 440px.
        // These are absolute limits for the component's top-left corner.
        setConstraints({
          left: 0 - (monitorRef.current.offsetLeft - initialX), // Allow dragging so left edge hits viewport left
          top: 0 - (monitorRef.current.offsetTop - initialY),   // Allow dragging so top edge hits viewport top
          right: window.innerWidth - monitorRef.current.offsetWidth - (monitorRef.current.offsetLeft - initialX),
          bottom: window.innerHeight - monitorRef.current.offsetHeight - (monitorRef.current.offsetTop - initialY),
        });
      } else {
         // Fallback if ref not ready, may need adjustment or ensure ref is ready
         // This calculation is tricky because offsetLeft/Top are relative to parent,
         // but for fixed elements, it's usually relative to viewport if no offset parent.
         // A simpler constraint: limit the x/y translation values directly.
         // If x=0, y=0 is the initial CSS position (top:20, right:440)
         // Then to not go off left: x > -(CSS_left_equivalent)
         // To not go off top: y > -CSS_top (which is -20)
         // To not go off right: x < window.innerWidth - CSS_left_equivalent - width
         // To not go off bottom: y < window.innerHeight - CSS_top - height

        // For now, let's use a simplified constraint assuming x,y are direct transforms
        // and the component's initial position is where it starts.
        // We want to constrain the final screen position of the element.
        // This needs the element's width and height.
        // Let's assume fixed width of 400px. Height is variable.
        // A common pattern is to pass a ref to dragConstraints for dynamic updates.
        // For now, a basic constraint to keep it somewhat in view.
        // This will be refined.
        const componentWidth = 400; // from style
        const componentHeight = monitorRef.current?.offsetHeight || 300; // Estimate or measure
        setConstraints({
          left: - (window.innerWidth - componentWidth - 20), // Approximation for initial 'right: 440px'
          top: -20, // Initial 'top: 20px'
          right: window.innerWidth - componentWidth - (window.innerWidth - componentWidth - 440), // Approx
          bottom: window.innerHeight - componentHeight - 20, // Approx
        });
      }
    };

    calculateConstraints();
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, []); // monitorRef.current won't be set here on first run

  // Effect to recalculate constraints if monitorRef becomes available or window resizes
  useEffect(() => {
    const calculateConstraints = () => {
      if (monitorRef.current) {
        const rect = monitorRef.current.getBoundingClientRect();
        // rect.x and rect.y are current screen positions *including* transform
        // position.x and position.y are the transform values
        // Initial CSS position: top=20, effectively left = window.innerWidth - 400 - 440 (if right=440, width=400)
        // This means the constraints for the x,y transform values should be:
        // x_min such that initial_css_left + x_min = 0  => x_min = -initial_css_left
        // y_min such that initial_css_top + y_min = 0  => y_min = -initial_css_top
        // x_max such that initial_css_left + x_max + width = window.innerWidth => x_max = window.innerWidth - width - initial_css_left
        // y_max such that initial_css_top + y_max + height = window.innerHeight => y_max = window.innerHeight - height - initial_css_top

        // The component has `right: 440px` and `width: 400px`.
        // So, its initial `left` is `window.innerWidth - 400 - 440`.
        const initialCssTop = 20;
        // We need to estimate initialCssLeft because 'right' is used.
        // This calculation needs to be done carefully.
        // Or, simpler: constrain the draggable area itself, not the transform values.
        // The `dragConstraints` prop can take a ref to an element that defines the bounds.
        // Let's try setting constraints on the x/y values directly.
        // This means x and y are the transform values.
        const componentWidth = monitorRef.current.offsetWidth;
        const componentHeight = monitorRef.current.offsetHeight;

        // If style is top: T, right: R, width: W
        // Effective left L = screenWidth - R - W
        // We want L + x >= 0  => x >= -L
        // We want T + y >= 0  => y >= -T
        // We want L + x + W <= screenWidth => x <= screenWidth - W - L
        // We want T + y + H <= screenHeight => y <= screenHeight - H - T

        const currentCssRight = 440; // From inline style
        const initialCssLeft = window.innerWidth - componentWidth - currentCssRight;

        setConstraints({
          left: -initialCssLeft,
          top: -initialCssTop,
          right: window.innerWidth - componentWidth - initialCssLeft,
          bottom: window.innerHeight - componentHeight - initialCssTop,
        });
      }
    };
    calculateConstraints(); // Recalculate when monitorRef is available
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, [monitorRef.current]); // Dependency on monitorRef.current

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    localStorage.setItem('oscMonitorPositionX', info.point.x.toString());
    localStorage.setItem('oscMonitorPositionY', info.point.y.toString());
    setPosition(info.point);
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
    // Add onPointerDown to the drag handle area to start dragging
    <div
      className={`${styles.header} handle`} // Retain 'handle' if CSS depends on it, but not for Draggable
      onPointerDown={(e) => {
        // Prevent dragging if a button in the header is clicked
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        dragControls.start(e);
      }}
      style={{ cursor: 'grab' }} // Indicate draggable area
    >
      <div className={styles.dragHandle}>
        <LucideIcon name="GripVertical" size={18} strokeWidth={1.5} />
      </div>
      <span className={styles.title}>OSC Monitor</span>
      {!isCollapsed && <span className={styles.status}>Recent: {oscMessagesFromStore.length}</span>}
      <div className={styles.controls}>
        {/* <button onClick={() => setIsPinned(!isPinned)} className={isPinned ? styles.active : ''}>
          <LucideIcon name="Pin" size={14} strokeWidth={1.5} />
        </button> */}
        <button onClick={() => setIsCollapsed(!isCollapsed)} onPointerDown={e => e.stopPropagation()}>
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

  return (
    <>
      <motion.div
        ref={monitorRef}
        className={monitorClasses}
        style={{
          position: 'fixed',
          top: 20, // Initial position
          right: 'calc(20px + 400px + 20px)', // Initial position
          zIndex: 999,
          width: '400px',
          x: position.x, // Apply stored/initial transform X
          y: position.y, // Apply stored/initial transform Y
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