import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useBrowserMidi } from '../../hooks/useBrowserMidi';
import { useStore } from '../../store';
import styles from './NetworkStatus.module.scss';
export const NetworkStatus = ({ isModal = false, onClose, compact = false }) => {
    const { socket, connected } = useSocket();
    const { theme } = useTheme();
    const [health, setHealth] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    // Get MIDI devices directly from browser to supplement server health data
    const { browserInputs, activeBrowserInputs } = useBrowserMidi();
    const midiMessages = useStore(state => state.midiMessages);
    const [midiActivity, setMidiActivity] = useState(false);
    // Flash MIDI indicator on new messages
    useEffect(() => {
        if (midiMessages && midiMessages.length > 0) {
            setMidiActivity(true);
            const timer = setTimeout(() => setMidiActivity(false), 300);
            return () => clearTimeout(timer);
        }
    }, [midiMessages]);
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                setHealth(data);
                setLastUpdate(new Date());
            }
            catch (error) {
                console.error('Failed to fetch health status:', error);
            }
        };
        // Initial fetch
        fetchHealth();
        // Poll every 10 seconds
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (isModal) {
            setShowModal(true);
        }
    }, [isModal]);
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };
    const formatMemory = (bytes) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };
    const handleClose = () => {
        setShowModal(false);
        onClose?.();
    };
    // Helper function to determine ArtNet display text and style
    const getArtNetDisplayDetails = (status) => {
        let fullText = status || 'Unknown';
        let shortText = status || 'Unknown';
        let styleKey = 'statusUnknown';
        switch (status) {
            case 'alive':
                fullText = 'ICMP Reply to Artnet'; // User's requested text
                shortText = 'ArtNet OK';
                styleKey = 'statusOk';
                break;
            case 'initialized_pending_ping':
                fullText = 'ArtNet Initialized, Pinging...';
                shortText = 'Pinging...';
                styleKey = 'statusUnknown'; // Or 'statusPending' if you add specific styles
                break;
            case 'init_failed':
                fullText = 'ArtNet Initialization Failed';
                shortText = 'Init Fail';
                styleKey = 'statusDegraded';
                break;
            case 'tcp_timeout':
                fullText = 'ArtNet TCP Port Timeout';
                shortText = 'Timeout';
                styleKey = 'statusDegraded';
                break;
            case 'unreachable':
                fullText = 'ArtNet Device Unreachable';
                shortText = 'Unreachable';
                styleKey = 'statusDegraded';
                break;
            default:
                fullText = status ? `ArtNet: ${status}` : 'ArtNet: Unknown';
                shortText = status || 'Unknown';
                styleKey = 'statusUnknown';
        }
        return { fullText, shortText, styleKey };
    };
    const content = (_jsxs("div", { className: styles.networkStatus, children: [_jsxs("div", { className: styles.header, children: [_jsxs("h3", { children: [theme === 'artsnob' && 'Network Telemetry', theme === 'standard' && 'Network Status', theme === 'minimal' && 'Status'] }), lastUpdate && (_jsxs("span", { className: styles.lastUpdate, children: ["Updated: ", lastUpdate.toLocaleTimeString()] })), isModal && (_jsx("button", { className: styles.closeButton, onClick: handleClose, children: _jsx("i", { className: "fas fa-times" }) }))] }), _jsxs("div", { className: styles.statusGrid, children: [_jsxs("div", { className: `${styles.statusItem} ${styles[health?.status || 'unknown']}`, children: [_jsx("i", { className: "fas fa-server" }), _jsxs("div", { className: styles.statusInfo, children: [_jsx("span", { className: styles.label, children: "Server" }), _jsx("span", { className: styles.value, children: health?.serverStatus || 'Unknown' })] })] }), _jsxs("div", { className: `${styles.statusItem} ${styles[connected ? 'ok' : 'degraded']}`, children: [_jsx("i", { className: "fas fa-plug" }), _jsxs("div", { className: styles.statusInfo, children: [_jsx("span", { className: styles.label, children: "WebSocket" }), _jsx("span", { className: styles.value, children: connected ? `Connected (${health?.socketConnections || 0} clients)` : 'Disconnected' })] })] }), _jsxs("div", { className: `${styles.statusItem} ${styles[health?.midiDevicesConnected ? 'ok' : 'unknown']}`, children: [_jsx("i", { className: "fas fa-music" }), _jsxs("div", { className: styles.statusInfo, children: [_jsx("span", { className: styles.label, children: "MIDI Devices" }), _jsxs("span", { className: styles.value, children: ["Server: ", health?.midiDevicesConnected || 0, ", Browser: ", activeBrowserInputs?.size || 0] })] })] }), _jsxs("div", { className: `${styles.statusItem} ${styles[getArtNetDisplayDetails(health?.artnetStatus).styleKey]}`, children: [_jsx("i", { className: "fas fa-network-wired" }), _jsxs("div", { className: styles.statusInfo, children: [_jsx("span", { className: styles.label, children: "ArtNet" }), _jsx("span", { className: styles.value, children: getArtNetDisplayDetails(health?.artnetStatus).fullText })] })] }), _jsxs("div", { className: styles.statsSection, children: [_jsxs("div", { className: styles.stat, children: [_jsx("span", { className: styles.label, children: "Uptime" }), _jsx("span", { className: styles.value, children: health ? formatUptime(health.uptime) : 'Unknown' })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { className: styles.label, children: "Memory" }), _jsx("span", { className: styles.value, children: health?.memoryUsage ? formatMemory(health.memoryUsage.heapUsed) : 'Unknown' })] }), "        "] })] })] }));
    if (compact) {
        // Super compact - just an icon that shows overall status
        const overallStatus = health?.status === 'ok' && connected ? 'ok' : 'degraded';
        const statusIcon = overallStatus === 'ok' ? 'fa-wifi' : 'fa-exclamation-triangle';
        return (_jsx("button", { className: `${styles.compactIcon} ${styles[overallStatus]}`, title: `Network Status: ${overallStatus.toUpperCase()}\nServer: ${health?.serverStatus || 'Unknown'}\nSocket: ${connected ? 'Connected' : 'Disconnected'}\nMIDI: ${(health?.midiDevicesConnected || 0) + (activeBrowserInputs?.size || 0)} devices\nClick for details`, onClick: () => setShowModal(true), children: _jsx("i", { className: `fas ${statusIcon}` }) }));
    }
    if (isModal) {
        return showModal ? (_jsx("div", { className: styles.modalOverlay, children: _jsx("div", { className: styles.modalContent, children: content }) })) : null;
    }
    return content;
};
