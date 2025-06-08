import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { usePinning } from '../context/PinningContext';
import { useStore } from '../store';
import { DmxControlPanel } from '../components/dmx/DmxControlPanel';
import { MasterFader } from '../components/dmx/MasterFader';
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
import { PinButton } from '../components/ui/PinButton';
import styles from './MainPage.module.scss';
const MainPage = () => {
    const { theme } = useTheme();
    const socketContext = useSocket();
    const connected = socketContext.connected;
    const { isPinned, togglePin, pinAllComponents, unpinAllComponents } = usePinning();
    // Check if any components are unpinned to adjust layout
    const hasUnpinnedComponents = ['master-fader', 'scene-auto', 'chromatic-energy-manipulator', 'scene-quick-launch', 'quick-capture']
        .some(id => !isPinned(id));
    const { addNotification, saveScene } = useStore(state => ({
        addNotification: state.addNotification,
        saveScene: state.saveScene
    }));
    const [currentView, setCurrentView] = useState('main');
    const [isAutoSceneMinimized, setIsAutoSceneMinimized] = useState(false);
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
        return (_jsxs("div", { className: styles.content, children: [!connected && (_jsxs("div", { className: styles.connectionWarning, children: [_jsx("i", { className: "fas fa-exclamation-triangle" }), "Connection lost - attempting to reconnect..."] })), _jsxs("div", { className: styles.viewContainer, children: ["          ", currentView === 'main' && (_jsxs("div", { className: styles.mainLayout, children: [_jsxs("div", { className: styles.globalPinControls, children: [_jsxs("button", { className: styles.globalPinButton, onClick: pinAllComponents, title: "Pin all components to viewport overlay", children: [_jsx("i", { className: "fas fa-thumbtack" }), "Pin All"] }), _jsxs("button", { className: styles.globalPinButton, onClick: unpinAllComponents, title: "Unpin all components from viewport overlay", children: [_jsx("i", { className: "fas fa-thumb-tack" }), "Unpin All"] }), _jsxs("span", { className: styles.pinnedCount, children: [['master-fader', 'scene-auto', 'chromatic-energy-manipulator', 'scene-quick-launch', 'quick-capture']
                                                    .filter(id => isPinned(id)).length, " of 5 pinned"] })] }), "              ", _jsxs("div", { className: `${styles.fixedQuickCapture} ${isPinned('quick-capture') ? styles.pinned : styles.unpinned}`, children: [_jsx(PinButton, { componentId: "quick-capture", size: "small", showLabel: false }), _jsxs("button", { className: styles.quickSaveButton, onClick: handleQuickSave, title: "Quick save current DMX state with timestamp", children: [_jsx("i", { className: "fas fa-bolt" }), theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'] })] }), _jsxs("div", { className: `${styles.centralContent} ${hasUnpinnedComponents ? styles.hasUnpinned : ''}`, children: [_jsx(DmxControlPanel, {}), _jsx(MidiMonitor, {}), _jsx(OscMonitor, {}), hasUnpinnedComponents && (_jsxs("div", { className: styles.unpinnedContainer, children: [_jsx("h3", { children: "Unpinned Controls" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '1rem' }, children: [!isPinned('quick-capture') && (_jsxs("div", { className: `${styles.fixedQuickCapture} ${styles.unpinned}`, children: [_jsx(PinButton, { componentId: "quick-capture", size: "small", showLabel: false }), _jsxs("button", { className: styles.quickSaveButton, onClick: handleQuickSave, title: "Quick save current DMX state with timestamp", children: [_jsx("i", { className: "fas fa-bolt" }), theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'] })] })), !isPinned('master-fader') && (_jsxs("div", { className: `${styles.bottomCenterDock} ${styles.unpinned}`, children: [_jsx(PinButton, { componentId: "master-fader", size: "small", showLabel: false }), _jsx(MasterFader, { isDockable: false })] })), !isPinned('scene-auto') && (_jsxs("div", { className: `${styles.bottomLeftDock} ${styles.unpinned}`, children: [_jsx(PinButton, { componentId: "scene-auto", size: "small", showLabel: false }), _jsx(AutoSceneControlMini, { isDockable: false })] })), !isPinned('chromatic-energy-manipulator') && (_jsxs("div", { className: `${styles.leftMiddleDock} ${styles.unpinned}`, children: [_jsx(PinButton, { componentId: "chromatic-energy-manipulator", size: "small", showLabel: false }), _jsx(ChromaticEnergyManipulatorMini, { isDockable: false })] })), !isPinned('scene-quick-launch') && (_jsxs("div", { className: `${styles.rightMiddleDock} ${styles.unpinned}`, children: [_jsx(PinButton, { componentId: "scene-quick-launch", size: "small", showLabel: false }), _jsx(SceneQuickLaunch, { isDockable: false })] }))] })] }))] }), "              ", _jsxs("div", { className: styles.dockedElements, children: [isPinned('chromatic-energy-manipulator') && (_jsxs("div", { className: `${styles.leftMiddleDock} ${styles.pinned}`, children: [_jsx(PinButton, { componentId: "chromatic-energy-manipulator", size: "small", showLabel: false }), _jsx(ChromaticEnergyManipulatorMini, { isDockable: false })] })), isPinned('scene-quick-launch') && (_jsxs("div", { className: `${styles.rightMiddleDock} ${styles.pinned}`, children: [_jsx(PinButton, { componentId: "scene-quick-launch", size: "small", showLabel: false }), _jsx(SceneQuickLaunch, { isDockable: false })] })), isPinned('scene-auto') && (_jsxs("div", { className: `${styles.bottomLeftDock} ${styles.pinned}`, children: [_jsx(PinButton, { componentId: "scene-auto", size: "small", showLabel: false }), _jsx(AutoSceneControlMini, { isDockable: false })] })), isPinned('master-fader') && (_jsxs("div", { className: `${styles.bottomCenterDock} ${styles.pinned}`, children: [_jsx(PinButton, { componentId: "master-fader", size: "small", showLabel: false }), _jsx(MasterFader, { isDockable: false })] }))] }), isPinned('quick-capture') && (_jsxs("div", { className: `${styles.fixedQuickCapture} ${styles.pinned}`, children: [_jsx(PinButton, { componentId: "quick-capture", size: "small", showLabel: false }), _jsxs("button", { className: styles.quickSaveButton, onClick: handleQuickSave, title: "Quick save current DMX state with timestamp", children: [_jsx("i", { className: "fas fa-bolt" }), theme === 'artsnob' ? 'Quick Capture' : 'Quick Save'] })] }))] })), currentView === 'midiOsc' && _jsx(MidiOscSetup, {}), currentView === 'fixture' && _jsx(FixtureSetup, {}), currentView === 'scenes' && (_jsxs(_Fragment, { children: [_jsx(SceneGallery, {}), _jsx(AutoSceneControl, { isMinimized: isAutoSceneMinimized, onMinimizedChange: setIsAutoSceneMinimized })] })), currentView === 'oscDebug' && _jsx(OscDebug, {}), currentView === 'audio' && _jsx(AudioControlPanel, {}), currentView === 'touchosc' && _jsx(TouchOSCExporter, {}), currentView === 'misc' && _jsx(Settings, {})] })] }));
    };
    return renderContent();
};
export default MainPage;
