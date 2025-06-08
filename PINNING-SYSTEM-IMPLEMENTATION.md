# Pinning System Implementation

## Overview
The pinning system allows users to control whether UI components are fixed to the viewport (pinned) or flow with the document content (unpinned). Components default to pinned for immediate visibility.

## Features Implemented

### 1. PinningContext (`src/context/PinningContext.tsx`)
- State management for 5 components: Master Fader, Scene Auto, Chromatic Energy Manipulator, Scene Quick Launch, Quick Capture
- localStorage persistence for user preferences
- Defaults all components to pinned state
- Provides functions: `isPinned`, `togglePin`, `setPinned`, `pinAllComponents`, `unpinAllComponents`, `getPinnedComponents`

### 2. PinButton Component (`src/components/ui/PinButton.tsx`)
- Reusable pin toggle button with accessibility features
- Multiple size variants (small, medium, large)
- Configurable label display
- Icon changes based on pin state (thumbtack/thumb-tack)
- Hover effects and animations

### 3. CSS Implementation (`src/pages/MainPage.module.scss`)
- `.pinned` class: `position: fixed` with viewport positioning
- `.unpinned` class: `position: relative` with document flow
- Special positioning for pin buttons within docked components
- Responsive unpinned container layout
- Transition effects for smooth state changes

### 4. MainPage Integration (`src/pages/MainPage.tsx`)
- Conditional rendering based on pin state
- Pinned components remain in viewport overlay
- Unpinned components collect in organized "Unpinned Controls" section
- Global pin/unpin controls with status counter
- Smart layout adjustments based on component states

## Component Behavior

### When Pinned (Default)
- Components stick to viewport edges during scrolling
- Always visible regardless of page scroll position
- Individual pin buttons allow per-component toggling
- Fixed positioning with high z-index

### When Unpinned
- Components flow with document content
- Appear in "Unpinned Controls" section within main content
- Normal document positioning and scroll behavior
- Can be re-pinned individually or via global controls

## Global Controls
- **Pin All**: Pins all 5 components to viewport
- **Unpin All**: Unpins all components to document flow
- **Status Counter**: Shows "X of 5 pinned" for quick overview

## User Benefits
1. **Immediate Visibility**: All components pinned by default for quick access
2. **Flexible Layout**: Users can customize which controls follow them vs. stay in content
3. **Persistent Preferences**: Settings saved to localStorage
4. **Easy Toggle**: Individual and bulk pin/unpin controls
5. **Organized Layout**: Unpinned components neatly collected in dedicated section

## Technical Features
- TypeScript support with proper type definitions
- Accessibility features (ARIA labels, titles)
- Responsive design considerations
- Performance optimized with React hooks
- Error boundary protection
- Smooth CSS transitions

## Usage
The system is automatically available on the main page. Users can:
1. Click individual pin buttons on each component
2. Use global "Pin All" / "Unpin All" buttons
3. See real-time status of pinned components
4. Have preferences persist across sessions

All components start pinned by default, ensuring immediate access to important controls while allowing customization for different workflows.
