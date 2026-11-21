# 2. Design

[← Overview](01-overview.md) · Next: [Architecture →](03-architecture.md)

## Visual identity

The first version borrowed the official game site's look. The same day (Feb 22, 2026, 1:28 pm → 6:09 pm; commits `0ca9e10` → `dbd6fc2`), I replaced it with Gundam Forge's own branding. An unofficial tool shouldn't look like the official product.

| Element | Choice |
|---|---|
| Display type | Orbitron (500–700, uppercase, +0.06em): the wordmark, page titles, big numbers |
| Interface type | Exo 2 (400–700): everything people read |
| Data type | JetBrains Mono with tabular figures: counts, card numbers, labels |
| Surfaces | Panel levels in `globals.css`. Levels 1 and 2 are in use; level 3 is defined but not used yet. |
| Card shape | Cards keep the game's 5:7 ratio at every size; grid widths step 140 → 160 → 180 px by breakpoint |
| Motion | Duration tokens from 80 ms (presses) and 140 ms (hovers); `prefers-reduced-motion` drops every animation to near zero, site-wide |

### Token history

- **Feb 25:** v2 visual reset (`75e44a0`)
- **Mar 3:** token audit, with 30+ hard-coded values replaced across 10 files (`5341506`, `8b274a4`)
- **Mar 4:** semantic text tokens (`fc230da`)

**Known gap:** the hex values in `packages/design-system/src/tokens.ts` drift from the CSS variables the app actually renders in `apps/web/app/globals.css`, and the package tokens aren't imported. The CSS is the source of truth today. The fix is structural: generate the CSS from one source.

## Designing the decision

The interface follows four principles.

**1. Count in the open.** Main and resource counts sit above the deck as progress chips that turn green at 50 and 10. The bar is a live region (`role="status"`), so the count is always a glance, or a screen-reader announcement, away.

**2. Rules block outcomes, not edits.** You can build an invalid deck. You can't playtest one: the Playtest button waits for a valid deck, and the playtester refuses an invalid one and lists the issues.

**3. Advice never looks like a rule.** Errors and warnings are separate lists from the validator to the screen. Errors are red and make the deck invalid. Warnings are amber and don't.

**4. Removal is reversible.** Taking a card out shows "Removed <card>" with Undo for five seconds, so the fast path doesn't punish a slip.

## How the builder changed

| Date | Change | Why |
|---|---|---|
| Feb 26 | Create → Build → View workflow; the "Format" field removed | It was borrowed from Magic deck builders and didn't match how Gundam decks are built (`ebe0950`) |
| Mar 2 | Double-click to add → a visible **+** button on every card | Double-click is invisible and doesn't exist on touch screens (`054583d`) |
| Mar 2 | Carousel → a scrolling grid | Four cards per slide hid the catalog behind pagination (`5ffce42`) |
| Mar 2 | Advanced filters collapsed by default, with an active-count label | Cards are visible on load instead of 300 px of filters (`e55a7dd`) |
| Mar 8 | Meta-archetype sidebar removed from the builder | It didn't help build a deck and crowded the one being built (`64d4420`) |
| Apr 12 | Card-detail redesign shipped, then reverted the same day | The layout that stayed shows the rules text at full contrast (`97d7c34` → `b4cebd5` → `e4a8e43`) |

## Small screens

On phones, the card dialog was centred on `100vh` and got cut off below the browser bar. It's now anchored on `svh` units (`260138a`, PR #6). Deck issues open in their own sheet. The `Button` component sets a 44 px minimum height at every size; smaller hand-rolled controls, like the Issues pill, don't use it yet.
