import { Fixture, MasterSlider, PlacedFixture, PlacedControl } from '../store'; // Updated imports
import JSZip from 'jszip';
import { saveAs } from 'file-saver'; // For triggering download

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
    saveAs(content, filename); // saveAs from file-saver
    
    console.log("TouchOSC file generated and download initiated.");
    return { success: true, message: "Export successful!" };
  } catch (error) {
    console.error("Error generating TouchOSC file:", error);
    return { success: false, message: `Export failed: ${error instanceof Error ? error.message : String(error)}` };
  }
};
