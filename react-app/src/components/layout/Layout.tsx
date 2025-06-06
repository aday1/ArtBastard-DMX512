import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { StatusBar } from './StatusBar'
import { Navbar } from './Navbar'
import { ToastContainer } from './ToastContainer'
import { NetworkStatus } from './NetworkStatus'
import FancyQuotes from './FancyQuotes'
import DebugMenu from '../debug/DebugMenu'
import styles from './Layout.module.scss'
import { Sparkles } from './Sparkles'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, darkMode, toggleDarkMode } = useTheme()

  return (    <div className={`${styles.layout} ${styles[theme]} ${darkMode ? styles.dark : styles.light}`} 
         style={{ fontFeatureSettings: "'liga' 1, 'calt' 1, 'tnum' 1, 'case' 1" }}>
      <Sparkles />
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
            {children}
          </main>
          <DebugMenu position="top-right" />
        </div>
      </div>
      <StatusBar />
    </div>
  )
}