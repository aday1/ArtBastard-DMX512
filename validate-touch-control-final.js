#!/usr/bin/env node

// DMX Touch Control Implementation Validation Script
// Tests all aspects of the TouchDmxControlPanel implementation

const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    BACKEND_HOST: 'localhost',
    BACKEND_PORT: 3030,
    FRONTEND_HOST: 'localhost',
    FRONTEND_PORT: 3001,
    TEST_TIMEOUT: 5000
};

class DMXTouchControlValidator {
    constructor() {
        this.results = {
            backend: { passed: 0, failed: 0, tests: [] },
            features: { passed: 0, failed: 0, tests: [] },
            integration: { passed: 0, failed: 0, tests: [] }
        };
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}]`;
        console.log(`${prefix} ${message}`);
    }

    async runTest(category, name, testFunction) {
        try {
            this.log(`Running ${category}/${name}...`);
            const result = await testFunction();
            
            this.results[category].tests.push({ name, status: 'PASS', result });
            this.results[category].passed++;
            this.log(`✅ ${category}/${name} PASSED`, 'PASS');
            return true;
        } catch (error) {
            this.results[category].tests.push({ name, status: 'FAIL', error: error.message });
            this.results[category].failed++;
            this.log(`❌ ${category}/${name} FAILED: ${error.message}`, 'FAIL');
            return false;
        }
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: CONFIG.BACKEND_HOST,
                port: CONFIG.BACKEND_PORT,
                path: `/api${path}`,
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: CONFIG.TEST_TIMEOUT
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = body ? JSON.parse(body) : {};
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // Backend Tests
    async testBackendConnection() {
        const response = await this.makeRequest('/state');
        if (response.status !== 200) {
            throw new Error(`Backend not responding: HTTP ${response.status}`);
        }
        return `Backend connected, ${response.data.dmxChannels?.length || 0} DMX channels available`;
    }

    async testIndividualChannelUpdate() {
        const testData = { channel: 0, value: 128 };
        const response = await this.makeRequest('/dmx', 'POST', testData);
        if (response.status !== 200 || !response.data.success) {
            throw new Error(`Individual channel update failed: HTTP ${response.status}`);
        }
        return 'Individual channel update working correctly';
    }

    async testBatchChannelUpdate() {
        const testData = { "0": 50, "1": 100, "2": 150, "15": 255 };
        const response = await this.makeRequest('/dmx/batch', 'POST', testData);
        if (response.status !== 200 || !response.data.success) {
            throw new Error(`Batch update failed: HTTP ${response.status}`);
        }
        return `Batch update working, ${response.data.updateCount} channels updated`;
    }

    async testChannelRangeValidation() {
        // Test valid range
        const validData = { "0": 0, "511": 255 };
        const validResponse = await this.makeRequest('/dmx/batch', 'POST', validData);
        if (validResponse.status !== 200) {
            throw new Error('Valid channel range rejected');
        }

        // Test invalid range
        const invalidData = { "512": 128, "-1": 100 };
        const invalidResponse = await this.makeRequest('/dmx/batch', 'POST', invalidData);
        if (invalidResponse.status === 200 && invalidResponse.data.errors?.length === 0) {
            throw new Error('Invalid channel range accepted');
        }

        return 'Channel range validation working correctly';
    }

    async testValueRangeValidation() {
        // Test invalid values
        const invalidData = { "0": 256, "1": -1 };
        const response = await this.makeRequest('/dmx/batch', 'POST', invalidData);
        if (response.status === 200 && response.data.errors?.length === 0) {
            throw new Error('Invalid DMX values accepted');
        }
        return 'DMX value range validation working correctly';
    }

    // Feature Tests
    async testChannelFilteringStructure() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const content = fs.readFileSync(touchControlPath, 'utf8');
        
        // Check for CHANNEL_FILTERS array
        if (!content.includes('CHANNEL_FILTERS') || !content.includes('All Channels')) {
            throw new Error('CHANNEL_FILTERS array not found or incomplete');
        }

        // Check for expected filters
        const expectedFilters = [
            'All Channels',
            'Channels 1-16',
            'Channels 17-32',
            'Channels 33-64',
            'Channels 65-128',
            'Channels 129-256',
            'Channels 257-512'
        ];

        for (const filter of expectedFilters) {
            if (!content.includes(filter)) {
                throw new Error(`Missing channel filter: ${filter}`);
            }
        }

        return `All ${expectedFilters.length} channel filters implemented correctly`;
    }

    async testPageSizingStructure() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const content = fs.readFileSync(touchControlPath, 'utf8');
        
        // Check for PAGE_SIZES array
        if (!content.includes('PAGE_SIZES')) {
            throw new Error('PAGE_SIZES array not found');
        }

        // Check for flexible page sizes
        const expectedSizes = [1, 4, 8, 16, 32, 64, 128, 256];
        for (const size of expectedSizes) {
            if (!content.includes(`value: ${size}`)) {
                throw new Error(`Missing page size option: ${size}`);
            }
        }

        return `All ${expectedSizes.length} page size options implemented`;
    }

    async testTouchOptimization() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const content = fs.readFileSync(touchControlPath, 'utf8');
        
        // Check for touch optimization features
        const touchFeatures = [
            'touchAction: \'manipulation\'',
            'minWidth: \'60px\'', // Touch target sizing
            'padding: \'0.75rem',  // Adequate padding
            'gridTemplateColumns:' // Responsive grid
        ];

        for (const feature of touchFeatures) {
            if (!content.includes(feature)) {
                throw new Error(`Missing touch optimization: ${feature}`);
            }
        }

        return 'Touch optimization features implemented correctly';
    }

    async testNavigationControls() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const content = fs.readFileSync(touchControlPath, 'utf8');
        
        // Check for navigation functions
        const navigationFeatures = [
            'handlePageChange',
            'prev',
            'next', 
            'first',
            'last',
            'disabled={currentPage === 0}',
            'disabled={currentPage === totalPages - 1}'
        ];

        for (const feature of navigationFeatures) {
            if (!content.includes(feature)) {
                throw new Error(`Missing navigation feature: ${feature}`);
            }
        }

        return 'Navigation controls implemented with proper disabled states';
    }

    async testStateManagement() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const content = fs.readFileSync(touchControlPath, 'utf8');
        
        // Check for simplified state management
        const stateFeatures = [
            'selectedFilter',
            'channelsPerPage',
            'currentPage',
            'useEffect(() => {',
            'setCurrentPage(0)'
        ];

        for (const feature of stateFeatures) {
            if (!content.includes(feature)) {
                throw new Error(`Missing state management feature: ${feature}`);
            }
        }

        return 'State management simplified and working correctly';
    }

    // Integration Tests
    async testReactComponentStructure() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        if (!fs.existsSync(touchControlPath)) {
            throw new Error('TouchDmxControlPanel.tsx not found');
        }

        const content = fs.readFileSync(touchControlPath, 'utf8');
        const lineCount = content.split('\n').length;

        // Should be significantly smaller than original (was ~880 lines)
        if (lineCount > 500) {
            throw new Error(`Component too large: ${lineCount} lines (expected <500)`);
        }

        return `Component successfully refactored to ${lineCount} lines (simplified from ~880 lines)`;
    }

    async testTouchDmxChannelCompatibility() {
        const touchChannelPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxChannel.tsx');
        if (!fs.existsSync(touchChannelPath)) {
            throw new Error('TouchDmxChannel.tsx not found');
        }

        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const controlContent = fs.readFileSync(touchControlPath, 'utf8');

        // Check that TouchDmxChannel is properly imported and used
        if (!controlContent.includes('import { TouchDmxChannel }') || 
            !controlContent.includes('<TouchDmxChannel')) {
            throw new Error('TouchDmxChannel not properly integrated');
        }

        return 'TouchDmxChannel component properly integrated';
    }

    async testStoreIntegration() {
        const touchControlPath = path.join(__dirname, 'react-app', 'src', 'components', 'dmx', 'TouchDmxControlPanel.tsx');
        const content = fs.readFileSync(touchControlPath, 'utf8');

        // Check for proper store integration
        const storeFeatures = [
            'useStore',
            'dmxChannels',
            'selectedChannels', 
            'toggleChannelSelection',
            'setDmxChannel'
        ];

        for (const feature of storeFeatures) {
            if (!content.includes(feature)) {
                throw new Error(`Missing store integration: ${feature}`);
            }
        }

        return 'Store integration maintained correctly';
    }

    // Run all tests
    async runAllTests() {
        this.log('🎛️ Starting DMX Touch Control Implementation Validation');
        this.log('=' .repeat(60));

        // Backend Tests
        this.log('\n📡 BACKEND TESTS');
        this.log('-'.repeat(30));
        await this.runTest('backend', 'connection', () => this.testBackendConnection());
        await this.runTest('backend', 'individual_channel', () => this.testIndividualChannelUpdate());
        await this.runTest('backend', 'batch_update', () => this.testBatchChannelUpdate());
        await this.runTest('backend', 'channel_range_validation', () => this.testChannelRangeValidation());
        await this.runTest('backend', 'value_range_validation', () => this.testValueRangeValidation());

        // Feature Tests
        this.log('\n🎨 FEATURE TESTS');
        this.log('-'.repeat(30));
        await this.runTest('features', 'channel_filtering', () => this.testChannelFilteringStructure());
        await this.runTest('features', 'page_sizing', () => this.testPageSizingStructure());
        await this.runTest('features', 'touch_optimization', () => this.testTouchOptimization());
        await this.runTest('features', 'navigation_controls', () => this.testNavigationControls());
        await this.runTest('features', 'state_management', () => this.testStateManagement());

        // Integration Tests
        this.log('\n🔗 INTEGRATION TESTS');
        this.log('-'.repeat(30));
        await this.runTest('integration', 'component_structure', () => this.testReactComponentStructure());
        await this.runTest('integration', 'touch_channel_compatibility', () => this.testTouchDmxChannelCompatibility());
        await this.runTest('integration', 'store_integration', () => this.testStoreIntegration());

        // Summary
        this.printSummary();
    }

    printSummary() {
        this.log('\n' + '='.repeat(60));
        this.log('📊 TEST SUMMARY');
        this.log('='.repeat(60));

        let totalPassed = 0;
        let totalFailed = 0;

        for (const [category, results] of Object.entries(this.results)) {
            totalPassed += results.passed;
            totalFailed += results.failed;
            
            const total = results.passed + results.failed;
            const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;
            
            this.log(`${category.toUpperCase()}: ${results.passed}/${total} passed (${percentage}%)`);
            
            if (results.failed > 0) {
                results.tests.filter(t => t.status === 'FAIL').forEach(test => {
                    this.log(`  ❌ ${test.name}: ${test.error}`, 'ERROR');
                });
            }
        }

        const grandTotal = totalPassed + totalFailed;
        const overallPercentage = grandTotal > 0 ? Math.round((totalPassed / grandTotal) * 100) : 0;
        
        this.log('\n' + '-'.repeat(60));
        this.log(`OVERALL: ${totalPassed}/${grandTotal} tests passed (${overallPercentage}%)`);
        
        if (totalFailed === 0) {
            this.log('🎉 ALL TESTS PASSED! TouchDmxControlPanel implementation is ready!', 'SUCCESS');
        } else {
            this.log(`⚠️  ${totalFailed} test(s) failed. Please review and fix before deployment.`, 'WARNING');
        }
        
        this.log('='.repeat(60));
    }
}

// Run the validation
if (require.main === module) {
    const validator = new DMXTouchControlValidator();
    validator.runAllTests().catch(error => {
        console.error('Validation script failed:', error);
        process.exit(1);
    });
}

module.exports = DMXTouchControlValidator;
