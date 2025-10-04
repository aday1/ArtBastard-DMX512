export interface FixtureTemplate {
  id: string;
  name: string;
  type: string;
  channels: Array<{ name: string; type: string }>;
}

export const fixtureTemplates: FixtureTemplate[] = [
  {
    id: 'template-moving-head',
    name: 'Moving Head',
    type: 'moving-head',
    channels: [
      { name: 'Pan', type: 'pan' },
      { name: 'Tilt', type: 'tilt' },
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' }
    ]
  },
  {
    id: 'template-par-rgb',
    name: 'RGB Par Can',
    type: 'par',
    channels: [
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' },
      { name: 'Dimmer', type: 'dimmer' }
    ]
  },
  {
    id: 'template-led-strip',
    name: 'LED Strip',
    type: 'strip',
    channels: [
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Blue', type: 'blue' },
      { name: 'White', type: 'white' },
      { name: 'Dimmer', type: 'dimmer' }
    ]
  },
  {
    id: 'template-laser',
    name: 'Laser',
    type: 'laser',
    channels: [
      { name: 'Red', type: 'red' },
      { name: 'Green', type: 'green' },
      { name: 'Pattern', type: 'gobo_wheel' },
      { name: 'Speed', type: 'speed' },
      { name: 'Strobe', type: 'strobe' }
    ]
  },
  {
    id: 'template-strobe',
    name: 'Strobe',
    type: 'strobe',
    channels: [
      { name: 'Dimmer', type: 'dimmer' },
      { name: 'Strobe', type: 'strobe' },
      { name: 'Speed', type: 'speed' }
    ]
  },
  {
    id: 'template-smoke',
    name: 'Smoke Machine',
    type: 'smoke',
    channels: [
      { name: 'Output', type: 'dimmer' },
      { name: 'Fan Speed', type: 'speed' }
    ]
  },
  {
    id: 'template-laser-sparkler',
    name: 'Laser Sparkler',
    type: 'laser',
    channels: [
      { name: 'Mode', type: 'macro' },
      { name: 'Running Direction', type: 'pan' },
      { name: 'Running Speed', type: 'speed' },
      { name: 'Twinkle Speed', type: 'speed' },
      { name: 'Color Section', type: 'color_wheel' }
    ]
  }
];
