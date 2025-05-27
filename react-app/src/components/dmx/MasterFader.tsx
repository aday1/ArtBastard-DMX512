import React, { useState, useCallback } from 'react';
import Draggable from 'react-draggable'; // Import Draggable
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import styles from './MasterFader.module.scss';

interface MasterFaderProps {
  onValueChange?: (value: number) => void;
}

export const MasterFader: React.FC<MasterFaderProps> = ({ onValueChange }) => {
  const [value, setValue] = useState(0);
  const [oscAddress, setOscAddress] = useState('/master');
  const [midiCC, setMidiCC] = useState<number | null>(null);
  const [midiChannel, setMidiChannel] = useState(1);
  const [isLearning, setIsLearning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // State for minimized

  const { dmxChannels, setDmxChannelValue } = useStore();
  const { socket } = useSocket();
    const { startLearn, cancelLearn } = useMidiLearn();

  const handleValueChange = useCallback((newValue: number) => {
    setValue(newValue);
    onValueChange?.(newValue);

    // Set all current non-zero channels to zero (master blackout)
    if (newValue === 0) {
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        if (dmxChannels[channelNum] > 0) {
          setDmxChannelValue(channelNum, 0);
        }
      });
    }

    // Send OSC message
    if (socket && oscAddress) {
      socket.emit('osc-send', {
        address: oscAddress,
        args: [{ type: 'f', value: newValue / 255 }]
      });
    }
  }, [dmxChannels, setDmxChannelValue, socket, oscAddress, onValueChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    handleValueChange(newValue);
  };
  const handleMidiLearnToggle = () => {
    if (isLearning) {
      cancelLearn();
      setIsLearning(false);
    } else {
      startLearn(0); // Master fader uses channel 0
      setIsLearning(true);
    }
  };

  const handleClearMidi = () => {
    // Clear MIDI mapping logic would go here
    setMidiCC(null);
    setIsLearning(false);
  };

  const blackoutAll = () => {
    handleValueChange(0);
  };

  const toggleMinimize = () => { // Function to toggle minimize state
    setIsMinimized(!isMinimized);
  };

  return (
    <Draggable handle=".${styles.header}">
      <div className={`${styles.masterFader} ${isMinimized ? styles.minimized : ''}`}>
        <div className={styles.header}>
          <h3>Master Fader</h3>
          <div className={styles.windowControls}>
            <button onClick={toggleMinimize} className={styles.minimizeButton}>
              {isMinimized ? <i className="fas fa-window-maximize"></i> : <i className="fas fa-window-minimize"></i>}
            </button>
            {/* Add close button if needed */}
          </div>
          <button 
            className={styles.blackoutButton}
            onClick={blackoutAll}
            title="Blackout All Channels"
          >
            <i className="fas fa-power-off"></i>
            Blackout
          </button>
        </div>

        {!isMinimized && ( // Conditionally render content based on isMinimized
          <div className={styles.faderContainer}>
            <div className={styles.sliderWrapper}>          <input
                type="range"
                min="0"
                max="255"
                value={value}
                onChange={handleSliderChange}
                className={styles.verticalSlider}
              />
              <div className={styles.valueDisplay}>
                {value}
              </div>
            </div>

            <div className={styles.controls}>
              <div className={styles.oscConfig}>
                <label>OSC Address:</label>
                <input
                  type="text"
                  value={oscAddress}
                  onChange={(e) => setOscAddress(e.target.value)}
                  className={styles.addressInput}
                  placeholder="/master"
                />
              </div>

              <div className={styles.midiConfig}>
                <div className={styles.midiStatus}>
                  {midiCC !== null ? (
                    <span className={styles.midiAssigned}>
                      MIDI CC {midiCC} (Ch {midiChannel})
                    </span>
                  ) : (
                    <span className={styles.midiUnassigned}>No MIDI mapping</span>
                  )}
                </div>

                <div className={styles.midiActions}>
                  <button
                    className={`${styles.learnButton} ${isLearning ? styles.learning : ''}`}
                    onClick={handleMidiLearnToggle}
                    disabled={false}
                  >
                    {isLearning ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i>
                        Learning...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-graduation-cap"></i>
                        MIDI Learn
                      </>
                    )}
                  </button>

                  {midiCC !== null && (
                    <button
                      className={styles.clearButton}
                      onClick={handleClearMidi}
                      title="Clear MIDI mapping"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.quickActions}>
                <button 
                  className={styles.quickButton}
                  onClick={() => handleValueChange(255)}
                >
                  Full
                </button>
                <button 
                  className={styles.quickButton}
                  onClick={() => handleValueChange(128)}
                >
                  50%
                </button>
                <button 
                  className={styles.quickButton}
                  onClick={() => handleValueChange(64)}
                >
                  25%
                </button>
              </div>

              <div className={styles.channelInfo}>
                <span>Active Channels: {Object.values(dmxChannels).filter(v => v > 0).length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};
