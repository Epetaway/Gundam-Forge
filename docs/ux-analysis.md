# Gundam Forge — UX Comparative Analysis Report

A deep analysis of three established MTG deck-building platforms — **Moxfield**, **Archidekt**, and **EDHREC** — with prioritized recommendations to improve the Gundam Forge deck builder's layout, filtering, and interaction patterns on desktop and mobile.

---

## Part 1 — Competitor Feature Inventory

### 1.1 Moxfield

Moxfield is widely regarded as the best overall MTG deck builder. Draftsim's 2025 review ranks it first, noting it has "a ton of features" and serves both as a simple deck designer and an intricate database. The following inventory explains why.

**Layout & Navigation**
- Desktop uses a clean two-panel workspace: card search on the left, deck list on the right, with a collapsible statistics panel below the deck list.
- Top navigation bar provides minimal, focused links: Decks, Search, Account.
- Mobile layout collapses into a single column with a bottom sheet for filters and a tabbed interface for switching between catalog and deck views.
- Breakpoints are smooth — card images scale proportionally and panels stack without layout breakage.

**Filtering & Search**
- Advanced filter panel with color identity checkboxes, CMC (converted mana cost) range slider, card type checkboxes, keyword text search with live autocomplete, format legality toggles, and rarity filter.
- Filters are progressively disclosed: basic search is always visible; advanced filters expand behind a "Filters" button on mobile and appear in a sidebar on desktop.
- Search autocomplete provides instant suggestions as the user types, matching on card name.

**Deck Building Workflow**
- Click-to-add is the primary interaction; right-click opens a context menu with options (add, remove, move to sideboard, set quantity).
- Quantity controls (+/-) are visible on hover for each card row.
- Multiple deck views: visual spoiler (card image grid), compact list (text rows with quantity/name/cost), type-sorted view, and user-defined custom categories.
- View switching is instant via a segmented control at the top of the deck panel.

**Stats & Analytics**
- Statistics are displayed inline alongside the deck list — not on a separate page.
- Mana curve bar chart, color pie chart, and type distribution breakdown are visible in a collapsible panel below the deck.
- Total card count, total deck price, and average CMC are shown persistently in the deck header.

**Playtesting**
- Built-in playtester accessible directly from the deck page via a "Playtest" button — no route change required.
- Supports draw, mulligan, and basic game actions.
- Hand visualization with card images.

**Collaboration & Social**
- Shared deck editing with permission controls (view-only or edit access).
- Comment threads on deck pages.
- Deck cloning — any user can clone a public deck to their own account.
- Public/private deck visibility toggle.

**Import/Export**
- Supports multiple formats: MTGO text, Arena text, plain text, and CSV.
- One-click clipboard copy for export.
- Paste-to-import with intelligent format detection.

**Visual Design & Responsiveness**
- Dark mode is the default; light mode available as an option.
- Clean, modern typography with generous whitespace.
- Smooth CSS transitions on all interactive elements.
- High-quality card images with lazy loading.
- Responsive breakpoints handle desktop, tablet, and mobile without content reflow issues.

---

### 1.2 Archidekt

Archidekt is a comprehensive deckbuilding, collection management, and social platform. EDHREC's official guide describes it as a site where users can "organise cards, create decks, make custom cards, playtest and collaborate." Each deck has its own page with a "deckbuilding dashboard" that shows errors when a deck is illegal and includes import and extras menus.

**Layout & Navigation**
- Dashboard-style deck page with modular, widget-like panels that can be rearranged.
- Dual-level navigation header: primary links (Decks, Community, Card Search) with secondary branches (Search All Decks, Commander Precons, Deck Tags, Card Packages).
- Card-based grid system for browsing decks — each card shows thumbnail artwork, metadata (views, timestamp), and creator info.
- Mobile: responsive vertical stacking, hamburger navigation menu.

**Filtering & Search**
- Color identity filter (WUBRG), card type filter, CMC filter, set filter, and text search.
- Tag-based exploration — decks and cards are organized with community tags (e.g., "Tokens," "+1/+1 Counters," "Spellslinger").
- Deck tags enable discovery across strategy archetypes.

**Deck Building Workflow**
- Deck page presents a "deckbuilding dashboard" with clear controls.
- Actions available: Create new deck, Preview deck, Playtest deck, Open in sandbox.
- Error alerts surface when a deck violates format legality rules, showing specific violations.
- Custom card creation is supported — users can design their own cards.
- View modes include visual spoiler, list, text, and playtest views.

**Stats & Analytics**
- Dashboard-style statistics: mana curve chart, color distribution, card type breakdown.
- Stats panels are modular — they live alongside the deck list, not on separate pages.

**Playtesting**
- Built-in sandbox/playtest mode accessible from the deck page.
- Supports basic game simulation (draw, play cards).
- "Open in sandbox" for more advanced testing scenarios.

**Collaboration & Social**
- Shared editing with collaborator access controls.
- Deck comments and discussion threads.
- Social features: follow other users, creator spotlights, community voting on features.
- Deck comparison functionality.
- Color-coded user avatars reflecting Magic's mana colors.

**Import/Export**
- Multiple import/export format support.
- Deck code sharing for cross-platform compatibility.
- Extras menu with additional import options.

**Visual Design & Responsiveness**
- Primary accent color: orange (#fa890d) for interactive elements and progress indicators.
- Lato font family across multiple weights (100-900) for visual hierarchy.
- Generous padding and whitespace around cards and sections.
- Responsive design with vertical stacking on mobile and hamburger menu navigation.

---

### 1.3 EDHREC

EDHREC is primarily a card recommendation and metagame analysis site rather than a deck builder. Its strengths complement the building tools of Moxfield and Archidekt.

**Navigation & Information Architecture**
- Hierarchical navigation: Articles, Cards, Commanders, Precons, Sets, Tags.
- Expandable dropdown menus organizing content by color identity and card type.
- Multi-tag classification system for articles (e.g., simultaneous tags for "fun" and "cEDH").
- Mobile: hamburger navigation with vertical stacking.

**Card Recommendation Engine**
- Algorithmic card suggestions based on commander selection — EDHREC's core value proposition.
- Synergy scores indicate how well a card pairs with a given commander.
- "Top Commanders Weekly" and "Trending Cards" sections with ranked displays driven by community engagement metrics.
- Color-based segmentation (WUBRG + Colorless + Multicolor).

**Card Type Granularity**
- Exceptionally detailed card type categories: Creatures, Instants, Sorceries, Artifacts (subdivided into Equipment, Utility, Mana variants), Enchantments, Auras, Battles, Planeswalkers, Lands (Utility and Color-Fixing variants).

**Integration**
- Links directly to Archidekt and Moxfield for actual deck construction.
- Provides deck code export functionality that can be pasted into deck builders.
- Functions as a discovery/research layer that feeds into the building workflow.

**Visual Design & Responsiveness**
- Article cards feature author avatars, publication dates, featured images, and tag clouds.
- Content segmentation is clear between content types.
- Responsive layout with standard mobile patterns.

---

### 1.4 Feature Matrix

| Feature | Moxfield | Archidekt | EDHREC | Gundam Forge (Current) |
|---|:---:|:---:|:---:|:---:|
| **Desktop multi-panel layout** | 2-panel + collapsible stats | Dashboard widgets | Hierarchical pages | 3-column grid |
| **Mobile bottom tabs** | Yes | Hamburger | Hamburger | None (nav hidden on mobile) |
| **Search autocomplete** | Yes | No | No | No |
| **CMC/cost range slider** | Yes | Discrete filter | N/A | Discrete or absent |
| **Advanced filter panel** | Yes (color, type, CMC, rarity, text) | Yes (color, type, CMC, set, tags) | Yes (color, type, extensive) | Basic (color, type, set) |
| **Multiple deck views** | Visual, list, type-sorted, custom | Visual, list, text, playtest | N/A | List only (DeckViewSelector exists unused) |
| **Inline stats** | Yes (collapsible below deck) | Yes (dashboard widgets) | N/A | Separate /analytics route |
| **Inline playtester** | Yes (overlay from deck page) | Yes (sandbox mode) | No | Separate /sim route |
| **Dark mode** | Default dark | Light only | Light only | Light only (tokens ready) |
| **Import/export** | Multiple formats + clipboard | Multiple formats | Export only | Text format only |
| **Collaboration** | Shared editing, comments, clone | Shared editing, comments, social | N/A | Public viewing only |
| **Card recommendations** | No | No | Core feature | No |
| **Deck validation alerts** | Yes | Yes (prominent error display) | N/A | Yes (LED indicator + error count) |
| **Keyboard shortcuts** | Yes | Limited | No | Space-to-inspect only |
| **Collection management** | Yes | Yes | No | Yes (catalog tab) |
| **Game simulation depth** | Basic (draw, mulligan) | Basic (sandbox) | None | **Advanced** (phases, battle, pilot pairing, undo) |
| **Price integration** | TCGPlayer + CardKingdom | Yes | Yes | Partial (price-api exists) |
| **Drag-and-drop** | Custom categories | Custom categories | No | No |
| **Custom cards** | No | Yes | No | No |
| **Image preloading** | Lazy load | Standard | Standard | Yes (prefetch + broken image tracking) |
| **Panel collapse/resize** | No | Resizable widgets | N/A | Store actions exist, not wired |

---

## Part 2 — Criteria Evaluation

Using Draftsim's five evaluation criteria for deck builders — intuitiveness, appealing and responsive UI, rich free features, modern aesthetics, and playtesting capability — here is how each platform scores.

### 2.1 Intuitiveness

**Moxfield (5/5)** — Click-to-add, right-click context menus, and live autocomplete make the learning curve nearly flat. New users can build a deck within minutes.

**Archidekt (4/5)** — The dashboard approach provides clear affordances, but the dual-level navigation and abundance of options (sandbox, playtest, compare, tags) can overwhelm first-time users. Error alerts when a deck is illegal are a strong usability feature.

**EDHREC (3/5)** — Excellent for discovery but not a builder. Navigation depth (Articles > Cards > Commanders > Tags) requires familiarity.

**Gundam Forge (3/5)** — The 3-column layout is logical, and the LED validation indicator is intuitive. However, pushing analytics to `/analytics` and the simulator to `/sim` fragments the workflow. Users must navigate away from the Forge to access related tools. The search input lacks autocomplete, and mobile users lose navigation entirely since the `nav` element is `hidden md:flex` with no alternative mobile nav (`Header.tsx:64`).

### 2.2 Appealing & Responsive UI

**Moxfield (5/5)** — Dark-mode default, smooth transitions, responsive breakpoints, and high-quality card imagery create a polished experience across all screen sizes.

**Archidekt (4/5)** — The orange accent, Lato typography, and generous whitespace create a warm, inviting design. Mobile stacking works but lacks a dedicated mobile navigation pattern beyond hamburger.

**EDHREC (3/5)** — Functional but not visually distinctive. Article cards and tag clouds add visual interest but the overall aesthetic is utilitarian.

**Gundam Forge (3.5/5)** — Strong foundations: Inter/Roboto typography, a comprehensive design token system (`tokens.css`), well-defined spacing scale, and proper shadow hierarchy. The 3-column grid with responsive breakpoints at 1279px/1023px/767px (`layout.css:41-59`) is well-architected. What holds it back: light mode only, inconsistent application of the motion system, and the mobile breakpoint reduces to a single column with stacked panels rather than a purpose-built mobile interface.

### 2.3 Rich Free Features

**Moxfield (5/5)** — Virtually every feature is free: multiple views, stats, playtesting, collaboration, import/export, price tracking.

**Archidekt (4/5)** — Free tier includes deck building, playtesting, collection management, and social features. Some premium features exist but core functionality is fully free.

**EDHREC (4/5)** — Card recommendations, trending data, and tag exploration are all free.

**Gundam Forge (3.5/5)** — The free feature set is surprisingly robust: full deck building, import/export, a game simulator with phase management and battle resolution (`game-engine.ts`), collection tracking, public deck explorer, and card database. However, many features are disconnected (stats on a separate route, simulator on another), and several built components go unused (`DeckViewSelector.tsx` is not wired into any page). Activating what already exists would significantly boost this score.

### 2.4 Modern Aesthetics

**Moxfield (5/5)** — The dark-mode-first approach, clean sans-serif typography, generous whitespace, and smooth micro-interactions define contemporary web design.

**Archidekt (4/5)** — Modern card-based grid design with thoughtful color choices (orange accent + WUBRG color coding). Slightly busier than Moxfield due to information density.

**EDHREC (3/5)** — Adequate but dated in places. Content-focused rather than design-focused.

**Gundam Forge (3/5)** — The token system is production-quality and dark-mode-ready (all colors defined as CSS custom properties with `color-scheme: light` at `tokens.css:194`). The Inter font family, 8px spacing grid, and layered shadow system are modern. However, the light-only theme, the absence of consistent transitions on interactive elements, and card tiles without fade-in loading effects hold the visual polish back.

### 2.5 Playtesting Capability

**Moxfield (4/5)** — Built-in playtester with draw, mulligan, and basic game actions. Accessible as an overlay from the deck page.

**Archidekt (3/5)** — Sandbox mode supports basic playtesting but lacks depth.

**EDHREC (0/5)** — No playtesting capability.

**Gundam Forge (4.5/5)** — This is Gundam Forge's strongest competitive advantage. The simulator (`SimulatorPanel.tsx` + `game-engine.ts`) implements a complete game engine: phase management (Start, Draw, Resource, Main, End with substeps), battle system with attack/defend, pilot pairing with units, damage resolution, resource management, active/inactive unit toggling, manual draw and mulligan, an undo stack, and a game log. This far exceeds what Moxfield or Archidekt offer. The only gap is that it lives on a separate `/sim` route rather than being accessible inline from the deck builder.

### 2.6 Scorecard Summary

| Criterion | Moxfield | Archidekt | EDHREC | Gundam Forge |
|---|:---:|:---:|:---:|:---:|
| Intuitiveness | 5 | 4 | 3 | 3 |
| Appealing & Responsive UI | 5 | 4 | 3 | 3.5 |
| Rich Free Features | 5 | 4 | 4 | 3.5 |
| Modern Aesthetics | 5 | 4 | 3 | 3 |
| Playtesting | 4 | 3 | 0 | **4.5** |
| **Overall** | **4.8** | **3.8** | **2.6** | **3.5** |

Gundam Forge's simulator is a genuine differentiator — it rivals dedicated playtesting tools. The gap to close is primarily in UI polish, workflow integration, and mobile navigation.

---

## Part 3 — Recommendations for Gundam Forge

### 3.1 Layout & Navigation

#### Rec #1: Embed Stats Inline (Priority: High | Complexity: Low)

**Competitor pattern:** Moxfield shows mana curve, color pie, and type distribution in a collapsible panel directly below the deck list. Archidekt uses dashboard widgets alongside the deck.

**Current state:** Gundam Forge navigates to a separate `/analytics` route via a `<Link to="/analytics">` button in the Forge toolbar (`ForgeWorkspace.tsx:74`). The `DeckStats.tsx` component already computes cost curve, color distribution, and type distribution — the data is ready.

**Recommendation:** Embed `DeckStats` as a collapsible panel within `DeckBuilderPanel`, toggled by a button in the deck panel header. Remove or repurpose the `/analytics` route link. This keeps users in their building flow and surfaces critical deck health data without a route change.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ForgeWorkspace.tsx` — Remove Analytics link, embed stats toggle
- `apps/web/src/features/deckbuilder/DeckBuilderPanel.tsx` — Add collapsible DeckStats section
- `apps/web/src/features/deckbuilder/DeckStats.tsx` — Add a compact inline mode
- `apps/web/src/styles/layout.css` — Adjust panel overflow for embedded stats

#### Rec #2: Inline Playtester Overlay (Priority: High | Complexity: Medium)

**Competitor pattern:** Moxfield opens its playtester directly from the deck page without navigating away. Archidekt provides an "Open in sandbox" action from the deck dashboard.

**Current state:** The "Test" button in the Forge toolbar navigates to `/sim` (`ForgeWorkspace.tsx:87`), breaking the user out of the deck building context. The `SimulatorPanel` is a standalone route component.

**Recommendation:** Add a full-screen modal/overlay mode to `SimulatorPanel` that can be triggered from the Forge toolbar. The `/sim` standalone route can remain for direct access. This preserves the deck context and allows quick iteration between building and testing.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ForgeWorkspace.tsx` — Replace `<Link to="/sim">` with overlay trigger
- `apps/web/src/features/simulator/SimulatorPanel.tsx` — Add `mode: 'page' | 'overlay'` prop, wrap in modal when overlay
- `apps/web/src/App.tsx` — Keep `/sim` route for standalone access

#### Rec #3: Mobile Bottom Tab Bar (Priority: High | Complexity: Low)

**Competitor pattern:** Moxfield provides a bottom tab bar on mobile for fast section switching. Archidekt uses a hamburger menu but still surfaces key navigation.

**Current state:** The desktop navigation bar is `hidden md:flex` (`Header.tsx:64`), meaning on screens below 768px, navigation is completely invisible — there is no hamburger menu, no bottom bar, and no alternative mobile nav at all. Mobile users have no way to navigate between pages other than using the back button or typing URLs.

**Recommendation:** Create a `BottomTabBar.tsx` component that renders a persistent bottom tab bar on viewports below 768px. Tabs: Home, Explorer, Forge, Cards, Profile. Use the same `NAV_ITEMS` array from `Header.tsx:5-11`. Add appropriate bottom padding to page content to account for the tab bar height.

**Files to modify:**
- New file: `apps/web/src/components/layout/BottomTabBar.tsx`
- `apps/web/src/App.tsx` — Include BottomTabBar in the layout shell
- `apps/web/src/components/layout/Header.tsx` — Consider adding a hamburger menu for md-lg gap, or rely on bottom tabs for <md

#### Rec #4: Wire Panel Collapse Toggles (Priority: High | Complexity: Low)

**Competitor pattern:** Archidekt's dashboard panels can be collapsed and rearranged. Moxfield's stats panel is collapsible.

**Current state:** `uiStore.ts` already defines `catalogCollapsed`, `detailDockCollapsed`, `toggleCatalog()`, and `toggleDetailDock()` (lines 6-7, 12-13, 25-26) — but these actions are never called from any component. The panel widths are fixed in `layout.css:35`.

**Recommendation:** Add collapse toggle buttons (chevron icons) to the catalog and detail dock panel headers. When collapsed, set the grid column width to `0px` (using the existing `--gf-sidebar-collapsed: 0px` token at `tokens.css:188`). Animate the transition using the existing motion tokens.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ForgeWorkspace.tsx` — Read collapse state from uiStore, add toggle buttons, apply dynamic grid classes
- `apps/web/src/stores/uiStore.ts` — Already has the actions; no changes needed
- `apps/web/src/styles/layout.css` — Add `.gf-forge-layout--catalog-collapsed` and `.gf-forge-layout--dock-collapsed` variants

---

### 3.2 Filtering & Search

#### Rec #5: Search Autocomplete (Priority: High | Complexity: Medium)

**Competitor pattern:** Moxfield provides live autocomplete suggestions as the user types, matching on card names.

**Current state:** `ModernCardCatalog.tsx` has a plain text input using `useDeferredValue` for debouncing. The `cardsStore.ts` `filterCatalogCards` function does substring matching on `${card.name} ${card.id}` but results appear only in the grid below — there is no suggestion dropdown.

**Recommendation:** Add a combobox-style dropdown below the search input that shows the top 8 matching card names as the user types. Selecting a suggestion either scrolls to the card in the grid or directly adds it to the deck. Use Radix UI's Combobox primitive (or build a lightweight custom one) for accessibility.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ModernCardCatalog.tsx` — Add suggestion dropdown component
- `apps/web/src/features/deckbuilder/cardsStore.ts` — Add `getSearchSuggestions` selector returning top 8 matches

#### Rec #6: Cost Range Slider (Priority: Medium | Complexity: Medium)

**Competitor pattern:** Moxfield uses a dual-handle CMC range slider that lets users filter by minimum and maximum cost simultaneously.

**Current state:** The `CatalogFilters` interface in `cardsStore.ts` defines `cost: number | 'All'` — a single discrete value. In `ModernCardCatalog.tsx`, cost filtering is not visually surfaced in the current active catalog (it exists in the older `CardCatalog.tsx` as a `<select>`).

**Recommendation:** Replace the discrete cost value with a `{ min: number; max: number }` range type. Add a dual-handle range slider below the color/type filter chips. The slider range should span from 0 to the maximum cost in the card catalog.

**Files to modify:**
- `apps/web/src/features/deckbuilder/cardsStore.ts` — Change `CatalogFilters.cost` type to `{ min: number; max: number } | 'All'`, update `filterCatalogCards`
- `apps/web/src/features/deckbuilder/ModernCardCatalog.tsx` — Add range slider UI
- New component: `apps/web/src/components/ui/RangeSlider.tsx`

#### Rec #7: Advanced Filter Panel (Priority: High | Complexity: Medium)

**Competitor pattern:** Both Moxfield and Archidekt offer deep filter panels. Moxfield uses progressive disclosure: basic filters visible, advanced behind a toggle. EDHREC provides granular card type subcategories.

**Current state:** `ModernCardCatalog.tsx` shows color chips (5 colors), type buttons (4 types), a set dropdown, and a text search. There are no filters for AP/HP range, traits/keywords, zone (Earth/Space), or pilot link conditions — all of which exist in the card data model (`types.ts`: `ap`, `hp`, `traits`, `zone`, `linkCondition`).

**Recommendation:** Add an expandable "More Filters" section below the existing filters. On mobile, this should appear as a bottom sheet or drawer with an "Apply" button (progressive disclosure pattern). Include: AP range slider, HP range slider, trait/keyword multi-select, zone filter (Earth/Space), and a "has link condition" toggle.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ModernCardCatalog.tsx` — Add "More Filters" collapsible section
- `apps/web/src/features/deckbuilder/cardsStore.ts` — Extend `CatalogFilters` with `apRange`, `hpRange`, `traits`, `zone`, `hasLinkCondition`
- `apps/web/src/features/cards/CardDatabasePage.tsx` — Apply the same advanced filter panel for consistency

---

### 3.3 Card & Deck List Views

#### Rec #8: Activate DeckViewSelector (Priority: High | Complexity: Medium)

**Competitor pattern:** Moxfield offers visual spoiler, list, type-sorted, and custom category views. Archidekt provides visual, list, text, and playtest views. View switching is instant — users toggle between modes without page navigation.

**Current state:** `DeckViewSelector.tsx` exists and defines three views — `'visual' | 'list' | 'stats'` — but it is **not imported or rendered anywhere** in the application. It also uses the old `gcg-` CSS class prefix instead of the current `gf-` token system. The deck panel (`DeckBuilderPanel.tsx`) always renders a type-grouped list view.

**Recommendation:** Update `DeckViewSelector.tsx` to use the `gf-` token system. Integrate it into `DeckBuilderPanel.tsx` as a view mode toggle. Implement three views:
- **List view** (current default): type-grouped text rows with quantity controls
- **Visual spoiler**: card image grid showing all deck cards as thumbnail tiles
- **Stats view**: inline DeckStats panel (overlaps with Rec #1)

Create a new `DeckVisualSpoiler.tsx` component for the visual view.

**Files to modify:**
- `apps/web/src/features/deckbuilder/DeckViewSelector.tsx` — Update from `gcg-` to `gf-` classes
- `apps/web/src/features/deckbuilder/DeckBuilderPanel.tsx` — Add view state, render different layouts per mode
- New file: `apps/web/src/features/deckbuilder/DeckVisualSpoiler.tsx`

#### Rec #9: Drag-and-Drop Card Reordering (Priority: Low | Complexity: High)

**Competitor pattern:** Archidekt supports custom categories where users can create named groups and drag cards between them.

**Current state:** No drag-and-drop capability exists. Deck entries are grouped automatically by card type in `DeckBuilderPanel.tsx`.

**Recommendation:** This is a lower-priority enhancement. If implemented, use `@dnd-kit/core` for accessible drag-and-drop. Allow users to create custom deck sections and drag cards between them. This requires extending the deck store with section metadata.

**Files to modify:**
- `apps/web/src/features/deckbuilder/DeckBuilderPanel.tsx` — Add drag handles and drop zones
- `apps/web/src/features/deckbuilder/deckStore.ts` — Add `sections` array and `reorderCard` action
- `package.json` — Add `@dnd-kit/core` and `@dnd-kit/sortable` dependencies

#### Rec #10: Keyboard Shortcuts (Priority: Medium | Complexity: Medium)

**Competitor pattern:** Moxfield offers keyboard shortcuts for common operations: search focus, quantity adjustment, navigation between cards.

**Current state:** `App.tsx` registers a single global keyboard handler for Space-to-inspect. No other shortcuts exist.

**Recommendation:** Expand the keyboard shortcut system:
- `/` or `Ctrl+K` — Focus search input
- `+` / `-` — Increment/decrement selected card quantity
- `1-3` — Switch between deck views (list/visual/stats)
- `Esc` — Close modals/inspections (partially exists)
- `?` — Show keyboard shortcut help overlay

**Files to modify:**
- `apps/web/src/App.tsx` — Expand global keyboard handler
- `apps/web/src/features/deckbuilder/ForgeWorkspace.tsx` — Add Forge-specific shortcuts
- New component: `apps/web/src/components/ui/KeyboardShortcutsHelp.tsx`

---

### 3.4 Feature Parity

#### Rec #11: Dark Mode (Priority: High | Complexity: Medium)

**Competitor pattern:** Moxfield uses dark mode as the default theme. Archidekt is light-only.

**Current state:** Gundam Forge's token system is fully prepared for theming. All visual properties are CSS custom properties in `tokens.css`. The `:root` selector sets `color-scheme: light` (line 194). All surface colors, text colors, borders, and shadows are tokenized — no hardcoded color values in components. This is the ideal foundation for dark mode.

**Recommendation:** Add a `[data-theme="dark"]` block in `tokens.css` that overrides the surface, text, border, and shadow tokens with dark values. Add a `theme` state and `toggleTheme` action to `uiStore.ts`. Persist the preference in localStorage. Add a theme toggle button to the header. Update `tailwind.config.ts` to use `darkMode: ['selector', '[data-theme="dark"]']`.

**Files to modify:**
- `apps/web/src/styles/tokens.css` — Add `[data-theme="dark"]` overrides for ~20 token values
- `apps/web/src/stores/uiStore.ts` — Add `theme`, `toggleTheme`, localStorage persistence
- `apps/web/src/components/layout/Header.tsx` — Add sun/moon toggle button
- `apps/web/tailwind.config.ts` — Add dark mode selector strategy

#### Rec #12: Multiple Export Formats (Priority: Medium | Complexity: Low)

**Competitor pattern:** Moxfield supports MTGO, Arena, text, and CSV exports with one-click clipboard copy. Archidekt supports multiple formats.

**Current state:** `DeckBuilderPanel.tsx` has a `buildDeckExport` function that generates a plain text deck list sorted by type/cost/name. The Import modal (`ImportDeckModal.tsx`) supports multiple input formats but export is text-only.

**Recommendation:** Add an "Export" dropdown/menu alongside the Import button in the Forge toolbar. Support three formats: plain text (existing), CSV (with columns: quantity, name, id, type, color, cost), and JSON (structured export for programmatic use). Add clipboard copy with a "Copied!" toast feedback.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ForgeWorkspace.tsx` — Add Export button/dropdown to toolbar
- `apps/web/src/features/deckbuilder/DeckBuilderPanel.tsx` — Extend `buildDeckExport` to support format parameter

#### Rec #13: Deck Sharing & Cloning (Priority: Medium | Complexity: Medium)

**Competitor pattern:** Both Moxfield and Archidekt support deck cloning (copy a public deck to your own account) and shareable deck links.

**Current state:** Public deck viewing exists (`PublicDeckViewPage.tsx`), and the backend has RLS policies for comments and role-based access (recent commits `69540d2`, `45afcc3`, `dc36851`). However, there is no "Clone this deck" button on public views, and no "Copy share link" function in the Forge.

**Recommendation:** Add a "Clone to My Decks" button on `PublicDeckViewPage` that copies all entries to the user's deck. Add a "Share" button in the Forge toolbar that generates a shareable URL (if the deck is saved to Supabase) or copies the deck list to clipboard (for unsaved decks).

**Files to modify:**
- `apps/web/src/features/decks/PublicDeckViewPage.tsx` — Add Clone button
- `apps/web/src/services/deckService.ts` — Add `cloneDeck(deckId)` function
- `apps/web/src/features/deckbuilder/ForgeWorkspace.tsx` — Add Share button to toolbar

#### Rec #14: Card Recommendations (Priority: Medium | Complexity: Medium)

**Competitor pattern:** EDHREC's core value is algorithmic card suggestions — synergy scores, most-played-with data, and trending picks based on commander/archetype selection.

**Current state:** `ModernCardCatalog.tsx` has two tabs: "Catalog" (all cards) and "Collection" (owned cards only). The `archetypes.ts` data file defines predefined archetypes with card associations. The `metaTierList.ts` file contains tier rankings. No suggestion engine connects this data to the deck builder.

**Recommendation:** Add a third tab in the catalog: "Suggestions." When the user's deck has cards in it, analyze the deck's color identity and archetype to filter and rank catalog cards by relevance. This does not require machine learning — simple heuristic filtering (same color, same archetype staples, popular pairings from the archetype data) would provide significant value. Surface this as a "Recommended for your deck" section.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ModernCardCatalog.tsx` — Add "Suggestions" tab
- `apps/web/src/features/deckbuilder/cardsStore.ts` — Add suggestion logic using deck colors + archetype data
- `apps/web/src/data/archetypes.ts` — Ensure archetype-card associations are comprehensive

---

### 3.5 Performance & Modern Aesthetics

#### Rec #15: Virtualize CardDatabasePage (Priority: Low | Complexity: Medium)

**Competitor pattern:** Moxfield renders large card grids without performance degradation, using virtualized rendering.

**Current state:** `ModernCardCatalog.tsx` uses `@tanstack/react-virtual` for its virtualized card grid — excellent performance. However, `CardDatabasePage.tsx` renders all filtered cards via a flat `.map()` without any virtualization. With a full card catalog, this creates unnecessary DOM nodes.

**Recommendation:** Apply the same TanStack Virtual pattern used in ModernCardCatalog to CardDatabasePage. Consider extracting a shared `VirtualCardGrid` component that both pages can use.

**Files to modify:**
- `apps/web/src/features/cards/CardDatabasePage.tsx` — Add virtualization
- `apps/web/src/features/deckbuilder/CardGrid.tsx` — Refactor into a reusable virtualized grid component

#### Rec #16: Transition Consistency Audit (Priority: Low | Complexity: Low)

**Competitor pattern:** Moxfield's smooth transitions on all interactive elements are frequently cited as a UX strength.

**Current state:** `motion.css` defines a comprehensive animation system: `gf-animate-fade-in`, `gf-animate-slide-up`, `gf-animate-scale-in`, `gf-animate-qty-pulse`, and transition utilities. However, many interactive state changes don't use these tokens. For example, collapsible sections in `DeckBuilderPanel.tsx` use inline `maxHeight` style for animation rather than GPU-accelerated transforms.

**Recommendation:** Audit all state-change animations across the application. Replace inline style animations with the existing motion token classes. Ensure every button hover, panel expand/collapse, and card add/remove uses the tokenized transition system for consistency.

**Files to modify:**
- `apps/web/src/styles/motion.css` — Add collapse/expand transition utilities
- `apps/web/src/styles/components.css` — Ensure `gf-transition` class is applied consistently
- `apps/web/src/features/deckbuilder/DeckBuilderPanel.tsx` — Replace inline `maxHeight` animation

#### Rec #17: Image Loading Polish (Priority: Low | Complexity: Low)

**Competitor pattern:** Moxfield uses high-quality card images with smooth lazy loading, creating a polished browsing experience.

**Current state:** `EnhancedCardPreview.tsx` applies a `fade-in` class when images load, providing a smooth appearance. However, card tiles in `ModernCardCatalog.tsx` and `CardDatabasePage.tsx` do not have this treatment — images pop in abruptly. The `preloadImages.ts` utility handles prefetching with deduplication, and `brokenImageStore.ts` tracks failed loads.

**Recommendation:** Apply the same fade-in-on-load pattern from `EnhancedCardPreview` to card tiles in the catalog and database grids. Add a subtle background shimmer placeholder (using the existing `SkeletonLoader.tsx` component) while images load.

**Files to modify:**
- `apps/web/src/features/deckbuilder/ModernCardCatalog.tsx` — Add fade-in class on image load event
- `apps/web/src/features/cards/CardDatabasePage.tsx` — Same treatment
- `apps/web/src/components/ui/SkeletonLoader.tsx` — Ensure it supports card-tile aspect ratio

---

### 3.6 Implementation Priority Matrix

| Tier | Recommendations | Rationale |
|---|---|---|
| **Tier 1** (High Impact, Low Effort) | #11 Dark mode, #8 Wire DeckViewSelector, #1 Inline stats, #3 Mobile bottom tabs, #4 Panel collapse toggles | These activate existing infrastructure or add small new components. Tokens, store actions, and the DeckViewSelector component already exist. |
| **Tier 2** (High Impact, Medium Effort) | #5 Search autocomplete, #7 Advanced filters, #2 Inline playtester, #12 Export formats, #6 Cost range slider | These enhance core workflows with new UI but build on existing data and components. |
| **Tier 3** (Medium Impact, Medium Effort) | #10 Keyboard shortcuts, #14 Card recommendations, #13 Deck sharing/cloning, #16 Transition audit | Quality-of-life improvements that deepen engagement and polish. |
| **Tier 4** (Lower Priority) | #9 Drag-and-drop, #15 Virtualize CardDatabase, #17 Image loading polish | Nice-to-have enhancements for advanced users and performance optimization. |

---

*Report generated from codebase analysis of Gundam Forge (commit `33d92b6`) and competitive analysis of Moxfield, Archidekt, and EDHREC as of February 2025.*
