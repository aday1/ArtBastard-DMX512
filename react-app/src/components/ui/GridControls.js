import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useDocking } from '@/context/DockingContext';
import './GridControls.module.scss';
export const GridControls = () => {
    const { state, setGridSize, setGridSnappingEnabled, setShowGrid, } = useDocking();
    const [isExpanded, setIsExpanded] = useState(false);
    const handleGridSizeChange = (e) => {
        const size = parseInt(e.target.value, 10);
        if (size >= 20 && size <= 200) {
            setGridSize(size);
        }
    };
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    return (_jsxs("div", { className: `grid-controls ${isExpanded ? 'expanded' : 'collapsed'}`, children: [_jsxs("button", { className: "grid-controls-toggle", onClick: toggleExpanded, title: "Grid Settings", children: [_jsx("i", { className: "fas fa-th" }), isExpanded && _jsx("span", { children: "Grid" })] }), isExpanded && (_jsxs("div", { className: "grid-controls-panel", children: [_jsx("div", { className: "grid-control-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: state.showGrid, onChange: (e) => setShowGrid(e.target.checked) }), _jsx("span", { children: "Show Grid" })] }) }), _jsx("div", { className: "grid-control-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: state.gridSnappingEnabled, onChange: (e) => setGridSnappingEnabled(e.target.checked) }), _jsx("span", { children: "Snap to Grid" })] }) }), _jsxs("div", { className: "grid-control-group", children: ["            ", _jsxs("label", { children: [_jsxs("span", { children: ["Grid Size: ", state.gridSize, "px"] }), _jsx("input", { type: "range", min: "20", max: "200", step: "10", value: state.gridSize, onChange: handleGridSizeChange, className: "grid-size-slider" })] })] }), "          ", _jsxs("div", { className: "grid-presets", children: [_jsx("span", { className: "presets-label", children: "Presets:" }), _jsxs("div", { className: "preset-buttons", children: [_jsx("button", { onClick: () => setGridSize(40), className: state.gridSize === 40 ? 'active' : '', children: "40px" }), _jsx("button", { onClick: () => setGridSize(80), className: state.gridSize === 80 ? 'active' : '', children: "80px" }), _jsx("button", { onClick: () => setGridSize(120), className: state.gridSize === 120 ? 'active' : '', children: "120px" }), _jsx("button", { onClick: () => setGridSize(160), className: state.gridSize === 160 ? 'active' : '', children: "160px" })] })] })] }))] }));
};
