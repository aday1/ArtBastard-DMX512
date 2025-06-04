import React, { useState } from 'react';
import { DockableComponent } from '@/components/ui/DockableComponent';
import { useStore } from '../../store';
import styles from './SceneQuickLaunch.module.scss';

interface SceneQuickLaunchProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const SceneQuickLaunch: React.FC<SceneQuickLaunchProps> = ({
  isCollapsed = false,
  onCollapsedChange,
}) => {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  
  // Get scenes from store instead of API
  const { scenes, loadScene } = useStore(state => ({
    scenes: state.scenes,
    loadScene: state.loadScene
  }));
  const handleSceneActivate = async (sceneName: string) => {
    try {
      loadScene(sceneName);
      setActiveSceneId(sceneName);
    } catch (error) {
      console.error('Failed to activate scene:', error);
    }
  };

  const handleToggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    onCollapsedChange?.(newCollapsed);
  };
  const renderContent = () => {
    if (scenes.length === 0) {
      return (
        <div className={styles.empty}>
          <p>No scenes available</p>
          <small>Create scenes in the Scene Manager</small>
        </div>
      );
    }

    return (
      <div className={styles.sceneGrid}>
        {scenes.map((scene) => (
          <button
            key={scene.name}
            className={`${styles.sceneButton} ${scene.name === activeSceneId ? styles.active : ''}`}
            onClick={() => handleSceneActivate(scene.name)}
            title={scene.oscAddress || scene.name}
          >
            <div className={styles.sceneName}>{scene.name}</div>
            {scene.name === activeSceneId && (
              <div className={styles.activeIndicator}>●</div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <DockableComponent
      id="scene-quick-launch"
      title="Scene Quick Launch"
      component="midi-clock" // Reusing existing component type
      defaultPosition={{ zone: 'top-right' }}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      width="280px"
      height="auto"
      className={styles.container}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Quick Launch</h3>
        <button 
          className={styles.collapseButton}
          onClick={handleToggleCollapsed}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className={styles.content}>
          {renderContent()}
        </div>
      )}
    </DockableComponent>
  );
};
