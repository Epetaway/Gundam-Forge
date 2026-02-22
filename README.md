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

## Placeholder assets (important)

This repo does **not** include copyrighted card art.

- Current mock cards use `placeholderArt` URLs in `apps/web/src/data/cards.json`
- To swap locally, replace each `placeholderArt` value with your own local/hosted placeholder path
- Keep real copyrighted assets out of version control

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