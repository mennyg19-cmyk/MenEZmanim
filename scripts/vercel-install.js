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

const webNm = path.join(root, 'apps', 'web', 'node_modules');
const rootNext = path.join(root, 'node_modules', 'next');
const webNext = path.join(webNm, 'next');

if (fs.existsSync(rootNext) && !fs.existsSync(webNext)) {
  fs.mkdirSync(webNm, { recursive: true });
  fs.symlinkSync(rootNext, webNext);
  console.log('Linked next into apps/web/node_modules');
}
