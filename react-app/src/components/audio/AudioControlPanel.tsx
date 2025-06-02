import React, { useState } from 'react';
import { AudioFFT } from './AudioFFT';
import { FFTOSCAssignment } from './FFTOSCAssignment';
import styles from './AudioControlPanel.module.scss';

interface FFTBandSelectionInfo {
  bandName: string;
  bandLabel: string;
  bandIndex: number;
  magnitude: number;
  minFreq: number;
  maxFreq: number;
  index: number; // Add this property  
  frequency: number; // Add this property
}

export const AudioControlPanel: React.FC = () => {
  const [selectedBand, setSelectedBand] = useState<FFTBandSelectionInfo | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  const handleBandSelect = (bandInfo: FFTBandSelectionInfo) => {
    setSelectedBand(bandInfo);
    setSelectedRange(null); // Clear range when selecting single band
  };

  const handleRangeSelect = (start: number, end: number) => {
    setSelectedRange({ start, end });
    setSelectedBand(null); // Clear single band when selecting range
  };

  return (
    <div className={styles.audioControlPanel}>
      <div className={styles.header}>
        <h2>Audio Control Center</h2>
        <p>Real-time audio analysis with OSC output mapping</p>
      </div>      <div className={styles.fftSection}>
        <AudioFFT 
          onBandSelect={handleBandSelect}
        />
      </div>

      <div className={styles.assignmentSection}>
        <FFTOSCAssignment 
          selectedBand={selectedBand}
          selectedRange={selectedRange}
        />
      </div>
    </div>
  );
};
