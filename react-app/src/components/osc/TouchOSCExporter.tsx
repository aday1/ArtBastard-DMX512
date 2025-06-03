import React, { useState } from 'react';
import { useStore } from '../../store';
import { exportToToscFile, ExportOptions } from '../../utils/touchoscExporter'; // Import ExportOptions
import styles from './TouchOSCExporter.module.scss';

interface OSCPage {
  id: string;
  name: string;
  width: number;
  height: number;
  controls: OSCControl[];
}

interface OSCControl {
  id: string;
  type: 'fader' | 'button' | 'label';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  oscAddress: string;
  color?: string;
  range?: { min: number; max: number };
}

export const TouchOSCExporter: React.FC = () => {
  // Renaming placedFixtures to fixtureLayout for clarity as it's PlacedFixture[] from store
  // and fixtures to allFixtures for clarity as it's Fixture[] (definitions) from store.
  const { allFixtures, masterSliders, fixtureLayout } = useStore(state => ({
    allFixtures: state.fixtures, // Full definitions
    masterSliders: state.masterSliders,
    fixtureLayout: state.fixtureLayout, // Placed Fixture data
  }));
  const [pages, setPages] = useState<OSCPage[]>([
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
  const [editingControl, setEditingControl] = useState<OSCControl | null>(null);
  const [newControlType, setNewControlType] = useState<'fader' | 'button' | 'label'>('fader');
  const [canvasZoom, setCanvasZoom] = useState(0.5);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedControl, setDraggedControl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<ExportOptions['resolution']>('tablet_portrait'); // Add state for resolution

  const selectedPage = pages.find(p => p.id === selectedPageId);

  const addPage = () => {
    const newPageId = `page_${Date.now()}`;
    const newPage: OSCPage = {
      id: newPageId,
      name: `Page ${pages.length + 1}`,
      width: 1024,
      height: 768,
      controls: []
    };
    setPages([...pages, newPage]);
    setSelectedPageId(newPageId);
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) return; // Keep at least one page
    
    const updatedPages = pages.filter(p => p.id !== pageId);
    setPages(updatedPages);
    
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0].id);
    }
  };
  const updatePageName = (pageId: string, newName: string) => {
    setPages(pages.map(p => 
      p.id === pageId ? { ...p, name: newName } : p
    ));
  };

  const editPageName = (pageId: string) => {
    const newName = prompt('Enter new page name:', pages.find(p => p.id === pageId)?.name);
    if (newName && newName.trim()) {
      updatePageName(pageId, newName.trim());
    }
  };

  const addControl = (type: 'fader' | 'button' | 'label') => {
    if (!selectedPage) return;

    const newControl: OSCControl = {
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

    const updatedPages = pages.map(p =>
      p.id === selectedPageId
        ? { ...p, controls: [...p.controls, newControl] }
        : p
    );
    setPages(updatedPages);
  };

  const editControl = (control: OSCControl) => {
    setEditingControl(control);
    setIsEditingControl(true);
  };

  const updateControl = (updatedControl: OSCControl) => {
    const updatedPages = pages.map(p =>
      p.id === selectedPageId
        ? {
            ...p,
            controls: p.controls.map(c =>
              c.id === updatedControl.id ? updatedControl : c
            )
          }
        : p
    );
    setPages(updatedPages);
    setIsEditingControl(false);
    setEditingControl(null);
  };

  const deleteControl = (controlId: string) => {
    const updatedPages = pages.map(p =>
      p.id === selectedPageId
        ? { ...p, controls: p.controls.filter(c => c.id !== controlId) }
        : p
    );
    setPages(updatedPages);
  };

  const generateFromFixtures = () => {
    if (!selectedPage) return;

    const controls: OSCControl[] = [];
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
    fixtureLayout.forEach((fixture, fixtureIndex) => { // Renamed: placedFixtures -> fixtureLayout
      const fixtureData = allFixtures.find(f => f.id === fixture.fixtureId); // Renamed: fixtures -> allFixtures
      if (!fixtureData) return;

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

    const updatedPages = pages.map(p =>
      p.id === selectedPageId
        ? { ...p, controls }
        : p
    );
    setPages(updatedPages);
  };  const exportLayout = async () => {
    try {
      setIsExporting(true);
      const options: ExportOptions = { // Use ExportOptions type
        resolution: selectedResolution, // Use state here
        includeFixtureControls: true, // These can be made configurable later
        includeMasterSliders: true,
        includeAllDmxChannels: false // This can be made configurable later
      };
      
      // Corrected arguments order: options, fixtureLayout (as placedFixtures), allFixtures, masterSliders
      await exportToToscFile(options, fixtureLayout, allFixtures, masterSliders, 'ArtBastardOSC.tosc');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleControlDrag = (controlId: string, x: number, y: number) => {
    const updatedPages = pages.map(p =>
      p.id === selectedPageId
        ? {
            ...p,
            controls: p.controls.map(c =>
              c.id === controlId ? { ...c, x, y } : c
            )
          }
        : p
    );
    setPages(updatedPages);
  };

  const duplicateControl = (control: OSCControl) => {
    const newControl: OSCControl = {
      ...control,
      id: `control_${Date.now()}`,
      name: `${control.name}_copy`,
      x: control.x + 20,
      y: control.y + 20
    };

    const updatedPages = pages.map(p =>
      p.id === selectedPageId
        ? { ...p, controls: [...p.controls, newControl] }
        : p
    );
    setPages(updatedPages);
  };
  return (
    <div className={styles.touchOSCExporter}>
      {/* Modern Header with Gradient */}
      <div className={styles.modernHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.iconContainer}>
              <i className="fas fa-mobile-alt"></i>
            </div>
            <div className={styles.titleText}>
              <h1>TouchOSC Designer</h1>
              <p>Create beautiful, responsive OSC interfaces</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.previewButton} ${previewMode ? styles.active : ''}`}
              onClick={() => setPreviewMode(!previewMode)}
            >
              <i className={previewMode ? "fas fa-edit" : "fas fa-eye"}></i>
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            {/* Resolution Selector */}
            <div className={styles.resolutionSelector}>
              <label htmlFor="resolutionSelect">Resolution:</label>
              <select
                id="resolutionSelect"
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value as ExportOptions['resolution'])}
                className={styles.selectDropdown}
              >
                <option value="phone_portrait">Phone Portrait (720x1280)</option>
                <option value="tablet_portrait">Tablet Portrait (1024x1366)</option>
                <option value="ipad_pro_2019_portrait">iPad Pro 2019 Portrait (1668x2420)</option>
                <option value="ipad_pro_2019_landscape">iPad Pro 2019 Landscape (2420x1668)</option>
                <option value="samsung_s21_specified_portrait">Samsung S21 Portrait (1668x2420 - Specified)</option>
                <option value="samsung_s21_specified_landscape">Samsung S21 Landscape (2420x1668 - Specified)</option>
              </select>
            </div>
            <button 
              className={styles.exportButton} 
              onClick={exportLayout}
              disabled={isExporting}
            >
              <i className={isExporting ? "fas fa-spinner fa-spin" : "fas fa-download"}></i>
              {isExporting ? 'Exporting...' : 'Export Layout'}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar & Main Content Layout */}
      <div className={styles.editorLayout}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          {/* Page Management */}
          <div className={styles.sidebarSection}>
            <h3><i className="fas fa-layer-group"></i> Pages</h3>
            <div className={styles.pageList}>
              {pages.map(page => (
                <div 
                  key={page.id} 
                  className={`${styles.pageItem} ${selectedPageId === page.id ? styles.active : ''}`}
                >
                  <button
                    className={styles.pageSelectButton}
                    onClick={() => setSelectedPageId(page.id)}
                  >
                    <i className="fas fa-file-alt"></i>
                    <span>{page.name}</span>
                    <span className={styles.controlCount}>{page.controls.length}</span>
                  </button>
                  <div className={styles.pageActions}>
                    <button 
                      className={styles.iconButton}
                      onClick={() => editPageName(page.id)}
                      title="Rename"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    {pages.length > 1 && (
                      <button
                        className={`${styles.iconButton} ${styles.danger}`}
                        onClick={() => deletePage(page.id)}
                        title="Delete Page"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button className={styles.addPageButton} onClick={addPage}>
                <i className="fas fa-plus"></i>
                Add New Page
              </button>
            </div>
          </div>

          {/* Control Tools */}
          {!previewMode && (
            <div className={styles.sidebarSection}>
              <h3><i className="fas fa-tools"></i> Add Controls</h3>
              <div className={styles.controlToolbox}>
                <button 
                  className={styles.toolButton}
                  onClick={() => addControl('fader')}
                >
                  <i className="fas fa-sliders-h"></i>
                  <span>Fader</span>
                </button>
                <button 
                  className={styles.toolButton}
                  onClick={() => addControl('button')}
                >
                  <i className="fas fa-hand-pointer"></i>
                  <span>Button</span>
                </button>
                <button 
                  className={styles.toolButton}
                  onClick={() => addControl('label')}
                >
                  <i className="fas fa-tag"></i>
                  <span>Label</span>
                </button>
              </div>
              <button 
                className={styles.generateButton}
                onClick={generateFromFixtures}
              >
                <i className="fas fa-magic"></i>
                Auto-Generate from Fixtures
              </button>
            </div>
          )}

          {/* Canvas Controls */}
          <div className={styles.sidebarSection}>
            <h3><i className="fas fa-search"></i> Canvas</h3>
            <div className={styles.canvasControls}>
              <label>
                Zoom: {Math.round(canvasZoom * 100)}%
                <input
                  type="range"
                  min="0.25"
                  max="2"
                  step="0.25"
                  value={canvasZoom}
                  onChange={(e) => setCanvasZoom(parseFloat(e.target.value))}
                  className={styles.zoomSlider}
                />
              </label>
              <button 
                className={styles.fitButton}
                onClick={() => setCanvasZoom(0.5)}
              >
                <i className="fas fa-expand-arrows-alt"></i>
                Fit to View
              </button>
            </div>
          </div>

          {/* Page Info */}
          {selectedPage && (
            <div className={styles.sidebarSection}>
              <h3><i className="fas fa-info-circle"></i> Page Info</h3>
              <div className={styles.pageStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Resolution:</span>
                  <span className={styles.statValue}>{selectedPage.width} × {selectedPage.height}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Controls:</span>
                  <span className={styles.statValue}>{selectedPage.controls.length}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Page ID:</span>
                  <span className={styles.statValue}>{selectedPage.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className={styles.mainCanvas}>
          <div className={styles.canvasHeader}>
            <div className={styles.canvasTitle}>
              <h2>{selectedPage?.name || 'No Page Selected'}</h2>
              <span className={styles.canvasSubtitle}>
                Design your TouchOSC interface
              </span>
            </div>
            <div className={styles.canvasToolbar}>
              <button className={styles.toolbarButton} title="Grid Snap">
                <i className="fas fa-th"></i>
              </button>
              <button className={styles.toolbarButton} title="Align Left">
                <i className="fas fa-align-left"></i>
              </button>
              <button className={styles.toolbarButton} title="Align Center">
                <i className="fas fa-align-center"></i>
              </button>
              <button className={styles.toolbarButton} title="Align Right">
                <i className="fas fa-align-right"></i>
              </button>
            </div>
          </div>

          {selectedPage && (
            <div className={styles.canvasContainer}>
              <div className={styles.canvasWrapper}>
                <div 
                  className={`${styles.deviceCanvas} ${previewMode ? styles.previewMode : ''}`}
                  style={{ 
                    width: `${selectedPage.width * canvasZoom}px`, 
                    height: `${selectedPage.height * canvasZoom}px`,
                    transform: `scale(${canvasZoom})`
                  }}
                >
                  <div className={styles.deviceScreen}>
                    {selectedPage.controls.map(control => (
                      <div
                        key={control.id}
                        className={`${styles.oscControl} ${styles[control.type]} ${draggedControl === control.id ? styles.dragging : ''}`}
                        style={{
                          left: `${control.x}px`,
                          top: `${control.y}px`,
                          width: `${control.width}px`,
                          height: `${control.height}px`,
                          backgroundColor: control.color || '#4ecdc4'
                        }}
                        onClick={() => !previewMode && editControl(control)}
                        onMouseDown={() => setDraggedControl(control.id)}
                      >
                        <div className={styles.controlContent}>
                          <span className={styles.controlName}>{control.name}</span>
                          <span className={styles.controlAddress}>{control.oscAddress}</span>
                          {control.type === 'fader' && <div className={styles.faderTrack}></div>}
                          {control.type === 'button' && <div className={styles.buttonGlow}></div>}
                        </div>
                        
                        {!previewMode && (
                          <div className={styles.controlActions}>
                            <button 
                              className={styles.controlAction}
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateControl(control);
                              }}
                              title="Duplicate"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                            <button 
                              className={`${styles.controlAction} ${styles.danger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteControl(control.id);
                              }}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {!previewMode && selectedPage.controls.length === 0 && (
                      <div className={styles.emptyCanvas}>
                        <div className={styles.emptyContent}>
                          <i className="fas fa-mobile-alt"></i>
                          <h3>Empty Canvas</h3>
                          <p>Add controls from the sidebar to get started</p>
                          <button onClick={generateFromFixtures} className={styles.quickStartButton}>
                            <i className="fas fa-magic"></i>
                            Quick Start: Generate from Fixtures
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>      {/* Modern Edit Modal */}
      {isEditingControl && editingControl && (
        <div className={styles.modernModal}>
          <div className={styles.modalBackdrop} onClick={() => setIsEditingControl(false)}></div>
          <div className={styles.modernModalContent}>
            <div className={styles.modalHeader}>
              <h2>
                <i className={`fas ${editingControl.type === 'fader' ? 'fa-sliders-h' : editingControl.type === 'button' ? 'fa-hand-pointer' : 'fa-tag'}`}></i>
                Edit {editingControl.type.charAt(0).toUpperCase() + editingControl.type.slice(1)} Control
              </h2>
              <button 
                className={styles.closeButton}
                onClick={() => setIsEditingControl(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              updateControl(editingControl);
            }}>
              <div className={styles.modalBody}>
                <div className={styles.formSection}>
                  <h4>Basic Properties</h4>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-tag"></i>
                        Control Name
                        <input
                          type="text"
                          value={editingControl.name}
                          onChange={(e) => setEditingControl({
                            ...editingControl,
                            name: e.target.value
                          })}
                          placeholder="Enter control name"
                        />
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-satellite-dish"></i>
                        OSC Address
                        <input
                          type="text"
                          value={editingControl.oscAddress}
                          onChange={(e) => setEditingControl({
                            ...editingControl,
                            oscAddress: e.target.value
                          })}
                          placeholder="/control/path"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4>Position & Size</h4>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-arrows-alt-h"></i>
                        X Position
                        <input
                          type="number"
                          value={editingControl.x}
                          onChange={(e) => setEditingControl({
                            ...editingControl,
                            x: parseInt(e.target.value) || 0
                          })}
                        />
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-arrows-alt-v"></i>
                        Y Position
                        <input
                          type="number"
                          value={editingControl.y}
                          onChange={(e) => setEditingControl({
                            ...editingControl,
                            y: parseInt(e.target.value) || 0
                          })}
                        />
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-expand-arrows-alt"></i>
                        Width
                        <input
                          type="number"
                          value={editingControl.width}
                          onChange={(e) => setEditingControl({
                            ...editingControl,
                            width: parseInt(e.target.value) || 50
                          })}
                        />
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-arrows-alt-v"></i>
                        Height
                        <input
                          type="number"
                          value={editingControl.height}
                          onChange={(e) => setEditingControl({
                            ...editingControl,
                            height: parseInt(e.target.value) || 50
                          })}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4>Appearance</h4>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        <i className="fas fa-palette"></i>
                        Color
                        <div className={styles.colorInputWrapper}>
                          <input
                            type="color"
                            value={editingControl.color || '#4ecdc4'}
                            onChange={(e) => setEditingControl({
                              ...editingControl,
                              color: e.target.value
                            })}
                            className={styles.colorInput}
                          />
                          <span className={styles.colorValue}>
                            {editingControl.color || '#4ecdc4'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {editingControl.type === 'fader' && editingControl.range && (
                  <div className={styles.formSection}>
                    <h4>Fader Settings</h4>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>
                          <i className="fas fa-minus"></i>
                          Minimum Value
                          <input
                            type="number"
                            value={editingControl.range.min}
                            onChange={(e) => setEditingControl({
                              ...editingControl,
                              range: {
                                ...editingControl.range!,
                                min: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </label>
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          <i className="fas fa-plus"></i>
                          Maximum Value
                          <input
                            type="number"
                            value={editingControl.range.max}
                            onChange={(e) => setEditingControl({
                              ...editingControl,
                              range: {
                                ...editingControl.range!,
                                max: parseInt(e.target.value) || 255
                              }
                            })}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelButton} onClick={() => setIsEditingControl(false)}>
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  <i className="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
