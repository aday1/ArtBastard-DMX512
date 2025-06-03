import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Minimize2, Maximize2, GripVertical, Zap, ZapOff } from 'lucide-react'; // Added Zap icons
import { IconWrapper } from '../ui/IconWrapper';
import styles from './MidiClock.module.scss';
import { useStore } from '../../store';
export const MidiClock = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const nodeRef = useRef(null);
    const { selectedMidiClockHostId = 'none', availableMidiClockHosts = [], midiClockBpm, midiClockIsPlaying, midiClockCurrentBeat, midiClockCurrentBar, toggleInternalMidiClockPlayState, setMidiClockBeatBar } = useStore(state => ({
        selectedMidiClockHostId: state.selectedMidiClockHostId,
        availableMidiClockHosts: state.availableMidiClockHosts,
        midiClockBpm: state.midiClockBpm,
        midiClockIsPlaying: state.midiClockIsPlaying,
        midiClockCurrentBeat: state.midiClockCurrentBeat,
        midiClockCurrentBar: state.midiClockCurrentBar,
        toggleInternalMidiClockPlayState: state.toggleInternalMidiClockPlayState,
        setMidiClockBeatBar: state.setMidiClockBeatBar,
    }));
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);
    // Effect for internal MIDI clock
    useEffect(() => {
        let intervalId = undefined;
        if (midiClockIsPlaying && selectedMidiClockHostId === 'none' && midiClockBpm > 0) {
            const intervalDuration = (60 * 1000) / midiClockBpm; // Update per beat
            intervalId = setInterval(() => {
                const currentBeat = useStore.getState().midiClockCurrentBeat;
                const currentBar = useStore.getState().midiClockCurrentBar;
                let nextBeat = currentBeat + 1;
                let nextBar = currentBar;
                if (nextBeat > 4) { // Assuming 4/4 time
                    nextBeat = 1;
                    nextBar += 1;
                }
                useStore.getState().setMidiClockBeatBar(nextBeat, nextBar);
            }, intervalDuration);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [midiClockIsPlaying, midiClockBpm, selectedMidiClockHostId, setMidiClockBeatBar]);
    const handleDragStart = (e) => {
        if (e.target.closest('button')) {
            return false;
        }
    };
    const renderHeader = () => {
        const selectedHost = availableMidiClockHosts.find(host => host.id === selectedMidiClockHostId);
        const syncStatusText = selectedHost && selectedHost.id !== 'none'
            ? `Sync: ${selectedHost.name}`
            : 'Internal Clock';
        const isActuallySynced = selectedHost && selectedHost.id !== 'none'; // Placeholder for real sync status
        return (_jsxs("div", { className: `${styles.header} handle`, children: [_jsx(IconWrapper, { IconComponent: GripVertical, size: 18, className: styles.dragHandle }), _jsx("span", { className: styles.title, children: "MIDI Clock" }), !isCollapsed && (_jsxs("span", { className: `${styles.syncStatus} ${isActuallySynced ? styles.synced : styles.notSynced}`, children: [isActuallySynced ?
                            _jsx(IconWrapper, { IconComponent: Zap, size: 12 }) :
                            _jsx(IconWrapper, { IconComponent: ZapOff, size: 12 }), syncStatusText] })), _jsx("div", { className: styles.controls, children: _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), children: isCollapsed ?
                            _jsx(IconWrapper, { IconComponent: Maximize2, size: 14 }) :
                            _jsx(IconWrapper, { IconComponent: Minimize2, size: 14 }) }) })] }));
    };
    const renderContent = () => {
        if (isCollapsed) {
            return null;
        }
        // const currentBeat = beat % 4; // Assuming 4/4 time
        // const currentBar = Math.floor(beat / 4) + bar;
        return (_jsxs("div", { className: styles.content, children: [_jsx("div", { className: styles.timeDisplay, children: currentTime.toLocaleTimeString() }), _jsxs("div", { className: styles.bpmDisplay, children: ["BPM: ", midiClockBpm.toFixed(2), " | Bar: ", midiClockCurrentBar, " | Beat: ", midiClockCurrentBeat] }), _jsxs("div", { className: styles.transportControls, children: [_jsx("button", { disabled: selectedMidiClockHostId !== 'none', onClick: () => {
                                if (selectedMidiClockHostId === 'none') {
                                    toggleInternalMidiClockPlayState();
                                }
                            }, children: midiClockIsPlaying ? '❚❚ Pause' : '▶️ Play' }), _jsx("button", { disabled: selectedMidiClockHostId !== 'none', children: "\u23F9\uFE0F Stop" })] }), selectedMidiClockHostId === 'ableton-link' && (_jsx("div", { className: styles.linkStatus, children: "Link Peers: 0" }))] }));
    };
    const clockClasses = [
        styles.midiClock,
        isCollapsed ? styles.collapsed : '',
        selectedMidiClockHostId !== 'none' ? styles.externalSync : '',
    ].join(' ');
    return (_jsx(Draggable, { nodeRef: nodeRef, handle: ".handle", onStart: handleDragStart, children: _jsxs("div", { ref: nodeRef, className: clockClasses, children: [renderHeader(), renderContent()] }) }));
};
export default MidiClock;
