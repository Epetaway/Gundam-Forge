# Gundam Forge (Beta)

Gundam Forge is a beta deck builder + playtest simulator for Bandai Gundam TCG workflows.

## Workspace

- `apps/web`: React + TypeScript + Vite + Tailwind UI
- `packages/shared`: shared types, playmat zone template, validation engine

## Quick start

```bash
npm install
npm run dev:web
```

Open the local URL printed by Vite.

## Official card sync

Syncs cards from the official Gundam Card Game site into `apps/web/src/data/cards.json`.

```bash
npm run sync-cards
```

Optional environment variables:

- `GUNDAM_GCG_CARDS_URL` (default: `https://www.gundam-gcg.com/en/cards`)
- `GUNDAM_GCG_PAGE_LIMIT` (default: `0` = all pages)
- `GUNDAM_GCG_CARD_DETAIL_TEMPLATE` (optional detail URL template, use `{id}` placeholder)
- `GUNDAM_GCG_USE_PLAYWRIGHT` (default: `true`, set `false` to skip headless rendering)
- `GUNDAM_GCG_DETAIL_LIMIT` (optional; limit number of detail pages when scraping)

If Playwright is enabled, install the browser binaries once:

```bash
npx playwright install
```

## XLSX card sync

Syncs cards from a local Excel file (default: `~/Downloads/Gundam TCG Cards.xlsx`).

```bash
npm run sync-cards-xlsx
```

Optional environment variables:

- `GUNDAM_CARDS_XLSX_PATH` (absolute path to the `.xlsx` file)

## Routes

- `/` — Hangar
- `/builder` — Inventory Rack + Assembly Dock + Technical Spec panel
- `/sim` — Official playmat simulator controls and drag/drop workflow
- `/diagnostics` — Cost curve, type counts, color distribution

## Beta features implemented

- Card catalog from local `apps/web/src/data/cards.json`
- Search and filters (name, color, cost, type, set) with pagination
- Card preview panel
- Deck add/remove, grouped list, export decklist to clipboard
- Debounced deck persistence in localStorage
- Deck validation (`validateDeck`) with LED + errors/warnings UI
- Simulator core: shuffle, draw, mulligan, reset
- Drag/drop between hand and playmat zones + double-click tap/untap
- Official zone overlays from `packages/shared/src/playmat-zones.ts`
- Diagnostics derived from validation metrics

## Fetching Card Assets (Art & Pricing)

Card art images and market prices can be automatically fetched and updated via the `fetch-assets` script. This allows you to keep the card database current without manual updates.

### Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure price data sources (optional):**
   
   - **TCGPlayer** (recommended for USD pricing):
     - Register at https://platform.tcgplayer.com/docs
     - Generate API credentials
     - Add to `.env.local`:
       ```
       TCGPLAYER_PUBLIC_KEY=your_key
       TCGPLAYER_PRIVATE_KEY=your_secret
       USE_MOCK_PRICES=false
       ```
   
   - **Cardmarket** (European pricing):
     - Register at https://www.cardmarket.com/en/Api
     - Add to `.env.local`:
       ```
       CARDMARKET_API_KEY=your_api_key
       USE_MOCK_PRICES=false
       ```
   
   If no API keys are provided, the script uses **mock pricing** for testing (enabled by default).

3. **Configure card art source (optional):**
   
   By default, the script fetches card images from **ExBurst** (https://exburst.dev/gundam), which provides high-resolution Gundam TCG card artwork:
   ```
   CARD_ART_BASE_URL=https://exburst.dev/gundam/cards/sd
   CARD_ART_NAMING_PATTERN={id}.webp
   ```

### Current Status

| Set | Cards | Images | Status |
|-----|-------|--------|--------|
| GD01 - Operation V | 6 | ✅ 6 | All ExBurst images |
| GD02 - Titans Rising | 4 | ✅ 4 | All ExBurst images |
| GD03 - Steel Requiem | 4 | ✅ 4 | All ExBurst images |
| GD04 - Phantom Aria | 3 | 🔘 3 | Using placeholders (not yet in ExBurst) |
| GD05 - Freedom Ascension | 3 | 🔘 3 | Using placeholders (not yet in ExBurst) |
| GD06 - Ace Pilots | 3 | 🔘 3 | Using placeholders (not yet in ExBurst) |
| ST07 - Celestial Drive | 3 | ✅ 3 | All ExBurst images |
| ST08 - Flash of Radiance | 3 | ✅ 3 | All ExBurst images |
| ST09 - Destiny Ignition | 3 | 🔘 3 | Using placeholders (not yet in ExBurst) |
| **TOTAL** | **32** | **20 ✅ + 12 🔘** | **62.5% real art** |

**Key:**
- ✅ = Real high-resolution images from ExBurst
- 🔘 = Using placeholder art (cards not yet available in ExBurst database)

All cards have pricing data and display correctly in the deck builder.

### Running the Fetch Script

```bash
npm run fetch-assets
```

This will:
- Download card images to `apps/web/public/card_art/` (not committed)
- Fetch current market prices from configured API
- Update `apps/web/src/data/cards.json` with `imageUrl` and `price` fields
- Log a summary of success/failure counts

### Adding Missing Card Images

Some card sets (GD04, GD05, GD06, ST09) aren't yet in the ExBurst database. To add images for these:

1. **Find the images** from an alternative source (e.g., Moxfield, TCGPlayer, or official Bandai assets)
2. **Download manually** and place in `apps/web/public/card_art/{id}.webp`
3. **Update cards.json** with `imageUrl` field pointing to `/card_art/{id}.webp`
4. The UI will automatically display the real images instead of placeholders

### Key Features

- **Multiple price sources**: Tries TCGPlayer first, then Cardmarket, with mock fallback
- **Caching**: Avoids duplicate API calls within the same session
- **Selective fetch**: Use environment variables to skip images or prices
- **Flexible image URLs**: Supports custom naming patterns and base URLs
- **Non-destructive**: Existing placeholder art is preserved if fetch fails

### Example Output

```
🎨 Gundam Forge Card Asset Fetcher
=====================================

Loading cards from: /path/to/apps/web/src/data/cards.json
✓ Loaded 31 cards

[1/31] Processing: GD01-001 - RX-78-2 Gundam
  Fetching image...
    ✓ Saved to: /path/to/apps/web/public/card_art/GD01-001.jpg
  Fetching price...

[2/31] Processing: GD01-002 - MS-06S Zaku II
  ...

📊 Summary:
  Total cards: 31
  Cards with images: 31
  Cards with prices: 31

✅ Fetch complete!
```

### Troubleshooting

- **No prices fetched?**  
  Check `.env.local` credentials and that TCGPLAYER/CARDMARKET APIs are responding. Mock mode is safe for testing.

- **Images not downloading?**  
  Verify `CARD_ART_BASE_URL` is correct. The script logs attempted URLs for debugging.

- **Cards.json not updated?**  
  Ensure the file exists and is writable. Check permissions on `apps/web/src/data/`.

### Advanced: Custom Image Source

To integrate a different image API:

1. Modify `scripts/fetchCardAssets.ts` to call your custom endpoint
2. Implement the `generateImageUrl()` function for your URL scheme
3. Update `downloadImage()` to handle your image format

Example for Scryfall-like API:
```typescript
const imageUrl = `https://api.example.com/cards/${card.set}/${card.id}/en.jpg`;
```

## Placeholder assets (important)

This repo does **not** include copyrighted card art.

- When `fetch-assets` runs, real card images are downloaded to `apps/web/public/card_art/`
- This folder is **excluded from git** (see `.gitignore`)
- If images aren't available, `placeholderArt` fallback URLs are used
- To integrate new card sources, update `.env.local` with your image base URL

## Playmat zone calibration in Figma (short workflow)

1. Import a playmat image frame at your target aspect ratio.
2. Create rectangles for each official zone (`deck`, `discard`, `resource`, `battle-left`, `battle-right`).
3. For each rectangle, compute:
	- `xPercent = left / frameWidth * 100`
	- `yPercent = top / frameHeight * 100`
	- `widthPercent = width / frameWidth * 100`
	- `heightPercent = height / frameHeight * 100`
4. Update values in `packages/shared/src/playmat-zones.ts`.
5. Reload `/sim` and confirm overlays align.

## Quality commands

```bash
npm run lint
npm run qa
npm run build
```