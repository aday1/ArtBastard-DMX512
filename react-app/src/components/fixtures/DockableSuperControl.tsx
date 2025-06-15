import React, { useState, useEffect } from 'react';
import { DockableComponent } from '../ui/DockableComponent';
import { DockPosition } from '../../context/DockingContext';
import SuperControl from './SuperControl';
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './DockableSuperControl.module.scss';

interface DockableSuperControlProps {
  id?: string;
  initialPosition?: DockPosition;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  width?: string;
  height?: string;
  isDraggable?: boolean;
  showMinimizeButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DockableSuperControl: React.FC<DockableSuperControlProps> = ({
  id = 'dockable-super-control',
  initialPosition = { zone: 'floating', offset: { x: 100, y: 100 } },
  isCollapsed = false,
  onCollapsedChange,
  isMinimized = false,
  onMinimizedChange,
  width = '900px',
  height = '700px',
  isDraggable = true,
  showMinimizeButton = true,
  className = '',
  style = {}
}) => {
  const { fixtures, groups, selectedChannels } = useStore();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [minimized, setMinimized] = useState(isMinimized);

  // Update external state when internal state changes
  const handleCollapsedChange = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const handleMinimizedChange = (newMinimized: boolean) => {
    setMinimized(newMinimized);
    onMinimizedChange?.(newMinimized);
  };

  // Get selection info for collapsed state
  const getSelectionSummary = () => {
    if (selectedChannels.length > 0) {
      return `${selectedChannels.length} channels selected`;
    }
    return 'No selection';
  };
  return (
    <DockableComponent
      id={id}
      title="Super Control"
      component="professional-fixture-controller"
      defaultPosition={initialPosition}
      isCollapsed={collapsed}
      onCollapsedChange={handleCollapsedChange}
      isMinimized={minimized}
      onMinimizedChange={handleMinimizedChange}
      width={width}
      height={height}
      isDraggable={isDraggable}
      showMinimizeButton={showMinimizeButton}
      className={`${styles.dockableSuperControl} ${className}`}
      style={style}
    >
      <div className={styles.content}>
        {!collapsed && !minimized && (
          <div className={styles.fullContent}>
            <SuperControl isDockable={true} />
          </div>
        )}
        {collapsed && !minimized && (
          <div className={styles.collapsedContent}>
            <div className={styles.collapsedHeader}>
              <LucideIcon name="Settings" />
              <div className={styles.collapsedInfo}>
                <span className={styles.collapsedTitle}>Super Control</span>
                <span className={styles.collapsedSummary}>{getSelectionSummary()}</span>
              </div>
            </div>
            <div className={styles.collapsedStats}>
              <div className={styles.stat}>
                <LucideIcon name="Lightbulb" size={16} />
                <span>{fixtures.length}</span>
              </div>
              <div className={styles.stat}>
                <LucideIcon name="Users" size={16} />
                <span>{groups.length}</span>
              </div>
              <div className={styles.stat}>
                <LucideIcon name="Radio" size={16} />
                <span>{selectedChannels.length}</span>
              </div>
            </div>
          </div>
        )}
        {minimized && (
          <div className={styles.minimizedContent}>
            <LucideIcon name="Settings" />
          </div>
        )}
      </div>
    </DockableComponent>
  );
};

export default DockableSuperControl;
