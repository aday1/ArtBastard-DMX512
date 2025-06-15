# Super Control Components Integration Guide

This guide explains how to integrate the DockableSuperControl and TouchSuperControl components into your DMX lighting application.

## Components Overview

### DockableSuperControl
A sophisticated panel component designed for desktop/mouse interactions that can be:
- Docked to screen edges (top, bottom, left, right)
- Collapsed with smart status display
- Dragged and repositioned
- Minimized/restored
- Resized

**Best for:** Main UI panels, multi-monitor setups, desktop applications

### TouchSuperControl
An optimized touchscreen interface designed for:
- Large, finger-friendly controls
- Gesture-based navigation
- Haptic feedback
- Auto-hide interface
- Fullscreen experiences

**Best for:** External monitors, tablets, touch kiosks, simplified control surfaces

## Integration Examples

### Adding to Main UI (DockableSuperControl)

```tsx
import React, { useState } from 'react';
import DockableSuperControl from '../components/fixtures/DockableSuperControl';

const MainPage: React.FC = () => {
  const [showSuperControl, setShowSuperControl] = useState(true);

  return (
    <div>
      {/* Your existing UI */}
      
      {/* Add Super Control as dockable panel */}
      {showSuperControl && (
        <DockableSuperControl
          id="main-super-control"
          initialPosition={{ zone: 'right', offset: { x: 0, y: 100 } }}
          width="800px"
          height="700px"
          onCollapsedChange={(collapsed) => {
            console.log('Super Control collapsed:', collapsed);
          }}
        />
      )}
    </div>
  );
};
```

### Adding to External Monitor (TouchSuperControl)

```tsx
import React from 'react';
import TouchSuperControl from '../components/fixtures/TouchSuperControl';

const ExternalMonitorPage: React.FC = () => {
  const handleSelectionChange = (count: number) => {
    console.log(`${count} fixtures selected`);
  };

  return (
    <TouchSuperControl
      isFullscreen={true}
      enableHapticFeedback={true}
      autoHideInterface={true}
      onSelectionChange={handleSelectionChange}
    />
  );
};
```

## Props Reference

### DockableSuperControl Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | `'dockable-super-control'` | Unique identifier |
| `initialPosition` | DockPosition | `{ zone: 'floating', offset: { x: 100, y: 100 } }` | Initial position |
| `isCollapsed` | boolean | `false` | Initial collapsed state |
| `onCollapsedChange` | (boolean) => void | - | Callback when collapsed state changes |
| `isMinimized` | boolean | `false` | Initial minimized state |
| `onMinimizedChange` | (boolean) => void | - | Callback when minimized state changes |
| `width` | string | `'900px'` | Panel width |
| `height` | string | `'700px'` | Panel height |
| `isDraggable` | boolean | `true` | Whether panel can be dragged |
| `showMinimizeButton` | boolean | `true` | Show minimize button |
| `className` | string | `''` | Additional CSS classes |
| `style` | React.CSSProperties | `{}` | Additional inline styles |

### TouchSuperControl Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isFullscreen` | boolean | `true` | Take up full screen |
| `onSelectionChange` | (number) => void | - | Callback when selection count changes |
| `enableHapticFeedback` | boolean | `true` | Enable vibration feedback |
| `autoHideInterface` | boolean | `false` | Auto-hide UI after inactivity |

## DockPosition Types

```tsx
interface DockPosition {
  zone: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  offset: { x: number; y: number };
}
```

## Features

### DockableSuperControl Features
- ✅ Full SuperControl functionality (pan/tilt, color, dimmer, effects)
- ✅ Docking to screen edges with snap indicators
- ✅ Collapsible with status display showing fixture/group/channel counts
- ✅ Draggable with smooth animations
- ✅ Minimizable to icon
- ✅ Resizable panels
- ✅ Persistent state management
- ✅ Multiple instances support

### TouchSuperControl Features
- ✅ Large, touch-friendly controls (48px+ touch targets)
- ✅ XY pad for pan/tilt with smooth gestures
- ✅ Color wheel with touch support
- ✅ Haptic feedback for interactions
- ✅ Auto-hide interface after inactivity
- ✅ Enhanced quick actions with descriptions
- ✅ Selection modes: Fixtures, Groups, Capabilities
- ✅ Fullscreen touch experience
- ✅ Visual feedback for all interactions

## Usage Patterns

### 1. Main Application Integration
```tsx
// Add to your main layout
<DockableControlsProvider>
  <YourMainContent />
  <DockableSuperControl />
</DockableControlsProvider>
```

### 2. External Monitor Setup
```tsx
// For touch displays/external monitors
const ExternalDisplay = () => (
  <div className="external-monitor">
    <TouchSuperControl
      isFullscreen={true}
      enableHapticFeedback={true}
      autoHideInterface={true}
    />
  </div>
);
```

### 3. Responsive Design
```tsx
// Conditionally render based on screen size
const ResponsiveControls = () => {
  const isTouchDevice = 'ontouchstart' in window;
  const isLargeScreen = window.innerWidth > 1024;

  return isTouchDevice ? (
    <TouchSuperControl />
  ) : (
    <DockableSuperControl />
  );
};
```

## Styling

Both components use CSS modules and can be customized:

```scss
// Override component styles
.customSuperControl {
  :global(.dockableSuperControl) {
    border: 2px solid #custom-color;
  }
}

.customTouchControl {
  :global(.touchSuperControl) {
    background: linear-gradient(custom-gradient);
  }
}
```

## Event Handling

```tsx
const MyComponent = () => {
  const handleDockableChange = (collapsed: boolean) => {
    // Save state to localStorage
    localStorage.setItem('superControlCollapsed', collapsed.toString());
  };

  const handleTouchSelection = (count: number) => {
    // Update global selection state
    updateSelectionCount(count);
  };

  return (
    <>
      <DockableSuperControl onCollapsedChange={handleDockableChange} />
      <TouchSuperControl onSelectionChange={handleTouchSelection} />
    </>
  );
};
```

## Best Practices

1. **Performance**: Only render what's needed
   ```tsx
   {showControls && <DockableSuperControl />}
   ```

2. **Accessibility**: Ensure proper ARIA labels
   ```tsx
   <DockableSuperControl 
     aria-label="DMX Fixture Super Control Panel"
   />
   ```

3. **State Management**: Use callbacks to sync with your app state
   ```tsx
   const [controlsState, setControlsState] = useStore();
   ```

4. **Responsive**: Choose appropriate component for device
   ```tsx
   const Component = isMobile ? TouchSuperControl : DockableSuperControl;
   ```

## Troubleshooting

### Common Issues

1. **Component not showing**: Check z-index and container positioning
2. **Touch not working**: Ensure `touch-action: manipulation` is set
3. **Docking not working**: Verify DockingContext is provided
4. **Performance issues**: Limit the number of simultaneous instances

### Debug Mode

Enable debug logging:
```tsx
<DockableSuperControl 
  onCollapsedChange={(collapsed) => {
    console.debug('DockableSuperControl collapsed:', collapsed);
  }}
/>
```

## Migration from Legacy Controllers

If migrating from old fixture controllers:

1. Replace imports:
   ```tsx
   // Old
   import FixtureController from './FixtureController';
   
   // New
   import DockableSuperControl from './DockableSuperControl';
   ```

2. Update props:
   ```tsx
   // Old
   <FixtureController fixtureId="fixture1" />
   
   // New
   <DockableSuperControl />
   // Selection now handled internally via UI
   ```

3. Update styling references:
   ```scss
   // Update CSS class names to new module structure
   .superControl { /* new styles */ }
   ```

This integration provides a modern, touch-friendly, and professional DMX control interface suitable for both desktop and touch environments.
