import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { MidiLearnButton } from '../midi/MidiLearnButton';
import styles from './DmxChannel.module.scss';
export const DmxChannel = ({ index, allowFullscreen = true, allowDetach = true }) => {
    const { dmxChannels, channelNames, selectedChannels, toggleChannelSelection, setDmxChannel, oscAssignments, setOscAssignment, oscActivity, } = useStore(state => ({
        dmxChannels: state.dmxChannels,
        channelNames: state.channelNames,
        selectedChannels: state.selectedChannels,
        toggleChannelSelection: state.toggleChannelSelection,
        setDmxChannel: state.setDmxChannel,
        oscAssignments: state.oscAssignments,
        setOscAssignment: state.setOscAssignment,
        oscActivity: state.oscActivity,
    }));
    const [showDetails, setShowDetails] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDetached, setIsDetached] = useState(false);
    const [detachedPosition, setDetachedPosition] = useState({ x: 100, y: 100 });
    const [detachedSize, setDetachedSize] = useState({ width: 400, height: 600 });
    const [localOscAddress, setLocalOscAddress] = useState('');
    const [activityIndicator, setActivityIndicator] = useState(false);
    const activityTimeoutRef = useRef(null);
    const channelRef = useRef(null);
    const [showMidiRangeControls, setShowMidiRangeControls] = useState(false);
    const [midiRangeMapping, setMidiRangeMapping] = useState({
        inputMin: 0,
        inputMax: 127,
        outputMin: 0,
        outputMax: 255,
        curve: 1,
        inverted: false
    });
    useEffect(() => {
        if (oscAssignments && oscAssignments[index]) {
            setLocalOscAddress(oscAssignments[index]);
        }
    }, [oscAssignments, index]);
    useEffect(() => {
        const currentActivity = oscActivity[index];
        if (currentActivity && currentActivity.value > 0) {
            setActivityIndicator(true);
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            activityTimeoutRef.current = setTimeout(() => {
                setActivityIndicator(false);
            }, 300);
        }
        return () => {
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
        };
    }, [oscActivity, index]);
    const applyMidiRangeSettings = () => {
        if (window.midiDmxProcessor && typeof window.midiDmxProcessor.setChannelRangeMapping === 'function') {
            window.midiDmxProcessor.setChannelRangeMapping(index, midiRangeMapping);
        }
    };
    const handleMidiRangeChange = (field, value) => {
        setMidiRangeMapping(prev => {
            const newMapping = { ...prev, [field]: value };
            // Only apply validation for numeric fields
            if (typeof value === 'number') {
                if (field === 'inputMin' && value > prev.inputMax) {
                    newMapping.inputMin = prev.inputMax;
                }
                if (field === 'inputMax' && value < prev.inputMin) {
                    newMapping.inputMax = prev.inputMin;
                }
                if (field === 'outputMin' && value > prev.outputMax) {
                    newMapping.outputMin = prev.outputMax;
                }
                if (field === 'outputMax' && value < prev.outputMin) {
                    newMapping.outputMax = prev.outputMin;
                }
            }
            return newMapping;
        });
    };
    useEffect(() => {
        applyMidiRangeSettings();
    }, [midiRangeMapping, index]);
    useEffect(() => {
        if (window.midiDmxProcessor && typeof window.midiDmxProcessor.getChannelRangeMappings === 'function') {
            const mappings = window.midiDmxProcessor.getChannelRangeMappings();
            if (mappings && mappings[index]) {
                setMidiRangeMapping(prev => ({
                    ...prev,
                    ...mappings[index]
                }));
            }
        }
    }, [index]);
    useEffect(() => {
        const handleDmxChannelUpdate = (event) => {
            const customEvent = event;
            if (customEvent.detail && customEvent.detail.channel === index) {
                setDmxChannel(index, customEvent.detail.value);
            }
        };
        window.addEventListener('dmxChannelUpdate', handleDmxChannelUpdate);
        return () => {
            window.removeEventListener('dmxChannelUpdate', handleDmxChannelUpdate);
        };
    }, [index, setDmxChannel]);
    const value = dmxChannels[index] || 0;
    const name = channelNames[index] || `CH ${index + 1}`;
    const isSelected = selectedChannels.includes(index);
    const handleValueChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        setDmxChannel(index, newValue);
    };
    const handleDirectInput = (e) => {
        const newValue = parseInt(e.target.value, 10);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
            setDmxChannel(index, newValue);
        }
    };
    const handleOscAddressChange = (e) => {
        setLocalOscAddress(e.target.value);
    };
    const handleOscAddressBlur = () => {
        if (setOscAssignment && oscAssignments[index] !== localOscAddress) {
            setOscAssignment(index, localOscAddress);
        }
    };
    const handleOscAddressKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (setOscAssignment && oscAssignments[index] !== localOscAddress) {
                setOscAssignment(index, localOscAddress);
                e.target.blur();
            }
        }
    };
    const getBackgroundColor = () => {
        const hue = value === 0 ? 240 : 200;
        const lightness = 20 + (value / 255) * 50;
        return `hsl(${hue}, 80%, ${lightness}%)`;
    };
    const dmxAddress = index + 1;
    const currentOscValue = oscActivity[index]?.value;
    const lastOscTimestamp = oscActivity[index]?.timestamp;
    const toggleFullscreen = () => {
        const newFullscreenState = !isFullscreen;
        setIsFullscreen(newFullscreenState);
        setShowDetails(true);
        // Handle document body classes for fullscreen mode
        if (newFullscreenState) {
            document.body.classList.add('dmx-channel-fullscreen-active');
        }
        else {
            document.body.classList.remove('dmx-channel-fullscreen-active');
        }
        // Scroll into view when maximizing
        if (newFullscreenState && channelRef.current) {
            setTimeout(() => {
                channelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    };
    const toggleExpanded = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        // Auto-show details when expanding
        if (newExpandedState) {
            setShowDetails(true);
        }
        // Scroll into view when expanding
        if (newExpandedState && channelRef.current) {
            setTimeout(() => {
                channelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        }
    };
    const toggleDetached = () => {
        setIsDetached(!isDetached);
        setShowDetails(true);
    };
    // Add ESC key handler to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);
    return (_jsxs("div", { ref: channelRef, className: `${styles.channel} ${isSelected ? styles.selected : ''} ${showDetails ? styles.expanded : ''} ${isExpanded ? styles.maximized : ''} ${isFullscreen ? styles.fullscreen : ''}`, onClick: () => !isFullscreen && !isDetached && toggleChannelSelection(index), children: [_jsxs("div", { className: styles.header, children: [_jsx("div", { className: styles.address, children: dmxAddress }), _jsx("div", { className: styles.name, children: name }), _jsx("div", { className: styles.headerControls, children: _jsx("button", { className: styles.detailsToggle, onClick: (e) => {
                                e.stopPropagation();
                                setShowDetails(!showDetails);
                            }, children: _jsx("i", { className: `fas fa-${showDetails ? 'chevron-up' : 'chevron-down'}` }) }) })] }), "      ", isFullscreen ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.fullscreenHeader, children: [_jsxs("h2", { children: ["DMX Channel ", dmxAddress] }), _jsx("p", { children: name })] }), _jsxs("div", { className: `${styles.value} ${styles.fullscreenValue}`, style: { backgroundColor: getBackgroundColor() }, children: [value, _jsxs("div", { className: styles.valuePercentOverlay, children: [Math.round((value / 255) * 100), "%"] })] }), _jsx("div", { className: `${styles.slider} ${styles.fullscreenSlider}`, "data-dmx-channel": index, children: _jsx("input", { type: "range", min: "0", max: "255", value: value, onChange: handleValueChange, onClick: (e) => e.stopPropagation(), "data-slider-index": index }) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: `${styles.value}`, style: { backgroundColor: getBackgroundColor() }, children: value }), _jsx("div", { className: `${styles.slider}`, "data-dmx-channel": index, children: _jsx("input", { type: "range", min: "0", max: "255", value: value, onChange: handleValueChange, onClick: (e) => e.stopPropagation(), "data-slider-index": index }) })] })), showDetails && (_jsxs("div", { className: styles.details, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: styles.directInput, children: [_jsx("label", { htmlFor: `dmx-value-${index}`, children: "Value:" }), _jsx("input", { id: `dmx-value-${index}`, type: "number", min: "0", max: "255", value: value, onChange: handleDirectInput })] }), _jsxs("div", { className: styles.oscAddressInput, children: [_jsx("label", { htmlFor: `osc-address-${index}`, children: "OSC Address:" }), _jsx("input", { id: `osc-address-${index}`, type: "text", value: localOscAddress, onChange: handleOscAddressChange, onBlur: handleOscAddressBlur, onKeyPress: handleOscAddressKeyPress, placeholder: "/dmx/channel/X", className: activityIndicator ? styles.oscActive : '' })] }), currentOscValue !== undefined && (_jsxs("div", { className: styles.oscActivityDisplay, children: ["Last OSC: ", currentOscValue.toFixed(3), lastOscTimestamp && (_jsxs("span", { className: styles.oscTimestamp, children: ["(", new Date(lastOscTimestamp).toLocaleTimeString(), ")"] }))] })), "          ", _jsx(MidiLearnButton, { channelIndex: index }), _jsxs("div", { className: styles.midiRangeControls, children: [_jsx("button", { className: styles.rangeToggle, onClick: () => setShowMidiRangeControls(!showMidiRangeControls), children: showMidiRangeControls ? 'Hide MIDI Range Controls' : 'Show MIDI Range Controls' }), showMidiRangeControls && (_jsxs("div", { className: styles.midiRangeForm, children: [_jsx("div", { className: styles.midiInvertRow, children: _jsxs("label", { className: styles.midiInvertLabel, children: [_jsx("input", { type: "checkbox", checked: midiRangeMapping.inverted || false, onChange: (e) => handleMidiRangeChange('inverted', e.target.checked), className: styles.midiInvertCheckbox }), _jsx("span", { children: "Invert MIDI Input" })] }) }), _jsxs("div", { className: styles.midiRangeSection, children: [_jsx("h4", { className: styles.midiSectionTitle, children: "MIDI Input Range (0-127)" }), _jsxs("div", { className: styles.midiRangeRow, children: [_jsxs("div", { className: styles.midiRangeColumn, children: [_jsx("label", { children: "Min:" }), _jsx("input", { type: "number", min: "0", max: "127", value: midiRangeMapping.inputMin, onChange: (e) => handleMidiRangeChange('inputMin', parseInt(e.target.value)) })] }), _jsxs("div", { className: styles.midiRangeColumn, children: [_jsx("label", { children: "Max:" }), _jsx("input", { type: "number", min: "0", max: "127", value: midiRangeMapping.inputMax, onChange: (e) => handleMidiRangeChange('inputMax', parseInt(e.target.value)) })] })] }), _jsx("div", { className: styles.midiRangeSliderRow, children: _jsxs("div", { className: styles.midiDualSlider, children: [_jsx("input", { type: "range", min: "0", max: "127", value: midiRangeMapping.inputMin, onChange: (e) => handleMidiRangeChange('inputMin', parseInt(e.target.value)), className: styles.midiRangeSliderMin }), _jsx("input", { type: "range", min: "0", max: "127", value: midiRangeMapping.inputMax, onChange: (e) => handleMidiRangeChange('inputMax', parseInt(e.target.value)), className: styles.midiRangeSliderMax }), _jsxs("div", { className: styles.sliderLabels, children: [_jsx("span", { children: midiRangeMapping.inputMin }), _jsx("span", { children: midiRangeMapping.inputMax })] })] }) })] }), _jsxs("div", { className: styles.midiRangeSection, children: [_jsx("h4", { className: styles.midiSectionTitle, children: "DMX Output Range (0-255)" }), _jsxs("div", { className: styles.midiRangeRow, children: [_jsxs("div", { className: styles.midiRangeColumn, children: [_jsx("label", { children: "Min:" }), _jsx("input", { type: "number", min: "0", max: "255", value: midiRangeMapping.outputMin, onChange: (e) => handleMidiRangeChange('outputMin', parseInt(e.target.value)) })] }), _jsxs("div", { className: styles.midiRangeColumn, children: [_jsx("label", { children: "Max:" }), _jsx("input", { type: "number", min: "0", max: "255", value: midiRangeMapping.outputMax, onChange: (e) => handleMidiRangeChange('outputMax', parseInt(e.target.value)) })] })] }), _jsx("div", { className: styles.midiRangeSliderRow, children: _jsxs("div", { className: styles.midiDualSlider, children: [_jsx("input", { type: "range", min: "0", max: "255", value: midiRangeMapping.outputMin, onChange: (e) => handleMidiRangeChange('outputMin', parseInt(e.target.value)), className: styles.midiRangeSliderMin }), _jsx("input", { type: "range", min: "0", max: "255", value: midiRangeMapping.outputMax, onChange: (e) => handleMidiRangeChange('outputMax', parseInt(e.target.value)), className: styles.midiRangeSliderMax }), _jsxs("div", { className: styles.sliderLabels, children: [_jsx("span", { children: midiRangeMapping.outputMin }), _jsx("span", { children: midiRangeMapping.outputMax })] })] }) })] }), _jsxs("div", { className: styles.midiRangeSection, children: [_jsx("h4", { className: styles.midiSectionTitle, children: "Response Curve" }), _jsx("div", { className: styles.midiRangeRow, children: _jsxs("div", { className: styles.midiRangeColumn, children: [_jsx("label", { children: "Curve:" }), _jsx("input", { type: "range", min: "0.1", max: "3", step: "0.1", value: midiRangeMapping.curve, onChange: (e) => handleMidiRangeChange('curve', parseFloat(e.target.value)), className: styles.midiCurveSlider }), _jsx("span", { className: styles.curveValue, children: midiRangeMapping.curve?.toFixed(1) })] }) })] }), _jsx("button", { className: styles.applyMidiRangeButton, onClick: applyMidiRangeSettings, children: "Apply MIDI Settings" })] }))] }), _jsxs("div", { className: styles.valueDisplay, children: [_jsxs("div", { className: styles.valueHex, children: ["HEX: ", value.toString(16).padStart(2, '0').toUpperCase()] }), _jsxs("div", { className: styles.valuePercent, children: [Math.round((value / 255) * 100), "%"] })] }), "            ", _jsxs("div", { className: styles.detailButtons, children: [!isFullscreen && (_jsxs("button", { className: styles.expandButton, onClick: (e) => {
                                    e.stopPropagation();
                                    toggleExpanded();
                                }, title: isExpanded ? "Minimize Channel" : "Maximize Channel", children: [_jsx("i", { className: `fas fa-${isExpanded ? 'compress-arrows-alt' : 'expand-arrows-alt'}` }), _jsx("span", { children: isExpanded ? "Minimize" : "Maximize" })] })), allowFullscreen && (_jsxs("button", { className: styles.fullscreenButton, onClick: (e) => {
                                    e.stopPropagation();
                                    toggleFullscreen();
                                }, title: isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode", children: [_jsx("i", { className: `fas fa-${isFullscreen ? 'compress' : 'expand'}` }), _jsx("span", { children: isFullscreen ? "Exit Fullscreen" : "Fullscreen" })] })), allowDetach && !isFullscreen && (_jsxs("button", { className: styles.detachButton, onClick: (e) => {
                                    e.stopPropagation();
                                    toggleDetached();
                                }, title: isDetached ? "Dock Window" : "Detach Window", disabled: isFullscreen, children: [_jsx("i", { className: `fas fa-${isDetached ? 'thumbtack' : 'external-link-alt'}` }), _jsx("span", { children: isDetached ? "Dock" : "Detach" })] }))] })] }))] }));
};
