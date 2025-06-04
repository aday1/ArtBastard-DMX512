import React, { useState, useEffect, useRef } from 'react';
import { DockableComponent } from '@/components/ui/DockableComponent';
import styles from './AudioFFTMini.module.scss';

interface AudioFFTMiniProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const AudioFFTMini: React.FC<AudioFFTMiniProps> = ({
  isCollapsed = false,
  onCollapsedChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize audio context and analyzer
  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzer = context.createAnalyser();
        
        analyzer.fftSize = 128; // Small FFT for mini panel
        analyzer.smoothingTimeConstant = 0.8;
        
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
        
        const source = context.createMediaStreamSource(stream);
        source.connect(analyzer);
        
        setAudioContext(context);
        setAnalyser(analyzer);
        setIsActive(true);
        setError('');
        
      } catch (err) {
        console.error('Failed to initialize audio:', err);
        setError('Microphone access denied or not available');
      }
    };

    if (!isCollapsed) {
      initAudio();
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCollapsed, audioContext]);

  // Animation loop for FFT visualization
  useEffect(() => {
    if (!analyser || !canvasRef.current || isCollapsed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Color based on frequency intensity
        const hue = (i / bufferLength) * 240; // Blue to red spectrum
        const intensity = dataArray[i] / 255;
        ctx.fillStyle = `hsla(${hue}, 80%, ${50 + intensity * 30}%, ${0.8 + intensity * 0.2})`;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isCollapsed]);

  const handleToggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    onCollapsedChange?.(newCollapsed);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <p>{error}</p>
          <small>Check microphone permissions</small>
        </div>
      );
    }

    if (!isActive) {
      return (
        <div className={styles.inactive}>
          <div className={styles.spinner}></div>
          <span>Initializing audio...</span>
        </div>
      );
    }

    return (
      <div className={styles.visualizer}>
        <canvas
          ref={canvasRef}
          width={200}
          height={80}
          className={styles.canvas}
        />
        <div className={styles.info}>
          <span className={styles.status}>
            <span className={styles.indicator}></span>
            Live Audio
          </span>
        </div>
      </div>
    );
  };

  return (
    <DockableComponent
      id="audio-fft-mini"
      title="Audio FFT Mini"
      component="midi-clock" // Reusing existing component type
      defaultPosition={{ zone: 'middle-left' }}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      width="240px"
      height="auto"
      className={styles.container}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Audio FFT</h3>
        <button 
          className={styles.collapseButton}
          onClick={handleToggleCollapsed}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className={styles.content}>
          {renderContent()}
        </div>
      )}
    </DockableComponent>
  );
};
