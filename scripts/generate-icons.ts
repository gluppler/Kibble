/**
 * Icon Generation Script
 * 
 * Generates PNG icons from the SVG source for PWA support.
 * Creates all required icon sizes: 192x192, 512x512, and maskable variants.
 * 
 * Usage: npm run generate:icons
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');
const SVG_PATH = join(PUBLIC_DIR, 'icon.svg');

// Icon sizes to generate
const ICON_SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-maskable-192.png', maskable: true },
  { size: 512, name: 'icon-maskable-512.png', maskable: true },
];


async function generateIcons() {
  try {
    console.log('📦 Generating PWA icons from SVG...\n');

    // Read the SVG file
    const svgBuffer = readFileSync(SVG_PATH);
    const svgString = svgBuffer.toString();

    // Generate each icon size
    for (const { size, name, maskable } of ICON_SIZES) {
      const outputPath = join(PUBLIC_DIR, name);
      
      try {
        let svgContent = svgString;
        
        // For maskable icons, create a version with safe zone padding
        // Maskable icons need 20% safe zone (padding) around the content
        // This ensures the icon has proper safe zone for adaptive icons on Android
        if (maskable) {
          // Scale content to 80% and center it to create 20% safe zone
          const scale = 0.8;
          const offset = (100 - 100 * scale) / 2;
          svgContent = svgString.replace(
            /<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" rx="4" fill="#FFFFFF"\/>/g,
            (match, x, y, width, height) => {
              const newX = parseFloat(x) * scale + offset;
              const newY = parseFloat(y) * scale + offset;
              const newWidth = parseFloat(width) * scale;
              const newHeight = parseFloat(height) * scale;
              return `<rect x="${newX}" y="${newY}" width="${newWidth}" height="${newHeight}" rx="4" fill="#FFFFFF"/>`;
            }
          );
        }

        // Convert SVG to PNG using sharp
        await sharp(Buffer.from(svgContent))
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 1 }, // Black background
          })
          .png()
          .toFile(outputPath);

        console.log(`✅ Generated ${name} (${size}x${size}${maskable ? ', maskable' : ''})`);
      } catch (error) {
        console.error(`❌ Failed to generate ${name}:`, error);
        throw error;
      }
    }

    console.log('\n✨ All icons generated successfully!');
  } catch (error) {
    console.error('\n❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the script
generateIcons();
