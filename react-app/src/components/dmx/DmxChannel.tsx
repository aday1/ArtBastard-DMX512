import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { MidiLearnButton } from '../midi/MidiLearnButton';
import styles from './DmxChannel.module.scss';

interface DmxChannelProps {
  index: number;
  key?: number | string;
  allowFullscreen?: boolean;
  allowDetach?: boolean;
}

interface ExtendedMidiRangeMapping extends MidiRangeMapping {
  curve?: number;
  inverted?: boolean;
}

export const DmxChannel: React.FC<DmxChannelProps> = ({ index, allowFullscreen = true, allowDetach = true }) => {
  const {
    dmxChannels,
    channelNames,
    selectedChannels,
    toggleChannelSelection,
    setDmxChannel,
    oscAssignments,
    setOscAssignment,
    oscActivity,
  } = useStore(state => ({
    dmxChannels: state.dmxChannels,
    channelNames: state.channelNames,
    selectedChannels: state.selectedChannels,
    toggleChannelSelection: state.toggleChannelSelection,
    setDmxChannel: state.setDmxChannel,
    oscAssignments: state.oscAssignments,
    setOscAssignment: state.setOscAssignment,
    oscActivity: state.oscActivity,
  }));
  const [showDetails, setShowDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [detachedPosition, setDetachedPosition] = useState({ x: 100, y: 100 });
  const [detachedSize, setDetachedSize] = useState({ width: 400, height: 600 });
  const [localOscAddress, setLocalOscAddress] = useState('');
  const [activityIndicator, setActivityIndicator] = useState(false);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<HTMLDivElement>(null);

  const [showMidiRangeControls, setShowMidiRangeControls] = useState(false);  const [midiRangeMapping, setMidiRangeMapping] = useState<ExtendedMidiRangeMapping>({
    inputMin: 0,
    inputMax: 127,
    outputMin: 0,
    outputMax: 255,
    curve: 1,
    inverted: false
  });

  useEffect(() => {
    if (oscAssignments && oscAssignments[index]) {
      setLocalOscAddress(oscAssignments[index]);
    }
  }, [oscAssignments, index]);

  useEffect(() => {
    const currentActivity = oscActivity[index];
    if (currentActivity && currentActivity.value > 0) {
      setActivityIndicator(true);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      activityTimeoutRef.current = setTimeout(() => {
        setActivityIndicator(false);
      }, 300);
    }
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [oscActivity, index]);

  const applyMidiRangeSettings = () => {
    if (window.midiDmxProcessor && typeof window.midiDmxProcessor.setChannelRangeMapping === 'function') {
      window.midiDmxProcessor.setChannelRangeMapping(index, midiRangeMapping);
    }
  };
  const handleMidiRangeChange = (field: keyof ExtendedMidiRangeMapping, value: number | boolean) => {
    setMidiRangeMapping(prev => {
      const newMapping = { ...prev, [field]: value };
      
      // Only apply validation for numeric fields
      if (typeof value === 'number') {
        if (field === 'inputMin' && value > prev.inputMax!) {
          newMapping.inputMin = prev.inputMax;
        }
        if (field === 'inputMax' && value < prev.inputMin!) {
          newMapping.inputMax = prev.inputMin;
        }
        if (field === 'outputMin' && value > prev.outputMax!) {
          newMapping.outputMin = prev.outputMax;
        }
        if (field === 'outputMax' && value < prev.outputMin!) {
          newMapping.outputMax = prev.outputMin;
        }
      }
      
      return newMapping;
    });
  };

  useEffect(() => {
    applyMidiRangeSettings();
  }, [midiRangeMapping, index]);

  useEffect(() => {
    if (window.midiDmxProcessor && typeof window.midiDmxProcessor.getChannelRangeMappings === 'function') {
      const mappings = window.midiDmxProcessor.getChannelRangeMappings();
      if (mappings && mappings[index]) {
        setMidiRangeMapping(prev => ({
          ...prev,
          ...mappings[index]
        }));
      }
    }
  }, [index]);

  useEffect(() => {
    const handleDmxChannelUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{channel: number, value: number}>;
      if (customEvent.detail && customEvent.detail.channel === index) {
        setDmxChannel(index, customEvent.detail.value);
      }
    };
    
    window.addEventListener('dmxChannelUpdate', handleDmxChannelUpdate);
    
    return () => {
      window.removeEventListener('dmxChannelUpdate', handleDmxChannelUpdate);
    };
  }, [index, setDmxChannel]);

  const value = dmxChannels[index] || 0;
  const name = channelNames[index] || `CH ${index + 1}`;
  const isSelected = selectedChannels.includes(index);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setDmxChannel(index, newValue);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
      setDmxChannel(index, newValue);
    }
  };

  const handleOscAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOscAddress(e.target.value);
  };

  const handleOscAddressBlur = () => {
    if (setOscAssignment && oscAssignments[index] !== localOscAddress) {
      setOscAssignment(index, localOscAddress);
    }
  };

  const handleOscAddressKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (setOscAssignment && oscAssignments[index] !== localOscAddress) {
        setOscAssignment(index, localOscAddress);
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  const getBackgroundColor = () => {
    const hue = value === 0 ? 240 : 200;
    const lightness = 20 + (value / 255) * 50;
    return `hsl(${hue}, 80%, ${lightness}%)`;
  };

  const dmxAddress = index + 1;
  const currentOscValue = oscActivity[index]?.value;
  const lastOscTimestamp = oscActivity[index]?.timestamp;
  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    setShowDetails(true);
    
    // Handle document body classes for fullscreen mode
    if (newFullscreenState) {
      document.body.classList.add('dmx-channel-fullscreen-active');
    } else {
      document.body.classList.remove('dmx-channel-fullscreen-active');
    }
    
    // Scroll into view when maximizing
    if (newFullscreenState && channelRef.current) {
      setTimeout(() => {
        channelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };
  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Auto-show details when expanding
    if (newExpandedState) {
      setShowDetails(true);
    }
    
    // Scroll into view when expanding
    if (newExpandedState && channelRef.current) {
      setTimeout(() => {
        channelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };

  const toggleDetached = () => {
    setIsDetached(!isDetached);
    setShowDetails(true);
  };

  // Add ESC key handler to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return (    <div
      ref={channelRef}
      className={`${styles.channel} ${isSelected ? styles.selected : ''} ${showDetails ? styles.expanded : ''} ${isExpanded ? styles.maximized : ''} ${isFullscreen ? styles.fullscreen : ''}`}
      onClick={() => !isFullscreen && !isDetached && toggleChannelSelection(index)}
    >
      <div className={styles.header}>
        <div className={styles.address}>{dmxAddress}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.headerControls}>
          <button
            className={styles.detailsToggle}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            <i className={`fas fa-${showDetails ? 'chevron-up' : 'chevron-down'}`}></i>
          </button>
        </div>
      </div>      {isFullscreen ? (
        <>
          <div className={styles.fullscreenHeader}>
            <h2>DMX Channel {dmxAddress}</h2>
            <p>{name}</p>
          </div>
          
          <div 
            className={`${styles.value} ${styles.fullscreenValue}`} 
            style={{ backgroundColor: getBackgroundColor() }}
          >
            {value}
            <div className={styles.valuePercentOverlay}>
              {Math.round((value / 255) * 100)}%
            </div>
          </div>
          
          <div className={`${styles.slider} ${styles.fullscreenSlider}`} data-dmx-channel={index}>
            <input
              type="range"
              min="0"
              max="255"
              value={value}
              onChange={handleValueChange}
              onClick={(e) => e.stopPropagation()}
              data-slider-index={index}
            />
          </div>
        </>
      ) : (
        <>
          <div className={`${styles.value}`} style={{ backgroundColor: getBackgroundColor() }}>
            {value}
          </div>

          <div className={`${styles.slider}`} data-dmx-channel={index}>
            <input
              type="range"
              min="0"
              max="255"
              value={value}
              onChange={handleValueChange}
              onClick={(e) => e.stopPropagation()}
              data-slider-index={index}
            />
          </div>
        </>
      )}

      {showDetails && (
        <div className={styles.details} onClick={(e) => e.stopPropagation()}>
          <div className={styles.directInput}>
            <label htmlFor={`dmx-value-${index}`}>Value:</label>
            <input
              id={`dmx-value-${index}`}
              type="number"
              min="0"
              max="255"
              value={value}
              onChange={handleDirectInput}
            />
          </div>

          <div className={styles.oscAddressInput}>
            <label htmlFor={`osc-address-${index}`}>OSC Address:</label>
            <input
              id={`osc-address-${index}`}
              type="text"
              value={localOscAddress}
              onChange={handleOscAddressChange}
              onBlur={handleOscAddressBlur}
              onKeyPress={handleOscAddressKeyPress}
              placeholder="/dmx/channel/X"
              className={activityIndicator ? styles.oscActive : ''}
            />
          </div>

          {currentOscValue !== undefined && (
            <div className={styles.oscActivityDisplay}>
              Last OSC: {currentOscValue.toFixed(3)}
              {lastOscTimestamp && (
                <span className={styles.oscTimestamp}>
                  ({new Date(lastOscTimestamp).toLocaleTimeString()})
                </span>
              )}
            </div>
          )}          <MidiLearnButton channelIndex={index} />

          <div className={styles.midiRangeControls}>
            <button
              className={styles.rangeToggle}
              onClick={() => setShowMidiRangeControls(!showMidiRangeControls)}
            >
              {showMidiRangeControls ? 'Hide MIDI Range Controls' : 'Show MIDI Range Controls'}
            </button>
              {showMidiRangeControls && (
              <div className={styles.midiRangeForm}>
                <div className={styles.midiInvertRow}>
                  <label className={styles.midiInvertLabel}>
                    <input 
                      type="checkbox" 
                      checked={midiRangeMapping.inverted || false}
                      onChange={(e) => handleMidiRangeChange('inverted', e.target.checked)}
                      className={styles.midiInvertCheckbox}
                    />
                    <span>Invert MIDI Input</span>
                  </label>
                </div>
                
                <div className={styles.midiRangeSection}>
                  <h4 className={styles.midiSectionTitle}>MIDI Input Range (0-127)</h4>
                  <div className={styles.midiRangeRow}>
                    <div className={styles.midiRangeColumn}>
                      <label>Min:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="127" 
                        value={midiRangeMapping.inputMin}
                        onChange={(e) => handleMidiRangeChange('inputMin', parseInt(e.target.value))}
                      />
                    </div>
                    <div className={styles.midiRangeColumn}>
                      <label>Max:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="127" 
                        value={midiRangeMapping.inputMax}
                        onChange={(e) => handleMidiRangeChange('inputMax', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className={styles.midiRangeSliderRow}>
                    <div className={styles.midiDualSlider}>
                      <input 
                        type="range" 
                        min="0" 
                        max="127" 
                        value={midiRangeMapping.inputMin}
                        onChange={(e) => handleMidiRangeChange('inputMin', parseInt(e.target.value))}
                        className={styles.midiRangeSliderMin}
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="127" 
                        value={midiRangeMapping.inputMax}
                        onChange={(e) => handleMidiRangeChange('inputMax', parseInt(e.target.value))}
                        className={styles.midiRangeSliderMax}
                      />
                      <div className={styles.sliderLabels}>
                        <span>{midiRangeMapping.inputMin}</span>
                        <span>{midiRangeMapping.inputMax}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.midiRangeSection}>
                  <h4 className={styles.midiSectionTitle}>DMX Output Range (0-255)</h4>
                  <div className={styles.midiRangeRow}>
                    <div className={styles.midiRangeColumn}>
                      <label>Min:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="255" 
                        value={midiRangeMapping.outputMin}
                        onChange={(e) => handleMidiRangeChange('outputMin', parseInt(e.target.value))}
                      />
                    </div>
                    <div className={styles.midiRangeColumn}>
                      <label>Max:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="255" 
                        value={midiRangeMapping.outputMax}
                        onChange={(e) => handleMidiRangeChange('outputMax', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className={styles.midiRangeSliderRow}>
                    <div className={styles.midiDualSlider}>
                      <input 
                        type="range" 
                        min="0" 
                        max="255" 
                        value={midiRangeMapping.outputMin}
                        onChange={(e) => handleMidiRangeChange('outputMin', parseInt(e.target.value))}
                        className={styles.midiRangeSliderMin}
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="255" 
                        value={midiRangeMapping.outputMax}
                        onChange={(e) => handleMidiRangeChange('outputMax', parseInt(e.target.value))}
                        className={styles.midiRangeSliderMax}
                      />
                      <div className={styles.sliderLabels}>
                        <span>{midiRangeMapping.outputMin}</span>
                        <span>{midiRangeMapping.outputMax}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.midiRangeSection}>
                  <h4 className={styles.midiSectionTitle}>Response Curve</h4>
                  <div className={styles.midiRangeRow}>
                    <div className={styles.midiRangeColumn}>
                      <label>Curve:</label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.1" 
                        value={midiRangeMapping.curve}
                        onChange={(e) => handleMidiRangeChange('curve', parseFloat(e.target.value))}
                        className={styles.midiCurveSlider}
                      />
                      <span className={styles.curveValue}>{midiRangeMapping.curve?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  className={styles.applyMidiRangeButton}
                  onClick={applyMidiRangeSettings}
                >
                  Apply MIDI Settings
                </button>
              </div>
            )}
          </div>

          <div className={styles.valueDisplay}>
            <div className={styles.valueHex}>
              HEX: {value.toString(16).padStart(2, '0').toUpperCase()}
            </div>
            <div className={styles.valuePercent}>
              {Math.round((value / 255) * 100)}%
            </div>
          </div>            <div className={styles.detailButtons}>
            {!isFullscreen && (
              <button 
                className={styles.expandButton} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                title={isExpanded ? "Minimize Channel" : "Maximize Channel"}
              >
                <i className={`fas fa-${isExpanded ? 'compress-arrows-alt' : 'expand-arrows-alt'}`}></i>
                <span>{isExpanded ? "Minimize" : "Maximize"}</span>
              </button>
            )}
            
            {allowFullscreen && (
              <button 
                className={styles.fullscreenButton} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              >
                <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
              </button>
            )}
            
            {allowDetach && !isFullscreen && (
              <button 
                className={styles.detachButton} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDetached();
                }}
                title={isDetached ? "Dock Window" : "Detach Window"}
                disabled={isFullscreen}
              >
                <i className={`fas fa-${isDetached ? 'thumbtack' : 'external-link-alt'}`}></i>
                <span>{isDetached ? "Dock" : "Detach"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};