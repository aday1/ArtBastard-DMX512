import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
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
    const { dmxChannels, setDmxChannelValue } = useStore();
    const { socket } = useSocket();
    const { startLearn, cancelLearn } = useMidiLearn();
    const handleValueChange = useCallback((newValue) => {
        const previousValue = value;
        setValue(newValue);
        onValueChange?.(newValue);
        // Group slider behavior
        if (newValue === 0 && previousValue > 0) {
            // Moving to zero - save current values and set all to zero
            const currentValues = {};
            Object.keys(dmxChannels).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                if (dmxChannels[channelNum] > 0) {
                    currentValues[channelNum] = dmxChannels[channelNum];
                    setDmxChannelValue(channelNum, 0);
                }
            });
            setPreviousChannelValues(currentValues);
        }
        else if (newValue > 0 && previousValue === 0) {
            // Moving from zero - restore previous values proportionally
            Object.keys(previousChannelValues).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                const originalValue = previousChannelValues[channelNum];
                const proportionalValue = Math.round((originalValue * newValue) / 255);
                setDmxChannelValue(channelNum, proportionalValue);
            });
        }
        else if (newValue > 0 && previousValue > 0) {
            // Adjusting between non-zero values - scale all non-zero channels proportionally
            const scaleFactor = newValue / 255;
            Object.keys(dmxChannels).forEach(channelKey => {
                const channelNum = parseInt(channelKey);
                if (dmxChannels[channelNum] > 0) {
                    const scaledValue = Math.round(dmxChannels[channelNum] * scaleFactor);
                    setDmxChannelValue(channelNum, Math.min(255, scaledValue));
                }
            });
        }
        // Send OSC message
        if (socket && oscAddress) {
            socket.emit('osc-send', {
                address: oscAddress,
                args: [{ type: 'f', value: newValue / 255 }]
            });
        }
    }, [dmxChannels, setDmxChannelValue, socket, oscAddress, onValueChange, value, previousChannelValues]);
    const handleSliderChange = (e) => {
        const newValue = parseInt(e.target.value);
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
    return (_jsx(Draggable, { handle: ".handle", bounds: "parent", children: _jsxs("div", { className: `${styles.masterFader} ${isMinimized ? styles.minimized : ''}`, children: [_jsxs("div", { className: `${styles.header} handle`, children: [_jsx("h3", { children: "Master Fader" }), _jsx("div", { className: styles.windowControls, children: _jsx("button", { onClick: toggleMinimize, className: styles.minimizeButton, children: isMinimized ? _jsx("i", { className: "fas fa-window-maximize" }) : _jsx("i", { className: "fas fa-window-minimize" }) }) }), _jsxs("div", { className: styles.headerActions, children: [_jsxs("button", { className: `${styles.fullOnButton} ${isFullOn ? styles.active : ''}`, onClick: toggleFullOn, title: "Toggle Full On (All channels to 255)", children: [_jsx("i", { className: "fas fa-lightbulb" }), "FULL ON"] }), _jsxs("button", { className: styles.blackoutButton, onClick: blackoutAll, title: "Blackout All Channels", children: [_jsx("i", { className: "fas fa-power-off" }), "Blackout"] })] })] }), !isMinimized && (_jsxs("div", { className: styles.faderContainer, children: [_jsxs("div", { className: styles.sliderWrapper, children: [_jsx("input", { type: "range", min: "0", max: "255", value: value, onChange: handleSliderChange, className: styles.verticalSlider }), _jsxs("div", { className: styles.valueDisplay, children: [Math.round((value / 255) * 100), "%"] })] }), _jsxs("div", { className: styles.controls, children: [_jsxs("div", { className: styles.oscConfig, children: [_jsx("label", { children: "OSC Address:" }), _jsx("input", { type: "text", value: oscAddress, onChange: (e) => setOscAddress(e.target.value), className: styles.addressInput, placeholder: "/master" })] }), _jsxs("div", { className: styles.midiConfig, children: [_jsx("div", { className: styles.midiStatus, children: midiCC !== null ? (_jsxs("span", { className: styles.midiAssigned, children: ["MIDI CC ", midiCC, " (Ch ", midiChannel, ")"] })) : (_jsx("span", { className: styles.midiUnassigned, children: "No MIDI mapping" })) }), _jsxs("div", { className: styles.midiActions, children: [_jsx("button", { className: `${styles.learnButton} ${isLearning ? styles.learning : ''}`, onClick: handleMidiLearnToggle, disabled: false, children: isLearning ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-circle-notch fa-spin" }), "Learning..."] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-graduation-cap" }), "MIDI Learn"] })) }), midiCC !== null && (_jsx("button", { className: styles.clearButton, onClick: handleClearMidi, title: "Clear MIDI mapping", children: _jsx("i", { className: "fas fa-times" }) }))] })] }), _jsx("div", { className: styles.channelInfo, children: _jsxs("span", { children: ["Active Channels: ", Object.values(dmxChannels).filter(v => v > 0).length] }) })] })] }))] }) }));
};
