# API Contract Examples

## Common Error Envelope

```json
{
  "ok": false,
  "error": "Invalid request for /api/cards",
  "code": "BAD_REQUEST",
  "requestId": "a1b2c3d4",
  "details": [
    {
      "code": "too_big",
      "message": "Number must be less than or equal to 100",
      "path": ["limit"]
    }
  ]
}
```

## Cards: GET /api/cards (Success)

```json
{
  "ok": true,
  "requestId": "f0e1d2c3",
  "data": {
    "cards": [
      {
        "id": "GD01-001",
        "name": "Sample Unit",
        "color": "Blue",
        "cost": 3,
        "type": "Unit",
        "set": "GD01"
      }
    ],
    "nextCursor": "GD01-002",
    "total": 1,
    "limit": 30,
    "appliedFilters": {
      "color": "Blue",
      "matchMode": "strict"
    }
  }
}
```

## Deck Browser: GET /api/decks (Success)

```json
{
  "ok": true,
  "requestId": "11223344",
  "data": {
    "decks": [
      {
        "id": "blue-white-midrange",
        "name": "Blue / White Midrange",
        "description": "Tempo-oriented shell",
        "archetype": "Midrange",
        "owner": "Forge Team",
        "colors": ["Blue", "White"],
        "likes": 102,
        "views": 2234,
        "entries": [
          { "cardId": "ST01-001", "qty": 3 }
        ],
        "updatedAt": "2026-02-12T18:30:00Z"
      }
    ]
  }
}
```

## Deck Analytics Summary: GET /api/deck-analytics/{id}/summary (Success)

```json
{
  "ok": true,
  "requestId": "778899aa",
  "data": {
    "analytics": {
      "deckId": "blue-white-midrange",
      "snapshotDate": "2026-04-11",
      "viewCountDelta": 12,
      "likeCountDelta": 4,
      "metaProximityScore": 66.5,
      "consistencyIndex": 72.1,
      "archetypePopularityRank": 3,
      "colorComboRank": 2,
      "trendDirection": "up",
      "sparklineDates": ["2026-04-05", "2026-04-06"],
      "sparklineScores": [64.1, 66.5]
    }
  }
}
```

## Deck Analytics Cards: GET /api/deck-analytics/{id}/cards (Success)

```json
{
  "ok": true,
  "requestId": "99887766",
  "data": {
    "cards": [
      {
        "cardId": "GD01-001",
        "inclusionRateInArchetype": 0.63,
        "performanceScore": 74.2,
        "trendDirection": "flat"
      }
    ]
  }
}
```

## Deck Analytics Comparison: GET /api/deck-analytics/{id}/comparison (Success)

```json
{
  "ok": true,
  "requestId": "beeffeed",
  "data": {
    "comparison": {
      "deckId": "blue-white-midrange",
      "deckArchetype": "Midrange",
      "metaProximityScore": 66.5,
      "topArchetypes": ["Aggro", "Midrange", "Control"],
      "archetypeMetaShares": [0.31, 0.26, 0.18],
      "archetypeWinRates": [0.54, 0.51, 0.49]
    }
  }
}
```

## Playtester Replay (Draft Contract Example)

```json
{
  "replayVersion": "1.0",
  "gameId": "game-1712800000",
  "deckId": "blue-white-midrange",
  "createdAt": "2026-04-11T09:00:00.000Z",
  "actions": [
    {
      "id": "log-0",
      "timestamp": 1712800000000,
      "turnNumber": 1,
      "playerId": "player1",
      "actionType": "DRAW",
      "category": "draw",
      "description": "Player drew one card",
      "rulesTrace": "Draw step"
    }
  ],
  "metrics": {
    "winnerPlayerId": "player1",
    "turnCount": 8,
    "durationMs": 245000,
    "totalActions": 52,
    "actionsByCategory": {
      "draw": 8,
      "combat": 7,
      "main": 20
    },
    "actionsByPlayer": {
      "player1": 26,
      "player2": 26
    }
  }
}
```

## Playtester: POST /api/playtester/replays (Success)

```json
{
  "ok": true,
  "requestId": "abc123ef",
  "data": {
    "accepted": true,
    "replayVersion": "1.0",
    "gameId": "game-1712800000"
  }
}
```

## Playtester: GET /api/playtester/replays/{gameId}/actions?category=combat&limit=2 (Success)

```json
{
  "ok": true,
  "requestId": "feedcafe",
  "data": {
    "actions": [
      {
        "id": "log-3",
        "timestamp": 1712800010000,
        "turnNumber": 1,
        "playerId": "player1",
        "actionType": "DECLARE_ATTACK",
        "category": "combat",
        "description": "Player declared attack",
        "rulesTrace": "Main phase combat declaration"
      }
    ],
    "nextCursor": "1712800012000:log-4",
    "total": 3,
    "limit": 2
  }
}
```

## Playtester: GET /api/playtester/replays/{gameId} (Not Found)

```json
{
  "ok": false,
  "error": "Replay not found",
  "code": "REPLAY_NOT_FOUND",
  "requestId": "deadbeef"
}
```

## Playtester: GET /api/playtester/replays/{gameId}/metrics (Success)

```json
{
  "ok": true,
  "requestId": "00ffaa11",
  "data": {
    "metrics": {
      "winnerPlayerId": "player1",
      "turnCount": 8,
      "durationMs": 245000,
      "totalActions": 52,
      "actionsByCategory": {
        "draw": 8,
        "combat": 7,
        "main": 20
      },
      "actionsByPlayer": {
        "player1": 26,
        "player2": 26
      }
    }
  }
}
```
