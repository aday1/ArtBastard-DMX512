import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../../store';
import { exportToToscFile } from '../../utils/touchoscExporter'; // Import ExportOptions
import styles from './TouchOSCExporter.module.scss';
export const TouchOSCExporter = () => {
    // Renaming placedFixtures to fixtureLayout for clarity as it's PlacedFixture[] from store
    // and fixtures to allFixtures for clarity as it's Fixture[] (definitions) from store.
    const { allFixtures, masterSliders, fixtureLayout } = useStore(state => ({
        allFixtures: state.fixtures,
        masterSliders: state.masterSliders,
        fixtureLayout: state.fixtureLayout, // Placed Fixture data
    }));
    const [pages, setPages] = useState([
        {
            id: 'main',
            name: 'Main Control',
            width: 1024,
            height: 768,
            controls: []
        }
    ]);
    const [selectedPageId, setSelectedPageId] = useState('main');
    const [isEditingControl, setIsEditingControl] = useState(false);
    const [editingControl, setEditingControl] = useState(null);
    const [newControlType, setNewControlType] = useState('fader');
    const [canvasZoom, setCanvasZoom] = useState(0.5);
    const [previewMode, setPreviewMode] = useState(false);
    const [draggedControl, setDraggedControl] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedResolution, setSelectedResolution] = useState('tablet_portrait'); // Add state for resolution
    const selectedPage = pages.find(p => p.id === selectedPageId);
    const addPage = () => {
        const newPageId = `page_${Date.now()}`;
        const newPage = {
            id: newPageId,
            name: `Page ${pages.length + 1}`,
            width: 1024,
            height: 768,
            controls: []
        };
        setPages([...pages, newPage]);
        setSelectedPageId(newPageId);
    };
    const deletePage = (pageId) => {
        if (pages.length <= 1)
            return; // Keep at least one page
        const updatedPages = pages.filter(p => p.id !== pageId);
        setPages(updatedPages);
        if (selectedPageId === pageId) {
            setSelectedPageId(updatedPages[0].id);
        }
    };
    const updatePageName = (pageId, newName) => {
        setPages(pages.map(p => p.id === pageId ? { ...p, name: newName } : p));
    };
    const editPageName = (pageId) => {
        const newName = prompt('Enter new page name:', pages.find(p => p.id === pageId)?.name);
        if (newName && newName.trim()) {
            updatePageName(pageId, newName.trim());
        }
    };
    const addControl = (type) => {
        if (!selectedPage)
            return;
        const newControl = {
            id: `control_${Date.now()}`,
            type,
            name: `${type}_${selectedPage.controls.length + 1}`,
            x: 50 + (selectedPage.controls.length % 8) * 120,
            y: 50 + Math.floor(selectedPage.controls.length / 8) * 80,
            width: type === 'fader' ? 60 : 100,
            height: type === 'fader' ? 200 : 50,
            oscAddress: `/${type}/${selectedPage.controls.length + 1}`,
            color: '#4ecdc4',
            range: type === 'fader' ? { min: 0, max: 255 } : undefined
        };
        const updatedPages = pages.map(p => p.id === selectedPageId
            ? { ...p, controls: [...p.controls, newControl] }
            : p);
        setPages(updatedPages);
    };
    const editControl = (control) => {
        setEditingControl(control);
        setIsEditingControl(true);
    };
    const updateControl = (updatedControl) => {
        const updatedPages = pages.map(p => p.id === selectedPageId
            ? {
                ...p,
                controls: p.controls.map(c => c.id === updatedControl.id ? updatedControl : c)
            }
            : p);
        setPages(updatedPages);
        setIsEditingControl(false);
        setEditingControl(null);
    };
    const deleteControl = (controlId) => {
        const updatedPages = pages.map(p => p.id === selectedPageId
            ? { ...p, controls: p.controls.filter(c => c.id !== controlId) }
            : p);
        setPages(updatedPages);
    };
    const generateFromFixtures = () => {
        if (!selectedPage)
            return;
        const controls = [];
        let x = 50, y = 50;
        // Add master faders
        masterSliders.forEach((master, index) => {
            controls.push({
                id: `master_${master.id}`,
                type: 'fader',
                name: master.name || `Master ${index + 1}`,
                x: x,
                y: y,
                width: 60,
                height: 200,
                oscAddress: `/master/${master.id}`,
                color: '#ff6b6b',
                range: { min: 0, max: 255 }
            });
            x += 80;
        });
        // Add fixture controls
        // This section (generateFromFixtures) is for the internal TouchOSC designer canvas,
        // not directly related to the export function being modified.
        // However, it uses `placedFixtures` and `fixtures` which I've renamed to `fixtureLayout` and `allFixtures`.
        // So, I should update it here for consistency if this component is to remain functional.
        fixtureLayout.forEach((fixture, fixtureIndex) => {
            const fixtureData = allFixtures.find(f => f.id === fixture.fixtureId); // Renamed: fixtures -> allFixtures
            if (!fixtureData)
                return;
            fixtureData.channels.forEach((channel, channelIndex) => {
                if (x > selectedPage.width - 100) {
                    x = 50;
                    y += 220;
                }
                controls.push({
                    id: `fixture_${fixture.id}_ch_${channelIndex}`,
                    type: 'fader',
                    name: `${fixtureData.name} ${channel.name}`,
                    x: x,
                    y: y,
                    width: 60,
                    height: 200,
                    oscAddress: `/fixture/${fixture.id}/channel/${channelIndex}`,
                    color: '#4ecdc4',
                    range: { min: 0, max: 255 }
                });
                x += 80;
            });
        });
        const updatedPages = pages.map(p => p.id === selectedPageId
            ? { ...p, controls }
            : p);
        setPages(updatedPages);
    };
    const exportLayout = async () => {
        try {
            setIsExporting(true);
            const options = {
                resolution: selectedResolution,
                includeFixtureControls: true,
                includeMasterSliders: true,
                includeAllDmxChannels: false // This can be made configurable later
            };
            // Corrected arguments order: options, fixtureLayout (as placedFixtures), masterSliders, allFixtures
            await exportToToscFile(options, fixtureLayout, masterSliders, allFixtures, 'ArtBastardOSC.tosc');
        }
        catch (error) {
            console.error('Export failed:', error);
        }
        finally {
            setIsExporting(false);
        }
    };
    const handleControlDrag = (controlId, x, y) => {
        const updatedPages = pages.map(p => p.id === selectedPageId
            ? {
                ...p,
                controls: p.controls.map(c => c.id === controlId ? { ...c, x, y } : c)
            }
            : p);
        setPages(updatedPages);
    };
    const duplicateControl = (control) => {
        const newControl = {
            ...control,
            id: `control_${Date.now()}`,
            name: `${control.name}_copy`,
            x: control.x + 20,
            y: control.y + 20
        };
        const updatedPages = pages.map(p => p.id === selectedPageId
            ? { ...p, controls: [...p.controls, newControl] }
            : p);
        setPages(updatedPages);
    };
    return (_jsxs("div", { className: styles.touchOSCExporter, children: [_jsx("div", { className: styles.modernHeader, children: _jsxs("div", { className: styles.headerContent, children: [_jsxs("div", { className: styles.titleSection, children: [_jsx("div", { className: styles.iconContainer, children: _jsx("i", { className: "fas fa-mobile-alt" }) }), _jsxs("div", { className: styles.titleText, children: [_jsx("h1", { children: "TouchOSC Designer" }), _jsx("p", { children: "Create beautiful, responsive OSC interfaces" })] })] }), _jsxs("div", { className: styles.headerActions, children: [_jsxs("button", { className: `${styles.previewButton} ${previewMode ? styles.active : ''}`, onClick: () => setPreviewMode(!previewMode), children: [_jsx("i", { className: previewMode ? "fas fa-edit" : "fas fa-eye" }), previewMode ? 'Edit Mode' : 'Preview Mode'] }), _jsxs("div", { className: styles.resolutionSelector, children: [_jsx("label", { htmlFor: "resolutionSelect", children: "Resolution:" }), _jsxs("select", { id: "resolutionSelect", value: selectedResolution, onChange: (e) => setSelectedResolution(e.target.value), className: styles.selectDropdown, children: [_jsx("option", { value: "phone_portrait", children: "Phone Portrait (720x1280)" }), _jsx("option", { value: "tablet_portrait", children: "Tablet Portrait (1024x1366)" }), _jsx("option", { value: "ipad_pro_2019_portrait", children: "iPad Pro 2019 Portrait (1668x2420)" }), _jsx("option", { value: "ipad_pro_2019_landscape", children: "iPad Pro 2019 Landscape (2420x1668)" }), _jsx("option", { value: "samsung_s21_specified_portrait", children: "Samsung S21 Portrait (1668x2420 - Specified)" }), _jsx("option", { value: "samsung_s21_specified_landscape", children: "Samsung S21 Landscape (2420x1668 - Specified)" })] })] }), _jsxs("button", { className: styles.exportButton, onClick: exportLayout, disabled: isExporting, children: [_jsx("i", { className: isExporting ? "fas fa-spinner fa-spin" : "fas fa-download" }), isExporting ? 'Exporting...' : 'Export Layout'] })] })] }) }), _jsxs("div", { className: styles.editorLayout, children: [_jsxs("div", { className: styles.sidebar, children: [_jsxs("div", { className: styles.sidebarSection, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-layer-group" }), " Pages"] }), _jsxs("div", { className: styles.pageList, children: [pages.map(page => (_jsxs("div", { className: `${styles.pageItem} ${selectedPageId === page.id ? styles.active : ''}`, children: [_jsxs("button", { className: styles.pageSelectButton, onClick: () => setSelectedPageId(page.id), children: [_jsx("i", { className: "fas fa-file-alt" }), _jsx("span", { children: page.name }), _jsx("span", { className: styles.controlCount, children: page.controls.length })] }), _jsxs("div", { className: styles.pageActions, children: [_jsx("button", { className: styles.iconButton, onClick: () => editPageName(page.id), title: "Rename", children: _jsx("i", { className: "fas fa-edit" }) }), pages.length > 1 && (_jsx("button", { className: `${styles.iconButton} ${styles.danger}`, onClick: () => deletePage(page.id), title: "Delete Page", children: _jsx("i", { className: "fas fa-trash" }) }))] })] }, page.id))), _jsxs("button", { className: styles.addPageButton, onClick: addPage, children: [_jsx("i", { className: "fas fa-plus" }), "Add New Page"] })] })] }), !previewMode && (_jsxs("div", { className: styles.sidebarSection, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-tools" }), " Add Controls"] }), _jsxs("div", { className: styles.controlToolbox, children: [_jsxs("button", { className: styles.toolButton, onClick: () => addControl('fader'), children: [_jsx("i", { className: "fas fa-sliders-h" }), _jsx("span", { children: "Fader" })] }), _jsxs("button", { className: styles.toolButton, onClick: () => addControl('button'), children: [_jsx("i", { className: "fas fa-hand-pointer" }), _jsx("span", { children: "Button" })] }), _jsxs("button", { className: styles.toolButton, onClick: () => addControl('label'), children: [_jsx("i", { className: "fas fa-tag" }), _jsx("span", { children: "Label" })] })] }), _jsxs("button", { className: styles.generateButton, onClick: generateFromFixtures, children: [_jsx("i", { className: "fas fa-magic" }), "Auto-Generate from Fixtures"] })] })), _jsxs("div", { className: styles.sidebarSection, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-search" }), " Canvas"] }), _jsxs("div", { className: styles.canvasControls, children: [_jsxs("label", { children: ["Zoom: ", Math.round(canvasZoom * 100), "%", _jsx("input", { type: "range", min: "0.25", max: "2", step: "0.25", value: canvasZoom, onChange: (e) => setCanvasZoom(parseFloat(e.target.value)), className: styles.zoomSlider })] }), _jsxs("button", { className: styles.fitButton, onClick: () => setCanvasZoom(0.5), children: [_jsx("i", { className: "fas fa-expand-arrows-alt" }), "Fit to View"] })] })] }), selectedPage && (_jsxs("div", { className: styles.sidebarSection, children: [_jsxs("h3", { children: [_jsx("i", { className: "fas fa-info-circle" }), " Page Info"] }), _jsxs("div", { className: styles.pageStats, children: [_jsxs("div", { className: styles.stat, children: [_jsx("span", { className: styles.statLabel, children: "Resolution:" }), _jsxs("span", { className: styles.statValue, children: [selectedPage.width, " \u00D7 ", selectedPage.height] })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { className: styles.statLabel, children: "Controls:" }), _jsx("span", { className: styles.statValue, children: selectedPage.controls.length })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { className: styles.statLabel, children: "Page ID:" }), _jsx("span", { className: styles.statValue, children: selectedPage.id })] })] })] }))] }), _jsxs("div", { className: styles.mainCanvas, children: [_jsxs("div", { className: styles.canvasHeader, children: [_jsxs("div", { className: styles.canvasTitle, children: [_jsx("h2", { children: selectedPage?.name || 'No Page Selected' }), _jsx("span", { className: styles.canvasSubtitle, children: "Design your TouchOSC interface" })] }), _jsxs("div", { className: styles.canvasToolbar, children: [_jsx("button", { className: styles.toolbarButton, title: "Grid Snap", children: _jsx("i", { className: "fas fa-th" }) }), _jsx("button", { className: styles.toolbarButton, title: "Align Left", children: _jsx("i", { className: "fas fa-align-left" }) }), _jsx("button", { className: styles.toolbarButton, title: "Align Center", children: _jsx("i", { className: "fas fa-align-center" }) }), _jsx("button", { className: styles.toolbarButton, title: "Align Right", children: _jsx("i", { className: "fas fa-align-right" }) })] })] }), selectedPage && (_jsx("div", { className: styles.canvasContainer, children: _jsx("div", { className: styles.canvasWrapper, children: _jsx("div", { className: `${styles.deviceCanvas} ${previewMode ? styles.previewMode : ''}`, style: {
                                            width: `${selectedPage.width * canvasZoom}px`,
                                            height: `${selectedPage.height * canvasZoom}px`,
                                            transform: `scale(${canvasZoom})`
                                        }, children: _jsxs("div", { className: styles.deviceScreen, children: [selectedPage.controls.map(control => (_jsxs("div", { className: `${styles.oscControl} ${styles[control.type]} ${draggedControl === control.id ? styles.dragging : ''}`, style: {
                                                        left: `${control.x}px`,
                                                        top: `${control.y}px`,
                                                        width: `${control.width}px`,
                                                        height: `${control.height}px`,
                                                        backgroundColor: control.color || '#4ecdc4'
                                                    }, onClick: () => !previewMode && editControl(control), onMouseDown: () => setDraggedControl(control.id), children: [_jsxs("div", { className: styles.controlContent, children: [_jsx("span", { className: styles.controlName, children: control.name }), _jsx("span", { className: styles.controlAddress, children: control.oscAddress }), control.type === 'fader' && _jsx("div", { className: styles.faderTrack }), control.type === 'button' && _jsx("div", { className: styles.buttonGlow })] }), !previewMode && (_jsxs("div", { className: styles.controlActions, children: [_jsx("button", { className: styles.controlAction, onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        duplicateControl(control);
                                                                    }, title: "Duplicate", children: _jsx("i", { className: "fas fa-copy" }) }), _jsx("button", { className: `${styles.controlAction} ${styles.danger}`, onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        deleteControl(control.id);
                                                                    }, title: "Delete", children: _jsx("i", { className: "fas fa-trash" }) })] }))] }, control.id))), !previewMode && selectedPage.controls.length === 0 && (_jsx("div", { className: styles.emptyCanvas, children: _jsxs("div", { className: styles.emptyContent, children: [_jsx("i", { className: "fas fa-mobile-alt" }), _jsx("h3", { children: "Empty Canvas" }), _jsx("p", { children: "Add controls from the sidebar to get started" }), _jsxs("button", { onClick: generateFromFixtures, className: styles.quickStartButton, children: [_jsx("i", { className: "fas fa-magic" }), "Quick Start: Generate from Fixtures"] })] }) }))] }) }) }) }))] })] }), "      ", isEditingControl && editingControl && (_jsxs("div", { className: styles.modernModal, children: [_jsx("div", { className: styles.modalBackdrop, onClick: () => setIsEditingControl(false) }), _jsxs("div", { className: styles.modernModalContent, children: [_jsxs("div", { className: styles.modalHeader, children: [_jsxs("h2", { children: [_jsx("i", { className: `fas ${editingControl.type === 'fader' ? 'fa-sliders-h' : editingControl.type === 'button' ? 'fa-hand-pointer' : 'fa-tag'}` }), "Edit ", editingControl.type.charAt(0).toUpperCase() + editingControl.type.slice(1), " Control"] }), _jsx("button", { className: styles.closeButton, onClick: () => setIsEditingControl(false), children: _jsx("i", { className: "fas fa-times" }) })] }), _jsxs("form", { onSubmit: (e) => {
                                    e.preventDefault();
                                    updateControl(editingControl);
                                }, children: [_jsxs("div", { className: styles.modalBody, children: [_jsxs("div", { className: styles.formSection, children: [_jsx("h4", { children: "Basic Properties" }), _jsxs("div", { className: styles.formRow, children: [_jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-tag" }), "Control Name", _jsx("input", { type: "text", value: editingControl.name, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                name: e.target.value
                                                                            }), placeholder: "Enter control name" })] }) }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-satellite-dish" }), "OSC Address", _jsx("input", { type: "text", value: editingControl.oscAddress, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                oscAddress: e.target.value
                                                                            }), placeholder: "/control/path" })] }) })] })] }), _jsxs("div", { className: styles.formSection, children: [_jsx("h4", { children: "Position & Size" }), _jsxs("div", { className: styles.formRow, children: [_jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-arrows-alt-h" }), "X Position", _jsx("input", { type: "number", value: editingControl.x, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                x: parseInt(e.target.value) || 0
                                                                            }) })] }) }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-arrows-alt-v" }), "Y Position", _jsx("input", { type: "number", value: editingControl.y, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                y: parseInt(e.target.value) || 0
                                                                            }) })] }) }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-expand-arrows-alt" }), "Width", _jsx("input", { type: "number", value: editingControl.width, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                width: parseInt(e.target.value) || 50
                                                                            }) })] }) }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-arrows-alt-v" }), "Height", _jsx("input", { type: "number", value: editingControl.height, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                height: parseInt(e.target.value) || 50
                                                                            }) })] }) })] })] }), _jsxs("div", { className: styles.formSection, children: [_jsx("h4", { children: "Appearance" }), _jsx("div", { className: styles.formRow, children: _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-palette" }), "Color", _jsxs("div", { className: styles.colorInputWrapper, children: [_jsx("input", { type: "color", value: editingControl.color || '#4ecdc4', onChange: (e) => setEditingControl({
                                                                                    ...editingControl,
                                                                                    color: e.target.value
                                                                                }), className: styles.colorInput }), _jsx("span", { className: styles.colorValue, children: editingControl.color || '#4ecdc4' })] })] }) }) })] }), editingControl.type === 'fader' && editingControl.range && (_jsxs("div", { className: styles.formSection, children: [_jsx("h4", { children: "Fader Settings" }), _jsxs("div", { className: styles.formRow, children: [_jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-minus" }), "Minimum Value", _jsx("input", { type: "number", value: editingControl.range.min, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                range: {
                                                                                    ...editingControl.range,
                                                                                    min: parseInt(e.target.value) || 0
                                                                                }
                                                                            }) })] }) }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("i", { className: "fas fa-plus" }), "Maximum Value", _jsx("input", { type: "number", value: editingControl.range.max, onChange: (e) => setEditingControl({
                                                                                ...editingControl,
                                                                                range: {
                                                                                    ...editingControl.range,
                                                                                    max: parseInt(e.target.value) || 255
                                                                                }
                                                                            }) })] }) })] })] }))] }), _jsxs("div", { className: styles.modalFooter, children: [_jsxs("button", { type: "button", className: styles.cancelButton, onClick: () => setIsEditingControl(false), children: [_jsx("i", { className: "fas fa-times" }), "Cancel"] }), _jsxs("button", { type: "submit", className: styles.saveButton, children: [_jsx("i", { className: "fas fa-save" }), "Save Changes"] })] })] })] })] }))] }));
};
