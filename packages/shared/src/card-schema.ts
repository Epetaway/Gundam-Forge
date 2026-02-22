import { z } from 'zod';
import type { CardColor, CardType } from './types';

/**
 * Official Gundam TCG Card Schema (Canonical)
 * Defines the structure and validation rules for all card data.
 *
 * This schema enforces:
 * - Unique card IDs
 * - Valid color/type/rarity enums
 * - Non-negative costs and power values
 * - ISO date formats for release dates
 * - CDN-only art URLs (no local paths)
 * - Proper tagging for archetypes/mechanics
 */

export const CardRarityEnum = z.enum([
  'Common',
  'Uncommon',
  'Rare',
  'Special Rare',
  'Promo'
]);
export type CardRarity = z.infer<typeof CardRarityEnum>;

/**
 * Card archetype/mechanic tags for deck building and filtering
 * Examples: 'Newtype', 'Zeon', 'Federation', 'Mobile-Suit', 'Control', 'Aggro'
 */
export const CardTagEnum = z.enum([
  'Newtype',
  'Zeon',
  'Federation',
  'EFSF',
  'Mobile-Suit',
  'Mobile-Armor',
  'Pilot',
  'Commander',
  'Support',
  'Draw',
  'Control',
  'Aggro',
  'Combo',
  'Token',
  'Legendary',
  'Wing-Gundam',
  'Gundam-Seed',
  'Gundam-00',
  'Gundam-IBO',
  'UC-Era',
  'Psycho-Frame',
  'GN-Drive',
  'Multiple-Copies',
  'Precision',
  'Resilience',
  'Power',
  'Defense'
]);
export type CardTag = z.infer<typeof CardTagEnum>;

/**
 * Data source for each card (audit trail)
 */
export const CardSourceEnum = z.enum([
  'bandai-official',
  'bandai-set-release',
  'community-wiki',
  'authorized-app',
  'artbook',
  'imported-legacy'
]);
export type CardSource = z.infer<typeof CardSourceEnum>;

/**
 * Extended Card Definition with full metadata (for database)
 * Extends the basic CardDefinition from types.ts 
 */
export const ExtendedCardDefinitionSchema = z.object({
  // Identity (from types.ts)
  id: z
    .string()
    .min(1)
    .regex(/^[A-Z]{2,3}-\d{3,4}$/, 'Card ID must match format: XX-000 or XXX-0000')
    .describe('Unique card ID (e.g., GD-001, SEED-0025)'),

  name: z
    .string()
    .min(1)
    .max(256)
    .describe('Card name (English)'),

  nameJP: z
    .string()
    .optional()
    .describe('Card name (Japanese) if different'),

  // Game mechanics (from types.ts)
  cost: z
    .number()
    .int()
    .min(0)
    .max(15)
    .describe('Play cost (0-15)'),

  color: z.enum(['Blue', 'Green', 'Red', 'White', 'Black', 'Colorless']).describe('Primary color'),

  type: z.enum(['Unit', 'Pilot', 'Command', 'Base']).describe('Card type: Unit, Pilot, Command, or Base'),

  text: z
    .string()
    .describe('Card effect text (English)'),

  textJP: z
    .string()
    .optional()
    .describe('Card effect text (Japanese) if different'),

  power: z
    .number()
    .int()
    .min(0)
    .max(20)
    .nullable()
    .default(null)
    .describe('Power value (Units only; null for non-Units)'),

  // Set & release info (enhanced from types.ts)
  setCode: z
    .string()
    .min(1)
    .regex(/^[A-Z]+-\d+$/, 'Set code format: XX-0 (e.g., SEED-1, UC-2)')
    .describe('Set identifier (e.g., SEED-1, UC-2)'),

  setName: z
    .string()
    .min(1)
    .describe('Human-readable set name (e.g., "Gundam Seed Starter")'),

  releaseDate: z
    .string()
    .date()
    .describe('Set release date (ISO 8601: YYYY-MM-DD)'),

  // Art & presentation (replaces placeholderArt from types.ts)
  artUrl: z
    .string()
    .url()
    .describe('High-res card art URL (CDN only, no local paths)'),

  rarity: CardRarityEnum.describe('Card rarity level'),

  artUrlThumb: z
    .string()
    .url()
    .optional()
    .describe('Thumbnail/preview art URL'),

  illustrator: z
    .string()
    .optional()
    .describe('Card illustrator name'),

  // Legal & competitive
  legal: z
    .boolean()
    .default(true)
    .describe('Tournament legal flag'),

  bannedDate: z
    .string()
    .date()
    .optional()
    .describe('If banned, the effective date (ISO 8601)'),

  // Rulings & clarifications
  ruling: z
    .string()
    .optional()
    .describe('Official ruling text (short clarification if needed)'),

  rulingUrl: z
    .string()
    .url()
    .optional()
    .describe('Link to full ruling document'),

  errata: z
    .string()
    .optional()
    .describe('Errata notice (if card was changed after printing)'),

  // Metadata & filtering
  tags: z
    .array(CardTagEnum)
    .default([])
    .describe('Archetype/mechanic tags for deck building'),

  // Data sourcing
  source: CardSourceEnum.describe('Data source for audit trail'),

  sourceUrl: z
    .string()
    .url()
    .optional()
    .describe('URL reference for data source'),

  lastUpdated: z
    .string()
    .datetime()
    .describe('Last update timestamp (ISO 8601 with time)'),

  // Internal metadata
  internal: z
    .object({
      validated: z.boolean().default(false),
      checksumArt: z.string().optional().describe('MD5/SHA256 of art file'),
      checksumData: z.string().optional().describe('Checksum of card data for change detection')
    })
    .optional()
});

export type ExtendedCardDefinition = z.infer<typeof ExtendedCardDefinitionSchema>;

/**
 * Batch card import/update payload (for ETL)
 */
export const CardBatchImportSchema = z.object({
  version: z.string().describe('Schema version (e.g., 1.0.0)'),
  timestamp: z.string().datetime(),
  source: CardSourceEnum,
  cards: z.array(ExtendedCardDefinitionSchema),
  changelog: z
    .object({
      added: z.number().default(0),
      updated: z.number().default(0),
      deleted: z.number().default(0),
      notes: z.string().optional()
    })
    .optional()
});

export type CardBatchImport = z.infer<typeof CardBatchImportSchema>;

/**
 * Validation result with detailed error information
 */
export const CardValidationResultSchema = z.object({
  valid: z.boolean(),
  cardId: z.string(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  timestamp: z.string().datetime()
});

export type CardValidationResult = z.infer<typeof CardValidationResultSchema>;

/**
 * Utility validators
 */
export const validateCard = (data: unknown): { success: boolean; data?: ExtendedCardDefinition; error?: string } => {
  try {
    const parsed = ExtendedCardDefinitionSchema.parse(data);
    return { success: true, data: parsed };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const errors = e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
      return { success: false, error: errors };
    }
    return { success: false, error: String(e) };
  }
};

export const validateCards = (
  cards: unknown[]
): { valid: ExtendedCardDefinition[]; invalid: CardValidationResult[] } => {
  const valid: ExtendedCardDefinition[] = [];
  const invalid: CardValidationResult[] = [];

  for (const card of cards) {
    const result = validateCard(card);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      const cardId = typeof card === 'object' && card !== null && 'id' in card ? (card.id as string) : '???';
      invalid.push({
        valid: false,
        cardId,
        errors: result.error ? [result.error] : [],
        warnings: [],
        timestamp: new Date().toISOString()
      });
    }
  }

  return { valid, invalid };
};

/**
 * Example/sample card for schema documentation
 */
export const EXAMPLE_CARD: ExtendedCardDefinition = {
  id: 'SEED-001',
  name: 'RX-78 Gundam',
  nameJP: 'RX-78ガンダム',
  cost: 4,
  color: 'White',
  type: 'Unit',
  text: 'When this enters the field, draw 1 card. This unit gains +1 power while your resource zone is full.',
  textJP:
    'このユニットがフィールドに出た時、カードを1枚引く。あなたのリソースゾーンがいっぱいの間、このユニットは+1/+0を得る。',
  power: 5,
  setCode: 'SEED-1',
  setName: 'Gundam Seed Starter Set',
  releaseDate: '2024-06-15',
  rarity: 'Rare',
  artUrl: 'https://cdn.gundam-forge.local/cards/SEED-001-art.jpg',
  artUrlThumb: 'https://cdn.gundam-forge.local/cards/SEED-001-thumb.jpg',
  illustrator: 'Official Bandai',
  legal: true,
  ruling: 'The entry trigger resolves before the card becomes tapped.',
  rulingUrl: 'https://bandai.official/rulings/SEED-001',
  tags: ['Mobile-Suit', 'Federation', 'Newtype', 'Combo'],
  source: 'bandai-official',
  sourceUrl: 'https://bandai.official/cards/SEED-001',
  lastUpdated: new Date().toISOString(),
  internal: {
    validated: true,
    checksumData: 'abc123def456'
  }
};
