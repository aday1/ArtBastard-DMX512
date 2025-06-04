import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MidiClock from './MidiClock'; // Adjust path as necessary
import styles from './MidiClock.module.scss'; // Import SCSS module

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn(() => ({
    selectedMidiClockHostId: 'internal',
    availableMidiClockHosts: [{ id: 'internal', name: 'Internal Clock' }],
    midiClockBpm: 120.00,
    midiClockIsPlaying: false,
    midiClockCurrentBeat: 1,
    midiClockCurrentBar: 1,
    requestToggleMasterClockPlayPause: vi.fn(),
  })),
}));

describe('MidiClock', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // MidiClock uses setInterval for current time
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly and is docked below OscMonitor', () => {
    render(<MidiClock />);

    const titleElement = screen.getByText(/MIDI Clock/i);
    expect(titleElement).toBeInTheDocument();

    // The main element of MidiClock is the one with the styles.midiClock class
    const clockElement = screen.getByText(/MIDI Clock/i).closest(`.${styles.midiClock}`);
    expect(clockElement).not.toBeNull();


    if (clockElement) {
      // Check for the class directly
      expect(clockElement).toHaveClass(styles.midiClock);

      const computedStyle = getComputedStyle(clockElement);
      expect(computedStyle.position).toBe('fixed');
      // OscMonitor (top 340px + max-height 300px) + 20px spacing = 660px
      expect(computedStyle.top).toBe('660px');
      expect(computedStyle.right).toBe('20px');
      // expect(computedStyle.width).toBe('280px'); // If defined in MidiClock.module.scss
    }
  });

  it('displays the current time, BPM, bar, and beat', () => {
    const mockDate = new Date(2023, 10, 21, 14, 35, 30); // Tue Nov 21 2023 14:35:30
    vi.setSystemTime(mockDate);

    render(<MidiClock />);

    expect(screen.getByText(mockDate.toLocaleTimeString())).toBeInTheDocument();
    expect(screen.getByText(/BPM: 120.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Bar: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Beat: 1/i)).toBeInTheDocument(); // This will actually be "Beat: 1" from the mock
  });

  // Add more tests: e.g., for play/pause functionality, external sync display, etc.
});
