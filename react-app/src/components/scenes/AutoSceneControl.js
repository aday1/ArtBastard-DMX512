import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store'; // Assuming Scene type might be needed for selection
import styles from './AutoSceneControl.module.scss';
export const AutoSceneControl = ({ isMinimized = false, onMinimizedChange, }) => {
    // Retrieve all scenes for selection purposes
    const allScenes = useStore(state => state.scenes); // Auto-Scene state from the store
    const { autoSceneEnabled, autoSceneList, autoSceneMode, autoSceneBeatDivision, autoSceneManualBpm, autoSceneTapTempoBpm, autoSceneTempoSource, autoSceneCurrentIndex, // For display
    selectedMidiClockHostId, // To know if main clock is internal
    midiClockBpm, // To display main clock BPM
    midiClockIsPlaying, // Needed for effects
    midiClockCurrentBeat, // Needed for effects
    autoSceneIsFlashing, // Shared flashing state
     } = useStore(state => ({
        autoSceneEnabled: state.autoSceneEnabled,
        autoSceneList: state.autoSceneList,
        autoSceneMode: state.autoSceneMode,
        autoSceneBeatDivision: state.autoSceneBeatDivision,
        autoSceneManualBpm: state.autoSceneManualBpm,
        autoSceneTapTempoBpm: state.autoSceneTapTempoBpm,
        autoSceneTempoSource: state.autoSceneTempoSource,
        autoSceneCurrentIndex: state.autoSceneCurrentIndex,
        selectedMidiClockHostId: state.selectedMidiClockHostId,
        midiClockBpm: state.midiClockBpm,
        midiClockIsPlaying: state.midiClockIsPlaying,
        midiClockCurrentBeat: state.midiClockCurrentBeat,
        autoSceneIsFlashing: state.autoSceneIsFlashing, // Shared flashing state
    }));
    // Auto-Scene actions from the store
    const { setAutoSceneEnabled, setAutoSceneList, setAutoSceneMode, setAutoSceneBeatDivision, setAutoSceneTempoSource, setManualBpm, recordTapTempo, loadScene, // Needed for effects
    setNextAutoSceneIndex, // Needed for effects
    requestToggleMasterClockPlayPause, // Added for PLAY button
    triggerAutoSceneFlash, // Shared flashing trigger
     } = useStore(state => ({
        setAutoSceneEnabled: state.setAutoSceneEnabled,
        setAutoSceneList: state.setAutoSceneList,
        setAutoSceneMode: state.setAutoSceneMode,
        setAutoSceneBeatDivision: state.setAutoSceneBeatDivision,
        setAutoSceneTempoSource: state.setAutoSceneTempoSource,
        setManualBpm: state.setManualBpm,
        recordTapTempo: state.recordTapTempo,
        loadScene: state.loadScene,
        setNextAutoSceneIndex: state.setNextAutoSceneIndex,
        requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause,
        triggerAutoSceneFlash: state.triggerAutoSceneFlash, // Shared flashing trigger
    })); // Local state for UI, e.g., for multi-select interaction if needed
    const [selectedScenesForList, setSelectedScenesForList] = useState(autoSceneList);
    // Local state for beat tracking and refs
    const [localBeatCounter, setLocalBeatCounter] = useState(0);
    const [isLocalClockPlaying, setIsLocalClockPlaying] = useState(false);
    const prevBeatRef = useRef(null);
    const intervalRef = useRef(null);
    // Effect to update local selectedScenesForList when autoSceneList changes from store (e.g. loaded state)
    useEffect(() => {
        setSelectedScenesForList(autoSceneList);
    }, [autoSceneList]);
    // Independent clock management for manual_bpm and tap_tempo modes
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (!autoSceneEnabled || autoSceneList.length === 0 || autoSceneBeatDivision <= 0) {
            setLocalBeatCounter(0);
            setIsLocalClockPlaying(false);
            return;
        }
        // Reset local clock playing state when tempo source changes
        if (autoSceneTempoSource === 'internal_clock') {
            setIsLocalClockPlaying(false);
            setLocalBeatCounter(0);
            return;
        }
        if (autoSceneTempoSource === 'manual_bpm' || autoSceneTempoSource === 'tap_tempo') {
            // Use independent clock for manual BPM and tap tempo
            if (isLocalClockPlaying) {
                const bpm = autoSceneTempoSource === 'manual_bpm' ? autoSceneManualBpm : autoSceneTapTempoBpm;
                const intervalMs = (60000 / bpm); // Milliseconds per beat
                intervalRef.current = setInterval(() => {
                    setLocalBeatCounter(current => current + 1);
                }, intervalMs);
            }
        }
        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [autoSceneEnabled, autoSceneList.length, autoSceneBeatDivision, autoSceneTempoSource, autoSceneManualBpm, autoSceneTapTempoBpm, isLocalClockPlaying]);
    // Reset local clock when tempo source changes
    useEffect(() => {
        if (autoSceneTempoSource === 'internal_clock') {
            setIsLocalClockPlaying(false);
            setLocalBeatCounter(0);
        }
    }, [autoSceneTempoSource]);
    // Beat tracking for internal_clock mode (syncs with master clock)
    useEffect(() => {
        if (autoSceneTempoSource !== 'internal_clock') {
            // Reset master clock tracking when not using internal clock
            prevBeatRef.current = null;
            return;
        }
        if (!autoSceneEnabled || !midiClockIsPlaying || autoSceneList.length === 0 || autoSceneBeatDivision <= 0) {
            setLocalBeatCounter(0);
            prevBeatRef.current = null;
            return;
        }
        if (midiClockCurrentBeat !== prevBeatRef.current) {
            if (prevBeatRef.current !== null) { // Only increment if it's not the very first beat detection cycle
                setLocalBeatCounter(current => current + 1);
            }
            prevBeatRef.current = midiClockCurrentBeat;
        }
    }, [autoSceneEnabled, midiClockIsPlaying, midiClockCurrentBeat, autoSceneList, autoSceneBeatDivision, autoSceneTempoSource]);
    // Scene change triggering logic
    useEffect(() => {
        const shouldTriggerChange = localBeatCounter >= autoSceneBeatDivision &&
            autoSceneEnabled &&
            autoSceneList.length > 0 &&
            ((autoSceneTempoSource === 'internal_clock' && midiClockIsPlaying) ||
                (autoSceneTempoSource !== 'internal_clock' && isLocalClockPlaying));
        if (shouldTriggerChange) {
            // Flash the border on downbeat using shared state
            triggerAutoSceneFlash();
            setNextAutoSceneIndex();
            setLocalBeatCounter(0); // Reset counter for the next cycle
        }
    }, [localBeatCounter, autoSceneBeatDivision, autoSceneEnabled, autoSceneList, setNextAutoSceneIndex, autoSceneTempoSource, midiClockIsPlaying, isLocalClockPlaying]);
    // Scene loading logic
    useEffect(() => {
        const shouldLoadScene = autoSceneEnabled &&
            autoSceneCurrentIndex !== -1 &&
            autoSceneList.length > 0 &&
            ((autoSceneTempoSource === 'internal_clock' && midiClockIsPlaying) ||
                (autoSceneTempoSource !== 'internal_clock' && isLocalClockPlaying));
        if (shouldLoadScene) {
            const sceneToLoad = autoSceneList[autoSceneCurrentIndex];
            if (sceneToLoad) {
                loadScene(sceneToLoad);
                console.log(`Auto-Scene: Loading scene "${sceneToLoad}" (Index: ${autoSceneCurrentIndex})`);
            }
        }
    }, [autoSceneEnabled, autoSceneCurrentIndex, autoSceneList, loadScene, autoSceneTempoSource, midiClockIsPlaying, isLocalClockPlaying]);
    const handleToggleSceneInList = (sceneName) => {
        const newSelectedScenes = selectedScenesForList.includes(sceneName)
            ? selectedScenesForList.filter(name => name !== sceneName)
            : [...selectedScenesForList, sceneName];
        setSelectedScenesForList(newSelectedScenes);
        setAutoSceneList(newSelectedScenes); // Update store
    };
    const handlePlayPauseToggle = () => {
        if (autoSceneTempoSource === 'internal_clock') {
            // Use master clock for internal clock mode
            requestToggleMasterClockPlayPause();
        }
        else {
            // Use local clock for manual_bpm and tap_tempo modes
            setIsLocalClockPlaying(!isLocalClockPlaying);
            if (!isLocalClockPlaying) {
                // Starting: reset beat counter
                setLocalBeatCounter(0);
            }
        }
    };
    const handleResetDownbeat = () => {
        setLocalBeatCounter(0);
        // Flash briefly to indicate reset using shared state
        triggerAutoSceneFlash();
    };
    const isPlaying = autoSceneTempoSource === 'internal_clock' ? midiClockIsPlaying : isLocalClockPlaying;
    return (_jsxs("div", { className: `${styles.autoSceneControl} ${autoSceneIsFlashing ? styles.flashing : ''}`, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { children: "Auto-Scene Control" }), _jsxs("div", { className: styles.headerControls, children: [_jsxs("div", { className: styles.statusIndicator, children: [_jsx("span", { className: `${styles.statusDot} ${autoSceneEnabled && isPlaying ? styles.active : ''}` }), _jsx("span", { className: styles.statusText, children: !autoSceneEnabled ? 'DISABLED' :
                                            !isPlaying ? 'STOPPED' :
                                                'RUNNING' })] }), _jsx("button", { className: styles.minimizeButton, onClick: () => onMinimizedChange?.(!isMinimized), title: isMinimized ? 'Expand Auto-Scene Control' : 'Minimize Auto-Scene Control', children: _jsx("i", { className: isMinimized ? 'fas fa-expand' : 'fas fa-compress' }) })] })] }), !isMinimized && (_jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Enable" }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { htmlFor: "autoSceneEnableCheckbox", children: "Enable Auto-Scene:" }), _jsx("input", { type: "checkbox", id: "autoSceneEnableCheckbox", checked: autoSceneEnabled, onChange: (e) => setAutoSceneEnabled(e.target.checked) })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Transport Controls" }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("button", { className: `${styles.playButton} ${isPlaying ? styles.playing : ''}`, onClick: handlePlayPauseToggle, disabled: !autoSceneEnabled || autoSceneList.length === 0, title: isPlaying ? 'Pause Auto-Scene Control' : 'Start Auto-Scene Control', children: isPlaying ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-pause" }), "Pause"] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-play" }), "Play"] })) }), _jsxs("button", { className: styles.resetButton, onClick: handleResetDownbeat, disabled: !autoSceneEnabled, title: "Reset downbeat synchronization", children: [_jsx("i", { className: "fas fa-redo" }), "RESET"] }), _jsx("span", { className: styles.playStatus, children: !autoSceneEnabled ? 'Auto-Scene Disabled' :
                                            autoSceneList.length === 0 ? 'No Scenes Selected' :
                                                isPlaying ? 'Running' : 'Stopped' })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Scene Sequence" }), _jsx("p", { children: "Select scenes to include in the sequence (order matters for 'Forward' and 'Ping-Pong' modes):" }), _jsx("div", { className: styles.sceneListContainer, children: allScenes.length > 0 ? allScenes.map(scene => (_jsx("div", { className: `${styles.sceneSelectItem} ${selectedScenesForList.includes(scene.name) ? styles.selected : ''}`, onClick: () => handleToggleSceneInList(scene.name), children: scene.name }, scene.name))) : _jsx("p", { children: "No scenes available. Create some scenes first!" }) }), _jsxs("small", { children: ["Selected: ", selectedScenesForList.join(', ') || 'None'] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Mode" }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { htmlFor: "autoSceneModeSelect", children: "Mode:" }), _jsxs("select", { id: "autoSceneModeSelect", value: autoSceneMode, onChange: (e) => setAutoSceneMode(e.target.value), disabled: !autoSceneEnabled, children: [_jsx("option", { value: "forward", children: "Forward" }), _jsx("option", { value: "ping-pong", children: "Ping-Pong" }), _jsx("option", { value: "random", children: "Random" })] })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Timing" }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { htmlFor: "autoSceneBeatDivisionInput", children: "Change Scene Every (beats):" }), _jsx("input", { type: "number", id: "autoSceneBeatDivisionInput", value: autoSceneBeatDivision, onChange: (e) => setAutoSceneBeatDivision(parseInt(e.target.value, 10)), min: "1", disabled: !autoSceneEnabled })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Tempo Source" }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { htmlFor: "autoSceneTempoSourceSelect", children: "Source:" }), _jsxs("select", { id: "autoSceneTempoSourceSelect", value: autoSceneTempoSource, onChange: (e) => setAutoSceneTempoSource(e.target.value), disabled: !autoSceneEnabled, children: [_jsx("option", { value: "internal_clock", children: "Internal Clock (from Master)" }), _jsx("option", { value: "manual_bpm", children: "Manual BPM" }), _jsx("option", { value: "tap_tempo", children: "Tap Tempo" })] })] }), autoSceneTempoSource === 'manual_bpm' && (_jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { htmlFor: "autoSceneManualBpmInput", children: "Manual BPM:" }), _jsx("input", { type: "number", id: "autoSceneManualBpmInput", value: autoSceneManualBpm, onChange: (e) => setManualBpm(parseInt(e.target.value, 10)), min: "20", max: "300", disabled: !autoSceneEnabled })] })), autoSceneTempoSource === 'tap_tempo' && (_jsxs("div", { className: styles.controlGroup, children: [_jsx("button", { onClick: () => recordTapTempo(), disabled: !autoSceneEnabled, children: "Tap" }), _jsxs("span", { children: ["Detected BPM: ", autoSceneTapTempoBpm.toFixed(2)] })] }))] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Status" }), _jsxs("div", { className: styles.statusDisplay, children: [_jsxs("div", { className: styles.statusItem, children: ["Enabled: ", autoSceneEnabled ? 'Yes' : 'No'] }), _jsxs("div", { className: styles.statusItem, children: ["Mode: ", autoSceneMode] }), _jsxs("div", { className: styles.statusItem, children: ["Current Scene Index: ", autoSceneCurrentIndex === -1 ? "N/A" : autoSceneCurrentIndex, " (", autoSceneList[autoSceneCurrentIndex] || 'None', ")"] }), _jsxs("div", { className: styles.statusItem, children: ["Beat Division: ", autoSceneBeatDivision] }), _jsxs("div", { className: styles.statusItem, children: ["Tempo Source: ", autoSceneTempoSource.replace('_', ' ')] }), _jsxs("div", { className: styles.statusItem, children: ["Effective BPM:", autoSceneTempoSource === 'internal_clock' ? ` ${midiClockBpm.toFixed(2)} (Master Clock)` :
                                                autoSceneTempoSource === 'manual_bpm' ? ` ${autoSceneManualBpm.toFixed(2)} (Manual)` :
                                                    ` ${autoSceneTapTempoBpm.toFixed(2)} (Tap)`] }), _jsxs("div", { className: styles.statusItem, children: ["Master Clock Source: ", selectedMidiClockHostId] }), _jsxs("div", { className: styles.statusItem, children: ["Auto-Scene Playing: ", isPlaying ? 'Yes' : 'No', autoSceneTempoSource === 'internal_clock' && ` (Master Clock: ${midiClockIsPlaying ? 'Playing' : 'Stopped'})`] }), _jsxs("div", { className: styles.statusItem, children: ["Local Beat Counter: ", localBeatCounter] }), _jsxs("div", { className: styles.statusItem, children: ["Next Scene Change: ", autoSceneEnabled && isPlaying && autoSceneList.length > 0 ?
                                                `${autoSceneBeatDivision - localBeatCounter} beats` : 'Waiting...'] })] })] })] }))] }));
};
export default AutoSceneControl;
