import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useStore } from '../../store';
import { sendTestNoteOnMessage, sendTestCCMessage, testMidiLearnWorkflow } from '../../hooks/useMidiTestUtils';
import { exportSimpleOSCLayout } from '../../utils/simpleOscExporter';
import styles from './DebugMenu.module.scss';
export const DebugMenu = ({ position = 'top-right' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState('system');
    const [systemInfo, setSystemInfo] = useState({});
    const [oscTestAddress, setOscTestAddress] = useState('/dmx/channel/1');
    const [oscTestValue, setOscTestValue] = useState('127');
    const [dmxTestChannel, setDmxTestChannel] = useState('1');
    const [dmxTestValue, setDmxTestValue] = useState('255');
    const [touchOscGenerating, setTouchOscGenerating] = useState(false);
    const { midiMessages, midiMappings, midiLearnTarget, allFixtures, fixtureLayout, dmxChannels, setDmxChannel, debugTools } = useStore(state => ({
        midiMessages: state.midiMessages,
        midiMappings: state.midiMappings,
        midiLearnTarget: state.midiLearnTarget,
        allFixtures: state.fixtures,
        fixtureLayout: state.fixtureLayout,
        dmxChannels: state.dmxChannels,
        setDmxChannel: state.setDmxChannel,
        debugTools: state.debugTools
    }));
    const { socket, connected } = useSocket();
    useEffect(() => {
        const updateSystemInfo = () => {
            const memInfo = performance.memory || {};
            setSystemInfo({
                timestamp: new Date().toLocaleTimeString(),
                userAgent: navigator.userAgent,
                currentUrl: window.location.href,
                nodeEnv: process.env.NODE_ENV || 'unknown',
                webMidiSupported: 'navigator' in window && 'requestMIDIAccess' in navigator,
                socketIOAvailable: typeof window !== 'undefined' && 'io' in window,
                reactVersion: React.version,
                documentReadyState: document.readyState,
                windowLoaded: document.readyState === 'complete',
                errors: window.__reactErrors || [],
                memoryUsage: {
                    usedJSHeapSize: memInfo.usedJSHeapSize,
                    totalJSHeapSize: memInfo.totalJSHeapSize,
                    jsHeapSizeLimit: memInfo.jsHeapSizeLimit
                },
                performance: {
                    navigation: performance.navigation?.type,
                    timing: performance.timing ? {
                        loadEventEnd: performance.timing.loadEventEnd,
                        navigationStart: performance.timing.navigationStart
                    } : null
                }
            });
        };
        updateSystemInfo();
        const interval = setInterval(updateSystemInfo, 2000); // Listen for errors
        const errorHandler = (event) => {
            if (!window.__reactErrors) {
                window.__reactErrors = [];
            }
            window.__reactErrors.push({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.toString(),
                timestamp: new Date().toISOString()
            });
        };
        window.addEventListener('error', errorHandler);
        return () => {
            clearInterval(interval);
            window.removeEventListener('error', errorHandler);
        };
    }, [connected]); // Add connected dependency
    // OSC Test Functions
    const sendOscTestMessage = () => {
        if (!socket || !connected) {
            alert('Socket not connected!');
            return;
        }
        try {
            const message = {
                address: oscTestAddress,
                args: [{ type: 'f', value: parseFloat(oscTestValue) }]
            };
            socket.emit('oscSend', message);
            console.log('OSC test message sent:', message);
            alert(`OSC message sent to ${oscTestAddress} with value ${oscTestValue}`);
        }
        catch (error) {
            console.error('Error sending OSC message:', error);
            alert('Error sending OSC message: ' + error);
        }
    };
    const requestOscTestMessage = () => {
        if (!socket || !connected) {
            alert('Socket not connected!');
            return;
        }
        socket.emit('oscRequestTest', { address: oscTestAddress });
        console.log('OSC test message requested for:', oscTestAddress);
        alert(`OSC test message requested for ${oscTestAddress}`);
    };
    // DMX Test Functions
    const sendDmxTestMessage = () => {
        const channel = parseInt(dmxTestChannel, 10);
        const value = parseInt(dmxTestValue, 10);
        if (isNaN(channel) || channel < 1 || channel > 512) {
            alert('Invalid DMX channel! Must be 1-512');
            return;
        }
        if (isNaN(value) || value < 0 || value > 255) {
            alert('Invalid DMX value! Must be 0-255');
            return;
        }
        // Use store's setDmxChannel to update the DMX value (convert to 0-based channel)
        setDmxChannel(channel - 1, value);
        console.log(`DMX channel ${channel} set to ${value}`);
        alert(`DMX channel ${channel} set to ${value}`);
    };
    // TouchOSC Generation Functions
    const generateFromFixtures = async () => {
        setTouchOscGenerating(true);
        try {
            // Auto-generate TouchOSC layout from fixtures on 2D canvas
            const oscPages = []; // Use SimpleOSCPage type
            // Main control page with all placed fixtures
            const mainPage = {
                id: 'fixtures',
                name: 'Fixture Control',
                width: 1024,
                height: 768,
                controls: []
            };
            fixtureLayout.forEach((placedFixture, index) => {
                const fixture = allFixtures.find(f => f.id === placedFixture.fixtureId);
                if (!fixture)
                    return;
                const baseX = 50 + (index % 8) * 120;
                const baseY = 100 + Math.floor(index / 8) * 150;
                // Add intensity fader for each fixture
                mainPage.controls.push({
                    id: `fixture_${placedFixture.id}_intensity`,
                    type: 'fader',
                    name: `${fixture.name} Int`,
                    x: baseX,
                    y: baseY,
                    width: 60,
                    height: 120,
                    oscAddress: `/dmx/fixture/${placedFixture.id}/intensity`,
                    color: '#ff6600',
                    range: { min: 0, max: 255 }
                });
                // Add PAN/TILT controls if fixture supports them
                const panChannel = fixture.channels.find(ch => ch.type === 'pan');
                const tiltChannel = fixture.channels.find(ch => ch.type === 'tilt');
                if (panChannel && tiltChannel) {
                    // XY Pad for Pan/Tilt
                    mainPage.controls.push({
                        id: `fixture_${placedFixture.id}_pantilt`,
                        type: 'xypad',
                        name: `${fixture.name} P/T`,
                        x: baseX + 70,
                        y: baseY,
                        width: 80,
                        height: 80,
                        oscAddress: `/dmx/fixture/${placedFixture.id}/pantilt`,
                        color: '#0066ff'
                    });
                }
            });
            oscPages.push(mainPage);
            // All channels page
            const allChannelsPage = {
                id: 'all_channels',
                name: 'All 512 Channels',
                width: 1024,
                height: 768,
                controls: []
            };
            // Create 32 faders per row, 16 rows = 512 channels
            for (let i = 0; i < 512; i++) {
                const row = Math.floor(i / 32);
                const col = i % 32;
                allChannelsPage.controls.push({
                    id: `channel_${i + 1}`,
                    type: 'fader',
                    name: `Ch${i + 1}`,
                    x: 10 + col * 30,
                    y: 50 + row * 40,
                    width: 25,
                    height: 35,
                    oscAddress: `/dmx/channel/${i + 1}`,
                    color: dmxChannels[i] > 0 ? '#00ff00' : '#333333',
                    range: { min: 0, max: 255 }
                });
            }
            oscPages.push(allChannelsPage);
            // Export TouchOSC file using simple exporter
            const layoutToExport = {
                pages: oscPages,
                filename: 'ArtBastard_AutoGenerated.xml' // Export as .xml
            };
            await exportSimpleOSCLayout(layoutToExport);
            alert('TouchOSC layout generated successfully! (ArtBastard_AutoGenerated.xml)');
        }
        catch (error) {
            console.error('Error generating TouchOSC layout:', error);
            alert('Error generating TouchOSC layout: ' + error);
        }
        finally {
            setTouchOscGenerating(false);
        }
    };
    const generate512Channels = async () => {
        setTouchOscGenerating(true);
        try {
            const allChannelsPage = {
                id: 'all_512',
                name: 'All 512 DMX Channels',
                width: 1024,
                height: 768,
                controls: []
            };
            // Create a grid of all 512 channels
            for (let i = 0; i < 512; i++) {
                const row = Math.floor(i / 32);
                const col = i % 32;
                allChannelsPage.controls.push({
                    id: `dmx_${i + 1}`,
                    type: 'fader',
                    name: `${i + 1}`,
                    x: 10 + col * 30,
                    y: 50 + row * 40,
                    width: 25,
                    height: 35,
                    oscAddress: `/dmx/channel/${i + 1}`,
                    color: dmxChannels[i] > 0 ? '#00ff00' : '#333333',
                    range: { min: 0, max: 255 }
                });
            }
            const layoutToExport = {
                pages: [allChannelsPage],
                filename: 'DMX512_AllChannels.xml' // Export as .xml
            };
            await exportSimpleOSCLayout(layoutToExport);
            alert('512-channel TouchOSC layout generated successfully! (DMX512_AllChannels.xml)');
        }
        catch (error) {
            console.error('Error generating 512-channel layout:', error);
            alert('Error generating 512-channel layout: ' + error);
        }
        finally {
            setTouchOscGenerating(false);
        }
    };
    const positionStyles = {
        'top-left': { top: '10px', left: '10px' },
        'top-right': { top: '10px', right: '10px' },
        'bottom-left': { bottom: '10px', left: '10px' },
        'bottom-right': { bottom: '10px', right: '10px' }
    };
    const formatBytes = (bytes) => {
        if (!bytes)
            return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };
    // Don't render if debugButton is disabled in debugTools
    if (!debugTools.debugButton) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsVisible(!isVisible), className: styles.toggleButton, style: {
                    position: 'fixed',
                    ...positionStyles[position],
                    zIndex: 10000,
                }, title: "Debug Menu (Ctrl+D)", children: isVisible ? '🔧 Hide Debug' : '🔧 Debug Menu' }), isVisible && (_jsxs("div", { className: styles.debugPanel, style: {
                    position: 'fixed',
                    top: position.includes('top') ? '50px' : 'auto',
                    bottom: position.includes('bottom') ? '50px' : 'auto',
                    left: position.includes('left') ? '10px' : 'auto',
                    right: position.includes('right') ? '10px' : 'auto',
                    zIndex: 9999,
                }, children: ["          ", _jsxs("div", { className: styles.header, children: [_jsx("h3", { children: "\uD83D\uDE80 ArtBastard Debug Menu" }), _jsxs("div", { className: styles.headerControls, children: [_jsx("button", { onClick: () => setIsMinimized(!isMinimized), className: styles.minimizeButton, title: isMinimized ? "Maximize" : "Minimize", children: isMinimized ? '🔼' : '🔽' }), _jsx("button", { onClick: () => setIsVisible(false), className: styles.closeButton, children: "\u2715" })] }), "          "] }), !isMinimized && (_jsx("div", { className: styles.tabNav, children: [
                            { id: 'system', label: '🖥️ System', icon: '🖥️' },
                            { id: 'midi', label: '🎹 MIDI', icon: '🎹' },
                            { id: 'osc', label: '📡 OSC', icon: '📡' },
                            { id: 'dmx', label: '💡 DMX', icon: '💡' },
                            { id: 'touchosc', label: '📱 TouchOSC', icon: '📱' }
                        ].map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`, children: [tab.icon, " ", tab.label] }, tab.id))) })), !isMinimized && (_jsxs("div", { className: styles.tabContent, children: [activeTab === 'system' && (_jsxs("div", { className: styles.systemTab, children: [_jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDD27 Environment" }), _jsxs("div", { className: styles.infoGrid, children: [_jsxs("div", { children: ["NODE_ENV: ", systemInfo.nodeEnv] }), _jsxs("div", { children: ["React: ", systemInfo.reactVersion] }), _jsxs("div", { children: ["Socket.IO: ", connected ? '✅ Connected' : '❌ Disconnected'] }), _jsxs("div", { children: ["WebMIDI: ", systemInfo.webMidiSupported ? '✅' : '❌'] })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCCA Performance" }), _jsxs("div", { className: styles.infoGrid, children: [_jsxs("div", { children: ["JS Heap Used: ", formatBytes(systemInfo.memoryUsage?.usedJSHeapSize)] }), _jsxs("div", { children: ["JS Heap Total: ", formatBytes(systemInfo.memoryUsage?.totalJSHeapSize)] }), _jsxs("div", { children: ["JS Heap Limit: ", formatBytes(systemInfo.memoryUsage?.jsHeapSizeLimit)] }), _jsxs("div", { children: ["Last Update: ", systemInfo.timestamp] })] })] }), systemInfo.errors?.length > 0 && (_jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDEA8 Recent Errors" }), _jsx("div", { className: styles.errorList, children: systemInfo.errors.slice(-3).map((error, index) => (_jsxs("div", { className: styles.error, children: [_jsx("div", { className: styles.errorMessage, children: error.message }), _jsxs("div", { className: styles.errorDetails, children: [error.filename, ":", error.lineno, ":", error.colno] }), _jsx("div", { className: styles.errorTime, children: new Date(error.timestamp).toLocaleTimeString() })] }, index))) })] }))] })), activeTab === 'midi' && (_jsxs("div", { className: styles.midiTab, children: [_jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83C\uDFB9 MIDI Status" }), _jsxs("div", { className: styles.infoGrid, children: [_jsxs("div", { children: ["Learn Target: ", midiLearnTarget !== null ? JSON.stringify(midiLearnTarget) : 'None'] }), _jsxs("div", { children: ["Active Mappings: ", Object.keys(midiMappings).length] }), _jsxs("div", { children: ["Recent Messages: ", midiMessages.length] })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83E\uDDEA MIDI Test Functions" }), _jsxs("div", { className: styles.buttonGrid, children: [_jsx("button", { onClick: () => sendTestNoteOnMessage(0, 60, 127), className: styles.testButton, children: "\uD83D\uDCDD Test Note (C4)" }), _jsx("button", { onClick: () => sendTestCCMessage(0, 7, 127), className: styles.testButton, children: "\uD83C\uDF9B\uFE0F Test CC (Volume)" }), _jsx("button", { onClick: () => {
                                                            const channel = prompt('Enter DMX channel to test (0-511):', '0');
                                                            if (channel !== null) {
                                                                const dmxChannel = parseInt(channel, 10);
                                                                if (!isNaN(dmxChannel) && dmxChannel >= 0 && dmxChannel <= 511) {
                                                                    const msgType = prompt('Enter MIDI message type (note/cc):', 'note');
                                                                    testMidiLearnWorkflow(dmxChannel, msgType === 'cc' ? 'cc' : 'note');
                                                                }
                                                            }
                                                        }, className: styles.testButton, children: "\uD83D\uDD04 Test MIDI Learn" })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCCB Recent MIDI Messages" }), _jsx("div", { className: styles.messageList, children: midiMessages.length === 0 ? (_jsx("div", { className: styles.noMessages, children: "No recent MIDI messages" })) : (midiMessages.slice(-5).map((message, idx) => (_jsx("div", { className: styles.message, children: JSON.stringify(message) }, idx)))) })] })] })), activeTab === 'osc' && (_jsx("div", { className: styles.oscTab, children: _jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCE1 OSC Test Functions" }), _jsxs("div", { className: styles.inputGroup, children: [_jsx("label", { children: "OSC Address:" }), _jsx("input", { type: "text", value: oscTestAddress, onChange: (e) => setOscTestAddress(e.target.value), placeholder: "/dmx/channel/1", className: styles.input })] }), _jsxs("div", { className: styles.inputGroup, children: [_jsx("label", { children: "Value:" }), _jsx("input", { type: "text", value: oscTestValue, onChange: (e) => setOscTestValue(e.target.value), placeholder: "127", className: styles.input })] }), _jsxs("div", { className: styles.buttonGrid, children: [_jsx("button", { onClick: sendOscTestMessage, className: styles.testButton, disabled: !connected, children: "\uD83D\uDCE4 Send OSC Message" }), _jsx("button", { onClick: requestOscTestMessage, className: styles.testButton, disabled: !connected, children: "\uD83D\uDCE5 Request OSC Test" })] }), _jsxs("div", { className: styles.connectionStatus, children: ["Socket Status: ", connected ? '✅ Connected' : '❌ Disconnected'] })] }) })), activeTab === 'dmx' && (_jsxs("div", { className: styles.dmxTab, children: [_jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCA1 DMX Debug Functions" }), _jsxs("div", { className: styles.inputGroup, children: [_jsx("label", { children: "DMX Channel (1-512):" }), _jsx("input", { type: "number", min: "1", max: "512", value: dmxTestChannel, onChange: (e) => setDmxTestChannel(e.target.value), className: styles.input })] }), _jsxs("div", { className: styles.inputGroup, children: [_jsx("label", { children: "Value (0-255):" }), _jsx("input", { type: "number", min: "0", max: "255", value: dmxTestValue, onChange: (e) => setDmxTestValue(e.target.value), className: styles.input })] }), _jsx("button", { onClick: sendDmxTestMessage, className: styles.testButton, disabled: !connected, children: "\uD83D\uDCA1 Send DMX Channel Debug" }), _jsxs("div", { className: styles.connectionStatus, children: ["Socket Status: ", connected ? '✅ Connected' : '❌ Disconnected'] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCCA DMX Status" }), _jsxs("div", { className: styles.infoGrid, children: [_jsxs("div", { children: ["Active Channels: ", dmxChannels.filter(v => v > 0).length] }), _jsxs("div", { children: ["Total Fixtures: ", fixtureLayout.length] }), _jsxs("div", { children: ["Max Channel Used: ", Math.max(...dmxChannels.map((v, i) => v > 0 ? i + 1 : 0))] })] })] })] })), activeTab === 'touchosc' && (_jsxs("div", { className: styles.touchoscTab, children: [_jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCF1 TouchOSC Generation" }), _jsxs("div", { className: styles.buttonGrid, children: [_jsx("button", { onClick: generateFromFixtures, className: styles.generateButton, disabled: touchOscGenerating, children: touchOscGenerating ? '⏳ Generating...' : '🎯 Auto-Generate from Fixtures' }), _jsx("button", { onClick: generate512Channels, className: styles.generateButton, disabled: touchOscGenerating, children: touchOscGenerating ? '⏳ Generating...' : '📊 Generate All 512 Channels' })] }), _jsxs("div", { className: styles.infoText, children: [_jsxs("p", { children: [_jsx("strong", { children: "Auto-Generate from Fixtures:" }), " Creates TouchOSC layout with controls for all placed fixtures, including PAN/TILT XY pads for moving lights."] }), _jsxs("p", { children: [_jsx("strong", { children: "All 512 Channels:" }), " Creates a comprehensive grid with faders for all 512 DMX channels."] })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h4", { children: "\uD83D\uDCCA Current Layout" }), _jsxs("div", { className: styles.infoGrid, children: [_jsxs("div", { children: ["Placed Fixtures: ", fixtureLayout.length] }), _jsxs("div", { children: ["Available Fixture Types: ", allFixtures.length] }), _jsxs("div", { children: ["Pan/Tilt Fixtures: ", fixtureLayout.filter(pf => {
                                                                const fixture = allFixtures.find(f => f.id === pf.fixtureId);
                                                                return fixture?.channels.some(ch => ch.type === 'pan' || ch.type === 'tilt');
                                                            }).length] })] }), "                "] })] }))] }))] }))] }));
};
export default DebugMenu;
