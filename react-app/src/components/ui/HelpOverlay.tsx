import React, { useState, useEffect, useRef } from 'react';
import { useDocking } from '@/context/DockingContext';
import styles from './HelpOverlay.module.scss';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

type HelpTab = 'overview' | 'grid-controls' | 'keyboard' | 'components' | 'tutorial' | 'troubleshooting' | 'settings';

export const HelpOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<HelpTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    state, 
    setGridSize, 
    setGridSnappingEnabled, 
    setShowGrid,
    snapToGrid,
    snapPositionToGrid 
  } = useDocking();

  // Tutorial steps
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ArtBastard DMX512',
      description: 'This tutorial will guide you through the Grid & Docking System features.',
    },
    {
      id: 'grid-basics',
      title: 'Grid System Basics',
      description: 'The grid system helps you align components precisely. You can see the current grid size and snapping status in the controls.',
      target: '[data-tutorial="grid-controls"]',
    },
    {
      id: 'dragging',
      title: 'Dragging Components',
      description: 'Try dragging any component by its title bar. Components will snap to the grid if snapping is enabled.',
      target: '[data-tutorial="dockable-component"]',
    },
    {
      id: 'docking',
      title: 'Docking Zones',
      description: 'Drag components to the edges of the screen to dock them in specific zones.',
      target: '[data-tutorial="dock-zones"]',
    },
    {
      id: 'keyboard',
      title: 'Keyboard Shortcuts',
      description: 'Use keyboard shortcuts for quick access to grid functions.',
    },
  ];

  // Export/Import settings
  const exportSettings = () => {
    const settings = {
      gridSize: state.gridSize,
      gridSnappingEnabled: state.gridSnappingEnabled,
      showGrid: state.showGrid,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'artbastard-grid-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.gridSize) setGridSize(settings.gridSize);
        if (typeof settings.gridSnappingEnabled === 'boolean') setGridSnappingEnabled(settings.gridSnappingEnabled);
        if (typeof settings.showGrid === 'boolean') setShowGrid(settings.showGrid);
      } catch (error) {
        alert('Invalid settings file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Tutorial management
  const startTutorial = () => {
    setTutorialStep(0);
    setActiveTab('tutorial');
  };

  const nextTutorialStep = () => {
    if (tutorialStep !== null && tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      endTutorial();
    }
  };

  const endTutorial = () => {
    setTutorialStep(null);
    setHighlightedElement(null);
  };

  // Search functionality
  const filteredContent = (content: string) => {
    if (!searchQuery) return content;
    return content.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'h':
          case 'H':
            e.preventDefault();
            setIsVisible(!isVisible);
            break;
          case '/':
            e.preventDefault();
            if (isVisible && searchInputRef.current) {
              searchInputRef.current.focus();
            }
            break;
          case 'Escape':
            if (isVisible) {
              e.preventDefault();
              setIsVisible(false);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const tabs: Array<{id: HelpTab, label: string, icon: string}> = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'grid-controls', label: 'Grid Controls', icon: '⚙️' },
    { id: 'keyboard', label: 'Shortcuts', icon: '⌨️' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'tutorial', label: 'Tutorial', icon: '🎓' },
    { id: 'troubleshooting', label: 'Help', icon: '🔧' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderGridControls = () => (
    <div className={styles.gridControls} data-tutorial="grid-controls">
      <div className={styles.controlGroup}>
        <label htmlFor="gridSize">Grid Size: {state.gridSize}px</label>
        <input
          id="gridSize"
          type="range"
          min="20"
          max="200"
          value={state.gridSize}
          onChange={(e) => setGridSize(parseInt(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderTicks}>
          <span>20px</span>
          <span>100px</span>
          <span>200px</span>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={state.gridSnappingEnabled}
              onChange={(e) => setGridSnappingEnabled(e.target.checked)}
            />
            <span className={styles.toggleLabel}>Grid Snapping</span>
          </label>
          <div className={styles.toggleDescription}>
            Automatically snap components to grid intersections
          </div>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={state.showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            <span className={styles.toggleLabel}>Show Grid</span>
          </label>
          <div className={styles.toggleDescription}>
            Display grid lines permanently (also shown during dragging)
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <button onClick={() => setGridSize(50)} className={styles.quickButton}>
          Fine Grid (50px)
        </button>
        <button onClick={() => setGridSize(100)} className={styles.quickButton}>
          Medium Grid (100px)
        </button>
        <button onClick={() => setGridSize(150)} className={styles.quickButton}>
          Coarse Grid (150px)
        </button>
      </div>

      <div className={styles.statusPanel}>
        <h5>Current Status</h5>
        <div className={styles.statusItem}>
          <span>Grid Size:</span>
          <span className={styles.statusValue}>{state.gridSize}px</span>
        </div>
        <div className={styles.statusItem}>
          <span>Snapping:</span>
          <span className={`${styles.statusValue} ${state.gridSnappingEnabled ? styles.enabled : styles.disabled}`}>
            {state.gridSnappingEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span>Grid Visible:</span>
          <span className={`${styles.statusValue} ${state.showGrid ? styles.enabled : styles.disabled}`}>
            {state.showGrid ? 'YES' : 'NO'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className={styles.tabContent}>
            <div className={styles.welcomeSection}>
              <h4>🎯 Welcome to the Grid & Docking System</h4>
              <p>
                The ArtBastard DMX512 application features a powerful grid and docking system 
                that helps you organize and align your interface components with precision.
              </p>
              
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>📐</div>
                  <h5>Precision Grid</h5>
                  <p>Customizable grid system with 20-200px spacing for perfect alignment</p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🧲</div>
                  <h5>Smart Snapping</h5>
                  <p>Intelligent snapping within 30% of grid intersections</p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🎯</div>
                  <h5>Dock Zones</h5>
                  <p>Predefined docking zones at screen edges and corners</p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>⌨️</div>
                  <h5>Shortcuts</h5>
                  <p>Keyboard shortcuts for rapid grid manipulation</p>
                </div>
              </div>

              <div className={styles.quickStart}>
                <h5>🚀 Quick Start</h5>
                <ol>
                  <li>Press <kbd>Ctrl + G</kbd> to toggle grid visibility</li>
                  <li>Press <kbd>Ctrl + S</kbd> to enable/disable snapping</li>
                  <li>Drag any component by its title bar</li>
                  <li>Watch components snap to grid intersections</li>
                  <li>Drag to screen edges to dock components</li>
                </ol>
                <button onClick={startTutorial} className={styles.tutorialButton}>
                  Start Interactive Tutorial
                </button>
              </div>
            </div>
          </div>
        );

      case 'grid-controls':
        return (
          <div className={styles.tabContent}>
            <h4>⚙️ Advanced Grid Controls</h4>
            {renderGridControls()}
          </div>
        );

      case 'keyboard':
        return (
          <div className={styles.tabContent}>
            <h4>⌨️ Keyboard Shortcuts</h4>
            
            <div className={styles.shortcutSection}>
              <h5>Grid Controls</h5>
              <div className={styles.shortcutList}>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl + G</kbd>
                  <span>Toggle grid visibility</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl + S</kbd>
                  <span>Toggle grid snapping</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl + +</kbd>
                  <span>Increase grid size (up to 200px)</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl + -</kbd>
                  <span>Decrease grid size (down to 20px)</span>
                </div>
              </div>
            </div>

            <div className={styles.shortcutSection}>
              <h5>Help System</h5>
              <div className={styles.shortcutList}>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl + H</kbd>
                  <span>Toggle help overlay</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl + /</kbd>
                  <span>Focus search field</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Esc</kbd>
                  <span>Close help overlay</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Tab</kbd>
                  <span>Navigate between help tabs</span>
                </div>
              </div>
            </div>

            <div className={styles.shortcutSection}>
              <h5>Component Controls</h5>
              <div className={styles.shortcutList}>
                <div className={styles.shortcutItem}>
                  <kbd>Double Click</kbd>
                  <span>Minimize/Maximize component</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Drag Title Bar</kbd>
                  <span>Move component</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Drag to Edge</kbd>
                  <span>Dock component to zone</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'components':
        return (
          <div className={styles.tabContent}>
            <h4>🧩 Component Reference</h4>
            
            <div className={styles.componentSection}>
              <h5>Available Components</h5>
              
              <div className={styles.componentCard}>
                <h6>🎛️ Master Fader</h6>
                <p>Controls global DMX output level with fade options</p>
                <ul>
                  <li><strong>Default Position:</strong> Bottom Center</li>
                  <li><strong>Features:</strong> MIDI Learn, Blackout, Full On</li>
                  <li><strong>Shortcuts:</strong> Minimizable, Dockable</li>
                </ul>
              </div>

              <div className={styles.componentCard}>
                <h6>🎹 MIDI Monitor</h6>
                <p>Real-time MIDI message monitoring and debugging</p>
                <ul>
                  <li><strong>Default Position:</strong> Top Right</li>
                  <li><strong>Features:</strong> Message filtering, Clear history</li>
                  <li><strong>Data:</strong> Note On/Off, CC messages, timestamps</li>
                </ul>
              </div>

              <div className={styles.componentCard}>
                <h6>📡 OSC Monitor</h6>
                <p>Open Sound Control message monitoring</p>
                <ul>
                  <li><strong>Default Position:</strong> Top Right</li>
                  <li><strong>Features:</strong> Address filtering, Value display</li>
                  <li><strong>Data:</strong> OSC addresses, values, timestamps</li>
                </ul>
              </div>

              <div className={styles.componentCard}>
                <h6>💡 DMX Channel Grid</h6>
                <p>Visual grid of all 512 DMX channels</p>
                <ul>
                  <li><strong>Default Position:</strong> Floating</li>
                  <li><strong>Features:</strong> Channel selection, Value display</li>
                  <li><strong>Controls:</strong> Click to select, scroll to navigate</li>
                </ul>
              </div>

              <div className={styles.componentCard}>
                <h6>🎨 Chromatic Energy Manipulator</h6>
                <p>Advanced color and energy manipulation controls</p>
                <ul>
                  <li><strong>Default Position:</strong> Middle Left</li>
                  <li><strong>Features:</strong> Color picking, Energy levels</li>
                  <li><strong>Controls:</strong> Multi-parameter adjustment</li>
                </ul>
              </div>
            </div>

            <div className={styles.dockingZones}>
              <h5>🎯 Docking Zones</h5>
              <div className={styles.zoneGrid}>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Top Left</span>
                  <span className={styles.zoneSize}>200×150px</span>
                </div>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Top Center</span>
                  <span className={styles.zoneSize}>300×100px</span>
                </div>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Top Right</span>
                  <span className={styles.zoneSize}>200×150px</span>
                </div>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Left Center</span>
                  <span className={styles.zoneSize}>150×200px</span>
                </div>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Right Center</span>
                  <span className={styles.zoneSize}>150×200px</span>
                </div>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Bottom Left</span>
                  <span className={styles.zoneSize}>200×150px</span>
                </div>
                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Bottom Center</span>
                  <span className={styles.zoneSize}>300×100px</span>
                </div>                <div className={styles.zoneItem}>
                  <span className={styles.zoneName}>Bottom Right</span>
                  <span className={styles.zoneSize}>200×150px</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tutorial':
        return (
          <div className={styles.tabContent}>
            <h4>🎓 Interactive Tutorial</h4>
            
            {tutorialStep !== null ? (
              <div className={styles.tutorialActive}>
                <div className={styles.tutorialProgress}>
                  <div 
                    className={styles.progressBar}
                    style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }}
                  />
                  <span>Step {tutorialStep + 1} of {tutorialSteps.length}</span>
                </div>

                <div className={styles.tutorialStep}>
                  <h5>{tutorialSteps[tutorialStep].title}</h5>
                  <p>{tutorialSteps[tutorialStep].description}</p>
                  
                  <div className={styles.tutorialControls}>
                    <button onClick={endTutorial} className={styles.skipButton}>
                      Skip Tutorial
                    </button>
                    <button onClick={nextTutorialStep} className={styles.nextButton}>
                      {tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.tutorialStart}>
                <div className={styles.tutorialIntro}>
                  <h5>Learn the Grid & Docking System</h5>
                  <p>
                    This interactive tutorial will guide you through all the features of the 
                    grid and docking system, helping you become proficient with component 
                    management and layout organization.
                  </p>
                  
                  <div className={styles.tutorialFeatures}>
                    <div className={styles.tutorialFeature}>
                      <span className={styles.featureIcon}>📐</span>
                      <span>Grid system basics</span>
                    </div>
                    <div className={styles.tutorialFeature}>
                      <span className={styles.featureIcon}>🖱️</span>
                      <span>Dragging and positioning</span>
                    </div>
                    <div className={styles.tutorialFeature}>
                      <span className={styles.featureIcon}>🎯</span>
                      <span>Docking zones</span>
                    </div>
                    <div className={styles.tutorialFeature}>
                      <span className={styles.featureIcon}>⌨️</span>
                      <span>Keyboard shortcuts</span>
                    </div>
                  </div>
                </div>
                
                <button onClick={startTutorial} className={styles.startTutorialButton}>
                  Start Tutorial
                </button>
              </div>
            )}
          </div>
        );

      case 'troubleshooting':
        return (
          <div className={styles.tabContent}>
            <h4>🔧 Troubleshooting & FAQ</h4>
            
            <div className={styles.troubleshootingSection}>
              <h5>🚨 Common Issues</h5>
              
              <div className={styles.troubleshootingItem}>
                <h6>Components won't snap to grid</h6>
                <p><strong>Solution:</strong> Check that grid snapping is enabled (Ctrl+S) and you're dragging close enough to grid intersections (within 30% of grid size).</p>
              </div>

              <div className={styles.troubleshootingItem}>
                <h6>Grid is not visible</h6>
                <p><strong>Solution:</strong> Press Ctrl+G to toggle grid visibility, or enable it in the Grid Controls tab. Grid also appears temporarily during dragging.</p>
              </div>

              <div className={styles.troubleshootingItem}>
                <h6>Components disappear off screen</h6>
                <p><strong>Solution:</strong> Components are constrained to keep at least 30% visible. Try refreshing the page to reset positions, or use dock zones to reposition.</p>
              </div>

              <div className={styles.troubleshootingItem}>
                <h6>Docking zones don't appear</h6>
                <p><strong>Solution:</strong> Dock zones only appear while dragging components. Start dragging a component by its title bar to see the zones.</p>
              </div>

              <div className={styles.troubleshootingItem}>
                <h6>Keyboard shortcuts not working</h6>
                <p><strong>Solution:</strong> Ensure the browser window has focus and no other input fields are active. Some shortcuts require Ctrl key.</p>
              </div>
            </div>

            <div className={styles.troubleshootingSection}>
              <h5>💡 Tips & Best Practices</h5>
              
              <div className={styles.tipsList}>
                <div className={styles.tip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span>Use medium grid size (100px) for most layout tasks</span>
                </div>
                <div className={styles.tip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span>Enable grid snapping for precise alignment</span>
                </div>
                <div className={styles.tip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span>Use corner dock zones for permanent component placement</span>
                </div>
                <div className={styles.tip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span>Minimize components when not in use to save screen space</span>
                </div>
                <div className={styles.tip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span>Use the floating zone for temporary component positioning</span>
                </div>
              </div>
            </div>

            <div className={styles.troubleshootingSection}>
              <h5>📊 System Information</h5>
              <div className={styles.systemInfo}>
                <div className={styles.infoItem}>
                  <span>Grid Size Range:</span>
                  <span>20px - 200px</span>
                </div>
                <div className={styles.infoItem}>
                  <span>Snap Threshold:</span>
                  <span>30% of grid size</span>
                </div>
                <div className={styles.infoItem}>
                  <span>Dock Zone Threshold:</span>
                  <span>100px from edge</span>
                </div>
                <div className={styles.infoItem}>
                  <span>Available Zones:</span>
                  <span>8 dock zones + floating</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className={styles.tabContent}>
            <h4>⚙️ Settings & Configuration</h4>
            
            <div className={styles.settingsSection}>
              <h5>💾 Export/Import Settings</h5>
              <p>Save your grid configuration or load previously saved settings.</p>
              
              <div className={styles.settingsActions}>
                <button onClick={exportSettings} className={styles.exportButton}>
                  📤 Export Settings
                </button>
                <label className={styles.importButton}>
                  📥 Import Settings
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h5>🔄 Reset Options</h5>
              <p>Reset various aspects of the grid and docking system.</p>
              
              <div className={styles.resetActions}>
                <button 
                  onClick={() => {
                    setGridSize(100);
                    setGridSnappingEnabled(true);
                    setShowGrid(false);
                  }}
                  className={styles.resetButton}
                >
                  Reset Grid Settings
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('docking-grid-size');
                    localStorage.removeItem('docking-grid-snapping');
                    localStorage.removeItem('docking-show-grid');
                  }}
                  className={styles.clearButton}
                >
                  Clear Saved Settings
                </button>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h5>📈 Performance</h5>
              <p>Current performance and system status.</p>
              
              <div className={styles.performanceInfo}>
                <div className={styles.performanceItem}>
                  <span>Active Components:</span>
                  <span>{Object.keys(state.components).length}</span>
                </div>
                <div className={styles.performanceItem}>
                  <span>Grid Calculations:</span>
                  <span>{state.gridSnappingEnabled ? 'Active' : 'Disabled'}</span>
                </div>
                <div className={styles.performanceItem}>
                  <span>Drag State:</span>
                  <span>{state.isDragging ? 'Active' : 'Idle'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <>
      {/* Help trigger button */}
      <button
        className={styles.helpButton}
        onClick={() => setIsVisible(!isVisible)}
        title="Show Grid & Docking System Help (Ctrl+H)"
      >
        <i className="fas fa-question-circle"></i>
      </button>

      {/* Help overlay */}
      {isVisible && (
        <div className={styles.helpOverlay} onClick={(e) => e.target === e.currentTarget && setIsVisible(false)}>
          <div className={styles.helpContent}>
            <div className={styles.helpHeader}>
              <div className={styles.headerLeft}>
                <h3>🎯 Grid & Docking System Help</h3>
                <div className={styles.searchContainer}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search help content... (Ctrl+/)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  <i className="fas fa-search"></i>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className={styles.closeButton}
                title="Close Help (Esc)"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.helpTabs}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.helpBody}>
              {renderTabContent()}
            </div>

            <div className={styles.helpFooter}>
              <div className={styles.footerInfo}>
                <span>💡 Press <kbd>Ctrl+H</kbd> to toggle this help anytime</span>
              </div>
              <div className={styles.footerActions}>
                <button onClick={startTutorial} className={styles.tutorialShortcut}>
                  🎓 Start Tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
