import React from 'react'
import UnifiedSettings from '../components/settings/UnifiedSettings';
import styles from './Pages.module.scss'

const SettingsPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <UnifiedSettings />
      </div>
    </div>
  )
}

export default SettingsPage
