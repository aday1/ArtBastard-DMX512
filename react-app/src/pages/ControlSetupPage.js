import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MidiOscSetup } from '../components/midi/MidiOscSetup';
import { MidiMonitor } from '../components/midi/MidiMonitor';
import { OscMonitor } from '../components/osc/OscMonitor';
import styles from './Pages.module.scss';
const ControlSetupPage = () => {
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Control Setup - MIDI & OSC Configuration" }), _jsx("p", { children: "Configure MIDI and OSC inputs/outputs for external control" })] }), _jsxs("div", { className: styles.pageContent, children: [_jsx("div", { className: styles.setupSection, children: _jsx(MidiOscSetup, {}) }), _jsxs("div", { className: styles.monitorSection, children: [_jsxs("div", { className: styles.monitorPanel, children: [_jsx("h3", { children: "MIDI Monitor" }), _jsx(MidiMonitor, {})] }), _jsxs("div", { className: styles.monitorPanel, children: [_jsx("h3", { children: "OSC Monitor" }), _jsx(OscMonitor, {})] })] })] })] }));
};
export default ControlSetupPage;
