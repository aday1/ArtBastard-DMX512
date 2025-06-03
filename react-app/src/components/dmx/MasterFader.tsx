import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import styles from './MasterFader.module.scss';
import { Sparkles } from '../layout/Sparkles'; // Import Sparkles

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
  const [fadeIntervalId, setFadeIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [valueBeforeFadeout, setValueBeforeFadeout] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  const { dmxChannels, setDmxChannelValue, setMultipleDmxChannels } = useStore(); // Added setMultipleDmxChannels
  const { socket } = useSocket();
  const { startLearn, cancelLearn } = useMidiLearn();
  const handleValueChange = useCallback((newValue: number) => {
    const previousValue = value;
    setValue(newValue);
    onValueChange?.(newValue);

    const dmxUpdates: Record<number, number> = {};

    if (newValue === 0 && previousValue > 0) {
      const currentValuesToSaveNormalized: { [key: number]: number } = {};
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        const currentDmxValue = dmxChannels[channelNum];

        if (currentDmxValue > 0) {
          let normalizedValue = currentDmxValue;
          if (previousValue > 0 && previousValue < 255) {
            normalizedValue = (currentDmxValue / previousValue) * 255;
          }
          currentValuesToSaveNormalized[channelNum] = Math.min(255, Math.max(0, Math.round(normalizedValue)));
          dmxUpdates[channelNum] = 0; // Add to batch for setting to 0
        } else if (dmxChannels[channelNum] !== 0) {
          dmxUpdates[channelNum] = 0; // Ensure it's set to 0 if it wasn't already
        }
      });
      setPreviousChannelValues(currentValuesToSaveNormalized);
    } else if (newValue > 0 && previousValue === 0) {
      Object.keys(previousChannelValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        const normalizedOriginalValue = previousChannelValues[channelNum];
        const proportionalValue = Math.round((normalizedOriginalValue * newValue) / 255);
        dmxUpdates[channelNum] = proportionalValue;
      });
    } else if (newValue > 0 && previousValue > 0) {
      if (previousValue !== 0) {
        const adjustmentFactor = newValue / previousValue;
        Object.keys(dmxChannels).forEach(key => {
          const num = parseInt(key);
          const adjustedValue = Math.round(dmxChannels[num] * adjustmentFactor);
          dmxUpdates[num] = Math.min(255, Math.max(0, adjustedValue));
        });
      }
    }

    if (Object.keys(dmxUpdates).length > 0) {
      setMultipleDmxChannels(dmxUpdates);
    }

    if (socket && oscAddress) {
      socket.emit('osc-send', {
        address: oscAddress,
        args: [{ type: 'f', value: newValue / 255 }]
      });
    }
  }, [value, dmxChannels, setMultipleDmxChannels, onValueChange, previousChannelValues, setPreviousChannelValues, setValue, socket, oscAddress]); // Updated dependencies

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    handleValueChange(newValue);
  };

  // Removed handleSliderMouseDown as it's not needed and might have interfered.
  // const handleSliderMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
  //   e.stopPropagation();
  // };

  const handleSliderInput = (e: React.FormEvent<HTMLInputElement>) => {
    // Handle real-time input changes for better responsiveness
    const target = e.target as HTMLInputElement;
    const newValue = parseInt(target.value);
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
    const dmxUpdates: Record<number, number> = {};
    if (isFullOn) {
      setIsFullOn(false);
      Object.keys(fullOnSavedValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        dmxUpdates[channelNum] = fullOnSavedValues[channelNum];
      });
      // setValue(255); // Master fader value should reflect the actual light state or user intention.
                       // If restoring, it was likely already at 255 or user will adjust.
                       // Let's keep it at 255 as per original logic for now, but this could be re-evaluated.
    } else {
      setIsFullOn(true);
      const currentValues: { [key: number]: number } = {};
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        currentValues[channelNum] = dmxChannels[channelNum];
        dmxUpdates[channelNum] = 255;
      });
      setFullOnSavedValues(currentValues);
      // setValue(255); // Set master to full - this is a UI concern, separate from DMX values
    }

    if (Object.keys(dmxUpdates).length > 0) {
      setMultipleDmxChannels(dmxUpdates);
    }
    // After DMX updates are sent, then update the UI state of the fader itself.
    // If turning ON, master fader UI should go to 255.
    // If turning OFF, it means we are restoring values. The master fader UI was likely already at 255.
    // If we want the master fader to go to a specific value after restoring, that needs to be decided.
    // For now, if turning ON, set to 255. If turning OFF, assume it was 255 and stays there, or user adjusts.
    if (!isFullOn) { // This means it's now ON
        setValue(255);
    } else { // This means it's now OFF (was ON before toggle)
        // Let's assume if the user toggles full-on OFF, they want the master fader to still represent "full"
        // for the restored values. If the restored values are all 0, then the master fader at 255 is fine.
        // This matches the original logic where setValue(255) was called in the "turn off" branch.
        setValue(255);
    }
  };

  const toggleMinimize = () => { // Function to toggle minimize state
    setIsMinimized(!isMinimized);
  };

  // useEffect for interval cleanup
  useEffect(() => {
    return () => {
      if (fadeIntervalId) {
        clearInterval(fadeIntervalId);
      }
    };
  }, [fadeIntervalId]);

  const handleSlowFadeout = () => {
    if (isFading || value === 0) return;

    setIsFading(true);
    setValueBeforeFadeout(value);

    const fadeDuration = 5000; // 5 seconds
    const steps = 50;
    // Use a local variable for current value in interval to avoid stale closure issues with `value` state directly
    let currentSliderValue = value;
    const decrement = currentSliderValue / steps;
    const intervalTime = fadeDuration / steps;

    if (fadeIntervalId) clearInterval(fadeIntervalId);

    const newIntervalId = setInterval(() => {
      currentSliderValue -= decrement;
      if (currentSliderValue <= 0) {
        handleValueChange(0); // Ensure it hits exactly 0
        clearInterval(newIntervalId);
        setIsFading(false);
        setFadeIntervalId(null);
      } else {
        handleValueChange(currentSliderValue);
      }
    }, intervalTime);
    setFadeIntervalId(newIntervalId);
  };

  const handleFadeBackup = () => {
    const targetValue = valueBeforeFadeout > 0 ? valueBeforeFadeout : 255;
    if (isFading || value === targetValue) return;

    setIsFading(true);

    const fadeDuration = 5000; // 5 seconds
    const steps = 50;
    let currentSliderValue = value;
    // Ensure increment is positive even if currentSliderValue is slightly off
    const increment = Math.abs(targetValue - currentSliderValue) / steps;
    const intervalTime = fadeDuration / steps;

    if (fadeIntervalId) clearInterval(fadeIntervalId);

    const newIntervalId = setInterval(() => {
      currentSliderValue += increment;
      if (currentSliderValue >= targetValue) {
        handleValueChange(targetValue); // Ensure it hits exactly targetValue
        clearInterval(newIntervalId);
        setIsFading(false);
        setFadeIntervalId(null);
        // Optionally reset valueBeforeFadeout if it was a temporary target
        if (valueBeforeFadeout === 0 && targetValue === 255) setValueBeforeFadeout(255);
      } else {
        handleValueChange(currentSliderValue);
      }
    }, intervalTime);
    setFadeIntervalId(newIntervalId);
  };

  return (
    <div className={`${styles.masterFader} ${isMinimized ? styles.minimized : ''}`}>
      <Sparkles /> {/* Add Sparkles component here */}
      <div className={`${styles.header}`}>
        <h3>Master Fader</h3>
        <div className={styles.windowControls}>
          <button onClick={toggleMinimize} className={styles.minimizeButton}>
            {isMinimized ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
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
          <button
            className={styles.slowFadeoutButton}
            onClick={handleSlowFadeout}
            disabled={isFading || value === 0}
            title="Slowly fade out to 0"
          >
            <i className="fas fa-arrow-down"></i>
            Slow Fadeout
          </button>
          <button
            className={styles.fadeBackupButton}
            onClick={handleFadeBackup}
            disabled={isFading || value === (valueBeforeFadeout > 0 ? valueBeforeFadeout : 255)}
            title="Fade back up to previous or full"
          >
            <i className="fas fa-arrow-up"></i>
            Fade Back up
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
              onInput={handleSliderInput}
              // Removed onMouseDown and onPointerDown to test if they were interfering
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
  );
};
