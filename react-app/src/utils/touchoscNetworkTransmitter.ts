import { Fixture, MasterSlider, PlacedFixture } from '../store';

/**
 * TouchOSC Network Transmitter
 * 
 * Transmits interface data directly to TouchOSC Editor over the network
 * instead of exporting .touchosc files. This provides a seamless workflow
 * where changes in ArtBastard are instantly reflected in TouchOSC Editor.
 */

interface TouchOSCEditorConfig {
  host: string;
  port: number;
  enabled: boolean;
}

interface TouchOSCControl {
  id: string;
  type: 'fader' | 'button' | 'knob' | 'xy' | 'label';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  oscAddress: string;
  color?: string;
  range?: {
    min: number;
    max: number;
  };
  value?: number;
  text?: string;
}

interface TouchOSCPage {
  id: string;
  name: string;
  controls: TouchOSCControl[];
}

interface TouchOSCLayout {
  name: string;
  version: string;
  pages: TouchOSCPage[];
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
}

class TouchOSCNetworkTransmitter {
  private config: TouchOSCEditorConfig;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000;

  constructor(config: TouchOSCEditorConfig) {
    this.config = config;
  }

  /**
   * Connect to TouchOSC Editor
   */
  async connect(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('TouchOSC network transmission is disabled');
      return false;
    }

    try {
      // TouchOSC Editor typically listens on WebSocket for interface data
      const wsUrl = `ws://${this.config.host}:${this.config.port}/touchosc`;
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.websocket.onopen = () => {
          console.log(`Connected to TouchOSC Editor at ${this.config.host}:${this.config.port}`);
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.websocket.onerror = (error) => {
          console.error('TouchOSC connection error:', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('TouchOSC connection closed');
          this.handleDisconnection();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to connect to TouchOSC Editor:', error);
      return false;
    }
  }

  /**
   * Disconnect from TouchOSC Editor
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Send layout data to TouchOSC Editor
   */
  async transmitLayout(
    fixtures: Fixture[],
    masterSliders: MasterSlider[],
    placedFixtures: PlacedFixture[]
  ): Promise<boolean> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Cannot connect to TouchOSC Editor');
      }
    }

    try {
      const layout = this.generateLayout(fixtures, masterSliders, placedFixtures);
      
      // Send layout data as JSON
      const message = {
        type: 'layout_update',
        data: layout,
        timestamp: Date.now()
      };

      this.websocket!.send(JSON.stringify(message));
      console.log('Layout transmitted to TouchOSC Editor successfully');
      return true;
    } catch (error) {
      console.error('Failed to transmit layout:', error);
      return false;
    }
  }

  /**
   * Send real-time control value updates
   */
  async transmitControlUpdate(controlId: string, value: number): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return; // Silently fail for real-time updates
    }

    try {
      const message = {
        type: 'control_update',
        data: {
          controlId,
          value,
          timestamp: Date.now()
        }
      };

      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to transmit control update:', error);
    }
  }

  /**
   * Generate TouchOSC layout from ArtBastard data
   */
  private generateLayout(
    fixtures: Fixture[],
    masterSliders: MasterSlider[],
    placedFixtures: PlacedFixture[]
  ): TouchOSCLayout {
    const layout: TouchOSCLayout = {
      name: 'ArtBastard DMX Control',
      version: '1.0.0',
      pages: [],
      orientation: 'landscape',
      backgroundColor: '#FF1A1A1A'
    };

    // Generate main control page
    const mainPage = this.generateMainControlPage(fixtures, masterSliders);
    layout.pages.push(mainPage);

    // Generate fixture-specific pages
    const fixturePages = this.generateFixturePages(fixtures);
    layout.pages.push(...fixturePages);

    // Generate master controls page
    const masterPage = this.generateMasterPage(masterSliders);
    layout.pages.push(masterPage);

    return layout;
  }

  /**
   * Generate main control page with essential controls
   */
  private generateMainControlPage(fixtures: Fixture[], masterSliders: MasterSlider[]): TouchOSCPage {
    const controls: TouchOSCControl[] = [];
    
    // Master dimmer
    controls.push({
      id: 'master_dimmer',
      type: 'fader',
      name: 'Master',
      x: 50,
      y: 50,
      width: 80,
      height: 400,
      oscAddress: '/artbastard/master/dimmer',
      color: '#FFFF4444',
      range: { min: 0, max: 255 },
      value: 255
    });

    // Basic color controls
    const colors = [
      { name: 'Red', address: '/artbastard/color/red', color: '#FFFF0000' },
      { name: 'Green', address: '/artbastard/color/green', color: '#FF00FF00' },
      { name: 'Blue', address: '/artbastard/color/blue', color: '#FF0000FF' },
      { name: 'White', address: '/artbastard/color/white', color: '#FFFFFFFF' }
    ];

    colors.forEach((color, index) => {
      controls.push({
        id: `color_${color.name.toLowerCase()}`,
        type: 'fader',
        name: color.name,
        x: 150 + (index * 90),
        y: 50,
        width: 80,
        height: 300,
        oscAddress: color.address,
        color: color.color,
        range: { min: 0, max: 255 },
        value: 0
      });
    });

    // Pan/Tilt XY pad
    controls.push({
      id: 'pan_tilt_xy',
      type: 'xy',
      name: 'Pan/Tilt',
      x: 550,
      y: 50,
      width: 200,
      height: 200,
      oscAddress: '/artbastard/pantilt',
      color: '#FF00D4FF',
      range: { min: 0, max: 255 }
    });

    // Transport controls
    const transportButtons = [
      { name: 'Play', address: '/artbastard/transport/play' },
      { name: 'Pause', address: '/artbastard/transport/pause' },
      { name: 'Stop', address: '/artbastard/transport/stop' }
    ];

    transportButtons.forEach((button, index) => {
      controls.push({
        id: `transport_${button.name.toLowerCase()}`,
        type: 'button',
        name: button.name,
        x: 550 + (index * 70),
        y: 270,
        width: 60,
        height: 40,
        oscAddress: button.address,
        color: '#FF28A745'
      });
    });

    return {
      id: 'main_controls',
      name: 'Main',
      controls
    };
  }

  /**
   * Generate fixture-specific control pages
   */
  private generateFixturePages(fixtures: Fixture[]): TouchOSCPage[] {
    const pages: TouchOSCPage[] = [];

    fixtures.slice(0, 8).forEach((fixture, pageIndex) => { // Limit to 8 fixtures for practicality
      const controls: TouchOSCControl[] = [];

      // Fixture name label
      controls.push({
        id: `${fixture.id}_label`,
        type: 'label',
        name: fixture.name,
        x: 10,
        y: 10,
        width: 780,
        height: 30,
        oscAddress: '',
        text: `${fixture.name} (${fixture.type})`,
        color: '#FF00D4FF'
      });

      // Generate controls for each channel
      fixture.channels.forEach((channel, channelIndex) => {
        const x = 50 + (channelIndex % 8) * 90;
        const y = 60 + Math.floor(channelIndex / 8) * 120;

        controls.push({
          id: `${fixture.id}_${channel.name}`,
          type: this.getControlTypeForChannel(channel.type),
          name: channel.name,
          x,
          y,
          width: 80,
          height: 100,
          oscAddress: `/artbastard/fixture/${fixture.id}/${channel.name}`,
          color: this.getColorForChannelType(channel.type),
          range: { min: 0, max: 255 },
          value: 0
        });
      });

      pages.push({
        id: `fixture_${fixture.id}`,
        name: fixture.name.substring(0, 10),
        controls
      });
    });

    return pages;
  }

  /**
   * Generate master controls page
   */
  private generateMasterPage(masterSliders: MasterSlider[]): TouchOSCPage {
    const controls: TouchOSCControl[] = [];

    masterSliders.forEach((slider, index) => {
      const x = 50 + (index % 6) * 120;
      const y = 50 + Math.floor(index / 6) * 150;

      controls.push({
        id: `master_${slider.id}`,
        type: 'fader',
        name: slider.name,
        x,
        y,
        width: 100,
        height: 120,
        oscAddress: `/artbastard/master/${slider.id}`,
        color: '#FFFFC107',
        range: { min: 0, max: 255 },
        value: slider.value || 0
      });
    });

    return {
      id: 'master_controls',
      name: 'Masters',
      controls
    };
  }

  /**
   * Get appropriate control type for channel
   */
  private getControlTypeForChannel(channelType: string): 'fader' | 'knob' | 'button' {
    const type = channelType.toLowerCase();
    
    if (type.includes('dimmer') || type.includes('intensity')) return 'fader';
    if (type.includes('color') || type.includes('red') || type.includes('green') || type.includes('blue')) return 'fader';
    if (type.includes('pan') || type.includes('tilt')) return 'knob';
    if (type.includes('strobe') || type.includes('shutter')) return 'button';
    
    return 'fader'; // Default
  }

  /**
   * Get color for channel type
   */
  private getColorForChannelType(channelType: string): string {
    const type = channelType.toLowerCase();
    
    if (type.includes('red')) return '#FFFF4444';
    if (type.includes('green')) return '#FF44FF44';
    if (type.includes('blue')) return '#FF4444FF';
    if (type.includes('white')) return '#FFFFFFFF';
    if (type.includes('amber')) return '#FFFFAA44';
    if (type.includes('uv')) return '#FFAA44FF';
    if (type.includes('dimmer') || type.includes('intensity')) return '#FFFFFF44';
    if (type.includes('pan') || type.includes('tilt')) return '#FF44AAFF';
    
    return '#FF888888'; // Default gray
  }

  /**
   * Handle WebSocket message from TouchOSC Editor
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'status':
          console.log('TouchOSC Editor status:', message.data);
          break;
        case 'control_value':
          // Handle incoming control values from TouchOSC
          this.handleControlValue(message.data.controlId, message.data.value);
          break;
        case 'ping':
          // Respond to ping
          this.websocket?.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        default:
          console.log('Unknown message type from TouchOSC:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse TouchOSC message:', error);
    }
  }

  /**
   * Handle control value changes from TouchOSC
   */
  private handleControlValue(controlId: string, value: number): void {
    // Dispatch custom event for the application to handle
    const event = new CustomEvent('touchoscControlChange', {
      detail: { controlId, value }
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(): void {
    this.websocket = null;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to TouchOSC Editor (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached. TouchOSC connection lost.');
    }
  }

  /**
   * Check if connected to TouchOSC Editor
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(): string {
    if (!this.websocket) return 'disconnected';
    
    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Default configuration
const defaultConfig: TouchOSCEditorConfig = {
  host: '127.0.0.1',
  port: 9000, // TouchOSC Editor default port
  enabled: true
};

// Export singleton instance
export const touchOSCTransmitter = new TouchOSCNetworkTransmitter(defaultConfig);

// Export configuration functions
export const configureTouchOSC = (config: Partial<TouchOSCEditorConfig>): void => {
  Object.assign(defaultConfig, config);
};

export const getTouchOSCConfig = (): TouchOSCEditorConfig => ({ ...defaultConfig });

export default TouchOSCNetworkTransmitter;
