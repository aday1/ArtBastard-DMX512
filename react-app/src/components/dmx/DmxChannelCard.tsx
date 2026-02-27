import React from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import styles from '../pages/DmxChannelControlPage.module.scss';

interface DmxChannelCardProps {
  channelIndex: number;
  value: number;
  channelName: string;
  isSelected: boolean;
  highlighted: boolean;
  hasMidiMapping: boolean;
  isChannelLearning: boolean;
  mapping: any;
  fixtureInfo: any;
  hasFixtureAssignment: boolean;
  fixtureColor: string;
  isEditingName: boolean;
  hasCustomName: boolean;
  channelColor?: string;
  envelopeAutomation: any;
  showMidiControls: boolean;
  showOscControls: boolean;
  editingChannelNameValue: string;
  setEditingChannelNameValue: (value: string) => void;
  getChannelRange: (channelIndex: number) => { min: number; max: number };
  setChannelRange: (channelIndex: number, min: number, max: number) => void;
  setDmxChannel: (channelIndex: number, value: number) => void;
  toggleEnvelope: (envelopeId: string) => void;
  handleSaveChannelName: (channelIndex: number) => void;
  handleCancelEditName: () => void;
  handleStartEditName: (channelIndex: number, event: React.MouseEvent) => void;
  toggleChannelSelection: (channelIndex: number) => void;
  setRandomChannelColor: (channelIndex: number) => void;
  addNotification: (payload: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
  isPinned: boolean;
  togglePinChannel: (channelIndex: number) => void;
  handleMidiLearn: (channelIndex: number) => void;
  handleMidiForget: (channelIndex: number) => void;
  handleSetOscAddress: (channelIndex: number) => void;
  oscAddress?: string;
}

export const DmxChannelCard: React.FC<DmxChannelCardProps> = ({
  channelIndex,
  value,
  channelName,
  isSelected,
  highlighted,
  hasMidiMapping,
  isChannelLearning,
  mapping,
  fixtureInfo,
  hasFixtureAssignment,
  fixtureColor,
  isEditingName,
  hasCustomName,
  channelColor,
  envelopeAutomation,
  showMidiControls,
  showOscControls,
  editingChannelNameValue,
  setEditingChannelNameValue,
  getChannelRange,
  setChannelRange,
  setDmxChannel,
  toggleEnvelope,
  handleSaveChannelName,
  handleCancelEditName,
  handleStartEditName,
  toggleChannelSelection,
  setRandomChannelColor,
  addNotification,
  isPinned,
  togglePinChannel,
  handleMidiLearn,
  handleMidiForget,
  handleSetOscAddress,
  oscAddress,
}) => {
  return (
    <div
      id={`dmx-channel-${channelIndex}`}
      className={`${styles.dmxChannel} ${isSelected ? styles.selected : ''} ${value > 0 ? styles.active : ''} ${highlighted ? styles.highlighted : ''} ${hasCustomName ? styles.hasName : ''} ${hasFixtureAssignment ? styles.fixtureAssigned : ''} ${channelColor ? styles.hasColor : ''}`}
      style={{
        borderColor: hasFixtureAssignment
          ? fixtureColor
          : (channelColor || (hasCustomName ? '#10b981' : undefined)),
        borderWidth: channelColor
          ? '4px'
          : (hasFixtureAssignment || hasCustomName ? '2px' : undefined),
        borderLeftWidth: hasFixtureAssignment ? '4px' : (channelColor ? '6px' : undefined),
        backgroundColor: channelColor && !hasFixtureAssignment
          ? `${channelColor}25`
          : (hasFixtureAssignment && fixtureColor
            ? `${fixtureColor}15`
            : undefined),
        backgroundImage: channelColor && !hasFixtureAssignment
          ? `linear-gradient(135deg, ${channelColor}20 0%, ${channelColor}10 100%)`
          : (hasFixtureAssignment && fixtureColor
            ? `linear-gradient(135deg, ${fixtureColor}12 0%, ${fixtureColor}08 100%)`
            : undefined),
      }}
    >
      <div className={styles.channelHeader}>
        <div className={styles.channelInfo}>
          <span className={styles.channelNumber}>{channelIndex + 1}</span>
          {hasFixtureAssignment && fixtureInfo && (
            <div className={styles.fixtureLabel} style={{ color: fixtureColor }}>
              <LucideIcon name="LampDesk" size={12} />
              <span>{fixtureInfo.fixtureName}</span>
              {fixtureInfo.channelName && (
                <span className={styles.fixtureChannelFunction}> • {fixtureInfo.channelName}</span>
              )}
            </div>
          )}
          {isEditingName ? (
            <div className={styles.channelNameEdit}>
              <input
                type="text"
                value={editingChannelNameValue}
                onChange={(e) => setEditingChannelNameValue(e.target.value)}
                onBlur={() => handleSaveChannelName(channelIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveChannelName(channelIndex);
                  } else if (e.key === 'Escape') {
                    handleCancelEditName();
                  }
                }}
                autoFocus
                className={styles.channelNameInput}
              />
            </div>
          ) : (
            <div className={styles.channelNameWrapper}>
              <span
                className={styles.channelName}
                onDoubleClick={(e) => handleStartEditName(channelIndex, e)}
                title={hasFixtureAssignment
                  ? `Fixture: ${fixtureInfo?.fixtureName} | Channel: ${fixtureInfo?.channelName} | Type: ${fixtureInfo?.channelType}${channelName ? ` | Custom: ${channelName}` : ''} | Double-click to edit`
                  : 'Double-click to edit name'}
                style={{ cursor: 'pointer' }}
              >
                {hasFixtureAssignment
                  ? fixtureInfo?.channelName
                  : (channelName || `CH ${channelIndex + 1}`)}
                <small>{value > 0 ? 'Active' : '(Idle)'}</small>
              </span>
            </div>
          )}
        </div>
        <div className={styles.channelHeaderActions}>
          {(() => {
            const channelEnvelope = envelopeAutomation.envelopes.find((envelope: any) => envelope.channel === channelIndex);
            const hasEnvelope = !!channelEnvelope;
            const envelopeEnabled = channelEnvelope?.enabled ?? false;

            if (hasEnvelope) {
              return (
                <button
                  className={`${styles.envelopeToggleButton} ${envelopeEnabled ? styles.active : ''}`}
                  onClick={() => channelEnvelope && toggleEnvelope(channelEnvelope.id)}
                  title={envelopeEnabled ? 'Stop Envelope' : 'Start Envelope'}
                  disabled={!envelopeAutomation.globalEnabled}
                >
                  <LucideIcon name={envelopeEnabled ? 'Square' : 'Play'} size={14} />
                  {envelopeEnabled ? 'Stop' : 'Start'}
                </button>
              );
            }
            return null;
          })()}
          <div className={styles.channelValue}>
            <span className={styles.valueDisplay}>{value}</span>
            <span className={styles.valuePercent}>{Math.round((value / 255) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className={styles.channelSlider}>
        <input
          type="range"
          min={getChannelRange(channelIndex).min}
          max={getChannelRange(channelIndex).max}
          value={value}
          onChange={(e) => setDmxChannel(channelIndex, parseInt(e.target.value, 10))}
          className={styles.slider}
        />
      </div>

      <div className={styles.channelRangeControls}>
        <div className={styles.rangeInputGroup}>
          <label className={styles.rangeLabel}>MIN</label>
          <input
            type="range"
            min="0"
            max="255"
            value={getChannelRange(channelIndex).min}
            onChange={(e) => {
              const newMin = parseInt(e.target.value, 10);
              const currentMax = getChannelRange(channelIndex).max;
              setChannelRange(channelIndex, newMin, Math.max(newMin, currentMax));
            }}
            className={styles.rangeSlider}
          />
          <input
            type="number"
            min="0"
            max="255"
            value={getChannelRange(channelIndex).min}
            onChange={(e) => {
              const newMin = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
              const currentMax = getChannelRange(channelIndex).max;
              setChannelRange(channelIndex, newMin, Math.max(newMin, currentMax));
            }}
            className={styles.rangeInput}
          />
        </div>
        <div className={styles.rangeInputGroup}>
          <label className={styles.rangeLabel}>MAX</label>
          <input
            type="range"
            min="0"
            max="255"
            value={getChannelRange(channelIndex).max}
            onChange={(e) => {
              const newMax = parseInt(e.target.value, 10);
              const currentMin = getChannelRange(channelIndex).min;
              setChannelRange(channelIndex, Math.min(currentMin, newMax), newMax);
            }}
            className={styles.rangeSlider}
          />
          <input
            type="number"
            min="0"
            max="255"
            value={getChannelRange(channelIndex).max}
            onChange={(e) => {
              const newMax = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 255));
              const currentMin = getChannelRange(channelIndex).min;
              setChannelRange(channelIndex, Math.min(currentMin, newMax), newMax);
            }}
            className={styles.rangeInput}
          />
        </div>
      </div>

      <div
        className={styles.channelActions}
        style={channelColor ? {
          backgroundColor: `${channelColor}08`,
          borderColor: `${channelColor}20`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '8px',
          padding: '8px',
        } : undefined}
      >
        <button
          className={`${styles.selectButton} ${isSelected ? styles.selected : ''}`}
          onClick={() => toggleChannelSelection(channelIndex)}
          title="Select/Deselect channel"
        >
          <LucideIcon name={isSelected ? 'CheckSquare' : 'Square'} />
        </button>

        <button
          className={styles.colorButton}
          onClick={() => {
            setRandomChannelColor(channelIndex);
            addNotification({
              type: 'success',
              message: `Random color set for channel ${channelIndex + 1}`
            });
          }}
          title="Set random color for this channel (for visual organization)"
          style={{
            backgroundColor: channelColor
              ? `${channelColor}20`
              : undefined,
            borderColor: channelColor || undefined,
            borderWidth: channelColor ? '1px' : undefined,
          }}
        >
          <LucideIcon name="Palette" />
        </button>

        <button
          className={`${styles.pinButton} ${isPinned ? styles.pinned : ''}`}
          onClick={() => togglePinChannel(channelIndex)}
          title={isPinned ? 'Unpin channel' : 'Pin channel to left sidebar'}
        >
          <LucideIcon name={isPinned ? 'Pin' : 'PinOff'} />
        </button>

        {showMidiControls && (
          <div className={styles.midiControls}>
            <button
              className={`${styles.midiLearnButton} ${isChannelLearning ? styles.learning : ''} ${hasMidiMapping ? styles.mapped : ''}`}
              onClick={() => handleMidiLearn(channelIndex)}
              title={isChannelLearning ? 'Cancel MIDI Learn' : hasMidiMapping ? 'Remap MIDI' : 'Learn MIDI'}
            >
              <LucideIcon name={isChannelLearning ? 'Radio' : hasMidiMapping ? 'Unlink' : 'Link'} />
              {isChannelLearning ? 'Learning...' : hasMidiMapping ? 'Mapped' : 'Learn'}
            </button>

            {hasMidiMapping && !isChannelLearning && (
              <button
                className={styles.midiForgetButton}
                onClick={() => handleMidiForget(channelIndex)}
                title="Remove MIDI mapping"
              >
                <LucideIcon name="Trash2" />
                Forget
              </button>
            )}
          </div>
        )}

        {showOscControls && (
          <div className={styles.oscControls}>
            <button
              className={styles.oscAddressButton}
              onClick={() => handleSetOscAddress(channelIndex)}
              title="Set OSC address for this channel"
            >
              <LucideIcon name="Globe" />
              OSC
            </button>
          </div>
        )}
      </div>

      {showMidiControls && hasMidiMapping && mapping && (
        <div className={styles.midiMappingDisplay}>
          <span className={styles.midiMappingText}>
            {mapping.controller !== undefined
              ? `CC ${mapping.controller} (Ch ${mapping.channel + 1})`
              : `Note ${mapping.note} (Ch ${mapping.channel + 1})`
            }
          </span>
        </div>
      )}

      {showOscControls && oscAddress && (
        <div className={styles.oscAddressDisplay}>
          <span className={styles.oscAddressText}>
            OSC: {oscAddress}
          </span>
        </div>
      )}
    </div>
  );
};
