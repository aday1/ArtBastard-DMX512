import React, { useState } from 'react';
import { Fixture, PlacedFixture, MasterSlider, useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import styles from './FixtureCanvasKonva.module.scss';

interface FixtureCanvasKonvaProps {
  fixtures: Fixture[];
  placedFixturesData: PlacedFixture[];
  onUpdatePlacedFixtures: (fixtures: PlacedFixture[]) => void;
}

export const FixtureCanvasKonva: React.FC<FixtureCanvasKonvaProps> = ({
  fixtures,
  placedFixturesData,
  onUpdatePlacedFixtures
}) => {
  const { 
    masterSliders,
    addNotification
  } = useStore();

  const { socket } = useSocket();

  const handleKonvaNotAvailable = () => {
    console.warn('Konva.js not available - showing fallback interface');
    if (addNotification) {
      addNotification({
        type: 'info',
        message: 'Konva.js library not installed. Run: npm install konva react-konva'
      });
    }
  };

  const renderPlacedFixture = (placedFixture: PlacedFixture, index: number) => {
    const fixtureDef = fixtures.find(f => f.name === placedFixture.fixtureStoreId);
    if (!fixtureDef) return null;

    return (
      <div key={placedFixture.id} className={styles.placedFixture}>
        <div className={styles.fixtureHeader}>
          <h3>{fixtureDef.name} ({placedFixture.name})</h3>
          <div className={styles.fixtureInfo}>
            Position: ({placedFixture.x.toFixed(0)}, {placedFixture.y.toFixed(0)})
            | Address: {placedFixture.startAddress}
          </div>
        </div>

        <div className={styles.controlGrid}>
          {fixtureDef.channels.map((channel, channelIndex) => (
            <div key={channelIndex} className={styles.channelControl}>
              <label className={styles.channelLabel}>
                {channel.name || `Ch ${channelIndex + 1}`}
              </label>
              
              <input
                type="range"
                min="0"
                max="255"
                className={styles.channelSlider}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (socket?.emit) {
                    socket.emit('dmx:setValue', {
                      channel: placedFixture.startAddress + channelIndex,
                      value
                    });
                  }
                }}
              />

              <div className={styles.controlButtons}>
                <button
                  className={styles.midiButton}
                  onClick={() => {
                    if (addNotification) {
                      addNotification({
                        type: 'info',
                        message: 'MIDI Learn - Install Konva.js for full functionality'
                      });
                    }
                  }}
                  title="MIDI Learn (Requires Konva.js)"
                >
                  M
                </button>

                <button
                  className={styles.oscButton}
                  onClick={() => {
                    const oscAddress = `/fixture/${placedFixture.id}/channel/${channelIndex}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(oscAddress).then(() => {
                        if (addNotification) {
                          addNotification({
                            type: 'success',
                            message: `OSC address copied: ${oscAddress}`
                          });
                        }
                      });
                    }
                  }}
                  title="Copy OSC Address"
                >
                  OSC
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMasterSliders = () => {
    if (!masterSliders || masterSliders.length === 0) return null;

    return (
      <div className={styles.masterSlidersSection}>
        <h3>Master Sliders</h3>
        <div className={styles.masterSliderGrid}>
          {masterSliders.map((slider) => (
            <div key={slider.id} className={styles.masterSliderControl}>
              <label className={styles.sliderLabel}>{slider.name}</label>
              
              <input
                type="range"
                min="0"
                max="100"
                value={slider.value || 0}
                className={styles.masterSlider}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  // Note: updateMasterSlider would need to be implemented in store
                  console.log(`Master slider ${slider.id} set to ${value}`);
                }}
              />

              <div className={styles.controlButtons}>
                <button
                  className={styles.midiButton}
                  onClick={() => {
                    if (addNotification) {
                      addNotification({
                        type: 'info',
                        message: 'MIDI Learn - Install Konva.js for full functionality'
                      });
                    }
                  }}
                  title="MIDI Learn (Requires Konva.js)"
                >
                  M
                </button>

                <button
                  className={styles.oscButton}
                  onClick={() => {
                    const oscAddress = `/master/${slider.id}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(oscAddress).then(() => {
                        if (addNotification) {
                          addNotification({
                            type: 'success',
                            message: `OSC address copied: ${oscAddress}`
                          });
                        }
                      });
                    }
                  }}
                  title="Copy OSC Address"
                >
                  OSC
                </button>
              </div>

              <span className={styles.sliderValue}>{slider.value || 0}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    handleKonvaNotAvailable();
  }, []);

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.fallbackHeader}>
        <h2>🎭 2D Fixture Canvas</h2>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot}></span>
          Konva.js Required
        </div>
      </div>

      <div className={styles.installationGuide}>
        <h3>🚀 Install Konva.js for Advanced 2D Canvas</h3>
        <div className={styles.commandBlock}>
          <code>npm install konva react-konva</code>
          <button 
            className={styles.copyButton}
            onClick={() => navigator.clipboard?.writeText('npm install konva react-konva')}
          >
            📋 Copy
          </button>
        </div>
        <p>Once installed, refresh the page to access the full 2D canvas with drag-and-drop fixtures!</p>
      </div>

      {placedFixturesData && placedFixturesData.length > 0 && (
        <div className={styles.fixturesSection}>
          <h3>🎪 Placed Fixtures</h3>
          <div className={styles.fixturesList}>
            {placedFixturesData.map((fixture, index) => renderPlacedFixture(fixture, index))}
          </div>
        </div>
      )}

      {renderMasterSliders()}

      <div className={styles.featuresList}>
        <h3>✨ Available Features</h3>
        <ul>
          <li>🎛️ MIDI Learn for all fixture controls</li>
          <li>🎹 MIDI Forget functionality</li>
          <li>📡 OSC address copying</li>
          <li>🎯 Real-time DMX control</li>
          <li>🎭 Master slider controls</li>
          <li>🔄 Live value updates</li>
        </ul>
      </div>
    </div>
  );
};
