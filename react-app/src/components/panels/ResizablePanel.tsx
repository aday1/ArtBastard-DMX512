import React, { useRef, useCallback, useState, useEffect } from 'react';
import { usePanels, PanelId, PanelComponent } from '../../context/PanelContext';
import { renderComponent } from './ComponentRegistry';
import styles from './ResizablePanel.module.scss';

interface ResizablePanelProps {
  panelId: PanelId;
  title: string;
  className?: string;
  onDrop?: (e: React.DragEvent) => void;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  panelId,
  title,
  className = '',
  onDrop
}) => {
  const { layout, removeComponentFromPanel, updateComponent } = usePanels();
  const [isDragOver, setIsDragOver] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const panelState = layout[panelId];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (onDrop) {
      onDrop(e);
    }
  }, [onDrop]);

  const handleRemoveComponent = useCallback((componentId: string) => {
    removeComponentFromPanel(panelId, componentId);
  }, [panelId, removeComponentFromPanel]);

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${className} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          <i className="fas fa-th-large"></i>
          {title}
        </h3>
        <div className={styles.panelControls}>
          <span className={styles.componentCount}>
            {panelState.components.length} components
          </span>
        </div>
      </div>

      <div className={styles.panelContent}>
        {panelState.components.length === 0 ? (
          <div className={styles.emptyPanel}>
            <i className="fas fa-plus-circle"></i>
            <p>Drag components here</p>
            <small>Drop UI components to build your interface</small>
          </div>
        ) : (
          <div className={styles.componentGrid}>
            {panelState.components.map((component: PanelComponent) => (
              <div key={component.id} className={styles.componentWrapper}>
                <div className={styles.componentHeader}>
                  <span className={styles.componentTitle}>{component.title}</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveComponent(component.id)}
                    title={`Remove ${component.title}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={styles.componentContent}>
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

export default ResizablePanel;
