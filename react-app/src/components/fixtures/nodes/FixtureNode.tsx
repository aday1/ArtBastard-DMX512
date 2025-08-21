import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Fixture, PlacedFixture } from '../../../store';
import { LucideIcon } from '../../ui/LucideIcon';
import styles from './FixtureNode.module.scss';

interface FixtureNodeData {
  fixture: Fixture;
  placedFixture: PlacedFixture;
  onSelect: () => void;
  onChannelChange: (channelIndex: number, value: number) => void;
  onMidiLearn: (channelIndex: number) => void;
  onOscCopy: (channelIndex: number) => void;
}

export const FixtureNode: React.FC<NodeProps<FixtureNodeData>> = ({ data, selected }) => {
  const { fixture, placedFixture, onSelect } = data;

  const getFixtureColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'moving-head': '#ff6b6b',
      'par': '#4ecdc4',
      'strip': '#45b7d1',
      'laser': '#96ceb4',
      'strobe': '#feca57',
      'smoke': '#a55eea',
      default: '#fd79a8',
    };
    return colorMap[type.toLowerCase()] || colorMap.default;
  };

  const getFixtureIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      'moving-head': 'Zap',
      'par': 'Circle',
      'strip': 'Minus',
      'laser': 'Target',
      'strobe': 'FlashLight',
      'smoke': 'Cloud',
      default: 'Lightbulb',
    };
    return iconMap[type.toLowerCase()] || iconMap.default;
  };

  return (
    <div 
      className={`${styles.fixtureNode} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
      style={{ borderColor: getFixtureColor(fixture.type) }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />

      {/* Fixture Visual */}
      <div 
        className={styles.fixtureIcon}
        style={{ backgroundColor: getFixtureColor(fixture.type) }}
      >
        <LucideIcon name={getFixtureIcon(fixture.type)} />
      </div>

      {/* Fixture Info */}
      <div className={styles.fixtureInfo}>
        <div className={styles.fixtureName}>{fixture.name}</div>
        <div className={styles.fixtureType}>{fixture.type}</div>
        <div className={styles.fixtureAddress}>@{placedFixture.startAddress}</div>
        <div className={styles.channelCount}>
          {fixture.channels.length} channels
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            data.onMidiLearn(0); // MIDI learn for first channel
          }}
          title="MIDI Learn"
        >
          <LucideIcon name="Music" />
        </button>
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            data.onOscCopy(0); // OSC copy for first channel
          }}
          title="Copy OSC Address"
        >
          <LucideIcon name="Copy" />
        </button>
      </div>

      {/* Status Indicators */}
      <div className={styles.statusIndicators}>
        <div className={styles.statusDot} title="Online" />
        {fixture.channels.length > 1 && (
          <div className={styles.multiChannel} title="Multi-channel fixture">
            {fixture.channels.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default FixtureNode;
