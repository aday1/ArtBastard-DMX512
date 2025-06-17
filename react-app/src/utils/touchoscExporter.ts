import { Fixture, MasterSlider, PlacedFixture, PlacedControl } from '../store'; // Updated imports
import JSZip from 'jszip';
import * as FileSaver from 'file-saver'; // For triggering download

// Helper to sanitize names for OSC paths and XML names
const sanitizeName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_{2,}/g, '_');
};

interface TouchOscControlBase {
  type: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string; // ARGB format, e.g., #AARRGGBB
  osc_cs?: string;
  properties?: Array<{ name: string; value: string | number }>;
}

interface TouchOscLabel extends TouchOscControlBase {
  type: 'label';
  text: string;
  textSize?: number;
}

interface TouchOscFader extends TouchOscControlBase {
  type: 'faderv' | 'faderh';
  scalef?: number; // From value
  scalet?: number; // To value
  response?: 'absolute' | 'relative';
  inverted?: boolean;
}

interface TouchOscButton extends TouchOscControlBase {
    type: 'button';
    buttonType?: 1 | 2; // 1 for push, 2 for toggle
}


type TouchOscControl = TouchOscLabel | TouchOscFader | TouchOscButton;

interface TouchOscPage {
  name: string;
  width: number;
  height: number;
  controls: TouchOscControl[];
}

interface TouchOscLayout {
  version: string;
  mode: number; // 0 for fixed size, 1 for scaled
  orientation: 'vertical' | 'horizontal' | 'none';
  pages: TouchOscPage[];
}

const generateControlXml = (control: TouchOscControl): string => {
  let propertiesXml = (control.properties || [])
    .map(p => `    <property name="${p.name}">${p.value}</property>`)
    .join('\n');

  if (control.type === 'label') {
    propertiesXml += `\n    <property name="text">${control.text}</property>`;
    if (control.textSize) {
      propertiesXml += `\n    <property name="textSize">${control.textSize}</property>`;
    }
  }
  if (control.type === 'faderv' || control.type === 'faderh') {
    if (control.scalef !== undefined) propertiesXml += `\n    <property name="scalef">${control.scalef}</property>`;
    if (control.scalet !== undefined) propertiesXml += `\n    <property name="scalet">${control.scalet}</property>`;
    if (control.response) propertiesXml += `\n    <property name="response">${control.response}</property>`;
    if (control.inverted) propertiesXml += `\n    <property name="inverted">${control.inverted ? 'true' : 'false'}</property>`;
  }
  if (control.type === 'button' && control.buttonType !== undefined) {
      propertiesXml += `\n    <property name="type">${control.buttonType}</property>`;
  }


  return `  <control type="${control.type}" name="${sanitizeName(control.name)}" x="${control.x}" y="${control.y}" w="${control.w}" h="${control.h}" ${control.color ? `color="${control.color}"` : ''} ${control.osc_cs ? `osc_cs="${control.osc_cs}"` : ''}>\n${propertiesXml}\n  </control>`;
};

const generatePageXml = (page: TouchOscPage): string => {
  const controlsXml = page.controls.map(generateControlXml).join('\n');
  // Note: TouchOSC page width/height attributes are part of the <layout> element in some versions,
  // or individual controls are positioned within an implicit full-screen page.
  // For simplicity, we define page name here, actual dimensions are on layout for main page.
  // If multiple pages are truly supported with different dimensions, this structure needs adjustment.
  // The prompt implies one main page based on selected resolution.
  return `<page name="${sanitizeName(page.name)}">\n${controlsXml}\n</page>`;
};

const generateIndexXml = (layout: TouchOscLayout): string => {
  // Assuming the first page's dimensions define the layout dimensions
  const mainPage = layout.pages[0];
  if (!mainPage) throw new Error("At least one page is required for the layout.");

  const pagesXml = layout.pages.map(generatePageXml).join('\n\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<layout version="${layout.version}" mode="${layout.mode}" orientation="${layout.orientation}" width="${mainPage.width}" height="${mainPage.height}">
${pagesXml}
</layout>`;
};


export interface ExportOptions {
  resolution: 'phone_portrait' | 'tablet_portrait' | 'ipad_pro_2019_portrait' | 'ipad_pro_2019_landscape' | 'samsung_s21_specified_portrait' | 'samsung_s21_specified_landscape';
  includeFixtureControls: boolean;
  includeMasterSliders: boolean;
  includeAllDmxChannels: boolean;
}

const RESOLUTIONS = {
  phone_portrait: { width: 720, height: 1280, orientation: 'vertical' as const },
  tablet_portrait: { width: 1024, height: 1366, orientation: 'vertical' as const },
  ipad_pro_2019_portrait: { width: 1668, height: 2420, orientation: 'vertical' as const },
  ipad_pro_2019_landscape: { width: 2420, height: 1668, orientation: 'horizontal' as const },
  samsung_s21_specified_portrait: { width: 1668, height: 2420, orientation: 'vertical' as const },
  samsung_s21_specified_landscape: { width: 2420, height: 1668, orientation: 'horizontal' as const },
  // Landscape options could be added if needed
  // phone_landscape: { width: 1280, height: 720, orientation: 'horizontal' as const },
  // tablet_landscape: { width: 1366, height: 1024, orientation: 'horizontal' as const },
};

const CANVAS_LAYOUT_WIDTH = 1280;
const CANVAS_LAYOUT_HEIGHT = 720;

export const generateTouchOscLayout = (
  options: ExportOptions,
  placedFixtures: PlacedFixture[], // Changed from fixtures: Fixture[]
  masterSliders: MasterSlider[],
  allFixtures: Fixture[] // Added allFixtures for definitions
): string => {
  const { width: toscCanvasWidth, height: toscCanvasHeight, orientation } = RESOLUTIONS[options.resolution];
  const pages: TouchOscPage[] = [];

  // --- Main Page for Fixtures and Master Sliders ---
  const mainPageControls: TouchOscControl[] = [];

  // Default TouchOSC control sizes
  const toscFaderWidth = 60;
  const toscFaderHeight = 180;
  const toscLabelHeight = 15;
  const labelFaderSpacing = 5;


  if (options.includeFixtureControls) {
    placedFixtures.forEach(pFixture => {
      const fixtureDef = allFixtures.find(f => f.name === pFixture.fixtureStoreId);
      if (!fixtureDef) {
        console.warn(`Fixture definition not found for placed fixture: ${pFixture.fixtureStoreId}`);
        return; // Skip this placed fixture if its definition is missing
      }

      if (pFixture.controls && pFixture.controls.length > 0) {
        pFixture.controls.forEach(pControl => {
          const channelDef = fixtureDef.channels.find(ch => ch.name === pControl.channelNameInFixture);
          if (!channelDef) {
            console.warn(`Channel definition not found for: ${pControl.channelNameInFixture} in ${fixtureDef.name}`);
            return; // Skip this control if its channel definition is missing
          }
          const channelIndex = fixtureDef.channels.indexOf(channelDef);
          const dmxAddress = pFixture.startAddress + channelIndex;

          const controlCenterX = pFixture.x + pControl.xOffset;
          const controlCenterY = pFixture.y + pControl.yOffset;

          // Scale positions
          const scaledX = Math.round((controlCenterX / CANVAS_LAYOUT_WIDTH) * toscCanvasWidth);
          const scaledY = Math.round((controlCenterY / CANVAS_LAYOUT_HEIGHT) * toscCanvasHeight);

          // Calculate top-left for TouchOSC based on center positioning from canvas
          const faderX = scaledX - (toscFaderWidth / 2);
          const faderY = scaledY - (toscFaderHeight / 2);
          const labelX = scaledX - (toscFaderWidth / 2); // Label aligned with fader
          const labelY = faderY - toscLabelHeight - labelFaderSpacing; // Label above fader

          // Add Label for the PlacedControl
          mainPageControls.push({
            type: 'label',
            name: `lbl_${sanitizeName(pFixture.name)}_${sanitizeName(pControl.label)}`,
            text: pControl.label.substring(0, 10), // Keep label concise
            x: Math.max(0, labelX), // Ensure within bounds
            y: Math.max(0, labelY), // Ensure within bounds
            w: toscFaderWidth,
            h: toscLabelHeight,
            color: '#FFFFFFFF', // White
            textSize: 10,
          });

          // Add Fader for the PlacedControl
          mainPageControls.push({
            type: 'faderv', // Assuming vertical faders for now
            name: `fader_${sanitizeName(pFixture.name)}_${sanitizeName(pControl.label)}`,
            x: Math.max(0, faderX), // Ensure within bounds
            y: Math.max(0, faderY), // Ensure within bounds
            w: toscFaderWidth,
            h: toscFaderHeight,
            color: pFixture.color ? pFixture.color.replace('#', '#FF') : '#FF0077FF', // Use fixture color or default
            osc_cs: `/dmx/${dmxAddress}/value`,
            scalef: 0.0,
            scalet: 1.0,
            response: 'absolute',
          });
        });
      }
    });
  }
  
  // Positioning for Master Sliders - independent of fixture controls now
  let currentX = 10;
  let currentY = 10;
  const masterFaderWidth = 60; // Standardized name
  const masterFaderHeight = 180; // Standardized name
  const masterLabelHeight = 20; // Standardized name
  const masterSpacing = 10; // Standardized name

  // Note: If includeFixtureControls is false, master sliders will start at 10,10.
  // If includeFixtureControls is true, they will also start at 10,10,
  // potentially overlapping with placed fixture controls if those are also near the top-left.
  // This behavior is different from the old sequential layout.
  // Consider a dedicated area or conditional offset if overlap is an issue.
  // For now, keeping it simple.

  if (options.includeMasterSliders) {
    masterSliders.forEach(slider => {
      const safeSliderName = sanitizeName(slider.name);
      // Check for wrapping for master sliders
      if (currentY + masterFaderHeight + masterLabelHeight > toscCanvasHeight - masterSpacing) {
        currentY = masterSpacing; // Reset Y to top
        currentX += masterFaderWidth + masterSpacing * 2; // Move to next column
      }
      if (currentX + masterFaderWidth > toscCanvasWidth - masterSpacing ) {
         // Not enough horizontal space even after wrapping Y, indicates very crowded layout
         // Or too many master sliders for the given resolution width.
         // For now, they might overflow. A more robust solution would be multiple pages or scaling.
         console.warn("Master sliders might overflow available width in TouchOSC layout.");
      }


      mainPageControls.push({
        type: 'label',
        name: `lbl_master_${safeSliderName}`,
        text: slider.name,
        x: currentX,
        y: currentY,
        w: masterFaderWidth,
        h: masterLabelHeight,
        color: '#FFFFFFFF',
        textSize: 12,
      });
      mainPageControls.push({
        type: 'faderv',
        name: `fader_master_${safeSliderName}`,
        x: currentX,
        y: currentY + masterLabelHeight + labelFaderSpacing,
        w: masterFaderWidth,
        h: masterFaderHeight,
        color: '#FFFF7700', // Orangeish
        osc_cs: `/master/${safeSliderName}/value`,
        scalef: 0.0,
        scalet: 1.0,
        response: 'absolute',
      });
      // currentX += masterFaderWidth + masterSpacing; // Old logic: horizontal placement only
      // New logic: Place master faders vertically first, then wrap to new column
      currentY += masterFaderHeight + masterLabelHeight + masterSpacing * 2;
    });
  }

  pages.push({ name: "Main", width: toscCanvasWidth, height: toscCanvasHeight, controls: mainPageControls });

  // --- Page for All DMX Channels (if selected) ---
  // This section remains largely the same, using its own layout logic based on toscCanvasWidth/Height
  if (options.includeAllDmxChannels) {
    const dmxPageControls: TouchOscControl[] = [];
    const dmxFaderWidth = 60; // Renamed for clarity
    const dmxFaderHeight = 180; // Renamed for clarity
    const dmxLabelHeight = 15; // Renamed for clarity
    const dmxSpacing = 10; // Renamed for clarity

    const dmxFadersPerRow = Math.floor((toscCanvasWidth - dmxSpacing) / (dmxFaderWidth + dmxSpacing));
    const numRows = Math.ceil(512 / dmxFadersPerRow);
    
    // This page might become very tall. TouchOSC handles scrolling within a page.
    // const dmxPageHeight = numRows * (dmxFaderHeight + dmxLabelHeight + dmxSpacing * 2) + dmxSpacing; // Not directly used for page def

    for (let i = 0; i < 512; i++) {
      const row = Math.floor(i / dmxFadersPerRow);
      const col = i % dmxFadersPerRow;
      const dmxChannelNum = i + 1;

      const xPos = dmxSpacing + col * (dmxFaderWidth + dmxSpacing);
      const yPos = dmxSpacing + row * (dmxFaderHeight + dmxLabelHeight + dmxSpacing * 2); // Adjusted for label height
      
      dmxPageControls.push({
        type: 'label',
        name: `lbl_dmx_${dmxChannelNum}`,
        text: `DMX ${dmxChannelNum}`,
        x: xPos,
        y: yPos,
        w: dmxFaderWidth,
        h: dmxLabelHeight,
        color: '#FFCCCCCC',
        textSize: 8,
      });
      dmxPageControls.push({
        type: 'faderv',
        name: `fader_dmx_${dmxChannelNum}`,
        x: xPos,
        y: yPos + dmxLabelHeight + labelFaderSpacing, // Position fader below its label
        w: dmxFaderWidth,
        h: dmxFaderHeight,
        color: '#FF444444', // Grey
        osc_cs: `/dmx/${dmxChannelNum}/value`,
        scalef: 0.0,
        scalet: 1.0,
        response: 'absolute',
      });
    }
    pages.push({ name: "All_DMX", width: toscCanvasWidth, height: toscCanvasHeight, controls: dmxPageControls });
  }
  
  const layoutDefinition: TouchOscLayout = {
    version: "1.0.0", // Arbitrary version
    mode: 0, // Fixed size
    orientation: orientation,
    pages: pages,
  };

  return generateIndexXml(layoutDefinition);
};

export const exportToToscFile = async (
  options: ExportOptions,
  placedFixtures: PlacedFixture[], // Changed
  masterSliders: MasterSlider[],
  allFixtures: Fixture[], // Added
  filename: string = "ArtBastardOSC.tosc"
) => {
  try {
    const indexXmlContent = generateTouchOscLayout(options, placedFixtures, masterSliders, allFixtures);
    
    const zip = new JSZip();
    zip.file("index.xml", indexXmlContent);
    
    // Add other files like properties.xml if needed (not for basic layout)
    // zip.file("properties.xml", generatePropertiesXmlIfNeeded());

    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, filename); // saveAs from file-saver
    
    console.log("TouchOSC file generated and download initiated.");
    return { success: true, message: "Export successful!" };
  } catch (error) {
    console.error("Error generating TouchOSC file:", error);
    return { success: false, message: `Export failed: ${error instanceof Error ? error.message : String(error)}` };
  }
};

// Super Control specific export options
export interface SuperControlExportOptions {
  resolution: 'phone_portrait' | 'tablet_portrait' | 'ipad_pro_2019_portrait' | 'ipad_pro_2019_landscape' | 'samsung_s21_specified_portrait' | 'samsung_s21_specified_landscape';
  includeBasicControls: boolean;
  includePanTilt: boolean;
  includeColorWheel: boolean;
  includeXYPad: boolean;
  includeEffects: boolean;
  includeAutopilot: boolean;
  includeQuickActions: boolean;
  includeSceneControls: boolean;
  includeNavigation: boolean;
}

/**
 * Generate a TouchOSC layout specifically for the Super Control interface
 */
export const generateSuperControlTouchOscLayout = (
  options: SuperControlExportOptions
): string => {
  const { width: toscCanvasWidth, height: toscCanvasHeight, orientation } = RESOLUTIONS[options.resolution];
  const pages: TouchOscPage[] = [];

  // Main control page with essential controls
  const mainPageControls: TouchOscControl[] = [];

  // Control sizing and spacing
  const faderWidth = 60;
  const faderHeight = 200;
  const buttonWidth = 80;
  const buttonHeight = 40;
  const spacing = 10;
  const labelHeight = 20;

  let currentX = spacing;
  let currentY = spacing;

  // Basic Controls Section
  if (options.includeBasicControls) {
    // Dimmer control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_dimmer',
      text: 'Dimmer',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_dimmer',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FFFFFF00', // Yellow
      osc_cs: '/super_control/dimmer',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;
  }

  // Pan/Tilt Controls
  if (options.includePanTilt) {
    // Pan control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_pan',
      text: 'Pan',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_pan',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FF00FFFF', // Cyan
      osc_cs: '/super_control/pan',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;

    // Tilt control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_tilt',
      text: 'Tilt',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_tilt',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FF00FFFF', // Cyan
      osc_cs: '/super_control/tilt',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;
  }

  // RGB Color Controls
  if (options.includeColorWheel) {
    // Red control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_red',
      text: 'Red',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_red',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FFFF0000', // Red
      osc_cs: '/super_control/red',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;

    // Green control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_green',
      text: 'Green',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_green',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FF00FF00', // Green
      osc_cs: '/super_control/green',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;

    // Blue control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_blue',
      text: 'Blue',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_blue',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FF0000FF', // Blue
      osc_cs: '/super_control/blue',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;
  }

  // Effects Controls
  if (options.includeEffects) {
    // GOBO control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_gobo',
      text: 'GOBO',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_gobo',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FFFF7700', // Orange
      osc_cs: '/super_control/gobo',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;

    // Shutter control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_shutter',
      text: 'Shutter',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_shutter',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FF777777', // Gray
      osc_cs: '/super_control/shutter',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;

    // Strobe control
    mainPageControls.push({
      type: 'label',
      name: 'lbl_strobe',
      text: 'Strobe',
      x: currentX,
      y: currentY,
      w: faderWidth,
      h: labelHeight,
      color: '#FFFFFFFF',
      textSize: 12,
    });

    mainPageControls.push({
      type: 'faderv',
      name: 'fader_strobe',
      x: currentX,
      y: currentY + labelHeight + 5,
      w: faderWidth,
      h: faderHeight,
      color: '#FFAA00AA', // Purple
      osc_cs: '/super_control/strobe',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    currentX += faderWidth + spacing;
  }

  // Quick Action Buttons (bottom row)
  if (options.includeQuickActions) {
    const buttonY = toscCanvasHeight - buttonHeight - spacing;
    let buttonX = spacing;

    // Blackout button
    mainPageControls.push({
      type: 'button',
      name: 'btn_blackout',
      x: buttonX,
      y: buttonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FF000000', // Black
      osc_cs: '/super_control/blackout',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Blackout' },
        { name: 'textSize', value: 10 }
      ]
    });

    buttonX += buttonWidth + spacing;

    // All On button
    mainPageControls.push({
      type: 'button',
      name: 'btn_all_on',
      x: buttonX,
      y: buttonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FFFFFFFF', // White
      osc_cs: '/super_control/all_on',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'All On' },
        { name: 'textSize', value: 10 }
      ]
    });

    buttonX += buttonWidth + spacing;

    // Reset button
    mainPageControls.push({
      type: 'button',
      name: 'btn_reset',
      x: buttonX,
      y: buttonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FFFF7700', // Orange
      osc_cs: '/super_control/reset',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Reset' },
        { name: 'textSize', value: 10 }
      ]
    });

    buttonX += buttonWidth + spacing;

    // Center Pan/Tilt button
    if (options.includePanTilt) {
      mainPageControls.push({
        type: 'button',
        name: 'btn_center_pan_tilt',
        x: buttonX,
        y: buttonY,
        w: buttonWidth,
        h: buttonHeight,
        color: '#FF00FFFF', // Cyan
        osc_cs: '/super_control/center_pan_tilt',
        buttonType: 1, // Push button
        properties: [
          { name: 'text', value: 'Center' },
          { name: 'textSize', value: 10 }
        ]
      });

      buttonX += buttonWidth + spacing;
    }
  }

  // Scene Control Buttons
  if (options.includeSceneControls) {
    const sceneButtonY = toscCanvasHeight - (buttonHeight * 2) - (spacing * 2);
    let sceneButtonX = spacing;

    // Save Scene button
    mainPageControls.push({
      type: 'button',
      name: 'btn_save_scene',
      x: sceneButtonX,
      y: sceneButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FF00AA00', // Green
      osc_cs: '/super_control/save_scene',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Save Scene' },
        { name: 'textSize', value: 9 }
      ]
    });

    sceneButtonX += buttonWidth + spacing;

    // Previous Scene button
    mainPageControls.push({
      type: 'button',
      name: 'btn_prev_scene',
      x: sceneButtonX,
      y: sceneButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FF0077AA', // Blue
      osc_cs: '/super_control/prev_scene',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Prev Scene' },
        { name: 'textSize', value: 9 }
      ]
    });

    sceneButtonX += buttonWidth + spacing;

    // Next Scene button
    mainPageControls.push({
      type: 'button',
      name: 'btn_next_scene',
      x: sceneButtonX,
      y: sceneButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FF0077AA', // Blue
      osc_cs: '/super_control/next_scene',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Next Scene' },
        { name: 'textSize', value: 9 }
      ]
    });
  }

  // Navigation Controls
  if (options.includeNavigation) {
    const navButtonY = toscCanvasHeight - (buttonHeight * 3) - (spacing * 3);
    let navButtonX = spacing;

    // Previous Fixture button
    mainPageControls.push({
      type: 'button',
      name: 'btn_prev_fixture',
      x: navButtonX,
      y: navButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FFAA7700', // Brown
      osc_cs: '/super_control/prev_fixture',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Prev Fix' },
        { name: 'textSize', value: 9 }
      ]
    });

    navButtonX += buttonWidth + spacing;

    // Next Fixture button
    mainPageControls.push({
      type: 'button',
      name: 'btn_next_fixture',
      x: navButtonX,
      y: navButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FFAA7700', // Brown
      osc_cs: '/super_control/next_fixture',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Next Fix' },
        { name: 'textSize', value: 9 }
      ]
    });

    navButtonX += buttonWidth + spacing;

    // Previous Group button
    mainPageControls.push({
      type: 'button',
      name: 'btn_prev_group',
      x: navButtonX,
      y: navButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FF7700AA', // Purple
      osc_cs: '/super_control/prev_group',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Prev Grp' },
        { name: 'textSize', value: 9 }
      ]
    });

    navButtonX += buttonWidth + spacing;

    // Next Group button
    mainPageControls.push({
      type: 'button',
      name: 'btn_next_group',
      x: navButtonX,
      y: navButtonY,
      w: buttonWidth,
      h: buttonHeight,
      color: '#FF7700AA', // Purple
      osc_cs: '/super_control/next_group',
      buttonType: 1, // Push button
      properties: [
        { name: 'text', value: 'Next Grp' },
        { name: 'textSize', value: 9 }
      ]
    });
  }

  pages.push({ name: "SuperControl", width: toscCanvasWidth, height: toscCanvasHeight, controls: mainPageControls });

  // XY Pad Page (if enabled)
  if (options.includeXYPad) {
    const xyPageControls: TouchOscControl[] = [];
    
    // Large XY Pad for Pan/Tilt control
    const xyPadSize = Math.min(toscCanvasWidth, toscCanvasHeight) - (spacing * 4);
    const xyPadX = (toscCanvasWidth - xyPadSize) / 2;
    const xyPadY = (toscCanvasHeight - xyPadSize) / 2;

    xyPageControls.push({
      type: 'label',
      name: 'lbl_xy_pad',
      text: 'Pan/Tilt XY Control',
      x: xyPadX,
      y: xyPadY - 30,
      w: xyPadSize,
      h: 25,
      color: '#FFFFFFFF',
      textSize: 16,
    });

    // Note: TouchOSC doesn't have a native XY pad type in our simple schema
    // We'll create a simulated XY pad using overlapping horizontal and vertical faders
    xyPageControls.push({
      type: 'faderh',
      name: 'xy_pan',
      x: xyPadX,
      y: xyPadY + xyPadSize / 2 - 15,
      w: xyPadSize,
      h: 30,
      color: '#FF00FFFF', // Cyan
      osc_cs: '/super_control/xy_pan',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    xyPageControls.push({
      type: 'faderv',
      name: 'xy_tilt',
      x: xyPadX + xyPadSize / 2 - 15,
      y: xyPadY,
      w: 30,
      h: xyPadSize,
      color: '#FF00FFFF', // Cyan
      osc_cs: '/super_control/xy_tilt',
      scalef: 0.0,
      scalet: 1.0,
      response: 'absolute',
    });

    pages.push({ name: "XY_Pad", width: toscCanvasWidth, height: toscCanvasHeight, controls: xyPageControls });
  }

  // Autopilot Controls Page (if enabled)
  if (options.includeAutopilot) {
    const autopilotPageControls: TouchOscControl[] = [];
    let autopilotX = spacing;
    let autopilotY = spacing;

    // Autopilot Enable toggle
    autopilotPageControls.push({
      type: 'button',
      name: 'btn_autopilot_enable',
      x: autopilotX,
      y: autopilotY,
      w: buttonWidth * 2,
      h: buttonHeight,
      color: '#FF00AA00', // Green
      osc_cs: '/super_control/autopilot_enable',
      buttonType: 2, // Toggle button
      properties: [
        { name: 'text', value: 'Autopilot Enable' },
        { name: 'textSize', value: 10 }
      ]
    });

    autopilotY += buttonHeight + spacing * 2;

    // Track type buttons
    const trackTypes = ['circle', 'figure8', 'square', 'triangle', 'linear', 'random'];
    let trackButtonX = spacing;

    trackTypes.forEach((trackType, index) => {
      if (index > 0 && index % 3 === 0) {
        trackButtonX = spacing;
        autopilotY += buttonHeight + spacing;
      }

      autopilotPageControls.push({
        type: 'button',
        name: `btn_track_${trackType}`,
        x: trackButtonX,
        y: autopilotY,
        w: buttonWidth,
        h: buttonHeight,
        color: '#FF7700AA', // Purple
        osc_cs: `/super_control/autopilot_track_${trackType}`,
        buttonType: 1, // Push button
        properties: [
          { name: 'text', value: trackType.charAt(0).toUpperCase() + trackType.slice(1) },
          { name: 'textSize', value: 9 }
        ]
      });

      trackButtonX += buttonWidth + spacing;
    });

    autopilotY += buttonHeight + spacing * 2;

    // Autopilot control faders
    const autopilotControls = [
      { name: 'position', label: 'Position', color: '#FFFF7700' },
      { name: 'size', label: 'Size', color: '#FF00AA00' },
      { name: 'speed', label: 'Speed', color: '#FFAA0000' }
    ];

    autopilotControls.forEach((control, index) => {
      const controlX = spacing + index * (faderWidth + spacing);

      autopilotPageControls.push({
        type: 'label',
        name: `lbl_autopilot_${control.name}`,
        text: control.label,
        x: controlX,
        y: autopilotY,
        w: faderWidth,
        h: labelHeight,
        color: '#FFFFFFFF',
        textSize: 12,
      });

      autopilotPageControls.push({
        type: 'faderv',
        name: `fader_autopilot_${control.name}`,
        x: controlX,
        y: autopilotY + labelHeight + 5,
        w: faderWidth,
        h: faderHeight,
        color: control.color,
        osc_cs: `/super_control/autopilot_${control.name}`,
        scalef: 0.0,
        scalet: 1.0,
        response: 'absolute',
      });
    });

    pages.push({ name: "Autopilot", width: toscCanvasWidth, height: toscCanvasHeight, controls: autopilotPageControls });
  }

  const layoutDefinition: TouchOscLayout = {
    version: "1.0.0",
    mode: 0, // Fixed size
    orientation: orientation,
    pages: pages,
  };

  return generateIndexXml(layoutDefinition);
};

/**
 * Export the Super Control interface to a TouchOSC file
 */
export const exportSuperControlToToscFile = async (
  options: SuperControlExportOptions,
  filename: string = "ArtBastard_SuperControl.tosc"
) => {
  try {
    const indexXmlContent = generateSuperControlTouchOscLayout(options);
    
    const zip = new JSZip();
    zip.file("index.xml", indexXmlContent);
    
    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, filename);
    
    console.log("Super Control TouchOSC file generated and download initiated.");
    return { success: true, message: "Super Control export successful!" };
  } catch (error) {
    console.error("Error generating Super Control TouchOSC file:", error);
    return { success: false, message: `Export failed: ${error instanceof Error ? error.message : String(error)}` };
  }
};
