import React from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import styles from '../pages/DmxChannelControlPage.module.scss';

interface DmxSceneControlsProps {
  scenes: Array<{ name: string }>;
  onSaveScene: () => void;
  onLoadScene: (sceneName: string) => void;
}

export const DmxSceneControls: React.FC<DmxSceneControlsProps> = ({
  scenes,
  onSaveScene,
  onLoadScene,
}) => {
  return (
    <div className={styles.sceneControls}>
      <div className={styles.sceneSection}>
        <h3 className={styles.sectionTitle}>
          <LucideIcon name="Camera" />
          Scene Management
        </h3>
        <div className={styles.sceneActions}>
          <button
            className={styles.sceneButton}
            onClick={onSaveScene}
            title="Save current DMX state as a scene"
          >
            <LucideIcon name="Save" />
            Save Scene
          </button>

          {scenes.length > 0 && (
            <div className={styles.sceneList}>
              <label className={styles.sceneListLabel}>Load Scene:</label>
              <div className={styles.sceneButtons}>
                {scenes.map((scene, index) => (
                  <button
                    key={`${scene.name}-${index}`}
                    className={styles.loadSceneButton}
                    onClick={() => onLoadScene(scene.name)}
                    title={`Load scene: ${scene.name}`}
                  >
                    <LucideIcon name="Play" />
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
