// Complete Touch-Optimized External Monitor Test Suite - UPDATED
// Run this in the browser console to test all implemented features

console.log('🚀 Starting Complete Touch Interface Validation...');

const testResults = {
    removeComponentsButton: false,
    customPageSystem: false,
    channelsPerPageConfig: false,
    touchOptimization: false,
    externalMonitorSize: false,
    touchDmxChannel: false,
    touchDmxControlPanel: false,
    subPageNavigation: false
};

// Test 1: Check if Remove Components button exists and is clickable
function testRemoveComponentsButton() {
    console.log('📝 Testing Remove Components Button...');
    
    const buttons = document.querySelectorAll('button');
    let removeButton = null;
    
    buttons.forEach(btn => {
        if (btn.textContent && btn.textContent.toLowerCase().includes('remove')) {
            removeButton = btn;
        }
    });
    
    if (removeButton) {
        console.log('✅ Remove Components button found');
        if (removeButton.onclick || removeButton.getAttribute('onClick')) {
            console.log('✅ Remove Components button has click handler');
            testResults.removeComponentsButton = true;
        } else {
            console.log('⚠️ Remove Components button missing click handler');
        }
    } else {
        console.log('❌ Remove Components button not found - check external monitor');
    }
}

// Test 2: Check custom page system implementation
function testCustomPageSystem() {
    console.log('📝 Testing Custom Page System...');
    
    const pageButtons = document.querySelectorAll('button');
    const expectedPages = ['Main Lights', 'Moving Lights', 'Effects'];
    let foundPages = [];
    
    pageButtons.forEach(btn => {
        const text = btn.textContent;
        expectedPages.forEach(page => {
            if (text && text.includes(page)) {
                foundPages.push(page);
                console.log(`Found page button: ${page}`);
            }
        });
    });
    
    if (foundPages.length >= 3) {
        console.log('✅ Custom page system implemented');
        testResults.customPageSystem = true;
    } else {
        console.log(`❌ Custom page system incomplete - found ${foundPages.length}/3 pages`);
        console.log('Expected: Main Lights, Moving Lights, Effects');
    }
}

// Test 3: Check channels per page configuration
function testChannelsPerPageConfig() {
    console.log('📝 Testing Channels Per Page Configuration...');
    
    const inputs = document.querySelectorAll('input[type="number"]');
    const labels = document.querySelectorAll('label, span, div');
    
    let foundChannelsPerPageControl = false;
    let foundConfigInput = false;
    
    labels.forEach(label => {
        if (label.textContent && label.textContent.toLowerCase().includes('per page')) {
            foundChannelsPerPageControl = true;
        }
    });
    
    inputs.forEach(input => {
        if (input.placeholder && input.placeholder.toLowerCase().includes('channel')) {
            foundConfigInput = true;
        }
    });
    
    if (foundChannelsPerPageControl && foundConfigInput) {
        console.log('✅ Channels per page configuration found');
        testResults.channelsPerPageConfig = true;
    } else {
        console.log('❌ Channels per page configuration not found');
        console.log(`- Control text: ${foundChannelsPerPageControl}`);
        console.log(`- Config input: ${foundConfigInput}`);
    }
}

// Test 4: Check sub-page navigation
function testSubPageNavigation() {
    console.log('📝 Testing Sub-Page Navigation...');
    
    const navButtons = document.querySelectorAll('button');
    let foundPrevNext = false;
    
    navButtons.forEach(btn => {
        const text = btn.textContent || '';
        if (text.includes('‹') || text.includes('›') || 
            text.toLowerCase().includes('prev') || 
            text.toLowerCase().includes('next')) {
            foundPrevNext = true;
        }
    });
    
    if (foundPrevNext) {
        console.log('✅ Sub-page navigation found');
        testResults.subPageNavigation = true;
    } else {
        console.log('❌ Sub-page navigation not found');
    }
}

// Test 5: Check TouchDmxControlPanel component
function testTouchDmxControlPanel() {
    console.log('📝 Testing TouchDmxControlPanel Component...');
    
    const dmxHeaders = document.querySelectorAll('h2, h3, div');
    let foundDmxControl = false;
    
    dmxHeaders.forEach(header => {
        if (header.textContent && header.textContent.includes('DMX Touch Control')) {
            foundDmxControl = true;
        }
    });
    
    if (foundDmxControl) {
        console.log('✅ TouchDmxControlPanel component found');
        testResults.touchDmxControlPanel = true;
    } else {
        console.log('❌ TouchDmxControlPanel component not found');
    }
}

// Test 6: Check TouchDmxChannel components
function testTouchDmxChannel() {
    console.log('📝 Testing TouchDmxChannel Components...');
    
    const sliders = document.querySelectorAll('input[type="range"]');
    const channelControls = document.querySelectorAll('div[style*="background"], div[style*="channel"]');
    
    console.log(`Found ${sliders.length} sliders and ${channelControls.length} channel controls`);
    
    if (sliders.length > 0) {
        console.log('✅ TouchDmxChannel components with sliders found');
        testResults.touchDmxChannel = true;
    } else {
        console.log('❌ TouchDmxChannel components not detected');
    }
}

// Test 7: Check touch optimization
function testTouchOptimization() {
    console.log('📝 Testing Touch Optimization...');
    
    const elements = document.querySelectorAll('*');
    let touchOptimizedElements = 0;
    let touchActionElements = 0;
    
    elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const touchAction = styles.touchAction;
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);
        
        if (touchAction && touchAction !== 'auto') {
            touchActionElements++;
        }
        
        if ((minHeight >= 44 || minWidth >= 44)) {
            touchOptimizedElements++;
        }
    });
    
    console.log(`Found ${touchActionElements} elements with touch-action and ${touchOptimizedElements} with min size >= 44px`);
    
    if (touchActionElements > 0 || touchOptimizedElements > 10) {
        console.log('✅ Touch optimization detected');
        testResults.touchOptimization = true;
    } else {
        console.log('❌ No touch optimization detected');
    }
}

// Test 8: Check external monitor size
function testExternalMonitorSize() {
    console.log('📝 Testing External Monitor Size...');
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    console.log(`Current window size: ${width}x${height}`);
    
    if (window.opener) {
        console.log('✅ Running in external window context');
        if (width >= 1400 && height >= 900) {
            console.log('✅ External monitor has proper touch-optimized size');
            testResults.externalMonitorSize = true;
        } else {
            console.log('⚠️ External monitor size might not be optimal for touch');
            console.log('Expected: 1400x900 or larger');
        }
    } else {
        console.log('⚠️ Not running in external monitor context - test in external window');
    }
}

// Run all tests
function runCompleteValidation() {
    console.log('🧪 Running Complete Touch Interface Validation...\n');
    
    testRemoveComponentsButton();
    testCustomPageSystem();
    testChannelsPerPageConfig();
    testSubPageNavigation();
    testTouchDmxControlPanel();
    testTouchDmxChannel();
    testTouchOptimization();
    testExternalMonitorSize();
    
    // Generate comprehensive summary report
    console.log('\n📊 COMPLETE VALIDATION SUMMARY:');
    console.log('='.repeat(60));
    
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;
    
    Object.entries(testResults).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });
    
    console.log('='.repeat(60));
    console.log(`Overall Score: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Touch interface is fully functional!');
        console.log('✨ Ready for production use on touchscreen hardware!');
    } else if (passedTests >= 6) {
        console.log('🟡 Most features working - minor issues detected');
        console.log('🔧 Check failed tests and verify in external monitor');
    } else {
        console.log('🔴 Several tests failed - please check implementation');
        console.log('💡 Make sure to test in the external monitor window');
    }
    
    // Provide next steps
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Open External Monitor from main interface');
    console.log('2. Add "DMX Touch Control" panel to external monitor');
    console.log('3. Test custom page navigation (Main Lights, Moving Lights, Effects)');
    console.log('4. Configure channels per page for each custom page');
    console.log('5. Test individual channel sliders and precision controls');
    console.log('6. Verify Remove Components button functionality');
    console.log('7. Test on actual touchscreen hardware for best results');
    
    return testResults;
}

// Auto-run tests after page loads
setTimeout(runCompleteValidation, 3000);

// Make available globally for manual testing
window.validateCompleteTouch = runCompleteValidation;
window.touchTestResults = testResults;

console.log('💡 Manual validation available: validateCompleteTouch()');
console.log('📱 For best results, run this in the external monitor window!');

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCompleteValidation, testResults };
}
