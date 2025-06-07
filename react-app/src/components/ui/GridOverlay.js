import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDocking } from '@/context/DockingContext';
import './GridOverlay.module.scss';
export const GridOverlay = () => {
    const { state } = useDocking();
    // Show grid when explicitly enabled or temporarily during dragging
    if (!state.showGrid && !state.showGridTemporarily) {
        return null;
    }
    const { gridSize } = state;
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // Determine opacity based on whether grid is temporarily shown or permanently enabled
    const gridOpacity = state.showGridTemporarily ? 0.6 : 0.3;
    // Calculate grid lines
    const verticalLines = [];
    const horizontalLines = [];
    // Vertical lines
    for (let x = 0; x <= viewport.width; x += gridSize) {
        verticalLines.push(x);
    }
    // Horizontal lines
    for (let y = 0; y <= viewport.height; y += gridSize) {
        horizontalLines.push(y);
    }
    return (_jsx("div", { className: "grid-overlay", children: _jsxs("svg", { width: viewport.width, height: viewport.height, style: {
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 1,
                opacity: gridOpacity,
            }, children: [_jsx("defs", { children: _jsx("pattern", { id: "grid", width: gridSize, height: gridSize, patternUnits: "userSpaceOnUse", children: _jsx("path", { d: `M ${gridSize} 0 L 0 0 0 ${gridSize}`, fill: "none", stroke: "rgba(255, 255, 255, 0.2)", strokeWidth: "1" }) }) }), _jsx("rect", { width: "100%", height: "100%", fill: "url(#grid)" }), verticalLines
                    .filter((_, index) => index % 5 === 0)
                    .map((x) => (_jsx("line", { x1: x, y1: 0, x2: x, y2: viewport.height, stroke: "rgba(255, 255, 255, 0.4)", strokeWidth: "1" }, `v-major-${x}`))), horizontalLines
                    .filter((_, index) => index % 5 === 0)
                    .map((y) => (_jsx("line", { x1: 0, y1: y, x2: viewport.width, y2: y, stroke: "rgba(255, 255, 255, 0.4)", strokeWidth: "1" }, `h-major-${y}`)))] }) }));
};
