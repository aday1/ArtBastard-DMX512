import React from 'react';
import Dashboard from '../components/dashboard/Dashboard';
import styles from './ExternalConsolePage.module.scss';

/**
 * External Console Page - Standalone page for tablets and 2nd monitors
 * Opens in a new window with full functionality
 * All providers are handled in App.tsx
 */
const ExternalConsolePage: React.FC = () => {
  return (
    <div className={styles.externalConsolePage}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          🖥️ External Console
        </h1>
        <p className={styles.subtitle}>
          Component workspace and layout manager - Perfect for tablets and 2nd monitors
        </p>
      </div>
      <Dashboard />
    </div>
  );
};

export default ExternalConsolePage;

