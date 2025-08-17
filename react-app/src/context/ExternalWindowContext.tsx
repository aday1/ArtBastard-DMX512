import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PanelComponent, usePanels, PanelProvider } from './PanelContext';
import { COMPONENT_REGISTRY, ComponentDefinition, getAllCategories, getComponentsByCategory } from '../components/panels/ComponentRegistry';
import { renderComponent } from '../components/panels/ComponentRegistry';
import styles from '../components/external/ExternalDisplay.module.scss';

interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExternalWindowState {
  isOpen: boolean;
  window: Window | null;
  components: PanelComponent[];
  reactRoot: Root | null;
  gridPositions: Map<string, GridPosition>;
}

interface ExternalWindowContextType {
  externalWindow: ExternalWindowState;
  openExternalWindow: () => void;
  closeExternalWindow: () => void;
  addComponentToExternal: (component: PanelComponent) => void;
  removeComponentFromExternal: (componentId: string) => void;
  sendMessageToExternal: (message: any) => void;
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  updateComponentPosition: (componentId: string, position: GridPosition) => void;
}

const ExternalWindowContext = createContext<ExternalWindowContextType | undefined>(undefined);

// Enhanced Touch-Optimized Component Library
const TouchComponentLibrary: React.FC<{ 
  onComponentAdd: (component: ComponentDefinition) => void;
  onToggleExpand: (isExpanded: boolean) => void;
}> = ({ onComponentAdd, onToggleExpand }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('dmx');
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = getAllCategories();

  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onToggleExpand(newExpandedState);
  };

  return (
    <div className={`${styles.componentLibraryHeader} ${isExpanded ? styles.expanded : ''}`}>
      <button
        className={styles.libraryToggleButton}
        onClick={handleToggleExpand}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔧</span>
          <span>Component Library</span>
        </span>
        <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className={styles.libraryContent}>
          {/* Category Tabs */}
          <div className={styles.categoryTabs}>
            {categories.map(category => (
              <button
                key={category}
                className={`${styles.categoryTab} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Component Grid */}
          <div className={styles.componentGrid}>
            {getComponentsByCategory(selectedCategory as ComponentDefinition['category']).map(component => (
              <div
                key={component.type}
                className={styles.componentCard}
                onClick={() => onComponentAdd(component)}
                title={component.description}
              >
                <i className={`${component.icon} ${styles.componentIcon}`} />
                <div className={styles.componentTitle}>{component.title}</div>
                {component.description && (
                  <div className={styles.componentDescription}>
                    {component.description.substring(0, 80)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Grid Component Wrapper
const GridComponentWrapper: React.FC<{
  component: PanelComponent;
  onRemove: (id: string) => void;
  onResize: (id: string, action: string) => void;
  position: GridPosition;
  onPositionChange: (id: string, position: GridPosition) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ component, onRemove, onResize, position, onPositionChange, isSelected, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as Element).closest(`.${styles.componentHeader}`)) {
      return; // Only drag from header
    }
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    onSelect(component.id);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      ...position,
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(0, e.clientY - dragOffset.y)
    };
    
    onPositionChange(component.id, newPosition);
  }, [isDragging, dragOffset, position, onPositionChange, component.id]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={componentRef}
      className={`${styles.gridComponent} ${isDragging ? styles.dragging : ''} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        zIndex: isDragging ? 1000 : isSelected ? 100 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.componentHeader}>
        <div className={styles.componentTitle}>
          <i className={COMPONENT_REGISTRY[component.type]?.icon || 'fas fa-cube'} />
          {component.title}
        </div>
        <div className={styles.componentActions}>
          <button
            className={styles.actionButton}
            onClick={() => onResize(component.id, 'expand')}
            title="Expand"
          >
            ⛶
          </button>
          <button
            className={styles.actionButton}
            onClick={() => onResize(component.id, 'shrink')}
            title="Shrink"
          >
            ⊟
          </button>
          <button
            className={`${styles.actionButton} ${styles.remove}`}
            onClick={() => onRemove(component.id)}
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>
      <div className={styles.componentContent}>
        {renderComponent(component.type, {
          ...component.props,
          touchOptimized: true,
          compact: true
        })}
      </div>
    </div>
  );
};

// Enhanced External Panel Content with new grid system
export const ExternalPanelContent: React.FC = () => {
  const panelContext = usePanels();
  const [externalWindow, setExternalWindow] = useState<ExternalWindowState>({
    isOpen: false,
    window: null,
    components: [],
    reactRoot: null,
    gridPositions: new Map()
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  
  const updateComponentPosition = useCallback((componentId: string, position: GridPosition) => {
    setExternalWindow(prev => {
      const newPositions = new Map(prev.gridPositions);
      newPositions.set(componentId, position);
      return {
        ...prev,
        gridPositions: newPositions
      };
    });
  }, []);

  // Use the components from the external window state
  const externalComponents = externalWindow.components;
  
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Enhanced component addition with auto-positioning
  const handleComponentAdd = (componentDef: ComponentDefinition) => {
    const componentId = `${componentDef.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-position new component to avoid overlaps
    const existingPositions = Array.from(externalWindow.gridPositions.values());
    let newPosition: GridPosition = {
      x: 20,
      y: 20,
      width: 320,
      height: 240
    };
    
    // Find non-overlapping position
    for (let attempt = 0; attempt < 20; attempt++) {
      const testPosition = {
        x: 20 + (attempt % 4) * 350,
        y: 20 + Math.floor(attempt / 4) * 260,
        width: 320,
        height: 240
      };
      
      const overlaps = existingPositions.some(pos => 
        testPosition.x < pos.x + pos.width &&
        testPosition.x + testPosition.width > pos.x &&
        testPosition.y < pos.y + pos.height &&
        testPosition.y + testPosition.height > pos.y
      );
      
      if (!overlaps) {
        newPosition = testPosition;
        break;
      }
    }
    
    const newComponent: PanelComponent = {
      id: componentId,
      type: componentDef.type,
      title: componentDef.title,
      props: {
        ...componentDef.defaultProps,
        touchOptimized: true,
        compact: false
      },
    };

    // For now, just add to state (would need proper integration with panel context)
    setExternalWindow(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));
    updateComponentPosition(componentId, newPosition);
    setIsLibraryExpanded(false);
  };

  const handleComponentRemove = (componentId: string) => {
    setExternalWindow(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId)
    }));
    
    setExternalWindow(prev => {
      const newPositions = new Map(prev.gridPositions);
      newPositions.delete(componentId);
      return {
        ...prev,
        gridPositions: newPositions
      };
    });
    
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
  };

  const handleComponentResize = (componentId: string, action: string) => {
    const currentPosition = externalWindow.gridPositions.get(componentId);
    if (!currentPosition) return;

    let newPosition = { ...currentPosition };

    switch (action) {
      case 'expand':
        newPosition.width = Math.min(currentPosition.width + 100, 800);
        newPosition.height = Math.min(currentPosition.height + 80, 600);
        break;
      case 'shrink':
        newPosition.width = Math.max(currentPosition.width - 100, 250);
        newPosition.height = Math.max(currentPosition.height - 80, 180);
        break;
      case 'fullscreen':
        newPosition.width = Math.min(window.innerWidth - 40, 1200);
        newPosition.height = Math.min(window.innerHeight - 120, 800);
        newPosition.x = 20;
        newPosition.y = 20;
        break;
    }

    updateComponentPosition(componentId, newPosition);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      const componentDef = COMPONENT_REGISTRY[componentData.type];
      if (componentDef) {
        handleComponentAdd(componentDef);
      }
    } catch (error) {
      console.error('Failed to parse dropped component data:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  return (
    <div 
      className={`${styles.externalDisplayContainer} ${dragOver ? styles.dragOver : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Component Library Header */}
      <TouchComponentLibrary 
        onComponentAdd={handleComponentAdd} 
        onToggleExpand={setIsLibraryExpanded} 
      />

      {/* Main Grid Area */}
      <div className={styles.mainGridContainer}>
        <div className={styles.gridArea}>
          {externalWindow.components.length > 0 ? (
            <div style={{ position: 'relative', minHeight: '100%' }}>
              {externalWindow.components.map(component => {
                const position = externalWindow.gridPositions.get(component.id) || {
                  x: 20, y: 20, width: 320, height: 240
                };
                
                return (
                  <GridComponentWrapper
                    key={component.id}
                    component={component}
                    onRemove={handleComponentRemove}
                    onResize={handleComponentResize}
                    position={position}
                    onPositionChange={updateComponentPosition}
                    isSelected={selectedComponentId === component.id}
                    onSelect={setSelectedComponentId}
                  />
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎛️</div>
              <div className={styles.emptyTitle}>Ready for Touch Control</div>
              <div className={styles.emptyDescription}>
                Tap the Component Library above to add touch-optimized DMX controls, sliders, 
                and other components to create your perfect touchscreen lighting interface.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className={styles.quickActionsPanel}>
        <button
          className={`${styles.quickActionButton} ${styles.fullscreen}`}
          onClick={toggleFullScreen}
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullScreen ? '🗗' : '🗖'}
        </button>
        <button
          className={styles.quickActionButton}
          onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
          title="Toggle Component Library"
        >
          📦
        </button>
      </div>
    </div>
  );
};

interface ExternalWindowProviderProps {
  children: ReactNode;
}

export const ExternalWindowProvider: React.FC<ExternalWindowProviderProps> = ({ children }) => {
  const [externalWindow, setExternalWindow] = useState<ExternalWindowState>({
    isOpen: false,
    window: null,
    components: [],
    reactRoot: null,
    gridPositions: new Map()
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  
  const updateComponentPosition = useCallback((componentId: string, position: GridPosition) => {
    setExternalWindow(prev => {
      const newPositions = new Map(prev.gridPositions);
      newPositions.set(componentId, position);
      return {
        ...prev,
        gridPositions: newPositions
      };
    });
  }, []);

  const value: ExternalWindowContextType = {
    externalWindow,
    openExternalWindow: () => {}, // TODO: Implement
    closeExternalWindow: () => {},
    addComponentToExternal: () => {},
    removeComponentFromExternal: () => {},
    sendMessageToExternal: () => {},
    selectedComponentId,
    setSelectedComponentId,
    updateComponentPosition
  };

  return (
    <ExternalWindowContext.Provider value={value}>
      {children}
    </ExternalWindowContext.Provider>
  );
};

export const useExternalWindow = () => {
  const context = useContext(ExternalWindowContext);
  if (context === undefined) {
    throw new Error('useExternalWindow must be used within an ExternalWindowProvider');
  }
  return context;
};
