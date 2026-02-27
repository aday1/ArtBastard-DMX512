import React from 'react';
import { DmxChannelCard } from './DmxChannelCard';
import styles from '../pages/DmxChannelControlPage.module.scss';

interface DmxChannelsViewportProps {
  viewMode: 'grid' | 'list' | 'compact';
  displayedChannels: number[];
  dmxChannels: number[];
  channelNames: string[];
  selectedChannels: number[];
  highlightedChannel: number | null;
  channelColors: Record<number, string>;
  pinnedChannels: number[];
  midiMappings: Record<number, any>;
  oscAssignments: string[];
  isLearning: boolean;
  currentLearningChannel: number | null;
  envelopeAutomation: any;
  showMidiControls: boolean;
  showOscControls: boolean;
  editingChannelName: number | null;
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
  togglePinChannel: (channelIndex: number) => void;
  handleMidiLearn: (channelIndex: number) => void;
  handleMidiForget: (channelIndex: number) => void;
  handleSetOscAddress: (channelIndex: number) => void;
  getChannelInfo: (channelIndex: number) => any;
  isChannelAssigned: (channelIndex: number) => boolean;
  getFixtureColor: (fixtureId: string) => string;
}

export const DmxChannelsViewport: React.FC<DmxChannelsViewportProps> = ({
  viewMode,
  displayedChannels,
  dmxChannels,
  channelNames,
  selectedChannels,
  highlightedChannel,
  channelColors,
  pinnedChannels,
  midiMappings,
  oscAssignments,
  isLearning,
  currentLearningChannel,
  envelopeAutomation,
  showMidiControls,
  showOscControls,
  editingChannelName,
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
  togglePinChannel,
  handleMidiLearn,
  handleMidiForget,
  handleSetOscAddress,
  getChannelInfo,
  isChannelAssigned,
  getFixtureColor,
}) => {
  return (
    <div className={`${styles.dmxChannelsContainer} ${styles[viewMode]}`}>
      {displayedChannels.map((channelIndex) => {
        const value = dmxChannels[channelIndex] || 0;
        const channelName = channelNames[channelIndex] || `Channel ${channelIndex + 1}`;
        const isSelected = selectedChannels.includes(channelIndex);
        const hasMidiMapping = !!midiMappings[channelIndex];
        const isChannelLearning = isLearning && currentLearningChannel === channelIndex;
        const mapping = midiMappings[channelIndex];
        const fixtureInfo = getChannelInfo(channelIndex);
        const hasFixtureAssignment = isChannelAssigned(channelIndex);
        const fixtureColor = fixtureInfo ? getFixtureColor(fixtureInfo.fixtureId) : '#64748b';
        const isEditingName = editingChannelName === channelIndex;
        const hasCustomName = !!(channelNames[channelIndex] &&
          channelNames[channelIndex] !== `CH ${channelIndex + 1}` &&
          channelNames[channelIndex] !== `Channel ${channelIndex + 1}` &&
          channelNames[channelIndex].trim() !== '');

        return (
          <DmxChannelCard
            key={channelIndex}
            channelIndex={channelIndex}
            value={value}
            channelName={channelName}
            isSelected={isSelected}
            highlighted={highlightedChannel === channelIndex}
            hasMidiMapping={hasMidiMapping}
            isChannelLearning={isChannelLearning}
            mapping={mapping}
            fixtureInfo={fixtureInfo}
            hasFixtureAssignment={hasFixtureAssignment}
            fixtureColor={fixtureColor}
            isEditingName={isEditingName}
            hasCustomName={hasCustomName}
            channelColor={channelColors[channelIndex]}
            envelopeAutomation={envelopeAutomation}
            showMidiControls={showMidiControls}
            showOscControls={showOscControls}
            editingChannelNameValue={editingChannelNameValue}
            setEditingChannelNameValue={setEditingChannelNameValue}
            getChannelRange={getChannelRange}
            setChannelRange={setChannelRange}
            setDmxChannel={setDmxChannel}
            toggleEnvelope={toggleEnvelope}
            handleSaveChannelName={handleSaveChannelName}
            handleCancelEditName={handleCancelEditName}
            handleStartEditName={handleStartEditName}
            toggleChannelSelection={toggleChannelSelection}
            setRandomChannelColor={setRandomChannelColor}
            addNotification={addNotification}
            isPinned={!!pinnedChannels?.includes(channelIndex)}
            togglePinChannel={togglePinChannel}
            handleMidiLearn={handleMidiLearn}
            handleMidiForget={handleMidiForget}
            handleSetOscAddress={handleSetOscAddress}
            oscAddress={oscAssignments[channelIndex]}
          />
        );
      })}
    </div>
  );
};
