import React from 'react'
import { DebugMenu } from '../components/debug/DebugMenu'
import styles from './DebugPage.module.scss'

const DebugPage: React.FC = () => {
  return (
    <div className={styles.debugPage}>
      <div className={styles.header}>
        <h1>🐛 Debug & Help Center</h1>
        <p>Advanced debugging tools and system diagnostics for the enlightened</p>
      </div>
      
      <div className={styles.content}>
        <DebugMenu position="embedded" />
      </div>
    </div>
  )
}

export default DebugPage
