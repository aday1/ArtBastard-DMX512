import React, { useState } from 'react';
import TouchOSCControlPanel from './TouchOSCControlPanel';
import styles from './TouchOSCMenuButton.module.scss';

interface TouchOSCMenuButtonProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const TouchOSCMenuButton: React.FC<TouchOSCMenuButtonProps> = ({ 
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={styles.toggleButton}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
        }}
        title="TouchOSC Control Panel"
      >
        {isVisible ? '📱 Hide TouchOSC' : '📱 TouchOSC Panel'}
      </button>

      {/* Control Panel */}
      {isVisible && (
        <div
          className={styles.panelOverlay}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsVisible(false);
            }
          }}
        >
          <TouchOSCControlPanel 
            isVisible={true} 
            onClose={() => setIsVisible(false)} 
          />
        </div>
      )}
    </>
  );
};

export default TouchOSCMenuButton;
