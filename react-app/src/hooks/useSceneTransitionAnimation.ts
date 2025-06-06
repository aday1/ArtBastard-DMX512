import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export const useSceneTransitionAnimation = () => {
  const isTransitioning = useStore((state) => state.isTransitioning);
  const transitionStartTime = useStore((state) => state.transitionStartTime);
  const transitionDuration = useStore((state) => state.transitionDuration);
  const fromDmxValues = useStore((state) => state.fromDmxValues);
  const toDmxValues = useStore((state) => state.toDmxValues);
  const setDmxChannelsForTransition = useStore((state) => state.setDmxChannelsForTransition);
  const clearTransitionState = useStore((state) => state.clearTransitionState);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const tick = () => {
      if (!isMounted) return;

      if (!isTransitioning || !transitionStartTime || !fromDmxValues || !toDmxValues || !transitionDuration) {
        // Cancel any pending frame when not transitioning
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
          frameIdRef.current = null;
        }
        return;
      }

      const now = Date.now();
      const elapsed = now - transitionStartTime;
      const progress = Math.min(elapsed / transitionDuration, 1);

      const newDmxValues = new Array(512).fill(0);
      for (let i = 0; i < 512; i++) {
        const fromVal = fromDmxValues[i] || 0;
        const toVal = toDmxValues[i] || 0;
        newDmxValues[i] = Math.round(fromVal + (toVal - fromVal) * progress);
      }

      if (isMounted) {
        setDmxChannelsForTransition(newDmxValues);
        if (progress >= 1) {
          clearTransitionState();
          if (frameIdRef.current) {
            cancelAnimationFrame(frameIdRef.current);
            frameIdRef.current = null;
          }
        } else {
          frameIdRef.current = requestAnimationFrame(tick);
        }
      }
    };

    if (isTransitioning) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      frameIdRef.current = requestAnimationFrame(tick);
    } else if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    return () => {
      isMounted = false;
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        // Optional: Clear from store on unmount if this hook instance was the one that set it.
        // setCurrentTransitionFrameId(null);
        // This might be too aggressive if multiple components could control this.
        // For now, the logic when isTransitioning becomes false should handle store cleanup.
      }
    };
  }, [
    isTransitioning,
    transitionStartTime,
    transitionDuration,
    fromDmxValues,
    toDmxValues,
    setDmxChannelsForTransition,
    clearTransitionState
  ]);
};
