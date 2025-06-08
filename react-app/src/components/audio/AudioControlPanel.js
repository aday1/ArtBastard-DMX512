import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AudioFFT } from './AudioFFT';
import { FFTOSCAssignment } from './FFTOSCAssignment';
import styles from './AudioControlPanel.module.scss';
export const AudioControlPanel = () => {
    const [selectedBand, setSelectedBand] = useState(null);
    const [selectedRange, setSelectedRange] = useState(null);
    const handleBandSelect = (bandInfo) => {
        setSelectedBand(bandInfo);
        setSelectedRange(null); // Clear range when selecting single band
    };
    const handleRangeSelect = (start, end) => {
        setSelectedRange({ start, end });
        setSelectedBand(null); // Clear single band when selecting range
    };
    return (_jsxs("div", { className: styles.audioControlPanel, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { children: "Audio Control Center" }), _jsx("p", { children: "Real-time audio analysis with OSC output mapping" })] }), "      ", _jsx("div", { className: styles.fftSection, children: _jsx(AudioFFT, { onBandSelect: handleBandSelect }) }), _jsx("div", { className: styles.assignmentSection, children: _jsx(FFTOSCAssignment, { selectedBand: selectedBand, selectedRange: selectedRange }) })] }));
};
