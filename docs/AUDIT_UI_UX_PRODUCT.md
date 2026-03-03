# Gundam Forge — Master UI + UX + Product Audit

> **Date:** March 2026
> **Auditor Role:** Product Director / Senior UX Architect / Senior UI Designer / Principal Frontend Engineer
> **Codebase Branch:** `claude/gundam-forge-audit-loKGX`
> **Card Database Size:** 613 cards
> **Stack:** Next.js (App Router, SSR-first), Tailwind CSS (tokenized design system), localStorage persistence, Supabase (disabled in production), GitHub Pages deployment

---

## Executive Summary

Gundam Forge is a purpose-built Gundam Card Game (GCG) deck-building platform with a clear technical ambition: SSR-first, accessible, tokenized design system. The engineering foundation is solid. The design system is coherent. The card database is comprehensive at 613 cards with full images.

**However, the product has a critical gap between its UI's implied promise and its actual capabilities.** The platform presents itself as a fully-featured competitive TCG tool — with "Sign in," user profiles, cloud decks, and deck visibility controls — but nearly every trust-bearing feature is either non-functional, localStorage-only, or explicitly blocked with "Coming Soon" in production. This creates a severe mismatch between user expectation and delivered value.

The deck builder (Forge) is the strongest feature and is approaching production quality. The cards database is clean. The playtester exists and has structure. Everything else is incomplete at varying degrees.

**The platform is not ready for a competitive audience.** It is ready for an alpha audience with clear expectation-setting.

---

## Overall Production Readiness Score: **52 / 100**

| Dimension | Score |
|---|---|
| UI Visual Quality | 71/100 |
| Design System Consistency | 78/100 |
| Component Quality | 66/100 |
| UX Usability | 54/100 |
| Information Architecture | 48/100 |
| Feature Completeness | 38/100 |
| Accessibility | 62/100 |
| Performance Readiness | 58/100 |
| Mobile Responsiveness | 56/100 |
| Trust & Reliability | 31/100 |

---

## UI Design Audit Summary

### Visual Polish Score: 71 / 100

The dark theme is well-executed. The tokenized CSS variable system (`--surface`, `--surface-elevated`, `--surface-interactive`, `--accent`) creates a coherent depth hierarchy. Typography (`Rajdhani` for display, `IBM Plex Sans` for body, `JetBrains Mono` for mono) is a strong, intentional stack that communicates the "command interface" identity.

**What works:**
- Radial gradient + grid-line body background creates a distinct Gundam-appropriate aesthetic
- Cobalt blue accent system is consistent and purposeful
- The `GF` logo mark with glow shadow is polished
- Badge/chip components are clean and readable
- Card imagery is high-resolution and loads without visible artifacts

**What fails:**
- `bg-steel-200` on placement #2 rows in Events is a light background on a dark-theme page — contrast failure
- Color dots/pips for card colors (Blue, Red, Green, etc.) are absent everywhere. The game is color-coded but the UI shows text labels only
- The footer is dev-speak: "SSR first • Accessible • Tokenized" — meaningless to a player
- "Platform Features" card on the home page is a list of `<p>` tags in a box — no hierarchy, no visual differentiation
- No hero image, artwork backdrop, or visual identity anchored to the Gundam IP

### Design System Consistency Score: 78 / 100

The component library is well-structured with `Button`, `Badge`, `Card`, `Dropdown`, `Container`, `PageHeader`. Tailwind utility usage is consistent. CSS token naming is logical.

**Inconsistencies found:**
- `CardSearchPanel.tsx` uses raw Tailwind color classes (`bg-red-600/20`, `bg-blue-600/20`) for keyword badges instead of the design system tokens — breaks the token contract
- `DeckBuilderViews.tsx` has `(GridView as any).builderControls` — a prototype-level hack using static property mutation
- `CardListTable` thead uses `text-white` directly; rest of the system uses `text-foreground`
- The forge workbench uses `bg-cobalt-600` for add buttons; the cards page uses `bg-accent`. These are the same color semantically but different token paths
- Two separate `CardViewerModal` components exist: one in `/forge/CardViewerModal.tsx` and one in `/components/deck/CardViewerModal.tsx` — structural duplication

### Component Quality Score: 66 / 100

**Strong components:** `CardDetailModal`, `CardSearchPanel`, `ValidationBar`, `AppShell`, filter drawer on cards page, active chip system.

**Weak components:**
- `GridView` in `DeckBuilderViews.tsx`: Uses `(GridView as any).builderControls` — a static property hack that is unpredictable and untestable. Must be rewritten to accept props normally
- `DeckPreviewCard`: No fallback UI when `heroUrl` fails to load
- `TrendingDecksClient`: The only deck sorting exposed is Trending/Win Rate/Most Viewed with no search
- `DecksClient`: Shows decks in a 2-column card grid with no images, no hero, no preview — lowest-information density deck list on the entire platform

---

## Page-by-Page Breakdown

---

### 1. Home Page (`/`)

**UI Score: 7/10 | UX Score: 6/10**

**What works:**
- Hero is clear: "Build. Test. Win." is a strong value proposition
- Meta Snapshot card is genuinely useful for competitive players
- Trending decks section provides social proof
- Two CTAs (Create Deck, Browse Cards) are well-placed and sized

**What fails:**
- The Meta Snapshot data is static (updated only at build time). Users who return frequently will see stale numbers with no indication that data hasn't changed since their last visit
- "Data updated with each build deployment" is developer honesty but not user-appropriate copy — use a date stamp instead
- "Platform Features" section lists three features as unstyled text inside boxes. No icons, no visual rhythm. Feels like filler
- The home page does not surface the user's own decks or any personalized content — zero returning-user value
- "Popular Archetypes" uses arbitrary win rate data sourced from a small static event set — this is misleading to competitive players
- No search bar on the home page — first action for most competitive TCG users is to search for a card

**New user experience:** They land, see "Build. Test. Win.", click "Create Deck" → they're asked to choose colors and name before they've ever seen a card. Zero onboarding to the GCG itself.

**Competitive player experience:** Good — they immediately recognize the meta snapshot, check trending archetypes, and proceed to Forge.

**Mobile:** The 2-column hero grid collapses correctly. Meta Snapshot stat grid is fine. Trending decks work.

**Top fixes:**
1. Replace "Platform Features" boxes with icon cards with brief descriptions
2. Add `Last updated: [date]` to Meta Snapshot instead of the deployment note
3. Add a search bar or "Quick find card" CTA in the hero
4. Add a "Your Decks" section for returning users (localStorage can power this)

---

### 2. Cards Database (`/cards`)

**UI Score: 7/10 | UX Score: 7/10**

**What works:**
- Sticky toolbar with live search (150ms debounce), sort control, and view toggle is excellent
- Active filter chips with individual clear are Moxfield-level UX
- Mobile filter drawer with focus trap and Escape key support is well-implemented
- URL-synced filters for shareability is production-quality
- Grid view at 6 columns on XL screens is dense but usable
- Empty state with dashed border communicates clearly

**What fails:**
- **"Active Deck" bar**: When an active deck is set and the user clicks "Change", it just clears the deck ID with no way to select a different deck. The user is left with no active deck and no prompt to pick one — dead end
- **Keyword filter** in the drawer uses a select dropdown with limited options (`Rush`, `Breach`, `Burst`, etc.) while the forge panel has more granular keyword chips. Inconsistency between the two entry points to the same card pool
- **No cost/power range filter** — competitive players filter by cost constantly. This is a critical missing filter
- **No "add to deck" button on grid tiles** — tiles only open the detail modal. Users must open the modal and then find the add button, adding a step
- **CardPreviewTile** renders qty=0 from the cards page, meaning the tile might show "0x" text where it shouldn't
- **Pagination** uses "Load more" (appended, not virtualized). At 613 cards × 60 per page, this means page 2 renders 120 DOM nodes. Not virtualized
- **List view** lacks card artwork — it's purely text, which makes evaluating cards harder for casual players
- **No "view in Forge" action** — there's no way to jump directly from a card page to the Forge with that card pre-added

**Mobile:**
- Filter drawer slides up correctly
- Grid collapses to 2 columns — fine for images
- Active deck bar stacks below the main toolbar correctly

**Top fixes:**
1. Fix the "Change" button on the active deck bar to open a deck picker modal
2. Add cost filter (range or discrete cost buttons 0-8+)
3. Add an inline "Add to active deck" button on grid tiles without opening modal
4. Virtualize card grid using react-window (already installed)
5. Unify keyword filter options between cards page and forge panel

---

### 3. Explore Page (`/explore`)

**UI Score: 6/10 | UX Score: 5/10**

**What works:**
- Three sort modes (Trending, Win Rate, Most Viewed) are appropriate
- `DeckPreviewCard` components show hero image, card count, archetype badge, colors

**What fails:**
- **No search or text filter** — with 50 decks, users cannot search by deck name, archetype, or color. A text input is essential
- **No filter by color** — the most common way competitive players browse decks is by color
- **No filter by archetype** — no way to find all Aggro decks, for example
- **Deck cards use `deck.entries[0]?.cardId` as the hero image** — this is the first card in the deck array, not necessarily the most visually distinctive. Many decks will share the same hero card (e.g., Gundam GD01-001)
- **`onMenu={() => {}}` is a no-op** — the DeckPreviewCard accepts an `onMenu` prop that presumably opens a context menu, but it's wired to an empty function. There's no copy link, no share, no clone deck
- **No pagination or "load more"** — all 50 decks render at once
- **No empty state with call to action for zero results** (the code has one, but it only shows if zero decks total — not if a user filtered to zero)
- **"Create Deck" CTA is in the top right** — too far from the empty state

**Mobile:**
- Grid collapses from 3 to 1 column — acceptable
- No overflow issues

**Top fixes:**
1. Add text search + color/archetype filters
2. Fix the `onMenu` handler with a real popover (clone, share link)
3. Use the deck's most-copied or highest-cost unit as hero art instead of `entries[0]`
4. Add pagination

---

### 4. Decks Library (`/decks`)

**UI Score: 5/10 | UX Score: 4/10**

**What works:**
- Empty state with "Create Deck" CTA is clear
- Loading indicator is present

**What fails:**
- **This page is nearly identical to Explore but worse** — same deck data, no images, no hero, just a 2-column card grid with deck name, archetype badge, description, colors, and "Open deck" button
- **Zero visual differentiation from Explore** — why do both pages exist? The IA is broken here
- **No user's own decks vs. community decks distinction** — until cloud auth is implemented, this page shows the same static data as Explore
- **"Open deck" → deck detail page** has no edit button, no "Open in Forge" shortcut
- **Page title is just "Decks"** — no eyebrow, no descriptive subtitle
- **Decks show "by [owner]" and views/likes** which are static metadata — misleading since there's no real user system

**Top fixes:**
1. Merge Decks and Explore into a single well-designed catalog page
2. OR: Make Decks show only the current user's localStorage decks and make Explore the community catalog
3. Add "Open in Forge" (edit) button to each deck card

---

### 5. Create Deck Wizard (`/decks/new`)

**UI Score: 7/10 | UX Score: 6/10**

**What works:**
- Two-panel layout (form left, preview right) is a solid UX pattern
- Deck Intent Builder (colors, clans, mechanics packages) is the most sophisticated onboarding in the app
- Paste import support is immediately accessible
- Mobile preview toggle ("Preview deck →") is thoughtful
- Error state for color validation is clear

**What fails:**
- **Forced color selection before the Forge** — new users don't know which colors to pick before seeing any cards. This is a barrier. Colors should be optional at creation time
- **1–2 non-Colorless colors are required** — enforced at submit time, not inline. The user submits the form and sees an error; they don't understand why until they read "Please select 1–2 non-Colorless colors"
- **No inline color count validation** — the error appears at submit, not as the user selects colors
- **Description field is buried after the color/intent builder** — most users will skip it because they don't see it
- **"Visibility" selector** (Private/Unlisted/Public) is meaningless without user accounts. Showing it creates a false impression of cloud functionality
- **The paste import field is optional** but positioned prominently with a 7-row textarea — this biases the form toward importers
- **"Browse existing decks" link** at the bottom goes to `/decks` not `/explore` — inconsistent

**Mobile:**
- Form is scrollable and functional
- Preview toggle works
- Import textarea at 7 rows is too tall on mobile, causing excessive scroll

**Top fixes:**
1. Make colors optional at creation (move validation to the Forge's save flow)
2. Add inline validation as colors are selected (e.g., "Select 1 more color")
3. Remove or grey-out Visibility until auth is implemented — or explain it clearly
4. Reduce import textarea to 4 rows on mobile

---

### 6. Forge — Deck Builder (`/forge`)

**UI Score: 7/10 | UX Score: 7/10**

This is the strongest page in the application. The split-pane layout (search panel left, deck view right, validation bar, toolbar) is the right architecture.

**What works:**
- 4 view modes (Stacks, Grid, Text, Table) — genuinely useful for different player styles
- Validation bar with main deck (X/50) and resource deck (X/10) progress bars is excellent
- Issues bottom sheet on validation errors is clean and non-disruptive
- Synergy scoring system (★ badges) is unique and compelling
- Group mode (By Clan, By Type, None) in the search panel is a sophisticated feature
- Active filter summary with inline clear tags is Moxfield-tier UX
- Card hover tooltip (portal-rendered, positioned to the right of the panel) works well on desktop
- Import parser handles 6+ format variants with warnings for unmatched cards
- Deck intent editor within the search panel is deep but not overwhelming
- EX card toggle with clear on/off state

**What fails:**

**Critical:**
- **`(GridView as any).builderControls`** in `DeckBuilderViews.tsx` — the Grid view add/remove buttons reference `(GridView as any).builderControls` which is a static property set externally. This is a prototype hack. The buttons will silently fail if the property isn't set before render. The component needs to accept `onAdd`/`onRemove` as regular props
- **Card hover tooltip breaks on mobile** — `CardHoverTooltip` calculates `anchor.right + CARD_W > window.innerWidth` for positioning, but on mobile the `aside` fills the screen and there's no "right of panel" space. The tooltip renders on top of or behind the card panel
- **No zone-separation in the deck view** — main deck cards and resource cards are shown together in all views without visual zone dividers. GCG has strict zone rules (main deck, resource deck, EX base). Players building decks need to see which zone each card is in

**High:**
- **The "Save" mechanism is unclear** — the deck auto-saves to localStorage, but there's no explicit confirmation of when saving occurred. Users who are used to "Save" buttons will hit export and assume that's how to save
- **Export downloads a `.txt` file** — the format isn't labeled. Users don't know if this is compatible with other tools
- **No "Add to deck" animation or haptic feedback** — cards are added silently. A subtle badge increment or card count flash would confirm the action
- **Search panel is very tall on load** — with Keywords, Triggers, and Filters all expanded/visible simultaneously, the search results are pushed far below the fold. Users must scroll the search panel significantly before seeing cards on small laptops
- **`rawQuery` and `query` are separate state** — the 150ms debounce separation is correct, but the UI shows `rawQuery` value in the input while search runs on `query`. This is correct behavior but the gap could cause confusion if someone types quickly and sees a stale result count briefly

**Medium:**
- **No "Remove all" or "Clear deck" action** in the toolbar
- **No way to set a card as the deck's "commander" or "key card"** for Explore thumbnail purposes
- **Table view's column `"Set"` shows internal set codes** (e.g., "ST01") not human-readable set names
- **No cost curve visualization** (mana curve chart) — standard in Moxfield, Archidekt, etc.

**What is production ready:**
- Search + filter system in the search panel
- Synergy scoring and group modes
- Validation bar and issues sheet
- Import parsing
- View mode system (Stacks, Text, Table)
- Debounced search

**What is prototype-level:**
- GridView builder controls (`(GridView as any).builderControls`)
- Card hover tooltip on mobile
- Zone separation display
- Save confirmation feedback

**Definition of Done — Deck Builder:**
- [ ] GridView uses explicit `onAdd`/`onRemove` props, not static property mutation
- [ ] Zone separation (main/resource/EX) visible in all view modes
- [ ] Save confirmation toast/indicator on localStorage write
- [ ] Add-to-deck animation (count badge flash or card row highlight)
- [ ] Mobile: hover tooltip disabled or replaced with tap-to-expand
- [ ] Cost curve widget (even a simple bar chart)
- [ ] Search panel collapsed by default below Keywords section on mobile

---

### 7. Deck Detail View (`/decks/[id]`)

**UI Score: 6/10 | UX Score: 5/10**

**What works:**
- Image grid, stacks, and text list views are functional
- DeckHeader shows name, colors, archetype, owner
- Export as text is present

**What fails:**
- **No "Edit in Forge" button** — the deck detail view has no path back to the Forge for editing. Users must navigate to `/forge` manually
- **The `features.collection` and `features.deckEdit` flags are hardcoded to `false`** in `DeckViewPage.tsx` — edit functionality is structurally disabled
- **No "Playtest this deck" button** is prominently shown. Playtest is only accessible at `/decks/[id]/playtest`, which users must navigate to manually
- **CardViewerModal opens when clicking cards** but provides no "Add to active deck" option from this context
- **Deck detail page for user-created (localStorage) decks vs. catalog decks** has no visual differentiation

**Top fixes:**
1. Add "Edit in Forge" and "Playtest" action buttons prominently in the deck header
2. Enable the `deckEdit` feature flag for localStorage decks
3. Show a contextual "This is your deck" indicator for localStorage decks

---

### 8. Events Page (`/events`)

**UI Score: 7/10 | UX Score: 7/10**

**What works:**
- Clean layout with event cards and an archetype meta sidebar
- Win rate color coding (green/amber/red) is intuitive and consistent
- Placement tones (gold for 1st, silver for 2nd, bronze for 3rd) are correct
- Location + player count meta is present

**What fails:**
- **Placement #2 uses `bg-steel-200`** — this is a light background (light grey in dark theme) that looks like a bug. It should use a dark-theme-appropriate silver tone
- **"Deck" link on each placement row** links to `/decks/[placement.deckId]`. If that deck doesn't exist in the catalog, this is a broken link
- **No search or filter** — as the event list grows, there's no way to filter by format, archetype, or location
- **Archetype Meta sidebar cuts off at 5 archetypes** — arbitrary limit with no "Show all" option
- **No clickable archetype** — clicking an archetype in the sidebar should take users to an Explore page filtered by that archetype

**Mobile:**
- Event cards stack correctly
- Sidebar moves below event list
- Win record badges wrap gracefully

**Top fixes:**
1. Fix `bg-steel-200` on 2nd place — use `border-steel-400/50 bg-steel-600/10` instead
2. Add a guard for broken deck links (404 prevention)
3. Link archetypes in sidebar to filtered Explore view

---

### 9. Login / Register (`/auth/login`, `/auth/register`)

**UI Score: 3/10 | UX Score: 2/10**

**Critical issue: These pages in production show a "Coming Soon" message.** But the nav prominently displays "Sign in" on every page, implying auth is available.

**Specific problems:**
- **"Sign in" in the header leads to a dead end** — this is a trust-destroying UX pattern. Users who click "Sign in" expecting to create an account see a page that tells them accounts don't exist yet. This makes the entire platform feel abandoned or broken
- **No indication from the nav that auth is disabled** — "Sign in" should be either removed from production nav or replaced with "Accounts coming soon" tooltip
- **"Accounts & Profiles are in development"** with no ETA or waitlist option — missed opportunity to capture interested users
- **No guest-to-account upgrade path messaging** — users aren't told "build decks now as a guest, sync when accounts launch"

**Top fixes:**
1. Remove "Sign in" from the production nav header entirely, or replace with a tooltip "Cloud accounts coming soon"
2. Add an email waitlist field to the Coming Soon page
3. Show a banner on the deck builder: "Your decks are saved locally. Cloud sync coming soon."

---

### 10. Profile (`/profile`)

Same "Coming Soon" block as Auth. Accessible via direct URL but not linked from nav (nav items don't include Profile).

**Issue:** The profile URL is reachable by users who type it. Shows the same "Coming Soon" message. The `Link` back to home is the only action.

---

### 11. Playtester (`/decks/[id]/playtest`)

**UI Score: 6/10 | UX Score: 5/10 | Rules Readiness: 60%**

**What works:**
- Phase 1–4 implementation claims are ambitious and partially delivered
- Zone structure (Shield, Base, Battle, Resource, Deck, Trash, Hand Tray) maps to the official playmat
- GameStartFlow with coin flip is a professional touch
- Keyboard shortcuts legend is present
- Sound effects hooks exist (`useSoundEffects`)
- Undo/redo architecture is present
- AI autoplayer via `Autoplayer` class exists

**What fails:**

**Critical:**
- **Resource deck uses hardcoded token IDs** (`TOKEN-RESOURCE-001`, `EX-RESOURCE-TOKEN`) instead of the player's actual resource deck — this means players can't test real resource strategies
- **The resource deck in GCG is separately constructed** (10 cards) but the deck builder has no dedicated resource deck zone or builder. The playtester fakes it with generic tokens
- **No mulligan hand selection UI** — the `GameStartFlow` has a 'coinFlip' phase but the actual card-by-card mulligan decision (keep/replace up to 4 cards) is unclear from the code
- **AI autoplayer decisions are not visible to the user** — there's no indication of what the AI "thought" or why it took an action, making it impossible to learn from

**High:**
- **Drag-and-drop** is present via `@dnd-kit` but card zone interactions (play from hand to battle area, rest a unit, pair unit+pilot) are not clearly discoverable — there are no affordances showing where cards can be dropped
- **Turn phase indicator** (`PhaseIndicator`) exists but it's unclear from the component whether phases advance automatically or manually
- **No "what just happened" overlay** — after the AI acts, there's no animation or description of what occurred

**Medium:**
- **Mobile playtester** — the battlefield grid attempts responsive layout (desktop/tablet/mobile) but hand tray + battlefield zones on a phone portrait screen is extremely cramped. Complex TCGs are not playable on phone portrait
- **No link count display** — units in GCG link with pilots; the battlefield should show link state visually
- **No damage counter UI** — base health tracking is implemented in state but the visual representation must be verified against the official base card HP values

**Playtester Readiness Verdict:**
The playtester has the right structural skeleton but is not ready for real games. The resource deck gap alone makes it non-functional for testing actual strategies. This must be labeled clearly in the UI as "Alpha / Experimental" to avoid destroying user trust.

---

## Information Architecture Audit

### Current IA Problems

**Nav items (7 links):**
`Home | + Create Deck | Forge | Explore | Cards | Events | Decks`

This navigation has multiple fundamental IA failures:

1. **"+ Create Deck" and "Forge" are redundant.** "Create Deck" goes to `/decks/new` (the setup wizard). "Forge" goes directly to `/forge` (the builder with no deck). These should be one flow, not two nav items
2. **"Explore" and "Decks" serve the same purpose** from a user perspective. Both show deck lists. The distinction (community vs. library) is invisible to users. This causes decision paralysis
3. **Missing: Settings, Help, Glossary** — no way to learn GCG terminology, no settings for theme toggle (it's in the header but hidden behind a small icon), no keyboard shortcuts reference (exists in playtester but nowhere else)
4. **"Sign in" is a broken nav item** in production (leads to Coming Soon)
5. **No persistent "My Decks" count or indicator** — users who have built decks in localStorage have no quick way to see how many they have

### Recommended IA Restructure

```
Primary Nav (5 items max):
Home | Cards | Forge | Community | Events

Sub-nav under Forge: My Decks | Create | Import
Sub-nav under Community: Top Decks | Archetypes | Players
```

This matches the mental model:
- Players → Browse cards
- Players → Build (Forge) → includes their saved decks
- Players → Discover meta (Community/Explore)
- Players → Follow competitive scene (Events)

---

## Accessibility Audit

### Passes ✓
- Skip navigation link (`Skip to main content`) is present and functional
- Mobile filter drawer has a proper focus trap with Tab cycling
- `aria-live="polite"` on search result counts and loading states
- `aria-label` on icon-only buttons
- `aria-current="page"` on active nav items
- `aria-pressed` on toggle buttons
- `role="dialog"` + `aria-modal="true"` on filter/issues modals
- `prefers-reduced-motion` CSS media query implemented

### Fails ✗

**Critical:**
- **Color coding without text labels** — deck colors (Blue, Red, Green, etc.) rely solely on color text labels. There are no color swatches or icons, which is actually fine — but if swatches were added later without text, they would fail for color-blind users
- **Card images lack descriptive alt text** — `alt={card.name}` is used everywhere. This is technically valid but gives no card ability information to screen readers
- **`placement.deckId` "Deck" button in Events has no aria-label** — `<Button asChild size="sm" variant="secondary"><Link href={...}>Deck</Link></Button>` — "Deck" provides no context for which deck

**High:**
- **Events page placement rows have no heading structure** — the list of placements has no `<h3>` or equivalent for each event; screen readers see a flat list
- **Forge search panel groups (Keywords, Triggers, Filters)** use `<span>` for group labels instead of `<legend>` within a `<fieldset>` — screen reader semantics are lost
- **Card modal focus does not return to trigger** — when closing the `CardDetailModal`, focus should return to the card tile that opened it. This is not implemented

**Medium:**
- **Touch targets:** Many inline buttons (the × on filter chips, the + in list view, synergy badges) are 20px × 20px — below the 44px minimum recommended by WCAG 2.1
- **Theme toggle icon** has no visible label; relies entirely on `aria-label`
- **Forge validation issues bottom sheet** has no `aria-labelledby` referencing its title (though the title `id="issues-sheet-title"` exists)

### Critical A11y Fixes Required Before Launch
1. Touch target sizing for all inline buttons → minimum 44×44px
2. Return focus to trigger after modal close
3. Add `<fieldset>/<legend>` structure to keyword/trigger filter groups
4. Add context to Events page "Deck" buttons: `aria-label="View [player]'s deck"`

---

## Performance Audit

### Top 10 Performance Issues (Ranked by ROI)

1. **No virtualization on the cards grid** — 613 cards, 60 per page load = 60 DOM nodes initially, but "Load more" appends without removing previous nodes. At full load this is 613 image DOM nodes. `react-window` is already installed. **ROI: Critical**

2. **Card images are not WebP/AVIF** — card images likely serve as PNG/JPG. GCG card images at full quality are substantial. No next/image optimization layer since this is deployed to GitHub Pages (not Vercel). **ROI: High**

3. **The card database (613 cards) is bundled into the JS** via static imports in `@/lib/data/cards`. At 613 cards × ~800 bytes of JSON = ~490KB of card data in the JS bundle. This inflates TTI. **ROI: High**

4. **`useMemo` on filter operations runs on every render cycle** — the `filtered` memo in `CardSearchPanel.tsx` has 9 dependencies including `mechanicsPackages` (array). Array identity changes on every render even if contents are identical. Should use `JSON.stringify` comparison or `useDeepCompareMemo`. **ROI: Medium-High**

5. **`allCards` is imported at module level in multiple components** — `CardSearchPanel`, `forge-workbench`, `CardsClient` all import the full 613-card array. No code splitting. **ROI: Medium**

6. **Portal-based `CardHoverTooltip` renders on every `mousemove`** — state update is triggered on every `onMouseEnter`/`onMouseLeave` which causes re-renders. Should debounce or use CSS `:hover` + CSS transforms instead. **ROI: Medium**

7. **`DeckBuilderViews.tsx` GridView is mounted/unmounted on view change** — switching between view modes in the Forge unmounts the entire GridView and remounts it (or whichever view). All card image loads are discarded. Should use CSS `display:none` toggling instead of conditional rendering. **ROI: Medium**

8. **`new Map()` card lookup constructed on every sort change** — `const cardLookup = useMemo(...)` in `CardsClient.tsx` correctly memoizes, but `useMemo(() => new Map(sorted.map(...)), [sorted])` recalculates whenever `sorted` changes. Sort operations are O(n log n) × 613. **ROI: Low-Medium**

9. **`analyzeDeckIntent` runs in the search panel's `useMemo`** — this analysis (detecting deck patterns from all cards in deck) runs whenever `currentDeckCards` changes. Deck changes happen on every card add/remove. Should be throttled or moved to a web worker. **ROI: Medium**

10. **No caching layer for card data** — the API routes (`/api/cards`, `/api/decks`) exist but since this is a static export, they're essentially unused. Cards are loaded from the static JS bundle every time. A service worker cache for card images would dramatically improve repeat visit performance. **ROI: Low**

---

## Mobile & Responsiveness Audit

### Breakpoint Strategy

The app uses Tailwind's default breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`. This is appropriate.

### Phone Portrait (375px)

| Page | Status | Issue |
|---|---|---|
| Home | ✓ Pass | Hero collapses correctly |
| Cards | ⚠ Partial | Filter drawer works; grid is 2-col (cards too small) |
| Explore | ✓ Pass | 1-col deck grid is fine |
| Forge | ✗ Fail | Two-panel layout loses search panel on mobile |
| Deck New | ⚠ Partial | Form works; import textarea too tall |
| Events | ✓ Pass | Cards stack vertically |
| Playtester | ✗ Fail | Battlefield is unplayable on phone portrait |

### Forge on Mobile — Critical Issues

The Forge uses a desktop-first two-panel layout. On mobile:
- The search panel is hidden by default (toggled via a mobile toolbar button)
- The deck view fills the screen
- Switching between search mode and deck view is done via a compact mobile toolbar
- **This is functional but the UX is two separate contexts** — users lose orientation when switching between search and deck view because they can't see both simultaneously
- **The group mode in the search panel (By Clan, By Type)** renders full clan groups with 2-column card grids. This is extremely tall and requires significant scrolling inside the search panel on mobile

### Forge Responsive Recommendation

- Phone: **Bottom drawer for search panel** — a persistent bottom bar with card count and a "Search" button. Tapping opens a full-screen bottom sheet for the search panel. Deck view is always visible behind it
- Tablet (768px): **Current behavior** (narrow side panel) is acceptable
- Desktop (1024px+): Current split panel is ideal

### Phone Landscape

The forge workbench on phone landscape (667px × 375px) shows both panels but with extremely compressed heights. The search results panel's `maxHeight: calc(100vh - 320px)` produces a near-zero or negative value at this viewport height, meaning card results are hidden.

### Overflow Issues Found

1. `forge-workbench` uses inline `style={{ height: '100%' }}` on the aside — on iOS Safari, `100%` height on a flex child can overflow the viewport
2. `CardListTable` has `overflow-x: auto` on the wrapper but the table can still cause horizontal scroll on very narrow screens because column widths aren't constrained
3. The `StacksView` uses `overflow-x: auto` with horizontal scrolling — on mobile, this creates competing scroll contexts (vertical page scroll + horizontal stack scroll)

---

## Architecture & Technical Risk Review

### High Risk

1. **localStorage-only persistence without migration strategy** — User decks stored in `localStorage` with keys like `gundam-forge.deck.[id]` have no version or schema migration. If the data shape changes in a future release, existing decks may fail to load with no graceful error

2. **Static data bundled in JS** — The 613-card database, deck catalog, and event data are all imported as static JS modules. Adding cards requires a new deployment. The `sync-cards`, `sync-decks` scripts exist but the workflow requires a developer to run them manually and redeploy

3. **No error boundary on most pages** — The playtester has an `<ErrorBoundary>` but the Forge, Cards, and Explore pages have no error boundaries. An exception in the card filter memo or deck storage read will crash the entire page to a blank screen

4. **`(GridView as any).builderControls` static property hack** — This is a production bug waiting to happen. The `GridView` component in `DeckBuilderViews.tsx` checks `(GridView as any).builderControls` for add/remove callbacks. If the Forge parent hasn't set this static property before GridView mounts, buttons silently do nothing. This is not testable, not typed, and architecturally incorrect

5. **GitHub Pages deployment means no API routes** — The Next.js API routes (`/api/cards`, `/api/decks`) are built into the static export but function as server-side routes. Since GitHub Pages serves only static files, these routes are non-functional in production. Any feature that depends on API calls will silently fail

### Medium Risk

6. **`planDeckList` MAX_QTY = 50** — The parser clamps quantities to 50 but GCG allows max 4 copies per card. The parser doesn't validate per-card limits; it just clamps the raw quantity. Pasting "400 Gundam" results in "50 Gundam" not an error

7. **Duplicate card/modal components** — Two `CardViewerModal` components exist (`/forge/CardViewerModal.tsx` and `/components/deck/CardViewerModal.tsx`). Same for card detail modals. This creates maintenance risk where a bug fix in one isn't applied to the other

8. **`useDecksQuery` and `useCardsQuery`** appear to wrap TanStack Query but since the API routes don't work on GitHub Pages, they fall back to `initialData`. This means the query layer provides no actual benefit in production — it's dead code overhead

---

## Retention & Product Psychology

### Current Loop Analysis

The app currently has **no retention loop**. There is:
- No user identity (no accounts)
- No social proof beyond static deck views/likes numbers
- No achievement or progression system
- No daily/weekly update that would cause a user to return
- No notifications

### Concrete Retention Features for Beta (No Overbuilding)

1. **"My Decks" dashboard on home page** (localStorage-powered, no auth needed) — show the user's own deck count, most recently edited deck, and one CTA. This alone creates a reason to return

2. **Meta Snapshot update date** — Show "Last updated: 3 days ago" prominently. If the data is fresh, users feel the platform is active. If it's stale, they know why they're not seeing new decks

3. **Deck change log** — Show "Last modified: 2 hours ago" on each deck card. Users lose track of which decks they're working on

4. **"Share deck link" feature** — The URL `/decks/[id]` already exists for catalog decks. For localStorage decks, generate a shareable URL with deck data encoded as a URL parameter (or Base64 export). Sharable links drive organic traffic

5. **Card of the day / Spotlight** — A featured card on the home page that links to its detailed view and shows which decks use it. No backend needed — just rotate through the card list by date

---

## High Priority Fix List (0–2 Weeks)

> These are blocking issues that actively harm user trust or break core functionality.

1. **Remove or disable "Sign in" button from production nav** — replace with a non-clickable "Accounts coming soon" label or tooltip. Current behavior destroys trust
2. **Remove the "Visibility" selector from the Create Deck form** in production — it's non-functional and implies cloud storage that doesn't exist
3. **Fix `(GridView as any).builderControls`** — refactor to accept `onAdd`/`onRemove` as props properly
4. **Fix `bg-steel-200` on Events page 2nd place row** — contrast bug in dark theme
5. **Fix "Change" button on Active Deck bar in `/cards`** — clicking it should open a deck picker, not just clear the state
6. **Add Error Boundary components to Forge, Cards, Explore pages**
7. **Add "Edit in Forge" and "Playtest" buttons to Deck Detail page header**
8. **Add `aria-label` context to Events "Deck" buttons** — `aria-label="View [player]'s [deckName]"`
9. **Fix mobile Forge search panel height calculation** — `maxHeight: calc(100vh - 320px)` produces near-zero at 375px height on landscape; clamp to minimum 200px
10. **Add localStorage save confirmation toast** — users need feedback that their deck was saved

---

## Medium Priority Enhancements (2–4 Weeks)

1. **Merge "Explore" and "Decks" nav items** into a single well-structured deck catalog page with tabs: "Community" and "My Decks"
2. **Virtualize the cards grid** using react-window (already installed) — critical for performance at 613+ cards
3. **Add cost curve visualization** to the Forge — a simple horizontal bar chart (bars proportional to card count at each cost value)
4. **Add zone-separation view** in the Forge — visually distinguish main deck cards from resource cards and EX cards with section headers in all view modes
5. **Add cost/power range filter** to the Cards page
6. **Add inline "Quick Add" button on card grid tiles** in the Cards page without requiring modal open
7. **Unify keyword filter options** between Cards page and Forge search panel
8. **Fix resource deck in playtester** — the playtester must use the actual resource cards from the deck builder, not hardcoded token IDs
9. **Add "Share deck" feature** using Base64-encoded URL params for localStorage decks
10. **Add "My Decks" section to home page** using localStorage data
11. **Restructure nav** to max 5 items: `Home | Cards | Forge | Community | Events`
12. **Add hero card selection** to the Create Deck form — let users pick which card appears as their deck's thumbnail
13. **Add cost filter to Cards page** — discrete buttons (0, 1, 2, 3, 4, 5, 6, 7, 8+) or a range slider

---

## Long-Term Strategic Improvements (1–3 Months)

1. **Cloud persistence via Supabase** — the Supabase schema appears to be designed; the auth flows exist in dev. Enabling this is the single highest-impact feature for retention. Users need a reason to come back, and that reason is their saved decks being available on any device

2. **Real resource deck builder** — GCG's resource deck is a separate 10-card construct. The Forge needs a dedicated resource zone with its own card browser filtered to Resource and EX Resource type cards

3. **Card rulings and errata layer** — competitive players need access to official rulings. A simple rulings panel within the card detail modal would differentiate this platform from basic card databases

4. **Deck comparison tool** — "Compare with another deck" to show overlap, curve differences, and missing cards

5. **Match tracker / win-loss logger** — simple localStorage-based session tracker showing win/loss rate with a given deck. No backend needed. Drives daily engagement

6. **Playtester full rules implementation** — the current playtester skeleton needs: link mechanics, burst trigger resolution, resource phase automation, opponent hand visibility controls, and a game-end condition that actually shows a winner

7. **Progressive Web App (PWA)** — add a service worker + manifest. PWA install + offline card database access would make this the most capable offline GCG tool available. Given GitHub Pages hosting, this is architecturally appropriate

8. **Community deck submissions** — a simple GitHub issue-based pipeline (or Supabase insert) for players to submit their event-winning decks would grow the catalog organically

---

## 30-Day Stabilization Plan

**Goal: Make the platform trustworthy and non-embarrassing for public sharing**

| Week | Focus |
|---|---|
| Week 1 | Remove broken nav items ("Sign in", "Profile" if linked). Fix trust-destroying UI bugs (steel-200 contrast, GridView hack, error boundaries). Add toast feedback |
| Week 2 | Merge Explore/Decks pages. Fix Active Deck "Change" button. Add "Edit in Forge" to deck detail. Virtualize cards grid |
| Week 3 | Add cost filter to cards. Add zone separation in Forge. Add "My Decks" to home page. Add save confirmation |
| Week 4 | Fix mobile Forge search panel height. Add cost curve. Label playtester as Alpha. Add "Share deck" URL feature |

---

## 60-Day Growth Plan

**Goal: Give competitive players a reason to use this daily**

| Week | Focus |
|---|---|
| Week 5–6 | Enable cloud persistence (Supabase auth + deck sync). This is the single feature that changes the platform from a toy to a tool |
| Week 7 | Add resource deck builder zone. Fix playtester resource deck loading |
| Week 8 | Add match tracker (localStorage). Add deck change log. Add card spotlight on home page |

---

## Final Verdict

Gundam Forge has an excellent engineering foundation and a clearly ambitious vision. The design system is coherent. The Forge deck builder is genuinely the most sophisticated GCG deck tool publicly available. The cards database is complete and well-structured.

**The platform fails at trust.** It presents itself as fully-featured when its most trust-bearing features — user accounts, cloud saves, social features — are either disabled or fake. A competitive player who clicks "Sign in" and sees "Coming Soon" will not return.

**Fix the trust layer first. Everything else is secondary.**

The path to "production-ready for competitive players" is:
1. Be honest about what's missing (no auth, localStorage only, playtester is alpha)
2. Make the things that work, work excellently (Forge, Cards, Events)
3. Ship cloud persistence

Everything else in this audit is optimization.

---

*Audit generated for internal use. All scores are professional estimates based on static code analysis, component inspection, and simulated user walkthroughs. Live environment testing via browser automation was not performed in this audit cycle.*
