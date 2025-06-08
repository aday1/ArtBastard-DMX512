import { jsx as _jsx } from "react/jsx-runtime";
import { FixtureCanvas2D } from './FixtureCanvas2D';
import { useStore } from '../../store';
/**
 * Wrapper component for FixtureCanvas2D that connects to the store
 * This allows the 2D canvas to be used as a droppable component in the panel system
 */
export const FixtureCanvas2DWrapper = () => {
    const { fixtures, fixtureLayout: placedFixtures, setFixtureLayout } = useStore(state => ({
        fixtures: state.fixtures,
        fixtureLayout: state.fixtureLayout,
        setFixtureLayout: state.setFixtureLayout
    }));
    const handleUpdatePlacedFixtures = (updatedFixtures) => {
        setFixtureLayout(updatedFixtures);
    };
    return (_jsx(FixtureCanvas2D, { fixtures: fixtures, placedFixturesData: placedFixtures, onUpdatePlacedFixtures: handleUpdatePlacedFixtures }));
};
