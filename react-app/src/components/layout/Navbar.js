import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './Navbar.module.scss';
import { Sparkles } from './Sparkles';
import { LucideIcon } from '../ui/LucideIcon'; // Using our adapter for lucide-react icons
const navItems = [
    {
        id: 'main',
        icon: 'fa-lightbulb',
        title: {
            artsnob: 'Luminous Canvas',
            standard: 'Main Control',
            minimal: 'Main'
        }
    },
    {
        id: 'midiOsc',
        icon: 'fa-sliders-h',
        title: {
            artsnob: 'MIDI/OSC Atelier',
            standard: 'MIDI/OSC Setup',
            minimal: 'I/O'
        }
    },
    {
        id: 'fixture',
        icon: 'fa-object-group',
        title: {
            artsnob: 'Fixture Composition',
            standard: 'Fixture Setup',
            minimal: 'Fix'
        }
    }, {
        id: 'scenes',
        icon: 'fa-theater-masks',
        title: {
            artsnob: 'Scene Gallery',
            standard: 'Scenes',
            minimal: 'Scn'
        }
    }, {
        id: 'oscDebug',
        icon: 'fa-bug',
        title: {
            artsnob: 'OSC Debugging',
            standard: 'OSC Debug',
            minimal: 'OSC'
        }
    },
    {
        id: 'audio',
        icon: 'fa-music',
        title: {
            artsnob: 'Audio Spectrum',
            standard: 'Audio FFT',
            minimal: 'FFT'
        }
    },
    {
        id: 'touchosc',
        icon: 'fa-mobile-alt',
        title: {
            artsnob: 'TouchOSC Designer',
            standard: 'TouchOSC',
            minimal: 'OSC'
        }
    },
    {
        id: 'misc',
        icon: 'fa-cog',
        title: {
            artsnob: 'Avant-Garde Settings',
            standard: 'Settings',
            minimal: 'Cfg'
        }
    }
];
export const Navbar = () => {
    const { theme } = useTheme();
    const [activeView, setActiveView] = useState('main');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const handleViewChange = (view) => {
        setActiveView(view);
        window.dispatchEvent(new CustomEvent('changeView', {
            detail: { view }
        }));
    };
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };
    // The parent div now controls the overall block, its margin, and stickiness.
    // The toggle button is outside the element that gets display:none.
    return (_jsxs("div", { className: styles.navbarContainer, children: ["      ", _jsxs("button", { className: styles.collapseToggle, onClick: toggleCollapse, title: isCollapsed ? "Expand navigation" : "Collapse navigation", children: ["        ", isCollapsed ? (_jsx(LucideIcon, { name: "Menu", size: 24, strokeWidth: 1.5 })) : (_jsx(LucideIcon, { name: "X", size: 24, strokeWidth: 1.5 })), " "] }), _jsxs("nav", { className: `${styles.navContent} ${isCollapsed ? styles.navContentCollapsed : ''}`, children: [_jsx(Sparkles, {}), _jsx("div", { className: styles.navButtons, children: navItems.map((item) => (_jsxs("button", { className: `${styles.navButton} ${activeView === item.id ? styles.active : ''}`, onClick: () => handleViewChange(item.id), title: item.title.standard, children: [_jsx("i", { className: `fas ${item.icon}` }), _jsx("span", { children: item.title[theme] })] }, item.id))) })] })] }));
};
