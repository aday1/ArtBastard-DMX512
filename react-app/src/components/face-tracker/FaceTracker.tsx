import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './FaceTracker.module.scss';
import { FaceTrackerConfig } from './FaceTrackerConfig';

interface FaceTrackerState {
  isRunning: boolean;
  isInitialized: boolean;
  faceDetected: boolean;
  currentPan: number;
  currentTilt: number;
  fps: number;
  error: string | null;
}

interface FaceTrackerSettings {
  cameraIndex: number;
  updateRate: number;
  panSensitivity: number;
  tiltSensitivity: number;
  panOffset: number;
  tiltOffset: number;
  smoothingFactor: number;
  maxVelocity: number;
  brightness: number;
  contrast: number;
  cameraExposure: number;
  cameraBrightness: number;
  autoExposure: boolean;
  panChannel: number;
  tiltChannel: number;
  panMin: number;
  panMax: number;
  tiltMin: number;
  tiltMax: number;
  detectionThreshold: number;
  minFaceSize: number;
  maxFaceSize: number;
  cutoff: number; // Dead zone threshold (0-1)
  oscPanAddress: string;
  oscTiltAddress: string;
}

const DEFAULT_SETTINGS: FaceTrackerSettings = {
  cameraIndex: 0,
  updateRate: 30,
  panSensitivity: 1.0,
  tiltSensitivity: 1.0,
  panOffset: 128,
  tiltOffset: 128,
  smoothingFactor: 0.85,
  maxVelocity: 5.0,
  brightness: 1.0,
  contrast: 1.0,
  cameraExposure: -1,
  cameraBrightness: -1,
  autoExposure: true,
  panChannel: 1,
  tiltChannel: 2,
  panMin: 0,
  panMax: 255,
  tiltMin: 0,
  tiltMax: 255,
  detectionThreshold: 0.3,
  minFaceSize: 50,
  maxFaceSize: 500,
  cutoff: 0.05, // 5% dead zone
  oscPanAddress: '/face-tracker/pan',
  oscTiltAddress: '/face-tracker/tilt',
};

// Helper function to apply camera constraints with multiple fallback strategies
const applyCameraConstraints = async (
  track: MediaStreamTrack,
  capabilities: any,
  settings: FaceTrackerSettings,
  isInitial: boolean = false
): Promise<boolean> => {
  const constraints: any = {};
  let applied = false;
  
  // Try exposure with multiple property names and constraint types
  if (!settings.autoExposure && settings.cameraExposure >= -10) {
    const exposureValue = Math.max(-10, Math.min(10, settings.cameraExposure));
    
    // Strategy 1: Try exact exposure
    if (capabilities.exposure) {
      const exposureMin = capabilities.exposure?.min ?? -10;
      const exposureMax = capabilities.exposure?.max ?? 10;
      const clampedExposure = Math.max(exposureMin, Math.min(exposureMax, exposureValue));
      
      constraints.exposure = { exact: clampedExposure };
      if (capabilities.exposureMode && capabilities.exposureMode.includes('manual')) {
        constraints.exposureMode = 'manual';
      }
    }
    
    // Strategy 2: Try exposureCompensation
    if (capabilities.exposureCompensation) {
      const compMin = capabilities.exposureCompensation?.min ?? -2;
      const compMax = capabilities.exposureCompensation?.max ?? 2;
      const clampedComp = Math.max(compMin, Math.min(compMax, exposureValue / 5)); // Scale to compensation range
      constraints.exposureCompensation = { exact: clampedComp };
    }
    
    // Strategy 3: Try ideal exposure (more compatible)
    if (!constraints.exposure && !constraints.exposureCompensation) {
      constraints.exposure = { ideal: exposureValue };
    }
  } else if (settings.autoExposure) {
    // Auto exposure mode
    if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
      constraints.exposureMode = 'continuous';
    } else if (capabilities.exposureMode && capabilities.exposureMode.includes('auto')) {
      constraints.exposureMode = 'auto';
    }
  }
  
  // Try brightness
  if (settings.cameraBrightness >= -1) {
    const brightnessValue = Math.max(-1, Math.min(1, settings.cameraBrightness));
    
    if (capabilities.brightness) {
      const brightnessMin = capabilities.brightness?.min ?? -1;
      const brightnessMax = capabilities.brightness?.max ?? 1;
      const clampedBrightness = Math.max(brightnessMin, Math.min(brightnessMax, brightnessValue));
      
      // Try exact first, then ideal
      constraints.brightness = { exact: clampedBrightness };
    } else {
      // Fallback to ideal
      constraints.brightness = { ideal: brightnessValue };
    }
  }
  
  // Apply constraints
  if (Object.keys(constraints).length > 0) {
    try {
      await track.applyConstraints(constraints);
      console.log(`[FaceTracker] ${isInitial ? 'Initial' : 'Updated'} camera constraints:`, constraints);
      applied = true;
    } catch (err: any) {
      console.warn('[FaceTracker] Failed to apply constraints with exact values:', err, constraints);
      
      // Fallback: Try with ideal instead of exact
      const fallbackConstraints: any = {};
      if (constraints.exposure?.exact !== undefined) {
        fallbackConstraints.exposure = { ideal: constraints.exposure.exact };
      }
      if (constraints.exposureCompensation?.exact !== undefined) {
        fallbackConstraints.exposureCompensation = { ideal: constraints.exposureCompensation.exact };
      }
      if (constraints.brightness?.exact !== undefined) {
        fallbackConstraints.brightness = { ideal: constraints.brightness.exact };
      }
      if (constraints.exposureMode) {
        fallbackConstraints.exposureMode = constraints.exposureMode;
      }
      
      if (Object.keys(fallbackConstraints).length > 0) {
        try {
          await track.applyConstraints(fallbackConstraints);
          console.log('[FaceTracker] Applied constraints with ideal fallback:', fallbackConstraints);
          applied = true;
        } catch (fallbackErr: any) {
          console.warn('[FaceTracker] Fallback constraints also failed:', fallbackErr, fallbackConstraints);
        }
      }
    }
  }
  
  return applied;
};

export const FaceTracker: React.FC = () => {
  const { theme } = useTheme();
  const socket = useSocket();
  const { fixtures, selectedFixtures, toggleFixtureSelection, setDmxChannel } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [state, setState] = useState<FaceTrackerState>({
    isRunning: false,
    isInitialized: false,
    faceDetected: false,
    currentPan: 128,
    currentTilt: 128,
    fps: 0,
    error: null,
  });

  const [settings, setSettings] = useState<FaceTrackerSettings>(DEFAULT_SETTINGS);
  const [showConfig, setShowConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([]);

  // OpenCV.js state
  const opencvRef = useRef<any>(null);
  const cascadeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const smoothedPanRef = useRef<number>(0);
  const smoothedTiltRef = useRef<number>(0);
  const panVelocityRef = useRef<number>(0);
  const tiltVelocityRef = useRef<number>(0);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: Date.now() });

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCV = async () => {
      // Check if OpenCV is already loaded
      if (window.cv && window.cv.Mat) {
        opencvRef.current = window.cv;
        await initializeOpenCV();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="opencv"]');
      if (existingScript) {
        // Wait for it to load
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.cv && window.cv.Mat) {
            clearInterval(checkInterval);
            opencvRef.current = window.cv;
            initializeOpenCV();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setState(prev => ({ ...prev, error: 'OpenCV.js failed to initialize. Please refresh the page.' }));
          }
        }, 100);
        return;
      }

      // Load OpenCV.js script
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;
      script.onload = () => {
        if (window.cv) {
          opencvRef.current = window.cv;
          // OpenCV.js uses onRuntimeInitialized callback
          if (window.cv.onRuntimeInitialized) {
            window.cv.onRuntimeInitialized = () => {
              console.log('[FaceTracker] OpenCV.js runtime initialized');
              initializeOpenCV();
            };
          } else {
            // Fallback: wait for Mat to be available
            let attempts = 0;
            const maxAttempts = 50;
            const checkInterval = setInterval(() => {
              attempts++;
              if (window.cv && window.cv.Mat) {
                clearInterval(checkInterval);
                console.log('[FaceTracker] OpenCV.js loaded (fallback method)');
                initializeOpenCV();
              } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                setState(prev => ({ ...prev, error: 'OpenCV.js runtime initialization timeout. Please refresh the page.' }));
              }
            }, 100);
          }
        } else {
          setState(prev => ({ ...prev, error: 'OpenCV.js script loaded but cv object not found.' }));
        }
      };
      script.onerror = () => {
        setState(prev => ({ ...prev, error: 'Failed to load OpenCV.js. Please check your internet connection and try refreshing.' }));
      };
      document.body.appendChild(script);
    };

    loadOpenCV();
  }, []);

  const initializeOpenCV = async () => {
    try {
      if (!opencvRef.current || !opencvRef.current.CascadeClassifier) {
        throw new Error('OpenCV not loaded');
      }

      // Load face cascade classifier
      let text: string;
      try {
        const response = await fetch('/haarcascade_frontalface_alt.xml');
        if (!response.ok) {
          throw new Error('Not found');
        }
        text = await response.text();
      } catch {
        // Try alternative path
        const altResponse = await fetch('/face-tracker/haarcascade_frontalface_alt.xml');
        if (!altResponse.ok) {
          throw new Error('Failed to load face cascade classifier. Please ensure haarcascade_frontalface_alt.xml is in the public directory.');
        }
        text = await altResponse.text();
      }

      // Write to OpenCV filesystem
      opencvRef.current.FS.writeFile('haarcascade_frontalface_alt.xml', text);

      cascadeRef.current = new opencvRef.current.CascadeClassifier();
      cascadeRef.current.load('haarcascade_frontalface_alt.xml');
      
      setState(prev => ({ ...prev, isInitialized: true, error: null }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: `Failed to initialize OpenCV: ${error?.message || error}` }));
    }
  };

  // Start/stop camera
  const startCamera = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No video devices found');
      }

      const deviceId = videoDevices[settings.cameraIndex]?.deviceId || videoDevices[0].deviceId;
      
      // Build constraints with exposure/brightness if we have values
      const videoConstraints: any = {
        deviceId: deviceId ? { ideal: deviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: { ideal: 'user' },
      };
      
      // Try to add exposure/brightness to initial constraints
      // Many cameras need these set at stream creation, not after
      if (!settings.autoExposure && settings.cameraExposure >= -10) {
        // Try multiple exposure property names
        videoConstraints.exposure = { ideal: settings.cameraExposure };
        videoConstraints.exposureCompensation = { ideal: settings.cameraExposure };
      }
      
      if (settings.cameraBrightness >= -1) {
        videoConstraints.brightness = { ideal: settings.cameraBrightness };
      }
      
      // Try to get stream with constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints
        });
      } catch (error) {
        // If that fails, try with minimal constraints
        console.warn('[FaceTracker] Failed with advanced constraints, trying minimal:', error);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? { ideal: deviceId } : undefined
          }
        });
      }
      
      // After getting the stream, try to apply exposure/brightness if supported
      if (stream && stream.getVideoTracks().length > 0) {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        const settings_ = track.getSettings() as any;
        
        // Log capabilities and current settings for debugging
        console.log('[FaceTracker] Camera capabilities:', {
          exposure: capabilities.exposure,
          exposureMode: capabilities.exposureMode,
          exposureCompensation: capabilities.exposureCompensation,
          brightness: capabilities.brightness,
          whiteBalanceMode: capabilities.whiteBalanceMode,
          iso: capabilities.iso,
          torch: capabilities.torch,
        });
        console.log('[FaceTracker] Current camera settings:', {
          exposure: settings_.exposure,
          exposureMode: settings_.exposureMode,
          exposureCompensation: settings_.exposureCompensation,
          brightness: settings_.brightness,
        });
        
        // Store capabilities in ref for later use
        (track as any)._faceTrackerCapabilities = capabilities;
        (track as any)._faceTrackerSettings = settings_;
        
        // Try to apply constraints with multiple fallback strategies
        await applyCameraConstraints(track, capabilities, settings, true);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setState(prev => ({ ...prev, isRunning: true, error: null }));
      startTracking();
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to start camera: ${error}`, isRunning: false }));
    }
  }, [settings.cameraIndex, settings.autoExposure, settings.cameraExposure, settings.cameraBrightness]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState(prev => ({ ...prev, isRunning: false, faceDetected: false }));
  }, []);

  // Face tracking loop
  const startTracking = useCallback(() => {
    if (!opencvRef.current || !cascadeRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const processFrame = () => {
      // Wrap entire frame processing in try-catch to prevent crashes
      try {
        if (!state.isRunning || !videoRef.current || !canvasRef.current) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        // Update FPS counter
        const now = Date.now();
        fpsCounterRef.current.frames++;
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          setState(prev => ({ ...prev, fps: fpsCounterRef.current.frames }));
          fpsCounterRef.current.frames = 0;
          fpsCounterRef.current.lastTime = now;
        }

        // Draw video frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Apply brightness/contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * settings.contrast + (settings.brightness - 1) * 127);     // R
          data[i + 1] = Math.min(255, data[i + 1] * settings.contrast + (settings.brightness - 1) * 127); // G
          data[i + 2] = Math.min(255, data[i + 2] * settings.contrast + (settings.brightness - 1) * 127); // B
        }
        ctx.putImageData(imageData, 0, 0);

        // Convert to OpenCV Mat
        const src = opencvRef.current.imread(canvas);
        const gray = new opencvRef.current.Mat();
        opencvRef.current.cvtColor(src, gray, opencvRef.current.COLOR_RGBA2GRAY);

        // Detect faces - improved parameters for low-light detection
        const faces = new opencvRef.current.RectVector();
        const minSize = settings.minFaceSize || 30; // Smaller min size for better detection in low light
        const maxSize = settings.maxFaceSize || 500;
        const msize = new opencvRef.current.Size(minSize, minSize);
        const maxSizeObj = new opencvRef.current.Size(maxSize, maxSize);
        
        // Use detectMultiScale with improved parameters for low-light face detection
        // scaleFactor: 1.05 (smaller = more scales checked, better detection but slower)
        // minNeighbors: 2 (lower = more detections, better for low light)
        cascadeRef.current.detectMultiScale(gray, faces, 1.05, 2, 0, msize, maxSizeObj);

        let faceDetected = false;
        if (faces.size() > 0) {
          try {
            faceDetected = true;
            const face = faces.get(0);
            
            // Validate face dimensions to prevent crashes
            if (!face || face.width <= 0 || face.height <= 0 || 
                face.x < 0 || face.y < 0 || 
                face.x + face.width > canvas.width || 
                face.y + face.height > canvas.height) {
              console.warn('[FaceTracker] Invalid face dimensions, skipping:', face);
              faceDetected = false;
            } else {
              // Calculate face center
              const faceCenterX = face.x + face.width / 2;
              const faceCenterY = face.y + face.height / 2;
              const imageCenterX = canvas.width / 2;
              const imageCenterY = canvas.height / 2;

              // Calculate pan/tilt offsets
              const pan = (faceCenterX - imageCenterX) / imageCenterX;
              const tilt = (faceCenterY - imageCenterY) / imageCenterY;

              // Apply cutoff (dead zone) - ignore small movements
              const panAbs = Math.abs(pan);
              const tiltAbs = Math.abs(tilt);
              const effectivePan = panAbs > settings.cutoff ? pan : 0;
              const effectiveTilt = tiltAbs > settings.cutoff ? tilt : 0;

              // Apply smoothing
              const panDiff = effectivePan - smoothedPanRef.current;
              panVelocityRef.current = panVelocityRef.current * settings.smoothingFactor + panDiff * (1 - settings.smoothingFactor);
              panVelocityRef.current = Math.max(-settings.maxVelocity / 127, Math.min(settings.maxVelocity / 127, panVelocityRef.current));
              smoothedPanRef.current += panVelocityRef.current;

              const tiltDiff = effectiveTilt - smoothedTiltRef.current;
              tiltVelocityRef.current = tiltVelocityRef.current * settings.smoothingFactor + tiltDiff * (1 - settings.smoothingFactor);
              tiltVelocityRef.current = Math.max(-settings.maxVelocity / 127, Math.min(settings.maxVelocity / 127, tiltVelocityRef.current));
              smoothedTiltRef.current += tiltVelocityRef.current;

              // Map to DMX values
              const panValue = Math.round(
                Math.max(settings.panMin, Math.min(settings.panMax,
                  smoothedPanRef.current * settings.panSensitivity * 127 + settings.panOffset
                ))
              );
              const tiltValue = Math.round(
                Math.max(settings.tiltMin, Math.min(settings.tiltMax,
                  smoothedTiltRef.current * settings.tiltSensitivity * 127 + settings.tiltOffset
                ))
              );

              // Draw face rectangle and center point on the source image
              // Color format: [B, G, R, A] for OpenCV
              try {
                const point1 = new opencvRef.current.Point(face.x, face.y);
                const point2 = new opencvRef.current.Point(face.x + face.width, face.y + face.height);
                
                // Draw rectangle with bright orange color [B, G, R, A]
                opencvRef.current.rectangle(src, point1, point2, [0, 165, 255, 255], 3);
                opencvRef.current.rectangle(src, point1, point2, [0, 200, 255, 255], 1);

                // Draw center point (yellow circle)
                const center = new opencvRef.current.Point(faceCenterX, faceCenterY);
                opencvRef.current.circle(src, center, 8, [0, 255, 255, 255], 2);
                opencvRef.current.circle(src, center, 3, [0, 255, 255, 255], -1);
                
                // Draw crosshair at image center (red)
                const centerPoint1 = new opencvRef.current.Point(imageCenterX - 30, imageCenterY);
                const centerPoint2 = new opencvRef.current.Point(imageCenterX + 30, imageCenterY);
                const centerPoint3 = new opencvRef.current.Point(imageCenterX, imageCenterY - 30);
                const centerPoint4 = new opencvRef.current.Point(imageCenterX, imageCenterY + 30);
                const imgCenter = new opencvRef.current.Point(imageCenterX, imageCenterY);
                
                opencvRef.current.line(src, centerPoint1, centerPoint2, [0, 0, 255, 255], 2);
                opencvRef.current.line(src, centerPoint3, centerPoint4, [0, 0, 255, 255], 2);
                
                // Draw line from face center to image center
                opencvRef.current.line(src, center, imgCenter, [0, 255, 0, 255], 1);
                
                // Cleanup Point objects to prevent memory leaks
                point1.delete();
                point2.delete();
                center.delete();
                centerPoint1.delete();
                centerPoint2.delete();
                centerPoint3.delete();
                centerPoint4.delete();
                imgCenter.delete();
              } catch (drawError) {
                console.error('[FaceTracker] Error drawing face overlay:', drawError);
              }

              // Send DMX update
              const now = Date.now();
              const updateInterval = 1000 / settings.updateRate;
              if (now - lastUpdateRef.current >= updateInterval) {
                try {
                  // Apply to selected fixtures or direct channels
                  const dmxUpdates: Record<number, number> = {};
                  
                  if (selectedFixtureIds.length > 0) {
                    // Apply to selected fixtures
                    fixtures.forEach(fixture => {
                      if (selectedFixtureIds.includes(fixture.id)) {
                        const panCh = fixture.channels.find(c => c.name.toLowerCase().includes('pan') || c.type === 'pan');
                        const tiltCh = fixture.channels.find(c => c.name.toLowerCase().includes('tilt') || c.type === 'tilt');
                        
                        if (panCh) {
                          const panChannelIndex = fixture.channels.indexOf(panCh);
                          const panDmxAddress = panCh.dmxAddress ?? (fixture.startAddress + panChannelIndex);
                          dmxUpdates[panDmxAddress - 1] = panValue; // Convert to 0-based index
                        }
                        
                        if (tiltCh) {
                          const tiltChannelIndex = fixture.channels.indexOf(tiltCh);
                          const tiltDmxAddress = tiltCh.dmxAddress ?? (fixture.startAddress + tiltChannelIndex);
                          dmxUpdates[tiltDmxAddress - 1] = tiltValue; // Convert to 0-based index
                        }
                      }
                    });
                  } else {
                    // Use configured channels
                    dmxUpdates[settings.panChannel - 1] = panValue;
                    dmxUpdates[settings.tiltChannel - 1] = tiltValue;
                  }

                  // Send via socket or HTTP
                  if (socket && socket.connected) {
                    (socket as any).emit('dmx:batch', dmxUpdates);
                    
                    // Also send OSC if addresses are configured
                    if (settings.oscPanAddress) {
                      (socket as any).emit('osc-send', {
                        address: settings.oscPanAddress,
                        args: [{ type: 'f', value: panValue / 255.0 }]
                      });
                    }
                    if (settings.oscTiltAddress) {
                      (socket as any).emit('osc-send', {
                        address: settings.oscTiltAddress,
                        args: [{ type: 'f', value: tiltValue / 255.0 }]
                      });
                    }
                  } else {
                    // Fallback to HTTP API
                    fetch('/api/dmx/batch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(dmxUpdates),
                    }).catch(console.error);
                  }
                  
                  lastUpdateRef.current = now;
                  setState(prev => ({ ...prev, currentPan: panValue, currentTilt: tiltValue }));
                } catch (dmxError) {
                  console.error('[FaceTracker] Error sending DMX update:', dmxError);
                }
              }

              setState(prev => ({ ...prev, faceDetected: true }));
            }
          } catch (faceError) {
            console.error('[FaceTracker] Error processing face:', faceError);
            faceDetected = false;
          }
        } else {
          setState(prev => ({ ...prev, faceDetected: false }));
        }

        // Draw on canvas - MUST draw before cleanup
        if (showPreview && canvas && ctx) {
          try {
            // Convert OpenCV Mat to canvas - this draws the video frame with face detection overlays
            opencvRef.current.imshow(canvas, src);
            
            // Draw text overlay on top of the OpenCV image
            ctx.fillStyle = 'yellow';
            ctx.font = 'bold 20px Arial';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            const panText = `Pan: ${state.currentPan}`;
            const tiltText = `Tilt: ${state.currentTilt}`;
            const statusText = faceDetected ? '✓ Face Detected' : 'No Face';
            
            // Draw with outline for better visibility
            ctx.strokeText(panText, 10, 30);
            ctx.fillText(panText, 10, 30);
            
            ctx.strokeText(tiltText, 10, 55);
            ctx.fillText(tiltText, 10, 55);
            
            ctx.fillStyle = faceDetected ? 'lime' : 'red';
            ctx.strokeText(statusText, 10, 80);
            ctx.fillText(statusText, 10, 80);
          } catch (drawError) {
            console.error('[FaceTracker] Error drawing canvas:', drawError);
          }
        }

        // Cleanup OpenCV objects - CRITICAL to prevent memory leaks
        try {
          if (src && !src.isDeleted()) src.delete();
          if (gray && !gray.isDeleted()) gray.delete();
          if (faces && !faces.isDeleted()) faces.delete();
          if (msize && !msize.isDeleted()) msize.delete();
          if (maxSizeObj && !maxSizeObj.isDeleted()) maxSizeObj.delete();
        } catch (cleanupError) {
          console.error('[FaceTracker] Error during cleanup:', cleanupError);
        }

        // Always continue the animation loop, even if there was an error
        animationFrameRef.current = requestAnimationFrame(processFrame);
        } catch (error) {
          // Catch any unhandled errors and log them
          console.error('[FaceTracker] Frame processing error:', error);
          // Ensure we continue the loop even after an error
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
      };

    processFrame();
  }, [state.isRunning, settings, showPreview, socket, state.currentPan, state.currentTilt]);

  useEffect(() => {
    if (state.isRunning && state.isInitialized) {
      startTracking();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isRunning, state.isInitialized, startTracking]);

  const updateSetting = (key: keyof FaceTrackerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.faceTracker}>
      <div className={styles.header}>
        <h2 className={styles.title}>Face Tracker</h2>
        <div className={styles.controls}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={styles.configButton}
          >
            {showConfig ? 'Hide Config' : 'Show Config'}
          </button>
          <button
            onClick={state.isRunning ? stopCamera : startCamera}
            className={`${styles.startButton} ${state.isRunning ? styles.stopButton : ''}`}
            disabled={!state.isInitialized}
          >
            {state.isRunning ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {state.error && (
        <div className={styles.error}>{state.error}</div>
      )}

      {showConfig && (
        <div className={styles.configPanel}>
          <div className={styles.quickControls}>
            <div className={styles.controlGroup}>
              <label>Camera Index</label>
              <input
                type="number"
                min="0"
                max="10"
                value={settings.cameraIndex}
                onChange={(e) => updateSetting('cameraIndex', parseInt(e.target.value))}
                disabled={state.isRunning}
              />
            </div>
            <div className={styles.controlGroup}>
              <label>Brightness</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={settings.brightness}
                  onChange={(e) => updateSetting('brightness', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{settings.brightness.toFixed(1)}</span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label>Contrast</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={settings.contrast}
                  onChange={(e) => updateSetting('contrast', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{settings.contrast.toFixed(1)}</span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label>Pan Sensitivity</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={settings.panSensitivity}
                  onChange={(e) => updateSetting('panSensitivity', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{settings.panSensitivity.toFixed(1)}</span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label>Tilt Sensitivity</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={settings.tiltSensitivity}
                  onChange={(e) => updateSetting('tiltSensitivity', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{settings.tiltSensitivity.toFixed(1)}</span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label>Smoothing</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.smoothingFactor}
                  onChange={(e) => updateSetting('smoothingFactor', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{settings.smoothingFactor.toFixed(2)}</span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label>Cutoff (Dead Zone)</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={settings.cutoff}
                  onChange={(e) => updateSetting('cutoff', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{(settings.cutoff * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                />
                Show Preview
              </label>
            </div>
          </div>
        </div>
      )}

      {/* OSC Endpoint Display */}
      <div className={styles.oscEndpoints}>
        <h4>OSC Endpoints</h4>
        <div className={styles.endpointList}>
          <div className={styles.endpointItem}>
            <LucideIcon name="Globe" className={styles.endpointIcon} />
            <span className={styles.endpointLabel}>Pan:</span>
            <code className={styles.endpointAddress}>{settings.oscPanAddress}</code>
          </div>
          <div className={styles.endpointItem}>
            <LucideIcon name="Globe" className={styles.endpointIcon} />
            <span className={styles.endpointLabel}>Tilt:</span>
            <code className={styles.endpointAddress}>{settings.oscTiltAddress}</code>
          </div>
        </div>
      </div>

      {/* Fixture Selection */}
      <div className={styles.fixtureSelection}>
        <h4>Target Fixtures</h4>
        <div className={styles.fixtureList}>
          {fixtures.length === 0 ? (
            <div className={styles.noFixtures}>No fixtures available</div>
          ) : (
            fixtures.map(fixture => {
              const isSelected = selectedFixtureIds.includes(fixture.id);
              const panCh = fixture.channels.find(c => c.name.toLowerCase().includes('pan') || c.type === 'pan');
              const tiltCh = fixture.channels.find(c => c.name.toLowerCase().includes('tilt') || c.type === 'tilt');
              
              // Calculate DMX addresses for display
              const panDmxAddress = panCh 
                ? (panCh.dmxAddress ?? (fixture.startAddress + fixture.channels.indexOf(panCh)))
                : null;
              const tiltDmxAddress = tiltCh
                ? (tiltCh.dmxAddress ?? (fixture.startAddress + fixture.channels.indexOf(tiltCh)))
                : null;
              
              return (
                <div
                  key={fixture.id}
                  className={`${styles.fixtureItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedFixtureIds(prev => 
                      prev.includes(fixture.id)
                        ? prev.filter(id => id !== fixture.id)
                        : [...prev, fixture.id]
                    );
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={styles.fixtureName}>{fixture.name}</span>
                  {panDmxAddress && <span className={styles.channelInfo}>Pan: CH{panDmxAddress}</span>}
                  {tiltDmxAddress && <span className={styles.channelInfo}>Tilt: CH{tiltDmxAddress}</span>}
                  {!panDmxAddress && !tiltDmxAddress && <span className={styles.channelInfo}>No pan/tilt channels</span>}
                </div>
              );
            })
          )}
        </div>
        {selectedFixtureIds.length > 0 && (
          <div className={styles.fixtureHint}>
            Tracking will apply to {selectedFixtureIds.length} selected fixture(s)
          </div>
        )}
      </div>

      <div className={styles.previewContainer}>
        {showPreview ? (
          <>
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className={styles.canvas}
            />
          </>
        ) : (
          <div className={styles.noPreview}>Preview disabled</div>
        )}
        
        <div className={styles.previewControls}>
          <div className={styles.cameraControls}>
            <h4 className={styles.controlsTitle}>Camera Settings</h4>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                <input
                  type="checkbox"
                  checked={settings.autoExposure}
                  onChange={async (e) => {
                    updateSetting('autoExposure', e.target.checked);
                    // When toggling auto exposure, reapply camera constraints
                    if (state.isRunning && streamRef.current) {
                      const track = streamRef.current.getVideoTracks()[0];
                      if (track) {
                        const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                        const updatedSettings = { ...settings, autoExposure: e.target.checked };
                        const success = await applyCameraConstraints(track, capabilities, updatedSettings, false);
                        if (!success) {
                          console.warn('[FaceTracker] Could not toggle auto exposure. Your camera may not support exposure control via browser API.');
                        }
                      }
                    }
                  }}
                />
                Auto Exposure
              </label>
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                Exposure {settings.autoExposure ? '(Manual Override)' : '(Manual)'}
              </label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={settings.cameraExposure >= 0 ? settings.cameraExposure : 0}
                  onChange={async (e) => {
                    const value = parseFloat(e.target.value);
                    updateSetting('cameraExposure', value);
                    // Apply exposure change immediately if camera is running
                    // Even if auto exposure is enabled, allow manual override
                    if (state.isRunning && streamRef.current) {
                      const track = streamRef.current.getVideoTracks()[0];
                      if (track) {
                        const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                        const updatedSettings = { ...settings, cameraExposure: value };
                        const success = await applyCameraConstraints(track, capabilities, updatedSettings, false);
                        if (!success) {
                          console.warn('[FaceTracker] Could not apply exposure. Your camera may not support exposure control via browser API.');
                          console.warn('[FaceTracker] Try adjusting the Brightness slider instead, or use OS-level camera settings.');
                        }
                      }
                    }
                  }}
                  disabled={!state.isRunning}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>
                  {settings.cameraExposure >= 0 ? settings.cameraExposure.toFixed(1) : 'Auto'}
                </span>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Brightness (Camera)</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={settings.cameraBrightness >= 0 ? settings.cameraBrightness : 0}
                  onChange={async (e) => {
                    const value = parseFloat(e.target.value);
                    updateSetting('cameraBrightness', value);
                    // Apply brightness change immediately if camera is running
                    if (state.isRunning && streamRef.current) {
                      const track = streamRef.current.getVideoTracks()[0];
                      if (track) {
                        const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                        const updatedSettings = { ...settings, cameraBrightness: value };
                        const success = await applyCameraConstraints(track, capabilities, updatedSettings, false);
                        if (!success) {
                          console.warn('[FaceTracker] Could not apply brightness. Your camera may not support brightness control via browser API.');
                          console.warn('[FaceTracker] Try adjusting the Brightness slider (software) instead, or use OS-level camera settings.');
                        }
                      }
                    }
                  }}
                  disabled={!state.isRunning}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>
                  {settings.cameraBrightness >= 0 ? settings.cameraBrightness.toFixed(1) : 'Auto'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.status}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Status:</span>
            <span className={state.isRunning ? styles.running : styles.stopped}>
              {state.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Face:</span>
            <span className={state.faceDetected ? styles.detected : styles.notDetected}>
              {state.faceDetected ? 'Detected' : 'Not Detected'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Pan:</span>
            <span>{state.currentPan}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Tilt:</span>
            <span>{state.currentTilt}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>FPS:</span>
            <span>{state.fps}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extend Window interface for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}

export default FaceTracker;

