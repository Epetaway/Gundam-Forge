# Release Notes Draft

Last updated: 2026-04-11
Status: Draft

## Planned Frontend Rollout

- Adds contract-gated rollout controls for Cards, Decks, and Playtester UX updates.
- Adds module-level feature flags for safe enablement and rollback.
- Hardens frontend API boundaries with runtime guards and normalization before UI render.
- Adds Cards V2 mobile filter drawer enhancements with draft-aware apply controls and quick presets.
- Adds Decks V2 source-scope filtering (`All`, `Tournament`, `Community`) in deck browser.
- Adds Playtester Assist V2 decision hint strip to highlight turn-priority actions.

## Fallback Behavior

- Deck analytics remain optional. If analytics are unavailable, deck detail UX must render without crashing and treat analytics panels as unavailable rather than blocking the page.
- Cards API responses missing optional pagination metadata fall back to required `cards` rendering only.
- Deck list responses missing optional metadata continue rendering from the normalized `decks` array.

## Rollback Controls

- `VITE_FEATURE_CARDS_UX_V2`
- `VITE_FEATURE_DECKS_UX_V2`
- `VITE_FEATURE_PLAYTESTER_ASSIST_V2`

## Notes

- No new frontend endpoint usage is introduced in this rollout foundation.
- Backend contract changes still require API Change Request approval before integration.
- Build and type QA pass after these UI slices (`npm run qa`).
