import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Sparkles.module.scss';
import { useStore } from '../../store';

interface Sparkle {
  id: string;
  x: number;
  y: number;
  key: number; // Used to force re-render and re-trigger animation
}

const MAX_SPARKLES = 50; // Increased limit for more sparkles on screen
const SPARKLE_LIFESPAN = 1500; // ms, updated to match animation duration
const DMX_CHANGE_COOLDOWN = 50; // ms, reduced cooldown for more responsive sparkles

export const Sparkles: React.FC = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const dmxChannels = useStore(state => state.dmxChannels);
  const uiSettings = useStore(state => state.uiSettings);
  const lastDmxActivityTimeRef = useRef<number>(0);
  const prevDmxChannelsRef = useRef<number[]>(dmxChannels);

  // Early return if sparkles are disabled
  if (!uiSettings?.sparklesEnabled) {
    return null;
  }

  const addSparkle = useCallback(() => {
    setSparkles(currentSparkles => {
      const now = Date.now();
      // Remove oldest sparkles if limit is reached
      const filteredSparkles = currentSparkles.length >= MAX_SPARKLES 
        ? currentSparkles.slice(currentSparkles.length - MAX_SPARKLES + 1) 
        : currentSparkles;

      const newSparkle: Sparkle = {
        id: `sparkle-${now}-${Math.random()}`,
        x: Math.random() * 100, // percentage
        y: Math.random() * 100, // percentage
        key: Math.random(), // Force re-render for animation
      };
      return [...filteredSparkles, newSparkle];
    });  }, []);

  useEffect(() => {
    // Effect to add sparkle on DMX channel change
    const dmxChanged = prevDmxChannelsRef.current.some((val, i) => val !== dmxChannels[i]);

    if (dmxChanged) {
      const now = Date.now();
      if (now - lastDmxActivityTimeRef.current > DMX_CHANGE_COOLDOWN) {
        addSparkle();
        console.log('DMX activity detected - sparkle triggered!');
        lastDmxActivityTimeRef.current = now;
      }
    }
    prevDmxChannelsRef.current = [...dmxChannels]; // Store current DMX state for next comparison
  }, [dmxChannels, addSparkle]);


  useEffect(() => {
    // Periodically remove old sparkles based on their creation time (embedded in id)
    const intervalId = setInterval(() => {
      const now = Date.now();
      setSparkles(currentSparkles =>
        currentSparkles.filter(
          s => now - parseInt(s.id.split('-')[1]) < SPARKLE_LIFESPAN
        )
      );
    }, SPARKLE_LIFESPAN / 2); // Check more frequently than lifespan

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.sparkleContainer}>
      {sparkles.map(sparkle => (
        <div
          key={sparkle.key}
          className={styles.sparkle}
          style={{
            top: `${sparkle.y}%`,
            left: `${sparkle.x}%`,
          }}
        />
      ))}
    </div>
  );
};
