import React, { useState, useEffect } from 'react'
import { useStore, PlacedFixture, Group } from '../../store' // Import PlacedFixture and Group
import useStoreUtils from '../../store/storeUtils'
import { useTheme } from '../../context/ThemeContext'
import { ColorPickerPanel } from './ColorPickerPanel'; // Added ColorPickerPanel
import { LucideIcon } from '../ui/LucideIcon'; // Added for icons
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
}> = [  {
    templateName: 'Blank Template',
    defaultNamePrefix: 'Custom Fixture',
    channels: [{ name: 'Channel 1', type: 'other' }],
  },
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
  const { theme } = useTheme();
  const { 
    fixtures, 
    addFixtureFlag,
    removeFixtureFlag,
    bulkAddFlag,
    bulkRemoveFlag,
    createQuickFlag,
    getFixturesByFlag,
    getFixturesByFlagCategory
  } = useStore(state => ({
    fixtures: state.fixtures,
    addFixtureFlag: state.addFixtureFlag,
    removeFixtureFlag: state.removeFixtureFlag,
    bulkAddFlag: state.bulkAddFlag,
    bulkRemoveFlag: state.bulkRemoveFlag,
    createQuickFlag: state.createQuickFlag,
    getFixturesByFlag: state.getFixturesByFlag,
    getFixturesByFlagCategory: state.getFixturesByFlagCategory
  }));
  const groups = useStore(state => state.groups)
    const [showCreateFixture, setShowCreateFixture] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
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
  // Multi-select functionality state
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSelection, setShowAdvancedSelection] = useState(false);
  const [showFlagPanel, setShowFlagPanel] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagColor, setNewFlagColor] = useState('#ff6b6b');
  const [newFlagCategory, setNewFlagCategory] = useState('');

  // Filter fixtures based on search term
  const filteredFixtures = fixtures.filter(fixture =>
    fixture.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard shortcuts for multi-select operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + A: Select All
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        selectAll();
        return;
      }

      // Ctrl/Cmd + D: Deselect All
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        deselectAll();
        return;
      }

      // Ctrl/Cmd + I: Invert Selection
      if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
        event.preventDefault();
        invertSelection();
        return;
      }

      // Escape: Clear search and close panels
      if (event.key === 'Escape') {
        setSearchTerm('');
        setShowAdvancedSelection(false);
        setShowFlagPanel(false);
        return;
      }

      // Ctrl/Cmd + F: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }      // Delete: Delete selected fixtures
      if (event.key === 'Delete' && selectedFixtures.length > 0) {
        event.preventDefault();
        if (window.confirm(`Delete ${selectedFixtures.length} selected fixture(s)?`)) {
          selectedFixtures.forEach(fixtureId => {
            deleteFixture(fixtureId);
          });
          setSelectedFixtures([]);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFixtures, filteredFixtures]);

  // Multi-select functionality functions
  const selectAll = () => {
    setSelectedFixtures(filteredFixtures.map(f => f.id));
  };

  const deselectAll = () => {
    setSelectedFixtures([]);
  };

  const invertSelection = () => {
    const allIds = filteredFixtures.map(f => f.id);
    const newSelection = allIds.filter(id => !selectedFixtures.includes(id));
    setSelectedFixtures(newSelection);
  };

  const selectByType = (fixtureType: 'rgb' | 'movement' | 'dimmer') => {
    const typeFixtures = filteredFixtures.filter(fixture => {
      switch (fixtureType) {
        case 'rgb':
          return fixture.channels.some(ch => ch.type === 'red') &&
                 fixture.channels.some(ch => ch.type === 'green') &&
                 fixture.channels.some(ch => ch.type === 'blue');
        case 'movement':
          return fixture.channels.some(ch => ch.type === 'pan') ||
                 fixture.channels.some(ch => ch.type === 'tilt');
        case 'dimmer':
          return fixture.channels.some(ch => ch.type === 'dimmer');
        default:
          return false;
      }
    });
    setSelectedFixtures(typeFixtures.map(f => f.id));
  };

  const selectSimilar = () => {
    if (selectedFixtures.length === 0) return;
    
    const referenceFixture = fixtures.find(f => f.id === selectedFixtures[0]);
    if (!referenceFixture) return;
    
    const referenceChannelTypes = referenceFixture.channels.map(ch => ch.type).sort();
    const similarFixtures = filteredFixtures.filter(fixture => {
      const channelTypes = fixture.channels.map(ch => ch.type).sort();
      return JSON.stringify(channelTypes) === JSON.stringify(referenceChannelTypes);
    });
    
    setSelectedFixtures(similarFixtures.map(f => f.id));
  };

  const selectByFlag = (flagId: string) => {
    const flaggedFixtures = getFixturesByFlag(flagId);
    setSelectedFixtures(flaggedFixtures.map(f => f.id));
  };

  const selectByFlagCategory = (category: string) => {
    const flaggedFixtures = getFixturesByFlagCategory(category);
    setSelectedFixtures(flaggedFixtures.map(f => f.id));
  };

  const selectAllFlagged = () => {
    const flaggedFixtures = filteredFixtures.filter(f => f.isFlagged);
    setSelectedFixtures(flaggedFixtures.map(f => f.id));
  };

  // Flag management functions
  const createAndApplyFlag = () => {
    if (!newFlagName.trim() || selectedFixtures.length === 0) return;
    
    const flag = createQuickFlag(newFlagName.trim(), newFlagColor, newFlagCategory.trim() || undefined);
    bulkAddFlag(selectedFixtures, flag);
    
    // Reset form
    setNewFlagName('');
    setNewFlagColor('#ff6b6b');
    setNewFlagCategory('');
    setShowFlagPanel(false);
  };

  const getAllUniqueFlags = () => {
    const flagMap = new Map();
    fixtures.forEach(fixture => {
      if (fixture.flags) {
        fixture.flags.forEach(flag => {
          flagMap.set(flag.id, flag);
        });
      }
    });
    return Array.from(flagMap.values()).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
  };

  // Get all unique categories
  const getAllUniqueCategories = () => {
    const categories = new Set<string>();
    fixtures.forEach(fixture => {
      if (fixture.flags) {
        fixture.flags.forEach(flag => {
          if (flag.category) {
            categories.add(flag.category);
          }
        });
      }
    });
    return Array.from(categories).sort();
  };

  // Remove all flags from selected fixtures
  const removeSelectedFixtureFlags = () => {
    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (fixture && fixture.flags) {
        fixture.flags.forEach(flag => {
          removeFixtureFlag(fixtureId, flag.id);
        });
      }
  });
  };

  // Helper functions for form management
  const selectedFixtureName = () => {
    if (selectedFixtures.length === 0) return 'No fixtures selected';
    if (selectedFixtures.length === 1) {
      const fixture = fixtures.find(f => f.id === selectedFixtures[0]);
      return fixture?.name || 'Unknown';
    }
    return `${selectedFixtures.length} fixtures selected`;
  };

  const toggleFixtureSelection = (fixtureId: string) => {
    setSelectedFixtures(prevSelected =>
      prevSelected.includes(fixtureId)
        ? prevSelected.filter(id => id !== fixtureId)
        : [...prevSelected, fixtureId]
    );
  };

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
      // Skip the fixture we're editing
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
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255,
      position: undefined
    };

    useStoreUtils.setState(state => ({
      groups: [...state.groups, newGroup]
    }));
    
    setGroupForm({
      name: '',
      fixtureIndices: [],
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    });
    setShowCreateGroup(false);
    
    useStoreUtils.getState().addNotification({
      message: `Group "${newGroup.name}" created`,
      type: 'success',
      priority: 'normal'
    });
  };

  // Delete a group
  const deleteGroup = (group: Group) => {
    if (window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
      useStoreUtils.setState(state => ({
        groups: state.groups.filter(g => g.id !== group.id)
      }));
      
      useStoreUtils.getState().addNotification({
        message: `Group "${group.name}" deleted`,
        type: 'success',
        priority: 'normal'
      });
    }
  };

  // Start editing a group
  const startEditGroup = (group: Group) => {
    setGroupForm({
      name: group.name,
      fixtureIndices: [...group.fixtureIndices],
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    });
    setEditingGroupId(group.id);
    setShowCreateGroup(true);
  };

  // Update existing group
  const updateGroup = () => {
    if (!editingGroupId) return;

    const updatedGroup = {
      id: editingGroupId,
      name: groupForm.name!,
      fixtureIndices: [...groupForm.fixtureIndices!],
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    };
    setShowCreateGroup(false);
    setEditingGroupId(null);

    useStoreUtils.getState().addNotification({
      message: `Group "${updatedGroup.name}" updated`,
      type: 'success',
      priority: 'normal'
    });
  };
    return (
    <div className={styles.fixtureSetup}>
      <h2 className={styles.sectionTitle}>
        {theme === 'artsnob' && 'Fixture Library: The Arsenal of Illumination'}
        {theme === 'standard' && 'Fixture Management'}
        {theme === 'minimal' && 'Fixtures'}
      </h2>
      
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
              {theme === 'standard' && 'Fixture Library'}
              {theme === 'minimal' && 'Library'}
            </h3>
          </div>
          <div className={styles.cardBody}>
            {fixtures.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-lightbulb"></i>
                <p>No fixtures have been created yet</p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className={styles.searchSection}>
                  <div className={styles.searchContainer}>
                    <LucideIcon name="Search" />
                    <input
                      type="text"
                      placeholder="Search fixtures..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className={styles.clearSearch}
                      >
                        <LucideIcon name="X" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Selection Summary */}
                {selectedFixtures.length > 0 && (
                  <div className={styles.selectionSummary}>
                    <div className={styles.summaryText}>
                      <span>{selectedFixtures.length} of {filteredFixtures.length} selected</span>
                    </div>
                    <div className={styles.summaryActions}>
                      <button
                        onClick={deselectAll}
                        className={styles.summaryButton}
                        title="Clear selection"
                      >
                        <LucideIcon name="X" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk Selection Controls */}
                <div className={styles.bulkControls}>
                  <button
                    className={styles.bulkButton}
                    onClick={selectAll}
                    title="Select all visible fixtures"
                  >
                    <LucideIcon name="CheckSquare" />
                    <span>All</span>
                  </button>
                  
                  <button
                    className={styles.bulkButton}
                    onClick={invertSelection}
                    title="Invert selection"
                  >
                    <LucideIcon name="RotateCcw" />
                    <span>Invert</span>
                  </button>
                  
                  <button
                    className={styles.bulkButton}
                    onClick={() => setShowAdvancedSelection(!showAdvancedSelection)}
                    title="Advanced selection"
                  >
                    <LucideIcon name="Filter" />
                    <span>Smart</span>
                  </button>
                  
                  <button
                    className={styles.bulkButton}
                    onClick={() => setShowFlagPanel(!showFlagPanel)}
                    title="Flag management"
                  >
                    <LucideIcon name="Tag" />
                    <span>Flags</span>
                  </button>
                </div>

                {/* Advanced Selection Panel */}
                {showAdvancedSelection && (
                  <div className={styles.advancedSelection}>
                    <div className={styles.selectionByType}>
                      <h4>Select by Type:</h4>
                      <div className={styles.typeButtons}>
                        <button
                          onClick={() => selectByType('rgb')}
                          className={styles.typeButton}
                        >
                          <LucideIcon name="Palette" />
                          RGB
                        </button>
                        <button
                          onClick={() => selectByType('movement')}
                          className={styles.typeButton}
                        >
                          <LucideIcon name="Move" />
                          Movement
                        </button>
                        <button
                          onClick={() => selectByType('dimmer')}
                          className={styles.typeButton}
                        >
                          <LucideIcon name="Sun" />
                          Dimmer
                        </button>
                      </div>
                    </div>
                    <div className={styles.smartSelection}>
                      <button
                        onClick={selectSimilar}
                        disabled={selectedFixtures.length === 0}
                        className={styles.smartButton}
                      >
                        <LucideIcon name="Copy" />
                        Select Similar
                      </button>
                      <button
                        onClick={selectAllFlagged}
                        className={styles.smartButton}
                      >
                        <LucideIcon name="Flag" />
                        All Flagged
                      </button>
                    </div>
                  </div>
                )}

                {/* Flag Management Panel */}
                {showFlagPanel && (
                  <div className={styles.flagPanel}>
                    <div className={styles.flagCreation}>
                      <input
                        type="text"
                        placeholder="Flag name"
                        value={newFlagName}
                        onChange={(e) => setNewFlagName(e.target.value)}
                        className={styles.flagInput}
                      />
                      <input
                        type="color"
                        value={newFlagColor}
                        onChange={(e) => setNewFlagColor(e.target.value)}
                        className={styles.colorInput}
                      />
                      <input
                        type="text"
                        placeholder="Category (optional)"
                        value={newFlagCategory}
                        onChange={(e) => setNewFlagCategory(e.target.value)}
                        className={styles.flagInput}
                      />
                      <button
                        onClick={createAndApplyFlag}
                        disabled={!newFlagName.trim() || selectedFixtures.length === 0}
                        className={styles.createFlagButton}
                      >
                        Create & Apply
                      </button>
                    </div>

                    {/* Quick Selection by Flag */}
                    {getAllUniqueFlags().length > 0 && (
                      <div className={styles.flagSelection}>
                        <h4>Select by Flag:</h4>
                        {getAllUniqueFlags().map((flag: any) => (
                          <button
                            key={flag.id}
                            onClick={() => selectByFlag(flag.id)}
                            className={styles.flagButton}
                            style={{ backgroundColor: flag.color }}
                          >
                            {flag.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Selection by Category */}
                    {getAllUniqueCategories().length > 0 && (
                      <div className={styles.categorySelection}>
                        <h4>Select by Category:</h4>
                        {getAllUniqueCategories().map(category => (
                          <button
                            key={category}
                            onClick={() => selectByFlagCategory(category)}
                            className={styles.categoryButton}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Clear Flags */}
                    {selectedFixtures.length > 0 && (
                      <button
                        onClick={removeSelectedFixtureFlags}
                        className={styles.clearFlagsButton}
                      >
                        Clear Flags from Selected
                      </button>
                    )}
                  </div>
                )}

                {/* Enhanced Fixture List with checkboxes */}
                <div className={styles.fixtureList}>
                  {filteredFixtures.length === 0 ? (
                    <div className={styles.noResults}>
                      <LucideIcon name="Search" />
                      <span>No fixtures found</span>
                    </div>
                  ) : (
                    filteredFixtures.map((fixture, index) => {
                      const isSelected = selectedFixtures.includes(fixture.id);
                      const hasRgb = fixture.channels.some(ch => ['red', 'green', 'blue'].includes(ch.type));
                      const hasMovement = fixture.channels.some(ch => ['pan', 'tilt'].includes(ch.type));
                      const hasDimmer = fixture.channels.some(ch => ch.type === 'dimmer');
                      
                      return (
                        <div
                          key={fixture.id || index}
                          className={`${styles.fixtureItem} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleFixtureSelection(fixture.id)}
                        >
                          <div className={styles.fixtureCheckbox}>
                            <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                              {isSelected && <LucideIcon name="Check" />}
                            </div>
                          </div>
                          <div className={styles.fixtureContent}>
                            <div className={styles.fixtureHeader}>
                              <h4>{fixture.name}</h4>
                              <div className={styles.fixtureActions}>
                                <span className={styles.fixtureDmx}>
                                  DMX: {fixture.startAddress}-{fixture.startAddress + fixture.channels.length - 1}
                                </span>
                                <div className={styles.fixtureTypes}>
                                  {hasRgb && <span className={styles.typeIndicator} title="RGB">🎨</span>}
                                  {hasMovement && <span className={styles.typeIndicator} title="Movement">↔️</span>}
                                  {hasDimmer && <span className={styles.typeIndicator} title="Dimmer">💡</span>}
                                </div>
                                <button
                                  className={styles.editButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditFixture(fixture);
                                  }}
                                  title="Edit fixture"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className={styles.deleteButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFixture(fixture.id);
                                  }}
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
                            {/* Display flags if any */}
                            {fixture.flags && fixture.flags.length > 0 && (
                              <div className={styles.fixtureFlags}>
                                {fixture.flags.map((flag: any) => (
                                  <span
                                    key={flag.id}
                                    className={styles.flagTag}
                                    style={{ backgroundColor: flag.color }}
                                    title={flag.category ? `${flag.name} (${flag.category})` : flag.name}
                                  >
                                    {flag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
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
                  <div key={index} className={styles.groupItem}>                    <div className={styles.groupHeader}>
                      <h4>{group.name}</h4>
                      <div className={styles.groupActions}>
                        <span className={styles.groupCount}>
                          {group.fixtureIndices.length} fixture{group.fixtureIndices.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          className={styles.editButton}
                          onClick={() => startEditGroup(group)}
                          title="Edit group"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deleteGroup(group)}
                          title="Delete group"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className={styles.groupFixtures}>
                      {group.fixtureIndices.map(fixtureIndex => (
                        <div key={fixtureIndex} className={styles.groupFixtureTag}>
                          {fixtures[fixtureIndex]?.name || `Fixture #${fixtureIndex}`}
                        </div>
                      ))}
                    </div>
                    <div className={styles.groupActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => startEditGroup(group)}
                        title="Edit group"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => deleteGroup(group)}
                        title="Delete group"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
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
                  </button>                    <button 
                      className={styles.saveButton}
                      onClick={editingGroupId ? updateGroup : saveGroup}
                      disabled={!groupForm.name || groupForm.fixtureIndices.length === 0}
                    >
                      <i className="fas fa-save"></i>
                      {editingGroupId ? (
                        <>
                          {theme === 'artsnob' && 'Update Collective'}
                          {theme === 'standard' && 'Update Group'}
                          {theme === 'minimal' && 'Update'}
                        </>
                      ) : (
                        <>
                          {theme === 'artsnob' && 'Establish Collective'}
                          {theme === 'standard' && 'Save Group'}
                          {theme === 'minimal' && 'Save'}
                        </>
                      )}
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