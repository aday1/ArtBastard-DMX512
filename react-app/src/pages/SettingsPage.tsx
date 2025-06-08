import React from 'react'
import styles from './Pages.module.scss'
import NetworkSettingsPanel from '../components/settings/NetworkSettingsPanel';
import PerformanceSettingsPanel from '../components/settings/PerformanceSettingsPanel';
import ImportExportPanel from '../components/settings/ImportExportPanel';

const SettingsPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Configuration & Settings</h2>
        <p>System configuration and advanced settings</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.settingsSection}>
          <div className={styles.settingsPanel}>
            <h3>Theme Settings</h3>
            <div className={styles.settingsGroup}>
              <p>Interface theme and appearance options</p>
              {/* Theme controls will be integrated here */}
            </div>
          </div>
          
          <div className={styles.settingsPanel}>
            <h3>Network Settings</h3>
            <div className={styles.settingsGroup}>
              <p>DMX network and communication settings</p>
              <NetworkSettingsPanel />
            </div>
          </div>
          
          <div className={styles.settingsPanel}>
            <h3>Performance Settings</h3>
            <div className={styles.settingsGroup}>
              <p>Performance optimization and debugging options</p>
              <PerformanceSettingsPanel />
            </div>
          </div>
          
          <div className={styles.settingsPanel}>
            {/*<h3>Import/Export</h3> // Title is now in the panel itself */}
            <ImportExportPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
