import React from 'react';
import { LucideIcon } from '../ui/LucideIcon';
import styles from '../pages/DmxChannelControlPage.module.scss';

interface MidiInputDevice {
  id: string;
  name?: string;
}

interface DmxMidiConnectionsProps {
  browserMidiError: string | null;
  browserMidiSupported: boolean;
  browserInputs: MidiInputDevice[];
  activeBrowserInputs: string[];
  onRefreshMidiDevices: () => void;
  onConnectMidiDevice: (inputId: string) => void;
  onDisconnectMidiDevice: (inputId: string) => void;
}

export const DmxMidiConnections: React.FC<DmxMidiConnectionsProps> = ({
  browserMidiError,
  browserMidiSupported,
  browserInputs,
  activeBrowserInputs,
  onRefreshMidiDevices,
  onConnectMidiDevice,
  onDisconnectMidiDevice,
}) => {
  return (
    <div className={styles.midiControls}>
      <div className={styles.midiSection}>
        <h3 className={styles.sectionTitle}>
          <LucideIcon name="Music" />
          MIDI Connection
        </h3>

        {browserMidiError && (
          <div className={styles.errorMessage}>
            <LucideIcon name="AlertCircle" />
            MIDI Error: {browserMidiError}
          </div>
        )}

        {!browserMidiSupported && (
          <div className={styles.warningMessage}>
            <LucideIcon name="AlertTriangle" />
            No MIDI support available
          </div>
        )}

        {browserMidiSupported && (
          <div className={styles.midiDevices}>
            <div className={styles.deviceHeader}>
              <label className={styles.deviceLabel}>Available MIDI Devices:</label>
              <button
                className={styles.refreshButton}
                onClick={onRefreshMidiDevices}
                title="Refresh MIDI devices"
              >
                <LucideIcon name="RefreshCw" />
                Refresh
              </button>
            </div>

            {browserInputs.length === 0 ? (
              <div className={styles.noDevices}>
                No MIDI devices found. Connect a MIDI device and click Refresh.
              </div>
            ) : (
              <div className={styles.deviceList}>
                {browserInputs.map((input) => {
                  const isConnected = activeBrowserInputs.includes(input.id);
                  return (
                    <div key={input.id} className={styles.deviceItem}>
                      <div className={styles.deviceInfo}>
                        <span className={styles.deviceName}>{input.name || 'Unnamed MIDI Device'}</span>
                        <span className={styles.deviceId}>{input.id}</span>
                      </div>
                      <div className={styles.deviceActions}>
                        {isConnected ? (
                          <button
                            className={styles.disconnectButton}
                            onClick={() => onDisconnectMidiDevice(input.id)}
                            title="Disconnect MIDI device"
                          >
                            <LucideIcon name="X" />
                            Disconnect
                          </button>
                        ) : (
                          <button
                            className={styles.connectButton}
                            onClick={() => onConnectMidiDevice(input.id)}
                            title="Connect MIDI device"
                          >
                            <LucideIcon name="Link" />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
