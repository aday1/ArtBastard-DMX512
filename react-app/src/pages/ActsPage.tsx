import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from '../components/ui/LucideIcon';
import NodeBasedActEditor from '../components/acts/NodeBasedActEditor';
import styles from './ActsPage.module.scss';

interface Act {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  connections: any[];
  startNodeId?: string;
  isPlaying: boolean;
  currentNodeId?: string;
  playbackProgress: number;
  triggers: {
    osc?: {
      address: string;
      enabled: boolean;
    };
    midi?: {
      channel: number;
      note: number;
      enabled: boolean;
    };
  };
  createdAt: number;
  updatedAt: number;
}

const ActsPage: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useStore();
  
  const [acts, setActs] = useState<Act[]>([]);
  const [selectedAct, setSelectedAct] = useState<Act | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newActName, setNewActName] = useState('');
  const [newActDescription, setNewActDescription] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load acts from localStorage on mount
  useEffect(() => {
    const savedActs = localStorage.getItem('acts');
    if (savedActs) {
      try {
        setActs(JSON.parse(savedActs));
      } catch (error) {
        console.error('Failed to load acts:', error);
      }
    }
  }, []);

  // Save acts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('acts', JSON.stringify(acts));
  }, [acts]);

  const createAct = () => {
    if (!newActName.trim()) return;

    const newAct: Act = {
      id: `act_${Date.now()}`,
      name: newActName.trim(),
      description: newActDescription.trim() || undefined,
      nodes: [],
      connections: [],
      isPlaying: false,
      playbackProgress: 0,
      triggers: {
        osc: {
          address: `/act/${newActName.trim().toLowerCase().replace(/\s+/g, '_')}`,
          enabled: false
        },
        midi: {
          channel: 1,
          note: 60,
          enabled: false
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setActs(prev => [...prev, newAct]);
    setNewActName('');
    setNewActDescription('');
    setShowCreateForm(false);
    
    addNotification({
      message: `Act "${newAct.name}" created`,
      type: 'success'
    });
  };

  const editAct = (act: Act) => {
    setSelectedAct(act);
    setShowEditor(true);
  };

  const deleteAct = (act: Act) => {
    if (confirm(`Delete act "${act.name}"?`)) {
      setActs(prev => prev.filter(a => a.id !== act.id));
      
      if (selectedAct?.id === act.id) {
        setSelectedAct(null);
      }
      
      addNotification({
        message: `Act "${act.name}" deleted`,
        type: 'info'
      });
    }
  };

  const duplicateAct = (act: Act) => {
    const duplicatedAct: Act = {
      ...act,
      id: `act_${Date.now()}`,
      name: `${act.name} (Copy)`,
      isPlaying: false,
      currentNodeId: undefined,
      playbackProgress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setActs(prev => [...prev, duplicatedAct]);
    
    addNotification({
      message: `Act "${duplicatedAct.name}" created`,
      type: 'success'
    });
  };

  const saveAct = (updatedAct: Act) => {
    setActs(prev => prev.map(act => 
      act.id === updatedAct.id ? updatedAct : act
    ));
    
    if (selectedAct?.id === updatedAct.id) {
      setSelectedAct(updatedAct);
    }
  };

  const filteredAndSortedActs = acts
    .filter(act => 
      act.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updated':
          comparison = a.updatedAt - b.updatedAt;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getActStats = (act: Act) => {
    const sceneNodes = act.nodes.filter(n => n.type === 'scene').length;
    const trackerNodes = act.nodes.filter(n => n.type === 'tracker').length;
    const totalConnections = act.connections.length;
    
    return {
      sceneNodes,
      trackerNodes,
      totalConnections,
      totalNodes: act.nodes.length
    };
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h2>
            {theme === 'artsnob' && 'Theatrical Acts: Narrative Orchestration'}
            {theme === 'standard' && 'Acts & Scene Management'}
            {theme === 'minimal' && 'Acts'}
          </h2>
          <p>
            {theme === 'artsnob' && 'Craft complex lighting narratives with node-based act composition'}
            {theme === 'standard' && 'Create and manage complex lighting acts with scene tracking and automation'}
            {theme === 'minimal' && 'Lighting act management'}
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
          >
            <LucideIcon name="Plus" />
            New Act
          </button>
        </div>
      </div>

      <div className={styles.pageContent}>
        {/* Create Act Form */}
        {showCreateForm && (
          <div className={styles.createForm}>
            <div className={styles.formHeader}>
              <h3>Create New Act</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className={styles.closeFormButton}
              >
                <LucideIcon name="X" />
              </button>
            </div>
            
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label>Act Name</label>
                <input
                  type="text"
                  value={newActName}
                  onChange={(e) => setNewActName(e.target.value)}
                  placeholder="e.g., ACT 1 - Opening Sequence"
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description (Optional)</label>
                <textarea
                  value={newActDescription}
                  onChange={(e) => setNewActDescription(e.target.value)}
                  placeholder="Describe the act's purpose and lighting design..."
                  className={styles.formTextarea}
                  rows={3}
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  onClick={createAct}
                  disabled={!newActName.trim()}
                  className={styles.createConfirmButton}
                >
                  <LucideIcon name="Plus" />
                  Create Act
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={styles.createCancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <LucideIcon name="Search" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search acts..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.sortControls}>
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.sortSelect}
            >
              <option value="name">Name</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={styles.sortOrderButton}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <LucideIcon name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} />
            </button>
          </div>
        </div>

        {/* Acts Grid */}
        <div className={styles.actsGrid}>
          {filteredAndSortedActs.length === 0 ? (
            <div className={styles.emptyState}>
              <LucideIcon name="Workflow" className={styles.emptyIcon} />
              <h3>No Acts Found</h3>
              <p>
                {filterText 
                  ? 'No acts match your search criteria'
                  : 'Create your first act to get started with complex lighting sequences'
                }
              </p>
              {!filterText && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className={styles.emptyCreateButton}
                >
                  <LucideIcon name="Plus" />
                  Create Your First Act
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedActs.map(act => {
              const stats = getActStats(act);
              
              return (
                <div key={act.id} className={styles.actCard}>
                  <div className={styles.actHeader}>
                    <div className={styles.actInfo}>
                      <h3>{act.name}</h3>
                      {act.description && (
                        <p>{act.description}</p>
                      )}
                    </div>
                    
                    <div className={styles.actActions}>
                      <button
                        onClick={() => editAct(act)}
                        className={styles.editButton}
                        title="Edit Act"
                      >
                        <LucideIcon name="Edit" />
                      </button>
                      <button
                        onClick={() => duplicateAct(act)}
                        className={styles.duplicateButton}
                        title="Duplicate Act"
                      >
                        <LucideIcon name="Copy" />
                      </button>
                      <button
                        onClick={() => deleteAct(act)}
                        className={styles.deleteButton}
                        title="Delete Act"
                      >
                        <LucideIcon name="Trash2" />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.actStats}>
                    <div className={styles.statItem}>
                      <LucideIcon name="Film" />
                      <span>{stats.sceneNodes} scenes</span>
                    </div>
                    <div className={styles.statItem}>
                      <LucideIcon name="Zap" />
                      <span>{stats.trackerNodes} trackers</span>
                    </div>
                    <div className={styles.statItem}>
                      <LucideIcon name="Link" />
                      <span>{stats.totalConnections} connections</span>
                    </div>
                  </div>
                  
                  <div className={styles.actTriggers}>
                    {act.triggers.osc?.enabled && (
                      <div className={styles.triggerBadge}>
                        <LucideIcon name="Radio" />
                        <span>OSC: {act.triggers.osc.address}</span>
                      </div>
                    )}
                    {act.triggers.midi?.enabled && (
                      <div className={styles.triggerBadge}>
                        <LucideIcon name="Music" />
                        <span>MIDI: Ch{act.triggers.midi.channel} N{act.triggers.midi.note}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.actMeta}>
                    <span className={styles.actDate}>
                      Updated {new Date(act.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Node-Based Act Editor */}
      {showEditor && selectedAct && (
        <NodeBasedActEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedAct(null);
          }}
          act={selectedAct}
          onSave={saveAct}
        />
      )}
    </div>
  );
};

export default ActsPage;
