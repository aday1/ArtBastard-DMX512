import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './TimelineEditor.module.scss';

interface Keyframe {
  id: string;
  time: number; // Time in seconds
  value: number; // DMX value 0-255
  channel: number; // DMX channel
  interpolation: 'linear' | 'ease' | 'step';
}

interface AutomationTrack {
  id: string;
  name: string;
  channel: number;
  keyframes: Keyframe[];
  enabled: boolean;
  muted: boolean;
  color: string;
}

interface TimelineEditorProps {
  duration?: number; // Timeline duration in seconds
  onSave?: (tracks: AutomationTrack[]) => void;
  onLoad?: () => AutomationTrack[];
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  duration = 60,
  onSave,
  onLoad
}) => {
  const { 
    fixtures,
    selectedFixtures,
    getDmxChannelValue,
    setDmxChannelValue
  } = useStore();

  const [tracks, setTracks] = useState<AutomationTrack[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);
  const [zoom, setZoom] = useState(10); // pixels per second
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<number | null>(null);
  const recordingRef = useRef<number | null>(null);

  // Color palette for tracks
  const trackColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f06292', '#aed581', '#ffb74d'
  ];

  // Timeline grid lines
  const renderTimelineGrid = () => {
    const lines = [];
    const viewWidth = duration * zoom;
    const majorInterval = 5; // Major gridlines every 5 seconds
    const minorInterval = 1; // Minor gridlines every 1 second

    for (let i = 0; i <= duration; i += minorInterval) {
      const x = i * zoom;
      const isMajor = i % majorInterval === 0;
      lines.push(
        <line
          key={`grid-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2="100%"
          stroke={isMajor ? '#444' : '#222'}
          strokeWidth={isMajor ? 2 : 1}
        />
      );
      
      if (isMajor) {
        lines.push(
          <text
            key={`label-${i}`}
            x={x + 4}
            y={20}
            fill="#888"
            fontSize="12"
            fontFamily="monospace"
          >
            {i}s
          </text>
        );
      }
    }

    return (
      <svg
        className={styles.timelineGrid}
        width={viewWidth}
        height="100%"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        {lines}
      </svg>
    );
  };

  // Render playhead
  const renderPlayhead = () => {
    const x = currentTime * zoom;
    return (
      <div
        className={styles.playhead}
        style={{
          left: `${x}px`,
          position: 'absolute',
          width: '2px',
          height: '100%',
          backgroundColor: '#ff4444',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      />
    );
  };
  // Add new track
  const addTrack = () => {
    // Find the first selected fixture to get its start address
    let defaultChannel = 1;
    if (selectedFixtures.length > 0) {
      const selectedFixture = fixtures.find(f => f.id === selectedFixtures[0]);
      if (selectedFixture) {
        defaultChannel = selectedFixture.startAddress;
      }
    }

    const newTrack: AutomationTrack = {
      id: `track-${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      channel: defaultChannel,
      keyframes: [],
      enabled: true,
      muted: false,
      color: trackColors[tracks.length % trackColors.length]
    };
    setTracks(prev => [...prev, newTrack]);
  };

  // Add keyframe at current time
  const addKeyframe = (trackId: string, time: number, value?: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newKeyframe: Keyframe = {
      id: `keyframe-${Date.now()}`,
      time,
      value: value ?? getDmxChannelValue(track.channel),
      channel: track.channel,
      interpolation: 'linear'
    };

    setTracks(prev => prev.map(t => 
      t.id === trackId 
        ? { ...t, keyframes: [...t.keyframes, newKeyframe].sort((a, b) => a.time - b.time) }
        : t
    ));
  };

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / zoom;
    
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  };

  // Handle keyframe drag
  const handleKeyframeDrag = (keyframeId: string, newTime: number, newValue: number) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      keyframes: track.keyframes.map(kf => 
        kf.id === keyframeId 
          ? { ...kf, time: Math.max(0, Math.min(duration, newTime)), value: Math.max(0, Math.min(255, newValue)) }
          : kf
      )
    })));
  };

  // Start playback
  const startPlayback = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    const startTime = Date.now() - (currentTime * 1000 / playbackSpeed);
    
    const updatePlayback = () => {
      const elapsed = (Date.now() - startTime) * playbackSpeed / 1000;
      
      if (elapsed >= duration) {
        stopPlayback();
        return;
      }
      
      setCurrentTime(elapsed);
      
      // Apply automation values
      tracks.forEach(track => {
        if (!track.enabled || track.muted) return;
        
        const value = interpolateValue(track.keyframes, elapsed);
        if (value !== null) {
          setDmxChannelValue(track.channel, value);
        }
      });
      
      playbackRef.current = requestAnimationFrame(updatePlayback);
    };
    
    playbackRef.current = requestAnimationFrame(updatePlayback);
  };

  // Stop playback
  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
      playbackRef.current = null;
    }
  };

  // Start recording
  const startRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    
    const recordingStartTime = Date.now();
    
    const recordFrame = () => {
      const elapsed = (Date.now() - recordingStartTime) / 1000;
      
      if (elapsed >= duration) {
        stopRecording();
        return;
      }
      
      // Record current DMX values for all tracks
      tracks.forEach(track => {
        if (track.enabled && !track.muted) {
          const currentValue = getDmxChannelValue(track.channel);
          // Only add keyframe if value has changed significantly
          const lastKeyframe = track.keyframes[track.keyframes.length - 1];
          if (!lastKeyframe || Math.abs(lastKeyframe.value - currentValue) > 2) {
            addKeyframe(track.id, elapsed, currentValue);
          }
        }
      });
      
      setCurrentTime(elapsed);
      recordingRef.current = requestAnimationFrame(recordFrame);
    };
    
    recordingRef.current = requestAnimationFrame(recordFrame);
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    if (recordingRef.current) {
      cancelAnimationFrame(recordingRef.current);
      recordingRef.current = null;
    }
  };

  // Interpolate value between keyframes
  const interpolateValue = (keyframes: Keyframe[], time: number): number | null => {
    if (keyframes.length === 0) return null;
    
    // Find surrounding keyframes
    let before = null;
    let after = null;
    
    for (const kf of keyframes) {
      if (kf.time <= time) before = kf;
      if (kf.time >= time && !after) after = kf;
    }
    
    if (!before && !after) return null;
    if (!before) return after!.value;
    if (!after) return before.value;
    if (before === after) return before.value;
    
    // Linear interpolation
    const t = (time - before.time) / (after.time - before.time);
    return Math.round(before.value + (after.value - before.value) * t);
  };

  // Render track
  const renderTrack = (track: AutomationTrack, index: number) => {
    const trackHeight = 80;
    const trackY = index * (trackHeight + 10);
    
    return (
      <div
        key={track.id}
        className={styles.track}
        style={{
          position: 'absolute',
          top: trackY,
          left: 0,
          right: 0,
          height: trackHeight,
          backgroundColor: selectedTrack === track.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${track.color}`,
          borderRadius: '4px'
        }}
        onClick={() => setSelectedTrack(track.id)}
      >
        {/* Track header */}
        <div className={styles.trackHeader}>
          <div style={{ color: track.color, fontWeight: 'bold' }}>
            {track.name}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Channel {track.channel}
          </div>
          <div className={styles.trackControls}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTracks(prev => prev.map(t => 
                  t.id === track.id ? { ...t, enabled: !t.enabled } : t
                ));
              }}
              style={{
                background: track.enabled ? '#28a745' : '#6c757d',
                border: 'none',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem'
              }}
            >
              {track.enabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTracks(prev => prev.map(t => 
                  t.id === track.id ? { ...t, muted: !t.muted } : t
                ));
              }}
              style={{
                background: track.muted ? '#dc3545' : '#6c757d',
                border: 'none',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem'
              }}
            >
              {track.muted ? 'MUTE' : 'LIVE'}
            </button>
          </div>
        </div>
        
        {/* Keyframes */}
        {track.keyframes.map(keyframe => {
          const x = keyframe.time * zoom;
          const y = trackHeight - (keyframe.value / 255) * (trackHeight - 30) - 10;
          
          return (
            <div
              key={keyframe.id}
              className={styles.keyframe}
              style={{
                position: 'absolute',
                left: x - 4,
                top: y - 4,
                width: 8,
                height: 8,
                backgroundColor: track.color,
                borderRadius: '50%',
                cursor: 'pointer',
                border: selectedKeyframe === keyframe.id ? '2px solid white' : 'none'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedKeyframe(keyframe.id);
              }}
              onDoubleClick={() => {
                // Add keyframe at current time
                addKeyframe(track.id, currentTime);
              }}
            />
          );
        })}
        
        {/* Value curve */}
        <svg
          width={duration * zoom}
          height={trackHeight}
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          {track.keyframes.map((keyframe, i) => {
            const nextKeyframe = track.keyframes[i + 1];
            if (!nextKeyframe) return null;
            
            const x1 = keyframe.time * zoom;
            const y1 = trackHeight - (keyframe.value / 255) * (trackHeight - 30) - 10;
            const x2 = nextKeyframe.time * zoom;
            const y2 = trackHeight - (nextKeyframe.value / 255) * (trackHeight - 30) - 10;
            
            return (
              <line
                key={`curve-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={track.color}
                strokeWidth={2}
                opacity={0.7}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  // Save automation
  const saveAutomation = () => {
    const data = {
      tracks,
      duration,
      timestamp: Date.now()
    };
    
    if (onSave) {
      onSave(tracks);
    } else {
      // Save to localStorage as fallback
      localStorage.setItem('artbastard-automation', JSON.stringify(data));
    }
  };

  // Load automation
  const loadAutomation = () => {
    if (onLoad) {
      const loadedTracks = onLoad();
      if (loadedTracks) {
        setTracks(loadedTracks);
      }
    } else {
      // Load from localStorage as fallback
      const saved = localStorage.getItem('artbastard-automation');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setTracks(data.tracks || []);
        } catch (error) {
          console.error('Failed to load automation:', error);
        }
      }
    }
  };

  return (
    <div className={styles.timelineEditor}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.transportControls}>
          <button
            onClick={isPlaying ? stopPlayback : startPlayback}
            className={`${styles.transportBtn} ${isPlaying ? styles.active : ''}`}
          >
            <LucideIcon name={isPlaying ? "Pause" : "Play"} />
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={() => setCurrentTime(0)}
            className={styles.transportBtn}
          >
            <LucideIcon name="SkipBack" />
            Reset
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`${styles.transportBtn} ${isRecording ? styles.recording : ''}`}
          >
            <LucideIcon name="Circle" />
            {isRecording ? 'Stop Rec' : 'Record'}
          </button>
        </div>
        
        <div className={styles.timeDisplay}>
          {currentTime.toFixed(1)}s / {duration}s
        </div>
        
        <div className={styles.trackControls}>
          <button onClick={addTrack} className={styles.addBtn}>
            <LucideIcon name="Plus" />
            Add Track
          </button>
          
          <button onClick={saveAutomation} className={styles.saveBtn}>
            <LucideIcon name="Save" />
            Save
          </button>
          
          <button onClick={loadAutomation} className={styles.loadBtn}>
            <LucideIcon name="FolderOpen" />
            Load
          </button>
        </div>
        
        <div className={styles.zoomControls}>
          <button onClick={() => setZoom(Math.max(1, zoom - 2))}>
            <LucideIcon name="ZoomOut" />
          </button>
          <span>Zoom: {zoom}px/s</span>
          <button onClick={() => setZoom(Math.min(50, zoom + 2))}>
            <LucideIcon name="ZoomIn" />
          </button>
        </div>
      </div>
      
      {/* Timeline */}
      <div
        ref={timelineRef}
        className={styles.timeline}
        onClick={handleTimelineClick}
        style={{ 
          position: 'relative',
          width: '100%',
          height: Math.max(200, tracks.length * 90 + 100),
          overflow: 'auto',
          backgroundColor: '#1a1a1a',
          border: '1px solid #333'
        }}
      >
        {renderTimelineGrid()}
        {renderPlayhead()}
        
        {tracks.map((track, index) => renderTrack(track, index))}
        
        {tracks.length === 0 && (
          <div className={styles.emptyState}>
            <LucideIcon name="Music" size={48} />
            <h3>No automation tracks</h3>
            <p>Click "Add Track" to start creating automation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEditor;
