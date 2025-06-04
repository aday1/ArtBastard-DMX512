// src/clockManager.ts

export type MasterClockSourceId = 'internal' | 'ableton-link'; // Extensible later

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
  private midiClockIntervalId: NodeJS.Timeout | null = null;
  private beat: number = 1; // Current beat, 1-indexed
  private bar: number = 1;  // Current bar, 1-indexed
  private timeSignatureNominator: number = 4; // e.g., 4 for 4/4 time
  private midiClockTickCount: number = 0; // For 24 ticks per quarter note

  private subscribers: Array<(state: ClockState) => void> = [];
  private midiClockTickSubscribers: Array<() => void> = [];
  private midiOutput: any = null; // easymidi.Output instance
  
  // Ableton Link properties
  private abletonLinkConnected: boolean = false;
  private abletonLinkPeers: number = 0;
  private abletonLinkBPM: number = 120.0;
  private abletonLinkIsPlaying: boolean = false;
  constructor() {
    // Initialization logic, if any, beyond property defaults
    this.initializeMidiOutput();
  }
  private async initializeMidiOutput(): Promise<void> {
    try {
      // Import easymidi dynamically to avoid issues in browser environments
      const easymidi = await import('easymidi');
      
      // Try to create a virtual MIDI output for the internal clock
      this.midiOutput = new easymidi.Output('ArtBastard Internal Clock', true);
      console.log('MIDI Clock output initialized: ArtBastard Internal Clock');
    } catch (error) {
      console.warn('Failed to initialize MIDI Clock output:', error);
      this.midiOutput = null;
    }
  }

  private async initializeAbletonLink(): Promise<void> {
    try {
      // TODO: Implement actual Ableton Link integration
      // For now, this is a placeholder that simulates Link connection
      console.log('Initializing Ableton Link connection...');
      
      // Simulate connection attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.abletonLinkConnected = true;
      this.abletonLinkPeers = 0; // Start with 0 peers
      this.abletonLinkBPM = 120.0; // Default BPM
      this.abletonLinkIsPlaying = false;
      
      console.log('Ableton Link initialized (simulated)');
      this.notifySubscribers();
    } catch (error) {
      console.warn('Failed to initialize Ableton Link:', error);
      this.abletonLinkConnected = false;
    }
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
    if (this.currentSource === 'internal') {
      return {
        bpm: this.internalBPM,
        isPlaying: this.isInternalPlaying,
        source: this.currentSource,
        beat: this.beat,
        bar: this.bar,
      };
    } else if (this.currentSource === 'ableton-link') {
      return {
        bpm: this.abletonLinkBPM,
        isPlaying: this.abletonLinkIsPlaying,
        source: this.currentSource,
        beat: this.beat,
        bar: this.bar,
      };
    } else {
      return {
        bpm: 0,
        isPlaying: false,
        source: this.currentSource,
        beat: this.beat,
        bar: this.bar,
      };
    }
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
      }    } else if (sourceId === 'ableton-link') {
      this.stopInternalClock(); // Stop internal clock if switching away
      // Initialize Ableton Link connection
      this.initializeAbletonLink();
      console.log('Ableton Link selected - attempting connection...');
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
      }    } else if (this.currentSource === 'ableton-link') {
      console.log('Play/Pause for Ableton Link not yet fully implemented.');
      // TODO: Send play/pause to Ableton Link
    }
    // No direct notifySubscribers here, as start/stopInternalClock will do it.
  }
  public getAvailableSources(): Array<{ id: MasterClockSourceId; name: string }> {
    return [
      { id: 'internal', name: 'Internal Clock' },
      { id: 'ableton-link', name: 'Ableton Link' }
    ];
  }
  public getState(): ClockState {
    return this.getCurrentClockState();
  }

  public getAbletonLinkStatus(): { connected: boolean; peers: number } {
    return {
      connected: this.abletonLinkConnected,
      peers: this.abletonLinkPeers
    };
  }

  public subscribeMidiClockTick(callback: () => void): () => void {
    this.midiClockTickSubscribers.push(callback);
    return () => {
      this.midiClockTickSubscribers = this.midiClockTickSubscribers.filter(sub => sub !== callback);
    };
  }
  private sendMidiClockTick(): void {
    // Send MIDI Clock tick message if output is available
    if (this.midiOutput) {
      try {
        this.midiOutput.send('clock');
      } catch (error) {
        console.warn('Failed to send MIDI clock tick:', error);
      }
    }
    
    // Notify all MIDI clock tick subscribers
    this.midiClockTickSubscribers.forEach(callback => callback());
  }

  private sendMidiClockStart(): void {
    // Send MIDI Clock Start message if output is available
    if (this.midiOutput) {
      try {
        this.midiOutput.send('start');
        console.log('MIDI Clock Start sent');
      } catch (error) {
        console.warn('Failed to send MIDI clock start:', error);
      }
    }
  }

  private sendMidiClockStop(): void {
    // Send MIDI Clock Stop message if output is available
    if (this.midiOutput) {
      try {
        this.midiOutput.send('stop');
        console.log('MIDI Clock Stop sent');
      } catch (error) {
        console.warn('Failed to send MIDI clock stop:', error);
      }
    }
  }  private startInternalClock(resetBeatBar: boolean = true): void {
    if (this.internalIntervalId) return; // Already running

    this.isInternalPlaying = true;
    if (resetBeatBar) {
      this.beat = 1;
      this.bar = 1;
      this.midiClockTickCount = 0;
    }

    // Send MIDI Clock Start message
    this.sendMidiClockStart();

    // Start beat interval (quarter notes)
    const beatIntervalMilliseconds = (60000 / this.internalBPM);
    this.internalIntervalId = setInterval(() => this.handleInternalTick(), beatIntervalMilliseconds);

    // Start MIDI clock interval (24 ticks per quarter note)
    const midiClockIntervalMilliseconds = beatIntervalMilliseconds / 24;
    this.midiClockIntervalId = setInterval(() => this.handleMidiClockTick(), midiClockIntervalMilliseconds);

    console.log(`Internal clock started. BPM: ${this.internalBPM}. Beat/Bar reset: ${resetBeatBar}`);
    this.notifySubscribers();
  }
  private stopInternalClock(): void {
    if (this.internalIntervalId) {
      clearInterval(this.internalIntervalId);
      this.internalIntervalId = null;
    }
    if (this.midiClockIntervalId) {
      clearInterval(this.midiClockIntervalId);
      this.midiClockIntervalId = null;
    }
    
    // Send MIDI Clock Stop message
    this.sendMidiClockStop();
    
    this.isInternalPlaying = false;
    console.log('Internal clock stopped.');
    this.notifySubscribers();
  }  private handleInternalTick(): void {
    this.beat++;
    if (this.beat > this.timeSignatureNominator) {
      this.beat = 1;
      this.bar++;
      // Future: Add logic for bar limits or looping if needed
    }
    
    // console.log(`Tick: Bar ${this.bar}, Beat ${this.beat}`); // For debugging
    this.notifySubscribers();
  }

  private handleMidiClockTick(): void {
    this.midiClockTickCount++;
    
    // Reset tick count every quarter note (24 ticks)
    if (this.midiClockTickCount >= 24) {
      this.midiClockTickCount = 0;
    }
    
    // Send MIDI Clock tick
    this.sendMidiClockTick();
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
