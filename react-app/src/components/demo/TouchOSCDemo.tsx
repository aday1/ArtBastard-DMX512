import React, { useState } from 'react';
import { exportCrashProofToscFile } from '../../utils/touchoscFixedExporter';
import { LucideIcon } from '../ui/LucideIcon';

const TouchOSCDemo: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to generate TouchOSC file');
  const [isGenerating, setIsGenerating] = useState(false);

  const testTouchOSCExport = async () => {
    setIsGenerating(true);
    setStatus('Generating TouchOSC file...');
    
    try {
      // Create test fixtures data
      const mockFixtures: any[] = [
        {
          id: 'fixture1',
          name: 'RGB LED Par',
          type: 'rgb-par',
          channels: [
            { type: 'dimmer', dmxAddress: 1 },
            { type: 'red', dmxAddress: 2 },
            { type: 'green', dmxAddress: 3 },
            { type: 'blue', dmxAddress: 4 }
          ],
          position: { x: 100, y: 100 }
        },
        {
          id: 'fixture2',
          name: 'Moving Head',
          type: 'moving-head',
          channels: [
            { type: 'dimmer', dmxAddress: 5 },
            { type: 'pan', dmxAddress: 6 },
            { type: 'tilt', dmxAddress: 7 },
            { type: 'red', dmxAddress: 8 },
            { type: 'green', dmxAddress: 9 },
            { type: 'blue', dmxAddress: 10 }
          ],
          position: { x: 200, y: 150 }
        }
      ];

      const mockPlacedFixtures: any[] = mockFixtures.map(f => ({
        id: f.id,
        fixtureId: f.id,
        fixture: f,
        position: f.position
      }));

      const mockMasterSliders: any[] = [
        { id: 'master1', name: 'Master Dimmer', value: 255 },
        { id: 'master2', name: 'Strobe Speed', value: 0 },
        { id: 'master3', name: 'Color Temperature', value: 127 }
      ];

      const options = {
        resolution: 'tablet_portrait' as const,
        includeFixtureControls: true,
        includeMasterSliders: true,
        includeAllDmxChannels: false
      };

      const result = await exportCrashProofToscFile(
        options,
        mockPlacedFixtures,
        mockMasterSliders,
        mockFixtures,
        'ArtBastard_TouchOSC_Demo.tosc'
      );

      if (result.success) {
        setStatus('✅ ' + result.message);
      } else {
        setStatus('❌ ' + result.message);
      }
    } catch (error) {
      setStatus('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(78, 205, 196, 0.3)'
    }}>
      <h2 style={{ 
        color: '#4ecdc4', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <LucideIcon name="Download" />
        TouchOSC Export Demo
      </h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
          This demo tests the fixed TouchOSC export functionality. It generates a crash-proof 
          TouchOSC layout file with sample fixtures and controls that can be imported into 
          the TouchOSC app without crashes.
        </p>
      </div>

      <div style={{ 
        background: 'rgba(78, 205, 196, 0.1)',
        border: '1px solid rgba(78, 205, 196, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Test Configuration:</h3>
        <ul style={{ color: '#ccc', margin: 0, paddingLeft: '1.5rem' }}>
          <li>2 sample fixtures (RGB LED Par, Moving Head)</li>
          <li>3 master sliders</li>
          <li>Tablet portrait resolution</li>
          <li>Crash-proof validation enabled</li>
          <li>XML sanitization active</li>
        </ul>
      </div>

      <button
        onClick={testTouchOSCExport}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          background: isGenerating 
            ? 'rgba(108, 117, 125, 0.5)' 
            : 'linear-gradient(135deg, #4ecdc4, #45b7b8)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
        onMouseEnter={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(78, 205, 196, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <LucideIcon name={isGenerating ? "Loader2" : "Download"} />
        {isGenerating ? 'Generating TouchOSC File...' : 'Generate TouchOSC File'}
      </button>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h4 style={{ color: '#ccc', margin: '0 0 0.5rem 0' }}>Status:</h4>
        <div style={{ 
          color: status.startsWith('✅') ? '#28a745' : status.startsWith('❌') ? '#dc3545' : '#ffc107',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          {status}
        </div>
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(255, 193, 7, 0.1)',
        borderRadius: '6px',
        border: '1px solid rgba(255, 193, 7, 0.3)'
      }}>
        <h4 style={{ color: '#ffc107', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LucideIcon name="Info" />
          How to Use:
        </h4>
        <ol style={{ color: '#ccc', margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li>Click "Generate TouchOSC File" to create a .tosc file</li>
          <li>The file will be downloaded automatically</li>
          <li>Import the .tosc file into TouchOSC app on your mobile device</li>
          <li>The layout should load without crashes and provide working controls</li>
        </ol>
      </div>
    </div>
  );
};

export default TouchOSCDemo;