import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Fixture, MasterSlider, PlacedFixture as StorePlacedFixture, PlacedControl, useStore, MidiMapping } from '../../store';
import styles from './FixtureCanvas2D.module.scss';
// Removed MidiLearnButton import as we'll use a regular button and store actions directly for master sliders

// ... (Constants as before) ...
const DEFAULT_FIXTURE_RADIUS = 15;
const FIXTURE_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
const MASTER_SLIDER_WIDTH = 150;
const MASTER_SLIDER_HEIGHT = 30;
const MASTER_SLIDER_BG_COLOR = 'rgba(100, 100, 120, 0.8)';
const MASTER_SLIDER_TEXT_COLOR = '#ffffff';
const MASTER_SLIDER_VALUE_BAR_COLOR = 'rgba(136, 85, 255, 0.9)';
const MASTER_SLIDER_INTERACTION_PADDING = 5; 
const PLACED_CONTROL_WIDTH = 100; 
const PLACED_CONTROL_HEIGHT = 20;
const PLACED_CONTROL_BG_COLOR = 'rgba(120, 120, 120, 0.7)';
const PLACED_CONTROL_TEXT_COLOR = '#ffffff';
const PLACED_CONTROL_VALUE_BAR_COLOR = 'rgba(78, 205, 196, 0.8)'; 
const PLACED_CONTROL_INTERACTION_PADDING = 3;
const MIDI_OSC_DISPLAY_TEXT_COLOR = '#333';


interface PlacedFixture extends StorePlacedFixture {}

interface FixtureCanvas2DProps {
  fixtures: Fixture[]; 
  placedFixturesData: PlacedFixture[]; 
  onUpdatePlacedFixtures: (updatedFixtures: PlacedFixture[]) => void; 
}

export const FixtureCanvas2D: React.FC<FixtureCanvas2DProps> = ({ 
  fixtures, 
  placedFixturesData, 
  onUpdatePlacedFixtures 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ... (other state variables as before) ...
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 }); 
  const [placedFixtures, setPlacedFixtures] = useState<PlacedFixture[]>(placedFixturesData);
  const [selectedFixtureToAdd, setSelectedFixtureToAdd] = useState<Fixture | null>(null);
  const [draggingPlacedFixture, setDraggingPlacedFixture] = useState<PlacedFixture | null>(null);
  const [draggingMasterSlider, setDraggingMasterSlider] = useState<MasterSlider | null>(null);
  const [adjustingMasterSliderValue, setAdjustingMasterSliderValue] = useState<MasterSlider | null>(null);
  const [draggingPlacedControlInfo, setDraggingPlacedControlInfo] = 
    useState<{ fixtureId: string; controlId: string; control: PlacedControl } | null>(null);
  const [adjustingPlacedControlValueInfo, setAdjustingPlacedControlValueInfo] = 
    useState<{ fixtureId: string; controlId: string; control: PlacedControl; originalDmxAddress: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [selectedMasterSliderForConfig, setSelectedMasterSliderForConfig] = useState<MasterSlider | null>(null);
  const [editingMasterSliderName, setEditingMasterSliderName] = useState<string>("");
  const [selectedPlacedFixtureForConfig, setSelectedPlacedFixtureForConfig] = useState<PlacedFixture | null>(null);
  const [channelToAddControlTo, setChannelToAddControlTo] = useState<string>("");
  const [selectedPlacedControlForConfig, setSelectedPlacedControlForConfig] = 
    useState<{ fixtureId: string; control: PlacedControl } | null>(null);
  const [editingPlacedControlLabel, setEditingPlacedControlLabel] = useState<string>("");
  const [targetFixtureId, setTargetFixtureId] = useState<string>("");
  const [targetChannelName, setTargetChannelName] = useState<string>("");
  const [targetMinRange, setTargetMinRange] = useState<number>(0);
  const [targetMaxRange, setTargetMaxRange] = useState<number>(255);

  const { 
    masterSliders, addMasterSlider, updateMasterSlider,
    updateMasterSliderValue, removeMasterSlider, setDmxChannel,
    dmxChannels, midiMappings, 
    startMidiLearn, cancelMidiLearn, midiLearnTarget, // Added MIDI learn state/actions
  } = useStore(state => ({
    masterSliders: state.masterSliders,
    addMasterSlider: state.addMasterSlider,
    updateMasterSlider: state.updateMasterSlider,
    updateMasterSliderValue: state.updateMasterSliderValue,
    removeMasterSlider: state.removeMasterSlider,
    setDmxChannel: state.setDmxChannel,
    dmxChannels: state.dmxChannels,
    midiMappings: state.midiMappings,
    startMidiLearn: state.startMidiLearn,
    cancelMidiLearn: state.cancelMidiLearn,
    midiLearnTarget: state.midiLearnTarget,
  }));

  useEffect(() => { setPlacedFixtures(placedFixturesData); }, [placedFixturesData]);
  
  useEffect(() => {
    if (selectedMasterSliderForConfig) {
      setEditingMasterSliderName(selectedMasterSliderForConfig.name);
      setSelectedPlacedFixtureForConfig(null); 
      setSelectedPlacedControlForConfig(null);
    } else {
      // If deselecting master slider config, and it was in learn mode, cancel learn mode
      if (midiLearnTarget?.type === 'masterSlider' && midiLearnTarget.id === selectedMasterSliderForConfig?.id) {
        cancelMidiLearn();
      }
    }
  }, [selectedMasterSliderForConfig, cancelMidiLearn, midiLearnTarget]); // Added cancelMidiLearn and midiLearnTarget

  useEffect(() => { /* ... placed fixture config selection ... */ }, [selectedPlacedFixtureForConfig]);
  useEffect(() => { /* ... placed control config selection ... */ }, [selectedPlacedControlForConfig]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const getFixtureDefinition = (placedFixture: PlacedFixture | null): Fixture | undefined => { /* ... */ return undefined; };
  const getDmxAddressForPlacedControl = (pFixture: PlacedFixture, control: PlacedControl): number | null => { /* ... */ return null;};
  
  const drawCanvas = useCallback(() => { /* ... (includes MIDI display for PlacedControls and MasterSliders) ... */ }, 
    [/* ... all relevant dependencies including midiMappings ... */, midiLearnTarget] // Added midiLearnTarget
  );

  useEffect(() => { /* ... canvas setup and redraw ... */ }, [drawCanvas, canvasSize]);
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => { /* ... */ return {x:0,y:0}; };
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => { /* ... */ };
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => { /* ... */ };
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => { /* ... */ };
  const handleMouseUp = () => { /* ... */ };
  const handleMouseLeave = () => { handleMouseUp(); };
  const handleAddMasterSlider = () => { /* ... */ };
  const handleMasterSliderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const submitMasterSliderNameChange = () => { /* ... */ };
  const handleDeleteMasterSlider = () => { /* ... */ };
  
  const handleMasterSliderMidiLearnToggle = (slider: MasterSlider) => {
    if (midiLearnTarget?.type === 'masterSlider' && midiLearnTarget.id === slider.id) {
      cancelMidiLearn();
    } else {
      startMidiLearn({ type: 'masterSlider', id: slider.id });
    }
  };

  const handleAddControlToFixture = () => { /* ... */ };
  const handlePlacedControlLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const submitPlacedControlLabelChange = () => { /* ... */ };
  const handleDeletePlacedControl = () => { /* ... */ };
  const handleAddTargetToMasterSlider = () => { /* ... */ };
  const handleRemoveTargetFromMasterSlider = (targetToRemove: MasterSliderTarget) => { /* ... */ };
  const selectedTargetFixtureDef = targetFixtureId ? getFixtureDefinition(placedFixtures.find(pf => pf.id === targetFixtureId) || null) : null;


  return (
    <div className={styles.fixtureCanvasContainer}>
      {/* ... Controls Bar ... */}
      <div className={styles.canvasWrapper}>
        <canvas ref={canvasRef} className={styles.fixtureCanvas} /* ... event handlers ... */ />
        
        {selectedMasterSliderForConfig && (
          <div className={styles.masterSliderConfigPanel}>
            <h4>Configure: {selectedMasterSliderForConfig.name}</h4>
            {/* ... Name, Value inputs ... */}
            <div className={styles.formGroup}>
              <label>MIDI Control:</label>
              <button 
                onClick={() => handleMasterSliderMidiLearnToggle(selectedMasterSliderForConfig)}
                className={`${styles.panelMidiLearnButton} ${midiLearnTarget?.type === 'masterSlider' && midiLearnTarget.id === selectedMasterSliderForConfig.id ? styles.learningActive : ''}`}
              >
                {midiLearnTarget?.type === 'masterSlider' && midiLearnTarget.id === selectedMasterSliderForConfig.id 
                  ? "Listening... (Click to Cancel)" 
                  : selectedMasterSliderForConfig.midiMapping 
                    ? `Mapped: ${selectedMasterSliderForConfig.midiMapping.note !== undefined ? 'Note ' + selectedMasterSliderForConfig.midiMapping.note : 'CC ' + selectedMasterSliderForConfig.midiMapping.controller} (Ch ${selectedMasterSliderForConfig.midiMapping.channel})`
                    : "Assign MIDI"}
              </button>
            </div>
            {/* ... Targets Section ... */}
            {/* ... Delete Slider and Close buttons ... */}
          </div>
        )}

        {selectedPlacedFixtureForConfig && !selectedPlacedControlForConfig && ( /* ... PlacedFixture Config Panel ... */ )}
        {selectedPlacedControlForConfig && ( /* ... PlacedControl Config Panel ... */ )}
      </div>
    </div>
  );
};
