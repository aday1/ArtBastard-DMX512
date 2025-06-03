import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../../store'; // Import PlacedFixture
import useStoreUtils from '../../store/storeUtils';
import { useTheme } from '../../context/ThemeContext';
// import { FixtureVisualizer3D } from './FixtureVisualizer3D' // Removed
import { FixtureCanvas2D } from './FixtureCanvas2D'; // Added
import { CanvasImageUpload } from './CanvasImageUpload'; // Added
import styles from './FixtureSetup.module.scss';
// PlacedFixtureOnSetup type is no longer needed here, will use PlacedFixture from store
import { MidiLearnButton } from '../midi/MidiLearnButton'; // Import MidiLearnButton
const channelTypes = [
    { value: 'dimmer', label: 'Dimmer/Intensity' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'pan', label: 'Pan' },
    { value: 'tilt', label: 'Tilt' },
    { value: 'gobo', label: 'Gobo' },
    { value: 'other', label: 'Other' }
];
// Define Fixture Templates
const fixtureTemplates = [
    {
        templateName: 'Simple Par Can (RGB + Dimmer)',
        defaultNamePrefix: 'RGBD Par',
        channels: [
            { name: 'Red', type: 'red' },
            { name: 'Green', type: 'green' },
            { name: 'Blue', type: 'blue' },
            { name: 'Dimmer', type: 'dimmer' },
        ],
    },
    {
        templateName: 'Moving Head Spot (Basic)',
        defaultNamePrefix: 'Basic Mover',
        channels: [
            { name: 'Pan', type: 'pan' },
            { name: 'Tilt', type: 'tilt' },
            { name: 'Dimmer', type: 'dimmer' },
            { name: 'Gobo Wheel', type: 'gobo' },
            { name: 'Color Wheel', type: 'other' },
        ],
    },
    {
        templateName: 'Generic Dimmer',
        defaultNamePrefix: 'Dimmer',
        channels: [{ name: 'Intensity', type: 'dimmer' }],
    },
    {
        templateName: 'RGBW Par Can',
        defaultNamePrefix: 'RGBW Par',
        channels: [
            { name: 'Red', type: 'red' },
            { name: 'Green', type: 'green' },
            { name: 'Blue', type: 'blue' },
            { name: 'White', type: 'other' },
            { name: 'Dimmer', type: 'dimmer' },
        ],
    },
];
export const FixtureSetup = () => {
    const { theme } = useTheme();
    const { fixtures, fixtureLayout, setFixtureLayout, canvasBackgroundImage, setCanvasBackgroundImage } = useStore(state => ({
        fixtures: state.fixtures,
        fixtureLayout: state.fixtureLayout,
        setFixtureLayout: state.setFixtureLayout,
        canvasBackgroundImage: state.canvasBackgroundImage,
        setCanvasBackgroundImage: state.setCanvasBackgroundImage,
    }));
    const groups = useStore(state => state.groups);
    const [showCreateFixture, setShowCreateFixture] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [fixtureForm, setFixtureForm] = useState({
        name: '',
        startAddress: 1,
        channels: [{ name: 'Intensity', type: 'dimmer' }]
    });
    const [groupForm, setGroupForm] = useState({
        name: '',
        fixtureIndices: []
    });
    const calculateNextStartAddress = () => {
        if (fixtures.length === 0)
            return 1;
        // Ensure addresses are numbers and positive before using Math.max
        const lastAddresses = fixtures.map(f => (f.startAddress || 1) + (f.channels?.length || 0));
        return Math.max(1, ...lastAddresses.map(addr => Math.max(1, addr)));
    };
    // Handle fixture form changes
    const handleFixtureChange = (key, value) => {
        setFixtureForm(prev => ({ ...prev, [key]: value }));
    };
    // Handle channel changes
    const handleChannelChange = (index, key, value) => {
        const updatedChannels = [...fixtureForm.channels];
        updatedChannels[index] = { ...updatedChannels[index], [key]: value };
        setFixtureForm(prev => ({ ...prev, channels: updatedChannels }));
    };
    // Add a new channel to the fixture
    const addChannel = () => {
        setFixtureForm(prev => ({
            ...prev,
            channels: [...prev.channels, { name: `Channel ${prev.channels.length + 1}`, type: 'other' }]
        }));
    };
    // Remove a channel from the fixture
    const removeChannel = (index) => {
        setFixtureForm(prev => ({
            ...prev,
            channels: prev.channels.filter((_, i) => i !== index)
        }));
    };
    // Save fixture to store
    const saveFixture = () => {
        const newFixture = {
            name: fixtureForm.name,
            startAddress: fixtureForm.startAddress,
            channels: fixtureForm.channels
        };
        useStoreUtils.setState(state => ({
            fixtures: [...state.fixtures, newFixture]
        }));
        // Reset form and hide it
        setFixtureForm({
            name: '',
            startAddress: fixtures.length > 0
                ? Math.max(...fixtures.map(f => f.startAddress + f.channels.length)) + 1
                : 1,
            channels: [{ name: 'Intensity', type: 'dimmer' }]
        });
        setShowCreateFixture(false);
        // Show success message
        useStoreUtils.getState().addNotification({
            message: `Fixture "${newFixture.name}" created`,
            type: 'success',
            priority: 'normal'
        });
    };
    // Toggle fixture selection for group
    const toggleFixtureForGroup = (index) => {
        setGroupForm(prev => {
            const isSelected = prev.fixtureIndices.includes(index);
            return {
                ...prev,
                fixtureIndices: isSelected
                    ? prev.fixtureIndices.filter(i => i !== index)
                    : [...prev.fixtureIndices, index]
            };
        });
    };
    // Save group to store
    const saveGroup = () => {
        const newGroup = {
            name: groupForm.name,
            fixtureIndices: [...groupForm.fixtureIndices]
        };
        useStoreUtils.setState(state => ({
            groups: [...state.groups, newGroup]
        }));
        // Reset form and hide it
        setGroupForm({
            name: '',
            fixtureIndices: []
        });
        setShowCreateGroup(false);
        // Show success message
        useStoreUtils.getState().addNotification({
            message: `Group "${newGroup.name}" created`,
            type: 'success',
            priority: 'normal'
        });
    };
    return (_jsxs("div", { className: styles.fixtureSetup, children: [_jsxs("h2", { className: styles.sectionTitle, children: [theme === 'artsnob' && 'Fixture Composition: The Architecture of Light', theme === 'standard' && 'Fixture Setup', theme === 'minimal' && 'Fixtures', "      "] }), _jsx(CanvasImageUpload, { onImageUploaded: setCanvasBackgroundImage, currentImage: canvasBackgroundImage }), _jsx(FixtureCanvas2D, { fixtures: fixtures, placedFixturesData: fixtureLayout, onUpdatePlacedFixtures: setFixtureLayout }), _jsxs("div", { className: styles.setupGrid, children: [_jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Existing Fixtures: The Gallery of Light Instruments', theme === 'standard' && 'Fixtures', theme === 'minimal' && 'Fixtures'] }) }), _jsxs("div", { className: styles.cardBody, children: [fixtures.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-lightbulb" }), _jsx("p", { children: "No fixtures have been created yet" })] })) : (_jsx("div", { className: styles.fixtureList, children: fixtures.map((fixture, index) => (_jsxs("div", { className: styles.fixtureItem, children: [_jsxs("div", { className: styles.fixtureHeader, children: [_jsx("h4", { children: fixture.name }), _jsxs("span", { className: styles.fixtureDmx, children: ["DMX: ", fixture.startAddress, "-", fixture.startAddress + fixture.channels.length - 1] })] }), _jsx("div", { className: styles.fixtureChannels, children: fixture.channels.map((channel, chIndex) => (_jsx("div", { className: styles.channelTag, children: _jsx("span", { className: `${styles.channelType} ${styles[channel.type]}`, children: channel.name }) }, chIndex))) })] }, index))) })), showCreateFixture ? (_jsxs("div", { className: styles.fixtureForm, children: [_jsxs("h4", { children: [theme === 'artsnob' && 'Create New Fixture: Birth of a Light Vessel', theme === 'standard' && 'New Fixture', theme === 'minimal' && 'New Fixture'] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "fixtureName", children: "Name:" }), _jsx("input", { type: "text", id: "fixtureName", value: fixtureForm.name, onChange: (e) => handleFixtureChange('name', e.target.value), placeholder: "Enter fixture name" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "fixtureStartAddress", children: "Start Address:" }), _jsx("input", { type: "number", id: "fixtureStartAddress", value: fixtureForm.startAddress, onChange: (e) => handleFixtureChange('startAddress', parseInt(e.target.value) || 1), min: "1", max: "512" })] }), _jsxs("h5", { children: [theme === 'artsnob' && 'Channels: The Dimensions of Control', theme === 'standard' && 'Channels', theme === 'minimal' && 'Channels'] }), _jsx("div", { className: styles.channelsList, children: fixtureForm.channels.map((channel, index) => (_jsxs("div", { className: styles.channelForm, children: [_jsxs("div", { className: styles.channelFormRow, children: [_jsx("input", { type: "text", value: channel.name, onChange: (e) => handleChannelChange(index, 'name', e.target.value), placeholder: "Channel name" }), _jsx("select", { value: channel.type, onChange: (e) => handleChannelChange(index, 'type', e.target.value), children: channelTypes.map(type => (_jsx("option", { value: type.value, children: type.label }, type.value))) }), _jsx("button", { className: styles.removeButton, onClick: () => removeChannel(index), disabled: fixtureForm.channels.length === 1, title: "Remove channel", children: _jsx("i", { className: "fas fa-times" }) })] }), _jsxs("div", { className: styles.channelDmxInfo, children: [_jsxs("span", { className: styles.dmxAddressLabel, children: ["DMX: ", fixtureForm.startAddress + index] }), _jsx(MidiLearnButton, { channelIndex: fixtureForm.startAddress + index - 1, className: styles.channelMidiLearnButton })] })] }, index))) }), _jsxs("div", { className: styles.formActions, children: [_jsxs("button", { className: styles.addChannelButton, onClick: addChannel, children: [_jsx("i", { className: "fas fa-plus" }), " Add Channel"] }), _jsxs("div", { className: styles.saveActions, children: [_jsx("button", { className: styles.cancelButton, onClick: () => setShowCreateFixture(false), children: "Cancel" }), _jsxs("button", { className: styles.saveButton, onClick: saveFixture, disabled: !fixtureForm.name || fixtureForm.channels.length === 0, children: [_jsx("i", { className: "fas fa-save" }), theme === 'artsnob' && 'Immortalize Fixture', theme === 'standard' && 'Save Fixture', theme === 'minimal' && 'Save'] })] })] })] })) : (_jsxs("button", { className: styles.createButton, onClick: () => {
                                            setFixtureForm({
                                                name: '',
                                                startAddress: calculateNextStartAddress(),
                                                channels: [{ name: 'Intensity', type: 'dimmer' }]
                                            });
                                            setShowCreateFixture(true);
                                        }, children: [_jsx("i", { className: "fas fa-plus" }), theme === 'artsnob' && 'Craft Custom Fixture', theme === 'standard' && 'Add Custom Fixture', theme === 'minimal' && 'Custom'] })), !showCreateFixture && (_jsxs("div", { className: styles.templateSection, children: [_jsx("h4", { className: styles.templateTitle, children: theme === 'artsnob' ? 'Or, select an archetype:' :
                                                    theme === 'standard' ? 'Create from template:' : 'Templates:' }), _jsx("div", { className: styles.templateButtons, children: fixtureTemplates.map(template => (_jsx("button", { className: styles.templateButton, onClick: () => {
                                                        const nextAddress = calculateNextStartAddress();
                                                        const existingNames = fixtures.map(f => f.name);
                                                        let suggestedName = template.defaultNamePrefix;
                                                        let counter = 1;
                                                        while (existingNames.includes(suggestedName)) {
                                                            suggestedName = `${template.defaultNamePrefix} ${counter++}`;
                                                        }
                                                        setFixtureForm({
                                                            name: suggestedName,
                                                            startAddress: nextAddress,
                                                            // Deep copy channels to prevent modifying template array
                                                            channels: JSON.parse(JSON.stringify(template.channels))
                                                        });
                                                        setShowCreateFixture(true);
                                                    }, children: template.templateName }, template.templateName))) })] }))] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Fixture Groups: The Constellations of Light', theme === 'standard' && 'Groups', theme === 'minimal' && 'Groups'] }) }), _jsxs("div", { className: styles.cardBody, children: [groups.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-object-group" }), _jsx("p", { children: "No groups have been created yet" })] })) : (_jsx("div", { className: styles.groupList, children: groups.map((group, index) => (_jsxs("div", { className: styles.groupItem, children: [_jsxs("div", { className: styles.groupHeader, children: [_jsx("h4", { children: group.name }), _jsxs("span", { className: styles.groupCount, children: [group.fixtureIndices.length, " fixture", group.fixtureIndices.length !== 1 ? 's' : ''] })] }), _jsx("div", { className: styles.groupFixtures, children: group.fixtureIndices.map(fixtureIndex => (_jsx("div", { className: styles.groupFixtureTag, children: fixtures[fixtureIndex]?.name || `Fixture #${fixtureIndex}` }, fixtureIndex))) })] }, index))) })), showCreateGroup ? (_jsxs("div", { className: styles.groupForm, children: [_jsxs("h4", { children: [theme === 'artsnob' && 'Create Fixture Group: The Collective Expression', theme === 'standard' && 'New Group', theme === 'minimal' && 'New Group'] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "groupName", children: "Name:" }), _jsx("input", { type: "text", id: "groupName", value: groupForm.name, onChange: (e) => setGroupForm(prev => ({ ...prev, name: e.target.value })), placeholder: "Enter group name" })] }), _jsxs("h5", { children: [theme === 'artsnob' && 'Select Fixtures: Choose Your Instruments', theme === 'standard' && 'Select Fixtures', theme === 'minimal' && 'Fixtures'] }), fixtures.length === 0 ? (_jsx("p", { className: styles.noFixturesMessage, children: "No fixtures available to add to group" })) : (_jsx("div", { className: styles.fixtureSelection, children: fixtures.map((fixture, index) => (_jsxs("div", { className: `${styles.selectableFixture} ${groupForm.fixtureIndices.includes(index) ? styles.selected : ''}`, onClick: () => toggleFixtureForGroup(index), children: [_jsx("div", { className: styles.fixtureCheckbox, children: _jsx("input", { type: "checkbox", checked: groupForm.fixtureIndices.includes(index), onChange: () => { }, onClick: (e) => e.stopPropagation() }) }), _jsxs("div", { className: styles.fixtureInfo, children: [_jsx("span", { className: styles.fixtureName, children: fixture.name }), _jsxs("span", { className: styles.fixtureDmx, children: ["DMX: ", fixture.startAddress, "-", fixture.startAddress + fixture.channels.length - 1] })] })] }, index))) })), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { className: styles.cancelButton, onClick: () => setShowCreateGroup(false), children: "Cancel" }), _jsxs("button", { className: styles.saveButton, onClick: saveGroup, disabled: !groupForm.name || groupForm.fixtureIndices.length === 0, children: [_jsx("i", { className: "fas fa-save" }), theme === 'artsnob' && 'Establish Collective', theme === 'standard' && 'Save Group', theme === 'minimal' && 'Save'] })] })] })) : (_jsxs("button", { className: styles.createButton, onClick: () => setShowCreateGroup(true), disabled: fixtures.length === 0, children: [_jsx("i", { className: "fas fa-plus" }), theme === 'artsnob' && 'Create Fixture Group', theme === 'standard' && 'Add Group', theme === 'minimal' && 'Add'] }))] })] })] })] }));
};
