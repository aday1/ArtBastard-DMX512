import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../../store'; // Import PlacedFixture and Group
import useStoreUtils from '../../store/storeUtils';
import { useTheme } from '../../context/ThemeContext';
// import { FixtureVisualizer3D } from './FixtureVisualizer3D' // Removed
import { FixtureCanvas2D } from './FixtureCanvas2D'; // Added
import { CanvasImageUpload } from './CanvasImageUpload'; // Added
import { ColorPickerPanel } from './ColorPickerPanel'; // Added ColorPickerPanel
import { LucideIcon } from '../ui/LucideIcon'; // Added for icons
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
    const { fixtures, fixtureLayout, setFixtureLayout, canvasBackgroundImage, setCanvasBackgroundImage, addFixtureFlag, removeFixtureFlag, bulkAddFlag, bulkRemoveFlag, createQuickFlag, getFixturesByFlag, getFixturesByFlagCategory } = useStore(state => ({
        fixtures: state.fixtures,
        fixtureLayout: state.fixtureLayout,
        setFixtureLayout: state.setFixtureLayout,
        canvasBackgroundImage: state.canvasBackgroundImage,
        setCanvasBackgroundImage: state.setCanvasBackgroundImage,
        addFixtureFlag: state.addFixtureFlag,
        removeFixtureFlag: state.removeFixtureFlag,
        bulkAddFlag: state.bulkAddFlag,
        bulkRemoveFlag: state.bulkRemoveFlag,
        createQuickFlag: state.createQuickFlag,
        getFixturesByFlag: state.getFixturesByFlag,
        getFixturesByFlagCategory: state.getFixturesByFlagCategory
    }));
    const groups = useStore(state => state.groups);
    const [showCreateFixture, setShowCreateFixture] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [editingFixtureId, setEditingFixtureId] = useState(null);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [fixtureForm, setFixtureForm] = useState({
        name: '', startAddress: 1,
        channels: [{ name: 'Intensity', type: 'dimmer' }]
    });
    const [groupForm, setGroupForm] = useState({
        name: '',
        fixtureIndices: [],
        lastStates: new Array(512).fill(0),
        isMuted: false,
        isSolo: false,
        masterValue: 255
    });
    // Multi-select functionality state
    const [selectedFixtures, setSelectedFixtures] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedSelection, setShowAdvancedSelection] = useState(false);
    const [showFlagPanel, setShowFlagPanel] = useState(false);
    const [newFlagName, setNewFlagName] = useState('');
    const [newFlagColor, setNewFlagColor] = useState('#ff6b6b');
    const [newFlagCategory, setNewFlagCategory] = useState('');
    // Filter fixtures based on search term
    const filteredFixtures = fixtures.filter(fixture => fixture.name.toLowerCase().includes(searchTerm.toLowerCase()));
    // Keyboard shortcuts for multi-select operations
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Only handle shortcuts when not typing in an input field
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }
            // Ctrl/Cmd + A: Select All
            if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
                event.preventDefault();
                selectAll();
                return;
            }
            // Ctrl/Cmd + D: Deselect All
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                deselectAll();
                return;
            }
            // Ctrl/Cmd + I: Invert Selection
            if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
                event.preventDefault();
                invertSelection();
                return;
            }
            // Escape: Clear search and close panels
            if (event.key === 'Escape') {
                setSearchTerm('');
                setShowAdvancedSelection(false);
                setShowFlagPanel(false);
                return;
            }
            // Ctrl/Cmd + F: Focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                event.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search"]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
                return;
            } // Delete: Delete selected fixtures
            if (event.key === 'Delete' && selectedFixtures.length > 0) {
                event.preventDefault();
                if (window.confirm(`Delete ${selectedFixtures.length} selected fixture(s)?`)) {
                    selectedFixtures.forEach(fixtureId => {
                        deleteFixture(fixtureId);
                    });
                    setSelectedFixtures([]);
                }
                return;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedFixtures, filteredFixtures]);
    // Multi-select functionality functions
    const selectAll = () => {
        setSelectedFixtures(filteredFixtures.map(f => f.id));
    };
    const deselectAll = () => {
        setSelectedFixtures([]);
    };
    const invertSelection = () => {
        const allIds = filteredFixtures.map(f => f.id);
        const newSelection = allIds.filter(id => !selectedFixtures.includes(id));
        setSelectedFixtures(newSelection);
    };
    const selectByType = (fixtureType) => {
        const typeFixtures = filteredFixtures.filter(fixture => {
            switch (fixtureType) {
                case 'rgb':
                    return fixture.channels.some(ch => ch.type === 'red') &&
                        fixture.channels.some(ch => ch.type === 'green') &&
                        fixture.channels.some(ch => ch.type === 'blue');
                case 'movement':
                    return fixture.channels.some(ch => ch.type === 'pan') ||
                        fixture.channels.some(ch => ch.type === 'tilt');
                case 'dimmer':
                    return fixture.channels.some(ch => ch.type === 'dimmer');
                default:
                    return false;
            }
        });
        setSelectedFixtures(typeFixtures.map(f => f.id));
    };
    const selectSimilar = () => {
        if (selectedFixtures.length === 0)
            return;
        const referenceFixture = fixtures.find(f => f.id === selectedFixtures[0]);
        if (!referenceFixture)
            return;
        const referenceChannelTypes = referenceFixture.channels.map(ch => ch.type).sort();
        const similarFixtures = filteredFixtures.filter(fixture => {
            const channelTypes = fixture.channels.map(ch => ch.type).sort();
            return JSON.stringify(channelTypes) === JSON.stringify(referenceChannelTypes);
        });
        setSelectedFixtures(similarFixtures.map(f => f.id));
    };
    const selectByFlag = (flagId) => {
        const flaggedFixtures = getFixturesByFlag(flagId);
        setSelectedFixtures(flaggedFixtures.map(f => f.id));
    };
    const selectByFlagCategory = (category) => {
        const flaggedFixtures = getFixturesByFlagCategory(category);
        setSelectedFixtures(flaggedFixtures.map(f => f.id));
    };
    const selectAllFlagged = () => {
        const flaggedFixtures = filteredFixtures.filter(f => f.isFlagged);
        setSelectedFixtures(flaggedFixtures.map(f => f.id));
    };
    // Flag management functions
    const createAndApplyFlag = () => {
        if (!newFlagName.trim() || selectedFixtures.length === 0)
            return;
        const flag = createQuickFlag(newFlagName.trim(), newFlagColor, newFlagCategory.trim() || undefined);
        bulkAddFlag(selectedFixtures, flag);
        // Reset form
        setNewFlagName('');
        setNewFlagColor('#ff6b6b');
        setNewFlagCategory('');
        setShowFlagPanel(false);
    };
    const getAllUniqueFlags = () => {
        const flagMap = new Map();
        fixtures.forEach(fixture => {
            if (fixture.flags) {
                fixture.flags.forEach(flag => {
                    flagMap.set(flag.id, flag);
                });
            }
        });
        return Array.from(flagMap.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    };
    // Get all unique categories
    const getAllUniqueCategories = () => {
        const categories = new Set();
        fixtures.forEach(fixture => {
            if (fixture.flags) {
                fixture.flags.forEach(flag => {
                    if (flag.category) {
                        categories.add(flag.category);
                    }
                });
            }
        });
        return Array.from(categories).sort();
    };
    // Remove all flags from selected fixtures
    const removeSelectedFixtureFlags = () => {
        selectedFixtures.forEach(fixtureId => {
            const fixture = fixtures.find(f => f.id === fixtureId);
            if (fixture && fixture.flags) {
                fixture.flags.forEach(flag => {
                    removeFixtureFlag(fixtureId, flag.id);
                });
            }
        });
    };
    // Helper functions for form management
    const selectedFixtureName = () => {
        if (selectedFixtures.length === 0)
            return 'No fixtures selected';
        if (selectedFixtures.length === 1) {
            const fixture = fixtures.find(f => f.id === selectedFixtures[0]);
            return fixture?.name || 'Unknown';
        }
        return `${selectedFixtures.length} fixtures selected`;
    };
    const toggleFixtureSelection = (fixtureId) => {
        setSelectedFixtures(prevSelected => prevSelected.includes(fixtureId)
            ? prevSelected.filter(id => id !== fixtureId)
            : [...prevSelected, fixtureId]);
    };
    const calculateNextStartAddress = () => {
        if (fixtures.length === 0)
            return 1;
        // Ensure addresses are numbers and positive before using Math.max
        const lastAddresses = fixtures.map(f => (f.startAddress || 1) + (f.channels?.length || 0));
        return Math.max(1, ...lastAddresses.map(addr => Math.max(1, addr)));
    };
    // Check for DMX address conflicts
    const checkDmxConflict = (startAddress, channelCount, excludeFixtureId) => {
        const endAddress = startAddress + channelCount - 1;
        for (const fixture of fixtures) {
            // Skip the fixture we're editing
            if (excludeFixtureId && fixture.id === excludeFixtureId)
                continue;
            const fixtureEnd = fixture.startAddress + fixture.channels.length - 1;
            // Check if ranges overlap
            if (!(endAddress < fixture.startAddress || startAddress > fixtureEnd)) {
                return `Conflicts with "${fixture.name}" (DMX ${fixture.startAddress}-${fixtureEnd})`;
            }
        }
        return null; // No conflict
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
        if (editingFixtureId) {
            // Update existing fixture
            updateFixture();
        }
        else {
            // Create new fixture
            createFixture();
        }
    };
    // Create new fixture
    const createFixture = () => {
        // Validate DMX address conflict
        const conflict = checkDmxConflict(fixtureForm.startAddress, fixtureForm.channels.length);
        if (conflict) {
            useStoreUtils.getState().addNotification({
                message: `Cannot create fixture: ${conflict}`,
                type: 'error',
                priority: 'high'
            });
            return;
        }
        const newFixture = {
            id: `fixture-${Date.now()}-${Math.random()}`,
            name: fixtureForm.name,
            startAddress: fixtureForm.startAddress,
            channels: fixtureForm.channels
        };
        useStoreUtils.setState(state => ({
            fixtures: [...state.fixtures, newFixture]
        }));
        resetForm();
        // Show success message
        useStoreUtils.getState().addNotification({
            message: `Fixture "${newFixture.name}" created`,
            type: 'success',
            priority: 'normal'
        });
    };
    // Update existing fixture
    const updateFixture = () => {
        if (!editingFixtureId)
            return;
        // Validate DMX address conflict (exclude current fixture from check)
        const conflict = checkDmxConflict(fixtureForm.startAddress, fixtureForm.channels.length, editingFixtureId);
        if (conflict) {
            useStoreUtils.getState().addNotification({
                message: `Cannot update fixture: ${conflict}`,
                type: 'error',
                priority: 'high'
            });
            return;
        }
        const updatedFixture = {
            id: editingFixtureId,
            name: fixtureForm.name,
            startAddress: fixtureForm.startAddress,
            channels: fixtureForm.channels
        };
        useStoreUtils.setState(state => ({
            fixtures: state.fixtures.map(f => f.id === editingFixtureId ? updatedFixture : f)
        }));
        resetForm();
        // Show success message
        useStoreUtils.getState().addNotification({
            message: `Fixture "${updatedFixture.name}" updated`,
            type: 'success',
            priority: 'normal'
        });
    };
    // Start editing a fixture
    const startEditFixture = (fixture) => {
        setEditingFixtureId(fixture.id);
        setFixtureForm({
            name: fixture.name,
            startAddress: fixture.startAddress,
            channels: [...fixture.channels] // Create a copy to avoid direct mutation
        });
        setShowCreateFixture(true);
    };
    // Delete a fixture
    const deleteFixture = (fixtureId) => {
        const fixture = fixtures.find(f => f.id === fixtureId);
        if (!fixture)
            return;
        if (window.confirm(`Are you sure you want to delete "${fixture.name}"?`)) {
            useStoreUtils.setState(state => ({
                fixtures: state.fixtures.filter(f => f.id !== fixtureId)
            }));
            // Show success message
            useStoreUtils.getState().addNotification({
                message: `Fixture "${fixture.name}" deleted`,
                type: 'success',
                priority: 'normal'
            });
        }
    };
    // Reset form and close it
    const resetForm = () => {
        setFixtureForm({
            name: '',
            startAddress: fixtures.length > 0
                ? Math.max(...fixtures.map(f => f.startAddress + f.channels.length)) + 1
                : 1,
            channels: [{ name: 'Intensity', type: 'dimmer' }]
        });
        setShowCreateFixture(false);
        setEditingFixtureId(null);
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
            id: `group-${Date.now()}-${Math.random()}`,
            name: groupForm.name,
            fixtureIndices: [...groupForm.fixtureIndices],
            lastStates: new Array(512).fill(0),
            isMuted: false,
            isSolo: false,
            masterValue: 255,
            position: undefined
        };
        useStoreUtils.setState(state => ({
            groups: [...state.groups, newGroup]
        }));
        setGroupForm({
            name: '',
            fixtureIndices: [],
            lastStates: new Array(512).fill(0),
            isMuted: false,
            isSolo: false,
            masterValue: 255
        });
        setShowCreateGroup(false);
        useStoreUtils.getState().addNotification({
            message: `Group "${newGroup.name}" created`,
            type: 'success',
            priority: 'normal'
        });
    };
    // Delete a group
    const deleteGroup = (group) => {
        if (window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
            useStoreUtils.setState(state => ({
                groups: state.groups.filter(g => g.id !== group.id)
            }));
            useStoreUtils.getState().addNotification({
                message: `Group "${group.name}" deleted`,
                type: 'success',
                priority: 'normal'
            });
        }
    };
    // Start editing a group
    const startEditGroup = (group) => {
        setGroupForm({
            name: group.name,
            fixtureIndices: [...group.fixtureIndices],
            lastStates: new Array(512).fill(0),
            isMuted: false,
            isSolo: false,
            masterValue: 255
        });
        setEditingGroupId(group.id);
        setShowCreateGroup(true);
    };
    // Update existing group
    const updateGroup = () => {
        if (!editingGroupId)
            return;
        const updatedGroup = {
            id: editingGroupId,
            name: groupForm.name,
            fixtureIndices: [...groupForm.fixtureIndices],
            lastStates: new Array(512).fill(0),
            isMuted: false,
            isSolo: false,
            masterValue: 255
        };
        setShowCreateGroup(false);
        setEditingGroupId(null);
        useStoreUtils.getState().addNotification({
            message: `Group "${updatedGroup.name}" updated`,
            type: 'success',
            priority: 'normal'
        });
    };
    return (_jsxs("div", { className: styles.fixtureSetup, children: [_jsxs("h2", { className: styles.sectionTitle, children: [theme === 'artsnob' && 'Fixture Composition: The Architecture of Light', theme === 'standard' && 'Fixture Setup', theme === 'minimal' && 'Fixtures', "      "] }), _jsx(CanvasImageUpload, { onImageUploaded: setCanvasBackgroundImage, currentImage: canvasBackgroundImage }), _jsx(FixtureCanvas2D, { fixtures: fixtures, placedFixturesData: fixtureLayout, onUpdatePlacedFixtures: setFixtureLayout }), _jsx("div", { className: styles.colorPickerContainer, children: _jsx(ColorPickerPanel, {}) }), _jsxs("div", { className: styles.setupGrid, children: ["        ", _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Existing Fixtures: The Gallery of Light Instruments', theme === 'standard' && 'Fixtures', theme === 'minimal' && 'Fixtures'] }) }), _jsxs("div", { className: styles.cardBody, children: [fixtures.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-lightbulb" }), _jsx("p", { children: "No fixtures have been created yet" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.searchSection, children: _jsxs("div", { className: styles.searchContainer, children: [_jsx(LucideIcon, { name: "Search" }), _jsx("input", { type: "text", placeholder: "Search fixtures...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: styles.searchInput }), searchTerm && (_jsx("button", { onClick: () => setSearchTerm(''), className: styles.clearSearch, children: _jsx(LucideIcon, { name: "X" }) }))] }) }), selectedFixtures.length > 0 && (_jsxs("div", { className: styles.selectionSummary, children: [_jsx("div", { className: styles.summaryText, children: _jsxs("span", { children: [selectedFixtures.length, " of ", filteredFixtures.length, " selected"] }) }), _jsx("div", { className: styles.summaryActions, children: _jsx("button", { onClick: deselectAll, className: styles.summaryButton, title: "Clear selection", children: _jsx(LucideIcon, { name: "X" }) }) })] })), _jsxs("div", { className: styles.bulkControls, children: [_jsxs("button", { className: styles.bulkButton, onClick: selectAll, title: "Select all visible fixtures", children: [_jsx(LucideIcon, { name: "CheckSquare" }), _jsx("span", { children: "All" })] }), _jsxs("button", { className: styles.bulkButton, onClick: invertSelection, title: "Invert selection", children: [_jsx(LucideIcon, { name: "RotateCcw" }), _jsx("span", { children: "Invert" })] }), _jsxs("button", { className: styles.bulkButton, onClick: () => setShowAdvancedSelection(!showAdvancedSelection), title: "Advanced selection", children: [_jsx(LucideIcon, { name: "Filter" }), _jsx("span", { children: "Smart" })] }), _jsxs("button", { className: styles.bulkButton, onClick: () => setShowFlagPanel(!showFlagPanel), title: "Flag management", children: [_jsx(LucideIcon, { name: "Tag" }), _jsx("span", { children: "Flags" })] })] }), showAdvancedSelection && (_jsxs("div", { className: styles.advancedSelection, children: [_jsxs("div", { className: styles.selectionByType, children: [_jsx("h4", { children: "Select by Type:" }), _jsxs("div", { className: styles.typeButtons, children: [_jsxs("button", { onClick: () => selectByType('rgb'), className: styles.typeButton, children: [_jsx(LucideIcon, { name: "Palette" }), "RGB"] }), _jsxs("button", { onClick: () => selectByType('movement'), className: styles.typeButton, children: [_jsx(LucideIcon, { name: "Move" }), "Movement"] }), _jsxs("button", { onClick: () => selectByType('dimmer'), className: styles.typeButton, children: [_jsx(LucideIcon, { name: "Sun" }), "Dimmer"] })] })] }), _jsxs("div", { className: styles.smartSelection, children: [_jsxs("button", { onClick: selectSimilar, disabled: selectedFixtures.length === 0, className: styles.smartButton, children: [_jsx(LucideIcon, { name: "Copy" }), "Select Similar"] }), _jsxs("button", { onClick: selectAllFlagged, className: styles.smartButton, children: [_jsx(LucideIcon, { name: "Flag" }), "All Flagged"] })] })] })), showFlagPanel && (_jsxs("div", { className: styles.flagPanel, children: [_jsxs("div", { className: styles.flagCreation, children: [_jsx("input", { type: "text", placeholder: "Flag name", value: newFlagName, onChange: (e) => setNewFlagName(e.target.value), className: styles.flagInput }), _jsx("input", { type: "color", value: newFlagColor, onChange: (e) => setNewFlagColor(e.target.value), className: styles.colorInput }), _jsx("input", { type: "text", placeholder: "Category (optional)", value: newFlagCategory, onChange: (e) => setNewFlagCategory(e.target.value), className: styles.flagInput }), _jsx("button", { onClick: createAndApplyFlag, disabled: !newFlagName.trim() || selectedFixtures.length === 0, className: styles.createFlagButton, children: "Create & Apply" })] }), getAllUniqueFlags().length > 0 && (_jsxs("div", { className: styles.flagSelection, children: [_jsx("h4", { children: "Select by Flag:" }), getAllUniqueFlags().map((flag) => (_jsx("button", { onClick: () => selectByFlag(flag.id), className: styles.flagButton, style: { backgroundColor: flag.color }, children: flag.name }, flag.id)))] })), getAllUniqueCategories().length > 0 && (_jsxs("div", { className: styles.categorySelection, children: [_jsx("h4", { children: "Select by Category:" }), getAllUniqueCategories().map(category => (_jsx("button", { onClick: () => selectByFlagCategory(category), className: styles.categoryButton, children: category }, category)))] })), selectedFixtures.length > 0 && (_jsx("button", { onClick: removeSelectedFixtureFlags, className: styles.clearFlagsButton, children: "Clear Flags from Selected" }))] })), _jsx("div", { className: styles.fixtureList, children: filteredFixtures.length === 0 ? (_jsxs("div", { className: styles.noResults, children: [_jsx(LucideIcon, { name: "Search" }), _jsx("span", { children: "No fixtures found" })] })) : (filteredFixtures.map((fixture, index) => {
                                                    const isSelected = selectedFixtures.includes(fixture.id);
                                                    const hasRgb = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                                                    const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
                                                    const hasDimmer = fixture.channels.some(ch => ch.type === 'dimmer');
                                                    return (_jsxs("div", { className: `${styles.fixtureItem} ${isSelected ? styles.selected : ''}`, onClick: () => toggleFixtureSelection(fixture.id), children: [_jsx("div", { className: styles.fixtureCheckbox, children: _jsx("div", { className: `${styles.checkbox} ${isSelected ? styles.checked : ''}`, children: isSelected && _jsx(LucideIcon, { name: "Check" }) }) }), _jsxs("div", { className: styles.fixtureContent, children: [_jsxs("div", { className: styles.fixtureHeader, children: [_jsx("h4", { children: fixture.name }), _jsxs("div", { className: styles.fixtureActions, children: [_jsxs("span", { className: styles.fixtureDmx, children: ["DMX: ", fixture.startAddress, "-", fixture.startAddress + fixture.channels.length - 1] }), _jsxs("div", { className: styles.fixtureTypes, children: [hasRgb && _jsx("span", { className: styles.typeIndicator, title: "RGB", children: "\uD83C\uDFA8" }), hasMovement && _jsx("span", { className: styles.typeIndicator, title: "Movement", children: "\u2194\uFE0F" }), hasDimmer && _jsx("span", { className: styles.typeIndicator, title: "Dimmer", children: "\uD83D\uDCA1" })] }), _jsx("button", { className: styles.editButton, onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            startEditFixture(fixture);
                                                                                        }, title: "Edit fixture", children: _jsx("i", { className: "fas fa-edit" }) }), _jsx("button", { className: styles.deleteButton, onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            deleteFixture(fixture.id);
                                                                                        }, title: "Delete fixture", children: _jsx("i", { className: "fas fa-trash" }) })] })] }), _jsx("div", { className: styles.fixtureChannels, children: fixture.channels.map((channel, chIndex) => (_jsx("div", { className: styles.channelTag, children: _jsx("span", { className: `${styles.channelType} ${styles[channel.type]}`, children: channel.name }) }, chIndex))) }), fixture.flags && fixture.flags.length > 0 && (_jsx("div", { className: styles.fixtureFlags, children: fixture.flags.map((flag) => (_jsx("span", { className: styles.flagTag, style: { backgroundColor: flag.color }, title: flag.category ? `${flag.name} (${flag.category})` : flag.name, children: flag.name }, flag.id))) }))] })] }, fixture.id || index));
                                                })) })] })), showCreateFixture ? (_jsxs("div", { className: styles.fixtureForm, children: [_jsx("h4", { children: editingFixtureId ? (_jsxs(_Fragment, { children: [theme === 'artsnob' && 'Refine Fixture: Sculpting Light Anew', theme === 'standard' && 'Edit Fixture', theme === 'minimal' && 'Edit Fixture'] })) : (_jsxs(_Fragment, { children: [theme === 'artsnob' && 'Create New Fixture: Birth of a Light Vessel', theme === 'standard' && 'New Fixture', theme === 'minimal' && 'New Fixture'] })) }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "fixtureName", children: "Name:" }), _jsx("input", { type: "text", id: "fixtureName", value: fixtureForm.name, onChange: (e) => handleFixtureChange('name', e.target.value), placeholder: "Enter fixture name" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "fixtureStartAddress", children: "Start Address:" }), _jsx("input", { type: "number", id: "fixtureStartAddress", value: fixtureForm.startAddress, onChange: (e) => handleFixtureChange('startAddress', parseInt(e.target.value) || 1), min: "1", max: "512" })] }), _jsxs("h5", { children: [theme === 'artsnob' && 'Channels: The Dimensions of Control', theme === 'standard' && 'Channels', theme === 'minimal' && 'Channels'] }), _jsx("div", { className: styles.channelsList, children: fixtureForm.channels.map((channel, index) => (_jsxs("div", { className: styles.channelForm, children: [_jsxs("div", { className: styles.channelFormRow, children: [_jsx("input", { type: "text", value: channel.name, onChange: (e) => handleChannelChange(index, 'name', e.target.value), placeholder: "Channel name" }), _jsx("select", { value: channel.type, onChange: (e) => handleChannelChange(index, 'type', e.target.value), children: channelTypes.map(type => (_jsx("option", { value: type.value, children: type.label }, type.value))) }), _jsx("button", { className: styles.removeButton, onClick: () => removeChannel(index), disabled: fixtureForm.channels.length === 1, title: "Remove channel", children: _jsx("i", { className: "fas fa-times" }) })] }), _jsxs("div", { className: styles.channelDmxInfo, children: [_jsxs("span", { className: styles.dmxAddressLabel, children: ["DMX: ", fixtureForm.startAddress + index] }), _jsx(MidiLearnButton, { channelIndex: fixtureForm.startAddress + index - 1, className: styles.channelMidiLearnButton })] })] }, index))) }), _jsxs("div", { className: styles.formActions, children: [_jsxs("button", { className: styles.addChannelButton, onClick: addChannel, children: [_jsx("i", { className: "fas fa-plus" }), " Add Channel"] }), _jsxs("div", { className: styles.saveActions, children: [_jsx("button", { className: styles.cancelButton, onClick: resetForm, children: "Cancel" }), _jsxs("button", { className: styles.saveButton, onClick: saveFixture, disabled: !fixtureForm.name || fixtureForm.channels.length === 0, children: [_jsx("i", { className: "fas fa-save" }), editingFixtureId ? (_jsxs(_Fragment, { children: [theme === 'artsnob' && 'Refine & Preserve', theme === 'standard' && 'Update Fixture', theme === 'minimal' && 'Update'] })) : (_jsxs(_Fragment, { children: [theme === 'artsnob' && 'Immortalize Fixture', theme === 'standard' && 'Save Fixture', theme === 'minimal' && 'Save'] }))] })] })] })] })) : (_jsxs("button", { className: styles.createButton, onClick: () => {
                                            setFixtureForm({
                                                name: '',
                                                startAddress: calculateNextStartAddress(),
                                                channels: [{ name: 'Intensity', type: 'dimmer' }]
                                            });
                                            setEditingFixtureId(null);
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
                                                        setEditingFixtureId(null);
                                                        setShowCreateFixture(true);
                                                    }, children: template.templateName }, template.templateName))) })] }))] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Fixture Groups: The Constellations of Light', theme === 'standard' && 'Groups', theme === 'minimal' && 'Groups'] }) }), _jsxs("div", { className: styles.cardBody, children: [groups.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-object-group" }), _jsx("p", { children: "No groups have been created yet" })] })) : (_jsx("div", { className: styles.groupList, children: groups.map((group, index) => (_jsxs("div", { className: styles.groupItem, children: ["                    ", _jsxs("div", { className: styles.groupHeader, children: [_jsx("h4", { children: group.name }), _jsxs("div", { className: styles.groupActions, children: [_jsxs("span", { className: styles.groupCount, children: [group.fixtureIndices.length, " fixture", group.fixtureIndices.length !== 1 ? 's' : ''] }), _jsx("button", { className: styles.editButton, onClick: () => startEditGroup(group), title: "Edit group", children: _jsx("i", { className: "fas fa-edit" }) }), _jsx("button", { className: styles.deleteButton, onClick: () => deleteGroup(group), title: "Delete group", children: _jsx("i", { className: "fas fa-trash" }) })] })] }), _jsx("div", { className: styles.groupFixtures, children: group.fixtureIndices.map(fixtureIndex => (_jsx("div", { className: styles.groupFixtureTag, children: fixtures[fixtureIndex]?.name || `Fixture #${fixtureIndex}` }, fixtureIndex))) }), _jsxs("div", { className: styles.groupActions, children: [_jsx("button", { className: styles.editButton, onClick: () => startEditGroup(group), title: "Edit group", children: _jsx("i", { className: "fas fa-edit" }) }), _jsx("button", { className: styles.deleteButton, onClick: () => deleteGroup(group), title: "Delete group", children: _jsx("i", { className: "fas fa-trash" }) })] })] }, index))) })), showCreateGroup ? (_jsxs("div", { className: styles.groupForm, children: [_jsxs("h4", { children: [theme === 'artsnob' && 'Create Fixture Group: The Collective Expression', theme === 'standard' && 'New Group', theme === 'minimal' && 'New Group'] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "groupName", children: "Name:" }), _jsx("input", { type: "text", id: "groupName", value: groupForm.name, onChange: (e) => setGroupForm(prev => ({ ...prev, name: e.target.value })), placeholder: "Enter group name" })] }), _jsxs("h5", { children: [theme === 'artsnob' && 'Select Fixtures: Choose Your Instruments', theme === 'standard' && 'Select Fixtures', theme === 'minimal' && 'Fixtures'] }), fixtures.length === 0 ? (_jsx("p", { className: styles.noFixturesMessage, children: "No fixtures available to add to group" })) : (_jsx("div", { className: styles.fixtureSelection, children: fixtures.map((fixture, index) => (_jsxs("div", { className: `${styles.selectableFixture} ${groupForm.fixtureIndices.includes(index) ? styles.selected : ''}`, onClick: () => toggleFixtureForGroup(index), children: [_jsx("div", { className: styles.fixtureCheckbox, children: _jsx("input", { type: "checkbox", checked: groupForm.fixtureIndices.includes(index), onChange: () => { }, onClick: (e) => e.stopPropagation() }) }), _jsxs("div", { className: styles.fixtureInfo, children: [_jsx("span", { className: styles.fixtureName, children: fixture.name }), _jsxs("span", { className: styles.fixtureDmx, children: ["DMX: ", fixture.startAddress, "-", fixture.startAddress + fixture.channels.length - 1] })] })] }, index))) })), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { className: styles.cancelButton, onClick: () => setShowCreateGroup(false), children: "Cancel" }), "                    ", _jsxs("button", { className: styles.saveButton, onClick: editingGroupId ? updateGroup : saveGroup, disabled: !groupForm.name || groupForm.fixtureIndices.length === 0, children: [_jsx("i", { className: "fas fa-save" }), editingGroupId ? (_jsxs(_Fragment, { children: [theme === 'artsnob' && 'Update Collective', theme === 'standard' && 'Update Group', theme === 'minimal' && 'Update'] })) : (_jsxs(_Fragment, { children: [theme === 'artsnob' && 'Establish Collective', theme === 'standard' && 'Save Group', theme === 'minimal' && 'Save'] }))] })] })] })) : (_jsxs("button", { className: styles.createButton, onClick: () => setShowCreateGroup(true), disabled: fixtures.length === 0, children: [_jsx("i", { className: "fas fa-plus" }), theme === 'artsnob' && 'Create Fixture Group', theme === 'standard' && 'Add Group', theme === 'minimal' && 'Add'] }))] })] })] })] }));
};
