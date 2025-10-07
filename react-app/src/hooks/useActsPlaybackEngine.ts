import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export const useActsPlaybackEngine = () => {
  const { 
    actPlaybackState, 
    acts, 
    nextActStep, 
    setActStepProgress,
    loadScene 
  } = useStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!actPlaybackState.isPlaying || !actPlaybackState.currentActId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const act = acts.find(a => a.id === actPlaybackState.currentActId);
    if (!act || !act.steps.length) return;

    const currentStep = act.steps[actPlaybackState.currentStepIndex];
    if (!currentStep) return;

    // Reset step start time when step changes
    if (stepStartTimeRef.current !== actPlaybackState.stepStartTime) {
      stepStartTimeRef.current = actPlaybackState.stepStartTime;
    }

    // Start the playback interval
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - stepStartTimeRef.current;
      const stepDuration = currentStep.duration * actPlaybackState.playbackSpeed;
      const progress = Math.min(elapsed / stepDuration, 1);

      // Update progress
      setActStepProgress(progress);

      // Auto-advance to next step when current step completes
      if (progress >= 1) {
        nextActStep();
      }
    }, 50); // Update every 50ms for smooth progress

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    actPlaybackState.isPlaying,
    actPlaybackState.currentActId,
    actPlaybackState.currentStepIndex,
    actPlaybackState.stepStartTime,
    actPlaybackState.playbackSpeed,
    acts,
    nextActStep,
    setActStepProgress
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};
