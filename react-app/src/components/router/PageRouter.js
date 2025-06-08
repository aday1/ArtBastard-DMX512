import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useRouter } from '../../context/RouterContext';
import MainPage from '../../pages/MainPage';
import ControlSetupPage from '../../pages/ControlSetupPage';
import FixturePage from '../../pages/FixturePage';
import SceneLibraryPage from '../../pages/SceneLibraryPage';
import AudioAnalysisPage from '../../pages/AudioAnalysisPage';
import RemoteControlPage from '../../pages/RemoteControlPage';
import SettingsPage from '../../pages/SettingsPage';
const PageRouter = () => {
    const { currentView } = useRouter();
    const renderCurrentPage = () => {
        switch (currentView) {
            case 'main':
                return _jsx(MainPage, {});
            case 'midiOsc':
                return _jsx(ControlSetupPage, {});
            case 'fixture':
                return _jsx(FixturePage, {});
            case 'scenes':
                return _jsx(SceneLibraryPage, {});
            case 'audio':
                return _jsx(AudioAnalysisPage, {});
            case 'touchosc':
                return _jsx(RemoteControlPage, {});
            case 'misc':
                return _jsx(SettingsPage, {});
            default:
                return _jsx(MainPage, {});
        }
    };
    return _jsx(_Fragment, { children: renderCurrentPage() });
};
export default PageRouter;
