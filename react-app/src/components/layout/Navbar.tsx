import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useStore } from '../../store'
import { NetworkStatus } from './NetworkStatus'
import { DmxChannelStats } from '../dmx/DmxChannelStats'
import styles from './Navbar.module.scss'
import { Sparkles } from './Sparkles'
import { LucideIcon } from '../ui/LucideIcon'
import * as Icons from 'lucide-react'

type ViewType = 'main' | 'midiOsc' | 'fixture' | 'scenes' | 'audio' | 'touchosc' | 'misc'

// Updated navigation items with Lucide icon names
const navItems: Array<{
  id: ViewType
  icon: string // Lucide icon name
  title: {
    artsnob: string
    standard: string
    minimal: string
  }
}> = [
  {
    id: 'main',
    icon: 'Layout',
    title: {
      artsnob: 'Main Interface',
      standard: 'Dashboard',
      minimal: 'Main'
    }
  },
  {
    id: 'midiOsc',
    icon: 'Sliders',
    title: {
      artsnob: 'Control Setup',
      standard: 'MIDI & OSC',
      minimal: 'I/O'
    }
  },
  {
    id: 'fixture',
    icon: 'LampDesk',
    title: {
      artsnob: 'Fixtures',
      standard: 'Fixtures',
      minimal: 'Fix'
    }
  },
  {
    id: 'scenes',
    icon: 'Store',
    title: {
      artsnob: 'Scene Library',
      standard: 'Scenes',
      minimal: 'Scn'
    }
  },
  {
    id: 'audio',
    icon: 'WaveformCircle',
    title: {
      artsnob: 'Audio Analysis',
      standard: 'Audio',
      minimal: 'FFT'
    }
  },
  {
    id: 'touchosc',
    icon: 'Smartphone',
    title: {
      artsnob: 'Remote Control',
      standard: 'TouchOSC',
      minimal: 'OSC'
    }
  },
  {
    id: 'misc',
    icon: 'Settings',
    title: {
      artsnob: 'Configuration',
      standard: 'Settings',
      minimal: 'Cfg'
    }
  }
]

export const Navbar: React.FC = () => {
  const { theme } = useTheme()
  const [activeView, setActiveView] = useState<ViewType>('main')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navVisibility = useStore((state) => state.navVisibility)

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
    window.dispatchEvent(new CustomEvent('changeView', { detail: { view } }))
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('navbar-is-collapsed')
    } else {
      document.body.classList.remove('navbar-is-collapsed')
    }
    // Cleanup function to remove the class if the component unmounts
    return () => {
      document.body.classList.remove('navbar-is-collapsed')
    }
  }, [isCollapsed])

  if (!navVisibility) { // Assuming navVisibility from store can hide the whole navbar
    return null
  }

  return (
    <div className={`${styles.navbarContainer} ${isCollapsed ? styles.navBarCollapsedState : ''}`}>
      <button
        onClick={toggleCollapse}
        className={styles.collapseToggle}
        title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
      >
        <LucideIcon name={isCollapsed ? 'PanelRightOpen' : 'PanelLeftClose'} />
      </button>

      {/* Sparkles component can be placed here if it needs to be part of the main navbar scrollable content */}
      {/* <Sparkles /> */}

      <div className={`${styles.navContent} ${isCollapsed ? styles.navContentCollapsed : ''}`}>
        <div className={styles.navButtons}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`${styles.navButton} ${activeView === item.id ? styles.active : ''}`}
              title={item.title[theme as keyof typeof item.title]}
            >
              <LucideIcon name={item.icon as keyof typeof Icons} />
              <span>{item.title[theme as keyof typeof item.title]}</span>
            </button>
          ))}
        </div>
        {/* NetworkStatus might be better outside navButtons if it has a different layout or needs to be sticky at the bottom */}
        <div className={styles.networkStatusContainer}> {/* Added a wrapper for potential specific styling */}
          <NetworkStatus compact={isCollapsed} /> {/* Corrected: compact when navbar is collapsed */}
        </div>
      </div>
       {/* If Sparkles is meant to be fixed at the bottom or outside scroll, place it here, relative to navbarContainer */}
       <Sparkles />
    </div>
  )
}