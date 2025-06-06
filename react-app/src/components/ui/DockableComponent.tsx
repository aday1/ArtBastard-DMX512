import React, { useEffect, useRef, ReactNode, useState } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { useDocking, DockPosition } from '@/context/DockingContext';

interface DockableComponentProps {
  id: string;
  title: string;
  component: 'midi-monitor' | 'osc-monitor' | 'midi-clock' | 'chromatic-energy-manipulator';
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultPosition?: DockPosition;
  defaultZIndex?: number;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: string;
  height?: string;
  isDraggable?: boolean;
  isMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  showMinimizeButton?: boolean;
}

export const DockableComponent: React.FC<DockableComponentProps> = ({
  id,
  title,
  component,
  children,
  className = '',
  style = {},
  defaultPosition = { zone: 'floating', offset: { x: 0, y: 0 } },
  defaultZIndex = 1000,
  isCollapsed = false,
  onCollapsedChange,
  width = 'auto',
  height = 'auto',
  isDraggable = true,
  isMinimized = false,
  onMinimizedChange,
  showMinimizeButton = true,
}) => {
  const dragControls = useDragControls();
  const componentRef = useRef<HTMLDivElement>(null);
  const [localMinimized, setLocalMinimized] = useState(isMinimized);
  
  const {
    registerComponent,
    unregisterComponent,
    updateComponentPosition,
    updateComponentCollapsed,
    startDrag,
    endDrag,
    getDockZoneForPosition,
    bringToFront,
    state,
  } = useDocking();

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

  const handleDragStart = (e: MouseEvent | TouchEvent | PointerEvent) => {
    e.preventDefault();
    bringToFront(id);
    startDrag(id);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    endDrag();
    
    // Determine if we should dock or stay floating
    const zone = getDockZoneForPosition(info.point.x, info.point.y);
    
    if (zone) {
      // Dock to zone
      updateComponentPosition(id, { zone });
    } else {
      // Stay floating, update offset with proper viewport constraints
      const newOffset = getFloatingOffset(info.point.x, info.point.y);
      updateComponentPosition(id, { zone: 'floating', offset: newOffset });
    }
  };

  const getFloatingOffset = (x: number, y: number) => {
    // Get component dimensions for better constraint calculation
    const componentElement = componentRef.current;
    const componentWidth = componentElement?.offsetWidth || 300;
    const componentHeight = componentElement?.offsetHeight || 200;
    
    // Calculate constrained position to keep component in viewport
    const constrainedX = Math.max(
      0, // Minimum left position
      Math.min(
        x,
        window.innerWidth - componentWidth // Maximum right position
      )
    );
    
    const constrainedY = Math.max(
      0, // Minimum top position
      Math.min(
        y,
        window.innerHeight - componentHeight // Maximum bottom position
      )
    );
    
    return { x: constrainedX, y: constrainedY };
  };

  const getPositionStyle = (): React.CSSProperties => {
    if (!dockedComponent) return {};

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
        return { bottom: 20, left: '50%', transform: 'translateX(-50%)' };
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
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

  if (!dockedComponent) {
    return null; // Component not registered yet
  }

  const motionStyle = {
    position: 'fixed' as const,
    width: localMinimized ? 'auto' : width,
    height: localMinimized ? 'auto' : height,
    zIndex: dockedComponent.zIndex,
    ...getPositionStyle(),
    ...style,
  };

  return (
    <motion.div
      ref={componentRef}
      className={`${className} ${localMinimized ? 'minimized' : ''}`}
      style={motionStyle}
      drag={isDraggable}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      dragConstraints={{
        left: 0,
        top: 0,
        right: window.innerWidth - 50,
        bottom: window.innerHeight - 50,
      }}
    >
      <div style={{ cursor: isDraggable ? 'grab' : 'default' }}>
        {/* Header with title and minimize button */}
        <div 
          onPointerDown={handlePointerDown}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderBottom: localMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            cursor: isDraggable ? 'grab' : 'default',
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{title}</span>
          {showMinimizeButton && (
            <button
              onClick={toggleMinimized}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '12px',
              }}
              title={localMinimized ? 'Expand' : 'Minimize'}
            >
              <i className={localMinimized ? 'fas fa-chevron-down' : 'fas fa-chevron-up'}></i>
            </button>
          )}
        </div>
        
        {/* Content - only show when not minimized */}
        {!localMinimized && (
          <div style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        )}
      </div>      </motion.div>
    );
  };
