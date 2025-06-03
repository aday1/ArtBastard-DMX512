import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '../../context/ThemeContext';
import styles from './ThemeToggleButton.module.scss';
export const ThemeToggleButton = () => {
    const { darkMode, toggleDarkMode } = useTheme();
    return (_jsx("div", { className: styles.themeToggle, onClick: toggleDarkMode, title: "Toggle Light/Dark Mode", children: _jsx("i", { className: `fas ${darkMode ? 'fa-moon' : 'fa-sun'}` }) }));
};
