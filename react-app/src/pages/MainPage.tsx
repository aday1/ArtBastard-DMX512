import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EnhancedPanelLayout } from '../components/panels/EnhancedPanelLayout';
import { ComponentToolbar } from '../components/panels/ComponentToolbar';
import { useTheme } from '../context/ThemeContext';
import { usePanels } from '../context/PanelContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import styles from './MainPage.module.scss';

const MainPage: React.FC = () => {
  const { theme } = useTheme();
  const { layout, resetLayout, loadBlankLayout } = usePanels();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; component: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced drag preview
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragPreview) {
        setDragPreview({
          ...dragPreview,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragPreview(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragPreview]);

  const handleDragStart = useCallback((componentType: string, componentTitle: string) => {
    setIsDragging(true);
    setDragPreview({
      x: 0,
      y: 0,
      component: componentTitle,
    });
  }, []);

  const hasComponents = (layout['top-left']?.components?.length > 0) ||
                        (layout['top-right']?.components?.length > 0) ||
                        (layout['bottom']?.components?.length > 0) ||
                        (layout['external']?.components?.length > 0);

  return (
    <div className={styles.mainPage} ref={containerRef}>
      {/* Elitist Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <LucideIcon name="Layout" className={styles.headerIcon} />
            <div>
              <h1 className={styles.mainTitle}>
                {theme === 'artsnob' 
                  ? '🎭 Atelier de Contrôle Lumineux'
                  : theme === 'minimal'
                  ? 'Dashboard'
                  : 'Control Dashboard'}
              </h1>
              <p className={styles.subtitle}>
                {theme === 'artsnob'
                  ? 'Where artistry meets precision. Compose your lighting masterpiece with unparalleled sophistication.'
                  : 'Compose your lighting control workspace'}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            {hasComponents && (
              <>
                <button
                  className={styles.actionButton}
                  onClick={resetLayout}
                  title="Reset layout to default"
                >
                  <LucideIcon name="RotateCcw" />
                  <span>Reset</span>
                </button>
                <button
                  className={styles.actionButton}
                  onClick={loadBlankLayout}
                  title="Clear all panels"
                >
                  <LucideIcon name="X" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.layoutWrapper}>
        <EnhancedPanelLayout />
      </div>

      {/* Drag Preview Overlay */}
      {isDragging && dragPreview && (
        <div
          className={styles.dragPreview}
          style={{
            left: `${dragPreview.x}px`,
            top: `${dragPreview.y}px`,
          }}
        >
          <LucideIcon name="Move" />
          <span>{dragPreview.component}</span>
        </div>
      )}

      {/* Empty State */}
      {!hasComponents && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <LucideIcon name="LayoutGrid" className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>
              {theme === 'artsnob'
                ? 'Your Canvas Awaits'
                : 'Empty Workspace'}
            </h2>
            <p className={styles.emptyDescription}>
              {theme === 'artsnob'
                ? 'Drag components from the toolbar to begin crafting your lighting masterpiece. Each panel is a blank canvas, ready for your artistic vision.'
                : 'Drag components from the toolbar to add them to your workspace.'}
            </p>
            <div className={styles.emptyHint}>
              <LucideIcon name="ArrowRight" />
              <span>Look for the Component Toolbar on the right side</span>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone Indicators */}
      <div className={styles.dropZoneHints}>
        <div className={styles.dropHint}>
          <LucideIcon name="Move" />
          <span>Drop zones available</span>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
