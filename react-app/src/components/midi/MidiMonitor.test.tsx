import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MidiMonitor from './MidiMonitor'; // Adjust path as necessary
import styles from './MidiMonitor.module.scss'; // Import SCSS module

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn(() => ({
    midiMessages: [], // Provide a default empty array for messages
  })),
}));

describe('MidiMonitor', () => {
  it('renders correctly and is docked to the top-right', () => {
    render(<MidiMonitor />);

    // Check if the component renders - e.g., by looking for its title
    const titleElement = screen.getByText(/MIDI Monitor/i);
    expect(titleElement).toBeInTheDocument();

    // Check for docking styles
    // The component itself will have the main class, e.g., styles.midiMonitor
    // We need to get the element and check its computed style or class presence
    const monitorElement = screen.getByText(/MIDI Monitor/i).closest('div'); // Get the parent div
    expect(monitorElement).not.toBeNull();

    if (monitorElement) {
      // Option 1: Check for the specific class if position is solely determined by it
      // This depends on your SCSS structure. If .midiMonitor directly applies fixed positioning:
      expect(monitorElement).toHaveClass(styles.midiMonitor);

      // Option 2: Check computed styles (more robust for verifying actual applied style)
      const computedStyle = getComputedStyle(monitorElement);
      expect(computedStyle.position).toBe('fixed');
      expect(computedStyle.top).toBe('20px');
      expect(computedStyle.right).toBe('20px');
      // Note: If width is set in SCSS, you can check it too.
      // expect(computedStyle.width).toBe('400px');
      // However, the subtask description implies width was removed from inline and should be in SCSS.
      // So, checking it here based on the SCSS module is a good idea if it's defined there.
    }
  });

  it('shows "No MIDI messages" when there are no messages', () => {
    render(<MidiMonitor />);
    expect(screen.getByText(/No MIDI messages received yet/i)).toBeInTheDocument();
  });

  // Add more tests: e.g., for when messages are present, collapsed state, etc.
});
