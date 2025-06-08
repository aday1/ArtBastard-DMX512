import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import styles from './Settings.module.scss'; // Assuming a shared style module
const PerformanceSettingsPanel = () => {
    const [settings, setSettings] = useState({
        enableHardwareAcceleration: true,
        visualizerQuality: 'medium',
        loggingLevel: 'info',
        showFps: false,
    });
    const handleChange = (event) => {
        const { name, value, type } = event.target;
        if (type === 'checkbox') {
            const { checked } = event.target;
            setSettings(prev => ({ ...prev, [name]: checked }));
        }
        else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };
    return (_jsxs("div", { className: styles.settingsPanelItem, children: [_jsx("h4", { children: "Performance & Debugging" }), _jsxs("div", { className: styles.settingsGrid, children: [_jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "enableHardwareAcceleration", checked: settings.enableHardwareAcceleration, onChange: handleChange }), "Enable Hardware Acceleration (if available)"] }) }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "visualizerQuality", children: "Visualizer Quality" }), _jsxs("select", { id: "visualizerQuality", name: "visualizerQuality", value: settings.visualizerQuality, onChange: handleChange, children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "loggingLevel", children: "Logging Level" }), _jsxs("select", { id: "loggingLevel", name: "loggingLevel", value: settings.loggingLevel, onChange: handleChange, children: [_jsx("option", { value: "none", children: "None" }), _jsx("option", { value: "error", children: "Error" }), _jsx("option", { value: "warn", children: "Warning" }), _jsx("option", { value: "info", children: "Info" }), _jsx("option", { value: "debug", children: "Debug" })] })] }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "showFps", checked: settings.showFps, onChange: handleChange }), "Show FPS Counter"] }) })] }), _jsx("p", { className: styles.settingDescription, children: "Adjust settings to optimize performance or aid in debugging. Some changes may require an application restart." })] }));
};
export default PerformanceSettingsPanel;
