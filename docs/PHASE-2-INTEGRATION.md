# Phase 2 Combat Systems Integration Guide

## Overview

This guide explains how to integrate the three new combat systems (trigger queue, combat resolution, and playtester engine) into the existing Gundam-Forge playtester.

## New Systems Summary

### 1. Trigger Queue System (`trigger-queue.ts`)
**Purpose**: Manage and resolve ability/trigger effects in priority order

**Key Classes**:
- `TriggerQueueManager`: Main queue manager
- `TriggerType` enum: 7 official trigger types with priorities
- `QueuedTrigger` interface: Trigger definition with condition + resolve callback

**Official Priority Order**:
```
INSTANT (0) → BURST (1) → DEPLOY (2) → ATTACK (3) → DESTROYED (4) → BREACH (5) → END_OF_TURN (6)
```

**Usage Example**:
```typescript
const queue = new TriggerQueueManager();

// Add a burst shield-breaking trigger (priority 1)
queue.addTrigger('BURST', 'trigger-1', 'GD01-001', 'player1', 
  () => true, // condition: always active
  (game) => {
    console.log('Shield broken!');
  },
  'Shield broken by burst'
);

// Peek at next trigger without removing
const next = queue.peekNextTrigger();

// Execute next trigger
queue.resolveNextTrigger(gameState);

// Or execute all remaining triggers
queue.resolveAll(gameState);
```

### 2. Combat Resolution System (`combat-resolution.ts`)
**Purpose**: Implement official Gundam TCG combat with damage calculation

**Key Classes**:
- `CombatResolver`: Main combat engine
- `Combat` interface: Combat state
- `CombatResult` interface: Combat outcome

**Combat Paths**:
1. **Unblocked Attack**: Damage goes directly to shields/base (no blocking unit damage)
2. **Normal Combat**: Simultaneous damage (ATK vs DEF), both units take damage
3. **First Strike**: Attacker damage first, blocker checks survival, if survives then blocker damage back

**Usage Example**:
```typescript
const resolver = new CombatResolver(triggerQueue);

// Create a combat between two units
const combat = resolver.createCombat(
  'unit1-instance', 'GD01-001',
  'unit2-instance', 'GD01-002'
);

// Resolve the combat
const result = resolver.resolveCombat(
  combat,
  attackerUnit,
  defenderUnit,
  gameState,
  cardDatabase
);

console.log(result.description);
// "Attacker deals 5 damage, Defender deals 2 damage. Defender destroyed!"
```

### 3. Playtester Engine (`playtest-engine.ts`)
**Purpose**: Main orchestrator that coordinates all systems

**Responsibilities**:
- Deck validation & loading
- Setup sequence execution
- Phase management & action gating
- Combat resolution
- Trigger queue management
- Game logging
- Autoplayer integration

**Key Methods**:
```typescript
engine.executeSetup()           // Run official 7-step setup
engine.executeAction(action)    // Execute player action with gating
engine.executeAutoplayer()      // Run opponent turn
engine.checkWinConditions()     // Check for game end
engine.getState()               // Get current game state
engine.getLog()                 // Get game log for analysis
engine.getGameStatus()          // Get formatted status string
```

---

## Integration Points

### Store Combat Resolver in Game Engine

**File**: `lib/game/game-engine.ts`

Add to your `GameEngine` class:

```typescript
import { CombatResolver } from './combat-resolution';
import { TriggerQueueManager } from './trigger-queue';

export class GameEngine {
  private triggerQueue: TriggerQueueManager;
  private combatResolver: CombatResolver;
  // ... existing fields

  constructor(/* ... existing params ... */) {
    // ... existing init ...
    this.triggerQueue = new TriggerQueueManager();
    this.combatResolver = new CombatResolver(this.triggerQueue);
  }

  getTriggerQueue(): TriggerQueueManager {
    return this.triggerQueue;
  }

  getCombatResolver(): CombatResolver {
    return this.combatResolver;
  }
}
```

### Integrate Combat into Execute Action

**File**: `lib/game/game-engine.ts`

Modify `executeAction()` to use combat resolver:

```typescript
case 'DECLARE_ATTACK': {
  const { attackerInstanceId, targetInstanceId } = payload;
  
  // Find attacker and defender units
  const attacker = this.findUnit(attackerInstanceId);
  const defender = this.findUnit(targetInstanceId);
  
  if (!attacker || !defender) {
    return { success: false, message: 'Unit not found' };
  }
  
  // Create combat
  const combat = this.combatResolver.createCombat(
    attacker.instanceId,
    attacker.cardId,
    defender.instanceId,
    defender.cardId
  );
  
  // Resolve damage
  const result = this.combatResolver.resolveCombat(
    combat,
    attacker,
    defender,
    this.gameState,
    this.cardDatabase
  );
  
  // Log combat
  this.logger.logAction(
    Date.now(),
    this.phase,
    this.activePlayer,
    'DECLARE_ATTACK',
    result.description,
    'Combat resolved',
    { combatResult: result }
  );
  
  // Check if game ended
  const gameWon = this.checkWinConditions();
  if (gameWon.gameOver) {
    this.gameState.isGameOver = true;
  }
  
  // Process any queued triggers (DESTROYED, BREACH)
  await this.processTriggersInQueue();
  
  return {
    success: true,
    message: result.description,
    combatResult: result
  };
}
```

### Process Trigger Queue After Combat

**File**: `lib/game/game-engine.ts`

Add this method to `GameEngine`:

```typescript
async processTriggersInQueue(): Promise<void> {
  while (!this.triggerQueue.isEmpty()) {
    // Peek next trigger
    const nextTrigger = this.triggerQueue.peekNextTrigger();
    
    if (!nextTrigger) break;
    
    // Log trigger resolution
    this.logger.logAction(
      Date.now(),
      this.phase,
      nextTrigger.ownerPlayerId,
      `TRIGGER_${nextTrigger.type}`,
      nextTrigger.description,
      `Trigger queued at priority ${nextTrigger.priority}`
    );
    
    // Resolve the trigger
    this.triggerQueue.resolveNextTrigger(this.gameState);
    
    // Small delay between trigger resolutions (for UI animation)
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}
```

### Wire Trigger Queue into Phase Advancement

**File**: `lib/game/phase-manager.ts`

Modify `advancePhase()` to process end-of-turn triggers:

```typescript
advancePhase(): { phase: Phase; log: string } {
  const currentPhase = this.phaseSequence[this.currentPhaseIndex];
  
  // If leaving Battle phase, process END_OF_TURN triggers
  if (currentPhase === 'battle') {
    // Triggers with type END_OF_TURN will resolve here
    // (trigger resolution handled by PlaytestEngine.processTriggersInQueue)
  }
  
  // Advance to next phase
  if (this.currentPhaseIndex < this.phaseSequence.length - 1) {
    this.currentPhaseIndex++;
  } else {
    // End of turn - advance to next player and reset
    this.currentPhaseIndex = 0;
    this.turnNumber++;
    this.switchActivePlayer();
  }
  
  const newPhase = this.phaseSequence[this.currentPhaseIndex];
  return {
    phase: newPhase,
    log: `Advanced to ${getPhaseName(newPhase)}`
  };
}
```

### Create ATTACK Trigger When Unit Attacks

**File**: `lib/game/playtest-engine.ts` or `lib/game/game-engine.ts`

In `handleDeclareAttack()` method:

```typescript
// After attacker is found and before combat
const attackTrigger = {
  type: 'ATTACK' as const,
  sourceInstanceId: attacker.instanceId,
  sourceCardId: attacker.cardId,
  ownerPlayerId: player.playerId,
  priority: 3, // ATTACK priority
  condition: () => true,
  resolve: (game: GameState) => {
    // Execute any "when this unit attacks" effects
    console.log(`${attacker.cardId} attack effect resolves`);
  },
  description: `Unit attack trigger: ${cardDef.name}`,
  createdAt: Date.now(),
  isOptional: false
};

this.triggerQueue.addTrigger(
  'ATTACK',
  `trigger-${attacker.instanceId}-attack`,
  attacker.cardId,
  player.playerId,
  attackTrigger.condition,
  attackTrigger.resolve,
  attackTrigger.description
);
```

### Create DESTROYED Trigger on Unit Destruction

**File**: `lib/game/combat-resolution.ts`

This is already implemented in `destroyUnit()` method:

```typescript
destroyUnit(unit: CardInstance, ownerPlayerId: string): void {
  // Move to trash
  unit.zone = 'trash';

  // Generate DESTROYED trigger
  this.triggerQueue.addTrigger(
    'DESTROYED',
    `trigger-${unit.instanceId}-destroyed`,
    unit.cardId,
    ownerPlayerId,
    () => true,
    (game) => {
      // "When this unit is destroyed" effects execute here
    },
    `Unit destroyed trigger: ${unit.cardId}`
  );
}
```

### Create BREACH Trigger When Attacker Destroys Defender

**File**: `lib/game/combat-resolution.ts`

Add this after unit destruction:

```typescript
// In resolveCombat() after calling destroyUnit():

if (result.attackerDestroyed && result.defenderDestroyed) {
  // Check for BREACH trigger
  this.checkBreachTrigger(combat.attackerId, combat.defenderId);
}

// Add method:
private checkBreachTrigger(attackerId: string, defenderId: string): void {
  // If attacker destroyed a defender this combat, queue BREACH trigger
  this.triggerQueue.addTrigger(
    'BREACH',
    `trigger-${attackerId}-breach`,
    attackerId, // sourceCard = attacker
    '', // ownerPlayerId determined by attacker
    () => true,
    (game) => {
      // "When this unit breaks through" effects
    },
    `Breach trigger: Unit defeated blocker`
  );
}
```

---

## UI Integration Points

### Connect to PlaymatCenter Component

**File**: `components/playtest/PlaymatCenter.tsx`

```typescript
import { PlaytestEngine } from '@/lib/game/playtest-engine';

export function PlaymatCenter() {
  const [engine, setEngine] = useState<PlaytestEngine | null>(null);
  const [gameState, setGameState] = useState(null);
  const [log, setLog] = useState([]);

  // Initialize engine after deck selection
  useEffect(() => {
    if (playerDeck && opponentDeck) {
      const newEngine = new PlaytestEngine(
        'game-001',
        playerDeck.id,
        playerDeck.cards,
        opponentDeck.cards,
        cardDatabase,
        'You',
        'Opponent'
      );

      // Execute setup
      newEngine.executeSetup().then(() => {
        setEngine(newEngine);
        setGameState(newEngine.getState());
        setLog(newEngine.getLog());
      });
    }
  }, [playerDeck, opponentDeck]);

  // Handle actions from UI
  const handleAction = (action: GameAction) => {
    if (!engine) return;

    const result = engine.executeAction(action);
    setGameState(engine.getState());
    setLog(engine.getLog());

    // Check win conditions
    const gameWon = engine.checkWinConditions();
    if (gameWon.gameOver) {
      alert(`Game Over! ${gameWon.reason}`);
    }
  };

  return (
    <div className="playmat-center">
      <div className="game-status">
        <pre>{engine?.getGameStatus()}</pre>
      </div>
      
      <div className="phase-manager">
        <PhaseIndicator phaseManager={engine?.getPhaseManager()} />
        <button onClick={() => handleAction({
          type: 'ADVANCE_PHASE',
          playerId: gameState.activePlayerId,
          payload: {}
        })}>
          Next Phase
        </button>
      </div>

      <div className="game-log">
        <GameLog entries={log} />
      </div>
    </div>
  );
}
```

### Display Trigger Queue in UI

**File**: `components/playtest/TriggerDisplay.tsx`

```typescript
import { TriggerQueueManager } from '@/lib/game/trigger-queue';

export function TriggerDisplay({ queue }: { queue: TriggerQueueManager }) {
  const pending = queue.getPendingTriggers();

  return (
    <div className="trigger-queue">
      <h3>Pending Triggers ({pending.length})</h3>
      <ul>
        {pending.map((trigger, i) => (
          <li key={trigger.id}>
            <span className="priority">[P{trigger.priority}]</span>
            <span className="type">{trigger.type}</span>
            <span className="desc">{trigger.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Display Combat Results

**File**: `components/playtest/CombatLog.tsx`

```typescript
import { CombatResult } from '@/lib/game/combat-resolution';

export function CombatLog({ result }: { result: CombatResult }) {
  return (
    <div className="combat-result">
      <div className="attackers">
        <h4>Attacker</h4>
        <p>{result.combat.attackerCardId}</p>
        <p className="damage">Damage: {result.combat.attackerDamage}</p>
        {result.attackerDestroyed && <p className="destroyed">❌ DESTROYED</p>}
      </div>

      <div className="vs">VS</div>

      <div className="defenders">
        <h4>Defender</h4>
        <p>{result.combat.defenderCardId}</p>
        <p className="damage">Damage: {result.combat.defenderDamage}</p>
        {result.defenderDestroyed && <p className="destroyed">❌ DESTROYED</p>}
      </div>

      <div className="summary">
        <p className="description">{result.description}</p>
        <p className="net-damage">Net Damage to Base: {result.netDamageToDefender}</p>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Unit Tests (Already Done)
- ✅ Trigger queue priority sorting
- ✅ Trigger queue FIFO execution
- ✅ Combat damage calculation
- ✅ First Strike logic
- ✅ Shield damage routing
- ✅ Unit destruction

### Integration Tests (Next)

1. **Combat Sequence Test**
```typescript
test('Full combat sequence: declare → resolve → destroy → trigger', () => {
  const engine = new PlaytestEngine(...);
  
  // Player declares attack
  const attack = engine.executeAction({
    type: 'DECLARE_ATTACK',
    playerId: 'player1',
    payload: { attackerInstanceId: 'unit1', targetInstanceId: 'unit2' }
  });
  
  // Should trigger destroyed unit's DESTROYED trigger
  const triggers = engine.getTriggerQueue().getPendingTriggers();
  expect(triggers).toContainEqual(
    expect.objectContaining({ type: 'DESTROYED' })
  );
});
```

2. **Win Condition Test**
```typescript
test('Game ends when base destroyed', () => {
  const engine = new PlaytestEngine(...);
  
  // Reduce base to 0
  engine.getState().players['player2'].baseHealth = 0;
  
  const { gameOver, winner } = engine.checkWinConditions();
  expect(gameOver).toBe(true);
  expect(winner).toBe('player1');
});
```

3. **Shield Overflow Test**
```typescript
test('Damage overflow from shields to base', () => {
  const engine = new PlaytestEngine(...);
  
  // Apply 8 damage when only 5 shields
  const result = engine.getCombatResolver().applyDamageToShields(8, 5);
  expect(result.shieldsDestroyed).toBe(5);
  expect(result.damageToBase).toBe(3);
});
```

---

## File Summary

### New Files Created (Phase 2)
1. **trigger-queue.ts** (280 lines)
   - TriggerQueueManager class
   - TriggerType enum (7 types)
   - QueuedTrigger interface

2. **combat-resolution.ts** (340 lines)
   - CombatResolver class
   - Combat interface
   - CombatResult interface

3. **combat-system.test.ts** (500 lines)
   - 12 trigger queue tests
   - 11 combat resolution tests
   - 1 integration test

4. **playtest-engine.ts** (400 lines)
   - PlaytestEngine orchestrator
   - Integrates all systems
   - Provides main game loop

### Files to Modify (Phase 2 Integration)
1. **game-engine.ts**
   - Add triggerQueue and combatResolver fields
   - Integrate combat into executeAction
   - Add processTriggersInQueue method

2. **phase-manager.ts**
   - Add END_OF_TURN trigger handling

3. **PlaymatCenter.tsx** (or similar UI component)
   - Initialize PlaytestEngine
   - Display trigger queue
   - Display combat results

---

## Next Steps (Phase 3 - UI Integration)

1. Wire PlaytestEngine into PlaymatCenter UI
2. Add button/control handlers for actions
3. Display current phase with advancement controls
4. Add game log sidebar
5. Implement autoplayer turn execution
6. Add win/loss screen

