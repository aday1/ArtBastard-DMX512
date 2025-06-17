import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { RouterProvider } from '../../context/RouterContext'
import { StatusBar } from './StatusBar'
import { Navbar } from './Navbar'
import { ToastContainer } from './ToastContainer'
import { NetworkStatus } from './NetworkStatus'
import FancyQuotes from './FancyQuotes'
import { DebugMenu } from '../debug/DebugMenu'
import { Sparkles } from './Sparkles'
import BpmIndicator from '../audio/BpmIndicator'
import SignalFlashIndicator from '../midi/SignalFlashIndicator'
import PageRouter from '../router/PageRouter'
import TransportControls from '../panels/TransportControls'
import { useStore } from '../../store'
import styles from './Layout.module.scss'

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, darkMode, toggleDarkMode } = useTheme()
  const { 
    recordingActive, 
    automationPlayback,
    startRecording, 
    stopRecording, 
    startAutomationPlayback, 
    stopAutomationPlayback 
  } = useStore()
  
  const [transportVisible, setTransportVisible] = useState(true)
  const [transportDocked, setTransportDocked] = useState(true)
  const handlePlay = () => {
    if (automationPlayback.active) {
      stopAutomationPlayback()
    } else {
      startAutomationPlayback()
    }
    console.log('Transport: Play/Stop Automation')
  }

  const handlePause = () => {
    if (automationPlayback.active) {
      stopAutomationPlayback()
    }
    console.log('Transport: Pause Automation')
  }

  const handleStop = () => {
    stopAutomationPlayback()
    console.log('Transport: Stop Automation')
  }

  const handleRecord = () => {
    if (recordingActive) {
      stopRecording()
    } else {
      startRecording()
    }
    console.log('Transport: Record', !recordingActive)
  }

  return (
    <RouterProvider>
      <div className={`${styles.layout} ${styles[theme]} ${darkMode ? styles.dark : styles.light}`} 
           style={{ fontFeatureSettings: "'liga' 1, 'calt' 1, 'tnum' 1, 'case' 1" }}>
          {/* Global UI Effects */}
        <Sparkles />
        <BpmIndicator />
        {/* <SignalFlashIndicator position="bottom-left" /> */}
        
        <Navbar />
        <ToastContainer /> 
        
        <div className={styles.contentWrapper}>
          <div className={styles.mainContent}>
            <h1 className={styles.title}>
              ArtBastard DMX512FTW: 
              {theme === 'artsnob' && <span>The Luminary Palette</span>}
              {theme === 'standard' && <span>DMX Controller</span>}
              {theme === 'minimal' && <span>DMX</span>}
            </h1>
            
            {theme === 'artsnob' && (
              <FancyQuotes intervalSeconds={30} animate={true} />
            )}
            
            <main className={styles.contentArea}>
              <PageRouter />
            </main>
            
            <DebugMenu position="top-right" />
          </div>
        </div>
        
        <StatusBar />        {/* Transport Controls for TouchBad Panel functionality */}
        <TransportControls
          isVisible={transportVisible}
          isDocked={transportDocked}
          onToggleVisibility={() => setTransportVisible(!transportVisible)}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onRecord={handleRecord}
          isPlaying={automationPlayback.active}
          isPaused={false}
          isRecording={recordingActive}
        />
      </div>
    </RouterProvider>
  )
}