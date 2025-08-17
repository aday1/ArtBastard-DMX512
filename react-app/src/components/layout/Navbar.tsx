import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { useBrowserMidi } from '../../hooks/useBrowserMidi'
import { DmxChannelStats } from '../dmx/DmxChannelStats'
import styles from './Navbar.module.scss'
import { Sparkles } from './Sparkles'
import { LucideIcon } from '../ui/LucideIcon'
import * as Icons from 'lucide-react'
import { ViewType } from '../router/PageRouter'

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
    artsnob: "The Most Prestigious Dashboard",
      standard: 'Dashboard',
      minimal: 'Main'
    }
  },
  {
    id: 'midiOsc',
    icon: 'Sliders',
    title: {
    artsnob: "MIDI & OSC for the Enlightened",
      standard: 'MIDI & OSC',
      minimal: 'I/O'
    }
  },  {
    id: 'fixture',
    icon: 'LampDesk',
    title: {
    artsnob: "Fixtures for the Discerning",
      standard: 'Fixtures',
      minimal: 'Fix'
    }
  },
  {
    id: 'planner',
    icon: 'MapPin',
    title: {
    artsnob: "The Distinguished DMX Planner",
      standard: 'DMX Planner',
      minimal: 'Plan'
    }
  },
  {
    id: 'canvas',
    icon: 'PaintBucket',
    title: {
    artsnob: "The Canvas of Higher Art",
      standard: '2D Canvas',
      minimal: '2D'
    }
  },
  {
    id: 'scenes',
    icon: 'Store',
    title: {
    artsnob: "Les Scènes (Pas Pour Les Amateurs)",
      standard: 'Scenes',
      minimal: 'Scn'
    }
  },
  {
    id: 'audio',
    icon: 'WaveformCircle',
    title: {
    artsnob: "L'Audio Pour Les Oreilles Fines",
      standard: 'Audio',
      minimal: 'FFT'
    }
  },
  {
    id: 'touchosc',
    icon: 'Smartphone',
    title: {
    artsnob: "TouchOSC (Parce Que Pourquoi Pas)",
      standard: 'TouchOSC',
      minimal: 'OSC'
    }
  },
  {
    id: 'misc',
    icon: 'Settings',
    title: {
    artsnob: "Les Settings Pour Les Esthètes",
      standard: 'Settings',
      minimal: 'Cfg'
    }
  },
  {
    id: 'state',
    icon: 'Database',
    title: {
    artsnob: "Le State Management du Patron",
      standard: 'State Management',
      minimal: 'State'
    }
  }
]

export const Navbar: React.FC = () => {
  const { theme } = useTheme()
  const [activeView, setActiveView] = useState<ViewType>('main')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navVisibility = useStore((state) => state.navVisibility)
  const { connected } = useSocket()
  const { activeBrowserInputs } = useBrowserMidi()
  const midiMessages = useStore(state => state.midiMessages)
  const toDmxValues = useStore(state => state.toDmxValues)
  const [midiActivity, setMidiActivity] = useState(false)
  const [dmxActivity, setDmxActivity] = useState(false)

  // Flash MIDI indicator on new messages
  useEffect(() => {
    if (midiMessages && midiMessages.length > 0) {
      setMidiActivity(true);
      const timer = setTimeout(() => setMidiActivity(false), 300);
      return () => clearTimeout(timer);
    }
  }, [midiMessages]);

  // Monitor DMX activity
  useEffect(() => {
    if (toDmxValues && Object.values(toDmxValues).some(value => value > 0)) {
      setDmxActivity(true);
      const timer = setTimeout(() => setDmxActivity(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [toDmxValues]);

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
            </button>          ))}        </div>
          {/* Status icons container - visible in both expanded and collapsed states */}
        <div className={`${styles.statusIcons} ${isCollapsed ? styles.statusIconsCollapsed : styles.statusIconsExpanded}`}>
          {/* Connection Status */}
          <div 
            className={`${styles.statusIcon} ${connected ? styles.statusOk : styles.statusError}`}
            title={connected ? 'Connected to server' : 'Disconnected from server'}
          >
            <LucideIcon name={connected ? 'Wifi' : 'WifiOff'} />
            {!isCollapsed && <span className={styles.statusLabel}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>}
          </div>
          
          {/* MIDI Activity */}
          <div 
            className={`${styles.statusIcon} ${midiActivity ? styles.statusActive : (activeBrowserInputs?.size > 0 ? styles.statusOk : styles.statusInactive)}`}
            title={`MIDI: ${activeBrowserInputs?.size || 0} active devices${midiActivity ? ' (activity)' : ''}`}
          >
            <LucideIcon name="Music" />
            {!isCollapsed && <span className={styles.statusLabel}>
              MIDI ({activeBrowserInputs?.size || 0})
            </span>}
          </div>
          
          {/* DMX Activity */}
          <div 
            className={`${styles.statusIcon} ${dmxActivity ? styles.statusActive : styles.statusNeutral}`}
            title={`DMX Output ${dmxActivity ? '(active)' : '(idle)'}`}
          >
            <LucideIcon name="Lightbulb" />
            {!isCollapsed && <span className={styles.statusLabel}>
              DMX {dmxActivity ? '(Active)' : '(Idle)'}
            </span>}
          </div>
          
          {/* Current View Indicator */}
          <div 
            className={`${styles.statusIcon} ${styles.statusHighlight}`}
            title={`Current View: ${navItems.find(item => item.id === activeView)?.title[theme as keyof typeof navItems[0]['title']] || activeView}`}
          >
            <LucideIcon name={navItems.find(item => item.id === activeView)?.icon as keyof typeof Icons || 'Layout'} />
            {!isCollapsed && <span className={styles.statusLabel}>
              {navItems.find(item => item.id === activeView)?.title[theme as keyof typeof navItems[0]['title']] || activeView}
            </span>}
          </div>
        </div>
      </div>
       {/* If Sparkles is meant to be fixed at the bottom or outside scroll, place it here, relative to navbarContainer */}
       <Sparkles />
    </div>
  )
}