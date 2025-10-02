import React from 'react'
import { useRouter } from '../../context/RouterContext'
import MainPage from '../../pages/MainPage'
import ControlSetupPage from '../../pages/ControlSetupPage'
import FixturePage from '../../pages/FixturePage'
import PlannerPage from '../../pages/PlannerPage'
import CanvasPage from '../../pages/CanvasPage'
import SceneLibraryPage from '../../pages/SceneLibraryPage'
import ActsPage from '../../pages/ActsPage'
import AudioAnalysisPage from '../../pages/AudioAnalysisPage'
import RemoteControlPage from '../../pages/RemoteControlPage'
import SettingsPage from '../../pages/SettingsPage'
import StateManagementPage from '../../pages/StateManagementPage'

export type ViewType = 'main' | 'midiOsc' | 'fixture' | 'planner' | 'canvas' | 'scenes' | 'acts' | 'audio' | 'touchosc' | 'misc' | 'state'

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
      case 'acts':
        return <ActsPage />
      case 'audio':
        return <AudioAnalysisPage />
      case 'touchosc':
        return <RemoteControlPage />
      case 'misc':
        return <SettingsPage />
      case 'state':
        return <StateManagementPage />
      default:
        return <MainPage />
    }
  }

  return <>{renderCurrentPage()}</>
}

export default PageRouter
