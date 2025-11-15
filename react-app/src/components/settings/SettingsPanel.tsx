import React, { useState, useRef } from 'react';
import { StateManager } from '../../utils/stateManager';
import { LucideIcon } from '../ui/LucideIcon';
import { useStore } from '../../store';
import styles from './SettingsPanel.module.scss';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'state'>('state');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localStorageFileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useStore();

  const showMessage = (text: string, type: 'success' | 'error' | 'info', duration: number = 3000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), duration);
  };

  const handleSaveLocal = async () => {
    setIsProcessing(true);
    try {
      const success = StateManager.saveStateLocally();
      if (success) {
        showMessage('State saved locally successfully!', 'success');
        addNotification({
          message: '💾 ArtBastard state saved to browser storage',
          type: 'success'
        });
      } else {
        showMessage('Failed to save state locally', 'error');
      }
    } catch (error) {
      showMessage(`Error saving state: ${(error as Error).message}`, 'error');
    }
    setIsProcessing(false);
  };

  const handleLoadLocal = async () => {
    setIsProcessing(true);
    try {
      const state = StateManager.loadStateLocally();
      if (state) {
        const success = await StateManager.applyState(state);
        if (success) {
          showMessage('State loaded successfully! Page will refresh...', 'success');
          addNotification({
            message: '📥 ArtBastard state loaded from browser storage',
            type: 'success'
          });
          setTimeout(() => window.location.reload(), 2000);
        } else {
          showMessage('Failed to apply loaded state', 'error');
        }
      } else {
        showMessage('No saved state found in browser storage', 'info');
      }
    } catch (error) {
      showMessage(`Error loading state: ${(error as Error).message}`, 'error');
    }
    setIsProcessing(false);
  };

  const handleExportFile = async () => {
    setIsProcessing(true);
    try {
      const success = StateManager.exportStateAsFile();
      if (success) {
        showMessage('State exported successfully!', 'success');
        addNotification({
          message: '📥 ArtBastard state exported as file',
          type: 'success'
        });
      } else {
        showMessage('Failed to export state', 'error');
      }
    } catch (error) {
      showMessage(`Error exporting state: ${(error as Error).message}`, 'error');
    }
    setIsProcessing(false);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const state = await StateManager.importStateFromFile(file);
      const success = await StateManager.applyState(state);
      if (success) {
        showMessage('State imported successfully! Page will refresh...', 'success');
        addNotification({
          message: '📤 ArtBastard state imported from file',
          type: 'success'
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showMessage('Failed to apply imported state', 'error');
      }
    } catch (error) {
      showMessage(`Error importing state: ${(error as Error).message}`, 'error');
    }
    setIsProcessing(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportLocalStorage = async () => {
    setIsProcessing(true);
    try {
      const success = StateManager.exportLocalStorageAsFile();
      if (success) {
        showMessage('LocalStorage exported successfully!', 'success');
        addNotification({
          message: '💾 LocalStorage exported as JSON file',
          type: 'success'
        });
      } else {
        showMessage('Failed to export localStorage', 'error');
      }
    } catch (error) {
      showMessage(`Error exporting localStorage: ${(error as Error).message}`, 'error');
    }
    setIsProcessing(false);
  };

  const handleImportLocalStorage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const success = await StateManager.importLocalStorageFromFile(file);
      if (success) {
        showMessage('LocalStorage imported successfully! Page will refresh...', 'success');
        addNotification({
          message: '📥 LocalStorage imported from file',
          type: 'success'
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showMessage('Failed to import localStorage', 'error');
      }
    } catch (error) {
      showMessage(`Error importing localStorage: ${(error as Error).message}`, 'error');
    }
    setIsProcessing(false);
    
    // Reset file input
    if (localStorageFileInputRef.current) {
      localStorageFileInputRef.current.value = '';
    }
  };

  const handleAutoSaveToggle = () => {
    // This would toggle auto-save functionality
    // For now, we'll just enable it with default settings
    StateManager.enableAutoSave(5); // Auto-save every 5 minutes
    showMessage('Auto-save enabled (every 5 minutes)', 'success');
    addNotification({
      message: '⏰ Auto-save enabled - state will be saved every 5 minutes',
      type: 'info'
    });
  };

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.header}>
        <h2>
          <LucideIcon name="Settings" />
          ArtBastard Settings
        </h2>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            <LucideIcon name="X" />
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'state' ? styles.active : ''}`}
          onClick={() => setActiveTab('state')}
        >
          <LucideIcon name="Save" />
          State Management
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <LucideIcon name="Settings" />
          General
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <LucideIcon name={message.type === 'success' ? 'CheckCircle' : message.type === 'error' ? 'XCircle' : 'Info'} />
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        {activeTab === 'state' && (
          <div className={styles.stateManagement}>
            <h3>
              <LucideIcon name="Database" />
              Complete State Management
            </h3>
            <p className={styles.description}>
              Save and restore your entire ArtBastard configuration including DMX settings, fixtures, scenes, 
              autopilot configurations, UI layouts, and more.
            </p>

            <div className={styles.section}>
              <h4>Local Browser Storage</h4>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleSaveLocal}
                  disabled={isProcessing}
                  className={styles.primaryButton}
                >
                  <LucideIcon name="Save" />
                  {isProcessing ? 'Saving...' : 'Save Current State'}
                </button>
                <button
                  onClick={handleLoadLocal}
                  disabled={isProcessing}
                  className={styles.secondaryButton}
                >
                  <LucideIcon name="Upload" />
                  {isProcessing ? 'Loading...' : 'Load Saved State'}
                </button>
              </div>
              <p className={styles.hint}>
                Saves to your browser's local storage. Data persists until you clear browser data.
              </p>
            </div>

            <div className={styles.section}>
              <h4>Portable JSON Files</h4>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleExportFile}
                  disabled={isProcessing}
                  className={styles.primaryButton}
                >
                  <LucideIcon name="Download" />
                  {isProcessing ? 'Exporting...' : 'Export Complete State'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className={styles.secondaryButton}
                >
                  <LucideIcon name="Upload" />
                  {isProcessing ? 'Importing...' : 'Import from File'}
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                style={{ display: 'none' }}
              />
              <p className={styles.hint}>
                Export your complete state as a JSON file for backup or sharing between devices.
              </p>
            </div>

            <div className={styles.section}>
              <h4>LocalStorage Export/Import (Cross-Browser)</h4>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleExportLocalStorage}
                  disabled={isProcessing}
                  className={styles.primaryButton}
                >
                  <LucideIcon name="Download" />
                  {isProcessing ? 'Exporting...' : 'Export LocalStorage Only'}
                </button>
                <button
                  onClick={() => localStorageFileInputRef.current?.click()}
                  disabled={isProcessing}
                  className={styles.secondaryButton}
                >
                  <LucideIcon name="Upload" />
                  {isProcessing ? 'Importing...' : 'Import LocalStorage'}
                </button>
              </div>
              <input
                type="file"
                ref={localStorageFileInputRef}
                onChange={handleImportLocalStorage}
                accept=".json"
                style={{ display: 'none' }}
              />
              <p className={styles.hint}>
                Export/import only localStorage data (channel names, ranges, colors, etc.) for use in another browser.
                Auto-saves on exit.
              </p>
            </div>

            <div className={styles.section}>
              <h4>Auto-Save</h4>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleAutoSaveToggle}
                  disabled={isProcessing}
                  className={styles.secondaryButton}
                >
                  <LucideIcon name="Clock" />
                  Enable Auto-Save
                </button>
              </div>
              <p className={styles.hint}>
                Automatically saves your state every 5 minutes and when closing the application.
              </p>
            </div>

            <div className={styles.stateInfo}>
              <h4>What Gets Saved:</h4>
              <ul>
                <li>🎛️ All DMX channel values and assignments</li>
                <li>🏷️ Fixture configurations and groupings</li>
                <li>🎬 Scene definitions and settings</li>
                <li>🤖 Autopilot configurations and patterns</li>
                <li>🎨 UI theme, layouts, and panel positions</li>
                <li>🎹 MIDI mappings and OSC assignments</li>
                <li>⚙️ All application preferences</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className={styles.generalSettings}>
            <h3>
              <LucideIcon name="Settings" />
              General Settings
            </h3>
            <p className={styles.description}>
              General application settings and preferences.
            </p>

            <div className={styles.section}>
              <h4>Coming Soon</h4>
              <p className={styles.hint}>
                Additional general settings will be added here in future updates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
