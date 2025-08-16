import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { DMXUniverseDiscoveryWizard } from '../components/planner/DMXUniverseDiscoveryWizard'
import styles from './Pages.module.scss'

const PlannerPage: React.FC = () => {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'wizard' | 'overview'>('wizard')

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>
          {theme === 'artsnob' && '🎭 Universe Planner: From Zero to Hero'}
          {theme === 'standard' && 'DMX Universe Planner'}
          {theme === 'minimal' && 'DMX Planner'}
        </h2>
        <p>
          {theme === 'artsnob' && 'So, you bought some cheap Chinese DMX lights with zero documentation? Fear not, noble lighting warrior! This comprehensive planner shall guide you from the darkness of ignorance into the brilliant light of DMX mastery.'}
          {theme === 'standard' && 'Comprehensive DMX fixture planning and universe discovery wizard for new lighting setups'}
          {theme === 'minimal' && 'Plan and configure DMX fixtures'}
        </p>
        
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'wizard' ? styles.active : ''}`}
            onClick={() => setActiveTab('wizard')}
          >
            {theme === 'artsnob' && '🧙‍♂️ Discovery Wizard'}
            {theme === 'standard' && 'Setup Wizard'}
            {theme === 'minimal' && 'Wizard'}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {theme === 'artsnob' && '📊 Universe Overview'}
            {theme === 'standard' && 'Universe Map'}
            {theme === 'minimal' && 'Map'}
          </button>
        </div>
      </div>

      <div className={styles.pageContent}>
        {activeTab === 'wizard' && (
          <div className={styles.wizardSection}>
            <DMXUniverseDiscoveryWizard />
          </div>
        )}
        
        {activeTab === 'overview' && (
          <div className={styles.overviewSection}>
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '2px dashed var(--border-color)' }}>
              <h3>
                {theme === 'artsnob' && '🎨 Your Luminous Empire Awaits'}
                {theme === 'standard' && 'Universe Overview Coming Soon'}
                {theme === 'minimal' && 'Overview TBD'}
              </h3>
              <p>
                {theme === 'artsnob' && 'Once you complete the discovery wizard, this space shall display your magnificent DMX universe in all its glory!'}
                {theme === 'standard' && 'Complete the setup wizard to see your DMX universe layout and configuration.'}
                {theme === 'minimal' && 'Complete wizard first.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlannerPage