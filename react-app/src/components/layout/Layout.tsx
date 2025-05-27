import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { StatusBar } from './StatusBar'
import { Navbar } from './Navbar'
import { ToastContainer } from './ToastContainer' // Import ToastContainer
import { NetworkStatus } from './NetworkStatus'
import FancyQuotes from './FancyQuotes'
import MidiDebugger from '../midi/MidiDebugger'
import MidiMonitor from '../midi/MidiMonitor' 
import styles from './Layout.module.scss'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, darkMode, toggleDarkMode } = useTheme()

  return (
    <div className={`${styles.layout} ${styles[theme]} ${darkMode ? styles.dark : styles.light}`}>
      <Navbar />
      {/* Render ToastContainer without props as it fetches its own state */}
      <ToastContainer /> 
      <div className={styles.contentWrapper}>
        {/* Network status is now in navbar, so this panel is removed */}
        
        <div className={styles.themeToggle} onClick={toggleDarkMode} title="Toggle Light/Dark Mode">
          <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
        </div>
        
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

          {/* Add MIDI Debugger for troubleshooting */}
          <MidiDebugger />
          
          {/* Add the new MIDI Monitor for visibility */}
          <MidiMonitor />
        </div>
      </div>
      
      <StatusBar />
    </div>
  )
}