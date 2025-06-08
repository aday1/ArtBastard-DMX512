import React from 'react'
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
import styles from './Layout.module.scss'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, darkMode, toggleDarkMode } = useTheme()

  return (
    <RouterProvider>
      <div className={`${styles.layout} ${styles[theme]} ${darkMode ? styles.dark : styles.light}`} 
           style={{ fontFeatureSettings: "'liga' 1, 'calt' 1, 'tnum' 1, 'case' 1" }}>
        
        {/* Global UI Effects */}
        <Sparkles />
        <BpmIndicator />
        <SignalFlashIndicator position="bottom-left" />
        
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
        
        <StatusBar />
      </div>
    </RouterProvider>
  )
}