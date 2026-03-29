#!/usr/bin/env tsx
/**
 * merge-official-cards.ts
 *
 * Merges the enriched backup catalog into cards.json, adding all cards that
 * exist in the backup but are missing from the current database.
 *
 * Also updates imageUrl on any existing card that still has a placeholder.
 *
 * Run: tsx scripts/merge-official-cards.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CARDS_PATH = path.join(ROOT, 'apps', 'web', 'lib', 'data', 'cards.json');
const BACKUP_PATH = path.join(ROOT, 'apps', 'web', 'lib', 'data', 'cards.catalog.backup.json');
const CARD_ART_DIR = path.join(ROOT, 'apps', 'web', 'public', 'card_art');
const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;

interface CardRecord {
  id: string;
  name: string;
  color: string;
  cost: number;
  type: string;
  set: string;
  text?: string;
  ap?: number;
  hp?: number;
  level?: number;
  traits?: string[];
  zone?: string;
  linkCondition?: string;
  placeholderArt?: string;
  rarity?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

function buildPlaceholderArt(name: string): string {
  return `https://placehold.co/600x840/1f2937/f9fafb?text=${encodeURIComponent(name || 'Card')}`;
}

function resolveLocalImage(id: string): string | undefined {
  for (const ext of IMAGE_EXTENSIONS) {
    const p = path.join(CARD_ART_DIR, `${id}.${ext}`);
    if (fs.existsSync(p)) return `/card_art/${id}.${ext}`;
  }
  return undefined;
}

/** Strip enrichment-only fields that belong in the catalog layer, not cards.json */
function toCardRecord(raw: Record<string, unknown>): CardRecord {
  const id = String(raw.id ?? '').toUpperCase();
  const name = String(raw.name ?? id);
  const localImage = resolveLocalImage(id);
  const imageUrl = localImage ?? (raw.imageUrl as string | undefined);

  return {
    id,
    name,
    color: (raw.color as string) || 'Colorless',
    cost: typeof raw.cost === 'number' ? raw.cost : 0,
    type: (raw.type as string) || 'Unit',
    set: (raw.set as string) || 'Unknown',
    ...(raw.text != null ? { text: raw.text as string } : {}),
    ...(raw.ap != null ? { ap: raw.ap as number } : {}),
    ...(raw.hp != null ? { hp: raw.hp as number } : {}),
    ...(raw.level != null ? { level: raw.level as number } : {}),
    ...(Array.isArray(raw.traits) && raw.traits.length > 0 ? { traits: raw.traits as string[] } : {}),
    ...(raw.zone != null ? { zone: raw.zone as string } : {}),
    ...(raw.linkCondition != null ? { linkCondition: raw.linkCondition as string } : {}),
    ...(raw.rarity != null ? { rarity: raw.rarity as string } : {}),
    placeholderArt: buildPlaceholderArt(name),
    ...(imageUrl ? { imageUrl } : {}),
  };
}

function main() {
  const current: CardRecord[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  const backup: Record<string, unknown>[] = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));

  const currentById = new Map(current.map((c) => [c.id, c]));

  let added = 0;
  let imageUpdated = 0;
  let skipped = 0;

  for (const raw of backup) {
    const id = String(raw.id ?? '').toUpperCase();
    if (!id) { skipped++; continue; }

    // Only accept cards with a known local image OR a valid non-placeholder imageUrl
    const localImage = resolveLocalImage(id);
    const rawImage = raw.imageUrl as string | undefined;
    const hasValidImage = !!localImage || (rawImage && !rawImage.includes('placehold.co'));
    if (!hasValidImage) { skipped++; continue; }

    if (!currentById.has(id)) {
      // New card — add it
      const card = toCardRecord(raw);
      current.push(card);
      currentById.set(id, card);
      added++;
    } else {
      // Existing card — patch imageUrl if it's currently a placeholder
      const existing = currentById.get(id)!;
      if (!existing.imageUrl || existing.imageUrl.includes('placehold.co')) {
        existing.imageUrl = localImage ?? rawImage;
        imageUpdated++;
      }
    }
  }

  // Sort by ID for consistent diffs
  current.sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(CARDS_PATH, JSON.stringify(current, null, 2) + '\n', 'utf8');

  console.log(`✅ Merge complete`);
  console.log(`   Added:          ${added} new cards`);
  console.log(`   Image updated:  ${imageUpdated} existing cards`);
  console.log(`   Skipped:        ${skipped} (no image)`);
  console.log(`   Total cards.json: ${current.length}`);
}

main();
