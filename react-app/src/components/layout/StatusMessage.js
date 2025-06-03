import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import styles from './StatusMessage.module.scss';
export const StatusMessage = ({ message, type, priority = 'normal', persistent = false, dismissible = true, id // Now required
 }) => {
    const [visible, setVisible] = useState(true);
    // const clearStatusMessage = useStore((state) => state.clearStatusMessage) // Old store action
    const removeNotification = useStore((state) => state.removeNotification); // New store action
    const [isHovered, setIsHovered] = useState(false);
    const duration = priority === 'high' ? 5000 : priority === 'low' ? 2000 : 3000;
    useEffect(() => {
        setVisible(true);
        if (!persistent) {
            const timer = setTimeout(() => {
                if (!isHovered) {
                    setVisible(false);
                    // Allow time for fade out animation before removing from DOM
                    setTimeout(() => {
                        // clearStatusMessage() // Old store action
                        if (id)
                            removeNotification(id); // Use new action with id
                    }, 300);
                }
            }, duration);
            return () => clearTimeout(timer);
        }
        // }, [message, clearStatusMessage, persistent, duration, isHovered]) // Old dependencies
    }, [id, message, removeNotification, persistent, duration, isHovered]); // Updated dependencies
    const handleDismiss = () => {
        if (dismissible) {
            setVisible(false);
            setTimeout(() => {
                // clearStatusMessage() // Old store action
                if (id)
                    removeNotification(id); // Use new action with id
            }, 300);
        }
    };
    const handleMouseEnter = () => {
        setIsHovered(true);
    };
    const handleMouseLeave = () => {
        setIsHovered(false);
        // Restart timer if not persistent
        if (!persistent) {
            setTimeout(() => {
                if (!isHovered) {
                    setVisible(false);
                    setTimeout(() => {
                        // clearStatusMessage() // Old store action
                        if (id)
                            removeNotification(id); // Use new action with id
                    }, 300);
                }
            }, 1000); // Short delay before auto-dismiss resumes
        }
    };
    const getIcon = () => {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'info': return 'fas fa-info-circle';
            default: return 'fas fa-info-circle';
        }
    };
    return (_jsxs("div", { className: `${styles.statusMessage} ${styles[type]} ${styles[priority]} ${visible ? styles.visible : styles.hidden}`, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, "data-notification-id": id, children: [_jsxs("div", { className: styles.content, children: [_jsx("i", { className: getIcon() }), _jsx("span", { className: styles.text, children: message }), dismissible && (_jsx("button", { className: styles.dismissButton, onClick: handleDismiss, title: "Dismiss notification", children: _jsx("i", { className: "fas fa-times" }) }))] }), priority === 'high' && (_jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progressFill, style: { animationDuration: `${duration}ms` } }) }))] }));
};
