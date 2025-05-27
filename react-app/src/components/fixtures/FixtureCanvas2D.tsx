import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Fixture, MasterSlider, PlacedFixture as StorePlacedFixture, PlacedControl, useStore, MidiMapping } from '../../store';
import styles from './FixtureCanvas2D.module.scss';
// Removed MidiLearnButton import as we'll use a regular button and store actions directly for master sliders

// ... (Constants as before) ...
const DEFAULT_FIXTURE_RADIUS = 15;
const FIXTURE_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
const MASTER_SLIDER_WIDTH = 150;
const MASTER_SLIDER_HEIGHT = 30;
const MASTER_SLIDER_BG_COLOR = 'rgba(100, 100, 120, 0.9)';
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
}) => {  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ... (other state variables as before) ...
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
    canvasBackgroundImage, // Added background image from store
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
    canvasBackgroundImage: state.canvasBackgroundImage,
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
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // This function is no longer needed since CanvasImageUpload handles this
          // but keeping for legacy compatibility
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const getFixtureDefinition = (placedFixture: PlacedFixture | null): Fixture | undefined => {
    if (!placedFixture) return undefined;
    return fixtures.find(f => f.name === placedFixture.fixtureStoreId);
  };

  const getDmxAddressForPlacedControl = (pFixture: PlacedFixture, control: PlacedControl): number | null => {
    const fixtureDef = getFixtureDefinition(pFixture);
    if (!fixtureDef) return null;
    
    const channelIndex = fixtureDef.channels.findIndex(ch => ch.name === control.channelNameInFixture);
    if (channelIndex === -1) return null;
    
    return pFixture.startAddress + channelIndex;
  };
    const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw background image if available
    if (canvasBackgroundImage && canvasBackgroundImage.src) {
      ctx.globalAlpha = 0.7; // Make background slightly transparent
      ctx.drawImage(canvasBackgroundImage, 0, 0, canvasSize.width, canvasSize.height);
      ctx.globalAlpha = 1.0; // Reset alpha
    }

    // Draw placed fixtures
    placedFixtures.forEach(placedFixture => {
      const fixtureDef = getFixtureDefinition(placedFixture);
      if (!fixtureDef) return;

      // Draw fixture circle
      ctx.fillStyle = placedFixture.color;
      ctx.beginPath();
      ctx.arc(placedFixture.x, placedFixture.y, placedFixture.radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw fixture name
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(placedFixture.name, placedFixture.x, placedFixture.y - placedFixture.radius - 5);

      // Draw placed controls for this fixture
      if (placedFixture.controls) {
        placedFixture.controls.forEach(control => {
          const controlX = placedFixture.x + control.xOffset;
          const controlY = placedFixture.y + control.yOffset;

          // Draw control background
          ctx.fillStyle = PLACED_CONTROL_BG_COLOR;
          ctx.fillRect(
            controlX - PLACED_CONTROL_WIDTH / 2,
            controlY - PLACED_CONTROL_HEIGHT / 2,
            PLACED_CONTROL_WIDTH,
            PLACED_CONTROL_HEIGHT
          );

          // Draw control value bar
          const valuePercent = control.currentValue / 255;
          ctx.fillStyle = PLACED_CONTROL_VALUE_BAR_COLOR;
          ctx.fillRect(
            controlX - PLACED_CONTROL_WIDTH / 2,
            controlY - PLACED_CONTROL_HEIGHT / 2,
            PLACED_CONTROL_WIDTH * valuePercent,
            PLACED_CONTROL_HEIGHT
          );

          // Draw control label
          ctx.fillStyle = PLACED_CONTROL_TEXT_COLOR;
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(control.label, controlX, controlY + 3);          // Draw MIDI mapping indicator if available
          const dmxAddress = getDmxAddressForPlacedControl(placedFixture, control);
          if (dmxAddress !== null) {
            const mapping = midiMappings[dmxAddress];
            if (mapping) {
              ctx.fillStyle = MIDI_OSC_DISPLAY_TEXT_COLOR;
              ctx.font = '8px Arial';
              ctx.fillText('MIDI', controlX, controlY + 15);
            }
          }

          // Highlight if in MIDI learn mode
          if (midiLearnTarget?.type === 'placedControl' && 
              midiLearnTarget.fixtureId === placedFixture.id && 
              midiLearnTarget.controlId === control.id) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              controlX - PLACED_CONTROL_WIDTH / 2 - 2,
              controlY - PLACED_CONTROL_HEIGHT / 2 - 2,
              PLACED_CONTROL_WIDTH + 4,
              PLACED_CONTROL_HEIGHT + 4
            );
          }
        });
      }
    });

    // Draw master sliders
    masterSliders.forEach(slider => {
      // Draw slider background
      ctx.fillStyle = MASTER_SLIDER_BG_COLOR;
      ctx.fillRect(
        slider.position.x - MASTER_SLIDER_WIDTH / 2,
        slider.position.y - MASTER_SLIDER_HEIGHT / 2,
        MASTER_SLIDER_WIDTH,
        MASTER_SLIDER_HEIGHT
      );

      // Draw slider value bar
      const valuePercent = slider.value / 255;
      ctx.fillStyle = MASTER_SLIDER_VALUE_BAR_COLOR;
      ctx.fillRect(
        slider.position.x - MASTER_SLIDER_WIDTH / 2,
        slider.position.y - MASTER_SLIDER_HEIGHT / 2,
        MASTER_SLIDER_WIDTH * valuePercent,
        MASTER_SLIDER_HEIGHT
      );

      // Draw slider name and value
      ctx.fillStyle = MASTER_SLIDER_TEXT_COLOR;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${slider.name}: ${slider.value}`, slider.position.x, slider.position.y + 3);

      // Draw MIDI mapping indicator
      if (slider.midiMapping) {
        ctx.fillStyle = MIDI_OSC_DISPLAY_TEXT_COLOR;
        ctx.font = '8px Arial';
        ctx.fillText('MIDI', slider.position.x, slider.position.y + 20);
      }

      // Highlight if in MIDI learn mode
      if (midiLearnTarget?.type === 'masterSlider' && midiLearnTarget.id === slider.id) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          slider.position.x - MASTER_SLIDER_WIDTH / 2 - 2,
          slider.position.y - MASTER_SLIDER_HEIGHT / 2 - 2,
          MASTER_SLIDER_WIDTH + 4,
          MASTER_SLIDER_HEIGHT + 4
        );
      }
    });

    // Draw selection indicators
    if (selectedFixtureToAdd) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Click to place: ${selectedFixtureToAdd.name}`, 10, 30);
    }
  }, [
    canvasSize, 
    placedFixtures, 
    masterSliders, 
    selectedFixtureToAdd, 
    canvasBackgroundImage, 
    midiMappings, 
    midiLearnTarget,
    fixtures
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up canvas context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial draw
    drawCanvas();

    // Handle canvas resize
    const handleResize = () => {
      drawCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [drawCanvas, canvasSize]);
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedFixtureToAdd) return;

    const mousePos = getMousePos(event);    const newFixture: PlacedFixture = {
      id: `placed-${Date.now()}-${Math.random()}`,
      fixtureId: selectedFixtureToAdd.name, // Add missing fixtureId property
      fixtureStoreId: selectedFixtureToAdd.name,
      name: selectedFixtureToAdd.name,
      x: mousePos.x,
      y: mousePos.y,
      color: FIXTURE_COLORS[placedFixtures.length % FIXTURE_COLORS.length],
      radius: DEFAULT_FIXTURE_RADIUS,
      startAddress: selectedFixtureToAdd.startAddress,
      controls: []
    };

    const updatedFixtures = [...placedFixtures, newFixture];
    setPlacedFixtures(updatedFixtures);
    onUpdatePlacedFixtures(updatedFixtures);
    setSelectedFixtureToAdd(null);
  };
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
  const handleRemoveTargetFromMasterSlider = (targetToRemove: MasterSlider) => { /* ... */ };
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

        {selectedPlacedFixtureForConfig && !selectedPlacedControlForConfig && (null)}
        {selectedPlacedControlForConfig && ( /* ... PlacedControl Config Panel ... */ null)}
      </div>
    </div>
  );
};
