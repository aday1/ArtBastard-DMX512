// src/clockManager.ts

export type MasterClockSourceId = 'internal' | 'ableton-link-placeholder'; // Extensible later

export interface ClockState {
  bpm: number;
  isPlaying: boolean;
  source: MasterClockSourceId;
  beat: number; // Current beat in the bar (e.g., 1, 2, 3, 4 for 4/4)
  bar: number;  // Current bar number
}

export class ClockManager {
  private currentSource: MasterClockSourceId = 'internal';
  private internalBPM: number = 120.0;
  private isInternalPlaying: boolean = false;
  private internalIntervalId: NodeJS.Timeout | null = null;
  private beat: number = 1; // Current beat, 1-indexed
  private bar: number = 1;  // Current bar, 1-indexed
  private timeSignatureNominator: number = 4; // e.g., 4 for 4/4 time

  private subscribers: Array<(state: ClockState) => void> = [];

  constructor() {
    // Initialization logic, if any, beyond property defaults
  }

  public subscribe(callback: (state: ClockState) => void): () => void {
    this.subscribers.push(callback);
    // Return an unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    const state = this.getCurrentClockState();
    this.subscribers.forEach(callback => callback(state));
  }

  private getCurrentClockState(): ClockState {
    return {
      bpm: this.currentSource === 'internal' ? this.internalBPM : 0, // Placeholder for non-internal BPM
      isPlaying: this.currentSource === 'internal' ? this.isInternalPlaying : false, // Placeholder
      source: this.currentSource,
      beat: this.beat,
      bar: this.bar,
    };
  }

  public setSource(sourceId: MasterClockSourceId): void {
    if (this.currentSource === sourceId) return;

    this.currentSource = sourceId;

    if (sourceId === 'internal') {
      // If switching to internal, respect its current play state
      if (this.isInternalPlaying && !this.internalIntervalId) {
        this.startInternalClock(false); // Start without resetting beat/bar immediately
      } else if (!this.isInternalPlaying && this.internalIntervalId) {
        this.stopInternalClock();
      }
    } else if (sourceId === 'ableton-link-placeholder') {
      this.stopInternalClock(); // Stop internal clock if switching away
      // Future: Initialize Ableton Link connection etc.
      console.log('Ableton Link selected (not implemented). Internal clock stopped.');
    }
    this.notifySubscribers();
  }

  public setBPM(newBPM: number): void {
    if (newBPM <= 0) {
      console.warn('BPM must be positive.');
      return;
    }
    this.internalBPM = newBPM;

    if (this.currentSource === 'internal' && this.isInternalPlaying) {
      this.stopInternalClock();
      this.startInternalClock(false); // Restart with new BPM, don't reset beat/bar
    }
    this.notifySubscribers();
  }

  public togglePlayPause(): void {
    if (this.currentSource === 'internal') {
      if (this.isInternalPlaying) {
        this.stopInternalClock();
      } else {
        this.startInternalClock(true); // Reset beat/bar on play
      }
    } else if (this.currentSource === 'ableton-link-placeholder') {
      console.log('Play/Pause for Ableton Link not implemented.');
      // Future: Send play/pause to Ableton Link
    }
    // No direct notifySubscribers here, as start/stopInternalClock will do it.
  }

  public getAvailableSources(): Array<{ id: MasterClockSourceId; name: string }> {
    return [
      { id: 'internal', name: 'Internal Clock' },
      { id: 'ableton-link-placeholder', name: 'Ableton Link (Not Implemented)' }
    ];
  }

  public getState(): ClockState {
    return this.getCurrentClockState();
  }

  private startInternalClock(resetBeatBar: boolean = true): void {
    if (this.internalIntervalId) return; // Already running

    this.isInternalPlaying = true;
    if (resetBeatBar) {
      this.beat = 1;
      this.bar = 1;
    }

    const intervalMilliseconds = (60000 / this.internalBPM);
    this.internalIntervalId = setInterval(() => this.handleInternalTick(), intervalMilliseconds);

    console.log(`Internal clock started. BPM: ${this.internalBPM}. Beat/Bar reset: ${resetBeatBar}`);
    this.notifySubscribers();
  }

  private stopInternalClock(): void {
    if (this.internalIntervalId) {
      clearInterval(this.internalIntervalId);
      this.internalIntervalId = null;
    }
    this.isInternalPlaying = false;
    console.log('Internal clock stopped.');
    this.notifySubscribers();
  }

  private handleInternalTick(): void {
    this.beat++;
    if (this.beat > this.timeSignatureNominator) {
      this.beat = 1;
      this.bar++;
      // Future: Add logic for bar limits or looping if needed
    }
    // console.log(`Tick: Bar ${this.bar}, Beat ${this.beat}`); // For debugging
    this.notifySubscribers();
  }

  // --- Additional methods for controlling beat/bar might be needed later ---
  public setBeat(beat: number): void {
    if (beat > 0 && beat <= this.timeSignatureNominator) {
        this.beat = beat;
        this.notifySubscribers();
    }
  }

  public setBar(bar: number): void {
    if (bar > 0) {
        this.bar = bar;
        this.notifySubscribers();
    }
  }

  public setTimeSignatureNominator(nominator: number): void {
    if (nominator > 0) {
        this.timeSignatureNominator = nominator;
        // Optionally reset beat/bar or adjust if current beat > new nominator
        if (this.beat > nominator) {
            this.beat = 1;
            this.bar++; // Or handle differently
        }
        this.notifySubscribers();
    }
  }
}

export const clockManager = new ClockManager();
