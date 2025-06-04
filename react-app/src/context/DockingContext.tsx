import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface DockPosition {
  zone: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-center' | 'right-center' | 'middle-left' | 'floating';
  offset?: { x: number; y: number }; // For floating positions
}

export interface DockedComponent {
  id: string;
  title: string;
  position: DockPosition;
  zIndex: number;
  isCollapsed: boolean;
  component: 'midi-monitor' | 'osc-monitor' | 'midi-clock';
}

export interface DockingState {
  components: Record<string, DockedComponent>;
  isDragging: boolean;
  draggedComponentId: string | null;
  showDockZones: boolean;
}

export interface DockingContextType {
  state: DockingState;
  registerComponent: (component: DockedComponent) => void;
  unregisterComponent: (id: string) => void;
  updateComponentPosition: (id: string, position: DockPosition) => void;
  updateComponentCollapsed: (id: string, isCollapsed: boolean) => void;
  startDrag: (componentId: string) => void;
  endDrag: () => void;
  setShowDockZones: (show: boolean) => void;
  getDockZoneForPosition: (x: number, y: number) => DockPosition['zone'] | null;
  getComponentsByZone: (zone: DockPosition['zone']) => DockedComponent[];
  bringToFront: (id: string) => void;
}

const DockingContext = createContext<DockingContextType | null>(null);

export const useDocking = () => {
  const context = useContext(DockingContext);
  if (!context) {
    throw new Error('useDocking must be used within a DockingProvider');
  }
  return context;
};

interface DockingProviderProps {
  children: ReactNode;
}

export const DockingProvider: React.FC<DockingProviderProps> = ({ children }) => {
  const [state, setState] = useState<DockingState>({
    components: {},
    isDragging: false,
    draggedComponentId: null,
    showDockZones: false,
  });

  const registerComponent = useCallback((component: DockedComponent) => {
    setState(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component.id]: component,
      },
    }));
  }, []);

  const unregisterComponent = useCallback((id: string) => {
    setState(prev => {
      const { [id]: removed, ...rest } = prev.components;
      return {
        ...prev,
        components: rest,
      };
    });
  }, []);

  const updateComponentPosition = useCallback((id: string, position: DockPosition) => {
    setState(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [id]: {
          ...prev.components[id],
          position,
        },
      },
    }));

    // Persist position to localStorage
    localStorage.setItem(`docking-${id}-position`, JSON.stringify(position));
  }, []);

  const updateComponentCollapsed = useCallback((id: string, isCollapsed: boolean) => {
    setState(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [id]: {
          ...prev.components[id],
          isCollapsed,
        },
      },
    }));

    // Persist collapsed state to localStorage
    localStorage.setItem(`docking-${id}-collapsed`, JSON.stringify(isCollapsed));
  }, []);

  const startDrag = useCallback((componentId: string) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      draggedComponentId: componentId,
      showDockZones: true,
    }));
  }, []);

  const endDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      draggedComponentId: null,
      showDockZones: false,
    }));
  }, []);

  const setShowDockZones = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showDockZones: show,
    }));
  }, []);

  const getDockZoneForPosition = useCallback((x: number, y: number): DockPosition['zone'] | null => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const threshold = 100; // Distance from edge to trigger dock zone

    // Corner zones (priority)
    if (x < threshold && y < threshold) return 'top-left';
    if (x > viewport.width - threshold && y < threshold) return 'top-right';
    if (x < threshold && y > viewport.height - threshold) return 'bottom-left';
    if (x > viewport.width - threshold && y > viewport.height - threshold) return 'bottom-right';

    // Edge zones
    if (y < threshold) return 'top-center';
    if (y > viewport.height - threshold) return 'bottom-center';
    if (x < threshold) return 'left-center';
    if (x > viewport.width - threshold) return 'right-center';

    return null; // Floating
  }, []);

  const getComponentsByZone = useCallback((zone: DockPosition['zone']) => {
    return Object.values(state.components).filter(comp => comp.position.zone === zone);
  }, [state.components]);

  const bringToFront = useCallback((id: string) => {
    setState(prev => {
      const maxZIndex = Math.max(...Object.values(prev.components).map(c => c.zIndex));
      return {
        ...prev,
        components: {
          ...prev.components,
          [id]: {
            ...prev.components[id],
            zIndex: maxZIndex + 1,
          },
        },
      };
    });
  }, []);

  const contextValue: DockingContextType = {
    state,
    registerComponent,
    unregisterComponent,
    updateComponentPosition,
    updateComponentCollapsed,
    startDrag,
    endDrag,
    setShowDockZones,
    getDockZoneForPosition,
    getComponentsByZone,
    bringToFront,
  };

  return (
    <DockingContext.Provider value={contextValue}>
      {children}
    </DockingContext.Provider>
  );
};
