import React, { useState } from 'react';
import { COMPONENT_REGISTRY, ComponentDefinition, getAllCategories, getComponentsByCategory } from './ComponentRegistry';
import { usePanels } from '../../context/PanelContext';
import styles from './ComponentToolbar.module.scss';

interface DraggableComponentProps {
  definition: ComponentDefinition;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ definition }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(definition));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`${styles.draggableComponent} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={definition.description}
    >
      <div className={styles.componentIcon}>
        <i className={definition.icon}></i>
      </div>
      <div className={styles.componentInfo}>
        <div className={styles.componentTitle}>{definition.title}</div>
        <div className={styles.componentCategory}>{definition.category}</div>
      </div>
    </div>
  );
};

export const ComponentToolbar: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('dmx');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { saveLayout, loadLayout, getSavedLayouts, deleteLayout, resetLayout, loadBlankLayout } = usePanels();
  const [layoutName, setLayoutName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = getAllCategories();
  const savedLayouts = getSavedLayouts();

  // Priority order for components
  const priorityComponents = [
    'master-fader',
    'dmx-control-panel', 
    'dmx-channels',
    'dmx-visualizer',
    'scene-quick-launch',
    'chromatic-energy-manipulator'
  ];

  const getCategoryDisplayName = (category: string): string => {
    const names = {
      'dmx': 'DMX Controls',
      'scenes': 'Scene Control',
      'fixtures': 'Fixtures',
      'midi': 'MIDI',
      'osc': 'OSC',
      'audio': 'Audio',
      'setup': 'Setup'
    };
    return names[category as keyof typeof names] || category;
  };
  const getFilteredComponents = (): ComponentDefinition[] => {
    let components: ComponentDefinition[];
    
    if (selectedCategory === 'all') {
      components = Object.values(COMPONENT_REGISTRY);
    } else {
      components = getComponentsByCategory(selectedCategory as any);
    }

    // Sort components by priority for better UX
    return components.sort((a, b) => {
      const aIndex = priorityComponents.indexOf(a.type);
      const bIndex = priorityComponents.indexOf(b.type);
      
      // Priority components come first
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      }
      
      // Then sort alphabetically
      return a.title.localeCompare(b.title);
    });
  };

  const handleSaveLayout = () => {
    if (layoutName.trim()) {
      saveLayout(layoutName.trim());
      setLayoutName('');
      setShowSaveDialog(false);
    }
  };
  const handleLoadLayout = (name: string) => {
    loadLayout(name);
  };

  const handleDeleteLayout = (name: string) => {
    deleteLayout(name);
    setDeleteConfirm(null);
  };

  const handleLoadBlankLayout = () => {
    loadBlankLayout();
  };
  return (
    <div className={`${styles.componentToolbar} ${isCollapsed ? styles.collapsed : ''} ${isDocked ? styles.docked : ''} ${isMinimized ? styles.minimized : ''}`}>
      <div className={styles.toolbarHeader}>
        <h3 className={styles.toolbarTitle}>
          <i className="fas fa-toolbox"></i>
          {!isMinimized && 'Component Toolbar'}
        </h3>
        <div className={styles.toolbarControls}>
          <button
            className={styles.controlButton}
            onClick={() => setIsDocked(!isDocked)}
            title={isDocked ? 'Undock toolbar' : 'Dock toolbar'}
          >
            <i className={`fas fa-${isDocked ? 'expand-arrows-alt' : 'compress-arrows-alt'}`}></i>
          </button>
          <button
            className={styles.controlButton}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Restore toolbar' : 'Minimize toolbar'}
          >
            <i className={`fas fa-${isMinimized ? 'window-restore' : 'window-minimize'}`}></i>
          </button>
          <button
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
          >
            <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
          </button>
        </div>
      </div>

      {!isCollapsed && !isMinimized && (
        <div className={styles.toolbarContent}>
          {/* Layout Controls */}
          <div className={styles.layoutControls}>
            <div className={styles.controlGroup}>
              <button
                className={styles.controlButton}
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                title="Save current layout"
              >
                <i className="fas fa-save"></i>
                Save Layout
              </button>
              <button
                className={styles.controlButton}
                onClick={resetLayout}
                title="Reset to default layout"
              >
                <i className="fas fa-undo"></i>
                Reset
              </button>
            </div>

            {showSaveDialog && (
              <div className={styles.saveDialog}>
                <input
                  type="text"
                  placeholder="Layout name..."
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  className={styles.layoutNameInput}
                />
                <button
                  onClick={handleSaveLayout}
                  disabled={!layoutName.trim()}
                  className={styles.saveButton}
                >
                  Save
                </button>
              </div>
            )}            {(savedLayouts.length > 0 || true) && (
              <div className={styles.savedLayouts}>
                <label>Available Layouts:</label>
                <div className={styles.layoutList}>
                  {/* Blank Layout - always first */}
                  <div className={styles.layoutItem}>
                    <button
                      onClick={handleLoadBlankLayout}
                      className={`${styles.layoutButton} ${styles.blankLayoutButton}`}
                      title="Load blank layout"
                    >
                      <i className="fas fa-file"></i>
                      Blank Layout
                    </button>
                  </div>
                  
                  {/* Saved Layouts */}
                  {savedLayouts.map(name => (
                    <div key={name} className={styles.layoutItem}>
                      <button
                        onClick={() => handleLoadLayout(name)}
                        className={styles.layoutButton}
                        title={`Load ${name} layout`}
                      >
                        <i className="fas fa-folder-open"></i>
                        {name}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(name)}
                        className={styles.deleteButton}
                        title={`Delete ${name} layout`}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>                  ))}
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
              <div className={styles.deleteConfirmDialog}>
                <div className={styles.confirmContent}>
                  <p>Delete layout "{deleteConfirm}"?</p>
                  <div className={styles.confirmButtons}>
                    <button
                      onClick={() => handleDeleteLayout(deleteConfirm)}
                      className={styles.confirmDeleteButton}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className={styles.categoryFilter}>
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="all">All Components</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Component List */}
          <div className={styles.componentList}>
            <div className={styles.listHeader}>
              <span>Drag components to panels:</span>
            </div>
            <div className={styles.components}>
              {getFilteredComponents().map(definition => (
                <DraggableComponent
                  key={definition.type}
                  definition={definition}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentToolbar;
