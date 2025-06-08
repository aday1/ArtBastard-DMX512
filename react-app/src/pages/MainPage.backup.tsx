import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../context/SocketContext'
import { usePinning } from '../context/PinningContext'
import type { SocketContextType } from '../context/SocketContext'
import { useStore } from '../store'
import { DmxControlPanel } from '../components/dmx/DmxControlPanel'
import { MasterFader } from '../components/dmx/MasterFader'
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
import { PinButton } from '../components/ui/PinButton'
import styles from './MainPage.module.scss'

type ViewType = 'main' | 'midiOsc' | 'fixture' | 'scenes' | 'oscDebug' | 'audio' | 'touchosc' | 'misc'

const MainPage: React.FC = () => {
  const { theme } = useTheme()
  const socketContext = useSocket() as SocketContextType
  const connected = socketContext.connected
  const { isPinned, togglePin, pinAllComponents, unpinAllComponents } = usePinning()
  
  // Check if any components are unpinned to adjust layout
  const hasUnpinnedComponents = ['master-fader', 'scene-auto', 'chromatic-energy-manipulator', 'scene-quick-launch', 'quick-capture']
    .some(id => !isPinned(id as any))
  
  const {
    addNotification,
    saveScene 
  } = useStore(state => ({
    addNotification: state.addNotification,
    saveScene: state.saveScene
  }))
    const [currentView, setCurrentView] = useState<ViewType>('main')
  const [isAutoSceneMinimized, setIsAutoSceneMinimized] = useState(false)

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
        <div className={styles.viewContainer}>          {currentView === 'main' && (
            <div className={styles.mainLayout}>
              {/* Global Pin Controls */}
              <div className={styles.globalPinControls}>
                <button
                  className={styles.globalPinButton}
                  onClick={pinAllComponents}
                  title="Pin all components to viewport overlay"
                >
                  <i className="fas fa-thumbtack"></i>
                  Pin All
                </button>
                <button
                  className={styles.globalPinButton}
                  onClick={unpinAllComponents}
                  title="Unpin all components from viewport overlay"
                >
                  <i className="fas fa-thumb-tack"></i>
                  Unpin All
                </button>
                <span className={styles.pinnedCount}>
                  {['master-fader', 'scene-auto', 'chromatic-energy-manipulator', 'scene-quick-launch', 'quick-capture']
                    .filter(id => isPinned(id as any)).length} of 5 pinned
                </span>
              </div>

              {/* Fixed Quick Capture Button - Always Visible and Follows Scroll */}              <div className={`${styles.fixedQuickCapture} ${isPinned('quick-capture') ? styles.pinned : styles.unpinned}`}>
                <PinButton componentId="quick-capture" size="small" showLabel={false} />
                <button
                  className={styles.quickSaveButton}
                  onClick={handleQuickSave}
                  title="Quick save current DMX state with timestamp"
                >
                  <i className="fas fa-bolt"></i>
                  {theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'}
                </button>
              </div>

              {/* Central Content Area */}
              <div className={`${styles.centralContent} ${hasUnpinnedComponents ? styles.hasUnpinned : ''}`}>
                <DmxControlPanel />
                <MidiMonitor />
                <OscMonitor />
                
                {/* Unpinned Components Section */}
                {hasUnpinnedComponents && (
                  <div className={styles.unpinnedContainer}>
                    <h3>Unpinned Controls</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {!isPinned('quick-capture') && (
                        <div className={`${styles.fixedQuickCapture} ${styles.unpinned}`}>
                          <PinButton componentId="quick-capture" size="small" showLabel={false} />
                          <button
                            className={styles.quickSaveButton}
                            onClick={handleQuickSave}
                            title="Quick save current DMX state with timestamp"
                          >
                            <i className="fas fa-bolt"></i>
                            {theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'}
                          </button>
                        </div>
                      )}
                      {!isPinned('master-fader') && (
                        <div className={`${styles.bottomCenterDock} ${styles.unpinned}`}>
                          <PinButton componentId="master-fader" size="small" showLabel={false} />
                          <MasterFader isDockable={false} />
                        </div>
                      )}
                      {!isPinned('scene-auto') && (
                        <div className={`${styles.bottomLeftDock} ${styles.unpinned}`}>
                          <PinButton componentId="scene-auto" size="small" showLabel={false} />
                          <AutoSceneControlMini isDockable={false} />
                        </div>
                      )}
                      {!isPinned('chromatic-energy-manipulator') && (
                        <div className={`${styles.leftMiddleDock} ${styles.unpinned}`}>
                          <PinButton componentId="chromatic-energy-manipulator" size="small" showLabel={false} />
                          <ChromaticEnergyManipulatorMini isDockable={false} />
                        </div>
                      )}
                      {!isPinned('scene-quick-launch') && (
                        <div className={`${styles.rightMiddleDock} ${styles.unpinned}`}>
                          <PinButton componentId="scene-quick-launch" size="small" showLabel={false} />
                          <SceneQuickLaunch isDockable={false} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>              {/* Fixed Docked Elements - Only show pinned components */}
              <div className={styles.dockedElements}>
                {/* Left Middle - Chromatic Energy Manipulator Mini */}
                {isPinned('chromatic-energy-manipulator') && (
                  <div className={`${styles.leftMiddleDock} ${styles.pinned}`}>
                    <PinButton componentId="chromatic-energy-manipulator" size="small" showLabel={false} />
                    <ChromaticEnergyManipulatorMini isDockable={false} />
                  </div>
                )}

                {/* Right Middle - Scene Quick Launch */}
                {isPinned('scene-quick-launch') && (
                  <div className={`${styles.rightMiddleDock} ${styles.pinned}`}>
                    <PinButton componentId="scene-quick-launch" size="small" showLabel={false} />
                    <SceneQuickLaunch isDockable={false} />
                  </div>
                )}

                {/* Bottom Left Middle - Scene Auto */}
                {isPinned('scene-auto') && (
                  <div className={`${styles.bottomLeftDock} ${styles.pinned}`}>
                    <PinButton componentId="scene-auto" size="small" showLabel={false} />
                    <AutoSceneControlMini isDockable={false} />
                  </div>
                )}

                {/* Bottom Center - Master Fader */}
                {isPinned('master-fader') && (
                  <div className={`${styles.bottomCenterDock} ${styles.pinned}`}>
                    <PinButton componentId="master-fader" size="small" showLabel={false} />
                    <MasterFader isDockable={false} />
                  </div>
                )}
              </div>

              {/* Fixed Quick Capture Button - Only show when pinned */}
              {isPinned('quick-capture') && (
                <div className={`${styles.fixedQuickCapture} ${styles.pinned}`}>
                  <PinButton componentId="quick-capture" size="small" showLabel={false} />
                  <button
                    className={styles.quickSaveButton}
                    onClick={handleQuickSave}
                    title="Quick save current DMX state with timestamp"
                  >
                    <i className="fas fa-bolt"></i>
                    {theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'}
                  </button>
                </div>
              )}
            </div>
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