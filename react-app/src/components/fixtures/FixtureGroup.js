import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import styles from './FixtureGroup.module.scss';
export const FixtureGroup = ({ group, onEdit }) => {
    const [isFading, setIsFading] = useState(false);
    const fadeInterval = useRef(null);
    const { updateGroup, saveGroupLastStates, setGroupMasterValue, setGroupMute, setGroupSolo, startMidiLearn, cancelMidiLearn, midiLearnTarget, setGroupPanOffset, setGroupTiltOffset, setGroupZoomValue } = useStore(state => ({
        updateGroup: state.updateGroup,
        saveGroupLastStates: state.saveGroupLastStates,
        setGroupMasterValue: state.setGroupMasterValue,
        setGroupMute: state.setGroupMute,
        setGroupSolo: state.setGroupSolo,
        startMidiLearn: state.startMidiLearn,
        cancelMidiLearn: state.cancelMidiLearn,
        midiLearnTarget: state.midiLearnTarget,
        setGroupPanOffset: state.setGroupPanOffset,
        setGroupTiltOffset: state.setGroupTiltOffset,
        setGroupZoomValue: state.setGroupZoomValue,
    }));
    // Clean up any active fade on unmount
    useEffect(() => {
        return () => {
            if (fadeInterval.current) {
                clearInterval(fadeInterval.current);
            }
        };
    }, []);
    const handleMasterChange = (value) => {
        if (value === 0) {
            // Save the current state when fading to 0
            saveGroupLastStates(group.id);
        }
        setGroupMasterValue(group.id, value);
    };
    const handleFade = (targetValue, duration) => {
        if (fadeInterval.current) {
            clearInterval(fadeInterval.current);
        }
        const startValue = group.masterValue;
        const startTime = Date.now();
        const endTime = startTime + duration;
        setIsFading(true);
        if (startValue === targetValue) {
            setIsFading(false);
            return;
        }
        // Save states before starting fade
        if (targetValue === 0) {
            saveGroupLastStates(group.id);
        }
        fadeInterval.current = setInterval(() => {
            const now = Date.now();
            const progress = (now - startTime) / duration;
            if (progress >= 1) {
                setGroupMasterValue(group.id, targetValue);
                clearInterval(fadeInterval.current);
                setIsFading(false);
                return;
            }
            const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
            setGroupMasterValue(group.id, currentValue);
        }, 16); // ~60fps
    };
    const handleMuteToggle = () => {
        if (!group.isMuted) {
            // Save states before muting
            saveGroupLastStates(group.id);
            // Fade out when muting
            handleFade(0, 500);
        }
        else {
            // Fade back to previous value when unmuting
            handleFade(255, 500);
        }
        setGroupMute(group.id, !group.isMuted);
    };
    const handleSoloToggle = () => {
        // saveGroupLastStates(group.id) was removed as per plan.
        // Soloing is a filter, not a state to be saved/restored like mute.
        setGroupSolo(group.id, !group.isSolo);
    };
    const handleMidiLearnClick = () => {
        const isCurrentlyLearning = midiLearnTarget?.type === 'group' && midiLearnTarget.groupId === group.id;
        if (isCurrentlyLearning) {
            cancelMidiLearn();
        }
        else {
            startMidiLearn({ type: 'group', id: group.id });
        }
    };
    const handleIgnoreToggle = () => {
        updateGroup(group.id, { ignoreSceneChanges: !group.ignoreSceneChanges });
    };
    const handleIgnoreMasterFaderToggle = () => {
        updateGroup(group.id, { ignoreMasterFader: !group.ignoreMasterFader });
    };
    const getMidiStatusText = () => {
        const mapping = group.midiMapping;
        if (!mapping)
            return 'MIDI Learn';
        return mapping.controller !== undefined
            ? `CC ${mapping.channel}:${mapping.controller}`
            : `Note ${mapping.channel}:${mapping.note}`;
    };
    return (_jsxs("div", { className: styles.fixtureGroup, children: [_jsxs("div", { className: styles.header, children: [_jsx("h3", { children: group.name }), onEdit && (_jsx("button", { onClick: onEdit, className: styles.editButton, children: _jsx("i", { className: "fas fa-edit" }) }))] }), _jsxs("div", { className: styles.controls, children: [_jsxs("div", { className: styles.masterSlider, children: [_jsxs("div", { className: styles.sliderHeader, children: [_jsxs("span", { children: ["Master ", Math.round((group.masterValue / 255) * 100), "%"] }), _jsxs("div", { className: styles.fadeButtons, children: [_jsx("button", { onClick: () => handleFade(0, 3000), disabled: isFading, className: styles.fadeButton, title: "Fade Out (3s)", children: _jsx("i", { className: "fas fa-arrow-down" }) }), _jsx("button", { onClick: () => handleFade(255, 3000), disabled: isFading, className: styles.fadeButton, title: "Fade In (3s)", children: _jsx("i", { className: "fas fa-arrow-up" }) })] })] }), _jsx("input", { type: "range", min: "0", max: "255", value: group.masterValue, onChange: (e) => handleMasterChange(parseInt(e.target.value)), className: `${styles.slider} ${isFading ? styles.fading : ''}` }), _jsxs("div", { className: styles.midiOscControls, children: [_jsxs("button", { className: `${styles.midiLearn} ${midiLearnTarget?.type === 'group' && midiLearnTarget.groupId === group.id
                                            ? styles.learning
                                            : ''}`, onClick: handleMidiLearnClick, title: "MIDI Learn", children: [_jsx("i", { className: "fas fa-music" }), _jsx("span", { children: getMidiStatusText() })] }), _jsx("input", { type: "text", value: group.oscAddress || '', onChange: (e) => updateGroup(group.id, { oscAddress: e.target.value }), placeholder: "OSC Address", className: styles.oscInput })] })] }), _jsxs("div", { className: styles.buttons, children: [_jsxs("button", { className: `${styles.muteButton} ${group.isMuted ? styles.active : ''}`, onClick: handleMuteToggle, title: group.isMuted ? "Unmute" : "Mute", children: [_jsx("i", { className: `fas ${group.isMuted ? 'fa-volume-mute' : 'fa-volume-up'}` }), "Mute"] }), _jsxs("button", { className: `${styles.soloButton} ${group.isSolo && !group.isMuted ? styles.active : ''}`, onClick: handleSoloToggle, title: group.isSolo ? "Un-solo" : "Solo", children: [_jsx("i", { className: "fas fa-spotlight" }), "Solo"] }), _jsxs("button", { className: `${styles.ignoreButton} ${group.ignoreSceneChanges ? styles.active : ''}`, onClick: handleIgnoreToggle, title: group.ignoreSceneChanges ? "Allow Scene Changes" : "Ignore Scene Changes", children: [_jsx("i", { className: "fas fa-shield-alt" }), "Ignore Scenes"] }), _jsxs("button", { className: `${styles.ignoreButton} ${group.ignoreMasterFader ? styles.active : ''}`, onClick: handleIgnoreMasterFaderToggle, title: group.ignoreMasterFader ? "Respect Master Fader" : "Ignore Master Fader", children: [_jsx("i", { className: "fas fa-sliders-h" }), "Ignore Master"] })] }), _jsxs("div", { className: styles.ptzControls, children: [_jsxs("div", { className: styles.ptzSliderControl, children: [_jsxs("label", { htmlFor: `panOffset-${group.id}`, children: ["Pan Offset: ", group.panOffset || 0] }), _jsx("input", { type: "range", id: `panOffset-${group.id}`, min: "-127", max: "127", value: group.panOffset || 0, onChange: (e) => setGroupPanOffset(group.id, parseInt(e.target.value)), className: styles.slider })] }), _jsxs("div", { className: styles.ptzSliderControl, children: [_jsxs("label", { htmlFor: `tiltOffset-${group.id}`, children: ["Tilt Offset: ", group.tiltOffset || 0] }), _jsx("input", { type: "range", id: `tiltOffset-${group.id}`, min: "-127", max: "127", value: group.tiltOffset || 0, onChange: (e) => setGroupTiltOffset(group.id, parseInt(e.target.value)), className: styles.slider })] }), _jsxs("div", { className: styles.ptzSliderControl, children: [_jsxs("label", { htmlFor: `zoom-${group.id}`, children: ["Zoom: ", group.zoomValue || 0] }), _jsx("input", { type: "range", id: `zoom-${group.id}`, min: "0", max: "255", value: group.zoomValue || 0, onChange: (e) => setGroupZoomValue(group.id, parseInt(e.target.value)), className: styles.slider })] })] })] })] }));
};
