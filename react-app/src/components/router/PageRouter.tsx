import React from 'react'
import { useRouter } from '../../context/RouterContext'
import MainPage from '../../pages/MainPage'
import ControlSetupPage from '../../pages/ControlSetupPage'
import FixturePage from '../../pages/FixturePage'
import ActsScenesPage from '../../pages/ActsScenesPage'
import SettingsPage from '../../pages/SettingsPage'
import DmxChannelControlPage from '../pages/DmxChannelControlPage'
import DebugPage from '../../pages/DebugPage'
import ExperimentalPage from '../../pages/ExperimentalPage'
import ExternalConsolePage from '../../pages/ExternalConsolePage'

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
      case 'scenesActs':
        return <ActsScenesPage />
      case 'misc':
        return <SettingsPage />
      case 'dmxControl':
        return <DmxChannelControlPage />
      case 'debug':
        return <DebugPage />
      case 'experimental':
        return <ExperimentalPage />
      default:
        return <DmxChannelControlPage />
    }
  }

  return <>{renderCurrentPage()}</>
}

export default PageRouter
