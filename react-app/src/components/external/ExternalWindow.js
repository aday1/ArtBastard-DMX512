import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PanelProvider } from '../../context/PanelContext';
import { DockingProvider } from '../../context/DockingContext';
import ResizablePanel from '../panels/ResizablePanel';
export const ExternalWindow = ({ onClose, title = 'ArtBastard DMX - External Monitor', width = 800, height = 600 }) => {
    const [externalWindow, setExternalWindow] = useState(null);
    const [reactRoot, setReactRoot] = useState(null);
    const containerRef = useRef(null);
    useEffect(() => {
        // Calculate position for second monitor
        const left = window.screen.availWidth || window.innerWidth;
        const top = 0;
        // Open new window
        const newWindow = window.open('', 'ExternalMonitor', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`);
        if (!newWindow) {
            console.error('Failed to open external window - popup may be blocked');
            return;
        }
        // Setup the HTML structure
        newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: #1a1a1a;
              color: #ffffff;
              overflow: hidden;
            }
            
            #external-root {
              width: 100vw;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .external-header {
              background: rgba(0, 0, 0, 0.9);
              border-bottom: 1px solid rgba(78, 205, 196, 0.3);
              padding: 0.75rem 1rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-shrink: 0;
            }
            
            .external-title {
              color: #4ecdc4;
              font-weight: 600;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            .external-content {
              flex: 1;
              overflow: hidden;
              padding: 1rem;
            }
            
            .external-dropzone {
              width: 100%;
              height: 100%;
              border: 2px dashed rgba(78, 205, 196, 0.3);
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              background: rgba(0, 0, 0, 0.3);
              position: relative;
            }
            
            .external-dropzone.drag-over {
              border-color: rgba(78, 205, 196, 0.8);
              background: rgba(78, 205, 196, 0.1);
              box-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
            }
            
            .drop-message {
              text-align: center;
              color: rgba(255, 255, 255, 0.6);
            }
            
            .drop-message h3 {
              margin-bottom: 0.5rem;
              color: #4ecdc4;
            }
            
            .drop-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
              opacity: 0.5;
            }
            
            /* Copy relevant styles from main app */
            .panel {
              background: rgba(0, 0, 0, 0.8);
              border: 1px solid rgba(78, 205, 196, 0.3);
              border-radius: 8px;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="external-root">
            <div class="external-header">
              <div class="external-title">
                <span>📺</span>
                <span>External Monitor - 4th Panel</span>
              </div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">
                Drag components here from main application
              </div>
            </div>
            <div class="external-content">
              <div id="react-container"></div>
            </div>
          </div>
        </body>
      </html>
    `);
        newWindow.document.close();
        // Wait for DOM to be ready, then setup React
        const setupReact = () => {
            const container = newWindow.document.getElementById('react-container');
            if (container) {
                const root = createRoot(container);
                // Render React component in external window
                root.render(_jsx(PanelProvider, { children: _jsx(DockingProvider, { children: _jsx(ExternalPanelContent, {}) }) }));
                setReactRoot(root);
            }
        };
        // Setup after a brief delay to ensure DOM is ready
        setTimeout(setupReact, 100);
        // Handle window close
        const handleClose = () => {
            if (reactRoot) {
                reactRoot.unmount();
            }
            if (onClose) {
                onClose();
            }
        };
        newWindow.addEventListener('beforeunload', handleClose);
        setExternalWindow(newWindow);
        // Cleanup on component unmount
        return () => {
            if (reactRoot) {
                reactRoot.unmount();
            }
            if (newWindow && !newWindow.closed) {
                newWindow.close();
            }
        };
    }, [width, height, title, onClose]);
    // Setup cross-window communication
    useEffect(() => {
        if (!externalWindow)
            return;
        const handleMessage = (event) => {
            // Handle messages from external window
            if (event.source === externalWindow) {
                console.log('Message from external window:', event.data);
                // TODO: Handle component drops, state updates, etc.
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [externalWindow]);
    return null; // This component doesn't render anything in the main window
};
// Component to render inside the external window
const ExternalPanelContent = () => {
    const [isDragOver, setIsDragOver] = useState(false);
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
            console.log('Component dropped in external window:', componentData);
            // Send message to parent window about the drop
            if (window.opener) {
                window.opener.postMessage({
                    type: 'EXTERNAL_COMPONENT_DROP',
                    data: componentData
                }, '*');
            }
        }
        catch (error) {
            console.error('Failed to handle drop in external window:', error);
        }
    };
    return (_jsx("div", { className: `external-dropzone ${isDragOver ? 'drag-over' : ''}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: _jsx(ResizablePanel, { panelId: "external", title: "External Monitor Panel", className: "panel", onDrop: handleDrop }) }));
};
export default ExternalWindow;
