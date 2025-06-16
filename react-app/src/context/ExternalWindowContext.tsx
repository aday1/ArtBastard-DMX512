import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PanelComponent, usePanels, PanelProvider } from './PanelContext';
import { COMPONENT_REGISTRY, ComponentDefinition, getAllCategories, getComponentsByCategory } from '../components/panels/ComponentRegistry';
import { renderComponent } from '../components/panels/ComponentRegistry';

interface ExternalWindowState {
  isOpen: boolean;
  window: Window | null;
  components: PanelComponent[];
  reactRoot: Root | null;
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
}

const ExternalWindowContext = createContext<ExternalWindowContextType | undefined>(undefined);

// Touch-Optimized Component Library as Top Dock
const TouchComponentLibrary: React.FC<{ 
  onComponentAdd: (component: ComponentDefinition) => void;
  onToggleExpand: (isExpanded: boolean) => void; // Correctly define the prop
}> = ({ onComponentAdd, onToggleExpand }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('dmx');
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed for better space usage

  const categories = getAllCategories();

  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onToggleExpand(newExpandedState);
  };
  return (
    <div style={{
      position: 'fixed',
      top: '0px', // Position at top since header is removed
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      border: 'none',
      borderBottom: '2px solid rgba(78, 205, 196, 0.5)',
      zIndex: 1000, // Below header
      backdropFilter: 'blur(15px)',
      transition: 'all 0.3s ease',
      height: isExpanded ? 'auto' : '60px', 
      maxHeight: isExpanded ? '360px' : '60px',
      overflow: 'hidden',
      // Removed marginTop as top is now used for positioning
    }}>
      <button
        onClick={handleToggleExpand}
        style={{
          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.5))',
          border: 'none',
          borderBottom: isExpanded ? '1px solid rgba(78, 205, 196, 0.3)' : 'none',
          color: '#4ecdc4',
          padding: '1rem 2rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1.1rem',
          fontWeight: '700',
          height: '60px',
          touchAction: 'manipulation',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(78, 205, 196, 0.4), rgba(78, 205, 196, 0.6))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.5))';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📦 Component Library
        </span>
        <span style={{ 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
          transition: 'transform 0.3s',
          fontSize: '1.2rem'
        }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div style={{ 
          padding: '1rem',
          maxHeight: '340px',
          overflowY: 'auto'
        }}>
          {/* Category Tabs - Compact Horizontal */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  background: selectedCategory === category 
                    ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.4), rgba(78, 205, 196, 0.6))' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(78, 205, 196, 0.5)',
                  color: selectedCategory === category ? '#4ecdc4' : '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  minHeight: '36px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Component Grid - Compact with smaller buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.75rem',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            {getComponentsByCategory(selectedCategory as ComponentDefinition['category']).map(component => (
              <button
                key={component.type}
                onClick={() => onComponentAdd(component)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.15))',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  minHeight: '80px',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(78, 205, 196, 0.4))';
                  e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.7)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.15))';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={component.description}
              >
                <i className={component.icon} style={{ fontSize: '1.2rem', color: '#4ecdc4' }} />
                <span style={{ fontWeight: '600', lineHeight: '1.1' }}>{component.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Touch-Optimized Quick Actions Panel
const TouchQuickActions: React.FC<{ onHide: () => void, isVisible: boolean }> = ({ onHide, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div style={{
      position: 'fixed', // Changed from absolute to fixed
      bottom: '1rem',
      right: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      zIndex: 1000
    }}>
      {/* Quick Control Panel */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        padding: '1rem',
        border: '2px solid rgba(78, 205, 196, 0.3)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <button 
          onClick={onHide}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            alignSelf: 'flex-end',
            fontSize: '0.8rem'
          }}
        >
          Hide Panel
        </button>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem'
        }}>
          {[
            { icon: '▶️', label: 'Play', color: '#2ecc71' },
            { icon: '⏸️', label: 'Pause', color: '#f39c12' },
            { icon: '⏹️', label: 'Stop', color: '#e74c3c' },
            { icon: '🔄', label: 'Reset', color: '#9b59b6' }
          ].map((action, index) => (
            <button
              key={index}
              style={{
                background: `linear-gradient(135deg, ${action.color}22, ${action.color}44)`,
                border: `2px solid ${action.color}66`,
                color: 'white',
                padding: '1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '80px',
                fontSize: '0.9rem',
                fontWeight: '600',
                touchAction: 'manipulation',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}44, ${action.color}66)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}22, ${action.color}44)`;
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Touch-Optimized External Window Content Component
const ExternalWindowContent: React.FC = () => {
  const { addComponentToPanel, removeComponentFromPanel, layout, clearPanel } = usePanels();
  const [dragOver, setDragOver] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [componentSizes, setComponentSizes] = useState<Record<string, {cols: number, rows: number}>>({});
  const externalWindowRef = useRef<HTMLDivElement>(null);
  const [isQuickActionsVisible, setIsQuickActionsVisible] = useState(true);
  const [isComponentLibraryExpanded, setIsComponentLibraryExpanded] = useState(false); // New state

  const externalComponents = layout.external?.components || [];

  // Handle adding components from the component list
  const handleComponentAdd = (componentDef: ComponentDefinition) => {
    const componentId = `${componentDef.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newComponent: PanelComponent = {
      id: componentId,
      type: componentDef.type,
      title: componentDef.title,
      props: { 
        ...componentDef.defaultProps,
        touchOptimized: true,
        compact: componentDef.type === 'master-fader' ? true : false
      },
    };

    addComponentToPanel('external', newComponent);
    console.log('Touch-optimized component added to external monitor:', newComponent);
  };  // Handle removing components without confirmation for touch
  const handleRemoveComponent = (componentId: string, componentTitle: string) => {
    removeComponentFromPanel('external', componentId);
    // Clean up size state
    setComponentSizes(prev => {
      const newSizes = { ...prev };
      delete newSizes[componentId];
      return newSizes;
    });
  };
  // Handle component resizing - Updated for 6-column grid layout
  const handleComponentResize = (componentId: string, action: 'expand' | 'shrink' | 'fullscreen' | 'reset') => {
    setComponentSizes(prev => {
      const current = prev[componentId] || { cols: 1, rows: 1 };
      let newSize = { ...current };

      switch (action) {
        case 'expand':
          newSize.cols = Math.min(current.cols + 1, 6); // Updated to support 6 columns
          newSize.rows = Math.min(current.rows + 1, 2);
          break;
        case 'shrink':
          newSize.cols = Math.max(current.cols - 1, 1);
          newSize.rows = Math.max(current.rows - 1, 1);
          break;
        case 'fullscreen':
          newSize.cols = 6; // Updated to use all 6 columns for fullscreen
          newSize.rows = 2;
          break;
        case 'reset':
          newSize.cols = 1;
          newSize.rows = 1;
          break;
      }

      return {
        ...prev,
        [componentId]: newSize
      };
    });
  };

  // Enhanced drop handling for cross-window drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Generate unique ID for component instance
      const componentId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newComponent: PanelComponent = {
        id: componentId,
        type: componentData.type,
        title: componentData.title,
        props: { 
          ...componentData.defaultProps,
          touchOptimized: true, // Add touch optimization
          compact: componentData.type === 'master-fader' ? true : false
        },
      };

      // Add component to the external panel using PanelContext
      addComponentToPanel('external', newComponent);
      console.log('Component dropped on touch-optimized external monitor:', newComponent);
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all components from the external monitor?')) {
      clearPanel('external');
      console.log('All components cleared from external monitor');
    }
  };

  const handleBlankLayout = () => {
    if (confirm('Are you sure you want to clear the layout?')) {
      clearPanel('external'); 
      console.log('Layout cleared for external monitor');
    }
  };

  const handlePreconfiguredLayout = () => {
    if (confirm('Are you sure you want to load the preconfigured DMX layout? This will clear existing components.')) {
      clearPanel('external');
      const dmxControlPanelDef = Object.values(COMPONENT_REGISTRY).find(def => def.type === 'dmx-control-panel');
      if (dmxControlPanelDef) {
        handleComponentAdd(dmxControlPanelDef);
        console.log('Preconfigured DMX layout loaded for external monitor');
      } else {
        console.error('DMX Control Panel definition not found in COMPONENT_REGISTRY');
        alert('Error: DMX Control Panel component definition not found.');
      }
    }
  };

  return (
    <div 
      ref={externalWindowRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Enhanced Drop Overlay for Touch */}
      {dragOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(78, 205, 196, 0.15)',
          border: '4px dashed rgba(78, 205, 196, 0.7)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#4ecdc4',
          animation: 'pulse 1s infinite'
        }}>
          📦 Drop Component Here
        </div>
      )}      {/* Header removed for maximum screen real estate */}

      {/* Touch Component Library */}
      <TouchComponentLibrary 
        onComponentAdd={handleComponentAdd} 
        onToggleExpand={(expanded) => setIsComponentLibraryExpanded(expanded)} 
      />      {/* Touch Quick Actions */}
      <TouchQuickActions 
        isVisible={isQuickActionsVisible} 
        onHide={() => setIsQuickActionsVisible(false)} 
      />

      {/* Floating Action Button for Menu Access */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Component Library Toggle */}
        <button
          onClick={() => setIsComponentLibraryExpanded(!isComponentLibraryExpanded)}
          title="Toggle Component Library"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(78, 205, 196, 1))',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(78, 205, 196, 0.4)',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(78, 205, 196, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(78, 205, 196, 0.4)';
          }}
        >
          📦
        </button>

        {/* Quick Actions Toggle */}
        <button
          onClick={() => setIsQuickActionsVisible(!isQuickActionsVisible)}
          title="Toggle Quick Actions"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(142, 68, 173, 0.9), rgba(142, 68, 173, 1))',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(142, 68, 173, 0.4)',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(142, 68, 173, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(142, 68, 173, 0.4)';
          }}
        >
          ⚡
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.9), rgba(52, 152, 219, 1))',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(52, 152, 219, 0.4)',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(52, 152, 219, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(52, 152, 219, 0.4)';
          }}
        >
          <i className={`fas fa-${isFullScreen ? 'compress-arrows-alt' : 'expand-arrows-alt'}`}></i>
        </button>
      </div>{/* Main Touch-Optimized Content Area - Full Screen */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        height: '100vh', // Full screen height without header/footer
        paddingTop: isComponentLibraryExpanded ? '360px' : '0px', // Only library overlay padding when expanded
      }}>        {/* Touch-Optimized Components Display - Optimized for 1920x515 resolution */}
        {externalComponents.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)', // 6 columns for wide 1920px screen
            gridTemplateRows: 'repeat(auto-fit, minmax(180px, 1fr))', // Shorter rows for 515px height
            gap: '0.3rem', // Minimal gap for maximum space usage
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0.2rem', // Minimal padding for maximum screen real estate
            scrollBehavior: 'smooth'
          }}>
            {externalComponents.map((component) => {
              const componentSize = componentSizes[component.id] || { cols: 1, rows: 1 };
              
              return (
                <div
                  key={component.id}
                  style={{                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.12))',
                    border: '1px solid rgba(255, 255, 255, 0.15)', // Thinner border for space saving
                    borderRadius: '8px', // Smaller border radius for compact design
                    padding: '0.5rem', // Minimal padding for maximum content space
                    position: 'relative',
                    minHeight: '160px', // Reduced for 515px height constraint
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    // Dynamic grid sizing optimized for 6-column layout
                    gridColumn: `span ${Math.min(componentSize.cols, 6)}`, // Max 6 columns
                    gridRow: `span ${Math.min(componentSize.rows, 2)}`, // Max 2 rows for height constraint
                    // Visual feedback for different sizes
                    transform: componentSize.cols > 1 || componentSize.rows > 1 ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: componentSize.cols > 1 || componentSize.rows > 1
                      ? '0 8px 32px rgba(78, 205, 196, 0.3)' 
                      : '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {/* Touch-Optimized Component Header with Resize Controls */}
                  <div style={{                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem', // Reduced margin
                    paddingBottom: '0.5rem', // Reduced padding
                    borderBottom: '2px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#4ecdc4',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flex: 1
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {/* More specific icons based on component type */}
                        {COMPONENT_REGISTRY[component.type]?.icon ? 
                          <i className={`${COMPONENT_REGISTRY[component.type]?.icon} fa-fw`}></i> : 
                          '⚙️'}
                      </span>
                      {component.title}
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginLeft: '0.5rem'
                      }}>
                        ({componentSize.cols}×{componentSize.rows})
                      </span>
                    </h3>

                    {/* Resize Control Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      {/* Expand Button */}
                      <button
                        onClick={() => handleComponentResize(component.id, 'expand')}
                        onTouchStart={(e) => e.preventDefault()}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleComponentResize(component.id, 'expand');
                        }}
                        disabled={componentSize.cols >= 6 && componentSize.rows >= 2} // Updated for 6-column grid
                        style={{
                          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.5))',
                          border: '2px solid rgba(78, 205, 196, 0.5)',
                          color: '#4ecdc4',
                          padding: '0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          minWidth: '50px',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s ease',
                          userSelect: 'none',
                          opacity: (componentSize.cols >= 6 && componentSize.rows >= 2) ? 0.5 : 1 // Updated for 6-column grid
                        }}
                        title="Expand Component"
                      >
                        <i className="fas fa-expand-arrows-alt"></i>
                      </button>

                      {/* Shrink Button */}
                      <button
                        onClick={() => handleComponentResize(component.id, 'shrink')}
                        onTouchStart={(e) => e.preventDefault()}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleComponentResize(component.id, 'shrink');
                        }}
                        disabled={componentSize.cols <= 1 && componentSize.rows <= 1}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 193, 7, 0.5))',
                          border: '2px solid rgba(255, 193, 7, 0.5)',
                          color: '#ffc107',
                          padding: '0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          minWidth: '50px',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s ease',
                          userSelect: 'none',
                          opacity: (componentSize.cols <= 1 && componentSize.rows <= 1) ? 0.5 : 1
                        }}
                        title="Shrink Component"
                      >
                        <i className="fas fa-compress-arrows-alt"></i>
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        onClick={() => handleComponentResize(component.id, 'fullscreen')}
                        onTouchStart={(e) => e.preventDefault()}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleComponentResize(component.id, 'fullscreen');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0.5))',
                          border: '2px solid rgba(156, 39, 176, 0.5)',
                          color: '#9c27b0',
                          padding: '0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          minWidth: '50px',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        title="Maximize Component"
                      >
                        <i className="fas fa-arrows-alt"></i>
                      </button>

                      {/* Reset Button */}
                      <button
                        onClick={() => handleComponentResize(component.id, 'reset')}
                        onTouchStart={(e) => e.preventDefault()}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleComponentResize(component.id, 'reset');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(76, 175, 80, 0.5))',
                          border: '2px solid rgba(76, 175, 80, 0.5)',
                          color: '#4caf50',
                          padding: '0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          minWidth: '50px',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        title="Reset Size"
                      >
                        <i className="fas fa-undo"></i>
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Remove button clicked for component:', component.id, component.title);
                          handleRemoveComponent(component.id, component.title);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Remove button touched for component:', component.id, component.title);
                          handleRemoveComponent(component.id, component.title);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.3), rgba(255, 0, 0, 0.5))',
                          border: '2px solid rgba(255, 0, 0, 0.5)',
                          color: '#ff6b6b',
                          padding: '0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          minWidth: '50px',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s ease',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          zIndex: 100
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0.7))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 0, 0, 0.3), rgba(255, 0, 0, 0.5))';
                        }}
                        title="Remove Component"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Touch-Optimized Component Content */}                  <div style={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    fontSize: componentSize.cols > 1 ? '1.2rem' : '1.1rem', // Scale text with component size
                    padding: '0.25rem', // Reduced padding for maximum content space
                    minHeight: '120px' // Reduced min height for more content space
                  }}>
                    {renderComponent(component.type, {
                      ...component.props,
                      touchOptimized: true,
                      style: {
                        transform: `scale(${componentSize.cols > 1 || componentSize.rows > 1 ? 1.1 : 1.05})`, // Scale content with component size
                        ...component.props?.style
                      }
                    })}
                  </div>
                </div>
              );
            })}

          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '2rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '6rem' }}>📱</div>
            <h2 style={{ 
              margin: 0, 
              color: '#4ecdc4', 
              fontSize: '2rem',
              fontWeight: '700'
            }}>
              Touch Interface Ready
            </h2>
            <p style={{ 
              maxWidth: '600px', 
              lineHeight: 1.6,
              fontSize: '1.2rem',
              margin: 0
            }}>
              Tap the "Component Library" button above to add DMX sliders, controls, and other components to this touchscreen interface.
              <br /><br />
              All components are automatically optimized for touch interaction with larger buttons and enhanced visual feedback.
            </p>
            <div style={{
              background: 'rgba(78, 205, 196, 0.1)',
              border: '2px solid rgba(78, 205, 196, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '500px'
            }}>
              <h4 style={{ 
                color: '#4ecdc4', 
                margin: '0 0 1rem 0',
                fontSize: '1.1rem'
              }}>
                Quick Start:
              </h4>
              <ol style={{
                textAlign: 'left',
                fontSize: '1rem',
                lineHeight: 1.8,
                margin: 0,
                paddingLeft: '1.5rem'
              }}>
                <li>Tap "Component Library" above</li>
                <li>Select "DMX" category</li>
                <li>Tap "DMX Control Panel" for sliders</li>
                <li>Enjoy touch-optimized controls!</li>
              </ol>
            </div>
          </div>
        )}
      </div>      {/* Footer removed for maximum screen real estate */}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
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
    reactRoot: null
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Function to re-render external window with current state
  const renderExternalWindow = useCallback(() => {
    if (externalWindow.reactRoot && externalWindow.window && !externalWindow.window.closed) {
      externalWindow.reactRoot.render(
        <PanelProvider>
          <ExternalWindowContent />
        </PanelProvider>
      );
    }
  }, [externalWindow.reactRoot, externalWindow.window]);

  const addComponentToExternal = useCallback((component: PanelComponent) => {
    setExternalWindow(prev => ({
      ...prev,
      components: [...prev.components, component]
    }));
  }, []);

  const removeComponentFromExternal = useCallback((componentId: string) => {
    setExternalWindow(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId)
    }));
  }, []);

  // Re-render external window when it's opened
  useEffect(() => {
    if (externalWindow.isOpen) {
      renderExternalWindow();
    }
  }, [renderExternalWindow, externalWindow.isOpen]);

  const sendMessageToExternal = useCallback((message: any) => {
    if (externalWindow.window && !externalWindow.window.closed) {
      externalWindow.window.postMessage(message, '*');
    }
  }, [externalWindow.window]);

  const closeExternalWindow = useCallback(() => {
    if (externalWindow.window && !externalWindow.window.closed) {
      externalWindow.window.close();
    }
    
    // Clean up React root
    if (externalWindow.reactRoot) {
      externalWindow.reactRoot.unmount();
    }
    
    setExternalWindow({
      isOpen: false,
      window: null,
      components: [],
      reactRoot: null
    });
  }, [externalWindow.window, externalWindow.reactRoot]);  const openExternalWindow = useCallback(() => {
    if (externalWindow.isOpen || externalWindow.window) return;

    const left = window.screen.availWidth || window.innerWidth;
    const top = 0;
    const width = 1920; // Optimized for 1920x515 touchscreen
    const height = 515; // Optimized for 1920x515 touchscreen

    const newWindow = window.open(
      '',
      'ArtBastardTouchMonitor',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
    );

    if (!newWindow) {
      console.error('Failed to open external window - popup may be blocked');
      alert('Failed to open touch monitor. Please allow popups for this site and try again.');
      return;
    }

    // Setup the enhanced HTML structure optimized for touch interaction
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ArtBastard DMX - Touch Monitor</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              /* Touch optimization */
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
              background: #1a1a1a;
              color: #ffffff;
              overflow: hidden;
              height: 100vh;
              /* Touch optimizations */
              touch-action: manipulation;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            
            #external-root {
              width: 100vw;
              height: 100vh;
            }
            
            /* Touch-friendly scrollbars */
            ::-webkit-scrollbar {
              width: 16px;
              height: 16px;
            }
            ::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(78, 205, 196, 0.6);
              border-radius: 10px;
              border: 2px solid transparent;
              background-clip: content-box;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(78, 205, 196, 0.8);
              background-clip: content-box;
            }
            
            /* Enhanced touch interactions */
            button, input[type="range"], input[type="button"] {
              min-height: 44px !important; /* Apple's recommended minimum touch target */
              min-width: 44px !important;
              touch-action: manipulation;
              cursor: pointer;
            }
            
            /* Input range styling for touch */
            input[type="range"] {
              min-height: 50px !important;
              -webkit-appearance: none;
              appearance: none;
              background: transparent;
              outline: none;
            }
            
            input[type="range"]::-webkit-slider-track {
              height: 12px;
              border-radius: 6px;
              background: linear-gradient(to right, #4ecdc4 0%, #4ecdc4 var(--slider-progress, 0%), rgba(255,255,255,0.2) var(--slider-progress, 0%), rgba(255,255,255,0.2) 100%);
            }
            
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              height: 32px;
              width: 32px;
              border-radius: 50%;
              background: linear-gradient(135deg, #4ecdc4, #2ed573);
              cursor: pointer;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
              transition: all 0.2s ease;
            }
            
            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.2);
              box-shadow: 0 6px 20px rgba(78, 205, 196, 0.6);
            }
            
            /* Animations for touch feedback */
            @keyframes touchFeedback {
              0% { transform: scale(1); }
              50% { transform: scale(0.95); }
              100% { transform: scale(1); }
            }
            
            .touch-feedback:active {
              animation: touchFeedback 0.1s ease;
            }
            
            /* Prevent text selection during touch */
            .no-select {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
            
            /* Enhanced focus indicators for accessibility */
            button:focus, input:focus {
              outline: 3px solid rgba(78, 205, 196, 0.5);
              outline-offset: 2px;
            }
            
            /* Touch-optimized DMX slider styling */
            .touch-dmx-slider {
              -webkit-appearance: none;
              appearance: none;
              height: 60px;
              border-radius: 30px;
              outline: none;
              cursor: pointer;
              touch-action: manipulation;
            }
            
            .touch-dmx-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 40px;
              height: 56px;
              background: linear-gradient(135deg, #4ecdc4, #45b7c4);
              cursor: pointer;
              border-radius: 12px;
              border: 3px solid rgba(255,255,255,0.8);
              box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
              transition: all 0.2s ease;
            }
            
            .touch-dmx-slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 20px rgba(78, 205, 196, 0.6);
              background: linear-gradient(135deg, #5ee3db, #4ecdc4);
            }
            
            .touch-dmx-slider::-webkit-slider-thumb:active {
              transform: scale(1.05);
              box-shadow: 0 8px 25px rgba(78, 205, 196, 0.8);
            }
            
            .touch-dmx-slider::-moz-range-thumb {
              width: 40px;
              height: 56px;
              background: linear-gradient(135deg, #4ecdc4, #45b7c4);
              cursor: pointer;
              border-radius: 12px;
              border: 3px solid rgba(255,255,255,0.8);
              box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
              transition: all 0.2s ease;
            }
            
            .touch-dmx-slider::-webkit-slider-runnable-track {
              width: 100%;
              height: 20px;
              cursor: pointer;
              border-radius: 10px;
              border: 2px solid rgba(255,255,255,0.3);
            }
            
            .touch-dmx-slider::-moz-range-track {
              width: 100%;
              height: 20px;
              cursor: pointer;
              border-radius: 10px;
              border: 2px solid rgba(255,255,255,0.3);
            }
            .touch-target {
              min-height: 48px;
              min-width: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body class="no-select">
          <div id="external-root"></div>
        </body>
      </html>
    `);
    newWindow.document.close();

    // Setup React root after document is ready
    const setupReactRoot = () => {
      try {
        const rootElement = newWindow.document.getElementById('external-root');
        if (!rootElement) {
          console.error('Could not find external-root element');
          return;
        }

        // Create React root and render initial content
        const reactRoot = createRoot(rootElement);

        reactRoot.render(
          <PanelProvider>
            <ExternalWindowContent />
          </PanelProvider>
        );

        // Update state with the new window and React root
        setExternalWindow({
          isOpen: true,
          window: newWindow,
          components: [],
          reactRoot: reactRoot
        });

        // Handle window close
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            // Clean up React root
            reactRoot.unmount();
            setExternalWindow({
              isOpen: false,
              window: null,
              components: [],
              reactRoot: null
            });
          }
        }, 1000);

        console.log('Enhanced external monitor window setup complete');
      } catch (error) {
        console.error('Error setting up React root in external window:', error);
        newWindow.close();
      }
    };

    // Setup React root after document is ready
    if (newWindow.document.readyState === 'complete') {
      setupReactRoot();
    } else {
      newWindow.addEventListener('load', setupReactRoot);
    }
  }, [externalWindow.isOpen, externalWindow.window]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (externalWindow.window && !externalWindow.window.closed) {
        externalWindow.window.close();
      }
      if (externalWindow.reactRoot) {
        externalWindow.reactRoot.unmount();
      }
    };
  }, []);

  const contextValue: ExternalWindowContextType = {
    externalWindow,
    openExternalWindow,
    closeExternalWindow,
    addComponentToExternal,
    removeComponentFromExternal,
    sendMessageToExternal,
    selectedComponentId,
    setSelectedComponentId
  };

  return (
    <ExternalWindowContext.Provider value={contextValue}>
      {children}
    </ExternalWindowContext.Provider>
  );
};

export const useExternalWindow = (): ExternalWindowContextType => {
  const context = useContext(ExternalWindowContext);
  if (context === undefined) {
    throw new Error('useExternalWindow must be used within an ExternalWindowProvider');
  }
  return context;
};

export default ExternalWindowProvider;

// Ensure this file is treated as a module
export {};
