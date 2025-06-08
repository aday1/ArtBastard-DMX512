import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';
export const MidiMonitor = () => {
    const midiMessages = useStore(state => state.midiMessages);
    const debugTools = useStore(state => state.debugTools);
    const [lastMessages, setLastMessages] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [flashActive, setFlashActive] = useState(false);
    const monitorRef = useRef(null);
    // Don't render if midiMonitor is disabled in debugTools
    if (!debugTools.midiMonitor) {
        return null;
    }
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
    const renderHeader = () => (_jsxs("div", { className: `${styles.header} handle`, children: [_jsx("span", { className: styles.title, children: "MIDI Monitor" }), !isCollapsed && _jsxs("span", { className: styles.status, children: ["Recent: ", midiMessages.length] }), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), onPointerDown: e => e.stopPropagation(), title: isCollapsed ? "Expand" : "Minimize", children: isCollapsed ?
                        _jsx(LucideIcon, { name: "ChevronUp", size: 14 }) :
                        _jsx(LucideIcon, { name: "ChevronDown", size: 14 }) }) })] }));
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
        isCollapsed ? styles.collapsed : '',
    ].join(' ');
    return (_jsxs("div", { ref: monitorRef, className: monitorClasses, style: {
            zIndex: 1050,
        }, children: [renderHeader(), renderContent()] }));
};
export default MidiMonitor;
