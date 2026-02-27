const { spawn } = require('child_process');
const { io } = require('../react-app/node_modules/socket.io-client');

const BASE_URL = 'http://127.0.0.1:3030';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (path) => {
  const response = await fetch(`${BASE_URL}${path}`);
  const text = await response.text();
  return { status: response.status, text };
};

const waitForServer = async (timeoutMs = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { status } = await request('/api/health');
      if (status === 200) {
        return;
      }
    } catch {
      // Keep waiting.
    }
    await sleep(500);
  }
  throw new Error('Timed out waiting for server startup');
};

const startServer = () =>
  spawn('node', ['dist/server.js'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

const stopServer = (processHandle) =>
  new Promise((resolve) => {
    if (!processHandle || processHandle.killed) {
      resolve();
      return;
    }
    processHandle.once('exit', () => resolve());
    processHandle.kill('SIGTERM');
    setTimeout(() => resolve(), 5000);
  });

const run = async () => {
  let server = null;
  let startedLocalServer = false;

  try {
    try {
      await waitForServer(2000);
    } catch {
      server = startServer();
      startedLocalServer = true;
      await waitForServer();
    }

    const socket = io(BASE_URL, { transports: ['websocket'], timeout: 5000 });
    const xml = '<?xml version="1.0" encoding="UTF-8"?><node type="DOCUMENT"><children/></node>';

    const result = await new Promise((resolve, reject) => {
      let gotStatus = false;
      let gotXml = false;

      const timer = setTimeout(() => {
        socket.close();
        reject(new Error('Timed out waiting for TouchOSC socket events'));
      }, 10000);

      socket.on('connect', () => {
        socket.emit('uploadTouchOscLayout', {
          ip: '192.168.1.',
          port: 6666,
          xml,
          resolution: 'phone_portrait',
        });
      });

      socket.on('uploadStatus', (status) => {
        if (!status?.success) {
          clearTimeout(timer);
          socket.close();
          reject(new Error(`TouchOSC upload status failed: ${JSON.stringify(status)}`));
          return;
        }
        gotStatus = true;
        socket.emit('getTouchOscXml');
      });

      socket.on('touchOscXml', async (payload) => {
        gotXml = payload === xml;
        try {
          const download = await request('/api/touchosc/layout.tosc');
          clearTimeout(timer);
          socket.close();
          resolve({
            gotStatus,
            gotXml,
            downloadStatus: download.status,
          });
        } catch (error) {
          clearTimeout(timer);
          socket.close();
          reject(error);
        }
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        socket.close();
        reject(error);
      });
    });

    if (!result.gotStatus || !result.gotXml || result.downloadStatus !== 200) {
      throw new Error(`TouchOSC workflow assertions failed: ${JSON.stringify(result)}`);
    }

    process.stdout.write(
      `TouchOSC workflow smoke passed (status:${result.gotStatus}, xml:${result.gotXml}, download:${result.downloadStatus})\n`
    );
  } finally {
    if (startedLocalServer) {
      await stopServer(server);
    }
  }
};

run().catch((error) => {
  process.stderr.write(`TouchOSC workflow smoke failed: ${error.message}\n`);
  process.exit(1);
});
