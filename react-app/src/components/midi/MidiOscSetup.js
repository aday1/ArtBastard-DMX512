import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useBrowserMidi } from '../../hooks/useBrowserMidi';
import { MidiVisualizer } from './MidiVisualizer';
import styles from './MidiOscSetup.module.scss';
export const MidiOscSetup = () => {
    const { theme } = useTheme();
    const { socket, connected } = useSocket();
    const { isSupported: browserMidiSupported, error: browserMidiError, browserInputs, activeBrowserInputs, connectBrowserInput, disconnectBrowserInput, refreshDevices } = useBrowserMidi();
    const [midiInterfaces, setMidiInterfaces] = useState([]);
    const [activeInterfaces, setActiveInterfaces] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [oscConfig, setOscConfig] = useState({
        host: '127.0.0.1',
        port: 57121,
        sendEnabled: true,
        sendHost: '127.0.0.1',
        sendPort: 57120
    });
    // Add OSC status state
    const [oscReceiveStatus, setOscReceiveStatus] = useState('disconnected');
    const [oscSendStatus, setOscSendStatus] = useState('disconnected');
    const midiMessages = useStore(state => state.midiMessages);
    const clearAllMidiMappings = useStore(state => state.clearAllMidiMappings);
    // Request MIDI interfaces on component mount
    useEffect(() => {
        if (socket && connected) {
            socket.emit('getMidiInterfaces');
            // Listen for MIDI interfaces
            const handleMidiInterfaces = (interfaces) => {
                setMidiInterfaces(interfaces);
                setIsRefreshing(false);
            };
            // Listen for active MIDI interfaces
            const handleActiveInterfaces = (active) => {
                setActiveInterfaces(active);
            };
            // Listen for OSC status updates
            const handleOscStatus = (status) => {
                if (status.status === 'connected') {
                    setOscReceiveStatus('connected');
                }
                else if (status.status === 'error') {
                    setOscReceiveStatus('error');
                }
                else {
                    setOscReceiveStatus('disconnected');
                }
            };
            const handleOscSendStatus = (status) => {
                if (status.status === 'connected') {
                    setOscSendStatus('connected');
                }
                else if (status.status === 'error') {
                    setOscSendStatus('error');
                }
                else {
                    setOscSendStatus('disconnected');
                }
            };
            socket.on('midiInterfaces', handleMidiInterfaces);
            socket.on('midiInputsActive', handleActiveInterfaces);
            socket.on('oscStatus', handleOscStatus);
            socket.on('oscSendStatus', handleOscSendStatus);
            return () => {
                socket.off('midiInterfaces', handleMidiInterfaces);
                socket.off('midiInputsActive', handleActiveInterfaces);
                socket.off('oscStatus', handleOscStatus);
                socket.off('oscSendStatus', handleOscSendStatus);
            };
        }
    }, [socket, connected]);
    // Refresh all MIDI interfaces
    const handleRefreshMidi = () => {
        if (socket && connected) {
            setIsRefreshing(true);
            socket.emit('getMidiInterfaces');
        }
        // Also refresh browser MIDI devices
        if (browserMidiSupported) {
            refreshDevices();
        }
    };
    // Connect to server MIDI interface
    const handleConnectMidi = (interfaceName) => {
        if (socket && connected) {
            socket.emit('selectMidiInterface', interfaceName);
        }
    };
    // Disconnect from server MIDI interface
    const handleDisconnectMidi = (interfaceName) => {
        if (socket && connected) {
            socket.emit('disconnectMidiInterface', interfaceName);
        }
    };
    // Save OSC configuration
    const handleSaveOscConfig = () => {
        if (socket && connected) {
            socket.emit('saveOscConfig', oscConfig);
            useStore.getState().addNotification({
                message: 'OSC configuration saved',
                type: 'success',
                priority: 'normal'
            });
        }
    };
    // Clear all MIDI messages
    const handleClearMidiMessages = () => {
        useStore.setState({ midiMessages: [] });
    };
    // Forget all MIDI mappings with confirmation
    const handleForgetAllMappings = () => {
        if (window.confirm('Are you sure you want to forget all MIDI mappings? This cannot be undone.')) {
            clearAllMidiMappings();
        }
    };
    return (_jsxs("div", { className: styles.midiOscSetup, children: [_jsxs("h2", { className: styles.sectionTitle, children: [theme === 'artsnob' && 'MIDI/OSC Atelier: The Digital Orchestration', theme === 'standard' && 'MIDI/OSC Setup', theme === 'minimal' && 'MIDI/OSC'] }), _jsxs("div", { className: styles.connectedDevicesSummary, children: ["Connected MIDI Devices: Server (", _jsx("b", { children: activeInterfaces.length }), "), Browser (", _jsx("b", { children: activeBrowserInputs.size }), ")"] }), _jsxs("div", { className: styles.setupGrid, children: [_jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { title: "MIDI interfaces connected to the server - useful for external controllers and hardware devices", children: [theme === 'artsnob' && 'Server MIDI Interfaces: The Distant Muses', theme === 'standard' && 'Server MIDI Interfaces', theme === 'minimal' && 'Server MIDI'] }) }), _jsxs("div", { className: styles.cardBody, children: [_jsx("p", { className: styles.cardDescription, children: "Server MIDI interfaces are external MIDI devices connected to the computer running ArtBastard. These provide stable connections for professional MIDI controllers and hardware." }), _jsx("div", { className: styles.interfaceList, children: midiInterfaces.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-music" }), _jsx("p", { children: "No server MIDI interfaces detected" }), _jsxs("button", { className: styles.refreshButton, onClick: handleRefreshMidi, disabled: isRefreshing, title: "Scan for new MIDI devices connected to the server", children: [isRefreshing ? (_jsx("i", { className: "fas fa-spinner fa-spin" })) : (_jsx("i", { className: "fas fa-sync-alt" })), "Refresh"] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.interfaceHeader, children: [_jsx("span", { className: styles.interfaceName, children: "Interface Name" }), _jsx("span", { className: styles.interfaceStatus, children: "Status" }), _jsx("span", { className: styles.interfaceActions, children: "Actions" })] }), midiInterfaces.map((interfaceName) => (_jsxs("div", { className: styles.interfaceItem, children: [_jsx("span", { className: styles.interfaceName, children: interfaceName }), _jsx("span", { className: `${styles.interfaceStatus} ${activeInterfaces.includes(interfaceName) ? styles.active : ''}`, children: activeInterfaces.includes(interfaceName) ? 'Connected' : 'Disconnected' }), _jsx("div", { className: styles.interfaceActions, children: activeInterfaces.includes(interfaceName) ? (_jsxs("button", { className: `${styles.actionButton} ${styles.disconnectButton}`, onClick: () => handleDisconnectMidi(interfaceName), title: `Disconnect from ${interfaceName} - MIDI data will stop flowing from this device`, children: [_jsx("i", { className: "fas fa-unlink" }), theme !== 'minimal' && 'Disconnect'] })) : (_jsxs("button", { className: `${styles.actionButton} ${styles.connectButton}`, onClick: () => handleConnectMidi(interfaceName), title: `Connect to ${interfaceName} - Enable MIDI data flow from this device`, children: [_jsx("i", { className: "fas fa-link" }), theme !== 'minimal' && 'Connect'] })) })] }, interfaceName))), _jsxs("button", { className: styles.refreshButton, onClick: handleRefreshMidi, disabled: isRefreshing, title: "Scan for new MIDI devices connected to the server", children: [isRefreshing ? (_jsx("i", { className: "fas fa-spinner fa-spin" })) : (_jsx("i", { className: "fas fa-sync-alt" })), "Refresh"] })] })) })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { title: "MIDI devices accessible through your web browser - requires Chrome/Edge and may have limited functionality", children: [theme === 'artsnob' && 'Browser MIDI Interfaces: The Local Orchestrators', theme === 'standard' && 'Browser MIDI Devices', theme === 'minimal' && 'Browser MIDI'] }) }), _jsxs("div", { className: styles.cardBody, children: [_jsx("p", { className: styles.cardDescription, children: "Browser MIDI uses the Web MIDI API to access devices directly in your browser. Requires Chrome or Edge browser and may have limitations compared to server interfaces." }), _jsx("div", { className: styles.interfaceList, children: !browserMidiSupported ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-exclamation-triangle" }), _jsx("p", { children: "Web MIDI API is not supported in this browser." }), _jsx("p", { className: styles.browserMidiError, children: browserMidiError || 'Try using Chrome or Edge instead.' })] })) : browserInputs.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("i", { className: "fas fa-music" }), _jsx("p", { children: "No browser MIDI devices detected" }), _jsxs("button", { className: styles.refreshButton, onClick: refreshDevices, disabled: isRefreshing, title: "Scan for MIDI devices accessible in your browser", children: [isRefreshing ? (_jsx("i", { className: "fas fa-spinner fa-spin" })) : (_jsx("i", { className: "fas fa-sync-alt" })), "Refresh"] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.interfaceHeader, children: [_jsx("span", { className: styles.interfaceName, children: "Device Name" }), _jsx("span", { className: styles.interfaceStatus, children: "Status" }), _jsx("span", { className: styles.interfaceActions, children: "Actions" })] }), browserInputs.map((input) => (_jsxs("div", { className: styles.interfaceItem, children: [_jsxs("span", { className: styles.interfaceName, children: [input.name, _jsx("span", { className: styles.interfaceManufacturer, children: input.manufacturer })] }), _jsx("span", { className: `${styles.interfaceStatus} ${activeBrowserInputs.has(input.id) ? styles.active : ''}`, children: activeBrowserInputs.has(input.id) ? 'Connected' : 'Disconnected' }), _jsx("div", { className: styles.interfaceActions, children: activeBrowserInputs.has(input.id) ? (_jsxs("button", { className: `${styles.actionButton} ${styles.disconnectButton}`, onClick: () => disconnectBrowserInput(input.id), title: `Disconnect from ${input.name} - Browser MIDI data will stop flowing`, children: [_jsx("i", { className: "fas fa-unlink" }), theme !== 'minimal' && 'Disconnect'] })) : (_jsxs("button", { className: `${styles.actionButton} ${styles.connectButton}`, onClick: () => connectBrowserInput(input.id), title: `Connect to ${input.name} - Enable browser MIDI data flow`, children: [_jsx("i", { className: "fas fa-link" }), theme !== 'minimal' && 'Connect'] })) })] }, input.id))), _jsxs("button", { className: styles.refreshButton, onClick: refreshDevices, disabled: isRefreshing, title: "Scan for MIDI devices accessible in your browser", children: [isRefreshing ? (_jsx("i", { className: "fas fa-spinner fa-spin" })) : (_jsx("i", { className: "fas fa-sync-alt" })), "Refresh"] })] })) })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { title: "Open Sound Control - network protocol for real-time audio/visual control between devices and applications", children: [theme === 'artsnob' && 'OSC Configuration: Network Dialogue', theme === 'standard' && 'OSC Configuration', theme === 'minimal' && 'OSC'] }) }), "          ", _jsxs("div", { className: styles.cardBody, children: [_jsx("p", { className: styles.cardDescription, children: "OSC (Open Sound Control) enables bidirectional network communication between devices and applications. Configure both receiving and sending settings for TouchOSC integration." }), _jsx("h4", { children: "OSC Receiving (Incoming Messages)" }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "oscHost", title: "IP address where OSC messages will be received. Use 127.0.0.1 for local connections or your network IP for remote devices", children: "Receive Host Address:" }), _jsx("input", { type: "text", id: "oscHost", value: oscConfig.host, onChange: (e) => setOscConfig({ ...oscConfig, host: e.target.value }), placeholder: "127.0.0.1", title: "Enter the IP address for OSC communication. 127.0.0.1 for local apps, your LAN IP for network devices" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "oscPort", title: "Network port number for receiving OSC messages. Common values: 57121 (default), 8000, 9000", children: "Receive Port:" }), _jsx("input", { type: "number", id: "oscPort", value: oscConfig.port, onChange: (e) => setOscConfig({ ...oscConfig, port: parseInt(e.target.value) }), placeholder: "57121", title: "Network port for receiving OSC messages. Default: 57121" })] }), _jsx("h4", { children: "OSC Sending (Outgoing Messages)" }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { htmlFor: "oscSendEnabled", title: "Enable sending OSC messages to TouchOSC interfaces for bidirectional communication", children: [_jsx("input", { type: "checkbox", id: "oscSendEnabled", checked: oscConfig.sendEnabled, onChange: (e) => setOscConfig({ ...oscConfig, sendEnabled: e.target.checked }) }), "Enable OSC Sending"] }) }), oscConfig.sendEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "oscSendHost", title: "IP address where OSC messages will be sent. Use 127.0.0.1 for local TouchOSC or the device IP for remote TouchOSC", children: "Send Host Address:" }), _jsx("input", { type: "text", id: "oscSendHost", value: oscConfig.sendHost, onChange: (e) => setOscConfig({ ...oscConfig, sendHost: e.target.value }), placeholder: "127.0.0.1", title: "Enter the IP address where OSC messages will be sent (TouchOSC device)" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "oscSendPort", title: "Network port number for sending OSC messages. TouchOSC typically uses 57120", children: "Send Port:" }), _jsx("input", { type: "number", id: "oscSendPort", value: oscConfig.sendPort, onChange: (e) => setOscConfig({ ...oscConfig, sendPort: parseInt(e.target.value) }), placeholder: "57120", title: "Network port for sending OSC messages. TouchOSC default: 57120" })] })] })), _jsxs("div", { className: styles.oscStatus, children: [_jsxs("div", { className: styles.oscStatusItem, children: [_jsx("span", { className: styles.oscStatusLabel, children: "Receive Status:" }), _jsx("span", { className: `${styles.oscStatusValue} ${styles[oscReceiveStatus]}`, children: oscReceiveStatus.charAt(0).toUpperCase() + oscReceiveStatus.slice(1) })] }), _jsxs("div", { className: styles.oscStatusItem, children: [_jsx("span", { className: styles.oscStatusLabel, children: "Send Status:" }), _jsx("span", { className: `${styles.oscStatusValue} ${styles[oscSendStatus]}`, children: oscSendStatus.charAt(0).toUpperCase() + oscSendStatus.slice(1) })] })] }), _jsxs("div", { className: styles.oscStatusSection, children: [_jsx("h4", { children: "OSC Connection Status" }), _jsxs("div", { className: styles.statusGrid, children: [_jsxs("div", { className: styles.statusItem, children: [_jsx("span", { className: styles.statusLabel, children: "Receive Port:" }), _jsxs("span", { className: `${styles.statusIndicator} ${styles[oscReceiveStatus]}`, children: [oscReceiveStatus === 'connected' && _jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-check-circle" }), " Connected"] }), oscReceiveStatus === 'disconnected' && _jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-times-circle" }), " Disconnected"] }), oscReceiveStatus === 'error' && _jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-exclamation-triangle" }), " Error"] })] })] }), oscConfig.sendEnabled && (_jsxs("div", { className: styles.statusItem, children: [_jsx("span", { className: styles.statusLabel, children: "Send Port:" }), _jsxs("span", { className: `${styles.statusIndicator} ${styles[oscSendStatus]}`, children: [oscSendStatus === 'connected' && _jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-check-circle" }), " Connected"] }), oscSendStatus === 'disconnected' && _jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-times-circle" }), " Disconnected"] }), oscSendStatus === 'error' && _jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-exclamation-triangle" }), " Error"] })] })] }))] })] }), _jsxs("button", { className: styles.saveButton, onClick: handleSaveOscConfig, title: "Save OSC configuration and restart the OSC server with new settings", children: [_jsx("i", { className: "fas fa-save" }), theme === 'artsnob' && 'Commit to Memory', theme === 'standard' && 'Save Configuration', theme === 'minimal' && 'Save'] })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { title: "MIDI Learn system - create connections between MIDI controls and DMX channels", children: [theme === 'artsnob' && 'MIDI Mappings: The Digital Correspondences', theme === 'standard' && 'MIDI Mappings', theme === 'minimal' && 'Mappings'] }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("button", { className: styles.forgetAllButton, onClick: handleForgetAllMappings, title: "Remove all MIDI mappings and reset the learn system. This cannot be undone!", children: [_jsx("i", { className: "fas fa-trash-alt" }), theme === 'artsnob' && 'Dissolve All Correspondences', theme === 'standard' && 'Remove All Mappings', theme === 'minimal' && 'Clear All'] }), _jsxs("p", { className: styles.mappingInstructions, children: [theme === 'artsnob' && 'To establish a digital correspondence, click "MIDI Learn" on any DMX channel and move a control on your MIDI device.', theme === 'standard' && 'Click "MIDI Learn" on any DMX channel and move a control on your MIDI device to create a mapping.', theme === 'minimal' && 'Use MIDI Learn on DMX channels to map controls.'] }), _jsx("p", { className: styles.mappingHint, children: "\uD83D\uDCA1 Tip: You can map knobs, faders, buttons, and even keyboard keys to control different lighting parameters." })] })] }), _jsxs("div", { className: `${styles.card} ${styles.fullWidth}`, children: [_jsxs("div", { className: styles.cardHeader, children: [_jsxs("h3", { title: "Real-time display of incoming MIDI messages from all connected devices", children: [theme === 'artsnob' && 'Incoming Messages: The Whispers of Digital Muses', theme === 'standard' && 'MIDI Messages', theme === 'minimal' && 'Messages'] }), _jsxs("button", { className: styles.clearButton, onClick: handleClearMidiMessages, title: "Clear all MIDI messages from the display", children: [_jsx("i", { className: "fas fa-eraser" }), theme !== 'minimal' && 'Clear'] })] }), _jsxs("div", { className: styles.cardBody, children: [_jsx("p", { className: styles.cardDescription, children: "Watch real-time MIDI data from your connected devices. Use this to test connections and troubleshoot MIDI mappings." }), _jsx(MidiVisualizer, {}), _jsx("div", { className: styles.midiMessages, children: midiMessages.length === 0 ? (_jsx("div", { className: styles.emptyMessages, children: _jsx("p", { children: "No MIDI messages received yet. Try pressing keys or moving controls on your MIDI device." }) })) : (midiMessages.slice(-50).map((msg, index) => (_jsxs("div", { className: styles.midiMessage, title: `${msg._type} message from ${msg.source || 'unknown source'} at ${new Date().toLocaleTimeString()}`, children: [_jsx("span", { className: styles.timestamp, children: new Date().toLocaleTimeString() }), _jsxs("span", { className: `${styles.messageType} ${styles[msg._type]} ${msg.source === 'browser' ? styles.browser : ''}`, children: [msg._type, " ", msg.source === 'browser' ? '(browser)' : ''] }), msg._type === 'noteon' || msg._type === 'noteoff' ? (_jsxs("span", { className: styles.messageContent, children: ["Ch: ", msg.channel, ", Note: ", msg.note, ", Vel: ", msg.velocity] })) : msg._type === 'cc' ? (_jsxs("span", { className: styles.messageContent, children: ["Ch: ", msg.channel, ", CC: ", msg.controller, ", Val: ", msg.value] })) : (_jsx("span", { className: styles.messageContent, children: JSON.stringify(msg) }))] }, index))).reverse()) })] })] })] })] }));
};
