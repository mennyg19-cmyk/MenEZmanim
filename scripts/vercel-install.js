const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');

// Wipe stale cache
const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
execSync('rm -rf node_modules apps/web/node_modules packages/*/node_modules', { cwd: root, stdio: 'inherit' });

// Temporarily exclude desktop workspace only (keep db for Turso/web persistence)
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const saved = pkg.workspaces;
pkg.workspaces = ['packages/core', 'packages/ui', 'packages/db', 'apps/web'];
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

try {
  execSync('npm install', { cwd: root, stdio: 'inherit' });
  execSync('npx prisma generate', {
    cwd: path.join(root, 'packages', 'db'),
    stdio: 'inherit',
    env: { ...process.env },
  });
} finally {
  pkg.workspaces = saved;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}
