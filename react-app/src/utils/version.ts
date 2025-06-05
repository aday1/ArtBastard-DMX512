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
  version: '1.0.0',
  buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
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
};

/**
 * Version history for tracking releases
 */
export const VERSION_HISTORY: VersionInfo[] = [
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
