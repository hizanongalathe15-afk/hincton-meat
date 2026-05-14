const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const serverPath = path.join(root, 'dist', 'server.js');

if (!fs.existsSync(serverPath)) {
  console.log('Compiled server not found. Building backend before start...');

  const build = spawnSync('npm', ['run', 'render-build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (build.status !== 0) {
    process.exit(build.status || 1);
  }
}

const server = spawn(process.execPath, [serverPath], {
  cwd: root,
  stdio: 'inherit',
});

const forwardSignal = (signal) => {
  if (!server.killed) {
    server.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});
