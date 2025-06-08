import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PanelComponent, usePanels, PanelProvider } from './PanelContext';
import { renderComponent } from '../components/panels/ComponentRegistry';
import ResizablePanel from '../components/panels/ResizablePanel';

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
const ExternalWindowContent: React.FC = () => {
  const { addComponentToPanel } = usePanels();

  // Handle drop events like the main window panels do
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Generate unique ID for component instance
      const componentId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newComponent = {
        id: componentId,
        type: componentData.type,
        title: componentData.title,
        props: componentData.defaultProps || {},
      };

      // Add component to the external panel using PanelContext
      addComponentToPanel('external', newComponent);
      console.log('Component added to external monitor:', newComponent);
    } catch (error) {
      console.error('Failed to parse dropped component data:', error);
    }
  };

  return (    <div 
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}
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
        </div>        <div style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem'
        }}>
          Touchscreen Interface
        </div>
      </div>      {/* Content Area - Using ResizablePanel like FourthPanel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          flex: 1,
          padding: '1rem',
          overflow: 'hidden'
        }}>
          <ResizablePanel
            panelId="external"
            title="External Monitor Interface"
            className=""
            onDrop={handleDrop}
          />
        </div>

        {/* Touch Interface Controls - Merged from FourthPanel */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          opacity: 0.8,
          transition: 'opacity 0.2s'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '0.5rem',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <button
              style={{
                background: '#8b5cf6',
                border: 'none',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                height: '48px',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#8b5cf6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              title="Play"
            >
              ▶️
            </button>
            <button
              style={{
                background: '#8b5cf6',
                border: 'none',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                height: '48px',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#8b5cf6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              title="Pause"
            >
              ⏸️
            </button>
            <button
              style={{
                background: '#8b5cf6',
                border: 'none',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                height: '48px',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#8b5cf6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              title="Stop"
            >
              ⏹️
            </button>
          </div>
        </div>
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
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);  // Function to re-render external window with current state
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

        const handleComponentSelect = (componentId: string) => {
          setSelectedComponentId(selectedComponentId === componentId ? null : componentId);
        };

        const handleRemoveComponent = (componentId: string) => {
          setExternalWindow(prev => ({
            ...prev,
            components: prev.components.filter(comp => comp.id !== componentId)
          }));
          setSelectedComponentId(null);        };reactRoot.render(
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
