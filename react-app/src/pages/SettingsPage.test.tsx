import { render, screen } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import '@testing-library/jest-dom';
import { vi } from 'vitest'; // Import vi for mocking

// Mock child components to isolate testing for now
// As more panels are tested, their actual components can be rendered
// or more specific mocks created.

// Mocking the actual panels for now to focus on their presence.
// Later tests can render the actual panels.
vi.mock('../components/settings/NetworkSettingsPanel', () => ({ default: () => <div data-testid="network-settings-panel">Network Settings Panel Mock</div>}));
vi.mock('../components/settings/PerformanceSettingsPanel', () => ({ default: () => <div data-testid="performance-settings-panel">Performance Settings Panel Mock</div>}));
vi.mock('../components/settings/ImportExportPanel', () => ({ default: () => <div data-testid="import-export-panel">Import/Export Panel Mock</div>}));
// We also need to mock ThemeSettingsPanel as it's part of SettingsPage
vi.mock('../components/settings/ThemeSettingsPanel', () => ({ default: () => <div data-testid="theme-settings-panel">Theme Settings Panel Mock</div>}));


describe('SettingsPage', () => {
  it('should render the main title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Configuration & Settings')).toBeInTheDocument();
  });

  it('should render the NetworkSettingsPanel (mocked)', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('network-settings-panel')).toBeInTheDocument();
    expect(screen.getByText('Network Settings Panel Mock')).toBeInTheDocument();
  });

  // Placeholder for other panel tests
  it('should render the PerformanceSettingsPanel (mocked)', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('performance-settings-panel')).toBeInTheDocument();
  });

  it('should render the ImportExportPanel (mocked)', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('import-export-panel')).toBeInTheDocument();
  });

  it('should render the ThemeSettingsPanel (mocked)', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('theme-settings-panel')).toBeInTheDocument();
  });
});
