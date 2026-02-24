# Gundam Forge - Official Game Rules

**Version**: 1.0  
**Last Updated**: February 22, 2026  
**Status**: Official Beta Rules

---

## Table of Contents

1. [Game Overview](#game-overview)
2. [Card Types](#card-types)
3. [Deck Construction](#deck-construction)
4. [Game Zones](#game-zones)
5. [Turn Structure](#turn-structure)
6. [Resource System](#resource-system)
7. [Combat](#combat)
8. [Card Mechanics](#card-mechanics)
9. [Keywords & Abilities](#keywords--abilities)
10. [Win Conditions](#win-conditions)

---

## Game Overview

**Gundam Forge** is a strategic card game where players pilot Mobile Suits and command forces from across the Gundam multiverse. Players build 60-card decks and battle to reduce their opponent's Life Points from 20 to 0.

**Players**: 2  
**Starting Life**: 20  
**Starting Hand**: 7 cards (with mulligan option)  
**Deck Size**: Exactly 60 cards  
**Max Copies**: 4 per card (except Basic Resources)  

---

## Card Types

### 1. Unit Cards
**Mobile Suits, Mobile Armors, and Ships**

- Have **Power** (combat strength)
- Have **Cost** (resources required to play)
- Can **attack** and **block**
- Enter play **exhausted** (unless stated otherwise)
- Can attack the turn after they enter (unless they have **Haste**)

**Example**: RX-78-2 Gundam (Cost 4, Power 5)

### 2. Pilot Cards
**Ace Pilots and Commanders**

- No Power value themselves
- **Attach** to Units already in play
- Grant bonuses and abilities to attached Unit
- If attached Unit leaves play, Pilot goes to discard
- Can be played at **instant speed** (during combat)

**Example**: Amuro Ray - "Attach to a Unit. That Unit gains +1 Power and 'When this attacks, draw 1.'"

### 3. Command Cards
**Tactics, Weapons, and Special Maneuvers**

- **Instant effects** that resolve immediately
- Played from hand during your turn (or opponent's if stated)
- Go directly to discard after resolving
- Can be played at **instant speed** during combat

**Example**: Beam Rifle Burst - "Deal 3 damage to target Unit."

### 4. Base Cards
**Space Colonies, Military Bases, Factories**

- **Generate resources** automatically each turn
- Have defensive Power value
- Can be attacked by Units
- Only 1 Base can be in play per player at a time
- New Base replaces old Base (old goes to discard)

**Example**: Side 7 Colony - "Generate 2 White resources at start of turn. Power 3."

---

## Deck Construction

### Core Rules
- **Exactly 60 cards** required
- **Maximum 2 colors** per deck (excluding Colorless)
- **Maximum 4 copies** of any single card
- **Colorless cards** don't count toward color limit
- At least **15 Unit cards** recommended (25-28 optimal)
- Recommended **6-8 Pilot cards** for consistent attachments

### Color Identity
- **White**: Defense, healing, protection (Federation focus)
- **Blue**: Technology, card draw, energy manipulation (Advanced tech)
- **Red**: Aggression, direct damage, speed (Zeon, aggro tactics)
- **Green**: Growth, powerful Units, late-game (Coordinators, evolution)
- **Black**: Destruction, sacrifice, control (Zeon elite, dark tactics)
- **Colorless**: Universal cards, support, generic tech

---

## Game Zones

### Main Zones
1. **Deck** - Your draw pile (face-down, top-right)
2. **Hand** - Cards you can play (hidden from opponent)
3. **Battle Zone** - Where Units and Bases are played (center)
4. **Resource Pool** - Cards used for resources (face-down, left)
5. **Discard Pile** - Used cards and destroyed Units (face-up, bottom-right)

### Sub-Zones (Battle Zone)
- **Left Battle Line** (up to 3 Units)
- **Center Battle Line** (up to 3 Units)  
- **Right Battle Line** (up to 3 Units)
- **Base Slot** (1 Base maximum)
- **Attached Cards** (Pilots attached to Units)

**Total Battle Zone Capacity**: 9 Units + 1 Base + attached Pilots

---

## Turn Structure

### Phase 1: Refresh Phase
1. **Untap** all your exhausted (tapped) cards
2. **Draw** 1 card from your deck
3. If your deck is empty, you **lose the game**

### Phase 2: Resource Phase
1. You may place **1 card** from hand face-down into Resource Pool
2. Resources placed this turn are **exhausted** (can't use immediately)
3. **Refresh** all resources from previous turns (they become ready)
4. If you control a Base, it **generates** its bonus resources

### Phase 3: Main Phase
**You may do any of the following, in any order:**
- Play Unit cards (pay cost, enters exhausted)
- Play Pilot cards (attach to a Unit, pay cost)
- Play Command cards (pay cost, resolve effect)
- Play Base card (pay cost, replaces old Base if any)
- Activate abilities on your cards
- Prepare to enter Combat Phase

### Phase 4: Combat Phase

#### Step A: Declare Attackers
- Choose any number of **ready** (untapped) Units to attack
- **Exhaust** (tap) attacking Units
- Declare targets: opponent's Life Points or opponent's Base

#### Step B: Declare Blockers (Opponent)
- Opponent may assign their **ready** Units to block attackers
- One blocker can only block one attacker
- Blocked attackers don't deal damage to Life Points

#### Step C: Combat Resolution
1. **Instant speed actions** (Commands, Pilot attachments) can be played
2. Compare **Power** values:
   - Attacker deals damage equal to its Power to blocker
   - Blocker deals damage equal to its Power to attacker
   - Unit with damage ≥ Power is **destroyed**
3. **Unblocked attackers** deal damage equal to their Power to opponent's Life Points or Base

#### Step D: End of Combat
- Destroyed Units go to discard
- Repeat Combat Phase if you have more ready Units (optional)

### Phase 5: End Phase
1. Discard down to **7 cards** if you have more than 7 in hand
2. End of turn effects trigger
3. Pass turn to opponent

---

## Resource System

### Generating Resources
- Place 1 card face-down from hand into Resource Pool per turn (Phase 2)
- Each face-down card = **1 resource** of its card's color
- Bases generate **bonus resources** automatically
- Resources refresh (untap) at start of your turn

### Spending Resources
- **Exhaust** (tap) resources to pay card costs
- Cost must match card's color (White Unit needs White resources)
- **Colorless costs** can be paid with any color
- Example: Cost "3W" = 3 White resources + any 1 resource

### Colorless Resources
- Cards with Colorless color identity
- Generate **generic resources** (can pay for any color)
- Count toward resource total but not deck color limit

---

## Combat

### Attack Declaration
- Only **ready** (untapped) Units can attack
- Attacking **exhausts** the Unit
- Choose target: Opponent's Life Points OR Opponent's Base

### Blocking
- Only **ready** Units can block
- Blocking does NOT exhaust the Unit
- 1 blocker per 1 attacker (no gang blocking)

### Damage Calculation
- **Power vs Power**: Both Units deal damage simultaneously
- Unit with **damage ≥ Power** is destroyed
- **Unblocked damage**: Goes to Life Points or Base

### Example Combat
**Scenario**: You attack with RX-78-2 Gundam (Power 5)  
**Opponent blocks** with Zaku II (Power 3)  
**Resolution**:
- Gundam deals 5 damage to Zaku (Zaku destroyed, 5 ≥ 3)
- Zaku deals 3 damage to Gundam (Gundam survives, 3 < 5)

---

## Card Mechanics

### Entry Effects ("When this enters...")
- Triggers when Unit enters Battle Zone
- Resolves immediately after Unit is played
- Common effect: Draw cards, destroy enemy Units, gain resources

### Attack Effects ("When this attacks...")
- Triggers when Unit is declared as attacker
- Resolves before blocker declaration
- Common effect: Draw cards, deal bonus damage, exile blockers

### Attachment (Pilots)
- Pilot cards **attach** to Units
- Grants bonuses to attached Unit (+Power, abilities)
- If attached Unit is destroyed, Pilot goes to discard
- Pilots can be attached at instant speed (during combat)

### Transform Mechanics
- Some Units have **dual modes** (e.g., Unicorn Normal/Destroy mode)
- Pay specified cost to transform
- Retains all damage and attachments
- Transform is **instant speed**

---

## Keywords & Abilities

### Core Keywords

**Haste**  
Unit can attack the same turn it enters play.  
*Example: "MS-06S Zaku II" - "This can attack immediately when played."*

**First Strike**  
Unit deals combat damage before normal Units.  
If opponent's Unit is destroyed, it doesn't deal damage back.  
*Example: Amuro Ray grants Units "First Strike"*

**Unblockable**  
This Unit cannot be blocked. Damage always goes through.  
*Example: "PMX-000 Messala" - "This cannot be blocked."*

**Armor X** (X = number)  
Prevent the first X damage dealt to this Unit each turn.  
*Example: "Gundam Barbatos" - "Armor 2" (prevents first 2 damage)*

**Beam**  
This Unit has advanced energy weapons.  
Deals +1 damage to Units without Beam or Armor.  
*Example: "Unicorn Gundam" - "Transform to Destroy mode: gains Beam property."*

**Newtype**  
Ace pilot designation. Grants bonuses when paired with Newtype Units.  
*Example: "Banagher Links" - Newtype Pilot grants resonance effects*

**Flying**  
Can only be blocked by other Flying Units.  
Represents aerial superiority.  

---

## Win Conditions

### Primary Victory
**Reduce opponent's Life Points to 0 or less**

### Deck-Out Victory
**Opponent cannot draw when required** (empty deck)

### Base Destruction Victory
**Destroy opponent's Base while they have 5 or less Life Points**  
*Conditional instant win representing strategic collapse*

---

## Advanced Rules

### The Stack (Instant Speed Resolution)
1. Cards played at "instant speed" use **The Stack**
2. Last card played resolves first (LIFO - Last In, First Out)
3. Both players can respond with instant-speed effects
4. Resolve one effect at a time, then check for responses

### Mulligan Rule
- At game start, after drawing 7 cards, you may **mulligan once**
- Shuffle hand back, draw 6 cards (1 fewer)
- Decision is made simultaneously in secret

### Color Restrictions
- Cards can only be played if you have matching color resources
- Example: Blue card needs Blue resources (from Blue cards in Resource Pool or Colorless + Base generation)

### Zone Limits
- **Battle Zone**: Maximum 9 Units + 1 Base
- **Hand**: No limit during turn, discard to 7 at end phase
- If you can't play a Unit (zone full), you cannot play it

---

## Common Game Scenarios

### Scenario 1: Pilot Attachment During Combat
**Situation**: Opponent blocks your 4-Power Unit with their 5-Power Unit  
**Action**: Play "Amuro Ray" Pilot (Cost 2) at instant speed, attach to your Unit  
**Result**: Your Unit gains +1 Power (now 5), survives combat  

### Scenario 2: Transform Mid-Combat
**Situation**: Your Unicorn Gundam (Power 7) is blocked by 8-Power enemy  
**Action**: Pay 3 resources to transform to Destroy Mode (gains +1 Power, Beam)  
**Result**: Now 8 Power + Beam bonus, destroys enemy Unit, survives

### Scenario 3: Resource Management
**Turn 1**: Place White card face-down (1 White resource)  
**Turn 2**: Place Blue card face-down (1 White + 1 Blue resource)  
**Turn 3**: Play Base generating 2 White (total: 2 White, 1 Blue + Base bonus)  
**Turn 4**: Play Cost 4 White Unit (exhaust 4 White resources)

---

## Timing and Priority

### Instant Speed Windows
- During Combat Phase: After attackers declared, before blockers
- During Combat Phase: After blockers declared, before damage
- During Main Phase: Any time active player has priority
- End Phase: Before discard to 7

### Priority System
- Active player (whose turn it is) always has priority first
- After resolving an effect, priority passes to opponent
- If both players pass priority in succession, phase ends

---

## Tournament Rules (Competitive Play)

### Deck Construction (Competitive)
- Exactly 60 cards
- Maximum 4 copies per card
- Maximum 2 colors (excluding Colorless)
- All cards must be from legal sets (not banned)
- Deck list must be submitted before tournament

### Match Structure
- Best of 3 games
- 50-minute rounds
- Game 1: Random determine first player
- Game 2/3: Loser of previous game chooses who goes first

### Banned List (Example - Updated Quarterly)
*No cards currently banned in Beta*

### Time Extensions
- If a game is in combat when time is called, finish current combat
- If tied at end of time, go to sudden death (first damage wins)

---

## Design Philosophy

Gundam Forge emphasizes:
1. **Strategic Resource Management** - Every card can become a resource
2. **Tactical Combat** - Blocking matters, timing matters
3. **Pilot/Unit Synergy** - Recreates anime partnerships
4. **Color Identity** - Each color has distinct playstyle
5. **Instant Speed Interaction** - Combat tricks and counterplay

---

## Frequently Asked Questions

### Q: Can I attack with a Unit that entered this turn?
**A**: No, unless it has Haste. Units enter exhausted and can't attack until your next turn.

### Q: Can I block with an exhausted Unit?
**A**: No. Only ready (untapped) Units can block.

### Q: Does blocking exhaust my Unit?
**A**: No. Blocking does not exhaust the Unit. It can block again if another attack happens.

### Q: Can I play Pilots at instant speed?
**A**: Yes. Pilots can be attached during combat as instant-speed effects.

### Q: What happens if my Base is destroyed?
**A**: The Base goes to discard. You can play a new Base on your next turn. If you have 5 or less Life when Base is destroyed, you lose immediately.

### Q: Can I have more than 1 Base?
**A**: No. Only 1 Base in play at a time. Playing a new Base replaces (discards) the old one.

### Q: Do resources stay in Resource Pool permanently?
**A**: Yes. Once placed, they remain as resources for the rest of the game.

### Q: Can I attack my opponent's Units directly?
**A**: No. You attack the opponent's Life Points or Base. They choose blockers to intercept.

### Q: What if both Units destroy each other?
**A**: Both go to discard simultaneously. This is called "mutual destruction."

### Q: Can I play multiple Command cards in one turn?
**A**: Yes, as long as you have resources to pay for them.

---

## Strategy Tips

### Beginner Tips
1. **Play Resources Early** - Always use your 1 resource placement per turn
2. **Save Pilots for Combat** - Attach during combat for surprise blocks/wins
3. **Curve Your Deck** - Include Units at various costs (2-6 average)
4. **Don't Overextend** - Keep some Units for blocking

### Advanced Tips
1. **Instant Speed Tricks** - Save 2-3 resources open for combat Commands
2. **Pilot Timing** - Attach Pilots after blockers declared to maximize value
3. **Base Strategy** - Play Base on turn 3-4 for resource acceleration
4. **Color Fixing** - Use Colorless cards and Bases to splash second color

---

## Credits & Version History

**Lead Designer**: Gundam Forge Development Team  
**Playtesting**: Community Beta Testers  
**Based On**: Inspired by Gundam franchise (©Sotsu/Sunrise)

**Version 1.0** (Feb 2026): Initial Beta rules release  
**Next Update**: Q2 2026 - First expansion and balance adjustments

---

*For rules questions, visit: https://gundam-forge.com/rules*  
*For tournament support: https://gundam-forge.com/competitive*
