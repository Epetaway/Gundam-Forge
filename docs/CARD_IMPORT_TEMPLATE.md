/**
 * Card Import Template & Example
 * 
 * This file shows the exact structure and process for importing new cards
 * into the Gundam-Forge database.
 * 
 * Structure:
 * - Example: Structure for a new set (GD02)
 * - Schema: TypeScript interfaces
 * - Process: How to use the import system
 */

// ============================================================================
// EXAMPLE: GD02 - Dual Impact (100+ cards to import)
// ============================================================================

/**
 * Booster Set Structure Template
 * Location: seed/gd02-dual-impact.json
 */
export const GD02_DUAL_IMPACT_EXAMPLE = {
  setCode: 'GD02',
  setName: 'Dual Impact',
  type: 'booster',
  releaseDate: '2024-03-01',
  description: 'Second Gundam TCG booster set focusing on mobile suit combat',
  cardCount: 120,
  rarities: {
    common: 60,
    uncommon: 35,
    rare: 15,
    special: 10,
  },
  cards: [
    // EXAMPLE CARD 1: Common Unit
    {
      id: 'GD02-001',
      cardNumber: 1,
      name: 'RX-78-2 Gundam (Test Type)',
      type: 'Unit',
      color: 'Blue',
      cost: 3,
      ap: 5,
      hp: 4,
      traits: ['Mobile Suit Gundam', 'Newtype'],
      rarity: 'Common',
      text: 'When this unit enters play, draw 1 card.',
      imageUrl: '/card_art/GD02/GD02-001.webp',
      source: {
        origin: 'TCGPlayer',
        url: 'https://tcgplayer.com/...',
        verifiedDate: '2024-03-01',
      },
      seriesAffiliation: 'Mobile Suit Gundam',
      faction: 'Federation',
      expansion: false,
      legal: {
        format: 'Standard',
        status: 'legal' as const,
        since: '2024-03-01',
      },
      setCode: 'GD02',
      setName: 'Dual Impact',
    },

    // EXAMPLE CARD 2: Uncommon Pilot
    {
      id: 'GD02-061',
      cardNumber: 61,
      name: 'Amuro Ray',
      type: 'Pilot',
      color: 'Blue',
      cost: 2,
      ap: 3,
      hp: 3,
      traits: ['Newtype', 'Ace Pilot'],
      rarity: 'Uncommon',
      text: 'Pilots can have +1 AP. Once per turn, you may return a card from your graveyard to your hand.',
      imageUrl: '/card_art/GD02/GD02-061.webp',
      source: {
        origin: 'TCGPlayer',
        url: 'https://tcgplayer.com/...',
        verifiedDate: '2024-03-01',
      },
      seriesAffiliation: 'Mobile Suit Gundam',
      faction: 'Federation',
      expansion: false,
      legal: {
        format: 'Standard',
        status: 'legal' as const,
        since: '2024-03-01',
      },
      setCode: 'GD02',
      setName: 'Dual Impact',
    },

    // EXAMPLE CARD 3: Rare Command
    {
      id: 'GD02-096',
      cardNumber: 96,
      name: 'Newtype Flash',
      type: 'Command',
      color: 'White',
      cost: 4,
      ap: 0,
      hp: 0,
      traits: ['Newtype', 'Instant'],
      rarity: 'Rare',
      text: 'Target unit gets +3 AP until end of turn. Draw 2 cards.',
      imageUrl: '/card_art/GD02/GD02-096.webp',
      source: {
        origin: 'Bandai',
        url: 'https://bandai.com/...',
        verifiedDate: '2024-03-02',
      },
      seriesAffiliation: 'Cross-Series',
      expansion: false,
      legal: {
        format: 'Standard',
        status: 'legal' as const,
        since: '2024-03-01',
      },
      setCode: 'GD02',
      setName: 'Dual Impact',
    },

    // EXAMPLE CARD 4: Special Rarity
    {
      id: 'GD02-115',
      cardNumber: 115,
      name: 'Haro (Alternate Art)',
      type: 'Base',
      color: 'Colorless',
      cost: 1,
      ap: 0,
      hp: 2,
      traits: ['AI', 'EX', 'Special'],
      rarity: 'Special',
      text: 'At the start of each turn, generate 1 resource.',
      imageUrl: '/card_art/GD02/GD02-115-SECRET.webp',
      source: {
        origin: 'Community Submission',
        url: 'https://reddit.com/r/GundamTCG/...',
        verifiedDate: '2024-03-05',
      },
      expansion: false,
      legal: {
        format: 'Extended',
        status: 'legal' as const,
        since: '2024-03-01',
      },
      setCode: 'GD02',
      setName: 'Dual Impact',
    },

    // ... MORE CARDS GO HERE (total 120)
    //
    // Key fields that will repeat:
    // - id: GD02-XXX (sequential)
    // - setCode: Always GD02
    // - setName: Always "Dual Impact"
    // - releaseDate: Always 2024-03-01
    // - source: May vary by card
    // - legal: Typically all legal unless errataed
  ],
};

// ============================================================================
// SCHEMA: TypeScript Interfaces
// ============================================================================

/**
 * Imported/Updated Card Schema
 */
export interface CardForImport {
  // Required
  id: string; // e.g., "GD02-001"
  cardNumber: number; // 1-120 (for this set)
  name: string;
  type: 'Unit' | 'Pilot' | 'Command' | 'Base' | 'Resource';
  color: 'Blue' | 'Green' | 'Red' | 'White' | 'Purple' | 'Colorless';
  cost: number; // 0-12
  ap: number; // 0-20
  hp: number; // 0-10

  // Set Information
  setCode: string; // e.g., "GD02"
  setName: string; // e.g., "Dual Impact"

  // Optional but Recommended
  traits?: string[]; // e.g., ["Newtype", "Mobile Suit"]
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'SR' | 'UR' | 'Special';
  text?: string; // Card ability text
  imageUrl?: string;
  seriesAffiliation?: string; // e.g., "Mobile Suit Gundam"
  faction?: string; // e.g., "Federation", "Zeon"
  expansion?: boolean; // true if EX card

  // Legal/Data Integrity
  source: {
    origin: 'Bandai' | 'TCGPlayer' | 'Community' | 'Other';
    url?: string;
    verifiedDate?: string;
  };
  legal?: {
    format: string;
    status: 'legal' | 'restricted' | 'banned';
    since?: string;
  };
}

/**
 * Booster Set Structure for Import
 */
export interface BoosterSetForImport {
  setCode: string;
  setName: string;
  type: 'booster' | 'starter' | 'premium';
  releaseDate: string; // ISO 8601
  description?: string;
  cardCount?: number;
  cards: CardForImport[];
}

// ============================================================================
// PROCESS: How to Import
// ============================================================================

/**
 * STEP-BY-STEP IMPORT PROCESS
 *
 * 1. PREPARE DATA
 *    └─ Create JSON file with structure above
 *       └─ Verify all required fields present
 *       └─ Validate that IDs are sequential (GD02-001, GD02-002, etc.)
 *       └─ Check color/type enums match
 *       └─ Ensure cost/ap/hp are numbers in valid ranges
 *
 * 2. VALIDATE SCHEMA
 *    └─ Run validation before import:
 *       $ npm run validate:import -- seed/gd02-dual-impact.json
 *
 * 3. IMPORT TO DATABASE
 *    └─ Run import script:
 *       $ npm run import:cards -- --file seed/gd02-dual-impact.json --set GD02
 *
 * 4. VERIFY RESULTS
 *    └─ Query database:
 *       SELECT COUNT(*) FROM cards WHERE set = 'GD02';  -- Should be 120
 *       SELECT DISTINCT color FROM cards WHERE set = 'GD02';
 *       SELECT DISTINCT type FROM cards WHERE set = 'GD02';
 *
 * 5. TEST FUNCTIONALITY
 *    └─ Search: Can find GD02 cards
 *    └─ Filter: By set, color, type, etc.
 *    └─ Display: Images load correctly
 *    └─ Deck Building: Can add GD02 cards to deck
 *
 * 6. RUN AUDIT
 *    └─ Check completeness:
 *       $ npm run audit:cards
 *       └─ Should show GD02 in "Sets Present"
 */

// ============================================================================
// EXAMPLE: Multiple Sets Batch Import
// ============================================================================

/**
 * Multi-set import structure
 * Location: seed/booster-sets-batch.json
 */
export const BATCH_IMPORT_EXAMPLE = {
  sets: [
    {
      setCode: 'GD02',
      setName: 'Dual Impact',
      type: 'booster',
      releaseDate: '2024-03-01',
      cards: [
        // ... ~120 cards
      ],
    },
    {
      setCode: 'GD03',
      setName: 'Steel Requiem',
      type: 'booster',
      releaseDate: '2024-06-01',
      cards: [
        // ... ~120 cards
      ],
    },
    {
      setCode: 'ST05',
      setName: 'Support Deck 5',
      type: 'starter',
      releaseDate: '2024-04-01',
      cards: [
        // ... ~40 cards
      ],
    },
  ],
};

// ============================================================================
// IMPORTING EXISTING DATA: Conversion Example
// ============================================================================

/**
 * If converting from your current format:
 *
 * OLD FORMAT (current database):
 * {
 *   "id": "EXB-001",
 *   "name": "EX Base",
 *   "color": "Colorless",
 *   "type": "Base",
 *   "cost": 0,
 *   "set": "EXB",
 *   "ap": 0,
 *   "hp": 3,
 *   "traits": ["EX"]
 * }
 *
 * NEW FORMAT (enhanced schema):
 * {
 *   "id": "EXB-001",
 *   "cardNumber": 1,
 *   "name": "EX Base",
 *   "color": "Colorless",
 *   "type": "Base",
 *   "cost": 0,
 *   "ap": 0,
 *   "hp": 3,
 *   "traits": ["EX"],
 *   "setCode": "EXB",
 *   "setName": "EX Base",           // <- NEW
 *   "rarity": "Common",             // <- NEW
 *   "text": "...",                  // <- NEW
 *   "imageUrl": "/card_art/...",    // <- NEW
 *   "source": {                     // <- NEW
 *     origin: "Existing",
 *     verifiedDate: "2024-03-01"
 *   },
 *   "legal": {                      // <- NEW
 *     format: "Standard",
 *     status: "legal"
 *   }
 * }
 */

// ============================================================================
// VALIDATION CHECKLIST FOR NEW CARD SET
// ============================================================================

/**
 * Before importing a new set, verify:
 *
 * CARD STRUCTURE:
 * □ All required fields present (id, name, type, color, cost, ap, hp)
 * □ No missing/null values in required fields
 * □ Type is one of: Unit, Pilot, Command, Base, Resource
 * □ Color is one of: Blue, Green, Red, White, Purple, Colorless
 * □ ID format is correct (e.g., GD02-001, ST05-040)
 * □ Card numbers are sequential
 * □ No duplicate IDs within set
 * □ Cost is 0-12
 * □ AP is 0-20
 * □ HP is 0-10
 *
 * SET INFORMATION:
 * □ setCode matches the set ID (e.g., "GD02")
 * □ setName is correct official name
 * □ releaseDate is ISO 8601 format
 * □ Total card count matches file length
 *
 * SOURCE ATTRIBUTION:
 * □ All cards have source information
 * □ Source URLs are valid (if provided)
 * □ Verified dates are ISO 8601 format
 *
 * IMAGES:
 * □ All imageUrl fields are valid paths
 * □ Image files exist or will be downloaded
 * □ Image filenames follow convention: /card_art/SET/SET-NNN.webp
 *
 * DATA QUALITY:
 * □ No obvious typos in card names
 * □ Traits are reasonable (not random text)
 * □ Rarity distribution makes sense
 * □ Legal status is documented
 */

// ============================================================================
// CLI COMMANDS (Future Implementation)
// ============================================================================

/**
 * After implementation, these commands should work:
 *
 * # Validate a set before import
 * $ npm run validate:cards -- seed/gd02-dual-impact.json
 *
 * # Import a single set
 * $ npm run import:cards -- --file seed/gd02-dual-impact.json
 *
 * # Import multiple sets (batch)
 * $ npm run import:cards -- --file seed/booster-sets-batch.json --batch
 *
 * # Run audit
 * $ npm run audit:cards
 *
 * # List all sets in database
 * $ npm run list:sets
 *
 * # Query specific set
 * $ npm run query:cards -- --set GD02 --count
 *
 * # Export database (backup)
 * $ npm run export:cards -- --output backup-2024-03.json
 */

