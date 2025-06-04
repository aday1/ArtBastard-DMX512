import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OscMonitor from './OscMonitor'; // Adjust path as necessary
import styles from './OscMonitor.module.scss'; // Import SCSS module

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn(() => ({
    oscMessages: [], // Provide a default empty array for messages
    addOscMessage: vi.fn(), // Mock if it's called directly or indirectly on render
  })),
}));

// Mock useSocket as OscMonitor uses it
vi.mock('../../context/SocketContext', async () => {
  const actual = await vi.importActual('../../context/SocketContext');
  return {
    ...actual,
    useSocket: () => ({
      socket: null,
      connected: false, // Simulate not connected for basic render test
      error: null,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }),
  };
});


describe('OscMonitor', () => {
  it('renders correctly and is docked below MidiMonitor', () => {
    render(<OscMonitor />);

    const titleElement = screen.getByText(/OSC Monitor/i);
    expect(titleElement).toBeInTheDocument();

    const monitorElement = titleElement.closest('div'); // Get the main div of the component
    expect(monitorElement).not.toBeNull();

    if (monitorElement) {
      expect(monitorElement).toHaveClass(styles.oscMonitor);

      const computedStyle = getComputedStyle(monitorElement);
      expect(computedStyle.position).toBe('fixed');
      // Assuming MidiMonitor is 300px high + 20px top + 20px spacing = 340px
      expect(computedStyle.top).toBe('340px');
      expect(computedStyle.right).toBe('20px');
      // expect(computedStyle.width).toBe('400px'); // If defined in OscMonitor.module.scss
    }
  });

  it('shows "Socket not connected" when socket is not connected and no messages', () => {
    // The default mock for useSocket already has connected: false
    render(<OscMonitor />);
    expect(screen.getByText(/Socket not connected/i)).toBeInTheDocument();
  });

  // Add more tests: e.g., for when messages are present, socket connected, collapsed state, etc.
});
