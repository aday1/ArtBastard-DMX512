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
  const [isDetached, setIsDetached] = useState(false);
  const [detachedPosition, setDetachedPosition] = useState({ x: 100, y: 100 });
  const [detachedSize, setDetachedSize] = useState({ width: 400, height: 600 });
  const [localOscAddress, setLocalOscAddress] = useState('');
  const [activityIndicator, setActivityIndicator] = useState(false);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showMidiRangeControls, setShowMidiRangeControls] = useState(false);
  const [midiRangeMapping, setMidiRangeMapping] = useState<ExtendedMidiRangeMapping>({
    inputMin: 0,
    inputMax: 127,
    outputMin: 0,
    outputMax: 255,
    curve: 1
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

  const handleMidiRangeChange = (field: keyof ExtendedMidiRangeMapping, value: number) => {
    setMidiRangeMapping(prev => {
      const newMapping = { ...prev, [field]: value };
      
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
    setIsFullscreen(!isFullscreen);
    setShowDetails(true);
  };

  const toggleDetached = () => {
    setIsDetached(!isDetached);
    setShowDetails(true);
  };

  return (
    <div
      className={`${styles.channel} ${isSelected ? styles.selected : ''} ${showDetails ? styles.expanded : ''}`}
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
      </div>

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
          )}

          <MidiLearnButton channelIndex={index} />

          <div className={styles.valueDisplay}>
            <div className={styles.valueHex}>
              HEX: {value.toString(16).padStart(2, '0').toUpperCase()}
            </div>
            <div className={styles.valuePercent}>
              {Math.round((value / 255) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};