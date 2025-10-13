import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { useBrowserMidi } from '../../hooks/useBrowserMidi'
import { DmxChannelStats } from '../dmx/DmxChannelStats'
import styles from './Navbar.module.scss'
import { Sparkles } from './Sparkles'
import { LucideIcon } from '../ui/LucideIcon'
import { ThemeToggleButton } from './ThemeToggleButton'
import * as Icons from 'lucide-react'
import { ViewType } from '../router/PageRouter'
import { useRouter } from '../../context/RouterContext'

// Updated navigation items with Lucide icon names
const navItems: Array<{
  id: ViewType
  icon: string // Lucide icon name
  title: {
    artsnob: string
    standard: string
    minimal: string
    tooltip?: string // Explanation for the uninitiated
  }
}> = [
  {
    id: 'main',
    icon: 'Layout',
    title: {
    artsnob: "🎭 Dashboard Magnifique™",
      standard: 'Dashboard',
      minimal: 'Main',
      tooltip: "For the uninitiated: It's just a dashboard, darling."
    }
  },
  {
    id: 'midiOsc',
    icon: 'Sliders',
    title: {
    artsnob: "🎵 MIDI & OSC Éclairée",
      standard: 'MIDI & OSC',
      minimal: 'I/O',
      tooltip: "Simply input/output controls. But you wouldn't understand, mon ami."
    }
  },
  {
    id: 'dmxControl',
    icon: 'Zap',
    title: {
    artsnob: "⚡ Contrôle DMX Ultime",
      standard: 'DMX Control',
      minimal: 'DMX',
      tooltip: "Direct DMX channel control with MIDI Learn/Forget functionality."
    }
  },
  {
    id: 'fixture',
    icon: 'LampDesk',
    title: {
    artsnob: "💡 Fixture Extraordinaire",
      standard: 'Fixtures',
      minimal: 'Fix',
      tooltip: "Mere light fixtures. *sigh* How pedestrian of you to ask."
    }
  },
  {
    id: 'scenesActs',
    icon: 'Theater',
    title: {
    artsnob: "🎬 Scènes Dramatiques",
      standard: 'Scenes',
      minimal: 'Scenes',
      tooltip: "Create, manage, and orchestrate lighting scenes and automated sequences. The heart of your lighting control."
    }
  },
  {
    id: 'misc',
    icon: 'Settings',
    title: {
    artsnob: "⚙️ Paramètres Cognoscenti",
      standard: 'Settings',
      minimal: 'Cfg',
      tooltip: "Configuration settings. Do try not to strain yourself understanding that, darling."
    }
  },
  {
    id: 'debug',
    icon: 'Bug',
    title: {
    artsnob: "🐛 Debug & Aide Supérieure",
      standard: 'Debug & Help',
      minimal: 'Debug',
      tooltip: "Debug tools and help for the truly enlightened. *adjusts monocle*"
    }
  },
]

export const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const { currentView, setCurrentView } = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navVisibility = useStore((state) => state.navVisibility)
  const { connected } = useSocket()
  const { activeBrowserInputs } = useBrowserMidi()
  const midiMessages = useStore(state => state.midiMessages)
  const dmxChannels = useStore(state => state.dmxChannels)
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
    if (dmxChannels && dmxChannels.some(value => value > 0)) {
      setDmxActivity(true);
      const timer = setTimeout(() => setDmxActivity(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [dmxChannels]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
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
        <LucideIcon name={isCollapsed ? 'ChevronLeft' : 'ChevronRight'} />
      </button>

      {/* Sparkles component can be placed here if it needs to be part of the main navbar scrollable content */}
      {/* <Sparkles /> */}

      <div className={`${styles.navContent} ${isCollapsed ? styles.navContentCollapsed : ''}`}>
        <div className={styles.navButtons}>
          {navItems.map((item) => (
            <div key={item.id} className={styles.navItemContainer}>
              <button
                onClick={() => handleViewChange(item.id)}
                className={`${styles.navButton} ${currentView === item.id ? styles.active : ''}`}
                title={item.title.tooltip || item.title[theme as keyof typeof item.title]}
                data-tooltip={item.title.tooltip}
              >
                <LucideIcon name={item.icon as keyof typeof Icons} />
                <span>{item.title[theme as keyof typeof item.title]}</span>
              </button>
              
              {/* Status indicators under each menu item */}
              {!isCollapsed && (
                <div className={styles.itemStatusIndicators}>
                  {/* Connection Status for main item */}
                  {item.id === 'main' && (
                    <div 
                      className={`${styles.itemStatusIcon} ${connected ? styles.statusOk : styles.statusError}`}
                      title={connected ? 'Connected to server' : 'Disconnected from server'}
                    >
                      <LucideIcon name={connected ? 'Wifi' : 'WifiOff'} />
                      <span className={styles.itemStatusLabel}>
                        {connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  )}
                  
                  {/* MIDI Activity for midiOsc item */}
                  {item.id === 'midiOsc' && (
                    <div 
                      className={`${styles.itemStatusIcon} ${midiActivity ? styles.statusActive : (activeBrowserInputs?.size > 0 ? styles.statusOk : styles.statusInactive)}`}
                      title={`MIDI: ${activeBrowserInputs?.size || 0} active devices${midiActivity ? ' (activity)' : ''}`}
                    >
                      <LucideIcon name="Music" />
                      <span className={styles.itemStatusLabel}>
                        MIDI ({activeBrowserInputs?.size || 0})
                      </span>
                    </div>
                  )}
                  
                  {/* DMX Activity for dmxControl item */}
                  {item.id === 'dmxControl' && (
                    <div 
                      className={`${styles.itemStatusIcon} ${dmxActivity ? styles.statusActive : styles.statusNeutral}`}
                      title={`DMX Output ${dmxActivity ? '(active)' : '(idle)'}`}
                    >
                      <LucideIcon name="Lightbulb" />
                      <span className={styles.itemStatusLabel}>
                        DMX {dmxActivity ? '(Active)' : '(Idle)'}
                      </span>
                    </div>
                  )}
                  
                  {/* Current View Indicator */}
                  {item.id === currentView && (
                    <div 
                      className={`${styles.itemStatusIcon} ${styles.statusHighlight}`}
                      title={`Current View: ${item.title[theme as keyof typeof item.title]}`}
                    >
                      <LucideIcon name="CheckCircle" />
                      <span className={styles.itemStatusLabel}>
                        Active
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
       {/* If Sparkles is meant to be fixed at the bottom or outside scroll, place it here, relative to navbarContainer */}
       <Sparkles />
    </div>
  )
}