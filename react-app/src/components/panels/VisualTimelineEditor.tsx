import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './VisualTimelineEditor.module.scss';

interface TimelineKeyframe {
  time: number;
  value: number;
  curve: 'linear' | 'smooth' | 'step' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface TimelineChannel {
  channel: number;
  keyframes: TimelineKeyframe[];
}

interface VisualTimelineEditorProps {
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragType: 'keyframe' | 'timeline' | null;
  channelIndex: number;
  keyframeIndex: number;
  startX: number;
  startY: number;
  startTime: number;
  startValue: number;
}

const VisualTimelineEditor: React.FC<VisualTimelineEditorProps> = ({ className }) => {
  const {
    timelineSequences,
    activeTimelineSequence,
    updateTimelineSequence,
    timelinePlayback
  } = useStore();

  // Canvas refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    channelIndex: -1,
    keyframeIndex: -1,
    startX: 0,
    startY: 0,
    startTime: 0,
    startValue: 0
  });

  // Timeline editor state
  const [selectedKeyframes, setSelectedKeyframes] = useState<Array<{channelIndex: number, keyframeIndex: number}>>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuTime, setContextMenuTime] = useState(0);
  const [contextMenuValue, setContextMenuValue] = useState(128);

  const activeSequence = timelineSequences.find(seq => seq.id === activeTimelineSequence);

  // Canvas dimensions and scaling
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartWidth = canvasSize.width - margin.left - margin.right;
  const chartHeight = canvasSize.height - margin.top - margin.bottom;

  // Helper functions for coordinate conversion
  const timeToX = useCallback((time: number) => {
    const duration = activeSequence?.duration || 10000;
    return margin.left + ((time / duration) * chartWidth * zoom) + panX;
  }, [activeSequence?.duration, chartWidth, zoom, panX, margin.left]);

  const valueToY = useCallback((value: number) => {
    return margin.top + chartHeight - (value / 255) * chartHeight;
  }, [chartHeight, margin.top]);

  const xToTime = useCallback((x: number) => {
    const duration = activeSequence?.duration || 10000;
    return ((x - margin.left - panX) / (chartWidth * zoom)) * duration;
  }, [activeSequence?.duration, chartWidth, zoom, panX, margin.left]);

  const yToValue = useCallback((y: number) => {
    return Math.max(0, Math.min(255, ((chartHeight - (y - margin.top)) / chartHeight) * 255));
  }, [chartHeight, margin.top]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ 
          width: Math.max(600, rect.width), 
          height: Math.max(300, Math.min(600, rect.height)) 
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const duration = activeSequence?.duration || 10000;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Time grid lines (every second)
    for (let time = 0; time <= duration; time += 1000) {
      const x = timeToX(time);
      if (x >= margin.left && x <= canvasSize.width - margin.right) {
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, canvasSize.height - margin.bottom);
        ctx.stroke();
      }
    }

    // Value grid lines (every 32 values)
    for (let value = 0; value <= 255; value += 32) {
      const y = valueToY(value);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(canvasSize.width - margin.right, y);
      ctx.stroke();
    }
  }, [activeSequence?.duration, timeToX, valueToY, canvasSize, margin]);

  const drawAxes = useCallback((ctx: CanvasRenderingContext2D) => {
    const duration = activeSequence?.duration || 10000;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    // X-axis (time)
    ctx.beginPath();
    ctx.moveTo(margin.left, canvasSize.height - margin.bottom);
    ctx.lineTo(canvasSize.width - margin.right, canvasSize.height - margin.bottom);
    ctx.stroke();

    // Y-axis (value)
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, canvasSize.height - margin.bottom);
    ctx.stroke();

    // Time labels
    for (let time = 0; time <= duration; time += 1000) {
      const x = timeToX(time);
      if (x >= margin.left && x <= canvasSize.width - margin.right) {
        ctx.fillText(`${time / 1000}s`, x - 10, canvasSize.height - margin.bottom + 20);
      }
    }

    // Value labels
    for (let value = 0; value <= 255; value += 64) {
      const y = valueToY(value);
      ctx.fillText(value.toString(), 10, y + 4);
    }
  }, [activeSequence?.duration, timeToX, valueToY, canvasSize, margin]);

  const drawTimeline = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!activeSequence) return;

    activeSequence.channels.forEach((channel, channelIndex) => {
      const isSelected = channelIndex === selectedChannel;
      const color = isSelected ? '#4CAF50' : `hsl(${channelIndex * 60}, 70%, 60%)`;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = color;

      // Draw lines between keyframes
      if (channel.keyframes.length > 1) {
        ctx.beginPath();
        for (let i = 0; i < channel.keyframes.length - 1; i++) {
          const current = channel.keyframes[i];
          const next = channel.keyframes[i + 1];
          
          const x1 = timeToX(current.time);
          const y1 = valueToY(current.value);
          const x2 = timeToX(next.time);
          const y2 = valueToY(next.value);

          if (i === 0) {
            ctx.moveTo(x1, y1);
          }

          // Draw curve based on keyframe type
          if (current.curve === 'smooth' || current.curve === 'ease-in-out') {
            const cp1x = x1 + (x2 - x1) * 0.33;
            const cp1y = y1;
            const cp2x = x1 + (x2 - x1) * 0.67;
            const cp2y = y2;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
          } else if (current.curve === 'step') {
            ctx.lineTo(x2, y1);
            ctx.lineTo(x2, y2);
          } else {
            ctx.lineTo(x2, y2);
          }
        }
        ctx.stroke();
      }

      // Draw keyframe points
      channel.keyframes.forEach((keyframe, keyframeIndex) => {
        const x = timeToX(keyframe.time);
        const y = valueToY(keyframe.value);
        
        // Check if point is visible
        if (x >= margin.left - 10 && x <= canvasSize.width - margin.right + 10) {
          const isSelectedKeyframe = selectedKeyframes.some(
            sel => sel.channelIndex === channelIndex && sel.keyframeIndex === keyframeIndex
          );
          
          ctx.beginPath();
          ctx.arc(x, y, isSelectedKeyframe ? 8 : 6, 0, 2 * Math.PI);
          ctx.fillStyle = isSelectedKeyframe ? '#FF9800' : color;
          ctx.fill();
          
          ctx.strokeStyle = isSelected ? '#fff' : 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });
  }, [activeSequence, selectedChannel, selectedKeyframes, timeToX, valueToY, canvasSize, margin]);

  const drawPlayhead = useCallback((ctx: CanvasRenderingContext2D) => {
    if (timelinePlayback.active && timelinePlayback.position !== undefined) {
      const duration = activeSequence?.duration || 10000;
      const time = timelinePlayback.position * duration;
      const x = timeToX(time);
      
      if (x >= margin.left && x <= canvasSize.width - margin.right) {
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, canvasSize.height - margin.bottom);
        ctx.stroke();
        
        // Playhead triangle
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.moveTo(x - 8, margin.top);
        ctx.lineTo(x + 8, margin.top);
        ctx.lineTo(x, margin.top + 16);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [timelinePlayback, activeSequence?.duration, timeToX, canvasSize, margin]);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    drawGrid(ctx);
    drawAxes(ctx);
    drawTimeline(ctx);
    drawPlayhead(ctx);
  }, [canvasSize, drawGrid, drawAxes, drawTimeline, drawPlayhead]);

  // Canvas setup and drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    draw();
  }, [canvasSize, draw]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSequence) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a keyframe
    let clickedKeyframe = null;
    for (let channelIndex = 0; channelIndex < activeSequence.channels.length; channelIndex++) {
      const channel = activeSequence.channels[channelIndex];
      for (let keyframeIndex = 0; keyframeIndex < channel.keyframes.length; keyframeIndex++) {
        const keyframe = channel.keyframes[keyframeIndex];
        const kx = timeToX(keyframe.time);
        const ky = valueToY(keyframe.value);
        
        if (Math.abs(x - kx) <= 8 && Math.abs(y - ky) <= 8) {
          clickedKeyframe = { channelIndex, keyframeIndex };
          break;
        }
      }
      if (clickedKeyframe) break;
    }

    if (clickedKeyframe) {
      // Start dragging keyframe
      setSelectedChannel(clickedKeyframe.channelIndex);
      setSelectedKeyframes([clickedKeyframe]);
      
      const keyframe = activeSequence.channels[clickedKeyframe.channelIndex].keyframes[clickedKeyframe.keyframeIndex];
      setDragState({
        isDragging: true,
        dragType: 'keyframe',
        channelIndex: clickedKeyframe.channelIndex,
        keyframeIndex: clickedKeyframe.keyframeIndex,
        startX: x,
        startY: y,
        startTime: keyframe.time,
        startValue: keyframe.value
      });
    } else {
      // Clear selection or start timeline pan
      setSelectedKeyframes([]);
      setDragState({
        isDragging: true,
        dragType: 'timeline',
        channelIndex: -1,
        keyframeIndex: -1,
        startX: x,
        startY: y,
        startTime: 0,
        startValue: 0
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !dragState.isDragging || !activeSequence) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragState.dragType === 'keyframe') {
      const deltaX = x - dragState.startX;
      const deltaY = y - dragState.startY;
      
      const newTime = Math.max(0, Math.min(activeSequence.duration, 
        dragState.startTime + (deltaX / (chartWidth * zoom)) * activeSequence.duration));
      const newValue = Math.max(0, Math.min(255, 
        dragState.startValue - (deltaY / chartHeight) * 255));

      // Update keyframe
      const updatedChannels = [...activeSequence.channels];
      updatedChannels[dragState.channelIndex].keyframes[dragState.keyframeIndex] = {
        ...updatedChannels[dragState.channelIndex].keyframes[dragState.keyframeIndex],
        time: newTime,
        value: newValue
      };

      // Sort keyframes by time
      updatedChannels[dragState.channelIndex].keyframes.sort((a, b) => a.time - b.time);

      updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
    } else if (dragState.dragType === 'timeline') {
      // Pan timeline
      const deltaX = x - dragState.startX;
      setPanX(prev => prev + deltaX);
      setDragState(prev => ({ ...prev, startX: x }));
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      dragType: null,
      channelIndex: -1,
      keyframeIndex: -1,
      startX: 0,
      startY: 0,
      startTime: 0,
      startValue: 0
    });
  };

  const handleRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !activeSequence) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = xToTime(x);
    const value = yToValue(y);

    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuTime(time);
    setContextMenuValue(value);
    setShowContextMenu(true);
  };

  const addKeyframe = () => {
    if (!activeSequence) return;
    
    const updatedChannels = [...activeSequence.channels];
    if (selectedChannel < updatedChannels.length) {
      updatedChannels[selectedChannel].keyframes.push({
        time: contextMenuTime,
        value: contextMenuValue,
        curve: 'linear'
      });
      
      // Sort keyframes by time
      updatedChannels[selectedChannel].keyframes.sort((a, b) => a.time - b.time);
      
      updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
    }
    setShowContextMenu(false);
  };

  const deleteSelectedKeyframes = () => {
    if (!activeSequence || selectedKeyframes.length === 0) return;
    
    const updatedChannels = [...activeSequence.channels];
    
    // Sort by keyframe index in descending order to delete from end
    const sortedSelection = [...selectedKeyframes].sort((a, b) => b.keyframeIndex - a.keyframeIndex);
    
    sortedSelection.forEach(sel => {
      if (updatedChannels[sel.channelIndex].keyframes.length > 1) {
        updatedChannels[sel.channelIndex].keyframes.splice(sel.keyframeIndex, 1);
      }
    });
    
    updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
    setSelectedKeyframes([]);
    setShowContextMenu(false);
  };

  const smoothSelectedKeyframes = () => {
    if (!activeSequence || selectedKeyframes.length === 0) return;
    
    const updatedChannels = [...activeSequence.channels];
    
    selectedKeyframes.forEach(sel => {
      updatedChannels[sel.channelIndex].keyframes[sel.keyframeIndex].curve = 'smooth';
    });
    
    updateTimelineSequence(activeSequence.id, { channels: updatedChannels });
    setShowContextMenu(false);
  };

  if (!activeSequence) {
    return (
      <div className={`${styles.timelineEditor} ${className || ''}`}>
        <div className={styles.noSequence}>
          <LucideIcon name="Clock" size={48} />
          <h3>No Timeline Selected</h3>
          <p>Please select a timeline sequence to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.timelineEditor} ${className || ''}`} ref={containerRef}>
      <div className={styles.header}>
        <h3>Visual Timeline Editor</h3>
        <div className={styles.controls}>
          <label>Channel:</label>
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(parseInt(e.target.value))}
            className={styles.channelSelect}
          >
            {activeSequence.channels.map((channel, index) => (
              <option key={index} value={index}>
                Channel {channel.channel} ({channel.keyframes.length} keyframes)
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
            className={styles.zoomBtn}
            title="Zoom In"
          >
            <LucideIcon name="ZoomIn" size={16} />
          </button>
          
          <button
            onClick={() => setZoom(prev => Math.max(0.2, prev / 1.2))}
            className={styles.zoomBtn}
            title="Zoom Out"
          >
            <LucideIcon name="ZoomOut" size={16} />
          </button>
          
          <button
            onClick={() => { setZoom(1); setPanX(0); }}
            className={styles.resetBtn}
            title="Reset View"
          >
            <LucideIcon name="RotateCcw" size={16} />
          </button>
        </div>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleRightClick}
        />
      </div>

      <div className={styles.instructions}>
        <p><strong>Controls:</strong> Left-click to select/drag keyframes • Right-click to add keyframes • Mouse wheel to zoom</p>
        <p><strong>Selected:</strong> {selectedKeyframes.length} keyframe{selectedKeyframes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className={styles.contextMenu}
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          <button onClick={addKeyframe}>
            <LucideIcon name="Plus" size={14} />
            Add Keyframe
          </button>
          
          {selectedKeyframes.length > 0 && (
            <>
              <button onClick={deleteSelectedKeyframes}>
                <LucideIcon name="Trash2" size={14} />
                Delete Selected
              </button>
              
              <button onClick={smoothSelectedKeyframes}>
                <LucideIcon name="Waves" size={14} />
                Smooth Selected
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualTimelineEditor;
