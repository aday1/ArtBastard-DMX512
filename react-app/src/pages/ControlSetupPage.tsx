import React from 'react'
import { MidiOscSetup } from '../components/midi/MidiOscSetup'
import { PageHeader } from '../components/ui/PageHeader'
import styles from './Pages.module.scss'

const ControlSetupPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title={{
          artsnob: 'Le Contrôle MIDI & OSC Pour L\'Élite Éclairée',
          standard: 'MIDI & OSC Control Setup',
          minimal: 'MIDI & OSC'
        }}
        description={{
          artsnob: 'Configure MIDI and OSC inputs/outputs for external control. Simply input/output controls. But you wouldn\'t understand, mon ami.',
          standard: 'Configure MIDI and OSC inputs/outputs for external control',
          minimal: 'Configure MIDI and OSC controls'
        }}
      />
      
      <div className={styles.pageContent}>
        <div className={styles.setupSection}>
          <MidiOscSetup />
        </div>
      </div>
    </div>
  )
}

export default ControlSetupPage
