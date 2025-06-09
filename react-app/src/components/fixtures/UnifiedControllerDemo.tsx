import React from 'react';
import UnifiedFixtureController from '../fixtures/UnifiedFixtureController';
import styles from './UnifiedControllerDemo.module.scss';

interface UnifiedControllerDemoProps {
  onClose?: () => void;
}

const UnifiedControllerDemo: React.FC<UnifiedControllerDemoProps> = ({ onClose }) => {
  return (
    <div className={styles.demoContainer}>
      <div className={styles.demoHeader}>
        <h2>Unified Fixture Controller Demo</h2>
        <p>
          This enhanced controller provides comprehensive Pan/Tilt/RGB control with multi-select capabilities.
          Key features include:
        </p>
        <ul>
          <li><strong>Collective vs Independent Control:</strong> Control all selected fixtures together or individually</li>
          <li><strong>Multiple View Modes:</strong> Compact, Expanded, and Professional layouts</li>
          <li><strong>Advanced Color Controls:</strong> RGB sliders, HSV controls, color wheel, and color temperature</li>
          <li><strong>Movement Controls:</strong> Interactive canvas, sliders, and preset positions</li>
          <li><strong>Scene Management:</strong> Save and recall lighting scenes</li>
          <li><strong>Smart Selection:</strong> Select fixtures by type, capabilities, or search</li>
          <li><strong>Performance Optimized:</strong> Batched DMX updates for smooth multi-fixture control</li>
        </ul>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            Close Demo
          </button>
        )}
      </div>
      
      <div className={styles.controllerContainer}>
        <UnifiedFixtureController isDockable={false} />
      </div>
      
      <div className={styles.instructions}>
        <h3>How to Use:</h3>
        <ol>
          <li><strong>Select Fixtures:</strong> Click the fixture selector to choose which lights to control</li>
          <li><strong>Choose Control Mode:</strong> 
            <ul>
              <li><strong>Collective:</strong> All selected fixtures respond to the same control input</li>
              <li><strong>Independent:</strong> Each fixture can be controlled separately (future enhancement)</li>
            </ul>
          </li>
          <li><strong>Pick View Mode:</strong>
            <ul>
              <li><strong>Compact:</strong> Basic color presets and movement canvas</li>
              <li><strong>Expanded:</strong> Full color wheel and RGB sliders</li>
              <li><strong>Professional:</strong> Complete control with HSV, color temperature, and number inputs</li>
            </ul>
          </li>
          <li><strong>Control Colors:</strong> Use color presets, wheel, sliders, or temperature controls</li>
          <li><strong>Control Movement:</strong> Click on the movement canvas or use sliders for precise control</li>
          <li><strong>Save Scenes:</strong> Capture current fixture states and recall them later</li>
        </ol>
        
        <h3>Pro Tips:</h3>
        <ul>
          <li>Use the search function to quickly find specific fixtures</li>
          <li>Smart selection buttons help you select fixtures by capability (RGB, Movement, etc.)</li>
          <li>Live Mode can be toggled off in Professional mode to make changes without immediately sending to fixtures</li>
          <li>The controller remembers your view mode preference</li>
          <li>Scene presets work with the currently selected fixtures</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedControllerDemo;
