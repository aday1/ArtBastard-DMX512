import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../../context/ThemeContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './ThemeToggleButton.module.scss';
export const ThemeToggleButton = () => {
    const { darkMode, toggleDarkMode } = useTheme();
    const handleResetUI = () => {
        // Remove localStorage items for MidiMonitor and OscMonitor positions
        localStorage.removeItem('midiMonitorPositionX');
        localStorage.removeItem('midiMonitorPositionY');
        localStorage.removeItem('oscMonitorPositionX');
        localStorage.removeItem('oscMonitorPositionY');
        // Reload the page to apply the reset
        window.location.reload();
    };
    return (_jsxs("div", { className: styles.themeToggleContainer, children: [_jsx("button", { className: styles.iconButton, onClick: toggleDarkMode, title: "Toggle Light/Dark Mode", children: _jsx(LucideIcon, { name: darkMode ? 'Moon' : 'Sun' }) }), _jsx("button", { className: styles.iconButton, onClick: handleResetUI, title: "Reset UI Elements", children: _jsx(LucideIcon, { name: "RefreshCw" }) })] }));
};
