#!/usr/bin/env node

/**
 * Validate Cards Database
 *
 * Validates and optionally fixes card data used by the Next.js frontend.
 *
 * Usage:
 *   npx ts-node scripts/validate-cards.ts
 *   npx ts-node scripts/validate-cards.ts --file apps/web/lib/data/cards.json
 *   npx ts-node scripts/validate-cards.ts --fix
 *   npx ts-node scripts/validate-cards.ts --fix --verbose
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationOptions {
  filePath?: string;
  fix?: boolean;
  verbose?: boolean;
}

interface ValidationIssue {
  cardId: string;
  errors: string[];
}

interface FixStats {
  duplicatesRemoved: number;
  imageUrlsNormalized: number;
  localImageFilesInvalid: number;
  cardsWithNoImageSource: number;
  cardsTrimmed: number;
  cardsDropped: number;
}

type CardRecord = Record<string, unknown>;

const VALID_COLORS = new Set(['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless']);
const VALID_TYPES = new Set(['Unit', 'Pilot', 'Command', 'Base', 'Resource']);
const CARD_ID_PATTERN = /^[A-Z0-9]+-\d{3,4}[A-Z]?$/;
const LOCAL_IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
type LocalImageExtension = (typeof LOCAL_IMAGE_EXTENSIONS)[number];

const parseArgs = (): ValidationOptions => {
  const args = process.argv.slice(2);
  return {
    filePath: args.includes('--file') ? args[args.indexOf('--file') + 1] : undefined,
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose'),
  };
};

const toAbsolute = (filePath: string): string => path.resolve(process.cwd(), filePath);

const loadJsonFile = (filePath: string): unknown[] => {
  const fullPath = toAbsolute(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error('JSON root must be an array of cards');
  }
  return parsed;
};

const writeJsonFile = (filePath: string, data: unknown[]): void => {
  const fullPath = toAbsolute(filePath);
  fs.writeFileSync(fullPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
};

const isObject = (value: unknown): value is CardRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeText = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
};

const normalizeId = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
};

const normalizeString = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const stripQueryAndHash = (url: string): string => {
  const noHash = url.split('#')[0];
  return noHash.split('?')[0];
};

const isKnownCardRemote = (imageUrl: string): boolean => {
  try {
    const url = new URL(imageUrl);
    return (
      url.hostname === 'www.gundam-gcg.com' ||
      url.hostname === 'gundam-gcg.com' ||
      url.hostname === 'exburst.dev'
    );
  } catch {
    return false;
  }
};

const hasNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasImageSource = (card: CardRecord): boolean =>
  hasNonEmptyString(card.imageUrl) || hasNonEmptyString(card.placeholderArt);

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readImageHeader = (filePath: string, bytes: number): Buffer | null => {
  if (!fs.existsSync(filePath)) return null;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(bytes);
    const bytesRead = fs.readSync(fd, buffer, 0, bytes, 0);
    fs.closeSync(fd);
    return buffer.subarray(0, bytesRead);
  } catch {
    return null;
  }
};

const isValidLocalImageFile = (filePath: string, ext: LocalImageExtension): boolean => {
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

  // JPEG signature (both .jpg and .jpeg)
  return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
};

const parseLocalImageRef = (imageUrl: string): { id: string; ext: LocalImageExtension } | null => {
  const clean = stripQueryAndHash(imageUrl);
  const match = clean.match(/^\/card_art\/([^/]+)\.(webp|png|jpg|jpeg)$/i);
  if (!match) return null;
  return {
    id: match[1],
    ext: match[2].toLowerCase() as LocalImageExtension,
  };
};

const resolveLocalImagePath = (cardId: string, cardArtDir: string): string | null => {
  for (const ext of LOCAL_IMAGE_EXTENSIONS) {
    const localPath = path.join(cardArtDir, `${cardId}.${ext}`);
    if (isValidLocalImageFile(localPath, ext)) {
      return `/card_art/${cardId}.${ext}`;
    }
  }
  return null;
};

const getLocalImageExtension = (imageUrl: string, cardId: string): LocalImageExtension | null => {
  const safeCardId = escapeRegExp(cardId);
  const match = imageUrl.match(new RegExp(`^/card_art/${safeCardId}\\.(webp|png|jpg|jpeg)$`, 'i'));
  return (match?.[1]?.toLowerCase() as LocalImageExtension | undefined) ?? null;
};

const cardCompletenessScore = (card: CardRecord): number => {
  const fields = ['name', 'color', 'type', 'set', 'text', 'imageUrl', 'placeholderArt', 'price'];
  return fields.reduce((score, key) => {
    const value = card[key];
    if (Array.isArray(value)) return score + (value.length > 0 ? 1 : 0);
    if (typeof value === 'object' && value !== null) return score + 1;
    if (typeof value === 'number') return score + 1;
    if (hasNonEmptyString(value)) return score + 1;
    return score;
  }, 0);
};

const imagePreferenceScore = (card: CardRecord, cardId: string): number => {
  const imageUrl = hasNonEmptyString(card.imageUrl) ? card.imageUrl : '';
  const localExt = getLocalImageExtension(imageUrl, cardId);
  if (localExt === 'webp') return 5;
  if (localExt === 'png') return 4.8;
  if (localExt === 'jpg' || localExt === 'jpeg') return 4.6;
  if (imageUrl.startsWith('/card_art/')) return 4;
  if (isKnownCardRemote(imageUrl)) return 3;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return 2;
  if (hasNonEmptyString(card.placeholderArt)) return 1;
  return 0;
};

const mergeCards = (primary: CardRecord, secondary: CardRecord): CardRecord => {
  const merged: CardRecord = { ...primary };

  for (const [key, value] of Object.entries(secondary)) {
    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      merged[key] = value;
    }
  }

  const aTraits = Array.isArray(primary.traits) ? primary.traits.filter((t) => typeof t === 'string') : [];
  const bTraits = Array.isArray(secondary.traits) ? secondary.traits.filter((t) => typeof t === 'string') : [];
  if (aTraits.length > 0 || bTraits.length > 0) {
    merged.traits = Array.from(new Set([...aTraits, ...bTraits]));
  }

  return merged;
};

const choosePreferredCard = (a: CardRecord, b: CardRecord, cardId: string): CardRecord => {
  const imageA = imagePreferenceScore(a, cardId);
  const imageB = imagePreferenceScore(b, cardId);
  if (imageA !== imageB) return imageA > imageB ? a : b;

  const completeA = cardCompletenessScore(a);
  const completeB = cardCompletenessScore(b);
  if (completeA !== completeB) return completeA > completeB ? a : b;

  return a;
};

const normalizeCardFields = (card: CardRecord): { next: CardRecord; touched: boolean } => {
  const next: CardRecord = { ...card };
  let touched = false;

  const id = normalizeId(next.id);
  if (id !== next.id) {
    next.id = id;
    touched = true;
  }

  const name = normalizeString(next.name);
  if (name !== next.name) {
    next.name = name;
    touched = true;
  }

  const set = normalizeString(next.set);
  if (set !== next.set) {
    next.set = set;
    touched = true;
  }

  const color = normalizeString(next.color);
  if (color !== next.color) {
    next.color = color;
    touched = true;
  }

  if (!hasNonEmptyString(next.color)) {
    // Fallback for tokens/resources that omit color in source data.
    next.color = 'Colorless';
    touched = true;
  }

  const type = normalizeString(next.type);
  if (type !== next.type) {
    next.type = type;
    touched = true;
  }

  if (!hasNonEmptyString(next.type)) {
    // Infer type for sparse records (common in token/resource support cards).
    const ap = Number(next.ap);
    const hp = Number(next.hp);
    if (Number.isFinite(ap) || Number.isFinite(hp)) {
      next.type = 'Unit';
      touched = true;
    } else if (hasNonEmptyString(next.name) && /resource/i.test(next.name)) {
      next.type = 'Resource';
      touched = true;
    }
  }

  const text = normalizeText(next.text);
  if (text !== next.text) {
    next.text = text;
    touched = true;
  }

  const imageUrl = normalizeString(next.imageUrl);
  if (imageUrl !== next.imageUrl) {
    next.imageUrl = imageUrl;
    touched = true;
  }

  const placeholderArt = normalizeString(next.placeholderArt);
  if (placeholderArt !== next.placeholderArt) {
    next.placeholderArt = placeholderArt;
    touched = true;
  }

  if (Array.isArray(next.traits)) {
    const traits = next.traits
      .filter((trait) => typeof trait === 'string')
      .map((trait) => trait.trim())
      .filter((trait) => trait.length > 0);
    const uniqueTraits = Array.from(new Set(traits));
    if (JSON.stringify(uniqueTraits) !== JSON.stringify(next.traits)) {
      next.traits = uniqueTraits;
      touched = true;
    }
  }

  return { next, touched };
};

const normalizeImageSource = (
  card: CardRecord,
  cardArtDir: string,
): { next: CardRecord; changed: boolean; missingImageSource: boolean; invalidLocalImage: boolean } => {
  const next: CardRecord = { ...card };
  const cardId = hasNonEmptyString(next.id) ? next.id : '';
  if (!cardId) {
    return { next, changed: false, missingImageSource: !hasImageSource(next), invalidLocalImage: false };
  }

  const canonicalLocal = resolveLocalImagePath(cardId, cardArtDir);
  const currentImage = hasNonEmptyString(next.imageUrl) ? next.imageUrl : '';
  const currentLocalRef = currentImage ? parseLocalImageRef(currentImage) : null;
  const currentLocalIsValid = currentLocalRef
    ? isValidLocalImageFile(path.join(cardArtDir, `${currentLocalRef.id}.${currentLocalRef.ext}`), currentLocalRef.ext)
    : false;

  if (canonicalLocal && currentImage !== canonicalLocal) {
    next.imageUrl = canonicalLocal;
    return {
      next,
      changed: true,
      missingImageSource: false,
      invalidLocalImage: Boolean(currentLocalRef) && !currentLocalIsValid,
    };
  }

  if (currentLocalRef && !currentLocalIsValid) {
    if (hasNonEmptyString(next.placeholderArt)) {
      const fallback = String(next.placeholderArt);
      if (fallback !== currentImage) {
        next.imageUrl = fallback;
      }
      return {
        next,
        changed: fallback !== currentImage,
        missingImageSource: false,
        invalidLocalImage: true,
      };
    }

    delete next.imageUrl;
    return {
      next,
      changed: true,
      missingImageSource: !hasImageSource(next),
      invalidLocalImage: true,
    };
  }

  if (hasNonEmptyString(currentImage) && isKnownCardRemote(currentImage)) {
    const stripped = stripQueryAndHash(currentImage);
    if (stripped !== currentImage) {
      next.imageUrl = stripped;
      return { next, changed: true, missingImageSource: false, invalidLocalImage: false };
    }
    return { next, changed: false, missingImageSource: false, invalidLocalImage: false };
  }

  if (!hasImageSource(next) && canonicalLocal) {
    next.imageUrl = canonicalLocal;
    return { next, changed: true, missingImageSource: false, invalidLocalImage: false };
  }

  return { next, changed: false, missingImageSource: !hasImageSource(next), invalidLocalImage: false };
};

interface CleanStats {
  scanned: number;
  deleted: number;
  errors: number;
}

const cleanCardArtDir = (cardArtDir: string, verbose: boolean): CleanStats => {
  const stats: CleanStats = { scanned: 0, deleted: 0, errors: 0 };

  if (!fs.existsSync(cardArtDir)) {
    if (verbose) console.log(`   Card art directory not found: ${cardArtDir}`);
    return stats;
  }

  const entries = fs.readdirSync(cardArtDir);

  for (const entry of entries) {
    const lower = entry.toLowerCase();
    const ext = lower.split('.').pop() as string;
    if (!(['webp', 'png', 'jpg', 'jpeg'] as const).includes(ext as LocalImageExtension)) continue;

    const fullPath = path.join(cardArtDir, entry);
    stats.scanned += 1;

    const validExt = ext as LocalImageExtension;
    if (!isValidLocalImageFile(fullPath, validExt)) {
      const header = readImageHeader(fullPath, 16);
      const preview = header
        ? header.subarray(0, Math.min(header.length, 16)).toString('utf8').replace(/[^\x20-\x7e]/g, '.')
        : '<unreadable>';

      if (verbose) {
        console.log(`   DELETE  ${entry}  (invalid ${validExt} header: "${preview}")`);
      } else {
        console.log(`   Deleting corrupt file: ${entry}`);
      }

      try {
        fs.unlinkSync(fullPath);
        stats.deleted += 1;
      } catch (e) {
        console.error(`   ERROR deleting ${entry}: ${e}`);
        stats.errors += 1;
      }
    } else if (verbose) {
      console.log(`   OK      ${entry}`);
    }
  }

  return stats;
};

const autoFixCards = (rawCards: unknown[], filePath: string, verbose: boolean): { fixed: CardRecord[]; stats: FixStats } => {
  const projectRoot = process.cwd();
  const cardArtDir = path.join(projectRoot, 'apps', 'web', 'public', 'card_art');
  const byId = new Map<string, CardRecord>();

  const stats: FixStats = {
    duplicatesRemoved: 0,
    imageUrlsNormalized: 0,
    localImageFilesInvalid: 0,
    cardsWithNoImageSource: 0,
    cardsTrimmed: 0,
    cardsDropped: 0,
  };

  for (const raw of rawCards) {
    if (!isObject(raw)) {
      stats.cardsDropped += 1;
      continue;
    }

    const { next: normalized, touched } = normalizeCardFields(raw);
    if (touched) stats.cardsTrimmed += 1;

    if (!hasNonEmptyString(normalized.id)) {
      stats.cardsDropped += 1;
      continue;
    }

    const id = normalized.id as string;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, normalized);
      continue;
    }

    stats.duplicatesRemoved += 1;
    const preferred = choosePreferredCard(existing, normalized, id);
    const merged = preferred === existing
      ? mergeCards(existing, normalized)
      : mergeCards(normalized, existing);
    byId.set(id, merged);
  }

  const fixed: CardRecord[] = [];
  for (const card of byId.values()) {
    const { next, changed, missingImageSource, invalidLocalImage } = normalizeImageSource(card, cardArtDir);
    if (changed) stats.imageUrlsNormalized += 1;
    if (invalidLocalImage) stats.localImageFilesInvalid += 1;
    if (missingImageSource) stats.cardsWithNoImageSource += 1;
    fixed.push(next);
  }

  fixed.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  if (verbose) {
    console.log(`   Fix target: ${filePath}`);
    console.log(`   - Trimmed cards: ${stats.cardsTrimmed}`);
    console.log(`   - Duplicates removed: ${stats.duplicatesRemoved}`);
    console.log(`   - Image URLs normalized: ${stats.imageUrlsNormalized}`);
    console.log(`   - Invalid local image files replaced: ${stats.localImageFilesInvalid}`);
    console.log(`   - Dropped malformed cards: ${stats.cardsDropped}`);
    console.log(`   - Remaining cards with no image source: ${stats.cardsWithNoImageSource}`);
  }

  return { fixed, stats };
};

const validateCard = (card: CardRecord): string[] => {
  const errors: string[] = [];
  const id = hasNonEmptyString(card.id) ? card.id : '';
  const name = hasNonEmptyString(card.name) ? card.name : '';
  const set = hasNonEmptyString(card.set) ? card.set : '';
  const color = hasNonEmptyString(card.color) ? card.color : '';
  const type = hasNonEmptyString(card.type) ? card.type : '';
  const cost = typeof card.cost === 'number' ? card.cost : Number(card.cost);

  if (!id) errors.push('Missing id');
  else if (!CARD_ID_PATTERN.test(id)) errors.push(`Invalid id format: ${id}`);

  if (!name) errors.push('Missing name');
  if (!set) errors.push('Missing set');

  if (!color) errors.push('Missing color');
  else if (!VALID_COLORS.has(color)) errors.push(`Invalid color: ${color}`);

  if (!type) errors.push('Missing type');
  else if (!VALID_TYPES.has(type)) errors.push(`Invalid type: ${type}`);

  if (!Number.isFinite(cost)) errors.push('Missing or invalid cost');
  else if (cost < 0) errors.push(`Negative cost: ${cost}`);

  if (!hasImageSource(card)) errors.push('Missing imageUrl and placeholderArt');

  return errors;
};

const collectValidationIssues = (cards: CardRecord[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const cardId = hasNonEmptyString(card.id) ? card.id : '???';
    const errors = validateCard(card);
    if (seen.has(cardId)) {
      errors.push(`Duplicate id detected: ${cardId}`);
    }
    seen.add(cardId);

    if (errors.length > 0) {
      issues.push({ cardId, errors });
    }
  }

  return issues;
};

const printStats = (cards: CardRecord[]): void => {
  console.log('\n📈 Statistics:');
  const colorCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const setCounts: Record<string, number> = {};

  for (const card of cards) {
    const color = hasNonEmptyString(card.color) ? card.color : 'Unknown';
    const type = hasNonEmptyString(card.type) ? card.type : 'Unknown';
    const set = hasNonEmptyString(card.set) ? card.set : 'Unknown';
    colorCounts[color] = (colorCounts[color] ?? 0) + 1;
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    setCounts[set] = (setCounts[set] ?? 0) + 1;
  }

  console.log('\n  By Color:');
  for (const [color, count] of Object.entries(colorCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${color}: ${count}`);
  }

  console.log('\n  By Type:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type}: ${count}`);
  }

  console.log('\n  By Set:');
  for (const [set, count] of Object.entries(setCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${set}: ${count}`);
  }
};

const validateCardsFile = (filePath: string, options: ValidationOptions): void => {
  console.log(`\n📋 Validating: ${filePath}`);
  console.log('━'.repeat(60));

  let cards: unknown[];
  try {
    cards = loadJsonFile(filePath);
  } catch (e) {
    console.error(`❌ Failed to load file: ${e}`);
    process.exit(1);
  }

  console.log(`📊 Total cards in file: ${cards.length}`);

  let records: CardRecord[] = cards.filter(isObject);
  if (records.length !== cards.length) {
    console.log(`⚠️  Ignored ${cards.length - records.length} non-object entries`);
  }

  if (options.fix) {
    console.log('\n🧹 Cleaning card art directory...');
    const projectRoot = process.cwd();
    const cardArtDir = path.join(projectRoot, 'apps', 'web', 'public', 'card_art');
    const cleanStats = cleanCardArtDir(cardArtDir, Boolean(options.verbose));
    console.log(`   - Scanned: ${cleanStats.scanned}  Deleted: ${cleanStats.deleted}  Errors: ${cleanStats.errors}`);

    console.log('\n🛠️  Running auto-fix pass...');
    const { fixed, stats } = autoFixCards(records, filePath, Boolean(options.verbose));
    records = fixed;

    writeJsonFile(filePath, fixed);
    console.log(`   - Trimmed cards: ${stats.cardsTrimmed}`);
    console.log(`   - Duplicate IDs removed: ${stats.duplicatesRemoved}`);
    console.log(`   - Image URLs normalized: ${stats.imageUrlsNormalized}`);
    console.log(`   - Invalid local image files replaced: ${stats.localImageFilesInvalid}`);
    console.log(`   - Dropped malformed cards: ${stats.cardsDropped}`);
    if (stats.cardsWithNoImageSource > 0) {
      console.log(`   - Cards with no image source remaining: ${stats.cardsWithNoImageSource}`);
    }
  }

  const issues = collectValidationIssues(records);
  const validCount = records.length - issues.length;

  console.log(`✅ Valid: ${validCount}`);
  console.log(`❌ Invalid: ${issues.length}`);

  if (issues.length > 0) {
    console.log('\n⚠️  Validation Errors:');
    for (const issue of issues) {
      console.log(`\n  Card ID: ${issue.cardId}`);
      for (const error of issue.errors) {
        console.log(`    - ${error}`);
      }
    }
  }

  printStats(records);

  if (issues.length === 0) {
    console.log('\n✅ All cards are valid!');
  } else {
    console.log(`\n⚠️  ${issues.length} card(s) failed validation`);
    if (!options.fix) {
      console.log('   Run with --fix to auto-normalize duplicate/image issues');
    }
    process.exit(1);
  }

  console.log('━'.repeat(60));
};

const main = async () => {
  const options = parseArgs();

  if (options.verbose) {
    console.log('🔍 Verbose mode enabled');
  }

  try {
    const filePath = options.filePath || 'apps/web/lib/data/cards.json';
    validateCardsFile(filePath, options);
  } catch (e) {
    console.error('❌ Validation error:', e);
    process.exit(1);
  }
};

main().catch(console.error);
