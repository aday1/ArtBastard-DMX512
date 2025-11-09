/**
 * FaceTracker Debug - Minimal implementation from scratch
 * Purpose: Identify what's breaking the main FaceTracker
 * Features: Only camera + OpenCV + basic detection + extensive logging
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import { Fixture3DModel } from './Fixture3DModel';

interface DebugState {
  isRunning: boolean;
  opencvReady: boolean;
  cameraReady: boolean;
  faceDetected: boolean;
  pan: number;
  tilt: number;
  loopIterations: number;
  detections: number;
  error: string | null;
  lastDmxMessage: { channel: number; value: number }[] | null;
  lastOscMessage: string | null;
}

interface FeatureFlags {
  enableFaceTracking: boolean; // Basic pan/tilt face tracking
}

export const FaceTrackerDebug: React.FC = () => {
  const { socket, connected } = useSocket();
  const { fixtures } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const opencvRef = useRef<any>(null);
  const cascadeRef = useRef<any>(null);
  const rafIdRef = useRef<number | undefined>(undefined);
  const loopCountRef = useRef<number>(0);
  const detectionCountRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  const [state, setState] = useState<DebugState>({
    isRunning: false,
    opencvReady: false,
    cameraReady: false,
    faceDetected: false,
    pan: 128,
    tilt: 128,
    loopIterations: 0,
    detections: 0,
    error: null,
    lastDmxMessage: null,
    lastOscMessage: null
  });

  const [hz, setHz] = useState<number>(10);
  const hzRef = useRef<number>(10); // Ref to track current Hz for the loop

  // OpenCV detection parameters
  const [opencvParams, setOpencvParams] = useState({
    scaleFactor: 1.1, // How much to scale image at each step (1.1 = 10% reduction)
    minNeighbors: 3,  // Minimum neighbors required for detection
    minSize: 30,      // Minimum face size in pixels
  });
  const opencvParamsRef = useRef(opencvParams);

  // Feature flags - face tracking enabled by default (core feature)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    enableFaceTracking: true, // Basic pan/tilt - ENABLED by default (core feature)
  });

  // DMX channel configuration
  const [dmxChannels, setDmxChannels] = useState({
    pan: 0,
    tilt: 1,
  });

  // Ref to track feature flags for the detection loop (avoid stale closures)
  const featureFlagsRef = useRef<FeatureFlags>(featureFlags);
  
  // Ref to track DMX channels for the detection loop (avoid stale closures)
  const dmxChannelsRef = useRef(dmxChannels);
  
  // Keep featureFlagsRef in sync
  useEffect(() => {
    featureFlagsRef.current = featureFlags;
    console.log('[DEBUG] 🔄 Feature flags updated:', featureFlags);
  }, [featureFlags]);

  // Keep dmxChannelsRef in sync
  useEffect(() => {
    dmxChannelsRef.current = dmxChannels;
    console.log('[DEBUG] 🔄 DMX channels updated:', dmxChannels);
  }, [dmxChannels]);

  // Keep hzRef in sync with hz state
  useEffect(() => {
    hzRef.current = hz;
    console.log('[DEBUG] 🔄 Hz ref synced to:', hz);
  }, [hz]);

  // Keep opencvParamsRef in sync
  useEffect(() => {
    opencvParamsRef.current = opencvParams;
    console.log('[DEBUG] 🔄 OpenCV params updated:', opencvParams);
  }, [opencvParams]);

  // Initialize OpenCV
  useEffect(() => {
    console.log('[DEBUG] 🔵 Initializing OpenCV...');
    
    const initOpenCV = async () => {
      try {
        // Wait for OpenCV
        if (!window.cv) {
          console.log('[DEBUG] ⏳ Waiting for OpenCV.js...');
          await new Promise<void>((resolve) => {
            let attempts = 0;
            const check = setInterval(() => {
              attempts++;
              console.log(`[DEBUG] Checking for OpenCV... attempt ${attempts}`);
              if (window.cv && window.cv.Mat) {
                clearInterval(check);
                console.log('[DEBUG] ✅ OpenCV found!');
                resolve();
              } else if (attempts > 50) {
                clearInterval(check);
                throw new Error('OpenCV timeout');
              }
            }, 100);
          });
        }

        opencvRef.current = window.cv;
        console.log('[DEBUG] 📦 OpenCV loaded');

        // Load cascade
        console.log('[DEBUG] 📥 Loading cascade...');
        const response = await fetch('/haarcascade_frontalface_alt.xml');
        if (!response.ok) throw new Error('Cascade not found');
        
        const text = await response.text();
        console.log('[DEBUG] 📝 Cascade file loaded, size:', text.length);
        
        opencvRef.current.FS.writeFile('haarcascade_frontalface_alt.xml', text);
        console.log('[DEBUG] 💾 Cascade written to filesystem');

        cascadeRef.current = new opencvRef.current.CascadeClassifier();
        const loaded = cascadeRef.current.load('haarcascade_frontalface_alt.xml');
        console.log('[DEBUG] 🎯 Cascade loaded:', loaded);

        setState(prev => ({ ...prev, opencvReady: true }));
        console.log('[DEBUG] ✅ OpenCV initialization complete');
      } catch (error: any) {
        console.error('[DEBUG] ❌ OpenCV init error:', error);
        setState(prev => ({ ...prev, error: error.message }));
      }
    };

    initOpenCV();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    console.log('[DEBUG] 🎥 Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      console.log('[DEBUG] ✅ Camera stream obtained');

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('[DEBUG] ▶️ Video playing');
      }

      setState(prev => ({ ...prev, cameraReady: true }));
      console.log('[DEBUG] ✅ Camera ready');
    } catch (error: any) {
      console.error('[DEBUG] ❌ Camera error:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    console.log('[DEBUG] 🛑 Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(prev => ({ ...prev, cameraReady: false }));
  }, []);

  // Start/stop detection loop
  const startDetection = useCallback(() => {
    console.log('[DEBUG] 🚀🚀🚀 STARTING DETECTION LOOP 🚀🚀🚀', { hz: hzRef.current });

    if (!opencvRef.current || !cascadeRef.current) {
      console.error('[DEBUG] ❌ Cannot start - OpenCV not ready');
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.error('[DEBUG] ❌ Cannot start - video/canvas not ready');
      return;
    }

    // Sync ref with current state
    hzRef.current = hz;
    console.log('[DEBUG] ✅ All refs ready, defining RAF loop, Hz:', hzRef.current);

    const detectLoop = () => {
      loopCountRef.current++;
      const iteration = loopCountRef.current;

      // 🔑 SCHEDULE NEXT FRAME FIRST
      rafIdRef.current = requestAnimationFrame(detectLoop);

      // Log every 60 frames
      if (iteration % 60 === 0) {
        console.log(`[DEBUG] 🔄 Loop iteration #${iteration}, isRunning: ${isRunningRef.current}`);
      }

      // Check if we should run
      if (!isRunningRef.current) {
        if (iteration % 60 === 0) {
          console.log('[DEBUG] ⏸️ Paused - isRunning is false');
        }
        return;
      }

      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (iteration % 60 === 0) {
          console.log('[DEBUG] ⏸️ Video not ready, readyState:', video.readyState);
        }
        return;
      }

      // Throttle based on Hz (use ref to get current value, not closure)
      const currentHz = hzRef.current;
      const now = Date.now();
      const interval = 1000 / currentHz;
      if (now - lastDetectionTimeRef.current < interval) {
        return; // Throttled
      }
      lastDetectionTimeRef.current = now;

      console.log(`[DEBUG] 🔍 RUNNING DETECTION (iteration #${iteration}, Hz: ${currentHz})`);

      try {
        // Resize canvas if needed
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log('[DEBUG] 📐 Canvas resized:', canvas.width, 'x', canvas.height);
        }

        // Draw video
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0);

        // Create detection canvas (smaller for speed)
        const detCanvas = document.createElement('canvas');
        const detWidth = 320;
        const detHeight = Math.round((video.videoHeight / video.videoWidth) * detWidth);
        detCanvas.width = detWidth;
        detCanvas.height = detHeight;

        const detCtx = detCanvas.getContext('2d')!;
        detCtx.drawImage(video, 0, 0, detWidth, detHeight);

        // OpenCV detection
        const src = opencvRef.current.imread(detCanvas);
        const gray = new opencvRef.current.Mat();
        opencvRef.current.cvtColor(src, gray, opencvRef.current.COLOR_RGBA2GRAY);

        const faces = new opencvRef.current.RectVector();
        const currentParams = opencvParamsRef.current;
        const minSize = new opencvRef.current.Size(currentParams.minSize, currentParams.minSize);
        
        cascadeRef.current.detectMultiScale(
          gray, 
          faces, 
          currentParams.scaleFactor, 
          currentParams.minNeighbors, 
          0, // flags (0 = default)
          minSize
        );

        const faceCount = faces.size();
        console.log(`[DEBUG] 👤 Faces found: ${faceCount}`);

        if (faceCount > 0) {
          detectionCountRef.current++;
          
          const face = faces.get(0);
          const scaleX = video.videoWidth / detWidth;
          const scaleY = video.videoHeight / detHeight;

          const faceCenterX = (face.x + face.width / 2) * scaleX;
          const faceCenterY = (face.y + face.height / 2) * scaleY;
          const imageCenterX = video.videoWidth / 2;
          const imageCenterY = video.videoHeight / 2;

          // Face tracking (pan/tilt) - only if enabled (use ref to avoid stale closure)
          let panValue = 128;
          let tiltValue = 128;
          const currentFlags = featureFlagsRef.current;
          
          if (currentFlags.enableFaceTracking) {
            const pan = (faceCenterX - imageCenterX) / imageCenterX;
            const tilt = -(faceCenterY - imageCenterY) / imageCenterY;
            panValue = Math.round(Math.max(0, Math.min(255, pan * 127 + 128)));
            tiltValue = Math.round(Math.max(0, Math.min(255, tilt * 127 + 128)));
            console.log(`[DEBUG] ✅ Face at (${faceCenterX.toFixed(0)}, ${faceCenterY.toFixed(0)}), Pan: ${panValue}, Tilt: ${tiltValue}`);
          } else {
            console.log(`[DEBUG] 👁️ Face detected but tracking disabled (enableFaceTracking: false)`);
          }


          setState(prev => ({ 
            ...prev, 
            faceDetected: true, 
            pan: panValue, 
            tilt: tiltValue,
            loopIterations: iteration,
            detections: detectionCountRef.current
          }));

          // Draw face box (always draw if face detected)
          ctx.strokeStyle = 'lime';
          ctx.lineWidth = 2;
          ctx.strokeRect(face.x * scaleX, face.y * scaleY, face.width * scaleX, face.height * scaleY);
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          ctx.arc(faceCenterX, faceCenterY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Send DMX (only if face tracking enabled)
          if (currentFlags.enableFaceTracking && socket && connected) {
            const currentDmxChannels = dmxChannelsRef.current; // Use ref to avoid stale closure
            const dmxData: { [key: number]: number } = {};
            const dmxMessage: { channel: number; value: number }[] = [];
            
            // Pan channel
            if (currentDmxChannels.pan >= 0 && currentDmxChannels.pan <= 511) {
              dmxData[currentDmxChannels.pan] = panValue;
              dmxMessage.push({ channel: currentDmxChannels.pan, value: panValue });
            }
            
            // Tilt channel
            if (currentDmxChannels.tilt >= 0 && currentDmxChannels.tilt <= 511) {
              dmxData[currentDmxChannels.tilt] = tiltValue;
              dmxMessage.push({ channel: currentDmxChannels.tilt, value: tiltValue });
            }
            
            
            if (Object.keys(dmxData).length > 0) {
              (socket as any).emit('dmx:batch', dmxData);
              
              // Update state with last DMX message for display
              setState(prev => ({ 
                ...prev, 
                lastDmxMessage: dmxMessage,
                lastOscMessage: null // No OSC in debug version yet
              }));
              console.log(`[DEBUG] 📤 DMX sent:`, dmxMessage);
            }
          } else if (currentFlags.enableFaceTracking && (!socket || !connected)) {
            console.log(`[DEBUG] ⚠️ Face tracking enabled but socket not connected (socket: ${!!socket}, connected: ${connected})`);
          }
        } else {
          setState(prev => ({ 
            ...prev, 
            faceDetected: false,
            loopIterations: iteration
          }));
        }

        // Cleanup
        src.delete();
        gray.delete();
        faces.delete();
        minSize.delete();

      } catch (error: any) {
        console.error('[DEBUG] ❌ Detection error:', error);
      }
    };

    console.log('[DEBUG] 🎬 Starting RAF loop with Hz:', hzRef.current);
    detectLoop();
  }, [socket, connected]); // Removed hz from deps - using ref instead so loop doesn't restart

  const stopDetection = useCallback(() => {
    console.log('[DEBUG] 🛑 Stopping detection loop');
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }
    loopCountRef.current = 0;
    detectionCountRef.current = 0;
  }, []);

  // Handle start/stop
  const handleToggle = async () => {
    const newRunning = !state.isRunning;
    console.log('[DEBUG] 🔘 Toggle:', newRunning);

    isRunningRef.current = newRunning;
    setState(prev => ({ ...prev, isRunning: newRunning }));

    if (newRunning) {
      await startCamera();
      setTimeout(() => {
        if (isRunningRef.current && state.opencvReady) {
          startDetection();
        }
      }, 500);
    } else {
      stopDetection();
      stopCamera();
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#00d4ff', marginBottom: '1rem' }}>🐛 Face Tracker DEBUG (Clean Implementation)</h1>
      
      <div style={{ 
        padding: '1rem', 
        background: 'rgba(255, 165, 0, 0.1)', 
        border: '2px solid #ff9800',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff9800' }}>Purpose</h3>
        <p style={{ margin: 0 }}>
          Minimal face tracking implementation from scratch. No complex features, just core detection.
          If this works, the issue is in the main FaceTracker's added features.
          If this doesn't work, the issue is environmental (OpenCV, camera, browser).
        </p>
      </div>

      {state.error && (
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(255, 0, 0, 0.2)', 
          border: '2px solid red',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: 'red'
        }}>
          ❌ Error: {state.error}
        </div>
      )}

      {/* Status Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>OpenCV</div>
          <div style={{ fontSize: '1.5rem', color: state.opencvReady ? 'lime' : 'orange' }}>
            {state.opencvReady ? '✅' : '⏳'}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Camera</div>
          <div style={{ fontSize: '1.5rem', color: state.cameraReady ? 'lime' : 'orange' }}>
            {state.cameraReady ? '✅' : '⏳'}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Running</div>
          <div style={{ fontSize: '1.5rem', color: state.isRunning ? 'lime' : 'red' }}>
            {state.isRunning ? '🟢' : '🔴'}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Face Detected</div>
          <div style={{ fontSize: '1.5rem', color: state.faceDetected ? 'lime' : 'gray' }}>
            {state.faceDetected ? '✅' : '❌'}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Loop Iterations</div>
          <div style={{ fontSize: '1.2rem', color: '#00d4ff' }}>
            {state.loopIterations}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Detections Run</div>
          <div style={{ fontSize: '1.2rem', color: '#00d4ff' }}>
            {state.detections}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Pan</div>
          <div style={{ fontSize: '1.2rem', color: '#fff' }}>
            {state.pan}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Tilt</div>
          <div style={{ fontSize: '1.2rem', color: '#fff' }}>
            {state.tilt}
          </div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Socket</div>
          <div style={{ fontSize: '1.5rem', color: connected ? 'lime' : 'red' }}>
            {connected ? '✅' : '❌'}
          </div>
        </div>
      </div>

      {/* DMX/OSC Output Display */}
      <div style={{ 
        border: '2px solid #00d4ff', 
        borderRadius: '8px', 
        padding: '1rem', 
        background: 'rgba(0, 212, 255, 0.1)', 
        marginBottom: '1rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#00d4ff', fontSize: '1.1rem', fontWeight: 'bold' }}>
          📤 DMX/OSC Output
        </h3>
        {state.lastDmxMessage ? (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#00d4ff', marginBottom: '0.25rem' }}>Last DMX Message:</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px' }}>
              {state.lastDmxMessage.map((msg, idx) => (
                <div key={idx} style={{ color: '#fff' }}>
                  Channel {msg.channel}: {msg.value}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
              Pan: {state.pan} | Tilt: {state.tilt}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
            No DMX messages sent yet. {!featureFlags.enableFaceTracking && '(Face tracking disabled)'}
            {featureFlags.enableFaceTracking && !connected && ' (Socket not connected)'}
          </div>
        )}
        {state.lastOscMessage && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#00d4ff', marginBottom: '0.25rem' }}>Last OSC Message:</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', color: '#fff' }}>
              {state.lastOscMessage}
            </div>
          </div>
        )}
      </div>

      {/* Camera Preview and 3D Fixture */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem', 
        marginBottom: '1rem' 
      }}>
        {/* Camera Preview */}
        <div style={{ 
          border: '2px solid #00d4ff', 
          borderRadius: '8px', 
          padding: '0.5rem', 
          background: 'rgba(0, 212, 255, 0.1)' 
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#00d4ff' }}>
            Camera Preview
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <canvas
              ref={canvasRef}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* 3D Fixture Model */}
        <div style={{ 
          border: '2px solid #9b59b6', 
          borderRadius: '8px', 
          padding: '0.5rem', 
          background: 'rgba(155, 89, 182, 0.1)' 
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#9b59b6' }}>
            3D Fixture Model
          </div>
          {state.isRunning ? (
            <div style={{ width: '100%', aspectRatio: '1/1', minHeight: '300px' }}>
              <Fixture3DModel
                panValue={state.pan}
                tiltValue={state.tilt}
                rgbColor={{ r: 255, g: 200, b: 100 }}
                width={400}
                height={400}
              />
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              aspectRatio: '1/1', 
              minHeight: '300px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              color: '#888'
            }}>
              <span>3D fixture model will appear when Face Tracker is enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* DMX Channel Configuration */}
      <div style={{ 
        border: '2px solid #00d4ff', 
        borderRadius: '8px', 
        padding: '1rem', 
        background: 'rgba(0, 212, 255, 0.1)', 
        marginBottom: '1rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#00d4ff', fontSize: '1.1rem', fontWeight: 'bold' }}>
          📡 DMX Channel Configuration
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#00d4ff' }}>
          Configure which DMX channels to send values to (0-511). Uncheck to disable a channel.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* Pan Channel */}
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dmxChannels.pan >= 0}
                onChange={(e) => setDmxChannels(prev => ({ ...prev, pan: e.target.checked ? prev.pan >= 0 ? prev.pan : 0 : -1 }))}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>Pan Channel</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="range"
                min="0"
                max="511"
                value={dmxChannels.pan >= 0 ? dmxChannels.pan : 0}
                onChange={(e) => setDmxChannels(prev => ({ ...prev, pan: parseInt(e.target.value) }))}
                disabled={dmxChannels.pan < 0}
                style={{ flex: 1, cursor: dmxChannels.pan >= 0 ? 'pointer' : 'not-allowed', opacity: dmxChannels.pan >= 0 ? 1 : 0.5 }}
              />
              <span style={{ 
                fontSize: '0.9rem', 
                color: dmxChannels.pan >= 0 ? '#00d4ff' : '#888',
                minWidth: '45px',
                textAlign: 'right',
                fontFamily: 'monospace'
              }}>
                {dmxChannels.pan >= 0 ? dmxChannels.pan : 'OFF'}
              </span>
            </div>
          </div>

          {/* Tilt Channel */}
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dmxChannels.tilt >= 0}
                onChange={(e) => setDmxChannels(prev => ({ ...prev, tilt: e.target.checked ? prev.tilt >= 0 ? prev.tilt : 1 : -1 }))}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>Tilt Channel</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="range"
                min="0"
                max="511"
                value={dmxChannels.tilt >= 0 ? dmxChannels.tilt : 0}
                onChange={(e) => setDmxChannels(prev => ({ ...prev, tilt: parseInt(e.target.value) }))}
                disabled={dmxChannels.tilt < 0}
                style={{ flex: 1, cursor: dmxChannels.tilt >= 0 ? 'pointer' : 'not-allowed', opacity: dmxChannels.tilt >= 0 ? 1 : 0.5 }}
              />
              <span style={{ 
                fontSize: '0.9rem', 
                color: dmxChannels.tilt >= 0 ? '#00d4ff' : '#888',
                minWidth: '45px',
                textAlign: 'right',
                fontFamily: 'monospace'
              }}>
                {dmxChannels.tilt >= 0 ? dmxChannels.tilt : 'OFF'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Feature Flags - Debug Section */}
      <div style={{ 
        border: '2px solid #ff6b6b', 
        borderRadius: '8px', 
        padding: '1rem', 
        background: 'rgba(255, 107, 107, 0.1)', 
        marginBottom: '1rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff6b6b', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🔧 Feature Flags (Debug Mode)
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#ff6b6b' }}>
          Enable features one by one to isolate crashes. Start with all disabled, then enable one at a time.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={featureFlags.enableFaceTracking}
              onChange={(e) => setFeatureFlags(prev => ({ ...prev, enableFaceTracking: e.target.checked }))}
              title="Enable basic face tracking (pan/tilt). This is the core feature."
            />
            <span>Enable Face Tracking (Pan/Tilt)</span>
          </label>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={handleToggle}
          disabled={!state.opencvReady}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            background: state.isRunning ? '#f44336' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: state.opencvReady ? 'pointer' : 'not-allowed',
            opacity: state.opencvReady ? 1 : 0.5
          }}
        >
          {state.isRunning ? '🛑 STOP' : '▶️ START'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Detection Rate (Hz):</span>
          <input
            type="range"
            min="0.1"
            max="120"
            step="0.1"
            value={hz}
            onChange={(e) => {
              const newHz = parseFloat(e.target.value);
              console.log('[DEBUG] 🎛️ Hz slider changed to:', newHz);
              hzRef.current = newHz; // Update ref immediately so loop uses new value
              setHz(newHz);
            }}
            style={{ width: '200px' }}
          />
          <input
            type="number"
            min="0.1"
            max="120"
            step="0.1"
            value={hz}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value >= 0.1 && value <= 120) {
                console.log('[DEBUG] 🎛️ Hz input changed to:', value);
                hzRef.current = value; // Update ref immediately so loop uses new value
                setHz(value);
              }
            }}
            style={{ width: '60px' }}
          />
          <span>{hz.toFixed(1)} Hz</span>
        </label>
      </div>


      {/* Debug Info */}
      <div style={{ 
        padding: '1rem', 
        background: 'rgba(0,0,0,0.5)', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        <h3 style={{ marginTop: 0, color: '#00d4ff' }}>Debug Info</h3>
        <div>isRunning (state): {state.isRunning ? 'true' : 'false'}</div>
        <div>isRunning (ref): {isRunningRef.current ? 'true' : 'false'}</div>
        <div>RAF ID: {rafIdRef.current || 'none'}</div>
        <div>Loop Count (ref): {loopCountRef.current}</div>
        <div>Loop Count (state): {state.loopIterations}</div>
        <div>Detection Count: {detectionCountRef.current}</div>
        <div>Socket Connected: {connected ? 'true' : 'false'}</div>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,212,255,0.1)', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#00d4ff' }}>What to Look For:</h3>
        <ul style={{ margin: 0 }}>
          <li>✅ "Loop Iterations" should be increasing continuously (updates every second)</li>
          <li>✅ Console should show "🔄 Loop iteration #60, #120, #180..." every second</li>
          <li>✅ Console should show "🔍 RUNNING DETECTION" at your Hz rate</li>
          <li>✅ "Detections Run" should increase when faces are found</li>
          <li>❌ If "Loop Iterations" is 0 or not increasing = RAF loop not running</li>
          <li>❌ If isRunning keeps toggling = something is changing state repeatedly</li>
        </ul>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    cv: any;
  }
}

