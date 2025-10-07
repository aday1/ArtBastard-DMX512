import React from 'react';
import { ActsPanel } from '../components/acts/ActsPanel';
import styles from './ActsPage.module.scss';

const ActsPage: React.FC = () => {
  return (
    <div className={styles.actsPage}>
      <ActsPanel />
    </div>
  );
};

export default ActsPage;