import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import styles from './AudioFFT.module.scss';

// Define the structure for our custom 7 bands
interface CustomAudioBand {
  name: string;
  label: string; // For display
  minFreq: number;
  maxFreq: number;
  startBin?: number; // To be calculated
  endBin?: number;   // To be calculated
  oscAddress?: string; // Custom OSC address
  assignedSlider?: number; // Assigned DMX channel
}

// Define the 7 audio bands
const SEVEN_BANDS_CONFIG: CustomAudioBand[] = [
  { name: 'sub_bass', label: 'Sub Bass', minFreq: 20, maxFreq: 60 },
  { name: 'bass', label: 'Bass', minFreq: 60, maxFreq: 250 },
  { name: 'low_mids', label: 'Low Mids', minFreq: 250, maxFreq: 500 },
  { name: 'mids', label: 'Mids', minFreq: 500, maxFreq: 2000 },
  { name: 'upper_mids', label: 'Upper Mids', minFreq: 2000, maxFreq: 4000 },
  { name: 'presence', label: 'Presence', minFreq: 4000, maxFreq: 6000 },
  { name: 'brilliance', label: 'Brilliance', minFreq: 6000, maxFreq: 20000 },
];

interface FFTBandSelectionInfo {
  bandName: string;
  bandLabel: string;
  bandIndex: number; // 0-6
  magnitude: number; // Aggregate magnitude for this band
  minFreq: number;
  maxFreq: number;
  index: number; // Add this property for compatibility
  frequency: number; // Add this property for compatibility
}

interface AudioFFTProps {
  onBandSelect?: (bandInfo: FFTBandSelectionInfo) => void;
}

export const AudioFFT: React.FC<AudioFFTProps> = ({ onBandSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformAnalyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [audioSource, setAudioSource] = useState<'microphone' | 'browser'>('browser');
  const [fftData, setFFTData] = useState<Float32Array | null>(null); 
  const [selectedCustomBandIndex, setSelectedCustomBandIndex] = useState<number | null>(null);
  const [showWaveform, setShowWaveform] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { socket, connected: socketConnected } = useSocket();
  const { setDmxChannelValue } = useStore();

  const FFT_SIZE = 2048;

  const [calculatedBands, setCalculatedBands] = useState<CustomAudioBand[]>([]);
  const [bandMagnitudes, setBandMagnitudes] = useState<number[]>(new Array(7).fill(0));

  const calculateBinRanges = useCallback((sampleRate: number) => {
    const nyquist = sampleRate / 2;
    const bins = FFT_SIZE / 2;
    const hzPerBin = nyquist / bins;

    const newCalculatedBands = SEVEN_BANDS_CONFIG.map(band => ({
      ...band,
      startBin: Math.max(0, Math.floor(band.minFreq / hzPerBin)),
      endBin: Math.min(bins - 1, Math.ceil(band.maxFreq / hzPerBin)),
    }));
    setCalculatedBands(newCalculatedBands);
  }, []);

  // Enhanced visualization with waveform and better graphics
  const startVisualization = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || calculatedBands.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const waveformCanvas = waveformCanvasRef.current;
    const waveformCtx = waveformCanvas?.getContext('2d');
    if (!ctx) return;

    const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
    const waveformData = new Uint8Array(waveformAnalyserRef.current?.frequencyBinCount || 1024);

    const draw = () => {
      if (!analyserRef.current || calculatedBands.length === 0) return;

      // Get FFT data
      analyserRef.current.getFloatFrequencyData(dataArray);
      setFFTData(new Float32Array(dataArray));

      // Get waveform data
      if (waveformAnalyserRef.current) {
        waveformAnalyserRef.current.getByteTimeDomainData(waveformData);
      }

      // Clear canvases
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (waveformCtx && waveformCanvas) {
        waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
      }

      // Draw FFT bands
      const bandWidth = canvas.width / calculatedBands.length;
      const maxDb = -10;
      const minDb = -100;
      const newMagnitudes: number[] = [];

      for (let i = 0; i < calculatedBands.length; i++) {
        const customBand = calculatedBands[i];
        if (customBand.startBin === undefined || customBand.endBin === undefined) continue;

        // Calculate max magnitude within the custom band
        let maxMagnitudeInBand = -Infinity;
        for (let j = customBand.startBin; j <= customBand.endBin; j++) {
          if (dataArray[j] > maxMagnitudeInBand) {
            maxMagnitudeInBand = dataArray[j];
          }
        }
        
        // Normalize the magnitude for bar height (0 to 1)
        const normalizedValue = (maxMagnitudeInBand - minDb) / (maxDb - minDb);
        const clampedValue = Math.max(0, Math.min(1, normalizedValue));
        newMagnitudes.push(clampedValue);
        
        const barHeight = clampedValue * canvas.height;

        // Enhanced gradient bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (selectedCustomBandIndex === i) {
          gradient.addColorStop(0, '#ff4444');
          gradient.addColorStop(0.5, '#ff6666');
          gradient.addColorStop(1, '#ff8888');
        } else {
          const hue = (i / calculatedBands.length) * 360;
          gradient.addColorStop(0, `hsl(${hue}, 80%, 60%)`);
          gradient.addColorStop(0.5, `hsl(${hue}, 70%, 50%)`);
          gradient.addColorStop(1, `hsl(${hue}, 60%, 40%)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(i * bandWidth, canvas.height - barHeight, bandWidth - 2, barHeight);

        // Add band labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(customBand.label, i * bandWidth + bandWidth / 2, canvas.height - 5);

        // Send OSC and DMX data
        if (selectedCustomBandIndex === i && socket && socketConnected) {
          const oscAddress = customBand.oscAddress || `/audio/band/${customBand.name}`;
          socket.emit('osc-send', {
            address: oscAddress,
            args: [{ type: 'f', value: clampedValue }]
          });
          
          // Send to assigned DMX channel if configured
          if (customBand.assignedSlider !== undefined) {
            const dmxValue = Math.round(clampedValue * 255);
            setDmxChannelValue(customBand.assignedSlider, dmxValue);
          }
        }
      }

      setBandMagnitudes(newMagnitudes);

      // Draw waveform if enabled
      if (showWaveform && waveformCtx && waveformCanvas) {
        waveformCtx.strokeStyle = '#4ecdc4';
        waveformCtx.lineWidth = 2;
        waveformCtx.beginPath();

        const sliceWidth = waveformCanvas.width / waveformData.length;
        let x = 0;

        for (let i = 0; i < waveformData.length; i++) {
          const v = waveformData[i] / 128.0;
          const y = (v * waveformCanvas.height) / 2;

          if (i === 0) {
            waveformCtx.moveTo(x, y);
          } else {
            waveformCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        waveformCtx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, [selectedCustomBandIndex, socket, socketConnected, calculatedBands, showWaveform, setDmxChannelValue]);

  const initializeAudio = useCallback(async () => {
    try {
      audioContextRef.current = new AudioContext();
      calculateBinRanges(audioContextRef.current.sampleRate);

      // FFT analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Waveform analyser
      waveformAnalyserRef.current = audioContextRef.current.createAnalyser();
      waveformAnalyserRef.current.fftSize = 1024;
      waveformAnalyserRef.current.smoothingTimeConstant = 0.3;

      if (audioSource === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          audio: true,
          video: false 
        });
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      }

      sourceRef.current.connect(analyserRef.current);
      sourceRef.current.connect(waveformAnalyserRef.current);
      setIsActive(true);
      startVisualization();
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }, [audioSource, calculateBinRanges, startVisualization]);

  const stopAudio = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    sourceRef.current?.disconnect();
    if (sourceRef.current?.mediaStream) {
        sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }
    audioContextRef.current?.close().then(() => {
        audioContextRef.current = null;
        analyserRef.current = null;
        waveformAnalyserRef.current = null;
        sourceRef.current = null;
    });
    
    setIsActive(false);
    setFFTData(null);
    setSelectedCustomBandIndex(null);
    setBandMagnitudes(new Array(7).fill(0));
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || calculatedBands.length === 0 || !fftData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    const bandWidth = canvas.width / calculatedBands.length;
    const clickedBandIndex = Math.floor(x / bandWidth);

    if (clickedBandIndex >= 0 && clickedBandIndex < calculatedBands.length) {
      setSelectedCustomBandIndex(clickedBandIndex);
      
      const customBand = calculatedBands[clickedBandIndex];
      if (customBand.startBin === undefined || customBand.endBin === undefined) return;

      let maxMagnitudeInBand = -Infinity;
      for (let j = customBand.startBin; j <= customBand.endBin; j++) {
        if (fftData[j] > maxMagnitudeInBand) {
          maxMagnitudeInBand = fftData[j];        }
      }
      const normalizedValue = (maxMagnitudeInBand - (-100)) / ((-10) - (-100));
      
      onBandSelect?.({
        bandName: customBand.name,
        bandLabel: customBand.label,
        bandIndex: clickedBandIndex,
        magnitude: Math.max(0, Math.min(1, normalizedValue)),
        minFreq: customBand.minFreq,
        maxFreq: customBand.maxFreq,
        index: clickedBandIndex, // Add this property for compatibility
        frequency: (customBand.minFreq + customBand.maxFreq) / 2, // Add center frequency
      });
    }
  }, [calculatedBands, onBandSelect, fftData]);

  const updateBandOscAddress = (bandIndex: number, address: string) => {
    setCalculatedBands(prev => prev.map((band, i) => 
      i === bandIndex ? { ...band, oscAddress: address } : band
    ));
  };

  const updateBandSliderAssignment = (bandIndex: number, channelNumber: number | undefined) => {
    setCalculatedBands(prev => prev.map((band, i) => 
      i === bandIndex ? { ...band, assignedSlider: channelNumber } : band
    ));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (calculatedBands.length === 0) {
        calculateBinRanges(44100);
    }
    return () => {
      stopAudio();
    };
  }, [stopAudio, calculatedBands.length, calculateBinRanges]);

  const currentSelectedBandInfo = selectedCustomBandIndex !== null && calculatedBands[selectedCustomBandIndex]
    ? calculatedBands[selectedCustomBandIndex]
    : null;

  return (
    <div className={`${styles.audioFFT} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.header}>
        <h3>🎵 Audio FFT Analyzer</h3>
        <div className={styles.headerControls}>
          <button onClick={() => setShowWaveform(!showWaveform)} className={styles.toggleButton}>
            {showWaveform ? '📊' : '📈'} Waveform
          </button>
          <button onClick={toggleFullscreen} className={styles.fullscreenButton}>
            {isFullscreen ? '🗗' : '🗖'} Fullscreen
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.sourceSelect}>
          <label>Audio Source:</label>
          <select 
            value={audioSource} 
            onChange={(e) => setAudioSource(e.target.value as 'microphone' | 'browser')}
            disabled={isActive}
          >
            <option value="microphone">🎤 Microphone</option>
            <option value="browser">🌐 Browser Audio</option>
          </select>
        </div>

        <button 
          className={`${styles.toggleButton} ${isActive ? styles.active : ''}`}
          onClick={isActive ? stopAudio : initializeAudio}
        >
          {isActive ? '⏹️ Stop' : '▶️ Start'} 7-Band Analysis
        </button>

        {currentSelectedBandInfo && (
          <div className={styles.bandInfo}>
            <strong>Selected:</strong> {currentSelectedBandInfo.label} 
            ({currentSelectedBandInfo.minFreq} - {currentSelectedBandInfo.maxFreq} Hz)
            <span className={styles.magnitude}>
              📊 {(bandMagnitudes[selectedCustomBandIndex!] * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className={styles.visualizations}>
        {showWaveform && (
          <canvas
            ref={waveformCanvasRef}
            className={styles.waveformCanvas}
            width={800}
            height={100}
          />
        )}

        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={300}
          onClick={handleCanvasClick}
        />
      </div>

      {/* Band Configuration Panel */}
      {selectedCustomBandIndex !== null && currentSelectedBandInfo && (
        <div className={styles.bandConfig}>
          <h4>🎛️ Configure {currentSelectedBandInfo.label}</h4>
          <div className={styles.configRow}>
            <label>OSC Address:</label>
            <input
              type="text"
              value={currentSelectedBandInfo.oscAddress || `/audio/band/${currentSelectedBandInfo.name}`}
              onChange={(e) => updateBandOscAddress(selectedCustomBandIndex, e.target.value)}
              placeholder={`/audio/band/${currentSelectedBandInfo.name}`}
            />
          </div>
          <div className={styles.configRow}>
            <label>Assign to DMX Channel:</label>
            <input
              type="number"
              min="1"
              max="512"
              value={currentSelectedBandInfo.assignedSlider || ''}
              onChange={(e) => updateBandSliderAssignment(
                selectedCustomBandIndex, 
                e.target.value ? parseInt(e.target.value) : undefined
              )}
              placeholder="Channel (1-512)"
            />
          </div>
        </div>
      )}

      <div className={styles.instructions}>
        <p>🎯 <strong>Click on frequency bands</strong> to select for OSC output and DMX assignment</p>
        <p>📡 Selected band data is sent via OSC and can control DMX channels</p>
        <p>🎚️ Configure custom OSC addresses and DMX channel assignments below</p>
      </div>
    </div>
  );
};
