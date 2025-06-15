// Touch-Optimized External Monitor Validation Script
// Run this in the browser console to validate the touch interface

console.log('🎛️ Starting Touch-Optimized External Monitor Validation...');

const tests = {
    externalMonitorButton: false,
    touchComponentLibrary: false,
    dmxControlPanel: false,
    touchTargets: false,
    visualFeedback: false
};

// Test 1: Check if external monitor button exists
function testExternalMonitorButton() {
    const button = document.querySelector('[title*="External Monitor"], [title*="external monitor"], button:contains("External"), button:contains("Monitor")');
    if (button) {
        tests.externalMonitorButton = true;
        console.log('✅ External Monitor button found');
    } else {
        console.log('❌ External Monitor button not found');
    }
}

// Test 2: Check if TouchDmxControlPanel is available
function testTouchComponents() {
    try {
        // Check if TouchDmxControlPanel is loaded
        const componentRegistry = window.COMPONENT_REGISTRY || {};
        const hasDmxControl = Object.values(componentRegistry).some(comp => 
            comp.type === 'dmx-control-panel'
        );
        
        if (hasDmxControl) {
            tests.dmxControlPanel = true;
            console.log('✅ DMX Control Panel component available');
        } else {
            console.log('❌ DMX Control Panel component not found');
        }
    } catch (error) {
        console.log('⚠️ Component registry not accessible:', error.message);
    }
}

// Test 3: Check for touch-optimized CSS
function testTouchOptimization() {
    const styles = Array.from(document.styleSheets);
    let hasTouchStyles = false;
    
    try {
        styles.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                rules.forEach(rule => {
                    if (rule.cssText && (
                        rule.cssText.includes('touch-action') ||
                        rule.cssText.includes('min-height: 44px') ||
                        rule.cssText.includes('touchOptimized')
                    )) {
                        hasTouchStyles = true;
                    }
                });
            } catch (e) {
                // Cross-origin or other CSS access issues
            }
        });
        
        if (hasTouchStyles) {
            tests.touchTargets = true;
            console.log('✅ Touch-optimized CSS detected');
        } else {
            console.log('⚠️ Touch-optimized CSS not detected (may be in external window)');
        }
    } catch (error) {
        console.log('⚠️ Could not analyze CSS:', error.message);
    }
}

// Test 4: Check for React components and context
function testReactContext() {
    try {
        // Check if React is loaded
        if (typeof React !== 'undefined') {
            console.log('✅ React is loaded');
        }
        
        // Check for external window context in React DevTools
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactInternalFiber || reactRoot._reactInternalInstance) {
            console.log('✅ React application is mounted');
        }
    } catch (error) {
        console.log('⚠️ React context check failed:', error.message);
    }
}

// Test 5: Simulate external monitor opening
function testExternalMonitorOpening() {
    console.log('🧪 Testing external monitor opening...');
    
    // Look for external monitor button and simulate click
    const buttons = Array.from(document.querySelectorAll('button'));
    const externalButton = buttons.find(btn => 
        btn.textContent.toLowerCase().includes('external') ||
        btn.textContent.toLowerCase().includes('monitor') ||
        btn.title.toLowerCase().includes('external')
    );
    
    if (externalButton) {
        console.log('✅ Found external monitor button:', externalButton.textContent || externalButton.title);
        console.log('🔧 To test: Click the button to open external monitor');
        console.log('📱 Expected: 1400x900 window with touch-optimized interface');
        
        // Highlight the button for user
        externalButton.style.border = '3px solid #4ecdc4';
        externalButton.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.8)';
        
        setTimeout(() => {
            externalButton.style.border = '';
            externalButton.style.boxShadow = '';
        }, 3000);
        
        tests.touchComponentLibrary = true;
    } else {
        console.log('❌ External monitor button not found');
    }
}

// Run all tests
function runValidation() {
    console.log('🎯 Running Touch-Optimized External Monitor Validation...\n');
    
    testExternalMonitorButton();
    testTouchComponents();
    testTouchOptimization();
    testReactContext();
    testExternalMonitorOpening();
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log('='.repeat(40));
    
    const passedTests = Object.values(tests).filter(Boolean).length;
    const totalTests = Object.keys(tests).length;
    
    Object.entries(tests).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    console.log(`\n🎯 Tests Passed: ${passedTests}/${totalTests}`);
    
    if (passedTests >= 3) {
        console.log('🎉 Touch-optimized external monitor is ready for testing!');
        console.log('📱 Next steps:');
        console.log('   1. Click the highlighted external monitor button');
        console.log('   2. Verify 1400x900 window opens');
        console.log('   3. Test component library in external window');
        console.log('   4. Add DMX Control Panel and test touch controls');
    } else {
        console.log('⚠️ Some components may not be loaded yet. Try refreshing the page.');
    }
    
    return { tests, passedTests, totalTests };
}

// Auto-run validation
setTimeout(runValidation, 1000);

// Make functions available globally for manual testing
window.touchValidation = {
    runValidation,
    testExternalMonitorButton,
    testTouchComponents,
    testTouchOptimization,
    testReactContext,
    testExternalMonitorOpening
};

console.log('🔧 Manual testing functions available as window.touchValidation.*');
