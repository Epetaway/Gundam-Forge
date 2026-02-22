# Gundam TCG Card Database Guide

## Overview

This guide documents the Gundam Forge card database system: schema, sources, ETL pipeline, validation, governance, and automated updates.

**Key Principles:**
- **Official First**: Card data sourced from Bandai official sources (API, PDFs, set releases)
- **No Copyright**: Art URLs only; no local copies. Text limited to fair use.
- **Deterministic**: All operations reproducible and testable
- **Automated**: Weekly full sync, daily incremental checks via CI
- **Transparent**: Full audit trail with source attribution

---

## 1. Card Schema (Canonical Data Model)

The canonical card schema is defined in `packages/shared/src/card-schema.ts` using **Zod** validators.

### Core Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | string | ✅ | `GD-001` | Unique card ID. Format: `XX-000` or `XXX-0000` |
| `name` | string | ✅ | `RX-78-2 Gundam` | English card name |
| `nameJP` | string | | `RX-78-2ガンダム` | Japanese name if different |
| `cost` | number (0-15) | ✅ | `4` | Play cost in resources |
| `color` | enum | ✅ | `White` | Must be: Blue, Green, Red, White, Black, Colorless |
| `type` | enum | ✅ | `Unit` | Must be: Unit, Pilot, Command, Base |
| `text` | string | ✅ | `When this enters...` | Card effect (English) |
| `textJP` | string | | `このユニットが出た時...` | Card effect (Japanese) |
| `power` | number (0-20) \| null | ✅ | `5` | Power value (Units only; null for non-Units) |
| `setCode` | string | ✅ | `UC-1` | Set ID. Format: `XX-0` |
| `setName` | string | ✅ | `Universal Century Starter` | Human-readable set name |
| `releaseDate` | ISO date | ✅ | `2024-01-15` | Set release date (YYYY-MM-DD) |
| `rarity` | enum | ✅ | `Rare` | Common, Uncommon, Rare, Special Rare, Promo |
| `artUrl` | URL | ✅ | `https://cdn.gundam-tcg...` | CDN-hosted art (no local paths) |
| `artUrlThumb` | URL | | `https://cdn.gundam-tcg...` | Thumbnail for catalogs |
| `illustrator` | string | | `Official Bandai` | Card illustrator credit |
| `legal` | boolean | ✅ | `true` | Tournament legal flag |
| `bannedDate` | ISO date | | `2024-06-01` | If banned, effective date |
| `ruling` | string | | `Entry resolves...` | Short ruling clarification |
| `rulingUrl` | URL | | `https://bandai.official/rulings/GD-001` | Link to full ruling |
| `errata` | string | | `Text changed in set 2` | Errata notice if card was changed |
| `tags` | array | ✅ | `["Mobile-Suit", "Federation"]` | Archetype/mechanic tags |
| `source` | enum | ✅ | `bandai-official` | Data source (audit trail) |
| `sourceUrl` | URL | | | Link to source document |
| `lastUpdated` | ISO datetime | ✅ | `2024-02-22T10:00:00Z` | Last modification timestamp |

### Example Card

```json
{
  "id": "GD-001",
  "name": "RX-78-2 Gundam",
  "nameJP": "RX-78-2ガンダム",
  "cost": 4,
  "color": "White",
  "type": "Unit",
  "text": "When this enters, draw 1. While you control a Pilot, this gains +1/0.",
  "textJP": "このユニットがフィールドに出た時、カードを1枚引く。あなたがパイロットをコントロール中、このユニットは+1/+0を得る。",
  "power": 5,
  "setCode": "UC-1",
  "setName": "Universal Century Starter",
  "releaseDate": "2024-01-15",
  "rarity": "Rare",
  "artUrl": "https://cdn.gundam-tcg.official/GD-001-art.jpg",
  "illustrator": "Official Bandai",
  "legal": true,
  "tags": ["Mobile-Suit", "Federation", "EFSF", "UC-Era"],
  "source": "bandai-official",
  "sourceUrl": "https://bandai.official/gundam-tcg/UC-1",
  "lastUpdated": "2024-02-22T10:00:00Z"
}
```

### Supported Tags

Tags help with deck building and filtering:

- **Archetypes**: `Newtype`, `Zeon`, `Federation`, `EFSF`, `Wing-Gundam`, `Gundam-Seed`, `Gundam-00`, `Gundam-IBO`, `UC-Era`
- **Card Type**: `Mobile-Suit`, `Mobile-Armor`, `Pilot`, `Commander`, `Support`
- **Mechanics**: `Draw`, `Control`, `Aggro`, `Combo`, `Token`, `Legendary`, `Multiple-Copies`
- **Specials**: `Psycho-Frame`, `GN-Drive`

---

## 2. Data Sources (Priority Order)

Card data is sourced from official sources first, with community fallbacks only when necessary.

### Tier 1: Official Sources (Preferred)

| Source | Type | Reliability | URL | Update Frequency |
|--------|------|-------------|-----|------------------|
| **Bandai Official API** | API | Official | `https://bandai.official/gundam-tcg/api/v1/cards` | Weekly |
| **Set Release PDFs** | PDF (scraped) | Official | `https://bandai.official/gundam-tcg/sets` | Monthly |
| **Rulings Database** | Website | Official | `https://bandai.official/gundam-tcg/rulings` | As-needed |

**How to Integrate:**
1. Contact Bandai licensing for API key
2. Set up rate limiting: 1 req/sec for API, 0.5 req/sec for PDF scraping
3. Fetch all cards on weekly schedule
4. Cross-check against official PDFs for gaps

### Tier 2: Licensed Sources (Secondary)

| Source | Type | Reliability | Notes |
|--------|------|-------------|-------|
| **Authorized App** | API | Licensed | Mobile app database (verify with official sources) |
| **Authorized Retailers** | Website | Licensed | Price/availability only; verify data with official sources |

### Tier 3: Community Sources (Fallback Only)

| Source | Type | Reliability | Notes |
|--------|------|-------------|-------|
| **Community Wiki** | Website | Community | Use for tags/archetypes; always verify text/stats with official |
| **Discord** | Community | Community | Crowd verification only |

**Source Priority by Field** (see `packages/shared/src/card-sources.ts`):
- Core data (id, cost, color, type, power): Tier 1 only
- Text/rulings: Bandai API or rulings DB
- Art URLs: Official CDN
- Tags/archetypes: Community sources (after verification)
- Legal status: Official tournament announcements

---

## 3. ETL Pipeline

### Overview

The ETL (Extract-Transform-Load) pipeline automatically fetches, normalizes, and validates card data.

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  EXTRACT    │ --> │ TRANSFORM   │ --> │ DEDUPLICATE  │ --> │  LOAD    │
│ (Fetch data)│     │(Normalize)  │     │&Validate     │     │(Publish) │
└─────────────┘     └─────────────┘     └──────────────┘     └──────────┘
```

### Extract Phase

Fetches card data from Tier 1 sources:

```bash
# Full sync (all sources)
npx ts-node scripts/fetch-cards.ts --source=all

# Specific set
npx ts-node scripts/fetch-cards.ts --source=bandai-official --set=UC-1

# Dry run (no write)
npx ts-node scripts/fetch-cards.ts --dry-run
```

**Rate Limiting:**
- Bandai API: 1 req/sec
- PDF scraping: 0.5 req/sec
- Enforced via delays between requests

**Incremental Updates:**
```bash
# Check only changed cards
npx ts-node scripts/fetch-cards.ts --incremental
```

### Transform Phase

Normalizes fields across sources:
- Unify cost formats (e.g., "4" → 4)
- Convert Japanese text to English (or preserve both)
- Map set codes to canonical format
- Standardize card URLs
- Deduplicate by card ID (keep highest-reliability source)

### Load Phase

Validates and merges into canonical DB:

1. **Validate** each card against schema (Zod)
2. **Deduplicate** by ID (prefer official source)
3. **Check** for conflicts (e.g., same ID with different text)
4. **Merge** into `seed/initial_cards.json`
5. **Generate changelog** (added/updated/deleted counts)

### Validation Script

```bash
# Validate entire database
npx ts-node scripts/validate-cards.ts

# Validate specific file
npx ts-node scripts/validate-cards.ts --file seed/fetched_cards.json

# Auto-fix issues (where possible)
npx ts-node scripts/validate-cards.ts --fix

# Verbose output
npx ts-node scripts/validate-cards.ts --verbose
```

**Validation Checks:**
- Schema compliance (Zod)
- Unique IDs
- Valid enums (color, type, rarity)
- Non-negative costs/power
- ISO date formats
- CDN-only art URLs (no local paths)
- Required fields present

---

## 4. Data Enrichment

### Art URLs

Art is stored as URLs only (never local copies). Use official CDN:

```
https://cdn.gundam-tcg.official/cards/{cardId}-art.jpg
https://cdn.gundam-tcg.official/cards/{cardId}-thumb.jpg
```

**To swap locally (development):**

1. Host images on your own CDN or local server:
   ```
   https://localhost:3000/cards/{cardId}.jpg
   ```

2. Update `seed/initial_cards.json`:
   ```bash
   sed -i 's|https://cdn.gundam-tcg.official|https://localhost:3000|g' seed/initial_cards.json
   ```

3. Or use build-time replacement in CI/CD (recommended for production)

### Rulings & Clarifications

Rulings are short clarifications (not full rules text). Source from:

```
https://bandai.official/gundam-tcg/rulings/{cardId}
```

Example:
```json
{
  "id": "GD-001",
  "ruling": "Entry trigger resolves before the card becomes tapped.",
  "rulingUrl": "https://bandai.official/gundam-tcg/rulings/GD-001"
}
```

### Translations

Maintain both English and Japanese text:

```json
{
  "name": "RX-78-2 Gundam",
  "nameJP": "RX-78-2ガンダム",
  "text": "When this enters, draw 1.",
  "textJP": "このユニットが出た時、カードを1枚引く。"
}
```

### Tags & Archetypes

Derived from official tournament announcements and community consensus:

```json
{
  "tags": ["Mobile-Suit", "Federation", "EFSF", "UC-Era"]
}
```

---

## 5. Quality Assurance

### CI/CD Integration

**On every merge to `main`:**

1. Validate all card JSON files
2. Check for schema compliance
3. Verify unique IDs
4. Test art URL accessibility (200 response)
5. Run deck validation with sample decks

```yaml
# .github/workflows/validate-cards.yml
on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npx ts-node scripts/validate-cards.ts
      - run: npm run test
```

### Manual Review

**Monthly spot-checks:**
1. Compare 10 random cards against official sources
2. Verify art URLs are accessible
3. Check for new rulings/errata
4. Review community feedback

---

## 6. Governance & Licensing

### Data Usage

- **Card Metadata**: Public domain (facts are not copyrightable)
- **Card Text**: Fair use for rules/rulings citations
- **Card Art**: CDN URLs only; respect Bandai copyright
- **Card Names/Sets**: Trademarks; use as-is

### Compliance Checklist

- ✅ No copyrighted art stored locally
- ✅ Art via CDN with proper attribution
- ✅ Card text linked to official source (URL)
- ✅ Proper source attribution (card.source field)
- ✅ DMCA/takedown process documented
- ✅ No personal data collected

### Takedown Policy

If Bandai requests removal:
1. Compliance: Remove data within 24 hours
2. Log: Document removal in CHANGELOG
3. Notify: Inform users via GitHub issue
4. Alternative: Provide official source link

---

## 7. Automation & Maintenance

### Weekly Schedule (CI/CD)

**Monday 00:00 UTC**: Full database sync

```bash
# 1. Fetch all sources
npx ts-node scripts/fetch-cards.ts --source=all

# 2. Validate
npx ts-node scripts/validate-cards.ts

# 3. Merge & publish
git add seed/initial_cards.json CHANGELOG.md
git commit -m "chore: weekly card database sync"
git push
```

**Daily 12:00 UTC**: Incremental check

```bash
# 1. Check for changes
npx ts-node scripts/fetch-cards.ts --incremental

# 2. If changes found, trigger full sync
```

### Versioning

Semantic versioning for card database releases:

```
X.Y.Z

X = Major (new set, structural changes)
Y = Minor (new cards, card changes)
Z = Patch (fixes, corrections)
```

Example:
- `1.0.0` — Initial seed (24 base cards)
- `1.1.0` — UC-2 set added (new cards)
- `1.1.1` — GD-001 ruling clarified (card updated)

### Changelog

Maintain `CHANGELOG.md` with each update:

```markdown
## [1.1.0] - 2024-03-01

### Added
- UC-2 set: 40 new cards (Nu Gundam, Sazabi, etc.)

### Changed
- GD-021 (Nu Gundam): Power increased from 5 to 6 per official errata

### Fixed
- GD-012 ruling URL was broken; corrected

### Sources
- Data fetched from: bandai-official-api, bandai-set-releases
- Validation: All 340 cards pass schema compliance
```

---

## 8. Troubleshooting

### Common Issues

**Q: "Unknown source: bandai-official-api"**
- A: Requires API key. Contact Bandai licensing or use PDF scraping fallback.

**Q: Art URL 404**
- A: CDN may be down or image missing. Check official source and re-upload if needed.

**Q: "Card ID conflict: GD-001 has different text in two sources"**
- A: Official source takes precedence. Resolve conflict manually and log in CHANGELOG.

**Q: Validation fails on a card I know is valid**
- A: Check schema version. Update Zod schema if official rules changed.

---

## 9. Quick Start

### Setup

```bash
# Install dependencies
npm install

# Validate existing database
npx ts-node scripts/validate-cards.ts

# Show statistics
npx ts-node scripts/validate-cards.ts --verbose
```

### Run Sync

```bash
# Full sync (requires Bandai API key or manual PDF download)
npx ts-node scripts/fetch-cards.ts --source=all

# Dry run (preview changes)
npx ts-node scripts/fetch-cards.ts --dry-run
```

### Integrate with App

```typescript
// In Gundam Forge app:
import { CardDefinitionSchema, validateCards } from '@gundam-forge/shared';

const cardsJson = await fetch('/api/cards').then(r => r.json());
const { valid, invalid } = validateCards(cardsJson);

if (invalid.length > 0) {
  console.error(`${invalid.length} invalid cards found`);
}

// Use valid cards for deck building
```

---

## 10. References

- **Zod Schema**: `packages/shared/src/card-schema.ts`
- **Data Sources**: `packages/shared/src/card-sources.ts`
- **Validation Script**: `scripts/validate-cards.ts`
- **ETL Pipeline**: `scripts/fetch-cards.ts`
- **Seed Data**: `seed/initial_cards.json`
- **Changelog**: `CHANGELOG.md`

---

**Last Updated**: 2024-02-22  
**Next Review**: 2024-03-22 (monthly spot-check)
