import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './ThemeToggleButton.module.scss';

export const ThemeToggleButton: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <div
      className={styles.themeToggle}
      onClick={toggleDarkMode}
      title="Toggle Light/Dark Mode"
    >
      <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
    </div>
  );
};
