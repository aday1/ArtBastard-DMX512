import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import styles from './ChromaticEnergyManipulatorMini.module.scss';
import { useStore } from '../../store';
export const ChromaticEnergyManipulatorMini = () => {
    const [selectedFixture, setSelectedFixture] = useState(null);
    const [showColorControls, setShowColorControls] = useState(true);
    const [showMovementControls, setShowMovementControls] = useState(true);
    const [showColorPresets, setShowColorPresets] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const { fixtures, theme, getDmxChannelValue, setDmxChannelValue } = useStore((state) => ({
        fixtures: state.fixtures,
        theme: state.theme,
        getDmxChannelValue: state.getDmxChannelValue,
        setDmxChannelValue: state.setDmxChannelValue
    }));
    // Find RGB and Pan/Tilt channels for the selected fixture
    const getFixtureChannels = (fixtureId) => {
        const fixture = fixtures.find(f => f.id === fixtureId);
        if (!fixture)
            return { rgbChannels: {}, movementChannels: {} };
        const rgbChannels = {};
        const movementChannels = {};
        // Find the channel indices based on channel types
        fixture.channels.forEach((channel, index) => {
            const dmxAddress = fixture.startAddress + index;
            switch (channel.type) {
                case 'red':
                    rgbChannels.redChannel = dmxAddress - 1; // 0-indexed
                    break;
                case 'green':
                    rgbChannels.greenChannel = dmxAddress - 1;
                    break;
                case 'blue':
                    rgbChannels.blueChannel = dmxAddress - 1;
                    break;
                case 'pan':
                    movementChannels.panChannel = dmxAddress - 1;
                    break;
                case 'tilt':
                    movementChannels.tiltChannel = dmxAddress - 1;
                    break;
            }
        });
        return { rgbChannels, movementChannels };
    };
    // Show all fixtures regardless of channel types
    const compatibleFixtures = fixtures;
    // Auto-select the first fixture if none selected and fixtures exist
    useEffect(() => {
        if (!selectedFixture && fixtures.length > 0) {
            setSelectedFixture(fixtures[0].id);
        }
    }, [selectedFixture, fixtures]);
    // Get the channels for the currently selected fixture
    const { rgbChannels, movementChannels } = selectedFixture ?
        getFixtureChannels(selectedFixture) :
        { rgbChannels: {}, movementChannels: {} };
    // Get current values from DMX channels
    const getCurrentValues = () => {
        return {
            red: rgbChannels.redChannel !== undefined ? getDmxChannelValue(rgbChannels.redChannel) : 0,
            green: rgbChannels.greenChannel !== undefined ? getDmxChannelValue(rgbChannels.greenChannel) : 0,
            blue: rgbChannels.blueChannel !== undefined ? getDmxChannelValue(rgbChannels.blueChannel) : 0,
            pan: movementChannels.panChannel !== undefined ? getDmxChannelValue(movementChannels.panChannel) : 127,
            tilt: movementChannels.tiltChannel !== undefined ? getDmxChannelValue(movementChannels.tiltChannel) : 127
        };
    };
    const currentValues = getCurrentValues();
    // Handle color value changes
    const handleColorChange = (channel, value) => {
        try {
            setConnectionError(null);
            const channelMap = {
                red: rgbChannels.redChannel,
                green: rgbChannels.greenChannel,
                blue: rgbChannels.blueChannel
            };
            const channelNumber = channelMap[channel];
            if (channelNumber !== undefined && channelNumber >= 0) {
                const clampedValue = Math.max(0, Math.min(255, value));
                setDmxChannelValue(channelNumber, clampedValue);
            }
        }
        catch (error) {
            setConnectionError(`Failed to update ${channel} channel`);
            console.error(`Color change error for ${channel}:`, error);
        }
    };
    // Handle movement value changes
    const handleMovementChange = (axis, value) => {
        try {
            setConnectionError(null);
            const channelMap = {
                pan: movementChannels.panChannel,
                tilt: movementChannels.tiltChannel
            };
            const channelNumber = channelMap[axis];
            if (channelNumber !== undefined && channelNumber >= 0) {
                const clampedValue = Math.max(0, Math.min(255, value));
                setDmxChannelValue(channelNumber, clampedValue);
            }
        }
        catch (error) {
            setConnectionError(`Failed to update ${axis} axis`);
            console.error(`Movement change error for ${axis}:`, error);
        }
    };
    // Quick color presets
    const colorPresets = [
        { name: 'Red', r: 255, g: 0, b: 0 },
        { name: 'Green', r: 0, g: 255, b: 0 },
        { name: 'Blue', r: 0, g: 0, b: 255 },
        { name: 'White', r: 255, g: 255, b: 255 },
        { name: 'Yellow', r: 255, g: 255, b: 0 },
        { name: 'Cyan', r: 0, g: 255, b: 255 },
        { name: 'Magenta', r: 255, g: 0, b: 255 },
        { name: 'Off', r: 0, g: 0, b: 0 }
    ];
    const applyColorPreset = (preset) => {
        try {
            setIsUpdating(true);
            setConnectionError(null);
            handleColorChange('red', preset.r);
            handleColorChange('green', preset.g);
            handleColorChange('blue', preset.b);
        }
        catch (error) {
            setConnectionError('Failed to apply color preset');
            console.error('Color preset error:', error);
        }
        finally {
            setIsUpdating(false);
        }
    };
    // Movement presets
    const centerMovement = () => {
        try {
            setIsUpdating(true);
            setConnectionError(null);
            handleMovementChange('pan', 127);
            handleMovementChange('tilt', 127);
        }
        catch (error) {
            setConnectionError('Failed to center movement');
            console.error('Movement center error:', error);
        }
        finally {
            setIsUpdating(false);
        }
    };
    const randomizeColor = () => {
        const randomColor = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
        applyColorPreset(randomColor);
    };
    const hasRGBChannels = Object.keys(rgbChannels).length > 0;
    const hasMovementChannels = Object.keys(movementChannels).length > 0;
    const getThemeTitle = () => {
        switch (theme) {
            case 'artsnob':
                return '🎨 Chromatic Energy';
            case 'standard':
                return 'Color & Movement';
            case 'minimal':
                return 'Color/Move';
            default:
                return 'Color & Movement';
        }
    };
    return (_jsxs("div", { className: styles.chromaticEnergyMini, children: [connectionError && (_jsxs("div", { className: styles.errorMessage, children: [_jsxs("span", { children: ["\u26A0\uFE0F ", connectionError] }), _jsx("button", { onClick: () => setConnectionError(null), className: styles.closeError, children: "\u00D7" })] })), isUpdating && (_jsx("div", { className: styles.loadingIndicator, children: _jsx("span", { children: "\u27F3 Updating..." }) })), _jsxs("div", { className: styles.header, children: [_jsx("h4", { className: styles.title, children: getThemeTitle() }), _jsx("div", { className: styles.fixtureSelector, children: _jsxs("select", { value: selectedFixture || '', onChange: (e) => setSelectedFixture(e.target.value), className: styles.fixtureSelect, children: [_jsx("option", { value: "", children: "-- Select fixture --" }), fixtures.map((fixture) => (_jsx("option", { value: fixture.id, children: fixture.name }, fixture.id)))] }) })] }), selectedFixture && (hasRGBChannels || hasMovementChannels) ? (_jsxs("div", { className: styles.content, children: [hasRGBChannels && (_jsxs("div", { className: styles.colorSection, children: [_jsxs("div", { className: styles.sectionHeader, onClick: () => setShowColorControls(!showColorControls), children: [_jsx("span", { className: styles.sectionTitle, children: theme === 'artsnob' ? 'Chromatic Essence' : 'Color' }), _jsx("span", { className: `${styles.toggleIcon} ${showColorControls ? styles.expanded : ''}`, children: "\u25BC" })] }), showColorControls && (_jsxs("div", { className: styles.colorControls, children: [_jsxs("div", { className: styles.rgbControls, children: [rgbChannels.redChannel !== undefined && (_jsxs("div", { className: styles.sliderGroup, children: [_jsx("label", { className: styles.sliderLabel, children: "R" }), _jsx("input", { type: "range", min: "0", max: "255", value: currentValues.red, onChange: (e) => handleColorChange('red', parseInt(e.target.value)), className: `${styles.slider} ${styles.redSlider}` }), _jsx("span", { className: styles.value, children: currentValues.red })] })), rgbChannels.greenChannel !== undefined && (_jsxs("div", { className: styles.sliderGroup, children: [_jsx("label", { className: styles.sliderLabel, children: "G" }), _jsx("input", { type: "range", min: "0", max: "255", value: currentValues.green, onChange: (e) => handleColorChange('green', parseInt(e.target.value)), className: `${styles.slider} ${styles.greenSlider}` }), _jsx("span", { className: styles.value, children: currentValues.green })] })), rgbChannels.blueChannel !== undefined && (_jsxs("div", { className: styles.sliderGroup, children: [_jsx("label", { className: styles.sliderLabel, children: "B" }), _jsx("input", { type: "range", min: "0", max: "255", value: currentValues.blue, onChange: (e) => handleColorChange('blue', parseInt(e.target.value)), className: `${styles.slider} ${styles.blueSlider}` }), _jsx("span", { className: styles.value, children: currentValues.blue })] }))] }), _jsx("div", { className: styles.colorPreview, style: {
                                            backgroundColor: `rgb(${currentValues.red}, ${currentValues.green}, ${currentValues.blue})`
                                        } }), "                  ", _jsxs("div", { className: styles.colorPresets, children: [_jsxs("div", { className: styles.presetHeader, children: [_jsx("span", { children: "Quick Colors" }), _jsx("button", { className: styles.togglePresets, onClick: () => setShowColorPresets(!showColorPresets), children: showColorPresets ? '▼' : '▶' })] }), showColorPresets && (_jsx("div", { className: styles.presetsGrid, children: colorPresets.map((preset, index) => (_jsx("button", { className: styles.presetButton, style: {
                                                        backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})`,
                                                        border: `1px solid ${preset.r + preset.g + preset.b < 100 ? '#666' : '#333'}`
                                                    }, onClick: () => applyColorPreset(preset), title: preset.name }, index))) })), _jsx("div", { className: styles.presetActions, children: _jsx("button", { className: styles.actionButton, onClick: randomizeColor, title: "Random Color", children: "\uD83C\uDFB2 Random" }) })] })] }))] })), hasMovementChannels && (_jsxs("div", { className: styles.movementSection, children: [_jsxs("div", { className: styles.sectionHeader, onClick: () => setShowMovementControls(!showMovementControls), children: [_jsx("span", { className: styles.sectionTitle, children: theme === 'artsnob' ? 'Spatial Dynamics' : 'Movement' }), _jsx("span", { className: `${styles.toggleIcon} ${showMovementControls ? styles.expanded : ''}`, children: "\u25BC" })] }), showMovementControls && (_jsxs("div", { className: styles.movementControls, children: [_jsxs("div", { className: styles.movementSliders, children: [movementChannels.panChannel !== undefined && (_jsxs("div", { className: styles.sliderGroup, children: [_jsx("label", { className: styles.sliderLabel, children: "Pan" }), _jsx("input", { type: "range", min: "0", max: "255", value: currentValues.pan, onChange: (e) => handleMovementChange('pan', parseInt(e.target.value)), className: styles.slider }), _jsx("span", { className: styles.value, children: currentValues.pan })] })), movementChannels.tiltChannel !== undefined && (_jsxs("div", { className: styles.sliderGroup, children: [_jsx("label", { className: styles.sliderLabel, children: "Tilt" }), _jsx("input", { type: "range", min: "0", max: "255", value: currentValues.tilt, onChange: (e) => handleMovementChange('tilt', parseInt(e.target.value)), className: styles.slider }), _jsx("span", { className: styles.value, children: currentValues.tilt })] }))] }), "                  ", _jsxs("div", { className: styles.movementPresets, children: [_jsx("button", { className: styles.actionButton, onClick: centerMovement, title: "Center Position", children: "\uD83C\uDFAF Center" }), _jsx("button", { className: styles.actionButton, onClick: () => {
                                                    handleMovementChange('pan', 0);
                                                    handleMovementChange('tilt', 0);
                                                }, title: "Home Position", children: "\uD83C\uDFE0 Home" })] })] }))] }))] })) : (_jsx("div", { className: styles.noFixture, children: selectedFixture ? (_jsx("p", { children: "No compatible channels found" })) : compatibleFixtures.length > 0 ? (_jsx("p", { children: "Select a fixture above" })) : (_jsx("p", { children: "No compatible fixtures" })) }))] }));
};
