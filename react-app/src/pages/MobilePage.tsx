import React from 'react';
import { DmxChannelControlPage } from '../components/pages/DmxChannelControlPage';
import { SuperControl } from '../components/dmx/SuperControl';
import { useMobile } from '../hooks/useMobile';
import { useTheme } from '../context/ThemeContext';
import styles from './MobilePage.module.scss';

const MobilePage: React.FC = () => {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useMobile();
  const [activeTab, setActiveTab] = React.useState<'dmx' | 'supercontrol'>('dmx');

  return (
    <div className={styles.mobilePage}>
      <div className={styles.mobileHeader}>
        <h1 className={styles.mobileTitle}>
          {theme === 'artsnob' 
            ? '📱 ArtBastard Mobile' 
            : '📱 ArtBastard Mobile'}
        </h1>
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tab} ${activeTab === 'dmx' ? styles.active : ''}`}
            onClick={() => setActiveTab('dmx')}
          >
            <span className={styles.tabIcon}>⚡</span>
            <span className={styles.tabLabel}>
              {theme === 'artsnob' ? 'DMX Ultime' : 'DMX Control'}
            </span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'supercontrol' ? styles.active : ''}`}
            onClick={() => setActiveTab('supercontrol')}
          >
            <span className={styles.tabIcon}>💡</span>
            <span className={styles.tabLabel}>
              {theme === 'artsnob' ? 'Super Contrôle' : 'Super Control'}
            </span>
          </button>
        </div>
      </div>
      
      <div className={styles.mobileContent}>
        {activeTab === 'dmx' && (
          <div className={styles.tabContent}>
            <DmxChannelControlPage />
          </div>
        )}
        {activeTab === 'supercontrol' && (
          <div className={styles.tabContent}>
            <SuperControl />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePage;

