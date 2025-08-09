import React, { useState, useEffect } from 'react';
import styles from './PdfAddressSheet.module.scss';
import { useStore } from '../../store';
import useStoreUtils from '../../store/storeUtils';

// Common fixture types with their typical channel counts
const FIXTURE_TEMPLATES = [
  { name: 'RGB PAR', channels: 3, description: 'Basic RGB PAR light', commonChannels: ['Red', 'Green', 'Blue'] },
  { name: 'RGBW PAR', channels: 4, description: 'RGB + White PAR light', commonChannels: ['Red', 'Green', 'Blue', 'White'] },
  { name: 'Moving Head (Basic)', channels: 8, description: 'Basic moving head', commonChannels: ['Pan', 'Tilt', 'Dimmer', 'Red', 'Green', 'Blue', 'Strobe', 'Speed'] },
  { name: 'Moving Head (Advanced)', channels: 16, description: 'Full moving head with gobos', commonChannels: ['Pan', 'Tilt', 'Pan Fine', 'Tilt Fine', 'Dimmer', 'Red', 'Green', 'Blue', 'White', 'Strobe', 'Color Wheel', 'Gobo', 'Gobo Rotation', 'Prism', 'Focus', 'Speed'] },
  { name: 'MINI BEAM', channels: 16, description: 'MINI BEAM Moving Head', commonChannels: ['Color Wheel', 'Strobe', 'Dimmer', 'Gobo', 'Prism 1', 'Prism Rotation', 'Prism 2', 'Frost', 'Focus', 'Pan', 'Pan Fine', 'Tilt', 'Tilt Fine', 'Speed', 'Reset', 'Lamp'] },
  { name: 'LED Spider Light', channels: 15, description: 'Dual Motor RGBW Effect Light', commonChannels: ['Motor 1 Rotate', 'Motor 2 Rotate', 'Master Dimmer', 'Strobe', 'M1 Red', 'M1 Green', 'M1 Blue', 'M1 White', 'M2 Red', 'M2 Green', 'M2 Blue', 'M2 White', 'Effect Programs', 'Effect Speed', 'Reset'] },
  { name: 'EL1000RGB Laser', channels: 16, description: 'RGB Laser Projector', commonChannels: ['Laser On/Off', 'Color Control', 'Color Speed', 'Pattern Option', 'Pattern Group', 'Pattern Size', 'Auto Zoom', 'Center Rotation', 'H Rotation', 'V Rotation', 'H Move', 'V Move', 'Wave Effect', 'Drawing', 'Dynamic Effect', 'Effect Speed'] },
  { name: 'Dimmer', channels: 1, description: 'Single channel dimmer', commonChannels: ['Dimmer'] },
  { name: 'Strobe Light', channels: 2, description: 'Basic strobe light', commonChannels: ['Dimmer', 'Strobe Rate'] },
  { name: 'Custom', channels: 1, description: 'Custom fixture definition', commonChannels: [] }
];

interface FixtureEntry {
  id: string;
  name: string;
  type: string;
  startAddress: number;
  channelCount: number;
  endAddress: number;
  notes: string;
  manufacturer?: string;
}

interface AddressConflict {
  fixture1: string;
  fixture2: string;
  range1: string;
  range2: string;
}

export const PdfAddressSheet: React.FC = () => {  const [fixtures, setFixtures] = useState<FixtureEntry[]>([]);
  const [conflicts, setConflicts] = useState<AddressConflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [autoSync, setAutoSync] = useState(true);// Get store data and actions
  const { fixtures: storeFixtures } = useStore(state => ({
    fixtures: state.fixtures
  }));
  // Initialize with existing fixtures from the store and sync when store changes
  useEffect(() => {
    const existingFixtures: FixtureEntry[] = storeFixtures.map((fixture, index) => ({
      id: fixture.id || `existing-${index}`,
      name: fixture.name || `Fixture ${index + 1}`,
      type: fixture.type || 'Custom',
      startAddress: fixture.startAddress || 1,
      channelCount: fixture.channels.length,
      endAddress: (fixture.startAddress || 1) + fixture.channels.length - 1,
      notes: fixture.notes || '',
      manufacturer: fixture.manufacturer || ''
    }));
    setFixtures(existingFixtures);
  }, [storeFixtures]);

  // Auto-sync changes to ArtBastard when enabled
  useEffect(() => {
    if (autoSync && fixtures.length > 0) {
      const timeoutId = setTimeout(() => {
        syncToArtBastard();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [fixtures, autoSync]);

  // Check for address conflicts
  useEffect(() => {
    const newConflicts: AddressConflict[] = [];
    
    for (let i = 0; i < fixtures.length; i++) {
      for (let j = i + 1; j < fixtures.length; j++) {
        const fixture1 = fixtures[i];
        const fixture2 = fixtures[j];
        
        // Check if address ranges overlap
        const f1Start = fixture1.startAddress;
        const f1End = fixture1.endAddress;
        const f2Start = fixture2.startAddress;
        const f2End = fixture2.endAddress;
        
        if ((f1Start <= f2End && f1End >= f2Start)) {
          newConflicts.push({
            fixture1: fixture1.name,
            fixture2: fixture2.name,
            range1: `${f1Start}-${f1End}`,
            range2: `${f2Start}-${f2End}`
          });
        }
      }
    }
    
    setConflicts(newConflicts);
  }, [fixtures]);

  const addFixture = () => {
    // Calculate next available address
    const maxEndAddress = fixtures.reduce((max, fixture) => 
      Math.max(max, fixture.endAddress), 0);
    
    const newFixture: FixtureEntry = {
      id: `fixture-${Date.now()}`,
      name: `Fixture ${fixtures.length + 1}`,
      type: 'RGB PAR',
      startAddress: maxEndAddress + 1,
      channelCount: 3,
      endAddress: maxEndAddress + 3,
      notes: ''
    };
    
    setFixtures([...fixtures, newFixture]);
  };

  const updateFixture = (id: string, updates: Partial<FixtureEntry>) => {
    setFixtures(fixtures.map(fixture => {
      if (fixture.id === id) {
        const updated = { ...fixture, ...updates };
        // Recalculate end address when start address or channel count changes
        if (updates.startAddress !== undefined || updates.channelCount !== undefined) {
          updated.endAddress = updated.startAddress + updated.channelCount - 1;
        }
        return updated;
      }
      return fixture;
    }));
  };

  const deleteFixture = (id: string) => {
    setFixtures(fixtures.filter(fixture => fixture.id !== id));
  };

  const applyTemplate = (id: string, templateName: string) => {
    const template = FIXTURE_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      updateFixture(id, {
        type: template.name,
        channelCount: template.channels
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Manufacturer', 'Start Address', 'End Address', 'Channel Count', 'Notes'];
    const rows = fixtures.map(f => [
      f.name,
      f.type,
      f.manufacturer || '',
      f.startAddress.toString(),
      f.endAddress.toString(),
      f.channelCount.toString(),
      f.notes
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dmx-address-sheet.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printSheet = () => {
    window.print();
  };  const syncToArtBastard = () => {
    // Convert our fixture entries back to store format
    const convertedFixtures = fixtures.map(fixture => ({
      id: fixture.id,
      name: fixture.name,
      type: fixture.type,
      manufacturer: fixture.manufacturer,
      startAddress: fixture.startAddress,
      channels: Array.from({ length: fixture.channelCount }, (_, index) => ({
        name: `Channel ${index + 1}`,
        type: 'dimmer' // Default type, could be enhanced
      })),
      notes: fixture.notes
    }));

    // Update the store using storeUtils
    useStoreUtils.setState(state => ({
      fixtures: convertedFixtures
    }));

    // Show success message only for manual sync
    if (!autoSync) {
      useStoreUtils.getState().addNotification({
        message: `Synced ${fixtures.length} fixtures to ArtBastard DMX system`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  const generatePDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DMX Address Sheet - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .conflict { background-color: #ffebee; }
          .summary { margin-top: 20px; font-weight: bold; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>DMX512 Address Sheet</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Fixtures:</strong> ${fixtures.length} | <strong>Total Channels:</strong> ${fixtures.reduce((sum, f) => sum + f.channelCount, 0)} | <strong>Conflicts:</strong> ${conflicts.length}</p>
        
        <table>
          <thead>
            <tr>
              <th>Fixture Name</th>
              <th>Type</th>
              <th>Manufacturer</th>
              <th>Start Address</th>
              <th>End Address</th>
              <th>Channel Count</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${fixtures.map(fixture => {
              const isConflict = conflicts.some(c => 
                c.fixture1 === fixture.name || c.fixture2 === fixture.name
              );
              return `
                <tr${isConflict ? ' class="conflict"' : ''}>
                  <td>${fixture.name}</td>
                  <td>${fixture.type}</td>
                  <td>${fixture.manufacturer || ''}</td>
                  <td>${fixture.startAddress}</td>
                  <td>${fixture.endAddress}</td>
                  <td>${fixture.channelCount}</td>
                  <td>${fixture.notes}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        ${conflicts.length > 0 ? `
          <div class="summary">
            <h3>Address Conflicts:</h3>
            <ul>
              ${conflicts.map(conflict => 
                `<li><strong>${conflict.fixture1}</strong> (${conflict.range1}) overlaps with <strong>${conflict.fixture2}</strong> (${conflict.range2})</li>`
              ).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="summary">
          <p>Generated by ArtBastard DMX512 - Address Sheet Tool</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className={styles.addressSheet}>      <div className={styles.header}>
        <h3>📋 DMX Address Sheet</h3>
        <div className={styles.actions}>
          <button onClick={addFixture} className={styles.addButton}>
            ➕ Add Fixture
          </button>
          <button onClick={() => setShowConflicts(!showConflicts)} 
                  className={`${styles.conflictsButton} ${conflicts.length > 0 ? styles.hasConflicts : ''}`}>
            ⚠️ Conflicts ({conflicts.length})
          </button>
          <button 
            onClick={() => setAutoSync(!autoSync)}
            className={`${styles.autoSyncButton} ${autoSync ? styles.active : ''}`}
            title={autoSync ? 'Auto-sync enabled - changes sync automatically' : 'Auto-sync disabled - manual sync required'}
          >
            {autoSync ? '🔄 Auto-Sync ON' : '⏸️ Auto-Sync OFF'}
          </button>
          <button onClick={exportToCSV} className={styles.exportButton}>
            📄 Export CSV
          </button>
          <button onClick={printSheet} className={styles.printButton}>
            🖨️ Print
          </button>
          <button onClick={syncToArtBastard} className={styles.syncButton}>
            🔄 Sync to ArtBastard
          </button>
          <button onClick={generatePDF} className={styles.pdfButton}>
            📄 Generate PDF
          </button>
        </div>
      </div>

      {showConflicts && conflicts.length > 0 && (
        <div className={styles.conflictPanel}>
          <h4>⚠️ Address Conflicts</h4>
          {conflicts.map((conflict, index) => (
            <div key={index} className={styles.conflict}>
              <strong>{conflict.fixture1}</strong> ({conflict.range1}) overlaps with{' '}
              <strong>{conflict.fixture2}</strong> ({conflict.range2})
            </div>
          ))}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.fixtureTable}>
          <thead>
            <tr>
              <th>Fixture Name</th>
              <th>Type</th>
              <th>Manufacturer</th>
              <th>Start Addr</th>
              <th>End Addr</th>
              <th>Channels</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((fixture) => (
              <tr key={fixture.id} className={conflicts.some(c => 
                c.fixture1 === fixture.name || c.fixture2 === fixture.name
              ) ? styles.conflictRow : ''}>
                <td>
                  <input
                    type="text"
                    value={fixture.name}
                    onChange={(e) => updateFixture(fixture.id, { name: e.target.value })}
                    className={styles.input}
                  />
                </td>
                <td>
                  <select
                    value={fixture.type}
                    onChange={(e) => applyTemplate(fixture.id, e.target.value)}
                    className={styles.select}
                  >
                    {FIXTURE_TEMPLATES.map(template => (
                      <option key={template.name} value={template.name}>
                        {template.name} ({template.channels}ch)
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={fixture.manufacturer || ''}
                    onChange={(e) => updateFixture(fixture.id, { manufacturer: e.target.value })}
                    className={styles.input}
                    placeholder="Manufacturer"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fixture.startAddress}
                    onChange={(e) => updateFixture(fixture.id, { startAddress: parseInt(e.target.value) || 1 })}
                    className={styles.numberInput}
                    min="1"
                    max="512"
                  />
                </td>
                <td className={styles.endAddress}>
                  {fixture.endAddress}
                </td>
                <td>
                  <input
                    type="number"
                    value={fixture.channelCount}
                    onChange={(e) => updateFixture(fixture.id, { channelCount: parseInt(e.target.value) || 1 })}
                    className={styles.numberInput}
                    min="1"
                    max="32"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={fixture.notes}
                    onChange={(e) => updateFixture(fixture.id, { notes: e.target.value })}
                    className={styles.input}
                    placeholder="Notes..."
                  />
                </td>
                <td>
                  <button
                    onClick={() => deleteFixture(fixture.id)}
                    className={styles.deleteButton}
                    title="Delete fixture"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.summary}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Fixtures:</span>
            <span className={styles.statValue}>{fixtures.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Channels:</span>
            <span className={styles.statValue}>{fixtures.reduce((sum, f) => sum + f.channelCount, 0)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Highest Address:</span>
            <span className={styles.statValue}>{Math.max(...fixtures.map(f => f.endAddress), 0)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Conflicts:</span>
            <span className={`${styles.statValue} ${conflicts.length > 0 ? styles.error : styles.ok}`}>
              {conflicts.length}
            </span>
          </div>
        </div>
      </div>      <div className={styles.help}>
        <h4>💡 Quick Guide</h4>
        <ul>
          <li><strong>Add Fixture:</strong> Click "➕ Add Fixture" to add a new row</li>
          <li><strong>Templates:</strong> Select fixture type to auto-fill channel count</li>
          <li><strong>Addresses:</strong> Start addresses auto-calculate to avoid conflicts</li>
          <li><strong>Conflicts:</strong> Red highlighting indicates overlapping addresses</li>
          <li><strong>Auto-Sync:</strong> When enabled, changes automatically sync with ArtBastard (1 second delay)</li>
          <li><strong>Manual Sync:</strong> Use "🔄 Sync to ArtBastard" button for immediate sync</li>
          <li><strong>Export:</strong> Generate CSV for documentation or external tools</li>
          <li><strong>Print:</strong> Create physical reference sheets</li>
          <li><strong>PDF:</strong> Generate and print comprehensive DMX address documentation</li>
        </ul>
      </div>
    </div>
  );
};
