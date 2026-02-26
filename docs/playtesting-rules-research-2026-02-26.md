# Gundam TCG Rules Research (2026-02-26)

## Primary official sources

1. Comprehensive Rules Ver.2.0.0 (effective Jan 31, 2026)  
   https://www.gundam-gcg.com/en/pdf/gcg_comprehensive_rules_en.pdf
2. Official Play Guide (card types, turn overview)  
   https://www.gundam-gcg.com/en/playguide/
3. Official deck introduction pages (archetype intent)  
   https://www.gundam-gcg.com/en/decks/
4. Official card database (card attributes/AP/HP/Cost/Color/Type fields)  
   https://www.gundam-gcg.com/en/cards/

## Credible community sources used

1. Gundamcard.gg meta tier list (regional-tournament archetype summary)  
   https://gundamcard.gg/gd02-meta-tier-list-best-decks-from-dual-impact-regional-tournaments/
2. TCGTopDecks HQ tournament list snapshots (decklist-level placements)  
   https://tcgtopdecks-hq.com/decks/?format=gundam-cg&offset=0  
   https://tcgtopdecks-hq.com/decks/?format=gundam-cg-gd02&offset=0  
   https://tcgtopdecks-hq.com/decks/?format=gundam-cg-gd03&offset=0

## Rules facts mapped into the engine

- Deck construction:
  - Main deck size: 50 cards.
  - Resource deck size: 10 cards.
  - Same card number copy cap: 4.
  - Maximum 2 colors (excluding Colorless).
- Setup:
  - Each player draws 5 cards.
  - 6 shield cards are set.
  - EX Base token is placed.
  - Second player starts with an EX Resource token.
- Turn flow:
  - Start -> Draw -> Resource -> Main -> End.
  - Draw phase requires a draw; inability to draw loses the game.
  - Resource phase places 1 resource from resource deck (if possible).
- Battle flow:
  - Attack declaration -> block step -> battle action step -> damage resolution.
  - Unit attacks require attacker active.
  - Unit-target attacks target rested enemy units.
  - Battle damage is simultaneous in unit-vs-unit combat.
  - Player attacks apply to base first; if no base, shields are removed; if neither exists, battle damage defeats the player.
- Action windows and resolution:
  - Players alternate actions/passes.
  - During battle action step and end action step, standby player acts first.
  - Effects resolve in stack order (LIFO in implementation).
  - State-based destruction is checked after damage/effect resolution.

## Card model attributes used

- Type: Unit / Pilot / Command / Base / Resource.
- Cost + Level checks before playing cards.
- AP/HP and pilot modifiers used in combat math.
- Link condition support (pilot text/name/traits match hook) for same-turn attack exceptions.
- Zones modeled: main deck, resource deck, hand, resource area, battle area, shield area, base slot, trash, removed.

## Archetype and decklist signals captured for playtesting heuristics

- Official deck themes:
  - ST03: Blue/White control style with high durability/recovery.
  - ST04: Red/Green aggressive pressure with combat tempo.
- Tournament/community signals:
  - Beta lists show repeated high placements for archetypes like Rau Le Creuset, Wing combo/tempo, and defensive control shells.
  - GD02/GD03 list snapshots identify recurring top-end units/command packages (useful for scripted synergy test fixtures).

## Assumptions and unresolved ambiguities

- The prototype resolves scripted effects in LIFO stack order and gives priority back to active player after each stack item; this follows common TCG timing patterns and action-window language but may need adjustment if future official FAQ examples differ.
- The engine supports pilot linking through a deterministic text/trait match hook; real card-specific link rules may require per-card scripting beyond this generic matcher.
- Command/effect scripting is implemented through a registry API (by card ID) rather than full natural-language parsing; this is intentional for deterministic playtesting and incremental card-by-card rule onboarding.
