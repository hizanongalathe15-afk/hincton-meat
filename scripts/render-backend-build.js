const { spawnSync } = require('child_process');

const isYarn = /\byarn\//.test(process.env.npm_config_user_agent || '');
const command = isYarn ? 'yarn' : 'npm';
const args = isYarn
  ? ['workspace', 'hincton-backend', 'render-build']
  : ['--prefix', 'backend', 'run', 'render-build'];

const result = spawnSync(command, args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status || 0);
