import React from 'react'
import { useMidiLearn } from '../../hooks/useMidiLearn'
import { useStore } from '../../store'
import useStoreUtils from '../../store/storeUtils'
import styles from './MidiLearnButton.module.scss'

interface MidiLearnButtonProps {
  channelIndex: number
  className?: string
}

export const MidiLearnButton: React.FC<MidiLearnButtonProps> = ({ channelIndex, className }) => {
  const { isLearning, learnStatus, currentLearningChannel, startLearn, cancelLearn } = useMidiLearn()
  const midiMappings = useStore(state => state.midiMappings)
  const midiMessages = useStore(state => state.midiMessages)
  
  // Check if this channel has a mapping
  const hasMapping = !!midiMappings[channelIndex]
  const mapping = midiMappings[channelIndex]
  
  // Check if this channel is in learn mode
  const isChannelLearning = isLearning && currentLearningChannel === channelIndex

  // Debug log for current state
  React.useEffect(() => {
    if (isChannelLearning) {
      console.log(`Channel ${channelIndex} is in learn mode. Status: ${learnStatus}`)
      console.log('Available MIDI messages:', midiMessages.length)
    }
  }, [isChannelLearning, learnStatus, channelIndex, midiMessages.length])
  
  // Handle learn button click
  const handleClick = () => {
    console.log(`MIDI Learn button clicked for channel ${channelIndex}`);
    console.log(`Current learning state: ${isChannelLearning ? 'Learning' : 'Not learning'}`);
    
    if (isChannelLearning) {
      // If already learning, cancel
      console.log(`Cancelling MIDI learn for channel ${channelIndex}`);
      cancelLearn()
    } else {
      // Start learning
      console.log(`Starting MIDI learn for channel ${channelIndex}`);
      startLearn(channelIndex)
    }
  }
  
  // Get the button text based on current state
  const getButtonText = () => {
    if (isChannelLearning) {
      return 'Cancel'
    }
    
    if (hasMapping) {
      if (mapping?.controller !== undefined) {
        return `CC ${mapping.channel}:${mapping.controller}`
      } else if (mapping?.note !== undefined) {
        return `Note ${mapping.channel}:${mapping.note}`
      }
      return 'MIDI Mapped'
    }
    
    return 'MIDI Learn'
  }
  
  // Get button class based on current state
  const getButtonClass = () => {
    if (isChannelLearning) {
      if (learnStatus === 'learning') {
        return styles.learning
      } else if (learnStatus === 'success') {
        return styles.success
      } else if (learnStatus === 'timeout') {
        return styles.error
      }
    }
    
    if (hasMapping) {
      return styles.mapped
    }
    
    return styles.default
  }
  
  return (
    <button
      className={`${styles.learnButton} ${getButtonClass()} ${className || ''}`}
      onClick={handleClick}
      title={hasMapping ? 'Click to remap or right-click to remove' : 'Click to assign MIDI control'}
      onContextMenu={(e) => {
        e.preventDefault()
        if (hasMapping) {
          // Remove mapping on right-click
          useStoreUtils.getState().removeMidiMapping(channelIndex)
        }
      }}
    >
      {isChannelLearning && learnStatus === 'learning' && (
        <div className={styles.pulsingDot} />
      )}
      <span>{getButtonText()}</span>
    </button>
  )
}