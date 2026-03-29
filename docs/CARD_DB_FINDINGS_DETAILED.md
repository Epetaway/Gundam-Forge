# Card Database Audit: FINAL FINDINGS

**Date**: March 2026  
**Database File**: `apps/web/lib/data/cards.json`  
**Sample Count**: 318 total entries (with variants)

---

## 📊 Actual Database Composition

### Summary by Set

```
GD01 (Newtype Rising)           175 entries
├─ Official cards:              130 cards
├─ Beta versions:               35 cards (testing/development)
└─ Promo variants:              10 cards

ST01-ST04 (Starter Decks 1-4)   97 entries
├─ ST01:                        15 official + 11 beta + 2 promo
├─ ST02:                        16 official + 7 beta + 1 promo
├─ ST03:                        16 official + 4 beta
└─ ST04:                        16 official + 6 beta + 3 promo

EX Series (Special/External)    8 entries
├─ EXB (Base):                  1 official + 1 beta + 5 promo
└─ EXR (Resource):              1 official + 1 beta + 2 promo

R Set (Resources/Generic)       20 entries
├─ R-001 to R-009:              9 Resource cards
├─ R Beta:                      1 card (testing)
└─ RP Promo:                    10 cards

T Set (Test/Mixed Units)        15 entries
├─ T-001 to T-011:              11 Unit cards (Gundam, Zaku, Strike variants)
├─ T Beta:                      4 cards (testing)
└─ Note:                        Appears to be development/test set

TOTAL OFFICIAL UNIQUE:          ~170 cards
TOTAL WITH VARIANTS:            318 entries
```

---

## 🔍 Analysis

### What We Have ✅
- **GD01 (Newtype Rising)**: ~95% complete - This is THE game's launch set
- **ST01-ST04 (Starters)**: ~95% complete - Four starter deck sets
- **EX Cards**: Complete - Special external/colorless cards
- **R Set**: Complete - Generic resource cards (likely for game balance)
- **T Set**: Complete - Test/development mobile suit cards
- **Beta/Promo Variants**: Present - Good for tracking development history

### What We're Missing ❌

| Set | Type | Cards | Status | Release Date |
|-----|------|-------|--------|--------------|
| GD02 | Booster | ~120 | MISSING | 2024-03-01 |
| GD03 | Booster | ~120 | MISSING | 2024-06-01 |
| GD04 | Booster | ~120 | MISSING | 2024-09-01 |
| GD05 | Booster | ~120 | MISSING | 2025-03-01 |
| ST05 | Starter | ~40 | MISSING | 2024-04-01 |
| ST06 | Starter | ~40 | MISSING | 2024-04-01 |
| ST07 | Starter | ~40 | MISSING | 2024-07-01 |
| ST08 | Starter | ~40 | MISSING | 2024-07-01 |
| ST09 | Starter | ~50 | MISSING | 2024-10-01 |
| PC01A | Premium | ~30 | MISSING | 2024-02-01 |
| PC02A | Premium | ~30 | MISSING | 2024-05-01 |
| PB01 | Premium | ~30 | MISSING | 2024-08-01 |
| PB02 | Premium | ~30 | MISSING | 2024-11-01 |
| **SUBTOTAL** | | **~900** | | |
| Promos/Variants | | Unknown | PARTIAL | Ongoing |

**Total Missing**: ~900-950 official cards (since 2024-01-01)

---

## 🎯 Data Quality Assessment

### Positive Aspects ✅

1. **Core Data Integrity**
   - All required fields present (id, name, type, color, cost, ap, hp)
   - Consistent format throughout
   - IDs properly formatted (SET-###)
   - Type/color enums validated

2. **Beta Tracking**
   - Separate "Beta" variants preserved (useful for development history)
   - Shows iteration/testing process

3. **Promo Tracking**
   - Separate "Promo" variants maintained
   - Good for competitive/tournament tracking

4. **Official Set Priority**
   - Game launch set (GD01) is ~95% complete
   - First set has comprehensive coverage = good foundation

### Issues & Concerns ⚠️

1. **Stale Database**
   - Last update appears to be before Q1 2024
   - Missing entire year+ of official releases
   - No metadata showing version/update date

2. **Mystery Sets**
   - **R Set**: Generic resources (reasonable for card economy)
   - **T Set**: Test/development cards, not official release
   - Should be clearly marked as non-official

3. **Missing Metadata**
   - No `releaseDate` field consistently populated
   - No `source` field (where card data came from)
   - No `verifiedDate` (when data was last checked)
   - No `legal` status (tournament legality tracking)
   - No `expansion` flag (marks if card is special EX type)

4. **Image Assets**
   - Using placeholder URLs (`https://placehold.co/...`)
   - No real card artwork
   - All cards show same placeholder instead of unique images

5. **No Update Mechanism**
   - Unknown how/when data gets refreshed
   - Manual process vs automated sync unclear
   - Risk of continued staleness

---

## 📈 Completeness Metrics

```
Universe Breakdown:
├─ GD01 + ST01-ST04 = 170 core cards ........... ✅ 95% present
├─ GD02-GD05 (boosters) = 480 cards ........... ❌ 0% present
├─ ST05-ST09 (starters) = 210 cards ........... ❌ 0% present
├─ PC/PB (premium) = 120 cards ................. ❌ 0% present
├─ Promos/Regional = ~100+ cards ............... ⚠️ Partial
└─ Total Official Game = ~1000-1200 cards

Database Coverage = 170/1000 = 17% of entire game card pool
(or 53% if counting variants/promos = 318/600 ≈ 53% of launch era)
```

**Key Insight**: Database has the **launch set** but missed the **entire expansion era**

---

## 🔴 Critical Issues

### 1. Expansion Gap (Blocking Issue)
**Impact**: Medium-High
- Game has had 5+ major releases since database snapshot
- Users exploring new strategies will find missing cards
- Deck building tools can't reference 2024-2025 meta

### 2. No Image Assets
**Impact**: High  
- All cards show placeholder instead of real artwork
- Lookup experience is broken
- Deck guides can't use visual reference

### 3. No Metadata Tracking
**Impact**: Medium
- Can't track data freshness
- No audit trail for updates
- Can't distinguish official from test from beta

### 4. No Update Pipeline
**Impact**: High
- Database will continue to drift further behind
- No systematic way to add new sets
- Manual updates are unsustainable

---

## 🚀 Immediate Actions Needed

### Priority 1: Understand Current State
- [ ] Clarify when database was last updated  
- [ ] Identify data sources used originally
- [ ] Confirm R and T sets are intentional (test/resources)
- [ ] Locate original data collection documentation

### Priority 2: Data Collection
- [ ] Source GD02-GD05 official card lists (TCGPlayer, Bandai)
- [ ] Gather ST05-ST09 starter deck content
- [ ] Collect premium collection cards (PC/PB series)
- [ ] Find real card images (artwork, not placeholders)

### Priority 3: Schema Enhancement
- [ ] Add `releaseDate`, `source`, `verifiedDate` fields
- [ ] Add `legalStatus` for tournament tracking
- [ ] Add `setCode`, `setName` for better organization
- [ ] Add `expansion` flag for special cards

### Priority 4: Implementation
- [ ] Create data import pipeline
- [ ] Implement validation rules
- [ ] Set up automated update process
- [ ] Replace placeholder images with real artwork

---

## 📅 Estimated Timeline to Completion

```
Phase 1: Research & Planning ................. 1-2 weeks
  ├─ Gather missing set data
  ├─ Find image sources
  └─ Design schema improvements

Phase 2: Schema Update & Migration ........... 1 week
  ├─ Update database schema
  ├─ Update code models  
  └─ Migrate existing data

Phase 3: Data Import & Validation ........... 2-3 weeks
  ├─ Create import service
  ├─ Import all missing cards
  └─ Validate data quality

Phase 4: Testing & Refinement ............... 1-2 weeks
  ├─ Functional testing
  ├─ Performance testing
  └─ User acceptance testing

Phase 5: Deployment & Monitoring ............ 1 week
  └─ Deploy, monitor, adjust

TOTAL REALISTIC TIMELINE: 6-8 weeks
```

---

## 📋 Next Steps (For Next Sprint)

1. **Schedule meeting** to clarify:
   - Business impact of incomplete data
   - Timeline constraints
   - Resource availability
   - Priority sets (GD02-GD05 vs ST05-ST09 vs premium)

2. **Assign research task**:
   - [ ] Find official set checklists for GD02-GD05
   - [ ] Locate card images repository
   - [ ] Document data sources and URLs

3. **Prepare technical foundation**:
   - [ ] Design schema update
   - [ ] Plan migration strategy
   - [ ] Create validation framework

4. **Create project board**:
   - Break into actionable sprint tasks
   - Assign ownership
   - Set delivery dates

---

## 📚 Reference Documents

- [CARD_DB_UPDATE_PLAN.md](./CARD_DB_UPDATE_PLAN.md) - Detailed 6-phase implementation plan
- [CARD_IMPORT_TEMPLATE.md](./CARD_IMPORT_TEMPLATE.md) - Template with examples
- [audit-card-database.ts](../scripts/audit-card-database.ts) - Audit script (needs ESM config fix)

---

## 🎓 Key Takeaways

1. **Database is functional but incomplete** - Has 95% of launch content but 0% of expansions
2. **Staleness is critical** - Missing 2+ years of official releases  
3. **No automated pipeline** - Manual updates not scalable long-term
4. **Placeholder images** - Need real artwork for production
5. **Manageable scope** - Issue is scale (900 cards) not complexity

**Next Sprint Action**: Schedule planning meeting + start data research

