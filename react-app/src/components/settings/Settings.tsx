import React, { useState, useEffect } from 'react'
import { useStore, Fixture, MasterSlider } from '../../store' 
import useStoreUtils from '../../store/storeUtils'
import { useTheme } from '../../context/ThemeContext'
import { useSocket } from '../../context/SocketContext'
// import { Socket } from 'socket.io-client' 
import { MidiLearnButton } from '../midi/MidiLearnButton'
import styles from './Settings.module.scss'
import { exportToToscFile, ExportOptions as TouchOscExportOptionsUtil } from '../../utils/touchoscExporter'; 

const EXAMPLE_SLIDER_MIDI_CHANNEL_INDEX = 999

interface TouchOscExportOptionsUI {
  resolution: 'phone_portrait' | 'tablet_portrait';
  includeFixtureControls: boolean;
  includeMasterSliders: boolean;
  includeAllDmxChannels: boolean;
}

export const Settings: React.FC = () => {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme()
  const { socket, connected } = useSocket()
  
  const { 
    artNetConfig, 
    exampleSliderValue, 
    setExampleSliderValue, 
    midiMappings,
    fixtures, 
    masterSliders, 
    transitionDuration, // Fetch current duration
    setTransitionDuration, // Fetch action
  } = useStore(state => ({
    artNetConfig: state.artNetConfig,
    exampleSliderValue: state.exampleSliderValue,
    setExampleSliderValue: state.setExampleSliderValue,
    midiMappings: state.midiMappings,
    fixtures: state.fixtures,
    masterSliders: state.masterSliders,
    transitionDuration: state.transitionDuration,
    setTransitionDuration: state.setTransitionDuration,
    availableMidiClockHosts: state.availableMidiClockHosts,
    selectedMidiClockHostId: state.selectedMidiClockHostId,
    setSelectedMidiClockHostId: state.setSelectedMidiClockHostId,
    setAvailableMidiClockHosts: state.setAvailableMidiClockHosts,
  }))
  
  const [artNetSettings, setArtNetSettings] = useState({ ...artNetConfig })
  const [exportInProgress, setExportInProgress] = useState(false) 
  const [importInProgress, setImportInProgress] = useState(false) 
  const [touchOscExportInProgress, setTouchOscExportInProgress] = useState(false);

  const [currentTransitionDurationMs, setCurrentTransitionDurationMs] = useState(transitionDuration);

  useEffect(() => {
    setCurrentTransitionDurationMs(transitionDuration); // Sync local state if store changes
  }, [transitionDuration]);

  const handleTransitionDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value, 10);
    if (!isNaN(newDuration) && newDuration >= 0) {
      setCurrentTransitionDurationMs(newDuration);
    }
  };

  const submitTransitionDuration = () => {
    setTransitionDuration(currentTransitionDurationMs);
    useStoreUtils.getState().addNotification({
      message: `Scene transition duration set to ${currentTransitionDurationMs}ms`,
      type: 'success',
      priority: 'normal'
    });
  };


  const [touchOscExportOptions, setTouchOscExportOptions] = useState<TouchOscExportOptionsUI>({
    resolution: 'phone_portrait',
    includeFixtureControls: true,
    includeMasterSliders: true,
    includeAllDmxChannels: false,
  });

  const handleTouchOscOptionChange = (option: keyof TouchOscExportOptionsUI, value: any) => { /* ... */ };
  const handleExportTouchOsc = async () => { /* ... */ };
  const updateArtNetConfig = () => { /* ... */ }
  const handleArtNetChange = (key: keyof typeof artNetSettings, value: any) => { /* ... */ }
  const exportSettings = () => { /* ... */ }
  const importSettings = () => { /* ... */ }
  const testArtNetConnection = () => { /* ... */ }
  useEffect(() => { /* ... ArtNet status handling ... */ }, [socket])
  useEffect(() => { /* ... example slider MIDI handling ... */ }, [midiMappings, exampleSliderValue])
  const handleExampleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ }
  
  // Simulate fetching/setting available MIDI hosts
  useEffect(() => {
    // In a real app, this might involve navigator.requestMIDIAccess()
    // For now, using a placeholder list and ensuring 'Ableton Sync Link' is present.
    const hosts = [
      { id: 'none', name: 'None (Internal Clock)' },
      { id: 'ableton-link', name: 'Ableton Sync Link' },
      // Example of a dynamically found MIDI output:
      // { id: 'midi-output-123', name: 'My External Synth' }
    ];
    // This action is now in the store, but if we were to dynamically populate, we'd call it here.
    // setAvailableMidiClockHosts(hosts); // Example: if fetching dynamically
  }, []); // Removed setAvailableMidiClockHosts from deps

  return (
    <div className={styles.settings}>
      <h2 className={styles.sectionTitle}>
        {/* ... title ... */}
      </h2>
      
      <div className={styles.settingsGrid}>
        {/* ArtNet Configuration Card */}
        {/* ... */}
        
        {/* MIDI Learn Test Section Card */}
        {/* ... */}

        {/* MIDI Clock Settings Card - NEW */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>
              {theme === 'artsnob' && 'Temporal Synchronization Nexus'}
              {theme === 'standard' && 'MIDI Clock Settings'}
              {theme === 'minimal' && 'Clock Sync'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGroup}>
              <label htmlFor="midiClockHostSelect">MIDI Clock Sync Source:</label>
              <select
                id="midiClockHostSelect"
                value={selectedMidiClockHostId || 'none'}
                onChange={(e) => setSelectedMidiClockHostId(e.target.value)}
                className={styles.selectInput}
              >
                {availableMidiClockHosts.map(host => (
                  <option key={host.id} value={host.id}>
                    {host.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.configNote}>
              <i className="fas fa-info-circle"></i>
              <p>Select the source for MIDI clock synchronization. 'Ableton Sync Link' requires compatible Link-enabled software on the network.</p>
            </div>
          </div>
        </div>
        
        {/* UI Theme Settings Card */}
        {/* ... */}

        {/* Configuration Management Card (Import/Export App Settings) */}
        {/* ... */}

        {/* TouchOSC Export Card */}
        {/* ... */}
        
        {/* Performance Settings Card - Add Scene Transition Duration here or in a new card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>
              {theme === 'artsnob' && 'Temporal Dynamics & Performance Calibration'}
              {theme === 'standard' && 'Performance & Transitions'}
              {theme === 'minimal' && 'Perf & FX'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            {/* Existing Performance Settings ... */}
            <div className={styles.formGroup}>
              <label>Graphics Quality:</label> {/* ... */}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="enableWebGL">WebGL Visualizations:</label> {/* ... */}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="enable3D">3D Fixture Visualization:</label> {/* ... */}
            </div>
            <div className={styles.performanceNote}> {/* ... */} </div>

            {/* New Scene Transition Duration Setting */}
            <div className={styles.formGroup} style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color-soft)'}}>
              <label htmlFor="sceneTransitionDuration">Scene Transition Duration (ms):</label>
              <input
                type="number"
                id="sceneTransitionDuration"
                value={currentTransitionDurationMs}
                onChange={handleTransitionDurationChange}
                onBlur={submitTransitionDuration} // Save when focus is lost
                onKeyPress={(e) => e.key === 'Enter' && submitTransitionDuration()}
                min="0"
                step="100"
                className={styles.numberInput} // Add specific class if needed
              />
            </div>
            <div className={styles.configNote}>
                <i className="fas fa-info-circle"></i>
                <p>Set the default duration for smooth transitions between scenes (e.g., 0 for instant, 1000 for 1 second).</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.aboutSection}>
        {/* ... existing content ... */}
      </div>
    </div>
  )
}