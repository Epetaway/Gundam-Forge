# API Contract Board

Last updated: 2026-04-11

## Endpoint Families

| Family | Owner | Status | Source Contract | Schema Hash | Frontend Signoff | Notes |
|---|---|---|---|---|---|---|
| Cards filtering/search | Backend Lead | Stable | packages/shared/src/api-contracts.ts (`CardsQuerySchema`, `CardsApiResponseSchema`) | b56e02ee9ed7b780bf510f4809554d9cf798ce467dd3e279cf9d7f7fe1db0467 | Recorded 2026-04-11 | Runtime response validation enabled in `/api/cards` |
| Deck browser sorting/filtering | Backend Lead | Stable | packages/shared/src/api-contracts.ts (`DecksQuerySchema`, `DecksApiResponseSchema`) | b56e02ee9ed7b780bf510f4809554d9cf798ce467dd3e279cf9d7f7fe1db0467 | Recorded 2026-04-11 | Deterministic sort tie-breakers enabled in `/api/decks` |
| Deck detail analytics payload | Backend Lead | Stable | packages/shared/src/api-contracts.ts (`DeckAnalytics*ResponseSchema`) | b56e02ee9ed7b780bf510f4809554d9cf798ce467dd3e279cf9d7f7fe1db0467 | Recorded 2026-04-11 | Runtime response validation enabled in summary/cards/comparison routes |
| Playtester replay/action log/metrics | Backend Lead | Stable | packages/shared/src/api-contracts.ts (`Playtester*Schema`) | b56e02ee9ed7b780bf510f4809554d9cf798ce467dd3e279cf9d7f7fe1db0467 | Recorded 2026-04-11 | Endpoints implemented: POST `/api/playtester/replays`, GET `/api/playtester/replays/[gameId]`, GET `/api/playtester/replays/[gameId]/actions`, GET `/api/playtester/replays/[gameId]/metrics`, POST `/api/playtester/metrics` (Supabase-backed with in-memory fallback) |

## Promotion Rules

1. Draft -> Ready: contract tests pass, examples published, no schema drift in CI.
2. Ready -> Stable: frontend signoff complete, cross-environment smoke tests pass.
3. Any schema change must include change ticket and impact note before merge.

## Current Evidence

- Contract fixture validation: pass.
- Route-level Cards/Decks/Deck Analytics envelope tests: pass.
- Route-level Playtester envelope tests: pass.
- Deterministic pagination/sorting contract tests: pass.
- Recommended CI gate command: `npm run test:contracts`.
- Release smoke command: `npm run test:smoke`.
- Release smoke pass: recorded 2026-04-11.
- Frontend signoff recorded from repo QA, targeted V2/assist tests, and contract gate pass on 2026-04-11.

## Merge Freeze Trigger

If payload shape differs from the declared schema in any environment, freeze merges for affected endpoint family until drift is resolved.
