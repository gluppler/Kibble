# PWA Icons Required

The following icon files need to be created and placed in the `/public` directory for full PWA support:

## Required Icons

1. **icon-192.png** - 192x192 pixels
   - Standard app icon for Android
   - Used in manifest.json

2. **icon-512.png** - 512x512 pixels
   - High-resolution app icon
   - Used in manifest.json and install prompts

3. **icon-maskable-192.png** - 192x192 pixels (maskable)
   - Icon with safe zone for Android adaptive icons
   - Should have important content within the center 80% (safe zone)

4. **icon-maskable-512.png** - 512x512 pixels (maskable)
   - High-resolution maskable icon
   - Should have important content within the center 80% (safe zone)

## Icon Design Guidelines

- **Colors**: Black and white only (matching Kibble's design system)
- **Format**: PNG with transparency
- **Style**: Minimalist, matching the Kibble brand
- **Safe Zone**: For maskable icons, keep important content within 80% of the icon area

## Current Status

- ✅ `icon.svg` - Already exists
- ❌ `icon-192.png` - Needs to be created
- ❌ `icon-512.png` - Needs to be created
- ❌ `icon-maskable-192.png` - Needs to be created
- ❌ `icon-maskable-512.png` - Needs to be created

## Tools for Creating Icons

You can use tools like:
- Figma
- Adobe Illustrator
- Online icon generators
- Image editing software (GIMP, Photoshop, etc.)

The icons should be based on the existing `icon.svg` design.
