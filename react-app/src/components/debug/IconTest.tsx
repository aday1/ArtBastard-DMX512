import React from 'react';
import * as Icons from 'lucide-react';

export const IconTest: React.FC = () => {
  // Log all available icon names to console
  React.useEffect(() => {
    const iconNames = Object.keys(Icons);
    console.log('Available Lucide icons:', iconNames);
    
    // Look for menu-related icons
    const menuIcons = iconNames.filter(name => 
      name.toLowerCase().includes('menu') || 
      name.toLowerCase().includes('bar') ||
      name.toLowerCase().includes('hamburger')
    );
    console.log('Menu-related icons:', menuIcons);
    
    // Look for close/x-related icons
    const closeIcons = iconNames.filter(name => 
      name.toLowerCase().includes('x') || 
      name.toLowerCase().includes('close') ||
      name.toLowerCase().includes('times')
    );
    console.log('Close-related icons:', closeIcons);
  }, []);

  return null;
};

export {};
