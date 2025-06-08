import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
const PinningContext = createContext(undefined);
export const PinningProvider = ({ children }) => {
    // Default all components to pinned for immediate visibility
    const getDefaultPinState = () => ({
        'master-fader': true,
        'scene-auto': true,
        'chromatic-energy-manipulator': true,
        'scene-quick-launch': true,
        'quick-capture': true,
    });
    const [pinningState, setPinningState] = useState(() => {
        // Load from localStorage or use defaults
        const saved = localStorage.getItem('artbastard-pinning-state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all components have a state
                return { ...getDefaultPinState(), ...parsed };
            }
            catch (error) {
                console.warn('Failed to parse saved pinning state, using defaults');
                return getDefaultPinState();
            }
        }
        return getDefaultPinState();
    });
    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('artbastard-pinning-state', JSON.stringify(pinningState));
    }, [pinningState]);
    const isPinned = useCallback((componentId) => {
        return pinningState[componentId] ?? true; // Default to pinned
    }, [pinningState]);
    const togglePin = useCallback((componentId) => {
        setPinningState(prev => ({
            ...prev,
            [componentId]: !prev[componentId]
        }));
    }, []);
    const setPinned = useCallback((componentId, pinned) => {
        setPinningState(prev => ({
            ...prev,
            [componentId]: pinned
        }));
    }, []);
    const pinAllComponents = useCallback(() => {
        const allPinned = {};
        Object.keys(getDefaultPinState()).forEach(key => {
            allPinned[key] = true;
        });
        setPinningState(allPinned);
    }, []);
    const unpinAllComponents = useCallback(() => {
        const allUnpinned = {};
        Object.keys(getDefaultPinState()).forEach(key => {
            allUnpinned[key] = false;
        });
        setPinningState(allUnpinned);
    }, []);
    const getPinnedComponents = useCallback(() => {
        return Object.entries(pinningState)
            .filter(([_, pinned]) => pinned)
            .map(([componentId, _]) => componentId);
    }, [pinningState]);
    const contextValue = {
        isPinned,
        togglePin,
        setPinned,
        pinAllComponents,
        unpinAllComponents,
        getPinnedComponents,
    };
    return (_jsx(PinningContext.Provider, { value: contextValue, children: children }));
};
export const usePinning = () => {
    const context = useContext(PinningContext);
    if (context === undefined) {
        throw new Error('usePinning must be used within a PinningProvider');
    }
    return context;
};
export default PinningProvider;
