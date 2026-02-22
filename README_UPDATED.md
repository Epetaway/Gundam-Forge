# Gundam Forge

**A strategic deck builder and playtest simulator for Gundam-inspired card battles**

Gundam Forge is a fully-featured deck building and battle simulation application with authentic Gundam visual design, comprehensive game rules, and a complete game engine.

---

## ✨ Features

### 🎴 Complete Card Database
- **33 official cards** with working placeholder images
- **4 card types**: Units (Mobile Suits), Pilots (Ace Pilots), Commands (Tactics), Bases (Facilities)
- **6 color identities**: White (Federation/Defense), Blue (Tech/Draw), Red (Aggro), Green (Growth), Black (Control), Colorless (Universal)
- **6 Gundam universes**: UC, SEED, 00, Wing, IBO, Universal Century

### 📜 Official Game Rules  
- **Complete rulebook** at [docs/GAME_RULES.md](docs/GAME_RULES.md) (v1.0, 8000+ words)
- **Turn structure**: Refresh → Resource → Main → Combat → End phases
- **Resource system**: Place 1 card per turn as resource, match colors to play cards
- **Combat mechanics**: Attack/block with keywords (Haste, First Strike, Flying, Armor, Beam, Unblockable)
- **Win conditions**: Reduce opponent to 0 Life (from 20), deck-out, or Base destruction at ≤5 Life

### 🏗️ Deck Builder
- **Visual card catalog** with Gundam-themed HUD interface (6-column responsive grid)
- **Smart validation**: Exactly 60 cards, max 3 copies per card, max 2 colors (excluding Colorless)
- **Advanced filters**: Search by name/ID, filter by color/type/cost/set
- **Enhanced preview**: Card details with cockpit HUD overlays, tactical reticles, scanline animations
- **Export/import**: Copy deck list to clipboard, share with others
- **Deck analytics**: Cost curve, type distribution, color balance

### ⚔️ Complete Game Engine
- **Full implementation** at `/packages/shared/src/game-engine.ts` (600+ lines)
- **Combat resolution**: Attack/block declarations, damage calculation, keyword interactions
- **Turn management**: Automated phase progression, priority system, summoning sickness
- **Resource system**: Color matching, cost calculation, Base resource generation
- **Card mechanics**: Power calculation, Pilot attachments, Transform abilities
- **Win conditions**: Life point tracking, deck-out detection, Base destruction victory

### 🎨 Gundam Visual Identity
- **"Real robot" aesthetic**: Military-grade UI inspired by Mobile Suit cockpits
- **RX-78-2 palette**: Official Gundam white (#FCFCFC), blue (#003A70), red (#D32F2F), yellow (#F4C430)
- **HUD effects**: Scanline animations, tactical reticles, holographic displays, beam glows
- **Textures**: Panel line grids, caution stripes, hangar bay backgrounds
- **Typography**: Orbitron (HUD displays), Roboto Mono (readouts), Noto Sans (body text)
- **Animations**: Deploy effects (0.3s), panel glows (1.5s), scanline sweeps (4s)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev:web

# Build for production
npm run build

# Run linter and quality checks
npm run lint
npm run qa
```

Open the local URL printed by Vite (usually `http://localhost:5173`)

---

## Project Structure

```
gundam-forge/
├── apps/
│   └── web/                    # React + Vite + Tailwind UI
│       ├── src/
│       │   ├── data/
│       │   │   └── cards.json  # Card database (33 cards)
│       │   └── features/
│       │       ├── deckbuilder/
│       │       │   ├── CardGrid.tsx          # Visual card catalog
│       │       │   ├── EnhancedCardPreview.tsx  # Card details panel
│       │       │   ├── ModernCardCatalog.tsx    # Search & filters
│       │       │   ├── DeckBuilderPanel.tsx     # Deck list
│       │       │   ├── cardsStore.ts         # Card state
│       │       │   └── deckStore.ts          # Deck state
│       │       ├── simulator/
│       │       │   ├── SimulatorPanel.tsx    # Main playmat
│       │       │   ├── PlaymatRoot.tsx       # Game zones
│       │       │   └── simStore.ts           # Simulator state
│       │       └── diagnostics/
│       │           └── DiagnosticsPanel.tsx  # Analytics
│       ├── index.html          # Fonts: Orbitron, Roboto Mono, etc.
│       └── tailwind.config.ts  # Gundam design tokens
│
├── packages/
│   └── shared/                 # Shared game logic
│       ├── types.ts            # Card definitions, types
│       ├── validation.ts       # Deck validation (60 cards, 3 max, 2 colors)
│       ├── game-engine.ts      # Complete game engine (NEW!)
│       ├── playmat-zones.ts    # Battle zone coordinates
│       └── card-schema.ts      # Zod validation schemas
│
└── docs/
    ├── GAME_RULES.md           # Complete official rules (NEW!)
    ├── CARD_DB_GUIDE.md        # Database documentation
    └── GOVERNANCE_COMPLIANCE.md # Legal guidelines
```

---

## Game Rules Summary

### Deck Construction
- **Exactly 60 cards** required
- **Max 3 copies** per card
- **Max 2 colors** (Colorless doesn't count toward limit)
- **Recommended**: At least 15 Unit cards

### Game Setup
- **Starting Life**: 20
- **Starting Hand**: 7 cards (with mulligan option)
- **First Player**: Random

### Turn Phases
1. **Refresh Phase**: Untap all cards, draw 1 card
2. **Resource Phase**: Place 1 card face-down as resource (once per turn)
3. **Main Phase**: Play Units, Pilots, Commands, Bases
4. **Combat Phase**: Declare attackers → Blockers → Resolve damage
5. **End Phase**: Discard to 7 cards, pass turn

### Combat Basics
- **Attackers exhaust** (tap sideways) when attacking
- **Blockers don't exhaust** (can block multiple times if multiple attacks)
- **Damage**: Power vs Power, destroyed if damage ≥ power
- **Unblocked damage**: Goes to opponent's Life Points or Base

### Card Types
| Type | Description | Example |
|------|-------------|---------|
| **Unit** | Mobile Suits with Power, can attack/block | RX-78-2 Gundam (5 Power) |
| **Pilot** | Attaches to Units, grants bonuses | Amuro Ray (+2 Power, First Strike) |
| **Command** | Instant effects, goes to discard | Beam Rifle (Deal 3 damage) |
| **Base** | Generates resources, can be attacked | Side 7 Colony (Generate 2 Blue) |

### Keywords
- **Haste**: Can attack immediately (no summoning sickness)
- **First Strike**: Deals combat damage before normal Units
- **Flying**: Can only be blocked by Flying Units
- **Armor X**: Prevent first X damage dealt each turn
- **Beam**: Advanced energy weapons (+1 damage vs non-Beam/Armor)
- **Unblockable**: Cannot be blocked

### Win Conditions
1. **Life Points**: Reduce opponent to 0 or less (from 20)
2. **Deck-Out**: Opponent can't draw when required
3. **Base Destruction**: Destroy opponent's Base while they have ≤5 Life (instant win)

**For complete rules**, see [docs/GAME_RULES.md](docs/GAME_RULES.md)

---

## Routes

- **`/`** — Hangar Bay (Home screen with tactical welcome display)
- **`/builder`** — Deck Builder (Card catalog + Enhanced preview + Deck list)
- **`/sim`** — Simulator (Playmat with drag/drop gameplay)
- **`/diagnostics`** — Diagnostics (Deck analytics and validation)

---

## Card Database Updates

### Current Database
- **Location**: `apps/web/src/data/cards.json`
- **Count**: 33 cards
- **Images**: Working placeholders from placehold.co (Gundam color schemes)

### Adding New Cards
All cards must follow this schema:

```json
{
  "id": "UNIQUE-ID",
  "name": "Card Name",
  "color": "White|Blue|Red|Green|Black|Colorless",
  "cost": 1-15,
  "type": "Unit|Pilot|Command|Base",
  "set": "SET-CODE",
  "text": "Card ability text with keywords (Haste, First Strike, etc.)",
  "power": 0-20,
  "placeholderArt": "https://placehold.co/600x840/COLOR/TEXT"
}
```

### Example Card
```json
{
  "id": "GD-001",
  "name": "RX-78-2 Gundam",
  "color": "White",
  "cost": 4,
  "type": "Unit",
  "set": "UC-1",
  "text": "Haste. When this enters, draw 1 card. While you control a Pilot, this gains +1 power.",
  "power": 5,
  "placeholderArt": "https://placehold.co/600x840/003A70/FCFCFC?text=RX-78-2+Gundam&font=roboto"
}
```

---

## Development

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Gundam design tokens
- **State**: Zustand (lightweight, no boilerplate)
- **Routing**: React Router v6
- **Validation**: Custom deck validation engine
- **Game Logic**: Full rules engine in `/packages/shared/src/game-engine.ts`

### Design System
Custom Tailwind tokens for Gundam visual identity:
```typescript
// tailwind.config.ts
colors: {
  'gundam-white': '#FCFCFC',
  'gundam-blue': '#003A70', 
  'gundam-red': '#D32F2F',
  'gundam-yellow': '#F4C430',
  'efsf-blue': '#0052A3',
  'zeon-green': '#2E7D32',
  'hud-cyan': '#00E5FF',
  'hud-amber': '#FFA000',
  // + 5 more colors
},
animations: {
  'scanline': 'scanline 4s linear infinite',
  'hud-pulse': 'hud-pulse 2s ease-in-out infinite',
  'panel-glow': 'panel-glow 1.5s ease-in-out infinite',
  'deploy': 'deploy 0.3s ease-out'
}
```

### Build Commands
```bash
npm run build           # Production build
npm run lint            # ESLint check
npm run qa              # Quality assurance
npm run dev:web         # Development server
```

---

## Legal & Compliance

### Copyright Notice
This project is a **fan-made** deck builder and simulator inspired by the Gundam franchise. It is **NOT officially licensed** by Bandai, Sunrise, or Sotsu.

### Content Guidelines
- **No copyrighted art**: All card images use placeholder services
- **No official assets**: No Bandai/Sunrise trademarks, logos, or copyrighted text
- **Abstracted design**: Generic "real robot" aesthetic, not specific Mobile Suit designs
- **Open source fonts**: All typography uses SIL OFL or Apache 2.0 licensed fonts
- **Color schemes only**: Using color palettes and mechanical patterns (non-copyrightable)

### Recommended Usage
- **Personal play testing**: Build and test decks
- **Community development**: Share deck ideas, strategy discussions
- **Educational**: Learn TypeScript, React, game design
- **Portfolio**: Showcase web development skills

**For commercial use or official tournaments**, obtain proper licensing from Bandai.

---

## Contributing

### Card Contributions
Submit new card designs via GitHub Issues with:
- Card name and ID
- Color, cost, type, power
- Ability text (must use official keywords)
- Set code and rarity
- Placeholder image URL

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Follow TypeScript best practices
4. Ensure all builds pass (`npm run build`)
5. Submit pull request with description

### Bug Reports
Open GitHub Issues with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Screenshots if applicable

---

## Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Card database with 33 cards
- [x] Deck builder with validation
- [x] Gundam visual identity
- [x] Complete game rules document
- [x] Full game engine implementation

### Phase 2: Gameplay (Next)
- [ ] Integrate game engine into simulator UI
- [ ] Implement turn phase controls
- [ ] Add resource pool visualization
- [ ] Combat resolution interface
- [ ] Life point tracking UI

### Phase 3: Enhanced Features
- [ ] Multiplayer support (WebSocket)
- [ ] AI opponent
- [ ] Deck builder presets (starter decks)
- [ ] Card collection tracking
- [ ] Tournament mode

### Phase 4: Content Expansion
- [ ] Expand to 100+ cards
- [ ] Add 3-4 new sets
- [ ] Implement all keywords from rules
- [ ] Create official starter decks
- [ ] Balance patches and errata system

---

## Credits

**Development**: Gundam Forge Team  
**Design Inspiration**: Gundam franchise (©Sotsu/Sunrise/Bandai)  
**Visual Design**: "Real robot" military aesthetic  
**Typography**: Orbitron (SIL OFL), Roboto Mono (Apache 2.0), Noto Sans (SIL OFL), Inter (SIL OFL)  
**Card Game Design**: Inspired by TCG mechanics (Magic: The Gathering, Pokémon, etc.)

---

## License

**Code**: MIT License (see LICENSE file)  
**Gundam IP**: ©Sotsu/Sunrise/Bandai (not affiliated)  
**Card Content**: Fan-made for personal/educational use only

---

## Support

- **Documentation**: See `/docs` folder
- **Rules Questions**: [docs/GAME_RULES.md](docs/GAME_RULES.md)
- **Bug Reports**: GitHub Issues
- **Discussions**: GitHub Discussions

**Enjoy building your Gundam deck and may your Mobile Suit reign supreme! 🤖⚔️**
