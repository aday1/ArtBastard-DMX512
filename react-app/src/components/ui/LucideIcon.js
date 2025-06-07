import { jsx as _jsx } from "react/jsx-runtime";
import * as Icons from 'lucide-react';
/**
 * A wrapper component for Lucide icons that safely handles the className property.
 * This solves the "Cannot read properties of undefined (reading 'className')" error.
 */
export const LucideIcon = ({ name, size = 24, color, strokeWidth = 1.5, className, ...restProps }) => {
    // Get the icon component from the imported Icons
    const IconComponent = Icons[name];
    if (!IconComponent) {
        console.error(`Icon "${name}" does not exist in lucide-react package.`);
        console.log('Available icons:', Object.keys(Icons).slice(0, 20).join(', ') + '...');
        return _jsx("span", { className: className, children: "\u2753" });
    }
    try {
        // The span wrapper prevents the className error by being applied to the span instead
        return (_jsx("span", { className: className, children: _jsx(IconComponent, { size: size, color: color, strokeWidth: strokeWidth, ...restProps }) }));
    }
    catch (error) {
        console.error(`Error rendering icon "${name}":`, error);
        return _jsx("span", { className: className, children: "\u26A0\uFE0F" });
    }
};
/**
 * Helper function to wrap any Lucide icon component in a span with className
 * Use this when you have a direct reference to an icon component
 */
export const wrapLucideIcon = (IconComponent, props) => {
    const { className, ...iconProps } = props;
    return (_jsx("span", { className: className, children: _jsx(IconComponent, { ...iconProps }) }));
};
export default LucideIcon;
