import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FixtureSetup } from '../components/fixtures/FixtureSetup';
import styles from './Pages.module.scss';
const FixturePage = () => {
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Fixture Management" }), _jsx("p", { children: "Configure and manage DMX fixtures and lighting equipment" })] }), _jsx("div", { className: styles.pageContent, children: _jsx("div", { className: styles.setupSection, children: _jsx(FixtureSetup, {}) }) })] }));
};
export default FixturePage;
