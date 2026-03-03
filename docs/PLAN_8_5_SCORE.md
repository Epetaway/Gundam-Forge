# Gundam Forge — Plan to 8.5 / 10

> **Current Score:** 52 / 100
> **Target Score:** 85 / 100
> **Gap:** +33 points
> **Plan Author:** Product Director / Principal Engineer
> **Reference Audit:** `docs/AUDIT_UI_UX_PRODUCT.md`

---

## Score Gap by Dimension

| Dimension | Now | Target | Gap |
|---|---|---|---|
| Trust & Reliability | 31 | 88 | **+57** (highest ROI) |
| Feature Completeness | 38 | 80 | **+42** |
| Information Architecture | 48 | 82 | **+34** |
| UX Usability | 54 | 83 | **+29** |
| Mobile Responsiveness | 56 | 82 | **+26** |
| Accessibility | 62 | 85 | **+23** |
| Performance | 58 | 82 | **+24** |
| Component Quality | 66 | 85 | **+19** |
| UI Visual Quality | 71 | 88 | **+17** |
| Design System Consistency | 78 | 90 | **+12** |

---

## Score Projection by Phase

| Phase | Duration | Actions | Score After |
|---|---|---|---|
| Baseline | — | — | 52 |
| Phase 1: Trust Recovery | 2 weeks | 9 items | **64** |
| Phase 2: IA & Structure | 3 weeks | 11 items | **74** |
| Phase 3: Feature Completion | 5 weeks | 12 items | **83** |
| Phase 4: Polish & A11y | 3 weeks | 10 items | **87** |

Phases 1–3 are required to reach 8.5/10. Phase 4 overshoots to 8.7/10 and establishes a hardened, shippable baseline.

---

## Phase 1: Trust Recovery
**Duration: 2 weeks | Expected score delta: +12 → 64 / 100**

Trust is the single largest score killer. The platform implies user accounts, cloud saves, and social sharing while delivering none of them. Every item in this phase removes a broken promise or replaces it with an honest one.

---

### P1-1 — Remove "Sign in" from production nav
**File:** `apps/web/components/layout/AppShell.tsx:40`
**Effort:** S (30 min)
**Score impact:** Trust +18

**Change:** Replace the `Sign in` Button with a neutral `<span>` badge.

```tsx
// REMOVE:
<Button asChild className="hidden md:inline-flex" size="sm" variant="secondary">
  <Link href="/auth/login">Sign in</Link>
</Button>

// ADD:
<span className="hidden md:inline-flex items-center gap-1.5 rounded border border-border bg-surface-interactive px-2.5 py-1 text-xs text-steel-500">
  <span className="h-1.5 w-1.5 rounded-full bg-cobalt-400/60" />
  Cloud sync coming soon
</span>
```

**Why:** A "Sign in" button that leads to a "Coming Soon" page is the #1 trust signal failure in the current app. Users who click it and see a dead end will not return. Every click is a lost user.

---

### P1-2 — Remove "Visibility" selector from Create Deck form
**File:** `apps/web/components/deck/DeckSetupForm.tsx:13–130`
**Effort:** S (20 min)
**Score impact:** Trust +6, UX +4

**Change:** Remove the entire VISIBILITIES block and the `<div>` that renders it (lines 110–130). The field does nothing in production — it stores a value to localStorage that has no consumer. Its presence implies cloud functionality that doesn't exist.

Add in its place, directly above the submit button:

```tsx
<p className="rounded-md border border-cobalt-500/20 bg-cobalt-500/8 px-3 py-2 text-xs text-steel-500">
  Your deck saves to your browser. Cloud sync is in development.
</p>
```

---

### P1-3 — Add localStorage save confirmation toast to Forge
**File:** `apps/web/app/forge/forge-workbench.tsx`
**Effort:** M (2–3 hrs)
**Score impact:** UX +5, Trust +4

The deck auto-saves to localStorage on every change but gives zero feedback. Users with a "Save = explicit button press" mental model don't know their work is safe.

**Change:** After every `updateDeckEntries` call, fire a short-lived toast:

```tsx
// In the save/update handler, after updateDeckEntries():
showToast({ message: 'Deck saved', duration: 1800, icon: 'check' });
```

Implement a minimal `useToast` hook + `<ToastStack>` portal component in `components/ui/Toast.tsx`. The toast must:
- Appear bottom-right, above the footer
- Auto-dismiss after 1.8 seconds
- Be non-blocking (pointer-events: none while visible)
- Have `role="status"` and `aria-live="polite"` for screen readers

---

### P1-4 — Add "Alpha" banner to Playtester
**File:** `apps/web/components/playtest/PlaytestGameEnhanced.tsx` (near top of rendered JSX)
**Effort:** S (1 hr)
**Score impact:** Trust +8

The playtester uses hardcoded resource token IDs and is not representative of a real GCG game. Presenting it without context destroys trust.

**Change:** Add a dismissible banner at the top of the playtester:

```tsx
{!bannerDismissed && (
  <div className="flex items-start justify-between gap-3 border-b border-amber-400/30 bg-amber-400/8 px-4 py-2.5 text-xs text-amber-300">
    <p>
      <strong>Alpha Playtester:</strong> Resource deck uses placeholder cards.
      Full resource deck support and rules completeness are in development.
    </p>
    <button
      onClick={() => setBannerDismissed(true)}
      aria-label="Dismiss alpha notice"
      className="flex-shrink-0 rounded p-0.5 hover:bg-amber-400/20"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
)}
```

Persist dismissed state with `sessionStorage` so it only shows once per session.

---

### P1-5 — Add error boundaries to Forge, Cards, Explore
**Files:**
- `apps/web/app/forge/page.tsx`
- `apps/web/app/cards/page.tsx`
- `apps/web/app/explore/page.tsx`
**Effort:** S (1 hr)
**Score impact:** Reliability +5

Currently, a thrown exception in the filter memo or storage read crashes the entire page to a blank screen. The playtester already uses `<ErrorBoundary>` — apply the same pattern:

```tsx
// In each page:
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary context="Forge">
      <ForgeWorkbench ... />
    </ErrorBoundary>
  );
}
```

The existing `ErrorBoundary` component in `components/ui/ErrorBoundary.tsx` already handles this — just needs to be applied.

---

### P1-6 — Fix `bg-steel-200` on Events 2nd place
**File:** `apps/web/app/events/page.tsx:88`
**Effort:** XS (5 min)
**Score impact:** UI +3

`bg-steel-200` is a light surface in the dark theme — visually looks like a bug (a bright white/grey card in a dark UI).

```tsx
// CHANGE:
if (placement === 2) return 'border-steel-500/60 bg-steel-200';

// TO:
if (placement === 2) return 'border-steel-400/40 bg-steel-500/10';
```

---

### P1-7 — Add a11y context to Events "Deck" buttons
**File:** `apps/web/app/events/page.tsx`
**Effort:** XS (15 min)
**Score impact:** A11y +3

```tsx
// CHANGE:
<Button asChild size="sm" variant="secondary">
  <Link href={`/decks/${placement.deckId}`}>Deck</Link>
</Button>

// TO:
<Button asChild size="sm" variant="secondary">
  <Link
    href={`/decks/${placement.deckId}`}
    aria-label={`View ${placement.player}'s deck: ${placement.deckName}`}
  >
    Deck
  </Link>
</Button>
```

---

### P1-8 — Fix "Change" button on Active Deck bar in Cards page
**File:** `apps/web/app/cards/CardsClient.tsx`
**Effort:** M (3 hrs)
**Score impact:** UX +6

Currently clicking "Change" calls `setActiveDeckId(null)` — it clears the active deck without giving the user a way to select a different one. Dead end.

**Change:** Clicking "Change" opens a compact popover/modal that lists all localStorage decks. User selects a deck → active deck updates.

```tsx
// New component: ActiveDeckPicker
// Reads all keys from localStorage matching 'gundam-forge.deck.*'
// Renders a list of deck name pills, clicking one sets activeDeckId
// Closes on selection or Escape

<ActiveDeckPicker
  open={pickerOpen}
  onSelect={(id, name) => {
    setActiveDeckId(id);
    setActiveDeckName(name);
    setPickerOpen(false);
  }}
  onClose={() => setPickerOpen(false)}
/>
```

---

### P1-9 — "Edit in Forge" + "Playtest" buttons on Deck Detail
**File:** `apps/web/app/decks/[id]/page.tsx`
**Effort:** M (2 hrs)
**Score impact:** UX +5

The deck detail view has no path to edit or test the deck. Both actions are buried in the URL structure.

**Change:** Add two action buttons to the DeckHeader area:

```tsx
<div className="flex flex-wrap gap-2 mt-3">
  <Button asChild variant="primary" size="sm">
    <Link href={`/forge?deckId=${deck.id}`}>
      <Wrench className="h-3.5 w-3.5 mr-1.5" />
      Edit in Forge
    </Link>
  </Button>
  <Button asChild variant="secondary" size="sm">
    <Link href={`/decks/${deck.id}/playtest`}>
      <Swords className="h-3.5 w-3.5 mr-1.5" />
      Playtest
    </Link>
  </Button>
</div>
```

---

### Phase 1 Definition of Done

- [ ] "Sign in" removed from production header — no dead links in nav
- [ ] "Visibility" selector removed from Create Deck form
- [ ] Toast confirmation fires on every deck save in Forge
- [ ] Playtester shows alpha banner on first load per session
- [ ] Error boundaries wrap Forge, Cards, Explore pages
- [ ] `bg-steel-200` contrast bug fixed on Events page
- [ ] Events "Deck" buttons have contextual aria-labels
- [ ] "Change" on Active Deck bar opens a deck picker
- [ ] Deck Detail has "Edit in Forge" and "Playtest" buttons

---

## Phase 2: Information Architecture & Structural Fixes
**Duration: 3 weeks | Expected score delta: +10 → 74 / 100**

IA is currently broken. Two pages ("Explore" and "Decks") serve the same purpose. The nav has 7 items for a 5-section product. "Explore" has no search. The Forge deck view has no zone separation. These are structural fixes that unlock usability improvements everywhere else.

---

### P2-1 — Restructure navigation to 5 items
**File:** `apps/web/components/layout/MainNav.tsx`
**Effort:** S (2 hrs)
**Score impact:** IA +12, UX +5

**Target nav:**
```
Home | Cards | Forge | Community | Events
```

**Remove from nav:**
- `+ Create Deck` (accessible from Forge page and home page CTAs — not a nav-level item)
- `Decks` (merged into Community)

**Rename:**
- `Explore` → `Community`

**MainNav change:**
```tsx
const NAV_LINKS = [
  { href: '/',          label: 'Home'      },
  { href: '/cards',     label: 'Cards'     },
  { href: '/forge',     label: 'Forge'     },
  { href: '/community', label: 'Community' },
  { href: '/events',    label: 'Events'    },
];
```

**Mobile nav** (hamburger menu): same 5 items. Remove the "+ Create Deck" mobile link from the current mobile nav.

---

### P2-2 — Create the Community page (merge Explore + Decks)
**File:** Create `apps/web/app/community/page.tsx` + `CommunityClient.tsx`
**Effort:** L (6–8 hrs)
**Score impact:** IA +10, UX +8

The Community page replaces both `/explore` and `/decks`. It has two tabs:

**Tab 1: "Community Decks"** (what Explore currently shows)
- Deck grid with sort: Trending / Win Rate / Most Viewed
- Search input (filter by deck name or owner)
- Color filter buttons (All, Blue, Red, Green, White, Purple)
- Archetype filter (dropdown from unique archetype list)
- Each deck card has working `onMenu` → popover with "Copy link" and "Clone deck"

**Tab 2: "My Decks"** (replaces the current `/decks` page)
- Reads localStorage keys `gundam-forge.deck.*`
- Shows user-created decks with: name, card count, last modified date, colors
- Each card has "Edit in Forge" and "Playtest" CTAs
- Empty state: "No decks saved. Start building in the Forge →"
- Link to create: always visible in the tab header

```tsx
// CommunityClient.tsx
const [tab, setTab] = React.useState<'community' | 'my-decks'>('community');

// Tab bar
<div role="tablist" ...>
  <button role="tab" aria-selected={tab === 'community'} onClick={() => setTab('community')}>
    Community Decks
    <span className="ml-1.5 rounded-full bg-surface-interactive px-1.5 py-0.5 text-[10px] font-mono">
      {communityDecks.length}
    </span>
  </button>
  <button role="tab" aria-selected={tab === 'my-decks'} onClick={() => setTab('my-decks')}>
    My Decks
    <span className="ml-1.5 rounded-full bg-cobalt-500/20 text-cobalt-400 px-1.5 py-0.5 text-[10px] font-mono">
      {myDecks.length}
    </span>
  </button>
</div>
```

**Redirect:** Keep `/explore` and `/decks` as redirects to `/community` to avoid broken URLs.

---

### P2-3 — Fix GridView builder controls (remove static property hack)
**File:** `apps/web/app/forge/DeckBuilderViews.tsx:77–128`
**Effort:** M (2 hrs)
**Score impact:** Component Quality +8, Reliability +4

This is a production bug. The `GridView` component's add/remove buttons reference `(GridView as any).builderControls` — a static property that must be set by the parent before the component mounts. If it's not set, buttons silently do nothing.

**Change:** Pass `onAdd` and `onRemove` as regular props:

```tsx
// CHANGE interface:
export interface DeckViewProps {
  cards: DeckCard[];
  density: 'comfortable' | 'compact';
  onOpenCard: (cardId: string) => void;
  onAdd?: (card: DeckCard) => void;     // ADD
  onRemove?: (card: DeckCard) => void;  // ADD
}

// CHANGE GridView:
export function GridView({ cards, density, onOpenCard, onAdd, onRemove }: DeckViewProps) {
  // Remove:
  // const { onAdd, onRemove } = (GridView as any).builderControls || {};

  // Use onAdd and onRemove directly from props
  ...
}
```

Update the call site in `forge-workbench.tsx` to pass these props explicitly.

---

### P2-4 — Add zone separation to Forge deck view
**File:** `apps/web/app/forge/DeckBuilderViews.tsx` + `forge-workbench.tsx`
**Effort:** L (5–6 hrs)
**Score impact:** Feature Completeness +8, UX +6

Currently all cards in the deck (main deck + resource cards) are shown together with no visual separation. GCG has strict zone rules. Players need to see which zone each card is in.

**Change:** In all view modes, split cards into three groups before rendering:

```tsx
// In forge-workbench, derive zone-split cards:
const zonedCards = useMemo(() => ({
  main: deckCards.filter(c => c.type !== 'Resource'),
  resource: deckCards.filter(c => c.type === 'Resource'),
}), [deckCards]);
```

Render each zone with a sticky section header:

```tsx
// Zone header component (reuse across all views):
function ZoneHeader({ label, count, limit }: { label: string; count: number; limit: number }) {
  const over = count > limit;
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-surface/95 px-2 py-1.5 backdrop-blur">
      <span className="text-xs font-bold uppercase tracking-wider text-steel-400">{label}</span>
      <span className={cn(
        'ml-auto font-mono text-xs font-bold tabular-nums',
        over ? 'text-red-400' : 'text-steel-500'
      )}>
        {count} / {limit}
      </span>
    </div>
  );
}
```

Apply to ListView (existing), StacksView, GridView, and TableView.

---

### P2-5 — Add cost curve to Forge right panel
**File:** `apps/web/app/forge/forge-workbench.tsx` (right panel, below ValidationBar)
**Effort:** M (3–4 hrs)
**Score impact:** Feature Completeness +5, UX +4

A cost curve (CMC distribution bar chart) is standard in every serious deck builder. It gives players an at-a-glance view of their deck's curve.

**New component:** `components/deck/CostCurve.tsx`

```tsx
// CostCurve: renders a simple horizontal bar chart
// Props: cards: DeckCard[]
// Groups cards by cost (0-7+), renders bars proportional to count

function CostCurve({ cards }: { cards: DeckCard[] }) {
  const maxCost = 7;
  const buckets = useMemo(() => {
    const b = Array.from({ length: maxCost + 1 }, (_, i) => ({ cost: i, count: 0 }));
    for (const c of cards) {
      const idx = Math.min(c.cost ?? 0, maxCost);
      b[idx].count += c.qty;
    }
    return b;
  }, [cards]);

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="px-3 py-2 border-t border-border">
      <p className="mb-1.5 text-[10px] font-mono uppercase tracking-wider text-steel-500">Cost Curve</p>
      <div className="flex items-end gap-1 h-10">
        {buckets.map(b => (
          <div key={b.cost} className="flex flex-1 flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t-sm bg-cobalt-500/70 transition-all"
              style={{ height: `${(b.count / maxCount) * 36}px` }}
              title={`Cost ${b.cost === maxCost ? `${maxCost}+` : b.cost}: ${b.count} cards`}
            />
            <span className="text-[9px] font-mono text-steel-600">
              {b.cost === maxCost ? `${maxCost}+` : b.cost}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Place below `<ValidationBar>` and above the zone view.

---

### P2-6 — Add text search + color/archetype filter to Community (Explore)
**File:** New `CommunityClient.tsx` (see P2-2)
**Effort:** M (3 hrs, partially covered in P2-2)
**Score impact:** UX +5, Feature Completeness +3

Add above the deck grid:

```tsx
// Search bar
<input
  type="search"
  placeholder="Search decks by name or pilot…"
  value={searchQuery}
  onChange={e => setSearchQuery(e.target.value)}
  className="h-9 w-full rounded-md border border-border bg-surface-interactive px-3 text-sm ..."
/>

// Color filter pills
<div role="group" aria-label="Filter by color" className="flex flex-wrap gap-1.5">
  {['All', 'Blue', 'Red', 'Green', 'White', 'Purple'].map(color => (
    <button
      key={color}
      aria-pressed={colorFilter === color}
      onClick={() => setColorFilter(color)}
      className={cn('rounded-full px-2.5 py-1 text-xs font-semibold border', colorFilter === color ? 'bg-cobalt-600 text-white border-cobalt-600' : 'border-border text-steel-500 hover:text-foreground')}
    >
      {color}
    </button>
  ))}
</div>
```

---

### P2-7 — Add "Share Deck" URL feature for localStorage decks
**File:** `apps/web/lib/deck/shareUrl.ts` (new) + Forge toolbar
**Effort:** M (3–4 hrs)
**Score impact:** Feature Completeness +6, Trust +5

Until cloud accounts exist, the best shareability feature is a shareable URL with deck data encoded as a compressed base64 query param. This mirrors how apps like Pokémon Card Maker and similar tools work before they have backends.

**New utility:**
```ts
// lib/deck/shareUrl.ts
export function encodeDeckToUrl(deck: StoredDeck): string {
  const minimal = {
    n: deck.name,
    e: deck.entries.map(e => [e.cardId, e.qty]),
  };
  const json = JSON.stringify(minimal);
  const b64 = btoa(encodeURIComponent(json));
  return `${window.location.origin}/forge?import=${b64}`;
}

export function decodeDeckFromUrl(param: string): { name: string; entries: { cardId: string; qty: number }[] } | null {
  try {
    const json = decodeURIComponent(atob(param));
    const data = JSON.parse(json);
    return { name: data.n, entries: data.e.map(([cardId, qty]: [string, number]) => ({ cardId, qty })) };
  } catch {
    return null;
  }
}
```

Add "Copy share link" to Forge toolbar (next to Export). In the Forge `useEffect` on load, check for `?import=` param and auto-import.

---

### P2-8 — Redirect `/explore` and `/decks` to `/community`
**Files:** `apps/web/app/explore/page.tsx`, `apps/web/app/decks/page.tsx`
**Effort:** XS (15 min)
**Score impact:** IA +2

```tsx
// apps/web/app/explore/page.tsx
import { redirect } from 'next/navigation';
export default function ExplorePage() { redirect('/community'); }

// apps/web/app/decks/page.tsx
import { redirect } from 'next/navigation';
export default function DecksPage() { redirect('/community'); }
```

---

### P2-9 — Fix mobile Forge search panel height on landscape
**File:** `apps/web/app/forge/forge-workbench.tsx` (search panel aside)
**Effort:** S (1 hr)
**Score impact:** Mobile +4

The search panel uses `maxHeight: calc(100vh - 320px)` which produces near-zero on landscape mobile (375px viewport height). Clamp to a minimum:

```tsx
// CHANGE:
style={{ maxHeight: 'calc(100vh - 320px)' }}

// TO:
style={{ maxHeight: 'max(200px, calc(100vh - 320px))' }}
```

Also: on mobile, the search panel should default to a bottom drawer rather than the left aside. This requires a responsive wrapper that:
- Below `md` breakpoint: renders as a bottom sheet triggered by a sticky "Search" FAB
- At `md` and above: renders as the existing left aside

---

### P2-10 — Add "My Decks" section to home page
**File:** `apps/web/app/page.tsx`
**Effort:** M (3 hrs)
**Score impact:** UX +4, Retention +6

The home page has zero personalization. Users who have built decks in localStorage have no quick way to see them from the home page.

**Change:** Add a `<MyDecksSection>` client component before the Trending Decks section:

```tsx
'use client';
// MyDecksSection: reads localStorage keys matching 'gundam-forge.deck.*'
// Shows up to 3 most recently modified decks
// If 0 localStorage decks: renders nothing (invisible to new users)
// If 1+: renders a horizontal scroll row of compact deck cards with name, count, "Open in Forge" link
```

This uses localStorage so it requires a `'use client'` wrapper. The server-rendered home page can include it as a lazy client island.

---

### P2-11 — Replace footer dev-speak with player-facing copy
**File:** `apps/web/components/layout/AppShell.tsx:50–57`
**Effort:** XS (10 min)
**Score impact:** UI +2

```tsx
// CHANGE:
<p>Built for high-velocity Gundam GCG deck iteration.</p>
<p className="font-mono uppercase tracking-[0.16em]">SSR first • Accessible • Tokenized</p>

// TO:
<p>Gundam Forge — Build, test, and share GCG decks.</p>
<div className="flex flex-wrap gap-3">
  <Link href="/cards" className="hover:text-foreground transition-colors">Cards</Link>
  <Link href="/forge" className="hover:text-foreground transition-colors">Forge</Link>
  <Link href="/community" className="hover:text-foreground transition-colors">Community</Link>
  <Link href="/events" className="hover:text-foreground transition-colors">Events</Link>
</div>
```

---

### Phase 2 Definition of Done

- [ ] Nav reduced to 5 items: Home | Cards | Forge | Community | Events
- [ ] `/community` page exists with "Community Decks" and "My Decks" tabs
- [ ] `/explore` and `/decks` redirect to `/community`
- [ ] Community Decks tab has text search + color filter
- [ ] My Decks tab shows localStorage decks with "Edit in Forge" + "Playtest"
- [ ] GridView uses `onAdd`/`onRemove` props — no static property mutation
- [ ] Zone separation (main / resource) visible in all Forge view modes
- [ ] Cost curve renders below ValidationBar in Forge right panel
- [ ] Mobile Forge search panel landscape height is clamped to minimum 200px
- [ ] "My Decks" section on home page (shows only when decks exist)
- [ ] Footer shows navigation links + player-facing copy

---

## Phase 3: Feature Completion
**Duration: 5 weeks | Expected score delta: +9 → 83 / 100**

Phase 3 adds the features that competitive players expect and that distinguish a tool from a prototype.

---

### P3-1 — Virtualize the cards grid
**File:** `apps/web/app/cards/CardsClient.tsx`
**Effort:** L (6–8 hrs)
**Score impact:** Performance +10, UX +3

`react-window` is already installed. The cards page currently uses "Load More" pagination that appends DOM nodes without removing old ones. At full catalog size (613 cards), this is 613 image nodes in the DOM.

**Change:** Replace the `displayCount` + "Load more" pattern with `FixedSizeGrid` from `react-window`:

```tsx
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';  // add dependency

const COLUMN_COUNT = 6; // adjust per breakpoint
const CARD_HEIGHT = 220;
const CARD_WIDTH = 160;

<AutoSizer>
  {({ width }) => {
    const cols = width >= 1280 ? 6 : width >= 1024 ? 5 : width >= 768 ? 4 : width >= 640 ? 3 : 2;
    return (
      <Grid
        columnCount={cols}
        columnWidth={width / cols}
        height={600}
        rowCount={Math.ceil(filteredCards.length / cols)}
        rowHeight={CARD_HEIGHT}
        width={width}
      >
        {({ columnIndex, rowIndex, style }) => {
          const cardIdx = rowIndex * cols + columnIndex;
          const card = filteredCards[cardIdx];
          if (!card) return null;
          return (
            <div style={style} className="p-1">
              <ReferenceCardTile card={card} onInspect={setInspectCardId} onAdd={handleAdd} />
            </div>
          );
        }}
      </Grid>
    );
  }}
</AutoSizer>
```

Also add `react-virtualized-auto-sizer` to `package.json` dependencies.

---

### P3-2 — Add cost filter to Cards page
**File:** `apps/web/app/cards/CardsClient.tsx`
**Effort:** M (3 hrs)
**Score impact:** Feature Completeness +4, UX +4

Add a row of cost filter buttons in the filter drawer (and optionally inline on desktop):

```tsx
const COST_OPTIONS = [null, 0, 1, 2, 3, 4, 5, 6, 7] as const; // null = All
type CostOption = typeof COST_OPTIONS[number];

// Filter pill row:
<div role="group" aria-label="Filter by cost" className="flex flex-wrap gap-1">
  {COST_OPTIONS.map((cost) => (
    <button
      key={String(cost)}
      aria-pressed={costFilter === cost}
      onClick={() => setCostFilter(cost)}
      className={cn('rounded border px-2 py-1 font-mono text-xs', costFilter === cost ? 'bg-cobalt-600 text-white border-cobalt-600' : 'border-border text-steel-500')}
    >
      {cost === null ? 'All' : cost === 7 ? '7+' : String(cost)}
    </button>
  ))}
</div>

// In filter logic:
.filter(card => costFilter === null || (costFilter === 7 ? card.cost >= 7 : card.cost === costFilter))
```

When active, add an active chip: `Cost: ${costFilter === 7 ? '7+' : costFilter}`.

---

### P3-3 — Add inline "Quick Add" to card grid tiles
**File:** `apps/web/components/cards/ReferenceCardTile.tsx` (or equivalent)
**Effort:** M (2–3 hrs)
**Score impact:** UX +5

Cards page requires opening a modal to add a card to the active deck. This is two taps instead of one.

**Change:** On desktop hover (and on mobile, always visible), show an `+` button at the bottom-right of each grid tile:

```tsx
// In card grid tile:
{activeDeckId && (
  <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      className="rounded-full bg-cobalt-600 p-1.5 shadow-lg hover:bg-cobalt-500 active:scale-95 transition-all"
      onClick={(e) => { e.stopPropagation(); onAdd(card); }}
      aria-label={`Add ${card.name} to deck`}
      title={`Add ${card.name}`}
    >
      <Plus className="h-3.5 w-3.5 text-white" />
    </button>
  </div>
)}
```

Show an `addFeedback` state flash ("Added!" badge) for 1.2 seconds after add — the infrastructure for this already exists in `CardsClient.tsx`.

---

### P3-4 — Unify keyword filters between Cards page and Forge panel
**File:** `apps/web/app/cards/CardsClient.tsx` + `apps/web/app/forge/CardSearchPanel.tsx`
**Effort:** M (2 hrs)
**Score impact:** Design System +5, UX +3

The Cards page keyword options: `['All', 'Rush', 'Breach', 'Burst', 'Suppression', 'Repair', 'Support', 'Link', 'Pair']`

The Forge panel has a richer keyword system with individual toggle chips. These must use the same source of truth.

**Change:** Extract keyword definitions to a shared constants file:

```ts
// packages/shared/src/keywords.ts
export const GCG_KEYWORDS = [
  'Rush', 'Breach', 'Burst', 'Suppression', 'Repair',
  'Support', 'Link', 'Pair', 'Defend', 'Overboost',
] as const;
export type GCGKeyword = typeof GCG_KEYWORDS[number];
```

Both cards page and forge panel import from this constant. Cards page upgrades from a `<select>` to a toggle chip row matching the Forge panel pattern.

---

### P3-5 — Fix resource deck in Playtester
**File:** `apps/web/lib/game/game-engine.ts` + `PlaytestGameEnhanced.tsx`
**Effort:** XL (8–12 hrs)
**Score impact:** Feature Completeness +8, Trust +6

The playtester currently uses `TOKEN-RESOURCE-001` as a hardcoded placeholder for resource cards. This must be replaced with actual Resource-type cards from the deck database.

**Change:**

1. Add a `resourceDeckEntries` field to `StoredDeck` in `lib/deck/storage.ts`:
   ```ts
   resourceDeckEntries: { cardId: string; qty: number }[];
   ```

2. In the Forge right panel, add a second tab: "Resource Deck" with count badge `X / 10`. This tab shows only Resource-type cards and tracks a separate 10-card resource deck.

3. The playtester's `PlaytestGameEnhanced` receives a `resourceDeck` prop from the deck record and uses those actual cards as the resource deck.

4. Fallback: if `resourceDeckEntries` is empty (legacy decks), build a default resource deck from the 10 lowest-cost Resource-type cards in the database.

This is the largest single item in the plan. It touches both the deck builder and the playtester.

---

### P3-6 — Add card color pip system
**File:** New `components/ui/ColorPip.tsx` + apply to deck cards, tiles
**Effort:** S (2 hrs)
**Score impact:** UI +5, Design System +3

GCG is a color-based game. Color identity should be visually represented everywhere, not just as text labels.

**New component:**
```tsx
const COLOR_MAP: Record<string, string> = {
  Blue:      'bg-blue-500',
  Red:       'bg-red-500',
  Green:     'bg-emerald-500',
  White:     'bg-slate-200',
  Purple:    'bg-purple-500',
  Colorless: 'bg-steel-500',
};

export function ColorPip({ color, size = 'sm' }: { color: string; size?: 'xs' | 'sm' | 'md' }) {
  return (
    <span
      className={cn('inline-block rounded-full', COLOR_MAP[color] ?? 'bg-steel-500', size === 'xs' ? 'h-1.5 w-1.5' : size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5')}
      aria-label={color}
      title={color}
    />
  );
}

// Usage: deck color display
<div className="flex items-center gap-1">
  {deck.colors.map(c => <ColorPip key={c} color={c} size="sm" />)}
</div>
```

Apply to: `DeckPreviewCard`, `CardsClient` card grid tile color indicator, Community deck list, forge sidebar zone headers.

---

### P3-7 — Accessibility: touch targets (44px minimum)
**Files:** All interactive inline elements
**Effort:** L (5–6 hrs)
**Score impact:** Accessibility +10

Touch targets below 44×44px: filter chip clear buttons (×), card grid +/− buttons, synergy badge (if interactive), filter pill close icons.

**Strategy:** Create a `TouchTarget` wrapper utility:
```tsx
// components/ui/TouchTarget.tsx
// Wraps a small element and adds invisible padding to expand the hit area to 44×44px
// without affecting visual layout, using position:relative + ::before pseudo-element trick
export function TouchTarget({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <span className="absolute inset-[-11px]" aria-hidden="true" /> {/* expands hit area */}
      {children}
    </span>
  );
}
```

Apply to all filter chip clear (×) buttons, inline +/− builder buttons, and the theme toggle.

---

### P3-8 — Accessibility: focus return after modal close
**Files:** `CardDetailModal.tsx`, `CardViewerModal.tsx`, filter drawers
**Effort:** M (3 hrs)
**Score impact:** Accessibility +6

When a modal closes, focus must return to the element that opened it. Currently focus is dropped to the document body.

**Implementation pattern:**
```tsx
// In any modal component:
const triggerRef = useRef<HTMLElement | null>(null);

// On open:
useEffect(() => {
  if (open) {
    triggerRef.current = document.activeElement as HTMLElement;
  }
}, [open]);

// On close (in onOpenChange handler):
const handleClose = () => {
  onOpenChange(false);
  // Return focus to the opener after modal unmounts
  requestAnimationFrame(() => triggerRef.current?.focus());
};
```

Apply to all three dialog types: `CardDetailModal`, `CardViewerModal`, and the mobile filter drawer.

---

### P3-9 — Accessibility: fieldset/legend for filter groups
**File:** `apps/web/app/forge/CardSearchPanel.tsx` (keywords section)
**Effort:** S (1.5 hrs)
**Score impact:** Accessibility +4

The keyword and trigger filter sections use `<span>` for group labels. Screen readers don't associate these labels with the toggle buttons beneath them.

```tsx
// CHANGE:
<span className="text-xs font-semibold text-steel-400">Keywords</span>
<div className="flex flex-wrap gap-1.5">
  {/* toggle buttons */}
</div>

// TO:
<fieldset className="border-0 p-0 m-0">
  <legend className="text-xs font-semibold text-steel-400 mb-1.5">Keywords</legend>
  <div className="flex flex-wrap gap-1.5">
    {/* toggle buttons */}
  </div>
</fieldset>
```

Apply to: Keywords, Triggers, and Set filter groups in `CardSearchPanel`.

---

### P3-10 — Meta Snapshot: replace deployment note with date
**File:** `apps/web/app/page.tsx:55`
**Effort:** XS (15 min)
**Score impact:** Trust +3, UX +2

```tsx
// CHANGE:
<p className="text-[11px] text-steel-500">
  Data updated with each build deployment.
</p>

// TO:
{latestEventDate && (
  <p className="text-[11px] text-steel-500">
    Last updated: {latestEventDate}
  </p>
)}
```

---

### P3-11 — Link archetype sidebar to filtered Community view
**File:** `apps/web/app/events/page.tsx` archetype meta sidebar
**Effort:** S (1 hr)
**Score impact:** UX +3

Each archetype in the sidebar should link to `/community?archetype=[name]`:

```tsx
// CHANGE:
<div className="rounded-md border border-border bg-surface-interactive px-3 py-2" key={record.archetype}>

// TO:
<Link
  href={`/community?archetype=${encodeURIComponent(record.archetype)}`}
  className="block rounded-md border border-border bg-surface-interactive px-3 py-2 hover:border-cobalt-400/50 hover:bg-surface-muted transition-colors"
  key={record.archetype}
>
```

The Community page (P2-2) must read the `?archetype` param and pre-select the archetype filter on load.

---

### P3-12 — Platform Features: replace text blobs with icon cards
**File:** `apps/web/app/page.tsx` (platformFeatures section is now the "Everything in One Place" section — already updated to icon cards in current code)
**Effort:** XS — verify implementation quality
**Score impact:** UI +3

The current home page already has icon cards for "Build in the Forge" and "Playtest Your Deck". The old `platformFeatures` text list was removed. Verify the current icon card section renders correctly and the cards have proper hover states.

If the "Platform Features" card still renders `platformFeatures` as a text list, replace with an icon grid:

```tsx
const FEATURES = [
  { icon: SearchIcon, title: `${cards.length} Cards`, desc: 'Full official card pool with text search and filters.' },
  { icon: Wrench, title: 'Forge Deck Builder', desc: 'Synergy scoring, four view modes, official rules validation.' },
  { icon: Swords, title: 'AI Playtester', desc: 'Test against an AI with official phase sequencing.' },
];
```

---

### Phase 3 Definition of Done

- [ ] Cards grid is virtualized (react-window) — no "Load More" DOM append
- [ ] Cards page has cost filter (0–7+) as toggle pill row
- [ ] Cards page grid tiles have inline "Quick Add" button
- [ ] Keyword filters are identical between Cards page and Forge panel
- [ ] Resource deck builder tab exists in Forge right panel (Resource cards, 10-card limit)
- [ ] Playtester loads actual resource deck cards (or fallback to default 10 Resource cards)
- [ ] `ColorPip` component applied to DeckPreviewCard, card tiles, and forge zones
- [ ] All touch targets ≥ 44×44px (via TouchTarget wrapper)
- [ ] Modal close returns focus to trigger element
- [ ] Keyword/trigger filter groups use `<fieldset>/<legend>`
- [ ] Meta Snapshot shows `Last updated: [date]` instead of deployment note
- [ ] Events archetype sidebar items link to Community filtered by archetype

---

## Phase 4: Polish & Performance
**Duration: 3 weeks | Expected score delta: +4 → 87 / 100**

Phase 4 reaches the 8.7/10 target and closes the remaining quality gaps identified in the audit.

---

### P4-1 — Mobile Forge: bottom drawer for search panel
**File:** `apps/web/app/forge/forge-workbench.tsx`
**Effort:** L (8 hrs)
**Score impact:** Mobile +8

The current mobile Forge shows the search panel behind a toggle that hides the deck view entirely. This forces users to context-switch between "browsing cards" mode and "reviewing deck" mode with no intermediate view.

**Target behavior:**
- **Mobile (< 768px):** Persistent "Search cards" button (FAB or sticky strip) at bottom of screen. Tapping it opens a bottom sheet that slides up 75% of the screen height. The deck view is visible behind it. User can add cards from the sheet. Sheet dismisses with swipe-down or Escape.
- **Tablet (768px–1023px):** Current narrow aside behavior is acceptable.
- **Desktop (1024px+):** Current split panel layout.

**Implementation:**
```tsx
// Mobile: replace aside with bottom sheet
const isDesktop = useMediaQuery('(min-width: 768px)');

{isDesktop ? (
  <aside className="w-[320px] flex-shrink-0 ...">
    <CardSearchPanel ... />
  </aside>
) : (
  <>
    <MobileSearchSheet open={searchSheetOpen} onClose={() => setSearchSheetOpen(false)}>
      <CardSearchPanel ... />
    </MobileSearchSheet>
    <button
      className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-cobalt-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
      onClick={() => setSearchSheetOpen(true)}
    >
      <Search className="h-4 w-4" />
      Search Cards
    </button>
  </>
)}
```

`MobileSearchSheet` is a bottom-anchored `<dialog>` with a drag handle, `overscroll-contain`, and `touch-action: pan-y`.

---

### P4-2 — Playtester: add phase indicator progress bar
**File:** `apps/web/components/playtest/PhaseIndicator.tsx` (or equivalent)
**Effort:** M (3 hrs)
**Score impact:** UX +3, Feature Completeness +2

A horizontal phase progress bar at the top of the battlefield showing:
```
[ Draw ] [ Resource ] [ Main ] [ Battle ] [ End ]
              ^^^^ current phase (highlighted)
```

Each phase name is clickable to advance (when legal). This makes the turn structure transparent and reduces confusion for new players.

---

### P4-3 — Lazy-load card images with blur-up placeholder
**File:** `apps/web/components/ui/CardArtImage.tsx` + all card tile components
**Effort:** M (3–4 hrs)
**Score impact:** Performance +6, UI +3

Currently card images load without any placeholder — users see a layout shift or broken image state until the image loads.

**Change:** Add a blur-up loading state to `CardArtImage`:

```tsx
export function CardArtImage({ src, alt, className }: CardArtImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-steel-800', className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-steel-800 to-steel-700" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn('w-full h-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  );
}
```

Apply to all card image renders: `CardPreviewTile`, `ReferenceCardTile`, `DeckPreviewCard`, `CardDetailModal`.

---

### P4-4 — Optimize `analyzeDeckIntent` (throttle on deck change)
**File:** `apps/web/app/forge/CardSearchPanel.tsx`
**Effort:** S (1.5 hrs)
**Score impact:** Performance +4

`analyzeDeckIntent` runs synchronously inside a `useMemo` that recalculates on every card add/remove. For a 50-card deck this is fine, but it's unnecessary to recalculate on every single keypress or card hover.

**Change:** Wrap the analyze call in a `useDebounce`:
```tsx
const debouncedDeckCards = useDebounce(currentDeckCards, 300);
const deckAnalysis = useMemo(() => analyzeDeckIntent(debouncedDeckCards ?? []), [debouncedDeckCards]);
```

This reduces analysis frequency from every state update to maximum once per 300ms of idle.

---

### P4-5 — Add loading skeleton to Explore/Community deck grid
**File:** `apps/web/app/community/CommunityClient.tsx`
**Effort:** S (2 hrs)
**Score impact:** UX +3

When `isFetching` is true, show a skeleton grid instead of just a spinner + count text.

```tsx
// DeckCardSkeleton:
function DeckCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-surface-elevated overflow-hidden">
      <div className="aspect-video bg-steel-800" />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded bg-steel-700 w-2/3" />
        <div className="h-2.5 rounded bg-steel-800 w-1/2" />
      </div>
    </div>
  );
}

// In render:
{isFetching && decks.length === 0 ? (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => <DeckCardSkeleton key={i} />)}
  </div>
) : (
  // normal deck grid
)}
```

---

### P4-6 — Add "Copy share link" to DeckPreviewCard context menu
**File:** `apps/web/components/deck/DeckPreviewCard.tsx` + `CommunityClient.tsx`
**Effort:** M (2.5 hrs)
**Score impact:** Feature Completeness +3

Implement the `onMenu` handler that was wired to `() => {}` in Explore.

The popover should contain:
1. "Copy link" → copies `/decks/[id]` absolute URL to clipboard
2. "Clone deck" → copies the deck to localStorage and opens in Forge

```tsx
// In CommunityClient:
onMenu={() => {
  setMenuDeck(deck);
  setMenuOpen(true);
}}

// DeckContextMenu popover:
<Popover open={menuOpen && menuDeck?.id === deck.id} onOpenChange={setMenuOpen}>
  <button onClick={() => { navigator.clipboard.writeText(`${location.origin}/decks/${deck.id}`); }}>
    <LinkIcon className="h-3.5 w-3.5 mr-2" /> Copy link
  </button>
  <button onClick={() => cloneDeckToLocalStorage(deck)}>
    <Copy className="h-3.5 w-3.5 mr-2" /> Clone deck
  </button>
</Popover>
```

---

### P4-7 — Playtester: add Game Over modal
**File:** `apps/web/components/playtest/PlaytestGameEnhanced.tsx`
**Effort:** M (3 hrs)
**Score impact:** Feature Completeness +3, UX +2

The current playtester has no win/loss detection UI. When a base's health reaches 0, the game should show a clear "Victory" or "Defeat" modal.

```tsx
// Game Over Modal:
{gameState.winner && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="rounded-xl border border-border bg-surface-elevated p-8 text-center shadow-2xl">
      <p className="text-5xl mb-4">{gameState.winner === 'player' ? '🏆' : '💀'}</p>
      <h2 className="font-display text-3xl font-bold text-foreground mb-2">
        {gameState.winner === 'player' ? 'Victory' : 'Defeat'}
      </h2>
      <p className="text-sm text-steel-600 mb-6">
        {gameState.winner === 'player' ? 'Your base survived.' : 'Your base was destroyed.'}
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="primary" onClick={handleRematch}>Rematch</Button>
        <Button variant="secondary" asChild>
          <Link href="/community">Back to decks</Link>
        </Button>
      </div>
    </div>
  </div>
)}
```

---

### P4-8 — Add global search to Cards page (keyboard shortcut)
**File:** `apps/web/app/cards/CardsClient.tsx`
**Effort:** S (1 hr)
**Score impact:** UX +2, A11y +2

Add a keyboard shortcut to focus the search input:
```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.key === '/' || (e.metaKey && e.key === 'k')) && !e.target?.matches('input, textarea')) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

Show a `<kbd>/</kbd>` or `<kbd>⌘K</kbd>` hint in the search placeholder: `placeholder="Search cards… (press / to focus)"`.

---

### P4-9 — Memoize card filter in CardSearchPanel
**File:** `apps/web/app/forge/CardSearchPanel.tsx`
**Effort:** S (1 hr)
**Score impact:** Performance +3

The `mechanicsPackages` array used in the filter `useMemo` changes identity on every render because it's likely a new array literal or computed in the render function. Use `useRef` or stable memo to prevent unnecessary filter recalculations:

```tsx
// Stabilize mechanicsPackages with deep comparison:
const stableMechanicsPackages = useDeepMemo(() => mechanicsPackages, [JSON.stringify(mechanicsPackages)]);
```

Or inline a simpler fix: ensure `mechanicsPackages` is defined outside the component or memoized with `useMemo(() => [...], [intentColors.join(',')])`.

---

### P4-10 — Add "Keyboard shortcuts" reference to Forge
**File:** `apps/web/app/forge/DeckBuilderToolbar.tsx` or toolbar area
**Effort:** S (1.5 hrs)
**Score impact:** UX +2, A11y +2

The playtester has a keyboard shortcuts legend. The Forge should too.

Add a `<kbd>?</kbd>` icon button in the Forge toolbar that opens a compact shortcuts modal:

| Key | Action |
|---|---|
| `/` | Focus search |
| `Escape` | Close modal / clear search |
| `↑↓` | Navigate card results |
| `Enter` | Add focused card to deck |
| `Ctrl+S` | Export deck |

---

### Phase 4 Definition of Done

- [ ] Forge search panel is a bottom drawer on mobile
- [ ] Phase indicator progress bar visible in playtester
- [ ] All card images use blur-up lazy load (CardArtImage)
- [ ] `analyzeDeckIntent` is debounced — not recalculating on every keystroke
- [ ] Community deck grid shows skeleton on load
- [ ] DeckPreviewCard `onMenu` opens real context menu with "Copy link" and "Clone"
- [ ] Playtester shows "Victory" / "Defeat" modal when base HP reaches 0
- [ ] Cards page search focuses on `/` keypress with keyboard hint in placeholder
- [ ] CardSearchPanel filter memo is stable (no identity churn on mechanicsPackages)
- [ ] Forge toolbar has `?` shortcuts reference modal

---

## Full Score Projection

| Phase | Trust | Features | IA | UX | Mobile | A11y | Perf | Components | UI | DS | **Avg** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Baseline | 31 | 38 | 48 | 54 | 56 | 62 | 58 | 66 | 71 | 78 | **52** |
| After P1 | 62 | 42 | 48 | 61 | 58 | 65 | 59 | 72 | 73 | 78 | **62** (avg of 10 dims) |
| After P2 | 68 | 52 | 78 | 72 | 64 | 66 | 62 | 78 | 76 | 82 | **70** |
| After P3 | 76 | 74 | 80 | 80 | 68 | 83 | 76 | 84 | 82 | 88 | **79** |
| After P4 | 88 | 80 | 82 | 85 | 84 | 87 | 85 | 87 | 88 | 90 | **86** |

**Final projected score: 86 / 100 = 8.6 / 10** ✓ (Exceeds the 8.5 target)

---

## Effort Summary

| Phase | Tasks | Total Est. Effort |
|---|---|---|
| Phase 1 | 9 items | ~3–5 days |
| Phase 2 | 11 items | ~8–12 days |
| Phase 3 | 12 items | ~15–20 days |
| Phase 4 | 10 items | ~8–12 days |
| **Total** | **42 items** | **5–8 weeks** |

---

## Quick Reference: Most Impactful Items (Pareto)

The following 12 items represent ~80% of the total score gain. If bandwidth is limited, doing only these will get the platform to **~78–80/100**:

| # | Item | Score Impact | Effort |
|---|---|---|---|
| 1 | Remove "Sign in" button (P1-1) | Trust +18 | S |
| 2 | Virtualize cards grid (P3-1) | Perf +10 | L |
| 3 | Community page with My Decks tab (P2-2) | IA +10, UX +8 | L |
| 4 | Touch targets 44px (P3-7) | A11y +10 | L |
| 5 | Nav restructure to 5 items (P2-1) | IA +12 | S |
| 6 | Fix GridView builder controls (P2-3) | Components +8 | M |
| 7 | Zone separation in Forge (P2-4) | Features +8 | L |
| 8 | Resource deck builder in Forge (P3-5) | Features +8 | XL |
| 9 | Add save confirmation toast (P1-3) | UX +5, Trust +4 | M |
| 10 | Mobile Forge bottom drawer (P4-1) | Mobile +8 | L |
| 11 | Playtester alpha banner (P1-4) | Trust +8 | S |
| 12 | Share Deck URL feature (P2-7) | Features +6, Trust +5 | M |
