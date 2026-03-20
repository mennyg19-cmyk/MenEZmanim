const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  fs.unlinkSync(lockPath);
  console.log('Deleted stale package-lock.json');
}

execSync('npm install --ignore-scripts', { cwd: root, stdio: 'inherit' });

const rootNext = path.join(root, 'node_modules', 'next');
const webNext = path.join(root, 'apps', 'web', 'node_modules', 'next');
console.log('root/node_modules/next exists:', fs.existsSync(rootNext));
console.log('web/node_modules/next exists:', fs.existsSync(webNext));

if (!fs.existsSync(webNext) && fs.existsSync(rootNext)) {
  fs.mkdirSync(path.join(root, 'apps', 'web', 'node_modules'), { recursive: true });
  fs.symlinkSync(rootNext, webNext);
  console.log('Symlinked next');
}

try {
  const v = JSON.parse(fs.readFileSync(path.join(fs.existsSync(webNext) ? webNext : rootNext, 'package.json'), 'utf8')).version;
  console.log('next version:', v);
} catch (e) {
  console.log('Cannot read next:', e.message);
}
