import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { LucideIcon } from '../ui/LucideIcon'; // Use LucideIcon wrapper instead
import styles from './MidiClock.module.scss';
import { useStore } from '../../store';
export const MidiClock = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const clockRef = useRef(null);
    const dragControls = useDragControls();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [constraints, setConstraints] = useState(undefined);
    const { selectedMidiClockHostId = 'internal', // Default to 'internal' for safety
    availableMidiClockHosts = [], midiClockBpm, midiClockIsPlaying, midiClockCurrentBeat, midiClockCurrentBar, requestToggleMasterClockPlayPause, // Updated action name
     } = useStore(state => ({
        selectedMidiClockHostId: state.selectedMidiClockHostId,
        availableMidiClockHosts: state.availableMidiClockHosts,
        midiClockBpm: state.midiClockBpm,
        midiClockIsPlaying: state.midiClockIsPlaying,
        midiClockCurrentBeat: state.midiClockCurrentBeat,
        midiClockCurrentBar: state.midiClockCurrentBar,
        requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause, // Updated action
    }));
    // Load position from localStorage
    useEffect(() => {
        const savedX = localStorage.getItem('midiClockPositionX');
        const savedY = localStorage.getItem('midiClockPositionY');
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
            if (clockRef.current) {
                const componentWidth = clockRef.current.offsetWidth;
                const componentHeight = clockRef.current.offsetHeight;
                // From MidiClock.module.scss
                const initialCssTop = 20;
                const initialCssLeft = 860;
                // Assuming the 'parent' for absolute positioning is the viewport
                const parentWidth = window.innerWidth;
                const parentHeight = window.innerHeight;
                setConstraints({
                    left: -initialCssLeft,
                    top: -initialCssTop,
                    right: parentWidth - initialCssLeft - componentWidth,
                    bottom: parentHeight - initialCssTop - componentHeight, // Allows dragging down until component's bottom edge hits viewport bottom
                });
            }
        };
        calculateConstraints();
        window.addEventListener('resize', calculateConstraints);
        return () => window.removeEventListener('resize', calculateConstraints);
    }, [clockRef.current]); // Recalculate if ref changes or on resize
    const handleDragEnd = (event, info) => {
        localStorage.setItem('midiClockPositionX', info.point.x.toString());
        localStorage.setItem('midiClockPositionY', info.point.y.toString());
        setPosition(info.point);
    };
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);
    // Local internal MIDI clock useEffect has been REMOVED.
    // Beat and bar updates will now come from the backend via WebSocket and update the Zustand store.
    const renderHeader = () => {
        const selectedHost = availableMidiClockHosts.find(host => host.id === selectedMidiClockHostId);
        // Default to "Internal Clock" if selectedMidiClockHostId is null or 'none' for display purposes
        const displayHostId = selectedMidiClockHostId === null || selectedMidiClockHostId === 'none' ? 'internal' : selectedMidiClockHostId;
        const currentHost = availableMidiClockHosts.find(host => host.id === displayHostId);
        let syncStatusText = 'Internal Clock';
        if (currentHost) {
            if (currentHost.id !== 'internal') { // Assuming 'internal' is the ID for internal clock in availableMidiClockHosts
                syncStatusText = `Sync: ${currentHost.name}`;
            }
            else {
                syncStatusText = currentHost.name; // e.g., "Internal Clock"
            }
        }
        else if (selectedMidiClockHostId && selectedMidiClockHostId !== 'internal') {
            syncStatusText = `Sync: ${selectedMidiClockHostId}`; // Fallback if not in available list but selected
        }
        const isActuallySynced = selectedMidiClockHostId !== null && selectedMidiClockHostId !== 'internal';
        return (_jsxs("div", { className: `${styles.header} handle`, onPointerDown: (e) => {
                if (e.target.closest('button')) {
                    return; // Don't start drag if a button in header is clicked
                }
                dragControls.start(e);
            }, style: { cursor: 'grab' }, children: [_jsx(LucideIcon, { name: "GripVertical", size: 18, className: styles.dragHandle }), _jsx("span", { className: styles.title, children: "MIDI Clock" }), !isCollapsed && (_jsxs("span", { className: `${styles.syncStatus} ${isActuallySynced ? styles.synced : styles.notSynced}`, children: [isActuallySynced ?
                            _jsx(LucideIcon, { name: "Zap", size: 12 }) :
                            _jsx(LucideIcon, { name: "ZapOff", size: 12 }), syncStatusText] })), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), onPointerDown: e => e.stopPropagation(), children: isCollapsed ?
                            _jsx(LucideIcon, { name: "Maximize2", size: 14 }) :
                            _jsx(LucideIcon, { name: "Minimize2", size: 14 }) }) })] }));
    };
    const renderContent = () => {
        if (isCollapsed) {
            return null;
        }
        // const currentBeat = beat % 4; // Assuming 4/4 time
        // const currentBar = Math.floor(beat / 4) + bar;
        return (_jsxs("div", { className: styles.content, children: [_jsx("div", { className: styles.timeDisplay, children: currentTime.toLocaleTimeString() }), _jsxs("div", { className: styles.bpmDisplay, children: ["BPM: ", midiClockBpm.toFixed(2), " | Bar: ", midiClockCurrentBar, " | Beat: ", midiClockCurrentBeat] }), _jsxs("div", { className: styles.transportControls, children: [_jsx("button", { disabled: selectedMidiClockHostId !== 'internal', onClick: () => {
                                // The disabled attribute should prevent this, but check is safe
                                if (selectedMidiClockHostId === 'internal') {
                                    requestToggleMasterClockPlayPause(); // Use new action
                                }
                            }, children: midiClockIsPlaying ? '❚❚ Pause' : '▶️ Play' }), _jsx("button", { disabled: selectedMidiClockHostId !== 'internal', children: "\u23F9\uFE0F Stop" }), " "] }), selectedMidiClockHostId === 'ableton-link' && (_jsx("div", { className: styles.linkStatus, children: "Link Peers: 0" }))] }));
    };
    const clockClasses = [
        styles.midiClock,
        isCollapsed ? styles.collapsed : '',
        selectedMidiClockHostId !== 'none' ? styles.externalSync : '',
    ].join(' ');
    return (_jsxs(motion.div, { ref: clockRef, className: clockClasses, style: {
            // position: 'absolute' is set by the CSS class.
            // top, left are also set by CSS. Framer Motion will add transform: translate(x,y)
            x: position.x,
            y: position.y, // Apply stored/initial transform Y
        }, drag: true, dragControls: dragControls, dragListener: false, onDragEnd: handleDragEnd, dragConstraints: constraints, whileDrag: { cursor: 'grabbing' }, children: [renderHeader(), renderContent()] }));
};
export default MidiClock;
