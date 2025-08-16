import React from 'react'
import { useRouter } from '../../context/RouterContext'
import MainPage from '../../pages/MainPage'
import ControlSetupPage from '../../pages/ControlSetupPage'
import FixturePage from '../../pages/FixturePage'
import PlannerPage from '../../pages/PlannerPage'
import CanvasPage from '../../pages/CanvasPage'
import SceneLibraryPage from '../../pages/SceneLibraryPage'
import AudioAnalysisPage from '../../pages/AudioAnalysisPage'
import RemoteControlPage from '../../pages/RemoteControlPage'
import SettingsPage from '../../pages/SettingsPage'

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
      case 'planner':
        return <PlannerPage />
      case 'canvas':
        return <CanvasPage />
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
