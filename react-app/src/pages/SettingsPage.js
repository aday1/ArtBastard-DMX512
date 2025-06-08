import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Pages.module.scss';
import NetworkSettingsPanel from '../components/settings/NetworkSettingsPanel';
import PerformanceSettingsPanel from '../components/settings/PerformanceSettingsPanel';
import ImportExportPanel from '../components/settings/ImportExportPanel';
const SettingsPage = () => {
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Configuration & Settings" }), _jsx("p", { children: "System configuration and advanced settings" })] }), _jsx("div", { className: styles.pageContent, children: _jsxs("div", { className: styles.settingsSection, children: [_jsxs("div", { className: styles.settingsPanel, children: [_jsx("h3", { children: "Theme Settings" }), _jsx("div", { className: styles.settingsGroup, children: _jsx("p", { children: "Interface theme and appearance options" }) })] }), _jsxs("div", { className: styles.settingsPanel, children: [_jsx("h3", { children: "Network Settings" }), _jsxs("div", { className: styles.settingsGroup, children: [_jsx("p", { children: "DMX network and communication settings" }), _jsx(NetworkSettingsPanel, {})] })] }), _jsxs("div", { className: styles.settingsPanel, children: [_jsx("h3", { children: "Performance Settings" }), _jsxs("div", { className: styles.settingsGroup, children: [_jsx("p", { children: "Performance optimization and debugging options" }), _jsx(PerformanceSettingsPanel, {})] })] }), _jsx("div", { className: styles.settingsPanel, children: _jsx(ImportExportPanel, {}) })] }) })] }));
};
export default SettingsPage;
