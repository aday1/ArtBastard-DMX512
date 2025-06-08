import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import '@testing-library/jest-dom';
// Mock child components to isolate testing for now
// As more panels are tested, their actual components can be rendered
// or more specific mocks created.
// Mocking the actual panels for now to focus on their presence.
// Later tests can render the actual panels.
jest.mock('../components/settings/NetworkSettingsPanel', () => () => _jsx("div", { "data-testid": "network-settings-panel", children: "Network Settings Panel Mock" }));
jest.mock('../components/settings/PerformanceSettingsPanel', () => () => _jsx("div", { "data-testid": "performance-settings-panel", children: "Performance Settings Panel Mock" }));
jest.mock('../components/settings/ImportExportPanel', () => () => _jsx("div", { "data-testid": "import-export-panel", children: "Import/Export Panel Mock" }));
// We also need to mock ThemeSettingsPanel as it's part of SettingsPage
jest.mock('../components/settings/ThemeSettingsPanel', () => () => _jsx("div", { "data-testid": "theme-settings-panel", children: "Theme Settings Panel Mock" }));
describe('SettingsPage', () => {
    it('should render the main title', () => {
        render(_jsx(SettingsPage, {}));
        expect(screen.getByText('Configuration & Settings')).toBeInTheDocument();
    });
    it('should render the NetworkSettingsPanel (mocked)', () => {
        render(_jsx(SettingsPage, {}));
        expect(screen.getByTestId('network-settings-panel')).toBeInTheDocument();
        expect(screen.getByText('Network Settings Panel Mock')).toBeInTheDocument();
    });
    // Placeholder for other panel tests
    it('should render the PerformanceSettingsPanel (mocked)', () => {
        render(_jsx(SettingsPage, {}));
        expect(screen.getByTestId('performance-settings-panel')).toBeInTheDocument();
    });
    it('should render the ImportExportPanel (mocked)', () => {
        render(_jsx(SettingsPage, {}));
        expect(screen.getByTestId('import-export-panel')).toBeInTheDocument();
    });
    it('should render the ThemeSettingsPanel (mocked)', () => {
        render(_jsx(SettingsPage, {}));
        expect(screen.getByTestId('theme-settings-panel')).toBeInTheDocument();
    });
});
