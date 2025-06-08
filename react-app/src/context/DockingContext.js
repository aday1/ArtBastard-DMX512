import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const DockingContext = createContext(null);
export const useDocking = () => {
    const context = useContext(DockingContext);
    if (!context) {
        throw new Error('useDocking must be used within a DockingProvider');
    }
    return context;
};
export const DockingProvider = ({ children }) => {
    // Load persisted grid settings
    const loadGridSettings = () => {
        const savedGridSize = localStorage.getItem('docking-grid-size');
        const savedGridSnapping = localStorage.getItem('docking-grid-snapping');
        const savedShowGrid = localStorage.getItem('docking-show-grid');
        return {
            gridSize: savedGridSize ? parseInt(savedGridSize, 10) : 120,
            gridSnappingEnabled: savedGridSnapping ? savedGridSnapping === 'true' : true,
            showGrid: savedShowGrid ? savedShowGrid === 'true' : false,
        };
    };
    const gridSettings = loadGridSettings();
    const [state, setState] = useState({
        components: {},
        isDragging: false,
        draggedComponentId: null,
        showDockZones: false,
        showGridTemporarily: false,
        ...gridSettings,
    });
    const registerComponent = useCallback((component) => {
        setState(prev => ({
            ...prev,
            components: {
                ...prev.components,
                [component.id]: component,
            },
        }));
    }, []);
    const unregisterComponent = useCallback((id) => {
        setState(prev => {
            const { [id]: removed, ...rest } = prev.components;
            return {
                ...prev,
                components: rest,
            };
        });
    }, []);
    const updateComponentPosition = useCallback((id, position) => {
        setState(prev => ({
            ...prev,
            components: {
                ...prev.components,
                [id]: {
                    ...prev.components[id],
                    position,
                },
            },
        }));
        // Persist position to localStorage
        localStorage.setItem(`docking-${id}-position`, JSON.stringify(position));
    }, []);
    const updateComponentCollapsed = useCallback((id, isCollapsed) => {
        setState(prev => ({
            ...prev,
            components: {
                ...prev.components,
                [id]: {
                    ...prev.components[id],
                    isCollapsed,
                },
            },
        }));
        // Persist collapsed state to localStorage
        localStorage.setItem(`docking-${id}-collapsed`, JSON.stringify(isCollapsed));
    }, []);
    const startDrag = useCallback((componentId) => {
        setState(prev => ({
            ...prev,
            isDragging: true,
            draggedComponentId: componentId,
            showDockZones: true,
            showGridTemporarily: prev.gridSnappingEnabled, // Show grid during dragging if snapping is enabled
        }));
    }, []);
    const endDrag = useCallback(() => {
        setState(prev => ({
            ...prev,
            isDragging: false,
            draggedComponentId: null,
            showDockZones: false,
            showGridTemporarily: false, // Hide temporary grid when dragging ends
        }));
    }, []);
    const setShowDockZones = useCallback((show) => {
        setState(prev => ({
            ...prev,
            showDockZones: show,
        }));
    }, []);
    const getDockZoneForPosition = useCallback((x, y) => {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        const threshold = 150; // Increased from 100 to 150 for easier docking
        // Corner zones (priority) - larger areas for easier targeting
        if (x < threshold && y < threshold)
            return 'top-left';
        if (x > viewport.width - threshold && y < threshold)
            return 'top-right';
        if (x < threshold && y > viewport.height - threshold)
            return 'bottom-left';
        if (x > viewport.width - threshold && y > viewport.height - threshold)
            return 'bottom-right';
        // Edge zones - larger snap areas
        if (y < threshold)
            return 'top-center';
        if (y > viewport.height - threshold)
            return 'bottom-center';
        if (x < threshold)
            return 'left-center';
        if (x > viewport.width - threshold)
            return 'right-center';
        return null; // Floating
    }, []);
    const getComponentsByZone = useCallback((zone) => {
        return Object.values(state.components).filter(comp => comp.position.zone === zone);
    }, [state.components]);
    const bringToFront = useCallback((id) => {
        setState(prev => {
            const maxZIndex = Math.max(...Object.values(prev.components).map(c => c.zIndex));
            return {
                ...prev,
                components: {
                    ...prev.components,
                    [id]: {
                        ...prev.components[id],
                        zIndex: maxZIndex + 1,
                    },
                },
            };
        });
    }, []); // Grid snapping functions
    const setGridSize = useCallback((size) => {
        setState(prev => ({
            ...prev,
            gridSize: Math.max(20, Math.min(200, size)), // Expanded range: 20-200px for fewer lines
        }));
        // Persist to localStorage
        localStorage.setItem('docking-grid-size', size.toString());
    }, []);
    const setGridSnappingEnabled = useCallback((enabled) => {
        setState(prev => ({
            ...prev,
            gridSnappingEnabled: enabled,
        }));
        // Persist to localStorage
        localStorage.setItem('docking-grid-snapping', enabled.toString());
    }, []);
    const setShowGrid = useCallback((show) => {
        setState(prev => ({
            ...prev,
            showGrid: show,
        }));
        // Persist to localStorage
        localStorage.setItem('docking-show-grid', show.toString());
    }, []);
    const snapToGrid = useCallback((value) => {
        if (!state.gridSnappingEnabled)
            return value;
        return Math.round(value / state.gridSize) * state.gridSize;
    }, [state.gridSize, state.gridSnappingEnabled]);
    const snapPositionToGrid = useCallback((x, y) => {
        if (!state.gridSnappingEnabled) {
            return { x, y };
        }
        return {
            x: Math.round(x / state.gridSize) * state.gridSize,
            y: Math.round(y / state.gridSize) * state.gridSize,
        };
    }, [state.gridSize, state.gridSnappingEnabled]);
    const shouldSnapToGrid = useCallback((currentX, currentY) => {
        if (!state.gridSnappingEnabled)
            return false;
        const snapThreshold = state.gridSize * 0.3; // 30% of grid size
        const snappedPos = snapPositionToGrid(currentX, currentY);
        const deltaX = Math.abs(currentX - snappedPos.x);
        const deltaY = Math.abs(currentY - snappedPos.y);
        return deltaX <= snapThreshold || deltaY <= snapThreshold;
    }, [state.gridSize, state.gridSnappingEnabled, snapPositionToGrid]);
    const contextValue = {
        state,
        registerComponent,
        unregisterComponent,
        updateComponentPosition,
        updateComponentCollapsed,
        startDrag,
        endDrag,
        setShowDockZones,
        getDockZoneForPosition,
        getComponentsByZone,
        bringToFront,
        setGridSize,
        setGridSnappingEnabled,
        setShowGrid,
        snapToGrid,
        snapPositionToGrid,
        shouldSnapToGrid,
    };
    return (_jsx(DockingContext.Provider, { value: contextValue, children: children }));
};
