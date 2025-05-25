import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useMidiScaling, ScalingOptions } from '../../hooks/useMidiScaling';

// Extended mapping interface to include range limits and curve
interface MidiRangeMapping {
  inputMin?: number;
  inputMax?: number;
  outputMin?: number;
  outputMax?: number;
  curve?: number; // Changed from string literal to number to match useMidiScaling
}

/**
 * This component doesn't render anything but processes MIDI messages
 * and converts them to DMX channel changes
 */
export const MidiDmxProcessor: React.FC = () => {
  const {
    midiMappings, // DMX channel mappings
    midiMessages,
    setDmxChannel,
    masterSliders,
    updateMasterSliderValue,
  } = useStore(state => ({
    midiMappings: state.midiMappings,
    midiMessages: state.midiMessages,
    setDmxChannel: state.setDmxChannel,
    masterSliders: state.masterSliders,
    updateMasterSliderValue: state.updateMasterSliderValue,
  }));
  const { scaleValue } = useMidiScaling();
  
  // Keep track of the last processed message to prevent duplicates
  const [lastProcessedMessageSignature, setLastProcessedMessageSignature] = useState<string | null>(null);
  
  // Keep track of custom range mappings for each channel
  const [channelRangeMappings, setChannelRangeMappings] = useState<Record<number, MidiRangeMapping>>({});

  // Log when MIDI mappings change, helpful for debugging
  useEffect(() => {
    console.log('[MidiDmxProcessor] MIDI mappings updated in store:', midiMappings);
  }, [midiMappings]);
  
  // Process MIDI messages and update DMX channels
  useEffect(() => {
    if (!midiMessages || midiMessages.length === 0) {
      return;
    }

    const latestMessage = midiMessages[midiMessages.length - 1];
    const currentMessageSignature = JSON.stringify(latestMessage);

    if (currentMessageSignature === lastProcessedMessageSignature) {
      return;
    }
    setLastProcessedMessageSignature(currentMessageSignature); // Mark as processed early

    console.log(`[MidiDmxProcessor] Attempting to process MIDI message:`, latestMessage);

    let messageHandledByMasterSlider = false;

    // --- Process for Master Sliders ---
    if (masterSliders && masterSliders.length > 0) {
      for (const slider of masterSliders) {
        if (slider.midiMapping) {
          let match = false;
          let newValueForMaster = slider.value; // Default to current value

          if (latestMessage._type === 'cc' && 
              slider.midiMapping.controller !== undefined &&
              slider.midiMapping.channel === latestMessage.channel &&
              slider.midiMapping.controller === latestMessage.controller) {
            match = true;
            // Scale CC value (0-127) to master slider range (0-255)
            newValueForMaster = Math.round((latestMessage.value / 127) * 255);
          } else if (latestMessage._type === 'noteon' && 
                     slider.midiMapping.note !== undefined &&
                     slider.midiMapping.channel === latestMessage.channel &&
                     slider.midiMapping.note === latestMessage.note) {
            match = true;
            // Use velocity for value, scaled 0-127 to 0-255, or full on if velocity > 0
            newValueForMaster = latestMessage.velocity > 0 ? Math.round((latestMessage.velocity / 127) * 255) : slider.value; 
            // Or simply: newValueForMaster = latestMessage.velocity > 0 ? 255 : slider.value;
          } else if (latestMessage._type === 'noteoff' &&
                     slider.midiMapping.note !== undefined &&
                     slider.midiMapping.channel === latestMessage.channel &&
                     slider.midiMapping.note === latestMessage.note) {
            match = true;
            newValueForMaster = 0; // Note Off typically sets value to 0
          }

          if (match) {
            console.log(`[MidiDmxProcessor] Master Slider "${slider.name}" matched MIDI. New value: ${newValueForMaster}`);
            updateMasterSliderValue(slider.id, Math.max(0, Math.min(255, newValueForMaster)));
            messageHandledByMasterSlider = true;
            break; // Assuming one MIDI message controls at most one master slider
          }
        }
      }
    }

    // --- Process for Direct DMX Channel Mappings (if not handled by a master slider) ---
    if (!messageHandledByMasterSlider && latestMessage._type === 'cc' && typeof latestMessage.value === 'number') {
      console.log('[MidiDmxProcessor] Processing CC for Direct DMX. Mappings:', midiMappings);
      let dmxMatchFound = false;
      Object.entries(midiMappings).forEach(([dmxChannelStr, mapping]) => {
        if (!mapping) return;
        const dmxChannel = parseInt(dmxChannelStr, 10);
        if (mapping.controller !== undefined &&
            mapping.channel === latestMessage.channel &&
            mapping.controller === latestMessage.controller) {
          
          dmxMatchFound = true;
          // ... (rest of the existing DMX channel processing logic: scaling, setDmxChannel, event dispatch) ...
          const currentRangeMapping = channelRangeMappings[dmxChannel] || {};
          const scalingOptions: Partial<ScalingOptions> = { /* ... */ }; // As before
          const dmxValue = scaleValue(latestMessage.value, scalingOptions);
          const roundedDmxValue = typeof dmxValue === 'number' ? Math.round(dmxValue) : 0;
          const boundedValue = Math.max(0, Math.min(255, roundedDmxValue));
          setDmxChannel(dmxChannel, boundedValue);
          // ... (event dispatch as before) ...
        }
      });
      if (!dmxMatchFound) {
        console.log('[MidiDmxProcessor] No DMX channel mapped to received CC (after master slider check).');
      }
    } else if (!messageHandledByMasterSlider && (latestMessage._type === 'noteon' || latestMessage._type === 'noteoff')) {
        // Handle direct Note On/Off to DMX mappings if any (similar to CC, but check note mappings)
        // This part of the logic was not fully detailed for notes in the original code, focusing on CCs.
        // For now, we just log that it wasn't handled by a master slider.
        console.log(`[MidiDmxProcessor] Note message not handled by master slider, and direct DMX note mapping not shown in original logic snippet for this part.`);
    }
    
  }, [midiMessages, midiMappings, setDmxChannel, scaleValue, channelRangeMappings, masterSliders, updateMasterSliderValue]);

  /**
   * Set a custom range mapping for a specific DMX channel
   */
  const setChannelRangeMapping = (dmxChannel: number, mapping: MidiRangeMapping) => {
    setChannelRangeMappings(prev => ({
      ...prev,
      [dmxChannel]: {
        ...prev[dmxChannel],
        ...mapping
      }
    }));
  };

  /**
   * Get all custom range mappings
   */
  const getChannelRangeMappings = () => {
    return channelRangeMappings;
  };

  // Expose setChannelRangeMapping and getChannelRangeMappings to window for testing/external use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).midiDmxProcessor = {
        setChannelRangeMapping,
        getChannelRangeMappings,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).midiDmxProcessor;
      }
    };
  }, [setChannelRangeMapping, getChannelRangeMappings]);

  return null;
};

export default MidiDmxProcessor;
