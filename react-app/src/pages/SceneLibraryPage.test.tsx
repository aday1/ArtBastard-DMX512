import { render, screen } from '@testing-library/react';
import SceneLibraryPage from './SceneLibraryPage';
import '@testing-library/jest-dom';
import { vi } from 'vitest'; // Import vi for mocking

// Mock child components that are not relevant to this specific test
vi.mock('../components/scenes/SceneGallery', () => ({ default: () => <div data-testid="scene-gallery">Scene Gallery</div> }));
vi.mock('../components/scenes/AutoSceneControlMini', () => ({ default: () => <div data-testid="auto-scene-control-mini">Auto Scene Control Mini</div> }));

describe('SceneLibraryPage', () => {
  it('should render the page title and sections', () => {
    render(<SceneLibraryPage />);
    expect(screen.getByText('Scene Library')).toBeInTheDocument();
    expect(screen.getByTestId('scene-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('auto-scene-control-mini')).toBeInTheDocument();
  });

  it('should NOT render the SceneQuickLaunch component', () => {
    render(<SceneLibraryPage />);
    // Assuming SceneQuickLaunch had a unique identifiable text or element.
    // If SceneQuickLaunch itself rendered a specific title like "Quick Launch", we query for its absence.
    // Or, if it had a specific data-testid, we'd query for that.
    // For this example, let's assume the "Quick Launch" h3 title was unique to it.
    expect(screen.queryByRole('heading', { name: /Quick Launch/i })).not.toBeInTheDocument();
  });
});
