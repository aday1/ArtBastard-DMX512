import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export const useSceneTransitionAnimation = () => {
  const isTransitioning = useStore((state) => state.isTransitioning);
  const transitionStartTime = useStore((state) => state.transitionStartTime);
  const transitionDuration = useStore((state) => state.transitionDuration);
  const fromDmxValues = useStore((state) => state.fromDmxValues);
  const toDmxValues = useStore((state) => state.toDmxValues);
  const currentTransitionFrame = useStore((state) => state.currentTransitionFrame);

  const setDmxChannelsForTransition = useStore((state) => state.setDmxChannelsForTransition);
  const clearTransitionState = useStore((state) => state.clearTransitionState);
  const setCurrentTransitionFrameId = useStore((state) => state.setCurrentTransitionFrameId);

  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const tick = () => {
      if (!isMounted) return;

      if (!isTransitioning || !transitionStartTime || !fromDmxValues || !toDmxValues || !transitionDuration) {
        // If essential data is missing, or not transitioning, stop.
        // Check if a frame was previously scheduled by this hook instance and cancel it.
        if (frameIdRef.current) {
            cancelAnimationFrame(frameIdRef.current);
            setCurrentTransitionFrameId(null); // Clear from store as well
            frameIdRef.current = null;
        } else if (currentTransitionFrame) {
            // If frameIdRef is null, but store has a frame, it might be from another source or stale.
            // This specific condition might need refinement based on how currentTransitionFrame is managed globally.
            // For now, if we are not supposed to be transitioning, we ensure it's cancelled.
            cancelAnimationFrame(currentTransitionFrame);
            setCurrentTransitionFrameId(null);
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
          setCurrentTransitionFrameId(null); // Ensure frame ID is cleared from store
          frameIdRef.current = null; // Clear local ref
        } else {
          frameIdRef.current = requestAnimationFrame(tick);
          setCurrentTransitionFrameId(frameIdRef.current);
        }
      }
    };

    if (isTransitioning) {
      // If transitioning, start the animation.
      // Cancel any existing frame to prevent multiple loops if isTransitioning toggles quickly.
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (currentTransitionFrame) { // Also check store, though frameIdRef should be primary
          cancelAnimationFrame(currentTransitionFrame);
      }

      frameIdRef.current = requestAnimationFrame(tick);
      setCurrentTransitionFrameId(frameIdRef.current);
    } else {
      // If not transitioning, ensure any existing animation frame scheduled by this hook is cancelled.
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        setCurrentTransitionFrameId(null); // Clear from store
        frameIdRef.current = null;
      } else if (currentTransitionFrame) {
        // If local ref is null, but store has a frame, cancel it.
        // This handles cases where isTransitioning became false externally.
        cancelAnimationFrame(currentTransitionFrame);
        setCurrentTransitionFrameId(null);
      }
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
    currentTransitionFrame,
    setDmxChannelsForTransition,
    clearTransitionState,
    setCurrentTransitionFrameId
  ]);
};
