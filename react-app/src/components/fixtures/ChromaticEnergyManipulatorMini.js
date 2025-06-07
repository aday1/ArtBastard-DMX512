import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useChromaticEnergyManipulatorSettings } from '../../context/ChromaticEnergyManipulatorContext';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ChromaticEnergyManipulatorMini.module.scss';
const ChromaticEnergyManipulatorMini = ({ isCollapsed = false, onCollapsedChange, }) => {
    const [selectedFixtures, setSelectedFixtures] = useState([]);
    const [showFixtureSelect, setShowFixtureSelect] = useState(false);
    const [showFlagPanel, setShowFlagPanel] = useState(false);
    const [newFlagName, setNewFlagName] = useState('');
    const [newFlagColor, setNewFlagColor] = useState('#ff6b6b');
    const [newFlagCategory, setNewFlagCategory] = useState('');
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [lastColorPreset, setLastColorPreset] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedSelection, setShowAdvancedSelection] = useState(false);
    // Color and movement state
    const [color, setColor] = useState({ r: 255, g: 255, b: 255 });
    const [movement, setMovement] = useState({ pan: 127, tilt: 127 });
    // Canvas references
    const colorCanvasRef = useRef(null);
    const movementCanvasRef = useRef(null);
    const { fixtures, getDmxChannelValue, setDmxChannelValue, addFixtureFlag, removeFixtureFlag, bulkAddFlag, bulkRemoveFlag, createQuickFlag, getFixturesByFlag, getFixturesByFlagCategory } = useStore(state => ({
        fixtures: state.fixtures,
        getDmxChannelValue: state.getDmxChannelValue,
        setDmxChannelValue: state.setDmxChannelValue,
        addFixtureFlag: state.addFixtureFlag,
        removeFixtureFlag: state.removeFixtureFlag,
        bulkAddFlag: state.bulkAddFlag,
        bulkRemoveFlag: state.bulkRemoveFlag,
        createQuickFlag: state.createQuickFlag,
        getFixturesByFlag: state.getFixturesByFlag,
        getFixturesByFlagCategory: state.getFixturesByFlagCategory
    }));
    const { settings } = useChromaticEnergyManipulatorSettings();
    // Get fixture channels
    const getFixtureChannels = (fixtureId) => {
        const fixture = fixtures.find(f => f.id === fixtureId);
        if (!fixture)
            return { rgbChannels: {}, movementChannels: {} };
        const rgbChannels = {};
        const movementChannels = {};
        fixture.channels.forEach((channel, index) => {
            const dmxAddress = fixture.startAddress + index;
            switch (channel.type) {
                case 'red':
                case 'green':
                case 'blue':
                    // assign each color channel individually
                    if (channel.type === 'red')
                        rgbChannels.redChannel = dmxAddress - 1;
                    if (channel.type === 'green')
                        rgbChannels.greenChannel = dmxAddress - 1;
                    if (channel.type === 'blue')
                        rgbChannels.blueChannel = dmxAddress - 1;
                    break;
                case 'dimmer':
                    // map single dimmer to all RGB channels for fixtures without separate colors
                    rgbChannels.redChannel = rgbChannels.greenChannel = rgbChannels.blueChannel = dmxAddress - 1;
                    break;
                case 'pan':
                    movementChannels.panChannel = dmxAddress - 1;
                    break;
                case 'tilt':
                    movementChannels.tiltChannel = dmxAddress - 1;
                    break;
                // add other channel types if needed
            }
        });
        return { rgbChannels, movementChannels };
    };
    // Helper functions for flagging
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
    // Color presets
    const colorPresets = [
        { name: 'Red', r: 255, g: 0, b: 0 },
        { name: 'Green', r: 0, g: 255, b: 0 },
        { name: 'Blue', r: 0, g: 0, b: 255 },
        { name: 'White', r: 255, g: 255, b: 255 },
        { name: 'Yellow', r: 255, g: 255, b: 0 },
        { name: 'Cyan', r: 0, g: 255, b: 255 },
        { name: 'Magenta', r: 255, g: 0, b: 255 },
        { name: 'Orange', r: 255, g: 127, b: 0 },
        { name: 'Purple', r: 127, g: 0, b: 255 },
        { name: 'Warm White', r: 255, g: 180, b: 120 },
        { name: 'Cool White', r: 180, g: 200, b: 255 },
        { name: 'Off', r: 0, g: 0, b: 0 }
    ];
    const applyColorPreset = (preset) => {
        try {
            setIsUpdating(true);
            setConnectionError(null);
            setColor(preset);
            setLastColorPreset(preset);
            // Apply to all selected fixtures with validation
            selectedFixtures.forEach(fixtureId => {
                const { rgbChannels } = getFixtureChannels(fixtureId);
                if (rgbChannels.redChannel !== undefined && rgbChannels.redChannel >= 0) {
                    setDmxChannelValue(rgbChannels.redChannel, Math.max(0, Math.min(255, preset.r)));
                }
                if (rgbChannels.greenChannel !== undefined && rgbChannels.greenChannel >= 0) {
                    setDmxChannelValue(rgbChannels.greenChannel, Math.max(0, Math.min(255, preset.g)));
                }
                if (rgbChannels.blueChannel !== undefined && rgbChannels.blueChannel >= 0) {
                    setDmxChannelValue(rgbChannels.blueChannel, Math.max(0, Math.min(255, preset.b)));
                }
            });
        }
        catch (error) {
            setConnectionError('Failed to apply color preset');
            console.error('Color preset error:', error);
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
    const centerMovement = () => {
        try {
            setIsUpdating(true);
            setConnectionError(null);
            const centerValues = { pan: 127, tilt: 127 };
            setMovement(centerValues);
            selectedFixtures.forEach(fixtureId => {
                const { movementChannels } = getFixtureChannels(fixtureId);
                if (movementChannels.panChannel !== undefined && movementChannels.panChannel >= 0) {
                    setDmxChannelValue(movementChannels.panChannel, centerValues.pan);
                }
                if (movementChannels.tiltChannel !== undefined && movementChannels.tiltChannel >= 0) {
                    setDmxChannelValue(movementChannels.tiltChannel, centerValues.tilt);
                }
            });
        }
        catch (error) {
            setConnectionError('Failed to center movement');
            console.error('Movement center error:', error);
        }
        finally {
            setIsUpdating(false);
        }
    };
    const selectAllFlagged = () => {
        const flaggedFixtures = fixtures.filter(f => f.isFlagged);
        setSelectedFixtures(flaggedFixtures.map(f => f.id));
    };
    const selectByFlag = (flagId) => {
        const flaggedFixtures = getFixturesByFlag(flagId);
        setSelectedFixtures(flaggedFixtures.map(f => f.id));
    };
    const selectByFlagCategory = (category) => {
        const flaggedFixtures = getFixturesByFlagCategory(category);
        setSelectedFixtures(flaggedFixtures.map(f => f.id));
    };
    // Enhanced selection functions
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
                    return fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                case 'movement':
                    return fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
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
        const similarFixtures = filteredFixtures.filter(fixture => {
            // Consider fixtures similar if they have the same channel types
            const refChannelTypes = referenceFixture.channels.map(ch => ch.type).sort();
            const fixtureChannelTypes = fixture.channels.map(ch => ch.type).sort();
            return JSON.stringify(refChannelTypes) === JSON.stringify(fixtureChannelTypes);
        });
        setSelectedFixtures(similarFixtures.map(f => f.id));
    };
    // Filter fixtures based on search term
    const filteredFixtures = fixtures.filter(fixture => fixture.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
    // Auto-select first RGB fixture if none selected
    useEffect(() => {
        if (!settings.autoSelectFirstFixture)
            return;
        if (selectedFixtures.length === 0 && fixtures.length > 0) {
            // Try RGB fixtures first
            let firstFixture = fixtures.find(f => f.channels.some(c => c.type === 'red') &&
                f.channels.some(c => c.type === 'green') &&
                f.channels.some(c => c.type === 'blue'));
            // Fallback to dimmer-only fixtures
            if (!firstFixture) {
                firstFixture = fixtures.find(f => f.channels.some(c => c.type === 'dimmer'));
            }
            // Final fallback: first fixture in list
            if (!firstFixture && fixtures.length > 0) {
                firstFixture = fixtures[0];
            }
            if (firstFixture) {
                setSelectedFixtures([firstFixture.id]);
            }
        }
    }, [fixtures, selectedFixtures.length, settings.autoSelectFirstFixture]);
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (selectedFixtures.length === 0)
                return;
            // Only handle shortcuts when not typing in inputs
            if (event.target instanceof HTMLInputElement)
                return;
            switch (event.key.toLowerCase()) {
                case 'r':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        randomizeColor();
                    }
                    break;
                case 'c':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        centerMovement();
                    }
                    break;
                case '1':
                    event.preventDefault();
                    applyColorPreset({ r: 255, g: 0, b: 0 }); // Red
                    break;
                case '2':
                    event.preventDefault();
                    applyColorPreset({ r: 0, g: 255, b: 0 }); // Green
                    break;
                case '3':
                    event.preventDefault();
                    applyColorPreset({ r: 0, g: 0, b: 255 }); // Blue
                    break;
                case '0':
                    event.preventDefault();
                    applyColorPreset({ r: 0, g: 0, b: 0 }); // Off
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedFixtures, applyColorPreset, randomizeColor, centerMovement]);
    // Update color and movement when selection changes
    useEffect(() => {
        if (selectedFixtures.length > 0) {
            const firstFixtureId = selectedFixtures[0];
            const { rgbChannels: firstRgbChannels, movementChannels: firstMovementChannels } = getFixtureChannels(firstFixtureId);
            if (firstRgbChannels.redChannel !== undefined) {
                setColor({
                    r: getDmxChannelValue(firstRgbChannels.redChannel),
                    g: getDmxChannelValue(firstRgbChannels.greenChannel),
                    b: getDmxChannelValue(firstRgbChannels.blueChannel)
                });
            }
            if (firstMovementChannels.panChannel !== undefined) {
                setMovement({
                    pan: getDmxChannelValue(firstMovementChannels.panChannel),
                    tilt: getDmxChannelValue(firstMovementChannels.tiltChannel)
                });
            }
        }
    }, [selectedFixtures, getDmxChannelValue, fixtures]);
    // Canvas drawing effects
    useEffect(() => {
        const canvas = colorCanvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillStyle = rgb;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
    }, [color]);
    useEffect(() => {
        const canvas = movementCanvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        // Draw crosshairs
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        // Draw position indicator
        const x = (movement.pan / 255) * width;
        const y = height - (movement.tilt / 255) * height;
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }, [movement]);
    // Event handlers
    const handleColorClick = (event) => {
        const canvas = colorCanvasRef.current;
        if (!canvas)
            return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const hue = (x / canvas.width) * 360;
        // Convert HSV to RGB (simplified)
        const c = 1;
        const x_val = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = 0;
        let r = 0, g = 0, b = 0;
        if (hue < 60) {
            r = c;
            g = x_val;
            b = 0;
        }
        else if (hue < 120) {
            r = x_val;
            g = c;
            b = 0;
        }
        else if (hue < 180) {
            r = 0;
            g = c;
            b = x_val;
        }
        else if (hue < 240) {
            r = 0;
            g = x_val;
            b = c;
        }
        else if (hue < 300) {
            r = x_val;
            g = 0;
            b = c;
        }
        else {
            r = c;
            g = 0;
            b = x_val;
        }
        const newColor = {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
        setColor(newColor);
        // Update all selected fixtures
        selectedFixtures.forEach(fixtureId => {
            const { rgbChannels } = getFixtureChannels(fixtureId);
            if (rgbChannels.redChannel !== undefined)
                setDmxChannelValue(rgbChannels.redChannel, newColor.r);
            if (rgbChannels.greenChannel !== undefined)
                setDmxChannelValue(rgbChannels.greenChannel, newColor.g);
            if (rgbChannels.blueChannel !== undefined)
                setDmxChannelValue(rgbChannels.blueChannel, newColor.b);
        });
    };
    const handleMovementClick = (event) => {
        const canvas = movementCanvasRef.current;
        if (!canvas)
            return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const newMovement = {
            pan: Math.round((x / canvas.width) * 255),
            tilt: Math.round(((canvas.height - y) / canvas.height) * 255)
        };
        setMovement(newMovement);
        // Update all selected fixtures
        selectedFixtures.forEach(fixtureId => {
            const { movementChannels } = getFixtureChannels(fixtureId);
            if (movementChannels.panChannel !== undefined)
                setDmxChannelValue(movementChannels.panChannel, newMovement.pan);
            if (movementChannels.tiltChannel !== undefined)
                setDmxChannelValue(movementChannels.tiltChannel, newMovement.tilt);
        });
    };
    // Helper functions
    const selectedFixtureName = () => {
        if (selectedFixtures.length === 0)
            return settings.enableErrorMessages ? 'No fixtures selected' : 'Select fixtures';
        if (selectedFixtures.length === 1) {
            const fixture = fixtures.find(f => f.id === selectedFixtures[0]);
            return fixture?.name || 'Unknown';
        }
        return `${selectedFixtures.length} fixtures selected`;
    };
    const { rgbChannels: firstSelectedRgbChannels, movementChannels: firstSelectedMovementChannels } = selectedFixtures.length > 0 ? getFixtureChannels(selectedFixtures[0]) : { rgbChannels: {}, movementChannels: {} };
    const hasRgbChannels = firstSelectedRgbChannels.redChannel !== undefined && firstSelectedRgbChannels.greenChannel !== undefined && firstSelectedRgbChannels.blueChannel !== undefined;
    const hasMovementChannels = firstSelectedMovementChannels.panChannel !== undefined && firstSelectedMovementChannels.tiltChannel !== undefined;
    return (_jsxs(DockableComponent, { id: "chromatic-energy-manipulator-mini", component: "chromatic-energy-manipulator", title: "Chromatic Energy Manipulator", defaultPosition: { zone: 'floating', offset: { x: 20, y: 300 } }, className: styles.chromaticEnergyManipulatorMini, isCollapsed: isCollapsed, onCollapsedChange: onCollapsedChange, width: "280px", height: "auto", children: ["      ", _jsxs("div", { className: styles.container, children: [connectionError && (_jsxs("div", { className: styles.errorMessage, children: [_jsx(LucideIcon, { name: "AlertTriangle" }), _jsx("span", { children: connectionError }), _jsx("button", { onClick: () => setConnectionError(null), className: styles.closeError, children: _jsx(LucideIcon, { name: "X" }) })] })), isUpdating && (_jsxs("div", { className: styles.loadingIndicator, children: [_jsx(LucideIcon, { name: "Loader" }), _jsx("span", { children: "Updating..." })] })), _jsxs("div", { className: styles.fixtureSection, children: ["          ", _jsxs("button", { className: styles.fixtureSelector, onClick: () => setShowFixtureSelect(!showFixtureSelect), title: `Selected: ${selectedFixtureName()}`, children: [_jsx(LucideIcon, { name: "Target" }), _jsx("span", { className: styles.fixtureName, children: selectedFixtureName() }), _jsxs("div", { className: styles.selectorRight, children: [selectedFixtures.length > 0 && (_jsx("span", { className: styles.selectionBadge, children: selectedFixtures.length })), _jsx(LucideIcon, { name: showFixtureSelect ? "ChevronUp" : "ChevronDown" })] })] }), showFixtureSelect && (_jsxs("div", { className: styles.fixtureDropdown, children: [_jsx("div", { className: styles.searchSection, children: _jsxs("div", { className: styles.searchContainer, children: [_jsx(LucideIcon, { name: "Search" }), _jsx("input", { type: "text", placeholder: "Search fixtures...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: styles.searchInput }), searchTerm && (_jsx("button", { onClick: () => setSearchTerm(''), className: styles.clearSearch, children: _jsx(LucideIcon, { name: "X" }) }))] }) }), selectedFixtures.length > 0 && (_jsxs("div", { className: styles.selectionSummary, children: [_jsx("div", { className: styles.summaryText, children: _jsxs("span", { children: [selectedFixtures.length, " of ", filteredFixtures.length, " selected"] }) }), _jsx("div", { className: styles.summaryActions, children: _jsx("button", { onClick: deselectAll, className: styles.summaryButton, title: "Clear selection", children: _jsx(LucideIcon, { name: "X" }) }) })] })), _jsxs("div", { className: styles.bulkControls, children: [_jsxs("button", { className: styles.bulkButton, onClick: selectAll, title: "Select all visible fixtures", children: [_jsx(LucideIcon, { name: "CheckSquare" }), _jsx("span", { children: "All" })] }), _jsxs("button", { className: styles.bulkButton, onClick: invertSelection, title: "Invert selection", children: [_jsx(LucideIcon, { name: "RotateCcw" }), _jsx("span", { children: "Invert" })] }), _jsxs("button", { className: styles.bulkButton, onClick: () => setShowAdvancedSelection(!showAdvancedSelection), title: "Advanced selection", children: [_jsx(LucideIcon, { name: "Filter" }), _jsx("span", { children: "Smart" })] }), _jsxs("button", { className: styles.bulkButton, onClick: () => setShowFlagPanel(!showFlagPanel), title: "Flag management", children: [_jsx(LucideIcon, { name: "Tag" }), _jsx("span", { children: "Flags" })] })] }), showAdvancedSelection && (_jsxs("div", { className: styles.advancedSelection, children: [_jsxs("div", { className: styles.selectionByType, children: [_jsx("h4", { children: "Select by Type:" }), _jsxs("div", { className: styles.typeButtons, children: [_jsxs("button", { onClick: () => selectByType('rgb'), className: styles.typeButton, children: [_jsx(LucideIcon, { name: "Palette" }), "RGB"] }), _jsxs("button", { onClick: () => selectByType('movement'), className: styles.typeButton, children: [_jsx(LucideIcon, { name: "Move" }), "Movement"] }), _jsxs("button", { onClick: () => selectByType('dimmer'), className: styles.typeButton, children: [_jsx(LucideIcon, { name: "Sun" }), "Dimmer"] })] })] }), _jsxs("div", { className: styles.smartSelection, children: [_jsxs("button", { onClick: selectSimilar, disabled: selectedFixtures.length === 0, className: styles.smartButton, children: [_jsx(LucideIcon, { name: "Copy" }), "Select Similar"] }), _jsxs("button", { onClick: selectAllFlagged, className: styles.smartButton, children: [_jsx(LucideIcon, { name: "Flag" }), "All Flagged"] })] })] })), showFlagPanel && (_jsxs("div", { className: styles.flagPanel, children: [_jsxs("div", { className: styles.flagCreation, children: [_jsx("input", { type: "text", placeholder: "Flag name", value: newFlagName, onChange: (e) => setNewFlagName(e.target.value), className: styles.flagInput }), _jsx("input", { type: "color", value: newFlagColor, onChange: (e) => setNewFlagColor(e.target.value), className: styles.colorInput }), _jsx("input", { type: "text", placeholder: "Category (optional)", value: newFlagCategory, onChange: (e) => setNewFlagCategory(e.target.value), className: styles.flagInput }), _jsx("button", { onClick: createAndApplyFlag, disabled: !newFlagName.trim() || selectedFixtures.length === 0, className: styles.createFlagButton, children: "Create & Apply" })] }), getAllUniqueFlags().length > 0 && (_jsxs("div", { className: styles.flagSelection, children: [_jsx("h4", { children: "Select by Flag:" }), getAllUniqueFlags().map(flag => (_jsx("button", { onClick: () => selectByFlag(flag.id), className: styles.flagButton, style: { backgroundColor: flag.color }, children: flag.name }, flag.id)))] })), getAllUniqueCategories().length > 0 && (_jsxs("div", { className: styles.categorySelection, children: [_jsx("h4", { children: "Select by Category:" }), getAllUniqueCategories().map(category => (_jsx("button", { onClick: () => selectByFlagCategory(category), className: styles.categoryButton, children: category }, category)))] })), selectedFixtures.length > 0 && (_jsx("button", { onClick: removeSelectedFixtureFlags, className: styles.clearFlagsButton, children: "Clear Flags from Selected" }))] })), "              ", _jsx("div", { className: styles.fixtureList, children: filteredFixtures.length === 0 ? (_jsxs("div", { className: styles.noResults, children: [_jsx(LucideIcon, { name: "Search" }), _jsx("span", { children: "No fixtures found" })] })) : (filteredFixtures.map(fixture => {
                                            const isSelected = selectedFixtures.includes(fixture.id);
                                            const hasRgb = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                                            const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
                                            const hasDimmer = fixture.channels.some(ch => ch.type === 'dimmer');
                                            return (_jsxs("div", { className: `${styles.fixtureOption} ${isSelected ? styles.selected : ''}`, onClick: () => {
                                                    setSelectedFixtures(prevSelected => prevSelected.includes(fixture.id)
                                                        ? prevSelected.filter(id => id !== fixture.id)
                                                        : [...prevSelected, fixture.id]);
                                                }, children: [_jsx("div", { className: styles.fixtureCheckbox, children: _jsx("div", { className: `${styles.checkbox} ${isSelected ? styles.checked : ''}`, children: isSelected && _jsx(LucideIcon, { name: "Check" }) }) }), _jsxs("div", { className: styles.fixtureInfo, children: [_jsx("div", { className: styles.fixtureName, children: fixture.name }), _jsxs("div", { className: styles.fixtureDetails, children: [_jsxs("div", { className: styles.fixtureCapabilities, children: [hasRgb && _jsx("span", { className: styles.capability, title: "RGB Color", children: _jsx(LucideIcon, { name: "Palette" }) }), hasMovement && _jsx("span", { className: styles.capability, title: "Pan/Tilt", children: _jsx(LucideIcon, { name: "Move" }) }), hasDimmer && _jsx("span", { className: styles.capability, title: "Dimmer", children: _jsx(LucideIcon, { name: "Sun" }) })] }), _jsxs("div", { className: styles.fixtureAddress, children: ["Ch ", fixture.startAddress] })] }), fixture.flags && fixture.flags.length > 0 && (_jsxs("div", { className: styles.flagIndicators, children: [fixture.flags.slice(0, 3).map(flag => (_jsx("div", { className: styles.flagIndicator, style: { backgroundColor: flag.color }, title: flag.name }, flag.id))), fixture.flags.length > 3 && (_jsxs("span", { className: styles.moreFlags, children: ["+", fixture.flags.length - 3] }))] }))] })] }, fixture.id));
                                        })) })] }))] }), "        ", selectedFixtures.length > 0 && (_jsxs("div", { className: styles.controlsSection, children: [_jsxs("div", { className: styles.quickActions, children: [_jsxs("button", { className: styles.quickActionButton, onClick: () => setShowQuickActions(!showQuickActions), title: "Quick Actions", children: [_jsx(LucideIcon, { name: "Zap" }), _jsx("span", { children: "Quick Actions" }), _jsx(LucideIcon, { name: showQuickActions ? "ChevronUp" : "ChevronDown" })] }), showQuickActions && (_jsxs("div", { className: styles.quickActionsPanel, children: [hasRgbChannels && (_jsxs("div", { className: styles.colorPresets, children: [_jsx("div", { className: styles.presetGrid, children: colorPresets.map((preset, index) => (_jsx("button", { className: styles.presetButton, style: {
                                                                backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})`,
                                                                border: `2px solid ${preset.r + preset.g + preset.b < 100 ? '#666' : 'transparent'}`
                                                            }, onClick: () => applyColorPreset(preset), title: preset.name }, index))) }), _jsxs("div", { className: styles.colorQuickActions, children: [_jsxs("button", { className: styles.actionButton, onClick: randomizeColor, title: "Random Color", children: [_jsx(LucideIcon, { name: "Shuffle" }), "Random"] }), lastColorPreset && (_jsxs("button", { className: styles.actionButton, onClick: () => applyColorPreset(lastColorPreset), title: "Restore Last Color", children: [_jsx(LucideIcon, { name: "RotateCcw" }), "Restore"] }))] })] })), hasMovementChannels && (_jsx("div", { className: styles.movementQuickActions, children: _jsxs("button", { className: styles.actionButton, onClick: centerMovement, title: "Center Position", children: [_jsx(LucideIcon, { name: "Target" }), "Center"] }) }))] }))] }), hasRgbChannels && (_jsxs("div", { className: styles.colorControl, children: [_jsxs("div", { className: styles.controlLabel, children: [_jsx(LucideIcon, { name: "Palette" }), _jsx("span", { children: "Color" })] }), _jsx("canvas", { ref: colorCanvasRef, width: 200, height: 20, className: styles.colorCanvas, onClick: handleColorClick })] })), hasMovementChannels && (_jsxs("div", { className: styles.movementControl, children: [_jsxs("div", { className: styles.controlLabel, children: [_jsx(LucideIcon, { name: "Move" }), _jsx("span", { children: "Movement" })] }), _jsx("canvas", { ref: movementCanvasRef, width: 80, height: 80, className: styles.movementCanvas, onClick: handleMovementClick })] })), !hasRgbChannels && !hasMovementChannels && (_jsxs("div", { className: styles.noChannels, children: [_jsx(LucideIcon, { name: "AlertCircle" }), _jsx("span", { children: "No RGB or movement channels found" })] }))] }))] })] }));
};
export default ChromaticEnergyManipulatorMini;
