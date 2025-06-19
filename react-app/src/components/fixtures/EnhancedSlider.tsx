import React, { useState } from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './SuperControl.module.scss';

interface EnhancedSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;  midiMapping?: {
    channel?: number;
    note?: number;
    cc?: number;
    minValue?: number;
    maxValue?: number;
  };
  oscAddress?: string;
  onMidiLearn?: () => void;
  onMidiForget?: () => void;
  onOscAddressChange?: (address: string) => void;
  isMidiLearning?: boolean;  disabled?: boolean;
  icon?: string;
}

export const EnhancedSlider: React.FC<EnhancedSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 255,
  step = 1,
  midiMapping,
  oscAddress = '',
  onMidiLearn,
  onMidiForget,
  onOscAddressChange,
  isMidiLearning = false,
  disabled = false,
  icon
}) => {
  const [localOscAddress, setLocalOscAddress] = useState(oscAddress);

  const handleOscAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setLocalOscAddress(newAddress);
    onOscAddressChange?.(newAddress);
  };

  const getMidiStatusText = () => {
    if (!midiMapping) return 'No MIDI';
    if (midiMapping.cc !== undefined) {
      return `CH${midiMapping.channel} CC${midiMapping.cc}`;
    }
    if (midiMapping.note !== undefined) {
      return `CH${midiMapping.channel} Note${midiMapping.note}`;
    }
    return 'MIDI Set';
  };

  return (
    <div className={styles.enhancedSliderGroup}>
      <div className={styles.sliderMainRow}>        <div className={styles.sliderLabel}>
          {icon && <LucideIcon name={icon as any} />}
          {label}
        </div>
        
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
          />
        </div>
        
        <div className={styles.valueDisplay}>
          {value}
        </div>
      </div>
      
      <div className={styles.sliderSecondaryRow}>
        <button
          className={`${styles.midiLearnBtn} ${isMidiLearning ? styles.learning : ''} ${midiMapping ? styles.learned : ''}`}
          onClick={midiMapping ? onMidiForget : onMidiLearn}
          title={midiMapping ? 'Click to forget MIDI mapping' : 'Click to learn MIDI mapping'}
        >
          <LucideIcon name={isMidiLearning ? "Radio" : midiMapping ? "Unlink" : "Link"} />
          {isMidiLearning ? 'Learning...' : midiMapping ? 'Forget MIDI' : 'MIDI Learn'}
        </button>
        
        <div className={styles.midiStatus}>
          {getMidiStatusText()}
        </div>
        
        <input
          type="text"
          className={styles.oscAddressInput}
          placeholder="/osc/address"
          value={localOscAddress}
          onChange={handleOscAddressChange}
          title="OSC Address for this control"
        />
      </div>
    </div>
  );
};

export default EnhancedSlider;
