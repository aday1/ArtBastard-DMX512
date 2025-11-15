import React, { useState } from 'react';
import { useStore, FixtureTemplate } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { LucideIcon } from '../ui/LucideIcon';
import styles from './FixtureTemplateManager.module.scss';

interface FixtureTemplateManagerProps {
  onClose: () => void;
  onSelectTemplate?: (template: FixtureTemplate) => void;
}

const channelTypes = [
  { value: 'dimmer', label: 'Dimmer/Intensity' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'white', label: 'White' },
  { value: 'amber', label: 'Amber' },
  { value: 'uv', label: 'UV' },
  { value: 'pan', label: 'Pan' },
  { value: 'pan_fine', label: 'Pan Fine' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'tilt_fine', label: 'Tilt Fine' },
  { value: 'shutter', label: 'Shutter' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'focus', label: 'Focus' },
  { value: 'color_wheel', label: 'Color Wheel' },
  { value: 'gobo_wheel', label: 'Gobo Wheel' },
  { value: 'gobo_rotation', label: 'Gobo Rotation' },
  { value: 'prism', label: 'Prism' },
  { value: 'iris', label: 'Iris' },
  { value: 'macro', label: 'Macro' },
  { value: 'reset', label: 'Reset' },
  { value: 'speed', label: 'Speed' },
  { value: 'sound', label: 'Sound' },
  { value: 'strobe', label: 'Strobe' },
  { value: 'effect', label: 'Effect' },
  { value: 'other', label: 'Other' }
];

export const FixtureTemplateManager: React.FC<FixtureTemplateManagerProps> = ({ onClose, onSelectTemplate }) => {
  const { theme } = useTheme();
  const {
    fixtureTemplates,
    addFixtureTemplate,
    updateFixtureTemplate,
    deleteFixtureTemplate,
    addNotification
  } = useStore(state => ({
    fixtureTemplates: state.fixtureTemplates,
    addFixtureTemplate: state.addFixtureTemplate,
    updateFixtureTemplate: state.updateFixtureTemplate,
    deleteFixtureTemplate: state.deleteFixtureTemplate,
    addNotification: state.addNotification
  }));

  const [editingTemplate, setEditingTemplate] = useState<FixtureTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Omit<FixtureTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    templateName: '',
    defaultNamePrefix: '',
    channels: [{ name: 'Channel 1', type: 'other' }],
    isBuiltIn: false,
    isCustom: true
  });

  const handleStartEdit = (template: FixtureTemplate) => {
    // Allow editing both built-in and custom templates
    // Built-in templates will be saved as custom templates when saved
    setTemplateForm({
      templateName: template.templateName,
      defaultNamePrefix: template.defaultNamePrefix,
      channels: JSON.parse(JSON.stringify(template.channels)),
      isBuiltIn: false,
      isCustom: true
    });
    setEditingTemplate(template);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.templateName || !templateForm.defaultNamePrefix || templateForm.channels.length === 0) {
      addNotification({
        message: 'Please fill in all required fields',
        type: 'warning',
        priority: 'normal'
      });
      return;
    }

    if (editingTemplate) {
      if (editingTemplate.isBuiltIn) {
        // If editing a built-in template, check if a custom version already exists
        const existingCustom = fixtureTemplates.find(
          t => !t.isBuiltIn && 
          t.templateName === templateForm.templateName &&
          t.defaultNamePrefix === templateForm.defaultNamePrefix
        );
        
        if (existingCustom) {
          // Update existing custom template
          updateFixtureTemplate(existingCustom.id, templateForm);
          addNotification({
            message: `Custom template "${templateForm.templateName}" updated`,
            type: 'success',
            priority: 'normal'
          });
        } else {
          // Create new custom template based on built-in
          addFixtureTemplate(templateForm);
          addNotification({
            message: `Custom template "${templateForm.templateName}" created from built-in`,
            type: 'success',
            priority: 'normal'
          });
        }
      } else {
        // Update existing custom template
        updateFixtureTemplate(editingTemplate.id, templateForm);
      }
    } else {
      // Create new template
      addFixtureTemplate(templateForm);
    }

    setEditingTemplate(null);
    setTemplateForm({
      templateName: '',
      defaultNamePrefix: '',
      channels: [{ name: 'Channel 1', type: 'other' }],
      isBuiltIn: false,
      isCustom: true
    });
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setTemplateForm({
      templateName: '',
      defaultNamePrefix: '',
      channels: [{ name: 'Channel 1', type: 'other' }],
      isBuiltIn: false,
      isCustom: true
    });
  };

  const handleAddChannel = () => {
    setTemplateForm(prev => ({
      ...prev,
      channels: [...prev.channels, { name: `Channel ${prev.channels.length + 1}`, type: 'other' }]
    }));
  };

  const handleRemoveChannel = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      channels: prev.channels.filter((_, i) => i !== index)
    }));
  };

  const handleChannelChange = (index: number, field: 'name' | 'type', value: string) => {
    setTemplateForm(prev => ({
      ...prev,
      channels: prev.channels.map((ch, i) =>
        i === index ? { ...ch, [field]: value } : ch
      )
    }));
  };

  const handleDeleteTemplate = (template: FixtureTemplate) => {
    if (template.isBuiltIn) {
      addNotification({
        message: 'Built-in templates cannot be deleted',
        type: 'warning',
        priority: 'normal'
      });
      return;
    }

    if (window.confirm(`Delete template "${template.templateName}"?`)) {
      deleteFixtureTemplate(template.id);
    }
  };

  const handleUseTemplate = (template: FixtureTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      onClose();
    }
  };

  const builtInTemplates = fixtureTemplates.filter(t => t.isBuiltIn);
  const customTemplates = fixtureTemplates.filter(t => !t.isBuiltIn);

  return (
    <div className={styles.templateManager}>
      <div className={styles.header}>
        <h2>
          <LucideIcon name="FileText" />
          {theme === 'artsnob' && 'Template Library: The Archetypes of Illumination'}
          {theme === 'standard' && 'Fixture Template Manager'}
          {theme === 'minimal' && 'Templates'}
        </h2>
        <button className={styles.closeButton} onClick={onClose}>
          <LucideIcon name="X" />
        </button>
      </div>

      <div className={styles.content}>
        {/* Template List */}
        <div className={styles.templateList}>
          <div className={styles.section}>
            <h3>
              <LucideIcon name="Package" />
              Built-in Templates
            </h3>
            <div className={styles.templateGrid}>
              {builtInTemplates.map(template => (
                <div key={template.id} className={`${styles.templateCard} ${styles.builtIn}`}>
                  <div className={styles.templateHeader}>
                    <h4>{template.templateName}</h4>
                    <span className={styles.badge}>Built-in</span>
                  </div>
                  <div className={styles.templateInfo}>
                    <span className={styles.prefix}>Prefix: {template.defaultNamePrefix}</span>
                    <span className={styles.channelCount}>{template.channels.length} channels</span>
                  </div>
                  <div className={styles.templateActions}>
                    <button
                      className={styles.useButton}
                      onClick={() => handleUseTemplate(template)}
                      title="Use this template"
                    >
                      <LucideIcon name="Play" />
                      Use
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={() => handleStartEdit(template)}
                      title="Edit template (saves as custom)"
                    >
                      <LucideIcon name="Edit" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>
              <LucideIcon name="Folder" />
              Custom Templates
            </h3>
            {customTemplates.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No custom templates yet. Create one by copying a built-in template or creating a new one.</p>
              </div>
            ) : (
              <div className={styles.templateGrid}>
                {customTemplates.map(template => (
                  <div key={template.id} className={styles.templateCard}>
                    <div className={styles.templateHeader}>
                      <h4>{template.templateName}</h4>
                    </div>
                    <div className={styles.templateInfo}>
                      <span className={styles.prefix}>Prefix: {template.defaultNamePrefix}</span>
                      <span className={styles.channelCount}>{template.channels.length} channels</span>
                    </div>
                    <div className={styles.templateActions}>
                      <button
                        className={styles.useButton}
                        onClick={() => handleUseTemplate(template)}
                        title="Use this template"
                      >
                        <LucideIcon name="Play" />
                        Use
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() => handleStartEdit(template)}
                        title="Edit template"
                      >
                        <LucideIcon name="Edit" />
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteTemplate(template)}
                        title="Delete template"
                      >
                        <LucideIcon name="Trash2" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Editor */}
        <div className={styles.templateEditor}>
          <h3>
            {editingTemplate ? (
              <>
                <LucideIcon name="Edit" />
                {editingTemplate.isBuiltIn ? (
                  <>Edit Built-in Template (saves as custom)</>
                ) : (
                  <>Edit Template</>
                )}
              </>
            ) : (
              <>
                <LucideIcon name="Plus" />
                Create New Template
              </>
            )}
          </h3>

          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Template Name:</label>
              <input
                type="text"
                value={templateForm.templateName}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, templateName: e.target.value }))}
                placeholder="e.g., Moving Head Spot (Basic)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Default Name Prefix:</label>
              <input
                type="text"
                value={templateForm.defaultNamePrefix}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, defaultNamePrefix: e.target.value }))}
                placeholder="e.g., Basic Mover"
              />
            </div>

            <div className={styles.channelsSection}>
              <div className={styles.channelsHeader}>
                <label>Channels:</label>
                <button className={styles.addChannelButton} onClick={handleAddChannel}>
                  <LucideIcon name="Plus" />
                  Add Channel
                </button>
              </div>

              <div className={styles.channelsList}>
                {templateForm.channels.map((channel, index) => (
                  <div key={index} className={styles.channelRow}>
                    <div className={styles.channelNumber}>
                      CH {index + 1}
                    </div>
                    <input
                      type="text"
                      value={channel.name}
                      onChange={(e) => handleChannelChange(index, 'name', e.target.value)}
                      placeholder="Channel name"
                      className={styles.channelName}
                    />
                    <select
                      value={channel.type}
                      onChange={(e) => handleChannelChange(index, 'type', e.target.value)}
                      className={styles.channelType}
                    >
                      {channelTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveChannel(index)}
                      disabled={templateForm.channels.length === 1}
                      title="Remove channel"
                    >
                      <LucideIcon name="X" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.cancelButton} onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className={styles.saveButton} onClick={handleSaveTemplate}>
                <LucideIcon name="Save" />
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

