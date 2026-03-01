# Gundam Forge: Master Claude Playtester Prompt

**Version**: 1.0 (Phase 1-4 Complete)  
**Last Updated**: March 1, 2026  
**Status**: Production-Ready Reference

---

## OVERVIEW: WHAT IS THIS DOCUMENT FOR?

This is the **authoritative prompt** for Claude (or any AI) to build features for the **Gundam Forge Playtester**—a fast-paced card game playtesting tool for the Gundam TCG.

When building new Phase 5+ features, paste this entire document as context before asking for implementation details.

---

## CORE ARCHITECTURE

### Game Engine Foundation
- **Phases**: Setup → Resource → Main → Battle → End
- **Turn Structure**: Player turn → Opponent turn (auto or manual)
- **State Management**: Immutable game state with 100-move undo/redo history
- **Card Database**: JSON catalog with 500+ Gundam TCG cards (all officially licensed)

### Data Model
```
GameState {
  players: [PlayerState, PlayerState]
  currentPhase: Phase
  turn: number
  winner: null | "player1" | "player2"
  actionLog: Action[]
}

PlayerState {
  hand: Card[]
  deck: Card[]
  shields: Card[]
  base: Card | null
  battleArea: Card[]
  resources: Card[]
  resourceDeck: Card[]
  trash: Card[]
  baseHealth: number
  mulliganTaken: boolean
}

Action {
  type: string
  player: "player1" | "player2"
  details: object
  timestamp: number
}
```

### Key Game Rules (Official Gundam TCG)
1. **Setup**: Draw 7 cards. Mulligan once if desired.
2. **Resource Phase**: Draw 1, recover all rested resources.
3. **Main Phase**: Play 1 card per turn.
4. **Battle Phase**: Declare attacks, resolve combat.
5. **End Phase**: Check if base destroyed (shield < 0) → winner declared.

---

## PHASE 1: BATTLEFIELD UI LAYOUT (FOUNDATION)

### Playmat Reference Image
The battlefield must match the official Gundam TCG playmat layout:

**Zone Layout (CSS Grid Named Areas)**:
```
┌──────────────────────────────────────────┐
│ SHIELD AREA  │ BASE AREA  │ BATTLE AREA │
├──────────────────────────────────────────┤
│ RESOURCE     │ RESOURCES  │ BATTLE AREA │
│ DECK AREA    │ (IN PLAY)  │ (CONTINUED) │
├──────────────────────────────────────────┤
│ TRASH AREA   │ CENTER     │ DECK AREA   │
└──────────────────────────────────────────┘
```

**CSS Grid Template**:
```css
display: grid;
grid-template-areas: 
  "shield base battle"
  "resource resource battle"
  "trash center deck";
grid-template-columns: 1fr 1fr 2fr;
grid-template-rows: auto auto auto;
```

### Zone Definitions & Behavior

**Shield Area (Top Left)**
- Displays face-down shield stack
- Badge shows count (e.g., "Shields: 5")
- Shields are damaged/destroyed by opponent attacks
- First shield breaks → game logs damage event

**Base Area (Top Center)**
- Shows active Base card (if played)
- Displays base health pool (e.g., "Health: 20/20")
- If empty, shows placeholder: "No base played yet"
- Base cards are permanents (stay until destroyed)

**Battle Area (Right, ~50% width)**
- Largest zone (dominates layout)
- Units placed here in rows
- Supports 5+ units per row
- Units animated during attacks
- Drag-to-declareAttack interaction

**Resource Deck & Resource Area (Left)**
- Resource Deck: Face-down stack, shows count
- Resource Area: Face-up, shows currently available resources
- Tapping/resting rotates cards 90°
- Color-coded by resource type

**Trash Area (Bottom Left)**
- Small zone for discarded cards
- Shows last X cards (scrollable)
- Click card to view details

**Center Area (Bottom Center)**
- Game log (action history)
- Phase indicator
- Mulligan button (setup only)

**Deck Area (Bottom Right)**
- Face-down deck stack
- Shows remaining card count
- Click to draw (triggers animation + hand update)

### Hand UI (Persistent Across All Layouts)

**Desktop**:
- Bottom tray, horizontal fan layout
- Cards overlap slightly (~30px)
- Hover reveals full card image
- Click shows modal with full details
- Drag to zones for play actions

**Mobile**:
- Bottom drawer (collapsible/swipeable)
- Cards stacked with full visibility
- Tap to see details
- Long-press to drag
- No horizontal page scroll (vertical only)

---

## IMAGE-BASED SOURCE OF TRUTH (DO NOT IMPROVISE LAYOUT)

You must treat the **playmat image** as the authoritative reference for:

1. **Battlefield zone layout** (where each zone sits relative to others)
2. **Card placement behavior** (where decks spawn, where shields stack, where base sits, where resources go)
3. **Visibility and interaction model** for the player's hand

### Explicit Zone Mapping from Playmat Image

The playmat image shows labeled areas including:
- **Shield Area** (top left)
- **Base Area** (top center)
- **Battle Area** (right side, large)
- **Resource Deck Area and Resource Area** (left side)
- **Deck Area** (bottom right)
- **Trash Area** (bottom left)

**RULE**: Implement these exact zones with the same relative positions in the UI.  
**DO NOT approximate or reorder the zones. Match the playmat layout exactly.**

### Zone Coordinates & Board Grid Requirements

Implement the board as a fixed "playmat grid" that mirrors the image:

- Use CSS grid with named areas (see Phase 1 section above)
- Use consistent padding/margins so cards never overflow zone bounds
- Each zone must have:
  - Visible boundary (border or subtle background)
  - Clear label (e.g., "Shield Area")
  - Subtle background panel (light gray or themed color)
- Each zone must accept drag/drop only for legal card types

### Card Spawn Rules (Must Match Image)

On game start:
- **Player deck** spawns in Deck Area as a face-down stack
- **Player shields** spawn in Shield Area as a face-down stack (count visible)
- **Player base** spawns in Base Area (face-up) if rules require; if not, area remains empty until base is played
- **Resource deck** spawns in Resource Deck Area as a face-down stack (face-down)
- **Trash** starts empty

### Hand UI Must Be Visible and Operable (Match "See Their Hand" Expectation)

Implement a **persistent hand tray** consistent with modern playtesters:

**Desktop**:
- Hand displayed as bottom "fan" or horizontal row with overlap (like a real hand)
- Cards are large enough to read and can be hovered to zoom
- Drag to play, click to inspect

**Mobile**:
- Hand becomes a bottom drawer/tray:
  - Always accessible via tap/swipe
  - Swipeable horizontally to scroll hand
  - Tap selects card, long-press enables drag or opens context menu
- **The tray must never be cut off, and must not cause horizontal page scrolling**

### Required Hand Interactions

- **Click/tap a hand card** → Opens card info modal (reuse existing card modal)
- **Dragging from hand to a zone**:
  - Snaps into that zone
  - If illegal, returns to hand with clear toast/error message
- **Hand must support "Draw" actions**:
  - Clicking deck → draws to hand
  - Dragging from deck to hand → draws (optional)
- **Hand re-ordering** (nice-to-have, not required)

### Card Placement Rules By Zone

Define and enforce:
- **Battle Area** accepts Units (and any valid in-play card types)
- **Base Area** accepts Base cards only
- **Shield Area** accepts shield cards only (face-down unless revealed)
- **Resource Area** accepts Resource cards only; tapping/resting must be supported
- **Trash** accepts any card
- **Deck areas** accept only face-down deck stacks (not individual cards, except in debug mode)

### Visual Feedback Requirements (So Users Understand What's Happening)

- **Droppable zones highlight** on drag-over (e.g., green glow)
- **Cards "snap" into piles** with smooth animation
- **Piles show count badges** (e.g., "Shields: 5", "Deck: 42")
- **Tapped/rested** rotates card 90° or uses clear "rested" visual state
- **Action log** displays in game log panel (bottom center)
- **Toast notifications** for illegal plays with reason

### Mobile Layout Must Not Break (No Cut Off / No Horizontal Scroll)

- The entire battlefield must fit inside the viewport width
- If vertical space is limited:
  - Use vertical scrolling **within** the board, not horizontal page scrolling
  - Hand stays docked or collapsible (always accessible)
- Modals and card action menus must be centered and responsive
- No element may render off-screen without a way to scroll within its container

**Validation Before Finalizing**:
- ✅ On mobile, the hand tray is visible and usable
- ✅ No board zone panels get clipped
- ✅ No horizontal page scroll occurs
- ✅ Cards appear in correct zone positions per playmat image
- ✅ Card sizing is consistent (hand, stacks, board)

---

## PHASE 2: INTERACTIVE GAMEPLAY SYSTEMS

### Mulligan System
- Player sees opening 7 cards
- Modal presents: "Keep or Mulligan?" option
- If mulligan taken: hand shuffles back, draws 7 fresh cards
- Can mulligan only once per game
- Implementation: `MulliganModal.tsx` + `GameEngine.handleMulligan()`

### Undo/Redo System
- Up to 100 game states stored in history buffer
- `Ctrl+Z` / `Cmd+Z` = Undo
- `Ctrl+Y` / `Cmd+Shift+Z` = Redo
- Buttons in UI show disabled state when not available
- History persists until game reset
- Implementation: Circular state buffer in GameEngine

### Keyboard Shortcuts (13 Total)
| Key | Action |
|-----|--------|
| Enter | Next Phase |
| Esc | Deselect Card |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Y / Cmd+Shift+Z | Redo |
| M | Toggle Log Visibility |
| H | Toggle Hand Visibility |
| B | Toggle Board Visibility |
| ? / / | Show Keyboard Legend |

---

## PHASE 3: VISUAL POLISH & AUDIO

### Animations (Framer Motion)
- **Unit Attacks**: Card slides right, opacity fades to 0.5 (0.4s)
- **Damage Numbers**: Float upward, fade out (0.8s)
- **Unit Destroyed**: Scale to 0.5, fade (0.6s)
- **Shield Break**: Scale to 0, backInOut easing (0.5s)
- **Phase Transition**: Fade out/in (0.2s/0.3s)
- **Glow Effects**: Pulse animation on selected cards
- **Bounce Effects**: Interactive feedback on buttons

**Implementation**: `variants.ts` (Framer Motion variants) + `AnimatedCard.tsx` component

### Sound Effects (Web Audio API - Procedurally Generated)
| Sound | Trigger | Description |
|-------|---------|-------------|
| Card Play | Play card to hand | Pop (800Hz + 1200Hz beeps) |
| Attack | Declare attack | Swoosh (600Hz→100Hz slide) |
| Shield Break | Shield destroyed | Crack (400Hz + 200Hz) |
| Unit Destroyed | Unit dies | Explosion (noise burst + bass) |
| Victory | Win game | Fanfare (C5→E5→G5 ascending) |
| Defeat | Lose game | Descending (C5→G4→C4) |

- Mute toggle in UI header
- Mute state persists to localStorage
- No external audio files (all procedural)

**Implementation**: `sound-effects.ts` + `useSoundEffects.ts` hook

---

## PHASE 4: INTELLIGENCE & FEATURES

### Advanced AI Opponent
- **Board Evaluation**: Threat assessment, unit count, total damage
- **Target Prioritization**: Targets highest-damage units first
- **Lethal Detection**: Calculates if damage can destroy shields + base
- **Strategy Adaptation**: AGGRESSIVE, DEFENSIVE, or BALANCED based on game state
- **Card Selection Logic**: Plays strongest available unit, makes strategic resource use

**Not yet integrated but fully implemented**: `advanced-autoplayer.ts` (350 lines)

### Card Abilities System
- **Parser**: Converts English text ("Draw 1 card") → structured format
- **Executor**: Applies effects to game state
- **6 Effect Types**: DRAW, DAMAGE_SHIELDS, DAMAGE_BASE, CREATE_TOKEN, HEAL, SEARCH_DECK
- **Triggers**: DEPLOY, ATTACK, BLOCK, DESTROY, END_OF_TURN
- **Extensible Library**: Pre-built common abilities

**Not yet integrated**: `card-abilities.ts` (330 lines) — awaits card text in database

### Mobile Responsive Design
- **Mobile** (<768px): Tab-based interface (Board | Hand | Log)
- **Tablet** (768-1023px): 2-column grid layout
- **Desktop** (1024px+): Full 4-column layout (all panels visible)
- Touch-friendly buttons (48px minimum)
- No horizontal scrolling

**Not yet integrated**: `ResponsiveLayout.tsx` (130 lines) — wrapper component ready

### Accessibility (WCAG 2.1 AA)
- Full ARIA labels on all interactive elements
- Screen reader announcements for game state changes
- Keyboard-navigable interface (all buttons tab-accessible)
- High-contrast focus rings (2px purple outline)
- Semantic HTML structure
- Skip-to-main-content link (hidden, keyboard-accessible)

**Utility library created**: `aria-utils.ts` (200 lines)  
**Integration ready**: Components need `AccessibleButton` / `AccessibleCard` wrappers

---

## COMPONENT SPECIFICATIONS

### Card Component (Master Reference)
```tsx
interface Card {
  id: string                    // "GD01-001"
  name: string                  // "RX-78-2 Gundam"
  cardType: "unit" | "base" | "resource" | "modifier" | "shield"
  colors: string[]              // ["red", "blue"]
  cost: number                  // Mana/energy to play
  attack?: number               // Combat damage
  defense?: number              // Shield points
  abilities?: CardAbility[]     // Parsed abilities
  text: string                  // Card description
  imageUrl: string              // URL to card art
  rarity?: "common" | "uncommon" | "rare" | "legendary"
}

interface CardAbility {
  name: string
  trigger: "deploy" | "attack" | "block" | "destroy" | "end_of_turn"
  effects: AbilityEffect[]
}
```

### Card Rendering Rules
- **Size**: 63.5mm × 88.9mm (standard TCG, scales responsive)
- **Aspect Ratio**: 5:7
- **Text Hierarchy**: Name (bold) → Type (small caps) → Stats (large) → Ability (medium) → Flavor (italic, small)
- **Colors**: Color-code by card type (Units red, Resources blue, etc.)
- **State Indicators**:
  - Rested: 90° rotation + "rested" overlay
  - Selected: Glow ring + scale up slightly
  - Damaged: Red tint overlay
  - Exhausted: Fade to 0.6 opacity

---

## TESTING REQUIREMENTS

### Unit Tests (Must Pass)
- GameEngine state transitions
- Combat resolution (damage, shields, base health)
- Card play validation (cost, restrictions)
- Phase progression (all 5 phases)
- Undo/redo state consistency
- Mulligan logic

### Integration Tests (Must Pass)
- Full game flow (setup → end)
- Opponent AI decision-making
- Animation lifecycle (no race conditions)
- Sound playback (no console errors)
- Hand operations (draw, play, zoom)

### Visual Tests (Manual)
- ✅ Desktop layout matches playmat image
- ✅ Mobile layout responsive, no cut-offs
- ✅ Animations smooth (60fps)
- ✅ Cards snap to zones correctly
- ✅ Hand fan/drawer works as expected

### Accessibility Tests (Manual)
- ✅ Tab through all buttons (no traps)
- ✅ Screen reader announces phase + game state
- ✅ Keyboard shortcuts work (no text input blocks)
- ✅ Focus ring visible on all elements
- ✅ Contrast meets WCAG AA (4.5:1)

---

## DEPLOYMENT CHECKLIST

Before pushing to production:

- [ ] All tests pass (npm run test)
- [ ] No console errors (check browser dev tools)
- [ ] Animations smooth on low-end device (iPhone 8 / Pixel 3)
- [ ] Mobile layout tested on real device (not just responsive mode)
- [ ] Screen reader tested (iOS VoiceOver or Android TalkBack)
- [ ] Game loads under 3 seconds (Lighthouse)
- [ ] Card catalog loads without 404 errors
- [ ] Undo/redo stable under 100+ moves
- [ ] Opponent AI completes turn in <2 seconds
- [ ] No memory leaks (DevTools → Memory tab, heap snapshot)

---

## TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (React 18) | SSR + SSG |
| Styling | Tailwind CSS | Responsive, dark mode |
| Game State | Custom GameEngine (TypeScript) | Immutable, serializable |
| Animations | Framer Motion | GPU-accelerated |
| Audio | Web Audio API | Procedurally generated |
| Testing | Vitest | Fast, modern |
| Type Safety | TypeScript | 100% coverage |
| Database | Supabase (PostgreSQL) | Card catalog + user data |

---

## KNOWN LIMITATIONS & FUTURE WORK (PHASE 5+)

### Currently Not Wired
- Advanced AI (implemented, needs PlaytestGame integration)
- Card Abilities (implemented, needs card text in database)
- Mobile Responsiveness (layouts created, needs app wrapper)
- Accessibility utilities (created, need component integration)

### Phase 5 Roadmap (Estimated 20+ hours)
1. Multiplayer networking (WebSockets)
2. Player accounts & authentication
3. Deck building UI
4. Tournament system
5. Replay analysis
6. Community deck sharing

---

## HOW TO USE THIS PROMPT

**For Building Features**:
1. Paste this entire document as context
2. Describe the specific feature or fix
3. Reference the relevant section (e.g., "Phase 1: Battlefield UI Layout")
4. Ask for implementation details with examples

**Example Queries**:
- "Build the drag-to-play interaction for Battle Area (Phase 1 spec)"
- "Wire up the Advanced AI (Phase 4 + GameEngine integration)"
- "Create a settings modal for sound/animation controls"

**For Code Review**:
1. Check against relevant section of this prompt
2. Verify type safety (TypeScript)
3. Confirm tests pass
4. Validate visual/accessibility requirements

---

## CONTACT & UPDATES

**Last Built**: March 1, 2026  
**Prompt Version**: 1.0  
**Status**: Production-ready, Phase 1-4 complete

Keep this document in `docs/` as the single source of truth. Update version number when adding Phase 5+ sections.

---

**Ready to build? Paste this prompt + your feature request into Claude.** 🚀
