#!/usr/bin/env tsx
/**
 * fetch-hq-images.ts - High-quality local card art sync
 *
 * Downloads official card images from gundam-gcg.com and stores them locally
 * under apps/web/public/card_art for fast same-origin loading.
 *
 * Usage:
 *   npm run fetch-hq-images
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CardDefinition } from '../packages/shared/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const OFFICIAL_CARD_ART_BASE = 'https://www.gundam-gcg.com/en/images/cards/card';
const PLACEHOLDER_HOST = 'placehold.co';

const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
const VARIANT_SUFFIXES = ['', '_p1', '_p2', '_p3', '_p4', '_p5'] as const;

const MIN_IMAGE_BYTES = Number(process.env.CARD_IMAGE_MIN_BYTES ?? 10_000);
const TARGET_IMAGE_MAX_BYTES = Number(process.env.CARD_IMAGE_TARGET_MAX_BYTES ?? 450_000);
const HARD_IMAGE_MAX_BYTES = Number(process.env.CARD_IMAGE_HARD_MAX_BYTES ?? 1_200_000);
const MIN_IMAGE_WIDTH = Number(process.env.CARD_IMAGE_MIN_WIDTH ?? 500);
const MIN_IMAGE_HEIGHT = Number(process.env.CARD_IMAGE_MIN_HEIGHT ?? 700);
const IDEAL_WIDTH = Number(process.env.CARD_IMAGE_IDEAL_WIDTH ?? 600);
const IDEAL_HEIGHT = Number(process.env.CARD_IMAGE_IDEAL_HEIGHT ?? 840);
const REQUEST_TIMEOUT_MS = Number(process.env.CARD_IMAGE_REQUEST_TIMEOUT_MS ?? 12_000);

type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

interface ImageBase {
  ext: ImageExtension;
  bytes: number;
  width: number;
  height: number;
}

interface ImageCandidate extends ImageBase {
  url: string;
  buffer: Buffer;
}

interface LocalImageInfo extends ImageBase {
  fullPath: string;
  localPath: string;
  valid: boolean;
}

function isPlaceholderUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.hostname === PLACEHOLDER_HOST || parsed.hostname.endsWith(`.${PLACEHOLDER_HOST}`);
  } catch {
    return value.includes(PLACEHOLDER_HOST);
  }
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null;

  const chunk = buffer.toString('ascii', 12, 16);

  if (chunk === 'VP8 ') {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (chunk === 'VP8L') {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  if (chunk === 'VP8X') {
    const width = 1 + readUInt24LE(buffer, 24);
    const height = 1 + readUInt24LE(buffer, 27);
    return { width, height };
  }

  return null;
}

function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  if (!(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)) return null;

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4) return null;
  if (!(buffer[0] === 0xff && buffer[1] === 0xd8)) return null;

  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

    if (sofMarkers.has(marker)) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    if (offset + 3 >= buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength <= 2) return null;
    offset += 2 + segmentLength;
  }

  return null;
}

function parseImageDimensions(buffer: Buffer, ext: ImageExtension): { width: number; height: number } | null {
  if (ext === 'webp') return parseWebpDimensions(buffer);
  if (ext === 'png') return parsePngDimensions(buffer);
  return parseJpegDimensions(buffer);
}

function isHighQualityImage(meta: ImageBase): boolean {
  if (meta.bytes < MIN_IMAGE_BYTES || meta.bytes > HARD_IMAGE_MAX_BYTES) return false;
  if (meta.width < MIN_IMAGE_WIDTH || meta.height < MIN_IMAGE_HEIGHT) return false;
  return true;
}

function scoreImage(meta: ImageBase): number {
  if (!isHighQualityImage(meta)) return Number.NEGATIVE_INFINITY;

  const bytesScore = Math.min(meta.bytes, TARGET_IMAGE_MAX_BYTES) / TARGET_IMAGE_MAX_BYTES;
  const pixelScore = Math.min((meta.width * meta.height) / (IDEAL_WIDTH * IDEAL_HEIGHT), 1.4);
  const oversizePenalty =
    meta.bytes > TARGET_IMAGE_MAX_BYTES
      ? ((meta.bytes - TARGET_IMAGE_MAX_BYTES) / TARGET_IMAGE_MAX_BYTES) * 0.35
      : 0;
  const formatBonus = meta.ext === 'webp' ? 0.08 : meta.ext === 'png' ? 0.03 : 0;

  return bytesScore * 0.6 + pixelScore * 0.4 - oversizePenalty + formatBonus;
}

function normalizeOfficialUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return value;
  }
}

function extFromUrl(value: string): ImageExtension | null {
  try {
    const parsed = new URL(value);
    const ext = parsed.pathname.split('.').pop()?.toLowerCase();
    if (ext && IMAGE_EXTENSIONS.includes(ext as ImageExtension)) return ext as ImageExtension;
    return null;
  } catch {
    return null;
  }
}

function getOfficialImageUrls(cardId: string, preferredUrl?: string): Array<{ url: string; ext: ImageExtension }> {
  const urls: Array<{ url: string; ext: ImageExtension }> = [];
  const seen = new Set<string>();

  const push = (url: string, ext: ImageExtension) => {
    const normalized = normalizeOfficialUrl(url);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    urls.push({ url: normalized, ext });
  };

  if (preferredUrl && preferredUrl.includes('gundam-gcg.com')) {
    const ext = extFromUrl(preferredUrl);
    if (ext) {
      push(preferredUrl, ext);
      push(`${normalizeOfficialUrl(preferredUrl)}?26013001`, ext);
    }
  }

  for (const ext of IMAGE_EXTENSIONS) {
    push(`${OFFICIAL_CARD_ART_BASE}/${cardId}.${ext}`, ext);
    push(`${OFFICIAL_CARD_ART_BASE}/${cardId}.${ext}?26013001`, ext);
  }

  for (const suffix of VARIANT_SUFFIXES) {
    if (suffix.length === 0) continue;
    for (const ext of IMAGE_EXTENSIONS) {
      push(`${OFFICIAL_CARD_ART_BASE}/${cardId}${suffix}.${ext}`, ext);
      push(`${OFFICIAL_CARD_ART_BASE}/${cardId}${suffix}.${ext}?26013001`, ext);
    }
  }

  return urls;
}

async function fetchCandidate(url: string, ext: ImageExtension): Promise<ImageCandidate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Gundam-Forge/1.0)',
      },
    });

    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('image')) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const dims = parseImageDimensions(buffer, ext);
    if (!dims) return null;

    const candidate: ImageCandidate = {
      url,
      ext,
      bytes: buffer.byteLength,
      width: dims.width,
      height: dims.height,
      buffer,
    };

    if (!isHighQualityImage(candidate)) return null;
    return candidate;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBestImage(cardId: string, preferredUrl?: string): Promise<ImageCandidate | null> {
  const urls = getOfficialImageUrls(cardId, preferredUrl);
  let best: ImageCandidate | null = null;

  for (const { url, ext } of urls) {
    const candidate = await fetchCandidate(url, ext);
    if (!candidate) continue;

    if (!best || scoreImage(candidate) > scoreImage(best)) {
      best = candidate;
    }

    if (
      candidate.ext === 'webp' &&
      candidate.width >= IDEAL_WIDTH &&
      candidate.height >= IDEAL_HEIGHT &&
      candidate.bytes <= TARGET_IMAGE_MAX_BYTES * 1.1
    ) {
      return candidate;
    }
  }

  return best;
}

async function inspectLocalVariants(cardArtDir: string, cardId: string): Promise<LocalImageInfo[]> {
  const results: LocalImageInfo[] = [];

  for (const ext of IMAGE_EXTENSIONS) {
    const fullPath = path.join(cardArtDir, `${cardId}.${ext}`);
    try {
      const buffer = await fs.readFile(fullPath);
      const dims = parseImageDimensions(buffer, ext);
      results.push({
        ext,
        bytes: buffer.byteLength,
        width: dims?.width ?? 0,
        height: dims?.height ?? 0,
        valid: Boolean(dims),
        fullPath,
        localPath: `/card_art/${cardId}.${ext}`,
      });
    } catch {
      // no local file for this extension
    }
  }

  return results;
}

async function removeFileSafe(fullPath: string): Promise<void> {
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore
  }
}

async function removeOtherVariants(cardArtDir: string, cardId: string, keepExt: ImageExtension): Promise<void> {
  await Promise.all(
    IMAGE_EXTENSIONS
      .filter((ext) => ext !== keepExt)
      .map((ext) => removeFileSafe(path.join(cardArtDir, `${cardId}.${ext}`))),
  );
}

async function main() {
  console.log('🎴 High-Quality Card Image Fetcher\n');

  const cardsPath = path.join(projectRoot, 'apps', 'web', 'lib', 'data', 'cards.json');
  const cardArtDir = path.join(projectRoot, 'apps', 'web', 'public', 'card_art');

  let cards: CardDefinition[];
  try {
    const raw = await fs.readFile(cardsPath, 'utf-8');
    cards = JSON.parse(raw);
    console.log(`✓ Loaded ${cards.length} cards`);
  } catch (error) {
    console.error(`✗ Failed to load cards: ${error}`);
    process.exit(1);
  }

  await fs.mkdir(cardArtDir, { recursive: true });

  let upgraded = 0;
  let reusedLocalHQ = 0;
  let retainedLocalFallback = 0;
  let failed = 0;
  let skippedPlaceholder = 0;
  let removedInvalidLocal = 0;
  let replacedLowQualityLocal = 0;

  const upgradedByFormat: Record<ImageExtension, number> = {
    webp: 0,
    png: 0,
    jpg: 0,
    jpeg: 0,
  };

  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    const progress = `[${i + 1}/${cards.length}]`;

    if (isPlaceholderUrl(card.imageUrl)) {
      skippedPlaceholder += 1;
      continue;
    }

    const localVariants = await inspectLocalVariants(cardArtDir, card.id);

    for (const variant of localVariants) {
      if (!variant.valid) {
        await removeFileSafe(variant.fullPath);
        removedInvalidLocal += 1;
      }
    }

    const validLocal = localVariants.filter((variant) => variant.valid);
    const bestLocalHQ = validLocal
      .filter((variant) => isHighQualityImage(variant))
      .sort((a, b) => scoreImage(b) - scoreImage(a))[0];

    if (bestLocalHQ) {
      await removeOtherVariants(cardArtDir, card.id, bestLocalHQ.ext);
      card.imageUrl = bestLocalHQ.localPath;
      reusedLocalHQ += 1;
      continue;
    }

    console.log(`${progress} ${card.id} - ${card.name}`);

    const bestRemote = await fetchBestImage(card.id, card.imageUrl);
    if (bestRemote) {
      const outputPath = path.join(cardArtDir, `${card.id}.${bestRemote.ext}`);
      await fs.writeFile(outputPath, bestRemote.buffer);
      await removeOtherVariants(cardArtDir, card.id, bestRemote.ext);

      if (validLocal.length > 0) replacedLowQualityLocal += 1;

      card.imageUrl = `/card_art/${card.id}.${bestRemote.ext}`;
      upgraded += 1;
      upgradedByFormat[bestRemote.ext] += 1;
      console.log(
        `  ✓ Saved HQ image (${bestRemote.ext}, ${bestRemote.width}x${bestRemote.height}, ${(bestRemote.bytes / 1024).toFixed(1)}KB)`,
      );
      continue;
    }

    const bestLocalFallback = validLocal.sort((a, b) => scoreImage(b) - scoreImage(a))[0];
    if (bestLocalFallback) {
      card.imageUrl = bestLocalFallback.localPath;
      retainedLocalFallback += 1;
      console.log(
        `  ⚠ Keeping lower-quality local image (${bestLocalFallback.ext}, ${bestLocalFallback.width}x${bestLocalFallback.height})`,
      );
      continue;
    }

    failed += 1;
    console.log('  ℹ No high-quality image candidate found');
  }

  try {
    await fs.writeFile(cardsPath, `${JSON.stringify(cards, null, 2)}\n`);
    console.log('\n✓ Updated cards.json');
  } catch (error) {
    console.error(`\n✗ Failed to write cards.json: ${error}`);
    process.exit(1);
  }

  console.log('\n📊 HQ Image Fetch Summary:');
  console.log(`  Total cards: ${cards.length}`);
  console.log(`  Upgraded to HQ: ${upgraded}`);
  console.log(`  Reused local HQ: ${reusedLocalHQ}`);
  console.log(`  Replaced low-quality local: ${replacedLowQualityLocal}`);
  console.log(`  Retained lower-quality local: ${retainedLocalFallback}`);
  console.log(`  Removed invalid local files: ${removedInvalidLocal}`);
  console.log(`  Skipped placeholder-only cards: ${skippedPlaceholder}`);
  console.log(`  Failed/no candidate: ${failed}`);

  if (upgraded > 0) {
    const byFormat = IMAGE_EXTENSIONS.map((ext) => `${ext}:${upgradedByFormat[ext]}`).join('  ');
    console.log(`  Formats: ${byFormat}`);
  }

  console.log('\n✅ Done!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
