# Card Database Update Plan

## Overview

This document outlines how to systematically bring the card database from **215 cards (30% complete)** to **~700-800 cards (100% complete)**.

---

## Phase 1: Research & Data Collection (1-2 weeks)

### 1.1 Identify Official Sources

**Primary Sources (Official):**
- 🌐 **Bandai Official Website**: bandaitrading.com (card lists, images)
- 📦 **Set Checklists**: Released with each booster set (retail/TCGPlayer)
- 🏷️ **TCGPlayer**: tcgplayer.com/search?q=gundam (pricing = proof of existence)
- 📊 **Cardmarket**: cardmarket.com (European distributor)

**Secondary Sources (Community):**
- 📱 Reddit: r/GundamTCG (set discussions, checklists)
- 💬 Discord: Official Gundam TCG server
- 🎥 YouTube: Set reviews with card lists
- 📝 Wiki/Fan sites: Database of cards

### 1.2 Data Collection Checklist

For **each missing set** (GD02, GD03, GD04, GD05, ST05-ST09, PC/PB series), gather:

```
□ All card IDs (e.g., GD02-001, GD02-002, ...)
□ Card names
□ Card types (Unit, Pilot, Command, Base, Resource)
□ Card colors (Blue, Green, Red, White, Purple, Colorless)
□ Stats (Cost, AP, HP)
□ Traits (faction, series, mechanics)
□ Set info (setCode, setName, releaseDate)
□ Card images/URLs (webp format)
□ Rarity info if applicable
```

### 1.3 Create Working Data Files

Create temporary JSON files for new sets:

```bash
seed/
├── gdx-booster-sets.json      # GD02-GD05 data
├── st-starter-decks.json      # ST05-ST09 data
└── premium-collections.json   # PC/PB data
```

---

## Phase 2: Schema Update (1 week)

### 2.1 Update Card Model

Current schema:
```typescript
interface Card {
  id: string;
  name: string;
  color: string;
  type: string;
  cost: number;
  set: string;
  ap: number;
  hp: number;
  traits: string[];
  imageUrl?: string;
}
```

**New schema:**
```typescript
interface Card {
  // Existing fields (keep all)
  id: string;
  name: string;
  color: string;
  type: string;
  cost: number;
  set: string;
  ap: number;
  hp: number;
  traits: string[];
  imageUrl?: string;
  
  // New fields (for complete data model)
  setCode: string;              // e.g., "GD02"
  setName: string;              // e.g., "Dual Impact"
  releaseDate: string;          // ISO 8601: "2024-03-01"
  cardNumber: number;           // e.g., 1 (for GD02-001)
  rarity?: string;              // 'Common', 'Uncommon', 'Rare', 'SR', 'UR'
  legal: {
    format: string;             // 'Standard', 'Extended', etc.
    status: 'legal' | 'restricted' | 'banned';
    since?: string;             // ISO date when status changed
  };
  rulings?: Array<{
    question: string;
    answer: string;
  }>;
  source: {
    origin: string;             // 'Bandai', 'TCGPlayer', 'Community', etc.
    url?: string;               // Link to source data
    verifiedDate?: string;      // When last verified
  };
  seriesAffiliation?: string;   // 'Mobile Suit Gundam', 'Gundam Wing', 'SEED', etc.
  faction?: string;             // 'Federation', 'Zeon', 'ZAFT', etc.
  expansion?: string;           // e.g., "EX" for special mechanic cards
}
```

### 2.2 Migration Script

Create script to safely migrate existing cards:

```bash
scripts/migrate-card-schema.ts
```

This should:
- Load old cards
- Map old fields to new fields
- Generate default/placeholder values for new fields
- Create migration log (for rollback if needed)
- Validate results

---

## Phase 3: Development Tasks

### 3.1 Implement Data Loader

Create TypeScript module for importing new card sets:

```typescript
// services/card-import.ts
export async function importCardSet(setCode: string, sourceFile: string) {
  // 1. Parse source JSON
  // 2. Validate each card against schema
  // 3. Fetch/download card images
  // 4. Insert into database (with transaction)
  // 5. Index for search
  // 6. Return import report
}
```

### 3.2 Update Database Seeding

Modify seed files:
- `seed/official_cards_enhanced.json` - Add GD02-GD05 + ST05-ST09
- Create new seed for premium collections
- Update migration script to load all sets

### 3.3 Add Validation Rules

```typescript
// lib/card-validation.ts
export const CardValidationRules = {
  // Each card must have all required fields
  required: ['id', 'name', 'set', 'color', 'type', 'cost', 'ap', 'hp'],
  
  // Enums
  colors: ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'],
  types: ['Unit', 'Pilot', 'Command', 'Base', 'Resource'],
  
  // Ranges
  cost: { min: 0, max: 12 },
  ap: { min: 0, max: 20 },
  hp: { min: 1, max: 10 },
  
  // Format validation
  cardId: /^[A-Z]{2,4}\d{2,3}-\d{3,4}$/,
  setCode: /^[A-Z]{2,4}\d{2}?$/,
};
```

---

## Phase 4: Batch Import Process

### 4.1 GD02-GD05 Booster Sets

**Process for each set:**

1. **Research**: Gather all ~100-120 card definitions
   - Use TCGPlayer set checklist as base
   - Cross-reference with Reddit/community discussions
   - Verify card images available

2. **Create JSON**: `gdx-booster-sets.json`
   ```json
   {
     "GD02": {
       "name": "Dual Impact",
       "releaseDate": "2024-03-01",
       "cards": [
         {
           "id": "GD02-001",
           "name": "...",
           "color": "...",
           ...
         }
       ]
     }
   }
   ```

3. **Import**: Run import script
   ```bash
   npm run import:cards -- --source seed/gdx-booster-sets.json
   ```

4. **Validate**: Run audit script
   ```bash
   npm run audit:cards
   ```

5. **Test**: Verify search, filtering, deck building works

### 4.2 ST05-ST09 Starter Decks

Same process but for 5 sets × 40 cards each

### 4.3 PC/PB Premium Collections

Same process for 4 sets × 30 cards each

---

## Phase 5: Verification & Testing

### 5.1 Data Quality Checks

```bash
✅ All 7xx cards have valid IDs
✅ All required fields populated
✅ No duplicate IDs
✅ Set codes match official list
✅ Card images all accessible
✅ Color/Type enums valid
✅ Stats in valid ranges
```

### 5.2 Functional Testing

```bash
✅ Search: Can find cards by name, set, color, type
✅ Filtering: Filter by color, type, set works
✅ Deck Building: Can add cards to decks
✅ Sorting: Sort by cost, ap, hp, set works
✅ Display: Card images load correctly
✅ Performance: Search returns <100ms for full set
```

### 5.3 Coverage Validation

```bash
npm run audit:cards

Expected output:
  Total Cards: ~700-800 ✅
  Sets: All 16+ official sets present ✅
  Completeness: 95%+ ✅
```

---

## Phase 6: Deployment

### 6.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Data audit shows 95%+ completeness
- [ ] Backup existing database
- [ ] Migration plan documented
- [ ] Rollback procedure tested
- [ ] Release notes prepared

### 6.2 Deploy Steps

1. Backup current database
2. Run schema migration (if needed)
3. Load new seed data
4. Run full audit
5. Update cache/search indices
6. Notify team

### 6.3 Post-Deployment

- Monitor for errors
- Gather user feedback
- Fix any issues
- Update documentation

---

## Estimated Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| 1. Research | 1-2 weeks | Parallel work OK |
| 2. Schema Update | 1 week | Code review needed |
| 3. Development | 1 week | Write services, validators |
| 4. Batch Import | 2-3 weeks | Can parallelize by set |
| 5. Testing & QA | 1-2 weeks | Continuous during import |
| 6. Deployment | 2-3 days | Final validation |
| **TOTAL** | **~6-8 weeks** | Realistic full completion |

---

## Resource Requirements

### Personnel
- **Data Entry**: 1-2 people (researching, collecting card data)
- **Development**: 1-2 people (code, scripts, validation)
- **QA**: 1 person (validation, testing)

### Tools
- JSON editor or Python script for data organization
- Image hosting/downloader (for card artwork)
- Database admin tools (migration scripts, backups)
- Audit automation scripts

### Data Sources
- TCGPlayer (official distributor)
- Bandai official site
- Community resources (free)

---

## Success Metrics

After completion:

```
Database Metrics:
  • Total Unique Cards: 700-800
  • Sets: 16+ (all official booster, starter, premium)
  • Data Completeness: 95%+
  • Search Performance: <100ms average
  • Image Availability: 98%+

User Experience:
  • New cards appear in search
  • Deck building includes new cards
  • No broken images or missing data
  • Advanced filtering works smoothly
```

---

## Maintenance Plan

### Monthly Maintenance
- Monitor for new set announcements
- Update schema if needed
- Add new promos/regional variants

### Quarterly Review
- Run full audit
- Update documentation
- Plan next expansion cycle

### Yearly Update
- Archive old data versions
- Review schema evolution
- Plan major structural changes

---

## Notes

- **Community involvement**: Encourage users to report missing cards
- **Version control**: Tag database versions matching game versions
- **Performance**: Consider sharding cards if database grows beyond 1000
- **Legality**: Track errata, bans, format rotations as they happen
- **Translations**: Plan for Japanese/Korean/Chinese card names if supporting

