# Card Search Guide

## Advanced Search Syntax

Gundam Forge supports powerful search queries to help you find cards quickly and accurately.

### Basic Search

Simply type keywords to search across card names, IDs, clans, effects, and text:

```
draw
Zeon
repair
```

### Multi-Term Search (AND Logic)

Use multiple terms separated by spaces to find cards that match ALL terms:

```
draw Zeon          # Cards with "draw" AND "Zeon"
repair blocker     # Cards with "repair" AND "blocker"
damage trash       # Cards with "damage" AND "trash" effects
```

### OR Logic

Use the pipe symbol `|` to find cards matching ANY of the terms:

```
draw | trash       # Cards with EITHER "draw" OR "trash"
Zeon | AEUG       # Cards from Zeon OR AEUG clans
repair | blocker   # Cards with repair OR blocker
```

### Negation (Exclude)

Use `-` prefix to exclude terms:

```
draw -destroy      # Cards with "draw" but NOT "destroy"  
Zeon -damage       # Zeon cards that don't deal damage
repair -rest       # Cards with repair that don't rest units
```

### Exact Phrases

Use quotes for exact phrase matching:

```
"deal 2 damage"    # Exact text match
"return to hand"   # Exact phrase in card text
"<Repair 2>"       # Exact keyword match
```

### Complex Queries

Combine all operators for powerful searches:

```
draw -destroy | "deal 2 damage"
# Cards with draw (but not destroy) OR cards with exact text "deal 2 damage"

Zeon damage -trash
# Zeon cards that deal damage but don't involve trash

"Place 1 rested Resource" | draw
# Cards that ramp resources OR draw cards
```

## Effect Keywords

Search by card effects to find cards with specific mechanics:

### Draw Effects
- `draw` - Cards that draw cards

### Damage Effects
- `deal_damage` - Cards that deal damage
- `damage_all` - Cards that damage all units

### Destruction
- `destroy` - Cards that destroy units
- `discard` - Cards that discard from hand

### Resource/Ramp
- `place_resource` - Cards that place resources (ramp)
- `0_cost` - Cards that can be played for free (0 Lv./0 cost)

### Search/Selection
- `choose_from_trash` - Cards that let you choose from trash

### Recovery
- `return_to_hand` - Cards that return cards to hand
- `return_to_deck` - Cards that return cards to deck
- `choose_from_trash_return` - Cards that recover cards from trash

### Buffs
- `buff_hp` - Cards that increase HP (HP+X)
- `buff_ap` - Cards that increase AP (AP+X)
- `grant_keyword` - Cards that grant keywords to units

### Control/Debuffs
- `rest` - Cards that rest (tap) units
- `set_active` - Cards that set units as active (untap)

### Tokens & Pairing
- `deploy_token` - Cards that create tokens
- `pair` - Cards that pair units with pilots

### Protection
- `cant_be_destroyed` - Cards with indestructible effects
- `cant_be_blocked` - Cards that can't be blocked

## Clan Filtering

Search by faction/clan names (case-insensitive):

```
Zeon
Earth Federation
AEUG
Neo Zeon
Titans
CB
Gjallarhorn
Tekkadan
Earth Alliance
ZAFT
Orb
OZ
Operation Meteor
```

## Examples

### Find All Card Draw
```
draw
```

### Find Zeon Cards with Damage
```
Zeon damage
```

### Find Cards That Draw But Don't Destroy
```
draw -destroy
```

### Find Cards with Exact Repair 2 Keyword
```
"<Repair 2>"
```

### Find Earth Federation or Zeon Cards
```
Earth Federation | Zeon
```

### Find Cards That Ramp Resources
```
place_resource
```

### Find Cards That Return from Trash
```
return_to_hand trash
```

### Find Deploy Effects That Deal Damage
```
"【Deploy】" damage
```

## Autocomplete Suggestions

As you type, Gundam Forge will suggest:

- **Effect Keywords** - Popular card effects with card counts
- **Clans** - Faction names with card counts
- **Card Names** - Matching card names

Use arrow keys ↑↓ to navigate suggestions, Enter to select, or Escape to close.

## Tips

1. **Start Simple**: Begin with one keyword and refine
2. **Use Autocomplete**: Let suggestions guide your search
3. **Combine Filters**: Use search with color/type/set filters for precision
4. **Save Common Searches**: Bookmark frequently used queries
5. **Check Effect Pills**: Click popular effect badges for quick filtering

## Performance

- Search results update within 100ms
- Autocomplete suggestions appear within 200ms
- Searches are debounced to prevent lag while typing
- All filtering happens client-side for instant results
