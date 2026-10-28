import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const sourceLogo = path.join(publicDir, 'brand_logo.png');

if (!fs.existsSync(sourceLogo)) {
  console.error(`Source logo not found at: ${sourceLogo}`);
  process.exit(1);
}

const BG_COLOR = '#0a0a0f';

async function generateIcons() {
  console.log('Generating PWA and web icons from:', sourceLogo);

  // 1. Standard PWA icons (purpose: any)
  await sharp(sourceLogo)
    .resize(192, 192, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ pwa-192x192.png');

  await sharp(sourceLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ pwa-512x512.png');

  // 2. Maskable PWA icons (purpose: maskable) with safe-zone padding (~80% content)
  const logo154 = await sharp(sourceLogo)
    .resize(154, 154, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: logo154, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));
  console.log('✓ pwa-maskable-192x192.png');

  const logo410 = await sharp(sourceLogo)
    .resize(410, 410, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: logo410, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ pwa-maskable-512x512.png');

  // 3. Apple Touch Icon & Favicon
  await sharp(sourceLogo)
    .resize(180, 180, { fit: 'contain' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  await sharp(sourceLogo)
    .resize(64, 64, { fit: 'contain' })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
