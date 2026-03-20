const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

execSync('npm install --ignore-scripts', { cwd: root, stdio: 'inherit' });

console.log('\n=== DEBUG ===');
const fs = require('fs');
const rootNm = path.join(root, 'node_modules');
const webNm = path.join(root, 'apps', 'web', 'node_modules');

const rootItems = fs.readdirSync(rootNm).filter(f => !f.startsWith('.'));
console.log('root/node_modules count:', rootItems.length);
console.log('root/node_modules has next:', fs.existsSync(path.join(rootNm, 'next')));

if (fs.existsSync(webNm)) {
  const webItems = fs.readdirSync(webNm).filter(f => !f.startsWith('.'));
  console.log('web/node_modules count:', webItems.length);
  console.log('web/node_modules has next:', fs.existsSync(path.join(webNm, 'next')));
  console.log('web/node_modules contents:', webItems.slice(0, 10));
} else {
  console.log('web/node_modules does not exist');
}

const nextPath = path.join(webNm, 'next');
if (!fs.existsSync(nextPath)) {
  const rootNext = path.join(rootNm, 'next');
  if (fs.existsSync(rootNext)) {
    fs.mkdirSync(webNm, { recursive: true });
    fs.symlinkSync(rootNext, nextPath);
    console.log('Created symlink for next');
  } else {
    console.log('ERROR: next not found anywhere!');
    console.log('Looking for next-like packages...');
    rootItems.filter(i => i.includes('next')).forEach(i => console.log(' ', i));
  }
}

try {
  const v = JSON.parse(fs.readFileSync(path.join(nextPath, 'package.json'), 'utf8')).version;
  console.log('next version:', v);
} catch (e) {
  console.log('Cannot read next version:', e.message);
}
console.log('=== END ===\n');
