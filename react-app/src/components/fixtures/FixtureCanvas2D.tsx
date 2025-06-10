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
// XY Pad constants
const XYPAD_SIZE = 80;
const XYPAD_BG_COLOR = 'rgba(120, 120, 120, 0.7)';
const XYPAD_GRID_COLOR = 'rgba(255, 255, 255, 0.2)';
const XYPAD_CURSOR_COLOR = '#4ecdc4';
const XYPAD_CURSOR_SIZE = 8;
const XYPAD_TEXT_COLOR = '#ffffff';
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
  const [targetMaxRange, setTargetMaxRange] = useState<number>(255);    // Animation and dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number; type: string } | null>(null);
  const [snapPreview, setSnapPreview] = useState<{ x: number; y: number } | null>(null);
  const [gridSnappingEnabled, setGridSnappingEnabled] = useState<boolean>(true);
  // Multi-select functionality
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
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

  // Selection utilities
  const isFixtureInSelectionBox = (fixture: PlacedFixture, selectionBox: { start: { x: number; y: number }; end: { x: number; y: number } }): boolean => {
    const { start, end } = selectionBox;
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    
    // Check if fixture center is within selection box
    return fixture.x >= left && fixture.x <= right && fixture.y >= top && fixture.y <= bottom;
  };

  const updateFixtureSelection = (fixtureId: string, isCtrlPressed: boolean) => {
    if (isCtrlPressed) {
      // Toggle selection
      setSelectedFixtures(prev => 
        prev.includes(fixtureId) 
          ? prev.filter(id => id !== fixtureId)
          : [...prev, fixtureId]
      );
    } else {
      // Single selection
      setSelectedFixtures([fixtureId]);
    }
  };

  const selectFixturesInBox = (selectionBox: { start: { x: number; y: number }; end: { x: number; y: number } }) => {
    const fixturesInBox = placedFixtures
      .filter(fixture => isFixtureInSelectionBox(fixture, selectionBox))
      .map(fixture => fixture.id);
    
    setSelectedFixtures(fixturesInBox);
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
    }    // Draw placed fixtures
    placedFixtures.forEach(placedFixture => {
      const fixtureDef = getFixtureDefinition(placedFixture);
      if (!fixtureDef) return;

      // Draw fixture circle
      ctx.fillStyle = placedFixture.color;
      ctx.beginPath();
      ctx.arc(placedFixture.x, placedFixture.y, placedFixture.radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw selection indicator if fixture is selected
      if (selectedFixtures.includes(placedFixture.id)) {
        ctx.strokeStyle = '#ffff00'; // Yellow selection indicator
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(placedFixture.x, placedFixture.y, placedFixture.radius + 3, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw fixture name
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(placedFixture.name, placedFixture.x, placedFixture.y - placedFixture.radius - 5);// Draw placed controls for this fixture
      if (placedFixture.controls) {
        placedFixture.controls.forEach(control => {
          const controlX = placedFixture.x + control.xOffset;
          const controlY = placedFixture.y + control.yOffset;

          if (control.type === 'xypad') {
            // Draw XY Pad background
            ctx.fillStyle = XYPAD_BG_COLOR;
            ctx.fillRect(
              controlX - XYPAD_SIZE / 2,
              controlY - XYPAD_SIZE / 2,
              XYPAD_SIZE,
              XYPAD_SIZE
            );

            // Draw grid lines
            ctx.strokeStyle = XYPAD_GRID_COLOR;
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
              const gridX = controlX - XYPAD_SIZE / 2 + (i * XYPAD_SIZE / 4);
              const gridY = controlY - XYPAD_SIZE / 2 + (i * XYPAD_SIZE / 4);
              
              // Vertical lines
              ctx.beginPath();
              ctx.moveTo(gridX, controlY - XYPAD_SIZE / 2);
              ctx.lineTo(gridX, controlY + XYPAD_SIZE / 2);
              ctx.stroke();
              
              // Horizontal lines
              ctx.beginPath();
              ctx.moveTo(controlX - XYPAD_SIZE / 2, gridY);
              ctx.lineTo(controlX + XYPAD_SIZE / 2, gridY);
              ctx.stroke();
            }

            // Draw center crosshair
            ctx.strokeStyle = XYPAD_GRID_COLOR;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(controlX, controlY - XYPAD_SIZE / 2);
            ctx.lineTo(controlX, controlY + XYPAD_SIZE / 2);
            ctx.moveTo(controlX - XYPAD_SIZE / 2, controlY);
            ctx.lineTo(controlX + XYPAD_SIZE / 2, controlY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Calculate cursor position
            const panNormalized = (control.panValue || 127) / 255;
            const tiltNormalized = 1 - ((control.tiltValue || 127) / 255); // Invert Y for intuitive control
            const cursorX = controlX - XYPAD_SIZE / 2 + (panNormalized * XYPAD_SIZE);
            const cursorY = controlY - XYPAD_SIZE / 2 + (tiltNormalized * XYPAD_SIZE);

            // Draw cursor
            ctx.fillStyle = XYPAD_CURSOR_COLOR;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cursorX, cursorY, XYPAD_CURSOR_SIZE, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Draw label
            ctx.fillStyle = XYPAD_TEXT_COLOR;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(control.label, controlX, controlY + XYPAD_SIZE / 2 + 15);

            // Draw pan/tilt values
            ctx.font = '8px Arial';
            ctx.fillText(`P:${control.panValue || 127} T:${control.tiltValue || 127}`, controlX, controlY + XYPAD_SIZE / 2 + 25);

          } else {
            // Draw regular slider control
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
            ctx.fillText(control.label, controlX, controlY + 3);
          }

          // Draw MIDI mapping indicator if available
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
    }

    // Draw selection box
    if (selectionBox && isSelecting) {
      const { start, end } = selectionBox;
      const width = end.x - start.x;
      const height = end.y - start.y;
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow selection box
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; // Semi-transparent fill
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.fillRect(start.x, start.y, width, height);
      ctx.strokeRect(start.x, start.y, width, height);
      
      ctx.setLineDash([]); // Reset line dash
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
    snapPreview,
    selectedFixtures,
    selectionBox,    isSelecting
  ]);
  
  // Handle responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width - 32; // Account for padding/borders
      const availableHeight = Math.max(400, containerRect.height - 32);
      
      // Maintain aspect ratio while fitting in available space
      const aspectRatio = canvasSize.width / canvasSize.height;
      let newWidth = availableWidth;
      let newHeight = newWidth / aspectRatio;
      
      // If height is too large, constrain by height instead
      if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
      }
      
      // Update canvas display size
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      
      // Redraw canvas with new display size
      drawCanvas();
    };
    
    // Initial sizing
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasSize, drawCanvas]);
  
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

  // Keyboard shortcuts for multi-select operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when canvas has focus or no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Select all fixtures
            setSelectedFixtures(placedFixtures.map(f => f.id));
          }
          break;
        case 'd':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Deselect all fixtures
            setSelectedFixtures([]);
          }
          break;
        case 'i':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Invert selection
            const allIds = placedFixtures.map(f => f.id);
            const newSelection = allIds.filter(id => !selectedFixtures.includes(id));
            setSelectedFixtures(newSelection);
          }
          break;
        case 'escape':
          // Clear selection and cancel any ongoing operations
          setSelectedFixtures([]);
          setIsSelecting(false);
          setSelectionBox(null);
          break;
        case 'delete':
        case 'backspace':
          if (selectedFixtures.length > 0) {
            event.preventDefault();
            // Delete selected fixtures
            const updatedFixtures = placedFixtures.filter(f => !selectedFixtures.includes(f.id));
            setPlacedFixtures(updatedFixtures);
            onUpdatePlacedFixtures(updatedFixtures);
            setSelectedFixtures([]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placedFixtures, selectedFixtures, onUpdatePlacedFixtures]);
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
    
    const newFixtureId = `placed-${Date.now()}-${Math.random()}`;    const generatedControls: PlacedControl[] = [];
    if (selectedFixtureToAdd.channels) {
      // First, check for pan/tilt pairs to create XY pads
      const panChannel = selectedFixtureToAdd.channels.find(ch => 
        ch.name.toLowerCase().includes('pan') || ch.type === 'pan'
      );
      const tiltChannel = selectedFixtureToAdd.channels.find(ch => 
        ch.name.toLowerCase().includes('tilt') || ch.type === 'tilt'
      );

      let controlYOffset = DEFAULT_FIXTURE_RADIUS + 10;

      // Create XY pad for pan/tilt if both channels exist
      if (panChannel && tiltChannel) {
        const xypadControlId = `control-${newFixtureId}-pantilt-xypad`;
        generatedControls.push({
          id: xypadControlId,
          channelNameInFixture: 'Pan/Tilt', // Combined name
          type: 'xypad',
          label: 'Pan/Tilt',
          xOffset: 0,
          yOffset: controlYOffset,
          currentValue: 0, // Not used for xypad
          panValue: 127, // Default to center
          tiltValue: 127, // Default to center
          panChannelName: panChannel.name,
          tiltChannelName: tiltChannel.name,
        });
        controlYOffset += XYPAD_SIZE + 10;
      }

      // Create sliders for all other channels (excluding pan/tilt if XY pad was created)
      selectedFixtureToAdd.channels.forEach((channel, index) => {
        const isPanTiltChannel = (panChannel && tiltChannel) && 
          (channel.name === panChannel.name || channel.name === tiltChannel.name);
        
        if (!isPanTiltChannel) {
          const controlId = `control-${newFixtureId}-${sanitizeName(channel.name)}-${index}`;
          generatedControls.push({
            id: controlId,
            channelNameInFixture: channel.name,
            type: 'slider',
            label: channel.name.substring(0, 12),
            xOffset: 0,
            yOffset: controlYOffset,
            currentValue: 0,
          });
          controlYOffset += PLACED_CONTROL_HEIGHT + 8;
        }
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
      if (placedFixture.controls) {        for (const control of placedFixture.controls) {
          const controlX = placedFixture.x + control.xOffset;
          const controlY = placedFixture.y + control.yOffset;
          
          if (control.type === 'xypad') {
            // XY Pad interaction
            const xypadBounds = {
              left: controlX - XYPAD_SIZE / 2 - PLACED_CONTROL_INTERACTION_PADDING,
              right: controlX + XYPAD_SIZE / 2 + PLACED_CONTROL_INTERACTION_PADDING,
              top: controlY - XYPAD_SIZE / 2 - PLACED_CONTROL_INTERACTION_PADDING,
              bottom: controlY + XYPAD_SIZE / 2 + PLACED_CONTROL_INTERACTION_PADDING
            };
            
            if (mousePos.x >= xypadBounds.left && mousePos.x <= xypadBounds.right &&
                mousePos.y >= xypadBounds.top && mousePos.y <= xypadBounds.bottom) {
              
              // Check if clicking inside the XY pad area for value adjustment
              const padBounds = {
                left: controlX - XYPAD_SIZE / 2,
                right: controlX + XYPAD_SIZE / 2,
                top: controlY - XYPAD_SIZE / 2,
                bottom: controlY + XYPAD_SIZE / 2
              };
              
              if (mousePos.x >= padBounds.left && mousePos.x <= padBounds.right &&
                  mousePos.y >= padBounds.top && mousePos.y <= padBounds.bottom) {
                
                // Calculate pan/tilt values from mouse position
                const panNormalized = (mousePos.x - padBounds.left) / XYPAD_SIZE;
                const tiltNormalized = 1 - ((mousePos.y - padBounds.top) / XYPAD_SIZE); // Invert Y
                const newPanValue = Math.max(0, Math.min(255, Math.round(panNormalized * 255)));
                const newTiltValue = Math.max(0, Math.min(255, Math.round(tiltNormalized * 255)));
                
                // Find and update both pan and tilt channels
                const fixtureDef = getFixtureDefinition(placedFixture);
                if (fixtureDef && control.panChannelName && control.tiltChannelName) {
                  const panChannelIndex = fixtureDef.channels.findIndex(ch => ch.name === control.panChannelName);
                  const tiltChannelIndex = fixtureDef.channels.findIndex(ch => ch.name === control.tiltChannelName);
                  
                  if (panChannelIndex !== -1 && tiltChannelIndex !== -1) {
                    const panDmxAddress = placedFixture.startAddress + panChannelIndex;
                    const tiltDmxAddress = placedFixture.startAddress + tiltChannelIndex;
                    
                    // Update DMX channels
                    setDmxChannel(panDmxAddress, newPanValue);
                    setDmxChannel(tiltDmxAddress, newTiltValue);
                    
                    // Update control values
                    const updatedFixtures = placedFixtures.map(pf => 
                      pf.id === placedFixture.id 
                        ? {
                            ...pf,
                            controls: pf.controls?.map(c => 
                              c.id === control.id 
                                ? { ...c, panValue: newPanValue, tiltValue: newTiltValue }
                                : c
                            ) || []
                          }
                        : pf
                    );
                    setPlacedFixtures(updatedFixtures);
                    onUpdatePlacedFixtures(updatedFixtures);
                    
                    // Set adjusting state for continuous interaction
                    setAdjustingPlacedControlValueInfo({ 
                      fixtureId: placedFixture.id, 
                      controlId: control.id, 
                      control, 
                      originalDmxAddress: panDmxAddress // Use pan address for reference
                    });
                    return;
                  }
                }
              }
              
              // Start dragging the XY pad
              setDraggingPlacedControlInfo({ fixtureId: placedFixture.id, controlId: control.id, control });
              setIsDragging(true);
              setDragOffset({ 
                x: mousePos.x - controlX, 
                y: mousePos.y - controlY 
              });
              return;
            }
            
          } else {
            // Regular slider control interaction
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
    }
      // Check if clicking on a placed fixture
    for (const placedFixture of placedFixtures) {
      const distance = Math.sqrt(
        Math.pow(mousePos.x - placedFixture.x, 2) + 
        Math.pow(mousePos.y - placedFixture.y, 2)
      );
        if (distance <= placedFixture.radius + 5) { // Add some padding for easier clicking
        // Handle multi-select for fixtures
        if (event.ctrlKey || event.metaKey) {
          updateFixtureSelection(placedFixture.id, true);
          return;
        } else if (event.shiftKey) {
          // For shift-click, we could implement range selection in the future
          updateFixtureSelection(placedFixture.id, false);
          return;
        } else {
          // Single selection
          updateFixtureSelection(placedFixture.id, false);
        }
        
        // Start dragging the fixture (only if it's in the current selection)
        if (selectedFixtures.includes(placedFixture.id)) {
          setDraggingPlacedFixture(placedFixture);
          setIsDragging(true);
          setDragOffset({ 
            x: mousePos.x - placedFixture.x, 
            y: mousePos.y - placedFixture.y 
          });
        }
        return;
      }
    }
    
    // If we get here, we're clicking on empty canvas - start selection box
    if (!event.ctrlKey && !event.metaKey) {
      // Clear previous selection unless Ctrl is held
      setSelectedFixtures([]);
    }
    
    // Start selection box
    setIsSelecting(true);
    setSelectionBox({
      start: { x: mousePos.x, y: mousePos.y },
      end: { x: mousePos.x, y: mousePos.y }
    });
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
        const control = adjustingPlacedControlValueInfo.control;
        const controlX = parentFixture.x + control.xOffset;
        const controlY = parentFixture.y + control.yOffset;
        
        if (control.type === 'xypad') {
          // Handle XY pad value adjustment
          const padBounds = {
            left: controlX - XYPAD_SIZE / 2,
            right: controlX + XYPAD_SIZE / 2,
            top: controlY - XYPAD_SIZE / 2,
            bottom: controlY + XYPAD_SIZE / 2
          };
          
          // Calculate pan/tilt values from mouse position
          const panNormalized = Math.max(0, Math.min(1, (mousePos.x - padBounds.left) / XYPAD_SIZE));
          const tiltNormalized = Math.max(0, Math.min(1, 1 - ((mousePos.y - padBounds.top) / XYPAD_SIZE))); // Invert Y
          const newPanValue = Math.round(panNormalized * 255);
          const newTiltValue = Math.round(tiltNormalized * 255);
          
          // Find and update both pan and tilt channels
          const fixtureDef = getFixtureDefinition(parentFixture);
          if (fixtureDef && control.panChannelName && control.tiltChannelName) {
            const panChannelIndex = fixtureDef.channels.findIndex(ch => ch.name === control.panChannelName);
            const tiltChannelIndex = fixtureDef.channels.findIndex(ch => ch.name === control.tiltChannelName);
            
            if (panChannelIndex !== -1 && tiltChannelIndex !== -1) {
              const panDmxAddress = parentFixture.startAddress + panChannelIndex;
              const tiltDmxAddress = parentFixture.startAddress + tiltChannelIndex;
              
              // Update DMX channels
              setDmxChannel(panDmxAddress, newPanValue);
              setDmxChannel(tiltDmxAddress, newTiltValue);
              
              // Update control values
              const updatedFixtures = placedFixtures.map(pf => 
                pf.id === adjustingPlacedControlValueInfo.fixtureId 
                  ? {
                      ...pf,
                      controls: pf.controls?.map(c => 
                        c.id === adjustingPlacedControlValueInfo.controlId 
                          ? { ...c, panValue: newPanValue, tiltValue: newTiltValue }
                          : c
                      ) || []
                    }
                  : pf
              );
              setPlacedFixtures(updatedFixtures);
              onUpdatePlacedFixtures(updatedFixtures);
            }
          }
        } else {
          // Handle regular slider adjustment
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
          onUpdatePlacedFixtures(updatedFixtures);        }
      }
      return;
    }
    
    // Handle selection box dragging
    if (isSelecting && selectionBox) {
      setSelectionBox({
        start: selectionBox.start,
        end: { x: mousePos.x, y: mousePos.y }
      });
      return;
    }
  };  const handleMouseUp = () => {
    // Complete selection box operation
    if (isSelecting && selectionBox) {
      selectFixturesInBox(selectionBox);
      setIsSelecting(false);
      setSelectionBox(null);
    }
    
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
          
          let controlBounds;
          if (control.type === 'xypad') {
            controlBounds = {
              left: controlX - XYPAD_SIZE / 2 - PLACED_CONTROL_INTERACTION_PADDING,
              right: controlX + XYPAD_SIZE / 2 + PLACED_CONTROL_INTERACTION_PADDING,
              top: controlY - XYPAD_SIZE / 2 - PLACED_CONTROL_INTERACTION_PADDING,
              bottom: controlY + XYPAD_SIZE / 2 + PLACED_CONTROL_INTERACTION_PADDING
            };
          } else {
            controlBounds = {
              left: controlX - PLACED_CONTROL_WIDTH / 2 - PLACED_CONTROL_INTERACTION_PADDING,
              right: controlX + PLACED_CONTROL_WIDTH / 2 + PLACED_CONTROL_INTERACTION_PADDING,
              top: controlY - PLACED_CONTROL_HEIGHT / 2 - PLACED_CONTROL_INTERACTION_PADDING,
              bottom: controlY + PLACED_CONTROL_HEIGHT / 2 + PLACED_CONTROL_INTERACTION_PADDING
            };
          }
          
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
  };
  const handleQuickSaveToScene = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const sceneName = `2D_Canvas_Scene_${timestamp}`;
      const oscAddress = `/scene/${sceneName.toLowerCase()}`;
      
      saveScene(sceneName, oscAddress);
      addNotification({
        message: `Scene "${sceneName}" saved successfully!`,
        type: 'success',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Failed to save scene:', error);
      addNotification({
        message: 'Failed to save scene. Please try again.',
        type: 'error',
        priority: 'high'
      });
    }
  };

  const handleMasterSliderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        </div>          <div className={styles.masterControls}>
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
          
          {/* Multi-select controls */}
          <div className={styles.multiSelectControls}>
            <span className={styles.selectionInfo}>
              {selectedFixtures.length > 0 ? `${selectedFixtures.length} selected` : 'No selection'}
            </span>
            
            <button
              className={styles.selectAllButton}
              onClick={() => setSelectedFixtures(placedFixtures.map(f => f.id))}
              disabled={placedFixtures.length === 0}
              title="Select All (Ctrl+A)"
            >
              ✓ All
            </button>
            
            <button
              className={styles.clearSelectionButton}
              onClick={() => setSelectedFixtures([])}
              disabled={selectedFixtures.length === 0}
              title="Clear Selection (Ctrl+D)"
            >
              ✗ Clear
            </button>
            
            <button
              className={styles.invertSelectionButton}
              onClick={() => {
                const allIds = placedFixtures.map(f => f.id);
                const newSelection = allIds.filter(id => !selectedFixtures.includes(id));
                setSelectedFixtures(newSelection);
              }}
              disabled={placedFixtures.length === 0}
              title="Invert Selection (Ctrl+I)"
            >
              ⇄ Invert
            </button>
            
            {selectedFixtures.length > 0 && (
              <button
                className={styles.deleteSelectedButton}
                onClick={() => {
                  if (window.confirm(`Delete ${selectedFixtures.length} selected fixture(s)?`)) {
                    const updatedFixtures = placedFixtures.filter(f => !selectedFixtures.includes(f.id));
                    setPlacedFixtures(updatedFixtures);
                    onUpdatePlacedFixtures(updatedFixtures);
                    setSelectedFixtures([]);
                  }
                }}
                title="Delete Selected (Delete/Backspace)"
              >
                🗑️ Delete ({selectedFixtures.length})
              </button>
            )}
          </div>
        </div>
      </div>      <div className={styles.canvasWrapper}>
        <div className={styles.canvasContainer}>
          <canvas 
            ref={canvasRef} 
            className={`${styles.fixtureCanvas} ${isDragging ? styles.dragging : ''} ${snapPreview ? styles.snapping : ''}`}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
          />
        </div>
        
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
