import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../context/SocketContext'
import type { SocketContextType } from '../context/SocketContext'
import { useStore } from '../store'
import { DmxControlPanel } from '../components/dmx/DmxControlPanel'
import { MasterFader } from '../components/dmx/MasterFader'
import { DMXChannelGrid } from '../components/dmx/DMXChannelGrid'
import { MidiOscSetup } from '../components/midi/MidiOscSetup'
import { MidiMonitor } from '../components/midi/MidiMonitor'
import { OscMonitor } from '../components/osc/OscMonitor'
import { SceneQuickLaunch } from '../components/scenes/SceneQuickLaunch'
import { AutoSceneControlMini } from '../components/scenes/AutoSceneControlMini'
// Use the fixtures mini version for the main page
import ChromaticEnergyManipulatorMini from '../components/fixtures/ChromaticEnergyManipulatorMini'
import { OscDebug } from '../components/osc/OscDebug'
import { TouchOSCExporter } from '../components/osc/TouchOSCExporter'
import { AudioControlPanel } from '../components/audio/AudioControlPanel'
import { SceneGallery } from '../components/scenes/SceneGallery'
import { AutoSceneControl } from '../components/scenes/AutoSceneControl'
import { FixtureSetup } from '../components/fixtures/FixtureSetup'
import { Settings } from '../components/settings/Settings'
import styles from './MainPage.module.scss'

type ViewType = 'main' | 'midiOsc' | 'fixture' | 'scenes' | 'oscDebug' | 'audio' | 'touchosc' | 'misc'

const MainPage: React.FC = () => {
  const { theme } = useTheme()
  const socketContext = useSocket() as SocketContextType
  const connected = socketContext.connected
  
  const {
    addNotification,
    saveScene 
  } = useStore(state => ({
    addNotification: state.addNotification,
    saveScene: state.saveScene
  }))
  
  const [currentView, setCurrentView] = useState<ViewType>('main')
  const [isAutoSceneMinimized, setIsAutoSceneMinimized] = useState(false)
  const [showDMXChannelGrid, setShowDMXChannelGrid] = useState(false)

  const handleQuickSave = () => {
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-')
    const quickName = `Quick_${timestamp}`
    saveScene(quickName, `/scene/${quickName.toLowerCase()}`)
    addNotification({
      message: `Quick saved as "${quickName}"`,
      type: 'success',
      priority: 'normal'
    })
  }

  // Handle view changes from navbar
  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ view: ViewType }>
      setCurrentView(customEvent.detail.view)
    }

    window.addEventListener('changeView', handleViewChange)
    return () => window.removeEventListener('changeView', handleViewChange)
  }, [])

  // Handle connection state changes
  useEffect(() => {
    if (!connected) {
      addNotification({ 
        message: 'Lost connection to server - some features may be limited', 
        type: 'error',
        priority: 'high'
      })
    }
  }, [connected, addNotification])

  const renderContent = () => {
    return (
      <div className={styles.content}>
        {!connected && (
          <div className={styles.connectionWarning}>
            <i className="fas fa-exclamation-triangle"></i>
            Connection lost - attempting to reconnect...
          </div>
        )}
        <div className={styles.viewContainer}>
          {currentView === 'main' && (
            <>              <div className={styles.mainControls}>
                <button
                  className={styles.quickSaveButton}
                  onClick={handleQuickSave}
                  title="Quick save current DMX state with timestamp"
                >
                  <i className="fas fa-bolt"></i>
                  {theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'}
                </button>
                <button
                  className={styles.dmxChannelGridButton}
                  onClick={() => setShowDMXChannelGrid(!showDMXChannelGrid)}
                  title="Open DMX Channel Grid"
                >
                  <i className="fas fa-th"></i>
                  DMX Grid
                </button>
              </div>
              <MasterFader />
              <DmxControlPanel />              <MidiMonitor />
              <OscMonitor />
              <SceneQuickLaunch />              <AutoSceneControlMini />
              <ChromaticEnergyManipulatorMini />
              {showDMXChannelGrid && (
                <DMXChannelGrid
                  onChannelSelect={(channel) => console.log('Selected channel:', channel)}
                  isDockable={true}
                />
              )}
            </>
          )}
          {currentView === 'midiOsc' && <MidiOscSetup />}
          {currentView === 'fixture' && <FixtureSetup />}
          {currentView === 'scenes' && (
            <>
              <SceneGallery />
              <AutoSceneControl 
                isMinimized={isAutoSceneMinimized}
                onMinimizedChange={setIsAutoSceneMinimized}
              />
            </>
          )}
          {currentView === 'oscDebug' && <OscDebug />}
          {currentView === 'audio' && <AudioControlPanel />}
          {currentView === 'touchosc' && <TouchOSCExporter />}
          {currentView === 'misc' && <Settings />}
        </div>
      </div>
    )
  }

  return renderContent()
}

export default MainPage