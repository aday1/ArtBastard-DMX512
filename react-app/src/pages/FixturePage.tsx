import React, { useState } from 'react'
import { FixtureSetup } from '../components/fixtures/FixtureSetup'
import UnifiedFixtureController from '../components/fixtures/UnifiedFixtureController'
import { useTheme } from '../context/ThemeContext'
import styles from './Pages.module.scss'

const FixturePage: React.FC = () => {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'setup' | 'control'>('control')

  return (
    <div className={styles.pageContainer}>      <div className={styles.pageHeader}>
        <h2>
          {theme === 'artsnob' && 'Fixture Orchestration: The Instruments of Light'}
          {theme === 'standard' && 'Fixture Management'}
          {theme === 'minimal' && 'Fixtures'}
        </h2>
        <p>
          {theme === 'artsnob' && 'Define, configure, and control your luminous instruments'}
          {theme === 'standard' && 'Configure fixture definitions and control lighting equipment'}
          {theme === 'minimal' && 'Configure and control fixtures'}
        </p>
        
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'control' ? styles.active : ''}`}
            onClick={() => setActiveTab('control')}
          >
            {theme === 'artsnob' && 'Luminous Control Interface'}
            {theme === 'standard' && 'Fixture Control'}
            {theme === 'minimal' && 'Control'}
          </button>          <button
            className={`${styles.tabButton} ${activeTab === 'setup' ? styles.active : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            {theme === 'artsnob' && 'Definition Sanctuary'}
            {theme === 'standard' && 'Fixture Definitions'}
            {theme === 'minimal' && 'Setup'}
          </button>
        </div>
      </div>
        <div className={styles.pageContent}>
        {activeTab === 'control' && (
          <div className={`${styles.controlSection} ${styles.fixtureController}`}>
            <UnifiedFixtureController />
          </div>
        )}
        
        {activeTab === 'setup' && (
          <div className={styles.setupSection}>
            <FixtureSetup />
          </div>
        )}
      </div>
    </div>
  )
}

export default FixturePage
