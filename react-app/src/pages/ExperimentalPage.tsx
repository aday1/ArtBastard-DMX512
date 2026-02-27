import React, { useState } from 'react';
import { OpenCVVisageTrackerExperimental } from '../components/face-tracker/FaceTrackerDebug';
import { OscPlaceholder } from '../components/osc/OscPlaceholder';
import { TouchOSCExporter } from '../components/osc/TouchOSCExporter';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import styles from './ExperimentalPage.module.scss';

type ExperimentalTab = 'opencv' | 'osc' | 'touchosc';

const getTabFromHash = (): ExperimentalTab => {
  const hash = window.location.hash || '';
  const query = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const tab = params.get('tab');

  if (tab === 'touchosc') return 'touchosc';
  if (tab === 'osc') return 'osc';
  return 'opencv';
};

const ExperimentalPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<ExperimentalTab>(getTabFromHash());

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const setTabWithHash = (nextTab: ExperimentalTab) => {
    setActiveTab(nextTab);
    const nextHash = `#/experimental?tab=${nextTab}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  };

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
          onClick={() => setTabWithHash('opencv')}
        >
          <LucideIcon name="Camera" />
          <span>OpenCV Visage Tracker</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'osc' ? styles.active : ''}`}
          onClick={() => setTabWithHash('osc')}
        >
          <LucideIcon name="Globe" />
          <span>OSC Placeholder</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'touchosc' ? styles.active : ''}`}
          onClick={() => setTabWithHash('touchosc')}
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

