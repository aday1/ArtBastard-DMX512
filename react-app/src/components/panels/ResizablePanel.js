import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback, useState } from 'react';
import { usePanels } from '../../context/PanelContext';
import { renderComponent } from './ComponentRegistry';
import styles from './ResizablePanel.module.scss';
export const ResizablePanel = ({ panelId, title, className = '', onDrop }) => {
    const { layout, removeComponentFromPanel, updateComponent } = usePanels();
    const [isDragOver, setIsDragOver] = useState(false);
    const panelRef = useRef(null);
    const panelState = layout[panelId];
    // Safety check: if panelState is undefined, initialize with empty components
    const safeComponents = panelState?.components || [];
    // Debug logging to help identify the issue
    if (!panelState) {
        console.warn(`ResizablePanel: panelState is undefined for panelId: ${panelId}`, { layout, panelId });
    }
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (onDrop) {
            onDrop(e);
        }
    }, [onDrop]);
    const handleRemoveComponent = useCallback((componentId) => {
        removeComponentFromPanel(panelId, componentId);
    }, [panelId, removeComponentFromPanel]);
    return (_jsxs("div", { ref: panelRef, className: `${styles.panel} ${className} ${isDragOver ? styles.dragOver : ''}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("h3", { className: styles.panelTitle, children: [_jsx("i", { className: "fas fa-th-large" }), title] }), "        ", _jsx("div", { className: styles.panelControls, children: _jsxs("span", { className: styles.componentCount, children: [safeComponents.length, " components"] }) })] }), "      ", _jsx("div", { className: styles.panelContent, children: safeComponents.length === 0 ? (_jsxs("div", { className: styles.emptyPanel, children: [_jsx("i", { className: "fas fa-plus-circle" }), _jsx("p", { children: "Drag components here" }), _jsx("small", { children: "Drop UI components to build your interface" })] })) : (_jsx("div", { className: styles.componentGrid, children: safeComponents.map((component) => (_jsxs("div", { className: styles.componentWrapper, children: [_jsxs("div", { className: styles.componentHeader, children: [_jsx("span", { className: styles.componentTitle, children: component.title }), _jsx("button", { className: styles.removeButton, onClick: () => handleRemoveComponent(component.id), title: `Remove ${component.title}`, children: _jsx("i", { className: "fas fa-times" }) })] }), _jsx("div", { className: styles.componentContent, children: renderComponent(component.type, component.props) })] }, component.id))) })) })] }));
};
export default ResizablePanel;
