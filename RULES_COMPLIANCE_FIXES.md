# 2025 Gundam TCG Rules Compliance Fix

## Official 2025 Rules (Confirmed)
- **Opening Hand**: 5 cards (NOT 7) 
- **Mulligan**: 1 allowed (reshuffle 5 back, draw 5 new)
- **Shield Area**: 6 cards face-down (NOT 5)
- **EX Base**: 1 base card deployed
- **Hand Limit**: Maximum 10 cards (checked at end phase)
- **Deck Size**: 50 cards main deck

## Current Implementation Issues

### ❌ ISSUE 1: Opening Hand (7 cards instead of 5)
**Files to Fix:**
- `game-engine.ts` line 334: `openingHand.splice(Math.max(deckCards.length - 5, 0), 5)` 
  - Logic: "take last 5 cards" - CORRECT LOGIC but wrong variable name
  - Need to verify this actually does the right thing
  
- `game-engine.ts` lines 559: `for (let i = 0; i < 7 && player.deck.length > 0; i++)`
  - WRONG: 7 should be 5
  
- `shuffle-and-seed.ts` line 227: `for (let i = 0; i < 7; i++)`
  - WRONG: 7 should be 5
  
- `setup-sequence.ts` line 122: Comment mentions "Draw 7 cards"
  - Comment needs updating
  
- `SetupPhase.tsx` line 21: `'7 cards drawn for each player'`
  - UI text needs updating
  
- `MulliganModal.tsx` lines 97, 133: `'7 cards'` references
  - UI text needs updating
  
- `Battlefield.tsx` line 166: `Hand: {opponentState.hand.length}/7`
  - Display needs updating to show /10 max
  
- `GameStartFlow.tsx` line 6: Comment mentions "7 cards"
  - Comment needs updating
  
- `HandTray.tsx` line 263: `Hand ({cards.length}/7)`
  - Display needs updating to show /10 max
  
- `playtest-engine.ts` line 397: `while (player.hand.length > 7)`
  - WRONG: 7 should be 10

### ❌ ISSUE 2: Shields (5 instead of 6)
**Files to Fix:**
- `game-engine.ts` line 264: `Array(5).fill(null)`
  - WRONG: 5 should be 6
  
- `GameStartFlow.tsx` line 509: `const targetShields = 5;`
  - WRONG: 5 should be 6
  
- All references to this variable

### ❌ ISSUE 3: Hand Limit (checking at 7 instead of 10)
**Files to Fix:**
- `game-engine.ts` line 1399: `while (player.hand.length > 7)`
  - WRONG: 7 should be 10
  
- `playtest-engine.ts` line 397: `while (player.hand.length > 7)`
  - WRONG: 7 should be 10

### ⚠️ ISSUE 4: EX Base System
**Status**: NOT IMPLEMENTED
- Need to verify if EX Base card system exists
- May need to add support for deploying 1 EX Base during setup

## Priority Order for Fixes

### CRITICAL (Blocking Manual Testing)
1. Fix opening hand: 7 → 5 cards
2. Fix shields: 5 → 6 cards
3. Add DRAW action execution in SetupPhase (currently missing!)

### HIGH (Game Rule Compliance)
4. Fix hand limit: 7 → 10 cards
5. Implement/verify EX Base deployment

### MEDIUM (UI/Display)
6. Update all UI text references
7. Update hand display to show /10

## Code Locations Summary

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| game-engine.ts | 264 | Shields | Array(5) → Array(6) |
| game-engine.ts | 559 | Hand draw | 7 → 5 |
| game-engine.ts | 1399 | Hand limit | > 7 → > 10 |
| game-engine.ts | 573 | Comment | "7 cards" → "5 cards" |
| shuffle-and-seed.ts | 227 | Hand draw | 7 → 5 |
| playtest-engine.ts | 397 | Hand limit | > 7 → > 10 |
| GameStartFlow.tsx | 509 | Shields | 5 → 6 |
| SetupPhase.tsx | 21 | UI text | "7 cards" → "5 cards" |
| MulliganModal.tsx | 97, 133 | UI text | "7 cards" → "5 cards" |
| Battlefield.tsx | 166 | Hand display | /7 → /10 |
| HandTray.tsx | 263 | Hand display | /7 → /10 |
| game-engine.ts | 334 | Comment | Verify logic is correct |

## Testing After Fixes

1. **Setup Phase**: Should draw 5 cards, not 7
2. **Mulligan**: Select cards, should reshuffle 5 back
3. **Shields**: Should show 6 shields being placed
4. **Hand Display**: Should show "X/10" format
5. **End Phase**: Hand should discard down to 10 if > 10

## Code Pattern Examples

### BEFORE (Wrong)
```typescript
// Drawing opening hand
for (let i = 0; i < 7 && player.deck.length > 0; i++) {
  const card = player.deck.pop()!;
  card.zone = 'hand';
  player.hand.push(card);
}

// Shield creation
const shields = Array(5).fill(null).map(...)

// Hand limit check
while (player.hand.length > 7) {
  // Discard
}
```

### AFTER (Correct)
```typescript
// Drawing opening hand
for (let i = 0; i < 5 && player.deck.length > 0; i++) {
  const card = player.deck.pop()!;
  card.zone = 'hand';
  player.hand.push(card);
}

// Shield creation
const shields = Array(6).fill(null).map(...)

// Hand limit check
while (player.hand.length > 10) {
  // Discard
}
```

