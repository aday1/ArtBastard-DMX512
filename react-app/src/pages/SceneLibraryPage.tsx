import React from 'react'
import { SceneGallery } from '../components/scenes/SceneGallery'
import { AutoSceneControlMini } from '../components/scenes/AutoSceneControlMini'
import styles from './Pages.module.scss'

const SceneLibraryPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>Scene Library</h2>
        <p>Create, manage, and launch lighting scenes</p>
      </div>
      
      <div className={styles.pageContent}>
        <div className={styles.controlSection}>
          <div className={styles.autoControlPanel}>
            <h3>Auto Scene Control</h3>
            <AutoSceneControlMini />
          </div>
        </div>
        
        <div className={styles.gallerySection}>
          <SceneGallery />
        </div>
      </div>
    </div>
  )
}

export default SceneLibraryPage
