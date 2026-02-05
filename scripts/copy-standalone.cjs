const fs = require('fs');
const path = require('path');

const standalone = path.join(__dirname, '..', '.next', 'standalone');
const nextDir = path.join(standalone, '.next');

if (!fs.existsSync(standalone)) {
  console.error('Standalone folder not found. Run "next build" first.');
  process.exit(1);
}

const copy = (src, dest) => {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log('Copied', src, '->', dest);
  }
};

copy(path.join(__dirname, '..', '.next', 'static'), path.join(nextDir, 'static'));
copy(path.join(__dirname, '..', 'public'), path.join(standalone, 'public'));
console.log('Standalone copy done.');
