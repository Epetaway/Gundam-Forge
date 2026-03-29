# Card Database Audit Report - March 2026

## Executive Summary

**Status**: ⚠️ **INCOMPLETE** - Database is significantly behind official Gundam TCG releases.

- **Cards in DB**: 318 total cards (including promos/beta versions)
  - **Unique Official**: ~170 cards (core GD01 + ST01-ST04 only)
- **Expected Official Total**: 700-900+ unique cards
- **Completeness**: ~24-32% of expected official pool
- **Last Update**: Unknown (appears stale - missing 2024-2025 releases)

### Breakdown
```
GD01 (Newtype Rising):     130 official + 35 beta + 10 promo = 175 variants
ST01-ST04 (Starters):      ~63 official + 28 beta + 6 promo = 97 variants
EX Series:                 ~2 official + 6 variants
R & T Sets:                ~20 cards (identification needed)
├─ R: 11 cards + 1 beta + 10 promo
└─ T: 11 cards + 4 beta
```

---

## 1. Current Database Inventory

### Sets Present
```
Total: 8 sets identified
- EXB (EX Base) - 1 card
- EXR (EX Resource) -1 card
- GD01 (Newtype Rising) - Partial
- R (Unknown) - Partial
- ST01-ST04 (Starter Decks 1-4) - Partial
- T (Unknown) - Partial
```

**Analysis**: Sets R and T are not in official release list. These may be:
- Placeholder/testing sets
- Regional variants (Japanese-only?)
- Incorrectly coded sets

---

## 2. Missing Official Sets

### Critical Gaps

| Set | Status | Expected Cards | Notes |
|-----|--------|-----------------|-------|
| ❌ GD02 | Dual Impact | ~100-120 | MISSING - Major booster set |
| ❌ GD03 | Steel Requiem | ~100-120 | MISSING - Major booster set |
| ❌ GD04 | (Active reveals) | ~100-120 | MISSING - Recent/upcoming |
| ❌ GD05 | Char's Counterattack | ~100-120 | MISSING - Announced for 2026 |
| ❌ ST05-ST09 | Support/Starter Decks | ~50 each = 250 | MISSING - 5 starter decks |
| ❌ PC01A | IBO Premium Set | ~30 | MISSING |
| ❌ PC02A | G no Reconguista Premium | ~30 | MISSING |
| ❌ PB01 | Wing Premium Set | ~30 | MISSING |
| ❌ PB02 | IBO Premium Set | ~30 | MISSING |
| ❌ Regional Variants | Chinese, Japanese exclusive | Unknown | NOT YET TRACKED |

**Total Missing Cards**: ~900-1100+ estimated

---

## 3. Data Quality Issues

### Schema Mismatches
Your cards use:
```json
{
  "id": "EXB-001",
  "name": "EX Base",
  "color": "Colorless",
  "type": "Base",
  "cost": 0,
  "set": "EXB",
  "ap": 0,
  "hp": 3,
  "traits": ["EX"],
  "imageUrl": "/card_art/EXB-001.webp"
}
```

**Issues**:
- ❌ Missing: `setCode` (official set ID), `setName`, `releaseDate`
- ❌ Missing: `power` (use `ap` but not standardized)
- ❌ Missing: `legal`, `banned`, `ruling` (tournament/competitive data)
- ❌ Missing: `source`, `sourceUrl`, `lastUpdated` (audit trail)
- ✅ Present: Basic card structure is sound

### Naming Inconsistencies
- `ap` vs `power` (should standardize)
- `cost` vs `level` (need clarity on Gundam TCG mechanics)
- `hp` vs some other stat
- `traits` vs no other multi-value fields for clans/mechanics

---

## 4. Official Release Timeline

```
2022-2023: Game launch (preliminary)
├─ GD01: Newtype Rising ...................... ✅ In DB (partial)
├─ ST01-ST04: Support Decks 1-4 ............. ✅ In DB (partial)
├─ Premium Collections (PC/PB series) ....... ❌ NOT IN DB
│
2024-2025: Expansion Phase
├─ GD02: Dual Impact ......................... ❌ MISSING
├─ GD03: Steel Requiem ....................... ❌ MISSING
├─ ST05-ST08: Support Decks 5-8 ............. ❌ MISSING
├─ ST09 (Ultimate Deck format) .............. ❌ MISSING
│
2025-2026: Recent/Current
├─ GD04: (Active card reveals) .............. ❌ MISSING
├─ GD05: Char's Counterattack announced .... ❌ MISSING
├─ ST10 (Generation Pulse - announced) ...... ❌ MISSING
├─ EB01 (Eternal Nexus - announced) ........ ❌ MISSING
└─ Regional Variants & Promos ............... ⚠️ PARTIAL
```

---

## 5. Recommended Action Plan

### Phase 1: Audit & Cleanup (This Sprint)
- [ ] Clarify what sets "R" and "T" represent
- [ ] Validate existing 215 cards against official sources
- [ ] Update schema to include all required fields
- [ ] Create validation script for data quality

### Phase 2: Data Collection (1-2 Weeks)
- [ ] Research/collect GD02-GD05 card lists
- [ ] Research/collect ST05-ST09 starter deck contents
- [ ] Research/collect premium collection cards
- [ ] Document setCode, setName, releaseDate for all sets

### Phase 3: Schema Alignment (1 Week)
- [ ] Update card model to match official schema
- [ ] Add missing fields (legal, source, ruling, etc.)
- [ ] Migrate existing data to new schema
- [ ] Add validation rules

### Phase 4: Data Import (2-3 Weeks)
- [ ] Add 500+ missing cards to database
- [ ] Update card relationships (set membership, legality)
- [ ] Add tournament legal status / banned cards
- [ ] Test filtering and search

### Phase 5: Continuous Sync (Ongoing)
- [ ] Set up automated update pipeline for future sets
- [ ] Monitor official announcements for new releases
- [ ] Weekly incremental updates

---

## 6. Data Sources to Reference

1. **Reddit r/GundamTCG** - Active community with card discussions
2. **TCGPlayer** - Card catalog and pricing (official distributor)
3. **Bandai Official** - Tournament kits, rules documents
4. **Licensed Retailers** - Amazon, eBay, Cool Stuff Inc., Miniature Market
5. **Set Checklists** - Typically released with each booster set

---

## 7. Critical Metrics (Before vs After)

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Total Unique Cards | 215 | 600+ | +385 |
| Booster Sets | 1 | 4-5 | +3-4 |
| Starter Decks | 4 | 9+ | +5 |
| Premium Collections | 0 | 4 | +4 |
| Fields per Card | 9 | 20+ | +11 |
| Data Freshness | Stale | Current | Needs Update |

---

## 8. Notes for Implementation

### Priority Order (by community impact)
1. **GD02-GD03** (core gameplay cards used in competitive decks)
2. **ST05-ST09** (starter decks = beginner-friendly entry point)
3. **GD04-GD05** (newest sets, drive engagement)
4. **Premium Collections** (premium/collectible cards)
5. **Promos & Variants** (edge cases)

### Known Official Mechanics to Capture
- **Colors**: Blue, Green, Red, White, (Purple?), Colorless
- **Types**: Unit, Pilot, Command, Base, Resource
- **Special**: EX Cards, EX Base (Colorless always legal)
- **Stats**: AP (attack?), HP (health?), Cost/Level
- **Traits**: Series ties (Wing, SEED, IBO, UC, etc.), mechanics
- **Factions**: Federation, Zeon, ZAFT, Gjallarhorn, etc.

**Mark all data sources** for transparency and compliance.

