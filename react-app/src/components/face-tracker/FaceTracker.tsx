import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
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
  currentMouth: number; // Mouth openness (0-255)
  currentZoom: number; // Zoom value (0-255)
  currentTongue: number; // Tongue detection value (0-255)
  isBlinking: boolean; // Current blink state
  isTongueOut: boolean; // Current tongue state
  currentGesture: string; // Current detected gesture (e.g., "NODDING", "SHAKING", "SMILING", "SAD")
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
  delay: number; // Delay in milliseconds (0-2000ms) for telegram effect
  // X/Y Position tracking (for fixture following)
  xPositionChannel: number; // DMX channel for X position (0 = disabled)
  yPositionChannel: number; // DMX channel for Y position (0 = disabled)
  xPositionMin: number;
  xPositionMax: number;
  yPositionMin: number;
  yPositionMax: number;
  // Blink detection
  blinkIrisChannel: number; // DMX channel for blink-controlled iris (0 = disabled, use irisChannel if > 0)
  blinkThreshold: number; // Eye aspect ratio threshold for blink detection (0.15-0.35)
  blinkSensitivity: number; // How much blink affects iris (0-1)
  // Mouth detection
  mouthChannel: number; // DMX channel for mouth openness (0 = disabled)
  mouthMin: number;
  mouthMax: number;
  mouthSensitivity: number; // How sensitive mouth detection is (0-1)
  // Tongue detection
  tongueChannel: number; // DMX channel for tongue detection (0 = disabled, can be toggle or value)
  tongueToggle: boolean; // If true, tongue acts as toggle (on/off), if false, sends value
  tongueSensitivity: number; // How sensitive tongue detection is (0-1)
  tongueThreshold: number; // Threshold for detecting tongue (0-1)
  // Gesture detection
  enableGestures: boolean; // Enable gesture detection
  gestureSensitivity: number; // How sensitive gesture detection is (0-1)
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
  delay: 0, // No delay by default (0-2000ms)
  // X/Y Position tracking defaults
  xPositionChannel: 0, // Disabled by default
  yPositionChannel: 0, // Disabled by default
  xPositionMin: 0,
  xPositionMax: 255,
  yPositionMin: 0,
  yPositionMax: 255,
  // Blink detection defaults
  blinkIrisChannel: 0, // Disabled by default (use irisChannel if > 0)
  blinkThreshold: 0.25, // Default eye aspect ratio threshold
  blinkSensitivity: 0.5, // Default blink sensitivity
  // Mouth detection defaults
  mouthChannel: 0, // Disabled by default
  mouthMin: 0,
  mouthMax: 255,
  mouthSensitivity: 1.0, // Default mouth sensitivity
  // Tongue detection defaults
  tongueChannel: 0, // Disabled by default
  tongueToggle: true, // Default: toggle mode
  tongueSensitivity: 0.7, // Default: moderate sensitivity
  tongueThreshold: 0.3, // Default: 30% threshold for tongue detection
  // Gesture detection defaults
  enableGestures: true, // Enable by default
  gestureSensitivity: 0.7, // Default: moderate sensitivity
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

// Helper function to calculate Eye Aspect Ratio (EAR) - better blink detection
// EAR = (vertical eye distance) / (horizontal eye distance)
// When eyes are closed, vertical distance decreases, EAR drops
const calculateEyeAspectRatio = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  if (width < 3 || height < 3) return 0.3; // Default to "open" if too small
  
  // Find eye opening by detecting the darkest horizontal line (pupil/eyelid)
  // and brightest areas (eyeball whites)
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);
  
  // Scan vertically through center to find eye opening height
  let minBrightness = 255;
  let maxBrightness = 0;
  let topEdge = 0;
  let bottomEdge = height;
  
  // Find top and bottom edges of eye opening
  for (let y = 0; y < height; y++) {
    const idx = (y * width + centerX) * 4;
    const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    
    if (gray < minBrightness) {
      minBrightness = gray;
      if (topEdge === 0) topEdge = y;
    }
    if (gray > maxBrightness) {
      maxBrightness = gray;
    }
  }
  
  // Find bottom edge (where brightness increases again)
  for (let y = centerY; y < height; y++) {
    const idx = (y * width + centerX) * 4;
    const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    if (gray > minBrightness + 30) {
      bottomEdge = y;
      break;
    }
  }
  
  const verticalDistance = bottomEdge - topEdge;
  const horizontalDistance = width;
  
  // EAR = vertical / horizontal (normalized)
  const ear = verticalDistance / horizontalDistance;
  
  // Normalize to 0-1 range (typical EAR is 0.15-0.35 for open eyes, <0.15 for closed)
  return Math.max(0, Math.min(1, ear * 3)); // Scale so 0.33 = 1.0
};

// Helper function to calculate mouth openness (using vertical edge detection)
const calculateMouthOpenness = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  if (width < 2 || height < 2) return 0;
  
  let verticalEdges = 0;
  let totalPixels = 0;
  
  // Detect vertical edges (mouth opening creates vertical lines)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const idxTop = ((y - 1) * width + x) * 4;
      const idxBottom = ((y + 1) * width + x) * 4;
      
      // Calculate grayscale values
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const grayTop = 0.299 * data[idxTop] + 0.587 * data[idxTop + 1] + 0.114 * data[idxTop + 2];
      const grayBottom = 0.299 * data[idxBottom] + 0.587 * data[idxBottom + 1] + 0.114 * data[idxBottom + 2];
      
      // Vertical gradient (edge detection)
      const verticalGradient = Math.abs(grayTop - grayBottom);
      
      if (verticalGradient > 20) { // Threshold for edge detection
        verticalEdges++;
      }
      totalPixels++;
    }
  }
  
  // Normalize to 0-1 (more edges = more open mouth)
  const openness = Math.min(1, verticalEdges / (totalPixels * 0.1)); // Scale factor
  
  return openness;
};

// Helper function to calculate tongue detection
// Detects tongue by looking for pink/reddish colors extending below the mouth
const calculateTongueDetection = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  if (width < 3 || height < 3) return 0;
  
  let pinkPixelCount = 0;
  let totalPixels = 0;
  
  // Tongue is typically pink/reddish (high red, medium green, low blue)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      totalPixels++;
      
      // Tongue color detection: high red, medium-high green, low blue
      const isPinkish = r > 150 && g > 80 && b < 140 && r > g && r > b;
      const isReddish = r > 180 && g > 100 && b < 120;
      
      if (isPinkish || isReddish) {
        pinkPixelCount++;
      }
    }
  }
  
  // Normalize to 0-1 (percentage of pink/red pixels)
  const tongueRatio = totalPixels > 0 ? pinkPixelCount / totalPixels : 0;
  
  // Also check for vertical extension (tongue extends downward)
  let lowerPinkCount = 0;
  let lowerTotalPixels = 0;
  const lowerHalfStart = Math.floor(height / 2);
  
  for (let y = lowerHalfStart; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      lowerTotalPixels++;
      
      const isPinkish = r > 150 && g > 80 && b < 140 && r > g && r > b;
      if (isPinkish) {
        lowerPinkCount++;
      }
    }
  }
  
  const lowerTongueRatio = lowerTotalPixels > 0 ? lowerPinkCount / lowerTotalPixels : 0;
  
  // Combine both ratios (tongue extends downward, so lower half is more important)
  const combinedRatio = (tongueRatio * 0.4) + (lowerTongueRatio * 0.6);
  
  return Math.min(1, combinedRatio);
};

// Helper function to detect hand gestures (thumbs up, middle finger, etc.)
const detectHandGesture = (imageData: ImageData, width: number, height: number): { gesture: string; confidence: number } => {
  const data = imageData.data;
  
  if (width < 20 || height < 20) {
    return { gesture: '', confidence: 0 };
  }
  
  // Convert to grayscale and threshold to find hand silhouette
  const threshold = 100;
  let handPixels = 0;
  let totalPixels = 0;
  const handMask: boolean[][] = [];
  
  // Create binary mask of hand region
  for (let y = 0; y < height; y++) {
    handMask[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      totalPixels++;
      
      const isHand = gray < threshold;
      handMask[y][x] = isHand;
      if (isHand) handPixels++;
    }
  }
  
  if (handPixels < totalPixels * 0.1) {
    return { gesture: '', confidence: 0 };
  }
  
  // Find hand contour
  const contour = findContour(handMask, width, height);
  
  if (contour.length < 10) {
    return { gesture: '', confidence: 0 };
  }
  
  // Analyze contour to detect gestures
  const protrusions = findProtrusions(contour, width, height);
  const topProtrusion = protrusions.find(p => p.direction === 'up' && p.length > height * 0.15);
  
  // Thumbs up detection
  if (topProtrusion && protrusions.filter(p => p.direction === 'up').length === 1) {
    const handAspectRatio = width / height;
    if (handAspectRatio > 1.2 && topProtrusion.length > height * 0.2) {
      return { gesture: 'THUMBS_UP', confidence: Math.min(1, topProtrusion.length / (height * 0.3)) };
    }
  }
  
  // Middle finger detection
  if (topProtrusion && topProtrusion.length > height * 0.25 && protrusions.filter(p => p.direction === 'up').length === 1) {
    return { gesture: 'MIDDLE_FINGER', confidence: Math.min(1, topProtrusion.length / (height * 0.4)) };
  }
  
  // Fist detection
  if (protrusions.length <= 2 && handPixels > totalPixels * 0.3) {
    return { gesture: 'FIST', confidence: 0.7 };
  }
  
  // Open hand detection
  const upwardProtrusions = protrusions.filter(p => p.direction === 'up');
  if (upwardProtrusions.length >= 3) {
    return { gesture: 'OPEN_HAND', confidence: Math.min(1, upwardProtrusions.length / 5) };
  }
  
  return { gesture: '', confidence: 0 };
};

// Helper to find contour (boundary) of hand
const findContour = (mask: boolean[][], width: number, height: number): Array<{ x: number; y: number }> => {
  const contour: Array<{ x: number; y: number }> = [];
  const visited = new Set<string>();
  
  let startX = -1, startY = -1;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mask[y][x] && !mask[y-1][x] && !mask[y][x-1]) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }
  
  if (startX === -1) return contour;
  
  let currentX = startX;
  let currentY = startY;
  const directions = [
    { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
    { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 }
  ];
  
  do {
    const key = `${currentX},${currentY}`;
    if (!visited.has(key)) {
      contour.push({ x: currentX, y: currentY });
      visited.add(key);
    }
    
    let found = false;
    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      const nextX = currentX + dir.x;
      const nextY = currentY + dir.y;
      
      if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
        if (mask[nextY][nextX]) {
          currentX = nextX;
          currentY = nextY;
          found = true;
          break;
        }
      }
    }
    
    if (!found || contour.length > 1000) break;
  } while (currentX !== startX || currentY !== startY || contour.length < 10);
  
  return contour;
};

// Helper to find protrusions (fingers) from contour
const findProtrusions = (contour: Array<{ x: number; y: number }>, width: number, height: number): Array<{ direction: string; length: number; angle: number }> => {
  if (contour.length < 10) return [];
  
  const centerX = contour.reduce((sum, p) => sum + p.x, 0) / contour.length;
  const centerY = contour.reduce((sum, p) => sum + p.y, 0) / contour.length;
  
  const protrusions: Array<{ direction: string; length: number; angle: number }> = [];
  const minProtrusionLength = Math.min(width, height) * 0.1;
  
  for (let i = 0; i < contour.length; i++) {
    const point = contour[i];
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > minProtrusionLength) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      let direction = '';
      
      if (angle > -45 && angle < 45) direction = 'right';
      else if (angle > 45 && angle < 135) direction = 'down';
      else if (angle > 135 || angle < -135) direction = 'left';
      else direction = 'up';
      
      protrusions.push({ direction, length: distance, angle });
    }
  }
  
  const grouped: { [key: string]: Array<{ direction: string; length: number; angle: number }> } = {};
  for (const prot of protrusions) {
    const key = prot.direction;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(prot);
  }
  
  const result: Array<{ direction: string; length: number; angle: number }> = [];
  for (const dir in grouped) {
    const group = grouped[dir];
    const longest = group.reduce((max, p) => p.length > max.length ? p : max, group[0]);
    result.push(longest);
  }
  
  return result;
};

// Helper function to detect facial expressions (smile, sad, etc.)
// Analyzes mouth curve and shape to determine emotional expression
const detectFacialExpression = (mouthImageData: ImageData, mouthOpenness: number): string => {
  const data = mouthImageData.data;
  const width = mouthImageData.width;
  const height = mouthImageData.height;
  
  if (width < 5 || height < 5) return '';
  
  // Analyze mouth curve by examining vertical intensity distribution
  // Smile: corners of mouth are higher (upward curve)
  // Sad: corners of mouth are lower (downward curve)
  // Neutral: relatively flat
  
  const centerY = Math.floor(height / 2);
  const leftQuarter = Math.floor(width * 0.25);
  const rightQuarter = Math.floor(width * 0.75);
  const centerQuarter = Math.floor(width * 0.5);
  
  // Calculate average brightness/intensity at different horizontal positions
  let leftIntensity = 0;
  let centerIntensity = 0;
  let rightIntensity = 0;
  let leftCount = 0;
  let centerCount = 0;
  let rightCount = 0;
  
  // Sample vertical lines at left, center, and right positions
  for (let y = 0; y < height; y++) {
    // Left quarter (left corner of mouth)
    for (let x = 0; x < leftQuarter; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      leftIntensity += gray;
      leftCount++;
    }
    
    // Center
    for (let x = leftQuarter; x < rightQuarter; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      centerIntensity += gray;
      centerCount++;
    }
    
    // Right quarter (right corner of mouth)
    for (let x = rightQuarter; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      rightIntensity += gray;
      rightCount++;
    }
  }
  
  const leftAvg = leftCount > 0 ? leftIntensity / leftCount : 0;
  const centerAvg = centerCount > 0 ? centerIntensity / centerCount : 0;
  const rightAvg = rightCount > 0 ? rightIntensity / rightCount : 0;
  
  // Calculate mouth curve: positive = smile (corners higher), negative = sad (corners lower)
  const cornerAvg = (leftAvg + rightAvg) / 2;
  const curveValue = (cornerAvg - centerAvg) / Math.max(centerAvg, 1); // Normalize
  
  // Detect smile: upward curve (corners higher than center) + mouth slightly open
  if (curveValue > 0.05 && mouthOpenness > 0.2 && mouthOpenness < 0.6) {
    return 'SMILING';
  }
  
  // Detect sad: downward curve (corners lower than center) + mouth closed or slightly open
  if (curveValue < -0.05 && mouthOpenness < 0.4) {
    return 'SAD';
  }
  
  // Detect surprise: mouth very open
  if (mouthOpenness > 0.7) {
    return 'SURPRISED';
  }
  
  // Detect neutral: relatively flat curve and moderate openness
  if (Math.abs(curveValue) < 0.03 && mouthOpenness > 0.1 && mouthOpenness < 0.4) {
    return 'NEUTRAL';
  }
  
  return '';
};

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
  
  const [state, setState] = useState<FaceTrackerState>({
    isRunning: false,
    isInitialized: false,
    faceDetected: false,
    currentPan: 128,
    currentTilt: 128,
    currentX: 128,
    currentY: 128,
    currentIris: 128,
    currentMouth: 0,
    currentZoom: 128,
    currentTongue: 0,
    isBlinking: false,
    isTongueOut: false,
    currentGesture: '',
    fps: 0,
    error: null,
  });

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
        return loaded;
      }
    } catch (error) {
      console.error('Error loading Face Tracker settings:', error);
    }
    return DEFAULT_SETTINGS;
  };

  const [settings, setSettings] = useState<FaceTrackerSettings>(loadSettings());
  
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
  const [showPreview, setShowPreview] = useState(true);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([]);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [isDetached, setIsDetached] = useState(false);
  const [detachedPosition, setDetachedPosition] = useState({ x: 100, y: 100 });
  const [is3DFixtureDetached, setIs3DFixtureDetached] = useState(false);
  const [fixture3DPosition, setFixture3DPosition] = useState({ x: 100, y: 100 });
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
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });
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
    isBlinking?: boolean;
    mouthOpenness?: number;
  } | null>(null);
  const faceHistoryRef = useRef<Array<{ width: number; height: number; centerX: number; centerY: number; timestamp: number }>>([]);
  const baselineFaceSizeRef = useRef<{ width: number; height: number; aspectRatio: number } | null>(null);
  // Delay buffer: store pan/tilt values with timestamps for delayed application
  const delayBufferRef = useRef<Array<{ pan: number; tilt: number; x: number; y: number; iris: number; mouth: number; tongue: number; zoom: number; timestamp: number }>>([]);
  // Eye tracking for blink detection
  const eyeHistoryRef = useRef<Array<{ leftEyeEAR: number; rightEyeEAR: number; timestamp: number }>>([]);
  const lastBlinkTimeRef = useRef<number>(0);
  const blinkStateRef = useRef<boolean>(false);
  // Mouth tracking
  const mouthHistoryRef = useRef<Array<{ openness: number; timestamp: number }>>([]);
  const gestureHistoryRef = useRef<{
    panHistory: number[];
    tiltHistory: number[];
    lastGesture: string;
    lastGestureTime: number;
  }>({
    panHistory: [],
    tiltHistory: [],
    lastGesture: '',
    lastGestureTime: 0
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
    setState(prev => ({ ...prev, isRunning: true }));
    setDiagnostics(prev => ({ ...prev, cameraStatus: 'starting', cameraError: null }));
    
    try {
      // Add timeout for camera access (Edge sometimes hangs)
      const cameraTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Camera access timeout (10s)')), 10000);
      });
      
      const enumerateDevices = navigator.mediaDevices.enumerateDevices();
      const devices = await Promise.race([enumerateDevices, cameraTimeout]);
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
      
      // Try to get stream with constraints (with timeout)
      let stream: MediaStream;
      try {
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia({
          video: videoConstraints
        });
        stream = await Promise.race([getUserMediaPromise, cameraTimeout]);
      } catch (error) {
        // If that fails, try with minimal constraints (with timeout)
        console.warn('[FaceTracker] Failed with advanced constraints, trying minimal:', error);
        const minimalPromise = navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? { ideal: deviceId } : undefined
          }
        });
        stream = await Promise.race([minimalPromise, cameraTimeout]);
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

      // Reset smoothed values when starting
      smoothedPanRef.current = 0;
      smoothedTiltRef.current = 0;
      panVelocityRef.current = 0;
      tiltVelocityRef.current = 0;
      lastUpdateRef.current = 0;
      
      // Reset FPS counter
      fpsCounterRef.current = { frames: 0, lastTime: performance.now() };
      
      setState(prev => ({ ...prev, isRunning: true, error: null, currentPan: settings.panOffset, currentTilt: settings.tiltOffset, fps: 0 }));
      setDiagnostics(prev => ({ 
        ...prev, 
        cameraStatus: 'running', 
        cameraError: null,
        videoReady: !!videoRef.current && videoRef.current.readyState >= 2
      }));
      startTracking();
    } catch (error: any) {
      const errorMsg = `Failed to start camera: ${error?.message || error}`;
      setState(prev => ({ ...prev, error: errorMsg, isRunning: false }));
      setDiagnostics(prev => ({ ...prev, cameraStatus: 'error', cameraError: errorMsg }));
    }
  }, [settings.cameraIndex, settings.autoExposure, settings.cameraExposure, settings.cameraBrightness]);

  const stopCamera = useCallback(() => {
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
      // Clear detection frame
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

  // Fast preview rendering (separate from face detection)
  const renderPreview = useCallback(() => {
    // Stop the loop if not running or preview disabled
    if (!showPreview || !videoRef.current || !canvasRef.current || !state.isRunning) {
      previewFrameRef.current = undefined;
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Update diagnostic: video ready state
      if (video.readyState >= video.HAVE_ENOUGH_DATA) {
        setDiagnostics(prev => ({ ...prev, videoReady: true }));
      }
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    
    if (!ctx || !video.srcObject || video.readyState !== video.HAVE_ENOUGH_DATA) {
      // Only continue loop if still running
      if (state.isRunning) {
        previewFrameRef.current = requestAnimationFrame(renderPreview);
      } else {
        previewFrameRef.current = undefined;
      }
      return;
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
    ctx.drawImage(video, 0, 0);

    // Draw persistent overlays from last detection (makes them less blinky)
    const now = performance.now();
    const faceTimeout = 500; // Keep showing face for 500ms after last detection
    
    if (lastFacePositionRef.current && 
        (now - lastFacePositionRef.current.timestamp) < faceTimeout) {
      const face = lastFacePositionRef.current;
      const imageCenterX = video.videoWidth / 2;
      const imageCenterY = video.videoHeight / 2;
      
      // Calculate fade based on time since last detection
      const timeSinceDetection = now - lastFacePositionRef.current.timestamp;
      const fadeAlpha = Math.max(0.3, 1 - (timeSinceDetection / faceTimeout));
      
      // Draw face rectangle (scaled to full canvas)
      ctx.strokeStyle = `rgba(255, 165, 0, ${fadeAlpha})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(face.x, face.y, face.width, face.height);
      ctx.strokeStyle = `rgba(255, 200, 0, ${fadeAlpha})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(face.x, face.y, face.width, face.height);

      // Draw center point (yellow circle)
      ctx.fillStyle = `rgba(255, 255, 0, ${fadeAlpha})`;
      ctx.strokeStyle = `rgba(255, 255, 0, ${fadeAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(face.centerX, face.centerY, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(face.centerX, face.centerY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw X marker at where head is looking (based on pan/tilt orientation)
      // Calculate target position based on smoothed pan/tilt values
      // Pan: -1 to 1 maps to left to right, Tilt: -1 to 1 maps to up to down
      const panOffset = smoothedPanRef.current * (video.videoWidth * 0.4); // Scale pan to screen
      const tiltOffset = smoothedTiltRef.current * (video.videoHeight * 0.4); // Scale tilt to screen
      const targetX = imageCenterX + panOffset;
      const targetY = imageCenterY + tiltOffset;
      
      // Draw X marker at target position (where head is looking)
      ctx.strokeStyle = `rgba(255, 0, 0, ${fadeAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Draw X shape
      ctx.moveTo(targetX - 20, targetY - 20);
      ctx.lineTo(targetX + 20, targetY + 20);
      ctx.moveTo(targetX + 20, targetY - 20);
      ctx.lineTo(targetX - 20, targetY + 20);
      ctx.stroke();
      
      // Draw circle around X marker
      ctx.beginPath();
      ctx.arc(targetX, targetY, 15, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw line from face center to target (showing where head is looking)
      ctx.strokeStyle = `rgba(0, 255, 0, ${fadeAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(face.centerX, face.centerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      
      // Draw crosshair at image center (blue, for reference)
      ctx.strokeStyle = `rgba(0, 150, 255, ${fadeAlpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(imageCenterX - 20, imageCenterY);
      ctx.lineTo(imageCenterX + 20, imageCenterY);
      ctx.moveTo(imageCenterX, imageCenterY - 20);
      ctx.lineTo(imageCenterX, imageCenterY + 20);
      ctx.stroke();
      
      // Draw eye detection boxes
      if (face.leftEye) {
        ctx.strokeStyle = face.isBlinking ? `rgba(255, 0, 0, ${fadeAlpha})` : `rgba(0, 255, 255, ${fadeAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(face.leftEye.x, face.leftEye.y, face.leftEye.width, face.leftEye.height);
        // Label
        ctx.fillStyle = `rgba(0, 255, 255, ${fadeAlpha})`;
        ctx.font = 'bold 12px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeText('L Eye', face.leftEye.x, face.leftEye.y - 5);
        ctx.fillText('L Eye', face.leftEye.x, face.leftEye.y - 5);
      }
      
      if (face.rightEye) {
        ctx.strokeStyle = face.isBlinking ? `rgba(255, 0, 0, ${fadeAlpha})` : `rgba(0, 255, 255, ${fadeAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(face.rightEye.x, face.rightEye.y, face.rightEye.width, face.rightEye.height);
        // Label
        ctx.fillStyle = `rgba(0, 255, 255, ${fadeAlpha})`;
        ctx.font = 'bold 12px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeText('R Eye', face.rightEye.x, face.rightEye.y - 5);
        ctx.fillText('R Eye', face.rightEye.x, face.rightEye.y - 5);
      }
      
      // Draw mouth detection box
      if (face.mouth) {
        const mouthOpenness = face.mouthOpenness || 0;
        const mouthColor = mouthOpenness > 0.5 ? `rgba(255, 0, 255, ${fadeAlpha})` : `rgba(255, 165, 0, ${fadeAlpha})`;
        ctx.strokeStyle = mouthColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(face.mouth.x, face.mouth.y, face.mouth.width, face.mouth.height);
        // Label with openness percentage
        ctx.fillStyle = mouthColor;
        ctx.font = 'bold 12px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        const opennessPercent = Math.round(mouthOpenness * 100);
        const mouthLabel = `Mouth ${opennessPercent}%`;
        ctx.strokeText(mouthLabel, face.mouth.x, face.mouth.y - 5);
        ctx.fillText(mouthLabel, face.mouth.x, face.mouth.y - 5);
      }
      
      // Draw blink indicator
      if (face.isBlinking) {
        ctx.fillStyle = `rgba(255, 0, 0, ${fadeAlpha})`;
        ctx.font = 'bold 24px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        const blinkText = '👁️ BLINKING';
        const textX = face.centerX - 60;
        const textY = face.y - 20;
        ctx.strokeText(blinkText, textX, textY);
        ctx.fillText(blinkText, textX, textY);
      }
    }

    // Draw text overlay
    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 20px Arial';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    const panText = `Pan: ${state.currentPan}`;
    const tiltText = `Tilt: ${state.currentTilt}`;
    const faceDetected = lastFacePositionRef.current && 
                         (now - lastFacePositionRef.current.timestamp) < faceTimeout;
    const statusText = faceDetected ? '✓ Face Detected' : 'No Face';
    
    // Draw with outline for better visibility
    ctx.strokeText(panText, 10, 30);
    ctx.fillText(panText, 10, 30);
    
    ctx.strokeText(tiltText, 10, 55);
    ctx.fillText(tiltText, 10, 55);
    
    ctx.fillStyle = faceDetected ? 'lime' : 'red';
    ctx.strokeText(statusText, 10, 80);
    ctx.fillText(statusText, 10, 80);
    
    // Draw additional detection info
    if (faceDetected && lastFacePositionRef.current) {
      const face = lastFacePositionRef.current;
      let yOffset = 105;
      
      // Blink status
      if (face.isBlinking !== undefined) {
        ctx.fillStyle = face.isBlinking ? 'red' : 'lime';
        const blinkText = face.isBlinking ? '👁️ BLINKING' : '👁️ Eyes Open';
        ctx.strokeText(blinkText, 10, yOffset);
        ctx.fillText(blinkText, 10, yOffset);
        yOffset += 25;
      }
      
      // Iris value
      if (state.currentIris > 0) {
        ctx.fillStyle = 'cyan';
        const irisText = `Iris: ${state.currentIris}`;
        ctx.strokeText(irisText, 10, yOffset);
        ctx.fillText(irisText, 10, yOffset);
        yOffset += 25;
      }
      
      // Mouth status
      if (face.mouth && face.mouthOpenness !== undefined) {
        ctx.fillStyle = 'magenta';
        const mouthPercent = Math.round(face.mouthOpenness * 100);
        const mouthText = `Mouth: ${mouthPercent}% (${state.currentMouth})`;
        ctx.strokeText(mouthText, 10, yOffset);
        ctx.fillText(mouthText, 10, yOffset);
        yOffset += 25;
      }
      
      // X/Y Position
      if (state.currentX > 0 || state.currentY > 0) {
        ctx.fillStyle = 'orange';
        const posText = `X: ${state.currentX} Y: ${state.currentY}`;
        ctx.strokeText(posText, 10, yOffset);
        ctx.fillText(posText, 10, yOffset);
      }
    }

    // Update FPS counter (preview rendering FPS)
    fpsCounterRef.current.frames++;
    const timeSinceLastFpsUpdate = now - fpsCounterRef.current.lastTime;
    
    // Update FPS every second (1000ms)
    if (timeSinceLastFpsUpdate >= 1000) {
      // Calculate FPS: frames counted / time elapsed in seconds
      const calculatedFps = Math.round((fpsCounterRef.current.frames * 1000) / timeSinceLastFpsUpdate);
      
      // Cap FPS at reasonable maximum (e.g., 120 FPS) to prevent display issues
      const cappedFps = Math.min(calculatedFps, 120);
      
      // Only update if calculation is valid (time > 0 and frames > 0)
      if (timeSinceLastFpsUpdate > 0 && fpsCounterRef.current.frames > 0) {
        setState(prev => ({ ...prev, fps: cappedFps }));
      }
      
      // Reset counter
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }

    // Continue preview loop only if still running
    if (state.isRunning) {
      previewFrameRef.current = requestAnimationFrame(renderPreview);
    } else {
      previewFrameRef.current = undefined;
    }
    } catch (error: any) {
      console.error('[FaceTracker] Error in renderPreview:', error);
      // Continue loop if still running, but log error
      if (state.isRunning) {
        previewFrameRef.current = requestAnimationFrame(renderPreview);
      } else {
        previewFrameRef.current = undefined;
      }
    }
  }, [showPreview, state.currentPan, state.currentTilt, state.isRunning]);

  // Face detection (runs at lower rate for performance)
  const detectFaces = useCallback(() => {
    console.log('[FaceTracker] detectFaces called', {
      opencvReady: !!opencvRef.current,
      cascadeReady: !!cascadeRef.current,
      videoReady: !!videoRef.current,
      canvasReady: !!canvasRef.current,
      isRunning: state.isRunning
    });
    
    if (!opencvRef.current || !cascadeRef.current || !videoRef.current || !canvasRef.current) {
      console.warn('[FaceTracker] Cannot start detection: OpenCV or video not ready');
      return;
    }

    let detectionCallCount = 0;
    const processDetection = () => {
      detectionCallCount++;
      // Log first few calls to verify it's running
      if (detectionCallCount <= 3 || detectionCallCount % 30 === 0) {
        console.log(`[FaceTracker] processDetection running (call #${detectionCallCount})`);
      }
      
      try {
        // Check if we should stop - exit early if not running
        if (!state.isRunning) {
          detectionFrameRef.current = undefined;
          return;
        }

        // Check if required refs are still available
        if (!opencvRef.current || !cascadeRef.current || !videoRef.current || !canvasRef.current) {
          // Exit if not running
          if (!state.isRunning) {
            detectionFrameRef.current = undefined;
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current);
              detectionTimeoutRef.current = undefined;
            }
            return;
          }
          // Clear any existing timeout
          if (detectionTimeoutRef.current) {
            clearTimeout(detectionTimeoutRef.current);
          }
          // Use a delay before retrying to prevent browser freeze
          detectionTimeoutRef.current = setTimeout(() => {
            detectionTimeoutRef.current = undefined;
            if (state.isRunning && opencvRef.current && cascadeRef.current && videoRef.current && canvasRef.current) {
              detectionFrameRef.current = requestAnimationFrame(processDetection);
            } else {
              detectionFrameRef.current = undefined;
            }
          }, 200); // Wait 200ms before retrying
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          console.warn('[FaceTracker] Canvas context not available, retrying...');
          if (state.isRunning) {
            detectionFrameRef.current = requestAnimationFrame(processDetection);
          } else {
            detectionFrameRef.current = undefined;
          }
          return;
        }
        
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          // Video not ready yet, continue loop to check again
          if (state.isRunning) {
            detectionFrameRef.current = requestAnimationFrame(processDetection);
          } else {
            detectionFrameRef.current = undefined;
          }
          return;
        }

        // Run face detection at lower rate (every 3-5 frames = ~10-15 FPS detection)
        const now = Date.now();
        const detectionInterval = 1000 / 15; // 15 FPS for detection
        if (now - lastDetectionTimeRef.current < detectionInterval) {
          // Continue loop immediately - requestAnimationFrame will naturally throttle
          if (state.isRunning) {
            detectionFrameRef.current = requestAnimationFrame(processDetection);
          } else {
            detectionFrameRef.current = undefined;
          }
          return;
        }
        lastDetectionTimeRef.current = now;

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
          console.error('[FaceTracker] OpenCV or cascade not available during detection');
          if (state.isRunning) {
            detectionFrameRef.current = requestAnimationFrame(processDetection);
          }
          return;
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
            console.error('[FaceTracker] Cascade classifier is null or undefined');
            if (src && !src.isDeleted()) src.delete();
            if (gray && !gray.isDeleted()) gray.delete();
            if (faces && !faces.isDeleted()) faces.delete();
            if (msize && !msize.isDeleted()) msize.delete();
            if (maxSizeObj && !maxSizeObj.isDeleted()) maxSizeObj.delete();
            if (state.isRunning) {
              detectionFrameRef.current = requestAnimationFrame(processDetection);
            }
            return;
          }
          
          // Perform face detection
          cascadeRef.current.detectMultiScale(gray, faces, 1.05, 2, 0, msize, maxSizeObj);
        } catch (detectionError) {
          console.error('[FaceTracker] Error during face detection:', detectionError);
          console.error('[FaceTracker] Detection error details:', {
            errorType: detectionError?.constructor?.name,
            errorMessage: detectionError?.message,
            cascadeExists: !!cascadeRef.current,
            grayExists: !!gray,
            facesExists: !!faces
          });
          // Cleanup and continue
          try {
            if (src && !src.isDeleted()) src.delete();
            if (gray && !gray.isDeleted()) gray.delete();
            if (faces && !faces.isDeleted()) faces.delete();
            if (msize && !msize.isDeleted()) msize.delete();
            if (maxSizeObj && !maxSizeObj.isDeleted()) maxSizeObj.delete();
          } catch (cleanupError) {
            console.error('[FaceTracker] Error during cleanup:', cleanupError);
          }
          if (state.isRunning) {
            detectionFrameRef.current = requestAnimationFrame(processDetection);
          }
          return;
        }
        
        const detectionTime = performance.now() - detectionStartTime;
        
        // Log detection info less frequently to prevent Firefox crashes
        const facesFound = faces.size();
        // Log every 30th frame for debugging (reduced frequency)
        if (detectionCallCount % 30 === 0) {
          console.log(`[OpenCV] Detection cycle #${detectionCallCount} - Faces found: ${facesFound}, Detection time: ${detectionTime.toFixed(2)}ms, Canvas size: ${detWidth}x${detHeight}, Video ready: ${video.readyState === video.HAVE_ENOUGH_DATA}`);
        }

        let faceDetected = false;
        if (faces.size() > 0) {
          try {
            faceDetected = true;
            const face = faces.get(0);
            
            // Validate face dimensions to prevent crashes
            if (!face || face.width <= 0 || face.height <= 0 || 
                face.x < 0 || face.y < 0 || 
                face.x + face.width > detWidth || 
                face.y + face.height > detHeight) {
              console.warn('[FaceTracker] Invalid face dimensions, skipping:', face);
              faceDetected = false;
            } else {
              // Calculate face center (scale from detection canvas to full canvas)
              const scaleX = video.videoWidth / detWidth;
              const scaleY = video.videoHeight / detHeight;
              const faceCenterX = (face.x + face.width / 2) * scaleX;
              const faceCenterY = (face.y + face.height / 2) * scaleY;
              const imageCenterX = video.videoWidth / 2;
              const imageCenterY = video.videoHeight / 2;
              
              // Log face position less frequently to prevent Firefox crashes
              if (Math.random() < 0.02) {
                console.log(`[OpenCV] Face detected - Position: (${face.x}, ${face.y}), Size: ${face.width}x${face.height}, Center: (${faceCenterX.toFixed(1)}, ${faceCenterY.toFixed(1)})`);
              }

              // Store face position temporarily (will update with eye/mouth data later)
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
                timestamp: Date.now()
              };

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
              let isBlinking = false;
              let irisValue = 128; // Default center value
              
              // Always detect eyes/blinks for preview, even if channels aren't configured
              {
                try {
                  // Extract eye regions from the face rectangle
                  const faceX = face.x;
                  const faceY = face.y;
                  const faceW = face.width;
                  const faceH = face.height;
                  
                  // Left eye region (20-40% from left, 25-40% from top of face)
                  const leftEyeX = Math.round(faceX + faceW * 0.2);
                  const leftEyeY = Math.round(faceY + faceH * 0.25);
                  const leftEyeW = Math.round(faceW * 0.2);
                  const leftEyeH = Math.round(faceH * 0.15);
                  
                  // Right eye region (60-80% from left, 25-40% from top of face)
                  const rightEyeX = Math.round(faceX + faceW * 0.6);
                  const rightEyeY = Math.round(faceY + faceH * 0.25);
                  const rightEyeW = Math.round(faceW * 0.2);
                  const rightEyeH = Math.round(faceH * 0.15);
                  
                  // Extract eye regions from detection canvas
                  const leftEyeROI = detCtx.getImageData(
                    Math.max(0, Math.min(leftEyeX, detWidth - 1)),
                    Math.max(0, Math.min(leftEyeY, detHeight - 1)),
                    Math.max(1, Math.min(leftEyeW, detWidth - leftEyeX)),
                    Math.max(1, Math.min(leftEyeH, detHeight - leftEyeY))
                  );
                  const rightEyeROI = detCtx.getImageData(
                    Math.max(0, Math.min(rightEyeX, detWidth - 1)),
                    Math.max(0, Math.min(rightEyeY, detHeight - 1)),
                    Math.max(1, Math.min(rightEyeW, detWidth - rightEyeX)),
                    Math.max(1, Math.min(rightEyeH, detHeight - rightEyeY))
                  );
                  
                  // Calculate Eye Aspect Ratio (EAR) for each eye - improved blink detection
                  const leftEAR = calculateEyeAspectRatio(leftEyeROI);
                  const rightEAR = calculateEyeAspectRatio(rightEyeROI);
                  const avgEAR = (leftEAR + rightEAR) / 2;
                  
                  // Store EAR history for smoothing
                  eyeHistoryRef.current.push({
                    leftEyeEAR: leftEAR,
                    rightEyeEAR: rightEAR,
                    timestamp: Date.now()
                  });
                  
                  // Keep only last 10 samples for blink detection
                  if (eyeHistoryRef.current.length > 10) {
                    eyeHistoryRef.current.shift();
                  }
                  
                  // Calculate smoothed EAR (average of last few frames) to reduce false positives
                  const recentEARs = eyeHistoryRef.current.slice(-5).map(e => (e.leftEyeEAR + e.rightEyeEAR) / 2);
                  const smoothedEAR = recentEARs.reduce((a, b) => a + b, 0) / recentEARs.length;
                  
                  // Detect blink: EAR drops below threshold
                  // Lower threshold = more sensitive (detects smaller blinks)
                  // Typical open eye EAR: 0.2-0.4, closed eye EAR: <0.15
                  isBlinking = smoothedEAR < settings.blinkThreshold;
                  
                  // Log for debugging (reduced frequency to prevent Firefox crashes)
                  if (Math.random() < 0.02) {
                    console.log(`[Blink] Left EAR: ${leftEAR.toFixed(3)}, Right EAR: ${rightEAR.toFixed(3)}, Smoothed: ${smoothedEAR.toFixed(3)}, Threshold: ${settings.blinkThreshold}, Blinking: ${isBlinking}`);
                  }
                  
                  // Update blink state
                  const currentTime = Date.now();
                  if (isBlinking && !blinkStateRef.current && (currentTime - lastBlinkTimeRef.current) > 200) {
                    // Blink detected
                    blinkStateRef.current = true;
                    lastBlinkTimeRef.current = currentTime;
                    console.log('[Blink] Detected! Smoothed EAR:', smoothedEAR.toFixed(4), 'Threshold:', settings.blinkThreshold);
                  } else if (!isBlinking && blinkStateRef.current) {
                    // Blink ended
                    blinkStateRef.current = false;
                    console.log('[Blink] Ended');
                  }
                  
                  // Control iris based on blink (always calculate, even if channels aren't configured)
                  if (isBlinking) {
                    // Close iris when blinking
                    irisValue = Math.round(
                      Math.max(settings.irisMin, Math.min(settings.irisMax,
                        settings.irisMin + (settings.irisMax - settings.irisMin) * (1 - settings.blinkSensitivity)
                      ))
                    );
                  } else {
                    // Open iris when not blinking
                    irisValue = Math.round(
                      Math.max(settings.irisMin, Math.min(settings.irisMax,
                        settings.irisMin + (settings.irisMax - settings.irisMin) * settings.blinkSensitivity
                      ))
                    );
                  }
                  
                  // Eye history is already stored above in the EAR calculation section
                } catch (err) {
                  console.warn('[FaceTracker] Error in blink detection:', err);
                }
              }
              
              // Mouth detection: Analyze mouth region for openness
              // Always detect mouth for preview, even if channel isn't configured
              let mouthValue = 0;
              
              {
                try {
                  // Mouth region is approximately: 30-70% from left, 50-75% from top of face
                  const faceX = face.x;
                  const faceY = face.y;
                  const faceW = face.width;
                  const faceH = face.height;
                  
                  const mouthX = Math.round(faceX + faceW * 0.3);
                  const mouthY = Math.round(faceY + faceH * 0.5);
                  const mouthW = Math.round(faceW * 0.4);
                  const mouthH = Math.round(faceH * 0.25);
                  
                  // Extract mouth region from detection canvas
                  const mouthROI = detCtx.getImageData(
                    Math.max(0, Math.min(mouthX, detWidth - 1)),
                    Math.max(0, Math.min(mouthY, detHeight - 1)),
                    Math.max(1, Math.min(mouthW, detWidth - mouthX)),
                    Math.max(1, Math.min(mouthH, detHeight - mouthY))
                  );
                  
                  // Calculate mouth openness using vertical edge detection
                  // More vertical edges = mouth more open
                  const mouthOpenness = calculateMouthOpenness(mouthROI);
                  
                  // Map to DMX value (0-255)
                  mouthValue = Math.round(
                    Math.max(settings.mouthMin, Math.min(settings.mouthMax,
                      settings.mouthMin + (settings.mouthMax - settings.mouthMin) * mouthOpenness * settings.mouthSensitivity
                    ))
                  );
                  
                  // Store mouth history
                  mouthHistoryRef.current.push({
                    openness: mouthOpenness,
                    timestamp: Date.now()
                  });
                  
                  // Keep only last 30 samples
                  if (mouthHistoryRef.current.length > 30) {
                    mouthHistoryRef.current.shift();
                  }
                } catch (err) {
                  console.warn('[FaceTracker] Error in mouth detection:', err);
                }
              }
              
              // Tongue detection: Analyze lower mouth region for tongue extension
              let tongueValue = 0;
              let isTongueOut = false;
              
              if (settings.tongueChannel > 0) {
                try {
                  // Tongue region is below mouth: 30-70% from left, 70-90% from top of face
                  const faceX = face.x;
                  const faceY = face.y;
                  const faceW = face.width;
                  const faceH = face.height;
                  
                  const tongueX = Math.round(faceX + faceW * 0.3);
                  const tongueY = Math.round(faceY + faceH * 0.7);
                  const tongueW = Math.round(faceW * 0.4);
                  const tongueH = Math.round(faceH * 0.2);
                  
                  // Extract tongue region from detection canvas
                  const tongueROI = detCtx.getImageData(
                    Math.max(0, Math.min(tongueX, detWidth - 1)),
                    Math.max(0, Math.min(tongueY, detHeight - 1)),
                    Math.max(1, Math.min(tongueW, detWidth - tongueX)),
                    Math.max(1, Math.min(tongueH, detHeight - tongueY))
                  );
                  
                  // Calculate tongue detection: look for pink/reddish color extending downward
                  const tongueDetection = calculateTongueDetection(tongueROI);
                  
                  // Check if tongue is out based on threshold
                  isTongueOut = tongueDetection > settings.tongueThreshold;
                  
                  if (settings.tongueToggle) {
                    // Toggle mode: send 255 if tongue out, 0 if not
                    tongueValue = isTongueOut ? 255 : 0;
                  } else {
                    // Value mode: send proportional value based on detection strength
                    tongueValue = Math.round(
                      Math.max(0, Math.min(255,
                        tongueDetection * settings.tongueSensitivity * 255
                      ))
                    );
                  }
                  
                  // Log for debugging (reduced frequency to prevent Firefox crashes)
                  if (Math.random() < 0.02) {
                    console.log(`[Tongue] Detection: ${tongueDetection.toFixed(3)}, Threshold: ${settings.tongueThreshold}, Out: ${isTongueOut}, Value: ${tongueValue}`);
                  }
                } catch (err) {
                  console.warn('[FaceTracker] Error in tongue detection:', err);
                }
              }
              
              // Hand gesture detection: Detect thumbs up, middle finger, etc.
              let detectedHandGesture = '';
              let handGestureValue = 0;
              
              if (settings.enableGestures) {
                try {
                  // Detect hands in the frame (below face region, wider search area)
                  const handSearchX = Math.max(0, face.x - face.width);
                  const handSearchY = Math.min(detHeight - 1, face.y + face.height);
                  const handSearchW = Math.min(detWidth - handSearchX, face.width * 3);
                  const handSearchH = Math.min(detHeight - handSearchY, face.height * 2);
                  
                  if (handSearchW > 20 && handSearchH > 20) {
                    // Extract hand search region
                    const handROI = detCtx.getImageData(
                      handSearchX,
                      handSearchY,
                      handSearchW,
                      handSearchH
                    );
                    
                    // Detect hand gestures
                    const gestureResult = detectHandGesture(handROI, handSearchW, handSearchH);
                    detectedHandGesture = gestureResult.gesture;
                    handGestureValue = gestureResult.confidence;
                    
                    // Update gesture state
                    if (detectedHandGesture && detectedHandGesture !== state.currentGesture) {
                      console.log(`[Hand Gesture] Detected: ${detectedHandGesture} (confidence: ${handGestureValue.toFixed(2)})`);
                    }
                  }
                } catch (err) {
                  console.warn('[FaceTracker] Error in hand gesture detection:', err);
                }
              }

              // Now update face position with eye and mouth detection data
              // Always store eye/mouth data for preview, even if channels aren't configured
              if (lastFacePositionRef.current) {
                const faceX = face.x * scaleX;
                const faceY = face.y * scaleY;
                const faceW = face.width * scaleX;
                const faceH = face.height * scaleY;
                
                // Always calculate and store eye positions for preview
                lastFacePositionRef.current.leftEye = {
                  x: faceX + faceW * 0.2,
                  y: faceY + faceH * 0.25,
                  width: faceW * 0.2,
                  height: faceH * 0.15
                };
                lastFacePositionRef.current.rightEye = {
                  x: faceX + faceW * 0.6,
                  y: faceY + faceH * 0.25,
                  width: faceW * 0.2,
                  height: faceH * 0.15
                };
                lastFacePositionRef.current.isBlinking = isBlinking;
                
                // Always calculate and store mouth position for preview
                lastFacePositionRef.current.mouth = {
                  x: faceX + faceW * 0.3,
                  y: faceY + faceH * 0.5,
                  width: faceW * 0.4,
                  height: faceH * 0.25
                };
                lastFacePositionRef.current.mouthOpenness = mouthValue > 0 ? (mouthValue - settings.mouthMin) / (settings.mouthMax - settings.mouthMin) : 0;
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
              
              // Log head pose for debugging (less frequently to prevent Firefox crashes)
              if (Math.random() < 0.02) {
                console.log(`[Head Pose] Yaw: ${yaw.toFixed(3)} (Pan: ${pan.toFixed(3)}), Pitch: ${pitch.toFixed(3)} (Tilt: ${tilt.toFixed(3)}) | Eye Angle: ${(eyeLineAngle * 180 / Math.PI).toFixed(1)}°, Aspect: ${faceAspectRatio.toFixed(2)}`);
              }

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
              
              // Detect head movement gestures (nodding, shaking)
              const currentTime = Date.now();
              let detectedHeadGesture = '';
              
              if (history.panHistory.length >= 8 && currentTime - history.lastGestureTime > 300) {
                // Detect shaking head (rapid horizontal movement)
                const panVariance = calculateVariance(history.panHistory);
                const panRange = Math.max(...history.panHistory) - Math.min(...history.panHistory);
                
                // Detect nodding (rapid vertical movement) - IMPROVED SENSITIVITY
                const tiltVariance = calculateVariance(history.tiltHistory);
                const tiltRange = Math.max(...history.tiltHistory) - Math.min(...history.tiltHistory);
                
                // Improved thresholds for better detection
                const shakingThreshold = 0.008 * settings.gestureSensitivity; // Lower = more sensitive
                const noddingThreshold = 0.008 * settings.gestureSensitivity; // Lower = more sensitive
                const rangeThreshold = 0.12 * settings.gestureSensitivity; // Lower = more sensitive
                
                if (panVariance > shakingThreshold && panRange > rangeThreshold && tiltVariance < 0.004) {
                  detectedHeadGesture = 'SHAKING HEAD';
                } else if (tiltVariance > noddingThreshold && tiltRange > rangeThreshold && panVariance < 0.004) {
                  detectedHeadGesture = 'NODDING';
                } else if (panVariance < 0.001 && tiltVariance < 0.001) {
                  detectedHeadGesture = 'STILL';
                }
                
                if (detectedHeadGesture && detectedHeadGesture !== history.lastGesture) {
                  console.log(`[Gesture] ${detectedHeadGesture} detected! Pan var: ${panVariance.toFixed(4)}, Tilt var: ${tiltVariance.toFixed(4)}, Pan range: ${panRange.toFixed(3)}, Tilt range: ${tiltRange.toFixed(3)}`);
                  history.lastGesture = detectedHeadGesture;
                  history.lastGestureTime = currentTime;
                }
              }
              
              // Detect facial expressions (smile, sad, etc.) based on mouth shape
              let detectedFacialExpression = '';
              if (settings.enableGestures && lastFacePositionRef.current && lastFacePositionRef.current.mouth) {
                try {
                  const mouth = lastFacePositionRef.current.mouth;
                  const mouthOpenness = lastFacePositionRef.current.mouthOpenness || 0;
                  
                  // Extract mouth region for expression analysis
                  const mouthX = Math.round(mouth.x);
                  const mouthY = Math.round(mouth.y);
                  const mouthW = Math.round(mouth.width);
                  const mouthH = Math.round(mouth.height);
                  
                  if (mouthW > 10 && mouthH > 10) {
                    // Extract mouth region from detection canvas
                    const mouthROI = detCtx.getImageData(
                      Math.max(0, Math.min(mouthX, detWidth - 1)),
                      Math.max(0, Math.min(mouthY, detHeight - 1)),
                      Math.max(1, Math.min(mouthW, detWidth - mouthX)),
                      Math.max(1, Math.min(mouthH, detHeight - mouthY))
                    );
                    
                    // Analyze mouth curve to detect expressions
                    const expression = detectFacialExpression(mouthROI, mouthOpenness);
                    if (expression && expression !== detectedHeadGesture) {
                      detectedFacialExpression = expression;
                      // Update gesture if facial expression is detected
                      if (currentTime - history.lastGestureTime > 500) {
                        console.log(`[Facial Expression] ${expression} detected! Mouth openness: ${mouthOpenness.toFixed(3)}`);
                        history.lastGesture = expression;
                        history.lastGestureTime = currentTime;
                      }
                    }
                  }
                } catch (err) {
                  console.warn('[FaceTracker] Error in facial expression detection:', err);
                }
              }
              
              // Combine head gestures and facial expressions (facial expressions take priority)
              const finalGesture = detectedFacialExpression || detectedHeadGesture || history.lastGesture;

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
              
              // Debug logging (reduced frequency to prevent Firefox crashes)
              if (Math.random() < 0.05 && (Math.abs(pan) > 0.1 || Math.abs(tilt) > 0.1)) {
                console.log('[FaceTracker] Pan:', pan.toFixed(3), 'Tilt:', tilt.toFixed(3), 
                  'Smoothed Pan:', smoothedPanRef.current.toFixed(3), 
                  'Smoothed Tilt:', smoothedTiltRef.current.toFixed(3));
              }

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
              
              // X/Y, iris, mouth, tongue, and zoom values (may be modified by delay)
              let finalXValue = xPositionValue;
              let finalYValue = yPositionValue;
              let finalIrisValue = irisValue;
              let finalMouthValue = mouthValue;
              let finalTongueValue = tongueValue;
              let finalZoomValue = zoomValue;
              
              if (settings.delay > 0) {
                // Add current values to delay buffer
                delayBufferRef.current.push({
                  pan: targetPanValue,
                  tilt: targetTiltValue,
                  x: xPositionValue,
                  y: yPositionValue,
                  iris: irisValue,
                  mouth: mouthValue,
                  tongue: tongueValue,
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
                  // Also delay X/Y, iris, mouth, tongue, and zoom if delay is enabled
                  finalXValue = closestEntry.x;
                  finalYValue = closestEntry.y;
                  finalIrisValue = closestEntry.iris;
                  finalMouthValue = closestEntry.mouth;
                  finalTongueValue = closestEntry.tongue;
                  finalZoomValue = closestEntry.zoom;
                } else {
                  // If no delayed value available yet, use current (will build up over time)
                  panValue = targetPanValue;
                  tiltValue = targetTiltValue;
                }
              }

              // Always update state for UI display (not just when sending DMX)
              setState(prev => ({ 
                ...prev, 
                currentPan: panValue, 
                currentTilt: tiltValue,
                currentX: finalXValue,
                currentY: finalYValue,
                currentIris: finalIrisValue,
                currentMouth: finalMouthValue,
                currentTongue: finalTongueValue,
                currentZoom: finalZoomValue,
                isBlinking: isBlinking,
                isTongueOut: isTongueOut,
                currentGesture: finalGesture || detectedHandGesture || prev.currentGesture
              }));

              // Verbose logging for pan/tilt calculation (reduced frequency to prevent Firefox crashes)
              if (Math.random() < 0.05 && (Math.abs(pan) > 0.1 || Math.abs(tilt) > 0.1)) {
                console.log(`[Pan/Tilt] Raw: Pan=${pan.toFixed(4)}, Tilt=${tilt.toFixed(4)} | ` +
                  `Target: Pan=${targetPan.toFixed(4)}, Tilt=${targetTilt.toFixed(4)} | ` +
                  `Smoothed: Pan=${smoothedPanRef.current.toFixed(4)}, Tilt=${smoothedTiltRef.current.toFixed(4)} | ` +
                  `DMX: Pan=${panValue}, Tilt=${tiltValue} | ` +
                  `Sensitivity: Pan=${settings.panSensitivity}, Tilt=${settings.tiltSensitivity}`);
              }

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
                    if (settings.mouthChannel > 0) {
                      dmxUpdates[settings.mouthChannel - 1] = finalMouthValue;
                    }
                    if (settings.tongueChannel > 0) {
                      dmxUpdates[settings.tongueChannel - 1] = finalTongueValue;
                    }
                    // Gesture channels (can be mapped to different DMX channels per gesture)
                    if (detectedHandGesture && settings.enableGestures) {
                      // Map gestures to DMX channels (can be configured later)
                      // For now, use a single gesture channel if configured
                      // TODO: Add per-gesture channel mapping
                    }
                  }

                  // Only send if we have updates
                  if (Object.keys(dmxUpdates).length > 0) {
                    // Send via socket or HTTP
                    if (socket && socketConnected) {
                      try {
                        (socket as any).emit('dmx:batch', dmxUpdates);
                        console.log('[FaceTracker] DMX batch sent:', dmxUpdates, 'Pan:', panValue, 'Tilt:', tiltValue);
                        
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
        try {
          if (src && !src.isDeleted()) src.delete();
          if (gray && !gray.isDeleted()) gray.delete();
          if (faces && !faces.isDeleted()) faces.delete();
          if (msize && !msize.isDeleted()) msize.delete();
          if (maxSizeObj && !maxSizeObj.isDeleted()) maxSizeObj.delete();
        } catch (cleanupError) {
          console.error('[FaceTracker] Error during cleanup:', cleanupError);
        }

        // Continue detection loop only if still running
        if (state.isRunning) {
          detectionFrameRef.current = requestAnimationFrame(processDetection);
        } else {
          detectionFrameRef.current = undefined;
        }
        } catch (error) {
          // Catch any unhandled errors and log them
          console.error('[FaceTracker] Frame processing error:', error);
          console.error('[FaceTracker] Error details:', {
            errorType: error?.constructor?.name,
            errorMessage: error?.message,
            stack: error?.stack
          });
          // Only continue loop if still running
          if (state.isRunning) {
            // Continue immediately - requestAnimationFrame will throttle naturally
            detectionFrameRef.current = requestAnimationFrame(processDetection);
          } else {
            detectionFrameRef.current = undefined;
          }
        }
      };

    // Start the detection loop
    console.log('[FaceTracker] Starting processDetection loop');
    // Only start if running and initialized - don't recreate if already running
    if (state.isRunning && opencvRef.current && cascadeRef.current && !detectionFrameRef.current) {
      processDetection();
    }
    
    // Cleanup function to stop loop when dependencies change
    return () => {
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = undefined;
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = undefined;
      }
    };
  }, [state.isRunning, settings, showPreview, socket]);

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
    
    console.log('[FaceTracker] Starting preview and detection loops');
    
    // Start fast preview rendering
    renderPreview();
    
    // Start face detection (runs at lower rate)
    detectFaces();
  }, [renderPreview, detectFaces, state.isRunning]);

  useEffect(() => {
    console.log('[FaceTracker] Effect triggered', {
      isRunning: state.isRunning,
      isInitialized: state.isInitialized,
      opencvReady: !!opencvRef.current,
      cascadeReady: !!cascadeRef.current,
      videoReady: !!videoRef.current,
      canvasReady: !!canvasRef.current
    });
    
    if (state.isRunning && state.isInitialized) {
      console.log('[FaceTracker] Starting tracking...');
      startTracking();
    } else {
      console.log('[FaceTracker] Stopping tracking', { isRunning: state.isRunning, isInitialized: state.isInitialized });
      // Stop all loops when not running
      if (previewFrameRef.current) {
        cancelAnimationFrame(previewFrameRef.current);
        previewFrameRef.current = undefined;
      }
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
                // Update state immediately for UI responsiveness
                setState(prev => ({ ...prev, isRunning: shouldRun }));
                try {
                  if (shouldRun) {
                    await startCamera();
                  } else {
                    stopCamera();
                  }
                } catch (error) {
                  // If camera fails, revert state
                  console.error('[FaceTracker] Toggle error:', error);
                  setState(prev => ({ ...prev, isRunning: !shouldRun }));
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
        <div className={styles.error}>{state.error}</div>
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

      <div className={styles.previewSection}>
        {/* Camera Preview */}
        <div className={`${styles.previewContainer} ${isDetached ? styles.detached : ''}`} ref={previewContainerRef}>
        {showPreview ? (
            <>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>Camera Preview</span>
                <button
                  className={styles.detachButton}
                  onClick={() => setIsDetached(!isDetached)}
                  title={isDetached ? "Reattach Preview" : "Detach Preview"}
                >
                  <i className={`fas fa-${isDetached ? 'compress' : 'expand'}`}></i>
                  <span>{isDetached ? 'Reattach' : 'Detach'}</span>
                </button>
              </div>
              {!isDetached && (
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
              )}
          </>
        ) : (
          <div className={styles.noPreview}>Preview disabled</div>
        )}
        </div>

        {/* Detached Camera Preview Window */}
        {isDetached && showPreview && (
          <Draggable
            position={detachedPosition}
            onDrag={(e, data) => setDetachedPosition({ x: data.x, y: data.y })}
            onStop={(e, data) => setDetachedPosition({ x: data.x, y: data.y })}
            handle=".detachedPreviewHeader"
          >
            <div className={styles.detachedPreview}>
              <div className={`${styles.detachedPreviewHeader} detachedPreviewHeader`}>
                <span className={styles.detachedPreviewTitle}>Camera Preview</span>
                <button
                  className={styles.closeDetachedButton}
                  onClick={() => setIsDetached(false)}
                  title="Reattach Preview"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.detachedPreviewContent}>
                <video
                  ref={videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
                />
                <canvas
                  ref={canvasRef}
                  className={styles.detachedCanvas}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                />
              </div>
            </div>
          </Draggable>
        )}

        {/* 3D Fixture Model */}
        <div className={`${styles.fixture3DContainer} ${is3DFixtureDetached ? styles.detached : ''}`}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>3D Fixture Model</span>
            <button
              className={styles.detachButton}
              onClick={() => setIs3DFixtureDetached(!is3DFixtureDetached)}
              title={is3DFixtureDetached ? "Reattach 3D Model" : "Detach 3D Model"}
            >
              <i className={`fas fa-${is3DFixtureDetached ? 'compress' : 'expand'}`}></i>
              <span>{is3DFixtureDetached ? 'Reattach' : 'Detach'}</span>
            </button>
          </div>
          {!is3DFixtureDetached && (() => {
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
            );
          })()}
        </div>

        {/* Detached 3D Fixture Window */}
        {is3DFixtureDetached && (
          <Draggable
            position={fixture3DPosition}
            onDrag={(e, data) => setFixture3DPosition({ x: data.x, y: data.y })}
            onStop={(e, data) => setFixture3DPosition({ x: data.x, y: data.y })}
            handle=".detachedPreviewHeader"
          >
            <div className={styles.detachedPreview}>
              <div className={`${styles.detachedPreviewHeader} detachedPreviewHeader`}>
                <span className={styles.detachedPreviewTitle}>3D Fixture Model</span>
                <button
                  className={styles.closeDetachedButton}
                  onClick={() => setIs3DFixtureDetached(false)}
                  title="Reattach 3D Model"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.detachedPreviewContent}>
                {(() => {
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
                    <Fixture3DModel
                      panValue={state.currentPan}
                      tiltValue={state.currentTilt}
                      zoomValue={state.currentZoom}
                      irisValue={state.currentIris}
                      shutterValue={shutterValue}
                      goboValue={goboValue}
                      rgbColor={rgbColor}
                      width={500}
                      height={500}
                    />
                  );
                })()}
              </div>
            </div>
          </Draggable>
        )}
      </div>
        
        <div className={styles.previewControls}>
          <div className={styles.allControls}>
            {/* Camera Settings Section */}
            <div className={styles.controlSection}>
            <h4 className={styles.controlsTitle}>Camera Settings</h4>
            <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Automatically adjust camera exposure based on lighting conditions">
                <input
                  type="checkbox"
                  checked={settings.autoExposure}
                  onChange={async (e) => {
                    updateSetting('autoExposure', e.target.checked);
                    if (state.isRunning && streamRef.current) {
                      const track = streamRef.current.getVideoTracks()[0];
                      if (track) {
                        const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                        const updatedSettings = { ...settings, autoExposure: e.target.checked };
                          await applyCameraConstraints(track, capabilities, updatedSettings, false);
                      }
                    }
                  }}
                    title="Automatically adjust camera exposure based on lighting conditions"
                />
                Auto Exposure
              </label>
            </div>
            <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Manual exposure control (-10 to 10, negative = darker, positive = brighter)">
                Exposure {settings.autoExposure ? '(Manual Override)' : '(Manual)'}
              </label>
              <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>-10</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                    value={Math.max(-10, Math.min(10, settings.cameraExposure))}
                  onChange={async (e) => {
                    const value = parseFloat(e.target.value);
                    updateSetting('cameraExposure', value);
                    if (state.isRunning && streamRef.current) {
                      const track = streamRef.current.getVideoTracks()[0];
                      if (track) {
                        const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                        const updatedSettings = { ...settings, cameraExposure: value };
                          await applyCameraConstraints(track, capabilities, updatedSettings, false);
                      }
                    }
                  }}
                  disabled={!state.isRunning}
                  className={styles.slider}
                    title="Manual exposure control (-10 to 10, negative = darker, positive = brighter)"
                  />
                  <span className={styles.rangeLabel}>10</span>
                  <input
                    type="number"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={Math.max(-10, Math.min(10, settings.cameraExposure)).toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        updateSetting('cameraExposure', value);
                        if (state.isRunning && streamRef.current) {
                          const track = streamRef.current.getVideoTracks()[0];
                          if (track) {
                            const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                            const updatedSettings = { ...settings, cameraExposure: value };
                            applyCameraConstraints(track, capabilities, updatedSettings, false);
                          }
                        }
                      }
                    }}
                    disabled={!state.isRunning}
                    className={styles.numberInput}
                    title="Manual exposure control (-10 to 10, negative = darker, positive = brighter)"
                  />
              </div>
            </div>
            <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Camera hardware brightness adjustment (-1 to 1, negative = darker, positive = brighter)">
                  Brightness (Camera)
                </label>
              <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>-1</span>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                    value={Math.max(-1, Math.min(1, settings.cameraBrightness))}
                  onChange={async (e) => {
                    const value = parseFloat(e.target.value);
                    updateSetting('cameraBrightness', value);
                    if (state.isRunning && streamRef.current) {
                      const track = streamRef.current.getVideoTracks()[0];
                      if (track) {
                        const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                        const updatedSettings = { ...settings, cameraBrightness: value };
                          await applyCameraConstraints(track, capabilities, updatedSettings, false);
                        }
                      }
                    }}
                    disabled={!state.isRunning}
                    className={styles.slider}
                    title="Camera hardware brightness adjustment (-1 to 1, negative = darker, positive = brighter)"
                  />
                  <span className={styles.rangeLabel}>1</span>
                  <input
                    type="number"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={Math.max(-1, Math.min(1, settings.cameraBrightness)).toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        updateSetting('cameraBrightness', value);
                        if (state.isRunning && streamRef.current) {
                          const track = streamRef.current.getVideoTracks()[0];
                          if (track) {
                            const capabilities = (track as any)._faceTrackerCapabilities || track.getCapabilities() as any;
                            const updatedSettings = { ...settings, cameraBrightness: value };
                            applyCameraConstraints(track, capabilities, updatedSettings, false);
                        }
                      }
                    }
                  }}
                  disabled={!state.isRunning}
                    className={styles.numberInput}
                    title="Camera hardware brightness adjustment (-1 to 1, negative = darker, positive = brighter)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Select which camera to use for face tracking">
                  Camera Selection
                </label>
                <div className={styles.cameraButtons}>
                  {availableCameras.length === 0 ? (
                    <div className={styles.noCameras}>No cameras detected. Click "Start" to enable camera access.</div>
                  ) : (
                    availableCameras.map((camera, index) => (
                      <button
                        key={camera.deviceId || index}
                        type="button"
                        onClick={() => updateSetting('cameraIndex', index)}
                        disabled={state.isRunning}
                        className={`${styles.cameraButton} ${settings.cameraIndex === index ? styles.cameraButtonActive : ''}`}
                        title={camera.label || `Camera ${index + 1}`}
                      >
                        <LucideIcon name="Video" />
                        <span>{camera.label || `Camera ${index + 1}`}</span>
                        {settings.cameraIndex === index && (
                          <LucideIcon name="Check" className={styles.cameraButtonCheck} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Display Settings Section */}
            <div className={styles.controlSection}>
              <h4 className={styles.controlsTitle}>Display Settings</h4>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Software brightness multiplier for preview display (0-3, 1.0 = normal)">
                  Brightness (Software)
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={settings.brightness}
                    onChange={(e) => updateSetting('brightness', parseFloat(e.target.value))}
                  className={styles.slider}
                    title="Software brightness multiplier for preview display (0-3, 1.0 = normal)"
                  />
                  <span className={styles.rangeLabel}>3</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    step="0.1"
                    value={settings.brightness.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('brightness', value);
                    }}
                    className={styles.numberInput}
                    title="Software brightness multiplier for preview display (0-3, 1.0 = normal)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Software contrast multiplier for preview display (0-3, 1.0 = normal)">
                  Contrast
                </label>
                <div className={styles.sliderWrapper}>
                  <span className={styles.rangeLabel}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={settings.contrast}
                    onChange={(e) => updateSetting('contrast', parseFloat(e.target.value))}
                    className={styles.slider}
                    title="Software contrast multiplier for preview display (0-3, 1.0 = normal)"
                  />
                  <span className={styles.rangeLabel}>3</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    step="0.1"
                    value={settings.contrast.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) updateSetting('contrast', value);
                    }}
                    className={styles.numberInput}
                    title="Software contrast multiplier for preview display (0-3, 1.0 = normal)"
                  />
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel} title="Show/hide the camera preview window">
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    title="Show/hide the camera preview window"
                  />
                  Show Preview
                </label>
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
              
              {/* Blink Detection & Iris Control */}
              <div className={styles.controlGroup} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <label className={styles.controlLabel} style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  👁️ Blink Detection & Iris Control
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Automatically control iris based on eye blinks. When you blink, the iris closes.
                </p>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="DMX channel for blink-controlled iris (0 = disabled, uses Iris Channel if > 0)">
                    Blink Iris Channel
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="512"
                    step="1"
                    value={settings.blinkIrisChannel}
                    onChange={(e) => updateSetting('blinkIrisChannel', parseInt(e.target.value) || 0)}
                    className={styles.numberInput}
                    title="DMX channel for blink-controlled iris (0 = disabled, uses Iris Channel if > 0)"
                  />
                  {(settings.blinkIrisChannel > 0 || settings.irisChannel > 0) && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Current Iris: {state.currentIris} | Blinking: {state.isBlinking ? 'Yes' : 'No'}
                    </div>
                  )}
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="Eye aspect ratio threshold for blink detection (0.15-0.35, lower = more sensitive)">
                    Blink Threshold
                  </label>
                  <div className={styles.sliderWrapper}>
                    <span className={styles.rangeLabel}>0.15</span>
                    <input
                      type="range"
                      min="0.15"
                      max="0.35"
                      step="0.01"
                      value={settings.blinkThreshold}
                      onChange={(e) => updateSetting('blinkThreshold', parseFloat(e.target.value))}
                      className={styles.slider}
                      title="Eye aspect ratio threshold for blink detection (0.15-0.35, lower = more sensitive)"
                    />
                    <span className={styles.rangeLabel}>0.35</span>
                    <input
                      type="number"
                      min="0.15"
                      max="0.35"
                      step="0.01"
                      value={settings.blinkThreshold.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) updateSetting('blinkThreshold', value);
                      }}
                      className={styles.numberInput}
                      title="Eye aspect ratio threshold for blink detection (0.15-0.35, lower = more sensitive)"
                    />
                  </div>
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="How much blink affects iris (0-1, higher = more effect)">
                    Blink Sensitivity
                  </label>
                  <div className={styles.sliderWrapper}>
                    <span className={styles.rangeLabel}>0</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.blinkSensitivity}
                      onChange={(e) => updateSetting('blinkSensitivity', parseFloat(e.target.value))}
                      className={styles.slider}
                      title="How much blink affects iris (0-1, higher = more effect)"
                    />
                    <span className={styles.rangeLabel}>1</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.blinkSensitivity.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) updateSetting('blinkSensitivity', value);
                      }}
                      className={styles.numberInput}
                      title="How much blink affects iris (0-1, higher = more effect)"
                    />
                  </div>
                </div>
              </div>
              
              {/* Mouth Detection */}
              <div className={styles.controlGroup} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <label className={styles.controlLabel} style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  👄 Mouth Detection
                </label>
                <p className={styles.helpText} style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Track mouth openness to control a DMX channel (e.g., for gobo rotation, color change, etc.).
                </p>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="DMX channel for mouth openness (0 = disabled)">
                    Mouth Channel
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="512"
                    step="1"
                    value={settings.mouthChannel}
                    onChange={(e) => updateSetting('mouthChannel', parseInt(e.target.value) || 0)}
                    className={styles.numberInput}
                    title="DMX channel for mouth openness (0 = disabled)"
                  />
                  {settings.mouthChannel > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Current Mouth: {state.currentMouth} (Range: {settings.mouthMin}-{settings.mouthMax})
                    </div>
                  )}
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} title="How sensitive mouth detection is (0-1, higher = more sensitive)">
                    Mouth Sensitivity
                  </label>
                  <div className={styles.sliderWrapper}>
                    <span className={styles.rangeLabel}>0</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.mouthSensitivity}
                      onChange={(e) => updateSetting('mouthSensitivity', parseFloat(e.target.value))}
                      className={styles.slider}
                      title="How sensitive mouth detection is (0-1, higher = more sensitive)"
                    />
                    <span className={styles.rangeLabel}>1</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.mouthSensitivity.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) updateSetting('mouthSensitivity', value);
                      }}
                      className={styles.numberInput}
                      title="How sensitive mouth detection is (0-1, higher = more sensitive)"
                    />
                  </div>
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
            <span className={styles.statusLabel}>FPS:</span>
            <span>{state.fps}</span>
          </div>
        </div>

        {/* Live Control Output - Show all tracked values */}
        <div className={styles.liveControlSection}>
          <h4 className={styles.controlsTitle}>Live Control Output</h4>
          <p className={styles.helpText} style={{ marginBottom: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>
            Real-time preview of all tracked values being sent to DMX channels
          </p>
          
          {/* Pan Control - Always visible */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current pan value being sent to DMX (0-255)">
              Pan: {state.currentPan} {settings.panChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.panChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>0</span>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={state.currentPan}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current pan value being sent to DMX (0-255)"
              />
              <span className={styles.rangeLabel}>255</span>
              <input
                type="number"
                min="0"
                max="255"
                step="1"
                value={state.currentPan}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current pan value being sent to DMX (0-255)"
              />
            </div>
          </div>
          
          {/* Tilt Control - Always visible */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current tilt value being sent to DMX (0-255)">
              Tilt: {state.currentTilt} {settings.tiltChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.tiltChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>0</span>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={state.currentTilt}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current tilt value being sent to DMX (0-255)"
              />
              <span className={styles.rangeLabel}>255</span>
              <input
                type="number"
                min="0"
                max="255"
                step="1"
                value={state.currentTilt}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current tilt value being sent to DMX (0-255)"
              />
            </div>
          </div>
          
          {/* X Position Control - Always visible if tracking */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current X position value being sent to DMX (0-255)">
              X Position: {state.currentX} {settings.xPositionChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.xPositionChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>{settings.xPositionMin}</span>
              <input
                type="range"
                min={settings.xPositionMin}
                max={settings.xPositionMax}
                step="1"
                value={state.currentX}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current X position value being sent to DMX"
              />
              <span className={styles.rangeLabel}>{settings.xPositionMax}</span>
              <input
                type="number"
                min={settings.xPositionMin}
                max={settings.xPositionMax}
                step="1"
                value={state.currentX}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current X position value being sent to DMX"
              />
            </div>
          </div>
          
          {/* Y Position Control - Always visible if tracking */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current Y position value being sent to DMX (0-255)">
              Y Position: {state.currentY} {settings.yPositionChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.yPositionChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>{settings.yPositionMin}</span>
              <input
                type="range"
                min={settings.yPositionMin}
                max={settings.yPositionMax}
                step="1"
                value={state.currentY}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current Y position value being sent to DMX"
              />
              <span className={styles.rangeLabel}>{settings.yPositionMax}</span>
              <input
                type="number"
                min={settings.yPositionMin}
                max={settings.yPositionMax}
                step="1"
                value={state.currentY}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current Y position value being sent to DMX"
              />
            </div>
          </div>
          
          {/* Zoom Control - Always visible */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current zoom value being sent to DMX (0-255)">
              Zoom: {state.currentZoom} {settings.zoomChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.zoomChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>{settings.zoomMin}</span>
              <input
                type="range"
                min={settings.zoomMin}
                max={settings.zoomMax}
                step="1"
                value={state.currentZoom}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current zoom value being sent to DMX"
              />
              <span className={styles.rangeLabel}>{settings.zoomMax}</span>
              <input
                type="number"
                min={settings.zoomMin}
                max={settings.zoomMax}
                step="1"
                value={state.currentZoom}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current zoom value being sent to DMX"
              />
            </div>
          </div>
          
          {/* Iris Control - Always visible */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current iris value being sent to DMX (0-255)">
              Iris: {state.currentIris} {state.isBlinking && <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>👁️ BLINKING</span>} {(settings.blinkIrisChannel > 0 || settings.irisChannel > 0) && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.irisChannel || settings.blinkIrisChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>{settings.irisMin}</span>
              <input
                type="range"
                min={settings.irisMin}
                max={settings.irisMax}
                step="1"
                value={state.currentIris}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current iris value being sent to DMX (controlled by blink detection)"
              />
              <span className={styles.rangeLabel}>{settings.irisMax}</span>
              <input
                type="number"
                min={settings.irisMin}
                max={settings.irisMax}
                step="1"
                value={state.currentIris}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current iris value being sent to DMX (controlled by blink detection)"
              />
            </div>
          </div>
          
          {/* Mouth Control - Always visible */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current mouth openness value being sent to DMX (0-255)">
              Mouth: {state.currentMouth} {settings.mouthChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.mouthChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>{settings.mouthMin}</span>
              <input
                type="range"
                min={settings.mouthMin}
                max={settings.mouthMax}
                step="1"
                value={state.currentMouth}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current mouth openness value being sent to DMX"
              />
              <span className={styles.rangeLabel}>{settings.mouthMax}</span>
              <input
                type="number"
                min={settings.mouthMin}
                max={settings.mouthMax}
                step="1"
                value={state.currentMouth}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current mouth openness value being sent to DMX"
              />
            </div>
          </div>
          
          {/* Tongue Control - Always visible */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} title="Current tongue detection value being sent to DMX (0-255)">
              Tongue: {state.currentTongue} {state.isTongueOut && <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>👅 OUT</span>} {settings.tongueChannel > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Ch {settings.tongueChannel})</span>}
            </label>
            <div className={styles.sliderWrapper}>
              <span className={styles.rangeLabel}>0</span>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={state.currentTongue}
                readOnly
                disabled
                className={`${styles.slider} ${styles.liveSlider}`}
                title="Current tongue detection value being sent to DMX"
              />
              <span className={styles.rangeLabel}>255</span>
              <input
                type="number"
                min="0"
                max="255"
                step="1"
                value={state.currentTongue}
                readOnly
                disabled
                className={styles.numberInput}
                title="Current tongue detection value being sent to DMX"
              />
            </div>
          </div>
          
          {/* Gesture Display */}
          {settings.enableGestures && state.currentGesture && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} title="Current detected gesture">
                Gesture: <strong>{state.currentGesture}</strong>
              </label>
              <div className={styles.gestureDisplay}>
                {state.currentGesture === 'SMILING' && '😊'}
                {state.currentGesture === 'SAD' && '😢'}
                {state.currentGesture === 'SURPRISED' && '😲'}
                {state.currentGesture === 'NODDING' && '👍'}
                {state.currentGesture === 'SHAKING HEAD' && '👎'}
                {state.currentGesture === 'THUMBS_UP' && '👍'}
                {state.currentGesture === 'MIDDLE_FINGER' && '🖕'}
                {state.currentGesture === 'FIST' && '✊'}
                {state.currentGesture === 'OPEN_HAND' && '✋'}
                {state.currentGesture === 'NEUTRAL' && '😐'}
                {state.currentGesture === 'STILL' && '⏸️'}
              </div>
            </div>
          )}
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

