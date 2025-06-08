import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AudioControlPanel } from '../components/audio/AudioControlPanel';
import styles from './Pages.module.scss';
const AudioAnalysisPage = () => {
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Audio Analysis" }), _jsx("p", { children: "Real-time audio analysis and music-reactive lighting control" })] }), _jsx("div", { className: styles.pageContent, children: _jsx("div", { className: styles.audioSection, children: _jsx(AudioControlPanel, {}) }) })] }));
};
export default AudioAnalysisPage;
