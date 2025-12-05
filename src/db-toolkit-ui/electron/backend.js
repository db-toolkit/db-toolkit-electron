const { app } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backendProcess = null;

function startBackend() {
  const isDev = !app.isPackaged;
  const backendPath = isDev
    ? path.join(__dirname, '../../db-toolkit/dist/db-toolkit-backend/db-toolkit-backend')
    : path.join(process.resourcesPath, 'backend', 'db-toolkit-backend');

  console.log('Starting backend from:', backendPath);
  
  backendProcess = spawn(backendPath, [], {
    stdio: 'inherit',
    detached: false
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log('Backend exited with code:', code);
    backendProcess = null;
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

module.exports = { startBackend, stopBackend };
