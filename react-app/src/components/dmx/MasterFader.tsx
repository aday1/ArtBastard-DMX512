import React, { useState, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
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
  const [isFullOn, setIsFullOn] = useState(false); // State for FULL ON mode
  const [previousChannelValues, setPreviousChannelValues] = useState<{ [key: number]: number }>({});
  const [fullOnSavedValues, setFullOnSavedValues] = useState<{ [key: number]: number }>({});

  const { dmxChannels, setDmxChannelValue } = useStore();
  const { socket } = useSocket();
    const { startLearn, cancelLearn } = useMidiLearn();
  const handleValueChange = useCallback((newValue: number) => {
    const previousValue = value;
    setValue(newValue);
    onValueChange?.(newValue);

    // Group slider behavior
    if (newValue === 0 && previousValue > 0) {
      // Moving to zero - save current values and set all to zero
      const currentValues: { [key: number]: number } = {};
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        if (dmxChannels[channelNum] > 0) {
          currentValues[channelNum] = dmxChannels[channelNum];
          setDmxChannelValue(channelNum, 0);
        }
      });
      setPreviousChannelValues(currentValues);
    } else if (newValue > 0 && previousValue === 0) {
      // Moving from zero - restore previous values proportionally
      Object.keys(previousChannelValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        const originalValue = previousChannelValues[channelNum];
        const proportionalValue = Math.round((originalValue * newValue) / 255);
        setDmxChannelValue(channelNum, proportionalValue);
      });
    } else if (newValue > 0 && previousValue > 0) {
      // Adjusting between non-zero values - scale all non-zero channels proportionally
      const scaleFactor = newValue / 255;
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        if (dmxChannels[channelNum] > 0) {
          const scaledValue = Math.round(dmxChannels[channelNum] * scaleFactor);
          setDmxChannelValue(channelNum, Math.min(255, scaledValue));
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
  }, [dmxChannels, setDmxChannelValue, socket, oscAddress, onValueChange, value, previousChannelValues]);

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

  const toggleFullOn = () => {
    if (isFullOn) {
      // Turn off FULL ON - restore previous values
      setIsFullOn(false);
      Object.keys(fullOnSavedValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        setDmxChannelValue(channelNum, fullOnSavedValues[channelNum]);
      });
      setValue(255); // Set master to full
    } else {
      // Turn on FULL ON - save current values and set all to 255
      setIsFullOn(true);
      const currentValues: { [key: number]: number } = {};
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        currentValues[channelNum] = dmxChannels[channelNum];
        setDmxChannelValue(channelNum, 255);
      });
      setFullOnSavedValues(currentValues);
      setValue(255); // Set master to full
    }
  };

  const toggleMinimize = () => { // Function to toggle minimize state
    setIsMinimized(!isMinimized);  };
  return (
    <Draggable handle=".handle" bounds="parent">
      <div className={`${styles.masterFader} ${isMinimized ? styles.minimized : ''}`}>
        <div className={`${styles.header} handle`}>
          <h3>Master Fader</h3>
          <div className={styles.windowControls}>
            <button onClick={toggleMinimize} className={styles.minimizeButton}>
              {isMinimized ? <i className="fas fa-window-maximize"></i> : <i className="fas fa-window-minimize"></i>}
            </button>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.fullOnButton} ${isFullOn ? styles.active : ''}`}
              onClick={toggleFullOn}
              title="Toggle Full On (All channels to 255)"
            >
              <i className="fas fa-lightbulb"></i>
              FULL ON
            </button>
            <button 
              className={styles.blackoutButton}
              onClick={blackoutAll}
              title="Blackout All Channels"
            >
              <i className="fas fa-power-off"></i>
              Blackout
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className={styles.faderContainer}>
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="0"
                max="255"
                value={value}
                onChange={handleSliderChange}
                className={styles.verticalSlider}
              />
              <div className={styles.valueDisplay}>
                {Math.round((value / 255) * 100)}%
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
