const { execSync } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '..');

execSync('npm install --ignore-scripts', { cwd: root, stdio: 'inherit' });
execSync('npm ls next || true', { cwd: root, stdio: 'inherit' });
execSync('ls -la node_modules/ | head -20', { cwd: root, stdio: 'inherit' });
execSync('ls -la node_modules/ | grep next', { cwd: root, stdio: 'inherit' });
execSync('find node_modules -maxdepth 2 -name "next" -type d 2>/dev/null || echo "next dir not found"', { cwd: root, stdio: 'inherit' });
execSync('cat node_modules/.package-lock.json | grep -A2 \'"next"\' | head -20 || true', { cwd: root, stdio: 'inherit' });
