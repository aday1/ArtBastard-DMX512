import React from 'react';
import { FixtureCanvasKonva } from './FixtureCanvasKonva';
import { useStore } from '../../store';

/**
 * Wrapper component for FixtureCanvasKonva that connects to the store
 * This allows the 2D canvas to be used as a droppable component in the panel system
 * Now using Konva.js for professional 2D rendering with MIDI/OSC quick access
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
    <FixtureCanvasKonva
      fixtures={fixtures}
      placedFixturesData={placedFixtures}
      onUpdatePlacedFixtures={handleUpdatePlacedFixtures}
    />
  );
};
