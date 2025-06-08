import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Wraps any icon component with a span that handles className and other props safely.
 * This solves the "Cannot read properties of undefined (reading 'className')" error
 * that occurs with Lucide icons.
 *
 * @param IconComponent The icon component to wrap
 * @param props Props to pass to the icon and wrapper
 * @returns The wrapped icon component
 */
export const IconWrapper = ({ IconComponent, className, size = 24, strokeWidth = 1.5, color, ...restProps }) => {
    if (!IconComponent) {
        console.error('Invalid IconComponent provided to IconWrapper');
        return null;
    }
    // Safely apply className to a container span instead of directly to the icon
    return (_jsx("span", { className: className || undefined, children: _jsx(IconComponent, { size: size, color: color, strokeWidth: strokeWidth, ...restProps }) }));
};
export default IconWrapper;
