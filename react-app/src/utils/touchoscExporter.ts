import { Fixture, MasterSlider } from '../store'; // Assuming types are exported from store
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
  resolution: 'phone_portrait' | 'tablet_portrait';
  includeFixtureControls: boolean;
  includeMasterSliders: boolean;
  includeAllDmxChannels: boolean;
}

const RESOLUTIONS = {
  phone_portrait: { width: 720, height: 1280, orientation: 'vertical' as const },
  tablet_portrait: { width: 1024, height: 1366, orientation: 'vertical' as const },
  // Landscape options could be added if needed
  // phone_landscape: { width: 1280, height: 720, orientation: 'horizontal' as const },
  // tablet_landscape: { width: 1366, height: 1024, orientation: 'horizontal' as const },
};

export const generateTouchOscLayout = (
  options: ExportOptions,
  fixtures: Fixture[],
  masterSliders: MasterSlider[]
): string => {
  const { width, height, orientation } = RESOLUTIONS[options.resolution];
  const pages: TouchOscPage[] = [];

  // --- Main Page for Fixtures and Master Sliders ---
  const mainPageControls: TouchOscControl[] = [];
  let currentX = 10;
  let currentY = 10;
  const faderWidth = 60;
  const faderHeight = 200;
  const labelHeight = 20;
  const spacing = 10;

  if (options.includeFixtureControls) {
    fixtures.forEach(fixture => {
      // Fixture Label
      mainPageControls.push({
        type: 'label',
        name: `lbl_fixture_${fixture.name}`,
        text: fixture.name,
        x: currentX,
        y: currentY,
        w: faderWidth * fixture.channels.length + spacing * (fixture.channels.length -1), // Span across its channels
        h: labelHeight,
        color: '#FFFFFFFF', // White
        textSize: 14,
      });
      currentY += labelHeight + spacing / 2;

      let channelX = currentX;
      fixture.channels.forEach((channel, index) => {
        const safeFixtureName = sanitizeName(fixture.name);
        const safeChannelName = sanitizeName(channel.name);
        
        // Channel Label
        mainPageControls.push({
            type: 'label',
            name: `lbl_${safeFixtureName}_${safeChannelName}`,
            text: channel.name.substring(0,5), // Short name
            x: channelX,
            y: currentY,
            w: faderWidth,
            h: labelHeight,
            color: '#FFEFEFEF',
            textSize: 10,
        });

        // Fader for Channel
        mainPageControls.push({
          type: 'faderv',
          name: `fader_${safeFixtureName}_${safeChannelName}`,
          x: channelX,
          y: currentY + labelHeight + spacing / 2,
          w: faderWidth,
          h: faderHeight,
          color: '#FF0077FF', // Blueish
          osc_cs: `/fixture/${safeFixtureName}/${safeChannelName}/value`,
          scalef: 0.0,
          scalet: 1.0,
          response: 'absolute',
        });
        channelX += faderWidth + spacing;
      });
      currentX = 10; // Reset X for next fixture block or move to new row
      currentY += faderHeight + labelHeight + spacing * 2; // Move Y down for next fixture block
      // Basic wrapping (very naive)
      if (currentY + faderHeight > height - 20) { // If next block won't fit
          currentY = 10;
          // This doesn't handle horizontal wrapping, assumes enough width or few fixtures
      }

    });
  }
  
  // Add a bit more space before master sliders if fixtures were added
  if (options.includeFixtureControls && fixtures.length > 0) {
    currentY += spacing * 2; 
  } else { // Reset Y if no fixtures
    currentY = 10;
  }


  if (options.includeMasterSliders) {
    masterSliders.forEach(slider => {
      const safeSliderName = sanitizeName(slider.name);
      mainPageControls.push({
        type: 'label',
        name: `lbl_master_${safeSliderName}`,
        text: slider.name,
        x: currentX,
        y: currentY,
        w: faderWidth,
        h: labelHeight,
        color: '#FFFFFFFF',
        textSize: 12,
      });
      mainPageControls.push({
        type: 'faderv',
        name: `fader_master_${safeSliderName}`,
        x: currentX,
        y: currentY + labelHeight + spacing / 2,
        w: faderWidth,
        h: faderHeight,
        color: '#FFFF7700', // Orangeish
        osc_cs: `/master/${safeSliderName}/value`,
        scalef: 0.0,
        scalet: 1.0,
        response: 'absolute',
      });
      currentX += faderWidth + spacing;
      // Basic wrapping for master sliders
      if (currentX + faderWidth > width - 20) {
        currentX = 10;
        currentY += faderHeight + labelHeight + spacing * 2;
      }
    });
  }

  pages.push({ name: "Main", width, height, controls: mainPageControls });

  // --- Page for All DMX Channels (if selected) ---
  if (options.includeAllDmxChannels) {
    const dmxPageControls: TouchOscControl[] = [];
    const dmxFadersPerRow = Math.floor((width - spacing) / (faderWidth + spacing));
    const numRows = Math.ceil(512 / dmxFadersPerRow);
    
    // This page might become very tall. TouchOSC handles scrolling within a page.
    const dmxPageHeight = numRows * (faderHeight + labelHeight + spacing * 2) + spacing;

    for (let i = 0; i < 512; i++) {
      const row = Math.floor(i / dmxFadersPerRow);
      const col = i % dmxFadersPerRow;
      const dmxChannelNum = i + 1;

      const xPos = spacing + col * (faderWidth + spacing);
      const yPos = spacing + row * (faderHeight + labelHeight + spacing * 2);
      
      dmxPageControls.push({
        type: 'label',
        name: `lbl_dmx_${dmxChannelNum}`,
        text: `DMX ${dmxChannelNum}`,
        x: xPos,
        y: yPos,
        w: faderWidth,
        h: labelHeight,
        color: '#FFCCCCCC',
        textSize: 8,
      });
      dmxPageControls.push({
        type: 'faderv',
        name: `fader_dmx_${dmxChannelNum}`,
        x: xPos,
        y: yPos + labelHeight + spacing / 2,
        w: faderWidth,
        h: faderHeight,
        color: '#FF444444', // Grey
        osc_cs: `/dmx/${dmxChannelNum}/value`,
        scalef: 0.0,
        scalet: 1.0,
        response: 'absolute',
      });
    }
    // Note: The page dimensions in TouchOSC are typically for the overall layout.
    // If a page's content exceeds these, TouchOSC usually allows scrolling.
    // So, we use the main layout dimensions for the page definition.
    pages.push({ name: "All_DMX", width, height, controls: dmxPageControls });
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
  fixtures: Fixture[],
  masterSliders: MasterSlider[],
  filename: string = "ArtBastardOSC.tosc"
) => {
  try {
    const indexXmlContent = generateTouchOscLayout(options, fixtures, masterSliders);
    
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
