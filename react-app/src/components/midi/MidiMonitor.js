import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';
export const MidiMonitor = () => {
    const midiMessages = useStore(state => state.midiMessages);
    const [lastMessages, setLastMessages] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [flashActive, setFlashActive] = useState(false);
    const monitorRef = useRef(null);
    const dragControls = useDragControls();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [constraints, setConstraints] = useState(undefined);
    // Load position from localStorage
    useEffect(() => {
        const savedX = localStorage.getItem('midiMonitorPositionX');
        const savedY = localStorage.getItem('midiMonitorPositionY');
        let initialX = 0;
        let initialY = 0;
        if (savedX !== null)
            initialX = parseFloat(savedX);
        if (savedY !== null)
            initialY = parseFloat(savedY);
        setPosition({ x: initialX, y: initialY });
    }, []);
    // Effect to calculate and set drag constraints
    useEffect(() => {
        const calculateConstraints = () => {
            if (monitorRef.current) {
                const componentWidth = monitorRef.current.offsetWidth;
                const componentHeight = monitorRef.current.offsetHeight;
                const initialCssTop = 20; // From inline style 'top: 20px'
                const initialCssRight = 20; // From inline style 'right: 20px'
                const initialCssLeft = window.innerWidth - componentWidth - initialCssRight;
                setConstraints({
                    left: -initialCssLeft,
                    top: -initialCssTop,
                    right: window.innerWidth - componentWidth - initialCssLeft,
                    bottom: window.innerHeight - componentHeight - initialCssTop,
                });
            }
        };
        calculateConstraints(); // Initial calculation
        window.addEventListener('resize', calculateConstraints);
        return () => window.removeEventListener('resize', calculateConstraints);
    }, [monitorRef.current]); // Recalculate if ref changes or on resize
    const handleDragEnd = (event, info) => {
        localStorage.setItem('midiMonitorPositionX', info.point.x.toString());
        localStorage.setItem('midiMonitorPositionY', info.point.y.toString());
        setPosition(info.point);
    };
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
    const renderHeader = () => (_jsxs("div", { className: `${styles.header} handle`, onPointerDown: (e) => {
            if (e.target.closest('button')) {
                return; // Don't start drag if a button in header is clicked
            }
            dragControls.start(e);
        }, style: { cursor: 'grab' }, children: [_jsx(LucideIcon, { name: "GripVertical", size: 18, className: styles.dragHandle }), _jsx("span", { className: styles.title, children: "MIDI Monitor" }), !isCollapsed && _jsxs("span", { className: styles.status, children: ["Recent: ", midiMessages.length] }), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), onPointerDown: e => e.stopPropagation(), children: isCollapsed ?
                        _jsx(LucideIcon, { name: "Maximize2", size: 14 }) :
                        _jsx(LucideIcon, { name: "Minimize2", size: 14 }) }) })] }));
    const renderContent = () => {
        if (isCollapsed) {
            return null;
        }
        if (lastMessages.length === 0) {
            return (_jsxs("div", { className: styles.content, children: [_jsx("p", { className: styles.noData, children: "No MIDI messages received yet." }), _jsx("p", { className: styles.noData, children: "Try moving controls on your MIDI device." })] }));
        }
        return (_jsx("div", { className: styles.content, children: lastMessages.map((msg, index) => (_jsxs("div", { className: styles.messageRow, children: [msg._type === 'cc' && (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.type, children: "CC" }), _jsxs("span", { className: styles.channel, children: ["Ch ", msg.channel + 1] }), _jsxs("span", { className: styles.controller, children: ["CC ", msg.controller] }), _jsx("span", { className: styles.value, children: msg.value }), _jsx("span", { className: styles.source, children: msg.source })] })), msg._type === 'noteon' && (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.type, children: "Note" }), _jsxs("span", { className: styles.channel, children: ["Ch ", msg.channel + 1] }), _jsxs("span", { className: styles.note, children: ["Note ", msg.note] }), _jsxs("span", { className: styles.velocity, children: ["Vel ", msg.velocity] }), _jsx("span", { className: styles.source, children: msg.source })] })), msg._type !== 'cc' && msg._type !== 'noteon' && (_jsxs("span", { children: ["Other: ", JSON.stringify(msg)] }))] }, index))) }));
    };
    const monitorClasses = [
        styles.midiMonitor,
        flashActive ? styles.flash : '',
        // isPinned ? styles.pinned : '', // Removed isPinned
        isCollapsed ? styles.collapsed : '',
    ].join(' ');
    return (_jsxs(motion.div, { ref: monitorRef, className: monitorClasses, style: {
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1050,
            width: '400px',
            x: position.x,
            y: position.y, // Apply stored/initial transform Y
        }, drag: true, dragControls: dragControls, dragListener: false, onDragEnd: handleDragEnd, dragConstraints: constraints, whileDrag: { cursor: 'grabbing' }, children: [renderHeader(), renderContent()] }));
};
export default MidiMonitor;
