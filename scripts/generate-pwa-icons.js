import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const sourceLogo = path.join(publicDir, 'forge-mark.svg');

if (!fs.existsSync(sourceLogo)) {
  console.error(`Source logo not found at: ${sourceLogo}`);
  process.exit(1);
}

/**
 * The SVG keeps the character-card motif centered within the maskable safe
 * zone and supplies its own full-bleed charcoal background. Reuse this source
 * for every raster size so PWA, browser and Apple icons never drift apart.
 */
async function generateIcon(size, filename) {
  await sharp(sourceLogo)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(path.join(publicDir, filename));
  console.log(`✓ ${filename}`);
}

async function generateIcons() {
  console.log('Generating Roleplay Forge icons from:', sourceLogo);
  await generateIcon(192, 'pwa-192x192.png');
  await generateIcon(512, 'pwa-512x512.png');
  await generateIcon(192, 'pwa-maskable-192x192.png');
  await generateIcon(512, 'pwa-maskable-512x512.png');
  await generateIcon(180, 'apple-touch-icon.png');
  await generateIcon(64, 'favicon.png');
  await generateIcon(512, 'brand_logo.png');
  console.log('All Roleplay Forge icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
