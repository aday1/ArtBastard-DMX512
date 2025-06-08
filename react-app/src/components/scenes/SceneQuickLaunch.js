import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { DockableComponent } from '@/components/ui/DockableComponent';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './SceneQuickLaunch.module.scss';
export const SceneQuickLaunch = ({ isCollapsed = false, onCollapsedChange, isDockable = true, }) => {
    const [activeSceneId, setActiveSceneId] = useState(null);
    // Get scenes and actions from store
    const { scenes, loadScene, saveScene, deleteScene } = useStore(state => ({
        scenes: state.scenes,
        loadScene: state.loadScene,
        saveScene: state.saveScene,
        deleteScene: state.deleteScene
    }));
    const handleSceneActivate = async (sceneName) => {
        try {
            loadScene(sceneName);
            setActiveSceneId(sceneName);
            useStore.getState().addNotification({
                message: `Scene "${sceneName}" activated ✨`,
                type: 'success',
                priority: 'normal'
            });
        }
        catch (error) {
            console.error('Failed to activate scene:', error);
        }
    };
    const handleQuickCapture = () => {
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
        const quickName = `Quick_${timestamp}`;
        saveScene(quickName, `/scene/${quickName.toLowerCase()}`);
        useStore.getState().addNotification({ message: `Scene quick saved as "${quickName}" 📸`,
            type: 'success',
            priority: 'normal',
            dismissible: true
        });
    };
    const handleQuickDelete = () => {
        if (!activeSceneId)
            return;
        if (window.confirm(`Are you sure you want to delete scene "${activeSceneId}"?`)) {
            deleteScene(activeSceneId);
            useStore.getState().addNotification({ message: `Scene "${activeSceneId}" deleted 🗑️`,
                type: 'success',
                priority: 'normal',
                dismissible: true
            });
            setActiveSceneId(null);
        }
    };
    const handleToggleCollapsed = () => {
        const newCollapsed = !isCollapsed;
        onCollapsedChange?.(newCollapsed);
    };
    const renderContent = () => {
        if (scenes.length === 0) {
            return (_jsxs("div", { className: styles.empty, children: [_jsx("p", { children: "No scenes available" }), _jsx("small", { children: "Create scenes in the Scene Manager" })] }));
        }
        return (_jsx("div", { className: styles.sceneGrid, children: scenes.map((scene) => (_jsxs("button", { className: `${styles.sceneButton} ${scene.name === activeSceneId ? styles.active : ''}`, onClick: () => handleSceneActivate(scene.name), title: scene.oscAddress || scene.name, children: [_jsx("div", { className: styles.sceneName, children: scene.name }), scene.name === activeSceneId && (_jsx("div", { className: styles.activeIndicator, children: "\u25CF" }))] }, scene.name))) }));
    };
    const content = (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.header, children: [_jsx("h3", { className: styles.title, children: "Quick Launch" }), _jsxs("div", { className: styles.headerControls, children: [_jsx("button", { className: styles.quickCaptureButton, onClick: handleQuickCapture, title: "Quick capture current DMX state \uD83D\uDCF8", "aria-label": "Quick capture current DMX state", children: _jsx(LucideIcon, { name: "Camera", size: 16 }) }), _jsx("button", { className: styles.quickDeleteButton, onClick: handleQuickDelete, disabled: !activeSceneId, title: activeSceneId ? `Delete scene "${activeSceneId}" 🗑️` : "Select a scene to delete", "aria-label": activeSceneId ? `Delete scene ${activeSceneId}` : "Delete scene button disabled", children: _jsx(LucideIcon, { name: "Trash", size: 16 }) }), _jsx("button", { className: styles.collapseButton, onClick: handleToggleCollapsed, "aria-label": isCollapsed ? 'Expand' : 'Collapse', children: _jsx(LucideIcon, { name: isCollapsed ? 'ChevronDown' : 'ChevronUp', size: 16 }) })] })] }), !isCollapsed && (_jsx("div", { className: styles.content, children: renderContent() }))] }));
    if (!isDockable) {
        return (_jsx("div", { className: styles.container, children: content }));
    }
    return (_jsx(DockableComponent, { id: "scene-quick-launch", title: "Scene Quick Launch", component: "midi-clock", defaultPosition: { zone: 'top-right' }, isCollapsed: isCollapsed, onCollapsedChange: onCollapsedChange, width: "280px", height: "auto", className: styles.container, isDraggable: true, children: content }));
};
