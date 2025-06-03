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
    const previousValue = value; // Capture state BEFORE update for DMX logic
    setValue(newValue);          // Update state - this should make the slider knob move
    onValueChange?.(newValue);    // Propagate change

    // Reintroduce DMX logic
    if (newValue === 0 && previousValue > 0) {
      const currentValuesToSaveNormalized: { [key: number]: number } = {};
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        const currentDmxValue = dmxChannels[channelNum]; // Current live DMX value for this channel

        if (currentDmxValue > 0) {
          let normalizedValue = currentDmxValue;
          // If master was active but not full, normalize the DMX value
          if (previousValue > 0 && previousValue < 255) {
            normalizedValue = (currentDmxValue / previousValue) * 255;
          }
          // If previousValue was 255, currentDmxValue is already the "full" value.
          // If previousValue was 0 (not possible in this branch due to `previousValue > 0`), it's a non-issue.

          currentValuesToSaveNormalized[channelNum] = Math.min(255, Math.max(0, Math.round(normalizedValue)));
          setDmxChannelValue(channelNum, 0); // Set live DMX to 0
        } else {
          // If currentDmxValue is 0, ensure it's set to 0 in the live DMX (if not already)
          // and don't store it in previousChannelValues unless we want to explicitly restore it to 0.
          // For simplicity, we only store values that were > 0.
          // However, if a channel was manually set to 0 while master was up, and then master goes to 0,
          // it won't be in previousChannelValues. When master comes up, it won't be touched by the restore loop.
          // This is generally fine.
          if (dmxChannels[channelNum] !== 0) { // Ensure it's set to 0 if it wasn't already
             setDmxChannelValue(channelNum, 0);
          }
        }
      });
      setPreviousChannelValues(currentValuesToSaveNormalized);
    } else if (newValue > 0 && previousValue === 0) {
      Object.keys(previousChannelValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        const normalizedOriginalValue = previousChannelValues[channelNum]; // This is now the "full" value
        const proportionalValue = Math.round((normalizedOriginalValue * newValue) / 255);
        setDmxChannelValue(channelNum, proportionalValue);
      });
    } else if (newValue > 0 && previousValue > 0) {
      // Refactored logic for "adjusting between non-zero values"
      if (previousValue !== 0) { // Avoid division by zero
          const adjustmentFactor = newValue / previousValue;
          Object.keys(dmxChannels).forEach(key => {
              const num = parseInt(key);
              // Scale the current value of the channel
              const adjustedValue = Math.round(dmxChannels[num] * adjustmentFactor);
              setDmxChannelValue(num, Math.min(255, Math.max(0, adjustedValue)));
          });
      }
    }

    // Send OSC message
    if (socket && oscAddress) {
      socket.emit('osc-send', {
        address: oscAddress,
        args: [{ type: 'f', value: newValue / 255 }]
      });
    }
  }, [value, dmxChannels, setDmxChannelValue, onValueChange, previousChannelValues, setPreviousChannelValues, setValue, socket, oscAddress]);

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
