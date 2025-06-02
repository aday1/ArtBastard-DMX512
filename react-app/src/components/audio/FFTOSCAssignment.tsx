import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import styles from './FFTOSCAssignment.module.scss';

interface FFTBandSelectionInfo {
  bandName: string;
  bandLabel: string;
  bandIndex: number;
  magnitude: number;
  minFreq: number;
  maxFreq: number;
  index: number; // Add this property
  frequency: number; // Add this property
}

interface OSCAssignment {
  id: string;
  fftBandStart: number;
  fftBandEnd: number;
  oscAddress: string;
  multiplier: number;
  offset: number;
  enabled: boolean;
}

interface FFTOSCAssignmentProps {
  selectedBand?: FFTBandSelectionInfo;
  selectedRange?: { start: number; end: number };
  onAssignmentCreate?: (assignment: OSCAssignment) => void;
}

export const FFTOSCAssignment: React.FC<FFTOSCAssignmentProps> = ({
  selectedBand,
  selectedRange,
  onAssignmentCreate
}) => {
  const [assignments, setAssignments] = useState<OSCAssignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    oscAddress: '',
    multiplier: 1,
    offset: 0,
    enabled: true
  });

  const { dmxChannels, fixtures, placedFixtures } = useStore();
  const { socket } = useSocket();

  // Auto-populate form when band/range is selected
  useEffect(() => {
    if (selectedBand && !selectedRange) {
      setFormData(prev => ({
        ...prev,
        oscAddress: `/fft/band/${selectedBand.index}`
      }));
      setShowForm(true);
    } else if (selectedRange) {
      setFormData(prev => ({
        ...prev,
        oscAddress: `/fft/range/${selectedRange.start}_${selectedRange.end}`
      }));
      setShowForm(true);
    }
  }, [selectedBand, selectedRange]);

  const createAssignment = () => {
    const newAssignment: OSCAssignment = {
      id: `assignment_${Date.now()}`,
      fftBandStart: selectedRange ? selectedRange.start : (selectedBand?.index || 0),
      fftBandEnd: selectedRange ? selectedRange.end : (selectedBand?.index || 0),
      oscAddress: formData.oscAddress,
      multiplier: formData.multiplier,
      offset: formData.offset,
      enabled: formData.enabled
    };

    setAssignments([...assignments, newAssignment]);
    onAssignmentCreate?.(newAssignment);
    setShowForm(false);
    resetForm();
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const toggleAssignment = (id: string) => {
    setAssignments(assignments.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const resetForm = () => {
    setFormData({
      oscAddress: '',
      multiplier: 1,
      offset: 0,
      enabled: true
    });
  };

  const getQuickOSCAddresses = () => {
    const addresses: string[] = [];

    // DMX channels
    Object.keys(dmxChannels).forEach(channel => {
      addresses.push(`/dmx/channel/${channel}`);
    });

    // Fixture channels
    placedFixtures.forEach(placedFixture => {
      const fixture = fixtures.find(f => f.id === placedFixture.fixtureId);
      if (fixture) {
        fixture.channels.forEach((channel, index) => {
          addresses.push(`/fixture/${placedFixture.id}/channel/${index}`);
          addresses.push(`/fixture/${placedFixture.id}/${channel.name.toLowerCase()}`);
        });
      }
    });

    // Master controls
    addresses.push('/master');
    addresses.push('/master/dimmer');
    addresses.push('/master/strobe');

    return addresses;
  };

  const quickSelectAddress = (address: string) => {
    setFormData(prev => ({ ...prev, oscAddress: address }));
  };

  return (
    <div className={styles.fftOSCAssignment}>
      <div className={styles.header}>
        <h3>FFT to OSC Assignments</h3>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(true)}
        >
          <i className="fas fa-plus"></i>
          Add Assignment
        </button>
      </div>

      {showForm && (
        <div className={styles.assignmentForm}>
          <div className={styles.formHeader}>
            <h4>Create New Assignment</h4>
            <button 
              className={styles.closeButton}
              onClick={() => setShowForm(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className={styles.selectionInfo}>
            {selectedBand && !selectedRange && (
              <div className={styles.bandInfo}>
                <strong>Selected Band:</strong> {selectedBand.index} 
                ({Math.round(selectedBand.frequency)} Hz)
              </div>
            )}
            {selectedRange && (
              <div className={styles.rangeInfo}>
                <strong>Selected Range:</strong> {selectedRange.start} - {selectedRange.end}
                ({Math.round((selectedRange.start / 1024) * 22050)} - {Math.round((selectedRange.end / 1024) * 22050)} Hz)
              </div>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>OSC Address:</label>
              <input
                type="text"
                value={formData.oscAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, oscAddress: e.target.value }))}
                placeholder="/your/osc/address"
              />
              
              <div className={styles.quickAddresses}>
                <label>Quick Select:</label>
                <div className={styles.addressButtons}>
                  {getQuickOSCAddresses().slice(0, 8).map(address => (
                    <button
                      key={address}
                      className={styles.addressButton}
                      onClick={() => quickSelectAddress(address)}
                    >
                      {address}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Multiplier:</label>
              <input
                type="number"
                step="0.1"
                value={formData.multiplier}
                onChange={(e) => setFormData(prev => ({ ...prev, multiplier: parseFloat(e.target.value) }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Offset:</label>
              <input
                type="number"
                step="0.1"
                value={formData.offset}
                onChange={(e) => setFormData(prev => ({ ...prev, offset: parseFloat(e.target.value) }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                Enabled
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <button 
              className={styles.createButton}
              onClick={createAssignment}
              disabled={!formData.oscAddress}
            >
              Create Assignment
            </button>
            <button 
              className={styles.cancelButton}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.assignmentsList}>
        <h4>Active Assignments ({assignments.filter(a => a.enabled).length})</h4>
        {assignments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No assignments created yet.</p>
            <p>Select a frequency band in the FFT analyzer and click "Add Assignment".</p>
          </div>
        ) : (
          <div className={styles.assignments}>
            {assignments.map(assignment => (
              <div 
                key={assignment.id} 
                className={`${styles.assignment} ${!assignment.enabled ? styles.disabled : ''}`}
              >
                <div className={styles.assignmentInfo}>
                  <div className={styles.frequency}>
                    {assignment.fftBandStart === assignment.fftBandEnd 
                      ? `Band ${assignment.fftBandStart}`
                      : `Bands ${assignment.fftBandStart}-${assignment.fftBandEnd}`
                    }
                  </div>
                  <div className={styles.oscAddress}>
                    <i className="fas fa-arrow-right"></i>
                    {assignment.oscAddress}
                  </div>
                  <div className={styles.parameters}>
                    ×{assignment.multiplier} +{assignment.offset}
                  </div>
                </div>
                
                <div className={styles.assignmentActions}>
                  <button
                    className={`${styles.toggleButton} ${assignment.enabled ? styles.enabled : styles.disabled}`}
                    onClick={() => toggleAssignment(assignment.id)}
                    title={assignment.enabled ? 'Disable' : 'Enable'}
                  >
                    <i className={`fas ${assignment.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  </button>
                  
                  <button
                    className={styles.deleteButton}
                    onClick={() => deleteAssignment(assignment.id)}
                    title="Delete Assignment"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.instructions}>
        <h4>How to use:</h4>
        <ol>
          <li>Start the Audio FFT analyzer above</li>
          <li>Click on a frequency band or drag to select a range</li>
          <li>The assignment form will auto-populate - configure the OSC address</li>
          <li>Adjust multiplier and offset as needed</li>
          <li>The selected frequencies will automatically send values to your OSC address</li>
        </ol>
      </div>
    </div>
  );
};
