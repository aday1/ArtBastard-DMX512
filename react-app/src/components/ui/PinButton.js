import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePinning } from '../../context/PinningContext';
import styles from './PinButton.module.scss';
export const PinButton = ({ componentId, className = '', size = 'medium', showLabel = true, variant = 'default' }) => {
    const { isPinned, togglePin } = usePinning();
    const pinned = isPinned(componentId);
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        togglePin(componentId);
    };
    const getDisplayName = (id) => {
        switch (id) {
            case 'master-fader': return 'Master Fader';
            case 'scene-auto': return 'Scene Auto';
            case 'chromatic-energy-manipulator': return 'Energy Manipulator';
            case 'scene-quick-launch': return 'Quick Launch';
            case 'quick-capture': return 'Quick Capture';
            default: return id;
        }
    };
    return (_jsxs("button", { className: `${styles.pinButton} ${styles[size]} ${styles[variant]} ${pinned ? styles.pinned : styles.unpinned} ${className}`, onClick: handleClick, title: `${pinned ? 'Unpin' : 'Pin'} ${getDisplayName(componentId)} - ${pinned ? 'Remove from viewport overlay' : 'Keep visible while scrolling'}`, "aria-label": `${pinned ? 'Unpin' : 'Pin'} ${getDisplayName(componentId)}`, children: [_jsx("i", { className: `fas ${pinned ? 'fa-thumbtack' : 'fa-thumb-tack'} ${styles.icon}` }), showLabel && (_jsx("span", { className: styles.label, children: pinned ? 'Pinned' : 'Pin' }))] }));
};
export default PinButton;
