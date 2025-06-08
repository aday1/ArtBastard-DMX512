import React from 'react'
import { useRouter } from '../context/RouterContext'
import MainPage from './MainPage'
import ControlSetupPage from './ControlSetupPage'
import FixturePage from './FixturePage'
import SceneLibraryPage from './SceneLibraryPage'
import AudioAnalysisPage from './AudioAnalysisPage'
import RemoteControlPage from './RemoteControlPage'
import SettingsPage from './SettingsPage'

const PageRouter: React.FC = () => {
  const { currentView } = useRouter()

  const renderCurrentPage = () => {
    switch (currentView) {
      case 'main':
        return <MainPage />
      case 'midiOsc':
        return <ControlSetupPage />
      case 'fixture':
        return <FixturePage />
      case 'scenes':
        return <SceneLibraryPage />
      case 'audio':
        return <AudioAnalysisPage />
      case 'touchosc':
        return <RemoteControlPage />
      case 'misc':
        return <SettingsPage />
      default:
        return <MainPage />
    }
  }

  return <>{renderCurrentPage()}</>
}

export default PageRouter
