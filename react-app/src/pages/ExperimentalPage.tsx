import React, { useState } from 'react';
import { OpenCVVisageTrackerExperimental } from '../components/face-tracker/FaceTrackerDebug';
import { OscPlaceholder } from '../components/osc/OscPlaceholder';
import { TouchOSCExporter } from '../components/osc/TouchOSCExporter';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import styles from './ExperimentalPage.module.scss';

const ExperimentalPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'opencv' | 'osc' | 'touchosc'>('opencv');

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
                  ? 'Œuvre incomplète - Work In Progress. Highly experimental and incomplete implementations. Use at your own risk, mon ami.'
                  : 'Work In Progress - Highly experimental and incomplete. Use at your own risk.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div style={{
        margin: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
        border: '2px solid rgba(251, 191, 36, 0.8)',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: '#fde68a', 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          Experimental Zone
        </h2>
        <p style={{ 
          color: '#fef3c7', 
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '0.5rem'
        }}>
          <strong>Use these tools for testing and iteration before production shows.</strong>
        </p>
        <p style={{ 
          color: '#fef3c7', 
          fontSize: '0.95rem',
          lineHeight: '1.6'
        }}>
          OpenCV tracking and legacy OSC panels are still evolving. TouchOSC layout generation is now available here.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'opencv' ? styles.active : ''}`}
          onClick={() => setActiveTab('opencv')}
        >
          <LucideIcon name="Camera" />
          <span>OpenCV Visage Tracker</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'osc' ? styles.active : ''}`}
          onClick={() => setActiveTab('osc')}
        >
          <LucideIcon name="Globe" />
          <span>OSC Placeholder</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'touchosc' ? styles.active : ''}`}
          onClick={() => setActiveTab('touchosc')}
        >
          <LucideIcon name="SmartphoneNfc" />
          <span>TouchOSC Layouts</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {activeTab === 'opencv' && (
          <div className={styles.trackerSection}>
            <div className={styles.trackerContainer}>
              <OpenCVVisageTrackerExperimental />
            </div>
          </div>
        )}
        
        {activeTab === 'osc' && (
          <div className={styles.oscSection}>
            <OscPlaceholder />
          </div>
        )}

        {activeTab === 'touchosc' && (
          <div className={styles.oscSection}>
            <TouchOSCExporter />
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

