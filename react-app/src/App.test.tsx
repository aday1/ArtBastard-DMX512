import { render, screen, act } from '@testing-library/react';
import App from './App'; // Assuming App.tsx is in the src directory
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './store'; // Import the actual store to mock its implementation

// Mock the store with more granular control for testing transitions
vi.mock('./store', async () => {
  const actualStore = await vi.importActual('./store');
  const mockSetState = vi.fn();
  const mockGetState = vi.fn(() => ({
    fetchInitialState: vi.fn(),
    isTransitioning: false,
    currentTransitionFrame: null,
    setCurrentTransitionFrameId: vi.fn(),
    setDmxChannelsForTransition: vi.fn(),
    clearTransitionState: vi.fn(),
    transitionStartTime: null,
    fromDmxValues: null,
    toDmxValues: null,
    transitionDuration: 1000, // Default duration
    theme: 'dark',
    dmxUniverse: {},
    dmxChannels: Array(512).fill(0),
  }));

  // This is a simplified mock for Zustand. For complex scenarios, consider `zustand/middleware/testing`
  const useStoreMock = (selector) => {
    // Allow tests to dynamically update parts of the store's state
    // For example, by modifying what mockGetState returns or by re-mocking useStore.getState
    const state = typeof useStoreMock.getState === 'function' ? useStoreMock.getState() : mockGetState();
    return selector(state);
  };

  // Provide a way for tests to update the mock state
  useStoreMock.setState = mockSetState;
  useStoreMock.getState = mockGetState;

  return {
    ...actualStore, // Spread actual store exports
    useStore: useStoreMock, // Override useStore with our mock
    // Mock other specific exports if App.tsx imports them directly
  };
});

// Mock useSocket
vi.mock('./context/SocketContext', async () => {
  // Keep other exports, mock useSocket
  const actual = await vi.importActual('./context/SocketContext');
  return {
    ...actual,
    useSocket: () => ({ // Ensure it's a function that returns the object
      socket: null,
      connected: false,
      error: null,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }),
  };
});

// Mock useBrowserMidi
vi.mock('./hooks/useBrowserMidi', () => ({
  useBrowserMidi: () => ({
    browserInputs: [],
    connectBrowserInput: vi.fn(),
    refreshDevices: vi.fn(),
    isSupported: false,
  }),
}));

describe('App', () => {
  let requestAnimationFrameSpy;
  let cancelAnimationFrameSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      // Call the callback almost immediately for testing purposes
      const handle = setTimeout(() => cb(performance.now()), 0);
      return handle as unknown as number; // Cast to number as rAF returns a number
    });
    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => {
      clearTimeout(handle);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restores original implementations and clears timers
    vi.useRealTimers();
  });

  it('renders the main application structure', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}); // Keep console quiet
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);
    // Basic check, more specific checks can be added if there's static content in App/MainPage
    expect(screen.queryByText(/DMX Control Panel/i)).toBeNull(); // Example, assuming this is not initially visible or depends on other state

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('calls requestAnimationFrame when a scene transition starts', async () => {
    const mockSetCurrentTransitionFrameId = vi.fn();
    const mockSetDmxChannelsForTransition = vi.fn();
    const mockClearTransitionState = vi.fn();

    // Override the specific parts of the store state needed for this test
    // Vitest's `vi.mock` hoists, so useStore is already the mock defined above.
    // We can modify what its getState returns for this specific test.
    const initialMockState = {
      fetchInitialState: vi.fn(),
      isTransitioning: false, // Initially not transitioning
      currentTransitionFrame: null,
      setCurrentTransitionFrameId: mockSetCurrentTransitionFrameId,
      setDmxChannelsForTransition: mockSetDmxChannelsForTransition,
      clearTransitionState: mockClearTransitionState,
      transitionStartTime: null,
      fromDmxValues: Array(512).fill(0),
      toDmxValues: Array(512).fill(255),
      transitionDuration: 100, // Short duration for testing
      theme: 'dark',
      dmxUniverse: {},
      dmxChannels: Array(512).fill(0),
    };

    // Configure the mock return value for useStore for this test
    (useStore as any).getState = () => initialMockState;

    const { rerender } = render(<App />);

    // Update the store mock to simulate starting a transition
    (useStore as any).getState = () => ({
      ...initialMockState,
      isTransitioning: true,
      transitionStartTime: Date.now(), // Set start time
    });

    // Rerender the component with the new state that should trigger the effect
    // In a real app, this might be triggered by an action. Here we simulate the state change.
    rerender(<App />);

    // Advance timers to allow requestAnimationFrame's callback to fire
    // The number of times and duration depends on how rAF is used in App.tsx
    // We expect it to be called at least once to start the animation.
    await act(async () => {
      vi.advanceTimersByTime(50); // Advance by some time, e.g., half the duration
    });

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(mockSetCurrentTransitionFrameId).toHaveBeenCalled(); // Check if frame ID is stored
    expect(mockSetDmxChannelsForTransition).toHaveBeenCalled(); // Check if DMX values are updated

    // Simulate completion
     await act(async () => {
      vi.advanceTimersByTime(100); // Advance beyond duration
    });
    expect(mockClearTransitionState).toHaveBeenCalled();


    // Optional: Test cancellation if isTransitioning becomes false mid-animation
    (useStore as any).getState = () => ({
      ...initialMockState,
      isTransitioning: true,
      transitionStartTime: Date.now(),
      currentTransitionFrame: 12345, // Simulate an active frame
    });
    rerender(<App />);

    (useStore as any).getState = () => ({
       ...initialMockState,
      isTransitioning: false, // Stop the transition
      currentTransitionFrame: 12345,
    });
    rerender(<App />);

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(12345);
    expect(mockSetCurrentTransitionFrameId).toHaveBeenCalledWith(null);
  });
});
