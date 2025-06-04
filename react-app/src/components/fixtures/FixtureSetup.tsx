import React, { useState } from 'react'
import { useStore, PlacedFixture, Group } from '../../store' // Import PlacedFixture and Group
import useStoreUtils from '../../store/storeUtils'
import { useTheme } from '../../context/ThemeContext'
// import { FixtureVisualizer3D } from './FixtureVisualizer3D' // Removed
import { FixtureCanvas2D } from './FixtureCanvas2D'; // Added
import { CanvasImageUpload } from './CanvasImageUpload'; // Added
import { ColorPickerPanel } from './ColorPickerPanel'; // Added ColorPickerPanel
import styles from './FixtureSetup.module.scss'

// PlacedFixtureOnSetup type is no longer needed here, will use PlacedFixture from store
import { MidiLearnButton } from '../midi/MidiLearnButton'; // Import MidiLearnButton

interface FixtureChannel {
  name: string
  type: 'dimmer' | 'red' | 'green' | 'blue' | 'pan' | 'tilt' | 'gobo' | 'other';
}

interface FixtureFormData {
  name: string;
  startAddress: number;
  channels: FixtureChannel[];
}

const channelTypes = [
  { value: 'dimmer', label: 'Dimmer/Intensity' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'pan', label: 'Pan' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'gobo', label: 'Gobo' },
  { value: 'other', label: 'Other' }
]

// Define Fixture Templates
const fixtureTemplates: Array<{
  templateName: string;
  defaultNamePrefix: string;
  channels: FixtureChannel[];
}> = [
  {
    templateName: 'Simple Par Can (RGB + Dimmer)',
    defaultNamePrefix: 'RGBD Par',
    channels: [
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' },
      { name: 'Dimmer', type: 'dimmer' },
    ],
  },
  {
    templateName: 'Moving Head Spot (Basic)',
    defaultNamePrefix: 'Basic Mover',
    channels: [
      { name: 'Pan', type: 'pan' },
      { name: 'Tilt', type: 'tilt' },
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Gobo Wheel', type: 'gobo' },
      { name: 'Color Wheel', type: 'other' },
    ],
  },
  {
    templateName: 'Generic Dimmer',
    defaultNamePrefix: 'Dimmer',
    channels: [{ name: 'Intensity', type: 'dimmer' }],
  },
  {
    templateName: 'RGBW Par Can',
    defaultNamePrefix: 'RGBW Par',
    channels: [
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' },
      { name: 'White', type: 'other' }, 
      { name: 'Dimmer', type: 'dimmer' },
    ],
  },
];

export const FixtureSetup: React.FC = () => {
  const { theme } = useTheme()
  const { 
    fixtures, 
    fixtureLayout, 
    setFixtureLayout, 
    canvasBackgroundImage, 
    setCanvasBackgroundImage 
  } = useStore(state => ({
    fixtures: state.fixtures,
    fixtureLayout: state.fixtureLayout,
    setFixtureLayout: state.setFixtureLayout,
    canvasBackgroundImage: state.canvasBackgroundImage,
    setCanvasBackgroundImage: state.setCanvasBackgroundImage,
  }));
  const groups = useStore(state => state.groups)
    const [showCreateFixture, setShowCreateFixture] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null)
  const [fixtureForm, setFixtureForm] = useState<FixtureFormData>({
    name: '',    startAddress: 1,
    channels: [{ name: 'Intensity', type: 'dimmer' }]
  });
  
  const [groupForm, setGroupForm] = useState<Partial<Group>>({
    name: '',
    fixtureIndices: [],
    lastStates: new Array(512).fill(0),
    isMuted: false,
    isSolo: false,
    masterValue: 255
  })
  const calculateNextStartAddress = () => {
    if (fixtures.length === 0) return 1;
    // Ensure addresses are numbers and positive before using Math.max
    const lastAddresses = fixtures.map(f => (f.startAddress || 1) + (f.channels?.length || 0));
    return Math.max(1, ...lastAddresses.map(addr => Math.max(1, addr)));
  };

  // Check for DMX address conflicts
  const checkDmxConflict = (startAddress: number, channelCount: number, excludeFixtureId?: string): string | null => {
    const endAddress = startAddress + channelCount - 1;
    
    for (const fixture of fixtures) {
      if (excludeFixtureId && fixture.id === excludeFixtureId) continue;
      
      const fixtureEnd = fixture.startAddress + fixture.channels.length - 1;
      
      // Check if ranges overlap
      if (!(endAddress < fixture.startAddress || startAddress > fixtureEnd)) {
        return `Conflicts with "${fixture.name}" (DMX ${fixture.startAddress}-${fixtureEnd})`;
      }
    }
    
    return null; // No conflict
  };
  
  // Handle fixture form changes
  const handleFixtureChange = (key: keyof FixtureFormData, value: any) => {
    setFixtureForm(prev => ({ ...prev, [key]: value }))
  }
  
  // Handle channel changes
  const handleChannelChange = (index: number, key: keyof FixtureChannel, value: any) => {
    const updatedChannels = [...fixtureForm.channels]
    updatedChannels[index] = { ...updatedChannels[index], [key]: value }
    setFixtureForm(prev => ({ ...prev, channels: updatedChannels }))
  }
  
  // Add a new channel to the fixture
  const addChannel = () => {
    setFixtureForm(prev => ({
      ...prev,
      channels: [...prev.channels, { name: `Channel ${prev.channels.length + 1}`, type: 'other' }]
    }))
  }
  
  // Remove a channel from the fixture
  const removeChannel = (index: number) => {
    setFixtureForm(prev => ({
      ...prev,
      channels: prev.channels.filter((_, i) => i !== index)
    }))
  }
    // Save fixture to store
  const saveFixture = () => {
    if (editingFixtureId) {
      // Update existing fixture
      updateFixture()
    } else {
      // Create new fixture
      createFixture()
    }
  }
  // Create new fixture
  const createFixture = () => {
    // Validate DMX address conflict
    const conflict = checkDmxConflict(fixtureForm.startAddress, fixtureForm.channels.length);
    if (conflict) {
      useStoreUtils.getState().addNotification({
        message: `Cannot create fixture: ${conflict}`,
        type: 'error',
        priority: 'high'
      });
      return;
    }

    const newFixture = {
      id: `fixture-${Date.now()}-${Math.random()}`,
      name: fixtureForm.name,
      startAddress: fixtureForm.startAddress,
      channels: fixtureForm.channels
    }
    
    useStoreUtils.setState(state => ({
      fixtures: [...state.fixtures, newFixture]
    }))
    
    resetForm()
    
    // Show success message
    useStoreUtils.getState().addNotification({
      message: `Fixture "${newFixture.name}" created`,
      type: 'success',
      priority: 'normal'
    })
  }

  // Update existing fixture
  const updateFixture = () => {
    if (!editingFixtureId) return

    // Validate DMX address conflict (exclude current fixture from check)
    const conflict = checkDmxConflict(fixtureForm.startAddress, fixtureForm.channels.length, editingFixtureId);
    if (conflict) {
      useStoreUtils.getState().addNotification({
        message: `Cannot update fixture: ${conflict}`,
        type: 'error',
        priority: 'high'
      });
      return;
    }

    const updatedFixture = {
      id: editingFixtureId,
      name: fixtureForm.name,
      startAddress: fixtureForm.startAddress,
      channels: fixtureForm.channels
    }
    
    useStoreUtils.setState(state => ({
      fixtures: state.fixtures.map(f => f.id === editingFixtureId ? updatedFixture : f)
    }))
    
    resetForm()
    
    // Show success message
    useStoreUtils.getState().addNotification({
      message: `Fixture "${updatedFixture.name}" updated`,
      type: 'success',
      priority: 'normal'
    })
  }

  // Start editing a fixture
  const startEditFixture = (fixture: any) => {
    setEditingFixtureId(fixture.id)
    setFixtureForm({
      name: fixture.name,
      startAddress: fixture.startAddress,
      channels: [...fixture.channels] // Create a copy to avoid direct mutation
    })
    setShowCreateFixture(true)
  }

  // Delete a fixture
  const deleteFixture = (fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId)
    if (!fixture) return

    if (window.confirm(`Are you sure you want to delete "${fixture.name}"?`)) {
      useStoreUtils.setState(state => ({
        fixtures: state.fixtures.filter(f => f.id !== fixtureId)
      }))
      
      // Show success message
      useStoreUtils.getState().addNotification({
        message: `Fixture "${fixture.name}" deleted`,
        type: 'success',
        priority: 'normal'
      })
    }
  }

  // Reset form and close it
  const resetForm = () => {
    setFixtureForm({
      name: '',
      startAddress: fixtures.length > 0 
        ? Math.max(...fixtures.map(f => f.startAddress + f.channels.length)) + 1 
        : 1,
      channels: [{ name: 'Intensity', type: 'dimmer' }]
    })
    setShowCreateFixture(false)
    setEditingFixtureId(null)
  }
  // Toggle fixture selection for group
  const toggleFixtureForGroup = (index: number) => {
    setGroupForm(prev => {
      const isSelected = prev.fixtureIndices.includes(index)
      return {
        ...prev,
        fixtureIndices: isSelected
          ? prev.fixtureIndices.filter(i => i !== index)
          : [...prev.fixtureIndices, index]
      }
    })
  }
  
  // Save group to store
  const saveGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random()}`,
      name: groupForm.name!,
      fixtureIndices: [...groupForm.fixtureIndices!],
      lastStates: new Array(512).fill(0), // Start with all channels at 0
      isMuted: false,
      isSolo: false,
      masterValue: 255, // Full brightness by default
      position: undefined // Will be set when added to canvas
    };

    useStoreUtils.setState(state => ({
      groups: [...state.groups, newGroup]
    }));
    
    // Reset form and hide it
    setGroupForm({
      name: '',
      fixtureIndices: [],
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    });
    setShowCreateGroup(false);
    
    // Show success message
    useStoreUtils.getState().addNotification({
      message: `Group "${newGroup.name}" created`,
      type: 'success',
      priority: 'normal'
    });
  };
  
  return (
    <div className={styles.fixtureSetup}>
      <h2 className={styles.sectionTitle}>
        {theme === 'artsnob' && 'Fixture Composition: The Architecture of Light'}
        {theme === 'standard' && 'Fixture Setup'}
        {theme === 'minimal' && 'Fixtures'}      </h2>
      
      {/* Canvas Background Image Upload */}
      <CanvasImageUpload 
        onImageUploaded={setCanvasBackgroundImage}
        currentImage={canvasBackgroundImage}
      />
      
      {/* 2D Fixture Canvas */}
      <FixtureCanvas2D
        fixtures={fixtures} 
        placedFixturesData={fixtureLayout} // Use data from store
        onUpdatePlacedFixtures={setFixtureLayout} // Use store action to update
      />
        {/* Color Picker Panel Section */}
      <div className={styles.colorPickerContainer}>
        <ColorPickerPanel />
      </div>
      
      <div className={styles.setupGrid}>
        {/* Fixture Management Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>
              {theme === 'artsnob' && 'Existing Fixtures: The Gallery of Light Instruments'}
              {theme === 'standard' && 'Fixtures'}
              {theme === 'minimal' && 'Fixtures'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            {fixtures.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-lightbulb"></i>
                <p>No fixtures have been created yet</p>
              </div>
            ) : (              <div className={styles.fixtureList}>
                {fixtures.map((fixture, index) => (
                  <div key={fixture.id || index} className={styles.fixtureItem}>
                    <div className={styles.fixtureHeader}>
                      <h4>{fixture.name}</h4>
                      <div className={styles.fixtureActions}>
                        <span className={styles.fixtureDmx}>
                          DMX: {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                        </span>
                        <button
                          className={styles.editButton}
                          onClick={() => startEditFixture(fixture)}
                          title="Edit fixture"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deleteFixture(fixture.id)}
                          title="Delete fixture"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className={styles.fixtureChannels}>
                      {fixture.channels.map((channel, chIndex) => (
                        <div key={chIndex} className={styles.channelTag}>
                          <span className={`${styles.channelType} ${styles[channel.type]}`}>
                            {channel.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
              {showCreateFixture ? (
              <div className={styles.fixtureForm}>
                <h4>
                  {editingFixtureId ? (
                    <>
                      {theme === 'artsnob' && 'Refine Fixture: Sculpting Light Anew'}
                      {theme === 'standard' && 'Edit Fixture'}
                      {theme === 'minimal' && 'Edit Fixture'}
                    </>
                  ) : (
                    <>
                      {theme === 'artsnob' && 'Create New Fixture: Birth of a Light Vessel'}
                      {theme === 'standard' && 'New Fixture'}
                      {theme === 'minimal' && 'New Fixture'}
                    </>
                  )}
                </h4>
                
                <div className={styles.formGroup}>
                  <label htmlFor="fixtureName">Name:</label>
                  <input
                    type="text"
                    id="fixtureName"
                    value={fixtureForm.name}
                    onChange={(e) => handleFixtureChange('name', e.target.value)}
                    placeholder="Enter fixture name"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="fixtureStartAddress">Start Address:</label>
                  <input
                    type="number"
                    id="fixtureStartAddress"
                    value={fixtureForm.startAddress}
                    onChange={(e) => handleFixtureChange('startAddress', parseInt(e.target.value) || 1)}
                    min="1"
                    max="512"
                  />
                </div>
                
                <h5>
                  {theme === 'artsnob' && 'Channels: The Dimensions of Control'}
                  {theme === 'standard' && 'Channels'}
                  {theme === 'minimal' && 'Channels'}
                </h5>
                
                <div className={styles.channelsList}>
                  {fixtureForm.channels.map((channel, index) => (
                    <div key={index} className={styles.channelForm}>
                      <div className={styles.channelFormRow}>
                        <input
                          type="text"
                          value={channel.name}
                          onChange={(e) => handleChannelChange(index, 'name', e.target.value)}
                          placeholder="Channel name"
                        />
                        
                        <select
                          value={channel.type}
                          onChange={(e) => handleChannelChange(index, 'type', e.target.value)}
                        >
                          {channelTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          className={styles.removeButton}
                          onClick={() => removeChannel(index)}
                          disabled={fixtureForm.channels.length === 1}
                          title="Remove channel"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className={styles.channelDmxInfo}>
                        <span className={styles.dmxAddressLabel}>
                          DMX: {fixtureForm.startAddress + index} 
                          {/* Display 1-indexed DMX address */}
                        </span>
                        <MidiLearnButton 
                          channelIndex={fixtureForm.startAddress + index -1} // Pass 0-indexed DMX channel
                          className={styles.channelMidiLearnButton} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    className={styles.addChannelButton} 
                    onClick={addChannel}
                  >
                    <i className="fas fa-plus"></i> Add Channel
                  </button>
                    <div className={styles.saveActions}>
                    <button 
                      className={styles.cancelButton}
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.saveButton}
                      onClick={saveFixture}
                      disabled={!fixtureForm.name || fixtureForm.channels.length === 0}
                    >
                      <i className="fas fa-save"></i>
                      {editingFixtureId ? (
                        <>
                          {theme === 'artsnob' && 'Refine & Preserve'}
                          {theme === 'standard' && 'Update Fixture'}
                          {theme === 'minimal' && 'Update'}
                        </>
                      ) : (
                        <>
                          {theme === 'artsnob' && 'Immortalize Fixture'}
                          {theme === 'standard' && 'Save Fixture'}
                          {theme === 'minimal' && 'Save'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (              <button 
                className={styles.createButton}
                onClick={() => {
                  setFixtureForm({ 
                    name: '',
                    startAddress: calculateNextStartAddress(),
                    channels: [{ name: 'Intensity', type: 'dimmer' }]
                  });
                  setEditingFixtureId(null);
                  setShowCreateFixture(true);
                }}
              >
                <i className="fas fa-plus"></i>
                {theme === 'artsnob' && 'Craft Custom Fixture'}
                {theme === 'standard' && 'Add Custom Fixture'}
                {theme === 'minimal' && 'Custom'}
              </button>
            )}
            {!showCreateFixture && (
              <div className={styles.templateSection}>
                <h4 className={styles.templateTitle}>
                  {theme === 'artsnob' ? 'Or, select an archetype:' : 
                   theme === 'standard' ? 'Create from template:' : 'Templates:'}
                </h4>
                <div className={styles.templateButtons}>
                  {fixtureTemplates.map(template => (
                    <button
                      key={template.templateName}
                      className={styles.templateButton}
                      onClick={() => {
                        const nextAddress = calculateNextStartAddress();
                        const existingNames = fixtures.map(f => f.name);
                        let suggestedName = template.defaultNamePrefix;
                        let counter = 1;
                        while (existingNames.includes(suggestedName)) {
                          suggestedName = `${template.defaultNamePrefix} ${counter++}`;
                        }                        setFixtureForm({
                          name: suggestedName,
                          startAddress: nextAddress,
                          // Deep copy channels to prevent modifying template array
                          channels: JSON.parse(JSON.stringify(template.channels)) 
                        });
                        setEditingFixtureId(null);
                        setShowCreateFixture(true);
                      }}
                    >
                      {template.templateName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Group Management Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>
              {theme === 'artsnob' && 'Fixture Groups: The Constellations of Light'}
              {theme === 'standard' && 'Groups'}
              {theme === 'minimal' && 'Groups'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            {groups.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-object-group"></i>
                <p>No groups have been created yet</p>
              </div>
            ) : (
              <div className={styles.groupList}>
                {groups.map((group, index) => (
                  <div key={index} className={styles.groupItem}>
                    <div className={styles.groupHeader}>
                      <h4>{group.name}</h4>
                      <span className={styles.groupCount}>
                        {group.fixtureIndices.length} fixture{group.fixtureIndices.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className={styles.groupFixtures}>
                      {group.fixtureIndices.map(fixtureIndex => (
                        <div key={fixtureIndex} className={styles.groupFixtureTag}>
                          {fixtures[fixtureIndex]?.name || `Fixture #${fixtureIndex}`}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showCreateGroup ? (
              <div className={styles.groupForm}>
                <h4>
                  {theme === 'artsnob' && 'Create Fixture Group: The Collective Expression'}
                  {theme === 'standard' && 'New Group'}
                  {theme === 'minimal' && 'New Group'}
                </h4>
                
                <div className={styles.formGroup}>
                  <label htmlFor="groupName">Name:</label>
                  <input
                    type="text"
                    id="groupName"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                  />
                </div>
                
                <h5>
                  {theme === 'artsnob' && 'Select Fixtures: Choose Your Instruments'}
                  {theme === 'standard' && 'Select Fixtures'}
                  {theme === 'minimal' && 'Fixtures'}
                </h5>
                
                {fixtures.length === 0 ? (
                  <p className={styles.noFixturesMessage}>No fixtures available to add to group</p>
                ) : (
                  <div className={styles.fixtureSelection}>
                    {fixtures.map((fixture, index) => (
                      <div 
                        key={index}
                        className={`${styles.selectableFixture} ${
                          groupForm.fixtureIndices.includes(index) ? styles.selected : ''
                        }`}
                        onClick={() => toggleFixtureForGroup(index)}
                      >
                        <div className={styles.fixtureCheckbox}>
                          <input
                            type="checkbox"
                            checked={groupForm.fixtureIndices.includes(index)}
                            onChange={() => {}} // Handled by the div click
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className={styles.fixtureInfo}>
                          <span className={styles.fixtureName}>{fixture.name}</span>
                          <span className={styles.fixtureDmx}>
                            DMX: {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={styles.formActions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCreateGroup(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.saveButton}
                    onClick={saveGroup}
                    disabled={!groupForm.name || groupForm.fixtureIndices.length === 0}
                  >
                    <i className="fas fa-save"></i>
                    {theme === 'artsnob' && 'Establish Collective'}
                    {theme === 'standard' && 'Save Group'}
                    {theme === 'minimal' && 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className={styles.createButton}
                onClick={() => setShowCreateGroup(true)}
                disabled={fixtures.length === 0}
              >
                <i className="fas fa-plus"></i>
                {theme === 'artsnob' && 'Create Fixture Group'}
                {theme === 'standard' && 'Add Group'}
                {theme === 'minimal' && 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}