import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import styles from './TransportControls.module.scss';

interface TransportControlsProps {
  isVisible?: boolean;
  isDocked?: boolean;
  onToggleVisibility?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  isRecording?: boolean;
}

// Autopilot path types
type PathType = 'circle' | 'figure8' | 'star' | 'random' | 'linear' | 'square' | 'triangle';

interface AutopilotPath {
  id: string;
  name: string;
  type: PathType;
  speed: number;
  amplitude: number;
  centerX: number;
  centerY: number;
  active: boolean;
}

interface Scene {
  id: string;
  name: string;
  values: Record<number, number>;
  timestamp: number;
  description?: string;
}

const TransportControls: React.FC<TransportControlsProps> = ({
  isVisible = true,
  isDocked = false,
  onToggleVisibility,
  onPlay,
  onPause,
  onStop,
  onRecord,
  isPlaying = false,
  isPaused = false,
  isRecording = false
}) => {
  const { 
    fixtures, 
    getDmxChannelValue, 
    setDmxChannelValue 
  } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const transportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Autopilot state
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [currentPath, setCurrentPath] = useState<AutopilotPath>({
    id: 'circle1',
    name: 'Circle',
    type: 'circle',
    speed: 1,
    amplitude: 50,
    centerX: 50,
    centerY: 50,
    active: false
  });
  const [pathProgress, setPathProgress] = useState(0);
  const autopilotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scene management state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [autoSceneMode, setAutoSceneMode] = useState(false);
  const [autoSceneInterval, setAutoSceneInterval] = useState(5000); // 5 seconds
  const autoSceneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Panel tabs
  const [activeTab, setActiveTab] = useState<'transport' | 'autopilot' | 'scenes'>('transport');  useEffect(() => {
    // Position at bottom-right by default
    if (!isDocked) {
      setPosition({ 
        x: window.innerWidth - 450, 
        y: window.innerHeight - 350 
      });
    }
  }, [isDocked]);

  // MIDI Learn state
  const [midiLearnTarget, setMidiLearnTarget] = useState<string | null>(null);
  const [midiMappings, setMidiMappings] = useState<Record<string, {
    channel?: number;
    note?: number;
    cc?: number;
    type: 'note' | 'cc';
  }>>({});

  // Autopilot path calculation functions
  const calculatePathPoint = (progress: number, path: AutopilotPath): { x: number, y: number } => {
    const { type, amplitude, centerX, centerY } = path;
    const t = (progress / 100) * 2 * Math.PI;

    switch (type) {
      case 'circle':
        return {
          x: centerX + amplitude * Math.cos(t),
          y: centerY + amplitude * Math.sin(t)
        };
      case 'figure8':
        return {
          x: centerX + amplitude * Math.sin(t),
          y: centerY + amplitude * Math.sin(2 * t) / 2
        };
      case 'star':
        const r = amplitude * (0.5 + 0.5 * Math.cos(5 * t));
        return {
          x: centerX + r * Math.cos(t),
          y: centerY + r * Math.sin(t)
        };
      case 'square':
        const side = Math.floor(t / (Math.PI / 2)) % 4;
        const sideProgress = (t % (Math.PI / 2)) / (Math.PI / 2);
        switch (side) {
          case 0: return { x: centerX + amplitude * sideProgress, y: centerY - amplitude };
          case 1: return { x: centerX + amplitude, y: centerY - amplitude + amplitude * 2 * sideProgress };
          case 2: return { x: centerX + amplitude - amplitude * 2 * sideProgress, y: centerY + amplitude };
          case 3: return { x: centerX - amplitude, y: centerY + amplitude - amplitude * 2 * sideProgress };
          default: return { x: centerX, y: centerY };
        }
      case 'triangle':
        const triSide = Math.floor(t / (2 * Math.PI / 3)) % 3;
        const triProgress = (t % (2 * Math.PI / 3)) / (2 * Math.PI / 3);
        switch (triSide) {
          case 0: return { 
            x: centerX + amplitude * triProgress, 
            y: centerY - amplitude + amplitude * triProgress 
          };
          case 1: return { 
            x: centerX + amplitude - amplitude * triProgress, 
            y: centerY + amplitude 
          };
          case 2: return { 
            x: centerX - amplitude + amplitude * triProgress, 
            y: centerY + amplitude - amplitude * 2 * triProgress 
          };
          default: return { x: centerX, y: centerY };
        }
      case 'linear':
        const linearX = centerX + amplitude * Math.cos(t / 2);
        return { x: linearX, y: centerY };
      case 'random':
        return {
          x: Math.max(0, Math.min(100, centerX + (Math.random() - 0.5) * amplitude * 2)),
          y: Math.max(0, Math.min(100, centerY + (Math.random() - 0.5) * amplitude * 2))
        };
      default:
        return { x: centerX, y: centerY };
    }
  };

  const applyAutopilotToFixtures = (panValue: number, tiltValue: number) => {
    fixtures.forEach(fixture => {
      let panChannel = -1;
      let tiltChannel = -1;

      fixture.channels.forEach((channel, index) => {
        const dmxAddress = fixture.startAddress + index - 1;
        const channelType = channel.type.toLowerCase();
        
        if (channelType === 'pan') {
          panChannel = dmxAddress;
        } else if (channelType === 'tilt') {
          tiltChannel = dmxAddress;
        }
      });

      if (panChannel !== -1) {
        setDmxChannelValue(panChannel, Math.round((panValue / 100) * 255));
      }
      if (tiltChannel !== -1) {
        setDmxChannelValue(tiltChannel, Math.round((tiltValue / 100) * 255));
      }
    });
  };

  const startAutopilot = () => {
    if (autopilotIntervalRef.current) return;

    setAutopilotActive(true);
    autopilotIntervalRef.current = setInterval(() => {
      setPathProgress(prev => {
        const newProgress = (prev + currentPath.speed) % 100;
        const point = calculatePathPoint(newProgress, currentPath);
        applyAutopilotToFixtures(point.x, point.y);
        return newProgress;
      });
    }, 50); // 20 FPS
  };

  const stopAutopilot = () => {
    if (autopilotIntervalRef.current) {
      clearInterval(autopilotIntervalRef.current);
      autopilotIntervalRef.current = null;
    }
    setAutopilotActive(false);
  };

  // Scene management functions
  const captureScene = (name?: string) => {
    const sceneValues: Record<number, number> = {};
    
    for (let i = 1; i <= 512; i++) {
      const value = getDmxChannelValue(i);
      if (value > 0) {
        sceneValues[i] = value;
      }
    }

    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name: name || `Scene ${scenes.length + 1}`,
      values: sceneValues,
      timestamp: Date.now(),
      description: `${Object.keys(sceneValues).length} active channels`
    };

    setScenes(prev => [...prev, newScene]);
    return newScene;
  };

  const loadScene = (sceneIndex: number) => {
    if (sceneIndex < 0 || sceneIndex >= scenes.length) return;
    
    const scene = scenes[sceneIndex];
    
    // Clear all channels first
    for (let i = 1; i <= 512; i++) {
      setDmxChannelValue(i, 0);
    }
    
    // Apply scene values
    Object.entries(scene.values).forEach(([channel, value]) => {
      setDmxChannelValue(parseInt(channel), value);
    });
    
    setCurrentSceneIndex(sceneIndex);
  };

  const deleteScene = (sceneIndex: number) => {
    setScenes(prev => prev.filter((_, index) => index !== sceneIndex));
    if (currentSceneIndex >= sceneIndex && currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const startAutoScene = () => {
    if (scenes.length === 0) return;
    
    setAutoSceneMode(true);
    autoSceneIntervalRef.current = setInterval(() => {
      setCurrentSceneIndex(prev => {
        const nextIndex = (prev + 1) % scenes.length;
        loadScene(nextIndex);
        return nextIndex;
      });
    }, autoSceneInterval);
  };

  const stopAutoScene = () => {
    if (autoSceneIntervalRef.current) {
      clearInterval(autoSceneIntervalRef.current);
      autoSceneIntervalRef.current = null;
    }
    setAutoSceneMode(false);
  };

  // MIDI Learn functionality
  const startMidiLearn = (target: string) => {
    setMidiLearnTarget(target);
    
    // Listen for MIDI input
    const handleMidiMessage = (event: any) => {
      const [status, data1, data2] = event.data;
      const channel = status & 0x0F;
      const messageType = status & 0xF0;
      
      let mapping: any = { channel };
      
      if (messageType === 0x90 || messageType === 0x80) { // Note on/off
        mapping.note = data1;
        mapping.type = 'note';
      } else if (messageType === 0xB0) { // Control Change
        mapping.cc = data1;
        mapping.type = 'cc';
      }
      
      setMidiMappings(prev => ({
        ...prev,
        [target]: mapping
      }));
      
      setMidiLearnTarget(null);
    };

    // Add MIDI listener (assuming MIDI access is available)
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values());
        inputs.forEach(input => {
          input.addEventListener('midimessage', handleMidiMessage);
          
          // Remove listener after 5 seconds or when learning is complete
          setTimeout(() => {
            input.removeEventListener('midimessage', handleMidiMessage);
            if (midiLearnTarget === target) {
              setMidiLearnTarget(null);
            }
          }, 5000);
        });
      });
    }
  };

  // Handle MIDI-triggered actions
  useEffect(() => {
    const handleMidiInput = (event: any) => {
      const [status, data1, data2] = event.data;
      const channel = status & 0x0F;
      const messageType = status & 0xF0;
      
      Object.entries(midiMappings).forEach(([action, mapping]) => {
        if (mapping.channel !== channel) return;
        
        let triggered = false;
        
        if (mapping.type === 'note' && (messageType === 0x90 || messageType === 0x80)) {
          triggered = mapping.note === data1 && data2 > 0; // Note on with velocity > 0
        } else if (mapping.type === 'cc' && messageType === 0xB0) {
          triggered = mapping.cc === data1 && data2 > 63; // CC value > 63
        }
        
        if (triggered) {
          switch (action) {
            case 'autopilot_toggle':
              autopilotActive ? stopAutopilot() : startAutopilot();
              break;
            case 'autopilot_stop':
              stopAutopilot();
              break;
            case 'scene_capture':
              captureScene();
              break;
            case 'scene_auto_toggle':
              autoSceneMode ? stopAutoScene() : startAutoScene();
              break;
            case 'scene_next':
              if (scenes.length > 0) {
                const nextIndex = (currentSceneIndex + 1) % scenes.length;
                loadScene(nextIndex);
              }
              break;
            case 'scene_prev':
              if (scenes.length > 0) {
                const prevIndex = currentSceneIndex === 0 ? scenes.length - 1 : currentSceneIndex - 1;
                loadScene(prevIndex);
              }
              break;
            case 'transport_play':
              onPlay?.();
              break;
            case 'transport_stop':
              onStop?.();
              stopAutopilot();
              stopAutoScene();
              break;
            case 'transport_record':
              onRecord?.();
              break;
          }
        }
      });
    };    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values());
        inputs.forEach(input => {
          input.addEventListener('midimessage', handleMidiInput);
        });

        return () => {
          inputs.forEach(input => {
            input.removeEventListener('midimessage', handleMidiInput);
          });
        };
      });
    }

    // Cleanup intervals on unmount
    return () => {
      if (autopilotIntervalRef.current) {
        clearInterval(autopilotIntervalRef.current);
      }
      if (autoSceneIntervalRef.current) {
        clearInterval(autoSceneIntervalRef.current);
      }
    };
  }, [midiMappings, autopilotActive, autoSceneMode, scenes, currentSceneIndex, onPlay, onStop, onRecord]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDocked) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isDocked) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.startPosX + deltaX)),
      y: Math.max(0, Math.min(window.innerHeight - 150, dragRef.current.startPosY + deltaY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  const handleDockToggle = () => {
    if (isDocked) {
      setPosition({ 
        x: window.innerWidth - 400, 
        y: window.innerHeight - 150 
      });
    }
  };

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) {
    return null;
  }

  if (isMinimized) {
    return (
      <div 
        className={`${styles.transportMinimized} ${isDocked ? styles.docked : ''}`}
        style={!isDocked ? { 
          position: 'fixed', 
          left: position.x + 280, 
          top: position.y 
        } : {}}
        onClick={handleMinimizeToggle}
        title="Expand Transport Controls"
      >
        <div className={styles.playIcon}>▶</div>
      </div>
    );
  }

  return (
    <div 
      ref={transportRef}
      className={`${styles.transportControls} ${isDocked ? styles.docked : ''} ${isDragging ? styles.dragging : ''}`}
      style={!isDocked ? { 
        position: 'fixed', 
        left: position.x, 
        top: position.y 
      } : {}}
    >
      <div 
        className={styles.transportHeader}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.headerLeft}>
          <span className={styles.title}>Transport</span>
        </div>
        <div className={styles.headerControls}>
          <button
            className={styles.headerButton}
            onClick={handleDockToggle}
            title={isDocked ? "Undock" : "Dock to Bottom-Right"}
          >
            {isDocked ? "📌" : "🔗"}
          </button>
          <button
            className={styles.headerButton}
            onClick={handleMinimizeToggle}
            title="Minimize"
          >
            ➖
          </button>
          {onToggleVisibility && (
            <button
              className={styles.headerButton}
              onClick={onToggleVisibility}
              title="Hide Transport Controls"
            >
              ✕
            </button>
          )}
        </div>
      </div>      <div className={styles.transportBody}>
        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'transport' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('transport')}
          >
            Transport
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'autopilot' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('autopilot')}
          >
            Autopilot
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'scenes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('scenes')}
          >
            Scenes
          </button>
        </div>        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <div className={styles.tabContent}>
            <div className={styles.mainControls}>
              <button
                className={`${styles.transportButton} ${styles.recordButton} ${isRecording ? styles.active : ''}`}
                onClick={onRecord}
                title="Record"
              >
                ⏺
              </button>
              <button
                className={`${styles.transportButton} ${styles.stopButton}`}
                onClick={() => {
                  onStop?.();
                  stopAutopilot();
                  stopAutoScene();
                }}
                title="Stop All"
              >
                ⏹
              </button>
              <button
                className={`${styles.transportButton} ${styles.playButton} ${isPlaying ? styles.active : ''}`}
                onClick={isPlaying ? onPause : onPlay}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
            </div>

            <div className={styles.transportMidiLearn}>
              <div className={styles.midiLearnRow}>
                <span>Record:</span>
                <button
                  className={`${styles.midiLearnButton} ${midiLearnTarget === 'transport_record' ? styles.learning : ''}`}
                  onClick={() => startMidiLearn('transport_record')}
                  title="MIDI Learn Record"
                >
                  M
                </button>
              </div>
              <div className={styles.midiLearnRow}>
                <span>Play:</span>
                <button
                  className={`${styles.midiLearnButton} ${midiLearnTarget === 'transport_play' ? styles.learning : ''}`}
                  onClick={() => startMidiLearn('transport_play')}
                  title="MIDI Learn Play"
                >
                  M
                </button>
              </div>
              <div className={styles.midiLearnRow}>
                <span>Stop:</span>
                <button
                  className={`${styles.midiLearnButton} ${midiLearnTarget === 'transport_stop' ? styles.learning : ''}`}
                  onClick={() => startMidiLearn('transport_stop')}
                  title="MIDI Learn Stop"
                >
                  M
                </button>
              </div>
            </div>

            <div className={styles.statusIndicators}>
              {isRecording && <div className={styles.recordingIndicator}>REC</div>}
              {isPlaying && <div className={styles.playingIndicator}>PLAY</div>}
              {isPaused && <div className={styles.pausedIndicator}>PAUSE</div>}
              {autopilotActive && <div className={styles.autopilotIndicator}>AUTO</div>}
              {autoSceneMode && <div className={styles.sceneIndicator}>SCENE</div>}
            </div>
          </div>
        )}

        {/* Autopilot Tab */}
        {activeTab === 'autopilot' && (
          <div className={styles.tabContent}>
            <div className={styles.autopilotControls}>              <div className={styles.autopilotHeader}>
                <h4>Pan/Tilt Tracking</h4>
                <div className={styles.autopilotButtons}>
                  <button
                    className={`${styles.autopilotButton} ${autopilotActive ? styles.active : ''}`}
                    onClick={autopilotActive ? stopAutopilot : startAutopilot}
                    title={autopilotActive ? "Stop Autopilot" : "Start Autopilot"}
                  >
                    {autopilotActive ? "⏹" : "▶"}
                  </button>
                  <button
                    className={`${styles.midiLearnButton} ${midiLearnTarget === 'autopilot_toggle' ? styles.learning : ''}`}
                    onClick={() => startMidiLearn('autopilot_toggle')}
                    title="MIDI Learn Autopilot Toggle"
                  >
                    M
                  </button>
                </div>
              </div>

              <div className={styles.pathSelection}>
                <label>Path Type:</label>
                <select
                  value={currentPath.type}
                  onChange={(e) => setCurrentPath(prev => ({ 
                    ...prev, 
                    type: e.target.value as PathType,
                    name: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)
                  }))}
                  className={styles.pathSelect}
                >
                  <option value="circle">Circle</option>
                  <option value="figure8">Figure 8</option>
                  <option value="star">Star</option>
                  <option value="square">Square</option>
                  <option value="triangle">Triangle</option>
                  <option value="linear">Linear</option>
                  <option value="random">Random</option>
                </select>
              </div>

              <div className={styles.pathControls}>
                <div className={styles.controlRow}>
                  <label>Speed:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={currentPath.speed}
                    onChange={(e) => setCurrentPath(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                    className={styles.pathSlider}
                  />
                  <span className={styles.valueDisplay}>{currentPath.speed.toFixed(1)}</span>
                </div>

                <div className={styles.controlRow}>
                  <label>Size:</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={currentPath.amplitude}
                    onChange={(e) => setCurrentPath(prev => ({ ...prev, amplitude: parseInt(e.target.value) }))}
                    className={styles.pathSlider}
                  />
                  <span className={styles.valueDisplay}>{currentPath.amplitude}%</span>
                </div>

                <div className={styles.controlRow}>
                  <label>Center X:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentPath.centerX}
                    onChange={(e) => setCurrentPath(prev => ({ ...prev, centerX: parseInt(e.target.value) }))}
                    className={styles.pathSlider}
                  />
                  <span className={styles.valueDisplay}>{currentPath.centerX}%</span>
                </div>

                <div className={styles.controlRow}>
                  <label>Center Y:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentPath.centerY}
                    onChange={(e) => setCurrentPath(prev => ({ ...prev, centerY: parseInt(e.target.value) }))}
                    className={styles.pathSlider}
                  />
                  <span className={styles.valueDisplay}>{currentPath.centerY}%</span>
                </div>
              </div>

              <div className={styles.pathProgress}>
                <label>Progress:</label>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${pathProgress}%` }}
                  />
                </div>
                <span className={styles.progressValue}>{Math.round(pathProgress)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Scenes Tab */}
        {activeTab === 'scenes' && (
          <div className={styles.tabContent}>
            <div className={styles.sceneControls}>              <div className={styles.sceneHeader}>
                <h4>Scene Management</h4>
                <div className={styles.sceneButtons}>
                  <button
                    className={styles.sceneButton}
                    onClick={() => captureScene()}
                    title="Capture Current State"
                  >
                    📸
                  </button>
                  <button
                    className={`${styles.midiLearnButton} ${midiLearnTarget === 'scene_capture' ? styles.learning : ''}`}
                    onClick={() => startMidiLearn('scene_capture')}
                    title="MIDI Learn Scene Capture"
                  >
                    M
                  </button>
                  <button
                    className={`${styles.sceneButton} ${autoSceneMode ? styles.active : ''}`}
                    onClick={autoSceneMode ? stopAutoScene : startAutoScene}
                    title={autoSceneMode ? "Stop Auto Scene" : "Start Auto Scene"}
                    disabled={scenes.length === 0}
                  >
                    {autoSceneMode ? "⏹" : "🔄"}
                  </button>
                  <button
                    className={`${styles.midiLearnButton} ${midiLearnTarget === 'scene_auto_toggle' ? styles.learning : ''}`}
                    onClick={() => startMidiLearn('scene_auto_toggle')}
                    title="MIDI Learn Auto Scene Toggle"
                  >
                    M
                  </button>
                </div>
              </div>              <div className={styles.autoSceneSettings}>
                <div className={styles.controlRow}>
                  <label>Auto Interval:</label>
                  <input
                    type="range"
                    min="1000"
                    max="30000"
                    step="1000"
                    value={autoSceneInterval}
                    onChange={(e) => setAutoSceneInterval(parseInt(e.target.value))}
                    className={styles.pathSlider}
                  />
                  <span className={styles.valueDisplay}>{(autoSceneInterval / 1000).toFixed(1)}s</span>
                </div>
                
                <div className={styles.sceneNavigation}>
                  <button
                    className={styles.sceneNavButton}
                    onClick={() => {
                      if (scenes.length > 0) {
                        const prevIndex = currentSceneIndex === 0 ? scenes.length - 1 : currentSceneIndex - 1;
                        loadScene(prevIndex);
                      }
                    }}
                    disabled={scenes.length === 0}
                    title="Previous Scene"
                  >
                    ⏮
                  </button>
                  <button
                    className={`${styles.midiLearnButton} ${midiLearnTarget === 'scene_prev' ? styles.learning : ''}`}
                    onClick={() => startMidiLearn('scene_prev')}
                    title="MIDI Learn Previous Scene"
                  >
                    M
                  </button>
                  <span className={styles.sceneCounter}>
                    {scenes.length > 0 ? `${currentSceneIndex + 1}/${scenes.length}` : '0/0'}
                  </span>
                  <button
                    className={`${styles.midiLearnButton} ${midiLearnTarget === 'scene_next' ? styles.learning : ''}`}
                    onClick={() => startMidiLearn('scene_next')}
                    title="MIDI Learn Next Scene"
                  >
                    M
                  </button>
                  <button
                    className={styles.sceneNavButton}
                    onClick={() => {
                      if (scenes.length > 0) {
                        const nextIndex = (currentSceneIndex + 1) % scenes.length;
                        loadScene(nextIndex);
                      }
                    }}
                    disabled={scenes.length === 0}
                    title="Next Scene"
                  >
                    ⏭
                  </button>
                </div>
              </div>

              <div className={styles.sceneList}>
                {scenes.length === 0 ? (
                  <div className={styles.noScenes}>No scenes captured</div>
                ) : (
                  scenes.map((scene, index) => (
                    <div 
                      key={scene.id}
                      className={`${styles.sceneItem} ${index === currentSceneIndex ? styles.currentScene : ''}`}
                    >
                      <div className={styles.sceneInfo}>
                        <div className={styles.sceneName}>{scene.name}</div>
                        <div className={styles.sceneDescription}>{scene.description}</div>
                      </div>
                      <div className={styles.sceneActions}>
                        <button
                          className={styles.sceneActionButton}
                          onClick={() => loadScene(index)}
                          title="Load Scene"
                        >
                          ▶
                        </button>
                        <button
                          className={styles.sceneActionButton}
                          onClick={() => deleteScene(index)}
                          title="Delete Scene"
                        >
                          🗑
                        </button>
                      </div>                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportControls;
