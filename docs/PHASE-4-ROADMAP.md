# Phase 4: Polish & Features Roadmap

**Status**: 🚧 PLANNED - Ready for implementation after Phase 3  
**Estimated Duration**: 12-16 hours  
**Priority**: Medium (game is playable without these)

---

## Overview

Phase 4 adds polish, visual feedback, advanced features, and full completeness to the playtester. The game is already functional and playable, but Phase 4 elevates it to production quality.

---

## Feature Categories

### Category 1: User Interaction Polish (3-4 hours)

#### 1.1 Mulligan Interaction
**Current**: Skip mulligan automatically  
**Goal**: Let player choose to mulligan

```typescript
// New component: MulliganModal.tsx
interface MulliganModalProps {
  hand: CardInstance[];
  onMulliganAccept: () => void;
  onMulliganReject: () => void;
}

// Flow:
// 1. After hand drawn, show modal
// 2. Player can see cards and decide
// 3. Accept = reshuffle and redraw
// 4. Reject = keep hand, proceed
```

**Implementation**: 
- Add MulliganModal component
- Add MULLIGAN action to GameEngine
- Add mulligan state to GameState
- Update SetupPhase to show modal

#### 1.2 Keyboard Shortcuts
**Shortcuts to add**:
- `Enter` = Next Phase
- `ESC` = Deselect card
- `M` = Toggle game log visibility
- `H` = Toggle hand visibility
- `B` = Toggle board

**Implementation**:
- Add useKeyboardShortcuts hook
- Pass handler to PlaytestGame
- Display legend on ? key

#### 1.3 Tooltips & Help
**Tooltips to add**:
- Phase explanation (what actions allowed)
- Keyword explanation (First Strike, High-Maneuver, etc.)
- Rules trace on action (show why action valid/invalid)

**Implementation**:
- Add Tooltip component using Headless UI
- Add help text to rules-constants.ts
- Show on hover or click

---

### Category 2: Visual Feedback (2-3 hours)

#### 2.1 Animations
**Animations to add**:
- Attack animation (unit slides toward opponent)
- Damage numbers (float up when damage applied)
- Shield break animation (shield card destroyed)
- Unit destruction (unit fades out)
- Phase transition (fade to next phase)

**Library**: Framer Motion or TweenMax
```typescript
import { motion } from 'framer-motion';

<motion.div
  animate={{ x: 200, opacity: 0 }}
  transition={{ duration: 0.5 }}
>
  Unit attacking!
</motion.div>
```

#### 2.2 Visual Effects
**Effects to add**:
- Glow on selected card
- Highlight valid targets for attack
- Red flash on damage taken
- Green glow on shield placed
- Particle effect on destruction

#### 2.3 Sound Effects
**Sounds to add**:
- Card play (pop sound)
- Attack declaration (swoosh)
- Shield break (crack sound)
- Unit destroyed (explosion)
- Victory/defeat (fanfare)

**Library**: Howler.js for audio playback

---

### Category 3: Game Features (4-5 hours)

#### 3.1 Undo/Replay System
**Goal**: Save game states, go back to previous states

```typescript
// In GameEngine
private states: GameState[] = [];
private stateIndex: number = 0;

saveState() {
  this.states[this.stateIndex] = this.getState();
  this.stateIndex++;
}

undo() {
  if (this.stateIndex > 0) {
    this.stateIndex--;
    return this.states[this.stateIndex];
  }
}

redo() {
  if (this.stateIndex < this.states.length - 1) {
    this.stateIndex++;
    return this.states[this.stateIndex];
  }
}
```

**Implementation**:
- Add state history (circular buffer, last 100 states)
- Add undo/redo buttons
- Disable on first/last state
- Update UI on state restore

#### 3.2 Card Ability System
**Goal**: Parse and execute card text effects

```typescript
interface CardAbility {
  type: 'instant' | 'deploy' | 'when_attacks' | 'when_destroyed';
  text: string; // "Draw 1 card"
  effect: (game: GameState, source: CardInstance) => void;
}

// Parser would convert card text to executable effects
const ability = parseAbilityText("When this unit attacks, draw 1 card");
ability.effect(gameState, unitInstance); // Executes effect
```

**Abilities to implement** (by tier):
- Tier 1: Draw cards, damage shields
- Tier 2: Create tokens, search deck
- Tier 3: Conditional effects, stat modifiers
- Tier 4: Complex interactions, player choice

**Implementation**:
- Create AbilityParser (regex-based)
- Add ability execution to trigger queue
- Add ability effect functions
- Test with real card examples

#### 3.3 Advanced Opponent AI (3-4 hours)
**Current AI**: Play units, attack randomly  
**Goal**: Smarter decision making

```typescript
// Operator should:
// 1. Evaluate board state (count units, life total, shields)
// 2. Prioritize threats (opponent strong units)
// 3. Value trades (damage dealt vs units killed)
// 4. Plan kills (calculate lethal damage)
// 5. Cache cards (hold good units for key moments)

class AdvancedAutoplayer {
  evaluateBoard(gameState): BoardEvaluation {
    // Count units, calculate total ATK/DEF
    // Assess threat level
    // Return numeric score
  }

  prioritizeTargets(gameState): CardInstance[] {
    // Sort opponent units by threat
    // Return target order for attacks
  }

  calculateLethal(gameState): boolean {
    // Check if lethal damage possible this turn
    // Return true/false
  }

  decideActions(gameState): GameAction[] {
    // Execute better strategy
    // Consider reserves, shields, attacks
  }
}
```

---

### Category 4: Mobile & Responsive (1-2 hours)

#### 4.1 Mobile Layout
**Changes**:
- Stack components vertically on mobile
- Touch-friendly button sizes (48px minimum)
- Large text for hand visibility
- Swipe gestures for phase advance

#### 4.2 Responsive Grid
**Breakpoints**:
- Desktop (1920px): 4-column layout
- Tablet (1024px): 2-column layout  
- Mobile (480px): 1-column layout

---

### Category 5: Accessibility (1-2 hours)

#### 5.1 ARIA Labels
```typescript
<button
  onClick={handlePlay}
  aria-label="Play selected card"
  aria-pressed={cardSelected}
>
  Play
</button>
```

#### 5.2 Keyboard Navigation
- Tab through cards
- Enter to select/play
- Arrow keys to move selection
- ESC to deselect

#### 5.3 Screen Reader Support
- Announce phase changes
- Read card names and stats
- Announce damage taken
- Describe board state

---

### Category 6: Data & Analytics (2-3 hours)

#### 6.1 Game History Storage
```typescript
interface GameRecord {
  id: string;
  playerDeckId: string;
  opponentDeckId: string;
  winner: string;
  turns: number;
  duration: number;
  actionHistory: GameAction[];
  timestamp: Date;
}

// Save to Supabase
saveGameRecord(record: GameRecord) {
  // POST to /api/games
  // Store in database
}
```

#### 6.2 Statistics Dashboard
**Stats to track**:
- Winrate by deck
- Average game length
- Popular cards
- Pick rates
- Performance by phase

#### 6.3 Game Viewer
```typescript
// Replay stored games
function GameViewer({ gameId }) {
  const [game, setGame] = useState(null);
  const [turnIndex, setTurnIndex] = useState(0);

  // Load game from database
  // Step through actions
  // Visualize each state
  // Export as video/gif
}
```

---

## Implementation Sequence

### Recommended Order (by value:effort ratio)

1. **Mulligan Interaction** (1 hour) - High value, low effort
2. **Keyboard Shortcuts** (0.5 hours) - Medium value, low effort
3. **UI Animations** (2 hours) - High value, medium effort
4. **Sound Effects** (1 hour) - Medium value, low effort
5. **Undo/Replay** (2 hours) - High value, medium effort
6. **Advanced AI** (4 hours) - High value, high effort
7. **Card Abilities** (4 hours) - High value, high effort
8. **Mobile Responsive** (1.5 hours) - Medium value, low effort
9. **Accessibility** (1.5 hours) - Medium value, low effort
10. **Game History** (2 hours) - Low value, medium effort

**Total if all implemented**: ~20 hours (spread over multiple sprints)

---

## File Structure (After Phase 4)

```
apps/web/components/playtest/
├── PlaytestGame.tsx           (MODIFY - add features)
├── PhaseIndicator.tsx
├── BattleArea.tsx              (MODIFY - add animations)
├── PlayerHand.tsx              (MODIFY - add abilities)
├── GameLog.tsx
├── CombatDisplay.tsx
├── SetupPhase.tsx              (MODIFY - add mulligan)
├── MulliganModal.tsx           (NEW)
├── TooltipProvider.tsx         (NEW)
├── KeyboardShortcuts.tsx       (NEW)
├── GameAnimations.tsx          (NEW)
├── SoundManager.tsx            (NEW)
├── AdvancedAI/
│   ├── BoardEvaluator.tsx     (NEW)
│   ├── TargetSelector.tsx     (NEW)
│   └── LethalCalculator.tsx   (NEW)
├── Abilities/
│   ├── AbilityParser.tsx      (NEW)
│   ├── AbilityExecutor.tsx    (NEW)
│   └── effectLibrary.ts       (NEW)
├── Mobile/
│   ├── TouchGestures.tsx      (NEW)
│   └── ResponsiveLayout.tsx   (NEW)
├── Accessibility/
│   ├── AriaLabels.tsx         (NEW)
│   └── ScreenReaderHelper.tsx (NEW)
└── History/
    ├── GameViewer.tsx         (NEW)
    └── StatsDashboard.tsx     (NEW)

lib/game/
├── game-engine.ts              (MODIFY - add undo/redo)
├── advanced-autoplayer.ts     (NEW)
├── audio-manager.ts           (NEW)
└── analytics.ts               (NEW)
```

---

## Architecture Decisions for Phase 4

### State Management
- Keep GameEngine as source of truth
- Add optional features as middleware
- Don't break existing tests

### Component Structure
- Keep components focused and reusable
- Use composition over inheritance
- Export feature flags for opt-in

### Testing Strategy
- Test animations with Vitest (snapshot)
- Test abilities with unit tests
- Test AI with strategy tests (does it win?)
- Test accessibility with axe-core

### Performance Considerations
- Memoize board evaluation (expensive)
- Lazy load sound files
- Defer animations on slow devices
- Limit replay to last 100 states

---

## Success Criteria

### Phase 4 is complete when:

- [x] Game is playable end-to-end **← DONE (Phase 3)**
- [ ] User can mulligan during setup
- [ ] User can undo last action
- [ ] Opponent plays strategically
- [ ] Cards with abilities execute text
- [ ] UI is responsive on mobile
- [ ] Game animations are smooth
- [ ] Keyboard navigation works
- [ ] Screen readers can navigate
- [ ] Game history is saved
- [ ] 98% test pass rate maintained

---

## Future Vision (Phase 5+)

### Out of Scope for Phase 4

- Multiplayer networking (WebSockets)
- Tournaments & matchmaking
- Deck building integration
- Card collection management
- Trading & marketplace
- Streaming support (OBS integration)
- AI difficulty levels
- Custom rules variants

### Long-term Roadmap

1. **Phase 4**: Polish & features (12-16h)
2. **Phase 5**: Networking (20h) - Add multiplayer support
3. **Phase 6**: Social (15h) - Leaderboards, replays, analysis
4. **Phase 7**: Platform (20h) - Mobile app, offline support
5. **Phase 8**: Expansion** (TBD) - New cards, rules variants

---

## Resources for Phase 4

### Libraries to Add
- `framer-motion` - Animations (npm install framer-motion)
- `howler` - Sound effects (npm install howler)
- `axe-core` - Accessibility testing (npm install axe-core)
- `zustand` or `recoil` - State management (optional)

### Documentation to Read
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile UX Patterns](https://www.nngroup.com/articles/mobile-ux-patterns/)
- [Game AI Design](https://www.gamasutra.com/blogs/SergeyGalyonkin/20140101/209211/Game_AI.php)

### Example Implementations
- Undo/Redo: Redux undo middleware
- Ability Parsing: Magic: The Gathering text parser
- Mobile: React Native or Flutter
- Accessibility: ARIA spec examples

---

## Estimated Timeline

```
Phase 4 Implementation Timeline:
├─ Week 1: Polishes (Mulligan, Shortcuts, Tooltips) - 2-3h
├─ Week 2: Animations & Sound (4-5h)
├─ Week 3: Undo/Replay & AI (4-5h)
├─ Week 4: Abilities & Mobile (5-6h)
├─ Week 5: Accessibility & Analytics (3-4h)
└─ Week 6: Testing, bugfixes, deployment (2-3h)

Total: ~20 hours over 6 weeks
(Or 2-3 full days continuous development)
```

---

## Conclusion

Phase 4 transforms the playtester from a functional MVP to a polished, feature-complete application. All major systems are in place; Phase 4 adds UX, performance, and nice-to-have features.

**Not required for core functionality, but recommended for user satisfaction.**

Start Phase 4 when:
- ✅ Phase 3 complete and tested
- ✅ User feedback gathered from MVP
- ✅ Feature priorities established
- ✅ Development team available

---

# Summary

```
Phases 1-3 Complete: ✅ Fully playable MVP
Phase 4 Planned: 🚧 Polish & features
Phase 5+ Vision: 🔮 Networking & expansion
```

**The foundation is solid. Ready to build on it.**
