import React from 'react';
import { FixtureCanvas2D } from './FixtureCanvas2D';
import { useStore } from '../../store';

/**
 * Wrapper component for FixtureCanvas2D that connects to the store
 * This allows the 2D canvas to be used as a droppable component in the panel system
 */
export const FixtureCanvas2DWrapper: React.FC = () => {
  const { 
    fixtures, 
    fixtureLayout: placedFixtures, 
    setFixtureLayout 
  } = useStore(state => ({
    fixtures: state.fixtures,
    fixtureLayout: state.fixtureLayout,
    setFixtureLayout: state.setFixtureLayout
  }));

  const handleUpdatePlacedFixtures = (updatedFixtures: any[]) => {
    setFixtureLayout(updatedFixtures);
  };

  return (
    <FixtureCanvas2D
      fixtures={fixtures}
      placedFixturesData={placedFixtures}
      onUpdatePlacedFixtures={handleUpdatePlacedFixtures}
    />
  );
};
