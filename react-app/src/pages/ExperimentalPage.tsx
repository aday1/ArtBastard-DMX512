import React, { useState } from 'react';
import { FaceTracker } from '../components/face-tracker/FaceTracker';
import { FaceTrackerConfig } from '../components/face-tracker/FaceTrackerConfig';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import styles from './ExperimentalPage.module.scss';

const ExperimentalPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'tracker' | 'config'>('tracker');
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className={styles.experimentalPage}>
      {/* Elitist Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <LucideIcon name="FlaskConical" className={styles.icon} />
            <div>
              <h1 className={styles.mainTitle}>
                {theme === 'artsnob' ? '🧪 Laboratoire Expérimental' : 
                 theme === 'minimal' ? 'Experimental' : 
                 'Experimental Laboratory'}
              </h1>
              <p className={styles.subtitle}>
                {theme === 'artsnob' 
                  ? 'Where mere mortals dare not tread. Advanced face tracking and experimental controls for the enlightened few.'
                  : 'Advanced face tracking and experimental controls'}
              </p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button
              className={`${styles.tabButton} ${activeTab === 'tracker' ? styles.active : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              <LucideIcon name="Video" />
              <span>Face Tracker</span>
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'config' ? styles.active : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <LucideIcon name="Settings" />
              <span>Configuration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {activeTab === 'tracker' && (
          <div className={styles.trackerSection}>
            <div className={styles.trackerContainer}>
              <FaceTracker />
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className={styles.configSection}>
            <div className={styles.configContainer}>
              <FaceTrackerConfig />
            </div>
          </div>
        )}
      </div>

      {/* Elitist Footer Note */}
      {theme === 'artsnob' && (
        <div className={styles.footerNote}>
          <LucideIcon name="Info" />
          <span>
            <em>Note for the uninitiated:</em> This is experimental technology. 
            If you find yourself confused, perhaps you should stick to simpler tools, 
            <em>mon ami</em>.
          </span>
        </div>
      )}
    </div>
  );
};

export default ExperimentalPage;

