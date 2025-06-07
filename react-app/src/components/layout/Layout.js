import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from './StatusBar';
import { Navbar } from './Navbar';
import { ToastContainer } from './ToastContainer';
import FancyQuotes from './FancyQuotes';
import { DebugMenu } from '../debug/DebugMenu';
import styles from './Layout.module.scss';
import { Sparkles } from './Sparkles';
export const Layout = ({ children }) => {
    const { theme, darkMode, toggleDarkMode } = useTheme();
    return (_jsxs("div", { className: `${styles.layout} ${styles[theme]} ${darkMode ? styles.dark : styles.light}`, style: { fontFeatureSettings: "'liga' 1, 'calt' 1, 'tnum' 1, 'case' 1" }, children: [_jsx(Sparkles, {}), _jsx(Navbar, {}), _jsx(ToastContainer, {}), _jsx("div", { className: styles.contentWrapper, children: _jsxs("div", { className: styles.mainContent, children: [_jsxs("h1", { className: styles.title, children: ["ArtBastard DMX512FTW:", theme === 'artsnob' && _jsx("span", { children: "The Luminary Palette" }), theme === 'standard' && _jsx("span", { children: "DMX Controller" }), theme === 'minimal' && _jsx("span", { children: "DMX" })] }), theme === 'artsnob' && (_jsx(FancyQuotes, { intervalSeconds: 30, animate: true })), _jsx("main", { className: styles.contentArea, children: children }), _jsx(DebugMenu, { position: "top-right" })] }) }), _jsx(StatusBar, {})] }));
};
