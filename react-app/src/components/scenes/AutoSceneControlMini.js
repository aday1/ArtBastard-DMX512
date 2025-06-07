import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './AutoSceneControlMini.module.scss';
export const AutoSceneControlMini = ({ isCollapsed = false, onCollapsedChange, }) => {
    const [showSceneManagement, setShowSceneManagement] = useState(false);
    const [newSceneName, setNewSceneName] = useState('');
    const [showDirectionControls, setShowDirectionControls] = useState(false);
    // Local state for manual/tap tempo clock management
    const [localBeatCounter, setLocalBeatCounter] = useState(0);
    const [isLocalClockPlaying, setIsLocalClockPlaying] = useState(false);
    const prevBeatRef = useRef(null);
    const intervalRef = useRef(null);
    const { autoSceneEnabled, autoSceneList, autoSceneCurrentIndex, autoSceneTempoSource, autoSceneManualBpm, autoSceneTapTempoBpm, autoSceneBeatDivision, autoSceneIsFlashing, autoSceneMode, midiClockIsPlaying, midiClockCurrentBeat, scenes, } = useStore(state => ({
        autoSceneEnabled: state.autoSceneEnabled,
        autoSceneList: state.autoSceneList,
        autoSceneCurrentIndex: state.autoSceneCurrentIndex,
        autoSceneTempoSource: state.autoSceneTempoSource,
        autoSceneManualBpm: state.autoSceneManualBpm,
        autoSceneTapTempoBpm: state.autoSceneTapTempoBpm,
        autoSceneBeatDivision: state.autoSceneBeatDivision,
        autoSceneIsFlashing: state.autoSceneIsFlashing,
        autoSceneMode: state.autoSceneMode || 'forward',
        midiClockIsPlaying: state.midiClockIsPlaying,
        midiClockCurrentBeat: state.midiClockCurrentBeat,
        scenes: state.scenes,
    }));
    const { setAutoSceneEnabled, setAutoSceneTempoSource, setAutoSceneMode, setAutoSceneList, recordTapTempo, requestToggleMasterClockPlayPause, setManualBpm, setNextAutoSceneIndex, loadScene, triggerAutoSceneFlash, } = useStore(state => ({
        setAutoSceneEnabled: state.setAutoSceneEnabled,
        setAutoSceneTempoSource: state.setAutoSceneTempoSource,
        setAutoSceneMode: state.setAutoSceneMode,
        setAutoSceneList: state.setAutoSceneList,
        recordTapTempo: state.recordTapTempo,
        requestToggleMasterClockPlayPause: state.requestToggleMasterClockPlayPause,
        setManualBpm: state.setManualBpm,
        setNextAutoSceneIndex: state.setNextAutoSceneIndex,
        loadScene: state.loadScene,
        triggerAutoSceneFlash: state.triggerAutoSceneFlash,
    }));
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
            if (prevBeatRef.current !== null) {
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
            triggerAutoSceneFlash();
            setNextAutoSceneIndex();
            setLocalBeatCounter(0);
        }
    }, [localBeatCounter, autoSceneBeatDivision, autoSceneEnabled, autoSceneList, setNextAutoSceneIndex, autoSceneTempoSource, midiClockIsPlaying, isLocalClockPlaying, triggerAutoSceneFlash]);
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
                console.log(`Auto-Scene Mini: Loading scene "${sceneToLoad}" (Index: ${autoSceneCurrentIndex})`);
            }
        }
    }, [autoSceneEnabled, autoSceneCurrentIndex, autoSceneList, loadScene, autoSceneTempoSource, midiClockIsPlaying, isLocalClockPlaying]);
    // Handle play/pause for different tempo sources
    const handlePlayPauseToggle = () => {
        if (autoSceneTempoSource === 'internal_clock') {
            requestToggleMasterClockPlayPause();
        }
        else {
            setIsLocalClockPlaying(!isLocalClockPlaying);
            if (!isLocalClockPlaying) {
                setLocalBeatCounter(0);
            }
        }
    };
    const getCurrentBpm = () => {
        switch (autoSceneTempoSource) {
            case 'manual_bpm':
                return autoSceneManualBpm;
            case 'tap_tempo':
                return autoSceneTapTempoBpm;
            default:
                return 120;
        }
    };
    // Helper functions for scene management
    const isSceneInAutoList = (sceneName) => {
        return autoSceneList.includes(sceneName);
    };
    const toggleSceneInAutoList = (sceneName) => {
        const newAutoSceneList = isSceneInAutoList(sceneName)
            ? autoSceneList.filter(name => name !== sceneName)
            : [...autoSceneList, sceneName];
        setAutoSceneList(newAutoSceneList);
    };
    const addAllScenesToAutoList = () => {
        const allSceneNames = scenes.map(scene => scene.name);
        setAutoSceneList(allSceneNames);
    };
    const clearAutoSceneList = () => {
        setAutoSceneList([]);
    };
    const renderContent = () => {
        if (isCollapsed)
            return null;
        return (_jsxs("div", { className: styles.content, children: ["        ", _jsxs("div", { className: styles.controls, children: [_jsxs("button", { className: `${styles.toggleButton} ${autoSceneEnabled ? styles.active : ''}`, onClick: () => {
                                if (!autoSceneEnabled) {
                                    setAutoSceneEnabled(true);
                                    // Start playing automatically when enabling AutoScene
                                    if (autoSceneTempoSource === 'internal_clock') {
                                        requestToggleMasterClockPlayPause();
                                    }
                                    else {
                                        setIsLocalClockPlaying(true);
                                        setLocalBeatCounter(0);
                                    }
                                }
                                else {
                                    // Stop when disabling
                                    setAutoSceneEnabled(false);
                                    if (autoSceneTempoSource !== 'internal_clock') {
                                        setIsLocalClockPlaying(false);
                                    }
                                }
                            }, title: autoSceneEnabled ? 'Stop Auto Scene' : 'Start Auto Scene', children: [autoSceneEnabled ? (_jsx(LucideIcon, { name: "Pause", size: 14 })) : (_jsx(LucideIcon, { name: "Play", size: 14 })), autoSceneEnabled ? 'STOP' : 'START'] }), _jsxs("div", { className: styles.info, children: [_jsxs("div", { className: styles.bpmDisplay, children: [getCurrentBpm().toFixed(1), " BPM"] }), _jsxs("div", { className: styles.sceneCount, children: [autoSceneList.length, " scenes"] })] })] }), "        ", _jsxs("div", { className: styles.tempoControls, children: [_jsxs("select", { value: autoSceneTempoSource, onChange: (e) => setAutoSceneTempoSource(e.target.value), className: styles.tempoSelect, children: [_jsx("option", { value: "internal_clock", children: "Internal Clock" }), _jsx("option", { value: "manual_bpm", children: "Manual BPM" }), _jsx("option", { value: "tap_tempo", children: "Tap Tempo" })] }), autoSceneTempoSource === 'manual_bpm' && (_jsx("input", { type: "number", value: autoSceneManualBpm, onChange: (e) => setManualBpm(parseInt(e.target.value, 10)), min: "20", max: "300", className: styles.bpmInput, title: "Manual BPM" })), autoSceneTempoSource === 'tap_tempo' && (_jsxs("button", { className: styles.tapButton, onClick: () => recordTapTempo(), title: "Tap Tempo", children: [_jsx(LucideIcon, { name: "Zap", size: 12 }), "TAP"] }))] }), "        ", autoSceneList.length > 0 && (_jsxs("div", { className: styles.currentScene, children: ["Scene: ", autoSceneCurrentIndex + 1, "/", autoSceneList.length] })), _jsxs("div", { className: styles.directionSection, children: [_jsxs("button", { className: styles.toggleSection, onClick: () => setShowDirectionControls(!showDirectionControls), title: "Direction Controls", children: [_jsx(LucideIcon, { name: "ArrowLeftRight", size: 12 }), autoSceneMode] }), showDirectionControls && (_jsx("div", { className: styles.directionControls, children: _jsxs("select", { value: autoSceneMode, onChange: (e) => setAutoSceneMode(e.target.value), className: styles.directionSelect, children: [_jsx("option", { value: "forward", children: "Forward" }), _jsx("option", { value: "ping-pong", children: "Ping-Pong" }), _jsx("option", { value: "random", children: "Random" })] }) }))] }), _jsxs("div", { className: styles.sceneManagementSection, children: [_jsxs("button", { className: styles.toggleSection, onClick: () => setShowSceneManagement(!showSceneManagement), title: "Scene Management", children: [_jsx(LucideIcon, { name: "List", size: 12 }), "Scenes (", autoSceneList.length, ")"] }), showSceneManagement && (_jsxs("div", { className: styles.sceneManagement, children: [_jsxs("div", { className: styles.sceneActions, children: [_jsxs("button", { className: styles.actionButton, onClick: addAllScenesToAutoList, disabled: scenes.length === 0, title: "Add all scenes", children: [_jsx(LucideIcon, { name: "Plus", size: 10 }), "All"] }), _jsxs("button", { className: styles.actionButton, onClick: clearAutoSceneList, disabled: autoSceneList.length === 0, title: "Clear all scenes", children: [_jsx(LucideIcon, { name: "X", size: 10 }), "Clear"] })] }), scenes.length > 0 && (_jsx("div", { className: styles.sceneList, children: scenes.map((scene) => (_jsx("div", { className: styles.sceneItem, children: _jsxs("button", { className: `${styles.sceneToggle} ${isSceneInAutoList(scene.name) ? styles.active : ''}`, onClick: () => toggleSceneInAutoList(scene.name), title: isSceneInAutoList(scene.name) ? 'Remove from auto-play' : 'Add to auto-play', children: [_jsx(LucideIcon, { name: isSceneInAutoList(scene.name) ? "Check" : "Plus", size: 10 }), _jsx("span", { className: styles.sceneName, children: scene.name })] }) }, scene.name))) }))] }))] })] }));
    };
    return (_jsxs(DockableComponent, { id: "auto-scene-control-mini", title: "Scene Auto", component: "midi-clock" // Reusing existing component type
        , defaultPosition: { zone: 'top-left' }, defaultZIndex: 1025, isCollapsed: isCollapsed, onCollapsedChange: onCollapsedChange, className: `${styles.container} ${autoSceneIsFlashing ? styles.flashing : ''}`, isDraggable: true, children: ["      ", _jsxs("div", { className: styles.header, children: [_jsx("span", { className: styles.title, children: "Scene Auto" }), _jsx("div", { className: styles.status, children: autoSceneEnabled && (_jsx(LucideIcon, { name: "Play", size: 12, className: `${styles.playingIcon} ${(autoSceneTempoSource === 'internal_clock' ? midiClockIsPlaying : isLocalClockPlaying) ? styles.active : ''}` })) })] }), renderContent()] }));
};
