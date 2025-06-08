import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PanelComponent } from './PanelContext';
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

// External Window React Component
const ExternalWindowContent: React.FC<{ 
  components: PanelComponent[];
  onDrop?: (componentData: any) => void;
  onComponentSelect?: (componentId: string) => void;
  selectedComponentId?: string | null;
  onRemoveComponent?: (componentId: string) => void;
}> = ({ components, onDrop, onComponentSelect, selectedComponentId, onRemoveComponent }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (onDrop) {
        onDrop(componentData);
      }
    } catch (error) {
      console.error('Failed to parse dropped component data:', error);
    }
  };

  return (
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        borderBottom: '2px solid rgba(78, 205, 196, 0.3)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          color: '#4ecdc4',
          fontWeight: 600,
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🖥️ External Monitor - ArtBastard DMX
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem'
        }}>
          Components: {components.length}
        </div>
      </div>      {/* Content Area */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflow: 'auto',
        position: 'relative',
        background: isDragOver ? 'rgba(78, 205, 196, 0.1)' : 'transparent',
        border: isDragOver ? '2px dashed rgba(78, 205, 196, 0.5)' : '2px dashed transparent',
        borderRadius: '8px',
        transition: 'all 0.3s ease'
      }}>
        {components.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: isDragOver ? '#4ecdc4' : 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            transition: 'color 0.3s ease'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              opacity: isDragOver ? 1 : 0.7,
              transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}>
              {isDragOver ? '⬇️' : '📺'}
            </div>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: 300 }}>
              {isDragOver ? 'Drop Component Here' : 'External Monitor Ready'}
            </h2>
            <p>{isDragOver ? 'Release to add component to external monitor' : 'Drag components from the main window to display them here'}</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            height: 'fit-content'
          }}>            {components.map((component) => (
              <div
                key={component.id}
                style={{
                  background: selectedComponentId === component.id 
                    ? 'rgba(78, 205, 196, 0.2)' 
                    : 'rgba(78, 205, 196, 0.1)',
                  border: selectedComponentId === component.id 
                    ? '2px solid rgba(78, 205, 196, 0.8)' 
                    : '1px solid rgba(78, 205, 196, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  minHeight: '200px',
                  cursor: 'pointer'
                }}
                onClick={() => onComponentSelect && onComponentSelect(component.id)}
                onMouseEnter={(e) => {
                  if (selectedComponentId !== component.id) {
                    e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.6)';
                    e.currentTarget.style.background = 'rgba(78, 205, 196, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedComponentId !== component.id) {
                    e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.3)';
                    e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)';
                  }
                }}
              >                {/* Selection indicator and controls */}
                {selectedComponentId === component.id && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRemoveComponent) {
                          onRemoveComponent(component.id);
                        }
                      }}
                      style={{
                        background: '#ff6b6b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                      title="Remove from External Monitor"
                    >
                      Remove
                    </button>
                    <div style={{
                      background: '#4ecdc4',
                      color: '#1a1a1a',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  </div>
                )}
                
                <div style={{
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(78, 205, 196, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{
                    color: '#4ecdc4',
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0
                  }}>
                    {component.title}
                  </h3>
                  <div style={{
                    background: 'rgba(78, 205, 196, 0.2)',
                    color: '#4ecdc4',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 500
                  }}>
                    {component.type}
                  </div>
                </div>
                <div style={{
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '1rem',
                  minHeight: '120px'
                }}>
                  {/* This renders the actual interactive React component */}
                  {renderComponent(component.type, component.props)}
                </div>
              </div>
            ))}
          </div>
        )}
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
    reactRoot: null
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  // Function to re-render external window with current state
  const renderExternalWindow = useCallback((components: PanelComponent[]) => {
    if (externalWindow.reactRoot && externalWindow.window && !externalWindow.window.closed) {
      const handleDrop = (componentData: any) => {
        // Generate unique ID for component instance
        const componentId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newComponent: PanelComponent = {
          id: componentId,
          type: componentData.type,
          title: componentData.title,
          props: componentData.defaultProps || {},
        };

        // Add component directly to state
        setExternalWindow(prev => {
          const newComponents = [...prev.components, newComponent];
          // Re-render will happen via useEffect
          return {
            ...prev,
            components: newComponents
          };
        });
      };

      const handleComponentSelect = (componentId: string) => {
        setSelectedComponentId(selectedComponentId === componentId ? null : componentId);
      };

      const handleRemoveComponent = (componentId: string) => {
        setExternalWindow(prev => {
          const newComponents = prev.components.filter(comp => comp.id !== componentId);
          return {
            ...prev,
            components: newComponents
          };
        });
        setSelectedComponentId(null);
      };

      externalWindow.reactRoot.render(
        <ExternalWindowContent 
          components={components}
          onDrop={handleDrop}
          onComponentSelect={handleComponentSelect}
          selectedComponentId={selectedComponentId}
          onRemoveComponent={handleRemoveComponent}
        />
      );
    }
  }, [externalWindow.reactRoot, externalWindow.window, selectedComponentId]);
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

  // Re-render external window when components change
  useEffect(() => {
    if (externalWindow.isOpen && externalWindow.components) {
      renderExternalWindow(externalWindow.components);
    }
  }, [externalWindow.components, renderExternalWindow, externalWindow.isOpen]);

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
  }, [externalWindow.window, externalWindow.reactRoot]);

  const openExternalWindow = useCallback(() => {
    if (externalWindow.isOpen || externalWindow.window) return;

    // Calculate position for second monitor
    const left = window.screen.availWidth || window.innerWidth;
    const top = 0;
    const width = 800;
    const height = 600;

    // Open new window
    const newWindow = window.open(
      '',
      'ExternalMonitor',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
    );

    if (!newWindow) {
      console.error('Failed to open external window - popup may be blocked');
      return;
    }

    // Setup the minimal HTML structure for React mounting
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ArtBastard DMX - External Monitor</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
              background: #1a1a1a;
              color: #ffffff;
              overflow: hidden;
              height: 100vh;
            }
            #external-root {
              width: 100vw;
              height: 100vh;
            }
          </style>
        </head>
        <body>
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
        }        // Create React root and render initial content
        const reactRoot = createRoot(rootElement);
          // Setup the drop handler for the initial render
        const handleDrop = (componentData: any) => {
          // Generate unique ID for component instance
          const componentId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newComponent: PanelComponent = {
            id: componentId,
            type: componentData.type,
            title: componentData.title,
            props: componentData.defaultProps || {},
          };

          setExternalWindow(prev => ({
            ...prev,
            components: [...prev.components, newComponent]
          }));
        };

        const handleComponentSelect = (componentId: string) => {
          setSelectedComponentId(selectedComponentId === componentId ? null : componentId);
        };

        const handleRemoveComponent = (componentId: string) => {
          setExternalWindow(prev => ({
            ...prev,
            components: prev.components.filter(comp => comp.id !== componentId)
          }));
          setSelectedComponentId(null);
        };

        reactRoot.render(
          <ExternalWindowContent 
            components={[]}
            onDrop={handleDrop}
            onComponentSelect={handleComponentSelect}
            selectedComponentId={selectedComponentId}
            onRemoveComponent={handleRemoveComponent}
          />
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

        console.log('External window with React rendering setup complete');
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
  }, [externalWindow.isOpen, externalWindow.window, setSelectedComponentId, selectedComponentId]);

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
