import React from 'react';
import { DmxControlPanel } from '../dmx/DmxControlPanel';
import { TouchDmxControlPanel } from '../dmx/TouchDmxControlPanel';
import { MasterFader } from '../dmx/MasterFader';
import { DmxWebglVisualizer } from '../dmx/DmxWebglVisualizer';
// Removed DMXChannelGrid and TouchDmxChannelGrid components
import { MidiMonitor } from '../midi/MidiMonitor';
import { OscMonitor } from '../osc/OscMonitor';
import { SceneQuickLaunch } from '../scenes/SceneQuickLaunch';
import { AutoSceneControlMini } from '../scenes/AutoSceneControlMini';
import DockableSuperControl from '../fixtures/DockableSuperControl';
import TouchSuperControl from '../fixtures/TouchSuperControl';

import { AudioControlPanel } from '../audio/AudioControlPanel';
import { SceneGallery } from '../scenes/SceneGallery';
import { FixtureSetup } from '../fixtures/FixtureSetup';
import { MidiOscSetup } from '../midi/MidiOscSetup';
import { FixtureCanvas2DWrapper } from '../fixtures/FixtureCanvas2DWrapper';

export interface ComponentDefinition {
  type: string;
  title: string;
  description: string;
  category: 'dmx' | 'midi' | 'osc' | 'scenes' | 'fixtures' | 'audio' | 'setup';
  icon: string;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  // Core DMX Controls - Most Important
  'master-fader': {
    type: 'master-fader',
    title: 'Master Slider',
    description: 'Global brightness control',
    category: 'dmx',
    icon: 'fas fa-sun',
    component: MasterFader,
    defaultProps: { isDockable: false },
    minSize: { width: 200, height: 100 },
  },  'dmx-control-panel': {
    type: 'dmx-control-panel',
    title: 'DMX Control Panel',
    description: 'Main DMX channel controls and faders',
    category: 'dmx',
    icon: 'fas fa-sliders-h',
    component: DmxControlPanel,
    minSize: { width: 400, height: 300 },  },
  'touch-dmx-control': {
    type: 'touch-dmx-control',
    title: 'Touch DMX Control',
    description: 'Touch-optimized DMX control with selected channels mode',
    category: 'dmx',
    icon: 'fas fa-hand-pointer',
    component: TouchDmxControlPanel,
    defaultProps: { touchOptimized: true },
    minSize: { width: 300, height: 400 },
  },
  // Removed 'dmx-channels' component - use DMX Control Panel instead
  'dmx-visualizer': {
    type: 'dmx-visualizer',
    title: 'DMX Visual Display',
    description: 'Real-time DMX data visualization',
    category: 'dmx',
    icon: 'fas fa-eye',
    component: DmxWebglVisualizer,
    minSize: { width: 400, height: 300 },
  },
  
  // Scene Controls
  'scene-quick-launch': {
    type: 'scene-quick-launch',
    title: 'Scene Control',
    description: 'Quick access to saved scenes',
    category: 'scenes',
    icon: 'fas fa-play',
    component: SceneQuickLaunch,
    defaultProps: { isDockable: false },
    minSize: { width: 200, height: 150 },
  },
  'auto-scene-control': {
    type: 'auto-scene-control',
    title: 'Auto Scene Control',
    description: 'Automatic scene transitions',
    category: 'scenes',
    icon: 'fas fa-magic',
    component: AutoSceneControlMini,
    defaultProps: { isDockable: false },
    minSize: { width: 250, height: 200 },
  },
  'scene-gallery': {
    type: 'scene-gallery',
    title: 'Scene Gallery',
    description: 'Browse and manage scenes',
    category: 'scenes',
    icon: 'fas fa-images',
    component: SceneGallery,
    minSize: { width: 400, height: 300 },
  },  // Fixture Controls
  'professional-fixture-controller': {
    type: 'professional-fixture-controller',
    title: 'Super Control',
    description: 'Advanced fixture control with channel monitoring, color wheels, XY controls, and real-time DMX feedback',
    category: 'fixtures',
    icon: 'fas fa-palette',
    component: DockableSuperControl,
    defaultProps: { isDockable: true },
    minSize: { width: 800, height: 600 },
  },
  'touch-fixture-controller': {
    type: 'touch-fixture-controller',
    title: 'Touch Super Control',
    description: 'Touch-optimized fixture control with haptic feedback and large controls for external monitors',
    category: 'fixtures',
    icon: 'fas fa-hand-pointer',
    component: TouchSuperControl,
    defaultProps: { isFullscreen: false, enableHapticFeedback: true },
    minSize: { width: 600, height: 800 },
  },'fixture-canvas-2d': {
    type: 'fixture-canvas-2d',
    title: '2D Canvas',
    description: 'Visual fixture layout and control',
    category: 'fixtures',
    icon: 'fas fa-vector-square',
    component: FixtureCanvas2DWrapper,
    minSize: { width: 800, height: 600 },
  },
  'fixture-setup': {
    type: 'fixture-setup',
    title: 'Fixture Setup',
    description: 'Configure lighting fixtures',
    category: 'fixtures',
    icon: 'fas fa-lightbulb',
    component: FixtureSetup,
    minSize: { width: 500, height: 400 },
  },

  // Monitoring & Audio
  'midi-monitor': {
    type: 'midi-monitor',
    title: 'MIDI Monitor',
    description: 'Monitor incoming MIDI messages',
    category: 'midi',
    icon: 'fas fa-music',
    component: MidiMonitor,
    minSize: { width: 300, height: 200 },
  },
  'osc-monitor': {
    type: 'osc-monitor',
    title: 'OSC Monitor',
    description: 'Monitor OSC messages',
    category: 'osc',
    icon: 'fas fa-broadcast-tower',
    component: OscMonitor,
    minSize: { width: 300, height: 200 },
  },
  'audio-control': {
    type: 'audio-control',
    title: 'Audio Control Panel',
    description: 'Audio analysis and reactive controls',
    category: 'audio',
    icon: 'fas fa-volume-up',
    component: AudioControlPanel,
    minSize: { width: 300, height: 250 },
  },

  // Setup
  'midi-osc-setup': {
    type: 'midi-osc-setup',
    title: 'MIDI/OSC Setup',
    description: 'Configure MIDI and OSC connections',
    category: 'setup',
    icon: 'fas fa-cog',
    component: MidiOscSetup,
    minSize: { width: 400, height: 350 },
  },
};

export const getComponentsByCategory = (category: ComponentDefinition['category']): ComponentDefinition[] => {
  return Object.values(COMPONENT_REGISTRY).filter(comp => comp.category === category);
};

export const getAllCategories = (): ComponentDefinition['category'][] => {
  return ['dmx', 'midi', 'osc', 'scenes', 'fixtures', 'audio', 'setup'];
};

export const renderComponent = (type: string, props: Record<string, any> = {}): React.ReactElement | null => {
  const definition = COMPONENT_REGISTRY[type];
  if (!definition) {
    console.warn(`Unknown component type: ${type}`);
    return null;
  }

  let Component = definition.component;
  if (props.touchOptimized && type === 'dmx-control-panel') {
    Component = TouchDmxControlPanel;
  }

  const finalProps = { ...definition.defaultProps, ...props };
  
  return <Component {...finalProps} />;
};
