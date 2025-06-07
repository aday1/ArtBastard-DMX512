import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useDocking } from '@/context/DockingContext';
import { SnapIndicator } from './SnapIndicator';
export const DockableComponent = ({ id, title, component, children, className = '', style = {}, defaultPosition = { zone: 'floating', offset: { x: 0, y: 0 } }, defaultZIndex = 1000, isCollapsed = false, onCollapsedChange, width = 'auto', height = 'auto', isDraggable = true, isMinimized = false, onMinimizedChange, showMinimizeButton = true, }) => {
    const dragControls = useDragControls();
    const componentRef = useRef(null);
    const [localMinimized, setLocalMinimized] = useState(isMinimized);
    const [currentDragPosition, setCurrentDragPosition] = useState(null);
    const [showSnapIndicator, setShowSnapIndicator] = useState(false);
    const { registerComponent, unregisterComponent, updateComponentPosition, updateComponentCollapsed, startDrag, endDrag, getDockZoneForPosition, bringToFront, state, snapPositionToGrid, shouldSnapToGrid, } = useDocking();
    // Get component from docking state
    const dockedComponent = state.components[id];
    useEffect(() => {
        // Load saved position and collapsed state from localStorage
        const savedPosition = localStorage.getItem(`docking-${id}-position`);
        const savedCollapsed = localStorage.getItem(`docking-${id}-collapsed`);
        const savedMinimized = localStorage.getItem(`docking-${id}-minimized`);
        const position = savedPosition ? JSON.parse(savedPosition) : defaultPosition;
        const collapsed = savedCollapsed ? JSON.parse(savedCollapsed) : isCollapsed;
        const minimized = savedMinimized ? JSON.parse(savedMinimized) : isMinimized;
        // Register component with docking system
        registerComponent({
            id,
            title,
            position,
            zIndex: defaultZIndex,
            isCollapsed: collapsed,
            component,
        });
        // Set initial minimized state
        setLocalMinimized(minimized);
        // Call callbacks if needed
        if (onCollapsedChange && collapsed !== isCollapsed) {
            onCollapsedChange(collapsed);
        }
        if (onMinimizedChange && minimized !== isMinimized) {
            onMinimizedChange(minimized);
        }
        return () => {
            unregisterComponent(id);
        };
    }, [id, title, component, defaultPosition, defaultZIndex, registerComponent, unregisterComponent, isCollapsed, onCollapsedChange, isMinimized, onMinimizedChange]);
    // Update collapsed state when it changes externally
    useEffect(() => {
        if (dockedComponent && dockedComponent.isCollapsed !== isCollapsed) {
            updateComponentCollapsed(id, isCollapsed);
        }
    }, [isCollapsed, dockedComponent, updateComponentCollapsed, id]);
    // Update minimized state when it changes externally
    useEffect(() => {
        setLocalMinimized(isMinimized);
    }, [isMinimized]);
    const getDragConstraints = () => {
        const componentElement = componentRef.current;
        if (!componentElement) {
            return {
                left: -150,
                top: -50,
                right: window.innerWidth - 100,
                bottom: window.innerHeight - 100, // Keep more visible
            };
        }
        const componentWidth = componentElement.offsetWidth;
        const componentHeight = componentElement.offsetHeight;
        const minVisibleWidth = Math.min(150, componentWidth * 0.5); // Increased minimum visible area
        const minVisibleHeight = Math.min(80, componentHeight * 0.5); // Increased minimum visible area
        return {
            left: -componentWidth + minVisibleWidth,
            top: -componentHeight + minVisibleHeight,
            right: window.innerWidth - minVisibleWidth,
            bottom: window.innerHeight - minVisibleHeight,
        };
    };
    const handleDragStart = (e) => {
        e.preventDefault();
        bringToFront(id);
        startDrag(id);
        setShowSnapIndicator(true);
    };
    const handleDrag = (event, info) => {
        // Update current drag position for snap indicator
        setCurrentDragPosition({ x: info.point.x, y: info.point.y });
    };
    const handleDragEnd = (event, info) => {
        endDrag();
        setShowSnapIndicator(false);
        setCurrentDragPosition(null);
        // Determine if we should dock or stay floating
        const zone = getDockZoneForPosition(info.point.x, info.point.y);
        if (zone) {
            // Dock to zone
            updateComponentPosition(id, { zone });
        }
        else {
            // Stay floating, update offset with proper viewport constraints and grid snapping
            let newOffset = getFloatingOffset(info.point.x, info.point.y);
            // Apply grid snapping if enabled and close enough to grid
            if (shouldSnapToGrid(newOffset.x, newOffset.y)) {
                newOffset = snapPositionToGrid(newOffset.x, newOffset.y);
                // Re-apply bounds checking after snapping
                newOffset = getFloatingOffset(newOffset.x, newOffset.y);
            }
            updateComponentPosition(id, { zone: 'floating', offset: newOffset });
        }
    };
    const getFloatingOffset = (x, y) => {
        // Get component dimensions for better constraint calculation
        const componentElement = componentRef.current;
        const componentWidth = componentElement?.offsetWidth || 300;
        const componentHeight = componentElement?.offsetHeight || 200;
        // Minimum visible area (prevent complete off-screen positioning)
        const minVisibleWidth = Math.min(150, componentWidth * 0.5); // Increased minimum visible area
        const minVisibleHeight = Math.min(80, componentHeight * 0.5); // Increased minimum visible area
        // Calculate constrained position to keep component mostly in viewport
        const constrainedX = Math.max(-componentWidth + minVisibleWidth, // Allow partial off-screen but keep significant portion visible
        Math.min(x, window.innerWidth - minVisibleWidth // Ensure significant part remains visible on right
        ));
        const constrainedY = Math.max(-componentHeight + minVisibleHeight, // Allow partial off-screen but keep significant portion visible
        Math.min(y, window.innerHeight - minVisibleHeight // Ensure significant part remains visible on bottom
        ));
        return { x: constrainedX, y: constrainedY };
    };
    const getPositionStyle = () => {
        if (!dockedComponent)
            return {};
        const { position } = dockedComponent;
        switch (position.zone) {
            case 'top-left':
                return { top: 20, left: 20 };
            case 'top-right':
                return { top: 20, right: 20 };
            case 'bottom-left':
                return { bottom: 20, left: 20 };
            case 'bottom-right':
                return { bottom: 20, right: 20 };
            case 'top-center':
                return { top: 20, left: '50%', transform: 'translateX(-50%)' };
            case 'bottom-center':
                return { bottom: 20, left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100vw - 40px)' };
            case 'left-center':
                return { left: 20, top: '50%', transform: 'translateY(-50%)' };
            case 'right-center':
                return { right: 20, top: '50%', transform: 'translateY(-50%)' };
            case 'middle-left':
                return { left: 20, top: '40%', transform: 'translateY(-50%)' };
            case 'floating':
            default:
                return {
                    left: position.offset?.x || 0,
                    top: position.offset?.y || 0,
                };
        }
    };
    const handlePointerDown = (e) => {
        if (e.target.closest('button')) {
            return; // Don't start drag if clicking a button
        }
        if (isDraggable) {
            // Allow dragging from any zone, not just floating
            dragControls.start(e);
        }
    };
    const toggleMinimized = () => {
        const newMinimized = !localMinimized;
        setLocalMinimized(newMinimized);
        // Save to localStorage
        localStorage.setItem(`docking-${id}-minimized`, JSON.stringify(newMinimized));
        // Call callback
        if (onMinimizedChange) {
            onMinimizedChange(newMinimized);
        }
    };
    // Handle window resize to keep components within bounds
    useEffect(() => {
        const handleResize = () => {
            if (dockedComponent && dockedComponent.position.zone === 'floating' && dockedComponent.position.offset) {
                const newOffset = getFloatingOffset(dockedComponent.position.offset.x, dockedComponent.position.offset.y);
                // Only update if position actually changed
                if (newOffset.x !== dockedComponent.position.offset.x || newOffset.y !== dockedComponent.position.offset.y) {
                    updateComponentPosition(id, { zone: 'floating', offset: newOffset });
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [dockedComponent, id, updateComponentPosition]);
    if (!dockedComponent) {
        return null; // Component not registered yet
    }
    const motionStyle = {
        position: 'fixed',
        width: localMinimized ? 'auto' : width,
        height: localMinimized ? 'auto' : height,
        zIndex: dockedComponent.zIndex,
        maxWidth: 'calc(100vw - 20px)',
        ...getPositionStyle(),
        ...style,
    };
    return (_jsxs(_Fragment, { children: [currentDragPosition && (_jsx(SnapIndicator, { x: currentDragPosition.x, y: currentDragPosition.y, visible: showSnapIndicator })), _jsxs(motion.div, { ref: componentRef, className: `${className} ${localMinimized ? 'minimized' : ''}`, style: motionStyle, drag: isDraggable, dragControls: dragControls, dragListener: false, onDragStart: handleDragStart, onDrag: handleDrag, onDragEnd: handleDragEnd, whileDrag: { cursor: 'grabbing' }, dragConstraints: getDragConstraints(), children: [_jsxs("div", { style: { cursor: isDraggable ? 'grab' : 'default' }, children: [_jsxs("div", { onPointerDown: handlePointerDown, style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: 'rgba(0, 0, 0, 0.1)',
                                    borderBottom: localMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: isDraggable ? 'grab' : 'default',
                                }, children: [_jsx("span", { style: { fontWeight: 'bold', fontSize: '14px' }, children: title }), showMinimizeButton && (_jsx("button", { onClick: toggleMinimized, style: {
                                            background: 'none',
                                            border: 'none',
                                            color: 'inherit',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            fontSize: '12px',
                                        }, title: localMinimized ? 'Expand' : 'Minimize', children: _jsx("i", { className: localMinimized ? 'fas fa-chevron-down' : 'fas fa-chevron-up' }) }))] }), !localMinimized && (_jsx("div", { style: {
                                    pointerEvents: 'auto',
                                    overflow: 'visible',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }, children: children })), localMinimized && (_jsx("div", { style: {
                                    pointerEvents: 'auto',
                                    overflow: 'visible',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '4px' // Small padding to prevent edge clipping
                                }, children: children }))] }), "      "] })] }));
};
