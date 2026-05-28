#!/usr/bin/env node
/**
 * Compresse en place les images statiques de public/ pour le SEO et la performance.
 * - PNG: palette quantization (pngquant-like) + zlib max
 * - JPEG: mozjpeg progressive q=85
 * Garde le format et le path d'origine, donc aucun changement code requis.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Format: { src, maxWidth? } — maxWidth caps the source resolution to 1.5x retina display.
const TARGETS = [
  { src: 'premium/article-premium.png', maxWidth: 900 },
  { src: 'premium/outil-budget.png', maxWidth: 900 },
  { src: 'premium/marches.png', maxWidth: 900 },
  { src: 'images/mockup-phone.png', maxWidth: 800 },
  { src: 'newsletter/citation-001-schweitzer.jpeg', maxWidth: 1080 },
  { src: 'og-image.png', maxWidth: 1200 },
  { src: 'logo-white.png' },
  { src: 'logo-about.png' },
  { src: 'card-logos.png' },
  { src: 'amana-logo.png' },
  { src: 'nita-logo.png' },
];

async function optimize({ src: relPath, maxWidth }) {
  const filePath = path.join(PUBLIC_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP missing: ${relPath}`);
    return null;
  }

  const before = fs.statSync(filePath).size;
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let pipeline = sharp(buffer);

  if (maxWidth) {
    const meta = await sharp(buffer).metadata();
    if (meta.width && meta.width > maxWidth) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }
  }

  if (ext === '.png') {
    pipeline = pipeline.png({
      quality: 88,
      compressionLevel: 9,
      effort: 10,
      palette: true,
    });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({
      quality: 85,
      mozjpeg: true,
      progressive: true,
    });
  } else {
    console.log(`SKIP unsupported: ${relPath}`);
    return null;
  }

  const optimized = await pipeline.toBuffer();

  if (optimized.length >= before) {
    console.log(`KEEP ${relPath}: already optimal (${(before / 1024).toFixed(1)} KB)`);
    return { relPath, before, after: before, savedBytes: 0 };
  }

  fs.writeFileSync(filePath, optimized);
  const savedPct = ((before - optimized.length) / before) * 100;
  console.log(
    `OK   ${relPath}: ${(before / 1024).toFixed(1)} KB -> ${(optimized.length / 1024).toFixed(1)} KB (-${savedPct.toFixed(1)}%)`
  );
  return { relPath, before, after: optimized.length, savedBytes: before - optimized.length };
}

(async () => {
  let totalBefore = 0;
  let totalAfter = 0;
  for (const target of TARGETS) {
    const result = await optimize(target);
    if (result) {
      totalBefore += result.before;
      totalAfter += result.after;
    }
  }
  const totalSavedKB = (totalBefore - totalAfter) / 1024;
  const totalPct = totalBefore > 0 ? ((totalBefore - totalAfter) / totalBefore) * 100 : 0;
  console.log(`\nTOTAL: ${(totalBefore / 1024).toFixed(1)} KB -> ${(totalAfter / 1024).toFixed(1)} KB (saved ${totalSavedKB.toFixed(1)} KB, ${totalPct.toFixed(1)}%)`);
})();
