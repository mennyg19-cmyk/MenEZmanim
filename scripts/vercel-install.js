const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');

const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);

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
