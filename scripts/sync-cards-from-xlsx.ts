#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import type { CardDefinition, CardColor, CardType } from '../packages/shared/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_INPUT_PATH = path.resolve(
  process.env.HOME || projectRoot,
  'Downloads',
  'Gundam TCG Cards.xlsx'
);

const INPUT_PATH = process.env.GUNDAM_CARDS_XLSX_PATH || DEFAULT_INPUT_PATH;
const OUTPUT_PATH = path.join(projectRoot, 'apps', 'web', 'src', 'data', 'cards.json');

const COLUMN_MAP = {
  name: 'Name',
  color: 'Color',
  rarity: 'Rarity',
  level: 'Level',
  cost: 'Cost',
  type: 'Type',
  ap: 'AP',
  hp: 'HP',
  zone: 'Zone',
  trait: 'Trait',
  link: 'Link',
  skill: 'Skill',
  source: 'Source',
  cardNo: 'Card #',
  edition: 'Edition',
} as const;

const normalizeString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text.length > 0 && text !== '-' ? text : undefined;
};

const normalizeNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeColor = (value?: string): CardColor => {
  const cleaned = (value || '').trim().toLowerCase();
  const mapping: Record<string, CardColor> = {
    blue: 'Blue',
    green: 'Green',
    red: 'Red',
    white: 'White',
    colorless: 'Colorless',
    '-': 'Colorless',
  };
  return mapping[cleaned] || 'Colorless';
};

const normalizeType = (value?: string): { type: CardType; extraTraits?: string[] } => {
  const cleaned = (value || '').trim().toUpperCase();
  const mapping: Record<string, CardType> = {
    UNIT: 'Unit',
    'UNIT TOKEN': 'Unit',
    PILOT: 'Pilot',
    COMMAND: 'Command',
    BASE: 'Base',
    RESOURCE: 'Resource',
    'EX BASE': 'Base',
    'EX RESOURCE': 'Resource',
  };

  const type = mapping[cleaned] || 'Unit';
  const extraTraits: string[] = [];
  if (cleaned.includes('TOKEN')) extraTraits.push('Token');
  if (cleaned.includes('EX')) extraTraits.push('EX');
  return { type, extraTraits: extraTraits.length > 0 ? extraTraits : undefined };
};

const normalizeTraits = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const traits = value.map((entry) => normalizeString(entry)).filter(Boolean) as string[];
    return traits.length > 0 ? traits : undefined;
  }
  const text = normalizeString(value);
  if (!text) return undefined;
  const traits = text
    .split(/[\/|,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return traits.length > 0 ? traits : undefined;
};

const normalizeEdition = (value?: string): { suffix: string; label?: string } => {
  if (!value || value === '1' || value === '1.0') return { suffix: '' };
  if (value.toUpperCase() === 'P') return { suffix: 'P', label: 'Promo' };
  if (value.includes('β') || value.toUpperCase() === 'B') return { suffix: 'B', label: 'Beta' };
  const clean = value.replace(/\s+/g, '');
  return { suffix: clean, label: `Edition ${clean}` };
};

const normalizeCardNumber = (value: unknown): string => {
  let text = normalizeString(value) || '';
  if (text.endsWith('.0')) text = text.slice(0, -2);
  if (/^\d+$/.test(text)) {
    if (text.length < 3) return text.padStart(3, '0');
    return text;
  }
  return text;
};

const buildPlaceholderArt = (name: string): string => {
  const encoded = encodeURIComponent(name || 'Card');
  return `https://placehold.co/600x840/1f2937/f9fafb?text=${encoded}`;
};

const buildSetLabel = (source: string, editionLabel?: string): string => {
  if (editionLabel) return `${source} - ${editionLabel}`;
  return source;
};

const toCardDefinition = (row: Record<string, unknown>): CardDefinition | null => {
  const name = normalizeString(row[COLUMN_MAP.name]);
  const source = normalizeString(row[COLUMN_MAP.source]);
  const cardNo = normalizeCardNumber(row[COLUMN_MAP.cardNo]);
  const edition = normalizeString(row[COLUMN_MAP.edition]);

  if (!name || !source || !cardNo) return null;

  const { suffix, label } = normalizeEdition(edition);
  const id = `${source}-${cardNo}${suffix}`;

  const colorRaw = normalizeString(row[COLUMN_MAP.color]);
  const typeRaw = normalizeString(row[COLUMN_MAP.type]);
  const { type, extraTraits } = normalizeType(typeRaw);

  const traits = normalizeTraits(row[COLUMN_MAP.trait]);
  const mergedTraits = [...(traits || []), ...(extraTraits || [])];

  const cost = normalizeNumber(row[COLUMN_MAP.cost]) ?? 0;
  const level = normalizeNumber(row[COLUMN_MAP.level]);
  const ap = normalizeNumber(row[COLUMN_MAP.ap]);
  const hp = normalizeNumber(row[COLUMN_MAP.hp]);

  const text = normalizeString(row[COLUMN_MAP.skill]);
  const linkCondition = normalizeString(row[COLUMN_MAP.link]);
  const zone = normalizeString(row[COLUMN_MAP.zone]);
  const rarity = normalizeString(row[COLUMN_MAP.rarity]);

  return {
    id,
    name,
    color: normalizeColor(colorRaw),
    cost,
    type,
    set: buildSetLabel(source, label),
    text,
    ap: ap ?? 0,
    hp: hp ?? 0,
    level,
    traits: mergedTraits.length > 0 ? mergedTraits : undefined,
    zone,
    linkCondition,
    placeholderArt: buildPlaceholderArt(name),
    imageUrl: undefined,
    price: undefined,
    ...(rarity ? { rarity } : {}),
  };
};

const main = async () => {
  console.log('📥 Syncing cards from XLSX');
  console.log(`  Input: ${INPUT_PATH}`);

  const workbook = xlsx.readFile(INPUT_PATH);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No sheets found in XLSX file.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const cards: CardDefinition[] = [];
  const skipped: Array<{ index: number; reason: string }> = [];

  rows.forEach((row, index) => {
    const card = toCardDefinition(row);
    if (!card) {
      skipped.push({ index: index + 2, reason: 'Missing required fields' });
      return;
    }
    cards.push(card);
  });

  const byId = new Map<string, CardDefinition>();
  for (const card of cards) {
    byId.set(card.id, card);
  }

  const deduped = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(deduped, null, 2) + '\n');

  console.log(`✅ Wrote ${deduped.length} cards to ${OUTPUT_PATH}`);
  if (skipped.length > 0) {
    console.log(`⚠️  Skipped ${skipped.length} rows with missing required fields.`);
  }
};

main().catch((error) => {
  console.error('❌ XLSX sync failed:', error);
  process.exit(1);
});
