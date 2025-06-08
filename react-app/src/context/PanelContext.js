import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
const PanelContext = createContext(undefined);
const getDefaultLayout = () => ({
    'top-left': {
        components: [
            {
                id: 'default-master-fader',
                type: 'master-fader',
                title: 'Master Slider',
                props: { isDockable: false }
            },
            {
                id: 'default-scene-control',
                type: 'scene-quick-launch',
                title: 'Scene Control',
                props: { isDockable: false }
            }
        ]
    },
    'top-right': {
        components: [
            {
                id: 'default-dmx-visualizer',
                type: 'dmx-visualizer',
                title: 'DMX Visual Display',
                props: {}
            }
        ]
    },
    'bottom': {
        components: [
            {
                id: 'default-dmx-control',
                type: 'dmx-control-panel',
                title: 'DMX Control Panel',
                props: {}
            },
            {
                id: 'default-fixture-control',
                type: 'chromatic-energy-manipulator',
                title: 'Fixture Control',
                props: { isDockable: false }
            }
        ]
    },
    'external': {
        components: [
            {
                id: 'default-touch-interface',
                type: 'audio-control-panel',
                title: 'Touchscreen Interface',
                props: { touchOptimized: true }
            }
        ]
    }, splitterPositions: {
        horizontal: 50,
        vertical: 70 // 70% top, 30% bottom
    }
});
const getBlankLayout = () => ({
    'top-left': { components: [] },
    'top-right': { components: [] },
    'bottom': { components: [] },
    'external': { components: [] },
    splitterPositions: {
        horizontal: 50,
        vertical: 70
    }
});
export const PanelProvider = ({ children }) => {
    const [layout, setLayout] = useState(() => {
        const saved = localStorage.getItem('artbastard-panel-layout');
        if (saved) {
            try {
                const parsedLayout = JSON.parse(saved);
                // Ensure all required panel IDs exist with proper structure
                const defaultLayout = getDefaultLayout();
                const safeLayout = {
                    ...defaultLayout,
                    ...parsedLayout,
                    'top-left': { components: [], ...defaultLayout['top-left'], ...parsedLayout['top-left'] },
                    'top-right': { components: [], ...defaultLayout['top-right'], ...parsedLayout['top-right'] },
                    'bottom': { components: [], ...defaultLayout['bottom'], ...parsedLayout['bottom'] },
                    'external': { components: [], ...defaultLayout['external'], ...parsedLayout['external'] },
                    splitterPositions: { ...defaultLayout.splitterPositions, ...parsedLayout.splitterPositions }
                };
                return safeLayout;
            }
            catch (error) {
                console.warn('Failed to parse saved panel layout, using defaults', error);
            }
        }
        return getDefaultLayout();
    });
    // Save layout to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('artbastard-panel-layout', JSON.stringify(layout));
    }, [layout]);
    const addComponentToPanel = useCallback((panelId, component) => {
        setLayout(prev => ({
            ...prev,
            [panelId]: {
                ...prev[panelId],
                components: [...prev[panelId].components, component]
            }
        }));
    }, []);
    const removeComponentFromPanel = useCallback((panelId, componentId) => {
        setLayout(prev => ({
            ...prev,
            [panelId]: {
                ...prev[panelId],
                components: prev[panelId].components.filter(c => c.id !== componentId)
            }
        }));
    }, []);
    const moveComponent = useCallback((fromPanel, toPanel, componentId) => {
        setLayout(prev => {
            const component = prev[fromPanel].components.find(c => c.id === componentId);
            if (!component)
                return prev;
            return {
                ...prev,
                [fromPanel]: {
                    ...prev[fromPanel],
                    components: prev[fromPanel].components.filter(c => c.id !== componentId)
                },
                [toPanel]: {
                    ...prev[toPanel],
                    components: [...prev[toPanel].components, component]
                }
            };
        });
    }, []);
    const updateComponent = useCallback((panelId, componentId, updates) => {
        setLayout(prev => ({
            ...prev,
            [panelId]: {
                ...prev[panelId],
                components: prev[panelId].components.map(c => c.id === componentId ? { ...c, ...updates } : c)
            }
        }));
    }, []);
    const updateSplitterPosition = useCallback((type, position) => {
        setLayout(prev => ({
            ...prev,
            splitterPositions: {
                ...prev.splitterPositions,
                [type]: Math.max(10, Math.min(90, position)) // Constrain between 10% and 90%
            }
        }));
    }, []);
    const saveLayout = useCallback((name) => {
        const savedLayouts = JSON.parse(localStorage.getItem('artbastard-saved-layouts') || '{}');
        savedLayouts[name] = layout;
        localStorage.setItem('artbastard-saved-layouts', JSON.stringify(savedLayouts));
    }, [layout]);
    const loadLayout = useCallback((name) => {
        const savedLayouts = JSON.parse(localStorage.getItem('artbastard-saved-layouts') || '{}');
        if (savedLayouts[name]) {
            // Ensure loaded layout has all required panels with proper structure
            const defaultLayout = getDefaultLayout();
            const loadedLayout = savedLayouts[name];
            const safeLayout = {
                ...defaultLayout,
                ...loadedLayout,
                'top-left': { components: [], ...defaultLayout['top-left'], ...loadedLayout['top-left'] },
                'top-right': { components: [], ...defaultLayout['top-right'], ...loadedLayout['top-right'] },
                'bottom': { components: [], ...defaultLayout['bottom'], ...loadedLayout['bottom'] },
                'fourth': { components: [], ...defaultLayout['fourth'], ...loadedLayout['fourth'] },
                'external': { components: [], ...defaultLayout['external'], ...loadedLayout['external'] },
                splitterPositions: { ...defaultLayout.splitterPositions, ...loadedLayout.splitterPositions }
            };
            setLayout(safeLayout);
        }
    }, []);
    const getSavedLayouts = useCallback(() => {
        const savedLayouts = JSON.parse(localStorage.getItem('artbastard-saved-layouts') || '{}');
        return Object.keys(savedLayouts);
    }, []);
    const deleteLayout = useCallback((name) => {
        const savedLayouts = JSON.parse(localStorage.getItem('artbastard-saved-layouts') || '{}');
        delete savedLayouts[name];
        localStorage.setItem('artbastard-saved-layouts', JSON.stringify(savedLayouts));
    }, []);
    const resetLayout = useCallback(() => {
        setLayout(getDefaultLayout());
    }, []);
    const loadBlankLayout = useCallback(() => {
        setLayout(getBlankLayout());
    }, []);
    const contextValue = {
        layout,
        addComponentToPanel,
        removeComponentFromPanel,
        moveComponent,
        updateComponent,
        updateSplitterPosition,
        saveLayout,
        loadLayout,
        getSavedLayouts,
        deleteLayout,
        resetLayout,
        loadBlankLayout,
    };
    return (_jsx(PanelContext.Provider, { value: contextValue, children: children }));
};
export const usePanels = () => {
    const context = useContext(PanelContext);
    if (context === undefined) {
        throw new Error('usePanels must be used within a PanelProvider');
    }
    return context;
};
export default PanelProvider;
