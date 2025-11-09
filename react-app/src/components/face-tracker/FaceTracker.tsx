import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import { Fixture3DModel } from './Fixture3DModel';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './FaceTracker.module.scss';

interface FaceTrackerState {
  isRunning: boolean;
  isInitialized: boolean;
  faceDetected: boolean;
  currentPan: number;
  currentTilt: number;
  currentX: number; // X position (0-255)
  currentY: number; // Y position (0-255)
  currentIris: number; // Iris value (0-255)
  currentZoom: number; // Zoom value (0-255)
  fps: number; // Overall FPS (legacy)
  webcamFps: number; // Webcam capture FPS
  overlayFps: number; // Overlay drawing FPS
  opencvHz: number; // OpenCV processing Hz (detections per second)
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
  irisChannel: number;
  zoomChannel: number;
  focusChannel: number;
  shutterChannel: number; // DMX channel for shutter control (0 = disabled)
  goboChannel: number; // DMX channel for gobo selection (0 = disabled)
  panMin: number;
  panMax: number;
  tiltMin: number;
  tiltMax: number;
  irisMin: number;
  irisMax: number;
  zoomMin: number;
  zoomMax: number;
  focusMin: number;
  focusMax: number;
  panScale: number;
  tiltScale: number;
  panDeadZone: number;
  tiltDeadZone: number;
  panLimit: number;
  tiltLimit: number;
  panGear: number;
  tiltGear: number;
  detectionThreshold: number;
  minFaceSize: number;
  maxFaceSize: number;
  cutoff: number; // Dead zone threshold (0-1)
  oscPanAddress: string;
  oscTiltAddress: string;
  useOSC: boolean;
  useArtBastardOSC: boolean; // Use ArtBastard's OSC server vs custom
  oscHost: string;
  oscPort: number;
  oscSmoothing: number; // Throttle/debounce OSC messages (0-1000ms)
  flipPan: boolean; // Invert pan direction
  flipTilt: boolean; // Invert tilt direction
  flipMouth: boolean; // Invert mouth direction (closed=open, open=closed)
  flipEyes: boolean; // Invert eyes/iris direction (open=closed, closed=open)
  delay: number; // Delay in milliseconds (0-2000ms) for telegram effect
  // X/Y Position tracking (for fixture following)
  xPositionChannel: number; // DMX channel for X position (0 = disabled)
  yPositionChannel: number; // DMX channel for Y position (0 = disabled)
  xPositionMin: number;
  xPositionMax: number;
  yPositionMin: number;
  yPositionMax: number;
  // OpenCV detection settings
  opencvHz: number; // OpenCV detection rate in Hz (0.1-120, default 1 Hz = 1 detection per second)
  opencvScaleFactor: number; // OpenCV scale factor (1.05-1.5, default 1.05)
  opencvMinNeighbors: number; // OpenCV min neighbors (1-10, default 2)
  opencvMinSize: number; // OpenCV minimum face size (20-100, default 30)
  // Zoom settings
  zoomSensitivity: number; // How sensitive zoom is to face size changes (0-2)
  zoomScale: number; // Scale factor for zoom (0.5-2.0)
  zoomDeadZone: number; // Dead zone for zoom (0-50)
}

const DEFAULT_SETTINGS: FaceTrackerSettings = {
  cameraIndex: 0,
  updateRate: 30, // Good default: smooth updates without excessive CPU
  panSensitivity: 1.0,
  tiltSensitivity: 1.0,
  panOffset: 128, // Center position (good default)
  tiltOffset: 128, // Center position (good default)
  smoothingFactor: 0.85,
  maxVelocity: 3.0, // Good default: prevents overshooting while allowing responsive movement
  brightness: 1.0,
  contrast: 1.0,
  cameraExposure: -1,
  cameraBrightness: -1,
  autoExposure: true,
  panChannel: 1,
  tiltChannel: 2,
  irisChannel: 0,
  zoomChannel: 0,
  focusChannel: 0,
  shutterChannel: 0, // Disabled by default
  goboChannel: 0, // Disabled by default
  panMin: 0,
  panMax: 255,
  tiltMin: 0,
  tiltMax: 255,
  irisMin: 0,
  irisMax: 255,
  zoomMin: 0,
  zoomMax: 255,
  focusMin: 0,
  focusMax: 255,
  panScale: 1.0,
  tiltScale: 1.0,
  panDeadZone: 0.0,
  tiltDeadZone: 0.0,
  panLimit: 1.0,
  tiltLimit: 1.0,
  panGear: 1.0,
  tiltGear: 1.0,
  detectionThreshold: 0.3,
  minFaceSize: 50,
  maxFaceSize: 500,
  cutoff: 0.02, // 2% dead zone (reduced for better sensitivity)
  oscPanAddress: '/face-tracker/pan',
  oscTiltAddress: '/face-tracker/tilt',
  useOSC: false,
  useArtBastardOSC: true, // Default to using ArtBastard's OSC server
  oscHost: '127.0.0.1',
  oscPort: 8000, // Default to ArtBastard's OSC incoming port
  oscSmoothing: 50, // Default: throttle OSC messages to max 20 per second (50ms interval)
  flipPan: false, // Don't flip pan by default
  flipTilt: false, // Don't flip tilt by default
  flipMouth: false, // Don't flip mouth by default
  flipEyes: false, // Don't flip eyes/iris by default
  delay: 0, // No delay by default (0-2000ms)
  // X/Y Position tracking defaults
  xPositionChannel: 0, // Disabled by default
  yPositionChannel: 0, // Disabled by default
  xPositionMin: 0,
  xPositionMax: 255,
  yPositionMin: 0,
  yPositionMax: 255,
  // OpenCV detection defaults
  opencvHz: 1, // Default: 1 Hz for detection (1 detection per second)
  opencvScaleFactor: 1.05, // Default: 1.05 (more accurate, slower)
  opencvMinNeighbors: 2, // Default: 2 (more detections, better for low light)
  opencvMinSize: 30, // Default: 30 pixels minimum face size
  // Zoom settings defaults
  zoomSensitivity: 1.0, // Default: normal sensitivity
  zoomScale: 1.0, // Default: no scaling
  zoomDeadZone: 5, // Default: 5 pixel dead zone
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

// Helper function to calculate variance for gesture detection
const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
};

// Helper function to calculate region brightness (average grayscale value)
const calculateRegionBrightness = (imageData: ImageData): number => {
  const data = imageData.data;
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert RGB to grayscale
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    count++;
  }
  
  return count > 0 ? sum / count : 0;
};

// Removed: Eye, mouth, tongue, hand, and gesture detection functions (all removed per user request)

export const FaceTracker: React.FC = () => {
  const { theme } = useTheme();
  const { socket, connected: socketConnected } = useSocket();
  const oscAssignments = useStore((state) => state.oscAssignments);
  const { fixtures, selectedFixtures, toggleFixtureSelection, setDmxChannel } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const detectionFrameRef = useRef<number | undefined>(undefined);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previewFrameRef = useRef<number | undefined>(undefined);
  const trackingStartedRef = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(false); // Ref for isRunning to avoid stale closures
  const opencvHzRef = useRef<number>(1); // Ref for Hz to avoid stale closures and allow real-time updates
  
  const [state, setState] = useState<FaceTrackerState>({
    isRunning: false,
    isInitialized: false,
    faceDetected: false,
    currentPan: 128,
    currentTilt: 128,
    currentX: 128,
    currentY: 128,
    currentIris: 128,
    currentZoom: 128,
    fps: 0,
    webcamFps: 0,
    overlayFps: 0,
    opencvHz: 0,
    error: null,
  });

  // Keep isRunningRef in sync with state.isRunning
  useEffect(() => {
    isRunningRef.current = state.isRunning;
    console.log('[FaceTracker] ⚠️ isRunning STATE CHANGED:', state.isRunning);
  }, [state.isRunning]);

  // Diagnostic state
  const [diagnostics, setDiagnostics] = useState({
    opencvStatus: 'loading' as 'loading' | 'ready' | 'error',
    opencvError: null as string | null,
    cameraStatus: 'stopped' as 'stopped' | 'starting' | 'running' | 'error',
    cameraError: null as string | null,
    cascadeStatus: 'loading' as 'loading' | 'ready' | 'error',
    videoReady: false,
    canvasReady: false,
    lastDetectionTime: null as number | null,
  });

  // Load settings from localStorage on mount
  const loadSettings = (): FaceTrackerSettings => {
    try {
      const saved = localStorage.getItem('faceTrackerSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const loaded = { ...DEFAULT_SETTINGS, ...parsed };
        // Ensure oscPort defaults to 8000 if invalid
        if (!loaded.oscPort || loaded.oscPort < 1024 || loaded.oscPort > 65535) {
          loaded.oscPort = 8000;
        }
        // Migrate old opencvFps to opencvHz (convert FPS to Hz, capping at 10 Hz)
        if ((parsed as any).opencvFps !== undefined && loaded.opencvHz === undefined) {
          loaded.opencvHz = Math.min(10, Math.max(0.1, (parsed as any).opencvFps / 15)); // Convert FPS to Hz (15 FPS -> 1 Hz)
          console.log('[FaceTracker] Migrated opencvFps to opencvHz:', loaded.opencvHz);
        }
        return loaded;
      }
    } catch (error) {
      console.error('Error loading Face Tracker settings:', error);
    }
    return DEFAULT_SETTINGS;
  };

  const [settings, setSettings] = useState<FaceTrackerSettings>(loadSettings());

  // Keep opencvHzRef in sync with settings.opencvHz (for real-time updates without restarting loop)
  // This must be after settings is declared
  useEffect(() => {
    const newHz = Math.max(0.1, Math.min(120, settings.opencvHz || 1));
    opencvHzRef.current = newHz;
    console.log('[FaceTracker] 🔄 Hz ref synced to:', newHz);
  }, [settings.opencvHz]);
  
  // Autosave settings with debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveSettings = useCallback((settingsToSave: FaceTrackerSettings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('faceTrackerSettings', JSON.stringify(settingsToSave));
        console.log('[FaceTracker] Settings autosaved');
      } catch (error) {
        console.error('Error saving Face Tracker settings:', error);
      }
    }, 500); // Debounce: save 500ms after last change
  }, []);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([]);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // OpenCV.js state
  const opencvRef = useRef<any>(null);
  const cascadeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastOscSendRef = useRef<number>(0); // Track last OSC send time for throttling
  const smoothedPanRef = useRef<number>(0);
  const smoothedTiltRef = useRef<number>(0);
  const panVelocityRef = useRef<number>(0);
  const tiltVelocityRef = useRef<number>(0);
  // Separate FPS counters for different components
  const webcamFpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });
  const overlayFpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });
  const opencvHzCounterRef = useRef<{ detections: number; lastTime: number }>({ detections: 0, lastTime: performance.now() });
  const lastDetectionTimeRef = useRef<number>(0);
  const canvasDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFacePositionRef = useRef<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    centerX: number;
    centerY: number;
    timestamp: number;
    // Eye positions (scaled to full canvas)
    leftEye?: { x: number; y: number; width: number; height: number };
    rightEye?: { x: number; y: number; width: number; height: number };
    // Mouth position (scaled to full canvas)
    mouth?: { x: number; y: number; width: number; height: number };
    // Detection states
    // Head pose for accurate gaze projection
    yaw?: number; // Head rotation left/right (-1 to 1)
    pitch?: number; // Head rotation up/down (-1 to 1)
    pan?: number; // Calculated pan value (-1 to 1)
    tilt?: number; // Calculated tilt value (-1 to 1)
  } | null>(null);
  const faceHistoryRef = useRef<Array<{ width: number; height: number; centerX: number; centerY: number; timestamp: number }>>([]);
  const baselineFaceSizeRef = useRef<{ width: number; height: number; aspectRatio: number } | null>(null);
  // Delay buffer: store pan/tilt values with timestamps for delayed application
  const delayBufferRef = useRef<Array<{ pan: number; tilt: number; x: number; y: number; iris: number; zoom: number; timestamp: number }>>([]);
  // Pan/tilt history for smoothing
  const gestureHistoryRef = useRef<{
    panHistory: number[];
    tiltHistory: number[];
  }>({
    panHistory: [],
    tiltHistory: [],
  });

  // Enumerate available cameras
  useEffect(() => {
    const enumerateCameras = async () => {
      try {
        // Request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        console.log('[FaceTracker] Available cameras:', videoDevices.map((d, i) => `${i}: ${d.label || `Camera ${i}`}`));
      } catch (error) {
        console.error('[FaceTracker] Error enumerating cameras:', error);
        // Still try to enumerate without permission (labels will be empty)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setAvailableCameras(videoDevices);
        } catch (e) {
          console.error('[FaceTracker] Failed to enumerate cameras:', e);
        }
      }
    };
    enumerateCameras();
  }, []);

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
      console.log('[FaceTracker] Initializing OpenCV...', {
        opencvExists: !!opencvRef.current,
        hasCascadeClassifier: !!(opencvRef.current?.CascadeClassifier),
        opencvKeys: opencvRef.current ? Object.keys(opencvRef.current).slice(0, 10) : []
      });
      
      if (!opencvRef.current || !opencvRef.current.CascadeClassifier) {
        console.error('[FaceTracker] OpenCV not properly loaded', {
          opencvRef: !!opencvRef.current,
          CascadeClassifier: !!(opencvRef.current?.CascadeClassifier)
        });
        throw new Error('OpenCV not loaded');
      }

      // Load face cascade classifier
      let text: string;
      let cascadePath = '';
      try {
        const response = await fetch('/haarcascade_frontalface_alt.xml');
        if (!response.ok) {
          throw new Error('Not found');
        }
        text = await response.text();
        cascadePath = '/haarcascade_frontalface_alt.xml';
        console.log('[FaceTracker] Loaded cascade from /haarcascade_frontalface_alt.xml');
      } catch {
        // Try alternative path
        try {
          const altResponse = await fetch('/face-tracker/haarcascade_frontalface_alt.xml');
          if (!altResponse.ok) {
            throw new Error('Not found');
          }
          text = await altResponse.text();
          cascadePath = '/face-tracker/haarcascade_frontalface_alt.xml';
          console.log('[FaceTracker] Loaded cascade from /face-tracker/haarcascade_frontalface_alt.xml');
        } catch (altError) {
          console.error('[FaceTracker] Failed to load cascade from both paths');
          throw new Error('Failed to load face cascade classifier. Please ensure haarcascade_frontalface_alt.xml is in the public directory.');
        }
      }

      if (!text || text.length === 0) {
        throw new Error('Cascade classifier file is empty');
      }

      console.log('[FaceTracker] Writing cascade to OpenCV filesystem, size:', text.length);
      // Write to OpenCV filesystem
      opencvRef.current.FS.writeFile('haarcascade_frontalface_alt.xml', text);

      console.log('[FaceTracker] Creating CascadeClassifier...');
      cascadeRef.current = new opencvRef.current.CascadeClassifier();
      
      console.log('[FaceTracker] Loading cascade classifier...');
      const loadResult = cascadeRef.current.load('haarcascade_frontalface_alt.xml');
      
      if (!loadResult) {
        console.error('[FaceTracker] Cascade classifier load returned false');
        throw new Error('Failed to load cascade classifier file');
      }
      
      console.log('[FaceTracker] OpenCV initialized successfully, cascade classifier loaded');
      setState(prev => ({ ...prev, isInitialized: true, error: null }));
      setDiagnostics(prev => ({ 
        ...prev, 
        opencvStatus: 'ready', 
        cascadeStatus: 'ready',
        opencvError: null 
      }));
    } catch (error: any) {
      console.error('[FaceTracker] OpenCV initialization error:', error);
      const errorMsg = `Failed to initialize OpenCV: ${error?.message || error}`;
      setState(prev => ({ ...prev, error: errorMsg }));
      setDiagnostics(prev => ({ 
        ...prev, 
        opencvStatus: 'error', 
        cascadeStatus: 'error',
        opencvError: errorMsg 
      }));
    }
  };

  // Start/stop camera
  const startCamera = useCallback(async () => {
    // Update state immediately for UI responsiveness (especially in Edge)
    // Use setTimeout to defer state updates and prevent blocking
    setTimeout(() => {
      setState(prev => ({ ...prev, isRunning: true }));
      setDiagnostics(prev => ({ ...prev, cameraStatus: 'starting', cameraError: null }));
    }, 0);
    
    try {
      // Edge needs more time and simpler approach - don't timeout enumerateDevices
      let devices: MediaDeviceInfo[] = [];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (enumError) {
        // If enumerateDevices fails, try getUserMedia directly (Edge sometimes has issues with enumerateDevices)
        console.warn('[FaceTracker] enumerateDevices failed, trying direct getUserMedia:', enumError);
      }
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const deviceId = videoDevices.length > 0 && settings.cameraIndex < videoDevices.length
        ? videoDevices[settings.cameraIndex]?.deviceId 
        : videoDevices[0]?.deviceId;
      
      // Build minimal constraints first (Edge works better with simpler constraints)
      const minimalConstraints: any = {
        width: { ideal: 640 },
        height: { ideal: 480 },
      };
      
      // Only add deviceId if we have one (Edge can be picky about deviceId format)
      if (deviceId) {
        minimalConstraints.deviceId = { exact: deviceId };
      } else {
        // Fallback to facingMode if no deviceId
        minimalConstraints.facingMode = { ideal: 'user' };
      }
      
      // Add a longer delay before getUserMedia to prevent Firefox freezes
      // This gives the browser time to process previous operations and prevents crashes
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add timeout for getUserMedia (Edge needs more time - 15 seconds)
      const cameraTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Camera access timeout (15s) - please check camera permissions')), 15000);
      });
      
      // Try to get stream with minimal constraints first (Edge prefers this)
      let stream: MediaStream;
      try {
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia({
          video: minimalConstraints
        });
        stream = await Promise.race([getUserMediaPromise, cameraTimeout]);
      } catch (error: any) {
        // If exact deviceId fails, try with ideal (Edge sometimes rejects exact)
        if (error?.name === 'OverconstrainedError' || error?.name === 'NotFoundError') {
          console.warn('[FaceTracker] Failed with exact deviceId, trying ideal:', error);
          const fallbackConstraints: any = {
            width: { ideal: 640 },
            height: { ideal: 480 },
          };
          if (deviceId) {
            fallbackConstraints.deviceId = { ideal: deviceId };
          } else {
            fallbackConstraints.facingMode = { ideal: 'user' };
          }
          const fallbackPromise = navigator.mediaDevices.getUserMedia({
            video: fallbackConstraints
          });
          stream = await Promise.race([fallbackPromise, cameraTimeout]);
        } else {
          // If that fails, try with absolute minimal constraints (no deviceId at all)
          console.warn('[FaceTracker] Failed with device constraints, trying absolute minimal:', error);
          const absoluteMinimalPromise = navigator.mediaDevices.getUserMedia({
            video: true // Absolute minimal - let browser choose
          });
          stream = await Promise.race([absoluteMinimalPromise, cameraTimeout]);
        }
      }
      
      // After getting the stream, try to apply exposure/brightness if supported
      // Edge: Apply constraints more carefully, don't fail if they don't work
      if (stream && stream.getVideoTracks().length > 0) {
        const track = stream.getVideoTracks()[0];
        try {
          const capabilities = track.getCapabilities() as any;
          const settings_ = track.getSettings() as any;
          
          // Log capabilities and current settings for debugging (only in dev)
          if (process.env.NODE_ENV === 'development') {
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
          }
          
          // Store capabilities in ref for later use
          (track as any)._faceTrackerCapabilities = capabilities;
          (track as any)._faceTrackerSettings = settings_;
          
          // Try to apply constraints with multiple fallback strategies (non-blocking for Edge)
          // Don't await - let it happen in background, don't fail if it doesn't work
          applyCameraConstraints(track, capabilities, settings, true).catch(err => {
            // Silent fail - constraints are optional, camera still works without them
            if (process.env.NODE_ENV === 'development') {
              console.warn('[FaceTracker] Could not apply camera constraints (non-critical):', err);
            }
          });
        } catch (capError) {
          // Edge sometimes doesn't support getCapabilities/getSettings - that's OK
          if (process.env.NODE_ENV === 'development') {
            console.warn('[FaceTracker] Could not get camera capabilities (non-critical):', capError);
          }
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Use setTimeout to defer play() and prevent blocking
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.warn('[FaceTracker] Video play error (non-critical):', err);
            });
          }
        }, 0);
      }

      // Reset smoothed values when starting
      smoothedPanRef.current = 0;
      smoothedTiltRef.current = 0;
      panVelocityRef.current = 0;
      tiltVelocityRef.current = 0;
      lastUpdateRef.current = 0;
      
      // Reset FPS counters
      webcamFpsCounterRef.current = { frames: 0, lastTime: performance.now() };
      overlayFpsCounterRef.current = { frames: 0, lastTime: performance.now() };
      opencvHzCounterRef.current = { detections: 0, lastTime: performance.now() };
      
      setState(prev => ({ ...prev, isRunning: true, error: null, currentPan: settings.panOffset, currentTilt: settings.tiltOffset, fps: 0, webcamFps: 0, overlayFps: 0, opencvHz: 0 }));
      // Re-enable text overlay when starting (in case it was disabled due to crashes)
      textOverlayEnabledRef.current = true;
      textOverlayErrorCountRef.current = 0;
      
      // Defer diagnostic updates to prevent blocking
      setTimeout(() => {
        setDiagnostics(prev => ({ 
          ...prev, 
          cameraStatus: 'running', 
          cameraError: null,
          videoReady: !!videoRef.current && videoRef.current.readyState >= 2
        }));
      }, 0);
      
      // Defer startTracking to prevent blocking during camera initialization
      // This gives the browser time to process the camera stream
      // Use a longer delay to ensure camera is fully ready before starting detection
      setTimeout(() => {
        // startTracking will be called via useEffect when state.isRunning changes
        // This delay just ensures the camera stream is fully established
      }, 500);
    } catch (error: any) {
      const errorMsg = `Failed to start camera: ${error?.message || error}`;
      // Defer error state updates to prevent blocking
      setTimeout(() => {
        setState(prev => ({ ...prev, error: errorMsg, isRunning: false }));
        setDiagnostics(prev => ({ ...prev, cameraStatus: 'error', cameraError: errorMsg }));
      }, 0);
    }
  }, [settings.cameraIndex, settings.autoExposure, settings.cameraExposure, settings.cameraBrightness]);

  const stopCamera = useCallback((stopTimerFn?: () => void) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[FaceTracker] Error stopping track:', e);
          }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = null;
          videoRef.current.pause();
        } catch (e) {
          console.warn('[FaceTracker] Error stopping video:', e);
        }
      }
      if (canvasRef.current) {
        try {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          // Reset canvas dimensions
          canvasDimensionsRef.current = { width: 0, height: 0 };
        } catch (e) {
          console.warn('[FaceTracker] Error clearing canvas:', e);
        }
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      // Stop detection RAF loop
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = undefined;
      }
      // Clear detection timeout
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = undefined;
      }
      if (previewFrameRef.current) {
        cancelAnimationFrame(previewFrameRef.current);
        previewFrameRef.current = undefined;
      }
      setState(prev => ({ ...prev, isRunning: false, faceDetected: false, fps: 0 }));
      setDiagnostics(prev => ({ ...prev, cameraStatus: 'stopped', videoReady: false }));
    } catch (error: any) {
      console.error('[FaceTracker] Error in stopCamera:', error);
      setDiagnostics(prev => ({ ...prev, cameraStatus: 'error', cameraError: error?.message || 'Unknown error' }));
    }
  }, []);

  // Throttle diagnostic updates to prevent excessive state updates
  const lastDiagnosticUpdateRef = useRef<number>(0);
  const DIAGNOSTIC_UPDATE_INTERVAL = 500; // Update diagnostics max once per 500ms
  
  // Frame skipping for preview to prevent crashes - very aggressive throttling
  const lastPreviewFrameRef = useRef<number>(0);
  const PREVIEW_FPS_TARGET = 15; // Target 15 FPS (very low to prevent Firefox freezes)
  const PREVIEW_FRAME_INTERVAL = 1000 / PREVIEW_FPS_TARGET; // ~66ms per frame
  
  // Text rendering cache to prevent flickering
  const lastTextRenderTimeRef = useRef<number>(0);
  const TEXT_RENDER_INTERVAL = 200; // Only update text every 200ms (5 FPS for text)
  // Crash detection for text overlay - disable if too many errors
  const textOverlayErrorCountRef = useRef<number>(0);
  const textOverlayEnabledRef = useRef<boolean>(true);
  const MAX_TEXT_ERRORS = 3; // Disable text overlay after 3 consecutive errors
  // Cache text values to always redraw them (prevents flickering)
  const textCacheRef = useRef<{
    panText: string;
    tiltText: string;
    yawText: string | null;
    pitchText: string | null;
    statusText: string;
    statusColor: string;
    irisText: string | null;
    posText: string | null;
    gazeText: string | null;
    gestureText: string | null;
    faceDetected: boolean;
  }>({
    panText: 'Pan: 128',
    tiltText: 'Tilt: 128',
    yawText: null,
    pitchText: null,
    statusText: 'No Face',
    statusColor: 'red',
    irisText: null,
    posText: null,
    gazeText: null,
    gestureText: null,
    faceDetected: false
  });

  // Fast preview rendering (separate from face detection) - RAF LOOP  
  const renderPreview = useCallback(() => {
    // Schedule next frame FIRST (RAF pattern - ensures continuous loop)
    previewFrameRef.current = requestAnimationFrame(renderPreview);

    // Stop the loop if not running (using ref to avoid stale closures)
    if (!isRunningRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      // Wrap entire render in try-catch to prevent page crashes
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Additional safety check - ensure video is actually ready before drawing
      // Allow HAVE_CURRENT_DATA (2) or higher for preview to start faster
      if (!video.srcObject || video.readyState < video.HAVE_CURRENT_DATA) {
        return; // Skip this frame, loop continues
      }
      
      const now = Date.now(); // Use Date.now() to match timestamp format
      const nowPerformance = performance.now(); // Keep performance.now() for frame timing
      
      // Skip frames to reduce rendering load (target 15 FPS to prevent Firefox freezes)
      if (nowPerformance - lastPreviewFrameRef.current < PREVIEW_FRAME_INTERVAL) {
        return; // Skip this frame, loop already scheduled at top
      }
      lastPreviewFrameRef.current = nowPerformance;
      
      // Throttle diagnostic updates (only update max once per 1000ms to prevent Firefox freezes)
      if (video.readyState >= video.HAVE_ENOUGH_DATA && 
          (nowPerformance - lastDiagnosticUpdateRef.current) >= 1000) {
        // Use setTimeout to defer state update and prevent blocking
        setTimeout(() => {
          setDiagnostics(prev => ({ ...prev, videoReady: true }));
        }, 0);
        lastDiagnosticUpdateRef.current = nowPerformance;
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      
      // Skip if context not available
      if (!ctx || !video.srcObject || video.readyState < video.HAVE_CURRENT_DATA) {
        return; // Skip this frame, loop continues
      }

      // Only resize canvas when dimensions change (expensive operation)
      if (canvasDimensionsRef.current.width !== video.videoWidth || 
          canvasDimensionsRef.current.height !== video.videoHeight) {
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        canvasDimensionsRef.current.width = videoWidth;
        canvasDimensionsRef.current.height = videoHeight;
      }

      // Fast direct draw (no pixel manipulation for preview)
      try {
        // Clear canvas first to ensure fresh drawing each frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);
        
        // Update webcam FPS counter
        webcamFpsCounterRef.current.frames++;
      } catch (error) {
        console.warn('[FaceTracker] Error drawing video frame:', error);
        return; // Loop already scheduled at top
      }

      // Draw persistent overlays from last detection (makes them less blinky)
      // Reuse 'now' variable from above to avoid redeclaration
      const faceTimeout = 5000; // Keep showing face for 5 seconds after last detection (increased to handle slower detection rates)
      
      // Always draw overlays when running - show face box if detected, or "searching" indicator if not
      // CRITICAL: Always draw something when running to show the system is active
      const timeSinceDetection = lastFacePositionRef.current ? (now - lastFacePositionRef.current.timestamp) : Infinity;
      const hasRecentFace = lastFacePositionRef.current && timeSinceDetection < faceTimeout;
      const shouldDrawFaceBox = hasRecentFace && lastFacePositionRef.current;
      
      // Debug: Log overlay drawing status to diagnose static box issue
      if (Math.random() < 0.1) {
        console.log('[FaceTracker] Overlay status:', {
          hasFacePosition: !!lastFacePositionRef.current,
          timeSinceDetection: lastFacePositionRef.current ? (now - lastFacePositionRef.current.timestamp) : null,
          shouldDrawFaceBox: shouldDrawFaceBox,
          isRunning: state.isRunning,
          facePosition: lastFacePositionRef.current ? {
            x: lastFacePositionRef.current.x,
            y: lastFacePositionRef.current.y,
            width: lastFacePositionRef.current.width,
            height: lastFacePositionRef.current.height,
            timestamp: lastFacePositionRef.current.timestamp
          } : null
        });
      }
      
      // Always draw overlays when running - either face box or "searching" indicator
      if (state.isRunning) {
        // Draw face box if we have recent face detection
        if (shouldDrawFaceBox && lastFacePositionRef.current) {
        try {
          const face = lastFacePositionRef.current;
          // Validate face data to prevent crashes
          if (face && typeof face.x === 'number' && typeof face.y === 'number' && 
              typeof face.width === 'number' && typeof face.height === 'number') {
            // Update overlay FPS counter
            overlayFpsCounterRef.current.frames++;
            // Batch canvas operations for better performance
            ctx.save();
            
            const imageCenterX = video.videoWidth / 2;
            const imageCenterY = video.videoHeight / 2;
            
            // Calculate fade based on time since last detection
            const timeSinceDetection = now - face.timestamp;
            const fadeAlpha = Math.max(0.5, 1 - (timeSinceDetection / faceTimeout));
            
            // Draw face rectangle
            ctx.strokeStyle = `rgba(255, 165, 0, ${fadeAlpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(face.x, face.y, face.width, face.height);

            // Draw center point (yellow circle)
            ctx.fillStyle = `rgba(255, 255, 0, ${fadeAlpha})`;
            ctx.beginPath();
            ctx.arc(face.centerX, face.centerY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw gaze projection if head pose is available
            if (face.yaw !== undefined && face.pitch !== undefined) {
              const headYaw = face.yaw;
              const headPitch = face.pitch;
              // Use a larger projection distance for better visibility
              const projectionDistance = Math.min(video.videoWidth, video.videoHeight) * 1.2;
              
              // Yaw: negative = looking left, positive = looking right
              // Pitch: based on calculation, negative = looking down, positive = looking up (needs verification)
              // For gaze: when looking left (negative yaw), X should move left
              // When looking down (negative pitch), Y should move down
              // When looking up (positive pitch), Y should move up
              
              // Apply yaw directly for horizontal movement
              const panOffset = headYaw * projectionDistance;
              
              // Apply pitch for vertical movement (pitch is already in correct direction based on calculation)
              // If pitch calculation is inverted, we may need to flip it
              const tiltOffset = headPitch * projectionDistance;
              
              const targetX = face.centerX + panOffset;
              const targetY = face.centerY + tiltOffset;
              const clampedTargetX = Math.max(0, Math.min(video.videoWidth, targetX));
              const clampedTargetY = Math.max(0, Math.min(video.videoHeight, targetY));
              
              // Draw gaze line
              ctx.strokeStyle = `rgba(255, 0, 0, ${fadeAlpha})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(face.centerX, face.centerY);
              ctx.lineTo(clampedTargetX, clampedTargetY);
              ctx.stroke();
              
              // Draw X marker at target
              ctx.beginPath();
              ctx.moveTo(clampedTargetX - 12, clampedTargetY - 12);
              ctx.lineTo(clampedTargetX + 12, clampedTargetY + 12);
              ctx.moveTo(clampedTargetX + 12, clampedTargetY - 12);
              ctx.lineTo(clampedTargetX - 12, clampedTargetY + 12);
              ctx.stroke();
              
              // Draw circle around X marker
              ctx.beginPath();
              ctx.arc(clampedTargetX, clampedTargetY, 15, 0, Math.PI * 2);
              ctx.stroke();
            }
            
            // Draw crosshair at image center (blue, for reference)
            ctx.strokeStyle = `rgba(0, 150, 255, ${fadeAlpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(imageCenterX - 20, imageCenterY);
            ctx.lineTo(imageCenterX + 20, imageCenterY);
            ctx.moveTo(imageCenterX, imageCenterY - 20);
            ctx.lineTo(imageCenterX, imageCenterY + 20);
            ctx.stroke();
            
            
            ctx.restore();
          }
        } catch (error) {
          console.warn('[FaceTracker] Error drawing overlays:', error);
        }
        } else {
          // No face detected - draw "searching" indicator to show system is active
          try {
            ctx.save();
            const imageCenterX = video.videoWidth / 2;
            const imageCenterY = video.videoHeight / 2;
            
            // Draw pulsing circle at center to indicate searching
            const pulsePhase = (now % 2000) / 2000; // 2 second pulse cycle
            const pulseRadius = 20 + Math.sin(pulsePhase * Math.PI * 2) * 10;
            const pulseAlpha = 0.3 + Math.sin(pulsePhase * Math.PI * 2) * 0.2;
            
            ctx.strokeStyle = `rgba(255, 165, 0, ${pulseAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(imageCenterX, imageCenterY, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw crosshair at center
            ctx.strokeStyle = `rgba(255, 165, 0, 0.5)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(imageCenterX - 30, imageCenterY);
            ctx.lineTo(imageCenterX + 30, imageCenterY);
            ctx.moveTo(imageCenterX, imageCenterY - 30);
            ctx.lineTo(imageCenterX, imageCenterY + 30);
            ctx.stroke();
            
            ctx.restore();
          } catch (error) {
            console.warn('[FaceTracker] Error drawing searching indicator:', error);
          }
        }
      }

      // Draw text overlay (always draw to prevent flickering, but update values only every 200ms)
      // Update cached text values only every 200ms to reduce computation
      const shouldUpdateText = (now - lastTextRenderTimeRef.current) >= TEXT_RENDER_INTERVAL;
      
      if (shouldUpdateText) {
        // Update cached text values - use current state values (not stale)
        // Force read from state to ensure we get latest values
        const currentPan = state.currentPan;
        const currentTilt = state.currentTilt;
        textCacheRef.current.panText = `Pan: ${currentPan}`;
        textCacheRef.current.tiltText = `Tilt: ${currentTilt}`;
        const faceDetected = lastFacePositionRef.current && 
                             (now - lastFacePositionRef.current.timestamp) < faceTimeout;
        textCacheRef.current.faceDetected = faceDetected;
        textCacheRef.current.statusText = faceDetected ? '✓ Face Detected' : 'No Face';
        textCacheRef.current.statusColor = faceDetected ? 'lime' : 'red';
        
        // Update additional detection info
        if (faceDetected && lastFacePositionRef.current) {
          const face = lastFacePositionRef.current;
          
          // Yaw/Pitch (head rotation)
          if (face.yaw !== undefined) {
            textCacheRef.current.yawText = `Yaw: ${face.yaw.toFixed(2)}`;
          } else {
            textCacheRef.current.yawText = null;
          }
          
          if (face.pitch !== undefined) {
            textCacheRef.current.pitchText = `Pitch: ${face.pitch.toFixed(2)}`;
          } else {
            textCacheRef.current.pitchText = null;
          }
          
          // Iris value
          if (state.currentIris > 0) {
            textCacheRef.current.irisText = `Iris: ${state.currentIris}`;
          } else {
            textCacheRef.current.irisText = null;
          }
          
          // X/Y Position
          if (state.currentX > 0 || state.currentY > 0) {
            textCacheRef.current.posText = `X: ${state.currentX} Y: ${state.currentY}`;
          } else {
            textCacheRef.current.posText = null;
          }
        } else {
          textCacheRef.current.yawText = null;
          textCacheRef.current.pitchText = null;
          textCacheRef.current.irisText = null;
          textCacheRef.current.posText = null;
        }
        
        lastTextRenderTimeRef.current = now;
      }
      
      // Draw text overlay with face tracking information
      // Re-enabled with error handling to prevent crashes
      if (textOverlayEnabledRef.current) {
        try {
          // Clear previous text area with semi-transparent background (expanded for more info)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(5, 5, 250, 320);
          
          ctx.font = 'bold 18px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          
          // Draw pan/tilt/status (always visible)
          ctx.fillStyle = 'yellow';
          if (textCacheRef.current.panText) {
            ctx.strokeText(textCacheRef.current.panText, 10, 30);
            ctx.fillText(textCacheRef.current.panText, 10, 30);
          }
          
          if (textCacheRef.current.tiltText) {
            ctx.strokeText(textCacheRef.current.tiltText, 10, 55);
            ctx.fillText(textCacheRef.current.tiltText, 10, 55);
          }
          
          // Draw yaw/pitch (head rotation)
          if (textCacheRef.current.yawText) {
            ctx.fillStyle = 'cyan';
            ctx.strokeText(textCacheRef.current.yawText, 10, 80);
            ctx.fillText(textCacheRef.current.yawText, 10, 80);
          }
          
          if (textCacheRef.current.pitchText) {
            ctx.fillStyle = 'cyan';
            ctx.strokeText(textCacheRef.current.pitchText, 10, 105);
            ctx.fillText(textCacheRef.current.pitchText, 10, 105);
          }
          
          if (textCacheRef.current.statusText) {
            ctx.fillStyle = textCacheRef.current.statusColor || 'red';
            ctx.strokeText(textCacheRef.current.statusText, 10, 130);
            ctx.fillText(textCacheRef.current.statusText, 10, 130);
          }
          
          // Draw gesture if available
          if (textCacheRef.current.gestureText) {
            ctx.fillStyle = 'magenta';
            ctx.strokeText(textCacheRef.current.gestureText, 10, 155);
            ctx.fillText(textCacheRef.current.gestureText, 10, 155);
          }
          
          // Draw additional detection info if available
          let yOffset = 180;
          if (textCacheRef.current.irisText) {
            ctx.fillStyle = 'cyan';
            ctx.strokeText(textCacheRef.current.irisText, 10, yOffset);
            ctx.fillText(textCacheRef.current.irisText, 10, yOffset);
            yOffset += 25;
          }
          
          if (textCacheRef.current.posText) {
            ctx.fillStyle = 'orange';
            ctx.strokeText(textCacheRef.current.posText, 10, yOffset);
            ctx.fillText(textCacheRef.current.posText, 10, yOffset);
          }
          
          // Reset error count on successful render
          textOverlayErrorCountRef.current = 0;
        } catch (error) {
          textOverlayErrorCountRef.current++;
          console.warn(`[FaceTracker] Error drawing text overlay (${textOverlayErrorCountRef.current}/${MAX_TEXT_ERRORS}):`, error);
          
          // Disable text overlay after too many errors to prevent Firefox crashes
          if (textOverlayErrorCountRef.current >= MAX_TEXT_ERRORS) {
            textOverlayEnabledRef.current = false;
            console.warn('[FaceTracker] Text overlay disabled due to repeated errors to prevent Firefox crashes');
          }
        }
      }

      // Update FPS counters - update every second for better responsiveness
      const fpsUpdateInterval = 1000; // 1 second
      
      // Update webcam FPS
      const webcamTimeSince = now - webcamFpsCounterRef.current.lastTime;
      if (webcamTimeSince >= fpsUpdateInterval) {
        const webcamFps = Math.round((webcamFpsCounterRef.current.frames * 1000) / webcamTimeSince);
        const cappedWebcamFps = Math.min(webcamFps, 120);
        if (webcamTimeSince > 0 && webcamFpsCounterRef.current.frames > 0) {
          setTimeout(() => {
            setState(prev => ({ ...prev, webcamFps: cappedWebcamFps }));
          }, 0);
        }
        webcamFpsCounterRef.current.frames = 0;
        webcamFpsCounterRef.current.lastTime = now;
      }
      
      // Update overlay FPS
      const overlayTimeSince = now - overlayFpsCounterRef.current.lastTime;
      if (overlayTimeSince >= fpsUpdateInterval) {
        const overlayFps = Math.round((overlayFpsCounterRef.current.frames * 1000) / overlayTimeSince);
        const cappedOverlayFps = Math.min(overlayFps, 120);
        if (overlayTimeSince > 0 && overlayFpsCounterRef.current.frames > 0) {
          setTimeout(() => {
            setState(prev => ({ ...prev, overlayFps: cappedOverlayFps }));
          }, 0);
        }
        overlayFpsCounterRef.current.frames = 0;
        overlayFpsCounterRef.current.lastTime = now;
      }

      // Continue preview loop only if still running
      // CRITICAL: Always schedule next frame to ensure overlay updates continuously
      if (state.isRunning) {
        try {
          // RAF already scheduled at top of function
        } catch (error) {
          console.error('[FaceTracker] Error scheduling preview frame:', error);
          // Fallback: use setTimeout if requestAnimationFrame fails
          setTimeout(() => {
            if (state.isRunning) {
              // RAF already scheduled at top of function
            }
          }, 16); // ~60fps fallback
        }
      } else {
        previewFrameRef.current = undefined;
      }
    } catch (error: any) {
      // Catch any unhandled errors and log them - prevent page crash
      console.error('[FaceTracker] Preview render error:', error);
      console.error('[FaceTracker] Render error details:', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        videoReady: videoRef.current?.readyState,
        canvasReady: !!canvasRef.current
      });
      
      // Set error state but don't crash the page
      try {
        setState(prev => ({ 
          ...prev, 
          error: `Render error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }));
      } catch (stateError) {
        // Even state updates can fail, so catch that too
        console.error('[FaceTracker] Failed to update error state:', stateError);
      }
      
      // Continue loop even if render fails - add delay to prevent rapid error loops
      if (state.isRunning) {
        setTimeout(() => {
          if (state.isRunning && previewFrameRef.current === undefined) {
            try {
              // RAF already scheduled at top of function
            } catch (rafError) {
              console.error('[FaceTracker] Failed to restart render loop:', rafError);
            }
          }
        }, 1000); // Wait 1 second before retrying
      } else {
        previewFrameRef.current = undefined;
      }
    }
  }, [state.currentPan, state.currentTilt]); // Removed state.isRunning - using isRunningRef

  // Face detection with continuous RAF loop (WORKING PATTERN from debug version)
  // Uses requestAnimationFrame to create a continuous detection loop
  const detectFaces = useCallback(() => {
    console.log('[FaceTracker] 🚀🚀🚀 detectFaces CALLED - Starting RAF loop 🚀🚀🚀', { 
      hz: opencvHzRef.current 
    });
    
    if (!opencvRef.current || !cascadeRef.current || !videoRef.current || !canvasRef.current) {
      console.error('[FaceTracker] ❌ Cannot start detection - missing refs:', {
        opencv: !!opencvRef.current,
        cascade: !!cascadeRef.current,
        video: !!videoRef.current,
        canvas: !!canvasRef.current
      });
      return;
    }

    console.log('[FaceTracker] ✅ All refs available - defining processDetection');

    let loopCount = 0;
    const processDetection = () => {
      try {
        loopCount++;
        
        // 🔑 CRITICAL: Schedule next frame FIRST (this is the working pattern from debug!)
        // This ensures the loop ALWAYS continues, regardless of errors or React re-renders
        detectionFrameRef.current = requestAnimationFrame(processDetection);

        // Log every 60 frames (~1 second) to verify loop is running
        if (loopCount % 60 === 0) {
          console.log(`[FaceTracker] 🔄 RAF loop iteration #${loopCount}, isRunning: ${isRunningRef.current}, Hz: ${opencvHzRef.current}`);
        }

        // Now do all the checks (early returns won't break the loop)
        // Use ref for isRunning to avoid stale closures
        if (!isRunningRef.current || !videoRef.current || !canvasRef.current) {
          if (loopCount % 60 === 0) {
            console.log('[FaceTracker] ⏸️ Skipping - not running or missing refs, isRunning:', isRunningRef.current);
          }
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
          if (loopCount % 60 === 0) {
            console.log('[FaceTracker] ⏸️ Skipping - video not ready, readyState:', video.readyState);
          }
          return;
        }

        // Throttle detection rate based on Hz setting (use ref for real-time updates)
        const now = Date.now();
        const currentHz = opencvHzRef.current; // Get current Hz from ref (updates in real-time)
        const detectionInterval = 1000 / currentHz;
        
        if (now - lastDetectionTimeRef.current < detectionInterval) {
          // Throttled - skip this frame
          if (loopCount % 300 === 0) { // Log every 5 seconds when throttling
            console.log(`[FaceTracker] ⏱️ Throttling at ${currentHz} Hz - waiting for next interval`);
          }
          return; // Skip this frame, but loop continues
        }
        lastDetectionTimeRef.current = now;
        
        // We're about to run actual detection
        if (loopCount % 10 === 0) { // Log every 10th detection to avoid spam
          console.log(`[FaceTracker] 🔍 Running detection (loop #${loopCount}, Hz: ${currentHz})`);
        }

        // Update Hz counter and display
        opencvHzCounterRef.current.detections++;
        const opencvTimeSince = now - opencvHzCounterRef.current.lastTime;
        if (opencvTimeSince >= 1000) {
          const actualHz = (opencvHzCounterRef.current.detections * 1000) / opencvTimeSince;
          if (opencvTimeSince > 0 && opencvHzCounterRef.current.detections > 0) {
            setTimeout(() => {
              setState(prev => ({ ...prev, opencvHz: parseFloat(actualHz.toFixed(2)) }));
            }, 0);
            // Log current Hz rate
            console.log(`[FaceTracker] 🔄 Detection running at ${actualHz.toFixed(1)} Hz`);
          }
          opencvHzCounterRef.current.detections = 0;
          opencvHzCounterRef.current.lastTime = now;
        }

        // Create smaller canvas for detection (faster processing)
        if (!detectionCanvasRef.current) {
          detectionCanvasRef.current = document.createElement('canvas');
        }
        const detCanvas = detectionCanvasRef.current;
        const detCtx = detCanvas.getContext('2d', { willReadFrequently: true });
        
        // Use smaller resolution for detection (320x240 is usually enough)
        const detWidth = 320;
        const detHeight = Math.round((video.videoHeight / video.videoWidth) * detWidth);
        detCanvas.width = detWidth;
        detCanvas.height = detHeight;
        
        // Draw scaled video for detection
        detCtx.drawImage(video, 0, 0, detWidth, detHeight);

        // Apply brightness/contrast only on detection canvas (smaller = faster)
        const imageData = detCtx.getImageData(0, 0, detWidth, detHeight);
        const data = imageData.data;
        const brightnessOffset = (settings.brightness - 1) * 127;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] * settings.contrast + brightnessOffset));     // R
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * settings.contrast + brightnessOffset)); // G
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * settings.contrast + brightnessOffset)); // B
        }
        detCtx.putImageData(imageData, 0, 0);

        // Convert detection canvas to OpenCV Mat (smaller = faster)
        if (!opencvRef.current || !cascadeRef.current) {
          return; // Timer will retry later
        }

        const src = opencvRef.current.imread(detCanvas);
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
        const detectionStartTime = performance.now();
        
        try {
          // Verify cascade is still valid before detection
          if (!cascadeRef.current) {
            // Cascade not available, cleanup and continue
            try { if (src) src.delete(); } catch (e) { /* Already deleted */ }
            try { if (gray) gray.delete(); } catch (e) { /* Already deleted */ }
            try { if (faces) faces.delete(); } catch (e) { /* Already deleted */ }
            try { if (msize) msize.delete(); } catch (e) { /* Already deleted */ }
            try { if (maxSizeObj) maxSizeObj.delete(); } catch (e) { /* Already deleted */ }
            return; // Timer will retry later
          }
          
          // Perform face detection
          try {
            const scaleFactor = settings.opencvScaleFactor || 1.05;
            const minNeighbors = settings.opencvMinNeighbors || 2;
            cascadeRef.current.detectMultiScale(gray, faces, scaleFactor, minNeighbors, 0, msize, maxSizeObj);
            // Log detection results
            const detectedFaces = faces.size();
            if (detectedFaces > 0) {
              const face = faces.get(0);
              console.log('[FaceTracker] ✅ FACE DETECTED! Count:', detectedFaces, 'Position:', {
                x: face.x,
                y: face.y,
                width: face.width,
                height: face.height
              });
            } else {
              console.log('[FaceTracker] ❌ No faces detected in this frame');
            }
          } catch (detectError) {
            console.error('[FaceTracker] Error in detectMultiScale:', detectError);
            throw detectError;
          }
        } catch (detectionError) {
          // Silent error handling to prevent Firefox crashes
          // Cleanup and continue
          try {
            try { if (src) src.delete(); } catch (e) { /* Already deleted */ }
            try { if (gray) gray.delete(); } catch (e) { /* Already deleted */ }
            try { if (faces) faces.delete(); } catch (e) { /* Already deleted */ }
            try { if (msize) msize.delete(); } catch (e) { /* Already deleted */ }
            try { if (maxSizeObj) maxSizeObj.delete(); } catch (e) { /* Already deleted */ }
          } catch (cleanupError) {
            // Silent cleanup error
          }
          return; // Timer will retry later
        }
        
        const detectionTime = performance.now() - detectionStartTime;
        
        // Log detection results for debugging - always log when face detected
        const facesCount = faces.size();
        if (facesCount > 0) {
          // Log every detection to ensure loop is running
          console.log('[FaceTracker] ✅ Face detected! Count:', facesCount, 'at', new Date().toLocaleTimeString());
        } else if (Math.random() < 0.05) {
          console.log('[FaceTracker] ⚠️ No faces detected in frame');
        }

        let faceDetected = false;
        if (facesCount > 0) {
          try {
            faceDetected = true;
            const face = faces.get(0);
            
            // Validate face dimensions to prevent crashes
            if (!face || face.width <= 0 || face.height <= 0 || 
                face.x < 0 || face.y < 0 || 
                face.x + face.width > detWidth || 
                face.y + face.height > detHeight) {
              faceDetected = false;
            } else {
              // Calculate face center (scale from detection canvas to full canvas)
              const scaleX = video.videoWidth / detWidth;
              const scaleY = video.videoHeight / detHeight;
              const faceCenterX = (face.x + face.width / 2) * scaleX;
              const faceCenterY = (face.y + face.height / 2) * scaleY;
              const imageCenterX = video.videoWidth / 2;
              const imageCenterY = video.videoHeight / 2;
              
              // Removed logging to prevent Firefox crashes

              // Store face position temporarily (will update with eye/mouth data later)
              const faceX = face.x * scaleX;
              const faceY = face.y * scaleY;
              const faceW = face.width * scaleX;
              const faceH = face.height * scaleY;
              
              // Always update face position - don't check for changes, just update
              // This ensures the box moves with the face
              // Initialize with current face position - yaw/pitch will be added later
              lastFacePositionRef.current = {
                x: faceX,
                y: faceY,
                width: faceW,
                height: faceH,
                centerX: faceCenterX,
                centerY: faceCenterY,
                timestamp: Date.now(),
                yaw: undefined,
                pitch: undefined
              };
              
              // Log position update for debugging static box issue - log more frequently
              if (Math.random() < 0.3) {
                console.log('[FaceTracker] 📍 Face position updated:', {
                  x: faceX.toFixed(1),
                  y: faceY.toFixed(1),
                  width: faceW.toFixed(1),
                  height: faceH.toFixed(1),
                  centerX: faceCenterX.toFixed(1),
                  centerY: faceCenterY.toFixed(1),
                  timestamp: Date.now()
                });
              }

              // Calculate X/Y position values (0-255) for fixture following
              const xPositionValue = Math.round(
                Math.max(settings.xPositionMin, Math.min(settings.xPositionMax,
                  (faceCenterX / video.videoWidth) * 255
                ))
              );
              const yPositionValue = Math.round(
                Math.max(settings.yPositionMin, Math.min(settings.yPositionMax,
                  (faceCenterY / video.videoHeight) * 255
                ))
              );

              // Blink detection: Analyze eye region brightness/contrast
              // Eye regions are approximately: left eye (20-40% from left, 25-40% from top), right eye (60-80% from left, 25-40% from top)
              let irisValue = 128; // Default center value

              // Now update face position with eye and mouth detection data
              // Always store eye/mouth data for preview, even if channels aren't configured
              // CRITICAL: Ensure lastFacePositionRef exists before updating
              if (!lastFacePositionRef.current) {
                // Initialize if it doesn't exist
                const faceX = face.x * scaleX;
                const faceY = face.y * scaleY;
                const faceW = face.width * scaleX;
                const faceH = face.height * scaleY;
                lastFacePositionRef.current = {
                  x: faceX,
                  y: faceY,
                  width: faceW,
                  height: faceH,
                  centerX: faceCenterX,
                  centerY: faceCenterY,
                  timestamp: Date.now(),
                  yaw: undefined,
                  pitch: undefined
                };
              }
              
              if (lastFacePositionRef.current) {
                const faceX = face.x * scaleX;
                const faceY = face.y * scaleY;
                const faceW = face.width * scaleX;
                const faceH = face.height * scaleY;
                
              }

              // IMPROVED HEAD POSE ESTIMATION - Track head orientation, not screen position
              // Use face geometry and eye positions to estimate actual head rotation
              
              const faceAspectRatio = face.width / face.height;
              
              // Calculate eye positions relative to face center for head rotation detection
              // Always use actual eye regions (we always detect them now)
              const leftEyeCenterX = face.x + face.width * 0.3; // Left eye center (30% from left)
              const leftEyeCenterY = face.y + face.height * 0.325; // 32.5% from top
              const rightEyeCenterX = face.x + face.width * 0.7; // Right eye center (70% from left)
              const rightEyeCenterY = face.y + face.height * 0.325; // 32.5% from top
              
              // Calculate eye line (line connecting left and right eye centers)
              const eyeLineLength = Math.sqrt(
                Math.pow(rightEyeCenterX - leftEyeCenterX, 2) + 
                Math.pow(rightEyeCenterY - leftEyeCenterY, 2)
              );
              const eyeLineAngle = Math.atan2(
                rightEyeCenterY - leftEyeCenterY,
                rightEyeCenterX - leftEyeCenterX
              );
              
              // YAW (pan) - head turning left/right
              // When head turns:
              // 1. Eye line angle changes (eyes become more vertical when turned)
              // 2. Face appears narrower (aspect ratio decreases)
              // 3. One eye becomes more visible than the other
              
              // Normal eye line is horizontal (angle ≈ 0)
              // When turning left: angle becomes negative, right eye moves forward
              // When turning right: angle becomes positive, left eye moves forward
              const eyeLineYaw = eyeLineAngle * 2; // Scale angle to -1 to 1 range
              
              // Face width change indicates head rotation
              // Normal face aspect ratio: ~0.75-0.85
              // When turned: aspect ratio decreases (face appears narrower)
              const normalAspectRatio = 0.8;
              const aspectRatioYaw = (normalAspectRatio - faceAspectRatio) / normalAspectRatio;
              
              // Eye visibility asymmetry (one eye more visible when turned)
              const faceCenterXForPose = face.x + face.width / 2;
              const leftEyeOffset = (leftEyeCenterX - faceCenterXForPose) / (face.width / 2);
              const rightEyeOffset = (rightEyeCenterX - faceCenterXForPose) / (face.width / 2);
              const eyeAsymmetry = (rightEyeOffset - leftEyeOffset) * 0.5; // -1 to 1
              
              // Combine all yaw indicators
              const yaw = eyeLineYaw * 0.4 + aspectRatioYaw * 0.4 + eyeAsymmetry * 0.2;
              
              // PITCH (tilt) - head nodding up/down
              // When nodding:
              // 1. Face center moves vertically
              // 2. Face height changes (appears taller when looking down, shorter when looking up)
              // 3. Eye line moves up/down relative to face center
              
              const faceCenterYForPose = face.y + face.height / 2;
              const eyeLineCenterY = (leftEyeCenterY + rightEyeCenterY) / 2;
              
              // Vertical position of eyes relative to face center
              // When looking down: eyes move up relative to face center, face appears taller
              // When looking up: eyes move down relative to face center, face appears shorter
              const eyeVerticalOffset = (eyeLineCenterY - faceCenterYForPose) / (face.height / 2);
              
              // Face height change
              // Normal face height ratio (relative to expected size)
              const expectedFaceHeight = video.videoHeight * 0.15; // Expected ~15% of screen height
              const heightRatio = face.height / expectedFaceHeight;
              const heightPitch = (heightRatio - 1.0) * 0.5; // Normalize
              
              // Face center vertical position (less important, but contributes)
              const centerVerticalOffset = (faceCenterY - imageCenterY) / imageCenterY;
              
              // Combine pitch indicators
              const pitch = eyeVerticalOffset * 0.5 + heightPitch * 0.3 + centerVerticalOffset * 0.2;
              
              // Use yaw for pan and pitch for tilt
              const pan = Math.max(-1, Math.min(1, yaw)); // Clamp to -1 to 1
              const tilt = Math.max(-1, Math.min(1, pitch)); // Clamp to -1 to 1
              
              // Store head pose in face position for accurate gaze projection
              if (lastFacePositionRef.current) {
                lastFacePositionRef.current.yaw = yaw;
                lastFacePositionRef.current.pitch = pitch;
                lastFacePositionRef.current.pan = pan;
                lastFacePositionRef.current.tilt = tilt;
              }
              
              // Removed logging to prevent Firefox crashes

              // Track gesture history for pattern detection
              const history = gestureHistoryRef.current;
              history.panHistory.push(pan);
              history.tiltHistory.push(tilt);
              
              // Keep only last 15 samples (for better gesture detection)
              if (history.panHistory.length > 15) {
                history.panHistory.shift();
                history.tiltHistory.shift();
              }

              // Apply cutoff (dead zone) - only update if movement exceeds threshold
              const panAbs = Math.abs(pan);
              const tiltAbs = Math.abs(tilt);
              
              // Target values: use actual pan/tilt if above cutoff, otherwise use 0 (center)
              // This ensures the tracker responds to movement
              const targetPan = panAbs > settings.cutoff ? pan : 0;
              const targetTilt = tiltAbs > settings.cutoff ? tilt : 0;

              // Apply smoothing with exponential moving average
              const smoothingRate = 1 - settings.smoothingFactor;
              let newPan = smoothedPanRef.current * settings.smoothingFactor + targetPan * smoothingRate;
              let newTilt = smoothedTiltRef.current * settings.smoothingFactor + targetTilt * smoothingRate;

              // Apply velocity limiting (max change per update)
              const maxChange = settings.maxVelocity / 100; // Convert to reasonable scale (5.0 = 5% max change per frame)
              const panChange = newPan - smoothedPanRef.current;
              const tiltChange = newTilt - smoothedTiltRef.current;
              
              if (Math.abs(panChange) > maxChange) {
                newPan = smoothedPanRef.current + Math.sign(panChange) * maxChange;
              }
              if (Math.abs(tiltChange) > maxChange) {
                newTilt = smoothedTiltRef.current + Math.sign(tiltChange) * maxChange;
              }
              
              smoothedPanRef.current = newPan;
              smoothedTiltRef.current = newTilt;
              
              // Removed logging to prevent Firefox crashes

              // Map to DMX values (pan/tilt are -1 to 1, map to 0-255)
              // Apply flip if enabled (invert direction)
              const panDirection = settings.flipPan ? -1 : 1;
              const tiltDirection = settings.flipTilt ? -1 : 1;
              // Apply sensitivity and scale, then add offset
              const panScaled = smoothedPanRef.current * panDirection * settings.panSensitivity * 127; // -127 to 127
              const tiltScaled = smoothedTiltRef.current * tiltDirection * settings.tiltSensitivity * 127; // -127 to 127
              
              // Calculate target values
              const targetPanValue = Math.round(
                Math.max(settings.panMin, Math.min(settings.panMax,
                  panScaled + settings.panOffset // Offset is center (128), so result is 1-255
                ))
              );
              const targetTiltValue = Math.round(
                Math.max(settings.tiltMin, Math.min(settings.tiltMax,
                  tiltScaled + settings.tiltOffset // Offset is center (128), so result is 1-255
                ))
              );

              // Apply delay if enabled (telegram effect)
              const delayNow = Date.now();
              let panValue = targetPanValue;
              let tiltValue = targetTiltValue;
              // Calculate zoom value based on face size (distance from camera)
              // Larger face = closer = zoom out, smaller face = farther = zoom in
              let zoomValue = 128; // Default center
              if (settings.zoomChannel > 0) {
                // Use face area as proxy for distance
                const faceArea = face.width * face.height;
                const normalizedFaceArea = faceArea / (video.videoWidth * video.videoHeight);
                
                // Baseline face size (adjust based on typical distance)
                const baselineArea = 0.1; // ~10% of screen = baseline distance
                const distanceRatio = normalizedFaceArea / baselineArea;
                
                // Closer (larger face) = lower zoom, farther (smaller face) = higher zoom
                // Invert: larger area = closer = zoom out (lower value), smaller area = farther = zoom in (higher value)
                const zoomNormalized = 1 - Math.min(1, distanceRatio * settings.zoomSensitivity);
                
                // Apply dead zone
                const zoomChange = Math.abs(zoomNormalized - 0.5);
                if (zoomChange > settings.zoomDeadZone / 100) {
                  zoomValue = Math.round(
                    Math.max(settings.zoomMin, Math.min(settings.zoomMax,
                      settings.zoomMin + (settings.zoomMax - settings.zoomMin) * zoomNormalized * settings.zoomScale
                    ))
                  );
                } else {
                  zoomValue = Math.round((settings.zoomMin + settings.zoomMax) / 2); // Center
                }
              }
              
              // X/Y, iris, and zoom values (may be modified by delay)
              let finalXValue = xPositionValue;
              let finalYValue = yPositionValue;
              let finalIrisValue = irisValue;
              let finalZoomValue = zoomValue;
              
              if (settings.delay > 0) {
                // Add current values to delay buffer
                delayBufferRef.current.push({
                  pan: targetPanValue,
                  tilt: targetTiltValue,
                  x: xPositionValue,
                  y: yPositionValue,
                  iris: irisValue,
                  zoom: zoomValue,
                  timestamp: delayNow
                });
                
                // Remove old entries (older than delay + some buffer)
                const maxAge = settings.delay + 500; // Keep entries for delay + 500ms buffer
                delayBufferRef.current = delayBufferRef.current.filter(
                  entry => (delayNow - entry.timestamp) <= maxAge
                );
                
                // Find the value from delay time ago
                const targetTime = delayNow - settings.delay;
                let closestEntry = delayBufferRef.current[0];
                let closestDiff = Infinity;
                
                // Find closest entry to target time
                for (const entry of delayBufferRef.current) {
                  const diff = Math.abs(entry.timestamp - targetTime);
                  if (diff < closestDiff) {
                    closestDiff = diff;
                    closestEntry = entry;
                  }
                }
                
                // Use delayed values if we have a close enough match
                if (closestEntry && closestDiff < settings.delay) {
                  panValue = closestEntry.pan;
                  tiltValue = closestEntry.tilt;
                  // Also delay X/Y, iris, and zoom if delay is enabled
                  finalXValue = closestEntry.x;
                  finalYValue = closestEntry.y;
                  finalIrisValue = closestEntry.iris;
                  finalZoomValue = closestEntry.zoom;
                } else {
                  // If no delayed value available yet, use current (will build up over time)
                  panValue = targetPanValue;
                  tiltValue = targetTiltValue;
                }
              }

              // Always update state for UI display (not just when sending DMX)
              // Only update if values actually changed to prevent unnecessary re-renders
              setState(prev => {
                // Check if values actually changed
                const valuesChanged = prev.currentPan !== panValue || 
                                     prev.currentTilt !== tiltValue ||
                                     prev.currentX !== finalXValue ||
                                     prev.currentY !== finalYValue ||
                                     prev.currentIris !== finalIrisValue ||
                                     prev.currentZoom !== finalZoomValue;
                
                // Log occasionally if values seem stuck (for debugging)
                if (!valuesChanged && Math.random() < 0.01) {
                  console.log('[FaceTracker] Values update check:', {
                    panValue,
                    tiltValue,
                    prevPan: prev.currentPan,
                    prevTilt: prev.currentTilt,
                    faceDetected: !!lastFacePositionRef.current
                  });
                }
                
                return {
                  ...prev, 
                  currentPan: panValue, 
                  currentTilt: tiltValue,
                  currentX: finalXValue,
                  currentY: finalYValue,
                  currentIris: finalIrisValue,
                  currentZoom: finalZoomValue
                };
              });

              // Removed logging to prevent Firefox crashes

              // Overlays are now drawn in the preview loop for persistence

              // Send DMX update (using delayed values if delay is enabled)
              const updateNow = Date.now();
              const updateInterval = 1000 / settings.updateRate;
              if (updateNow - lastUpdateRef.current >= updateInterval) {
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
                    // Use configured channels (only if channels are configured)
                    if (settings.panChannel > 0) {
                      dmxUpdates[settings.panChannel - 1] = panValue;
                    }
                    if (settings.tiltChannel > 0) {
                      dmxUpdates[settings.tiltChannel - 1] = tiltValue;
                    }
                    // Add other channels
                    if (settings.xPositionChannel > 0) {
                      dmxUpdates[settings.xPositionChannel - 1] = finalXValue;
                    }
                    if (settings.yPositionChannel > 0) {
                      dmxUpdates[settings.yPositionChannel - 1] = finalYValue;
                    }
                    if (settings.irisChannel > 0) {
                      dmxUpdates[settings.irisChannel - 1] = finalIrisValue;
                    }
                    if (settings.zoomChannel > 0) {
                      dmxUpdates[settings.zoomChannel - 1] = finalZoomValue;
                    }
                  }

                  // Only send if we have updates
                  if (Object.keys(dmxUpdates).length > 0) {
                    // Send via socket or HTTP
                    if (socket && socketConnected) {
                      try {
                        (socket as any).emit('dmx:batch', dmxUpdates);
                        // Removed logging to prevent Firefox crashes
                        
                        // Send OSC if enabled and throttled
                        const nowForOsc = Date.now();
                        const oscThrottleInterval = settings.oscSmoothing || 50; // Default 50ms = 20 messages/sec max
                        const canSendOsc = (nowForOsc - lastOscSendRef.current) >= oscThrottleInterval;
                        
                        if (settings.useOSC && canSendOsc) {
                          lastOscSendRef.current = nowForOsc;
                          if (settings.useArtBastardOSC && oscAssignments) {
                            // Use ArtBastard's OSC server with configured assignments
                            const panOscAddress = oscAssignments[settings.panChannel - 1] || settings.oscPanAddress;
                            const tiltOscAddress = oscAssignments[settings.tiltChannel - 1] || settings.oscTiltAddress;
                            
                            if (panOscAddress) {
                              (socket as any).emit('sendOsc', {
                                address: panOscAddress,
                                args: [{ type: 'f', value: panValue / 255.0 }]
                              });
                              console.log('[FaceTracker] OSC sent (Pan):', panOscAddress, panValue / 255.0);
                            }
                            if (tiltOscAddress) {
                              (socket as any).emit('sendOsc', {
                                address: tiltOscAddress,
                                args: [{ type: 'f', value: tiltValue / 255.0 }]
                              });
                              console.log('[FaceTracker] OSC sent (Tilt):', tiltOscAddress, tiltValue / 255.0);
                            }
                          } else {
                            // Use custom OSC sending (via server with custom host/port)
                    if (settings.oscPanAddress) {
                              (socket as any).emit('sendOsc', {
                        address: settings.oscPanAddress,
                                args: [{ type: 'f', value: panValue / 255.0 }],
                                host: settings.oscHost,
                                port: settings.oscPort
                      });
                              console.log('[FaceTracker] Custom OSC sent (Pan):', settings.oscPanAddress, settings.oscHost, settings.oscPort);
                    }
                    if (settings.oscTiltAddress) {
                              (socket as any).emit('sendOsc', {
                        address: settings.oscTiltAddress,
                                args: [{ type: 'f', value: tiltValue / 255.0 }],
                                host: settings.oscHost,
                                port: settings.oscPort
                              });
                              console.log('[FaceTracker] Custom OSC sent (Tilt):', settings.oscTiltAddress, settings.oscHost, settings.oscPort);
                            }
                          }
                        }
                      } catch (socketError) {
                        console.error('[FaceTracker] Socket error:', socketError);
                        // Fallback to HTTP API
                        fetch('/api/dmx/batch', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(dmxUpdates),
                        }).catch(err => console.error('[FaceTracker] HTTP fallback error:', err));
                    }
                  } else {
                      console.warn('[FaceTracker] Socket not connected, using HTTP fallback');
                    // Fallback to HTTP API
                    fetch('/api/dmx/batch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(dmxUpdates),
                      }).then(() => {
                        console.log('[FaceTracker] DMX batch sent via HTTP:', dmxUpdates);
                      }).catch(err => console.error('[FaceTracker] HTTP fallback error:', err));
                    }
                  } else {
                    console.warn('[FaceTracker] No DMX updates to send (empty dmxUpdates object)');
                  }
                  
                  lastUpdateRef.current = now;
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
          // No face detected - log occasionally
          if (faces.size() === 0 && Math.random() < 0.05) {
            console.log('[OpenCV] No faces detected in this frame');
          }
          setState(prev => ({ ...prev, faceDetected: false }));
          // Clear face position after timeout (handled in preview loop)
        }

        // Text overlays are now drawn in the preview loop for better performance

        // Cleanup OpenCV objects - CRITICAL to prevent memory leaks
        // Don't check isDeleted() - just try to delete and catch errors
        try {
          if (src) {
            try { src.delete(); } catch (e) { /* Already deleted */ }
          }
          if (gray) {
            try { gray.delete(); } catch (e) { /* Already deleted */ }
          }
          if (faces) {
            try { faces.delete(); } catch (e) { /* Already deleted */ }
          }
          if (msize) {
            try { msize.delete(); } catch (e) { /* Already deleted */ }
          }
          if (maxSizeObj) {
            try { maxSizeObj.delete(); } catch (e) { /* Already deleted */ }
          }
        } catch (cleanupError) {
          // Silently ignore cleanup errors to prevent console spam
        }

        // Detection complete - loop continues automatically via RAF
      } catch (error) {
        // Catch any unhandled errors and log them - prevent page crash
        console.error('[FaceTracker] Frame processing error:', error);
        // Loop continues even on error (RAF already scheduled at top)
      }
    };

    // Start the continuous loop (called once per detectFaces call)
    console.log('[FaceTracker] 🎬 Starting RAF loop with Hz:', opencvHzRef.current);
    processDetection();
  }, [socket]); // Removed state.isRunning and settings.opencvHz - using refs instead for real-time updates

  // Cleanup detection loop when component unmounts
  useEffect(() => {
    return () => {
      if (detectionFrameRef.current) {
        console.log('[FaceTracker] 🛑 Component unmounting - stopping detection loop');
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = undefined;
      }
    };
  }, []);

  // No more timer logic - using RAF loop instead!

  // Start both preview and detection loops
  const startTracking = useCallback(() => {
    console.log('[FaceTracker] startTracking called', {
      opencvReady: !!opencvRef.current,
      cascadeReady: !!cascadeRef.current,
      videoReady: !!videoRef.current,
      canvasReady: !!canvasRef.current,
      isRunning: state.isRunning
    });
    
    if (!opencvRef.current || !cascadeRef.current) {
      console.warn('[FaceTracker] Cannot start tracking: OpenCV or cascade not ready');
      return;
    }
    
    if (!videoRef.current || !canvasRef.current) {
      console.warn('[FaceTracker] Cannot start tracking: Video or canvas not ready');
      return;
    }
    
    // Only start if actually running
    if (!state.isRunning) {
      console.warn('[FaceTracker] Cannot start tracking: Not running');
      return;
    }
    
    console.log('[FaceTracker] Starting preview and detection');
    
    // Defer starting loops to prevent blocking - use longer delay for Firefox stability
    setTimeout(() => {
      // Only start if still running after delay
      if (!state.isRunning) {
        return;
      }
      
      // Start preview RAF loop immediately
      console.log('[FaceTracker] 🎥 Starting preview RAF loop');
      renderPreview();
      
      // Start detection RAF loop with small delay to ensure OpenCV is ready
      setTimeout(() => {
        if (state.isRunning && opencvRef.current && cascadeRef.current) {
          console.log('[FaceTracker] 🎯 Starting detection RAF loop');
          detectFaces();
        } else {
          console.error('[FaceTracker] ❌ Cannot start detection - refs not ready:', {
            isRunning: state.isRunning,
            opencv: !!opencvRef.current,
            cascade: !!cascadeRef.current
          });
        }
      }, 500);
    }, 100); // Small delay to let camera initialize
  }, [renderPreview, state.isRunning, detectFaces]);

  useEffect(() => {
    console.log('[FaceTracker] 🔔 Main tracking effect triggered', {
      isRunning: state.isRunning,
      isInitialized: state.isInitialized,
      trackingStarted: trackingStartedRef.current,
      opencvReady: !!opencvRef.current,
      cascadeReady: !!cascadeRef.current
    });
    
    if (state.isRunning && state.isInitialized && !trackingStartedRef.current) {
      console.log('[FaceTracker] ✅ STARTING TRACKING...');
      trackingStartedRef.current = true;
      startTracking();
    } else if (!state.isRunning && trackingStartedRef.current) {
      console.log('[FaceTracker] 🛑 STOPPING TRACKING');
      trackingStartedRef.current = false;
      // Stop all loops when not running
      if (previewFrameRef.current) {
        cancelAnimationFrame(previewFrameRef.current);
        previewFrameRef.current = undefined;
      }
      // Stop detection RAF loop
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = undefined;
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = undefined;
      }
    }
    return () => {
      if (previewFrameRef.current) {
        cancelAnimationFrame(previewFrameRef.current);
        previewFrameRef.current = undefined;
      }
      // Stop detection RAF loop
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = undefined;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [state.isRunning, state.isInitialized, startTracking]);

  // Handle preview toggle - start/stop preview loop
  useEffect(() => {
    if (state.isRunning && videoRef.current && canvasRef.current) {
      // Start preview loop (always enabled - toggle removed)
      if (!previewFrameRef.current) {
        renderPreview();
      }
    } else {
      // Stop preview loop if not running
      if (previewFrameRef.current) {
        cancelAnimationFrame(previewFrameRef.current);
        previewFrameRef.current = undefined;
      }
    }
  }, [state.isRunning, renderPreview]);

  const updateSetting = (key: keyof FaceTrackerSettings, value: any) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated); // Autosave on change
      return updated;
    });
  };

  // Load default settings
  const loadDefaults = () => {
    if (window.confirm('Reset all Face Tracker settings to defaults? This will lose your current configuration.')) {
      setSettings(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      console.log('[FaceTracker] Settings reset to defaults');
    }
  };

  const [presetName, setPresetName] = useState<string>('');
  const [presets, setPresets] = useState<Record<string, FaceTrackerSettings>>({});
  const [showPresets, setShowPresets] = useState<boolean>(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const savedPresets = JSON.parse(localStorage.getItem('faceTrackerPresets') || '{}');
      setPresets(savedPresets);
    } catch (error) {
      console.error('[FaceTracker] Error loading presets:', error);
    }
  }, []);

  // Close preset dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showPresets && !target.closest('[data-preset-container]')) {
        setShowPresets(false);
      }
    };

    if (showPresets) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPresets]);

  // Save preset
  const savePreset = () => {
    if (!presetName || !presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }
    
    try {
      const newPresets = { ...presets, [presetName.trim()]: settings };
      localStorage.setItem('faceTrackerPresets', JSON.stringify(newPresets));
      setPresets(newPresets);
      setPresetName('');
      console.log('[FaceTracker] Preset saved:', presetName.trim());
    } catch (error) {
      console.error('[FaceTracker] Error saving preset:', error);
      alert('Error saving preset. Please try again.');
    }
  };

  // Load preset
  const loadPreset = (presetNameToLoad: string) => {
    try {
      if (!presets[presetNameToLoad]) {
        alert(`Preset "${presetNameToLoad}" not found.`);
        return;
      }
      
      const preset = presets[presetNameToLoad];
      setSettings(preset);
      saveSettings(preset); // Save to localStorage
      setShowPresets(false);
      console.log('[FaceTracker] Preset loaded:', presetNameToLoad);
    } catch (error) {
      console.error('[FaceTracker] Error loading preset:', error);
      alert('Error loading preset. Please try again.');
    }
  };

  // Delete preset
  const deletePreset = (presetNameToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete preset "${presetNameToDelete}"?`)) {
      return;
    }
    
    try {
      const newPresets = { ...presets };
      delete newPresets[presetNameToDelete];
      localStorage.setItem('faceTrackerPresets', JSON.stringify(newPresets));
      setPresets(newPresets);
      console.log('[FaceTracker] Preset deleted:', presetNameToDelete);
    } catch (error) {
      console.error('[FaceTracker] Error deleting preset:', error);
      alert('Error deleting preset. Please try again.');
    }
  };

  // Set current face position as center
  const setToCenter = () => {
    if (!state.isRunning || !state.faceDetected) {
      alert('Face Tracker must be running and detecting your face to set center position. Please start tracking and ensure your face is visible.');
      return;
    }

    // Get current smoothed pan/tilt values
    const currentPan = smoothedPanRef.current;
    const currentTilt = smoothedTiltRef.current;

    // Calculate center values based on range limits
    const panCenter = (settings.panMin + settings.panMax) / 2;
    const tiltCenter = (settings.tiltMin + settings.tiltMax) / 2;

    // Apply flip direction and sensitivity to get the scaled value
    const panDirection = settings.flipPan ? -1 : 1;
    const tiltDirection = settings.flipTilt ? -1 : 1;
    const panScaled = currentPan * panDirection * settings.panSensitivity * 127;
    const tiltScaled = currentTilt * tiltDirection * settings.tiltSensitivity * 127;

    // Calculate new offsets so current position maps to center
    const newPanOffset = Math.round(panCenter - panScaled);
    const newTiltOffset = Math.round(tiltCenter - tiltScaled);

    // Clamp offsets to reasonable range (0-255)
    const clampedPanOffset = Math.max(0, Math.min(255, newPanOffset));
    const clampedTiltOffset = Math.max(0, Math.min(255, newTiltOffset));

    // Update settings
    updateSetting('panOffset', clampedPanOffset);
    updateSetting('tiltOffset', clampedTiltOffset);

    console.log('[FaceTracker] Set to center:', {
      currentPan,
      currentTilt,
      panCenter,
      tiltCenter,
      newPanOffset: clampedPanOffset,
      newTiltOffset: clampedTiltOffset
    });

    alert(`Center position set!\nPan Offset: ${clampedPanOffset}\nTilt Offset: ${clampedTiltOffset}\n\nYour current face position is now the center. Looking left will decrease values, looking right will increase values.`);
  };

  return (
    <div className={styles.faceTracker}>
      <div className={styles.header}>
        <h2 className={styles.title}>Face Tracker</h2>
        <div className={styles.controls}>
          <button
            onClick={loadDefaults}
            className={styles.secondaryButton}
            title="Reset all settings to default values"
          >
            Load Defaults
          </button>
          <div data-preset-container style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && presetName.trim()) {
                    savePreset();
                  }
                }}
                placeholder="Preset name..."
                className={styles.textInput}
                style={{ minWidth: '150px', flex: 1 }}
                title="Enter a name for the preset"
              />
              <button
                onClick={savePreset}
                className={styles.secondaryButton}
                title="Save current settings as a preset"
                disabled={!presetName.trim()}
              >
                <i className="fas fa-save"></i> Save
              </button>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className={styles.secondaryButton}
                title="Show saved presets"
              >
                <i className="fas fa-folder-open"></i> Load
                {Object.keys(presets).length > 0 && (
                  <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', opacity: 0.8 }}>
                    ({Object.keys(presets).length})
                  </span>
                )}
              </button>
            </div>
            {showPresets && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.25rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '0.5rem',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {Object.keys(presets).length === 0 ? (
                  <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No presets saved yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {Object.keys(presets).map((name) => (
                      <div
                        key={name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-primary)';
                        }}
                      >
                        <button
                          onClick={() => loadPreset(name)}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            fontSize: '0.9rem'
                          }}
                          title={`Load preset: ${name}`}
                        >
                          <i className="fas fa-play" style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}></i>
                          {name}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(name);
                          }}
                          style={{
                            background: 'var(--error-color, #ff4444)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            transition: 'opacity 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          title={`Delete preset: ${name}`}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={state.isRunning}
              onChange={async (e) => {
                e.stopPropagation();
                const shouldRun = e.target.checked;
                console.log('[FaceTracker] 🔘 Toggle clicked:', shouldRun);
                // Update state immediately for UI responsiveness
                setState(prev => {
                  console.log('[FaceTracker] 🔘 setState called, changing isRunning from', prev.isRunning, 'to', shouldRun);
                  return { ...prev, isRunning: shouldRun };
                });
                try {
                  if (shouldRun) {
                    console.log('[FaceTracker] 🟢 Starting camera...');
                    await startCamera();
                  } else {
                    console.log('[FaceTracker] 🔴 Stopping camera...');
                    stopCamera();
                  }
                } catch (error) {
                  // If camera fails, revert state
                  console.error('[FaceTracker] ❌ Toggle error:', error);
                  setState(prev => {
                    console.log('[FaceTracker] ❌ Reverting isRunning due to error');
                    return { ...prev, isRunning: !shouldRun };
                  });
                  setDiagnostics(prev => ({ 
                    ...prev, 
                    cameraStatus: 'error', 
                    cameraError: error instanceof Error ? error.message : 'Unknown error'
                  }));
                }
              }}
              onClick={(e) => {
                // Edge compatibility: prevent double-firing
                e.stopPropagation();
              }}
              disabled={!state.isInitialized}
              className={styles.toggleInput}
            />
            <span className={`${styles.toggleSlider} ${state.isRunning ? styles.toggleActive : ''}`}>
              <span className={styles.toggleLabel}>{state.isRunning ? 'ON' : 'OFF'}</span>
            </span>
          </label>
        </div>
      </div>

      {state.error && (
        <div className={styles.error}>
          {state.error}
          <button 
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className={styles.mainContainer}>
        {/* Left Side - Face Tracker Preview and Controls */}
        <div className={styles.trackerSide}>
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

          {/* Live Control Output - Full width row, sticky */}
          <div className={styles.liveControlRow}>
            <div className={styles.liveControlContainer}>
              <h4 className={styles.controlsTitle}>Live Control Output</h4>
              <div className={styles.liveControlSliders}>
                <div className={styles.liveControlSliderItem}>
                  <label className={styles.liveControlSliderLabel}>Pan: {state.currentPan}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={state.currentPan}
                    readOnly
                    disabled
                    className={styles.liveControlSlider}
                  />
                </div>
                <div className={styles.liveControlSliderItem}>
                  <label className={styles.liveControlSliderLabel}>Tilt: {state.currentTilt}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={state.currentTilt}
                    readOnly
                    disabled
                    className={styles.liveControlSlider}
                  />
                </div>
                <div className={styles.liveControlSliderItem}>
                  <label className={styles.liveControlSliderLabel}>X: {state.currentX}</label>
                  <input
                    type="range"
                    min={settings.xPositionMin}
                    max={settings.xPositionMax}
                    step="1"
                    value={state.currentX}
                    readOnly
                    disabled
                    className={styles.liveControlSlider}
                  />
                </div>
                <div className={styles.liveControlSliderItem}>
                  <label className={styles.liveControlSliderLabel}>Y: {state.currentY}</label>
                  <input
                    type="range"
                    min={settings.yPositionMin}
                    max={settings.yPositionMax}
                    step="1"
                    value={state.currentY}
                    readOnly
                    disabled
                    className={styles.liveControlSlider}
                  />
                </div>
                <div className={styles.liveControlSliderItem}>
                  <label className={styles.liveControlSliderLabel}>Iris: {state.currentIris}</label>
                  <input
                    type="range"
                    min={settings.irisMin}
                    max={settings.irisMax}
                    step="1"
                    value={state.currentIris}
                    readOnly
                    disabled
                    className={styles.liveControlSlider}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Flags - Debug Section (LEFT of preview for visibility) */}
          <div className={styles.controlGroup} style={{ border: '2px solid #ff6b6b', borderRadius: '8px', padding: '1rem', background: 'rgba(255, 107, 107, 0.1)', marginBottom: '1rem' }}>
            <label className={styles.controlLabel} style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b6b' }}>
              🔧 Feature Flags (Debug Mode)
            </label>
            <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: '#ff6b6b' }}>
              Disable features one by one to isolate crashes. Start with all disabled, then enable one at a time.
            </p>
          </div>

          {/* Camera Preview and 3D Fixture - 2 columns, sticky */}
          <div className={styles.previewSection}>
            {/* Camera Preview - Always shown (placeholder when off) */}
            <div className={`${styles.previewContainer} ${!state.isRunning ? styles.placeholder : ''}`} ref={previewContainerRef}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>Camera Preview</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {state.isRunning && (
                    <div className={styles.fpsCounters}>
                      <span className={styles.fpsCounterItem}>Webcam: {state.webcamFps} FPS</span>
                      <span className={styles.fpsCounterItem}>Overlay: {state.overlayFps} FPS</span>
                      <span className={styles.fpsCounterItem}>OpenCV: {state.opencvHz} Hz</span>
                    </div>
                  )}
                  {state.isRunning && (
                    <button
                      className={styles.refreshButton}
                      onClick={() => {
                        console.log('[FaceTracker] 🔄 Manual refresh triggered - resetting detection timer');
                        // Force immediate detection by resetting the last detection time
                        lastDetectionTimeRef.current = 0;
                        console.log('[FaceTracker] Next RAF cycle will run detection immediately');
                      }}
                      title="Manually refresh OpenCV detection - forces immediate face detection cycle"
                    >
                      <i className="fas fa-sync-alt"></i> Refresh OpenCV
                    </button>
                  )}
                </div>
              </div>
              {/* OpenCV Hz Control - Prominent placement near camera preview */}
              {state.isRunning && (
                <div className={styles.opencvFpsControl}>
                  <label className={styles.opencvFpsLabel} title="How often to automatically run face detection. Low values (0.5-1 Hz) use minimal CPU. Medium (2-3 Hz) is balanced. High (5-10 Hz) provides smooth tracking but uses more CPU. Default: 1 Hz (once per second)">
                    <i className="fas fa-tachometer-alt"></i> OpenCV Detection Rate: {settings.opencvHz || 1} Hz
                  </label>
                  <div className={styles.opencvFpsSliderWrapper}>
                    <span className={styles.opencvFpsRangeLabel}>0.1</span>
                    <input
                      type="range"
                      min="0.1"
                      max="120"
                      step="0.1"
                      value={settings.opencvHz || 1}
                      onChange={(e) => updateSetting('opencvHz', parseFloat(e.target.value))}
                      className={styles.opencvFpsSlider}
                      title="Detection rate in Hz (detections per second). Range: 0.1-120 Hz"
                    />
                    <span className={styles.opencvFpsRangeLabel}>120</span>
                    <input
                      type="number"
                      min="0.1"
                      max="120"
                      step="0.1"
                      value={settings.opencvHz || 1}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0.1 && value <= 120) updateSetting('opencvHz', value);
                      }}
                      className={styles.opencvFpsNumberInput}
                      title="Detection rate in Hz (detections per second). Range: 0.1-120 Hz"
                    />
                  </div>
                </div>
              )}
              {state.isRunning ? (
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
                <div className={styles.placeholderContent}>
                  <i className="fas fa-video" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}></i>
                  <span style={{ opacity: 0.5 }}>Camera preview will appear when Face Tracker is enabled</span>
                </div>
              )}
            </div>

            {/* 3D Fixture Model - Always shown (placeholder when off) */}
            <div className={`${styles.fixture3DContainer} ${!state.isRunning ? styles.placeholder : ''}`}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>3D Fixture Model</span>
              </div>
              {state.isRunning ? (() => {
                  // Get RGB color from first selected fixture
                  let rgbColor = { r: 255, g: 200, b: 100 }; // Default warm white
                  if (selectedFixtureIds.length > 0) {
                    const firstFixture = fixtures.find(f => selectedFixtureIds.includes(f.id));
                    if (firstFixture) {
                      const redCh = firstFixture.channels.find(c => c.type === 'red');
                      const greenCh = firstFixture.channels.find(c => c.type === 'green');
                      const blueCh = firstFixture.channels.find(c => c.type === 'blue');
                      
                      if (redCh && greenCh && blueCh) {
                        const redAddr = redCh.dmxAddress ?? (firstFixture.startAddress + firstFixture.channels.indexOf(redCh));
                        const greenAddr = greenCh.dmxAddress ?? (firstFixture.startAddress + firstFixture.channels.indexOf(greenCh));
                        const blueAddr = blueCh.dmxAddress ?? (firstFixture.startAddress + firstFixture.channels.indexOf(blueCh));
                        
                        const dmxChannels = useStore.getState().dmxChannels;
                        rgbColor = {
                          r: dmxChannels[redAddr - 1] || 0,
                          g: dmxChannels[greenAddr - 1] || 0,
                          b: dmxChannels[blueAddr - 1] || 0
                        };
                        
                        // If all are 0, use default
                        if (rgbColor.r === 0 && rgbColor.g === 0 && rgbColor.b === 0) {
                          rgbColor = { r: 255, g: 200, b: 100 };
                        }
                      }
                    }
                  }
                  
                  // Get shutter and gobo values from DMX channels
                  const dmxChannels = useStore.getState().dmxChannels;
                  const shutterValue = settings.shutterChannel > 0 ? (dmxChannels[settings.shutterChannel - 1] || 255) : 255;
                  const goboValue = settings.goboChannel > 0 ? (dmxChannels[settings.goboChannel - 1] || 0) : 0;
                  
                  return (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '100%', 
                      height: '100%', 
                      minHeight: '300px',
                      flex: 1
                    }}>
                      <Fixture3DModel
                        panValue={state.currentPan}
                        tiltValue={state.currentTilt}
                        zoomValue={state.currentZoom}
                        irisValue={state.currentIris}
                        shutterValue={shutterValue}
                        goboValue={goboValue}
                        rgbColor={rgbColor}
                        width={400}
                        height={400}
                      />
                    </div>
                  );
                })() : (
                  <div className={styles.placeholderContent}>
                    <i className="fas fa-cube" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}></i>
                    <span style={{ opacity: 0.5 }}>3D fixture model will appear when Face Tracker is enabled</span>
                  </div>
                )}
            </div>
          </div>

          {/* Settings Sections - Below preview section */}
          <div className={styles.previewControls}>
            <div className={styles.allControls}>
            {/* Camera Selection - Moved to Basic Settings */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>Basic Settings</h4>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Select which camera to use for face tracking">
                  Camera Selection
                </label>
                {availableCameras.length === 0 ? (
                  <div className={styles.noCameras}>No cameras detected. Click "Start" to enable camera access.</div>
                ) : (
                  <select
                    value={settings.cameraIndex}
                    onChange={(e) => updateSetting('cameraIndex', parseInt(e.target.value, 10))}
                    disabled={state.isRunning}
                    className={styles.selectInput}
                    title="Select camera for face tracking"
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId || index} value={index}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>


            {/* Tracking Settings Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>Tracking Settings</h4>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Controls how much horizontal (left/right) head movement translates to pan DMX values. Higher values = more movement per head turn. Start with 1.0 and adjust: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter out jitter.">
                  Pan Sensitivity
                </label>
                <p className={styles.helpText}>
                  Controls horizontal (left/right) head movement translation to pan DMX. Higher = more movement per head turn. 
                  Start at 1.0: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter jitter.
                </p>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={settings.panSensitivity}
                    onChange={(e) => updateSetting('panSensitivity', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Controls how much horizontal (left/right) head movement translates to pan DMX values. Higher values = more movement per head turn. Start with 1.0 and adjust: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter out jitter."
                  />
                  <span className={styles.rangeLabel}>5</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={settings.panSensitivity.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('panSensitivity', value);
                    }}
                    className={styles.numberInput}
                    title="Controls how much horizontal (left/right) head movement translates to pan DMX values. Higher values = more movement per head turn. Start with 1.0 and adjust: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter out jitter."
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Controls how much vertical (up/down) head movement translates to tilt DMX values. Higher values = more movement per head nod. Start with 1.0 and adjust: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter out jitter.">
                  Tilt Sensitivity
                </label>
                <p className={styles.helpText}>
                  Controls vertical (up/down) head movement translation to tilt DMX. Higher = more movement per head nod. 
                  Start at 1.0: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter jitter.
                </p>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={settings.tiltSensitivity}
                    onChange={(e) => updateSetting('tiltSensitivity', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Controls how much vertical (up/down) head movement translates to tilt DMX values. Higher values = more movement per head nod. Start with 1.0 and adjust: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter out jitter."
                  />
                  <span className={styles.rangeLabel}>5</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={settings.tiltSensitivity.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('tiltSensitivity', value);
                    }}
                    className={styles.numberInput}
                    title="Controls how much vertical (up/down) head movement translates to tilt DMX values. Higher values = more movement per head nod. Start with 1.0 and adjust: lower (0.5-0.8) for subtle tracking, higher (1.5-2.5) for dramatic movement. Works with Cutoff to filter out jitter."
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="How often to automatically run face detection. Low values (0.5-1 Hz) use minimal CPU. Medium (2-3 Hz) is balanced. High (5-10 Hz) provides smooth tracking but uses more CPU. Default: 1 Hz (once per second)">
                  OpenCV Detection Rate
                </label>
                <p className={styles.helpText}>
                  Controls how often face detection runs automatically (Hz = times per second). Low = less CPU, high = smoother tracking. Default: 1 Hz
                </p>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0.1</span>
                  <input
                    type="range"
                      min="0.1"
                      max="120"
                      step="0.1"
                      value={settings.opencvHz || 1}
                      onChange={(e) => updateSetting('opencvHz', parseFloat(e.target.value))}
                      className={styles.slider}
                      title="Detection rate in Hz (detections per second). Range: 0.1-120 Hz"
                  />
                  <span className={styles.rangeLabel}>120</span>
                  <input
                    type="number"
                    min="0.1"
                    max="120"
                    step="0.1"
                    value={settings.opencvHz || 1}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0.1 && value <= 120) updateSetting('opencvHz', value);
                    }}
                    className={styles.numberInput}
                    title="Detection rate in Hz (detections per second). Range: 0.1-120 Hz"
                  />
                </div>
              </div>

              <div className={styles.controlGroup} style={{ border: '2px solid var(--accent-color)', borderRadius: '8px', padding: '1rem', background: 'rgba(0, 212, 255, 0.1)', marginTop: '1rem' }}>
                <label className={styles.controlLabel} style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-color)' }} title="Smoothing factor for movement (0-1, higher = smoother but less responsive)">
                  🌊 SMOOTHING - Movement Smoothness
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                  <strong>This controls how smooth vs responsive the fixture movement is!</strong><br/>
                  Higher (0.8-0.95) = Very smooth, less jittery, but slower to respond to quick movements.<br/>
                  Lower (0.5-0.7) = More responsive, faster reaction, but may be jittery.<br/>
                  <strong>Default: 0.85</strong> - Good balance between smoothness and responsiveness.
                </p>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.smoothingFactor}
                    onChange={(e) => updateSetting('smoothingFactor', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Smoothing factor for movement (0-1, higher = smoother but less responsive)"
                  />
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.smoothingFactor.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('smoothingFactor', value);
                    }}
                    className={styles.numberInput}
                    title="Smoothing factor for movement (0-1, higher = smoother but less responsive)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Dead zone threshold to filter out small face movements and prevent jitter. Lower values (0.01-0.02) = more sensitive, tracks tiny movements. Higher values (0.05-0.1) = less sensitive, only tracks larger head movements. Works with Pan/Tilt Sensitivity: if tracking is too jittery, increase Cutoff. If tracking feels unresponsive, decrease Cutoff.">
                  Cutoff (Dead Zone)
                </label>
                <p className={styles.helpText}>
                  Filters out small face movements to prevent jitter. Lower (0.01-0.02) = more sensitive, tracks tiny movements. 
                  Higher (0.05-0.1) = less sensitive, only tracks larger head movements. 
                  If tracking is jittery, increase Cutoff. If unresponsive, decrease Cutoff. Works with Pan/Tilt Sensitivity.
                </p>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={settings.cutoff}
                    onChange={(e) => updateSetting('cutoff', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Dead zone threshold to filter out small face movements and prevent jitter. Lower values (0.01-0.02) = more sensitive, tracks tiny movements. Higher values (0.05-0.1) = less sensitive, only tracks larger head movements. Works with Pan/Tilt Sensitivity: if tracking is too jittery, increase Cutoff. If tracking feels unresponsive, decrease Cutoff."
                  />
                  <span className={styles.rangeLabel}>0.5</span>
                  <input
                    type="number"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={settings.cutoff.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('cutoff', value);
                    }}
                    className={styles.numberInput}
                    title="Dead zone threshold to filter out small face movements and prevent jitter. Lower values (0.01-0.02) = more sensitive, tracks tiny movements. Higher values (0.05-0.1) = less sensitive, only tracks larger head movements. Works with Pan/Tilt Sensitivity: if tracking is too jittery, increase Cutoff. If tracking feels unresponsive, decrease Cutoff."
                  />
                </div>
              </div>
            </div>

            {/* DMX Channels Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>DMX Channels (Auto-detected from OSC Assignments)</h4>
              <p className={styles.helpText} style={{ marginBottom: '1rem' }}>
                DMX channels are automatically detected from your OSC assignments. If you use ArtBastard OSC, 
                the channel numbers match the OSC assignment indices. You can manually override if needed.
              </p>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Flip/invert pan direction - if fixture moves opposite to your face, enable this">
                  <input
                    type="checkbox"
                    checked={settings.flipPan}
                    onChange={(e) => updateSetting('flipPan', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Flip Pan Direction (Invert Left/Right)
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Enable if turning your face left makes the fixture go right (or vice versa)
                </p>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Flip/invert tilt direction - if fixture moves opposite to your face, enable this">
                  <input
                    type="checkbox"
                    checked={settings.flipTilt}
                    onChange={(e) => updateSetting('flipTilt', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Flip Tilt Direction (Invert Up/Down)
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Enable if nodding your head up makes the fixture tilt down (or vice versa)
                </p>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Flip/invert mouth direction - if mouth open/closed is reversed, enable this">
                  <input
                    type="checkbox"
                    checked={settings.flipMouth}
                    onChange={(e) => updateSetting('flipMouth', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Flip Mouth Direction (Invert Open/Closed)
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Enable if mouth open sends closed value (or vice versa)
                </p>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Flip/invert eyes/iris direction - if iris open/closed is reversed, enable this">
                  <input
                    type="checkbox"
                    checked={settings.flipEyes}
                    onChange={(e) => updateSetting('flipEyes', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Flip Eyes/Iris Direction (Invert Open/Closed)
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Enable if eyes open sends closed value (or vice versa)
                </p>
              </div>
              <div className={styles.controlGroup}>
                <button
                  onClick={setToCenter}
                  className={styles.secondaryButton}
                  style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold' }}
                  title="Set your current face position as the center. Look straight ahead, then click this button."
                  disabled={!state.isRunning || !state.faceDetected}
                >
                  🎯 SET TO CENTER
                </button>
                <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
                  Position your face where you want it to be centered, then click this button. 
                  After calibration, looking left will decrease values (towards {settings.panMin}), 
                  looking right will increase values (towards {settings.panMax}).
                </p>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="DMX channel number for pan control (auto-detected from OSC assignments)">
                  Pan Channel
                  {oscAssignments && oscAssignments[settings.panChannel - 1] && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '0.5rem' }}>
                      → OSC: {oscAssignments[settings.panChannel - 1]}
                    </span>
                  )}
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="range"
                    min="1"
                    max="512"
                    step="1"
                    value={settings.panChannel}
                    onChange={(e) => updateSetting('panChannel', parseInt(e.target.value) || 1)}
                    className={styles.slider}
                    title="DMX channel number for pan control (auto-detected from OSC assignments)"
                  />
                  <span className={styles.rangeLabel}>512</span>
                  <input
                    type="number"
                    min="1"
                    max="512"
                    step="1"
                    value={settings.panChannel}
                    onChange={(e) => updateSetting('panChannel', parseInt(e.target.value) || 1)}
                    className={styles.numberInput}
                    title="DMX channel number for pan control (auto-detected from OSC assignments)"
                  />
                </div>
                {oscAssignments && oscAssignments[settings.panChannel - 1] && (
                  <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    OSC Address: <code>{oscAssignments[settings.panChannel - 1]}</code>
                  </p>
                )}
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="DMX channel number for tilt control (auto-detected from OSC assignments)">
                  Tilt Channel
                  {oscAssignments && oscAssignments[settings.tiltChannel - 1] && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '0.5rem' }}>
                      → OSC: {oscAssignments[settings.tiltChannel - 1]}
                    </span>
                  )}
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="range"
                    min="1"
                    max="512"
                    step="1"
                    value={settings.tiltChannel}
                    onChange={(e) => updateSetting('tiltChannel', parseInt(e.target.value) || 2)}
                    className={styles.slider}
                    title="DMX channel number for tilt control (auto-detected from OSC assignments)"
                  />
                  <span className={styles.rangeLabel}>512</span>
                  <input
                    type="number"
                    min="1"
                    max="512"
                    step="1"
                    value={settings.tiltChannel}
                    onChange={(e) => updateSetting('tiltChannel', parseInt(e.target.value) || 2)}
                    className={styles.numberInput}
                    title="DMX channel number for tilt control (auto-detected from OSC assignments)"
                  />
                </div>
                {oscAssignments && oscAssignments[settings.tiltChannel - 1] && (
                  <p className={styles.helpText} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    OSC Address: <code>{oscAssignments[settings.tiltChannel - 1]}</code>
                  </p>
                )}
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="DMX channel number for iris control (0 = disabled, 0-512)">
                  Iris Channel
                </label>
                <input
                  type="number"
                  min="0"
                  max="512"
                  step="1"
                  value={settings.irisChannel}
                  onChange={(e) => updateSetting('irisChannel', parseInt(e.target.value) || 0)}
                  className={styles.numberInput}
                  title="DMX channel number for iris control (0 = disabled, 0-512)"
                />
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="DMX channel number for zoom control (0 = disabled, 0-512)">
                  Zoom Channel
                </label>
                <input
                  type="number"
                  min="0"
                  max="512"
                  step="1"
                  value={settings.zoomChannel}
                  onChange={(e) => updateSetting('zoomChannel', parseInt(e.target.value) || 0)}
                  className={styles.numberInput}
                  title="DMX channel number for zoom control (0 = disabled, 0-512)"
                />
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="DMX channel number for focus control (0 = disabled, 0-512)">
                  Focus Channel
                </label>
                <input
                  type="number"
                  min="0"
                  max="512"
                  step="1"
                  value={settings.focusChannel}
                  onChange={(e) => updateSetting('focusChannel', parseInt(e.target.value) || 0)}
                  className={styles.numberInput}
                  title="DMX channel number for focus control (0 = disabled, 0-512)"
                />
              </div>
              
              {/* X/Y Position Tracking (for fixture following) */}
              <div className={styles.controlGroup} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <label className={styles.controlLabel} style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  📍 Position Tracking (Fixture Following)
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Track where your face is on screen (X/Y position) to make the fixture follow your position.
                </p>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="DMX channel for X position (horizontal, 0 = disabled)">
                    X Position Channel
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="512"
                    step="1"
                    value={settings.xPositionChannel}
                    onChange={(e) => updateSetting('xPositionChannel', parseInt(e.target.value) || 0)}
                    className={styles.numberInput}
                    title="DMX channel for X position (horizontal, 0 = disabled)"
                  />
                  {settings.xPositionChannel > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Current X: {state.currentX} (Range: {settings.xPositionMin}-{settings.xPositionMax})
                    </div>
                  )}
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="DMX channel for Y position (vertical, 0 = disabled)">
                    Y Position Channel
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="512"
                    step="1"
                    value={settings.yPositionChannel}
                    onChange={(e) => updateSetting('yPositionChannel', parseInt(e.target.value) || 0)}
                    className={styles.numberInput}
                    title="DMX channel for Y position (vertical, 0 = disabled)"
                  />
                  {settings.yPositionChannel > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Current Y: {state.currentY} (Range: {settings.yPositionMin}-{settings.yPositionMax})
                    </div>
                  )}
                </div>
              </div>
              
            </div>

            {/* Range Limits Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>Range Limits</h4>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Minimum DMX value for pan movement (0-255)">
                  Pan Min
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.panMin}
                    onChange={(e) => updateSetting('panMin', parseInt(e.target.value) || 0)}
                    className={styles.slider}
                    title="Minimum DMX value for pan movement (0-255)"
                  />
                  <span className={styles.rangeLabel}>255</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.panMin}
                    onChange={(e) => updateSetting('panMin', parseInt(e.target.value) || 0)}
                    className={styles.numberInput}
                    title="Minimum DMX value for pan movement (0-255)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Maximum DMX value for pan movement (0-255)">
                  Pan Max
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.panMax}
                    onChange={(e) => updateSetting('panMax', parseInt(e.target.value) || 255)}
                    className={styles.slider}
                    title="Maximum DMX value for pan movement (0-255)"
                  />
                  <span className={styles.rangeLabel}>255</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.panMax}
                    onChange={(e) => updateSetting('panMax', parseInt(e.target.value) || 255)}
                    className={styles.numberInput}
                    title="Maximum DMX value for pan movement (0-255)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Minimum DMX value for tilt movement (0-255)">
                  Tilt Min
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.tiltMin}
                    onChange={(e) => updateSetting('tiltMin', parseInt(e.target.value) || 0)}
                    className={styles.slider}
                    title="Minimum DMX value for tilt movement (0-255)"
                  />
                  <span className={styles.rangeLabel}>255</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.tiltMin}
                    onChange={(e) => updateSetting('tiltMin', parseInt(e.target.value) || 0)}
                    className={styles.numberInput}
                    title="Minimum DMX value for tilt movement (0-255)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Maximum DMX value for tilt movement (0-255)">
                  Tilt Max
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.tiltMax}
                    onChange={(e) => updateSetting('tiltMax', parseInt(e.target.value) || 255)}
                    className={styles.slider}
                    title="Maximum DMX value for tilt movement (0-255)"
                  />
                  <span className={styles.rangeLabel}>255</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.tiltMax}
                    onChange={(e) => updateSetting('tiltMax', parseInt(e.target.value) || 255)}
                    className={styles.numberInput}
                    title="Maximum DMX value for tilt movement (0-255)"
                  />
                </div>
              </div>
            </div>

            {/* Rigging Parameters Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>Rigging Parameters</h4>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Scale factor for pan movement sensitivity (0-5, higher = more movement)">
                  Pan Scale
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.01"
                    value={settings.panScale}
                    onChange={(e) => updateSetting('panScale', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Scale factor for pan movement sensitivity (0-5, higher = more movement)"
                  />
                  <span className={styles.rangeLabel}>5</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={settings.panScale.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('panScale', value);
                    }}
                    className={styles.numberInput}
                    title="Scale factor for pan movement sensitivity (0-5, higher = more movement)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Scale factor for tilt movement sensitivity (0-5, higher = more movement)">
                  Tilt Scale
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.01"
                    value={settings.tiltScale}
                    onChange={(e) => updateSetting('tiltScale', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Scale factor for tilt movement sensitivity (0-5, higher = more movement)"
                  />
                  <span className={styles.rangeLabel}>5</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={settings.tiltScale.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('tiltScale', value);
                    }}
                    className={styles.numberInput}
                    title="Scale factor for tilt movement sensitivity (0-5, higher = more movement)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Dead zone threshold for pan (0-1, prevents small movements)">
                  Pan Dead Zone
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.panDeadZone}
                    onChange={(e) => updateSetting('panDeadZone', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Dead zone threshold for pan (0-1, prevents small movements)"
                  />
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.panDeadZone.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('panDeadZone', value);
                    }}
                    className={styles.numberInput}
                    title="Dead zone threshold for pan (0-1, prevents small movements)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Dead zone threshold for tilt (0-1, prevents small movements)">
                  Tilt Dead Zone
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.tiltDeadZone}
                    onChange={(e) => updateSetting('tiltDeadZone', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Dead zone threshold for tilt (0-1, prevents small movements)"
                  />
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.tiltDeadZone.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('tiltDeadZone', value);
                    }}
                    className={styles.numberInput}
                    title="Dead zone threshold for tilt (0-1, prevents small movements)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Pan movement limit multiplier (0-2, 1.0 = full range)">
                  Pan Limit
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={settings.panLimit}
                    onChange={(e) => updateSetting('panLimit', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Pan movement limit multiplier (0-2, 1.0 = full range)"
                  />
                  <span className={styles.rangeLabel}>2</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.01"
                    value={settings.panLimit.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('panLimit', value);
                    }}
                    className={styles.numberInput}
                    title="Pan movement limit multiplier (0-2, 1.0 = full range)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Tilt movement limit multiplier (0-2, 1.0 = full range)">
                  Tilt Limit
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={settings.tiltLimit}
                    onChange={(e) => updateSetting('tiltLimit', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Tilt movement limit multiplier (0-2, 1.0 = full range)"
                  />
                  <span className={styles.rangeLabel}>2</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.01"
                    value={settings.tiltLimit.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('tiltLimit', value);
                    }}
                    className={styles.numberInput}
                    title="Tilt movement limit multiplier (0-2, 1.0 = full range)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Pan gear ratio multiplier (0.1-10, affects movement speed)">
                  Pan Gear
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0.1</span>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.panGear}
                    onChange={(e) => updateSetting('panGear', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Pan gear ratio multiplier (0.1-10, affects movement speed)"
                  />
                  <span className={styles.rangeLabel}>10</span>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.panGear.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('panGear', value);
                    }}
                    className={styles.numberInput}
                    title="Pan gear ratio multiplier (0.1-10, affects movement speed)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Tilt gear ratio multiplier (0.1-10, affects movement speed)">
                  Tilt Gear
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0.1</span>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.tiltGear}
                    onChange={(e) => updateSetting('tiltGear', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Tilt gear ratio multiplier (0.1-10, affects movement speed)"
                  />
                  <span className={styles.rangeLabel}>10</span>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.tiltGear.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('tiltGear', value);
                    }}
                    className={styles.numberInput}
                    title="Tilt gear ratio multiplier (0.1-10, affects movement speed)"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>Response & Update Settings</h4>
              <div className={styles.controlGroup} style={{ border: '2px solid var(--accent-color)', borderRadius: '8px', padding: '1rem', background: 'rgba(0, 212, 255, 0.1)' }}>
                <label className={styles.controlLabel} style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-color)' }} title="Controls how often DMX and OSC values are sent (1-60 Hz). Higher = smoother updates but more CPU/network traffic. Lower = less frequent updates, less CPU. Default: 30 Hz (30 updates per second).">
                  ⚡ UPDATE RATE (Hz) - Fixture Response Speed
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                  <strong>This controls how fast your fixture responds to face movement!</strong><br/>
                  Higher (30-60 Hz) = Smoother, more responsive updates but uses more CPU/network.<br/>
                  Lower (10-20 Hz) = Less frequent updates, less CPU, but may feel laggy.<br/>
                  <strong>Default: 30 Hz (30 updates per second)</strong> - Good balance for most fixtures.
                </p>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={settings.updateRate}
                    onChange={(e) => updateSetting('updateRate', parseInt(e.target.value) || 30)}
                    className={styles.slider}
                    title="Controls how often DMX and OSC values are sent (1-60 Hz). Higher = smoother updates but more CPU/network traffic. Lower = less frequent updates, less CPU. Default: 30 Hz (30 updates per second)."
                  />
                  <span className={styles.rangeLabel}>60</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value={settings.updateRate}
                    onChange={(e) => updateSetting('updateRate', parseInt(e.target.value) || 30)}
                    className={styles.numberInput}
                    title="Controls how often DMX and OSC values are sent (1-60 Hz). Higher = smoother updates but more CPU/network traffic. Lower = less frequent updates, less CPU. Default: 30 Hz (30 updates per second)."
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Center position offset for pan (0-255, 128 = center). This is the DMX value sent when your face is looking straight ahead. Adjust if your fixture's center position isn't at 128. Use 'SET TO CENTER' button for automatic calibration.">
                  Pan Offset
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  The DMX value sent when your face is looking straight ahead (center position). 
                  Default: 128 (center of 0-255 range). Adjust if your fixture's center isn't at 128. 
                  <strong> Tip: Use the 'SET TO CENTER' button for automatic calibration!</strong>
                </p>
                <div className={styles.sliderWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.panOffset}
                    onChange={(e) => updateSetting('panOffset', parseInt(e.target.value) || 128)}
                    className={styles.slider}
                    title="Center position offset for pan (0-255, 128 = center). This is the DMX value sent when your face is looking straight ahead. Adjust if your fixture's center position isn't at 128. Use 'SET TO CENTER' button for automatic calibration."
                  />
                  <input
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.panOffset}
                    onChange={(e) => updateSetting('panOffset', parseInt(e.target.value) || 128)}
                    className={styles.numberInput}
                    title="Center position offset for pan (0-255, 128 = center). This is the DMX value sent when your face is looking straight ahead. Adjust if your fixture's center position isn't at 128. Use 'SET TO CENTER' button for automatic calibration."
                  />
                  <span className={styles.rangeLabel}>0-255</span>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Center position offset for tilt (0-255, 128 = center). This is the DMX value sent when your face is looking straight ahead. Adjust if your fixture's center position isn't at 128. Use 'SET TO CENTER' button for automatic calibration.">
                  Tilt Offset
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  The DMX value sent when your face is looking straight ahead (center position). 
                  Default: 128 (center of 0-255 range). Adjust if your fixture's center isn't at 128. 
                  <strong> Tip: Use the 'SET TO CENTER' button for automatic calibration!</strong>
                </p>
                <div className={styles.sliderWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.tiltOffset}
                    onChange={(e) => updateSetting('tiltOffset', parseInt(e.target.value) || 128)}
                    className={styles.slider}
                    title="Center position offset for tilt (0-255, 128 = center). This is the DMX value sent when your face is looking straight ahead. Adjust if your fixture's center position isn't at 128. Use 'SET TO CENTER' button for automatic calibration."
                  />
                  <input
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={settings.tiltOffset}
                    onChange={(e) => updateSetting('tiltOffset', parseInt(e.target.value) || 128)}
                    className={styles.numberInput}
                    title="Center position offset for tilt (0-255, 128 = center). This is the DMX value sent when your face is looking straight ahead. Adjust if your fixture's center position isn't at 128. Use 'SET TO CENTER' button for automatic calibration."
                  />
                  <span className={styles.rangeLabel}>0-255</span>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Maximum velocity change per update (0.1-10). Limits how fast the fixture can move between updates, preventing overshooting and jerky movement. Lower (0.5-2.0) = slower, smoother movement. Higher (5-10) = faster, more responsive but may overshoot. Default: 3.0 - good balance.">
                  Max Velocity
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Limits how fast the fixture can move between updates, preventing overshooting and jerky movement. 
                  Lower (0.5-2.0) = slower, smoother movement. Higher (5-10) = faster, more responsive but may overshoot. 
                  <strong> Default: 3.0</strong> - Good balance for most fixtures.
                </p>
                <div className={styles.sliderWrapper}>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.maxVelocity}
                    onChange={(e) => updateSetting('maxVelocity', parseFloat(e.target.value) || 3.0)}
                    className={styles.slider}
                    title="Maximum velocity change per update (0.1-10). Limits how fast the fixture can move between updates, preventing overshooting and jerky movement. Lower (0.5-2.0) = slower, smoother movement. Higher (5-10) = faster, more responsive but may overshoot. Default: 3.0 - good balance."
                  />
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.maxVelocity.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('maxVelocity', value);
                    }}
                    className={styles.numberInput}
                    title="Maximum velocity change per update (0.1-10). Limits how fast the fixture can move between updates, preventing overshooting and jerky movement. Lower (0.5-2.0) = slower, smoother movement. Higher (5-10) = faster, more responsive but may overshoot. Default: 3.0 - good balance."
                  />
                  <span className={styles.rangeLabel}>0.1-10</span>
                </div>
              </div>
            </div>

            {/* OSC Settings Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>OSC Settings</h4>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  <input
                    type="checkbox"
                    checked={settings.useOSC}
                    onChange={(e) => updateSetting('useOSC', e.target.checked)}
                    title="Enable OSC output. Messages will be sent via ArtBastard's OSC configuration or custom OSC settings."
                  />
                  Enable OSC Output
                </label>
              </div>
              {settings.useOSC && (
                <>
                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel}>
                      <input
                        type="checkbox"
                        checked={settings.useArtBastardOSC}
                        onChange={(e) => updateSetting('useArtBastardOSC', e.target.checked)}
                        title="Use ArtBastard's OSC server configuration (default) or custom OSC settings"
                      />
                      Use ArtBastard OSC Server (default)
                    </label>
                    <p className={styles.infoText} style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      When enabled, OSC messages will be sent using ArtBastard's OSC send configuration and visible in the OSC Monitor.
                      Configure OSC send host/port in the main ArtBastard settings (MIDI/OSC Setup).
                    </p>
                  </div>
                  {!settings.useArtBastardOSC && (
                    <>
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel} title="Custom OSC server host (defaults to ArtBastard's incoming port: 8000)">
                          OSC Host
                        </label>
                        <input
                          type="text"
                          value={settings.oscHost}
                          onChange={(e) => updateSetting('oscHost', e.target.value)}
                          className={styles.textInput}
                          placeholder="127.0.0.1"
                          title="Custom OSC server host (defaults to ArtBastard's incoming port: 8000)"
                        />
                      </div>
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel} title="OSC sending port (defaults to ArtBastard's listening port: 8000)">
                          OSC Sending Port
                        </label>
                        <input
                          type="number"
                          min="1024"
                          max="65535"
                          step="1"
                          value={settings.oscPort}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value) && value >= 1024 && value <= 65535) {
                              updateSetting('oscPort', value);
                            }
                          }}
                          className={styles.numberInput}
                          style={{ width: '120px' }}
                          title="OSC sending port (defaults to ArtBastard's listening port: 8000)"
                        />
                        <p className={styles.helpText} style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          Default: 8000 (ArtBastard's listening port). Change this if sending to a different OSC server.
                        </p>
                      </div>
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel} title="OSC address path for pan values">
                          OSC Pan Address
                        </label>
                        <input
                          type="text"
                          value={settings.oscPanAddress}
                          onChange={(e) => updateSetting('oscPanAddress', e.target.value)}
                          className={styles.textInput}
                          placeholder="/face-tracker/pan"
                          title="OSC address path for pan values"
                        />
                      </div>
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel} title="OSC address path for tilt values">
                          OSC Tilt Address
                        </label>
                        <input
                          type="text"
                          value={settings.oscTiltAddress}
                          onChange={(e) => updateSetting('oscTiltAddress', e.target.value)}
                          className={styles.textInput}
                          placeholder="/face-tracker/tilt"
                          title="OSC address path for tilt values"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* OSC Endpoints */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>OSC Endpoints</h4>
              <div className={styles.controlGroup}>
                <div className={styles.infoBox}>
                  <p className={styles.infoText}>
                    <strong>ArtBastard OSC Endpoints (from Configuration):</strong>
                  </p>
                  <p className={styles.infoText}>
                    Pan Channel {settings.panChannel}: <code className={styles.endpointAddress}>
                      {oscAssignments && oscAssignments[settings.panChannel - 1] 
                        ? oscAssignments[settings.panChannel - 1] 
                        : `/1/fader${settings.panChannel}`}
                    </code>
                  </p>
                  <p className={styles.infoText}>
                    Tilt Channel {settings.tiltChannel}: <code className={styles.endpointAddress}>
                      {oscAssignments && oscAssignments[settings.tiltChannel - 1] 
                        ? oscAssignments[settings.tiltChannel - 1] 
                        : `/1/fader${settings.tiltChannel}`}
                    </code>
                  </p>
                  <p className={styles.infoText} style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                    When OSC is enabled, messages will be sent to these endpoints and visible in the OSC Monitor.
                    Configure OSC assignments in the main ArtBastard settings.
                  </p>
                </div>
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

