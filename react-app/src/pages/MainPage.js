import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useStore } from '../store';
import { DmxControlPanel } from '../components/dmx/DmxControlPanel';
import { MasterFader } from '../components/dmx/MasterFader';
import { DMXChannelGrid } from '../components/dmx/DMXChannelGrid';
import { MidiOscSetup } from '../components/midi/MidiOscSetup';
import { MidiMonitor } from '../components/midi/MidiMonitor';
import { OscMonitor } from '../components/osc/OscMonitor';
import { SceneQuickLaunch } from '../components/scenes/SceneQuickLaunch';
import { AutoSceneControlMini } from '../components/scenes/AutoSceneControlMini';
// Use the fixtures mini version for the main page
import ChromaticEnergyManipulatorMini from '../components/fixtures/ChromaticEnergyManipulatorMini';
import { OscDebug } from '../components/osc/OscDebug';
import { TouchOSCExporter } from '../components/osc/TouchOSCExporter';
import { AudioControlPanel } from '../components/audio/AudioControlPanel';
import { SceneGallery } from '../components/scenes/SceneGallery';
import { AutoSceneControl } from '../components/scenes/AutoSceneControl';
import { FixtureSetup } from '../components/fixtures/FixtureSetup';
import { Settings } from '../components/settings/Settings';
import styles from './MainPage.module.scss';
const MainPage = () => {
    const { theme } = useTheme();
    const socketContext = useSocket();
    const connected = socketContext.connected;
    const { addNotification, saveScene } = useStore(state => ({
        addNotification: state.addNotification,
        saveScene: state.saveScene
    }));
    const [currentView, setCurrentView] = useState('main');
    const [isAutoSceneMinimized, setIsAutoSceneMinimized] = useState(false);
    const [showDMXChannelGrid, setShowDMXChannelGrid] = useState(false);
    const handleQuickSave = () => {
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
        const quickName = `Quick_${timestamp}`;
        saveScene(quickName, `/scene/${quickName.toLowerCase()}`);
        addNotification({
            message: `Quick saved as "${quickName}"`,
            type: 'success',
            priority: 'normal'
        });
    };
    // Handle view changes from navbar
    useEffect(() => {
        const handleViewChange = (event) => {
            const customEvent = event;
            setCurrentView(customEvent.detail.view);
        };
        window.addEventListener('changeView', handleViewChange);
        return () => window.removeEventListener('changeView', handleViewChange);
    }, []);
    // Handle connection state changes
    useEffect(() => {
        if (!connected) {
            addNotification({
                message: 'Lost connection to server - some features may be limited',
                type: 'error',
                priority: 'high'
            });
        }
    }, [connected, addNotification]);
    const renderContent = () => {
        return (_jsxs("div", { className: styles.content, children: [!connected && (_jsxs("div", { className: styles.connectionWarning, children: [_jsx("i", { className: "fas fa-exclamation-triangle" }), "Connection lost - attempting to reconnect..."] })), _jsxs("div", { className: styles.viewContainer, children: [currentView === 'main' && (_jsxs(_Fragment, { children: ["              ", _jsxs("div", { className: styles.mainControls, children: [_jsxs("button", { className: styles.quickSaveButton, onClick: handleQuickSave, title: "Quick save current DMX state with timestamp", children: [_jsx("i", { className: "fas fa-bolt" }), theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'] }), _jsxs("button", { className: styles.dmxChannelGridButton, onClick: () => setShowDMXChannelGrid(!showDMXChannelGrid), title: "Open DMX Channel Grid", children: [_jsx("i", { className: "fas fa-th" }), "DMX Grid"] })] }), _jsx(MasterFader, {}), _jsx(DmxControlPanel, {}), "              ", _jsx(MidiMonitor, {}), _jsx(OscMonitor, {}), _jsx(SceneQuickLaunch, {}), "              ", _jsx(AutoSceneControlMini, {}), _jsx(ChromaticEnergyManipulatorMini, {}), showDMXChannelGrid && (_jsx(DMXChannelGrid, { onChannelSelect: (channel) => console.log('Selected channel:', channel), isDockable: true }))] })), currentView === 'midiOsc' && _jsx(MidiOscSetup, {}), currentView === 'fixture' && _jsx(FixtureSetup, {}), currentView === 'scenes' && (_jsxs(_Fragment, { children: [_jsx(SceneGallery, {}), _jsx(AutoSceneControl, { isMinimized: isAutoSceneMinimized, onMinimizedChange: setIsAutoSceneMinimized })] })), currentView === 'oscDebug' && _jsx(OscDebug, {}), currentView === 'audio' && _jsx(AudioControlPanel, {}), currentView === 'touchosc' && _jsx(TouchOSCExporter, {}), currentView === 'misc' && _jsx(Settings, {})] })] }));
    };
    return renderContent();
};
export default MainPage;
