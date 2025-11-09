import React from 'react';
import { OpenCVVisageTrackerExperimental } from '../components/face-tracker/FaceTrackerDebug';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import styles from './ExperimentalPage.module.scss';

const ExperimentalPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={styles.experimentalPage}>
      {/* Elitist Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <LucideIcon name="FlaskConical" className={styles.icon} />
            <div>
              <h1 className={styles.mainTitle}>
                {theme === 'artsnob' ? '🧪 Laboratoire Expérimental - OpenCV Visage Tracker' : 
                 theme === 'minimal' ? 'Experimental OpenCV Face Tracker' : 
                 'Experimental OpenCV Face Tracker'}
              </h1>
              <p className={styles.subtitle}>
                {theme === 'artsnob' 
                  ? 'Œuvre incomplète - Work In Progress. Highly experimental and incomplete implementation.'
                  : 'Work In Progress - Highly experimental and incomplete'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.trackerSection}>
          <div className={styles.trackerContainer}>
            <OpenCVVisageTrackerExperimental />
          </div>
        </div>
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

