# Gundam-Forge Validation Guide

## Overview

Validation is the foundation of data integrity in Gundam-Forge. We use **Zod** for runtime schema validation across three layers: API contracts, card schema, and data pipeline.

This guide explains the validation patterns used in the codebase and how to extend them.

---

## The Three Validation Layers

### Layer 1: API Contracts (Boundary Validation)

**Purpose:** Catch data contract violations at system boundaries

**Location:** `packages/shared/src/api-contracts.ts`

**Pattern:**
```typescript
import { CardsApiResponseSchema } from '@gundam-forge/shared';

// ⛔ DON'T: Trust API response without validation
const data = await fetch('/api/cards').then(r => r.json());
const cards = data.cards; // Could be wrong structure, undefined, etc.

// ✅ DO: Validate at boundary
const response = await fetch('/api/cards').then(r => r.json());
const result = CardsApiResponseSchema.safeParse(response);

if (!result.success) {
  console.error('API contract violation:', result.error);
  // Handle validation error: fallback data, retry, notify user
  return { cards: [], error: 'Failed to fetch cards' };
}

const { cards, total } = result.data; // Now type-safe
```

**Key Schemas:**
- `CardsApiResponseSchema` — Card catalog listing
- `DecksApiResponseSchema` — Deck catalog
- `DeckAnalyticsDtoSchema` — Deck stats/analytics
- `PlaytesterReplaySchema` — Playtester game history
- `ApiErrorShapeSchema` — Error responses

**Design Pattern:** `.strict()` enforces exact shape (no extra fields allowed), `.passthrough()` when backwards-compatibility is needed

---

### Layer 2: Card Schema (Data Model Validation)

**Purpose:** Enforce card data integrity for deck building rules

**Location:** `packages/shared/src/card-schema.ts` and `packages/shared/src/types.ts`

**Core Type:**
```typescript
export interface CardDefinition {
  id: string;
  name: string;
  color: CardColor;
  cost: number;
  type: CardType;
  
  // Stats (official Gundam Card Game)
  ap?: number;        // Attack Points
  hp?: number;        // Hit Points
  level?: number;     // Resource cost
  
  // Mechanics
  keywords?: string[]; // e.g. ["repair 2", "support 3", "blocker"]
  triggers?: string[]; // e.g. ["burst", "when-paired", "deploy"]
  
  // Format legality (Mar 2026 addition)
  legalities?: Record<string, 'legal' | 'banned' | 'restricted' | 'suspended'>;
  // Example: { standard: 'legal', extended: 'banned' }
  
  // Availability (Mar 2026 addition)
  availability?: { print?: number; rarity?: 'C' | 'R' | 'SR' | 'P'; };
  
  // ... other fields
}
```

**Validation:**
```typescript
import { validateCard, validateCards } from '@gundam-forge/shared';

// Single card
const result = validateCard(cardData);
if (result.success) {
  const card: ExtendedCardDefinition = result.data;
  console.log(`${card.name}: Legal in ${Object.keys(card.legalities || {})}`);
} else {
  console.error('Card validation failed:', result.error);
}

// Batch validation
const { valid, invalid } = validateCards(cardArray);
valid.forEach(card => addToDatabase(card));
invalid.forEach(err => {
  console.warn(`Card ${err.cardId}: ${err.errors.join(', ')}`);
});
```

**Helper Functions (NEW):**

#### Extract Keyword Values
```typescript
import { getKeywordValue } from '@gundam-forge/shared';

const rushCard = { keywords: ['rush'] };
const repairCard = { keywords: ['repair 2'] };
const supportCard = { keywords: ['support 1', 'blocker'] };

getKeywordValue(rushCard, 'rush');           // 1 (default)
getKeywordValue(repairCard, 'repair');       // 2 (parsed from "repair 2")
getKeywordValue(supportCard, 'support');     // 1
getKeywordValue(supportCard, 'blocker');     // 1 (can find multiple)
getKeywordValue(supportCard, 'unknown');     // 0 (not found)
```

#### Check for Keywords
```typescript
import { hasKeyword } from '@gundam-forge/shared';

hasKeyword(rushCard, 'rush');     // true
hasKeyword(repairCard, 'repair'); // true (works with "repair 2")
hasKeyword(rushCard, 'repair');   // false
```

#### Check Format Legality
```typescript
import { isLegalInFormat, getCopyLimit } from '@gundam-forge/shared';

const card = { 
  legalities: { 
    standard: 'legal', 
    extended: 'banned' 
  } 
};

isLegalInFormat(card, 'standard');     // true
isLegalInFormat(card, 'extended');     // false
isLegalInFormat(card, 'vintage');      // true (not specified, assumes legal)

getCopyLimit(card, 'standard');        // 4 (legal)
getCopyLimit(card, 'extended');        // 0 (banned)

// For restricted cards
const restricted = { legalities: { standard: 'restricted' } };
getCopyLimit(restricted, 'standard');  // 1
```

---

### Layer 3: Data Pipeline Validation

**Purpose:** Validate external data during import (meta pipeline, manual uploads)

**Location:** `packages/data-sync/src/validate.ts`

**Example: Limitless TCG Meta Data**

```typescript
import { validateMetaPayload } from '@gundam-forge/data-sync';

const metaSnapshot = {
  source: 'limitless-api',
  version: '1.0.0',
  snapshotDate: '2026-04-12',
  topArchetypes: ['Blue Rush', 'Green Control'],
  archetypes: [
    {
      archetypeId: 'blue-rush',
      rank: 1,
      winRate: 52.3,
      playRate: 18.5,
      trendDirection: 'up'
    }
  ],
  cardPerformance: [
    {
      cardId: 'SEED-001',
      archetypeId: 'blue-rush',
      inclusionRate: 0.95,
      winImpact: 8.2,
      sampleSize: 250
    }
  ]
};

const result = validateMetaPayload(metaSnapshot);

if (result.ok) {
  // Write to events-live.json
  await writeJSON('events-live.json', metaSnapshot);
} else {
  // Handle validation errors with field paths
  console.error('Meta validation failed:');
  result.errors.forEach(error => {
    console.error(`  → ${error}`); // e.g., "archetypes.0.rank: must be positive"
  });
}
```

**Schemas:**
```typescript
export const MetaSourceArchetypeSchema = z.object({
  archetypeId: z.string().min(1),
  rank: z.number().positive('rank must be positive'),
  winRate: z.number().min(0).max(100).optional(),
  playRate: z.number().min(0).max(100).optional(),
  weightedScore: z.number().optional(),
  trendDirection: z.enum(['up', 'flat', 'down']).optional(),
});

export const MetaSourcePayloadSchema = z.object({
  source: z.string().min(1),
  version: z.string().min(1),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topArchetypes: z.array(z.string()),
  archetypes: z.array(MetaSourceArchetypeSchema),
  cardPerformance: z.array(MetaSourceCardPerformanceSchema),
  notes: z.string().optional(),
});
```

---

## Common Patterns

### Pattern 1: API Response Validation in React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { CardsApiResponseSchema, type CardsApiResponse } from '@gundam-forge/shared';

export function useCards() {
  return useQuery({
    queryKey: ['cards'],
    queryFn: async (): Promise<CardsApiResponse> => {
      const response = await fetch('/api/cards');
      const json = await response.json();
      
      // Validate response before returning
      const result = CardsApiResponseSchema.safeParse(json);
      if (!result.success) {
        throw new Error(`API contract violation: ${result.error.message}`);
      }
      
      return result.data;
    },
  });
}
```

### Pattern 2: Form Input Validation

```typescript
import { z } from 'zod';

const DeckFilterFormSchema = z.object({
  color: z.enum(['Blue', 'Red', 'Green', 'White', 'Purple', 'Colorless', 'All']),
  type: z.enum(['Unit', 'Pilot', 'Command', 'Base', 'Resource', 'All']),
  minCost: z.number().nonnegative().max(15),
  maxCost: z.number().nonnegative().max(15),
}).refine(
  (data) => data.minCost <= data.maxCost,
  { message: 'Min cost must be ≤ max cost', path: ['minCost'] }
);

function handleFilterSubmit(formData: unknown) {
  const result = DeckFilterFormSchema.safeParse(formData);
  
  if (!result.success) {
    // Show user-friendly errors
    result.error.errors.forEach(err => {
      console.error(`${err.path.join('.')}: ${err.message}`);
    });
    return;
  }
  
  // formData is now type-safe
  applyFilters(result.data);
}
```

### Pattern 3: Discriminated Union for State Machines

```typescript
import { z } from 'zod';

const PhaseSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('start') }),
  z.object({ state: z.literal('draw') }),
  z.object({ state: z.literal('resource') }),
  z.object({ state: z.literal('main') }),
  z.object({ state: z.literal('end') }),
  z.object({ state: z.literal('gameOver'), winnerId: z.string() }),
]);

type Phase = z.infer<typeof PhaseSchema>;

function handlePhase(phase: Phase) {
  switch (phase.state) {
    case 'start':
      // ✅ TypeScript knows this phase has no extra fields
      setupGame();
      break;
    case 'gameOver':
      // ✅ TypeScript knows this phase has winnerId
      endGame(phase.winnerId);
      break;
    case 'main':
      playMainPhase();
      break;
  }
}
```

---

## Error Handling Best Practices

### ✅ DO: Handle Validation Errors Gracefully
```typescript
const result = SomeSchema.safeParse(data);

if (!result.success) {
  // Log error with context
  console.error('Validation failed:', {
    data: data,
    errors: result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  });

  // Return sensible fallback
  return defaultValue;
}
```

### ❌ DON'T: Use `.parse()` in userland code (catches throw errors)
```typescript
// This can crash the app if validation fails
const card = CardSchema.parse(userData); // ← Throws!

// DO use `.safeParse()` instead
const result = CardSchema.safeParse(userData);
if (result.success) {
  const card = result.data;
}
```

### ✅ DO: Use Refinements for Complex Logic
```typescript
const CardWithKeywordsSchema = CardSchema.refine(
  (card) => {
    // Complex validation: if card has Repair keyword, must have HP
    if (hasKeyword(card, 'repair') && !card.hp) {
      throw new Error('Cards with Repair must have HP');
    }
    return true;
  },
  { message: 'Invalid card configuration' }
);
```

---

## Adding New Validations

### Step 1: Define Zod Schema
```typescript
// In packages/shared/src/schemas/something.ts
import { z } from 'zod';

export const YourDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.number().positive(),
});

export type YourData = z.infer<typeof YourDataSchema>;
```

### Step 2: Create Validation Function
```typescript
export function validateYourData(data: unknown) {
  const result = YourDataSchema.safeParse(data);
  
  if (result.success) {
    return { ok: true, data: result.data };
  }
  
  const errors = result.error.errors.map(e => 
    `${e.path.join('.')}: ${e.message}`
  );
  return { ok: false, errors };
}
```

### Step 3: Use in Application
```typescript
import { validateYourData } from '@gundam-forge/shared';

const input = { id: '123', name: 'Test', value: 10 };
const result = validateYourData(input);

if (result.ok) {
  processData(result.data);
} else {
  logErrors(result.errors);
}
```

### Step 4: Add Tests
```typescript
// packages/shared/__tests__/your-data.test.ts
import { describe, it, expect } from 'vitest';
import { validateYourData } from '../src/schemas/something';

describe('YourData validation', () => {
  it('accepts valid data', () => {
    const result = validateYourData({ id: '1', name: 'Valid', value: 5 });
    expect(result.ok).toBe(true);
  });

  it('rejects negative values', () => {
    const result = validateYourData({ id: '1', name: 'Invalid', value: -1 });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('must be greater than 0');
  });
});
```

---

## Testing Validations

### Unit Tests with Vitest
```typescript
import { describe, it, expect } from 'vitest';
import { CardContractSchema } from '@gundam-forge/shared';

describe('CardContractSchema', () => {
  it('validates a complete card', () => {
    const card = {
      id: 'SEED-001',
      name: 'RX-78 Gundam',
      color: 'Blue',
      cost: 4,
      type: 'Unit',
      set: 'SEED-1',
      text: 'When this enters the field...',
      ap: 5,
      hp: 4,
    };

    const result = CardContractSchema.safeParse(card);
    expect(result.success).toBe(true);
  });

  it('rejects invalid cost', () => {
    const card = {
      id: 'SEED-001',
      name: 'RX-78 Gundam',
      color: 'Blue',
      cost: -1, // ← Invalid
      type: 'Unit',
      set: 'SEED-1',
    };

    const result = CardContractSchema.safeParse(card);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('negative');
  });

  it('includes error path in messages', () => {
    const response = {
      cards: [{ id: 'SEED-001' }], // ← Missing required fields
      total: 1,
      limit: 30,
    };

    const result = CardContractSchema.safeParse(response);
    expect(result.success).toBe(false);
    
    const error = result.error?.issues[0];
    expect(error?.path.join('.')).toContain('cards.0');
  });
});
```

---

## Troubleshooting

### Issue: "Cannot find name 'CardDefinition'" after schema changes

**Cause:** TypeScript cache stale after modifying `types.ts`

**Solution:**
```bash
# Clear TypeScript cache
npm run clean || rm -rf node_modules/.cache

# Rebuild
npm run build
```

### Issue: Zod validation passes but TypeScript complains about type

**Cause:** Schema and actual TypeScript interface mismatch

**Solution:**
```typescript
// ❌ Problem: Schema and type diverged
export interface Card { id: string; }
export const CardSchema = z.object({ id: z.string(), name: z.string() });

// ✅ Solution: Use z.infer for single source of truth
export const CardSchema = z.object({ id: z.string(), name: z.string() });
export type Card = z.infer<typeof CardSchema>;
```

### Issue: `.safeParse()` always returns `success: false`

**Cause:** Schema is too strict (likely `.strict()`)

**Solution:**
```typescript
// Debug with better error messages
const result = SomeSchema.safeParse(data);
if (!result.success) {
  result.error.errors.forEach(err => {
    console.log(`[${err.path.join('.')}] ${err.message}`, err.code);
  });
}
```

---

## References

- **Zod Docs:** https://zod.dev/
- **Zod Error Handling:** https://zod.dev/?id=handling-errors
- **Type Inference:** https://zod.dev/?id=type-inference
- **Discriminated Unions:** https://zod.dev/?id=discriminated-unions
