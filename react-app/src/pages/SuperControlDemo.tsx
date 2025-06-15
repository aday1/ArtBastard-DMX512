import React, { useState } from 'react';
import DockableSuperControl from '../components/fixtures/DockableSuperControl';
import TouchSuperControl from '../components/fixtures/TouchSuperControl';
import { LucideIcon } from '../components/ui/LucideIcon';

/**
 * SuperControlDemo - Example showing how to integrate both DockableSuperControl and TouchSuperControl
 * 
 * DockableSuperControl is perfect for:
 * - Main UI panels that can be docked to edges
 * - Desktop/mouse interactions
 * - Multi-window setups
 * - Collapsible panel interfaces
 * 
 * TouchSuperControl is perfect for:
 * - External monitor touchscreen interfaces
 * - Tablet/phone control surfaces
 * - Fullscreen touch experiences
 * - Simplified, gesture-based control
 */

const SuperControlDemo: React.FC = () => {
  const [showDockable, setShowDockable] = useState(true);
  const [showTouch, setShowTouch] = useState(false);
  const [touchSelectionCount, setTouchSelectionCount] = useState(0);

  const handleTouchSelectionChange = (count: number) => {
    setTouchSelectionCount(count);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      <h1 style={{ 
        color: '#00d4ff', 
        textAlign: 'center', 
        marginBottom: '30px',
        fontSize: '2.5rem'
      }}>
        Super Control Demo
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '30px',
        marginBottom: '40px'
      }}>
        {/* Dockable Control Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(0, 212, 255, 0.3)'
        }}>
          <h2 style={{ color: '#00d4ff', marginBottom: '16px' }}>
            <LucideIcon name="Layout" style={{ marginRight: '8px' }} />
            Dockable Super Control
          </h2>
          <p style={{ marginBottom: '20px', opacity: 0.8 }}>
            Perfect for main UI panels. Can be docked to screen edges, collapsed, minimized, 
            and dragged around. Ideal for desktop/mouse interactions.
          </p>
          
          <h3 style={{ color: '#00d4ff', fontSize: '1.1rem', marginBottom: '12px' }}>Features:</h3>
          <ul style={{ marginBottom: '20px', opacity: 0.8 }}>
            <li>• Dockable to screen edges (top, bottom, left, right)</li>
            <li>• Collapsible with smart status display</li>
            <li>• Draggable and resizable</li>
            <li>• Minimize/restore functionality</li>
            <li>• Full SuperControl functionality</li>
            <li>• Perfect for multi-monitor setups</li>
          </ul>

          <button
            onClick={() => setShowDockable(!showDockable)}
            style={{
              padding: '12px 24px',
              background: showDockable ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            <LucideIcon name={showDockable ? "EyeOff" : "Eye"} style={{ marginRight: '8px' }} />
            {showDockable ? 'Hide' : 'Show'} Dockable Control
          </button>
        </div>

        {/* Touch Control Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(0, 212, 255, 0.3)'
        }}>
          <h2 style={{ color: '#00d4ff', marginBottom: '16px' }}>
            <LucideIcon name="Smartphone" style={{ marginRight: '8px' }} />
            Touch Super Control
          </h2>
          <p style={{ marginBottom: '20px', opacity: 0.8 }}>
            Optimized for touchscreen interfaces. Large touch targets, gesture support, 
            haptic feedback, and auto-hide interface for distraction-free control.
          </p>
          
          <h3 style={{ color: '#00d4ff', fontSize: '1.1rem', marginBottom: '12px' }}>Features:</h3>
          <ul style={{ marginBottom: '20px', opacity: 0.8 }}>
            <li>• Large, touch-friendly controls</li>
            <li>• Haptic feedback support</li>
            <li>• Auto-hide interface</li>
            <li>• Gesture-based navigation</li>
            <li>• Enhanced quick actions</li>
            <li>• Perfect for external monitors</li>
          </ul>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ 
              background: 'rgba(0, 212, 255, 0.2)', 
              padding: '4px 12px', 
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}>
              Selected: {touchSelectionCount} fixtures
            </span>
          </div>

          <button
            onClick={() => setShowTouch(!showTouch)}
            style={{
              padding: '12px 24px',
              background: showTouch ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            <LucideIcon name={showTouch ? "EyeOff" : "Eye"} style={{ marginRight: '8px' }} />
            {showTouch ? 'Hide' : 'Show'} Touch Control
          </button>
        </div>
      </div>

      {/* Usage Examples */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>
          <LucideIcon name="Code" style={{ marginRight: '8px' }} />
          Usage Examples
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#00d4ff', marginBottom: '12px' }}>DockableSuperControl</h3>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '0.85rem',
              overflow: 'auto'
            }}>
{`import DockableSuperControl from './DockableSuperControl';

// Basic usage
<DockableSuperControl />

// Advanced usage
<DockableSuperControl
  id="my-super-control"
  width="900px"
  height="700px"
  initialPosition={{
    zone: 'right',
    offset: { x: 0, y: 50 }
  }}
  isCollapsed={false}
  onCollapsedChange={(collapsed) => 
    console.log('Collapsed:', collapsed)
  }
/>`}
            </pre>
          </div>
          
          <div>
            <h3 style={{ color: '#00d4ff', marginBottom: '12px' }}>TouchSuperControl</h3>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '0.85rem',
              overflow: 'auto'
            }}>
{`import TouchSuperControl from './TouchSuperControl';

// Basic usage
<TouchSuperControl />

// Advanced usage
<TouchSuperControl
  isFullscreen={true}
  enableHapticFeedback={true}
  autoHideInterface={true}
  onSelectionChange={(count) => 
    console.log('Selected:', count)
  }
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Render the actual components */}
      {showDockable && (
        <DockableSuperControl
          id="demo-dockable-control"
          initialPosition={{ zone: 'floating', offset: { x: 50, y: 100 } }}
          width="800px"
          height="600px"
        />
      )}

      {showTouch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2000,
          background: 'rgba(0, 0, 0, 0.9)'
        }}>
          <button
            onClick={() => setShowTouch(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 2001,
              padding: '12px',
              background: 'rgba(220, 53, 69, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <LucideIcon name="X" />
          </button>
          <TouchSuperControl
            isFullscreen={true}
            enableHapticFeedback={true}
            autoHideInterface={false}
            onSelectionChange={handleTouchSelectionChange}
          />
        </div>
      )}
    </div>
  );
};

export default SuperControlDemo;
