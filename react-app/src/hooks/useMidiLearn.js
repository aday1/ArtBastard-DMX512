import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
export const useMidiLearn = () => {
    const { midiLearnTarget, midiMessages, startMidiLearn: startMidiLearnAction, cancelMidiLearn: cancelMidiLearnAction, addMidiMapping, addNotification, } = useStore((state) => ({
        midiLearnTarget: state.midiLearnTarget,
        midiMessages: state.midiMessages,
        startMidiLearn: state.startMidiLearn,
        cancelMidiLearn: state.cancelMidiLearn,
        addMidiMapping: state.addMidiMapping,
        addNotification: state.addNotification,
    }));
    const [learnStatus, setLearnStatus] = useState('idle');
    const [timeoutId, setTimeoutId] = useState(null);
    // Start MIDI learn mode for a channel
    const startLearn = useCallback((channel) => {
        const target = { type: 'dmxChannel', channelIndex: channel };
        if (midiLearnTarget !== null) {
            cancelMidiLearnAction();
            console.log(`[MidiLearn] Canceled previous learn to start CH ${channel}`);
        }
        startMidiLearnAction(target);
        setLearnStatus('learning');
        addNotification({
            message: `MIDI Learn started for DMX CH ${channel + 1}. Send a MIDI CC.`,
            type: 'info',
            priority: 'normal'
        });
        console.log(`[MidiLearn] Started for DMX CH ${channel}. Status: learning.`);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
        }
        const newTimeoutId = window.setTimeout(() => {
            const currentTarget = useStore.getState().midiLearnTarget;
            if (currentTarget && currentTarget.type === 'dmxChannel' && currentTarget.channelIndex === channel) {
                cancelMidiLearnAction();
                setLearnStatus('timeout');
                addNotification({
                    message: `MIDI Learn for DMX CH ${channel + 1} timed out.`,
                    type: 'error',
                    priority: 'high'
                });
                console.log(`[MidiLearn] Timed out for DMX CH ${channel}. Status: timeout.`);
            }
        }, 30000);
        setTimeoutId(newTimeoutId);
    }, [midiLearnTarget, startMidiLearnAction, cancelMidiLearnAction, addNotification, timeoutId]);
    // Cancel MIDI learn mode
    const cancelLearn = useCallback(() => {
        if (midiLearnTarget !== null) {
            console.log(`[MidiLearn] Cancelling learn for target:`, midiLearnTarget);
            cancelMidiLearnAction();
            addNotification({
                message: `MIDI Learn cancelled.`,
                type: 'info',
                priority: 'low'
            });
        }
        setLearnStatus('idle');
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            setTimeoutId(null);
        }
    }, [cancelMidiLearnAction, midiLearnTarget, timeoutId, addNotification]);
    // Reset learn status after success or timeout
    useEffect(() => {
        let resetTimer = null;
        if (learnStatus === 'success' || learnStatus === 'timeout') {
            console.log(`[MidiLearn] Learn status is ${learnStatus}. Will reset to idle in 3 seconds.`);
            resetTimer = window.setTimeout(() => {
                setLearnStatus('idle');
                console.log('[MidiLearn] Learn status reset to idle.');
            }, 3000);
        }
        return () => {
            if (resetTimer) {
                window.clearTimeout(resetTimer);
            }
        };
    }, [learnStatus]);
    // Listen for MIDI messages during learn mode
    useEffect(() => {
        if (midiLearnTarget === null || midiLearnTarget.type !== 'dmxChannel' || learnStatus !== 'learning' || midiMessages.length === 0) {
            return;
        }
        const latestMessage = midiMessages[midiMessages.length - 1];
        const channel = midiLearnTarget.channelIndex;
        console.log('[MidiLearn] In learn mode. Processing message:', latestMessage, `for DMX CH ${channel}`);
        if (latestMessage._type === 'cc' && latestMessage.controller !== undefined) {
            const mapping = {
                channel: latestMessage.channel,
                controller: latestMessage.controller
            };
            console.log(`[MidiLearn] Creating CC mapping for DMX CH ${channel}:`, mapping);
            addMidiMapping(channel, mapping);
            const event = new CustomEvent('midiMappingCreated', { detail: { channel, mapping } });
            window.dispatchEvent(event);
            setLearnStatus('success');
            addNotification({
                message: `DMX CH ${channel + 1} mapped to MIDI CC ${mapping.controller} on CH ${mapping.channel + 1}.`,
                type: 'success',
                priority: 'normal'
            });
            console.log(`[MidiLearn] Success for DMX CH ${channel}. Status: success.`);
            if (timeoutId) {
                window.clearTimeout(timeoutId);
                setTimeoutId(null);
            }
        }
        else {
            console.log('[MidiLearn] Ignoring non-CC message or message without controller:', latestMessage._type);
        }
    }, [midiMessages, midiLearnTarget, learnStatus, addMidiMapping, timeoutId, addNotification, cancelMidiLearnAction]);
    return {
        isLearning: midiLearnTarget !== null && learnStatus === 'learning',
        learnStatus,
        currentLearningChannel: midiLearnTarget?.type === 'dmxChannel' ? midiLearnTarget.channelIndex : null,
        startLearn,
        cancelLearn
    };
};
