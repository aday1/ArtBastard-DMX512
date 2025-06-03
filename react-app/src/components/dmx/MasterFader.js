import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import styles from './MasterFader.module.scss';
export const MasterFader = ({ onValueChange }) => {
    const [value, setValue] = useState(0);
    const [oscAddress, setOscAddress] = useState('/master');
    const [midiCC, setMidiCC] = useState(null);
    const [midiChannel, setMidiChannel] = useState(1);
    const [isLearning, setIsLearning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false); // State for minimized
    const [isFullOn, setIsFullOn] = useState(false); // State for FULL ON mode
    const [previousChannelValues, setPreviousChannelValues] = useState({});
    const [fullOnSavedValues, setFullOnSavedValues] = useState({});
    const [fadeIntervalId, setFadeIntervalId] = useState(null);
    const [valueBeforeFadeout, setValueBeforeFadeout] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const { dmxChannels, setDmxChannelValue } = useStore();
    const { socket } = useSocket();
    const { startLearn, cancelLearn } = useMidiLearn();
    const handleValueChange = useCallback((newValue) => {
        const previousValue = value; // Capture state BEFORE update for DMX logic
        setValue(newValue); // Update state - this should make the slider knob move
        onValueChange?.(newValue); // Propagate change
        // Reintroduce DMX logic
        if (newValue === 0 && previousValue > 0) {
            const currentValuesToSaveNormalized = {};
            Object.keys(dmxChannels).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                const currentDmxValue = dmxChannels[channelNum]; // Current live DMX value for this channel
                if (currentDmxValue > 0) {
                    let normalizedValue = currentDmxValue;
                    // If master was active but not full, normalize the DMX value
                    if (previousValue > 0 && previousValue < 255) {
                        normalizedValue = (currentDmxValue / previousValue) * 255;
                    }
                    // If previousValue was 255, currentDmxValue is already the "full" value.
                    // If previousValue was 0 (not possible in this branch due to `previousValue > 0`), it's a non-issue.
                    currentValuesToSaveNormalized[channelNum] = Math.min(255, Math.max(0, Math.round(normalizedValue)));
                    setDmxChannelValue(channelNum, 0); // Set live DMX to 0
                }
                else {
                    // If currentDmxValue is 0, ensure it's set to 0 in the live DMX (if not already)
                    // and don't store it in previousChannelValues unless we want to explicitly restore it to 0.
                    // For simplicity, we only store values that were > 0.
                    // However, if a channel was manually set to 0 while master was up, and then master goes to 0,
                    // it won't be in previousChannelValues. When master comes up, it won't be touched by the restore loop.
                    // This is generally fine.
                    if (dmxChannels[channelNum] !== 0) { // Ensure it's set to 0 if it wasn't already
                        setDmxChannelValue(channelNum, 0);
                    }
                }
            });
            setPreviousChannelValues(currentValuesToSaveNormalized);
        }
        else if (newValue > 0 && previousValue === 0) {
            Object.keys(previousChannelValues).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                const normalizedOriginalValue = previousChannelValues[channelNum]; // This is now the "full" value
                const proportionalValue = Math.round((normalizedOriginalValue * newValue) / 255);
                setDmxChannelValue(channelNum, proportionalValue);
            });
        }
        else if (newValue > 0 && previousValue > 0) {
            // Refactored logic for "adjusting between non-zero values"
            if (previousValue !== 0) { // Avoid division by zero
                const adjustmentFactor = newValue / previousValue;
                Object.keys(dmxChannels).forEach(key => {
                    const num = parseInt(key);
                    // Scale the current value of the channel
                    const adjustedValue = Math.round(dmxChannels[num] * adjustmentFactor);
                    setDmxChannelValue(num, Math.min(255, Math.max(0, adjustedValue)));
                });
            }
        }
        // Send OSC message
        if (socket && oscAddress) {
            socket.emit('osc-send', {
                address: oscAddress,
                args: [{ type: 'f', value: newValue / 255 }]
            });
        }
    }, [value, dmxChannels, setDmxChannelValue, onValueChange, previousChannelValues, setPreviousChannelValues, setValue, socket, oscAddress]);
    const handleSliderChange = (e) => {
        const newValue = parseInt(e.target.value);
        handleValueChange(newValue);
    };
    const handleSliderMouseDown = (e) => {
        // Prevent the Draggable parent from intercepting mouse events
        e.stopPropagation();
    };
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
        if (isFullOn) {
            // Turn off FULL ON - restore previous values
            setIsFullOn(false);
            Object.keys(fullOnSavedValues).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                setDmxChannelValue(channelNum, fullOnSavedValues[channelNum]);
            });
            setValue(255); // Set master to full
        }
        else {
            // Turn on FULL ON - save current values and set all to 255
            setIsFullOn(true);
            const currentValues = {};
            Object.keys(dmxChannels).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                currentValues[channelNum] = dmxChannels[channelNum];
                setDmxChannelValue(channelNum, 255);
            });
            setFullOnSavedValues(currentValues);
            setValue(255); // Set master to full
        }
    };
    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };
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
    return (_jsx(Draggable, { handle: ".dragHandle", bounds: "parent", children: _jsxs("div", { className: `${styles.masterFader} ${isMinimized ? styles.minimized : ''}`, children: [_jsxs("div", { className: `${styles.header}`, children: [_jsx("h3", { className: "dragHandle", style: { cursor: 'grab' }, children: "Master Fader" }), _jsx("div", { className: styles.windowControls, children: _jsx("button", { onClick: toggleMinimize, className: styles.minimizeButton, children: isMinimized ? _jsx("i", { className: "fas fa-window-maximize" }) : _jsx("i", { className: "fas fa-window-minimize" }) }) }), _jsxs("div", { className: styles.headerActions, children: [_jsxs("button", { className: `${styles.fullOnButton} ${isFullOn ? styles.active : ''}`, onClick: toggleFullOn, title: "Toggle Full On (All channels to 255)", children: [_jsx("i", { className: "fas fa-lightbulb" }), "FULL ON"] }), _jsxs("button", { className: styles.blackoutButton, onClick: blackoutAll, title: "Blackout All Channels", children: [_jsx("i", { className: "fas fa-power-off" }), "Blackout"] }), _jsxs("button", { className: styles.slowFadeoutButton, onClick: handleSlowFadeout, disabled: isFading || value === 0, title: "Slowly fade out to 0", children: [_jsx("i", { className: "fas fa-arrow-down" }), "Slow Fadeout"] }), _jsxs("button", { className: styles.fadeBackupButton, onClick: handleFadeBackup, disabled: isFading || value === (valueBeforeFadeout > 0 ? valueBeforeFadeout : 255), title: "Fade back up to previous or full", children: [_jsx("i", { className: "fas fa-arrow-up" }), "Fade Back up"] })] })] }), !isMinimized && (_jsxs("div", { className: styles.faderContainer, children: [_jsxs("div", { className: styles.sliderWrapper, children: [_jsx("input", { type: "range", min: "0", max: "255", value: value, onChange: handleSliderChange, onInput: handleSliderInput, onMouseDown: handleSliderMouseDown, onPointerDown: handleSliderMouseDown, className: styles.verticalSlider }), _jsxs("div", { className: styles.valueDisplay, children: [Math.round((value / 255) * 100), "%"] })] }), _jsxs("div", { className: styles.controls, children: [_jsxs("div", { className: styles.oscConfig, children: [_jsx("label", { children: "OSC Address:" }), _jsx("input", { type: "text", value: oscAddress, onChange: (e) => setOscAddress(e.target.value), className: styles.addressInput, placeholder: "/master" })] }), _jsxs("div", { className: styles.midiConfig, children: [_jsx("div", { className: styles.midiStatus, children: midiCC !== null ? (_jsxs("span", { className: styles.midiAssigned, children: ["MIDI CC ", midiCC, " (Ch ", midiChannel, ")"] })) : (_jsx("span", { className: styles.midiUnassigned, children: "No MIDI mapping" })) }), _jsxs("div", { className: styles.midiActions, children: [_jsx("button", { className: `${styles.learnButton} ${isLearning ? styles.learning : ''}`, onClick: handleMidiLearnToggle, disabled: false, children: isLearning ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-circle-notch fa-spin" }), "Learning..."] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-graduation-cap" }), "MIDI Learn"] })) }), midiCC !== null && (_jsx("button", { className: styles.clearButton, onClick: handleClearMidi, title: "Clear MIDI mapping", children: _jsx("i", { className: "fas fa-times" }) }))] })] }), _jsx("div", { className: styles.channelInfo, children: _jsxs("span", { children: ["Active Channels: ", Object.values(dmxChannels).filter(v => v > 0).length] }) })] })] }))] }) }));
};
