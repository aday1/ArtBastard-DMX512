import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import styles from './Settings.module.scss'; // Assuming a shared style module
const NetworkSettingsPanel = () => {
    const [settings, setSettings] = useState({
        dmxInterface: 'default',
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        port: 6454,
        artnetEnabled: true,
        sAcnEnabled: false,
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
    return (_jsxs("div", { className: styles.settingsPanelItem, children: [_jsx("h4", { children: "DMX Network & Communication" }), _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "dmxInterface", children: "DMX Interface" }), _jsx("select", { id: "dmxInterface", name: "dmxInterface", value: settings.dmxInterface, onChange: handleChange, children: _jsx("option", { value: "default", children: "Default Ethernet" }) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "ipAddress", children: "IP Address (Informational)" }), _jsx("input", { type: "text", id: "ipAddress", name: "ipAddress", value: settings.ipAddress, onChange: handleChange, disabled // Usually auto-detected or system configured
                                : true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "subnetMask", children: "Subnet Mask (Informational)" }), _jsx("input", { type: "text", id: "subnetMask", name: "subnetMask", value: settings.subnetMask, onChange: handleChange, disabled: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "port", children: "Art-Net Port" }), _jsx("input", { type: "number", id: "port", name: "port", value: settings.port, onChange: handleChange, min: "1", max: "65535" })] }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "artnetEnabled", checked: settings.artnetEnabled, onChange: handleChange }), "Enable Art-Net Protocol"] }) }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "sAcnEnabled", checked: settings.sAcnEnabled, onChange: handleChange }), "Enable sACN Protocol"] }) })] }), _jsx("p", { className: styles.settingDescription, children: "Configure network interfaces and protocols for DMX output. IP and Subnet are typically auto-detected." })] }));
};
export default NetworkSettingsPanel;
