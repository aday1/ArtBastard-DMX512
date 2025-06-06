import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ThemeToggleButton.module.scss';

export const ThemeToggleButton: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  const handleResetUI = () => {
    // Remove localStorage items for MidiMonitor and OscMonitor positions
    localStorage.removeItem('midiMonitorPositionX');
    localStorage.removeItem('midiMonitorPositionY');
    localStorage.removeItem('oscMonitorPositionX');
    localStorage.removeItem('oscMonitorPositionY');

    // Reload the page to apply the reset
    window.location.reload();
  };

  return (
    <div className={styles.themeToggleContainer}>
      <button
        className={styles.iconButton}
        onClick={toggleDarkMode}
        title="Toggle Light/Dark Mode"
      >
        <LucideIcon name={darkMode ? 'Moon' : 'Sun'} />
      </button>
      <button
        className={styles.iconButton}
        onClick={handleResetUI}
        title="Reset UI Elements"
      >
        <LucideIcon name="RefreshCw" />
      </button>
    </div>
  );
};
