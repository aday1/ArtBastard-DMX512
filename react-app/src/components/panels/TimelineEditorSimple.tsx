import React from 'react';
import VisualTimelineEditor from './VisualTimelineEditor';
import TimelineControls from './TimelineControls';
import styles from './TimelineEditor.module.scss';

interface TimelineEditorProps {
  className?: string;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ className }) => {
  return (
    <div className={`${styles.timelineEditor} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3>Timeline Editor</h3>
      </div>

      {/* Timeline Controls Section */}
      <div className={styles.controlsSection}>
        <TimelineControls />
      </div>

      {/* Visual Timeline Editor Section */}
      <div className={styles.visualSection}>
        <VisualTimelineEditor />
      </div>
    </div>
  );
};

export default TimelineEditor;
