/**
 * Version tracking and release information for ArtBastard DMX512
 */

export interface VersionInfo {
  version: string;
  buildDate: string;
  gitCommit?: string;
  releaseType: 'stable' | 'beta' | 'alpha' | 'dev';
  features: string[];
  changelog: string[];
}

// Current version info - update this for each release
export const CURRENT_VERSION: VersionInfo = {
  version: '5.12.0',
  buildDate: '2025-08-16',
  releaseType: 'stable',
  features: [
    'Streamlined Documentation Architecture - Organized /DOCS/ directory structure',
    'Enhanced French Artsy Navigation Labels - Élégant interface terminology',
    'Professional Dark Theme Refinement - Theatrical purple-black color scheme',
    'Concise Help System Overhaul - Focused, actionable guidance',
    'Comprehensive Markdown Cleanup - Removed 65+ redundant documentation files',
    'Modern UI Polish - Refined aesthetics without complexity bloat',
    'Improved User Experience - Self-documenting interface design',
    'Performance Optimizations - Cleaner codebase with better maintainability'
  ],
  changelog: [
    'Photonic Supremacy Edition - Complete Documentation & UI Overhaul',
    'Created organized /DOCS/ directory with categorized documentation',
    'Replaced 1100+ line README with concise 200-line professional overview',
    'Enhanced artsnob navigation with proper French terminology',
    'Refined dark theme with theatrical lighting-appropriate colors',
    'Streamlined help content for production usability',
    'Removed bloated legacy documentation (65+ redundant markdown files)',
    'Updated version throughout codebase to maintain consistency',
    'Improved overall user experience with self-documenting design'
  ]
};

/**
 * Version history for tracking releases
 */
export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: '5.12.0',
    buildDate: '2025-08-16',
    releaseType: 'stable',
    features: [
      'Streamlined Documentation Architecture - Organized /DOCS/ directory structure',
      'Enhanced French Artsy Navigation Labels - Élégant interface terminology',
      'Professional Dark Theme Refinement - Theatrical purple-black color scheme',
      'Concise Help System Overhaul - Focused, actionable guidance',
      'Comprehensive Markdown Cleanup - Removed 65+ redundant documentation files',
      'Modern UI Polish - Refined aesthetics without complexity bloat',
      'Improved User Experience - Self-documenting interface design',
      'Performance Optimizations - Cleaner codebase with better maintainability'
    ],
    changelog: [
      'Photonic Supremacy Edition - Complete Documentation & UI Overhaul',
      'Created organized /DOCS/ directory with categorized documentation',
      'Replaced 1100+ line README with concise 200-line professional overview',
      'Enhanced artsnob navigation with proper French terminology',
      'Refined dark theme with theatrical lighting-appropriate colors',
      'Streamlined help content for production usability',
      'Removed bloated legacy documentation (65+ redundant markdown files)',
      'Updated version throughout codebase to maintain consistency',
      'Improved overall user experience with self-documenting design'
    ]
  },
  {
    version: '5.1.3',
    buildDate: '2025-06-16',
    releaseType: 'stable',
    features: [
      'Touch-Friendly Manual Resize Handles for External Monitor Components',
      'Native React-Grid-Layout Manual Corner Drag Resizing',
      'Large, Visible Touch-Optimized Resize Handles with Custom CSS',
      'Eliminated Button-Based Resizing for Better Touch Experience',
      'Enhanced Visual Feedback with Prominent Corner Handles',
      'Improved Touch Interaction on Professional Touch Screens',
      'Cross-Platform Touch Compatibility for Desktop and Tablet Use',
      'Streamlined UI with Intuitive Drag-to-Resize Functionality',
      'Professional-Grade Touch Interface for External Monitor Setups'
    ],
    changelog: [
      'Luminous Mastery Edition - Touch-Friendly Manual Resize Implementation',
      'Replaced button-based resizing with native manual corner drag resizing',
      'Added large, touch-optimized resize handles using custom CSS styling',
      'Enhanced .react-resizable-handle-se with 20px size and visual prominence',
      'Improved touch interaction for professional touchscreen external monitors',
      'Eliminated redundant resize buttons for cleaner, more intuitive interface',
      'Enhanced visual feedback with contrasting colors and hover effects',
      'Optimized for cross-platform touch compatibility (desktop + tablet)',
      'Implemented professional-grade touch interface standards for external displays'
    ]
  },
  {
    version: '5.1.2',
    buildDate: '2025-06-10',
    releaseType: 'stable',
    features: [
      'Enhanced DebugMenu System Tab with comprehensive system monitoring',
      'Advanced MIDI debugging and testing capabilities',
      'Professional debug interface design with enhanced CSS styling',
      '2D Canvas Layout System overhaul with fullscreen support',
      'Responsive layout architecture for all viewport sizes',
      'Dynamic canvas resizing system with intelligent size management',
      'Component integration & architecture improvements',
      'Performance & user experience enhancements',
      'Comprehensive error handling and robust error management'
    ],
    changelog: [
      'Quantum Resonance Edition - Enhanced Debug System Integration',
      'Fixed fullscreen canvas overflow issue with proper page fitting',
      'Enhanced DebugMenu MIDI Tab with advanced debugging capabilities',
      'Added professional debug interface with CSS styling system',
      'Implemented responsive layout architecture for all viewports',
      'Merged DebugInfo functionality into consolidated DebugMenu',
      'Improved canvas rendering performance and memory management',
      'Enhanced TypeScript integration with better type safety',
      'Added comprehensive error handling with detailed reporting'
    ]
  },
  {
    version: '5.1.1',
    buildDate: '2025-06-05',
    releaseType: 'stable',
    features: [
      'Canvas layout system improvements',
      'Enhanced debug interface',
      'Performance optimizations',
      'UI/UX enhancements'
    ],
    changelog: [
      'Canvas layout system enhancements',
      'Debug interface improvements',
      'Performance optimizations',
      'Bug fixes and stability improvements'
    ]
  },
  {
    version: '5.1.0',
    buildDate: '2025-06-01',
    releaseType: 'stable',
    features: [
      'Major canvas system overhaul',
      'Enhanced debugging tools',
      'Improved MIDI integration',
      'Better responsive design'
    ],
    changelog: [
      'Major canvas system rewrite',
      'Enhanced debugging capabilities',
      'Improved MIDI workflow',
      'Better mobile responsiveness'
    ]
  },
  {
    version: '5.0.0',
    buildDate: '2025-05-25',
    releaseType: 'stable',
    features: [
      'Complete architecture overhaul',
      'Modern React implementation',
      'Enhanced DMX control',
      'Advanced scene management',
      'Professional lighting tools'
    ],
    changelog: [
      'Major version release with complete rewrite',
      'Modern React and TypeScript implementation',
      'Enhanced DMX512 control system',
      'Advanced scene management tools',
      'Professional lighting control features'
    ]
  },
  {
    version: '1.0.0',
    buildDate: '2025-06-05',
    releaseType: 'stable',
    features: [
      '512-channel DMX control',
      'Real-time scene management', 
      'MIDI/OSC integration',
      'WebGL visualizations',
      'TouchOSC export',
      'Auto scene generation',
      'Live audio sync'
    ],
    changelog: [
      'Initial stable release',
      'Full DMX512 protocol support',
      'Professional lighting control interface',
      'Multi-protocol synchronization',
      'Open source under CC0 license'
    ]
  },
  {
    version: '0.9.0',
    buildDate: '2025-05-20',
    releaseType: 'beta',
    features: [
      'Core DMX functionality',
      'Basic scene management',
      'MIDI integration',
      'Web interface'
    ],
    changelog: [
      'Beta release with core features',
      'DMX512 protocol implementation',
      'Web-based control interface',
      'MIDI device support'
    ]
  }
];

/**
 * Get formatted version string for display
 */
export function getVersionDisplay(versionInfo: VersionInfo = CURRENT_VERSION): string {
  const { version, releaseType } = versionInfo;
  
  if (releaseType === 'stable') {
    return `v${version}`;
  }
  
  return `v${version}-${releaseType}`;
}

/**
 * Get build information for debug/about displays
 */
export function getBuildInfo(versionInfo: VersionInfo = CURRENT_VERSION): string {
  const { version, buildDate, gitCommit } = versionInfo;
  
  let buildInfo = `Version ${version} (${buildDate})`;
  
  if (gitCommit) {
    buildInfo += ` - ${gitCommit.substring(0, 8)}`;
  }
  
  return buildInfo;
}

/**
 * Check if this is a development build
 */
export function isDevelopmentBuild(): boolean {
  return CURRENT_VERSION.releaseType === 'dev' || 
         process.env.NODE_ENV === 'development';
}

/**
 * Get release notes for a specific version
 */
export function getReleaseNotes(version: string): VersionInfo | undefined {
  return VERSION_HISTORY.find(v => v.version === version);
}
