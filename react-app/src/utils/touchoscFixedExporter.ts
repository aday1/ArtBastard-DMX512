import { Fixture, MasterSlider, PlacedFixture } from '../store';
import JSZip from 'jszip';
import * as FileSaver from 'file-saver';

/**
 * TOUCHOSC CRASH FIX - Enhanced TouchOSC exporter with proper validation and formatting
 * 
 * This module addresses common TouchOSC import crash issues:
 * 1. XML encoding and escaping
 * 2. Color format validation 
 * 3. Control boundary validation
 * 4. OSC address validation
 * 5. Property type validation
 * 6. Layout structure compliance
 */

// Proper XML escaping for TouchOSC compatibility
const escapeXml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
};

// Enhanced name sanitization for TouchOSC
const sanitizeNameForTouchOSC = (name: string): string => {
  if (!name) return 'control';
  return name
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50) // TouchOSC has name length limits
    || 'control';
};

// Validate and fix color format for TouchOSC (ARGB format)
const validateColor = (color?: string): string => {
  if (!color) return '#FF444444'; // Default gray with full alpha
  
  // If it's already in ARGB format (#AARRGGBB), validate it
  if (color.match(/^#[0-9A-Fa-f]{8}$/)) {
    return color.toUpperCase();
  }
  
  // If it's RGB format (#RRGGBB), add full alpha
  if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
    return `#FF${color.substring(1)}`.toUpperCase();
  }
  
  // If it's short format (#RGB), expand to ARGB
  if (color.match(/^#[0-9A-Fa-f]{3}$/)) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#FF${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  
  // Default fallback
  return '#FF444444';
};

// Validate OSC address format
const validateOscAddress = (address?: string): string => {
  if (!address) return '/artbastard/control';
  
  // Ensure it starts with /
  if (!address.startsWith('/')) {
    address = '/' + address;
  }
  
  // Remove invalid characters and ensure valid OSC path
  const cleaned = address
    .replace(/[^a-zA-Z0-9_\-/]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/\/+/g, '/');
  
  return cleaned || '/artbastard/control';
};

// Validate control bounds within layout
const validateControlBounds = (
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  layoutWidth: number, 
  layoutHeight: number
): { x: number; y: number; w: number; h: number } => {
  // Ensure minimum dimensions
  const minW = Math.max(w, 20);
  const minH = Math.max(h, 20);
  
  // Ensure within layout bounds
  const validX = Math.max(0, Math.min(x, layoutWidth - minW));
  const validY = Math.max(0, Math.min(y, layoutHeight - minH));
  
  // Ensure controls don't exceed layout boundaries
  const maxW = Math.min(minW, layoutWidth - validX);
  const maxH = Math.min(minH, layoutHeight - validY);
  
  return {
    x: Math.round(validX),
    y: Math.round(validY),
    w: Math.round(maxW),
    h: Math.round(maxH)
  };
};

interface TouchOscControl {
  type: 'faderv' | 'faderh' | 'button' | 'label' | 'xypad';
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  osc_cs?: string;
  text?: string;
  scalef?: number;
  scalet?: number;
  response?: string;
  properties?: Array<{ name: string; value: string | number | boolean }>;
}

interface TouchOscPage {
  name: string;
  width: number;
  height: number;
  controls: TouchOscControl[];
}

interface TouchOscLayout {
  version: string;
  mode: number;
  orientation: 'vertical' | 'horizontal';
  pages: TouchOscPage[];
}

// Generate properly formatted control XML
const generateValidControlXml = (control: TouchOscControl, layoutWidth: number, layoutHeight: number): string => {
  // Validate and fix control bounds
  const bounds = validateControlBounds(control.x, control.y, control.w, control.h, layoutWidth, layoutHeight);
  
  // Validate required properties
  const validType = ['faderv', 'faderh', 'button', 'label', 'xypad'].includes(control.type) 
    ? control.type 
    : 'label';
  
  const validName = sanitizeNameForTouchOSC(control.name);
  const validColor = validateColor(control.color);
  const validOscAddress = control.osc_cs ? validateOscAddress(control.osc_cs) : '';
  
  // Build attributes string
  const attributes = [
    `type="${validType}"`,
    `name="${validName}"`,
    `x="${bounds.x}"`,
    `y="${bounds.y}"`,
    `w="${bounds.w}"`,
    `h="${bounds.h}"`,
    `color="${validColor}"`
  ];
  
  if (validOscAddress) {
    attributes.push(`osc_cs="${validOscAddress}"`);
  }
  
  // Build properties XML
  let propertiesXml = '';
  
  // Add control-specific properties
  if (validType === 'faderv' || validType === 'faderh') {
    propertiesXml += `    <property name="scalef">${control.scalef ?? 0}</property>\n`;
    propertiesXml += `    <property name="scalet">${control.scalet ?? 255}</property>\n`;
    propertiesXml += `    <property name="response">${control.response ?? 'absolute'}</property>\n`;
  }
  
  if (validType === 'button') {
    propertiesXml += `    <property name="type">1</property>\n`; // Push button
  }
  
  if (validType === 'label' && control.text) {
    propertiesXml += `    <property name="text">${escapeXml(control.text)}</property>\n`;
    propertiesXml += `    <property name="textSize">12</property>\n`;
  }
  
  // Add custom properties
  if (control.properties) {
    control.properties.forEach(prop => {
      const validPropName = sanitizeNameForTouchOSC(prop.name);
      let validPropValue = prop.value;
      
      // Ensure proper type formatting
      if (typeof validPropValue === 'string') {
        validPropValue = escapeXml(validPropValue.toString());
      }
      
      propertiesXml += `    <property name="${validPropName}">${validPropValue}</property>\n`;
    });
  }
  
  return `  <control ${attributes.join(' ')}>\n${propertiesXml}  </control>`;
};

// Generate valid page XML
const generateValidPageXml = (page: TouchOscPage): string => {
  const validPageName = sanitizeNameForTouchOSC(page.name);
  const controlsXml = page.controls
    .map(control => generateValidControlXml(control, page.width, page.height))
    .join('\n');
  
  return `<page name="${validPageName}">\n${controlsXml}\n</page>`;
};

// Generate complete and valid TouchOSC XML
const generateValidTouchOscXml = (layout: TouchOscLayout): string => {
  const mainPage = layout.pages[0];
  if (!mainPage) {
    throw new Error('TouchOSC layout must have at least one page');
  }
  
  // Validate layout dimensions
  const layoutWidth = Math.max(mainPage.width, 320);
  const layoutHeight = Math.max(mainPage.height, 240);
  
  const pagesXml = layout.pages
    .map(page => generateValidPageXml({ ...page, width: layoutWidth, height: layoutHeight }))
    .join('\n\n');
  
  // Generate complete XML with proper encoding
  return `<?xml version="1.0" encoding="UTF-8"?>
<layout version="${layout.version}" mode="${layout.mode}" orientation="${layout.orientation}" width="${layoutWidth}" height="${layoutHeight}">
${pagesXml}
</layout>`;
};

// Export options interface
export interface FixedExportOptions {
  resolution: 'phone_portrait' | 'tablet_portrait' | 'ipad_landscape';
  includeFixtureControls: boolean;
  includeMasterSliders: boolean;
  includeAllDmxChannels: boolean;
}

// Resolution definitions
const SAFE_RESOLUTIONS = {
  phone_portrait: { width: 720, height: 1280, orientation: 'vertical' as const },
  tablet_portrait: { width: 1024, height: 1366, orientation: 'vertical' as const },
  ipad_landscape: { width: 1366, height: 1024, orientation: 'horizontal' as const }
};

// Generate TouchOSC layout with crash prevention
export const generateCrashProofTouchOscLayout = (
  options: FixedExportOptions,
  placedFixtures: PlacedFixture[],
  masterSliders: MasterSlider[],
  allFixtures: Fixture[]
): string => {
  const resolution = SAFE_RESOLUTIONS[options.resolution];
  const pages: TouchOscPage[] = [];
  
  // Main page with fixture and master controls
  const mainPageControls: TouchOscControl[] = [];
  
  let currentX = 20;
  let currentY = 20;
  const controlWidth = 60;
  const controlHeight = 180;
  const spacing = 20;
  
  // Add fixture controls
  if (options.includeFixtureControls && placedFixtures.length > 0) {
    placedFixtures.forEach((pFixture, fixtureIndex) => {
      const fixtureDef = allFixtures.find(f => f.name === pFixture.fixtureStoreId);
      if (!fixtureDef) return;
      
      if (pFixture.controls && pFixture.controls.length > 0) {
        pFixture.controls.forEach((pControl, controlIndex) => {
          const channelDef = fixtureDef.channels.find(ch => ch.name === pControl.channelNameInFixture);
          if (!channelDef) return;
          
          const channelIndex = fixtureDef.channels.indexOf(channelDef);
          const dmxAddress = pFixture.startAddress + channelIndex;
          
          // Ensure controls stay within bounds
          if (currentX + controlWidth > resolution.width - 20) {
            currentX = 20;
            currentY += controlHeight + spacing + 30; // Extra space for label
          }
          
          // Add label
          mainPageControls.push({
            type: 'label',
            name: `lbl_${sanitizeNameForTouchOSC(pFixture.name)}_${sanitizeNameForTouchOSC(channelDef.name)}`,
            text: `${pFixture.name} ${channelDef.name}`,
            x: currentX,
            y: currentY,
            w: controlWidth,
            h: 20,
            color: '#FFFFFFFF'
          });
          
          // Add fader
          mainPageControls.push({
            type: 'faderv',
            name: `fader_${sanitizeNameForTouchOSC(pFixture.name)}_${sanitizeNameForTouchOSC(channelDef.name)}`,
            x: currentX,
            y: currentY + 25,
            w: controlWidth,
            h: controlHeight,
            color: validateColor(pFixture.color || '#4ECDC4'),
            osc_cs: `/dmx/${dmxAddress}/value`,
            scalef: 0,
            scalet: 255,
            response: 'absolute'
          });
          
          currentX += controlWidth + spacing;
        });
      }
    });
  }
  
  // Add master sliders
  if (options.includeMasterSliders && masterSliders.length > 0) {
    // Start new row for master controls
    if (mainPageControls.length > 0) {
      currentX = 20;
      currentY += controlHeight + spacing + 50;
    }
    
    masterSliders.forEach((slider, index) => {
      if (currentX + controlWidth > resolution.width - 20) {
        currentX = 20;
        currentY += controlHeight + spacing + 30;
      }
      
      // Add label
      mainPageControls.push({
        type: 'label',
        name: `lbl_master_${sanitizeNameForTouchOSC(slider.name)}`,
        text: slider.name,
        x: currentX,
        y: currentY,
        w: controlWidth,
        h: 20,
        color: '#FFFFFFFF'
      });
      
      // Add fader
      mainPageControls.push({
        type: 'faderv',
        name: `fader_master_${sanitizeNameForTouchOSC(slider.name)}`,
        x: currentX,
        y: currentY + 25,
        w: controlWidth,
        h: controlHeight,
        color: '#FFFF6600', // Orange for master
        osc_cs: `/master/${sanitizeNameForTouchOSC(slider.name)}`,
        scalef: 0,
        scalet: 255,
        response: 'absolute'
      });
      
      currentX += controlWidth + spacing;
    });
  }
  
  // Add main page
  pages.push({
    name: 'Main_Control',
    width: resolution.width,
    height: resolution.height,
    controls: mainPageControls
  });
  
  // Add DMX channel page if requested
  if (options.includeAllDmxChannels) {
    const dmxControls: TouchOscControl[] = [];
    const dmxFaderWidth = 50;
    const dmxFaderHeight = 140;
    const dmxSpacing = 10;
    
    const fadersPerRow = Math.floor((resolution.width - dmxSpacing) / (dmxFaderWidth + dmxSpacing));
    
    for (let i = 0; i < 512; i++) {
      const row = Math.floor(i / fadersPerRow);
      const col = i % fadersPerRow;
      const dmxChannel = i + 1;
      
      const x = dmxSpacing + col * (dmxFaderWidth + dmxSpacing);
      const y = dmxSpacing + row * (dmxFaderHeight + 30); // 30 for label
      
      // Add label
      dmxControls.push({
        type: 'label',
        name: `lbl_dmx_${dmxChannel}`,
        text: `${dmxChannel}`,
        x: x,
        y: y,
        w: dmxFaderWidth,
        h: 15,
        color: '#FFFFFFFF'
      });
      
      // Add fader
      dmxControls.push({
        type: 'faderv',
        name: `fader_dmx_${dmxChannel}`,
        x: x,
        y: y + 20,
        w: dmxFaderWidth,
        h: dmxFaderHeight,
        color: '#FF666666', // Gray for DMX channels
        osc_cs: `/dmx/${dmxChannel}/value`,
        scalef: 0,
        scalet: 255,
        response: 'absolute'
      });
    }
    
    pages.push({
      name: 'DMX_Channels',
      width: resolution.width,
      height: Math.max(resolution.height, dmxSpacing + Math.ceil(512 / fadersPerRow) * (dmxFaderHeight + 30)),
      controls: dmxControls
    });
  }
  
  const layout: TouchOscLayout = {
    version: '1.0.0',
    mode: 0, // Fixed size mode
    orientation: resolution.orientation,
    pages: pages
  };
  
  return generateValidTouchOscXml(layout);
};

// Export to .tosc file with crash prevention
export const exportCrashProofToscFile = async (
  options: FixedExportOptions,
  placedFixtures: PlacedFixture[],
  masterSliders: MasterSlider[],
  allFixtures: Fixture[],
  filename: string = 'ArtBastard_Fixed.tosc'
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Generating crash-proof TouchOSC file...');
    
    // Generate the XML with validation
    const xmlContent = generateCrashProofTouchOscLayout(options, placedFixtures, masterSliders, allFixtures);
    
    // Validate XML content
    if (xmlContent.length < 100) {
      throw new Error('Generated XML is too short - possible generation error');
    }
    
    if (!xmlContent.includes('<?xml') || !xmlContent.includes('<layout')) {
      throw new Error('Generated XML is missing required elements');
    }
    
    console.log('✅ XML validation passed');
    console.log(`📊 Generated XML size: ${xmlContent.length} characters`);
    
    // Create ZIP file
    const zip = new JSZip();
    zip.file('index.xml', xmlContent);
    
    // Generate and download
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    FileSaver.saveAs(content, filename);
    
    console.log('✅ TouchOSC file generated successfully');
    return { 
      success: true, 
      message: `TouchOSC file '${filename}' generated successfully with crash prevention fixes!` 
    };
    
  } catch (error) {
    console.error('❌ Error generating crash-proof TouchOSC file:', error);
    return { 
      success: false, 
      message: `Export failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

export default {
  generateCrashProofTouchOscLayout,
  exportCrashProofToscFile,
  validateColor,
  validateOscAddress,
  sanitizeNameForTouchOSC,
  escapeXml
};
