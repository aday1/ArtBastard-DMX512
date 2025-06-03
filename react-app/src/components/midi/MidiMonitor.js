import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Minimize2, Maximize2, GripVertical } from 'lucide-react';
import { IconWrapper } from '../ui/IconWrapper';
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';
export const MidiMonitor = () => {
    const midiMessages = useStore(state => state.midiMessages);
    const [lastMessages, setLastMessages] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    // const [isPinned, setIsPinned] = useState(false); // Removed isPinned
    const [flashActive, setFlashActive] = useState(false);
    const nodeRef = useRef(null);
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
    const handleDragStart = (e) => {
        // Prevent dragging when clicking on buttons
        if (e.target.closest('button')) {
            return false;
        }
    };
    const renderHeader = () => (_jsxs("div", { className: `${styles.header} handle`, children: [_jsx(IconWrapper, { IconComponent: GripVertical, size: 18, className: styles.dragHandle }), _jsx("span", { className: styles.title, children: "MIDI Monitor" }), !isCollapsed && _jsxs("span", { className: styles.status, children: ["Recent: ", midiMessages.length] }), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), children: isCollapsed ?
                        _jsx(IconWrapper, { IconComponent: Maximize2, size: 14 }) :
                        _jsx(IconWrapper, { IconComponent: Minimize2, size: 14 }) }) })] }));
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
    return (_jsxs(Draggable, { nodeRef: nodeRef, handle: ".handle", onStart: handleDragStart, children: [" ", _jsxs("div", { ref: nodeRef, className: monitorClasses, style: { position: 'fixed', top: 20, right: 20, zIndex: 1000, width: '400px' }, children: [renderHeader(), renderContent()] })] }));
};
export default MidiMonitor;
