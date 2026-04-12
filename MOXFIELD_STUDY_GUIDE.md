# Moxfield Code & UX Deep Study Guide

Use this as a checklist while exploring Moxfield. Visit sections, open DevTools, inspect components. Document findings in corresponding sections.

---

## 1. PAGE STRUCTURE & ROUTING

### Navigation & Route Hierarchy
- [ ] Main nav links: what routes/sections exist?
- [ ] URL patterns: how are deck IDs, filters encoded?
- [ ] Breadcrumb trails: how do users navigate hierarchy?
- [ ] Deep linking: can you share filtered search states via URL?

**DevTools check:**
```
- Network tab: what is the base URL structure?
- History/location API usage?
- Hash routing or true URL routing?
```

### Site Map
- [ ] Home/landing page purpose & CTA
- [ ] Deck browser/search entry point
- [ ] Deck builder workspace
- [ ] Deck detail/public page
- [ ] User profile/collection
- [ ] Meta/trending section (if exists)
- [ ] Social/filtering features
- [ ] Settings/preferences

**Document:**
```
Route patterns observed:
- /deck/{id} — 
- /search — 
- /decks — 
```

---

## 2. DECK BUILDER COMPONENT ARCHITECTURE

### Main Workspace Layout
- [ ] Where is the card search/browser positioned? (left? sidebar? modal?)
- [ ] How is the deck list displayed? (right panel? grid? stack?)
- [ ] How are the two connected/synchronized?
- [ ] Responsive behavior: what changes on mobile?

**Screenshot & sketch:**
- Draw the 3-column/2-column/1-column layouts for desktop/tablet/mobile
- Note exact spacing, breakpoints

### Card Search/Browser
- [ ] Search input UI (typeahead? debounce?)
- [ ] Filter options visible: cost? color? type? power/toughness?
- [ ] Are filters AND/OR combined? (e.g., Blue OR Green vs Blue AND creatures)
- [ ] Sort options: alphabetical? by relevance? by cost?
- [ ] How many results shown at once? (lazy load? pagination? infinite scroll?)
- [ ] Highlight/preview on hover?

**DevTools Network tab:**
- What API does search hit? (`/api/search...`?)
- Query params: how are filters encoded?
- Response shape: card objects structure?

**React DevTools (if available):**
- Component tree: SearchPanel, FilterPanel, CardGrid, Card...?
- State lifted where? (parent workspace? context? zustand/redux?)
- Re-render behavior when typing search?

### Deck Composition Display
- [ ] How are cards grouped? (by cost? by type? by color? by count?)
- [ ] Can you reorder cards? (drag-drop? menu?)
- [ ] Increment/decrement buttons or direct edit?
- [ ] Visual indicators for deck legality? (max copies per card?)
- [ ] Deck stats displayed? (total cards, mana curve, color distribution?)
- [ ] Undo/redo capability?

**State inspection:**
- What does the deck data structure look like? (array? map? nested?)
- Is state persisted to localStorage?
- What happens if you add same card twice?

### Card Instance Interaction
- [ ] Hover tooltip: what info shown? (full text? image?)
- [ ] Right-click menu options? (remove, move, details)
- [ ] Keyboard shortcuts? (Del to remove? arrow keys to navigate?)
- [ ] Drag-drop behavior: card search → deck list?
- [ ] Multi-select or bulk operations?

---

## 3. DECK MANAGEMENT & PERSISTENCE

### Save/Load Flow
- [ ] Save button visible where? (top bar? auto-save?)
- [ ] Save triggers: manual? auto after delay? on blur?
- [ ] Unsaved changes indicator?
- [ ] Confirmation dialogs for destructive actions?

**Network inspection:**
- PUT/POST to what endpoint? (`/api/decks/{id}`?)
- Payload structure: entire deck object? delta?
- Error handling: what if save fails?

### Deck Metadata
- [ ] Editable fields: name? description? tags? format/legality?
- [ ] Format selector: Standard/Modern/Commander/etc.?
- [ ] Color indicator/badge displayed?
- [ ] Archetype/strategy field?

### Import/Export
- [ ] Import formats supported: copypaste? file upload? URL? share link?
- [ ] Export formats: list? JSON? image?
- [ ] Partial import handling: warn on missing cards?
- [ ] List parsing logic: "4x Card Name" vs "Card Name (4)" vs other formats?

---

## 4. FILTERING & SEARCH ARCHITECTURE

### Filter Types & UI
- [ ] Cost filter: slider? checkboxes? multi-select?
- [ ] Color filter: pie chart? pills? toggle buttons?
- [ ] Type filter: creature/instant/sorcery/etc.?
- [ ] Power/Toughness range?
- [ ] Text search (card ability keywords)?
- [ ] Rarity filter?
- [ ] Set filter?
- [ ] Custom tags/categories?

### Filter Persistence
- [ ] Are filter states kept when navigating away then back?
- [ ] Shareable filter/search URLs?
- [ ] Recently used filters?
- [ ] Saved filter presets?

**URL inspection:**
```
/search?cost=3-5&color=blue,green&type=creature&sort=relevance
```

### Smart Features
- [ ] "Did you mean?" suggestions?
- [ ] Autocomplete on card names?
- [ ] Fuzzy matching (typo tolerance)?
- [ ] Related cards suggestions?

---

## 5. META & ANALYTICS FEATURES (if present)

### Trending Decks Section
- [ ] How sorted: by wins? by popularity? by recent activity?
- [ ] Time window: last week? last month? all-time?
- [ ] Filters available: by archetype? by format? by color?
- [ ] Deck preview card shows: name? colors? archetype? win rate? play count?

### Deck Statistics
- [ ] Color distribution pie/bar chart?
- [ ] Mana curve (cost distribution)?
- [ ] Card type breakdown?
- [ ] Duplicate count distribution?

### Archetype Tags & Detection
- [ ] Manual tagging or auto-detected?
- [ ] How auto-detected? (regex? ML? user votes?)
- [ ] Display prominently?

### User Engagement Metrics
- [ ] View counts? Like/favorite counts?
- [ ] Win rate tracking? (if tournament integration exists)
- [ ] Deck popularity over time graph?

---

## 6. MOBILE & RESPONSIVE UX

### Breakpoint Behavior
Document what changes at each breakpoint:
- [ ] Desktop (1920px)
- [ ] Laptop (1440px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

**On mobile, specifically:**
- [ ] Is there one column or stack layout?
- [ ] Card search in a drawer/modal?
- [ ] Deck list accessible via tabs/slides?
- [ ] Touch targets minimum size? (44px? 48px?)
- [ ] Bottom sheet for actions?
- [ ] Hamburger menu vs full nav?

### Touch Interactions
- [ ] Tap to add/remove card?
- [ ] Long-press for context menu?
- [ ] Swipe gestures?
- [ ] Pinch to zoom on card image?

---

## 7. COMPONENT PATTERNS & CODE STRUCTURE

### Likely Component Hierarchy
While inspecting React DevTools or HTML/CSS:

```
App
├── Layout
│   ├── Header/Nav
│   └── Main
│       ├── Sidebar (filters?)
│       ├── MainContent
│       │   ├── SearchPanel
│       │   │   ├── SearchInput
│       │   │   ├── FilterPanel
│       │   │   └── CardGrid
│       │   │       └── CardCard
│       │   └── DeckPanel
│       │       ├── DeckStats
│       │       ├── DeckList
│       │       │   └── DeckCard (with qty)
│       │       └── Actions (Save, Export, etc.)
│       └── Sidebar (stats?)
└── Modals/Toasts
```

- [ ] Are components function or class-based?
- [ ] Naming conventions: `CardSearchPanel` or `SearchPanel`?
- [ ] Props drilling or state management? (Context? Redux? Zustand?)

### State Management
- [ ] Inspect React DevTools Profiler
- [ ] What's in component state vs lifted state?
- [ ] Any external store? (Redux, MobX, Zustand, Jotai?)
- [ ] How is deck state synchronized?

**Look for:**
- Redux DevTools extension (check Redux tab)
- React Context usage (DevTools tree)
- Custom hooks returning state?

### Styling Approach
- [ ] CSS-in-JS (styled-components, Emotion)?
- [ ] Tailwind (class names like `flex`, `grid`)?
- [ ] BEM or other naming?
- [ ] CSS Modules?
- [ ] Dark mode support? (check DevTools styles)

---

## 8. PERFORMANCE & OPTIMIZATION

### Rendering Optimization
- [ ] Card grid: virtualization (only render visible cards)?
- [ ] Lazy loading images?
- [ ] Debounced search input?
- [ ] Memoization of components? (`React.memo`?)

**DevTools Performance tab:**
- Measure: type in search, observe FPS and re-renders
- Record: add card to deck, check paint times

### Bundle & Loading
- [ ] Initial load time (DevTools Network)?
- [ ] Code splitting: separate chunks for decks/search/builder?
- [ ] Preloading: what's fetched on mount?

**Network tab:**
- How many JS/CSS files?
- Sizes?
- Waterfall: any critical path blockers?

### Caching & API
- [ ] Card database: pre-fetched or fetched on demand?
- [ ] Cache headers: max-age?
- [ ] Service Worker or offline support?

---

## 9. UX FLOWS & INTERACTIONS

### Happy Path: Create & Save Deck
1. Landing → Button to "Start Deck"?
2. Search for cards / browse suggestions?
3. Click card → add to deck?
4. Set name/description?
5. Save → success feedback?
6. Share/export offered?

**Document the exact flow and micro-interactions:**
- Button hover/active states?
- Toast notifications?
- Loading spinners?
- Confirmation dialogs?

### Edge Cases & Error Handling
- [ ] Duplicate card at max count: what happens?
- [ ] Search returns no results: message?
- [ ] Server error on save: retry button?
- [ ] Network offline: offline mode?
- [ ] Invalid deck format: validation error?

### Keyboard Navigation & a11y
- [ ] Tab order logical?
- [ ] Enter/Space to activate buttons?
- [ ] Arrow keys to navigate lists?
- [ ] Escape to close modals?
- [ ] ARIA labels on custom components?
- [ ] Screen reader tested? (ChromeVox?)

**DevTools:**
- Lighthouse Accessibility audit score?
- Any ARIA warnings in console?

---

## 10. SOCIAL & SHARING

### Deck Sharing
- [ ] Share button UI: copy link? generate code? email?
- [ ] What's in the share link? (full deck data? just ID?)
- [ ] Permissions: view-only vs fork vs collaborative edit?

### Comments/Feedback
- [ ] Comment section on decks? (ThreadCount? nested replies?)
- [ ] Liked/favorited indicator?
- [ ] Deck rating/review system?

### Collaboration
- [ ] Can multiple users edit one deck?
- [ ] Real-time sync? (WebSocket? polling?)
- [ ] Version history/revisions?

---

## 11. PERFORMANCE METRICS & SCALABILITY

### Data Scale
- [ ] How many cards in database? (shown in footer? FAQ?)
- [ ] How many decks in catalog?
- [ ] Search time for large queries? (benchmark in DevTools)

### API Response Times
- [ ] Typical latency for search query?
- [ ] Deck save time?
- [ ] Trending decks load time?

---

## 12. VISUAL DESIGN & BRANDING

### Color & Typography
- [ ] Primary colors: what palette?
- [ ] How are card colors (blue/red/green) represented?
- [ ] Font stacks: serif/sans? sizes?
- [ ] Dark mode available?

### Visual Hierarchy
- [ ] Most important actions: size/color?
- [ ] Card preview: large image or small thumbnail?
- [ ] Deck name vs description prominence?

### Animations
- [ ] Card entrance animations?
- [ ] Button hover effects?
- [ ] Page transitions?
- [ ] Micro-interactions: toast slide-in, dropdown fade?

---

## 13. SETTINGS & PREFERENCES

- [ ] User account required?
- [ ] Preferences stored where: localStorage? server?
- [ ] Theme toggle (dark/light)?
- [ ] Default format/legality selection?
- [ ] Notification preferences?
- [ ] Privacy settings on deck visibility?

---

## ANALYSIS TEMPLATES

### Component Spotlight
```markdown
**Component: CardSearchInput**

**Purpose:** Filter deck search by card name with live updates

**Props:**
- value: string
- onChange: (value) => void
- disabled?: boolean
- placeholder?: string

**State managed at:** Parent (DeckBuilder) via useState

**Behavior:**
- Debounced 150ms on input
- Calls parent onChange → triggers API search
- Shows X button on focus if text entered
- Autocomplete suggestions appear in dropdown

**Performance:**
- Input itself simple, parent handles heavy lifting
- No local state, fully controlled
- Debounce prevents excessive API calls

**Accessibility:**
- <input type="text" aria-label="Search cards" />
- Clear button keyboard accessible
- Dropdown ARIA roles

**CSS Approach:** Tailwind classes + custom focus ring
```

### Feature Comparison Template
```markdown
**Feature: Deck Export**

**Moxfield approach:**
- Dropdown with format options: Text List / JSON / Image
- Text list format: "4x Card Name" per line
- Copy to clipboard button OR download file
- Shows deck stats alongside

**Moxfield UX strengths:**
- Multiple format options for different use cases
- Instant copy vs download choice
- Preview of exported format before copying

**How Gundam-Forge could adapt:**
- [ ] Add dropdown format selector
- [ ] Implement "Copy to clipboard" button
- [ ] Add file download option
```

---

## RECORDING YOUR FINDINGS

As you discover patterns, fill in this summary:

### Architecture Decision Log
```markdown
**Search Debounce**
- Observed: Input delays 150ms before firing parent onChange
- Implementation: Likely useCallback + useRef + timer
- Why: Reduces API calls during rapid typing
- Applies to: Any high-frequency input (deck name, search, filters)
```

### Patterns to Port to Gundam-Forge
```markdown
1. **Virtualized card grid** — Only render ~20 cards in viewport, rest lazy
   - Library: `react-window` or `react-virtual`
   - Gundam-Forge impact: Make large card databases snappy
   
2. **Filter persistence in URL** — Deep linking to search state
   - Implementation: URLSearchParams + useEffect
   - Gundam-Forge impact: Share filtered views

3. **Optimistic UI updates** — Add card to deck before confirm from server
   - Implementation: setState immediately, rollback on error
   - Gundam-Forge impact: Feel snappier
```

---

## USEFUL DEVTOOLS SHORTCUTS

**React DevTools Profiler:**
1. Open Profiler tab
2. Click red record dot
3. Perform action (search, add card)
4. Stop recording
5. View component render times, count of renders

**Lighthouse:**
1. DevTools → Lighthouse
2. Run audit (Performance, Accessibility, Best Practices)
3. Check scores and suggestions

**Network Throttling:**
1. DevTools → Network tab
2. Throttle to "Slow 4G"
3. Measure real-world performance on poor connection

**Redux DevTools (if applicable):**
1. Install Redux DevTools browser extension
2. Open extension → see state tree and action history
3. Time-travel debug
