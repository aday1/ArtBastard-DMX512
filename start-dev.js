const { spawn } = require('child_process');
const path = require('path');

console.log('ArtBastard DMX512 - Development Mode Launcher');
console.log('================================================');
console.log('Starting both backend and frontend in development mode');
console.log('================================================');
console.log('');

const startTime = Date.now();

function showProgress(message) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log('');
    console.log('================================================');
    console.log(`Elapsed: ${elapsed}s`);
    console.log('================================================');
    console.log(message);
    console.log('');
}

// Function to run a command and return a promise
function runCommand(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        console.log(`Starting ${name}...`);
        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'pipe',
            shell: true
        });

        process.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(`[${name.toUpperCase()}] ${output}`);
            }
        });

        process.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(`[${name.toUpperCase()}] ${output}`);
            }
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${name} exited with code ${code}`));
            }
        });

        process.on('error', (error) => {
            reject(error);
        });

        return process;
    });
}

// Function to start a background process
function startBackgroundProcess(command, args, cwd, name) {
    console.log(`Starting ${name} in background...`);
    const process = spawn(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: true
    });

    process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            console.log(`[${name.toUpperCase()}] ${output}`);
        }
    });

    process.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            console.log(`[${name.toUpperCase()}] ${output}`);
        }
    });

    process.on('error', (error) => {
        console.error(`Error starting ${name}:`, error);
    });

    return process;
}

async function main() {
    try {
        showProgress('Starting development environment...');

        // Clean up caches first
        showProgress('Cleaning up caches...');
        try {
            // Clean npm cache
            await runCommand('npm', ['cache', 'clean', '--force'], process.cwd(), 'npm cache cleanup');
            
            // Clean node_modules and reinstall if needed
            const fs = require('fs');
            const path = require('path');
            
            // Clean dist folder
            const distPath = path.join(process.cwd(), 'dist');
            if (fs.existsSync(distPath)) {
                console.log('Cleaning dist folder...');
                const { execSync } = require('child_process');
                try {
                    execSync(`rmdir /s /q "${distPath}"`, { stdio: 'inherit' });
                } catch (e) {
                    // Ignore errors if folder doesn't exist
                }
            }
            
            // Clean react-app dist and node_modules/.vite
            const reactAppDist = path.join(process.cwd(), 'react-app', 'dist');
            const reactAppVite = path.join(process.cwd(), 'react-app', 'node_modules', '.vite');
            
            if (fs.existsSync(reactAppDist)) {
                console.log('Cleaning react-app dist folder...');
                try {
                    execSync(`rmdir /s /q "${reactAppDist}"`, { stdio: 'inherit' });
                } catch (e) {
                    // Ignore errors
                }
            }
            
            if (fs.existsSync(reactAppVite)) {
                console.log('Cleaning Vite cache...');
                try {
                    execSync(`rmdir /s /q "${reactAppVite}"`, { stdio: 'inherit' });
                } catch (e) {
                    // Ignore errors
                }
            }
            
            console.log('Cache cleanup completed!');
        } catch (error) {
            console.log('Cache cleanup failed (continuing anyway):', error.message);
        }

        // Build backend first
        showProgress('Building backend...');
        await runCommand('npm', ['run', 'build-backend-fast'], process.cwd(), 'backend build');
        console.log('Backend build completed!');

        // Start backend server in background
        showProgress('Starting backend server...');
        const backendProcess = startBackgroundProcess('node', ['dist/server.js'], process.cwd(), 'backend');

        // Wait a moment for backend to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Start frontend development server
        showProgress('Starting frontend development server...');
        const frontendProcess = startBackgroundProcess('npm', ['run', 'dev'], path.join(process.cwd(), 'react-app'), 'frontend');

        console.log('');
        console.log('================================================');
        console.log('Development servers started!');
        console.log('================================================');
        console.log('Backend: http://localhost:3030');
        console.log('Frontend: http://localhost:3001');
        console.log('');
        console.log('Press Ctrl+C to stop both servers');
        console.log('');

        // Handle cleanup on exit
        function cleanup() {
            console.log('');
            console.log('Stopping development servers...');
            
            if (backendProcess) {
                backendProcess.kill('SIGTERM');
            }
            
            if (frontendProcess) {
                frontendProcess.kill('SIGTERM');
            }
            
            console.log('Development servers stopped.');
            
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            console.log('');
            console.log(`Development session ended after ${totalTime}s`);
            
            process.exit(0);
        }

        // Set up signal handlers
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        // Keep the process alive
        process.stdin.resume();

    } catch (error) {
        console.error('Failed to start development environment:', error);
        process.exit(1);
    }
}

main();
