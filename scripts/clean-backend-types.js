const fs = require('fs');
const path = require('path');

const duplicateTypeDirs = [
  path.join(__dirname, '..', 'backend', 'node_modules', '@types', 'express'),
  path.join(__dirname, '..', 'backend', 'node_modules', '@types', 'express-serve-static-core'),
];

for (const dir of duplicateTypeDirs) {
  fs.rmSync(dir, { recursive: true, force: true });
}
