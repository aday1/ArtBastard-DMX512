import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Fixture, MasterSlider, PlacedFixture as StorePlacedFixture, PlacedControl, useStore, MidiMapping } from '../../store';
import styles from './FixtureCanvas2D.module.scss';
// Removed MidiLearnButton import as we'll use a regular button and store actions directly for master sliders

const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');

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

// Grid and animation constants
const GRID_SIZE = 50;
const SNAP_THRESHOLD = 25; // Distance threshold for snapping
const DRAG_ANIMATION_DURATION = 200; // Animation duration in ms


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
    useState<{ fixtureId: string; controlId: string; control: PlacedControl } | null>(null);  const [adjustingPlacedControlValueInfo, setAdjustingPlacedControlValueInfo] = 
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
    // Animation and dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number; type: string } | null>(null);
  const [snapPreview, setSnapPreview] = useState<{ x: number; y: number } | null>(null);
  const [gridSnappingEnabled, setGridSnappingEnabled] = useState<boolean>(true);
  const { 
    masterSliders, addMasterSlider, updateMasterSlider,
    updateMasterSliderValue, removeMasterSlider, setDmxChannel,
    dmxChannels, midiMappings, 
    startMidiLearn, cancelMidiLearn, midiLearnTarget, // Added MIDI learn state/actions
    canvasBackgroundImage, // Added background image from store
    saveScene, // Add saveScene action for Quick Save functionality
    addNotification, // Add notification action for user feedback
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
    saveScene: state.saveScene, // Add saveScene action
    addNotification: state.addNotification, // Add notification action
  }));

  useEffect(() => { setPlacedFixtures(placedFixturesData); }, [placedFixturesData]);
  
  // Grid snapping utilities
  const snapToGrid = (value: number, gridSize: number = GRID_SIZE): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  const snapPositionToGrid = (x: number, y: number): { x: number; y: number } => {
    return {
      x: snapToGrid(x),
      y: snapToGrid(y)
    };
  };
  const getSnappedPosition = (
    currentX: number, 
    currentY: number, 
    bounds?: { minX: number; maxX: number; minY: number; maxY: number }
  ): { x: number; y: number } => {
    let finalX = currentX;
    let finalY = currentY;
    
    // Apply grid snapping if enabled
    if (gridSnappingEnabled) {
      finalX = snapToGrid(currentX);
      finalY = snapToGrid(currentY);
    }

    // Apply bounds if provided
    if (bounds) {
      finalX = Math.max(bounds.minX, Math.min(bounds.maxX, finalX));
      finalY = Math.max(bounds.minY, Math.min(bounds.maxY, finalY));
    }

    return { x: finalX, y: finalY };
  };

  const shouldSnapToGrid = (currentX: number, currentY: number): boolean => {
    if (!gridSnappingEnabled) return false;
    
    const nearestGridX = snapToGrid(currentX);
    const nearestGridY = snapToGrid(currentY);
    
    const distanceX = Math.abs(currentX - nearestGridX);
    const distanceY = Math.abs(currentY - nearestGridY);
    
    return distanceX <= SNAP_THRESHOLD || distanceY <= SNAP_THRESHOLD;
  };

  const animateToPosition = (
    element: PlacedFixture | MasterSlider,
    newPosition: { x: number; y: number },
    onComplete?: () => void
  ) => {
    // For now, we'll use immediate updates with CSS transitions
    // In a more advanced implementation, we could use requestAnimationFrame
    if (onComplete) {
      setTimeout(onComplete, DRAG_ANIMATION_DURATION);
    }
  };
  
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
    } else {
      // Draw default grid
      const gridColor = 'rgba(0, 255, 0, 0.5)'; // Green, semi-transparent
      const gridLineWidth = 2; // Thick lines
      const gridCellSize = 50; // Adjust as needed

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = gridLineWidth;
      ctx.beginPath();

      // Draw vertical lines
      for (let x = 0; x <= canvas.width; x += gridCellSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }

      // Draw horizontal lines
      for (let y = 0; y <= canvas.height; y += gridCellSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0; // Reset alpha just in case, though strokeStyle doesn't use it
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
    });    // Draw selection indicators
    if (selectedFixtureToAdd) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Click to place: ${selectedFixtureToAdd.name}`, 10, 30);
    }

    // Draw snap preview during dragging
    if (snapPreview && isDragging) {
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      // Draw snap indicator circle
      ctx.beginPath();
      ctx.arc(snapPreview.x, snapPreview.y, 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw crosshairs for snap point
      ctx.beginPath();
      ctx.moveTo(snapPreview.x - 15, snapPreview.y);
      ctx.lineTo(snapPreview.x + 15, snapPreview.y);
      ctx.moveTo(snapPreview.x, snapPreview.y - 15);
      ctx.lineTo(snapPreview.x, snapPreview.y + 15);
      ctx.stroke();
      
      ctx.setLineDash([]); // Reset line dash
    }

    // Draw drag ghost for better visual feedback
    if (dragGhost && isDragging) {
      ctx.globalAlpha = 0.5;
      
      if (dragGhost.type === 'fixture') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dragGhost.x, dragGhost.y, DEFAULT_FIXTURE_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (dragGhost.type === 'slider') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.fillRect(
          dragGhost.x - MASTER_SLIDER_WIDTH / 2,
          dragGhost.y - MASTER_SLIDER_HEIGHT / 2,
          MASTER_SLIDER_WIDTH,
          MASTER_SLIDER_HEIGHT
        );
        ctx.strokeRect(
          dragGhost.x - MASTER_SLIDER_WIDTH / 2,
          dragGhost.y - MASTER_SLIDER_HEIGHT / 2,
          MASTER_SLIDER_WIDTH,
          MASTER_SLIDER_HEIGHT
        );
      }
      
      ctx.globalAlpha = 1.0; // Reset alpha
    }  }, [
    canvasSize, 
    placedFixtures, 
    masterSliders, 
    selectedFixtureToAdd, 
    canvasBackgroundImage, 
    midiMappings, 
    midiLearnTarget,
    fixtures,
    isDragging,
    dragGhost,
    snapPreview
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
  };  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedFixtureToAdd) return;

    const mousePos = getMousePos(event);
    
    // Snap new fixture placement to grid
    const snappedPos = snapPositionToGrid(mousePos.x, mousePos.y);
    
    // Ensure the snapped position is within canvas bounds
    const bounds = {
      minX: DEFAULT_FIXTURE_RADIUS,
      maxX: canvasSize.width - DEFAULT_FIXTURE_RADIUS,
      minY: DEFAULT_FIXTURE_RADIUS,
      maxY: canvasSize.height - DEFAULT_FIXTURE_RADIUS
    };
    
    const finalPos = getSnappedPosition(snappedPos.x, snappedPos.y, bounds);
    
    const newFixtureId = `placed-${Date.now()}-${Math.random()}`;

    const generatedControls: PlacedControl[] = [];
    if (selectedFixtureToAdd.channels) {
      selectedFixtureToAdd.channels.forEach((channel, index) => {
        const controlId = `control-${newFixtureId}-${sanitizeName(channel.name)}-${index}`;
        generatedControls.push({
          id: controlId,
          channelNameInFixture: channel.name,
          type: 'slider', // Default type
          label: channel.name.substring(0, 12), // Keep label concise
          xOffset: 0,
          yOffset: DEFAULT_FIXTURE_RADIUS + 10 + (index * (PLACED_CONTROL_HEIGHT + 8)), // Position below fixture icon
          currentValue: 0,
        });
      });
    }

    const newFixture: PlacedFixture = {
      id: newFixtureId,
      fixtureId: selectedFixtureToAdd.name,
      fixtureStoreId: selectedFixtureToAdd.name,
      name: selectedFixtureToAdd.name,
      x: finalPos.x,
      y: finalPos.y,
      color: FIXTURE_COLORS[placedFixtures.length % FIXTURE_COLORS.length],
      radius: DEFAULT_FIXTURE_RADIUS,
      startAddress: selectedFixtureToAdd.startAddress,
      controls: generatedControls
    };

    const updatedFixtures = [...placedFixtures, newFixture];
    setPlacedFixtures(updatedFixtures);
    onUpdatePlacedFixtures(updatedFixtures);
    setSelectedFixtureToAdd(null);
  };const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return; // Only handle left mouse button
    
    const mousePos = getMousePos(event);
    
    // Check if clicking on a master slider
    for (const slider of masterSliders) {
      const sliderBounds = {
        left: slider.position.x - MASTER_SLIDER_WIDTH / 2 - MASTER_SLIDER_INTERACTION_PADDING,
        right: slider.position.x + MASTER_SLIDER_WIDTH / 2 + MASTER_SLIDER_INTERACTION_PADDING,
        top: slider.position.y - MASTER_SLIDER_HEIGHT / 2 - MASTER_SLIDER_INTERACTION_PADDING,
        bottom: slider.position.y + MASTER_SLIDER_HEIGHT / 2 + MASTER_SLIDER_INTERACTION_PADDING
      };
      
      if (mousePos.x >= sliderBounds.left && mousePos.x <= sliderBounds.right &&
          mousePos.y >= sliderBounds.top && mousePos.y <= sliderBounds.bottom) {
        
        // Check if clicking on the value bar area for adjustment
        const valueBarBounds = {
          left: slider.position.x - MASTER_SLIDER_WIDTH / 2,
          right: slider.position.x + MASTER_SLIDER_WIDTH / 2,
          top: slider.position.y - MASTER_SLIDER_HEIGHT / 2,
          bottom: slider.position.y + MASTER_SLIDER_HEIGHT / 2
        };
        
        if (mousePos.x >= valueBarBounds.left && mousePos.x <= valueBarBounds.right &&
            mousePos.y >= valueBarBounds.top && mousePos.y <= valueBarBounds.bottom) {
          setAdjustingMasterSliderValue(slider);
          // Calculate and set initial value based on mouse position
          const valuePercent = Math.max(0, Math.min(1, (mousePos.x - valueBarBounds.left) / MASTER_SLIDER_WIDTH));
          const newValue = Math.round(valuePercent * 255);
          updateMasterSliderValue(slider.id, newValue);
          return;
        }
          // Start dragging the slider
        setDraggingMasterSlider(slider);
        setIsDragging(true);
        setDragOffset({ 
          x: mousePos.x - slider.position.x, 
          y: mousePos.y - slider.position.y 
        });
        return;
      }
    }
    
    // Check if clicking on a placed control
    for (const placedFixture of placedFixtures) {
      if (placedFixture.controls) {
        for (const control of placedFixture.controls) {
          const controlX = placedFixture.x + control.xOffset;
          const controlY = placedFixture.y + control.yOffset;
          const controlBounds = {
            left: controlX - PLACED_CONTROL_WIDTH / 2 - PLACED_CONTROL_INTERACTION_PADDING,
            right: controlX + PLACED_CONTROL_WIDTH / 2 + PLACED_CONTROL_INTERACTION_PADDING,
            top: controlY - PLACED_CONTROL_HEIGHT / 2 - PLACED_CONTROL_INTERACTION_PADDING,
            bottom: controlY + PLACED_CONTROL_HEIGHT / 2 + PLACED_CONTROL_INTERACTION_PADDING
          };
          
          if (mousePos.x >= controlBounds.left && mousePos.x <= controlBounds.right &&
              mousePos.y >= controlBounds.top && mousePos.y <= controlBounds.bottom) {
            
            // Check if clicking on the value bar area for adjustment
            const valueBarBounds = {
              left: controlX - PLACED_CONTROL_WIDTH / 2,
              right: controlX + PLACED_CONTROL_WIDTH / 2,
              top: controlY - PLACED_CONTROL_HEIGHT / 2,
              bottom: controlY + PLACED_CONTROL_HEIGHT / 2
            };
            
            if (mousePos.x >= valueBarBounds.left && mousePos.x <= valueBarBounds.right &&
                mousePos.y >= valueBarBounds.top && mousePos.y <= valueBarBounds.bottom) {
              const dmxAddress = getDmxAddressForPlacedControl(placedFixture, control);
              if (dmxAddress !== null) {
                setAdjustingPlacedControlValueInfo({ 
                  fixtureId: placedFixture.id, 
                  controlId: control.id, 
                  control, 
                  originalDmxAddress: dmxAddress 
                });
                // Calculate and set initial value based on mouse position
                const valuePercent = Math.max(0, Math.min(1, (mousePos.x - valueBarBounds.left) / PLACED_CONTROL_WIDTH));
                const newValue = Math.round(valuePercent * 255);
                setDmxChannel(dmxAddress, newValue);
                // Update control's current value
                const updatedFixtures = placedFixtures.map(pf => 
                  pf.id === placedFixture.id 
                    ? {
                        ...pf,
                        controls: pf.controls?.map(c => 
                          c.id === control.id ? { ...c, currentValue: newValue } : c
                        ) || []
                      }
                    : pf
                );
                setPlacedFixtures(updatedFixtures);
                onUpdatePlacedFixtures(updatedFixtures);
                return;
              }
            }
              // Start dragging the control
            setDraggingPlacedControlInfo({ fixtureId: placedFixture.id, controlId: control.id, control });
            setIsDragging(true);
            setDragOffset({ 
              x: mousePos.x - controlX, 
              y: mousePos.y - controlY 
            });
            return;
          }
        }
      }
    }
    
    // Check if clicking on a placed fixture
    for (const placedFixture of placedFixtures) {
      const distance = Math.sqrt(
        Math.pow(mousePos.x - placedFixture.x, 2) + 
        Math.pow(mousePos.y - placedFixture.y, 2)
      );
        if (distance <= placedFixture.radius + 5) { // Add some padding for easier clicking
        // Start dragging the fixture
        setDraggingPlacedFixture(placedFixture);
        setIsDragging(true);
        setDragOffset({ 
          x: mousePos.x - placedFixture.x, 
          y: mousePos.y - placedFixture.y 
        });
        return;
      }
    }
  };
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(event);
    
    // Handle dragging master slider
    if (draggingMasterSlider && dragOffset) {
      const newX = mousePos.x - dragOffset.x;
      const newY = mousePos.y - dragOffset.y;
      
      // Get bounds for master slider
      const bounds = {
        minX: MASTER_SLIDER_WIDTH / 2,
        maxX: canvasSize.width - MASTER_SLIDER_WIDTH / 2,
        minY: MASTER_SLIDER_HEIGHT / 2,
        maxY: canvasSize.height - MASTER_SLIDER_HEIGHT / 2
      };
      
      // Get snapped position
      const snappedPos = getSnappedPosition(newX, newY, bounds);
      
      // Update snap preview if close to grid
      if (shouldSnapToGrid(newX, newY)) {
        setSnapPreview(snappedPos);
      } else {
        setSnapPreview(null);
      }
      
      // Update drag ghost
      setDragGhost({ x: newX, y: newY, type: 'slider' });
      
      // Use snapped position for actual update
      updateMasterSlider(draggingMasterSlider.id, {
        position: { x: snappedPos.x, y: snappedPos.y }
      });
      return;
    }
    
    // Handle adjusting master slider value
    if (adjustingMasterSliderValue) {
      const valueBarBounds = {
        left: adjustingMasterSliderValue.position.x - MASTER_SLIDER_WIDTH / 2,
        right: adjustingMasterSliderValue.position.x + MASTER_SLIDER_WIDTH / 2
      };
      
      const valuePercent = Math.max(0, Math.min(1, (mousePos.x - valueBarBounds.left) / MASTER_SLIDER_WIDTH));
      const newValue = Math.round(valuePercent * 255);
      updateMasterSliderValue(adjustingMasterSliderValue.id, newValue);
      return;
    }
    
    // Handle dragging placed fixture
    if (draggingPlacedFixture && dragOffset) {
      const newX = mousePos.x - dragOffset.x;
      const newY = mousePos.y - dragOffset.y;
      
      // Get bounds for placed fixture
      const bounds = {
        minX: draggingPlacedFixture.radius,
        maxX: canvasSize.width - draggingPlacedFixture.radius,
        minY: draggingPlacedFixture.radius,
        maxY: canvasSize.height - draggingPlacedFixture.radius
      };
      
      // Get snapped position
      const snappedPos = getSnappedPosition(newX, newY, bounds);
      
      // Update snap preview if close to grid
      if (shouldSnapToGrid(newX, newY)) {
        setSnapPreview(snappedPos);
      } else {
        setSnapPreview(null);
      }
      
      // Update drag ghost
      setDragGhost({ x: newX, y: newY, type: 'fixture' });
      
      // Use snapped position for actual update
      const updatedFixtures = placedFixtures.map(pf => 
        pf.id === draggingPlacedFixture.id 
          ? { ...pf, x: snappedPos.x, y: snappedPos.y }
          : pf
      );
      setPlacedFixtures(updatedFixtures);
      onUpdatePlacedFixtures(updatedFixtures);
      return;
    }
    
    // Handle dragging placed control
    if (draggingPlacedControlInfo && dragOffset) {
      const parentFixture = placedFixtures.find(pf => pf.id === draggingPlacedControlInfo.fixtureId);
      if (parentFixture) {
        const newOffsetX = (mousePos.x - dragOffset.x) - parentFixture.x;
        const newOffsetY = (mousePos.y - dragOffset.y) - parentFixture.y;
        
        // Apply grid snapping to control offsets (smaller grid for finer control)
        const controlGridSize = GRID_SIZE / 2; // 25px grid for controls
        const snappedOffsetX = snapToGrid(newOffsetX, controlGridSize);
        const snappedOffsetY = snapToGrid(newOffsetY, controlGridSize);
        
        const updatedFixtures = placedFixtures.map(pf => 
          pf.id === draggingPlacedControlInfo.fixtureId 
            ? {
                ...pf,
                controls: pf.controls?.map(c => 
                  c.id === draggingPlacedControlInfo.controlId 
                    ? { ...c, xOffset: snappedOffsetX, yOffset: snappedOffsetY }
                    : c
                ) || []
              }
            : pf
        );
        setPlacedFixtures(updatedFixtures);
        onUpdatePlacedFixtures(updatedFixtures);
      }
      return;
    }
    
    // Handle adjusting placed control value
    if (adjustingPlacedControlValueInfo) {
      const parentFixture = placedFixtures.find(pf => pf.id === adjustingPlacedControlValueInfo.fixtureId);
      if (parentFixture) {
        const controlX = parentFixture.x + adjustingPlacedControlValueInfo.control.xOffset;
        const valueBarBounds = {
          left: controlX - PLACED_CONTROL_WIDTH / 2,
          right: controlX + PLACED_CONTROL_WIDTH / 2
        };
        
        const valuePercent = Math.max(0, Math.min(1, (mousePos.x - valueBarBounds.left) / PLACED_CONTROL_WIDTH));
        const newValue = Math.round(valuePercent * 255);
        
        setDmxChannel(adjustingPlacedControlValueInfo.originalDmxAddress, newValue);
        
        // Update control's current value
        const updatedFixtures = placedFixtures.map(pf => 
          pf.id === adjustingPlacedControlValueInfo.fixtureId 
            ? {
                ...pf,
                controls: pf.controls?.map(c => 
                  c.id === adjustingPlacedControlValueInfo.controlId 
                    ? { ...c, currentValue: newValue }
                    : c
                ) || []
              }
            : pf
        );
        setPlacedFixtures(updatedFixtures);
        onUpdatePlacedFixtures(updatedFixtures);
      }
      return;
    }
  };  const handleMouseUp = () => {
    setDraggingMasterSlider(null);
    setAdjustingMasterSliderValue(null);
    setDraggingPlacedFixture(null);
    setDraggingPlacedControlInfo(null);
    setAdjustingPlacedControlValueInfo(null);
    setDragOffset(null);
    
    // Clear animation states
    setIsDragging(false);
    setDragGhost(null);
    setSnapPreview(null);
  };

  const handleMouseLeave = () => { 
    handleMouseUp(); 
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const mousePos = getMousePos(event);
    
    // Check if right-clicking on a master slider
    for (const slider of masterSliders) {
      const sliderBounds = {
        left: slider.position.x - MASTER_SLIDER_WIDTH / 2 - MASTER_SLIDER_INTERACTION_PADDING,
        right: slider.position.x + MASTER_SLIDER_WIDTH / 2 + MASTER_SLIDER_INTERACTION_PADDING,
        top: slider.position.y - MASTER_SLIDER_HEIGHT / 2 - MASTER_SLIDER_INTERACTION_PADDING,
        bottom: slider.position.y + MASTER_SLIDER_HEIGHT / 2 + MASTER_SLIDER_INTERACTION_PADDING
      };
      
      if (mousePos.x >= sliderBounds.left && mousePos.x <= sliderBounds.right &&
          mousePos.y >= sliderBounds.top && mousePos.y <= sliderBounds.bottom) {
        setSelectedMasterSliderForConfig(slider);
        return;
      }
    }
    
    // Check if right-clicking on a placed control
    for (const placedFixture of placedFixtures) {
      if (placedFixture.controls) {
        for (const control of placedFixture.controls) {
          const controlX = placedFixture.x + control.xOffset;
          const controlY = placedFixture.y + control.yOffset;
          const controlBounds = {
            left: controlX - PLACED_CONTROL_WIDTH / 2 - PLACED_CONTROL_INTERACTION_PADDING,
            right: controlX + PLACED_CONTROL_WIDTH / 2 + PLACED_CONTROL_INTERACTION_PADDING,
            top: controlY - PLACED_CONTROL_HEIGHT / 2 - PLACED_CONTROL_INTERACTION_PADDING,
            bottom: controlY + PLACED_CONTROL_HEIGHT / 2 + PLACED_CONTROL_INTERACTION_PADDING
          };
          
          if (mousePos.x >= controlBounds.left && mousePos.x <= controlBounds.right &&
              mousePos.y >= controlBounds.top && mousePos.y <= controlBounds.bottom) {
            setSelectedPlacedControlForConfig({ fixtureId: placedFixture.id, control });
            return;
          }
        }
      }
    }
    
    // Check if right-clicking on a placed fixture
    for (const placedFixture of placedFixtures) {
      const distance = Math.sqrt(
        Math.pow(mousePos.x - placedFixture.x, 2) + 
        Math.pow(mousePos.y - placedFixture.y, 2)
      );
      
      if (distance <= placedFixture.radius + 5) {
        setSelectedPlacedFixtureForConfig(placedFixture);
        return;
      }
    }
  };

  const handleAddMasterSlider = () => {
    const newSlider: MasterSlider = {
      id: `master-${Date.now()}`,
      name: `Master ${masterSliders.length + 1}`,
      value: 0,
      position: { x: 100 + (masterSliders.length * 30), y: 100 },
      targets: []
    };
    addMasterSlider(newSlider);
  };  const handleMasterSliderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingMasterSliderName(e.target.value);
  };

  const submitMasterSliderNameChange = () => {
    if (selectedMasterSliderForConfig && editingMasterSliderName.trim()) {
      updateMasterSlider(selectedMasterSliderForConfig.id, {
        name: editingMasterSliderName.trim()
      });
    }
  };

  const handleDeleteMasterSlider = () => {
    if (selectedMasterSliderForConfig) {
      removeMasterSlider(selectedMasterSliderForConfig.id);
      setSelectedMasterSliderForConfig(null);
    }
  };
  
  const handleMasterSliderMidiLearnToggle = (slider: MasterSlider) => {
    if (midiLearnTarget?.type === 'masterSlider' && midiLearnTarget.id === slider.id) {
      cancelMidiLearn();
    } else {
      startMidiLearn({ type: 'masterSlider', id: slider.id });
    }
  };  const handleAddControlToFixture = () => {
    if (selectedPlacedFixtureForConfig && channelToAddControlTo.trim()) {
      const fixtureDef = getFixtureDefinition(selectedPlacedFixtureForConfig);
      if (!fixtureDef) return;

      const channel = fixtureDef.channels.find(ch => ch.name === channelToAddControlTo.trim());
      if (!channel) return;

      const newControl: PlacedControl = {
        id: `control-${Date.now()}-${Math.random()}`,
        channelNameInFixture: channel.name,
        type: 'slider',
        label: channel.name,
        xOffset: 50, // Default offset from fixture center
        yOffset: 50,
        currentValue: 0
      };

      const updatedFixtures = placedFixtures.map(pf => 
        pf.id === selectedPlacedFixtureForConfig.id 
          ? {
              ...pf,
              controls: [...(pf.controls || []), newControl]
            }
          : pf
      );
      
      setPlacedFixtures(updatedFixtures);
      onUpdatePlacedFixtures(updatedFixtures);
      setChannelToAddControlTo("");
    }
  };

  const handlePlacedControlLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingPlacedControlLabel(e.target.value);
  };

  const submitPlacedControlLabelChange = () => {
    if (selectedPlacedControlForConfig && editingPlacedControlLabel.trim()) {
      const updatedFixtures = placedFixtures.map(pf => 
        pf.id === selectedPlacedControlForConfig.fixtureId 
          ? {
              ...pf,
              controls: pf.controls?.map(c => 
                c.id === selectedPlacedControlForConfig.control.id 
                  ? { ...c, label: editingPlacedControlLabel.trim() }
                  : c
              ) || []
            }
          : pf
      );
      
      setPlacedFixtures(updatedFixtures);
      onUpdatePlacedFixtures(updatedFixtures);
    }
  };

  const handleDeletePlacedControl = () => {
    if (selectedPlacedControlForConfig) {
      const updatedFixtures = placedFixtures.map(pf => 
        pf.id === selectedPlacedControlForConfig.fixtureId 
          ? {
              ...pf,
              controls: pf.controls?.filter(c => c.id !== selectedPlacedControlForConfig.control.id) || []
            }
          : pf
      );
      
      setPlacedFixtures(updatedFixtures);
      onUpdatePlacedFixtures(updatedFixtures);
      setSelectedPlacedControlForConfig(null);
    }
  };
  const handleAddTargetToMasterSlider = () => {
    if (selectedMasterSliderForConfig && targetFixtureId && targetChannelName.trim()) {
      const targetFixture = placedFixtures.find(pf => pf.id === targetFixtureId);
      if (!targetFixture) return;

      const fixtureDef = getFixtureDefinition(targetFixture);
      if (!fixtureDef) return;

      const channelIndex = fixtureDef.channels.findIndex(ch => ch.name === targetChannelName.trim());
      if (channelIndex === -1) return;

      const newTarget = {
        placedFixtureId: targetFixtureId,
        channelIndex,
        channelNameInFixture: targetChannelName.trim(),
        minRange: targetMinRange,
        maxRange: targetMaxRange
      };

      updateMasterSlider(selectedMasterSliderForConfig.id, {
        targets: [...selectedMasterSliderForConfig.targets, newTarget]
      });

      // Reset form
      setTargetFixtureId("");
      setTargetChannelName("");
      setTargetMinRange(0);
      setTargetMaxRange(255);
    }
  };

  const handleRemoveTargetFromMasterSlider = (targetToRemove: any) => {
    if (selectedMasterSliderForConfig) {
      updateMasterSlider(selectedMasterSliderForConfig.id, {
        targets: selectedMasterSliderForConfig.targets.filter(t => 
          t.placedFixtureId !== targetToRemove.placedFixtureId || 
          t.channelNameInFixture !== targetToRemove.channelNameInFixture
        )
      });
    }
  };
  const selectedTargetFixtureDef = targetFixtureId ? getFixtureDefinition(placedFixtures.find(pf => pf.id === targetFixtureId) || null) : null;

  return (
    <div className={styles.fixtureCanvasContainer}>
      {/* Controls Bar - Fixture Selection */}
      <div className={styles.controls}>
        <div className={styles.fixturePalette}>
          <span className={styles.paletteLabel}>Select fixture to place:</span>
          {fixtures.length === 0 ? (
            <span className={styles.noFixtures}>No fixtures defined</span>
          ) : (
            fixtures.map((fixture, index) => (
              <button
                key={fixture.name}
                className={`${styles.fixtureSelectItem} ${
                  selectedFixtureToAdd?.name === fixture.name ? styles.selected : ''
                }`}
                style={{ 
                  backgroundColor: selectedFixtureToAdd?.name === fixture.name 
                    ? FIXTURE_COLORS[index % FIXTURE_COLORS.length] 
                    : FIXTURE_COLORS[index % FIXTURE_COLORS.length] 
                }}
                onClick={() => setSelectedFixtureToAdd(
                  selectedFixtureToAdd?.name === fixture.name ? null : fixture
                )}
                title={`${fixture.name} - ${fixture.channels.length} channels - DMX ${fixture.startAddress}`}
              >
                {fixture.name}
              </button>
            ))
          )}
        </div>
          <div className={styles.masterControls}>
          <button
            className={`${styles.gridSnapToggle} ${gridSnappingEnabled ? styles.active : ''}`}
            onClick={() => setGridSnappingEnabled(!gridSnappingEnabled)}
            title={`Grid snapping: ${gridSnappingEnabled ? 'ON' : 'OFF'}`}
          >
            🧲 Grid Snap
          </button>
          
          <button
            className={styles.addMasterButton}
            onClick={() => {
              const newSlider: MasterSlider = {
                id: `master-${Date.now()}`,
                name: `Master ${masterSliders.length + 1}`,
                value: 0,
                position: { x: 100, y: 100 },
                targets: []
              };
              addMasterSlider(newSlider);
            }}
          >
            Add Master Slider
          </button>
          
          <button
            className={styles.quickSaveButton}
            onClick={handleQuickSaveToScene}
            title="Quick Save to Scene"
          >
            💾 Quick Save
          </button>
        </div>
      </div>
        <div className={styles.canvasWrapper}>        <canvas 
          ref={canvasRef} 
          className={`${styles.fixtureCanvas} ${isDragging ? styles.dragging : ''} ${snapPreview ? styles.snapping : ''}`}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        />
        
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
