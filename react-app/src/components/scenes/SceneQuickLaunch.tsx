import React, { useState, useEffect } from 'react';
import { DockableComponent } from '@/components/ui/DockableComponent';
import styles from './SceneQuickLaunch.module.scss';

interface Scene {
  id: string;
  name: string;
  description?: string;
  channels: { [channelId: string]: number };
  isActive?: boolean;
}

interface SceneQuickLaunchProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const SceneQuickLaunch: React.FC<SceneQuickLaunchProps> = ({
  isCollapsed = false,
  onCollapsedChange,
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load scenes from API
  useEffect(() => {
    const loadScenes = async () => {
      try {
        const response = await fetch('/api/scenes');
        if (response.ok) {
          const scenesData = await response.json();
          setScenes(scenesData);
        }
      } catch (error) {
        console.error('Failed to load scenes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScenes();
  }, []);

  const handleSceneActivate = async (sceneId: string) => {
    try {
      const response = await fetch(`/api/scenes/${sceneId}/activate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setActiveSceneId(sceneId);
        
        // Update scenes list to reflect active state
        setScenes(prevScenes => 
          prevScenes.map(scene => ({
            ...scene,
            isActive: scene.id === sceneId
          }))
        );
      }
    } catch (error) {
      console.error('Failed to activate scene:', error);
    }
  };

  const handleToggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    onCollapsedChange?.(newCollapsed);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading scenes...</span>
        </div>
      );
    }

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
            key={scene.id}
            className={`${styles.sceneButton} ${scene.isActive ? styles.active : ''}`}
            onClick={() => handleSceneActivate(scene.id)}
            title={scene.description || scene.name}
          >
            <div className={styles.sceneName}>{scene.name}</div>
            {scene.isActive && (
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
