import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const defaultSettings = {
    enableKeyboardShortcuts: true,
    autoSelectFirstFixture: true,
    showQuickActions: false,
    defaultColorPresets: ['Red', 'Green', 'Blue', 'White', 'Yellow', 'Cyan', 'Magenta', 'Off'],
    enableErrorMessages: true,
    autoUpdateRate: 50,
    enableAnimations: true,
    compactMode: false,
};
const ChromaticEnergyManipulatorContext = createContext(undefined);
export const ChromaticEnergyManipulatorProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('chromaticEnergyManipulatorSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...defaultSettings, ...parsed });
            }
            catch (error) {
                console.warn('Failed to parse saved ChromaticEnergyManipulator settings:', error);
            }
        }
    }, []);
    // Save settings to localStorage when changed
    useEffect(() => {
        localStorage.setItem('chromaticEnergyManipulatorSettings', JSON.stringify(settings));
    }, [settings]);
    const updateSettings = (updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };
    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('chromaticEnergyManipulatorSettings');
    };
    const value = {
        settings,
        updateSettings,
        resetSettings,
    };
    return (_jsx(ChromaticEnergyManipulatorContext.Provider, { value: value, children: children }));
};
export const useChromaticEnergyManipulatorSettings = () => {
    const context = useContext(ChromaticEnergyManipulatorContext);
    if (context === undefined) {
        throw new Error('useChromaticEnergyManipulatorSettings must be used within a ChromaticEnergyManipulatorProvider');
    }
    return context;
};
