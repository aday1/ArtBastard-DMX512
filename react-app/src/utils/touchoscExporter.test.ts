import { describe, expect, it, vi, beforeEach } from 'vitest';
import { saveAs } from 'file-saver';
import { exportSuperControlToToscFile, generateToscLayout, TouchOscExportOptions } from './touchoscExporter';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('touchoscExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds canonical TouchOSC document xml and writes to tosc blob', async () => {
    const options: TouchOscExportOptions = {
      resolution: 'android_phone_landscape',
      includeMasterSliders: true,
      includePinnedChannels: true,
      includeScenes: true,
      includeFixtures: true,
      includeAllDmx: true,
      masterSliders: [{ name: 'Master A' }, { name: 'Master B' }],
      pinnedChannels: [0, 7],
      scenes: [{ id: 's1', name: 'Scene One' }, { id: 's2', name: 'Scene Two' }],
      fixtures: [
        {
          name: 'Fixture Alpha',
          channels: [
            { name: 'Pan', channelType: 'pan', dmxAddress: 0 },
            { name: 'Tilt', channelType: 'tilt', dmxAddress: 1 },
            { name: 'Dimmer', channelType: 'dimmer', dmxAddress: 2 },
          ],
        },
      ],
      getChannelInfo: (index) => ({ channelName: `CH ${index + 1}` }),
    };

    const result = await generateToscLayout(options);

    expect(result.success).toBe(true);
    expect(result.blobSize).toBeGreaterThan(0);
    expect(result.xml).toContain('<node type="DOCUMENT">');
    expect(result.xml).toContain('<property name="width">2400</property>');
    expect(result.xml).toContain('<property name="height">1080</property>');
    expect(result.xml).toContain('<property name="name">Masters</property>');
    expect(result.xml).toContain('<property name="name">Pinned</property>');
    expect(result.xml).toContain('<property name="name">Scene Load</property>');
    expect(result.xml).toContain('FULL DMX MONITOR: 1');
    expect(result.xml).toContain('/channel/1');
    expect(result.xml).toContain('/channel/8');
    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'ArtBastard_Ultimate.tosc');
  });

  it('exports super control layout and calls saveAs with requested filename', async () => {
    const result = await exportSuperControlToToscFile({
      resolution: 'tablet_landscape',
      includeBasicControls: true,
      includePanTilt: true,
      includeColorWheel: true,
      includeXYPad: true,
      includeEffects: true,
      includeAutopilot: false,
      includeQuickActions: true,
      includeSceneControls: true,
      includeNavigation: true,
    }, 'SuperControl_Test.tosc');

    expect(result.success).toBe(true);
    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'SuperControl_Test.tosc');
  });
});
