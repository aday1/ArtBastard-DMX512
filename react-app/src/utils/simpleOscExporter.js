// Helper to sanitize names for OSC paths and XML names
const sanitizeName = (name) => {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_{2,}/g, '_');
};
const generateControlXml = (control) => {
    const sanitizedName = sanitizeName(control.name);
    const color = control.color ? control.color.replace('#', '#FF') : '#FF0077FF';
    let propertiesXml = '';
    switch (control.type) {
        case 'fader':
            propertiesXml = `    <property name="scalef">${control.range?.min || 0}</property>
    <property name="scalet">${control.range?.max || 255}</property>
    <property name="response">absolute</property>`;
            break;
        case 'button':
            propertiesXml = `    <property name="type">1</property>`; // Push button
            break;
        case 'label':
            propertiesXml = `    <property name="text">${control.name}</property>
    <property name="textSize">10</property>`;
            break;
        case 'xypad':
            propertiesXml = `    <property name="scalef_x">0</property>
    <property name="scalet_x">255</property>
    <property name="scalef_y">0</property>
    <property name="scalet_y">255</property>
    <property name="response">absolute</property>
    <property name="osc_cs_x">${control.oscAddress}/pan</property>
    <property name="osc_cs_y">${control.oscAddress}/tilt</property>`;
            break;
    }
    const controlType = control.type === 'fader' ? 'faderv' : control.type;
    const oscCs = control.type !== 'xypad' ? `osc_cs="${control.oscAddress}"` : '';
    return `  <control type="${controlType}" name="${sanitizedName}" x="${control.x}" y="${control.y}" w="${control.width}" h="${control.height}" color="${color}" ${oscCs}>
${propertiesXml}
  </control>`;
};
const generatePageXml = (page) => {
    const controlsXml = page.controls.map(generateControlXml).join('\n');
    return `<page name="${sanitizeName(page.name)}">
${controlsXml}
</page>`;
};
const generateIndexXml = (layout) => {
    const mainPage = layout.pages[0];
    if (!mainPage)
        throw new Error("At least one page is required for the layout.");
    const pagesXml = layout.pages.map(generatePageXml).join('\n\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<layout version="1.0.0" mode="0" orientation="vertical" width="${mainPage.width}" height="${mainPage.height}">
${pagesXml}
</layout>`;
};
export const exportSimpleOSCLayout = async (layout) => {
    try {
        const xmlContent = generateIndexXml(layout);
        const filename = layout.filename || 'ArtBastard_TouchOSC.xml';
        // Create blob and trigger download
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('TouchOSC XML generated and downloaded:', filename);
        return { success: true, message: 'TouchOSC layout exported successfully!' };
    }
    catch (error) {
        console.error('Error generating TouchOSC layout:', error);
        return { success: false, message: `Export failed: ${error instanceof Error ? error.message : String(error)}` };
    }
};
