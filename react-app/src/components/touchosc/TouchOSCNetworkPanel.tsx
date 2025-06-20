import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { touchOSCTransmitter, configureTouchOSC, getTouchOSCConfig } from '../../utils/touchoscNetworkTransmitter';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './TouchOSCNetworkPanel.module.scss';

interface TouchOSCNetworkPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const TouchOSCNetworkPanel: React.FC<TouchOSCNetworkPanelProps> = ({
  isVisible = true,
  onClose
}) => {
  const { fixtures, masterSliders, placedFixtures, addNotification } = useStore();
  
  const [config, setConfig] = useState(getTouchOSCConfig());
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [autoTransmit, setAutoTransmit] = useState(false);
  const [lastTransmission, setLastTransmission] = useState<Date | null>(null);

  // Update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(touchOSCTransmitter.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle configuration changes
  const handleConfigChange = (key: keyof typeof config, value: string | boolean | number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    configureTouchOSC(newConfig);
  };

  // Connect to TouchOSC Editor
  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      const connected = await touchOSCTransmitter.connect();
      
      if (connected) {        addNotification({
          type: 'success',
          message: `Connected to TouchOSC Editor at ${config.host}:${config.port}`
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {      addNotification({
        type: 'error',
        message: `Failed to connect to TouchOSC Editor: ${error}`
      });
    }
  };

  // Disconnect from TouchOSC Editor
  const handleDisconnect = () => {
    touchOSCTransmitter.disconnect();    addNotification({
      type: 'info',
      message: 'Disconnected from TouchOSC Editor'
    });
  };

  // Transmit current layout to TouchOSC Editor
  const handleTransmitLayout = async () => {
    if (connectionStatus !== 'connected') {      addNotification({
        type: 'warning',
        message: 'Not connected to TouchOSC Editor. Connect first.'
      });
      return;
    }

    try {
      setIsTransmitting(true);
      const success = await touchOSCTransmitter.transmitLayout(fixtures, masterSliders, placedFixtures);
      
      if (success) {
        setLastTransmission(new Date());        addNotification({
          type: 'success',
          message: 'Interface transmitted to TouchOSC Editor successfully'
        });
      } else {
        throw new Error('Transmission failed');
      }
    } catch (error) {      addNotification({
        type: 'error',
        message: `Failed to transmit interface: ${error}`
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  // Auto-transmit when fixtures or settings change
  useEffect(() => {
    if (autoTransmit && connectionStatus === 'connected') {
      const timer = setTimeout(() => {
        handleTransmitLayout();
      }, 1000); // Debounce auto-transmit

      return () => clearTimeout(timer);
    }
  }, [fixtures, masterSliders, autoTransmit, connectionStatus]);

  // Listen for control changes from TouchOSC
  useEffect(() => {
    const handleTouchOSCControl = (event: CustomEvent) => {
      const { controlId, value } = event.detail;
      console.log(`TouchOSC control change: ${controlId} = ${value}`);
      
      // Handle different control types
      if (controlId.startsWith('master_')) {
        // Handle master slider changes
        const sliderId = controlId.replace('master_', '');
        // You can implement master slider updates here
      } else if (controlId.includes('_')) {
        // Handle fixture channel changes
        const [fixtureId, channelName] = controlId.split('_', 2);
        // You can implement fixture channel updates here
      }
    };

    window.addEventListener('touchoscControlChange', handleTouchOSCControl as EventListener);
    return () => window.removeEventListener('touchoscControlChange', handleTouchOSCControl as EventListener);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'disconnected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return 'Wifi';
      case 'connecting': return 'Loader';
      case 'disconnected': return 'WifiOff';
      default: return 'AlertCircle';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <LucideIcon name="Smartphone" />
          <h3>TouchOSC Network</h3>
          <div 
            className={styles.statusIndicator}
            style={{ backgroundColor: getStatusColor() }}
          >
            <LucideIcon name={getStatusIcon()} />
            {connectionStatus}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            <LucideIcon name="X" />
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Connection Configuration */}
        <div className={styles.section}>
          <h4>Connection Settings</h4>
          <div className={styles.configGrid}>
            <div className={styles.configItem}>
              <label>Host/IP Address:</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="127.0.0.1"
                disabled={connectionStatus === 'connected'}
              />
            </div>
            <div className={styles.configItem}>
              <label>Port:</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                placeholder="9000"
                disabled={connectionStatus === 'connected'}
              />
            </div>
            <div className={styles.configItem}>
              <label>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                />
                Enable Network Transmission
              </label>
            </div>
          </div>
        </div>

        {/* Connection Controls */}
        <div className={styles.section}>
          <h4>Connection Control</h4>
          <div className={styles.connectionControls}>
            {connectionStatus === 'connected' ? (
              <button 
                onClick={handleDisconnect}
                className={`${styles.button} ${styles.disconnect}`}
              >
                <LucideIcon name="WifiOff" />
                Disconnect
              </button>
            ) : (
              <button 
                onClick={handleConnect}
                className={`${styles.button} ${styles.connect}`}
                disabled={!config.enabled || connectionStatus === 'connecting'}
              >
                <LucideIcon name={connectionStatus === 'connecting' ? 'Loader' : 'Wifi'} />
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Transmission Controls */}
        <div className={styles.section}>
          <h4>Interface Transmission</h4>
          <div className={styles.transmissionControls}>
            <button
              onClick={handleTransmitLayout}
              className={`${styles.button} ${styles.transmit}`}
              disabled={connectionStatus !== 'connected' || isTransmitting}
            >
              <LucideIcon name={isTransmitting ? 'Loader' : 'Send'} />
              {isTransmitting ? 'Transmitting...' : 'Send Interface'}
            </button>
            
            <label className={styles.autoTransmitToggle}>
              <input
                type="checkbox"
                checked={autoTransmit}
                onChange={(e) => setAutoTransmit(e.target.checked)}
                disabled={connectionStatus !== 'connected'}
              />
              <span>Auto-transmit on changes</span>
            </label>
          </div>
          
          {lastTransmission && (
            <div className={styles.lastTransmission}>
              Last transmitted: {lastTransmission.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Status Information */}
        <div className={styles.section}>
          <h4>Status Information</h4>
          <div className={styles.statusInfo}>
            <div className={styles.statusItem}>
              <span>Connection:</span>
              <span style={{ color: getStatusColor() }}>
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span>Target:</span>
              <span>{config.host}:{config.port}</span>
            </div>
            <div className={styles.statusItem}>
              <span>Fixtures:</span>
              <span>{fixtures.length} available</span>
            </div>
            <div className={styles.statusItem}>
              <span>Masters:</span>
              <span>{masterSliders.length} sliders</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className={styles.section}>
          <h4>Instructions</h4>
          <div className={styles.instructions}>
            <ol>
              <li>Ensure TouchOSC Editor is running on the target device</li>
              <li>Configure the correct IP address and port</li>
              <li>Click "Connect" to establish connection</li>
              <li>Use "Send Interface" to transmit current layout</li>
              <li>Enable "Auto-transmit" for real-time updates</li>
            </ol>
            <div className={styles.note}>
              <LucideIcon name="Info" />
              <span>TouchOSC Editor must be configured to accept network connections on the specified port.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouchOSCNetworkPanel;
