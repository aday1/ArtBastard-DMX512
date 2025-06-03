import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import { useStore } from '../../store';
import styles from './OscMonitor.module.scss';
import { useSocket } from '../../context/SocketContext';
export const OscMonitor = () => {
    const oscMessagesFromStore = useStore(state => state.oscMessages);
    const addOscMessageToStore = useStore(state => state.addOscMessage);
    const [lastMessages, setLastMessages] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    // const [isPinned, setIsPinned] = useState(false); // Removed isPinned
    const [flashActive, setFlashActive] = useState(false);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { socket, connected: socketConnected } = useSocket();
    const monitorRef = useRef(null);
    const dragControls = useDragControls();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [constraints, setConstraints] = useState(undefined);
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
                    left: 0 - (monitorRef.current.offsetLeft - initialX),
                    top: 0 - (monitorRef.current.offsetTop - initialY),
                    right: window.innerWidth - monitorRef.current.offsetWidth - (monitorRef.current.offsetLeft - initialX),
                    bottom: window.innerHeight - monitorRef.current.offsetHeight - (monitorRef.current.offsetTop - initialY),
                });
            }
            else {
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
                    left: -(window.innerWidth - componentWidth - 20),
                    top: -20,
                    right: window.innerWidth - componentWidth - (window.innerWidth - componentWidth - 440),
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
    const handleDragEnd = (event, info) => {
        localStorage.setItem('oscMonitorPositionX', info.point.x.toString());
        localStorage.setItem('oscMonitorPositionY', info.point.y.toString());
        setPosition(info.point);
    };
    useEffect(() => {
        if (socket && socketConnected) {
            const handleOscMessage = (message) => {
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
    const handleMouseEnter = (msg, event) => {
        setHoveredMessage(msg);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };
    const handleMouseMove = (event) => {
        if (hoveredMessage) {
            setMousePosition({ x: event.clientX, y: event.clientY });
        }
    };
    const handleMouseLeave = () => {
        setHoveredMessage(null);
    };
    const renderHeader = () => (
    // Add onPointerDown to the drag handle area to start dragging
    _jsxs("div", { className: `${styles.header} handle`, onPointerDown: (e) => {
            // Prevent dragging if a button in the header is clicked
            if (e.target.closest('button')) {
                return;
            }
            dragControls.start(e);
        }, style: { cursor: 'grab' }, children: [_jsx("div", { className: styles.dragHandle, children: _jsx(LucideIcon, { name: "GripVertical", size: 18, strokeWidth: 1.5 }) }), _jsx("span", { className: styles.title, children: "OSC Monitor" }), !isCollapsed && _jsxs("span", { className: styles.status, children: ["Recent: ", oscMessagesFromStore.length] }), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), onPointerDown: e => e.stopPropagation(), children: isCollapsed ? (_jsx(LucideIcon, { name: "Maximize2", size: 14, strokeWidth: 1.5 })) : (_jsx(LucideIcon, { name: "Minimize2", size: 14, strokeWidth: 1.5 })) }) })] }));
    const renderContent = () => {
        if (isCollapsed) {
            return null;
        }
        if (!socketConnected && lastMessages.length === 0) {
            return (_jsxs("div", { className: styles.content, children: [_jsx("p", { className: styles.noData, children: "Socket not connected." }), _jsx("p", { className: styles.noData, children: "OSC messages will appear here." })] }));
        }
        if (lastMessages.length === 0) {
            return (_jsxs("div", { className: styles.content, children: [_jsx("p", { className: styles.noData, children: "No OSC messages received yet." }), _jsx("p", { className: styles.noData, children: "Ensure OSC sources are configured and sending data." })] }));
        }
        return (_jsx("div", { className: styles.content, onMouseMove: handleMouseMove, children: lastMessages.map((msg, index) => (_jsxs("div", { className: styles.messageRow, onMouseEnter: (e) => handleMouseEnter(msg, e), onMouseLeave: handleMouseLeave, children: [_jsx("span", { className: styles.address, children: msg.address }), _jsx("div", { className: styles.args, children: msg.args.map((arg, argIndex) => (_jsx("span", { className: styles.arg, children: `${arg.type}: ${typeof arg.value === 'number' ? arg.value.toFixed(3) : String(arg.value)}` }, argIndex))) }), _jsx("span", { className: styles.timestamp, children: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '' })] }, msg.timestamp || index))) }));
    };
    const monitorClasses = [
        styles.oscMonitor,
        flashActive ? styles.flash : '',
        // isPinned ? styles.pinned : '', // Removed isPinned
        isCollapsed ? styles.collapsed : '',
    ].join(' ');
    return (_jsxs(_Fragment, { children: [_jsxs(motion.div, { ref: monitorRef, className: monitorClasses, style: {
                    position: 'fixed',
                    top: 20,
                    right: 'calc(20px + 400px + 20px)',
                    zIndex: 1040,
                    width: '400px',
                    x: position.x,
                    y: position.y, // Apply stored/initial transform Y
                }, drag: true, dragControls: dragControls, dragListener: false, onDragEnd: handleDragEnd, dragConstraints: constraints, 
                // While dragging, ensure the cursor indicates grabbing
                whileDrag: { cursor: 'grabbing' }, children: [renderHeader(), renderContent()] }), hoveredMessage && !isCollapsed && (_jsxs("div", { className: styles.hoverTooltip, style: {
                    position: 'fixed',
                    left: mousePosition.x + 15,
                    top: mousePosition.y - 15,
                    zIndex: 10000, // Ensure tooltip is on top
                }, children: [_jsx("div", { className: styles.tooltipHeader, children: _jsx("strong", { children: "OSC Message Details" }) }), _jsxs("div", { className: styles.tooltipContent, children: [_jsxs("div", { children: [_jsx("strong", { children: "Address:" }), " ", hoveredMessage.address] }), hoveredMessage.source && (_jsxs("div", { children: [_jsx("strong", { children: "Source:" }), " ", hoveredMessage.source] })), hoveredMessage.timestamp && (_jsxs("div", { children: [_jsx("strong", { children: "Time:" }), " ", new Date(hoveredMessage.timestamp).toLocaleString()] })), _jsx("div", { children: _jsx("strong", { children: "Arguments:" }) }), _jsx("div", { className: styles.argsDetail, children: hoveredMessage.args.map((arg, index) => (_jsxs("div", { className: styles.argDetail, children: [_jsx("span", { className: styles.argType, children: arg.type }), _jsx("span", { className: styles.argValue, children: typeof arg.value === 'number' ?
                                                `${arg.value.toFixed(3)} (${(arg.value * 100).toFixed(1)}%)` : // Keep detailed number value
                                                String(arg.value) })] }, index))) })] })] }))] }));
};
export default OscMonitor;
