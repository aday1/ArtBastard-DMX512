import React from 'react'
import { AudioControlPanel } from '../components/audio/AudioControlPanel'
import styles from './Pages.module.scss'

const AudioAnalysisPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Audio Analysis</h2>
        <p>Real-time audio analysis and music-reactive lighting control</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.audioSection}>
          <AudioControlPanel />
        </div>
      </div>
    </div>
  )
}

export default AudioAnalysisPage
