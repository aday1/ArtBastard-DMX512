import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { useMidiLearn } from '../../hooks/useMidiLearn';
import { DockableComponent } from '../ui/DockableComponent';
import styles from './MasterFader.module.scss';
import { Sparkles } from '../layout/Sparkles'; // Import Sparkles

interface MasterFaderProps {
  onValueChange?: (value: number) => void;
  isMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  isDockable?: boolean;
  compact?: boolean; // New prop for compact mode
}

export const MasterFader: React.FC<MasterFaderProps> = ({ 
  onValueChange, 
  isMinimized: externalIsMinimized = false,
  onMinimizedChange,
  isDockable = true,
  compact = false // Default to false for backward compatibility
}) => {
  const [value, setValue] = useState(0);
  const [oscAddress, setOscAddress] = useState('/master');
  const [midiCC, setMidiCC] = useState<number | null>(null);
  const [midiChannel, setMidiChannel] = useState(1);
  const [isLearning, setIsLearning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(externalIsMinimized); // State for minimized
  const [isFullOn, setIsFullOn] = useState(false); // State for FULL ON mode
  const [previousChannelValues, setPreviousChannelValues] = useState<{ [key: number]: number }>({});
  const [fullOnSavedValues, setFullOnSavedValues] = useState<{ [key: number]: number }>({});
  const [fadeIntervalId, setFadeIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [valueBeforeFadeout, setValueBeforeFadeout] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);
  // New state for baseline save/restore system
  const [baselineChannelValues, setBaselineChannelValues] = useState<{ [key: number]: number } | null>(null);
  const [isMasterFaderActive, setIsMasterFaderActive] = useState<boolean>(false);
  const [masterFaderValueWhenActivated, setMasterFaderValueWhenActivated] = useState<number>(255);

  const { dmxChannels, setMultipleDmxChannels, groups, fixtures, oscAssignments, midiMessages } = useStore(state => ({
    dmxChannels: state.dmxChannels,
    setMultipleDmxChannels: state.setMultipleDmxChannels,
    groups: state.groups,
    fixtures: state.fixtures,
    oscAssignments: state.oscAssignments,
    midiMessages: state.midiMessages,
  }));
  const { socket } = useSocket();
  const { startLearn, cancelLearn, midiLearnTarget } = useMidiLearn();
  
  // Listen for MIDI messages when mapped
  useEffect(() => {
    if (!midiMessages || midiMessages.length === 0 || !midiCC) return;
    
    const latestMessage = midiMessages[midiMessages.length - 1];
    
    // Check if this message matches our MIDI mapping
    if (latestMessage._type === 'cc' && 
        latestMessage.controller === midiCC && 
        latestMessage.channel === (midiChannel - 1)) { // Convert 1-16 to 0-15
      // Scale MIDI CC value (0-127) to master fader range (0-255)
      const newValue = Math.round((latestMessage.value / 127) * 255);
      handleValueChange(newValue);
    }
  }, [midiMessages, midiCC, midiChannel, handleValueChange]);
  
  // Listen for OSC messages
  useEffect(() => {
    if (!socket) return;
    
    const handleOscMessage = (message: any) => {
      if (message.address === oscAddress && message.args && message.args.length > 0) {
        // OSC value is typically 0.0-1.0, scale to 0-255
        const oscValue = message.args[0].value || message.args[0];
        const newValue = Math.round(Math.max(0, Math.min(255, oscValue * 255)));
        handleValueChange(newValue);
      }
    };
    
    socket.on('oscMessage', handleOscMessage);
    
    return () => {
      socket.off('oscMessage', handleOscMessage);
    };
  }, [socket, oscAddress, handleValueChange]);
  
  // Listen for MIDI learn completion
  useEffect(() => {
    if (midiLearnTarget === null || midiLearnTarget !== 0) return; // Master fader uses channel 0
    
    const handleMidiMappingCreated = (event: CustomEvent) => {
      const { channel, mapping } = event.detail;
      if (channel === 0) { // Master fader channel
        if (mapping.controller !== undefined) {
          setMidiCC(mapping.controller);
          setMidiChannel(mapping.channel + 1); // Convert 0-15 to 1-16
          setIsLearning(false);
          console.log('[MasterFader] MIDI learned:', mapping);
        } else if (mapping.note !== undefined) {
          // For note mappings, we could use note on/off to toggle or set value
          setMidiCC(null); // Notes not supported for continuous control
          setIsLearning(false);
        }
      }
    };
    
    window.addEventListener('midiMappingCreated', handleMidiMappingCreated as EventListener);
    
    return () => {
      window.removeEventListener('midiMappingCreated', handleMidiMappingCreated as EventListener);
    };
  }, [midiLearnTarget]);

  const isChannelIgnored = useCallback((channelIndex: number): boolean => {
    if (!fixtures || !groups) return false;

    for (const fixture of fixtures) {
      const startAddress = fixture.startAddress - 1; // 0-indexed
      const endAddress = startAddress + fixture.channels.length - 1;

      if (channelIndex >= startAddress && channelIndex <= endAddress) {
        // Channel is part of this fixture
        for (const group of groups) {
          if (group.fixtureIndices.some(fi => fixtures[fi]?.id === fixture.id)) {
            // This fixture is in this group
            if (group.ignoreMasterFader === true) {
              return true; // Ignored by this group
            }
          }
        }
      }
    }
    return false; // Not found in any group that ignores master fader
  }, [fixtures, groups]);
  // Save baseline state when master fader is first activated
  const saveBaselineState = useCallback(() => {
    // Only save baseline if we don't have one yet AND master fader is at full (255)
    // This ensures we save the "original" state before any master fader manipulation
    if (!isMasterFaderActive && baselineChannelValues === null && value === 255) {
      // Save the current state as baseline before master fader is used
      const baseline: { [key: number]: number } = {};
      for (let i = 0; i < 512; i++) {
        if (!isChannelIgnored(i)) {
          baseline[i] = dmxChannels[i] || 0;
        }
      }
      setBaselineChannelValues(baseline);
      setMasterFaderValueWhenActivated(255);
      setIsMasterFaderActive(true);
      console.log('[MasterFader] Baseline state saved at 255:', baseline);
    }
  }, [isMasterFaderActive, baselineChannelValues, dmxChannels, isChannelIgnored, value]);

  // Restore baseline state when master fader returns to the value it was at when baseline was saved
  const restoreBaselineState = useCallback(() => {
    if (baselineChannelValues && value === masterFaderValueWhenActivated && masterFaderValueWhenActivated === 255) {
      // Restore exact baseline values
      const restoreUpdates: Record<number, number> = {};
      
      // Restore all baseline values
      Object.keys(baselineChannelValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        if (!isChannelIgnored(channelNum)) {
          restoreUpdates[channelNum] = baselineChannelValues[channelNum];
        } else {
          restoreUpdates[channelNum] = dmxChannels[channelNum]; // Keep ignored channels as-is
        }
      });
      
      // Ensure all other channels are handled
      for (let i = 0; i < 512; i++) {
        if (restoreUpdates[i] === undefined) {
          if (isChannelIgnored(i)) {
            restoreUpdates[i] = dmxChannels[i];
          } else {
            restoreUpdates[i] = baselineChannelValues[i] || 0;
          }
        }
      }
      
      if (Object.keys(restoreUpdates).length > 0) {
        setMultipleDmxChannels(restoreUpdates);
        console.log('[MasterFader] Baseline state restored:', restoreUpdates);
      }
      
      // Reset baseline system
      setBaselineChannelValues(null);
      setIsMasterFaderActive(false);
    }
  }, [baselineChannelValues, value, dmxChannels, isChannelIgnored, setMultipleDmxChannels, masterFaderValueWhenActivated]);

  const handleValueChange = useCallback((newValue: number) => {
    const previousValue = value;
    setValue(newValue);
    onValueChange?.(newValue);

    const dmxUpdates: Record<number, number> = {};

    // If master fader is at 255 and we have a baseline, restore it
    if (newValue === 255 && baselineChannelValues && masterFaderValueWhenActivated === 255) {
      restoreBaselineState();
      // Continue to send OSC update
      if (socket && oscAddress) {
        socket.emit('osc-send', {
          address: oscAddress,
          args: [{ type: 'f', value: newValue / 255 }]
        });
      }
      return; // Early return after restoration
    }

    // If we have a baseline, always scale from it (not from current values)
    // This ensures consistent behavior when moving slider up and down
    if (baselineChannelValues && isMasterFaderActive) {
      const scaleFactor = newValue / 255; // Scale factor based on master fader position
      
      // Scale all channels from baseline
      for (let i = 0; i < 512; i++) {
        if (isChannelIgnored(i)) {
          dmxUpdates[i] = dmxChannels[i]; // Keep ignored channels as-is
        } else {
          const baselineValue = baselineChannelValues[i] || 0;
          const scaledValue = Math.round(baselineValue * scaleFactor);
          dmxUpdates[i] = Math.min(255, Math.max(0, scaledValue));
        }
      }
    } else {
      // Legacy behavior when no baseline is saved (for backward compatibility)
      if (newValue === 0 && previousValue > 0) { // Fading to black
        const currentValuesToSaveNormalized: { [key: number]: number } = {};
        Object.keys(dmxChannels).forEach(channelKey => {
          const channelNum = parseInt(channelKey);
          if (isChannelIgnored(channelNum)) {
            dmxUpdates[channelNum] = dmxChannels[channelNum];
            return;
          }
          const currentDmxValue = dmxChannels[channelNum];

          if (currentDmxValue > 0) {
            let normalizedValue = currentDmxValue;
            if (previousValue > 0 && previousValue < 255) {
              normalizedValue = (currentDmxValue / previousValue) * 255;
            }
            currentValuesToSaveNormalized[channelNum] = Math.min(255, Math.max(0, Math.round(normalizedValue)));
            dmxUpdates[channelNum] = 0;
          } else {
            dmxUpdates[channelNum] = 0;
          }
        });
        setPreviousChannelValues(currentValuesToSaveNormalized);
      } else if (newValue > 0 && previousValue === 0) { // Fading up from black
        Object.keys(previousChannelValues).forEach(channelKey => {
          const channelNum = parseInt(channelKey);
          if (isChannelIgnored(channelNum)) {
            dmxUpdates[channelNum] = dmxChannels[channelNum];
            return;
          }
          const normalizedOriginalValue = previousChannelValues[channelNum];
          const proportionalValue = Math.round((normalizedOriginalValue * newValue) / 255);
          dmxUpdates[channelNum] = proportionalValue;
        });
        for (let i = 0; i < 512; i++) {
          if (isChannelIgnored(i) && dmxUpdates[i] === undefined) {
            dmxUpdates[i] = dmxChannels[i];
          } else if (dmxUpdates[i] === undefined && dmxChannels[i] === 0) {
            dmxUpdates[i] = 0;
          }
        }
      } else if (newValue > 0 && previousValue > 0) { // Adjusting level
        if (previousValue !== 0) {
          const adjustmentFactor = newValue / previousValue;
          Object.keys(dmxChannels).forEach(key => {
            const num = parseInt(key);
            if (isChannelIgnored(num)) {
              dmxUpdates[num] = dmxChannels[num];
              return;
            }
            const currentVal = dmxChannels[num];
            if (currentVal > 0) {
              const adjustedValue = Math.round(currentVal * adjustmentFactor);
              dmxUpdates[num] = Math.min(255, Math.max(0, adjustedValue));
            } else {
              dmxUpdates[num] = 0;
            }
          });
        }
      } else if (newValue === 0 && previousValue === 0) {
        Object.keys(dmxChannels).forEach(key => {
          const num = parseInt(key);
          if (isChannelIgnored(num)) {
            dmxUpdates[num] = dmxChannels[num];
          } else {
            dmxUpdates[num] = 0;
          }
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
  }, [value, dmxChannels, setMultipleDmxChannels, onValueChange, previousChannelValues, setPreviousChannelValues, setValue, socket, oscAddress, baselineChannelValues, isMasterFaderActive, restoreBaselineState, isChannelIgnored]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    // Save baseline on first interaction
    saveBaselineState();
    handleValueChange(newValue);
  };

  const handleSliderMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    // Save baseline when user starts interacting with slider
    saveBaselineState();
  };

  const handleSliderMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    // Check if we should restore baseline (when returning to 255)
    const currentValue = parseInt((e.target as HTMLInputElement).value);
    if (currentValue === 255 && baselineChannelValues) {
      restoreBaselineState();
    }
  };

  // Removed handleSliderMouseDown as it's not needed and might have interfered.
  // const handleSliderMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
  //   e.stopPropagation();
  // };

  const handleSliderInput = (e: React.FormEvent<HTMLInputElement>) => {
    // Handle real-time input changes for better responsiveness
    const target = e.target as HTMLInputElement;
    const newValue = parseInt(target.value);
    // Save baseline on first interaction
    saveBaselineState();
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

  const setAllToZero = () => {
    // Set all channels to 0 without remembering previous values
    // This is different from blackout which saves values for restoration
    // NOTE: We do NOT change the master fader value - it stays where it is
    const dmxUpdates: Record<number, number> = {};
    
    // Set all channels to 0, respecting ignored channels
    for (let i = 0; i < 512; i++) {
      if (isChannelIgnored(i)) {
        dmxUpdates[i] = dmxChannels[i]; // Keep current value for ignored channels
      } else {
        dmxUpdates[i] = 0; // Set to 0 for all non-ignored channels
      }
    }
    
    // Update store immediately - this will update all UI components including DMX Panel sliders
    if (Object.keys(dmxUpdates).length > 0) {
      setMultipleDmxChannels(dmxUpdates, true);
    }
    
    // Send OSC messages with value 0 to all OSC assignments
    if (socket && oscAssignments) {
      oscAssignments.forEach((oscAddress, channelIndex) => {
        if (oscAddress && oscAddress.trim() !== '') {
          // Only send if this channel is being set to 0 (not ignored)
          if (!isChannelIgnored(channelIndex)) {
            try {
              socket.emit('sendOsc', {
                address: oscAddress,
                args: [{ type: 'f', value: 0.0 }] // Normalized 0.0 value
              });
            } catch (error) {
              console.error(`[MasterFader] Failed to send OSC 0 to ${oscAddress}:`, error);
            }
          }
        }
      });
    }
    
    // DO NOT change master fader value - keep it where it is
    // setValue(0); // REMOVED - user requested to keep master slider value
    
    // Clear any saved values since we're doing a hard reset
    setPreviousChannelValues({});
    setFullOnSavedValues({});
    // Also clear baseline system since we're zeroing everything
    setBaselineChannelValues(null);
    setIsMasterFaderActive(false);
  };

  const toggleFullOn = () => {
    const dmxUpdates: Record<number, number> = {};
    if (isFullOn) { // Turning OFF (was ON)
      setIsFullOn(false);
      Object.keys(fullOnSavedValues).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        if (isChannelIgnored(channelNum)) {
          dmxUpdates[channelNum] = dmxChannels[channelNum]; // Keep live value
          return;
        }
        dmxUpdates[channelNum] = fullOnSavedValues[channelNum];
      });
      // setValue(255); // Keep master fader UI at full as per original comment
    } else { // Turning ON
      setIsFullOn(true);
      const currentValues: { [key: number]: number } = {};
      Object.keys(dmxChannels).forEach(channelKey => {
        const channelNum = parseInt(channelKey);
        currentValues[channelNum] = dmxChannels[channelNum]; // Save current state for restore
        if (isChannelIgnored(channelNum)) {
          dmxUpdates[channelNum] = dmxChannels[channelNum]; // Keep live value
          return;
        }
        dmxUpdates[channelNum] = 255;
      });
      setFullOnSavedValues(currentValues);
      // setValue(255); // Set master fader UI to full
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
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    if (onMinimizedChange) {
      onMinimizedChange(newMinimized);
    }
  };

  // Sync external minimize state
  useEffect(() => {
    setIsMinimized(externalIsMinimized);
  }, [externalIsMinimized]);

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
  };  // Render the core content
  const masterFaderContent = (
    <div className={`${styles.masterFaderContent} ${isMinimized ? styles.minimized : ''} ${compact ? styles.compact : ''}`}>
      <Sparkles /> {/* Add Sparkles component here */}
        {/* Essential Action buttons - Always visible */}
      <div className={styles.headerActions}>
        <button 
          className={`${styles.fullOnButton} ${isFullOn ? styles.active : ''}`}
          onClick={toggleFullOn}
          title="Toggle Full On (All channels to 255)"
        >
          <i className="fas fa-lightbulb"></i>
          {!isMinimized && !compact && "FULL ON"}
          {compact && "FULL"}
        </button>
        <button 
          className={`${styles.blackoutButton} ${value === 0 ? styles.active : ''}`}
          onClick={blackoutAll}
          title="Blackout All Channels (remembers values for restoration)"
        >
          <i className="fas fa-power-off"></i>
          {!isMinimized && !compact && "Blackout"}
          {compact && "BLACK"}
        </button>
        <button 
          className={`${styles.setToZeroButton} ${value === 0 ? styles.active : ''}`}
          onClick={setAllToZero}
          title="Set All Channels to 0 (hard reset, no restoration)"
        >
          <i className="fas fa-ban"></i>
          {!isMinimized && !compact && "SET TO 0"}
          {compact && "ZERO"}
        </button>
        <button
          className={`${styles.slowFadeoutButton} ${isFading && value > 0 ? styles.active : ''}`}
          onClick={handleSlowFadeout}
          disabled={isFading || value === 0}
          title="Slowly fade out to 0"
        >
          <i className="fas fa-arrow-down"></i>
          {!isMinimized && !compact && "Fade Out"}
          {compact && "OUT"}
        </button>
        <button
          className={`${styles.fadeBackupButton} ${isFading && value < (valueBeforeFadeout > 0 ? valueBeforeFadeout : 255) ? styles.active : ''}`}
          onClick={handleFadeBackup}
          disabled={isFading || value === (valueBeforeFadeout > 0 ? valueBeforeFadeout : 255)}
          title="Fade back up to previous or full"
        >
          <i className="fas fa-arrow-up"></i>
          {!isMinimized && !compact && "Fade In"}
          {compact && "IN"}
        </button>
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
              className={styles.verticalSlider}
            />
            <div className={styles.valueDisplay}>
              {Math.round((value / 255) * 100)}%
            </div>
          </div>

          {/* Hide detailed controls in compact mode */}
          {!compact && (
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
                      title="Clear MIDI mapping (Forget)"
                    >
                      <i className="fas fa-times"></i>
                      {!isMinimized && !compact && " Forget"}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.channelInfo}>
                <span>Active Channels: {Object.values(dmxChannels).filter(v => v > 0).length}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );  if (isDockable) {
    return (
      <DockableComponent
        id="master-fader"
        title={compact ? "Master" : "Master Fader"}
        component="master-fader"
        defaultPosition={{ zone: 'bottom-center' }}
        defaultZIndex={1100}
        isMinimized={isMinimized}
        onMinimizedChange={toggleMinimize}
        width={isMinimized ? "min(600px, calc(100vw - 40px))" : compact ? "min(500px, calc(100vw - 40px))" : "min(800px, calc(100vw - 40px))"}
        height={isMinimized ? "auto" : compact ? "120px" : "400px"}
        className={`${styles.masterFader} ${compact ? styles.compact : ''}`}
        isDraggable={false}
      >
        {masterFaderContent}
      </DockableComponent>
    );
  }

  // Non-dockable fallback
  return (
    <div className={`${styles.masterFader} ${isMinimized ? styles.minimized : ''} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={`${styles.header}`}>
          <h3>{compact ? "Master" : "Master Fader"}</h3>
          <div className={styles.windowControls}>
            <button onClick={toggleMinimize} className={styles.minimizeButton}>
              {isMinimized ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
            </button>
          </div>
        </div>
      )}
      {masterFaderContent}
    </div>
  );
};
