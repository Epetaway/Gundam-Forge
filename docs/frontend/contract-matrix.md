# Frontend Contract Matrix

Last updated: 2026-04-11
Owner: Frontend Lead
Contract source of truth: `apps/web/app/api/**` route handlers plus shared types in `packages/shared/src/**`

## Rules

- Frontend may only consume endpoints listed in this document.
- Real API integration is allowed only when an endpoint status is `Ready`.
- Any missing request field, response field, or behavior requires an API Change Request before coding integration.
- Raw API payloads must be normalized at the adapter boundary before entering UI components.
- Runtime guards must tolerate optional field absence without causing render crashes.

## Status Legend

- `Ready`: Contract is active and approved for frontend integration.
- `Conditional`: Endpoint exists, but behavior depends on runtime environment or backend availability. Mock-first only for new UX work until backend reconfirms `Ready`.
- `Blocked`: Do not integrate.

## Shared Envelope

### Success

```ts
{
  ok: true;
  data: T;
  requestId?: string;
}
```

### Error

```ts
{
  ok: false;
  error: string;
  code?: string;
  requestId?: string;
  details?: unknown;
}
```

## Endpoint Matrix

| UI Surface | Route | Method | Status | Request Fields | Response Fields | Nullable Fields | Pagination | Error Shape | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cards browser | `/api/cards` | `GET` | `Ready` | `q`, `color`, `colors`, `type`, `set`, `keyword`, `zone`, `deckRole`, `matchMode`, `clans`, `traits`, `keywords`, `triggers`, `limit`, `cursor`, `excludeTypes` | `cards`, `nextCursor`, `total`, `limit`, `appliedFilters` | `nextCursor`, `total`, `limit`, `appliedFilters` | Cursor: `limit`, `cursor`, `nextCursor` | Shared envelope | `cards` is required. `limit` defaults to `30` in route handler. |
| Deck browser | `/api/decks` | `GET` | `Ready` | `q`, `color`, `archetype` | `decks` | None documented | None | Shared envelope | Results are sorted server-side by `likes + views` descending. |
| Deck detail analytics summary | `/api/deck-analytics/[id]/summary` | `GET` | `Conditional` | Path param: `id` | `analytics` | `analytics`, `analytics.archetypePopularityRank`, `analytics.colorComboRank` | None | Shared envelope plus `404`, `403`, `503` route-specific error codes | Returns `analytics: null` when Supabase is unavailable or no snapshot exists. New UX must treat analytics as optional. |
| Deck detail analytics cards | `/api/deck-analytics/[id]/cards` | `GET` | `Conditional` | Path param: `id` | `cards` | Empty array is valid | None | Shared envelope plus `404`, `403`, `503` route-specific error codes | Returns `cards: []` when Supabase is unavailable. |
| Deck detail analytics comparison | `/api/deck-analytics/[id]/comparison` | `GET` | `Conditional` | Path param: `id` | `comparison` | `comparison` | None | Shared envelope plus `404`, `403`, `503` route-specific error codes | Returns `comparison: null` when Supabase is unavailable or no comparison row exists. |

## Request and Response Detail

### `/api/cards`

Request fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `q` | `string` | No | Free-text search query. |
| `color` | `CardColor` | No | Single color filter. |
| `colors` | `CardColor[]` | No | Comma-delimited multi-color filter. |
| `type` | `CardType` | No | Card type filter. |
| `set` | `string` | No | Set code filter. |
| `keyword` | `string` | No | Scalar keyword filter. |
| `zone` | `string` | No | Zone filter. |
| `deckRole` | `'main' | 'resource' | 'ex'` | No | Deck-role filter. |
| `matchMode` | `'strict' | 'broad'` | No | Multi-select matching semantics. |
| `clans` | `string[]` | No | Comma-delimited. |
| `traits` | `string[]` | No | Comma-delimited. |
| `keywords` | `string[]` | No | Comma-delimited. |
| `triggers` | `string[]` | No | Comma-delimited. |
| `limit` | `number` | No | Max page size. |
| `cursor` | `string` | No | Opaque cursor from previous response. |
| `excludeTypes` | `string[]` | No | Comma-delimited exclusion list. |

Response fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `cards` | `CardDefinition[]` | Yes | Primary payload. |
| `nextCursor` | `string` | No | Present when more results exist. |
| `total` | `number` | No | Total matched rows before pagination. |
| `limit` | `number` | No | Echoed effective limit. |
| `appliedFilters` | `CatalogFilters` | No | Server-applied filters for trust/mismatch UI. |

### `/api/decks`

Request fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `q` | `string` | No | Searches `name`, `description`, and `owner`. |
| `color` | `string` | No | Compared case-insensitively against `deck.colors`. |
| `archetype` | `string` | No | Compared case-insensitively against `deck.archetype`. |

Response fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `decks` | `DeckRecord[]` | Yes | Invalid decks are filtered out server-side. |

### `/api/deck-analytics/[id]/summary`

Response fields when present:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `analytics.deckId` | `string` | Yes | Deck identifier. |
| `analytics.snapshotDate` | `string` | Yes | ISO-like date string. |
| `analytics.viewCountDelta` | `number` | Yes | View delta. |
| `analytics.likeCountDelta` | `number` | Yes | Like delta. |
| `analytics.metaProximityScore` | `number` | Yes | Numeric score. |
| `analytics.consistencyIndex` | `number` | Yes | Numeric score. |
| `analytics.archetypePopularityRank` | `number | null` | Yes | Nullable rank. |
| `analytics.colorComboRank` | `number | null` | Yes | Nullable rank. |
| `analytics.trendDirection` | `'up' | 'flat' | 'down'` | Yes | Enum-like value. |
| `analytics.sparklineDates` | `string[]` | Yes | Can be empty. |
| `analytics.sparklineScores` | `number[]` | Yes | Can be empty. |

### `/api/deck-analytics/[id]/cards`

Response fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `cards[].cardId` | `string` | Yes | Card identifier. |
| `cards[].inclusionRateInArchetype` | `number` | Yes | Numeric ratio/percent. |
| `cards[].performanceScore` | `number` | Yes | Numeric score. |
| `cards[].trendDirection` | `'up' | 'flat' | 'down'` | Yes | Enum-like value. |

### `/api/deck-analytics/[id]/comparison`

Response fields when present:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `comparison.deckId` | `string` | Yes | Deck identifier. |
| `comparison.deckArchetype` | `string` | Yes | Deck archetype. |
| `comparison.metaProximityScore` | `number` | Yes | Numeric score. |
| `comparison.topArchetypes` | `string[]` | Yes | Can be empty. |
| `comparison.archetypeMetaShares` | `number[]` | Yes | Can be empty. |
| `comparison.archetypeWinRates` | `number[]` | Yes | Can be empty. |

## Current Ambiguities and Blockers

| ID | Area | Severity | Status | Detail | Action |
| --- | --- | --- | --- | --- | --- |
| ACR-001 | Cards filter semantics | Medium | Open | `keyword` scalar filter and `keywords` multi-select field are both active in the cards contract. | Clarify naming and matching semantics before adding new keyword UX. |
| ACR-002 | Analytics readiness | Medium | Open | Analytics routes return `null` or `[]` when Supabase is unavailable, which is operationally different from "no data yet". | Backend to confirm whether this remains the rollout contract or should be elevated to explicit readiness metadata. |
| ACR-003 | Error-state meaning | Low | Open | Analytics client adapters currently collapse most fetch failures into `null` or `[]`. | Keep fallback behavior for backward compatibility, but record for later observability improvement. |

## Ready-for-Backend Validation

- Confirm `/api/cards` remains the only approved cards endpoint for browser filtering.
- Confirm `/api/decks` remains the only approved deck browser endpoint.
- Confirm analytics endpoints remain optional for rollout and that `null`/`[]` fallback is contractually allowed.
- Confirm no additional query params are expected for cards or decks UX upgrades.

## Feature Flag Rollout Map

| Module | Flag | Default | Notes |
| --- | --- | --- | --- |
| Cards UX upgrades | `VITE_FEATURE_CARDS_UX_V2` | `false` | Use for cards browse/filter UX work beyond current stable behavior. |
| Decks UX upgrades | `VITE_FEATURE_DECKS_UX_V2` | `false` | Use for deck browser/detail view-mode upgrades. |
| Playtester assist UX | `VITE_FEATURE_PLAYTESTER_ASSIST_V2` | `false` | Use for playtester decision-assist and QoL interactions. |
