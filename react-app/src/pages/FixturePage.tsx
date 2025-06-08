import React from 'react'
import { FixtureSetup } from '../components/fixtures/FixtureSetup'
import styles from './Pages.module.scss'

const FixturePage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Fixture Management</h2>
        <p>Configure and manage DMX fixtures and lighting equipment</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.setupSection}>
          <FixtureSetup />
        </div>
      </div>
    </div>
  )
}

export default FixturePage
