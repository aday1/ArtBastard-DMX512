import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FixtureSetup } from '../components/fixtures/FixtureSetup';
import { DMXChannelGrid } from '../components/dmx/DMXChannelGrid';
import { DmxWebglVisualizer } from '../components/dmx/DmxWebglVisualizer';
import styles from './Pages.module.scss';
const FixturePage = () => {
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Fixture Management" }), _jsx("p", { children: "Configure and manage DMX fixtures and lighting equipment" })] }), _jsxs("div", { className: styles.pageContent, children: [_jsx("div", { className: styles.setupSection, children: _jsx(FixtureSetup, {}) }), _jsxs("div", { className: styles.visualizationSection, children: [_jsxs("div", { className: styles.visualPanel, children: [_jsx("h3", { children: "DMX Channel Grid" }), _jsx(DMXChannelGrid, {})] }), _jsxs("div", { className: styles.visualPanel, children: [_jsx("h3", { children: "3D Visualizer" }), _jsx(DmxWebglVisualizer, {})] })] })] })] }));
};
export default FixturePage;
