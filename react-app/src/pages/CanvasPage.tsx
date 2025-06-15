import React from 'react'
import { FixtureCanvas2D } from '../components/fixtures/FixtureCanvas2D'
import { CanvasImageUpload } from '../components/fixtures/CanvasImageUpload'
import { useStore } from '../store'
import { useTheme } from '../context/ThemeContext'
import styles from './Pages.module.scss'

const CanvasPage: React.FC = () => {
  const { theme } = useTheme()
  const { 
    fixtures, 
    fixtureLayout, 
    setFixtureLayout, 
    canvasBackgroundImage, 
    setCanvasBackgroundImage 
  } = useStore(state => ({
    fixtures: state.fixtures,
    fixtureLayout: state.fixtureLayout,
    setFixtureLayout: state.setFixtureLayout,
    canvasBackgroundImage: state.canvasBackgroundImage,
    setCanvasBackgroundImage: state.setCanvasBackgroundImage
  }))

  const handleUpdatePlacedFixtures = (updatedFixtures: any[]) => {
    setFixtureLayout(updatedFixtures)
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
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

      <div className={styles.pageContent}>
        <div className={styles.canvasSection}>
          {/* Canvas Background Image Upload */}
          <div className={styles.canvasControls}>
            <CanvasImageUpload 
              onImageUploaded={setCanvasBackgroundImage}
              currentImage={canvasBackgroundImage}
            />
          </div>
          
          {/* 2D Fixture Canvas */}
          <FixtureCanvas2D
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
