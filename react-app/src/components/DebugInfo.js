import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { sendTestNoteOnMessage, sendTestCCMessage, testMidiLearnWorkflow } from '../hooks/useMidiTestUtils';
const DebugInfo = ({ position = 'top-right' }) => {
    const [debugInfo, setDebugInfo] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    // MIDI store state
    const midiMessages = useStore(state => state.midiMessages);
    const midiMappings = useStore(state => state.midiMappings);
    const midiLearnTarget = useStore(state => state.midiLearnTarget);
    useEffect(() => {
        const updateDebugInfo = () => {
            setDebugInfo({
                timestamp: new Date().toLocaleTimeString(),
                userAgent: navigator.userAgent,
                currentUrl: window.location.href,
                nodeEnv: process.env.NODE_ENV,
                webMidiSupported: 'navigator' in window && 'requestMIDIAccess' in navigator,
                socketIOAvailable: typeof window !== 'undefined' && 'io' in window,
                reactVersion: React.version,
                documentReadyState: document.readyState,
                windowLoaded: document.readyState === 'complete',
                errors: window.__reactErrors || []
            });
        };
        updateDebugInfo();
        const interval = setInterval(updateDebugInfo, 1000);
        // Listen for errors
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
            updateDebugInfo();
        };
        window.addEventListener('error', errorHandler);
        return () => {
            clearInterval(interval);
            window.removeEventListener('error', errorHandler);
        };
    }, []);
    const positionStyles = {
        'top-left': { top: '10px', left: '10px' },
        'top-right': { top: '10px', right: '10px' },
        'bottom-left': { bottom: '10px', left: '10px' },
        'bottom-right': { bottom: '10px', right: '10px' }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsVisible(!isVisible), style: {
                    position: 'fixed',
                    ...positionStyles[position],
                    zIndex: 10000,
                    padding: '5px 10px',
                    backgroundColor: isVisible ? '#ff4444' : '#007acc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }, children: isVisible ? '🔍 Hide Debug' : '🔍 Debug' }), isVisible && (_jsxs("div", { style: {
                    position: 'fixed',
                    top: position.includes('top') ? '50px' : 'auto',
                    bottom: position.includes('bottom') ? '50px' : 'auto',
                    left: position.includes('left') ? '10px' : 'auto', right: position.includes('right') ? '10px' : 'auto',
                    width: '450px',
                    maxHeight: '85vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: '#00ff00',
                    padding: '15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    zIndex: 9999,
                    overflow: 'auto',
                    border: '1px solid #333'
                }, children: [_jsx("h3", { style: { margin: '0 0 10px 0', color: '#ffff00' }, children: "\uD83D\uDE80 ArtBastard Debug Info" }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "Environment:" }), _jsxs("div", { children: ["NODE_ENV: ", debugInfo.nodeEnv || 'undefined'] }), _jsxs("div", { children: ["React Version: ", debugInfo.reactVersion] }), _jsxs("div", { children: ["Document State: ", debugInfo.documentReadyState] }), _jsxs("div", { children: ["Window Loaded: ", debugInfo.windowLoaded ? '✅' : '❌'] })] }), "          ", _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "Browser Support:" }), _jsxs("div", { children: ["WebMIDI: ", debugInfo.webMidiSupported ? '✅' : '❌'] }), _jsxs("div", { children: ["Socket.IO: ", debugInfo.socketIOAvailable ? '✅' : '❌'] })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "MIDI Debug:" }), _jsxs("div", { children: ["Learn Target: ", midiLearnTarget !== null ? JSON.stringify(midiLearnTarget) : 'None'] }), _jsxs("div", { children: ["Active Mappings: ", Object.keys(midiMappings).length] }), _jsxs("div", { children: ["Recent Messages: ", midiMessages.length] })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "MIDI Mappings:" }), _jsx("div", { style: {
                                    maxHeight: '120px',
                                    overflow: 'auto',
                                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                    padding: '5px',
                                    borderRadius: '3px',
                                    fontSize: '10px'
                                }, children: Object.keys(midiMappings).length === 0 ? (_jsx("div", { style: { color: '#888' }, children: "No mappings configured" })) : (Object.entries(midiMappings).map(([channel, mapping]) => (_jsxs("div", { style: { marginBottom: '2px' }, children: ["Ch ", channel, ": ", mapping.controller !== undefined
                                            ? `CC ${mapping.channel}:${mapping.controller}`
                                            : `Note ${mapping.channel}:${mapping.note}`] }, channel)))) })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "Recent MIDI Messages:" }), _jsx("div", { style: {
                                    maxHeight: '100px',
                                    overflow: 'auto',
                                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                    padding: '5px',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    fontFamily: 'monospace'
                                }, children: midiMessages.length === 0 ? (_jsx("div", { style: { color: '#888' }, children: "No recent messages" })) : (midiMessages.slice(-5).map((message, idx) => (_jsx("div", { style: { marginBottom: '2px' }, children: JSON.stringify(message) }, idx)))) })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "MIDI Test Functions:" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }, children: [_jsx("button", { onClick: () => sendTestNoteOnMessage(0, 60, 127), style: {
                                            backgroundColor: '#006600',
                                            color: '#f0f0f0',
                                            padding: '4px 8px',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }, children: "Test Note" }), _jsx("button", { onClick: () => sendTestCCMessage(0, 7, 127), style: {
                                            backgroundColor: '#005580',
                                            color: '#f0f0f0',
                                            padding: '4px 8px',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }, children: "Test CC" }), _jsx("button", { onClick: () => {
                                            const channel = prompt('Enter DMX channel to test (0-511):', '0');
                                            if (channel !== null) {
                                                const dmxChannel = parseInt(channel, 10);
                                                if (!isNaN(dmxChannel) && dmxChannel >= 0 && dmxChannel <= 511) {
                                                    const msgType = prompt('Enter MIDI message type (note/cc):', 'note');
                                                    testMidiLearnWorkflow(dmxChannel, msgType === 'cc' ? 'cc' : 'note');
                                                }
                                            }
                                        }, style: {
                                            backgroundColor: '#7700aa',
                                            color: '#f0f0f0',
                                            padding: '4px 8px',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }, children: "Test Learn" })] })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#00ffff' }, children: "Network:" }), _jsxs("div", { children: ["Current URL: ", debugInfo.currentUrl] }), _jsxs("div", { children: ["Last Updated: ", debugInfo.timestamp] })] }), debugInfo.errors && debugInfo.errors.length > 0 && (_jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("strong", { style: { color: '#ff4444' }, children: "Recent Errors:" }), debugInfo.errors.slice(-3).map((error, index) => (_jsxs("div", { style: {
                                    padding: '5px',
                                    margin: '5px 0',
                                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                    border: '1px solid #ff4444',
                                    borderRadius: '3px'
                                }, children: [_jsx("div", { style: { color: '#ff6666' }, children: error.message }), _jsxs("div", { style: { fontSize: '10px', color: '#cccccc' }, children: [error.filename, ":", error.lineno, ":", error.colno] }), _jsx("div", { style: { fontSize: '10px', color: '#aaaaaa' }, children: new Date(error.timestamp).toLocaleTimeString() })] }, index)))] })), _jsx("div", { style: { fontSize: '10px', color: '#888888', marginTop: '10px' }, children: "\uD83D\uDCA1 Check browser DevTools Console (F12) for more details" })] }))] }));
};
export default DebugInfo;
