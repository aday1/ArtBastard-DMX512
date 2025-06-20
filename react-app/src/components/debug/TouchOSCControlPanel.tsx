import React, { useState } from 'react';
import { useStore } from '../../store';
import TouchOSCNetworkPanel from '../touchosc/TouchOSCNetworkPanel';
import { exportToToscFile, ExportOptions } from '../../utils/touchoscExporter';
import { exportCrashProofToscFile, FixedExportOptions } from '../../utils/touchoscFixedExporter';
import styles from './TouchOSCControlPanel.module.scss';

interface TouchOSCControlPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const TouchOSCControlPanel: React.FC<TouchOSCControlPanelProps> = ({
  isVisible = true,
  onClose
}) => {
  const { 
    fixtures: allFixtures,
    fixtureLayout,
    masterSliders
  } = useStore();

  const [touchOscGenerating, setTouchOscGenerating] = useState(false);
  const [showNetworkPanel, setShowNetworkPanel] = useState(true);
  const [showLegacyExport, setShowLegacyExport] = useState(false);

  // Legacy export functions
  const generateFromFixtures = async () => {
    setTouchOscGenerating(true);
    try {
      const options: ExportOptions = {
        resolution: 'ipad_pro_2019_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false
      };

      const result = await exportToToscFile(
        options,
        fixtureLayout,
        masterSliders,
        allFixtures,
        'ArtBastard_Fixtures.tosc'
      );

      if (result.success) {
        alert('TouchOSC layout generated successfully! Load the .tosc file in your TouchOSC app.');
      } else {
        alert(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating TouchOSC layout:', error);
      alert('Error generating TouchOSC layout: ' + error);
    } finally {
      setTouchOscGenerating(false);
    }
  };

  const generateCrashProofExport = async () => {
    setTouchOscGenerating(true);
    try {
      const options: FixedExportOptions = {
        resolution: 'tablet_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false
      };

      const result = await exportCrashProofToscFile(
        options,
        fixtureLayout,
        masterSliders,
        allFixtures,
        'ArtBastard_CrashProof.tosc'
      );

      if (result.success) {
        alert('✅ Crash-proof TouchOSC file generated successfully!');
      } else {
        alert(`❌ Crash-proof export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating crash-proof TouchOSC layout:', error);
      alert('Error generating crash-proof TouchOSC layout: ' + error);
    } finally {
      setTouchOscGenerating(false);
    }
  };

  const generate512Channels = async () => {
    setTouchOscGenerating(true);
    try {
      const options: ExportOptions = {
        resolution: 'ipad_pro_2019_portrait',
        includeFixtureControls: false,
        includeMasterSliders: false,
        includeAllDmxChannels: true
      };

      const result = await exportToToscFile(
        options,
        [],
        [],
        allFixtures,
        'DMX512_AllChannels.tosc'
      );

      if (result.success) {
        alert('512-channel TouchOSC layout generated successfully!');
      } else {
        alert(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating 512-channel layout:', error);
      alert('Error generating 512-channel layout: ' + error);
    } finally {
      setTouchOscGenerating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.touchoscPanel}>
      <div className={styles.header}>
        <h2>📱 TouchOSC Control Panel</h2>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Network Transmission Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>🌐 Network Transmission</h3>
            <button 
              onClick={() => setShowNetworkPanel(!showNetworkPanel)}
              className={styles.toggleButton}
            >
              {showNetworkPanel ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showNetworkPanel && (
            <div className={styles.networkPanelWrapper}>
              <p>Send your DMX interface directly to TouchOSC Editor via network - no file export needed!</p>
              <TouchOSCNetworkPanel isVisible={true} />
            </div>
          )}
        </div>

        {/* Legacy Export Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>📁 Legacy File Export</h3>
            <button 
              onClick={() => setShowLegacyExport(!showLegacyExport)}
              className={styles.toggleButton}
            >
              {showLegacyExport ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showLegacyExport && (
            <div className={styles.legacyExportWrapper}>
              <p>Generate .touchosc files for manual import (legacy method)</p>
              
              <div className={styles.buttonGrid}>
                <button
                  onClick={generateFromFixtures}
                  className={styles.exportButton}
                  disabled={touchOscGenerating}
                >
                  {touchOscGenerating ? '⏳ Generating...' : '🎯 Auto-Generate from Fixtures'}
                </button>
                
                <button
                  onClick={generate512Channels}
                  className={styles.exportButton}
                  disabled={touchOscGenerating}
                >
                  {touchOscGenerating ? '⏳ Generating...' : '📊 Generate All 512 Channels'}
                </button>
                
                <button
                  onClick={generateCrashProofExport}
                  className={`${styles.exportButton} ${styles.crashProofButton}`}
                  disabled={touchOscGenerating}
                  title="Enhanced export with crash prevention fixes"
                >
                  {touchOscGenerating ? '⏳ Generating...' : '🔧 Generate Crash-Proof TouchOSC'}
                </button>
              </div>

              <div className={styles.infoText}>
                <p><strong>Auto-Generate from Fixtures:</strong> Creates TouchOSC layout with controls for all placed fixtures.</p>
                <p><strong>All 512 Channels:</strong> Creates a comprehensive grid with faders for all 512 DMX channels.</p>
                <p><strong>🔧 Crash-Proof TouchOSC:</strong> Enhanced export with validation and crash prevention.</p>
              </div>
            </div>
          )}
        </div>

        {/* Current Layout Info */}
        <div className={styles.section}>
          <h3>📊 Current Layout</h3>
          <div className={styles.layoutInfo}>
            <div>Placed Fixtures: {fixtureLayout.length}</div>
            <div>Available Fixture Types: {allFixtures.length}</div>
            <div>Pan/Tilt Fixtures: {fixtureLayout.filter(pf => {
              const fixture = allFixtures.find(f => f.id === pf.fixtureId);
              return fixture?.channels.some(ch => ch.type === 'pan' || ch.type === 'tilt');
            }).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouchOSCControlPanel;
