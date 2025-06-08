import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { exportToToscFile } from '../utils/touchoscExporter';
import styles from './Pages.module.scss';
const RemoteControlPage = () => {
    const { allFixtures, masterSliders, fixtureLayout } = useStore(state => ({
        allFixtures: state.fixtures,
        masterSliders: state.masterSliders,
        fixtureLayout: state.fixtureLayout,
    }));
    // OSC Configuration state
    const [oscSettings, setOscSettings] = useState({
        serverPort: 8080,
        clientPort: 9000,
        serverIP: window.location.hostname,
        clientIP: '',
        autoDiscovery: true,
        enabled: true
    });
    // TouchOSC Export settings
    const [exportSettings, setExportSettings] = useState({
        resolution: 'ipad_pro_2019_portrait',
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false
    });
    const [isExporting, setIsExporting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [connectedClients, setConnectedClients] = useState([]);
    // Network discovery for local IP addresses
    useEffect(() => {
        const getLocalIP = async () => {
            try {
                // Simple method to get local network IP
                const hostname = window.location.hostname;
                if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                    setOscSettings(prev => ({ ...prev, serverIP: hostname }));
                }
            }
            catch (error) {
                console.log('Could not determine local IP, using hostname');
            }
        };
        getLocalIP();
    }, []);
    // Handle OSC setting changes
    const handleOscSettingChange = (key, value) => {
        setOscSettings(prev => ({ ...prev, [key]: value }));
    };
    // Handle export setting changes
    const handleExportSettingChange = (key, value) => {
        setExportSettings(prev => ({ ...prev, [key]: value }));
    };
    // Export TouchOSC layout
    const handleExportLayout = async () => {
        try {
            setIsExporting(true);
            const result = await exportToToscFile(exportSettings, fixtureLayout, masterSliders, allFixtures, 'ArtBastard_TouchOSC.tosc');
            if (result.success) {
                alert('TouchOSC layout exported successfully! Load the .tosc file in your TouchOSC app.');
            }
            else {
                alert(`Export failed: ${result.message}`);
            }
        }
        catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            setIsExporting(false);
        }
    };
    // Mock functions for demonstration - these would connect to actual OSC server
    const handleStartOSC = () => {
        setConnectionStatus('connecting');
        // Simulate connection
        setTimeout(() => {
            setConnectionStatus('connected');
            setConnectedClients(['TouchOSC Device 1 (192.168.1.100)']);
        }, 1500);
    };
    const handleStopOSC = () => {
        setConnectionStatus('disconnected');
        setConnectedClients([]);
    };
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Remote Control - TouchOSC Interface" }), _jsx("p", { children: "Configure and manage wireless OSC control interfaces" })] }), _jsx("div", { className: styles.pageContent, children: _jsxs("div", { className: styles.remoteSection, children: [_jsxs("div", { className: styles.configPanel, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-server" }), "OSC Server Configuration"] }), _jsxs("div", { className: styles.configGrid, children: [_jsx("div", { className: styles.configGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-globe" }), "Server IP Address", _jsx("input", { type: "text", value: oscSettings.serverIP, onChange: (e) => handleOscSettingChange('serverIP', e.target.value), placeholder: "192.168.1.100" }), _jsx("span", { className: styles.configHint, children: "IP address that clients will connect to" })] }) }), _jsx("div", { className: styles.configGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-ethernet" }), "Server Port", _jsx("input", { type: "number", value: oscSettings.serverPort, onChange: (e) => handleOscSettingChange('serverPort', parseInt(e.target.value)), min: "1024", max: "65535" }), _jsx("span", { className: styles.configHint, children: "Port for receiving OSC messages" })] }) }), _jsx("div", { className: styles.configGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-broadcast-tower" }), "Client Port", _jsx("input", { type: "number", value: oscSettings.clientPort, onChange: (e) => handleOscSettingChange('clientPort', parseInt(e.target.value)), min: "1024", max: "65535" }), _jsx("span", { className: styles.configHint, children: "Port for sending feedback to clients" })] }) }), _jsx("div", { className: styles.configGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: oscSettings.autoDiscovery, onChange: (e) => handleOscSettingChange('autoDiscovery', e.target.checked) }), _jsx("i", { className: "fas fa-search" }), "Auto-discovery", _jsx("span", { className: styles.configHint, children: "Automatically discover TouchOSC clients" })] }) })] })] }), _jsxs("div", { className: styles.connectionPanel, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-wifi" }), "Connection Status"] }), _jsxs("div", { className: styles.connectionInfo, children: [_jsxs("div", { className: styles.statusRow, children: [_jsx("span", { children: "OSC Server:" }), _jsxs("span", { className: `${styles.status} ${styles[connectionStatus]}`, children: [connectionStatus === 'connected' && _jsx("i", { className: "fas fa-check-circle" }), connectionStatus === 'connecting' && _jsx("i", { className: "fas fa-spinner fa-spin" }), connectionStatus === 'disconnected' && _jsx("i", { className: "fas fa-times-circle" }), connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)] })] }), _jsxs("div", { className: styles.statusRow, children: [_jsx("span", { children: "Listening on:" }), _jsxs("span", { className: styles.address, children: [oscSettings.serverIP, ":", oscSettings.serverPort] })] }), _jsxs("div", { className: styles.statusRow, children: [_jsx("span", { children: "Connected Clients:" }), _jsx("span", { className: styles.clientCount, children: connectedClients.length })] })] }), connectedClients.length > 0 && (_jsxs("div", { className: styles.clientsList, children: [_jsx("h4", { children: "Active Connections:" }), connectedClients.map((client, index) => (_jsxs("div", { className: styles.clientItem, children: [_jsx("i", { className: "fas fa-mobile-alt" }), client] }, index)))] })), _jsx("div", { className: styles.connectionControls, children: connectionStatus === 'disconnected' ? (_jsxs("button", { className: styles.startButton, onClick: handleStartOSC, children: [_jsx("i", { className: "fas fa-play" }), "Start OSC Server"] })) : (_jsxs("button", { className: styles.stopButton, onClick: handleStopOSC, children: [_jsx("i", { className: "fas fa-stop" }), "Stop OSC Server"] })) })] }), _jsxs("div", { className: styles.layoutPanel, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-mobile-alt" }), "TouchOSC Layout Export"] }), _jsx("div", { className: styles.exportSettings, children: _jsxs("div", { className: styles.settingsGrid, children: [_jsx("div", { className: styles.settingGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-desktop" }), "Device Resolution", _jsxs("select", { value: exportSettings.resolution, onChange: (e) => handleExportSettingChange('resolution', e.target.value), children: [_jsx("option", { value: "phone_portrait", children: "Phone Portrait (720\u00D71280)" }), _jsx("option", { value: "tablet_portrait", children: "Tablet Portrait (1024\u00D71366)" }), _jsx("option", { value: "ipad_pro_2019_portrait", children: "iPad Pro Portrait (1668\u00D72420)" }), _jsx("option", { value: "ipad_pro_2019_landscape", children: "iPad Pro Landscape (2420\u00D71668)" }), _jsx("option", { value: "samsung_s21_specified_portrait", children: "Samsung S21 Portrait (1668\u00D72420)" }), _jsx("option", { value: "samsung_s21_specified_landscape", children: "Samsung S21 Landscape (2420\u00D71668)" })] })] }) }), _jsx("div", { className: styles.settingGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: exportSettings.includeFixtureControls, onChange: (e) => handleExportSettingChange('includeFixtureControls', e.target.checked) }), _jsx("i", { className: "fas fa-lightbulb" }), "Include Fixture Controls"] }) }), _jsx("div", { className: styles.settingGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: exportSettings.includeMasterSliders, onChange: (e) => handleExportSettingChange('includeMasterSliders', e.target.checked) }), _jsx("i", { className: "fas fa-sliders-h" }), "Include Master Sliders"] }) }), _jsx("div", { className: styles.settingGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: exportSettings.includeAllDmxChannels, onChange: (e) => handleExportSettingChange('includeAllDmxChannels', e.target.checked) }), _jsx("i", { className: "fas fa-th" }), "Include All 512 DMX Channels"] }) })] }) }), _jsxs("div", { className: styles.exportStats, children: [_jsxs("div", { className: styles.stat, children: [_jsx("span", { children: "Placed Fixtures:" }), _jsx("span", { children: fixtureLayout.length })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { children: "Master Sliders:" }), _jsx("span", { children: masterSliders.length })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { children: "Available Fixture Types:" }), _jsx("span", { children: allFixtures.length })] })] }), _jsxs("div", { className: styles.exportActions, children: [_jsx("button", { className: styles.exportButton, onClick: handleExportLayout, disabled: isExporting, children: isExporting ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-spinner fa-spin" }), "Exporting..."] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "fas fa-download" }), "Export TouchOSC Layout"] })) }), _jsx("div", { className: styles.exportInfo, children: _jsxs("p", { children: [_jsx("i", { className: "fas fa-info-circle" }), "The exported .tosc file can be opened directly in TouchOSC and edited further if needed."] }) })] })] }), _jsxs("div", { className: styles.instructionsPanel, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-book" }), "Setup Instructions"] }), _jsxs("div", { className: styles.setupSteps, children: [_jsxs("div", { className: styles.step, children: [_jsx("div", { className: styles.stepNumber, children: "1" }), _jsxs("div", { className: styles.stepContent, children: [_jsx("h4", { children: "Install TouchOSC" }), _jsx("p", { children: "Download TouchOSC from the App Store (iOS) or Google Play (Android)" })] })] }), _jsxs("div", { className: styles.step, children: [_jsx("div", { className: styles.stepNumber, children: "2" }), _jsxs("div", { className: styles.stepContent, children: [_jsx("h4", { children: "Connect to Network" }), _jsx("p", { children: "Ensure your device is connected to the same network as this controller" })] })] }), _jsxs("div", { className: styles.step, children: [_jsx("div", { className: styles.stepNumber, children: "3" }), _jsxs("div", { className: styles.stepContent, children: [_jsx("h4", { children: "Configure OSC Settings" }), _jsxs("p", { children: ["In TouchOSC, set Host to ", _jsx("code", { children: oscSettings.serverIP }), " and Port to ", _jsx("code", { children: oscSettings.serverPort })] })] })] }), _jsxs("div", { className: styles.step, children: [_jsx("div", { className: styles.stepNumber, children: "4" }), _jsxs("div", { className: styles.stepContent, children: [_jsx("h4", { children: "Load Layout" }), _jsx("p", { children: "Export and load the custom .tosc layout file using the button above" })] })] })] })] })] }) })] }));
};
export default RemoteControlPage;
