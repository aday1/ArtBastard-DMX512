import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../store';
import { NetworkStatus } from './NetworkStatus';
import styles from './Navbar.module.scss';
import { LucideIcon } from '../ui/LucideIcon';
// Updated navigation items with Lucide icon names
const navItems = [
    {
        id: 'main',
        icon: 'Layout',
        title: {
            artsnob: 'Main Interface',
            standard: 'Dashboard',
            minimal: 'Main'
        }
    },
    {
        id: 'midiOsc',
        icon: 'Sliders',
        title: {
            artsnob: 'Control Setup',
            standard: 'MIDI & OSC',
            minimal: 'I/O'
        }
    },
    {
        id: 'fixture',
        icon: 'LampDesk',
        title: {
            artsnob: 'Fixtures',
            standard: 'Fixtures',
            minimal: 'Fix'
        }
    },
    {
        id: 'scenes',
        icon: 'Store',
        title: {
            artsnob: 'Scene Library',
            standard: 'Scenes',
            minimal: 'Scn'
        }
    },
    {
        id: 'audio',
        icon: 'WaveformCircle',
        title: {
            artsnob: 'Audio Analysis',
            standard: 'Audio',
            minimal: 'FFT'
        }
    },
    {
        id: 'touchosc',
        icon: 'Smartphone',
        title: {
            artsnob: 'Remote Control',
            standard: 'TouchOSC',
            minimal: 'OSC'
        }
    },
    {
        id: 'misc',
        icon: 'Settings',
        title: {
            artsnob: 'Configuration',
            standard: 'Settings',
            minimal: 'Cfg'
        }
    }
];
export const Navbar = () => {
    const { theme } = useTheme();
    const [activeView, setActiveView] = useState('main');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navVisibility = useStore((state) => state.navVisibility);
    const handleViewChange = (view) => {
        setActiveView(view);
        window.dispatchEvent(new CustomEvent('changeView', { detail: { view } }));
    };
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (_jsxs("div", { className: styles.navbarContainer, children: [_jsx("button", { onClick: toggleCollapse, className: styles.collapseToggle, title: isCollapsed ? 'Expand Navigation' : 'Collapse Navigation', children: _jsx(LucideIcon, { name: isCollapsed ? 'PanelRightOpen' : 'PanelLeftClose' }) }), _jsxs("div", { className: `${styles.navContent} ${isCollapsed ? styles.navContentCollapsed : ''}`, children: [_jsx("div", { className: styles.navButtons, children: navItems.map((item) => (_jsxs("button", { onClick: () => handleViewChange(item.id), className: `${styles.navButton} ${activeView === item.id ? styles.active : ''}`, title: item.title[theme], children: [_jsx(LucideIcon, { name: item.icon }), _jsx("span", { children: item.title[theme] })] }, item.id))) }), _jsx(NetworkStatus, { compact: true })] })] }));
};
