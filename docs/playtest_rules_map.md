# Gundam TCG Rules Map for Playtester Implementation

**Last Updated:** February 28, 2026  
**Version:** 1.0 (MVP - Gundam Core Booster Packs GD01-03)  
**Sources:**
- [Gundam TCG Official Rules - Bandai](https://www.gundam-tcg.com/en/rules/) (primary source)
- [Gundam TCG FAQ and Rulings](https://www.gundam-tcg.com/en/faq/) (official clarifications)
- [Card Database](https://www.gundam-tcg.com/en/cards/) (card text reference)
- Community playtest reports (supplemental only, labeled)

---

## 1. TURN STRUCTURE & PHASES

### Turn Sequence (Player's Turn)

```
TURN START
├── Phase 1: Setup Phase
│   ├── Ready all rest units
│   ├── Refresh resource zone (all resources ready)
│   └── Refresh once-per-turn abilities
├── Phase 2: Draw Phase
│   └── Draw 1 card from deck (unless specified by card)
├── Phase 3: Main Phase
│   ├── Action Windows (can use Multiple per phase):
│   │   ├── Play cards from hand (units, bases, resources, commands)
│   │   ├── Activate Main abilities (Activate:Main)
│   │   ├── Spend resources for effects
│   │   └── Pair/Link pilots
│   ├── [OPTIONAL] Attack Phase (if declared attacks)
│   │   ├── Declare attacking units (ready cost = 1 resource usually)
│   │   ├── Opponent declares blockers
│   │   └── Resolve battle (damage, effects, effects)
│   └── Repeat until pass
└── Phase 4: End Phase
    ├── Discard down to 7 cards (max hand size)
    ├── Resolve end-of-turn effects
    └── Pass priority to opponent
```

### Key Timing Facts

- **No Stack in Gundam TCG**: Effects resolve immediately (no "response" system like MTG). Burst timing resolves before shield destruction.
- **Main Phase**: Can activate abilities, play cards, declare attacks in any order (no restrictions on sequence).
- **Action Phase** (if present on card): Separate window outside Main phase; use for emergency effects.
- **Attack Phase**: Declared as separate action. Once declared, player passes turn to resolve combat.
- **End Phase**: Final cleanup and priority pass.

---

## 2. ZONES AND OBJECTS

### Zone Definitions

| Zone | Purpose | Rules |
|------|---------|-------|
| **Deck** | Draw source | Starts with 50-60 cards (deck building constraint). Shuffled at start. |
| **Hand** | Cards in player's hand | Max 7 cards at end of turn (discard excess). |
| **Battle Area** | Units in play | Up to 3 units typically (check card limits). Units have ready/rest states. |
| **Shield Zone** | Shield cards (damage buffer) | Typically 4-5 shields at start (one per turn setup or instant). Shields are hidden until destroyed. |
| **Base Area** | Your base unit | Usually 1 base. Cannot attack. Damage to base = game loss at 0 life. |
| **Resource Zone** | Resources in play | Cards spent to activate abilities or unit effects. States: ready (can spend) / rest (cannot spend). |
| **Trash** | Discard pile | Public zone. Cards destroyed or discarded go here. |
| **EX Zone** | EX cards (Banlist/Advanced) | EX Base and EX Resource zones separate (if ruling applies). |

### Card Instance Model

Each card in play is a **CardInstance**:
```typescript
CardInstance {
  id: string;                    // e.g., "GD01-001-instance-1"
  cardId: string;                // e.g., "GD01-001" (references card DB)
  zone: ZoneType;                // "hand", "battle", "shields", "base", "resources", "trash", "deck"
  state: "ready" | "rest";       // Ready = can act, Rest = exhausted
  damageMarkers?: number;        // For units taking damage
  attachments?: {
    pilot?: CardInstance;        // Paired pilot
    linked?: CardInstance[];     // Linked pilots (if distinct from pair)
  };
  counters?: Record<string, number>; // Custom counters (tokens, etc.)
}
```

---

## 3. TIMING KEYWORDS & TRIGGER RESOLUTION

### Trigger Windows (in order of resolution per official rules)

When an event occurs (e.g., unit destroyed, shield destroyed, damage dealt), resolve triggers in this order:

1. **Burst** - "Before [event]" - Resolves BEFORE event completes (e.g., Burst shield damage before shield destroyed)
2. **Deploy** - "When [unit] is deployed" - Resolves immediately after unit enters battle area
3. **Attack** - "When [unit] attacks" or "When attacked" - Resolves when attack is declared
4. **Destroyed** - "When [unit] is destroyed" or "When [unit] is destroyed by battle" - On destruction
5. **Breach** - Special case: "When this unit destroys a unit by battle during your turn" - Must be your turn, must be battle damage
6. **Activated Effects** - After triggers resolve, player can activate abilities (Main/Action)

### Timing Restrictions

| Keyword | Timing | Restriction |
|---------|--------|-------------|
| **Activate:Main** | Main Phase only | Cannot use outside Main Phase |
| **Activate:Action** | Action window | Can use during designated Action phases |
| **When [Event]** | Trigger/Conditional | Auto-triggers when condition met; cannot be avoided |
| **During [State]** | While state active | Applies continuously (e.g., "During your turn while this is in Base") |
| **Once per turn limit** | Once per turn | Resets on cleanup (Phase 1 Ready step) |

### Pairing/Linking Timing (Pilot Mechanics)

- **When Paired**: Trigger fires when pilot is attached to unit (manual action or card effect)
- **During Pair**: Ongoing effect while pilot attached to unit
- **When Linked**: Additional pilots attached; separate from primary "Pair"
- **During Link**: Ongoing effect while linked pilot(s) active

---

## 4. BATTLE RESOLUTION

### Attack Declaration and Resolution Sequence

```
1. Attacker declares:
   - Which units attack
   - Which opponent targets (units/base)
   - Spend 1 resource per attacking unit (typical cost)
   - Units go rest (exhausted state)

2. Defender declares:
   - Which units block (Blocker keyword)
   - Declare assignments (1 blocker per attacker or specific rules)

3. Resolve attacks one-by-one:
   ├── Check for High-Maneuver on attacker
   │   └── If High-Maneuver present: Blocker CANNOT be assigned
   ├── Attacker deals damage first (First Strike bonus if attacker has it)
   ├── If defender survives and has Blocker:
   │   └── Defender deals damage back
   ├── Add up total damage
   ├── Apply damage (cards destroyed at 0 toughness)
   ├── Resolve "Destroyed" / "Breach" triggers
   └── Move destroyed cards to trash
```

### Key Combat Rules

1. **First Strike**: Attacker deals damage first. If damage = or > defense, Blocker cannot be used.
2. **High-Maneuver**: Blocks all Blocker assignments to this unit (attacker cannot be blocked).
3. **Blocker**: Unit can block one attacker per turn (or per card text). Must survive to be eligible.
4. **Breach Trigger**: "When this unit destroys a unit by battle during your turn"
   - Must be your turn
   - Must be battle damage (not other sources)
   - Only triggers if opponent unit dies (toughness = 0)
5. **Shield Damage**: Combat damage can redirect to shields instead of base (rules-dependent on unit/effect).
6. **Suppression**: Some shields reduce damage by 1 or apply special rules (check card text).

### Damage Resolution

- Damage = Attacker's ATK value − Defender's DEF value
- Damage ≥ 1: Target takes 1 damage marker (multiple damage = multiple markers; each marker = 1 damage)
- Damage 0 or less: No damage; unit survives
- Unit at max damage = destroyed (typically 1-3 depending on card)

---

## 5. RESOURCE MECHANICS

### Resource Phase Rules

- Resources are cards played to Resource Zone
- Resources have two states: **ready** (can be spent) or **rest** (cannot be spent)
- Spending 1 resource = rest it (move to rest row)
- At refresh (Phase 1): All resources ready
- Each unit attack typically costs 1 resource

### Resource Activation Constraints

- Cannot spend a rest resource (in rest state)
- Cannot use non-resource cards to pay resource costs
- Manually choose which resource to spend (no automatic deduction)

---

## 6. SHIELD SYSTEM

### Shield Mechanics

- Player starts with 4-5 shields (per deck building or card rules)
- Shields are **face-down** (hidden values until destroyed)
- Shields enter from hand during setup or via card effects
- When BASE takes damage:
  - If shields exist: damage redirect to topmost shield
  - Shields destroyed one at a time
  - **Burst timing**: Before shield destroyed, resolve Burst triggers
  - After all shields destroyed: damage applies to base
  - Base destroyed = player loses

### Shield Break Triggers

- **Burst** (Before shield destroyed): Triggers resolve before shield moves to trash
- **Destroyed** triggers may fire after shield destroyed

---

## 7. ONCE-PER-TURN LIMIT

### Implementation

- Limited abilities can only be used 1 time per turn
- Reset occurs at start of Phase 1 (Setup Phase, Ready step)
- Counter must be tracked per ability per instance (not per card name)
- Cannot be bypassed even by card effects (once-per-turn is hard limit)

---

## 8. EDGE CASES & CLARIFICATIONS

### Simultaneous Destruction

- If attacker and defender both died in same combat: Both destroyed triggers fire in order
- Breach: attacker destroys defender (attacker survives) = Breach triggers

### Burst Resolution Order

If multiple Burst triggers queue:
1. Resolve Burst triggers in order they triggered (FIFO)
2. All Burst resolve before shield leaves play

### Mulligan Rules

- Optional first-hand mulligan (check deck building rules; likely 1 mulligan allowed)
- Reject hand → shuffle back → draw new 5

### Hand Size / Deck Size

- **Hand Max**: 7 cards at end of turn; discard excess
- **Deck Min**: 50 cards (typical for 50-60 card decks)
- **Deck Max**: As per official format (likely 60)
- **Copy Limit**: Max 4 copies of same card (by original card ID)

### Resource Spending Rules (Advanced)

- Resources must be manually specified (no auto-deduct)
- Cannot spend more resources than available
- Spending resource = rest it (state change)
- Cannot rest a resource that's already rest

---

## 9. INVALID ACTIONS (PREVENT THESE)

| Action | Condition | Error |
|--------|-----------|-------|
| Play card outside Main Phase | Trying to deploy unit in other phases | "Can only play cards in Main Phase" |
| Use Activate:Main outside Main Phase | Card ability requires Main Phase | "This ability can only be used in Main Phase" |
| Declare attack after Main Phase ends | No attacks remain undeclared | "Attack Phase must be initiated from Main Phase" |
| Blocker on High-Maneuver attacker | Attacker has High-Maneuver | "This unit cannot be blocked" |
| Use Limited ability twice per turn | Limit:1 already used this turn | "This ability has already been used this turn" |
| Spend rest resource | Resource is in rest state | "This resource is exhausted" |
| Play card with cost not enough resources | "Play Unit: Cost 3 resources" but only 1 available | "Not enough resources" |
| Attack with same unit twice | Unit already declared attack | "This unit has already attacked this turn" |

---

## 10. WIN/LOSS CONDITIONS

| Condition | Result |
|-----------|--------|
| Base destroyed (damage ≥ max shields + base HP) | Player loses |
| Deck runs out (cannot draw) | Player loses (optional; some rules say skip draw) |
| Opponent surrenders | Opponent loses |
| Both players agree | Game ends (draw or specified outcome) |

---

## 11. SUMMARY: PHASE GATING TABLE

Use this to validate actions:

| Action | Setup | Draw | Main | Action | Attack | End |
|--------|-------|------|------|--------|--------|-----|
| Play Card | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Activate:Main | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Activate:Action | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Declare Attack | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Pair Pilot | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Spend Resource | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| End Phase | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## APPENDIX: OFFICIAL SOURCES

- **Rules PDF**: https://www.gundam-tcg.com/en/rules/
- **FAQ**: https://www.gundam-tcg.com/en/faq/
- **Card Database**: https://www.gundam-tcg.com/en/cards/
- **Official Announcements**: Check Bandai TCG website for errata/updates

---

## NOTES FOR ENGINE IMPLEMENTATION

1. **State Machine**: Use strict phase tracking. No actions outside phase gates.
2. **Trigger Queue**: When event occurs, collect all matching triggers, sort by type (Burst → Deploy → Destroyed), then resolve in order.
3. **Undo/Replay**: Store action log with detailed "why" for each action (rules trace).
4. **Validation**: Before accepting action, check:
   - Current phase allows it
   - Player has required resources
   - Card is in correct zone
   - Once-per-turn not exceeded
5. **Randomness**: Use seeded RNG for shuffle. Store seed in GameState for audit trail.

