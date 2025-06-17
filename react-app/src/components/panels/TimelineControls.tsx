import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './TimelineControls.module.scss';

interface TimelineControlsProps {
  className?: string;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({ className }) => {
  const {
    timelineSequences,
    activeTimelineSequence,
    timelinePlayback,
    playTimelineSequence,
    stopTimelinePlayback,
    setTimelineLooping,
    setTimelinePingPong,
    setTimelineSpeed,
    setTimelineDirection,
    setTimelineMidiTrigger,
    clearTimelineMidiMappings,
    timelineMidiMappings
  } = useStore();

  // Local state
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('');
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [isBounceEnabled, setIsBounceEnabled] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isReverse, setIsReverse] = useState(false);
  const [midiLearnMode, setMidiLearnMode] = useState(false);
  const [midiLearnTarget, setMidiLearnTarget] = useState<string | null>(null);

  // Sync with store state
  useEffect(() => {
    setIsLoopEnabled(timelinePlayback.loop);
    setIsBounceEnabled(timelinePlayback.pingPong);
    setPlaybackSpeed(timelinePlayback.speed);
    setIsReverse(timelinePlayback.direction === 'reverse');
  }, [timelinePlayback]);

  // Set default selected sequence
  useEffect(() => {
    if (timelineSequences.length > 0 && !selectedSequenceId) {
      setSelectedSequenceId(timelineSequences[0].id);
    }
  }, [timelineSequences, selectedSequenceId]);

  const handlePlayPause = () => {
    if (timelinePlayback.active && timelinePlayback.sequenceId === selectedSequenceId) {
      stopTimelinePlayback();
    } else if (selectedSequenceId) {
      playTimelineSequence(selectedSequenceId, {
        loop: isLoopEnabled,
        speed: playbackSpeed,
        direction: isReverse ? 'reverse' : 'forward',
        pingPong: isBounceEnabled
      });
    }
  };

  const handleLoopToggle = () => {
    const newLoopState = !isLoopEnabled;
    setIsLoopEnabled(newLoopState);
    setTimelineLooping(newLoopState);
  };

  const handleBounceToggle = () => {
    const newBounceState = !isBounceEnabled;
    setIsBounceEnabled(newBounceState);
    setTimelinePingPong(newBounceState);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    setTimelineSpeed(newSpeed);
  };

  const handleDirectionToggle = () => {
    const newDirection = isReverse ? 'forward' : 'reverse';
    setIsReverse(!isReverse);
    setTimelineDirection(newDirection);
  };

  const handleMidiLearn = (sequenceId: string) => {
    setMidiLearnMode(true);
    setMidiLearnTarget(sequenceId);
    
    // Listen for MIDI input
    const handleMidiMessage = (event: any) => {
      if (midiLearnTarget) {
        const { data } = event;
        if (data[0] >= 144 && data[0] <= 159) { // Note On messages
          const channel = (data[0] & 0x0F) + 1;
          const note = data[1];
          
          setTimelineMidiTrigger(midiLearnTarget, {
            channel,
            note
          });
          
          setMidiLearnMode(false);
          setMidiLearnTarget(null);
          
          // Remove listener
          if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(midiAccess => {
              midiAccess.inputs.forEach(input => {
                input.removeEventListener('midimessage', handleMidiMessage);
              });
            });
          }
        }
      }
    };

    // Set up MIDI listener
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(midiAccess => {
        midiAccess.inputs.forEach(input => {
          input.addEventListener('midimessage', handleMidiMessage);
        });
      });
    }
  };
  const handleClearMidiMapping = (sequenceId: string) => {
    setTimelineMidiTrigger(sequenceId, undefined);
  };

  const handleMidiLearnFunction = (functionType: 'loop' | 'bounce' | 'reverse') => {
    setMidiLearnMode(true);
    setMidiLearnTarget(functionType);
    
    // Listen for MIDI input for function controls
    const handleFunctionMidiMessage = (event: any) => {
      if (midiLearnTarget) {
        const { data } = event;
        if (data[0] >= 144 && data[0] <= 159) { // Note On messages
          const channel = (data[0] & 0x0F) + 1;
          const note = data[1];
          
          // Store the MIDI mapping for the function
          // This would need to be implemented in the store for function mappings
          console.log(`MIDI Learn for ${functionType}: Channel ${channel}, Note ${note}`);
          
          setMidiLearnMode(false);
          setMidiLearnTarget(null);
          
          // Remove listener
          if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(midiAccess => {
              midiAccess.inputs.forEach(input => {
                input.removeEventListener('midimessage', handleFunctionMidiMessage);
              });
            });
          }
        }
      }
    };

    // Set up MIDI listener
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(midiAccess => {
        midiAccess.inputs.forEach(input => {
          input.addEventListener('midimessage', handleFunctionMidiMessage);
        });
      });
    }
  };

  const selectedSequence = timelineSequences.find(seq => seq.id === selectedSequenceId);
  const isPlaying = timelinePlayback.active && timelinePlayback.sequenceId === selectedSequenceId;
  const hasMidiMapping = selectedSequenceId && timelineMidiMappings[selectedSequenceId];

  return (
    <div className={`${styles.timelineControls} ${className || ''}`}>
      <div className={styles.header}>
        <h3>Timeline Controls</h3>
        <div className={styles.status}>          {isPlaying && (
            <span className={styles.playing}>
              <LucideIcon name="Play" size={16} />
              Playing
            </span>
          )}
        </div>
      </div>

      {/* Timeline Selection */}
      <div className={styles.section}>
        <label>Timeline Sequence</label>
        <select
          value={selectedSequenceId}
          onChange={(e) => setSelectedSequenceId(e.target.value)}
          className={styles.select}
        >
          <option value="">Select Timeline...</option>
          {timelineSequences.map(sequence => (
            <option key={sequence.id} value={sequence.id}>
              {sequence.name}
            </option>
          ))}
        </select>
        {selectedSequence && (
          <div className={styles.sequenceInfo}>
            <span className={styles.duration}>
              Duration: {(selectedSequence.duration / 1000).toFixed(1)}s
            </span>
            <span className={styles.channels}>
              Channels: {selectedSequence.channels.length}
            </span>
          </div>
        )}
      </div>      {/* Transport Controls */}
      <div className={styles.section}>
        <label>Transport & MIDI</label>
        <div className={styles.transportButtons}>
          <button
            onClick={handlePlayPause}
            disabled={!selectedSequenceId}
            className={`${styles.transportBtn} ${isPlaying ? styles.stop : styles.play}`}
          >
            {isPlaying ? (
              <LucideIcon name="Square" size={20} />
            ) : (
              <LucideIcon name="Play" size={20} />
            )}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          
          {selectedSequenceId && (
            <button
              onClick={() => handleMidiLearn(selectedSequenceId)}
              disabled={midiLearnMode}
              className={`${styles.midiLearnBtn} ${midiLearnMode && midiLearnTarget === selectedSequenceId ? styles.learning : ''}`}
              title="Learn MIDI trigger for Play/Stop"
            >
              <LucideIcon name="Music" size={16} />
              {midiLearnMode && midiLearnTarget === selectedSequenceId ? 'Learning...' : 'MIDI'}
            </button>
          )}
          
          <button
            onClick={() => stopTimelinePlayback()}
            disabled={!timelinePlayback.active}
            className={styles.transportBtn}
          >
            <LucideIcon name="Square" size={20} />
            Stop All
          </button>
        </div>
      </div>      {/* Playback Modes */}
      <div className={styles.section}>
        <label>Playback Modes & MIDI</label>
        <div className={styles.modeButtons}>
          <button
            onClick={handleLoopToggle}
            className={`${styles.modeBtn} ${isLoopEnabled ? styles.active : ''}`}
          >
            <LucideIcon name="Repeat" size={16} />
            Loop
          </button>
          
          <button
            onClick={() => handleMidiLearnFunction('loop')}
            disabled={midiLearnMode}
            className={`${styles.midiLearnSmall} ${midiLearnMode && midiLearnTarget === 'loop' ? styles.learning : ''}`}
            title="Learn MIDI trigger for Loop toggle"
          >
            <LucideIcon name="Music" size={12} />
          </button>
          
          <button
            onClick={handleBounceToggle}
            className={`${styles.modeBtn} ${isBounceEnabled ? styles.active : ''}`}
          >
            <LucideIcon name="Repeat1" size={16} />
            Bounce
          </button>
          
          <button
            onClick={() => handleMidiLearnFunction('bounce')}
            disabled={midiLearnMode}
            className={`${styles.midiLearnSmall} ${midiLearnMode && midiLearnTarget === 'bounce' ? styles.learning : ''}`}
            title="Learn MIDI trigger for Bounce toggle"
          >
            <LucideIcon name="Music" size={12} />
          </button>
          
          <button
            onClick={handleDirectionToggle}
            className={`${styles.modeBtn} ${isReverse ? styles.active : ''}`}
          >
            <LucideIcon name="Rewind" size={16} />
            Reverse
          </button>
          
          <button
            onClick={() => handleMidiLearnFunction('reverse')}
            disabled={midiLearnMode}
            className={`${styles.midiLearnSmall} ${midiLearnMode && midiLearnTarget === 'reverse' ? styles.learning : ''}`}
            title="Learn MIDI trigger for Reverse toggle"
          >
            <LucideIcon name="Music" size={12} />
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div className={styles.section}>
        <label>Playback Speed</label>
        <div className={styles.speedControl}>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className={styles.speedSlider}
          />
          <span className={styles.speedValue}>{playbackSpeed.toFixed(1)}x</span>
        </div>
        <div className={styles.speedPresets}>
          {[0.5, 1.0, 1.5, 2.0].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`${styles.speedPreset} ${playbackSpeed === speed ? styles.active : ''}`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* MIDI Control */}
      <div className={styles.section}>
        <label>MIDI Control</label>
        <div className={styles.midiControls}>
          {selectedSequenceId && (
            <>
              {!hasMidiMapping ? (
                <button
                  onClick={() => handleMidiLearn(selectedSequenceId)}
                  disabled={midiLearnMode}
                  className={`${styles.midiBtn} ${midiLearnMode ? styles.learning : ''}`}
                >                  <LucideIcon name="Music" size={16} />
                  {midiLearnMode && midiLearnTarget === selectedSequenceId 
                    ? 'Press MIDI Key...' 
                    : 'Learn MIDI Trigger'
                  }
                </button>
              ) : (
                <div className={styles.midiMapping}>
                  <span className={styles.mappingInfo}>
                    <LucideIcon name="Music" size={16} />
                    Ch: {timelineMidiMappings[selectedSequenceId].channel}
                    {timelineMidiMappings[selectedSequenceId].note && 
                      ` Note: ${timelineMidiMappings[selectedSequenceId].note}`
                    }
                    {timelineMidiMappings[selectedSequenceId].controller && 
                      ` CC: ${timelineMidiMappings[selectedSequenceId].controller}`
                    }
                  </span>
                  <button
                    onClick={() => handleClearMidiMapping(selectedSequenceId)}
                    className={styles.clearBtn}
                  >
                    <LucideIcon name="X" size={14} />
                  </button>
                </div>
              )}
            </>
          )}
          
          <button
            onClick={clearTimelineMidiMappings}
            className={styles.clearAllBtn}
            disabled={Object.keys(timelineMidiMappings).length === 0}
          >
            Clear All MIDI
          </button>
        </div>
      </div>

      {/* Playback Progress */}
      {isPlaying && (
        <div className={styles.section}>
          <label>Progress</label>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${(timelinePlayback.position || 0) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {((timelinePlayback.position || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineControls;
