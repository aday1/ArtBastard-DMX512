import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import styles from './ColorPickerPanel.module.scss';
import { ColorPicker } from './ColorPicker';
import { useStore } from '../../store';
export const ColorPickerPanel = () => {
    const [selectedFixture, setSelectedFixture] = useState(null);
    const fixtures = useStore((state) => state.fixtures);
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
    // Check if a fixture has RGB or Pan/Tilt channels
    const hasColorOrMovementControls = (fixture) => {
        const hasRGB = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
        const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
        return hasRGB || hasMovement;
    };
    // Filter fixtures that have RGB or movement controls
    const compatibleFixtures = fixtures.filter(hasColorOrMovementControls);
    // Auto-select the first fixture if none selected and compatible fixtures exist
    useEffect(() => {
        if (!selectedFixture && compatibleFixtures.length > 0) {
            setSelectedFixture(compatibleFixtures[0].id);
        }
    }, [selectedFixture, compatibleFixtures]);
    // Get the channels for the currently selected fixture
    const { rgbChannels, movementChannels } = selectedFixture ?
        getFixtureChannels(selectedFixture) :
        { rgbChannels: {}, movementChannels: {} };
    // Check if the selected fixture has any compatible channels
    const hasCompatibleChannels = Object.keys(rgbChannels).length > 0 || Object.keys(movementChannels).length > 0;
    const { theme } = useStore((state) => ({ theme: state.theme }));
    return (_jsxs("div", { className: styles.colorPickerPanel, children: [_jsxs("div", { className: styles.header, children: [_jsxs("h3", { className: styles.title, children: [theme === 'artsnob' && '🎨 Chromatic Energy Manipulator', theme === 'standard' && 'Color & Movement Control', theme === 'minimal' && 'Color & Movement'] }), _jsxs("div", { className: styles.fixtureSelector, children: [_jsxs("label", { children: [theme === 'artsnob' && 'Select Illumination Vessel:', theme === 'standard' && 'Select Fixture:', theme === 'minimal' && 'Fixture:'] }), _jsxs("select", { value: selectedFixture || '', onChange: (e) => setSelectedFixture(e.target.value), children: [_jsx("option", { value: "", children: "-- Select a fixture --" }), compatibleFixtures.map((fixture) => (_jsx("option", { value: fixture.id, children: fixture.name }, fixture.id)))] })] })] }), selectedFixture ? (hasCompatibleChannels ? (_jsx(ColorPicker, { fixtureId: selectedFixture, rgbChannels: rgbChannels, movementChannels: movementChannels })) : (_jsx("div", { className: styles.noCompatibleChannels, children: "This fixture does not have RGB or Pan/Tilt channels configured." }))) : (_jsx("div", { className: styles.noFixtureSelected, children: compatibleFixtures.length > 0 ? (_jsx("p", { children: "Please select a fixture to control its colors and movement." })) : (_jsxs("div", { children: [_jsx("p", { children: "No compatible fixtures found." }), _jsx("p", { className: styles.hint, children: "Create a fixture with RGB or Pan/Tilt channels first." })] })) }))] }));
};
