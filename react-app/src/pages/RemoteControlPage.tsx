import React from 'react'
import styles from './Pages.module.scss'

const RemoteControlPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Remote Control - TouchOSC Interface</h2>
        <p>Mobile and tablet control interface setup</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.remoteSection}>
          <div className={styles.infoPanel}>
            <h3>TouchOSC Setup</h3>
            <div className={styles.setupInstructions}>
              <p>Configure your mobile device or tablet for wireless DMX control:</p>
              <ul>
                <li>Install TouchOSC app on your device</li>
                <li>Connect to the same network as this controller</li>
                <li>Configure OSC settings to match this interface</li>
                <li>Download and load the custom layout template</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.connectionPanel}>
            <h3>Connection Status</h3>
            <div className={styles.connectionInfo}>
              <p><strong>Server IP:</strong> {window.location.hostname}</p>
              <p><strong>OSC Port:</strong> 8080</p>
              <p><strong>Status:</strong> <span className={styles.statusActive}>Ready</span></p>
            </div>
          </div>
          
          <div className={styles.layoutPanel}>
            <h3>TouchOSC Layout</h3>
            <div className={styles.layoutPreview}>
              <p>Custom layout template for ArtBastard DMX512FTW</p>
              <button className={styles.downloadButton}>
                Download Layout Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemoteControlPage
