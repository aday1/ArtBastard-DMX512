import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
// import { NetworkStatus } from './NetworkStatus' // Removed as unused
// import { DmxChannelStats } from '../dmx/DmxChannelStats' // Removed as unused
import styles from './Navbar.module.scss'
import { Sparkles } from './Sparkles'
import { Menu, X } from 'lucide-react'; // Moved lucide-react import to top

type ViewType = 'main' | 'midiOsc' | 'fixture' | 'scenes' | 'oscDebug' | 'audio' | 'touchosc' | 'misc'

const navItems: Array<{
  id: ViewType
  icon: string
  title: {
    artsnob: string
    standard: string
    minimal: string
  }
}> = [
  {
    id: 'main',
    icon: 'fa-lightbulb',
    title: {
      artsnob: 'Luminous Canvas',
      standard: 'Main Control',
      minimal: 'Main'
    }
  },
  {
    id: 'midiOsc',
    icon: 'fa-sliders-h',
    title: {
      artsnob: 'MIDI/OSC Atelier',
      standard: 'MIDI/OSC Setup',
      minimal: 'I/O'
    }
  },
  {
    id: 'fixture',
    icon: 'fa-object-group',
    title: {
      artsnob: 'Fixture Composition',
      standard: 'Fixture Setup',
      minimal: 'Fix'
    }
  },  {
    id: 'scenes',
    icon: 'fa-theater-masks',
    title: {
      artsnob: 'Scene Gallery',
      standard: 'Scenes',
      minimal: 'Scn'
    }
  },  {
    id: 'oscDebug',
    icon: 'fa-bug',
    title: {
      artsnob: 'OSC Debugging',
      standard: 'OSC Debug',
      minimal: 'OSC'
    }
  },
  {
    id: 'audio',
    icon: 'fa-music',
    title: {
      artsnob: 'Audio Spectrum',
      standard: 'Audio FFT',
      minimal: 'FFT'
    }
  },
  {
    id: 'touchosc',
    icon: 'fa-mobile-alt',
    title: {
      artsnob: 'TouchOSC Designer',
      standard: 'TouchOSC',
      minimal: 'OSC'
    }
  },
  {
    id: 'misc',
    icon: 'fa-cog',
    title: {
      artsnob: 'Avant-Garde Settings',
      standard: 'Settings',
      minimal: 'Cfg'
    }
  }
]

export const Navbar: React.FC = () => {
  const { theme } = useTheme()
  const [activeView, setActiveView] = useState<ViewType>('main')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
    window.dispatchEvent(new CustomEvent('changeView', {
      detail: { view }
    }))
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

// The duplicated Navbar export and the misplaced import below are removed by this change.
// The first Navbar definition (which was incomplete and above this section) is the one that remains.
}