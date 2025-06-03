import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { MidiLearnButton } from '../midi/MidiLearnButton';
import styles from './SceneGallery.module.scss';
export const SceneGallery = () => {
    const { theme } = useTheme();
    const { scenes, dmxChannels, loadScene, deleteScene, updateScene } = useStore(state => ({
        scenes: state.scenes,
        dmxChannels: state.dmxChannels,
        loadScene: state.loadScene,
        deleteScene: state.deleteScene,
        updateScene: state.updateScene
    }));
    const [newSceneName, setNewSceneName] = useState('');
    const [newSceneOsc, setNewSceneOsc] = useState('/scene/new');
    const [activeSceneId, setActiveSceneId] = useState(null);
    const [transitionTime, setTransitionTime] = useState(1); // seconds
    const [editingScene, setEditingScene] = useState(null);
    const [editOscAddress, setEditOscAddress] = useState('');
    const [editSceneName, setEditSceneName] = useState('');
    // Save current DMX state as a new scene
    const saveScene = () => {
        if (!newSceneName.trim()) {
            useStore.getState().addNotification({
                message: 'Scene name cannot be empty',
                type: 'error',
                priority: 'high'
            });
            return;
        }
        // Check for duplicate names
        if (scenes.some(s => s.name === newSceneName)) {
            if (!window.confirm(`Scene "${newSceneName}" already exists. Overwrite?`)) {
                return;
            }
        }
        useStore.getState().saveScene(newSceneName, newSceneOsc);
        // Reset form
        setNewSceneName('');
        setNewSceneOsc('/scene/new');
        // Show success message
        useStore.getState().addNotification({
            message: `Scene "${newSceneName}" saved`,
            type: 'success',
            priority: 'normal'
        });
    };
    // Start editing a scene
    const startEditingScene = (scene) => {
        setEditingScene(scene.name);
        setEditOscAddress(scene.oscAddress);
        setEditSceneName(scene.name);
    };
    // Cancel editing
    const cancelEditing = () => {
        setEditingScene(null);
        setEditOscAddress('');
        setEditSceneName('');
    };
    // Save scene edits
    const saveSceneEdits = () => {
        if (!editingScene)
            return;
        if (!editSceneName.trim()) {
            useStore.getState().addNotification({
                message: 'Scene name cannot be empty',
                type: 'error',
                priority: 'high'
            });
            return;
        }
        if (!editOscAddress.trim()) {
            useStore.getState().addNotification({
                message: 'OSC address cannot be empty',
                type: 'error',
                priority: 'high'
            });
            return;
        }
        // Check if name already exists (unless it's the same name)
        if (editSceneName !== editingScene && scenes.some(s => s.name === editSceneName)) {
            useStore.getState().addNotification({
                message: `Scene name "${editSceneName}" already exists`,
                type: 'error',
                priority: 'high'
            });
            return;
        }
        const updates = {};
        const originalScene = scenes.find(s => s.name === editingScene);
        if (editSceneName !== editingScene) {
            updates.name = editSceneName;
        }
        if (editOscAddress !== originalScene?.oscAddress) {
            updates.oscAddress = editOscAddress;
        }
        if (Object.keys(updates).length > 0) {
            updateScene(editingScene, updates);
            // Update active scene ID if it was the edited scene
            if (activeSceneId === editingScene && updates.name) {
                setActiveSceneId(updates.name);
            }
            useStore.getState().addNotification({
                message: `Scene "${editSceneName}" updated successfully`,
                type: 'success',
                priority: 'normal'
            });
        }
        cancelEditing();
    };
    // Calculate the number of active channels in a scene
    const getActiveChannelCount = (channelValues) => {
        return channelValues.filter(v => v > 0).length;
    };
    // Format time for display
    const formatTime = (seconds) => {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        }
        else {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs.toFixed(0)}s`;
        }
    };
    return (_jsxs("div", { className: styles.sceneGallery, children: [_jsxs("h2", { className: styles.sectionTitle, children: [theme === 'artsnob' && 'Scene Gallery: The Exhibition of Light', theme === 'standard' && 'Scenes', theme === 'minimal' && 'Scenes'] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Create New Scene: Choreography of Light', theme === 'standard' && 'New Scene', theme === 'minimal' && 'New Scene'] }) }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { htmlFor: "sceneName", children: [theme === 'artsnob' && 'Title of Masterpiece:', theme === 'standard' && 'Scene Name:', theme === 'minimal' && 'Name:'] }), _jsx("input", { type: "text", id: "sceneName", value: newSceneName, onChange: (e) => setNewSceneName(e.target.value), placeholder: theme === 'artsnob'
                                            ? 'Bestow a title upon your luminous creation...'
                                            : 'Enter scene name' })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "sceneOsc", children: "OSC Address:" }), _jsx("input", { type: "text", id: "sceneOsc", value: newSceneOsc, onChange: (e) => setNewSceneOsc(e.target.value), placeholder: "/scene/name" })] }), _jsxs("div", { className: styles.scenePreview, children: [_jsxs("div", { className: styles.previewHeader, children: [_jsx("h4", { children: "Current DMX State Preview" }), _jsxs("span", { className: styles.channelCount, children: [getActiveChannelCount(dmxChannels), " active channels"] })] }), _jsx("div", { className: styles.channelPreview, children: dmxChannels.map((value, index) => value > 0 ? (_jsx("div", { className: styles.activeChannel, style: { opacity: value / 255 }, title: `Channel ${index + 1}: ${value}`, children: index + 1 }, index)) : null) })] }), _jsxs("button", { className: styles.saveButton, onClick: saveScene, disabled: !newSceneName.trim(), children: [_jsx("i", { className: "fas fa-save" }), theme === 'artsnob' && 'Immortalize Scene', theme === 'standard' && 'Save Scene', theme === 'minimal' && 'Save'] })] })] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardHeader, children: _jsxs("h3", { children: [theme === 'artsnob' && 'Transition: The Temporal Canvas', theme === 'standard' && 'Transition Controls', theme === 'minimal' && 'Transition'] }) }), _jsx("div", { className: styles.cardBody, children: _jsxs("div", { className: styles.transitionControls, children: [_jsxs("div", { className: styles.transitionTime, children: [_jsxs("label", { htmlFor: "transitionTime", children: [theme === 'artsnob' && 'Temporal Flow:', theme === 'standard' && 'Transition Time:', theme === 'minimal' && 'Time:'] }), _jsxs("div", { className: styles.timeControl, children: [_jsx("input", { type: "range", id: "transitionTime", min: "0", max: "60", step: "0.1", value: transitionTime, onChange: (e) => setTransitionTime(parseFloat(e.target.value)) }), _jsx("span", { className: styles.timeDisplay, children: formatTime(transitionTime) })] })] }), _jsx("div", { className: styles.transitionHelp, children: _jsxs("p", { children: [theme === 'artsnob' && 'Set the duration of the temporal journey between states of luminescence.', theme === 'standard' && 'Set the time to fade between scenes when loading.', theme === 'minimal' && 'Fade time between scenes.'] }) })] }) })] }), _jsxs("h3", { className: styles.galleryTitle, children: [theme === 'artsnob' && 'The Gallery: Luminous Compositions', theme === 'standard' && 'Saved Scenes', theme === 'minimal' && 'Scenes'] }), scenes.length === 0 ? (_jsxs("div", { className: styles.emptyGallery, children: [_jsx("i", { className: "fas fa-theater-masks" }), _jsx("p", { children: "Your gallery awaits illumination. Create your first scene to begin." })] })) : (_jsx("div", { className: styles.scenesGrid, children: scenes.map((scene, index) => (_jsxs("div", { className: `${styles.sceneCard} ${activeSceneId === scene.name ? styles.active : ''}`, children: ["              ", _jsx("div", { className: styles.sceneHeader, children: editingScene === scene.name ? (_jsxs("div", { className: styles.editingHeader, children: [_jsx("input", { type: "text", value: editSceneName, onChange: (e) => setEditSceneName(e.target.value), className: styles.editNameInput, placeholder: "Scene name" }), _jsxs("div", { className: styles.editControls, children: [_jsx("button", { className: styles.saveEditButton, onClick: saveSceneEdits, title: "Save changes", children: _jsx("i", { className: "fas fa-check" }) }), _jsx("button", { className: styles.cancelEditButton, onClick: cancelEditing, title: "Cancel editing", children: _jsx("i", { className: "fas fa-times" }) })] })] })) : (_jsxs(_Fragment, { children: [_jsx("h4", { children: scene.name }), _jsxs("div", { className: styles.sceneControls, children: [_jsx("button", { className: styles.editButton, onClick: () => startEditingScene(scene), title: "Edit Scene", children: _jsx("i", { className: "fas fa-edit" }) }), _jsx("button", { className: styles.loadButton, onClick: () => {
                                                    loadScene(scene.name);
                                                    setActiveSceneId(scene.name);
                                                }, title: "Load Scene", children: _jsx("i", { className: "fas fa-play" }) }), _jsx("button", { className: styles.deleteButton, onClick: () => {
                                                    if (window.confirm(`Are you sure you want to delete scene "${scene.name}"?`)) {
                                                        deleteScene(scene.name);
                                                        if (activeSceneId === scene.name) {
                                                            setActiveSceneId(null);
                                                        }
                                                    }
                                                }, title: "Delete Scene", children: _jsx("i", { className: "fas fa-trash-alt" }) })] })] })) }), _jsxs("div", { className: styles.sceneInfo, children: [_jsxs("div", { className: styles.sceneProperty, children: [_jsx("span", { className: styles.propertyLabel, children: "OSC:" }), editingScene === scene.name ? (_jsx("input", { type: "text", value: editOscAddress, onChange: (e) => setEditOscAddress(e.target.value), className: styles.editOscInput, placeholder: "/scene/address" })) : (_jsx("span", { className: styles.propertyValue, children: scene.oscAddress }))] }), _jsxs("div", { className: styles.sceneProperty, children: [_jsx("span", { className: styles.propertyLabel, children: "Channels:" }), _jsxs("span", { className: styles.propertyValue, children: [getActiveChannelCount(scene.channelValues), " active"] })] })] }), _jsx("div", { className: styles.sceneMidiMapping, children: _jsx(MidiLearnButton, { channelIndex: index, className: styles.sceneMidiButton }) }), _jsx("div", { className: styles.sceneVisualizer, children: scene.channelValues.map((value, chIndex) => value > 0 ? (_jsx("div", { className: styles.channelIndicator, style: {
                                    opacity: value / 255,
                                    backgroundColor: getChannelColor(chIndex, value)
                                }, title: `Channel ${chIndex + 1}: ${value}` }, chIndex)) : null) })] }, index))) }))] }));
};
// Helper function to generate colors for channel indicators
function getChannelColor(channelIndex, value) {
    // Use a different hue based on channel index
    const hue = (channelIndex * 20) % 360;
    return `hsl(${hue}, 80%, ${20 + (value / 255) * 60}%)`;
}
