import React from 'react';
import TouchOSCNetworkPanel from '../touchosc/TouchOSCNetworkPanel';

const TouchOSCTestPage: React.FC = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1>TouchOSC Network Panel Test</h1>
      <p>This page tests the TouchOSC network panel independently.</p>
      
      <div style={{ marginTop: '2rem', border: '1px solid #333', borderRadius: '8px', padding: '1rem' }}>
        <TouchOSCNetworkPanel isVisible={true} />
      </div>
    </div>
  );
};

export default TouchOSCTestPage;
