import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import styles from './SignalFlashIndicator.module.scss';
export const SignalFlashIndicator = ({ position = 'bottom-left' }) => {
    const [midiFlash, setMidiFlash] = useState(false);
    const [oscFlash, setOscFlash] = useState(false);
    const midiFlashTimeoutRef = useRef();
    const oscFlashTimeoutRef = useRef();
    // Get MIDI/OSC activity from store (adjust based on your store structure)
    const midiActivity = useStore(state => state.midiActivity || 0);
    const oscActivity = useStore(state => state.oscActivity || 0);
    const lastMidiActivityRef = useRef(midiActivity);
    const lastOscActivityRef = useRef(oscActivity);
    // Flash effect for MIDI activity
    useEffect(() => {
        if (midiActivity !== lastMidiActivityRef.current) {
            setMidiFlash(true);
            // Clear existing timeout
            if (midiFlashTimeoutRef.current) {
                clearTimeout(midiFlashTimeoutRef.current);
            }
            // Set new timeout to turn off flash
            midiFlashTimeoutRef.current = setTimeout(() => {
                setMidiFlash(false);
            }, 150);
            lastMidiActivityRef.current = midiActivity;
        }
    }, [midiActivity]);
    // Flash effect for OSC activity
    useEffect(() => {
        if (oscActivity !== lastOscActivityRef.current) {
            setOscFlash(true);
            // Clear existing timeout
            if (oscFlashTimeoutRef.current) {
                clearTimeout(oscFlashTimeoutRef.current);
            }
            // Set new timeout to turn off flash
            oscFlashTimeoutRef.current = setTimeout(() => {
                setOscFlash(false);
            }, 150);
            lastOscActivityRef.current = oscActivity;
        }
    }, [oscActivity]);
    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (midiFlashTimeoutRef.current)
                clearTimeout(midiFlashTimeoutRef.current);
            if (oscFlashTimeoutRef.current)
                clearTimeout(oscFlashTimeoutRef.current);
        };
    }, []);
    return (_jsxs("div", { className: `${styles.signalContainer} ${styles[position]}`, children: [_jsxs("div", { className: `${styles.signalIndicator} ${midiFlash ? styles.midiFlash : ''}`, children: [_jsx("span", { className: styles.signalLabel, children: "MIDI" }), _jsx("div", { className: `${styles.signalDot} ${midiFlash ? styles.active : ''}` })] }), _jsxs("div", { className: `${styles.signalIndicator} ${oscFlash ? styles.oscFlash : ''}`, children: [_jsx("span", { className: styles.signalLabel, children: "OSC" }), _jsx("div", { className: `${styles.signalDot} ${oscFlash ? styles.active : ''}` })] })] }));
};
export default SignalFlashIndicator;
