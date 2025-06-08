import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import useStoreUtils from '../../store/storeUtils';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useChromaticEnergyManipulatorSettings } from '../../context/ChromaticEnergyManipulatorContext';
import { getVersionDisplay, getBuildInfo } from '../../utils/version'; // Added getBuildInfo
import { ReleaseNotes } from './ReleaseNotes';
import styles from './Settings.module.scss';
export const Settings = () => {
    const { theme, setTheme, darkMode, toggleDarkMode } = useTheme();
    const { socket, connected } = useSocket();
    const { settings: chromaticSettings, updateSettings: updateChromaticSettings } = useChromaticEnergyManipulatorSettings();
    const { artNetConfig, fixtures, masterSliders, midiMappings, navVisibility = {
        main: true,
        midiOsc: true,
        fixture: true,
        scenes: true,
        audio: true,
        touchosc: true,
        misc: true
    }, debugTools = {
        debugButton: true,
        midiMonitor: true,
        oscMonitor: true
    }, addNotification } = useStore(state => ({
        artNetConfig: state.artNetConfig,
        fixtures: state.fixtures,
        masterSliders: state.masterSliders,
        midiMappings: state.midiMappings,
        navVisibility: state.navVisibility,
        debugTools: state.debugTools,
        addNotification: state.addNotification
    }));
    // Settings state
    const [artNetSettings, setArtNetSettings] = useState({ ...artNetConfig });
    const [webPort, setWebPort] = useState(3000);
    const [debugModules, setDebugModules] = useState({
        midi: false,
        osc: false,
        artnet: false,
        button: true // Added debug button visibility toggle
    });
    const [exportInProgress, setExportInProgress] = useState(false);
    const [importInProgress, setImportInProgress] = useState(false);
    const [touchOscExportInProgress, setTouchOscExportInProgress] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logError, setLogError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [showReleaseNotes, setShowReleaseNotes] = useState(false);
    const [localNavVisibility, setLocalNavVisibility] = useState(navVisibility);
    const [localDebugTools, setLocalDebugTools] = useState(debugTools);
    // Effect for log fetching
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/logs');
                if (!response.ok)
                    throw new Error('Failed to fetch logs');
                const text = await response.text();
                setLogs(text.split('\n').filter(Boolean));
                setLogError(null);
            }
            catch (error) {
                setLogError(error instanceof Error ? error.message : 'Failed to fetch logs');
            }
        };
        fetchLogs();
        let interval;
        if (autoRefresh) {
            interval = window.setInterval(fetchLogs, 5000);
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [autoRefresh]);
    const handleClearLogs = async () => {
        try {
            const response = await fetch('/api/logs/clear', { method: 'POST' });
            if (!response.ok)
                throw new Error('Failed to clear logs');
            setLogs([]);
            addNotification({
                message: 'Logs cleared successfully',
                type: 'success'
            });
        }
        catch (error) {
            addNotification({
                message: 'Failed to clear logs',
                type: 'error'
            });
        }
    };
    const [touchOscExportOptions, setTouchOscExportOptions] = useState({
        resolution: 'phone_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false,
    });
    // Theme change handlers
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        addNotification({
            message: `Theme changed to ${newTheme}`,
            type: 'success'
        });
    };
    const handleDarkModeToggle = () => {
        toggleDarkMode();
        addNotification({
            message: darkMode ? 'Light mode enabled' : 'Dark mode enabled',
            type: 'success'
        });
    };
    // Factory reset handler
    const handleFactoryReset = async () => {
        if (window.confirm('Are you sure you want to reset all settings to factory defaults? This cannot be undone.')) {
            try {
                // Clear localStorage
                localStorage.clear();
                // Clear server-side scenes
                await fetch('/api/scenes', { method: 'DELETE' });
                // Reset store to initial state (including scenes and auto-scene settings)
                useStoreUtils.setState({
                    artNetConfig: {
                        ip: '192.168.1.199',
                        subnet: 0,
                        universe: 0,
                    },
                    fixtures: [],
                    scenes: [],
                    masterSliders: [],
                    midiMappings: {},
                    theme: 'standard',
                    darkMode: true,
                    debugModules: {
                        midi: false,
                        osc: false,
                        artnet: false
                    },
                    // Reset auto-scene settings to defaults
                    autoSceneEnabled: false,
                    autoSceneList: [],
                    autoSceneMode: 'forward',
                    autoSceneCurrentIndex: -1,
                    autoScenePingPongDirection: 'forward',
                    autoSceneBeatDivision: 4,
                    autoSceneManualBpm: 120,
                    autoSceneTapTempoBpm: 120,
                    autoSceneLastTapTime: 0,
                    autoSceneTapTimes: [],
                    autoSceneTempoSource: 'internal_clock',
                    autoSceneIsFlashing: false,
                    navVisibility: {
                        main: true,
                        midiOsc: true,
                        fixture: true,
                        scenes: true,
                        audio: true,
                        touchosc: true,
                        misc: true
                    },
                    debugTools: {
                        debugButton: true,
                        midiMonitor: true,
                        oscMonitor: true
                    }
                });
                // Reset local state
                setWebPort(3000);
                setDebugModules({
                    midi: false,
                    osc: false,
                    artnet: false,
                    button: true
                });
                setLocalNavVisibility({
                    main: true,
                    midiOsc: true,
                    fixture: true,
                    scenes: true,
                    audio: true,
                    touchosc: true,
                    misc: true
                });
                setLocalDebugTools({
                    debugButton: true,
                    midiMonitor: true,
                    oscMonitor: true
                });
                updateChromaticSettings({
                    enableKeyboardShortcuts: true,
                    autoSelectFirstFixture: true,
                    showQuickActions: false,
                    defaultColorPresets: ['Red', 'Green', 'Blue', 'White', 'Yellow', 'Cyan', 'Magenta', 'Off'],
                    enableErrorMessages: true,
                    autoUpdateRate: 50,
                    enableAnimations: true,
                    compactMode: false
                });
                // Show success message
                addNotification({
                    message: 'All settings have been reset to factory defaults, including scenes',
                    type: 'success'
                });
                // Reload the page to apply all changes
                window.location.reload();
            }
            catch (error) {
                console.error('Error during factory reset:', error);
                addNotification({
                    message: 'Factory reset completed with some errors. Please check that all scenes were cleared.',
                    type: 'warning'
                });
                // Still reload the page even if there were errors
                window.location.reload();
            }
        }
    };
    // Export settings handler
    const handleExportSettings = () => {
        try {
            const settings = {
                theme,
                darkMode,
                webPort,
                debugModules,
                artNetConfig,
                midiMappings,
                fixtures,
                masterSliders,
                navVisibility: localNavVisibility,
                debugTools: localDebugTools,
                chromaticEnergyManipulator: chromaticSettings
            };
            const settingsJson = JSON.stringify(settings, null, 2);
            const blob = new Blob([settingsJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'artbastard-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addNotification({
                message: 'Settings exported successfully',
                type: 'success'
            });
        }
        catch (error) {
            addNotification({
                message: 'Failed to export settings',
                type: 'error'
            });
        }
    };
    // Import settings handler
    const handleImportSettings = async (event) => {
        try {
            const file = event.target.files?.[0];
            if (!file)
                return;
            const text = await file.text();
            const settings = JSON.parse(text); // Update store with imported settings
            useStoreUtils.setState({
                artNetConfig: settings.artNetConfig,
                fixtures: settings.fixtures,
                masterSliders: settings.masterSliders,
                midiMappings: settings.midiMappings,
                theme: settings.theme,
                darkMode: settings.darkMode,
                navVisibility: settings.navVisibility,
                debugTools: settings.debugTools
            });
            // Update state
            setWebPort(settings.webPort);
            setDebugModules(settings.debugModules);
            setLocalNavVisibility(settings.navVisibility);
            setLocalDebugTools(settings.debugTools);
            if (settings.chromaticEnergyManipulator) {
                updateChromaticSettings(settings.chromaticEnergyManipulator);
            }
            addNotification({
                message: 'Settings imported successfully',
                type: 'success'
            });
            // Reload to apply changes
            window.location.reload();
        }
        catch (error) {
            addNotification({
                message: 'Failed to import settings',
                type: 'error'
            });
        }
    }; // Debug module toggle handler
    const toggleDebugModule = (module) => {
        const newValue = !debugModules[module];
        // Update local state
        setDebugModules(prev => ({
            ...prev,
            [module]: newValue
        }));
        // Save to localStorage
        const savedDebugModules = JSON.parse(localStorage.getItem('debugModules') || '{}');
        localStorage.setItem('debugModules', JSON.stringify({
            ...savedDebugModules,
            [module]: newValue
        }));
        // Update application state
        if (module === 'midi' || module === 'osc' || module === 'artnet') {
            // Update store state if it's available
            const updateDebugModules = useStore.getState().updateDebugModules;
            if (updateDebugModules) {
                updateDebugModules({
                    ...debugModules,
                    [module]: newValue
                });
            }
        }
        // Get a display-friendly module name
        const moduleDisplayName = String(module).charAt(0).toUpperCase() + String(module).slice(1);
        // Show notification
        addNotification({
            message: `${moduleDisplayName} debug ${newValue ? 'enabled' : 'disabled'}`,
            type: 'info'
        });
    };
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/logs');
                if (!response.ok)
                    throw new Error('Failed to fetch logs');
                const data = await response.text();
                setLogs(data.split('\n').filter(Boolean));
                setLogError(null);
            }
            catch (error) {
                setLogError(error instanceof Error ? error.message : 'Failed to fetch logs');
            }
        };
        fetchLogs();
        let interval;
        if (autoRefresh) {
            interval = window.setInterval(fetchLogs, 5000);
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [autoRefresh]);
    // Function to update navigation visibility
    const handleNavVisibilityChange = (item) => {
        const newValue = !localNavVisibility[item];
        setLocalNavVisibility(prev => ({
            ...prev,
            [item]: newValue
        }));
        useStoreUtils.setState(state => ({
            ...state,
            navVisibility: {
                ...state.navVisibility,
                [item]: newValue
            }
        }));
    };
    // Function to update debug tools visibility
    const handleDebugToolsChange = (tool) => {
        const newValue = !localDebugTools[tool];
        setLocalDebugTools(prev => ({
            ...prev,
            [tool]: newValue
        }));
        useStoreUtils.setState(state => ({
            ...state,
            debugTools: {
                ...state.debugTools,
                [tool]: newValue
            }
        }));
    };
    return (_jsxs("div", { className: styles.settings, children: [_jsxs("h2", { className: styles.sectionTitle, children: [theme === 'artsnob' && 'Configuration Sanctuary', theme === 'standard' && 'Settings', theme === 'minimal' && 'Config'] }), _jsxs("div", { className: styles.settingsGrid, children: ["        ", _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "Navigation Menu Items" }) }), _jsx("div", { className: styles.cardBody, children: _jsx("div", { className: styles.toggleGrid, children: Object.entries(localNavVisibility).map(([key, value]) => (_jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: `nav-${key}`, checked: value, onChange: () => handleNavVisibilityChange(key) }), _jsx("label", { htmlFor: `nav-${key}`, className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${value ? 'fa-eye' : 'fa-eye-slash'}` }) }) }), _jsx("span", { className: styles.toggleText, children: key === 'main' ? 'Main Control' :
                                                        key === 'midiOsc' ? 'MIDI/OSC Setup' :
                                                            key === 'fixture' ? 'Fixture Setup' :
                                                                key === 'scenes' ? 'Scenes' :
                                                                    key === 'audio' ? 'Audio' :
                                                                        key === 'touchosc' ? 'TouchOSC' :
                                                                            key === 'misc' ? 'Settings' :
                                                                                key })] }) }, key))) }) })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "Debug Tools Visibility" }) }), _jsx("div", { className: styles.cardBody, children: _jsx("div", { className: styles.toggleGrid, children: Object.entries(localDebugTools).map(([key, value]) => (_jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: `debug-${key}`, checked: value, onChange: () => handleDebugToolsChange(key) }), _jsx("label", { htmlFor: `debug-${key}`, className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${value ? 'fa-bug' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: key === 'debugButton' ? 'Debug Button' :
                                                        key === 'midiMonitor' ? 'MIDI Monitor' :
                                                            key === 'oscMonitor' ? 'OSC Monitor' :
                                                                key })] }) }, key))) }) }), "        "] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "ChromaticEnergyManipulator Settings" }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.toggleGrid, children: [_jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "chromatic-keyboard-shortcuts", checked: chromaticSettings.enableKeyboardShortcuts, onChange: (e) => updateChromaticSettings({
                                                                enableKeyboardShortcuts: e.target.checked
                                                            }) }), _jsx("label", { htmlFor: "chromatic-keyboard-shortcuts", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${chromaticSettings.enableKeyboardShortcuts ? 'fa-keyboard' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: "Keyboard Shortcuts" })] }) }), _jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "chromatic-auto-select", checked: chromaticSettings.autoSelectFirstFixture, onChange: (e) => updateChromaticSettings({
                                                                autoSelectFirstFixture: e.target.checked
                                                            }) }), _jsx("label", { htmlFor: "chromatic-auto-select", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${chromaticSettings.autoSelectFirstFixture ? 'fa-mouse-pointer' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: "Auto-select First Fixture" })] }) }), _jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "chromatic-quick-actions", checked: chromaticSettings.showQuickActions, onChange: (e) => updateChromaticSettings({
                                                                showQuickActions: e.target.checked
                                                            }) }), _jsx("label", { htmlFor: "chromatic-quick-actions", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${chromaticSettings.showQuickActions ? 'fa-bolt' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: "Show Quick Actions" })] }) }), _jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "chromatic-error-messages", checked: chromaticSettings.enableErrorMessages, onChange: (e) => updateChromaticSettings({
                                                                enableErrorMessages: e.target.checked
                                                            }) }), _jsx("label", { htmlFor: "chromatic-error-messages", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${chromaticSettings.enableErrorMessages ? 'fa-exclamation-triangle' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: "Show Error Messages" })] }) }), _jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "chromatic-animations", checked: chromaticSettings.enableAnimations, onChange: (e) => updateChromaticSettings({
                                                                enableAnimations: e.target.checked
                                                            }) }), _jsx("label", { htmlFor: "chromatic-animations", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${chromaticSettings.enableAnimations ? 'fa-magic' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: "Enable Animations" })] }) }), _jsx("div", { className: styles.toggleItem, children: _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "chromatic-compact-mode", checked: chromaticSettings.compactMode, onChange: (e) => updateChromaticSettings({
                                                                compactMode: e.target.checked
                                                            }) }), _jsx("label", { htmlFor: "chromatic-compact-mode", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${chromaticSettings.compactMode ? 'fa-compress' : 'fa-times'}` }) }) }), _jsx("span", { className: styles.toggleText, children: "Compact Mode" })] }) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "chromatic-update-rate", children: "Auto Update Rate (ms)" }), _jsx("input", { type: "number", id: "chromatic-update-rate", value: chromaticSettings.autoUpdateRate, onChange: (e) => updateChromaticSettings({
                                                    autoUpdateRate: Math.max(10, Math.min(1000, Number(e.target.value)))
                                                }), min: 10, max: 1000, step: 10 }), _jsx("small", { children: "Lower values = faster updates, higher CPU usage (10-1000ms)" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Default Color Presets" }), _jsx("div", { className: styles.colorPresetGrid, children: ['Red', 'Green', 'Blue', 'White', 'Yellow', 'Cyan', 'Magenta', 'Orange', 'Purple', 'Warm White', 'Cool White', 'Off'].map(color => (_jsxs("div", { className: styles.colorPresetItem, children: [_jsx("input", { type: "checkbox", id: `preset-${color}`, checked: chromaticSettings.defaultColorPresets.includes(color), onChange: (e) => {
                                                                if (e.target.checked) {
                                                                    updateChromaticSettings({
                                                                        defaultColorPresets: [...chromaticSettings.defaultColorPresets, color]
                                                                    });
                                                                }
                                                                else {
                                                                    updateChromaticSettings({
                                                                        defaultColorPresets: chromaticSettings.defaultColorPresets.filter(c => c !== color)
                                                                    });
                                                                }
                                                            } }), _jsx("label", { htmlFor: `preset-${color}`, className: styles.colorPresetLabel, children: color })] }, color))) })] })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "Theme Settings" }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.themeOptions, children: [_jsxs("div", { className: `${styles.themeOption} ${theme === 'artsnob' ? styles.active : ''}`, onClick: () => handleThemeChange('artsnob'), children: [_jsxs("div", { className: styles.themePreview, "data-theme": "artsnob", children: [_jsx("div", { className: styles.themePreviewHeader }), _jsxs("div", { className: styles.themePreviewBody, children: [_jsx("div", { className: styles.themePreviewLine }), _jsx("div", { className: styles.themePreviewLine })] })] }), _jsx("span", { className: styles.themeName, children: "Art Snob" })] }), _jsxs("div", { className: `${styles.themeOption} ${theme === 'standard' ? styles.active : ''}`, onClick: () => handleThemeChange('standard'), children: [_jsxs("div", { className: styles.themePreview, "data-theme": "standard", children: [_jsx("div", { className: styles.themePreviewHeader }), _jsxs("div", { className: styles.themePreviewBody, children: [_jsx("div", { className: styles.themePreviewLine }), _jsx("div", { className: styles.themePreviewLine })] })] }), _jsx("span", { className: styles.themeName, children: "Standard" })] }), _jsxs("div", { className: `${styles.themeOption} ${theme === 'minimal' ? styles.active : ''}`, onClick: () => handleThemeChange('minimal'), children: [_jsxs("div", { className: styles.themePreview, "data-theme": "minimal", children: [_jsx("div", { className: styles.themePreviewHeader }), _jsxs("div", { className: styles.themePreviewBody, children: [_jsx("div", { className: styles.themePreviewLine }), _jsx("div", { className: styles.themePreviewLine })] })] }), _jsx("span", { className: styles.themeName, children: "Minimal" })] })] }), _jsxs("div", { className: styles.toggleSwitch, children: [_jsx("input", { type: "checkbox", id: "darkMode", checked: darkMode, onChange: handleDarkModeToggle }), _jsx("label", { htmlFor: "darkMode", className: styles.toggleLabel, children: _jsx("span", { className: styles.toggleDot, children: _jsx("i", { className: `fas ${darkMode ? 'fa-moon' : 'fa-sun'}` }) }) }), _jsx("span", { className: styles.toggleText, children: darkMode ? 'Dark Mode' : 'Light Mode' })] })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "Additional Settings" }) }), _jsxs("div", { className: styles.cardBody, children: ["            ", _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "webPort", children: "Web Port" }), _jsx("input", { type: "number", id: "webPort", value: webPort, onChange: (e) => setWebPort(Number(e.target.value)), min: 1, max: 65535 })] })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "Configuration Management" }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.configActions, children: [_jsxs("button", { className: styles.secondaryButton, onClick: handleExportSettings, children: [_jsx("i", { className: "fas fa-download" }), _jsx("span", { children: "Export Settings" })] }), _jsxs("label", { className: styles.secondaryButton, children: [_jsx("input", { type: "file", accept: ".json", style: { display: 'none' }, onChange: handleImportSettings }), _jsx("i", { className: "fas fa-upload" }), _jsx("span", { children: "Import Settings" })] }), _jsxs("button", { className: styles.dangerButton, onClick: handleFactoryReset, children: [_jsx("i", { className: "fas fa-trash-alt" }), _jsx("span", { children: "Factory Reset" })] })] }), _jsxs("div", { className: styles.configNote, children: [_jsx("i", { className: "fas fa-info-circle" }), _jsx("p", { children: "Exporting saves all your settings to a file that you can backup or transfer to another device. Factory reset will remove all settings and return to defaults." })] })] })] }), "        ", _jsxs("div", { className: styles.card, children: ["          ", _jsxs("div", { className: styles.cardHeader, children: [_jsx("h3", { children: "ArtNet Configuration" }), _jsxs("div", { className: styles.cardDescription, children: [_jsx("i", { className: "fas fa-info-circle" }), _jsx("span", { children: "Configure Art-Net network settings for DMX transmission" })] })] }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.formGrid, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "artnet-ip", children: "IP Address" }), _jsxs("div", { className: styles.inputWithAction, children: [_jsx("input", { id: "artnet-ip", type: "text", value: artNetSettings.ip, onChange: (e) => setArtNetSettings({
                                                                    ...artNetSettings,
                                                                    ip: e.target.value
                                                                }), placeholder: "192.168.1.99" }), "                  ", _jsxs("button", { className: `${styles.actionButton} ${!connected ? styles.disabled : ''}`, onClick: () => {
                                                                    if (connected && socket) {
                                                                        socket.emit('pingArtNetDevice', { ip: artNetSettings.ip });
                                                                        addNotification({
                                                                            message: `Pinging ${artNetSettings.ip}...`,
                                                                            type: 'info'
                                                                        });
                                                                    }
                                                                    else {
                                                                        addNotification({
                                                                            message: 'Cannot ping: Not connected to server',
                                                                            type: 'error'
                                                                        });
                                                                    }
                                                                }, disabled: !connected, title: connected ? "Ping device to verify connectivity" : "Server connection required", children: [_jsx("i", { className: "fas fa-satellite-dish" }), _jsx("span", { children: "Ping" })] })] }), _jsx("small", { className: styles.formHint, children: "Default for most Art-Net devices: 192.168.1.99" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "artnet-subnet", children: "Subnet" }), _jsx("input", { id: "artnet-subnet", type: "number", min: "0", max: "15", value: artNetSettings.subnet, onChange: (e) => setArtNetSettings({
                                                            ...artNetSettings,
                                                            subnet: parseInt(e.target.value)
                                                        }) }), _jsx("small", { children: "Range: 0-15" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "artnet-universe", children: "Universe" }), _jsx("input", { id: "artnet-universe", type: "number", min: "0", max: "15", value: artNetSettings.universe, onChange: (e) => setArtNetSettings({
                                                            ...artNetSettings,
                                                            universe: parseInt(e.target.value)
                                                        }) }), _jsx("small", { children: "Range: 0-15" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "artnet-port", children: "Port" }), _jsx("input", { id: "artnet-port", type: "number", min: "1024", max: "65535", value: artNetSettings.port, onChange: (e) => setArtNetSettings({
                                                            ...artNetSettings,
                                                            port: parseInt(e.target.value)
                                                        }) }), _jsx("small", { children: "Default: 6454" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "artnet-refresh", children: "Refresh Rate (ms)" }), _jsx("input", { id: "artnet-refresh", type: "number", min: "20", max: "5000", value: artNetSettings.base_refresh_interval, onChange: (e) => setArtNetSettings({
                                                            ...artNetSettings,
                                                            base_refresh_interval: parseInt(e.target.value)
                                                        }) }), _jsx("small", { children: "Lower values = faster updates, higher CPU usage" })] })] }), _jsxs("div", { className: styles.buttonRow, children: [_jsxs("button", { className: styles.primaryButton, onClick: () => {
                                                    useStore.getState().updateArtNetConfig(artNetSettings);
                                                }, children: [_jsx("i", { className: "fas fa-save" }), _jsx("span", { children: "Save ArtNet Settings" })] }), _jsxs("button", { className: styles.secondaryButton, onClick: () => {
                                                    useStore.getState().testArtNetConnection();
                                                }, children: [_jsx("i", { className: "fas fa-plug" }), _jsx("span", { children: "Test Connection" })] })] })] })] }), _jsxs("div", { className: `${styles.card} ${styles.logViewerCard}`, children: [_jsx("div", { className: styles.cardHeader, children: _jsx("h3", { children: "System Logs" }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.logControls, children: [_jsxs("button", { className: styles.refreshButton, onClick: () => setAutoRefresh(!autoRefresh), children: [_jsx("i", { className: `fas ${autoRefresh ? 'fa-pause' : 'fa-play'}` }), autoRefresh ? 'Pause Auto-Refresh' : 'Enable Auto-Refresh'] }), _jsxs("button", { className: styles.clearButton, onClick: handleClearLogs, children: [_jsx("i", { className: "fas fa-eraser" }), "Clear Logs"] })] }), _jsx("div", { className: styles.logContent, children: logError ? (_jsxs("div", { className: styles.logError, children: [_jsx("i", { className: "fas fa-exclamation-circle" }), logError] })) : logs.length === 0 ? (_jsxs("div", { className: styles.emptyLogs, children: [_jsx("i", { className: "fas fa-info-circle" }), "No logs available"] })) : (logs.map((log, index) => (_jsx("pre", { children: log }, index)))) })] })] })] }), "        ", _jsxs("div", { className: styles.manifestoSection, children: [_jsx("h3", { children: "\u26A1 ArtBastard DMX512 \u26A1" }), _jsxs("div", { className: styles.manifestoSummary, children: [_jsx("strong", { children: "Professional lighting control meets artistic expression." }), " ArtBastard DMX512 is an open-source lighting controller that bridges technical precision with creative freedom. Control up to 512 DMX channels, design dynamic scenes, and synchronize with MIDI/OSC for live performances."] }), _jsxs("div", { className: styles.techTable, children: [_jsx("div", { className: styles.techTableHeader, children: "\uD83D\uDD27 Technical Specifications" }), _jsxs("div", { className: styles.techTableBody, children: [_jsxs("div", { className: styles.techRow, children: [_jsxs("div", { className: `${styles.techCell} ${styles.techLabel}`, children: [_jsx("i", { className: "fas fa-layer-group" }), "Frontend"] }), _jsx("div", { className: `${styles.techCell} ${styles.techValue}`, children: "React 18 + TypeScript" })] }), _jsxs("div", { className: styles.techRow, children: [_jsxs("div", { className: `${styles.techCell} ${styles.techLabel}`, children: [_jsx("i", { className: "fas fa-server" }), "Backend"] }), _jsx("div", { className: `${styles.techCell} ${styles.techValue}`, children: "Node.js + Express" })] }), _jsxs("div", { className: styles.techRow, children: [_jsxs("div", { className: `${styles.techCell} ${styles.techLabel}`, children: [_jsx("i", { className: "fas fa-network-wired" }), "Protocols"] }), _jsx("div", { className: `${styles.techCell} ${styles.techValue}`, children: "DMX512 \u2022 ArtNet \u2022 MIDI \u2022 OSC" })] }), _jsxs("div", { className: styles.techRow, children: [_jsxs("div", { className: `${styles.techCell} ${styles.techLabel}`, children: [_jsx("i", { className: "fas fa-sync-alt" }), "Real-time"] }), _jsx("div", { className: `${styles.techCell} ${styles.techValue}`, children: "Socket.IO WebSockets" })] }), _jsxs("div", { className: styles.techRow, children: [_jsxs("div", { className: `${styles.techCell} ${styles.techLabel}`, children: [_jsx("i", { className: "fas fa-palette" }), "Rendering"] }), _jsx("div", { className: `${styles.techCell} ${styles.techValue}`, children: "WebGL + Canvas2D" })] }), _jsxs("div", { className: styles.techRow, children: [_jsxs("div", { className: `${styles.techCell} ${styles.techLabel}`, children: [_jsx("i", { className: "fas fa-wave-square" }), "Audio"] }), _jsx("div", { className: `${styles.techCell} ${styles.techValue}`, children: "Web Audio API" })] })] })] }), "          ", _jsxs("div", { className: styles.versionSection, children: [_jsxs("div", { className: styles.versionInfo, children: ["Version", _jsx("span", { className: styles.versionNumber, children: getVersionDisplay() }), _jsxs("button", { className: styles.releaseNotesButton, onClick: () => setShowReleaseNotes(true), title: "View detailed release notes and version history", children: [_jsx("i", { className: "fas fa-info-circle" }), "Release Notes"] })] }), _jsxs("div", { className: styles.licenseInfo, children: [_jsx("span", { className: styles.copyleft, children: "\u25C4\u25C4\u25C4" }), "Released under Creative Commons Zero (CC0) \u2014 Free and open source for everyone.", _jsx("br", {}), _jsx("small", { children: getBuildInfo() })] })] }), _jsxs("div", { className: styles.manifestoCreed, children: [_jsx("h2", { children: "\u2727 Ethereal Manifesto & Cosmic Creed \u2727" }), _jsxs("p", { children: ["From the celestial depths of digital realms, we, the ethereal architects of illumination, present ArtBastard DMX512 \u2014 a transcendent vessel for the manipulation of photonic energies. Version ", getVersionDisplay(), ", forged in the quantum fires of artistic rebellion."] }), _jsxs("p", { children: ["\u26A1 Our Creed \u26A1", _jsx("br", {}), "We dance with electrons, sculpt with wavelengths, and paint with pure energy.", _jsx("br", {}), "Through the ancient protocol of DMX, we bridge dimensions of creativity and control.", _jsx("br", {}), "Let those who seek mere illumination step aside \u2014", _jsx("br", {}), "For we are the light-shapers, the masters of luminous expression,", _jsx("br", {}), "Channeling the very essence of artistry through 512 channels of infinite possibility."] })] })] }), _jsx(ReleaseNotes, { showModal: showReleaseNotes, onClose: () => setShowReleaseNotes(false) })] }));
};
