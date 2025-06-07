import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useDocking } from '@/context/DockingContext';
import styles from './HelpOverlay.module.scss';
export const HelpOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [tutorialStep, setTutorialStep] = useState(null);
    const [highlightedElement, setHighlightedElement] = useState(null);
    const searchInputRef = useRef(null);
    const { state, setGridSize, setGridSnappingEnabled, setShowGrid, snapToGrid, snapPositionToGrid } = useDocking();
    // Tutorial steps
    const tutorialSteps = [
        {
            id: 'welcome',
            title: 'Welcome to ArtBastard DMX512',
            description: 'This tutorial will guide you through the Grid & Docking System features.',
        },
        {
            id: 'grid-basics',
            title: 'Grid System Basics',
            description: 'The grid system helps you align components precisely. You can see the current grid size and snapping status in the controls.',
            target: '[data-tutorial="grid-controls"]',
        },
        {
            id: 'dragging',
            title: 'Dragging Components',
            description: 'Try dragging any component by its title bar. Components will snap to the grid if snapping is enabled.',
            target: '[data-tutorial="dockable-component"]',
        },
        {
            id: 'docking',
            title: 'Docking Zones',
            description: 'Drag components to the edges of the screen to dock them in specific zones.',
            target: '[data-tutorial="dock-zones"]',
        },
        {
            id: 'keyboard',
            title: 'Keyboard Shortcuts',
            description: 'Use keyboard shortcuts for quick access to grid functions.',
        },
    ];
    // Export/Import settings
    const exportSettings = () => {
        const settings = {
            gridSize: state.gridSize,
            gridSnappingEnabled: state.gridSnappingEnabled,
            showGrid: state.showGrid,
            timestamp: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'artbastard-grid-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };
    const importSettings = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target?.result);
                if (settings.gridSize)
                    setGridSize(settings.gridSize);
                if (typeof settings.gridSnappingEnabled === 'boolean')
                    setGridSnappingEnabled(settings.gridSnappingEnabled);
                if (typeof settings.showGrid === 'boolean')
                    setShowGrid(settings.showGrid);
            }
            catch (error) {
                alert('Invalid settings file format');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    // Tutorial management
    const startTutorial = () => {
        setTutorialStep(0);
        setActiveTab('tutorial');
    };
    const nextTutorialStep = () => {
        if (tutorialStep !== null && tutorialStep < tutorialSteps.length - 1) {
            setTutorialStep(tutorialStep + 1);
        }
        else {
            endTutorial();
        }
    };
    const endTutorial = () => {
        setTutorialStep(null);
        setHighlightedElement(null);
    };
    // Search functionality
    const filteredContent = (content) => {
        if (!searchQuery)
            return content;
        return content.toLowerCase().includes(searchQuery.toLowerCase());
    };
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'h':
                    case 'H':
                        e.preventDefault();
                        setIsVisible(!isVisible);
                        break;
                    case '/':
                        e.preventDefault();
                        if (isVisible && searchInputRef.current) {
                            searchInputRef.current.focus();
                        }
                        break;
                    case 'Escape':
                        if (isVisible) {
                            e.preventDefault();
                            setIsVisible(false);
                        }
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]);
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '🏠' },
        { id: 'grid-controls', label: 'Grid Controls', icon: '⚙️' },
        { id: 'keyboard', label: 'Shortcuts', icon: '⌨️' },
        { id: 'components', label: 'Components', icon: '🧩' },
        { id: 'tutorial', label: 'Tutorial', icon: '🎓' },
        { id: 'troubleshooting', label: 'Help', icon: '🔧' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];
    const renderGridControls = () => (_jsxs("div", { className: styles.gridControls, "data-tutorial": "grid-controls", children: [_jsxs("div", { className: styles.controlGroup, children: [_jsxs("label", { htmlFor: "gridSize", children: ["Grid Size: ", state.gridSize, "px"] }), _jsx("input", { id: "gridSize", type: "range", min: "20", max: "200", value: state.gridSize, onChange: (e) => setGridSize(parseInt(e.target.value)), className: styles.slider }), _jsxs("div", { className: styles.sliderTicks, children: [_jsx("span", { children: "20px" }), _jsx("span", { children: "100px" }), _jsx("span", { children: "200px" })] })] }), _jsx("div", { className: styles.controlGroup, children: _jsxs("div", { className: styles.toggleGroup, children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: state.gridSnappingEnabled, onChange: (e) => setGridSnappingEnabled(e.target.checked) }), _jsx("span", { className: styles.toggleLabel, children: "Grid Snapping" })] }), _jsx("div", { className: styles.toggleDescription, children: "Automatically snap components to grid intersections" })] }) }), _jsx("div", { className: styles.controlGroup, children: _jsxs("div", { className: styles.toggleGroup, children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: state.showGrid, onChange: (e) => setShowGrid(e.target.checked) }), _jsx("span", { className: styles.toggleLabel, children: "Show Grid" })] }), _jsx("div", { className: styles.toggleDescription, children: "Display grid lines permanently (also shown during dragging)" })] }) }), _jsxs("div", { className: styles.quickActions, children: [_jsx("button", { onClick: () => setGridSize(50), className: styles.quickButton, children: "Fine Grid (50px)" }), _jsx("button", { onClick: () => setGridSize(100), className: styles.quickButton, children: "Medium Grid (100px)" }), _jsx("button", { onClick: () => setGridSize(150), className: styles.quickButton, children: "Coarse Grid (150px)" })] }), _jsxs("div", { className: styles.statusPanel, children: [_jsx("h5", { children: "Current Status" }), _jsxs("div", { className: styles.statusItem, children: [_jsx("span", { children: "Grid Size:" }), _jsxs("span", { className: styles.statusValue, children: [state.gridSize, "px"] })] }), _jsxs("div", { className: styles.statusItem, children: [_jsx("span", { children: "Snapping:" }), _jsx("span", { className: `${styles.statusValue} ${state.gridSnappingEnabled ? styles.enabled : styles.disabled}`, children: state.gridSnappingEnabled ? 'ON' : 'OFF' })] }), _jsxs("div", { className: styles.statusItem, children: [_jsx("span", { children: "Grid Visible:" }), _jsx("span", { className: `${styles.statusValue} ${state.showGrid ? styles.enabled : styles.disabled}`, children: state.showGrid ? 'YES' : 'NO' })] })] })] }));
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (_jsx("div", { className: styles.tabContent, children: _jsxs("div", { className: styles.welcomeSection, children: [_jsx("h4", { children: "\uD83C\uDFAF Welcome to the Grid & Docking System" }), _jsx("p", { children: "The ArtBastard DMX512 application features a powerful grid and docking system that helps you organize and align your interface components with precision." }), _jsxs("div", { className: styles.featureGrid, children: [_jsxs("div", { className: styles.featureCard, children: [_jsx("div", { className: styles.featureIcon, children: "\uD83D\uDCD0" }), _jsx("h5", { children: "Precision Grid" }), _jsx("p", { children: "Customizable grid system with 20-200px spacing for perfect alignment" })] }), _jsxs("div", { className: styles.featureCard, children: [_jsx("div", { className: styles.featureIcon, children: "\uD83E\uDDF2" }), _jsx("h5", { children: "Smart Snapping" }), _jsx("p", { children: "Intelligent snapping within 30% of grid intersections" })] }), _jsxs("div", { className: styles.featureCard, children: [_jsx("div", { className: styles.featureIcon, children: "\uD83C\uDFAF" }), _jsx("h5", { children: "Dock Zones" }), _jsx("p", { children: "Predefined docking zones at screen edges and corners" })] }), _jsxs("div", { className: styles.featureCard, children: [_jsx("div", { className: styles.featureIcon, children: "\u2328\uFE0F" }), _jsx("h5", { children: "Shortcuts" }), _jsx("p", { children: "Keyboard shortcuts for rapid grid manipulation" })] })] }), _jsxs("div", { className: styles.quickStart, children: [_jsx("h5", { children: "\uD83D\uDE80 Quick Start" }), _jsxs("ol", { children: [_jsxs("li", { children: ["Press ", _jsx("kbd", { children: "Ctrl + G" }), " to toggle grid visibility"] }), _jsxs("li", { children: ["Press ", _jsx("kbd", { children: "Ctrl + S" }), " to enable/disable snapping"] }), _jsx("li", { children: "Drag any component by its title bar" }), _jsx("li", { children: "Watch components snap to grid intersections" }), _jsx("li", { children: "Drag to screen edges to dock components" })] }), _jsx("button", { onClick: startTutorial, className: styles.tutorialButton, children: "Start Interactive Tutorial" })] })] }) }));
            case 'grid-controls':
                return (_jsxs("div", { className: styles.tabContent, children: [_jsx("h4", { children: "\u2699\uFE0F Advanced Grid Controls" }), renderGridControls()] }));
            case 'keyboard':
                return (_jsxs("div", { className: styles.tabContent, children: [_jsx("h4", { children: "\u2328\uFE0F Keyboard Shortcuts" }), _jsxs("div", { className: styles.shortcutSection, children: [_jsx("h5", { children: "Grid Controls" }), _jsxs("div", { className: styles.shortcutList, children: [_jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Ctrl + G" }), _jsx("span", { children: "Toggle grid visibility" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Ctrl + S" }), _jsx("span", { children: "Toggle grid snapping" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Ctrl + +" }), _jsx("span", { children: "Increase grid size (up to 200px)" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Ctrl + -" }), _jsx("span", { children: "Decrease grid size (down to 20px)" })] })] })] }), _jsxs("div", { className: styles.shortcutSection, children: [_jsx("h5", { children: "Help System" }), _jsxs("div", { className: styles.shortcutList, children: [_jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Ctrl + H" }), _jsx("span", { children: "Toggle help overlay" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Ctrl + /" }), _jsx("span", { children: "Focus search field" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Esc" }), _jsx("span", { children: "Close help overlay" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Tab" }), _jsx("span", { children: "Navigate between help tabs" })] })] })] }), _jsxs("div", { className: styles.shortcutSection, children: [_jsx("h5", { children: "Component Controls" }), _jsxs("div", { className: styles.shortcutList, children: [_jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Double Click" }), _jsx("span", { children: "Minimize/Maximize component" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Drag Title Bar" }), _jsx("span", { children: "Move component" })] }), _jsxs("div", { className: styles.shortcutItem, children: [_jsx("kbd", { children: "Drag to Edge" }), _jsx("span", { children: "Dock component to zone" })] })] })] })] }));
            case 'components':
                return (_jsxs("div", { className: styles.tabContent, children: [_jsx("h4", { children: "\uD83E\uDDE9 Component Reference" }), _jsxs("div", { className: styles.componentSection, children: [_jsx("h5", { children: "Available Components" }), _jsxs("div", { className: styles.componentCard, children: [_jsx("h6", { children: "\uD83C\uDF9B\uFE0F Master Fader" }), _jsx("p", { children: "Controls global DMX output level with fade options" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Default Position:" }), " Bottom Center"] }), _jsxs("li", { children: [_jsx("strong", { children: "Features:" }), " MIDI Learn, Blackout, Full On"] }), _jsxs("li", { children: [_jsx("strong", { children: "Shortcuts:" }), " Minimizable, Dockable"] })] })] }), _jsxs("div", { className: styles.componentCard, children: [_jsx("h6", { children: "\uD83C\uDFB9 MIDI Monitor" }), _jsx("p", { children: "Real-time MIDI message monitoring and debugging" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Default Position:" }), " Top Right"] }), _jsxs("li", { children: [_jsx("strong", { children: "Features:" }), " Message filtering, Clear history"] }), _jsxs("li", { children: [_jsx("strong", { children: "Data:" }), " Note On/Off, CC messages, timestamps"] })] })] }), _jsxs("div", { className: styles.componentCard, children: [_jsx("h6", { children: "\uD83D\uDCE1 OSC Monitor" }), _jsx("p", { children: "Open Sound Control message monitoring" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Default Position:" }), " Top Right"] }), _jsxs("li", { children: [_jsx("strong", { children: "Features:" }), " Address filtering, Value display"] }), _jsxs("li", { children: [_jsx("strong", { children: "Data:" }), " OSC addresses, values, timestamps"] })] })] }), _jsxs("div", { className: styles.componentCard, children: [_jsx("h6", { children: "\uD83D\uDCA1 DMX Channel Grid" }), _jsx("p", { children: "Visual grid of all 512 DMX channels" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Default Position:" }), " Floating"] }), _jsxs("li", { children: [_jsx("strong", { children: "Features:" }), " Channel selection, Value display"] }), _jsxs("li", { children: [_jsx("strong", { children: "Controls:" }), " Click to select, scroll to navigate"] })] })] }), _jsxs("div", { className: styles.componentCard, children: [_jsx("h6", { children: "\uD83C\uDFA8 Chromatic Energy Manipulator" }), _jsx("p", { children: "Advanced color and energy manipulation controls" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Default Position:" }), " Middle Left"] }), _jsxs("li", { children: [_jsx("strong", { children: "Features:" }), " Color picking, Energy levels"] }), _jsxs("li", { children: [_jsx("strong", { children: "Controls:" }), " Multi-parameter adjustment"] })] })] })] }), _jsxs("div", { className: styles.dockingZones, children: [_jsx("h5", { children: "\uD83C\uDFAF Docking Zones" }), _jsxs("div", { className: styles.zoneGrid, children: [_jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Top Left" }), _jsx("span", { className: styles.zoneSize, children: "200\u00D7150px" })] }), _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Top Center" }), _jsx("span", { className: styles.zoneSize, children: "300\u00D7100px" })] }), _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Top Right" }), _jsx("span", { className: styles.zoneSize, children: "200\u00D7150px" })] }), _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Left Center" }), _jsx("span", { className: styles.zoneSize, children: "150\u00D7200px" })] }), _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Right Center" }), _jsx("span", { className: styles.zoneSize, children: "150\u00D7200px" })] }), _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Bottom Left" }), _jsx("span", { className: styles.zoneSize, children: "200\u00D7150px" })] }), _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Bottom Center" }), _jsx("span", { className: styles.zoneSize, children: "300\u00D7100px" })] }), "                ", _jsxs("div", { className: styles.zoneItem, children: [_jsx("span", { className: styles.zoneName, children: "Bottom Right" }), _jsx("span", { className: styles.zoneSize, children: "200\u00D7150px" })] })] })] })] }));
            case 'tutorial':
                return (_jsxs("div", { className: styles.tabContent, children: [_jsx("h4", { children: "\uD83C\uDF93 Interactive Tutorial" }), tutorialStep !== null ? (_jsxs("div", { className: styles.tutorialActive, children: [_jsxs("div", { className: styles.tutorialProgress, children: [_jsx("div", { className: styles.progressBar, style: { width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` } }), _jsxs("span", { children: ["Step ", tutorialStep + 1, " of ", tutorialSteps.length] })] }), _jsxs("div", { className: styles.tutorialStep, children: [_jsx("h5", { children: tutorialSteps[tutorialStep].title }), _jsx("p", { children: tutorialSteps[tutorialStep].description }), _jsxs("div", { className: styles.tutorialControls, children: [_jsx("button", { onClick: endTutorial, className: styles.skipButton, children: "Skip Tutorial" }), _jsx("button", { onClick: nextTutorialStep, className: styles.nextButton, children: tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next' })] })] })] })) : (_jsxs("div", { className: styles.tutorialStart, children: [_jsxs("div", { className: styles.tutorialIntro, children: [_jsx("h5", { children: "Learn the Grid & Docking System" }), _jsx("p", { children: "This interactive tutorial will guide you through all the features of the grid and docking system, helping you become proficient with component management and layout organization." }), _jsxs("div", { className: styles.tutorialFeatures, children: [_jsxs("div", { className: styles.tutorialFeature, children: [_jsx("span", { className: styles.featureIcon, children: "\uD83D\uDCD0" }), _jsx("span", { children: "Grid system basics" })] }), _jsxs("div", { className: styles.tutorialFeature, children: [_jsx("span", { className: styles.featureIcon, children: "\uD83D\uDDB1\uFE0F" }), _jsx("span", { children: "Dragging and positioning" })] }), _jsxs("div", { className: styles.tutorialFeature, children: [_jsx("span", { className: styles.featureIcon, children: "\uD83C\uDFAF" }), _jsx("span", { children: "Docking zones" })] }), _jsxs("div", { className: styles.tutorialFeature, children: [_jsx("span", { className: styles.featureIcon, children: "\u2328\uFE0F" }), _jsx("span", { children: "Keyboard shortcuts" })] })] })] }), _jsx("button", { onClick: startTutorial, className: styles.startTutorialButton, children: "Start Tutorial" })] }))] }));
            case 'troubleshooting':
                return (_jsxs("div", { className: styles.tabContent, children: [_jsx("h4", { children: "\uD83D\uDD27 Troubleshooting & FAQ" }), _jsxs("div", { className: styles.troubleshootingSection, children: [_jsx("h5", { children: "\uD83D\uDEA8 Common Issues" }), _jsxs("div", { className: styles.troubleshootingItem, children: [_jsx("h6", { children: "Components won't snap to grid" }), _jsxs("p", { children: [_jsx("strong", { children: "Solution:" }), " Check that grid snapping is enabled (Ctrl+S) and you're dragging close enough to grid intersections (within 30% of grid size)."] })] }), _jsxs("div", { className: styles.troubleshootingItem, children: [_jsx("h6", { children: "Grid is not visible" }), _jsxs("p", { children: [_jsx("strong", { children: "Solution:" }), " Press Ctrl+G to toggle grid visibility, or enable it in the Grid Controls tab. Grid also appears temporarily during dragging."] })] }), _jsxs("div", { className: styles.troubleshootingItem, children: [_jsx("h6", { children: "Components disappear off screen" }), _jsxs("p", { children: [_jsx("strong", { children: "Solution:" }), " Components are constrained to keep at least 30% visible. Try refreshing the page to reset positions, or use dock zones to reposition."] })] }), _jsxs("div", { className: styles.troubleshootingItem, children: [_jsx("h6", { children: "Docking zones don't appear" }), _jsxs("p", { children: [_jsx("strong", { children: "Solution:" }), " Dock zones only appear while dragging components. Start dragging a component by its title bar to see the zones."] })] }), _jsxs("div", { className: styles.troubleshootingItem, children: [_jsx("h6", { children: "Keyboard shortcuts not working" }), _jsxs("p", { children: [_jsx("strong", { children: "Solution:" }), " Ensure the browser window has focus and no other input fields are active. Some shortcuts require Ctrl key."] })] })] }), _jsxs("div", { className: styles.troubleshootingSection, children: [_jsx("h5", { children: "\uD83D\uDCA1 Tips & Best Practices" }), _jsxs("div", { className: styles.tipsList, children: [_jsxs("div", { className: styles.tip, children: [_jsx("span", { className: styles.tipIcon, children: "\uD83D\uDCA1" }), _jsx("span", { children: "Use medium grid size (100px) for most layout tasks" })] }), _jsxs("div", { className: styles.tip, children: [_jsx("span", { className: styles.tipIcon, children: "\uD83D\uDCA1" }), _jsx("span", { children: "Enable grid snapping for precise alignment" })] }), _jsxs("div", { className: styles.tip, children: [_jsx("span", { className: styles.tipIcon, children: "\uD83D\uDCA1" }), _jsx("span", { children: "Use corner dock zones for permanent component placement" })] }), _jsxs("div", { className: styles.tip, children: [_jsx("span", { className: styles.tipIcon, children: "\uD83D\uDCA1" }), _jsx("span", { children: "Minimize components when not in use to save screen space" })] }), _jsxs("div", { className: styles.tip, children: [_jsx("span", { className: styles.tipIcon, children: "\uD83D\uDCA1" }), _jsx("span", { children: "Use the floating zone for temporary component positioning" })] })] })] }), _jsxs("div", { className: styles.troubleshootingSection, children: [_jsx("h5", { children: "\uD83D\uDCCA System Information" }), _jsxs("div", { className: styles.systemInfo, children: [_jsxs("div", { className: styles.infoItem, children: [_jsx("span", { children: "Grid Size Range:" }), _jsx("span", { children: "20px - 200px" })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { children: "Snap Threshold:" }), _jsx("span", { children: "30% of grid size" })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { children: "Dock Zone Threshold:" }), _jsx("span", { children: "100px from edge" })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { children: "Available Zones:" }), _jsx("span", { children: "8 dock zones + floating" })] })] })] })] }));
            case 'settings':
                return (_jsxs("div", { className: styles.tabContent, children: [_jsx("h4", { children: "\u2699\uFE0F Settings & Configuration" }), _jsxs("div", { className: styles.settingsSection, children: [_jsx("h5", { children: "\uD83D\uDCBE Export/Import Settings" }), _jsx("p", { children: "Save your grid configuration or load previously saved settings." }), _jsxs("div", { className: styles.settingsActions, children: [_jsx("button", { onClick: exportSettings, className: styles.exportButton, children: "\uD83D\uDCE4 Export Settings" }), _jsxs("label", { className: styles.importButton, children: ["\uD83D\uDCE5 Import Settings", _jsx("input", { type: "file", accept: ".json", onChange: importSettings, style: { display: 'none' } })] })] })] }), _jsxs("div", { className: styles.settingsSection, children: [_jsx("h5", { children: "\uD83D\uDD04 Reset Options" }), _jsx("p", { children: "Reset various aspects of the grid and docking system." }), _jsxs("div", { className: styles.resetActions, children: [_jsx("button", { onClick: () => {
                                                setGridSize(100);
                                                setGridSnappingEnabled(true);
                                                setShowGrid(false);
                                            }, className: styles.resetButton, children: "Reset Grid Settings" }), _jsx("button", { onClick: () => {
                                                localStorage.removeItem('docking-grid-size');
                                                localStorage.removeItem('docking-grid-snapping');
                                                localStorage.removeItem('docking-show-grid');
                                            }, className: styles.clearButton, children: "Clear Saved Settings" })] })] }), _jsxs("div", { className: styles.settingsSection, children: [_jsx("h5", { children: "\uD83D\uDCC8 Performance" }), _jsx("p", { children: "Current performance and system status." }), _jsxs("div", { className: styles.performanceInfo, children: [_jsxs("div", { className: styles.performanceItem, children: [_jsx("span", { children: "Active Components:" }), _jsx("span", { children: Object.keys(state.components).length })] }), _jsxs("div", { className: styles.performanceItem, children: [_jsx("span", { children: "Grid Calculations:" }), _jsx("span", { children: state.gridSnappingEnabled ? 'Active' : 'Disabled' })] }), _jsxs("div", { className: styles.performanceItem, children: [_jsx("span", { children: "Drag State:" }), _jsx("span", { children: state.isDragging ? 'Active' : 'Idle' })] })] })] })] }));
            default:
                return _jsx("div", { children: "Select a tab to view content" });
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { className: styles.helpButton, onClick: () => setIsVisible(!isVisible), title: "Show Grid & Docking System Help (Ctrl+H)", children: _jsx("i", { className: "fas fa-question-circle" }) }), isVisible && (_jsx("div", { className: styles.helpOverlay, onClick: (e) => e.target === e.currentTarget && setIsVisible(false), children: _jsxs("div", { className: styles.helpContent, children: [_jsxs("div", { className: styles.helpHeader, children: [_jsxs("div", { className: styles.headerLeft, children: [_jsx("h3", { children: "\uD83C\uDFAF Grid & Docking System Help" }), _jsxs("div", { className: styles.searchContainer, children: [_jsx("input", { ref: searchInputRef, type: "text", placeholder: "Search help content... (Ctrl+/)", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: styles.searchInput }), _jsx("i", { className: "fas fa-search" })] })] }), _jsx("button", { onClick: () => setIsVisible(false), className: styles.closeButton, title: "Close Help (Esc)", children: _jsx("i", { className: "fas fa-times" }) })] }), _jsx("div", { className: styles.helpTabs, children: tabs.map(tab => (_jsxs("button", { className: `${styles.tab} ${activeTab === tab.id ? styles.active : ''}`, onClick: () => setActiveTab(tab.id), children: [_jsx("span", { className: styles.tabIcon, children: tab.icon }), _jsx("span", { className: styles.tabLabel, children: tab.label })] }, tab.id))) }), _jsx("div", { className: styles.helpBody, children: renderTabContent() }), _jsxs("div", { className: styles.helpFooter, children: [_jsx("div", { className: styles.footerInfo, children: _jsxs("span", { children: ["\uD83D\uDCA1 Press ", _jsx("kbd", { children: "Ctrl+H" }), " to toggle this help anytime"] }) }), _jsx("div", { className: styles.footerActions, children: _jsx("button", { onClick: startTutorial, className: styles.tutorialShortcut, children: "\uD83C\uDF93 Start Tutorial" }) })] })] }) }))] }));
};
