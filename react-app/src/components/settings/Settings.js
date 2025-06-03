import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import useStoreUtils from '../../store/storeUtils';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import styles from './Settings.module.scss';
const EXAMPLE_SLIDER_MIDI_CHANNEL_INDEX = 999;
export const Settings = () => {
    const { theme, setTheme, darkMode, toggleDarkMode } = useTheme();
    const { socket, connected } = useSocket();
    const { artNetConfig, exampleSliderValue, setExampleSliderValue, midiMappings, fixtures, masterSliders, transitionDuration, // Fetch current duration
    setTransitionDuration, // Fetch action
    availableMidiClockHosts, selectedMidiClockHostId, setSelectedMidiClockHostId, setAvailableMidiClockHosts, } = useStore(state => ({
        artNetConfig: state.artNetConfig,
        exampleSliderValue: state.exampleSliderValue,
        setExampleSliderValue: state.setExampleSliderValue,
        midiMappings: state.midiMappings,
        fixtures: state.fixtures,
        masterSliders: state.masterSliders,
        transitionDuration: state.transitionDuration,
        setTransitionDuration: state.setTransitionDuration,
        availableMidiClockHosts: state.availableMidiClockHosts,
        selectedMidiClockHostId: state.selectedMidiClockHostId,
        setSelectedMidiClockHostId: state.setSelectedMidiClockHostId,
        setAvailableMidiClockHosts: state.setAvailableMidiClockHosts,
    }));
    const [artNetSettings, setArtNetSettings] = useState({ ...artNetConfig });
    const [exportInProgress, setExportInProgress] = useState(false);
    const [importInProgress, setImportInProgress] = useState(false);
    const [touchOscExportInProgress, setTouchOscExportInProgress] = useState(false);
    const [currentTransitionDurationMs, setCurrentTransitionDurationMs] = useState(transitionDuration);
    useEffect(() => {
        setCurrentTransitionDurationMs(transitionDuration); // Sync local state if store changes
    }, [transitionDuration]);
    const handleTransitionDurationChange = (e) => {
        const newDuration = parseInt(e.target.value, 10);
        if (!isNaN(newDuration) && newDuration >= 0) {
            setCurrentTransitionDurationMs(newDuration);
        }
    };
    const submitTransitionDuration = () => {
        setTransitionDuration(currentTransitionDurationMs);
        useStoreUtils.getState().addNotification({
            message: `Scene transition duration set to ${currentTransitionDurationMs}ms`,
            type: 'success',
            priority: 'normal'
        });
    };
    const [touchOscExportOptions, setTouchOscExportOptions] = useState({
        resolution: 'phone_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false,
    });
    const handleTouchOscOptionChange = (option, value) => { };
    const handleExportTouchOsc = async () => { };
    const updateArtNetConfig = () => { };
    const handleArtNetChange = (key, value) => { };
    const exportSettings = () => { };
    const importSettings = () => { };
    const testArtNetConnection = () => { };
    useEffect(() => { }, [socket]);
    useEffect(() => { }, [midiMappings, exampleSliderValue]);
    const handleExampleSliderChange = (event) => { };
    // Simulate fetching/setting available MIDI hosts
    useEffect(() => {
        // In a real app, this might involve navigator.requestMIDIAccess()
        // For now, using a placeholder list and ensuring 'Ableton Sync Link' is present.
        const hosts = [
            { id: 'none', name: 'None (Internal Clock)' },
            { id: 'ableton-link', name: 'Ableton Sync Link' },
            // Example of a dynamically found MIDI output:
            // { id: 'midi-output-123', name: 'My External Synth' }
        ];
        // This action is now in the store, but if we were to dynamically populate, we'd call it here.
        // setAvailableMidiClockHosts(hosts); // Example: if fetching dynamically
    }, []); // Removed setAvailableMidiClockHosts from deps
    return (_jsxs("div", { className: styles.settings, children: [_jsx("h2", { className: styles.sectionTitle }), _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Temporal Synchronization Nexus', theme === 'standard' && 'MIDI Clock Settings', theme === 'minimal' && 'Clock Sync'] }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "midiClockHostSelect", children: "MIDI Clock Sync Source:" }), _jsx("select", { id: "midiClockHostSelect", value: selectedMidiClockHostId || 'none', onChange: (e) => setSelectedMidiClockHostId(e.target.value), className: styles.selectInput, children: availableMidiClockHosts.map(host => (_jsx("option", { value: host.id, children: host.name }, host.id))) })] }), _jsxs("div", { className: styles.configNote, children: [_jsx("i", { className: "fas fa-info-circle" }), _jsx("p", { children: "Select the source for MIDI clock synchronization. 'Ableton Sync Link' requires compatible Link-enabled software on the network." })] })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Temporal Dynamics & Performance Calibration', theme === 'standard' && 'Performance & Transitions', theme === 'minimal' && 'Perf & FX'] }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Graphics Quality:" }), " "] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "enableWebGL", children: "WebGL Visualizations:" }), " "] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "enable3D", children: "3D Fixture Visualization:" }), " "] }), _jsxs("div", { className: styles.performanceNote, children: [" ", " "] }), _jsxs("div", { className: styles.formGroup, style: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color-soft)' }, children: [_jsx("label", { htmlFor: "sceneTransitionDuration", children: "Scene Transition Duration (ms):" }), _jsx("input", { type: "number", id: "sceneTransitionDuration", value: currentTransitionDurationMs, onChange: handleTransitionDurationChange, onBlur: submitTransitionDuration, onKeyPress: (e) => e.key === 'Enter' && submitTransitionDuration(), min: "0", step: "100", className: styles.numberInput })] }), _jsxs("div", { className: styles.configNote, children: [_jsx("i", { className: "fas fa-info-circle" }), _jsx("p", { children: "Set the default duration for smooth transitions between scenes (e.g., 0 for instant, 1000 for 1 second)." })] })] })] })] }), _jsx("div", { className: styles.aboutSection })] }));
};
