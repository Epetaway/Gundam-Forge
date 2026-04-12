# Gundam-Forge Architecture Guide

## Overview

Gundam-Forge is a production-grade deck builder for the Gundam Trading Card Game, built with modern web standards, small-team discipline, and Moxfield-inspired design philosophy.

**Core Principles:**
- Minimalist dependencies with maximum clarity
- Schema-driven validation (Zod)
- Static export for GitHub Pages deployment
- Client-side filtering for zero-backend requirements
- Performance-first: 150ms search debounce, CSS conic-gradient charts, no bloated charting libraries

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Radix UI (headless components)
- **Styling:** Tailwind CSS v4 with PostCSS
- **State Management:** React Query (TanStack Query) for playtester analytics
- **Runtime Validation:** Zod for schema contracts
- **Deployment:** Static export to GitHub Pages (`output: 'export'`)

### Monorepo Structure
```
packages/
├── shared/           # Shared types, validation schemas, helpers
├── design-system/    # Tailwind tokens, animations, theme constants
└── data-sync/        # Meta data pipeline (Limitless TCG → local JSON)

apps/
└── web/              # Next.js 14 app (static export, client-side)
```

### Key Dependencies
- `zod@^3.22.4` — Runtime schema validation (50-80KB gzipped)
- `@radix-ui/*` — Accessible UI primitives
- `@tanstack/react-query@^5` — Playtester analytics caching
- `lucide-react` — Icons
- `clsx` / `cn()` utility — Class merging

### No External Charting Libraries
- Cost curve: CSS bar chart (Tailwind grid + dynamic widths)
- Color pie: CSS `conic-gradient` (single div, pure CSS)
- Performance: instant rendering, no D3/Recharts overhead

---

## Validation Strategy: Schema-Driven with Zod

### Three Layers of Validation

#### Layer 1: API Contracts (packages/shared/src/api-contracts.ts)
**Purpose:** Validate all API responses at client boundary

**Key Schemas:**
- `CardsApiResponseSchema` — Validates card catalog response
- `DecksApiResponseSchema` — Validates deck list response
- `PlaytesterReplaySchema` — Validates replay action history
- `DeckAnalyticsDtoSchema` — Validates deck analytics data

**Usage:**
```typescript
import { CardsApiResponseSchema } from '@gundam-forge/shared';

const response = await fetch('/api/cards?color=Blue');
const json = await response.json();

// Validate at boundary; catch contract violations early
const result = CardsApiResponseSchema.safeParse(json);
if (!result.success) {
  console.error('API contract violation:', result.error);
}
const { cards, total } = result.data;
```

**Pattern:** All API responses use `.strict()` to prevent extra fields, `.passthrough()` where controlled backwards-compatibility is needed

---

#### Layer 2: Card Schema (packages/shared/src/card-schema.ts & card-schema.ts)
**Purpose:** Enforce card data integrity for deck building rules

**Key Schemas:**
- `ExtendedCardDefinitionSchema` — Full card with metadata
- `CardRarityEnum`, `CardTagEnum`, `CardSourceEnum` — Enums with audit trail

**Card Validation:**
```typescript
import { validateCard, ExtendedCardDefinitionSchema } from '@gundam-forge/shared';

// Single card
const result = validateCard(cardData);
if (result.success) {
  const { id, name, cost, type, legalities } = result.data;
}

// Batch import
const { valid, invalid } = validateCards(cardArray);
invalid.forEach(err => {
  console.warn(`Card ${err.cardId} failed validation:`, err.errors);
});
```

**New Fields (Mar 2026):**
- `legalities?: Record<string, 'legal' | 'banned' | 'restricted' | 'suspended'>`
  - Format-specific copy restrictions
  - Example: `{ standard: 'legal', extended: 'banned' }`
- `availability?: { print?: number; rarity?: 'C' | 'R' | 'SR' | 'P' }`
  - Print tracking and rarity metadata

**Keyword Parsing Helpers:**
```typescript
import { getKeywordValue, hasKeyword, isLegalInFormat } from '@gundam-forge/shared';

// Extract numeric values from keywords
getKeywordValue(card, 'repair'); // card has "repair 2" → returns 2
getKeywordValue(card, 'support'); // card has "support 3" → returns 3
getKeywordValue(card, 'blocker'); // card has "blocker" → returns 1 (default)
getKeywordValue(card, 'unknown'); // not found → returns 0

// Check for keyword existence
hasKeyword(card, 'repair'); // true if card has any "repair X" keyword
hasKeyword(card, 'blocker'); // true if card has "blocker"

// Format legality
isLegalInFormat(card, 'standard'); // returns true/false
getCopyLimit(card, 'standard'); // returns 4, 1, or 0
```

---

#### Layer 3: Data Sync Validation (packages/data-sync/src/validate.ts)
**Purpose:** Validate meta data pipeline from Limitless TCG

**Schemas:**
- `TrendDirectionSchema` — 'up' | 'flat' | 'down'
- `MetaSourceArchetypeSchema` — Archetype performance metrics
- `MetaSourceCardPerformanceSchema` — Card inclusion/win rates
- `MetaSourcePayloadSchema` — Full snapshot with validation

**Usage:**
```typescript
import { validateMetaPayload } from '@gundam-forge/data-sync';

const metaData = fetchFromLimitless();
const result = validateMetaPayload(metaData);

if (result.ok) {
  // Write to events-live.json
} else {
  console.error('Meta validation failed:', result.errors);
  // Errors include path info: "archetypes.0: rank must be positive"
}
```

**All Zod validation follows this pattern:**
- `.safeParse()` for introspection (never throws)
- Error paths include field navigation: `"archetypes.0.rank"`
- Type inference: `z.infer<typeof Schema>` for TypeScript sync

---

## Search & Filtering Logic

### URL-Based Filter Persistence
**Files:** 
- `apps/web/lib/filters/cardFilters.ts` — Filter types and URL serialization
- `apps/web/lib/search/advancedCardFilter.ts` — Query parsing logic

**Pattern:**
```typescript
// User applies filters → serialize to URL params
const filters = { color: 'Blue', type: 'Unit', cost: { min: 3, max: 5 } };
const url = new URLSearchParams(filtersToSearchParams(filters)).toString();
// Result: ?color=Blue&type=Unit&cost=3-5

// Browser navigate/back → deserialize from URL
const fromUrl = filtersFromSearchParams(searchParams);
// Works with browser history API
```

**Filter Logic (Moxfield-inspired):**
- **Between filter types:** AND logic
  - "Color: Blue" AND "Type: Unit" AND "Cost: 3-5" → all conditions must match
- **Within filter type:** OR logic  
  - "Color: Blue OR Red" → cards matching either color pass
- Visualized in `ActiveFilterChips` component with symbols (● for filter groups)

---

### Card Filtering Algorithm
**Location:** `apps/web/lib/search/advancedCardFilter.ts:filterCards()`

**Steps:**
1. Normalize query string (trim whitespace, lowercase for fuzzy matching)
2. Apply exact ID match (priority: if query is valid card ID, return immediately)
3. Parse keywords from query (e.g., "blue burst" → color + keyword filter)
4. Apply all active filters with AND logic between types
5. Return sorted results (exact name match first, then fuzzy, then cost)

**Performance:**
- 150ms debounce (set in `CardSearchPanel` and `CardsClient`)
- Filters 471 cards in <50ms (benchmarked)
- No database calls (all client-side)

---

## Deck Building Rules & Validation

### Official Gundam Card Game Rules v1.5.0
**Reference:** `docs/GAME_RULES.md` (custom homebrew rules for Gundam-Forge)

**Key Rules:**
- Main deck: 50 cards (min/max 1-4 copies per card, except EX cards)
- Resource deck: 10 cards (separate zone, auto-filled from top of deck)
- Units: 4 max stats (AP, HP, level from cost)
- Pilots: Pair with units via `linkCondition` attribute
- Keywords enforce deck building constraints:
  - Rush units can attack turn 1 (vs normal "attack when active")
  - Repair X cards restore X damage markers
  - Support X grants +X AP to paired unit

**Deck Validation (apps/web/lib/deck/validation.ts):**
```typescript
export function validateDeck(deck: DeckInstance, cardLookup: CardLookup): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check total count
  if (deck.entries.length < 50) errors.push({ type: 'min_main', actual: deck.entries.length });
  if (deck.entries.length > 50) errors.push({ type: 'max_main', actual: deck.entries.length });

  // Check resource deck
  if (!deck.resourceDeck || deck.resourceDeck < 10) errors.push({ type: 'resource_deck_insufficient' });

  // Check copy limits per card
  const counts = new Map<string, number>();
  deck.entries.forEach(entry => {
    const current = counts.get(entry.cardId) ?? 0;
    const card = cardLookup.get(entry.cardId);
    const limit = getCopyLimit(card, 'standard'); // Use format legality
    
    if (current + entry.qty > limit) {
      errors.push({ type: 'copy_limit_exceeded', cardId: entry.cardId, limit });
    }
    counts.set(entry.cardId, current + entry.qty);
  });

  return errors;
}
```

### Keyword-Driven Deck Analysis
**Location:** `apps/web/lib/deck/practicalAnalysis.ts`

**Metrics Calculated:**
- **Cost Curve:** Distribution across cost buckets (0-8+)
- **Color Distribution:** Breakdown by card colors
- **Consistency Index:** Moxfield-inspired metric (card duplicates + synergy)
- **Keyword Coverage:** Which mechanics are included (Rush, Blocker, Repair, Support, etc.)

**Example:**
```typescript
const analysis = calculateDeckAnalysis(deck, cardLookup);
console.log(analysis.colorDistribution); // { Blue: 30, Red: 20, Colorless: 0 }
console.log(analysis.costCurve); // [0, 5, 8, 12, 10, 5, 0, 0, 0] — 9 buckets
console.log(analysis.consistencyIndex); // 68 (out of 100)
console.log(analysis.keywordCoverage); // { rush: 8, blocker: 5, repair: 3 }
```

---

## Mobile-First UI/UX

### Responsive Breakpoints (Tailwind)
- **Mobile:** < 640px (`sm:`), bottom-sheet patterns, touch-friendly 44px targets
- **Tablet:** 640px–1024px (`md:`), grid adapts to 3-4 columns
- **Desktop:** 1024px+ (`lg:`), sidebar navigation, 5-6 column grids

### Design System (packages/design-system/)

**tokens.ts:** Centralized design tokens
```typescript
export const COLORS = {
  cobalt: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' },
  steel: { 400: '#9ca3af', 500: '#6b7280', 900: '#111827' },
  surface: { elevated: 'rgba(20,24,32,0.8)' },
  text: { muted: '#9ca3af', foreground: '#f3f4f6' },
};

export const SHADOWS = {
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  card: '0 10px 15px rgba(0, 0, 0, 0.2)',
};
```

**motion.ts:** Standardized animations
```typescript
export const ANIMATIONS = {
  shimmer: 'shimmer 2s ease-in-out infinite',
  slideIn: 'slideIn 0.3s ease-out',
  fadeIn: 'fadeIn 0.2s ease-in',
};
```

### Key Mobile Components

#### ActiveFilterChips
- Shows active filters as removable pills
- Displays "Filtering X of Y cards" with percentage bar
- Explains AND/OR logic between filter types
- Full-width, responsive layout

#### CardQuickAdd
- Mobile-only overlay (hidden on `sm:` and up)
- Big + button for instant add-to-deck
- "Details" link opens full card view
- Toast confirmation: "Added ✓" with Undo button (5s timeout)

#### CardPreviewPopover
- Hover preview on desktop/click on mobile
- Shows: image, name, cost, type, full text
- Smart positioning (prefer right, flip left if off-screen)
- Portal-based (renders outside DOM tree to prevent clipping)

---

## Performance Optimization

### Bundle Size
- Zod: ~50-80KB gzipped (runtime validation)
- Radix UI: Components tree-shaken (only used imports bundled)
- Tailwind: CSS-in-JS via PostCSS (no runtime overhead)
- Total Next.js app: ~87KB shared JS + route-specific chunks

### Search Debounce
- 150ms delay between keystroke and filter execution
- Prevents excessive re-renders on rapid input
- Measured: typing "lightning" quickly → only 1-2 filter runs (vs ~10 without debounce)

### Page Prerendering
- All 241 static routes prerendered at build time
- 0ms time-to-content (no server calls needed)
- GitHub Pages CDN serves gzipped HTML/CSS/JS

### Memory Efficiency
- No virtualization yet (471 cards fit in memory comfortably)
- Setup: If dataset grows to 1000+ cards, use TanStack React Virtual (already installed)
- Cost curve/color pie: CSS rendering (no heavyweight canvas)

---

## Development Workflow

### Running Locally
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000/)
npm run dev:web

# Build for static export
npm run build

# Serve production build locally
npm run serve  # (if available)
```

### File Organization

**Shared Logic (packages/shared/):**
- Types: `types.ts` (CardDefinition, CardColor, DeckIntent)
- Validation: `card-schema.ts`, `api-contracts.ts`
- Helpers: keyword parsing, legality checking, deck analysis

**Web App (apps/web/):**
- Components: `components/` (Radix-based UI)
- Pages: `app/` (Next.js App Router)
- Utilities: `lib/` (filters, deck logic, search)
- Assets: `public/`, `src/data/cards.json`

**Data Sync (packages/data-sync/):**
- Pipeline: `src/validate.ts` (Limitless TCG → local JSON)
- Zod schemas for runtime validation
- CI/CD: `scripts/fetch-meta.ts` runs hourly

### Testing

**Card Schema:**
```bash
npm run test:shared  # Zod schema validation tests
```

**Deck Logic:**
- Validation tests: copy limits, deck size constraints
- Analysis tests: cost curve, color distribution calculations

**UI Component Tests:**
- Storybook (if configured): interactive component demos
- Manual testing: desktop + mobile (320px, 768px, 1024px+ viewports)

---

## Deployment

### GitHub Pages Static Export

**Build Process:**
1. `npm run build` on main branch
2. Next.js static export → `apps/web/out/`
3. GitHub Action (`.github/workflows/deploy.yml`) uploads to GitHub Pages
4. CDN serves at `earlessiguana.github.io/Gundam-Forge/`

**Configuration:**
- `next.config.mjs`: `output: 'export'`, `images.unoptimized: true`
- `basePath: '/Gundam-Forge'` (production only, to match GH Pages path)
- `assetPrefix` synced with basePath

**No Backend Required:**
- All card data: baked into static JSON (apps/web/src/data/cards.json)
- All deck data: browser localStorage
- All filtering: client-side JavaScript

---

## Future Enhancements

### Phase 2: Medium Priority
1. **Virtualization** — If dataset grows to 1000+ cards
2. **Mobile Filter UI** — Improved bottom-sheet UX
3. **Keyboard Shortcuts** — Power-user navigation (Arrow keys, /, etc.)
4. **Price Display** — Market context in grid view
5. **Availability Metadata** — Reprint tracking, reserved list status

### Phase 3: Advanced
1. **Deck Comparison** — Side-by-side analysis
2. **Suggestion Engine** — Recommend cards based on existing picks
3. **Import from Tournament Results** — Parse Limitless decklists (when API available)
4. **Rules Engine Enhancements** — Validate combos, detect rule violations

---

## Code Standards

### Naming Conventions
- **Components:** PascalCase (`CardTile.tsx`, `DeckStats.tsx`)
- **Hooks:** `use` prefix camelCase (`useDeckColors`, `useFilterState`)
- **Types:** PascalCase (`CardDefinition`, `DeckInstance`, `ValidationError`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_COPIES_PER_CARD`, `PHASE_SEQUENCE`)
- **Utilities:** camelCase (`getKeywordValue`, `validateDeck`)

### Error Handling
- **API calls:** Wrap in `try/catch`, validate with Zod schemas
- **User input:** Validate at form level, provide clear error messages
- **Business logic:** Throw descriptive errors, catch at component boundary

### Type Safety
- Enable `strict: true` in `tsconfig.json`
- Export explicit types instead of inferring: `export type CardRecord = z.infer<typeof CardSchema>` (good), not implicit inference (bad)
- Use discriminated unions for state machines (phases, deck roles)

---

## References

- **Official GCG Rules:** Comprehensive Rules Ver. 1.5.0 (Mar 2026)
- **Moxfield:** Minimalist deck builder (design philosophy inspiration)
- **Zod Documentation:** https://zod.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Radix UI:** https://www.radix-ui.com/
