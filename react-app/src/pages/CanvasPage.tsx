import React, { useState } from 'react'
import { FixtureCanvasInteractive } from '../components/fixtures/FixtureCanvasInteractive'
import { CanvasImageUpload } from '../components/fixtures/CanvasImageUpload'
import ScenePanel from '../components/scenes/ScenePanel'
import { useStore } from '../store'
import { useTheme } from '../context/ThemeContext'
import { LucideIcon } from '../components/ui/LucideIcon'
import styles from './Pages.module.scss'

const CanvasPage: React.FC = () => {
  const { theme } = useTheme()
  const { 
    fixtures, 
    fixtureLayout, 
    setFixtureLayout, 
    canvasBackgroundImage, 
    setCanvasBackgroundImage,
    scenes,
    saveScene,
    loadScene,
    deleteScene,
    addNotification
  } = useStore(state => ({
    fixtures: state.fixtures,
    fixtureLayout: state.fixtureLayout,
    setFixtureLayout: state.setFixtureLayout,
    canvasBackgroundImage: state.canvasBackgroundImage,
    setCanvasBackgroundImage: state.setCanvasBackgroundImage,
    scenes: state.scenes,
    saveScene: state.saveScene,
    loadScene: state.loadScene,
    deleteScene: state.deleteScene,
    addNotification: state.addNotification
  }))

  const [sceneNameInput, setSceneNameInput] = useState('')
  const [isScenePanelDocked, setIsScenePanelDocked] = useState(true)
  const [scenePanelPosition, setScenePanelPosition] = useState({ x: 100, y: 100 })

  const handleUpdatePlacedFixtures = (updatedFixtures: any[]) => {
    setFixtureLayout(updatedFixtures)
  }

  const handleSaveScene = () => {
    if (sceneNameInput.trim()) {
      const oscAddress = `/scene/${sceneNameInput.trim().toLowerCase().replace(/\s+/g, '_')}`
      saveScene(sceneNameInput.trim(), oscAddress)
      addNotification({
        message: `Scene "${sceneNameInput.trim()}" saved successfully`,
        type: 'success'
      })
      setSceneNameInput('')
    }
  }

  const handleLoadScene = (sceneName: string) => {
    const scene = scenes.find(s => s.name === sceneName)
    if (scene) {
      loadScene(sceneName)
      addNotification({
        message: `Scene "${scene.name}" loaded`,
        type: 'success'
      })
    }
  }

  const handleDeleteScene = (sceneName: string) => {
    const scene = scenes.find(s => s.name === sceneName)
    if (scene && confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(sceneName)
      addNotification({
        message: `Scene "${scene.name}" deleted`,
        type: 'info'
      })
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h2>
            {theme === 'artsnob' && 'The Luminous Canvas: Spatial Orchestration'}
            {theme === 'standard' && '2D Fixture Canvas'}
            {theme === 'minimal' && 'Canvas'}
          </h2>
          <p>
            {theme === 'artsnob' && 'Visualize and arrange your lighting instruments in the sacred space of creation'}
            {theme === 'standard' && 'Visually arrange and control fixtures in 2D space with master sliders and real-time interaction'}
            {theme === 'minimal' && 'Visual fixture placement and control'}
          </p>
        </div>
        
        {/* Scene Management Panel in Top Bar */}
        <div className={styles.topBarTools}>
          <ScenePanel 
            isDocked={isScenePanelDocked}
            onToggleDocked={() => setIsScenePanelDocked(!isScenePanelDocked)}
            position={scenePanelPosition}
            onPositionChange={setScenePanelPosition}
          />
        </div>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.canvasSection}>
          {/* Canvas Background Image Upload */}
          <div className={styles.canvasControls}>
            <CanvasImageUpload 
              onImageUploaded={setCanvasBackgroundImage}
              currentImage={canvasBackgroundImage}
            />
          </div>
          
          {/* Professional Interactive 2D Canvas */}
          <FixtureCanvasInteractive
            fixtures={fixtures}
            placedFixturesData={fixtureLayout}
            onUpdatePlacedFixtures={handleUpdatePlacedFixtures}
          />
        </div>
      </div>
    </div>
  )
}

export default CanvasPage
