import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../context/SocketContext'
import type { SocketContextType } from '../context/SocketContext' // Importing as type
import { useStore } from '../store'
import { DmxControlPanel } from '../components/dmx/DmxControlPanel'
import { MasterFader } from '../components/dmx/MasterFader'
import { MidiOscSetup } from '../components/midi/MidiOscSetup'
import { MidiMonitor } from '../components/midi/MidiMonitor'
import { OscMonitor } from '../components/osc/OscMonitor'
import { MidiClock } from '../components/midi/MidiClock' // Added MidiClock import
import { OscDebug } from '../components/osc/OscDebug'
import { TouchOSCExporter } from '../components/osc/TouchOSCExporter'
import { AudioControlPanel } from '../components/audio/AudioControlPanel'
import { SceneGallery } from '../components/scenes/SceneGallery'
import { AutoSceneControl } from '../components/scenes/AutoSceneControl';
import { FixtureSetup } from '../components/fixtures/FixtureSetup'
import { Settings } from '../components/settings/Settings'
import styles from './MainPage.module.scss'

type ViewType = 'main' | 'midiOsc' | 'fixture' | 'scenes' | 'oscDebug' | 'audio' | 'touchosc' | 'misc'

const MainPage: React.FC = () => {
  const { theme } = useTheme()
  const socketContext = useSocket() as SocketContextType
  const connected = socketContext.connected
  const addNotification = useStore(state => state.addNotification)
  const [currentView, setCurrentView] = useState<ViewType>('main')

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
            <>
              <MasterFader />
              <DmxControlPanel />
              <MidiMonitor />
              <OscMonitor />
              <MidiClock /> {/* Added MidiClock */}
            </>
          )}
          {currentView === 'midiOsc' && <MidiOscSetup />}
          {currentView === 'fixture' && <FixtureSetup />}
          {currentView === 'scenes' && (
            <>
              <SceneGallery />
              <AutoSceneControl />
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