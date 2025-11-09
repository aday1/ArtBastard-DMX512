import React, { useState } from 'react';
import { FaceTracker } from '../components/face-tracker/FaceTracker';
import { FaceTrackerDebug } from '../components/face-tracker/FaceTrackerDebug';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import styles from './ExperimentalPage.module.scss';

const ExperimentalPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'main' | 'debug'>('main');

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
              
              {/* Tab Switcher */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setActiveTab('main')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'main' ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' : 'rgba(255,255,255,0.1)',
                    border: activeTab === 'main' ? '2px solid #00d4ff' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: activeTab === 'main' ? '0 4px 12px rgba(0, 212, 255, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  🎭 Full Face Tracker
                </button>
                <button
                  onClick={() => setActiveTab('debug')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'debug' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                    border: activeTab === 'debug' ? '2px solid #667eea' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: activeTab === 'debug' ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  🐛 DEBUG (Minimal)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.trackerSection}>
          <div className={styles.trackerContainer}>
            {activeTab === 'main' ? <FaceTracker /> : <FaceTrackerDebug />}
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

