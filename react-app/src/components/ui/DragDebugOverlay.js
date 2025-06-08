import { jsxs as _jsxs } from "react/jsx-runtime";
import { useDocking } from '@/context/DockingContext';
export const DragDebugOverlay = () => {
    const { state } = useDocking();
    if (!state.isDragging) {
        return null;
    }
    return (_jsxs("div", { style: {
            position: 'fixed',
            top: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 20000,
            pointerEvents: 'none',
        }, children: [_jsxs("div", { children: ["\uD83C\uDFAF Dragging: ", state.draggedComponentId] }), _jsxs("div", { children: ["\uD83D\uDCCF Grid: ", state.gridSize, "px"] }), _jsxs("div", { children: ["\uD83E\uDDF2 Snap: ", state.gridSnappingEnabled ? 'ON' : 'OFF'] }), _jsxs("div", { children: ["\uD83D\uDC41\uFE0F Grid Visible: ", state.showGrid || state.showGridTemporarily ? 'YES' : 'NO'] }), _jsxs("div", { children: ["\u26A1 Dock Zones: ", state.showDockZones ? 'VISIBLE' : 'HIDDEN'] })] }));
};
