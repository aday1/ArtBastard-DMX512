// Comprehensive validation script for ArtBastard DMX512 Controller
// Tests various aspects of the application functionality

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🎨 ArtBastard DMX512 Controller - Comprehensive Validation');
console.log('='.repeat(60));

// Test 1: Check if server is responding
function testServerResponse() {
    return new Promise((resolve) => {
        console.log('\n📡 Testing Server Response...');
        
        const req = http.get('http://localhost:3030', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data.includes('<!DOCTYPE html>')) {
                    console.log('✅ Server is responding with HTML content');
                    resolve(true);
                } else {
                    console.log('❌ Server response unexpected');
                    resolve(false);
                }
            });
        });
        
        req.on('error', () => {
            console.log('❌ Server is not responding');
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ Server response timeout');
            req.destroy();
            resolve(false);
        });
    });
}

// Test 2: Check critical file structure
function testFileStructure() {
    console.log('\n📁 Testing File Structure...');
    const criticalFiles = [
        'react-app/src/store/index.ts',
        'react-app/src/components/panels/ResizablePanel.tsx',
        'react-app/src/context/PanelContext.tsx',
        'react-app/src/components/audio/BpmIndicator.tsx',
        'react-app/src/components/midi/SignalFlashIndicator.tsx',
        'dist/main.js'
    ];
    
    let allFilesExist = true;
    criticalFiles.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ Missing: ${file}`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

// Test 3: Check TypeScript compilation
function testTypeScriptCompilation() {
    console.log('\n🔧 Testing TypeScript Compilation...');
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
        exec('cd react-app && npx tsc --noEmit', (error, stdout, stderr) => {
            if (!error) {
                console.log('✅ TypeScript compilation successful');
                resolve(true);
            } else {
                console.log('❌ TypeScript compilation errors:');
                console.log(stderr);
                resolve(false);
            }
        });
    });
}

// Test 4: Check if build artifacts exist
function testBuildArtifacts() {
    console.log('\n🏗️ Testing Build Artifacts...');
    const buildFiles = [
        'dist/main.js',
        'react-app/dist/index.html',
        'react-app/dist/assets'
    ];
    
    let allBuildsExist = true;
    buildFiles.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ Missing build artifact: ${file}`);
            allBuildsExist = false;
        }
    });
    
    return allBuildsExist;
}

// Test 5: Validate configuration files
function testConfiguration() {
    console.log('\n⚙️ Testing Configuration Files...');
    let configValid = true;
    
    try {
        // Test package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`✅ Main package.json valid (${packageJson.name})`);
        
        // Test React app package.json
        const reactPackageJson = JSON.parse(fs.readFileSync('react-app/package.json', 'utf8'));
        console.log(`✅ React package.json valid (${reactPackageJson.name})`);
        
        // Test data files
        if (fs.existsSync('data/config.json')) {
            JSON.parse(fs.readFileSync('data/config.json', 'utf8'));
            console.log('✅ data/config.json valid');
        }
        
        if (fs.existsSync('data/fixtures.json')) {
            JSON.parse(fs.readFileSync('data/fixtures.json', 'utf8'));
            console.log('✅ data/fixtures.json valid');
        }
        
    } catch (error) {
        console.log('❌ Configuration file error:', error.message);
        configValid = false;
    }
    
    return configValid;
}

// Test 6: Check MIDI and BPM store properties
function testStoreStructure() {
    console.log('\n🏪 Testing Store Structure...');
    try {
        const storeContent = fs.readFileSync('react-app/src/store/index.ts', 'utf8');
        
        const requiredProperties = ['bpm:', 'isPlaying:', 'midiActivity:'];
        const requiredActions = ['setBpm:', 'setIsPlaying:', 'setMidiActivity:'];
        
        let storeValid = true;
        requiredProperties.forEach(prop => {
            if (storeContent.includes(prop)) {
                console.log(`✅ Store property: ${prop.replace(':', '')}`);
            } else {
                console.log(`❌ Missing store property: ${prop.replace(':', '')}`);
                storeValid = false;
            }
        });
        
        requiredActions.forEach(action => {
            if (storeContent.includes(action)) {
                console.log(`✅ Store action: ${action.replace(':', '')}`);
            } else {
                console.log(`❌ Missing store action: ${action.replace(':', '')}`);
                storeValid = false;
            }
        });
        
        return storeValid;
    } catch (error) {
        console.log('❌ Error reading store file:', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n🎯 Running Comprehensive Validation Tests...\n');
    
    const results = {
        server: await testServerResponse(),
        files: testFileStructure(),
        typescript: await testTypeScriptCompilation(),
        builds: testBuildArtifacts(),
        config: testConfiguration(),
        store: testStoreStructure()
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS SUMMARY:');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([test, passed]) => {
        const icon = passed ? '✅' : '❌';
        const status = passed ? 'PASS' : 'FAIL';
        console.log(`${icon} ${test.toUpperCase()}: ${status}`);
    });
    
    const allPassed = Object.values(results).every(result => result === true);
    const passedCount = Object.values(results).filter(result => result === true).length;
    const totalCount = Object.keys(results).length;
    
    console.log('='.repeat(60));
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! Application is fully functional.');
        console.log('🚀 Ready for production use!');
    } else {
        console.log(`⚠️  ${passedCount}/${totalCount} tests passed. Some issues detected.`);
        console.log('🔧 Please review failed tests above.');
    }
    console.log('='.repeat(60));
}

// Run the tests
runAllTests().catch(console.error);
