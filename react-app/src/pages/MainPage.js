import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useStore } from '../store';
import { DmxControlPanel } from '../components/dmx/DmxControlPanel';
import { MasterFader } from '../components/dmx/MasterFader';
import { MidiOscSetup } from '../components/midi/MidiOscSetup';
import { MidiMonitor } from '../components/midi/MidiMonitor';
import { OscMonitor } from '../components/osc/OscMonitor';
import { MidiClock } from '../components/midi/MidiClock'; // Added MidiClock import
import { OscDebug } from '../components/osc/OscDebug';
import { TouchOSCExporter } from '../components/osc/TouchOSCExporter';
import { AudioControlPanel } from '../components/audio/AudioControlPanel';
import { SceneGallery } from '../components/scenes/SceneGallery';
import { FixtureSetup } from '../components/fixtures/FixtureSetup';
import { Settings } from '../components/settings/Settings';
import styles from './MainPage.module.scss';
const MainPage = () => {
    const { theme } = useTheme();
    const socketContext = useSocket();
    const connected = socketContext.connected;
    const addNotification = useStore(state => state.addNotification);
    const [currentView, setCurrentView] = useState('main');
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
        return (_jsxs("div", { className: styles.content, children: [!connected && (_jsxs("div", { className: styles.connectionWarning, children: [_jsx("i", { className: "fas fa-exclamation-triangle" }), "Connection lost - attempting to reconnect..."] })), _jsxs("div", { className: styles.viewContainer, children: [currentView === 'main' && (_jsxs(_Fragment, { children: [_jsx(MasterFader, {}), _jsx(DmxControlPanel, {}), _jsx(MidiMonitor, {}), _jsx(OscMonitor, {}), _jsx(MidiClock, {}), " "] })), currentView === 'midiOsc' && _jsx(MidiOscSetup, {}), currentView === 'fixture' && _jsx(FixtureSetup, {}), currentView === 'scenes' && _jsx(SceneGallery, {}), currentView === 'oscDebug' && _jsx(OscDebug, {}), currentView === 'audio' && _jsx(AudioControlPanel, {}), currentView === 'touchosc' && _jsx(TouchOSCExporter, {}), currentView === 'misc' && _jsx(Settings, {})] })] }));
    };
    return renderContent();
};
export default MainPage;
