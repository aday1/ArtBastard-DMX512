import React from 'react';

interface SuperControlProps {
  isDockable?: boolean;
}

// Try to import the main SuperControl component
let SuperControlMain: React.FC<SuperControlProps>;
let SuperControlFallback: React.FC<SuperControlProps>;
let hasMainComponentError = true; // Temporarily forced while fixing syntax errors

try {
  SuperControlMain = require('./SuperControl').default;
} catch (error) {
  console.error('SuperControl main component failed to load:', error);
  hasMainComponentError = true;
}

try {
  SuperControlFallback = require('./SuperControlFallback').default;
} catch (error) {
  console.error('SuperControl fallback component failed to load:', error);
}

const SuperControlWrapper: React.FC<SuperControlProps> = (props) => {
  // Check if user wants to force fallback mode
  const forceFallback = localStorage.getItem('supercontrol-force-fallback') === 'true';
  
  if (hasMainComponentError || forceFallback) {
    if (SuperControlFallback) {
      return <SuperControlFallback {...props} />;
    } else {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#d63031' }}>
          <h3>SuperControl Unavailable</h3>
          <p>Both main and fallback components failed to load. Please refresh the page.</p>
        </div>
      );
    }
  }
  
  if (SuperControlMain) {
    return <SuperControlMain {...props} />;
  }
  
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#d63031' }}>
      <h3>SuperControl Loading Error</h3>
      <p>Component failed to load. Please refresh the page.</p>
    </div>
  );
};

export default SuperControlWrapper;
