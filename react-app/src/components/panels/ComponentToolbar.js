import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { COMPONENT_REGISTRY, getAllCategories, getComponentsByCategory } from './ComponentRegistry';
import { usePanels } from '../../context/PanelContext';
import styles from './ComponentToolbar.module.scss';
const DraggableComponent = ({ definition }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDragStart = (e) => {
        setIsDragging(true);
        e.dataTransfer.setData('application/json', JSON.stringify(definition));
        e.dataTransfer.effectAllowed = 'copy';
    };
    const handleDragEnd = () => {
        setIsDragging(false);
    };
    return (_jsxs("div", { className: `${styles.draggableComponent} ${isDragging ? styles.dragging : ''}`, draggable: true, onDragStart: handleDragStart, onDragEnd: handleDragEnd, title: definition.description, children: [_jsx("div", { className: styles.componentIcon, children: _jsx("i", { className: definition.icon }) }), _jsxs("div", { className: styles.componentInfo, children: [_jsx("div", { className: styles.componentTitle, children: definition.title }), _jsx("div", { className: styles.componentCategory, children: definition.category })] })] }));
};
export const ComponentToolbar = () => {
    const [selectedCategory, setSelectedCategory] = useState('dmx');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { saveLayout, loadLayout, getSavedLayouts, deleteLayout, resetLayout, loadBlankLayout } = usePanels();
    const [layoutName, setLayoutName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const categories = getAllCategories();
    const savedLayouts = getSavedLayouts();
    // Priority order for components
    const priorityComponents = [
        'master-fader',
        'dmx-control-panel',
        'dmx-channels',
        'dmx-visualizer',
        'scene-quick-launch',
        'chromatic-energy-manipulator'
    ];
    const getCategoryDisplayName = (category) => {
        const names = {
            'dmx': 'DMX Controls',
            'scenes': 'Scene Control',
            'fixtures': 'Fixtures',
            'midi': 'MIDI',
            'osc': 'OSC',
            'audio': 'Audio',
            'setup': 'Setup'
        };
        return names[category] || category;
    };
    const getFilteredComponents = () => {
        let components;
        if (selectedCategory === 'all') {
            components = Object.values(COMPONENT_REGISTRY);
        }
        else {
            components = getComponentsByCategory(selectedCategory);
        }
        // Sort components by priority for better UX
        return components.sort((a, b) => {
            const aIndex = priorityComponents.indexOf(a.type);
            const bIndex = priorityComponents.indexOf(b.type);
            // Priority components come first
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            else if (aIndex !== -1) {
                return -1;
            }
            else if (bIndex !== -1) {
                return 1;
            }
            // Then sort alphabetically
            return a.title.localeCompare(b.title);
        });
    };
    const handleSaveLayout = () => {
        if (layoutName.trim()) {
            saveLayout(layoutName.trim());
            setLayoutName('');
            setShowSaveDialog(false);
        }
    };    const handleLoadLayout = (name) => {
        loadLayout(name);
    };
    const handleDeleteLayout = (name) => {
        deleteLayout(name);
        setDeleteConfirm(null);
    };
    const handleLoadBlankLayout = () => {
        loadBlankLayout();
    };
    return (_jsxs("div", { className: `${styles.componentToolbar} ${isCollapsed ? styles.collapsed : ''}`, children: [_jsxs("div", { className: styles.toolbarHeader, children: [_jsxs("h3", { className: styles.toolbarTitle, children: [_jsx("i", { className: "fas fa-toolbox" }), "Component Toolbar"] }), _jsx("div", { className: styles.toolbarControls, children: _jsx("button", { className: styles.collapseButton, onClick: () => setIsCollapsed(!isCollapsed), title: isCollapsed ? 'Expand toolbar' : 'Collapse toolbar', children: _jsx("i", { className: `fas fa-chevron-${isCollapsed ? 'down' : 'up'}` }) }) })] }), !isCollapsed && (_jsxs("div", { className: styles.toolbarContent, children: [_jsxs("div", { className: styles.layoutControls, children: [_jsxs("div", { className: styles.controlGroup, children: [_jsxs("button", { className: styles.controlButton, onClick: () => setShowSaveDialog(!showSaveDialog), title: "Save current layout", children: [_jsx("i", { className: "fas fa-save" }), "Save Layout"] }), _jsxs("button", { className: styles.controlButton, onClick: resetLayout, title: "Reset to default layout", children: [_jsx("i", { className: "fas fa-undo" }), "Reset"] })] }), showSaveDialog && (_jsxs("div", { className: styles.saveDialog, children: [_jsx("input", { type: "text", placeholder: "Layout name...", value: layoutName, onChange: (e) => setLayoutName(e.target.value), className: styles.layoutNameInput }), _jsx("button", { onClick: handleSaveLayout, disabled: !layoutName.trim(), className: styles.saveButton, children: "Save" })] })), (savedLayouts.length > 0 || true) && (_jsxs("div", { className: styles.savedLayouts, children: [_jsx("label", { children: "Available Layouts:" }), _jsx("div", { className: styles.layoutList, children: [
                  /* Blank Layout - always first */
                  _jsx("div", { className: styles.layoutItem, children: _jsx("button", { 
                    onClick: handleLoadBlankLayout, 
                    className: `${styles.layoutButton} ${styles.blankLayoutButton}`, 
                    title: "Load blank layout", 
                    children: [_jsx("i", { className: "fas fa-file" }), "Blank Layout"] 
                  }) }),
                  /* Saved Layouts */
                  ...savedLayouts.map(name => (_jsx("div", { className: styles.layoutItem, children: [
                    _jsx("button", { 
                      onClick: () => handleLoadLayout(name), 
                      className: styles.layoutButton, 
                      title: `Load ${name} layout`, 
                      children: [_jsx("i", { className: "fas fa-folder-open" }), name] 
                    }),
                    _jsx("button", { 
                      onClick: () => setDeleteConfirm(name), 
                      className: styles.deleteButton, 
                      title: `Delete ${name} layout`, 
                      children: _jsx("i", { className: "fas fa-trash" }) 
                    })
                  ] }, name)))
                ] })] }))] }), _jsxs("div", { className: styles.categoryFilter, children: [_jsx("label", { children: "Category:" }), _jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: styles.categorySelect, children: [_jsx("option", { value: "all", children: "All Components" }), categories.map(category => (_jsx("option", { value: category, children: category.toUpperCase() }, category)))] })] }), _jsxs("div", { className: styles.componentList, children: [_jsx("div", { className: styles.listHeader, children: _jsx("span", { children: "Drag components to panels:" }) }), _jsx("div", { className: styles.components, children: getFilteredComponents().map(definition => (_jsx(DraggableComponent, { definition: definition }, definition.type))) })] })] }))] })), deleteConfirm && (_jsx("div", { className: styles.deleteConfirmDialog, children: _jsx("div", { className: styles.confirmContent, children: [_jsx("p", { children: `Delete layout "${deleteConfirm}"?` }), _jsx("div", { className: styles.confirmButtons, children: [_jsx("button", { onClick: () => handleDeleteLayout(deleteConfirm), className: styles.confirmDeleteButton, children: "Delete" }), _jsx("button", { onClick: () => setDeleteConfirm(null), className: styles.cancelButton, children: "Cancel" })] })] }) }));
};
export default ComponentToolbar;
