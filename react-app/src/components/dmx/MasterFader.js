import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import { DockableComponent } from '../ui/DockableComponent';
import styles from './MasterFader.module.scss';
import { Sparkles } from '../layout/Sparkles'; // Import Sparkles
export const MasterFader = ({ onValueChange, isMinimized: externalIsMinimized = false, onMinimizedChange, isDockable = true }) => {
    const [value, setValue] = useState(0);
    const [oscAddress, setOscAddress] = useState('/master');
    const [midiCC, setMidiCC] = useState(null);
    const [midiChannel, setMidiChannel] = useState(1);
    const [isLearning, setIsLearning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(externalIsMinimized); // State for minimized
    const [isFullOn, setIsFullOn] = useState(false); // State for FULL ON mode
    const [previousChannelValues, setPreviousChannelValues] = useState({});
    const [fullOnSavedValues, setFullOnSavedValues] = useState({});
    const [fadeIntervalId, setFadeIntervalId] = useState(null);
    const [valueBeforeFadeout, setValueBeforeFadeout] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const { dmxChannels, setMultipleDmxChannels, groups, fixtures } = useStore(state => ({
        dmxChannels: state.dmxChannels,
        setMultipleDmxChannels: state.setMultipleDmxChannels,
        groups: state.groups,
        fixtures: state.fixtures,
    }));
    const { socket } = useSocket();
    const { startLearn, cancelLearn } = useMidiLearn();
    const isChannelIgnored = useCallback((channelIndex) => {
        if (!fixtures || !groups)
            return false;
        for (const fixture of fixtures) {
            const startAddress = fixture.startAddress - 1; // 0-indexed
            const endAddress = startAddress + fixture.channels.length - 1;
            if (channelIndex >= startAddress && channelIndex <= endAddress) {
                // Channel is part of this fixture
                for (const group of groups) {
                    if (group.fixtureIndices.some(fi => fixtures[fi]?.id === fixture.id)) {
                        // This fixture is in this group
                        if (group.ignoreMasterFader === true) {
                            return true; // Ignored by this group
                        }
                    }
                }
            }
        }
        return false; // Not found in any group that ignores master fader
    }, [fixtures, groups]);
    const handleValueChange = useCallback((newValue) => {
        const previousValue = value;
        setValue(newValue);
        onValueChange?.(newValue);
        const dmxUpdates = {};
        if (newValue === 0 && previousValue > 0) { // Fading to black
            const currentValuesToSaveNormalized = {};
            Object.keys(dmxChannels).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                if (isChannelIgnored(channelNum)) {
                    // If ignored, keep its current value, don't save for restore, don't add to dmxUpdates to set to 0
                    dmxUpdates[channelNum] = dmxChannels[channelNum]; // Ensure it retains current value if it was part of previous calculations
                    return;
                }
                const currentDmxValue = dmxChannels[channelNum];
                if (currentDmxValue > 0) {
                    let normalizedValue = currentDmxValue;
                    // Normalize based on previous master fader value to correctly restore proportions later
                    if (previousValue > 0 && previousValue < 255) { // Avoid division by zero or no change
                        normalizedValue = (currentDmxValue / previousValue) * 255;
                    }
                    currentValuesToSaveNormalized[channelNum] = Math.min(255, Math.max(0, Math.round(normalizedValue)));
                    dmxUpdates[channelNum] = 0;
                }
                else { // if currentDmxValue is already 0
                    dmxUpdates[channelNum] = 0;
                }
            });
            setPreviousChannelValues(currentValuesToSaveNormalized);
        }
        else if (newValue > 0 && previousValue === 0) { // Fading up from black
            Object.keys(previousChannelValues).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                if (isChannelIgnored(channelNum)) {
                    // If channel was ignored when fading to black, it should not be part of previousChannelValues for restoration.
                    // However, if it is for some reason, or if we want to be safe:
                    dmxUpdates[channelNum] = dmxChannels[channelNum]; // Keep its current value
                    return;
                }
                const normalizedOriginalValue = previousChannelValues[channelNum];
                const proportionalValue = Math.round((normalizedOriginalValue * newValue) / 255);
                dmxUpdates[channelNum] = proportionalValue;
            });
            // For channels that were not in previousChannelValues (e.g. they were already 0 or ignored)
            // ensure they are not accidentally turned on if they were ignored.
            // This block might be redundant if isChannelIgnored correctly populates dmxUpdates above.
            for (let i = 0; i < 512; i++) {
                if (isChannelIgnored(i) && dmxUpdates[i] === undefined) {
                    dmxUpdates[i] = dmxChannels[i];
                }
                else if (dmxUpdates[i] === undefined && dmxChannels[i] === 0) {
                    // If a channel wasn't in previousChannelValues (was 0) and not ignored, it should remain 0
                    // unless explicitly handled by other logic (which is not the case here for master fader up from black).
                    dmxUpdates[i] = 0;
                }
            }
        }
        else if (newValue > 0 && previousValue > 0) { // Adjusting level (not from/to black)
            if (previousValue !== 0) { // Should always be true here, but good check
                const adjustmentFactor = newValue / previousValue;
                Object.keys(dmxChannels).forEach(key => {
                    const num = parseInt(key);
                    if (isChannelIgnored(num)) {
                        dmxUpdates[num] = dmxChannels[num]; // Keep current value
                        return;
                    }
                    // For non-ignored channels, if it was 0, it stays 0 unless master was also 0 and now it's > 0 (handled by fade up from black)
                    // If it was >0, scale it.
                    const currentVal = dmxChannels[num];
                    if (currentVal > 0) {
                        const adjustedValue = Math.round(currentVal * adjustmentFactor);
                        dmxUpdates[num] = Math.min(255, Math.max(0, adjustedValue));
                    }
                    else {
                        dmxUpdates[num] = 0; // Stays 0 if it was 0
                    }
                });
            }
        }
        else if (newValue === 0 && previousValue === 0) { // Already black, do nothing to DMX
            // No DMX changes needed, but ensure ignored channels are still themselves
            Object.keys(dmxChannels).forEach(key => {
                const num = parseInt(key);
                if (isChannelIgnored(num)) {
                    dmxUpdates[num] = dmxChannels[num];
                }
                else {
                    dmxUpdates[num] = 0; // Ensure non-ignored stay 0
                }
            });
        }
        if (Object.keys(dmxUpdates).length > 0) {
            setMultipleDmxChannels(dmxUpdates);
        }
        if (socket && oscAddress) {
            socket.emit('osc-send', {
                address: oscAddress,
                args: [{ type: 'f', value: newValue / 255 }]
            });
        }
    }, [value, dmxChannels, setMultipleDmxChannels, onValueChange, previousChannelValues, setPreviousChannelValues, setValue, socket, oscAddress]); // Updated dependencies
    const handleSliderChange = (e) => {
        const newValue = parseInt(e.target.value);
        handleValueChange(newValue);
    };
    // Removed handleSliderMouseDown as it's not needed and might have interfered.
    // const handleSliderMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    //   e.stopPropagation();
    // };
    const handleSliderInput = (e) => {
        // Handle real-time input changes for better responsiveness
        const target = e.target;
        const newValue = parseInt(target.value);
        handleValueChange(newValue);
    };
    const handleMidiLearnToggle = () => {
        if (isLearning) {
            cancelLearn();
            setIsLearning(false);
        }
        else {
            startLearn(0); // Master fader uses channel 0
            setIsLearning(true);
        }
    };
    const handleClearMidi = () => {
        // Clear MIDI mapping logic would go here
        setMidiCC(null);
        setIsLearning(false);
    };
    const blackoutAll = () => {
        handleValueChange(0);
    };
    const toggleFullOn = () => {
        const dmxUpdates = {};
        if (isFullOn) { // Turning OFF (was ON)
            setIsFullOn(false);
            Object.keys(fullOnSavedValues).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                if (isChannelIgnored(channelNum)) {
                    dmxUpdates[channelNum] = dmxChannels[channelNum]; // Keep live value
                    return;
                }
                dmxUpdates[channelNum] = fullOnSavedValues[channelNum];
            });
            // setValue(255); // Keep master fader UI at full as per original comment
        }
        else { // Turning ON
            setIsFullOn(true);
            const currentValues = {};
            Object.keys(dmxChannels).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                currentValues[channelNum] = dmxChannels[channelNum]; // Save current state for restore
                if (isChannelIgnored(channelNum)) {
                    dmxUpdates[channelNum] = dmxChannels[channelNum]; // Keep live value
                    return;
                }
                dmxUpdates[channelNum] = 255;
            });
            setFullOnSavedValues(currentValues);
            // setValue(255); // Set master fader UI to full
        }
        if (Object.keys(dmxUpdates).length > 0) {
            setMultipleDmxChannels(dmxUpdates);
        }
        // After DMX updates are sent, then update the UI state of the fader itself.
        // If turning ON, master fader UI should go to 255.
        // If turning OFF, it means we are restoring values. The master fader UI was likely already at 255.
        // If we want the master fader to go to a specific value after restoring, that needs to be decided.
        // For now, if turning ON, set to 255. If turning OFF, assume it was 255 and stays there, or user adjusts.
        if (!isFullOn) { // This means it's now ON
            setValue(255);
        }
        else { // This means it's now OFF (was ON before toggle)
            // Let's assume if the user toggles full-on OFF, they want the master fader to still represent "full"
            // for the restored values. If the restored values are all 0, then the master fader at 255 is fine.
            // This matches the original logic where setValue(255) was called in the "turn off" branch.
            setValue(255);
        }
    };
    const toggleMinimize = () => {
        const newMinimized = !isMinimized;
        setIsMinimized(newMinimized);
        if (onMinimizedChange) {
            onMinimizedChange(newMinimized);
        }
    };
    // Sync external minimize state
    useEffect(() => {
        setIsMinimized(externalIsMinimized);
    }, [externalIsMinimized]);
    // useEffect for interval cleanup
    useEffect(() => {
        return () => {
            if (fadeIntervalId) {
                clearInterval(fadeIntervalId);
            }
        };
    }, [fadeIntervalId]);
    const handleSlowFadeout = () => {
        if (isFading || value === 0)
            return;
        setIsFading(true);
        setValueBeforeFadeout(value);
        const fadeDuration = 5000; // 5 seconds
        const steps = 50;
        // Use a local variable for current value in interval to avoid stale closure issues with `value` state directly
        let currentSliderValue = value;
        const decrement = currentSliderValue / steps;
        const intervalTime = fadeDuration / steps;
        if (fadeIntervalId)
            clearInterval(fadeIntervalId);
        const newIntervalId = setInterval(() => {
            currentSliderValue -= decrement;
            if (currentSliderValue <= 0) {
                handleValueChange(0); // Ensure it hits exactly 0
                clearInterval(newIntervalId);
                setIsFading(false);
                setFadeIntervalId(null);
            }
            else {
                handleValueChange(currentSliderValue);
            }
        }, intervalTime);
        setFadeIntervalId(newIntervalId);
    };
    const handleFadeBackup = () => {
        const targetValue = valueBeforeFadeout > 0 ? valueBeforeFadeout : 255;
        if (isFading || value === targetValue)
            return;
        setIsFading(true);
        const fadeDuration = 5000; // 5 seconds
        const steps = 50;
        let currentSliderValue = value;
        // Ensure increment is positive even if currentSliderValue is slightly off
        const increment = Math.abs(targetValue - currentSliderValue) / steps;
        const intervalTime = fadeDuration / steps;
        if (fadeIntervalId)
            clearInterval(fadeIntervalId);
        const newIntervalId = setInterval(() => {
            currentSliderValue += increment;
            if (currentSliderValue >= targetValue) {
                handleValueChange(targetValue); // Ensure it hits exactly targetValue
                clearInterval(newIntervalId);
                setIsFading(false);
                setFadeIntervalId(null);
                // Optionally reset valueBeforeFadeout if it was a temporary target
                if (valueBeforeFadeout === 0 && targetValue === 255)
                    setValueBeforeFadeout(255);
            }
            else {
                handleValueChange(currentSliderValue);
            }
        }, intervalTime);
        setFadeIntervalId(newIntervalId);
    };
    // Render the core content
    const masterFaderContent = (_jsxs("div", { className: `${styles.masterFaderContent} ${isMinimized ? styles.minimized : ''}`, children: [_jsx(Sparkles, {}), " ", _jsxs("div", { className: styles.headerActions, children: [_jsxs("button", { className: `${styles.fullOnButton} ${isFullOn ? styles.active : ''}`, onClick: toggleFullOn, title: "Toggle Full On (All channels to 255)", children: [_jsx("i", { className: "fas fa-lightbulb" }), !isMinimized && "FULL ON"] }), _jsxs("button", { className: `${styles.blackoutButton} ${value === 0 ? styles.active : ''}`, onClick: blackoutAll, title: "Blackout All Channels", children: [_jsx("i", { className: "fas fa-power-off" }), !isMinimized && "Blackout"] }), _jsxs("button", { className: `${styles.slowFadeoutButton} ${isFading && value > 0 ? styles.active : ''}`, onClick: handleSlowFadeout, disabled: isFading || value === 0, title: "Slowly fade out to 0", children: [_jsx("i", { className: "fas fa-arrow-down" }), !isMinimized && "Fade Out"] }), _jsxs("button", { className: `${styles.fadeBackupButton} ${isFading && value < (valueBeforeFadeout > 0 ? valueBeforeFadeout : 255) ? styles.active : ''}`, onClick: handleFadeBackup, disabled: isFading || value === (valueBeforeFadeout > 0 ? valueBeforeFadeout : 255), title: "Fade back up to previous or full", children: [_jsx("i", { className: "fas fa-arrow-up" }), !isMinimized && "Fade In"] })] }), !isMinimized && (_jsxs("div", { className: styles.faderContainer, children: [_jsxs("div", { className: styles.sliderWrapper, children: [_jsx("input", { type: "range", min: "0", max: "255", value: value, onChange: handleSliderChange, onInput: handleSliderInput, className: styles.verticalSlider }), _jsxs("div", { className: styles.valueDisplay, children: [Math.round((value / 255) * 100), "%"] })] }), _jsxs("div", { className: styles.controls, children: [_jsxs("div", { className: styles.oscConfig, children: [_jsx("label", { children: "OSC Address:" }), _jsx("input", { type: "text", value: oscAddress, onChange: (e) => setOscAddress(e.target.value), className: styles.addressInput, placeholder: "/master" })] }), _jsxs("div", { className: styles.midiConfig, children: [_jsx("div", { className: styles.midiStatus, children: midiCC !== null ? (_jsxs("span", { className: styles.midiAssigned, children: ["MIDI CC ", midiCC, " (Ch ", midiChannel, ")"] })) : (_jsx("span", { className: styles.midiUnassigned, children: "No MIDI mapping" })) }), _jsxs("div", { className: styles.midiActions, children: [_jsx("button", { className: `${styles.learnButton} ${isLearning ? styles.learning : ''}`, onClick: handleMidiLearnToggle, disabled: false, children: isLearning ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-circle-notch fa-spin" }), "Learning..."] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-graduation-cap" }), "MIDI Learn"] })) }), midiCC !== null && (_jsx("button", { className: styles.clearButton, onClick: handleClearMidi, title: "Clear MIDI mapping", children: _jsx("i", { className: "fas fa-times" }) }))] })] }), _jsx("div", { className: styles.channelInfo, children: _jsxs("span", { children: ["Active Channels: ", Object.values(dmxChannels).filter(v => v > 0).length] }) })] })] }))] }));
    if (isDockable) {
        return (_jsx(DockableComponent, { id: "master-fader", title: "Master Fader", component: "master-fader", defaultPosition: { zone: 'bottom-center' }, defaultZIndex: 1100, isMinimized: isMinimized, onMinimizedChange: toggleMinimize, width: isMinimized ? "min(600px, calc(100vw - 40px))" : "min(800px, calc(100vw - 40px))", height: isMinimized ? "auto" : "400px", className: styles.masterFader, children: masterFaderContent }));
    }
    // Non-dockable fallback
    return (_jsxs("div", { className: `${styles.masterFader} ${isMinimized ? styles.minimized : ''}`, children: [_jsxs("div", { className: `${styles.header}`, children: [_jsx("h3", { children: "Master Fader" }), _jsx("div", { className: styles.windowControls, children: _jsx("button", { onClick: toggleMinimize, className: styles.minimizeButton, children: isMinimized ? _jsx("i", { className: "fas fa-chevron-up" }) : _jsx("i", { className: "fas fa-chevron-down" }) }) })] }), masterFaderContent] }));
};
