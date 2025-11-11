// Root-level server wrapper for Render deployment
// This allows Render to start the server from root without needing to configure subdirectory

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting GERSL Backend from root wrapper...');
console.log('📁 Server directory:', join(__dirname, 'server'));

// Start the actual server from the server/ directory
const serverProcess = spawn('node', ['src/server.js'], {
  cwd: join(__dirname, 'server'),
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping server...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping server...');
  serverProcess.kill('SIGINT');
});
