import React, { useEffect, useRef, ReactNode } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { useDocking, DockPosition } from '../context/DockingContext';

interface DockableComponentProps {
  id: string;
  title: string;
  component: 'midi-monitor' | 'osc-monitor' | 'midi-clock';
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultPosition?: DockPosition;
  defaultZIndex?: number;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: string;
  height?: string;
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
}) => {
  const dragControls = useDragControls();
  const componentRef = useRef<HTMLDivElement>(null);
  
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
    
    const position = savedPosition ? JSON.parse(savedPosition) : defaultPosition;
    const collapsed = savedCollapsed ? JSON.parse(savedCollapsed) : isCollapsed;

    // Register component with docking system
    registerComponent({
      id,
      title,
      position,
      zIndex: defaultZIndex,
      isCollapsed: collapsed,
      component,
    });

    // Call onCollapsedChange if needed
    if (onCollapsedChange && collapsed !== isCollapsed) {
      onCollapsedChange(collapsed);
    }

    return () => {
      unregisterComponent(id);
    };
  }, [id, title, component, defaultPosition, defaultZIndex, registerComponent, unregisterComponent, isCollapsed, onCollapsedChange]);

  // Update collapsed state when it changes externally
  useEffect(() => {
    if (dockedComponent && dockedComponent.isCollapsed !== isCollapsed) {
      updateComponentCollapsed(id, isCollapsed);
    }
  }, [isCollapsed, dockedComponent, updateComponentCollapsed, id]);

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
      // Stay floating, update offset
      const newOffset = getFloatingOffset(info.point.x, info.point.y);
      updateComponentPosition(id, { zone: 'floating', offset: newOffset });
    }
  };

  const getFloatingOffset = (x: number, y: number) => {
    // Calculate offset from a reference point (e.g., top-left)
    return { x, y };
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
    dragControls.start(e);
  };

  if (!dockedComponent) {
    return null; // Component not registered yet
  }

  const motionStyle = {
    position: 'fixed' as const,
    width,
    height,
    zIndex: dockedComponent.zIndex,
    ...getPositionStyle(),
    ...style,
  };

  return (
    <motion.div
      ref={componentRef}
      className={className}
      style={motionStyle}
      drag={dockedComponent.position.zone === 'floating'}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      // Add drag constraints if floating
      dragConstraints={dockedComponent.position.zone === 'floating' ? {
        left: 0,
        top: 0,
        right: window.innerWidth - 400, // Assuming component width
        bottom: window.innerHeight - 200, // Assuming component height
      } : undefined}
    >
      <div
        onPointerDown={handlePointerDown}
        style={{ cursor: 'grab' }}
      >
        {children}
      </div>
    </motion.div>
  );
};
