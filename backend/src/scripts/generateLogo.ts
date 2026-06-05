//backend/src/scripts/generateLogo.ts

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const logo = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24">
  <rect x="3" y="3" width="18" height="18" rx="3" fill="#C45E3A" stroke="#1A1510" stroke-width="1.5"/>
  <rect x="7" y="7" width="4" height="4" rx="1.5" fill="#FAF7F2"/>
  <rect x="13" y="7" width="4" height="4" rx="1.5" fill="#FAF7F2"/>
  <rect x="7" y="13" width="4" height="4" rx="1.5" fill="#FAF7F2"/>
  <path d="M13 13h4v4h-4z" fill="#FAF7F2" opacity="0.5"/>
</svg>
`);

sharp(logo)
  .resize(200, 200)
  .png()
  .toFile(path.join(publicDir, 'easymenu-logo.png'))
  .then(() => console.log('Logo generated'))
  .catch(console.error);