import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SceneGallery } from '../components/scenes/SceneGallery';
import { AutoSceneControlMini } from '../components/scenes/AutoSceneControlMini';
import styles from './Pages.module.scss';
const SceneLibraryPage = () => {
    return (_jsxs("div", { className: styles.pageContainer, children: [_jsxs("div", { className: styles.pageHeader, children: [_jsx("h2", { children: "Scene Library" }), _jsx("p", { children: "Create, manage, and launch lighting scenes" })] }), _jsxs("div", { className: styles.pageContent, children: [_jsx("div", { className: styles.controlSection, children: _jsxs("div", { className: styles.autoControlPanel, children: [_jsx("h3", { children: "Auto Scene Control" }), _jsx(AutoSceneControlMini, {})] }) }), _jsx("div", { className: styles.gallerySection, children: _jsx(SceneGallery, {}) })] })] }));
};
export default SceneLibraryPage;
