# 5. Quality

[← Key decisions](04-decisions.md) · Next: [Challenges and lessons →](06-challenges-and-lessons.md)

## What's checked

| Check | Result | How to run it |
|---|---|---|
| Unit and component tests (Vitest) | 257 tests in 27 files: 253 pass, 4 skipped (Nov 2026) | `npm test` |
| Type-check | Clean in `apps/web` | `npx tsc --noEmit -p apps/web` |
| Lint | Clean across workspaces | `npm run lint` |
| Production build | Static export succeeds | `npm run qa` |
| Card data | Catalog validation and audit scripts | `npm run validate-cards` |

The shared rules engine is where tests matter most. `packages/shared` tests `validateDeck()` and the game engines directly, so the builder, the playtester and the API all rely on tested logic rather than each re-implementing the rules.

## Continuous integration

The deploy workflow (`.github/workflows/deploy.yml`) runs lint, type-check and the production build on every push to `main`, then checks the exported files before publishing.

**Known gap:** CI doesn't run the test suite yet. It's first on the engineering list in [What's next](06-challenges-and-lessons.md#whats-next).

## Accessibility

**Built in:**
- The deck count bar is a live region (`role="status"`), so counts are announced.
- `prefers-reduced-motion` turns off animation site-wide.
- The `Button` component enforces a 44 px minimum height.
- Playtester controls have real `aria-label`s instead of emoji-only labels, and its error toast is a static `role="alert"` that doesn't pulse (`58e3ef6`).

**Measured gaps (computed contrast, WCAG 2.x):**

| Finding | Measure |
|---|---|
| Primary button label: white on cobalt-500 | 3.68:1. Below 4.5:1; cobalt-600 would give 5.2:1. |
| Warning text in the Issues sheet | 2.8:1 |
| The 49/50 and 0/10 counters before they turn green | 3.5:1 |
| Playtest's disabled reason is only in a `title` tooltip | Not reachable by keyboard or touch |

These are documented rather than hidden. Passing automated checks would not make the app accessible; these numbers came from measuring the rendered colours.

## Other known gaps

- **Autosave race:** on first load, the autosave effect writes an empty deck before the stored one loads. It shows up under React's development double-mount.
- **Hard-coded home counters:** the player, submission and win-rate numbers on the home page are placeholders, not real data. They should be removed or connected to real data.
- **Token drift:** the design-system package and `globals.css` disagree (see [Design](02-design.md#token-history)).
- **Validation messages** sometimes name card IDs instead of card names.
