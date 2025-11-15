import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './MidiMonitor.module.scss';

export const MidiMonitor: React.FC = () => {
  const { 
    midiMessages, 
    midiMappings, 
    channelNames,
    dmxChannels,
    debugTools 
  } = useStore(state => ({
    midiMessages: state.midiMessages,
    midiMappings: state.midiMappings,
    channelNames: state.channelNames,
    dmxChannels: state.dmxChannels,
    debugTools: state.debugTools
  }));
  const [lastMessages, setLastMessages] = useState<Array<any>>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const monitorRef = useRef<HTMLDivElement>(null);

  // Don't render if midiMonitor is disabled in debugTools
  if (!debugTools.midiMonitor) {
    return null;
  }

  // Find which DMX channel(s) a MIDI message affects
  const getDmxChannelsForMidiMessage = (msg: any): Array<{ channel: number; name: string; value: number }> => {
    const affectedChannels: Array<{ channel: number; name: string; value: number }> = [];
    
    Object.entries(midiMappings).forEach(([dmxChannelStr, mapping]) => {
      if (!mapping) return;
      
      const dmxChannel = parseInt(dmxChannelStr, 10);
      let matches = false;
      
      if (msg._type === 'cc' && mapping.controller !== undefined) {
        matches = mapping.channel === msg.channel && mapping.controller === msg.controller;
      } else if (msg._type === 'noteon' && mapping.note !== undefined) {
        matches = mapping.channel === msg.channel && mapping.note === msg.note;
      }
      
      if (matches) {
        const channelName = channelNames[dmxChannel] || `CH ${dmxChannel + 1}`;
        const currentValue = dmxChannels[dmxChannel] || 0;
        affectedChannels.push({
          channel: dmxChannel,
          name: channelName,
          value: currentValue
        });
      }
    });
    
    return affectedChannels;
  };

  // Update the displayed messages when new MIDI messages arrive
  useEffect(() => {
    if (midiMessages.length > 0) {
      // Show more messages for scrolling (last 50)
      const recentMessages = midiMessages.slice(-50);
      setLastMessages(recentMessages);

      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 200);
      
      // Auto-scroll to bottom if enabled
      if (autoScroll && contentRef.current) {
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
          }
        }, 10);
      }
      
      return () => clearTimeout(timer);
    }
  }, [midiMessages, autoScroll]);

  const renderHeader = () => (
    <div
      className={`${styles.header} handle`}
    >
      <span className={styles.title}>MIDI Monitor</span>
      {!isCollapsed && <span className={styles.status}>Recent: {midiMessages.length}</span>}
      <div className={styles.controls}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          onPointerDown={e => e.stopPropagation()}
          title={isCollapsed ? "Expand" : "Minimize"}
        >
          {isCollapsed ? 
            <LucideIcon name="ChevronUp" size={14} /> : 
            <LucideIcon name="ChevronDown" size={14} />
          }
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isCollapsed) {
      return null;
    }

    if (lastMessages.length === 0) {
      return (
        <div className={styles.content}>
          <p className={styles.noData}>No MIDI messages received yet.</p>
          <p className={styles.noData}>Try moving controls on your MIDI device.</p>
        </div>
      );
    }

    return (
      <div 
        ref={contentRef}
        className={styles.content}
        onScroll={() => {
          // Disable auto-scroll if user manually scrolls up
          if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5;
            setAutoScroll(isAtBottom);
          }
        }}
      >
        {lastMessages.map((msg, index) => {
          const affectedDmxChannels = getDmxChannelsForMidiMessage(msg);
          
          return (
            <div key={index} className={styles.messageRow}>
              <div className={styles.messageRowMain}>
                {msg._type === 'cc' && (
                  <>
                    <span className={styles.type}>CC</span>
                    <span className={styles.channel}>Ch {msg.channel + 1}</span>
                    <span className={styles.controller}>CC {msg.controller}</span>
                    <span className={styles.value}>{msg.value}</span>
                    <span className={styles.source}>{msg.source}</span>
                  </>
                )}
                {msg._type === 'noteon' && (
                  <>
                    <span className={styles.type}>Note</span>
                    <span className={styles.channel}>Ch {msg.channel + 1}</span>
                    <span className={styles.note}>Note {msg.note}</span>
                    <span className={styles.velocity}>Vel {msg.velocity}</span>
                    <span className={styles.source}>{msg.source}</span>
                  </>
                )}
                {msg._type !== 'cc' && msg._type !== 'noteon' && (
                  <span>Other: {JSON.stringify(msg)}</span>
                )}
              </div>
              {affectedDmxChannels.length > 0 && (
                <div className={styles.dmxInfo}>
                  <span className={styles.dmxLabel}>→ DMX:</span>
                  {affectedDmxChannels.map((dmx, idx) => (
                    <span key={idx} className={styles.dmxChannel}>
                      {dmx.name} ({dmx.value})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const monitorClasses = [
    styles.midiMonitor,
    flashActive ? styles.flash : '',
    isCollapsed ? styles.collapsed : '',
  ].join(' ');

  return (
    <div
      ref={monitorRef}
      className={monitorClasses}
      style={{
        zIndex: 1050,
      }}
    >
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

export default MidiMonitor;
