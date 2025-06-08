// Quick test script to validate React app functionality
// Run this in the browser console to check for panel-related errors

console.log('🔍 ArtBastard DMX512 - Panel Health Check');

// Check if PanelContext is working
try {
    const panelElements = document.querySelectorAll('[class*="panel"]');
    console.log(`✅ Found ${panelElements.length} panel elements`);
    
    // Check for error boundaries
    const errorBoundaries = document.querySelectorAll('[class*="error"]');
    console.log(`ℹ️ Found ${errorBoundaries.length} error-related elements`);
    
    // Check localStorage data
    const panelLayout = localStorage.getItem('artbastard-panel-layout');
    if (panelLayout) {
        try {
            const layout = JSON.parse(panelLayout);
            console.log('✅ Panel layout data found:', layout);
            
            // Validate panel structure
            const requiredPanels = ['top-left', 'top-right', 'bottom', 'fourth'];
            const missingPanels = requiredPanels.filter(panelId => !layout[panelId]);
            
            if (missingPanels.length === 0) {
                console.log('✅ All required panels present in layout');
            } else {
                console.warn('⚠️ Missing panels:', missingPanels);
            }
        } catch (e) {
            console.error('❌ Failed to parse panel layout:', e);
        }
    } else {
        console.log('ℹ️ No panel layout data found (using defaults)');
    }
    
    // Check for React errors in the DOM
    const reactErrors = document.querySelectorAll('[data-reactroot] .error, [id="root"] .error');
    if (reactErrors.length === 0) {
        console.log('✅ No React errors detected in DOM');
    } else {
        console.warn('⚠️ React errors found:', reactErrors);
    }
    
    console.log('🎉 Panel health check complete!');
} catch (error) {
    console.error('❌ Panel health check failed:', error);
}
