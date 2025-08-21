import React from 'react';
import { FixtureCanvasKonva } from './FixtureCanvasKonva';

// Demo data for testing the new Konva canvas
const demoFixtures = [
  {
    id: 'fixture_1',
    name: 'Moving Head 1',
    type: 'moving_head',
    startAddress: 1,
    channels: [
      { name: 'pan', type: 'movement' },
      { name: 'tilt', type: 'movement' },
      { name: 'dimmer', type: 'intensity' },
      { name: 'color', type: 'color' }
    ]
  },
  {
    id: 'fixture_2',
    name: 'LED Par',
    type: 'led_par',
    startAddress: 10,
    channels: [
      { name: 'red', type: 'color' },
      { name: 'green', type: 'color' },
      { name: 'blue', type: 'color' },
      { name: 'white', type: 'color' },
      { name: 'dimmer', type: 'intensity' }
    ]
  }
];

const demoPlacedFixtures = [
  {
    id: 'demo_1',
    fixtureId: 'fixture_1',
    name: 'Moving Head 1',
    fixtureStoreId: 'Moving Head 1',
    startAddress: 1,
    x: 200,
    y: 150,
    radius: 20,
    color: '#ff0000',
    controls: [
      {
        id: 'ctrl_1',
        label: 'Pan/Tilt',
        type: 'xypad' as const,
        channelNameInFixture: 'pan',
        xOffset: 80,
        yOffset: 0,
        currentValue: 127,
        panValue: 127,
        tiltValue: 127
      },
      {
        id: 'ctrl_2',
        label: 'Dimmer',
        type: 'slider' as const,
        channelNameInFixture: 'dimmer',
        xOffset: -80,
        yOffset: 0,
        currentValue: 255
      }
    ]
  },
  {
    id: 'demo_2',
    fixtureId: 'fixture_2',
    name: 'LED Par 1',
    fixtureStoreId: 'LED Par',
    startAddress: 10,
    x: 400,
    y: 200,
    radius: 15,
    color: '#00ff00',
    controls: [
      {
        id: 'ctrl_3',
        label: 'Red',
        type: 'slider' as const,
        channelNameInFixture: 'red',
        xOffset: -60,
        yOffset: -40,
        currentValue: 128
      },
      {
        id: 'ctrl_4',
        label: 'Green',
        type: 'slider' as const,
        channelNameInFixture: 'green',
        xOffset: 0,
        yOffset: -40,
        currentValue: 200
      },
      {
        id: 'ctrl_5',
        label: 'Blue',
        type: 'slider' as const,
        channelNameInFixture: 'blue',
        xOffset: 60,
        yOffset: -40,
        currentValue: 50
      }
    ]
  }
];

/**
 * Demo component showcasing the new Konva-based 2D Canvas
 * Features:
 * - Professional rendering with Konva.js
 * - MIDI Learn/Forget buttons for all controls
 */
export const FixtureCanvasDemo: React.FC = () => {
  const [placedFixtures, setPlacedFixtures] = React.useState(demoPlacedFixtures);

  const handleUpdatePlacedFixtures = (updatedFixtures: any[]) => {
    setPlacedFixtures(updatedFixtures);
    console.log('Demo: Fixtures updated:', updatedFixtures);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h2 style={{ 
        color: '#ffffff', 
        marginBottom: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        🎭 New Professional 2D Canvas with Konva.js
      </h2>
      
      <div style={{ 
        color: '#cccccc', 
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        ✨ Features: MIDI Learn/Forget • OSC Quick Copy • Interactive Controls • Grid Snapping • Professional Animations
      </div>

      <FixtureCanvasKonva
        fixtures={demoFixtures}
        placedFixturesData={placedFixtures}
        onUpdatePlacedFixtures={handleUpdatePlacedFixtures}
      />
      
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(0, 255, 0, 0.1)',
        borderRadius: '6px',
        border: '1px solid rgba(0, 255, 0, 0.2)',
        color: '#00ff88',
        fontSize: '12px'
      }}>
        <strong>How to use:</strong> Hover over fixtures to see MIDI/OSC controls • Click and drag to move fixtures • 
        Interact with controls directly on canvas • Use MIDI Learn buttons for quick assignment • Copy OSC addresses with one click
      </div>
    </div>
  );
};
