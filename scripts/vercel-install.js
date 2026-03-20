const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const saved = pkg.workspaces;
pkg.workspaces = ['packages/core', 'packages/ui', 'apps/web'];
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

try {
  execSync('npm install', { cwd: root, stdio: 'inherit' });
} finally {
  pkg.workspaces = saved;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

const webDir = path.join(root, 'apps', 'web');
const webNm = path.join(webDir, 'node_modules');
const rootNm = path.join(root, 'node_modules');
const rootNext = path.join(rootNm, 'next');
const webNext = path.join(webNm, 'next');

console.log('\n=== DEBUG: Post-install state ===');
console.log('root:', root);
console.log('root/node_modules exists:', fs.existsSync(rootNm));
console.log('root/node_modules/next exists:', fs.existsSync(rootNext));
console.log('apps/web/node_modules exists:', fs.existsSync(webNm));
console.log('apps/web/node_modules/next exists:', fs.existsSync(webNext));

if (fs.existsSync(webNm)) {
  console.log('apps/web/node_modules contents:', fs.readdirSync(webNm).slice(0, 20));
}
if (fs.existsSync(rootNm)) {
  const items = fs.readdirSync(rootNm).filter(f => !f.startsWith('.'));
  console.log('root/node_modules contents (' + items.length + '):', items.slice(0, 30));
}

if (fs.existsSync(rootNext) && !fs.existsSync(webNext)) {
  fs.mkdirSync(webNm, { recursive: true });
  fs.symlinkSync(rootNext, webNext);
  console.log('Created symlink: apps/web/node_modules/next -> root/node_modules/next');
}

console.log('FINAL: apps/web/node_modules/next exists:', fs.existsSync(path.join(webNm, 'next')));
try {
  const v = JSON.parse(fs.readFileSync(path.join(webNm, 'next', 'package.json'), 'utf8')).version;
  console.log('FINAL: next version:', v);
} catch (e) {
  console.log('FINAL: could not read next version:', e.message);
}
console.log('=== END DEBUG ===\n');
