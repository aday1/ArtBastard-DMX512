import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { DockingProvider } from './context/DockingContext';
import { ChromaticEnergyManipulatorProvider } from './context/ChromaticEnergyManipulatorContext';
import { useStore } from './store';
import MainPage from './pages/MainPage';
import { useBrowserMidi } from './hooks/useBrowserMidi';
import MidiDmxProcessor from './components/midi/MidiDmxProcessor';
import MidiDebugHelper from './components/midi/MidiDebugHelper';
import MidiDmxDebug from './components/midi/MidiDmxDebug';
import DebugInfo from './components/DebugInfo';
import { ThemeToggleButton } from './components/layout/ThemeToggleButton'; // Import ThemeToggleButton
import { GridOverlay } from './components/ui/GridOverlay';
import { GridControls } from './components/ui/GridControls';
import { DragDebugOverlay } from './components/ui/DragDebugOverlay';
import { GridKeyboardControls } from './components/ui/GridKeyboardControls';
import { HelpOverlay } from './components/ui/HelpOverlay';
import './utils/midiTestUtils';
import { useSceneTransitionAnimation } from './hooks/useSceneTransitionAnimation';
import ErrorBoundary from './components/ErrorBoundary';
function App() {
    // All hooks must be at the top level, outside of try-catch blocks
    const fetchInitialState = useStore((state) => state.fetchInitialState);
    // const isTransitioning = useStore((state) => state.isTransitioning); // Moved to useSceneTransitionAnimation
    // const currentTransitionFrame = useStore((state) => state.currentTransitionFrame); // Moved to useSceneTransitionAnimation
    // const setCurrentTransitionFrameId = useStore((state) => state.setCurrentTransitionFrameId); // Moved to useSceneTransitionAnimation
    const { browserInputs, connectBrowserInput, refreshDevices, isSupported } = useBrowserMidi();
    // Initialize Scene Transition Animation Hook
    useSceneTransitionAnimation();
    // Auto-connect to MIDI devices
    useEffect(() => {
        if (isSupported) {
            // Attempt to connect to any initially found devices
            if (browserInputs.length > 0) {
                browserInputs.forEach(input => {
                    // Assuming connectBrowserInput handles cases where a device might already be connected
                    // or an attempt is in progress.
                    connectBrowserInput(input.id);
                });
            }
            else {
                console.log('[App] MIDI supported, but no inputs found initially. Will check periodically.');
            }
            // Periodically refresh devices to detect new connections
            const intervalId = setInterval(() => {
                refreshDevices();
            }, 10000); // Every 10 seconds
            // Cleanup function
            return () => {
                clearInterval(intervalId);
            };
        }
        else {
            console.log('[App] WebMIDI API not supported by this browser.');
        }
    }, [connectBrowserInput, refreshDevices, isSupported, browserInputs]);
    useEffect(() => {
        // Fetch initial state
        fetchInitialState();
    }, [fetchInitialState]);
    // Scene Transition Animation is handled by useSceneTransitionAnimation hook
    return (_jsx(ThemeProvider, { children: _jsx(ChromaticEnergyManipulatorProvider, { children: _jsx(SocketProvider, { children: _jsxs(DockingProvider, { children: [_jsxs("div", { style: { display: 'none' }, children: [_jsx(MidiDmxProcessor, {}), _jsx(MidiDebugHelper, {}), _jsx(MidiDmxDebug, {})] }), "            ", _jsx(GridOverlay, {}), _jsx(GridControls, {}), "            ", _jsx(GridKeyboardControls, {}), _jsx(DragDebugOverlay, {}), _jsx(HelpOverlay, {}), _jsx(ThemeToggleButton, {}), _jsx(DebugInfo, { position: "top-right" }), _jsx(ErrorBoundary, { children: _jsx(Layout, { children: _jsx(MainPage, {}) }) })] }) }) }) }));
}
export default App;
