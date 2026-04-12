# Moxfield Deep Technical Analysis
## Search, Cards, Deck List, Filtering, Design & Behavior

---

## ARCHITECTURE OVERVIEW

### Updated Tech Stack
- **Frontend Framework:** Nuxt.js (Vue, not vanilla JS as initially thought)
- **Language:** TypeScript (strict mode)
- **API Base:** `https://api2.moxfield.com/v3/`
- **Data Validation:** Zod (type-safe runtime validation)
- **Authentication:** AWS Cognito (enterprise-grade user management)
- **Analytics:** Google Tag Manager
- **Payments:** Stripe (for commerce features)
- **Runtime:** Bun (modern replacement for Node)

**Why this stack matters:**
- Nuxt = SSR-capable Vue (can do server-side rendering for performance + SEO)
- Zod = catches data errors at runtime, not just compile time
- AWS Cognito = passwordless auth, MFA support, multi-region
- Bun = faster than Node for dev/build workflows

---

## 1. CARD DATA STRUCTURE (The Complete Schema)

This is the actual Zod-validated schema Moxfield uses for cards:

```typescript
// CARD IDENTIFICATION
id: string                    // Moxfield's internal ID
scryfall_id: string          // Link to Scryfall (card authority)
name: string                 // "Lightning Bolt"
set: string                  // "LEA" (Limited Edition Alpha), "DMU" (Dominaria United)
uniqueCardId: string         // Globally unique identifier

// GAME RULES (for deck building logic)
mana_cost: string            // "{1}{R}" format
cmc: number                  // Converted mana cost (total)
type_line: string            // "Instant" or "Creature — Zombie" 
oracle_text: string          // Official card text (from Gatherer)
power: string | null         // "2"
toughness: string | null     // "2"
loyalty: number | null       // For planeswalkers

// VISUAL/PRINTING INFO
border_color: string         // "black", "silver", "gold"
layout: string               // "normal", "split", "modal_dfc" (double-faced)
frame: string                // Card frame version
rarity: string               // "common", "uncommon", "rare", "mythic"
lang: string                 // "en", "de", "fr", etc.
collector_number: string     // Card number in set

// CARD VARIANTS/PRINTINGS
color_identity: string[]     // ["R"] for red, ["U", "B"] for blue-black
color_indicator?: string[]   // For color-shifted cards
foil: boolean
nonfoil: boolean
etched: boolean              // Etched foil variant
digital: boolean             // MTGO/Arena exclusive
reserved: boolean            // Reserved list (never reprinted)
reprint: boolean
latest: boolean              // Most recent printing

// GAME STATUS
legalities: Record<string, string>  // { "standard": "legal", "commander": "banned" }
promo_types: string[]        // ["textured", "serialized", "anime"]
frame_effects: string[]      // Special frame treatments

// RELATED CARDS (Split/Modal cards)
meld_parts: string[]         // For cards that meld together
card_faces: Card[]           // Front/back for DFCs (double-faced cards)

// COMMERCE (Smart feature!)
multiverse_ids: number[]     // For price lookups
// Vendor URLs inferred from schema structure
```

**Key insight:** This schema is designed to handle the complexity of 30+ years of Magic cards with all their variants and special cases. For Gundam TCG, your card structure should include:
- Pilot/Unit status
- Rush keyword
- Resource deck eligibility
- Burst/Support/Repair text parsing

---

## 2. DECK STRUCTURE (Data Organization)

```typescript
interface Deck {
  // Board organization (Magic has 3 zones: Main, Side, Commander)
  boards: {
    mainBoard: {
      cards: Map<cardId, BoardCard>      // ID → card data
      tokens: Card[]                      // Generated tokens
      cardsToTokens: Record<cardId, tokenId[]>  // Card → its tokens
    }
    sideBoard: { cards, tokens, cardsToTokens }
    commander?: { cards }                // For Commander format only
  }

  // METADATA
  format: "standard" | "modern" | "commander" | etc
  
  // COLOR ANALYSIS (pre-calculated for UI)
  colorIdentity: string[]          // ["R", "G"] if red+green
  colorPercentages: {
    "R": 0.35,
    "G": 0.30,
    "W": 0.20,
    "U": 0.10,
    "B": 0.05
  }

  // DECK STATS (likely calculated server-side or on frontend)
  // Not in schema but can be inferred:
  totalCards: number
  manaCurve: Record<number, number>  // Cost → count
  typeBreakdown: Record<string, number>  // Creature → count
  
  // ENGAGEMENT
  authors: User[]
  visibility: "private" | "public" | "unlisted"
  createdAt: timestamp
  updatedAt: timestamp
  viewCount: number
  likeCount: number
  
  // SHARING
  id: string                    // Base-64 encoded
  url: string                   // "https://moxfield.com/decks/{id}"
}

interface BoardCard {
  quantity: number              // 1-4 for Standard, 1+ for Commander
  card: Card                   // Full card object
  preferences: {
    foil?: boolean             // Track foil preference
    nonfoil?: boolean
    etched?: boolean
  }
}
```

**For Gundam Forge:**
- Add `resourceDeck` zone (10-card deck)
- Add `exZone` for EX cards (separate limited pool)
- Pre-calculate `setId` for format enforcement
- Add `archetype?: string` for meta tracking

---

## 3. SEARCH FUNCTIONALITY

### API Pattern
```
GET https://api2.moxfield.com/v3/decks/all/{deckId}
```

**Response includes:**
- Full card objects with all properties
- Deck metadata
- Strongly typed with Zod validation

### Likely Search Architecture (inferred)

**Frontend side:**
```typescript
// User types: "lightning" OR filters by "Red" + "Instant"
// Frontend debounces input (likely 200-300ms)
// Then queries either:
// Option A: Local card database (Scryfall data cached)
// Option B: API endpoint like GET /v3/cards/search?q=lightning&colors=red

// Results filtered by:
const filtered = cards.filter(c => 
  c.name.toLowerCase().includes(query) &&
  intersect(c.color_identity, selectedColors).length > 0 &&
  c.legalities[format] === 'legal'
)
```

**Why Moxfield's approach is different from Gundam-Forge:**
- Moxfield: Server can cache & index millions of cards, serve via API
- Gundam-Forge: Static export = all filtering client-side in JS, 471 cards = no problem

### Search Features Detected
1. **Fuzzy matching** — likely searches card name with partial matches
2. **Oracle text search** — searching card abilities (e.g., "draw a card")
3. **Advanced filters:**
   - `color:red,white` (multi-select OR logic)
   - `type:creature` (exact type match)
   - `cmc:3-5` (range slider)
   - `format:standard` (legality filter)
4. **Autocomplete** — suggestions as you type
5. **Pagination/Lazy load** — handle thousands of results

---

## 4. CARD FILTERING UI

### Filter Types (Inferred from card schema)

```
┌─────────────────────────────────┐
│ SEARCH INPUT (debounced)        │
│ [Search card name......]        │
└─────────────────────────────────┘

┌─ FILTERS (collapsible sections)
│
├─ MANA COST
│  Slider: 0 ──●─────── 10+
│  Selected: 3-5
│
├─ COLOR  
│  ☐ White  ☐ Blue  ☐ Black
│  ☑ Red    ☐ Green  (checkbox buttons)
│
├─ CARD TYPE
│  ☑ Creature  ☐ Instant  ☐ Sorcery
│  ☐ Enchantment  ☐ Artifact  ☐ Land
│  ☐ Planeswalker  (multi-select)
│
├─ RARITY
│  ☐ Common  ☐ Uncommon
│  ☑ Rare    ☑ Mythic
│
├─ LEGALITY (Format-specific)
│  ☑ Legal    ☐ Banned
│
└─ SET/EDITION
   [Dropdown showing 200+ sets]
```

### Filter Logic (Inferred)
```typescript
// When user selects: Red + Green colors
// Does it mean:
// A. Cards that are BOTH red AND green? (Dual-color cards only)
// B. Cards that are EITHER red OR green? (All red + all green separately)

// Most likely: B (OR logic), allows broader searches
// But also filter to: cards with color_identity include at least 1 selected color

const filtered = cards.filter(c => {
  // AND all the conditions together
  return (
    matchesSearch(c, query) &&
    (selectedColors.length === 0 || 
     selectedColors.some(color => c.color_identity.includes(color))) &&
    (selectedRarity.length === 0 || 
     selectedRarity.includes(c.rarity)) &&
    (selectedTypes.length === 0 || 
     selectedTypes.some(type => c.type_line.includes(type))) &&
    c.legalities[format] === 'legal'
  )
})
```

### Filter State Management
- **URL persistence:** Filters likely saved in query params
- **Deep linking:** `moxfield.com/search?colors=red,green&type=creature&format=standard`
- **Local storage:** Save favorite filter presets?
- **Real-time:** Results update as you change sliders/checkboxes (no submit button)

---

## 5. CARD COMPONENT ARCHITECTURE

### Card Display (Inferred Component Structure)

```typescript
// Likely component hierarchy:
<DeckBuilder>
  <SearchPanel>
    <SearchInput 
      debounce={300}
      onSearch={(query) => filterCards(query)}
    />
    <FilterPanel>
      <ColorFilter />
      <CostFilter />
      <TypeFilter />
      <RarityFilter />
    </FilterPanel>
    
    <CardGrid 
      cards={filteredCards}
      virtualized={true}  // Only render 20-40 cards in view
    >
      <CardCard 
        card={card}
        quantity={deckList[card.id]}
        onClick={() => addToDeck(card)}
        onHover={() => showPreview(card)}
      />
    </CardGrid>
  </SearchPanel>

  <DeckListPanel>
    <DeckStats 
      manaCurve={calculateManaCurve()}
      colorBreakdown={calculateColors()}
      typeBreakdown={calculateTypes()}
    />
    <DeckList>
      <DeckCard 
        card={card}
        quantity={qty}
        onRemove={() => removeFromDeck(card)}
        onQtyChange={(newQty) => updateQty(card, newQty)}
      />
    </DeckList>
  </DeckListPanel>
</DeckBuilder>
```

### Individual Card Component

```typescript
interface CardCardProps {
  card: Card
  quantity?: number          // If in deck, how many copies
  inDeck: boolean
  onClick: () => void
  onHover: (card: Card) => void
}

// Rendered as:
<div class="card-tile" 
     onHover={() => showFullCard(card)}
     onClick={() => addToDeck(card)}>
  
  {/* IMAGE */}
  <img 
    src={scryfall_image_url} 
    alt={card.name}
    loading="lazy"           // Lazy load for performance
  />
  
  {/* COST BADGE (top-right) */}
  <div class="mana-cost">
    {renderManaCost(card.mana_cost)}  // {1}{R} → SVG symbols
  </div>
  
  {/* NAME & TYPE */}
  <div class="card-info">
    <h3>{card.name}</h3>
    <p>{card.type_line}</p>
  </div>
  
  {/* IF IN DECK: Quantity Badge */}
  {inDeck && (
    <div class="qty-badge">{quantity}x</div>
  )}
  
  {/* HOVER PREVIEW */}
  {onHover && (
    <CardPreviewPopover 
      card={card}
      showStats={true}
      showLegality={true}
    />
  )}
</div>
```

### Card Hover Behavior
```
User hovers over "Lightning Bolt" card:

┌──────────────────────────────┐
│  LIGHTNING BOLT              │
│  [Card Image]                │
│                              │
│  Instant — Red               │
│  Mana cost: {R} (1)         │
│                              │
│  Oracle text:                │
│  "Lightning Bolt deals 3 damage│
│   to any target."            │
│                              │
│  Set: LEA (50.2)            │
│  Rarity: Common             │
│  Legality:                   │
│   ✓ Standard, ✓ Modern      │
│   ✓ Commander, ✓ Pauper     │
│   ✗ Pioneer (banned)        │
│                              │
│  [Add to Deck] [Details]    │
└──────────────────────────────┘
```

**Key details:**
- Shows full card text (Oracle text, authoritative version)
- Legality icons (✓ legal, ✗ banned/not legal)
- Mana symbols rendered as SVG (not text)
- Vendor prices might be shown (TCGPlayer, Cardmarket)

---

## 6. DECK LIST VIEW

### Display Format (Inferred)

**Desktop (wide):**
```
┌─ DECK STATS ──────────────┐
│ Mana Curve (histogram)    │ 1-3: ████ 4-5: ██████ 6+: ███
│ Color Breakdown (pie)     │  Red 40% Green 35% White 25%
│ Type Breakdown            │ Creatures: 24, Spells: 26
│ Total Cards: 50/60        │
└───────────────────────────┘

┌─ MAIN DECK ────────────────────────────────┐
│ [Creatures (12 cards)]                     │
│  4x Lightning Visionary    {1}{R}  Creature│
│  3x Goblin Token Maker     {R}    Creature│
│  ...                                       │
│ [Spells (20 cards)]                        │
│  4x Lightning Bolt         {R}    Instant │
│  2x Counterspell           {U}{U} Counter │
│  ...                                       │
│ [Land (18 cards)]                          │
│  9x Mountain               {T}    Land    │
│  9x Forest                 {T}    Land    │
│  ...                                       │
└────────────────────────────────────────────┘
```

**Mobile (collapsed):**
```
┌─ DECK STATS ─────────┐
│ 50 cards, 27 unique  │
│ Avg. CMC: 2.5        │
└──────────────────────┘

┌─ DECK (tap to expand)─┐
│ ⓘ Lightning Bolt (4x) │
│ ⓘ Counterspell (2x)   │
│ ⓘ Goblin Token (3x)   │
└──────────────────────┘
```

### Interactions on Deck Cards

```typescript
// Each card in deck list is clickable/interactive:

<DeckCard 
  card={card}
  quantity={qty}
  onRightClick={() => showContextMenu(card)}
  onHover={() => highlightInSearch(card)}
/>

// Context menu (right-click):
[✕] Remove 1 copy
[↑↑] Move to top
[↓↓] Move to bottom
[Edit qty...]
[View details]
```

### Grouping Strategy
```
// Cards grouped by:
// 1. Zone (if using multiple): Main → Side → Commander
// 2. Type: Creatures → Instants → Sorceries → Enchantments → Artifacts → Lands
// 3. Within type: Sorted by mana cost (ascending)
// 4. Same cost: Alphabetical

// Why this order:
// - Common card types appear first (creatures, removal)
// - Lands bundled at bottom (helps with deck building)
// - Cost sorting helps visualize mana curve
```

---

## 7. CARD DESIGN & VISUAL LANGUAGE

### Visual Hierarchy

```
PRIORITY 1 (Immediately visible):
  ✓ Card image (1/3 of card space)
  ✓ Mana cost icon (top-right corner)
  ✓ Card name (bold, large)

PRIORITY 2 (On hover/preview):
  ✓ Full card text (oracle_text)
  ✓ Card type line
  ✓ Power/toughness corner
  ✓ Set & rarity

PRIORITY 3 (Detailed view):
  ✓ All printings available
  ✓ Vendor prices
  ✓ Format legality
  ✓ Flavor text
```

### Design Decisions

**Why card image is large:**
- Magic players instantly recognize cards by image
- Image > text for quick visual scanning
- Competitive players already know card text

**Why mana cost is prominent:**
- Mana curve is important for deck building
- Players filter by cost constantly
- Visual mana symbols (not text) = faster parsing

**Why type line is below name:**
- Confirms what kind of card (creature? spell?)
- Important for instant decision-making

**Why legality badges matter:**
- Players build for specific formats
- Banned cards are visually blocked/grayed out
- Format selector changes which cards are legal

### Color Coding

```
Mana symbol colors (match Magic official):
[W] White    → Light gray/cream
[U] Blue     → Blue
[B] Black    → Dark gray/black
[R] Red      → Red
[G] Green    → Green
[X] Generic  → Gray

Rarity indicators:
◇ Common     → Light gray
◇ Uncommon   → Silver
◇ Rare       → Gold
◇ Mythic     → Orange/Red

Card frame:
- Dark frame = regular card
- Gold frame = reserved list (can't reprint)
- Special frames = promos, secret lairs, etc.
```

---

## 8. STATE MANAGEMENT & PERSISTENCE

### How Moxfield Likely Handles State

```typescript
// Vue/Nuxt likely uses:

// Option A: Vuex (centralized store)
export const deckStore = {
  state: {
    currentDeck: { cards: {}, format: 'standard' },
    searchFilters: { colors: [], types: [], cost: [0, 10] },
    filteredCards: [],
    deckModified: false
  },
  mutations: {
    ADD_CARD(state, { card, quantity }) {
      state.currentDeck.cards[card.id] = { ...card, quantity }
      state.deckModified = true
    },
    SET_FILTER(state, { filter, value }) {
      state.searchFilters[filter] = value
    }
  }
}

// Option B: Composition API (newer Vue 3 pattern)
const { deck, addCard, updateFilter } = useDeckStore()
const { filters, setFilter } = useFilterStore()
```

### Deep Linking & URL State
```
URL when on deck page:
https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA

URL when searching with filters:
https://moxfield.com/search?q=lightning&colors=red,white&type=instant&format=standard

This means:
- Filters are stored in URL query params
- User can share filtered searches
- Browser back button restores filters
- Page refresh maintains user's search state
```

### Autosave & Conflict Prevention
```typescript
// Likely Moxfield pattern:

const [deck, setDeck] = useState(initialDeck)
const [saving, setSaving] = useState(false)
const [lastSaved, setLastSaved] = useState(null)

// Auto-save when user stops editing
useEffect(() => {
  const timer = setTimeout(() => {
    if (dirtyFlags.deckChanged) {
      saveDeck(deck)
        .then(() => {
          setSaving(false)
          setLastSaved(new Date())
        })
        .catch(error => showError("Save failed, retrying..."))
    }
  }, 2000)  // 2 second debounce before saving
  
  return () => clearTimeout(timer)
}, [deck])

// Show "Unsaved changes" indicator if modified but not saved
```

---

## 9. PERFORMANCE OPTIMIZATIONS (Inferred)

### Virtualization (for large deck/card lists)
```typescript
// Moxfield likely uses react-window or similar for VirtualList
// Only renders 20-40 cards in viewport at a time
// Rest loaded on scroll

// Pseudo-code:
<VirtualList
  items={filteredCards}  // Could be 1000+ items
  height={600}           // 600px viewport
  itemSize={100}         // Each card: 100px tall
  renderItem={(card, index) => (
    <CardCard card={card} />
  )}
/>

// Benefits:
// - Render 1000 cards but only paint 30 at a time
// - Smooth scrolling even with huge lists
// - Huge performance boost
```

### Image Lazy Loading
```html
<!-- Images outside viewport not fetched until scroll -->
<img 
  src="..." 
  loading="lazy"
  alt="card name"
/>

<!-- Scryfall provides:
  - Small thumbnail (~100px)
  - Medium preview (~250px)
  - Large full-res (~500px)
-->
```

### Search Debounce (Likely 200-300ms)
```typescript
const debouncedSearch = useCallback(
  debounce((query) => {
    setLoading(true)
    fetchCards(query, currentFilters)
      .then(results => {
        setFilteredCards(results)
        setLoading(false)
      })
  }, 300),  // Wait 300ms after user stops typing
  [currentFilters]
)

// When user types "lig" → "ligh" → "light" → "lightn" → "lightni"
// Only fires API call once (after they stop typing for 300ms)
// Prevents 5 unnecessary API calls
```

### Bundle Size Optimization

Moxfield's minimalism suggests:
```
Approach: Ship only what's needed
- No heavy UI frameworks (already discussed)
- Zod for validation (2kb gzipped)
- Minimal dependencies overall
- Code splitting for routes (deck builder ≠ search page)
```

---

## COMPARISON: MOXFIELD vs GUNDAM-FORGE

| Aspect | Moxfield | Gundam-Forge |
|--------|----------|--------------|
| **Framework** | Nuxt.js (Vue, SSR) | Next.js 14 (React, App Router) |
| **Data** | Server-side card database | Static `cards.json` export |
| **Search** | API + server-side filtering | Client-side JS filtering |
| **Auth** | AWS Cognito (multi-user) | Browser localStorage |
| **Deck persistence** | Server database | Browser localStorage/export |
| **Cards** | 30+ years, 20k+ unique | ~471 cards |
| **Filtering performance** | Can index millions | Must be fast in JS |
| **Realtime features** | Possible (WebSocket) | N/A (static export) |

### What Gundam-Forge Can Learn

1. **Card Schema Completeness**
   - Include all variant info (foil, non-foil, promo)
   - Track format legality per card
   - Pre-calculate color identity for filtering

2. **Filter Architecture**
   - Use URL params for deep linking
   - Implement memoization to avoid re-filtering
   - Consider virtualization for large card lists

3. **UX Patterns**
   - Mana curve visualization (even at 50-card deck size)
   - Color breakdown pie chart
   - Type breakdown stats
   - Hover previews with full card text

4. **Mobile-First Thinking**
   - Bottom sheet for filters on mobile
   - Tap-to-add-card instead of drag-drop
   - Responsive card display size

5. **Search Debounce**
   - 150-300ms debounce on search input
   - Prevents excessive re-renders
   - Especially important for client-side filtering

---

## UNDOCUMENTED/PROPRIETARY (Still Mystery)

Despite deep research, these remain proprietary:
- [ ] Exact autocomplete algorithm (fuzzy match? frequency-based?)
- [ ] Card image loading strategy (which Scryfall endpoint?)
- [ ] Mana curve calculation (exact formula)
- [ ] Deck recommendation engine (if exists)
- [ ] Real-time collab sync (if exists)
- [ ] Analytics/trending calculation (how is "trending" defined?)
- [ ] Bot detection beyond proof-of-work (IP blocking? pattern analysis?)

---

## RECOMMENDATIONS FOR GUNDAM-FORGE

### Phase 1: Adopt Immediately
1. ✅ URL-based filter persistence (already doing!)
2. ✅ Card preview on hover (implement full card text preview)
3. ✅ Mana curve visualization (adapt for Gundam cost values)
4. ✅ Search debounce (150ms for card search input)
5. ✅ Virtualization (if card list grows beyond 1000)

### Phase 2: Consider for v2
1. 🔄 Server-side card database (if moving off static export)
2. 🔄 User authentication (if multi-user features needed)
3. 🔄 Trending/meta analytics (tournament integration?)
4. 🔄 Real-time deck sharing (WebSocket?)

### Phase 3: Monitor
1. 📊 Performance on large decks (100+ cards)
2. 📊 Mobile search responsiveness
3. 📊 Bundle size growth as features added

