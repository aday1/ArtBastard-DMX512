"use client"; // This page will use client components

import React from 'react';
import DMXChannelGrid from '../components/dmx/DMXChannelGrid';
import styles from './DMXPage.module.scss'; // Create this file for page-specific styles

const DMXPage: React.FC = () => {
  return (
    <div className={styles.dmxPageContainer}>
      <header className={styles.pageHeader}>
        <h1>DMX Control</h1>
        <p>Direct control over all 512 DMX channels.</p>
        {/* Add toolbar for selection, master fader, etc. later */}
      </header>

      <DMXChannelGrid />

      {/* Future additions:
          - Master Fader component
          - Group controls
          - Selection tools (select all, none, invert)
          - Pagination/Filtering for DMXChannelGrid
      */}
    </div>
  );
};

export default DMXPage;
