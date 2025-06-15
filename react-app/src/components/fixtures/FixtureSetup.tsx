import React, { useState, useEffect } from 'react'
import { useStore, PlacedFixture, Group } from '../../store' // Import PlacedFixture and Group
import useStoreUtils from '../../store/storeUtils'
import { useTheme } from '../../context/ThemeContext'
import { ColorPickerPanel } from './ColorPickerPanel'; // Added ColorPickerPanel
import { LucideIcon } from '../ui/LucideIcon'; // Added for icons
import { NodeBasedFixtureEditor } from './NodeBasedFixtureEditor'; // Import Node Editor
import styles from './FixtureSetup.module.scss'

// PlacedFixtureOnSetup type is no longer needed here, will use PlacedFixture from store
import { MidiLearnButton } from '../midi/MidiLearnButton'; // Import MidiLearnButton

interface FixtureChannel {
  name: string
  type: 'dimmer' | 'red' | 'green' | 'blue' | 'white' | 'amber' | 'uv' | 'pan' | 'pan_fine' | 'tilt' | 'tilt_fine' | 'shutter' | 'zoom' | 'focus' | 'color_wheel' | 'gobo_wheel' | 'gobo_rotation' | 'prism' | 'iris' | 'macro' | 'reset' | 'speed' | 'sound' | 'strobe' | 'effect' | 'other';
  dmxAddress?: number; // Optional DMX address override
}

interface FixtureFormData {
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  mode: string;
  startAddress: number;
  channels: FixtureChannel[];
  notes: string;
}

const channelTypes = [
  { value: 'dimmer', label: 'Dimmer/Intensity' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'white', label: 'White' },
  { value: 'amber', label: 'Amber' },
  { value: 'uv', label: 'UV' },
  { value: 'pan', label: 'Pan' },
  { value: 'pan_fine', label: 'Pan Fine' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'tilt_fine', label: 'Tilt Fine' },
  { value: 'shutter', label: 'Shutter' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'focus', label: 'Focus' },
  { value: 'color_wheel', label: 'Color Wheel' },
  { value: 'gobo_wheel', label: 'Gobo Wheel' },
  { value: 'gobo_rotation', label: 'Gobo Rotation' },
  { value: 'prism', label: 'Prism' },
  { value: 'iris', label: 'Iris' },
  { value: 'macro', label: 'Macro' },
  { value: 'reset', label: 'Reset' },
  { value: 'speed', label: 'Speed' },
  { value: 'sound', label: 'Sound' },
  { value: 'strobe', label: 'Strobe' },
  { value: 'effect', label: 'Effect' },
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
      { name: 'Gobo Wheel', type: 'gobo_wheel' },
      { name: 'Color Wheel', type: 'color_wheel' },
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
      { name: 'Blue', type: 'blue' },      { name: 'White', type: 'white' }, 
      { name: 'Dimmer', type: 'dimmer' },
    ],  },  {
    templateName: 'Professional Moving Head Spot',
    defaultNamePrefix: 'Pro Spot',
    channels: [
      { name: 'Pan', type: 'pan' },
      { name: 'Pan Fine', type: 'pan_fine' },
      { name: 'Tilt', type: 'tilt' },
      { name: 'Tilt Fine', type: 'tilt_fine' },
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Shutter/Strobe', type: 'shutter' },
      { name: 'Zoom', type: 'zoom' },
      { name: 'Focus', type: 'focus' },
      { name: 'Color Wheel', type: 'color_wheel' },
      { name: 'Gobo Wheel 1', type: 'gobo_wheel' },
      { name: 'Gobo Wheel 2', type: 'gobo_wheel' },
      { name: 'Gobo Rotation', type: 'gobo_rotation' },
      { name: 'Prism', type: 'prism' },
      { name: 'Iris', type: 'iris' },
      { name: 'Macro', type: 'macro' },
      { name: 'Reset', type: 'reset' },
    ],
  },
  {
    templateName: 'RGBAW+UV LED Par',
    defaultNamePrefix: 'RGBAWUV Par',
    channels: [
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' },
      { name: 'Amber', type: 'amber' },
      { name: 'White', type: 'white' },
      { name: 'UV', type: 'uv' },
      { name: 'Master Dimmer', type: 'dimmer' },
      { name: 'Strobe', type: 'strobe' },
      { name: 'Speed', type: 'speed' },
      { name: 'Sound Active', type: 'sound' },
      { name: 'Macro Effects', type: 'effect' },
    ],
  },  {
    templateName: 'Moving Head Wash',
    defaultNamePrefix: 'Moving Wash',
    channels: [
      { name: 'Pan', type: 'pan' },
      { name: 'Pan Fine', type: 'pan_fine' },
      { name: 'Tilt', type: 'tilt' },
      { name: 'Tilt Fine', type: 'tilt_fine' },
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' },
      { name: 'White', type: 'white' },
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Shutter', type: 'shutter' },
      { name: 'Zoom', type: 'zoom' },
      { name: 'Macro', type: 'macro' },
      { name: 'Speed', type: 'speed' },
    ],
  },
  {
    templateName: 'Laser Projector',
    defaultNamePrefix: 'Laser',
    channels: [
      { name: 'Mode', type: 'macro' },
      { name: 'Pattern', type: 'gobo_wheel' },
      { name: 'Zoom', type: 'zoom' },
      { name: 'Y-Axis Rolling', type: 'pan' },
      { name: 'X-Axis Rolling', type: 'tilt' },
      { name: 'Speed', type: 'speed' },
      { name: 'Strobe', type: 'strobe' },
    ],
  },
  {
    templateName: 'Fog Machine',
    defaultNamePrefix: 'Fog',
    channels: [
      { name: 'Fog Output', type: 'dimmer' },
      { name: 'Timer Mode', type: 'macro' },
    ],
  },
  {
    templateName: 'Strobe Light',
    defaultNamePrefix: 'Strobe',
    channels: [
      { name: 'Strobe Rate', type: 'strobe' },
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Sound Active', type: 'sound' },
    ],
  },  {
    templateName: 'MINI BEAM - Pan/Tilt Prism Mover',
    defaultNamePrefix: 'MINI BEAM',
    channels: [
      { name: 'Color Wheel', type: 'color_wheel' },
      { name: 'Flash/Strobe', type: 'strobe' },
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Gobo', type: 'gobo_wheel' },
      { name: 'Prism 1', type: 'prism' },
      { name: 'Prism Rotation', type: 'gobo_rotation' },
      { name: 'Prism 2', type: 'prism' },
      { name: 'Frost', type: 'other' },
      { name: 'Focus', type: 'focus' },
      { name: 'Pan', type: 'pan' },
      { name: 'Pan Fine', type: 'pan_fine' },
      { name: 'Tilt', type: 'tilt' },
      { name: 'Tilt Fine', type: 'tilt_fine' },
      { name: 'Function/Speed', type: 'macro' },
      { name: 'Reset', type: 'reset' },
      { name: 'Lamp', type: 'other' },
    ],
  },
  {
    templateName: 'LED Spider Light - Dual Motor RGBW',
    defaultNamePrefix: 'LED Spider',
    channels: [
      { name: 'Motor 1 Rotate', type: 'pan' },
      { name: 'Motor 2 Rotate', type: 'tilt' },
      { name: 'Master Dimmer', type: 'dimmer' },
      { name: 'Strobe', type: 'strobe' },
      { name: 'Motor 1 Red', type: 'red' },
      { name: 'Motor 1 Green', type: 'green' },
      { name: 'Motor 1 Blue', type: 'blue' },
      { name: 'Motor 1 White', type: 'white' },
      { name: 'Motor 2 Red', type: 'red' },
      { name: 'Motor 2 Green', type: 'green' },
      { name: 'Motor 2 Blue', type: 'blue' },
      { name: 'Motor 2 White', type: 'white' },
      { name: 'Effect Programs', type: 'macro' },
      { name: 'Effect Speed', type: 'speed' },
      { name: 'Reset', type: 'reset' },
    ],
  },
  {
    templateName: 'EL1000RGB Laser Projector',
    defaultNamePrefix: 'EL1000RGB',
    channels: [
      { name: 'Laser On/Off', type: 'other' },
      { name: 'Color Control', type: 'color_wheel' },
      { name: 'Color Speed', type: 'speed' },
      { name: 'Pattern Option', type: 'gobo_wheel' },
      { name: 'Pattern Group', type: 'gobo_wheel' },
      { name: 'Pattern Size', type: 'zoom' },
      { name: 'Pattern Auto Zoom', type: 'zoom' },
      { name: 'Center Rotation', type: 'gobo_rotation' },
      { name: 'Horizontal Rotation', type: 'pan' },
      { name: 'Vertical Rotation', type: 'tilt' },
      { name: 'Horizontal Move', type: 'pan' },
      { name: 'Vertical Move', type: 'tilt' },
      { name: 'Wave Effect', type: 'effect' },
      { name: 'Pattern Drawing', type: 'effect' },
      { name: 'Inner Dynamic Effect', type: 'macro' },
      { name: 'Inner Effect Speed', type: 'speed' },
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
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    mode: '',
    startAddress: 1,
    channels: [{ name: 'Intensity', type: 'dimmer' }],
    notes: ''
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
  const [searchTerm, setSearchTerm] = useState('');  const [showAdvancedSelection, setShowAdvancedSelection] = useState(false);
  const [showFlagPanel, setShowFlagPanel] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagColor, setNewFlagColor] = useState('#ff6b6b');
  const [newFlagCategory, setNewFlagCategory] = useState('');
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [nodeEditorFixtureId, setNodeEditorFixtureId] = useState<string | null>(null);

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
  
  // Get the effective DMX address for a channel (either custom or calculated from start address)
  const getEffectiveDmxAddress = (channelIndex: number): number => {
    const channel = fixtureForm.channels[channelIndex];
    if (channel.dmxAddress !== undefined && channel.dmxAddress >= 1 && channel.dmxAddress <= 512) {
      return channel.dmxAddress;
    }
    return fixtureForm.startAddress + channelIndex;
  };

  // Validate individual DMX address
  const validateDmxAddress = (channelIndex: number, newAddress: number): string | null => {
    if (newAddress < 1 || newAddress > 512) {
      return 'DMX address must be between 1 and 512';
    }

    // Check for conflicts with other channels in the same fixture
    for (let i = 0; i < fixtureForm.channels.length; i++) {
      if (i !== channelIndex) {
        const otherAddress = getEffectiveDmxAddress(i);
        if (otherAddress === newAddress) {
          return `DMX address ${newAddress} is already used by channel "${fixtureForm.channels[i].name}"`;
        }
      }
    }

    // Check for conflicts with other fixtures
    const conflict = fixtures.find(fixture => {
      if (editingFixtureId && fixture.id === editingFixtureId) {
        return false; // Skip the fixture being edited
      }
      
      return fixture.channels.some((ch, idx) => {
        const effectiveAddress = ch.dmxAddress || (fixture.startAddress + idx);
        return effectiveAddress === newAddress;
      });
    });

    if (conflict) {
      return `DMX address ${newAddress} is already used by fixture "${conflict.name}"`;
    }

    return null; // No conflict
  };

  // Handle DMX address change for individual channels
  const handleDmxAddressChange = (channelIndex: number, newAddress: string) => {
    const addressNum = parseInt(newAddress);
    if (isNaN(addressNum)) {
      return; // Invalid input, don't update
    }

    const validationError = validateDmxAddress(channelIndex, addressNum);
    if (validationError) {
      useStoreUtils.getState().addNotification({
        message: validationError,
        type: 'warning',
        priority: 'medium'
      });
      return;
    }

    handleChannelChange(channelIndex, 'dmxAddress', addressNum);
  };

  // Reset channel to use calculated address from start address
  const resetChannelToCalculated = (channelIndex: number) => {
    handleChannelChange(channelIndex, 'dmxAddress', undefined);
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
    }    const newFixture = {
      id: `fixture-${Date.now()}-${Math.random()}`,
      name: fixtureForm.name,
      type: fixtureForm.type,
      manufacturer: fixtureForm.manufacturer,
      model: fixtureForm.model,
      mode: fixtureForm.mode,
      startAddress: fixtureForm.startAddress,
      channels: fixtureForm.channels,
      notes: fixtureForm.notes
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
    }    const updatedFixture = {
      id: editingFixtureId,
      name: fixtureForm.name,
      type: fixtureForm.type,
      manufacturer: fixtureForm.manufacturer,
      model: fixtureForm.model,
      mode: fixtureForm.mode,
      startAddress: fixtureForm.startAddress,
      channels: fixtureForm.channels,
      notes: fixtureForm.notes
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
      type: fixture.type || '',
      manufacturer: fixture.manufacturer || '',
      model: fixture.model || '',
      mode: fixture.mode || '',
      startAddress: fixture.startAddress,
      channels: [...fixture.channels], // Create a copy to avoid direct mutation
      notes: fixture.notes || ''
    })
    setShowCreateFixture(true)
  }

  // Import/Export functionality
  const exportAllFixtures = () => {
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      fixtures: fixtures.map(fixture => ({
        name: fixture.name,
        type: fixture.type || '',
        manufacturer: fixture.manufacturer || '',
        model: fixture.model || '',
        mode: fixture.mode || '',
        channels: fixture.channels,
        notes: fixture.notes || ''
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `artbastard-fixtures-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);    // Show success notification
    useStoreUtils.getState().addNotification({
      message: `Exported ${fixtures.length} fixtures successfully`,
      type: 'success',
      priority: 'normal'
    });
  };

  const exportSelectedFixtures = () => {
    if (selectedFixtures.length === 0) {      useStoreUtils.getState().addNotification({
        message: 'No fixtures selected for export',
        type: 'warning',
        priority: 'normal'
      });
      return;
    }

    const selectedFixtureData = fixtures.filter(f => selectedFixtures.includes(f.id));
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      fixtures: selectedFixtureData.map(fixture => ({
        name: fixture.name,
        type: fixture.type || '',
        manufacturer: fixture.manufacturer || '',
        model: fixture.model || '',
        mode: fixture.mode || '',
        channels: fixture.channels,
        notes: fixture.notes || ''
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `artbastard-selected-fixtures-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);    // Show success notification
    useStoreUtils.getState().addNotification({
      message: `Exported ${selectedFixtures.length} selected fixtures successfully`,
      type: 'success',
      priority: 'normal'
    });
  };

  const importFixtures = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Validate import data structure
        if (!importData.fixtures || !Array.isArray(importData.fixtures)) {
          throw new Error('Invalid file format: Missing fixtures array');
        }

        let importedCount = 0;
        let conflictCount = 0;
        const conflicts: string[] = [];

        importData.fixtures.forEach((fixtureData: any, index: number) => {
          // Validate required fields
          if (!fixtureData.name || !fixtureData.channels || !Array.isArray(fixtureData.channels)) {
            console.warn(`Skipping fixture ${index + 1}: Invalid data structure`);
            return;
          }

          // Check for DMX address conflicts and auto-resolve
          let startAddress = fixtureData.startAddress || calculateNextStartAddress();
          let originalStartAddress = startAddress;
          
          // Keep incrementing until we find a free address space
          while (checkDmxConflict(startAddress, fixtureData.channels.length)) {
            startAddress++;
            if (startAddress > 512 - fixtureData.channels.length) {
              console.warn(`Cannot import "${fixtureData.name}": No available DMX addresses`);
              return;
            }
          }

          // Track if we had to change the address
          if (startAddress !== originalStartAddress) {
            conflictCount++;
            conflicts.push(`"${fixtureData.name}" moved from DMX ${originalStartAddress} to ${startAddress}`);
          }

          // Create fixture with auto-resolved address
          const newFixture = {
            name: fixtureData.name,
            type: fixtureData.type || '',
            manufacturer: fixtureData.manufacturer || '',
            model: fixtureData.model || '',
            mode: fixtureData.mode || '',
            startAddress: startAddress,
            channels: fixtureData.channels.map((ch: any) => ({
              name: ch.name || 'Unnamed Channel',
              type: channelTypes.find(ct => ct.value === ch.type) ? ch.type : 'other'
            })),
            notes: fixtureData.notes || ''
          };

          // Add fixture to store
          useStoreUtils.setState(state => ({
            fixtures: [...state.fixtures, { ...newFixture, id: `fixture-${Date.now()}-${Math.random()}` }]
          }));
          importedCount++;
        });        // Show import results
        useStoreUtils.getState().addNotification({
          message: importedCount > 0 ? `Successfully imported ${importedCount} fixtures${conflictCount > 0 ? ` (${conflictCount} addresses auto-resolved)` : ''}` : 'No fixtures were imported',
          type: importedCount > 0 ? 'success' : 'warning',
          priority: 'normal'
        });

        // Show conflict details if any
        if (conflicts.length > 0 && conflicts.length <= 5) {
          setTimeout(() => {
            useStoreUtils.getState().addNotification({
              message: `Address conflicts resolved: ${conflicts.join(', ')}`,
              type: 'info',
              priority: 'low'
            });
          }, 1500);
        } else if (conflicts.length > 5) {
          setTimeout(() => {
            useStoreUtils.getState().addNotification({
              message: `${conflicts.length} DMX address conflicts were automatically resolved`,
              type: 'info',
              priority: 'low'
            });
          }, 1500);
        }      } catch (error) {
        console.error('Import error:', error);
        useStoreUtils.getState().addNotification({
          message: `Import failed: ${error instanceof Error ? error.message : 'Invalid file format'}`,
          type: 'error',
          priority: 'high'
        });
      }
    };

    reader.readAsText(file);
    // Reset the input so the same file can be imported again
    event.target.value = '';
  };

  // Hidden file input ref for import functionality
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerImport = () => {
    fileInputRef.current?.click();
  };
  // Missing fixture and group management functions
  const deleteFixture = (fixtureId: string) => {
    useStoreUtils.setState(state => ({
      fixtures: state.fixtures.filter(f => f.id !== fixtureId)
    }));
    useStoreUtils.getState().addNotification({
      message: 'Fixture deleted successfully',
      type: 'success',
      priority: 'normal'
    });
  };

  // Open node editor for fixture
  const openNodeEditor = (fixtureId: string) => {
    setNodeEditorFixtureId(fixtureId)
    setShowNodeEditor(true)
  }

  // Close node editor
  const closeNodeEditor = () => {
    setShowNodeEditor(false)
    setNodeEditorFixtureId(null)
  }

  const resetForm = () => {
    setFixtureForm({
      name: '',
      type: '',
      manufacturer: '',
      model: '',
      mode: '',
      startAddress: calculateNextStartAddress(),
      channels: [{ name: 'Channel 1', type: 'other' }],
      notes: ''
    });
    setEditingFixtureId(null);
    setShowCreateFixture(false);
  };

  const saveGroup = () => {
    if (!groupForm.name || !groupForm.fixtureIndices || groupForm.fixtureIndices.length === 0) return;

    const newGroup = {
      id: `group-${Date.now()}-${Math.random()}`,
      name: groupForm.name,
      fixtureIndices: groupForm.fixtureIndices,
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    };

    useStoreUtils.setState(state => ({
      groups: [...state.groups, newGroup]
    }));

    useStoreUtils.getState().addNotification({
      message: 'Group created successfully',
      type: 'success',
      priority: 'normal'
    });

    setGroupForm({
      name: '',
      fixtureIndices: [],
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    });
    setShowCreateGroup(false);
  };

  const updateGroup = () => {
    if (!editingGroupId || !groupForm.name || !groupForm.fixtureIndices || groupForm.fixtureIndices.length === 0) return;

    useStoreUtils.setState(state => ({
      groups: state.groups.map(g => 
        g.id === editingGroupId 
          ? { ...g, name: groupForm.name, fixtureIndices: groupForm.fixtureIndices }
          : g
      )
    }));

    useStoreUtils.getState().addNotification({
      message: 'Group updated successfully',
      type: 'success',
      priority: 'normal'
    });

    setGroupForm({
      name: '',
      fixtureIndices: [],
      lastStates: new Array(512).fill(0),
      isMuted: false,
      isSolo: false,
      masterValue: 255
    });
    setEditingGroupId(null);
    setShowCreateGroup(false);
  };

  const deleteGroup = (group: any) => {
    useStoreUtils.setState(state => ({
      groups: state.groups.filter(g => g.id !== group.id)
    }));
    useStoreUtils.getState().addNotification({
      message: 'Group deleted successfully',
      type: 'success',
      priority: 'normal'
    });
  };

  const startEditGroup = (group: any) => {
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name,
      fixtureIndices: [...group.fixtureIndices],
      lastStates: group.lastStates,
      isMuted: group.isMuted,
      isSolo: group.isSolo,
      masterValue: group.masterValue
    });
    setShowCreateGroup(true);
  };

  const toggleFixtureForGroup = (fixtureIndex: number) => {
    setGroupForm(prev => ({
      ...prev,
      fixtureIndices: prev.fixtureIndices.includes(fixtureIndex)
        ? prev.fixtureIndices.filter(i => i !== fixtureIndex)
        : [...prev.fixtureIndices, fixtureIndex]
    }));
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
        <div className={styles.card}>          <div className={styles.cardHeader}>
            <h3>
              {theme === 'artsnob' && 'Existing Fixtures: The Gallery of Light Instruments'}
              {theme === 'standard' && 'Fixture Library'}
              {theme === 'minimal' && 'Library'}
            </h3>            <div className={styles.headerActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importFixtures}
                style={{ display: 'none' }}
              />
              <button
                className={`${styles.actionButton} ${styles.importButton}`}
                onClick={triggerImport}
                title="Import fixtures from JSON file"
              >
                <i className="fas fa-upload"></i>
                Import
              </button>
              <button
                className={`${styles.actionButton} ${styles.exportButton}`}
                onClick={exportAllFixtures}
                disabled={fixtures.length === 0}
                title="Export all fixtures to JSON file"
              >
                <i className="fas fa-download"></i>
                Export All
              </button>
              {selectedFixtures.length > 0 && (
                <button
                  className={`${styles.actionButton} ${styles.exportSelectedButton}`}
                  onClick={exportSelectedFixtures}
                  title={`Export ${selectedFixtures.length} selected fixtures`}
                >
                  <i className="fas fa-download"></i>
                  Export Selected ({selectedFixtures.length})
                </button>
              )}
            </div>
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
                                </div>                                <button
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
                                  className={styles.nodeEditorButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openNodeEditor(fixture.id);
                                  }}
                                  title="Open Node Editor"
                                >
                                  <i className="fas fa-project-diagram"></i>
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

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fixtureType">Type:</label>
                    <input
                      type="text"
                      id="fixtureType"
                      value={fixtureForm.type}
                      onChange={(e) => handleFixtureChange('type', e.target.value)}
                      placeholder="e.g., Moving Head, Par Can"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="fixtureManufacturer">Manufacturer:</label>
                    <input
                      type="text"
                      id="fixtureManufacturer"
                      value={fixtureForm.manufacturer}
                      onChange={(e) => handleFixtureChange('manufacturer', e.target.value)}
                      placeholder="e.g., Chauvet, Martin"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fixtureModel">Model:</label>
                    <input
                      type="text"
                      id="fixtureModel"
                      value={fixtureForm.model}
                      onChange={(e) => handleFixtureChange('model', e.target.value)}
                      placeholder="e.g., MAC 250, SlimPar Pro H"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="fixtureMode">Mode:</label>
                    <input
                      type="text"
                      id="fixtureMode"
                      value={fixtureForm.mode}
                      onChange={(e) => handleFixtureChange('mode', e.target.value)}
                      placeholder="e.g., 16-bit, Extended"
                    />
                  </div>
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
                </div>                <div className={`${styles.formGroup} ${styles.notesField}`}>
                  <label htmlFor="fixtureNotes">Notes:</label>
                  <textarea
                    id="fixtureNotes"
                    value={fixtureForm.notes}
                    onChange={(e) => handleFixtureChange('notes', e.target.value)}
                    placeholder="Optional notes about this fixture (DMX modes, special features, etc.)"
                    rows={3}
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
                onClick={() => {                  setFixtureForm({ 
                    name: '',
                    type: '',
                    manufacturer: '',
                    model: '',
                    mode: '',
                    startAddress: calculateNextStartAddress(),
                    channels: [{ name: 'Intensity', type: 'dimmer' }],
                    notes: ''
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
                          type: '',
                          manufacturer: '',
                          model: '',
                          mode: '',
                          startAddress: nextAddress,
                          // Deep copy channels to prevent modifying template array
                          channels: JSON.parse(JSON.stringify(template.channels)),
                          notes: ''
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
                <i className="fas fa-plus"></i>                {theme === 'artsnob' && 'Create Fixture Group'}
                {theme === 'standard' && 'Add Group'}
                {theme === 'minimal' && 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Node-Based Fixture Editor */}
      {showNodeEditor && nodeEditorFixtureId && (
        <NodeBasedFixtureEditor
          fixtureId={nodeEditorFixtureId}
          onClose={closeNodeEditor}
        />
      )}
    </div>
  )
}