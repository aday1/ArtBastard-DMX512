import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
// import { motion, useDragControls, PanInfo } from 'framer-motion'; // Removed framer-motion
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './OscMonitor.module.scss';
import { useSocket } from '../../context/SocketContext';
export const OscMonitor = () => {
    const oscMessagesFromStore = useStore(state => state.oscMessages);
    const debugTools = useStore(state => state.debugTools);
    const addOscMessageToStore = useStore(state => state.addOscMessage);
    const [lastMessages, setLastMessages] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [flashActive, setFlashActive] = useState(false);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { socket, connected: socketConnected } = useSocket();
    const monitorRef = useRef(null);
    // Don't render if oscMonitor is disabled in debugTools
    if (!debugTools.oscMonitor) {
        return null;
    }
    // // position stores transform offsets (x, y) from the initial CSS position
    // const [position, setPosition] = useState({ x: 0, y: 0 }); // Removed
    // const [constraints, setConstraints] = useState<{ top: number; left: number; right: number; bottom: number } | undefined>(undefined); // Removed
    // // Define initial CSS fixed position (these are component constants, not state)
    // const initialCssTop = 20; // Removed
    // const initialCssRight = 440; // Removed
    // // This will store the calculated initial CSS left offset, needed for handleDragEnd and constraints
    // const initialCssLeftRef = useRef<number | null>(null); // Removed
    // // Load position from localStorage (these are transform offsets)
    // useEffect(() => {
    //   const savedX = localStorage.getItem('oscMonitorPositionX');
    //   const savedY = localStorage.getItem('oscMonitorPositionY');
    //   let x = 0;
    //   let y = 0;
    //   if (savedX !== null) x = parseFloat(savedX);
    //   if (savedY !== null) y = parseFloat(savedY);
    //   setPosition({ x, y });
    // }, []); // Removed localStorage logic
    // // Effect to calculate and set drag constraints, and validate initial position
    // useEffect(() => {
    //   // ... Entire calculateAndValidate logic removed ...
    // }, [monitorRef, position.x, position.y]); // Removed constraint logic
    // const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    //   // ... Entire handleDragEnd logic removed ...
    // }; // Removed drag end handler
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
    const renderHeader = () => (_jsxs("div", { className: `${styles.header} handle`, children: [_jsx("span", { className: styles.title, children: "OSC Monitor" }), !isCollapsed && _jsxs("span", { className: styles.status, children: ["Recent: ", oscMessagesFromStore.length] }), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), onPointerDown: e => e.stopPropagation(), title: isCollapsed ? "Expand" : "Minimize", children: isCollapsed ?
                        _jsx(LucideIcon, { name: "ChevronUp", size: 14, strokeWidth: 1.5 }) :
                        _jsx(LucideIcon, { name: "ChevronDown", size: 14, strokeWidth: 1.5 }) }) })] }));
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
        isCollapsed ? styles.collapsed : '',
    ].join(' ');
    return (_jsxs(_Fragment, { children: [_jsxs("div", { ref: monitorRef, className: monitorClasses, style: {
                    // position: 'fixed',
                    // top: initialCssTop,
                    // right: initialCssRight,
                    zIndex: 1040, // Keep zIndex
                    // width: '400px', // Will be in SCSS
                    // x: position.x, // Removed
                    // y: position.y, // Removed
                }, children: [renderHeader(), renderContent()] }), hoveredMessage && !isCollapsed && (_jsxs("div", { className: styles.hoverTooltip, style: {
                    position: 'fixed',
                    left: mousePosition.x + 15,
                    top: mousePosition.y - 15,
                    zIndex: 10000, // Ensure tooltip is on top
                }, children: [_jsx("div", { className: styles.tooltipHeader, children: _jsx("strong", { children: "OSC Message Details" }) }), _jsxs("div", { className: styles.tooltipContent, children: [_jsxs("div", { children: [_jsx("strong", { children: "Address:" }), " ", hoveredMessage.address] }), hoveredMessage.source && (_jsxs("div", { children: [_jsx("strong", { children: "Source:" }), " ", hoveredMessage.source] })), hoveredMessage.timestamp && (_jsxs("div", { children: [_jsx("strong", { children: "Time:" }), " ", new Date(hoveredMessage.timestamp).toLocaleString()] })), _jsx("div", { children: _jsx("strong", { children: "Arguments:" }) }), _jsx("div", { className: styles.argsDetail, children: hoveredMessage.args.map((arg, index) => (_jsxs("div", { className: styles.argDetail, children: [_jsx("span", { className: styles.argType, children: arg.type }), _jsx("span", { className: styles.argValue, children: typeof arg.value === 'number' ?
                                                `${arg.value.toFixed(3)} (${(arg.value * 100).toFixed(1)}%)` : // Keep detailed number value
                                                String(arg.value) })] }, index))) })] })] }))] }));
};
export default OscMonitor;
