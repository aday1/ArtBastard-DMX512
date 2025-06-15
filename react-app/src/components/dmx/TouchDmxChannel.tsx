import React, { useState, useEffect } from 'react';
import { useStore } from '../../store'; // Assuming useStore is needed for channel names or other global state if any

export interface TouchDmxChannelProps {
  index: number;
  value: number;
  onValueChange: (index: number, value: number) => void;
  isSelected: boolean;
  onToggleSelection: (index: number) => void;
  name?: string;
}

export const TouchDmxChannel: React.FC<TouchDmxChannelProps> = ({
  index,
  value,
  onValueChange,
  isSelected,
  onToggleSelection,
  name
}) => {
  const [localValue, setLocalValue] = useState(value);
  // const [isDragging, setIsDragging] = useState(false); // isDragging is not used, can be removed

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onValueChange(index, newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(255, localValue + 1);
    setLocalValue(newValue);
    onValueChange(index, newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, localValue - 1);
    setLocalValue(newValue);
    onValueChange(index, newValue);
  };

  const handleBigIncrement = () => {
    const newValue = Math.min(255, localValue + 10);
    setLocalValue(newValue);
    onValueChange(index, newValue);
  };

  const handleBigDecrement = () => {
    const newValue = Math.max(0, localValue - 10);
    setLocalValue(newValue);
    onValueChange(index, newValue);
  };

  const channelName = name || `Ch ${index + 1}`;
  const intensity = (localValue / 255) * 100;
  return (
    <div
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(78, 205, 196, 0.4))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))',
        border: `2px solid ${isSelected ? 'rgba(78, 205, 196, 0.7)' : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        minHeight: '220px', // Reduced from 280px for better scrolling
        minWidth: '160px', // Reduced from 180px for better fit
        position: 'relative',
        transition: 'all 0.2s ease',
        touchAction: 'manipulation',
        color: '#ffffff' // Ensure text is visible on dark backgrounds
      }}
    >      {/* Channel Header */}
      <div
        onClick={() => onToggleSelection(index)}
        style={{
          width: '100%',
          textAlign: 'center',
          cursor: 'pointer',
          padding: '0.4rem',
          borderRadius: '6px',
          background: isSelected ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          touchAction: 'manipulation'
        }}
      >
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '600',
          color: isSelected ? '#4ecdc4' : '#ffffff',
          marginBottom: '0.2rem'
        }}>
          {channelName}
        </div>
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          color: localValue > 0 ? '#4ecdc4' : 'rgba(255, 255, 255, 0.6)'
        }}>
          {localValue}
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          {intensity.toFixed(1)}%
        </div>
      </div>

      {/* Fine Control Buttons (+10 / -10) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        width: '100%'
      }}>
        <button
          onMouseDown={handleBigDecrement}
          onTouchStart={handleBigDecrement}
          style={{
            background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.3), rgba(231, 76, 60, 0.5))',
            border: '2px solid rgba(231, 76, 60, 0.6)',
            color: '#e74c3c',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '700',
            minHeight: '50px',
            touchAction: 'manipulation',
            transition: 'all 0.1s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          -10
        </button>
        <button
          onMouseDown={handleBigIncrement}
          onTouchStart={handleBigIncrement}
          style={{
            background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.3), rgba(46, 213, 115, 0.5))',
            border: '2px solid rgba(46, 213, 115, 0.6)',
            color: '#2ed573',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '700',
            minHeight: '50px',
            touchAction: 'manipulation',
            transition: 'all 0.1s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          +10
        </button>
      </div>

      {/* Main Slider */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Center the slider vertically if flex:1
        gap: '0.5rem'
      }}>        <input
          type="range"
          min="0"
          max="255"
          value={localValue}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '60px',
            background: `linear-gradient(to right, rgba(78, 205, 196, 0.3) 0%, rgba(78, 205, 196, 0.3) ${(localValue / 255) * 100}%, rgba(255, 255, 255, 0.2) ${(localValue / 255) * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
            outline: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitAppearance: 'none',
            appearance: 'none',
            borderRadius: '30px',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
          className="touch-dmx-slider"
        />
      </div>

      {/* Precise Control Buttons (+1 / -1) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        width: '100%'
      }}>
        <button
          onMouseDown={handleDecrement}
          onTouchStart={handleDecrement}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 193, 7, 0.5))',
            border: '2px solid rgba(255, 193, 7, 0.6)',
            color: '#ffc107',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '700',
            minHeight: '50px',
            touchAction: 'manipulation',
            transition: 'all 0.1s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          -1
        </button>
        <button
          onMouseDown={handleIncrement}
          onTouchStart={handleIncrement}
          style={{
            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.5))',
            border: '2px solid rgba(78, 205, 196, 0.6)',
            color: '#4ecdc4',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '700',
            minHeight: '50px',
            touchAction: 'manipulation',
            transition: 'all 0.1s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          +1
        </button>
      </div>
    </div>
  );
};

// Basic CSS for .touch-dmx-slider (can be moved to a global CSS file or <style> tag in ExternalWindow)
// This is a minimal example; more specific styling might be needed.
/*
.touch-dmx-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 30px;
  height: 60px;
  background: #4ecdc4;
  cursor: pointer;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.5);
}

.touch-dmx-slider::-moz-range-thumb {
  width: 30px;
  height: 56px; // Firefox might need slightly different height due to border
  background: #4ecdc4;
  cursor: pointer;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.5);
}

.touch-dmx-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 20px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.3);
}

.touch-dmx-slider::-moz-range-track {
 width: 100%;
  height: 20px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.3);
}
*/
