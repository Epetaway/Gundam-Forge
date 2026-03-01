# Card Workflow Analysis - Issues Found

## Problem Summary
The mulligan modal shows "Your opening hand (0 cards):" with no card images visible. This is a critical blocker for testing the game flow.

## Root Cause Analysis

### Issue 1: Opening Hand Not Being Populated (**CRITICAL**)
**Location**: SetupPhase.tsx → GameEngine

**Problem**:
1. GameEngine initializes player hand as empty: `hand: []` (game-engine.ts:281)
2. SetupPhase shows a "draw" step UI but does NOT execute the DRAW action
3. SetupPhase passes `engine.getState().players['player1'].hand` to MulliganModal
4. Since hand is never populated, MulliganModal receives empty array: `[]`
5. Card preview shows "Your opening hand (0 cards):" ✗

**Expected Flow**:
1. GameEngine initialized with shuffled deck, empty hand
2. SetupPhase should execute `engine.executeAction({ type: 'DRAW', ... })` 7 times
3. Each DRAW action moves card from deck to hand
4. After 7 DRAW actions, hand should have 7 CardInstance objects
5. MulliganModal receives hand with 7 cards and displays them

**Actual Flow**:
1. ✓ GameEngine initialized with shuffled deck, empty hand
2. ✗ SetupPhase shows "7 cards drawn..." UI animation but doesn't call executeAction (DRAW)
3. ✗ Hand remains empty throughout setup
4. ✗ MulliganModal receives empty hand
5. ✗ MulliganModal shows 0 cards

### Issue 2: Card Images Not Displayed
**Location**: MulliganModal.tsx (line 55)

**Problem**:
```tsx
const cardDef = cardDatabase[card.cardId];
```
- If `cardDatabase` is Map instead of Record → returns undefined
- If hand is empty → no cards to lookup anyway (Issue #1)

**Current cardDatabase Format**:
- page.tsx passes `cardDatabase={cardsRecord}` (Record format) ✓
- This is correct, so lookup should work IF hand has cards

**Fallback Rendering** (line 58):
```tsx
{cardDef ? (
  <CardArtImage ... />  // Renders card image
) : (
  <div>?</div>  // Shows placeholder
)}
```
- Since hand is empty, no cards render at all
- So we never see the fallback "?" placeholders

### Issue 3: Card Database Format Verified
**Status**: ✓ ALREADY FIXED

The earlier session fixed this:
- Created `cardsRecord` export in cards.ts (Object.fromEntries format)
- Updated page.tsx to pass `cardsRecord` instead of `cardsById`
- This is working correctly, but hand is still empty

## Flow Diagram: Where Cards Should Appear

```
1. PlaytestPage (deck/[id]/playtest/page.tsx)
   ├─ Loads deck from DB
   ├─ Passes cardDatabase={cardsRecord} ✓
   └─ Calls PlaytestGameEnhanced

2. PlaytestGameEnhanced
   ├─ Creates GameEngine
   ├─ Initializes with playerDeck
   └─ Calls SetupPhase (if phase === 'setup')

3. GameEngine Constructor
   ├─ createPlayerState('player1', deck, seed)
   │  └─ Shuffles deck: deck populated ✓
   │  └─ hand: [] → EMPTY ✗
   └─ Returns GameState with empty hand

4. SetupPhase Component
   ├─ Shows step-by-step UI animation
   ├─ currentStep = 1: "Draws opening hand..." (but NO action executed) ✗
   ├─ When currentStep === 2 (mulligan):
   │  └─ Calls MulliganModal(hand={engine.getState().players['player1'].hand})
   │     └─ hand = [] (still empty!) ✗

5. MulliganModal
   └─ Shows "Your opening hand (0 cards):" ✗
```

## Game Rules: Opening Hand Should Be 7 Cards

From GAME_RULES.md and official Gundam TCG rules:
- Players draw 7 cards for opening hand
- Mulligan option: shuffle back and redraw 7 (only once per player)
- After mulligan decision, place 5 shields face-down
- Then game begins

**Current Reality**: 
❌ 0 cards shown → violates game rules

## Critical Code Sections That Need Review

### 1. **SetupPhase.tsx** (lines 30-70)
- Shows "Drawing opening hand..." UI
- BUT doesn't execute DRAW actions
- Should loop 7 times calling `engine.executeAction({ type: 'DRAW' })`

### 2. **GameEngine.ts - handleDraw()** (lines 512-537)
- Correctly moves card from deck to hand ✓
- Just never gets called ✗

### 3. **GameEngine.ts - handleMulligan()** (lines 539-570)
- Correctly reshuffles and redraws 7 cards ✓
- But only if hand had 7 cards to reshuffle ✗

### 4. **MulliganModal.tsx** (lines 52-82)
- Correctly renders cards IF they exist ✓
- But no cards to render ✗

## Testing Checklist

- [ ] **Phase 1: Shuffle** - Deck should be populated in GameEngine
- [ ] **Phase 2: Draw** - Execute 7 DRAW actions to populate hand
- [ ] **Phase 3: Mulligan Modal** - Show 7 card images with names
- [ ] **Phase 4: Mulligan Choice** - Test keep vs mulligan
- [ ] **Phase 5: Shields** - Place 5 shields
- [ ] **Phase 6: Game Ready** - First player determined
- [ ] **Phase 7: Board** - Cards visible in hand tray during main game

## Database & Import Verification

### Card Database Format ✓
- Type: `Record<string, CardDefinition>`
- Access: `cardDatabase[cardId]`
- Format: Correct (not Map)

### Deck Entries Import ✓
- Source: `playerDeck.entries` 
- Type: `{ cardId: string, qty: number }`
- Format to GameEngine: Correctly converted to `DeckDefinition.cards[]`

### Card Lookup in Display ✓
- cardDatabase passed to all components
- Lookup pattern: `cardDatabase[card.cardId]`
- Image component: `<CardArtImage card={cardDef} />`

## Why Screenshots Show "0 cards"

```
Screenshot Analysis:
- "Your opening hand (0 cards):" ← hand.length === 0
- No card images visible ← No cards to iterate .map()
- Modal still shows ← MulliganModal doesn't require cards
- Buttons present ← UI renders regardless of hand state
- Shuffle animation shows ← That's visual only
```

## Next Steps (Priority Order)

1. **CRITICAL**: Add DRAW action loop to SetupPhase (draws 7 cards during "draw" phase)
2. **CRITICAL**: Verify deck cards are properly loaded into GameEngine 
3. **Important**: Test mulligan selection/redraw logic
4. **Important**: Verify card images render once hand is populated
5. **Important**: Test shield placement phase
6. **Testing**: Full workflow manual test from deck import to first turn

