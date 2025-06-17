import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { TimelineKeyframe, TimelineSequence, TimelinePreset } from '../../store';
import styles from './TimelineEditor.module.scss';

interface TimelineEditorProps {
  className?: string;
}

interface KeyframeEditorState {
  selectedKeyframe: { channelIndex: number; keyframeIndex: number } | null;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartTime: number;
  dragStartValue: number;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ className }) => {  const {
    timelineSequences,
    activeTimelineSequence,
    timelinePresets,
    timelinePlayback,
    loadTimelineSequence,
    deleteTimelineSequence,
    updateTimelineSequence,
    exportTimelineSequence,
    importTimelineSequence,
    smoothTimelineSequence,
    playTimelineSequence,
    stopTimelinePlayback,
    generateTimelinePresets,
    createTimelineFromPreset
  } = useStore();

  const [editorState, setEditorState] = useState<KeyframeEditorState>({
    selectedKeyframe: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTime: 0,
    dragStartValue: 0
  });

  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetConfig, setPresetConfig] = useState({
    duration: 5000,
    amplitude: 255,
    frequency: 1,
    phase: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSequence = timelineSequences.find(s => s.id === activeTimelineSequence);

  // Initialize timeline presets
  useEffect(() => {
    if (timelinePresets.length === 0) {
      generateTimelinePresets();
    }
  }, [timelinePresets.length, generateTimelinePresets]);

  // Canvas drawing logic
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSequence) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Time grid lines
    const timeStep = Math.max(100, 1000 / timelineZoom);
    for (let t = timelineOffset; t < activeSequence.duration + timelineOffset; t += timeStep) {
      const x = ((t - timelineOffset) * timelineZoom * width) / activeSequence.duration;
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Value grid lines
    for (let v = 0; v <= 255; v += 51) {
      const y = height - (v / 255) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw channels
    activeSequence.channels.forEach((channel, channelIndex) => {
      if (selectedChannels.length > 0 && !selectedChannels.includes(channel.channel)) {
        return; // Skip unselected channels when filter is active
      }

      const color = `hsl(${(channelIndex * 137.5) % 360}, 70%, 50%)`;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      // Draw keyframe lines
      if (channel.keyframes.length > 1) {
        ctx.beginPath();
        channel.keyframes.forEach((keyframe, index) => {
          const x = ((keyframe.time - timelineOffset) * timelineZoom * width) / activeSequence.duration;
          const y = height - (keyframe.value / 255) * height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      // Draw keyframes
      channel.keyframes.forEach((keyframe, keyframeIndex) => {
        const x = ((keyframe.time - timelineOffset) * timelineZoom * width) / activeSequence.duration;
        const y = height - (keyframe.value / 255) * height;

        const isSelected = editorState.selectedKeyframe?.channelIndex === channelIndex &&
                          editorState.selectedKeyframe?.keyframeIndex === keyframeIndex;

        ctx.fillStyle = isSelected ? '#fff' : color;
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 6 : 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw curve type indicator
        if (keyframe.curve !== 'linear') {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.stroke();
        }
      });
    });    // Draw playback position
    if (timelinePlayback.active && timelinePlayback.startTime !== null) {
      const elapsed = Date.now() - timelinePlayback.startTime;
      const x = ((elapsed - timelineOffset) * timelineZoom * width) / activeSequence.duration;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [activeSequence, selectedChannels, timelineZoom, timelineOffset, editorState, timelinePlayback]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  // Canvas event handlers
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSequence) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked keyframe
    let foundKeyframe: { channelIndex: number; keyframeIndex: number } | null = null;

    activeSequence.channels.forEach((channel, channelIndex) => {
      if (selectedChannels.length > 0 && !selectedChannels.includes(channel.channel)) {
        return;
      }

      channel.keyframes.forEach((keyframe, keyframeIndex) => {
        const kx = ((keyframe.time - timelineOffset) * timelineZoom * canvas.width) / activeSequence.duration;
        const ky = canvas.height - (keyframe.value / 255) * canvas.height;

        const distance = Math.sqrt((x - kx) ** 2 + (y - ky) ** 2);
        if (distance <= 8) {
          foundKeyframe = { channelIndex, keyframeIndex };
        }
      });
    });

    if (foundKeyframe) {
      const keyframe = activeSequence.channels[foundKeyframe.channelIndex].keyframes[foundKeyframe.keyframeIndex];
      setEditorState({
        selectedKeyframe: foundKeyframe,
        isDragging: true,
        dragStartX: x,
        dragStartY: y,
        dragStartTime: keyframe.time,
        dragStartValue: keyframe.value
      });
    } else {
      setEditorState(prev => ({
        ...prev,
        selectedKeyframe: null,
        isDragging: false
      }));
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorState.isDragging || !editorState.selectedKeyframe || !activeSequence) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const deltaX = x - editorState.dragStartX;
    const deltaY = y - editorState.dragStartY;

    const timeDelta = (deltaX / canvas.width) * activeSequence.duration / timelineZoom;
    const valueDelta = -(deltaY / canvas.height) * 255;

    const newTime = Math.max(0, Math.min(activeSequence.duration, editorState.dragStartTime + timeDelta));
    const newValue = Math.max(0, Math.min(255, editorState.dragStartValue + valueDelta));

    // Update keyframe
    const updatedChannels = [...activeSequence.channels];
    updatedChannels[editorState.selectedKeyframe.channelIndex].keyframes[editorState.selectedKeyframe.keyframeIndex] = {
      ...updatedChannels[editorState.selectedKeyframe.channelIndex].keyframes[editorState.selectedKeyframe.keyframeIndex],
      time: newTime,
      value: Math.round(newValue)
    };

    // Sort keyframes by time
    updatedChannels[editorState.selectedKeyframe.channelIndex].keyframes.sort((a, b) => a.time - b.time);

    updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
  };

  const handleCanvasMouseUp = () => {
    setEditorState(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.type === 'artbastard-timeline-sequence' && importData.sequence) {
          importTimelineSequence(importData.sequence);
        } else {
          alert('Invalid timeline sequence file format');
        }
      } catch (error) {
        alert('Error importing timeline sequence: ' + error);
      }
    };
    reader.readAsText(file);
  };

  const applyPreset = (preset: TimelinePreset) => {
    if (!selectedChannels.length) {
      alert('Please select channels first');
      return;
    }

    createTimelineFromPreset(
      preset.id,
      selectedChannels,
      presetConfig.duration,
      presetConfig.amplitude,
      presetConfig.frequency,
      presetConfig.phase
    );
    setShowPresetDialog(false);
  };

  const addKeyframe = (channel: number, time: number, value: number) => {
    if (!activeSequence) return;

    const channelIndex = activeSequence.channels.findIndex(c => c.channel === channel);
    if (channelIndex === -1) {
      // Add new channel
      const newChannel = {
        channel,
        keyframes: [{ time, value, curve: 'linear' as const }]
      };
      updateTimelineSequence(activeSequence.id, {
        channels: [...activeSequence.channels, newChannel]
      });
    } else {
      // Add keyframe to existing channel
      const updatedChannels = [...activeSequence.channels];
      updatedChannels[channelIndex].keyframes.push({ time, value, curve: 'linear' });
      updatedChannels[channelIndex].keyframes.sort((a, b) => a.time - b.time);
      updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
    }
  };

  const deleteKeyframe = () => {
    if (!editorState.selectedKeyframe || !activeSequence) return;

    const updatedChannels = [...activeSequence.channels];
    updatedChannels[editorState.selectedKeyframe.channelIndex].keyframes.splice(
      editorState.selectedKeyframe.keyframeIndex,
      1
    );

    updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
    setEditorState(prev => ({ ...prev, selectedKeyframe: null }));
  };

  return (
    <div className={`${styles.timelineEditor} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3>Timeline Editor</h3>
        
        {/* Sequence Controls */}
        <div className={styles.sequenceControls}>
          <select
            value={activeTimelineSequence || ''}
            onChange={(e) => loadTimelineSequence(e.target.value)}
          >
            <option value="">Select Timeline Sequence</option>
            {timelineSequences.map(seq => (
              <option key={seq.id} value={seq.id}>{seq.name}</option>
            ))}
          </select>

          {activeSequence && (
            <>              <button onClick={() => playTimelineSequence(activeSequence.id)}>
                {timelinePlayback.active ? 'Stop' : 'Play'}
              </button>
              <button onClick={() => exportTimelineSequence(activeSequence.id)}>
                Export
              </button>
              <button onClick={() => deleteTimelineSequence(activeSequence.id)}>
                Delete
              </button>
            </>
          )}

          <button onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>
      </div>

      {activeSequence && (
        <>
          {/* Timeline Canvas */}
          <div className={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className={styles.timelineCanvas}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {/* Channel Selection */}
            <div className={styles.channelSelection}>
              <label>Filter Channels:</label>
              <input
                type="text"
                placeholder="1,2,3 or 1-10"
                onChange={(e) => {
                  const input = e.target.value.trim();
                  if (!input) {
                    setSelectedChannels([]);
                    return;
                  }

                  const channels: number[] = [];
                  input.split(',').forEach(part => {
                    if (part.includes('-')) {
                      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                      for (let i = start; i <= end; i++) {
                        channels.push(i);
                      }
                    } else {
                      const ch = parseInt(part.trim());
                      if (!isNaN(ch)) channels.push(ch);
                    }
                  });
                  setSelectedChannels(channels);
                }}
              />
            </div>

            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
              <label>Zoom:</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={timelineZoom}
                onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
              />
              <span>{timelineZoom.toFixed(1)}x</span>
            </div>

            {/* Smoothing */}
            <div className={styles.smoothingControls}>
              <button
                onClick={() => {
                  const factor = parseFloat(prompt('Smoothing factor (0-1):') || '0.5');
                  if (!isNaN(factor) && factor >= 0 && factor <= 1) {
                    smoothTimelineSequence(activeSequence.id, factor);
                  }
                }}
              >
                Smooth
              </button>
            </div>

            {/* Preset Application */}
            <div className={styles.presetControls}>
              <button onClick={() => setShowPresetDialog(true)}>
                Apply Preset
              </button>
            </div>
          </div>

          {/* Keyframe Details */}
          {editorState.selectedKeyframe && (
            <div className={styles.keyframeDetails}>
              <h4>Selected Keyframe</h4>
              <div className={styles.keyframeProperties}>
                <label>
                  Time (ms):
                  <input
                    type="number"
                    value={activeSequence.channels[editorState.selectedKeyframe.channelIndex].keyframes[editorState.selectedKeyframe.keyframeIndex].time}
                    onChange={(e) => {
                      const newTime = parseInt(e.target.value);
                      const updatedChannels = [...activeSequence.channels];
                      updatedChannels[editorState.selectedKeyframe!.channelIndex].keyframes[editorState.selectedKeyframe!.keyframeIndex].time = newTime;
                      updatedChannels[editorState.selectedKeyframe!.channelIndex].keyframes.sort((a, b) => a.time - b.time);
                      updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
                    }}
                  />
                </label>
                <label>
                  Value:
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={activeSequence.channels[editorState.selectedKeyframe.channelIndex].keyframes[editorState.selectedKeyframe.keyframeIndex].value}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      const updatedChannels = [...activeSequence.channels];
                      updatedChannels[editorState.selectedKeyframe!.channelIndex].keyframes[editorState.selectedKeyframe!.keyframeIndex].value = newValue;
                      updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
                    }}
                  />
                </label>
                <label>
                  Curve:
                  <select
                    value={activeSequence.channels[editorState.selectedKeyframe.channelIndex].keyframes[editorState.selectedKeyframe.keyframeIndex].curve}
                    onChange={(e) => {
                      const newCurve = e.target.value as TimelineKeyframe['curve'];
                      const updatedChannels = [...activeSequence.channels];
                      updatedChannels[editorState.selectedKeyframe!.channelIndex].keyframes[editorState.selectedKeyframe!.keyframeIndex].curve = newCurve;
                      updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
                    }}
                  >
                    <option value="linear">Linear</option>
                    <option value="smooth">Smooth</option>
                    <option value="step">Step</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-out">Ease Out</option>
                    <option value="ease-in-out">Ease In-Out</option>
                    <option value="bezier">Bezier</option>
                  </select>
                </label>
                <button onClick={deleteKeyframe}>Delete Keyframe</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preset Dialog */}
      {showPresetDialog && (
        <div className={styles.presetDialog}>
          <div className={styles.presetDialogContent}>
            <h4>Apply Timeline Preset</h4>
            
            <div className={styles.presetConfig}>
              <label>
                Duration (ms):
                <input
                  type="number"
                  value={presetConfig.duration}
                  onChange={(e) => setPresetConfig(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value)
                  }))}
                />
              </label>
              <label>
                Amplitude:
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={presetConfig.amplitude}
                  onChange={(e) => setPresetConfig(prev => ({
                    ...prev,
                    amplitude: parseInt(e.target.value)
                  }))}
                />
              </label>
              <label>
                Frequency:
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={presetConfig.frequency}
                  onChange={(e) => setPresetConfig(prev => ({
                    ...prev,
                    frequency: parseFloat(e.target.value)
                  }))}
                />
              </label>
              <label>
                Phase:
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={presetConfig.phase}
                  onChange={(e) => setPresetConfig(prev => ({
                    ...prev,
                    phase: parseInt(e.target.value)
                  }))}
                />
              </label>
            </div>

            <div className={styles.presetList}>
              {timelinePresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={styles.presetButton}
                >
                  <div className={styles.presetName}>{preset.name}</div>
                  <div className={styles.presetDescription}>{preset.description}</div>
                </button>
              ))}
            </div>

            <div className={styles.presetDialogActions}>
              <button onClick={() => setShowPresetDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineEditor;
