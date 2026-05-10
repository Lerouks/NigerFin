#!/usr/bin/env node
/**
 * Compresse en place toutes les images > 100KB dans le bucket article-images.
 * - PNG: palette quantization (pngquant-like) + zlib max + downscale max 1600px
 * - JPEG: mozjpeg progressive q=82 + downscale max 1600px
 * Garde le format et le path d'origine, donc aucun changement code requis.
 *
 * Usage: node scripts/compress-supabase-images.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local manually (no dependency on dotenv)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const BUCKET = 'article-images';
const SIZE_THRESHOLD = 100 * 1024;
const MAX_WIDTH = 1600;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listAllFiles(folder = '', acc = []) {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 1000,
    offset: 0,
  });
  if (error) throw error;
  for (const item of data) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id) {
      acc.push({ path: fullPath, size: item.metadata?.size ?? 0, mime: item.metadata?.mimetype ?? '' });
    } else {
      // It's a folder, recurse
      await listAllFiles(fullPath, acc);
    }
  }
  return acc;
}

/**
 * Iterative compression: tries progressively more aggressive settings
 * (lower quality, smaller width) until the result is under TARGET_SIZE
 * or all attempts have been exhausted.
 */
async function compressImage(buffer, mime) {
  const meta = await sharp(buffer).metadata();
  const isPng = mime.includes('png') || meta.format === 'png';
  const isJpeg = mime.includes('jpeg') || mime.includes('jpg') || meta.format === 'jpeg';
  const isWebp = mime.includes('webp') || meta.format === 'webp';

  // Progressive attempts: each is more aggressive than the previous
  // (lower quality + smaller width). The first attempt that lands below
  // TARGET_SIZE wins. Otherwise, return the smallest result obtained.
  const TARGET_SIZE = 95 * 1024; // safe under 100KB
  const attempts = [
    { width: 1600, quality: 88, colors: 256 },
    { width: 1400, quality: 85, colors: 256 },
    { width: 1200, quality: 82, colors: 256 },
    { width: 1000, quality: 78, colors: 256 },
    { width: 1000, quality: 75, colors: 128 },
    { width: 900, quality: 72, colors: 128 },
    { width: 800, quality: 70, colors: 128 },
    { width: 800, quality: 68, colors: 64 },
    { width: 700, quality: 65, colors: 64 },
  ];

  let smallest = null;

  for (const attempt of attempts) {
    let pipeline = sharp(buffer);

    if (meta.width && meta.width > attempt.width) {
      pipeline = pipeline.resize({ width: attempt.width, withoutEnlargement: true });
    }

    let out;
    if (isPng) {
      out = await pipeline
        .png({
          quality: attempt.quality,
          compressionLevel: 9,
          effort: 10,
          palette: true,
          colors: attempt.colors,
        })
        .toBuffer();
    } else if (isJpeg) {
      out = await pipeline
        .jpeg({ quality: attempt.quality, mozjpeg: true, progressive: true })
        .toBuffer();
    } else if (isWebp) {
      out = await pipeline.webp({ quality: attempt.quality, effort: 6 }).toBuffer();
    } else {
      return null;
    }

    if (!smallest || out.length < smallest.length) smallest = out;
    if (out.length <= TARGET_SIZE) return out;
  }

  return smallest;
}

(async () => {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no upload)' : 'LIVE'}`);
  console.log(`Bucket: ${BUCKET}, threshold: ${SIZE_THRESHOLD / 1024} KB, max width: ${MAX_WIDTH}px\n`);

  console.log('Listing files in bucket...');
  const files = await listAllFiles();
  console.log(`Total files: ${files.length}\n`);

  const targets = files.filter((f) => f.size > SIZE_THRESHOLD && /^image\/(jpeg|png|webp|jpg)/.test(f.mime));
  console.log(`Files > ${SIZE_THRESHOLD / 1024} KB: ${targets.length}`);
  for (const t of targets) {
    console.log(`  ${(t.size / 1024).toFixed(1).padStart(8)} KB  ${t.path}  (${t.mime})`);
  }
  console.log();

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const target of targets) {
    try {
      const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(target.path);
      if (dlErr || !blob) throw dlErr || new Error('No blob');

      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const before = buffer.length;

      const compressed = await compressImage(buffer, target.mime);
      if (!compressed) {
        console.log(`SKIP unsupported  ${target.path}`);
        skipped++;
        continue;
      }

      const after = compressed.length;
      const savedPct = ((before - after) / before) * 100;

      if (after >= before) {
        console.log(`KEEP   ${target.path}: already optimal (${(before / 1024).toFixed(1)} KB)`);
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`DRY    ${target.path}: ${(before / 1024).toFixed(1)} -> ${(after / 1024).toFixed(1)} KB (-${savedPct.toFixed(1)}%)`);
      } else {
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(target.path, compressed, {
          contentType: target.mime,
          upsert: true,
          cacheControl: '31536000',
        });
        if (upErr) throw upErr;
        console.log(`OK     ${target.path}: ${(before / 1024).toFixed(1)} -> ${(after / 1024).toFixed(1)} KB (-${savedPct.toFixed(1)}%)`);
      }

      totalBefore += before;
      totalAfter += after;
      processed++;
    } catch (e) {
      console.log(`ERROR  ${target.path}: ${e.message || e}`);
      errors++;
    }
  }

  console.log(`\nSummary: ${processed} processed, ${skipped} skipped, ${errors} errors`);
  if (totalBefore > 0) {
    console.log(`Saved: ${((totalBefore - totalAfter) / 1024).toFixed(1)} KB (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%)`);
  }
})();
