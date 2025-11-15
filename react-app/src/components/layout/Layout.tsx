import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { RouterProvider } from '../../context/RouterContext'
import { StatusBar } from './StatusBar'
import { Navbar } from './Navbar'
import { PinnedChannels } from './PinnedChannels'
import { ToastContainer } from './ToastContainer'
import { NetworkStatus } from './NetworkStatus'
import FancyQuotes from './FancyQuotes'
import { Sparkles } from './Sparkles'
import BpmIndicator from '../audio/BpmIndicator'
import SignalFlashIndicator from '../midi/SignalFlashIndicator'
import PageRouter from '../router/PageRouter'
import { useStore } from '../../store'
import { ResetButton } from './ResetButton'
import { ThemeToggleButton } from './ThemeToggleButton'
import { GlobalMonitors } from '../monitors/GlobalMonitors'
import styles from './Layout.module.scss'
import { LucideIcon } from '../ui/LucideIcon'

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, darkMode, toggleDarkMode, setTheme } = useTheme()
  const { 
    // Remove automation-related imports since we're removing transport controls
  } = useStore()
  
  
  
  return (
    <RouterProvider>
      <div className={`${styles.layout} ${styles[theme]} ${darkMode ? styles.dark : styles.light}`} 
           style={{ fontFeatureSettings: "'liga' 1, 'calt' 1, 'tnum' 1, 'case' 1" }}>
          {/* Global UI Effects */}
        <Sparkles />
        {/* <BpmIndicator /> */}
        {/* <SignalFlashIndicator position="bottom-left" /> */}
        
        <PinnedChannels />
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
            
            <div className={styles.bottomControls}>
              <ResetButton showLabels={true} />
              
              {/* Theme Controls */}
              <div className={styles.themeControls}>
                {/* Language Switcher */}
                <button
                  onClick={() => {
                    // Toggle between ArtSnob and Standard only
                    setTheme(theme === 'artsnob' ? 'standard' : 'artsnob');
                  }}
                  className={`${styles.themeButton} ${styles[theme]}`}
                  title={`Current: ${theme === 'artsnob' ? 'ArtSnob (French pretentious)' : 'Standard (Normal)'} - Click to switch language`}
                >
                  <LucideIcon name={theme === 'artsnob' ? 'Languages' : 'Globe'} />
                  <span>{theme === 'artsnob' ? 'ArtSnob' : 'Standard'}</span>
                </button>
                
                {/* Dark/Light Mode Toggle */}
                <ThemeToggleButton showLabels={true} />
              </div>
            </div>
            
          </div>
        </div>
        
        <StatusBar />
        
        {/* Global floating monitors - available on all pages */}
        <GlobalMonitors />
      </div>
    </RouterProvider>
  )
}