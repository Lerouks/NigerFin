import sharp from 'sharp';

const TARGET_SIZE = 95 * 1024; // safe under 100KB

interface CompressionAttempt {
  width: number;
  quality: number;
  colors: number;
}

const ATTEMPTS: CompressionAttempt[] = [
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

export interface CompressionResult {
  buffer: Buffer;
  mime: string;
  beforeBytes: number;
  afterBytes: number;
}

/**
 * Compress an image buffer with progressively more aggressive settings until
 * it falls below TARGET_SIZE (95KB), or returns the smallest result obtained.
 * Animated GIFs are returned unchanged (compression would break animation).
 */
export async function compressImageBuffer(
  buffer: Buffer,
  mime: string,
): Promise<CompressionResult> {
  const beforeBytes = buffer.length;

  // GIFs (animated) are not compressed - sharp would lose animation frames
  if (mime.includes('gif')) {
    return { buffer, mime, beforeBytes, afterBytes: beforeBytes };
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    return { buffer, mime, beforeBytes, afterBytes: beforeBytes };
  }

  const isPng = mime.includes('png') || meta.format === 'png';
  const isJpeg = mime.includes('jpeg') || mime.includes('jpg') || meta.format === 'jpeg';
  const isWebp = mime.includes('webp') || meta.format === 'webp';

  if (!isPng && !isJpeg && !isWebp) {
    return { buffer, mime, beforeBytes, afterBytes: beforeBytes };
  }

  let smallest: Buffer | null = null;

  for (const attempt of ATTEMPTS) {
    let pipeline = sharp(buffer);

    if (meta.width && meta.width > attempt.width) {
      pipeline = pipeline.resize({ width: attempt.width, withoutEnlargement: true });
    }

    let out: Buffer;
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
    } else {
      // webp
      out = await pipeline.webp({ quality: attempt.quality, effort: 6 }).toBuffer();
    }

    if (!smallest || out.length < smallest.length) smallest = out;
    if (out.length <= TARGET_SIZE) {
      return { buffer: out, mime, beforeBytes, afterBytes: out.length };
    }
  }

  // None of the attempts hit the target; return the smallest we got, but only
  // if it's actually smaller than the original (otherwise keep the original)
  if (smallest && smallest.length < beforeBytes) {
    return { buffer: smallest, mime, beforeBytes, afterBytes: smallest.length };
  }
  return { buffer, mime, beforeBytes, afterBytes: beforeBytes };
}
