import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from 'react';
import { usePanels } from '../../context/PanelContext';
import ResizablePanel from './ResizablePanel';
import { ComponentToolbar } from './ComponentToolbar';
import styles from './PanelLayout.module.scss';
export const PanelLayout = () => {
    const { layout, addComponentToPanel, updateSplitterPosition } = usePanels();
    const [isDragging, setIsDragging] = useState(null);
    const layoutRef = useRef(null);
    const handleDrop = useCallback((panelId) => (e) => {
        e.preventDefault();
        try {
            const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
            // Generate unique ID for component instance
            const componentId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newComponent = {
                id: componentId,
                type: componentData.type,
                title: componentData.title,
                props: componentData.defaultProps || {},
            };
            addComponentToPanel(panelId, newComponent);
        }
        catch (error) {
            console.error('Failed to parse dropped component data:', error);
        }
    }, [addComponentToPanel]);
    const handleMouseDown = useCallback((type) => (e) => {
        e.preventDefault();
        setIsDragging(type);
    }, []);
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !layoutRef.current)
            return;
        const rect = layoutRef.current.getBoundingClientRect();
        if (isDragging === 'horizontal') {
            const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
            updateSplitterPosition('horizontal', newPosition);
        }
        else if (isDragging === 'vertical') {
            const newPosition = ((e.clientY - rect.top) / rect.height) * 100;
            updateSplitterPosition('vertical', newPosition);
        }
    }, [isDragging, updateSplitterPosition]);
    const handleMouseUp = useCallback(() => {
        setIsDragging(null);
    }, []);
    const { horizontal, vertical } = layout.splitterPositions;
    return (_jsxs("div", { className: styles.layoutContainer, children: [_jsx(ComponentToolbar, {}), _jsxs("div", { ref: layoutRef, className: styles.panelLayout, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, children: [_jsxs("div", { className: styles.topSection, style: { height: `${vertical}%` }, children: [_jsx("div", { className: styles.topLeft, style: { width: `${horizontal}%` }, children: _jsx(ResizablePanel, { panelId: "top-left", title: "Left Panel", className: styles.topLeftPanel, onDrop: handleDrop('top-left') }) }), _jsx("div", { className: `${styles.splitter} ${styles.horizontalSplitter}`, onMouseDown: handleMouseDown('horizontal'), children: _jsx("div", { className: styles.splitterHandle, children: _jsx("i", { className: "fas fa-grip-lines-vertical" }) }) }), _jsx("div", { className: styles.topRight, style: { width: `${100 - horizontal}%` }, children: _jsx(ResizablePanel, { panelId: "top-right", title: "Right Panel", className: styles.topRightPanel, onDrop: handleDrop('top-right') }) })] }), _jsx("div", { className: `${styles.splitter} ${styles.verticalSplitter}`, onMouseDown: handleMouseDown('vertical'), children: _jsx("div", { className: styles.splitterHandle, children: _jsx("i", { className: "fas fa-grip-lines" }) }) }), _jsx("div", { className: styles.bottomSection, style: { height: `${100 - vertical}%` }, children: _jsx(ResizablePanel, { panelId: "bottom", title: "Bottom Panel", className: styles.bottomPanel, onDrop: handleDrop('bottom') }) })] })] }));
};
export default PanelLayout;
