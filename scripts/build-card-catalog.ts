#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import type { CardColor, CardDefinition, CardType } from '../packages/shared/src/types';

type JsonRecord = Record<string, unknown>;

const ROOT = process.cwd();
const SOURCE_CARDS_PATH = path.join(ROOT, 'apps', 'web', 'lib', 'data', 'cards.json');
const CARD_ART_DIR = path.join(ROOT, 'apps', 'web', 'public', 'card_art');
const OUTPUT_LIB_PATH = path.join(ROOT, 'apps', 'web', 'lib', 'data', 'cards.catalog.json');
const OUTPUT_PUBLIC_PATH = path.join(ROOT, 'apps', 'web', 'public', 'data', 'cards.catalog.json');

const PLACEHOLDER_HOST = 'placehold.co';
const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

const VALID_COLORS: CardColor[] = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const VALID_TYPES: CardType[] = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const LOW_QUALITY_CARD_IDS = new Set(['ST02-005B', 'ST02-010B']);

function isObject(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalizeId(value: unknown): string | undefined {
  const id = asString(value)?.toUpperCase();
  return id;
}

function normalizeColor(value: unknown): CardColor {
  const color = asString(value);
  if (color && VALID_COLORS.includes(color as CardColor)) {
    return color as CardColor;
  }
  return 'Colorless';
}

function normalizeType(card: JsonRecord): CardType {
  const type = asString(card.type);
  if (type && VALID_TYPES.includes(type as CardType)) {
    return type as CardType;
  }

  const ap = asNumber(card.ap);
  const hp = asNumber(card.hp);
  if (Number.isFinite(ap) || Number.isFinite(hp)) {
    return 'Unit';
  }

  const name = asString(card.name)?.toLowerCase() ?? '';
  if (name.includes('resource')) return 'Resource';
  if (name.includes('base')) return 'Base';
  return 'Command';
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

function readImageHeader(filePath: string, bytes: number): Buffer | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(bytes);
    const read = fs.readSync(fd, buffer, 0, bytes, 0);
    fs.closeSync(fd);
    return buffer.subarray(0, read);
  } catch {
    return null;
  }
}

function isValidImageFile(filePath: string, ext: ImageExtension): boolean {
  const header = readImageHeader(filePath, 16);
  if (!header || header.length < 4) return false;

  if (ext === 'webp') {
    return (
      header.length >= 12 &&
      header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  if (ext === 'png') {
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    );
  }

  return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
}

function resolveLocalImage(id: string): string | undefined {
  for (const ext of IMAGE_EXTENSIONS) {
    const fullPath = path.join(CARD_ART_DIR, `${id}.${ext}`);
    if (isValidImageFile(fullPath, ext)) {
      return `/card_art/${id}.${ext}`;
    }
  }
  return undefined;
}

function normalizedText(value: unknown): string | undefined {
  const text = asString(value);
  return text ? text.replace(/\s+/g, ' ') : undefined;
}

function normalizeTraits(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const traits = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
  if (traits.length === 0) return undefined;
  return Array.from(new Set(traits));
}

function scoreCard(card: CardDefinition): number {
  let score = 0;
  if (card.text && card.text.length > 0) score += 2;
  if (card.traits && card.traits.length > 0) score += 1;
  if (typeof card.ap === 'number') score += 1;
  if (typeof card.hp === 'number') score += 1;
  return score;
}

function parseCard(record: JsonRecord): CardDefinition | undefined {
  const id = normalizeId(record.id);
  if (!id) return undefined;
  if (LOW_QUALITY_CARD_IDS.has(id)) return undefined;

  const imageUrl = resolveLocalImage(id);
  if (!imageUrl) return undefined;

  const sourceImage = asString(record.imageUrl);
  if (sourceImage && isPlaceholderUrl(sourceImage)) return undefined;

  const name = asString(record.name) ?? id;
  const set = asString(record.set) ?? 'Unknown';
  const cost = asNumber(record.cost) ?? 0;
  const level = asNumber(record.level);
  const ap = asNumber(record.ap);
  const hp = asNumber(record.hp);
  const apModifier = asNumber(record.apModifier);
  const hpModifier = asNumber(record.hpModifier);
  const power = asNumber(record.power);

  return {
    id,
    name,
    color: normalizeColor(record.color),
    type: normalizeType(record),
    cost: Math.max(0, Math.floor(cost)),
    set,
    text: normalizedText(record.text),
    ap,
    hp,
    level,
    traits: normalizeTraits(record.traits),
    zone: asString(record.zone),
    linkCondition: asString(record.linkCondition),
    apModifier,
    hpModifier,
    power,
    imageUrl,
  };
}

function writeJson(filePath: string, payload: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function main(): void {
  const raw = fs.readFileSync(SOURCE_CARDS_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('cards.json root must be an array');
  }

  let invalid = 0;
  let noLocalImage = 0;
  let placeholderSkipped = 0;

  const byId = new Map<string, CardDefinition>();

  for (const item of parsed) {
    if (!isObject(item)) {
      invalid += 1;
      continue;
    }

    const id = normalizeId(item.id);
    if (!id) {
      invalid += 1;
      continue;
    }

    const sourceImage = asString(item.imageUrl);
    if (sourceImage && isPlaceholderUrl(sourceImage)) {
      placeholderSkipped += 1;
      continue;
    }

    const card = parseCard(item);
    if (!card) {
      noLocalImage += 1;
      continue;
    }

    const existing = byId.get(card.id);
    if (!existing || scoreCard(card) > scoreCard(existing)) {
      byId.set(card.id, card);
    }
  }

  const cards = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));

  writeJson(OUTPUT_LIB_PATH, cards);
  writeJson(OUTPUT_PUBLIC_PATH, cards);

  console.log(`Built card catalog: ${cards.length} cards`);
  console.log(`Skipped placeholder image records: ${placeholderSkipped}`);
  console.log(`Skipped missing/invalid local art records: ${noLocalImage}`);
  console.log(`Skipped malformed records: ${invalid}`);
  console.log(`Wrote ${OUTPUT_LIB_PATH}`);
  console.log(`Wrote ${OUTPUT_PUBLIC_PATH}`);
}

main();
