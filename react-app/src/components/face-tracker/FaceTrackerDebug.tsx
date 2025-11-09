/**
 * FaceTracker Debug - Minimal implementation from scratch
 * Purpose: Identify what's breaking the main FaceTracker
 * Features: Only camera + OpenCV + basic detection + extensive logging
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';

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
}

export const FaceTrackerDebug: React.FC = () => {
  const { socket, connected } = useSocket();
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
    error: null
  });

  const [hz, setHz] = useState<number>(10);
  const hzRef = useRef<number>(10); // Ref to track current Hz for the loop

  // Keep hzRef in sync with hz state
  useEffect(() => {
    hzRef.current = hz;
    console.log('[DEBUG] 🔄 Hz ref synced to:', hz);
  }, [hz]);

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
        const minSize = new opencvRef.current.Size(30, 30);
        
        cascadeRef.current.detectMultiScale(gray, faces, 1.1, 3, 0, minSize);

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

          const pan = (faceCenterX - imageCenterX) / imageCenterX;
          const tilt = -(faceCenterY - imageCenterY) / imageCenterY;

          const panValue = Math.round(Math.max(0, Math.min(255, pan * 127 + 128)));
          const tiltValue = Math.round(Math.max(0, Math.min(255, tilt * 127 + 128)));

          console.log(`[DEBUG] ✅ Face at (${faceCenterX.toFixed(0)}, ${faceCenterY.toFixed(0)}), Pan: ${panValue}, Tilt: ${tiltValue}`);

          setState(prev => ({ 
            ...prev, 
            faceDetected: true, 
            pan: panValue, 
            tilt: tiltValue,
            loopIterations: iteration,
            detections: detectionCountRef.current
          }));

          // Draw face box
          ctx.strokeStyle = 'lime';
          ctx.lineWidth = 2;
          ctx.strokeRect(face.x * scaleX, face.y * scaleY, face.width * scaleX, face.height * scaleY);
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          ctx.arc(faceCenterX, faceCenterY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Send DMX
          if (socket && connected) {
            (socket as any).emit('dmx:batch', { 0: panValue, 1: tiltValue });
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

      {/* Video/Canvas */}
      <div style={{ position: 'relative', maxWidth: '640px', marginBottom: '1rem' }}>
        <video ref={videoRef} style={{ display: 'none' }} />
        <canvas 
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: 'auto', 
            border: '3px solid ' + (state.isRunning ? 'lime' : '#666'),
            borderRadius: '8px',
            background: '#000'
          }} 
        />
        {!state.cameraReady && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '1.5rem',
            textAlign: 'center'
          }}>
            {state.isRunning ? '⏳ Loading...' : '📷 Click START'}
          </div>
        )}
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

