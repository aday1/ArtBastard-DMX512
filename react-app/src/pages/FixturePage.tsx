import React from 'react'
import { FixtureSetup } from '../components/fixtures/FixtureSetup'
import { DMXChannelGrid } from '../components/dmx/DMXChannelGrid'
import { DmxWebglVisualizer } from '../components/dmx/DmxWebglVisualizer'
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
        
        <div className={styles.visualizationSection}>
          <div className={styles.visualPanel}>
            <h3>DMX Channel Grid</h3>
            <DMXChannelGrid />
          </div>
          
          <div className={styles.visualPanel}>
            <h3>3D Visualizer</h3>
            <DmxWebglVisualizer />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FixturePage
