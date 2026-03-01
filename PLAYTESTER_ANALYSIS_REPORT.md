# Gundam-Forge Playtester UI/UX Analysis & Fix Report

**Analysis Date**: March 1, 2026  
**Status**: Ready for Implementation  
**Priority**: High

---

## Executive Summary

The Gundam-Forge playtester has a solid foundation with game engine, card database, and component library in place. However, it requires significant UI/UX improvements to match the Archidekt playtester v2 reference and official playmat standards. Key issues: responsive grid layout not matching official zones, hand tray inadequate for mobile, missing Swiper integration for card catalog, incomplete drag/drop validation, and missing game start flows (shuffle, mulligan, shields, coin flip).

---

## Issues Found & Severity

### **CRITICAL - Blocking Playtest Usability**

| Issue | File(s) | Root Cause | Impact |
|-------|---------|-----------|--------|
| **1. Playmat Layout Not Responsive** | `Battlefield.tsx` | Uses fixed grid that breaks on mobile; doesn't scale zones properly | Cannot use playtester on phones/tablets; layout distorted on desktop at different viewport sizes |
| **2. Hand Tray Missing Mobile Support** | `PlayerHand.tsx` | Arc layout doesn't work on mobile; no bottom drawer implementation | Cards unplayable on phones; horizontal overflow possible |
| **3. No Card Catalog Swiper** | N/A (missing) | Card browser doesn't exist; no Swiper integration | Cannot browse cards during playtest; missing aside panel entirely |
| **4. Drag & Drop Validation Incomplete** | `Battlefield.tsx`, zone components | Drop handlers don't validate zone-specific rules; no visual feedback | Can drop invalid cards anywhere; no error messaging |
| **5. Card Stack Rendering Inconsistent** | `ShieldArea.tsx`, `BattleAreaZone.tsx` | Stack cards rendered as simple boxes with count, not actual images; text hidden behind stacks creates visual bugs | Stacks don't look like cards; duplicate text visible on some stacks |

### **HIGH - Core Flow Issues**

| Issue | File(s) | Root Cause | Impact |
|-------|---------|-----------|--------|
| **6. Game Start Flow Incomplete** | `PlaytestGameEnhanced.tsx`, `SetupPhase.tsx` | Shuffle animation exists but deck not truly shuffled; draw hand doesn't work; shield placement missing; coin flip UI incomplete | Players can't properly start a game; game state incorrect |
| **7. No AI Opponent** | `autoplayer.ts` incomplete | AI exists but token unit logic not wired; no turn simulator | Single-player testing impossible; no interactive demo |
| **8. Modal Responsiveness Issues** | `CardDetailModal.tsx` | Modal doesn't center on mobile; can get clipped; no viewport constraints | Card inspection broken on phones; modal clips content |
| **9. Missing Debug/Logging Panel** | N/A (missing) | No dev panel for state inspection | Cannot debug deck order, hand contents, shield count during play |
| **10. No Lazy Loading for Card Images** | `CardArtImage.tsx` | Images load eagerly; no intersection observer | Performance degraded on mobile with large catalog |

### **MEDIUM - Polish & Optimization**

| Issue | File(s) | Root Cause | Impact |
|-------|---------|-----------|--------|
| **11. Missing A11y Support** | All components | No ARIA labels for zones, no keyboard alt for drag/drop | Screen reader users cannot use playtester |
| **12. No Structured Logging** | Game engine | Log panel shows basic entries, no action history | Difficult to track game state changes |
| **13. Inconsistent Card Sizing** | Multiple zone components | Card images have different aspect ratios/sizes across zones | Visual inconsistency; hard to read stacked cards |
| **14. No Mobile Drag Support** | `Battlefield.tsx` | dnd-kit not configured for touch; no swipe gestures | Drag/drop broken on mobile devices |

---

## Tech Stack Analysis

**Already Available:**
- ✅ **Swiper.js** (12.1.2) — ready to use for card catalog
- ✅ **dnd-kit** (6.3.1) — drag/drop engine with touch support
- ✅ **Framer Motion** (12.34.3) — animations
- ✅ **Tailwind CSS** (4.1.13) — responsive design
- ✅ **Radix UI** (dialogs, etc.) — card modal base
- ✅ **Card Component Library** (`CardArtImage`, `CardDetailModal`) — reusable
- ✅ **Vitest + Playwright** — testing infrastructure
- ✅ **Game Engine** (`GameEngine`, shuffle, mulligan logic) — core rules implemented

**Missing/Incomplete:**
- ❌ dnd-kit touch sensors not enabled
- ❌ Swiper instance for card browser
- ❌ Lazy-load intersection observer
- ❌ Debug panel component
- ❌ Coin flip UI widget
- ❌ Hand drawer (bottom swipeable sheet)
- ❌ CSS grid named areas for playmat
- ❌ E2E tests for critical flows

---

## Patchset Plan (Ordered by Dependency)

### **Phase 1: Core Layout & Responsive Foundation**
- **Commit 1**: Implement CSS Grid playmat layout with named areas + responsive breakpoints
- **Commit 2**: Add hand tray component (desktop fan + mobile drawer via `framer-motion`)

### **Phase 2: User Interactions**
- **Commit 3**: Integrate Swiper.js for card catalog browser (2-col desktop, 1-col mobile)
- **Commit 4**: Enable dnd-kit touch sensors + implement zone drop validation rules
- **Commit 5**: Fix card stack rendering (use actual CardArtImage, consistent sizes)

### **Phase 3: Game Flow**
- **Commit 6**: Implement complete game start flow (shuffle animation, draw, mulligan UI, shield placement, coin flip)
- **Commit 7**: Add simple AI opponent (token-only autoplayer, 10-turn max)

### **Phase 4: Polish & Observability**
- **Commit 8**: Implement lazy-load card images + add debug logging panel
- **Commit 9**: Improve card modal responsiveness + add playtester-context action buttons
- **Commit 10**: Add A11y support (ARIA labels, keyboard shortcuts)

### **Phase 5: Testing & Documentation**
- **Commit 11**: Add unit tests (shuffle, draw, mulligan, drops)
- **Commit 12**: Add e2e tests (Playwright: game start → shuffle → draw → drag)
- **Commit 13**: Update README with playtester instructions, mobile testing notes, QA checklist

---

## File Structure After Implementation

```
apps/web/components/playtest/
  ├── Battlefield.tsx (UPDATED: CSS Grid named areas)
  ├── PlaytestGameEnhanced.tsx (UPDATED: hooks for game flow)
  ├── PlayerHand.tsx → HandTray.tsx (REFACTORED: new mobile/desktop switch)
  ├── CardCatalog.tsx (NEW: Swiper-based card browser)
  ├── DebugPanel.tsx (NEW: game state inspector)
  ├── GameStartFlow.tsx (NEW: shuffle/draw/mulligan/coin flip)
  ├── zones/
  │   ├── CardStack.tsx (NEW: reusable stack renderer with image)
  │   ├── BattleAreaZone.tsx (UPDATED: drag validation)
  │   ├── ShieldArea.tsx (UPDATED: use CardStack, drop validation)
  │   ├── ResourceAreaZone.tsx (UPDATED: tap/rest support)
  │   └── ... (other zone components, minor updates)
  └── __tests__/
      ├── playmat-layout.test.ts (NEW)
      ├── drag-drop-validation.test.ts (NEW)
      ├── game-start-flow.test.ts (NEW)
      └── ai-player.test.ts (NEW)

apps/web/lib/game/
  ├── simple-ai-player.ts (NEW: token-only autoplayer)
  ├── game-logger.ts (UPDATED: structured logging)
  └── ... (game engine, shuffle, mulligan — mostly untouched)

apps/web/app/
  └── decks/[id]/playtest/
      └── page.tsx (UPDATED: no changes needed)
```

---

## Key Implementation Details

### **1. Playmat CSS Grid (Responsive)**
```css
/* Desktop (≥1024px) */
.playmat {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "shields base battle-top resources"
    "shields base battle-bottom resources";
  gap: 1rem;
  max-width: 1400px;
}

/* Tablet (640px-1023px) */
@media (max-width: 1023px) {
  .playmat {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "shields base"
      "battle resources";
  }
}

/* Mobile (<640px) */
@media (max-width: 639px) {
  .playmat {
    grid-template-columns: 1fr;
    grid-template-areas:
      "shields"
      "base"
      "battle"
      "resources";
  }
}
```

### **2. Hand Tray Switch (Desktop/Mobile)**
```tsx
// Desktop: arc fan with hover zoom
// Mobile: fixed bottom drawer with swipe (framer-motion AnimatePresence)
// Condition: `useMediaQuery('(max-width: 640px)')`
```

### **3. Drag & Drop Zones**
```ts
// Zone acceptance rules:
- Battle Area: Unit | Pilot-linked-to-Unit
- Base Area: Base only
- Shield Area: any (face-down)
- Resource Area: Resource (tap to rest)
- Trash: any
- Deck: none (read-only)
```

### **4. Card Stack Rendering**
Use `CardArtImage` directly in stacks with `aspect-[5/7]` and fixed `width: 3rem` (120px at 1x scale). Add count badge on top-right. Clip overflow text.

### **5. AI Opponent**
Token units only (colorless, cost 0-2). Logic:
```
AI Turn:
  1. Draw card
  2. Play resource (if have capital)
  3. Play smallest cost unit (if resources allow)
  4. Attack all own units (if legal)
  5. End turn
  Max: 10 turns total
```

### **6. Coin Flip UI**
Modal with animated coin flip (3D CSS transform). Outcome: heads (player 1st) or tails (opponent 1st).

---

## Testing Requirements

### **Unit Tests**
- `shuffle()` returns different order each call
- `drawCards()` reduces deck, adds to hand
- `mulligan()` returns cards and redraws
- Zone validators accept/reject correct card types
- AI plays valid moves only
- Stack count updates correctly

### **E2E Tests (Playwright)**
- Desktop: load playtest → start game → shuffle animation → draw 7 → mulligan → place shields → coin flip → opponent AI turn
- Mobile: load playtest → open hand drawer via swipe → drag card to zone → undo → close drawer
- Catalog: swipe through cards in aside panel (Swiper)
- Invalid drops return with toast message

---

## Acceptance Criteria (QA Check)

- [ ] Playmat layout matches official image on desktop/tablet/mobile (no horizontal scroll)
- [ ] Hand tray visible and usable on all devices
- [ ] Card catalog (aside) uses Swiper with 2-col desktop / 1-col mobile
- [ ] Drag card from hand → valid zone works; invalid zone shows error toast
- [ ] Game start: shuffle (visible animation) → draw opening hand (7 cards) → mulligan option → place shields face-down
- [ ] Card stacks show identical-sized card images with count badge; no overlapping text
- [ ] AI opponent plays token units, draws, performs 10 turns max
- [ ] Unit tests pass (vitest run)
- [ ] E2E tests pass (Playwright: desktop + mobile chromium)
- [ ] README updated with setup/test instructions
- [ ] Mobile viewport no horizontal overflow; all zones visible with vertical scroll

---

## Deliverables Checklist

- [ ] **PLAYTESTER_ANALYSIS_REPORT.md** (this file)
- [ ] **Commits 1-13** with incremental changes
- [ ] **Unit Tests** (`__tests__/*.test.ts`)
- [ ] **E2E Tests** (`e2e/playtester.spec.ts`)
- [ ] **README.md** with playtester section
- [ ] **QA Checklist** (in PR description)
- [ ] **PR Summary** with before/after screenshots

---

## Next Steps

1. Implementation starts with **Commit 1: Playmat CSS Grid Layout**
2. Each commit is independent & can be reviewed separately
3. Tests are written incrementally alongside code
4. Final PR review checks acceptance criteria above

---

## References

- **Official Playmat**: Provided in issue description
- **Archidekt Reference**: https://archidekt.com/playtester-v2
- **Game Rules**: `/docs/GAME_RULES.md`
- **Card Schema**: `/packages/shared/src/card-schema.ts`
- **Game Engine**: `/apps/web/lib/game/game-engine.ts`

