import React from 'react'
import { MidiOscSetup } from '../components/midi/MidiOscSetup'
import { MidiMonitor } from '../components/midi/MidiMonitor'
import { OscMonitor } from '../components/osc/OscMonitor'
import styles from './Pages.module.scss'

const ControlSetupPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Control Setup - MIDI & OSC Configuration</h2>
        <p>Configure MIDI and OSC inputs/outputs for external control</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.setupSection}>
          <MidiOscSetup />
        </div>
        
        <div className={styles.monitorSection}>
          <div className={styles.monitorPanel}>
            <h3>MIDI Monitor</h3>
            <MidiMonitor />
          </div>
          
          <div className={styles.monitorPanel}>
            <h3>OSC Monitor</h3>
            <OscMonitor />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlSetupPage
