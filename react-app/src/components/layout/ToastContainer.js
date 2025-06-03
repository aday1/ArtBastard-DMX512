import { jsx as _jsx } from "react/jsx-runtime";
import { useStore } from '../../store';
import { StatusMessage } from './StatusMessage';
import styles from './ToastContainer.module.scss';
export const ToastContainer = () => {
    const notifications = useStore((state) => state.notifications);
    if (!notifications || notifications.length === 0) {
        return null;
    }
    return (_jsx("div", { className: styles.toastContainer, children: notifications.map((notification, index) => (_jsx("div", { className: styles.toastWrapper, style: {
                '--toast-index': index,
                '--total-toasts': notifications.length
            }, children: _jsx(StatusMessage, { id: notification.id, message: notification.message, type: notification.type, priority: notification.priority, persistent: notification.persistent, dismissible: notification.dismissible }) }, notification.id))) }));
};
